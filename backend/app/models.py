import datetime
import uuid
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

def generate_booking_ref():
    return f"SVR-{uuid.uuid4().hex[:6].upper()}"

def generate_invoice_num():
    year = datetime.datetime.utcnow().year
    rand_seq = uuid.uuid4().hex[:4].upper()
    return f"INV-SVR-{year}-{rand_seq}"

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    room_type = Column(String(50), nullable=False) # Deluxe, Suite, Family, Presidential
    price_per_night = Column(Float, nullable=False)
    capacity = Column(Integer, default=2) # Max standard guests
    total_inventory = Column(Integer, default=5) # Total physical rooms of this type
    bed_type = Column(String(50), default="King Bed")
    room_size = Column(String(50), default="350 sq ft")
    description = Column(Text, nullable=False)
    amenities = Column(String(500), default="Free High-Speed Wi-Fi, Air Conditioning, Smart TV, 24/7 Room Service, Complimentary Breakfast")
    image_url = Column(String(255), nullable=False)
    badge = Column(String(50), nullable=True) # e.g. "Most Popular", "Best Value", "Luxury Choice"
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    bookings = relationship("Booking", back_populates="room")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_ref = Column(String(50), unique=True, index=True, default=generate_booking_ref)
    invoice_number = Column(String(50), unique=True, index=True, default=generate_invoice_num)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False, index=True)
    
    # Guest Profile
    guest_name = Column(String(150), nullable=False)
    guest_email = Column(String(150), nullable=False)
    guest_phone = Column(String(50), nullable=False)
    id_proof_type = Column(String(50), default="Aadhaar Card") # Aadhaar, Passport, Driving License, Voter ID
    id_proof_number = Column(String(50), nullable=True)

    # Reservation Dates
    check_in_date = Column(String(50), nullable=False, index=True) # YYYY-MM-DD
    check_out_date = Column(String(50), nullable=False, index=True) # YYYY-MM-DD
    adults = Column(Integer, default=2)
    children = Column(Integer, default=0)
    total_nights = Column(Integer, default=1)

    # Financial & Indian GST Tax Engine
    base_rate = Column(Float, nullable=False) # Tariff per night at time of booking
    base_amount = Column(Float, nullable=False) # base_rate * total_nights
    extra_guest_charge = Column(Float, default=0.0) # Extra guest additions
    gst_rate = Column(Float, default=12.0) # 12% if <= 7500, 18% if > 7500
    cgst_amount = Column(Float, default=0.0)
    sgst_amount = Column(Float, default=0.0)
    total_tax = Column(Float, default=0.0)
    total_price = Column(Float, nullable=False) # Grand total payable

    # Operational Status
    payment_status = Column(String(50), default="Pending") # Pending, Paid, Pay at Hotel, Partial
    payment_method = Column(String(50), default="Pay at Hotel") # UPI, Credit/Debit Card, Cash, NetBanking
    status = Column(String(50), default="Confirmed", index=True) # Confirmed, Checked-In, Checked-Out, Cancelled
    special_requests = Column(Text, nullable=True)
    cancellation_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    room = relationship("Room", back_populates="bookings")

class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(50), default="New") # New, Responded, Closed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DailyNightAudit(Base):
    __tablename__ = "night_audits"

    id = Column(Integer, primary_key=True, index=True)
    audit_date = Column(String(50), unique=True, nullable=False, index=True) # YYYY-MM-DD
    total_rooms_occupied = Column(Integer, default=0)
    total_revenue = Column(Float, default=0.0)
    total_gst_collected = Column(Float, default=0.0)
    audit_status = Column(String(50), default="Closed")
    audited_by = Column(String(100), default="System Auto-Audit")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
