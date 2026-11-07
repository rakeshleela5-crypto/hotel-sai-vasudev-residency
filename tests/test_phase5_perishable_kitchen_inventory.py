import datetime
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import get_db
from app import models
from app.utils.timezone import now_utc
from app.utils.money import rupees_to_paise

client = TestClient(app)

@pytest.fixture
def db_session():
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

# -------------------------------------------------------------------------
# Test 1: Ingest discrete inventory lot with shelf-life expiry tracking
# -------------------------------------------------------------------------
def test_create_inventory_lot_with_expiry(db_session: Session):
    expiry_dt = (now_utc() + datetime.timedelta(days=4)).isoformat()
    payload = {
        "item_name": "Fresh Malai Paneer",
        "category": "Dairy",
        "store_name": "Kitchen Store",
        "expiry_date": expiry_dt,
        "unit_of_measure": "kg",
        "quantity": 25.0,
        "unit_cost": 320.0,
        "supplier_name": "Rayagada Fresh Dairy Cooperative",
        "invoice_ref": "INV-RFD-8821"
    }

    res = client.post("/api/v1/pms/inventory/lots", json=payload)
    assert res.status_code == 201
    data = res.json()

    assert data["lot_number"].startswith("SVR/")
    assert "/LOT-" in data["lot_number"]
    assert data["item_name"] == "Fresh Malai Paneer"
    assert data["initial_quantity"] == 25.0
    assert data["remaining_quantity"] == 25.0
    assert data["unit_cost"] == 320.0
    assert data["unit_cost_paise"] == 32000
    assert data["status"] == "Active"
    assert data["is_expired"] is False
    assert data["days_until_expiry"] is not None
    assert 3.5 <= data["days_until_expiry"] <= 4.5

# -------------------------------------------------------------------------
# Test 2: Query inventory lots with store & category filtering
# -------------------------------------------------------------------------
def test_list_inventory_lots_filtering(db_session: Session):
    # Ingest distinct items
    client.post("/api/v1/pms/inventory/lots", json={
        "item_name": "Cow Milk Pouches",
        "category": "Dairy",
        "store_name": "Kitchen Store",
        "quantity": 30.0,
        "unit_cost": 55.0,
        "unit_of_measure": "L"
    })
    client.post("/api/v1/pms/inventory/lots", json={
        "item_name": "Basmati Rice Royal",
        "category": "Groceries",
        "store_name": "Central Store",
        "quantity": 100.0,
        "unit_cost": 95.0,
        "unit_of_measure": "kg"
    })

    # Filter Dairy in Kitchen Store
    res = client.get("/api/v1/pms/inventory/lots?category=Dairy&store_name=Kitchen Store")
    assert res.status_code == 200
    dairy_lots = res.json()
    assert len(dairy_lots) >= 1
    assert all(l["category"] == "Dairy" for l in dairy_lots)
    assert all(l["store_name"] == "Kitchen Store" for l in dairy_lots)

# -------------------------------------------------------------------------
# Test 3: FIFO Requisition strictly consumes oldest batch first
# -------------------------------------------------------------------------
def test_fifo_requisition_depletes_oldest_lot_first(db_session: Session):
    unique_item = f"Special Tea Dust_{now_utc().timestamp()}"

    # Lot 1: Ingested earlier (e.g. 2 days ago) at ₹400/kg
    lot1_res = client.post("/api/v1/pms/inventory/lots", json={
        "item_name": unique_item,
        "category": "Beverages",
        "store_name": "Kitchen Store",
        "purchase_date": (now_utc() - datetime.timedelta(days=2)).isoformat(),
        "quantity": 10.0,
        "unit_cost": 400.0,
        "unit_of_measure": "kg"
    })
    lot1_id = lot1_res.json()["id"]

    # Lot 2: Ingested today at ₹420/kg
    lot2_res = client.post("/api/v1/pms/inventory/lots", json={
        "item_name": unique_item,
        "category": "Beverages",
        "store_name": "Kitchen Store",
        "purchase_date": now_utc().isoformat(),
        "quantity": 10.0,
        "unit_cost": 420.0,
        "unit_of_measure": "kg"
    })
    lot2_id = lot2_res.json()["id"]

    # Requisition 6 kg
    req_res = client.post("/api/v1/pms/inventory/requisitions/fifo-deduct", json={
        "item_name": unique_item,
        "quantity_requested": 6.0,
        "store_name": "Kitchen Store",
        "requested_by": "Head Chef Ramesh",
        "department": "Vasudev Rasoi (Kitchen)"
    })
    assert req_res.status_code == 200
    req_data = req_res.json()

    assert req_data["status"] == "success"
    assert req_data["total_deducted"] == 6.0
    assert req_data["total_cost"] == 2400.0  # 6.0 * 400.0
    assert req_data["total_cost_paise"] == 240000
    assert len(req_data["lots_consumed"]) == 1
    assert req_data["lots_consumed"][0]["lot_id"] == lot1_id
    assert req_data["lots_consumed"][0]["quantity_deducted"] == 6.0

    # Verify Lot 1 remaining quantity is 4.0 and Lot 2 remains untouched at 10.0
    db_lot1 = db_session.query(models.InventoryLot).filter(models.InventoryLot.id == lot1_id).first()
    db_lot2 = db_session.query(models.InventoryLot).filter(models.InventoryLot.id == lot2_id).first()
    assert round(db_lot1.remaining_quantity, 2) == 4.0
    assert db_lot1.status == "Active"
    assert round(db_lot2.remaining_quantity, 2) == 10.0

# -------------------------------------------------------------------------
# Test 4: FIFO Requisition spans multiple lots when older lot is exhausted
# -------------------------------------------------------------------------
def test_fifo_requisition_spans_multiple_lots(db_session: Session):
    unique_item = f"Farm Butter_{now_utc().timestamp()}"

    # Lot 1: 5 kg @ ₹500/kg
    l1 = client.post("/api/v1/pms/inventory/lots", json={
        "item_name": unique_item,
        "category": "Dairy",
        "store_name": "Kitchen Store",
        "purchase_date": (now_utc() - datetime.timedelta(days=1)).isoformat(),
        "quantity": 5.0,
        "unit_cost": 500.0,
        "unit_of_measure": "kg"
    }).json()

    # Lot 2: 10 kg @ ₹520/kg
    l2 = client.post("/api/v1/pms/inventory/lots", json={
        "item_name": unique_item,
        "category": "Dairy",
        "store_name": "Kitchen Store",
        "purchase_date": now_utc().isoformat(),
        "quantity": 10.0,
        "unit_cost": 520.0,
        "unit_of_measure": "kg"
    }).json()

    # Requisition 8 kg (must exhaust all 5 kg of Lot 1 + 3 kg of Lot 2)
    req_res = client.post("/api/v1/pms/inventory/requisitions/fifo-deduct", json={
        "item_name": unique_item,
        "quantity_requested": 8.0,
        "store_name": "Kitchen Store",
        "requested_by": "Chef Sanjeev"
    })
    assert req_res.status_code == 200
    data = req_res.json()

    assert data["total_deducted"] == 8.0
    # Expected cost: (5 * 500) + (3 * 520) = 2500 + 1560 = 4060.0
    assert data["total_cost"] == 4060.0
    assert data["total_cost_paise"] == 406000
    assert len(data["lots_consumed"]) == 2

    seg1 = data["lots_consumed"][0]
    seg2 = data["lots_consumed"][1]
    assert seg1["lot_id"] == l1["id"]
    assert seg1["quantity_deducted"] == 5.0
    assert seg2["lot_id"] == l2["id"]
    assert seg2["quantity_deducted"] == 3.0

    # Verify Lot 1 is Exhausted, Lot 2 has 7.0 kg remaining
    db_l1 = db_session.query(models.InventoryLot).filter(models.InventoryLot.id == l1["id"]).first()
    db_l2 = db_session.query(models.InventoryLot).filter(models.InventoryLot.id == l2["id"]).first()
    assert round(db_l1.remaining_quantity, 2) == 0.0
    assert db_l1.status == "Exhausted"
    assert round(db_l2.remaining_quantity, 2) == 7.0

# -------------------------------------------------------------------------
# Test 5: FIFO Requisition rejects order exceeding total available stock
# -------------------------------------------------------------------------
def test_fifo_requisition_rejects_insufficient_stock(db_session: Session):
    unique_item = f"Exotic Mushrooms_{now_utc().timestamp()}"

    client.post("/api/v1/pms/inventory/lots", json={
        "item_name": unique_item,
        "category": "Vegetables",
        "store_name": "Kitchen Store",
        "quantity": 3.0,
        "unit_cost": 300.0
    })

    # Attempt to request 10.0 kg when only 3.0 kg available
    res = client.post("/api/v1/pms/inventory/requisitions/fifo-deduct", json={
        "item_name": unique_item,
        "quantity_requested": 10.0,
        "store_name": "Kitchen Store",
        "requested_by": "Sous Chef"
    })
    assert res.status_code == 400
    assert "Insufficient inventory" in res.json()["detail"]

# -------------------------------------------------------------------------
# Test 6: Expiry alerts early warning for perishable kitchen items
# -------------------------------------------------------------------------
def test_expiry_alerts_flags_critical_and_warning_lots(db_session: Session):
    # 1. Expired 2 hours ago
    expired_lot = client.post("/api/v1/pms/inventory/lots", json={
        "item_name": "Curd Packets (Sour)",
        "category": "Dairy",
        "expiry_date": (now_utc() - datetime.timedelta(hours=2)).isoformat(),
        "quantity": 4.0,
        "unit_cost": 40.0
    }).json()

    # 2. Expiring in 18 hours (HIGH_EXPIRING_SOON)
    soon_lot = client.post("/api/v1/pms/inventory/lots", json={
        "item_name": "Fresh Cream 500ml",
        "category": "Dairy",
        "expiry_date": (now_utc() + datetime.timedelta(hours=18)).isoformat(),
        "quantity": 8.0,
        "unit_cost": 120.0
    }).json()

    # 3. Expiring in 10 days (Beyond 48h window)
    safe_lot = client.post("/api/v1/pms/inventory/lots", json={
        "item_name": "Canned Corn",
        "category": "Groceries",
        "expiry_date": (now_utc() + datetime.timedelta(days=10)).isoformat(),
        "quantity": 20.0,
        "unit_cost": 80.0
    }).json()

    res = client.get("/api/v1/pms/inventory/expiry-alerts?threshold_hours=48")
    assert res.status_code == 200
    alerts = res.json()

    alert_lot_ids = [a["lot_id"] for a in alerts]
    assert expired_lot["id"] in alert_lot_ids
    assert soon_lot["id"] in alert_lot_ids
    assert safe_lot["id"] not in alert_lot_ids

    exp_alert = next(a for a in alerts if a["lot_id"] == expired_lot["id"])
    assert exp_alert["alert_level"] == "CRITICAL_EXPIRED"

    soon_alert = next(a for a in alerts if a["lot_id"] == soon_lot["id"])
    assert soon_alert["alert_level"] == "HIGH_EXPIRING_SOON"

# -------------------------------------------------------------------------
# Test 7: Record food waste/spoilage under ₹1,000 threshold (No PIN needed)
# -------------------------------------------------------------------------
def test_record_spoilage_under_threshold_no_pin(db_session: Session):
    lot = client.post("/api/v1/pms/inventory/lots", json={
        "item_name": "Ripe Tomatoes",
        "category": "Vegetables",
        "quantity": 20.0,
        "unit_cost": 30.0,
        "unit_of_measure": "kg"
    }).json()

    # Waste 5 kg (loss = 5 * 30 = ₹150 < ₹1,000 threshold)
    waste_res = client.post("/api/v1/pms/inventory/spoilage", json={
        "lot_id": lot["id"],
        "quantity_wasted": 5.0,
        "waste_reason": "Spoilage",
        "reported_by": "Pantry Supervisor Sunita",
        "action_taken": "Disposed in Organic Waste"
    })
    assert waste_res.status_code == 201
    w_data = waste_res.json()

    assert w_data["voucher_no"].startswith("SVR/")
    assert "/WST-" in w_data["voucher_no"]
    assert w_data["quantity_wasted"] == 5.0
    assert w_data["total_loss_rupees"] == 150.0
    assert w_data["total_loss_paise"] == 15000
    assert w_data["waste_reason"] == "Spoilage"

    # Verify lot balance reduced from 20 to 15
    db_lot = db_session.query(models.InventoryLot).filter(models.InventoryLot.id == lot["id"]).first()
    assert round(db_lot.remaining_quantity, 2) == 15.0

    # Verify balanced General Ledger Journal Entry was posted
    assert w_data["journal_entry_id"] is not None
    je = db_session.query(models.JournalEntry).filter(models.JournalEntry.id == w_data["journal_entry_id"]).first()
    assert je is not None
    assert je.debit_account == "Kitchen Spoilage & Wastage Loss A/c"
    assert je.credit_account == "Kitchen Inventory & Raw Materials A/c"
    assert je.amount_paise == 15000
    assert je.amount_rupees == 150.0

# -------------------------------------------------------------------------
# Test 8: High-value wastage (>= ₹1,000) enforces Manager PIN verification
# -------------------------------------------------------------------------
def test_record_spoilage_high_value_requires_manager_pin(db_session: Session):
    lot = client.post("/api/v1/pms/inventory/lots", json={
        "item_name": "Premium Saffron & Spices",
        "category": "Groceries",
        "quantity": 10.0,
        "unit_cost": 500.0,
        "unit_of_measure": "packets"
    }).json()

    # Attempt to write off 4 packets (loss = ₹2,000 >= ₹1,000) without Manager PIN -> 403 Forbidden
    res_no_pin = client.post("/api/v1/pms/inventory/spoilage", json={
        "lot_id": lot["id"],
        "quantity_wasted": 4.0,
        "waste_reason": "Damaged",
        "reported_by": "Chef Ramesh"
    })
    assert res_no_pin.status_code == 403
    assert "Manager PIN" in res_no_pin.json()["detail"]

    # Attempt with wrong PIN -> 403 Forbidden
    res_wrong_pin = client.post("/api/v1/pms/inventory/spoilage", json={
        "lot_id": lot["id"],
        "quantity_wasted": 4.0,
        "waste_reason": "Damaged",
        "reported_by": "Chef Ramesh",
        "manager_pin": "9999"
    })
    assert res_wrong_pin.status_code == 403

    # Success with correct Manager PIN ("1234")
    res_success = client.post("/api/v1/pms/inventory/spoilage", json={
        "lot_id": lot["id"],
        "quantity_wasted": 4.0,
        "waste_reason": "Damaged",
        "reported_by": "Chef Ramesh",
        "manager_pin": "1234"
    })
    assert res_success.status_code == 201
    data = res_success.json()
    assert data["manager_pin_verified"] is True
    assert data["total_loss_rupees"] == 2000.0

# -------------------------------------------------------------------------
# Test 9: Spoilage rejects attempt to condemn more than lot's remaining stock
# -------------------------------------------------------------------------
def test_record_spoilage_rejects_exceeding_lot_quantity(db_session: Session):
    lot = client.post("/api/v1/pms/inventory/lots", json={
        "item_name": "Cooking Yogurt",
        "category": "Dairy",
        "quantity": 4.0,
        "unit_cost": 45.0
    }).json()

    res = client.post("/api/v1/pms/inventory/spoilage", json={
        "lot_id": lot["id"],
        "quantity_wasted": 10.0,
        "waste_reason": "Spoilage",
        "reported_by": "Pantry Boy"
    })
    assert res.status_code == 400
    assert "Cannot condemn" in res.json()["detail"]

# -------------------------------------------------------------------------
# Test 10: Waste records audit register
# -------------------------------------------------------------------------
def test_list_waste_records_audit_trail(db_session: Session):
    res = client.get("/api/v1/pms/inventory/waste/records")
    assert res.status_code == 200
    records = res.json()
    assert isinstance(records, list)
    assert len(records) >= 2
    first = records[0]
    assert "voucher_no" in first
    assert "total_loss_rupees" in first
    assert "waste_reason" in first
