import json
import uuid
import datetime
import time
import asyncio
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Header, Request, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app import models
from app.models import PaymentTransaction, VirtualAccount, Booking, BookingPayment, Folio, WebhookEvent, FailedWebhookDLQ
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
from app.utils.timezone import now_utc
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

            # 1. Update or create transaction record
            txn = None
            if reference_id:
                txn = db.query(PaymentTransaction).filter(PaymentTransaction.reference_id == reference_id).first()
            if not txn and decentro_txn_id:
                txn = db.query(PaymentTransaction).filter(PaymentTransaction.decentro_txn_id == decentro_txn_id).first()

            if not txn:
                txn = PaymentTransaction(
                    reference_id=reference_id or f"DCN-DIRECT-{uuid.uuid4().hex[:8].upper()}",
                    amount=amount,
                    currency="INR",
                    purpose_message="Direct Decentro Payment Callback",
                    payment_method="VIRTUAL_ACCOUNT" if "VA-" in str(reference_id) else "UPI_QR",
                    status="PENDING",
                    decentro_txn_id=decentro_txn_id
                )
                db.add(txn)
                db.commit()
                db.refresh(txn)

            if status == "SUCCESS":
                txn.status = "SUCCESS"
                txn.bank_reference_number = bank_ref
                txn.payer_vpa = payer_vpa
                txn.updated_at = now_utc()

                # 2. Settle Guest Room Folio (#26, #38)
                booking_id = txn.booking_id
                room_no = txn.room_no
                if booking_id:
                    acquire_canonical_locks(db, booking_id=booking_id)
                    booking = db.query(Booking).filter(Booking.id == booking_id).first()
                    if booking:
                        booking.total_paid = round((booking.total_paid or 0.0) + txn.amount, 2)
                        booking.balance_due = max(0.0, round(booking.total_price - booking.total_paid, 2))
                        if booking.balance_due <= 0.0:
                            booking.payment_status = "Paid"
                        else:
                            booking.payment_status = "Partial"
                        booking.payment_method = "UPI (Decentro)"

                        # Ensure invoice number & PDF key are generated (#38)
                        if not booking.invoice_number:
                            booking.invoice_number = f"INV-SVR-{int(time.time()*1000)}-{uuid.uuid4().hex[:4].upper()}"
                        if not booking.invoice_pdf_key:
                            booking.invoice_pdf_key = f"invoices/{datetime.date.today().strftime('%Y/%m')}/{booking.invoice_number}.pdf"

                        # Record in booking_payments
                        bp = BookingPayment(
                            booking_id=booking.id,
                            payment_type="Settlement",
                            payment_mode="UPI (Decentro)",
                            amount=txn.amount,
                            transaction_ref=bank_ref,
                            notes=f"Auto-Reconciled via Decentro Webhook (Ref: {txn.reference_id})"
                        )
                        db.add(bp)

                        # Update or create Master Folio record
                        folio = db.query(Folio).filter(Folio.booking_id == booking.id).first()
                        if folio:
                            folio.total_payments = round((folio.total_payments or 0.0) + txn.amount, 2)
                            folio.balance_due = max(0.0, round((folio.total_charges or booking.total_price) - folio.total_payments, 2))
                            if folio.balance_due <= 0.0:
                                folio.status = "SETTLED"
                            folio.updated_at = now_utc()

                db.commit()

                # Mark WebhookEvent as PROCESSED
                if event_rec:
                    event_rec.status = "PROCESSED"
                    event_rec.processed_at = now_utc()
                    db.commit()

                # 3. Broadcast real-time WebSocket notification (#80)
                try:
                    asyncio.run(ws_manager.broadcast_payment_success(
                        reference_id=txn.reference_id,
                        amount=txn.amount,
                        bank_reference_number=bank_ref,
                        booking_id=txn.booking_id,
                        kot_id=txn.kot_id,
                        room_no=room_no,
                        payer_vpa=payer_vpa
                    ))
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
async def generate_upi_qr(
    req: DecentroUpiQrRequest,
    db: Session = Depends(get_db)
):
    """
    Accepts booking_id (or kot_id), amount, and purpose_message.
    Protected by X-Idempotency-Key (#1) to prevent duplicate transactions.
    """
    reference_id = f"SVR-UPI-{uuid.uuid4().hex[:10].upper()}"
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
def create_kot_endpoint(payload: Dict[str, Any], db: Session = Depends(get_db)):
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

    # 1. HMAC-SHA256 Signature Verification (#17)
    if not decentro_client.verify_webhook_signature(body_bytes, x_decentro_signature):
        logger.warning("[Webhook] Signature verification failed.")
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = json.loads(body_bytes.decode('utf-8'))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    decentro_txn_id = payload.get("decentro_txn_id") or payload.get("txn_id") or payload.get("reference_id")
    if not decentro_txn_id:
        decentro_txn_id = f"EVT-{uuid.uuid4().hex[:12].upper()}"

    # 2. Webhook Event Deduplication in webhook_events (#36)
    existing_event = db.query(WebhookEvent).filter(WebhookEvent.event_id == decentro_txn_id).first()
    if existing_event:
        logger.info(f"[Webhook] Deduplication hit: Event '{decentro_txn_id}' already ingested (status: {existing_event.status}).")
        return {
            "status": "SUCCESS",
            "message": "Duplicate webhook callback ignored (Idempotent OK)",
            "event_id": decentro_txn_id,
            "duplicate": True
        }

    # 3. Raw Ingestion into webhook_events (#36)
    new_event = WebhookEvent(
        event_id=decentro_txn_id,
        source="DECENTRO",
        event_type=payload.get("event_type") or payload.get("transaction_status") or "PAYMENT_SUCCESS",
        payload_json=json.dumps(payload),
        status="PENDING",
        attempts=0,
        created_at=now_utc()
    )
    db.add(new_event)
    db.commit()

    # 4. Immediate 200 OK + Dispatch BackgroundTask for Folio Settlement & Invoice (#38)
    background_tasks.add_task(process_decentro_webhook_background, decentro_txn_id, payload)

    return {
        "status": "SUCCESS",
        "message": "Webhook acknowledged for asynchronous settlement and invoice generation",
        "event_id": decentro_txn_id
    }

@router.post(
    "/webhooks/decentro",
    summary="Decentro Banking Inbound Webhook Listener (#17, #36, #38)"
)
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
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"[WebSocket] Error: {e}")
        ws_manager.disconnect(websocket)
