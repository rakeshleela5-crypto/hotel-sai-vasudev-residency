from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app.database import get_db
from app import models, schemas
from app.routes.bookings import parse_dates_and_nights, compute_tax_and_pricing, get_overlapping_bookings_count

router = APIRouter(prefix="/rooms", tags=["Rooms"])

INITIAL_ROOMS = [
    {
        "name": "Deluxe Room",
        "slug": "deluxe-room",
        "room_type": "Deluxe",
        "price_per_night": 1500.0,
        "capacity": 1,
        "total_inventory": 3,
        "bed_type": "Single Bed",
        "room_size": "220 sq ft",
        "description": "Ideal for solo pilgrims and travelers. Features clean comfortable bedding, 24/7 hot water, high-speed Wi-Fi, and flat-screen TV. Single occupancy.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker",
        "image_url": "/images/deluxe_room.jpg",
        "badge": "Budget Friendly",
        "is_available": True
    },
    {
        "name": "Classic Studio",
        "slug": "classic-studio",
        "room_type": "Classic Studio",
        "price_per_night": 2000.0,
        "capacity": 2,
        "total_inventory": 6,
        "bed_type": "Queen Bed",
        "room_size": "280 sq ft",
        "description": "Comfortable and spacious studio room tailored for couples and pilgrims. Well-appointed with 24/7 hot water, flat-screen TV, and tea/coffee maker.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker",
        "image_url": "/images/hero.jpg",
        "badge": "Popular",
        "is_available": True
    },
    {
        "name": "Executive Room",
        "slug": "executive-room",
        "room_type": "Executive",
        "price_per_night": 2500.0,
        "capacity": 2,
        "total_inventory": 7,
        "bed_type": "King Bed",
        "room_size": "340 sq ft",
        "description": "Sophisticated executive room with ergonomic workstation, mini fridge, and upgraded premium toiletries. Perfect for business travelers and serene pilgrimage stays.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker, Mini Fridge, Work Desk & Ergonomic Chair, Complimentary Premium Toiletries, Daily Newspaper",
        "image_url": "/images/suite_room.jpg",
        "badge": "Executive Choice",
        "is_available": True
    },
    {
        "name": "Premium Room",
        "slug": "premium-room",
        "room_type": "Premium",
        "price_per_night": 3000.0,
        "capacity": 2,
        "total_inventory": 2,
        "bed_type": "King Bed",
        "room_size": "400 sq ft",
        "description": "Top-tier premium sanctuary offering maximum comfort, spacious interiors, mini fridge, dedicated work desk, 24/7 hot water, and VIP darshan assistance.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker, Mini Fridge, Work Desk & Ergonomic Chair, Complimentary Premium Toiletries, Daily Newspaper",
        "image_url": "/images/restaurant.jpg",
        "badge": "Premium Luxury",
        "is_available": True
    }
]

def seed_rooms_if_empty(db: Session):
    count = db.query(models.Room).count()
    if count == 0:
        for r_data in INITIAL_ROOMS:
            room = models.Room(**r_data)
            db.add(room)
        db.commit()

@router.get("", response_model=List[schemas.RoomResponse])
def get_rooms(
    room_type: Optional[str] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """Retrieve all available rooms with optional filters"""
    seed_rooms_if_empty(db)
    
    query = db.query(models.Room).filter(models.Room.is_available == True)
    if room_type and room_type.lower() != "all":
        query = query.filter(models.Room.room_type.ilike(f"%{room_type}%"))
    if max_price:
        query = query.filter(models.Room.price_per_night <= max_price)
    
    return query.order_by(models.Room.price_per_night.asc()).all()

@router.get("/{room_id}/availability", response_model=schemas.AvailabilityCheckResponse)
def check_room_availability(
    room_id: int,
    check_in: str = Query(..., description="Check-in date (YYYY-MM-DD)"),
    check_out: str = Query(..., description="Check-out date (YYYY-MM-DD)"),
    adults: int = Query(2, ge=1, description="Number of adults"),
    db: Session = Depends(get_db)
):
    """
    Check real-time room availability, calculate server-side pricing, and prevent double bookings.
    """
    seed_rooms_if_empty(db)
    
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    _, _, nights = parse_dates_and_nights(check_in, check_out)
    
    booked_count = get_overlapping_bookings_count(db, room_id, check_in, check_out)
    inventory_limit = getattr(room, "total_inventory", 5)
    remaining_count = max(0, inventory_limit - booked_count)
    is_available = remaining_count > 0

    pricing = compute_tax_and_pricing(room, nights, adults)

    msg = (
        f"{remaining_count} room(s) available for {check_in} to {check_out}." 
        if is_available 
        else f"Sold out for the selected dates. Please choose another date or category."
    )

    return schemas.AvailabilityCheckResponse(
        available=is_available,
        room_id=room.id,
        room_name=room.name,
        check_in_date=check_in,
        check_out_date=check_out,
        nights=nights,
        capacity=room.capacity,
        adults=adults,
        base_rate_per_night=pricing["base_tariff"],
        base_subtotal=pricing["base_amount"],
        extra_guest_charge=pricing["extra_guest_charge"],
        taxable_amount=pricing["taxable_value"],
        gst_rate=pricing["gst_rate"],
        cgst_amount=pricing["cgst_amount"],
        sgst_amount=pricing["sgst_amount"],
        total_tax=pricing["total_tax"],
        grand_total=pricing["grand_total"],
        remaining_rooms_count=remaining_count,
        message=msg
    )

@router.get("/{room_id}", response_model=schemas.RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db)):
    """Retrieve a single room by ID"""
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.post("/seed", response_model=dict)
def trigger_seed(db: Session = Depends(get_db)):
    """Seed or reset rooms catalog"""
    seed_rooms_if_empty(db)
    return {"message": "Rooms catalog seeded successfully", "count": db.query(models.Room).count()}
