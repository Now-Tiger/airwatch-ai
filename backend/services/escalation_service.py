#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/services/escalation_service.py
from __future__ import annotations

from api.deps import DbSession
from db.models import Category, EscalationMatrix, Officer


class EscalationService:
    """
    Owns all reads of the escalation_matrix — who handles a category at a given tier,
    and how far a category's escalation chain goes. TicketService calls this instead of
    querying EscalationMatrix directly.
    """

    def __init__(self, db: DbSession):
        self.db = db

    async def get_officer(self, category: Category, tier: int) -> EscalationMatrix | None:
        from sqlalchemy import select

        stmt = select(EscalationMatrix).where(EscalationMatrix.category == category, EscalationMatrix.tier == tier)
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def max_configured_tier(self, category: Category) -> int:
        """
        Highest tier configured for a category — lets callers detect 'no further
        escalation possible' instead of guessing based on a missing row.
        """
        from sqlalchemy import select

        stmt = (
            select(EscalationMatrix.tier)
            .where(EscalationMatrix.category == category)
            .order_by(EscalationMatrix.tier.desc())
            .limit(1)
        )
        result = (await self.db.execute(stmt)).scalar_one_or_none()
        return result or 1

    async def resolve_next_tier(self, category: Category, current_tier: int) -> tuple[EscalationMatrix | None, int]:
        """
        Returns (officer_row_or_None, resolved_tier). If a tier above current_tier is
        configured, returns that officer and the new tier. If not, returns (None,
        current_tier) unchanged — caller (TicketService.escalate) still marks the ticket
        Escalated but keeps the existing officer, matching the 'stay at max tier, don't
        error' business rule.
        """
        next_tier = current_tier + 1
        officer = await self.get_officer(category, next_tier)
        if officer:
            return officer, next_tier
        return None, current_tier

    async def list_active_officers(self) -> list[Officer]:
        from sqlalchemy import select

        stmt = select(Officer).where(Officer.is_active.is_(True)).order_by(Officer.name)
        return list((await self.db.execute(stmt)).scalars().all())
