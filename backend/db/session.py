#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/db/session.py
from __future__ import annotations

from typing import Annotated, AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db.base import AsyncSessionLocal


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Yields a transactional async DB session.
    auto-commits on clean exit, auto-rolls-back on any exception.
    Route handlers never call session.commit() directly.
    """
    async with AsyncSessionLocal() as session:
        async with session.begin():
            yield session


DbSession = Annotated[AsyncSession, Depends(get_session)]
