import React, { useState } from 'react';
import { RoomDashboardModal } from './RoomDashboardModal';
import { PmsHomeDashboardModal } from './PmsHomeDashboardModal';
import { BookingCalendarModal } from './BookingCalendarModal';
import { UnconfirmedBookingsModal } from './UnconfirmedBookingsModal';
import { FbbReportModal } from './FbbReportModal';
import { KotEntryModal } from './KotEntryModal';
import { FoodBillModal } from './FoodBillModal';
import { AdvanceReceiptModal } from './AdvanceReceiptModal';
import { PartyLedgerModal } from './PartyLedgerModal';
import { RoomMasterModal } from './RoomMasterModal';
import { TableMasterModal } from './TableMasterModal';
import { ItemMasterModal } from './ItemMasterModal';
import { OtherMasterModal } from './OtherMasterModal';
import { BusinessSettingModal } from './BusinessSettingModal';
import { CompanyInfoModal } from './CompanyInfoModal';
import { RoomShiftModal } from './RoomShiftModal';
import { RoomCheckInRegisterModal } from './RoomCheckInRegisterModal';
import { NewRoomCheckInModal } from './NewRoomCheckInModal';
import { KitchenDashboardModal } from './KitchenDashboardModal';
import { RestaurantKotRegisterModal } from './RestaurantKotRegisterModal';
import { RestaurantTableDashboardModal } from './RestaurantTableDashboardModal';
import { ShiftTableModal } from './ShiftTableModal';
import { NcKotRegisterModal } from './NcKotRegisterModal';
import { RoomKotRegisterModal } from './RoomKotRegisterModal';
import { ReceiptRegisterModal } from './ReceiptRegisterModal';
import { OutstandingReceivablesModal } from './OutstandingReceivablesModal';
import { PaymentRegisterModal } from './PaymentRegisterModal';
import { PurchaseEntryModal } from './PurchaseEntryModal';
import { StockTransferModal } from './StockTransferModal';
import { StoreWiseStockModal } from './StoreWiseStockModal';
import { OnlineGuestBookingModal } from './OnlineGuestBookingModal';
import { UserManagementModal } from './UserManagementModal';
import { RolesPermissionsModal } from './RolesPermissionsModal';
import { ChainPropertyModal } from './ChainPropertyModal';
import { DeviceResponsivePreviewModal } from './DeviceResponsivePreviewModal';
import type { PmsUserAccount, PmsChainProperty } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import './pmsStyles.css';

interface HotelPmsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotelPmsModal: React.FC<HotelPmsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'hub'>('matrix');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [masterMenuOpen, setMasterMenuOpen] = useState(false);
  const [entryMenuOpen, setEntryMenuOpen] = useState(true);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [otherSubmenuOpen, setOtherSubmenuOpen] = useState(false);
  const [settingMenuOpen, setSettingMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calendar & Unconfirmed Bookings Modals
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isUnconfirmedOpen, setIsUnconfirmedOpen] = useState(false);
  const [isFbbReportOpen, setIsFbbReportOpen] = useState(false);
  const [isKotModalOpen, setIsKotModalOpen] = useState(false);
  const [selectedKotTable, setSelectedKotTable] = useState<string | undefined>(undefined);
  const [isFoodBillModalOpen, setIsFoodBillModalOpen] = useState(false);
  const [selectedBillTable, setSelectedBillTable] = useState<string | undefined>(undefined);
  const [isAdvanceReceiptOpen, setIsAdvanceReceiptOpen] = useState(false);
  const [isPartyLedgerOpen, setIsPartyLedgerOpen] = useState(false);

  // Video 08 Master Modals
  const [isRoomMasterOpen, setIsRoomMasterOpen] = useState(false);
  const [isTableMasterOpen, setIsTableMasterOpen] = useState(false);
  const [isItemMasterOpen, setIsItemMasterOpen] = useState(false);
  const [isOtherMasterOpen, setIsOtherMasterOpen] = useState(false);
  const [otherMasterTab, setOtherMasterTab] = useState<'gst' | 'businessSource' | 'voucherType'>('gst');

  // Video 09 Business Setting Modal (12 Hour vs 24 Hour Policy)
  const [isBusinessSettingOpen, setIsBusinessSettingOpen] = useState(false);

  // Video 10 Company Info Modal (Local vs Interstate GST & State Codes)
  const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState(false);
  const [roomRefreshTrigger, setRoomRefreshTrigger] = useState(0);

  // Video 11 Room Shifting & Check In Register Modals
  const [isRoomShiftOpen, setIsRoomShiftOpen] = useState(false);
  const [selectedRoomForShift, setSelectedRoomForShift] = useState<string | undefined>(undefined);
  const [isCheckInRegisterOpen, setIsCheckInRegisterOpen] = useState(false);
  const [isNewCheckInOpen, setIsNewCheckInOpen] = useState(false);

  // Video 12 Kitchen Dashboard (KDS) & Restaurant KOT Register Modals
  const [isKitchenDashboardOpen, setIsKitchenDashboardOpen] = useState(false);
  const [isRestaurantKotOpen, setIsRestaurantKotOpen] = useState(false);

  // Video 13 Restaurant Table Matrix, Table Shifting, NC KOT Register
  const [isTableDashboardOpen, setIsTableDashboardOpen] = useState(false);
  const [isShiftTableOpen, setIsShiftTableOpen] = useState(false);
  const [isNcKotRegisterOpen, setIsNcKotRegisterOpen] = useState(false);

  // Video 14 Room KOT Register & Mobile Unprinted Queue
  const [isRoomKotRegisterOpen, setIsRoomKotRegisterOpen] = useState(false);

  // Video 15 Receipt Register & Outstanding Receivables
  const [isReceiptRegisterOpen, setIsReceiptRegisterOpen] = useState(false);
  const [isOutstandingReceivablesOpen, setIsOutstandingReceivablesOpen] = useState(false);

  // Video 16 Payment Register
  const [isPaymentRegisterOpen, setIsPaymentRegisterOpen] = useState(false);

  // Video 19 Store Management & Stock Control
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isStockTransferOpen, setIsStockTransferOpen] = useState(false);
  const [stockTransferMode, setStockTransferMode] = useState<'transfer' | 'issue'>('transfer');
  const [isStoreWiseStockOpen, setIsStoreWiseStockOpen] = useState(false);
  const [itemMasterTab, setItemMasterTab] = useState<'list' | 'form' | 'groups' | 'godowns'>('list');

  // Video 20 Online Room Booking Portal
  const [isOnlineGuestBookingOpen, setIsOnlineGuestBookingOpen] = useState(false);
  const unconfirmedCount = PmsStore.getUnconfirmedBookings().length;

  // Video 21: Multi-User, Roles & Permissions, Multi-Location & Multi-Device
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isRolesPermissionsOpen, setIsRolesPermissionsOpen] = useState(false);
  const [isChainPropertyOpen, setIsChainPropertyOpen] = useState(false);
  const [isDevicePreviewOpen, setIsDevicePreviewOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<PmsUserAccount>(PmsStore.getCurrentUser());
  const [currentProperty, setCurrentProperty] = useState<PmsChainProperty>(PmsStore.getCurrentProperty());

  if (!isOpen) return null;

  return (
    <>
      <div className="pms-overlay" onClick={onClose}>
        <div className="pms-window" onClick={e => e.stopPropagation()}>
          {/* Master Header matching Video 01 & 02 */}
          <header className="pms-header">
            <div className="pms-header-left">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}
                title="Toggle Menu"
              >
                ☰
              </button>
              <h2 className="pms-brand-title">
                HOTEL MANAGEMENT SYSTEM &bull; PMS
              </h2>

              <div className="pms-header-search">
                <input
                  type="text"
                  placeholder="Search room, guest, booking..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pms-search-input"
                />
                <button type="button" className="pms-search-btn">
                  🔍
                </button>
              </div>
            </div>

            <div className="pms-header-right">
              {/* Quick Action Badges from Video 02 & Video 20 Transcripts */}
              <button
                type="button"
                onClick={() => setIsUnconfirmedOpen(true)}
                title="Click to view and confirm pending online guest bookings (Video 20 Frame 0360)"
                style={{
                  background: unconfirmedCount > 0 ? '#e11d48' : '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '3px 10px',
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: unconfirmedCount > 0 ? '0 0 8px rgba(225, 29, 72, 0.5)' : undefined
                }}
              >
                <span>🔔</span>
                <span>Unconfirmed ({unconfirmedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCalendarOpen(true)}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '3px 10px',
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>📅</span>
                <span>Calendar</span>
              </button>

              {/* Video 21: Active Chain Property Selector */}
              <button
                type="button"
                onClick={() => setIsChainPropertyOpen(true)}
                title="Click to switch property / branch (Video 21 Multi-Location)"
                style={{
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  padding: '3px 10px',
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>🏨</span>
                <span>{currentProperty.firmId} ({currentProperty.location})</span>
              </button>

              {/* Video 21: Mobile Responsive View Emulator Toggle */}
              <button
                type="button"
                onClick={() => setIsDevicePreviewOpen(true)}
                title="Click to test PMS on mobile / tablet responsive emulator (Video 21 Frame 0138)"
                style={{
                  background: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  padding: '3px 10px',
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>📱</span>
                <span>Mobile View</span>
              </button>

              {/* Video 21: User Avatar & Role Dropdown */}
              <div style={{ position: 'relative' }}>
                <div
                  className="pms-user-tag"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Click to switch user or view permissions"
                >
                  <span style={{
                    background: '#2563eb',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700
                  }}>
                    {currentUser.userName.charAt(0)}
                  </span>
                  <span>{currentUser.userName} ({currentUser.roleName}) ▾</span>
                </div>

                {userDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 6,
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 6,
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                      width: 230,
                      zIndex: 1000,
                      overflow: 'hidden',
                      fontSize: 12
                    }}
                  >
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #334155', background: '#0f172a' }}>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{currentUser.userName}</div>
                      <div style={{ fontSize: 11, color: '#38bdf8' }}>Role: {currentUser.roleName}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Branch: {currentProperty.firmId} - {currentProperty.firmName}</div>
                    </div>
                    <div
                      onClick={() => { setUserDropdownOpen(false); setIsUserManagementOpen(true); }}
                      style={{ padding: '8px 12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      👥 User Accounts (/userprofile)
                    </div>
                    <div
                      onClick={() => { setUserDropdownOpen(false); setIsRolesPermissionsOpen(true); }}
                      style={{ padding: '8px 12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      🛡️ Roles &amp; Permissions (/roles)
                    </div>
                    <div
                      onClick={() => { setUserDropdownOpen(false); setIsChainPropertyOpen(true); }}
                      style={{ padding: '8px 12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      🏨 Switch Chain Branch
                    </div>
                    <div
                      onClick={() => { setUserDropdownOpen(false); setIsDevicePreviewOpen(true); }}
                      style={{ padding: '8px 12px', color: '#e2e8f0', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      📱 Mobile Device Simulator
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="pms-close-btn"
                title="Close PMS & Return to Guest Website"
              >
                ✕
              </button>
            </div>
          </header>

          {/* Master PMS Body Layout */}
          <div className="pms-body">
            {/* Left Dark Sidebar matching Frames 0005, 0020, 0065, 0090 */}
            {sidebarOpen && (
              <aside className="pms-sidebar">
                <div
                  className={`pms-nav-item ${activeTab === 'matrix' ? 'active' : ''}`}
                  onClick={() => setActiveTab('matrix')}
                >
                  <div className="pms-nav-item-left">
                    <span>🏢</span>
                    <span>Room Dashboard</span>
                  </div>
                </div>

                <div
                  className={`pms-nav-item ${activeTab === 'hub' ? 'active' : ''}`}
                  onClick={() => setActiveTab('hub')}
                >
                  <div className="pms-nav-item-left">
                    <span>🏠</span>
                    <span>Home Hub (16 Tiles)</span>
                  </div>
                </div>

                {/* Master Submenu */}
                <div 
                  className="pms-nav-item" 
                  onClick={() => setMasterMenuOpen(!masterMenuOpen)}
                  style={{ background: masterMenuOpen ? '#2c3136' : undefined }}
                >
                  <div className="pms-nav-item-left">
                    <span>📋</span>
                    <span>Master</span>
                  </div>
                  <span>{masterMenuOpen ? '▾' : '›'}</span>
                </div>

                {masterMenuOpen && (
                  <div style={{ background: '#1a1e22', paddingLeft: 12, fontSize: 12 }}>
                    <div className="pms-nav-item" onClick={() => { setItemMasterTab('list'); setIsItemMasterOpen(true); }}>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>🍽️ Item Master</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsPartyLedgerOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 600 }}>💼 Account Master (Ledgers)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsRoomMasterOpen(true)}>
                      <span style={{ color: '#4ade80', fontWeight: 600 }}>🛏️ Room Master</span>
                    </div>
                    <div 
                      className="pms-nav-item"
                      onClick={() => setOtherSubmenuOpen(!otherSubmenuOpen)}
                      style={{ justifyContent: 'space-between' }}
                    >
                      <span>⚙️ Other</span>
                      <span>{otherSubmenuOpen ? '▾' : '›'}</span>
                    </div>

                    {otherSubmenuOpen && (
                      <div style={{ background: '#111417', paddingLeft: 12, fontSize: 11 }}>
                        <div className="pms-nav-item" onClick={() => setIsTableMasterOpen(true)}>
                          <span style={{ color: '#fcd34d', fontWeight: 600 }}>🍽️ Table (Dine-in / KOT)</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => { setItemMasterTab('godowns'); setIsItemMasterOpen(true); }}>
                          <span style={{ color: '#38bdf8', fontWeight: 600 }}>🏬 Godown (Store)</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => alert('Locker Master: Safe deposit locker management.')}>
                          <span>🔒 Locker</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => { setOtherMasterTab('gst'); setIsOtherMasterOpen(true); }}>
                          <span>⚖️ GST,TAX,VAT</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => { setOtherMasterTab('businessSource'); setIsOtherMasterOpen(true); }}>
                          <span>🌐 Business Source</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => alert('Other Charge: Extra bed, laundry, early check-in charges.')}>
                          <span>➕ Other Charge</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => { setOtherMasterTab('voucherType'); setIsOtherMasterOpen(true); }}>
                          <span>📄 Voucher Type</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Entry Submenu (Video 02 Transcript [15:00]) */}
                <div 
                  className="pms-nav-item" 
                  onClick={() => setEntryMenuOpen(!entryMenuOpen)}
                  style={{ background: entryMenuOpen ? '#2c3136' : undefined }}
                >
                  <div className="pms-nav-item-left">
                    <span>📝</span>
                    <span>Entry</span>
                  </div>
                  <span>{entryMenuOpen ? '▾' : '›'}</span>
                </div>

                {entryMenuOpen && (
                  <div style={{ background: '#1a1e22', paddingLeft: 12, fontSize: 12 }}>
                    <div className="pms-nav-item" onClick={() => setIsUnconfirmedOpen(true)}>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>🔔 Unconfirmed Booking ({unconfirmedCount})</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsOnlineGuestBookingOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>🌐 Online Guest Booking Portal (/hotel_room)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setActiveTab('matrix')}>
                      <span>🏨 Room Booking</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsCheckInRegisterOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>📋 Room Check In Register</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsNewCheckInOpen(true)}>
                      <span>🚪 New Check In</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => { setSelectedRoomForShift(undefined); setIsRoomShiftOpen(true); }}>
                      <span style={{ color: '#06b6d4', fontWeight: 800 }}>🔄 Room Shifting (Video 11)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsKotModalOpen(true)}>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>🍴 Room Service (KOT Entry)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsRoomKotRegisterOpen(true)}>
                      <span style={{ color: '#22c55e', fontWeight: 800 }}>📋 Room KOT Register (Video 14)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsKitchenDashboardOpen(true)}>
                      <span style={{ color: '#eab308', fontWeight: 800 }}>🍳 Kitchen Dashboard (KDS - Video 12)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsRestaurantKotOpen(true)}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>🍽️ Restaurant KOT Register</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsTableDashboardOpen(true)}>
                      <span style={{ color: '#84cc16', fontWeight: 800 }}>🏬 Restaurant Table Matrix (Video 13)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsShiftTableOpen(true)}>
                      <span style={{ color: '#f43f5e', fontWeight: 700 }}>🔁 Shift Table (Video 13)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsNcKotRegisterOpen(true)}>
                      <span style={{ color: '#ec4899', fontWeight: 800 }}>🍽️ NC KOT Register (Video 13)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsFoodBillModalOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>🧾 Food Bill (FBB)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsAdvanceReceiptOpen(true)}>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>💵 Room Advance Receipt</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsReceiptRegisterOpen(true)}>
                      <span style={{ color: '#60a5fa', fontWeight: 700 }}>📄 Receipt Register (Video 15)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsPaymentRegisterOpen(true)}>
                      <span style={{ color: '#06b6d4', fontWeight: 700 }}>💳 Payment Register (Video 16)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsPurchaseOpen(true)}>
                      <span style={{ color: '#ec4899', fontWeight: 700 }}>🛒 Purchase Entry (Video 19)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => { setStockTransferMode('transfer'); setIsStockTransferOpen(true); }}>
                      <span style={{ color: '#a855f7', fontWeight: 700 }}>🔁 Stock Transfer &amp; Issue (Video 19)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setActiveTab('matrix')}>
                      <span>🧾 Room Check Out</span>
                    </div>
                  </div>
                )}

                {/* Report Submenu (Video 02 Transcript [07:30, 15:45] & Video 06) */}
                <div 
                  className="pms-nav-item" 
                  onClick={() => setReportMenuOpen(!reportMenuOpen)}
                  style={{ background: reportMenuOpen ? '#2c3136' : undefined }}
                >
                  <div className="pms-nav-item-left">
                    <span>📊</span>
                    <span>Report</span>
                  </div>
                  <span>{reportMenuOpen ? '▾' : '›'}</span>
                </div>

                {reportMenuOpen && (
                  <div style={{ background: '#1a1e22', paddingLeft: 12, fontSize: 12 }}>
                    <div className="pms-nav-item" onClick={() => setIsCalendarOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>📅 Booking Calendar</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsPartyLedgerOpen(true)}>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>📑 Party &amp; Guest Ledger</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsOutstandingReceivablesOpen(true)}>
                      <span style={{ color: '#fb923c', fontWeight: 700 }}>💰 Outstanding Receivables (Video 15)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsStoreWiseStockOpen(true)}>
                      <span style={{ color: '#10b981', fontWeight: 800 }}>📦 Store Wise Stock Report (Video 19)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => alert('Daily Check-in Report')}>
                      <span>📋 Check-in Report</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => alert('Police Station Front Office Report')}>
                      <span>👮 Police Station Report</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsFbbReportOpen(true)}>
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>🍴 FBB Report (Food &amp; Beverage)</span>
                    </div>
                  </div>
                )}

                <div className="pms-nav-item">
                  <div className="pms-nav-item-left">
                    <span>🏨</span>
                    <span>Hotel</span>
                  </div>
                  <span>›</span>
                </div>

                <div className="pms-nav-item">
                  <div className="pms-nav-item-left">
                    <span>⚡</span>
                    <span>Activity</span>
                  </div>
                  <span>›</span>
                </div>

                {/* Setting Submenu (Video 09 Frame 0120 & 0200) */}
                <div 
                  className="pms-nav-item" 
                  onClick={() => setSettingMenuOpen(!settingMenuOpen)}
                  style={{ background: settingMenuOpen ? '#2c3136' : undefined }}
                >
                  <div className="pms-nav-item-left">
                    <span>⚙️</span>
                    <span>Setting</span>
                  </div>
                  <span>{settingMenuOpen ? '▾' : '›'}</span>
                </div>

                {settingMenuOpen && (
                  <div style={{ background: '#1a1e22', paddingLeft: 12, fontSize: 12 }}>
                    <div className="pms-nav-item" onClick={() => setIsCompanyInfoOpen(true)}>
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>🏢 Company Info (/company_info_form)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsBusinessSettingOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>⚙️ Business Setting (/businesssettings/create)</span>
                    </div>
                    {/* Video 21: Multi-User, Roles & Permissions, Multi-Location Items (Frame 0125) */}
                    <div className="pms-nav-item" onClick={() => setIsUserManagementOpen(true)}>
                      <span style={{ color: '#06b6d4', fontWeight: 700 }}>👥 User Setting (/userprofile)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsRolesPermissionsOpen(true)}>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>🛡️ Roles &amp; Permissions (/roles)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsChainPropertyOpen(true)}>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>🏨 Chain Locations (/multilocation)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsDevicePreviewOpen(true)}>
                      <span style={{ color: '#f472b6', fontWeight: 700 }}>📱 Multi-Device Simulator (Video 21)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => alert('Printer & Receipt Template Setup')}>
                      <span>🖨️ Printer &amp; POS Setup</span>
                    </div>
                  </div>
                )}

                <div className="pms-nav-item" onClick={() => alert('Help > Software Video Tutorials (Data House Technologies)')}>
                  <div className="pms-nav-item-left">
                    <span>❓</span>
                    <span>Help &amp; Video Training</span>
                  </div>
                  <span>›</span>
                </div>

                <div className="pms-sidebar-footer">
                  <div>Logged in as: <strong>Hotel Staff</strong></div>
                  <div style={{ marginTop: 4, color: '#4ade80' }}>● System Online</div>
                </div>
              </aside>
            )}

            {/* Main Dynamic View: Matrix Grid vs Home Hub */}
            {activeTab === 'matrix' ? (
              <RoomDashboardModal 
                key={roomRefreshTrigger}
                onSwitchToHomeHub={() => setActiveTab('hub')}
                onOpenCalendar={() => setIsCalendarOpen(true)}
              />
            ) : (
              <PmsHomeDashboardModal onOpenRoomMatrix={() => setActiveTab('matrix')} />
            )}
          </div>
        </div>
      </div>

      {/* Booking Calendar Modal */}
      <BookingCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />

      {/* Unconfirmed Bookings Modal (Video 02, Video 20 Frame 0350 & 0360) */}
      <UnconfirmedBookingsModal
        isOpen={isUnconfirmedOpen}
        onClose={() => setIsUnconfirmedOpen(false)}
        onOpenCalendar={() => {
          setIsUnconfirmedOpen(false);
          setIsCalendarOpen(true);
        }}
        onOpenNewBooking={() => setIsOnlineGuestBookingOpen(true)}
        onOpenCheckInForBooking={() => {
          setIsUnconfirmedOpen(false);
          setIsNewCheckInOpen(true);
        }}
      />

      {/* FBB Report Modal */}
      <FbbReportModal
        isOpen={isFbbReportOpen}
        onClose={() => setIsFbbReportOpen(false)}
      />

      {/* Kot Entry Modal */}
      <KotEntryModal
        isOpen={isKotModalOpen}
        onClose={() => {
          setIsKotModalOpen(false);
          setSelectedKotTable(undefined);
        }}
        defaultTableNo={selectedKotTable}
        defaultServiceType={selectedKotTable ? 'Restaurant' : undefined}
        onKotSaved={() => setRoomRefreshTrigger(prev => prev + 1)}
      />

      {/* Food Bill Modal */}
      <FoodBillModal
        isOpen={isFoodBillModalOpen}
        onClose={() => {
          setIsFoodBillModalOpen(false);
          setSelectedBillTable(undefined);
        }}
        defaultTableNo={selectedBillTable}
        onBillSaved={() => setRoomRefreshTrigger(prev => prev + 1)}
      />

      {/* Advance Receipt Modal (Video 06) */}
      <AdvanceReceiptModal
        isOpen={isAdvanceReceiptOpen}
        onClose={() => setIsAdvanceReceiptOpen(false)}
      />

      {/* Party & Guest Ledger Modal (Video 06) */}
      <PartyLedgerModal
        isOpen={isPartyLedgerOpen}
        onClose={() => setIsPartyLedgerOpen(false)}
      />

      {/* Room Master & Room Type Master Modal (Video 08) */}
      <RoomMasterModal
        isOpen={isRoomMasterOpen}
        onClose={() => setIsRoomMasterOpen(false)}
        onRoomsChanged={() => setRoomRefreshTrigger(prev => prev + 1)}
      />

      {/* Table Master Modal (Video 08 Frame 0820) */}
      <TableMasterModal
        isOpen={isTableMasterOpen}
        onClose={() => setIsTableMasterOpen(false)}
      />

      {/* Item Master Modal (Video 08 Frame 0250, Video 19 Frame 0130, 0230) */}
      <ItemMasterModal
        isOpen={isItemMasterOpen}
        onClose={() => setIsItemMasterOpen(false)}
        initialTab={itemMasterTab}
      />

      {/* Other Configurations Modal (Video 08 Frames 0920, 0980, 1000) */}
      <OtherMasterModal
        isOpen={isOtherMasterOpen}
        onClose={() => setIsOtherMasterOpen(false)}
        initialTab={otherMasterTab}
      />

      {/* Business Setting Modal (Video 09 - 12hr vs 24hr Policy) */}
      <BusinessSettingModal
        isOpen={isBusinessSettingOpen}
        onClose={() => setIsBusinessSettingOpen(false)}
      />

      {/* Company Info Modal (Video 10 - Local vs Interstate GST) */}
      <CompanyInfoModal
        isOpen={isCompanyInfoOpen}
        onClose={() => setIsCompanyInfoOpen(false)}
      />

      {/* Video 11: Room Shifting Modal */}
      <RoomShiftModal
        isOpen={isRoomShiftOpen}
        onClose={() => setIsRoomShiftOpen(false)}
        initialFromRoomNo={selectedRoomForShift}
        onShiftCompleted={() => setRoomRefreshTrigger(prev => prev + 1)}
      />

      {/* Video 11: Room Check In Register Table */}
      <RoomCheckInRegisterModal
        isOpen={isCheckInRegisterOpen}
        onClose={() => setIsCheckInRegisterOpen(false)}
        onOpenNewCheckIn={() => setIsNewCheckInOpen(true)}
        onOpenRoomShift={(rNo) => {
          setSelectedRoomForShift(rNo);
          setIsRoomShiftOpen(true);
        }}
        onOpenCheckout={() => setActiveTab('matrix')}
      />

      {/* New Room Check In Modal */}
      <NewRoomCheckInModal
        isOpen={isNewCheckInOpen}
        onClose={() => setIsNewCheckInOpen(false)}
        onCheckInCompleted={() => setRoomRefreshTrigger(prev => prev + 1)}
      />

      {/* Video 12: Kitchen Dashboard (KDS) */}
      <KitchenDashboardModal
        isOpen={isKitchenDashboardOpen}
        onClose={() => setIsKitchenDashboardOpen(false)}
        onOpenNewKot={() => setIsKotModalOpen(true)}
      />

      {/* Video 12: Restaurant KOT Register */}
      <RestaurantKotRegisterModal
        isOpen={isRestaurantKotOpen}
        onClose={() => setIsRestaurantKotOpen(false)}
        onOpenKitchenDashboard={() => setIsKitchenDashboardOpen(true)}
        onOpenNewKot={() => setIsKotModalOpen(true)}
      />

      {/* Video 13: Restaurant Table Matrix Dashboard */}
      <RestaurantTableDashboardModal
        isOpen={isTableDashboardOpen}
        onClose={() => setIsTableDashboardOpen(false)}
        onOpenKotForTable={(tbl) => {
          setSelectedKotTable(tbl);
          setIsKotModalOpen(true);
        }}
        onOpenBillForTable={(tbl) => {
          setSelectedBillTable(tbl);
          setIsFoodBillModalOpen(true);
        }}
        onOpenKitchenDashboard={() => setIsKitchenDashboardOpen(true)}
        onOpenKotRegister={() => setIsRestaurantKotOpen(true)}
      />

      {/* Video 18: Restaurant Food Bill Modal (Frame 0330) */}
      <FoodBillModal
        isOpen={isFoodBillModalOpen}
        onClose={() => {
          setIsFoodBillModalOpen(false);
          setSelectedBillTable(undefined);
        }}
        defaultTableNo={selectedBillTable}
        onBillSaved={() => {
          setRoomRefreshTrigger(prev => prev + 1);
        }}
      />

      {/* Video 13: Table Shifting Modal */}
      <ShiftTableModal
        isOpen={isShiftTableOpen}
        onClose={() => setIsShiftTableOpen(false)}
        onShiftCompleted={() => setRoomRefreshTrigger(prev => prev + 1)}
      />

      {/* Video 13: NC KOT Register */}
      <NcKotRegisterModal
        isOpen={isNcKotRegisterOpen}
        onClose={() => setIsNcKotRegisterOpen(false)}
        onOpenNewKot={() => {
          setSelectedKotTable('Table NC1');
          setIsKotModalOpen(true);
        }}
      />

      {/* Video 14: Room KOT Register & Mobile Unprinted Queue */}
      <RoomKotRegisterModal
        isOpen={isRoomKotRegisterOpen}
        onClose={() => setIsRoomKotRegisterOpen(false)}
        onOpenKitchenDashboard={() => setIsKitchenDashboardOpen(true)}
        onOpenNewKot={() => setIsKotModalOpen(true)}
        filterServiceType="Room"
        titleOverride="Room KOT Register (Video 14 Frame 0260)"
      />

      {/* Video 15: General Receipt Register Modal (Frame 0090, 0250) */}
      <ReceiptRegisterModal
        isOpen={isReceiptRegisterOpen}
        onClose={() => setIsReceiptRegisterOpen(false)}
      />

      {/* Video 15: Outstanding Receivables Modal (Frame 0130) */}
      <OutstandingReceivablesModal
        isOpen={isOutstandingReceivablesOpen}
        onClose={() => setIsOutstandingReceivablesOpen(false)}
      />

      {/* Video 16: General Payment Register Modal (Frame 0200, 0290, 0320) */}
      <PaymentRegisterModal
        isOpen={isPaymentRegisterOpen}
        onClose={() => setIsPaymentRegisterOpen(false)}
      />

      {/* Video 19: Store & Inventory Modals */}
      <PurchaseEntryModal
        isOpen={isPurchaseOpen}
        onClose={() => setIsPurchaseOpen(false)}
      />

      <StockTransferModal
        isOpen={isStockTransferOpen}
        onClose={() => setIsStockTransferOpen(false)}
        initialMode={stockTransferMode}
      />

      <StoreWiseStockModal
        isOpen={isStoreWiseStockOpen}
        onClose={() => setIsStoreWiseStockOpen(false)}
        onOpenPurchase={() => setIsPurchaseOpen(true)}
        onOpenTransfer={() => {
          setStockTransferMode('transfer');
          setIsStockTransferOpen(true);
        }}
      />

      {/* Video 20: Online Guest Booking Portal & Reservation Form Modal */}
      <OnlineGuestBookingModal
        isOpen={isOnlineGuestBookingOpen}
        onClose={() => {
          setIsOnlineGuestBookingOpen(false);
          setRoomRefreshTrigger(prev => prev + 1);
        }}
      />

      {/* Video 21: User Management Modal (/userprofile) */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => {
          setIsUserManagementOpen(false);
          setCurrentUser(PmsStore.getCurrentUser());
        }}
        onOpenRoles={() => {
          setIsUserManagementOpen(false);
          setIsRolesPermissionsOpen(true);
        }}
        onOpenProperties={() => {
          setIsUserManagementOpen(false);
          setIsChainPropertyOpen(true);
        }}
      />

      {/* Video 21: Roles & Permissions Matrix Modal (/roles) */}
      <RolesPermissionsModal
        isOpen={isRolesPermissionsOpen}
        onClose={() => {
          setIsRolesPermissionsOpen(false);
          setCurrentUser(PmsStore.getCurrentUser());
        }}
        onOpenUsers={() => {
          setIsRolesPermissionsOpen(false);
          setIsUserManagementOpen(true);
        }}
      />

      {/* Video 21: Multi-Location Chain Property Management Modal (/multilocation) */}
      <ChainPropertyModal
        isOpen={isChainPropertyOpen}
        onClose={() => {
          setIsChainPropertyOpen(false);
          setCurrentProperty(PmsStore.getCurrentProperty());
        }}
        onSelectProperty={(prop) => {
          setCurrentProperty(prop);
          setRoomRefreshTrigger(prev => prev + 1);
        }}
        onOpenUsers={() => {
          setIsChainPropertyOpen(false);
          setIsUserManagementOpen(true);
        }}
        onOpenRoles={() => {
          setIsChainPropertyOpen(false);
          setIsRolesPermissionsOpen(true);
        }}
      />

      {/* Video 21: Multi-Device Mobile Responsive Simulator */}
      <DeviceResponsivePreviewModal
        isOpen={isDevicePreviewOpen}
        onClose={() => setIsDevicePreviewOpen(false)}
        onOpenRoomDashboard={() => {
          setIsDevicePreviewOpen(false);
          setActiveTab('matrix');
        }}
        onOpenKotEntry={() => {
          setIsDevicePreviewOpen(false);
          setIsKotModalOpen(true);
        }}
        onOpenCheckIn={() => {
          setIsDevicePreviewOpen(false);
          setIsNewCheckInOpen(true);
        }}
        onOpenFoodBill={() => {
          setIsDevicePreviewOpen(false);
          setIsFoodBillModalOpen(true);
        }}
      />
    </>
  );
};

