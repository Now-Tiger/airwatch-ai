#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/workers/ai_tasks.py
from __future__ import annotations

from celery.exceptions import CeleryError
from loguru import logger

from core.exceptions import QueueError
from core.logging import setup_logging
from utils.worker_client import celeryapp


# Initialize logger sink configurations
_ = setup_logging()


def enqueue_ai_pipeline(complaint_id: str) -> str:
    """
    Sends the AI-pipeline task to the worker's `ai_pipeline` queue.
    Returns the Celery task id.

    Raises:
        QueueError: If the broker is unavailable or task submission fails.
    """
    try:
        task = celeryapp.send_task("tasks.ai_tasks.run_ai_pipeline", args=[complaint_id], queue="ai_pipeline")
        logger.info("Queued AI pipeline. complaint_id={}, task_id={}",complaint_id, task.id)

        return task.id

    except CeleryError as exc:
        logger.exception("Celery broker rejected task. complaint_id={}", complaint_id)
        raise QueueError("Unable to enqueue AI pipeline.") from exc

    except Exception as exc:
        logger.exception("Unexpected queue failure. complaint_id={}", complaint_id)
        raise QueueError("Unable to enqueue AI pipeline.") from exc
