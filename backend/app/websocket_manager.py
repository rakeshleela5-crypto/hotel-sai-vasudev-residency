import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("pms_websocket")

class ConnectionManager:
    """
    WebSocket connection manager for real-time PMS & POS synchronization.
    Broadcasts Decentro PAYMENT_SUCCESS, KOT dispatches, and room status updates
    to active front desk, checkout, and cashier screens without page refreshes.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"[WebSocket] Client connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"[WebSocket] Client disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcasts a JSON message to all connected clients."""
        payload_str = json.dumps(message)
        logger.info(f"[WebSocket] Broadcasting event: {message.get('event', 'UNKNOWN')}")
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload_str)
            except Exception as e:
                logger.warning(f"[WebSocket] Failed to send message to client: {e}")
                disconnected.append(connection)

        for dead_conn in disconnected:
            self.disconnect(dead_conn)

    async def broadcast_payment_success(
        self,
        reference_id: str,
        amount: float,
        bank_reference_number: str,
        booking_id: int = None,
        kot_id: str = None,
        room_no: str = None,
        payer_vpa: str = None
    ):
        """Helper to broadcast Decentro payment success event to checkout modal."""
        await self.broadcast({
            "event": "PAYMENT_SUCCESS",
            "reference_id": reference_id,
            "amount": amount,
            "bank_reference_number": bank_reference_number,
            "booking_id": booking_id,
            "kot_id": kot_id,
            "room_no": room_no,
            "payer_vpa": payer_vpa,
            "timestamp": None
        })

ws_manager = ConnectionManager()
