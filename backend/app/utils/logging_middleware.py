import asyncio
import datetime
import json
import logging
import time
import traceback
import uuid
from typing import Callable
import httpx
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

from app.config import settings

logger = logging.getLogger("pms_observability")

SENSITIVE_FIELD_PATTERNS = ["secret", "signature", "token", "password", "key", "authorization"]
SENSITIVE_ACCOUNT_PATTERNS = ["account_number", "virtual_account_number", "payee_account", "aadhaar", "pan"]

def mask_sensitive_value(key: str, val: Any) -> Any:
    """Masks secrets, tokens, credentials, and full account numbers for privacy and PCI compliance (#79)."""
    if not isinstance(val, str) or not val:
        return val
    key_lower = str(key).lower()
    if any(p in key_lower for p in SENSITIVE_FIELD_PATTERNS):
        if len(val) > 8:
            return f"{val[:3]}...{val[-3:]}"
        return "***MASKED***"
    if any(p in key_lower for p in SENSITIVE_ACCOUNT_PATTERNS):
        if len(val) > 4:
            return f"{val[:2]}****{val[-4:]}"
        return "****"
    return val

def mask_sensitive_dict(data: Any) -> Any:
    """Recursively masks sensitive dictionaries and lists."""
    if isinstance(data, dict):
        return {k: (mask_sensitive_dict(v) if isinstance(v, (dict, list)) else mask_sensitive_value(k, v)) for k, v in data.items()}
    elif isinstance(data, list):
        return [mask_sensitive_dict(item) for item in data]
    return data


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """
    Structured JSON Logging Middleware with X-Request-ID correlation (#100).
    Injects or propagates X-Request-ID across the entire request/response lifecycle.
    Logs request latency in milliseconds, method, route path, client IP, and HTTP status code.
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Extract existing X-Request-ID header or generate fresh UUID
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = f"req_{uuid.uuid4().hex[:16]}"

        request.state.request_id = request_id
        start_time = time.perf_counter()

        client_ip = request.headers.get("CF-Connecting-IP") or \
                    request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or \
                    (request.client.host if request.client else "unknown")

        # Masked audit logging for incoming Decentro webhooks (#79)
        path = request.url.path
        if "decentro" in path and "webhook" in path:
            try:
                body_bytes = await request.body()
                async def receive():
                    return {"type": "http.request", "body": body_bytes}
                request = Request(request.scope, receive=receive)
                masked_payload = {}
                if body_bytes:
                    try:
                        raw_json = json.loads(body_bytes.decode('utf-8'))
                        masked_payload = mask_sensitive_dict(raw_json)
                    except Exception:
                        masked_payload = {"raw_size": len(body_bytes)}

                masked_headers = {}
                for h_key, h_val in request.headers.items():
                    masked_headers[h_key] = mask_sensitive_value(h_key, h_val)

                logger.info(json.dumps({
                    "event": "DECENTRO_INBOUND_WEBHOOK_RECEIVED",
                    "request_id": request_id,
                    "method": request.method,
                    "path": path,
                    "client_ip": client_ip,
                    "headers": masked_headers,
                    "payload": masked_payload,
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
                }))
            except Exception as w_err:
                logger.debug(f"[LoggingMiddleware] Webhook inspection note: {w_err}")


        try:
            response = await call_next(request)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

            # Invariant: always propagate X-Request-ID on outbound response headers
            response.headers["X-Request-ID"] = request_id

            # Emit single-line structured JSON access log
            log_entry = {
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "level": "INFO",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "client_ip": client_ip
            }
            logger.info(json.dumps(log_entry))
            return response

        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            # Log failure with request ID
            err_log = {
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "level": "ERROR",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "duration_ms": duration_ms,
                "client_ip": client_ip,
                "error": str(exc),
                "error_type": exc.__class__.__name__
            }
            logger.error(json.dumps(err_log))
            return await global_500_exception_handler(request, exc)


async def dispatch_error_webhook_alert(alert_payload: dict):
    """
    Asynchronously fires an alert notification to the configured webhook endpoint (#101, #103, #104).
    Non-blocking: failures to deliver alert webhook do not crash or stall HTTP responses.
    """
    webhook_url = settings.ALERT_WEBHOOK_URL
    if not webhook_url:
        logger.debug("[AlertWebhook] ALERT_WEBHOOK_URL not configured. Webhook alert skipped.")
        return

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.post(webhook_url, json=alert_payload)
            logger.info(f"[AlertWebhook] Dispatched critical error alert: status={res.status_code}")
    except Exception as exc:
        logger.warning(f"[AlertWebhook] Failed to deliver alert webhook: {exc}")


async def global_500_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global 500 Unhandled Exception Handler (#101, #103, #104).
    1. Captures correlation X-Request-ID.
    2. Emits detailed structured CRITICAL log with truncated stacktrace.
    3. Asynchronously triggers webhook alert notification.
    4. Returns sanitized, safe 500 JSON response to the client.
    """
    request_id = getattr(request.state, "request_id", None) or request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:16]}"
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    tb_str = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))[:2000]

    alert_payload = {
        "alert": "CRITICAL_500_SERVER_ERROR",
        "service": "hotel-sai-vasudev-backend",
        "version": settings.VERSION,
        "request_id": request_id,
        "method": request.method,
        "path": str(request.url),
        "error_type": exc.__class__.__name__,
        "error_message": str(exc),
        "traceback": tb_str,
        "timestamp": now_iso
    }

    # Log critical error structured JSON
    logger.critical(f"[CRITICAL_500_ALERT] {json.dumps(alert_payload)}")

    # Schedule non-blocking webhook alert
    try:
        asyncio.create_task(dispatch_error_webhook_alert(alert_payload))
    except Exception as e:
        logger.debug(f"[AlertWebhook] Could not create async alert task: {e}")

    # Return clean sanitized error response
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error. Please provide Request ID to Front Desk technical support.",
            "request_id": request_id,
            "timestamp": now_iso
        },
        headers={"X-Request-ID": request_id}
    )
