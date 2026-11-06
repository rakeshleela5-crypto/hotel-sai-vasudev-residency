"""
Module 6: Chartered Accountant (CA) Monthly Accounting & GST JSON Export
FastAPI router providing comprehensive, standardized JSON compilation of:
1. Room accommodation invoices (SAC 996311 - B2B with GSTIN & B2C guest folios)
2. Vasudev Rasoi restaurant & room service food bills (SAC 996331 - 5% GST)
3. Output GST liability split (CGST, SGST, IGST) by HSN/SAC code
4. Payment mode collections (Cash, UPI, Credit Card, Debit Card, Bank Transfer)
5. EOD daily expenditures & subcategories (Module 2)
6. Staff monthly payroll & advance deductions (Module 1 & 5)
7. Tally / GSTR-1 offline tool compatible format for single-click export.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import json

from app.database import get_db
from app.models import (
    CheckoutRecord, 
    FoodBill, 
    EodExpenditure, 
    StaffMonthlyPayroll, 
    HotelCompanyInfo,
    PettyExpense,
    now_utc
)

router = APIRouter()

def get_hotel_meta(db: Session) -> Dict[str, Any]:
    """Retrieve or provide default hotel legal & tax credentials for Rayagada property."""
    comp = db.query(HotelCompanyInfo).first()
    gstin = comp.gstin if comp and comp.gstin else "21AEKPP8689J1ZS"
    state_code = gstin[:2] if len(gstin) >= 2 and gstin[:2].isdigit() else "21"

    return {
        "hotel_name": comp.property_name if comp and comp.property_name else "SRI SAI VASUDEV RESIDENCY",
        "trade_name": "Hotel Sai Vasudev Residency",
        "legal_name": comp.legal_name if comp and comp.legal_name else "PAIDISETTY MANMADHA RAO",
        "gstin": gstin,
        "pan": comp.pan_number if comp and comp.pan_number else "AEKPP8689J",
        "address": comp.address if comp and comp.address else "Near Overbridge, Main Road, Rayagada, Odisha 765001",
        "city": comp.city if comp and comp.city else "Rayagada",
        "state": comp.state if comp and comp.state else "Odisha",
        "state_code": state_code,
        "pin_code": comp.pincode if comp and comp.pincode else "765001",
        "phone": comp.phone if comp and comp.phone else "+91 9440289999",
        "email": comp.email if comp and comp.email else "saivasudevresidency@gmail.com",
        "bank_name": comp.bank_name if comp and comp.bank_name else "State Bank of India",
        "bank_account_no": comp.bank_account_no if comp and comp.bank_account_no else "38920192831",
        "bank_ifsc": comp.bank_ifsc if comp and comp.bank_ifsc else "SBIN0000390",
        "jurisdiction": comp.jurisdiction if comp and comp.jurisdiction else "Rayagada Circle, Odisha"
    }

def normalize_period(period: Any = None, year: Any = None, month: Any = None) -> str:
    """Normalize input into YYYY-MM format."""
    now = datetime.now()
    clean_year = year if isinstance(year, int) else None
    clean_month = month if isinstance(month, int) else None
    clean_period = period if isinstance(period, str) else None

    if clean_year and clean_month:
        return f"{clean_year:04d}-{clean_month:02d}"
    if clean_period:
        p = clean_period.strip()
        # Handle MMYYYY format (e.g. "112026")
        if len(p) == 6 and p.isdigit():
            m = p[:2]
            y = p[2:]
            return f"{y}-{m}"
        # Handle YYYY-MM
        if len(p) == 7 and p[4] == '-':
            return p
    return f"{now.year:04d}-{now.month:02d}"

def calculate_financial_year(period_str: str) -> str:
    """Calculate Indian Financial Year (e.g. 2026-11 -> FY 2026-27)."""
    try:
        y, m = [int(x) for x in period_str.split('-')]
        if m >= 4:
            return f"{y}-{str(y+1)[2:]}"
        else:
            return f"{y-1}-{str(y)[2:]}"
    except Exception:
        return "2026-27"

@router.get("/ca-export")
def get_ca_monthly_export(
    period: Optional[str] = Query(None, description="Accounting period e.g. '2026-11' or '112026'"),
    year: Optional[int] = Query(None, description="Calendar year e.g. 2026"),
    month: Optional[int] = Query(None, description="Month number 1-12"),
    db: Session = Depends(get_db)
):
    """
    Compile complete, standardized End-of-Month Chartered Accountant (CA) JSON payload.
    Pulls live checkout records, food bills, tax slabs, payment splits, EOD expenditures,
    and staff payroll into an auditable GSTR/Tally-ready structure.
    """
    period_str = normalize_period(period, year, month)
    fy_str = calculate_financial_year(period_str)
    hotel_meta = get_hotel_meta(db)

    # 1. Fetch Room Invoices (CheckoutRecords) for period
    checkouts = db.query(CheckoutRecord).filter(
        CheckoutRecord.check_out_date.like(f"{period_str}%"),
        CheckoutRecord.is_deleted == False,
        CheckoutRecord.is_cancelled == False
    ).order_by(CheckoutRecord.check_out_date.asc(), CheckoutRecord.invoice_no.asc()).all()

    # 2. Fetch Restaurant Food Bills (FoodBill) for period
    food_bills = db.query(FoodBill).filter(
        FoodBill.date.like(f"{period_str}%"),
        FoodBill.is_deleted == False
    ).order_by(FoodBill.date.asc(), FoodBill.bill_no.asc()).all()

    # 3. Fetch EOD Daily Expenditures (EodExpenditure) for period
    eod_expenses = db.query(EodExpenditure).filter(
        EodExpenditure.expense_date.like(f"{period_str}%")
    ).order_by(EodExpenditure.expense_date.asc(), EodExpenditure.voucher_no.asc()).all()

    # 4. Fetch Staff Payroll for period
    payroll_records = db.query(StaffMonthlyPayroll).filter(
        StaffMonthlyPayroll.payroll_period == period_str
    ).order_by(StaffMonthlyPayroll.staff_id.asc()).all()

    # Data structures for compilation
    b2b_invoices: List[Dict[str, Any]] = []
    b2c_invoices: List[Dict[str, Any]] = []
    restaurant_bills: List[Dict[str, Any]] = []
    expenditure_records: List[Dict[str, Any]] = []
    payroll_summary_list: List[Dict[str, Any]] = []

    # Aggregators
    total_room_taxable = 0.0
    total_room_cgst = 0.0
    total_room_sgst = 0.0
    total_room_igst = 0.0
    total_room_gross = 0.0

    total_food_taxable = 0.0
    total_food_cgst = 0.0
    total_food_sgst = 0.0
    total_food_gross = 0.0

    payment_modes_tally: Dict[str, float] = {
        "Cash": 0.0,
        "UPI": 0.0,
        "Card": 0.0,
        "Bank Transfer": 0.0,
        "Room Settlement": 0.0
    }

    # Process Room Checkouts
    for co in checkouts:
        rent = float(co.total_room_rent or co.per_day_tariff or 0.0)
        gst_pct = float(co.gst_percent or (18.0 if rent > 7500 else 12.0))
        gst_amt = float(co.gst_amount or (rent * gst_pct / 100.0))
        cgst_amt = float(co.cgst_amount or (gst_amt / 2.0))
        sgst_amt = float(co.sgst_amount or (gst_amt / 2.0))
        igst_amt = 0.0 # Standard intra-state hospitality in Odisha
        gross = float(co.bill_amount or co.net_payable or (rent + gst_amt))

        total_room_taxable += rent
        total_room_cgst += cgst_amt
        total_room_sgst += sgst_amt
        total_room_gross += gross

        # Track payment mode
        mode = co.payment_mode or "Cash"
        clean_mode = "Cash" if "cash" in mode.lower() else "UPI" if "upi" in mode.lower() else "Card" if ("card" in mode.lower() or "edc" in mode.lower()) else "Bank Transfer"
        payment_modes_tally[clean_mode] = payment_modes_tally.get(clean_mode, 0.0) + gross

        # Customer GSTIN extraction (B2B detection)
        cust_gstin = getattr(co, 'gst_number', None) or getattr(co, 'customer_gstin', None)
        has_b2b = bool(cust_gstin and len(str(cust_gstin).strip()) >= 15)

        inv_record = {
            "invoice_no": co.invoice_no,
            "invoice_date": co.check_out_date,
            "check_in_date": co.check_in_date,
            "room_no": co.room_no,
            "room_category": co.room_type or "Deluxe",
            "nights": co.number_of_days or 1,
            "daily_tariff": float(co.per_day_tariff or 0.0),
            "guest_name": co.guest_name,
            "guest_phone": co.guest_phone,
            "city": co.city or "Rayagada",
            "state": co.state or "Odisha",
            "pos_state_code": hotel_meta["state_code"],
            "supply_type": "INTRA",
            "sac_code": co.sac_code or "996311",
            "sac_description": "Room Accommodation Services",
            "taxable_value": round(rent, 2),
            "gst_rate_pct": gst_pct,
            "cgst_rate_pct": round(gst_pct / 2.0, 2),
            "cgst_amount": round(cgst_amt, 2),
            "sgst_rate_pct": round(gst_pct / 2.0, 2),
            "sgst_amount": round(sgst_amt, 2),
            "igst_rate_pct": 0.0,
            "igst_amount": round(igst_amt, 2),
            "total_invoice_value": round(gross, 2),
            "payment_mode": co.payment_mode or "Cash",
            "invoice_category": "B2B" if has_b2b else "B2C"
        }

        if has_b2b:
            inv_record["customer_gstin"] = str(cust_gstin).strip().upper()
            inv_record["customer_firm_name"] = getattr(co, 'company_name', None) or co.guest_name
            b2b_invoices.append(inv_record)
        else:
            b2c_invoices.append(inv_record)

    # Process Food Bills
    for fb in food_bills:
        taxable = float(fb.taxable_amount or (fb.net_bill_amount / 1.05 if fb.net_bill_amount else 0.0))
        cgst_amt = float(fb.cgst_amount or (taxable * 0.025))
        sgst_amt = float(fb.sgst_amount or (taxable * 0.025))
        gross = float(fb.net_bill_amount or (taxable + cgst_amt + sgst_amt))

        total_food_taxable += taxable
        total_food_cgst += cgst_amt
        total_food_sgst += sgst_amt
        total_food_gross += gross

        # Track settlement mode
        st = fb.settlement_type or "Cash"
        if "room" in st.lower():
            payment_modes_tally["Room Settlement"] = payment_modes_tally.get("Room Settlement", 0.0) + gross
        elif "upi" in st.lower():
            payment_modes_tally["UPI"] = payment_modes_tally.get("UPI", 0.0) + gross
        elif "card" in st.lower():
            payment_modes_tally["Card"] = payment_modes_tally.get("Card", 0.0) + gross
        else:
            payment_modes_tally["Cash"] = payment_modes_tally.get("Cash", 0.0) + gross

        restaurant_bills.append({
            "bill_no": fb.bill_no,
            "bill_date": fb.date,
            "bill_time": fb.time,
            "room_or_table_no": fb.room_no or fb.table_no or "Counter Takeaway",
            "guest_name": fb.guest_name or "Walk-in Guest",
            "outlet": "Vasudev Rasoi F&B",
            "sac_code": "996331",
            "sac_description": "Restaurant & Room Service Food Bills",
            "taxable_value": round(taxable, 2),
            "gst_rate_pct": 5.0,
            "cgst_rate_pct": 2.5,
            "cgst_amount": round(cgst_amt, 2),
            "sgst_rate_pct": 2.5,
            "sgst_amount": round(sgst_amt, 2),
            "discount_amount": round(float(fb.discount_amount or 0.0), 2),
            "net_bill_amount": round(gross, 2),
            "settlement_type": fb.settlement_type or "Cash",
            "billed_by": fb.billed_by or "Cashier"
        })

    # Process EOD Expenditures
    total_expenditure_val = 0.0
    for exp in eod_expenses:
        amt = float(exp.amount or 0.0)
        total_expenditure_val += amt
        expenditure_records.append({
            "voucher_no": exp.voucher_no,
            "date": exp.expense_date,
            "time": exp.expense_time,
            "category": exp.category,
            "subcategory": exp.subcategory,
            "amount": round(amt, 2),
            "payment_mode": exp.payment_mode,
            "account_name": exp.account_name,
            "paid_to": exp.paid_to,
            "receipt_ref": exp.receipt_ref,
            "approved_by": exp.approved_by,
            "notes": exp.notes
        })

    # Process Staff Payroll
    total_payroll_base = 0.0
    total_payroll_advances = 0.0
    total_payroll_net_payout = 0.0
    for pr in payroll_records:
        base_sal = float(pr.monthly_base_salary or 0.0)
        adv_ded = float(pr.total_advance_deducted or 0.0)
        net_sal = float(pr.net_payable_salary or (base_sal - adv_ded))

        total_payroll_base += base_sal
        total_payroll_advances += adv_ded
        total_payroll_net_payout += net_sal

        payroll_summary_list.append({
            "staff_id": pr.staff_id,
            "staff_code": getattr(pr, 'staff_code', None) or f"SVR-STF-{pr.staff_id:03d}",
            "staff_name": pr.staff_name,
            "role": pr.role,
            "department": pr.department,
            "monthly_base_salary": round(base_sal, 2),
            "total_advance_deducted": round(adv_ded, 2),
            "net_payable_salary": round(net_sal, 2),
            "payout_status": pr.payout_status or "Pending",
            "payment_mode": pr.payment_mode or "Bank Transfer",
            "payment_reference": pr.payment_reference
        })

    # Grand Totals
    grand_taxable = total_room_taxable + total_food_taxable
    grand_cgst = total_room_cgst + total_food_cgst
    grand_sgst = total_room_sgst + total_food_sgst
    grand_igst = total_room_igst
    grand_total_tax = grand_cgst + grand_sgst + grand_igst
    grand_invoice_val = total_room_gross + total_food_gross

    # Net Operating P&L (Total Revenue minus Total Operating Expenses and Staff Payroll)
    net_operating_profit = grand_invoice_val - (total_expenditure_val + total_payroll_net_payout)

    # Tax Slabs Summary (HSN/SAC Breakdown)
    tax_slabs_summary = [
        {
            "sac_code": "996311",
            "description": "Room Accommodation Services (Tariff <= ₹7,500)",
            "gst_rate_pct": 12.0,
            "cgst_rate_pct": 6.0,
            "sgst_rate_pct": 6.0,
            "taxable_value": round(total_room_taxable, 2),
            "cgst_amount": round(total_room_cgst, 2),
            "sgst_amount": round(total_room_sgst, 2),
            "igst_amount": round(total_room_igst, 2),
            "total_tax_amount": round(total_room_cgst + total_room_sgst + total_room_igst, 2),
            "gross_amount": round(total_room_gross, 2),
            "invoices_count": len(checkouts)
        },
        {
            "sac_code": "996331",
            "description": "Restaurant & Room Service Food Bills (Vasudev Rasoi)",
            "gst_rate_pct": 5.0,
            "cgst_rate_pct": 2.5,
            "sgst_rate_pct": 2.5,
            "taxable_value": round(total_food_taxable, 2),
            "cgst_amount": round(total_food_cgst, 2),
            "sgst_amount": round(total_food_sgst, 2),
            "igst_amount": 0.0,
            "total_tax_amount": round(total_food_cgst + total_food_sgst, 2),
            "gross_amount": round(total_food_gross, 2),
            "invoices_count": len(food_bills)
        }
    ]

    return {
        "status": "success",
        "export_metadata": {
            "format": "CA_GST_ACCOUNTING_JSON_V1",
            "standard": "Indian GSTR-1 / Tally ERP 9 / TallyPrime XML Compatible",
            "period": period_str,
            "financial_year": fy_str,
            "export_timestamp": datetime.now(timezone.utc).isoformat(),
            "hotel": hotel_meta
        },
        "preview_summary": {
            "total_invoices_count": len(checkouts) + len(food_bills),
            "room_invoices_count": len(checkouts),
            "restaurant_bills_count": len(food_bills),
            "b2b_invoices_count": len(b2b_invoices),
            "b2c_invoices_count": len(b2c_invoices),
            "total_taxable_value": round(grand_taxable, 2),
            "total_cgst": round(grand_cgst, 2),
            "total_sgst": round(grand_sgst, 2),
            "total_igst": round(grand_igst, 2),
            "total_tax": round(grand_total_tax, 2),
            "total_invoice_value": round(grand_invoice_val, 2),
            "total_operating_expenditures": round(total_expenditure_val, 2),
            "total_staff_payroll": round(total_payroll_net_payout, 2),
            "net_monthly_operating_profit": round(net_operating_profit, 2)
        },
        "payment_modes_summary": {
            k: round(v, 2) for k, v in payment_modes_tally.items()
        },
        "tax_slabs_summary": tax_slabs_summary,
        "b2b_invoices": b2b_invoices,
        "b2c_invoices": b2c_invoices,
        "restaurant_food_bills": restaurant_bills,
        "daily_expenditures": expenditure_records,
        "staff_payroll": payroll_summary_list
    }

@router.get("/ca-export/download")
def download_ca_monthly_export_file(
    period: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Serve formatted JSON file directly as attachment download for CA."""
    payload = get_ca_monthly_export(period=period, year=year, month=month, db=db)
    period_str = payload["export_metadata"]["period"]
    gstin = payload["export_metadata"]["hotel"]["gstin"]
    filename = f"CA_EXPORT_SAI_VASUDEV_{gstin}_{period_str}.json"

    json_str = json.dumps(payload, indent=2)
    return Response(
        content=json_str,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@router.get("/ca-export/available-periods")
def get_available_export_periods(db: Session = Depends(get_db)):
    """Return list of distinct monthly periods with active billing or transactions."""
    periods = set()
    now_p = datetime.now().strftime("%Y-%m")
    periods.add(now_p)

    # Checkouts
    co_rows = db.query(CheckoutRecord.check_out_date).filter(CheckoutRecord.is_deleted == False).distinct().all()
    for (d,) in co_rows:
        if d and len(d) >= 7 and d[4] == '-':
            periods.add(d[:7])

    # Food Bills
    fb_rows = db.query(FoodBill.date).filter(FoodBill.is_deleted == False).distinct().all()
    for (d,) in fb_rows:
        if d and len(d) >= 7 and d[4] == '-':
            periods.add(d[:7])

    # Expenditures
    exp_rows = db.query(EodExpenditure.expense_date).distinct().all()
    for (d,) in exp_rows:
        if d and len(d) >= 7 and d[4] == '-':
            periods.add(d[:7])

    sorted_periods = sorted(list(periods), reverse=True)
    return {
        "status": "success",
        "current_period": now_p,
        "periods": sorted_periods
    }
