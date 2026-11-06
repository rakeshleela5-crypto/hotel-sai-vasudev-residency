"""
Module 2: End-of-Day (EOD) Expenditures and Detailed Revenue Analytics.
Segmented by customizable Expense Subcategories, Room Categories (Suite, Deluxe, Classic Studio, Premium, Executive),
and Payment Modes & Bank Accounts (Cash, UPI, Credit Card, Debit Card, SBI, HDFC).
"""
import datetime
import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import EodExpenditure, CheckoutRecord, Booking, FoodBill, Room

router = APIRouter(prefix="", tags=["EOD Analytics & Expenditures"])

# Predefined Expense Categories & Granular Subcategories
EXPENSE_CATEGORIES: Dict[str, List[str]] = {
    "Housekeeping": [
        "Housekeeping Supplies",
        "Linen Washing / Laundry",
        "Room Amenities & Toiletries",
        "Disinfectants & Cleaning Chemicals"
    ],
    "Kitchen & Vasudev Rasoi": [
        "Vegetables & Groceries",
        "Dairy & Bakery Items",
        "Spices & Dry Provisions",
        "Cooking Gas Cylinders (LPG)",
        "Food Packaging & Disposables"
    ],
    "Maintenance & Engineering": [
        "Plumbing & Sanitary Repairs",
        "Electrical & Lighting",
        "AC Servicing & Gas Refill",
        "DG Generator Diesel",
        "Carpentry & Touch-up Paint"
    ],
    "Utilities": [
        "Electricity Bill",
        "Water Supply / Tankers",
        "High-Speed Internet / Wi-Fi",
        "Telephone & Cable TV DTH"
    ],
    "Staff Allowance & Welfare": [
        "Staff Tea & Refreshments",
        "Overtime & Night Meal Allowance",
        "Uniform Maintenance & Stitching",
        "Emergency First Aid & Welfare"
    ],
    "Administrative & Front Office": [
        "Printing & Guest Registration Slips",
        "Key Cards & RFID Envelopes",
        "Software & Cloud Subscriptions",
        "Courier & Speed Post"
    ],
    "Miscellaneous": [
        "Local Travel & Auto Hire",
        "Pest Control Treatment",
        "Municipal Waste Disposal Fee",
        "General Petty Cash Sundries"
    ]
}

# Recognized Room Categories for Sri Sai Vasudev Residency
ALL_ROOM_CATEGORIES = [
    "Suite",
    "Deluxe",
    "Classic Studio",
    "Premium",
    "Executive"
]

# Standard Bank Accounts & Payment Modes
PAYMENT_MODES = [
    {"mode": "Cash", "account": "Petty Cash Drawer"},
    {"mode": "UPI", "account": "Vasudev UPI QR (SBI Merchant)"},
    {"mode": "Credit Card", "account": "HDFC POS Terminal #1"},
    {"mode": "Debit Card", "account": "HDFC POS Terminal #2"},
    {"mode": "Bank Transfer - SBI", "account": "State Bank of India (Current A/c 30987654321)"},
    {"mode": "Bank Transfer - HDFC", "account": "HDFC Bank (Current A/c 50200012345678)"},
    {"mode": "Cheque / Other", "account": "General Bank Clearing"}
]

# -------------------------------------------------------------------------
# Pydantic Schemas
# -------------------------------------------------------------------------
class ExpenseCreate(BaseModel):
    expense_date: Optional[str] = None # YYYY-MM-DD
    expense_time: Optional[str] = None # HH:MM
    category: str
    subcategory: str
    amount: float = Field(..., gt=0, description="Expense amount in INR")
    payment_mode: str = "Cash"
    account_name: Optional[str] = "Petty Cash Drawer"
    paid_to: str
    receipt_ref: Optional[str] = None
    approved_by: Optional[str] = "General Manager"
    notes: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: int
    voucher_no: str
    expense_date: str
    expense_time: Optional[str] = None
    category: str
    subcategory: str
    amount: float
    payment_mode: str
    account_name: str
    paid_to: str
    receipt_ref: Optional[str] = None
    approved_by: str
    notes: Optional[str] = None
    created_at: Any

# -------------------------------------------------------------------------
# 1. Categories & Subcategories
# -------------------------------------------------------------------------
@router.get("/categories")
def get_expense_categories():
    """
    Returns available hotel expense categories and their granular subcategories.
    """
    return {
        "categories": EXPENSE_CATEGORIES,
        "payment_modes": PAYMENT_MODES,
        "room_categories": ALL_ROOM_CATEGORIES
    }

# -------------------------------------------------------------------------
# 2. Daily Expenses CRUD
# -------------------------------------------------------------------------
@router.get("/expenses")
def list_expenses(
    date: Optional[str] = Query(None, description="Exact date YYYY-MM-DD"),
    period: Optional[str] = Query(None, description="Month period YYYY-MM"),
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    payment_mode: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List expenditures filtered by date, month, category, or subcategory.
    Includes subcategory totals and grand total.
    """
    query = db.query(EodExpenditure)
    if date:
        query = query.filter(EodExpenditure.expense_date == date)
    elif period:
        query = query.filter(EodExpenditure.expense_date.like(f"{period}%"))
    
    if category and category != "All":
        query = query.filter(EodExpenditure.category == category)
    if subcategory and subcategory != "All":
        query = query.filter(EodExpenditure.subcategory == subcategory)
    if payment_mode and payment_mode != "All":
        query = query.filter(EodExpenditure.payment_mode == payment_mode)

    records = query.order_by(EodExpenditure.expense_date.desc(), EodExpenditure.id.desc()).all()

    # Calculate subcategory totals
    by_subcategory: Dict[str, float] = {}
    by_category: Dict[str, float] = {}
    by_payment_mode: Dict[str, float] = {}
    total_amount = 0.0

    for r in records:
        amt = float(r.amount or 0.0)
        total_amount += amt
        by_subcategory[r.subcategory] = round(by_subcategory.get(r.subcategory, 0.0) + amt, 2)
        by_category[r.category] = round(by_category.get(r.category, 0.0) + amt, 2)
        by_payment_mode[r.payment_mode] = round(by_payment_mode.get(r.payment_mode, 0.0) + amt, 2)

    return {
        "expenses": records,
        "total_amount": round(total_amount, 2),
        "total_count": len(records),
        "by_subcategory": by_subcategory,
        "by_category": by_category,
        "by_payment_mode": by_payment_mode
    }

@router.post("/expenses", status_code=status.HTTP_201_CREATED)
def create_expense(data: ExpenseCreate, db: Session = Depends(get_db)):
    """
    Log a new End-of-Day expenditure with auto-generated sequential voucher.
    """
    exp_date = data.expense_date or datetime.date.today().isoformat()
    exp_time = data.expense_time or datetime.datetime.now().strftime("%H:%M")
    period_prefix = exp_date[:7].replace("-", "")

    # Count existing vouchers this month for sequential numbering
    count_month = db.query(EodExpenditure).filter(EodExpenditure.expense_date.like(f"{exp_date[:7]}%")).count()
    voucher_no = f"EXP-EOD-{period_prefix}-{str(count_month + 1).padStart if hasattr(str(count_month + 1), 'padStart') else str(count_month + 1).zfill(4)}"

    # Default account name if not supplied
    acc_name = data.account_name
    if not acc_name:
        for pm in PAYMENT_MODES:
            if pm["mode"] == data.payment_mode:
                acc_name = pm["account"]
                break
        if not acc_name:
            acc_name = "Petty Cash Drawer"

    record = EodExpenditure(
        expense_date=exp_date,
        expense_time=exp_time,
        voucher_no=voucher_no,
        category=data.category,
        subcategory=data.subcategory,
        amount=round(float(data.amount), 2),
        payment_mode=data.payment_mode,
        account_name=acc_name,
        paid_to=data.paid_to,
        receipt_ref=data.receipt_ref,
        approved_by=data.approved_by or "General Manager",
        notes=data.notes
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.delete("/expenses/{id}", status_code=status.HTTP_200_OK)
def delete_expense(id: int, db: Session = Depends(get_db)):
    """
    Delete or void an expenditure voucher.
    """
    record = db.query(EodExpenditure).filter(EodExpenditure.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Expenditure record not found")
    db.delete(record)
    db.commit()
    return {"message": "Expenditure deleted successfully", "id": id}

# -------------------------------------------------------------------------
# 3. Room-Category Revenue Breakdown
# -------------------------------------------------------------------------
@router.get("/revenue-by-room-category")
def get_revenue_by_room_category(
    date: Optional[str] = Query(None, description="Exact date YYYY-MM-DD"),
    period: Optional[str] = Query(None, description="Month period YYYY-MM"),
    db: Session = Depends(get_db)
):
    """
    Calculates Daily and Monthly revenue segmented across each room category:
    Suite, Deluxe, Classic Studio, Premium, Executive.
    Connects to real checkout records and booking transactions.
    """
    effective_date = date or (datetime.date.today().isoformat() if not period else None)
    effective_period = period or (effective_date[:7] if effective_date else datetime.date.today().strftime("%Y-%m"))

    # 1. Total rooms per category in inventory
    all_rooms = db.query(Room).all()
    rooms_by_cat: Dict[str, int] = {cat: 0 for cat in ALL_ROOM_CATEGORIES}
    standard_tariffs: Dict[str, float] = {
        "Deluxe": 1500.0,
        "Classic Studio": 2000.0,
        "Executive": 2500.0,
        "Premium": 3000.0,
        "Suite": 3500.0
    }

    for r in all_rooms:
        ctype = r.room_type
        if ctype in rooms_by_cat:
            rooms_by_cat[ctype] += 1
        elif "deluxe" in ctype.lower():
            rooms_by_cat["Deluxe"] += 1
        elif "studio" in ctype.lower() or "classic" in ctype.lower():
            rooms_by_cat["Classic Studio"] += 1
        elif "executive" in ctype.lower():
            rooms_by_cat["Executive"] += 1
        elif "premium" in ctype.lower():
            rooms_by_cat["Premium"] += 1
        elif "suite" in ctype.lower():
            rooms_by_cat["Suite"] += 1

    # Ensure all defined categories have room counts
    if rooms_by_cat["Suite"] == 0:
        rooms_by_cat["Suite"] = 2  # Executive/Deluxe VIP Suite config

    # 2. Query Checkouts for date / period
    checkout_q = db.query(CheckoutRecord).filter(CheckoutRecord.is_deleted == False)
    if date:
        checkout_q = checkout_q.filter(CheckoutRecord.check_out_date == date)
    elif period:
        checkout_q = checkout_q.filter(CheckoutRecord.check_out_date.like(f"{period}%"))
    checkouts = checkout_q.all()

    # Aggregate by normalized category
    category_metrics: Dict[str, Dict[str, Any]] = {}
    for cat in ALL_ROOM_CATEGORIES:
        category_metrics[cat] = {
            "room_category": cat,
            "inventory_rooms": rooms_by_cat.get(cat, 0),
            "rooms_sold": 0,
            "total_room_rent": 0.0,
            "food_revenue": 0.0,
            "gst_collected": 0.0,
            "net_revenue": 0.0,
            "standard_tariff": standard_tariffs.get(cat, 2000.0),
            "adr": 0.0,
            "occupancy_pct": 0.0,
            "revenue_share_pct": 0.0
        }

    total_gross_tariff = 0.0
    total_rooms_sold = 0

    for c in checkouts:
        raw_type = c.room_type or ""
        matched_cat = "Classic Studio"
        for candidate in ALL_ROOM_CATEGORIES:
            if candidate.lower() in raw_type.lower():
                matched_cat = candidate
                break
        
        rent = float(c.total_room_rent or 0.0)
        food = float(c.food_amount or 0.0)
        gst = float(c.gst_amount or 0.0)
        net = float(c.net_payable or (rent + food + gst))

        category_metrics[matched_cat]["rooms_sold"] += 1
        category_metrics[matched_cat]["total_room_rent"] += rent
        category_metrics[matched_cat]["food_revenue"] += food
        category_metrics[matched_cat]["gst_collected"] += gst
        category_metrics[matched_cat]["net_revenue"] += net

        total_gross_tariff += rent
        total_rooms_sold += 1

    # Calculate ADR and Shares
    total_net = sum(m["net_revenue"] for m in category_metrics.values())
    for cat, m in category_metrics.items():
        if m["rooms_sold"] > 0:
            m["adr"] = round(m["total_room_rent"] / m["rooms_sold"], 2)
        else:
            m["adr"] = m["standard_tariff"]
        
        inv = m["inventory_rooms"]
        if inv > 0:
            m["occupancy_pct"] = round((m["rooms_sold"] / inv) * 100, 1)
        
        if total_net > 0:
            m["revenue_share_pct"] = round((m["net_revenue"] / total_net) * 100, 1)

    return {
        "period": effective_period,
        "date": effective_date,
        "categories": list(category_metrics.values()),
        "summary": {
            "total_rooms_sold": total_rooms_sold,
            "total_room_rent": round(total_gross_tariff, 2),
            "total_net_revenue": round(total_net, 2),
            "total_inventory": sum(rooms_by_cat.values()),
            "overall_occupancy_pct": round((total_rooms_sold / max(1, sum(rooms_by_cat.values()))) * 100, 1)
        }
    }

# -------------------------------------------------------------------------
# 4. Payment Mode & Bank Account Breakdown
# -------------------------------------------------------------------------
@router.get("/revenue-by-payment-mode")
def get_revenue_by_payment_mode(
    date: Optional[str] = Query(None, description="Exact date YYYY-MM-DD"),
    period: Optional[str] = Query(None, description="Month period YYYY-MM"),
    db: Session = Depends(get_db)
):
    """
    Aggregates collections across all modes and bank accounts:
    Cash, UPI, Debit Card, Credit Card, SBI Bank, HDFC Bank.
    """
    effective_date = date or (datetime.date.today().isoformat() if not period else None)
    effective_period = period or (effective_date[:7] if effective_date else datetime.date.today().strftime("%Y-%m"))

    # Initial mode buckets
    mode_results: Dict[str, Dict[str, Any]] = {
        "Cash": {
            "payment_mode": "Cash",
            "account_name": "Petty Cash Drawer",
            "transaction_count": 0,
            "room_collections": 0.0,
            "food_collections": 0.0,
            "other_collections": 0.0,
            "total_collected": 0.0,
            "share_pct": 0.0
        },
        "UPI": {
            "payment_mode": "UPI",
            "account_name": "Vasudev UPI QR (SBI Merchant)",
            "transaction_count": 0,
            "room_collections": 0.0,
            "food_collections": 0.0,
            "other_collections": 0.0,
            "total_collected": 0.0,
            "share_pct": 0.0
        },
        "Credit Card": {
            "payment_mode": "Credit Card",
            "account_name": "HDFC POS Terminal #1",
            "transaction_count": 0,
            "room_collections": 0.0,
            "food_collections": 0.0,
            "other_collections": 0.0,
            "total_collected": 0.0,
            "share_pct": 0.0
        },
        "Debit Card": {
            "payment_mode": "Debit Card",
            "account_name": "HDFC POS Terminal #2",
            "transaction_count": 0,
            "room_collections": 0.0,
            "food_collections": 0.0,
            "other_collections": 0.0,
            "total_collected": 0.0,
            "share_pct": 0.0
        },
        "Bank Transfer - SBI": {
            "payment_mode": "Bank Transfer - SBI",
            "account_name": "State Bank of India (Current A/c 30987654321)",
            "transaction_count": 0,
            "room_collections": 0.0,
            "food_collections": 0.0,
            "other_collections": 0.0,
            "total_collected": 0.0,
            "share_pct": 0.0
        },
        "Bank Transfer - HDFC": {
            "payment_mode": "Bank Transfer - HDFC",
            "account_name": "HDFC Bank (Current A/c 50200012345678)",
            "transaction_count": 0,
            "room_collections": 0.0,
            "food_collections": 0.0,
            "other_collections": 0.0,
            "total_collected": 0.0,
            "share_pct": 0.0
        }
    }

    # Query checkouts
    cq = db.query(CheckoutRecord).filter(CheckoutRecord.is_deleted == False)
    if date:
        cq = cq.filter(CheckoutRecord.check_out_date == date)
    elif period:
        cq = cq.filter(CheckoutRecord.check_out_date.like(f"{period}%"))
    checkouts = cq.all()

    for c in checkouts:
        pm = (c.payment_mode or "Cash").strip()
        matched_bucket = "Cash"
        if "upi" in pm.lower() or "qr" in pm.lower() or "gpay" in pm.lower():
            matched_bucket = "UPI"
        elif "credit" in pm.lower():
            matched_bucket = "Credit Card"
        elif "debit" in pm.lower() or "card" in pm.lower():
            matched_bucket = "Debit Card"
        elif "sbi" in pm.lower() or "neft" in pm.lower() or "rtgs" in pm.lower():
            matched_bucket = "Bank Transfer - SBI"
        elif "hdfc" in pm.lower():
            matched_bucket = "Bank Transfer - HDFC"

        rent = float(c.total_room_rent or 0.0)
        food = float(c.food_amount or 0.0)
        net = float(c.net_payable or (rent + food))
        other = max(0.0, net - rent - food)

        b = mode_results[matched_bucket]
        b["transaction_count"] += 1
        b["room_collections"] += rent
        b["food_collections"] += food
        b["other_collections"] += other
        b["total_collected"] += net

    # Query Food Bills
    fq = db.query(FoodBill).filter(FoodBill.is_deleted == False)
    if date:
        fq = fq.filter(FoodBill.date == date)
    elif period:
        fq = fq.filter(FoodBill.date.like(f"{period}%"))
    food_bills = fq.all()

    for fb in food_bills:
        st = (fb.settlement_type or "Cash").strip()
        matched_bucket = "Cash"
        if "upi" in st.lower() or "online" in st.lower():
            matched_bucket = "UPI"
        elif "credit" in st.lower():
            matched_bucket = "Credit Card"
        elif "card" in st.lower():
            matched_bucket = "Debit Card"

        amt = float(fb.net_bill_amount or 0.0)
        b = mode_results[matched_bucket]
        b["transaction_count"] += 1
        b["food_collections"] += amt
        b["total_collected"] += amt

    # Calculate percentages
    grand_total = sum(m["total_collected"] for m in mode_results.values())
    for m in mode_results.values():
        m["room_collections"] = round(m["room_collections"], 2)
        m["food_collections"] = round(m["food_collections"], 2)
        m["other_collections"] = round(m["other_collections"], 2)
        m["total_collected"] = round(m["total_collected"], 2)
        if grand_total > 0:
            m["share_pct"] = round((m["total_collected"] / grand_total) * 100, 1)

    return {
        "period": effective_period,
        "date": effective_date,
        "modes": list(mode_results.values()),
        "grand_total": round(grand_total, 2)
    }

# -------------------------------------------------------------------------
# 5. Master EOD Closing Summary
# -------------------------------------------------------------------------
@router.get("/eod-summary")
def get_eod_summary(
    date: Optional[str] = Query(None, description="Exact date YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """
    Returns Master Day-End Executive Balance Summary:
    Opening Cash Float + Cash Inflow - Cash Expenditures = Verified Closing Cash Drawer.
    Digital collections (UPI, Card, Bank) - Digital Outflows = Net Digital Balance.
    """
    target_date = date or datetime.date.today().isoformat()

    # 1. Expenses on target date
    expenses = db.query(EodExpenditure).filter(EodExpenditure.expense_date == target_date).all()
    cash_expenses = sum(float(e.amount or 0.0) for e in expenses if e.payment_mode == "Cash")
    digital_expenses = sum(float(e.amount or 0.0) for e in expenses if e.payment_mode != "Cash")
    total_expenses = cash_expenses + digital_expenses

    by_subcategory: Dict[str, float] = {}
    for e in expenses:
        amt = float(e.amount or 0.0)
        by_subcategory[e.subcategory] = round(by_subcategory.get(e.subcategory, 0.0) + amt, 2)

    # 2. Checkouts on target date
    checkouts = db.query(CheckoutRecord).filter(
        CheckoutRecord.is_deleted == False,
        CheckoutRecord.check_out_date == target_date
    ).all()

    room_rev = sum(float(c.total_room_rent or 0.0) for c in checkouts)
    food_rev = sum(float(c.food_amount or 0.0) for c in checkouts)
    gst_rev = sum(float(c.gst_amount or 0.0) for c in checkouts)
    total_bill = sum(float(c.net_payable or 0.0) for c in checkouts)

    cash_collections = sum(float(c.net_payable or 0.0) for c in checkouts if (c.payment_mode or "").lower() == "cash")
    digital_collections = sum(float(c.net_payable or 0.0) for c in checkouts if (c.payment_mode or "").lower() != "cash")

    # 3. Cash Drawer Balance
    opening_cash_float = 15000.0  # Standard Sri Sai Vasudev Residency front desk float
    closing_cash_drawer = round(opening_cash_float + cash_collections - cash_expenses, 2)
    net_digital_inflow = round(digital_collections - digital_expenses, 2)

    return {
        "business_date": target_date,
        "revenue": {
            "room_revenue": round(room_rev, 2),
            "food_revenue": round(food_rev, 2),
            "gst_collected": round(gst_rev, 2),
            "net_total_billed": round(total_bill, 2)
        },
        "expenditures": {
            "total_expenses": round(total_expenses, 2),
            "cash_expenses": round(cash_expenses, 2),
            "digital_expenses": round(digital_expenses, 2),
            "by_subcategory": by_subcategory,
            "count": len(expenses)
        },
        "cash_drawer_reconciliation": {
            "opening_float": opening_cash_float,
            "cash_inflow": round(cash_collections, 2),
            "cash_outflow": round(cash_expenses, 2),
            "closing_cash_in_drawer": closing_cash_drawer
        },
        "digital_reconciliation": {
            "digital_inflow": round(digital_collections, 2),
            "digital_outflow": round(digital_expenses, 2),
            "net_digital_balance": net_digital_inflow
        }
    }

