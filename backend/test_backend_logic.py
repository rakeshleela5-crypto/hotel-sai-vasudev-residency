import os
import sys

# Test the backend business logic and database constraints locally using SQLite
os.environ["DATABASE_URL"] = "sqlite:///./test_svr.db"

from app.database import engine, Base, SessionLocal
from app import models, schemas
from app.routes.bookings import compute_tax_and_pricing, get_overlapping_bookings_count
from app.routes.rooms import INITIAL_ROOMS

def run_tests():
    print("1. Creating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("2. Seeding initial rooms...")
    for r_data in INITIAL_ROOMS:
        room = models.Room(**r_data)
        db.add(room)
    db.commit()

    room = db.query(models.Room).filter(models.Room.slug == "executive-deluxe-room").first()
    assert room is not None, "Executive Deluxe Room should exist"
    print(f"   [OK] Room found: {room.name}, Rate: Rs.{room.price_per_night}, Capacity: {room.capacity}, Inventory: {room.total_inventory}")

    print("3. Testing Indian GST Tax Engine...")
    # 2 nights, 2 adults
    pricing_standard = compute_tax_and_pricing(room, nights=2, adults=2)
    assert pricing_standard["base_amount"] == 4998.0
    assert pricing_standard["gst_rate"] == 12.0
    assert pricing_standard["cgst_amount"] == 299.88
    assert pricing_standard["sgst_amount"] == 299.88
    assert pricing_standard["grand_total"] == 5597.76
    print(f"   [OK] Standard GST (12%): Base Rs.{pricing_standard['base_amount']} + CGST Rs.{pricing_standard['cgst_amount']} + SGST Rs.{pricing_standard['sgst_amount']} = Grand Total Rs.{pricing_standard['grand_total']}")

    # 1 night with extra guest (3 adults for 2-capacity room) -> Rs.500 extra
    pricing_extra = compute_tax_and_pricing(room, nights=1, adults=3)
    assert pricing_extra["extra_guest_charge"] == 500.0
    assert pricing_extra["taxable_value"] == 2999.0
    print(f"   [OK] Extra guest calculation: Base Rs.{pricing_extra['base_amount']} + Extra Rs.{pricing_extra['extra_guest_charge']} = Taxable Rs.{pricing_extra['taxable_value']}")

    print("4. Testing Concurrency & Double Booking Prevention...")
    # Create booking for dates 2026-11-10 to 2026-11-12
    booking1 = models.Booking(
        room_id=room.id,
        guest_name="Ramesh Kumar",
        guest_email="ramesh@example.com",
        guest_phone="9876543210",
        check_in_date="2026-11-10",
        check_out_date="2026-11-12",
        adults=2,
        total_nights=2,
        base_rate=room.price_per_night,
        base_amount=4998.0,
        extra_guest_charge=0.0,
        gst_rate=12.0,
        cgst_amount=299.88,
        sgst_amount=299.88,
        total_tax=599.76,
        total_price=5597.76,
        payment_method="UPI",
        status="Confirmed"
    )
    db.add(booking1)
    db.commit()
    db.refresh(booking1)
    print(f"   [OK] Created Booking 1: Ref={booking1.booking_ref}, Invoice={booking1.invoice_number}")

    # Check overlapping counts:
    # A) Overlapping range (2026-11-11 to 2026-11-13)
    overlap_count = get_overlapping_bookings_count(db, room.id, "2026-11-11", "2026-11-13")
    assert overlap_count == 1, f"Expected 1 overlap, got {overlap_count}"
    print(f"   [OK] Overlap detection correctly counted: {overlap_count} active booking")

    # B) Non-overlapping range (2026-11-13 to 2026-11-15)
    non_overlap_count = get_overlapping_bookings_count(db, room.id, "2026-11-13", "2026-11-15")
    assert non_overlap_count == 0, f"Expected 0 overlap, got {non_overlap_count}"
    print(f"   [OK] Non-overlapping date range verified clean: {non_overlap_count} conflicts")

    print("\n=== ALL PRODUCTION BACKEND TESTS PASSED SUCCESSFULLY! ===")
    db.close()

if __name__ == "__main__":
    run_tests()
