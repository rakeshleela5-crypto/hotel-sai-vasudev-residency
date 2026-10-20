import React, { useState, useMemo } from 'react';
import type { PmsRoom, PmsBooking, PmsFolioSummary } from '../../types/pmsModels';
import { PmsStore, usePmsSync } from '../../services/pmsStore';
import { NewRoomBookingModal } from './NewRoomBookingModal';
import { NewRoomCheckInModal } from './NewRoomCheckInModal';
import { BookingReceiptModal } from './BookingReceiptModal';
import { KotEntryModal } from './KotEntryModal';
import { FoodBillModal } from './FoodBillModal';
import { RoomCheckOutModal } from './RoomCheckOutModal';
import { MarkDirtyModal } from './MarkDirtyModal';
import { RoomShiftModal } from './RoomShiftModal';
import { HousekeepingTrackerModal } from './HousekeepingTrackerModal';
import { PettyExpenseModal } from './PettyExpenseModal';

interface RoomDashboardModalProps {
  onSwitchToHomeHub?: () => void;
  onOpenCalendar?: () => void;
}

export const RoomDashboardModal: React.FC<RoomDashboardModalProps> = ({
  onSwitchToHomeHub: _onSwitchToHomeHub,
  onOpenCalendar: _onOpenCalendar
}) => {
  usePmsSync();
  const rooms = PmsStore.getRooms();

  // Filters & Search
  const [floorFilter, setFloorFilter] = useState<'all' | '1' | '2' | '3'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'vacant' | 'occupied' | 'booked' | 'dirty' | 'blocked'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Slide-Over Action Drawer State
  const [selectedDrawerRoomNo, setSelectedDrawerRoomNo] = useState<string | null>(null);

  // In-Drawer Sub-Actions State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer'>('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountVal, setDiscountVal] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  const [newExtendCheckOutDate, setNewExtendCheckOutDate] = useState('');
  const [isExtendingStay, setIsExtendingStay] = useState(false);

  const [maintenanceIssueText, setMaintenanceIssueText] = useState('');
  const [isBlockingMaintenance, setIsBlockingMaintenance] = useState(false);

  const [proformaOpen, setProformaOpen] = useState(false);

  // Submodals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<PmsRoom | null>(null);

  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [selectedRoomForCheckIn, setSelectedRoomForCheckIn] = useState<PmsRoom | null>(null);

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [latestBooking, setLatestBooking] = useState<PmsBooking | null>(null);

  const [isKotOpen, setIsKotOpen] = useState(false);
  const [selectedRoomForKot, setSelectedRoomForKot] = useState<PmsRoom | null>(null);

  const [isFoodBillOpen, setIsFoodBillOpen] = useState(false);
  const [selectedRoomForFoodBill, setSelectedRoomForFoodBill] = useState<PmsRoom | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedRoomForCheckout, setSelectedRoomForCheckout] = useState<PmsRoom | null>(null);

  const [isDirtyModalOpen, setIsDirtyModalOpen] = useState(false);
  const [isRoomShiftOpen, setIsRoomShiftOpen] = useState(false);
  const [selectedRoomForShift, setSelectedRoomForShift] = useState<string | undefined>(undefined);

  const [isHousekeepingOpen, setIsHousekeepingOpen] = useState(false);
  const [isPettyExpenseOpen, setIsPettyExpenseOpen] = useState(false);

  // Counts across all 16 rooms
  const vacantCleanCount = rooms.filter(r => r.status === 'vacant').length;
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const reservedCount = rooms.filter(r => r.status === 'booked').length;
  const dirtyCount = rooms.filter(r => r.status === 'dirty').length;
  const maintenanceCount = rooms.filter(r => r.status === 'blocked').length;

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      // Floor filter
      if (floorFilter !== 'all' && String(r.floor) !== floorFilter) return false;
      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      // Search query (room #, guest name, phone, room type)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRoomNo = r.roomNo.toLowerCase().includes(q);
        const matchGuest = r.currentGuest?.name.toLowerCase().includes(q) || false;
        const matchPhone = r.currentGuest?.phone.toLowerCase().includes(q) || false;
        const matchType = r.roomType.toLowerCase().includes(q);
        if (!matchRoomNo && !matchGuest && !matchPhone && !matchType) return false;
      }
      return true;
    });
  }, [rooms, floorFilter, statusFilter, searchQuery]);

  // Selected Drawer Room and Folio Summary
  const drawerRoom = useMemo(() => {
    if (!selectedDrawerRoomNo) return null;
    return rooms.find(r => r.roomNo === selectedDrawerRoomNo) || null;
  }, [rooms, selectedDrawerRoomNo]);

  const folioSummary: PmsFolioSummary | null = useMemo(() => {
    if (!selectedDrawerRoomNo) return null;
    return PmsStore.getFolioSummary(selectedDrawerRoomNo);
  }, [selectedDrawerRoomNo, rooms]);

  // Reset to Demo Seed Data
  const handleResetToDemoSeed = () => {
    if (window.confirm('⚠️ Are you sure you want to reset Hotel Sai Vasudev Residency to authentic Demo Seed Data?\n\nThis will re-initialize all 16 rooms, bookings, restaurant menu, housekeeping records, and financial ledger.')) {
      PmsStore.resetToDemoSeedData();
      setSelectedDrawerRoomNo(null);
      alert('✓ Data reset to demo seed inventory (16 rooms) successfully!');
    }
  };

  // Actions inside Drawer
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerRoom) return;
    const num = parseFloat(paymentAmount);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    PmsStore.recordFolioPayment(drawerRoom.roomNo, {
      amount: num,
      paymentMode,
      referenceNo: paymentRef.trim() || undefined,
      notes: paymentNote.trim() || undefined
    });
    setPaymentAmount('');
    setPaymentRef('');
    setPaymentNote('');
    setIsRecordingPayment(false);
  };

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerRoom) return;
    const val = parseFloat(discountVal);
    if (isNaN(val) || val <= 0) {
      alert('Please enter a valid discount value.');
      return;
    }
    if (!discountReason.trim()) {
      alert('A reason note is mandatory when applying a discount.');
      return;
    }
    PmsStore.applyFolioDiscount(drawerRoom.roomNo, {
      type: discountType,
      value: val,
      reason: discountReason.trim()
    });
    setDiscountVal('');
    setDiscountReason('');
    setIsApplyingDiscount(false);
  };

  const handleExtendStaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerRoom || !newExtendCheckOutDate) return;
    const res = PmsStore.extendStay(drawerRoom.roomNo, newExtendCheckOutDate);
    if (res.success) {
      setIsExtendingStay(false);
      setNewExtendCheckOutDate('');
    } else {
      alert(res.message);
    }
  };

  const handleSaveMaintenanceBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerRoom) return;
    const issue = maintenanceIssueText.trim() || 'General Maintenance Inspection';
    PmsStore.updateHousekeepingStatus(drawerRoom.roomNo, 'Under Maintenance', undefined, undefined, issue);
    setIsBlockingMaintenance(false);
    setMaintenanceIssueText('');
  };

  const handleCheckInReservedGuest = () => {
    if (!drawerRoom || !drawerRoom.currentGuest?.bookingNo) return;
    const res = PmsStore.checkInBooking(drawerRoom.currentGuest.bookingNo);
    alert(res.message);
  };

  const handleCancelBooking = () => {
    if (!drawerRoom || !drawerRoom.currentGuest?.bookingNo) return;
    if (window.confirm(`Cancel reservation for ${drawerRoom.currentGuest.name}?`)) {
      PmsStore.deleteBooking(drawerRoom.currentGuest.bookingNo);
      PmsStore.updateRoomStatus(drawerRoom.roomNo, 'vacant', undefined);
      setSelectedDrawerRoomNo(null);
    }
  };

  return (
    <div className="pms-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Top Status & Filter Ribbon */}
      <div className="room-status-bar" style={{ padding: '10px 14px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        
        {/* Floor Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Floor:</span>
          {(['all', '1', '2', '3'] as const).map(fl => (
            <button
              key={fl}
              type="button"
              className={`status-btn ${floorFilter === fl ? 'active' : ''}`}
              style={{
                padding: '4px 9px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '5px',
                background: floorFilter === fl ? '#1e293b' : '#f1f5f9',
                color: floorFilter === fl ? '#ffffff' : '#334155',
                border: '1px solid #cbd5e1',
                cursor: 'pointer'
              }}
              onClick={() => setFloorFilter(fl)}
            >
              {fl === 'all' ? 'All (16 Rooms)' : `Floor ${fl}`}
            </button>
          ))}
        </div>

        {/* Status Filter Badges */}
        <div className="status-pills-group" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`status-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
            style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px' }}
          >
            All Statuses ({rooms.length})
          </button>
          <button
            type="button"
            className={`status-btn btn-vacant ${statusFilter === 'vacant' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'vacant' ? 'all' : 'vacant')}
            style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', background: statusFilter === 'vacant' ? '#059669' : '#dcfce7', color: statusFilter === 'vacant' ? '#ffffff' : '#15803d' }}
          >
            🟢 Vacant Clean ({vacantCleanCount})
          </button>
          <button
            type="button"
            className={`status-btn btn-check ${statusFilter === 'occupied' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'occupied' ? 'all' : 'occupied')}
            style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', background: statusFilter === 'occupied' ? '#2563eb' : '#dbeafe', color: statusFilter === 'occupied' ? '#ffffff' : '#1d4ed8' }}
          >
            🔵 Occupied ({occupiedCount})
          </button>
          <button
            type="button"
            className={`status-btn btn-booked ${statusFilter === 'booked' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'booked' ? 'all' : 'booked')}
            style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', background: statusFilter === 'booked' ? '#d97706' : '#fef3c7', color: statusFilter === 'booked' ? '#ffffff' : '#b45309' }}
          >
            🟡 Reserved ({reservedCount})
          </button>
          <button
            type="button"
            className={`status-btn btn-dirty ${statusFilter === 'dirty' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'dirty' ? 'all' : 'dirty')}
            style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', background: statusFilter === 'dirty' ? '#dc2626' : '#fee2e2', color: statusFilter === 'dirty' ? '#ffffff' : '#b91c1c' }}
          >
            🔴 Vacant Dirty ({dirtyCount})
          </button>
          <button
            type="button"
            className={`status-btn ${statusFilter === 'blocked' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'blocked' ? 'all' : 'blocked')}
            style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', background: statusFilter === 'blocked' ? '#475569' : '#f1f5f9', color: statusFilter === 'blocked' ? '#ffffff' : '#334155', border: '1px solid #cbd5e1' }}
          >
            ⚙️ Maintenance ({maintenanceCount})
          </button>
        </div>

        {/* Live Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="text"
            placeholder="🔍 Search Room #, Guest, Phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              width: '180px'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: '#94a3b8' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick ERP Navigation & Reset Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setIsHousekeepingOpen(true)}
            style={{
              background: '#065f46',
              color: '#ffffff',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Open Housekeeping Kanban Tracker"
          >
            🧹 Housekeeping
          </button>

          <button
            type="button"
            onClick={() => setIsPettyExpenseOpen(true)}
            style={{
              background: '#1e293b',
              color: '#ffffff',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Open Petty Cash Expenses & Night Audit"
          >
            💰 Petty Cash &amp; Audit
          </button>

          <button
            type="button"
            onClick={handleResetToDemoSeed}
            style={{
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Reset All 16 Rooms, Bookings & Folios to Demo Seed Data"
          >
            ↺ Reset Seed
          </button>
        </div>
      </div>

      {/* Main Room Rack Interactive Grid */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {filteredRooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <h3>No rooms matched the selected criteria.</h3>
            <button
              type="button"
              onClick={() => { setFloorFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}
              style={{ marginTop: '10px', padding: '6px 14px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="room-matrix-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {filteredRooms.map(room => {
              const isOccupied = room.status === 'occupied';
              const isBooked = room.status === 'booked';
              const isDirty = room.status === 'dirty';
              const isBlocked = room.status === 'blocked';
              const isVacant = room.status === 'vacant';

              const folio = isOccupied ? PmsStore.getFolioSummary(room.roomNo) : null;

              // Border and Badge Color
              let borderColor = '#059669'; // Emerald Green
              let statusLabel = 'Vacant Clean';
              let badgeBg = '#dcfce7';
              let badgeColor = '#15803d';

              if (isOccupied) {
                borderColor = '#2563eb'; // Royal Blue
                statusLabel = 'Occupied';
                badgeBg = '#dbeafe';
                badgeColor = '#1d4ed8';
              } else if (isBooked) {
                borderColor = '#d97706'; // Amber
                statusLabel = 'Reserved / Arriving';
                badgeBg = '#fef3c7';
                badgeColor = '#b45309';
              } else if (isDirty) {
                borderColor = '#dc2626'; // Crimson Red
                statusLabel = 'Vacant Dirty';
                badgeBg = '#fee2e2';
                badgeColor = '#b91c1c';
              } else if (isBlocked) {
                borderColor = '#475569'; // Slate Grey
                statusLabel = 'Under Maintenance';
                badgeBg = '#f1f5f9';
                badgeColor = '#334155';
              }

              const isSelected = selectedDrawerRoomNo === room.roomNo;

              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedDrawerRoomNo(room.roomNo)}
                  style={{
                    background: '#ffffff',
                    border: `2px solid ${isSelected ? '#f59e0b' : borderColor}`,
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 0 3px rgba(245, 158, 11, 0.4)' : '0 2px 5px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '145px'
                  }}
                  title="Click to open Room Action Drawer"
                >
                  {/* Card Header */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 900, color: '#1e293b' }}>
                          Room {room.roomNo}
                        </span>
                        <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                          Floor {room.floor}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', background: badgeBg, color: badgeColor, padding: '2px 7px', borderRadius: '4px', fontWeight: 800 }}>
                        {statusLabel}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', fontWeight: 600 }}>
                      {room.roomType} &bull; ₹{room.tariff.toLocaleString('en-IN')}/nt
                    </div>

                    {/* Guest Information */}
                    {isOccupied && room.currentGuest && (
                      <div style={{ marginTop: '8px', background: '#eff6ff', padding: '6px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid #bfdbfe' }}>
                        <div style={{ fontWeight: 800, color: '#1e40af' }}>
                          👤 {room.currentGuest.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#3b82f6', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                          <span>Out: {room.currentGuest.checkOutDate}</span>
                          <span>Ph: {room.currentGuest.phone}</span>
                        </div>
                        {folio && (
                          <div style={{ marginTop: '4px', fontWeight: 800, color: folio.balanceDue > 0 ? '#dc2626' : '#059669', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Balance Due:</span>
                            <span>₹{folio.balanceDue.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {isBooked && room.currentGuest && (
                      <div style={{ marginTop: '8px', background: '#fffbeb', padding: '6px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid #fde68a' }}>
                        <div style={{ fontWeight: 800, color: '#92400e' }}>
                          📅 {room.currentGuest.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px' }}>
                          In: {room.currentGuest.checkInDate} &bull; Adv: ₹{room.currentGuest.advancePaid || 0}
                        </div>
                      </div>
                    )}

                    {isDirty && (
                      <div style={{ marginTop: '8px', background: '#fef2f2', padding: '6px 8px', borderRadius: '6px', fontSize: '11px', color: '#991b1b', border: '1px solid #fecaca' }}>
                        🧹 Needs Housekeeping &amp; Linen Change (Attendant: {room.assignedStaff || 'Ramesh'})
                      </div>
                    )}

                    {isBlocked && (
                      <div style={{ marginTop: '8px', background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', fontSize: '11px', color: '#475569', border: '1px solid #cbd5e1' }}>
                        ⚙️ {room.maintenanceIssue || 'Blocked for Maintenance'}
                      </div>
                    )}

                    {isVacant && (
                      <div style={{ marginTop: '8px', background: '#f0fdf4', padding: '6px 8px', borderRadius: '6px', fontSize: '11px', color: '#166534', border: '1px solid #bbf7d0' }}>
                        ✨ Ready for Walk-In or Online Check-In ({room.bedType})
                      </div>
                    )}
                  </div>

                  {/* Micro action prompt */}
                  <div style={{ marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
                    <span>{room.bedType}</span>
                    <span style={{ color: '#0284c7', fontWeight: 700 }}>Open Actions ➔</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SLIDE-OVER ACTION DRAWER (Section 2 - Module 2 Requirements)               */}
      {/* ========================================================================= */}
      {drawerRoom && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '460px',
            maxWidth: '100%',
            background: '#ffffff',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
            borderLeft: '1px solid #cbd5e1',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Drawer Header */}
          <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Room {drawerRoom.roomNo}</h3>
                <span style={{ background: '#f59e0b', color: '#000000', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>
                  Floor {drawerRoom.floor}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.9 }}>
                {drawerRoom.roomType} &bull; ₹{drawerRoom.tariff.toLocaleString('en-IN')}/night &bull; Max {drawerRoom.maxGuests} Guests
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDrawerRoomNo(null)}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '24px', cursor: 'pointer' }}
            >
              &times;
            </button>
          </div>

          {/* Drawer Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {/* Status Strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Operational Status:</span>
              <span style={{
                padding: '3px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 800,
                background: drawerRoom.status === 'occupied' ? '#dbeafe' : drawerRoom.status === 'vacant' ? '#dcfce7' : drawerRoom.status === 'dirty' ? '#fee2e2' : drawerRoom.status === 'booked' ? '#fef3c7' : '#f1f5f9',
                color: drawerRoom.status === 'occupied' ? '#1d4ed8' : drawerRoom.status === 'vacant' ? '#15803d' : drawerRoom.status === 'dirty' ? '#b91c1c' : drawerRoom.status === 'booked' ? '#b45309' : '#334155'
              }}>
                {drawerRoom.status.toUpperCase()}
              </span>
            </div>

            {/* IF OCCUPIED: Show Full Guest KYC & Live Folio Breakdown */}
            {drawerRoom.status === 'occupied' && folioSummary && (
              <div>
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Guest KYC &amp; Stay Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div><strong>Name:</strong> {folioSummary.guestName}</div>
                    <div><strong>Phone:</strong> {folioSummary.guestPhone}</div>
                    <div><strong>Check-In:</strong> {folioSummary.checkInDate}</div>
                    <div><strong>Check-Out:</strong> {folioSummary.checkOutDate}</div>
                    <div><strong>Nights:</strong> {folioSummary.nights} Night(s)</div>
                    <div><strong>Darshan:</strong> {folioSummary.darshanSlot || 'General Darshan'}</div>
                    {folioSummary.vehicleNo && <div><strong>Vehicle:</strong> {folioSummary.vehicleNo}</div>}
                    {folioSummary.idProofType && <div><strong>ID:</strong> {folioSummary.idProofType} ({folioSummary.idProofNumber || 'Verified'})</div>}
                    {folioSummary.companyName && <div><strong>Company:</strong> {folioSummary.companyName}</div>}
                    {folioSummary.gstin && <div><strong>GSTIN:</strong> {folioSummary.gstin}</div>}
                  </div>
                </div>

                {/* Segregated GST Folio Summary Table */}
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase' }}>
                      Live Folio Summary (Segregated GST)
                    </div>
                    <button
                      type="button"
                      onClick={() => setProformaOpen(!proformaOpen)}
                      style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      📄 Proforma Slip
                    </button>
                  </div>

                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Room Stay ({folioSummary.nights} nt @ ₹{folioSummary.perNightTariff}):</span>
                      <span>₹{folioSummary.baseRoomRent.toLocaleString('en-IN')}</span>
                    </div>

                    {folioSummary.extraGuestsTotal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>Extra Mattress / Guest ({folioSummary.extraGuestsCount} pax):</span>
                        <span>₹{folioSummary.extraGuestsTotal.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '11px' }}>
                      <span>Room GST (SAC 996311 - {folioSummary.roomGstRate}%):</span>
                      <span>₹{folioSummary.roomTaxTotal.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Vasudev Rasoi Food Orders */}
                    <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '6px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                        <span>Vasudev Rasoi Food Charges:</span>
                        <span>₹{folioSummary.foodTaxable.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '11px' }}>
                        <span>Restaurant GST (SAC 996331 - 5%):</span>
                        <span>₹{folioSummary.foodTaxTotal.toLocaleString('en-IN')}</span>
                      </div>
                      {folioSummary.foodItems.length > 0 && (
                        <div style={{ marginTop: '4px', background: '#f8fafc', padding: '4px 6px', borderRadius: '4px', fontSize: '10px' }}>
                          {folioSummary.foodItems.map((fi, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>&bull; {fi.kotNo}: {fi.description}</span>
                              <span>₹{fi.amount}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Discount & Advance Payments */}
                    {folioSummary.discount && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 700 }}>
                        <span>Discount ({folioSummary.discount.reason}):</span>
                        <span>-₹{folioSummary.discount.amount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '6px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '13px' }}>
                      <span>Gross Bill Amount:</span>
                      <span>₹{folioSummary.grandTotal.toLocaleString('en-IN')}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                      <span>Total Paid (Advance + Records):</span>
                      <span>₹{folioSummary.totalPaid.toLocaleString('en-IN')}</span>
                    </div>

                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <strong style={{ color: '#b91c1c', fontSize: '14px' }}>Balance Due:</strong>
                      <strong style={{ color: '#b91c1c', fontSize: '16px' }}>₹{folioSummary.balanceDue.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>

                {/* Sub-Action Forms: Payment, Discount, Extend Stay */}
                {isRecordingPayment && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 800, color: '#1e40af' }}>Record Split / Partial Payment</h4>
                    <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <input
                          type="number"
                          placeholder="Amount (₹)"
                          required
                          value={paymentAmount}
                          onChange={e => setPaymentAmount(e.target.value)}
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700 }}
                        />
                        <select
                          value={paymentMode}
                          onChange={e => setPaymentMode(e.target.value as any)}
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        >
                          <option value="UPI">UPI (PhonePe / GPay)</option>
                          <option value="Cash">Cash at Counter</option>
                          <option value="Card">Debit / Credit Card</option>
                          <option value="Bank Transfer">Bank Transfer / NEFT</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Ref / Transaction # (e.g. UPI/8921)"
                        value={paymentRef}
                        onChange={e => setPaymentRef(e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button type="button" onClick={() => setIsRecordingPayment(false)} style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Cancel</button>
                        <button type="submit" style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '4px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 700 }}>Save Payment</button>
                      </div>
                    </form>
                  </div>
                )}

                {isApplyingDiscount && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 800, color: '#166534' }}>Apply Tariff Discount</h4>
                    <form onSubmit={handleApplyDiscount} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <select
                          value={discountType}
                          onChange={e => setDiscountType(e.target.value as any)}
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        >
                          <option value="flat">Flat ₹ Discount</option>
                          <option value="percent">Percentage (%)</option>
                        </select>
                        <input
                          type="number"
                          placeholder={discountType === 'flat' ? 'Amount (₹)' : 'Percent (%)'}
                          required
                          value={discountVal}
                          onChange={e => setDiscountVal(e.target.value)}
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Mandatory Reason Note (e.g. Pilgrimage Group Concession)"
                        required
                        value={discountReason}
                        onChange={e => setDiscountReason(e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button type="button" onClick={() => setIsApplyingDiscount(false)} style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Cancel</button>
                        <button type="submit" style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '4px', border: 'none', background: '#16a34a', color: '#ffffff', fontWeight: 700 }}>Apply Discount</button>
                      </div>
                    </form>
                  </div>
                )}

                {isExtendingStay && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 800, color: '#92400e' }}>Extend Stay (New Check-Out Date)</h4>
                    <form onSubmit={handleExtendStaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="date"
                        required
                        value={newExtendCheckOutDate}
                        onChange={e => setNewExtendCheckOutDate(e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button type="button" onClick={() => setIsExtendingStay(false)} style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Cancel</button>
                        <button type="submit" style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '4px', border: 'none', background: '#d97706', color: '#ffffff', fontWeight: 700 }}>Update Stay</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* OCCUPIED BUTTON ACTIONS GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoomForKot(drawerRoom);
                      setIsKotOpen(true);
                    }}
                    style={{ padding: '9px 10px', background: '#d97706', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    🍴 Add Room Service (KOT)
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRecordingPayment(!isRecordingPayment)}
                    style={{ padding: '9px 10px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    💳 Record Payment (UPI/Cash)
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsApplyingDiscount(!isApplyingDiscount)}
                    style={{ padding: '9px 10px', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    🏷️ Apply Discount
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExtendingStay(!isExtendingStay)}
                    style={{ padding: '9px 10px', background: '#475569', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    📅 Extend Stay
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoomForShift(drawerRoom.roomNo);
                      setIsRoomShiftOpen(true);
                    }}
                    style={{ padding: '9px 10px', background: '#7c3aed', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    🔄 Room Transfer (Shift)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoomForFoodBill(drawerRoom);
                      setIsFoodBillOpen(true);
                    }}
                    style={{ padding: '9px 10px', background: '#ea580c', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    🧾 Add POS Food Bill
                  </button>

                  <button
                    type="button"
                    onClick={() => setProformaOpen(true)}
                    style={{ padding: '9px 10px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', gridColumn: 'span 2' }}
                  >
                    🖨️ View &amp; Print Proforma Bill
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoomForCheckout(drawerRoom);
                      setIsCheckoutOpen(true);
                    }}
                    style={{ padding: '9px 10px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', gridColumn: 'span 2' }}
                  >
                    🚪 Proceed to Check-Out &bull; GST Invoice
                  </button>
                </div>
              </div>
            )}

            {/* IF VACANT CLEAN: Walk-In Check In, Create Reservation, Mark Dirty, Block Maintenance */}
            {drawerRoom.status === 'vacant' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: '#166534' }}>🟢 Vacant Clean &amp; Ready</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#15803d' }}>
                    This room is fully sanitized, inspected, and available for immediate guest walk-in or advance booking.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoomForCheckIn(drawerRoom);
                    setIsCheckInOpen(true);
                  }}
                  style={{ padding: '12px', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                >
                  🛏️ Walk-In Check-In Guest Now
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRoomForBooking(drawerRoom);
                    setIsBookingOpen(true);
                  }}
                  style={{ padding: '12px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                >
                  📅 Create Advance Reservation
                </button>

                <button
                  type="button"
                  onClick={() => {
                    PmsStore.updateHousekeepingStatus(drawerRoom.roomNo, 'Vacant Dirty');
                  }}
                  style={{ padding: '10px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  🧹 Mark Vacant Dirty (Send to Housekeeping)
                </button>

                <button
                  type="button"
                  onClick={() => setIsBlockingMaintenance(!isBlockingMaintenance)}
                  style={{ padding: '10px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  🛠️ Block for Maintenance (OOO)
                </button>

                {isBlockingMaintenance && (
                  <form onSubmit={handleSaveMaintenanceBlock} style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700 }}>Maintenance Issue:</label>
                    <input
                      type="text"
                      placeholder="e.g. Geyser coil replacement"
                      value={maintenanceIssueText}
                      onChange={e => setMaintenanceIssueText(e.target.value)}
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      required
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button type="button" onClick={() => setIsBlockingMaintenance(false)} style={{ padding: '4px 8px', fontSize: '11px' }}>Cancel</button>
                      <button type="submit" style={{ padding: '4px 12px', fontSize: '11px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '4px' }}>Confirm Block</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* IF VACANT DIRTY: Assign Housekeeping & Mark Clean */}
            {drawerRoom.status === 'dirty' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: '#b91c1c' }}>🔴 Vacant Dirty &bull; Housekeeping Required</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#991b1b' }}>
                    Guest checked out. Clean linen, mop, sanitization, and toilet inspection required before next check-in.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    PmsStore.updateHousekeepingStatus(drawerRoom.roomNo, 'Vacant Clean');
                    alert(`Room ${drawerRoom.roomNo} marked as Vacant Clean! It is now unlocked for Front Desk Check-In.`);
                  }}
                  style={{ padding: '12px', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                >
                  ✨ Assign Housekeeping &amp; Mark Vacant Clean
                </button>

                <button
                  type="button"
                  onClick={() => {
                    PmsStore.updateHousekeepingStatus(drawerRoom.roomNo, 'Cleaning In Progress');
                  }}
                  style={{ padding: '10px', background: '#d97706', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  ▶ Start Cleaning in Progress
                </button>
              </div>
            )}

            {/* IF UNDER MAINTENANCE: Resolve Maintenance */}
            {drawerRoom.status === 'blocked' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: '#334155' }}>⚙️ Room Under Maintenance (Out of Order)</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#dc2626', fontWeight: 700 }}>
                    Issue: {drawerRoom.maintenanceIssue || 'Inspection & Repairs Underway'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    PmsStore.resolveMaintenance(drawerRoom.roomNo);
                    alert(`Maintenance resolved for Room ${drawerRoom.roomNo}! Restored to Vacant Dirty for housekeeping.`);
                  }}
                  style={{ padding: '12px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                >
                  🔧 Resolve Maintenance &amp; Restore to Vacant Dirty
                </button>
              </div>
            )}

            {/* IF RESERVED / BOOKED: Check-In Guest Now, Cancel */}
            {drawerRoom.status === 'booked' && drawerRoom.currentGuest && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: '#92400e' }}>🟡 Advance Booking / Arriving Guest</h4>
                  <div style={{ fontSize: '12px', color: '#78350f' }}>
                    <div><strong>Guest:</strong> {drawerRoom.currentGuest.name}</div>
                    <div><strong>Phone:</strong> {drawerRoom.currentGuest.phone}</div>
                    <div><strong>Check-In Date:</strong> {drawerRoom.currentGuest.checkInDate}</div>
                    <div><strong>Booking Ref:</strong> {drawerRoom.currentGuest.bookingNo}</div>
                    <div><strong>Advance Paid:</strong> ₹{drawerRoom.currentGuest.advancePaid || 0}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckInReservedGuest}
                  style={{ padding: '12px', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                >
                  🔑 Check-In Guest Now (Open Folio)
                </button>

                <button
                  type="button"
                  onClick={handleCancelBooking}
                  style={{ padding: '10px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  ✕ Cancel Booking &amp; Release Room
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proforma Bill Modal */}
      {proformaOpen && folioSummary && (
        <div className="pms-modal-backdrop" style={{ zIndex: 12500 }}>
          <div className="pms-modal-window" style={{ maxWidth: '600px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '8px', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>HOTEL SAI VASUDEV RESIDENCY</h3>
                <small style={{ fontSize: '11px', color: '#64748b' }}>Near Sai Baba Temple, Shirdi &bull; GSTIN: 27ABCDE1234F1Z5</small>
              </div>
              <button type="button" onClick={() => setProformaOpen(false)} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '14px', marginBottom: '10px', textDecoration: 'underline' }}>
              PROFORMA GUEST FOLIO BILL
            </div>

            <div style={{ fontSize: '12px', marginBottom: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <div>Guest: <strong>{folioSummary.guestName}</strong></div>
              <div>Room: <strong>{folioSummary.roomNo} ({folioSummary.roomType})</strong></div>
              <div>In: <strong>{folioSummary.checkInDate}</strong></div>
              <div>Out: <strong>{folioSummary.checkOutDate}</strong></div>
            </div>

            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginBottom: '10px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '6px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '6px', textAlign: 'center' }}>SAC</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '6px' }}>Room Rent ({folioSummary.nights} Nights @ ₹{folioSummary.perNightTariff})</td>
                  <td style={{ padding: '6px', textAlign: 'center' }}>996311</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>₹{folioSummary.baseRoomRent}</td>
                </tr>
                {folioSummary.extraGuestsTotal > 0 && (
                  <tr>
                    <td style={{ padding: '6px' }}>Extra Guest / Mattress Charge</td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>996311</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>₹{folioSummary.extraGuestsTotal}</td>
                  </tr>
                )}
                {folioSummary.foodTaxable > 0 && (
                  <tr>
                    <td style={{ padding: '6px' }}>Vasudev Rasoi Food Orders</td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>996331</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>₹{folioSummary.foodTaxable}</td>
                  </tr>
                )}
                <tr style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px' }}>Room GST (CGST + SGST - {folioSummary.roomGstRate}%)</td>
                  <td style={{ padding: '6px', textAlign: 'center' }}>996311</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>₹{folioSummary.roomTaxTotal}</td>
                </tr>
                {folioSummary.foodTaxTotal > 0 && (
                  <tr>
                    <td style={{ padding: '6px' }}>Restaurant GST (CGST 2.5% + SGST 2.5% - 5%)</td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>996331</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>₹{folioSummary.foodTaxTotal}</td>
                  </tr>
                )}
                <tr style={{ borderTop: '2px solid #0f172a', fontWeight: 800 }}>
                  <td style={{ padding: '6px' }}>Total Amount</td>
                  <td></td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>₹{folioSummary.grandTotal}</td>
                </tr>
                <tr style={{ color: '#059669', fontWeight: 700 }}>
                  <td style={{ padding: '6px' }}>Advance Paid / Credits</td>
                  <td></td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>-₹{folioSummary.totalPaid}</td>
                </tr>
                <tr style={{ color: '#dc2626', fontWeight: 900, fontSize: '13px', background: '#fee2e2' }}>
                  <td style={{ padding: '6px' }}>Net Balance Due</td>
                  <td></td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>₹{folioSummary.balanceDue}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => window.print()} style={{ padding: '6px 14px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}>
                🖨️ Print Proforma Bill
              </button>
              <button type="button" onClick={() => setProformaOpen(false)} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submodals Mounted */}
      <NewRoomBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedRoom={selectedRoomForBooking}
        onBookingCreated={(b) => {
          setIsBookingOpen(false);
          setLatestBooking(b);
          setIsReceiptOpen(true);
        }}
      />

      <NewRoomCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        preselectedRoom={selectedRoomForCheckIn}
        onCheckInCompleted={() => {
          setIsCheckInOpen(false);
        }}
      />

      <BookingReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        booking={latestBooking}
      />

      <KotEntryModal
        isOpen={isKotOpen}
        onClose={() => setIsKotOpen(false)}
        defaultRoomNo={selectedRoomForKot?.roomNo}
        onKotSaved={() => {}}
      />

      <FoodBillModal
        isOpen={isFoodBillOpen}
        onClose={() => setIsFoodBillOpen(false)}
        defaultRoomNo={selectedRoomForFoodBill?.roomNo}
        onBillSaved={() => {}}
      />

      <RoomCheckOutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        targetRoom={selectedRoomForCheckout}
        onCheckoutComplete={() => {
          alert('Room Checkout completed successfully! Final GST Invoice generated and room marked as Vacant Dirty.');
        }}
      />

      <MarkDirtyModal
        isOpen={isDirtyModalOpen}
        onClose={() => setIsDirtyModalOpen(false)}
        onStatusUpdated={() => {}}
      />

      <RoomShiftModal
        isOpen={isRoomShiftOpen}
        onClose={() => setIsRoomShiftOpen(false)}
        initialFromRoomNo={selectedRoomForShift}
        onShiftCompleted={() => {}}
      />

      {/* Housekeeping Modal */}
      <HousekeepingTrackerModal
        isOpen={isHousekeepingOpen}
        onClose={() => setIsHousekeepingOpen(false)}
      />

      {/* Petty Expense Modal */}
      <PettyExpenseModal
        isOpen={isPettyExpenseOpen}
        onClose={() => setIsPettyExpenseOpen(false)}
      />
    </div>
  );
};
