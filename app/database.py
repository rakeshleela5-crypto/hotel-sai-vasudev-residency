import os
import logging
from typing import AsyncGenerator, Generator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import with_loader_criteria
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker
)
from app.config import settings

logger = logging.getLogger("pms_database")

# Base model for all declarative entities
Base = declarative_base()

def get_sync_database_url() -> str:
    """Returns database URL formatted for synchronous SQLAlchemy engine."""
    url = settings.get_database_url
    # Ensure standard postgresql driver format
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    elif url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql+asyncpg://", "postgresql://", 1)
    return url

def get_async_database_url() -> str:
    """Returns database URL formatted for asynchronous SQLAlchemy engine with asyncpg or aiosqlite."""
    url = settings.get_database_url
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("sqlite:///") and not url.startswith("sqlite+aiosqlite:///"):
        url = url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    return url

sync_url = get_sync_database_url()
async_url = get_async_database_url()

# =========================================================================
# 1. ASYNC ENGINE & CONNECTION POOL (Asyncpg / Railway PostgreSQL)
# =========================================================================
is_sqlite = "sqlite" in sync_url

if is_sqlite:
    async_engine = create_async_engine(
        async_url,
        connect_args={"check_same_thread": False, "timeout": 30},
        echo=False
    )
    engine = create_engine(
        sync_url,
        connect_args={"check_same_thread": False, "timeout": 30},
        echo=False
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=30000")
        cursor.execute("PRAGMA synchronous=NORMAL")
        try:
            cursor.execute("ALTER TABLE stock_transfers ADD COLUMN status VARCHAR(50) DEFAULT 'ISSUED'")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE hotel_settings ADD COLUMN manager_pin_hash VARCHAR(255)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE hotel_settings ADD COLUMN manager_pin_salt VARCHAR(64)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE checkout_records ADD COLUMN payment_splits_json TEXT DEFAULT '[]'")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE checkout_records ADD COLUMN company_name VARCHAR(150)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE checkout_records ADD COLUMN customer_gstin VARCHAR(20)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE checkout_records ADD COLUMN city VARCHAR(100)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE checkout_records ADD COLUMN state VARCHAR(100)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE checkout_records ADD COLUMN country VARCHAR(100) DEFAULT 'India'")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE checkout_records ADD COLUMN pin_code VARCHAR(20)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE checkout_records ADD COLUMN sac_code VARCHAR(20) DEFAULT '996311'")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE checkout_records ADD COLUMN invoice_format VARCHAR(50) DEFAULT 'A4_Standard'")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE checkout_records ADD COLUMN payments_json TEXT DEFAULT '[]'")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE checkout_records ADD COLUMN round_off_amount REAL DEFAULT 0.0")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE checkout_records ADD COLUMN settled_by_user_id VARCHAR(100)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE food_bills ADD COLUMN payment_splits_json TEXT DEFAULT '[]'")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE shift_handovers ADD COLUMN drawer_drops_to_safe REAL DEFAULT 0.0")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE shift_handovers ADD COLUMN paid_in_drawer_float REAL DEFAULT 0.0")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE shift_handovers ADD COLUMN cash_refunds_paid REAL DEFAULT 0.0")
        except Exception:
            pass
        try:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS inventory_lots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lot_number VARCHAR(100) UNIQUE NOT NULL,
                item_code VARCHAR(100),
                item_name VARCHAR(150) NOT NULL,
                category VARCHAR(100) DEFAULT 'Perishables',
                store_name VARCHAR(100) DEFAULT 'Kitchen Store',
                purchase_date DATETIME NOT NULL,
                expiry_date DATETIME,
                unit_of_measure VARCHAR(50) DEFAULT 'kg',
                initial_quantity REAL NOT NULL DEFAULT 0.0,
                remaining_quantity REAL NOT NULL DEFAULT 0.0,
                unit_cost_paise INTEGER NOT NULL DEFAULT 0,
                unit_cost REAL NOT NULL DEFAULT 0.0,
                supplier_name VARCHAR(150),
                invoice_ref VARCHAR(100),
                status VARCHAR(50) DEFAULT 'Active',
                notes TEXT,
                created_at DATETIME,
                updated_at DATETIME
            )
            """)
        except Exception:
            pass
        try:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS inventory_waste_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                voucher_no VARCHAR(100) UNIQUE NOT NULL,
                lot_id INTEGER NOT NULL,
                item_name VARCHAR(150) NOT NULL,
                store_name VARCHAR(100) DEFAULT 'Kitchen Store',
                quantity_wasted REAL NOT NULL,
                unit_of_measure VARCHAR(50) DEFAULT 'kg',
                unit_cost_paise INTEGER NOT NULL DEFAULT 0,
                unit_cost REAL NOT NULL DEFAULT 0.0,
                total_loss_paise INTEGER NOT NULL DEFAULT 0,
                total_loss_rupees REAL NOT NULL DEFAULT 0.0,
                waste_reason VARCHAR(100) NOT NULL,
                reported_by VARCHAR(150) NOT NULL,
                inspected_by VARCHAR(150),
                manager_pin_verified BOOLEAN DEFAULT 0,
                journal_entry_id INTEGER,
                action_taken VARCHAR(150) DEFAULT 'Disposed',
                notes TEXT,
                recorded_at DATETIME
            )
            """)
        except Exception:
            pass
        try:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS corporate_invoice_receivables (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_no VARCHAR(100) UNIQUE NOT NULL,
                party_id VARCHAR(100),
                party_name VARCHAR(200) NOT NULL,
                booking_ref VARCHAR(100),
                guest_name VARCHAR(150),
                invoice_date VARCHAR(50) NOT NULL,
                due_date VARCHAR(50) NOT NULL,
                invoice_amount_paise INTEGER NOT NULL DEFAULT 0,
                invoice_amount REAL NOT NULL DEFAULT 0.0,
                settled_amount_paise INTEGER NOT NULL DEFAULT 0,
                settled_amount REAL NOT NULL DEFAULT 0.0,
                outstanding_amount_paise INTEGER NOT NULL DEFAULT 0,
                outstanding_amount REAL NOT NULL DEFAULT 0.0,
                status VARCHAR(50) DEFAULT 'Unpaid',
                notes TEXT,
                created_at DATETIME,
                updated_at DATETIME
            )
            """)
        except Exception:
            pass
        try:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS corporate_settlement_allocations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                receipt_voucher_no VARCHAR(100) NOT NULL,
                receivable_id INTEGER NOT NULL,
                party_id VARCHAR(100) NOT NULL,
                allocated_amount_paise INTEGER NOT NULL DEFAULT 0,
                allocated_amount REAL NOT NULL DEFAULT 0.0,
                tds_deducted_paise INTEGER NOT NULL DEFAULT 0,
                tds_deducted_rupees REAL NOT NULL DEFAULT 0.0,
                payment_mode VARCHAR(50) DEFAULT 'NEFT',
                bank_utr_ref VARCHAR(100),
                journal_entry_id INTEGER,
                allocated_by VARCHAR(100) DEFAULT 'Accounts Officer',
                allocated_at DATETIME
            )
            """)
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE party_accounts ADD COLUMN credit_limit_paise INTEGER DEFAULT 0")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE party_accounts ADD COLUMN credit_limit_rupees REAL DEFAULT 0.0")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE party_accounts ADD COLUMN payment_terms_days INTEGER DEFAULT 30")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE party_accounts ADD COLUMN pan_number VARCHAR(50)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE party_accounts ADD COLUMN contact_person VARCHAR(150)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE party_accounts ADD COLUMN email VARCHAR(150)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE party_accounts ADD COLUMN is_blocked_for_credit BOOLEAN DEFAULT 0")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE bookings ADD COLUMN guest_signature_url TEXT")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE bookings ADD COLUMN invoice_pdf_key VARCHAR(255)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE bookings ADD COLUMN id_proof_document_key VARCHAR(255)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE bookings ADD COLUMN guest_photo_url VARCHAR(255)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE bookings ADD COLUMN coming_from VARCHAR(150)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE bookings ADD COLUMN proceeding_to VARCHAR(150)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE bookings ADD COLUMN vehicle_no VARCHAR(50)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE bookings ADD COLUMN darshan_slot VARCHAR(100)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE bookings ADD COLUMN guest_gender VARCHAR(20)")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE bookings ADD COLUMN guest_age INTEGER")
        except Exception:
            pass
        cursor.close()
else:
    # Railway PostgreSQL async engine with asyncpg, pool tuning & 5s lock_timeout
    async_engine = create_async_engine(
        async_url,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True,
        connect_args={
            "server_settings": {
                "lock_timeout": "5000"  # 5000ms = 5s session lock timeout (#15)
            }
        },
        echo=False
    )

    # Railway PostgreSQL sync engine with pool tuning & 5s lock_timeout
    engine = create_engine(
        sync_url,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True,
        connect_args={
            "options": "-c lock_timeout=5000"  # 5s session lock timeout (#15)
        },
        echo=False
    )

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

# Synchronous Session Factory (for backward compatibility)
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

# =========================================================================
# 1B. GLOBAL SOFT-DELETE ORM FILTER (GST & AUDIT COMPLIANCE #21, #38)
# =========================================================================
@event.listens_for(Session, "do_orm_execute")
def _soft_delete_filter(execute_state):
    """
    Automatic soft-delete filter for GST and audit compliance.
    Transparently filters out records with is_deleted=True from standard ORM queries,
    unless execution_options(include_deleted=True) is explicitly specified for audit trails.
    """
    if (
        execute_state.is_orm_statement
        and not execute_state.is_relationship_load
        and not execute_state.execution_options.get("include_deleted", False)
    ):
        execute_state.statement = execute_state.statement.options(
            with_loader_criteria(
                Base,
                lambda cls: cls.is_deleted == False if hasattr(cls, "is_deleted") else True,
                include_aliases=True
            )
        )



# =========================================================================
# 1C. DATABASE OBSERVABILITY & SLOW QUERY MONITORING (>500ms)
# =========================================================================
import time
SLOW_QUERY_THRESHOLD_MS = int(os.getenv("SLOW_QUERY_THRESHOLD_MS", "500"))

@event.listens_for(engine, "before_cursor_execute")
def _before_cursor_execute_sync(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault("query_start_time", []).append(time.perf_counter())

@event.listens_for(engine, "after_cursor_execute")
def _after_cursor_execute_sync(conn, cursor, statement, parameters, context, executemany):
    timers = conn.info.get("query_start_time")
    if timers:
        duration_ms = (time.perf_counter() - timers.pop()) * 1000
        if duration_ms > SLOW_QUERY_THRESHOLD_MS:
            clean_stmt = " ".join(statement.split())[:300]
            logger.warning(
                f"[SlowQuery] Query took {duration_ms:.2f}ms (threshold: {SLOW_QUERY_THRESHOLD_MS}ms): {clean_stmt}"
            )

if hasattr(async_engine, "sync_engine"):
    @event.listens_for(async_engine.sync_engine, "before_cursor_execute")
    def _before_cursor_execute_async(conn, cursor, statement, parameters, context, executemany):
        conn.info.setdefault("query_start_time", []).append(time.perf_counter())

    @event.listens_for(async_engine.sync_engine, "after_cursor_execute")
    def _after_cursor_execute_async(conn, cursor, statement, parameters, context, executemany):
        timers = conn.info.get("query_start_time")
        if timers:
            duration_ms = (time.perf_counter() - timers.pop()) * 1000
            if duration_ms > SLOW_QUERY_THRESHOLD_MS:
                clean_stmt = " ".join(statement.split())[:300]
                logger.warning(
                    f"[SlowQuery] Async query took {duration_ms:.2f}ms (threshold: {SLOW_QUERY_THRESHOLD_MS}ms): {clean_stmt}"
                )

# =========================================================================
# 2. SESSION DEPENDENCY INJECTORS
# =========================================================================
def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for synchronous DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for asynchronous DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
