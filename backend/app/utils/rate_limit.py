"""
Rate Limiting Configuration using slowapi (#2, #18).
Enforces strict rate limits on sensitive endpoints:
  - Login & Authentication: 5/minute (#18)
  - Public Booking Engine: 10/minute (#18)
  - Default API Routes: 60/minute
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse
from app.config import settings

def get_client_ip(request: Request) -> str:
    """Extracts client IP, respecting X-Forwarded-For and Cloudflare CF-Connecting-IP, with get_remote_address fallback."""
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()
    x_forwarded = request.headers.get("X-Forwarded-For")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return get_remote_address(request) or "127.0.0.1"

# Configure Limiter with get_remote_address
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.RATE_LIMIT_DEFAULT],
    storage_uri="memory://"
)

def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Returns a clean 429 JSON error response."""
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": f"Too many requests: {exc.detail}",
            "detail": f"Rate limit exceeded: {exc.detail}"
        }
    )

