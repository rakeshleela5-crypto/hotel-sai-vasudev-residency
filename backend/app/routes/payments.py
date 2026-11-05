import os
import hmac
import hashlib
import json
import uuid
import datetime
import time
import asyncio
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header, Request, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db, SessionLocal
from app import models
from app.config import settings
from app.core.limiter import limiter
from app.workers.queue import enqueue_task
from app.workers.tasks import reconcile_decentro_webhook_task
from app.models import PaymentTransaction, VirtualAccount, Booking, BookingPayment, Folio, WebhookEvent, FailedWebhookDLQ, JournalEntry
from app.schemas import (
    DecentroUpiQrRequest,
    DecentroUpiQrResponse,
    DecentroVirtualAccountRequest,
    DecentroVirtualAccountResponse,
    PaymentTransactionResponse
)
from app.services.decentro import decentro_client, logger
from app.websocket_manager import ws_manager
from app.utils.locking import acquire_canonical_locks
from app.utils.timezone import now_utc, now_ist, today_ist_str
from app.utils.idempotency import require_idempotency_key

router = APIRouter(tags=["Decentro Banking & Payments"])

# =========================================================================
# BACKGROUND TASK: ASYNC FOLIO SETTLEMENT & INVOICE GENERATION (#38, #39)
# =========================================================================
def process_decentro_webhook_background(event_id: str, payload: dict):
    """
    Asynchronous Webhook Processing (#38):
    1. Executes in FastAPI BackgroundTasks after immediate 200 OK acknowledgment.
    2. Updates payment_transactions, acquires canonical locks, settles folios & generates invoice ref.
    3. Retries up to 3 times on exception (#39).
    4. Automatically routes to failed_webhook_dlq upon terminal failure (#39).
    """
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

            # 1. Update or create transaction record with pessimistic row locking
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

            # Check for UTR Replay Attack / duplicate bank reference
            if bank_ref and not bank_ref.startswith("GEN_UTR_") and status == "SUCCESS" and txn:
                duplicate_utr = db.query(PaymentTransaction).filter(
                    PaymentTransaction.bank_reference_number == bank_ref,
                    PaymentTransaction.id != txn.id,
                    PaymentTransaction.status == "SUCCESS"
                ).first()
                if duplicate_utr:
                    logger.error(f"[Webhook Security] UTR replay detected! Bank Ref {bank_ref} was already settled under Txn {duplicate_utr.reference_id}.")
                    txn.status = "UTR_REPLAY_REJECTED"
                    if event_rec:
                        event_rec.status = "FLAGGED_DUPLICATE_UTR"
                        event_rec.processed_at = now_utc()
                    db.commit()
                    return False

            # Status Idempotency Check: Prevent duplicate payment crediting
            if txn and txn.status == "SUCCESS":
                if status == "SUCCESS":
                    logger.info(f"[Webhook Background] Txn {txn.reference_id} already marked SUCCESS. Skipping duplicate folio settlement.")
                else:
                    logger.warning(f"[Webhook Background] Refusing out-of-order downgrade of settled Txn {txn.reference_id} from SUCCESS to {status}.")
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
                if txn.payment_method == "VIRTUAL_ACCOUNT":
                    payment_mode_str = f"Virtual Account ({transfer_type})"
                else:
                    payment_mode_str = "UPI (Decentro)"

                # 2. Settle Guest Room Folio (#26, #38)
                booking_id = txn.booking_id
                room_no = txn.room_no
                booking = None
                if booking_id:
                    acquire_canonical_locks(db, booking_id=booking_id)
                    booking = db.query(Booking).filter(Booking.id == booking_id).first()
                    if booking:
                        booking.total_paid = round((booking.total_paid or 0.0) + settle_amount, 2)
                        booking.balance_due = max(0.0, round(booking.total_price - booking.total_paid, 2))
                        if booking.balance_due <= 0.0:
                            booking.payment_status = "Paid"
                        else:
                            booking.payment_status = "Partial"
                        booking.payment_method = payment_mode_str
                        if not room_no and booking.room:
                            room_no = booking.room.name

                        # Ensure invoice number & PDF key are generated (#38)
                        if not booking.invoice_number:
                            booking.invoice_number = f"INV-SVR-{int(time.time()*1000)}-{uuid.uuid4().hex[:4].upper()}"
                        if not booking.invoice_pdf_key:
                            booking.invoice_pdf_key = f"invoices/{datetime.date.today().strftime('%Y/%m')}/{booking.invoice_number}.pdf"

                        # Record in booking_payments
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

                        # Update or create Master Folio record
                        folio = db.query(Folio).filter(Folio.booking_id == booking.id).first()
                        if folio:
                            folio.total_payments = round((folio.total_payments or 0.0) + settle_amount, 2)
                            folio.balance_due = max(0.0, round((folio.total_charges or booking.total_price) - folio.total_payments, 2))
                            if folio.balance_due <= 0.0:
                                folio.status = "SETTLED"
                            folio.updated_at = now_utc()

                # 3. Post Double-Entry Accounting Journal Entry to Bank Ledger
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

                # Mark WebhookEvent as PROCESSED
                if event_rec:
                    event_rec.status = "PROCESSED"
                    event_rec.processed_at = now_utc()
                    db.commit()

                # 3. Broadcast real-time WebSocket notification (#80)
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
                    logger.debug(f"[Webhook Background] WebSocket broadcast notice: {ws_err}")

                logger.info(f"[Webhook Background] Successfully settled event {event_id} for Ref {txn.reference_id}.")
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
            logger.warning(f"[Webhook Background] Attempt {attempt}/{max_retries} failed for event {event_id}: {exc}")
            db.rollback()
            time.sleep(0.3)

    # Terminal failure after 3 retries: Move to failed_webhook_dlq (#39)
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
        logger.error(f"[Webhook DLQ] Moved failed event {event_id} to failed_webhook_dlq: {last_exc}")
    except Exception as dlq_err:
        logger.critical(f"[Webhook DLQ] Error persisting to DLQ: {dlq_err}")
        db.rollback()
    finally:
        db.close()

# =========================================================================
# 1. DYNAMIC UPI QR GENERATION (Protected by require_idempotency_key #1)
# =========================================================================
@router.post(
    "/payments/decentro/upi-qr",
    response_model=DecentroUpiQrResponse,
    summary="Generate Dynamic UPI QR Code via Decentro",
    dependencies=[Depends(require_idempotency_key)]
)
@limiter.limit(settings.RATE_LIMIT_QR)
async def generate_upi_qr(
    request: Request,
    req: DecentroUpiQrRequest,
    db: Session = Depends(get_db)
):
    """
    Accepts booking_id (or kot_id), amount, and purpose_message.
    Protected by X-Idempotency-Key (#1) to prevent duplicate transactions.
    """
    # Verify reference_id against database first (#37)
    requested_ref = getattr(req, "reference_id", None)
    if requested_ref:
        existing_txn = db.query(PaymentTransaction).filter(
            PaymentTransaction.reference_id == requested_ref
        ).first()
        if existing_txn:
            logger.info(f"[UPI QR Idempotency] Reference {requested_ref} already exists. Returning 200 OK immediately (#37).")
            return DecentroUpiQrResponse(
                reference_id=existing_txn.reference_id,
                decentro_txn_id=existing_txn.decentro_txn_id,
                amount=existing_txn.amount,
                qr_code_base64=existing_txn.qr_code_base64 or "",
                upi_intent_link=existing_txn.upi_intent_link or "",
                status=existing_txn.status
            )

    reference_id = requested_ref or f"SVR-UPI-{uuid.uuid4().hex[:10].upper()}"
    expiry_time = now_utc() + datetime.timedelta(minutes=req.expiry_minutes or 30)

    # 1. Create PENDING record in payment_transactions
    txn = PaymentTransaction(
        reference_id=reference_id,
        booking_id=req.booking_id,
        kot_id=req.kot_id,
        room_no=req.room_no,
        amount=req.amount,
        currency="INR",
        purpose_message=req.purpose_message or "Hotel Sai Vasudev Bill",
        payment_method="UPI_QR",
        status="PENDING",
        expiry_time=expiry_time,
        metadata_json=json.dumps({
            "room_no": req.room_no,
            "kot_id": req.kot_id,
            "booking_id": req.booking_id
        })
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    # 2. Call Decentro Service (with timeouts and circuit breaker #10, #13)
    qr_result = await decentro_client.generate_dynamic_upi_qr(
        reference_id=reference_id,
        amount=req.amount,
        purpose_message=req.purpose_message,
        expiry_minutes=req.expiry_minutes or 30
    )

    if qr_result.get("decentro_unavailable"):
        txn.status = "UNAVAILABLE"
        db.commit()
        db.refresh(txn)
        return DecentroUpiQrResponse(
            reference_id=txn.reference_id,
            decentro_txn_id=None,
            amount=txn.amount,
            qr_code_base64="",
            upi_intent_link="",
            status="UNAVAILABLE",
            expiry_time=expiry_time.isoformat(),
            message=qr_result.get("message") or "Decentro banking service is temporarily unavailable. Please switch to manual POS/Cash entry.",
            decentro_unavailable=True,
            fallback_mode=qr_result.get("fallback_mode") or "MANUAL_CASH_CARD_POS"
        )

    # 3. Update transaction record
    txn.qr_code_base64 = qr_result.get("qr_code_base64")
    txn.upi_intent_link = qr_result.get("upi_intent_link")
    txn.decentro_txn_id = qr_result.get("decentro_txn_id")
    db.commit()
    db.refresh(txn)

    return DecentroUpiQrResponse(
        reference_id=txn.reference_id,
        decentro_txn_id=txn.decentro_txn_id,
        amount=txn.amount,
        qr_code_base64=txn.qr_code_base64 or "",
        upi_intent_link=txn.upi_intent_link or "",
        status=txn.status,
        expiry_time=expiry_time.isoformat(),
        message="Dynamic UPI QR generated successfully"
    )

# =========================================================================
# 2. VIRTUAL ACCOUNT CREATION (Protected by require_idempotency_key #1)
# =========================================================================
@router.post(
    "/payments/decentro/virtual-account",
    response_model=DecentroVirtualAccountResponse,
    summary="Create Dedicated Virtual Account for Corporate / Group Booking",
    dependencies=[Depends(require_idempotency_key)]
)
async def create_corporate_virtual_account(
    req: DecentroVirtualAccountRequest,
    db: Session = Depends(get_db)
):
    """
    Dedicated Virtual Account Number and IFSC for corporate NEFT/RTGS/IMPS (#1).
    """
    reference_id = f"VA-{uuid.uuid4().hex[:8].upper()}"

    va_result = await decentro_client.create_virtual_account(
        reference_id=reference_id,
        name=req.corporate_name,
        email=req.contact_email,
        mobile=req.contact_phone,
        address=req.address,
        corporate_client_id=req.corporate_client_id
    )

    va_record = VirtualAccount(
        reference_id=reference_id,
        corporate_client_id=req.corporate_client_id,
        booking_id=req.booking_id,
        group_id=req.group_id,
        account_number=va_result.get("account_number"),
        ifsc_code=va_result.get("ifsc_code", "YESB0CMSNOC"),
        bank_name=va_result.get("bank_name", "YES BANK"),
        account_name=va_result.get("account_name"),
        upi_id=va_result.get("upi_id"),
        decentro_urn=va_result.get("decentro_urn"),
        status="ACTIVE"
    )
    db.add(va_record)
    db.commit()
    db.refresh(va_record)

    return DecentroVirtualAccountResponse(
        reference_id=va_record.reference_id,
        account_number=va_record.account_number,
        ifsc_code=va_record.ifsc_code,
        bank_name=va_record.bank_name,
        account_name=va_record.account_name,
        upi_id=va_record.upi_id,
        decentro_urn=va_record.decentro_urn,
        status=va_record.status,
        message="Dedicated Virtual Account created successfully"
    )

# =========================================================================
# 3. FOLIO SETTLEMENT & KOT ORDER ENDPOINTS (#1)
# =========================================================================
@router.post(
    "/folios/settle",
    summary="Settle Guest Room Folio (#1, #26)",
    dependencies=[Depends(require_idempotency_key)]
)
def settle_room_folio(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Settles guest room folio and updates balance with canonical lock ordering.
    Protected by X-Idempotency-Key (#1).
    """
    booking_ref = payload.get("booking_ref") or payload.get("bookingRef")
    if not booking_ref:
        raise HTTPException(status_code=400, detail="booking_ref is required.")

    booking = db.query(models.Booking).filter(
        (models.Booking.booking_ref == booking_ref) |
        (models.Booking.id == int(booking_ref) if str(booking_ref).isdigit() else False)
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking reservation not found.")

    acquire_canonical_locks(db, booking_id=booking.id, room_id=booking.room_id)

    settlement_amt = float(payload.get("amount") or payload.get("settle_amount") or booking.balance_due or 0.0)
    payment_mode = payload.get("payment_mode") or payload.get("paymentMode") or "Cash"
    txn_ref = payload.get("transaction_ref")

    # Idempotency check: verify transaction_ref against database first (#37)
    if txn_ref and settlement_amt > 0:
        existing_bp = db.query(models.BookingPayment).filter(
            models.BookingPayment.booking_id == booking.id,
            models.BookingPayment.transaction_ref == txn_ref
        ).first()
        if existing_bp:
            logger.info(f"[Folio Settle Idempotency] Transaction ref {txn_ref} already settled. Skipping duplicate payment.")
            settlement_amt = 0.0

    if settlement_amt > 0:
        bp = models.BookingPayment(
            booking_id=booking.id,
            payment_type="Settlement",
            payment_mode=payment_mode,
            amount=settlement_amt,
            transaction_ref=payload.get("transaction_ref") or f"SETTLE-{uuid.uuid4().hex[:6].upper()}",
            notes="Final Folio Settlement"
        )
        db.add(bp)
        booking.total_paid = round((booking.total_paid or 0.0) + settlement_amt, 2)
        booking.balance_due = max(0.0, round(booking.total_price - booking.total_paid, 2))

    if booking.balance_due <= 0:
        booking.payment_status = "Paid"
        booking.status = "Checked-Out"
    else:
        booking.payment_status = "Partial"

    folio = db.query(models.Folio).filter(models.Folio.booking_id == booking.id).first()
    if not folio:
        folio = models.Folio(
            booking_id=booking.id,
            folio_number=f"FOLIO-{booking.booking_ref}",
            status="SETTLED" if booking.balance_due <= 0 else "OPEN",
            total_charges=booking.total_price,
            total_payments=booking.total_paid,
            balance_due=booking.balance_due
        )
        db.add(folio)
    else:
        folio.total_payments = booking.total_paid
        folio.balance_due = booking.balance_due
        if folio.balance_due <= 0:
            folio.status = "SETTLED"

    db.commit()

    return {
        "success": True,
        "booking_ref": booking.booking_ref,
        "folio_number": folio.folio_number,
        "total_charges": folio.total_charges,
        "total_paid": booking.total_paid,
        "balance_due": booking.balance_due,
        "status": folio.status,
        "message": f"Folio for {booking.booking_ref} settled successfully."
    }

@router.post(
    "/kot",
    summary="Create KOT Order with Idempotency Protection (#1, #20)",
    dependencies=[Depends(require_idempotency_key)]
)
@limiter.limit(settings.RATE_LIMIT_KOT)
def create_kot_endpoint(request: Request, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Submits a Kitchen Order Ticket (KOT) with mandatory idempotency key (#1).
    Persists to kot_tickets and kot_orders tables.
    """
    kot_num = payload.get("kot_no") or payload.get("kot_number") or f"KOT-{int(time.time()*1000)%1000000}"
    room_num = payload.get("room_no") or payload.get("room_number")
    table_num = payload.get("table_no") or payload.get("table_number") or "Table 1"
    items = payload.get("items") or []
    items_json = json.dumps(items) if isinstance(items, list) else str(payload.get("items_json") or "[]")
    amount = float(payload.get("total_amount") or payload.get("amount") or 0.0)
    waiter = payload.get("waiter_name") or payload.get("waiter") or "Steward"

    room = None
    if room_num:
        room = db.query(models.Room).filter(
            (models.Room.name.ilike(f"%{room_num}%")) |
            (models.Room.id == int(room_num) if str(room_num).isdigit() else False)
        ).first()

    room_id = room.id if room else None

    existing = db.query(models.KotTicket).filter(models.KotTicket.kot_no == kot_num).first()
    if existing:
        return {
            "success": True,
            "kot_number": existing.kot_no,
            "table_no": existing.table_no,
            "room_no": existing.room_no,
            "total_amount": existing.total_amount,
            "status": existing.status,
            "message": "KOT ticket already exists"
        }

    kot = models.KotTicket(
        kot_no=kot_num,
        table_session_id=payload.get("table_session_id") or f"TS-{uuid.uuid4().hex[:6].upper()}",
        kot_sequence=int(payload.get("kot_sequence") or 1),
        date=payload.get("date") or datetime.date.today().isoformat(),
        time=payload.get("time") or datetime.datetime.now().strftime("%I:%M %p"),
        table_no=table_num,
        room_no=room_num,
        waiter_name=waiter,
        guest_name=payload.get("guest_name") or "Guest",
        pax=int(payload.get("pax") or 2),
        items_json=items_json,
        total_amount=amount,
        status="Running"
    )
    db.add(kot)

    kot_order = models.KOTOrder(
        kot_number=kot_num,
        room_id=room_id,
        room_no=room_num,
        table_no=table_num,
        status="PLACED",
        total_amount=amount
    )
    db.add(kot_order)
    db.commit()

    return {
        "success": True,
        "kot_number": kot.kot_no,
        "table_no": kot.table_no,
        "room_no": kot.room_no,
        "total_amount": kot.total_amount,
        "status": "PLACED",
        "message": f"KOT {kot.kot_no} placed successfully"
    }

# =========================================================================
# 4. REAL-TIME WEBHOOK INGESTION & DEDUPLICATION (#17, #36, #38, #39)
# =========================================================================
async def _handle_decentro_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session,
    x_decentro_signature: Optional[str]
) -> Dict[str, Any]:
    """Unified handler for Decentro webhook delivery."""
    body_bytes = await request.body()

    # 1. HMAC-SHA256 Signature Verification over raw body (#17)
    req_headers = getattr(request, "headers", {}) or {}
    sig_header = x_decentro_signature or req_headers.get("x-decentro-signature") or req_headers.get("decentro-signature")
    secret = getattr(decentro_client, "webhook_secret", None) or os.getenv("DECENTRO_WEBHOOK_SECRET", "")
    if secret:
        if not sig_header:
            logger.warning("[Webhook Security] Missing HMAC-SHA256 signature header.")
            raise HTTPException(status_code=401, detail="Missing X-Decentro-Signature header")
        expected_sig = hmac.new(
            secret.encode("utf-8"),
            body_bytes,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected_sig.lower(), sig_header.lower()):
            logger.warning("[Webhook Security] Invalid HMAC-SHA256 signature.")
            raise HTTPException(status_code=401, detail="Invalid webhook signature")
    elif not decentro_client.verify_webhook_signature(body_bytes, sig_header):
        logger.warning("[Webhook] Signature verification failed.")
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = json.loads(body_bytes.decode('utf-8'))
        if not isinstance(payload, dict):
            raise ValueError("Payload must be a valid JSON dictionary")
    except Exception as exc:
        logger.error(f"[Webhook Security] Malformed payload received: {exc}")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    decentro_txn_id = payload.get("decentro_txn_id") or payload.get("txn_id") or payload.get("reference_id")
    reference_id = payload.get("reference_id")
    if not decentro_txn_id:
        decentro_txn_id = f"EVT-{uuid.uuid4().hex[:12].upper()}"

    # 1b. Row-Level Pessimistic Lock & Idempotency Check on PaymentTransaction (#37)
    if reference_id or decentro_txn_id:
        filter_q = []
        if reference_id:
            filter_q.append(PaymentTransaction.reference_id == reference_id)
        if decentro_txn_id:
            filter_q.append(PaymentTransaction.decentro_txn_id == decentro_txn_id)
        try:
            existing_txn = db.query(PaymentTransaction).filter(or_(*filter_q)).with_for_update().first()
        except Exception:
            existing_txn = db.query(PaymentTransaction).filter(or_(*filter_q)).first()

        if existing_txn and existing_txn.status in ["SUCCESS", "SETTLED"]:
            logger.info(f"[Webhook Idempotency] Txn {existing_txn.reference_id} / {existing_txn.decentro_txn_id} was already recorded as SUCCESS. Returning HTTP 200 already_processed.")
            return {
                "status": "already_processed",
                "message": "Transaction already processed and settled (Idempotent OK)",
                "event_id": decentro_txn_id,
                "reference_id": existing_txn.reference_id,
                "decentro_txn_id": existing_txn.decentro_txn_id,
                "duplicate": True
            }

    # 2. Webhook Event Deduplication in webhook_events with row-level lock (#36, #37)
    try:
        existing_event = db.query(WebhookEvent).filter(WebhookEvent.event_id == decentro_txn_id).with_for_update().first()
    except Exception:
        existing_event = db.query(WebhookEvent).filter(WebhookEvent.event_id == decentro_txn_id).first()

    if existing_event and existing_event.status in ["PROCESSED", "SUCCESS"]:
        logger.info(f"[Webhook] Deduplication hit: Event '{decentro_txn_id}' already processed. Returning HTTP 200 already_processed.")
        return {
            "status": "already_processed",
            "message": "Duplicate webhook callback ignored (Idempotent OK)",
            "event_id": decentro_txn_id,
            "duplicate": True
        }

    # 3. Raw Ingestion into webhook_events with concurrency collision safety (#36)
    try:
        new_event = WebhookEvent(
            event_id=decentro_txn_id,
            decentro_txn_id=decentro_txn_id,
            idempotency_key=payload.get("idempotency_key") or decentro_txn_id,
            source="DECENTRO",
            event_type=payload.get("event_type") or payload.get("transaction_status") or "PAYMENT_SUCCESS",
            payload_json=json.dumps(payload),
            status="PENDING",
            attempts=0,
            created_at=now_utc()
        )
        db.add(new_event)
        db.commit()
    except Exception as exc:
        db.rollback()
        existing_event = db.query(WebhookEvent).filter(WebhookEvent.event_id == decentro_txn_id).first()
        if existing_event:
            logger.info(f"[Webhook] Concurrent deduplication catch: Event '{decentro_txn_id}' already ingested.")
            return {
                "status": "already_processed",
                "message": "Duplicate webhook callback ignored (Idempotent OK)",
                "event_id": decentro_txn_id,
                "duplicate": True
            }
        logger.error(f"[Webhook] Error ingesting event {decentro_txn_id}: {exc}")
        raise HTTPException(status_code=500, detail=f"Database error ingesting webhook: {str(exc)}")

    # 4. Immediate 200 OK + Dispatch BackgroundTask for Folio Settlement & Invoice (#38)
    await enqueue_task(reconcile_decentro_webhook_task, decentro_txn_id, payload, background_tasks=background_tasks)

    return {
        "status": "SUCCESS",
        "message": "Webhook acknowledged for asynchronous settlement and invoice generation",
        "event_id": decentro_txn_id
    }

@router.post(
    "/webhooks/decentro",
    summary="Decentro Banking Inbound Webhook Listener (#17, #36, #38)"
)
@limiter.limit(settings.RATE_LIMIT_WEBHOOK)
async def decentro_webhook_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    x_decentro_signature: Optional[str] = Header(None, alias="X-Decentro-Signature")
):
    return await _handle_decentro_webhook(request, background_tasks, db, x_decentro_signature)

@router.post(
    "/webhooks/decentro/payment-callback",
    summary="Alias for Decentro Payment Callback (#17, #36, #38)"
)
@limiter.limit(settings.RATE_LIMIT_WEBHOOK)
async def decentro_payment_callback_alias(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    x_decentro_signature: Optional[str] = Header(None, alias="X-Decentro-Signature")
):
    return await _handle_decentro_webhook(request, background_tasks, db, x_decentro_signature)

# =========================================================================
# 4. DEAD LETTER QUEUE (DLQ) REPLAY & MANAGEMENT (#39)
# =========================================================================
@router.get(
    "/admin/dlq",
    summary="List all failed webhooks in Dead Letter Queue (#39)"
)
def list_dlq_events(
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    q = db.query(FailedWebhookDLQ)
    if status:
        q = q.filter(FailedWebhookDLQ.status == status)
    items = q.order_by(FailedWebhookDLQ.created_at.desc()).limit(limit).all()
    return [{
        "id": item.id,
        "event_id": item.event_id,
        "source": item.source,
        "payload": json.loads(item.payload_json) if item.payload_json else {},
        "failure_reason": item.failure_reason,
        "retry_count": item.retry_count,
        "status": item.status,
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "replayed_at": item.replayed_at.isoformat() if item.replayed_at else None,
        "replayed_by": item.replayed_by
    } for item in items]

@router.post(
    "/admin/dlq/{dlq_id}/replay",
    summary="Replay a failed webhook from the Dead Letter Queue (#39)"
)
def replay_dlq_event(
    dlq_id: str,
    db: Session = Depends(get_db)
):
    """
    Manually replay an item from failed_webhook_dlq.
    If successful, marks status as RESOLVED and updates webhook_events.
    """
    item = None
    if dlq_id.isdigit():
        item = db.query(FailedWebhookDLQ).filter(FailedWebhookDLQ.id == int(dlq_id)).first()
    if not item:
        item = db.query(FailedWebhookDLQ).filter(FailedWebhookDLQ.event_id == dlq_id).first()

    if not item:
        raise HTTPException(status_code=404, detail=f"DLQ event '{dlq_id}' not found.")

    try:
        payload = json.loads(item.payload_json)
        # Execute synchronous reconciliation
        process_decentro_webhook_background(item.event_id, payload)

        item.status = "REPLAYED"
        item.replayed_at = now_utc()
        item.replayed_by = "Admin"
        db.commit()

        return {
            "success": True,
            "message": f"DLQ event '{item.event_id}' successfully replayed and resolved.",
            "event_id": item.event_id,
            "status": "REPLAYED"
        }
    except Exception as exc:
        item.failure_reason = f"Replay failure: {str(exc)}"
        db.commit()
        raise HTTPException(
            status_code=500,
            detail=f"DLQ replay execution failed: {str(exc)}"
        )

# =========================================================================
# 5. TRANSACTION STATUS POLLING ENDPOINT
# =========================================================================
# =========================================================================
# 5. TRANSACTION STATUS POLLING ENDPOINT (#98)
# =========================================================================
@router.get(
    "/payments/{txn_id}/status",
    summary="Lightweight polling endpoint for real-time payment status (#98)"
)
@router.get(
    "/payments/status/{txn_id}",
    summary="Lightweight polling endpoint alias"
)
def get_payment_status_by_id(txn_id: str, db: Session = Depends(get_db)):
    clean_id = txn_id.strip()
    txn = db.query(PaymentTransaction).filter(
        or_(
            PaymentTransaction.reference_id == clean_id,
            PaymentTransaction.decentro_txn_id == clean_id,
            PaymentTransaction.bank_reference_number == clean_id
        )
    ).first()
    if not txn:
        return {
            "status": "PENDING",
            "reference_id": clean_id,
            "decentro_txn_id": None,
            "amount": 0.0,
            "bank_reference_number": None,
            "paid": False,
            "is_success": False
        }
    is_success = (txn.status or "").upper() in ("SUCCESS", "SETTLED")
    return {
        "status": txn.status,
        "reference_id": txn.reference_id,
        "decentro_txn_id": txn.decentro_txn_id,
        "amount": float(txn.amount or 0.0),
        "bank_reference_number": txn.bank_reference_number,
        "booking_id": txn.booking_id,
        "kot_id": txn.kot_id,
        "room_no": txn.room_no,
        "payer_vpa": txn.payer_vpa,
        "paid": is_success,
        "is_success": is_success,
        "updated_at": txn.updated_at.isoformat() if txn.updated_at else None
    }

@router.get(
    "/payments/decentro/status/{reference_id}",
    response_model=PaymentTransactionResponse,
    summary="Check status of Decentro payment transaction"
)
def get_payment_status(reference_id: str, db: Session = Depends(get_db)):
    txn = db.query(PaymentTransaction).filter(PaymentTransaction.reference_id == reference_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment transaction not found")
    return txn

# =========================================================================
# 6. WEBSOCKET SUBSCRIPTION ENDPOINT FOR LIVE CHECKOUT SCREEN
# =========================================================================
@router.websocket("/ws/payments")
async def websocket_payments_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket, "payments")
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket, "payments")
    except Exception as e:
        logger.warning(f"[WebSocket] Error: {e}")
        await ws_manager.disconnect(websocket, "payments")
