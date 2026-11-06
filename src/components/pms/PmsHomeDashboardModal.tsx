import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import { openPmsModal } from '../../services/pmsModalEvents';
import { ReceptionistNotificationBanner } from './ReceptionistNotificationBanner';
import './pmsStyles.css';

interface PmsHomeDashboardModalProps {
  onOpenRoomMatrix: () => void;
}

const PmsHeaderClock: React.FC = () => {
  const [time, setTime] = useState<string>('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(`${now.toLocaleDateString('en-GB')} Time ${now.toLocaleTimeString()}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);
  return <span>Hotel Dashboard Date: {time}</span>;
};

export const PmsHomeDashboardModal: React.FC<PmsHomeDashboardModalProps> = ({
  onOpenRoomMatrix
}) => {
  const [whatsAppMobile, setWhatsAppMobile] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [currentUser, setCurrentUser] = useState(PmsStore.getCurrentUser());
  const [boundaryToast, setBoundaryToast] = useState<string | null>(null);

  const rooms = PmsStore.getRooms();
  const vacantCount = rooms.filter(r => r.status === 'vacant').length;
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const dirtyCount = rooms.filter(r => r.status === 'dirty').length;
  const unprintedRoomKots = PmsStore.getUnprintedRoomKots();
  const unprintedRestaurantKots = PmsStore.getUnprintedRestaurantKots();
  const unconfirmedBookings = PmsStore.getUnconfirmedBookings();

  useEffect(() => {
    const handleUserChanged = () => {
      setCurrentUser(PmsStore.getCurrentUser());
    };
    window.addEventListener('pms_user_changed', handleUserChanged);
    return () => window.removeEventListener('pms_user_changed', handleUserChanged);
  }, []);

  const guardAction = (permissionKey: string, moduleName: string, action: () => void) => {
    if (PmsStore.hasPermission(permissionKey)) {
      action();
    } else {
      setBoundaryToast(`⛔ Access Denied (Security Boundary Guard): Active staff "${currentUser.userName}" (${currentUser.roleName}) is restricted from [${moduleName}]. Contact Super-Admin.`);
      setTimeout(() => setBoundaryToast(null), 5000);
    }
  };

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
          HOTEL SRI SAI VASUDEV RESIDENCY
        </h1>
        <div className="hotel-hub-meta">
          <PmsHeaderClock />
          <span>&bull;</span>
          <span>Activation Date: 17-12-24 & Renew Date: 17-12-25 & Day Remaining: 194</span>
          <span
            className="whatsapp-badge"
            style={{ cursor: 'pointer' }}
            onClick={() => openPmsModal('whatsapp_setting')}
            title="Click to configure WhatsApp SMS Gateway & Message Templates"
          >
            WhatsApp Validity: 29-06-2026
          </span>
          <ReceptionistNotificationBanner
            onOpenQrManager={() => openPmsModal('room_qr_manager')}
            onOpenOrderDetails={(o) => openPmsModal('guest_portal', { roomNo: o.room_no })}
          />
        </div>
      </div>

      {/* Staff Boundary Alert Banner */}
      {boundaryToast && (
        <div
          style={{
            background: '#dc2626',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: 4,
            marginBottom: 12,
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.25)',
            animation: 'slideDown 0.25s ease-out'
          }}
        >
          <span>{boundaryToast}</span>
          <button
            type="button"
            onClick={() => setBoundaryToast(null)}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 800, padding: '0 4px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top 20 Features Golden Spotlight Banner */}
      <div
        onClick={() => openPmsModal('top20_features')}
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: 6,
          marginBottom: 16,
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 10px rgba(217, 119, 6, 0.35)',
          cursor: 'pointer',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 6px 14px rgba(217, 119, 6, 0.45)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 10px rgba(217, 119, 6, 0.35)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🏆</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.3px' }}>
              Top 20 Enterprise Features | SRI SAI VASUDEV RESIDENCY ERP
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.9 }}>
              Anti-Theft Security &bull; Auto Dirty Status &bull; Instant Bill UPI QR &bull; Multi-Payment Splits &bull; Live Feature Showcase
            </div>
          </div>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.22)',
          padding: '6px 14px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
          border: '1px solid rgba(255, 255, 255, 0.4)'
        }}>
          Explore All 20 Features &rarr;
        </div>
      </div>

      {/* 16 Quick Module Action Tiles matching Frame 0100 */}
      <div className="home-tiles-grid">
        {/* Row 1 */}
        <button
          type="button"
          className="hub-tile-btn tile-room-dash"
          onClick={() => guardAction('Hotel Module', 'Room Dashboard', onOpenRoomMatrix)}
        >
          <div className="tile-top-row">
            <span className="tile-icon">🏠</span>
            <span className="tile-badge">{vacantCount} Vacant</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Room Dashboard</span>
            <span className="tile-subtitle">Visual Rack &amp; Live Status</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-room-booking"
          onClick={() => guardAction('roombooking', 'Room Booking', () => openPmsModal('new_booking'))}
        >
          <div className="tile-top-row">
            <span className="tile-icon">📅</span>
            <span className="tile-badge">F2</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Room Booking</span>
            <span className="tile-subtitle">Advance &amp; Group Bookings</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-check-in"
          onClick={() => guardAction('roomcheckin', 'Room Check In', () => openPmsModal('new_checkin'))}
        >
          <div className="tile-top-row">
            <span className="tile-icon">🚪➡️</span>
            <span className="tile-badge">F3</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Room Check In</span>
            <span className="tile-subtitle">Walk-In / Fast KYC</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-checkout"
          onClick={() => {
            guardAction('roomcheckout', 'Room Checkout', () => {
              const firstOccupied = rooms.find(r => r.status === 'occupied') || rooms[0];
              if (firstOccupied) {
                openPmsModal('direct_checkout', { targetRoom: firstOccupied });
              }
            });
          }}
        >
          <div className="tile-top-row">
            <span className="tile-icon">🚪⬅️</span>
            <span className="tile-badge">{occupiedCount} Occ</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Room Checkout</span>
            <span className="tile-subtitle">Settlement &amp; Invoicing</span>
          </div>
        </button>

        {/* Row 2 */}
        <button
          type="button"
          className="hub-tile-btn tile-new-kot"
          onClick={() => guardAction('kot', 'New Kot Entry', () => openPmsModal('kot_entry'))}
        >
          <div className="tile-top-row">
            <span className="tile-icon">🍴</span>
            <span className="tile-badge">{unprintedRoomKots.length + unprintedRestaurantKots.length} New</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">New Kot</span>
            <span className="tile-subtitle">Kitchen Order Ticket</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-new-food-bill"
          onClick={() => guardAction('foodbills', 'New Food Bill', () => openPmsModal('food_bill'))}
        >
          <div className="tile-top-row">
            <span className="tile-icon">🧾</span>
            <span className="tile-badge">F6</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">New Food Bill</span>
            <span className="tile-subtitle">Room &amp; Table POS Bill</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-advance-receipt"
          onClick={() => guardAction('advance_reciept', 'Room Advance Receipt', () => openPmsModal('advance_receipt'))}
        >
          <div className="tile-top-row">
            <span className="tile-icon">💵</span>
            <span className="tile-badge">F7</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Advance Receipt</span>
            <span className="tile-subtitle">Guest Booking Deposit</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-receipt"
          onClick={() => guardAction('receipt', 'Receipt Register', () => openPmsModal('receipt_register'))}
        >
          <div className="tile-top-row">
            <span className="tile-icon">📄</span>
            <span className="tile-badge">F8</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Receipt Register</span>
            <span className="tile-subtitle">Payment Collection Log</span>
          </div>
        </button>

        {/* Row 3 */}
        <button
          type="button"
          className="hub-tile-btn tile-payment"
          onClick={() => guardAction('payment', 'Payment Register', () => openPmsModal('payment_register'))}
        >
          <div className="tile-top-row">
            <span className="tile-icon">💳</span>
            <span className="tile-badge">F9</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Payment Register</span>
            <span className="tile-subtitle">Vendor &amp; Expense Outflow</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-ledger"
          onClick={() => guardAction('ledger', 'Party & Guest Ledger', () => openPmsModal('party_ledger'))}
        >
          <div className="tile-top-row">
            <span className="tile-icon">📑</span>
            <span className="tile-badge">F10</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Guest &amp; Party Ledger</span>
            <span className="tile-subtitle">Account Balance &amp; SOA</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-restaurant"
          onClick={() => guardAction('Restaurant Module', 'Restaurant Table Matrix', () => openPmsModal('table_dashboard'))}
        >
          <div className="tile-top-row">
            <span className="tile-icon">🏬</span>
            <span className="tile-badge">Table POS</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Restaurant POS</span>
            <span className="tile-subtitle">Dine-In, Bar &amp; Takeaway</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-purchase"
          onClick={() => guardAction('purchase', 'Purchase Inward', () => openPmsModal('purchase'))}
          title="Purchase Inward to Godown (/purchases/create)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🛒</span>
            <span className="tile-badge">Inward</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Purchase Inward</span>
            <span className="tile-subtitle">Vendor Bills &amp; Godown Entry</span>
          </div>
        </button>

        {/* Row 4 */}
        <button
          type="button"
          className="hub-tile-btn tile-stock-transfer"
          onClick={() => guardAction('Stock_Transfer', 'Stock Transfer', () => openPmsModal('stock_transfer', { mode: 'transfer' }))}
          title="Stock Transfer (Main Store -> Kitchen)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🔁</span>
            <span className="tile-badge">Transfer</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Stock Transfer</span>
            <span className="tile-subtitle">Main Godown to Kitchen</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-stock-issue"
          onClick={() => guardAction('Stock_Transfer', 'Stock Issue', () => openPmsModal('stock_transfer', { mode: 'issue' }))}
          title="Stock Issue & Consumption (Kitchen -> Consume)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">📦</span>
            <span className="tile-badge">Consume</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Stock Issue</span>
            <span className="tile-subtitle">Kitchen Consumption Log</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-report"
          onClick={() => guardAction('Store Wise Stock', 'Store Wise Stock Report', () => openPmsModal('store_wise_stock'))}
          title="Store Wise Stock Report (/store_wise_stock)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">📈</span>
            <span className="tile-badge">Stock Log</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Store Wise Stock</span>
            <span className="tile-subtitle">Godown Balance &amp; Reorder</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-room-dash"
          onClick={() => guardAction('Hotel Module', 'All 24 Rooms', onOpenRoomMatrix)}
        >
          <div className="tile-top-row">
            <span className="tile-icon">🏢</span>
            <span className="tile-badge">24 Keys</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">All 24 Rooms</span>
            <span className="tile-subtitle">Floor &amp; Category Matrix</span>
          </div>
        </button>
      </div>

      {/* Extended Enterprise Operations & Compliance Modules Header */}
      <div style={{
        maxWidth: 1100,
        margin: '24px auto 12px auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 4px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: 6
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>⚙️</span>
          <span>Extended Enterprise Operations &amp; Statutory Suite</span>
        </div>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>1-Click Fast Launch</span>
      </div>

      <div className="home-tiles-grid">
        {/* Online Booking Engine & Unconfirmed Bookings Tiles */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('online_guest_booking')}
          style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff' }}
          title="Online Public Guest Booking Engine (/hotel_room/DEMO0004)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🌐</span>
            <span className="tile-badge">Direct Engine</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Guest Web Booking</span>
            <span className="tile-subtitle">Public Portal /hotel_room</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => guardAction('Unconfirmed Bookings', 'Unconfirmed Bookings', () => openPmsModal('unconfirmed'))}
          style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#fff' }}
          title="Unconfirmed Booking Register (/pending_booking)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🔔</span>
            <span className="tile-badge">{unconfirmedBookings.length} Pending</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Pending Bookings</span>
            <span className="tile-subtitle">Online Approval Pipeline</span>
          </div>
        </button>

        {/* Multi-User, Roles & Permissions, Multi-Location & Mobile Tiles */}
        <button
          type="button"
          className="hub-tile-btn tile-users"
          onClick={() => guardAction('view user', 'User Accounts & Staff Shift Roster', () => openPmsModal('user_management'))}
          title="Staff Accounts & Duty Roster (/users)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">👥</span>
            <span className="tile-badge">Staff</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">User Accounts</span>
            <span className="tile-subtitle">Duty Roster &amp; Shifts</span>
          </div>
        </button>

        {/* Module 1: Staff Profiles, Monthly Salaries, and Advance Salary Tracking */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('staff_payroll')}
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: '#fff', fontWeight: 800 }}
          title="Staff Profiles, Monthly Salaries, Mid-Month Advance Tracking & Net Payouts"
        >
          <div className="tile-top-row">
            <span className="tile-icon">👷</span>
            <span className="tile-badge">HR &amp; Payroll</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Staff &amp; Payroll</span>
            <span className="tile-subtitle">Salaries, Advances &amp; Slips</span>
          </div>
        </button>

        {/* Module 2: EOD Expenditures & Detailed Revenue Analytics */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('eod_analytics')}
          style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', fontWeight: 800 }}
          title="Daily EOD Expenditures, Granular Subcategories & Room Category Revenue Matrix"
        >
          <div className="tile-top-row">
            <span className="tile-icon">📊</span>
            <span className="tile-badge">EOD Analytics</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">EOD &amp; Revenue</span>
            <span className="tile-subtitle">Expenses &amp; Categories</span>
          </div>
        </button>

        {/* Modules 3 & 4: 18-Room QR Standees & Room Service Portal */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('room_qr_manager')}
          style={{
            background: 'linear-gradient(135deg, #d4af37 0%, #b89628 100%)',
            color: '#0d1b2a',
            fontWeight: 800,
            border: '1.5px solid #fef08a'
          }}
          title="Generate 18-Room Standees, Download/Print QR Codes & Configure Tiered Amenities"
        >
          <div className="tile-top-row">
            <span className="tile-icon">📱</span>
            <span className="tile-badge" style={{ background: '#0d1b2a', color: '#d4af37' }}>QR Standees</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title" style={{ color: '#0d1b2a' }}>18-Room QR Portal</span>
            <span className="tile-subtitle" style={{ color: '#1e293b' }}>Standees &amp; Amenities</span>
          </div>
        </button>

        {/* Module 6: Chartered Accountant (CA) JSON Export Tile */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('ca_export')}
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#fff',
            fontWeight: 800,
            border: '1.5px solid #34d399'
          }}
          title="End-of-Month Chartered Accountant (CA) JSON Export, GSTR-1, Invoices, Food Bills & Tax Slabs"
        >
          <div className="tile-top-row">
            <span className="tile-icon">⚖️</span>
            <span className="tile-badge" style={{ background: '#064e3b', color: '#6ee7b7' }}>CA Export</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">CA JSON Export</span>
            <span className="tile-subtitle">Monthly Invoices &amp; Tax Pack</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-roles"
          onClick={() => guardAction('view role', 'Roles & Permissions Matrix', () => openPmsModal('roles_permissions'))}
          title="Roles & 72 Granular Permissions Matrix (/roles)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🛡️</span>
            <span className="tile-badge">72 Rights</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Roles &amp; Rights</span>
            <span className="tile-subtitle">Granular Permission Matrix</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-properties"
          onClick={() => guardAction('Setting', 'Chain Branches', () => openPmsModal('chain_property'))}
          title="Multi-Location Chain Properties Switcher (/multilocation)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🏨</span>
            <span className="tile-badge">Multi-Prop</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Chain Branches</span>
            <span className="tile-subtitle">Multi-Location Switcher</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-mobile-preview"
          onClick={() => openPmsModal('device_preview')}
          title="Mobile Responsive Device Simulator"
        >
          <div className="tile-top-row">
            <span className="tile-icon">📱</span>
            <span className="tile-badge">Emulator</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Mobile View</span>
            <span className="tile-subtitle">Responsive Device Simulator</span>
          </div>
        </button>

        {/* WhatsApp SMS Integration & Outbox Tiles */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('whatsapp_setting')}
          style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff' }}
          title="Automated WhatsApp SMS Settings & Templates (/whatsapp_sms)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">💬</span>
            <span className="tile-badge">API Active</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Auto WhatsApp</span>
            <span className="tile-subtitle">Guest SMS &amp; PDF Invoices</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('whatsapp_logs')}
          style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#fff' }}
          title="WhatsApp Message Outbox & Audit Logs (/whatsapp_logs)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">📜</span>
            <span className="tile-badge">Outbox</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">WhatsApp Logs</span>
            <span className="tile-subtitle">Transmission Audit Trail</span>
          </div>
        </button>

        {/* Police Station Front Office Report Tile */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => guardAction('Police Station Report', 'Police Station Report', () => openPmsModal('police_station_report'))}
          style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: '#1e293b', fontWeight: 800 }}
          title="Police Station Front Office Arrival & Departure Register (/police_station_report)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">👮</span>
            <span className="tile-badge">C-Form</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Police Report</span>
            <span className="tile-subtitle">Guest In/Out Register</span>
          </div>
        </button>

        {/* Online vs Offline Architecture Tile */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => guardAction('Setting', 'Online vs Offline Architecture', () => openPmsModal('online_vs_offline'))}
          style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', fontWeight: 800 }}
          title="Cloud vs Offline Architecture Comparison & Disaster Recovery Tools"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🌐</span>
            <span className="tile-badge">Hybrid</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Online vs Offline</span>
            <span className="tile-subtitle">Disaster Recovery &amp; Sync</span>
          </div>
        </button>

        {/* Bill Format Engine & Print Viewer */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('hotel_bill_format', { initialFormat: 'Format_3_A4_Standard' })}
          style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff', fontWeight: 800 }}
          title="Multi-Format Hotel Invoice Viewer (A4 Standard, Day-wise, Summary & A5 Compact)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🧾</span>
            <span className="tile-badge">4 Formats</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Bill Formats</span>
            <span className="tile-subtitle">A4, Day-Wise &amp; A5 Print</span>
          </div>
        </button>

        {/* Room Check Out Register */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => guardAction('roomcheckout', 'Check Out Register', () => openPmsModal('checkout_register'))}
          style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', fontWeight: 800 }}
          title="Hotel Room Check Out Register Table (/roomcheckouts)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">📋</span>
            <span className="tile-badge">Archive</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">CheckOut List</span>
            <span className="tile-subtitle">Historical Folio Archive</span>
          </div>
        </button>

        {/* Company Logo, UPI QR & Digital Assets */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => guardAction('Setting', 'Company Logo & Media', () => openPmsModal('company_branding', { tab: 'pictures' }))}
          style={{ background: 'linear-gradient(135deg, #ca8a04 0%, #a16207 100%)', color: '#fff', fontWeight: 800 }}
          title="Company Logo, UPI QR Code, Seal, and Signature Settings (/comp_pic_form)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🖼️</span>
            <span className="tile-badge">Branding</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Logo &amp; Assets</span>
            <span className="tile-subtitle">UPI QR &amp; Digital Seal</span>
          </div>
        </button>

        {/* Top 20 Features Showcase Tile */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('top20_features')}
          style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', color: '#fff', fontWeight: 800 }}
          title="Top 20 Enterprise Features & Master System Specifications"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🏆</span>
            <span className="tile-badge">Features</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Top 20 Features</span>
            <span className="tile-subtitle">PMS Capabilities Tour</span>
          </div>
        </button>

        {/* GST Reports */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('gst_reports', { tab: 'consolidated' })}
          style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff', fontWeight: 800 }}
          title="Room & Food Bill GST Report (23-Column Tax Audit Sheet)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">📜</span>
            <span className="tile-badge">CA Audit</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">GST Reports</span>
            <span className="tile-subtitle">23-Col GSTR-1 Audit Sheet</span>
          </div>
        </button>

        {/* B2B GST */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('gst_reports', { tab: 'b2b' })}
          style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', fontWeight: 800 }}
          title="B2B Register (Only GST Customer Invoices - GSTR-1 Table 4)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🏢</span>
            <span className="tile-badge">Table 4</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">B2B GST</span>
            <span className="tile-subtitle">Corporate Invoices With GST</span>
          </div>
        </button>

        {/* B2C GST */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('gst_reports', { tab: 'b2c' })}
          style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', color: '#fff', fontWeight: 800 }}
          title="B2C Register (Without GST Invoices - GSTR-1 Table 7)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">👥</span>
            <span className="tile-badge">Table 7</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">B2C GST</span>
            <span className="tile-subtitle">Retail Guest Invoices</span>
          </div>
        </button>

        {/* Master 28-Report Dashboard Tile */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('gst_reports', { tab: 'dashboard' })}
          style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', fontWeight: 800 }}
          title="Master Report Dashboard (/report_dashboard - All 28 Reports)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">📊</span>
            <span className="tile-badge">28 Reports</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Report Hub</span>
            <span className="tile-subtitle">Executive Hotel KPI Analytics</span>
          </div>
        </button>

        {/* Training & Support Helpdesk Suite Tiles */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('help_support', { tab: 'videos' })}
          style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', fontWeight: 800 }}
          title="System Guides & Training Hub (/helps)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🎥</span>
            <span className="tile-badge">Video</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Training Hub</span>
            <span className="tile-subtitle">Interactive Video Guides</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('help_support', { tab: 'remote' })}
          style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff', fontWeight: 800 }}
          title="Remote Desktop Assistance with UltraViewer & AnyDesk"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🖥️</span>
            <span className="tile-badge">Helpdesk</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Remote Support</span>
            <span className="tile-subtitle">AnyDesk &amp; UltraViewer</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('help_support', { tab: 'tickets' })}
          style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#fff', fontWeight: 800 }}
          title="Raise Support Ticket for IT Engineers"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🎫</span>
            <span className="tile-badge">IT Help</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Support Tickets</span>
            <span className="tile-subtitle">Engineer Service Desk</span>
          </div>
        </button>

        {/* Commissions */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('agent_commission')}
          style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', fontWeight: 800 }}
          title="Agent & Referral Commission Tracking, Directory & Payout Vouchers (/agent_commission)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🤝</span>
            <span className="tile-badge">Referrals</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Agent Commissions</span>
            <span className="tile-subtitle">Broker Ledger &amp; Payouts</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('top20_features')}
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: '#fff', fontWeight: 800 }}
          title="Key Enterprise Features Architecture & 1-Click Launch Hub"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🏆</span>
            <span className="tile-badge">Core PMS</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Top 15 Features</span>
            <span className="tile-subtitle">Architecture Launchpad</span>
          </div>
        </button>

        {/* Bar & Liquor Management */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('liquor_bar')}
          style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', color: '#fff', fontWeight: 800 }}
          title="Bar & Beverage POS, Peg Billing, VAT 13% + SUR 10%, ML Inventory & Stock (/liqour_stock_brand_wise)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🍷</span>
            <span className="tile-badge">Peg POS</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Liquor &amp; Bar</span>
            <span className="tile-subtitle">VAT 13% + SUR 10% Peg Bill</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('liquor_bar')}
          style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', fontWeight: 800 }}
          title="Brand-Wise Beverage Stock Ledger in ML and Bottle Equivalents"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🍾</span>
            <span className="tile-badge">ML Ledger</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Bar Stock (ML)</span>
            <span className="tile-subtitle">Brand-Wise ML Inventory</span>
          </div>
        </button>

        {/* No-Discount Item & Margin Protection Rules Tiles */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('no_discount_master')}
          style={{ background: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)', color: '#fff', fontWeight: 800 }}
          title="No-Discount Items, Price Integrity, Exemption Groups & Live Bill Margin Protection (/no_discount_master)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🛡️</span>
            <span className="tile-badge">Integrity</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">No-Discount Rules</span>
            <span className="tile-subtitle">Margin &amp; Price Guard</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('no_discount_master')}
          style={{ background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)', color: '#fff', fontWeight: 800 }}
          title="Live Bill Discount Simulator & Profit Margin Auditor"
        >
          <div className="tile-top-row">
            <span className="tile-icon">💰</span>
            <span className="tile-badge">Auditor</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Margin Protection</span>
            <span className="tile-subtitle">Bill Discount Simulator</span>
          </div>
        </button>

        {/* Stock Report & Inventory Control Tiles */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('store_wise_stock')}
          style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', fontWeight: 800 }}
          title="Store-Wise Stock Report, Multi-Godown Balance & Inventory (/store_wise_stock)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🏬</span>
            <span className="tile-badge">Godowns</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Store-Wise Stock</span>
            <span className="tile-subtitle">Multi-Godown Balance</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('stock_report')}
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: '#fff', fontWeight: 800 }}
          title="Consolidated Hotel Inventory & Linen Asset Ledger (/inventories)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">📊</span>
            <span className="tile-badge">Assets</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Stock Report Master</span>
            <span className="tile-subtitle">Hotel Linen &amp; Inventory</span>
          </div>
        </button>

        {/* Banquet Hall Billing & Event/Party Hall Invoice Demo */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('banquet_billing')}
          style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', fontWeight: 800 }}
          title="Banquet Hall Billing, Function Hall Booking & Event Tax Invoice (/roombookings/create)"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🏰</span>
            <span className="tile-badge">Events</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Banquet Billing</span>
            <span className="tile-subtitle">Event Invoices &amp; BEO</span>
          </div>
        </button>

        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => openPmsModal('banquet_billing')}
          style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: '#fff', fontWeight: 800 }}
          title="Banquet Tax Invoices, GST Breakdown & BEO Schedules"
        >
          <div className="tile-top-row">
            <span className="tile-icon">🧾</span>
            <span className="tile-badge">BEO Tax</span>
          </div>
          <div className="tile-bottom-col">
            <span className="tile-title">Event Invoices</span>
            <span className="tile-subtitle">Function Hall GST Receipts</span>
          </div>
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
                    {occupiedCount}
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

          {/* Unprinted KOT Alerts below Overview Table */}
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {unprintedRoomKots.length > 0 && (
              <div
                onClick={() => openPmsModal('room_kot_register')}
                title="Click to view and print pending Room KOTs"
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
                onClick={() => openPmsModal('restaurant_kot')}
                title="Click to view and print pending Restaurant Table KOTs"
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

            {/* Unconfirmed Online Bookings Banner */}
            {unconfirmedBookings.length > 0 && (
              <div
                onClick={() => openPmsModal('unconfirmed')}
                title="Click to review and confirm online guest room bookings"
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
                  Review &amp; Confirm
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: WhatsApp Promotion Tool */}
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
            onClick={() => openPmsModal('online_guest_booking')}
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
    </div>
  );
};
