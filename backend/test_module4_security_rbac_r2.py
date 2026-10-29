"""
Test Suite: Module 4 - Hospitality Security, RBAC & Private Cloudflare R2 Storage
Covers Architecture Spec Module 4:
  1. JWT Access Tokens (15-min expiry) + Rotating Refresh Tokens (7-day expiry in PostgreSQL) (#47)
  2. Instant Token Revocation on Shift Handover & Logout (#44)
  3. Hospitality Role Guards (require_role) for OWNER, MANAGER, RECEPTIONIST, STEWARD, HOUSEKEEPING (#48)
  4. Immutable Audit Logs on Tariffs, Discounts, Voided KOTs, Payouts (#48 - Part B)
  5. Application-Layer Field Encryption (cryptography.fernet) for Guest PII (#50)
  6. Cloudflare R2 strict validation (JPEG/PNG/PDF, max 5MB) & 60s pre-signed URLs (#45, #50)
  7. SlowAPI Rate Limiting, Strict CORS & Security Response Headers (#2, #18, #19, #42, #44)
"""

import sys
import os
import json
import uuid
import datetime
import pytest
from datetime import timedelta
from fastapi import Depends, APIRouter
from fastapi.testclient import TestClient

# Ensure root & backend are in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.main import app
from app.database import SessionLocal
from app import models
from app.config import settings
from app.utils.auth import (
    create_access_token,
    decode_access_token,
    create_refresh_token,
    rotate_refresh_token,
    revoke_user_refresh_tokens,
    require_role,
    HospitalityRole
)
from app.utils.encryption import encrypt_pii, decrypt_pii, mask_pii
from app.services.r2_storage import r2_service, validate_uploaded_document, MAX_DOCUMENT_SIZE_BYTES
from app.utils.sanitization import sanitize_text

client = TestClient(app)

# Helper test route to test require_role dependency in isolation
test_rbac_router = APIRouter(prefix="/test-rbac")

@test_rbac_router.get("/owner-only", dependencies=[Depends(require_role(["OWNER"]))])
def rbac_owner_endpoint():
    return {"status": "ok", "role_checked": "OWNER"}

@test_rbac_router.get("/manager-area", dependencies=[Depends(require_role(["MANAGER"]))])
def rbac_manager_endpoint():
    return {"status": "ok", "role_checked": "MANAGER"}

@test_rbac_router.get("/steward-kds", dependencies=[Depends(require_role(["STEWARD"]))])
def rbac_steward_endpoint():
    return {"status": "ok", "role_checked": "STEWARD"}

@test_rbac_router.get("/housekeeping-zone", dependencies=[Depends(require_role(["HOUSEKEEPING"]))])
def rbac_housekeeping_endpoint():
    return {"status": "ok", "role_checked": "HOUSEKEEPING"}

app.include_router(test_rbac_router)

@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()

# =========================================================================
# 1. TEST: JWT ACCESS TOKEN (15-MIN EXPIRY) (#47)
# =========================================================================
def test_jwt_access_token_generation_and_expiry():
    user_payload = {"sub": "staff_test_1", "role": "RECEPTIONIST"}
    token = create_access_token(user_payload)
    decoded = decode_access_token(token)

    assert decoded["sub"] == "staff_test_1"
    assert decoded["role"] == "RECEPTIONIST"
    assert "exp" in decoded
    assert "iat" in decoded

    # Verify 15-minute expiration delta (~900 seconds)
    duration_seconds = decoded["exp"] - decoded["iat"]
    assert 890 <= duration_seconds <= 910, f"Token expiry was {duration_seconds}s, expected ~900s (15 min)"

    # Verify expired token rejection
    expired_token = create_access_token(user_payload, expires_delta=timedelta(minutes=-5))
    with pytest.raises(Exception) as excinfo:
        decode_access_token(expired_token)
    assert "expired" in str(excinfo.value).lower()

# =========================================================================
# 2. TEST: REFRESH TOKEN ROTATION (7-DAY EXPIRY IN POSTGRESQL) (#47)
# =========================================================================
def test_refresh_token_rotation_and_persistence(db):
    user_email = f"staff_{uuid.uuid4().hex[:6]}@sai-vasudev.com"
    role = "MANAGER"

    # 1. Create 7-day refresh token
    refresh_token = create_refresh_token(db, user_id=user_email, role=role)
    assert refresh_token.startswith("rt_")

    rec = db.query(models.RefreshToken).filter(models.RefreshToken.token == refresh_token).first()
    assert rec is not None
    assert rec.is_revoked is False
    assert rec.role == "MANAGER"

    # Verify ~7 days expiry
    delta_days = (rec.expires_at - rec.created_at).days
    assert 6 <= delta_days <= 7

    # 2. Rotate token via /api/v1/auth/refresh
    res_refresh = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert res_refresh.status_code == 200
    data = res_refresh.json()

    new_access = data["access_token"]
    new_refresh = data["refresh_token"]
    assert new_refresh != refresh_token
    assert data["role"] == "MANAGER"

    # 3. Old refresh token must be revoked
    db.refresh(rec)
    assert rec.is_revoked is True
    assert rec.revocation_reason == "ROTATED"

    # 4. Attempting to reuse the revoked token must be rejected with 401
    res_reuse = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert res_reuse.status_code == 401
    assert "revoked" in res_reuse.json().get("detail", "").lower()

# =========================================================================
# 3. TEST: INSTANT REVOCATION ON SHIFT HANDOVER & LOGOUT (#44, #47)
# =========================================================================
def test_instant_token_revocation_on_shift_handover_and_logout(db):
    user_email = f"duty_mgr_{uuid.uuid4().hex[:6]}@sai-vasudev.com"
    user_name = "Front Desk Duty Manager"

    # 1. Issue refresh token
    rt = create_refresh_token(db, user_id=user_email, role="RECEPTIONIST")

    # 2. Submit shift handover
    shift_id = f"SHIFT/{uuid.uuid4().hex[:8].upper()}"
    handover_payload = {
        "shift_id": shift_id,
        "shift_date": "2026-10-29",
        "shift_time": "07:00 AM - 03:00 PM",
        "user_email": user_email,
        "user_name": user_name,
        "shift_type": "Morning",
        "opening_drawer_cash": 5000.0,
        "net_physical_cash_in_drawer": 7500.0,
        "handover_to_user": "Evening Manager",
        "status": "Verified & Closed"
    }

    res_sh = client.post("/api/v1/pms/shift-handovers", json=handover_payload)
    assert res_sh.status_code == 200
    assert res_sh.json()["revoked_tokens"] >= 1

    # 3. Verify token is revoked in database
    db_token = db.query(models.RefreshToken).filter(models.RefreshToken.token == rt).first()
    assert db_token.is_revoked is True
    assert db_token.revocation_reason == "SHIFT_HANDOVER"

    # 4. Attempting to use the revoked token returns 401
    res_try = client.post("/api/v1/auth/refresh", json={"refresh_token": rt})
    assert res_try.status_code == 401

    # 5. Verify /auth/logout endpoint
    new_rt = create_refresh_token(db, user_id=user_email, role="RECEPTIONIST")
    access_token = create_access_token({"sub": user_email, "role": "RECEPTIONIST"})
    res_logout = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert res_logout.status_code == 200
    db_token_2 = db.query(models.RefreshToken).filter(models.RefreshToken.token == new_rt).first()
    assert db_token_2.is_revoked is True
    assert db_token_2.revocation_reason == "LOGOUT"

# =========================================================================
# 4. TEST: HOSPITALITY ROLE GUARDS (require_role) (#48)
# =========================================================================
def test_hospitality_role_guards():
    # 1. OWNER has root privilege
    owner_token = create_access_token({"sub": "owner_1", "role": "OWNER"})
    res_owner = client.get("/test-rbac/owner-only", headers={"Authorization": f"Bearer {owner_token}"})
    assert res_owner.status_code == 200

    # OWNER accessing other areas succeeds
    res_owner_as_mgr = client.get("/test-rbac/manager-area", headers={"Authorization": f"Bearer {owner_token}"})
    assert res_owner_as_mgr.status_code == 200

    # 2. MANAGER has supervisor privileges
    mgr_token = create_access_token({"sub": "mgr_1", "role": "MANAGER"})
    res_mgr = client.get("/test-rbac/manager-area", headers={"Authorization": f"Bearer {mgr_token}"})
    assert res_mgr.status_code == 200

    # MANAGER cannot access OWNER-only
    res_mgr_blocked = client.get("/test-rbac/owner-only", headers={"Authorization": f"Bearer {mgr_token}"})
    assert res_mgr_blocked.status_code == 403
    assert "Forbidden" in res_mgr_blocked.json()["detail"]

    # 3. RECEPTIONIST is blocked from Manager/Owner areas
    rec_token = create_access_token({"sub": "receptionist_1", "role": "RECEPTIONIST"})
    res_rec_blocked = client.get("/test-rbac/manager-area", headers={"Authorization": f"Bearer {rec_token}"})
    assert res_rec_blocked.status_code == 403

    # 4. STEWARD accesses steward-kds but blocked from housekeeping
    steward_token = create_access_token({"sub": "steward_1", "role": "STEWARD"})
    res_steward = client.get("/test-rbac/steward-kds", headers={"Authorization": f"Bearer {steward_token}"})
    assert res_steward.status_code == 200

    res_steward_hk = client.get("/test-rbac/housekeeping-zone", headers={"Authorization": f"Bearer {steward_token}"})
    assert res_steward_hk.status_code == 403

    # 5. Missing token returns 401
    res_unauth = client.get("/test-rbac/manager-area")
    assert res_unauth.status_code == 401

# =========================================================================
# 5. TEST: IMMUTABLE AUDIT LOGS ON PRIVILEGED ACTIONS (#48 - Part B)
# =========================================================================
def test_immutable_audit_logs_on_privileged_actions(db):
    # 1. Tariff Change Audit Log
    room_name = f"ROOM-AUDIT-{uuid.uuid4().hex[:4].upper()}"
    res_room = client.post("/api/v1/pms/rooms", json={
        "room_no": room_name,
        "tariff": 2200.0,
        "room_type": "Executive Suite"
    })
    assert res_room.status_code == 200
    room_id = res_room.json()["roomId"]

    # Update tariff
    res_update = client.put(f"/api/v1/pms/rooms/{room_id}", json={"tariff": 2800.0})
    assert res_update.status_code == 200

    tariff_audit = db.query(models.AuditLog).filter(
        models.AuditLog.action == "TARIFF_OVERRIDE",
        models.AuditLog.entity_id == str(room_id)
    ).order_by(models.AuditLog.id.desc()).first()
    assert tariff_audit is not None
    assert "2800" in (tariff_audit.new_data or "")

    # 2. Folio Discount Audit Log
    booking_ref = f"SVR-DISC-{uuid.uuid4().hex[:4].upper()}"
    res_disc = client.post("/api/v1/pms/folio/discount", json={
        "booking_ref": booking_ref,
        "room_no": "102",
        "discount_type": "flat",
        "discount_amount": 350.0,
        "discount_reason": "Pilgrim Group Courtesies",
        "approved_by": "Duty Manager"
    })
    assert res_disc.status_code == 200

    disc_audit = db.query(models.AuditLog).filter(
        models.AuditLog.action.in_(["FOLIO_DISCOUNT", "DISCOUNT_APPLIED"]),
        models.AuditLog.entity_id == booking_ref
    ).first()
    assert disc_audit is not None
    assert "350" in (disc_audit.new_data or "")

    # 3. KOT Void Audit Log
    kot_num = f"KOT-AUDIT-{uuid.uuid4().hex[:4].upper()}"
    res_void = client.post("/api/v1/pms/kot/void", json={
        "kot_number": kot_num,
        "item_name": "Paneer Butter Masala",
        "qty_voided": 1,
        "rate": 220.0,
        "void_reason": "Guest allergic to dairy",
        "manager_pin": "9999",
        "steward_id": "Steward Ramesh"
    })
    assert res_void.status_code == 200

    void_audit = db.query(models.AuditLog).filter(
        models.AuditLog.action == "KOT_VOIDED",
        models.AuditLog.entity_id == kot_num
    ).first()
    assert void_audit is not None
    assert "dairy" in (void_audit.new_data or "").lower()

    # 4. Payout Audit Log
    payout_no = f"PAY-AUDIT-{uuid.uuid4().hex[:4].upper()}"
    res_payout = client.post("/api/v1/pms/agent-payout-vouchers", json={
        "voucher_no": payout_no,
        "agent_id": "AGT-202",
        "agent_name": "Tirupati Pilgrim Tour Agent",
        "amount": 1500.0,
        "payment_mode": "UPI",
        "created_by": "Accounts"
    })
    assert res_payout.status_code == 200

    payout_audit = db.query(models.AuditLog).filter(
        models.AuditLog.action == "PAYOUT_ISSUED",
        models.AuditLog.entity_id == payout_no
    ).first()
    assert payout_audit is not None
    assert "1500" in (payout_audit.new_data or "")

# =========================================================================
# 6. TEST: FERNET APPLICATION-LAYER FIELD ENCRYPTION FOR PII (#50)
# =========================================================================
def test_fernet_pii_encryption_and_masking():
    aadhaar_number = "756476765721"
    passport_number = "Z1234567"

    # Encrypt
    encrypted_aadhaar = encrypt_pii(aadhaar_number)
    encrypted_passport = encrypt_pii(passport_number)

    assert encrypted_aadhaar.startswith("gAAAAA")
    assert encrypted_passport.startswith("gAAAAA")
    assert encrypted_aadhaar != aadhaar_number
    assert encrypted_passport != passport_number

    # Decrypt
    decrypted_aadhaar = decrypt_pii(encrypted_aadhaar)
    decrypted_passport = decrypt_pii(encrypted_passport)
    assert decrypted_aadhaar == aadhaar_number
    assert decrypted_passport == passport_number

    # Double-encryption prevention
    double_encrypted = encrypt_pii(encrypted_aadhaar)
    assert double_encrypted == encrypted_aadhaar

    # Legacy plaintext handling
    assert decrypt_pii(aadhaar_number) == aadhaar_number

    # Masking for UI display
    masked_aadhaar = mask_pii(encrypted_aadhaar, visible_last=4)
    assert masked_aadhaar == "XXXXXXXX5721"

    masked_passport = mask_pii(encrypted_passport, visible_last=3)
    assert masked_passport == "XXXXX567"

# =========================================================================
# 7. TEST: CLOUDFLARE R2 FILE VALIDATION & 60-SEC PRE-SIGNED URLS (#45, #50)
# =========================================================================
def test_cloudflare_r2_strict_file_validation_and_presigned_urls():
    # 1. Valid JPEG file validation
    valid_jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 50
    mime = validate_uploaded_document(valid_jpeg_bytes, "guest_id.jpg", "image/jpeg")
    assert mime == "image/jpeg"

    # 2. Valid PDF file validation
    valid_pdf_bytes = b"%PDF-1.4 sample pdf content stream"
    mime_pdf = validate_uploaded_document(valid_pdf_bytes, "tax_invoice.pdf", "application/pdf")
    assert mime_pdf == "application/pdf"

    # 3. Invalid MIME / executable extension rejected (#45)
    with pytest.raises(ValueError) as excinfo:
        validate_uploaded_document(b"malicious payload", "shell.php", "application/x-php")
    assert "not permitted" in str(excinfo.value)

    # 4. File exceeding 5MB rejected (#45)
    oversized_bytes = b"\xff\xd8\xff" + b"\x00" * (MAX_DOCUMENT_SIZE_BYTES + 1024)
    with pytest.raises(ValueError) as exc_size:
        validate_uploaded_document(oversized_bytes, "big_photo.jpg", "image/jpeg")
    assert "exceeds the maximum allowed limit of 5MB" in str(exc_size.value)

    # 5. Magic byte mismatch rejected
    fake_jpeg_bytes = b"NOT_A_JPEG_FILE"
    with pytest.raises(ValueError) as exc_magic:
        validate_uploaded_document(fake_jpeg_bytes, "fake.jpg", "image/jpeg")
    assert "magic header" in str(exc_magic.value)

    # 6. Secure 60-Second S3 Pre-Signed URL generation (#50)
    secure_url_res = r2_service.generate_secure_view_url("guest_ids/2026/10/sample_aadhaar.jpg", expires_in=60)
    assert "download_url" in secure_url_res
    assert secure_url_res["expires_in"] == 60

    # 7. Endpoint test: POST /api/v1/uploads/secure-view
    res_api = client.post("/api/v1/uploads/secure-view", json={
        "object_key": "invoices/2026/10/INV-2026-001.pdf",
        "expires_in": 60
    })
    assert res_api.status_code == 200
    assert res_api.json()["expires_in"] == 60

# =========================================================================
# 8. TEST: RATE LIMITING, CORS & SECURITY HEADERS (#2, #18, #19, #42, #44)
# =========================================================================
def test_rate_limiting_cors_and_security_headers():
    # 1. Security Response Headers
    res = client.get("/")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("X-XSS-Protection") == "1; mode=block"
    assert "Strict-Transport-Security" in res.headers
    assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

    # 2. Input Sanitization
    dirty_text = "<script>alert('xss')</script><b>Hello</b> Rayagada Hotel"
    cleaned = sanitize_text(dirty_text, strip_all_html=True)
    assert "<script>" not in cleaned
    assert "Hello" in cleaned
    assert "Rayagada" in cleaned

    # 3. SlowAPI Rate Limiting on Login (5/minute #18)
    # Fire 5 requests with isolated IP (should succeed/fail auth, but not rate limited)
    rate_test_headers = {"X-Forwarded-For": "198.51.100.99"}
    for _ in range(5):
        r = client.post("/api/v1/auth/login", json={"username": "test_user_rate", "password": "any"}, headers=rate_test_headers)
        assert r.status_code in (200, 401)

    # 6th request within same minute from same IP should hit 429 Too Many Requests
    r6 = client.post("/api/v1/auth/login", json={"username": "test_user_rate", "password": "any"}, headers=rate_test_headers)
    assert r6.status_code == 429
    assert "Rate limit exceeded" in r6.text or "too many requests" in r6.text.lower()
