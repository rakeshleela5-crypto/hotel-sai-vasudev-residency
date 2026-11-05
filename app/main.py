import os
import datetime
from fastapi import FastAPI, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.config import settings
from app.database import engine, Base, get_db
from app.routes import rooms, bookings, inquiries, pms, uploads, payments, kyc

# Initialize DB tables safely
try:
    from app import models
    Base.metadata.create_all(bind=engine)
    
    is_sqlite = "sqlite" in str(engine.url)
    
    if is_sqlite:
        with engine.connect() as conn:
            for table_name, col_name, col_type in [
                ("dining_tables", "active_session_id", "VARCHAR(100)"),
                ("dining_tables", "merged_with_tables", "VARCHAR(255)"),
                ("kot_tickets", "table_session_id", "VARCHAR(100)"),
                ("kot_tickets", "kot_sequence", "INTEGER DEFAULT 1"),
                ("kot_tickets", "is_delta", "BOOLEAN DEFAULT 0"),
                ("kot_tickets", "delta_items_json", "TEXT"),
                ("kot_tickets", "waiter_name", "VARCHAR(100)"),
                ("kot_tickets", "order_source", "VARCHAR(50) DEFAULT 'Desktop'"),
                ("bookings", "cancellation_reason", "VARCHAR(255)"),
                ("bookings", "discount_amount", "FLOAT DEFAULT 0.0"),
                ("bookings", "actual_check_in", "TIMESTAMP"),
                ("bookings", "actual_check_out", "TIMESTAMP"),
                ("bookings", "id_proof_document_key", "VARCHAR(255)"),
                ("bookings", "guest_photo_url", "VARCHAR(255)"),
                ("bookings", "invoice_pdf_key", "VARCHAR(255)"),
                ("police_station_logs", "id_document_key", "VARCHAR(255)"),
                ("housekeeping_discrepancies", "discrepancy_id", "VARCHAR(50)"),
                ("rooms", "version_id", "INTEGER DEFAULT 1"),
                ("bookings", "version_id", "INTEGER DEFAULT 1"),
                ("audit_logs", "staff_id", "VARCHAR(100)"),
                ("audit_logs", "role", "VARCHAR(50)"),
                ("audit_logs", "action", "VARCHAR(100)"),
                ("audit_logs", "entity_type", "VARCHAR(100)"),
                ("audit_logs", "entity_id", "VARCHAR(100)"),
                ("audit_logs", "old_data", "TEXT"),
                ("audit_logs", "new_data", "TEXT"),
                ("audit_logs", "ip_address", "VARCHAR(50)"),
                ("staff_users", "password_hash", "VARCHAR(255)"),
                ("user_accounts", "password_hash", "VARCHAR(255)"),
                ("bookings", "coming_from", "VARCHAR(150)"),
                ("bookings", "proceeding_to", "VARCHAR(150)"),
                ("bookings", "vehicle_no", "VARCHAR(50)"),
                ("bookings", "darshan_slot", "VARCHAR(100)"),
                ("bookings", "guest_gender", "VARCHAR(20)"),
                ("bookings", "guest_age", "INTEGER"),
                ("checkout_records", "payment_splits_json", "TEXT"),
                ("checkout_records", "settled_by_user_id", "VARCHAR(100)"),
                ("checkout_records", "round_off_amount", "FLOAT DEFAULT 0.0"),
                ("checkout_records", "is_cancelled", "BOOLEAN DEFAULT 0"),
                ("checkout_records", "cancellation_reason", "VARCHAR(255)"),
                ("advance_receipts", "transaction_ref", "VARCHAR(100)"),
                ("advance_receipts", "is_settled_in_checkout", "BOOLEAN DEFAULT 0"),
                ("food_bills", "discount_reason", "VARCHAR(255)"),
                ("food_bills", "payment_ref", "VARCHAR(100)"),
                ("food_bills", "billed_by", "VARCHAR(100)"),
                ("food_bills", "cgst_amount", "FLOAT DEFAULT 0.0"),
                ("food_bills", "sgst_amount", "FLOAT DEFAULT 0.0"),
                ("petty_expenses", "vendor_gstin", "VARCHAR(30)"),
                ("petty_expenses", "attachment_url", "VARCHAR(255)"),
                ("banquet_bookings", "kots_json", "TEXT"),
                ("banquet_bookings", "payments_json", "TEXT"),
                ("banquet_bookings", "linked_rooms_json", "TEXT"),
                ("banquet_bookings", "seating_layout", "VARCHAR(100)"),
                ("agent_commission_accruals", "payout_voucher_id", "VARCHAR(100)"),
                ("agent_commission_accruals", "approved_by", "VARCHAR(100)"),
                ("agent_commission_accruals", "payment_mode", "VARCHAR(50)"),
                ("agent_commission_accruals", "utr_reference", "VARCHAR(100)"),
                ("hotel_company_info", "legal_name", "VARCHAR(255)"),
                ("hotel_company_info", "pan_number", "VARCHAR(20)"),
                ("hotel_company_info", "bank_name", "VARCHAR(150)"),
                ("hotel_company_info", "bank_account_no", "VARCHAR(50)"),
                ("hotel_company_info", "bank_ifsc", "VARCHAR(30)"),
                ("hotel_company_info", "bank_branch", "VARCHAR(100)"),
                ("hotel_company_info", "upi_id", "VARCHAR(100)"),
                ("hotel_company_info", "phonepe_gpay", "VARCHAR(50)"),
                ("hotel_company_info", "jurisdiction", "VARCHAR(100)"),
            ]:
                try:
                    import re
                    if not re.match(r'^[a-zA-Z0-9_]+$', table_name) or not re.match(r'^[a-zA-Z0-9_]+$', col_name):
                        continue
                    safe_table = f'"{table_name}"'
                    safe_col = f'"{col_name}"'
                    res = conn.execute(text(f"PRAGMA table_info({safe_table})"))
                    cols = [row[1] for row in res.fetchall()]
                    if col_name not in cols:
                        conn.execute(text(f"ALTER TABLE {safe_table} ADD COLUMN {safe_col} {col_type}"))
                        conn.commit()
                except Exception as e:
                    print(f"Notice: SQLite migration for {table_name}.{col_name}: {e}")
    else:
        # PostgreSQL: uses ADD COLUMN IF NOT EXISTS in isolated transactions
        pg_migrations = [
            "ALTER TABLE dining_tables ADD COLUMN IF NOT EXISTS active_session_id VARCHAR(100)",
            "ALTER TABLE dining_tables ADD COLUMN IF NOT EXISTS merged_with_tables VARCHAR(255)",
            "ALTER TABLE kot_tickets ADD COLUMN IF NOT EXISTS table_session_id VARCHAR(100)",
            "ALTER TABLE kot_tickets ADD COLUMN IF NOT EXISTS kot_sequence INTEGER DEFAULT 1",
            "ALTER TABLE kot_tickets ADD COLUMN IF NOT EXISTS is_delta BOOLEAN DEFAULT FALSE",
            "ALTER TABLE kot_tickets ADD COLUMN IF NOT EXISTS delta_items_json TEXT",
            "ALTER TABLE kot_tickets ADD COLUMN IF NOT EXISTS waiter_name VARCHAR(100)",
            "ALTER TABLE kot_tickets ADD COLUMN IF NOT EXISTS order_source VARCHAR(50) DEFAULT 'Desktop'",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(255)",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount FLOAT DEFAULT 0.0",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_check_in TIMESTAMP",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_check_out TIMESTAMP",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS id_proof_document_key VARCHAR(255)",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_photo_url VARCHAR(255)",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_pdf_key VARCHAR(255)",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS coming_from VARCHAR(150)",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS proceeding_to VARCHAR(150)",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_no VARCHAR(50)",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS darshan_slot VARCHAR(100)",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_gender VARCHAR(20)",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_age INTEGER",
            "ALTER TABLE checkout_records ADD COLUMN IF NOT EXISTS payment_splits_json TEXT",
            "ALTER TABLE checkout_records ADD COLUMN IF NOT EXISTS settled_by_user_id VARCHAR(100)",
            "ALTER TABLE checkout_records ADD COLUMN IF NOT EXISTS round_off_amount FLOAT DEFAULT 0.0",
            "ALTER TABLE checkout_records ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE",
            "ALTER TABLE checkout_records ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(255)",
            "ALTER TABLE advance_receipts ADD COLUMN IF NOT EXISTS transaction_ref VARCHAR(100)",
            "ALTER TABLE advance_receipts ADD COLUMN IF NOT EXISTS is_settled_in_checkout BOOLEAN DEFAULT FALSE",
            "ALTER TABLE food_bills ADD COLUMN IF NOT EXISTS discount_reason VARCHAR(255)",
            "ALTER TABLE food_bills ADD COLUMN IF NOT EXISTS payment_ref VARCHAR(100)",
            "ALTER TABLE food_bills ADD COLUMN IF NOT EXISTS billed_by VARCHAR(100)",
            "ALTER TABLE food_bills ADD COLUMN IF NOT EXISTS cgst_amount FLOAT DEFAULT 0.0",
            "ALTER TABLE food_bills ADD COLUMN IF NOT EXISTS sgst_amount FLOAT DEFAULT 0.0",
            "ALTER TABLE petty_expenses ADD COLUMN IF NOT EXISTS vendor_gstin VARCHAR(30)",
            "ALTER TABLE petty_expenses ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(255)",
            "ALTER TABLE banquet_bookings ADD COLUMN IF NOT EXISTS kots_json TEXT",
            "ALTER TABLE banquet_bookings ADD COLUMN IF NOT EXISTS payments_json TEXT",
            "ALTER TABLE banquet_bookings ADD COLUMN IF NOT EXISTS linked_rooms_json TEXT",
            "ALTER TABLE banquet_bookings ADD COLUMN IF NOT EXISTS seating_layout VARCHAR(100)",
            "ALTER TABLE agent_commission_accruals ADD COLUMN IF NOT EXISTS payout_voucher_id VARCHAR(100)",
            "ALTER TABLE agent_commission_accruals ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100)",
            "ALTER TABLE agent_commission_accruals ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50)",
            "ALTER TABLE agent_commission_accruals ADD COLUMN IF NOT EXISTS utr_reference VARCHAR(100)",
            "ALTER TABLE hotel_company_info ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255)",
            "ALTER TABLE hotel_company_info ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20)",
            "ALTER TABLE hotel_company_info ADD COLUMN IF NOT EXISTS bank_name VARCHAR(150)",
            "ALTER TABLE hotel_company_info ADD COLUMN IF NOT EXISTS bank_account_no VARCHAR(50)",
            "ALTER TABLE hotel_company_info ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(30)",
            "ALTER TABLE hotel_company_info ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(100)",
            "ALTER TABLE hotel_company_info ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100)",
            "ALTER TABLE hotel_company_info ADD COLUMN IF NOT EXISTS phonepe_gpay VARCHAR(50)",
            "ALTER TABLE hotel_company_info ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR(100)",
            "ALTER TABLE police_station_logs ADD COLUMN IF NOT EXISTS id_document_key VARCHAR(255)",
            "ALTER TABLE housekeeping_discrepancies ADD COLUMN IF NOT EXISTS discrepancy_id VARCHAR(50)",
            "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS version_id INTEGER DEFAULT 1",
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS version_id INTEGER DEFAULT 1",
            "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS staff_id VARCHAR(100)",
            "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS role VARCHAR(50)",
            "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action VARCHAR(100)",
            "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100)",
            "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id VARCHAR(100)",
            "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_data TEXT",
            "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_data TEXT",
            "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50)",
            "ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)",
            "ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)",
        ]
        for stmt in pg_migrations:
            try:
                with engine.begin() as conn:
                    conn.execute(text(stmt))
            except Exception as e:
                print(f"Notice: PG migration step: {e}")
        # Safe high-frequency database index creation (#21)
        safe_indexes = [
            "CREATE INDEX IF NOT EXISTS ix_bookings_guest_phone ON bookings (guest_phone)",
            "CREATE INDEX IF NOT EXISTS ix_bookings_check_in_date ON bookings (check_in_date)",
            "CREATE INDEX IF NOT EXISTS ix_bookings_check_out_date ON bookings (check_out_date)",
            "CREATE INDEX IF NOT EXISTS ix_bookings_status ON bookings (status)",
            "CREATE INDEX IF NOT EXISTS ix_room_shift_logs_from_room ON room_shift_logs (from_room_id)",
            "CREATE INDEX IF NOT EXISTS ix_room_shift_logs_to_room ON room_shift_logs (to_room_id)",
            "CREATE INDEX IF NOT EXISTS ix_police_station_logs_booking_id ON police_station_logs (booking_id)",
            "CREATE INDEX IF NOT EXISTS ix_kot_tickets_status ON kot_tickets (status)",
            "CREATE INDEX IF NOT EXISTS ix_kot_tickets_room_no ON kot_tickets (room_no)",
            "CREATE INDEX IF NOT EXISTS ix_food_bills_date ON food_bills (date)",
            "CREATE INDEX IF NOT EXISTS ix_food_bills_room_no ON food_bills (room_no)",
            "CREATE INDEX IF NOT EXISTS ix_payment_transactions_decentro_txn_id ON payment_transactions (decentro_txn_id)",
            "CREATE INDEX IF NOT EXISTS ix_payment_transactions_reference_id ON payment_transactions (reference_id)",
            "CREATE INDEX IF NOT EXISTS ix_payment_transactions_room_no ON payment_transactions (room_no)",
            "CREATE INDEX IF NOT EXISTS ix_checkout_records_guest_phone ON checkout_records (guest_phone)",
            "CREATE INDEX IF NOT EXISTS ix_checkout_records_check_in_date ON checkout_records (check_in_date)",
            "CREATE INDEX IF NOT EXISTS ix_checkout_records_check_out_date ON checkout_records (check_out_date)",
            "CREATE INDEX IF NOT EXISTS ix_checkout_records_room_no ON checkout_records (room_no)",
            "CREATE INDEX IF NOT EXISTS ix_advance_receipts_date ON advance_receipts (date)",
            "CREATE INDEX IF NOT EXISTS ix_advance_receipts_mobile ON advance_receipts (mobile)",
            "CREATE INDEX IF NOT EXISTS ix_advance_receipts_room_no ON advance_receipts (room_no)",
            "CREATE INDEX IF NOT EXISTS ix_booking_payments_transaction_ref ON booking_payments (transaction_ref)",
            "CREATE INDEX IF NOT EXISTS ix_group_bookings_contact_phone ON group_bookings (contact_phone)",
            "CREATE INDEX IF NOT EXISTS ix_group_bookings_check_in_date ON group_bookings (check_in_date)",
            "CREATE INDEX IF NOT EXISTS ix_group_bookings_check_out_date ON group_bookings (check_out_date)",
            "CREATE INDEX IF NOT EXISTS ix_group_bookings_status ON group_bookings (status)",
            "CREATE INDEX IF NOT EXISTS ix_inventory_purchases_bill_date ON inventory_purchases (bill_date)"
        ]
        with engine.begin() as conn:
            for idx_stmt in safe_indexes:
                try:
                    conn.execute(text(idx_stmt))
                except Exception as e:
                    print(f"Notice: Safe index creation step: {e}")
except Exception as exc:
    print(f"Notice: Initial DB schema sync deferred: {exc}")

from contextlib import asynccontextmanager
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler
from starlette.requests import Request

from app.utils.idempotency import IdempotencyMiddleware, IdempotentResponseException, idempotent_exception_handler
from app.utils.rate_limit import limiter, rate_limit_exceeded_handler
from app.utils.logging_middleware import StructuredLoggingMiddleware, global_500_exception_handler
from app.services.scheduler import start_scheduler, stop_scheduler
from app.routes import auth, health, ws, admin

# Backend Error Tracking: Initialize Sentry only when SENTRY_DSN is set in environment variables (#2)
sentry_dsn = os.getenv("SENTRY_DSN") or getattr(settings, "SENTRY_DSN", "")
if sentry_dsn and sentry_dsn.strip():
    try:
        import sentry_sdk
        sentry_sdk.init(
            dsn=sentry_dsn.strip(),
            traces_sample_rate=1.0,
            profiles_sample_rate=1.0,
            environment=getattr(settings, "ENVIRONMENT", "production")
        )
    except Exception as exc:
        import logging
        logging.getLogger("pms_main").warning(f"Could not initialize Sentry: {exc}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start APScheduler jobs with Asia/Kolkata timezone (#41, #97)
    start_scheduler()
    yield
    # Shutdown: Graceful termination of scheduler
    stop_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="FastAPI Backend for Hotel Sai Vasudev Residency connecting Cloudflare Pages to PostgreSQL on Railway",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    lifespan=lifespan
)

# Global 500 Unhandled Exception Handler with Webhook Alert (#101, #103, #104)
app.add_exception_handler(Exception, global_500_exception_handler)

# Structured JSON Logging with X-Request-ID (#100)
app.add_middleware(StructuredLoggingMiddleware)

# SlowAPI Rate Limiting (#2, #18)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Idempotency Exception Handler & Middleware (#1)
app.add_exception_handler(IdempotentResponseException, idempotent_exception_handler)
app.add_middleware(IdempotencyMiddleware)

# Security Response Headers Middleware (#2, #44)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Production CORS configuration: Restricted to official Cloudflare Pages domains & localhost (#18, #19)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_allowed_origins,
    allow_origin_regex=r"^https://([a-zA-Z0-9-]+\.)?(hotel-)?sai-vasudev-residency(-[a-z0-9]+)?\.pages\.dev$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include API Routers (mounted under /api/v1 as well as direct /api and root paths where required)
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(health.router, prefix="/api")
app.include_router(health.router)

app.include_router(ws.router, prefix=settings.API_V1_STR)
app.include_router(ws.router, prefix="/api")
app.include_router(ws.router)

app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix="/api")

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix="/api")
app.include_router(rooms.router, prefix=settings.API_V1_STR)
app.include_router(bookings.router, prefix=settings.API_V1_STR)
app.include_router(inquiries.router, prefix=settings.API_V1_STR)
app.include_router(pms.router, prefix=settings.API_V1_STR)
app.include_router(pms.router, prefix="/api")
app.include_router(uploads.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix="/api")
app.include_router(payments.router)
app.include_router(kyc.router, prefix=settings.API_V1_STR)
app.include_router(kyc.router, prefix="/api")

@app.get("/health", tags=["Observability & Health Probes"])
@app.get("/api/health", tags=["Observability & Health Probes"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Observability & Health Probes"])
def root_health_alias(response: Response, db: Session = Depends(get_db)):
    """Railway zero-downtime deployment health probe (#85)."""
    from app.routes.health import general_health_check
    return general_health_check(response, db)

@app.post(f"{settings.API_V1_STR}/kot", tags=["KOT Offline Sync"])
@app.post("/api/kot", tags=["KOT Offline Sync"])
def kot_sync_alias_post(payload: dict, db: Session = Depends(get_db)):
    from app.routes.pms import create_kot_ticket
    return create_kot_ticket(payload, db)

@app.get(f"{settings.API_V1_STR}/kot", tags=["KOT Offline Sync"])
@app.get("/api/kot", tags=["KOT Offline Sync"])
def kot_sync_alias_get(db: Session = Depends(get_db)):
    from app.routes.pms import get_kot_tickets
    return get_kot_tickets(db)

@app.get("/", tags=["Root"])
def root():
    return {
        "hotel": "Hotel Sai Vasudev Residency",
        "system": "FastAPI + PostgreSQL (Railway) <-> Cloudflare Pages Frontend",
        "status": "Operational",
        "docs": f"{settings.API_V1_STR}/docs",
        "api_v1": settings.API_V1_STR
    }

