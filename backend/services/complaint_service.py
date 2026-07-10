#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/services/complaint_service.py
from __future__ import annotations

import asyncio
import uuid

from geoalchemy2.functions import ST_MakePoint, ST_SetSRID
from loguru import logger

from ai.pipeline import ComplaintAIPipeline
from core.config import settings
from core.exceptions import AIServiceUnavailable, NotFoundError
from core.logging import setup_logging
from core.security import sanitize_text, validate_coordinates
from db.models import Category, Complaint, PriorityTier, ProcessingStatus
from db.session import DbSession
from schemas.complaint import ComplaintAsyncOut, ComplaintIn, ComplaintOut
from services.dedup_service import DedupService
from services.ticket_service import TicketService
from workers.ai_tasks import enqueue_ai_pipeline


# Init logger
_ = setup_logging()


class ComplaintService:
    """
    The central orchestration coordinator governing the intake lifecycle of grievances.
    
    Wires input sanitization, spatial conversions, AI feature extraction pipelines, 
    spatio-temporal deduplication checks, and automated ticket escalation creation paths 
    into a single atomicity boundary.
    """

    def __init__(self, db: DbSession):
        """
        Initialize the service layer with required database dependencies and domain handlers.
        """
        self.db = db
        self.pipeline = ComplaintAIPipeline()
        self.dedup    = DedupService(db)
        self.tickets  = TicketService(db)

    async def ingest(self, payload: ComplaintIn) -> ComplaintOut:
        """
        Process a raw citizen grievance from ingestion to storage and ticketing.

        Applies input validation boundaries, triggers the swappable AI pipeline with strict 
        timeout bounds, resolves incident linkages, and spins up priority tracking tickets.
        """
        validate_coordinates(payload.location.lat, payload.location.lng)
        clean_text = sanitize_text(payload.text)

        # Initialize core entity mapping coordinates into PostGIS geography points
        complaint = Complaint(
            id=uuid.uuid4(),
            raw_text=clean_text,
            channel=payload.channel,
            photo_url=payload.photo_url,
            area=payload.location.area,
            lat=payload.location.lat,
            lng=payload.location.lng,
            geo_point=ST_SetSRID(ST_MakePoint(payload.location.lng, payload.location.lat), 4326),
            submitted_at=payload.submitted_at,
            processing_status=ProcessingStatus.pending,
        )
        self.db.add(complaint)
        await self.db.flush()  # Extract structural ID keys safely prior to execution commits

        # Explicitly refresh the object asynchronously so database-generated values 
        # are loaded into Python memory safely.
        await self.db.refresh(complaint)

        # --- AI enrichment with hard timeout boundaries ---
        try:
            # Shield main request loop from network-bound LLM latency spikes
            ai_result = await asyncio.wait_for(
                self.pipeline.process(
                    clean_text,
                    meta={
                        "channel": payload.channel.value,
                        "area": payload.location.area,
                    }
                ),
                timeout=settings.AI_TIMEOUT_SECONDS,
            )

            complaint.category = Category(ai_result.category) if ai_result.category else None
            complaint.sub_category = ai_result.sub_category
            complaint.priority_score = ai_result.priority_score
            complaint.priority_tier  = PriorityTier(ai_result.priority_tier) if ai_result.priority_tier else None
            complaint.is_urgent = ai_result.is_urgent
            complaint.sentiment_label = ai_result.sentiment_label
            complaint.entities  = ai_result.entities
            complaint.ai_source = ai_result.source
            complaint.ai_raw_response   = ai_result.raw
            complaint.processing_status = ProcessingStatus.processed_llm if ai_result.source == "llm" else ProcessingStatus.processed_fallback

        except (AIServiceUnavailable, asyncio.TimeoutError) as exc:
            # Hard fallback path mapping rule-based logic locally to maintain high availability
            logger.warning("AI unavailable. Falling back to rule classifier.", exc_info=True)
            from ai.rule_classifier import RuleBasedClassifier

            fallback  = RuleBasedClassifier()
            ai_result = await fallback.full_process(clean_text, meta={"channel": payload.channel.value, "area": payload.location.area})

            # Explicitly convert raw strings to Enums here as well
            complaint.category = Category(ai_result.category) if ai_result.category else None
            complaint.sub_category = ai_result.sub_category
            complaint.priority_score = ai_result.priority_score
            complaint.priority_tier  = PriorityTier(ai_result.priority_tier) if ai_result.priority_tier else None
            complaint.is_urgent = ai_result.is_urgent
            complaint.sentiment_label = ai_result.sentiment_label
            complaint.entities  = ai_result.entities
            complaint.ai_source = "rule_fallback"
            complaint.ai_raw_response   = {'fallback': True, 'error': str(exc)}
            complaint.processing_status = ProcessingStatus.processed_fallback

        # --- Spatio-temporal deduplication routing check ---
        dedup_result = await self.dedup.find_and_link(complaint)

        ticket_id = None
        # Auto-ticket dispatch rules: must be a unique root incident and clear priority thresholds
        if not dedup_result.is_duplicate and complaint.priority_tier in ("P1", "P2"):
            ticket = await self.tickets.create_for_complaint(complaint)
            ticket_id = str(ticket.id)

        # Extracting descriptors into local variables guarantees Pyright's type-narrowing works
        current_category = complaint.category
        current_tier = complaint.priority_tier

        return ComplaintOut(
            id=str(complaint.id),
            category=current_category.value if current_category else None,
            sub_category=complaint.sub_category,
            priority_score=complaint.priority_score,
            priority_tier=current_tier.value if current_tier else None,
            is_urgent=complaint.is_urgent,
            sentiment_label=complaint.sentiment_label,
            entities=complaint.entities,
            ai_source=complaint.ai_source,
            ai_raw_response=complaint.ai_raw_response,
            processing_status=complaint.processing_status.value,
            is_duplicate=dedup_result.is_duplicate,
            parent_complaint_id=str(dedup_result.parent_id) if dedup_result.parent_id else None,
            corroboration_count=dedup_result.corroboration_count,
            ticket_id=ticket_id,
        )

    async def ingest_async(self, payload: ComplaintIn) -> ComplaintAsyncOut:
        """
        Persists the raw complaint only, then hands enrichment + dedup + ticketing
        off to the worker via RabbitMQ. Used by POST /complaints/async.
        """
        _ = validate_coordinates(payload.location.lat, payload.location.lng)
        clean_text = sanitize_text(payload.text)

        from utils.geo import make_geo_point

        complaint = Complaint(
            id=uuid.uuid4(),
            raw_text=clean_text,
            channel=payload.channel,
            photo_url=payload.photo_url,
            area=payload.location.area,
            lat=payload.location.lat,
            lng=payload.location.lng,
            geo_point=make_geo_point(payload.location.lat, payload.location.lng),
            submitted_at=payload.submitted_at,
            processing_status=ProcessingStatus.pending,
        )
        self.db.add(complaint)
        await self.db.commit()
        await self.db.refresh(complaint)

        task_id = enqueue_ai_pipeline(str(complaint.id))

        return ComplaintAsyncOut(
            id=str(complaint.id),
            processing_status=complaint.processing_status.value,
            task_id=task_id,
        )

    async def get_by_id(self, complaint_id: str) -> ComplaintOut:
        complaint = await self.db.get(Complaint, complaint_id)
        if complaint is None:
            raise NotFoundError("Complaint not found")

        ticket_id = None
        if complaint.ticket is not None:
            ticket_id = str(complaint.ticket.id)

        is_duplicate = complaint.parent_complaint_id is not None
        corroboration_count = None
        if is_duplicate:
            parent = await self.db.get(Complaint, complaint.parent_complaint_id)
            corroboration_count = parent.corroboration_count if parent else None
        elif complaint.corroboration_count > 1:
            corroboration_count = complaint.corroboration_count

        return ComplaintOut(
            id=str(complaint.id),
            category=complaint.category.value if complaint.category else None,
            sub_category=complaint.sub_category,
            priority_score=complaint.priority_score,
            priority_tier=complaint.priority_tier.value if complaint.priority_tier else None,
            is_urgent=complaint.is_urgent,
            sentiment_label=complaint.sentiment_label,
            entities=complaint.entities,
            ai_source=complaint.ai_source,
            processing_status=complaint.processing_status.value,
            is_duplicate=is_duplicate,
            parent_complaint_id=str(complaint.parent_complaint_id) if complaint.parent_complaint_id else None,
            corroboration_count=corroboration_count,
            ticket_id=ticket_id,
        )
