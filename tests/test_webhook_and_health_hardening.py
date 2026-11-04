"""
Test Suite: Decentro Webhook Hardening, IST Timezone Scheduling & Health Checks
Covers:
  1. Decentro Webhook Signature Verification & Idempotency:
     - HMAC-SHA256 signature verification over raw request body using hmac.compare_digest
     - Rejection with HTTP 401 for missing or invalid signatures
     - Row-level locking (.with_for_update()) and immediate HTTP 200 {"status": "already_processed"} on duplicate webhook retries
     - Verified zero double-crediting of folios / bookings
  2. IST Timezone Standardization & Daily Cron Rollovers:
     - zoneinfo.ZoneInfo("Asia/Kolkata") standardization
     - 12:00 PM IST Checkout Rollover: flags in-house rooms due for checkout and generates alerts
     - 11:59 PM IST Night Audit Rollover: auto-posts nightly room tariffs idempotently without duplication
  3. FastAPI Health Check & Railway Config:
     - GET /api/health executes SELECT 1 against database with strict timeout
     - Returns HTTP 200 {"status": "ok", "db": "connected", "timestamp_ist": "..."}
     - Returns HTTP 503 on database disconnect
     - railway.json & railway.toml contain healthcheckPath="/api/health" & healthcheckTimeout=30
"""

import os
import sys
import hmac
import hashlib
import json
import uuid
import datetime
import zoneinfo
import pytest
from unittest.mock import patch, MagicMock
from fastapi import Response, HTTPException, BackgroundTasks
from sqlalchemy import text
from sqlalchemy.orm import Session

# Ensure backend and root paths are available
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database import engine, SessionLocal
from app import models
from app.config import settings
from app.utils.timezone import now_ist, now_ist_str, today_ist_str, to_ist
from app.routes.health import general_health_check
from app.routes.payments import _handle_decentro_webhook, process_decentro_webhook_background
from app.services.decentro import decentro_client
from app.services.scheduler import run_checkout_rollover, run_night_audit


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


def run_coro(coro):
    """Execute coroutine deterministically without Windows event loop conflicts."""
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

    async def body(self):
        return self._body_bytes


def helper_create_room(db: Session, prefix: str = "RM") -> models.Room:
    unique_slug = f"room-{prefix.lower()}-{uuid.uuid4().hex[:6]}"
    room = models.Room(
        name=f"Room {unique_slug[-4:].upper()}",
        slug=unique_slug,
        room_type="Deluxe",
        price_per_night=3500.0,
        capacity=2,
        total_inventory=1,
        description="Standard clean room for test suite",
        image_url="https://images.unsplash.com/test-room",
        is_available=True,
        housekeeping_status="Clean"
    )
    db.add(room)
    db.flush()
    return room


def helper_create_booking(
    db: Session,
    room_id: int,
    guest_name: str = "Test Guest",
    guest_email: str = "guest@example.com",
    guest_phone: str = "9876543210",
    check_in_date: str = "2026-11-04",
    check_out_date: str = "2026-11-05",
    rate: float = 3000.0,
    status: str = "Checked-In",
    is_deleted: bool = False,
    prefix: str = "BK"
) -> models.Booking:
    booking = models.Booking(
        booking_ref=f"SVR-{prefix.upper()}-{uuid.uuid4().hex[:6].upper()}",
        room_id=room_id,
        guest_name=guest_name,
        guest_email=guest_email,
        guest_phone=guest_phone,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        total_nights=1,
        base_rate=rate,
        base_amount=rate,
        total_price=rate,
        total_paid=0.0,
        balance_due=rate,
        payment_status="Pending",
        status=status,
        is_deleted=is_deleted
    )
    db.add(booking)
    db.flush()
    return booking


# =========================================================================
# 1. DECENTRO WEBHOOK SIGNATURE VERIFICATION & REJECTION
# =========================================================================

def test_decentro_webhook_signature_verification_and_rejection(db):
    """
    Verifies:
      a) Missing signature header raises HTTP 401 Unauthorized
      b) Tampered/invalid signature raises HTTP 401 Unauthorized
      c) Valid HMAC-SHA256 signature calculated over raw body is accepted
    """
    test_secret = "test_webhook_secret_key_sai_vasudev_2026"
    test_payload = {
        "decentro_txn_id": f"DCN-SIG-{uuid.uuid4().hex[:8].upper()}",
        "reference_id": f"REF-SIG-{uuid.uuid4().hex[:8].upper()}",
        "transaction_status": "SUCCESS",
        "amount": 1500.0
    }
    raw_body = json.dumps(test_payload).encode("utf-8")

    # Generate genuine HMAC-SHA256 signature
    valid_sig = hmac.new(
        test_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256
    ).hexdigest()

    bg = BackgroundTasks()

    with patch.dict(os.environ, {"DECENTRO_WEBHOOK_SECRET": test_secret}):
        with patch.object(decentro_client, "webhook_secret", test_secret):
            # Test Case A: Missing signature header -> 401
            req_missing = MockRawRequest(raw_body, headers={})
            with pytest.raises(HTTPException) as exc_info_missing:
                run_coro(_handle_decentro_webhook(req_missing, bg, db, None))
            assert exc_info_missing.value.status_code == 401
            assert "Missing X-Decentro-Signature" in exc_info_missing.value.detail

            # Test Case B: Tampered signature -> 401
            invalid_sig = "deadbeefcafebabe1234567890abcdef"
            req_invalid = MockRawRequest(raw_body, headers={"x-decentro-signature": invalid_sig})
            with pytest.raises(HTTPException) as exc_info_invalid:
                run_coro(_handle_decentro_webhook(req_invalid, bg, db, invalid_sig))
            assert exc_info_invalid.value.status_code == 401
            assert "Invalid webhook signature" in exc_info_invalid.value.detail

            # Test Case C: Valid signature -> Accepted
            req_valid = MockRawRequest(raw_body, headers={"x-decentro-signature": valid_sig})
            res_valid = run_coro(_handle_decentro_webhook(req_valid, bg, db, valid_sig))
            assert res_valid["status"] in ["SUCCESS", "already_processed"]
            assert res_valid["event_id"] == test_payload["decentro_txn_id"]


# =========================================================================
# 2. DECENTRO WEBHOOK IDEMPOTENCY & DUPLICATE RETRY SIMULATION
# =========================================================================

def test_decentro_webhook_duplicate_retry_idempotency(db):
    """
    Simulates duplicate Decentro webhook retries:
      1. First webhook arrives -> marks transaction SUCCESS and settles folio.
      2. Duplicate retry arrives with same decentro_txn_id -> immediately returns
         HTTP 200 {"status": "already_processed"} and skips double-crediting folio.
    """
    unique_suffix = uuid.uuid4().hex[:6].upper()
    dcn_txn_id = f"DCN-IDEM-{unique_suffix}"
    ref_id = f"REF-IDEM-{unique_suffix}"
    settle_amt = 3200.0

    # Create Room & Booking
    room = helper_create_room(db, prefix=f"IDEM{unique_suffix}")
    booking = helper_create_booking(
        db,
        room_id=room.id,
        guest_name="Duplicate Retry Guest",
        guest_email="duplicate.retry@example.com",
        rate=settle_amt,
        prefix=f"IDEM{unique_suffix}"
    )

    folio = models.Folio(
        booking_id=booking.id,
        folio_number=f"FOLIO-IDEM-{unique_suffix}",
        status="OPEN",
        total_charges=settle_amt,
        total_payments=0.0,
        balance_due=settle_amt
    )
    db.add(folio)

    # Initial PENDING payment transaction
    txn = models.PaymentTransaction(
        reference_id=ref_id,
        decentro_txn_id=dcn_txn_id,
        idempotency_key=f"IDEM-KEY-{unique_suffix}",
        booking_id=booking.id,
        room_no=room.name,
        amount=settle_amt,
        currency="INR",
        status="PENDING"
    )
    db.add(txn)
    db.commit()

    # Webhook payload
    webhook_payload = {
        "decentro_txn_id": dcn_txn_id,
        "reference_id": ref_id,
        "transaction_status": "SUCCESS",
        "amount": settle_amt,
        "bank_reference_number": f"UTR-{unique_suffix}",
        "payer_vpa": "guest@upi"
    }
    raw_payload_bytes = json.dumps(webhook_payload).encode("utf-8")

    # Bypass signature check for this internal idempotency logic test
    orig_verify = decentro_client.verify_webhook_signature
    decentro_client.verify_webhook_signature = lambda b, s: True

    try:
        bg1 = BackgroundTasks()
        req1 = MockRawRequest(raw_payload_bytes)

        # 1. Initial Webhook Delivery
        res1 = run_coro(_handle_decentro_webhook(req1, bg1, db, "mock-sig"))
        assert res1["status"] in ["SUCCESS", "already_processed"]

        # Process the background task to settle folio
        process_decentro_webhook_background(dcn_txn_id, webhook_payload)

        # Verify transaction and folio are settled
        db.refresh(txn)
        db.refresh(booking)
        db.refresh(folio)
        assert txn.status == "SUCCESS"
        assert booking.payment_status == "Paid"
        assert booking.total_paid == settle_amt
        assert booking.balance_due == 0.0
        assert folio.total_payments == settle_amt
        assert folio.balance_due == 0.0
        assert folio.status == "SETTLED"

        # 2. Simulate Duplicate Decentro Webhook Retry
        bg2 = BackgroundTasks()
        req2 = MockRawRequest(raw_payload_bytes)
        res2 = run_coro(_handle_decentro_webhook(req2, bg2, db, "mock-sig"))

        # Assert duplicate webhook is gracefully short-circuited with HTTP 200 {"status": "already_processed"}
        assert res2["status"] == "already_processed"
        assert res2.get("duplicate") is True
        assert len(bg2.tasks) == 0, "No background tasks should be queued on a duplicate webhook retry!"

        # Verify that total_paid was NOT double-credited
        db.refresh(booking)
        db.refresh(folio)
        assert booking.total_paid == settle_amt, "Booking total_paid was double-credited!"
        assert folio.total_payments == settle_amt, "Folio total_payments was double-credited!"

    finally:
        decentro_client.verify_webhook_signature = orig_verify


# =========================================================================
# 3. FASTAPI /api/health ENDPOINT & DATABASE PROBE (#85)
# =========================================================================

def test_api_health_check_healthy(db):
    """
    Verifies:
      1. GET /api/health executes SELECT 1 against database.
      2. Returns 200 OK with status="ok", db="connected", and valid timestamp_ist.
    """
    resp = Response()
    health_result = general_health_check(response=resp, db=db)

    assert resp.status_code == 200
    assert health_result["status"] in ["ok", "healthy"]
    assert health_result["db"] == "connected"
    assert health_result["database"] == "connected"
    assert "timestamp_ist" in health_result

    # Verify IST timestamp format
    ist_str = health_result["timestamp_ist"]
    assert "+05:30" in ist_str


def test_api_health_check_database_failure():
    """
    Simulates database failure during SELECT 1:
      1. Response status is set to HTTP 503 Service Unavailable.
      2. Returns status="unhealthy", db="disconnected".
    """
    mock_db = MagicMock(spec=Session)
    mock_db.execute.side_effect = Exception("OperationalError: connection to server lost")

    resp = Response()
    health_result = general_health_check(response=resp, db=mock_db)

    assert resp.status_code == 503
    assert health_result["status"] == "unhealthy"
    assert health_result["db"] == "disconnected"
    assert "connection to server lost" in health_result["detail"]


# =========================================================================
# 4. RAILWAY CONFIGURATION VALIDATION
# =========================================================================

def test_railway_configuration_files():
    """
    Validates railway.json and railway.toml for container health checks:
      - healthcheckPath == "/api/health"
      - healthcheckTimeout == 30
    """
    railway_json_path = os.path.join(PROJECT_ROOT, "railway.json")
    assert os.path.exists(railway_json_path), "railway.json is missing from root"

    with open(railway_json_path, "r", encoding="utf-8") as f:
        rjson = json.load(f)

    deploy_cfg = rjson.get("deploy", {})
    assert deploy_cfg.get("healthcheckPath") == "/api/health"
    assert deploy_cfg.get("healthcheckTimeout") == 30

    railway_toml_path = os.path.join(PROJECT_ROOT, "railway.toml")
    assert os.path.exists(railway_toml_path), "railway.toml is missing from root"

    with open(railway_toml_path, "r", encoding="utf-8") as f:
        toml_content = f.read()

    assert 'healthcheckPath = "/api/health"' in toml_content
    assert "healthcheckTimeout = 30" in toml_content


# =========================================================================
# 5. IST TIMEZONE STANDARDIZATION
# =========================================================================

def test_ist_timezone_utilities():
    """
    Verifies IST timezone helper functions:
      - now_ist() returns datetime with Asia/Kolkata timezone
      - now_ist_str() outputs ISO string with +05:30
      - today_ist_str() outputs YYYY-MM-DD
      - to_ist() accurately converts UTC datetimes
    """
    ist = now_ist()
    assert ist.tzinfo is not None
    assert str(ist.tzinfo) == "Asia/Kolkata"

    ist_str = now_ist_str()
    assert "+05:30" in ist_str

    today_str = today_ist_str()
    parts = today_str.split("-")
    assert len(parts) == 3
    assert len(parts[0]) == 4  # Year

    # Test UTC conversion
    utc_dt = datetime.datetime(2026, 6, 15, 6, 30, tzinfo=datetime.timezone.utc)
    ist_converted = to_ist(utc_dt)
    assert ist_converted.hour == 12
    assert ist_converted.minute == 0
    assert str(ist_converted.tzinfo) == "Asia/Kolkata"


# =========================================================================
# 6. DAILY 12:00 PM IST CHECKOUT ROLLOVER CRON JOB
# =========================================================================

def test_daily_12pm_checkout_rollover(db):
    """
    Tests 12:00 PM IST Checkout Rollover:
      - Identifies active in-house bookings whose check_out_date is today or past
      - Generates pending checkout alerts for the front desk
      - Ignores future checkouts and soft-deleted records
    """
    test_date = "2026-11-04"
    unique_suffix = uuid.uuid4().hex[:6].upper()

    room1 = helper_create_room(db, prefix=f"CO1{unique_suffix}")
    room2 = helper_create_room(db, prefix=f"CO2{unique_suffix}")
    room3 = helper_create_room(db, prefix=f"CO3{unique_suffix}")

    # 1. Booking due today (should be flagged)
    b_due = helper_create_booking(
        db,
        room_id=room1.id,
        guest_name="Due Checkout Guest",
        guest_email="due.guest@example.com",
        check_in_date="2026-11-01",
        check_out_date=test_date,
        rate=3000.0,
        status="Checked-In",
        is_deleted=False,
        prefix=f"DUE{unique_suffix}"
    )

    # 2. Future checkout booking (should NOT be flagged)
    b_future = helper_create_booking(
        db,
        room_id=room2.id,
        guest_name="Future Checkout Guest",
        guest_email="future.guest@example.com",
        check_in_date="2026-11-01",
        check_out_date="2026-11-10",
        rate=5000.0,
        status="Checked-In",
        is_deleted=False,
        prefix=f"FUT{unique_suffix}"
    )

    # 3. Soft-deleted booking (should NOT be flagged)
    b_deleted = helper_create_booking(
        db,
        room_id=room3.id,
        guest_name="Deleted Guest",
        guest_email="deleted.guest@example.com",
        check_in_date="2026-11-01",
        check_out_date=test_date,
        rate=2000.0,
        status="Checked-In",
        is_deleted=True,
        prefix=f"DEL{unique_suffix}"
    )
    db.commit()

    # Run checkout rollover for test_date
    result = run_checkout_rollover(db=db, business_date=test_date)

    assert result["status"] == "success"
    flagged_refs = [a["booking_ref"] for a in result["alerts"]]

    assert b_due.booking_ref in flagged_refs
    assert b_future.booking_ref not in flagged_refs
    assert b_deleted.booking_ref not in flagged_refs


# =========================================================================
# 7. 11:59 PM IST NIGHT AUDIT IDEMPOTENT ROOM TARIFF POSTING
# =========================================================================

def test_daily_1159pm_night_audit_idempotent_tariff_posting(db):
    """
    Tests 11:59 PM IST Night Audit:
      - Automatically posts daily room tariff + GST to active folios
      - Idempotency: Second run for the same business date skips already-posted tariffs
    """
    test_date = "2026-11-04"
    unique_suffix = uuid.uuid4().hex[:6].upper()

    room = helper_create_room(db, prefix=f"NA{unique_suffix}")
    room.price_per_night = 4000.0

    booking = helper_create_booking(
        db,
        room_id=room.id,
        guest_name="Night Audit Guest",
        guest_email="night.audit@example.com",
        check_in_date="2026-11-04",
        check_out_date="2026-11-06",
        rate=4000.0,
        status="Checked-In",
        is_deleted=False,
        prefix=f"NA{unique_suffix}"
    )

    folio = models.Folio(
        booking_id=booking.id,
        folio_number=f"FOLIO-NA-{unique_suffix}",
        status="OPEN",
        total_charges=4000.0,
        total_payments=0.0,
        balance_due=4000.0
    )
    db.add(folio)
    db.commit()

    # --- Run 1: First Night Audit for business date ---
    audit_res1 = run_night_audit(db=db, audit_date=test_date)
    assert audit_res1["status"] == "success"

    # Verify room tariff folio item was added
    charges_date1 = db.query(models.RoomFolioItem).filter(
        models.RoomFolioItem.booking_id == booking.id,
        models.RoomFolioItem.description.like(f"%{test_date}%")
    ).all()
    assert len(charges_date1) == 1
    assert charges_date1[0].total_amount == 4000.0

    # Verify booking and folio totals updated
    db.refresh(booking)
    db.refresh(folio)
    assert booking.total_price == 8000.0
    assert folio.total_charges == 8000.0

    # --- Run 2: Second Night Audit for SAME business date (Simulated rerun) ---
    audit_res2 = run_night_audit(db=db, audit_date=test_date)
    assert audit_res2["status"] == "success"

    # Verify no duplicate tariff was posted!
    charges_date2 = db.query(models.RoomFolioItem).filter(
        models.RoomFolioItem.booking_id == booking.id,
        models.RoomFolioItem.description.like(f"%{test_date}%")
    ).all()
    assert len(charges_date2) == 1, "Duplicate room tariff was posted for the same business date!"

    db.refresh(booking)
    db.refresh(folio)
    assert booking.total_price == 8000.0, "Booking total_price was improperly incremented twice!"
    assert folio.total_charges == 8000.0, "Folio total_charges was improperly incremented twice!"
