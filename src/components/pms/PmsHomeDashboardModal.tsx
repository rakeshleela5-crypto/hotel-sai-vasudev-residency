import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import { NewRoomBookingModal } from './NewRoomBookingModal';
import { NewRoomCheckInModal } from './NewRoomCheckInModal';
import { BookingReceiptModal } from './BookingReceiptModal';
import { KotEntryModal } from './KotEntryModal';
import { FoodBillModal } from './FoodBillModal';
import { RoomCheckOutModal } from './RoomCheckOutModal';
import { AdvanceReceiptModal } from './AdvanceReceiptModal';
import { PartyLedgerModal } from './PartyLedgerModal';
import { KitchenDashboardModal } from './KitchenDashboardModal';
import { RestaurantKotRegisterModal } from './RestaurantKotRegisterModal';
import { RestaurantTableDashboardModal } from './RestaurantTableDashboardModal';
import { ShiftTableModal } from './ShiftTableModal';
import { NcKotRegisterModal } from './NcKotRegisterModal';
import { TableMasterModal } from './TableMasterModal';
import { RoomKotRegisterModal } from './RoomKotRegisterModal';
import { ReceiptRegisterModal } from './ReceiptRegisterModal';
import { OutstandingReceivablesModal } from './OutstandingReceivablesModal';
import { PaymentRegisterModal } from './PaymentRegisterModal';
import { PurchaseEntryModal } from './PurchaseEntryModal';
import { StockTransferModal } from './StockTransferModal';
import { StoreWiseStockModal } from './StoreWiseStockModal';
import { OnlineGuestBookingModal } from './OnlineGuestBookingModal';
import { UnconfirmedBookingsModal } from './UnconfirmedBookingsModal';
import { UserManagementModal } from './UserManagementModal';
import { RolesPermissionsModal } from './RolesPermissionsModal';
import { ChainPropertyModal } from './ChainPropertyModal';
import { DeviceResponsivePreviewModal } from './DeviceResponsivePreviewModal';
import { WhatsAppSettingModal } from './WhatsAppSettingModal';
import { WhatsAppLogsModal } from './WhatsAppLogsModal';
import type { PmsBooking } from '../../types/pmsModels';

interface PmsHomeDashboardModalProps {
  onOpenRoomMatrix: () => void;
}

export const PmsHomeDashboardModal: React.FC<PmsHomeDashboardModalProps> = ({
  onOpenRoomMatrix
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [whatsAppMobile, setWhatsAppMobile] = useState('');

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [latestBooking, setLatestBooking] = useState<PmsBooking | null>(null);

  const [isKotOpen, setIsKotOpen] = useState(false);
  const [selectedKotTable, setSelectedKotTable] = useState<string | undefined>(undefined);
  const [isFoodBillOpen, setIsFoodBillOpen] = useState(false);
  const [selectedBillTable, setSelectedBillTable] = useState<string | undefined>(undefined);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdvanceReceiptOpen, setIsAdvanceReceiptOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isKitchenDashboardOpen, setIsKitchenDashboardOpen] = useState(false);
  const [isRestaurantKotOpen, setIsRestaurantKotOpen] = useState(false);
  const [isRoomKotRegisterOpen, setIsRoomKotRegisterOpen] = useState(false);
  const [isTableDashboardOpen, setIsTableDashboardOpen] = useState(false);
  const [isShiftTableOpen, setIsShiftTableOpen] = useState(false);
  const [isNcKotRegisterOpen, setIsNcKotRegisterOpen] = useState(false);
  const [isTableMasterOpen, setIsTableMasterOpen] = useState(false);
  const [isReceiptRegisterOpen, setIsReceiptRegisterOpen] = useState(false);
  const [isOutstandingReceivablesOpen, setIsOutstandingReceivablesOpen] = useState(false);
  const [isPaymentRegisterOpen, setIsPaymentRegisterOpen] = useState(false);

  // Video 19: Store & Inventory Modals
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isStockTransferOpen, setIsStockTransferOpen] = useState(false);
  const [stockTransferMode, setStockTransferMode] = useState<'transfer' | 'issue'>('transfer');
  const [isStoreWiseStockOpen, setIsStoreWiseStockOpen] = useState(false);

  // Video 20: Online Guest Booking Engine & Pending Confirmations
  const [isOnlineGuestBookingOpen, setIsOnlineGuestBookingOpen] = useState(false);
  const [isUnconfirmedBookingsOpen, setIsUnconfirmedBookingsOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Video 21: Multi-User, Roles & Permissions, Multi-Location & Multi-Device
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isRolesPermissionsOpen, setIsRolesPermissionsOpen] = useState(false);
  const [isChainPropertyOpen, setIsChainPropertyOpen] = useState(false);
  const [isDevicePreviewOpen, setIsDevicePreviewOpen] = useState(false);

  // Video 22: Auto WhatsApp SMS Integration & Outbox
  const [isWhatsAppSettingOpen, setIsWhatsAppSettingOpen] = useState(false);
  const [isWhatsAppLogsOpen, setIsWhatsAppLogsOpen] = useState(false);

  const rooms = PmsStore.getRooms();
  const vacantCount = rooms.filter(r => r.status === 'vacant').length;
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const dirtyCount = rooms.filter(r => r.status === 'dirty').length;
  const unprintedRoomKots = PmsStore.getUnprintedRoomKots();
  const unprintedRestaurantKots = PmsStore.getUnprintedRestaurantKots();
  const unconfirmedBookings = PmsStore.getUnconfirmedBookings();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB');
      const timeStr = now.toLocaleTimeString();
      setCurrentTime(`${dateStr} Time ${timeStr}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSendWhatsApp = () => {
    if (!whatsAppMobile.trim() || whatsAppMobile.length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    PmsStore.sendWhatsAppNotification({
      voucherType: 'Promotional',
      recipientMobile: whatsAppMobile,
      recipientName: 'Valued Guest',
      recipientType: 'Guest',
      openDirectly: true
    });
    setWhatsAppMobile('');
  };

  const handleCopyWebsiteLink = () => {
    const url = 'https://hotel-sai-vasudev-residency.pages.dev';
    navigator.clipboard.writeText(url);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  return (
    <div className="pms-content">
      {/* Top Brand & Metadata Banner from Frame 0100 */}
      <div className="home-hub-header">
        <h1 className="hotel-hub-title">
          HOTEL SAI VASUDEV RESIDENCY
        </h1>
        <div className="hotel-hub-meta">
          <span>Hotel Dashboard Date: {currentTime}</span>
          <span>&bull;</span>
          <span>Activation Date: 17-12-24 & Renew Date: 17-12-25 & Day Remaining: 194</span>
          <span
            className="whatsapp-badge"
            style={{ cursor: 'pointer' }}
            onClick={() => setIsWhatsAppSettingOpen(true)}
            title="Click to configure WhatsApp SMS Gateway & Message Templates"
          >
            WhatsApp Validity: 29-06-2026
          </span>
        </div>
      </div>

      {/* 16 Quick Module Action Tiles matching Frame 0100 */}
      <div className="home-tiles-grid">
        {/* Row 1 */}
        <button
          type="button"
          className="hub-tile-btn tile-room-dash"
          onClick={onOpenRoomMatrix}
        >
          <span className="tile-icon">🏠</span>
          <span>Room Dashboard</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-room-booking"
          onClick={() => setIsBookingOpen(true)}
        >
          <span className="tile-icon">📅</span>
          <span>Room Booking</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-check-in"
          onClick={() => setIsCheckInOpen(true)}
        >
          <span className="tile-icon">🚪➡️</span>
          <span>Room Check In</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-checkout"
          onClick={() => {
            const firstOccupied = rooms.find(r => r.status === 'occupied') || rooms[0];
            if (firstOccupied) {
              setIsCheckoutOpen(true);
            }
          }}
        >
          <span className="tile-icon">🚪⬅️</span>
          <span>Room Checkout</span>
        </button>

        {/* Row 2 */}
        <button
          type="button"
          className="hub-tile-btn tile-new-kot"
          onClick={() => setIsKotOpen(true)}
        >
          <span className="tile-icon">🍴</span>
          <span>New Kot</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-new-food-bill"
          onClick={() => setIsFoodBillOpen(true)}
        >
          <span className="tile-icon">🧾</span>
          <span>New Food Bill</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-advance-receipt"
          onClick={() => setIsAdvanceReceiptOpen(true)}
        >
          <span className="tile-icon">💵</span>
          <span>Room Advance Receipt</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-receipt"
          onClick={() => setIsReceiptRegisterOpen(true)}
        >
          <span className="tile-icon">📄</span>
          <span>Receipt</span>
        </button>

        {/* Row 3 */}
        <button
          type="button"
          className="hub-tile-btn tile-payment"
          onClick={() => setIsPaymentRegisterOpen(true)}
        >
          <span className="tile-icon">💳</span>
          <span>Payment</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-ledger"
          onClick={() => setIsLedgerOpen(true)}
        >
          <span className="tile-icon">📑</span>
          <span>Ledger</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-restaurant"
          onClick={() => setIsTableDashboardOpen(true)}
        >
          <span className="tile-icon">🏬</span>
          <span>Restaurant</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-purchase"
          onClick={() => setIsPurchaseOpen(true)}
          title="Video 19: Purchase Inward to Godown (/purchases/create)"
        >
          <span className="tile-icon">🛒</span>
          <span>Purchase</span>
        </button>

        {/* Row 4 */}
        <button
          type="button"
          className="hub-tile-btn tile-stock-transfer"
          onClick={() => {
            setStockTransferMode('transfer');
            setIsStockTransferOpen(true);
          }}
          title="Video 19: Stock Transfer (Main Store -> Kitchen)"
        >
          <span className="tile-icon">🔁</span>
          <span>Stock Transfer</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-stock-issue"
          onClick={() => {
            setStockTransferMode('issue');
            setIsStockTransferOpen(true);
          }}
          title="Video 19: Stock Issue & Consumption (Kitchen -> Consume)"
        >
          <span className="tile-icon">📦</span>
          <span>Stock Issue</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-report"
          onClick={() => setIsStoreWiseStockOpen(true)}
          title="Video 19: Store Wise Stock Report (/store_wise_stock)"
        >
          <span className="tile-icon">📈</span>
          <span>Store Report</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-room-dash"
          onClick={onOpenRoomMatrix}
        >
          <span className="tile-icon">🏢</span>
          <span>All 24 Rooms</span>
        </button>

        {/* Video 20: Online Booking Engine & Unconfirmed Bookings Tiles */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => setIsOnlineGuestBookingOpen(true)}
          style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff' }}
          title="Video 20: Online Public Guest Booking Engine (/hotel_room/DEMO0004)"
        >
          <span className="tile-icon">🌐</span>
          <span>Guest Web Booking</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => setIsUnconfirmedBookingsOpen(true)}
          style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#fff' }}
          title="Video 20: Unconfirmed Booking Register (/pending_booking)"
        >
          <span className="tile-icon">🔔</span>
          <span>Pending ({unconfirmedBookings.length})</span>
        </button>

        {/* Video 21: Multi-User, Roles & Permissions, Multi-Location & Mobile Tiles */}
        <button
          type="button"
          className="hub-tile-btn tile-users"
          onClick={() => setIsUserManagementOpen(true)}
          title="Video 21: Multi-User Account Management (/userprofile)"
        >
          <span className="tile-icon">👥</span>
          <span>User Accounts</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-roles"
          onClick={() => setIsRolesPermissionsOpen(true)}
          title="Video 21: Roles & 66 Granular Permissions Matrix (/roles)"
        >
          <span className="tile-icon">🛡️</span>
          <span>Roles &amp; Rights</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-properties"
          onClick={() => setIsChainPropertyOpen(true)}
          title="Video 21: Multi-Location Chain Hotels Switcher (/multilocation)"
        >
          <span className="tile-icon">🏨</span>
          <span>Chain Branches</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-mobile-preview"
          onClick={() => setIsDevicePreviewOpen(true)}
          title="Video 21: Mobile Responsive Device Simulator (Frame 0138)"
        >
          <span className="tile-icon">📱</span>
          <span>Mobile View</span>
        </button>

        {/* Video 22: Auto WhatsApp SMS Integration & Outbox Tiles */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => setIsWhatsAppSettingOpen(true)}
          style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff' }}
          title="Video 22: Automated WhatsApp SMS Settings & Templates (/whatsapp_sms)"
        >
          <span className="tile-icon">💬</span>
          <span>Auto WhatsApp</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => setIsWhatsAppLogsOpen(true)}
          style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#fff' }}
          title="Video 22: WhatsApp Message Outbox & Fraud Audit Logs (/whatsapp_logs)"
        >
          <span className="tile-icon">📜</span>
          <span>WhatsApp Logs</span>
        </button>
      </div>

      {/* Overview & Unprinted KOTs Notification Section matching Video 14 Frames 0145, 0230, 0255 */}
      <div style={{
        maxWidth: 1050,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: 6,
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {/* Left Side: Overview Table & Red Unprinted KOT Banners */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
            Overview
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 13, minWidth: 320 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', color: '#475569' }}>
                  <th style={{ padding: '6px 14px', textAlign: 'left', fontWeight: 700 }}>Room CheckIn</th>
                  <th style={{ padding: '6px 14px', textAlign: 'center', fontWeight: 700 }}>Vacant</th>
                  <th style={{ padding: '6px 14px', textAlign: 'center', fontWeight: 700 }}>Occupied</th>
                  <th style={{ padding: '6px 14px', textAlign: 'center', fontWeight: 700 }}>Dirty</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#0284c7' }}>
                    {occupiedCount > 0 ? occupiedCount : 1}
                  </td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>
                    {vacantCount}
                  </td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>
                    {occupiedCount}
                  </td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 700, color: '#dc2626' }}>
                    {dirtyCount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Video 14 Core Feature: Unprinted KOT Alerts below Overview Table (Frames 0145, 0230, 0255) */}
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {unprintedRoomKots.length > 0 && (
              <div
                onClick={() => setIsRoomKotRegisterOpen(true)}
                title="Click to view and print pending Room KOTs (Video 14)"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 12px',
                  background: '#fee2e2',
                  color: '#b91c1c',
                  border: '1px solid #f87171',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  width: 'fit-content',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
                <span style={{ fontSize: 13, animation: 'pulse 1.2s infinite' }}>🔴</span>
                <span style={{ textDecoration: 'underline' }}>
                  Room Kot Unprinted - {unprintedRoomKots.length}
                </span>
                <span style={{ fontSize: 11, background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: 10 }}>
                  Click to Print
                </span>
              </div>
            )}

            {unprintedRestaurantKots.length > 0 && (
              <div
                onClick={() => setIsRestaurantKotOpen(true)}
                title="Click to view and print pending Restaurant Table KOTs (Video 14)"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 12px',
                  background: '#fee2e2',
                  color: '#b91c1c',
                  border: '1px solid #f87171',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  width: 'fit-content',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
                <span style={{ fontSize: 13, animation: 'pulse 1.2s infinite' }}>🔴</span>
                <span style={{ textDecoration: 'underline' }}>
                  Restaurant Kot Unprinted - {unprintedRestaurantKots.length}
                </span>
                <span style={{ fontSize: 11, background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: 10 }}>
                  Click to Print
                </span>
              </div>
            )}

            {/* Video 20: Unconfirmed Online Bookings Banner */}
            {unconfirmedBookings.length > 0 && (
              <div
                onClick={() => setIsUnconfirmedBookingsOpen(true)}
                title="Click to review and confirm online guest room bookings (Video 20 Frame 0360)"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 12px',
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #f59e0b',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  width: 'fit-content',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
                <span style={{ fontSize: 13, animation: 'pulse 1.2s infinite' }}>🔔</span>
                <span style={{ textDecoration: 'underline' }}>
                  Unconfirmed Bookings - {unconfirmedBookings.length}
                </span>
                <span style={{ fontSize: 11, background: '#d97706', color: '#fff', padding: '1px 6px', borderRadius: 10 }}>
                  Review & Confirm
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: WhatsApp Promotion Tool from Frame 0100, 0145 & Video 20 Frame 0400 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <input
            type="tel"
            placeholder="Enter mobile no"
            value={whatsAppMobile}
            onChange={e => setWhatsAppMobile(e.target.value)}
            className="form-input-pms"
            style={{ width: 140 }}
          />
          <span style={{ fontSize: 20 }}>📢</span>
          <button
            type="button"
            onClick={handleSendWhatsApp}
            title="Send direct room reservation engine link via WhatsApp"
            style={{
              background: '#22c55e',
              color: '#ffffff',
              border: 'none',
              padding: '7px 12px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Send Website Link
          </button>
          <button
            type="button"
            onClick={handleCopyWebsiteLink}
            title="Copy portal URL to clipboard for website developer or guests"
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '7px 12px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {copyFeedback ? '✓ Copied!' : '📋 Copy Link'}
          </button>
          <button
            type="button"
            onClick={() => setIsOnlineGuestBookingOpen(true)}
            title="Launch guest room showcase & online reservation engine (/hotel_room)"
            style={{
              background: '#b91c1c',
              color: '#ffffff',
              border: 'none',
              padding: '7px 14px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🌐 Visit Website
          </button>
        </div>
      </div>

      {/* Submodals */}
      <NewRoomBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBookingCreated={(b) => {
          setIsBookingOpen(false);
          setLatestBooking(b);
          setIsReceiptOpen(true);
        }}
      />

      <NewRoomCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
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
        onClose={() => {
          setIsKotOpen(false);
          setSelectedKotTable(undefined);
        }}
        defaultTableNo={selectedKotTable}
        defaultServiceType={selectedKotTable ? 'Restaurant' : undefined}
        onKotSaved={() => {}}
      />

      <FoodBillModal
        isOpen={isFoodBillOpen}
        onClose={() => {
          setIsFoodBillOpen(false);
          setSelectedBillTable(undefined);
        }}
        defaultTableNo={selectedBillTable}
        onBillSaved={() => {}}
      />

      <RoomCheckOutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        targetRoom={rooms.find(r => r.status === 'occupied') || rooms[0]}
        onCheckoutComplete={() => {
          alert('Room checkout completed! Room status updated.');
        }}
      />

      <AdvanceReceiptModal
        isOpen={isAdvanceReceiptOpen}
        onClose={() => setIsAdvanceReceiptOpen(false)}
      />

      <PartyLedgerModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
      />

      <KitchenDashboardModal
        isOpen={isKitchenDashboardOpen}
        onClose={() => setIsKitchenDashboardOpen(false)}
        onOpenNewKot={() => setIsKotOpen(true)}
      />

      <RestaurantKotRegisterModal
        isOpen={isRestaurantKotOpen}
        onClose={() => setIsRestaurantKotOpen(false)}
        onOpenKitchenDashboard={() => setIsKitchenDashboardOpen(true)}
        onOpenNewKot={() => setIsKotOpen(true)}
      />

      <RestaurantTableDashboardModal
        isOpen={isTableDashboardOpen}
        onClose={() => setIsTableDashboardOpen(false)}
        onOpenKotForTable={(tbl) => {
          setSelectedKotTable(tbl);
          setIsKotOpen(true);
        }}
        onOpenBillForTable={(tbl) => {
          setSelectedBillTable(tbl);
          setIsFoodBillOpen(true);
        }}
        onOpenKitchenDashboard={() => setIsKitchenDashboardOpen(true)}
        onOpenKotRegister={() => setIsRestaurantKotOpen(true)}
      />

      <ShiftTableModal
        isOpen={isShiftTableOpen}
        onClose={() => setIsShiftTableOpen(false)}
      />

      <NcKotRegisterModal
        isOpen={isNcKotRegisterOpen}
        onClose={() => setIsNcKotRegisterOpen(false)}
        onOpenNewKot={() => {
          setSelectedKotTable('Table NC1');
          setIsKotOpen(true);
        }}
      />

      <TableMasterModal
        isOpen={isTableMasterOpen}
        onClose={() => setIsTableMasterOpen(false)}
      />

      {/* Video 14 Room KOT Register Modal (Frame 0260) */}
      <RoomKotRegisterModal
        isOpen={isRoomKotRegisterOpen}
        onClose={() => setIsRoomKotRegisterOpen(false)}
        onOpenKitchenDashboard={() => setIsKitchenDashboardOpen(true)}
        onOpenNewKot={() => setIsKotOpen(true)}
        filterServiceType="Room"
        titleOverride="Room KOT Register (Video 14 Frame 0260)"
      />

      {/* Video 15 General Receipt Register Modal (Frame 0090, 0250) */}
      <ReceiptRegisterModal
        isOpen={isReceiptRegisterOpen}
        onClose={() => setIsReceiptRegisterOpen(false)}
      />

      {/* Video 15 Outstanding Receivables Modal (Frame 0130) */}
      <OutstandingReceivablesModal
        isOpen={isOutstandingReceivablesOpen}
        onClose={() => setIsOutstandingReceivablesOpen(false)}
      />

      {/* Video 16 General Payment Register Modal (Frame 0200, 0290, 0320) */}
      <PaymentRegisterModal
        isOpen={isPaymentRegisterOpen}
        onClose={() => setIsPaymentRegisterOpen(false)}
      />

      {/* Video 19 Store & Inventory Modals */}
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

      {/* Video 20: Online Guest Booking Engine & Pending Confirmations */}
      <OnlineGuestBookingModal
        isOpen={isOnlineGuestBookingOpen}
        onClose={() => setIsOnlineGuestBookingOpen(false)}
      />

      <UnconfirmedBookingsModal
        isOpen={isUnconfirmedBookingsOpen}
        onClose={() => setIsUnconfirmedBookingsOpen(false)}
        onOpenNewBooking={() => setIsBookingOpen(true)}
        onOpenCheckInForBooking={() => {
          setIsCheckInOpen(true);
        }}
      />

      {/* Video 21: User Management Modal (/userprofile) */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
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
        onClose={() => setIsRolesPermissionsOpen(false)}
        onOpenUsers={() => {
          setIsRolesPermissionsOpen(false);
          setIsUserManagementOpen(true);
        }}
      />

      {/* Video 21: Multi-Location Chain Property Management Modal (/multilocation) */}
      <ChainPropertyModal
        isOpen={isChainPropertyOpen}
        onClose={() => setIsChainPropertyOpen(false)}
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
        onOpenRoomDashboard={onOpenRoomMatrix}
        onOpenKotEntry={() => setIsKotOpen(true)}
        onOpenCheckIn={() => setIsCheckInOpen(true)}
        onOpenFoodBill={() => setIsFoodBillOpen(true)}
      />

      {/* Video 22: Auto WhatsApp SMS Integration & Message Outbox Modals */}
      <WhatsAppSettingModal
        isOpen={isWhatsAppSettingOpen}
        onClose={() => setIsWhatsAppSettingOpen(false)}
        onOpenLogs={() => {
          setIsWhatsAppSettingOpen(false);
          setIsWhatsAppLogsOpen(true);
        }}
      />

      <WhatsAppLogsModal
        isOpen={isWhatsAppLogsOpen}
        onClose={() => setIsWhatsAppLogsOpen(false)}
        onOpenSettings={() => {
          setIsWhatsAppLogsOpen(false);
          setIsWhatsAppSettingOpen(true);
        }}
      />
    </div>
  );
};
