#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# worker/tasks/sla.py
from __future__ import annotations

from db.base import AsyncSessionLocal
from db.models import Category, PriorityTier
from main import app
from tasks.base import async_task


async def _run_pipeline_async(complaint_id: str) -> None:
    from ai.pipeline import ComplaintAIPipeline
    from db.models import Complaint, ProcessingStatus
    from services.dedup_service import DedupService
    from services.ticket_service import TicketService

    async with AsyncSessionLocal() as db:
        complaint = await db.get(Complaint, complaint_id)
        if complaint is None:
            return

        pipeline  = ComplaintAIPipeline()
        ai_result = await pipeline.process(complaint.raw_text, meta={"channel": complaint.channel.value, "area": complaint.area})

        complaint.category = Category(ai_result.category) if ai_result.category else None
        complaint.priority_score = ai_result.priority_score
        complaint.priority_tier  = PriorityTier(ai_result.priority_tier) if ai_result.priority_tier else None
        complaint.is_urgent = ai_result.is_urgent
        complaint.sentiment_label = ai_result.sentiment_label
        complaint.entities  = ai_result.entities
        complaint.ai_source = ai_result.source
        complaint.processing_status = (ProcessingStatus.processed_llm if ai_result.source == "llm" else ProcessingStatus.processed_fallback)

        dedup = DedupService(db)
        dedup_result = await dedup.find_and_link(complaint)

        if not dedup_result.is_duplicate and complaint.priority_tier in ("P1", "P2"):
            tickets = TicketService(db)
            await tickets.create_for_complaint(complaint)

        _ = await db.commit()

        return


@app.task(name="tasks.ai_tasks.run_ai_pipeline", bind=True, max_retries=3, default_retry_delay=5)
@async_task
async def run_ai_pipeline(complaint_id: str):
    await _run_pipeline_async(complaint_id)
