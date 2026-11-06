import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';
import type { GuestRoomServiceOrder } from '../../types/pmsModels';

interface ReceptionistNotificationBannerProps {
  onOpenOrderDetails?: (order: GuestRoomServiceOrder) => void;
  onOpenQrManager?: () => void;
}

export const ReceptionistNotificationBanner: React.FC<ReceptionistNotificationBannerProps> = ({
  onOpenOrderDetails,
  onOpenQrManager
}) => {
  const [orders, setOrders] = useState<GuestRoomServiceOrder[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastNotifiedOrderId, setLastNotifiedOrderId] = useState<string | number | null>(null);

  const loadActiveOrders = () => {
    const all = PmsStore.getGuestOrders();
    // Prioritize New Order and In Preparation
    const active = all.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
    setOrders(active);
  };

  useEffect(() => {
    loadActiveOrders();

    // Listen for local/same-origin order events
    const handleNewOrder = (e: any) => {
      const newOrder = e.detail as GuestRoomServiceOrder;
      loadActiveOrders();
      if (soundEnabled) {
        PmsStore.playReceptionistChime();
      }
      setLastNotifiedOrderId(newOrder.id);
    };

    const handleOrderUpdated = () => {
      loadActiveOrders();
    };

    window.addEventListener('pms_guest_room_order', handleNewOrder);
    window.addEventListener('pms_guest_room_order_updated', handleOrderUpdated);

    // 5-second polling to backend API for multi-device instant sync
    const pollInterval = setInterval(async () => {
      try {
        const summary = await hotelApi.getReceptionistAlertSummary();
        if (summary && summary.has_alerts && summary.latest_new_orders && summary.latest_new_orders.length > 0) {
          const latest = summary.latest_new_orders[0];
          if (latest && latest.id !== lastNotifiedOrderId) {
            setLastNotifiedOrderId(latest.id);
            if (soundEnabled) {
              PmsStore.playReceptionistChime();
            }
          }
        }
      } catch {}
      loadActiveOrders();
    }, 5000);

    return () => {
      window.removeEventListener('pms_guest_room_order', handleNewOrder);
      window.removeEventListener('pms_guest_room_order_updated', handleOrderUpdated);
      clearInterval(pollInterval);
    };
  }, [soundEnabled, lastNotifiedOrderId]);

  const newOrdersCount = orders.filter(o => o.status === 'New Order').length;

  const handleUpdateStatus = (orderId: string | number, newStatus: string) => {
    PmsStore.updateGuestOrderStatus(orderId, newStatus, 'Receptionist / Front Desk');
    loadActiveOrders();
  };

  const handleTestChime = () => {
    PmsStore.playReceptionistChime();
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {/* Trigger Button with Animated Notification Pulse */}
      <button
        onClick={() => setIsDropdownOpen(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: newOrdersCount > 0 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.35) 100%)' 
            : 'rgba(255, 255, 255, 0.08)',
          border: newOrdersCount > 0 ? '1.5px solid #ef4444' : '1px solid #334155',
          borderRadius: '8px',
          padding: '6px 12px',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s',
          boxShadow: newOrdersCount > 0 ? '0 0 12px rgba(239, 68, 68, 0.5)' : 'none'
        }}
      >
        <span style={{ fontSize: '15px' }}>🛎️</span>
        <span style={{ color: newOrdersCount > 0 ? '#fca5a5' : '#cbd5e1' }}>
          Room Orders
        </span>

        {/* Counter Badge */}
        {orders.length > 0 && (
          <span style={{
            background: newOrdersCount > 0 ? '#ef4444' : '#3b82f6',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '1px 7px',
            fontSize: '11px',
            fontWeight: 800
          }}>
            {newOrdersCount > 0 ? `${newOrdersCount} NEW` : orders.length}
          </span>
        )}
      </button>

      {/* Floating Dropdown Drawer */}
      {isDropdownOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '380px',
          background: '#0d1627',
          border: '1.5px solid #d4af37',
          borderRadius: '12px',
          boxShadow: '0 16px 36px rgba(0,0,0,0.85)',
          zIndex: 9999,
          color: '#f8fafc',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 14px',
            background: 'linear-gradient(135deg, #0d1b2a 0%, #1e293b 100%)',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#d4af37' }}>
                🛎️ 18-Room Guest Requests
              </div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                {orders.length} active room request{orders.length === 1 ? '' : 's'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Sound Toggle */}
              <button
                onClick={() => {
                  setSoundEnabled(prev => !prev);
                  if (!soundEnabled) handleTestChime();
                }}
                title={soundEnabled ? 'Chime sound is active' : 'Chime is muted'}
                style={{
                  background: soundEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${soundEnabled ? '#10b981' : '#ef4444'}`,
                  borderRadius: '6px',
                  padding: '3px 7px',
                  fontSize: '11px',
                  color: soundEnabled ? '#34d399' : '#f87171',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                {soundEnabled ? '🔔 Sound On' : '🔕 Muted'}
              </button>

              <button
                onClick={() => setIsDropdownOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* List of Active Orders */}
          <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '10px' }}>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: '12px' }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>✅</div>
                <div>All room requests are fulfilled!</div>
                <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                  New orders from physical room standees appear here instantly.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {orders.map(o => {
                  const isNew = o.status === 'New Order';
                  const isAck = o.status === 'Acknowledged';

                  return (
                    <div
                      key={o.id}
                      style={{
                        background: isNew ? 'rgba(239, 68, 68, 0.12)' : '#162238',
                        border: isNew ? '1.5px solid #ef4444' : '1px solid #233452',
                        borderRadius: '10px',
                        padding: '10px 12px'
                      }}
                    >
                      <div 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', cursor: onOpenOrderDetails ? 'pointer' : 'default' }}
                        onClick={() => onOpenOrderDetails?.(o)}
                        title="Click to view room details"
                      >
                        <div>
                          <span style={{
                            background: '#d4af37',
                            color: '#0d1b2a',
                            fontWeight: 900,
                            fontSize: '11px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            marginRight: '6px'
                          }}>
                            ROOM {o.room_no}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {o.room_category} • {o.order_type}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '10px',
                          background: isNew ? '#ef4444' : isAck ? '#2563eb' : '#7c3aed',
                          color: '#ffffff'
                        }}>
                          {o.status}
                        </span>
                      </div>

                      {/* Items requested */}
                      <div style={{ fontSize: '11.5px', color: '#f1f5f9', marginBottom: '6px', lineHeight: 1.3 }}>
                        {o.amenities && o.amenities.length > 0 && (
                          <div>🧺 {o.amenities.map(a => `${a.amenity_name} (${a.qty})`).join(', ')}</div>
                        )}
                        {o.items && o.items.length > 0 && (
                          <div>🍛 {o.items.map(i => `${i.item_name} x${i.qty}`).join(', ')}</div>
                        )}
                        {o.special_instructions && (
                          <div style={{ fontSize: '10.5px', color: '#f59e0b', fontStyle: 'italic', marginTop: '2px' }}>
                            Note: {o.special_instructions}
                          </div>
                        )}
                      </div>

                      {/* Billing mode & Action buttons */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        paddingTop: '6px',
                        marginTop: '4px'
                      }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          <span>Bill: </span>
                          <b style={{ color: o.payment_method.includes('Folio') ? '#38bdf8' : '#34d399' }}>
                            {o.payment_method}
                          </b>
                          {o.total_amount > 0 && (
                            <span style={{ color: '#d4af37', fontWeight: 800, marginLeft: '4px' }}>
                              ₹{o.total_amount}
                            </span>
                          )}
                        </div>

                        {/* Status Transition Buttons */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {isNew && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'Acknowledged')}
                              style={{
                                background: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '3px 8px',
                                fontSize: '10px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              ✓ Acknowledge
                            </button>
                          )}

                          {(isNew || isAck) && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'In Preparation')}
                              style={{
                                background: '#7c3aed',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '3px 8px',
                                fontSize: '10px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              🍳 In Prep
                            </button>
                          )}

                          <button
                            onClick={() => handleUpdateStatus(o.id, 'Delivered')}
                            style={{
                              background: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            🚪 Delivered
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer with QR Standee Manager shortcut */}
          <div style={{
            padding: '8px 12px',
            background: '#0a101d',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px'
          }}>
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                if (onOpenQrManager) onOpenQrManager();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#d4af37',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>📱 Open 18-Room QR Standees</span>
              <span>➔</span>
            </button>

            <button
              onClick={handleTestChime}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '10.5px',
                cursor: 'pointer'
              }}
            >
              Test Chime 🔔
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
