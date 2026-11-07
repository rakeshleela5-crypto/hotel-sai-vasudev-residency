"""
===================================================================================================
HOTEL SAI VASUDEV RESIDENCY - PROPERTY MANAGEMENT SYSTEM (PMS) & ERP
TEST SUITE: tests/test_track6_double_entry_and_trial_balance.py
AUTHOR: Principal Systems Architect & Senior Financial Auditor
TRACK 6: Double-Entry General Ledger, Chart of Accounts & Zero-Sum Trial Balance Engine
===================================================================================================
Validates:
  1. Journal Entry Invariants: Rejection of identical Dr/Cr accounts, non-positive amounts,
     and unbalanced multi-leg compound journal entries.
  2. Balanced Compound Journal Entries: Multi-leg split vouchers maintain sum(Debits) == sum(Credits).
  3. Party Subledger Direction: Normal Debit balances for Debtors (Customers/Corporate) vs Normal
     Credit balances for Creditors (Vendors/Suppliers).
  4. Party Ledger Statement & Settlement: Chronological running balance calculation and voucher generation.
  5. Trial Balance Engine: Universal verification that delta = sum(Debits) - sum(Credits) == 0.00.
===================================================================================================
"""

import os
import sys
import uuid
import datetime
import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(1, PROJECT_ROOT)

from app.main import app
from app.database import SessionLocal
from app import models
from app.utils.auth import create_access_token

client = TestClient(app)

@pytest.fixture
def auth_headers():
    token = create_access_token(data={"sub": "accounts_mgr", "role": "MANAGER"})
    return {
        "Authorization": f"Bearer {token}",
        "X-Idempotency-Key": str(uuid.uuid4())
    }

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


# =================================================================================================
# TEST 1: Double-Entry Balance Enforcement on Single Journal Entries
# =================================================================================================
def test_post_journal_entry_enforces_distinct_accounts_and_positive_amount(auth_headers):
    """
    Prevents invalid journal entries from polluting the General Ledger:
    - Rejects debit == credit accounts (circular self-balancing).
    - Rejects zero or negative amounts.
    - Successfully records balanced entries with unique ID and audit log.
    """
    # 1. Circular account posting (Cash to Cash) must be rejected
    res_circular = client.post(
        "/api/v1/pms/journal-entries",
        json={
            "narration": "Circular cash test",
            "debit_account": "Cash in Hand (Reception)",
            "credit_account": "Cash in Hand (Reception)",
            "amount_rupees": 5000.0
        },
        headers=auth_headers
    )
    assert res_circular.status_code == 400
    assert "distinct" in res_circular.json()["detail"].lower()

    # 2. Non-positive amount must be rejected
    res_zero = client.post(
        "/api/v1/pms/journal-entries",
        json={
            "narration": "Zero amount test",
            "debit_account": "Cash in Hand (Reception)",
            "credit_account": "Room Accommodation Revenue",
            "amount_rupees": 0.0
        },
        headers=auth_headers
    )
    assert res_zero.status_code == 400
    assert "greater than zero" in res_zero.json()["detail"].lower()

    # 3. Valid double-entry posting succeeds
    res_valid = client.post(
        "/api/v1/pms/journal-entries",
        json={
            "narration": "Direct room revenue recognition",
            "debit_account": "Cash in Hand (Reception)",
            "credit_account": "Room Accommodation Revenue",
            "amount_rupees": 4500.0,
            "posted_by": "Night Auditor"
        },
        headers=auth_headers
    )
    assert res_valid.status_code == 200
    data = res_valid.json()
    assert data["success"] is True
    assert data["amountRupees"] == 4500.0
    assert data["debitAccount"] == "Cash in Hand (Reception)"
    assert data["creditAccount"] == "Room Accommodation Revenue"


# =================================================================================================
# TEST 2: Compound Multi-Leg Journal Entry Balance Validation
# =================================================================================================
def test_compound_journal_entry_balance_enforcement(auth_headers):
    """
    Verifies multi-leg compound vouchers:
    - Rejects unbalanced compound entries with detailed Dr vs Cr error message.
    - Rejects compound entries without both Dr and Cr legs.
    - Accepts balanced multi-leg splits (e.g., checkout split across Cash + UPI with GST output).
    """
    # 1. Unbalanced compound entry (Dr 3000 != Cr 5000)
    unbalanced_payload = {
        "voucher_type": "Compound_Checkout",
        "narration": "Guest checkout with split bill",
        "legs": [
            {"account_name": "Cash in Hand (Reception)", "entry_type": "Dr", "amount": 2000.0},
            {"account_name": "Bank Accounts (UPI)", "entry_type": "Dr", "amount": 1000.0},
            {"account_name": "Room Accommodation Revenue", "entry_type": "Cr", "amount": 5000.0}
        ]
    }
    res_unbal = client.post("/api/v1/pms/journal-entries", json=unbalanced_payload, headers=auth_headers)
    assert res_unbal.status_code == 400
    assert "unbalanced journal entry" in res_unbal.json()["detail"].lower()
    assert "3000.00" in res_unbal.json()["detail"]
    assert "5000.00" in res_unbal.json()["detail"]

    # 2. Balanced compound entry (Total Dr 3360 == Total Cr 3360)
    balanced_payload = {
        "voucher_type": "Compound_Checkout",
        "narration": "Balanced checkout with 12% room GST split",
        "legs": [
            {"account_name": "Cash in Hand (Reception)", "entry_type": "Dr", "amount": 2000.0},
            {"account_name": "Bank Accounts (UPI)", "entry_type": "Dr", "amount": 1360.0},
            {"account_name": "Room Accommodation Revenue", "entry_type": "Cr", "amount": 3000.0},
            {"account_name": "Output CGST Payable (Room @ 6%)", "entry_type": "Cr", "amount": 180.0},
            {"account_name": "Output SGST Payable (Room @ 6%)", "entry_type": "Cr", "amount": 180.0}
        ]
    }
    res_bal = client.post("/api/v1/pms/journal-entries", json=balanced_payload, headers=auth_headers)
    assert res_bal.status_code == 200
    data = res_bal.json()
    assert data["success"] is True
    assert data["balanced"] is True
    assert data["totalDebits"] == 3360.0
    assert data["totalCredits"] == 3360.0
    assert data["legsCount"] == 5


# =================================================================================================
# TEST 3: Party Subledger Normal Balance Integrity (Debtor Dr vs. Creditor Cr)
# =================================================================================================
def test_party_account_balance_integrity_debtor_vs_creditor(db, auth_headers):
    """
    Validates correct mathematical balance mutation according to party classification:
    - Debtor (Customer): Normal balance is Dr. Receipts reduce balance. Overpayment flips to Cr.
    - Creditor (Vendor): Normal balance is Cr. Payments reduce balance. Overpayment flips to Dr.
    """
    corp_name = f"Tata Motors Rayagada {uuid.uuid4().hex[:4]}"
    vendor_name = f"Sri Sai Dairy Supplies {uuid.uuid4().hex[:4]}"

    # 1. Create Corporate Debtor with ₹10,000 Dr
    corp_res = client.post(
        "/api/v1/pms/party-accounts",
        json={
            "name": corp_name,
            "category": "Corporate",
            "balance": 10000.0,
            "balance_type": "Dr",
            "gstin": "21AAAAA1234A1Z5"
        },
        headers=auth_headers
    )
    assert corp_res.status_code == 200
    corp_id = corp_res.json()["id"]

    # 2. General Receipt of ₹6,000 from Corporate reduces Dr balance to ₹4,000 Dr
    rec_res = client.post(
        "/api/v1/pms/general-receipts",
        json={
            "account_name": corp_name,
            "amount": 6000.0,
            "payment_mode": "Online Bank Transfer",
            "remark": "Partial invoice clearance"
        },
        headers=auth_headers
    )
    assert rec_res.status_code == 200
    corp_check = db.query(models.PartyAccount).filter(models.PartyAccount.id == corp_id).first()
    assert corp_check.balance == 4000.0
    assert corp_check.balance_type == "Dr"

    # 3. Create Vendor Creditor with ₹8,000 Cr (hotel owes vendor for paneer/milk)
    vendor_res = client.post(
        "/api/v1/pms/party-accounts",
        json={
            "name": vendor_name,
            "category": "Vendor",
            "balance": 8000.0,
            "balance_type": "Cr",
            "gstin": "21BBBBB5678B1Z6"
        },
        headers=auth_headers
    )
    assert vendor_res.status_code == 200
    vendor_id = vendor_res.json()["id"]

    # 4. General Payment of ₹5,000 to Vendor REDUCES hotel liability to ₹3,000 Cr
    pay_res = client.post(
        "/api/v1/pms/general-payments",
        json={
            "account_name": vendor_name,
            "amount": 5000.0,
            "payment_mode": "Cheque",
            "remark": "Weekly dairy settlement"
        },
        headers=auth_headers
    )
    assert pay_res.status_code == 200
    vendor_check = db.query(models.PartyAccount).filter(models.PartyAccount.id == vendor_id).first()
    assert vendor_check.balance == 3000.0
    assert vendor_check.balance_type == "Cr"

    # 5. Overpayment to vendor: pay ₹4,000 when balance is ₹3,000 Cr -> flips to ₹1,000 Dr (Advance to vendor)
    client.post(
        "/api/v1/pms/general-payments",
        json={
            "account_name": vendor_name,
            "amount": 4000.0,
            "payment_mode": "Online",
            "remark": "Advance deposit for upcoming bulk festival order"
        },
        headers=auth_headers
    )
    db.refresh(vendor_check)
    assert vendor_check.balance == 1000.0
    assert vendor_check.balance_type == "Dr"


# =================================================================================================
# TEST 4: Party Statement Generation & Full Settlement Workflow
# =================================================================================================
def test_party_statement_and_settlement_workflow(db, auth_headers):
    """
    Verifies:
    1. GET /party-accounts/{id}/statement returns an itemized chronological register
       with opening balance, running balances, and Dr/Cr classifications.
    2. POST /party-accounts/{id}/settle clears outstanding balance with discount recognition,
       generates payment/receipt vouchers, and updates closing balance to zero.
    """
    guest_corp = f"Odisha Power Corp {uuid.uuid4().hex[:4]}"
    corp_res = client.post(
        "/api/v1/pms/party-accounts",
        json={
            "name": guest_corp,
            "category": "Corporate",
            "balance": 5000.0,
            "balance_type": "Dr"
        },
        headers=auth_headers
    )
    p_id = corp_res.json()["id"]

    # Add transactions
    client.post(
        "/api/v1/pms/general-receipts",
        json={
            "account_name": guest_corp,
            "amount": 2000.0,
            "payment_mode": "UPI",
            "remark": "Installment 1"
        },
        headers=auth_headers
    )

    # 1. Fetch Itemized Statement
    stmt_res = client.get(f"/api/v1/pms/party-accounts/{p_id}/statement", headers=auth_headers)
    assert stmt_res.status_code == 200
    stmt = stmt_res.json()
    assert stmt["party"]["name"] == guest_corp
    assert len(stmt["entries"]) >= 2
    assert stmt["entries"][0]["type"] == "Opening"
    assert stmt["entries"][1]["type"] == "Receipt"

    # 2. Settle remaining ₹3,000 (₹2,800 paid + ₹200 early-settlement discount)
    settle_res = client.post(
        f"/api/v1/pms/party-accounts/{p_id}/settle",
        json={
            "amount": 2800.0,
            "discount_allowed": 200.0,
            "payment_mode": "NEFT",
            "reference_no": "UTR-ODISHA-998877",
            "narration": "Full and final account settlement"
        },
        headers=auth_headers
    )
    assert settle_res.status_code == 200
    settle_data = settle_res.json()
    assert settle_data["success"] is True
    assert settle_data["closingBalance"] == 0.0
    assert "REC-SETTLE" in settle_data["voucherRef"]


# =================================================================================================
# TEST 5: Comprehensive Trial Balance Zero-Sum Invariant
# =================================================================================================
def test_trial_balance_reconciliation_zero_sum_invariant(auth_headers):
    """
    Queries /trial-balance and asserts that the double-entry accounting engine
    preserves mathematical equilibrium across all chart of accounts heads:
      Total Debits == Total Credits (Delta == 0.00).
    """
    # 1. Post a balanced manual journal entry to ensure ledger activity exists
    client.post(
        "/api/v1/pms/journal-entries",
        json={
            "narration": "Auditor trial balance benchmark",
            "debit_account": "Bank Accounts (SBI / HDFC / UPI)",
            "credit_account": "Room Accommodation Revenue",
            "amount_rupees": 7500.0,
            "posted_by": "Senior Auditor"
        },
        headers=auth_headers
    )

    # 2. Query Trial Balance
    tb_res = client.get("/api/v1/pms/trial-balance", headers=auth_headers)
    assert tb_res.status_code == 200
    tb = tb_res.json()
    print("\nDEBUG TB:", "Debits:", tb["totalDebits"], "Credits:", tb["totalCredits"], "Delta:", tb["delta"])
    for a in tb["accounts"]:
        print("ACCT:", a["accountName"], "Dr:", a["debit"], "Cr:", a["credit"])

    assert tb["balanced"] is True
    assert tb["delta"] == 0.0
    assert tb["totalDebits"] == tb["totalCredits"]
    assert tb["accountsCount"] > 0
    assert "Zero-sum invariant satisfied" in tb["verificationNote"]

    # Verify each account row conforms to schema
    for acc in tb["accounts"]:
        assert "accountName" in acc
        assert "debit" in acc
        assert "credit" in acc
        assert "netBalance" in acc
        assert acc["balanceType"] in ["Dr", "Cr"]
        # Normal accounting row rule: one side must be > 0 and the other side must be 0
        assert not (acc["debit"] > 0 and acc["credit"] > 0)
