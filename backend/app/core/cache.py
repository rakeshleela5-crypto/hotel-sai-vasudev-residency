"""
Redis & In-Memory Distributed Caching Layer for Hotel Sai Vasudev Residency.
Provides an async Redis caching client using REDIS_URL with an automatic,
seamless fallback to an in-memory TTLCache (from cachetools, maxsize=1000, ttl=600)
if REDIS_URL is not configured or unreachable.
"""

import os
import json
import logging
import asyncio
import functools
from typing import Any, Callable, Optional, Dict, List, Union
from starlette.requests import Request
from starlette.responses import Response
from starlette.concurrency import run_in_threadpool
from fastapi.encoders import jsonable_encoder
from cachetools import TTLCache

import redis.asyncio as aioredis
from app.config import settings

logger = logging.getLogger("svr_cache")

# Global fallback in-memory TTLCache (cachetools, maxsize=1000, ttl=600)
fallback_cache: TTLCache = TTLCache(maxsize=1000, ttl=600)

# Global async Redis client singleton
_redis_client: Optional[aioredis.Redis] = None
_redis_available: bool = False


async def get_redis_client() -> Optional[aioredis.Redis]:
    """
    Initializes and returns the async Redis client singleton if REDIS_URL is configured
    and reachable. Seamlessly falls back to None if unreachable or unconfigured.
    """
    global _redis_client, _redis_available

    redis_url = getattr(settings, "REDIS_URL", None) or os.getenv("REDIS_URL", "")
    if not redis_url or not redis_url.strip():
        _redis_available = False
        return None

    if _redis_client is not None and _redis_available:
        return _redis_client

    try:
        client = aioredis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=2.0,
            socket_timeout=2.0,
        )
        # Connectivity check
        await client.ping()
        _redis_client = client
        _redis_available = True
        logger.info(f"[Cache] Successfully connected to Redis at {redis_url}")
        return _redis_client
    except Exception as e:
        logger.warning(
            f"[Cache] Redis at {redis_url} is unreachable ({e}). "
            f"Falling back to in-memory TTLCache (maxsize=1000, ttl=600)."
        )
        _redis_client = None
        _redis_available = False
        return None


async def close_redis() -> None:
    """Gracefully closes Redis connection pool on app shutdown."""
    global _redis_client, _redis_available
    if _redis_client is not None:
        try:
            await _redis_client.aclose()
        except Exception as e:
            logger.warning(f"[Cache] Error closing Redis client: {e}")
        finally:
            _redis_client = None
            _redis_available = False


async def get_cached_value(key: str) -> Optional[str]:
    """
    Retrieves serialized JSON string from Redis or fallback TTLCache.
    """
    client = await get_redis_client()
    if client:
        try:
            val = await client.get(key)
            if val is not None:
                return val
        except Exception as e:
            logger.warning(f"[Cache] Redis GET failed for key {key}: {e}. Falling back to TTLCache.")

    return fallback_cache.get(key)


async def set_cached_value(key: str, value: str, ttl: int = 600) -> None:
    """
    Stores serialized JSON string into fallback TTLCache and Redis (if reachable).
    """
    fallback_cache[key] = value

    client = await get_redis_client()
    if client:
        try:
            await client.set(key, value, ex=ttl)
        except Exception as e:
            logger.warning(f"[Cache] Redis SET failed for key {key}: {e}. Stored in TTLCache.")


def build_cache_key(prefix: str, func: Callable, args: tuple, kwargs: dict) -> str:
    """
    Constructs a deterministic cache key based on route path and query parameters,
    or falls back to function name and keyword arguments.
    """
    request: Optional[Request] = None
    for arg in args:
        if isinstance(arg, Request):
            request = arg
            break
    if not request:
        for v in kwargs.values():
            if isinstance(v, Request):
                request = v
                break

    if request is not None:
        path = request.url.path
        sorted_params = sorted(request.query_params.multi_items())
        query_str = "&".join(f"{k}={v}" for k, v in sorted_params)
        return f"{prefix}:{path}?{query_str}" if query_str else f"{prefix}:{path}"

    # Fallback for direct unit tests or internal callers without Request
    clean_kwargs = {
        k: v for k, v in kwargs.items()
        if not (hasattr(v, "query") or hasattr(v, "commit") or hasattr(v, "execute"))
    }
    sorted_kw = sorted(clean_kwargs.items())
    kw_str = "&".join(f"{k}={v}" for k, v in sorted_kw)
    return f"{prefix}:{func.__name__}?{kw_str}" if kw_str else f"{prefix}:{func.__name__}"


def cache_response(prefix: str, ttl: int = 600):
    """
    Reusable async decorator for FastAPI GET endpoints that caches serialized JSON
    responses keyed by route path and query parameters.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = build_cache_key(prefix, func, args, kwargs)

            # 1. Check cache HIT
            cached_json = await get_cached_value(cache_key)
            if cached_json is not None:
                try:
                    return json.loads(cached_json)
                except Exception as e:
                    logger.warning(f"[Cache] Deserialization error for {cache_key}: {e}")

            # 2. Cache MISS: execute endpoint
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = await run_in_threadpool(func, *args, **kwargs)

            # 3. Store result in cache
            try:
                if result is not None:
                    # If endpoint returned a starlette Response, only cache if 2xx
                    if isinstance(result, Response):
                        if 200 <= result.status_code < 300:
                            return result
                    else:
                        serialized = jsonable_encoder(result)
                        json_str = json.dumps(serialized)
                        await set_cached_value(cache_key, json_str, ttl=ttl)
            except Exception as e:
                logger.warning(f"[Cache] Serialization error for {cache_key}: {e}")

            return result

        return wrapper
    return decorator


async def invalidate_cache_prefix(prefix: str) -> int:
    """
    Asynchronously deletes all matching keys in Redis (via SCAN + DEL)
    and clears matching keys in the fallback TTLCache.
    """
    cleared_count = 0

    # 1. Clear matching keys in fallback TTLCache
    matching_mem_keys = [
        k for k in list(fallback_cache.keys())
        if k.startswith(f"{prefix}:") or k == prefix
    ]
    for k in matching_mem_keys:
        fallback_cache.pop(k, None)
    cleared_count += len(matching_mem_keys)

    # 2. Clear matching keys in Redis via SCAN + DEL
    client = await get_redis_client()
    if client:
        try:
            redis_keys: List[str] = []
            async for k in client.scan_iter(match=f"{prefix}:*", count=100):
                redis_keys.append(k)
            if redis_keys:
                deleted = await client.delete(*redis_keys)
                cleared_count += deleted
                logger.info(f"[Cache] Evicted {deleted} Redis keys matching '{prefix}:*'")
        except Exception as e:
            logger.warning(f"[Cache] Redis key eviction failed for prefix '{prefix}': {e}")

    logger.debug(f"[Cache] Invalidated prefix '{prefix}' ({cleared_count} keys removed)")
    return cleared_count


def invalidate_cache_prefix_sync(prefix: str) -> int:
    """
    Synchronous helper to invalidate matching keys in fallback TTLCache
    and schedule/run Redis eviction if active event loop exists.
    """
    cleared_count = 0
    matching_mem_keys = [
        k for k in list(fallback_cache.keys())
        if k.startswith(f"{prefix}:") or k == prefix
    ]
    for k in matching_mem_keys:
        fallback_cache.pop(k, None)
    cleared_count += len(matching_mem_keys)

    redis_url = getattr(settings, "REDIS_URL", None) or os.getenv("REDIS_URL", "")
    if redis_url and redis_url.strip():
        try:
            loop = asyncio.get_running_loop()
            if loop.is_running():
                asyncio.create_task(invalidate_cache_prefix(prefix))
        except RuntimeError:
            pass

    return cleared_count
