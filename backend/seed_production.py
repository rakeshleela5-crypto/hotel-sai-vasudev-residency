"""
Production Hotel Database Initialization & Seeding Script
Hotel Sai Vasudev Residency

Usage:
  python seed_production.py          # Seeds clean room inventory with ZERO dummy bookings
  python seed_production.py --reset  # Drops existing tables, recreates schema, seeds fresh rooms
"""

import sys
import os
from sqlalchemy.orm import Session

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app import models

REAL_HOTEL_ROOMS = [
    # 1st Floor - Executive Deluxe Rooms
    {
        "id": 101,
        "name": "Room 101 - Executive Deluxe",
        "slug": "room-101-executive-deluxe",
        "room_type": "Deluxe",
        "price_per_night": 2499.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "King Bed",
        "room_size": "340 sq ft",
        "description": "Executive Deluxe Room with premium posture-pedic mattress, ambient warm cove lighting, central AC, and soundproof windows.",
        "amenities": "High-Speed Wi-Fi, 43\" Smart TV, Central AC, 24/7 Room Service, Complimentary Tea/Coffee Maker, Daily Housekeeping",
        "image_url": "/images/deluxe_room.jpg",
        "badge": "Best Value",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 102,
        "name": "Room 102 - Executive Deluxe",
        "slug": "room-102-executive-deluxe",
        "room_type": "Deluxe",
        "price_per_night": 2499.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "King Bed",
        "room_size": "340 sq ft",
        "description": "Executive Deluxe Room on 1st Floor with courtyard garden view.",
        "amenities": "High-Speed Wi-Fi, 43\" Smart TV, Central AC, 24/7 Room Service, Daily Housekeeping",
        "image_url": "/images/deluxe_room.jpg",
        "badge": None,
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 103,
        "name": "Room 103 - Executive Deluxe",
        "slug": "room-103-executive-deluxe",
        "room_type": "Deluxe",
        "price_per_night": 2499.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "King Bed",
        "room_size": "340 sq ft",
        "description": "Executive Deluxe Room with dedicated work desk and ambient lighting.",
        "amenities": "High-Speed Wi-Fi, 43\" Smart TV, Central AC, 24/7 Room Service, Daily Housekeeping",
        "image_url": "/images/deluxe_room.jpg",
        "badge": None,
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 104,
        "name": "Room 104 - Executive Deluxe",
        "slug": "room-104-executive-deluxe",
        "room_type": "Deluxe",
        "price_per_night": 2499.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "Twin Beds",
        "room_size": "340 sq ft",
        "description": "Executive Deluxe Room with twin beds, ideal for friends and pilgrim companions.",
        "amenities": "High-Speed Wi-Fi, 43\" Smart TV, Central AC, 24/7 Room Service, Daily Housekeeping",
        "image_url": "/images/deluxe_room.jpg",
        "badge": "Twin Beds",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 105,
        "name": "Room 105 - Executive Deluxe",
        "slug": "room-105-executive-deluxe",
        "room_type": "Deluxe",
        "price_per_night": 2499.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "King Bed",
        "room_size": "340 sq ft",
        "description": "Executive Deluxe Room with marble bathroom and rain shower.",
        "amenities": "High-Speed Wi-Fi, 43\" Smart TV, Central AC, 24/7 Room Service, Daily Housekeeping",
        "image_url": "/images/deluxe_room.jpg",
        "badge": None,
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 106,
        "name": "Room 106 - Executive Deluxe",
        "slug": "room-106-executive-deluxe",
        "room_type": "Deluxe",
        "price_per_night": 2499.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "King Bed",
        "room_size": "340 sq ft",
        "description": "Corner Executive Deluxe Room with extra quiet insulation.",
        "amenities": "High-Speed Wi-Fi, 43\" Smart TV, Central AC, 24/7 Room Service, Daily Housekeeping",
        "image_url": "/images/deluxe_room.jpg",
        "badge": None,
        "housekeeping_status": "Clean",
        "is_available": True
    },

    # 2nd Floor - Super Deluxe Family Rooms
    {
        "id": 201,
        "name": "Room 201 - Super Deluxe Family",
        "slug": "room-201-super-deluxe-family",
        "room_type": "Super Deluxe",
        "price_per_night": 3799.0,
        "capacity": 4,
        "total_inventory": 1,
        "bed_type": "Two Queen Beds",
        "room_size": "480 sq ft",
        "description": "Spacious family room with two queen beds, mini refrigerator, tea/coffee station, and temple darshan assistance.",
        "amenities": "High-Speed Wi-Fi, 50\" Smart TV, Mini Fridge, Central AC, 24/7 Room Service, Family Seating Lounge",
        "image_url": "/images/hero.jpg",
        "badge": "Family Favorite",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 202,
        "name": "Room 202 - Super Deluxe Family",
        "slug": "room-202-super-deluxe-family",
        "room_type": "Super Deluxe",
        "price_per_night": 3799.0,
        "capacity": 4,
        "total_inventory": 1,
        "bed_type": "Two Queen Beds",
        "room_size": "480 sq ft",
        "description": "Large family suite with dining table and double wardrobe for longer temple stays.",
        "amenities": "High-Speed Wi-Fi, 50\" Smart TV, Mini Fridge, Central AC, 24/7 Room Service, Family Seating Lounge",
        "image_url": "/images/hero.jpg",
        "badge": "Family Favorite",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 203,
        "name": "Room 203 - Super Deluxe Family",
        "slug": "room-203-super-deluxe-family",
        "room_type": "Super Deluxe",
        "price_per_night": 3799.0,
        "capacity": 4,
        "total_inventory": 1,
        "bed_type": "Two Queen Beds",
        "room_size": "480 sq ft",
        "description": "Super Deluxe Family Room with scenic city view and extra sofa bed.",
        "amenities": "High-Speed Wi-Fi, 50\" Smart TV, Mini Fridge, Central AC, 24/7 Room Service",
        "image_url": "/images/hero.jpg",
        "badge": None,
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 204,
        "name": "Room 204 - Super Deluxe Family",
        "slug": "room-204-super-deluxe-family",
        "room_type": "Super Deluxe",
        "price_per_night": 3799.0,
        "capacity": 4,
        "total_inventory": 1,
        "bed_type": "Two Queen Beds",
        "room_size": "480 sq ft",
        "description": "Corner family suite with natural sunlight and soundproofing.",
        "amenities": "High-Speed Wi-Fi, 50\" Smart TV, Mini Fridge, Central AC, 24/7 Room Service",
        "image_url": "/images/hero.jpg",
        "badge": None,
        "housekeeping_status": "Clean",
        "is_available": True
    },

    # 3rd Floor - Sai Presidential Suites
    {
        "id": 301,
        "name": "Room 301 - Sai Presidential Suite",
        "slug": "room-301-sai-presidential-suite",
        "room_type": "Suite",
        "price_per_night": 5999.0,
        "capacity": 4,
        "total_inventory": 1,
        "bed_type": "Master King + Living Lounge",
        "room_size": "720 sq ft",
        "description": "The pinnacle of divine luxury. Private master bedroom, separate luxurious living lounge, soaking bathtub, express check-in, and VIP darshan assistance.",
        "amenities": "High-Speed Wi-Fi, 55\" OLED Smart TV, Luxury Soaking Bathtub, Express Check-In, Complimentary Buffet Breakfast, 24/7 Butler on Call",
        "image_url": "/images/suite_room.jpg",
        "badge": "Luxury Suite",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 302,
        "name": "Room 302 - Sai Presidential Suite",
        "slug": "room-302-sai-presidential-suite",
        "room_type": "Suite",
        "price_per_night": 5999.0,
        "capacity": 4,
        "total_inventory": 1,
        "bed_type": "Master King + Living Lounge",
        "room_size": "720 sq ft",
        "description": "Top floor luxury suite with private balcony and panoramic view.",
        "amenities": "High-Speed Wi-Fi, 55\" OLED Smart TV, Luxury Soaking Bathtub, Express Check-In, Complimentary Buffet Breakfast, 24/7 Butler on Call",
        "image_url": "/images/suite_room.jpg",
        "badge": "Luxury Suite",
        "housekeeping_status": "Clean",
        "is_available": True
    }
]

def seed_database(reset: bool = False):
    print("==================================================")
    print("Hotel Sai Vasudev Residency - Database Seeder")
    print(f"Target Database: {engine.url}")
    print("==================================================")

    if reset:
        print("[!] Dropping existing database tables...")
        Base.metadata.drop_all(bind=engine)

    print("[*] Creating database tables if they do not exist...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # Check existing rooms
        existing_rooms = db.query(models.Room).all()
        existing_ids = {r.id for r in existing_rooms}
        print(f"[*] Found {len(existing_rooms)} existing rooms in database.")

        inserted_count = 0
        updated_count = 0

        for r_data in REAL_HOTEL_ROOMS:
            if r_data["id"] in existing_ids:
                room = db.query(models.Room).filter(models.Room.id == r_data["id"]).first()
                for k, v in r_data.items():
                    setattr(room, k, v)
                updated_count += 1
            else:
                room = models.Room(**r_data)
                db.add(room)
                inserted_count += 1

        db.commit()
        print(f"[+] Seeding complete: {inserted_count} rooms created, {updated_count} rooms synchronized.")
        print(f"[+] Active inventory: 12 real rooms (101-106 Deluxe, 201-204 Super Deluxe, 301-302 Suite).")
        print("[+] Ghost/dummy bookings: 0 (Clean operational state).")
        print("==================================================")

    except Exception as e:
        db.rollback()
        print(f"[X] Seeding failed with error: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    is_reset = "--reset" in sys.argv
    seed_database(reset=is_reset)
