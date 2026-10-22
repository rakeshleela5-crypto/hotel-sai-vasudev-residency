import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { PmsRoom, PmsUserAccount, PmsChainProperty } from '../../types/pmsModels';
import './pmsStyles.css';

interface DeviceResponsivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRoomDashboard?: () => void;
  onOpenKotEntry?: () => void;
  onOpenCheckIn?: () => void;
  onOpenFoodBill?: () => void;
}

type DeviceType = 'iphone-se' | 'iphone-pro' | 'ipad' | 'desktop';
type MobileViewMode = 'dashboard' | 'rooms' | 'kot' | 'sales';

export const DeviceResponsivePreviewModal: React.FC<DeviceResponsivePreviewModalProps> = ({
  isOpen,
  onClose,
  onOpenRoomDashboard,
  onOpenKotEntry,
  onOpenCheckIn,
  onOpenFoodBill
}) => {
  const [device, setDevice] = useState<DeviceType>('iphone-se');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [scale, setScale] = useState<number>(1);
  const [activeMobileView, setActiveMobileView] = useState<MobileViewMode>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [currentUser, setCurrentUser] = useState<PmsUserAccount | null>(null);
  const [currentProperty, setCurrentProperty] = useState<PmsChainProperty | null>(null);

  // KOT fast demo state on mobile
  const [kotRoomOrTable, setKotRoomOrTable] = useState('Room 101');
  const [selectedItem, setSelectedItem] = useState('Veg Thali (Spl)');
  const [kotQty, setKotQty] = useState(2);
  const [kotStatusMsg, setKotStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRooms(PmsStore.getRooms());
      setCurrentUser(PmsStore.getCurrentUser());
      setCurrentProperty(PmsStore.getCurrentProperty());
      setKotStatusMsg(null);
      setIsMobileMenuOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Device dimension definitions
  const deviceDimensions: Record<DeviceType, { width: number; height: number; label: string; icon: string }> = {
    'iphone-se': { width: 375, height: 667, label: 'iPhone SE (375x667)', icon: '📱' },
    'iphone-pro': { width: 390, height: 844, label: 'iPhone 14 / Pixel (390x844)', icon: '📱' },
    'ipad': { width: 768, height: 1024, label: 'iPad 10.2" (768x1024) [KDS / Table POS]', icon: '📟' },
    'desktop': { width: 1080, height: 720, label: 'Desktop / PC (1080x720)', icon: '💻' }
  };

  const currentDims = deviceDimensions[device];
  const width = orientation === 'portrait' ? currentDims.width : currentDims.height;
  const height = orientation === 'portrait' ? currentDims.height : currentDims.width;

  // Count Room Statuses
  const vacantCount = rooms.filter(r => r.status === 'vacant').length;
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const bookedCount = rooms.filter(r => r.status === 'booked').length;
  const dirtyCount = rooms.filter(r => r.status === 'dirty').length;

  const handleSimulateMobileKot = (e: React.FormEvent) => {
    e.preventDefault();
    const menuItems = PmsStore.getMenuItems();
    const foundItem = menuItems.find(m => m.name.toLowerCase() === selectedItem.toLowerCase()) || {
      name: selectedItem,
      price: 220,
      code: 'FD-101',
      category: 'Pure Veg Main Course'
    };
    const rate = (foundItem as any).price || (foundItem as any).rate || 220;
    const amount = rate * kotQty;
    const kotNum = String(Math.floor(1000 + Math.random() * 9000));
    const isTable = kotRoomOrTable.toLowerCase().includes('table') || kotRoomOrTable.toLowerCase().startsWith('t-');
    const targetRoomNo = isTable ? undefined : kotRoomOrTable.replace(/^Room\s+/i, '').trim();
    const targetTableNo = isTable ? kotRoomOrTable.trim() : undefined;

    const newKot: import('../../types/pmsModels').PmsKotRecord = {
      kotNo: `KOT-${kotNum}`,
      date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      serviceType: isTable ? 'Restaurant' : 'Room',
      tableNo: targetTableNo,
      roomNo: targetRoomNo || '',
      guestName: isTable ? 'Dine-In Guest' : `Guest (Room ${targetRoomNo || '101'})`,
      waiterName: currentUser?.userName || 'Captain Ramesh',
      operatorName: currentUser?.userName || 'Mobile App',
      items: [
        {
          sNo: 1,
          itemCode: (foundItem as any).code || 'ITEM-01',
          itemName: foundItem.name,
          qty: kotQty,
          rate,
          amount
        }
      ],
      totalQty: kotQty,
      totalAmount: amount,
      status: 'Pending',
      serveStatus: '0',
      isPrinted: true,
      createdAt: new Date().toISOString()
    };

    PmsStore.saveKot(newKot);

    setKotStatusMsg(`✓ KOT #${kotNum} punched for ${kotRoomOrTable} (${kotQty}x ${selectedItem} - ₹${amount}) by ${currentUser?.userName || 'Staff'}`);
    setTimeout(() => setKotStatusMsg(null), 4000);
  };

  return (
    <div className="pms-modal-backdrop" style={{ zIndex: 1100 }}>
      <div
        className="pms-modal-container"
        style={{
          maxWidth: '1360px',
          width: '96vw',
          maxHeight: '96vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Top Control Bar */}
        <div
          style={{
            backgroundColor: '#1e293b',
            color: '#ffffff',
            padding: '12px 20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #334155',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>📱</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.5px', color: '#f8fafc' }}>
                Multi-Device Mobile Responsive Simulator
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Live Interactive Preview • Responsive Touch Layout
              </div>
            </div>
          </div>

          {/* Device Preset Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {(['iphone-se', 'iphone-pro', 'ipad', 'desktop'] as DeviceType[]).map(d => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                style={{
                  backgroundColor: device === d ? '#2563eb' : '#334155',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: device === d ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>{deviceDimensions[d].icon}</span>
                <span>{deviceDimensions[d].label.split(' ')[0]} {deviceDimensions[d].label.split(' ')[1]}</span>
              </button>
            ))}

            {/* Orientation Toggle */}
            <button
              onClick={() => setOrientation(o => (o === 'portrait' ? 'landscape' : 'portrait'))}
              title="Rotate Device"
              style={{
                backgroundColor: '#475569',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🔄 {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
            </button>

            {/* Zoom / Scale */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setScale(s => Math.max(0.7, s - 0.1))}
                style={{
                  backgroundColor: '#334155',
                  color: '#ffffff',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                -
              </button>
              <span style={{ fontSize: '12px', color: '#cbd5e1', minWidth: '40px', textAlign: 'center' }}>
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale(s => Math.min(1.2, s + 0.1))}
                style={{
                  backgroundColor: '#334155',
                  color: '#ffffff',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                +
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: 'none',
                fontSize: '22px',
                cursor: 'pointer',
                lineHeight: 1,
                marginLeft: '10px'
              }}
              title="Close Simulator"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Simulator Workspace */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 100%)'
          }}
        >
          {/* Hardware Device Mockup Frame */}
          <div
            style={{
              width: `${width}px`,
              height: `${height}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              transition: 'all 0.25s ease',
              backgroundColor: '#ffffff',
              borderRadius: device === 'desktop' ? '8px' : '40px',
              border: device === 'desktop' ? '8px solid #334155' : '14px solid #1e293b',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Phone Speaker Notch (for mobile mockup) */}
            {device !== 'desktop' && orientation === 'portrait' && (
              <div
                style={{
                  height: '24px',
                  backgroundColor: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '10px',
                  padding: '0 16px'
                }}
              >
                <div style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>09:41</div>
                <div
                  style={{
                    width: '60px',
                    height: '5px',
                    backgroundColor: '#334155',
                    borderRadius: '3px'
                  }}
                />
                <div style={{ flex: 1, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                  <span>5G</span>
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>
            )}

            {/* Mobile Header Bar matching RoomG Frame 0138 */}
            <div
              style={{
                backgroundColor: '#1e293b',
                color: '#ffffff',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '2px solid #0f172a'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                  title="Menu"
                >
                  ☰
                </button>
                <div style={{ lineHeight: 1.1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                    SAI VASUDEV
                  </div>
                  <div style={{ fontSize: '9px', color: '#38bdf8' }}>
                    {currentProperty?.firmId || 'DEMO0004'} • {currentProperty?.location || 'Shirdi'}
                  </div>
                </div>
              </div>

              {/* User Avatar & View Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {currentUser?.userName.charAt(0) || 'A'}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0' }}>
                  {currentUser?.userName || 'Admin'}
                </span>
              </div>
            </div>

            {/* Mobile Navigation Drawer Overlay */}
            {isMobileMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '56px',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  zIndex: 200,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  color: '#ffffff'
                }}
              >
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Navigation (Mobile Menu)
                </div>
                <button
                  onClick={() => {
                    setActiveMobileView('dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    backgroundColor: activeMobileView === 'dashboard' ? '#2563eb' : '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🏠 Mobile Home Dashboard
                </button>
                <button
                  onClick={() => {
                    setActiveMobileView('rooms');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    backgroundColor: activeMobileView === 'rooms' ? '#2563eb' : '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🚪 Room Dashboard Cards
                </button>
                <button
                  onClick={() => {
                    setActiveMobileView('kot');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    backgroundColor: activeMobileView === 'kot' ? '#2563eb' : '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🍲 Mobile KOT Fast Ordering (Waiter App)
                </button>
                <button
                  onClick={() => {
                    setActiveMobileView('sales');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    backgroundColor: activeMobileView === 'sales' ? '#2563eb' : '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  📊 Daily Revenue & Night Audit (Owner View)
                </button>

                <div style={{ marginTop: 'auto', borderTop: '1px solid #334155', paddingTop: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Signed in as: <strong>{currentUser?.userName}</strong> ({currentUser?.roleName})
                  </div>
                  <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>
                    Active Property: {currentProperty?.firmName}
                  </div>
                </div>
              </div>
            )}

            {/* View Sub-Tabs for Mobile App */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#0f172a',
                borderBottom: '1px solid #334155',
                overflowX: 'auto'
              }}
            >
              {[
                { id: 'dashboard', label: '🏠 Home', color: '#3b82f6' },
                { id: 'rooms', label: '🚪 Rooms', color: '#10b981' },
                { id: 'kot', label: '🍲 Fast KOT', color: '#f59e0b' },
                { id: 'sales', label: '📊 Audit', color: '#8b5cf6' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveMobileView(tab.id as MobileViewMode)}
                  style={{
                    flex: 1,
                    backgroundColor: activeMobileView === tab.id ? tab.color : 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mobile View Container */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                backgroundColor: '#f1f5f9',
                padding: '10px'
              }}
            >
              {/* TAB 1: Mobile Home Dashboard (Exact Clone of Frame 0138) */}
              {activeMobileView === 'dashboard' && (
                <div>
                  {/* Property Quick Badge */}
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      marginBottom: '10px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Active Firm ID</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                      {currentProperty?.firmId} • {currentProperty?.firmName}
                    </div>
                  </div>

                  {/* Room Status Summary Pill Counters */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '4px',
                      marginBottom: '10px'
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#22c55e',
                        color: '#ffffff',
                        padding: '6px 2px',
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{vacantCount}</div>
                      <div style={{ fontSize: '9px', fontWeight: 600 }}>Vacant</div>
                    </div>
                    <div
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        padding: '6px 2px',
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{occupiedCount}</div>
                      <div style={{ fontSize: '9px', fontWeight: 600 }}>Occupied</div>
                    </div>
                    <div
                      style={{
                        backgroundColor: '#3b82f6',
                        color: '#ffffff',
                        padding: '6px 2px',
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{bookedCount}</div>
                      <div style={{ fontSize: '9px', fontWeight: 600 }}>Booked</div>
                    </div>
                    <div
                      style={{
                        backgroundColor: '#eab308',
                        color: '#000000',
                        padding: '6px 2px',
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{dirtyCount}</div>
                      <div style={{ fontSize: '9px', fontWeight: 700 }}>Dirty</div>
                    </div>
                  </div>

                  {/* 1-Column Vertically Stacked Mobile Action Tiles (Video 21 Frame 0138) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      {
                        title: 'Room Dashboard',
                        sub: 'Live Status, Tariffs & Guest Allocation',
                        color: '#2563eb',
                        icon: '🚪',
                        action: () => setActiveMobileView('rooms')
                      },
                      {
                        title: 'KOT Entry (Mobile Waiter)',
                        sub: 'Punch KOT on Phone for Rooms & Tables',
                        color: '#d97706',
                        icon: '🍲',
                        action: () => setActiveMobileView('kot')
                      },
                      {
                        title: 'Room Check In',
                        sub: 'Register Guest & Issue Key',
                        color: '#16a34a',
                        icon: '📝',
                        action: () => onOpenCheckIn?.()
                      },
                      {
                        title: 'Food Bills & Settle POS',
                        sub: 'Restaurant & Room Dining Invoices',
                        color: '#7c3aed',
                        icon: '🧾',
                        action: () => onOpenFoodBill?.()
                      },
                      {
                        title: 'Daily Sales & Day End Report',
                        sub: 'Audit Cash & Card Turnover',
                        color: '#0891b2',
                        icon: '📈',
                        action: () => setActiveMobileView('sales')
                      }
                    ].map(tile => (
                      <button
                        key={tile.title}
                        onClick={tile.action}
                        style={{
                          backgroundColor: '#ffffff',
                          border: `2px solid ${tile.color}`,
                          borderRadius: '8px',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          transition: 'transform 0.1s ease'
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: tile.color,
                            color: '#ffffff',
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            flexShrink: 0
                          }}
                        >
                          {tile.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                            {tile.title}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                            {tile.sub}
                          </div>
                        </div>
                        <span style={{ color: tile.color, fontSize: '16px', fontWeight: 800 }}>→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: Mobile 2-Column Room Dashboard (Exact Frame 0145) */}
              {activeMobileView === 'rooms' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                      Room Dashboard ({rooms.length})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {onOpenRoomDashboard && (
                        <button
                          onClick={onOpenRoomDashboard}
                          style={{
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          title="Open Full PMS Room Matrix"
                        >
                          ↗ Full PMS
                        </button>
                      )}
                      <button
                        onClick={() => setActiveMobileView('dashboard')}
                        style={{
                          backgroundColor: '#e2e8f0',
                          border: 'none',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ← Back
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Responsive Room Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px'
                    }}
                  >
                    {rooms.slice(0, 14).map(room => {
                      const bg =
                        room.status === 'vacant'
                          ? '#22c55e'
                          : room.status === 'occupied'
                          ? '#ef4444'
                          : room.status === 'booked'
                          ? '#3b82f6'
                          : '#eab308';
                      return (
                        <div
                          key={room.id}
                          style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '6px',
                            border: `2px solid ${bg}`,
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: bg,
                              color: room.status === 'dirty' ? '#000000' : '#ffffff',
                              padding: '4px 6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span style={{ fontSize: '12px', fontWeight: 800 }}>{room.roomNo}</span>
                            <span
                              style={{
                                fontSize: '9px',
                                textTransform: 'uppercase',
                                fontWeight: 700
                              }}
                            >
                              {room.status}
                            </span>
                          </div>

                          <div style={{ padding: '6px 8px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: '#334155' }}>
                              {room.roomType}
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                              ₹{room.tariff} / day
                            </div>
                            {room.currentGuest && (
                              <div
                                style={{
                                  fontSize: '9px',
                                  color: '#dc2626',
                                  fontWeight: 600,
                                  marginTop: '3px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                👤 {room.currentGuest.name}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: Fast Mobile KOT (Waiter on Phone) */}
              {activeMobileView === 'kot' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                      🍲 Mobile Waiter KOT Entry
                    </div>
                    {onOpenKotEntry && (
                      <button
                        onClick={onOpenKotEntry}
                        style={{
                          backgroundColor: '#f59e0b',
                          color: '#000000',
                          border: 'none',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Open Full Screen Restaurant POS"
                      >
                        ↗ Full POS
                      </button>
                    )}
                  </div>

                  {kotStatusMsg && (
                    <div
                      style={{
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #10b981',
                        color: '#065f46',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        marginBottom: '10px'
                      }}
                    >
                      {kotStatusMsg}
                    </div>
                  )}

                  <form
                    onSubmit={handleSimulateMobileKot}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>
                        Select Room or Table
                      </label>
                      <select
                        value={kotRoomOrTable}
                        onChange={e => setKotRoomOrTable(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      >
                        <option value="Room 101">Room 101 (Occupied)</option>
                        <option value="Room 102">Room 102 (Occupied)</option>
                        <option value="Table T-1">Table T-1 (Ground AC)</option>
                        <option value="Table T-2">Table T-2 (Garden)</option>
                        <option value="Table T-4">Table T-4 (Family Room)</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>
                        Menu Item
                      </label>
                      <select
                        value={selectedItem}
                        onChange={e => setSelectedItem(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      >
                        <option value="Veg Thali (Spl)">Veg Thali (Spl) - ₹250</option>
                        <option value="Paneer Butter Masala">Paneer Butter Masala - ₹220</option>
                        <option value="Butter Naan">Butter Naan - ₹45</option>
                        <option value="Jeera Rice">Jeera Rice - ₹130</option>
                        <option value="Mineral Water 1L">Mineral Water 1L - ₹20</option>
                        <option value="Masala Tea">Masala Tea - ₹25</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>
                        Quantity
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setKotQty(q => Math.max(1, q - 1))}
                          style={{
                            backgroundColor: '#e2e8f0',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '14px', fontWeight: 800, width: '30px', textAlign: 'center' }}>
                          {kotQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setKotQty(q => q + 1)}
                          style={{
                            backgroundColor: '#e2e8f0',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        backgroundColor: '#f59e0b',
                        color: '#000000',
                        border: 'none',
                        padding: '10px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      🚀 Send KOT to Kitchen
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 4: Daily Sales & Night Audit (Owner View) */}
              {activeMobileView === 'sales' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                    📊 Owner Daily Audit & Turnover
                  </div>

                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Room Tariff Collected</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>₹38,500</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Restaurant & Room F&B</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>₹14,280</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Advance Received (Online)</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>₹9,000</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderTop: '2px solid #e2e8f0',
                        paddingTop: '8px',
                        marginTop: '4px'
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b' }}>Total Gross Turnover</span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#16a34a' }}>₹61,780</span>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '10px',
                      backgroundColor: '#eff6ff',
                      borderRadius: '6px',
                      padding: '10px',
                      border: '1px solid #bfdbfe',
                      fontSize: '11px',
                      color: '#1e40af'
                    }}
                  >
                    <strong>💡 Cloud Live Sync:</strong> Data updates in real time on the owner's phone as check-ins, check-outs, and food orders are entered at the reception or restaurant.
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Home Bar */}
            {device !== 'desktop' && orientation === 'portrait' && (
              <div
                style={{
                  height: '16px',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div
                  style={{
                    width: '120px',
                    height: '4px',
                    backgroundColor: '#cbd5e1',
                    borderRadius: '2px'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div
          style={{
            backgroundColor: '#1e293b',
            borderTop: '1px solid #334155',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#94a3b8'
          }}
        >
          <div>
            Multi-Device Responsive Architecture: Runs on <strong>Mobile, Tablet, Laptop, and Desktop PC</strong> with simultaneous multi-user synchronization.
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
