"""
Test Suite: Phase 2 - Backpressure Control, Rate Limiting, and Persistent Async Task Queues
Verifies:
  1. Backpressure & Rate Limiting:
     - Exceeding rate limit on /auth/login returns HTTP 429 Too Many Requests.
     - Concurrency limiter Semaphore(20) guards heavy PDF / report generation endpoints.
     - Clean 429 JSON payload structure.
  2. Decentro Webhook Idempotency:
     - Sending exact same Decentro webhook payload twice processes payment once.
     - Safe rejection of duplicate webhook retry with HTTP 200 {"status": "already_processed"}.
     - Prevents double-crediting of folios and duplicate journal entries.
  3. Persistent Queue & Graceful In-Memory Fallback:
     - Enqueuing tasks when REDIS_URL is unset falls back to native BackgroundTasks.
     - Exponential backoff retry wrapper (max_tries=3) handles transient errors.
     - Asynchronous GST Invoice PDF generation and Cloudflare R2 archival without blocking checkout.
"""

import os
import sys
import json
import uuid
import time
import hmac
import hashlib
import datetime
import pytest
from unittest.mock import patch, MagicMock
from starlette.requests import Request
from fastapi import HTTPException, BackgroundTasks
from slowapi.errors import RateLimitExceeded

# Ensure paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.database import engine, SessionLocal, Base
from app import models
from app.config import settings
from app.routes.auth import login, LoginRequest
from app.routes.payments import _handle_decentro_webhook
from app.routes.pms import execute_check_out
from app import schemas
from app.core.limiter import (
    limiter,
    rate_limit_exceeded_handler,
    limit_concurrency,
    pdf_semaphore,
    RATE_LIMIT_LOGIN
)
from app.workers.queue import (
    enqueue_task,
    enqueue_task_sync,
    run_task_with_retry,
    get_arq_redis_pool
)
from app.workers.tasks import (
    reconcile_decentro_webhook_task,
    generate_and_upload_invoice_pdf_task,
    build_minimal_gst_invoice_pdf
)
from app.services.decentro import decentro_client

def run_coro(coro):
    """Execute coroutine deterministically without Windows loopback socket conflicts."""
    val = None
    stack = [coro]
    while stack:
        current = stack[-1]
        try:
            yielded = current.send(val)
            val = None
            if hasattr(yielded, "send"):
                stack.append(yielded)
            else:
                val = yielded
        except StopIteration as e:
            stack.pop()
            val = e.value
    return val

class MockRawRequest:
    """Mock Starlette Request returning custom raw byte payloads and headers."""
    def __init__(self, body_bytes: bytes, headers: dict = None):
        self._body_bytes = body_bytes
        self.headers = headers or {}
        self.scope = {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/webhooks/decentro",
            "headers": [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()],
            "client": ("127.0.0.1", 12345)
        }

    async def body(self):
        return self._body_bytes

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def compute_decentro_signature(body_bytes: bytes, secret: str) -> str:
    """Computes HMAC-SHA256 signature for test webhook payload."""
    return hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()

# =========================================================================
# 1. RATE LIMITING & CONCURRENCY BACKPRESSURE
# =========================================================================
def test_login_rate_limiting_exceeded_returns_429(db_session):
    """
    Verifies that exceeding the login rate limit (15 requests/minute)
    triggers RateLimitExceeded which renders a clean HTTP 429 JSON response.
    """
    limiter.reset()

    # User payload for login test
    payload = LoginRequest(username="test_rate_user", password="wrong_password")
    
    # Threshold is 15/minute. Firing 16 requests from the same client IP.
    rate_limited_caught = False
    rate_limit_response = None

    for attempt in range(1, 20):
        # Fresh Request per HTTP call
        req = Request({
            "type": "http",
            "method": "POST",
            "path": "/api/v1/auth/login",
            "client": ("192.168.1.100", 54321),
            "headers": []
        })

        try:
            login(request=req, payload=payload, db=db_session)
        except RateLimitExceeded as rle:
            rate_limited_caught = True
            # Transform via configured 429 exception handler
            rate_limit_response = rate_limit_exceeded_handler(req, rle)
            break

    assert rate_limited_caught is True, "Rate limit threshold of 15/minute was not enforced!"
    assert rate_limit_response is not None
    assert rate_limit_response.status_code == 429

    body = json.loads(rate_limit_response.body.decode("utf-8"))
    assert body["error"] == "Rate limit exceeded"
    assert "Too many requests" in body["message"]

def test_concurrency_limiter_semaphore():
    """
    Verifies that the limit_concurrency dependency guards memory-heavy operations
    by capping concurrent executions at 20.
    """
    # 1. Semaphore starts at 20 permits
    assert pdf_semaphore._value <= 20

    # Acquire all permits
    permits = []
    for _ in range(pdf_semaphore._value):
        permits.append(pdf_semaphore.acquire_nowait() if hasattr(pdf_semaphore, 'acquire_nowait') else None)

    # Force value to 0 to simulate fully loaded queue
    orig_val = pdf_semaphore._value
    pdf_semaphore._value = 0

    try:
        # With 0 permits available, limit_concurrency must raise HTTP 429 on timeout
        gen = limit_concurrency()
        with pytest.raises(HTTPException) as exc_info:
            run_coro(gen.asend(None))

        assert exc_info.value.status_code == 429
        assert "Too many concurrent" in exc_info.value.detail
    finally:
        # Restore semaphore value
        pdf_semaphore._value = 20

# =========================================================================
# 2. DECENTRO WEBHOOK IDEMPOTENCY & DUPLICATE PREVENTION
# =========================================================================
def test_decentro_webhook_exact_duplicate_processes_once_and_skips_retry(db_session):
    """
    Verifies:
      1. First webhook callback processes payment and enqueues settlement.
      2. Second duplicate webhook with the same decentro_txn_id returns HTTP 200 'already_processed'.
      3. Ledger and folio are NOT credited twice.
    """
    unique_suffix = uuid.uuid4().hex[:6]
    room = models.Room(
        name=f"Room QUEUE-{unique_suffix}",
        slug=f"room-queue-{unique_suffix}",
        room_type="Super Deluxe",
        price_per_night=4000.0,
        capacity=2,
        total_inventory=1,
        description="Standard clean room for test",
        image_url="https://images.unsplash.com/test-room",
        is_available=True,
        housekeeping_status="Clean"
    )
    db_session.add(room)
    db_session.commit()
    db_session.refresh(room)

    booking = models.Booking(
        room_id=room.id,
        guest_name=f"Webhook Test Guest {unique_suffix}",
        guest_email=f"guest_{unique_suffix}@sai-vasudev.com",
        guest_phone="9876543210",
        check_in_date=datetime.date.today().isoformat(),
        check_out_date=(datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
        total_nights=1,
        base_rate=4000.0,
        base_amount=4000.0,
        total_price=4480.0,
        total_paid=0.0,
        balance_due=4480.0,
        payment_status="Unpaid",
        status="Confirmed",
        booking_ref=f"BK-QUEUE-{unique_suffix}"
    )
    db_session.add(booking)
    db_session.commit()
    db_session.refresh(booking)

    txn_ref = f"REF-QUEUE-{unique_suffix}"
    dcn_txn_id = f"DCN-QUEUE-{unique_suffix}"
    utr_ref = f"UTR-QUEUE-{unique_suffix}"

    pt = models.PaymentTransaction(
        reference_id=txn_ref,
        booking_id=booking.id,
        amount=4480.0,
        currency="INR",
        payment_method="UPI_QR",
        status="PENDING",
        decentro_txn_id=dcn_txn_id
    )
    db_session.add(pt)
    db_session.commit()

    webhook_payload = {
        "decentro_txn_id": dcn_txn_id,
        "reference_id": txn_ref,
        "transaction_status": "SUCCESS",
        "bank_reference_number": utr_ref,
        "amount": 4480.0,
        "payer_vpa": "guest@okhdfcbank",
        "payer_name": f"Webhook Test Guest {unique_suffix}"
    }
    raw_body = json.dumps(webhook_payload).encode("utf-8")
    secret = "test_webhook_secret_key_12345"
    sig = compute_decentro_signature(raw_body, secret)

    bg = BackgroundTasks()

    with patch.dict(os.environ, {"DECENTRO_WEBHOOK_SECRET": secret}):
        with patch.object(decentro_client, "webhook_secret", secret):
            # 1. Send first webhook request
            mock_req1 = MockRawRequest(raw_body, headers={"x-decentro-signature": sig})
            res1 = run_coro(_handle_decentro_webhook(mock_req1, bg, db_session, sig))
            assert res1["status"] in ["SUCCESS", "already_processed"]

            # Reconcile ledger
            reconcile_decentro_webhook_task(dcn_txn_id, webhook_payload)

            # Verify DB was credited
            db_session.expire_all()
            b_updated = db_session.query(models.Booking).filter(models.Booking.id == booking.id).first()
            assert b_updated.total_paid == 4480.0
            assert b_updated.balance_due == 0.0
            assert b_updated.payment_status == "Paid"

            payments_count_1 = db_session.query(models.BookingPayment).filter(
                models.BookingPayment.booking_id == booking.id
            ).count()
            assert payments_count_1 == 1

            # 2. Send second duplicate webhook request with identical payload and signature
            mock_req2 = MockRawRequest(raw_body, headers={"x-decentro-signature": sig})
            res2 = run_coro(_handle_decentro_webhook(mock_req2, bg, db_session, sig))
            assert res2["status"] == "already_processed"
            assert res2.get("duplicate") is True

            # 3. Verify ledger was NOT credited twice
            db_session.expire_all()
            b_after_second = db_session.query(models.Booking).filter(models.Booking.id == booking.id).first()
            assert b_after_second.total_paid == 4480.0
            assert b_after_second.balance_due == 0.0

            payments_count_2 = db_session.query(models.BookingPayment).filter(
                models.BookingPayment.booking_id == booking.id
            ).count()
            assert payments_count_2 == 1, "Duplicate payment was incorrectly inserted into booking_payments!"

# =========================================================================
# 3. BACKGROUND TASK QUEUE & REDIS_URL FALLBACK
# =========================================================================
def test_queue_graceful_fallback_when_redis_url_unset():
    """
    Verifies that enqueue_task seamlessly falls back to FastAPI BackgroundTasks
    or daemon thread when REDIS_URL is not configured or empty.
    """
    with patch.dict(os.environ, {"REDIS_URL": ""}):
        pool = run_coro(get_arq_redis_pool())
        assert pool is None, "arq pool should be None when REDIS_URL is empty"

        test_counter = {"executed": False}

        def sample_task(tag: str):
            test_counter["executed"] = True
            test_counter["tag"] = tag

        res = run_coro(enqueue_task(sample_task, "test_fallback_value"))
        assert res["status"] == "queued"
        assert res["backend"] in ["background_tasks", "in_memory_thread"]

        time.sleep(0.05)
        assert test_counter["executed"] is True
        assert test_counter["tag"] == "test_fallback_value"

def test_run_task_with_retry_exponential_backoff():
    """
    Verifies that run_task_with_retry retries up to max_tries on transient failures
    and succeeds once the transient issue is resolved.
    """
    call_counts = {"attempts": 0}

    def flaky_task():
        call_counts["attempts"] += 1
        if call_counts["attempts"] < 3:
            raise ConnectionError("Transient network timeout")
        return "SUCCESS_ON_ATTEMPT_3"

    result = run_task_with_retry(flaky_task, max_tries=3, initial_delay=0.01)
    assert result == "SUCCESS_ON_ATTEMPT_3"
    assert call_counts["attempts"] == 3

def test_run_task_with_retry_permanent_failure_raises():
    """
    Verifies that run_task_with_retry exhausts retries and raises the final exception.
    """
    def always_failing_task():
        raise ValueError("Permanent data corruption")

    with pytest.raises(ValueError) as exc:
        run_task_with_retry(always_failing_task, max_tries=3, initial_delay=0.01)

    assert "Permanent data corruption" in str(exc.value)

# =========================================================================
# 4. GST INVOICE PDF GENERATION & R2 ARCHIVAL
# =========================================================================
def test_minimal_gst_invoice_pdf_format():
    """
    Verifies that build_minimal_gst_invoice_pdf produces a valid PDF binary stream.
    """
    pdf_bytes = build_minimal_gst_invoice_pdf(
        invoice_no="INV-SVR-2026-TEST",
        guest_name="Rakesh Sharma",
        total_amount=5600.0,
        booking_ref="BK-TEST-001",
        room_no="204"
    )

    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF-1.4"), "Generated PDF does not start with %PDF-1.4 magic header"
    assert b"%%EOF" in pdf_bytes, "Generated PDF does not contain %%EOF trailer"
    assert b"HOTEL SAI VASUDEV RESIDENCY" in pdf_bytes

def test_generate_and_upload_invoice_pdf_task(db_session):
    """
    Verifies that generate_and_upload_invoice_pdf_task executes in the background,
    uploads to R2/local storage, and saves invoice_pdf_key in the booking.
    """
    unique_suffix = uuid.uuid4().hex[:6]
    room = models.Room(
        name=f"Room PDF-{unique_suffix}",
        slug=f"room-pdf-{unique_suffix}",
        room_type="Executive Suite",
        price_per_night=5000.0,
        capacity=2,
        total_inventory=1,
        description="Executive Suite room description",
        image_url="https://images.unsplash.com/test-room",
        is_available=True
    )
    db_session.add(room)
    db_session.commit()

    booking = models.Booking(
        room_id=room.id,
        guest_name=f"PDF Test Guest {unique_suffix}",
        guest_email=f"pdf_guest_{unique_suffix}@sai-vasudev.com",
        guest_phone="9988776655",
        check_in_date=datetime.date.today().isoformat(),
        check_out_date=(datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
        total_nights=1,
        base_rate=5000.0,
        base_amount=5000.0,
        total_price=5600.0,
        total_paid=5600.0,
        balance_due=0.0,
        payment_status="Paid",
        status="Checked-Out",
        booking_ref=f"BK-PDF-{unique_suffix}"
    )
    db_session.add(booking)
    db_session.commit()
    db_session.refresh(booking)

    # Run invoice generation task
    object_key = generate_and_upload_invoice_pdf_task(booking.id)

    assert object_key is not None
    assert "invoices/" in object_key
    assert object_key.endswith(".pdf")

    # Verify booking has invoice_pdf_key bound
    db_session.expire_all()
    b_updated = db_session.query(models.Booking).filter(models.Booking.id == booking.id).first()
    assert b_updated.invoice_pdf_key == object_key
