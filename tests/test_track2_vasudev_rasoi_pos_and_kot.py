import datetime
import uuid
import json
import pytest
from sqlalchemy.orm import Session

from app import models, schemas
from app.routes.pms import (
    create_kot_ticket,
    delete_kot_ticket,
    save_food_bill,
    delete_food_bill
)

def create_test_room_and_booking(db: Session, prefix: str = "VR"):
    uid = uuid.uuid4().hex[:6].upper()
    r = models.Room(
        name=f"Room {prefix}-{uid}",
        slug=f"room-{prefix.lower()}-{uid.lower()}",
        room_type="Deluxe",
        price_per_night=2000.0,
        description="POS test room",
        image_url="https://example.com/r.jpg",
        housekeeping_status="Clean",
        is_available=True
    )
    db.add(r)
    db.commit()
    db.refresh(r)

    today_d = datetime.date.today()
    b = models.Booking(
        booking_ref=f"BK-{prefix}-{uid}",
        invoice_number=f"INV-{prefix}-{uid}",
        room_id=r.id,
        guest_name="Vasudev Diner",
        guest_email="diner@example.com",
        guest_phone="9876543299",
        check_in_date=today_d.isoformat(),
        check_out_date=(today_d + datetime.timedelta(days=2)).isoformat(),
        total_nights=2,
        base_rate=2000.0,
        base_amount=3571.43,
        gst_rate=12.0,
        total_tax=428.57,
        total_price=4000.0,
        total_paid=0.0,
        balance_due=4000.0,
        status="Checked-In"
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return r, b

def test_room_service_kot_then_food_bill_prevents_double_billing(db: Session):
    """
    Track 2 Fix Verification:
    When a Room Service KOT is punched, it posts to room folio.
    When a Food Bill for that same KOT is subsequently saved with 'Settle To Room',
    it MUST NOT charge the guest a second time.
    """
    r, b = create_test_room_and_booking(db, "KOT_DBL")
    kot_no = f"KOT-RS-{uuid.uuid4().hex[:6].upper()}"

    # 1. Punch Room Service KOT for Room
    kot_payload = {
        "kotNo": kot_no,
        "roomNo": str(r.id),
        "waiterName": "Ranjan",
        "guestName": b.guest_name,
        "items": [
            {"itemName": "Pure Veg Thali", "qty": 2, "rate": 250.0, "amount": 500.0},
            {"itemName": "Mineral Water", "qty": 2, "rate": 25.0, "amount": 50.0}
        ],
        "totalAmount": 550.0,
        "status": "Running"
    }
    create_kot_ticket(kot_payload, db=db)
    db.refresh(b)

    # Initial balance due was 4000 + 550 = 4550
    assert b.balance_due == 4550.0
    folio_items_count = db.query(models.RoomFolioItem).filter(
        models.RoomFolioItem.booking_id == b.id,
        models.RoomFolioItem.is_deleted == False
    ).count()
    assert folio_items_count == 1

    # 2. Settle Food Bill for the same KOT with "Settle To Room"
    fb_no = f"FB-TEST-{uuid.uuid4().hex[:6].upper()}"
    food_bill_req = schemas.FoodBillCreate(
        bill_no=fb_no,
        room_no=str(r.id),
        guest_name=b.guest_name,
        kot_numbers=[kot_no],
        items=[
            {"itemName": "Pure Veg Thali", "qty": 2, "rate": 250.0, "amount": 500.0},
            {"itemName": "Mineral Water", "qty": 2, "rate": 25.0, "amount": 50.0}
        ],
        food_gross_amount=550.0,
        taxable_amount=523.81,
        gst_percent=5.0,
        gst_amount=26.19,
        net_bill_amount=550.0,
        settlement_type="Settle To Room"
    )
    save_food_bill(food_bill_req, db=db)
    db.refresh(b)

    # Balance due MUST STILL BE 4550 (NOT 5100!)
    assert b.balance_due == 4550.0


def test_table_bill_newly_transferred_to_room_charges_folio_and_vacates_table(db: Session):
    """
    Track 2 Fix Verification:
    A dining table bill settled with 'Settle To Room' must charge the room folio
    and vacate the dining table.
    """
    r, b = create_test_room_and_booking(db, "TBL_TRF")
    tbl_code = f"T-{uuid.uuid4().hex[:4].upper()}"
    tbl = models.DiningTable(
        table_code=tbl_code,
        table_name=f"Table {tbl_code}",
        capacity=4,
        status="Running"
    )
    db.add(tbl)
    db.commit()

    fb_no = f"FB-TBL-{uuid.uuid4().hex[:6].upper()}"
    food_bill_req = schemas.FoodBillCreate(
        bill_no=fb_no,
        table_no=tbl.table_name,
        room_no=str(r.id),
        guest_name=b.guest_name,
        kot_numbers=[],
        items=[{"itemName": "Paneer Butter Masala", "qty": 1, "rate": 280.0, "amount": 280.0}],
        food_gross_amount=280.0,
        taxable_amount=266.67,
        gst_percent=5.0,
        gst_amount=13.33,
        net_bill_amount=280.0,
        settlement_type="Settle To Room"
    )
    save_food_bill(food_bill_req, db=db)
    db.refresh(b)
    db.refresh(tbl)

    # Room balance due increased by 280 (4000 + 280 = 4280)
    assert b.balance_due == 4280.0
    # Dining table is now Vacant
    assert tbl.status == "Vacant"


def test_delete_kot_creates_void_audit_log_and_vacates_table(db: Session):
    """
    Track 2 Fix Verification:
    Voiding a KOT must:
    1. Write immutable records to KotVoidAuditLog.
    2. Vacate the table if no other active KOTs remain.
    """
    tbl_code = f"T-{uuid.uuid4().hex[:4].upper()}"
    tbl = models.DiningTable(
        table_code=tbl_code,
        table_name=f"Table {tbl_code}",
        capacity=4,
        status="Running"
    )
    db.add(tbl)
    db.commit()

    kot_no = f"KOT-VOID-{uuid.uuid4().hex[:6].upper()}"
    kot_payload = {
        "kotNo": kot_no,
        "tableNo": tbl.table_name,
        "waiterName": "Dilip",
        "guestName": "Walkin Guest",
        "items": [
            {"itemName": "Rayagada Special Poha", "qty": 2, "rate": 80.0, "amount": 160.0}
        ],
        "totalAmount": 160.0,
        "status": "Running"
    }
    create_kot_ticket(kot_payload, db=db)
    db.refresh(tbl)
    assert tbl.status == "Running"

    # Void the KOT
    delete_kot_ticket(kot_no=kot_no, reason="Guest left before food prepared", db=db)
    db.refresh(tbl)

    # 1. Audit log recorded in kot_void_audit_logs
    audit_entry = db.query(models.KotVoidAuditLog).filter(
        models.KotVoidAuditLog.kot_no == kot_no
    ).first()
    assert audit_entry is not None
    assert audit_entry.item_name == "Rayagada Special Poha"
    assert audit_entry.void_reason == "Guest left before food prepared"

    # 2. Table status reverted to Vacant
    assert tbl.status == "Vacant"


def test_void_room_service_kot_reverses_folio_charge(db: Session):
    """
    Track 2 Fix Verification:
    Voiding a room service KOT must reverse the room folio charge and mark item Void.
    """
    r, b = create_test_room_and_booking(db, "KOT_REV")
    kot_no = f"KOT-REV-{uuid.uuid4().hex[:6].upper()}"

    kot_payload = {
        "kotNo": kot_no,
        "roomNo": str(r.id),
        "waiterName": "Ranjan",
        "guestName": b.guest_name,
        "items": [
            {"itemName": "Special Masala Dosa", "qty": 1, "rate": 130.0, "amount": 130.0}
        ],
        "totalAmount": 130.0,
        "status": "Running"
    }
    create_kot_ticket(kot_payload, db=db)
    db.refresh(b)
    assert b.balance_due == 4130.0

    # Void the Room Service KOT
    delete_kot_ticket(kot_no=kot_no, reason="Item not available in kitchen", db=db)
    db.refresh(b)

    # Folio charge reversed: balance due back to 4000.0
    assert b.balance_due == 4000.0
    folio_item = db.query(models.RoomFolioItem).execution_options(include_deleted=True).filter(
        models.RoomFolioItem.kot_number == kot_no
    ).first()
    assert folio_item is not None
    assert folio_item.status == "Void"
    assert folio_item.is_deleted is True
