import datetime
import uuid
import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.routes.pms import execute_room_shift, extend_guest_stay

def create_unique_room(db: Session, prefix: str, price: float = 2000.0) -> models.Room:
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

def test_room_shift_allows_future_unrelated_reservation(db: Session):
    """
    Finding 1 Fix Verification:
    If destination room has a confirmed reservation weeks away,
    an in-house guest shifting today MUST NOT be blocked.
    """
    today_d = datetime.date.today()
    r_src = create_unique_room(db, "SRC_FUT", price=1500.0)
    r_dest = create_unique_room(db, "DEST_FUT", price=2500.0)
    r_src.housekeeping_status = "Occupied"

    # Guest 1: In-house guest in r_src from today for 2 nights
    b1 = models.Booking(
        booking_ref=f"BK-SRC-{uuid.uuid4().hex[:6].upper()}",
        room_id=r_src.id,
        guest_name="Shifting Guest",
        guest_email="sg@example.com",
        guest_phone="9876543210",
        check_in_date=today_d.isoformat(),
        check_out_date=(today_d + datetime.timedelta(days=2)).isoformat(),
        base_rate=1500.0,
        base_amount=3000.0,
        total_price=3000.0,
        balance_due=3000.0,
        status="Checked-In"
    )

    # Guest 2: Future booking in r_dest 20 days later
    b_future = models.Booking(
        booking_ref=f"BK-FUT-{uuid.uuid4().hex[:6].upper()}",
        room_id=r_dest.id,
        guest_name="Future Pilgrim",
        guest_email="fp@example.com",
        guest_phone="9876543211",
        check_in_date=(today_d + datetime.timedelta(days=20)).isoformat(),
        check_out_date=(today_d + datetime.timedelta(days=22)).isoformat(),
        base_rate=2500.0,
        base_amount=5000.0,
        total_price=5000.0,
        status="Confirmed"
    )
    db.add_all([b1, b_future])
    db.commit()

    shift_req = schemas.RoomShiftCreate(
        booking_ref=b1.booking_ref,
        to_room_id=r_dest.id,
        reason="Upgrade to Executive",
        shifted_by="Senior Duty Manager"
    )

    res = execute_room_shift(shift_req, db=db)
    assert res.to_room_id == r_dest.id
    assert r_dest.housekeeping_status == "Occupied"
    assert r_src.housekeeping_status == "Dirty"


def test_room_shift_blocks_conflicting_reservation_during_remaining_stay(db: Session):
    """
    Finding 2 Fix Verification:
    If destination room is vacant today, but reserved tomorrow,
    a guest with a 3-night stay shifting today MUST be rejected with HTTP 409.
    """
    today_d = datetime.date.today()
    r_src = create_unique_room(db, "SRC_CLASH", price=1500.0)
    r_dest = create_unique_room(db, "DEST_CLASH", price=2500.0)
    r_src.housekeeping_status = "Occupied"

    # Guest 1: In-house guest in r_src from today for 3 nights (until today + 3)
    b1 = models.Booking(
        booking_ref=f"BK-SRC-{uuid.uuid4().hex[:6].upper()}",
        room_id=r_src.id,
        guest_name="Guest ThreeNights",
        guest_email="g3@example.com",
        guest_phone="9876543212",
        check_in_date=today_d.isoformat(),
        check_out_date=(today_d + datetime.timedelta(days=3)).isoformat(),
        base_rate=1500.0,
        base_amount=4500.0,
        total_price=4500.0,
        balance_due=4500.0,
        status="Checked-In"
    )

    # Guest 2: Reservation in r_dest arriving tomorrow (today + 1 to today + 2)
    b_tomorrow = models.Booking(
        booking_ref=f"BK-TMRW-{uuid.uuid4().hex[:6].upper()}",
        room_id=r_dest.id,
        guest_name="Tomorrow Arrival",
        guest_email="ta@example.com",
        guest_phone="9876543213",
        check_in_date=(today_d + datetime.timedelta(days=1)).isoformat(),
        check_out_date=(today_d + datetime.timedelta(days=2)).isoformat(),
        base_rate=2500.0,
        base_amount=2500.0,
        total_price=2500.0,
        status="Confirmed"
    )
    db.add_all([b1, b_tomorrow])
    db.commit()

    shift_req = schemas.RoomShiftCreate(
        booking_ref=b1.booking_ref,
        to_room_id=r_dest.id,
        reason="Upgrade Request",
        shifted_by="Duty Manager"
    )

    with pytest.raises(HTTPException) as exc_info:
        execute_room_shift(shift_req, db=db)

    assert exc_info.value.status_code == 409
    assert "conflicting reservation" in exc_info.value.detail.lower()


def test_room_shift_prorates_tariff_and_updates_balance(db: Session):
    """
    Finding 3 Fix Verification:
    Shifting to a higher rate room must prorate remaining nights and adjust
    total_price, base_amount, total_tax, balance_due, and insert RoomFolioItem.
    """
    today_d = datetime.date.today()
    checkin_d = today_d - datetime.timedelta(days=1) # checked in yesterday
    checkout_d = today_d + datetime.timedelta(days=2) # 3 nights total

    r_src = create_unique_room(db, "SRC_PRO", price=1500.0)
    r_dest = create_unique_room(db, "DEST_PRO", price=3000.0)
    r_src.housekeeping_status = "Occupied"

    # Initially 3 nights in Standard @ 1500 = 4500 total
    b = models.Booking(
        booking_ref=f"BK-PRO-{uuid.uuid4().hex[:6].upper()}",
        room_id=r_src.id,
        guest_name="Upgrade Guest",
        guest_email="upg@example.com",
        guest_phone="9876543214",
        check_in_date=checkin_d.isoformat(),
        check_out_date=checkout_d.isoformat(),
        total_nights=3,
        base_rate=1500.0,
        base_amount=4017.86,
        gst_rate=12.0,
        total_tax=482.14,
        total_price=4500.0,
        total_paid=1000.0,
        balance_due=3500.0,
        status="Checked-In"
    )
    db.add(b)
    db.commit()

    shift_req = schemas.RoomShiftCreate(
        booking_ref=b.booking_ref,
        to_room_id=r_dest.id,
        reason="Guest paid for Suite Upgrade",
        shifted_by="Manager"
    )

    execute_room_shift(shift_req, db=db)
    db.refresh(b)

    # 1 night elapsed @ 1500 = 1500
    # 2 nights remaining @ 3000 = 6000
    # Expected grand total = 7500
    assert b.total_price == 7500.0
    # Balance due = 7500 - 1000 paid = 6500
    assert b.balance_due == 6500.0
    assert b.room_id == r_dest.id

    # Verify RoomFolioItem adjustment was created
    folio_adj = db.query(models.RoomFolioItem).filter(
        models.RoomFolioItem.booking_id == b.id,
        models.RoomFolioItem.item_type == "Room_Tariff_Adjustment"
    ).first()
    assert folio_adj is not None
    # 2 nights * (3000 - 1500) = 3000 delta
    assert folio_adj.total_amount == 3000.0


@pytest.mark.asyncio
async def test_extend_stay_collision_and_success(db: Session):
    """
    Finding 4 Fix Verification:
    1. Extending stay into an already booked window must raise 409.
    2. Extending stay into an unreserved window must recalculate total tariff and GST.
    """
    today_d = datetime.date.today()
    r = create_unique_room(db, "EXT_ROOM", price=2000.0)

    # Guest 1: In room r from today until today + 2
    b1 = models.Booking(
        booking_ref=f"BK-EXT1-{uuid.uuid4().hex[:6].upper()}",
        room_id=r.id,
        guest_name="Guest Extending",
        guest_email="ext@example.com",
        guest_phone="9876543215",
        check_in_date=today_d.isoformat(),
        check_out_date=(today_d + datetime.timedelta(days=2)).isoformat(),
        total_nights=2,
        base_rate=2000.0,
        base_amount=3571.43,
        gst_rate=12.0,
        total_tax=428.57,
        total_price=4000.0,
        total_paid=2000.0,
        balance_due=2000.0,
        status="Checked-In"
    )

    # Guest 2: Arriving at today + 3
    b2 = models.Booking(
        booking_ref=f"BK-EXT2-{uuid.uuid4().hex[:6].upper()}",
        room_id=r.id,
        guest_name="Guest Following",
        guest_email="foll@example.com",
        guest_phone="9876543216",
        check_in_date=(today_d + datetime.timedelta(days=3)).isoformat(),
        check_out_date=(today_d + datetime.timedelta(days=5)).isoformat(),
        total_nights=2,
        base_rate=2000.0,
        base_amount=3571.43,
        total_price=4000.0,
        status="Confirmed"
    )
    db.add_all([b1, b2])
    db.commit()

    # Attempt 1: Trying to extend until today + 4 (collides with Guest 2 starting at today + 3) -> Expect 409
    ext_req_clash = schemas.ExtendStayRequest(
        room_no=str(r.id),
        new_checkout_date=(today_d + datetime.timedelta(days=4)).isoformat(),
        extended_by="Front Desk"
    )
    with pytest.raises(HTTPException) as exc_info:
        await extend_guest_stay(ext_req_clash, db=db)

    assert exc_info.value.status_code == 409
    assert "already reserved by" in exc_info.value.detail.lower()

    # Attempt 2: Trying to extend until today + 3 (check-out on the arrival date of Guest 2) -> Allowed!
    ext_req_valid = schemas.ExtendStayRequest(
        room_no=str(r.id),
        new_checkout_date=(today_d + datetime.timedelta(days=3)).isoformat(),
        extended_by="Front Desk"
    )
    res = await extend_guest_stay(ext_req_valid, db=db)
    assert res["success"] is True
    assert res["totalNights"] == 3
    assert res["totalPrice"] == 6000.0
    assert res["balanceDue"] == 4000.0

