import json
import uuid
import datetime
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PaymentTransaction, VirtualAccount, Booking, BookingPayment
from app.schemas import (
    DecentroUpiQrRequest,
    DecentroUpiQrResponse,
    DecentroVirtualAccountRequest,
    DecentroVirtualAccountResponse,
    DecentroWebhookPayload,
    PaymentTransactionResponse
)
from app.services.decentro_client import decentro_client, logger
from app.websocket_manager import ws_manager

router = APIRouter(tags=["Decentro Banking & Payments"])

# =========================================================================
# 1. DYNAMIC UPI QR GENERATION (Room Checkouts, Advances & KOT Bills)
# =========================================================================
@router.post(
    "/payments/decentro/upi-qr",
    response_model=DecentroUpiQrResponse,
    summary="Generate Dynamic UPI QR Code via Decentro"
)
async def generate_upi_qr(
    req: DecentroUpiQrRequest,
    db: Session = Depends(get_db)
):
    """
    Accepts booking_id (or kot_id), amount, and purpose_message.
    Generates a unique reference_id (UUID) and stores a PENDING transaction in payment_transactions table.
    Calls Decentro Dynamic QR API (/v2/payments/upi/qr) and returns Base64 QR code and UPI intent link.
    """
    reference_id = f"SVR-UPI-{uuid.uuid4().hex[:10].upper()}"
    expiry_time = datetime.datetime.utcnow() + datetime.timedelta(minutes=req.expiry_minutes or 30)

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

    # 2. Call Decentro Service
    qr_result = await decentro_client.generate_dynamic_upi_qr(
        reference_id=reference_id,
        amount=req.amount,
        purpose_message=req.purpose_message,
        expiry_minutes=req.expiry_minutes or 30
    )

    # 3. Update transaction record with Decentro generated QR & link
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
# 2. CORPORATE & GROUP BOOKINGS VIA VIRTUAL ACCOUNTS (NEFT/RTGS/IMPS)
# =========================================================================
@router.post(
    "/payments/decentro/virtual-account",
    response_model=DecentroVirtualAccountResponse,
    summary="Create Dedicated Virtual Account for Corporate / Group Booking"
)
async def create_corporate_virtual_account(
    req: DecentroVirtualAccountRequest,
    db: Session = Depends(get_db)
):
    """
    When a corporate client or travel agent makes a bulk booking, calls Decentro's
    Virtual Account Creation API to generate a dedicated virtual account number and IFSC.
    Saves record in virtual_accounts table so it can be printed on Proforma Invoices.
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

    # Store in database
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
# 3. REAL-TIME WEBHOOK LISTENER & AUTO-RECONCILIATION
# =========================================================================
@router.post(
    "/webhooks/decentro/payment-callback",
    summary="Real-time Decentro Payment Callback & Auto-Reconciliation"
)
async def decentro_payment_callback(
    request: Request,
    db: Session = Depends(get_db),
    x_decentro_signature: Optional[str] = Header(None, alias="X-Decentro-Signature")
):
    """
    Receives Decentro real-time credit callbacks (UPI QR & Virtual Account NEFT/RTGS/IMPS).
    1. Verifies incoming webhook signature.
    2. Enforces idempotency via decentro_txn_id and UTR check.
    3. Updates payment_transactions table to SUCCESS.
    4. Auto-deducts paid amount from guest room folio.
    5. Broadcasts PAYMENT_SUCCESS over WebSocket to live front-desk screen.
    """
    body_bytes = await request.body()

    # 1. Signature Verification
    if not decentro_client.verify_webhook_signature(body_bytes, x_decentro_signature):
        logger.warning("[Webhook] Signature verification failed.")
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = json.loads(body_bytes.decode('utf-8'))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    logger.info(f"[Webhook] Received Decentro callback: {payload}")

    decentro_txn_id = payload.get("decentro_txn_id") or payload.get("txn_id")
    reference_id = payload.get("reference_id")
    status = (payload.get("transaction_status") or payload.get("status") or "SUCCESS").upper()
    bank_ref = payload.get("bank_reference_number") or payload.get("utr") or f"UTR-{uuid.uuid4().hex[:8].upper()}"
    amount = float(payload.get("amount") or 0.0)
    payer_vpa = payload.get("payer_vpa") or payload.get("payer_upi") or "guest@upi"

    # 2. Idempotency Check
    existing_processed = None
    if decentro_txn_id:
        existing_processed = db.query(PaymentTransaction).filter(
            PaymentTransaction.decentro_txn_id == decentro_txn_id,
            PaymentTransaction.status == "SUCCESS"
        ).first()

    if not existing_processed and bank_ref:
        existing_processed = db.query(PaymentTransaction).filter(
            PaymentTransaction.bank_reference_number == bank_ref,
            PaymentTransaction.status == "SUCCESS"
        ).first()

    if existing_processed:
        logger.info(f"[Webhook] Idempotency hit: Transaction {bank_ref} already processed as SUCCESS.")
        return {
            "status": "SUCCESS",
            "message": "Transaction already reconciled (Idempotent OK)",
            "reference_id": existing_processed.reference_id
        }

    # 3. Locate Transaction Record
    txn = None
    if reference_id:
        txn = db.query(PaymentTransaction).filter(PaymentTransaction.reference_id == reference_id).first()

    if not txn and decentro_txn_id:
        txn = db.query(PaymentTransaction).filter(PaymentTransaction.decentro_txn_id == decentro_txn_id).first()

    if not txn:
        # Create transaction on the fly if initiated via Virtual Account direct bank transfer
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

    # 4. Process Payment Status
    if status == "SUCCESS":
        txn.status = "SUCCESS"
        txn.bank_reference_number = bank_ref
        txn.payer_vpa = payer_vpa
        txn.updated_at = datetime.datetime.utcnow()

        # Update Booking / Folio if attached
        booking_id = txn.booking_id
        room_no = txn.room_no
        if booking_id:
            booking = db.query(Booking).filter(Booking.id == booking_id).first()
            if booking:
                booking.total_paid = round(booking.total_paid + txn.amount, 2)
                booking.balance_due = max(0.0, round(booking.total_price - booking.total_paid, 2))
                if booking.balance_due <= 0.0:
                    booking.payment_status = "Paid"
                else:
                    booking.payment_status = "Partial"
                booking.payment_method = "UPI (Decentro)"

                # Log payment in booking_payments
                bp = BookingPayment(
                    booking_id=booking.id,
                    payment_type="Settlement",
                    payment_mode="UPI (Decentro)",
                    amount=txn.amount,
                    transaction_ref=bank_ref,
                    notes=f"Auto-Reconciled via Decentro Webhook (Ref: {txn.reference_id})"
                )
                db.add(bp)

        db.commit()

        # 5. Broadcast real-time WebSocket event to Front Desk / Checkout Screen
        await ws_manager.broadcast_payment_success(
            reference_id=txn.reference_id,
            amount=txn.amount,
            bank_reference_number=bank_ref,
            booking_id=txn.booking_id,
            kot_id=txn.kot_id,
            room_no=room_no,
            payer_vpa=payer_vpa
        )

        logger.info(f"[Webhook] Auto-reconciliation SUCCESS for {txn.reference_id}, UTR: {bank_ref}, Amount: ₹{txn.amount}")
        return {
            "status": "SUCCESS",
            "message": "Payment reconciled and folio updated successfully",
            "reference_id": txn.reference_id,
            "bank_reference_number": bank_ref
        }
    else:
        txn.status = status
        db.commit()
        logger.warning(f"[Webhook] Payment status {status} recorded for {txn.reference_id}")
        return {"status": status, "reference_id": txn.reference_id}

# =========================================================================
# 4. TRANSACTION STATUS POLLING ENDPOINT
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
# 5. WEBSOCKET SUBSCRIPTION ENDPOINT FOR FRONT-DESK / CHECKOUT SCREENS
# =========================================================================
@router.websocket("/ws/payments")
async def websocket_payments_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; listen for client heartbeats
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"[WebSocket] Error: {e}")
        ws_manager.disconnect(websocket)
