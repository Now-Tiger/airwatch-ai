#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# worker/tasks/sla.py
from __future__ import annotations

from celery import Task

from db.base import SessionLocal
from db.models import Category, PriorityTier
from main import app


def _run_pipeline(complaint_id: str) -> None:
    """
    Execute the complete AI enrichment pipeline for a single complaint.

    Processing flow:
        1. Load complaint from the database.
        2. Run AI classification.
        3. Persist AI metadata.
        4. Perform duplicate detection.
        5. Create an SLA ticket for eligible complaints.
        6. Commit all changes as a single transaction.

    Raises:
        Any exception is propagated to Celery so that the task
        can be retried automatically.
    """
    from ai.pipeline import ComplaintAIPipeline
    from db.models import Complaint, ProcessingStatus
    from services.dedup_service import DedupService
    from services.ticket_service import TicketService

    with SessionLocal() as db:
        complaint = db.get(Complaint, complaint_id)
        if complaint is None:
            return

        pipeline  = ComplaintAIPipeline()
        ai_result = pipeline.process(complaint.raw_text, meta={"channel": complaint.channel.value, "area": complaint.area})

        complaint.category = Category(ai_result.category) if ai_result.category else None
        complaint.priority_score = ai_result.priority_score
        complaint.priority_tier  = PriorityTier(ai_result.priority_tier) if ai_result.priority_tier else None
        complaint.is_urgent = ai_result.is_urgent
        complaint.sentiment_label = ai_result.sentiment_label
        complaint.entities  = ai_result.entities
        complaint.ai_source = ai_result.source
        complaint.processing_status = (ProcessingStatus.processed_llm if ai_result.source == "llm" else ProcessingStatus.processed_fallback)

        dedup = DedupService(db)
        dedup_result = dedup.find_and_link(complaint)

        if not dedup_result.is_duplicate and complaint.priority_tier in (PriorityTier.p1, PriorityTier.p2):
            tickets = TicketService(db)
            tickets.create_for_complaint(complaint)

        _ = db.commit()

        return


@app.task(name="tasks.ai_tasks.run_ai_pipeline", bind=True, max_retries=3, default_retry_delay=5)
async def run_ai_pipeline(self: Task, complaint_id: str) -> None:
    """
    Celery entry point for asynchronous complaint processing.

    Any unexpected exception is retried according to the task's retry
    configuration before finally being marked as failed.
    """
    try:
        _run_pipeline(complaint_id)
    except Exception as exc:
        raise self.retry(exc=exc)
