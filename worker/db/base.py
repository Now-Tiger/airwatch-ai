#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# worker/db/base.py
from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from core.config import settings

DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,  # NOTE: Match this to the worker's concurrency
    max_overflow=20,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False, # Essential for background workers to avoid detached object errors
    autocommit=False,
    autoflush=False,
)

# Pro-tip naming convention for Alembic constraint tracking
POSTGRES_INDEXES_NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """
    Shared declarative base — all ORM models inherit from this.
    """

    metadata = MetaData(naming_convention=POSTGRES_INDEXES_NAMING_CONVENTION)
