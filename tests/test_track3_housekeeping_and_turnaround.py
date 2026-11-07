import asyncio
import datetime
import uuid
import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.routes.pms import (
    update_room_housekeeping_status,
    save_housekeeping_record,
    toggle_room_maintenance,
    execute_walk_in_check_in,
    execute_check_out,
    audit_housekeeping_discrepancy,
    resolve_housekeeping_discrepancy
)

def create_test_room(db: Session, prefix: str, price: float = 2500.0) -> models.Room:
    uid = uuid.uuid4().hex[:6].upper()
    r = models.Room(
        name=f"Room {prefix}-{uid}",
        slug=f"room-{prefix.lower()}-{uid.lower()}",
        room_type="Deluxe",
        price_per_night=price,
        description=f"Test room {prefix}",
        image_url="https://example.com/r.jpg",
        housekeeping_status="Clean",
        is_available=True
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

def test_four_eye_turnaround_state_machine(db: Session):
    """
    Track 3 Fix Verification:
    4-Eye Housekeeping Turnaround State Machine:
    Dirty -> Cleaning In Progress -> Clean -> Inspected
    Verify is_available transitions and HousekeepingRecord sync.
    """
    room = create_test_room(db, "TURNAROUND")

    # Step 1: Transition to Dirty
    payload1 = schemas.HousekeepingStatusUpdate(
        room_id=room.id,
        housekeeping_status="Dirty",
        updated_by="Checkout Clerk"
    )
    res1 = asyncio.run(update_room_housekeeping_status(payload1, db=db))
    db.refresh(room)
    assert room.housekeeping_status == "Dirty"
    assert room.is_available is False
    assert res1["is_available"] is False

    # Step 2: Attendant starts cleaning
    payload2 = schemas.HousekeepingStatusUpdate(
        room_id=room.id,
        housekeeping_status="Cleaning In Progress",
        updated_by="Ramesh Attendant"
    )
    res2 = asyncio.run(update_room_housekeeping_status(payload2, db=db))
    db.refresh(room)
    assert room.housekeeping_status == "Cleaning In Progress"
    assert room.is_available is False

    hk_rec = db.query(models.HousekeepingRecord).filter(models.HousekeepingRecord.room_no == room.name).first()
    assert hk_rec is not None
    assert hk_rec.cleaning_started_at is not None

    # Step 3: Attendant finishes and marks Clean
    payload3 = schemas.HousekeepingStatusUpdate(
        room_id=room.id,
        housekeeping_status="Clean",
        updated_by="Ramesh Attendant"
    )
    res3 = asyncio.run(update_room_housekeeping_status(payload3, db=db))
    db.refresh(room)
    assert room.housekeeping_status == "Clean"
    assert room.is_available is True
    db.refresh(hk_rec)
    assert hk_rec.last_cleaned_time is not None

    # Step 4: Supervisor 4-Eye Inspection
    payload4 = schemas.HousekeepingStatusUpdate(
        room_id=room.id,
        housekeeping_status="Inspected",
        updated_by="Duty Supervisor"
    )
    res4 = asyncio.run(update_room_housekeeping_status(payload4, db=db))
    db.refresh(room)
    assert room.housekeeping_status == "Inspected"
    assert room.is_available is True


def test_in_house_guest_protection_prevents_occupied_room_from_becoming_available(db: Session):
    """
    Track 3 Fix Verification:
    Occupancy Collision Guard:
    When an active guest is checked in, housekeeping cleaning must NOT make
    the room available for check-in to prevent double-booking.
    """
    room = create_test_room(db, "OCC_GUARD")
    today_d = datetime.date.today()
    tomorrow_d = today_d + datetime.timedelta(days=1)

    # In-house guest checked in
    b = models.Booking(
        booking_ref=f"BK-OCC-{uuid.uuid4().hex[:6].upper()}",
        invoice_number=f"INV-OCC-{uuid.uuid4().hex[:6].upper()}",
        room_id=room.id,
        guest_name="In-House Pilgrim",
        guest_email="pilgrim@example.com",
        guest_phone="9876543210",
        check_in_date=today_d.isoformat(),
        check_out_date=tomorrow_d.isoformat(),
        total_nights=1,
        base_rate=room.price_per_night,
        base_amount=room.price_per_night,
        total_tax=300.0,
        cgst_amount=150.0,
        sgst_amount=150.0,
        total_price=room.price_per_night + 300.0,
        balance_due=0.0,
        status="Checked-In",
        payment_status="Paid",
        actual_check_in=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
    )
    db.add(b)
    room.housekeeping_status = "Occupied"
    room.is_available = False
    db.commit()

    # Attendant marks room clean during stayover
    payload = schemas.HousekeepingStatusUpdate(
        room_id=room.id,
        housekeeping_status="Clean",
        updated_by="Sunita Attendant"
    )
    res = asyncio.run(update_room_housekeeping_status(payload, db=db))
    db.refresh(room)
    # The room is physically clean, but MUST REMAIN UNAVAILABLE because guest is still in-house!
    assert room.is_available is False
    assert res["is_available"] is False

    # Also test via save_housekeeping_record
    hk_payload = schemas.HousekeepingRecordCreate(
        room_no=room.name,
        status="Inspected",
        assigned_staff="Sunita Attendant"
    )
    res_hk = asyncio.run(save_housekeeping_record(hk_payload, db=db))
    db.refresh(room)
    assert room.is_available is False
    assert res_hk["is_available"] is False


def test_checkin_guards_under_maintenance_and_dirty_rooms(db: Session):
    """
    Track 3 Fix Verification:
    Rooms Under Maintenance or Dirty must reject walk-in check-in with 400.
    Check-out must transition room to Dirty and unavailable.
    """
    room = create_test_room(db, "GUARD")
    today_str = datetime.date.today().isoformat()
    tomorrow_str = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()

    # Step 1: Put room under maintenance
    maint_req = schemas.RoomMaintenanceRequest(
        is_under_maintenance=True,
        reason="AC compressor issue",
        updated_by="Maintenance Lead"
    )
    asyncio.run(toggle_room_maintenance(room.id, maint_req, db=db))
    db.refresh(room)
    assert room.housekeeping_status == "Under_Maintenance"
    assert room.is_available is False

    # Attempt check-in on Out-of-Order room -> Must raise 400
    ci_payload = schemas.WalkInCheckInRequest(
        room_id=room.id,
        guest_name="Walk-In Guest",
        guest_phone="9988776655",
        guest_email="walkin@example.com",
        check_in_date=today_str,
        check_out_date=tomorrow_str,
        adults=2,
        advance_amount=1000.0,
        advance_payment_mode="UPI"
    )
    with pytest.raises(HTTPException) as exc1:
        execute_walk_in_check_in(ci_payload, db=db)
    assert exc1.value.status_code == 400
    assert "Under Maintenance" in exc1.value.detail

    # Step 2: Mark room Dirty -> Must raise 400
    room.housekeeping_status = "Dirty"
    room.is_available = False
    db.commit()

    with pytest.raises(HTTPException) as exc2:
        execute_walk_in_check_in(ci_payload, db=db)
    assert exc2.value.status_code == 400
    assert "marked 'Dirty'" in exc2.value.detail or "marked Dirty" in exc2.value.detail

    # Step 3: Mark room Clean -> Check-in succeeds
    room.housekeeping_status = "Clean"
    room.is_available = True
    db.commit()

    ci_res = execute_walk_in_check_in(ci_payload, db=db)
    assert ci_res.booking_ref is not None
    db.refresh(room)
    assert room.housekeeping_status == "Occupied"

    # Step 4: Check-out releases room to Dirty and unavailable
    co_payload = schemas.CheckOutRequest(
        booking_ref=ci_res.booking_ref,
        settlement_amount_paid=0.0,
        settlement_payment_mode="Cash",
        processed_by="Front Desk Officer"
    )
    execute_check_out(co_payload, db=db)
    db.refresh(room)
    assert room.housekeeping_status == "Dirty"
    assert room.is_available is False


def test_housekeeping_discrepancy_detection_and_resolution(db: Session):
    """
    Track 3 Fix Verification:
    Anti-Fraud Discrepancy Detection:
    - Short-stay detection (< 6h since checkin, HK reports vacant) -> CRITICAL_FRAUD_ALERT
    - Squatter detection (PMS shows vacant, HK reports occupied) -> CRITICAL_UNRECORDED_GUEST_ALERT
    - Discrepancy resolution with manager notes and 404 guard on nonexistent IDs.
    """
    room_fraud = create_test_room(db, "FRAUD")
    today_d = datetime.date.today()
    tomorrow_d = today_d + datetime.timedelta(days=1)

    # Checked in 2 hours ago
    b = models.Booking(
        booking_ref=f"BK-FRAUD-{uuid.uuid4().hex[:6].upper()}",
        invoice_number=f"INV-FRAUD-{uuid.uuid4().hex[:6].upper()}",
        room_id=room_fraud.id,
        guest_name="Short Stay Guest",
        guest_email="fraud_check@hotel.com",
        guest_phone="9876543200",
        check_in_date=today_d.isoformat(),
        check_out_date=tomorrow_d.isoformat(),
        total_nights=1,
        base_rate=2500.0,
        base_amount=2500.0,
        total_tax=300.0,
        cgst_amount=150.0,
        sgst_amount=150.0,
        total_price=2800.0,
        balance_due=0.0,
        status="Checked-In",
        payment_status="Paid",
        actual_check_in=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
    )
    db.add(b)
    room_fraud.housekeeping_status = "Occupied"
    db.commit()

    # Case A: Attendant marks room Vacant -> Triggers Critical Short-Stay Fraud Alert!
    disc_create1 = schemas.HousekeepingDiscrepancyCreate(
        room_no=room_fraud.name,
        housekeeping_status="Vacant Clean",
        reported_by="Ganesh Floor Lead"
    )
    res_disc1 = audit_housekeeping_discrepancy(disc_create1, db=db)
    assert res_disc1["is_discrepancy_alert"] is True
    assert res_disc1["is_short_stay_theft_suspect"] is True
    assert res_disc1["alert_level"] == "CRITICAL_FRAUD_ALERT"
    disc_id = res_disc1["discrepancy_id"]

    # Resolve discrepancy
    resolve_payload = schemas.ResolveDiscrepancyRequest(
        notes="Guest had early train checkout; receptionist verified receipt.",
        resolved_by="Duty Manager Rajesh"
    )
    res_resolved = resolve_housekeeping_discrepancy(disc_id, resolve_payload, db=db)
    assert res_resolved["resolved"] is True

    # Resolving nonexistent discrepancy raises 404
    with pytest.raises(HTTPException) as exc_fake:
        resolve_housekeeping_discrepancy("NONEXISTENT-99999", resolve_payload, db=db)
    assert exc_fake.value.status_code == 404

    # Case B: Squatter / Unrecorded Guest Detection (PMS Vacant, HK reports Occupied)
    room_vacant = create_test_room(db, "VACANT")
    disc_create2 = schemas.HousekeepingDiscrepancyCreate(
        room_no=room_vacant.name,
        housekeeping_status="Physically Occupied",
        reported_by="Sunita Attendant"
    )
    res_disc2 = audit_housekeeping_discrepancy(disc_create2, db=db)
    assert res_disc2["is_discrepancy_alert"] is True
    assert res_disc2["alert_level"] == "CRITICAL_UNRECORDED_GUEST_ALERT"
