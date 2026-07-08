#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/ai/rule_classifier.py
from __future__ import annotations

import re
from typing import Optional
from ai.interface import ComplaintClassifier, CategoryResult, SentimentResult, Entities

# Cross-lingual regex anchors mapping acute physical or health-related emergency indicators
HEALTH_DISTRESS_PATTERNS = [
    r"can'?t breathe", r"saans lena mushkil", r"बच्चे बीमार", r"तबियत खराब",
    r"can not breathe", r"chest pain", r"sans nahi", r"दम घुट",
]

# Strategic multi-lingual token buckets for fallback structural categorization
CATEGORY_KEYWORDS = {
    "Dust/C&D": ["dust", "construction", "dhool", "धूल", "demolition", "c&d"],
    "Industrial Emission": ["factory", "फैक्ट्री", "chimney", "industrial", "dhuan", "धुआं", "smoke"],
    "Vehicular": ["traffic", "vehicle", "exhaust", "gaadi", "गाड़ी", "vahan"],
    "Open Burning": ["burning", "जलाना", "jalana", "fire", "aag", "आग"],
    "Noise": ["noise", "shor", "शोर", "loudspeaker", "awaaz"],
    "Water": ["water", "पानी", "sewage", "nala", "नाला", "drain"],
}


class RuleBasedClassifier(ComplaintClassifier):
    """
    Deterministic keyword/regex fallback mechanism for high-availability constraints.

    Acts as the circuit breaker implementation under the swappable interface, 
    ensuring graceful degradation when the LLM client encounters rate limits or timeouts.
    """

    async def categorize(self, text: str, meta: Optional[dict] = None) -> CategoryResult:
        """
        Scan input against localized token sets to guess primary environmental domain.
        """
        lowered = text.lower()
        for category, keywords in CATEGORY_KEYWORDS.items():
            if any(kw.lower() in lowered for kw in keywords):
                return CategoryResult(category=category, confidence=0.6)
        return CategoryResult(category="Other", confidence=0.3)

    async def analyze_sentiment(self, text: str, meta: Optional[dict] = None) -> SentimentResult:
        """
        Evaluate systemic emergency indicators by running multi-lingual regex match matrices.
        """
        is_urgent = any(re.search(p, text, re.IGNORECASE) for p in HEALTH_DISTRESS_PATTERNS)
        label = "distressed" if is_urgent else "neutral"
        return SentimentResult(label=label, is_urgent=is_urgent, health_risk_detected=is_urgent)

    async def score_priority(self, text, meta, category, sentiment) -> int:
        """
        Calculate weighted numerical risk thresholds using static business logic matrices.
        """
        score = 40
        if sentiment.is_urgent:
            score += 40
        if category.category in ("Industrial Emission", "Open Burning"):
            score += 15
        if meta.get("channel") == "social" and not sentiment.is_urgent:
            score -= 5
        return max(0, min(100, score))

    async def extract_entities(self, text: str, meta: Optional[dict] = None) -> Entities:
        """
        Parse structured metrics, metric units, and temporal bounds via alphanumeric regex patterns.
        """
        quantities = re.findall(r"\d+\s?(?:hours?|din|minutes?|ppm|db)", text, re.IGNORECASE)
        return Entities(quantities=quantities)

    async def full_process(self, text: str, meta: dict):
        """
        Orchestrate synchronous local extraction to provide zero-latency structural fallbacks.
        """
        from ai.pipeline import AIResult, tier_from_score

        category = await self.categorize(text)
        sentiment = await self.analyze_sentiment(text)
        score = await self.score_priority(text, meta, category, sentiment)
        entities = await self.extract_entities(text)

        return AIResult(
            category=category.category, 
            sub_category=category.sub_category,
            priority_score=score, 
            priority_tier=tier_from_score(score),
            is_urgent=sentiment.is_urgent, 
            sentiment_label=sentiment.label,
            entities=entities.model_dump(), 
            source="rule_fallback", 
            raw=None,
        )
