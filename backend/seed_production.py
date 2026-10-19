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

        # Seed Dining Tables
        INITIAL_TABLES = [
            {"table_code": "T-1", "table_name": "Table T-1", "table_group": "General", "capacity": 4},
            {"table_code": "T-2", "table_name": "Table T-2", "table_group": "General", "capacity": 4},
            {"table_code": "T-3", "table_name": "Table T-3", "table_group": "General", "capacity": 4},
            {"table_code": "T-4", "table_name": "Table T-4", "table_group": "General", "capacity": 4},
            {"table_code": "T-5", "table_name": "Table T-5", "table_group": "General", "capacity": 6},
            {"table_code": "T-6", "table_name": "Table T-6", "table_group": "General", "capacity": 6},
            {"table_code": "T-7", "table_name": "Table T-7", "table_group": "General", "capacity": 2},
            {"table_code": "T-8", "table_name": "Table T-8", "table_group": "General", "capacity": 2},
            {"table_code": "T-9", "table_name": "Table T-9", "table_group": "General", "capacity": 8},
            {"table_code": "T-10", "table_name": "Table T-10", "table_group": "General", "capacity": 4},
            {"table_code": "A1", "table_name": "Table A1", "table_group": "TakeAway", "capacity": 2},
            {"table_code": "NC1", "table_name": "Table NC1", "table_group": "Nc", "capacity": 4},
            {"table_code": "S1", "table_name": "Table S1", "table_group": "SelfService", "capacity": 4},
        ]
        for t_data in INITIAL_TABLES:
            existing_tbl = db.query(models.DiningTable).filter(models.DiningTable.table_code == t_data["table_code"]).first()
            if not existing_tbl:
                db.add(models.DiningTable(**t_data, status="Vacant"))

        # Seed ERP Masters (GST, Business Sources, Lockers, Charges)
        import json
        INITIAL_MASTERS = [
            {"category": "gst", "code": "gst-1", "name": "GST 5%", "payload": {"sgst": 2.5, "cgst": 2.5, "igst": 5.0, "hsnNo": "996331"}},
            {"category": "gst", "code": "gst-2", "name": "GST 12%", "payload": {"sgst": 6.0, "cgst": 6.0, "igst": 12.0, "hsnNo": "996311"}},
            {"category": "gst", "code": "gst-3", "name": "GST 18%", "payload": {"sgst": 9.0, "cgst": 9.0, "igst": 18.0, "hsnNo": "996311"}},
            {"category": "gst", "code": "gst-4", "name": "GST 0%", "payload": {"sgst": 0.0, "cgst": 0.0, "igst": 0.0, "hsnNo": "996311"}},
            {"category": "business_source", "code": "bs-1", "name": "Direct Front Desk", "payload": {"remark": "Direct Walk-in"}},
            {"category": "business_source", "code": "bs-2", "name": "MakeMyTrip", "payload": {"remark": "Online OTA"}},
            {"category": "business_source", "code": "bs-3", "name": "OYO Rooms", "payload": {"remark": "Online Channel"}},
            {"category": "business_source", "code": "bs-4", "name": "Goibibo", "payload": {"remark": "Online OTA"}},
            {"category": "business_source", "code": "bs-5", "name": "Corporate Tie-Up", "payload": {"remark": "Contractual Billing"}},
            {"category": "locker", "code": "lok-101", "name": "Locker L-101", "payload": {"lockerNumber": "L-101", "keyNumber": "KEY-101", "location": "Front Desk Vault", "status": "Available", "dailyRent": 50}},
            {"category": "locker", "code": "lok-102", "name": "Locker L-102", "payload": {"lockerNumber": "L-102", "keyNumber": "KEY-102", "location": "Front Desk Vault", "status": "Available", "dailyRent": 50}},
            {"category": "other_charge", "code": "chg-1", "name": "Extra Mattress & Linen", "payload": {"chargeName": "Extra Mattress & Linen", "defaultRate": 500, "gstRate": 12, "hsnCode": "996311"}},
            {"category": "other_charge", "code": "chg-2", "name": "Late Checkout Fee (2 Hours)", "payload": {"chargeName": "Late Checkout Fee (2 Hours)", "defaultRate": 300, "gstRate": 12, "hsnCode": "996311"}},
            {"category": "other_charge", "code": "chg-3", "name": "Laundry Express Service", "payload": {"chargeName": "Laundry Express Service", "defaultRate": 120, "gstRate": 18, "hsnCode": "999711"}}
        ]
        for m_data in INITIAL_MASTERS:
            existing_m = db.query(models.MasterItem).filter(models.MasterItem.code == m_data["code"]).first()
            if not existing_m:
                db.add(models.MasterItem(
                    category=m_data["category"],
                    code=m_data["code"],
                    name=m_data["name"],
                    payload_json=json.dumps(m_data["payload"])
                ))

        db.commit()
        print(f"[+] Seeding complete: {inserted_count} rooms created, {updated_count} rooms synchronized.")
        print(f"[+] Active inventory: 12 real rooms (101-106 Deluxe, 201-204 Super Deluxe, 301-302 Suite).")
        print(f"[+] Active dining tables: 13 tables seeded.")
        print(f"[+] Active ERP masters: {len(INITIAL_MASTERS)} master configurations seeded.")
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
