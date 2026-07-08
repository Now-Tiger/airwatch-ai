#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# worker/ai/interface.py
from __future__ import annotations

from abc import ABC, abstractmethod
from pydantic import BaseModel


class CategoryResult(BaseModel):
    category: str
    sub_category: str | None = None
    confidence: float | None = None


class SentimentResult(BaseModel):
    label: str  # "distressed" | "neutral" | "angry" | "informational"
    is_urgent: bool
    health_risk_detected: bool


class Entities(BaseModel):
    pollution_source: str | None = None
    landmark: str | None = None
    time_reference: str | None = None
    quantities: list[str] = []


class ComplaintClassifier(ABC):
    """
    Swappable AI abstraction. Implementations: LLMClassifier, RuleBasedClassifier.
    """

    @abstractmethod
    async def categorize(self, text: str, meta: dict) -> CategoryResult: ...

    @abstractmethod
    async def score_priority(
        self,
        text: str,
        meta: dict,
        category: CategoryResult,
        sentiment: SentimentResult,
    ) -> int: ...

    @abstractmethod
    async def analyze_sentiment(self, text: str, meta: dict) -> SentimentResult: ...

    @abstractmethod
    async def extract_entities(self, text: str, meta: dict) -> Entities: ...
