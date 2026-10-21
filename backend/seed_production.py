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
    # Ground Floor (Rooms 101 - 107)
    {
        "id": 101,
        "name": "Room 101 - Deluxe (Single)",
        "slug": "room-101-deluxe-single",
        "room_type": "Deluxe",
        "price_per_night": 1500.0,
        "capacity": 1,
        "total_inventory": 1,
        "bed_type": "Single Bed",
        "room_size": "220 sq ft",
        "description": "Ground floor single deluxe room offering peaceful stay, 24/7 hot water, high-speed Wi-Fi, and flat-screen TV.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker",
        "image_url": "/images/deluxe_room.jpg",
        "badge": "Single Occupancy",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 102,
        "name": "Room 102 - Deluxe (Single)",
        "slug": "room-102-deluxe-single",
        "room_type": "Deluxe",
        "price_per_night": 1500.0,
        "capacity": 1,
        "total_inventory": 1,
        "bed_type": "Single Bed",
        "room_size": "220 sq ft",
        "description": "Ground floor single deluxe room ideal for solo travelers and pilgrims.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker",
        "image_url": "/images/deluxe_room.jpg",
        "badge": "Single Occupancy",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 103,
        "name": "Room 103 - Classic Studio",
        "slug": "room-103-classic-studio",
        "room_type": "Classic Studio",
        "price_per_night": 2000.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "Queen Bed",
        "room_size": "280 sq ft",
        "description": "Spacious ground floor classic studio room with queen bed, flat-screen TV, and tea/coffee maker.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker",
        "image_url": "/images/hero.jpg",
        "badge": "Popular",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 104,
        "name": "Room 104 - Classic Studio",
        "slug": "room-104-classic-studio",
        "room_type": "Classic Studio",
        "price_per_night": 2000.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "Queen Bed",
        "room_size": "280 sq ft",
        "description": "Ground floor classic studio with comfortable queen bed and 24/7 hot water.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker",
        "image_url": "/images/hero.jpg",
        "badge": "Popular",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 105,
        "name": "Room 105 - Classic Studio",
        "slug": "room-105-classic-studio",
        "room_type": "Classic Studio",
        "price_per_night": 2000.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "Queen Bed",
        "room_size": "280 sq ft",
        "description": "Ground floor classic studio room for couples and pilgrims.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker",
        "image_url": "/images/hero.jpg",
        "badge": "Popular",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 106,
        "name": "Room 106 - Executive",
        "slug": "room-106-executive",
        "room_type": "Executive",
        "price_per_night": 2500.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "King Bed",
        "room_size": "340 sq ft",
        "description": "Ground floor executive room with dedicated work desk, mini fridge, and upgraded amenities.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker, Mini Fridge, Work Desk & Ergonomic Chair, Complimentary Premium Toiletries, Daily Newspaper",
        "image_url": "/images/suite_room.jpg",
        "badge": "Executive Choice",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 107,
        "name": "Room 107 - Executive",
        "slug": "room-107-executive",
        "room_type": "Executive",
        "price_per_night": 2500.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "King Bed",
        "room_size": "340 sq ft",
        "description": "Ground floor executive room with premium mattress, work desk, and mini fridge.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker, Mini Fridge, Work Desk & Ergonomic Chair, Complimentary Premium Toiletries, Daily Newspaper",
        "image_url": "/images/suite_room.jpg",
        "badge": "Executive Choice",
        "housekeeping_status": "Clean",
        "is_available": True
    },

    # 1st Floor (Rooms 201 - 211)
    {
        "id": 201,
        "name": "Room 201 - Executive",
        "slug": "room-201-executive",
        "room_type": "Executive",
        "price_per_night": 2500.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "King Bed",
        "room_size": "340 sq ft",
        "description": "1st floor executive room with panoramic views, work desk, and mini fridge.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker, Mini Fridge, Work Desk & Ergonomic Chair, Complimentary Premium Toiletries, Daily Newspaper",
        "image_url": "/images/suite_room.jpg",
        "badge": "Executive Choice",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 202,
        "name": "Room 202 - Deluxe (Single)",
        "slug": "room-202-deluxe-single",
        "room_type": "Deluxe",
        "price_per_night": 1500.0,
        "capacity": 1,
        "total_inventory": 1,
        "bed_type": "Single Bed",
        "room_size": "220 sq ft",
        "description": "1st floor single deluxe room offering divine tranquility for solo travelers.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker",
        "image_url": "/images/deluxe_room.jpg",
        "badge": "Single Occupancy",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 203,
        "name": "Room 203 - Classic Studio",
        "slug": "room-203-classic-studio",
        "room_type": "Classic Studio",
        "price_per_night": 2000.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "Queen Bed",
        "room_size": "280 sq ft",
        "description": "1st floor classic studio room with queen bed and modern amenities.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker",
        "image_url": "/images/hero.jpg",
        "badge": "Popular",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 204,
        "name": "Room 204 - Classic Studio",
        "slug": "room-204-classic-studio",
        "room_type": "Classic Studio",
        "price_per_night": 2000.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "Queen Bed",
        "room_size": "280 sq ft",
        "description": "1st floor classic studio room with peaceful courtyard orientation.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker",
        "image_url": "/images/hero.jpg",
        "badge": "Popular",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 205,
        "name": "Room 205 - Classic Studio",
        "slug": "room-205-classic-studio",
        "room_type": "Classic Studio",
        "price_per_night": 2000.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "Queen Bed",
        "room_size": "280 sq ft",
        "description": "1st floor classic studio room featuring comfortable queen bed and high-speed Wi-Fi.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker",
        "image_url": "/images/hero.jpg",
        "badge": "Popular",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 206,
        "name": "Room 206 - Executive",
        "slug": "room-206-executive",
        "room_type": "Executive",
        "price_per_night": 2500.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "King Bed",
        "room_size": "340 sq ft",
        "description": "1st floor executive room with work desk, mini fridge, and plush seating.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker, Mini Fridge, Work Desk & Ergonomic Chair, Complimentary Premium Toiletries, Daily Newspaper",
        "image_url": "/images/suite_room.jpg",
        "badge": "Executive Choice",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 207,
        "name": "Room 207 - Executive",
        "slug": "room-207-executive",
        "room_type": "Executive",
        "price_per_night": 2500.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "King Bed",
        "room_size": "340 sq ft",
        "description": "1st floor executive room with warm ambient cove lighting and soundproofing.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker, Mini Fridge, Work Desk & Ergonomic Chair, Complimentary Premium Toiletries, Daily Newspaper",
        "image_url": "/images/suite_room.jpg",
        "badge": "Executive Choice",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 208,
        "name": "Room 208 - Executive",
        "slug": "room-208-executive",
        "room_type": "Executive",
        "price_per_night": 2500.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "King Bed",
        "room_size": "340 sq ft",
        "description": "1st floor executive room with spacious bathroom and premium amenities.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker, Mini Fridge, Work Desk & Ergonomic Chair, Complimentary Premium Toiletries, Daily Newspaper",
        "image_url": "/images/suite_room.jpg",
        "badge": "Executive Choice",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 209,
        "name": "Room 209 - Executive",
        "slug": "room-209-executive",
        "room_type": "Executive",
        "price_per_night": 2500.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "King Bed",
        "room_size": "340 sq ft",
        "description": "1st floor executive room with dedicated work desk and tea/coffee station.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker, Mini Fridge, Work Desk & Ergonomic Chair, Complimentary Premium Toiletries, Daily Newspaper",
        "image_url": "/images/suite_room.jpg",
        "badge": "Executive Choice",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 210,
        "name": "Room 210 - Premium",
        "slug": "room-210-premium",
        "room_type": "Premium",
        "price_per_night": 3000.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "King Bed",
        "room_size": "400 sq ft",
        "description": "Top-tier premium sanctuary on 1st floor offering generous space, work desk, mini fridge, and VIP darshan assistance.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker, Mini Fridge, Work Desk & Ergonomic Chair, Complimentary Premium Toiletries, Daily Newspaper",
        "image_url": "/images/restaurant.jpg",
        "badge": "Premium Luxury",
        "housekeeping_status": "Clean",
        "is_available": True
    },
    {
        "id": 211,
        "name": "Room 211 - Premium",
        "slug": "room-211-premium",
        "room_type": "Premium",
        "price_per_night": 3000.0,
        "capacity": 2,
        "total_inventory": 1,
        "bed_type": "King Bed",
        "room_size": "400 sq ft",
        "description": "Top-tier premium sanctuary on 1st floor with luxury amenities, work desk, and mini fridge.",
        "amenities": "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Electric Kettle / Coffee Maker, Mini Fridge, Work Desk & Ergonomic Chair, Complimentary Premium Toiletries, Daily Newspaper",
        "image_url": "/images/restaurant.jpg",
        "badge": "Premium Luxury",
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
        print(f"[+] Active inventory: 18 real rooms (Ground Floor: 101-107, 1st Floor: 201-211).")
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
