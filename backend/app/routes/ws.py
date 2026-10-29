import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket_manager import ws_manager

logger = logging.getLogger("pms_websocket")
router = APIRouter(tags=["WebSockets"])

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
