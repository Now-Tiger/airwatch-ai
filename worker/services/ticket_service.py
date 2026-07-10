#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# wroker/services/ticket_service.py
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from loguru import logger
from sqlalchemy import select

from core.config import settings
from core.logging import setup_logging
from db.models import Complaint, EscalationMatrix, Ticket, TicketAudit, TicketStatus

# Init logger
_ = setup_logging()


# Mapping operational priority tiers to dynamic SLA durations managed by environment configurations
SLA_SECONDS_BY_TIER = {
    "P1": settings.SLA_P1_SECONDS,
    "P2": settings.SLA_P2_SECONDS,
    "P3": settings.SLA_P3_SECONDS,
    "P4": settings.SLA_P3_SECONDS,
    # Fallback maps P4 to P3 timeline criteria
}


class TicketService:
    """
    Service layer handling core business domain logic for grievance ticketing.
    
    Manages automated assignment paths, SLA deadline schedules, escalation matrices, 
    and systemic audit trails for complaints pushed from the AI ingestion engine.
    """

    def __init__(self, db):
        """Initializes the TicketService with an asynchronous SQLAlchemy session.

        Args:
            db: The active, scoped asynchronous database dependency session.
        """
        self.db = db

    def _get_officer(self, category, tier: int) -> EscalationMatrix | None:
        """
        Looks up the designated responder from the organizational escalation matrix.

        Queries the `escalation_matrix` table using a unique composite pair of 
        grievance category and management escalation level.

        Args:
            category (Category): The categorical domain of the issue (e.g., Vehicular, Noise).
            tier (int): The operational oversight depth layer (Tier 1, Tier 2, etc.).

        Returns:
            EscalationMatrix | None: Database record containing officer routing metadata 
            and contact profiles if configured, else None.
        """
        stmt = select(EscalationMatrix).where(EscalationMatrix.category == category, EscalationMatrix.tier == tier)
        return (self.db.execute(stmt)).scalar_one_or_none()

    def create_for_complaint(self, complaint: Complaint) -> Ticket:
        """
        Spins up an operational tracking ticket bound to an processed AI complaint structure.

        Automates Tier 1 assignment routing based on the evaluated complaint category,
        calculates strict SLA bounds according to the urgency scoring tier, and stamps an 
        initial snapshot to the immutable system ledger.

        Args:
            complaint (Complaint): The processed and validated upstream database model.

        Returns:
            Ticket: The newly instantiated, flushed database record.
        """
        # Default routing targeting foundational operations tier
        officer = self._get_officer(complaint.category, tier=1)
        current_tier = complaint.priority_tier

        # Safe attribute extraction regardless of whether tier is Enum, string, or None
        tier_key = getattr(current_tier, "value", current_tier) if current_tier else "P4"
        sla_seconds = SLA_SECONDS_BY_TIER.get(str(tier_key), settings.SLA_P3_SECONDS)
        now = datetime.now(timezone.utc)

        ticket = Ticket(
            id=uuid.uuid4(),
            complaint_id=complaint.id,
            status=TicketStatus.open,
            priority_tier=complaint.priority_tier,
            category=complaint.category,
            current_tier=1,
            assigned_officer_name=officer.officer_name if officer else "Unassigned",
            assigned_officer_contact=officer.officer_contact if officer else None,
            sla_deadline=now + timedelta(seconds=sla_seconds),
            sla_seconds=sla_seconds,
        )

        self.db.add(ticket)
        self.db.flush()  # Extract primary keys safely without executing full commit boundary

        # Create system checkpoint documenting foundational lifecycle creation step
        self.db.add(TicketAudit(
            id=uuid.uuid4(), 
            ticket_id=ticket.id, 
            from_status=None,
            to_status=getattr(TicketStatus.open, "value", TicketStatus.open), 
            from_tier=None, 
            to_tier=1,
            reason="created", 
            actor="system",
        ))

        logger.info(f"Created ticket {ticket.id} for complaint {complaint.id}")
        return ticket

    def escalate(self, ticket: Ticket) -> None:
        """
        Escalates a ticket horizontally to the next managerial structural tier.

        Triggered dynamically via scheduled polling workers when `sla_deadline` breaches. 
        Promotes the operational tier level, attempts to re-route assignments to higher authority,
        refreshes the SLA timeline window, and appends the breach entry to the audit logs.

        Args:
            ticket (Ticket): The target tracking entity currently experiencing a breach.
        """
        next_tier = ticket.current_tier + 1
        officer = self._get_officer(ticket.category, tier=next_tier)

        # Retain state snapshots before processing transitions
        from_status = getattr(ticket.status, "value", ticket.status)
        from_tier = ticket.current_tier

        # If a higher organizational tier is explicitly defined, shift responsibility
        if officer:
            ticket.current_tier = next_tier
            ticket.assigned_officer_name = officer.officer_name
            ticket.assigned_officer_contact = officer.officer_contact
            logger.info(f"Escalating ticket {ticket.id} to Tier {next_tier} (Officer: {officer.officer_name})")
        else:
            logger.info(f"Escalating ticket {ticket.id} to max tier (No higher officer available)")

        # If no upper tier exists, remain locked at maximum tier depth but flag state as escalated
        ticket.status = TicketStatus.escalated
        ticket.sla_deadline = datetime.now(timezone.utc) + timedelta(seconds=ticket.sla_seconds)

        # Log formal escalation action details into the ledger
        self.db.add(TicketAudit(
            id=uuid.uuid4(), 
            ticket_id=ticket.id, 
            from_status=from_status,
            to_status=getattr(TicketStatus.escalated, "value", TicketStatus.escalated), 
            from_tier=from_tier,
            to_tier=ticket.current_tier, 
            reason="sla_breach", 
            actor="system",
        ))

    def update_status(self, ticket: Ticket, new_status: str, actor: str) -> None:
        """
        Modifies status bounds manually via interactive supervisor actions.

        Applies validation transitions across structural states (e.g., In Progress, Closed)
        and explicitly sets completion timestamps if a terminal closure state is reached.

        Args:
            ticket (Ticket): The specific record undergoing operational review.
            new_status (str): The destination tracking state matching `TicketStatus` definitions.
            actor (str): Identity string denoting the administrative worker or user causing the state change.
        """
        from_status = getattr(ticket.status, "value", ticket.status)
        ticket.status = TicketStatus(new_status)

        # Capture precise tracking metric on final operational resolution
        if ticket.status == TicketStatus.closed:
            ticket.closed_at = datetime.now(timezone.utc)

        # Append manual intervention path cleanly to the historical ledger
        self.db.add(TicketAudit(
            id=uuid.uuid4(), 
            ticket_id=ticket.id, 
            from_status=from_status,
            to_status=new_status, 
            from_tier=ticket.current_tier, 
            to_tier=ticket.current_tier,
            reason="manual", 
            actor=actor,
        ))

    def run_sla_check(self) -> int:
        """
        Shared by Celery Beat (worker/tasks/sla_tasks.py) and the manual
        /admin/sla/check endpoint — single source of truth for SLA breach logic.
        """
        now  = datetime.now(timezone.utc)
        stmt = select(Ticket).where(
            Ticket.status.in_([
                TicketStatus.open,
                TicketStatus.in_progress,
            ]),
            Ticket.sla_deadline < now
        )
        result = self.db.execute(stmt)
        breached = result.scalars().all()

        for ticket in breached:
            self.escalate(ticket)

        return len(breached)
