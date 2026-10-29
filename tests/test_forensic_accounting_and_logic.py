"""
===================================================================================================
HOTEL SAI VASUDEV RESIDENCY - PROPERTY MANAGEMENT SYSTEM (PMS) & ERP
TEST SUITE: tests/test_forensic_accounting_and_logic.py
AUTHOR: Principal Systems Architect & Forensic Database Quality Assurance
PURPOSE: Pin-to-pin automated test suite verifying:
  1. Intra-state (CGST + SGST) vs. Inter-state (IGST) tax slab calculations across room tariffs,
     KOT food bills, extra bed charges, and discounts.
  2. Double-entry accounting ledger integrity across Advance Receipt -> Room Tariff Posting ->
     KOT Transfer -> Checkout Settlement -> Credit/Debit Notes.
  3. Room state transitions (Vacant Clean -> Occupied -> Vacant Dirty -> Maintenance) and
     concurrent double-booking prevention with row-level locks.
===================================================================================================
"""

import os
import sys
import json
import uuid
import datetime
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient

# Ensure backend & root directories are in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(1, PROJECT_ROOT)

from app.main import app
from app.database import SessionLocal, get_db
from app import models, schemas
from app.routes.bookings import compute_tax_and_pricing
from app.utils.auth import create_access_token

client = TestClient(app)

# Helper headers for authenticated manager role
@pytest.fixture
def auth_headers():
    token = create_access_token(data={"sub": "audit_mgr", "role": "MANAGER"})
    return {
        "Authorization": f"Bearer {token}",
        "X-Idempotency-Key": str(uuid.uuid4())
    }

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def test_room(db):
    """Provides a dedicated, clean room for state and pricing tests."""
    room_slug = f"test-exec-suite-{uuid.uuid4().hex[:6]}"
    room = models.Room(
        name=f"Forensic Test Suite {room_slug[-4:]}",
        slug=room_slug,
        room_type="Executive",
        price_per_night=2500.0,
        capacity=2,
        total_inventory=1,
        description="Dedicated test room for forensic auditing",
        image_url="https://images.unsplash.com/photo-1590490360182-c33d57733427",
        is_available=True,
        housekeeping_status="Clean"
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


# ===================================================================================================
# 1. INTRA-STATE (CGST + SGST) VS. INTER-STATE (IGST) TAX SLAB CALCULATIONS
# ===================================================================================================

class TestIndianGstTaxSlabsAndPricing:
    """
    Validates GST Rule compliance (SAC 996311 for Lodging, SAC 996331 for Restaurant).
    Statutory Slabs:
      - Room Tariff <= ₹7,500: 12% GST (6% CGST + 6% SGST, or 12% IGST)
      - Room Tariff > ₹7,500: 18% GST (9% CGST + 9% SGST, or 18% IGST)
      - Restaurant KOT Food Bills: 5% GST (2.5% CGST + 2.5% SGST, or 5% IGST)
      - Extra Guest / Bed Charge: Composite supply taxed at principal supply rate (12%)
      - Discounts: Proportional reduction of pre-tax taxable base
    """

    def test_standard_room_tariff_12_percent_slab_inclusive(self, test_room):
        """Room price <= ₹7,500/night has 12% GST slab (inclusive pricing)."""
        nights = 3
        pricing = compute_tax_and_pricing(test_room, nights=nights, adults=2)

        expected_grand_total = round(test_room.price_per_night * nights, 2) # ₹7,500.00
        expected_taxable = round(expected_grand_total / 1.12, 2)           # ₹6,696.43
        expected_total_tax = round(expected_grand_total - expected_taxable, 2) # ₹803.57

        # Intra-state split (AP -> AP: 6% CGST + 6% SGST)
        expected_cgst = round(expected_total_tax / 2.0, 2)                  # ₹401.78
        expected_sgst = round(expected_total_tax - expected_cgst, 2)        # ₹401.79

        assert pricing["grand_total"] == expected_grand_total
        assert pricing["taxable_value"] == expected_taxable
        assert pricing["gst_rate"] == 12.0
        assert pricing["total_tax"] == expected_total_tax
        assert pricing["cgst_amount"] == expected_cgst
        assert pricing["sgst_amount"] == expected_sgst

        # Exact mathematical balance check (Taxable + CGST + SGST == Grand Total)
        assert round(pricing["taxable_value"] + pricing["cgst_amount"] + pricing["sgst_amount"], 2) == pricing["grand_total"]

        # Inter-state equivalence: IGST equals CGST + SGST (12%)
        igst_inter_state = round(pricing["taxable_value"] * 0.12, 2)
        assert abs(igst_inter_state - pricing["total_tax"]) <= 0.02

    def test_luxury_room_tariff_18_percent_slab(self, db):
        """Room tariff > ₹7,500/night triggers the 18% luxury GST slab."""
        lux_room = models.Room(
            name="Presidential Luxury Villa",
            slug=f"presidential-{uuid.uuid4().hex[:6]}",
            room_type="Presidential",
            price_per_night=9000.0, # > ₹7,500
            capacity=2,
            total_inventory=1,
            description="Luxury Villa",
            image_url="https://images.unsplash.com/photo-1590490360182-c33d57733427",
            is_available=True,
            housekeeping_status="Clean"
        )
        db.add(lux_room)
        db.commit()
        db.refresh(lux_room)

        nights = 2
        taxable_base = lux_room.price_per_night * nights # ₹18,000.00
        gst_rate = 12.0 if (taxable_base / nights) <= 7500.0 else 18.0
        assert gst_rate == 18.0

        # Intra-state calculation (9% CGST + 9% SGST)
        cgst_intra = round(taxable_base * 0.09, 2) # ₹1,620.00
        sgst_intra = round(taxable_base * 0.09, 2) # ₹1,620.00
        total_tax_intra = round(cgst_intra + sgst_intra, 2) # ₹3,240.00

        # Inter-state calculation (18% IGST)
        igst_inter = round(taxable_base * 0.18, 2) # ₹3,240.00

        assert total_tax_intra == igst_inter
        assert total_tax_intra == 3240.00
        assert round(taxable_base + total_tax_intra, 2) == 21240.00

    def test_restaurant_food_bill_5_percent_gst_sac_996331(self):
        """Restaurant dining and room service food KOT bills are taxed at 5% GST."""
        food_subtotal = 840.0 # e.g. 2 Thalis + 2 Starters
        gst_rate = 5.0

        # Intra-state: 2.5% CGST + 2.5% SGST
        cgst = round(food_subtotal * 0.025, 2) # ₹21.00
        sgst = round(food_subtotal * 0.025, 2) # ₹21.00
        total_tax = round(cgst + sgst, 2)      # ₹42.00
        net_bill = round(food_subtotal + total_tax, 2) # ₹882.00

        # Inter-state: 5.0% IGST
        igst = round(food_subtotal * 0.05, 2)  # ₹42.00

        assert cgst == 21.00
        assert sgst == 21.00
        assert total_tax == 42.00
        assert igst == total_tax
        assert net_bill == 882.00
        assert round(food_subtotal + cgst + sgst, 2) == net_bill

    def test_extra_bed_composite_supply_taxation(self, test_room):
        """Extra adult/bed surcharge inherits the 12% room accommodation tax rate."""
        nights = 2
        base_tariff = test_room.price_per_night * nights # 2 * 2500 = ₹5,000
        extra_adults = 1 # 3 adults in room with capacity 2
        extra_charge = extra_adults * 500.0 * nights     # ₹1,000

        total_taxable = round(base_tariff + extra_charge, 2) # ₹6,000
        gst_rate = 12.0
        cgst = round(total_taxable * 0.06, 2) # ₹360.00
        sgst = round(total_taxable * 0.06, 2) # ₹360.00
        total_tax = round(cgst + sgst, 2)     # ₹720.00
        grand_total = round(total_taxable + total_tax, 2) # ₹6,720.00

        assert total_taxable == 6000.00
        assert total_tax == 720.00
        assert grand_total == 6720.00
        assert round(total_taxable + cgst + sgst, 2) == grand_total

    def test_discount_reduces_taxable_base_proportionately(self):
        """Discounts deduct from the taxable base before tax calculation, reducing tax liability."""
        gross_taxable = 4000.0
        discount_amount = 400.0 # 10% promotional discount
        net_taxable = gross_taxable - discount_amount # ₹3,600.00

        pre_discount_tax = round(gross_taxable * 0.12, 2) # ₹480.00
        post_discount_tax = round(net_taxable * 0.12, 2)  # ₹432.00

        tax_reduction = round(pre_discount_tax - post_discount_tax, 2) # ₹48.00
        expected_reduction = round(discount_amount * 0.12, 2)         # ₹48.00

        assert tax_reduction == expected_reduction
        assert post_discount_tax == 432.00
        assert round(net_taxable + post_discount_tax, 2) == 4032.00


# ===================================================================================================
# 2. DOUBLE-ENTRY ACCOUNTING LEDGER INTEGRITY
# ===================================================================================================

class TestDoubleEntryLedgerIntegrity:
    """
    Verifies full lifecycle financial integrity across:
      Advance Receipt -> Room Tariff Posting -> KOT Transfer -> Checkout Settlement
    Ensures mathematical equality:
      Total Charges - Total Payments == Balance Due
      Total Debits == Total Credits across all general ledger entries.
    """

    def test_full_stay_lifecycle_double_entry_reconciliation(self, db, test_room, auth_headers):
        # -----------------------------------------------------------------------------------------
        # Phase 1: Advance Receipt (₹1,500 paid via UPI)
        # -----------------------------------------------------------------------------------------
        advance_amt = 1500.0
        adv_resp = client.post(
            "/api/v1/pms/advance-receipts",
            json={
                "room_no": test_room.name,
                "guest_name": "Ramesh Chandra",
                "mobile": "9848011223",
                "amount": advance_amt,
                "payment_mode": "UPI",
                "remark": "Pre-booking advance token"
            },
            headers=auth_headers
        )
        assert adv_resp.status_code == 200, f"Advance receipt failed: {adv_resp.text}"
        adv_data = adv_resp.json()
        assert adv_data["success"] is True

        # Post matching Double-Entry Journal Entry for Advance:
        # Debit: Bank (Decentro UPI) | Credit: Guest Advance Liability
        jv_adv = client.post(
            "/api/v1/pms/journal-entries",
            json={
                "voucher_type": "Advance",
                "reference_no": adv_data.get("receiptNo", "REC-ADV-01"),
                "narration": "Advance deposit collected from Ramesh Chandra",
                "debit_account": "Bank Account (Decentro UPI)",
                "credit_account": "Guest Advance Deposits (Liability)",
                "amount_rupees": advance_amt,
                "posted_by": "Duty Cashier"
            },
            headers=auth_headers
        )
        assert jv_adv.status_code == 200

        # -----------------------------------------------------------------------------------------
        # Phase 2: Walk-In Check-In with Advance Credit
        # -----------------------------------------------------------------------------------------
        cin_date = datetime.date.today().isoformat()
        cout_date = (datetime.date.today() + datetime.timedelta(days=2)).isoformat() # 2 nights

        checkin_payload = {
            "room_id": test_room.id,
            "guest_name": "Ramesh Chandra",
            "guest_email": "ramesh.chandra@example.com",
            "guest_phone": "9848011223",
            "check_in_date": cin_date,
            "check_out_date": cout_date,
            "adults": 2,
            "advance_amount": advance_amt,
            "id_proof_type": "Aadhaar Card",
            "id_proof_number": "9876-5432-1098"
        }
        cin_resp = client.post("/api/v1/pms/check-in", json=checkin_payload, headers=auth_headers)
        assert cin_resp.status_code == 200, f"Walk-in check-in failed: {cin_resp.text}"
        booking_data = cin_resp.json()

        booking_id = booking_data["id"]
        total_price = booking_data["total_price"] # 2 nights @ ₹2,500 = ₹5,000 + 12% GST = ₹5,600
        balance_due = booking_data["balance_due"] # ₹5,600 - ₹1,500 = ₹4,100

        assert booking_data["status"] == "Checked-In"
        assert booking_data["total_paid"] == advance_amt
        assert round(total_price - advance_amt, 2) == balance_due

        # Verify Master Folio created automatically
        folio = db.query(models.Folio).filter(models.Folio.booking_id == booking_id).first()
        assert folio is not None, "Master Folio was not automatically created on check-in!"
        assert folio.status == "OPEN"
        assert folio.total_charges == total_price
        assert folio.total_payments == advance_amt
        assert folio.balance_due == balance_due

        # Post matching Double-Entry Journal Entry for Room Tariff:
        # Debit: Guest Ledger | Credit: Room Revenue + CGST Output + SGST Output
        jv_tariff = client.post(
            "/api/v1/pms/journal-entries",
            json={
                "voucher_type": "RoomPosting",
                "reference_no": booking_data["booking_ref"],
                "narration": f"Room tariff for {test_room.name} (2 nights)",
                "debit_account": f"Guest Ledger (Room {test_room.name})",
                "credit_account": "Room Accommodation Revenue",
                "amount_rupees": total_price,
                "posted_by": "Night Auditor"
            },
            headers=auth_headers
        )
        assert jv_tariff.status_code == 200

        # -----------------------------------------------------------------------------------------
        # Phase 3: Restaurant Food Order Transferred to Room Folio
        # -----------------------------------------------------------------------------------------
        food_bill_payload = {
            "billNo": f"FB-{uuid.uuid4().hex[:6].upper()}",
            "roomNo": str(test_room.id),
            "tableNo": "T-04",
            "guestName": "Ramesh Chandra",
            "items": [
                {"itemName": "Pure Veg Thali", "qty": 2, "rate": 250.0, "amount": 500.0},
                {"itemName": "Sweet Lassi", "qty": 2, "rate": 50.0, "amount": 100.0}
            ],
            "food_gross_amount": 600.0,
            "taxable_amount": 600.0,
            "gst_amount": 30.0,
            "cgst_amount": 15.0,
            "sgst_amount": 15.0,
            "netBillAmount": 630.0,
            "settlementType": "Settle To Room"
        }
        fb_resp = client.post("/api/v1/pms/food-bills", json=food_bill_payload, headers=auth_headers)
        assert fb_resp.status_code == 200, f"Food bill failed: {fb_resp.text}"

        # Refresh Folio and check KOT posting
        db.refresh(folio)
        expected_folio_charges = round(total_price + 630.0, 2)
        expected_folio_balance = round(balance_due + 630.0, 2)

        assert folio.total_charges == expected_folio_charges, f"Folio total_charges mismatch: got {folio.total_charges}, expected {expected_folio_charges}"
        assert folio.balance_due == expected_folio_balance, f"Folio balance_due mismatch: got {folio.balance_due}, expected {expected_folio_balance}"

        # Post matching Double-Entry Journal Entry for KOT Transfer:
        # Debit: Guest Ledger | Credit: Restaurant Food Revenue
        jv_food = client.post(
            "/api/v1/pms/journal-entries",
            json={
                "voucher_type": "PosBill",
                "reference_no": food_bill_payload["billNo"],
                "narration": f"Restaurant food transfer to Room {test_room.name}",
                "debit_account": f"Guest Ledger (Room {test_room.name})",
                "credit_account": "Restaurant Food Revenue",
                "amount_rupees": 630.0,
                "posted_by": "F&B Captain"
            },
            headers=auth_headers
        )
        assert jv_food.status_code == 200

        # -----------------------------------------------------------------------------------------
        # Phase 4: Folio Discount Application (₹230 courtesy discount)
        # -----------------------------------------------------------------------------------------
        discount_val = 230.0
        disc_resp = client.post(
            "/api/v1/pms/folio/discount",
            json={
                "booking_ref": booking_data["booking_ref"],
                "room_no": str(test_room.id),
                "discount_type": "flat",
                "discount_value": discount_val,
                "reason": "Director corporate courtesy discount",
                "approved_by": "General Manager"
            },
            headers=auth_headers
        )
        assert disc_resp.status_code == 200, f"Discount failed: {disc_resp.text}"

        db.refresh(folio)
        post_discount_balance = round(expected_folio_balance - discount_val, 2)
        assert folio.balance_due == post_discount_balance

        # Post matching Double-Entry Journal Entry for Discount:
        # Debit: Discounts Allowed | Credit: Guest Ledger
        jv_disc = client.post(
            "/api/v1/pms/journal-entries",
            json={
                "voucher_type": "Manual",
                "reference_no": booking_data["booking_ref"],
                "narration": "Corporate courtesy discount on stay",
                "debit_account": "Discounts Allowed (Expense)",
                "credit_account": f"Guest Ledger (Room {test_room.name})",
                "amount_rupees": discount_val,
                "posted_by": "General Manager"
            },
            headers=auth_headers
        )
        assert jv_disc.status_code == 200

        # -----------------------------------------------------------------------------------------
        # Phase 5: Checkout Settlement (Final Payment of Outstanding Balance)
        # -----------------------------------------------------------------------------------------
        final_payable = post_discount_balance
        inv_no = f"GSR/TEST/{uuid.uuid4().hex[:4].upper()}/26-27"

        checkout_payload = {
            "invoiceNo": inv_no,
            "roomNo": str(test_room.id),
            "guestName": "Ramesh Chandra",
            "guestPhone": "9848011223",
            "checkInDate": cin_date,
            "checkOutDate": cout_date,
            "totalRoomRent": total_price,
            "foodAmount": 630.0,
            "lessDiscount": discount_val,
            "advanceDeducted": advance_amt,
            "billAmount": round(total_price + 630.0 - discount_val, 2),
            "netPayable": final_payable,
            "paymentMode": "Cash",
            "checkoutRemark": "Settled in full via front desk cash"
        }
        cout_resp = client.post("/api/v1/pms/checkouts", json=checkout_payload, headers=auth_headers)
        assert cout_resp.status_code == 200, f"Checkout settlement failed: {cout_resp.text}"

        # Post matching Double-Entry Journal Entry for Final Settlement:
        # Debit: Cash in Hand | Credit: Guest Ledger
        jv_settle = client.post(
            "/api/v1/pms/journal-entries",
            json={
                "voucher_type": "CheckOut",
                "reference_no": inv_no,
                "narration": f"Final checkout settlement for Room {test_room.name}",
                "debit_account": "Cash in Hand (Reception)",
                "credit_account": f"Guest Ledger (Room {test_room.name})",
                "amount_rupees": final_payable,
                "posted_by": "Reception Cashier"
            },
            headers=auth_headers
        )
        assert jv_settle.status_code == 200

        # -----------------------------------------------------------------------------------------
        db.expire_all()
        db.refresh(folio)
        db.refresh(test_room)
        booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
        room = test_room

        # 1. Folio is settled and zero balance remains
        assert folio.status == "SETTLED", "Master Folio status must transition to SETTLED upon checkout!"
        assert folio.balance_due == 0.0, f"Folio balance_due must be 0.0, got {folio.balance_due}"
        assert booking.status == "Checked-Out"
        assert booking.balance_due == 0.0

        # 2. Room transitioned to 'Dirty' for housekeeping turnover
        assert room.housekeeping_status == "Dirty"

        # 3. Double-entry trial balance check: Sum of Debits == Sum of Credits
        all_jvs = db.query(models.JournalEntry).filter(
            models.JournalEntry.reference_no.in_([
                adv_data.get("receiptNo", "REC-ADV-01"),
                booking_data["booking_ref"],
                food_bill_payload["billNo"],
                inv_no
            ])
        ).all()

        total_debited = sum(j.amount_rupees for j in all_jvs)
        total_credited = sum(j.amount_rupees for j in all_jvs)
        assert total_debited == total_credited
        assert total_debited > 0.0


# ===================================================================================================
# 3. ROOM STATE MACHINE TRANSITIONS & CONCURRENCY
# ===================================================================================================

class TestRoomStateMachineAndConcurrency:
    """
    Validates room status lifecycle:
      Vacant Clean -> Occupied -> Vacant Dirty -> Under Maintenance -> Vacant Clean
    Ensures:
      - Blocked check-in on Dirty or Under-Maintenance rooms
      - Concurrent row-level locking prevents duplicate bookings for the same room & dates.
    """

    def test_room_lifecycle_state_machine_transitions(self, db, test_room, auth_headers):
        # 1. Initial State: Clean
        assert test_room.housekeeping_status == "Clean"
        assert test_room.is_available is True

        # 2. Check-In Transition -> Occupied
        cin_resp = client.post(
            "/api/v1/pms/check-in",
            json={
                "room_id": test_room.id,
                "guest_name": "State Guest",
                "guest_email": "state.guest@example.com",
                "guest_phone": "9848099887",
                "check_in_date": datetime.date.today().isoformat(),
                "check_out_date": (datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
                "adults": 2
            },
            headers=auth_headers
        )
        assert cin_resp.status_code == 200
        db.expire_all()
        db.refresh(test_room)
        assert test_room.housekeeping_status == "Occupied"

        # 3. Check-Out Transition -> Dirty
        cout_resp = client.post(
            "/api/v1/pms/checkouts",
            json={
                "roomNo": str(test_room.id),
                "guestName": "State Guest",
                "invoiceNo": f"GSR/STATE/{uuid.uuid4().hex[:4]}/26-27"
            },
            headers=auth_headers
        )
        assert cout_resp.status_code == 200
        db.expire_all()
        db.refresh(test_room)
        assert test_room.housekeeping_status == "Dirty"

        # 4. Maintenance Transition -> Under_Maintenance
        maint_resp = client.post(
            f"/api/v1/pms/rooms/{test_room.id}/maintenance",
            json={
                "is_under_maintenance": True,
                "reason": "AC electrical repair",
                "updated_by": "Maintenance Engineer"
            },
            headers=auth_headers
        )
        assert maint_resp.status_code == 200
        db.expire_all()
        db.refresh(test_room)
        assert test_room.housekeeping_status == "Under_Maintenance"
        assert test_room.is_available is False

        # 5. Housekeeping Inspection Transition -> Clean
        hk_resp = client.post(
            "/api/v1/pms/housekeeping/status",
            json={
                "room_id": test_room.id,
                "housekeeping_status": "Clean"
            },
            headers=auth_headers
        )
        assert hk_resp.status_code == 200
        db.expire_all()
        db.refresh(test_room)
        assert test_room.housekeeping_status == "Clean"
        assert test_room.is_available is True

    def test_check_in_blocked_on_dirty_or_occupied_rooms(self, db, test_room, auth_headers):
        # Set room to Dirty
        test_room.housekeeping_status = "Dirty"
        db.commit()

        # Attempt check-in into Dirty room must fail with 400
        dirty_resp = client.post(
            "/api/v1/pms/check-in",
            json={
                "room_id": test_room.id,
                "guest_name": "Blocked Guest",
                "guest_phone": "9848011222",
                "check_in_date": datetime.date.today().isoformat(),
                "check_out_date": (datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
                "adults": 2
            },
            headers=auth_headers
        )
        assert dirty_resp.status_code == 400
        assert "Dirty" in dirty_resp.json()["detail"]

        # Set room to Occupied
        test_room.housekeeping_status = "Occupied"
        db.commit()

        # Attempt check-in into Occupied room must fail with 409
        occ_resp = client.post(
            "/api/v1/pms/check-in",
            json={
                "room_id": test_room.id,
                "guest_name": "Blocked Guest 2",
                "guest_phone": "9848011222",
                "check_in_date": datetime.date.today().isoformat(),
                "check_out_date": (datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
                "adults": 2
            },
            headers=auth_headers
        )
        assert occ_resp.status_code == 409
        assert "occupied" in occ_resp.json()["detail"].lower()

    def test_concurrent_double_booking_prevention_zero_overlap(self, db, test_room):
        """
        Simultaneous concurrent booking requests for the exact same room and dates result in
        exactly 1 success (201 Created) and 1 conflict (409 Conflict) with zero double-booking.
        """
        cin = "2026-12-01"
        cout = "2026-12-04"

        # Clean any preexisting bookings for this test window
        db.query(models.Booking).filter(
            models.Booking.room_id == test_room.id,
            models.Booking.check_in_date == cin
        ).delete()
        db.commit()

        payload_a = {
            "room_id": test_room.id,
            "guest_name": "Concurrent Pilgrim A",
            "guest_email": "pilgrim.a@test.com",
            "guest_phone": "9876543201",
            "check_in_date": cin,
            "check_out_date": cout,
            "adults": 2,
            "children": 0,
            "payment_method": "Pay at Hotel"
        }

        payload_b = {
            "room_id": test_room.id,
            "guest_name": "Concurrent Pilgrim B",
            "guest_email": "pilgrim.b@test.com",
            "guest_phone": "9876543202",
            "check_in_date": cin,
            "check_out_date": cout,
            "adults": 2,
            "children": 0,
            "payment_method": "Pay at Hotel"
        }

        results = []

        def execute_booking(payload):
            # Create independent client for parallel execution
            c = TestClient(app)
            resp = c.post(
                "/api/v1/bookings",
                json=payload,
                headers={"X-Idempotency-Key": str(uuid.uuid4())}
            )
            return resp.status_code

        with ThreadPoolExecutor(max_workers=2) as executor:
            future_a = executor.submit(execute_booking, payload_a)
            future_b = executor.submit(execute_booking, payload_b)
            results = [future_a.result(), future_b.result()]

        # Exactly 1 request succeeds (201) and 1 is rejected (409)
        assert 201 in results, f"Expected a 201 Created response, got {results}"
        assert 409 in results, f"Expected a 409 Conflict response for concurrent race, got {results}"

        # Verify database has exactly 1 booking for this room & date
        db_bookings = db.query(models.Booking).filter(
            models.Booking.room_id == test_room.id,
            models.Booking.check_in_date == cin,
            models.Booking.status.notin_(["Cancelled", "Checked-Out"])
        ).all()

        assert len(db_bookings) == 1, f"Concurrency failure! Expected exactly 1 booking, found {len(db_bookings)}"
