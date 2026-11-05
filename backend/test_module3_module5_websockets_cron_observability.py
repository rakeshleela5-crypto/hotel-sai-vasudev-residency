import datetime
import gzip
import json
import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.database import Base, engine, get_db
from app import models
from app.config import settings
from app.websocket_manager import ws_manager
from app.utils.caching import rooms_cache, menu_cache, invalidate_rooms_cache, invalidate_menu_cache
from app.services.scheduler import (
    run_night_audit,
    run_database_backup,
    prune_old_backups,
    acquire_advisory_lock,
    release_advisory_lock,
    LOCK_ID_NIGHT_AUDIT,
    LOCK_ID_DB_BACKUP
)
from app.utils.encryption import get_fernet_cipher
from app.utils.auth import create_access_token

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    from app.routes.rooms import seed_rooms_if_empty
    seed_rooms_if_empty(db)
    yield
    db.close()


def test_multi_channel_websocket_lifecycle_and_heartbeat():
    """
    Module 3 (#16, #54):
    Verifies memory-safe WebSocketManager:
    1. Connects and subscribes to channels ('front_desk', 'kitchen_kds', 'housekeeping')
    2. Receives initial connection handshake
    3. Handles 30s client heartbeat 'ping' -> 'pong'
    4. Enforces guaranteed socket cleanup on disconnect
    """
    # Test Front Desk Channel
    with client.websocket_connect("/api/v1/ws/front_desk") as ws_fd:
        # 1. Verify handshake
        handshake = json.loads(ws_fd.receive_text())
        assert handshake["event"] == "CONNECTED"
        assert handshake["channel"] == "front_desk"

        # 2. Verify 30s heartbeat ping -> pong
        ws_fd.send_text("ping")
        pong_res = json.loads(ws_fd.receive_text())
        assert pong_res["type"] == "pong"
        assert pong_res["channel"] == "front_desk"

        # Also test JSON ping
        ws_fd.send_text(json.dumps({"type": "ping"}))
        pong_json = json.loads(ws_fd.receive_text())
        assert pong_json["type"] == "pong"

    # Test Kitchen KDS Channel
    with client.websocket_connect("/api/v1/ws/kitchen_kds") as ws_kds:
        handshake = json.loads(ws_kds.receive_text())
        assert handshake["event"] == "CONNECTED"
        assert handshake["channel"] == "kitchen_kds"

        ws_kds.send_text("ping")
        pong_res = json.loads(ws_kds.receive_text())
        assert pong_res["type"] == "pong"

    # Test Housekeeping Channel
    with client.websocket_connect("/api/v1/ws/housekeeping") as ws_hk:
        handshake = json.loads(ws_hk.receive_text())
        assert handshake["event"] == "CONNECTED"
        assert handshake["channel"] == "housekeeping"

        ws_hk.send_text("ping")
        pong_res = json.loads(ws_hk.receive_text())
        assert pong_res["type"] == "pong"

    # Verify socket cleanup: after exiting contexts, active_connections must be empty
    assert len(ws_manager.active_connections) == 0


def test_targeted_live_event_broadcasting():
    """
    Module 3 (#54, #80):
    Verifies that domain events are routed strictly to subscribed channels:
    - KOT punches -> kitchen_kds and front_desk
    - Housekeeping status changes -> housekeeping and front_desk
    """
    with client.websocket_connect("/api/v1/ws/kitchen_kds") as ws_kds, \
         client.websocket_connect("/api/v1/ws/housekeeping") as ws_hk, \
         client.websocket_connect("/api/v1/ws/front_desk") as ws_fd:

        # Consume initial CONNECTED handshakes
        assert json.loads(ws_kds.receive_text())["event"] == "CONNECTED"
        assert json.loads(ws_hk.receive_text())["event"] == "CONNECTED"
        assert json.loads(ws_fd.receive_text())["event"] == "CONNECTED"

        # 1. Trigger KOT event
        ws_manager.emit_kot_event_sync(
            event_type="KOT_CREATED",
            kot_number="KOT/TEST/001",
            table_number="T-1",
            room_number="101",
            waiter_name="Ramesh",
            items=[{"itemName": "Paneer Butter Masala", "qty": 2}]
        )

        msg_kds = json.loads(ws_kds.receive_text())
        assert msg_kds["event"] == "KOT_CREATED"
        assert msg_kds["kot_number"] == "KOT/TEST/001"

        msg_fd = json.loads(ws_fd.receive_text())
        assert msg_fd["event"] == "KOT_CREATED"

        # 2. Trigger Housekeeping room status change
        ws_manager.emit_room_status_event_sync(
            room_id=1,
            room_name="Room 101",
            housekeeping_status="Clean",
            old_status="Dirty",
            updated_by="Pooja HK"
        )

        msg_hk = json.loads(ws_hk.receive_text())
        assert msg_hk["event"] == "ROOM_STATUS_CHANGED"
        assert msg_hk["room_name"] == "Room 101"
        assert msg_hk["housekeeping_status"] == "Clean"

        msg_fd_hk = json.loads(ws_fd.receive_text())
        assert msg_fd_hk["event"] == "ROOM_STATUS_CHANGED"


def test_ttl_cache_on_rooms_and_menu_with_automatic_invalidation():
    """
    Module 3 (#6, #7):
    Verifies in-memory TTLCache for public room categories & restaurant menus:
    1. First GET /rooms caches catalog
    2. Modifying a room tariff automatically evicts TTLCache
    3. First GET /menu-items caches menu
    4. Adding or deleting menu item evicts TTLCache
    """
    invalidate_rooms_cache()
    invalidate_menu_cache()
    assert len(rooms_cache) == 0
    assert len(menu_cache) == 0

    # 1. First fetch -> cache miss -> cached
    res1 = client.get("/api/v1/rooms")
    assert res1.status_code == 200
    assert len(rooms_cache) > 0
    cached_len = len(rooms_cache)

    # Second fetch -> cache hit
    res2 = client.get("/api/v1/rooms")
    assert res2.status_code == 200
    assert res1.json() == res2.json()

    # 2. Update room tariff -> must invalidate room cache
    res_update = client.post("/api/v1/pms/rooms", json={
        "room_no": "101",
        "room_type": "Executive Suite",
        "tariff": 3500.0,
        "status": "Clean"
    })
    assert res_update.status_code == 200
    assert len(rooms_cache) == 0  # Evicted!

    # 3. Test Menu Caching
    res_menu1 = client.get("/api/v1/pms/menu-items")
    assert res_menu1.status_code == 200
    assert len(menu_cache) > 0

    # Second fetch -> cache hit
    res_menu2 = client.get("/api/v1/pms/menu-items")
    assert res_menu2.status_code == 200
    assert res_menu1.json() == res_menu2.json()

    # 4. Save new menu item -> must invalidate menu cache
    res_add_menu = client.post("/api/v1/pms/menu-items", json={
        "item_code": "PANEER_TIKKA_TEST",
        "name": "Paneer Tikka Test",
        "category": "Starters",
        "rate": 280.0
    })
    assert res_add_menu.status_code == 200
    assert len(menu_cache) == 0  # Evicted!


def test_advisory_locks_concurrency_prevention():
    """
    Module 5 (#41, #97):
    Verifies that PostgreSQL advisory locks prevent duplicate simultaneous execution.
    """
    db = next(get_db())
    lock_id = LOCK_ID_NIGHT_AUDIT

    # Acquire lock
    acq1 = acquire_advisory_lock(db, lock_id)
    assert acq1 is True

    # Attempting to acquire again while held must return False
    acq2 = acquire_advisory_lock(db, lock_id)
    assert acq2 is False

    # Release lock
    rel = release_advisory_lock(db, lock_id)
    assert rel is True

    # Can acquire again after release
    acq3 = acquire_advisory_lock(db, lock_id)
    assert acq3 is True
    release_advisory_lock(db, lock_id)


def test_automated_night_audit_execution():
    """
    Module 5 (#41):
    Verifies automated Hotel Night Audit:
    1. Posts nightly room tariff + GST to folios of active in-house guests (Checked-In)
    2. Flags confirmed bookings with past check-in date as No-Show
    3. Reconciles daily revenues and persists DailyNightAudit + audit_logs
    """
    db = next(get_db())
    today_str = datetime.date.today().isoformat()
    yesterday_str = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()

    # Create active in-house guest
    booking_in_house = models.Booking(
        booking_ref=f"SVR-AUDIT-{uuid.uuid4().hex[:6].upper()}",
        invoice_number=f"INV-AUDIT-{uuid.uuid4().hex[:6].upper()}",
        room_id=1,
        guest_name="In-House Pilgrim",
        guest_email="inhouse@example.com",
        guest_phone="9876543210",
        check_in_date=today_str,
        check_out_date=(datetime.date.today() + datetime.timedelta(days=2)).isoformat(),
        base_rate=2500.0,
        base_amount=2232.14,
        total_tax=267.86,
        total_price=2500.0,
        status="Checked-In"
    )
    db.add(booking_in_house)

    # Create unarrived reservation that should become No-Show
    booking_no_show = models.Booking(
        booking_ref=f"SVR-NOSHOW-{uuid.uuid4().hex[:6].upper()}",
        invoice_number=f"INV-NOSHOW-{uuid.uuid4().hex[:6].upper()}",
        room_id=2,
        guest_name="Unarrived Guest",
        guest_email="noshow@example.com",
        guest_phone="9876543211",
        check_in_date=yesterday_str,
        check_out_date=today_str,
        base_rate=2000.0,
        base_amount=1785.71,
        total_tax=214.29,
        total_price=2000.0,
        status="Confirmed"
    )
    db.add(booking_no_show)
    db.commit()

    # Execute night audit for today
    result = run_night_audit(db=db, audit_date=today_str)
    assert result["status"] == "success"
    assert result["posted_folios_count"] >= 1
    assert result["no_shows_count"] >= 1

    # Verify no-show updated
    db.refresh(booking_no_show)
    assert booking_no_show.status == "No-Show"
    assert "Automated Night Audit" in booking_no_show.cancellation_reason

    # Verify folio charge posted
    folio_item = db.query(models.RoomFolioItem).filter(
        models.RoomFolioItem.booking_id == booking_in_house.id,
        models.RoomFolioItem.item_type == "ROOM_TARIFF"
    ).first()
    assert folio_item is not None
    assert folio_item.total_amount == 2500.0
    assert folio_item.gst_rate == 12.0

    # Verify DailyNightAudit entry exists
    audit_rec = db.query(models.DailyNightAudit).filter(
        models.DailyNightAudit.audit_date == today_str
    ).first()
    assert audit_rec is not None
    assert audit_rec.audit_status == "Closed"

    # Verify immutable audit log recorded
    log_rec = db.query(models.AuditLog).filter(
        models.AuditLog.action == "NIGHT_AUDIT_EXECUTED"
    ).order_by(models.AuditLog.id.desc()).first()
    assert log_rec is not None


def test_automated_encrypted_database_backup_and_pruning():
    """
    Module 5 (#97, #98):
    Verifies automated PostgreSQL backup pipeline:
    1. Generates SQL dump
    2. Compresses with gzip
    3. Encrypts with Fernet symmetric key
    4. Uploads to Cloudflare R2 under backups/db/
    5. Prunes backup artifacts older than 30 days
    """
    db = next(get_db())

    # Execute backup
    res = run_database_backup(db=db)
    assert res["status"] == "success"
    backup_key = res["backup_key"]
    assert backup_key.startswith("backups/db/sai-vasudev-backup-")
    assert backup_key.endswith(".sql.gz.enc")
    assert res["encrypted_size_bytes"] > 0

    # Verify Fernet decryption and gzip decompression of the resulting artifact
    cipher = get_fernet_cipher()
    
    # Read backed up payload from local storage fallback
    from app.services.r2_storage import r2_service
    local_path = os.path.join(r2_service.local_storage_path, backup_key.replace("/", os.sep))
    if os.path.exists(local_path):
        with open(local_path, "rb") as f:
            enc_data = f.read()
        decrypted_gz = cipher.decrypt(enc_data)
        decompressed_sql = gzip.decompress(decrypted_gz).decode("utf-8")
        assert "SRI SAI VASUDEV RESIDENCY Database Backup Dump" in decompressed_sql or "Hotel Sai Vasudev Residency Database Backup Dump" in decompressed_sql
        assert "rooms" in decompressed_sql

    # Test backup pruning
    pruned = prune_old_backups(days_to_keep=30)
    assert isinstance(pruned, int)


def test_observability_liveness_and_readiness_probes():
    """
    Module 5 (#74, #75, #76, #77):
    Verifies Kubernetes/Railway health probes:
    - GET /api/v1/health/live returns instant 200 OK
    - GET /api/v1/health/ready returns deep diagnostic 200 OK with DB connectivity
    """
    # 1. Liveness Probe
    res_live = client.get("/api/v1/health/live")
    assert res_live.status_code == 200
    data_live = res_live.json()
    assert data_live["status"] == "alive"
    assert data_live["service"] == "hotel-sai-vasudev-backend"

    # 2. Readiness Probe
    res_ready = client.get("/api/v1/health/ready")
    assert res_ready.status_code == 200
    data_ready = res_ready.json()
    assert data_ready["status"] == "ready"
    assert data_ready["database"] == "connected"
    assert "r2_storage" in data_ready
    assert "decentro_circuit" in data_ready


def test_structured_logging_with_x_request_id_and_global_500_alert():
    """
    Module 5 (#100, #101, #103, #104):
    Verifies:
    1. X-Request-ID propagation: when provided by client, preserved on response
    2. X-Request-ID generation: when omitted by client, generated on response
    3. Global 500 error handler catches unhandled exceptions, sanitizes response,
       returns request_id, and triggers error webhook alert.
    """
    # 1. Provided X-Request-ID
    custom_req_id = "req_custom_trace_98765"
    res1 = client.get("/api/v1/health/live", headers={"X-Request-ID": custom_req_id})
    assert res1.status_code == 200
    assert res1.headers["X-Request-ID"] == custom_req_id

    # 2. Omitted X-Request-ID
    res2 = client.get("/api/v1/health/live")
    assert res2.status_code == 200
    assert "X-Request-ID" in res2.headers
    assert res2.headers["X-Request-ID"].startswith("req_")

    # 3. Global 500 Unhandled Exception Handler
    res_500 = client.get("/api/v1/health/test-error-500", headers={"X-Request-ID": "req_crash_test_12345"})
    assert res_500.status_code == 500
    data_500 = res_500.json()
    assert data_500["request_id"] == "req_crash_test_12345"
    assert "Internal server error" in data_500["detail"]
    assert res_500.headers["X-Request-ID"] == "req_crash_test_12345"
    # Crucial security rule: internal Python stack traces must NEVER leak to public clients
    assert "Traceback" not in data_500["detail"]
