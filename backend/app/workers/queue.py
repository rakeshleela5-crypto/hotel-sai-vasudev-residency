"""
Persistent Job Queue with Redis/arq and Graceful In-Memory Fallback (#38, #39).
Provides:
  - enqueue_task: Asynchronously enqueues a background job via arq (Redis) or falls back to FastAPI BackgroundTasks
  - enqueue_task_sync: Synchronous helper for non-async route handlers
  - run_task_with_retry: Robust execution wrapper with max_tries=3 and exponential backoff
"""

import os
import sys
import time
import asyncio
import logging
import threading
from typing import Callable, Any, Optional, Union, Dict

from fastapi import BackgroundTasks
from app.config import settings
from app.workers.tasks import (
    reconcile_decentro_webhook_task,
    generate_and_upload_invoice_pdf_task
)

logger = logging.getLogger("pms_queue")

# Global arq Redis pool instance
_arq_pool = None
_pool_lock = asyncio.Lock() if sys.version_info >= (3, 10) else None

# Registered background task functions
TASK_REGISTRY: Dict[str, Callable] = {
    "reconcile_decentro_webhook_task": reconcile_decentro_webhook_task,
    "generate_and_upload_invoice_pdf_task": generate_and_upload_invoice_pdf_task,
    "process_decentro_webhook_background": reconcile_decentro_webhook_task
}

def register_task(name: str, fn: Callable):
    """Registers a task function into the global registry."""
    TASK_REGISTRY[name] = fn

def _resolve_task_func(task_func: Union[Callable, str]) -> tuple[str, Callable]:
    """Resolves task name and callable from either function or string name."""
    if isinstance(task_func, str):
        name = task_func
        fn = TASK_REGISTRY.get(name)
        if not fn:
            raise ValueError(f"Task '{name}' is not registered in TASK_REGISTRY.")
        return name, fn
    elif callable(task_func):
        name = getattr(task_func, "__name__", str(task_func))
        if name not in TASK_REGISTRY:
            TASK_REGISTRY[name] = task_func
        return name, task_func
    else:
        raise TypeError(f"Invalid task_func type: {type(task_func)}. Must be callable or string.")

def run_task_with_retry(
    fn: Callable,
    *args,
    max_tries: int = 3,
    initial_delay: float = 0.3,
    **kwargs
) -> Any:
    """
    Executes a task function with exponential backoff up to max_tries.
    Handles both synchronous and asynchronous functions seamlessly.
    """
    delay = initial_delay
    last_exc = None

    for attempt in range(1, max_tries + 1):
        try:
            import inspect
            if inspect.iscoroutinefunction(fn):
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    loop = None

                if loop and loop.is_running():
                    import concurrent.futures
                    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                        return executor.submit(asyncio.run, fn(*args, **kwargs)).result()
                else:
                    return asyncio.run(fn(*args, **kwargs))
            else:
                return fn(*args, **kwargs)
        except Exception as exc:
            last_exc = exc
            fn_name = getattr(fn, "__name__", str(fn))
            logger.warning(
                f"[Queue Worker Retry] Attempt {attempt}/{max_tries} for task '{fn_name}' failed: {exc}"
            )
            if attempt < max_tries:
                time.sleep(delay)
                delay *= 2

    fn_name = getattr(fn, "__name__", str(fn))
    logger.error(
        f"[Queue Worker Exhausted] Task '{fn_name}' failed after {max_tries} retries: {last_exc}"
    )
    raise last_exc

async def get_arq_redis_pool():
    """
    Lazily creates and caches an arq Redis connection pool.
    Returns None if REDIS_URL is not set or Redis is unreachable.
    """
    global _arq_pool
    if _arq_pool is not None:
        return _arq_pool

    redis_url = os.getenv("REDIS_URL") or getattr(settings, "REDIS_URL", "")
    if not redis_url or not redis_url.strip():
        return None

    try:
        from arq.connections import create_pool, RedisSettings
        # Timeout quickly (1.5s) if Redis is down/unreachable
        settings_obj = RedisSettings.from_dsn(redis_url.strip())
        pool = await asyncio.wait_for(create_pool(settings_obj), timeout=1.5)
        _arq_pool = pool
        logger.info("[arq Queue] Connected to Redis background queue.")
        return _arq_pool
    except Exception as exc:
        logger.warning(f"[arq Queue] Could not connect to Redis pool ({exc}). Falling back to native BackgroundTasks.")
        _arq_pool = None
        return None

async def close_arq_pool():
    """Closes the active arq Redis pool."""
    global _arq_pool
    if _arq_pool is not None:
        try:
            await _arq_pool.close()
        except Exception:
            pass
        _arq_pool = None

async def enqueue_task(
    task_func: Union[Callable, str],
    *args,
    background_tasks: Optional[BackgroundTasks] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Dispatches task to Redis arq queue if REDIS_URL is configured and available.
    Automatically falls back to FastAPI BackgroundTasks with retry wrapper (max_tries=3)
    if REDIS_URL is not set or unreachable.
    """
    task_name, callable_fn = _resolve_task_func(task_func)
    pool = await get_arq_redis_pool()

    if pool is not None:
        try:
            job = await pool.enqueue_job(task_name, *args, **kwargs)
            logger.info(f"[arq Queue] Task '{task_name}' enqueued to Redis. Job ID: {getattr(job, 'job_id', 'unknown')}")
            return {
                "status": "queued",
                "backend": "redis_arq",
                "task": task_name,
                "job_id": getattr(job, "job_id", None)
            }
        except Exception as q_err:
            logger.warning(f"[arq Queue] Enqueue error ({q_err}). Falling back to BackgroundTasks.")

    # Graceful Fallback: Native BackgroundTasks or daemon thread
    if background_tasks is not None:
        background_tasks.add_task(run_task_with_retry, callable_fn, *args, **kwargs)
        logger.info(f"[Queue Fallback] Task '{task_name}' scheduled in FastAPI BackgroundTasks.")
        return {
            "status": "queued",
            "backend": "background_tasks",
            "task": task_name
        }
    else:
        # Standalone daemon thread for non-FastAPI request contexts
        t = threading.Thread(
            target=run_task_with_retry,
            args=(callable_fn, *args),
            kwargs=kwargs,
            daemon=True
        )
        t.start()
        logger.info(f"[Queue Fallback] Task '{task_name}' launched in background thread.")
        return {
            "status": "queued",
            "backend": "in_memory_thread",
            "task": task_name
        }

def enqueue_task_sync(
    task_func: Union[Callable, str],
    *args,
    background_tasks: Optional[BackgroundTasks] = None,
    **kwargs
) -> Dict[str, Any]:
    """Synchronous helper for dispatching background tasks from sync route handlers."""
    task_name, callable_fn = _resolve_task_func(task_func)
    if background_tasks is not None:
        background_tasks.add_task(run_task_with_retry, callable_fn, *args, **kwargs)
        return {
            "status": "queued",
            "backend": "background_tasks",
            "task": task_name
        }
    else:
        t = threading.Thread(
            target=run_task_with_retry,
            args=(callable_fn, *args),
            kwargs=kwargs,
            daemon=True
        )
        t.start()
        return {
            "status": "queued",
            "backend": "in_memory_thread",
            "task": task_name
        }
