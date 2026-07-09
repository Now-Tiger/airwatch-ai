#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# worker/tasks/sla_tasks.py
from __future__ import annotations

from db.base import SessionLocal
from main import app
from services.ticket_service import TicketService


def _check_sla_breaches() -> int:
    db = SessionLocal()
    try:
        service = TicketService(db)
        count   = service.run_sla_check()
        return count
    finally:
        db.close()


@app.task(name="tasks.sla_tasks.check_sla_breaches")
def check_sla_breaches() -> int:
    return _check_sla_breaches()
