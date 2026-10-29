import datetime
import logging
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db, engine
from app.config import settings
from app.services.r2_storage import r2_service
from app.services.decentro import circuit_breaker

logger = logging.getLogger("pms_health")
router = APIRouter(prefix="/health", tags=["Observability & Health Probes"])

@router.get("/live", status_code=status.HTTP_200_OK)
def liveness_probe():
    """
    Kubernetes / Railway Liveness Probe (#74, #75).
    Instantly verifies the application process is running and accepting HTTP traffic.
    """
    return {
        "status": "alive",
        "service": "hotel-sai-vasudev-backend",
        "version": settings.VERSION,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@router.get("/ready")
def readiness_probe(response: Response, db: Session = Depends(get_db)):
    """
    Kubernetes / Railway Readiness Probe (#74, #76, #77).
    Deep diagnostic verifying:
    1. Active PostgreSQL pool connectivity (SELECT 1)
    2. Cloudflare R2 object storage readiness
    3. Decentro Banking Hub Circuit Breaker status
    Returns 200 if fully operational, 503 if critical dependencies are down.
    """
    now_ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
    is_ready = True
    db_status = "connected"
    
    # 1. Verify Database Connectivity
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        is_ready = False
        db_status = f"unhealthy: {str(exc)}"
        logger.error(f"[Readiness] Database connectivity failure: {exc}")

    # 2. Check Storage Status
    r2_status = r2_service.get_status().get("operating_mode", "Local Fallback")

    # 3. Check Decentro Circuit Breaker State (#12, #80)
    circuit_status = circuit_breaker.get_state()

    if not is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unhealthy",
            "database": db_status,
            "engine": "PostgreSQL" if "postgresql" in str(engine.url) else "SQLite",
            "r2_storage": r2_status,
            "decentro_circuit": circuit_status,
            "timestamp": now_ts
        }

    return {
        "status": "ready",
        "database": "connected",
        "engine": "PostgreSQL" if "postgresql" in str(engine.url) else "SQLite",
        "r2_storage": r2_status,
        "decentro_circuit": circuit_status,
        "timestamp": now_ts
    }

@router.get("/test-error-500", tags=["Observability & Health Probes"])
def trigger_test_error_500():
    """Diagnostic test route verifying global 500 exception handler and webhook alerting (#101)."""
    raise RuntimeError("Intentional test 500 exception for observability verification")

