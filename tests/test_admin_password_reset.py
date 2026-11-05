import os
import sys
import pytest
from fastapi import HTTPException

# Ensure backend and root paths are available
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database import engine, SessionLocal, Base
from app import models, schemas
from app.routes.pms import reset_staff_password
from app.routes.admin import admin_reset_staff_password
from app.utils.auth import get_password_hash, verify_password

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture(scope="module")
def test_user(db):
    user = db.query(models.UserAccount).filter(models.UserAccount.user_id == 999).first()
    if not user:
        user = models.UserAccount(
            user_id=999,
            s_no=999,
            firm_id="DEMO0004",
            user_name="TestStaff999",
            email_id="staff999@sai-vasudev.com",
            role_id=2,
            role_name="Receptionist",
            status="Verified",
            department="Front Office",
            password_hash=get_password_hash("initial_pass123")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def test_reset_password_rejects_short_password(db, test_user):
    """Ensure resetting with password shorter than 6 characters raises HTTP 400."""
    req = schemas.StaffPasswordResetRequest(new_password="123")
    with pytest.raises(HTTPException) as exc_info:
        reset_staff_password(user_id=str(test_user.user_id), payload=req, db=db)
    assert exc_info.value.status_code == 400
    assert "at least 6 characters" in exc_info.value.detail

def test_pms_reset_password_updates_database(db, test_user):
    """Ensure resetting password via /pms/users/{user_id}/reset-password updates password_hash."""
    new_pwd = "NewSecurePass#2026!"
    req = schemas.StaffPasswordResetRequest(new_password=new_pwd, confirm_password=new_pwd)
    result = reset_staff_password(user_id=str(test_user.user_id), payload=req, db=db)

    assert result["success"] is True
    assert "reset successfully" in result["message"]

    # Verify directly from database that bcrypt matches new password
    db.expire_all()
    updated = db.query(models.UserAccount).filter(models.UserAccount.user_id == test_user.user_id).first()
    assert updated is not None
    assert verify_password(new_pwd, updated.password_hash) is True
    assert verify_password("wrong_password", updated.password_hash) is False

def test_admin_reset_staff_password_endpoint(db, test_user):
    """Ensure admin_reset_staff_password successfully resets password for an authorized Admin."""
    current_admin = {"email": "admin@sai-vasudev.com", "role": "ADMIN", "sub": "admin"}
    new_pwd = "AdminChanged#2026!"
    payload = {"new_password": new_pwd}

    result = admin_reset_staff_password(
        user_id=str(test_user.user_id),
        payload=payload,
        current_user=current_admin,
        db=db
    )

    assert result["success"] is True
    assert "reset successfully" in result["message"]

    db.expire_all()
    updated = db.query(models.UserAccount).filter(models.UserAccount.user_id == test_user.user_id).first()
    assert verify_password(new_pwd, updated.password_hash) is True

def test_reset_password_nonexistent_user(db):
    """Ensure attempting to reset non-existent user raises HTTP 404."""
    req = schemas.StaffPasswordResetRequest(new_password="ValidPass#12345")
    with pytest.raises(HTTPException) as exc_info:
        reset_staff_password(user_id="99999999", payload=req, db=db)
    assert exc_info.value.status_code == 404
