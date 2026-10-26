from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
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
    housekeeping_status: str = "Clean"

class RoomResponse(RoomBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class HousekeepingStatusUpdate(BaseModel):
    room_id: int
    housekeeping_status: str # Clean, Dirty, Inspected, Under_Maintenance
    updated_by: Optional[str] = "Head Housekeeper"

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

# --- Booking Payment Schemas ---
class BookingPaymentCreate(BaseModel):
    booking_ref: str
    payment_type: str = "Partial" # Advance, Partial, Settlement, Key_Deposit, Refund
    payment_mode: str = "UPI" # Cash, Card, UPI, Direct_BTC
    amount: float = Field(..., gt=0)
    transaction_ref: Optional[str] = None
    notes: Optional[str] = None
    collected_by: Optional[str] = "Front Desk Cashier"

class BookingPaymentResponse(BaseModel):
    id: int
    booking_id: int
    receipt_number: str
    payment_type: str
    payment_mode: str
    amount: float
    transaction_ref: Optional[str]
    notes: Optional[str]
    collected_by: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Room Shift Schemas ---
class RoomShiftCreate(BaseModel):
    booking_ref: str
    to_room_id: int
    reason: str = Field(..., min_length=3)
    shifted_by: Optional[str] = "Duty Manager"

class RoomShiftResponse(BaseModel):
    id: int
    booking_id: int
    from_room_id: int
    to_room_id: int
    shift_date: str
    reason: str
    old_rate: float
    new_rate: float
    shifted_by: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Room Folio (KOT & Sundry) Schemas ---
class RoomFolioItemCreate(BaseModel):
    booking_ref: str
    item_type: str = "Food_KOT" # Food_KOT, Extra_Mattress, Laundry, Beverage, Banquet
    description: str = Field(..., min_length=2)
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(..., gt=0)
    sac_code: Optional[str] = "996331" # 996331 for Food (5%), 996311 for Hotel (12%)
    kot_number: Optional[str] = None

class RoomFolioItemResponse(BaseModel):
    id: int
    booking_id: int
    item_type: str
    description: str
    sac_code: str
    kot_number: Optional[str]
    quantity: int
    unit_price: float
    taxable_amount: float
    gst_rate: float
    cgst_amount: float
    sgst_amount: float
    total_amount: float
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Police Register & Form C Schemas ---
class PoliceStationLogCreate(BaseModel):
    booking_ref: str
    guest_name: str
    age: int = 35
    gender: str = "Male"
    nationality: str = "Indian"
    id_proof_type: str = "Aadhaar Card"
    id_proof_number: str
    permanent_address: str
    origin_city: str
    next_destination: str
    purpose_of_visit: str = "Temple Darshan"
    vehicle_number: Optional[str] = None
    is_foreign_national: bool = False
    passport_number: Optional[str] = None
    visa_number: Optional[str] = None
    visa_validity: Optional[str] = None
    port_of_arrival: Optional[str] = None
    date_of_entry_india: Optional[str] = None

class PoliceStationLogResponse(BaseModel):
    id: int
    booking_id: int
    guest_name: str
    age: int
    gender: str
    nationality: str
    id_proof_type: str
    id_proof_number: str
    permanent_address: str
    origin_city: str
    next_destination: str
    purpose_of_visit: str
    vehicle_number: Optional[str]
    is_foreign_national: bool
    passport_number: Optional[str]
    visa_number: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

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
    status: str # Confirmed, Checked-In, Checked-Out, Cancelled, No-Show
    payment_status: Optional[str] = None # Pending, Partial, Paid, BTC
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
    total_paid: float
    balance_due: float
    key_deposit: float
    payment_status: str
    payment_method: str
    status: str
    special_requests: Optional[str] = None
    created_at: datetime.datetime
    room: Optional[RoomResponse] = None

    class Config:
        from_attributes = True

# --- Master Folio Invoice Schema ---
class MasterFolioResponse(BaseModel):
    hotel_name: str = "Hotel Sai Vasudev Residency"
    hotel_gstin: str = "37AAACH7409R1ZZ"
    hotel_phone: str = "+91 94402 89999 / +91 98480 12345"
    invoice_number: str
    booking_ref: str
    guest_name: str
    guest_phone: str
    id_proof_number: Optional[str]
    check_in_date: str
    check_out_date: str
    total_nights: int
    current_room: str
    
    # Financial Aggregations
    room_stay_charges: float
    room_gst_charges: float
    room_total: float
    food_kot_charges: float
    food_gst_charges: float
    food_total: float
    gross_bill_amount: float
    total_paid_amount: float
    net_balance_due: float
    
    # Detailed line items
    room_shifts: List[RoomShiftResponse]
    folio_items: List[RoomFolioItemResponse]
    payments: List[BookingPaymentResponse]
    payment_status: str
    status: str

# --- Daily Night Audit Schemas ---
class NightAuditRunRequest(BaseModel):
    audit_date: Optional[str] = None # Defaults to today YYYY-MM-DD
    audited_by: Optional[str] = "Night Auditor / Manager"

class NightAuditResponse(BaseModel):
    audit_date: str
    total_rooms_occupied: int
    total_room_revenue: float
    total_food_revenue: float
    total_gst_collected: float
    no_shows_processed: int
    cash_in_drawer: float
    card_total: float
    upi_total: float
    btc_credit_total: float
    total_day_collections: float
    audited_by: str
    audit_status: str
    created_at: datetime.datetime

# --- Tax Invoice & Voucher Details ---
class TaxInvoiceVoucher(BaseModel):
    hotel_name: str = "Hotel Sai Vasudev Residency"
    tagline: str = "Sanctuary of Peace, Comfort & Divine Hospitality"
    hotel_address: str = "Near Temple Road, Holy Pilgrimage Town, AP, India"
    hotel_phone: str = "+91 94402 89999 / +91 98480 12345"
    hotel_email: str = "reservations@hotelsai-vasudev.com"
    hotel_gstin: str = "37AAACH7409R1ZZ"
    sac_code: str = "996311"
    
    invoice_number: str
    invoice_date: str
    booking_ref: str
    guest_name: str
    guest_email: str
    guest_phone: str
    id_proof_type: Optional[str]
    room_name: str
    room_type: str
    check_in_date: str
    check_out_date: str
    total_nights: int
    adults: int
    children: int
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

# --- Master PMS Synchronization Schemas ---
class WalkInCheckInRequest(BaseModel):
    room_id: int
    guest_name: str = Field(..., min_length=2)
    guest_phone: str = Field(..., min_length=7)
    guest_email: Optional[EmailStr] = "walkin@hotelsai-vasudev.com"
    id_proof_type: str = "Aadhaar Card"
    id_proof_number: Optional[str] = "VERIFIED_AT_DESK"
    check_in_date: Optional[str] = None # Defaults to today YYYY-MM-DD
    check_out_date: str # YYYY-MM-DD
    adults: int = Field(default=2, ge=1)
    children: int = Field(default=0, ge=0)
    advance_amount: float = Field(default=0.0, ge=0)
    advance_payment_mode: str = "Cash" # Cash, UPI, Card
    advance_ref: Optional[str] = None
    special_requests: Optional[str] = None
    registered_by: Optional[str] = "Front Desk Officer"

class CheckOutRequest(BaseModel):
    booking_ref: str
    settlement_payment_mode: Optional[str] = "Cash" # Cash, Card, UPI, Direct_BTC
    settlement_amount_paid: Optional[float] = None
    transaction_ref: Optional[str] = None
    processed_by: Optional[str] = "Front Desk Officer"

class RoomMaintenanceRequest(BaseModel):
    room_id: int
    is_under_maintenance: bool
    reason: Optional[str] = "Routine sanitization / maintenance"
    updated_by: Optional[str] = "Property Manager"

class PmsDashboardSyncResponse(BaseModel):
    last_sync_timestamp: str
    total_rooms: int
    occupied_rooms: int
    dirty_rooms: int
    clean_rooms: int
    maintenance_rooms: int
    today_expected_arrivals: int
    today_expected_departures: int
    total_revenue_today: float
    total_cash_in_drawer: float
    total_upi_today: float
    unconfirmed_web_bookings_count: int
    rooms: List[RoomResponse]
    active_bookings: List[BookingResponse]

# --- Module 1 & 2 Schemas ---
class KotVoidRequest(BaseModel):
    kot_no: str
    item_name: str
    qty_voided: int = 1
    manager_pin: str
    void_reason: str
    steward_id: Optional[str] = "Steward"
    approving_manager_id: Optional[str] = "Duty Manager"

class TableShiftRequest(BaseModel):
    source_table: str
    target_table: str
    shifted_by: Optional[str] = "Steward / Cashier"

class TableMergeRequest(BaseModel):
    primary_table: str
    secondary_table: str
    merged_by: Optional[str] = "Restaurant Manager"

# --- Module 5 Schemas: Anti-Fraud & Housekeeping Discrepancy ---
class HousekeepingDiscrepancyCreate(BaseModel):
    room_no: str
    housekeeping_status: str # Vacant Dirty, Occupied
    reported_by: Optional[str] = "Housekeeping Staff"
    notes: Optional[str] = None

# --- Module 6 Schemas: RFID Key Card Access ---
class KeyCardEncodeRequest(BaseModel):
    card_uid: str
    room_no: str
    guest_name: str
    scheduled_checkout_time: str # ISO or YYYY-MM-DD HH:MM
    encoded_by: Optional[str] = "Front Desk"

class KeyCardExtendRequest(BaseModel):
    card_uid: str
    extended_checkout_time: str
    extension_fee_paid: float = 0.0
    payment_mode: str = "Cash"
    extended_by: Optional[str] = "Front Desk Officer"

# =========================================================================
# Decentro Banking & KYC Integration Schemas
# =========================================================================

class DecentroUpiQrRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Payment amount in INR")
    booking_id: Optional[int] = None
    kot_id: Optional[str] = None
    room_no: Optional[str] = None
    purpose_message: Optional[str] = "Hotel Sai Vasudev Residency Settlement"
    expiry_minutes: Optional[int] = 30

class DecentroUpiQrResponse(BaseModel):
    reference_id: str
    decentro_txn_id: Optional[str] = None
    amount: float
    qr_code_base64: str
    upi_intent_link: str
    status: str = "PENDING"
    expiry_time: Optional[str] = None
    message: str = "Dynamic UPI QR generated successfully"

class DecentroVirtualAccountRequest(BaseModel):
    corporate_name: str = Field(..., min_length=2, description="Corporate entity or guest name")
    corporate_client_id: Optional[str] = None
    booking_id: Optional[int] = None
    group_id: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None

class DecentroVirtualAccountResponse(BaseModel):
    reference_id: str
    account_number: str
    ifsc_code: str
    bank_name: str = "YES BANK"
    account_name: str
    upi_id: Optional[str] = None
    decentro_urn: Optional[str] = None
    status: str = "ACTIVE"
    message: str = "Dedicated Virtual Account created successfully"

class DecentroWebhookPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    decentro_txn_id: Optional[str] = None
    reference_id: Optional[str] = None
    transaction_status: str # SUCCESS, FAILURE, PENDING
    amount: Optional[float] = None
    bank_reference_number: Optional[str] = None # Bank UTR
    payer_vpa: Optional[str] = None
    timestamp: Optional[str] = None
    original_callback_data: Optional[Dict[str, Any]] = None

class DecentroGstinVerifyRequest(BaseModel):
    gstin: str = Field(..., min_length=15, max_length=15, description="15-digit Indian GST Identification Number")

class DecentroGstinVerifyResponse(BaseModel):
    success: bool
    gstin: str
    legal_name: str
    trade_name: str
    status: str
    state: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    message: Optional[str] = None

class PaymentTransactionResponse(BaseModel):
    id: int
    reference_id: str
    booking_id: Optional[int]
    kot_id: Optional[str]
    room_no: Optional[str]
    amount: float
    currency: str
    purpose_message: Optional[str]
    payment_method: str
    status: str
    bank_reference_number: Optional[str]
    payer_vpa: Optional[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True



