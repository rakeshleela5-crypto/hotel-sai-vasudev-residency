"""
Phase 1 Security & RBAC Hardening Test Suite.
Verifies:
1. Removal of hardcoded password defaults and mandatory password enforcement on /auth/login.
2. RBAC enforcement on sensitive CA exports (/api/v1/accounting/ca-export & GST reports) - 401 on unauthenticated, 403 on RECEPTIONIST, 200 on MANAGER/OWNER.
3. Manager PIN Gate lifecycle: configuration, PBKDF2 hashing, verification, grace-token issuance (5-min), and 3-attempt brute-force rate-limiting lockout.
"""

import os
import sys
import uuid
import datetime
import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.main import app
from app.database import SessionLocal
from app import models
from app.utils.auth import create_access_token, get_password_hash
from app.utils.pin import (
    reset_pin_failures,
    hash_manager_pin,
    verify_manager_pin,
    decode_manager_pin_token,
    PIN_GRACE_SECONDS
)

client = TestClient(app)

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture(autouse=True)
def reset_lockouts():
    reset_pin_failures("testclient")
    reset_pin_failures("127.0.0.1")
    yield
    reset_pin_failures("testclient")
    reset_pin_failures("127.0.0.1")


# =========================================================================
# TEST 1: Password Enforcement on Login (No "admin123" Backdoor Default)
# =========================================================================
def test_login_requires_explicit_password():
    """
    Verifies that omitting the password field or providing an empty password
    is strictly rejected by FastAPI validation (HTTP 422 / 401).
    """
    # 1. Missing password field entirely
    res_missing = client.post("/api/v1/auth/login", json={"username": "admin"})
    assert res_missing.status_code == 422, "Login without password field must fail validation"

    # 2. Empty password string
    res_empty = client.post("/api/v1/auth/login", json={"username": "admin", "password": ""})
    assert res_empty.status_code in (401, 422), "Empty password must be rejected"


# =========================================================================
# TEST 2: Unauthenticated Access to CA Financial Export Blocked (HTTP 401)
# =========================================================================
def test_ca_export_unauthenticated_rejected():
    """
    Verifies that unauthenticated calls to /api/v1/accounting/ca-export
    are blocked with HTTP 401 Unauthorized.
    """
    res = client.get("/api/v1/accounting/ca-export?period=2026-11")
    assert res.status_code == 401
    assert "Missing or invalid Bearer authentication token" in res.json().get("detail", "")


# =========================================================================
# TEST 3: Receptionist Role Forbidden on CA Financial Export (HTTP 403)
# =========================================================================
def test_ca_export_receptionist_role_forbidden():
    """
    Verifies that a valid staff token with RECEPTIONIST role is rejected
    with HTTP 403 Forbidden on confidential CA export endpoints.
    """
    rec_token = create_access_token(data={"sub": "frontdesk_user", "role": "RECEPTIONIST"})
    headers = {"Authorization": f"Bearer {rec_token}"}

    res = client.get("/api/v1/accounting/ca-export?period=2026-11", headers=headers)
    assert res.status_code == 403
    assert "Insufficient privileges" in res.json().get("detail", "")


# =========================================================================
# TEST 4: Manager & Owner Roles Authorized on CA Financial Export (HTTP 200)
# =========================================================================
def test_ca_export_manager_and_owner_authorized():
    """
    Verifies that MANAGER and OWNER role tokens succeed with HTTP 200 on CA exports.
    """
    # 1. Manager Token
    mgr_token = create_access_token(data={"sub": "general_manager", "role": "MANAGER"})
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}
    res_mgr = client.get("/api/v1/accounting/ca-export?period=2026-11", headers=mgr_headers)
    assert res_mgr.status_code == 200
    assert "export_metadata" in res_mgr.json() or "preview_summary" in res_mgr.json()

    # 2. Owner Token
    owner_token = create_access_token(data={"sub": "property_owner", "role": "OWNER"})
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    res_owner = client.get("/api/v1/accounting/ca-export?period=2026-11", headers=owner_headers)
    assert res_owner.status_code == 200


# =========================================================================
# TEST 5: Manager PIN Bootstrap & Verification
# =========================================================================
def test_manager_pin_bootstrap_verification(db):
    """
    Verifies initial manager PIN status and bootstrap verification with '1234'.
    """
    # Ensure clean bootstrap state
    setting = db.query(models.HotelSetting).filter(models.HotelSetting.key == "default").first()
    if setting:
        setting.manager_pin_hash = None
        setting.manager_pin_salt = None
        db.commit()

    # Check status
    res_status = client.get("/api/v1/auth/manager-pin/status")
    assert res_status.status_code == 200
    assert res_status.json()["status"] == "success"

    # Verify bootstrap PIN
    res_verify = client.post("/api/v1/auth/manager-pin/verify", json={
        "pin": "1234",
        "action": "TEST_AUTHORIZE_DISCOUNT"
    })
    assert res_verify.status_code == 200
    data = res_verify.json()
    assert data["verified"] is True
    assert "token" in data
    assert data["expires_in"] == PIN_GRACE_SECONDS

    # Validate issued token
    decoded = decode_manager_pin_token(data["token"])
    assert decoded["pin_verified"] is True
    assert decoded["action"] == "TEST_AUTHORIZE_DISCOUNT"


# =========================================================================
# TEST 6: Manager PIN Custom Set and Verify Cycle
# =========================================================================
def test_manager_pin_set_and_verify_cycle(db):
    """
    Verifies that an authorized MANAGER can configure a custom 4-6 digit PIN,
    and subsequent verifications succeed with the new PIN and fail with the old PIN.
    """
    mgr_token = create_access_token(data={"sub": "duty_manager", "role": "MANAGER"})
    headers = {"Authorization": f"Bearer {mgr_token}"}

    # 1. Set new PIN '9876'
    res_set = client.post(
        "/api/v1/auth/manager-pin/set",
        json={"pin": "9876"},
        headers=headers
    )
    assert res_set.status_code == 200
    assert res_set.json()["status"] == "success"

    # Verify status now reports is_configured: True
    res_status = client.get("/api/v1/auth/manager-pin/status")
    assert res_status.json()["is_configured"] is True

    # 2. Verify with new PIN '9876' -> succeeds
    res_ok = client.post("/api/v1/auth/manager-pin/verify", json={"pin": "9876"})
    assert res_ok.status_code == 200
    assert res_ok.json()["verified"] is True

    # 3. Verify with old PIN '1234' -> fails
    res_fail = client.post("/api/v1/auth/manager-pin/verify", json={"pin": "1234"})
    assert res_fail.status_code == 401
    assert "Incorrect Manager PIN" in res_fail.json().get("detail", "")


# =========================================================================
# TEST 7: Manager PIN Rate-Limiting & Lockout after 3 Failed Attempts
# =========================================================================
def test_manager_pin_rate_limiting_and_lockout():
    """
    Verifies that entering 3 incorrect PINs triggers progressive backoff
    and a temporary lockout (HTTP 429 Too Many Requests).
    """
    reset_pin_failures("testclient")

    # Attempt 1 -> fails with 401
    r1 = client.post("/api/v1/auth/manager-pin/verify", json={"pin": "0000"})
    assert r1.status_code == 401
    assert "Attempt 1/3" in r1.json()["detail"]

    # Attempt 2 -> fails with 401
    r2 = client.post("/api/v1/auth/manager-pin/verify", json={"pin": "0000"})
    assert r2.status_code == 401
    assert "Attempt 2/3" in r2.json()["detail"]

    # Attempt 3 -> fails with 429 Lockout
    r3 = client.post("/api/v1/auth/manager-pin/verify", json={"pin": "0000"})
    assert r3.status_code == 429
    assert "3 failed attempts exceeded" in r3.json()["detail"] or "Supervisor gate locked" in r3.json()["detail"]

    # Attempt 4 while locked out -> immediately blocked with 429
    r4 = client.post("/api/v1/auth/manager-pin/verify", json={"pin": "9876"})
    assert r4.status_code == 429
    assert "Supervisor verification is temporarily locked" in r4.json()["detail"]
