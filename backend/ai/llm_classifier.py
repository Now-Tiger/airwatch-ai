#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/ai/llm_classifier.py
from __future__ import annotations

import json
from typing import Optional

from openai import (
    APIConnectionError,
    APITimeoutError,
    AsyncOpenAI,
    AuthenticationError,
    BadRequestError,
    InternalServerError,
    RateLimitError,
)

from ai.interface import CategoryResult, ComplaintClassifier, Entities, SentimentResult
from ai.prompts import SYSTEM_PROMPT, build_user_prompt
from core.config import settings
from core.exceptions import AIServiceUnavailable


class LLMResultCache:
    """
    In-memory cache designed to prevent redundant LLM token ingestion.

    Caches the combined parsed structural JSON payload generated from identical 
    complaint text and geographic metadata hashes.
    """

    def __init__(self):
        self._store: dict[str, dict] = {}


class LLMClassifier(ComplaintClassifier):
    """
    Production OpenAI orchestration module for structured grievance intelligence extraction.

    Implements a single-pass extraction pattern where one structured JSON LLM call 
    populates multiple analysis models (categorization, sentiment, priority scoring, and entity extraction).
    """

    def __init__(self):
        self.client: AsyncOpenAI | None = None
        self._last_payload: dict | None = None
        self._last_key: tuple | None = None

    def _get_client(self) -> AsyncOpenAI:
        """
        Delay client creation
        """
        if self.client is None:

            if not settings.OPENAI_API_KEY:
                raise AIServiceUnavailable("OPENAI_API_KEY missing...")

            self.client = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL,
            )

        return self.client

    async def _call(self, text: str, meta: dict) -> dict:
        """
        Execute a low-level completion request against the configured LLM endpoint.

        Uses JSON mode and low temperature bounds to enforce deterministic extraction schemas.
        """
        # Return internal memoized state if present to save token overhead across sub-service calls
        key = (text, meta.get("channel"), meta.get("area"))

        if self._last_payload is not None and self._last_key == key:
            return self._last_payload

        try:
            client   = self._get_client()

            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                temperature=0.1,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": SYSTEM_PROMPT,
                    },
                    {
                        "role": "user",
                        "content": build_user_prompt(text, meta),
                    },
                ],
            )

        except (
            AuthenticationError,
            APIConnectionError,
            APITimeoutError,
            InternalServerError,
            RateLimitError,
            BadRequestError,
        ) as exc:
            raise AIServiceUnavailable(str(exc)) from exc

        except Exception as exc:
            raise AIServiceUnavailable(str(exc)) from exc

        try:
            payload = json.loads(response.choices[0].message.content)
        except Exception as exc:
            raise AIServiceUnavailable("Invalid JSON returned from LLM.") from exc

        self._last_payload = payload
        self._last_key = key

        return payload

    async def categorize(self, text: str, meta: Optional[dict] = None) -> CategoryResult:
        """
        Extract environmental grievance categories and structural sub-categories.
        """
        p = await self._call(text, meta or {})
        return CategoryResult(category=p["category"], sub_category=p.get("sub_category"))

    async def analyze_sentiment(self, text: str, meta: dict | None = None) -> SentimentResult:
        """
        Perform sentiment mapping, urgency flags, and environmental health risk analysis.
        """
        p = await self._call(text, meta or {})
        return SentimentResult(
            label=p["sentiment_label"],
            is_urgent=p["is_urgent"],
            health_risk_detected=p["health_risk_detected"],
        )

    async def score_priority(self, text, meta, category, sentiment) -> int:
        """
        Calculate numerical priority thresholds using contextual metadata constraints.
        """
        p = await self._call(text, meta)
        return int(p["priority_score"])

    async def extract_entities(self, text: str, meta: Optional[dict] = None) -> Entities:
        """
        Isolate named entities such as landmarks, specific timelines, and suspect organizations.
        """
        p = await self._call(text, meta or {})
        e = p.get("entities", {})
        return Entities(**e)
