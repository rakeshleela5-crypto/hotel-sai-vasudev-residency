"""
Phase 2: Atomic Sequences & Central State Hydration Test Suite.
Verifies:
1. Indian Financial Year (CGST Section 31) dynamic calculation.
2. Centralized atomic sequence generator with concurrency locking (zero collisions).
3. Concurrent multi-thread simulation ensuring strictly consecutive numbering.
4. Independent sequence namespaces for TAX_INVOICE (INV), FOOD_BILL (FB), and ADVANCE_RECEIPT (RCP).
5. Next-number preview (peek) without advancing persistent state.
6. API endpoints: /api/v1/pms/invoices/next-number, /generate-number, and /sync-state.
"""

import os
import sys
import datetime
import concurrent.futures
import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.main import app
from app.database import SessionLocal, engine, Base
from app import models
from app.utils.sequence import (
    get_current_financial_year,
    get_next_document_number,
    peek_next_document_number
)

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def ensure_tables():
    Base.metadata.create_all(bind=engine)
    yield

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


# =========================================================================
# TEST 1: Indian Financial Year Calculation
# =========================================================================
def test_indian_financial_year_calculation():
    """
    Verifies that financial year complies with Indian statutory tax calendar
    (April 1st to March 31st).
    """
    # 1. Date in November 2026 -> FY 2026-27
    d_nov = datetime.date(2026, 11, 7)
    assert get_current_financial_year(d_nov) == "2026-27"

    # 2. Date in January 2027 (before April) -> still FY 2026-27
    d_jan = datetime.date(2027, 1, 15)
    assert get_current_financial_year(d_jan) == "2026-27"

    # 3. Date in March 31, 2027 -> still FY 2026-27
    d_mar = datetime.date(2027, 3, 31)
    assert get_current_financial_year(d_mar) == "2026-27"

    # 4. Date in April 1, 2027 -> rollovers to FY 2027-28
    d_apr = datetime.date(2027, 4, 1)
    assert get_current_financial_year(d_apr) == "2027-28"


# =========================================================================
# TEST 2: Atomic Sequential Document Numbering
# =========================================================================
def test_atomic_document_number_advancement(db):
    """
    Verifies consecutive numbering and correct prefix/code formatting.
    """
    test_fy = "2029-30" # Isolated future FY for test repeatability

    num1, seq1 = get_next_document_number(db, doc_type="TAX_INVOICE", prefix="SVR", financial_year=test_fy)
    assert seq1 >= 1
    assert num1 == f"SVR/{test_fy}/INV-{str(seq1).zfill(4)}"

    num2, seq2 = get_next_document_number(db, doc_type="TAX_INVOICE", prefix="SVR", financial_year=test_fy)
    assert seq2 == seq1 + 1
    assert num2 == f"SVR/{test_fy}/INV-{str(seq2).zfill(4)}"


# =========================================================================
# TEST 3: Peeking Does Not Advance Sequence Counter
# =========================================================================
def test_peek_next_document_number_idempotent(db):
    """
    Verifies that previewing the next number does not alter the stored sequence counter.
    """
    test_fy = "2031-32"

    # Get baseline sequence
    _, cur_seq = get_next_document_number(db, doc_type="TAX_INVOICE", prefix="SVR", financial_year=test_fy)

    # Peek multiple times
    peek1 = peek_next_document_number(db, doc_type="TAX_INVOICE", prefix="SVR", financial_year=test_fy)
    peek2 = peek_next_document_number(db, doc_type="TAX_INVOICE", prefix="SVR", financial_year=test_fy)
    assert peek1 == peek2
    assert peek1 == f"SVR/{test_fy}/INV-{str(cur_seq + 1).zfill(4)}"

    # Real allocation should match what was peeked
    real_num, real_seq = get_next_document_number(db, doc_type="TAX_INVOICE", prefix="SVR", financial_year=test_fy)
    assert real_num == peek1
    assert real_seq == cur_seq + 1


# =========================================================================
# TEST 4: Concurrent Multi-Thread Invoice Allocation (Zero Collisions)
# =========================================================================
def test_concurrent_invoice_generation_zero_collisions():
    """
    Simulates 10 concurrent front-desk checkouts allocating invoice numbers simultaneously.
    Proves database concurrency locking prevents duplicate numbers.
    """
    test_fy = "2033-34"
    thread_count = 10

    def allocate_worker():
        local_db = SessionLocal()
        try:
            num, seq = get_next_document_number(local_db, doc_type="TAX_INVOICE", prefix="SVR", financial_year=test_fy)
            return (num, seq)
        finally:
            local_db.close()

    with concurrent.futures.ThreadPoolExecutor(max_workers=thread_count) as executor:
        futures = [executor.submit(allocate_worker) for _ in range(thread_count)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    # Check results
    generated_numbers = [r[0] for r in results]
    sequence_numbers = [r[1] for r in results]

    # 1. Exactly 10 unique invoice numbers (ZERO duplicates)
    assert len(set(generated_numbers)) == thread_count, f"Duplicate invoices detected: {generated_numbers}"

    # 2. Sequence numbers must be contiguous (e.g. 1 through 10)
    sorted_seqs = sorted(sequence_numbers)
    min_seq = sorted_seqs[0]
    expected_seqs = list(range(min_seq, min_seq + thread_count))
    assert sorted_seqs == expected_seqs, f"Sequence gap detected: expected {expected_seqs}, got {sorted_seqs}"


# =========================================================================
# TEST 5: Independent Document Type Namespaces
# =========================================================================
def test_independent_document_type_namespaces(db):
    """
    Verifies that TAX_INVOICE, FOOD_BILL, and ADVANCE_RECEIPT
    maintain their own independent sequence counters.
    """
    test_fy = "2035-36"

    inv_num, _ = get_next_document_number(db, doc_type="TAX_INVOICE", prefix="SVR", financial_year=test_fy)
    fb_num, _ = get_next_document_number(db, doc_type="FOOD_BILL", prefix="SVR", financial_year=test_fy)
    rcp_num, _ = get_next_document_number(db, doc_type="ADVANCE_RECEIPT", prefix="SVR", financial_year=test_fy)

    assert "INV-" in inv_num
    assert "FB-" in fb_num
    assert "RCP-" in rcp_num

    assert inv_num.startswith(f"SVR/{test_fy}/INV-")
    assert fb_num.startswith(f"SVR/{test_fy}/FB-")
    assert rcp_num.startswith(f"SVR/{test_fy}/RCP-")


# =========================================================================
# TEST 6: Invoice Sequence API Endpoints
# =========================================================================
def test_invoice_sequence_api_endpoints():
    """
    Verifies GET /api/v1/pms/invoices/next-number and POST /api/v1/pms/invoices/generate-number.
    """
    # 1. Preview
    res_peek = client.get("/api/v1/pms/invoices/next-number?doc_type=TAX_INVOICE")
    assert res_peek.status_code == 200
    peek_data = res_peek.json()
    assert peek_data["status"] == "success"
    assert "next_number" in peek_data
    assert "SVR/" in peek_data["next_number"]

    # 2. Atomic generation
    res_gen = client.post("/api/v1/pms/invoices/generate-number?doc_type=TAX_INVOICE")
    assert res_gen.status_code == 200
    gen_data = res_gen.json()
    assert gen_data["status"] == "success"
    assert "invoice_number" in gen_data
    assert gen_data["sequence_number"] >= 1


# =========================================================================
# TEST 7: Central State Hydration (/sync-state)
# =========================================================================
def test_central_state_hydration_endpoint():
    """
    Verifies GET /api/v1/pms/sync-state returns complete multi-device canonical state.
    """
    res = client.get("/api/v1/pms/sync-state")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "server_time" in data
    assert "financial_year" in data
    assert "rooms" in data
    assert "active_checkins" in data
    assert "open_kots" in data
    assert "total_rooms" in data
    assert isinstance(data["rooms"], list)
