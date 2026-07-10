#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/schemas/response.py
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator

from db.models import Channel


class LocationIn(BaseModel):

    lat: float
    lng: float
    area: Optional[str] = None


class ComplaintIn(BaseModel):

    text: str = Field(..., min_length=3, max_length=4000)
    location: LocationIn
    photo_url: Optional[str] = None
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
    raw_text: Optional[str]  = None
    ai_source: Optional[str] = None
    ai_raw_response: Optional[str | dict] = None

    category: Optional[str] = None
    sub_category: Optional[str]   = None
    priority_score: Optional[int] = None
    priority_tier: Optional[str]  = None
    is_urgent: bool = False
    sentiment_label: Optional[str] = None 

    processing_status: str

    is_duplicate: bool = False
    parent_complaint_id: Optional[str] = None
    corroboration_count: Optional[int] = None
    ticket_id: Optional[str] = None

    entities: Optional[dict] = None

    @field_validator(
        "id",
        "category",
        "sub_category",
        "priority_tier",
        "parent_complaint_id",
        "corroboration_count",
        "ticket_id",
        mode="before",
    )
    @classmethod
    def coerce_to_string(cls, value: Any) -> Any:
        """
        Safely converts UUID objects and SQLAlchemy Enum descriptors into standard strings
        to satisfy Pydantic v2 strict type validation during from_attributes conversion.
        """
        if value is None:
            return None
        return getattr(value, "value", str(value))

    class Config:
        from_attributes = True


class ComplaintAsyncOut(BaseModel):

    id: str
    processing_status: str
    task_id: str
    message: str = "Complaint received. AI processing enqueued."
