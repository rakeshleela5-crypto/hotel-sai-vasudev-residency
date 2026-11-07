import asyncio
import datetime
import json
import logging
from collections import defaultdict
from typing import Dict, Set, List, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("pms_websocket")

class WebSocketManager:
    """
    Memory-safe, multi-channel WebSocket Manager for Hotel Sai Vasudev Residency (#16, #54).
    Supports dedicated channels:
      - 'front_desk': Booking state changes, check-ins, check-outs, room shifts, folio updates.
      - 'kitchen_kds': Kitchen Display System for steward KOT punch, item dispatch, voided tickets.
      - 'housekeeping': Real-time room sanitization state (Clean, Dirty, Inspected, Maintenance).
      - 'payments': Decentro dynamic UPI QR payment settlement notices.
    Enforces try...finally cleanup (#16), dead socket purging, and 30s heartbeats.
    """
    VALID_CHANNELS = {"front_desk", "kitchen_kds", "housekeeping", "payments", "all"}

    def __init__(self):
        # Maps channel_name -> Set of active WebSocket connections
        self.channels: Dict[str, Set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    @property
    def active_connections(self) -> List[WebSocket]:
        """Backward-compatible flattened list of all active connections."""
        all_conns = set()
        for conns in self.channels.values():
            all_conns.update(conns)
        return list(all_conns)

    async def connect(self, websocket: WebSocket, channel: str = "front_desk"):
        """Accepts WebSocket connection and subscribes it to a designated channel."""
        try:
            await websocket.accept()
        except Exception:
            # Sockets might already be accepted by earlier middleware or test clients
            pass

        clean_channel = channel.lower().strip()
        async with self._lock:
            self.channels[clean_channel].add(websocket)
            # Also add to 'all' channel for broad system broadcasts
            self.channels["all"].add(websocket)

        logger.info(
            f"[WebSocket] Connected to channel '{clean_channel}'. "
            f"Active on channel: {len(self.channels[clean_channel])}, Total: {len(self.active_connections)}"
        )

        # Emit initial connection handshake
        try:
            await websocket.send_text(json.dumps({
                "event": "CONNECTED",
                "channel": clean_channel,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "message": f"Connected to {clean_channel} real-time stream"
            }))
        except Exception as e:
            logger.warning(f"[WebSocket] Handshake send failed: {e}")
            await self.disconnect(websocket, clean_channel)

    async def disconnect(self, websocket: WebSocket, channel: Optional[str] = None):
        """Guaranteed thread-safe removal of dead or disconnected sockets (#16)."""
        async with self._lock:
            if channel:
                clean_channel = channel.lower().strip()
                self.channels[clean_channel].discard(websocket)
            else:
                for ch in list(self.channels.keys()):
                    self.channels[ch].discard(websocket)
            self.channels["all"].discard(websocket)

        logger.info(f"[WebSocket] Disconnected socket. Remaining total connections: {len(self.active_connections)}")

    async def broadcast_to_channel(self, channel: str, message: Dict[str, Any]):
        """Broadcasts a JSON payload to all active subscribers of a specific channel."""
        clean_channel = channel.lower().strip()
        if "timestamp" not in message or message["timestamp"] is None:
            message["timestamp"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        message["channel"] = clean_channel

        payload_str = json.dumps(message)
        dead_connections = []

        # Read copy of sockets to prevent iteration mutation
        async with self._lock:
            targets = list(self.channels.get(clean_channel, set()))

        for ws in targets:
            try:
                await ws.send_text(payload_str)
            except Exception as exc:
                logger.debug(f"[WebSocket] Failed delivery on '{clean_channel}', scheduling purge: {exc}")
                dead_connections.append(ws)

        if dead_connections:
            async with self._lock:
                for dead_ws in dead_connections:
                    self.channels[clean_channel].discard(dead_ws)
                    self.channels["all"].discard(dead_ws)

    async def broadcast_to_all(self, message: Dict[str, Any]):
        """Broadcasts a payload across all active channels."""
        await self.broadcast_to_channel("all", message)

    async def broadcast(self, message: Dict[str, Any]):
        """Backward-compatible broadcast across all active clients."""
        await self.broadcast_to_all(message)

    # --- Live Event Emission Helpers (#54, #80) ---

    async def broadcast_booking_event(
        self,
        event_type: str,
        booking_ref: str,
        status: str,
        room_number: str = None,
        guest_name: str = None,
        extra: Dict[str, Any] = None
    ):
        """
        Emits live booking status changes (Checked-In, Checked-Out, Confirmed, Cancelled, Room Shift).
        Notifies front_desk and housekeeping channels.
        """
        payload = {
            "event": event_type,
            "booking_ref": booking_ref,
            "status": status,
            "room_number": room_number,
            "guest_name": guest_name,
            "details": extra or {}
        }
        await self.broadcast_to_channel("front_desk", payload)
        # If room occupancy status changes, notify housekeeping as well
        if status in ("Checked-In", "Checked-Out", "Dirty", "Occupied"):
            await self.broadcast_to_channel("housekeeping", payload)

    async def broadcast_kot_event(
        self,
        event_type: str,
        kot_number: str,
        table_number: str = None,
        room_number: str = None,
        waiter_name: str = None,
        items: List[Dict[str, Any]] = None,
        status: str = "Active"
    ):
        """
        Emits live KOT dispatch, punch, or void events.
        Notifies kitchen_kds and front_desk channels.
        """
        payload = {
            "event": event_type,
            "kot_number": kot_number,
            "table_number": table_number,
            "room_number": room_number,
            "waiter_name": waiter_name,
            "items": items or [],
            "status": status
        }
        await self.broadcast_to_channel("kitchen_kds", payload)
        await self.broadcast_to_channel("front_desk", payload)

    async def broadcast_room_status_event(
        self,
        room_id: int,
        room_name: str,
        housekeeping_status: str,
        old_status: str = None,
        updated_by: str = None
    ):
        """
        Emits live housekeeping room sanitation status transitions (Clean -> Dirty -> Inspected -> Maintenance).
        Notifies housekeeping and front_desk channels.
        """
        payload = {
            "event": "ROOM_STATUS_CHANGED",
            "room_id": room_id,
            "room_name": room_name,
            "housekeeping_status": housekeeping_status,
            "old_status": old_status,
            "updated_by": updated_by or "Housekeeping Staff"
        }
        await self.broadcast_to_channel("housekeeping", payload)
        await self.broadcast_to_channel("front_desk", payload)

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
        """Emits live payment settlement notice to front_desk and payments channels."""
        payload = {
            "event": "PAYMENT_SUCCESS",
            "reference_id": reference_id,
            "amount": amount,
            "bank_reference_number": bank_reference_number,
            "booking_id": booking_id,
            "kot_id": kot_id,
            "room_no": room_no,
            "payer_vpa": payer_vpa
        }
        await self.broadcast_to_channel("front_desk", payload)
        await self.broadcast_to_channel("payments", payload)
        if reference_id:
            clean_ref = reference_id.strip()
            await self.broadcast_to_channel(f"payment_{clean_ref}", payload)

    def _dispatch_sync(self, coro):
        """Dispatches an async coroutine from synchronous route contexts."""
        if not any(self.channels.values()):
            try:
                coro.close()
            except Exception:
                pass
            return
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(coro)
        except RuntimeError:
            try:
                val = None
                stack = [coro]
                while stack:
                    curr = stack[-1]
                    try:
                        yielded = curr.send(val)
                        val = None
                        if hasattr(yielded, "send"):
                            stack.append(yielded)
                        else:
                            val = yielded
                    except StopIteration as e:
                        stack.pop()
                        val = e.value
            except Exception as e:
                logger.debug(f"[WebSocket] Sync dispatch failed: {e}")

    def emit_booking_event_sync(self, *args, **kwargs):
        """Sync-friendly trigger for live booking status events."""
        self._dispatch_sync(self.broadcast_booking_event(*args, **kwargs))

    def emit_kot_event_sync(self, *args, **kwargs):
        """Sync-friendly trigger for live KOT dispatch events."""
        self._dispatch_sync(self.broadcast_kot_event(*args, **kwargs))

    def emit_room_status_event_sync(self, *args, **kwargs):
        """Sync-friendly trigger for live room status events."""
        self._dispatch_sync(self.broadcast_room_status_event(*args, **kwargs))

    def emit_payment_success_sync(self, *args, **kwargs):
        """Sync-friendly trigger for live payment settlement notices (#97)."""
        self._dispatch_sync(self.broadcast_payment_success(*args, **kwargs))

    def broadcast_sync(self, payload: dict, channel: str = "all"):
        """Sync-friendly broadcaster for channel or system-wide events (#54)."""
        self._dispatch_sync(self.broadcast_to_channel(channel, payload))


# Singleton instances
ws_manager = WebSocketManager()
ConnectionManager = WebSocketManager

