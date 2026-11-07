"""
Track 7 Test Suite: Statutory Indian GST Returns & Rayagada Police Form C Guest Logging
Boutique Hotel ERP Compliance Benchmark:
  1. Domestic Guest Police Registration & PII Masking (Aadhaar / Passport privacy).
  2. Bureau of Immigration (BOI) Mandatory Foreign National Form C Validation (HTTP 422 rejection on missing fields).
  3. Form C Export Generation under the Registration of Foreigners Act 1939.
  4. Official GSTN GSTR-1 JSON Return Engine (Dual SAC 996311 @ 12% & SAC 996331 @ 5%, B2B/B2CS/HSN Table 12).
  5. Official GSTR-3B Monthly Return Aggregation & Section 170 CGST Act integer rupee rounding.
"""

import uuid
import datetime
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app import models
from app.routes.auth import create_access_token

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


def seed_room_and_booking(db, room_num=None):
    r_suffix = uuid.uuid4().hex[:6].upper()
    r_name = f"Room 70-{r_suffix}"
    room = models.Room(
        name=r_name,
        slug=f"room-70-{r_suffix.lower()}",
        room_type="Deluxe",
        price_per_night=3500.0,
        capacity=2,
        total_inventory=1,
        description="Executive Deluxe AC Room",
        image_url="/assets/rooms/deluxe.jpg"
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    b_ref = f"BK-TRK7-{uuid.uuid4().hex[:6].upper()}"
    today_str = datetime.date.today().isoformat()
    booking = models.Booking(
        booking_ref=b_ref,
        room_id=room.id,
        guest_name="Subhashish Patnaik",
        guest_email="patnaik@example.com",
        guest_phone="9876543210",
        check_in_date=today_str,
        check_out_date=(datetime.date.today() + datetime.timedelta(days=2)).isoformat(),
        status="Checked-In",
        total_price=7000.0,
        base_amount=6250.0,
        cgst_amount=375.0,
        sgst_amount=375.0,
        total_paid=7000.0,
        balance_due=0.0,
        payment_method="Cash",
        payment_status="Paid"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return room, booking


# =================================================================================================
# TEST 1: Domestic Guest Registration & District SP Office Manifest PII Masking
# =================================================================================================
def test_police_station_record_domestic_guest_and_pii_masking(db, auth_headers):
    """
    Verifies that domestic guests are registered with proper details and that
    the District SP Office daily manifest masks Aadhaar numbers (XXXX-XXXX-1234)
    to protect guest PII while preserving legal inspection standards.
    """
    room, booking = seed_room_and_booking(db, "702")

    payload = {
        "booking_ref": booking.booking_ref,
        "guest_name": "Ramesh Chandra Das",
        "age": 42,
        "gender": "Male",
        "nationality": "Indian",
        "id_proof_type": "Aadhaar Card",
        "id_proof_number": "542389104512",
        "permanent_address": "Plot 142, Saheed Nagar, Bhubaneswar, Odisha",
        "origin_city": "Bhubaneswar",
        "next_destination": "Koraput",
        "purpose_of_visit": "Maa Majhighariani Temple Pilgrimage",
        "vehicle_number": "OD-02-AK-9988",
        "is_foreign_national": False
    }

    res = client.post("/api/v1/pms/police-register", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["guest_name"] == "Ramesh Chandra Das"
    assert data["nationality"] == "Indian"

    # Query Daily Manifest for Rayagada Police
    manifest_res = client.get("/api/v1/pms/police-register/daily-manifest", headers=auth_headers)
    assert manifest_res.status_code == 200
    manifest = manifest_res.json()
    assert manifest["status"] == "success"
    assert "Rayagada Town Police Station" in manifest["authority"]
    assert manifest["total_guests_recorded"] >= 1
    assert manifest["domestic_guests_count"] >= 1

    # Locate the newly added record in manifest
    rec = next((r for r in manifest["records"] if r["booking_ref"] == booking.booking_ref), None)
    assert rec is not None
    assert rec["id_proof_type"] == "Aadhaar Card"
    # Ensure Aadhaar is masked: XXXX-XXXX-4512
    assert rec["masked_id_number"] == "XXXX-XXXX-4512"
    assert rec["is_foreign_national"] is False
    assert rec["purpose_of_visit"] == "Maa Majhighariani Temple Pilgrimage"


# =================================================================================================
# TEST 2: Foreign National Statutory Form C Mandatory Validation
# =================================================================================================
def test_police_station_record_foreign_national_mandatory_form_c_validation(db, auth_headers):
    """
    Verifies that under the Registration of Foreigners Act 1939 and Indian Bureau of Immigration (BOI),
    any international guest registration missing mandatory statutory fields
    (passport, visa, visa validity, arrival port, or entry date) is STRICTLY REJECTED with HTTP 422.
    """
    room, booking = seed_room_and_booking(db, "703")

    # Incomplete Foreign Guest (Missing passport, visa, port of arrival, etc.)
    incomplete_payload = {
        "booking_ref": booking.booking_ref,
        "guest_name": "John Doe Miller",
        "age": 36,
        "gender": "Male",
        "nationality": "United States",
        "id_proof_type": "Passport",
        "id_proof_number": "US99182736",
        "permanent_address": "450 Sutter St, San Francisco, CA 94108, USA",
        "origin_city": "New York",
        "next_destination": "Visakhapatnam",
        "purpose_of_visit": "Business / Bauxite Mining Consultancy",
        "is_foreign_national": True
        # Missing: passport_number, visa_number, visa_validity, port_of_arrival, date_of_entry_india
    }

    res_fail = client.post("/api/v1/pms/police-register", json=incomplete_payload, headers=auth_headers)
    assert res_fail.status_code == 422
    err_msg = res_fail.json()["detail"]
    assert "Foreign National Form C compliance failure" in err_msg
    assert "passport_number" in err_msg
    assert "visa_number" in err_msg
    assert "port_of_arrival" in err_msg


# =================================================================================================
# TEST 3: Foreign National Form C Registration & Bureau of Immigration Export
# =================================================================================================
def test_police_station_foreign_national_form_c_export_and_compliance(db, auth_headers):
    """
    Verifies full statutory compliance for international guests:
    1. Complete registration accepted with HTTP 200.
    2. Exportable Bureau of Immigration Form C register format (/police-register/form-c).
    """
    room, booking = seed_room_and_booking(db, "704")

    complete_payload = {
        "booking_ref": booking.booking_ref,
        "guest_name": "Claire Elizabeth Dubois",
        "age": 31,
        "gender": "Female",
        "nationality": "French",
        "id_proof_type": "Passport",
        "id_proof_number": "FRA198827365",
        "permanent_address": "12 Rue de Rivoli, 75001 Paris, France",
        "origin_city": "Paris",
        "next_destination": "Puri",
        "purpose_of_visit": "Tribal Art & Textile Documentation",
        "vehicle_number": "OD-18-B-4411",
        "is_foreign_national": True,
        "passport_number": "FRA198827365",
        "visa_number": "IND-EV-9821049",
        "visa_validity": "2027-05-15",
        "port_of_arrival": "Indira Gandhi International Airport, New Delhi (DEL)",
        "date_of_entry_india": "2026-11-01"
    }

    res_ok = client.post("/api/v1/pms/police-register", json=complete_payload, headers=auth_headers)
    assert res_ok.status_code == 200
    data = res_ok.json()
    assert data["is_foreign_national"] is True
    assert data["passport_number"] == "FRA198827365"

    # Query BOI Form C Register
    form_c_res = client.get("/api/v1/pms/police-register/form-c", headers=auth_headers)
    assert form_c_res.status_code == 200
    form_c_data = form_c_res.json()
    assert form_c_data["status"] == "success"
    assert form_c_data["form_c_total"] >= 1
    assert "Sri Sai Vasudev Residency" in form_c_data["hotel_name"]

    # Verify guest entry inside foreign_nationals
    guest_c = next((g for g in form_c_data["foreign_nationals"] if g["passport_number"] == "FRA198827365"), None)
    assert guest_c is not None
    assert guest_c["guest_name"] == "Claire Elizabeth Dubois"
    assert guest_c["nationality"] == "French"
    assert guest_c["visa_number"] == "IND-EV-9821049"
    assert guest_c["compliance_status"] == "VERIFIED_FORM_C_COMPLIANT"


# =================================================================================================
# TEST 4: Official Statutory Dual GST Returns Engine (GSTR-1 Offline Schema)
# =================================================================================================
def test_statutory_dual_gst_gstr1_returns_engine(db, auth_headers):
    """
    Validates official GSTN GSTR-1 offline tool JSON export:
    - B2B Invoices (Table 4) with corporate GSTIN and legal firm name.
    - B2CS Small Invoices (Table 7) categorized into 12% Rooms and 5% F&B.
    - HSN Summary (Table 12) mapping SAC 996311 (Lodging 12%) & SAC 996331 (F&B 5%).
    - Document Issue Summary (Table 13).
    """
    period = "2026-11"

    # 1. Seed B2B Corporate Room Checkout
    b2b_checkout = models.CheckoutRecord(
        invoice_no=f"INV-B2B-{uuid.uuid4().hex[:6].upper()}",
        room_no="301",
        room_type="Suite",
        guest_name="Utkal Alumina Int.",
        company_name="Utkal Alumina International Ltd",
        customer_gstin="21AAACU1234A1Z5",
        check_in_date=f"{period}-05",
        check_out_date=f"{period}-08",
        total_room_rent=12000.0,
        cgst_amount=720.0,  # 6%
        sgst_amount=720.0,  # 6%
        gst_amount=1440.0,  # 12%
        net_payable=13440.0,
        payment_mode="NEFT",
        is_deleted=False,
        is_cancelled=False
    )
    db.add(b2b_checkout)

    # 2. Seed B2C Domestic Room Checkout
    b2c_checkout = models.CheckoutRecord(
        invoice_no=f"INV-B2C-{uuid.uuid4().hex[:6].upper()}",
        room_no="202",
        room_type="Standard",
        guest_name="Binod Nayak",
        check_in_date=f"{period}-10",
        check_out_date=f"{period}-11",
        total_room_rent=2500.0,
        cgst_amount=150.0,  # 6%
        sgst_amount=150.0,  # 6%
        gst_amount=300.0,   # 12%
        net_payable=2800.0,
        payment_mode="UPI",
        is_deleted=False,
        is_cancelled=False
    )
    db.add(b2c_checkout)

    # 3. Seed Restaurant Food Bill (SAC 996331 @ 5%)
    food_bill = models.FoodBill(
        bill_no=f"FB-{uuid.uuid4().hex[:6].upper()}",
        table_no="Table 5",
        guest_name="Binod Nayak",
        date=f"{period}-10",
        time="20:15",
        taxable_amount=1200.0,
        cgst_amount=30.0,  # 2.5%
        sgst_amount=30.0,  # 2.5%
        net_bill_amount=1260.0,
        settlement_type="Cash",
        is_deleted=False
    )
    db.add(food_bill)
    db.commit()

    # Query GSTR-1
    res = client.get(f"/api/v1/accounting/gst/gstr-1?period={period}", headers=auth_headers)
    assert res.status_code == 200
    gstr1 = res.json()

    assert gstr1["status"] == "success"
    assert gstr1["gstin"] == "21AEKPP8689J1ZS"
    assert gstr1["fp"] == "112026"
    assert gstr1["version"] == "GST_OFFLINE_TOOL_V1.1"

    # Verify B2B Invoices (Table 4)
    b2b_entries = gstr1["b2b"]
    assert len(b2b_entries) >= 1
    utkal_b2b = next((b for b in b2b_entries if b["ctin"] == "21AAACU1234A1Z5"), None)
    assert utkal_b2b is not None
    inv_item = utkal_b2b["inv"][0]["itms"][0]["itm_det"]
    assert inv_item["rt"] == 12.0
    assert inv_item["txval"] == 12000.0
    assert inv_item["camt"] == 720.0
    assert inv_item["samt"] == 720.0

    # Verify B2CS Invoices (Table 7)
    b2cs = gstr1["b2cs"]
    assert len(b2cs) >= 2
    # Check 12% room slab in B2CS
    room_b2cs = next((s for s in b2cs if s["rt"] == 12.0), None)
    assert room_b2cs is not None
    assert room_b2cs["sply_ty"] == "INTRA"
    assert room_b2cs["pos"] == "21"
    assert room_b2cs["txval"] >= 2500.0

    # Check 5% food slab in B2CS
    food_b2cs = next((s for s in b2cs if s["rt"] == 5.0), None)
    assert food_b2cs is not None
    assert food_b2cs["sply_ty"] == "INTRA"
    assert food_b2cs["pos"] == "21"
    assert food_b2cs["txval"] >= 1200.0

    # Verify HSN/SAC Summary (Table 12)
    hsn_list = gstr1["hsn"]["data"]
    sac_map = {h["hsn_sc"]: h for h in hsn_list}
    assert "996311" in sac_map
    assert "996331" in sac_map
    assert sac_map["996311"]["desc"] == "Room Accommodation Services"
    assert sac_map["996331"]["desc"] == "Restaurant Food & Beverage Services"

    # Verify Document Issue Summary (Table 13)
    doc_det = gstr1["doc_issue"]["doc_det"]
    assert len(doc_det) >= 1
    assert doc_det[0]["doc_typ"] == "Invoices for outward supply"
    assert doc_det[0]["totnum"] >= 2


# =================================================================================================
# TEST 5: Official Statutory GSTR-3B Return & Section 170 CGST Act Rounding
# =================================================================================================
def test_statutory_gstr3b_monthly_return_and_rounding(auth_headers):
    """
    Validates official GSTR-3B monthly return aggregation:
    - Table 3.1: Total Outward Taxable Supplies, CGST, SGST, IGST.
    - Cash Liability equals central tax + state tax + integrated tax.
    - Section 170 CGST Act compliance: rounding to nearest integer rupee.
    """
    period = "2026-11"
    res = client.get(f"/api/v1/pms/gst/gstr-3b?period={period}", headers=auth_headers)
    assert res.status_code == 200
    gstr3b = res.json()

    assert gstr3b["status"] == "success"
    assert gstr3b["gstin"] == "21AEKPP8689J1ZS"
    assert gstr3b["trade_name"] == "Hotel Sai Vasudev Residency"
    assert gstr3b["return_period"] == period

    table31 = gstr3b["table_3_1_outward_supplies"]["osup_det"]
    assert table31["txval"] > 0
    assert table31["camt"] > 0
    assert table31["samt"] > 0

    cash_pay = gstr3b["tax_payable_in_cash"]
    assert cash_pay["central_tax_cgst"] == table31["camt"]
    assert cash_pay["state_tax_sgst"] == table31["samt"]
    expected_tot = round(cash_pay["central_tax_cgst"] + cash_pay["state_tax_sgst"] + cash_pay["integrated_tax_igst"], 2)
    assert abs(cash_pay["total_cash_liability"] - expected_tot) < 0.05

    # Section 170 rounding
    s170 = gstr3b["section_170_rounding_compliance"]
    assert isinstance(s170["rounded_cgst"], int)
    assert isinstance(s170["rounded_sgst"], int)
    assert isinstance(s170["rounded_total_tax"], int)
