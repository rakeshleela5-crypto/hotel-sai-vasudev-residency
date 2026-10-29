import os
import sys
import datetime
import time
import uuid

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
    db = next(get_db())
    from app.routes.rooms import seed_rooms_if_empty
    seed_rooms_if_empty(db)

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
    assert "users" in state
    assert "commission_agents" in state
    assert "agent_payout_vouchers" in state
    assert "shift_handovers" in state
    assert "banquet_venues" in state
    assert "banquet_bookings" in state
    assert "liquor_items" in state
    assert "bar_invoices" in state
    assert "hotel_assets" in state
    assert "lockers" in state
    assert "whatsapp_logs" in state
    assert "support_tickets" in state
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

    # 23. User Accounts Test
    user_payload = {
        "id": 101,
        "userName": "Rakesh Nandyala",
        "emailId": "rakesh@sai-vasudev.com",
        "roleId": 1,
        "roleName": "General Manager & Admin",
        "department": "General Management",
        "status": "Active",
        "mobile": "9440289999",
        "isOnDuty": True
    }
    r = client.post("/api/v1/pms/users", json=user_payload)
    assert r.status_code == 200, f"User account save failed: {r.text}"
    print(f"   [OK] User Account Saved: {r.json()['userName']} ({r.json()['roleName']})")

    r = client.get("/api/v1/pms/users")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Users Query: Found {len(r.json())} user account(s)")

    # 24. Commission Agents Test
    agent_payload = {
        "id": "AGT-TEST-01",
        "name": "Rayagada Pilgrim Travels Agency",
        "phone": "9861054321",
        "city": "Rayagada",
        "agentType": "Travel Agent",
        "commissionType": "PERCENTAGE_ROOM_ONLY",
        "defaultRate": 12.0,
        "totalBookings": 5,
        "totalRevenueGenerated": 15000.0,
        "totalCommissionEarned": 1800.0,
        "balancePayable": 1800.0
    }
    r = client.post("/api/v1/pms/commission-agents", json=agent_payload)
    assert r.status_code == 200, f"Commission agent save failed: {r.text}"
    print(f"   [OK] Commission Agent Saved: {r.json()['name']} (Bal: Rs.{r.json()['balancePayable']})")

    r = client.get("/api/v1/pms/commission-agents")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Commission Agents Query: Found {len(r.json())} agent(s)")

    # 25. Agent Payout Voucher Test
    payout_payload = {
        "voucherNo": "AGTPAY-TEST-01",
        "voucherDate": "2026-10-26",
        "agentId": "AGT-TEST-01",
        "agentName": "Rayagada Pilgrim Travels Agency",
        "amount": 1000.0,
        "paymentMode": "UPI",
        "referenceNo": "UPI/2026/89472910",
        "commissionIds": ["COMM-TEST-001"],
        "notes": "Weekly travel desk payout settlement"
    }
    r = client.post("/api/v1/pms/agent-payout-vouchers", json=payout_payload)
    assert r.status_code == 200, f"Agent payout failed: {r.text}"
    print(f"   [OK] Agent Payout Voucher Recorded: {r.json()['voucherNo']} for Rs.{r.json()['amount']}")

    r = client.get("/api/v1/pms/agent-payout-vouchers")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Agent Payout Vouchers Query: Found {len(r.json())} voucher(s)")

    # 26. Shift Handover & Cash Reconciliation Test
    handover_payload = {
        "shiftId": "SHIFT/TEST/20261026",
        "shiftDate": "2026-10-26",
        "shiftTime": "07:00 AM - 03:00 PM",
        "userEmail": "rakesh@sai-vasudev.com",
        "userName": "Rakesh Nandyala",
        "shiftType": "Morning",
        "openingDrawerCash": 5000.0,
        "roomCashCollected": 12500.0,
        "foodCashCollected": 3200.0,
        "advanceCashCollected": 4000.0,
        "expensesPaidFromDrawer": 1200.0,
        "netPhysicalCashInDrawer": 23500.0,
        "onlineUpiVerified": 15000.0,
        "cardSwipeVerified": 5000.0,
        "totalTransactionsHandled": 12,
        "handoverToUser": "Evening Incharge",
        "handoverNotes": "Morning shift balance reconciled with 100% currency match",
        "status": "Verified & Closed"
    }
    r = client.post("/api/v1/pms/shift-handovers", json=handover_payload)
    assert r.status_code == 200, f"Shift handover failed: {r.text}"
    print(f"   [OK] Shift Handover Recorded: {r.json()['shiftId']} (Net Drawer Cash: Rs.{r.json()['netPhysicalCashInDrawer']})")

    r = client.get("/api/v1/pms/shift-handovers")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Shift Handovers Query: Found {len(r.json())} shift record(s)")

    # 26. Test Banquet Venues & Bookings
    venue_payload = {
        "venueId": "BV-TEST-01",
        "name": "Sai Mandapam Marriage Lawn",
        "type": "Marriage Garden",
        "baseTariff": 75000.0,
        "gstPercent": 18.0,
        "capacityPaxMin": 100,
        "capacityPaxMax": 1000,
        "sqFtArea": 12000.0,
        "floor": "Ground Lawn",
        "status": "vacant",
        "cleaningStatus": "Ready",
        "sacCode": "996311"
    }
    r = client.post("/api/v1/pms/banquet-venues", json=venue_payload)
    assert r.status_code == 200, f"Banquet venue save failed: {r.text}"
    print(f"   [OK] Banquet Venue Persisted: {r.json()['name']} (Tariff: Rs.{r.json()['tariff']})")

    r = client.get("/api/v1/pms/banquet-venues")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Banquet Venues Query: Found {len(r.json())} venue(s)")

    b_booking_payload = {
        "bookingNo": "BQ/TEST/26-27",
        "eventName": "Sharma Family Silver Jubilee",
        "eventType": "Anniversary",
        "hostName": "Sharma Family",
        "contactPerson": "Ramesh Sharma",
        "contactMobile": "9822001122",
        "venueId": "BV-TEST-01",
        "venueName": "Sai Mandapam Marriage Lawn",
        "venueTariff": 75000.0,
        "bookingDate": "2026-10-26",
        "eventDate": "2026-11-15",
        "guaranteedPax": 250,
        "grandTotal": 145000.0,
        "advancePaid": 50000.0,
        "balanceDue": 95000.0,
        "status": "Confirmed"
    }
    r = client.post("/api/v1/pms/banquet-bookings", json=b_booking_payload)
    assert r.status_code == 200, f"Banquet booking save failed: {r.text}"
    print(f"   [OK] Banquet Booking Persisted: {r.json()['bookingNo']} (Net: Rs.{r.json()['grandTotal']}, Due: Rs.{r.json()['balanceDue']})")

    # 27. Test Restro-Bar & Liquor Excise
    liq_item_payload = {
        "itemCode": "LIQ-TEST-1001",
        "sNo": 1,
        "name": "Signature Premium Grain Whisky (60 ML)",
        "brandName": "Signature",
        "group": "Whisky",
        "mrp": 350.0,
        "rate": 350.0,
        "purchaseRate": 120.0,
        "unit": "60 Ml",
        "conversionMl": 60.0,
        "taxType": "VAT 13%",
        "vatPercentage": 13.0,
        "active": True
    }
    r = client.post("/api/v1/pms/liquor-items", json=liq_item_payload)
    assert r.status_code == 200, f"Liquor item save failed: {r.text}"
    print(f"   [OK] Liquor Item Persisted: {r.json()['name']} (Rate: Rs.{r.json()['rate']})")

    bar_inv_payload = {
        "billNo": "BAR/TEST/099",
        "date": "2026-10-26",
        "time": "21:30",
        "tableNo": "Bar Table 4",
        "serviceType": "Table Service",
        "guestName": "Executive Guest",
        "guestMobile": "9823000001",
        "totalItems": 2,
        "totalQuantity": 2.0,
        "basicAmount": 700.0,
        "vatAmount": 91.0,
        "grandTotal": 791.0,
        "settled": True,
        "paymentMode": "UPI"
    }
    r = client.post("/api/v1/pms/bar-invoices", json=bar_inv_payload)
    assert r.status_code == 200, f"Bar invoice save failed: {r.text}"
    print(f"   [OK] Bar Invoice Persisted: {r.json()['billNo']} (Total: Rs.{r.json()['grandTotal']})")

    # 28. Test Hotel Asset & Linen Master
    asset_payload = {
        "assetId": "AST-TEST-01",
        "assetName": "Premium King Bed Cotton Sheet (300 TC)",
        "category": "Linen",
        "unit": "Pcs",
        "totalPurchased": 150.0,
        "inRooms": 60.0,
        "inLinenStore": 70.0,
        "inLaundry": 18.0,
        "inDamagedRepair": 2.0,
        "unitCost": 850.0
    }
    r = client.post("/api/v1/pms/hotel-assets", json=asset_payload)
    assert r.status_code == 200, f"Hotel asset save failed: {r.text}"
    print(f"   [OK] Hotel Asset Persisted: {r.json()['name']} ({r.json()['category']})")

    r = client.get("/api/v1/pms/hotel-assets")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Hotel Assets Query: Found {len(r.json())} asset(s)")

    # 29. Test Pilgrim Safe Lockers
    locker_payload = {
        "lockerNo": "LCK-TEST-12",
        "lockerSize": "Large",
        "dailyRate": 150.0,
        "status": "Occupied",
        "assignedGuestName": "Shirdi Pilgrim Devotee",
        "assignedRoomNo": "205",
        "keyNumber": "K-TEST-12",
        "securityDeposit": 500.0
    }
    r = client.post("/api/v1/pms/lockers", json=locker_payload)
    assert r.status_code == 200, f"Locker save failed: {r.text}"
    print(f"   [OK] Pilgrim Locker Persisted: Locker #{r.json()['lockerNo']} ({r.json()['status']})")

    # 30. Test WhatsApp CRM & Config
    wa_cfg_payload = {
        "apiUrl": "https://api.whatsapp-gateway.com/v1",
        "instanceId": "SVR_PROD_INSTANCE",
        "token": "waba_live_token_verified",
        "ownerMobile": "9440289999",
        "validityDate": "2027-12-31",
        "autoSendOnCheckIn": True,
        "autoSendOnCheckOut": True
    }
    r = client.post("/api/v1/pms/whatsapp-config", json=wa_cfg_payload)
    assert r.status_code == 200, f"WhatsApp config save failed: {r.text}"
    print(f"   [OK] WhatsApp Gateway Config Persisted in PostgreSQL")

    wa_log_payload = {
        "recipientMobile": "9822114455",
        "recipientName": "Anand Kulkarni",
        "recipientType": "Guest",
        "voucherType": "Check-In",
        "roomNo": "101",
        "message": "Welcome to Hotel Sai Vasudev Residency Shirdi. Your Room 101 key is active.",
        "status": "Sent"
    }
    r = client.post("/api/v1/pms/whatsapp-logs", json=wa_log_payload)
    assert r.status_code == 200, f"WhatsApp log save failed: {r.text}"
    print(f"   [OK] WhatsApp Log Persisted: To {r.json()['recipient']} (Status: {r.json()['status']})")

    # 31. Test Staff Support Tickets
    ticket_payload = {
        "ticketNo": "TKT-TEST-999",
        "date": "2026-10-26",
        "time": "22:15",
        "staffName": "Sunil (Night Auditor)",
        "department": "Front Office",
        "category": "Billing & Checkout",
        "priority": "High",
        "subject": "Printer Paper Roll Jam at Terminal 2",
        "description": "Thermal receipt printer roller requires cleaning after heavy checkout rush",
        "status": "Open"
    }
    r = client.post("/api/v1/pms/support-tickets", json=ticket_payload)
    assert r.status_code == 200, f"Support ticket save failed: {r.text}"
    print(f"   [OK] Support Ticket Persisted: {r.json()['ticketNo']} - {r.json()['subject']}")

    r = client.get("/api/v1/pms/support-tickets")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Support Tickets Query: Found {len(r.json())} ticket(s)")

    # 32. Test Hotel Settings & Identity
    settings_payload = {
        "firmName": "Hotel Sai Vasudev Residency",
        "legalName": "Hotel Sai Vasudev Residency Pvt Ltd",
        "gstNo": "27AAAAA0000A1Z5",
        "city": "Shirdi",
        "calculationType": "12hour",
        "standardCheckoutTime": "11:00 AM"
    }
    r = client.post("/api/v1/pms/settings", json=settings_payload)
    assert r.status_code == 200, f"Settings update failed: {r.text}"
    print(f"   [OK] Hotel Settings Persisted: {r.json()['firmName']}")

    r = client.get("/api/v1/pms/settings")
    assert r.status_code == 200
    assert r.json()["gstNo"] == "27AAAAA0000A1Z5"
    print(f"   [OK] Hotel Settings Query: GSTIN={r.json()['gstNo']}, Policy={r.json()['calculationType']}")

    # 33. Test Room Types Master
    rt_payload = {
        "roomTypeName": "Deluxe Executive AC",
        "package": "EP",
        "gstTaxString": "GST 12%",
        "gstPercent": 12.0,
        "roomTariff": 2800.0,
        "discountPercent": 0.0
    }
    r = client.post("/api/v1/pms/room-types", json=rt_payload)
    assert r.status_code == 200, f"Room type save failed: {r.text}"
    print(f"   [OK] Room Type Persisted: {r.json()['roomTypeName']} (Rs.{r.json()['tariff']})")

    r = client.get("/api/v1/pms/room-types")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Room Types Query: Found {len(r.json())} room type(s)")

    # 34. Test Restaurant Menu Items
    menu_payload = {
        "code": "MENU-TEST-01",
        "name": "Shirdi Special Paneer Tikka",
        "category": "Starter",
        "rate": 280.0,
        "unit": "Plate",
        "gstPercent": 5.0
    }
    r = client.post("/api/v1/pms/menu-items", json=menu_payload)
    assert r.status_code == 200, f"Menu item save failed: {r.text}"
    print(f"   [OK] Menu Item Persisted: {r.json()['name']} (Rs.{r.json()['rate']})")

    r = client.get("/api/v1/pms/menu-items")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Menu Items Query: Found {len(r.json())} item(s)")

    # 35. Test Housekeeping Duty Records
    hk_payload = {
        "roomNo": "101",
        "status": "Inspected",
        "assignedStaff": "Sunita",
        "priority": "VIP Suite",
        "lastCleanedTime": "2026-10-26 23:45",
        "remarks": "Deep sanitization complete for VIP arrival"
    }
    r = client.post("/api/v1/pms/housekeeping", json=hk_payload)
    assert r.status_code == 200, f"Housekeeping record save failed: {r.text}"
    print(f"   [OK] Housekeeping Duty Persisted: Room {r.json()['roomNo']} -> {r.json()['status']} ({r.json()['assignedStaff']})")

    r = client.get("/api/v1/pms/housekeeping")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Housekeeping Query: Found {len(r.json())} duty record(s)")

    # 36. Test Agent Commission Accruals
    comm_payload = {
        "commissionId": "COMM-TEST-001",
        "agentId": "AGT-SHIRDI-01",
        "agentName": "Sai Pilgrim Tours & Travels",
        "roomNo": "101",
        "guestName": "Rajesh Sharma",
        "checkInDate": "2026-10-26",
        "checkOutDate": "2026-10-28",
        "numberOfNights": 2,
        "roomTariff": 2400.0,
        "grossRoomTariff": 4800.0,
        "commissionRate": 10.0,
        "grossCommission": 480.0,
        "tdsPercentage": 5.0,
        "tdsAmount": 24.0,
        "netPayableCommission": 456.0,
        "status": "PENDING"
    }
    r = client.post("/api/v1/pms/agent-commissions", json=comm_payload)
    assert r.status_code == 200, f"Commission save failed: {r.text}"
    print(f"   [OK] Agent Commission Accrual Persisted: {r.json()['commissionId']} (Net: Rs.{r.json()['amount']})")

    r = client.get("/api/v1/pms/agent-commissions")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Agent Commissions Query: Found {len(r.json())} accrual(s)")

    # 37. Test WhatsApp Notification Templates
    wa_tpl_payload = {
        "templateId": "tpl-checkout-test",
        "label": "Checkout Bill & Thanks",
        "voucherType": "Check_out_store",
        "message": "Dear {{guest_name}}, thank you for staying at Hotel Sai Vasudev Residency.",
        "active": "On",
        "sendTo": "Guest"
    }
    r = client.post("/api/v1/pms/whatsapp-templates", json=wa_tpl_payload)
    assert r.status_code == 200, f"WhatsApp template save failed: {r.text}"
    print(f"   [OK] WhatsApp Template Persisted: {r.json()['label']}")

    r = client.get("/api/v1/pms/whatsapp-templates")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] WhatsApp Templates Query: Found {len(r.json())} template(s)")

    # 38. Test Role Permissions Matrix
    role_payload = {
        "roleId": "front-desk-lead",
        "name": "Front Desk Lead",
        "description": "Front office shift supervisor",
        "permissions": ["roombooking", "checkin", "checkout", "foodbill", "kot"]
    }
    r = client.post("/api/v1/pms/roles", json=role_payload)
    assert r.status_code == 200, f"Role save failed: {r.text}"
    print(f"   [OK] Role Permission Persisted: {r.json()['name']}")

    r = client.get("/api/v1/pms/roles")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Roles Query: Found {len(r.json())} role(s)")

    # 39. Test No-Discount Margin Protection Config
    no_disc_payload = {
        "enabled": True,
        "protectedGroups": ["Beverage", "Liquor", "Tobacco", "Mineral Water"],
        "maxAllowedDiscountPercent": 15.0,
        "allowManualOverride": True,
        "overrideRoleRequired": "Admin"
    }
    r = client.post("/api/v1/pms/no-discount-config", json=no_disc_payload)
    assert r.status_code == 200, f"No-discount config update failed: {r.text}"
    print(f"   [OK] No-Discount Margin Protection Persisted: {r.json()['message']}")

    r = client.get("/api/v1/pms/no-discount-config")
    assert r.status_code == 200
    assert "Mineral Water" in r.json()["protectedGroups"]
    print(f"   [OK] No-Discount Config Query: Max {r.json()['maxAllowedDiscountPercent']}%, {len(r.json()['protectedGroups'])} protected group(s)")

    # 40. Test Liquor Brands & Dispensing Units
    lb_payload = {
        "name": "Royal Challenge Reserve",
        "discountPercentage": 0.0,
        "status": "ACTIVE"
    }
    r = client.post("/api/v1/pms/liquor-brands", json=lb_payload)
    assert r.status_code == 200, f"Liquor brand save failed: {r.text}"
    print(f"   [OK] Liquor Brand Persisted: {r.json()['name']}")

    lu_payload = {
        "primaryUnitName": "Large Peg 60ml",
        "conversion": 60.0,
        "alternateUnitName": "ML"
    }
    r = client.post("/api/v1/pms/liquor-units", json=lu_payload)
    assert r.status_code == 200, f"Liquor unit save failed: {r.text}"
    print(f"   [OK] Liquor Dispensing Unit Persisted: {r.json()['primaryUnitName']}")

    # 41. Test Discount Audit Logs (Anti-Theft Manager PIN Overrides)
    dal_payload = {
        "billNo": "BILL-TEST-8899",
        "roomNo": "101",
        "customerName": "Test VIP Guest",
        "grossAmount": 3000.0,
        "discountPercent": 10.0,
        "discountAmount": 300.0,
        "reason": "General Manager Courteous Approval",
        "managerName": "Duty GM",
        "marginSaved": 150.0,
        "protectedItemsPrevented": 1
    }
    r = client.post("/api/v1/pms/discount-audit-logs", json=dal_payload)
    assert r.status_code == 200, f"Discount audit log save failed: {r.text}"
    print(f"   [OK] Discount Audit Log Persisted: {r.json()['auditId']} (Bill: {r.json()['billNo']})")

    r = client.get("/api/v1/pms/discount-audit-logs")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Discount Audit Logs Query: Found {len(r.json())} audit log(s)")

    # 42. Test Multi-Branch Hotel Properties Master
    prop_payload = {
        "firmId": "branch-02",
        "name": "HOTEL SAI VASUDEV RESIDENCY (EXECUTIVE ANNEX)",
        "code": "SVR-ANNEX",
        "city": "Shirdi",
        "totalRooms": 24
    }
    r = client.post("/api/v1/pms/properties", json=prop_payload)
    assert r.status_code == 200, f"Property save failed: {r.text}"
    print(f"   [OK] Hotel Property Persisted: {r.json()['name']} ({r.json()['firmId']})")

    r = client.get("/api/v1/pms/properties")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Hotel Properties Query: Found {len(r.json())} property(ies)")

    # 43. Test Extend Stay on Active Booking
    extend_payload = {
        "roomNo": "101",
        "newCheckOutDate": "2026-10-30",
        "extendedBy": "Front Desk Manager"
    }
    r = client.put("/api/v1/pms/bookings/extend-stay", json=extend_payload)
    assert r.status_code == 200, f"Extend stay failed: {r.text}"
    print(f"   [OK] Extend Stay Persisted: Room {r.json()['roomNo']} to {r.json()['newCheckOutDate']}")

    # 44. Test Room Folio Incidental Charges
    charge_payload = {
        "roomNo": "101",
        "chargeName": "Extra Bed Rollaway Service",
        "amount": 500.0,
        "sacCode": "996311",
        "gstPercent": 12.0
    }
    r = client.post("/api/v1/pms/room-folio-items", json=charge_payload)
    assert r.status_code == 200, f"Room folio charge failed: {r.text}"
    print(f"   [OK] Room Folio Charge Persisted: {r.json()['chargeName']} (Rs.{r.json()['totalAmount']})")

    r = client.get("/api/v1/pms/room-folio-items/101")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Room Folio Items Query: Found {len(r.json())} charge(s)")

    # 45. Test Housekeeping Discrepancy Resolution
    r = client.put("/api/v1/pms/housekeeping-discrepancies/1/resolve", json={"notes": "Physical key card audit verified room vacant"})
    assert r.status_code == 200
    print(f"   [OK] Housekeeping Discrepancy Resolve Endpoint Tested: {r.json()['message']}")

    # 46. Test Demo Requests / Enterprise Leads
    demo_payload = {
        "name": "Prasad Rao",
        "hotelName": "Hotel Sai Grand Residency",
        "phone": "9822334455",
        "city": "Shirdi",
        "roomCount": 35,
        "message": "Interested in cloud PMS deployment with GST invoicing"
    }
    r = client.post("/api/v1/pms/demo-requests", json=demo_payload)
    assert r.status_code == 200, f"Demo request failed: {r.text}"
    print(f"   [OK] Demo Request Persisted in PostgreSQL: {r.json()['leadId']} ({r.json()['name']})")

    # 47. Test Generic Master Items (GST, Business Source, Other Charges)
    master_payload = {
        "category": "gst",
        "name": "GST 18% Special Luxury",
        "itemData": {"cgst": 9.0, "sgst": 9.0, "total": 18.0}
    }
    r = client.post("/api/v1/pms/master-items", json=master_payload)
    assert r.status_code == 200, f"Master item save failed: {r.text}"
    print(f"   [OK] Master Item Persisted: {r.json()['category']} -> {r.json()['itemName']}")

    r = client.delete("/api/v1/pms/master-items/gst/GST%2018%25%20Special%20Luxury")
    assert r.status_code == 200
    print(f"   [OK] Master Item Deleted: {r.json()['message']}")

    # 48. Test Restaurant Table Shifts
    shift_payload = {
        "from_table": "Table 1",
        "to_table": "Table 4",
        "transferred_count": 2,
        "reason": "Guest moved to AC corner",
        "shifted_by": "Senior Steward"
    }
    r = client.post("/api/v1/pms/restaurant/table-shifts", json=shift_payload)
    assert r.status_code == 200, f"Table shift failed: {r.text}"
    print(f"   [OK] Table Shift Persisted: {r.json()['shift_id']}")

    r = client.get("/api/v1/pms/restaurant/table-shifts")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Table Shifts Query: Found {len(r.json())} shift record(s)")

    # 49. Test Dining Table Sessions
    session_payload = {
        "session_id": f"TSESS-{int(time.time())}",
        "table_no": "Table 4",
        "start_time": "12:30 PM",
        "status": "Active",
        "kot_numbers_json": '["KOT-101", "KOT-102"]',
        "cumulative_items_json": '[{"name": "Paneer Butter Masala", "qty": 1, "rate": 260}]',
        "cumulative_amount": 260.0
    }
    r = client.post("/api/v1/pms/restaurant/table-sessions", json=session_payload)
    assert r.status_code == 200, f"Table session save failed: {r.text}"
    print(f"   [OK] Table Session Persisted: {r.json()['sessionId']}")

    r = client.get("/api/v1/pms/restaurant/table-sessions")
    assert r.status_code == 200
    print(f"   [OK] Table Sessions Query: Found {len(r.json())} active session(s)")

    # 50. Test Housekeeping Discrepancy Recording
    hk_disc_payload = {
        "room_no": "205",
        "front_desk_status": "Vacant",
        "housekeeping_status": "Occupied",
        "reported_by": "Duty Housekeeper Sunita",
        "remarks": "Baggage detected in room marked vacant"
    }
    r = client.post("/api/v1/pms/housekeeping-discrepancies", json=hk_disc_payload)
    assert r.status_code == 200, f"HK discrepancy save failed: {r.text}"
    print(f"   [OK] Housekeeping Discrepancy Created: {r.json()['discrepancyId']}")

    r = client.get("/api/v1/pms/housekeeping-discrepancies")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Housekeeping Discrepancies Query: Found {len(r.json())} discrepancy(ies)")

    # 51. Test RFID Key Cards
    card_number = f"CARD-{int(time.time())}"
    keycard_payload = {
        "card_number": card_number,
        "room_no": "101",
        "guest_name": "Rakesh Nandyala",
        "check_in_time": "2026-10-27 10:00 AM",
        "valid_until": "2026-10-28 11:00 AM",
        "status": "Active",
        "issued_by": "Front Desk Receptionist"
    }
    r = client.post("/api/v1/pms/key-cards", json=keycard_payload)
    assert r.status_code == 200, f"Key card issuance failed: {r.text}"
    print(f"   [OK] RFID Key Card Issued: {r.json()['cardNumber']}")

    r = client.put(f"/api/v1/pms/key-cards/{card_number}/extend", json={"valid_until": "2026-10-28 02:00 PM"})
    assert r.status_code == 200
    print(f"   [OK] RFID Key Card Extended: {r.json()['cardNumber']} until {r.json()['validUntil']}")

    r = client.get("/api/v1/pms/key-cards")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] RFID Key Cards Query: Found {len(r.json())} card(s)")

    # 52. Test Hotel Company Info
    company_payload = {
        "property_name": "Hotel Sai Vasudev Residency",
        "address": "Main Road, Near Temple, Shirdi",
        "city": "Shirdi",
        "state": "Maharashtra",
        "pincode": "423109",
        "phone": "+91 94402 89999",
        "email": "info@saivasudevresidency.com",
        "gstin": "27AABCS1234F1Z5",
        "default_bill_format": "standard"
    }
    r = client.post("/api/v1/pms/company-info", json=company_payload)
    assert r.status_code == 200, f"Company info save failed: {r.text}"
    print(f"   [OK] Hotel Company Info Persisted: {r.json()['propertyName']}")

    r = client.get("/api/v1/pms/company-info")
    assert r.status_code == 200
    assert r.json()['propertyName'] == "Hotel Sai Vasudev Residency"
    print(f"   [OK] Hotel Company Info Query: {r.json()['propertyName']} ({r.json()['city']})")

    # 53. Test Virtual Accounts
    va_acc = f"VA9999{int(time.time())}"
    va_payload = {
        "account_number": va_acc,
        "ifsc": "YESB0CMSNOC",
        "upi_id": f"{va_acc}@yesbank",
        "guest_name": "JK Paper Ltd Corporate",
        "status": "Active"
    }
    r = client.post("/api/v1/pms/virtual-accounts", json=va_payload)
    assert r.status_code == 200, f"Virtual account create failed: {r.text}"
    print(f"   [OK] Virtual Account Persisted: {r.json()['accountNumber']} ({r.json()['upiId']})")

    r = client.get("/api/v1/pms/virtual-accounts")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    print(f"   [OK] Virtual Accounts Query: Found {len(r.json())} account(s)")

    # 54. Test Manager PIN Verification
    r = client.post("/api/v1/pms/auth/verify-manager-pin", json={"pin": "9999"})
    assert r.status_code == 200
    assert r.json()["verified"] is True
    print(f"   [OK] Manager PIN Verified in Database: {r.json()['manager']}")

    r = client.post("/api/v1/pms/auth/verify-manager-pin", json={"pin": "0000"})
    assert r.status_code == 401
    print("   [OK] Manager PIN Invalid Rejection Verified")

    # 55. Test Booking Confirmation Transition
    # Create a stub booking to confirm
    b_test = models.Booking(
        booking_ref=f"SVR-CONFIRM-{int(time.time())}",
        invoice_number=f"INV-SVR-{int(time.time()*1000)}-{uuid.uuid4().hex[:4].upper()}",
        room_id=1,
        guest_name="Confirm Test Guest",
        guest_email="confirm@sai-vasudev.com",
        guest_phone="9440289999",
        check_in_date="2026-10-27",
        check_out_date="2026-10-28",
        base_rate=2000.0,
        base_amount=2000.0,
        total_price=2000.0,
        status="Pending"
    )
    db.add(b_test)
    db.commit()
    db.refresh(b_test)

    r = client.put(f"/api/v1/pms/bookings/{b_test.id}/confirm")
    assert r.status_code == 200
    assert r.json()["status"] == "Confirmed"
    print(f"   [OK] Booking Confirmation Transition Persisted: Booking {b_test.id} -> Confirmed")

    print("\n=== ALL PARITY ENDPOINTS TESTED & PASSED 100%! ===")

if __name__ == "__main__":
    test_parity_endpoints()

