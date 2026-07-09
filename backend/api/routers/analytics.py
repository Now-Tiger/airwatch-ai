#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/api/routers/analytics.py
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Query

from api.deps import DbSession
from schemas.analytics import HotspotResponse
from schemas.response import Envelope
from services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/hotspots", response_model=Envelope[HotspotResponse])
async def get_hotspots(db: DbSession, hours_back: int = Query(24, ge=1, le=168)):
    service   = AnalyticsService(db)
    analytics = await service.hotspots(hours_back)
    return Envelope(success=True, data=HotspotResponse(**analytics, generated_at=datetime.now(timezone.utc).isoformat()))
