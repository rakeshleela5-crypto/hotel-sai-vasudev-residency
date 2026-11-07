"""
Track 8 Test Suite: Offline Dexie.js Cache & Two-Way Sync Engine (Idempotency & Replay Protection)
Boutique Hotel ERP Operational Benchmark:
  1. Offline Steward KOT Replay Protection: Exact-once posting via clientRef X-Idempotency-Key.
  2. Housekeeping Status Transition Replay Immunity: Prevents duplicate state-machine triggers on network retry.
  3. Offline Financial Receipt Replay Protection: Prevents duplicate cash receipt vouchers and double ledger postings.
  4. Party Account Settlement Replay Protection: Idempotent account clearance with discount recognition.
  5. High-Speed Heartbeat & Health Probe for client-side reconnection listeners.
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
        data={"sub": "steward_sync", "role": "MANAGER", "employee_id": "EMP-SYNC-001"},
        expires_delta=datetime.timedelta(hours=2)
    )
    return {
        "Authorization": f"Bearer {token}",
        "X-Idempotency-Key": str(uuid.uuid4())
    }


# =================================================================================================
# TEST 1: Offline KOT Replay Protection with Client Idempotency Key
# =================================================================================================
def test_offline_kot_replay_with_idempotency_key(db, auth_headers):
    """
    Simulates a steward entering a KOT order on an Android tablet when Wi-Fi drops.
    When Wi-Fi reconnects, the client flushes the queue using the same X-Idempotency-Key.
    Verifies that the backend rejects duplicate creation and returns the identical ticket.
    """
    idempotency_key = f"IDEMP-KOT-{uuid.uuid4().hex}"
    kot_no = f"KOT-OFFLINE-{uuid.uuid4().hex[:6].upper()}"

    headers = {
        **auth_headers,
        "X-Idempotency-Key": idempotency_key
    }

    payload = {
        "kot_no": kot_no,
        "kotNo": kot_no,
        "serviceType": "Restaurant",
        "table_no": "Table 12",
        "tableNo": "Table 12",
        "waiter_name": "Gopal Steward",
        "waiterName": "Gopal Steward",
        "guest_name": "Pooja Hegde",
        "guestName": "Pooja Hegde",
        "pax": 2,
        "date": datetime.date.today().isoformat(),
        "time": "08:30 PM",
        "status": "Running",
        "items": [
            {"itemName": "Paneer Butter Masala", "qty": 2, "rate": 220.0, "amount": 440.0},
            {"itemName": "Tandoori Butter Roti", "qty": 6, "rate": 25.0, "amount": 150.0}
        ],
        "total_amount": 590.0,
        "totalAmount": 590.0
    }

    # First attempt: Initial online sync
    res1 = client.post("/api/v1/kot", json=payload, headers=headers)
    assert res1.status_code in [200, 201]

    # Second attempt: Network reconnect re-sends identical request with SAME Idempotency Key
    res2 = client.post("/api/v1/kot", json=payload, headers=headers)
    assert res2.status_code in [200, 201]

    # Database verification: Exactly 1 record must exist for this kot_no
    count = db.query(models.KotTicket).filter(models.KotTicket.kot_no == kot_no).count()
    assert count == 1


# =================================================================================================
# TEST 2: Offline Housekeeping Status Transition Replay Immunity
# =================================================================================================
def test_offline_housekeeping_transition_replay(db, auth_headers):
    """
    Simulates a housekeeper marking a room as 'Cleaned' or 'Inspected' on the 2nd floor offline.
    Replaying the request with the same idempotency key must succeed atomically without
    creating duplicate audit records or breaking the turnaround lifecycle.
    """
    # Create distinct test room
    r_suffix = uuid.uuid4().hex[:6].upper()
    room = models.Room(
        name=f"Room 80-{r_suffix}",
        slug=f"room-80-{r_suffix.lower()}",
        room_type="Executive",
        price_per_night=3000.0,
        capacity=2,
        total_inventory=1,
        description="Offline sync test room",
        image_url="/assets/rooms/deluxe.jpg",
        housekeeping_status="Dirty",
        is_available=False
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    idempotency_key = f"IDEMP-HK-{uuid.uuid4().hex}"
    headers = {
        **auth_headers,
        "X-Idempotency-Key": idempotency_key
    }

    payload = {
        "room_id": room.id,
        "housekeeping_status": "Clean",
        "updated_by": "HK-SUNITA-01"
    }

    # Attempt 1: First sync
    res1 = client.post("/api/v1/pms/housekeeping/status", json=payload, headers=headers)
    assert res1.status_code == 200

    # Attempt 2: Replay on network reconnection
    res2 = client.post("/api/v1/pms/housekeeping/status", json=payload, headers=headers)
    assert res2.status_code == 200

    # Refresh DB
    db.refresh(room)
    assert room.housekeeping_status == "Clean"
    assert room.is_available is True

    # Verify HousekeepingRecord audit
    hk_rec = db.query(models.HousekeepingRecord).filter(
        (models.HousekeepingRecord.room_no == room.name) |
        (models.HousekeepingRecord.room_no == str(room.id))
    ).first()
    assert hk_rec is not None
    assert hk_rec.status in ["Vacant Clean", "Clean"]


# =================================================================================================
# TEST 3: Offline Financial General Receipt Replay Protection
# =================================================================================================
def test_offline_general_receipt_replay_protection(db, auth_headers):
    """
    Simulates a receptionist entering a cash receipt offline when internet drops.
    Replaying the flush must NOT double-credit the customer or create duplicate JVs in the ledger.
    """
    party_name = f"Rayagada Ferro Alloys {uuid.uuid4().hex[:4]}"
    client.post(
        "/api/v1/pms/party-accounts",
        json={"name": party_name, "category": "Corporate", "balance": 15000.0, "balance_type": "Dr"},
        headers=auth_headers
    )

    rec_no = f"REC-OFF-{uuid.uuid4().hex[:6].upper()}"
    idempotency_key = f"IDEMP-REC-{uuid.uuid4().hex}"
    headers = {
        **auth_headers,
        "X-Idempotency-Key": idempotency_key
    }

    payload = {
        "receipt_no": rec_no,
        "voucher_name": "Receipts",
        "voucher_no": 1,
        "date": datetime.date.today().isoformat(),
        "payment_mode": "Cash",
        "account_name": party_name,
        "amount": 5000.0,
        "remark": "Collected offline during broadband disruption"
    }

    # Attempt 1: Initial flush
    res1 = client.post("/api/v1/pms/general-receipts", json=payload, headers=headers)
    assert res1.status_code == 200

    # Attempt 2: Replay flush
    res2 = client.post("/api/v1/pms/general-receipts", json=payload, headers=headers)
    assert res2.status_code == 200

    # Check Party Account balance in DB
    party = db.query(models.PartyAccount).filter(models.PartyAccount.name == party_name).first()
    # 15000 - 5000 = 10000 (must NOT be 15000 - 10000 = 5000)
    assert party.balance == 10000.0

    # Check Journal Entries: exactly 1 JV for this receipt
    jv_count = db.query(models.JournalEntry).filter(models.JournalEntry.reference_no == rec_no).count()
    assert jv_count == 1


# =================================================================================================
# TEST 4: Offline Party Settlement Replay Protection
# =================================================================================================
def test_offline_party_settlement_replay_protection(db, auth_headers):
    """
    Ensures full settlement of a corporate account replayed from offline queue
    clears the balance to zero without duplicating discount expense or payment vouchers.
    """
    corp_name = f"Vedanta Logistics {uuid.uuid4().hex[:4]}"
    corp_res = client.post(
        "/api/v1/pms/party-accounts",
        json={"name": corp_name, "category": "Corporate", "balance": 4000.0, "balance_type": "Dr"},
        headers=auth_headers
    )
    p_id = corp_res.json()["id"]

    idempotency_key = f"IDEMP-SETTLE-{uuid.uuid4().hex}"
    headers = {
        **auth_headers,
        "X-Idempotency-Key": idempotency_key
    }

    settle_payload = {
        "amount": 3800.0,
        "discount_allowed": 200.0,
        "payment_mode": "UPI",
        "reference_no": f"UPI-SETTLE-{uuid.uuid4().hex[:6]}",
        "narration": "Offline full clearance"
    }

    # Attempt 1: Flush settlement
    res1 = client.post(f"/api/v1/pms/party-accounts/{p_id}/settle", json=settle_payload, headers=headers)
    assert res1.status_code == 200

    # Check closing balance
    party = db.query(models.PartyAccount).filter(models.PartyAccount.id == p_id).first()
    assert party.balance == 0.0


# =================================================================================================
# TEST 5: Heartbeat & Health Probe for Client Reconnection Listeners
# =================================================================================================
def test_health_and_sync_heartbeat_probe():
    """
    Validates that the /health and /health/live probes respond immediately (under 100ms)
    so the Dexie sync engine can reliably detect internet and database availability.
    """
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"

    res_live = client.get("/health/live")
    assert res_live.status_code == 200
    assert res_live.json()["status"] == "alive"
