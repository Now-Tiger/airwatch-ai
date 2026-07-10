#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/ai/rule_classifier.py
from __future__ import annotations

import re
from typing import Dict, List, Optional

from ai.interface import CategoryResult, ComplaintClassifier, Entities, SentimentResult

# PRE-COMPILED MULTILINGUAL REGEX MATRICES

CRITICAL_EMERGENCY_PATTERNS = [
    re.compile(r"(?:toxic|poisonous|विषैली)\s*(?:gas|gases|गैस)|gas\s*leak|saans\s*lena\s*mushkil|can'?t\s*breathe|dum\s*ghut|दमघोंटू|सांस\s*लेना", re.I),
    re.compile(r"(?:iron\s*rod|peeta|पीटा|physical\s*abuse|buri\s*tarah|dhamki|धमकी|jaan\s*se\s*maar|जान\s*से\s*मार|murder|kill)", re.I),
    re.compile(r"(?:gates?\s*lock|band\s*karke|ताले\s*लगा|जंजीरों\s*से\s*बाँधकर|locked\s*inside|trapped|baha?r\s*nahi\s*ja\s*sakta|बंधक)", re.I),
    re.compile(r"(?:naabalig|minors?|under\s*\d+\s*years?|bacho\s*se|नाबालिग|child\s*(?:labor|labour|rescue)|trafficking)", re.I),
    re.compile(r"(?:boiler|explosion|विस्फोट|fire\s*hazard|behosh|बेहोश|fainted|unconscious|no\s*medical|badi\s*emergency)", re.I)
]

INQUIRY_PATTERNS = [re.compile(r"(?:status\s*(?:of|hai|kya)?|update\s*on|ticket\s*(?:id|no|number)?|complaint\s*(?:number|no|#)|where\s*can\s*i\s*find|guidelines|office\s*open|assign\s*hua)", re.I)]

LOW_HARM_PATTERNS = [re.compile(r"(?:settles?\s*in\s*\d+|a\s*bit\s*of|thoda\s*(?:sa|white)?|faint\s*smell|sukha\s*patta|dry\s*leaves|just\s*letting\s*you\s*know|abhi\s*thik\s*hai|routine)", re.I)]

# High-fidelity internal semantic buckets
CATEGORY_MATRICES: Dict[str, List[re.Pattern]] = {
    "Industrial Safety & Disasters": [re.compile(r"(?:boiler|explosion|toxic\s*gas|leak|gate\s*lock|ppe\s*kit|gas\s*mask|विस्फोट|विषैली\s*गैस|कारखाने|factory\s*emergency)", re.I)],
    "Labor & Human Rights": [re.compile(r"(?:labour|labor|worker|thekedar|supervisor|shift|minors?|trafficking|abuse|aadhaar|phone\s*cheen|मजदूर|श्रमिक|ठेकेदार|बंधक)", re.I)],
    "Administrative / Inquiry": [re.compile(r"(?:ticket|status|guideline|office|update|complaint\s*number|manual|dpcc)", re.I)],
    "Industrial Emission": [re.compile(r"(?:chimney|industrial|dhuan|धुआं|smoke|chemical|dye|factory|mill)", re.I)],
    "Dust/C&D": [re.compile(r"(?:dust|dhool|धूल|demolition|c&d|scaffolding|sweeper|miti)", re.I)],
    "Vehicular": [re.compile(r"(?:traffic|vehicle|exhaust|gaadi|गाड़ी|vahan|car\s*smoke)", re.I)],
    "Open Burning": [re.compile(r"(?:burning|जलाना|jalana|fire|aag|आग|garbage\s*burn)", re.I)],
    "Noise": [re.compile(r"(?:noise|shor|शोर|loudspeaker|awaaz|decibel)", re.I)],
    "Water / Sewage": [re.compile(r"(?:water|पानी|sewage|nala|नाला|drain|effluent)", re.I)]
}

# Strict Database Enum Translation Map
DB_CATEGORY_MAPPING: Dict[str, str] = {
    "Industrial Safety & Disasters": "Industrial Emission",
    "Labor & Human Rights": "Other",
    "Administrative / Inquiry": "Other",
    "Industrial Emission": "Industrial Emission",
    "Dust/C&D": "Dust/C&D",
    "Vehicular": "Vehicular",
    "Open Burning": "Open Burning",
    "Noise": "Noise",
    "Water / Sewage": "Water"
}


class RuleBasedClassifier(ComplaintClassifier):
    """
    Deterministic rule-based fallback mechanism optimized for zero-latency, 
    strict database-compliant schema categorizations.
    """

    async def categorize(self, text: str, meta: Optional[dict] = None) -> CategoryResult:
        """
        Scans inputs against specialized matrices and normalizes them to database-approved enums.
        """
        best_internal_cat = "Other"
        highest_hits = 0

        for internal_cat, patterns in CATEGORY_MATRICES.items():
            hits = sum(1 for pattern in patterns if pattern.search(text))
            if hits > highest_hits:
                highest_hits = hits
                best_internal_cat = internal_cat

        # Safe cross-walk to strict Enum category values
        db_category = DB_CATEGORY_MAPPING.get(best_internal_cat, "Other")
        confidence = 0.85 if highest_hits >= 2 else (0.65 if highest_hits == 1 else 0.30)

        return CategoryResult(
            category=db_category,
            sub_category=best_internal_cat if best_internal_cat != db_category else None,
            confidence=confidence
        )

    async def analyze_sentiment(self, text: str, meta: Optional[dict] = None) -> SentimentResult:
        """
        Evaluates system urgency indicators against multi-lingual regex strings.
        """
        is_inquiry = any(p.search(text) for p in INQUIRY_PATTERNS)
        if is_inquiry:
            return SentimentResult(label="neutral", is_urgent=False, health_risk_detected=False)

        is_critical = any(p.search(text) for p in CRITICAL_EMERGENCY_PATTERNS)
        is_low_harm = any(p.search(text) for p in LOW_HARM_PATTERNS)

        if is_critical:
            return SentimentResult(label="distressed", is_urgent=True, health_risk_detected=True)
        elif is_low_harm:
            return SentimentResult(label="calm", is_urgent=False, health_risk_detected=False)
        else:
            return SentimentResult(label="concerned", is_urgent=False, health_risk_detected=False)

    async def score_priority(self, text: str, meta: Optional[dict], category: CategoryResult, sentiment: SentimentResult) -> int:
        """
        Calculates dynamic risk values using high-fidelity internal sub_category states.
        """
        # Administrative & inquiry overrides drop straight to base floor (P4)
        if category.category == "Other" and category.sub_category == "Administrative / Inquiry":
            return 5
        if any(p.search(text) for p in INQUIRY_PATTERNS):
            return 5

        # Base scoring off high-fidelity semantic mapping (retaining granular context)
        score_context = category.sub_category if category.sub_category else category.category
        base_scores = {
            "Industrial Safety & Disasters": 75,
            "Labor & Human Rights": 70,
            "Industrial Emission": 50,
            "Open Burning": 45,
            "Water": 40,
            "Dust/C&D": 35,
            "Vehicular": 30,
            "Noise": 25,
            "Other": 30
        }
        score = base_scores.get(score_context, 30)

        # Emergency structural adjustments
        if sentiment.is_urgent:
            score += 35  # Escalates to P1 Tier (90-100)
        
        # Low harm mitigation adjustments
        if any(p.search(text) for p in LOW_HARM_PATTERNS):
            score -= 25  # De-escalates routine updates down to P3 Tier

        if meta and meta.get("channel") == "social" and not sentiment.is_urgent:
            score -= 5

        return max(0, min(100, score))

    async def extract_entities(self, text: str, meta: Optional[dict] = None) -> Entities:
        """
        Extract numeric values, duration windows, tracking tags, and IDs from texts.
        """
        quantities = re.findall(r"(\d+\s*(?:hours?|ghante|din|days?|workers?|labourers?|ppm|db|bacho|minors?))", text, re.I)

        return Entities(
            quantities=quantities,
        )

    async def full_process(self, text: str, meta: dict):
        """
        Orchestration controller producing verified DB compliant objects.
        """
        from ai.pipeline import AIResult, tier_from_score

        category = await self.categorize(text, meta)
        sentiment = await self.analyze_sentiment(text, meta)
        score = await self.score_priority(text, meta, category, sentiment)
        entities = await self.extract_entities(text, meta)

        return AIResult(
            category=category.category,  # Matches your Category Enum exactly
            sub_category=category.sub_category,  # Holds high-granularity domain info
            priority_score=score, 
            priority_tier=tier_from_score(score),
            is_urgent=sentiment.is_urgent, 
            sentiment_label=sentiment.label,
            entities=entities.model_dump(),
            source="rule_fallback", 
            raw=None,
        )
