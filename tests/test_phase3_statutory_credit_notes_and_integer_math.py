"""
Phase 3 Test Suite: Statutory GST Credit Notes & Integer Math Engine (CGST Act Section 34 & 170)
Validates:
1. Integer-Paise Precision & Largest Remainder Method (zero penny drift).
2. Supervisor / Manager PIN Gate protection for credit note issuance.
3. Statutory Credit Note generation against CheckoutRecord & FoodBill with atomic sequence.
4. General Ledger double-entry reversal (Debit Revenue, Debit Output Tax, Credit Refund).
5. Official GSTN GSTR-1 Table 9B Export (CDNR for registered B2B, CDNUR for unregistered B2C).
6. Table 13 Document Issue Summary Credit Note register.
"""

import uuid
import datetime
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app import models
from app.routes.auth import create_access_token
from app.utils.money import (
    to_paise,
    from_paise,
    allocate_paise,
    compute_gst_paise,
    prorate_discount_paise,
    calculate_section170_roundoff
)
from app.utils.pin import hash_manager_pin

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def auth_headers():
    token = create_access_token(
        data={"sub": "frontdesk_mgr", "role": "MANAGER", "employee_id": "EMP-DESK-001"},
        expires_delta=datetime.timedelta(hours=2)
    )
    return {
        "Authorization": f"Bearer {token}",
        "X-Idempotency-Key": str(uuid.uuid4())
    }


@pytest.fixture(autouse=True)
def reset_manager_pin_to_bootstrap(db):
    """Ensure tests run against clean bootstrap manager PIN state ('1234')."""
    setting = db.query(models.HotelSetting).filter(models.HotelSetting.key == "default").first()
    if setting:
        setting.manager_pin_hash = None
        setting.manager_pin_salt = None
        db.commit()
    yield


# =========================================================================
# 1. INTEGER-PAISE MATH ENGINE TESTS (Largest Remainder Method)
# =========================================================================

def test_integer_paise_conversion_and_precision():
    """Verify conversion between rupees and paise eliminates float rounding errors."""
    assert to_paise(1999.99) == 199999
    assert to_paise("1999.99") == 199999
    assert to_paise(0) == 0
    assert to_paise(None) == 0
    assert from_paise(199999) == 1999.99
    assert from_paise(0) == 0.0


def test_allocate_paise_largest_remainder_zero_drift():
    """
    Test Hare-Niemeyer quota allocation:
    - 100 paise split 3 ways equal weights [1, 1, 1] must equal [34, 33, 33], sum == 100.
    - 15 paise split 2 ways equal weights [1, 1] must equal [8, 7], sum == 15.
    - Guarantee zero-penny / zero-paise drift.
    """
    split_3 = allocate_paise(100, [1, 1, 1])
    assert sum(split_3) == 100
    assert split_3 == [34, 33, 33]

    split_2 = allocate_paise(15, [1, 1])
    assert sum(split_2) == 15
    assert split_2 == [8, 7]

    # Weighted allocation: 1000 paise across [100, 200, 300]
    weighted = allocate_paise(1000, [100, 200, 300])
    assert sum(weighted) == 1000
    assert weighted == [167, 333, 500]


def test_compute_gst_paise_intra_and_interstate():
    """Verify Indian GST calculation in paise with exact 50/50 CGST and SGST split."""
    # ₹3500 Room Tariff @ 12% GST Intra-State
    intra = compute_gst_paise(to_paise(3500.0), gst_rate_pct=12.0, is_interstate=False)
    assert intra["taxable_rupees"] == 3500.0
    assert intra["cgst_rupees"] == 210.0
    assert intra["sgst_rupees"] == 210.0
    assert intra["igst_rupees"] == 0.0
    assert intra["total_tax_rupees"] == 420.0
    assert intra["total_rupees"] == 3920.0
    assert intra["cgst_paise"] + intra["sgst_paise"] == intra["total_tax_paise"]

    # ₹3500 Room Tariff @ 12% GST Inter-State (IGST)
    inter = compute_gst_paise(to_paise(3500.0), gst_rate_pct=12.0, is_interstate=True)
    assert inter["igst_rupees"] == 420.0
    assert inter["cgst_rupees"] == 0.0
    assert inter["sgst_rupees"] == 0.0
    assert inter["total_tax_rupees"] == 420.0


def test_prorate_discount_paise_and_section170():
    """Verify order discount proration and Section 170 round-off."""
    lines = [to_paise(1000), to_paise(2000), to_paise(3000)]
    disc_paise = to_paise(100) # ₹100 discount
    prorated = prorate_discount_paise(lines, disc_paise)
    assert sum(prorated) == disc_paise

    # Section 170 Round-off
    r_down = calculate_section170_roundoff(to_paise(1999.49))
    assert r_down["net_payable_rupees"] == 1999.0
    assert r_down["roundoff_rupees"] == -0.49

    r_up = calculate_section170_roundoff(to_paise(1999.50))
    assert r_up["net_payable_rupees"] == 2000.0
    assert r_up["roundoff_rupees"] == 0.50


# =========================================================================
# 2. CREDIT NOTE ENDPOINT AUTHORIZATION & REJECTION TESTS
# =========================================================================

def test_credit_note_unauthorized_rejection():
    """Issuing a credit note without PIN or Auth token must fail with 401 or 403."""
    res = client.post("/api/v1/pms/credit-notes", json={
        "original_invoice_no": "INV-DUMMY-999",
        "taxable_value": 1000.0,
        "reason_code": "03-Deficiency in Services"
    })
    assert res.status_code in (401, 403)


def test_credit_note_invalid_manager_pin_rejection():
    """Issuing a credit note with incorrect Manager PIN must fail with 401."""
    res = client.post("/api/v1/pms/credit-notes", json={
        "original_invoice_no": "INV-DUMMY-999",
        "taxable_value": 1000.0,
        "reason_code": "03-Deficiency in Services",
        "manager_pin": "9999" # Incorrect PIN
    })
    assert res.status_code == 401
    assert "Invalid Manager PIN" in res.json()["detail"]


# =========================================================================
# 3. STATUTORY CREDIT NOTE ISSUANCE & REVERSAL POSTING TESTS
# =========================================================================

def test_issue_credit_note_against_room_checkout(db, auth_headers):
    """
    Issue statutory credit note against an existing CheckoutRecord:
    - Generates atomic consecutive sequence number (SVR/YYYY-YY/CN-XXXX).
    - Computes 12% GST in integer paise.
    - Posts balanced double-entry reversal to General Ledger.
    """
    # 1. Seed CheckoutRecord
    inv_no = f"INV-TEST-CO-{uuid.uuid4().hex[:6].upper()}"
    today_str = datetime.date.today().isoformat()
    co = models.CheckoutRecord(
        invoice_no=inv_no,
        room_no="205",
        room_type="Deluxe",
        guest_name="Satish Ray",
        guest_phone="9876543210",
        check_in_date=today_str,
        check_out_date=today_str,
        total_room_rent=3000.0,
        gst_percent=12.0,
        cgst_amount=180.0,
        sgst_amount=180.0,
        gst_amount=360.0,
        net_payable=3360.0,
        payment_mode="Cash",
        is_deleted=False,
        is_cancelled=False
    )
    db.add(co)
    db.commit()

    # 2. Issue Credit Note (Deficiency in Service - AC Malfunction ₹1,000 refund)
    res = client.post(
        "/api/v1/pms/credit-notes",
        headers=auth_headers,
        json={
            "original_invoice_no": inv_no,
            "taxable_value": 1000.0,
            "reason_code": "03-Deficiency in Services",
            "reason_description": "AC cooling failure during overnight stay",
            "refund_payment_mode": "Cash",
            "manager_pin": "1234" # Bootstrap PIN
        }
    )
    assert res.status_code == 201
    data = res.json()

    assert "CN-" in data["credit_note_no"]
    assert data["original_invoice_no"] == inv_no
    assert data["taxable_value"] == 1000.0
    assert data["gst_rate"] == 12.0
    assert data["cgst_amount"] == 60.0
    assert data["sgst_amount"] == 60.0
    assert data["total_credit_amount"] == 1120.0
    assert data["guest_name"] == "Satish Ray"
    assert data["status"] == "ISSUED"

    # 3. Verify General Ledger Double-Entry Reversal Entries
    jvs = db.query(models.JournalEntry).filter(
        models.JournalEntry.reference_no == data["credit_note_no"]
    ).all()
    assert len(jvs) >= 2 # Revenue reversal + CGST/SGST reversal
    tot_dr = sum(j.amount_rupees for j in jvs)
    assert round(tot_dr, 2) == 1120.0


def test_issue_credit_note_against_food_bill(db, auth_headers):
    """
    Issue statutory credit note against a Restaurant FoodBill (5% GST):
    - Computes 2.5% CGST and 2.5% SGST.
    - Posts reversing entry to Restaurant Food Sales.
    """
    bill_no = f"FB-TEST-{uuid.uuid4().hex[:6].upper()}"
    today_str = datetime.date.today().isoformat()
    fb = models.FoodBill(
        bill_no=bill_no,
        date=today_str,
        time="14:00",
        table_no="T-12",
        guest_name="Pooja Sharma",
        taxable_amount=600.0,
        cgst_amount=15.0,
        sgst_amount=15.0,
        net_bill_amount=630.0,
        settlement_type="UPI",
        is_deleted=False
    )
    db.add(fb)
    db.commit()

    res = client.post(
        "/api/v1/pms/credit-notes",
        headers=auth_headers,
        json={
            "original_invoice_no": bill_no,
            "taxable_value": 400.0,
            "reason_code": "01-Sales Return",
            "reason_description": "Dish returned due to spice level",
            "refund_payment_mode": "Bank Transfer",
            "manager_pin": "1234"
        }
    )
    assert res.status_code == 201
    data = res.json()

    assert data["original_invoice_no"] == bill_no
    assert data["taxable_value"] == 400.0
    assert data["gst_rate"] == 5.0
    assert data["cgst_amount"] == 10.0
    assert data["sgst_amount"] == 10.0
    assert data["total_credit_amount"] == 420.0
    assert data["invoice_type"] == "RESTAURANT_FOOD"


# =========================================================================
# 4. GSTR-1 OFFICIAL RETURN TABLE 9B & 13 EXPORT INTEGRATION
# =========================================================================

def test_gstr1_table_9b_and_13_credit_notes_export(db, auth_headers):
    """
    Validates GSTN GSTR-1 offline export payload includes Table 9B and Table 13:
    - CDNR (Registered counter-party credit notes with customer GSTIN).
    - CDNUR (Unregistered counter-party credit notes).
    - Table 13 Document Issue Summary records Credit Note serial range.
    """
    period = "2026-11"
    today_str = f"{period}-15"

    # 1. Seed B2B Credit Note (Registered customer)
    b2b_cn_no = f"SVR/{period}/CN-B2B-{uuid.uuid4().hex[:6].upper()}"
    b2b_cn = models.CreditNote(
        credit_note_no=b2b_cn_no,
        credit_note_date=today_str,
        financial_year="2026-27",
        original_invoice_no="INV-CORP-001",
        original_invoice_date=f"{period}-10",
        guest_name="Tata Steel Ltd",
        customer_gstin="21AAACT2727Q1ZW",
        pos_state_code="21",
        is_interstate=False,
        reason_code="02-Post Sale Discount",
        taxable_value_paise=200000,
        taxable_value=2000.0,
        gst_rate=12.0,
        cgst_amount_paise=12000,
        cgst_amount=120.0,
        sgst_amount_paise=12000,
        sgst_amount=120.0,
        igst_amount_paise=0,
        igst_amount=0.0,
        total_credit_paise=224000,
        total_credit_amount=2240.0,
        refund_payment_mode="Bank Transfer",
        status="ISSUED"
    )
    db.add(b2b_cn)

    # 2. Seed B2C Credit Note (Unregistered customer)
    b2c_cn_no = f"SVR/{period}/CN-B2C-{uuid.uuid4().hex[:6].upper()}"
    b2c_cn = models.CreditNote(
        credit_note_no=b2c_cn_no,
        credit_note_date=today_str,
        financial_year="2026-27",
        original_invoice_no="INV-RETAIL-002",
        original_invoice_date=f"{period}-12",
        guest_name="Alok Mohanty",
        customer_gstin=None,
        pos_state_code="21",
        is_interstate=False,
        reason_code="03-Deficiency in Services",
        taxable_value_paise=50000,
        taxable_value=500.0,
        gst_rate=12.0,
        cgst_amount_paise=3000,
        cgst_amount=30.0,
        sgst_amount_paise=3000,
        sgst_amount=30.0,
        igst_amount_paise=0,
        igst_amount=0.0,
        total_credit_paise=56000,
        total_credit_amount=560.0,
        refund_payment_mode="Cash",
        status="ISSUED"
    )
    db.add(b2c_cn)
    db.commit()

    # Query GSTR-1 API
    res = client.get(f"/api/v1/accounting/gst/gstr-1?period={period}", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()

    # Table 9B CDNR (Registered)
    assert "cdnr" in data
    tata_entry = next((c for c in data["cdnr"] if c["ctin"] == "21AAACT2727Q1ZW"), None)
    assert tata_entry is not None
    tata_note = next((nt for nt in tata_entry["nt"] if nt["nt_num"] == b2b_cn_no), None)
    assert tata_note is not None
    assert tata_note["val"] == 2240.0

    # Table 9B CDNUR (Unregistered)
    assert "cdnur" in data
    b2c_entry = next((c for c in data["cdnur"] if c["nt_num"] == b2c_cn_no), None)
    assert b2c_entry is not None
    assert b2c_entry["val"] == 560.0

    # Table 13 Document Issue Summary
    assert "doc_issue" in data
    cn_doc = next((d for d in data["doc_issue"]["doc_det"] if d["doc_typ"] == "Credit Note"), None)
    assert cn_doc is not None
    assert cn_doc["totnum"] >= 2


def test_credit_note_query_and_next_sequence_endpoints(auth_headers):
    """Test GET /credit-notes, GET /credit-notes/{id}, and GET /credit-notes/next-number."""
    # Preview next number
    res_next = client.get("/api/v1/pms/credit-notes/next-number")
    assert res_next.status_code == 200
    next_info = res_next.json()
    assert "nextNumber" in next_info
    assert "SVR/" in next_info["nextNumber"]

    # List credit notes
    res_list = client.get("/api/v1/pms/credit-notes?limit=10", headers=auth_headers)
    assert res_list.status_code == 200
    cns = res_list.json()
    assert isinstance(cns, list)
    if len(cns) > 0:
        first_cn = cns[0]["credit_note_no"]
        res_single = client.get(f"/api/v1/pms/credit-notes/{first_cn}", headers=auth_headers)
        assert res_single.status_code == 200
        assert res_single.json()["credit_note_no"] == first_cn
