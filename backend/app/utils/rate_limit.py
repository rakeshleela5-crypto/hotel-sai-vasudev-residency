"""
Rate Limiting & Concurrency Compatibility Layer (#2, #18, #56).
Re-exports canonical components from app.core.limiter for complete backward compatibility.
"""

from app.core.limiter import (
    limiter,
    rate_limit_exceeded_handler,
    get_client_ip,
    limit_concurrency,
    pdf_semaphore,
    concurrency_limiter,
    pdf_concurrency_limiter,
    RATE_LIMIT_LOGIN,
    RATE_LIMIT_GENERAL,
    RATE_LIMIT_WEBHOOK,
    RATE_LIMIT_KOT,
    RATE_LIMIT_QR,
    RATE_LIMIT_BOOKING,
    RATE_LIMIT_DEFAULT
)
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
