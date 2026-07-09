#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/scripts/seed_escalation_matrix.py
import asyncio

from loguru import logger
from sqlalchemy import select

from core.logging import setup_logging
from db.models import Category, EscalationMatrix
from db.session import AsyncSessionLocal


SEED = [
    ("Industrial Emission", 1, "Field Inspector - Zone A", "+91-9000000001"),
    ("Industrial Emission", 2, "Regional Supervisor", "+91-9000000002"),
    ("Industrial Emission", 3, "DPCC Divisional Head", "+91-9000000003"),
    ("Dust/C&D", 1, "Field Inspector - Zone B", "+91-9000000011"),
    ("Dust/C&D", 2, "Regional Supervisor", "+91-9000000002"),
    ("Open Burning", 1, "Rapid Response Unit", "+91-9000000021"),
    ("Open Burning", 2, "Fire & Env Coordinator", "+91-9000000022"),
    ("Vehicular", 1, "Traffic Pollution Cell", "+91-9000000031"),
    ("Noise", 1, "Noise Control Cell", "+91-9000000041"),
    ("Water", 1, "Water Quality Inspector", "+91-9000000051"),
    ("Other", 1, "General Triage Officer", "+91-9000000061"),
]

async def main():
    async with AsyncSessionLocal() as db:
        # Check if records already exist to prevent constraint crash-loops
        existing_check = await db.execute(select(EscalationMatrix).limit(1))
        if existing_check.scalar_one_or_none() is not None:
            # Renders in yellow/orange by default
            logger.warning("Escalation matrix table already seeded. Skipping...")
            return

        # Renders in standard white/blue depending on your terminal theme
        logger.info("Seeding escalation matrix...")

        for category, tier, name, contact in SEED:
            _ = db.add(EscalationMatrix(category=Category(category), tier=tier, officer_name=name, officer_contact=contact))

        _ = await db.commit()
        # Renders in bold green by default
        logger.success("Escalation matrix seeded successfully.")

if __name__ == "__main__":
    # Initialize logger sink configurations before executing async calls
    setup_logging()
    asyncio.run(main())
