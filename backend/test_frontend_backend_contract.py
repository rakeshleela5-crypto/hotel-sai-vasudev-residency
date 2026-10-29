"""
Frontend <-> Backend Architecture Integration Test Suite
Validates the full contract between the React Vite frontend and FastAPI backend:
1. UUIDv4 X-Idempotency-Key handling on KOT and Booking mutations (#1)
2. Silent JWT refresh token rotation on auth session (#47)
3. Multi-channel WebSocket endpoints (/api/v1/ws/front_desk, /ws/kitchen_kds, /ws/housekeeping) with heartbeat (#54)
4. Decentro Circuit Breaker fallback response schema (decentro_unavailable: true) (#13)
5. Offline KOT sync endpoint (/api/v1/kot alias) parity
"""

import uuid
import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, SessionLocal
from app import models
from app.services.decentro import circuit_breaker

client = TestClient(app)

def test_kot_sync_endpoint_with_idempotency_key():
    """
    Requirement 1 & 2:
    Validates that the frontend offline queue flushes to /api/v1/kot
    with UUIDv4 X-Idempotency-Key and succeeds idempotently.
    """
    idempotency_key = str(uuid.uuid4())
    kot_no = f"KOT-SYNC-{uuid.uuid4().hex[:6].upper()}"

    payload = {
        "kot_no": kot_no,
        "kotNo": kot_no,
        "serviceType": "Room",
        "room_no": "101",
        "roomNo": "101",
        "waiter_name": "Mobile Steward",
        "guest_name": "Offline Test Pilgrim",
        "pax": 2,
        "items": [
            {"sNo": 1, "itemName": "MASALA CHAI", "qty": 2, "rate": 20.0, "amount": 40.0},
            {"sNo": 2, "itemName": "POHA", "qty": 1, "rate": 50.0, "amount": 50.0}
        ],
        "total_amount": 90.0,
        "totalAmount": 90.0,
        "status": "Running",
        "isPrinted": False
    }

    # 1. Initial POST mutation with X-Idempotency-Key
    headers = {"X-Idempotency-Key": idempotency_key}
    res1 = client.post("/api/v1/kot", json=payload, headers=headers)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1.get("success") is True or data1.get("status") in ("PLACED", "Running", "success", "created")
    assert data1.get("kot_number") == kot_no or data1.get("kot_no") == kot_no

    # 2. Duplicate retry with same X-Idempotency-Key (simulating Wi-Fi flutter/re-flush)
    res2 = client.post("/api/v1/kot", json=payload, headers=headers)
    assert res2.status_code in (200, 201)
    data2 = res2.json()
    assert data2.get("kot_number") == kot_no or data2.get("kot_no") == kot_no


def test_silent_jwt_refresh_token_rotation():
    """
    Requirement 1:
    Validates that the frontend API client can rotate refresh tokens
    and obtain fresh 15-minute access tokens upon 401 Unauthorized (#47).
    """
    # 1. Login to obtain access + refresh tokens
    login_res = client.post("/api/v1/auth/login", json={
        "username": "frontdesk_staff",
        "password": "password123",
        "role": "RECEPTIONIST"
    })
    assert login_res.status_code == 200
    tokens = login_res.json()
    refresh_token = tokens["refresh_token"]
    old_access_token = tokens["access_token"]
    assert refresh_token is not None
    assert old_access_token is not None

    # 2. Execute Silent Token Rotation via /api/v1/auth/refresh
    refresh_res = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert refresh_res.status_code == 200
    rotated = refresh_res.json()
    new_access_token = rotated["access_token"]
    new_refresh_token = rotated["refresh_token"]

    assert new_access_token is not None
    assert new_refresh_token is not None
    assert new_refresh_token != refresh_token  # Must rotate!

    # 3. Old refresh token must be revoked immediately (#47)
    revoked_try = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert revoked_try.status_code == 401
    assert "revoked" in revoked_try.json()["detail"].lower()


def test_multi_channel_websockets_frontend_contract():
    """
    Requirement 3:
    Validates WebSocket endpoints for all frontend channels:
    - /api/v1/ws/front_desk (Room Rack)
    - /api/v1/ws/kitchen_kds (Kitchen KDS)
    - /api/v1/ws/housekeeping (Housekeeping mobile)
    """
    channels = ["front_desk", "kitchen_kds", "housekeeping"]

    for ch in channels:
        with client.websocket_connect(f"/api/v1/ws/{ch}") as ws:
            # Receive welcome / connection message
            welcome = ws.receive_json()
            assert welcome["channel"] == ch

            # Test 30s heartbeat ping-pong
            ws.send_json({"type": "ping", "channel": ch, "timestamp": 1234567890})
            pong = ws.receive_json()
            assert pong["type"] == "pong"


def test_decentro_circuit_breaker_fallback_payload():
    """
    Requirement 1:
    Validates that when Decentro is in fallback or circuit breaker open,
    the response provides decentro_unavailable: true and manual POS fallback mode (#13).
    """
    # Force trip circuit breaker for test
    circuit_breaker.state = "OPEN"
    circuit_breaker.failure_count = 5

    headers = {"X-Idempotency-Key": str(uuid.uuid4())}
    res = client.post("/api/v1/payments/decentro/upi-qr", json={
        "amount": 2500.0,
        "purpose_message": "Circuit breaker fallback test"
    }, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["decentro_unavailable"] is True
    assert data["fallback_mode"] in ("MANUAL_CASH_CARD_POS", "MANUAL_POS_CASH")

    # Reset circuit breaker
    circuit_breaker.reset()
    assert circuit_breaker.state == "CLOSED"
