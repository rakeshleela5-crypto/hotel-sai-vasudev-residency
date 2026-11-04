import datetime
import html
import threading
from fastapi import APIRouter, Depends, HTTPException, Query, Response, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import text
from typing import List, Optional

from app.database import get_db
from app import models, schemas
from app.utils.locking import acquire_canonical_locks
from app.utils.timezone import now_utc
from app.utils.idempotency import require_idempotency_key
from app.utils.encryption import encrypt_pii, decrypt_pii
from app.utils.rate_limit import limiter
from app.config import settings
from app.websocket_manager import ws_manager

router = APIRouter(prefix="/bookings", tags=["Bookings"])

def parse_dates_and_nights(check_in_str: str, check_out_str: str) -> tuple[datetime.date, datetime.date, int]:
    try:
        start_date = datetime.date.fromisoformat(check_in_str.strip())
        end_date = datetime.date.fromisoformat(check_out_str.strip())
    except ValueError:
        raise HTTPException(
            status_code=400, 
            detail="Invalid date format. Expected YYYY-MM-DD (e.g. 2026-11-01)"
        )

    if end_date <= start_date:
        raise HTTPException(
            status_code=400,
            detail="Check-out date must be at least one day after check-in date"
        )

    diff = (end_date - start_date).days
    return start_date, end_date, max(1, diff)

def compute_tax_and_pricing(room: models.Room, nights: int, adults: int):
    # PRD Business Rule: All room tariffs (₹1,500 - ₹3,000) are strictly INCLUSIVE of GST (12% slab for SAC 996311)
    base_tariff = float(room.price_per_night)
    grand_total = round(base_tariff * nights, 2)
    
    # Extract pre-GST taxable base via gross / 1.12 for GSTR-1 reporting
    gst_rate = 12.0
    taxable_value = round(grand_total / 1.12, 2)
    total_tax = round(grand_total - taxable_value, 2)
    cgst_amount = round(total_tax / 2.0, 2)
    sgst_amount = round(total_tax - cgst_amount, 2)
    
    return {
        "base_tariff": base_tariff,
        "base_amount": taxable_value,
        "extra_guest_charge": 0.0,
        "taxable_value": taxable_value,
        "gst_rate": gst_rate,
        "cgst_amount": cgst_amount,
        "sgst_amount": sgst_amount,
        "total_tax": total_tax,
        "grand_total": grand_total
    }

def get_overlapping_bookings_count(db: Session, room_id: int, check_in_str: str, check_out_str: str, for_update: bool = True) -> int:
    """Calculates active bookings overlapping with [check_in, check_out) with row-level locking (#38)."""
    q = db.query(models.Booking).filter(
        models.Booking.room_id == room_id,
        models.Booking.status.notin_(["Cancelled", "Checked-Out"]),
        models.Booking.check_in_date < check_out_str,
        models.Booking.check_out_date > check_in_str
    )
    if for_update:
        try:
            return q.with_for_update().count()
        except Exception:
            return q.count()
    return q.count()

_booking_concurrency_lock = threading.Lock()

@router.post("", response_model=schemas.BookingResponse, status_code=201, dependencies=[Depends(require_idempotency_key)])
@limiter.limit(settings.RATE_LIMIT_BOOKING)
def create_booking(request: Request, payload: schemas.BookingCreate, db: Session = Depends(get_db)):
    """
    Create a new atomic room booking with:
    1. Row-level concurrency locking
    2. Overlap double-booking rejection (409 Conflict)
    3. Server-side Indian GST recalculation
    4. Unique invoice number generation
    """
    # 1. Acquire canonical row lock on Room (.with_for_update()) (#14, #26)
    with _booking_concurrency_lock:
        # Row-level pessimistic locking (.with_for_update()) on target Room (#14, #26, #38)
        _, _, room = acquire_canonical_locks(db, room_id=payload.room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Selected room does not exist")

        _, _, nights = parse_dates_and_nights(payload.check_in_date, payload.check_out_date)

        # Verify inventory availability under row lock:
        if getattr(room, "room_number", None):
            inventory_limit = 1
        else:
            inventory_limit = getattr(room, "total_inventory", 1) or 1

        booked_count = get_overlapping_bookings_count(
            db, payload.room_id, payload.check_in_date, payload.check_out_date, for_update=True
        )
        
        if booked_count >= inventory_limit:
            room_label = getattr(room, "room_number", None) or getattr(room, "name", "Selected Room")
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Booking Conflict: Room '{room_label}' "
                    f"is already reserved between {payload.check_in_date} and {payload.check_out_date}. "
                    f"Please choose alternative dates or another room category."
                )
            )

        # Calculate authoritative server-side pricing & GST
        pricing = compute_tax_and_pricing(room, nights, payload.adults)

        new_booking = models.Booking(
            room_id=payload.room_id,
            guest_name=payload.guest_name.strip(),
            guest_email=payload.guest_email.strip().lower(),
            guest_phone=payload.guest_phone.strip(),
            id_proof_type=payload.id_proof_type or "Aadhaar Card",
            id_proof_number=encrypt_pii(payload.id_proof_number),
            check_in_date=payload.check_in_date,
            check_out_date=payload.check_out_date,
            adults=payload.adults,
            children=payload.children,
            total_nights=nights,
            base_rate=pricing["base_tariff"],
            base_amount=pricing["base_amount"],
            extra_guest_charge=pricing["extra_guest_charge"],
            gst_rate=pricing["gst_rate"],
            cgst_amount=pricing["cgst_amount"],
            sgst_amount=pricing["sgst_amount"],
            total_tax=pricing["total_tax"],
            total_price=pricing["grand_total"],
            payment_status="Pending" if payload.payment_method == "Pay at Hotel" else "Paid",
            payment_method=payload.payment_method or "Pay at Hotel",
            status="Confirmed",
            special_requests=payload.special_requests,
            created_at=now_utc(),
            updated_at=now_utc()
        )

        db.add(new_booking)
        db.flush()

        # Automatically initialize primary Master Folio (#20, #26)
        initial_folio = models.Folio(
            booking_id=new_booking.id,
            folio_number=f"FOL-{new_booking.booking_ref}",
            status="OPEN",
            total_charges=new_booking.total_price,
            total_payments=new_booking.total_paid or 0.0,
            balance_due=new_booking.balance_due or new_booking.total_price,
            version_id=1,
            created_at=now_utc(),
            updated_at=now_utc()
        )
        db.add(initial_folio)

        db.commit()
        db.refresh(new_booking)

    ws_manager.emit_booking_event_sync(
        event_type="BOOKING_CREATED",
        booking_ref=new_booking.booking_ref,
        status=new_booking.status,
        room_number=room.name if room else str(new_booking.room_id),
        guest_name=new_booking.guest_name
    )
    return new_booking

@router.get("/{booking_ref}", response_model=schemas.BookingResponse)
def get_booking_by_ref(booking_ref: str, db: Session = Depends(get_db)):
    """Lookup booking by reference number with eager loading (selectinload #5)"""
    booking = db.query(models.Booking).options(
        selectinload(models.Booking.room),
        selectinload(models.Booking.folio_items),
        selectinload(models.Booking.payments),
        selectinload(models.Booking.folios),
        selectinload(models.Booking.room_shifts)
    ).filter(
        models.Booking.booking_ref == booking_ref.upper().strip()
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking reservation not found")
    return booking

@router.patch("/{booking_ref}/status", response_model=schemas.BookingResponse)
def update_booking_status(
    booking_ref: str, 
    update: schemas.BookingStatusUpdate, 
    db: Session = Depends(get_db)
):
    """Update booking lifecycle with canonical row lock (Booking -> Folio -> Room) (#15, #26)"""
    from app.routes.pms import find_booking_by_ref_or_room
    booking = find_booking_by_ref_or_room(db, booking_ref, for_update=True)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking reservation not found")

    acquire_canonical_locks(db, booking_id=booking.id, room_id=booking.room_id)

    # Race Condition & Double-Booking Guard (#14, #38)
    if update.status == "Checked-In":
        room = db.query(models.Room).filter(models.Room.id == booking.room_id).with_for_update().first()
        if room:
            if room.housekeeping_status == "Occupied":
                other_b = db.query(models.Booking).filter(
                    models.Booking.room_id == room.id,
                    models.Booking.id != booking.id,
                    models.Booking.status == "Checked-In",
                    models.Booking.is_deleted == False
                ).first()
                if other_b:
                    raise HTTPException(
                        status_code=409,
                        detail=f"Room '{room.name}' is already occupied by active reservation '{other_b.booking_ref}'"
                    )
            room.housekeeping_status = "Occupied"

    booking.status = update.status
    if update.payment_status:
        booking.payment_status = update.payment_status
    if update.cancellation_reason:
        booking.cancellation_reason = update.cancellation_reason
    booking.updated_at = now_utc()

    db.commit()
    db.refresh(booking)
    ws_manager.emit_booking_event_sync(
        event_type="BOOKING_STATUS_CHANGED",
        booking_ref=booking.booking_ref,
        status=booking.status,
        guest_name=booking.guest_name
    )
    return booking

@router.get("/{booking_ref}/invoice", response_model=schemas.TaxInvoiceVoucher)
def get_booking_tax_invoice(booking_ref: str, db: Session = Depends(get_db)):
    """Generate official Indian GST Tax Invoice & Voucher details"""
    from app.routes.pms import find_booking_by_ref_or_room
    booking = find_booking_by_ref_or_room(db, booking_ref)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking reservation not found")

    room = booking.room or db.query(models.Room).filter(models.Room.id == booking.room_id).first()
    room_name = room.name if room else "Deluxe Stay"
    room_type = room.room_type if room else "Standard"

    return schemas.TaxInvoiceVoucher(
        invoice_number=booking.invoice_number or f"INV-{booking.booking_ref}",
        invoice_date=booking.created_at.strftime("%Y-%m-%d"),
        booking_ref=booking.booking_ref,
        guest_name=booking.guest_name,
        guest_email=booking.guest_email,
        guest_phone=booking.guest_phone,
        id_proof_type=booking.id_proof_type,
        room_name=room_name,
        room_type=room_type,
        check_in_date=booking.check_in_date,
        check_out_date=booking.check_out_date,
        total_nights=booking.total_nights,
        adults=booking.adults,
        children=booking.children,
        daily_tariff=booking.base_rate,
        base_amount=booking.base_amount,
        extra_guest_charge=booking.extra_guest_charge,
        taxable_value=round(booking.base_amount + booking.extra_guest_charge, 2),
        gst_rate_percent=booking.gst_rate,
        cgst_amount=booking.cgst_amount,
        sgst_amount=booking.sgst_amount,
        total_tax_amount=booking.total_tax,
        grand_total=booking.total_price,
        payment_status=booking.payment_status,
        payment_method=booking.payment_method,
        status=booking.status
    )

@router.get("/{booking_ref}/print-slip", response_class=HTMLResponse)
def get_printable_slip(booking_ref: str, db: Session = Depends(get_db)):
    """Generate high-contrast, clean 80mm / A4 printable thermal receipt & registration slip"""
    booking = db.query(models.Booking).filter(
        models.Booking.booking_ref == booking_ref.upper().strip()
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    room = booking.room or db.query(models.Room).filter(models.Room.id == booking.room_id).first()
    room_name = room.name if room else "Deluxe Room"

    # Strictly sanitize all guest and room inputs against Stored XSS / HTML Injection
    safe_booking_ref = html.escape(str(booking.booking_ref or ""))
    safe_invoice_number = html.escape(str(booking.invoice_number or f"INV-{booking.booking_ref}"))
    safe_created_date = html.escape(booking.created_at.strftime('%d-%b-%Y %I:%M %p') if booking.created_at else "")
    safe_guest_name = html.escape(str(booking.guest_name or ""))
    safe_guest_phone = html.escape(str(booking.guest_phone or ""))
    safe_id_proof = html.escape(str(booking.id_proof_type or "Aadhaar"))
    safe_room_name = html.escape(str(room_name or ""))
    safe_check_in = html.escape(str(booking.check_in_date or ""))
    safe_check_out = html.escape(str(booking.check_out_date or ""))
    safe_status = html.escape(str(booking.status or "CONFIRMED").upper())
    safe_payment_method = html.escape(str(booking.payment_method or "Pay at Hotel"))
    safe_payment_status = html.escape(str(booking.payment_status or "Pending"))

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Receipt - {safe_booking_ref}</title>
<style>
  @media print {{
    body {{ margin: 0; padding: 0; background: #fff; }}
    .no-print {{ display: none; }}
  }}
  body {{
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #111;
    background: #f4f4f7;
    padding: 20px;
    display: flex;
    justify-content: center;
  }}
  .ticket {{
    width: 380px;
    background: #fff;
    padding: 24px;
    border: 1px solid #ddd;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border-radius: 8px;
  }}
  .header {{
    text-align: center;
    border-bottom: 2px dashed #bbb;
    padding-bottom: 14px;
    margin-bottom: 14px;
  }}
  .hotel-title {{
    font-size: 19px;
    font-weight: 800;
    color: #8B1E28;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  .hotel-sub {{
    font-size: 11px;
    color: #555;
    margin: 4px 0 0 0;
  }}
  .gstin {{
    font-size: 11px;
    font-weight: 700;
    margin-top: 4px;
    color: #222;
  }}
  .badge {{
    display: inline-block;
    padding: 3px 10px;
    background: #e8f5e9;
    color: #2e7d32;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    margin-top: 6px;
  }}
  .row {{
    display: flex;
    justify-content: space-between;
    margin: 5px 0;
    font-size: 12px;
  }}
  .row-label {{ color: #666; }}
  .row-val {{ font-weight: 600; text-align: right; }}
  .divider {{
    border-top: 1px dashed #ccc;
    margin: 10px 0;
  }}
  .total-row {{
    font-size: 15px;
    font-weight: 800;
    color: #111;
    border-top: 2px solid #222;
    padding-top: 8px;
    margin-top: 10px;
  }}
  .footer {{
    text-align: center;
    font-size: 10px;
    color: #777;
    margin-top: 18px;
    border-top: 1px dashed #bbb;
    padding-top: 12px;
  }}
  .btn-print {{
    display: block;
    width: 100%;
    margin-top: 15px;
    padding: 10px;
    background: #8B1E28;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-weight: 700;
    cursor: pointer;
  }}
</style>
</head>
<body>
<div class="ticket">
  <div class="header">
    <h1 class="hotel-title">Hotel Sai Vasudev Residency</h1>
    <p class="hotel-sub">Near Temple Main Road, Holy Town</p>
    <p class="hotel-sub">Tel: +91 94402 89999 / +91 98480 12345</p>
    <div class="gstin">GSTIN: 37AAACH7409R1ZZ | SAC: 996311 (Accommodation)</div>
    <div class="badge">{safe_status} RESERVATION &bull; INCLUSIVE OF GST (12%)</div>
  </div>

  <div class="row">
    <span class="row-label">Booking Ref:</span>
    <span class="row-val">{safe_booking_ref}</span>
  </div>
  <div class="row">
    <span class="row-label">Tax Invoice #:</span>
    <span class="row-val">{safe_invoice_number}</span>
  </div>
  <div class="row">
    <span class="row-label">Booked Date:</span>
    <span class="row-val">{safe_created_date}</span>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span class="row-label">Guest Name:</span>
    <span class="row-val">{safe_guest_name}</span>
  </div>
  <div class="row">
    <span class="row-label">Contact:</span>
    <span class="row-val">{safe_guest_phone}</span>
  </div>
  <div class="row">
    <span class="row-label">ID Proof:</span>
    <span class="row-val">{safe_id_proof}</span>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span class="row-label">Room Reserved:</span>
    <span class="row-val">{safe_room_name}</span>
  </div>
  <div class="row">
    <span class="row-label">Check-In:</span>
    <span class="row-val">{safe_check_in} (12:00 PM)</span>
  </div>
  <div class="row">
    <span class="row-label">Check-Out:</span>
    <span class="row-val">{safe_check_out} (11:00 AM)</span>
  </div>
  <div class="row">
    <span class="row-label">Duration:</span>
    <span class="row-val">{booking.total_nights} Night(s)</span>
  </div>
  <div class="row">
    <span class="row-label">Guests:</span>
    <span class="row-val">{booking.adults} Adults, {booking.children} Child</span>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span class="row-label">Taxable Base (Pre-GST for GSTR-1):</span>
    <span class="row-val">₹{booking.base_amount:,.2f}</span>
  </div>
  <div class="row">
    <span class="row-label">CGST ({booking.gst_rate / 2:.1f}%):</span>
    <span class="row-val">₹{booking.cgst_amount:,.2f}</span>
  </div>
  <div class="row">
    <span class="row-label">SGST ({booking.gst_rate / 2:.1f}%):</span>
    <span class="row-val">₹{booking.sgst_amount:,.2f}</span>
  </div>

  <div class="row total-row">
    <span>TOTAL PAYABLE (INCLUSIVE OF GST):</span>
    <span>₹{booking.total_price:,.2f}</span>
  </div>

  <div class="row" style="margin-top: 8px;">
    <span class="row-label">Payment Mode:</span>
    <span class="row-val">{safe_payment_method} ({safe_payment_status})</span>
  </div>

  <div class="footer">
    <p>Thank you for choosing Hotel Sai Vasudev Residency.</p>
    <p>May Lord Sai bless your pilgrimage with peace and prosperity.</p>
    <p style="margin-top: 14px;">Guest Signature: ___________________________</p>
  </div>

  <button class="btn-print no-print" onclick="window.print()">Print Slip / Save PDF</button>
</div>
</body>
</html>
"""
    return HTMLResponse(content=html_content)

@router.get("", response_model=List[schemas.BookingResponse])
def list_bookings(
    status: Optional[str] = None,
    limit: int = 50, 
    include_deleted: bool = False,
    db: Session = Depends(get_db)
):
    """List recent bookings with optional status filter and selectinload N+1 query elimination (#5)"""
    q = db.query(models.Booking).options(selectinload(models.Booking.room))
    if not include_deleted:
        q = q.filter(models.Booking.is_deleted == False)
    if status and status != "All":
        q = q.filter(models.Booking.status == status)
    return q.order_by(models.Booking.created_at.desc()).limit(limit).all()
