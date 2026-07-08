#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/services/dedup_service.py
from __future__ import annotations

import uuid
from datetime import timedelta
from dataclasses import dataclass

from geoalchemy2.functions import ST_DWithin
from sqlalchemy import select, and_, update

from core.config import settings
from db.models import Complaint


@dataclass
class DedupResult:
    """
    Structured data container capturing the result of a complaint deduplication check.
    """
    is_duplicate: bool
    parent_id: uuid.UUID | None
    corroboration_count: int | None


class DedupService:
    """
    Service layer handling spatio-temporal deduplication logic for incoming citizen grievances.

    Identifies if a new complaint matches an ongoing, unlinked root incident within a 
    configured spatial radius and time window to prevent redundant ticket dispatching.
    """

    def __init__(self, db):
        """
        Initializes the DedupService with an asynchronous database session.
        """
        self.db = db

    async def find_and_link(self, complaint: Complaint) -> DedupResult:
        """
        Scan historical records for an active root parent and increment its corroboration weight.

        Performs an optimized PostGIS spatial lookup alongside temporal filtering constraints.
        """
        # Calculate dynamic temporal boundary window based on environment configurations
        window_start = complaint.submitted_at - timedelta(minutes=settings.DEDUP_WINDOW_MINUTES)

        # Build compound query searching for proximate, categorized root-level incidents
        stmt = (
            select(Complaint)
            .where(
                and_(
                    Complaint.id != complaint.id,
                    Complaint.category == complaint.category,
                    Complaint.parent_complaint_id.is_(None),  # Restrict evaluation to root/parent nodes
                    Complaint.submitted_at >= window_start,
                    Complaint.submitted_at <= complaint.submitted_at,
                    # Geospatial execution utilizing spatial indexing filters
                    ST_DWithin(Complaint.geo_point, complaint.geo_point, settings.DEDUP_RADIUS_METERS),
                )
            )
            .order_by(Complaint.submitted_at.asc())
            .limit(1)
        )

        result = await self.db.execute(stmt)
        candidate = result.scalar_one_or_none()

        # Exit early as a unique incident if no spatial match passes thresholds
        if candidate is None:
            return DedupResult(is_duplicate=False, parent_id=None, corroboration_count=None)

        # Link child record to the identified parent root node
        complaint.parent_complaint_id = candidate.id

        # Atomic structural increment of parent corroboration telemetry counters
        await self.db.execute(
            update(Complaint)
            .where(Complaint.id == candidate.id)
            .values(corroboration_count=Complaint.corroboration_count + 1))
        await self.db.flush()
        await self.db.refresh(candidate)

        return DedupResult(
            is_duplicate=True,
            parent_id=candidate.id,
            corroboration_count=candidate.corroboration_count,
        )
