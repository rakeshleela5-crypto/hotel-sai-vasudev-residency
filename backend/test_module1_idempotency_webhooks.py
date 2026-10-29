"""
Test Suite: Module 1 - Decentro Banking, Idempotency & Webhooks
Covers Architecture Spec Module 1:
  1. require_idempotency_key dependency (#1) attached to /bookings, /payments/*, /folios/settle, /kot
  2. Double-clicked payment request idempotency & payload mismatch conflict (#1)
  3. Decentro HMAC-SHA256 webhook signature verification (#17)
  4. Duplicate webhook delivery deduplication (#36, #38)
  5. Decentro client Async Circuit Breaker (#13, #80)
  6. Dead Letter Queue (DLQ) ingestion and replay (#39)
"""

import sys
import os
import json
import uuid
import hmac
import hashlib
import pytest
from fastapi.testclient import TestClient

# Ensure root & backend are in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.main import app
from app.database import SessionLocal
from app import models
from app.models import WebhookEvent, FailedWebhookDLQ, IdempotencyKey
from app.services.decentro import decentro_client, CircuitState

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

def create_sample_booking(db):
    booking_ref = f"SVR-MOD1-{uuid.uuid4().hex[:6].upper()}"
    booking = models.Booking(
        booking_ref=booking_ref,
        room_id=1,
        guest_name="Test Pilgrim",
        guest_email="guest@sai-vasudev.com",
        guest_phone="9466219194",
        check_in_date="2026-10-29",
        check_out_date="2026-10-31",
        base_rate=2000.0,
        base_amount=4000.0,
        total_price=4480.0,
        total_paid=0.0,
        balance_due=4480.0,
        status="Confirmed"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking

# =========================================================================
# 1. TEST: REQUIRE IDEMPOTENCY KEY DEPENDENCY (#1)
# =========================================================================
def test_require_idempotency_key_enforcement(db):
    booking = create_sample_booking(db)

    # 1. /payments/decentro/upi-qr requires key
    res_qr = client.post("/api/v1/payments/decentro/upi-qr", json={
        "booking_id": booking.id,
        "amount": 1000.0
    })
    assert res_qr.status_code == 400
    assert "Idempotency-Key" in res_qr.json().get("detail", "")

    # 2. /folios/settle requires key
    res_settle = client.post("/api/v1/folios/settle", json={
        "booking_ref": booking.booking_ref,
        "amount": 500.0
    })
    assert res_settle.status_code == 400
    assert "Idempotency-Key" in res_settle.json().get("detail", "")

    # 3. /kot requires key
    res_kot = client.post("/api/v1/kot", json={
        "room_no": "101",
        "total_amount": 250.0
    })
    assert res_kot.status_code == 400
    assert "Idempotency-Key" in res_kot.json().get("detail", "")

# =========================================================================
# 2. TEST: DOUBLE-CLICKED PAYMENT REQUEST IDEMPOTENCY (#1)
# =========================================================================
def test_double_clicked_payment_idempotency(db):
    booking = create_sample_booking(db)
    idemp_key = f"IDEMP-PAY-{uuid.uuid4().hex}"

    qr_payload = {
        "booking_id": booking.id,
        "room_no": "101",
        "amount": 1200.0,
        "purpose_message": "Advance Test Payment"
    }

    # First click: generates QR and stores in idempotency table
    res1 = client.post(
        "/api/v1/payments/decentro/upi-qr",
        json=qr_payload,
        headers={"X-Idempotency-Key": idemp_key}
    )
    assert res1.status_code == 200, f"Initial payment request failed: {res1.text}"
    body1 = res1.json()
    ref_id = body1["reference_id"]
    assert ref_id is not None

    # Immediate second click: exact same key and payload
    res2 = client.post(
        "/api/v1/payments/decentro/upi-qr",
        json=qr_payload,
        headers={"X-Idempotency-Key": idemp_key}
    )
    assert res2.status_code == 200
    assert res2.headers.get("X-Idempotency-Cache") == "HIT"
    body2 = res2.json()

    # Must return identical cached response
    assert body2["reference_id"] == ref_id
    assert body2["amount"] == 1200.0

    # Verify no duplicate payment transaction record was created in DB
    txns = db.query(models.PaymentTransaction).filter(
        models.PaymentTransaction.reference_id == ref_id
    ).all()
    assert len(txns) == 1, "Duplicate payment transaction row created!"

# =========================================================================
# 3. TEST: IDEMPOTENCY PAYLOAD MISMATCH CONFLICT (#1)
# =========================================================================
def test_idempotency_payload_mismatch_conflict(db):
    booking = create_sample_booking(db)
    idemp_key = f"IDEMP-MISMATCH-{uuid.uuid4().hex}"

    qr_payload_1 = {
        "booking_id": booking.id,
        "amount": 1000.0,
        "purpose_message": "Original Payment"
    }
    res1 = client.post(
        "/api/v1/payments/decentro/upi-qr",
        json=qr_payload_1,
        headers={"X-Idempotency-Key": idemp_key}
    )
    assert res1.status_code == 200

    # Tampered payload using the same key
    qr_payload_tampered = {
        "booking_id": booking.id,
        "amount": 9999.0,  # Modified amount
        "purpose_message": "Tampered Payment"
    }
    res_tampered = client.post(
        "/api/v1/payments/decentro/upi-qr",
        json=qr_payload_tampered,
        headers={"X-Idempotency-Key": idemp_key}
    )
    assert res_tampered.status_code == 409
    assert "different request payload" in res_tampered.json().get("detail", "")

# =========================================================================
# 4. TEST: FOLIO SETTLE & KOT IDEMPOTENCY (#1)
# =========================================================================
def test_folio_settle_and_kot_idempotency(db):
    booking = create_sample_booking(db)

    # 1. Folio Settle Idempotency
    settle_key = f"IDEMP-SETTLE-{uuid.uuid4().hex}"
    settle_payload = {
        "booking_ref": booking.booking_ref,
        "amount": 1000.0,
        "payment_mode": "UPI"
    }
    res_s1 = client.post("/api/v1/folios/settle", json=settle_payload, headers={"X-Idempotency-Key": settle_key})
    assert res_s1.status_code == 200
    res_s2 = client.post("/api/v1/folios/settle", json=settle_payload, headers={"X-Idempotency-Key": settle_key})
    assert res_s2.status_code == 200
    assert res_s2.headers.get("X-Idempotency-Cache") == "HIT"

    db.refresh(booking)
    assert booking.total_paid == 1000.0  # Not doubled to 2000.0

    # 2. KOT Ticket Idempotency
    kot_key = f"IDEMP-KOT-{uuid.uuid4().hex}"
    kot_payload = {
        "room_no": "101",
        "table_no": "Table 5",
        "items": [{"name": "Masala Dosa", "qty": 2, "price": 80.0}],
        "total_amount": 160.0,
        "waiter_name": "Ramesh"
    }
    res_k1 = client.post("/api/v1/kot", json=kot_payload, headers={"X-Idempotency-Key": kot_key})
    assert res_k1.status_code == 200
    kot_no = res_k1.json()["kot_number"]

    res_k2 = client.post("/api/v1/kot", json=kot_payload, headers={"X-Idempotency-Key": kot_key})
    assert res_k2.status_code == 200
    assert res_k2.headers.get("X-Idempotency-Cache") == "HIT"
    assert res_k2.json()["kot_number"] == kot_no

# =========================================================================
# 5. TEST: DECENTRO WEBHOOK SIGNATURE VERIFICATION (#17)
# =========================================================================
def test_webhook_hmac_signature_verification(monkeypatch):
    test_secret = "test_webhook_hmac_secret_key_888"
    monkeypatch.setattr(decentro_client, "webhook_secret", test_secret)

    payload = {
        "decentro_txn_id": f"TXN-SIG-{uuid.uuid4().hex[:8].upper()}",
        "reference_id": "REF-SIG-01",
        "status": "SUCCESS",
        "amount": 1500.0
    }
    payload_bytes = json.dumps(payload).encode('utf-8')

    # 1. Valid Signature
    valid_sig = hmac.new(test_secret.encode('utf-8'), payload_bytes, hashlib.sha256).hexdigest()
    res_valid = client.post(
        "/api/v1/webhooks/decentro",
        content=payload_bytes,
        headers={"Content-Type": "application/json", "X-Decentro-Signature": valid_sig}
    )
    assert res_valid.status_code == 200
    assert res_valid.json()["status"] == "SUCCESS"

    # 2. Invalid Signature
    res_invalid = client.post(
        "/api/v1/webhooks/decentro",
        content=payload_bytes,
        headers={"Content-Type": "application/json", "X-Decentro-Signature": "invalid_sig_abc123"}
    )
    assert res_invalid.status_code == 401
    assert "Invalid webhook signature" in res_invalid.json().get("detail", "")

    # 3. Missing Signature Header
    res_missing = client.post(
        "/api/v1/webhooks/decentro",
        content=payload_bytes,
        headers={"Content-Type": "application/json"}
    )
    assert res_missing.status_code == 401

# =========================================================================
# 6. TEST: DUPLICATE WEBHOOK DELIVERY & DEDUPLICATION (#36, #38)
# =========================================================================
def test_duplicate_webhook_deduplication(db):
    booking = create_sample_booking(db)
    test_txn_id = f"TXN-DEDUP-{uuid.uuid4().hex[:8].upper()}"
    utr_no = f"UTR-{uuid.uuid4().hex[:10].upper()}"

    webhook_payload = {
        "decentro_txn_id": test_txn_id,
        "reference_id": f"REF-{booking.booking_ref}",
        "booking_id": booking.id,
        "status": "SUCCESS",
        "transaction_status": "SUCCESS",
        "bank_reference_number": utr_no,
        "amount": 2000.0,
        "timestamp": "2026-10-29T10:00:00Z"
    }

    # 1. First webhook delivery
    res1 = client.post("/api/v1/webhooks/decentro", json=webhook_payload)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "SUCCESS"
    assert data1.get("duplicate") is not True

    # Webhook recorded in webhook_events table
    event = db.query(WebhookEvent).filter(WebhookEvent.event_id == test_txn_id).first()
    assert event is not None
    assert event.source == "DECENTRO"

    # 2. Second webhook delivery (duplicate callback)
    res2 = client.post("/api/v1/webhooks/decentro", json=webhook_payload)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["duplicate"] is True
    assert "Duplicate webhook" in data2["message"]

    # Verify webhook_events row count did not duplicate
    events_count = db.query(WebhookEvent).filter(WebhookEvent.event_id == test_txn_id).count()
    assert events_count == 1

# =========================================================================
# 7. TEST: ASYNC CIRCUIT BREAKER TRIPPING & FALLBACK (#13, #80)
# =========================================================================
@pytest.mark.asyncio
async def test_circuit_breaker_trips_to_open_and_fallback():
    cb = decentro_client.circuit_breaker
    await cb.record_success()  # Start clean
    assert cb.state == CircuitState.CLOSED

    # Simulate 5 consecutive 5xx/network errors
    for _ in range(5):
        await cb.record_failure()

    # Circuit Breaker must trip to OPEN
    assert cb.state == CircuitState.OPEN
    assert await cb.can_execute() is False

    # Calling generate_dynamic_upi_qr returns structured fallback
    fallback_res = await decentro_client.generate_dynamic_upi_qr(
        reference_id="TEST-FALLBACK",
        amount=1500.0,
        purpose_message="Fallback Test"
    )
    assert fallback_res["decentro_unavailable"] is True
    assert fallback_res["circuit_state"] == CircuitState.OPEN
    assert fallback_res["fallback_mode"] == "MANUAL_POS_CASH"

    # Reset circuit breaker
    await cb.record_success()
    assert cb.state == CircuitState.CLOSED
    assert await cb.can_execute() is True

# =========================================================================
# 8. TEST: DEAD LETTER QUEUE (DLQ) & REPLAY (#39)
# =========================================================================
def test_dead_letter_queue_replay(db):
    # Insert a failed event into failed_webhook_dlq
    dlq_event_id = f"DLQ-{uuid.uuid4().hex[:8].upper()}"
    dlq_record = FailedWebhookDLQ(
        event_id=dlq_event_id,
        source="DECENTRO",
        payload_json=json.dumps({"test": "data", "event_id": dlq_event_id}),
        failure_reason="Simulated 3x timeout on Decentro webhook processor",
        retry_count=3,
        status="PENDING"
    )
    db.add(dlq_record)
    db.commit()
    db.refresh(dlq_record)

    # 1. Verify listed in GET /api/v1/admin/dlq
    res_list = client.get("/api/v1/admin/dlq")
    assert res_list.status_code == 200
    items = res_list.json()
    matching = [i for i in items if i["event_id"] == dlq_event_id]
    assert len(matching) == 1
    assert matching[0]["status"] == "PENDING"

    # 2. Replay via POST /api/v1/admin/dlq/{id}/replay
    res_replay = client.post(f"/api/v1/admin/dlq/{dlq_record.id}/replay")
    assert res_replay.status_code == 200
    replay_data = res_replay.json()
    assert replay_data["success"] is True
    assert replay_data["status"] == "REPLAYED"

    # Verify status in database
    db.refresh(dlq_record)
    assert dlq_record.status == "REPLAYED"
    assert dlq_record.replayed_at is not None
