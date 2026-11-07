"""
Authentication & Authorization API Routes (#47, #48).
Endpoints:
  - POST /api/v1/auth/login (Rate limited 5/min, issues 15-m JWT + 7-d rotating refresh token)
  - POST /api/v1/auth/refresh (Rotates refresh token & issues new access token)
  - POST /api/v1/auth/logout (Instantly revokes tokens)
  - GET /api/v1/auth/me (Returns authenticated user profile)
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app import models
from app.utils.auth import (
    create_access_token,
    create_refresh_token,
    rotate_refresh_token,
    revoke_user_refresh_tokens,
    get_current_user,
    require_role,
    normalize_role,
    verify_password,
    get_password_hash,
    HospitalityRole
)
from app.utils.rate_limit import limiter
from app.utils.audit import record_audit_log
from app.utils.sanitization import sanitize_text
from app.utils.pin import (
    hash_manager_pin,
    verify_manager_pin,
    is_valid_pin_format,
    check_pin_lockout,
    record_pin_failure,
    reset_pin_failures,
    create_manager_pin_token,
    PIN_GRACE_SECONDS
)

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])

class LoginRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = None

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None

class SetManagerPinRequest(BaseModel):
    pin: str

class VerifyManagerPinRequest(BaseModel):
    pin: str
    action: Optional[str] = "SUPERVISOR_ACTION"

@router.post("/login", summary="Staff Login & JWT Token Issuance (#47, #18)")
@limiter.limit(settings.RATE_LIMIT_LOGIN)
def login(
    request: Request,
    payload: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticates staff user, returns 15-minute JWT Access Token and 7-day Rotating Refresh Token (#47).
    Rate limited to 5 requests per minute (#18).
    """
    clean_user = sanitize_text(payload.username) or ""
    clean_pass = payload.password or ""

    # 1. Lookup staff user in user_accounts or staff_users
    user_rec = db.query(models.UserAccount).filter(
        (models.UserAccount.email_id == clean_user) |
        (models.UserAccount.user_name == clean_user)
    ).first()

    if not user_rec:
        staff_rec = db.query(models.StaffUser).filter(
            (models.StaffUser.username == clean_user) |
            (models.StaffUser.email == clean_user)
        ).first()
    else:
        staff_rec = None

    # Determine role strictly from database record
    stored_hash = None
    if user_rec:
        role = normalize_role(user_rec.role_name)
        stored_hash = user_rec.password_hash
    elif staff_rec:
        role = normalize_role(staff_rec.role_name)
        stored_hash = staff_rec.password_hash
    elif getattr(settings, "ENVIRONMENT", "").lower() in ("development", "test", "local"):
        # Development fallback only for standard personas with default credentials
        if clean_user.lower() in ("owner", "admin", "superadmin", "super-admin"):
            role = HospitalityRole.OWNER.value
        elif clean_user.lower() in ("manager", "dutymanager"):
            role = HospitalityRole.MANAGER.value
        elif clean_user.lower() in ("steward", "waiter"):
            role = HospitalityRole.STEWARD.value
        elif clean_user.lower() in ("housekeeping", "cleaner"):
            role = HospitalityRole.HOUSEKEEPING.value
        else:
            role = HospitalityRole.RECEPTIONIST.value
        if clean_pass != "admin123":
            raise HTTPException(status_code=401, detail="Invalid username or password.")
    else:
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    # Validate password against stored hash
    if user_rec or staff_rec:
        if not stored_hash or not verify_password(clean_pass, stored_hash):
            raise HTTPException(status_code=401, detail="Invalid username or password.")

    # 2. Issue 15-minute Access Token (#47)
    access_token = create_access_token({
        "sub": clean_user,
        "user_id": clean_user,
        "username": clean_user,
        "role": role
    })

    # 3. Issue 7-day Rotating Refresh Token persisted in PostgreSQL (#47)
    refresh_token = create_refresh_token(db, user_id=clean_user, role=role)

    # 4. Record audit entry
    record_audit_log(
        db=db,
        action="LOGIN",
        entity_type="AUTH",
        entity_id=clean_user,
        new_data={"role": role, "login_method": "JWT_PASSWORD"},
        staff_id=clean_user,
        role=role,
        ip_address=request.client.host if request.client else "127.0.0.1"
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": (settings.ACCESS_TOKEN_EXPIRE_MINUTES or 15) * 60,
        "role": role,
        "user": {
            "username": clean_user,
            "role": role,
            "email": clean_user if "@" in clean_user else f"{clean_user}@sai-vasudev.com"
        }
    }

@router.post("/refresh", summary="Rotate Refresh Token & Issue Fresh Access Token (#47)")
def refresh_session(
    payload: RefreshRequest,
    db: Session = Depends(get_db)
):
    """
    Exchanges an active 7-day refresh token for a fresh 15-minute access token and new refresh token (#47).
    Instantly revokes the used refresh token.
    """
    return rotate_refresh_token(db, payload.refresh_token)

@router.post("/logout", summary="Staff Logout & Instant Token Revocation (#44, #47)")
def logout(
    request: Request,
    payload: Optional[LogoutRequest] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Instantly revokes all active refresh tokens for the authenticated staff member (#44, #47).
    """
    user_id = current_user.get("user_id") or "staff"
    revoked_count = revoke_user_refresh_tokens(db, user_id=user_id, reason="LOGOUT")

    record_audit_log(
        db=db,
        action="LOGOUT",
        entity_type="AUTH",
        entity_id=user_id,
        new_data={"revoked_tokens": revoked_count},
        staff_id=user_id,
        role=current_user.get("role"),
        ip_address=request.client.host if request.client else "127.0.0.1"
    )

    return {
        "success": True,
        "message": f"Successfully logged out. Revoked {revoked_count} active sessions.",
        "revoked_count": revoked_count
    }

@router.get("/me", summary="Get Current Authenticated Staff User Profile (#48)")
def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "authenticated": True,
        **current_user
    }

# =========================================================================
# 5. MANAGER PIN GATE (Benchmarked from HeyPuter everything/src/pos/src/lib/pin.js)
# =========================================================================

@router.get("/manager-pin/status", summary="Check Manager PIN Status")
def get_manager_pin_status(db: Session = Depends(get_db)):
    """Returns whether a Manager/Supervisor PIN has been set for the property."""
    setting = db.query(models.HotelSetting).filter(models.HotelSetting.key == "default").first()
    is_configured = bool(setting and setting.manager_pin_hash and setting.manager_pin_salt)
    return {
        "status": "success",
        "is_configured": is_configured,
        "grace_period_seconds": PIN_GRACE_SECONDS
    }

@router.post("/manager-pin/set", summary="Set or Update Manager PIN")
def set_manager_pin(
    payload: SetManagerPinRequest,
    current_user: Dict[str, Any] = Depends(require_role(["OWNER", "MANAGER"])),
    db: Session = Depends(get_db)
):
    """
    Sets or updates the 4-6 digit Manager PIN used for counter-height authorizations
    (voids, high discounts, cash drawer resets, financial exports).
    Requires OWNER or MANAGER JWT credentials.
    """
    clean_pin = payload.pin.strip()
    if not is_valid_pin_format(clean_pin):
        raise HTTPException(
            status_code=400,
            detail="Manager PIN must be between 4 and 6 numeric digits."
        )

    salt, pin_hash, iterations = hash_manager_pin(clean_pin)

    setting = db.query(models.HotelSetting).filter(models.HotelSetting.key == "default").first()
    if not setting:
        setting = models.HotelSetting(key="default")
        db.add(setting)

    setting.manager_pin_hash = pin_hash
    setting.manager_pin_salt = salt
    db.commit()

    record_audit_log(
        db=db,
        action="UPDATE_SETTING",
        entity_type="SECURITY",
        entity_id="MANAGER_PIN",
        new_data={"action": "MANAGER_PIN_CONFIGURED", "updated_by": current_user.get("user_id")},
        staff_id=current_user.get("user_id"),
        role=current_user.get("role")
    )

    return {
        "status": "success",
        "message": "Manager PIN has been securely set with 600,000 PBKDF2 iterations."
    }

@router.post("/manager-pin/verify", summary="Verify Manager PIN & Issue Grace Token")
def verify_manager_pin_endpoint(
    request: Request,
    payload: VerifyManagerPinRequest,
    db: Session = Depends(get_db)
):
    """
    Verifies a 4-6 digit Manager PIN with progressive rate-limiting and temporary lockout.
    On success:
      - Resets failed attempt counter
      - Returns a signed 5-minute Manager PIN authorization token (X-Manager-PIN-Token)
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    # 1. Check for active lockout
    lockout_sec = check_pin_lockout(client_ip)
    if lockout_sec:
        raise HTTPException(
            status_code=429,
            detail=f"Too many failed PIN attempts. Supervisor verification is temporarily locked. Try again in {lockout_sec} seconds."
        )

    clean_pin = payload.pin.strip() if payload.pin else ""
    if not is_valid_pin_format(clean_pin):
        failures, lock_dur = record_pin_failure(client_ip)
        raise HTTPException(
            status_code=400,
            detail=f"Invalid PIN format. Must be 4-6 digits. Attempt {failures}/3."
        )

    setting = db.query(models.HotelSetting).filter(models.HotelSetting.key == "default").first()
    
    is_valid = False
    if setting and setting.manager_pin_hash and setting.manager_pin_salt:
        is_valid = verify_manager_pin(clean_pin, setting.manager_pin_hash, setting.manager_pin_salt)
    else:
        # Default bootstrap PIN '1234' if not yet configured
        default_salt, default_hash, _ = hash_manager_pin("1234", salt="default_svr_salt")
        is_valid = verify_manager_pin(clean_pin, default_hash, default_salt)

    if not is_valid:
        failures, lock_dur = record_pin_failure(client_ip)
        if lock_dur > 0:
            raise HTTPException(
                status_code=429,
                detail=f"Invalid Manager PIN. 3 failed attempts exceeded. Supervisor gate locked for {lock_dur} seconds."
            )
        raise HTTPException(
            status_code=401,
            detail=f"Incorrect Manager PIN. Attempt {failures}/3. Please try again."
        )

    # Success: Reset failure count and issue 5-minute signed token
    reset_pin_failures(client_ip)
    pin_token = create_manager_pin_token(
        user_id="supervisor",
        action=payload.action or "SUPERVISOR_ACTION",
        expires_seconds=PIN_GRACE_SECONDS
    )

    return {
        "status": "success",
        "verified": True,
        "token": pin_token,
        "expires_in": PIN_GRACE_SECONDS,
        "message": "Supervisor PIN verified. 5-minute grace period active."
    }
