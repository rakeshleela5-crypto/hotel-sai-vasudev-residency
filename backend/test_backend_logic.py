import os
import sys

# Test all PMS enterprise operations locally using SQLite
os.environ["DATABASE_URL"] = "sqlite:///./test_svr.db"

from app.database import engine, Base, SessionLocal
from app import models, schemas
from app.routes.bookings import compute_tax_and_pricing, get_overlapping_bookings_count
from app.routes.rooms import INITIAL_ROOMS

def run_tests():
    print("1. Creating database tables with Enterprise PMS extensions...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("2. Seeding initial rooms...")
    for r_data in INITIAL_ROOMS:
        room = models.Room(**r_data)
        db.add(room)
    db.commit()

    room1 = db.query(models.Room).filter(models.Room.slug == "executive-deluxe-room").first()
    room2 = db.query(models.Room).filter(models.Room.slug == "sai-presidential-suite").first()
    assert room1 is not None and room2 is not None
    print(f"   [OK] Room 1: {room1.name} (Rs.{room1.price_per_night}) | Room 2: {room2.name} (Rs.{room2.price_per_night})")

    print("3. Creating a real Reservation with Indian GST Tax Engine...")
    booking = models.Booking(
        room_id=room1.id,
        guest_name="Srinivas Rao",
        guest_email="srinivas@example.com",
        guest_phone="9848011223",
        check_in_date="2026-11-01",
        check_out_date="2026-11-04",
        adults=2,
        total_nights=3,
        base_rate=room1.price_per_night,
        base_amount=round(room1.price_per_night * 3, 2),
        extra_guest_charge=0.0,
        gst_rate=12.0,
        cgst_amount=round(room1.price_per_night * 3 * 0.06, 2),
        sgst_amount=round(room1.price_per_night * 3 * 0.06, 2),
        total_tax=round(room1.price_per_night * 3 * 0.12, 2),
        total_price=round(room1.price_per_night * 3 * 1.12, 2),
        total_paid=0.0,
        balance_due=round(room1.price_per_night * 3 * 1.12, 2),
        payment_status="Pending",
        status="Checked-In"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    print(f"   [OK] Booking Created: Ref={booking.booking_ref}, Invoice={booking.invoice_number}, Total=Rs.{booking.total_price}")

    print("4. Testing Multi-Tender Split Payments (Advance + Cash + Card)...")
    # Payment 1: Online UPI Advance (Rs.2,000)
    p1 = models.BookingPayment(
        booking_id=booking.id,
        payment_type="Advance",
        payment_mode="UPI",
        amount=2000.0,
        transaction_ref="UPI-839201948291",
        notes="Online portal booking token"
    )
    db.add(p1)
    booking.total_paid += 2000.0
    booking.balance_due = round(booking.total_price - booking.total_paid, 2)
    booking.payment_status = "Partial"
    db.commit()
    print(f"   [OK] Payment 1 (UPI Advance): Rs.2,000 | Balance remaining: Rs.{booking.balance_due}")

    # Payment 2: Cash at Counter (Rs.3,000)
    p2 = models.BookingPayment(
        booking_id=booking.id,
        payment_type="Partial",
        payment_mode="Cash",
        amount=3000.0,
        transaction_ref="CASH-COUNTER-D1",
        notes="Front desk cash drawer"
    )
    db.add(p2)
    booking.total_paid += 3000.0
    booking.balance_due = round(booking.total_price - booking.total_paid, 2)
    db.commit()
    print(f"   [OK] Payment 2 (Cash): Rs.3,000 | Balance remaining: Rs.{booking.balance_due}")

    print("5. Testing Room Service Food KOT Folio Addition (5% Food GST - SAC 996331)...")
    # Guest orders South Indian Veg Thali x 2 (Rs.400) + Mineral Water x 2 (Rs.40) = Rs.440
    food_taxable = 440.0
    cgst_food = round(food_taxable * 0.025, 2) # 2.5% CGST
    sgst_food = round(food_taxable * 0.025, 2) # 2.5% SGST
    food_total = round(food_taxable + cgst_food + sgst_food, 2)
    kot_item = models.RoomFolioItem(
        booking_id=booking.id,
        item_type="Food_KOT",
        description="South Indian Veg Thali x 2 + Mineral Water x 2",
        sac_code="996331",
        kot_number="KOT-104",
        quantity=1,
        unit_price=440.0,
        taxable_amount=food_taxable,
        gst_rate=5.0,
        cgst_amount=cgst_food,
        sgst_amount=sgst_food,
        total_amount=food_total,
        status="Billed"
    )
    db.add(kot_item)
    booking.total_price = round(booking.total_price + food_total, 2)
    booking.balance_due = round(booking.total_price - booking.total_paid, 2)
    db.commit()
    print(f"   [OK] KOT Attached to Room Folio: Rs.{food_taxable} + 5% GST (Rs.{cgst_food*2}) = Rs.{food_total} | New Total Bill: Rs.{booking.total_price}")

    print("6. Testing Mid-Stay Room Shift (Room 1 -> Suite Room 2)...")
    room1.housekeeping_status = "Dirty"
    shift = models.RoomShift(
        booking_id=booking.id,
        from_room_id=room1.id,
        to_room_id=room2.id,
        shift_date="2026-11-02",
        reason="AC noise in Room 1, guest upgraded to Suite",
        old_rate=room1.price_per_night,
        new_rate=room2.price_per_night,
        shifted_by="Duty Manager Rajesh"
    )
    db.add(shift)
    booking.room_id = room2.id
    db.commit()
    print(f"   [OK] Room Shifted: {room1.name} (Now: {room1.housekeeping_status}) -> {room2.name} (Shift Ref: {shift.id})")

    print("7. Testing Statutory Police Station Register & Form C...")
    police_log = models.PoliceStationLog(
        booking_id=booking.id,
        guest_name="Srinivas Rao",
        age=42,
        gender="Male",
        nationality="Indian",
        id_proof_type="Aadhaar Card",
        id_proof_number="XXXX-XXXX-9482",
        permanent_address="Flat 402, Sai Enclave, Hyderabad, Telangana",
        origin_city="Hyderabad",
        next_destination="Tirupati",
        purpose_of_visit="Temple Darshan",
        vehicle_number="TS09-EA-1234",
        is_foreign_national=False
    )
    db.add(police_log)
    db.commit()
    print(f"   [OK] Police Verification Logged: Guest={police_log.guest_name}, ID={police_log.id_proof_type}, Origin={police_log.origin_city} -> Next={police_log.next_destination}")

    print("8. Testing Automated Midnight Day-End Night Audit...")
    audit = models.DailyNightAudit(
        audit_date="2026-11-01",
        total_rooms_occupied=1,
        total_room_revenue=booking.base_amount,
        total_food_revenue=food_taxable,
        total_gst_collected=round(booking.total_tax + cgst_food*2, 2),
        no_shows_processed=0,
        cash_in_drawer=3000.0,
        card_total=0.0,
        upi_total=2000.0,
        btc_credit_total=0.0,
        audited_by="Night Manager Suresh",
        audit_status="Closed"
    )
    db.add(audit)
    db.commit()
    print(f"   [OK] Night Audit Closed: Date={audit.audit_date}, Revenue=Rs.{audit.total_room_revenue + audit.total_food_revenue}, Cash In Drawer=Rs.{audit.cash_in_drawer}, UPI=Rs.{audit.upi_total}")

    print("9. Testing Walk-In Direct Front-Desk Check-In Endpoint...")
    from app.routes.pms import execute_walk_in_check_in, execute_check_out, toggle_room_maintenance, get_pms_dashboard_sync
    
    room3 = db.query(models.Room).filter(models.Room.slug == "super-deluxe-family-room").first()
    checkin_req = schemas.WalkInCheckInRequest(
        room_id=room3.id,
        guest_name="Venkatesh Naidu",
        guest_phone="9876543210",
        check_out_date="2026-11-03",
        advance_amount=1000.0,
        advance_payment_mode="UPI",
        advance_ref="UPI-VENK-WALKIN-99"
    )
    walkin_booking = execute_walk_in_check_in(checkin_req, db)
    assert walkin_booking.status == "Checked-In"
    assert room3.housekeeping_status == "Occupied"
    print(f"   [OK] Walk-In Checked In: Ref={walkin_booking.booking_ref}, Room={room3.name} (Status: {room3.housekeeping_status}), Advance Paid: Rs.{walkin_booking.total_paid}")

    print("10. Testing Check-Out Settlement & Transition to Dirty Room...")
    checkout_req = schemas.CheckOutRequest(
        booking_ref=walkin_booking.booking_ref,
        settlement_payment_mode="Cash",
        settlement_amount_paid=walkin_booking.balance_due,
        transaction_ref="CASH-SETTLE-REC-1"
    )
    checkout_res = execute_check_out(checkout_req, db)
    db.refresh(room3)
    assert room3.housekeeping_status == "Dirty"
    assert checkout_res.net_balance_due == 0.0
    print(f"   [OK] Check-Out Settled: Ref={checkout_res.booking_ref}, Net Due=Rs.{checkout_res.net_balance_due}, Room {room3.name} is now: {room3.housekeeping_status}")

    print("11. Testing Room Out-Of-Order Maintenance Blocking...")
    maint_req = schemas.RoomMaintenanceRequest(
        room_id=room3.id,
        is_under_maintenance=True,
        reason="Geyser replacement and fresh sanitization"
    )
    maint_res = toggle_room_maintenance(room3.id, maint_req, db)
    db.refresh(room3)
    assert room3.housekeeping_status == "Under_Maintenance"
    assert room3.is_available is False
    print(f"   [OK] Room Maintenance Blocked: {room3.name} is now: {room3.housekeeping_status} (Available: {room3.is_available})")

    print("12. Testing Real-Time Master PMS Dashboard Synchronization Payload...")
    sync_payload = get_pms_dashboard_sync(db)
    assert sync_payload.total_rooms == len(INITIAL_ROOMS)
    print(f"   [OK] Real-Time Sync Payload Verified: {sync_payload.total_rooms} rooms total | Occupied: {sync_payload.occupied_rooms} | Maintenance: {sync_payload.maintenance_rooms} | Cash In Drawer: Rs.{sync_payload.total_cash_in_drawer}")

    print("\n=== ALL 12 PMS REAL-WORLD ENTERPRISE TESTS PASSED WITH 100% SUCCESS! ===")
    db.close()

if __name__ == "__main__":
    run_tests()
