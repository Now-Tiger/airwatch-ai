#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# worker/tasks/sla_tasks.py
from __future__ import annotations

from loguru import logger

from core.logging import setup_logging
from db.base import SessionLocal
from main import app
from services.ticket_service import TicketService


# Init logger
_ = setup_logging()


def _check_sla_breaches() -> int:
    db = SessionLocal()
    try:
        service = TicketService(db)
        count   = service.run_sla_check()

        # Commit the transaction to persist the updates and audit logs
        _ = db.commit()

        if count > 0:
            logger.success(f"Successfully escalated {count} breached tickets.")

        # Return count of escalated tickets
        return count
    except Exception as exc:
        # Rollback on failure to prevent hanging/corrupted transactions
        _ = db.rollback()
        logger.error(f"Error checking SLA breaches: {str(exc)}", exc_info=True)
        raise exc
    finally:
        db.close()


@app.task(name="tasks.sla_tasks.check_sla_breaches")
def check_sla_breaches() -> int:
    return _check_sla_breaches()
