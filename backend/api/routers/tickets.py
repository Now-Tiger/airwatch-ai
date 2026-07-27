#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/routers/complaints.py
from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from api.deps import DbSession
from core.exceptions import NotFoundError
from db.models import Ticket
from schemas.response import Envelope
from schemas.ticket import TicketOut, TicketStatusUpdate
from services.ticket_service import TicketService, ticket_event_generator

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("", response_model=Envelope[list[TicketOut]])
async def list_tickets(db: DbSession):
    """
    Fetch all grievance tickets sorted chronologically by creation date.
    """
    result  = await db.execute(select(Ticket).order_by(Ticket.created_at.desc()))
    tickets = result.scalars().all()

    # Serialize database records into structured response schemas
    return Envelope(success=True, data=[TicketOut.model_validate(t) for t in tickets])


@router.patch("/{ticket_id}/status", response_model=Envelope[TicketOut])
async def update_ticket_status(ticket_id: str, payload: TicketStatusUpdate, db: DbSession):
    """
    Manually modify a ticket's operational status and log the action via the audit service.
    """
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise NotFoundError("Ticket not found")

    # Delegate core status modification and immutable auditing to the service layer
    service = TicketService(db)
    await service.update_status(ticket, payload.status, payload.actor)

    # FIXED: Use flush() instead of commit() to respect the DbSession transaction manager
    await db.flush()
    await db.refresh(ticket)

    return Envelope(success=True, data=TicketOut.model_validate(ticket))


@router.post("/{ticket_id}/escalate", response_model=Envelope[TicketOut])
async def escalate_ticket_new(ticket_id: str, db: DbSession) -> Envelope:
    """
    Manually escalates a ticket to the next configured escalation tier and reassigns it
    to the appropriate officer. Returns the updated escalation details on success.
    """
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise NotFoundError('Ticket not found')

    service = TicketService(db)
    _ = await service.escalate(ticket)

    await db.flush()
    await db.refresh(ticket)

    return Envelope(success=True, data=TicketOut.model_validate(ticket))


@router.get('/stream', status_code=202)
async def stream_tickets(request: Request):
    """
    The endpoint React connects to via `new EventSource('/api/tickets/stream')`
    """

    return StreamingResponse(
        ticket_event_generator(request),
        media_type="text/event-stream",
        # Cache control headers are essential for SSE to prevent proxies from buffering
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no" # Turns off buffering in NGINX
        }
    )

