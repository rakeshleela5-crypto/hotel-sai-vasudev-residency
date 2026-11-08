import datetime
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import get_db
from app import models
from app.config import settings

client = TestClient(app)

@pytest.fixture
def db_session():
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

# -------------------------------------------------------------------------
# Test 1: Walk-In Check-In Allowed With Future Non-Overlapping Booking (Flaw 1)
# -------------------------------------------------------------------------
def test_walkin_checkin_allows_future_non_overlapping_reservation(db_session: Session):
    room_name = f"301-{uuid.uuid4().hex[:4]}"
    room = models.Room(
        name=room_name,
        slug=f"room-{uuid.uuid4().hex[:8]}",
        description="Deluxe test room",
        image_url="https://example.com/room.jpg",
        room_type="Deluxe AC",
        price_per_night=2500.0,
        housekeeping_status="Available",
        is_available=True
    )
    db_session.add(room)
    db_session.commit()

    today = datetime.date.today()
    future_in = (today + datetime.timedelta(days=7)).isoformat()
    future_out = (today + datetime.timedelta(days=9)).isoformat()

    # Create confirmed future booking
    future_booking = models.Booking(
        booking_ref=f"BK-FUT-{uuid.uuid4().hex[:6]}",
        invoice_number=f"INV-{uuid.uuid4().hex[:6]}",
        room_id=room.id,
        guest_name="Future Pilgrim",
        guest_email="pilgrim@future.com",
        guest_phone="9988776655",
        check_in_date=future_in,
        check_out_date=future_out,
        base_rate=2500.0,
        base_amount=5000.0,
        total_price=5600.0,
        total_paid=1000.0,
        balance_due=4600.0,
        status="Confirmed"
    )
    db_session.add(future_booking)
    db_session.commit()

    # Attempt walk-in check-in for tonight (today to tomorrow)
    tomorrow = (today + datetime.timedelta(days=1)).isoformat()
    res = client.post("/api/v1/pms/check-in", json={
        "room_id": room.id,
        "guest_name": "Walk-In Devotee",
        "guest_phone": "9123456789",
        "guest_email": "walkin@devotee.com",
        "check_in_date": today.isoformat(),
        "check_out_date": tomorrow,
        "adults": 2,
        "advance_amount": 500.0,
        "advance_payment_mode": "Cash"
    })
    assert res.status_code == 200, f"Walk-in was blocked unexpectedly: {res.text}"
    db_session.expire_all()
    room_db = db_session.query(models.Room).filter(models.Room.id == room.id).first()
    assert room_db.housekeeping_status == "Occupied"
    assert room_db.is_available is False

# -------------------------------------------------------------------------
# Test 2: Advance Reservation Check-In Fulfillment Endpoint (Flaw 2)
# -------------------------------------------------------------------------
def test_advance_reservation_checkin_fulfillment(db_session: Session):
    room_name = f"302-{uuid.uuid4().hex[:4]}"
    room = models.Room(
        name=room_name,
        slug=f"room-{uuid.uuid4().hex[:8]}",
        description="Deluxe test room",
        image_url="https://example.com/room.jpg",
        room_type="Deluxe AC",
        price_per_night=2000.0,
        housekeeping_status="Available",
        is_available=True
    )
    db_session.add(room)
    db_session.commit()

    today = datetime.date.today().isoformat()
    tomorrow = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
    b_ref = f"BK-PRE-{uuid.uuid4().hex[:6]}"
    booking = models.Booking(
        booking_ref=b_ref,
        invoice_number=f"INV-{uuid.uuid4().hex[:6]}",
        room_id=room.id,
        guest_name="Lord Venkateswara Devotee",
        guest_email="devotee@tirupati.org",
        guest_phone="9848011223",
        check_in_date=today,
        check_out_date=tomorrow,
        base_rate=2000.0,
        base_amount=2000.0,
        total_price=2240.0,
        total_paid=500.0,
        balance_due=1740.0,
        status="Confirmed"
    )
    db_session.add(booking)
    db_session.commit()

    # Fulfill check-in via dedicated reservation endpoint
    res = client.post("/api/v1/pms/reservations/check-in", json={
        "booking_ref": b_ref,
        "room_id_or_no": room_name,
        "guest_name": "Lord Venkateswara Devotee",
        "guest_phone": "9848011223",
        "keycard_rfid": "RFID-889922",
        "settled_by": "Reception Cashier"
    })
    assert res.status_code == 200, f"Fulfillment failed: {res.text}"
    data = res.json()
    assert data["booking_ref"] == b_ref
    assert data["status"] == "Checked-In"

    db_session.expire_all()
    booking_db = db_session.query(models.Booking).filter(models.Booking.booking_ref == b_ref).first()
    room_db = db_session.query(models.Room).filter(models.Room.id == room.id).first()
    assert booking_db.status == "Checked-In"
    assert room_db.housekeeping_status == "Occupied"

    # Verify no duplicate booking was created for this room
    total_bookings = db_session.query(models.Booking).filter(
        models.Booking.room_id == room.id,
        models.Booking.status == "Checked-In"
    ).count()
    assert total_bookings == 1

# -------------------------------------------------------------------------
# Test 3: Soft Voiding & Contra Reversal of GL Receipts & Payments (Flaw 3)
# -------------------------------------------------------------------------
def test_gl_receipt_and_payment_void_audit_trail(db_session: Session):
    party_id = f"pa-{uuid.uuid4().hex[:6]}"
    party = models.PartyAccount(
        id=party_id,
        name=f"Corporate Client {uuid.uuid4().hex[:4]}",
        category="Corporate",
        balance=5000.0,
        balance_type="Dr"
    )
    db_session.add(party)
    db_session.commit()

    rcp_no = f"RCP-TST-{uuid.uuid4().hex[:6]}"
    # 1. Create and then void a General Receipt
    rcp_res = client.post("/api/v1/pms/general-receipts", json={
        "receipt_no": rcp_no,
        "account_name": party.name,
        "amount": 2000.0,
        "payment_mode": "Bank Transfer",
        "collected_by": "Senior Accountant"
    })
    assert rcp_res.status_code == 200
    actual_rcp_no = rcp_res.json()["receiptNo"]

    # Void the receipt by receipt_no
    del_rcp = client.delete(f"/api/v1/pms/general-receipts/{actual_rcp_no}?reason=Wrong+amount+entered")
    assert del_rcp.status_code == 200
    del_rcp_data = del_rcp.json()
    assert del_rcp_data["success"] is True

    # Verify receipt record still exists via include_deleted=True, marked is_deleted=True
    db_session.expire_all()
    rcp_db = db_session.query(models.GeneralReceipt).execution_options(include_deleted=True).filter(
        models.GeneralReceipt.receipt_no == actual_rcp_no
    ).first()
    assert rcp_db is not None
    assert rcp_db.is_deleted is True
    assert rcp_db.status == "Voided"
    assert "Wrong amount entered" in rcp_db.void_reason

    # Verify contra reversal Journal Entry exists
    reversal_jv = db_session.query(models.JournalEntry).filter(
        models.JournalEntry.reference_no == f"REV-{actual_rcp_no}",
        models.JournalEntry.voucher_type == "Reversal"
    ).first()
    assert reversal_jv is not None
    assert reversal_jv.amount_rupees == 2000.0

    # 2. Create and then void a General Payment
    pmt_no = f"PMT-TST-{uuid.uuid4().hex[:6]}"
    pmt_res = client.post("/api/v1/pms/general-payments", json={
        "payment_no": pmt_no,
        "account_name": party.name,
        "amount": 1500.0,
        "payment_mode": "Cheque",
        "paid_by": "Accounts Manager"
    })
    assert pmt_res.status_code == 200
    actual_pmt_no = pmt_res.json()["paymentNo"]

    # Void the payment by payment_no
    del_pmt = client.delete(f"/api/v1/pms/general-payments/{actual_pmt_no}?reason=Cheque+bounced")
    assert del_pmt.status_code == 200
    del_pmt_data = del_pmt.json()
    assert del_pmt_data["success"] is True

    db_session.expire_all()
    pmt_db = db_session.query(models.GeneralPayment).execution_options(include_deleted=True).filter(
        models.GeneralPayment.payment_no == actual_pmt_no
    ).first()
    assert pmt_db is not None
    assert pmt_db.is_deleted is True
    assert pmt_db.status == "Voided"

# -------------------------------------------------------------------------
# Test 4: Shift Handover Cash Drawer Variance Generates GL JV (Flaw 5)
# -------------------------------------------------------------------------
def test_shift_handover_cash_variance_gl_journal_entry(db_session: Session):
    shift_code = f"SHIFT/{datetime.date.today().strftime('%Y%m%d')}/{uuid.uuid4().hex[:4]}"
    # Shortage test: Closing cash ₹800 vs Expected ₹1000 -> Variance -₹200
    res = client.post("/api/v1/pms/shift-handovers", json={
        "shift_id": shift_code,
        "shift_type": "Evening",
        "user_name": "Ramu Cashier",
        "opening_drawer_cash": 1000.0,
        "room_cash_collected": 0.0,
        "food_cash_collected": 0.0,
        "advance_cash_collected": 0.0,
        "expenses_paid_from_drawer": 0.0,
        "net_physical_cash_in_drawer": 800.0,  # ₹200 shortage
        "online_upi_verified": 1200.0,
        "card_swipe_verified": 800.0,
        "handover_notes": "Minor shortage due to change deficit"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True

    # Verify Journal Entry for Cash Shortage
    db_session.expire_all()
    shortage_jv = db_session.query(models.JournalEntry).filter(
        models.JournalEntry.debit_account.contains("Cash Shortage"),
        models.JournalEntry.voucher_type == "Cash_Shortage"
    ).order_by(models.JournalEntry.id.desc()).first()
    assert shortage_jv is not None
    assert shortage_jv.amount_rupees == 200.0
    assert shortage_jv.credit_account == "Cash in Hand (Reception)"

# -------------------------------------------------------------------------
# Test 5: Non-Commercial (NC) KOT PIN Gate & Internal Cost Accounting (Flaw 4)
# -------------------------------------------------------------------------
def test_non_commercial_kot_pin_gate_and_cost_jv(db_session: Session):
    kot_num_fail = f"KOT-NC-{uuid.uuid4().hex[:6]}"
    # 1. Without PIN -> 403 Forbidden
    res_fail = client.post("/api/v1/pms/kots", json={
        "kot_no": kot_num_fail,
        "is_nc": True,
        "nc_reason": "VIP Guest Hospitality",
        "items": [{"itemName": "Special Thali", "qty": 2, "rate": 250.0, "amount": 500.0}],
        "totalAmount": 500.0
    })
    assert res_fail.status_code == 403
    assert "Manager PIN required" in res_fail.text

    # 2. With valid PIN -> 200/201 Success
    kot_num_ok = f"KOT-NC-{uuid.uuid4().hex[:6]}"
    res_ok = client.post("/api/v1/pms/kots", json={
        "kot_no": kot_num_ok,
        "is_nc": True,
        "nc_reason": "Owner Guest Hospitality",
        "approved_by": "General Manager",
        "manager_pin": "1234",
        "items": [{"itemName": "Special Thali", "qty": 2, "rate": 250.0, "amount": 500.0}],
        "totalAmount": 500.0
    })
    assert res_ok.status_code in [200, 201]

    # Verify internal cost Journal Entry was posted
    db_session.expire_all()
    nc_jv = db_session.query(models.JournalEntry).filter(
        models.JournalEntry.reference_no == kot_num_ok,
        models.JournalEntry.voucher_type == "KitchenCost"
    ).first()
    assert nc_jv is not None
    assert nc_jv.amount_rupees == 500.0
    assert nc_jv.debit_account == "Staff Meals & Guest Hospitality Expense"
    assert nc_jv.credit_account == "Kitchen Raw Material & F&B Inventory"

# -------------------------------------------------------------------------
# Test 6: Credit Checkout Auto-Registers in AR Aging Schedules (Flaw 6)
# -------------------------------------------------------------------------
def test_credit_checkout_auto_registers_in_corporate_receivables(db_session: Session):
    room_name = f"303-{uuid.uuid4().hex[:4]}"
    room = models.Room(
        name=room_name,
        slug=f"room-{uuid.uuid4().hex[:8]}",
        description="Deluxe test room",
        image_url="https://example.com/room.jpg",
        room_type="Deluxe AC",
        price_per_night=3000.0,
        housekeeping_status="Occupied",
        is_available=False
    )
    db_session.add(room)
    db_session.commit()

    corp_name = f"Tata Motors Travel Desk {uuid.uuid4().hex[:4]}"
    raw_inv_no = f"INV-CRD-{uuid.uuid4().hex[:6].upper()}"

    # Perform checkout with payment_mode="Credit" (Bill to Company)
    res = client.post("/api/v1/pms/checkouts", json={
        "invoice_no": raw_inv_no,
        "room_no": room_name,
        "guest_name": "Senior Executive",
        "guest_phone": "9811223344",
        "check_in_date": datetime.date.today().isoformat(),
        "check_out_date": datetime.date.today().isoformat(),
        "total_room_rent": 3000.0,
        "net_payable": 3360.0,
        "payment_mode": "Credit",
        "company_name": corp_name
    })
    assert res.status_code == 200
    actual_inv_no = res.json()["invoiceNo"]

    # Verify CorporateInvoiceReceivable is registered
    db_session.expire_all()
    rec = db_session.query(models.CorporateInvoiceReceivable).filter(
        models.CorporateInvoiceReceivable.invoice_no == actual_inv_no
    ).first()
    assert rec is not None
    assert rec.party_name == corp_name
    assert rec.invoice_amount == 3360.0
    assert rec.status == "Unpaid"

    # Query AR aging schedule endpoint
    ar_res = client.get("/api/v1/pms/corporate/receivables")
    assert ar_res.status_code == 200
    ar_data = ar_res.json()
    matching_invoices = [item for item in ar_data if item["invoice_no"] == actual_inv_no]
    assert len(matching_invoices) == 1
    assert matching_invoices[0]["aging_bucket"] in ["Current", "Current (Not Due)", "0-30 Days", "31-60 Days"]

# -------------------------------------------------------------------------
# Test 7: Booking Cancellation Issues Refund & Statutory Credit Note (Flaw 10)
# -------------------------------------------------------------------------
def test_booking_cancellation_refund_and_statutory_credit_note(db_session: Session):
    room_name = f"304-{uuid.uuid4().hex[:4]}"
    room = models.Room(
        name=room_name,
        slug=f"room-{uuid.uuid4().hex[:8]}",
        description="Deluxe test room",
        image_url="https://example.com/room.jpg",
        room_type="Deluxe AC",
        price_per_night=2000.0,
        housekeeping_status="Occupied",
        is_available=False
    )
    db_session.add(room)
    db_session.commit()

    b_ref = f"BK-CN-{uuid.uuid4().hex[:6]}"
    today = datetime.date.today().isoformat()
    booking = models.Booking(
        booking_ref=b_ref,
        invoice_number=f"INV-{uuid.uuid4().hex[:6]}",
        room_id=room.id,
        guest_name="Pilgrim with Advance",
        guest_email="advance@temple.org",
        guest_phone="9911223344",
        check_in_date=today,
        check_out_date=(datetime.date.today() + datetime.timedelta(days=2)).isoformat(),
        base_rate=2000.0,
        base_amount=4000.0,
        total_price=4480.0,
        total_paid=1000.0,
        balance_due=3480.0,
        status="Confirmed"
    )
    db_session.add(booking)
    db_session.commit()

    # Add advance payment record
    adv_pmt = models.BookingPayment(
        booking_id=booking.id,
        payment_type="Advance",
        payment_mode="UPI",
        amount=1000.0,
        notes="Advance booking deposit"
    )
    db_session.add(adv_pmt)
    db_session.commit()

    # Cancel the booking
    cancel_res = client.patch(f"/api/v1/bookings/{b_ref}/status", json={
        "status": "Cancelled",
        "cancellation_reason": "Family emergency - trip cancelled"
    })
    assert cancel_res.status_code == 200

    # Verify:
    # 1. Refund payment is recorded
    db_session.expire_all()
    refund_record = db_session.query(models.BookingPayment).filter(
        models.BookingPayment.booking_id == booking.id,
        models.BookingPayment.payment_type == "Refund"
    ).first()
    assert refund_record is not None
    assert refund_record.amount == 1000.0

    # 2. Statutory CreditNote is issued
    cn = db_session.query(models.CreditNote).filter(
        models.CreditNote.booking_id == booking.id
    ).first()
    assert cn is not None
    assert cn.total_credit_amount == 1000.0
    assert cn.status == "ISSUED"
    assert "01-Sales Return" in cn.reason_code

    # 3. Room is marked Available
    room_db = db_session.query(models.Room).filter(models.Room.id == room.id).first()
    assert room_db.is_available is True

# -------------------------------------------------------------------------
# Test 8: CGST Rule 46(b) Invoice Numbering <= 16 Characters (Flaw 7)
# -------------------------------------------------------------------------
def test_cgst_invoice_number_rule46b_length():
    for _ in range(50):
        inv_no = models.generate_invoice_num()
        assert len(inv_no) <= 16, f"Invoice number '{inv_no}' exceeds Rule 46(b) 16-character limit!"
        assert inv_no.startswith("SVR/")
