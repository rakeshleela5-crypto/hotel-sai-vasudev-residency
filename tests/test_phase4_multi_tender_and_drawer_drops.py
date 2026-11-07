"""
Phase 4 Test Suite: Multi-Tender Split Payments & Cash Drawer Drops (Puter POS Pattern)
Validates:
1. Multi-tender split settlement on room departure checkout (e.g., Part Cash + Part UPI).
2. Multi-tender split settlement validation (rejection on amount mismatch, integer-paise precision).
3. Restaurant Food Bill split tender settlement.
4. Cash Drawer float top-up (FLOAT_TOPUP) and double-entry GL journal posting.
5. Cash Drawer safe drops (DROP_TO_SAFE) under threshold (no PIN required).
6. Cash Drawer safe drops (DROP_TO_SAFE) >= ₹5,000 requiring Manager PIN authorization.
7. Cash Drawer petty payouts (PETTY_PAYOUT) with expense ledger debit.
8. Shift Handover current metrics accurately isolating Cash splits from UPI/Card splits.
9. Shift Handover reconciliation factoring drawer drops, floats, and cash refunds.
10. Drawer summary endpoint integration.
"""

import uuid
import json
import datetime
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app import models
from app.routes.auth import create_access_token
from app.utils.money import to_paise, from_paise

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def auth_headers():
    token = create_access_token(
        data={"sub": "duty_manager", "role": "MANAGER", "employee_id": "EMP-DESK-001"},
        expires_delta=datetime.timedelta(hours=2)
    )
    return {
        "Authorization": f"Bearer {token}",
        "X-Idempotency-Key": str(uuid.uuid4())
    }


@pytest.fixture(autouse=True)
def reset_manager_pin_to_bootstrap(db):
    """Ensure tests run against clean bootstrap manager PIN state ('1234')."""
    setting = db.query(models.HotelSetting).filter(models.HotelSetting.key == "default").first()
    if setting:
        setting.manager_pin_hash = None
        setting.manager_pin_salt = None
        db.commit()


def test_checkout_multi_tender_split_success(db, auth_headers):
    """
    Test departure checkout with split tender: ₹2,000 Cash + ₹3,000 UPI.
    Verifies that multiple BookingPayment records are created, folio is settled,
    and CheckoutRecord records payment_mode='Split' with exact JSON splits.
    """
    uid = uuid.uuid4().hex[:6].upper()
    room = models.Room(
        name=f"401-{uid}",
        slug=f"room-401-{uid.lower()}",
        room_type="Deluxe",
        price_per_night=5000.0,
        description="Deluxe test room",
        image_url="https://example.com/r.jpg",
        housekeeping_status="Clean",
        is_available=True
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    ref = f"SPLIT-{uuid.uuid4().hex[:6].upper()}"
    booking = models.Booking(
        booking_ref=ref,
        guest_name="Sri Rama Rao",
        guest_email="ramarao@example.com",
        guest_phone="9848011223",
        room_id=room.id,
        check_in_date=datetime.date.today().isoformat(),
        check_out_date=(datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
        status="Checked-In",
        total_nights=1,
        base_rate=5000.0,
        base_amount=5000.0,
        gst_rate=12.0,
        total_tax=600.0,
        cgst_amount=300.0,
        sgst_amount=300.0,
        total_price=5600.0,
        total_paid=600.0,
        balance_due=5000.0,
        payment_status="Partial",
        payment_method="Cash"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    folio = models.Folio(
        booking_id=booking.id,
        folio_number=f"FOLIO-{uuid.uuid4().hex[:6].upper()}",
        total_charges=5600.0,
        total_payments=600.0,
        balance_due=5000.0,
        status="OPEN"
    )
    db.add(folio)

    adv_payment = models.BookingPayment(
        booking_id=booking.id,
        payment_type="Advance",
        payment_mode="Cash",
        amount=600.0,
        notes="Advance deposit",
        collected_by="Front Desk"
    )
    db.add(adv_payment)
    db.commit()

    # Settle balance due of ₹5,000 via Split Tender: ₹2,000 Cash + ₹3,000 UPI
    payload = {
        "booking_ref": booking.booking_ref,
        "settlement_payment_mode": "Split",
        "settlement_amount_paid": 5000.0,
        "payment_splits": [
            {"mode": "Cash", "amount": 2000.0, "ref": "CASH-TILL-1"},
            {"mode": "UPI", "amount": 3000.0, "ref": "UPI-GPAY-9988"}
        ],
        "processed_by": "Senior Front Desk Cashier"
    }

    res = client.post("/api/v1/pms/bookings/checkout", json=payload, headers=auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["net_balance_due"] <= 0.0

    # Verify Booking status
    db.refresh(booking)
    assert booking.status == "Checked-Out"
    assert booking.balance_due <= 0.0
    assert booking.payment_status == "Paid"

    # Verify individual BookingPayment records
    payments = db.query(models.BookingPayment).filter(
        models.BookingPayment.booking_id == booking.id,
        models.BookingPayment.payment_type == "Settlement"
    ).all()
    assert len(payments) == 2
    modes = {p.payment_mode: p.amount for p in payments}
    assert modes.get("Cash") == 2000.0
    assert modes.get("UPI") == 3000.0

    # Verify CheckoutRecord
    chk = db.query(models.CheckoutRecord).filter(models.CheckoutRecord.invoice_no == booking.invoice_number).first()
    assert chk is not None
    assert chk.payment_mode == "Split"
    splits_data = json.loads(chk.payment_splits_json)
    assert len(splits_data) == 2
    assert splits_data[0]["mode"] == "Cash"
    assert splits_data[0]["amount"] == 2000.0
    assert splits_data[1]["mode"] == "UPI"
    assert splits_data[1]["amount"] == 3000.0


def test_checkout_multi_tender_split_mismatch_rejected(db, auth_headers):
    """
    Test departure checkout rejection when split sum does not match settlement amount.
    """
    uid = uuid.uuid4().hex[:6].upper()
    room = models.Room(
        name=f"402-{uid}",
        slug=f"room-402-{uid.lower()}",
        room_type="Deluxe",
        price_per_night=3000.0,
        description="Deluxe test room",
        image_url="https://example.com/r.jpg",
        housekeeping_status="Clean",
        is_available=True
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    ref = f"FAIL-{uuid.uuid4().hex[:6].upper()}"
    booking = models.Booking(
        booking_ref=ref,
        guest_name="Test Mismatch",
        guest_email="mismatch@example.com",
        guest_phone="9848011224",
        room_id=room.id,
        check_in_date=datetime.date.today().isoformat(),
        check_out_date=(datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
        status="Checked-In",
        total_price=3000.0,
        total_paid=0.0,
        balance_due=3000.0,
        payment_status="Unpaid"
    )
    db.add(booking)
    db.commit()

    payload = {
        "booking_ref": booking.booking_ref,
        "settlement_payment_mode": "Split",
        "settlement_amount_paid": 3000.0,
        "payment_splits": [
            {"mode": "Cash", "amount": 1000.0},
            {"mode": "UPI", "amount": 1500.0}  # Total ₹2,500 != ₹3,000
        ]
    }

    res = client.post("/api/v1/pms/bookings/checkout", json=payload, headers=auth_headers)
    assert res.status_code == 400
    assert "does not match settlement amount" in res.json()["detail"]


def test_food_bill_multi_tender_split_success(db, auth_headers):
    """
    Test restaurant food bill with split tenders: ₹200 Cash + ₹325 UPI = ₹525 total.
    """
    bill_no = f"FB-SPLIT-{uuid.uuid4().hex[:6].upper()}"
    payload = {
        "bill_no": bill_no,
        "table_no": "Table T-1",
        "guest_name": "Family Dining",
        "food_gross_amount": 500.0,
        "taxable_amount": 500.0,
        "gst_percent": 5.0,
        "cgst_amount": 12.5,
        "sgst_amount": 12.5,
        "gst_amount": 25.0,
        "net_bill_amount": 525.0,
        "settlement_type": "Split",
        "payment_splits": [
            {"mode": "Cash", "amount": 200.0},
            {"mode": "UPI", "amount": 325.0, "ref": "PHONEPE-7788"}
        ],
        "billed_by": "POS Cashier 1"
    }

    res = client.post("/api/v1/pms/food-bills", json=payload, headers=auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["bill_no"] == bill_no
    assert data["settlement_type"] == "Split"

    # Verify DB persistence
    bill = db.query(models.FoodBill).filter(models.FoodBill.bill_no == bill_no).first()
    assert bill is not None
    assert bill.payment_splits_json is not None
    splits = json.loads(bill.payment_splits_json)
    assert len(splits) == 2
    assert splits[0]["mode"] == "Cash"
    assert splits[0]["amount"] == 200.0
    assert splits[1]["mode"] == "UPI"
    assert splits[1]["amount"] == 325.0


def test_food_bill_split_mismatch_rejected(db, auth_headers):
    """
    Test food bill rejection when split sum does not match net bill amount.
    """
    bill_no = f"FB-ERR-{uuid.uuid4().hex[:6].upper()}"
    payload = {
        "bill_no": bill_no,
        "taxable_amount": 100.0,
        "gst_amount": 5.0,
        "net_bill_amount": 105.0,
        "payment_splits": [
            {"mode": "Cash", "amount": 50.0},
            {"mode": "Card", "amount": 40.0}  # Total 90 != 105
        ]
    }
    res = client.post("/api/v1/pms/food-bills", json=payload, headers=auth_headers)
    assert res.status_code == 400
    assert "does not match net bill amount" in res.json()["detail"]


def test_drawer_movement_float_topup(db, auth_headers):
    """
    Test drawer float top-up (FLOAT_TOPUP) and verify GL journal entry.
    """
    payload = {
        "movement_type": "FLOAT_TOPUP",
        "amount": 2500.0,
        "cashier_name": "Ramu Cashier",
        "reason": "Replenish morning shift float with small notes",
        "destination_or_source": "Main Safe"
    }

    res = client.post("/api/v1/pms/drawer/movements", json=payload, headers=auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["movement_type"] == "FLOAT_TOPUP"
    assert data["amount"] == 2500.0
    assert data["amount_paise"] == 250000
    assert data["voucher_no"].startswith("SVR/")
    assert "DRW" in data["voucher_no"]

    # Verify Journal Entry
    jv = db.query(models.JournalEntry).filter(models.JournalEntry.reference_no == data["voucher_no"]).first()
    assert jv is not None
    assert jv.debit_account == "Front Desk Cash Drawer"
    assert jv.credit_account == "Property Safe / Float Reserve"
    assert jv.amount_rupees == 2500.0


def test_drawer_movement_safe_drop_under_threshold(db, auth_headers):
    """
    Test cash drop to safe under ₹5,000 without requiring Manager PIN.
    """
    payload = {
        "movement_type": "DROP_TO_SAFE",
        "amount": 3500.0,
        "cashier_name": "Ramu Cashier",
        "reason": "Mid-day excess cash skim to safe",
        "destination_or_source": "Property Safe"
    }

    res = client.post("/api/v1/pms/drawer/movements", json=payload, headers=auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["movement_type"] == "DROP_TO_SAFE"
    assert data["amount"] == 3500.0
    assert data["manager_pin_verified"] is False

    # Verify GL journal entry (Debit Safe, Credit Drawer)
    jv = db.query(models.JournalEntry).filter(models.JournalEntry.reference_no == data["voucher_no"]).first()
    assert jv is not None
    assert jv.debit_account == "Property Safe / Main Vault Cash"
    assert jv.credit_account == "Front Desk Cash Drawer"
    assert jv.amount_rupees == 3500.0


def test_drawer_movement_safe_drop_high_value_requires_manager_pin(db, auth_headers):
    """
    Test cash drop to safe >= ₹5,000 requires Manager PIN authorization.
    1. Rejects if PIN missing (401).
    2. Rejects if PIN invalid (401).
    3. Accepts when valid PIN '1234' is supplied.
    """
    high_drop = {
        "movement_type": "DROP_TO_SAFE",
        "amount": 10000.0,
        "cashier_name": "Ramu Cashier",
        "reason": "Large evening cash skim after pilgrimage bus tour group departure",
        "destination_or_source": "Property Safe"
    }

    # 1. Missing PIN
    res1 = client.post("/api/v1/pms/drawer/movements", json=high_drop, headers=auth_headers)
    assert res1.status_code == 401
    assert "Manager PIN authorization required" in res1.json()["detail"]

    # 2. Invalid PIN
    high_drop["manager_pin"] = "9999"
    res2 = client.post("/api/v1/pms/drawer/movements", json=high_drop, headers=auth_headers)
    assert res2.status_code == 401
    assert "Invalid manager PIN" in res2.json()["detail"]

    # 3. Valid bootstrap PIN '1234'
    high_drop["manager_pin"] = "1234"
    res3 = client.post("/api/v1/pms/drawer/movements", json=high_drop, headers=auth_headers)
    assert res3.status_code == 200, res3.text
    data = res3.json()
    assert data["amount"] == 10000.0
    assert data["manager_pin_verified"] is True
    assert data["authorized_by"] == "Duty Manager"


def test_drawer_movement_petty_payout(db, auth_headers):
    """
    Test drawer petty payout (PETTY_PAYOUT) for small immediate cash expenses.
    """
    payload = {
        "movement_type": "PETTY_PAYOUT",
        "amount": 450.0,
        "cashier_name": "Ramu Cashier",
        "reason": "Emergency ice blocks and lemon purchase for kitchen",
        "destination_or_source": "Local Market"
    }

    res = client.post("/api/v1/pms/drawer/movements", json=payload, headers=auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["movement_type"] == "PETTY_PAYOUT"
    assert data["amount"] == 450.0

    # Verify Journal Entry (Debit Expense, Credit Drawer)
    jv = db.query(models.JournalEntry).filter(models.JournalEntry.reference_no == data["voucher_no"]).first()
    assert jv is not None
    assert jv.debit_account == "Petty Cash Operational Expenses"
    assert jv.credit_account == "Front Desk Cash Drawer"
    assert jv.amount_rupees == 450.0


def test_shift_handover_reconciliation_with_splits_and_drops(db, auth_headers):
    """
    Test Shift Handover current metrics and persistence:
    - Opening Float: e.g. ₹5,000
    - Safe Drops: e.g. ₹10,000 + ₹3,500 = ₹13,500
    - Float Topup: ₹2,500
    - Food split cash portion: ₹200
    - Room split cash portion: ₹2,000
    - Drawer summary & reconciliation formulas are zero-drift.
    """
    # Create a fresh closed shift to reset baseline
    s_id = f"SHIFT-BASE-{uuid.uuid4().hex[:4].upper()}"
    base_shift = models.ShiftHandover(
        shift_id=s_id,
        shift_date=datetime.date.today().isoformat(),
        shift_time="07:00 AM - 03:00 PM",
        user_email="prev_cashier@hotel.com",
        user_name="Previous Cashier",
        opening_drawer_cash=5000.0,
        net_physical_cash_in_drawer=5000.0,
        status="Verified & Closed"
    )
    db.add(base_shift)
    db.commit()

    # Now add transactions in this new shift window:
    # 1. Cash Drawer Float Top-Up: +₹1,000
    client.post("/api/v1/pms/drawer/movements", json={
        "movement_type": "FLOAT_TOPUP",
        "amount": 1000.0,
        "cashier_name": "Shift Cashier",
        "reason": "Mid-shift float boost"
    }, headers=auth_headers)

    # 2. Food Bill with split: ₹400 Cash + ₹600 UPI = ₹1,000
    fb_no = f"FB-SHIFT-{uuid.uuid4().hex[:4].upper()}"
    client.post("/api/v1/pms/food-bills", json={
        "bill_no": fb_no,
        "food_gross_amount": 952.38,
        "taxable_amount": 952.38,
        "gst_amount": 47.62,
        "net_bill_amount": 1000.0,
        "payment_splits": [
            {"mode": "Cash", "amount": 400.0},
            {"mode": "UPI", "amount": 600.0}
        ]
    }, headers=auth_headers)

    # 3. Cash Drop to Safe: -₹2,000
    client.post("/api/v1/pms/drawer/movements", json={
        "movement_type": "DROP_TO_SAFE",
        "amount": 2000.0,
        "cashier_name": "Shift Cashier",
        "reason": "Drop to safe"
    }, headers=auth_headers)

    # Fetch live current metrics
    res_metrics = client.get("/api/v1/pms/shift-handovers/current-metrics", headers=auth_headers)
    assert res_metrics.status_code == 200, res_metrics.text
    m = res_metrics.json()

    assert m["openingDrawerCash"] == 5000.0
    assert m["foodCashCollected"] == 400.0
    assert m["paidInDrawerFloat"] == 1000.0
    assert m["drawerDropsToSafe"] == 2000.0
    assert m["onlineUpiVerified"] == 600.0

    # Expected Drawer Cash = 5000 (opening) + 400 (food cash) + 1000 (float) - 2000 (drop) = 4400.0
    expected_c = round(5000.0 + 400.0 + 1000.0 - 2000.0, 2)
    assert m["expectedDrawerCash"] == expected_c

    # Save Shift Handover with the counted physical cash matching expected cash
    close_shift_id = f"SHIFT-CLOSE-{uuid.uuid4().hex[:4].upper()}"
    save_res = client.post("/api/v1/pms/shift-handovers", json={
        "shift_id": close_shift_id,
        "shift_date": datetime.date.today().isoformat(),
        "opening_drawer_cash": 5000.0,
        "food_cash_collected": 400.0,
        "paid_in_drawer_float": 1000.0,
        "drawer_drops_to_safe": 2000.0,
        "net_physical_cash_in_drawer": expected_c,
        "online_upi_verified": 600.0,
        "handover_to_user": "next_shift@hotel.com",
        "status": "Verified & Closed"
    }, headers=auth_headers)
    assert save_res.status_code == 200, save_res.text

    saved_shift = db.query(models.ShiftHandover).filter(models.ShiftHandover.shift_id == close_shift_id).first()
    assert saved_shift is not None
    assert saved_shift.drawer_drops_to_safe == 2000.0
    assert saved_shift.paid_in_drawer_float == 1000.0
    assert saved_shift.net_physical_cash_in_drawer == expected_c


def test_drawer_summary_endpoint(auth_headers):
    """
    Test GET /api/v1/pms/drawer/summary returns complete drawer summary.
    """
    res = client.get("/api/v1/pms/drawer/summary", headers=auth_headers)
    assert res.status_code == 200, res.text
    summary = res.json()
    assert "openingDrawerCash" in summary
    assert "paidInDrawerFloat" in summary
    assert "drawerDropsToSafe" in summary
    assert "expectedDrawerCash" in summary
