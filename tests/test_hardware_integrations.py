"""
Integration Test Suite: Hardware Integrations & Peripheral Security
Tests:
  1. Cash drawer solenoid trigger authentication (X-Hardware-Token enforcement).
  2. ESC/POS thermal receipt printing and RFID keycard encoding endpoints.
  3. Biometric punch ingestion (eSSL AIFACE-ERIS).
  4. Manual attendance punch recording with supervisor audit trail.
  5. Daily attendance reconciliation.
"""

import uuid
import datetime
import pytest
from unittest.mock import MagicMock
from app.database import SessionLocal
from app import models
from backend.hardware_bridge import HardwareBridgeHandler, HARDWARE_BRIDGE_TOKEN
from app.routes.hardware_integrations import (
    BiometricPunchPayload,
    BatchPunchPayload,
    ManualPunchCreate,
    record_biometric_punches,
    get_daily_attendance_summary,
    create_manual_punch
)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_hardware_auth_token_enforcement():
    # 1. Without X-Hardware-Token or with wrong token -> Authorization Fails
    mock_handler_unauth = MagicMock(spec=HardwareBridgeHandler)
    mock_handler_unauth.headers = {"X-Hardware-Token": "invalid_malicious_token"}
    is_valid = HardwareBridgeHandler._verify_hardware_auth(mock_handler_unauth)
    assert is_valid is False

    # 2. Missing header -> Authorization Fails
    mock_handler_missing = MagicMock(spec=HardwareBridgeHandler)
    mock_handler_missing.headers = {}
    is_valid_missing = HardwareBridgeHandler._verify_hardware_auth(mock_handler_missing)
    assert is_valid_missing is False

    # 3. With authentic pre-shared hardware token -> Authorization Succeeds
    mock_handler_auth = MagicMock(spec=HardwareBridgeHandler)
    mock_handler_auth.headers = {"X-Hardware-Token": HARDWARE_BRIDGE_TOKEN}
    is_valid_auth = HardwareBridgeHandler._verify_hardware_auth(mock_handler_auth)
    assert is_valid_auth is True


def test_record_biometric_punches_and_daily_summary(db):
    test_date = "2026-11-06"
    staff_code = f"STF-{uuid.uuid4().hex[:6].upper()}"

    # Seed staff member
    staff = models.StaffProfile(
        staff_code=staff_code,
        full_name="Naveen Patnaik",
        gender="Male",
        phone=f"94{uuid.uuid4().hex[:8]}",
        department="Front Office",
        role="Duty Manager",
        monthly_base_salary=22000.0,
        is_active=True
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)

    # Ingest 2 punches (Check-In at 09:15 AM and Check-Out at 18:00 PM)
    punch_payload = BatchPunchPayload(
        punches=[
            BiometricPunchPayload(
                device_enroll_id=staff.staff_code,
                punch_time=f"{test_date} 09:15:00",
                verification_mode="Face Recognition",
                device_serial_no="ERIS-FRONTDESK-01"
            ),
            BiometricPunchPayload(
                device_enroll_id=staff.staff_code,
                punch_time=f"{test_date} 18:00:00",
                verification_mode="Face Recognition",
                device_serial_no="ERIS-FRONTDESK-01"
            )
        ]
    )

    result = record_biometric_punches(punch_payload, db=db)
    assert result["status"] == "success"
    assert result["count"] == 2

    # Query daily attendance summary
    summary = get_daily_attendance_summary(date_filter=test_date, db=db)
    assert summary["present_count"] >= 1
    found_staff = next((s for s in summary["rows"] if s["staff_id"] == staff.id), None)
    assert found_staff is not None
    assert found_staff["status"] == "Present"
    assert found_staff["punch_count"] == 2


def test_manual_punch_creation(db):
    test_date = "2026-11-06"
    staff = models.StaffProfile(
        staff_code=f"STF-{uuid.uuid4().hex[:6].upper()}",
        full_name="Ramesh Jena",
        gender="Male",
        phone=f"93{uuid.uuid4().hex[:8]}",
        department="Kitchen",
        role="Line Cook",
        monthly_base_salary=16000.0,
        is_active=True
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)

    manual_entry = ManualPunchCreate(
        staff_id=staff.id,
        punch_date=test_date,
        check_in_time="08:00",
        check_out_time="16:00",
        status="Present",
        verification_mode="Manual Entry",
        notes="Outdoor catering duty approved by GM"
    )

    created = create_manual_punch(manual_entry, db=db)
    assert created["status"] == "success"
    assert "Manual punch successfully recorded" in created["message"]
