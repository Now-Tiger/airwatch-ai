#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# worker/tasks/sla_tasks.py
from __future__ import annotations

from db.base import AsyncSessionLocal
from main import app
from tasks.base import async_task


async def _check_sla_breaches_async() -> int:
    from services.ticket_service import TicketService

    async with AsyncSessionLocal() as db:
        service = TicketService(db)
        count = await service.run_sla_check()
        _ = await db.commit()
        return count


@app.task(name="tasks.sla_task.check_sla_breaches")
@async_task
async def check_sla_breaches():
    return await _check_sla_breaches_async()
