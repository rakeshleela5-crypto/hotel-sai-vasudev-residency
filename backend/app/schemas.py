from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
import datetime

# Room Schemas
class RoomBase(BaseModel):
    name: str
    slug: str
    room_type: str
    price_per_night: float
    capacity: int = 2
    bed_type: str = "King Bed"
    room_size: str = "350 sq ft"
    description: str
    amenities: str
    image_url: str
    badge: Optional[str] = None
    is_available: bool = True

class RoomResponse(RoomBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Booking Schemas
class BookingCreate(BaseModel):
    room_id: int
    guest_name: str = Field(..., min_length=2)
    guest_email: EmailStr
    guest_phone: str = Field(..., min_length=7)
    check_in_date: str
    check_out_date: str
    adults: int = Field(default=2, ge=1)
    children: int = Field(default=0, ge=0)
    total_nights: int = Field(default=1, ge=1)
    total_price: float
    special_requests: Optional[str] = None

class BookingResponse(BaseModel):
    id: int
    booking_ref: str
    room_id: int
    guest_name: str
    guest_email: str
    guest_phone: str
    check_in_date: str
    check_out_date: str
    adults: int
    children: int
    total_nights: int
    total_price: float
    status: str
    special_requests: Optional[str] = None
    created_at: datetime.datetime
    room: Optional[RoomResponse] = None

    class Config:
        from_attributes = True

# Inquiry Schemas
class InquiryCreate(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    phone: Optional[str] = None
    subject: str = Field(default="Room Booking / Darshan Inquiry")
    message: str = Field(..., min_length=5)

class InquiryResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    subject: str
    message: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Health Response
class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    timestamp: datetime.datetime
