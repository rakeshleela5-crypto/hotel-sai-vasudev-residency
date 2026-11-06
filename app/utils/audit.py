"""
Immutable Audit Logging Utility for Hospitality Privileged Actions (#48 - Part B).
Automatically persists audit trails into the audit_logs PostgreSQL table whenever
tariffs, discounts, voided KOTs, payouts, or shift handovers are executed.
"""

import json
import logging
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session

from app import models
from app.utils.timezone import now_utc

logger = logging.getLogger("pms_audit")

def record_audit_log(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: str,
    old_data: Any = None,
    new_data: Any = None,
    staff_id: Optional[str] = None,
    role: Optional[str] = None,
    ip_address: Optional[str] = None,
    booking_ref: Optional[str] = None
) -> models.AuditLog:
    """
    Creates and saves an immutable audit record in the audit_logs table (#48).
    """
    old_str = json.dumps(old_data, default=str) if old_data is not None else None
    new_str = json.dumps(new_data, default=str) if new_data is not None else None
    details_str = new_str or old_str or "{}"

    clean_staff = staff_id or "Staff"
    clean_role = role or "Front Office"

    audit_entry = models.AuditLog(
        staff_id=clean_staff,
        role=clean_role,
        action=action.upper(),
        entity_type=entity_type.upper(),
        entity_id=str(entity_id),
        old_data=old_str,
        new_data=new_str,
        ip_address=ip_address or "127.0.0.1",
        created_at=now_utc(),
        # Legacy compatibility fields
        event_type=action.upper(),
        booking_ref=booking_ref,
        performed_by=clean_staff,
        details_json=details_str
    )

    db.add(audit_entry)
    try:
        if db.in_nested_transaction():
            db.flush()
        else:
            db.commit()
            db.refresh(audit_entry)
        logger.info(f"[Audit] Recorded '{action}' on {entity_type}:{entity_id} by {clean_staff} ({clean_role}).")
        return audit_entry
    except Exception as exc:
        if not db.in_nested_transaction():
            db.rollback()
        logger.error(f"[Audit] Failed to commit audit log entry: {exc}")
        return audit_entry

def audit_tariff_change(
    db: Session,
    room_id: Any,
    old_price: float,
    new_price: float,
    staff_id: str = "Admin",
    role: str = "MANAGER",
    ip_address: Optional[str] = None
):
    return record_audit_log(
        db=db,
        action="TARIFF_OVERRIDE",
        entity_type="ROOM",
        entity_id=str(room_id),
        old_data={"price": old_price},
        new_data={"price": new_price},
        staff_id=staff_id,
        role=role,
        ip_address=ip_address
    )

def audit_discount(
    db: Session,
    booking_ref: str,
    discount_amount: float,
    discount_reason: str,
    staff_id: str = "Manager",
    role: str = "MANAGER",
    ip_address: Optional[str] = None
):
    return record_audit_log(
        db=db,
        action="DISCOUNT_APPLIED",
        entity_type="FOLIO",
        entity_id=booking_ref,
        old_data=None,
        new_data={"discount_amount": discount_amount, "reason": discount_reason},
        staff_id=staff_id,
        role=role,
        ip_address=ip_address,
        booking_ref=booking_ref
    )

def audit_kot_void(
    db: Session,
    kot_no: str,
    item_name: str,
    amount: float,
    reason: str,
    staff_id: str = "Steward",
    role: str = "STEWARD",
    ip_address: Optional[str] = None
):
    return record_audit_log(
        db=db,
        action="KOT_VOIDED",
        entity_type="KOT",
        entity_id=kot_no,
        old_data={"item": item_name, "amount": amount},
        new_data={"void_reason": reason, "status": "VOIDED"},
        staff_id=staff_id,
        role=role,
        ip_address=ip_address
    )

def audit_payout(
    db: Session,
    payout_id: str,
    recipient: str,
    amount: float,
    payout_type: str = "AGENT_COMMISSION",
    staff_id: str = "Accounts",
    role: str = "MANAGER",
    ip_address: Optional[str] = None
):
    return record_audit_log(
        db=db,
        action="PAYOUT_ISSUED",
        entity_type="PAYOUT",
        entity_id=payout_id,
        old_data=None,
        new_data={"recipient": recipient, "amount": amount, "type": payout_type},
        staff_id=staff_id,
        role=role,
        ip_address=ip_address
    )
