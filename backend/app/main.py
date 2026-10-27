import datetime
from fastapi import FastAPI, Depends
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
            ]:
                try:
                    res = conn.execute(text(f"PRAGMA table_info({table_name})"))
                    cols = [row[1] for row in res.fetchall()]
                    if col_name not in cols:
                        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}"))
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
            "ALTER TABLE police_station_logs ADD COLUMN IF NOT EXISTS id_document_key VARCHAR(255)",
            "ALTER TABLE housekeeping_discrepancies ADD COLUMN IF NOT EXISTS discrepancy_id VARCHAR(50)",
        ]
        for stmt in pg_migrations:
            try:
                with engine.begin() as conn:
                    conn.execute(text(stmt))
            except Exception as e:
                print(f"Notice: PG migration step: {e}")
except Exception as exc:
    print(f"Notice: Initial DB schema sync deferred: {exc}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="FastAPI Backend for Hotel Sai Vasudev Residency connecting Cloudflare Pages to PostgreSQL on Railway",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs"
)

# Production CORS configuration: Restricted to official Cloudflare Pages domains & localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_allowed_origins,
    allow_origin_regex=r"^https://([a-zA-Z0-9-]+\.)?hotel-sai-vasudev-residency(-[a-z0-9]+)?\.pages\.dev$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include API Routers (mounted under /api/v1 as well as direct /api for Decentro webhooks)
app.include_router(rooms.router, prefix=settings.API_V1_STR)
app.include_router(bookings.router, prefix=settings.API_V1_STR)
app.include_router(inquiries.router, prefix=settings.API_V1_STR)
app.include_router(pms.router, prefix=settings.API_V1_STR)
app.include_router(uploads.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)
app.include_router(kyc.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix="/api")
app.include_router(kyc.router, prefix="/api")

@app.get("/", tags=["Root"])
def root():
    return {
        "hotel": "Hotel Sai Vasudev Residency",
        "system": "FastAPI + PostgreSQL (Railway) <-> Cloudflare Pages Frontend",
        "status": "Operational",
        "docs": f"{settings.API_V1_STR}/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint for Railway deployment monitoring"""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "engine": "PostgreSQL" if "postgresql" in settings.get_database_url else "SQLite",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
