"""
Complete Repository Verification Pass Test Suite
Covers explicit verification items:
1. Concurrent booking requests for the same room and dates result in exactly 1 success (201) and 1 409 Conflict (zero double-bookings).
2. Duplicate X-Idempotency-Key payment requests return the cached response without double-charging.
3. Forged Decentro webhook signatures are rejected with 401/403.
4. Role guards block STEWARD or HOUSEKEEPING tokens from accessing financial or admin routes.
5. Readiness probe (/api/v1/health/ready) responds with valid health status.
"""

import sys
import os
import json
import uuid
import hmac
import hashlib
from concurrent.futures import ThreadPoolExecutor
import pytest
from fastapi.testclient import TestClient

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.main import app
from app.database import SessionLocal
from app import models
from app.services.decentro import decentro_client
from app.utils.auth import create_access_token

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


def test_concurrent_bookings_zero_double_booking_and_409_conflict(db):
    """
    Verification Item 1:
    Concurrent booking requests for the same room and dates result in:
    - Exactly 1 success (201 Created)
    - Exactly 1 409 Conflict
    - Exactly 1 booking in database (Zero double-bookings)
    """
    # 1. Find or seed a test room with single inventory
    room = db.query(models.Room).filter(models.Room.slug == "deluxe-test-suite-999").first()
    if not room:
        room = models.Room(
            name="Deluxe Verification Suite 999",
            slug="deluxe-test-suite-999",
            room_type="Deluxe",
            price_per_night=2500.0,
            description="Room for concurrency verification",
            image_url="https://images.unsplash.com/photo-1590490360182-c33d57733427",
            total_inventory=1
        )
        db.add(room)
        db.commit()
        db.refresh(room)

    check_in = "2026-11-15"
    check_out = "2026-11-18"

    # Clean any leftover bookings for this test window
    db.query(models.Booking).filter(
        models.Booking.room_id == room.id,
        models.Booking.check_in_date == check_in
    ).delete()
    db.commit()

    payload_a = {
        "room_id": room.id,
        "guest_name": "Pilgrim Guest A",
        "guest_email": "guest.a@test-residency.com",
        "guest_phone": "9876543210",
        "check_in_date": check_in,
        "check_out_date": check_out,
        "adults": 2,
        "children": 0,
        "payment_method": "Pay at Hotel"
    }

    payload_b = {
        "room_id": room.id,
        "guest_name": "Pilgrim Guest B",
        "guest_email": "guest.b@test-residency.com",
        "guest_phone": "9876543211",
        "check_in_date": check_in,
        "check_out_date": check_out,
        "adults": 2,
        "children": 0,
        "payment_method": "Pay at Hotel"
    }

    key_a = f"CONCURRENT-BOOKING-A-{uuid.uuid4().hex}"
    key_b = f"CONCURRENT-BOOKING-B-{uuid.uuid4().hex}"

    def send_booking(payload, key):
        return client.post(
            "/api/v1/bookings",
            json=payload,
            headers={"X-Idempotency-Key": key}
        )

    # Execute 2 concurrent requests
    with ThreadPoolExecutor(max_workers=2) as executor:
        f_a = executor.submit(send_booking, payload_a, key_a)
        f_b = executor.submit(send_booking, payload_b, key_b)
        res_a = f_a.result()
        res_b = f_b.result()

    statuses = [res_a.status_code, res_b.status_code]
    
    # Assert exactly 1 success (201) and 1 conflict (409)
    assert 201 in statuses, f"Expected a 201 success, got: {statuses}"
    assert 409 in statuses, f"Expected a 409 Conflict, got: {statuses}"
    assert statuses.count(201) == 1
    assert statuses.count(409) == 1

    # Verify conflict error payload
    conflict_res = res_a if res_a.status_code == 409 else res_b
    assert "Booking Conflict" in conflict_res.json()["detail"]

    # Verify database: exactly 1 booking exists for this room & dates
    persisted_bookings = db.query(models.Booking).filter(
        models.Booking.room_id == room.id,
        models.Booking.check_in_date == check_in,
        models.Booking.check_out_date == check_out,
        models.Booking.status.notin_(["Cancelled"])
    ).all()
    assert len(persisted_bookings) == 1, f"Double-booking detected! Count: {len(persisted_bookings)}"


def test_duplicate_idempotency_key_returns_cached_response_without_double_charging(db):
    """
    Verification Item 2:
    Duplicate X-Idempotency-Key payment requests return the cached response
    with X-Idempotency-Cache: HIT and prevent double-charging/duplicate rows.
    """
    idemp_key = f"IDEMP-VERIF-PAY-{uuid.uuid4().hex}"
    qr_payload = {
        "amount": 1850.0,
        "purpose_message": "Verification Advance Payment",
        "room_no": "101"
    }

    # Request 1: Fresh execution
    res1 = client.post(
        "/api/v1/payments/decentro/upi-qr",
        json=qr_payload,
        headers={"X-Idempotency-Key": idemp_key}
    )
    assert res1.status_code == 200
    data1 = res1.json()
    ref_id = data1["reference_id"]
    assert ref_id is not None

    # Request 2: Duplicate retry with same idempotency key
    res2 = client.post(
        "/api/v1/payments/decentro/upi-qr",
        json=qr_payload,
        headers={"X-Idempotency-Key": idemp_key}
    )
    assert res2.status_code == 200
    assert res2.headers.get("X-Idempotency-Cache") == "HIT"
    data2 = res2.json()

    # Cached response must match identically
    assert data2["reference_id"] == ref_id
    assert data2["amount"] == 1850.0

    # Ensure exactly 1 database record exists for this reference_id
    txn_count = db.query(models.PaymentTransaction).filter(
        models.PaymentTransaction.reference_id == ref_id
    ).count()
    assert txn_count == 1, f"Double-charging occurred! {txn_count} transactions created"


def test_forged_decentro_webhook_signature_rejected_with_401(monkeypatch):
    """
    Verification Item 3:
    Forged Decentro webhook signatures are rejected with 401 Unauthorized.
    """
    secret = "production_secure_webhook_secret_key_999"
    monkeypatch.setattr(decentro_client, "webhook_secret", secret)

    payload = {
        "decentro_txn_id": f"TXN-FORGED-{uuid.uuid4().hex[:8].upper()}",
        "reference_id": "REF-VERIF-01",
        "status": "SUCCESS",
        "amount": 2000.0
    }
    payload_bytes = json.dumps(payload).encode("utf-8")

    # 1. Forged Signature
    res_forged = client.post(
        "/api/v1/webhooks/decentro",
        content=payload_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Decentro-Signature": "forged_malicious_hmac_signature_abc123"
        }
    )
    assert res_forged.status_code == 401
    assert "Invalid webhook signature" in res_forged.json()["detail"]

    # 2. Missing Signature Header
    res_missing = client.post(
        "/api/v1/webhooks/decentro",
        content=payload_bytes,
        headers={"Content-Type": "application/json"}
    )
    assert res_missing.status_code == 401
    assert "signature" in res_missing.json()["detail"].lower()

    # 3. Legitimate Signature succeeds (200)
    legit_sig = hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()
    res_legit = client.post(
        "/api/v1/webhooks/decentro",
        content=payload_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Decentro-Signature": legit_sig
        }
    )
    assert res_legit.status_code == 200
    assert res_legit.json()["status"] == "SUCCESS"


def test_role_guards_block_steward_and_housekeeping_from_admin_and_financial_routes():
    """
    Verification Item 4:
    Role guards strictly block STEWARD and HOUSEKEEPING tokens from accessing
    financial and admin routes (/api/v1/admin/*).
    """
    steward_token = create_access_token({"sub": "steward_bob", "role": "STEWARD"})
    housekeeping_token = create_access_token({"sub": "hk_alice", "role": "HOUSEKEEPING"})
    receptionist_token = create_access_token({"sub": "rec_carol", "role": "RECEPTIONIST"})
    manager_token = create_access_token({"sub": "mgr_dave", "role": "MANAGER"})

    admin_endpoints = [
        ("POST", "/api/v1/admin/night-audit/run"),
        ("POST", "/api/v1/admin/backups/run"),
        ("GET", "/api/v1/admin/backups"),
    ]

    for method, endpoint in admin_endpoints:
        # STEWARD blocked with 403 Forbidden
        if method == "POST":
            res_steward = client.post(endpoint, headers={"Authorization": f"Bearer {steward_token}"})
            res_hk = client.post(endpoint, headers={"Authorization": f"Bearer {housekeeping_token}"})
            res_rec = client.post(endpoint, headers={"Authorization": f"Bearer {receptionist_token}"})
        else:
            res_steward = client.get(endpoint, headers={"Authorization": f"Bearer {steward_token}"})
            res_hk = client.get(endpoint, headers={"Authorization": f"Bearer {housekeeping_token}"})
            res_rec = client.get(endpoint, headers={"Authorization": f"Bearer {receptionist_token}"})

        assert res_steward.status_code == 403, f"Steward was not blocked from {endpoint}: {res_steward.status_code}"
        assert res_hk.status_code == 403, f"Housekeeping was not blocked from {endpoint}: {res_hk.status_code}"
        assert res_rec.status_code == 403, f"Receptionist was not blocked from {endpoint}: {res_rec.status_code}"

    # MANAGER succeeds (200)
    res_mgr_backups = client.get("/api/v1/admin/backups", headers={"Authorization": f"Bearer {manager_token}"})
    assert res_mgr_backups.status_code == 200
    assert res_mgr_backups.json()["status"] == "success"


def test_railway_readiness_probe():
    """
    Verification Item 5:
    Validates /api/v1/health/ready returns 200 OK with database, R2, and Decentro status.
    """
    res = client.get("/api/v1/health/ready")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ready"
    assert body["database"] == "connected"
    assert "r2_storage" in body
    assert "decentro_circuit" in body
