from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
import datetime

# --- Room Schemas ---
class RoomBase(BaseModel):
    name: str
    slug: str
    room_type: str
    price_per_night: float
    capacity: int = 2
    total_inventory: int = 5
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

# --- Availability Check ---
class AvailabilityCheckResponse(BaseModel):
    available: bool
    room_id: int
    room_name: str
    check_in_date: str
    check_out_date: str
    nights: int
    capacity: int
    adults: int
    base_rate_per_night: float
    base_subtotal: float
    extra_guest_charge: float
    taxable_amount: float
    gst_rate: float
    cgst_amount: float
    sgst_amount: float
    total_tax: float
    grand_total: float
    remaining_rooms_count: int
    message: str

# --- Booking Schemas ---
class BookingCreate(BaseModel):
    room_id: int
    guest_name: str = Field(..., min_length=2)
    guest_email: EmailStr
    guest_phone: str = Field(..., min_length=7)
    id_proof_type: Optional[str] = "Aadhaar Card"
    id_proof_number: Optional[str] = None
    check_in_date: str # YYYY-MM-DD
    check_out_date: str # YYYY-MM-DD
    adults: int = Field(default=2, ge=1)
    children: int = Field(default=0, ge=0)
    total_nights: Optional[int] = Field(default=None)
    payment_method: Optional[str] = "Pay at Hotel"
    special_requests: Optional[str] = None

class BookingStatusUpdate(BaseModel):
    status: str # Confirmed, Checked-In, Checked-Out, Cancelled
    payment_status: Optional[str] = None # Pending, Paid, Pay at Hotel
    cancellation_reason: Optional[str] = None

class BookingResponse(BaseModel):
    id: int
    booking_ref: str
    invoice_number: str
    room_id: int
    guest_name: str
    guest_email: str
    guest_phone: str
    id_proof_type: Optional[str] = "Aadhaar Card"
    id_proof_number: Optional[str] = None
    check_in_date: str
    check_out_date: str
    adults: int
    children: int
    total_nights: int
    base_rate: float
    base_amount: float
    extra_guest_charge: float
    gst_rate: float
    cgst_amount: float
    sgst_amount: float
    total_tax: float
    total_price: float
    payment_status: str
    payment_method: str
    status: str
    special_requests: Optional[str] = None
    created_at: datetime.datetime
    room: Optional[RoomResponse] = None

    class Config:
        from_attributes = True

# --- Tax Invoice & Voucher Details ---
class TaxInvoiceVoucher(BaseModel):
    hotel_name: str = "Hotel Sai Vasudev Residency"
    tagline: str = "Sanctuary of Peace, Comfort & Divine Hospitality"
    hotel_address: str = "Near Temple Road, Holy Pilgrimage Town, AP, India"
    hotel_phone: str = "+91 94402 89999 / +91 98480 12345"
    hotel_email: str = "reservations@hotelsai-vasudev.com"
    hotel_gstin: str = "37AAACH7409R1ZZ"
    sac_code: str = "996311" # Service Accounting Code for Hotel Accommodation
    
    invoice_number: str
    invoice_date: str
    booking_ref: str
    
    # Guest
    guest_name: str
    guest_email: str
    guest_phone: str
    id_proof_type: Optional[str]
    
    # Stay
    room_name: str
    room_type: str
    check_in_date: str
    check_out_date: str
    total_nights: int
    adults: int
    children: int
    
    # Accounting
    daily_tariff: float
    base_amount: float
    extra_guest_charge: float
    taxable_value: float
    gst_rate_percent: float
    cgst_amount: float
    sgst_amount: float
    total_tax_amount: float
    grand_total: float
    payment_status: str
    payment_method: str
    status: str

# --- Inquiry Schemas ---
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
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Health Response ---
class HealthResponse(BaseModel):
    status: str
    database: str
    engine: str
    timestamp: datetime.datetime
