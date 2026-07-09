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

    async def hotspots(self, hours_back: int = 24):
        cache_key = f"hotspots:{hours_back}"
        cached = await cache_get(cache_key)
        if cached:
            return cached

        start_time = func.now() - func.make_interval(0, 0, 0, 0, hours_back)

        # Summary
        summary_stmt = (
            select(
                func.count(Complaint.id),
                func.sum(func.cast(Complaint.is_urgent, type_=func.count().type)),
                func.avg(Complaint.priority_score),
            )
            .where(Complaint.submitted_at >= start_time)
        )

        summary = (await self.db.execute(summary_stmt)).one()

        # Top hotspots
        hotspot_stmt = (
            select(
                Complaint.area,
                func.count(Complaint.id).label("count"),
                func.sum(func.cast(Complaint.is_urgent, type_=func.count().type)).label("urgent"),
            )
            .where(Complaint.submitted_at >= start_time)
            .group_by(Complaint.area)
            .order_by(func.count(Complaint.id).desc())
            .limit(10)
        )

        hotspots = (await self.db.execute(hotspot_stmt)).all()

        # Category breakdown
        category_stmt = (
            select(Complaint.category, func.count(Complaint.id))
            .where(Complaint.submitted_at >= start_time)
            .group_by(Complaint.category)
            .order_by(func.count(Complaint.id).desc())
        )

        categories = (await self.db.execute(category_stmt)).all()

        # Timeline
        bucket = func.date_trunc("hour", Complaint.submitted_at)
        timeline_stmt = (
            select(
                bucket.label("bucket"),
                func.count(Complaint.id),
                func.sum(func.cast(Complaint.is_urgent, type_=func.count().type)),
            )
            .where(Complaint.submitted_at >= start_time)
            .group_by(bucket)
            .order_by(bucket)
        )

        timeline = (await self.db.execute(timeline_stmt)).all()

        result = {
            "summary": {
                "total_complaints": summary[0] or 0,
                "urgent_complaints": int(summary[1] or 0),
                "avg_priority_score": round(float(summary[2] or 0), 1),
            },
            "top_hotspots": [
                {
                    "area": r.area,
                    "complaints": r.count,
                    "urgent": int(r.urgent or 0),
                }
                for r in hotspots
            ],
            "category_breakdown": [
                {
                    "category": r.category.value if r.category else "Other",
                    "complaints": r[1],
                }
                for r in categories
            ],
            "timeline": [
                {
                    "time_bucket": r.bucket.isoformat(),
                    "complaints": r[1],
                    "urgent": int(r[2] or 0),
                }
                for r in timeline
            ],
        }

        await cache_set(cache_key, result, ttl=60)

        return result
