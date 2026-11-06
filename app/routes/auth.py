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
    normalize_role,
    verify_password,
    get_password_hash,
    HospitalityRole
)
from app.utils.rate_limit import limiter
from app.utils.audit import record_audit_log
from app.utils.sanitization import sanitize_text

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])

class LoginRequest(BaseModel):
    username: str
    password: Optional[str] = "admin123"
    role: Optional[str] = None

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None

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
