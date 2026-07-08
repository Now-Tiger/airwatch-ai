#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/api/routers/admin.py
from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter

from api.deps import DbSession
from schemas.response import Envelope
from schemas.ticket import SlaCheckResult
from services.ticket_service import TicketService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/sla/check", response_model=Envelope[SlaCheckResult])
async def run_sla_check(db: DbSession):
    service = TicketService(db)
    count = await service.run_sla_check()
    _ = await db.commit()
    return Envelope(success=True, data=SlaCheckResult(escalated_count=count, checked_at=datetime.now(timezone.utc)))
