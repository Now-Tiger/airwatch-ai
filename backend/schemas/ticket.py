#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/schemas/ticket.py
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, field_validator


class TicketOut(BaseModel):

    id: str
    complaint_id: str
    status: str
    priority_tier: str | None = None
    category: str | None = None
    current_tier: int
    assigned_officer_name: str | None = None
    assigned_officer_contact: str | None = None
    sla_deadline: datetime
    created_at: datetime

    @field_validator(
        "id",
        "complaint_id",
        "status",
        "priority_tier",
        "category",
        mode="before",
    )
    @classmethod
    def coerce_to_string(cls, value: Any) -> Any:
        """
        Safely converts UUID objects and SQLAlchemy Enum descriptors into standard strings
        to satisfy Pydantic v2 strict type validation during from_attributes conversion.
        """
        if value is not None:
            return getattr(value, "value", str(value))
        return value

    class Config:
        from_attributes = True


class TicketStatusUpdate(BaseModel):

    status: str  # "In Progress" | "Closed"
    actor: str = "manual_reviewer"


class SlaCheckResult(BaseModel):

    escalated_count: int
    checked_at: datetime
