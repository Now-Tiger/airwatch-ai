#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/schemas/analytics.py
from __future__ import annotations

from pydantic import BaseModel


class HotspotBucket(BaseModel):

    category: str
    area: str | None
    time_bucket: str  # ISO-truncated hour, e.g. "2026-07-07T10:00:00"
    complaint_count: int
    urgent_count: int
    avg_priority_score: float


class HotspotResponse(BaseModel):

    buckets: list[HotspotBucket]
    generated_at: str
