from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/rooms", tags=["Rooms"])

INITIAL_ROOMS = [
    {
        "name": "Executive Deluxe Room",
        "slug": "executive-deluxe-room",
        "room_type": "Deluxe",
        "price_per_night": 2499.0,
        "capacity": 2,
        "bed_type": "King Bed",
        "room_size": "340 sq ft",
        "description": "Sophisticated modern room designed for ultimate relaxation after a sacred visit or business day. Features soundproof windows, premium posture-pedic mattress, ambient warm cove lighting, and an Italian marble bathroom.",
        "amenities": "High-Speed Wi-Fi, 43\" 4K Smart TV, Central AC, 24/7 Room Service, Complimentary Tea/Coffee Maker, Luxurious Toiletries, Daily Housekeeping",
        "image_url": "/images/deluxe_room.jpg",
        "badge": "Best Value",
        "is_available": True
    },
    {
        "name": "Super Deluxe Family Room",
        "slug": "super-deluxe-family-room",
        "room_type": "Super Deluxe",
        "price_per_night": 3799.0,
        "capacity": 4,
        "bed_type": "Two Queen Beds",
        "room_size": "480 sq ft",
        "description": "Ideal for families and groups visiting for temple darshan or leisure. Spacious layout with two queen beds, cozy sofa seating, double wardrobe, mini refrigerator, and panoramic city views.",
        "amenities": "High-Speed Wi-Fi, 50\" 4K Smart TV, Central AC, Mini Fridge, 24/7 Room Service, Temple Darshan Assistance, Dedicated Work Desk",
        "image_url": "/images/hero.jpg",
        "badge": "Family Favorite",
        "is_available": True
    },
    {
        "name": "Sai Presidential Suite",
        "slug": "sai-presidential-suite",
        "room_type": "Suite",
        "price_per_night": 5999.0,
        "capacity": 4,
        "bed_type": "Master King + Living Lounge",
        "room_size": "720 sq ft",
        "description": "The pinnacle of divine hospitality. Featuring a private master bedroom, separate luxurious living lounge with marble coffee table, private dining nook, soaking bathtub, and VIP concierge service.",
        "amenities": "High-Speed Wi-Fi, 55\" OLED Smart TV, Luxury Bathrobe & Slippers, Soaking Bathtub, Express Check-In, Complimentary Buffet Breakfast, 24/7 Butler on Call",
        "image_url": "/images/suite_room.jpg",
        "badge": "Luxury Suite",
        "is_available": True
    },
    {
        "name": "Vasudev Divine Comfort",
        "slug": "vasudev-divine-comfort",
        "room_type": "Standard Deluxe",
        "price_per_night": 1999.0,
        "capacity": 2,
        "bed_type": "Queen Bed",
        "room_size": "290 sq ft",
        "description": "A quiet and peaceful haven offering divine tranquility. Impeccably clean, air-conditioned, with complimentary Wi-Fi and 24-hour hot water, perfect for solo travelers and couples.",
        "amenities": "High-Speed Wi-Fi, 32\" HD TV, Air Conditioning, 24h Hot Water, Electric Kettle, Mineral Water Bottles, Room Service",
        "image_url": "/images/restaurant.jpg",
        "badge": "Pocket Friendly",
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
    # Seed on first query if DB is empty
    seed_rooms_if_empty(db)
    
    query = db.query(models.Room).filter(models.Room.is_available == True)
    if room_type and room_type.lower() != "all":
        query = query.filter(models.Room.room_type.ilike(f"%{room_type}%"))
    if max_price:
        query = query.filter(models.Room.price_per_night <= max_price)
    
    return query.order_by(models.Room.price_per_night.asc()).all()

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
