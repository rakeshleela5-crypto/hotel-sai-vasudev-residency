import os
import datetime
import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, Query, Response, Header
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

# --- 8. Walk-In Direct Check-In ---
@router.post("/check-in", response_model=schemas.BookingResponse)
def execute_walk_in_check_in(payload: schemas.WalkInCheckInRequest, db: Session = Depends(get_db)):
    """
    Registers a walk-in guest at the front desk:
    1. Sets room housekeeping status to 'Occupied'
    2. Calculates authoritative pricing and Indian GST
    3. Records advance deposit payment if provided
    4. Automatically logs domestic/foreign police station register
    """
    room = db.query(models.Room).filter(models.Room.id == payload.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Selected room not found")
    if room.housekeeping_status == "Occupied":
        raise HTTPException(status_code=409, detail=f"Room '{room.name}' is already occupied!")
    if room.housekeeping_status == "Dirty":
        raise HTTPException(status_code=400, detail=f"Room '{room.name}' is marked Dirty! Housekeeping must clean and inspect before check-in.")

    today_str = payload.check_in_date or datetime.date.today().isoformat()
    start_date = datetime.date.fromisoformat(today_str)
    end_date = datetime.date.fromisoformat(payload.check_out_date)
    nights = max(1, (end_date - start_date).days)

    # Server pricing
    base_tariff = float(room.price_per_night)
    base_amount = round(base_tariff * nights, 2)
    extra_adults = max(0, payload.adults - room.capacity)
    extra_charge = round(extra_adults * 500.0 * nights, 2)
    taxable = round(base_amount + extra_charge, 2)
    gst_rate = 12.0 if (taxable / nights) <= 7500.0 else 18.0
    cgst = round(taxable * (gst_rate / 200.0), 2)
    sgst = cgst
    total_tax = round(cgst + sgst, 2)
    total_price = round(taxable + total_tax, 2)

    advance = float(payload.advance_amount or 0.0)
    balance = max(0.0, round(total_price - advance, 2))
    payment_status = "Paid" if balance <= 0 else ("Partial" if advance > 0 else "Pending")

    booking = models.Booking(
        room_id=room.id,
        guest_name=payload.guest_name.strip(),
        guest_email=(payload.guest_email or "walkin@hotelsai-vasudev.com").strip().lower(),
        guest_phone=payload.guest_phone.strip(),
        id_proof_type=payload.id_proof_type,
        id_proof_number=payload.id_proof_number,
        check_in_date=today_str,
        check_out_date=payload.check_out_date,
        actual_check_in=datetime.datetime.utcnow(),
        adults=payload.adults,
        children=payload.children,
        total_nights=nights,
        base_rate=base_tariff,
        base_amount=base_amount,
        extra_guest_charge=extra_charge,
        gst_rate=gst_rate,
        cgst_amount=cgst,
        sgst_amount=sgst,
        total_tax=total_tax,
        total_price=total_price,
        total_paid=advance,
        balance_due=balance,
        payment_status=payment_status,
        payment_method=payload.advance_payment_mode or "Cash",
        status="Checked-In",
        special_requests=payload.special_requests
    )
    db.add(booking)
    db.flush()

    # If advance paid, record payment receipt
    if advance > 0:
        p = models.BookingPayment(
            booking_id=booking.id,
            payment_type="Advance",
            payment_mode=payload.advance_payment_mode or "Cash",
            amount=advance,
            transaction_ref=payload.advance_ref,
            notes="Walk-in advance token",
            collected_by=payload.registered_by or "Front Desk Officer"
        )
        db.add(p)

    # Set room to Occupied
    room.housekeeping_status = "Occupied"

    # Auto-log domestic police register
    police_log = models.PoliceStationLog(
        booking_id=booking.id,
        guest_name=payload.guest_name.strip(),
        id_proof_type=payload.id_proof_type,
        id_proof_number=payload.id_proof_number or "VERIFIED_AT_DESK",
        permanent_address="Guest Walk-in Record",
        origin_city="Walk-in",
        next_destination="Return Journey",
        purpose_of_visit="Temple Darshan"
    )
    db.add(police_log)

    log_audit(db, "CHECK_IN", booking.booking_ref, payload.registered_by or "Front Desk Officer", {
        "room_name": room.name,
        "guest_name": payload.guest_name,
        "advance_collected": advance,
        "nights": nights
    })

    db.commit()
    db.refresh(booking)
    return booking

# --- 9. Check-Out Settlement & Transition to Dirty ---
@router.post("/check-out", response_model=schemas.MasterFolioResponse)
def execute_check_out(payload: schemas.CheckOutRequest, db: Session = Depends(get_db)):
    """
    Executes Check-Out:
    1. Collects remaining balance if paid
    2. Marks room as 'Dirty' for housekeeping
    3. Sets booking status to 'Checked-Out'
    4. Generates and returns final Master Folio Invoice
    """
    booking = db.query(models.Booking).filter(
        models.Booking.booking_ref == payload.booking_ref.upper().strip()
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking reservation not found")

    room = db.query(models.Room).filter(models.Room.id == booking.room_id).first()

    # Record final settlement payment if provided
    settlement_amt = float(payload.settlement_amount_paid or 0.0)
    if settlement_amt > 0:
        p = models.BookingPayment(
            booking_id=booking.id,
            payment_type="Settlement",
            payment_mode=payload.settlement_payment_mode or "Cash",
            amount=settlement_amt,
            transaction_ref=payload.transaction_ref,
            notes="Check-out bill settlement",
            collected_by=payload.processed_by or "Front Desk Officer"
        )
        db.add(p)
        booking.total_paid = round((booking.total_paid or 0.0) + settlement_amt, 2)
        booking.balance_due = max(0.0, round(booking.total_price - booking.total_paid, 2))

    if booking.balance_due <= 0:
        booking.payment_status = "Paid"
    elif payload.settlement_payment_mode == "Direct_BTC":
        booking.payment_status = "BTC"

    booking.status = "Checked-Out"
    booking.actual_check_out = datetime.datetime.utcnow()

    # Room must immediately transition to 'Dirty'
    if room:
        room.housekeeping_status = "Dirty"

    log_audit(db, "CHECK_OUT", booking.booking_ref, payload.processed_by or "Front Desk Officer", {
        "room_name": room.name if room else "Unknown",
        "settlement_paid": settlement_amt,
        "final_payment_status": booking.payment_status
    })

    db.commit()
    return get_master_room_folio(booking.booking_ref, db)

# --- 10. Room Maintenance / Out-of-Order Blocking ---
@router.post("/rooms/{room_id}/maintenance")
def toggle_room_maintenance(
    room_id: int, 
    payload: schemas.RoomMaintenanceRequest, 
    db: Session = Depends(get_db)
):
    """Mark a room as Out-of-Order / Under Maintenance or restore it to Clean"""
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if payload.is_under_maintenance:
        room.housekeeping_status = "Under_Maintenance"
        room.is_available = False
    else:
        room.housekeeping_status = "Clean"
        room.is_available = True

    log_audit(db, "MAINTENANCE_TOGGLE", None, payload.updated_by or "Property Manager", {
        "room_name": room.name,
        "under_maintenance": payload.is_under_maintenance,
        "reason": payload.reason
    })

    db.commit()
    return {"message": f"Room '{room.name}' status set to {room.housekeeping_status}", "is_available": room.is_available}

# --- 11. Master PMS Dashboard Synchronization Endpoint ---
@router.get("/sync/dashboard", response_model=schemas.PmsDashboardSyncResponse)
def get_pms_dashboard_sync(db: Session = Depends(get_db)):
    """
    High-Performance Real-Time Synchronizer:
    Returns complete room statuses, today's arrivals/departures, in-house guests, 
    and drawer cash/UPI figures in a single HTTP call to eliminate device isolation.
    """
    today_str = datetime.date.today().isoformat()
    rooms = db.query(models.Room).order_by(models.Room.id.asc()).all()
    active_bookings = db.query(models.Booking).filter(
        models.Booking.status.in_(["Checked-In", "Confirmed"])
    ).order_by(models.Booking.created_at.desc()).all()

    total_rooms = len(rooms)
    occupied = sum(1 for r in rooms if r.housekeeping_status == "Occupied")
    dirty = sum(1 for r in rooms if r.housekeeping_status == "Dirty")
    clean = sum(1 for r in rooms if r.housekeeping_status == "Clean")
    maintenance = sum(1 for r in rooms if r.housekeeping_status == "Under_Maintenance")

    today_arrivals = sum(1 for b in active_bookings if b.check_in_date == today_str and b.status == "Confirmed")
    today_departures = sum(1 for b in active_bookings if b.check_out_date == today_str and b.status == "Checked-In")

    payments = db.query(models.BookingPayment).all()
    cash_drawer = sum(p.amount for p in payments if p.payment_mode == "Cash")
    upi_today = sum(p.amount for p in payments if p.payment_mode == "UPI")
    total_rev = sum(b.base_amount for b in active_bookings)

    unconfirmed_web = sum(1 for b in active_bookings if b.payment_status == "Pending" and b.status == "Confirmed")

    return schemas.PmsDashboardSyncResponse(
        last_sync_timestamp=datetime.datetime.utcnow().isoformat(),
        total_rooms=total_rooms,
        occupied_rooms=occupied,
        dirty_rooms=dirty,
        clean_rooms=clean,
        maintenance_rooms=maintenance,
        today_expected_arrivals=today_arrivals,
        today_expected_departures=today_departures,
        total_revenue_today=round(total_rev, 2),
        total_cash_in_drawer=round(cash_drawer, 2),
        total_upi_today=round(upi_today, 2),
        unconfirmed_web_bookings_count=unconfirmed_web,
        rooms=rooms,
        active_bookings=active_bookings
    )

# --- 12. Full Database Snapshot Export / Backup ---
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")

@router.get("/backup/export")
def export_pms_database_backup(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db)
):
    """
    Export complete JSON snapshot of all rooms, bookings, payments, and audits.
    Protected by ADMIN_API_KEY when configured to prevent unauthorized data exfiltration.
    """
    if ADMIN_API_KEY and x_api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized access to database export backup.")

    rooms = db.query(models.Room).all()
    bookings = db.query(models.Booking).all()
    payments = db.query(models.BookingPayment).all()
    audits = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(100).all()

    return {
        "export_timestamp": datetime.datetime.utcnow().isoformat(),
        "hotel": "Hotel Sai Vasudev Residency",
        "gstin": "37AAACH7409R1ZZ",
        "total_rooms": len(rooms),
        "total_bookings": len(bookings),
        "total_payments": len(payments),
        "rooms": [{ "id": r.id, "name": r.name, "tariff": r.price_per_night, "status": r.housekeeping_status } for r in rooms],
        "bookings": [{ "ref": b.booking_ref, "guest": b.guest_name, "room_id": b.room_id, "status": b.status, "total": b.total_price } for b in bookings],
        "payments": [{ "ref": p.receipt_number, "mode": p.payment_mode, "amount": p.amount } for p in payments]
    }

# --- 13. Dining Tables CRUD ---
@router.get("/tables")
def get_dining_tables(db: Session = Depends(get_db)):
    """Retrieve all dining tables from PostgreSQL"""
    tables = db.query(models.DiningTable).order_by(models.DiningTable.id.asc()).all()
    return [{
        "id": str(t.id),
        "tableName": t.table_name,
        "tableCode": t.table_code,
        "tableGroup": t.table_group,
        "capacity": t.capacity,
        "status": t.status
    } for t in tables]

@router.post("/tables")
def save_dining_table(payload: dict, db: Session = Depends(get_db)):
    """Create or update a dining table"""
    table_code = payload.get("tableCode") or payload.get("tableName", "").replace("Table ", "").strip()
    existing = db.query(models.DiningTable).filter(models.DiningTable.table_code == table_code).first()
    if existing:
        existing.table_name = payload.get("tableName", existing.table_name)
        existing.table_group = payload.get("tableGroup", existing.table_group)
        existing.capacity = payload.get("capacity", existing.capacity)
        existing.status = payload.get("status", existing.status)
        db.commit()
        db.refresh(existing)
        return {"status": "updated", "id": existing.id}
    
    t = models.DiningTable(
        table_code=table_code,
        table_name=payload.get("tableName", f"Table {table_code}"),
        table_group=payload.get("tableGroup", "General"),
        capacity=payload.get("capacity", 4),
        status=payload.get("status", "Vacant")
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return {"status": "created", "id": t.id}

@router.put("/tables/{table_code}/status")
def update_table_status(table_code: str, payload: dict, db: Session = Depends(get_db)):
    """Update dining table status: Vacant, Running, Billed"""
    t = db.query(models.DiningTable).filter(models.DiningTable.table_code == table_code).first()
    if not t:
        raise HTTPException(status_code=404, detail="Table not found")
    t.status = payload.get("status", "Vacant")
    db.commit()
    return {"status": "updated", "table_code": t.table_code, "new_status": t.status}

# --- 14. Kitchen Order Ticket (KOT) CRUD ---
@router.get("/kots")
def get_kot_tickets(db: Session = Depends(get_db)):
    """Retrieve all KOT tickets from PostgreSQL"""
    kots = db.query(models.KotTicket).order_by(models.KotTicket.created_at.desc()).limit(100).all()
    results = []
    for k in kots:
        try:
            items = json.loads(k.items_json)
        except Exception:
            items = []
        results.append({
            "id": str(k.id),
            "kotNo": k.kot_no,
            "date": k.date,
            "time": k.time,
            "tableNo": k.table_no,
            "roomNo": k.room_no,
            "waiterName": k.waiter_name,
            "guestName": k.guest_name,
            "pax": k.pax,
            "items": items,
            "totalAmount": k.total_amount,
            "status": k.status,
            "isPrinted": k.is_printed
        })
    return results

@router.post("/kots")
def create_kot_ticket(payload: dict, db: Session = Depends(get_db)):
    """
    Save new KOT ticket to PostgreSQL.
    If room_no is provided, automatically posts charge to guest's room folio!
    """
    kot_no = payload.get("kotNo") or f"KOT/{datetime.datetime.now().strftime('%y%m%d%H%M%S')}"
    items = payload.get("items", [])
    total_amount = float(payload.get("totalAmount") or sum(float(i.get("amount", 0)) for i in items))
    
    kot = models.KotTicket(
        kot_no=kot_no,
        date=payload.get("date") or datetime.date.today().isoformat(),
        time=payload.get("time") or datetime.datetime.now().strftime("%I:%M %p"),
        table_no=payload.get("tableNo"),
        room_no=payload.get("roomNo"),
        waiter_name=payload.get("waiterName", "Captain"),
        guest_name=payload.get("guestName"),
        pax=int(payload.get("pax", 2)),
        items_json=json.dumps(items),
        total_amount=total_amount,
        status=payload.get("status", "Running"),
        is_printed=payload.get("isPrinted", True)
    )
    db.add(kot)

    # If linked to dining table, mark table Running
    if payload.get("tableNo"):
        clean_code = payload.get("tableNo", "").replace("Table ", "").strip()
        tbl = db.query(models.DiningTable).filter(models.DiningTable.table_code == clean_code).first()
        if tbl:
            tbl.status = "Running"

    # If linked to room, post directly to guest room folio
    if payload.get("roomNo"):
        room_no = str(payload.get("roomNo")).strip()
        booking = db.query(models.Booking).filter(
            models.Booking.room_id == int(room_no) if room_no.isdigit() else False,
            models.Booking.status == "Checked-In"
        ).first()
        if booking:
            folio = models.RoomFolioItem(
                booking_id=booking.id,
                item_type="Food_KOT",
                description=f"KOT {kot_no}: " + ", ".join([f"{i.get('itemName', 'Item')} x{i.get('qty', 1)}" for i in items]),
                sac_code="996331",
                kot_number=kot_no,
                quantity=1,
                unit_price=total_amount,
                taxable_amount=round(total_amount / 1.05, 2),
                gst_rate=5.0,
                cgst_amount=round((total_amount / 1.05) * 0.025, 2),
                sgst_amount=round((total_amount / 1.05) * 0.025, 2),
                total_amount=total_amount,
                status="Billed"
            )
            db.add(folio)
            booking.total_price = round(booking.total_price + total_amount, 2)
            booking.balance_due = max(0.0, round(booking.total_price - (booking.total_paid or 0.0), 2))

    db.commit()
    db.refresh(kot)
    return {"status": "created", "kot_no": kot.kot_no, "id": kot.id}

# --- 15. Master Items CRUD (GST, OTAs, Vouchers, Lockers, Charges) ---
@router.get("/masters/{category}")
def get_master_items_by_category(category: str, db: Session = Depends(get_db)):
    """Retrieve master items (gst, business_source, voucher_type, locker, other_charge)"""
    items = db.query(models.MasterItem).filter(models.MasterItem.category == category.lower().strip()).all()
    results = []
    for it in items:
        try:
            payload = json.loads(it.payload_json)
        except Exception:
            payload = {}
        payload["id"] = it.code
        payload["name"] = it.name
        results.append(payload)
    return results

@router.post("/masters")
def save_master_item(payload: dict, db: Session = Depends(get_db)):
    """Create or update a master item in PostgreSQL"""
    category = payload.get("category", "").lower().strip()
    code = payload.get("code") or payload.get("id") or f"{category}-{uuid.uuid4().hex[:6]}"
    name = payload.get("name") or payload.get("chargeName") or payload.get("lockerNumber") or payload.get("voucherTypeName") or code

    existing = db.query(models.MasterItem).filter(models.MasterItem.code == code).first()
    if existing:
        existing.name = name
        existing.payload_json = json.dumps(payload)
        db.commit()
        db.refresh(existing)
        return {"status": "updated", "code": existing.code}

    item = models.MasterItem(
        category=category,
        code=code,
        name=name,
        payload_json=json.dumps(payload)
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"status": "created", "code": item.code}

@router.delete("/masters/{category}/{code}")
def delete_master_item(category: str, code: str, db: Session = Depends(get_db)):
    """Delete a master item from PostgreSQL"""
    item = db.query(models.MasterItem).filter(
        models.MasterItem.category == category.lower().strip(),
        models.MasterItem.code == code
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Master item not found")
    db.delete(item)
    db.commit()
    return {"status": "deleted", "code": code}

# --- 16. Full Cloud Hydration API ---
@router.get("/sync/full-state")
def get_full_cloud_state(db: Session = Depends(get_db)):
    """
    Returns entire relational ERP state for instant hydration:
    Rooms, Active Bookings, Check-Outs, KOTs, Dining Tables, and Masters.
    """
    rooms = db.query(models.Room).order_by(models.Room.id.asc()).all()
    bookings = db.query(models.Booking).order_by(models.Booking.created_at.desc()).limit(150).all()
    payments = db.query(models.BookingPayment).order_by(models.BookingPayment.created_at.desc()).limit(150).all()
    tables = db.query(models.DiningTable).all()
    kots = db.query(models.KotTicket).order_by(models.KotTicket.created_at.desc()).limit(50).all()
    masters = db.query(models.MasterItem).all()

    masters_by_cat = {}
    for m in masters:
        try:
            p = json.loads(m.payload_json)
        except Exception:
            p = {}
        p["id"] = m.code
        p["name"] = m.name
        masters_by_cat.setdefault(m.category, []).append(p)

    return {
        "sync_timestamp": datetime.datetime.utcnow().isoformat(),
        "rooms": [{
            "id": str(r.id),
            "roomNo": str(r.id),
            "roomType": r.room_type,
            "tariff": r.price_per_night,
            "capacity": r.capacity,
            "status": "occupied" if r.housekeeping_status == "Occupied" else ("dirty" if r.housekeeping_status == "Dirty" else ("blocked" if r.housekeeping_status == "Under_Maintenance" else "vacant")),
            "housekeepingStatus": r.housekeeping_status
        } for r in rooms],
        "active_bookings": [{
            "id": b.id,
            "booking_ref": b.booking_ref,
            "room_id": b.room_id,
            "guest_name": b.guest_name,
            "guest_phone": b.guest_phone,
            "check_in_date": b.check_in_date,
            "check_out_date": b.check_out_date,
            "status": b.status,
            "total_price": b.total_price,
            "total_paid": b.total_paid,
            "balance_due": b.balance_due
        } for b in bookings],
        "payments": [{
            "id": p.id,
            "receipt_number": p.receipt_number,
            "booking_id": p.booking_id,
            "payment_type": p.payment_type,
            "payment_mode": p.payment_mode,
            "amount": p.amount,
            "created_at": p.created_at.isoformat() if p.created_at else None
        } for p in payments],
        "tables": [{
            "id": str(t.id),
            "tableName": t.table_name,
            "tableCode": t.table_code,
            "tableGroup": t.table_group,
            "capacity": t.capacity,
            "status": t.status
        } for t in tables],
        "masters": masters_by_cat
    }


