import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import or_
from app.websocket_manager import ws_manager
from app.database import SessionLocal
from app import models

logger = logging.getLogger("pms_websocket")
router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/payments/{txn_id}")
async def websocket_payment_endpoint(websocket: WebSocket, txn_id: str):
    """
    Dedicated WebSocket endpoint for real-time payment status of a transaction (#97).
    Subscribes client to channel 'payment_{txn_id}' and general 'payments'.
    Checks DB immediately upon connection; if already SUCCESS/SETTLED, sends PAYMENT_SUCCESS instantly.
    """
    clean_txn = txn_id.strip()
    payment_channel = f"payment_{clean_txn}"
    await ws_manager.connect(websocket, payment_channel)
    async with ws_manager._lock:
        ws_manager.channels["payments"].add(websocket)

    # Immediate DB status check upon connection
    db = SessionLocal()
    try:
        txn = db.query(models.PaymentTransaction).filter(
            or_(
                models.PaymentTransaction.reference_id == clean_txn,
                models.PaymentTransaction.decentro_txn_id == clean_txn,
                models.PaymentTransaction.bank_reference_number == clean_txn
            )
        ).first()
        if txn and (txn.status or "").upper() in ("SUCCESS", "SETTLED"):
            await websocket.send_text(json.dumps({
                "event": "PAYMENT_SUCCESS",
                "channel": payment_channel,
                "reference_id": txn.reference_id,
                "decentro_txn_id": txn.decentro_txn_id,
                "amount": float(txn.amount or 0.0),
                "bank_reference_number": txn.bank_reference_number or "UTR-CONFIRMED",
                "booking_id": txn.booking_id,
                "kot_id": txn.kot_id,
                "room_no": txn.room_no,
                "payer_vpa": txn.payer_vpa,
                "status": "SUCCESS"
            }))
    except Exception as db_err:
        logger.debug(f"[WebSocket] Initial DB status check failed for '{clean_txn}': {db_err}")
    finally:
        db.close()

    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=45.0)
            except asyncio.TimeoutError:
                try:
                    await websocket.send_text(json.dumps({"type": "ping", "channel": payment_channel}))
                except Exception:
                    break
                continue

            if data == "ping" or data == '{"type":"ping"}':
                await websocket.send_text(json.dumps({"type": "pong", "channel": payment_channel}))
            else:
                try:
                    msg_json = json.loads(data)
                    if msg_json.get("type") == "ping":
                        await websocket.send_text(json.dumps({"type": "pong", "channel": payment_channel}))
                except Exception:
                    pass
    except WebSocketDisconnect:
        logger.info(f"[WebSocket] Client disconnected from payment channel '{payment_channel}'")
    except Exception as exc:
        logger.warning(f"[WebSocket] Payment channel '{payment_channel}' connection error: {exc}")
    finally:
        await ws_manager.disconnect(websocket, payment_channel)
        async with ws_manager._lock:
            ws_manager.channels["payments"].discard(websocket)

@router.websocket("/ws/{channel}")
async def websocket_channel_endpoint(websocket: WebSocket, channel: str):
    """
    Multi-channel real-time WebSocket connection for Hotel Sai Vasudev Residency (#16, #54).
    Supported channels: 'front_desk', 'kitchen_kds', 'housekeeping', 'payments'.
    Enforces try...finally cleanup (#16) and handles 30s heartbeats.
    """
    clean_channel = channel.lower().strip()
    await ws_manager.connect(websocket, clean_channel)
    try:
        while True:
            # Await incoming message from client (heartbeat ping or client ack)
            try:
                # 45-second timeout covers 30s client heartbeat with buffer
                data = await asyncio.wait_for(websocket.receive_text(), timeout=45.0)
            except asyncio.TimeoutError:
                # Send server-side heartbeat ping to keep connection alive (#54)
                try:
                    await websocket.send_text(json.dumps({"type": "ping", "channel": clean_channel}))
                except Exception:
                    break
                continue

            # Process heartbeat ping from client
            if data == "ping" or data == '{"type":"ping"}':
                await websocket.send_text(json.dumps({"type": "pong", "channel": clean_channel}))
            else:
                try:
                    msg_json = json.loads(data)
                    if msg_json.get("type") == "ping":
                        await websocket.send_text(json.dumps({"type": "pong", "channel": clean_channel}))
                except Exception:
                    # Echo / ack regular client messages
                    pass
    except WebSocketDisconnect:
        logger.info(f"[WebSocket] Client disconnected from channel '{clean_channel}'")
    except Exception as exc:
        logger.warning(f"[WebSocket] Channel '{clean_channel}' connection error: {exc}")
    finally:
        # Guaranteed cleanup on socket exit (#16)
        await ws_manager.disconnect(websocket, clean_channel)
