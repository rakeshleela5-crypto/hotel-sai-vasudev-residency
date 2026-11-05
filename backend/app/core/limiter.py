"""
Core Rate Limiting & Concurrency Control Module (#2, #18, #56).
Provides:
  - SlowAPI Limiter configured with get_remote_address
  - Clean HTTP 429 JSON error response handler
  - Concurrency Limiter Semaphore(20) dependency for heavy PDF / report generation
  - Standardized rate limit constants
"""

import asyncio
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

# Standardized rate limit thresholds
RATE_LIMIT_LOGIN: str = "15/minute"
RATE_LIMIT_GENERAL: str = "60/minute"
RATE_LIMIT_WEBHOOK: str = "120/minute"
RATE_LIMIT_KOT: str = "120/minute"
RATE_LIMIT_QR: str = "60/minute"
RATE_LIMIT_BOOKING: str = "60/minute"
RATE_LIMIT_DEFAULT: str = "60/minute"

def get_client_ip(request: Request) -> str:
    """Extracts client IP, respecting X-Forwarded-For and Cloudflare CF-Connecting-IP, falling back to remote_address."""
    if not request:
        return "127.0.0.1"
    headers = getattr(request, "headers", {}) or {}
    cf_ip = headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()
    x_forwarded = headers.get("X-Forwarded-For")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return get_remote_address(request) or "127.0.0.1"

# Global SlowAPI Limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[RATE_LIMIT_GENERAL],
    storage_uri="memory://"
)

def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Returns a clean 429 JSON error response with detailed message."""
    detail_msg = getattr(exc, "detail", "Too many requests")
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": f"Too many requests: {detail_msg}",
            "detail": f"Rate limit exceeded: {detail_msg}"
        }
    )

# Max 20 concurrent heavy operations (PDF generation, bulk reporting, R2 sync)
pdf_semaphore = asyncio.Semaphore(20)

async def limit_concurrency():
    """
    FastAPI dependency guarding heavy PDF generation and bulk reporting endpoints.
    Allows up to 20 concurrent executions. If the semaphore is exhausted or cannot
    be acquired within timeout, raises HTTP 429 to protect container memory from exhaustion.
    """
    if pdf_semaphore._value <= 0:
        raise HTTPException(
            status_code=429,
            detail="Too many concurrent report/PDF generation requests. Please try again shortly."
        )

    acquired = False
    try:
        try:
            loop = asyncio.get_running_loop()
            await asyncio.wait_for(pdf_semaphore.acquire(), timeout=2.0)
        except RuntimeError:
            pdf_semaphore._value -= 1
        acquired = True
        yield
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=429,
            detail="Too many concurrent report/PDF generation requests. Please try again shortly."
        )
    finally:
        if acquired:
            try:
                pdf_semaphore.release()
            except ValueError:
                pdf_semaphore._value += 1

# Aliases for convenience and backward compatibility
concurrency_limiter = limit_concurrency
pdf_concurrency_limiter = limit_concurrency
