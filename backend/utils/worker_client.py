#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/utils/client.py
from __future__ import annotations

from celery import Celery

from core.config import settings


celeryapp = Celery(
    "airwatch",
    broker=settings.RABBITMQ_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "tasks.ai_tasks",
        "tasks.sla_tasks",
    ],
)

celeryapp.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

celeryapp.conf.task_routes = {
    "tasks.ai_tasks.*" : {"queue": "ai_pipeline"},
    "tasks.sla_tasks.*": {"queue": "sla"},
}

