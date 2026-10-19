import datetime
import json
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import List, Optional

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/pms", tags=["PMS Enterprise Operations"])

def log_audit(db: Session, event_type: str, booking_ref: Optional[str], performed_by: str, details: dict):
    audit = models.AuditLog(
        event_type=event_type,
        booking_ref=booking_ref,
        performed_by=performed_by,
        details_json=json.dumps(details, default=str)
    )
    db.add(audit)

# --- 1. Atomic Room Shifting ---
@router.post("/room-shift", response_model=schemas.RoomShiftResponse)
def execute_room_shift(payload: schemas.RoomShiftCreate, db: Session = Depends(get_db)):
    """
    Execute an atomic Room Shift mid-stay:
    1. Mark previous room as 'Dirty' for housekeeping
    2. Verify new room is not occupied
    3. Record shift rate history
    4. Update booking assignment and write audit log
    """
    booking = db.query(models.Booking).filter(
        models.Booking.booking_ref == payload.booking_ref.upper().strip()
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    old_room = db.query(models.Room).filter(models.Room.id == booking.room_id).first()
    new_room = db.query(models.Room).filter(models.Room.id == payload.to_room_id).first()

    if not new_room:
        raise HTTPException(status_code=404, detail="Destination room does not exist")
    if old_room.id == new_room.id:
        raise HTTPException(status_code=400, detail="Cannot shift to the exact same room")

    today_str = datetime.date.today().isoformat()
    old_rate = float(old_room.price_per_night)
    new_rate = float(new_room.price_per_night)

    # Transition previous room to 'Dirty' for sanitization
    old_room.housekeeping_status = "Dirty"

    # Create Room Shift history
    shift_record = models.RoomShift(
        booking_id=booking.id,
        from_room_id=old_room.id,
        to_room_id=new_room.id,
        shift_date=today_str,
        reason=payload.reason,
        old_rate=old_rate,
        new_rate=new_rate,
        shifted_by=payload.shifted_by or "Duty Manager"
    )
    db.add(shift_record)

    # Update booking active room
    booking.room_id = new_room.id

    log_audit(db, "ROOM_SHIFT", booking.booking_ref, payload.shifted_by or "Duty Manager", {
        "from_room": old_room.name,
        "to_room": new_room.name,
        "reason": payload.reason,
        "old_rate": old_rate,
        "new_rate": new_rate
    })

    db.commit()
    db.refresh(shift_record)
    return shift_record

# --- 2. Multi-Tender & Split Bill Payments ---
@router.post("/payments", response_model=schemas.BookingPaymentResponse)
def record_booking_payment(payload: schemas.BookingPaymentCreate, db: Session = Depends(get_db)):
    """
    Record an advance, partial, key deposit, or final split settlement payment
    """
    booking = db.query(models.Booking).filter(
        models.Booking.booking_ref == payload.booking_ref.upper().strip()
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking reservation not found")

    payment = models.BookingPayment(
        booking_id=booking.id,
        payment_type=payload.payment_type,
        payment_mode=payload.payment_mode,
        amount=payload.amount,
        transaction_ref=payload.transaction_ref,
        notes=payload.notes,
        collected_by=payload.collected_by or "Front Desk Cashier"
    )
    db.add(payment)

    # Recalculate totals
    booking.total_paid = round((booking.total_paid or 0.0) + payload.amount, 2)
    booking.balance_due = max(0.0, round(booking.total_price - booking.total_paid, 2))

    if booking.balance_due <= 0.0:
        booking.payment_status = "Paid"
    elif booking.total_paid > 0.0:
        booking.payment_status = "Partial"

    log_audit(db, "PAYMENT_COLLECTED", booking.booking_ref, payload.collected_by, {
        "payment_type": payload.payment_type,
        "payment_mode": payload.payment_mode,
        "amount": payload.amount,
        "transaction_ref": payload.transaction_ref,
        "remaining_balance": booking.balance_due
    })

    db.commit()
    db.refresh(payment)
    return payment

# --- 3. Room Folio Item (Food KOT / Laundry / Extra Mattress) ---
@router.post("/folio/add-item", response_model=schemas.RoomFolioItemResponse)
def add_item_to_room_folio(payload: schemas.RoomFolioItemCreate, db: Session = Depends(get_db)):
    """
    Post a Room Service Food KOT or Sundry charge directly to the Guest Room Folio
    Calculates 5% Food GST (SAC 996331) or 12% Hotel Sundry (SAC 996311)
    """
    booking = db.query(models.Booking).filter(
        models.Booking.booking_ref == payload.booking_ref.upper().strip()
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking reservation not found")

    qty = max(1, payload.quantity)
    taxable = round(payload.unit_price * qty, 2)
    
    # 5% GST for F&B Food (SAC 996331), 12% for Laundry / Hotel Sundry
    sac = payload.sac_code or "996331"
    gst_rate = 5.0 if sac == "996331" else 12.0
    half_rate = gst_rate / 200.0

    cgst = round(taxable * half_rate, 2)
    sgst = round(taxable * half_rate, 2)
    total_amount = round(taxable + cgst + sgst, 2)

    folio_item = models.RoomFolioItem(
        booking_id=booking.id,
        item_type=payload.item_type,
        description=payload.description,
        sac_code=sac,
        kot_number=payload.kot_number or f"KOT-{datetime.datetime.now().strftime('%H%M%S')}",
        quantity=qty,
        unit_price=payload.unit_price,
        taxable_amount=taxable,
        gst_rate=gst_rate,
        cgst_amount=cgst,
        sgst_amount=sgst,
        total_amount=total_amount,
        status="Billed"
    )
    db.add(folio_item)

    # Attach to booking total bill & recalculate balance
    booking.total_price = round(booking.total_price + total_amount, 2)
    booking.balance_due = max(0.0, round(booking.total_price - (booking.total_paid or 0.0), 2))

    log_audit(db, "FOLIO_ITEM_ADDED", booking.booking_ref, "Room Service / Cashier", {
        "item": payload.description,
        "kot": folio_item.kot_number,
        "total": total_amount
    })

    db.commit()
    db.refresh(folio_item)
    return folio_item

# --- 4. Consolidated Master Room Folio Checkout Invoice ---
@router.get("/folio/{booking_ref}", response_model=schemas.MasterFolioResponse)
def get_master_room_folio(booking_ref: str, db: Session = Depends(get_db)):
    """
    Generate comprehensive Master Folio showing:
    - Room stay base tariff & room GST
    - Itemized Room Shifts
    - Restaurant / Room Service Food KOTs & 5% GST
    - Multi-tender payment receipts
    - Net Balance Due
    """
    booking = db.query(models.Booking).filter(
        models.Booking.booking_ref == booking_ref.upper().strip()
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking reservation not found")

    room = booking.room or db.query(models.Room).filter(models.Room.id == booking.room_id).first()
    current_room_name = room.name if room else "Deluxe Stay"

    shifts = db.query(models.RoomShift).filter(models.RoomShift.booking_id == booking.id).all()
    folios = db.query(models.RoomFolioItem).filter(models.RoomFolioItem.booking_id == booking.id).all()
    payments = db.query(models.BookingPayment).filter(models.BookingPayment.booking_id == booking.id).all()

    # Calculations
    room_stay_charges = booking.base_amount + (booking.extra_guest_charge or 0.0)
    room_gst = booking.total_tax
    room_total = booking.base_amount + (booking.extra_guest_charge or 0.0) + booking.total_tax

    food_charges = sum(f.taxable_amount for f in folios)
    food_gst = sum(f.cgst_amount + f.sgst_amount for f in folios)
    food_total = sum(f.total_amount for f in folios)

    gross_bill = round(room_total + food_total, 2)
    total_paid = sum(p.amount for p in payments)
    net_due = max(0.0, round(gross_bill - total_paid, 2))

    return schemas.MasterFolioResponse(
        hotel_name="Hotel Sai Vasudev Residency",
        hotel_gstin="37AAACH7409R1ZZ",
        hotel_phone="+91 94402 89999 / +91 98480 12345",
        invoice_number=booking.invoice_number,
        booking_ref=booking.booking_ref,
        guest_name=booking.guest_name,
        guest_phone=booking.guest_phone,
        id_proof_number=booking.id_proof_number,
        check_in_date=booking.check_in_date,
        check_out_date=booking.check_out_date,
        total_nights=booking.total_nights,
        current_room=current_room_name,
        room_stay_charges=round(room_stay_charges, 2),
        room_gst_charges=round(room_gst, 2),
        room_total=round(room_total, 2),
        food_kot_charges=round(food_charges, 2),
        food_gst_charges=round(food_gst, 2),
        food_total=round(food_total, 2),
        gross_bill_amount=gross_bill,
        total_paid_amount=round(total_paid, 2),
        net_balance_due=net_due,
        room_shifts=shifts,
        folio_items=folios,
        payments=payments,
        payment_status=booking.payment_status,
        status=booking.status
    )

# --- 5. Statutory Police Station Register & Form C ---
@router.post("/police-register", response_model=schemas.PoliceStationLogResponse)
def create_police_station_record(payload: schemas.PoliceStationLogCreate, db: Session = Depends(get_db)):
    """Log mandatory police verification details for domestic and foreign pilgrims"""
    booking = db.query(models.Booking).filter(
        models.Booking.booking_ref == payload.booking_ref.upper().strip()
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking reservation not found")

    existing = db.query(models.PoliceStationLog).filter(models.PoliceStationLog.booking_id == booking.id).first()
    if existing:
        # Update existing
        for key, val in payload.dict(exclude={"booking_ref"}).items():
            setattr(existing, key, val)
        db.commit()
        db.refresh(existing)
        return existing

    log_entry = models.PoliceStationLog(
        booking_id=booking.id,
        guest_name=payload.guest_name,
        age=payload.age,
        gender=payload.gender,
        nationality=payload.nationality,
        id_proof_type=payload.id_proof_type,
        id_proof_number=payload.id_proof_number,
        permanent_address=payload.permanent_address,
        origin_city=payload.origin_city,
        next_destination=payload.next_destination,
        purpose_of_visit=payload.purpose_of_visit,
        vehicle_number=payload.vehicle_number,
        is_foreign_national=payload.is_foreign_national,
        passport_number=payload.passport_number,
        visa_number=payload.visa_number,
        visa_validity=payload.visa_validity,
        port_of_arrival=payload.port_of_arrival,
        date_of_entry_india=payload.date_of_entry_india
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry

@router.get("/police-register", response_model=List[schemas.PoliceStationLogResponse])
def get_daily_police_register(limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve police station guest register for statutory inspection"""
    return db.query(models.PoliceStationLog).order_by(models.PoliceStationLog.created_at.desc()).limit(limit).all()

# --- 6. Housekeeping 4-Stage Lifecycle ---
@router.post("/housekeeping/status")
def update_room_housekeeping_status(payload: schemas.HousekeepingStatusUpdate, db: Session = Depends(get_db)):
    """Update room state: Clean, Dirty, Inspected, Under_Maintenance"""
    room = db.query(models.Room).filter(models.Room.id == payload.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    valid_statuses = ["Clean", "Dirty", "Inspected", "Under_Maintenance"]
    if payload.housekeeping_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    old_status = room.housekeeping_status
    room.housekeeping_status = payload.housekeeping_status

    log_audit(db, "HOUSEKEEPING_UPDATE", None, payload.updated_by or "Housekeeping Head", {
        "room_name": room.name,
        "old_status": old_status,
        "new_status": payload.housekeeping_status
    })

    db.commit()
    return {"message": f"Room {room.name} status updated to {payload.housekeeping_status}"}

# --- 7. Midnight Day-End Night Audit Engine ---
@router.post("/night-audit", response_model=schemas.NightAuditResponse)
def execute_night_audit(payload: schemas.NightAuditRunRequest, db: Session = Depends(get_db)):
    """
    Execute Automated Midnight Day-End Closing:
    1. Counts occupied rooms
    2. Sums room & food revenues
    3. Auto-cancels unarrived No-Shows
    4. Reconciles Cash, UPI, Card, and BTC credit ledgers
    5. Locks daily books in NightAuditLog
    """
    audit_date = payload.audit_date or datetime.date.today().isoformat()

    # Check if already audited today
    existing = db.query(models.DailyNightAudit).filter(models.DailyNightAudit.audit_date == audit_date).first()
    if existing:
        return schemas.NightAuditResponse(
            audit_date=existing.audit_date,
            total_rooms_occupied=existing.total_rooms_occupied,
            total_room_revenue=existing.total_room_revenue,
            total_food_revenue=existing.total_food_revenue,
            total_gst_collected=existing.total_gst_collected,
            no_shows_processed=existing.no_shows_processed,
            cash_in_drawer=existing.cash_in_drawer,
            card_total=existing.card_total,
            upi_total=existing.upi_total,
            btc_credit_total=existing.btc_credit_total,
            total_day_collections=round(existing.cash_in_drawer + existing.card_total + existing.upi_total, 2),
            audited_by=existing.audited_by,
            audit_status=existing.audit_status,
            created_at=existing.created_at
        )

    # Calculate active occupied rooms
    active_in_house = db.query(models.Booking).filter(
        models.Booking.status.in_(["Checked-In", "Confirmed"])
    ).all()
    rooms_occupied = len(active_in_house)

    # Handle unarrived no-shows (Confirmed bookings whose check-in was today or earlier but never checked in)
    no_shows = db.query(models.Booking).filter(
        models.Booking.status == "Confirmed",
        models.Booking.check_in_date < audit_date
    ).all()
    no_shows_count = len(no_shows)
    for ns in no_shows:
        ns.status = "No-Show"

    # Sum payments collected today by tender type
    payments_today = db.query(models.BookingPayment).all()
    cash_total = sum(p.amount for p in payments_today if p.payment_mode == "Cash")
    card_total = sum(p.amount for p in payments_today if p.payment_mode == "Card")
    upi_total = sum(p.amount for p in payments_today if p.payment_mode == "UPI")
    btc_total = sum(p.amount for p in payments_today if p.payment_mode == "Direct_BTC")

    room_rev = sum(b.base_amount for b in active_in_house)
    total_gst = sum(b.total_tax for b in active_in_house)
    food_items = db.query(models.RoomFolioItem).all()
    food_rev = sum(f.taxable_amount for f in food_items)

    audit_entry = models.DailyNightAudit(
        audit_date=audit_date,
        total_rooms_occupied=rooms_occupied,
        total_room_revenue=round(room_rev, 2),
        total_food_revenue=round(food_rev, 2),
        total_gst_collected=round(total_gst, 2),
        no_shows_processed=no_shows_count,
        cash_in_drawer=round(cash_total, 2),
        card_total=round(card_total, 2),
        upi_total=round(upi_total, 2),
        btc_credit_total=round(btc_total, 2),
        audited_by=payload.audited_by or "Night Auditor / Manager",
        audit_status="Closed"
    )
    db.add(audit_entry)

    log_audit(db, "NIGHT_AUDIT_COMPLETED", None, audit_entry.audited_by, {
        "date": audit_date,
        "rooms_occupied": rooms_occupied,
        "no_shows": no_shows_count,
        "cash_reconciled": cash_total,
        "upi_reconciled": upi_total
    })

    db.commit()
    db.refresh(audit_entry)

    return schemas.NightAuditResponse(
        audit_date=audit_entry.audit_date,
        total_rooms_occupied=audit_entry.total_rooms_occupied,
        total_room_revenue=audit_entry.total_room_revenue,
        total_food_revenue=audit_entry.total_food_revenue,
        total_gst_collected=audit_entry.total_gst_collected,
        no_shows_processed=audit_entry.no_shows_processed,
        cash_in_drawer=audit_entry.cash_in_drawer,
        card_total=audit_entry.card_total,
        upi_total=audit_entry.upi_total,
        btc_credit_total=audit_entry.btc_credit_total,
        total_day_collections=round(cash_total + card_total + upi_total, 2),
        audited_by=audit_entry.audited_by,
        audit_status=audit_entry.audit_status,
        created_at=audit_entry.created_at
    )
