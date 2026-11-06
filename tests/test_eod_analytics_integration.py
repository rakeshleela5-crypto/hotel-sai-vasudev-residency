"""
Integration Test Suite: End-of-Day (EOD) Analytics & Cash Drawer Reconciliation
Tests:
  1. Creation and querying of operational expenditures across categories.
  2. Revenue breakdown by room category.
  3. Master EOD Cash Drawer reconciliation aggregating both room checkouts and restaurant food bills.
"""

import uuid
import pytest
from app.database import SessionLocal
from app import models
from app.routes.eod_analytics import (
    ExpenseCreate,
    create_expense,
    list_expenses,
    get_revenue_by_room_category,
    get_revenue_by_payment_mode,
    get_eod_summary
)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_create_and_list_operational_expenses(db):
    test_date = "2026-11-06"
    expense_data = ExpenseCreate(
        expense_date=test_date,
        expense_time="14:30",
        category="Housekeeping & Guest Supplies",
        subcategory="Guest Toiletries & Linen Wash",
        amount=1250.0,
        payment_mode="Cash",
        account_name="Petty Cash Drawer",
        paid_to="Rayagada Laundry Services",
        receipt_ref="REC-LND-8821",
        approved_by="Manager",
        notes="Urgent bedsheet sanitization and dry wash"
    )

    created = create_expense(expense_data, db=db)
    assert created.amount == 1250.0
    assert created.category == "Housekeeping & Guest Supplies"
    assert created.voucher_no.startswith("EXP-EOD-")

    res = list_expenses(date=test_date, category="Housekeeping & Guest Supplies", db=db)
    assert res["total_count"] >= 1
    assert any(e.id == created.id for e in res["expenses"])


def test_eod_cash_drawer_reconciliation(db):
    test_date = f"2026-11-{uuid.uuid4().hex[:2]}"  # Unique simulated day

    # 1. Seed a Cash Room Checkout: ₹2,240
    checkout = models.CheckoutRecord(
        invoice_no=f"INV-{uuid.uuid4().hex[:6].upper()}",
        room_no="102",
        room_type="Deluxe",
        guest_name="Kishore Kumar",
        check_in_date=test_date,
        check_out_date=test_date,
        total_room_rent=2000.0,
        gst_amount=240.0,
        net_payable=2240.0,
        payment_mode="Cash",
        is_deleted=False
    )
    db.add(checkout)

    # 2. Seed a Cash Restaurant Food Bill: ₹650
    food_bill = models.FoodBill(
        bill_no=f"FB-{uuid.uuid4().hex[:6].upper()}",
        table_no="Table 4",
        guest_name="Walk-in Diner",
        date=test_date,
        time="13:15",
        taxable_amount=619.05,
        net_bill_amount=650.0,
        settlement_type="Cash",
        is_deleted=False
    )
    db.add(food_bill)

    # 3. Seed a Cash Petty Expense: ₹400
    expense = models.EodExpenditure(
        voucher_no=f"EXP-{uuid.uuid4().hex[:6].upper()}",
        expense_date=test_date,
        category="Kitchen & F&B Raw Materials",
        subcategory="Dairy, Milk, Paneer & Curd",
        amount=400.0,
        payment_mode="Cash",
        paid_to="Local Dairy Vendor"
    )
    db.add(expense)
    db.commit()

    # 4. Invoke Master EOD Summary
    eod = get_eod_summary(date=test_date, db=db)

    # Cash Inflow = Room Cash (2240) + Food Cash (650) = 2890.0
    expected_inflow = 2240.0 + 650.0
    # Expected Closing Cash Drawer = Opening (15000) + Inflow (2890) - Cash Expense (400) = 17490.0
    expected_closing = 15000.0 + expected_inflow - 400.0

    drawer = eod["cash_drawer_reconciliation"]
    assert drawer["cash_inflow"] == expected_inflow
    assert drawer["cash_outflow"] == 400.0
    assert drawer["closing_cash_in_drawer"] == expected_closing


def test_revenue_by_room_category_and_payment_mode(db):
    test_date = "2026-11-01"

    cat_res = get_revenue_by_room_category(date=test_date, db=db)
    assert "categories" in cat_res
    assert "summary" in cat_res

    mode_res = get_revenue_by_payment_mode(date=test_date, db=db)
    assert "modes" in mode_res
    assert "grand_total" in mode_res
