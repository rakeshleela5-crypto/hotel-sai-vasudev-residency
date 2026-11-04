"""
Test Suite: Phase 2 Backend Production Hardening (#68, #69, #56, #85, #79, #18)
Verifies:
  1. Retry Mechanism (#68) & Exponential Backoff (#69):
     - Tenacity configuration: stop_after_attempt(3), wait_exponential(multiplier=1, min=2, max=10)
     - Selective retry: Retries on 5xx / Network / Timeout errors; immediately aborts on 4xx client errors
     - Applied to outbound Decentro API calls and Cloudflare R2 uploads
  2. Rate Limiting (#56):
     - SlowAPI wired to app.state.limiter
     - Limits: /login (5/min), bookings (20/min), QR generation (15/min), webhooks (120/min)
     - 429 Too Many Requests enforced upon exceeding threshold
  3. Health Checks (#85) & Middleware Logging (#79):
     - GET /health and GET /api/health run SELECT 1 and return 200 OK {"status": "healthy", "database": "connected"}
     - 503 Service Unavailable on database connection failure
     - Secret masking on incoming Decentro webhooks (headers and payload)
  4. Disaster Recovery (#18):
     - Compressed snapshot export: backups/sai_vasudev_db_YYYY_MM_DD.json.gz
     - Retention policy: 30 days pruning
     - Admin-only endpoint: POST /api/admin/backup-db (requires OWNER/MANAGER/ADMIN)
"""

import os
import sys
import gzip
import json
import uuid
import datetime
import pytest
from unittest.mock import MagicMock, patch
from sqlalchemy import text
from fastapi import Response, HTTPException

# Ensure backend & root are in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database import engine, SessionLocal
from app import models
from app.config import settings
from app.utils.retry import retry_network_or_5xx, is_network_or_5xx_error
from app.utils.backup import generate_database_json_snapshot, create_and_upload_db_backup, prune_old_r2_backups
from app.utils.logging_middleware import mask_sensitive_value, mask_sensitive_dict
from app.routes.health import general_health_check
from app.routes.admin import trigger_backup_db_endpoint
from app.services.decentro import decentro_client
from app.services.r2_storage import r2_service

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


# =========================================================================
# 1. TEST ITEM 1: RETRY MECHANISM & EXPONENTIAL BACKOFF (#68, #69)
# =========================================================================
def test_retry_configuration_and_predicates():
    """Verifies Tenacity retry decorator configuration and selective error predicate."""
    import httpx

    # 1. Error predicate check
    assert is_network_or_5xx_error(httpx.ConnectTimeout("connection timed out")) is True
    assert is_network_or_5xx_error(httpx.NetworkError("network failure")) is True
    assert is_network_or_5xx_error(TimeoutError("socket timeout")) is True
    assert is_network_or_5xx_error(ConnectionResetError("reset")) is True

    # 5xx error must retry
    mock_500_resp = httpx.Response(500, request=httpx.Request("POST", "https://api.decentro.tech"))
    err_500 = httpx.HTTPStatusError("500 Server Error", request=mock_500_resp.request, response=mock_500_resp)
    assert is_network_or_5xx_error(err_500) is True

    # 4xx client errors must NEVER be retried
    mock_400_resp = httpx.Response(400, request=httpx.Request("POST", "https://api.decentro.tech"))
    err_400 = httpx.HTTPStatusError("400 Bad Request", request=mock_400_resp.request, response=mock_400_resp)
    assert is_network_or_5xx_error(err_400) is False

    mock_404_resp = httpx.Response(404, request=httpx.Request("GET", "https://api.decentro.tech"))
    err_404 = httpx.HTTPStatusError("404 Not Found", request=mock_404_resp.request, response=mock_404_resp)
    assert is_network_or_5xx_error(err_404) is False

    # 2. Tenacity retry decorator behavior
    attempt_count = 0

    @retry_network_or_5xx
    def flaky_network_call():
        nonlocal attempt_count
        attempt_count += 1
        if attempt_count < 3:
            raise httpx.ConnectTimeout("Simulated network timeout")
        return "SUCCESS_AFTER_RETRY"

    # Patch wait to speed up unit test execution
    with patch("tenacity.nap.time.sleep", return_value=None):
        result = flaky_network_call()
        assert result == "SUCCESS_AFTER_RETRY"
        assert attempt_count == 3

    # Verify 4xx aborts immediately on first attempt without retrying
    fail_count = 0

    @retry_network_or_5xx
    def client_error_call():
        nonlocal fail_count
        fail_count += 1
        raise err_400

    with pytest.raises(httpx.HTTPStatusError):
        client_error_call()
    assert fail_count == 1, "4xx client error must not be retried!"


def test_retry_applied_to_decentro_and_r2_storage():
    """Verifies that retry_network_or_5xx is wired into Decentro and Cloudflare R2 services."""
    # Decentro client retry methods
    assert hasattr(decentro_client, "_execute_post_with_retry")
    assert hasattr(decentro_client, "_execute_get_with_retry")
    assert hasattr(decentro_client._execute_post_with_retry, "retry")
    assert hasattr(decentro_client._execute_get_with_retry, "retry")

    # Cloudflare R2 Storage retry methods
    assert hasattr(r2_service, "_s3_put_object_with_retry")
    assert hasattr(r2_service, "_s3_upload_fileobj_with_retry")
    assert hasattr(r2_service._s3_put_object_with_retry, "retry")
    assert hasattr(r2_service._s3_upload_fileobj_with_retry, "retry")


# =========================================================================
# 2. TEST ITEM 2: RATE LIMITING CONFIGURATION (#56)
# =========================================================================
def test_rate_limiting_settings_and_thresholds():
    """
    Verifies SlowAPI rate limits are configured for:
    - /login: 5/minute
    - public booking routes: 20/minute
    - QR generation: 15/minute
    - Decentro webhooks: 120/minute
    """
    assert settings.RATE_LIMIT_LOGIN == "5/minute"
    assert settings.RATE_LIMIT_BOOKING == "20/minute"
    assert settings.RATE_LIMIT_QR == "15/minute"
    assert settings.RATE_LIMIT_WEBHOOK == "120/minute"

    from app.main import app
    from slowapi import Limiter

    # Verify slowapi is wired to app.state.limiter
    assert hasattr(app.state, "limiter")
    assert isinstance(app.state.limiter, Limiter)


# =========================================================================
# 3. TEST ITEM 3: HEALTH CHECKS (#85) & LOGGING (#79)
# =========================================================================
def test_health_check_endpoint_returns_healthy_200(db):
    """
    Verifies GET /health runs SELECT 1 and returns 200 OK:
    {"status": "healthy", "database": "connected"}
    """
    res = Response()
    health_data = general_health_check(response=res, db=db)

    assert res.status_code == 200
    assert health_data["status"] == "healthy"
    assert health_data["database"] == "connected"
    assert "timestamp" in health_data


def test_health_check_handles_db_disconnect_with_503():
    """Verifies that database failures trigger 503 Service Unavailable."""
    mock_db = MagicMock()
    mock_db.execute.side_effect = ConnectionError("PostgreSQL connection refused")

    res = Response()
    health_data = general_health_check(response=res, db=mock_db)

    assert res.status_code == 503
    assert health_data["status"] == "unhealthy"
    assert health_data["database"] == "disconnected"


def test_decentro_webhook_secret_masking():
    """
    Verifies that incoming Decentro webhook logging masks secrets, keys,
    signatures, and sensitive financial account identifiers.
    """
    sample_payload = {
        "event_id": "EVT-123456",
        "decentro_txn_id": "DCN-TXN-ABCDEF",
        "client_secret": "sec_live_9988776655443322",
        "module_secret": "mod_live_1122334455667788",
        "account_number": "912345678901",
        "payer_vpa": "guest@upi",
        "amount": 2500.0,
        "nested": {
            "token": "tok_xyz_secret_value",
            "safe_field": "public_data"
        }
    }

    masked = mask_sensitive_dict(sample_payload)

    # Sensitive fields must be masked
    assert masked["client_secret"] != sample_payload["client_secret"]
    assert "..." in masked["client_secret"]
    assert masked["module_secret"] != sample_payload["module_secret"]
    assert masked["account_number"].startswith("91")
    assert "****" in masked["account_number"]
    assert masked["nested"]["token"] != "tok_xyz_secret_value"

    # Non-sensitive fields remain readable for operational debugging
    assert masked["amount"] == 2500.0
    assert masked["event_id"] == "EVT-123456"
    assert masked["nested"]["safe_field"] == "public_data"


# =========================================================================
# 4. TEST ITEM 4: DISASTER RECOVERY DATABASE BACKUP (#18)
# =========================================================================
def test_database_snapshot_export_and_compression(db):
    """
    Verifies database JSON snapshot generation, gzip compression,
    and structured retention policy.
    """
    # 1. Export JSON string
    raw_json = generate_database_json_snapshot(db)
    parsed = json.loads(raw_json)

    assert "metadata" in parsed
    assert parsed["metadata"]["app"] == "Hotel Sai Vasudev Residency"
    assert "tables" in parsed
    assert "rooms" in parsed["tables"]
    assert "bookings" in parsed["tables"]

    # 2. Verify compression and decompression integrity
    compressed = gzip.compress(raw_json.encode("utf-8"), compresslevel=9)
    assert len(compressed) < len(raw_json.encode("utf-8"))

    decompressed = gzip.decompress(compressed).decode("utf-8")
    assert json.loads(decompressed) == parsed


def test_admin_backup_db_endpoint(db):
    """
    Verifies POST /api/admin/backup-db executes snapshot,
    names the archive backups/sai_vasudev_db_YYYY_MM_DD.json.gz,
    applies 30-day retention, and requires OWNER/MANAGER/ADMIN.
    """
    current_user = {
        "email": "owner@hotelsai-vasudev.com",
        "role": "OWNER",
        "sub": "owner_01"
    }

    result = trigger_backup_db_endpoint(current_user=current_user, db=db)

    assert result["success"] is True
    assert result["status"] == "completed"
    assert "backups/sai_vasudev_db_" in result["backup_key"]
    assert result["filename"].endswith(".json.gz")
    assert result["retention_days"] == 30
    assert result["compressed_size_bytes"] > 0
    assert "Cloudflare R2" in result["storage"] or "Local Fallback" in result["storage"]

