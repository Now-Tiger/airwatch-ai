#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# backend/core/cache.py
from __future__ import annotations

import functools
import hashlib
import json
from typing import Any, Callable, Optional

import redis.asyncio as redis
from fastapi import Request
from fastapi.encoders import jsonable_encoder
from loguru import logger

from core.config import settings

# Initialize async Redis client with automatic string decoding
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

CACHE_KEY_PREFIX = "airwatch:cache"


# Low-Level Cache Utility Functions (Required Instructions + Fail-Open)
async def cache_get(key: str) -> Optional[Any]:
    """
    Retrieve and JSON-deserialize a value from Redis by key.
    Fails open: returns None and logs a warning if Redis is unreachable or data is malformed.
    """
    try:
        val = await redis_client.get(key)
        return json.loads(val) if val else None
    except Exception as exc:
        logger.warning(f"[cache_get] Redis read failed for key '{key}': {exc}")
        return None


async def cache_set(key: str, value: Any, ttl: int = 300) -> bool:
    """
    Serialize a value to JSON and store it in Redis with an expiration TTL (default 300s).
    Fails open: logs a warning and returns False if the write fails.
    """
    try:
        # Use jsonable_encoder to safely handle Pydantic models, datetimes, UUIDs, etc.
        serialized = json.dumps(jsonable_encoder(value))
        await redis_client.set(key, serialized, ex=ttl)
        return True
    except Exception as exc:
        logger.warning(f"[cache_set] Redis write failed for key '{key}': {exc}")
        return False


# High-Level Decorators & Group Management
def _build_cache_key(request: Request) -> str:
    """
    Derive a cache key from the request path + query string, namespaced by the first
    path segment (e.g. 'claims', 'customers', 'reports') so keys can be invalidated by group.
    """
    tag = request.url.path.strip("/").split("/")[0] or "root"
    raw = f"{request.url.path}?{str(request.query_params)}"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return f"{CACHE_KEY_PREFIX}:{tag}:{digest}"


def cached(ttl: int = 60):
    """
    Decorator for async FastAPI endpoints that caches the return value in Redis.
    The decorated endpoint must accept a `request: Request` parameter.

    Cache invalidation strategy: TTL-only. Upload processing happens in background workers
    and typically completes on a timescale close to these TTLs, making a short TTL expiry
    simpler and safe enough without needing complex cross-service cache busting.

    Fails open: leverages `cache_get` and `cache_set` so any Redis outage simply bypasses
    the cache and executes the endpoint normally.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract the Request object from keyword arguments or positional arguments
            request: Optional[Request] = kwargs.get("request")
            if request is None:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            # If no Request object is found, skip caching and run the function normally
            if request is None:
                return await func(*args, **kwargs)

            cache_key = _build_cache_key(request)

            # 1. Attempt to fetch from cache using our reusable utility
            cached_value = await cache_get(cache_key)
            if cached_value is not None:
                logger.info(f"Cache hit: {request.url.path}")
                return cached_value

            # 2. Execute actual endpoint handler on cache miss
            result = await func(*args, **kwargs)

            # 3. Store the result asynchronously using our reusable utility
            await cache_set(cache_key, result, ttl=ttl)

            return result

        return wrapper

    return decorator


async def invalidate_cache_group(tag: str) -> None:
    """
    Delete all cached keys under a given tag (e.g. 'claims', 'customers', 'reports').
    Uses scan_iter to avoid blocking the Redis event loop on large key spaces.
    """
    try:
        pattern = f"{CACHE_KEY_PREFIX}:{tag}:*"
        deleted_count = 0
        async for key in redis_client.scan_iter(match=pattern):
            await redis_client.delete(key)
            deleted_count += 1
        
        if deleted_count > 0:
            logger.info(f"Invalidated {deleted_count} cache keys for tag '{tag}'")
    except Exception as exc:
        logger.warning(f"Cache invalidation failed for tag '{tag}': {exc}")
