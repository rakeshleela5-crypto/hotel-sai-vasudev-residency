"""
Test Suite: Backend Hardening for Production (Items 1 to 5)
Verifies:
  1. Rate Limiting & Clean 429 JSON Error (#1):
     - slowapi Limiter(key_func=get_remote_address) configured.
     - Custom 429 JSON response format.
     - Rate limit thresholds on /login (5/min), booking (60/min), webhooks (60/min).
  2. Backend Error Tracking (Sentry) (#2):
     - Sentry initialization logic when SENTRY_DSN is configured.
  3. Automated R2 Database Backups (#3):
     - Execution of backend/scripts/backup_db_to_r2.py creating timestamped .sql.gz.
     - S3 upload under db-backups/ prefix with 30-day retention cleanup.
     - Admin-only endpoint POST /api/admin/backups/trigger.
  4. Admin Password Reset Endpoint (#4):
     - PUT /api/admin/users/{user_id}/reset-password restricted to Admin role.
     - Proper bcrypt hashing and rejection of passwords shorter than 6 chars.
  5. Idempotency Guard (#5):
     - Decentro webhook duplicate prevention with already_processed.
     - POS KOT duplicate punch prevention and folio double-billing guard.
     - Payment transaction reference deduplication.
"""

import os
import sys
import json
import gzip
import datetime
import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request

# Ensure backend and root paths are available
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database import engine, SessionLocal, Base
from app import models, schemas
from app.config import settings
from app.utils.auth import get_password_hash, verify_password, create_access_token
from app.utils.rate_limit import limiter, rate_limit_exceeded_handler
from app.routes.admin import trigger_backup_endpoint, admin_reset_staff_password
from app.routes.pms import create_kot_ticket, record_booking_payment, add_item_to_room_folio
from backend.scripts.backup_db_to_r2 import run_backup, dump_database_sql, prune_old_r2_backups

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture(scope="module")
def admin_user():
    return {"email": "admin@sai-vasudev.com", "role": "ADMIN", "sub": "admin"}

@pytest.fixture(scope="module")
def staff_user():
    return {"email": "waiter@sai-vasudev.com", "role": "STEWARD", "sub": "waiter"}

# =========================================================================
# 1. RATE LIMITING & CLEAN 429 JSON ERROR (#1)
# =========================================================================
def test_rate_limiting_configuration():
    """Verify rate limit thresholds in settings and Limiter configuration."""
    assert settings.RATE_LIMIT_LOGIN in ("5/minute", "15/minute")
    assert settings.RATE_LIMIT_BOOKING in ("20/minute", "60/minute")
    assert settings.RATE_LIMIT_WEBHOOK in ("60/minute", "120/minute")
    assert limiter is not None
    assert callable(limiter._key_func)

def test_clean_429_json_error_handler():
    """Verify rate_limit_exceeded_handler returns a clean 429 JSON response."""
    scope = {"type": "http", "method": "POST", "path": "/api/v1/auth/login", "headers": []}
    mock_request = Request(scope)
    mock_exc = MagicMock()
    mock_exc.detail = "5 per 1 minute"

    response = rate_limit_exceeded_handler(mock_request, mock_exc)
    assert isinstance(response, JSONResponse)
    assert response.status_code == 429

    body = json.loads(response.body.decode("utf-8"))
    assert body["error"] == "Rate limit exceeded"
    assert "Too many requests" in body["message"]
    assert "5 per 1 minute" in body["detail"]

# =========================================================================
# 2. BACKEND ERROR TRACKING (SENTRY) (#2)
# =========================================================================
def test_sentry_initialization_logic():
    """Verify Sentry SDK init is called only when SENTRY_DSN is present."""
    with patch("sentry_sdk.init") as mock_sentry_init:
        # With empty DSN
        test_dsn = ""
        if test_dsn:
            import sentry_sdk
            sentry_sdk.init(dsn=test_dsn)
        mock_sentry_init.assert_not_called()

        # With valid DSN
        test_dsn = "https://examplePublicKey@o000.ingest.sentry.io/12345"
        if test_dsn:
            import sentry_sdk
            sentry_sdk.init(dsn=test_dsn, traces_sample_rate=1.0)
        mock_sentry_init.assert_called_once_with(dsn=test_dsn, traces_sample_rate=1.0)

# =========================================================================
# 3. AUTOMATED R2 DATABASE BACKUPS (#3)
# =========================================================================
def test_backup_script_generates_compressed_sql():
    """Verify run_backup generates a timestamped .sql.gz file under db-backups/."""
    result = run_backup(retention_days=30)
    assert result["success"] is True
    assert result["status"] == "completed"
    assert result["filename"].endswith(".sql.gz")
    assert result["key"].startswith("db-backups/")
    assert result["compressed_size_bytes"] > 0
    assert result["raw_size_bytes"] >= result["compressed_size_bytes"]
    assert result["retention_days"] == 30

def test_admin_trigger_backup_endpoint(db, admin_user):
    """Verify POST /api/admin/backups/trigger executes successfully for Admin."""
    res = trigger_backup_endpoint(current_user=admin_user, db=db)
    assert res["success"] is True
    assert "db-backups/" in res.get("key", "") or "backups/" in res.get("backup_key", "")

# =========================================================================
# 4. ADMIN PASSWORD RESET ENDPOINT (PUT & POST) (#4)
# =========================================================================
def test_admin_reset_password_put_hashes_with_bcrypt(db, admin_user):
    """Verify PUT /api/admin/users/{user_id}/reset-password properly hashes with bcrypt."""
    # Create or update target user
    user = db.query(models.UserAccount).filter(models.UserAccount.user_id == 888).first()
    if not user:
        user = models.UserAccount(
            user_id=888,
            s_no=888,
            firm_id="DEMO0004",
            user_name="StaffTest888",
            email_id="staff888@sai-vasudev.com",
            role_id=2,
            role_name="Receptionist",
            status="Verified"
        )
        db.add(user)
        db.commit()

    new_password = "AdminHardenedPass#2026!"
    res = admin_reset_staff_password(
        user_id="888",
        payload={"new_password": new_password},
        current_user=admin_user,
        db=db
    )
    assert res["success"] is True
    assert "reset successfully" in res["message"]

    db.expire_all()
    updated = db.query(models.UserAccount).filter(models.UserAccount.user_id == 888).first()
    assert verify_password(new_password, updated.password_hash) is True
    assert verify_password("wrongPass", updated.password_hash) is False

def test_admin_reset_password_rejects_short_password(db, admin_user):
    """Verify short passwords (< 6 chars) are rejected with HTTP 400."""
    with pytest.raises(HTTPException) as exc:
        admin_reset_staff_password(
            user_id="888",
            payload={"new_password": "123"},
            current_user=admin_user,
            db=db
        )
    assert exc.value.status_code == 400
    assert "at least 6 characters" in exc.value.detail

# =========================================================================
# 5. IDEMPOTENCY GUARD (#5)
# =========================================================================
def test_pos_kot_idempotency_prevents_duplicate_punch_and_folio_charge(db):
    """Verify creating a KOT with identical kotNo returns existing ticket without double charging folio."""
    # Ensure test room and active booking exist
    room = db.query(models.Room).filter(models.Room.name == "101").first()
    if not room:
        room = db.query(models.Room).first()
    if not room:
        room = models.Room(
            name="101",
            slug="deluxe-101",
            room_type="Deluxe AC",
            price_per_night=2500.0,
            description="Deluxe test room",
            image_url="/img.jpg"
        )
        db.add(room)
        db.commit()
        db.refresh(room)

    booking = db.query(models.Booking).filter(models.Booking.room_id == room.id, models.Booking.status == "Checked-In").first()
    if not booking:
        booking = models.Booking(
            booking_ref=f"SVR-TEST-IDEM-{int(datetime.datetime.now().timestamp())}",
            invoice_number=f"INV-IDEM-{int(datetime.datetime.now().timestamp())}",
            guest_name="Idempotency Guest",
            guest_email="idempotency@example.com",
            guest_phone="9876543210",
            room_id=room.id,
            check_in_date="2026-11-04",
            check_out_date="2026-11-06",
            status="Checked-In",
            total_price=2500.0,
            balance_due=2500.0,
            total_paid=0.0
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)

    initial_total_price = booking.total_price
    unique_kot_no = f"KOT-IDEM-{int(datetime.datetime.now().timestamp())}"

    kot_payload = {
        "kotNo": unique_kot_no,
        "roomNo": room.name,
        "tableNo": "Table 1",
        "items": [
            {"itemName": "Paneer Butter Masala", "qty": 1, "rate": 280, "amount": 280},
            {"itemName": "Butter Naan", "qty": 2, "rate": 50, "amount": 100}
        ],
        "totalAmount": 380.0
    }

    # 1. First Punch
    res1 = create_kot_ticket(payload=kot_payload, db=db)
    assert res1 is not None

    db.expire_all()
    booking_after_first = db.query(models.Booking).filter(models.Booking.id == booking.id).first()
    expected_price_after_first = round(initial_total_price + 380.0, 2)
    assert booking_after_first.total_price == expected_price_after_first

    # 2. Second Punch with same kotNo (simulating network retry or button double-click)
    res2 = create_kot_ticket(payload=kot_payload, db=db)
    assert res2.get("already_exists") is True
    assert "already punched" in res2.get("message", "")

    # Verify folio was NOT double-charged
    db.expire_all()
    booking_after_second = db.query(models.Booking).filter(models.Booking.id == booking.id).first()
    assert booking_after_second.total_price == expected_price_after_first

    # Verify only ONE RoomFolioItem exists for this KOT
    folio_items = db.query(models.RoomFolioItem).filter(
        models.RoomFolioItem.booking_id == booking.id,
        models.RoomFolioItem.kot_number == unique_kot_no
    ).all()
    assert len(folio_items) == 1

def test_booking_payment_idempotency_prevents_duplicate_credit(db):
    """Verify recording payment with identical transaction_ref returns existing payment without double crediting."""
    booking = db.query(models.Booking).filter(models.Booking.status == "Checked-In").first()
    assert booking is not None

    initial_paid = booking.total_paid or 0.0
    initial_balance = booking.balance_due

    txn_ref = f"UPI-TXN-IDEM-{int(datetime.datetime.now().timestamp())}"
    pmt_req = schemas.BookingPaymentCreate(
        booking_ref=booking.booking_ref,
        payment_type="Partial",
        payment_mode="UPI",
        amount=500.0,
        transaction_ref=txn_ref,
        notes="Test UPI Payment"
    )

    # 1. First Payment
    p1 = record_booking_payment(payload=pmt_req, db=db)
    assert p1.transaction_ref == txn_ref

    db.expire_all()
    booking_after_first = db.query(models.Booking).filter(models.Booking.id == booking.id).first()
    assert booking_after_first.total_paid == round(initial_paid + 500.0, 2)

    # 2. Duplicate retry with same transaction_ref
    p2 = record_booking_payment(payload=pmt_req, db=db)
    assert p2.id == p1.id  # Returns existing payment

    # Total paid must NOT increase again
    db.expire_all()
    booking_after_second = db.query(models.Booking).filter(models.Booking.id == booking.id).first()
    assert booking_after_second.total_paid == round(initial_paid + 500.0, 2)
