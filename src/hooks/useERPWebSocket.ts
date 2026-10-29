import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../services/apiClient';
import { PmsStore } from '../services/pmsStore';
import { updateCachedRoomStatus } from '../services/db';

export type ERPChannel = 'front_desk' | 'kitchen_kds' | 'housekeeping' | 'payments' | 'all';

export interface ERPWebSocketEvent {
  event: string;
  channel?: string;
  data?: any;
  timestamp?: string;
  [key: string]: any;
}

export interface UseERPWebSocketOptions {
  channel: ERPChannel;
  enabled?: boolean;
  onMessage?: (event: ERPWebSocketEvent) => void;
  onBookingEvent?: (event: ERPWebSocketEvent) => void;
  onKotEvent?: (event: ERPWebSocketEvent) => void;
  onRoomStatusEvent?: (event: ERPWebSocketEvent) => void;
  autoReconnect?: boolean;
  heartbeatIntervalMs?: number;
}

export interface UseERPWebSocketReturn {
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  lastEvent: ERPWebSocketEvent | null;
  sendMessage: (msg: any) => boolean;
  reconnect: () => void;
}

/**
 * Resolves the WebSocket endpoint URL for the requested channel
 */
function getWebSocketUrl(channel: ERPChannel): string {
  try {
    const parsed = new URL(API_BASE_URL);
    const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    // Support /api/v1/ws/{channel}
    return `${protocol}//${parsed.host}${parsed.pathname}/ws/${channel}`
      .replace(/\/+/g, '/')
      .replace('ws:/', 'ws://')
      .replace('wss:/', 'wss://');
  } catch {
    return `ws://localhost:8000/api/v1/ws/${channel}`;
  }
}

/**
 * Resilient Multi-Channel WebSocket Hook (#54, #16)
 * Features:
 * - Exponential backoff auto-reconnect (1s to 30s with jitter)
 * - 30-second heartbeat ping-pong
 * - Real-time PMS Store & Dexie auto-synchronization without page reload
 */
export function useERPWebSocket(options: UseERPWebSocketOptions): UseERPWebSocketReturn {
  const {
    channel,
    enabled = true,
    onMessage,
    onBookingEvent,
    onKotEvent,
    onRoomStatusEvent,
    autoReconnect = true,
    heartbeatIntervalMs = 30000
  } = options;

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [lastEvent, setLastEvent] = useState<ERPWebSocketEvent | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<any>(null);
  const isManuallyClosedRef = useRef<boolean>(false);

  // Stable event dispatcher to avoid stale closure issues
  const handleIncomingEvent = useCallback((eventData: ERPWebSocketEvent) => {
    setLastEvent(eventData);

    const eventName = (eventData.event || '').toUpperCase();
    const payload = eventData.data || eventData;

    // 1. Booking Status Change & Creation Events
    if (eventName.includes('BOOKING')) {
      if (onBookingEvent) onBookingEvent(eventData);

      // Reactively sync with PmsStore
      if (payload.booking_ref) {
        const bookings = PmsStore.getBookings();
        const existing = bookings.find(b => b.bookingNo === payload.booking_ref);
        if (existing && payload.status) {
          existing.status = payload.status;
          PmsStore.notify();
        }
      }
    }

    // 2. Steward KOT Punch & Void Events
    if (eventName.includes('KOT')) {
      if (onKotEvent) onKotEvent(eventData);

      // Audio notification for kitchen & front desk
      PmsStore.playKotChime();

      // If new KOT placed, prepend or update in PmsStore
      if (payload.kot_no) {
        const kots = PmsStore.getKots();
        const exists = kots.find(k => k.kotNo === payload.kot_no);
        if (!exists && payload.items) {
          PmsStore.saveKot({
            kotNo: payload.kot_no,
            serviceType: payload.service_type || 'Restaurant',
            tableNo: payload.table_no,
            roomNo: payload.room_no,
            guestName: payload.guest_name,
            totalAmount: payload.total_amount || 0,
            status: payload.status || 'Running',
            items: payload.items || [],
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date().toISOString(),
            isPrinted: false
          });
        } else {
          PmsStore.notify();
        }
      }
    }

    // 3. Room Status & Housekeeping Events
    if (
      eventName.includes('ROOM') ||
      eventName.includes('HOUSEKEEPING') ||
      eventName.includes('CHECK_IN') ||
      eventName.includes('CHECK_OUT')
    ) {
      if (onRoomStatusEvent) onRoomStatusEvent(eventData);

      const targetRoomNo = payload.room_no || payload.roomNo;
      const targetStatus = payload.status || payload.hk_status || payload.new_status;

      if (targetRoomNo && targetStatus) {
        // Update Dexie IndexedDB cache immediately (#6, #33)
        updateCachedRoomStatus(targetRoomNo, targetStatus);

        // Update in-memory PmsStore
        const rooms = PmsStore.getRooms();
        const r = rooms.find(rm => rm.roomNo === String(targetRoomNo));
        if (r) {
          r.status = targetStatus.toLowerCase() as any;
          PmsStore.notify();
        }
      }
    }

    // General user callback
    if (onMessage) {
      onMessage(eventData);
    }

    // Dispatch global custom event for any UI listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('svr:ws_message', { detail: eventData }));
    }
  }, [onMessage, onBookingEvent, onKotEvent, onRoomStatusEvent]);

  // Connect function with Exponential Backoff
  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Clean up any existing connection
    if (socketRef.current) {
      try {
        socketRef.current.close(1000, 'Reconnecting');
      } catch {
        // ignore
      }
      socketRef.current = null;
    }

    const wsUrl = getWebSocketUrl(channel);
    setStatus(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting');

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.info(`[useERPWebSocket] ✓ Connected to channel: ${channel}`);
        setIsConnected(true);
        setStatus('connected');
        reconnectAttemptsRef.current = 0; // Reset backoff on successful connection

        // Start 30-second heartbeat ping (#54)
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now(), channel }));
          }
        }, heartbeatIntervalMs);
      };

      ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);

          // Handle server heartbeat ping-pong
          if (raw.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            return;
          }
          if (raw.type === 'pong' || raw.type === 'heartbeat') {
            return;
          }

          // Handle business event
          handleIncomingEvent(raw);
        } catch {
          // If plain text message
          handleIncomingEvent({ event: 'MESSAGE', text: event.data });
        }
      };

      ws.onerror = (err) => {
        console.warn(`[useERPWebSocket] Socket error on channel ${channel}:`, err);
      };

      ws.onclose = (_event) => {
        setIsConnected(false);
        setStatus('disconnected');

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Only auto-reconnect if not closed manually (#16)
        if (autoReconnect && !isManuallyClosedRef.current) {
          reconnectAttemptsRef.current += 1;
          // Exponential backoff: min 1s, max 30s with random jitter
          const baseDelay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 30000);
          const jitter = baseDelay * (0.85 + Math.random() * 0.3);

          console.info(`[useERPWebSocket] Reconnecting to ${channel} in ${Math.round(jitter)}ms (attempt ${reconnectAttemptsRef.current})...`);

          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, jitter);
        }
      };
    } catch (err) {
      console.warn(`[useERPWebSocket] Failed to initialize WebSocket for ${channel}:`, err);
      setIsConnected(false);
      setStatus('disconnected');
    }
  }, [channel, enabled, autoReconnect, heartbeatIntervalMs, handleIncomingEvent]);

  // Send message helper
  const sendMessage = useCallback((msg: any): boolean => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const payload = typeof msg === 'string' ? msg : JSON.stringify(msg);
      socketRef.current.send(payload);
      return true;
    }
    return false;
  }, []);

  // Manual reconnect trigger
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    isManuallyClosedRef.current = false;
    connect();
  }, [connect]);

  // Lifecycle hook
  useEffect(() => {
    isManuallyClosedRef.current = false;
    connect();

    return () => {
      isManuallyClosedRef.current = true;
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        try {
          socketRef.current.close(1000, 'Component unmounted');
        } catch {
          // ignore
        }
      }
    };
  }, [connect]);

  return {
    isConnected,
    status,
    lastEvent,
    sendMessage,
    reconnect
  };
}
