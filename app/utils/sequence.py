"""
Centralized Atomic Document & Invoice Sequence Engine.
Benchmarked directly against HeyPuter Reference Architecture (everything/src/pos/src/lib/store.js & invoicing/src/lib/store.js).

Mandates:
1. Concurrency-safe, lock-safe sequence advancement.
2. Compliance with Section 31 of Central Goods and Services Tax (CGST) Act:
   - Consecutive, unique serial numbering per financial year (April 1 - March 31).
   - Zero collisions between multiple front desk terminals or mobile devices.
   - Gapless sequential auditing.
"""

import re
import datetime
import logging
import threading
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app import models
from app.utils.timezone import now_utc

logger = logging.getLogger("pms_sequence")

_sequence_lock = threading.Lock()

DOC_TYPE_CODES = {
    "TAX_INVOICE": "INV",
    "B2C_INVOICE": "B2C",
    "FOOD_BILL": "FB",
    "ADVANCE_RECEIPT": "RCP",
    "CREDIT_NOTE": "CN",
    "DEBIT_NOTE": "DN",
    "PAYMENT_VOUCHER": "PAY",
    "DRAWER_VOUCHER": "DRW"
}


def get_current_financial_year(dt: Optional[datetime.date] = None) -> str:
    """
    Computes the Indian Financial Year string (e.g., April 2026 to March 2027 is '2026-27').
    """
    d = dt or datetime.date.today()
    if d.month >= 4:
        return f"{d.year}-{str(d.year + 1)[2:]}"
    else:
        return f"{d.year - 1}-{str(d.year)[2:]}"


def _get_max_existing_sequence(db: Session, doc_type: str, fy: str) -> int:
    """
    Scans existing records to initialize sequence counter safely,
    ensuring newly created sequence tables never duplicate legacy invoices.
    """
    max_seq = 0
    try:
        if doc_type in ("TAX_INVOICE", "B2C_INVOICE"):
            records = db.query(models.CheckoutRecord.invoice_no).all()
            for (inv_str,) in records:
                if not inv_str:
                    continue
                # Look for numbers like SVR/2026-27/INV-0042 or INV-0042
                match = re.search(r'(?:INV|B2C)-(\d+)', inv_str)
                if match:
                    try:
                        max_seq = max(max_seq, int(match.group(1)))
                    except ValueError:
                        pass
        elif doc_type == "FOOD_BILL":
            bills = db.query(models.FoodBill.bill_no).all()
            for (b_no,) in bills:
                if not b_no:
                    continue
                match = re.search(r'FB-(\d+)', b_no)
                if match:
                    try:
                        max_seq = max(max_seq, int(match.group(1)))
                    except ValueError:
                        pass
        elif doc_type == "DRAWER_VOUCHER":
            movements = db.query(models.CashDrawerMovement.voucher_no).all()
            for (v_no,) in movements:
                if not v_no:
                    continue
                match = re.search(r'DRW-(\d+)', v_no)
                if match:
                    try:
                        max_seq = max(max_seq, int(match.group(1)))
                    except ValueError:
                        pass
    except Exception as e:
        logger.warning(f"[SequenceEngine] Could not inspect legacy records: {e}")

    return max_seq


def get_next_document_number(
    db: Session,
    doc_type: str = "TAX_INVOICE",
    prefix: str = "SVR",
    financial_year: Optional[str] = None
) -> Tuple[str, int]:
    """
    Atomically generates the next consecutive document number.
    Uses in-process mutex locking and database row-level locking (with_for_update) in PostgreSQL.
    
    Returns:
      Tuple of (formatted_invoice_number, sequence_integer)
      Example: ('SVR/2026-27/INV-0001', 1)
    """
    with _sequence_lock:
        fy = financial_year or get_current_financial_year()
        clean_type = doc_type.upper().strip()
        code = DOC_TYPE_CODES.get(clean_type, "DOC")

        # Determine database dialect
        bind = db.get_bind()
        is_sqlite = "sqlite" in (bind.dialect.name if bind else "")

        query = db.query(models.DocumentSequence).filter(
            models.DocumentSequence.doc_type == clean_type,
            models.DocumentSequence.financial_year == fy,
            models.DocumentSequence.prefix == prefix
        )

        if not is_sqlite:
            query = query.with_for_update()

        seq_record = query.first()

        if not seq_record:
            # Check if there are existing legacy invoices to prevent sequence clash
            seed_seq = _get_max_existing_sequence(db, clean_type, fy)
            seq_record = models.DocumentSequence(
                doc_type=clean_type,
                financial_year=fy,
                prefix=prefix,
                last_sequence_number=seed_seq,
                updated_at=now_utc()
            )
            db.add(seq_record)
            db.flush()

        # Atomically increment
        seq_record.last_sequence_number += 1
        new_seq = seq_record.last_sequence_number
        seq_record.updated_at = now_utc()
        db.commit()

        formatted_no = f"{prefix}/{fy}/{code}-{String_Pad(new_seq, 4)}"
        return formatted_no, new_seq


def String_Pad(num: int, width: int = 4) -> str:
    """Helper to pad number with leading zeroes."""
    return str(num).zfill(width)


def peek_next_document_number(
    db: Session,
    doc_type: str = "TAX_INVOICE",
    prefix: str = "SVR",
    financial_year: Optional[str] = None
) -> str:
    """
    Previews the upcoming invoice number without incrementing the persistent sequence counter.
    """
    fy = financial_year or get_current_financial_year()
    clean_type = doc_type.upper().strip()
    code = DOC_TYPE_CODES.get(clean_type, "DOC")

    seq_record = db.query(models.DocumentSequence).filter(
        models.DocumentSequence.doc_type == clean_type,
        models.DocumentSequence.financial_year == fy,
        models.DocumentSequence.prefix == prefix
    ).first()

    if not seq_record:
        seed_seq = _get_max_existing_sequence(db, clean_type, fy)
        next_seq = seed_seq + 1
    else:
        next_seq = seq_record.last_sequence_number + 1

    return f"{prefix}/{fy}/{code}-{String_Pad(next_seq, 4)}"
