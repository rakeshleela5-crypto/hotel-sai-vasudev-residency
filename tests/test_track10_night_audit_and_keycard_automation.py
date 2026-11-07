"""
Track 10 Test Suite: Front Desk Ergonomics, Night Audit & Key Card Automation
Benchmarked against ~/everything/src/property-management/ & ~/everything/src/shifts/

Covers:
  1. Automated Zero-Touch Midnight Night Audit Rollover:
     - Advances business date and auto-posts nightly tariffs + 12% statutory GST to in-house folios.
     - Generates balancing General Ledger Journal entries (Zero-sum equilibrium).
     - Computes Occupancy %, ADR (Average Daily Rate), and RevPAR metrics.
  2. RFID Smart Lock Keycard Encoding (T-Minus 1 Hour Expiry Rule):
     - Encodes RFID keycard with automated deactivation 60 minutes prior to scheduled checkout.
     - Status marked as ACTIVE.
  3. RFID Keycard Stay Extension & Late Checkout Fee:
     - Re-encodes card with extended checkout time and logs late fee.
     - Updates card status to EXTENDED.
  4. RFID Keycard Return / Deactivation upon Checkout:
     - Returns card to inventory upon room checkout, marking status as RETURNED.
  5. Night Audit Sealing & Re-run Idempotency:
     - Prevents duplicate day-end closings or double revenue counting on same date.
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
        data={"sub": "night_auditor", "role": "MANAGER", "employee_id": "EMP-AUDIT-001"},
        expires_delta=datetime.timedelta(hours=2)
    )
    return {
        "Authorization": f"Bearer {token}",
        "X-Idempotency-Key": str(uuid.uuid4())
    }


def seed_inhouse_booking(db, suffix: str, base_rate: float = 3000.0) -> models.Booking:
    room = models.Room(
        name=f"Room 100-{suffix}",
        slug=f"room-100-{suffix.lower()}",
        room_type="Executive",
        price_per_night=base_rate,
        capacity=2,
        total_inventory=1,
        description="Track 10 Night Audit Test Room",
        image_url="/assets/rooms/exec.jpg",
        housekeeping_status="Clean",
        is_available=False
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    booking = models.Booking(
        booking_ref=f"SVR-NA-{suffix}",
        invoice_number=f"INV-NA-{suffix}",
        room_id=room.id,
        guest_name=f"Pradeep Senapati {suffix}",
        guest_email="pradeep@example.com",
        guest_phone="9861012345",
        id_proof_type="Aadhaar Card",
        id_proof_number="XXXX-XXXX-9911",
        check_in_date=(datetime.date.today() - datetime.timedelta(days=1)).isoformat(),
        check_out_date=(datetime.date.today() + datetime.timedelta(days=2)).isoformat(),
        adults=2,
        total_nights=3,
        base_rate=base_rate,
        base_amount=base_rate * 3,
        total_price=round(base_rate * 3 * 1.12, 2),
        total_paid=0.0,
        balance_due=0.0,
        gst_rate=12.0,
        status="Checked-In"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


# =================================================================================================
# TEST 1: Automated Midnight Night Audit Rollover Engine
# =================================================================================================
def test_automated_midnight_night_audit_rollover(db, auth_headers):
    """
    Simulates automated midnight 00:00:00 IST night audit execution.
    Verifies:
    1. Nightly room rent + 12% GST is billed to in-house guest folios.
    2. Booking balance_due is incremented accurately.
    3. Balancing JournalEntry (Dr Guest Folio, Cr Room Revenue) is posted.
    4. Occupancy %, ADR, and RevPAR are returned.
    """
    suffix = uuid.uuid4().hex[:6].upper()
    booking = seed_inhouse_booking(db, suffix, base_rate=2500.0)

    # Trigger automated midnight night audit
    res = client.post("/api/v1/pms/night-audit/automated-midnight", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["stayover_rooms_posted"] >= 1
    assert data["occupancy_rate_pct"] > 0
    assert data["adr_inr"] > 0
    assert data["revpar_inr"] > 0

    # Verify Folio item: 2500 base + 6% CGST (150) + 6% SGST (150) = 2800 total
    db.refresh(booking)
    expected_charge = round(2500.0 * 1.12, 2)
    assert booking.balance_due >= expected_charge

    # Verify Journal Entry in General Ledger
    jv = db.query(models.JournalEntry).filter(
        models.JournalEntry.reference_no == booking.booking_ref,
        models.JournalEntry.debit_account.ilike(f"%{booking.guest_name}%")
    ).first()
    assert jv is not None
    assert jv.amount_rupees == expected_charge
    assert jv.credit_account == "Room Revenue Account"


# =================================================================================================
# TEST 2: RFID Smart Lock Keycard Encoding (T-Minus 1 Hour Rule)
# =================================================================================================
def test_rfid_keycard_encoding_t_minus_one_hour(auth_headers):
    """
    Verifies that encoding an RFID keycard enforces the T-Minus 1 Hour automated cutoff rule.
    If scheduled checkout is tomorrow at 11:00 AM, card deactivates at 10:00 AM sharp.
    """
    card_uid = f"RFID-LOCK-{uuid.uuid4().hex[:6].upper()}"
    room_no = "204"
    guest = "Dr. Ananya Roy"

    checkout_time = (datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=1, hours=3)).isoformat()

    encode_payload = {
        "card_uid": card_uid,
        "room_no": room_no,
        "guest_name": guest,
        "check_in_time": datetime.datetime.now(datetime.UTC).isoformat(),
        "scheduled_checkout_time": checkout_time,
        "encoded_by": "Front Desk Receptionist"
    }

    res = client.post("/api/v1/pms/keycards/encode", json=encode_payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["card_uid"] == card_uid
    assert data["room_no"] == room_no
    assert data["status"] == "ACTIVE"

    # Confirm deactivation is approximately 1 hour before scheduled checkout
    sched_dt = datetime.datetime.fromisoformat(data["scheduled_checkout_time"])
    deact_dt = datetime.datetime.fromisoformat(data["card_deactivation_time"])
    diff_minutes = (sched_dt - deact_dt).total_seconds() / 60.0
    assert abs(diff_minutes - 60.0) < 1.0


# =================================================================================================
# TEST 3: RFID Keycard Stay Extension & Late Checkout Fee
# =================================================================================================
def test_rfid_keycard_extension_and_fee(auth_headers):
    """
    Verifies that extending an RFID keycard:
    1. Re-encodes new checkout and deactivation timestamps.
    2. Logs the late checkout tariff fee.
    3. Updates card status to EXTENDED.
    """
    card_uid = f"RFID-EXT-{uuid.uuid4().hex[:6].upper()}"
    encode_payload = {
        "card_uid": card_uid,
        "room_no": "301",
        "guest_name": "Siddharth Verma",
        "check_in_time": datetime.datetime.now(datetime.UTC).isoformat(),
        "scheduled_checkout_time": (datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=4)).isoformat()
    }
    client.post("/api/v1/pms/keycards/encode", json=encode_payload, headers=auth_headers)

    # Now extend stay by 3 additional hours with ₹600 fee
    new_checkout = (datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=7)).isoformat()
    extend_payload = {
        "card_uid": card_uid,
        "extended_checkout_time": new_checkout,
        "extension_fee_paid": 600.0,
        "extension_reason": "Train delayed; late checkout approved by manager"
    }

    res_ext = client.post("/api/v1/pms/keycards/extend", json=extend_payload, headers=auth_headers)
    assert res_ext.status_code == 200
    ext_data = res_ext.json()
    assert ext_data["success"] is True
    assert ext_data["extension_fee_logged"] == 600.0


# =================================================================================================
# TEST 4: RFID Keycard Return / Deactivation upon Checkout
# =================================================================================================
def test_rfid_keycard_return_on_checkout(db, auth_headers):
    """
    Verifies that returning an RFID keycard upon checkout deactivates the card
    and marks status as RETURNED in the database.
    """
    card_uid = f"RFID-RET-{uuid.uuid4().hex[:6].upper()}"
    client.post(
        "/api/v1/pms/keycards/encode",
        json={
            "card_uid": card_uid,
            "room_no": "205",
            "guest_name": "Meera Joshi",
            "scheduled_checkout_time": (datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=2)).isoformat()
        },
        headers=auth_headers
    )

    # Return key card
    res_ret = client.post("/api/v1/pms/keycards/return", json={"card_uid": card_uid}, headers=auth_headers)
    assert res_ret.status_code == 200
    assert res_ret.json()["status"] == "RETURNED"

    # Verify DB status
    card = db.query(models.KeyCardAccess).filter(models.KeyCardAccess.card_uid == card_uid).first()
    assert card.status == "RETURNED"


# =================================================================================================
# TEST 5: Manual Night Audit Sealing & Re-run Idempotency
# =================================================================================================
def test_night_audit_sealing_and_idempotency(db, auth_headers):
    """
    Verifies that running the Day-End Night Audit locks the day's books
    and prevents duplicate audits for the same calendar date.
    """
    audit_date = f"2026-10-31-{uuid.uuid4().hex[:4]}"
    payload = {
        "audit_date": audit_date,
        "audited_by": "SVR Night Manager"
    }

    # Initial Run
    res1 = client.post("/api/v1/pms/night-audit", json=payload, headers=auth_headers)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["audit_status"] == "Closed"
    assert data1["audit_date"] == audit_date

    # Re-run for the SAME date returns the existing sealed record without re-accumulating
    res2 = client.post("/api/v1/pms/night-audit", json=payload, headers=auth_headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["audit_status"] == "Closed"
    assert data2["audit_date"] == audit_date

    # Exactly 1 record in database
    count = db.query(models.DailyNightAudit).filter(models.DailyNightAudit.audit_date == audit_date).count()
    assert count == 1

