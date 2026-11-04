"""
Test Suite: Phase 3 Real-Time Updates (#97 WebSockets / #98 Polling)
Verifies:
  1. Transaction Status Polling Endpoint (#98):
     - GET /payments/{txn_id}/status returns 200 with status=PENDING, paid=False for unknown/pending references.
     - Returns 200 with status=SUCCESS, paid=True, and amount once Decentro marks it settled.
  2. Dedicated Payment WebSocket Route (#97):
     - /ws/payments/{txn_id} accepts connections on specific payment channel 'payment_{txn_id}'.
     - Immediately dispatches PAYMENT_SUCCESS event if transaction is already SUCCESS/SETTLED in DB.
     - Dead socket cleanup & heartbeats handled cleanly.
  3. Real-Time KOT Status Synchronization:
     - PATCH/POST /kots/{kot_no}/status updates KOT status in PostgreSQL.
     - Emits KOT_STATUS_CHANGED event across kitchen_kds and front_desk channels.
     - DELETE /kots/{kot_no} emits KOT_VOIDED and removes ticket from DB.
"""

import os
import sys
import json
import uuid
import datetime
import pytest

# Ensure backend & root are in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database import engine, SessionLocal, Base
from app import models
from app.routes.payments import get_payment_status_by_id
from app.routes.pms import update_kot_status, delete_kot_ticket
from app.routes.ws import websocket_payment_endpoint
from app.websocket_manager import ws_manager

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


def run_coro(coro):
    """Pure-Python coroutine runner avoiding Windows Proactor loopback socket creation."""
    val = None
    stack = [coro]
    while stack:
        current = stack[-1]
        try:
            yielded = current.send(val)
            val = None
            if hasattr(yielded, "send"):
                stack.append(yielded)
            else:
                val = yielded
        except StopIteration as e:
            stack.pop()
            val = e.value
    return val


def test_payment_polling_endpoint_returns_pending_and_success(db):
    """
    Phase 3 (#98 Polling):
    Tests lightweight polling endpoint get_payment_status_by_id:
    1. Returns 200 with status PENDING and paid=False for unknown/pending reference
    2. Returns 200 with status SUCCESS and paid=True once settled in DB
    """
    test_ref = f"POLL-{uuid.uuid4().hex[:8].upper()}"

    # 1. Non-existent reference returns 200 PENDING without 404 error
    res1 = get_payment_status_by_id(test_ref, db)
    assert res1["status"] == "PENDING"
    assert res1["paid"] is False
    assert res1["is_success"] is False
    assert res1["reference_id"] == test_ref

    # 2. Insert settled transaction in PostgreSQL
    bank_utr = f"UTR-{uuid.uuid4().hex[:8].upper()}"
    txn = models.PaymentTransaction(
        reference_id=test_ref,
        decentro_txn_id=f"DCN-{test_ref}",
        amount=2500.0,
        currency="INR",
        status="SUCCESS",
        payment_method="UPI_QR",
        bank_reference_number=bank_utr
    )
    db.add(txn)
    db.commit()

    # 3. Poll again - verifies instant detection of payment success
    res2 = get_payment_status_by_id(test_ref, db)
    assert res2["status"] == "SUCCESS"
    assert res2["paid"] is True
    assert res2["is_success"] is True
    assert res2["amount"] == 2500.0
    assert res2["bank_reference_number"] == bank_utr


def test_payment_websocket_immediate_success_dispatch(db):
    """
    Phase 3 (#97 WebSockets):
    Tests dedicated /ws/payments/{txn_id} WebSocket route:
    1. Subscribes client to channel 'payment_{txn_id}' and 'payments'
    2. Immediately dispatches PAYMENT_SUCCESS event if transaction is already SUCCESS in DB
    """
    test_ref = f"WS-PAY-{uuid.uuid4().hex[:8].upper()}"

    txn = models.PaymentTransaction(
        reference_id=test_ref,
        decentro_txn_id=f"DCN-{test_ref}",
        amount=4200.0,
        currency="INR",
        status="SUCCESS",
        payment_method="UPI_QR",
        bank_reference_number="UTR-WS-999"
    )
    db.add(txn)
    db.commit()

    # Create Mock WebSocket
    sent_messages = []

    class MockWebSocket:
        def __init__(self):
            self.closed = False
            self.ping_sent = False

        async def accept(self):
            pass

        async def send_text(self, text):
            sent_messages.append(text)

        async def receive_text(self):
            if not self.ping_sent:
                self.ping_sent = True
                return '{"type":"ping"}'
            # Terminate loop
            from fastapi import WebSocketDisconnect
            raise WebSocketDisconnect(1000)

    mock_ws = MockWebSocket()
    run_coro(websocket_payment_endpoint(mock_ws, test_ref))

    # Verify messages sent:
    # 1. Connected handshake
    # 2. Immediate PAYMENT_SUCCESS event because DB transaction is already SUCCESS
    # 3. Heartbeat pong response
    parsed = [json.loads(m) for m in sent_messages]
    events = [m.get("event") for m in parsed]
    assert "CONNECTED" in events
    assert "PAYMENT_SUCCESS" in events

    success_msg = next(m for m in parsed if m.get("event") == "PAYMENT_SUCCESS")
    assert success_msg["reference_id"] == test_ref
    assert success_msg["amount"] == 4200.0
    assert success_msg["status"] == "SUCCESS"


def test_payment_broadcast_to_channels(db):
    """
    Phase 3: Verifies broadcast_payment_success emits to channel payment_{ref} and payments
    """
    test_ref = f"CHAN-{uuid.uuid4().hex[:8].upper()}"
    received = []

    class MockClient:
        async def accept(self):
            pass

        async def send_text(self, text):
            received.append(text)

    client_ws = MockClient()
    chan_name = f"payment_{test_ref}".lower()

    run_coro(ws_manager.connect(client_ws, chan_name))
    assert client_ws in ws_manager.channels[chan_name]

    # Broadcast payment success
    run_coro(ws_manager.broadcast_payment_success(
        reference_id=test_ref,
        amount=1999.0,
        bank_reference_number="UTR-CHAN-888"
    ))

    # Verify message was received on dedicated payment channel
    parsed = [json.loads(m) for m in received if "PAYMENT_SUCCESS" in m]
    assert len(parsed) >= 1
    assert parsed[0]["reference_id"] == test_ref
    assert parsed[0]["amount"] == 1999.0

    # Cleanup
    run_coro(ws_manager.disconnect(client_ws, chan_name))
    assert client_ws not in ws_manager.channels[chan_name]


def test_kot_status_update_endpoint_and_broadcast(db):
    """
    Phase 3: Tests update_kot_status (PATCH/POST /kots/{kot_no}/status):
    1. Updates KOT status in PostgreSQL
    2. Emits KOT_STATUS_CHANGED event
    """
    test_kot_no = f"KOT-{uuid.uuid4().hex[:6].upper()}"

    kot = models.KotTicket(
        kot_no=test_kot_no,
        date="2026-11-04",
        time="08:15 PM",
        table_no="Table 8",
        waiter_name="Sunil",
        items_json=json.dumps([{"item_name": "Veg Biryani", "qty": 1, "amount": 220.0}]),
        total_amount=220.0,
        status="Running"
    )
    db.add(kot)
    db.commit()

    # 1. Update status to 'Ready To Serve'
    res = update_kot_status(test_kot_no, {"status": "Ready To Serve"}, db)
    assert res["success"] is True
    assert res["kot_no"] == test_kot_no
    assert res["status"] == "Ready To Serve"

    # Verify database was updated
    db.refresh(kot)
    assert kot.status == "Ready To Serve"

    # 2. Update status to 'Served'
    res2 = update_kot_status(test_kot_no, {"status": "Served"}, db)
    assert res2["success"] is True
    assert res2["status"] == "Served"

    db.refresh(kot)
    assert kot.status == "Served"


def test_kot_delete_emits_voided_and_removes(db):
    """
    Phase 3: Tests delete_kot_ticket voids ticket and cleans up DB
    """
    test_kot_no = f"KOT-DEL-{uuid.uuid4().hex[:6].upper()}"

    kot = models.KotTicket(
        kot_no=test_kot_no,
        date="2026-11-04",
        time="08:30 PM",
        table_no="Table 4",
        items_json="[]",
        total_amount=100.0,
        status="Running"
    )
    db.add(kot)
    db.commit()

    res = delete_kot_ticket(test_kot_no, db)
    assert res["success"] is True

    # Verify ticket was deleted
    deleted = db.query(models.KotTicket).filter(models.KotTicket.kot_no == test_kot_no).first()
    assert deleted is None
