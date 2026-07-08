#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/core/config.py
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralized application configuration, sourced from environment variables / .env file.
    """

    ENV: str
    LOG_LEVEL: str
    WEB_APP_URL: str

    DATABASE_URL: str
    REDIS_URL: str
    RABBITMQ_URL: str
    CELERY_RESULT_BACKEND: str

    OPENAI_API_KEY: str
    OPENAI_BASE_URL: str
    OPENAI_MODEL: str

    AI_TIMEOUT_SECONDS: float
    DEDUP_RADIUS_METERS: int
    DEDUP_WINDOW_MINUTES: int

    SLA_P1_SECONDS: int = 60    # demo-friendly default; prod would be e.g. 4*3600
    SLA_P2_SECONDS: int = 300
    SLA_P3_SECONDS: int = 1800  
    SLA_CHECK_INTERVAL_SECONDS: int = 5
    MAX_COMPLAINT_TEXT_LEN: int = 2000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
