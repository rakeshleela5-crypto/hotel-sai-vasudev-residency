from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("", response_model=schemas.BookingResponse, status_code=201)
def create_booking(payload: schemas.BookingCreate, db: Session = Depends(get_db)):
    """Create a new room booking reservation"""
    # Verify room exists
    room = db.query(models.Room).filter(models.Room.id == payload.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Selected room does not exist")

    # Calculate server-side total price safeguard
    nights = max(1, payload.total_nights)
    calculated_price = room.price_per_night * nights

    new_booking = models.Booking(
        room_id=payload.room_id,
        guest_name=payload.guest_name,
        guest_email=payload.guest_email,
        guest_phone=payload.guest_phone,
        check_in_date=payload.check_in_date,
        check_out_date=payload.check_out_date,
        adults=payload.adults,
        children=payload.children,
        total_nights=nights,
        total_price=calculated_price,
        status="Confirmed",
        special_requests=payload.special_requests
    )

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking

@router.get("/{booking_ref}", response_model=schemas.BookingResponse)
def get_booking_by_ref(booking_ref: str, db: Session = Depends(get_db)):
    """Lookup booking by reference number"""
    booking = db.query(models.Booking).filter(
        models.Booking.booking_ref == booking_ref.upper().strip()
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking reservation not found")
    return booking

@router.get("", response_model=List[schemas.BookingResponse])
def list_bookings(limit: int = 50, db: Session = Depends(get_db)):
    """List recent bookings for management"""
    return db.query(models.Booking).order_by(models.Booking.created_at.desc()).limit(limit).all()
