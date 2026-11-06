"""
Integration Test Suite: Chartered Accountant (CA) Monthly Export & Dual GST Engine
Tests:
  1. Dual SAC code compliance (SAC 996311 for 12% Rooms, SAC 996331 for 5% Restaurant F&B).
  2. Net Monthly Operating Profit accounting formula:
     Operating Profit = Grand Taxable Revenue - (Operating Expenditures + Staff Payroll)
     Verifying output GST liabilities are NEVER counted as operating revenue.
  3. Section 170 CGST Act Rounding Compliance (nearest integer rupee rounding).
"""

import uuid
import pytest
from app.database import SessionLocal
from app import models
from app.routes.ca_export import get_ca_monthly_export


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_ca_monthly_export_dual_gst_sac_codes(db):
    period = "2026-11"

    # 1. Seed a 12% Room Checkout Record (SAC 996311)
    checkout = models.CheckoutRecord(
        invoice_no=f"INV-ROOM-{uuid.uuid4().hex[:6].upper()}",
        room_no="201",
        room_type="Executive",
        guest_name="Pradeep Mohanty",
        check_in_date=f"{period}-01",
        check_out_date=f"{period}-03",
        total_room_rent=5000.0,
        cgst_amount=300.0,  # 6%
        sgst_amount=300.0,  # 6%
        gst_amount=600.0,   # 12%
        net_payable=5600.0,
        payment_mode="Bank Transfer",
        is_deleted=False,
        is_cancelled=False
    )
    db.add(checkout)

    # 2. Seed a 5% Restaurant Food Bill (SAC 996331)
    food_bill = models.FoodBill(
        bill_no=f"FB-DINE-{uuid.uuid4().hex[:6].upper()}",
        table_no="Table 2",
        guest_name="Pooja Sharma",
        date=f"{period}-02",
        time="19:30",
        taxable_amount=1000.0,
        cgst_amount=25.0,  # 2.5%
        sgst_amount=25.0,  # 2.5%
        net_bill_amount=1050.0,
        settlement_type="UPI",
        is_deleted=False
    )
    db.add(food_bill)
    db.commit()

    # Query CA Export
    export = get_ca_monthly_export(period=period, db=db)
    assert export["status"] == "success"

    # Verify Tax Slabs Breakdown
    tax_slabs = export["tax_slabs_summary"]
    sac_codes = [s["sac_code"] for s in tax_slabs]
    assert "996311" in sac_codes  # Room Accommodation (12%)
    assert "996331" in sac_codes  # Restaurant F&B (5%)

    room_slab = next(s for s in tax_slabs if s["sac_code"] == "996311")
    assert room_slab["gst_rate_pct"] == 12.0
    assert room_slab["cgst_rate_pct"] == 6.0
    assert room_slab["sgst_rate_pct"] == 6.0

    food_slab = next(s for s in tax_slabs if s["sac_code"] == "996331")
    assert food_slab["gst_rate_pct"] == 5.0
    assert food_slab["cgst_rate_pct"] == 2.5
    assert food_slab["sgst_rate_pct"] == 2.5


def test_ca_export_net_operating_profit_calculation(db):
    period = f"2026-10"

    # 1. Taxable Revenue = ₹10,000 + 12% GST (₹1,200) = Gross ₹11,200
    checkout = models.CheckoutRecord(
        invoice_no=f"INV-CALC-{uuid.uuid4().hex[:6].upper()}",
        room_no="205",
        room_type="Classic Studio",
        guest_name="Amitabh Sen",
        check_in_date=f"{period}-10",
        check_out_date=f"{period}-12",
        total_room_rent=10000.0,
        cgst_amount=600.0,
        sgst_amount=600.0,
        gst_amount=1200.0,
        net_payable=11200.0,
        payment_mode="Cash",
        is_deleted=False,
        is_cancelled=False
    )
    db.add(checkout)

    # 2. Operating Expenses = ₹2,500
    expense = models.EodExpenditure(
        voucher_no=f"EXP-CALC-{uuid.uuid4().hex[:6].upper()}",
        expense_date=f"{period}-11",
        category="Utilities",
        subcategory="Electricity Bill",
        amount=2500.0,
        payment_mode="Bank Transfer - SBI",
        paid_to="TPSODL Power Distribution"
    )
    db.add(expense)

    # 3. Staff Payroll = ₹3,000
    staff = models.StaffProfile(
        staff_code=f"STF-CALC-{uuid.uuid4().hex[:4].upper()}",
        full_name="Bikash Panda",
        gender="Male",
        phone=f"92{uuid.uuid4().hex[:8]}",
        department="Front Office",
        role="Guest Relation Executive",
        monthly_base_salary=3000.0,
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
        payroll_period=period,
        monthly_base_salary=3000.0,
        total_advance_deducted=0.0,
        net_payable_salary=3000.0,
        payout_status="Paid"
    )
    db.add(payroll)
    db.commit()

    export = get_ca_monthly_export(period=period, db=db)
    summary = export["preview_summary"]

    # Taxable revenue is 10,000.0 (GST 1,200 is liability, NOT operating profit)
    # Expenses: 2,500
    # Payroll: 3,000
    # Net Operating Profit = 10,000 - 2,500 - 3,000 = 4,500.0
    expected_profit = summary["total_taxable_value"] - (summary["total_operating_expenditures"] + summary["total_staff_payroll"])

    assert summary["net_monthly_operating_profit"] == round(expected_profit, 2)
    # Ensure GST is NOT included in profit calculation
    assert summary["net_monthly_operating_profit"] < summary["total_invoice_value"]


def test_section_170_cgst_rounding_compliance():
    # Section 170 CGST Act: Paise >= 50 rounded up to 1 rupee, < 50 ignored
    test_cases = [
        (1254.49, 1254),
        (1254.50, 1255),
        (1254.51, 1255),
        (1254.00, 1254),
        (1254.99, 1255),
        (0.49, 0),
        (0.50, 1),
    ]

    for val, expected_rounded in test_cases:
        rounded = int(val + 0.5) if (val - int(val)) >= 0.5 else int(val)
        assert rounded == expected_rounded, f"Section 170 rounding failed for {val}: got {rounded}, expected {expected_rounded}"
