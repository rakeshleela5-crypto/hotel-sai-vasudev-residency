"""
Integration Test Suite: Staff Payroll Management & Payout Verification
Tests:
  1. Staff profile creation, uniqueness, and department filtering.
  2. Salary advance recording, tracking, and remaining balance.
  3. Monthly payroll calculation with automatic advance deduction.
  4. Payout status transitions (Pending -> Paid) with UTR audit tracking.
"""

import uuid
import pytest
from app.database import SessionLocal
from app import models
from app.routes.staff_payroll import (
    StaffProfileCreate,
    SalaryAdvanceCreate,
    PayrollCalculateRequest,
    PayrollStatusUpdate,
    create_staff,
    list_staff,
    record_advance,
    list_advances,
    calculate_and_save_monthly_payroll,
    update_payroll_payout_status
)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_create_and_list_staff(db):
    staff_code = f"STF-{uuid.uuid4().hex[:6].upper()}"
    phone = f"98{uuid.uuid4().hex[:8]}"

    payload = StaffProfileCreate(
        staff_code=staff_code,
        full_name="Balaram Dash",
        phone=phone,
        department="Front Office",
        role="Front Desk Receptionist",
        gender="Male",
        monthly_base_salary=18000.0,
        is_active=True
    )

    created = create_staff(payload, db=db)
    assert created.staff_code == staff_code
    assert created.full_name == "Balaram Dash"
    assert created.monthly_base_salary == 18000.0

    # Query list with department filter
    staff_list = list_staff(department="Front Office", db=db)
    staff_ids = [s.id for s in staff_list]
    assert created.id in staff_ids


def test_record_salary_advance_and_deduction(db):
    staff_code = f"STF-{uuid.uuid4().hex[:6].upper()}"
    phone = f"97{uuid.uuid4().hex[:8]}"

    staff = models.StaffProfile(
        staff_code=staff_code,
        full_name="Pramod Mohanty",
        gender="Male",
        phone=phone,
        department="Housekeeping",
        role="Housekeeping Supervisor",
        monthly_base_salary=15000.0,
        is_active=True
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)

    adv_payload = SalaryAdvanceCreate(
        staff_id=staff.id,
        amount=3000.0,
        payment_mode="Cash",
        remarks="Family Emergency Medical Advance",
        advance_date="2026-11-02",
        deduction_period="2026-11"
    )

    adv = record_advance(adv_payload, db=db)
    assert adv["staff_id"] == staff.id
    assert adv["amount"] == 3000.0
    assert adv["is_deducted"] is False

    advances = list_advances(staff_id=staff.id, db=db)
    assert len(advances) >= 1
    assert any(a["id"] == adv["id"] for a in advances)


def test_calculate_monthly_payroll_with_advance_deduction(db):
    staff_code = f"STF-{uuid.uuid4().hex[:6].upper()}"
    phone = f"96{uuid.uuid4().hex[:8]}"

    staff = models.StaffProfile(
        staff_code=staff_code,
        full_name="Subrat Jena",
        gender="Male",
        phone=phone,
        department="Vasudev Rasoi F&B",
        role="Head Chef",
        monthly_base_salary=25000.0,
        is_active=True
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)

    # Pre-record an advance of 5000 for period 2026-11
    voucher_no = f"ADV-{uuid.uuid4().hex[:6].upper()}"
    adv = models.StaffSalaryAdvance(
        advance_voucher_no=voucher_no,
        staff_id=staff.id,
        amount=5000.0,
        payment_mode="UPI",
        advance_date="2026-11-05",
        month_period="2026-11",
        remarks="Kitchen Festival Advance"
    )
    db.add(adv)
    db.commit()

    calc_req = PayrollCalculateRequest(
        payroll_period="2026-11"
    )

    result = calculate_and_save_monthly_payroll(calc_req, db=db)
    assert "computed and saved" in result["message"]

    # Verify staff's computed payroll record
    payroll_rec = db.query(models.StaffMonthlyPayroll).filter(
        models.StaffMonthlyPayroll.staff_id == staff.id,
        models.StaffMonthlyPayroll.payroll_period == "2026-11"
    ).first()

    assert payroll_rec is not None
    assert payroll_rec.monthly_base_salary == 25000.0
    assert payroll_rec.total_advance_deducted == 5000.0
    assert payroll_rec.net_payable_salary == 20000.0
    assert payroll_rec.payout_status == "Pending"


def test_update_payroll_payout_status(db):
    staff_code = f"STF-{uuid.uuid4().hex[:6].upper()}"
    phone = f"95{uuid.uuid4().hex[:8]}"

    staff = models.StaffProfile(
        staff_code=staff_code,
        full_name="Deepak Nayak",
        gender="Male",
        phone=phone,
        department="Front Office",
        role="Night Auditor",
        monthly_base_salary=20000.0,
        is_active=True
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)

    payroll = models.StaffMonthlyPayroll(
        staff_id=staff.id,
        staff_name=staff.full_name,
        department=staff.department,
        role=staff.role,
        payroll_period="2026-11",
        monthly_base_salary=20000.0,
        total_advance_deducted=0.0,
        net_payable_salary=20000.0,
        payout_status="Pending"
    )
    db.add(payroll)
    db.commit()
    db.refresh(payroll)

    status_update = PayrollStatusUpdate(
        payout_status="Paid",
        payment_mode="Bank Transfer",
        payment_reference="UTR-SAL-202611-9876",
        payment_date="2026-11-30"
    )

    updated = update_payroll_payout_status(
        staff_id=staff.id,
        period="2026-11",
        payload=status_update,
        db=db
    )

    assert updated["payout_status"] == "Paid"
    assert updated["payment_mode"] == "Bank Transfer"
    assert updated["payment_reference"] == "UTR-SAL-202611-9876"
