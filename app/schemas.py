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

    model_config = ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True)

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
    id_document_key: Optional[str] = None

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
    id_document_key: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

# --- Booking Schemas ---
class BookingCreate(BaseModel):
    room_id: int
    guest_name: str = Field(..., min_length=2)
    guest_email: EmailStr
    guest_phone: str = Field(..., min_length=7)
    id_proof_type: Optional[str] = "Aadhaar Card"
    id_proof_number: Optional[str] = None
    id_proof_document_key: Optional[str] = None
    guest_photo_url: Optional[str] = None
    invoice_pdf_key: Optional[str] = None
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
    id_proof_document_key: Optional[str] = None
    guest_photo_url: Optional[str] = None
    invoice_pdf_key: Optional[str] = None
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

    model_config = ConfigDict(from_attributes=True)

# --- Master Folio Invoice Schema ---
class MasterFolioResponse(BaseModel):
    hotel_name: str = "SRI SAI VASUDEV RESIDENCY"
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
    hotel_name: str = "SRI SAI VASUDEV RESIDENCY"
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

    model_config = ConfigDict(from_attributes=True)

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
    coming_from: Optional[str] = None
    comingFrom: Optional[str] = None
    proceeding_to: Optional[str] = None
    proceedingTo: Optional[str] = None
    vehicle_no: Optional[str] = None
    vehicleNo: Optional[str] = None
    darshan_slot: Optional[str] = None
    darshanSlot: Optional[str] = None
    guest_gender: Optional[str] = None
    guestGender: Optional[str] = None
    guest_age: Optional[int] = None
    guestAge: Optional[int] = None

class PaymentSplitItem(BaseModel):
    mode: str  # Cash, UPI, Card, Direct_BTC, Cheque
    amount: float
    ref: Optional[str] = None
    note: Optional[str] = None

class CheckOutRequest(BaseModel):
    booking_ref: str
    settlement_payment_mode: Optional[str] = "Cash" # Cash, Card, UPI, Direct_BTC, Split
    settlement_amount_paid: Optional[float] = None
    transaction_ref: Optional[str] = None
    payment_splits: Optional[List[Dict[str, Any]]] = None
    processed_by: Optional[str] = "Front Desk Officer"

class RoomMaintenanceRequest(BaseModel):
    room_id: Optional[int] = None
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
class KotItemCreate(BaseModel):
    item_code: Optional[str] = None
    itemCode: Optional[str] = None
    item_name: Optional[str] = None
    itemName: Optional[str] = None
    qty: float = 1.0
    rate: float = 0.0
    amount: float = 0.0
    instruction: Optional[str] = None

class KotCreate(BaseModel):
    kot_no: Optional[str] = None
    kotNo: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    table_no: Optional[str] = None
    tableNo: Optional[str] = None
    room_no: Optional[str] = None
    roomNo: Optional[str] = None
    waiter_name: Optional[str] = "Captain"
    waiterName: Optional[str] = None
    guest_name: Optional[str] = None
    guestName: Optional[str] = None
    pax: int = 2
    items: Optional[List[Dict[str, Any]]] = []
    items_json: Optional[str] = None
    total_amount: Optional[float] = None
    totalAmount: Optional[float] = None
    status: Optional[str] = "Running"
    is_printed: Optional[bool] = True
    isPrinted: Optional[bool] = None

class KotResponse(BaseModel):
    id: int
    kot_no: str
    date: str
    time: str
    table_no: Optional[str] = None
    room_no: Optional[str] = None
    waiter_name: Optional[str] = None
    guest_name: Optional[str] = None
    pax: int = 2
    items: List[Dict[str, Any]] = []
    total_amount: float = 0.0
    status: str = "Running"
    is_printed: bool = True
    created_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

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
    card_uid: Optional[str] = None
    card_number: Optional[str] = None
    room_no: Optional[str] = None
    room_number: Optional[str] = None
    guest_name: Optional[str] = "Valued Guest"
    scheduled_checkout_time: Optional[str] = None
    check_out_time: Optional[str] = None
    encoded_by: Optional[str] = "Front Desk"
    operator_name: Optional[str] = None

class KeyCardExtendRequest(BaseModel):
    card_uid: Optional[str] = None
    card_number: Optional[str] = None
    extended_checkout_time: Optional[str] = None
    check_out_time: Optional[str] = None
    extension_fee_paid: float = 0.0
    payment_mode: str = "Cash"
    extended_by: Optional[str] = "Front Desk Officer"
    operator_name: Optional[str] = None

# =========================================================================
# Decentro Banking & KYC Integration Schemas
# =========================================================================

class DecentroUpiQrRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Payment amount in INR")
    booking_id: Optional[int] = None
    kot_id: Optional[str] = None
    room_no: Optional[str] = None
    purpose_message: Optional[str] = "SRI SAI VASUDEV RESIDENCY Settlement"
    expiry_minutes: Optional[int] = 30

class DecentroUpiQrResponse(BaseModel):
    reference_id: str
    decentro_txn_id: Optional[str] = None
    amount: float
    qr_code_base64: Optional[str] = ""
    upi_intent_link: Optional[str] = ""
    status: str = "PENDING"
    expiry_time: Optional[str] = None
    message: str = "Dynamic UPI QR generated successfully"
    decentro_unavailable: Optional[bool] = False
    fallback_mode: Optional[str] = None

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

    model_config = ConfigDict(from_attributes=True)

# --- New Enterprise Operations Schemas ---

class FoodBillCreate(BaseModel):
    bill_no: Optional[str] = None
    billNo: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    room_no: Optional[str] = None
    roomNo: Optional[str] = None
    table_no: Optional[str] = None
    tableNo: Optional[str] = None
    guest_name: Optional[str] = None
    guestName: Optional[str] = None
    kot_numbers: Optional[List[str]] = []
    kot_numbers_json: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = []
    items_json: Optional[str] = None
    food_gross_amount: float = 0.0
    foodGrossAmount: Optional[float] = None
    discount_percent: float = 0.0
    discount_amount: float = 0.0
    taxable_amount: float = 0.0
    gst_percent: Optional[float] = None
    cgst_amount: Optional[float] = None
    sgst_amount: Optional[float] = None
    gst_amount: float = 0.0
    net_bill_amount: float = 0.0
    netBillAmount: Optional[float] = None
    settlement_type: Optional[str] = None
    settlementType: Optional[str] = None
    discount_reason: Optional[str] = None
    discountReason: Optional[str] = None
    payment_ref: Optional[str] = None
    paymentRef: Optional[str] = None
    payment_splits: Optional[List[Dict[str, Any]]] = None
    paymentSplits: Optional[List[Dict[str, Any]]] = None
    payment_splits_json: Optional[str] = None
    billed_by: Optional[str] = "Cashier"
    billedBy: Optional[str] = None
    status: Optional[str] = "Settled"

class FoodBillResponse(BaseModel):
    id: int
    bill_no: str
    date: str
    time: str
    room_no: Optional[str] = None
    table_no: Optional[str] = None
    guest_name: Optional[str] = None
    kot_numbers_json: Optional[str] = "[]"
    items_json: Optional[str] = "[]"
    food_gross_amount: float = 0.0
    discount_percent: Optional[float] = 0.0
    discount_amount: float = 0.0
    taxable_amount: float = 0.0
    cgst_amount: Optional[float] = 0.0
    sgst_amount: Optional[float] = 0.0
    gst_amount: float = 0.0
    net_bill_amount: float = 0.0
    settlement_type: str = "Cash"
    payment_splits_json: Optional[str] = "[]"
    discount_reason: Optional[str] = None
    payment_ref: Optional[str] = None
    billed_by: Optional[str] = "Cashier"
    status: str = "Settled"
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class PettyExpenseCreate(BaseModel):
    expense_no: Optional[str] = None
    date: str
    category: str
    amount: float
    payment_mode: str = "Cash"
    paid_to: str
    description: Optional[str] = None
    bill_number: Optional[str] = None
    approved_by: Optional[str] = "General Manager"

class PettyExpenseResponse(BaseModel):
    id: int
    expense_no: str
    date: str
    category: str
    amount: float
    payment_mode: str
    paid_to: str
    description: Optional[str]
    bill_number: Optional[str]
    approved_by: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class FolioDiscountCreate(BaseModel):
    booking_ref: str
    room_no: Optional[str] = None
    discount_type: Optional[str] = "flat" # flat, percent
    discount_value: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    discount_percentage: Optional[float] = None
    discount_reason: Optional[str] = None
    reason: Optional[str] = None
    approved_by: Optional[str] = "General Manager"

class FolioDiscountResponse(BaseModel):
    id: int
    booking_ref: str
    room_no: str
    discount_type: str
    discount_value: float
    discount_amount: float
    reason: Optional[str]
    approved_by: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class InventoryPurchaseCreate(BaseModel):
    bill_no: str
    bill_date: str
    godown: Optional[str] = "Main Kitchen Store"
    supplier_name: Optional[str] = None
    account_name: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = None
    items_json: Optional[str] = None
    total_amount: Optional[float] = 0.0
    total_gross_amount: Optional[float] = 0.0
    tax_amount: Optional[float] = 0.0
    total_tax: Optional[float] = 0.0
    net_amount: Optional[float] = 0.0
    total_net_value: Optional[float] = 0.0
    total_discount: Optional[float] = 0.0
    remarks: Optional[str] = None
    terms: Optional[str] = "Credit"

class InventoryPurchaseResponse(BaseModel):
    id: int
    bill_no: str
    bill_date: str
    godown: str
    supplier_name: str
    total_amount: float
    tax_amount: float
    net_amount: float
    terms: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class KotVoidRequest(BaseModel):
    table_session_id: Optional[str] = None
    kot_no: Optional[str] = None
    kot_number: Optional[str] = None
    table_no: Optional[str] = None
    table_number: Optional[str] = None
    room_number: Optional[str] = None
    item_name: str
    qty_voided: Optional[int] = 1
    quantity: Optional[int] = None
    rate: Optional[float] = 0.0
    amount: Optional[float] = 0.0
    steward_id: Optional[str] = "Steward"
    approving_manager_id: Optional[str] = "Duty Manager"
    voided_by: Optional[str] = None
    manager_pin: Optional[str] = "9999"
    void_reason: str

class TableShiftRequest(BaseModel):
    from_table_code: Optional[str] = None
    to_table_code: Optional[str] = None
    from_table: Optional[str] = None
    to_table: Optional[str] = None
    source_table: Optional[str] = None
    target_table: Optional[str] = None
    table_session_id: Optional[str] = None
    steward_id: Optional[str] = "Captain"
    shifted_by: Optional[str] = None
    notes: Optional[str] = None

class TableMergeRequest(BaseModel):
    primary_table_code: Optional[str] = None
    secondary_table_codes: Optional[List[str]] = None
    primary_table: Optional[str] = None
    secondary_table: Optional[str] = None
    source_table: Optional[str] = None
    target_table: Optional[str] = None
    primary_session_id: Optional[str] = None
    merged_by: Optional[str] = "Captain"

class GroupBookingCreate(BaseModel):
    group_id: Optional[str] = None
    groupId: Optional[str] = None
    group_name: Optional[str] = None
    groupName: Optional[str] = None
    contact_person: Optional[str] = None
    contactPerson: Optional[str] = None
    contact_phone: Optional[str] = None
    contactPhone: Optional[str] = None
    booking_source: Optional[str] = "Direct Phone Reservation"
    bookingSource: Optional[str] = None
    check_in_date: Optional[str] = None
    checkInDate: Optional[str] = None
    check_out_date: Optional[str] = None
    checkOutDate: Optional[str] = None
    advance_paid: Optional[float] = 0.0
    advancePaid: Optional[float] = 0.0
    balance_due: Optional[float] = 0.0
    balanceDue: Optional[float] = 0.0
    total_amount: Optional[float] = 0.0
    rooms_allocated: Optional[List[str]] = None
    roomsAllocated: Optional[List[str]] = None
    rooms_allocated_json: Optional[str] = None
    guests: Optional[List[Dict[str, Any]]] = None
    guests_json: Optional[str] = None
    special_instructions: Optional[str] = None
    specialInstructions: Optional[str] = None
    status: Optional[str] = "Confirmed"

class GroupBookingResponse(BaseModel):
    id: int
    group_id: str
    group_name: str
    contact_person: str
    contact_phone: str
    booking_source: str
    check_in_date: str
    check_out_date: str
    advance_paid: float
    balance_due: float
    total_amount: float
    rooms_allocated: List[str]
    guests: List[Dict[str, Any]]
    special_instructions: Optional[str]
    status: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class CheckoutRecordCreate(BaseModel):
    invoice_no: Optional[str] = None
    invoiceNo: Optional[str] = None
    room_no: Optional[str] = None
    roomNo: Optional[str] = None
    room_type: Optional[str] = "DELUXE"
    roomType: Optional[str] = None
    guest_name: Optional[str] = None
    guestName: Optional[str] = None
    guest_phone: Optional[str] = None
    guestPhone: Optional[str] = None
    check_in_date: Optional[str] = None
    checkInDate: Optional[str] = None
    check_in_time: Optional[str] = None
    checkInTime: Optional[str] = None
    check_out_date: Optional[str] = None
    checkOutDate: Optional[str] = None
    check_out_time: Optional[str] = None
    checkOutTime: Optional[str] = None
    calculation_type: Optional[str] = "12hour"
    calculationType: Optional[str] = None
    number_of_days: Optional[int] = 1
    numberOfDays: Optional[int] = None
    per_day_tariff: Optional[float] = 0.0
    perDayTariff: Optional[float] = None
    total_room_rent: Optional[float] = 0.0
    totalRoomRent: Optional[float] = None
    food_amount: Optional[float] = 0.0
    foodAmount: Optional[float] = None
    gst_percent: Optional[float] = 12.0
    gstPercent: Optional[float] = None
    gst_amount: Optional[float] = 0.0
    gstAmount: Optional[float] = None
    cgst_amount: Optional[float] = 0.0
    cgstAmount: Optional[float] = None
    sgst_amount: Optional[float] = 0.0
    sgstAmount: Optional[float] = None
    add_others: Optional[float] = 0.0
    addOthers: Optional[float] = None
    less_discount: Optional[float] = 0.0
    lessDiscount: Optional[float] = None
    advance_deducted: Optional[float] = 0.0
    advanceDeducted: Optional[float] = None
    bill_amount: Optional[float] = 0.0
    billAmount: Optional[float] = None
    net_payable: Optional[float] = 0.0
    netPayable: Optional[float] = None
    payment_mode: Optional[str] = "Cash"
    paymentMode: Optional[str] = None
    payments: Optional[List[Dict[str, Any]]] = None
    payments_json: Optional[str] = None
    payment_splits: Optional[List[Dict[str, Any]]] = None
    paymentSplits: Optional[List[Dict[str, Any]]] = None
    payment_splits_json: Optional[str] = None
    settled_by_user_id: Optional[str] = None
    settledByUserId: Optional[str] = None
    round_off_amount: Optional[float] = 0.0
    roundOffAmount: Optional[float] = None
    is_cancelled: Optional[bool] = False
    cancellation_reason: Optional[str] = None
    checkout_remark: Optional[str] = None
    checkoutRemark: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    pin_code: Optional[str] = None
    pinCode: Optional[str] = None
    sac_code: Optional[str] = "996311"
    sacCode: Optional[str] = None
    invoice_format: Optional[str] = "A4_Standard"
    invoiceFormat: Optional[str] = None

class AdvanceReceiptCreate(BaseModel):
    receipt_no: Optional[str] = None
    receiptNo: Optional[str] = None
    voucher_no: Optional[str] = None
    voucherNo: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    voucher_name: Optional[str] = "Advance_Receipt"
    voucherName: Optional[str] = None
    room_no: Optional[str] = None
    roomNo: Optional[str] = None
    guest_name: Optional[str] = None
    guestName: Optional[str] = None
    mobile: Optional[str] = None
    amount: Optional[float] = 0.0
    payment_mode: Optional[str] = "Cash"
    paymentMode: Optional[str] = None
    transaction_ref: Optional[str] = None
    transactionRef: Optional[str] = None
    is_settled_in_checkout: Optional[bool] = False
    remark: Optional[str] = None

class JournalLeg(BaseModel):
    account_name: str
    entry_type: str = "Dr"  # Dr or Cr
    amount: float = Field(..., gt=0)
    narration: Optional[str] = None

class JournalEntryCreate(BaseModel):
    entry_id: Optional[str] = None
    entryId: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    voucher_type: Optional[str] = "Manual"
    voucherType: Optional[str] = None
    reference_no: Optional[str] = None
    referenceNo: Optional[str] = None
    narration: str
    debit_account: Optional[str] = None
    debitAccount: Optional[str] = None
    credit_account: Optional[str] = None
    creditAccount: Optional[str] = None
    amount_paise: Optional[int] = 0
    amountPaise: Optional[int] = None
    amount_rupees: Optional[float] = 0.0
    amountRupees: Optional[float] = None
    posted_by: Optional[str] = "Front Desk Mgr"
    postedBy: Optional[str] = None
    legs: Optional[List[JournalLeg]] = None
    entries: Optional[List[JournalLeg]] = None

class PartySettlementRequest(BaseModel):
    amount: float = Field(..., gt=0)
    payment_mode: str = "Cash"  # Cash, UPI, Card, Bank Transfer, Cheque
    reference_no: Optional[str] = None
    discount_allowed: Optional[float] = 0.0
    narration: Optional[str] = None
    manager_pin: Optional[str] = None
    staff_name: Optional[str] = "Accounts Officer"

class PartyAccountCreate(BaseModel):
    id: Optional[str] = None
    name: str
    mobile: Optional[str] = None
    category: Optional[str] = "General"
    balance: Optional[float] = 0.0
    balance_type: Optional[str] = "Dr"
    balanceType: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None

class GeneralReceiptCreate(BaseModel):
    id: Optional[str] = None
    s_no: Optional[int] = 1
    sNo: Optional[int] = None
    voucher_name: Optional[str] = "Receipts"
    voucherName: Optional[str] = None
    receipt_no: Optional[str] = None
    receiptNo: Optional[str] = None
    voucher_no: Optional[int] = 1
    voucherNo: Optional[int] = None
    date: Optional[str] = None
    payment_mode: Optional[str] = "Cash"
    paymentMode: Optional[str] = None
    account_name: Optional[str] = None
    accountName: Optional[str] = None
    account_mobile: Optional[str] = None
    accountMobile: Optional[str] = None
    amount: float
    remark: Optional[str] = None

class GeneralPaymentCreate(BaseModel):
    id: Optional[str] = None
    s_no: Optional[int] = 1
    sNo: Optional[int] = None
    voucher_name: Optional[str] = "Payments"
    voucherName: Optional[str] = None
    payment_no: Optional[str] = None
    paymentNo: Optional[str] = None
    voucher_no: Optional[int] = 1
    voucherNo: Optional[int] = None
    date: Optional[str] = None
    payment_mode: Optional[str] = "Cash"
    paymentMode: Optional[str] = None
    account_name: Optional[str] = None
    accountName: Optional[str] = None
    account_mobile: Optional[str] = None
    accountMobile: Optional[str] = None
    amount: float
    remark: Optional[str] = None

class GodownCreate(BaseModel):
    id: Optional[str] = None
    godown_id: Optional[str] = None
    godownId: Optional[str] = None
    s_no: Optional[int] = 1
    sNo: Optional[int] = None
    name: str
    address: Optional[str] = None

class ItemGroupCreate(BaseModel):
    id: Optional[str] = None
    group_id: Optional[str] = None
    groupId: Optional[str] = None
    s_no: Optional[int] = 1
    sNo: Optional[int] = None
    name: str
    head_group: Optional[str] = "Raw_Material"
    headGroup: Optional[str] = None
    no_discount: Optional[bool] = False
    noDiscount: Optional[bool] = None

class StockTransferCreate(BaseModel):
    id: Optional[str] = None
    entry_no: Optional[str] = None
    entryNo: Optional[str] = None
    date: Optional[str] = None
    from_godown: Optional[str] = None
    fromGodown: Optional[str] = None
    to_godown: Optional[str] = None
    toGodown: Optional[str] = None
    bill_date: Optional[str] = None
    billDate: Optional[str] = None
    bill_no: Optional[str] = None
    billNo: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = None
    items_json: Optional[str] = None
    total_qty: Optional[float] = 0.0
    totalQty: Optional[float] = None
    total_amount: Optional[float] = 0.0
    totalAmount: Optional[float] = None
    total_discount: Optional[float] = 0.0
    totalDiscount: Optional[float] = None
    total_taxable: Optional[float] = 0.0
    totalTaxable: Optional[float] = None
    total_gst_amt: Optional[float] = 0.0
    totalGstAmt: Optional[float] = None
    total_net_value: Optional[float] = 0.0
    totalNetValue: Optional[float] = None
    remark: Optional[str] = None
    status: Optional[str] = "ISSUED"  # ISSUED, PENDING, REJECTED
    allow_negative_override: Optional[bool] = False
    override_reason: Optional[str] = None
    manager_pin: Optional[str] = None

class RequisitionActionRequest(BaseModel):
    entry_no: str
    action: str  # ISSUE, REJECT
    reason: Optional[str] = None
    manager_pin: Optional[str] = None

class UserAccountCreate(BaseModel):
    id: Optional[int] = None
    userId: Optional[int] = None
    s_no: Optional[int] = 1
    sNo: Optional[int] = None
    firm_id: Optional[str] = "SVR0001"
    firmId: Optional[str] = None
    user_name: Optional[str] = None
    userName: Optional[str] = None
    email_id: Optional[str] = None
    emailId: Optional[str] = None
    role_id: Optional[int] = 2
    roleId: Optional[int] = None
    role_name: Optional[str] = "Front Office"
    roleName: Optional[str] = None
    status: Optional[str] = "Active"
    department: Optional[str] = None
    shift: Optional[str] = None
    mobile: Optional[str] = None
    is_on_duty: Optional[bool] = True
    isOnDuty: Optional[bool] = None

class StaffPasswordResetRequest(BaseModel):
    new_password: str
    confirm_password: Optional[str] = None

class CommissionAgentCreate(BaseModel):
    id: Optional[str] = None
    agent_id: Optional[str] = None
    agentId: Optional[str] = None
    name: str
    phone: str
    alternate_phone: Optional[str] = None
    alternatePhone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = "Rayagada"
    address: Optional[str] = None
    agent_type: Optional[str] = "Travel Agent"
    agentType: Optional[str] = None
    commission_type: Optional[str] = "PERCENTAGE_ROOM_ONLY"
    commissionType: Optional[str] = None
    default_rate: Optional[float] = 10.0
    defaultRate: Optional[float] = None
    pan_number: Optional[str] = None
    panNumber: Optional[str] = None
    gst_number: Optional[str] = None
    gstNumber: Optional[str] = None
    total_bookings: Optional[int] = 0
    totalBookings: Optional[int] = None
    total_revenue_generated: Optional[float] = 0.0
    totalRevenueGenerated: Optional[float] = None
    total_commission_earned: Optional[float] = 0.0
    totalCommissionEarned: Optional[float] = None
    total_commission_paid: Optional[float] = 0.0
    totalCommissionPaid: Optional[float] = None
    balance_payable: Optional[float] = 0.0
    balancePayable: Optional[float] = None

class AgentPayoutVoucherCreate(BaseModel):
    id: Optional[str] = None
    voucher_no: Optional[str] = None
    voucherNo: Optional[str] = None
    voucher_date: Optional[str] = None
    voucherDate: Optional[str] = None
    agent_id: Optional[str] = None
    agentId: Optional[str] = None
    agent_name: Optional[str] = None
    agentName: Optional[str] = None
    amount: float
    payment_mode: Optional[str] = "CASH"
    paymentMode: Optional[str] = None
    reference_no: Optional[str] = None
    referenceNo: Optional[str] = None
    commission_ids: Optional[List[str]] = None
    commissionIds: Optional[List[str]] = None
    settled_commission_ids_json: Optional[str] = None
    tds_deducted: Optional[float] = 0.0
    tdsDeducted: Optional[float] = None
    gross_amount: Optional[float] = None
    grossAmount: Optional[float] = None
    notes: Optional[str] = None
    created_by: Optional[str] = "Accounts"
    createdBy: Optional[str] = None

class ShiftHandoverCreate(BaseModel):
    shift_id: Optional[str] = None
    shiftId: Optional[str] = None
    shift_date: Optional[str] = None
    shiftDate: Optional[str] = None
    shift_time: Optional[str] = None
    shiftTime: Optional[str] = None
    user_email: Optional[str] = None
    userEmail: Optional[str] = None
    user_name: Optional[str] = None
    userName: Optional[str] = None
    shift_type: Optional[str] = "Morning"
    shiftType: Optional[str] = None
    opening_drawer_cash: Optional[float] = 5000.0
    openingDrawerCash: Optional[float] = None
    room_cash_collected: Optional[float] = 0.0
    roomCashCollected: Optional[float] = None
    food_cash_collected: Optional[float] = 0.0
    foodCashCollected: Optional[float] = None
    advance_cash_collected: Optional[float] = 0.0
    advanceCashCollected: Optional[float] = None
    expenses_paid_from_drawer: Optional[float] = 0.0
    expensesPaidFromDrawer: Optional[float] = None
    drawer_drops_to_safe: Optional[float] = 0.0
    drawerDropsToSafe: Optional[float] = None
    paid_in_drawer_float: Optional[float] = 0.0
    paidInDrawerFloat: Optional[float] = None
    cash_refunds_paid: Optional[float] = 0.0
    cashRefundsPaid: Optional[float] = None
    net_physical_cash_in_drawer: Optional[float] = 5000.0
    netPhysicalCashInDrawer: Optional[float] = None
    online_upi_verified: Optional[float] = 0.0
    onlineUpiVerified: Optional[float] = None
    card_swipe_verified: Optional[float] = 0.0
    cardSwipeVerified: Optional[float] = None
    credit_accounts_added: Optional[float] = 0.0
    creditAccountsAdded: Optional[float] = None
    total_transactions_handled: Optional[int] = 0
    totalTransactionsHandled: Optional[int] = None
    handover_to_user: Optional[str] = None
    handoverToUser: Optional[str] = None
    handover_notes: Optional[str] = None
    handoverNotes: Optional[str] = None
    status: Optional[str] = "Verified & Closed"

class CashDrawerMovementCreate(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    shift_id: Optional[str] = None
    movement_type: str  # DROP_TO_SAFE, FLOAT_TOPUP, PETTY_PAYOUT
    amount: float
    cashier_name: str
    authorized_by: Optional[str] = None
    manager_pin: Optional[str] = None
    reason: str
    destination_or_source: Optional[str] = "Property Safe"

class CashDrawerMovementResponse(BaseModel):
    id: int
    voucher_no: str
    date: str
    time: str
    shift_id: Optional[str] = None
    movement_type: str
    amount: float
    amount_paise: int
    cashier_name: str
    authorized_by: Optional[str] = None
    manager_pin_verified: bool
    reason: str
    destination_or_source: str
    journal_entry_id: Optional[str] = None
    created_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

class BanquetVenueCreate(BaseModel):
    id: Optional[str] = None
    venue_id: Optional[str] = None
    venueId: Optional[str] = None
    name: str
    type: Optional[str] = "Banquet Hall"
    base_tariff: Optional[float] = 50000.0
    baseTariff: Optional[float] = None
    gst_percent: Optional[float] = 18.0
    gstPercent: Optional[float] = None
    capacity_pax_min: Optional[int] = 50
    capacityPaxMin: Optional[int] = None
    capacity_pax_max: Optional[int] = 500
    capacityPaxMax: Optional[int] = None
    sq_ft_area: Optional[float] = 5000.0
    sqFtArea: Optional[float] = None
    floor: Optional[str] = "Ground Floor"
    amenities: Optional[List[str]] = None
    amenities_json: Optional[str] = None
    status: Optional[str] = "vacant"
    cleaning_status: Optional[str] = "Ready"
    cleaningStatus: Optional[str] = None
    sac_code: Optional[str] = "996311"
    sacCode: Optional[str] = None

class BanquetBookingCreate(BaseModel):
    id: Optional[str] = None
    booking_no: Optional[str] = None
    bookingNo: Optional[str] = None
    event_name: Optional[str] = None
    eventName: Optional[str] = None
    event_type: Optional[str] = "Wedding / Reception"
    eventType: Optional[str] = None
    host_name: Optional[str] = None
    hostName: Optional[str] = None
    contact_person: Optional[str] = None
    contactPerson: Optional[str] = None
    contact_mobile: Optional[str] = None
    contactMobile: Optional[str] = None
    contact_email: Optional[str] = None
    contactEmail: Optional[str] = None
    venue_id: Optional[str] = None
    venueId: Optional[str] = None
    venue_name: Optional[str] = None
    venueName: Optional[str] = None
    venue_tariff: Optional[float] = 0.0
    venueTariff: Optional[float] = None
    booking_date: Optional[str] = None
    bookingDate: Optional[str] = None
    event_date: Optional[str] = None
    eventDate: Optional[str] = None
    check_in_date: Optional[str] = None
    checkInDate: Optional[str] = None
    check_out_date: Optional[str] = None
    checkOutDate: Optional[str] = None
    guaranteed_pax: Optional[int] = 100
    guaranteedPax: Optional[int] = None
    actual_pax_served: Optional[int] = 100
    actualPaxServed: Optional[int] = None
    per_plate_rate: Optional[float] = 0.0
    perPlateRate: Optional[float] = None
    total_food_amount: Optional[float] = 0.0
    totalFoodAmount: Optional[float] = None
    grand_total: Optional[float] = 0.0
    grandTotal: Optional[float] = None
    advance_paid: Optional[float] = 0.0
    advancePaid: Optional[float] = None
    balance_due: Optional[float] = 0.0
    balanceDue: Optional[float] = None
    status: Optional[str] = "Confirmed"
    financial_summary: Optional[Dict[str, Any]] = None
    financialSummary: Optional[Dict[str, Any]] = None
    financial_summary_json: Optional[str] = None
    kots: Optional[List[Dict[str, Any]]] = None
    kots_json: Optional[str] = None
    payments: Optional[List[Dict[str, Any]]] = None
    payments_json: Optional[str] = None
    linked_rooms: Optional[List[str]] = None
    linkedRooms: Optional[List[str]] = None
    linked_rooms_json: Optional[str] = None
    seating_layout: Optional[str] = "Standard Banquet"
    seatingLayout: Optional[str] = None

class BanquetKotCreate(BaseModel):
    kot_no: Optional[str] = None
    kotNo: Optional[str] = None
    date_time: Optional[str] = None
    dateTime: Optional[str] = None
    service_type: Optional[str] = "Banquet"
    serviceType: Optional[str] = None
    room_or_venue: Optional[str] = None
    roomOrVenue: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = []
    total_amount: Optional[float] = None
    totalAmount: Optional[float] = None

class BanquetPaymentCreate(BaseModel):
    id: Optional[str] = None
    date: Optional[str] = None
    type: Optional[str] = "Pre-Function Installment"
    mode: Optional[str] = "Online"
    amount: float = 0.0
    reference_no: Optional[str] = None
    referenceNo: Optional[str] = None
    remark: Optional[str] = None

class BanquetBookingResponse(BaseModel):
    id: int
    booking_no: str
    event_name: str
    event_type: str
    host_name: str
    contact_person: str
    contact_mobile: str
    contact_email: Optional[str] = None
    venue_id: str
    venue_name: str
    venue_tariff: float
    booking_date: str
    event_date: str
    guaranteed_pax: int
    actual_pax_served: int
    per_plate_rate: float
    total_food_amount: float
    grand_total: float
    advance_paid: float
    balance_due: float
    status: str
    financial_summary: Dict[str, Any] = {}
    kots: List[Dict[str, Any]] = []
    payments: List[Dict[str, Any]] = []
    linked_rooms: List[str] = []
    seating_layout: str = "Standard Banquet"
    created_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

class LiquorItemCreate(BaseModel):
    id: Optional[str] = None
    item_code: Optional[str] = None
    itemCode: Optional[str] = None
    s_no: Optional[int] = 1
    sNo: Optional[int] = None
    name: str
    brand_name: Optional[str] = None
    brandName: Optional[str] = None
    barcode_no: Optional[str] = None
    barcodeNo: Optional[str] = None
    group: Optional[str] = "Liquor"
    mrp: Optional[float] = 0.0
    rate: Optional[float] = 0.0
    purchase_rate: Optional[float] = 0.0
    purchaseRate: Optional[float] = None
    unit: Optional[str] = "30 ml"
    conversion_ml: Optional[float] = 30.0
    conversionMl: Optional[float] = None
    tax_type: Optional[str] = "VAT 13%"
    taxType: Optional[str] = None
    vat_percentage: Optional[float] = 13.0
    vatPercentage: Optional[float] = None
    surcharge_percentage: Optional[float] = 10.0
    surchargePercentage: Optional[float] = None
    active: Optional[bool] = True

class BarInvoiceCreate(BaseModel):
    id: Optional[str] = None
    bill_no: Optional[str] = None
    billNo: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    table_no: Optional[str] = "Bar Counter"
    tableNo: Optional[str] = None
    kot_no: Optional[str] = None
    kotNo: Optional[str] = None
    service_type: Optional[str] = "Bar Counter"
    serviceType: Optional[str] = None
    guest_name: Optional[str] = None
    guestName: Optional[str] = None
    guest_mobile: Optional[str] = None
    guestMobile: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = None
    items_json: Optional[str] = None
    total_items: Optional[int] = 1
    totalItems: Optional[int] = None
    total_quantity: Optional[float] = 1.0
    totalQuantity: Optional[float] = None
    basic_amount: Optional[float] = 0.0
    basicAmount: Optional[float] = None
    vat_amount: Optional[float] = 0.0
    vatAmount: Optional[float] = None
    surcharge_amount: Optional[float] = 0.0
    surchargeAmount: Optional[float] = None
    grand_total: Optional[float] = 0.0
    grandTotal: Optional[float] = None
    settled: Optional[bool] = True
    payment_mode: Optional[str] = "CASH"
    paymentMode: Optional[str] = None
    room_no: Optional[str] = None
    roomNo: Optional[str] = None

class HotelAssetCreate(BaseModel):
    id: Optional[str] = None
    asset_id: Optional[str] = None
    assetId: Optional[str] = None
    asset_name: Optional[str] = None
    assetName: Optional[str] = None
    category: Optional[str] = "Linen"
    unit: Optional[str] = "Pcs"
    total_purchased: Optional[float] = 0.0
    totalPurchased: Optional[float] = None
    in_rooms: Optional[float] = 0.0
    inRooms: Optional[float] = None
    in_linen_store: Optional[float] = 0.0
    inLinenStore: Optional[float] = None
    in_laundry: Optional[float] = 0.0
    inLaundry: Optional[float] = None
    in_damaged_repair: Optional[float] = 0.0
    inDamagedRepair: Optional[float] = None
    missing_discrepancy: Optional[float] = 0.0
    missingDiscrepancy: Optional[float] = None
    unit_cost: Optional[float] = 0.0
    unitCost: Optional[float] = None
    last_audit_date: Optional[str] = None
    lastAuditDate: Optional[str] = None

class LockerCreate(BaseModel):
    id: Optional[str] = None
    locker_no: Optional[str] = None
    lockerNo: Optional[str] = None
    locker_size: Optional[str] = "Medium"
    lockerSize: Optional[str] = None
    daily_rate: Optional[float] = 100.0
    dailyRate: Optional[float] = None
    status: Optional[str] = "Vacant"
    assigned_guest_name: Optional[str] = None
    assignedGuestName: Optional[str] = None
    assigned_room_no: Optional[str] = None
    assignedRoomNo: Optional[str] = None
    key_number: Optional[str] = "K-101"
    keyNumber: Optional[str] = None
    security_deposit: Optional[float] = 500.0
    securityDeposit: Optional[float] = None

class WhatsAppLogCreate(BaseModel):
    id: Optional[str] = None
    log_id: Optional[str] = None
    timestamp_str: Optional[str] = None
    timestamp: Optional[str] = None
    recipient_mobile: Optional[str] = None
    recipientMobile: Optional[str] = None
    recipient_name: Optional[str] = None
    recipientName: Optional[str] = None
    recipient_type: Optional[str] = "Guest"
    recipientType: Optional[str] = None
    voucher_type: Optional[str] = "Check-In"
    voucherType: Optional[str] = None
    voucher_no: Optional[str] = None
    voucherNo: Optional[str] = None
    room_no: Optional[str] = None
    roomNo: Optional[str] = None
    message: str
    status: Optional[str] = "Sent"
    firm_id: Optional[str] = "SVR0001"
    firmId: Optional[str] = None

class WhatsAppConfigCreate(BaseModel):
    api_url: Optional[str] = "https://api.whatsapp-gateway.com/v1"
    apiUrl: Optional[str] = None
    instance_id: Optional[str] = "SVR_WHATSAPP_INST_01"
    instanceId: Optional[str] = None
    token: Optional[str] = "waba_token_svr_live_2026"
    owner_mobile: Optional[str] = "9440289999"
    ownerMobile: Optional[str] = None
    validity_date: Optional[str] = "2026-12-31"
    validityDate: Optional[str] = None
    auto_send_on_checkin: Optional[bool] = True
    autoSendOnCheckIn: Optional[bool] = None
    auto_send_on_checkout: Optional[bool] = True
    autoSendOnCheckOut: Optional[bool] = None
    auto_send_on_booking: Optional[bool] = True
    autoSendOnBooking: Optional[bool] = None
    auto_send_on_food_bill: Optional[bool] = True
    autoSendOnFoodBill: Optional[bool] = None

class SupportTicketCreate(BaseModel):
    id: Optional[str] = None
    ticket_no: Optional[str] = None
    ticketNo: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    staff_name: Optional[str] = None
    staffName: Optional[str] = None
    department: Optional[str] = "Front Office"
    phone: Optional[str] = "9440289999"
    category: Optional[str] = "Billing & Checkout"
    priority: Optional[str] = "Medium"
    subject: str
    description: str
    status: Optional[str] = "Open"
    assigned_engineer: Optional[str] = None
    assignedEngineer: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolutionNotes: Optional[str] = None

class HotelSettingCreate(BaseModel):
    key: Optional[str] = "default"
    firm_name: Optional[str] = None
    firmName: Optional[str] = None
    legal_name: Optional[str] = None
    legalName: Optional[str] = None
    trade_name: Optional[str] = None
    tradeName: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    gst_no: Optional[str] = None
    gstNo: Optional[str] = None
    gstin: Optional[str] = None
    company_gst_code: Optional[str] = None
    companyGstCode: Optional[str] = None
    pan_no: Optional[str] = None
    pencardNo: Optional[str] = None
    fssai_no: Optional[str] = None
    bank_name: Optional[str] = None
    bankName: Optional[str] = None
    bank_account_no: Optional[str] = None
    bankAccountNo: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bankIfsc: Optional[str] = None
    bank_branch: Optional[str] = None
    bankBranch: Optional[str] = None
    upi_id: Optional[str] = None
    upiId: Optional[str] = None
    calculation_type: Optional[str] = None
    calculationType: Optional[str] = None
    standard_checkout_time: Optional[str] = None
    standardCheckoutTime: Optional[str] = None
    make_all_bill_local_gst: Optional[bool] = None
    makeAllBillLocalGst: Optional[bool] = None
    restaurant_food_bill_tax_inclusive: Optional[bool] = None
    restaurantFoodBillTaxInclusive: Optional[bool] = None
    terms_and_conditions: Optional[str] = None
    termsAndConditions: Optional[str] = None
    logo_url: Optional[str] = None
    logoUrl: Optional[str] = None
    seal_url: Optional[str] = None
    signature_url: Optional[str] = None

class RoomTypeCreate(BaseModel):
    id: Optional[str] = None
    type_id: Optional[str] = None
    room_type_name: Optional[str] = None
    roomTypeName: Optional[str] = None
    package: Optional[str] = "EP"
    gst_tax_string: Optional[str] = None
    gstTaxString: Optional[str] = None
    gst_percent: Optional[float] = 12.0
    gstPercent: Optional[float] = None
    room_tariff: Optional[float] = 2500.0
    roomTariff: Optional[float] = None
    discount_percent: Optional[float] = 0.0
    discountPercent: Optional[float] = None

class MenuItemCreate(BaseModel):
    id: Optional[str] = None
    item_code: Optional[str] = None
    code: Optional[str] = None
    name: str
    category: str
    rate: Optional[float] = 0.0
    sale_rate: Optional[float] = None
    saleRate: Optional[float] = None
    mrp: Optional[float] = None
    purchase_rate: Optional[float] = None
    purchaseRate: Optional[float] = None
    unit: Optional[str] = "Pcs"
    gst_percent: Optional[float] = 5.0
    gstPercent: Optional[float] = None
    head_group: Optional[str] = None
    headGroup: Optional[str] = None
    hsn_code: Optional[str] = None
    hsnCode: Optional[str] = None
    sac_code: Optional[str] = None
    sacCode: Optional[str] = None
    no_discount: Optional[bool] = None
    noDiscount: Optional[bool] = None

class HousekeepingRecordCreate(BaseModel):
    room_no: Optional[str] = None
    roomNo: Optional[str] = None
    status: Optional[str] = "Vacant Clean"
    assigned_staff: Optional[str] = None
    assignedStaff: Optional[str] = None
    priority: Optional[str] = "Normal"
    last_cleaned_time: Optional[str] = None
    lastCleanedTime: Optional[str] = None
    cleaning_started_at: Optional[str] = None
    cleaningStartedAt: Optional[str] = None
    maintenance_issue: Optional[str] = None
    maintenanceIssue: Optional[str] = None
    maintenance_logged_at: Optional[str] = None
    maintenanceLoggedAt: Optional[str] = None
    remarks: Optional[str] = None

class AgentCommissionAccrualCreate(BaseModel):
    id: Optional[str] = None
    commission_id: Optional[str] = None
    agent_id: Optional[str] = None
    agentId: Optional[str] = None
    agent_name: Optional[str] = None
    agentName: Optional[str] = None
    agent_type: Optional[str] = None
    agentType: Optional[str] = None
    check_in_no: Optional[str] = None
    checkInNo: Optional[str] = None
    booking_ref_no: Optional[str] = None
    bookingRefNo: Optional[str] = None
    room_no: Optional[str] = None
    roomNo: Optional[str] = None
    guest_name: Optional[str] = None
    guestName: Optional[str] = None
    guest_mobile: Optional[str] = None
    guestMobile: Optional[str] = None
    check_in_date: Optional[str] = None
    checkInDate: Optional[str] = None
    check_out_date: Optional[str] = None
    checkOutDate: Optional[str] = None
    number_of_nights: Optional[int] = 1
    numberOfNights: Optional[int] = None
    room_tariff: Optional[float] = 0.0
    roomTariff: Optional[float] = None
    gross_room_tariff: Optional[float] = 0.0
    grossRoomTariff: Optional[float] = None
    commission_type: Optional[str] = "PERCENTAGE"
    commissionType: Optional[str] = None
    commission_rate: Optional[float] = 10.0
    commissionRate: Optional[float] = None
    gross_commission: Optional[float] = 0.0
    grossCommission: Optional[float] = None
    tds_percentage: Optional[float] = 5.0
    tdsPercentage: Optional[float] = None
    tds_amount: Optional[float] = 0.0
    tdsAmount: Optional[float] = None
    net_payable_commission: Optional[float] = 0.0
    netPayableCommission: Optional[float] = None
    status: Optional[str] = "PENDING"
    payout_voucher_no: Optional[str] = None
    payoutVoucherNo: Optional[str] = None
    payout_date: Optional[str] = None
    payoutDate: Optional[str] = None
    remarks: Optional[str] = None

class WhatsAppTemplateCreate(BaseModel):
    id: Optional[Any] = None
    template_id: Optional[str] = None
    s_no: Optional[int] = 1
    sNo: Optional[int] = None
    type: Optional[str] = "WhatsApp"
    voucher_type: Optional[str] = None
    voucherType: Optional[str] = None
    label: str
    message: str
    active: Optional[str] = "On"
    send_to: Optional[str] = "Guest"
    sendTo: Optional[str] = None

class RolePermissionCreate(BaseModel):
    id: Optional[Any] = None
    role_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    permissions: Optional[List[str]] = None
    permissions_json: Optional[str] = None
    is_system: Optional[bool] = False
    isSystem: Optional[bool] = None

class NoDiscountRuleCreate(BaseModel):
    config_key: Optional[str] = "default"
    enabled: Optional[bool] = True
    protected_groups: Optional[List[str]] = None
    protectedGroups: Optional[List[str]] = None
    max_allowed_discount_percent: Optional[float] = 20.0
    maxAllowedDiscountPercent: Optional[float] = None
    allow_manual_override: Optional[bool] = True
    allowManualOverride: Optional[bool] = None
    override_role_required: Optional[str] = "Admin"
    overrideRoleRequired: Optional[str] = None
    reason_required_for_override: Optional[bool] = True
    reasonRequiredForOverride: Optional[bool] = None

class LiquorBrandCreate(BaseModel):
    id: Optional[str] = None
    brand_id: Optional[str] = None
    s_no: Optional[int] = 1
    sNo: Optional[int] = None
    name: str
    discount_percentage: Optional[float] = 0.0
    discountPercentage: Optional[float] = None
    status: Optional[str] = "ACTIVE"

class LiquorUnitCreate(BaseModel):
    id: Optional[str] = None
    unit_id: Optional[str] = None
    s_no: Optional[int] = 1
    sNo: Optional[int] = None
    primary_unit_name: Optional[str] = None
    primaryUnitName: Optional[str] = None
    conversion: Optional[float] = 1.0
    alternate_unit_name: Optional[str] = "ML"
    alternateUnitName: Optional[str] = None

class DiscountAuditLogCreate(BaseModel):
    id: Optional[str] = None
    audit_id: Optional[str] = None
    auditId: Optional[str] = None
    bill_no: Optional[str] = None
    billNo: Optional[str] = None
    room_no: Optional[str] = None
    roomNo: Optional[str] = None
    table_no: Optional[str] = None
    tableNo: Optional[str] = None
    customer_name: Optional[str] = None
    customerName: Optional[str] = None
    gross_amount: Optional[float] = 0.0
    grossAmount: Optional[float] = None
    discount_percent: Optional[float] = 0.0
    discountPercent: Optional[float] = None
    discount_amount: Optional[float] = 0.0
    discountAmount: Optional[float] = None
    reason: Optional[str] = None
    manager_name: Optional[str] = "Admin"
    managerName: Optional[str] = None
    manager_pin_verified: Optional[bool] = True
    managerPinVerified: Optional[bool] = None
    margin_saved: Optional[float] = 0.0
    marginSaved: Optional[float] = None
    protected_items_prevented: Optional[int] = 0
    protectedItemsPrevented: Optional[int] = None

class HotelPropertyCreate(BaseModel):
    id: Optional[Any] = None
    firm_id: Optional[str] = None
    firmId: Optional[str] = None
    name: str
    code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = "Rayagada"
    state: Optional[str] = "Odisha"
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gst_no: Optional[str] = None
    gstNo: Optional[str] = None
    is_current: Optional[bool] = False
    isCurrent: Optional[bool] = None
    total_rooms: Optional[int] = 0
    totalRooms: Optional[int] = None

class ExtendStayRequest(BaseModel):
    room_no: Optional[str] = None
    roomNo: Optional[str] = None
    new_checkout_date: Optional[str] = None
    newCheckOutDate: Optional[str] = None
    extended_by: Optional[str] = "Duty Manager"
    extendedBy: Optional[str] = None

class RoomFolioItemCreate(BaseModel):
    room_no: Optional[str] = None
    roomNo: Optional[str] = None
    charge_name: Optional[str] = None
    chargeName: Optional[str] = None
    amount: float
    sac_code: Optional[str] = "996311"
    sacCode: Optional[str] = None
    gst_percent: Optional[float] = 12.0
    gstPercent: Optional[float] = None
    posted_by: Optional[str] = "Front Desk"
    postedBy: Optional[str] = None

class ResolveDiscrepancyRequest(BaseModel):
    notes: Optional[str] = "Inspection confirmed resolved by Duty Manager"
    resolution_notes: Optional[str] = None
    resolved_by: Optional[str] = "Duty Manager"
    resolvedBy: Optional[str] = None

class DemoRequestCreate(BaseModel):
    name: str
    hotel_name: Optional[str] = None
    hotelName: Optional[str] = None
    phone: str
    email: Optional[str] = None
    city: Optional[str] = None
    room_count: Optional[int] = 20
    roomCount: Optional[int] = None
    message: Optional[str] = None

class MasterItemCreate(BaseModel):
    category: str
    item_name: Optional[str] = None
    itemName: Optional[str] = None
    name: Optional[str] = None
    item_value: Optional[str] = None
    itemValue: Optional[str] = None
    item_data: Optional[Dict[str, Any]] = None
    itemData: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = True
    isActive: Optional[bool] = None

# --- Cloudflare R2 Upload & KYC Document Schemas ---
class BookingSignatureUpload(BaseModel):
    signature_data_url: str = Field(..., description="Base64 Data URL (e.g. data:image/png;base64,...)")
    signed_by: Optional[str] = "Guest"

class BookingSignatureResponse(BaseModel):
    success: bool
    booking_id: int
    has_signature: bool
    guest_signature_url: Optional[str] = None
    signed_by: Optional[str] = "Guest"
    message: str = "Digital signature captured successfully"

class BookingKycUploadResponse(BaseModel):
    status: str = "success"
    booking_id: int
    object_key: str
    storage: str = "Cloudflare R2"
    filename: Optional[str] = None
    content_type: Optional[str] = None
    size_bytes: Optional[int] = 0
    message: str = "Guest KYC document successfully uploaded to Cloudflare R2 and linked to reservation in PostgreSQL"

class BookingKycPresignedResponse(BaseModel):
    status: str = "success"
    booking_id: int
    object_key: str
    download_url: str
    expires_in: int = 900
    storage: str = "Cloudflare R2"

class RoomPhotoUploadResponse(BaseModel):
    status: str = "success"
    room_id: int
    object_key: str
    image_url: str
    storage: str = "Cloudflare R2"
    message: str = "Room photo successfully uploaded to Cloudflare R2 and published to room profile"

# --- Phase 2 Forensic Schemas ---
class TableShiftCreate(BaseModel):
    shift_id: Optional[str] = None
    from_table: str
    to_table: str
    transferred_count: Optional[int] = 0
    reason: Optional[str] = None
    shifted_by: Optional[str] = "Cashier"

class TableSessionCreate(BaseModel):
    session_id: str
    table_no: str
    start_time: str
    status: Optional[str] = "Active"
    kot_numbers_json: Optional[str] = "[]"
    cumulative_items_json: Optional[str] = "[]"
    cumulative_amount: Optional[float] = 0.0

class HousekeepingDiscrepancyCreate(BaseModel):
    discrepancy_id: Optional[str] = None
    room_no: str
    front_desk_status: Optional[str] = None
    housekeeping_status: str
    reported_by: Optional[str] = "System"
    remarks: Optional[str] = None
    notes: Optional[str] = None

class RfidKeyCardCreate(BaseModel):
    card_number: str
    card_uuid: Optional[str] = None
    room_no: str
    guest_name: str
    check_in_time: str
    valid_until: str
    status: Optional[str] = "Active"
    issued_by: Optional[str] = "Front Desk"

class RfidKeyCardExtend(BaseModel):
    valid_until: str
    extended_by: Optional[str] = "Front Desk"

class HotelCompanyInfoCreate(BaseModel):
    property_name: Optional[str] = "SRI SAI VASUDEV RESIDENCY"
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    logo_url: Optional[str] = None
    seal_url: Optional[str] = None
    default_bill_format: Optional[str] = "standard"
    terms_and_conditions: Optional[str] = None
    legal_name: Optional[str] = None
    legalName: Optional[str] = None
    pan_number: Optional[str] = None
    panNumber: Optional[str] = None
    bank_name: Optional[str] = None
    bankName: Optional[str] = None
    bank_account_no: Optional[str] = None
    bankAccountNo: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bankIfsc: Optional[str] = None
    bank_branch: Optional[str] = None
    bankBranch: Optional[str] = None
    upi_id: Optional[str] = None
    upiId: Optional[str] = None
    phonepe_gpay: Optional[str] = None
    phonePeGpay: Optional[str] = None
    jurisdiction: Optional[str] = "Rayagada Jurisdiction"

class VirtualAccountCreate(BaseModel):
    account_number: str
    ifsc: str
    upi_id: Optional[str] = None
    booking_id: Optional[int] = None
    guest_name: str
    status: Optional[str] = "Active"

class LiquorStockAdjustmentCreate(BaseModel):
    brand: str
    item_id: Optional[str] = None
    bottle_size_ml: Optional[int] = 750
    transaction_type: str
    qty_pegs: float
    pegs_per_bottle: Optional[int] = 25
    reference_no: Optional[str] = None

class ManagerPinVerifyRequest(BaseModel):
    pin: str

class LiquorStockCreate(BaseModel):
    brand: str
    bottle_size_ml: Optional[int] = 750
    opening_bottles: Optional[float] = 0.0
    received_bottles: Optional[float] = 0.0
    sold_pegs: Optional[float] = 0.0
    pegs_per_bottle: Optional[int] = 25
    closing_bottles: Optional[float] = 0.0

class LiquorStockResponse(BaseModel):
    id: int
    brand: str
    bottle_size_ml: int
    opening_bottles: float
    received_bottles: float
    sold_pegs: float
    pegs_per_bottle: int
    closing_bottles: float
    updated_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

class CreditNoteCreate(BaseModel):
    original_invoice_no: str
    original_invoice_date: Optional[str] = None
    invoice_type: Optional[str] = "ROOM_CHECKOUT"
    checkout_record_id: Optional[int] = None
    food_bill_id: Optional[int] = None
    booking_id: Optional[int] = None
    
    guest_name: Optional[str] = None
    guest_phone: Optional[str] = None
    customer_gstin: Optional[str] = None
    pos_state_code: Optional[str] = "37"
    is_interstate: Optional[bool] = False
    sac_code: Optional[str] = "996311"

    reason_code: str = "03-Deficiency in Services"
    reason_description: Optional[str] = None

    taxable_value: float
    gst_rate: Optional[float] = None
    
    refund_payment_mode: Optional[str] = "Cash"
    refund_ref: Optional[str] = None
    authorized_by: Optional[str] = "Manager"
    manager_pin: Optional[str] = None

class CreditNoteResponse(BaseModel):
    id: int
    credit_note_no: str
    credit_note_date: str
    financial_year: str
    original_invoice_no: str
    original_invoice_date: str
    invoice_type: str
    guest_name: str
    guest_phone: Optional[str] = None
    customer_gstin: Optional[str] = None
    pos_state_code: str
    is_interstate: bool
    sac_code: str
    reason_code: str
    reason_description: Optional[str] = None
    taxable_value_paise: int
    taxable_value: float
    gst_rate: float
    cgst_amount_paise: int
    cgst_amount: float
    sgst_amount_paise: int
    sgst_amount: float
    igst_amount_paise: int
    igst_amount: float
    total_credit_paise: int
    total_credit_amount: float
    refund_payment_mode: str
    refund_ref: Optional[str] = None
    status: str
    authorized_by: str
    manager_pin_verified: bool
    journal_entry_id: Optional[str] = None
    created_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)










