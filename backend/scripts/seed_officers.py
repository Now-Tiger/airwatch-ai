#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/scripts/seed_officers.py
import asyncio

from loguru import logger
from sqlalchemy import select

from core.logging import setup_logging
from db.models import Officer
from db.session import AsyncSessionLocal


SEED = [
    ("Field Inspector - Zone A", "+91-9000000001", "Zone A"),
    ("Field Inspector - Zone B", "+91-9000000011", "Zone B"),
    ("Regional Supervisor", "+91-9000000002", "Region North"),
    ("DPCC Divisional Head", "+91-9000000003", "Division HQ"),
    ("Rapid Response Unit", "+91-9000000021", "Citywide"),
    ("Fire & Env Coordinator", "+91-9000000022", "Citywide"),
    ("Traffic Pollution Cell", "+91-9000000031", "Citywide"),
    ("Noise Control Cell", "+91-9000000041", "Citywide"),
    ("Water Quality Inspector", "+91-9000000051", "Citywide"),
    ("General Triage Officer", "+91-9000000061", "Citywide"),
]


async def main():
    async with AsyncSessionLocal() as db:
        # Check if records already exist to prevent constraint crash-loops
        existing_check = await db.execute(select(Officer).limit(1))
        if existing_check.scalar_one_or_none() is not None:
            # Renders in yellow/orange by default
            logger.warning("Officers table already seeded. Skipping...")
            return

        # Renders in standard white/blue depending on your terminal theme
        logger.info("Seeding officers table...")

        for name, contact, zone in SEED:
            _ = db.add(Officer(name=name, contact=contact, zone=zone, is_active=True))

        _ = await db.commit()
        # Renders in bold green by default
        logger.success("Officers table seeded successfully.")


if __name__ == "__main__":
    # Initialize logger sink configurations before executing async calls
    setup_logging()
    asyncio.run(main())
