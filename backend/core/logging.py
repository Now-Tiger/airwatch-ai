#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/core/logging.py
from __future__ import annotations

import sys

from loguru import logger

from core.config import settings


def setup_logging() -> None:
    """
    Configure loguru: colored human-readable logs to stdout plus a structured JSON rotating file sink.
    Never log request bodies — only IDs/paths/status codes are logged from main.py.
    """
    logger.remove()

    # Terminal / Console Sink (Colorized & Human-Readable for Docker logs)
    logger.add(
        sys.stdout,
        level=settings.LOG_LEVEL,
        colorize=True,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        backtrace=False,
        diagnose=False,
    )

    # File Sink (Structured JSON for parsing / retention)
    logger.add(
        "logs/claimmesh-backend.log",
        level=settings.LOG_LEVEL,
        rotation="10 MB",
        retention="7 days",
        serialize=True,
    )
