import datetime
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import get_db
from app import models
from app.utils.timezone import now_utc

client = TestClient(app)

@pytest.fixture
def db_session():
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

# -------------------------------------------------------------------------
# Test 1: Dirty Room Unavailable After Checkout
# -------------------------------------------------------------------------
def test_dirty_room_unavailable_after_checkout(db_session: Session):
    room_name = f"299-{uuid.uuid4().hex[:4]}"
    room = models.Room(
        name=room_name,
        slug=f"room-{uuid.uuid4().hex[:8]}",
        description="Luxury test suite",
        image_url="https://example.com/room.jpg",
        room_type="Executive Suite",
        price_per_night=3500.0,
        housekeeping_status="Occupied",
        is_available=False
    )
    db_session.add(room)
    db_session.commit()

    inv_no = f"INV-CHK-{uuid.uuid4().hex[:8]}"
    booking = models.Booking(
        booking_ref=f"BK-CHK-{uuid.uuid4().hex[:8]}",
        invoice_number=inv_no,
        room_id=room.id,
        guest_name="Mr. Satya Murthy",
        guest_email="satya@example.com",
        guest_phone="9876543210",
        check_in_date=datetime.date.today().isoformat(),
        check_out_date=datetime.date.today().isoformat(),
        base_rate=3500.0,
        base_amount=3500.0,
        total_price=3920.0,
        total_paid=3920.0,
        balance_due=0.0,
        status="Checked-In"
    )
    db_session.add(booking)
    db_session.commit()

    # Complete Checkout
    res = client.post("/api/v1/pms/checkouts", json={
        "invoice_no": inv_no,
        "room_no": room_name,
        "guest_name": "Mr. Satya Murthy",
        "net_payable": 0.0,
        "payment_mode": "Cash"
    })
    assert res.status_code == 200

    # Verify room is DIRTY and UNAVAILABLE
    db_session.expire_all()
    room_db = db_session.query(models.Room).filter(models.Room.id == room.id).first()
    assert room_db.housekeeping_status == "Dirty"
    assert room_db.is_available is False

# -------------------------------------------------------------------------
# Test 2: Advance Receipt Edit Prevents Double-Counting
# -------------------------------------------------------------------------
def test_advance_receipt_edit_prevents_double_counting(db_session: Session):
    room_name = f"301-{uuid.uuid4().hex[:4]}"
    room = models.Room(
        name=room_name,
        slug=f"room-{uuid.uuid4().hex[:8]}",
        description="Deluxe test room",
        image_url="https://example.com/room.jpg",
        room_type="Deluxe",
        price_per_night=2000.0,
        housekeeping_status="Occupied",
        is_available=False
    )
    db_session.add(room)
    db_session.commit()

    booking = models.Booking(
        booking_ref=f"BK-ADV-{uuid.uuid4().hex[:8]}",
        room_id=room.id,
        guest_name="Dr. Alok Verma",
        guest_email="alok@example.com",
        guest_phone="9876543211",
        check_in_date=datetime.date.today().isoformat(),
        check_out_date=(datetime.date.today() + datetime.timedelta(days=2)).isoformat(),
        base_rate=2000.0,
        base_amount=4000.0,
        total_price=4480.0,
        total_paid=0.0,
        balance_due=4480.0,
        status="Checked-In"
    )
    db_session.add(booking)
    db_session.commit()

    rcp_no = f"AR-{uuid.uuid4().hex[:8]}"

    # 1. Collect advance of ₹2,000
    res1 = client.post("/api/v1/pms/advance-receipts", json={
        "receipt_no": rcp_no,
        "room_no": room_name,
        "guest_name": "Dr. Alok Verma",
        "amount": 2000.0,
        "payment_mode": "Cash",
        "remark": "Initial deposit"
    })
    assert res1.status_code == 200

    db_session.expire_all()
    b_db = db_session.query(models.Booking).filter(models.Booking.id == booking.id).first()
    assert b_db.total_paid == 2000.0
    assert b_db.balance_due == 2480.0

    # 2. Edit advance receipt (change remark / fix typo, keep amount at ₹2,000)
    res2 = client.post("/api/v1/pms/advance-receipts", json={
        "receipt_no": rcp_no,
        "room_no": room_name,
        "guest_name": "Dr. Alok Verma",
        "amount": 2000.0,
        "payment_mode": "Cash",
        "remark": "Corrected remark note"
    })
    assert res2.status_code == 200

    # Total paid MUST remain ₹2,000 (NOT double-counted to ₹4,000!)
    db_session.expire_all()
    b_db = db_session.query(models.Booking).filter(models.Booking.id == booking.id).first()
    assert b_db.total_paid == 2000.0
    assert b_db.balance_due == 2480.0

# -------------------------------------------------------------------------
# Test 3: Room Shift Revokes Old Room RFID Keycard
# -------------------------------------------------------------------------
def test_room_shift_revokes_old_keycard(db_session: Session):
    room1_name = f"101-{uuid.uuid4().hex[:4]}"
    room2_name = f"102-{uuid.uuid4().hex[:4]}"

    r1 = models.Room(name=room1_name, slug=f"room1-{uuid.uuid4().hex[:8]}", description="Standard Room", image_url="https://example.com/r1.jpg", room_type="Standard", price_per_night=2000.0, housekeeping_status="Occupied", is_available=False)
    r2 = models.Room(name=room2_name, slug=f"room2-{uuid.uuid4().hex[:8]}", description="Executive Room", image_url="https://example.com/r2.jpg", room_type="Executive", price_per_night=3000.0, housekeeping_status="Clean", is_available=True)
    db_session.add_all([r1, r2])
    db_session.commit()

    booking = models.Booking(
        booking_ref=f"BK-SHIFT-{uuid.uuid4().hex[:8]}",
        room_id=r1.id,
        guest_name="Shri N. R. Narayana",
        guest_email="narayana@example.com",
        guest_phone="9876543212",
        check_in_date=datetime.date.today().isoformat(),
        check_out_date=(datetime.date.today() + datetime.timedelta(days=2)).isoformat(),
        base_rate=2000.0,
        base_amount=4000.0,
        total_price=4480.0,
        total_paid=2000.0,
        balance_due=2480.0,
        status="Checked-In"
    )
    db_session.add(booking)
    db_session.commit()

    # Issue active keycard for Room 1
    card_uid = f"KEY-{uuid.uuid4().hex[:8]}"
    now = now_utc()
    key = models.KeyCardAccess(
        card_uid=card_uid,
        room_no=room1_name,
        guest_name="Shri N. R. Narayana",
        scheduled_checkout_time=now + datetime.timedelta(days=1),
        card_deactivation_time=now + datetime.timedelta(days=1),
        status="ACTIVE"
    )
    db_session.add(key)
    db_session.commit()

    # Execute Room Shift from Room 1 to Room 2
    res = client.post("/api/v1/pms/room-shift", json={
        "booking_ref": booking.booking_ref,
        "to_room_id": r2.id,
        "reason": "Air conditioner maintenance issue"
    })
    assert res.status_code == 200

    # Verify old keycard is REVOKED
    db_session.expire_all()
    key_db = db_session.query(models.KeyCardAccess).filter(models.KeyCardAccess.card_uid == card_uid).first()
    assert key_db.status == "REVOKED"

    # Verify Room 1 is Dirty and Room 2 is Occupied
    room1_db = db_session.query(models.Room).filter(models.Room.id == r1.id).first()
    room2_db = db_session.query(models.Room).filter(models.Room.id == r2.id).first()
    assert room1_db.housekeeping_status == "Dirty"
    assert room1_db.is_available is False
    assert room2_db.housekeeping_status == "Occupied"

# -------------------------------------------------------------------------
# Test 4: KOT Void Reconciles Room Folio
# -------------------------------------------------------------------------
def test_kot_void_reconciles_room_folio(db_session: Session):
    room_name = f"204-{uuid.uuid4().hex[:4]}"
    room = models.Room(name=room_name, slug=f"room4-{uuid.uuid4().hex[:8]}", description="Deluxe Room", image_url="https://example.com/r4.jpg", room_type="Deluxe", price_per_night=2500.0, housekeeping_status="Occupied", is_available=False)
    db_session.add(room)
    db_session.commit()

    booking = models.Booking(
        booking_ref=f"BK-KOT-{uuid.uuid4().hex[:8]}",
        room_id=room.id,
        guest_name="Capt. Rajesh Nair",
        guest_email="rajesh@example.com",
        guest_phone="9876543213",
        check_in_date=datetime.date.today().isoformat(),
        check_out_date=(datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
        base_rate=2500.0,
        base_amount=2500.0,
        total_price=3500.0,
        balance_due=1000.0,
        status="Checked-In"
    )
    db_session.add(booking)
    db_session.commit()

    # Billed KOT item on Room Folio
    folio_item = models.RoomFolioItem(
        booking_id=booking.id,
        item_type="Food_Beverage",
        description="Paneer Tikka Butter Masala (KOT-9912)",
        quantity=2,
        unit_price=350.0,
        taxable_amount=700.0,
        total_amount=700.0,
        status="Billed"
    )
    db_session.add(folio_item)
    db_session.commit()

    # Void the KOT item
    res = client.post("/api/v1/pms/kot/void", json={
        "kot_no": "KOT-9912",
        "room_number": room_name,
        "item_name": "Paneer Tikka Butter Masala",
        "qty_voided": 2,
        "manager_pin": "1234",
        "void_reason": "Customer cancelled order before preparation"
    })
    assert res.status_code == 200

    # Verify folio item is marked VOIDED and balance due reduced
    db_session.expire_all()
    folio_db = db_session.query(models.RoomFolioItem).filter(models.RoomFolioItem.id == folio_item.id).first()
    booking_db = db_session.query(models.Booking).filter(models.Booking.id == booking.id).first()
    assert folio_db.status == "Voided"
    assert "[VOIDED]" in folio_db.description
    assert booking_db.balance_due == 300.0  # 1000.0 - 700.0

# -------------------------------------------------------------------------
# Test 5: Statutory CGST Section 17(5)(h) ITC Reversal on Kitchen Spoilage
# -------------------------------------------------------------------------
def test_statutory_itc_reversal_on_kitchen_spoilage(db_session: Session):
    today = datetime.date.today()

    # Intake an inventory lot
    intake = client.post("/api/v1/pms/inventory/lots", json={
        "item_name": "Paneer Cottage Cheese",
        "category": "Dairy",
        "store_name": "Kitchen Cold Storage",
        "unit_of_measure": "kg",
        "quantity": 10.0,
        "unit_cost": 400.0,
        "supplier_name": "Amul Rayagada Distributor",
        "expiry_date": (today + datetime.timedelta(days=2)).isoformat()
    }).json()

    lot_id = intake["id"]

    # Condemn 4 kg of spoiled paneer (Loss: 4 * ₹400 = ₹1,600)
    res = client.post("/api/v1/pms/inventory/spoilage", json={
        "lot_id": lot_id,
        "quantity_wasted": 4.0,
        "waste_reason": "Curdled & sour smelling",
        "reported_by": "Chef Sanjeev",
        "manager_pin": "1234"
    })
    assert res.status_code == 201
    data = res.json()

    assert data["total_loss_rupees"] == 1600.0
    # Statutory Section 17(5)(h) ITC Reversal (5% of ₹1,600 = ₹80)
    assert data["itc_reversal_rupees"] == 80.0
    assert data["itc_reversal_paise"] == 8000

    # Verify double-entry GL voucher for ITC Reversal
    itc_jv = db_session.query(models.JournalEntry).filter(
        models.JournalEntry.reference_no == data["voucher_no"],
        models.JournalEntry.debit_account.contains("ITC Reversal")
    ).first()
    assert itc_jv is not None
    assert itc_jv.amount_rupees == 80.0
    assert itc_jv.credit_account == "Input GST Reversal Payable (CGST/SGST)"
