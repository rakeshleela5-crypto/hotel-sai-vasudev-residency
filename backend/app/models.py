import datetime
import uuid
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

def generate_booking_ref():
    return f"SVR-{uuid.uuid4().hex[:6].upper()}"

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    room_type = Column(String(50), nullable=False) # Deluxe, Suite, Family, Presidential
    price_per_night = Column(Float, nullable=False)
    capacity = Column(Integer, default=2) # Max guests
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
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    guest_name = Column(String(150), nullable=False)
    guest_email = Column(String(150), nullable=False)
    guest_phone = Column(String(50), nullable=False)
    check_in_date = Column(String(50), nullable=False)
    check_out_date = Column(String(50), nullable=False)
    adults = Column(Integer, default=2)
    children = Column(Integer, default=0)
    total_nights = Column(Integer, default=1)
    total_price = Column(Float, nullable=False)
    status = Column(String(50), default="Confirmed") # Confirmed, Pending, Cancelled
    special_requests = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    room = relationship("Room", back_populates="bookings")

class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
