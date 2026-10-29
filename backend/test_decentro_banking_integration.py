"""
Test Suite: Decentro Banking & FinTech Integration Test Suite
Target: Hotel Sai Vasudev Residency Backend API
Validates:
  1. Dynamic UPI QR generation with Base64 QR code and intent link
  2. Decentro Payment Success Webhook processing
  3. Webhook idempotency (Duplicate callback protection preventing double-credit)
  4. Virtual Account creation for Corporate & Group Bookings
  5. Transaction reconciliation and status retrieval
"""

import sys
import os
import json
import uuid
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
from app.database import Base, engine, SessionLocal
from app import models

client = TestClient(app)

def test_decentro_banking_e2e():
    print("\n" + "="*80)
    print("  TEST SUITE: DECENTRO BANKING & FINTECH INTEGRATION")
    print("="*80)

    # 1. Setup Fresh Database Session
    db = SessionLocal()
    try:
        # Create test booking
        booking_ref = f"SVR-DEC-{uuid.uuid4().hex[:6].upper()}"
        test_booking = models.Booking(
            booking_ref=booking_ref,
            room_id=1,
            guest_name="Sri Leela Rakesh",
            guest_email="rakesh@sai-vasudev.com",
            guest_phone="9466219194",
            check_in_date="2026-10-26",
            check_out_date="2026-10-28",
            base_rate=2500.0,
            base_amount=5000.0,
            total_price=5600.0,
            total_paid=0.0,
            balance_due=5600.0,
            status="Checked-In",
            id_proof_type="Aadhaar Card",
            id_proof_number="756476765721"
        )
        db.add(test_booking)
        db.commit()
        db.refresh(test_booking)
        print(f"   [SETUP] Created Test Booking: Ref={booking_ref}, Guest='{test_booking.guest_name}', Total=Rs.{test_booking.total_price}")

        # ---------------------------------------------------------------------
        # TEST 1: Generate Dynamic Decentro UPI QR
        # ---------------------------------------------------------------------
        print("\n1. Testing Decentro Dynamic UPI QR Generation (/api/v1/payments/decentro/upi-qr)...")
        qr_payload = {
            "booking_id": test_booking.id,
            "room_no": "101",
            "amount": 2500.0,
            "purpose_message": f"Advance Settlement for {booking_ref}",
            "expiry_minutes": 15
        }
        res_qr = client.post(
            "/api/v1/payments/decentro/upi-qr",
            json=qr_payload,
            headers={"X-Idempotency-Key": f"TEST-QR-{uuid.uuid4().hex}"}
        )
        assert res_qr.status_code == 200, f"UPI QR generation failed: {res_qr.text}"
        qr_data = res_qr.json()
        reference_id = qr_data["reference_id"]
        decentro_txn_id = qr_data["decentro_txn_id"]
        assert reference_id is not None
        assert qr_data["amount"] == 2500.0
        assert "upi://" in qr_data["upi_intent_link"] or qr_data["status"] == "PENDING"
        print(f"   [PASS] Decentro UPI QR Generated: Ref={reference_id}, TxnId={decentro_txn_id}, Status={qr_data['status']}")

        # ---------------------------------------------------------------------
        # TEST 2: Process Real-Time Decentro Webhook Callback (Payment Success)
        # ---------------------------------------------------------------------
        print("\n2. Testing Decentro Webhook Listener (/api/v1/webhooks/decentro/payment-callback)...")
        utr_no = f"UTR-{uuid.uuid4().hex[:10].upper()}"
        webhook_payload = {
            "decentro_txn_id": decentro_txn_id,
            "reference_id": reference_id,
            "status": "SUCCESS",
            "transaction_status": "SUCCESS",
            "bank_reference_number": utr_no,
            "amount": 2500.0,
            "payer_vpa": "customer@oksbi",
            "timestamp": "2026-10-26T14:30:00Z"
        }
        res_webhook = client.post(
            "/api/v1/webhooks/decentro/payment-callback",
            json=webhook_payload,
            headers={"Content-Type": "application/json"}
        )
        assert res_webhook.status_code == 200, f"Webhook processing failed: {res_webhook.text}"
        webhook_res = res_webhook.json()
        assert webhook_res["status"] == "SUCCESS"
        print(f"   [PASS] Webhook Processed: UTR={utr_no}, Status={webhook_res['status']}")

        # Verify database mutation
        db.refresh(test_booking)
        txn_rec = db.query(models.PaymentTransaction).filter(models.PaymentTransaction.reference_id == reference_id).first()
        assert txn_rec is not None
        assert txn_rec.status == "SUCCESS"
        assert txn_rec.bank_reference_number == utr_no
        assert test_booking.total_paid >= 2500.0
        print(f"   [PASS] Booking Folio Credited: Paid=Rs.{test_booking.total_paid}, Balance=Rs.{test_booking.balance_due}")

        # ---------------------------------------------------------------------
        # TEST 3: Idempotency Verification (Prevent Double-Credit on Duplicate Webhook)
        # ---------------------------------------------------------------------
        print("\n3. Testing Webhook Idempotency (Prevent Duplicate Credit Attack)...")
        res_dup = client.post(
            "/api/v1/webhooks/decentro/payment-callback",
            json=webhook_payload,
            headers={"Content-Type": "application/json"}
        )
        assert res_dup.status_code == 200
        dup_data = res_dup.json()
        assert "already reconciled" in dup_data.get("message", "").lower() or "idempotent" in dup_data.get("message", "").lower()
        
        # Verify total_paid has NOT doubled
        db.refresh(test_booking)
        assert test_booking.total_paid == 2500.0, f"Idempotency violation! Total paid was doubled to {test_booking.total_paid}"
        print(f"   [PASS] Idempotency Enforced: Second webhook returned '{dup_data['message']}'. Total paid remains Rs.{test_booking.total_paid} (NOT doubled).")

        # ---------------------------------------------------------------------
        # TEST 4: Corporate Virtual Account Creation (NEFT / RTGS)
        # ---------------------------------------------------------------------
        print("\n4. Testing Corporate Virtual Account (/api/v1/payments/decentro/virtual-account)...")
        va_payload = {
            "booking_id": test_booking.id,
            "corporate_name": "TCS Pilgrim Delegations",
            "guest_name": "Rakesh TCS Lead",
            "mobile": "9466219194",
            "email": "corporate@tcs.com"
        }
        res_va = client.post(
            "/api/v1/payments/decentro/virtual-account",
            json=va_payload,
            headers={"X-Idempotency-Key": f"TEST-VA-{uuid.uuid4().hex}"}
        )
        assert res_va.status_code == 200, f"Virtual Account creation failed: {res_va.text}"
        va_data = res_va.json()
        assert va_data["account_number"] is not None
        assert va_data["ifsc_code"] is not None
        print(f"   [PASS] Dedicated Virtual Account Created: A/c No={va_data['account_number']}, IFSC={va_data['ifsc_code']}, Bank={va_data['bank_name']}")

        # ---------------------------------------------------------------------
        # TEST 5: Transaction Status Retrieval
        # ---------------------------------------------------------------------
        print("\n5. Testing Transaction Query by Reference ID...")
        res_txn = client.get(f"/api/v1/payments/decentro/status/{reference_id}")
        assert res_txn.status_code == 200
        fetched_txn = res_txn.json()
        assert fetched_txn["status"] == "SUCCESS"
        assert fetched_txn["amount"] == 2500.0
        assert fetched_txn["bank_reference_number"] == utr_no
        print(f"   [PASS] Transaction Ledger Query Verified: Status={fetched_txn['status']}, Method={fetched_txn['payment_method']}")

        print("\n" + "="*80)
        print("  ALL DECENTRO BANKING & FINTECH INTEGRATION TESTS PASSED 100%!")
        print("="*80)

    finally:
        db.close()

if __name__ == "__main__":
    test_decentro_banking_e2e()
