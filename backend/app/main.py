import datetime
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.config import settings
from app.database import engine, Base, get_db
from app.routes import rooms, bookings, inquiries, pms, uploads

# Initialize DB tables safely
try:
    Base.metadata.create_all(bind=engine)
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
    allow_origin_regex=r"^https://hotel-sai-vasudev-residency(-[a-z0-9]+)?\.pages\.dev$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(rooms.router, prefix=settings.API_V1_STR)
app.include_router(bookings.router, prefix=settings.API_V1_STR)
app.include_router(inquiries.router, prefix=settings.API_V1_STR)
app.include_router(pms.router, prefix=settings.API_V1_STR)
app.include_router(uploads.router, prefix=settings.API_V1_STR)

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
