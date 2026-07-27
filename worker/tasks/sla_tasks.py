#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# worker/tasks/sla_tasks.py
from __future__ import annotations

import json
from loguru import logger
from redis import Redis, TimeoutError

from core.config import settings
from core.logging import setup_logging
from db.base import SessionLocal
from main import app
from services.ticket_service import TicketService


# Init logger
_ = setup_logging()

# Initialize Synchronous Redis Client for Publishing
redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)


def _check_sla_breaches() -> int:
    db = SessionLocal()
    channel = "ticket_updates"
    try:
        service = TicketService(db)

        # Process breaches & get escalated tickets from sla check
        tickets = service.run_sla_check()
        count   = len(tickets)

        # Commit the transaction to persist the updates and audit logs
        _ = db.commit()

        # ONLY publish to Redis after a successful DB commit to prevent race conditions
        if count > 0:
            logger.success(f"Successfully escalated {count} breached tickets.")

            for tkt in tickets:
                # Construct payload for the React frontend
                try:
                    payload = {
                        "id": str(tkt.id),
                        # Safely handle Enum to string conversion
                        "status": tkt.status.value if hasattr(tkt.status, "value") else str(tkt.status),
                        "current_tier": tkt.current_tier,
                        "assigned_officer_name": tkt.assigned_officer_name,
                        "sla_deadline": tkt.sla_deadline.isoformat() if tkt.sla_deadline else None
                    }

                    # Publish to the channel the FastAPI SSE endpoint is listening to
                    _ = redis.publish(channel, json.dumps(payload))
                    logger.debug(f"Published real-time update for ticket {tkt.id} to Redis.")
 
                except TimeoutError as _:
                     logger.error('Operation timed out. Continuing to poll...')

                except Exception as pubsub_exc:
                    # We don't want a Redis failure to crash the worker or rollback the DB
                    logger.error(f"Failed to publish ticket {tkt.id} update to Redis: {pubsub_exc}")

        # Return count of escalated tickets
        return count
    except Exception as exc:
        # Rollback on failure to prevent hanging/corrupted transactions
        _ = db.rollback()
        logger.exception(f"Error checking SLA breaches: {str(exc)}", exc_info=True)
        raise exc

    finally:
        db.close()


@app.task(name="tasks.sla_tasks.check_sla_breaches")
def check_sla_breaches() -> int:
    return _check_sla_breaches()
