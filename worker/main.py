#!/usr/bin/env python3
# -*-coding: utf-8 -*-
# worker/main.py
from celery import Celery
from celery.schedules import schedule

from core.config import settings

app = Celery(
    "airwatch",
    broker=settings.RABBITMQ_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "tasks.ai_tasks",
        "tasks.sla_tasks",
    ],
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

app.conf.task_routes = {
    "tasks.ai_tasks.*" : {"queue": "ai_pipeline"},
    "tasks.sla_tasks.*": {"queue": "sla"},
}

app.conf.beat_schedule = {
    "check-sla-breaches": {
        "task": "tasks.sla_tasks.check_sla_breaches",
        "schedule": schedule(run_every=int(settings.SLA_CHECK_INTERVAL_SECONDS or 15)),
    }
}
