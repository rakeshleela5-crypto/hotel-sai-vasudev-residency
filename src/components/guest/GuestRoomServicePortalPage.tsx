import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { 
  PmsRoom, 
  MenuItem, 
  GuestRoomServiceOrder, 
  GuestOrderItem, 
  GuestAmenityItem, 
  AmenityTierConfig
} from '../../types/pmsModels';

interface GuestRoomServicePortalProps {
  initialRoomNo?: string;
  onClose?: () => void;
  isStandalone?: boolean;
}

export const GuestRoomServicePortalPage: React.FC<GuestRoomServicePortalProps> = ({
  initialRoomNo,
  onClose,
  isStandalone = false
}) => {
  // Extract room number from props, URL search param, or hash
  const getDetectedRoomNo = (): string => {
    if (initialRoomNo) return initialRoomNo;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qRoom = params.get('room') || params.get('roomNo');
      if (qRoom) return qRoom;
      const match = window.location.pathname.match(/room-service\/([0-9]+)/i);
      if (match && match[1]) return match[1];
    }
    return '101';
  };

  const [selectedRoomNo, setSelectedRoomNo] = useState<string>(getDetectedRoomNo());
  const [activeTab, setActiveTab] = useState<'amenities' | 'food' | 'orders'>('amenities');
  
  // Rooms & Tier config
  const [allRooms, setAllRooms] = useState<PmsRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<PmsRoom | null>(null);
  const [tierConfig, setTierConfig] = useState<AmenityTierConfig | null>(null);

  // Amenity selection state
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, number>>({});
  const [amenityNotes, setAmenityNotes] = useState<string>('');
  const [amenitySuccessMsg, setAmenitySuccessMsg] = useState<string | null>(null);

  // Food Menu & Cart state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<Record<string, { item: MenuItem; qty: number }>>({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  
  // Checkout Form
  const [paymentChoice, setPaymentChoice] = useState<'Transfer to Room Folio' | 'Immediate UPI' | 'Immediate Card'>('Transfer to Room Folio');
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [orderSubmitting, setOrderSubmitting] = useState<boolean>(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<GuestRoomServiceOrder | null>(null);

  // Room orders history
  const [roomOrders, setRoomOrders] = useState<GuestRoomServiceOrder[]>([]);

  // Load initial rooms, tier amenities, and menu items
  useEffect(() => {
    const rooms = PmsStore.getRooms();
    setAllRooms(rooms);

    const room = rooms.find(r => r.roomNo === selectedRoomNo) || rooms[0] || null;
    setCurrentRoom(room);

    if (room) {
      const config = PmsStore.getTieredAmenities(room.roomType);
      setTierConfig(config);
      // Pre-fill guest name if occupied
      if (room.currentGuest?.name) {
        setGuestName(room.currentGuest.name);
      }
    }

    const items = PmsStore.getMenuItems();
    setMenuItems(items);

    loadRoomOrders(selectedRoomNo);

    // Listen for order updates
    const handleOrderUpdate = () => {
      loadRoomOrders(selectedRoomNo);
    };
    window.addEventListener('pms_guest_room_order', handleOrderUpdate);
    window.addEventListener('pms_guest_room_order_updated', handleOrderUpdate);

    return () => {
      window.removeEventListener('pms_guest_room_order', handleOrderUpdate);
      window.removeEventListener('pms_guest_room_order_updated', handleOrderUpdate);
    };
  }, [selectedRoomNo]);

  const loadRoomOrders = (roomNo: string) => {
    const orders = PmsStore.getGuestOrders(roomNo);
    setRoomOrders(orders);
  };

  const handleRoomChange = (roomNo: string) => {
    setSelectedRoomNo(roomNo);
    const room = allRooms.find(r => r.roomNo === roomNo);
    setCurrentRoom(room || null);
    if (room) {
      setTierConfig(PmsStore.getTieredAmenities(room.roomType));
      if (room.currentGuest?.name) {
        setGuestName(room.currentGuest.name);
      }
    }
    // Reset selections
    setSelectedAmenities({});
    setCart({});
    loadRoomOrders(roomNo);
  };

  // Amenities quantity handler
  const handleAmenityQtyChange = (amenityId: string, delta: number) => {
    setSelectedAmenities(prev => {
      const current = prev[amenityId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[amenityId];
        return copy;
      }
      return { ...prev, [amenityId]: next };
    });
  };

  // Submit Amenity Request
  const handleSubmitAmenityRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || !tierConfig) return;

    const requestedItems: GuestAmenityItem[] = [];
    Object.entries(selectedAmenities).forEach(([id, qty]) => {
      const found = tierConfig.amenities.find(a => a.id === id);
      if (found && qty > 0) {
        requestedItems.push({
          amenity_id: found.id,
          amenity_name: found.name,
          qty
        });
      }
    });

    if (requestedItems.length === 0) {
      alert('Please select at least 1 amenity to request.');
      return;
    }

    setOrderSubmitting(true);
    try {
      const order = PmsStore.saveGuestOrder({
        room_no: currentRoom.roomNo,
        room_category: currentRoom.roomType,
        order_type: 'Amenity Request',
        amenities: requestedItems,
        items: [],
        subtotal_amount: 0,
        tax_amount: 0,
        total_amount: 0,
        payment_method: 'Complimentary',
        payment_status: 'Complimentary',
        status: 'New Order',
        guest_name: guestName || `Guest (Room ${currentRoom.roomNo})`,
        guest_phone: guestPhone || undefined,
        special_instructions: amenityNotes || 'Complimentary Tiered Amenities Request'
      });

      setSelectedAmenities({});
      setAmenityNotes('');
      setAmenitySuccessMsg(`Request #${order.order_number} submitted! Housekeeping has been notified.`);
      loadRoomOrders(currentRoom.roomNo);
      setTimeout(() => setAmenitySuccessMsg(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit amenity request');
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Cart operations
  const handleAddToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev[item.id];
      const newQty = existing ? existing.qty + 1 : 1;
      return {
        ...prev,
        [item.id]: { item, qty: newQty }
      };
    });
  };

  const handleUpdateCartQty = (itemId: string, delta: number) => {
    setCart(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const newQty = existing.qty + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: { ...existing, qty: newQty }
      };
    });
  };

  const cartItemsArray = Object.values(cart);
  const cartItemCount = cartItemsArray.reduce((s, c) => s + c.qty, 0);
  const subtotal = cartItemsArray.reduce((s, c) => s + (c.item.rate * c.qty), 0);
  const gstAmount = Math.round(subtotal * 0.05); // 5% GST for restaurant items
  const grandTotal = subtotal + gstAmount;

  // Submit Food Order
  const handleConfirmFoodOrder = () => {
    if (!currentRoom || cartItemsArray.length === 0) return;

    setOrderSubmitting(true);
    try {
      const orderItems: GuestOrderItem[] = cartItemsArray.map(c => ({
        item_id: c.item.id,
        item_name: c.item.name,
        rate: c.item.rate,
        qty: c.qty,
        amount: c.item.rate * c.qty
      }));

      const isTransferToFolio = paymentChoice === 'Transfer to Room Folio';

      const order = PmsStore.saveGuestOrder({
        room_no: currentRoom.roomNo,
        room_category: currentRoom.roomType,
        order_type: 'Food Order',
        amenities: [],
        items: orderItems,
        subtotal_amount: subtotal,
        tax_amount: gstAmount,
        total_amount: grandTotal,
        payment_method: paymentChoice,
        payment_status: isTransferToFolio ? 'Folio Accrued' : 'Paid',
        payment_reference: isTransferToFolio ? undefined : `UPI-REF-${Date.now().toString().slice(-6)}`,
        status: 'New Order',
        guest_name: guestName || `Guest (Room ${currentRoom.roomNo})`,
        guest_phone: guestPhone || undefined,
        special_instructions: specialNotes || undefined
      });

      setLastPlacedOrder(order);
      setCart({});
      setIsCheckoutOpen(false);
      setSpecialNotes('');
      setActiveTab('orders');
      loadRoomOrders(currentRoom.roomNo);
    } catch (err: any) {
      alert(err.message || 'Failed to place food order');
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Filter food menu
  const menuCategories = ['All', ...Array.from(new Set(menuItems.map(m => m.category || 'General')))];
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCat = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0f1d',
      color: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: cartItemCount > 0 && activeTab === 'food' ? '90px' : '40px'
    }}>
      {/* Top Banner / Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0d1b2a 0%, #1e293b 100%)',
        borderBottom: '1px solid #334155',
        padding: '14px 18px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#d4af37', fontWeight: 800, textTransform: 'uppercase' }}>
              Sri Sai Vasudev Residency
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🛎️ Room Service & Dining Portal</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Room Selector Dropdown */}
            <select
              value={selectedRoomNo}
              onChange={(e) => handleRoomChange(e.target.value)}
              style={{
                background: '#0f172a',
                color: '#d4af37',
                border: '1.5px solid #d4af37',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {allRooms.map(r => (
                <option key={r.roomNo} value={r.roomNo}>
                  Room {r.roomNo} ({r.roomType})
                </option>
              ))}
            </select>

            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}
              >
                ✕
              </button>
            )}

            {isStandalone && !onClose && (
              <a
                href="/"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#d4af37',
                  border: '1px solid #d4af37',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                🏨 Hotel Home
              </a>
            )}
          </div>
        </div>

        {/* Room & Tier Status Pill */}
        {currentRoom && tierConfig && (
          <div style={{
            maxWidth: '640px',
            margin: '10px auto 0 auto',
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '10px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px'
          }}>
            <div>
              <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '13px' }}>
                Room {currentRoom.roomNo}
              </span>
              <span style={{ color: '#94a3b8', marginLeft: '6px' }}>
                • Floor {currentRoom.floor === 0 ? 'Ground' : '1st'} ({currentRoom.roomType})
              </span>
            </div>
            <div style={{
              background: '#d4af37',
              color: '#0d1b2a',
              padding: '2px 8px',
              borderRadius: '20px',
              fontWeight: 800,
              fontSize: '11px'
            }}>
              ⭐ {tierConfig.badge}
            </div>
          </div>
        )}
      </header>

      {/* Navigation Tabs */}
      <div style={{
        maxWidth: '640px',
        margin: '12px auto',
        padding: '0 14px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '6px'
      }}>
        <button
          onClick={() => setActiveTab('amenities')}
          style={{
            padding: '10px 6px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            fontSize: '12.5px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeTab === 'amenities' ? '#d4af37' : '#1e293b',
            color: activeTab === 'amenities' ? '#0d1b2a' : '#cbd5e1',
            boxShadow: activeTab === 'amenities' ? '0 2px 8px rgba(212, 175, 55, 0.4)' : 'none'
          }}
        >
          🧺 Tier Amenities
        </button>

        <button
          onClick={() => setActiveTab('food')}
          style={{
            padding: '10px 6px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            fontSize: '12.5px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeTab === 'food' ? '#d4af37' : '#1e293b',
            color: activeTab === 'food' ? '#0d1b2a' : '#cbd5e1',
            position: 'relative',
            boxShadow: activeTab === 'food' ? '0 2px 8px rgba(212, 175, 55, 0.4)' : 'none'
          }}
        >
          🍛 Vasudev Rasoi
          {cartItemCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#ffffff',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}>
              {cartItemCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '10px 6px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            fontSize: '12.5px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeTab === 'orders' ? '#d4af37' : '#1e293b',
            color: activeTab === 'orders' ? '#0d1b2a' : '#cbd5e1',
            boxShadow: activeTab === 'orders' ? '0 2px 8px rgba(212, 175, 55, 0.4)' : 'none'
          }}
        >
          📋 My Orders ({roomOrders.length})
        </button>
      </div>

      {/* Main Content Area */}
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '0 14px' }}>
        
        {/* TAB 1: TIERED ROOM AMENITIES */}
        {activeTab === 'amenities' && tierConfig && (
          <div>
            <div style={{
              background: '#131f33',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '14px',
              border: '1px solid #1e293b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#d4af37' }}>
                  {tierConfig.tier_name}
                </span>
                <span style={{ fontSize: '11px', background: '#059669', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                  100% Complimentary
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                {tierConfig.description}
              </p>
            </div>

            {amenitySuccessMsg && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#34d399',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>✅</span>
                <span>{amenitySuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAmenityRequest}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {tierConfig.amenities.map(amenity => {
                  const qty = selectedAmenities[amenity.id] || 0;
                  return (
                    <div
                      key={amenity.id}
                      style={{
                        background: '#162238',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        border: qty > 0 ? '1.5px solid #d4af37' : '1px solid #233452',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'border 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          fontSize: '24px',
                          background: 'rgba(255,255,255,0.06)',
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {amenity.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                            {amenity.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '240px', lineHeight: 1.3 }}>
                            {amenity.description}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {qty > 0 && (
                          <button
                            type="button"
                            onClick={() => handleAmenityQtyChange(amenity.id, -1)}
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '8px',
                              border: '1px solid #475569',
                              background: '#1e293b',
                              color: '#ffffff',
                              fontSize: '16px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            -
                          </button>
                        )}

                        <span style={{
                          minWidth: '22px',
                          textAlign: 'center',
                          fontSize: '14px',
                          fontWeight: 800,
                          color: qty > 0 ? '#d4af37' : '#64748b'
                        }}>
                          {qty > 0 ? qty : 0}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleAmenityQtyChange(amenity.id, 1)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#d4af37',
                            color: '#0d1b2a',
                            fontSize: '16px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Special Instructions Note */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Special Housekeeping Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please deliver immediately / Leave at door"
                  value={amenityNotes}
                  onChange={(e) => setAmenityNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#131f33',
                    color: '#f8fafc',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={orderSubmitting || Object.keys(selectedAmenities).length === 0}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: Object.keys(selectedAmenities).length > 0 ? 'linear-gradient(135deg, #d4af37 0%, #b89628 100%)' : '#334155',
                  color: Object.keys(selectedAmenities).length > 0 ? '#0d1b2a' : '#94a3b8',
                  fontSize: '14.5px',
                  fontWeight: 800,
                  cursor: Object.keys(selectedAmenities).length > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  boxShadow: Object.keys(selectedAmenities).length > 0 ? '0 4px 12px rgba(212, 175, 55, 0.4)' : 'none'
                }}
              >
                {orderSubmitting ? 'Submitting to Reception...' : '🛎️ Submit Request to Room (Complimentary)'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: VASUDEV RASOI FOOD MENU */}
        {activeTab === 'food' && (
          <div>
            {/* Search Input */}
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="🔍 Search breakfast, thalis, curries, rotis, beverages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  background: '#131f33',
                  color: '#f8fafc',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Category Pills (Horizontal Scroll) */}
            <div style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '8px',
              marginBottom: '12px'
            }}>
              {menuCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    background: activeCategory === cat ? '#d4af37' : '#1e293b',
                    color: activeCategory === cat ? '#0d1b2a' : '#cbd5e1'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Food Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredMenuItems.map(item => {
                const cartEntry = cart[item.id];
                const itemQty = cartEntry ? cartEntry.qty : 0;

                return (
                  <div
                    key={item.id}
                    style={{
                      background: '#162238',
                      borderRadius: '12px',
                      padding: '12px',
                      border: itemQty > 0 ? '1.5px solid #d4af37' : '1px solid #233452',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '14px',
                          height: '14px',
                          border: '1.5px solid #10b981',
                          padding: '2px',
                          boxSizing: 'border-box',
                          borderRadius: '2px'
                        }}>
                          <span style={{
                            display: 'block',
                            width: '6px',
                            height: '6px',
                            background: '#10b981',
                            borderRadius: '50%'
                          }} />
                        </span>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc' }}>
                          {item.name}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#d4af37', marginBottom: '4px' }}>
                        ₹{item.rate}
                      </div>
                      {item.description && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.3 }}>
                          {item.description}
                        </div>
                      )}
                    </div>

                    {/* Add / Stepper Button */}
                    <div>
                      {itemQty === 0 ? (
                        <button
                          onClick={() => handleAddToCart(item)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid #d4af37',
                            background: 'rgba(212, 175, 55, 0.1)',
                            color: '#d4af37',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          + ADD
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleUpdateCartQty(item.id, -1)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '1px solid #475569',
                              background: '#1e293b',
                              color: '#ffffff',
                              fontSize: '14px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: '18px', textAlign: 'center', fontWeight: 800, color: '#d4af37', fontSize: '13px' }}>
                            {itemQty}
                          </span>
                          <button
                            onClick={() => handleUpdateCartQty(item.id, 1)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: 'none',
                              background: '#d4af37',
                              color: '#0d1b2a',
                              fontSize: '14px',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: MY ORDERS & STATUS */}
        {activeTab === 'orders' && (
          <div>
            {lastPlacedOrder && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#34d399',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>✅</span>
                <span>Order #{lastPlacedOrder.order_number} confirmed! Sent to reception &amp; kitchen.</span>
              </div>
            )}

            <div style={{
              background: '#131f33',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '14px',
              border: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                  Live Orders for Room {currentRoom?.roomNo}
                </span>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Auto-synced with Reception & Kitchen
                </div>
              </div>
              <button
                onClick={() => loadRoomOrders(selectedRoomNo)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#d4af37',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh
              </button>
            </div>

            {roomOrders.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#162238',
                borderRadius: '12px',
                border: '1px dashed #334155',
                color: '#94a3b8'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>
                  No Active Requests Yet
                </div>
                <div style={{ fontSize: '12px' }}>
                  Order food from Vasudev Rasoi or request fresh amenities above.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {roomOrders.map(order => {
                  const isNew = order.status === 'New Order';
                  const isAck = order.status === 'Acknowledged';
                  const isInPrep = order.status === 'In Preparation';
                  const isDelivered = order.status === 'Delivered';

                  let statusBg = '#ca8a04';
                  if (isAck) statusBg = '#2563eb';
                  if (isInPrep) statusBg = '#7c3aed';
                  if (isDelivered) statusBg = '#059669';

                  return (
                    <div
                      key={order.id}
                      style={{
                        background: '#162238',
                        borderRadius: '12px',
                        padding: '14px',
                        border: '1px solid #233452'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#d4af37' }}>
                          #{order.order_number} • {order.order_type}
                        </span>
                        <span style={{
                          background: isNew ? '#ef4444' : statusBg,
                          color: '#ffffff',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          {order.status}
                        </span>
                      </div>

                      {/* Items / Amenities */}
                      <div style={{ fontSize: '12px', color: '#e2e8f0', marginBottom: '8px', lineHeight: 1.4 }}>
                        {order.amenities && order.amenities.length > 0 && (
                          <div style={{ color: '#cbd5e1' }}>
                            🧺 {order.amenities.map(a => `${a.amenity_name} (${a.qty})`).join(', ')}
                          </div>
                        )}
                        {order.items && order.items.length > 0 && (
                          <div style={{ color: '#cbd5e1' }}>
                            🍛 {order.items.map(i => `${i.item_name} x${i.qty} (₹${i.amount})`).join(', ')}
                          </div>
                        )}
                      </div>

                      {/* Payment info & Timestamp */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid #233452',
                        paddingTop: '8px',
                        fontSize: '11px',
                        color: '#94a3b8'
                      }}>
                        <div>
                          <span>Billing: </span>
                          <b style={{ color: order.payment_method.includes('Folio') ? '#38bdf8' : '#34d399' }}>
                            {order.payment_method}
                          </b>
                          {order.total_amount > 0 && (
                            <span style={{ color: '#d4af37', fontWeight: 800, marginLeft: '6px' }}>
                              • ₹{order.total_amount}
                            </span>
                          )}
                        </div>
                        <div>
                          {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Cart Bar (Appears when items are in food cart) */}
      {cartItemCount > 0 && activeTab === 'food' && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#0f172a',
          borderTop: '2px solid #d4af37',
          padding: '12px 18px',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.6)',
          zIndex: 50
        }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in cart
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                ₹{grandTotal} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>(incl. 5% GST)</span>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #b89628 100%)',
                color: '#0d1b2a',
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 800,
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)'
              }}
            >
              <span>View Cart & Checkout</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#101c31',
            border: '2px solid #d4af37',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '20px',
            boxSizing: 'border-box',
            boxShadow: '0 12px 36px rgba(0,0,0,0.8)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#d4af37', fontWeight: 800, textTransform: 'uppercase' }}>
                  Vasudev Rasoi Room Service
                </span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                  Checkout for Room {currentRoom?.roomNo}
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Cart Items Summary */}
            <div style={{
              background: '#0d1627',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '14px',
              border: '1px solid #1e293b'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                Order Summary
              </div>
              {cartItemsArray.map(c => (
                <div key={c.item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                  <span>{c.item.name} x{c.qty}</span>
                  <span style={{ fontWeight: 700, color: '#f1f5f9' }}>₹{c.item.rate * c.qty}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #334155', paddingTop: '6px', marginTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#94a3b8' }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#94a3b8' }}>
                  <span>GST (5%)</span>
                  <span>₹{gstAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800, color: '#d4af37', marginTop: '4px' }}>
                  <span>Grand Total</span>
                  <span>₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Guest Details */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                Guest Name & Phone (Optional)
              </div>
              <input
                type="text"
                placeholder="Guest Full Name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: '#0d1627',
                  color: '#f8fafc',
                  fontSize: '12.5px',
                  marginBottom: '8px',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="tel"
                placeholder="Guest Phone Number (Optional)"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: '#0d1627',
                  color: '#f8fafc',
                  fontSize: '12.5px',
                  marginBottom: '8px',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="text"
                placeholder="Special notes / Less spicy / Extra plates"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: '#0d1627',
                  color: '#f8fafc',
                  fontSize: '12.5px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* PAYMENT CHOICE: The Two Explicit Options Requested by User */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#d4af37', marginBottom: '8px' }}>
                Select Payment Mode:
              </div>

              {/* Option 1: Transfer to Room Folio */}
              <label style={{
                display: 'block',
                background: paymentChoice === 'Transfer to Room Folio' ? 'rgba(56, 189, 248, 0.15)' : '#0d1627',
                border: paymentChoice === 'Transfer to Room Folio' ? '1.5px solid #38bdf8' : '1px solid #334155',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                marginBottom: '10px',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="radio"
                    name="paymentChoice"
                    checked={paymentChoice === 'Transfer to Room Folio'}
                    onChange={() => setPaymentChoice('Transfer to Room Folio')}
                    style={{ accentColor: '#38bdf8' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                      🛎️ Transfer to Room Folio (Pay at Checkout)
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.3 }}>
                      Charges will be automatically added to Room {currentRoom?.roomNo}'s active bill.
                    </div>
                  </div>
                </div>
              </label>

              {/* Option 2: Pay Immediately via Digital Options */}
              <label style={{
                display: 'block',
                background: paymentChoice === 'Immediate UPI' ? 'rgba(16, 185, 129, 0.15)' : '#0d1627',
                border: paymentChoice === 'Immediate UPI' ? '1.5px solid #10b981' : '1px solid #334155',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="radio"
                    name="paymentChoice"
                    checked={paymentChoice === 'Immediate UPI'}
                    onChange={() => setPaymentChoice('Immediate UPI')}
                    style={{ accentColor: '#10b981' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                      📲 Pay Immediately via UPI / QR / Card
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.3 }}>
                      Pay ₹{grandTotal} directly via PhonePe, Google Pay, Paytm, or Credit/Debit Card.
                    </div>
                  </div>
                </div>

                {/* Show Live UPI QR if selected */}
                {paymentChoice === 'Immediate UPI' && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: '#09101d',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700, marginBottom: '6px' }}>
                      Scan UPI QR Code (Hotel VPA: 7999663696@YBL)
                    </div>
                    <img
                      src={PmsStore.generateUpiPaymentQrUrl(grandTotal, guestName, `Room-${currentRoom?.roomNo}`)}
                      alt="UPI QR"
                      style={{ width: '130px', height: '130px', margin: '0 auto', display: 'block', borderRadius: '8px', background: '#ffffff', padding: '4px' }}
                    />
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>
                      Instant settlement credited to Sri Sai Vasudev Residency
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* Confirm & Place Order Button */}
            <button
              onClick={handleConfirmFoodOrder}
              disabled={orderSubmitting}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #d4af37 0%, #b89628 100%)',
                color: '#0d1b2a',
                fontSize: '14.5px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)'
              }}
            >
              {orderSubmitting ? 'Transmitting to Kitchen...' : `✅ Confirm Order (₹${grandTotal})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
