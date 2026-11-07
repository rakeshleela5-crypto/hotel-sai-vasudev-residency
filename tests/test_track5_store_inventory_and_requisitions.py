import datetime
import uuid
import json
import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.routes.pms import (
    save_inventory_purchase,
    save_stock_transfer,
    action_stock_transfer,
    get_inventory_stock_summary,
    get_low_stock_alerts,
    get_recipe_boms,
    create_kot_ticket
)

def setup_test_godowns(db: Session, prefix: str):
    """Ensure test godowns exist."""
    main_g = models.Godown(
        godown_id=f"g-main-{prefix}",
        s_no=1,
        name=f"Main Store {prefix}",
        address="Ground Floor Central Godown"
    )
    kitchen_g = models.Godown(
        godown_id=f"g-kitch-{prefix}",
        s_no=2,
        name=f"Kitchen Store {prefix}",
        address="Vasudev Rasoi Kitchen Godown"
    )
    db.add(main_g)
    db.add(kitchen_g)
    db.commit()
    return main_g.name, kitchen_g.name

def test_negative_inventory_prevention_and_manager_override(db: Session):
    """
    Track 5: Test that inter-department stock transfers block negative inventory
    at the source store unless authorized with manager PIN override.
    """
    prefix = uuid.uuid4().hex[:6].upper()
    main_name, kitchen_name = setup_test_godowns(db, prefix)

    # 1. Inward purchase: 20 kg Fresh Paneer to Main Store
    pur_payload = schemas.InventoryPurchaseCreate(
        bill_no=f"PUR-{prefix}-01",
        bill_date="2026-11-07",
        godown=main_name,
        supplier_name="Rayagada Dairy Co-op",
        items=[{"itemName": "Fresh Paneer", "qty": 20.0, "rate": 300.0, "amount": 6000.0}],
        total_amount=6000.0,
        tax_amount=0.0,
        net_amount=6000.0
    )
    pur = save_inventory_purchase(pur_payload, db)
    assert pur.bill_no == f"PUR-{prefix}-01"

    # 2. Attempt to transfer 35 kg Fresh Paneer (Requested > Available 20 kg)
    transfer_payload = schemas.StockTransferCreate(
        entry_no=f"ST-{prefix}-01",
        date="2026-11-07",
        from_godown=main_name,
        to_godown=kitchen_name,
        items=[{"itemName": "Fresh Paneer", "qty": 35.0, "rate": 300.0, "amount": 10500.0}],
        total_qty=35.0,
        status="ISSUED",
        allow_negative_override=False
    )

    with pytest.raises(HTTPException) as exc_info:
        save_stock_transfer(transfer_payload, db)
    assert exc_info.value.status_code == 400
    assert "Negative inventory blocked" in exc_info.value.detail
    assert "only has 20.00 available" in exc_info.value.detail

    # 3. Repeat transfer with allow_negative_override=True and manager PIN
    override_payload = schemas.StockTransferCreate(
        entry_no=f"ST-{prefix}-01",
        date="2026-11-07",
        from_godown=main_name,
        to_godown=kitchen_name,
        items=[{"itemName": "Fresh Paneer", "qty": 35.0, "rate": 300.0, "amount": 10500.0}],
        total_qty=35.0,
        status="ISSUED",
        allow_negative_override=True,
        override_reason="Urgent Temple Pilgrimage Thali Prep",
        manager_pin="9999"
    )
    result = save_stock_transfer(override_payload, db)
    assert result["success"] is True
    assert result["entryNo"] == f"ST-{prefix}-01"

    # Verify AuditLog created
    audit = db.query(models.AuditLog).filter(
        models.AuditLog.action == "NEGATIVE_INVENTORY_OVERRIDE",
        models.AuditLog.entity_id == f"ST-{prefix}-01"
    ).first()
    assert audit is not None
    audit_data = json.loads(audit.new_data)
    assert audit_data["reason"] == "Urgent Temple Pilgrimage Thali Prep"

def test_storekeeper_requisition_workflow(db: Session):
    """
    Track 5: Test department store requisition lifecycle:
    PENDING (does not decrement stock) -> Storekeeper ISSUE / REJECT.
    """
    prefix = uuid.uuid4().hex[:6].upper()
    main_name, kitchen_name = setup_test_godowns(db, prefix)

    # Inward 50 kg Toor Dal to Main Store
    pur_payload = schemas.InventoryPurchaseCreate(
        bill_no=f"PUR-{prefix}-DAL",
        bill_date="2026-11-07",
        godown=main_name,
        supplier_name="Rayagada Agro Traders",
        items=[{"itemName": "Toor Dal", "qty": 50.0, "rate": 140.0, "amount": 7000.0}],
        total_amount=7000.0,
        tax_amount=0.0,
        net_amount=7000.0
    )
    save_inventory_purchase(pur_payload, db)

    # Kitchen Chef raises a requisition for 15 kg Toor Dal with status='PENDING'
    req_payload = schemas.StockTransferCreate(
        entry_no=f"REQ-{prefix}-01",
        date="2026-11-07",
        from_godown=main_name,
        to_godown=kitchen_name,
        items=[{"itemName": "Toor Dal", "qty": 15.0, "rate": 140.0, "amount": 2100.0}],
        total_qty=15.0,
        status="PENDING",
        remark="Daily kitchen requisition for Dal Tadka"
    )
    req_res = save_stock_transfer(req_payload, db)
    assert req_res["status"] == "PENDING"

    # Before approval, Main Store still has full 50.0 kg available
    summary_before = get_inventory_stock_summary(db)
    main_store_data = next((g for g in summary_before["godowns"] if g["godownName"] == main_name), None)
    assert main_store_data is not None
    dal_item = next((it for it in main_store_data["items"] if it["itemName"] == "Toor Dal"), None)
    assert dal_item is not None
    assert dal_item["closingStock"] == 50.0

    # Storekeeper approves and issues the requisition
    action_payload = schemas.RequisitionActionRequest(
        entry_no=f"REQ-{prefix}-01",
        action="ISSUE",
        reason="Verified and dispatched 15 kg sealed Toor Dal bag"
    )
    action_res = action_stock_transfer(f"REQ-{prefix}-01", action_payload, db)
    assert action_res["status"] == "ISSUED"

    # After issuance, stock is now debited: Main Store has 35.0 kg
    summary_after = get_inventory_stock_summary(db)
    main_store_after = next((g for g in summary_after["godowns"] if g["godownName"] == main_name), None)
    dal_after = next((it for it in main_store_after["items"] if it["itemName"] == "Toor Dal"), None)
    assert dal_after["closingStock"] == 35.0

    # Verify audit trail
    issue_audit = db.query(models.AuditLog).filter(
        models.AuditLog.action == "REQUISITION_ISSUED",
        models.AuditLog.entity_id == f"REQ-{prefix}-01"
    ).first()
    assert issue_audit is not None

def test_recipe_bom_depletion_on_restaurant_kot(db: Session):
    """
    Track 5: Test that punching a KOT for restaurant dishes automatically
    depletes component raw materials from the Kitchen Store ledger.
    """
    prefix = uuid.uuid4().hex[:6].upper()
    main_name, kitchen_name = setup_test_godowns(db, prefix)

    # Inward raw materials directly to Kitchen Store
    pur_kitchen = schemas.InventoryPurchaseCreate(
        bill_no=f"PUR-KITCHEN-{prefix}",
        bill_date="2026-11-07",
        godown=kitchen_name,
        supplier_name="Fresh Agro & Spices",
        items=[
            {"itemName": "Fresh Paneer", "qty": 30.0, "rate": 300.0, "amount": 9000.0},
            {"itemName": "Amul Butter", "qty": 10.0, "rate": 500.0, "amount": 5000.0},
            {"itemName": "Tomato Gravy Base", "qty": 15.0, "rate": 100.0, "amount": 1500.0}
        ],
        total_amount=15500.0,
        tax_amount=0.0,
        net_amount=15500.0
    )
    save_inventory_purchase(pur_kitchen, db)

    # Punch KOT for 5 portions of 'Paneer Butter Masala'
    # Recipe: 0.20 kg Paneer, 0.05 kg Butter, 0.15 kg Tomato Gravy per portion
    # Expected depletion for 5 portions:
    # Paneer: 5 * 0.20 = 1.0 kg -> 30.0 - 1.0 = 29.0 kg
    # Butter: 5 * 0.05 = 0.25 kg -> 10.0 - 0.25 = 9.75 kg
    # Gravy:  5 * 0.15 = 0.75 kg -> 15.0 - 0.75 = 14.25 kg
    kot_payload = schemas.KotCreate(
        ticket_no=f"KOT-{prefix}-PBM",
        order_type="Dining",
        room_no="",
        table_no=f"T-{prefix}",
        waiter_name="Ramesh",
        items=[{"itemName": "Paneer Butter Masala", "qty": 5, "rate": 240.0, "amount": 1200.0}],
        total_amount=1200.0
    )
    kot = create_kot_ticket(kot_payload, db)
    assert kot.get("success") is True or kot.get("kot_no") or kot.get("kotNo")

    # Query stock summary for Kitchen Store
    summary = get_inventory_stock_summary(db)
    kitchen_data = next((g for g in summary["godowns"] if g["godownName"] == kitchen_name), None)
    assert kitchen_data is not None

    paneer = next((it for it in kitchen_data["items"] if it["itemName"] == "Fresh Paneer"), None)
    butter = next((it for it in kitchen_data["items"] if it["itemName"] == "Amul Butter"), None)
    gravy = next((it for it in kitchen_data["items"] if it["itemName"] == "Tomato Gravy Base"), None)

    assert paneer is not None and paneer["closingStock"] == 29.0
    assert butter is not None and butter["closingStock"] == 9.75
    assert gravy is not None and gravy["closingStock"] == 14.25

def test_low_stock_threshold_alerts(db: Session):
    """
    Track 5: Test low stock detection triggers alerts when closing stock <= threshold.
    """
    prefix = uuid.uuid4().hex[:6].upper()
    main_name, kitchen_name = setup_test_godowns(db, prefix)

    # Inward 8 bottles of Desi Ghee (threshold 10.0)
    pur_payload = schemas.InventoryPurchaseCreate(
        bill_no=f"PUR-ALERT-{prefix}",
        bill_date="2026-11-07",
        godown=main_name,
        supplier_name="Pure Ghee Dist",
        items=[{"itemName": "Pure Cow Ghee 1L", "qty": 8.0, "rate": 650.0, "amount": 5200.0}],
        total_amount=5200.0,
        tax_amount=0.0,
        net_amount=5200.0
    )
    save_inventory_purchase(pur_payload, db)

    alerts = get_low_stock_alerts(threshold=10.0, db=db)
    assert alerts["success"] is True
    ghee_alert = next((a for a in alerts["alerts"] if a["godown"] == main_name and a["itemName"] == "Pure Cow Ghee 1L"), None)
    assert ghee_alert is not None
    assert ghee_alert["closingStock"] == 8.0
    assert ghee_alert["reorderRequired"] is True
