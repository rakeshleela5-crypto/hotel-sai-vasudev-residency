"""
===================================================================================================
HOTEL SAI VASUDEV RESIDENCY - PROPERTY MANAGEMENT SYSTEM (PMS) & ERP
TEST SUITE: tests/test_decentro_webhooks.py
AUTHOR: Principal Systems Architect & Decentro Fintech Forensic Engineer
PURPOSE: Pin-to-pin stress testing of Decentro banking integration:
  1. Idempotency Race Condition: Fire 5 identical Decentro webhook payloads concurrently:
     - Customer folio and bank ledger credited exactly once.
     - Exactly 1 BookingPayment and exactly 1 JournalEntry generated.
  2. Edge Cases:
     - Partial payment against dynamic QR (status becomes 'Partial', balance preserved).
     - Overpayment (excess advance tracked, folio marked SETTLED, balance_due 0).
     - Expired QR payment callback (status becomes 'EXPIRED', zero folio crediting).
     - Virtual Account RTGS settlement reconciliation (corporate booking auto-credited).
  3. Security:
     - Forged HMAC-SHA256 signatures rejected with 401 Unauthorized.
     - Missing signature header rejected with 401 Unauthorized when secret is active.
     - Malformed non-JSON payloads rejected with 400 Bad Request without crashing worker.
     - UTR replay attacks across different transactions rejected and flagged.
===================================================================================================
"""

import os
import sys
import json
import uuid
import hmac
import hashlib
import datetime
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient

# Ensure backend and root paths are available
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(1, PROJECT_ROOT)

from app.main import app
from app.database import SessionLocal
from app import models
from app.services.decentro import decentro_client

client = TestClient(app)

TEST_WEBHOOK_SECRET = "test_decentro_webhook_secret_key_2026_svr"

def make_signed_headers(payload_bytes: bytes, secret: str = TEST_WEBHOOK_SECRET) -> dict:
    sig = hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()
    return {
        "Content-Type": "application/json",
        "X-Decentro-Signature": sig
    }

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture(autouse=True)
def configure_webhook_secret(monkeypatch):
    """Ensure Decentro webhook secret is consistently configured for signature testing."""
    monkeypatch.setattr(decentro_client, "webhook_secret", TEST_WEBHOOK_SECRET)

@pytest.fixture
def test_booking(db):
    """Seeds a test room, booking, and open Master Folio."""
    room_slug = f"dcn-test-room-{uuid.uuid4().hex[:6]}"
    room = models.Room(
        name=f"Decentro Suite {room_slug[-4:]}",
        slug=room_slug,
        room_type="Executive",
        price_per_night=3000.0,
        capacity=2,
        total_inventory=1,
        description="Room for Decentro webhook testing",
        image_url="https://images.unsplash.com/photo-1590490360182-c33d57733427",
        is_available=True,
        housekeeping_status="Clean"
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    cin = datetime.date.today().isoformat()
    cout = (datetime.date.today() + datetime.timedelta(days=2)).isoformat()
    booking_ref = f"BK-DCN-{uuid.uuid4().hex[:6].upper()}"

    # 2 nights @ 3000 = 6000 + 12% GST = 6720
    total_price = 6720.0
    booking = models.Booking(
        booking_ref=booking_ref,
        room_id=room.id,
        guest_name="Kishore Kumar",
        guest_email="kishore.kumar@example.com",
        guest_phone="9848099112",
        check_in_date=cin,
        check_out_date=cout,
        base_rate=3000.0,
        base_amount=6000.0,
        extra_guest_charge=0.0,
        gst_rate=12.0,
        cgst_amount=360.0,
        sgst_amount=360.0,
        total_tax=720.0,
        total_price=total_price,
        total_paid=0.0,
        balance_due=total_price,
        payment_status="Pending",
        payment_method="Pay at Hotel",
        status="Checked-In"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    folio = models.Folio(
        booking_id=booking.id,
        folio_number=f"FOL-DCN-{booking.id}",
        status="OPEN",
        total_charges=total_price,
        total_payments=0.0,
        balance_due=total_price,
        version_id=1
    )
    db.add(folio)
    db.commit()
    db.refresh(folio)

    return booking


# ===================================================================================================
# 1. IDEMPOTENCY RACE CONDITION: CONCURRENT IDENTICAL WEBHOOK INGESTION
# ===================================================================================================

class TestDecentroWebhookIdempotency:
    """
    Stress-tests concurrent delivery of 5 identical webhook payloads:
    Simulates gateway network retries / duplicate deliveries.
    Verifies:
      - 100% of calls return HTTP 200 OK without unhandled exceptions or 500 errors.
      - Customer folio is credited exactly once.
      - Bank ledger (JournalEntry) has exactly 1 matching entry.
      - Exactly 1 BookingPayment settlement is recorded.
    """

    def test_concurrent_identical_webhooks_credited_only_once(self, db, test_booking):
        booking_id = test_booking.id
        ref_id = f"REF-RACE-{uuid.uuid4().hex[:8].upper()}"
        dcn_txn_id = f"DCN-TXN-RACE-{uuid.uuid4().hex[:8].upper()}"
        utr_no = f"UTR-YESB-{uuid.uuid4().hex[:8].upper()}"
        payment_amount = 6720.0

        # Pre-seed a PaymentTransaction record in PENDING state
        txn = models.PaymentTransaction(
            reference_id=ref_id,
            booking_id=booking_id,
            room_no="101",
            amount=payment_amount,
            currency="INR",
            purpose_message="Room Settlement",
            payment_method="UPI_QR",
            status="PENDING",
            decentro_txn_id=dcn_txn_id
        )
        db.add(txn)
        db.commit()

        webhook_payload = {
            "decentro_txn_id": dcn_txn_id,
            "reference_id": ref_id,
            "transaction_status": "SUCCESS",
            "amount": payment_amount,
            "bank_reference_number": utr_no,
            "payer_vpa": "kishore@okhdfcbank"
        }
        payload_bytes = json.dumps(webhook_payload).encode("utf-8")
        headers = make_signed_headers(payload_bytes)

        # Fire 5 concurrent requests with identical payload
        def fire_webhook():
            c = TestClient(app)
            resp = c.post("/api/v1/webhooks/decentro", content=payload_bytes, headers=headers)
            return resp.status_code, resp.json()

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(fire_webhook) for _ in range(5)]
            results = [f.result() for f in futures]

        # 1. Verify every request received a successful 200 OK acknowledgment
        status_codes = [r[0] for r in results]
        assert all(code == 200 for code in status_codes), f"Not all requests succeeded: {status_codes}"

        # 2. Database verification: Customer Folio and Booking credited EXACTLY ONCE
        db.expire_all()
        booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
        folio = db.query(models.Folio).filter(models.Folio.booking_id == booking_id).first()

        assert booking.total_paid == payment_amount, f"Booking double-credited: total_paid = {booking.total_paid}"
        assert booking.balance_due == 0.0
        assert booking.payment_status == "Paid"

        assert folio.total_payments == payment_amount, f"Folio double-credited: total_payments = {folio.total_payments}"
        assert folio.balance_due == 0.0
        assert folio.status == "SETTLED"

        # 3. Bank Ledger Verification: Exactly 1 BookingPayment and 1 JournalEntry
        payments = db.query(models.BookingPayment).filter(
            models.BookingPayment.booking_id == booking_id,
            models.BookingPayment.transaction_ref == utr_no
        ).all()
        assert len(payments) == 1, f"Expected exactly 1 BookingPayment, found {len(payments)}"
        assert payments[0].amount == payment_amount

        ledger_jvs = db.query(models.JournalEntry).filter(
            models.JournalEntry.reference_no == utr_no
        ).all()
        assert len(ledger_jvs) == 1, f"Expected exactly 1 JournalEntry in bank ledger, found {len(ledger_jvs)}"
        assert ledger_jvs[0].amount_rupees == payment_amount
        assert "Bank Account (Decentro" in ledger_jvs[0].debit_account


# ===================================================================================================
# 2. EDGE CASES: PARTIAL, OVERPAYMENT, EXPIRED CALLBACK, VIRTUAL ACCOUNT RTGS
# ===================================================================================================

class TestDecentroWebhookEdgeCases:
    """
    Validates boundary conditions and enterprise settlement paths:
      - Partial payment against dynamic QR
      - Overpayment tracking
      - Expired QR payment callback
      - Dedicated Virtual Account RTGS settlement reconciliation
    """

    def test_partial_payment_against_dynamic_qr(self, db, test_booking):
        """Dynamic QR for ₹6,720 receives partial payment of ₹2,500."""
        booking_id = test_booking.id
        ref_id = f"REF-PARTIAL-{uuid.uuid4().hex[:8].upper()}"
        dcn_txn_id = f"DCN-TXN-PARTIAL-{uuid.uuid4().hex[:8].upper()}"
        utr_no = f"UTR-YESB-PARTIAL-{uuid.uuid4().hex[:6].upper()}"

        partial_amount = 2500.0

        txn = models.PaymentTransaction(
            reference_id=ref_id,
            booking_id=booking_id,
            amount=6720.0, # Original full amount
            status="PENDING",
            decentro_txn_id=dcn_txn_id
        )
        db.add(txn)
        db.commit()

        webhook_payload = {
            "decentro_txn_id": dcn_txn_id,
            "reference_id": ref_id,
            "transaction_status": "SUCCESS",
            "amount": partial_amount, # Guest only paid ₹2,500
            "bank_reference_number": utr_no,
            "payer_vpa": "guest@upi"
        }
        payload_bytes = json.dumps(webhook_payload).encode("utf-8")
        headers = make_signed_headers(payload_bytes)

        resp = client.post("/api/v1/webhooks/decentro", content=payload_bytes, headers=headers)
        assert resp.status_code == 200

        db.expire_all()
        booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
        folio = db.query(models.Folio).filter(models.Folio.booking_id == booking_id).first()

        # Partial payment reflected accurately
        assert booking.total_paid == partial_amount
        assert booking.balance_due == round(6720.0 - partial_amount, 2)
        assert booking.payment_status == "Partial"

        assert folio.total_payments == partial_amount
        assert folio.balance_due == round(6720.0 - partial_amount, 2)
        assert folio.status == "OPEN"

    def test_overpayment_tracks_excess_and_settles_folio(self, db, test_booking):
        """Bill for ₹6,720 receives overpayment of ₹8,000."""
        booking_id = test_booking.id
        ref_id = f"REF-OVERPAY-{uuid.uuid4().hex[:8].upper()}"
        dcn_txn_id = f"DCN-TXN-OVERPAY-{uuid.uuid4().hex[:8].upper()}"
        utr_no = f"UTR-YESB-OVERPAY-{uuid.uuid4().hex[:6].upper()}"

        overpay_amount = 8000.0

        txn = models.PaymentTransaction(
            reference_id=ref_id,
            booking_id=booking_id,
            amount=6720.0,
            status="PENDING",
            decentro_txn_id=dcn_txn_id
        )
        db.add(txn)
        db.commit()

        webhook_payload = {
            "decentro_txn_id": dcn_txn_id,
            "reference_id": ref_id,
            "transaction_status": "SUCCESS",
            "amount": overpay_amount,
            "bank_reference_number": utr_no,
            "payer_vpa": "generous.guest@upi"
        }
        payload_bytes = json.dumps(webhook_payload).encode("utf-8")
        headers = make_signed_headers(payload_bytes)

        resp = client.post("/api/v1/webhooks/decentro", content=payload_bytes, headers=headers)
        assert resp.status_code == 200

        db.expire_all()
        booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
        folio = db.query(models.Folio).filter(models.Folio.booking_id == booking_id).first()

        assert booking.total_paid == overpay_amount
        assert booking.balance_due == 0.0
        assert booking.payment_status == "Paid"

        assert folio.total_payments == overpay_amount
        assert folio.balance_due == 0.0
        assert folio.status == "SETTLED"

        # Verify overpayment note on BookingPayment
        bp = db.query(models.BookingPayment).filter(
            models.BookingPayment.booking_id == booking_id,
            models.BookingPayment.transaction_ref == utr_no
        ).first()
        assert bp is not None
        assert "Overpayment Excess" in bp.notes

    def test_expired_qr_payment_callback_does_not_credit_folio(self, db, test_booking):
        """Callback with status EXPIRED marks transaction EXPIRED without touching folio."""
        booking_id = test_booking.id
        ref_id = f"REF-EXPIRED-{uuid.uuid4().hex[:8].upper()}"
        dcn_txn_id = f"DCN-TXN-EXPIRED-{uuid.uuid4().hex[:8].upper()}"

        txn = models.PaymentTransaction(
            reference_id=ref_id,
            booking_id=booking_id,
            amount=6720.0,
            status="PENDING",
            decentro_txn_id=dcn_txn_id
        )
        db.add(txn)
        db.commit()

        webhook_payload = {
            "decentro_txn_id": dcn_txn_id,
            "reference_id": ref_id,
            "transaction_status": "EXPIRED",
            "amount": 6720.0
        }
        payload_bytes = json.dumps(webhook_payload).encode("utf-8")
        headers = make_signed_headers(payload_bytes)

        resp = client.post("/api/v1/webhooks/decentro", content=payload_bytes, headers=headers)
        assert resp.status_code == 200

        db.expire_all()
        updated_txn = db.query(models.PaymentTransaction).filter(models.PaymentTransaction.reference_id == ref_id).first()
        booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
        folio = db.query(models.Folio).filter(models.Folio.booking_id == booking_id).first()

        assert updated_txn.status == "EXPIRED"
        assert booking.total_paid == 0.0
        assert booking.balance_due == 6720.0
        assert folio.total_payments == 0.0
        assert folio.status == "OPEN"

    def test_virtual_account_rtgs_settlement_reconciliation(self, db, test_booking):
        """Corporate client pays ₹6,720 via RTGS to assigned Virtual Account."""
        booking_id = test_booking.id
        va_acc = f"YESB{uuid.uuid4().hex[:10].upper()}"
        va_ref = f"VA-CORP-{uuid.uuid4().hex[:6].upper()}"
        rtgs_utr = f"YESBRTGS{uuid.uuid4().hex[:8].upper()}"
        dcn_txn_id = f"DCN-TXN-VA-{uuid.uuid4().hex[:8].upper()}"

        va = models.VirtualAccount(
            reference_id=va_ref,
            corporate_client_id="CORP-JK-PAPER",
            booking_id=booking_id,
            account_number=va_acc,
            ifsc_code="YESB0CMSNOC",
            bank_name="YES BANK",
            account_name="SRI SAI VASUDEV - JK PAPER LTD",
            status="ACTIVE"
        )
        db.add(va)
        db.commit()

        webhook_payload = {
            "decentro_txn_id": dcn_txn_id,
            "account_number": va_acc,
            "transaction_status": "SUCCESS",
            "transfer_type": "RTGS",
            "amount": 6720.0,
            "bank_reference_number": rtgs_utr,
            "payer_name": "JK Paper Mills Rayagada"
        }
        payload_bytes = json.dumps(webhook_payload).encode("utf-8")
        headers = make_signed_headers(payload_bytes)

        resp = client.post("/api/v1/webhooks/decentro", content=payload_bytes, headers=headers)
        assert resp.status_code == 200

        db.expire_all()
        booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
        folio = db.query(models.Folio).filter(models.Folio.booking_id == booking_id).first()

        # Corporate booking and folio settled
        assert booking.total_paid == 6720.0
        assert booking.balance_due == 0.0
        assert booking.payment_status == "Paid"
        assert "Virtual Account (RTGS)" in booking.payment_method

        assert folio.total_payments == 6720.0
        assert folio.balance_due == 0.0
        assert folio.status == "SETTLED"

        # Verify BookingPayment record
        bp = db.query(models.BookingPayment).filter(
            models.BookingPayment.booking_id == booking_id,
            models.BookingPayment.transaction_ref == rtgs_utr
        ).first()
        assert bp is not None
        assert bp.payment_mode == "Virtual Account (RTGS)"

        # Verify Bank Ledger Journal Entry
        jv = db.query(models.JournalEntry).filter(
            models.JournalEntry.reference_no == rtgs_utr
        ).first()
        assert jv is not None
        assert jv.debit_account == "Bank Account (Decentro RTGS)"
        assert jv.amount_rupees == 6720.0


# ===================================================================================================
# 3. SECURITY: HMAC SIGNATURE VERIFICATION, MALFORMED PAYLOADS, REPLAY REJECTION
# ===================================================================================================

class TestDecentroWebhookSecurity:
    """
    Verifies zero-trust webhook security:
      - Invalid/forged HMAC signature rejected with 401 Unauthorized
      - Missing HMAC signature rejected with 401 Unauthorized
      - Malformed non-JSON payload rejected with 400 Bad Request
      - Replayed bank reference UTR rejected with UTR_REPLAY_REJECTED
    """

    def test_forged_hmac_signature_rejected_with_401(self):
        payload = {"decentro_txn_id": "DCN-MALICIOUS-01", "amount": 1000.0}
        payload_bytes = json.dumps(payload).encode("utf-8")

        resp = client.post(
            "/api/v1/webhooks/decentro",
            content=payload_bytes,
            headers={
                "Content-Type": "application/json",
                "X-Decentro-Signature": "forged_malicious_signature_hash_12345"
            }
        )
        assert resp.status_code == 401
        assert "Invalid webhook signature" in resp.json()["detail"]

    def test_missing_signature_header_rejected_with_401(self):
        payload = {"decentro_txn_id": "DCN-NOSIG-01", "amount": 1000.0}
        payload_bytes = json.dumps(payload).encode("utf-8")

        resp = client.post(
            "/api/v1/webhooks/decentro",
            content=payload_bytes,
            headers={"Content-Type": "application/json"}
        )
        assert resp.status_code == 401
        assert "signature" in resp.json()["detail"].lower()

    def test_malformed_json_payload_rejected_with_400_without_crashing(self):
        malformed_bytes = b"{{{ this is corrupt not valid json %%%"
        headers = make_signed_headers(malformed_bytes)

        resp = client.post(
            "/api/v1/webhooks/decentro",
            content=malformed_bytes,
            headers=headers
        )
        assert resp.status_code == 400
        assert "Invalid JSON payload" in resp.json()["detail"]

    def test_duplicate_utr_replay_attack_rejected(self, db, test_booking):
        """Same bank UTR cannot be reused across different payment transactions."""
        utr_replay = f"UTR-REPLAY-{uuid.uuid4().hex[:8].upper()}"

        # 1. Existing successfully settled transaction with this UTR
        settled_txn = models.PaymentTransaction(
            reference_id=f"REF-LEGIT-{uuid.uuid4().hex[:6].upper()}",
            booking_id=test_booking.id,
            amount=3000.0,
            status="SUCCESS",
            bank_reference_number=utr_replay,
            decentro_txn_id=f"DCN-LEGIT-{uuid.uuid4().hex[:6].upper()}"
        )
        db.add(settled_txn)
        db.commit()

        # 2. Second new transaction attempting to claim the SAME UTR
        replayed_ref = f"REF-ATTACK-{uuid.uuid4().hex[:6].upper()}"
        attack_txn = models.PaymentTransaction(
            reference_id=replayed_ref,
            booking_id=test_booking.id,
            amount=3000.0,
            status="PENDING",
            decentro_txn_id=f"DCN-ATTACK-{uuid.uuid4().hex[:6].upper()}"
        )
        db.add(attack_txn)
        db.commit()

        webhook_payload = {
            "decentro_txn_id": attack_txn.decentro_txn_id,
            "reference_id": replayed_ref,
            "transaction_status": "SUCCESS",
            "amount": 3000.0,
            "bank_reference_number": utr_replay
        }
        payload_bytes = json.dumps(webhook_payload).encode("utf-8")
        headers = make_signed_headers(payload_bytes)

        resp = client.post("/api/v1/webhooks/decentro", content=payload_bytes, headers=headers)
        assert resp.status_code == 200

        db.expire_all()
        reloaded_attack = db.query(models.PaymentTransaction).filter(
            models.PaymentTransaction.reference_id == replayed_ref
        ).first()

        assert reloaded_attack.status == "UTR_REPLAY_REJECTED", f"Expected UTR_REPLAY_REJECTED, got {reloaded_attack.status}"
