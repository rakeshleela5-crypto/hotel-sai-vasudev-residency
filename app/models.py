import datetime
import uuid
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Index, event, DDL
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.timezone import now_utc, TimezoneAwareDateTime

def generate_booking_ref():
    return f"SVR-{uuid.uuid4().hex[:6].upper()}"

def generate_invoice_num():
    now_ts = int(now_utc().timestamp() * 1000)
    rand_seq = uuid.uuid4().hex[:6].upper()
    return f"INV-SVR-{now_ts}-{rand_seq}"

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    room_type = Column(String(50), nullable=False) # Deluxe, Super Deluxe, Suite, Standard
    price_per_night = Column(Float, nullable=False)
    capacity = Column(Integer, default=2) # Max standard guests
    total_inventory = Column(Integer, default=5) # Total physical rooms of this type
    bed_type = Column(String(50), default="King Bed")
    room_size = Column(String(50), default="350 sq ft")
    description = Column(Text, nullable=False)
    amenities = Column(String(500), default="High-Speed Wi-Fi, Central AC, Smart TV, 24/7 Room Service, Complimentary Breakfast")
    image_url = Column(String(255), nullable=False)
    badge = Column(String(50), nullable=True) # "Best Value", "Family Favorite", "Luxury Suite"
    is_available = Column(Boolean, default=True)
    housekeeping_status = Column(String(50), default="Clean") # Clean, Dirty, Inspected, Under_Maintenance
    version_id = Column(Integer, default=1, nullable=False) # Optimistic locking (#25, #26)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True) # Soft delete for GST compliance (#21, #38)
    void_reason = Column(String(255), nullable=True)
    created_at = Column(TimezoneAwareDateTime, default=now_utc)

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
    guest_phone = Column(String(50), nullable=False, index=True)
    id_proof_type = Column(String(50), default="Aadhaar Card")
    id_proof_number = Column(String(50), nullable=True)
    id_proof_document_key = Column(String(255), nullable=True) # Cloudflare R2 object key (e.g. kyc/2026/10/guest_442.pdf)
    guest_photo_url = Column(String(255), nullable=True) # Public guest photo URL
    invoice_pdf_key = Column(String(255), nullable=True) # Cloudflare R2 object key (e.g. invoices/2026/10/inv_101.pdf)

    # Walk-In & Pilgrimage KYC Metadata
    coming_from = Column(String(150), nullable=True)
    proceeding_to = Column(String(150), nullable=True)
    vehicle_no = Column(String(50), nullable=True)
    darshan_slot = Column(String(100), nullable=True)
    guest_gender = Column(String(20), nullable=True)
    guest_age = Column(Integer, nullable=True)

    # Reservation Dates
    check_in_date = Column(String(50), nullable=False, index=True) # YYYY-MM-DD
    check_out_date = Column(String(50), nullable=False, index=True) # YYYY-MM-DD
    actual_check_in = Column(DateTime, nullable=True)
    actual_check_out = Column(DateTime, nullable=True)
    adults = Column(Integer, default=2)
    children = Column(Integer, default=0)
    total_nights = Column(Integer, default=1)

    # Financial & Indian GST Tax Engine
    base_rate = Column(Float, nullable=False) # Tariff per night
    base_amount = Column(Float, nullable=False) # base_rate * total_nights
    extra_guest_charge = Column(Float, default=0.0) # Extra adult charge
    discount_amount = Column(Float, default=0.0)
    gst_rate = Column(Float, default=12.0) # 12% if <= 7500, 18% if > 7500
    cgst_amount = Column(Float, default=0.0)
    sgst_amount = Column(Float, default=0.0)
    total_tax = Column(Float, default=0.0)
    total_price = Column(Float, nullable=False) # Total room tariff + tax

    # Folio Balances
    total_paid = Column(Float, default=0.0)
    balance_due = Column(Float, default=0.0)
    key_deposit = Column(Float, default=0.0)

    # Operational Status
    payment_status = Column(String(50), default="Pending") # Pending, Partial, Paid, Pay at Hotel, BTC
    payment_method = Column(String(50), default="Pay at Hotel") # UPI, Cash, Card, Direct_BTC, Split
    status = Column(String(50), default="Confirmed", index=True) # Confirmed, Checked-In, Checked-Out, Cancelled, No-Show
    special_requests = Column(Text, nullable=True)
    cancellation_reason = Column(String(255), nullable=True)
    version_id = Column(Integer, default=1, nullable=False) # Optimistic locking (#25, #26)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True) # Soft delete for GST compliance (#21, #38)
    void_reason = Column(String(255), nullable=True)
    created_at = Column(TimezoneAwareDateTime, default=now_utc)
    updated_at = Column(TimezoneAwareDateTime, default=now_utc, onupdate=now_utc)

    __table_args__ = (
        Index("ix_bookings_checkin_checkout_status", "check_in_date", "check_out_date", "status"),
    )

    room = relationship("Room", back_populates="bookings")
    folios = relationship("Folio", back_populates="booking", cascade="all, delete-orphan")
    payments = relationship("BookingPayment", back_populates="booking", cascade="all, delete-orphan")
    folio_items = relationship("RoomFolioItem", back_populates="booking", cascade="all, delete-orphan")
    room_shifts = relationship("RoomShift", back_populates="booking", cascade="all, delete-orphan")
    police_log = relationship("PoliceStationLog", back_populates="booking", uselist=False, cascade="all, delete-orphan")

class BookingPayment(Base):
    __tablename__ = "booking_payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    receipt_number = Column(String(50), unique=True, index=True, default=lambda: f"RCP-{uuid.uuid4().hex[:6].upper()}")
    payment_type = Column(String(50), default="Partial") # Advance, Partial, Settlement, Key_Deposit, Refund
    payment_mode = Column(String(50), nullable=False) # Cash, Card, UPI, Direct_BTC
    amount = Column(Float, nullable=False)
    transaction_ref = Column(String(100), nullable=True, index=True) # UPI UTR or Card Auth Code
    notes = Column(String(255), nullable=True)
    collected_by = Column(String(100), default="Front Desk Cashier")
    created_at = Column(DateTime, default=now_utc)

    booking = relationship("Booking", back_populates="payments")

class RoomShift(Base):
    __tablename__ = "room_shifts"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    from_room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False, index=True)
    to_room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False, index=True)
    shift_date = Column(String(50), nullable=False) # YYYY-MM-DD
    reason = Column(String(255), nullable=False) # AC issue, Guest upgrade, Maintenance
    old_rate = Column(Float, nullable=False)
    new_rate = Column(Float, nullable=False)
    shifted_by = Column(String(100), default="Duty Manager")
    created_at = Column(DateTime, default=now_utc)

    booking = relationship("Booking", back_populates="room_shifts")

class RoomFolioItem(Base):
    __tablename__ = "room_folio_items"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    item_type = Column(String(50), default="Food_KOT") # Food_KOT, Extra_Mattress, Laundry, Beverage, Banquet
    description = Column(String(255), nullable=False) # e.g. "Pure Veg Thali x 2 + Mineral Water"
    sac_code = Column(String(20), default="996331") # 996331 for Food, 996311 for Lodging
    kot_number = Column(String(50), nullable=True) # KOT-00104
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    taxable_amount = Column(Float, nullable=False)
    gst_rate = Column(Float, default=5.0) # 5% on restaurant food, 12% on room service
    cgst_amount = Column(Float, default=0.0)
    sgst_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    status = Column(String(50), default="Billed", index=True) # Billed, Void
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    void_reason = Column(String(255), nullable=True)
    created_at = Column(TimezoneAwareDateTime, default=now_utc)

    __table_args__ = (
        Index("ix_room_folio_items_booking_status", "booking_id", "status"),
    )

    booking = relationship("Booking", back_populates="folio_items")

class PoliceStationLog(Base):
    __tablename__ = "police_station_logs"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False, index=True)
    guest_name = Column(String(150), nullable=False)
    age = Column(Integer, default=35)
    gender = Column(String(20), default="Male")
    nationality = Column(String(50), default="Indian")
    id_proof_type = Column(String(50), default="Aadhaar Card")
    id_proof_number = Column(String(100), nullable=False)
    permanent_address = Column(Text, nullable=False)
    origin_city = Column(String(100), nullable=False)
    next_destination = Column(String(100), nullable=False)
    purpose_of_visit = Column(String(100), default="Temple Darshan")
    vehicle_number = Column(String(50), nullable=True)
    
    # Statutory Foreign National Form C Fields
    is_foreign_national = Column(Boolean, default=False)
    passport_number = Column(String(100), nullable=True)
    visa_number = Column(String(100), nullable=True)
    visa_validity = Column(String(50), nullable=True)
    port_of_arrival = Column(String(100), nullable=True)
    date_of_entry_india = Column(String(50), nullable=True)
    id_document_key = Column(String(255), nullable=True) # Cloudflare R2 object key for scanned ID/Passport/Visa
    created_at = Column(DateTime, default=now_utc)

    booking = relationship("Booking", back_populates="police_log")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(String(100), nullable=True, index=True)
    role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=True, index=True) # E.g. CHECK_IN, TARIFF_OVERRIDE, DISCOUNT_APPLIED
    entity_type = Column(String(100), nullable=True, index=True) # BOOKING, FOLIO, ROOM, KOT, PAYOUT
    entity_id = Column(String(100), nullable=True, index=True)
    old_data = Column(Text, nullable=True)
    new_data = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(TimezoneAwareDateTime, default=now_utc, nullable=False)

    # Legacy compatibility fields
    event_type = Column(String(50), nullable=True, index=True)
    booking_ref = Column(String(50), nullable=True, index=True)
    performed_by = Column(String(100), nullable=True)
    details_json = Column(Text, nullable=True)

class DailyNightAudit(Base):
    __tablename__ = "night_audits"

    id = Column(Integer, primary_key=True, index=True)
    audit_date = Column(String(50), unique=True, nullable=False, index=True) # YYYY-MM-DD
    total_rooms_occupied = Column(Integer, default=0)
    total_room_revenue = Column(Float, default=0.0)
    total_food_revenue = Column(Float, default=0.0)
    total_gst_collected = Column(Float, default=0.0)
    no_shows_processed = Column(Integer, default=0)
    cash_in_drawer = Column(Float, default=0.0)
    card_total = Column(Float, default=0.0)
    upi_total = Column(Float, default=0.0)
    btc_credit_total = Column(Float, default=0.0)
    audited_by = Column(String(100), default="Night Auditor / Manager")
    audit_status = Column(String(50), default="Closed")
    created_at = Column(DateTime, default=now_utc)

class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(50), default="New")
    created_at = Column(DateTime, default=now_utc)

class DiningTable(Base):
    __tablename__ = "dining_tables"

    id = Column(Integer, primary_key=True, index=True)
    table_code = Column(String(50), unique=True, index=True, nullable=False)
    table_name = Column(String(100), nullable=False)
    table_group = Column(String(50), default="General") # General, TakeAway, Nc, SelfService
    capacity = Column(Integer, default=4)
    status = Column(String(50), default="Vacant") # Vacant, Running, Billed
    active_session_id = Column(String(100), nullable=True, index=True) # Module 1: Single table session ID
    merged_with_tables = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=now_utc)

class KotTicket(Base):
    __tablename__ = "kot_tickets"

    id = Column(Integer, primary_key=True, index=True)
    kot_no = Column(String(100), unique=True, index=True, nullable=False)
    table_session_id = Column(String(100), index=True, nullable=True) # Module 1: Single table session ID
    kot_sequence = Column(Integer, default=1) # KOT #1, KOT #2...
    date = Column(String(50), nullable=False)
    time = Column(String(50), nullable=False)
    table_no = Column(String(50), nullable=True, index=True)
    room_no = Column(String(50), nullable=True, index=True)
    waiter_name = Column(String(100), default="Captain")
    guest_name = Column(String(150), nullable=True)
    pax = Column(Integer, default=2)
    items_json = Column(Text, nullable=False) # JSON array of {itemName, qty, rate, amount}
    delta_items_json = Column(Text, nullable=True) # Newly added items in this running KOT
    total_amount = Column(Float, default=0.0)
    status = Column(String(50), default="Running", index=True) # Running, Billed, Cancelled
    is_printed = Column(Boolean, default=True)
    is_delta = Column(Boolean, default=False)
    order_source = Column(String(50), default="Desktop")
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    void_reason = Column(String(255), nullable=True)
    created_at = Column(TimezoneAwareDateTime, default=now_utc)

    __table_args__ = (
        Index("ix_kot_tickets_room_status", "room_no", "status"),
    )

class KotItem(Base):
    __tablename__ = "kot_items"

    id = Column(Integer, primary_key=True, index=True)
    kot_id = Column(Integer, ForeignKey("kot_tickets.id"), nullable=True, index=True)
    kot_no = Column(String(100), index=True, nullable=False)
    item_code = Column(String(50), nullable=True)
    item_name = Column(String(150), nullable=False)
    qty = Column(Float, nullable=False, default=1.0)
    rate = Column(Float, nullable=False, default=0.0)
    amount = Column(Float, nullable=False, default=0.0)
    instruction = Column(String(255), nullable=True)
    created_at = Column(TimezoneAwareDateTime, default=now_utc)

class KotVoidAuditLog(Base):
    __tablename__ = "kot_void_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    table_session_id = Column(String(100), index=True, nullable=True)
    kot_no = Column(String(100), index=True, nullable=False)
    table_no = Column(String(50), nullable=True)
    item_name = Column(String(150), nullable=False)
    qty_voided = Column(Integer, nullable=False)
    rate = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    steward_id = Column(String(100), default="Steward")
    approving_manager_id = Column(String(100), default="Duty Manager")
    manager_pin_verified = Column(Boolean, default=True)
    void_reason = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=now_utc)

class KeyCardAccess(Base):
    __tablename__ = "key_card_access"

    id = Column(Integer, primary_key=True, index=True)
    card_uid = Column(String(100), unique=True, index=True, nullable=False)
    room_no = Column(String(50), nullable=False, index=True)
    guest_name = Column(String(150), nullable=False)
    check_in_time = Column(DateTime, default=now_utc)
    scheduled_checkout_time = Column(DateTime, nullable=False)
    card_deactivation_time = Column(DateTime, nullable=False) # T-1h cutoff
    status = Column(String(50), default="ACTIVE") # ACTIVE, WARNING_T_MINUS_1H, DEACTIVATED, EXTENDED
    extension_logged = Column(Boolean, default=False)
    extension_fee = Column(Float, default=0.0)
    encoded_by = Column(String(100), default="Front Desk")
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

class HousekeepingDiscrepancy(Base):
    __tablename__ = "housekeeping_discrepancies"

    id = Column(Integer, primary_key=True, index=True)
    discrepancy_id = Column(String(50), nullable=True, index=True)
    room_no = Column(String(50), nullable=False, index=True)
    front_desk_status = Column(String(50), nullable=False)
    housekeeping_status = Column(String(50), nullable=False)
    reported_by = Column(String(100), default="Housekeeping Attendant")
    reported_at = Column(DateTime, default=now_utc)
    resolved = Column(Boolean, default=False)
    resolved_by = Column(String(100), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    is_short_stay_suspect = Column(Boolean, default=False)

class MasterItem(Base):
    __tablename__ = "master_items"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), nullable=False, index=True) # gst, business_source, voucher_type, locker, other_charge, item_group, godown, menu_item
    code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    payload_json = Column(Text, nullable=False) # Structured data fields
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

class StaffUser(Base):
    __tablename__ = "staff_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    display_name = Column(String(150), nullable=False)
    role_name = Column(String(50), default="Front Desk")
    department = Column(String(50), default="Front Office")
    phone = Column(String(50), nullable=True)
    email = Column(String(150), nullable=True)
    is_active = Column(Boolean, default=True)
    permissions_json = Column(Text, default="[]")
    password_hash = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=now_utc)

class InventoryPurchase(Base):
    __tablename__ = "inventory_purchases"

    id = Column(Integer, primary_key=True, index=True)
    bill_no = Column(String(100), index=True, nullable=False)
    bill_date = Column(String(50), nullable=False, index=True)
    godown = Column(String(100), nullable=False)
    supplier_name = Column(String(150), nullable=False)
    items_json = Column(Text, nullable=False)
    total_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    net_amount = Column(Float, default=0.0)
    terms = Column(String(50), default="Credit")
    created_at = Column(DateTime, default=now_utc)

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    reference_id = Column(String(100), unique=True, index=True, nullable=False) # Decentro reference_id UUID
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    kot_id = Column(String(100), nullable=True, index=True)
    room_no = Column(String(50), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    purpose_message = Column(String(255), nullable=True)
    payment_method = Column(String(50), default="UPI_QR") # UPI_QR, VIRTUAL_ACCOUNT, CARD, NETBANKING
    status = Column(String(50), default="PENDING", index=True) # PENDING, SUCCESS, FAILURE, EXPIRED, CANCELLED
    decentro_txn_id = Column(String(150), unique=True, index=True, nullable=True)
    idempotency_key = Column(String(255), unique=True, index=True, nullable=True)
    bank_reference_number = Column(String(100), nullable=True, index=True) # UTR
    payer_vpa = Column(String(100), nullable=True)
    qr_code_base64 = Column(Text, nullable=True)
    upi_intent_link = Column(Text, nullable=True)
    expiry_time = Column(DateTime, nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    booking = relationship("Booking", backref="payment_transactions")

class VirtualAccount(Base):
    __tablename__ = "virtual_accounts"

    id = Column(Integer, primary_key=True, index=True)
    reference_id = Column(String(100), unique=True, index=True, nullable=False)
    corporate_client_id = Column(String(100), nullable=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    group_id = Column(String(100), nullable=True, index=True)
    account_number = Column(String(100), unique=True, index=True, nullable=False)
    ifsc_code = Column(String(50), nullable=False)
    bank_name = Column(String(100), default="YES BANK")
    account_name = Column(String(200), nullable=False)
    upi_id = Column(String(150), nullable=True)
    decentro_urn = Column(String(150), nullable=True, index=True)
    status = Column(String(50), default="ACTIVE") # ACTIVE, DEACTIVATED, CLOSED
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    booking = relationship("Booking", backref="virtual_accounts")

class FoodBill(Base):
    __tablename__ = "food_bills"

    id = Column(Integer, primary_key=True, index=True)
    bill_no = Column(String(100), unique=True, index=True, nullable=False)
    date = Column(String(50), nullable=False, index=True)
    time = Column(String(50), nullable=False)
    room_no = Column(String(50), nullable=True, index=True)
    table_no = Column(String(50), nullable=True, index=True)
    guest_name = Column(String(150), nullable=True)
    kot_numbers_json = Column(Text, default="[]")
    items_json = Column(Text, default="[]")
    food_gross_amount = Column(Float, default=0.0)
    discount_percent = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    taxable_amount = Column(Float, default=0.0)
    gst_amount = Column(Float, default=0.0)
    net_bill_amount = Column(Float, default=0.0)
    settlement_type = Column(String(50), default="Cash") # Settle To Room, Cash, Online, Card, Credit
    discount_reason = Column(String(255), nullable=True)
    payment_ref = Column(String(100), nullable=True)
    billed_by = Column(String(100), default="Cashier")
    cgst_amount = Column(Float, default=0.0)
    sgst_amount = Column(Float, default=0.0)
    status = Column(String(50), default="Settled")
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    void_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=now_utc)

class PettyExpense(Base):
    __tablename__ = "petty_expenses"

    id = Column(Integer, primary_key=True, index=True)
    expense_no = Column(String(100), unique=True, index=True, nullable=False)
    date = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    payment_mode = Column(String(50), default="Cash") # Cash, Online
    paid_to = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    vendor_gstin = Column(String(20), nullable=True)
    attachment_url = Column(String(500), nullable=True)
    bill_number = Column(String(100), nullable=True)
    approved_by = Column(String(100), default="General Manager")
    created_at = Column(DateTime, default=now_utc)

class FolioDiscountRecord(Base):
    __tablename__ = "folio_discount_records"

    id = Column(Integer, primary_key=True, index=True)
    booking_ref = Column(String(100), index=True, nullable=False)
    room_no = Column(String(50), index=True, nullable=False)
    discount_type = Column(String(50), default="flat") # flat, percent
    discount_value = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    reason = Column(String(255), nullable=True)
    approved_by = Column(String(100), default="General Manager")
    created_at = Column(DateTime, default=now_utc)

class GroupBooking(Base):
    __tablename__ = "group_bookings"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(String(100), unique=True, index=True, nullable=False)
    group_name = Column(String(200), nullable=False)
    contact_person = Column(String(150), nullable=False)
    contact_phone = Column(String(50), nullable=False, index=True)
    booking_source = Column(String(100), default="Direct Phone Reservation")
    check_in_date = Column(String(50), nullable=False, index=True)
    check_out_date = Column(String(50), nullable=False, index=True)
    advance_paid = Column(Float, default=0.0)
    balance_due = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    rooms_allocated_json = Column(Text, default="[]")
    guests_json = Column(Text, default="[]")
    special_instructions = Column(Text, nullable=True)
    status = Column(String(50), default="Confirmed", index=True)
    created_at = Column(DateTime, default=now_utc)

class CheckoutRecord(Base):
    __tablename__ = "checkout_records"

    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String(100), unique=True, index=True, nullable=False)
    room_no = Column(String(50), index=True, nullable=False)
    room_type = Column(String(100), default="DELUXE")
    guest_name = Column(String(150), nullable=False)
    guest_phone = Column(String(50), nullable=True, index=True)
    check_in_date = Column(String(50), nullable=False, index=True)
    check_in_time = Column(String(50), nullable=True)
    check_out_date = Column(String(50), nullable=False, index=True)
    check_out_time = Column(String(50), nullable=True)
    calculation_type = Column(String(50), default="12hour")
    number_of_days = Column(Integer, default=1)
    per_day_tariff = Column(Float, default=0.0)
    total_room_rent = Column(Float, default=0.0)
    food_amount = Column(Float, default=0.0)
    gst_percent = Column(Float, default=12.0)
    gst_amount = Column(Float, default=0.0)
    cgst_amount = Column(Float, default=0.0)
    sgst_amount = Column(Float, default=0.0)
    add_others = Column(Float, default=0.0)
    less_discount = Column(Float, default=0.0)
    advance_deducted = Column(Float, default=0.0)
    bill_amount = Column(Float, default=0.0)
    net_payable = Column(Float, default=0.0)
    payment_mode = Column(String(50), default="Cash")
    payments_json = Column(Text, default="[]")
    payment_splits_json = Column(Text, default="[]")
    settled_by_user_id = Column(String(100), nullable=True)
    round_off_amount = Column(Float, default=0.0)
    is_cancelled = Column(Boolean, default=False)
    cancellation_reason = Column(String(255), nullable=True)
    checkout_remark = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), default="India")
    pin_code = Column(String(20), nullable=True)
    sac_code = Column(String(20), default="996311")
    invoice_format = Column(String(50), default="A4_Standard")
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    void_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=now_utc)

class AdvanceReceipt(Base):
    __tablename__ = "advance_receipts"

    id = Column(Integer, primary_key=True, index=True)
    receipt_no = Column(String(100), unique=True, index=True, nullable=False)
    voucher_no = Column(String(50), nullable=True)
    date = Column(String(50), nullable=False, index=True)
    time = Column(String(50), nullable=True)
    voucher_name = Column(String(100), default="Advance_Receipt")
    room_no = Column(String(50), index=True, nullable=False)
    guest_name = Column(String(150), nullable=False)
    mobile = Column(String(50), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    payment_mode = Column(String(50), default="Cash")
    transaction_ref = Column(String(100), nullable=True)
    is_settled_in_checkout = Column(Boolean, default=False)
    remark = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. JV-2026-0001
    date = Column(String(50), nullable=False) # YYYY-MM-DD
    time = Column(String(50), nullable=True) # e.g. 11:00 AM
    voucher_type = Column(String(50), nullable=False) # Advance, NightAudit, PosBill, RoomPosting, CheckOut, Expense, Manual
    reference_no = Column(String(100), index=True, nullable=True)
    narration = Column(Text, nullable=False)
    debit_account = Column(String(150), nullable=False)
    credit_account = Column(String(150), nullable=False)
    amount_paise = Column(Integer, default=0)
    amount_rupees = Column(Float, default=0.0)
    posted_by = Column(String(100), default="Front Desk Mgr")
    created_at = Column(DateTime, default=now_utc)

class PartyAccount(Base):
    __tablename__ = "party_accounts"

    id = Column(String(100), primary_key=True, index=True) # e.g. pa-1
    name = Column(String(200), unique=True, index=True, nullable=False)
    mobile = Column(String(50), nullable=True)
    category = Column(String(50), default="General") # Customer, Corporate, Owner, Bank, General, Vendor
    balance = Column(Float, default=0.0)
    balance_type = Column(String(10), default="Dr") # Dr, Cr
    gstin = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)

class GeneralReceipt(Base):
    __tablename__ = "general_receipts"

    id = Column(Integer, primary_key=True, index=True)
    s_no = Column(Integer, default=1)
    voucher_name = Column(String(100), default="Receipts")
    receipt_no = Column(String(100), unique=True, index=True, nullable=False) # e.g. REC/12/24-25
    voucher_no = Column(Integer, default=1)
    date = Column(String(50), nullable=False)
    payment_mode = Column(String(50), default="Cash") # Cash, Online, Card, UPI, Cheque
    account_name = Column(String(200), index=True, nullable=False)
    account_mobile = Column(String(50), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    remark = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)

class GeneralPayment(Base):
    __tablename__ = "general_payments"

    id = Column(Integer, primary_key=True, index=True)
    s_no = Column(Integer, default=1)
    voucher_name = Column(String(100), default="Payments")
    payment_no = Column(String(100), unique=True, index=True, nullable=False) # e.g. PAY/5/24-25
    voucher_no = Column(Integer, default=1)
    date = Column(String(50), nullable=False)
    payment_mode = Column(String(50), default="Cash") # Cash, Online, Card, UPI, Cheque
    account_name = Column(String(200), index=True, nullable=False)
    account_mobile = Column(String(50), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    remark = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)

class Godown(Base):
    __tablename__ = "godowns"

    id = Column(Integer, primary_key=True, index=True)
    godown_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. godown-1
    s_no = Column(Integer, default=1)
    name = Column(String(150), unique=True, index=True, nullable=False) # e.g. Main Store, Kitchen
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)

class ItemGroup(Base):
    __tablename__ = "item_groups"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. ig-1
    s_no = Column(Integer, default=1)
    name = Column(String(150), unique=True, index=True, nullable=False) # e.g. Raw Material, Spices
    head_group = Column(String(100), default="Raw_Material") # Restaurant_Item vs Raw_Material
    no_discount = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now_utc)

class StockTransfer(Base):
    __tablename__ = "stock_transfers"

    id = Column(Integer, primary_key=True, index=True)
    entry_no = Column(String(100), unique=True, index=True, nullable=False) # e.g. ST/1/24-25
    date = Column(String(50), nullable=False)
    from_godown = Column(String(150), nullable=False)
    to_godown = Column(String(150), nullable=False)
    bill_date = Column(String(50), nullable=True)
    bill_no = Column(String(100), nullable=True)
    items_json = Column(Text, default="[]")
    total_qty = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    total_discount = Column(Float, default=0.0)
    total_taxable = Column(Float, default=0.0)
    total_gst_amt = Column(Float, default=0.0)
    total_net_value = Column(Float, default=0.0)
    remark = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)

class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True, nullable=False)
    s_no = Column(Integer, default=1)
    firm_id = Column(String(50), default="SVR0001")
    user_name = Column(String(150), nullable=False)
    email_id = Column(String(150), unique=True, index=True, nullable=False)
    role_id = Column(Integer, default=2)
    role_name = Column(String(100), default="Front Office")
    status = Column(String(50), default="Active")
    department = Column(String(100), nullable=True)
    shift = Column(String(100), nullable=True)
    mobile = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=True)
    is_on_duty = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_utc)

class CommissionAgent(Base):
    __tablename__ = "commission_agents"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. AGT-101
    name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=False)
    alternate_phone = Column(String(50), nullable=True)
    email = Column(String(150), nullable=True)
    city = Column(String(100), default="Rayagada")
    address = Column(Text, nullable=True)
    agent_type = Column(String(100), default="Travel Agent")
    commission_type = Column(String(100), default="PERCENTAGE_ROOM_ONLY")
    default_rate = Column(Float, default=10.0)
    pan_number = Column(String(50), nullable=True)
    gst_number = Column(String(50), nullable=True)
    total_bookings = Column(Integer, default=0)
    total_revenue_generated = Column(Float, default=0.0)
    total_commission_earned = Column(Float, default=0.0)
    total_commission_paid = Column(Float, default=0.0)
    balance_payable = Column(Float, default=0.0)
    created_at = Column(DateTime, default=now_utc)

class AgentPayoutVoucher(Base):
    __tablename__ = "agent_payout_vouchers"

    id = Column(Integer, primary_key=True, index=True)
    voucher_no = Column(String(100), unique=True, index=True, nullable=False) # e.g. AGTPAY-1001
    voucher_date = Column(String(50), nullable=False)
    agent_id = Column(String(100), index=True, nullable=False)
    agent_name = Column(String(150), nullable=False)
    amount = Column(Float, nullable=False)
    payment_mode = Column(String(50), default="CASH")
    reference_no = Column(String(100), nullable=True)
    settled_commission_ids_json = Column(Text, default="[]")
    tds_deducted = Column(Float, default=0.0)
    gross_amount = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_by = Column(String(100), default="Accounts")
    created_at = Column(DateTime, default=now_utc)

class ShiftHandover(Base):
    __tablename__ = "shift_handovers"

    id = Column(Integer, primary_key=True, index=True)
    shift_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. SHIFT/20261026/01
    shift_date = Column(String(50), nullable=False)
    shift_time = Column(String(100), nullable=False)
    user_email = Column(String(150), nullable=False)
    user_name = Column(String(150), nullable=False)
    shift_type = Column(String(50), default="Morning")
    opening_drawer_cash = Column(Float, default=5000.0)
    room_cash_collected = Column(Float, default=0.0)
    food_cash_collected = Column(Float, default=0.0)
    advance_cash_collected = Column(Float, default=0.0)
    expenses_paid_from_drawer = Column(Float, default=0.0)
    net_physical_cash_in_drawer = Column(Float, default=5000.0)
    online_upi_verified = Column(Float, default=0.0)
    card_swipe_verified = Column(Float, default=0.0)
    credit_accounts_added = Column(Float, default=0.0)
    total_transactions_handled = Column(Integer, default=0)
    handover_to_user = Column(String(150), nullable=True)
    handover_notes = Column(Text, nullable=True)
    status = Column(String(50), default="Verified & Closed")
    created_at = Column(DateTime, default=now_utc)

class BanquetVenue(Base):
    __tablename__ = "banquet_venues"

    id = Column(Integer, primary_key=True, index=True)
    venue_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. BV-01
    name = Column(String(150), nullable=False) # e.g. MARRIAGE GARDEN1
    type = Column(String(100), default="Banquet Hall")
    base_tariff = Column(Float, default=50000.0)
    gst_percent = Column(Float, default=18.0)
    capacity_pax_min = Column(Integer, default=50)
    capacity_pax_max = Column(Integer, default=500)
    sq_ft_area = Column(Float, default=5000.0)
    floor = Column(String(50), default="Ground Floor")
    amenities_json = Column(Text, default="[]")
    status = Column(String(50), default="vacant")
    cleaning_status = Column(String(100), default="Ready")
    sac_code = Column(String(50), default="996311")
    created_at = Column(DateTime, default=now_utc)

class BanquetBooking(Base):
    __tablename__ = "banquet_bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_no = Column(String(100), unique=True, index=True, nullable=False) # e.g. BQ/89/24-25
    event_name = Column(String(150), nullable=False)
    event_type = Column(String(100), default="Wedding / Reception")
    host_name = Column(String(150), nullable=False)
    contact_person = Column(String(150), nullable=False)
    contact_mobile = Column(String(50), nullable=False)
    contact_email = Column(String(150), nullable=True)
    venue_id = Column(String(100), index=True, nullable=False)
    venue_name = Column(String(150), nullable=False)
    venue_tariff = Column(Float, default=0.0)
    booking_date = Column(String(50), nullable=False)
    event_date = Column(String(50), nullable=False)
    check_in_date = Column(String(50), nullable=True)
    check_out_date = Column(String(50), nullable=True)
    guaranteed_pax = Column(Integer, default=100)
    actual_pax_served = Column(Integer, default=100)
    per_plate_rate = Column(Float, default=0.0)
    total_food_amount = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    advance_paid = Column(Float, default=0.0)
    balance_due = Column(Float, default=0.0)
    status = Column(String(50), default="Confirmed")
    financial_summary_json = Column(Text, default="{}")
    kots_json = Column(Text, default="[]")
    payments_json = Column(Text, default="[]")
    linked_rooms_json = Column(Text, default="[]")
    seating_layout = Column(String(100), default="Standard Banquet")
    created_at = Column(DateTime, default=now_utc)

class LiquorItem(Base):
    __tablename__ = "liquor_items"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(100), unique=True, index=True, nullable=False) # e.g. LIQ-10070
    s_no = Column(Integer, default=1)
    name = Column(String(150), nullable=False)
    brand_name = Column(String(150), nullable=False)
    barcode_no = Column(String(100), nullable=True)
    group = Column(String(50), default="Liquor")
    mrp = Column(Float, default=0.0)
    rate = Column(Float, default=0.0)
    purchase_rate = Column(Float, default=0.0)
    unit = Column(String(50), default="30 ml")
    conversion_ml = Column(Float, default=30.0)
    tax_type = Column(String(50), default="VAT 13%")
    vat_percentage = Column(Float, default=13.0)
    surcharge_percentage = Column(Float, default=10.0)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_utc)

class BarInvoice(Base):
    __tablename__ = "bar_invoices"

    id = Column(Integer, primary_key=True, index=True)
    bill_no = Column(String(100), unique=True, index=True, nullable=False) # e.g. Res/289/24-25
    date = Column(String(50), nullable=False)
    time = Column(String(50), nullable=True)
    table_no = Column(String(50), default="Bar Counter")
    kot_no = Column(String(50), nullable=True)
    service_type = Column(String(50), default="Bar Counter")
    guest_name = Column(String(150), nullable=True)
    guest_mobile = Column(String(50), nullable=True)
    items_json = Column(Text, default="[]")
    total_items = Column(Integer, default=1)
    total_quantity = Column(Float, default=1.0)
    basic_amount = Column(Float, default=0.0)
    vat_amount = Column(Float, default=0.0)
    surcharge_amount = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    settled = Column(Boolean, default=True)
    payment_mode = Column(String(50), default="CASH")
    room_no = Column(String(50), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    void_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=now_utc)

class HotelAsset(Base):
    __tablename__ = "hotel_assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. AST-001
    asset_name = Column(String(150), nullable=False)
    category = Column(String(100), default="Linen")
    unit = Column(String(50), default="Pcs")
    total_purchased = Column(Float, default=0.0)
    in_rooms = Column(Float, default=0.0)
    in_linen_store = Column(Float, default=0.0)
    in_laundry = Column(Float, default=0.0)
    in_damaged_repair = Column(Float, default=0.0)
    missing_discrepancy = Column(Float, default=0.0)
    unit_cost = Column(Float, default=0.0)
    last_audit_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=now_utc)

class Locker(Base):
    __tablename__ = "lockers"

    id = Column(Integer, primary_key=True, index=True)
    locker_no = Column(String(50), unique=True, index=True, nullable=False) # e.g. LCK-101
    locker_size = Column(String(50), default="Medium")
    daily_rate = Column(Float, default=100.0)
    status = Column(String(50), default="Vacant")
    assigned_guest_name = Column(String(150), nullable=True)
    assigned_room_no = Column(String(50), nullable=True)
    key_number = Column(String(50), default="K-101")
    security_deposit = Column(Float, default=500.0)
    created_at = Column(DateTime, default=now_utc)

class WhatsAppLog(Base):
    __tablename__ = "whatsapp_logs"

    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(String(100), unique=True, index=True, nullable=False)
    timestamp_str = Column(String(50), nullable=False)
    recipient_mobile = Column(String(50), nullable=False)
    recipient_name = Column(String(150), nullable=False)
    recipient_type = Column(String(50), default="Guest")
    voucher_type = Column(String(50), default="Check-In")
    voucher_no = Column(String(100), nullable=True)
    room_no = Column(String(50), nullable=True)
    message = Column(Text, nullable=False)
    status = Column(String(50), default="Sent")
    firm_id = Column(String(50), default="SVR0001")
    created_at = Column(DateTime, default=now_utc)

class WhatsAppConfig(Base):
    __tablename__ = "whatsapp_configs"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(50), unique=True, default="default")
    api_url = Column(String(255), default="https://api.whatsapp-gateway.com/v1")
    instance_id = Column(String(100), default="SVR_WHATSAPP_INST_01")
    token = Column(String(255), default="waba_token_svr_live_2026")
    owner_mobile = Column(String(50), default="9440289999")
    validity_date = Column(String(50), default="2026-12-31")
    auto_send_on_checkin = Column(Boolean, default=True)
    auto_send_on_checkout = Column(Boolean, default=True)
    auto_send_on_booking = Column(Boolean, default=True)
    auto_send_on_food_bill = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_utc)

class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_no = Column(String(100), unique=True, index=True, nullable=False) # e.g. TKT-2026-001
    date = Column(String(50), nullable=False)
    time = Column(String(50), nullable=True)
    staff_name = Column(String(150), nullable=False)
    department = Column(String(100), default="Front Office")
    phone = Column(String(50), default="9440289999")
    category = Column(String(100), default="Billing & Checkout")
    priority = Column(String(50), default="Medium")
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Open")
    assigned_engineer = Column(String(150), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)

class HotelSetting(Base):
    __tablename__ = "hotel_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, default="default")
    firm_name = Column(String(200), default="SRI SAI VASUDEV RESIDENCY")
    legal_name = Column(String(200), default="PAIDISETTY MANMADHA RAO")
    trade_name = Column(String(200), default="SRI SAI VASUDEV RESIDENCY")
    address1 = Column(Text, default="SR RESIDENCY, NEAR ANDHRA BANK, NEW COLONY")
    address2 = Column(Text, nullable=True)
    city = Column(String(100), default="Rayagada")
    state = Column(String(100), default="Odisha")
    pincode = Column(String(20), default="765001")
    phone = Column(String(50), default="+91 94402 89999")
    mobile = Column(String(50), default="+91 94402 89999")
    email = Column(String(150), default="saivasudevresidency@gmail.com")
    website = Column(String(150), default="https://hotelsai-vasudevresidency.com")
    gst_no = Column(String(50), default="21AEKPP8689J1ZS")
    company_gst_code = Column(String(10), default="21")
    pan_no = Column(String(50), nullable=True)
    fssai_no = Column(String(50), nullable=True)
    bank_name = Column(String(100), default="State Bank of India")
    bank_account_no = Column(String(100), default="39820011928")
    bank_ifsc = Column(String(50), default="SBIN0001234")
    bank_branch = Column(String(100), default="Rayagada Branch")
    upi_id = Column(String(100), default="saivasudev@sbi")
    calculation_type = Column(String(50), default="12hour")
    standard_checkout_time = Column(String(50), default="11:00 AM")
    make_all_bill_local_gst = Column(Boolean, default=True)
    restaurant_food_bill_tax_inclusive = Column(Boolean, default=False)
    terms_and_conditions = Column(Text, nullable=True)
    logo_url = Column(Text, nullable=True)
    seal_url = Column(Text, nullable=True)
    signature_url = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

class RoomType(Base):
    __tablename__ = "room_types"

    id = Column(Integer, primary_key=True, index=True)
    type_id = Column(String(100), unique=True, index=True, nullable=False)
    room_type_name = Column(String(150), nullable=False)
    package = Column(String(100), default="EP")
    gst_tax_string = Column(String(100), default="GST 12%")
    gst_percent = Column(Float, default=12.0)
    room_tariff = Column(Float, default=2500.0)
    discount_percent = Column(Float, default=0.0)
    created_at = Column(DateTime, default=now_utc)

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    rate = Column(Float, default=0.0)
    sale_rate = Column(Float, default=0.0)
    mrp = Column(Float, default=0.0)
    purchase_rate = Column(Float, default=0.0)
    unit = Column(String(50), default="Pcs")
    gst_percent = Column(Float, default=5.0)
    head_group = Column(String(100), default="Restaurant_Item")
    hsn_code = Column(String(50), nullable=True)
    sac_code = Column(String(50), default="996331")
    no_discount = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now_utc)

class HousekeepingRecord(Base):
    __tablename__ = "housekeeping_records"

    id = Column(Integer, primary_key=True, index=True)
    room_no = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(String(100), default="Vacant Clean")
    assigned_staff = Column(String(100), default="Ramesh")
    priority = Column(String(100), default="Normal")
    last_cleaned_time = Column(String(100), nullable=True)
    cleaning_started_at = Column(String(100), nullable=True)
    maintenance_issue = Column(Text, nullable=True)
    maintenance_logged_at = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

class AgentCommissionAccrual(Base):
    __tablename__ = "agent_commissions"

    id = Column(Integer, primary_key=True, index=True)
    commission_id = Column(String(100), unique=True, index=True, nullable=False)
    agent_id = Column(String(100), index=True, nullable=False)
    agent_name = Column(String(150), nullable=False)
    agent_type = Column(String(100), default="Travel Agent")
    check_in_no = Column(String(100), nullable=True)
    booking_ref_no = Column(String(100), nullable=True, index=True)
    room_no = Column(String(50), nullable=False)
    guest_name = Column(String(150), nullable=False)
    guest_mobile = Column(String(50), nullable=True)
    check_in_date = Column(String(50), nullable=False)
    check_out_date = Column(String(50), nullable=False)
    number_of_nights = Column(Integer, default=1)
    room_tariff = Column(Float, default=0.0)
    gross_room_tariff = Column(Float, default=0.0)
    commission_type = Column(String(50), default="PERCENTAGE")
    commission_rate = Column(Float, default=10.0)
    gross_commission = Column(Float, default=0.0)
    tds_percentage = Column(Float, default=5.0)
    tds_amount = Column(Float, default=0.0)
    net_payable_commission = Column(Float, default=0.0)
    status = Column(String(50), default="PENDING")
    payout_voucher_no = Column(String(100), nullable=True)
    payout_voucher_id = Column(Integer, nullable=True)
    approved_by = Column(String(100), default="General Manager")
    payment_mode = Column(String(50), default="Direct Transfer")
    utr_reference = Column(String(100), nullable=True)
    payout_date = Column(String(50), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)

class WhatsAppTemplate(Base):
    __tablename__ = "whatsapp_templates"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(String(100), unique=True, index=True, nullable=False)
    s_no = Column(Integer, default=1)
    type = Column(String(50), default="WhatsApp")
    voucher_type = Column(String(100), nullable=False)
    label = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    active = Column(String(20), default="On")
    send_to = Column(String(50), default="Guest")
    created_at = Column(DateTime, default=now_utc)

class RolePermission(Base):
    __tablename__ = "roles_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    permissions_json = Column(Text, default="[]")
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now_utc)

class NoDiscountRule(Base):
    __tablename__ = "no_discount_configs"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(100), unique=True, index=True, default="default")
    enabled = Column(Boolean, default=True)
    protected_groups_json = Column(Text, default='["Beverage","Liquor","Beer","Tobacco"]')
    max_allowed_discount_percent = Column(Float, default=20.0)
    allow_manual_override = Column(Boolean, default=True)
    override_role_required = Column(String(100), default="Admin")
    reason_required_for_override = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

class LiquorBrand(Base):
    __tablename__ = "liquor_brands"

    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(String(100), unique=True, index=True, nullable=False)
    s_no = Column(Integer, default=1)
    name = Column(String(150), nullable=False)
    discount_percentage = Column(Float, default=0.0)
    status = Column(String(50), default="ACTIVE")
    created_at = Column(DateTime, default=now_utc)

class LiquorUnit(Base):
    __tablename__ = "liquor_units"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(String(100), unique=True, index=True, nullable=False)
    s_no = Column(Integer, default=1)
    primary_unit_name = Column(String(100), nullable=False)
    conversion = Column(Float, default=1.0)
    alternate_unit_name = Column(String(100), default="ML")
    created_at = Column(DateTime, default=now_utc)

class DiscountAuditLog(Base):
    __tablename__ = "discount_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(String(100), unique=True, index=True, nullable=True)
    bill_no = Column(String(100), index=True, nullable=False)
    room_no = Column(String(50), nullable=True)
    table_no = Column(String(50), nullable=True)
    customer_name = Column(String(150), nullable=True)
    gross_amount = Column(Float, default=0.0)
    discount_percent = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    reason = Column(String(255), nullable=True)
    manager_name = Column(String(100), default="Admin")
    manager_pin_verified = Column(Boolean, default=True)
    margin_saved = Column(Float, default=0.0)
    protected_items_prevented = Column(Integer, default=0)
    created_at = Column(DateTime, default=now_utc)

class HotelProperty(Base):
    __tablename__ = "hotel_properties"

    id = Column(Integer, primary_key=True, index=True)
    firm_id = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    code = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), default="Rayagada")
    state = Column(String(100), default="Odisha")
    pincode = Column(String(20), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    gst_no = Column(String(50), nullable=True)
    is_current = Column(Boolean, default=False)
    total_rooms = Column(Integer, default=0)
    created_at = Column(DateTime, default=now_utc)

class TableShift(Base):
    __tablename__ = "table_shifts"

    id = Column(Integer, primary_key=True, index=True)
    shift_id = Column(String(50), unique=True, index=True, nullable=False)
    from_table = Column(String(50), nullable=False)
    to_table = Column(String(50), nullable=False)
    transferred_count = Column(Integer, default=0)
    reason = Column(String(255), nullable=True)
    shifted_by = Column(String(100), default="Cashier")
    created_at = Column(DateTime, default=now_utc)

class TableSessionRecord(Base):
    __tablename__ = "table_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(50), unique=True, index=True, nullable=False)
    table_no = Column(String(50), nullable=False, index=True)
    start_time = Column(String(50), nullable=False)
    status = Column(String(50), default="Active")
    kot_numbers_json = Column(Text, default="[]")
    cumulative_items_json = Column(Text, default="[]")
    cumulative_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=now_utc)

class RfidKeyCard(Base):
    __tablename__ = "rfid_keycards"

    id = Column(Integer, primary_key=True, index=True)
    card_number = Column(String(100), unique=True, index=True, nullable=False)
    card_uuid = Column(String(100), nullable=True)
    room_no = Column(String(50), nullable=False, index=True)
    guest_name = Column(String(150), nullable=False)
    check_in_time = Column(String(50), nullable=False)
    valid_until = Column(String(50), nullable=False)
    status = Column(String(50), default="Active")
    issued_by = Column(String(100), default="Front Desk")
    created_at = Column(DateTime, default=now_utc)

class HotelCompanyInfo(Base):
    __tablename__ = "hotel_company_info"

    id = Column(Integer, primary_key=True, index=True)
    property_name = Column(String(200), default="SRI SAI VASUDEV RESIDENCY")
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    gstin = Column(String(50), nullable=True)
    logo_url = Column(String(500), nullable=True)
    seal_url = Column(String(500), nullable=True)
    default_bill_format = Column(String(50), default="standard")
    terms_and_conditions = Column(Text, nullable=True)
    legal_name = Column(String(150), nullable=True)
    pan_number = Column(String(20), nullable=True)
    bank_name = Column(String(100), nullable=True)
    bank_account_no = Column(String(50), nullable=True)
    bank_ifsc = Column(String(20), nullable=True)
    bank_branch = Column(String(100), nullable=True)
    upi_id = Column(String(50), nullable=True)
    phonepe_gpay = Column(String(50), nullable=True)
    jurisdiction = Column(String(100), default="RAYAGADA DIVISION")
    updated_at = Column(DateTime, default=now_utc)

class LiquorStockAdjustment(Base):
    __tablename__ = "liquor_stock_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(150), nullable=False, index=True)
    item_id = Column(String(50), nullable=True)
    bottle_size_ml = Column(Integer, default=750)
    transaction_type = Column(String(50), nullable=False)
    qty_pegs = Column(Float, nullable=False)
    pegs_per_bottle = Column(Integer, default=25)
    reference_no = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=now_utc)

class LiquorStock(Base):
    __tablename__ = "liquor_stocks"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(150), unique=True, index=True, nullable=False)
    bottle_size_ml = Column(Integer, default=750)
    opening_bottles = Column(Float, default=0.0)
    received_bottles = Column(Float, default=0.0)
    sold_pegs = Column(Float, default=0.0)
    pegs_per_bottle = Column(Integer, default=25)
    closing_bottles = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

# =========================================================================
# MODULE 1 & 2 ARCHITECTURAL ENTITIES (Financial Integrity & Concurrency)
# =========================================================================

class IdempotencyKey(Base):
    """
    Stores idempotency records for POST routes to guarantee financial integrity (#1).
    Allows 24-hour TTL caching of response codes and bodies.
    """
    __tablename__ = "idempotency_keys"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, index=True, nullable=False)
    endpoint = Column(String(255), nullable=False)
    request_hash = Column(String(64), nullable=False)
    response_status = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    created_at = Column(TimezoneAwareDateTime, default=now_utc, nullable=False)

class WebhookEvent(Base):
    """
    Immediate raw ingestion table for Decentro webhooks (#36).
    Tracks status lifecycle: PENDING -> PROCESSED | FAILED.
    """
    __tablename__ = "webhook_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), unique=True, index=True, nullable=False)
    decentro_txn_id = Column(String(150), unique=True, index=True, nullable=True)
    idempotency_key = Column(String(255), unique=True, index=True, nullable=True)
    source = Column(String(50), default="DECENTRO", nullable=False)
    event_type = Column(String(100), nullable=True)
    payload_json = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING", index=True, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    last_error = Column(Text, nullable=True)
    created_at = Column(TimezoneAwareDateTime, default=now_utc, nullable=False)
    processed_at = Column(TimezoneAwareDateTime, nullable=True)

class FailedWebhookDLQ(Base):
    """
    Dead Letter Queue (DLQ) for webhooks that fail after 3 retries (#39).
    Exposes admin recovery replay via /api/v1/admin/dlq/replay.
    """
    __tablename__ = "failed_webhook_dlq"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), index=True, nullable=False)
    source = Column(String(50), default="DECENTRO", nullable=False)
    payload_json = Column(Text, nullable=False)
    failure_reason = Column(Text, nullable=False)
    retry_count = Column(Integer, default=3, nullable=False)
    status = Column(String(50), default="FAILED", index=True, nullable=False)
    created_at = Column(TimezoneAwareDateTime, default=now_utc, nullable=False)
    replayed_at = Column(TimezoneAwareDateTime, nullable=True)
    replayed_by = Column(String(100), nullable=True)

class RefreshToken(Base):
    """
    Stores 7-day rotating refresh tokens for JWT authentication (#47, #44).
    Supports instant revocation on shift handover, logout, or session rotation.
    """
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(500), unique=True, index=True, nullable=False)
    user_id = Column(String(100), index=True, nullable=False) # Email or Username
    role = Column(String(50), nullable=False) # OWNER, MANAGER, RECEPTIONIST, STEWARD, HOUSEKEEPING
    expires_at = Column(TimezoneAwareDateTime, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    revoked_at = Column(TimezoneAwareDateTime, nullable=True)
    revocation_reason = Column(String(100), nullable=True) # LOGOUT, SHIFT_HANDOVER, ROTATED
    created_at = Column(TimezoneAwareDateTime, default=now_utc, nullable=False)

class RatePlan(Base):
    """Rate Plan entity supporting version_id optimistic locking (#25, #26)."""
    __tablename__ = "rate_plans"

    id = Column(Integer, primary_key=True, index=True)
    plan_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    room_type_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    base_price_modifier = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    version_id = Column(Integer, default=1, nullable=False)
    created_at = Column(TimezoneAwareDateTime, default=now_utc)
    updated_at = Column(TimezoneAwareDateTime, default=now_utc, onupdate=now_utc)

class Guest(Base):
    """Guest master entity supporting version_id optimistic locking & composite indexing (#20, #25)."""
    __tablename__ = "guests"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    phone = Column(String(50), index=True, nullable=False)
    email = Column(String(150), nullable=True)
    gstin = Column(String(20), index=True, nullable=True)
    id_proof_type = Column(String(50), default="Aadhaar Card")
    id_proof_number = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    version_id = Column(Integer, default=1, nullable=False)
    created_at = Column(TimezoneAwareDateTime, default=now_utc)
    updated_at = Column(TimezoneAwareDateTime, default=now_utc, onupdate=now_utc)

    __table_args__ = (
        Index("ix_guests_phone_gstin", "phone", "gstin"),
    )

class Folio(Base):
    """
    Dedicated Master Folio record for guest stay settlement (#20, #26).
    Maintains canonical lock target and tracks balances & version_id.
    """
    __tablename__ = "folios"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    folio_number = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(String(50), default="OPEN", index=True, nullable=False) # OPEN, SETTLED, CLOSED, VOID
    total_charges = Column(Float, default=0.0)
    total_payments = Column(Float, default=0.0)
    balance_due = Column(Float, default=0.0)
    version_id = Column(Integer, default=1, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    void_reason = Column(String(255), nullable=True)
    created_at = Column(TimezoneAwareDateTime, default=now_utc)
    updated_at = Column(TimezoneAwareDateTime, default=now_utc, onupdate=now_utc)

    booking = relationship("Booking", back_populates="folios")

    __table_args__ = (
        Index("ix_folios_booking_id_status", "booking_id", "status"),
    )

class KOTOrder(Base):
    """
    KOT Order record supporting composite index (room_id, status) (#20, #21).
    """
    __tablename__ = "kot_orders"

    id = Column(Integer, primary_key=True, index=True)
    kot_number = Column(String(50), unique=True, index=True, nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True, index=True)
    room_no = Column(String(50), nullable=True, index=True)
    table_no = Column(String(50), nullable=True)
    status = Column(String(50), default="PLACED", index=True, nullable=False) # PLACED, PREPARING, READY, SERVED, BILLED, VOID
    total_amount = Column(Float, default=0.0)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    void_reason = Column(String(255), nullable=True)
    created_at = Column(TimezoneAwareDateTime, default=now_utc)
    updated_at = Column(TimezoneAwareDateTime, default=now_utc, onupdate=now_utc)

    __table_args__ = (
        Index("ix_kot_orders_room_id_status", "room_id", "status"),
    )

# =========================================================================
# MODULE 1: STAFF PROFILES, SALARY ADVANCES & MONTHLY PAYROLL
# =========================================================================
class StaffProfile(Base):
    """
    Staff Profile model for Hotel Sai Vasudev Residency.
    Covers workers across Front Office, Housekeeping, Vasudev Rasoi F&B, Maintenance, Security, etc.
    """
    __tablename__ = "staff_profiles"

    id = Column(Integer, primary_key=True, index=True)
    staff_code = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=False, index=True)
    gender = Column(String(20), nullable=False)  # Male, Female, Other
    role = Column(String(100), nullable=False)   # Profession / Role
    department = Column(String(100), nullable=False, index=True) # Department
    phone = Column(String(30), nullable=False)
    monthly_base_salary = Column(Float, nullable=False, default=0.0)
    emergency_contact = Column(String(30), nullable=True)
    date_of_joining = Column(String(30), nullable=True)
    bank_name = Column(String(100), nullable=True)
    bank_account_no = Column(String(50), nullable=True)
    bank_ifsc = Column(String(30), nullable=True)
    aadhaar_number = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(TimezoneAwareDateTime, default=now_utc)
    updated_at = Column(TimezoneAwareDateTime, default=now_utc, onupdate=now_utc)

class StaffSalaryAdvance(Base):
    """
    Mid-month salary advance records deducted automatically in end-of-month payroll.
    """
    __tablename__ = "staff_salary_advances"

    id = Column(Integer, primary_key=True, index=True)
    advance_voucher_no = Column(String(50), unique=True, index=True, nullable=False)
    staff_id = Column(Integer, ForeignKey("staff_profiles.id"), nullable=False, index=True)
    advance_date = Column(String(30), nullable=False, index=True)
    month_period = Column(String(20), nullable=False, index=True)  # e.g. "2026-11"
    amount = Column(Float, nullable=False)
    payment_mode = Column(String(50), default="Cash")  # Cash, UPI, Bank Transfer
    remarks = Column(Text, nullable=True)
    is_deducted = Column(Boolean, default=False, index=True)
    deducted_in_payroll_id = Column(Integer, nullable=True)
    created_at = Column(TimezoneAwareDateTime, default=now_utc)
    updated_at = Column(TimezoneAwareDateTime, default=now_utc, onupdate=now_utc)

class StaffMonthlyPayroll(Base):
    """
    End-of-month consolidated payroll record for each worker.
    Net Payable = Monthly Base Salary - Total Advances Taken in Month + Bonuses - Deductions.
    """
    __tablename__ = "staff_monthly_payroll"

    id = Column(Integer, primary_key=True, index=True)
    payroll_period = Column(String(20), nullable=False, index=True)  # e.g. "2026-11"
    staff_id = Column(Integer, ForeignKey("staff_profiles.id"), nullable=False, index=True)
    staff_name = Column(String(150), nullable=False)
    department = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)
    monthly_base_salary = Column(Float, nullable=False)
    total_advance_deducted = Column(Float, default=0.0)
    bonus_or_allowance = Column(Float, default=0.0)
    other_deductions = Column(Float, default=0.0)
    net_payable_salary = Column(Float, nullable=False)
    payout_status = Column(String(30), default="Pending", index=True)  # Pending, Paid
    payment_date = Column(String(30), nullable=True)
    payment_mode = Column(String(50), nullable=True)  # Bank Transfer, Cash, UPI
    payment_reference = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(TimezoneAwareDateTime, default=now_utc)
    updated_at = Column(TimezoneAwareDateTime, default=now_utc, onupdate=now_utc)

    __table_args__ = (
        Index("ix_staff_payroll_period_staff", "payroll_period", "staff_id", unique=True),
    )

# =========================================================================
# POSTGRESQL BTREE_GIST EXCLUSION CONSTRAINT (#14)
# =========================================================================
# Prevents two active reservations (CONFIRMED or CHECKED_IN) from overlapping in date range for the same room_id
event.listen(
    Booking.__table__,
    'after_create',
    DDL(
        "CREATE EXTENSION IF NOT EXISTS btree_gist; "
        "ALTER TABLE bookings ADD CONSTRAINT no_overlapping_active_bookings "
        "EXCLUDE USING gist (room_id WITH =, daterange(check_in_date::date, check_out_date::date) WITH &&) "
        "WHERE (status IN ('Confirmed', 'Checked-In', 'CONFIRMED', 'CHECKED_IN'));"
    ).execute_if(dialect='postgresql')
)
