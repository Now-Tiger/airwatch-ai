#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# worker/db/models.py
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from geoalchemy2 import Geography
from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Channel(str, enum.Enum):
    app = "app"
    web = "web"
    social = "social"


class Category(str, enum.Enum):
    dust_cd = "Dust/C&D"
    industrial_emission = "Industrial Emission"
    vehicular = "Vehicular"
    open_burning = "Open Burning"
    noise = "Noise"
    water = "Water"
    other = "Other"


class ProcessingStatus(str, enum.Enum):
    pending = "pending"
    processed_llm = "processed_llm"
    processed_fallback = "processed_fallback"
    failed = "failed"


class TicketStatus(str, enum.Enum):
    open = "Open"
    in_progress = "In Progress"
    escalated = "Escalated"
    closed = "Closed"


class PriorityTier(str, enum.Enum):
    p1 = "P1"
    p2 = "P2"
    p3 = "P3"
    p4 = "P4"


def _uuid_pk():
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[uuid.UUID] = _uuid_pk()
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    channel: Mapped[Channel] = mapped_column(Enum(Channel, name="channel_enum"), nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    area: Mapped[str | None] = mapped_column(String, nullable=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    # Geography point, SRID 4326, used for fast ST_DWithin dedup queries.
    geo_point = mapped_column(Geography(geometry_type="POINT", srid=4326), nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # AI pipeline outputs
    category: Mapped[Category | None] = mapped_column(Enum(Category, name="category_enum"), nullable=True)
    sub_category: Mapped[str | None] = mapped_column(String, nullable=True)
    priority_score: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0-100
    priority_tier: Mapped[PriorityTier | None] = mapped_column(Enum(PriorityTier, name="priority_tier_enum"), nullable=True)
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    sentiment_label: Mapped[str | None] = mapped_column(String, nullable=True)  # distressed/neutral/angry...
    entities: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ai_source: Mapped[str | None] = mapped_column(String, nullable=True)        # "llm" | "rule_fallback"
    processing_status: Mapped[ProcessingStatus] = mapped_column(Enum(ProcessingStatus, name="processing_status_enum"), default=ProcessingStatus.pending)
    ai_raw_response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Dedup linkage
    parent_complaint_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("complaints.id"), nullable=True)
    corroboration_count: Mapped[int] = mapped_column(Integer, default=1)        # only meaningful on parent

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    ticket: Mapped["Ticket | None"] = relationship(back_populates="complaint", uselist=False)
    children: Mapped[list["Complaint"]] = relationship(remote_side=[id])


class EscalationMatrix(Base):
    __tablename__ = "escalation_matrix"

    id: Mapped[uuid.UUID] = _uuid_pk()
    category: Mapped[Category] = mapped_column(Enum(Category, name="category_enum"), nullable=False)
    tier: Mapped[int] = mapped_column(Integer, nullable=False)                  # 1 = first responder, 2 = supervisor, 3 = head
    officer_name: Mapped[str] = mapped_column(String, nullable=False)
    officer_contact: Mapped[str] = mapped_column(String, nullable=False)

    __table_args__ = ()


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = _uuid_pk()
    complaint_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("complaints.id"), unique=True)
    status: Mapped[TicketStatus] = mapped_column(Enum(TicketStatus, name="ticket_status_enum"), default=TicketStatus.open)
    priority_tier: Mapped[PriorityTier] = mapped_column(Enum(PriorityTier, name="priority_tier_enum"), nullable=False)
    category: Mapped[Category] = mapped_column(Enum(Category, name="category_enum"), nullable=False)
    current_tier: Mapped[int] = mapped_column(Integer, default=1)
    assigned_officer_name: Mapped[str | None] = mapped_column(String, nullable=True)
    assigned_officer_contact: Mapped[str | None] = mapped_column(String, nullable=True)

    sla_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sla_seconds: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    complaint: Mapped["Complaint"] = relationship(back_populates="ticket")
    audit_logs: Mapped[list["TicketAudit"]] = relationship(back_populates="ticket", order_by="TicketAudit.created_at")


class TicketAudit(Base):
    __tablename__ = "ticket_audit"

    id: Mapped[uuid.UUID] = _uuid_pk()
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id"), nullable=False)
    from_status: Mapped[str | None] = mapped_column(String, nullable=True)
    to_status: Mapped[str] = mapped_column(String, nullable=False)
    from_tier: Mapped[int | None] = mapped_column(Integer, nullable=True)
    to_tier: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reason: Mapped[str] = mapped_column(String, nullable=False)                 # e.g. "sla_breach", "manual", "created"
    actor: Mapped[str] = mapped_column(String, default="system")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    ticket: Mapped["Ticket"] = relationship(back_populates="audit_logs")
