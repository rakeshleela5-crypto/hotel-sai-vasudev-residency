"""
Integration Test Suite: Guest Room QR Portal & Amenity Tier Governance
Tests:
  1. Amenity tier restrictions (Deluxe vs Executive vs Suite).
  2. Maximum quantity limit enforcement on complimentary amenities.
  3. In-room dining order creation with Transfer to Room Folio (RoomFolioItem insertion).
  4. Receptionist summary and order status progression.
"""

import uuid
import pytest
from fastapi import HTTPException
from app.database import SessionLocal
from app import models
from app.routes.guest_portal import (
    CreateGuestOrderPayload,
    AmenityItemPayload,
    OrderItemPayload,
    UpdateOrderStatusPayload,
    create_guest_order,
    list_guest_orders,
    update_order_status,
    get_receptionist_alert_summary
)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_amenity_tier_restrictions(db):
    # Deluxe rooms cannot order luxury amenities like 'amenity-kd' (Electric Kettle & Tea Kit - Executive/Premium only)
    invalid_payload = CreateGuestOrderPayload(
        room_no="101",
        room_category="Deluxe",
        order_type="Amenity Request",
        amenities=[
            AmenityItemPayload(
                amenity_id="amenity-kd",
                amenity_name="Electric Kettle & Tea Kit",
                qty=1
            )
        ]
    )

    with pytest.raises(HTTPException) as exc_info:
        create_guest_order(invalid_payload, db=db)
    assert exc_info.value.status_code == 400
    assert "not complimentary for room category" in exc_info.value.detail


def test_amenity_max_qty_validation(db):
    # Requesting excessive quantity of permitted amenity (max_qty is 4 for amenity-wt)
    excessive_payload = CreateGuestOrderPayload(
        room_no="101",
        room_category="Deluxe",
        order_type="Amenity Request",
        amenities=[
            AmenityItemPayload(
                amenity_id="amenity-wt",
                amenity_name="General White Towels",
                qty=10
            )
        ]
    )

    with pytest.raises(HTTPException) as exc_info:
        create_guest_order(excessive_payload, db=db)
    assert exc_info.value.status_code == 400
    assert "exceeds maximum allowed" in exc_info.value.detail


def test_in_room_dining_folio_transfer(db):
    # 1. Seed room 101 if not existing
    room = db.query(models.Room).filter(models.Room.name == "Room 101").first()
    if not room:
        room = models.Room(
            name="Room 101",
            slug=f"room-101-{uuid.uuid4().hex[:4]}",
            room_type="Deluxe",
            price_per_night=1500.0,
            capacity=2,
            total_inventory=1,
            description="Deluxe Room 101",
            image_url="",
            is_available=False
        )
        db.add(room)
        db.commit()
        db.refresh(room)

    # 2. Seed an active checked-in booking for Room 101
    booking_ref = f"BK-RSO-{uuid.uuid4().hex[:6].upper()}"
    booking = models.Booking(
        booking_ref=booking_ref,
        room_id=room.id,
        guest_name="Sanjay Patnaik",
        guest_phone="9876543210",
        guest_email="sanjay@example.com",
        check_in_date="2026-11-06",
        check_out_date="2026-11-08",
        status="Checked-In",
        total_price=2000.0,
        total_paid=1000.0,
        balance_due=1000.0,
        payment_status="Partial",
        is_deleted=False
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # 3. Guest places In-Room Dining food order with "Transfer to Room Folio"
    order_payload = CreateGuestOrderPayload(
        room_no="101",
        room_category="Deluxe",
        order_type="Food Order",
        items=[
            OrderItemPayload(
                item_id="it_paneer_tikka",
                item_name="Paneer Tikka Butter Masala",
                rate=280.0,
                qty=1,
                amount=280.0
            ),
            OrderItemPayload(
                item_id="it_butter_naan",
                item_name="Butter Naan",
                rate=40.0,
                qty=2,
                amount=80.0
            )
        ],
        subtotal_amount=360.0,
        tax_amount=18.0,  # 5% GST
        total_amount=378.0,
        payment_method="Transfer to Room Folio",
        guest_name="Sanjay Patnaik"
    )

    res = create_guest_order(order_payload, db=db)
    assert res["status"] == "success"
    order_num = res["order"]["order_number"]

    # 4. Verify RoomFolioItem was inserted into active guest booking folio
    folio_item = db.query(models.RoomFolioItem).filter(
        models.RoomFolioItem.booking_id == booking.id,
        models.RoomFolioItem.kot_number == order_num
    ).first()

    assert folio_item is not None
    assert folio_item.sac_code == "996331"
    assert folio_item.total_amount == 378.0
    assert folio_item.gst_rate == 5.0
    assert "Paneer Tikka" in folio_item.description


def test_order_status_lifecycle_and_receptionist_summary(db):
    # Seed a new guest order
    order_payload = CreateGuestOrderPayload(
        room_no="102",
        room_category="Deluxe",
        order_type="Amenity Request",
        amenities=[
            AmenityItemPayload(
                amenity_id="amenity-wt",
                amenity_name="General White Towels",
                qty=1
            )
        ],
        payment_method="Complimentary"
    )
    res = create_guest_order(order_payload, db=db)
    order_id = res["order"]["id"]

    # Check receptionist alert summary
    summary = get_receptionist_alert_summary(db=db)
    assert summary["new_orders_count"] >= 1

    # Update status to Delivered
    update_payload = UpdateOrderStatusPayload(
        status="Delivered",
        delivery_staff="Mahesh - Housekeeping",
        remarks="Delivered to guest in room 102"
    )
    updated = update_order_status(order_id, update_payload, db=db)
    assert updated["order"]["status"] == "Delivered"
    assert updated["order"]["delivery_staff"] == "Mahesh - Housekeeping"
