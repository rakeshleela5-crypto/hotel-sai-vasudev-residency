import datetime
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import get_db
from app import models
from app.utils.timezone import now_utc

client = TestClient(app)

@pytest.fixture
def db_session():
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

# -------------------------------------------------------------------------
# Test 1: Create corporate receivable with automated payment terms
# -------------------------------------------------------------------------
def test_create_corporate_receivable_with_terms(db_session: Session):
    party_name = f"Vedanta Alumina Ltd_{uuid.uuid4().hex[:6]}"
    inv_no = f"INV-CORP-{uuid.uuid4().hex[:8]}"

    # Seed party account
    party = models.PartyAccount(
        id=f"pa_{uuid.uuid4().hex[:8]}",
        name=party_name,
        category="Corporate",
        credit_limit_rupees=200000.0,
        credit_limit_paise=20000000,
        payment_terms_days=30
    )
    db_session.add(party)
    db_session.commit()

    res = client.post("/api/v1/pms/corporate/receivables", json={
        "invoice_no": inv_no,
        "party_name": party_name,
        "guest_name": "Executive Mr. Debashish Ray",
        "booking_ref": "BK-CORP-01",
        "invoice_date": datetime.date.today().isoformat(),
        "invoice_amount": 45000.0,
        "notes": "10 Room nights for annual audit team"
    })
    assert res.status_code == 201
    data = res.json()

    assert data["invoice_no"] == inv_no
    assert data["party_name"] == party_name
    assert data["invoice_amount"] == 45000.0
    assert data["outstanding_amount"] == 45000.0
    assert data["status"] == "Unpaid"
    assert data["aging_bucket"] == "Current"

# -------------------------------------------------------------------------
# Test 2: Reject duplicate invoice receivable
# -------------------------------------------------------------------------
def test_duplicate_corporate_invoice_rejected(db_session: Session):
    inv_no = f"INV-DUP-{int(now_utc().timestamp()) % 100000}"
    client.post("/api/v1/pms/corporate/receivables", json={
        "invoice_no": inv_no,
        "party_name": "JK Paper Mills",
        "invoice_amount": 10000.0
    })

    # Duplicate call
    res = client.post("/api/v1/pms/corporate/receivables", json={
        "invoice_no": inv_no,
        "party_name": "JK Paper Mills",
        "invoice_amount": 10000.0
    })
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]

# -------------------------------------------------------------------------
# Test 3: Industrial AR Aging Report accurately groups into 5 buckets
# -------------------------------------------------------------------------
def test_aging_report_buckets_classification(db_session: Session):
    party_name = f"Utkal Alumina Corp_{now_utc().timestamp()}"
    today = datetime.date.today()

    # Ingest 5 invoices across distinct aging buckets
    # 1. Current (Due in 5 days)
    client.post("/api/v1/pms/corporate/receivables", json={
        "invoice_no": f"INV-AGE-1-{int(now_utc().timestamp()) % 10000}",
        "party_name": party_name,
        "invoice_date": today.isoformat(),
        "due_date": (today + datetime.timedelta(days=5)).isoformat(),
        "invoice_amount": 5000.0
    })
    # 2. 1-30 Days Overdue (Due 15 days ago)
    client.post("/api/v1/pms/corporate/receivables", json={
        "invoice_no": f"INV-AGE-2-{int(now_utc().timestamp()) % 10000}",
        "party_name": party_name,
        "invoice_date": (today - datetime.timedelta(days=45)).isoformat(),
        "due_date": (today - datetime.timedelta(days=15)).isoformat(),
        "invoice_amount": 10000.0
    })
    # 3. 31-60 Days Overdue (Due 45 days ago)
    client.post("/api/v1/pms/corporate/receivables", json={
        "invoice_no": f"INV-AGE-3-{int(now_utc().timestamp()) % 10000}",
        "party_name": party_name,
        "invoice_date": (today - datetime.timedelta(days=75)).isoformat(),
        "due_date": (today - datetime.timedelta(days=45)).isoformat(),
        "invoice_amount": 15000.0
    })
    # 4. 61-90 Days Overdue (Due 75 days ago)
    client.post("/api/v1/pms/corporate/receivables", json={
        "invoice_no": f"INV-AGE-4-{int(now_utc().timestamp()) % 10000}",
        "party_name": party_name,
        "invoice_date": (today - datetime.timedelta(days=105)).isoformat(),
        "due_date": (today - datetime.timedelta(days=75)).isoformat(),
        "invoice_amount": 20000.0
    })
    # 5. 90+ Days Overdue (Due 120 days ago)
    client.post("/api/v1/pms/corporate/receivables", json={
        "invoice_no": f"INV-AGE-5-{int(now_utc().timestamp()) % 10000}",
        "party_name": party_name,
        "invoice_date": (today - datetime.timedelta(days=150)).isoformat(),
        "due_date": (today - datetime.timedelta(days=120)).isoformat(),
        "invoice_amount": 25000.0
    })

    res = client.get("/api/v1/pms/corporate/aging-report")
    assert res.status_code == 200
    report = res.json()

    assert report["total_receivables"] >= 75000.0
    assert "Current" in report["summary_by_bucket"]
    assert "1-30 Days" in report["summary_by_bucket"]
    assert "31-60 Days" in report["summary_by_bucket"]
    assert "61-90 Days" in report["summary_by_bucket"]
    assert "90+ Days" in report["summary_by_bucket"]

    # Verify party row
    party_row = next((r for r in report["corporate_clients"] if r["party_name"] == party_name), None)
    assert party_row is not None
    assert party_row["current_amount"] == 5000.0
    assert party_row["bucket_1_30_days"] == 10000.0
    assert party_row["bucket_31_60_days"] == 15000.0
    assert party_row["bucket_61_90_days"] == 20000.0
    assert party_row["bucket_90_plus_days"] == 25000.0
    assert party_row["total_outstanding"] == 75000.0
    assert party_row["is_credit_blocked"] is True  # Blocked due to 90+ days overdue

# -------------------------------------------------------------------------
# Test 4: Corporate Settlement FIFO auto-allocation across oldest invoices
# -------------------------------------------------------------------------
def test_corporate_settlement_fifo_auto_allocation(db_session: Session):
    party_name = f"Adani Logistics_{now_utc().timestamp()}"
    today = datetime.date.today()

    inv1_res = client.post("/api/v1/pms/corporate/receivables", json={
        "invoice_no": f"INV-FIFO-1-{int(now_utc().timestamp()) % 10000}",
        "party_name": party_name,
        "due_date": (today - datetime.timedelta(days=20)).isoformat(),
        "invoice_amount": 10000.0
    }).json()

    inv2_res = client.post("/api/v1/pms/corporate/receivables", json={
        "invoice_no": f"INV-FIFO-2-{int(now_utc().timestamp()) % 10000}",
        "party_name": party_name,
        "due_date": (today - datetime.timedelta(days=5)).isoformat(),
        "invoice_amount": 20000.0
    }).json()

    # Remit ₹15,000 via NEFT (should fully settle inv1 and partially settle inv2 by ₹5,000)
    settle_res = client.post("/api/v1/pms/corporate/settle-invoices", json={
        "party_name": party_name,
        "payment_amount": 15000.0,
        "payment_mode": "NEFT",
        "bank_utr_ref": "UTR-HDFC-9918237"
    })
    assert settle_res.status_code == 200
    s_data = settle_res.json()

    assert s_data["status"] == "success"
    assert s_data["total_paid_rupees"] == 15000.0
    assert s_data["invoices_settled_count"] == 1
    assert len(s_data["allocations"]) == 2

    # Verify Inv 1 is Settled and Inv 2 has 15,000 remaining
    inv1_db = db_session.query(models.CorporateInvoiceReceivable).filter(models.CorporateInvoiceReceivable.id == inv1_res["id"]).first()
    inv2_db = db_session.query(models.CorporateInvoiceReceivable).filter(models.CorporateInvoiceReceivable.id == inv2_res["id"]).first()

    assert inv1_db.status == "Settled"
    assert inv1_db.outstanding_amount == 0.0
    assert inv2_db.status == "Partially Paid"
    assert inv2_db.outstanding_amount == 15000.0

# -------------------------------------------------------------------------
# Test 5: Corporate Settlement with Statutory Section 194C TDS (2%)
# -------------------------------------------------------------------------
def test_corporate_settlement_with_statutory_tds(db_session: Session):
    party_name = f"Tata Steel Mining_{now_utc().timestamp()}"
    today = datetime.date.today()

    inv = client.post("/api/v1/pms/corporate/receivables", json={
        "invoice_no": f"INV-TDS-{int(now_utc().timestamp()) % 10000}",
        "party_name": party_name,
        "due_date": today.isoformat(),
        "invoice_amount": 50000.0
    }).json()

    # Remittance net payment: ₹49,000; TDS: 2% (Gross: ₹50,000)
    settle_res = client.post("/api/v1/pms/corporate/settle-invoices", json={
        "party_name": party_name,
        "payment_amount": 49000.0,
        "payment_mode": "RTGS",
        "tds_rate_pct": 2.0,
        "bank_utr_ref": "RTGS-SBI-8827361"
    })
    assert settle_res.status_code == 200
    data = settle_res.json()

    assert data["total_paid_rupees"] == 49000.0
    assert data["total_tds_rupees"] == 1000.0
    assert data["total_credited_rupees"] == 50000.0
    assert data["invoices_settled_count"] == 1

    # Verify invoice is fully cleared
    inv_db = db_session.query(models.CorporateInvoiceReceivable).filter(models.CorporateInvoiceReceivable.id == inv["id"]).first()
    assert inv_db.status == "Settled"
    assert inv_db.outstanding_amount == 0.0

# -------------------------------------------------------------------------
# Test 6: Manual selective invoice allocation
# -------------------------------------------------------------------------
def test_corporate_settlement_manual_allocation(db_session: Session):
    party_name = f"Railway Division Rayagada_{now_utc().timestamp()}"
    today = datetime.date.today()

    inv1 = client.post("/api/v1/pms/corporate/receivables", json={
        "invoice_no": f"INV-MAN-1-{int(now_utc().timestamp()) % 10000}",
        "party_name": party_name,
        "due_date": today.isoformat(),
        "invoice_amount": 12000.0
    }).json()
    inv2 = client.post("/api/v1/pms/corporate/receivables", json={
        "invoice_no": f"INV-MAN-2-{int(now_utc().timestamp()) % 10000}",
        "party_name": party_name,
        "due_date": today.isoformat(),
        "invoice_amount": 18000.0
    }).json()

    # Selectively settle only Inv 2
    res = client.post("/api/v1/pms/corporate/settle-invoices", json={
        "party_name": party_name,
        "payment_amount": 18000.0,
        "payment_mode": "Cheque",
        "allocations": [
            {"receivable_id": inv2["id"], "allocated_amount": 18000.0}
        ]
    })
    assert res.status_code == 200

    inv1_db = db_session.query(models.CorporateInvoiceReceivable).filter(models.CorporateInvoiceReceivable.id == inv1["id"]).first()
    inv2_db = db_session.query(models.CorporateInvoiceReceivable).filter(models.CorporateInvoiceReceivable.id == inv2["id"]).first()
    assert inv1_db.status == "Unpaid"
    assert inv2_db.status == "Settled"

# -------------------------------------------------------------------------
# Test 7: Credit Check within limit is permitted
# -------------------------------------------------------------------------
def test_credit_check_within_limit_allowed(db_session: Session):
    party_name = f"Indian Oil Corp_{uuid.uuid4().hex[:6]}"

    party = models.PartyAccount(
        id=f"pa_{uuid.uuid4().hex[:8]}",
        name=party_name,
        category="Corporate",
        credit_limit_rupees=100000.0,
        credit_limit_paise=10000000
    )
    db_session.add(party)
    db_session.commit()

    # Check request of ₹35,000 (well within ₹1,00,000 limit)
    res = client.post("/api/v1/pms/corporate/credit-check", json={
        "party_name": party_name,
        "requested_credit_amount": 35000.0
    })
    assert res.status_code == 200
    data = res.json()
    assert data["allowed"] is True
    assert data["is_over_limit"] is False
    assert data["available_credit"] == 100000.0

# -------------------------------------------------------------------------
# Test 8: Credit Check exceeding limit requires Manager PIN override
# -------------------------------------------------------------------------
def test_credit_check_exceeding_limit_requires_manager_pin(db_session: Session):
    party_name = f"NALCO Ltd_{uuid.uuid4().hex[:6]}"

    party = models.PartyAccount(
        id=f"pa_{uuid.uuid4().hex[:8]}",
        name=party_name,
        category="Corporate",
        credit_limit_rupees=50000.0,
        credit_limit_paise=5000000
    )
    db_session.add(party)
    db_session.commit()

    # Request ₹60,000 (> ₹50,000 limit) without PIN -> Blocked
    res_no_pin = client.post("/api/v1/pms/corporate/credit-check", json={
        "party_name": party_name,
        "requested_credit_amount": 60000.0
    })
    assert res_no_pin.status_code == 200
    data_no_pin = res_no_pin.json()
    assert data_no_pin["allowed"] is False
    assert data_no_pin["is_over_limit"] is True
    assert "Manager PIN override required" in data_no_pin["message"]

    # Provide correct Manager PIN ("1234") -> Allowed via override
    res_with_pin = client.post("/api/v1/pms/corporate/credit-check", json={
        "party_name": party_name,
        "requested_credit_amount": 60000.0,
        "manager_pin": "1234"
    })
    assert res_with_pin.status_code == 200
    data_pin = res_with_pin.json()
    assert data_pin["allowed"] is True
    assert data_pin["override_applied"] is True

# -------------------------------------------------------------------------
# Test 9: Credit Check blocked if company has 90+ days overdue bills
# -------------------------------------------------------------------------
def test_credit_check_blocked_if_90_plus_overdue(db_session: Session):
    party_name = f"Defaulting Corp_{now_utc().timestamp()}"
    today = datetime.date.today()

    # Seed an invoice due 100 days ago
    client.post("/api/v1/pms/corporate/receivables", json={
        "invoice_no": f"INV-OVERDUE-{int(now_utc().timestamp()) % 10000}",
        "party_name": party_name,
        "invoice_date": (today - datetime.timedelta(days=130)).isoformat(),
        "due_date": (today - datetime.timedelta(days=100)).isoformat(),
        "invoice_amount": 15000.0
    })

    res = client.post("/api/v1/pms/corporate/credit-check", json={
        "party_name": party_name,
        "requested_credit_amount": 5000.0
    })
    assert res.status_code == 200
    data = res.json()
    assert data["allowed"] is False
    assert data["has_90_plus_overdue"] is True
    assert "severely overdue" in data["message"]

# -------------------------------------------------------------------------
# Test 10: Bad Debt Write-Off with Manager PIN & General Ledger write-off
# -------------------------------------------------------------------------
def test_bad_debt_write_off(db_session: Session):
    party_name = f"Defunct Agency_{now_utc().timestamp()}"
    today = datetime.date.today()

    inv = client.post("/api/v1/pms/corporate/receivables", json={
        "invoice_no": f"INV-BAD-{int(now_utc().timestamp()) % 10000}",
        "party_name": party_name,
        "due_date": (today - datetime.timedelta(days=180)).isoformat(),
        "invoice_amount": 8000.0
    }).json()

    # Write-off without PIN -> 403 Forbidden
    res_no_pin = client.post("/api/v1/pms/corporate/bad-debt-write-off", json={
        "receivable_id": inv["id"],
        "reason": "Entity dissolved / uncollectible",
        "manager_pin": "wrong",
        "authorized_by": "Finance Director"
    })
    assert res_no_pin.status_code == 403

    # Success with Manager PIN ("1234")
    res_success = client.post("/api/v1/pms/corporate/bad-debt-write-off", json={
        "receivable_id": inv["id"],
        "reason": "Entity dissolved / uncollectible",
        "manager_pin": "1234",
        "authorized_by": "Finance Director"
    })
    assert res_success.status_code == 200
    data = res_success.json()

    assert data["status"] == "success"
    assert data["written_off_amount"] == 8000.0
    assert data["journal_entry_id"] is not None

    # Verify receivable record updated to Written Off
    db_rec = db_session.query(models.CorporateInvoiceReceivable).filter(models.CorporateInvoiceReceivable.id == inv["id"]).first()
    assert db_rec.status == "Written Off"
    assert db_rec.outstanding_amount == 0.0

    # Verify Journal Entry
    je = db_session.query(models.JournalEntry).filter(models.JournalEntry.id == data["journal_entry_id"]).first()
    assert je is not None
    assert je.debit_account == "Bad Debts Written Off Expense"
    assert je.credit_account == "Corporate City Ledger (Sundry Debtors)"
    assert je.amount_rupees == 8000.0
    assert je.amount_paise == 800000
