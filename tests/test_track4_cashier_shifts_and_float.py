import datetime
import uuid
import json
import pytest
from sqlalchemy.orm import Session

from app import models, schemas
from app.routes.pms import (
    save_shift_handover,
    get_shift_handovers,
    get_shift_handover_current_metrics
)

def test_shift_metrics_time_window_filtering_eliminates_lifetime_accumulation(db: Session):
    """
    Track 4 Fix Verification:
    Prior to fix, get_shift_handover_current_metrics queried BookingPayment.all()
    and summed the hotel's entire lifetime collections into the morning drawer!
    Now it filters strictly from the cutoff of the last closed shift handover.
    """
    uid = uuid.uuid4().hex[:6].upper()

    # Room fixture
    room = models.Room(
        name=f"Room SFT-{uid}",
        slug=f"room-sft-{uid.lower()}",
        room_type="Deluxe",
        price_per_night=2000.0,
        description="Shift test room",
        image_url="/img/r.jpg",
        housekeeping_status="Clean",
        is_available=True
    )
    db.add(room)
    db.commit()

    # 1. Shift 1 (Morning Shift): Collects payment 1 (Cash ₹5,000)
    b1 = models.Booking(
        booking_ref=f"BK-SFT1-{uid}",
        invoice_number=f"INV-SFT1-{uid}",
        room_id=room.id,
        guest_name="Shift 1 Guest",
        guest_email="s1@test.com",
        guest_phone="9876543201",
        check_in_date=datetime.date.today().isoformat(),
        check_out_date=(datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
        total_price=5000.0,
        status="Checked-In"
    )
    db.add(b1)
    db.commit()

    p1 = models.BookingPayment(
        booking_id=b1.id,
        payment_type="Advance",
        payment_mode="Cash",
        amount=5000.0,
        collected_by="Shift 1 Cashier"
    )
    db.add(p1)
    db.commit()

    # 2. Shift 1 closes with formal Shift Handover at Net Physical Cash = ₹10,000 (Float 5000 + 5000 collected)
    s1_id = f"SHIFT/{datetime.date.today().strftime('%Y%m%d')}/S1-{uid}"
    s1_payload = schemas.ShiftHandoverCreate(
        shift_id=s1_id,
        shift_date=datetime.date.today().isoformat(),
        shift_time="07:00 AM - 03:00 PM",
        shift_type="Morning",
        user_email=f"cashier1_{uid}@sai-vasudev.com",
        user_name="Morning Cashier",
        opening_drawer_cash=5000.0,
        room_cash_collected=5000.0,
        food_cash_collected=0.0,
        advance_cash_collected=0.0,
        expenses_paid_from_drawer=0.0,
        net_physical_cash_in_drawer=10000.0,
        handover_to_user="Evening Cashier",
        status="Verified & Closed"
    )
    save_shift_handover(s1_payload, db=db)

    # 3. Shift 2 (Evening Shift): Collects room cash ₹1,500, food cash ₹450, and pays petty cash ₹200
    room2 = models.Room(
        name=f"Room SFT2-{uid}",
        slug=f"room-sft2-{uid.lower()}",
        room_type="Deluxe",
        price_per_night=2000.0,
        description="Shift 2 test room",
        image_url="/img/r2.jpg",
        housekeeping_status="Clean",
        is_available=True
    )
    db.add(room2)
    db.commit()

    b2 = models.Booking(
        booking_ref=f"BK-SFT2-{uid}",
        invoice_number=f"INV-SFT2-{uid}",
        room_id=room2.id,
        guest_name="Shift 2 Guest",
        guest_email="s2@test.com",
        guest_phone="9876543202",
        check_in_date=datetime.date.today().isoformat(),
        check_out_date=(datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
        total_price=1500.0,
        status="Checked-In"
    )
    db.add(b2)
    db.commit()

    p2 = models.BookingPayment(
        booking_id=b2.id,
        payment_type="Advance",
        payment_mode="Cash",
        amount=1500.0,
        collected_by="Shift 2 Cashier"
    )
    db.add(p2)

    fb2 = models.FoodBill(
        bill_no=f"FB-SFT2-{uid}",
        date=datetime.date.today().isoformat(),
        time="07:30 PM",
        net_bill_amount=450.0,
        settlement_type="Cash",
        billed_by="Shift 2 Cashier",
        status="Settled"
    )
    db.add(fb2)

    pe2 = models.PettyExpense(
        expense_no=f"EXP-SFT2-{uid}",
        date=datetime.date.today().isoformat(),
        category="Emergency Linen Laundry",
        amount=200.0,
        payment_mode="Cash",
        paid_to="Dhobi Services"
    )
    db.add(pe2)
    db.commit()

    # Fetch live metrics for Shift 2
    metrics = get_shift_handover_current_metrics(db=db)

    # VERIFY CASH CONTINUITY & FILTERING:
    # 1. Opening float must equal Shift 1's closing net cash (₹10,000.00)
    assert metrics["openingDrawerCash"] == 10000.0
    # 2. Room cash collected must be ₹1,500.00 (Shift 1's ₹5,000 is excluded!)
    assert metrics["roomCashCollected"] == 1500.0
    # 3. Food cash collected is ₹450.00
    assert metrics["foodCashCollected"] == 450.0
    # 4. Expenses paid is ₹200.00
    assert metrics["expensesPaidFromDrawer"] == 200.0
    # 5. Expected drawer cash = 10,000 + 1,500 + 450 - 200 = ₹11,750.00
    assert metrics["expectedDrawerCash"] == 11750.0


def test_shift_handover_cash_variance_auditing(db: Session):
    """
    Track 4 Fix Verification:
    When a cashier completes shift handover and enters counted cash that differs
    from ledger expected cash, a cash variance (shortage/overage) is flagged and audited.
    """
    uid = uuid.uuid4().hex[:6].upper()
    shift_id = f"SHIFT/{datetime.date.today().strftime('%Y%m%d')}/VAR-{uid}"

    # Cashier reports: Opening ₹5000, Room ₹2000, Food ₹500, Expenses ₹100
    # Expected cash: 5000 + 2000 + 500 - 100 = ₹7400.00
    # But cashier counted ₹7350.00 (₹50 shortage!)
    payload = schemas.ShiftHandoverCreate(
        shift_id=shift_id,
        shift_date=datetime.date.today().isoformat(),
        shift_time="07:00 AM - 03:00 PM",
        shift_type="Morning",
        user_email=f"cashier_{uid}@sai-vasudev.com",
        user_name="Cashier Ramesh",
        opening_drawer_cash=5000.0,
        room_cash_collected=2000.0,
        food_cash_collected=500.0,
        advance_cash_collected=0.0,
        expenses_paid_from_drawer=100.0,
        net_physical_cash_in_drawer=7350.0,  # ₹50 shortage
        handover_to_user="Evening Cashier Ganesh",
        handover_notes="Minor ₹50 coin shortage noted at end of morning rush",
        status="Verified & Closed"
    )

    res = save_shift_handover(payload, db=db)
    assert res["success"] is True
    assert res["expectedDrawerCash"] == 7400.0
    assert res["netPhysicalCashInDrawer"] == 7350.0
    assert res["cashVariance"] == -50.0
    assert res["hasVariance"] is True

    # Verify audit log was recorded for SHIFT_CASH_VARIANCE
    audit = db.query(models.AuditLog).filter(
        models.AuditLog.action == "SHIFT_CASH_VARIANCE",
        models.AuditLog.entity_id == shift_id
    ).first()
    assert audit is not None
    data = json.loads(audit.new_data) if isinstance(audit.new_data, str) else audit.new_data
    assert data["variance_type"] == "SHORTAGE"
    assert data["variance"] == -50.0


def test_shift_handover_drawer_continuity_across_consecutive_shifts(db: Session):
    """
    Track 4 Fix Verification:
    Shift 1 closes with ₹8,500.
    Shift 2 immediately starts with openingDrawerCash = ₹8,500.
    """
    uid = uuid.uuid4().hex[:6].upper()
    shift1_id = f"SHIFT/{datetime.date.today().strftime('%Y%m%d')}/CONT-{uid}"

    shift1 = models.ShiftHandover(
        shift_id=shift1_id,
        shift_date=datetime.date.today().isoformat(),
        shift_time="07:00 AM - 03:00 PM",
        user_email=f"morn_{uid}@sai-vasudev.com",
        user_name="Morning Incharge",
        shift_type="Morning",
        opening_drawer_cash=5000.0,
        net_physical_cash_in_drawer=8500.0,
        status="Verified & Closed"
    )
    db.add(shift1)
    db.commit()

    # Incoming shift requests metrics
    next_metrics = get_shift_handover_current_metrics(db=db)
    assert next_metrics["openingDrawerCash"] == 8500.0
    assert "CONT-" in next_metrics["previousShiftInfo"]
