import React, { useState, useMemo, useEffect } from 'react';
import type { PmsRoom, PmsBooking, PmsFolioSummary } from '../../types/pmsModels';
import { PmsStore, usePmsSync } from '../../services/pmsStore';
import { useERPWebSocket } from '../../hooks/useERPWebSocket';
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
  const { isConnected: isWsConnected } = useERPWebSocket({ channel: 'front_desk' });
  const [conflictAlert, setConflictAlert] = useState<string | null>(null);

  useEffect(() => {
    const handleConflict = (e: any) => {
      const msg = e.detail?.message || 'Another staff member updated this record.';
      setConflictAlert(msg);
      setTimeout(() => setConflictAlert(null), 8000);
    };
    window.addEventListener('svr:conflict_detected', handleConflict);
    return () => window.removeEventListener('svr:conflict_detected', handleConflict);
  }, []);

  const rooms = PmsStore.getRooms();

  // Filters & Search
  const [floorFilter, setFloorFilter] = useState<'all' | '0' | '1'>('all');
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

  // Post Charge Sub-Action
  const [isPostingCharge, setIsPostingCharge] = useState(false);
  const [chargeName, setChargeName] = useState('Extra Bed / Mattress');
  const [chargeAmount, setChargeAmount] = useState('600');
  const [chargeSac, setChargeSac] = useState('996311');
  const [chargeGstPercent, setChargeGstPercent] = useState(12);

  // Split Folio Modal
  const [isSplitFolioOpen, setIsSplitFolioOpen] = useState(false);
  const [splitFolioA, setSplitFolioA] = useState<string[]>(['Room Accommodation (SAC 996311)']);
  const [splitFolioB, setSplitFolioB] = useState<string[]>(['Vasudev Rasoi Dining (SAC 996331)', 'Laundry & Extras (SAC 9997)']);

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

  // Counts & KPI Metrics across all 16 rooms (Module 1 Requirement)
  const totalRoomsCount = rooms.length;
  const vacantCleanCount = rooms.filter(r => r.status === 'vacant').length;
  const occupiedRoomsList = rooms.filter(r => r.status === 'occupied');
  const occupiedCount = occupiedRoomsList.length;
  const reservedCount = rooms.filter(r => r.status === 'booked').length;
  const dirtyCount = rooms.filter(r => r.status === 'dirty').length;
  const maintenanceCount = rooms.filter(r => r.status === 'blocked').length;
  const occupancyPercent = totalRoomsCount > 0 ? ((occupiedCount / totalRoomsCount) * 100).toFixed(1) : '0.0';

  // Live Today's Movements & Revenue metrics
  const todayIso = new Date().toISOString().split('T')[0];
  const dParts = todayIso.split('-');
  const todayDmy = `${dParts[2]}-${dParts[1]}-${dParts[0]}`;
  const bookings = PmsStore.getBookings();
  const todayArrivalsCount = bookings.filter(b => b.status === 'Confirmed' && (b.checkInDate === todayIso || b.checkInDate === todayDmy)).length;
  const todayDeparturesCount = occupiedRoomsList.filter(r => r.currentGuest?.checkOutDate === todayIso || r.currentGuest?.checkOutDate === todayDmy).length;

  const totalOccupiedTariff = occupiedRoomsList.reduce((sum, r) => sum + (r.tariff || 0), 0);
  const arr = occupiedCount > 0 ? Math.round(totalOccupiedTariff / occupiedCount) : 0;
  const revPar = totalRoomsCount > 0 ? Math.round(totalOccupiedTariff / totalRoomsCount) : 0;

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
    if (window.confirm('⚠️ Are you sure you want to reset SRI SAI VASUDEV RESIDENCY to authentic Demo Seed Data?\n\nThis will re-initialize all 18 rooms, bookings, restaurant menu, housekeeping records, and financial ledger.')) {
      PmsStore.resetToDemoSeedData();
      setSelectedDrawerRoomNo(null);
      alert('✓ Data reset to demo seed inventory (18 rooms) successfully!');
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

  const handleExportJson = () => {
    const json = PmsStore.exportDatabaseAsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SVR-ERP-Backup-${PmsStore.getBusinessDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const res = PmsStore.importDatabaseFromJson(content);
        alert(res.message);
      }
    };
    reader.readAsText(file);
  };

  const handlePostCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerRoom) return;
    const num = parseFloat(chargeAmount);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid charge amount.');
      return;
    }
    PmsStore.postChargeToRoom(drawerRoom.roomNo, {
      chargeName,
      amount: num,
      sacCode: chargeSac,
      gstPercent: chargeGstPercent
    });
    PmsStore.postJournalEntry({
      date: PmsStore.getBusinessDate(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      voucherType: 'RoomPosting',
      referenceNo: `CHG-${drawerRoom.roomNo}-${Date.now().toString().slice(-4)}`,
      narration: `Posted ${chargeName} (SAC ${chargeSac}) to Room ${drawerRoom.roomNo}`,
      debitAccount: 'In-House Guest Folio Receivable',
      creditAccount: chargeSac === '996311' ? 'Extra Bed & Early/Late Check-in Revenue' : 'Petty Cash / Housekeeping Expense',
      amountPaise: Math.round(num * 100),
      amountRupees: num,
      postedBy: 'Front Desk'
    });
    alert(`✓ Successfully posted ₹${num} for ${chargeName} (SAC ${chargeSac}) to Room ${drawerRoom.roomNo} Folio!`);
    setIsPostingCharge(false);
    setChargeAmount('');
  };

  return (
    <div className="pms-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Module 1: Live Calculation KPI Ribbon */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '12px 16px',
        borderBottom: '1px solid #334155',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px',
        alignItems: 'center'
      }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Total Rooms</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#f8fafc', marginTop: '2px' }}>{totalRoomsCount}</div>
          <div style={{ fontSize: '10px', color: '#38bdf8' }}>SRI SAI VASUDEV RESIDENCY</div>
        </div>

        <div style={{ background: 'rgba(37,99,235,0.15)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(59,130,246,0.3)' }}>
          <div style={{ fontSize: '10px', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 800 }}>Occupancy</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#60a5fa', marginTop: '2px' }}>{occupiedCount} ({occupancyPercent}%)</div>
          <div style={{ fontSize: '10px', color: '#bfdbfe' }}>Active In-House Stays</div>
        </div>

        <div style={{ background: 'rgba(16,185,129,0.15)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.3)' }}>
          <div style={{ fontSize: '10px', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 800 }}>Vacant Clean</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#34d399', marginTop: '2px' }}>{vacantCleanCount} Rooms</div>
          <div style={{ fontSize: '10px', color: '#6ee7b7' }}>Ready for Check-In</div>
        </div>

        <div style={{ background: 'rgba(239,68,68,0.15)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)' }}>
          <div style={{ fontSize: '10px', color: '#fca5a5', textTransform: 'uppercase', fontWeight: 800 }}>Vacant Dirty</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#f87171', marginTop: '2px' }}>{dirtyCount} Rooms</div>
          <div style={{ fontSize: '10px', color: '#fecaca' }}>Needs Housekeeping</div>
        </div>

        <div style={{ background: 'rgba(245,158,11,0.15)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.3)' }}>
          <div style={{ fontSize: '10px', color: '#fde68a', textTransform: 'uppercase', fontWeight: 800 }}>Today's Movement</div>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#fbbf24', marginTop: '4px' }}>
            Arr: {todayArrivalsCount} &bull; Dep: {todayDeparturesCount}
          </div>
          <div style={{ fontSize: '10px', color: '#fef08a' }}>Expected Arrivals/Dep</div>
        </div>

        <div style={{ background: 'rgba(168,85,247,0.15)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(168,85,247,0.3)' }}>
          <div style={{ fontSize: '10px', color: '#e9d5ff', textTransform: 'uppercase', fontWeight: 800 }}>ARR (Avg Rate)</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#c084fc', marginTop: '2px' }}>₹{arr.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '10px', color: '#d8b4fe' }}>Average Room Rate</div>
        </div>

        <div style={{ background: 'rgba(14,165,233,0.15)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(14,165,233,0.3)' }}>
          <div style={{ fontSize: '10px', color: '#bae6fd', textTransform: 'uppercase', fontWeight: 800 }}>RevPAR</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>₹{revPar.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '10px', color: '#7dd3fc' }}>Rev Per Available Room</div>
        </div>
      </div>

      {/* Interactive Filter Bar */}
      <div className="room-status-bar" style={{ padding: '10px 14px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        
        {/* Floor Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Floor:</span>
          {(['all', '0', '1'] as const).map(fl => (
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
              {fl === 'all' ? 'All (18 Rooms)' : fl === '0' ? 'Ground Floor (7)' : '1st Floor (11)'}
            </button>
          ))}
        </div>

        {/* Status Filter Badges */}
        <div className="status-pills-group" style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '8px' }}>
          <button
            type="button"
            className={`status-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
            style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', whiteSpace: 'nowrap' }}
          >
            All Rooms ({rooms.length})
          </button>
          <button
            type="button"
            className={`status-btn btn-vacant ${statusFilter === 'vacant' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'vacant' ? 'all' : 'vacant')}
            style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', background: statusFilter === 'vacant' ? '#059669' : '#dcfce7', color: statusFilter === 'vacant' ? '#ffffff' : '#15803d', whiteSpace: 'nowrap' }}
          >
            🟢 Vacant / Ready ({vacantCleanCount})
          </button>
          <button
            type="button"
            className={`status-btn btn-check ${statusFilter === 'occupied' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'occupied' ? 'all' : 'occupied')}
            style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', background: statusFilter === 'occupied' ? '#2563eb' : '#dbeafe', color: statusFilter === 'occupied' ? '#ffffff' : '#1d4ed8', whiteSpace: 'nowrap' }}
          >
            🔵 Occupied ({occupiedCount})
          </button>
          <button
            type="button"
            className={`status-btn btn-dirty ${statusFilter === 'dirty' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'dirty' ? 'all' : 'dirty')}
            style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', background: statusFilter === 'dirty' ? '#dc2626' : '#fee2e2', color: statusFilter === 'dirty' ? '#ffffff' : '#b91c1c', whiteSpace: 'nowrap' }}
          >
            🔴 Dirty / Housekeeping ({dirtyCount})
          </button>
          <button
            type="button"
            className={`status-btn btn-booked ${statusFilter === 'booked' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'booked' ? 'all' : 'booked')}
            style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', background: statusFilter === 'booked' ? '#d97706' : '#fef3c7', color: statusFilter === 'booked' ? '#ffffff' : '#b45309', whiteSpace: 'nowrap' }}
          >
            🟡 Late Checkout / Reserved ({reservedCount})
          </button>
          <button
            type="button"
            className={`status-btn ${statusFilter === 'blocked' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'blocked' ? 'all' : 'blocked')}
            style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', background: statusFilter === 'blocked' ? '#475569' : '#f1f5f9', color: statusFilter === 'blocked' ? '#ffffff' : '#334155', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}
          >
            ⚙️ Maintenance / Unconfirmed ({maintenanceCount})
          </button>
        </div>

        {/* Live Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 9px',
              borderRadius: 16,
              background: isWsConnected ? '#ecfdf5' : '#fef2f2',
              color: isWsConnected ? '#065f46' : '#991b1b',
              fontSize: 10,
              fontWeight: 800,
              border: `1px solid ${isWsConnected ? '#a7f3d0' : '#fecaca'}`,
              userSelect: 'none'
            }}
            title={isWsConnected ? "Live WebSocket connected (/api/v1/ws/front_desk)" : "Reconnecting to Front Desk WebSocket..."}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isWsConnected ? '#10b981' : '#ef4444',
                boxShadow: isWsConnected ? '0 0 6px #10b981' : 'none'
              }}
            />
            {isWsConnected ? 'LIVE WS' : 'RECONNECTING'}
          </div>
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
            onClick={() => setIsDirtyModalOpen(true)}
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
            title="Mark Room Dirty / Clean Status (/markdirty/create)"
          >
            🧽 Status Toggle
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
            onClick={handleExportJson}
            style={{
              background: '#0284c7',
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
            title="Export complete ERP database backup as JSON"
          >
            📥 Export Backup
          </button>

          <label
            style={{
              background: '#0891b2',
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
            title="Import ERP database backup from JSON file"
          >
            📤 Import Backup
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportJson}
            />
          </label>

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
            title="Reset All 18 Rooms, Inventory & Folios to Authentic Rayagada Demo Seed Data"
          >
            ↺ Reset Seed (18 Rms)
          </button>
        </div>
      </div>

      {/* Concurrency Conflict Alert Banner (#25) */}
      {conflictAlert && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #f87171',
          color: '#991b1b',
          padding: '8px 16px',
          margin: '10px 16px 0 16px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span><strong>Optimistic Concurrency Conflict:</strong> {conflictAlert} The room rack view has been automatically refreshed with latest server data.</span>
          </div>
          <button
            type="button"
            onClick={() => setConflictAlert(null)}
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: 3,
              padding: '2px 8px',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 800
            }}
          >
            Dismiss
          </button>
        </div>
      )}

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
          <div className="room-matrix-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '12px', alignContent: 'start' }}>
            {filteredRooms.map(room => {
              const isOccupied = room.status === 'occupied';
              const isBooked = room.status === 'booked';
              const isDirty = room.status === 'dirty';
              const isBlocked = room.status === 'blocked';
              const isVacant = room.status === 'vacant';

              const folio = isOccupied ? PmsStore.getFolioSummary(room.roomNo) : null;

              // Border and Badge Color
              let borderColor = '#059669'; // Emerald Green
              let statusLabel = 'Ready';
              let badgeBg = '#dcfce7';
              let badgeColor = '#15803d';
              let statusDot = '#059669';

              if (isOccupied) {
                borderColor = '#2563eb'; // Royal Blue
                statusLabel = 'Occupied';
                badgeBg = '#dbeafe';
                badgeColor = '#1d4ed8';
                statusDot = '#2563eb';
              } else if (isBooked) {
                borderColor = '#d97706'; // Amber
                statusLabel = 'Reserved';
                badgeBg = '#fef3c7';
                badgeColor = '#b45309';
                statusDot = '#d97706';
              } else if (isDirty) {
                borderColor = '#dc2626'; // Crimson Red
                statusLabel = 'Dirty';
                badgeBg = '#fee2e2';
                badgeColor = '#b91c1c';
                statusDot = '#dc2626';
              } else if (isBlocked) {
                borderColor = '#475569'; // Slate Grey
                statusLabel = 'Blocked';
                badgeBg = '#f1f5f9';
                badgeColor = '#334155';
                statusDot = '#475569';
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
                    padding: '10px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 0 3px rgba(245, 158, 11, 0.4)' : '0 2px 5px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '142px',
                    boxSizing: 'border-box'
                  }}
                  title="Click to open Room Action Drawer"
                >
                  {/* Header: Room Number (16px bold) + Room Type badge (AC / Non-AC / Suite) + Status Dot */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                          {room.roomNo}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap'
                        }}>
                          {room.roomType.replace('Room', '').trim()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: statusDot, lineHeight: 1 }}>●</span>
                        <span style={{
                          fontSize: '10px',
                          background: badgeBg,
                          color: badgeColor,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body: Guest Name or Available placeholder, plus Check-In / Checkout time or tariff / KOT balance */}
                  <div style={{ margin: '6px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {isOccupied && room.currentGuest ? (
                      <div style={{ background: '#eff6ff', padding: '5px 7px', borderRadius: '5px', border: '1px solid #bfdbfe' }}>
                        <div style={{
                          fontWeight: 800,
                          color: '#1e40af',
                          fontSize: '12px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={room.currentGuest.name}>
                          👤 {room.currentGuest.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#3b82f6', display: 'flex', justifyContent: 'space-between', marginTop: '2px', whiteSpace: 'nowrap' }}>
                          <span>Out: {room.currentGuest.checkOutDate}</span>
                          <span>₹{room.tariff}/nt</span>
                        </div>
                        {folio && (
                          <div style={{
                            marginTop: '2px',
                            fontWeight: 800,
                            color: folio.balanceDue > 0 ? '#dc2626' : '#059669',
                            fontSize: '10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            whiteSpace: 'nowrap'
                          }}>
                            <span>Bal Due:</span>
                            <span>₹{folio.balanceDue.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>
                    ) : isBooked && room.currentGuest ? (
                      <div style={{ background: '#fffbeb', padding: '5px 7px', borderRadius: '5px', border: '1px solid #fde68a' }}>
                        <div style={{
                          fontWeight: 800,
                          color: '#92400e',
                          fontSize: '12px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={room.currentGuest.name}>
                          📅 {room.currentGuest.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#b45309', marginTop: '2px', display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap' }}>
                          <span>In: {room.currentGuest.checkInDate}</span>
                          <span>Adv: ₹{room.currentGuest.advancePaid || 0}</span>
                        </div>
                      </div>
                    ) : isDirty ? (
                      <div style={{ background: '#fef2f2', padding: '5px 7px', borderRadius: '5px', border: '1px solid #fecaca', fontSize: '11px', color: '#991b1b' }}>
                        <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          🧹 Needs Housekeeping
                        </div>
                        <div style={{ fontSize: '10px', color: '#b91c1c', marginTop: '2px', display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap' }}>
                          <span>Linen / Cleaning</span>
                          <span>₹{room.tariff}/nt</span>
                        </div>
                      </div>
                    ) : isBlocked ? (
                      <div style={{ background: '#f8fafc', padding: '5px 7px', borderRadius: '5px', border: '1px solid #cbd5e1', fontSize: '11px', color: '#475569' }}>
                        <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={room.maintenanceIssue || 'Under Maintenance'}>
                          ⚙️ {room.maintenanceIssue || 'Under Maintenance'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap' }}>
                          <span>Blocked</span>
                          <span>₹{room.tariff}/nt</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: '#f0fdf4', padding: '5px 7px', borderRadius: '5px', border: '1px solid #bbf7d0', fontSize: '11px', color: '#166534' }}>
                        <div style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          ✨ Available
                        </div>
                        <div style={{ fontSize: '10px', color: '#15803d', display: 'flex', justifyContent: 'space-between', marginTop: '2px', whiteSpace: 'nowrap' }}>
                          <span>Ready Clean</span>
                          <span style={{ fontWeight: 700 }}>₹{room.tariff}/nt</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer: Quick-action mini buttons (Check-In, KOT, Bill, Clean) with height: 26px; font-size: 11px; white-space: nowrap; */}
                  <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '4px' }}>
                    {isVacant && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRoomForCheckIn(room);
                            setIsCheckInOpen(true);
                          }}
                          style={{
                            flex: 2,
                            height: '26px',
                            fontSize: '11px',
                            whiteSpace: 'nowrap',
                            padding: '0 6px',
                            background: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '2px'
                          }}
                        >
                          + Check-In
                        </button>
                        <button
                          type="button"
                          title="Mark room as Dirty"
                          onClick={(e) => {
                            e.stopPropagation();
                            PmsStore.updateRoomStatus(room.roomNo, 'dirty');
                          }}
                          style={{
                            flex: 1,
                            height: '26px',
                            fontSize: '11px',
                            whiteSpace: 'nowrap',
                            padding: '0 4px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fca5a5',
                            borderRadius: '4px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          Dirty
                        </button>
                      </>
                    )}

                    {isOccupied && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRoomForKot(room);
                            setIsKotOpen(true);
                          }}
                          style={{
                            flex: 1,
                            height: '26px',
                            fontSize: '11px',
                            whiteSpace: 'nowrap',
                            padding: '0 4px',
                            background: '#ea580c',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Add KOT / Food Order"
                        >
                          + KOT
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRoomForCheckout(room);
                            setIsCheckoutOpen(true);
                          }}
                          style={{
                            flex: 1,
                            height: '26px',
                            fontSize: '11px',
                            whiteSpace: 'nowrap',
                            padding: '0 4px',
                            background: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Checkout & Bill"
                        >
                          Bill
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDrawerRoomNo(room.roomNo);
                          }}
                          style={{
                            height: '26px',
                            fontSize: '11px',
                            whiteSpace: 'nowrap',
                            padding: '0 5px',
                            background: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Open Room Folio Details"
                        >
                          Folio
                        </button>
                      </>
                    )}

                    {isDirty && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          PmsStore.updateHousekeepingStatus(
                            room.roomNo,
                            'Vacant Clean',
                            new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                            'Normal'
                          );
                        }}
                        style={{
                          width: '100%',
                          height: '26px',
                          fontSize: '11px',
                          whiteSpace: 'nowrap',
                          padding: '0 6px',
                          background: '#059669',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        ✨ Clean Room
                      </button>
                    )}

                    {isBlocked && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          PmsStore.updateHousekeepingStatus(room.roomNo, 'Vacant Clean', undefined, 'Normal');
                        }}
                        style={{
                          width: '100%',
                          height: '26px',
                          fontSize: '11px',
                          whiteSpace: 'nowrap',
                          padding: '0 6px',
                          background: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        🔧 Release / Clean
                      </button>
                    )}

                    {isBooked && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRoomForCheckIn(room);
                          setIsCheckInOpen(true);
                        }}
                        style={{
                          width: '100%',
                          height: '26px',
                          fontSize: '11px',
                          whiteSpace: 'nowrap',
                          padding: '0 6px',
                          background: '#d97706',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        + Check-In Guest
                      </button>
                    )}
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
                  {drawerRoom.floor === 0 ? 'Ground Floor' : '1st Floor'}
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

                {isPostingCharge && (
                  <div style={{ background: '#fdf4ff', border: '1px solid #f0abfc', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 800, color: '#86198f' }}>Post Incidental Service Charge (SAC Code)</h4>
                    <form onSubmit={handlePostCharge} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                        <select
                          value={chargeName}
                          onChange={e => {
                            const val = e.target.value;
                            setChargeName(val);
                            if (val.includes('Extra Bed')) { setChargeSac('996311'); setChargeAmount('600'); setChargeGstPercent(12); }
                            else if (val.includes('Cab')) { setChargeSac('996412'); setChargeAmount('300'); setChargeGstPercent(5); }
                            else if (val.includes('Laundry')) { setChargeSac('999799'); setChargeAmount('250'); setChargeGstPercent(18); }
                            else { setChargeSac('999799'); setChargeAmount('500'); setChargeGstPercent(18); }
                          }}
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700 }}
                        >
                          <option value="Extra Bed / Mattress">Extra Bed / Mattress (SAC 996311 @ 12%)</option>
                          <option value="Express Laundry Service">Express Laundry Service (SAC 999799 @ 18%)</option>
                          <option value="Temple Darshan Cab Assistance">Temple Darshan Cab Drop (SAC 996412 @ 5%)</option>
                          <option value="Early / Late Stay Adjustment">Early / Late Stay Adjustment (SAC 996311 @ 12%)</option>
                          <option value="Misc Concierge Service">Misc Concierge Service (SAC 999799 @ 18%)</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Amount (₹)"
                          required
                          value={chargeAmount}
                          onChange={e => setChargeAmount(e.target.value)}
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 800 }}
                        />
                      </div>
                      <div style={{ fontSize: '11px', color: '#701a75' }}>
                        SAC Code: <strong>{chargeSac}</strong> &bull; Tax Rate: <strong>{chargeGstPercent}% GST</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button type="button" onClick={() => setIsPostingCharge(false)} style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>Cancel</button>
                        <button type="submit" style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '4px', border: 'none', background: '#c026d3', color: '#ffffff', fontWeight: 700 }}>Post to Folio</button>
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
                    onClick={() => setIsPostingCharge(!isPostingCharge)}
                    style={{ padding: '9px 10px', background: '#c026d3', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ➕ Post Charge (SAC)
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
                    onClick={() => setIsSplitFolioOpen(true)}
                    style={{ padding: '9px 10px', background: '#0891b2', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ⚖️ Split Folio (B2B / Personal)
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

                <button
                  type="button"
                  onClick={() => setIsDirtyModalOpen(true)}
                  style={{ padding: '10px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  title="Open Mark Dirty / Housekeeping Status Manager"
                >
                  🧽 Mark Room Dirty / Change Clean Status
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
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>SRI SAI VASUDEV RESIDENCY</h3>
                <small style={{ fontSize: '11px', color: '#64748b' }}>SR RESIDENCY, NEAR ANDHRA BANK, NEW COLONY, Rayagada, Odisha - 765001 &bull; GSTIN: 21AEKPP8689J1ZS</small>
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
        onKotSaved={() => {
          setIsKotOpen(false);
          setSelectedDrawerRoomNo(null);
        }}
      />

      <FoodBillModal
        isOpen={isFoodBillOpen}
        onClose={() => setIsFoodBillOpen(false)}
        defaultRoomNo={selectedRoomForFoodBill?.roomNo}
        onBillSaved={() => {
          setIsFoodBillOpen(false);
          setSelectedDrawerRoomNo(null);
        }}
      />

      <RoomCheckOutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setSelectedDrawerRoomNo(null);
        }}
        targetRoom={selectedRoomForCheckout}
        onCheckoutComplete={() => {
          // Keep open for Tax Invoice review until onClose
        }}
      />

      <MarkDirtyModal
        isOpen={isDirtyModalOpen}
        onClose={() => setIsDirtyModalOpen(false)}
        onStatusUpdated={() => {
          setIsDirtyModalOpen(false);
          setSelectedDrawerRoomNo(null);
        }}
      />

      <RoomShiftModal
        isOpen={isRoomShiftOpen}
        onClose={() => setIsRoomShiftOpen(false)}
        initialFromRoomNo={selectedRoomForShift}
        onShiftCompleted={() => {
          setIsRoomShiftOpen(false);
          setSelectedDrawerRoomNo(null);
        }}
      />

      {/* Housekeeping Modal */}
      <HousekeepingTrackerModal
        isOpen={isHousekeepingOpen}
        onClose={() => setIsHousekeepingOpen(false)}
      />

      {/* Split Folio (B2B Company Invoice vs Personal Invoice) Modal */}
      {isSplitFolioOpen && drawerRoom && (
        <div className="pms-submodal-overlay" onClick={() => setIsSplitFolioOpen(false)}>
          <div className="pms-form-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 680, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: 10, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a', fontWeight: 800 }}>
                  ⚖️ Split Guest Folio: Room {drawerRoom.roomNo} ({drawerRoom.currentGuest?.name})
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                  Segregate line items between Company GST Invoice (Folio A) and Personal Guest Invoice (Folio B)
                </p>
              </div>
              <button type="button" onClick={() => setIsSplitFolioOpen(false)} style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Folio A: Company B2B Tax Invoice */}
              <div style={{ border: '2px solid #2563eb', borderRadius: 8, padding: 12, background: '#eff6ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ color: '#1e40af', fontSize: 12 }}>🏢 Folio A: Company B2B Invoice</strong>
                  <span style={{ fontSize: 10, background: '#2563eb', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>GSTIN</span>
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>
                  Company: {drawerRoom.currentGuest?.companyName || 'Corporate Account'}
                </div>
                <div style={{ minHeight: 120, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {splitFolioA.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '5px 8px', borderRadius: 4, fontSize: 11 }}>
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSplitFolioA(splitFolioA.filter((_, i) => i !== idx));
                          setSplitFolioB([...splitFolioB, item]);
                        }}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '2px 6px', fontSize: 10, cursor: 'pointer' }}
                        title="Move to Personal Folio B"
                      >
                        👉 To Folio B
                      </button>
                    </div>
                  ))}
                  {splitFolioA.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11, marginTop: 40 }}>No items in Company Folio</div>
                  )}
                </div>
              </div>

              {/* Folio B: Personal Guest Invoice */}
              <div style={{ border: '2px solid #059669', borderRadius: 8, padding: 12, background: '#f0fdf4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ color: '#166534', fontSize: 12 }}>👤 Folio B: Personal Invoice</strong>
                  <span style={{ fontSize: 10, background: '#059669', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>Personal</span>
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>
                  Guest: {drawerRoom.currentGuest?.name}
                </div>
                <div style={{ minHeight: 120, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {splitFolioB.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '5px 8px', borderRadius: 4, fontSize: 11 }}>
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSplitFolioB(splitFolioB.filter((_, i) => i !== idx));
                          setSplitFolioA([...splitFolioA, item]);
                        }}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '2px 6px', fontSize: 10, cursor: 'pointer' }}
                        title="Move to Company Folio A"
                      >
                        👈 To Folio A
                      </button>
                    </div>
                  ))}
                  {splitFolioB.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11, marginTop: 40 }}>No items in Personal Folio</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setIsSplitFolioOpen(false)}
                style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`✓ Folio Split Saved!\n\nFolio A (Company Invoice): ${splitFolioA.join(', ')}\nFolio B (Personal Invoice): ${splitFolioB.join(', ')}`);
                  setIsSplitFolioOpen(false);
                }}
                style={{ padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                💾 Confirm &amp; Save Split Folios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Housekeeping Kanban Tracker Modal */}
      <HousekeepingTrackerModal
        isOpen={isHousekeepingOpen}
        onClose={() => setIsHousekeepingOpen(false)}
      />

      {/* Petty Cash & Daily Night Audit Modal */}
      <PettyExpenseModal
        isOpen={isPettyExpenseOpen}
        onClose={() => setIsPettyExpenseOpen(false)}
      />
    </div>
  );
};
