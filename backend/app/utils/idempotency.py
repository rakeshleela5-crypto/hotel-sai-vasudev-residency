import json
import hashlib
import datetime
import logging
from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.concurrency import iterate_in_threadpool
from fastapi import Request, HTTPException, Depends, Response
from sqlalchemy.orm import Session

from app.database import SessionLocal, get_db
from app import models
from app.utils.timezone import now_utc

logger = logging.getLogger("pms_idempotency")

class IdempotentResponseException(Exception):
    """
    Raised when an idempotent request has a cached response.
    Caught by FastAPI exception handler to return the exact cached response.
    """
    def __init__(self, status_code: int, content: str, headers: Optional[dict] = None):
        self.status_code = status_code
        self.content = content
        self.headers = headers or {}

async def idempotent_exception_handler(request: Request, exc: IdempotentResponseException):
    return Response(
        content=exc.content,
        status_code=exc.status_code,
        media_type="application/json",
        headers={
            "X-Idempotency-Cache": "HIT",
            **exc.headers
        }
    )

def cleanup_expired_idempotency_keys(db: Session, ttl_hours: int = 24) -> int:
    """Removes idempotency keys older than ttl_hours (#1)."""
    try:
        cutoff = now_utc() - datetime.timedelta(hours=ttl_hours)
        deleted = db.query(models.IdempotencyKey).filter(
            models.IdempotencyKey.created_at < cutoff
        ).delete(synchronize_session=False)
        db.commit()
        return deleted
    except Exception as e:
        logger.warning(f"[Idempotency] TTL cleanup notice: {e}")
        db.rollback()
        return 0

async def require_idempotency_key(
    request: Request,
    db: Session = Depends(get_db)
) -> str:
    """
    FastAPI dependency (#1):
    1. Extracts 'X-Idempotency-Key' from headers.
    2. Hashes request body using SHA-256.
    3. Checks idempotency_keys table:
       - If already processed: returns cached response via IdempotentResponseException.
       - If currently in progress: raises 409 Conflict.
       - If key reused with different payload: raises 409 Conflict.
    4. If new: inserts in-flight lock record and sets request.state.idempotency_key.
    """
    key = request.headers.get("X-Idempotency-Key") or request.headers.get("Idempotency-Key")
    if not key:
        raise HTTPException(
            status_code=400,
            detail="X-Idempotency-Key header is required for this transactional operation (#1)."
        )

    clean_key = key.strip()
    if len(clean_key) < 4:
        raise HTTPException(
            status_code=400,
            detail="Invalid X-Idempotency-Key: must be at least 4 characters."
        )

    # 1. Compute request hash
    body_bytes = await request.body()
    request_hash = hashlib.sha256(body_bytes).hexdigest()

    # 2. Lazy cleanup of expired keys (older than 24 hours)
    cleanup_expired_idempotency_keys(db, ttl_hours=24)

    # 3. Query existing key
    record = db.query(models.IdempotencyKey).filter(
        models.IdempotencyKey.key == clean_key
    ).first()

    if record:
        # Check payload integrity
        if record.request_hash != request_hash:
            logger.warning(f"[Idempotency] Conflict: Key '{clean_key}' reused with mismatched payload.")
            raise HTTPException(
                status_code=409,
                detail="Idempotency Conflict: Key already used with a different request payload."
            )

        # Check if already completed
        if record.response_body is not None:
            logger.info(f"[Idempotency] Hit: Returning cached response for key '{clean_key}'.")
            raise IdempotentResponseException(
                status_code=record.response_status or 200,
                content=record.response_body
            )
        else:
            # Still in-flight (concurrent duplicate / double click)
            logger.warning(f"[Idempotency] Double-click detected: Key '{clean_key}' currently processing.")
            raise HTTPException(
                status_code=409,
                detail="Concurrent Request: A request with this idempotency key is already in progress."
            )

    # 4. First-time request: insert in-flight record
    new_record = models.IdempotencyKey(
        key=clean_key,
        endpoint=request.url.path,
        request_hash=request_hash,
        response_status=None,
        response_body=None,
        created_at=now_utc()
    )
    db.add(new_record)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        # Handle race condition where two requests inserted at identical millisecond
        existing = db.query(models.IdempotencyKey).filter(models.IdempotencyKey.key == clean_key).first()
        if existing and existing.response_body:
            raise IdempotentResponseException(
                status_code=existing.response_status or 200,
                content=existing.response_body
            )
        raise HTTPException(
            status_code=409,
            detail="Concurrent Request: A request with this idempotency key is already in progress."
        )

    # Mark request state so middleware records response
    request.state.idempotency_key = clean_key
    request.state.idempotency_hash = request_hash
    return clean_key

def save_idempotency_response(
    key: str,
    status_code: int,
    response_body: str,
    db: Optional[Session] = None
):
    """Direct helper to persist the finished response into idempotency_keys."""
    own_session = False
    if db is None:
        db = SessionLocal()
        own_session = True

    try:
        record = db.query(models.IdempotencyKey).filter(models.IdempotencyKey.key == key).first()
        if record:
            record.response_status = status_code
            record.response_body = response_body
            db.commit()
    except Exception as exc:
        logger.warning(f"[Idempotency] Failed saving response for {key}: {exc}")
        db.rollback()
    finally:
        if own_session:
            db.close()

class IdempotencyMiddleware(BaseHTTPMiddleware):
    """
    Middleware that captures the completed response for requests marked
    with request.state.idempotency_key and persists them into the database.
    """
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
        except Exception as exc:
            # If an unhandled exception occurred, remove in-flight key so client can retry
            idemp_key = getattr(request.state, "idempotency_key", None)
            if idemp_key:
                with SessionLocal() as db:
                    db.query(models.IdempotencyKey).filter(models.IdempotencyKey.key == idemp_key).delete()
                    db.commit()
            raise exc

        idemp_key = getattr(request.state, "idempotency_key", None)
        if idemp_key and response.status_code < 500:
            # Capture response body
            body_chunks = []
            async for chunk in response.body_iterator:
                body_chunks.append(chunk)

            full_body = b"".join(body_chunks)
            # Reconstruct response iterator
            response.body_iterator = iterate_in_threadpool(iter([full_body]))

            try:
                body_str = full_body.decode("utf-8")
                save_idempotency_response(idemp_key, response.status_code, body_str)
            except Exception as e:
                logger.warning(f"[Idempotency] Could not decode/save body for {idemp_key}: {e}")

        return response
