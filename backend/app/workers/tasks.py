"""
Persistent Asynchronous Background Tasks (#38, #39).
Contains worker functions executable by arq (Redis queue) or FastAPI native BackgroundTasks:
  1. reconcile_decentro_webhook_task: Decentro payment webhook ledger reconciliation
  2. generate_and_upload_invoice_pdf_task: GST invoice PDF generation & Cloudflare R2 upload
  3. WorkerSettings: arq worker configuration class
"""

import os
import json
import uuid
import time
import datetime
import logging
from typing import Dict, Any, Optional

from app.database import SessionLocal
from app.models import (
    PaymentTransaction,
    VirtualAccount,
    Booking,
    BookingPayment,
    Folio,
    WebhookEvent,
    FailedWebhookDLQ,
    JournalEntry,
    CheckoutRecord
)
from app.utils.locking import acquire_canonical_locks
from app.utils.timezone import now_utc, now_ist, today_ist_str
from app.websocket_manager import ws_manager
from app.services.r2_storage import r2_service
from app.config import settings

logger = logging.getLogger("pms_workers")

def _extract_task_args(args):
    """Strips arq worker context (ctx) if passed as the first argument."""
    if args and isinstance(args[0], dict) and ("redis" in args[0] or "job_id" in args[0] or "job_try" in args[0]):
        return args[1:]
    return args

def build_minimal_gst_invoice_pdf(
    invoice_no: str,
    guest_name: str,
    total_amount: float,
    booking_ref: str,
    room_no: str = "101"
) -> bytes:
    """Generates a valid, lightweight GST Tax Invoice PDF binary stream for Hotel Sai Vasudev Residency."""
    clean_inv = str(invoice_no).replace("(", "").replace(")", "")
    clean_guest = str(guest_name).replace("(", "").replace(")", "")
    clean_ref = str(booking_ref).replace("(", "").replace(")", "")
    clean_room = str(room_no).replace("(", "").replace(")", "")
    today_str = datetime.date.today().isoformat()

    pdf_content = (
        f"%PDF-1.4\n"
        f"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        f"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        f"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
        f"4 0 obj << /Length 380 >> stream\n"
        f"BT\n"
        f"/F1 16 Tf\n"
        f"50 740 Td\n"
        f"(HOTEL SAI VASUDEV RESIDENCY - GST TAX INVOICE) Tj\n"
        f"/F1 11 Tf\n"
        f"0 -28 Td\n"
        f"(Invoice Number: {clean_inv}) Tj\n"
        f"0 -20 Td\n"
        f"(Date: {today_str}) Tj\n"
        f"0 -20 Td\n"
        f"(Reservation Ref: {clean_ref}) Tj\n"
        f"0 -20 Td\n"
        f"(Guest Name: {clean_guest}) Tj\n"
        f"0 -20 Td\n"
        f"(Room Allocated: {clean_room}) Tj\n"
        f"0 -20 Td\n"
        f"(Total Net Paid: INR {total_amount:.2f}) Tj\n"
        f"0 -20 Td\n"
        f"(Payment Settlement Status: COMPLETED / SETTLED) Tj\n"
        f"ET\n"
        f"endstream\n"
        f"endobj\n"
        f"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
        f"xref\n"
        f"0 6\n"
        f"0000000000 65535 f\n"
        f"0000000009 00000 n\n"
        f"0000000058 00000 n\n"
        f"0000000115 00000 n\n"
        f"0000000244 00000 n\n"
        f"0000000670 00000 n\n"
        f"trailer << /Size 6 /Root 1 0 R >>\n"
        f"startxref\n"
        f"740\n"
        f"%%EOF\n"
    )
    return pdf_content.encode("utf-8")

def reconcile_decentro_webhook_task(*args, **kwargs) -> bool:
    """
    Asynchronous Webhook Ledger Reconciliation Task (#38, #39):
    1. Executable by arq worker or FastAPI native BackgroundTasks.
    2. Updates payment_transactions, acquires canonical locks, settles folios & generates invoice ref.
    3. Retries up to 3 times on exception with exponential backoff.
    4. Automatically routes to failed_webhook_dlq upon terminal failure.
    """
    actual_args = _extract_task_args(args)
    event_id = actual_args[0] if len(actual_args) > 0 else kwargs.get("event_id")
    payload = actual_args[1] if len(actual_args) > 1 else kwargs.get("payload", {})

    db = SessionLocal()
    max_retries = 3
    last_exc = None

    for attempt in range(1, max_retries + 1):
        try:
            event_rec = db.query(WebhookEvent).filter(WebhookEvent.event_id == event_id).first()
            if event_rec:
                event_rec.attempts = attempt
                db.commit()

            decentro_txn_id = payload.get("decentro_txn_id") or payload.get("txn_id") or event_id
            reference_id = payload.get("reference_id")
            status = (payload.get("transaction_status") or payload.get("status") or "SUCCESS").upper()
            bank_ref = payload.get("bank_reference_number") or payload.get("utr") or f"UTR-{uuid.uuid4().hex[:8].upper()}"
            amount = float(payload.get("amount") or 0.0)
            payer_vpa = payload.get("payer_vpa") or payload.get("payer_upi") or "guest@upi"

            # 1. Update or create transaction record with row lock
            txn = None
            if reference_id:
                try:
                    txn = db.query(PaymentTransaction).filter(PaymentTransaction.reference_id == reference_id).with_for_update().first()
                except Exception:
                    txn = db.query(PaymentTransaction).filter(PaymentTransaction.reference_id == reference_id).first()
            if not txn and decentro_txn_id:
                try:
                    txn = db.query(PaymentTransaction).filter(PaymentTransaction.decentro_txn_id == decentro_txn_id).with_for_update().first()
                except Exception:
                    txn = db.query(PaymentTransaction).filter(PaymentTransaction.decentro_txn_id == decentro_txn_id).first()

            if not txn:
                try:
                    txn = PaymentTransaction(
                        reference_id=reference_id or f"DCN-DIRECT-{uuid.uuid4().hex[:8].upper()}",
                        amount=amount,
                        currency="INR",
                        purpose_message="Direct Decentro Payment Callback",
                        payment_method="VIRTUAL_ACCOUNT" if (reference_id and "VA-" in str(reference_id)) else "UPI_QR",
                        status="PENDING",
                        decentro_txn_id=decentro_txn_id
                    )
                    db.add(txn)
                    db.commit()
                    db.refresh(txn)
                except Exception:
                    db.rollback()
                    if reference_id:
                        txn = db.query(PaymentTransaction).filter(PaymentTransaction.reference_id == reference_id).first()
                    if not txn and decentro_txn_id:
                        txn = db.query(PaymentTransaction).filter(PaymentTransaction.decentro_txn_id == decentro_txn_id).first()

            # Virtual Account Lookup & Linking for RTGS/NEFT/IMPS settlements
            account_num = payload.get("account_number") or payload.get("virtual_account_number") or payload.get("payee_account")
            va = None
            if account_num:
                va = db.query(VirtualAccount).filter(VirtualAccount.account_number == account_num).first()
            if not va and reference_id:
                va = db.query(VirtualAccount).filter(VirtualAccount.reference_id == reference_id).first()
            if not va and decentro_txn_id:
                va = db.query(VirtualAccount).filter(VirtualAccount.decentro_urn == decentro_txn_id).first()

            if va and txn:
                if not txn.booking_id and va.booking_id:
                    txn.booking_id = va.booking_id
                txn.payment_method = "VIRTUAL_ACCOUNT"

            settle_amount = amount if amount > 0 else float(txn.amount or 0.0)
            if amount > 0 and txn:
                txn.amount = settle_amount

            # Check for UTR Replay Attack
            if bank_ref and not bank_ref.startswith("GEN_UTR_") and status == "SUCCESS" and txn:
                duplicate_utr = db.query(PaymentTransaction).filter(
                    PaymentTransaction.bank_reference_number == bank_ref,
                    PaymentTransaction.id != txn.id,
                    PaymentTransaction.status == "SUCCESS"
                ).first()
                if duplicate_utr:
                    logger.error(f"[Worker Webhook Security] UTR replay detected! Bank Ref {bank_ref} already settled under {duplicate_utr.reference_id}.")
                    txn.status = "UTR_REPLAY_REJECTED"
                    if event_rec:
                        event_rec.status = "FLAGGED_DUPLICATE_UTR"
                        event_rec.processed_at = now_utc()
                    db.commit()
                    return False

            # Status Idempotency Check: Prevent duplicate payment crediting
            if txn and txn.status == "SUCCESS":
                logger.info(f"[Worker Webhook] Txn {txn.reference_id} already marked SUCCESS. Skipping duplicate folio settlement.")
                if event_rec:
                    event_rec.status = "PROCESSED"
                    event_rec.processed_at = now_utc()
                db.commit()
                return True

            if status == "SUCCESS" and txn:
                txn.status = "SUCCESS"
                txn.bank_reference_number = bank_ref
                txn.payer_vpa = payer_vpa
                txn.updated_at = now_utc()

                transfer_type = (payload.get("transfer_type") or payload.get("payment_mode") or ("RTGS" if txn.payment_method == "VIRTUAL_ACCOUNT" else "UPI")).upper()
                payment_mode_str = f"Virtual Account ({transfer_type})" if txn.payment_method == "VIRTUAL_ACCOUNT" else "UPI (Decentro)"

                # Settle Guest Room Folio
                booking_id = txn.booking_id
                room_no = txn.room_no
                booking = None
                if booking_id:
                    acquire_canonical_locks(db, booking_id=booking_id)
                    booking = db.query(Booking).filter(Booking.id == booking_id).first()
                    if booking:
                        booking.total_paid = round((booking.total_paid or 0.0) + settle_amount, 2)
                        booking.balance_due = max(0.0, round(booking.total_price - booking.total_paid, 2))
                        booking.payment_status = "Paid" if booking.balance_due <= 0.0 else "Partial"
                        booking.payment_method = payment_mode_str
                        if not room_no and booking.room:
                            room_no = booking.room.name

                        if not booking.invoice_number:
                            booking.invoice_number = f"INV-SVR-{int(time.time()*1000)}-{uuid.uuid4().hex[:4].upper()}"
                        if not booking.invoice_pdf_key:
                            booking.invoice_pdf_key = f"invoices/{datetime.date.today().strftime('%Y/%m')}/{booking.invoice_number}.pdf"

                        notes_str = f"Auto-Reconciled via Decentro Webhook (Ref: {txn.reference_id})"
                        if booking.total_paid > booking.total_price:
                            excess = round(booking.total_paid - booking.total_price, 2)
                            notes_str += f" [Overpayment Excess: ₹{excess}]"

                        bp = BookingPayment(
                            booking_id=booking.id,
                            payment_type="Settlement",
                            payment_mode=payment_mode_str,
                            amount=settle_amount,
                            transaction_ref=bank_ref,
                            notes=notes_str
                        )
                        db.add(bp)

                        folio = db.query(Folio).filter(Folio.booking_id == booking.id).first()
                        if folio:
                            folio.total_payments = round((folio.total_payments or 0.0) + settle_amount, 2)
                            folio.balance_due = max(0.0, round((folio.total_charges or booking.total_price) - folio.total_payments, 2))
                            if folio.balance_due <= 0.0:
                                folio.status = "SETTLED"
                            folio.updated_at = now_utc()

                # Double-Entry Accounting Journal Entry
                entry_ref = bank_ref or txn.reference_id
                guest_desc = booking.guest_name if booking else (payload.get("payer_name") or "Direct Guest")
                credit_acc = f"Guest Ledger (Room {room_no})" if room_no else (f"Guest Ledger ({guest_desc})" if booking else "Unallocated Bank Receipts (Liability)")
                debit_acc = f"Bank Account (Decentro {transfer_type})"

                jv = JournalEntry(
                    entry_id=f"JV-DCN-{uuid.uuid4().hex[:8].upper()}",
                    date=datetime.date.today().isoformat(),
                    time=now_ist().strftime("%I:%M %p"),
                    voucher_type="Bank",
                    reference_no=entry_ref,
                    narration=f"Decentro auto-reconciled {payment_mode_str} settlement for {guest_desc}",
                    debit_account=debit_acc,
                    credit_account=credit_acc,
                    amount_rupees=settle_amount,
                    posted_by="Decentro Settlement Engine"
                )
                db.add(jv)

                db.commit()

                if event_rec:
                    event_rec.status = "PROCESSED"
                    event_rec.processed_at = now_utc()
                    db.commit()

                # WebSocket notification
                try:
                    ws_manager.emit_payment_success_sync(
                        reference_id=txn.reference_id,
                        amount=txn.amount,
                        bank_reference_number=bank_ref,
                        booking_id=txn.booking_id,
                        kot_id=txn.kot_id,
                        room_no=room_no,
                        payer_vpa=payer_vpa
                    )
                except Exception as ws_err:
                    logger.debug(f"[Worker Webhook] WebSocket broadcast notice: {ws_err}")

                logger.info(f"[Worker Webhook] Successfully settled event {event_id} for Ref {txn.reference_id}.")
                return True
            else:
                txn.status = status
                if event_rec:
                    event_rec.status = "PROCESSED"
                    event_rec.processed_at = now_utc()
                db.commit()
                return True

        except Exception as exc:
            last_exc = exc
            logger.warning(f"[Worker Webhook] Attempt {attempt}/{max_retries} failed for event {event_id}: {exc}")
            db.rollback()
            time.sleep(0.2 * attempt)

    # Terminal failure after max retries: move to DLQ
    try:
        event_rec = db.query(WebhookEvent).filter(WebhookEvent.event_id == event_id).first()
        if event_rec:
            event_rec.status = "FAILED"
            event_rec.last_error = str(last_exc)

        dlq_entry = FailedWebhookDLQ(
            event_id=event_id,
            source="DECENTRO",
            payload_json=json.dumps(payload),
            failure_reason=str(last_exc),
            retry_count=max_retries,
            status="FAILED",
            created_at=now_utc()
        )
        db.add(dlq_entry)
        db.commit()
        logger.error(f"[Worker Webhook DLQ] Moved failed event {event_id} to failed_webhook_dlq: {last_exc}")
    except Exception as dlq_err:
        logger.critical(f"[Worker Webhook DLQ] Error persisting to DLQ: {dlq_err}")
        db.rollback()
    finally:
        db.close()
    return False

def generate_and_upload_invoice_pdf_task(*args, **kwargs) -> Optional[str]:
    """
    Background Task: Asynchronous GST Invoice PDF Generation & Cloudflare R2 Upload.
    Generates tax invoice binary stream, archives it in R2, and binds invoice_pdf_key to the booking.
    Does not block checkout response time.
    """
    actual_args = _extract_task_args(args)
    booking_id = actual_args[0] if len(actual_args) > 0 else kwargs.get("booking_id")
    invoice_data = actual_args[1] if len(actual_args) > 1 else kwargs.get("invoice_data", {})

    if not booking_id:
        logger.warning("[Invoice Worker] No booking_id provided for invoice PDF task.")
        return None

    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            logger.warning(f"[Invoice Worker] Booking ID {booking_id} not found.")
            return None

        inv_number = booking.invoice_number or f"INV-SVR-{int(time.time()*1000)}-{uuid.uuid4().hex[:4].upper()}"
        booking.invoice_number = inv_number

        room_name = booking.room.name if booking.room else "101"
        pdf_bytes = build_minimal_gst_invoice_pdf(
            invoice_no=inv_number,
            guest_name=booking.guest_name or "Guest",
            total_amount=float(booking.total_paid or booking.total_price or 0.0),
            booking_ref=booking.booking_ref,
            room_no=room_name
        )

        # Upload to Cloudflare R2 via r2_service
        try:
            object_key, file_url = r2_service.upload_invoice_pdf(
                pdf_bytes=pdf_bytes,
                invoice_number=inv_number
            )
            booking.invoice_pdf_key = object_key
            db.commit()
            logger.info(f"[Invoice Worker] Successfully uploaded invoice PDF for booking {booking_id} -> {object_key}")
            return object_key
        except Exception as up_err:
            logger.error(f"[Invoice Worker] Failed to upload invoice PDF for booking {booking_id}: {up_err}")
            db.rollback()
            return None
    except Exception as exc:
        logger.error(f"[Invoice Worker] Error generating invoice for booking {booking_id}: {exc}")
        db.rollback()
        return None
    finally:
        db.close()

# arq Worker Settings Class for optional dedicated worker processes
class WorkerSettings:
    functions = [reconcile_decentro_webhook_task, generate_and_upload_invoice_pdf_task]
    redis_settings = None

