#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/schemas/analytics.py
from __future__ import annotations

from pydantic import BaseModel


class HotspotResponse(BaseModel):

    summary: SummaryStats
    top_hotspots: list[HotspotArea]
    category_breakdown: list[CategoryBreakdown]
    timeline: list[TimelineBucket]
    generated_at: str


class SummaryStats(BaseModel):

    total_complaints: int
    urgent_complaints: int
    avg_priority_score: float


class HotspotArea(BaseModel):

    area: str
    complaints: int
    urgent: int
    lat: float
    lng: float


class CategoryBreakdown(BaseModel):

    category: str
    complaints: int


class TimelineBucket(BaseModel):

    time_bucket: str
    complaints: int
    urgent: int
