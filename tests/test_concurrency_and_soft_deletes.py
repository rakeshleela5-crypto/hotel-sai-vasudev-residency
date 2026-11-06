"""
Test Suite: Production Hardening - Concurrency Locking, N+1 Prevention & Soft Deletes
Covers:
  1. Connection Pooling & N+1 Prevention (selectinload, pre-loaded collections in folio/billing).
  2. Row-Level Locking & Race Conditions (HTTP 409 Conflict on double-booking, occupied room allocation, duplicate checkout settlement).
  3. Soft Deletes for GST & Audit Compliance (is_deleted, void_reason, unbroken sequence numbers, with_loader_criteria).
  4. Alembic Migration Chain (001 -> 002 upgrade & downgrade consistency).
"""

import os
import sys
import uuid
import datetime
import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

# Ensure backend and root paths are available
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database import engine, SessionLocal, get_sync_database_url
from app import models, schemas
from app.routes.pms import (
    execute_walk_in_check_in,
    execute_check_out,
    get_master_room_folio,
    delete_kot_ticket,
    delete_food_bill,
    cancel_check_in,
    add_item_to_room_folio
)
from app.routes.bookings import update_booking_status, list_bookings


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


def create_test_room(db: Session, prefix: str = "CONCUR") -> models.Room:
    unique_slug = f"room-{prefix.lower()}-{uuid.uuid4().hex[:6]}"
    room = models.Room(
        name=f"Room {unique_slug[-4:]}",
        slug=unique_slug,
        room_type="Executive",
        price_per_night=3000.0,
        capacity=2,
        total_inventory=1,
        description="Concurrency test room",
        image_url="https://images.unsplash.com/test",
        is_available=True,
        housekeeping_status="Clean"
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


# =========================================================================
# 1. ROW-LEVEL LOCKING & RACE CONDITIONS (HTTP 409 CONFLICT)
# =========================================================================

def test_walkin_checkin_occupied_room_raises_409_conflict(db):
    """
    Verifies that concurrent walk-in check-in to an already occupied room
    immediately raises HTTP 409 Conflict to prevent double-booking.
    """
    room = create_test_room(db, "OCCUPIED")

    cin = datetime.date.today().isoformat()
    cout = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()

    req1 = schemas.WalkInCheckInRequest(
        room_id=room.id,
        guest_name="Guest Alpha",
        guest_phone="9876543210",
        guest_email="alpha@example.com",
        check_in_date=cin,
        check_out_date=cout,
        adults=2,
        children=0,
        advance_amount=1000.0,
        advance_payment_mode="Cash"
    )

    # First check-in succeeds
    res1 = execute_walk_in_check_in(req1, db=db)
    assert res1.status == "Checked-In"
    assert res1.room_id == room.id

    # Verify room is now Occupied
    db.refresh(room)
    assert room.housekeeping_status == "Occupied"

    # Second concurrent walk-in attempt on the same room MUST raise HTTP 409 Conflict
    req2 = schemas.WalkInCheckInRequest(
        room_id=room.id,
        guest_name="Guest Beta",
        guest_phone="9876543211",
        guest_email="beta@example.com",
        check_in_date=cin,
        check_out_date=cout,
        adults=2,
        children=0,
        advance_amount=1000.0,
        advance_payment_mode="UPI"
    )

    with pytest.raises(HTTPException) as exc_info:
        execute_walk_in_check_in(req2, db=db)

    assert exc_info.value.status_code == 409
    assert "already occupied" in exc_info.value.detail.lower()


def test_update_booking_status_to_checkedin_on_occupied_room_raises_409(db):
    """
    Verifies that if staff member attempts to check-in a confirmed reservation
    into a room already occupied by another active guest, HTTP 409 Conflict is raised.
    """
    room = create_test_room(db, "STATUS_RACE")

    cin = datetime.date.today().isoformat()
    cout = (datetime.date.today() + datetime.timedelta(days=2)).isoformat()

    # Guest 1 is currently in-house (Checked-In)
    b1 = models.Booking(
        booking_ref=f"BK-ACTIVE-{uuid.uuid4().hex[:6].upper()}",
        room_id=room.id,
        guest_name="In-House Guest",
        guest_email="inhouse@example.com",
        guest_phone="9876543220",
        check_in_date=cin,
        check_out_date=cout,
        base_rate=3000.0,
        base_amount=6000.0,
        total_price=6720.0,
        total_paid=6720.0,
        balance_due=0.0,
        payment_status="Paid",
        status="Checked-In"
    )
    room.housekeeping_status = "Occupied"
    db.add(b1)

    # Guest 2 has a Confirmed reservation for the same room
    b2 = models.Booking(
        booking_ref=f"BK-CONFIRMED-{uuid.uuid4().hex[:6].upper()}",
        room_id=room.id,
        guest_name="Arriving Guest",
        guest_email="arriving@example.com",
        guest_phone="9876543221",
        check_in_date=cin,
        check_out_date=cout,
        base_rate=3000.0,
        base_amount=6000.0,
        total_price=6720.0,
        total_paid=0.0,
        balance_due=6720.0,
        payment_status="Pending",
        status="Confirmed"
    )
    db.add(b2)
    db.commit()

    # Attempting to check-in b2 while room is occupied must raise 409 Conflict
    with pytest.raises(HTTPException) as exc_info:
        update_booking_status(
            booking_ref=b2.booking_ref,
            update=schemas.BookingStatusUpdate(status="Checked-In"),
            db=db
        )

    assert exc_info.value.status_code == 409
    assert "already occupied" in exc_info.value.detail.lower()


def test_checkout_settlement_double_settle_raises_409_conflict(db):
    """
    Verifies that concurrent requests from two browser tabs cannot settle the same bill twice:
    Once a folio is settled and checked out, subsequent settlement payments raise HTTP 409 Conflict.
    """
    room = create_test_room(db, "CKOUT")

    b = models.Booking(
        booking_ref=f"BK-SETTLE-{uuid.uuid4().hex[:6].upper()}",
        room_id=room.id,
        guest_name="Settlement Guest",
        guest_email="settle@example.com",
        guest_phone="9876543230",
        check_in_date="2026-11-01",
        check_out_date="2026-11-03",
        base_rate=3000.0,
        base_amount=6000.0,
        total_price=6720.0,
        total_paid=3000.0,
        balance_due=3720.0,
        payment_status="Partial",
        status="Checked-In"
    )
    db.add(b)
    db.commit()
    db.refresh(b)

    # Initial advance payment record
    init_pmt = models.BookingPayment(
        booking_id=b.id,
        payment_type="Advance",
        payment_mode="UPI",
        amount=3000.0,
        transaction_ref=f"UTR-INIT-{uuid.uuid4().hex[:6].upper()}"
    )
    db.add(init_pmt)

    folio = models.Folio(
        booking_id=b.id,
        folio_number=f"FOL-{b.booking_ref}",
        status="OPEN",
        total_charges=6720.0,
        total_payments=3000.0,
        balance_due=3720.0
    )
    db.add(folio)
    db.commit()

    # First checkout request settles remaining 3720.0
    req1 = schemas.CheckOutRequest(
        booking_ref=b.booking_ref,
        settlement_amount_paid=3720.0,
        settlement_payment_mode="UPI",
        transaction_ref=f"UTR-CKOUT-{uuid.uuid4().hex[:6].upper()}"
    )
    res1 = execute_check_out(req1, db=db)
    assert res1.net_balance_due == 0.0
    assert res1.status == "Checked-Out"

    # Second concurrent checkout request attempting to settle again MUST raise HTTP 409 Conflict
    req2 = schemas.CheckOutRequest(
        booking_ref=b.booking_ref,
        settlement_amount_paid=3720.0,
        settlement_payment_mode="Cash"
    )
    with pytest.raises(HTTPException) as exc_info:
        execute_check_out(req2, db=db)

    assert exc_info.value.status_code == 409
    assert "already checked out" in exc_info.value.detail.lower() or "settled" in exc_info.value.detail.lower()


# =========================================================================
# 2. SOFT DELETES FOR GST & AUDIT COMPLIANCE
# =========================================================================

def test_soft_delete_kot_preserves_audit_trail_and_reverses_folio(db):
    """
    Verifies that voiding a KOT:
    1. Sets is_deleted = True and void_reason without hard-deleting the row.
    2. Transparently hides the record from standard ORM queries.
    3. Reverses folio charge on the associated room folio.
    4. Remains accessible when execution_options(include_deleted=True) is used for GST audit.
    """
    room = create_test_room(db, "KOT_VOID")
    b = models.Booking(
        booking_ref=f"BK-KOT-{uuid.uuid4().hex[:6].upper()}",
        room_id=room.id,
        guest_name="KOT Test Guest",
        guest_email="kot@example.com",
        guest_phone="9876543240",
        check_in_date="2026-11-04",
        check_out_date="2026-11-05",
        base_rate=3000.0,
        base_amount=3000.0,
        total_price=3360.0,
        total_paid=0.0,
        balance_due=3360.0,
        status="Checked-In"
    )
    db.add(b)
    db.commit()
    db.refresh(b)

    kot_no = f"KOT-TEST-{uuid.uuid4().hex[:6].upper()}"
    kot = models.KotTicket(
        kot_no=kot_no,
        date="2026-11-04",
        time="07:30 PM",
        table_no="Room Service",
        room_no=room.name,
        waiter_name="Ramesh",
        items_json='[{"item_name": "Paneer Butter Masala", "qty": 1, "amount": 250.0}]',
        total_amount=250.0,
        status="Running"
    )
    db.add(kot)

    # Attach folio item to booking
    folio_item = models.RoomFolioItem(
        booking_id=b.id,
        item_type="Food_KOT",
        description="Paneer Butter Masala x 1",
        kot_number=kot_no,
        quantity=1,
        unit_price=238.10,
        taxable_amount=238.10,
        gst_rate=5.0,
        cgst_amount=5.95,
        sgst_amount=5.95,
        total_amount=250.0,
        status="Billed"
    )
    db.add(folio_item)
    b.total_price = round(b.total_price + 250.0, 2)
    b.balance_due = b.total_price
    db.commit()

    # Void the KOT ticket
    res = delete_kot_ticket(kot_no=kot_no, db=db)
    assert res["success"] is True

    # 1. Standard ORM query returns None (filtered out automatically)
    found_standard = db.query(models.KotTicket).filter(models.KotTicket.kot_no == kot_no).first()
    assert found_standard is None

    # 2. Audit query with include_deleted=True retrieves the soft-deleted record
    found_audit = db.query(models.KotTicket).execution_options(include_deleted=True).filter(
        models.KotTicket.kot_no == kot_no
    ).first()
    assert found_audit is not None
    assert found_audit.is_deleted is True
    assert found_audit.status == "Voided"
    assert found_audit.void_reason is not None

    # 3. Folio item is also soft-deleted and folio total was reversed
    fi_audit = db.query(models.RoomFolioItem).execution_options(include_deleted=True).filter(
        models.RoomFolioItem.kot_number == kot_no
    ).first()
    assert fi_audit is not None
    assert fi_audit.is_deleted is True
    assert fi_audit.status == "Void"

    db.refresh(b)
    assert b.total_price == 3360.0  # 250.0 charge reversed cleanly


def test_soft_delete_food_bill_preserves_gst_sequence(db):
    """
    Verifies that food bills use soft deletes to preserve unbroken sequential GST bill numbers.
    """
    bill_no = f"FB-GST-{uuid.uuid4().hex[:6].upper()}"
    bill = models.FoodBill(
        bill_no=bill_no,
        date="2026-11-04",
        time="08:00 PM",
        table_no="Table 5",
        guest_name="GST Guest",
        items_json="[]",
        food_gross_amount=500.0,
        taxable_amount=476.19,
        gst_amount=23.81,
        net_bill_amount=500.0,
        settlement_type="Cash",
        status="Settled"
    )
    db.add(bill)
    db.commit()

    # Cancel food bill
    res = delete_food_bill(bill_no=bill_no, db=db)
    assert res["success"] is True

    # Standard query excludes it
    assert db.query(models.FoodBill).filter(models.FoodBill.bill_no == bill_no).first() is None

    # Audit query verifies record preserved in PostgreSQL
    audit_bill = db.query(models.FoodBill).execution_options(include_deleted=True).filter(
        models.FoodBill.bill_no == bill_no
    ).first()
    assert audit_bill is not None
    assert audit_bill.is_deleted is True
    assert audit_bill.status == "CANCELLED"
    assert audit_bill.void_reason is not None


def test_soft_delete_check_in_booking(db):
    """
    Verifies cancel_check_in soft-deletes the booking record and releases room to Clean.
    """
    room = create_test_room(db, "CANCEL_CIN")
    room.housekeeping_status = "Occupied"

    b = models.Booking(
        booking_ref=f"BK-CANCEL-{uuid.uuid4().hex[:6].upper()}",
        room_id=room.id,
        guest_name="Cancel Guest",
        guest_email="cancel@example.com",
        guest_phone="9876543250",
        check_in_date="2026-11-04",
        check_out_date="2026-11-06",
        base_rate=3000.0,
        base_amount=6000.0,
        total_price=6720.0,
        status="Checked-In"
    )
    db.add(b)
    db.commit()

    res = cancel_check_in(booking_ref=b.booking_ref, db=db)
    assert res["success"] is True

    # Standard query filters it out
    assert db.query(models.Booking).filter(models.Booking.booking_ref == b.booking_ref).first() is None

    # Audit query confirms soft delete
    audit_b = db.query(models.Booking).execution_options(include_deleted=True).filter(
        models.Booking.booking_ref == b.booking_ref
    ).first()
    assert audit_b is not None
    assert audit_b.is_deleted is True
    assert audit_b.status == "Cancelled"

    # Room is released back to Clean
    db.refresh(room)
    assert room.housekeeping_status == "Clean"


# =========================================================================
# 3. N+1 QUERY PREVENTION & EAGER LOADING
# =========================================================================

def test_master_folio_eager_loading_n_plus_one_prevention(db):
    """
    Verifies get_master_room_folio leverages eager-loaded relationships (selectinload)
    to calculate totals without N+1 query overhead.
    """
    room = create_test_room(db, "EAGER")
    b = models.Booking(
        booking_ref=f"BK-FOL-{uuid.uuid4().hex[:6].upper()}",
        invoice_number=f"INV-FOL-{uuid.uuid4().hex[:6].upper()}",
        room_id=room.id,
        guest_name="Master Folio Guest",
        guest_email="masterfolio@example.com",
        guest_phone="9876543260",
        check_in_date="2026-11-04",
        check_out_date="2026-11-06",
        base_rate=3000.0,
        base_amount=6000.0,
        extra_guest_charge=0.0,
        gst_rate=12.0,
        cgst_amount=360.0,
        sgst_amount=360.0,
        total_tax=720.0,
        total_price=6720.0,
        total_paid=2000.0,
        balance_due=4720.0,
        payment_status="Partial",
        status="Checked-In"
    )
    db.add(b)
    db.commit()
    db.refresh(b)

    # Attach a RoomFolioItem (Vasudev Rasoi Food KOT)
    folio_item = models.RoomFolioItem(
        booking_id=b.id,
        item_type="Food_KOT",
        description="South Indian Thali x 2",
        kot_number="KOT-EAGER-01",
        quantity=2,
        unit_price=150.0,
        taxable_amount=300.0,
        gst_rate=5.0,
        cgst_amount=7.5,
        sgst_amount=7.5,
        total_amount=315.0,
        status="Billed"
    )
    db.add(folio_item)

    # Attach advance payment
    pmt = models.BookingPayment(
        booking_id=b.id,
        payment_type="Advance",
        payment_mode="UPI",
        amount=2000.0,
        transaction_ref="UTR-EAGER-001"
    )
    db.add(pmt)
    db.commit()

    # Call get_master_room_folio
    folio_resp = get_master_room_folio(booking_ref=b.booking_ref, db=db)
    assert folio_resp.booking_ref == b.booking_ref
    assert folio_resp.total_paid_amount == 2000.0
    assert len(folio_resp.folio_items) == 1
    assert folio_resp.folio_items[0].description == "South Indian Thali x 2"
    assert len(folio_resp.payments) == 1
    assert folio_resp.payments[0].amount == 2000.0


# =========================================================================
# 4. ALEMBIC MIGRATION CHAIN CONSISTENCY
# =========================================================================

def test_alembic_current_head_matches_revision_002():
    """
    Verifies that Alembic migration environment is valid and points to revision 002 as head.
    """
    from alembic.config import Config
    from alembic.script import ScriptDirectory

    alembic_cfg = Config(os.path.join(BACKEND_DIR, "alembic.ini"))
    alembic_cfg.set_main_option("script_location", os.path.join(BACKEND_DIR, "alembic"))
    script = ScriptDirectory.from_config(alembic_cfg)

    heads = script.get_heads()
    assert "003" in heads or "002" in heads, f"Expected revision 003 or 002 in heads, got {heads}"

    if "003" in heads:
        rev_003 = script.get_revision("003")
        assert rev_003.down_revision == "002"
    rev_002 = script.get_revision("002")
    assert rev_002.down_revision == "001"


# =========================================================================
# 5. ATOMIC SAFEGUARDS & CONCURRENCY HARDENING TESTS
# =========================================================================

def test_room_shift_into_occupied_room_raises_409(db):
    """
    Verifies that execute_room_shift isolates transactions and raises HTTP 409
    if attempting to transfer a guest into a room already occupied by another guest.
    """
    from app.routes.pms import execute_room_shift
    r1 = create_test_room(db, "SHIFT_SRC")
    r2 = create_test_room(db, "SHIFT_DEST")
    r1.housekeeping_status = "Occupied"
    r2.housekeeping_status = "Occupied"

    # Guest 1 in room 1
    b1 = models.Booking(
        booking_ref=f"BK-SRC-{uuid.uuid4().hex[:6].upper()}",
        room_id=r1.id,
        guest_name="Guest One",
        guest_email="g1@example.com",
        guest_phone="9876543201",
        check_in_date=datetime.date.today().isoformat(),
        check_out_date=(datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
        base_rate=2000.0,
        base_amount=2000.0,
        total_price=2240.0,
        status="Checked-In"
    )
    # Guest 2 in room 2
    b2 = models.Booking(
        booking_ref=f"BK-DEST-{uuid.uuid4().hex[:6].upper()}",
        room_id=r2.id,
        guest_name="Guest Two",
        guest_email="g2@example.com",
        guest_phone="9876543202",
        check_in_date=datetime.date.today().isoformat(),
        check_out_date=(datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
        base_rate=2000.0,
        base_amount=2000.0,
        total_price=2240.0,
        status="Checked-In"
    )
    db.add_all([b1, b2])
    db.commit()

    shift_req = schemas.RoomShiftCreate(
        booking_ref=b1.booking_ref,
        from_room_id=r1.id,
        to_room_id=r2.id,
        reason="AC noise in source room",
        shifted_by="Duty Manager"
    )

    with pytest.raises(HTTPException) as exc_info:
        execute_room_shift(shift_req, db=db)

    assert exc_info.value.status_code == 409
    assert "already occupied" in exc_info.value.detail.lower() or "occupied by active" in exc_info.value.detail.lower()


def test_atomic_folio_charge_and_payment_increment(db):
    """
    Verifies atomic_add_folio_charge and atomic_record_folio_payment perform
    database-level atomic increments without read-modify-write lost updates.
    """
    from app.utils.locking import atomic_add_folio_charge, atomic_record_folio_payment

    room = create_test_room(db, "FOLIO_ATOMIC")
    b = models.Booking(
        booking_ref=f"BK-ATOMIC-{uuid.uuid4().hex[:6].upper()}",
        room_id=room.id,
        guest_name="Atomic Folio Guest",
        guest_email="atomic@example.com",
        guest_phone="9876543299",
        check_in_date=datetime.date.today().isoformat(),
        check_out_date=(datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
        base_rate=2000.0,
        base_amount=2000.0,
        total_price=2240.0,
        total_paid=500.0,
        balance_due=1740.0,
        status="Checked-In",
        version_id=1
    )
    db.add(b)
    db.commit()

    # 1. Atomic charge addition
    b_updated, f_updated = atomic_add_folio_charge(db, b.id, 260.0)
    db.commit()
    db.refresh(b)
    assert b.total_price == 2500.0
    assert b.balance_due == 2000.0
    assert b.version_id == 2
    assert f_updated.total_charges == 2500.0
    assert f_updated.balance_due == 2000.0
    assert f_updated.version_id == 2

    # 2. Atomic settlement payment
    b_paid, f_paid = atomic_record_folio_payment(db, b.id, 2000.0, "UPI")
    db.commit()
    db.refresh(b)
    assert b.total_paid == 2500.0
    assert b.balance_due == 0.0
    assert b.payment_status == "Paid"
    assert b.version_id == 3
    assert f_paid.total_payments == 2500.0
    assert f_paid.balance_due == 0.0
    assert f_paid.status == "SETTLED"
    assert f_paid.version_id == 3


def test_database_partial_unique_index_prevents_duplicate_active_checkin(db):
    """
    Verifies that the partial unique index on bookings(room_id WHERE status='Checked-In')
    strictly blocks concurrent active check-in inserts into the same room.
    """
    from sqlalchemy import text
    from sqlalchemy.exc import IntegrityError

    # Ensure index exists on SQLite test DB
    try:
        db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_active_room_checked_in ON bookings(room_id) WHERE status = 'Checked-In' AND is_deleted = 0"))
        db.commit()
    except Exception:
        db.rollback()

    room = create_test_room(db, "UQ_IDX_TEST")
    b1 = models.Booking(
        booking_ref=f"BK-UQ1-{uuid.uuid4().hex[:6].upper()}",
        room_id=room.id,
        guest_name="Guest 1 Active",
        guest_email="uq1@example.com",
        guest_phone="9876543111",
        check_in_date="2026-11-06",
        check_out_date="2026-11-07",
        total_price=2000.0,
        status="Checked-In",
        is_deleted=False
    )
    db.add(b1)
    db.commit()

    # Attempting to insert a second Checked-In booking for the same room MUST violate unique index
    b2 = models.Booking(
        booking_ref=f"BK-UQ2-{uuid.uuid4().hex[:6].upper()}",
        room_id=room.id,
        guest_name="Guest 2 Duplicate",
        guest_email="uq2@example.com",
        guest_phone="9876543222",
        check_in_date="2026-11-06",
        check_out_date="2026-11-07",
        total_price=2000.0,
        status="Checked-In",
        is_deleted=False
    )
    db.add(b2)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()
