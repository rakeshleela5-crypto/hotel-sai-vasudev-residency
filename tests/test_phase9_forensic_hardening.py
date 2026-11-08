import datetime
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import get_db
from app import models

client = TestClient(app)

@pytest.fixture
def db_session():
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

def create_test_room(db_session: Session, name_prefix: str = "400", is_available: bool = True, hk_status: str = "Available"):
    room = models.Room(
        name=f"{name_prefix}-{uuid.uuid4().hex[:4]}",
        slug=f"room-{uuid.uuid4().hex[:8]}",
        room_type="Deluxe AC",
        price_per_night=2000.0,
        description="Spacious luxury suite",
        image_url="https://example.com/suite.jpg",
        housekeeping_status=hk_status,
        is_available=is_available
    )
    db_session.add(room)
    db_session.commit()
    return room


def test_checkout_booking_with_room_number_and_splits(db_session: Session):
    """
    Flaw 1 Hardening: Verify check-out resolves booking by room_no even if booking_ref is omitted or invoiceNo passed,
    preventing silent 404 state freeze.
    """
    room = create_test_room(db_session, "401", is_available=True, hk_status="Available")
    today = datetime.date.today().isoformat()
    tomorrow = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()

    res = client.post("/api/v1/pms/check-in", json={
        "room_id": room.id,
        "guest_name": "Ramesh Sharma",
        "guest_phone": "9876543210",
        "guest_email": "ramesh@hotelsai-vasudev.com",
        "check_in_date": today,
        "check_out_date": tomorrow,
        "advance_amount": 500.0,
        "advance_payment_mode": "Cash"
    })
    assert res.status_code == 200, res.text
    b_data = res.json()
    b_ref = b_data["booking_ref"]
    balance = b_data["balance_due"]

    # Execute checkout passing room_no directly (simulating frontend pmsStore.ts payload)
    chk_res = client.post("/api/v1/pms/check-out", json={
        "room_no": room.name,
        "settlement_payment_mode": "Cash",
        "settlement_amount_paid": float(balance),
        "processed_by": "Front Desk Senior"
    })
    assert chk_res.status_code == 200, chk_res.text
    data = chk_res.json()
    assert data["status"] == "Checked-Out"

    db_session.expire_all()
    b_db = db_session.query(models.Booking).filter(models.Booking.booking_ref == b_ref).first()
    room_db = db_session.query(models.Room).filter(models.Room.id == room.id).first()
    assert b_db.status == "Checked-Out"
    assert room_db.housekeeping_status == "Dirty"


def test_delete_checkout_soft_voids_and_posts_reversal_jv(db_session: Session):
    """
    Flaw 2 Hardening: Verify delete_checkout soft-voids the tax invoice (CGST Sec 36 / Companies Act Sec 128)
    and posts an audited reversing journal entry without destroying the sequential record.
    """
    inv_no = f"SVR/2627/{uuid.uuid4().hex[:6].upper()}"
    chk = models.CheckoutRecord(
        invoice_no=inv_no,
        room_no="102",
        guest_name="Anita Mehra",
        check_in_date="2026-11-01",
        check_out_date="2026-11-03",
        bill_amount=4500.0,
        net_payable=4500.0,
        payment_mode="Direct_BTC",
        company_name="Odisha Mining Corp"
    )
    db_session.add(chk)
    db_session.commit()

    # Soft void via DELETE endpoint
    del_res = client.delete(f"/api/v1/pms/checkouts/{inv_no}?reason=Wrong+party+billed")
    assert del_res.status_code == 200, del_res.text

    # Standard query excludes soft-deleted
    db_session.expire_all()
    standard_chk = db_session.query(models.CheckoutRecord).filter(models.CheckoutRecord.invoice_no == inv_no).first()
    assert standard_chk is None

    # Audit query with include_deleted=True retrieves the soft-voided record
    audit_chk = db_session.query(models.CheckoutRecord).execution_options(include_deleted=True).filter(
        models.CheckoutRecord.invoice_no == inv_no
    ).first()
    assert audit_chk is not None
    assert audit_chk.is_deleted is True
    assert audit_chk.is_cancelled is True
    assert "Wrong party billed" in (audit_chk.void_reason or "")

    # Reversing JV verified
    jv = db_session.query(models.JournalEntry).filter(
        models.JournalEntry.reference_no == inv_no,
        models.JournalEntry.voucher_type == "Reversal"
    ).first()
    assert jv is not None
    assert jv.amount_rupees == 4500.0


def test_delete_advance_receipt_soft_voids_and_rolls_back_booking_balance(db_session: Session):
    """
    Flaw 3 Hardening: Verify delete_advance_receipt soft-voids receipt, rolls back booking advance and balance due,
    and posts reversing JV without financial drift.
    """
    room = create_test_room(db_session, "403", is_available=False, hk_status="Occupied")
    b_ref = f"BK-ADV-{uuid.uuid4().hex[:6]}"
    booking = models.Booking(
        booking_ref=b_ref,
        invoice_number=f"INV-{uuid.uuid4().hex[:6]}",
        room_id=room.id,
        guest_name="Kishore Kumar",
        guest_email="kishore@hotelsai-vasudev.com",
        guest_phone="9988776655",
        check_in_date="2026-11-05",
        check_out_date="2026-11-07",
        total_price=5000.0,
        total_paid=2000.0,
        balance_due=3000.0,
        payment_status="Partial",
        status="Checked-In"
    )
    db_session.add(booking)
    db_session.commit()

    rcp_no = f"AR-{uuid.uuid4().hex[:6]}"
    adv = models.AdvanceReceipt(
        receipt_no=rcp_no,
        room_no=room.name,
        guest_name="Kishore Kumar",
        amount=2000.0,
        payment_mode="Cash",
        date="2026-11-05"
    )
    db_session.add(adv)
    db_session.commit()

    # Soft-void advance receipt via DELETE
    del_res = client.delete(f"/api/v1/pms/advance-receipts/{rcp_no}?reason=Guest+token+returned")
    assert del_res.status_code == 200, del_res.text

    # Booking advance rolled back and balance restored to full 5000
    db_session.expire_all()
    b_updated = db_session.query(models.Booking).filter(models.Booking.booking_ref == b_ref).first()
    assert b_updated.total_paid == 0.0
    assert b_updated.balance_due == 5000.0
    assert b_updated.payment_status == "Pending"

    # Reversal JV posted
    jv = db_session.query(models.JournalEntry).filter(
        models.JournalEntry.reference_no == rcp_no,
        models.JournalEntry.voucher_type == "Reversal"
    ).first()
    assert jv is not None
    assert jv.amount_rupees == 2000.0


def test_save_checkout_preserves_14char_rule46b_invoice(db_session: Session):
    """
    Flaw 4 Hardening: Verify save_checkout preserves 14-char Rule 46(b) invoice SVR/2627/001234 without burning sequence.
    """
    rule46b_inv = f"SVR/2627/{uuid.uuid4().hex[:6].upper()}"
    res = client.post("/api/v1/pms/checkouts", json={
        "invoice_no": rule46b_inv,
        "room_no": "103",
        "guest_name": "Sunil Gavaskar",
        "check_in_date": "2026-11-01",
        "check_out_date": "2026-11-02",
        "total_room_rent": 2000.0,
        "bill_amount": 2240.0,
        "net_payable": 2240.0,
        "payment_mode": "UPI"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["invoice_no"] == rule46b_inv


def test_execute_checkout_aggregates_food_and_extras_into_checkout_record(db_session: Session):
    """
    Flaw 5 Hardening: Verify execute_check_out aggregates food KOTs (SAC 996331) and laundry into food_amount and add_others.
    """
    room = create_test_room(db_session, "405", is_available=False, hk_status="Occupied")
    b_ref = f"BK-FD-{uuid.uuid4().hex[:6]}"
    inv_no = f"SVR/2627/{uuid.uuid4().hex[:6].upper()}"
    b = models.Booking(
        booking_ref=b_ref,
        invoice_number=inv_no,
        room_id=room.id,
        guest_name="Deepak Verma",
        guest_email="verma@hotelsai-vasudev.com",
        guest_phone="9876543299",
        check_in_date="2026-11-05",
        check_out_date="2026-11-06",
        base_rate=2000.0,
        base_amount=2000.0,
        gst_rate=12.0,
        cgst_amount=120.0,
        sgst_amount=120.0,
        total_tax=240.0,
        total_price=2240.0,
        total_paid=0.0,
        balance_due=2240.0,
        status="Checked-In"
    )
    db_session.add(b)
    db_session.commit()

    # Add RoomFolioItem for Food (SAC 996331)
    food_item = models.RoomFolioItem(
        booking_id=b.id,
        item_type="Food_KOT",
        description="Veg Biryani + Paneer Tikka",
        sac_code="996331",
        unit_price=500.0,
        taxable_amount=500.0,
        gst_rate=5.0,
        cgst_amount=12.50,
        sgst_amount=12.50,
        total_amount=525.0,
        status="Billed"
    )
    db_session.add(food_item)

    # Add RoomFolioItem for Laundry (Other)
    laundry_item = models.RoomFolioItem(
        booking_id=b.id,
        item_type="Laundry",
        description="Express Laundry Press",
        sac_code="999799",
        unit_price=200.0,
        taxable_amount=200.0,
        total_amount=200.0,
        status="Billed"
    )
    db_session.add(laundry_item)
    b.balance_due = round(2240.0 + 525.0 + 200.0, 2)
    db_session.commit()

    # Execute checkout via client
    chk_res = client.post("/api/v1/pms/check-out", json={
        "booking_ref": b.booking_ref,
        "settlement_payment_mode": "Cash",
        "settlement_amount_paid": float(b.balance_due),
        "processed_by": "Senior Cashier"
    })
    assert chk_res.status_code == 200, chk_res.text

    # Verify CheckoutRecord has rolled up food and laundry
    db_session.expire_all()
    chk_rec = db_session.query(models.CheckoutRecord).filter(models.CheckoutRecord.invoice_no == inv_no).first()
    assert chk_rec is not None
    assert chk_rec.food_amount == 525.0
    assert chk_rec.add_others == 200.0
    assert chk_rec.bill_amount == round(2240.0 + 525.0 + 200.0, 2)


def test_execute_checkout_direct_btc_registers_corporate_ar(db_session: Session):
    """
    Flaw 6 Hardening: Verify execute_check_out with Direct_BTC populates CorporateInvoiceReceivable and PartyAccount.
    """
    room = create_test_room(db_session, "406", is_available=False, hk_status="Occupied")
    b_ref = f"BK-CORP-{uuid.uuid4().hex[:6]}"
    inv_no = f"SVR/2627/{uuid.uuid4().hex[:6].upper()}"
    b = models.Booking(
        booking_ref=b_ref,
        invoice_number=inv_no,
        room_id=room.id,
        guest_name="Capt. Rajesh Roy",
        guest_email="roy@hotelsai-vasudev.com",
        guest_phone="9123456780",
        check_in_date="2026-11-05",
        check_out_date="2026-11-06",
        base_rate=3000.0,
        base_amount=3000.0,
        total_tax=360.0,
        total_price=3360.0,
        total_paid=0.0,
        balance_due=3360.0,
        status="Checked-In"
    )
    db_session.add(b)
    db_session.commit()

    chk_res = client.post("/api/v1/pms/check-out", json={
        "booking_ref": b.booking_ref,
        "settlement_payment_mode": "Direct_BTC",
        "company_name": "Paradip Port Authority",
        "customer_gstin": "21AAACP1234F1Z8",
        "processed_by": "Front Desk Manager"
    })
    assert chk_res.status_code == 200, chk_res.text

    # Corporate receivable registered
    db_session.expire_all()
    corp = db_session.query(models.CorporateInvoiceReceivable).filter(
        models.CorporateInvoiceReceivable.invoice_no == inv_no
    ).first()
    assert corp is not None
    assert corp.party_name == "Paradip Port Authority"
    assert corp.invoice_amount == 3360.0
    assert corp.outstanding_amount == 3360.0
    assert corp.status == "Unpaid"


def test_delete_kot_ticket_enforces_manager_pin(db_session: Session):
    """
    Flaw 7 Hardening: Verify delete_kot_ticket rejects requests without a valid Manager PIN (403),
    and succeeds when authorized.
    """
    kot_no = f"KOT-{uuid.uuid4().hex[:6].upper()}"
    kot = models.KotTicket(
        kot_no=kot_no,
        date="2026-11-08",
        time="12:00:00",
        items_json="[]",
        table_no="Table 5",
        waiter_name="Ashok",
        total_amount=400.0,
        status="Active"
    )
    db_session.add(kot)
    db_session.commit()

    # Unauthorized attempt fails with 403
    unauth = client.delete(f"/api/v1/pms/kots/{kot_no}?manager_pin=0000")
    assert unauth.status_code == 403, unauth.text

    # Authorized attempt with PIN succeeds
    auth_res = client.delete(f"/api/v1/pms/kots/{kot_no}?manager_pin=1234&reason=Customer+changed+mind")
    assert auth_res.status_code == 200, auth_res.text

    # Audit log contains record
    db_session.expire_all()
    void_audit = db_session.query(models.KotVoidAuditLog).filter(models.KotVoidAuditLog.kot_no == kot_no).first()
    assert void_audit is not None


def test_folio_discount_enforces_pin_and_recalculates_net_gst(db_session: Session):
    """
    Flaw 8 Hardening: Verify apply_folio_discount validates Manager PIN and recalculates Section 15(3) net tax.
    """
    room = create_test_room(db_session, "408", is_available=False, hk_status="Occupied")
    b_ref = f"BK-DISC-{uuid.uuid4().hex[:6]}"
    b = models.Booking(
        booking_ref=b_ref,
        invoice_number=f"INV-{uuid.uuid4().hex[:6]}",
        room_id=room.id,
        guest_name="Manoj Bajpayee",
        guest_email="bajpayee@hotelsai-vasudev.com",
        guest_phone="9876543211",
        check_in_date="2026-11-05",
        check_out_date="2026-11-06",
        base_rate=2000.0,
        base_amount=2000.0,
        gst_rate=12.0,
        cgst_amount=120.0,
        sgst_amount=120.0,
        total_tax=240.0,
        total_price=2240.0,
        total_paid=0.0,
        balance_due=2240.0,
        status="Checked-In"
    )
    db_session.add(b)
    db_session.commit()

    # Large discount without PIN fails with 403
    unauth = client.post("/api/v1/pms/folio/discount", json={
        "booking_ref": b_ref,
        "discount_type": "flat",
        "discount_amount": 1500.0,
        "manager_pin": "0000"
    })
    assert unauth.status_code == 403, unauth.text

    # Authorized discount with PIN succeeds
    auth_res = client.post("/api/v1/pms/folio/discount", json={
        "booking_ref": b_ref,
        "discount_type": "flat",
        "discount_amount": 240.0,
        "manager_pin": "1234",
        "reason": "VIP Pilgrim courtesy discount"
    })
    assert auth_res.status_code == 200, auth_res.text

    db_session.expire_all()
    b_updated = db_session.query(models.Booking).filter(models.Booking.booking_ref == b_ref).first()
    # Total price dropped from 2240 to 2000
    assert b_updated.total_price == 2000.0
    # Net taxable base and tax re-apportioned under Section 15(3)
    assert b_updated.base_amount == round(2000.0 / 1.12, 2)
    assert b_updated.total_tax == round(2000.0 - b_updated.base_amount, 2)


def test_walkin_checkin_foreign_national_form_c(db_session: Session):
    """
    Flaw 9 Hardening: Verify non-Indian walk-in populates statutory Form C immigration fields in PoliceStationLog.
    """
    room = create_test_room(db_session, "409", is_available=True, hk_status="Available")
    res = client.post("/api/v1/pms/check-in", json={
        "room_id": room.id,
        "guest_name": "Arthur Dent",
        "guest_email": "dent@galaxy.co.uk",
        "guest_phone": "447123456789",
        "check_out_date": (datetime.date.today() + datetime.timedelta(days=2)).isoformat(),
        "is_foreign_national": True,
        "nationality": "United Kingdom",
        "passport_number": "UK889922B",
        "visa_number": "IND-EV-884920",
        "port_of_arrival": "BBI Airport Bhubaneswar",
        "coming_from": "London Heathrow"
    })
    assert res.status_code == 200, res.text
    b_data = res.json()
    b_ref = b_data["booking_ref"]

    db_session.expire_all()
    b = db_session.query(models.Booking).filter(models.Booking.booking_ref == b_ref).first()
    police_rec = db_session.query(models.PoliceStationLog).filter(models.PoliceStationLog.booking_id == b.id).first()
    assert police_rec is not None
    assert police_rec.is_foreign_national is True
    assert police_rec.passport_number == "UK889922B"
    assert police_rec.nationality == "United Kingdom"


def test_night_audit_multi_night_prevents_double_billing(db_session: Session):
    """
    Flaw 10 Hardening: Verify Night Audit on multi-night reservations does not double-charge room tariff.
    """
    room = create_test_room(db_session, "410", is_available=False, hk_status="Occupied")
    b_ref = f"BK-NIGHT-{uuid.uuid4().hex[:6]}"
    today = datetime.date.today().isoformat()
    three_days = (datetime.date.today() + datetime.timedelta(days=3)).isoformat()

    b = models.Booking(
        booking_ref=b_ref,
        invoice_number=f"INV-{uuid.uuid4().hex[:6]}",
        room_id=room.id,
        guest_name="Sanjay Singhania",
        guest_email="singhania@hotelsai-vasudev.com",
        guest_phone="9876500000",
        check_in_date=today,
        check_out_date=three_days,
        total_nights=3,
        base_rate=1000.0,
        base_amount=3000.0,
        gst_rate=12.0,
        total_tax=360.0,
        total_price=3360.0,
        total_paid=1000.0,
        balance_due=2360.0,
        status="Checked-In"
    )
    db_session.add(b)
    db_session.commit()

    # Run night audit for tonight
    audit_res = client.post("/api/v1/pms/night-audit", json={"audit_date": today})
    assert audit_res.status_code == 200, audit_res.text

    db_session.expire_all()
    b_updated = db_session.query(models.Booking).filter(models.Booking.booking_ref == b_ref).first()
    # Balance due should NOT be inflated beyond the original 2360
    assert b_updated.balance_due == 2360.0
    assert b_updated.total_price == 3360.0
