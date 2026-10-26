import os
import sys
import datetime

# Ensure backend root is on path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, get_db
from app import models

client = TestClient(app)

def test_parity_endpoints():
    print("Testing Full-Stack Parity Endpoints...")
    Base.metadata.create_all(bind=engine)

    # 1. Test Folio Discount
    disc_payload = {
        "booking_ref": "SVR-ROOM-101",
        "discount_type": "flat",
        "discount_amount": 250.0,
        "discount_reason": "Pilgrim Group Courteous Discount",
        "approved_by": "Duty Manager"
    }
    r = client.post("/api/v1/pms/folio/discount", json=disc_payload)
    assert r.status_code == 200, f"Discount failed: {r.text}"
    disc_data = r.json()
    assert disc_data["discount_amount"] == 250.0
    print(f"   [OK] Folio Discount Created: {disc_data['discount_amount']} ({disc_data.get('reason')})")

    # Get Folio Discounts
    r = client.get("/api/v1/pms/folio/discounts/101")
    assert r.status_code == 200, f"Get discounts failed: {r.text}"
    print(f"   [OK] Folio Discounts Retrievable: {len(r.json())} discount record(s) found")

    # 2. Test Food Bill
    food_payload = {
        "bill_no": "SHRI/TEST/2026",
        "date": "2026-10-26",
        "time": "18:30",
        "room_no": "101",
        "table_no": "T-1",
        "guest_name": "Test Pilgrim",
        "kot_numbers_json": '["KOT/101/1"]',
        "items_json": '[{"itemName": "Paneer Tikka", "qty": 2, "rate": 200, "amount": 400}]',
        "taxable_amount": 400.0,
        "gst_percent": 5.0,
        "cgst_amount": 10.0,
        "sgst_amount": 10.0,
        "discount_amount": 20.0,
        "net_bill_amount": 400.0,
        "settlement_type": "Settle To Room",
        "status": "Settled"
    }
    r = client.post("/api/v1/pms/food-bills", json=food_payload)
    assert r.status_code == 200, f"Food bill failed: {r.text}"
    print(f"   [OK] Food Bill Created: {r.json()['bill_no']} for Rs.{r.json()['net_bill_amount']}")

    # Get Food Bills
    r = client.get("/api/v1/pms/food-bills")
    assert r.status_code == 200
    print(f"   [OK] Food Bills Retrievable: {len(r.json())} record(s)")

    # 3. Test Petty Expense
    exp_payload = {
        "expense_no": "EXP-2026-TEST",
        "date": "2026-10-26",
        "time": "18:35",
        "category": "Housekeeping Supplies",
        "amount": 750.0,
        "payment_mode": "Cash",
        "paid_to": "Sai Chem Traders",
        "description": "Floor cleaner and spray bottles",
        "bill_number": "SC-1029",
        "approved_by": "Housekeeping Head"
    }
    r = client.post("/api/v1/pms/expenses", json=exp_payload)
    assert r.status_code == 200, f"Expense failed: {r.text}"
    print(f"   [OK] Petty Expense Created: {r.json()['expense_no']} (Rs.{r.json()['amount']})")

    # Get Petty Expenses
    r = client.get("/api/v1/pms/expenses")
    assert r.status_code == 200
    print(f"   [OK] Petty Expenses Retrievable: {len(r.json())} record(s)")

    # 4. Test Inventory Purchase
    pur_payload = {
        "bill_no": "PUR-2026-001",
        "bill_date": "2026-10-26",
        "account_name": "Shirdi Dairy Cooperative",
        "godown": "Main Kitchen Store",
        "terms": "Cash",
        "items_json": '[{"itemName": "Pure Ghee 15L", "qty": 2, "rate": 8500, "total": 17000}]',
        "total_gross_amount": 17000.0,
        "total_discount": 500.0,
        "total_tax": 825.0,
        "total_net_value": 17325.0,
        "remarks": "Kitchen Store Inward"
    }
    r = client.post("/api/v1/pms/inventory/purchases", json=pur_payload)
    assert r.status_code == 200, f"Purchase failed: {r.text}"
    print(f"   [OK] Inventory Purchase Created: {r.json()['bill_no']} (Rs.{r.json()['net_amount']})")

    # Get Inventory Purchases
    r = client.get("/api/v1/pms/inventory/purchases")
    assert r.status_code == 200
    print(f"   [OK] Inventory Purchases Retrievable: {len(r.json())} record(s)")

    # 5. Test KOT Void Item
    void_payload = {
        "kot_number": "KOT/101/1",
        "item_name": "Masala Papad",
        "quantity": 1,
        "void_reason": "Guest Changed Mind",
        "voided_by": "Manager (PIN 9999)",
        "table_number": "T-1",
        "room_number": "101"
    }
    r = client.post("/api/v1/pms/kot/void", json=void_payload)
    assert r.status_code == 200, f"Void failed: {r.text}"
    print(f"   [OK] KOT Item Voided: {r.json()['item_name']} (Qty: {r.json()['quantity']})")

    # 6. Test Table Session Shift & Merge
    shift_payload = {
        "from_table": "Table 1",
        "to_table": "Table 2",
        "shifted_by": "Head Steward"
    }
    r = client.post("/api/v1/pms/tables/shift-session", json=shift_payload)
    assert r.status_code == 200
    print(f"   [OK] Table Session Shifted: {r.json()['message']}")

    # 7. Test Keycard Encode & Extend
    key_payload = {
        "room_number": "101",
        "guest_name": "Test Guest",
        "check_out_time": (datetime.datetime.utcnow() + datetime.timedelta(days=1)).isoformat()
    }
    r = client.post("/api/v1/pms/keycards/encode", json=key_payload)
    assert r.status_code == 200
    card_uid = r.json()["card_uid"]
    print(f"   [OK] Keycard Encoded: Card UID={card_uid} for Room 101")

    # 8. Test Full Cloud State Sync Endpoint
    r = client.get("/api/v1/pms/sync/full-state")
    assert r.status_code == 200, f"Full state sync failed: {r.text}"
    state = r.json()
    assert "rooms" in state
    assert "active_bookings" in state
    assert "tables" in state
    assert "kots" in state
    assert "food_bills" in state
    assert "expenses" in state
    assert "purchases" in state
    assert "discounts" in state
    assert "group_bookings" in state
    assert "masters" in state
    print(f"   [OK] Full Cloud State Hydration: {len(state['rooms'])} rooms, {len(state['food_bills'])} food bills, {len(state['expenses'])} expenses, {len(state['purchases'])} purchases, {len(state['discounts'])} discounts, {len(state['group_bookings'])} group bookings")

    # 9. Test Group Booking (Multi-Room Tape Chart Sync)
    grp_payload = {
        "groupId": "GRP-021892",
        "groupName": "JK Paper Ltd Delegation",
        "contactPerson": "Mr. Asit Kumar Bhuyan",
        "contactPhone": "+91 94402 8999",
        "bookingSource": "Direct Phone Reservation",
        "roomsAllocated": ["107", "203", "205", "208"],
        "checkInDate": "2026-10-27",
        "checkOutDate": "2026-10-30",
        "advancePaid": 8822.0,
        "balanceDue": 20700.0,
        "totalAmount": 29522.0,
        "specialInstructions": "Corporate Billing under JK Paper MSA. Separate Food vs Room invoices required.",
        "guests": [
            {"name": "Mr. Asit Kumar Bhuyan", "phone": "+91 94402 8999", "roomAssigned": "203", "age": 44},
            {"name": "Mr. Chandan Giri", "phone": "+91 98480 1234", "roomAssigned": "208", "age": 48},
            {"name": "Mr. Jyotiswaroop Routray", "phone": "+91 94370 5044", "roomAssigned": "107", "age": 39},
            {"name": "Mr. S. K. Patra", "phone": "+91 94371 2233", "roomAssigned": "205", "age": 41}
        ]
    }
    r = client.post("/api/v1/pms/group-bookings", json=grp_payload)
    assert r.status_code == 200, f"Group booking creation failed: {r.text}"
    print(f"   [OK] Group Booking Persisted: {r.json()['message']}")

    # Get Group Bookings
    r = client.get("/api/v1/pms/group-bookings")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Group Bookings Query: Found {len(r.json())} group(s)")

    print("\n=== ALL PARITY ENDPOINTS TESTED & PASSED 100%! ===")

if __name__ == "__main__":
    test_parity_endpoints()
