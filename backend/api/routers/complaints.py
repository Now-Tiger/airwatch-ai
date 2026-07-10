#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/routers/complaints.py
from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from api.deps import DbSession
from db.models import Complaint
from schemas.complaint import ComplaintAsyncOut, ComplaintIn, ComplaintOut
from schemas.response import Envelope
from services.complaint_service import ComplaintService

router = APIRouter(prefix="/complaints", tags=["complaints"])


# NOTE: FIX THE DATA SERIALIZATION BUG BY DEFINING VALID OUTPUT
@router.get("/", response_model=Envelope[list[ComplaintOut]])
async def get_complaints(db: DbSession):
    """
    Fetch all complaints sorted chronologically by creation date.
    """
    # query  = select(Complaint).options(selectinload(Complaint.ticket)).order_by(Complaint.created_at.desc())
    query  = select(Complaint).order_by(Complaint.created_at.desc())
    result = await db.execute(query)
    complaints = result.scalars().all()

    # Serialize database records into structured response schemas
    return Envelope(success=True, data=[ComplaintOut.model_validate(c) for c in complaints])


@router.post("", response_model=Envelope[ComplaintOut], status_code=201)
async def create_complaint(payload: ComplaintIn, db: DbSession):
    """
    Ingest raw citizen grievances across channels and pass them to the AI processing pipeline.
    """
    service = ComplaintService(db)
    try:
        # Delegate multi-lingual extraction, deduplication, and scoring to the service pipeline
        result  = await service.ingest(payload)
        return Envelope(success=True, data=result)
    except Exception as exc:
        return Envelope(success=False, error=str(exc), data=None)


@router.post("/async", response_model=Envelope[ComplaintAsyncOut], status_code=202)
async def create_complaint_async(payload: ComplaintIn, db: DbSession):
    """
    Pass raw citizen complaint to the background worker to process by ai pipeline in async.
    """
    service = ComplaintService(db)
    try:
        # Delegate to message queue
        result  = await service.ingest_async(payload)
        # Return quick response
        return Envelope(success=True, data=result)
    except Exception as exc:
        return Envelope(success=False, error=str(exc), data=None)


@router.get("/{complaint_id}", response_model=Envelope[ComplaintOut])
async def get_complaint(complaint_id: str, db: DbSession) -> Envelope:
    """
    Retrieve a specific grievance complaint by its unique identifier.

    Queries the complaints table to fetch the comprehensive profile of an individual
    complaint. Captures structural lookup errors gracefully if the record does not exist.
    """
    service = ComplaintService(db)
    try:
        result  = await service.get_by_id(complaint_id)
        return Envelope(success=True, data=result)
    except Exception as exc:
        return Envelope(success=False, error=str(exc), data=None)

