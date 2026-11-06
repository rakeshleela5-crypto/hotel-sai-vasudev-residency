import re
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import StaffProfile, StaffSalaryAdvance, StaffMonthlyPayroll

router = APIRouter()

# =========================================================================
# PYDANTIC SCHEMAS
# =========================================================================

class StaffProfileCreate(BaseModel):
    staff_code: Optional[str] = None
    full_name: str = Field(..., min_length=2, max_length=150)
    gender: str = Field(..., pattern=r"^(Male|Female|Other)$")
    role: str = Field(..., min_length=2, max_length=100)
    department: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=8, max_length=30)
    monthly_base_salary: float = Field(..., ge=0)
    emergency_contact: Optional[str] = None
    date_of_joining: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_no: Optional[str] = None
    bank_ifsc: Optional[str] = None
    aadhaar_number: Optional[str] = None
    is_active: bool = True

class StaffProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    gender: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    monthly_base_salary: Optional[float] = None
    emergency_contact: Optional[str] = None
    date_of_joining: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_no: Optional[str] = None
    bank_ifsc: Optional[str] = None
    aadhaar_number: Optional[str] = None
    is_active: Optional[bool] = None

class SalaryAdvanceCreate(BaseModel):
    staff_id: int
    advance_date: str  # Format: "DD-MM-YYYY" or "YYYY-MM-DD"
    amount: float = Field(..., gt=0)
    payment_mode: str = Field(default="Cash")
    remarks: Optional[str] = None
    month_period: Optional[str] = None  # e.g. "2026-11"

class PayrollStatusUpdate(BaseModel):
    payout_status: str = Field(..., pattern=r"^(Pending|Paid)$")
    payment_date: Optional[str] = None
    payment_mode: Optional[str] = None
    payment_reference: Optional[str] = None
    remarks: Optional[str] = None

class PayrollCalculateRequest(BaseModel):
    payroll_period: str = Field(..., pattern=r"^\d{4}-\d{2}$")  # e.g. "2026-11"

# =========================================================================
# HELPER FUNCTIONS
# =========================================================================

def _normalize_month_period(date_str: str) -> str:
    """Extracts YYYY-MM from various date string formats."""
    # Check YYYY-MM-DD
    match = re.match(r"^(\d{4})-(\d{2})", date_str)
    if match:
        return f"{match.group(1)}-{match.group(2)}"
    # Check DD-MM-YYYY
    match_dmy = re.match(r"^\d{2}-(\d{2})-(\d{4})", date_str)
    if match_dmy:
        return f"{match_dmy.group(2)}-{match_dmy.group(1)}"
    # Fallback to current year-month
    now = datetime.now()
    return f"{now.year:04d}-{now.month:02d}"

# =========================================================================
# DEPARTMENT & ROLES DIRECTORY ENDPOINT
# =========================================================================

@router.get("/departments")
def get_departments_and_roles():
    """Returns official hotel departments and commonly assigned roles."""
    return [
        {
            "department": "Front Office",
            "roles": ["Front Desk Executive", "Night Auditor", "Bellboy / Porter", "Front Office Manager"]
        },
        {
            "department": "Housekeeping",
            "roles": ["Room Attendant", "Housekeeping Supervisor", "Laundry Staff", "Floor Cleaner"]
        },
        {
            "department": "Vasudev Rasoi F&B",
            "roles": ["Restaurant Steward", "Head Waiter", "Captain", "Room Service Attendant"]
        },
        {
            "department": "Kitchen",
            "roles": ["Head Chef", "Commis Chef", "Tandoor Cook", "Kitchen Helper / Dishwasher"]
        },
        {
            "department": "Maintenance & Engineering",
            "roles": ["Electrician", "Plumber", "AC Technician", "General Maintenance"]
        },
        {
            "department": "Security",
            "roles": ["Security Guard", "Head Security"]
        },
        {
            "department": "Accounts & Administration",
            "roles": ["Hotel Accountant", "Cashier", "Storekeeper", "General Manager"]
        }
    ]

# =========================================================================
# STAFF PROFILES ENDPOINTS
# =========================================================================

@router.get("/staff")
def list_staff(
    department: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve all staff profiles with optional search and filters."""
    query = db.query(StaffProfile)
    if department:
        query = query.filter(StaffProfile.department == department)
    if is_active is not None:
        query = query.filter(StaffProfile.is_active == is_active)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (StaffProfile.full_name.ilike(search_filter)) |
            (StaffProfile.staff_code.ilike(search_filter)) |
            (StaffProfile.phone.ilike(search_filter)) |
            (StaffProfile.role.ilike(search_filter))
        )
    staff_list = query.order_by(StaffProfile.id.asc()).all()
    return staff_list

@router.post("/staff", status_code=status.HTTP_201_CREATED)
def create_staff(payload: StaffProfileCreate, db: Session = Depends(get_db)):
    """Create a new staff profile."""
    # Generate staff_code if not supplied
    if not payload.staff_code or not payload.staff_code.strip():
        count = db.query(StaffProfile).count()
        staff_code = f"SVR-STF-{count + 1:03d}"
    else:
        staff_code = payload.staff_code.strip()
        existing = db.query(StaffProfile).filter(StaffProfile.staff_code == staff_code).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Staff code {staff_code} already exists")

    staff = StaffProfile(
        staff_code=staff_code,
        full_name=payload.full_name.strip(),
        gender=payload.gender,
        role=payload.role.strip(),
        department=payload.department.strip(),
        phone=payload.phone.strip(),
        monthly_base_salary=payload.monthly_base_salary,
        emergency_contact=payload.emergency_contact,
        date_of_joining=payload.date_of_joining,
        bank_name=payload.bank_name,
        bank_account_no=payload.bank_account_no,
        bank_ifsc=payload.bank_ifsc,
        aadhaar_number=payload.aadhaar_number,
        is_active=payload.is_active
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff

@router.put("/staff/{staff_id}")
def update_staff(staff_id: int, payload: StaffProfileUpdate, db: Session = Depends(get_db)):
    """Update an existing staff profile."""
    staff = db.query(StaffProfile).filter(StaffProfile.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    update_data = payload.dict(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(staff, field, val)

    db.commit()
    db.refresh(staff)
    return staff

@router.delete("/staff/{staff_id}")
def delete_staff(staff_id: int, hard_delete: bool = False, db: Session = Depends(get_db)):
    """Deactivate or hard delete a staff profile."""
    staff = db.query(StaffProfile).filter(StaffProfile.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    if hard_delete:
        db.delete(staff)
    else:
        staff.is_active = False
    db.commit()
    return {"message": f"Staff {staff.full_name} ({staff.staff_code}) updated", "is_active": staff.is_active}

# =========================================================================
# SALARY ADVANCES ENDPOINTS
# =========================================================================

@router.get("/advances")
def list_advances(
    month_period: Optional[str] = None,
    staff_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Retrieve salary advances, optionally filtered by month or staff ID."""
    query = db.query(StaffSalaryAdvance, StaffProfile).join(
        StaffProfile, StaffSalaryAdvance.staff_id == StaffProfile.id
    )
    if month_period:
        query = query.filter(StaffSalaryAdvance.month_period == month_period)
    if staff_id:
        query = query.filter(StaffSalaryAdvance.staff_id == staff_id)

    records = query.order_by(StaffSalaryAdvance.id.desc()).all()
    results = []
    for adv, stf in records:
        results.append({
            "id": adv.id,
            "advance_voucher_no": adv.advance_voucher_no,
            "staff_id": adv.staff_id,
            "staff_code": stf.staff_code,
            "staff_name": stf.full_name,
            "department": stf.department,
            "role": stf.role,
            "advance_date": adv.advance_date,
            "month_period": adv.month_period,
            "amount": adv.amount,
            "payment_mode": adv.payment_mode,
            "remarks": adv.remarks or "",
            "is_deducted": adv.is_deducted,
            "created_at": adv.created_at.isoformat() if adv.created_at else None
        })
    return results

@router.post("/advances", status_code=status.HTTP_201_CREATED)
def record_advance(payload: SalaryAdvanceCreate, db: Session = Depends(get_db)):
    """Record a mid-month salary advance for a staff member."""
    staff = db.query(StaffProfile).filter(StaffProfile.id == payload.staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    month_period = payload.month_period or _normalize_month_period(payload.advance_date)

    # Generate sequential voucher number: ADV/25-26/0001
    total_advances = db.query(StaffSalaryAdvance).count()
    voucher_no = f"ADV/25-26/{total_advances + 1:04d}"

    advance = StaffSalaryAdvance(
        advance_voucher_no=voucher_no,
        staff_id=payload.staff_id,
        advance_date=payload.advance_date,
        month_period=month_period,
        amount=payload.amount,
        payment_mode=payload.payment_mode,
        remarks=payload.remarks,
        is_deducted=False
    )
    db.add(advance)
    db.commit()
    db.refresh(advance)

    return {
        "id": advance.id,
        "advance_voucher_no": advance.advance_voucher_no,
        "staff_id": staff.id,
        "staff_name": staff.full_name,
        "staff_code": staff.staff_code,
        "department": staff.department,
        "amount": advance.amount,
        "advance_date": advance.advance_date,
        "month_period": advance.month_period,
        "payment_mode": advance.payment_mode,
        "remarks": advance.remarks,
        "is_deducted": advance.is_deducted
    }

@router.delete("/advances/{advance_id}")
def delete_advance(advance_id: int, db: Session = Depends(get_db)):
    """Delete a salary advance record."""
    adv = db.query(StaffSalaryAdvance).filter(StaffSalaryAdvance.id == advance_id).first()
    if not adv:
        raise HTTPException(status_code=404, detail="Advance record not found")
    db.delete(adv)
    db.commit()
    return {"message": "Advance record deleted successfully", "id": advance_id}

# =========================================================================
# MONTHLY PAYROLL CALCULATION & REPORT ENDPOINTS
# =========================================================================

@router.get("/payroll")
def get_monthly_payroll(
    period: str = Query(..., pattern=r"^\d{4}-\d{2}$", description="e.g. 2026-11"),
    db: Session = Depends(get_db)
):
    """
    Computes or retrieves end-of-month payroll for all active staff:
    Net Payable = Monthly Base Salary - Total Advances taken in that month.
    """
    active_staff = db.query(StaffProfile).filter(StaffProfile.is_active == True).order_by(StaffProfile.department, StaffProfile.id).all()
    existing_payroll_records = {
        p.staff_id: p for p in db.query(StaffMonthlyPayroll).filter(StaffMonthlyPayroll.payroll_period == period).all()
    }

    # Fetch advances for this month
    advances_in_month = db.query(StaffSalaryAdvance).filter(StaffSalaryAdvance.month_period == period).all()
    advance_by_staff = {}
    for a in advances_in_month:
        advance_by_staff[a.staff_id] = advance_by_staff.get(a.staff_id, 0.0) + a.amount

    payroll_rows = []
    total_base_salaries = 0.0
    total_advances_deducted = 0.0
    total_net_payable = 0.0
    total_paid_count = 0
    total_pending_count = 0

    for stf in active_staff:
        existing = existing_payroll_records.get(stf.id)
        base = stf.monthly_base_salary
        advances = advance_by_staff.get(stf.id, 0.0)
        net = max(0.0, round(base - advances, 2))

        payout_status = existing.payout_status if existing else "Pending"
        payment_date = existing.payment_date if existing else None
        payment_mode = existing.payment_mode if existing else None
        payment_reference = existing.payment_reference if existing else None
        remarks = existing.remarks if existing else ""
        payroll_id = existing.id if existing else None

        if payout_status == "Paid":
            total_paid_count += 1
        else:
            total_pending_count += 1

        total_base_salaries += base
        total_advances_deducted += advances
        total_net_payable += net

        payroll_rows.append({
            "payroll_id": payroll_id,
            "payroll_period": period,
            "staff_id": stf.id,
            "staff_code": stf.staff_code,
            "staff_name": stf.full_name,
            "gender": stf.gender,
            "department": stf.department,
            "role": stf.role,
            "phone": stf.phone,
            "monthly_base_salary": base,
            "total_advance_deducted": advances,
            "bonus_or_allowance": existing.bonus_or_allowance if existing else 0.0,
            "other_deductions": existing.other_deductions if existing else 0.0,
            "net_payable_salary": net,
            "payout_status": payout_status,
            "payment_date": payment_date,
            "payment_mode": payment_mode,
            "payment_reference": payment_reference,
            "remarks": remarks
        })

    return {
        "period": period,
        "summary": {
            "total_staff_count": len(payroll_rows),
            "total_base_salaries": round(total_base_salaries, 2),
            "total_advances_deducted": round(total_advances_deducted, 2),
            "total_net_payable": round(total_net_payable, 2),
            "total_paid_count": total_paid_count,
            "total_pending_count": total_pending_count
        },
        "rows": payroll_rows
    }

@router.post("/payroll/calculate")
def calculate_and_save_monthly_payroll(payload: PayrollCalculateRequest, db: Session = Depends(get_db)):
    """
    Persists or updates the calculated monthly payroll records in staff_monthly_payroll.
    """
    period = payload.payroll_period
    active_staff = db.query(StaffProfile).filter(StaffProfile.is_active == True).all()

    advances_in_month = db.query(StaffSalaryAdvance).filter(StaffSalaryAdvance.month_period == period).all()
    advance_by_staff = {}
    for a in advances_in_month:
        advance_by_staff[a.staff_id] = advance_by_staff.get(a.staff_id, 0.0) + a.amount

    saved_count = 0
    for stf in active_staff:
        base = stf.monthly_base_salary
        advances = advance_by_staff.get(stf.id, 0.0)
        net = max(0.0, round(base - advances, 2))

        existing = db.query(StaffMonthlyPayroll).filter(
            StaffMonthlyPayroll.payroll_period == period,
            StaffMonthlyPayroll.staff_id == stf.id
        ).first()

        if existing:
            existing.monthly_base_salary = base
            existing.total_advance_deducted = advances
            existing.net_payable_salary = net
            existing.staff_name = stf.full_name
            existing.department = stf.department
            existing.role = stf.role
        else:
            new_record = StaffMonthlyPayroll(
                payroll_period=period,
                staff_id=stf.id,
                staff_name=stf.full_name,
                department=stf.department,
                role=stf.role,
                monthly_base_salary=base,
                total_advance_deducted=advances,
                bonus_or_allowance=0.0,
                other_deductions=0.0,
                net_payable_salary=net,
                payout_status="Pending"
            )
            db.add(new_record)
        saved_count += 1

    # Mark advances as deducted
    for a in advances_in_month:
        a.is_deducted = True

    db.commit()
    return {"message": f"Payroll for {period} computed and saved for {saved_count} staff members", "period": period}

@router.put("/payroll/{staff_id}/status")
def update_payroll_payout_status(
    staff_id: int,
    period: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    payload: PayrollStatusUpdate = None,
    db: Session = Depends(get_db)
):
    """Marks a staff member's payroll for a given period as Paid or Pending."""
    payroll = db.query(StaffMonthlyPayroll).filter(
        StaffMonthlyPayroll.payroll_period == period,
        StaffMonthlyPayroll.staff_id == staff_id
    ).first()

    if not payroll:
        # Create record if doesn't exist yet
        stf = db.query(StaffProfile).filter(StaffProfile.id == staff_id).first()
        if not stf:
            raise HTTPException(status_code=404, detail="Staff member not found")
        advances = db.query(StaffSalaryAdvance).filter(
            StaffSalaryAdvance.staff_id == staff_id,
            StaffSalaryAdvance.month_period == period
        ).all()
        total_adv = sum(a.amount for a in advances)
        net = max(0.0, round(stf.monthly_base_salary - total_adv, 2))

        payroll = StaffMonthlyPayroll(
            payroll_period=period,
            staff_id=stf.id,
            staff_name=stf.full_name,
            department=stf.department,
            role=stf.role,
            monthly_base_salary=stf.monthly_base_salary,
            total_advance_deducted=total_adv,
            net_payable_salary=net,
            payout_status=payload.payout_status
        )
        db.add(payroll)

    payroll.payout_status = payload.payout_status
    if payload.payment_date:
        payroll.payment_date = payload.payment_date
    if payload.payment_mode:
        payroll.payment_mode = payload.payment_mode
    if payload.payment_reference:
        payroll.payment_reference = payload.payment_reference
    if payload.remarks:
        payroll.remarks = payload.remarks

    db.commit()
    db.refresh(payroll)
    return {
        "staff_id": staff_id,
        "payroll_period": period,
        "payout_status": payroll.payout_status,
        "payment_date": payroll.payment_date,
        "payment_mode": payroll.payment_mode,
        "payment_reference": payroll.payment_reference,
        "net_payable_salary": payroll.net_payable_salary
    }

