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
    Base.metadata.create_all(bind=engine)
    
    # Auto-migrate schema: ensure columns added in newer versions exist
    with engine.connect() as conn:
        is_sqlite = "sqlite" in str(engine.url)
        
        # 1. dining_tables
        try:
            res = conn.execute(text("PRAGMA table_info(dining_tables)" if is_sqlite else "SELECT column_name FROM information_schema.columns WHERE table_name='dining_tables'"))
            existing_cols = [row[1] if is_sqlite else row[0] for row in res.fetchall()]
            if "active_session_id" not in existing_cols:
                conn.execute(text("ALTER TABLE dining_tables ADD COLUMN active_session_id VARCHAR(100)"))
            if "merged_with_tables" not in existing_cols:
                conn.execute(text("ALTER TABLE dining_tables ADD COLUMN merged_with_tables VARCHAR(255)"))
            conn.commit()
        except Exception as e:
            print(f"Notice: dining_tables migration: {e}")

        # 2. kot_tickets
        try:
            res = conn.execute(text("PRAGMA table_info(kot_tickets)" if is_sqlite else "SELECT column_name FROM information_schema.columns WHERE table_name='kot_tickets'"))
            existing_cols = [row[1] if is_sqlite else row[0] for row in res.fetchall()]
            if "table_session_id" not in existing_cols:
                conn.execute(text("ALTER TABLE kot_tickets ADD COLUMN table_session_id VARCHAR(100)"))
            if "kot_sequence" not in existing_cols:
                conn.execute(text("ALTER TABLE kot_tickets ADD COLUMN kot_sequence INTEGER DEFAULT 1"))
            if "is_delta" not in existing_cols:
                conn.execute(text("ALTER TABLE kot_tickets ADD COLUMN is_delta BOOLEAN DEFAULT 0"))
            if "delta_items_json" not in existing_cols:
                conn.execute(text("ALTER TABLE kot_tickets ADD COLUMN delta_items_json TEXT"))
            if "waiter_name" not in existing_cols:
                conn.execute(text("ALTER TABLE kot_tickets ADD COLUMN waiter_name VARCHAR(100)"))
            if "order_source" not in existing_cols:
                conn.execute(text("ALTER TABLE kot_tickets ADD COLUMN order_source VARCHAR(50) DEFAULT 'Desktop'"))
            conn.commit()
        except Exception as e:
            print(f"Notice: kot_tickets migration: {e}")

        # 3. bookings
        try:
            res = conn.execute(text("PRAGMA table_info(bookings)" if is_sqlite else "SELECT column_name FROM information_schema.columns WHERE table_name='bookings'"))
            existing_cols = [row[1] if is_sqlite else row[0] for row in res.fetchall()]
            if "cancellation_reason" not in existing_cols:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN cancellation_reason VARCHAR(255)"))
            if "discount_amount" not in existing_cols:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN discount_amount FLOAT DEFAULT 0.0"))
            if "actual_check_in" not in existing_cols:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN actual_check_in TIMESTAMP"))
            if "actual_check_out" not in existing_cols:
                conn.execute(text("ALTER TABLE bookings ADD COLUMN actual_check_out TIMESTAMP"))
            conn.commit()
        except Exception as e:
            print(f"Notice: bookings migration: {e}")
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
