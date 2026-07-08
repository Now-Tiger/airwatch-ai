#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/schemas/response.py
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from db.models import Channel


class LocationIn(BaseModel):
    lat: float
    lng: float
    area: str | None = None


class ComplaintIn(BaseModel):
    text: str = Field(..., min_length=3, max_length=4000)
    location: LocationIn
    photo_url: str | None = None
    channel: Channel
    submitted_at: datetime

    @field_validator("text")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("text cannot be blank")
        return v


class ComplaintOut(BaseModel):
    id: str
    category: str | None
    sub_category: str | None
    priority_score: int | None
    priority_tier: str | None
    is_urgent: bool
    sentiment_label: str | None
    entities: dict | None
    ai_source: str | None
    processing_status: str
    is_duplicate: bool
    parent_complaint_id: str | None
    corroboration_count: int | None
    ticket_id: str | None

    class Config:
        from_attributes = True
