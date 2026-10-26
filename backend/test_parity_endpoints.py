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
    assert "checkouts" in state
    assert "advance_receipts" in state
    assert "room_shifts" in state
    assert "journal_entries" in state
    assert "party_accounts" in state
    assert "general_receipts" in state
    assert "general_payments" in state
    assert "godowns" in state
    assert "item_groups" in state
    assert "stock_transfers" in state
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

    # 13. Checkout Persistence Test
    chk_payload = {
        "invoiceNo": "GSR/TEST/26-27",
        "roomNo": "101",
        "roomType": "DELUXE",
        "guestName": "Test Guest Checkout",
        "guestPhone": "9440289999",
        "checkInDate": "2026-10-25",
        "checkInTime": "12:00 PM",
        "checkOutDate": "2026-10-27",
        "checkOutTime": "11:00 AM",
        "totalRoomRent": 3000.0,
        "foodAmount": 400.0,
        "gstPercent": 12.0,
        "gstAmount": 360.0,
        "advanceDeducted": 1000.0,
        "netPayable": 2760.0,
        "paymentMode": "Online",
        "payments": [{"mode": "Online", "amount": 2760.0, "remark": "UPI Settlement"}]
    }
    r = client.post("/api/v1/pms/checkouts", json=chk_payload)
    assert r.status_code == 200
    print(f"   [OK] Checkout Persisted: {r.json()['invoiceNo']} (Net: Rs.{r.json()['netPayable']})")

    r = client.get("/api/v1/pms/checkouts")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Checkouts Query: Found {len(r.json())} checkout(s)")

    # 14. Advance Receipt Test
    adv_payload = {
        "receiptNo": "AR-TEST-001",
        "roomNo": "101",
        "guestName": "Test Guest Advance",
        "mobile": "9440289999",
        "amount": 1500.0,
        "paymentMode": "Cash",
        "remark": "Pilgrim group darshan advance deposit"
    }
    r = client.post("/api/v1/pms/advance-receipts", json=adv_payload)
    assert r.status_code == 200
    print(f"   [OK] Advance Receipt Persisted: {r.json()['receiptNo']} (Rs.{r.json()['amount']})")

    r = client.get("/api/v1/pms/advance-receipts")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Advance Receipts Query: Found {len(r.json())} receipt(s)")

    # 15. Room Shift Test
    shift_payload = {
        "booking_ref": "SVR-ROOM-101",
        "to_room_id": 2,
        "reason": "AC Cooling Issue / Upgrade",
        "shifted_by": "Duty Manager"
    }
    r = client.post("/api/v1/pms/room-shift", json=shift_payload)
    assert r.status_code == 200, f"Room shift failed: {r.text}"
    print(f"   [OK] Room Shift Executed: From Room {r.json()['from_room_id']} to Room {r.json()['to_room_id']}")

    r = client.get("/api/v1/pms/room-shifts")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Room Shifts Query: Found {len(r.json())} shift record(s)")

    # 16. Journal Entry Test
    jv_payload = {
        "entryId": "JV-2026-TEST",
        "date": "2026-10-26",
        "time": "11:30 AM",
        "voucherType": "CheckOut",
        "referenceNo": "GSR/TEST/26-27",
        "narration": "Test Room Checkout Folio settlement posting",
        "debitAccount": "Cash in Hand (Reception)",
        "creditAccount": "Room Accommodation Revenue",
        "amountRupees": 2760.0,
        "postedBy": "Duty Manager"
    }
    r = client.post("/api/v1/pms/journal-entries", json=jv_payload)
    assert r.status_code == 200, f"Journal entry failed: {r.text}"
    print(f"   [OK] Journal Entry Posted: {r.json()['entryId']} (Rs.{r.json()['amountRupees']})")

    r = client.get("/api/v1/pms/journal-entries")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Journal Entries Query: Found {len(r.json())} record(s)")

    # 17. Party Account Test
    party_payload = {
        "id": "pa-jk-paper",
        "name": "JK Paper Ltd Corporate",
        "mobile": "+91 94402 89999",
        "category": "Corporate",
        "balance": 25000.0,
        "balanceType": "Dr",
        "gstin": "21AAACJ0123M1Z5",
        "address": "Jaykaypur, Rayagada, Odisha"
    }
    r = client.post("/api/v1/pms/party-accounts", json=party_payload)
    assert r.status_code == 200, f"Party account failed: {r.text}"
    print(f"   [OK] Party Account Saved: {r.json()['name']} (Bal: Rs.{r.json()['balance']} {r.json()['balanceType']})")

    r = client.get("/api/v1/pms/party-accounts")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Party Accounts Query: Found {len(r.json())} party account(s)")

    # 18. General Receipt Voucher Test
    rec_payload = {
        "receiptNo": "REC/2026/TEST",
        "voucherName": "Receipts",
        "voucherNo": 101,
        "date": "2026-10-26",
        "paymentMode": "Cash",
        "accountName": "JK Paper Ltd Corporate",
        "amount": 5000.0,
        "remark": "Partial settlement of corporate conference folio"
    }
    r = client.post("/api/v1/pms/general-receipts", json=rec_payload)
    assert r.status_code == 200, f"General receipt failed: {r.text}"
    print(f"   [OK] General Receipt Recorded: {r.json()['receiptNo']} for Rs.{r.json()['amount']}")

    r = client.get("/api/v1/pms/general-receipts")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] General Receipts Query: Found {len(r.json())} receipt voucher(s)")

    # 19. General Payment Voucher Test
    pmt_payload = {
        "paymentNo": "PAY/2026/TEST",
        "voucherName": "Payments",
        "voucherNo": 501,
        "date": "2026-10-26",
        "paymentMode": "Online",
        "accountName": "Sai Ghee & Dairy Supplier",
        "amount": 12000.0,
        "remark": "Kitchen butter & pure ghee weekly payment"
    }
    r = client.post("/api/v1/pms/general-payments", json=pmt_payload)
    assert r.status_code == 200, f"General payment failed: {r.text}"
    print(f"   [OK] General Payment Recorded: {r.json()['paymentNo']} for Rs.{r.json()['amount']}")

    r = client.get("/api/v1/pms/general-payments")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] General Payments Query: Found {len(r.json())} payment voucher(s)")

    # 20. Godowns Master Test
    gd_payload = {
        "id": "gd-main-store",
        "sNo": 1,
        "name": "Main Central Store",
        "address": "Basement Storage Room 01"
    }
    r = client.post("/api/v1/pms/godowns", json=gd_payload)
    assert r.status_code == 200, f"Godown save failed: {r.text}"
    print(f"   [OK] Godown Saved: {r.json()['name']} ({r.json()['id']})")

    r = client.get("/api/v1/pms/godowns")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Godowns Query: Found {len(r.json())} godown(s)")

    # 21. Item Groups Master Test
    ig_payload = {
        "id": "ig-raw-material",
        "sNo": 1,
        "name": "Raw Cooking Material",
        "headGroup": "Raw_Material",
        "noDiscount": True
    }
    r = client.post("/api/v1/pms/item-groups", json=ig_payload)
    assert r.status_code == 200, f"Item group save failed: {r.text}"
    print(f"   [OK] Item Group Saved: {r.json()['name']} (Head: {r.json()['headGroup']})")

    r = client.get("/api/v1/pms/item-groups")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Item Groups Query: Found {len(r.json())} item group(s)")

    # 22. Stock Transfers Test
    st_payload = {
        "entryNo": "ST/2026/TEST",
        "date": "2026-10-26",
        "fromGodown": "Main Central Store",
        "toGodown": "Kitchen",
        "billDate": "2026-10-26",
        "billNo": "TX-01",
        "items": [
            {"sNo": 1, "itemId": "item-101", "itemName": "Basmati Rice 25kg Bag", "qty": 4, "rate": 1850.0, "amount": 7400.0, "netValue": 7400.0},
            {"sNo": 2, "itemId": "item-102", "itemName": "Amul Pure Butter 500g", "qty": 20, "rate": 275.0, "amount": 5500.0, "netValue": 5500.0}
        ],
        "totalQty": 24,
        "totalAmount": 12900.0,
        "totalNetValue": 12900.0,
        "remark": "Morning kitchen bulk issue from central store"
    }
    r = client.post("/api/v1/pms/stock-transfers", json=st_payload)
    assert r.status_code == 200, f"Stock transfer failed: {r.text}"
    print(f"   [OK] Stock Transfer Recorded: {r.json()['entryNo']} ({r.json()['fromGodown']} -> {r.json()['toGodown']}, Net: Rs.{r.json()['totalNetValue']})")

    r = client.get("/api/v1/pms/stock-transfers")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Stock Transfers Query: Found {len(r.json())} transfer voucher(s)")

    print("\n=== ALL PARITY ENDPOINTS TESTED & PASSED 100%! ===")

if __name__ == "__main__":
    test_parity_endpoints()
