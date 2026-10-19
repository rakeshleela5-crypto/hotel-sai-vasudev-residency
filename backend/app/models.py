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
    id_proof_type = Column(String(50), default="Aadhaar Card")
    id_proof_number = Column(String(50), nullable=True)

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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    room = relationship("Room", back_populates="bookings")
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
    transaction_ref = Column(String(100), nullable=True) # UPI UTR or Card Auth Code
    notes = Column(String(255), nullable=True)
    collected_by = Column(String(100), default="Front Desk Cashier")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    booking = relationship("Booking", back_populates="payments")

class RoomShift(Base):
    __tablename__ = "room_shifts"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    from_room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    to_room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    shift_date = Column(String(50), nullable=False) # YYYY-MM-DD
    reason = Column(String(255), nullable=False) # AC issue, Guest upgrade, Maintenance
    old_rate = Column(Float, nullable=False)
    new_rate = Column(Float, nullable=False)
    shifted_by = Column(String(100), default="Duty Manager")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

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
    status = Column(String(50), default="Billed") # Billed, Void
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    booking = relationship("Booking", back_populates="folio_items")

class PoliceStationLog(Base):
    __tablename__ = "police_station_logs"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    booking = relationship("Booking", back_populates="police_log")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False, index=True) # CHECK_IN, CHECK_OUT, ROOM_SHIFT, PAYMENT_COLLECTED, DISCOUNT_APPLIED, CANCELLATION
    booking_ref = Column(String(50), nullable=True, index=True)
    performed_by = Column(String(100), nullable=False)
    details_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(50), default="New")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DiningTable(Base):
    __tablename__ = "dining_tables"

    id = Column(Integer, primary_key=True, index=True)
    table_code = Column(String(50), unique=True, index=True, nullable=False)
    table_name = Column(String(100), nullable=False)
    table_group = Column(String(50), default="General") # General, TakeAway, Nc, SelfService
    capacity = Column(Integer, default=4)
    status = Column(String(50), default="Vacant") # Vacant, Running, Billed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class KotTicket(Base):
    __tablename__ = "kot_tickets"

    id = Column(Integer, primary_key=True, index=True)
    kot_no = Column(String(100), unique=True, index=True, nullable=False)
    date = Column(String(50), nullable=False)
    time = Column(String(50), nullable=False)
    table_no = Column(String(50), nullable=True, index=True)
    room_no = Column(String(50), nullable=True, index=True)
    waiter_name = Column(String(100), default="Captain")
    guest_name = Column(String(150), nullable=True)
    pax = Column(Integer, default=2)
    items_json = Column(Text, nullable=False) # JSON array of {itemName, qty, rate, amount}
    total_amount = Column(Float, default=0.0)
    status = Column(String(50), default="Running") # Running, Billed, Cancelled
    is_printed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class MasterItem(Base):
    __tablename__ = "master_items"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), nullable=False, index=True) # gst, business_source, voucher_type, locker, other_charge, item_group, godown, menu_item
    code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    payload_json = Column(Text, nullable=False) # Structured data fields
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class InventoryPurchase(Base):
    __tablename__ = "inventory_purchases"

    id = Column(Integer, primary_key=True, index=True)
    bill_no = Column(String(100), index=True, nullable=False)
    bill_date = Column(String(50), nullable=False)
    godown = Column(String(100), nullable=False)
    supplier_name = Column(String(150), nullable=False)
    items_json = Column(Text, nullable=False)
    total_amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    net_amount = Column(Float, default=0.0)
    terms = Column(String(50), default="Credit")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

