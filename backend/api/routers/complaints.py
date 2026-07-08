#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/routers/complaints.py
from __future__ import annotations

from fastapi import APIRouter

from api.deps import DbSession
from schemas.complaint import ComplaintIn, ComplaintOut
from schemas.response import Envelope
from services.complaint_service import ComplaintService

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.post("", response_model=Envelope[ComplaintOut], status_code=201)
async def create_complaint(payload: ComplaintIn, db: DbSession):
    """
    Ingest raw citizen grievances across channels and pass them to the AI processing pipeline.
    """
    service = ComplaintService(db)

    # Delegate multi-lingual extraction, deduplication, and scoring to the service pipeline
    result = await service.ingest(payload)

    return Envelope(success=True, data=result)
