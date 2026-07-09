#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# worker/ai/pipeline.py
from __future__ import annotations

from pydantic import BaseModel
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed

from ai.interface import ComplaintClassifier
from ai.llm_classifier import LLMClassifier
from ai.rule_classifier import RuleBasedClassifier


class AIResult(BaseModel):
    """
    Unified structural Pydantic model representing fully processed grievance metadata.
    """
    category: str
    sub_category: str | None
    priority_score: int
    priority_tier: str
    is_urgent: bool
    sentiment_label: str
    entities: dict
    source: str  # Structural flag: "llm" | "rule_fallback"
    raw: dict | None


def tier_from_score(score: int) -> str:
    """
    Map a numerical risk calculation score to an operational SLA escalation tier.
    """
    if score >= 80:
        return "P1"
    if score >= 60:
        return "P2"
    if score >= 35:
        return "P3"
    return "P4"


class ComplaintAIPipeline:
    """
    The orchestration core executing the swappable dual-engine analysis pipeline.

    Coordinates primary LLM inference blocks alongside immediate local keyword rule
    fallbacks, safeguarding API ingestion pipelines against external provider downtime.
    """

    def __init__(self, classifier: ComplaintClassifier | None = None):
        """
        Initializes the pipeline with a swappable primary classifier interface.
        """
        self.primary  = classifier or LLMClassifier()
        self.fallback = RuleBasedClassifier()

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_fixed(0.5),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    def _run_primary(self, text: str, meta: dict) -> AIResult:
        """
        Execute structured single-pass analysis over the active LLM implementation layer.
        """
        category  = self.primary.categorize(text, meta)
        sentiment = self.primary.analyze_sentiment(text, meta)
        score     = self.primary.score_priority(text, meta, category, sentiment)
        entities  = self.primary.extract_entities(text, meta)

        # Access internal memoized state payload to save tracking debug logs
        raw = getattr(self.primary, "_last_payload", None)

        return AIResult(
            category=category.category,
            sub_category=category.sub_category,
            priority_score=score,
            priority_tier=tier_from_score(score),
            is_urgent=sentiment.is_urgent,
            sentiment_label=sentiment.label,
            entities=entities.model_dump(),
            source="llm",
            raw=raw,
        )

    def process(self, text: str, meta: dict) -> AIResult:
        """
        Orchestrate primary processing path with circuit-breaker execution boundaries.
        """
        try:
            return self._run_primary(text, meta)
        except Exception:
            # Fallback path runs locally with zero-network dependencies on primary failure
            return self.fallback.full_process(text, meta)
