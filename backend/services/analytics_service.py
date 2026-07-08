#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/services/analytics_service.py
from __future__ import annotations

from sqlalchemy import func, select

from core.cache import cache_get, cache_set
from db.models import Complaint


class AnalyticsService:
    def __init__(self, db):
        self.db = db

    async def hotspots(self, hours_back: int = 24) -> list[dict]:
        cache_key = f"hotspots:{hours_back}"
        cached = await cache_get(cache_key)
        if cached:
            return cached

        time_bucket = func.date_trunc("hour", Complaint.submitted_at)

        stmt = (
            select(
                Complaint.category,
                Complaint.area,
                time_bucket.label("time_bucket"),
                func.count(Complaint.id).label("complaint_count"),
                func.sum(func.cast(Complaint.is_urgent, type_=func.count(Complaint.id).type)).label("urgent_count"),
                func.avg(Complaint.priority_score).label("avg_priority_score"),
            )
            .where(Complaint.submitted_at >= func.now() - func.make_interval(0, 0, 0, 0, hours_back))
            .group_by(Complaint.category, Complaint.area, time_bucket)
            .order_by(func.count(Complaint.id).desc())
        )

        rows = (await self.db.execute(stmt)).all()

        buckets = [
            {
                "category": r.category.value if r.category else "Other",
                "area": r.area,
                "time_bucket": r.time_bucket.isoformat(),
                "complaint_count": r.complaint_count,
                "urgent_count": int(r.urgent_count or 0),
                "avg_priority_score": round(float(r.avg_priority_score or 0), 1),
            }
            for r in rows
        ]
        await cache_set(cache_key, buckets, ttl=60)
        return buckets
