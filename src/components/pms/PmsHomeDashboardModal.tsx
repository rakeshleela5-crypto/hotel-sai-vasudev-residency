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
import { PoliceStationReportModal } from './PoliceStationReportModal';
import { OnlineVsOfflineModal } from './OnlineVsOfflineModal';
import { HotelBillFormatModal } from './HotelBillFormatModal';
import { CompanyBrandingModal } from './CompanyBrandingModal';
import { CheckOutRegisterModal } from './CheckOutRegisterModal';
import { Top20FeaturesModal } from './Top20FeaturesModal';
import { GstReportsModal } from './GstReportsModal';
import type { PmsBooking, BillFormatType, PmsCheckOutDetail, PmsGstReportTab } from '../../types/pmsModels';

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

  // Video 24: Police Station Report (Frames 0100, 0105, 0110, 0140)
  const [isPoliceReportOpen, setIsPoliceReportOpen] = useState(false);

  // Video 25: Online vs Offline Architecture & Disaster Recovery Modal (Frames 0120, 0280, 0350)
  const [isOnlineVsOfflineOpen, setIsOnlineVsOfflineOpen] = useState(false);

  // Video 26: Bill Format Engine & Company Branding Suite (Frames 0115, 0150, 0170, 0195, 0240, 0250)
  const [isBillFormatOpen, setIsBillFormatOpen] = useState(false);
  const [selectedBillCheckout, setSelectedBillCheckout] = useState<PmsCheckOutDetail | null>(null);
  const [activeBillFormat, setActiveBillFormat] = useState<BillFormatType>('Format_3_A4_Standard');
  const [isCompanyBrandingOpen, setIsCompanyBrandingOpen] = useState(false);
  const [companyBrandingTab, setCompanyBrandingTab] = useState<'pictures' | 'banking' | 'format' | 'company_info'>('pictures');
  const [isCheckOutRegisterOpen, setIsCheckOutRegisterOpen] = useState(false);

  // Video 27: Top 20 Features of RoomG PMS Master Navigator
  const [isTop20FeaturesOpen, setIsTop20FeaturesOpen] = useState(false);

  // Video 28: GST Tax Reports & CA Filing Suite
  const [isGstReportsOpen, setIsGstReportsOpen] = useState(false);
  const [gstReportTab, setGstReportTab] = useState<PmsGstReportTab>('consolidated');

  const handleLaunchReportAction = (actionKey: string) => {
    switch (actionKey) {
      case 'room_booking':
        setIsBookingOpen(true);
        break;
      case 'checkin_register':
        setIsCheckInOpen(true);
        break;
      case 'room_checkout':
      case 'checkout_register_only':
      case 'my_checkout_register':
        setIsCheckOutRegisterOpen(true);
        break;
      case 'food_bill':
      case 'restaurant_food_bills':
        setIsFoodBillOpen(true);
        break;
      case 'kot_entry':
        setIsKotOpen(true);
        break;
      case 'advance_receipt':
        setIsAdvanceReceiptOpen(true);
        break;
      case 'police_report':
        setIsPoliceReportOpen(true);
        break;
      case 'store_wise_stock':
        setIsStoreWiseStockOpen(true);
        break;
      case 'purchase_entry':
        setIsPurchaseOpen(true);
        break;
      case 'stock_transfer':
        setStockTransferMode('transfer');
        setIsStockTransferOpen(true);
        break;
      case 'stock_issue':
        setStockTransferMode('issue');
        setIsStockTransferOpen(true);
        break;
      case 'party_ledger':
        setIsLedgerOpen(true);
        break;
      case 'restaurant_table':
        setIsTableDashboardOpen(true);
        break;
      case 'fb_report':
        setGstReportTab('consolidated');
        setIsGstReportsOpen(true);
        break;
      case 'room_dashboard':
        onOpenRoomMatrix();
        break;
      default:
        break;
    }
  };

  // Video 23: Real-Time Active Staff & Role Boundary Controls
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
      setBoundaryToast(`⛔ Access Denied (Video 23 Anti-Theft Boundary): Active staff "${currentUser.userName}" (${currentUser.roleName}) is restricted from [${moduleName}]. Contact Super-Admin.`);
      setTimeout(() => setBoundaryToast(null), 5000);
    }
  };

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

  const handleLaunchFeatureFromTop20 = (targetModal: string) => {
    switch (targetModal) {
      case 'room_dashboard':
        onOpenRoomMatrix();
        break;
      case 'room_booking':
        setIsBookingOpen(true);
        break;
      case 'room_checkin':
        setIsCheckInOpen(true);
        break;
      case 'room_checkout':
        setIsCheckOutRegisterOpen(true);
        break;
      case 'kot_entry':
        setIsKotOpen(true);
        break;
      case 'food_bill':
        setIsFoodBillOpen(true);
        break;
      case 'advance_receipt':
        setIsAdvanceReceiptOpen(true);
        break;
      case 'roles_permissions':
        setIsRolesPermissionsOpen(true);
        break;
      case 'party_ledger':
        setIsLedgerOpen(true);
        break;
      case 'restaurant_table':
        setIsTableDashboardOpen(true);
        break;
      case 'purchase_entry':
        setIsPurchaseOpen(true);
        break;
      case 'stock_transfer':
        setStockTransferMode('transfer');
        setIsStockTransferOpen(true);
        break;
      case 'store_wise_stock':
        setIsStoreWiseStockOpen(true);
        break;
      case 'outstanding_receivables':
        setIsOutstandingReceivablesOpen(true);
        break;
      case 'whatsapp_setting':
        setIsWhatsAppSettingOpen(true);
        break;
      case 'company_branding':
        setCompanyBrandingTab('pictures');
        setIsCompanyBrandingOpen(true);
        break;
      case 'online_booking':
        setIsOnlineGuestBookingOpen(true);
        break;
      case 'gst_report':
        setGstReportTab('consolidated');
        setIsGstReportsOpen(true);
        break;
      default:
        break;
    }
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

      {/* Video 23: Staff Boundary Alert Banner */}
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

      {/* Video 27: Top 20 Features Golden Spotlight Banner (Frames 0005-0815) */}
      <div
        onClick={() => setIsTop20FeaturesOpen(true)}
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
              Top 20 Features of RoomG PMS | Best Hotel Software in India
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
          <span className="tile-icon">🏠</span>
          <span>Room Dashboard</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-room-booking"
          onClick={() => guardAction('roombooking', 'Room Booking', () => setIsBookingOpen(true))}
        >
          <span className="tile-icon">📅</span>
          <span>Room Booking</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-check-in"
          onClick={() => guardAction('roomcheckin', 'Room Check In', () => setIsCheckInOpen(true))}
        >
          <span className="tile-icon">🚪➡️</span>
          <span>Room Check In</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-checkout"
          onClick={() => {
            guardAction('roomcheckout', 'Room Checkout', () => {
              const firstOccupied = rooms.find(r => r.status === 'occupied') || rooms[0];
              if (firstOccupied) {
                setIsCheckoutOpen(true);
              }
            });
          }}
        >
          <span className="tile-icon">🚪⬅️</span>
          <span>Room Checkout</span>
        </button>

        {/* Row 2 */}
        <button
          type="button"
          className="hub-tile-btn tile-new-kot"
          onClick={() => guardAction('kot', 'New Kot Entry', () => setIsKotOpen(true))}
        >
          <span className="tile-icon">🍴</span>
          <span>New Kot</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-new-food-bill"
          onClick={() => guardAction('foodbills', 'New Food Bill', () => setIsFoodBillOpen(true))}
        >
          <span className="tile-icon">🧾</span>
          <span>New Food Bill</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-advance-receipt"
          onClick={() => guardAction('advance_reciept', 'Room Advance Receipt', () => setIsAdvanceReceiptOpen(true))}
        >
          <span className="tile-icon">💵</span>
          <span>Room Advance Receipt</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-receipt"
          onClick={() => guardAction('receipt', 'Receipt Register', () => setIsReceiptRegisterOpen(true))}
        >
          <span className="tile-icon">📄</span>
          <span>Receipt</span>
        </button>

        {/* Row 3 */}
        <button
          type="button"
          className="hub-tile-btn tile-payment"
          onClick={() => guardAction('payment', 'Payment Register', () => setIsPaymentRegisterOpen(true))}
        >
          <span className="tile-icon">💳</span>
          <span>Payment</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-ledger"
          onClick={() => guardAction('ledger', 'Party & Guest Ledger', () => setIsLedgerOpen(true))}
        >
          <span className="tile-icon">📑</span>
          <span>Ledger</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-restaurant"
          onClick={() => guardAction('Restaurant Module', 'Restaurant Table Matrix', () => setIsTableDashboardOpen(true))}
        >
          <span className="tile-icon">🏬</span>
          <span>Restaurant</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-purchase"
          onClick={() => guardAction('purchase', 'Purchase Inward', () => setIsPurchaseOpen(true))}
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
            guardAction('Stock_Transfer', 'Stock Transfer', () => {
              setStockTransferMode('transfer');
              setIsStockTransferOpen(true);
            });
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
            guardAction('Stock_Transfer', 'Stock Issue', () => {
              setStockTransferMode('issue');
              setIsStockTransferOpen(true);
            });
          }}
          title="Video 19: Stock Issue & Consumption (Kitchen -> Consume)"
        >
          <span className="tile-icon">📦</span>
          <span>Stock Issue</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-report"
          onClick={() => guardAction('Store Wise Stock', 'Store Wise Stock Report', () => setIsStoreWiseStockOpen(true))}
          title="Video 19: Store Wise Stock Report (/store_wise_stock)"
        >
          <span className="tile-icon">📈</span>
          <span>Store Report</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-room-dash"
          onClick={() => guardAction('Hotel Module', 'All 24 Rooms', onOpenRoomMatrix)}
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
          onClick={() => guardAction('Unconfirmed Bookings', 'Unconfirmed Bookings', () => setIsUnconfirmedBookingsOpen(true))}
          style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#fff' }}
          title="Video 20: Unconfirmed Booking Register (/pending_booking)"
        >
          <span className="tile-icon">🔔</span>
          <span>Pending ({unconfirmedBookings.length})</span>
        </button>

        {/* Video 21 & 23: Multi-User, Roles & Permissions, Multi-Location & Mobile Tiles */}
        <button
          type="button"
          className="hub-tile-btn tile-users"
          onClick={() => guardAction('view user', 'User Accounts & Staff Shift Roster', () => setIsUserManagementOpen(true))}
          title="Video 21 & 23: Staff Accounts & Duty Roster (/users)"
        >
          <span className="tile-icon">👥</span>
          <span>User Accounts</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-roles"
          onClick={() => guardAction('view role', 'Roles & Permissions Matrix', () => setIsRolesPermissionsOpen(true))}
          title="Video 21 & 23: Roles & 72 Granular Permissions Matrix (/roles)"
        >
          <span className="tile-icon">🛡️</span>
          <span>Roles &amp; Rights</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-properties"
          onClick={() => guardAction('Setting', 'Chain Branches', () => setIsChainPropertyOpen(true))}
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

        {/* Video 24: Police Station Front Office Report Tile (Frame 0100) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => guardAction('Police Station Report', 'Police Station Report', () => setIsPoliceReportOpen(true))}
          style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: '#1e293b', fontWeight: 800 }}
          title="Video 24: Police Station Front Office Arrival & Departure Register (/police_station_report)"
        >
          <span className="tile-icon">👮</span>
          <span>Police Report</span>
        </button>

        {/* Video 25: Online vs Offline Architecture & Disaster Recovery Tile (Frame 0070, 0120) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => guardAction('Setting', 'Online vs Offline Architecture', () => setIsOnlineVsOfflineOpen(true))}
          style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', fontWeight: 800 }}
          title="Video 25: Online vs Offline Architecture Comparison, Evaluator & Disaster Recovery Tools"
        >
          <span className="tile-icon">🌐</span>
          <span>Online/Offline</span>
        </button>

        {/* Video 26: Bill Format Engine & Print Viewer (Frames 0115, 0170, 0195, 0215) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => { setSelectedBillCheckout(null); setActiveBillFormat('Format_3_A4_Standard'); setIsBillFormatOpen(true); }}
          style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff', fontWeight: 800 }}
          title="Video 26: Multi-Format Hotel Invoice Viewer (A4 Standard, Day-wise, Summary & A5 Compact)"
        >
          <span className="tile-icon">🧾</span>
          <span>Bill Formats</span>
        </button>

        {/* Video 26: Room Check Out Register (/roomcheckouts - Frame 0150) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => guardAction('roomcheckout', 'Check Out Register', () => setIsCheckOutRegisterOpen(true))}
          style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', fontWeight: 800 }}
          title="Video 26: Hotel Room Check Out Register Table (/roomcheckouts)"
        >
          <span className="tile-icon">📋</span>
          <span>CheckOut List</span>
        </button>

        {/* Video 26: Company Logo, UPI QR & Digital Assets (/comp_pic_form - Frame 0240) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => guardAction('Setting', 'Company Logo & Media', () => { setCompanyBrandingTab('pictures'); setIsCompanyBrandingOpen(true); })}
          style={{ background: 'linear-gradient(135deg, #ca8a04 0%, #a16207 100%)', color: '#fff', fontWeight: 800 }}
          title="Video 26: Company Logo, UPI QR Code, Seal, and Signature Settings (/comp_pic_form)"
        >
          <span className="tile-icon">🖼️</span>
          <span>Logo &amp; Assets</span>
        </button>

        {/* Video 27: Top 20 Features Showcase Tile (Frames 0005-0815) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => setIsTop20FeaturesOpen(true)}
          style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', color: '#fff', fontWeight: 800 }}
          title="Video 27: Top 20 Features of RoomG PMS & Commercial Pricing Suite"
        >
          <span className="tile-icon">🏆</span>
          <span>Top 20 Features</span>
        </button>

        {/* Video 28: Room & Food Bill GST Report Tile (Frames 0200, 0210, 0270) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => { setGstReportTab('consolidated'); setIsGstReportsOpen(true); }}
          style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff', fontWeight: 800 }}
          title="Video 28: Room & Food Bill GST Report (23-Column Tax Audit Sheet)"
        >
          <span className="tile-icon">📜</span>
          <span>GST Reports</span>
        </button>

        {/* Video 28: B2B & B2C GST Register Tiles (Frames 0110, 0170) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => { setGstReportTab('b2b'); setIsGstReportsOpen(true); }}
          style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', fontWeight: 800 }}
          title="Video 28: B2B Register (Only GST Customer Invoices - GSTR-1 Table 4)"
        >
          <span className="tile-icon">🏢</span>
          <span>B2B GST</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => { setGstReportTab('b2c'); setIsGstReportsOpen(true); }}
          style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', color: '#fff', fontWeight: 800 }}
          title="Video 28: B2C Register (Without GST Invoices - GSTR-1 Table 7)"
        >
          <span className="tile-icon">👥</span>
          <span>B2C GST</span>
        </button>

        {/* Video 28: Master 28-Report Dashboard Tile (Frame 0100) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => { setGstReportTab('dashboard'); setIsGstReportsOpen(true); }}
          style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', fontWeight: 800 }}
          title="Video 28: Master Report Dashboard (/report_dashboard - All 28 Reports)"
        >
          <span className="tile-icon">📊</span>
          <span>Report Hub</span>
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

      {/* Video 24: Police Station Report Modal (Frames 0100, 0105, 0110, 0140) */}
      <PoliceStationReportModal
        isOpen={isPoliceReportOpen}
        onClose={() => setIsPoliceReportOpen(false)}
      />

      {/* Video 25: Online vs Offline Architecture & Disaster Recovery Modal (Frames 0120, 0280, 0350) */}
      <OnlineVsOfflineModal
        isOpen={isOnlineVsOfflineOpen}
        onClose={() => setIsOnlineVsOfflineOpen(false)}
      />

      {/* Video 26: Bill Format Engine & Print Viewer (Frames 0115, 0170, 0195, 0215) */}
      <HotelBillFormatModal
        isOpen={isBillFormatOpen}
        onClose={() => setIsBillFormatOpen(false)}
        initialCheckout={selectedBillCheckout}
        initialFormat={activeBillFormat}
        onOpenBrandingSettings={() => {
          setIsBillFormatOpen(false);
          setCompanyBrandingTab('pictures');
          setIsCompanyBrandingOpen(true);
        }}
      />

      {/* Video 26: Company Logo, Banking & Footer Suite (Frames 0240, 0250, 0270, 0280) */}
      <CompanyBrandingModal
        isOpen={isCompanyBrandingOpen}
        onClose={() => setIsCompanyBrandingOpen(false)}
        initialTab={companyBrandingTab}
      />

      {/* Video 26: Room Check Out Register Table (/roomcheckouts - Frame 0150) */}
      <CheckOutRegisterModal
        isOpen={isCheckOutRegisterOpen}
        onClose={() => setIsCheckOutRegisterOpen(false)}
        onOpenBillFormat={(checkout, format) => {
          setSelectedBillCheckout(checkout);
          setActiveBillFormat(format);
          setIsBillFormatOpen(true);
        }}
      />

      {/* Video 27: Top 20 Features Master Showcase & Pricing Modal */}
      <Top20FeaturesModal
        isOpen={isTop20FeaturesOpen}
        onClose={() => setIsTop20FeaturesOpen(false)}
        onLaunchFeature={handleLaunchFeatureFromTop20}
      />

      {/* Video 28: GST Tax Reports & Master Report Dashboard */}
      <GstReportsModal
        isOpen={isGstReportsOpen}
        onClose={() => setIsGstReportsOpen(false)}
        initialTab={gstReportTab}
        onLaunchReportAction={handleLaunchReportAction}
      />
    </div>
  );
};
