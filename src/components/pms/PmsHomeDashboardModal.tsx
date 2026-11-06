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
import { StockReportMasterModal } from './StockReportMasterModal';
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
import { DayEndReportModal } from './DayEndReportModal';
import { ItemWiseSalesReportModal } from './ItemWiseSalesReportModal';
import { ItemWiseStockModal } from './ItemWiseStockModal';
import { GuestLogModal } from './GuestLogModal';
import { ShiftHandoverModal } from './ShiftHandoverModal';
import { HelpAndSupportModal } from './HelpAndSupportModal';
import { AgentCommissionModal } from './AgentCommissionModal';
import { LiquorBarManagementModal } from './LiquorBarManagementModal';
import { NoDiscountMasterModal } from './NoDiscountMasterModal';
import { BanquetHallBillingModal } from './BanquetHallBillingModal';
import { StaffPayrollManagementModal } from './StaffPayrollManagementModal';
import { EodExpenditureAnalyticsModal } from './EodExpenditureAnalyticsModal';
import { RoomQrCodeManagerModal } from './RoomQrCodeManagerModal';
import { ReceptionistNotificationBanner } from './ReceptionistNotificationBanner';
import { GuestRoomServicePortalPage } from '../guest/GuestRoomServicePortalPage';
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

  // Video 29: All Hotel Reports Master Suite
  const [isDayEndModalOpen, setIsDayEndModalOpen] = useState(false);
  const [isItemWiseSaleModalOpen, setIsItemWiseSaleModalOpen] = useState(false);
  const [isItemWiseStockModalOpen, setIsItemWiseStockModalOpen] = useState(false);
  const [isGuestLogModalOpen, setIsGuestLogModalOpen] = useState(false);
  const [isShiftHandoverModalOpen, setIsShiftHandoverModalOpen] = useState(false);
  const [outstandingMode, setOutstandingMode] = useState<'receivable' | 'payable'>('receivable');

  // Video 30: RoomG Training & Support Helpdesk Suite
  const [isHelpAndSupportOpen, setIsHelpAndSupportOpen] = useState(false);
  const [helpInitialTab, setHelpInitialTab] = useState<'videos' | 'tickets' | 'remote' | 'manual' | 'demo'>('videos');

  // Video 31: MR & Salesman Wise Commission Tracking & Top 15 PMS Features
  const [isAgentCommissionOpen, setIsAgentCommissionOpen] = useState(false);

  // Video 32: Liquor & Bar Management Software Suite (Frames 0080-0350)
  const [isLiquorBarOpen, setIsLiquorBarOpen] = useState(false);

  // Video 33: No-Discount Item & Margin Protection (Frames 0080-0202)
  const [isNoDiscountOpen, setIsNoDiscountOpen] = useState(false);

  // Video 35: Banquet Hall Billing & Event/Party Hall Invoice Demo
  const [isBanquetOpen, setIsBanquetOpen] = useState(false);

  // Module 1: Staff Profiles, Monthly Salaries, and Advance Salary Tracking
  const [isStaffPayrollOpen, setIsStaffPayrollOpen] = useState(false);

  // Module 2: End-of-Day (EOD) Expenditures & Detailed Revenue Analytics
  const [isEodAnalyticsOpen, setIsEodAnalyticsOpen] = useState(false);

  // Modules 3 & 4: Tiered Amenities & 18-Room QR Standee Self-Service Portal
  const [isRoomQrManagerOpen, setIsRoomQrManagerOpen] = useState(false);
  const [activeGuestPortalRoom, setActiveGuestPortalRoom] = useState<string | null>(null);

  const handleLaunchReportAction = (actionKey: string) => {
    switch (actionKey) {
      case 'no_discount':
      case 'margin_protection':
      case 'discount_rules':
        setIsNoDiscountOpen(true);
        break;
      case 'banquet_billing':
      case 'banquet_hall':
      case 'marriage_garden':
      case 'party_lawn':
        setIsBanquetOpen(true);
        break;
      case 'staff_payroll':
      case 'payroll':
      case 'salary_advance':
        setIsStaffPayrollOpen(true);
        break;
      case 'eod_analytics':
      case 'eod_expenditures':
      case 'revenue_analytics':
        setIsEodAnalyticsOpen(true);
        break;
      case 'liquor_bar':
      case 'bar_pos':
      case 'liquor_stock':
      case 'bar_management':
        setIsLiquorBarOpen(true);
        break;
      case 'agent_commission':
      case 'agent_ledger':
      case 'agent_master':
      case 'top15_features':
        setIsAgentCommissionOpen(true);
        break;
      case 'help_support':
      case 'video_tutorials':
        setHelpInitialTab('videos');
        setIsHelpAndSupportOpen(true);
        break;
      case 'support_ticket':
        setHelpInitialTab('tickets');
        setIsHelpAndSupportOpen(true);
        break;
      case 'remote_support':
        setHelpInitialTab('remote');
        setIsHelpAndSupportOpen(true);
        break;
      case 'documentation':
        setHelpInitialTab('manual');
        setIsHelpAndSupportOpen(true);
        break;
      case 'free_demo':
        setHelpInitialTab('demo');
        setIsHelpAndSupportOpen(true);
        break;
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
      case 'liqour_stock':
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
      case 'shift_table':
      case 'table_shift':
        setIsShiftTableOpen(true);
        break;
      case 'nc_kot_register':
      case 'nc_kot':
        setIsNcKotRegisterOpen(true);
        break;
      case 'table_master':
      case 'restaurant_tables':
      case 'manage_tables':
        setIsTableMasterOpen(true);
        break;
      case 'fb_report':
        setGstReportTab('consolidated');
        setIsGstReportsOpen(true);
        break;
      case 'room_dashboard':
        onOpenRoomMatrix();
        break;
      case 'outstanding_receivables':
        setOutstandingMode('receivable');
        setIsOutstandingReceivablesOpen(true);
        break;
      case 'outstanding_payable':
      case 'outstanding_payables':
        setOutstandingMode('payable');
        setIsOutstandingReceivablesOpen(true);
        break;
      case 'day_end':
        setIsDayEndModalOpen(true);
        break;
      case 'item_wise_sale':
        setIsItemWiseSaleModalOpen(true);
        break;
      case 'item_wise_stock':
        setIsItemWiseStockModalOpen(true);
        break;
      case 'guest_log':
        setIsGuestLogModalOpen(true);
        break;
      case 'shift_handover':
        setIsShiftHandoverModalOpen(true);
        break;
      case 'room_sales':
        setIsCheckOutRegisterOpen(true);
        break;
      case 'gst_report':
        setGstReportTab('consolidated');
        setIsGstReportsOpen(true);
        break;
      case 'b2b_gst':
        setGstReportTab('b2b');
        setIsGstReportsOpen(true);
        break;
      case 'b2c_gst':
        setGstReportTab('b2c');
        setIsGstReportsOpen(true);
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
      setBoundaryToast(`⛔ Access Denied (Security Boundary Guard): Active staff "${currentUser.userName}" (${currentUser.roleName}) is restricted from [${moduleName}]. Contact Super-Admin.`);
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
      case 'shift_table':
      case 'table_shift':
        setIsShiftTableOpen(true);
        break;
      case 'nc_kot_register':
      case 'nc_kot':
        setIsNcKotRegisterOpen(true);
        break;
      case 'table_master':
      case 'restaurant_tables':
      case 'manage_tables':
        setIsTableMasterOpen(true);
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
      case 'agent_commission':
        setIsAgentCommissionOpen(true);
        break;
      case 'top15_features':
        setIsAgentCommissionOpen(true);
        break;
      case 'top20_features':
        setIsTop20FeaturesOpen(true);
        break;
      case 'liquor_bar':
      case 'bar_management':
        setIsLiquorBarOpen(true);
        break;
      case 'no_discount':
      case 'margin_protection':
        setIsNoDiscountOpen(true);
        break;
      case 'banquet_billing':
      case 'banquet_hall':
      case 'marriage_garden':
      case 'party_lawn':
        setIsBanquetOpen(true);
        break;
      case 'staff_payroll':
      case 'payroll':
      case 'salary_advance':
        setIsStaffPayrollOpen(true);
        break;
      case 'eod_analytics':
      case 'eod_expenditures':
      case 'revenue_analytics':
        setIsEodAnalyticsOpen(true);
        break;
      case 'room_qr_standees':
      case 'room_service_portal':
        setIsRoomQrManagerOpen(true);
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
          HOTEL SRI SAI VASUDEV RESIDENCY
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
          <ReceptionistNotificationBanner
            onOpenQrManager={() => setIsRoomQrManagerOpen(true)}
            onOpenOrderDetails={(o) => setActiveGuestPortalRoom(o.room_no)}
          />
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
          onClick={() => guardAction('roombooking', 'Room Booking', () => setIsBookingOpen(true))}
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
          onClick={() => guardAction('roomcheckin', 'Room Check In', () => setIsCheckInOpen(true))}
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
                setIsCheckoutOpen(true);
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
          onClick={() => guardAction('kot', 'New Kot Entry', () => setIsKotOpen(true))}
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
          onClick={() => guardAction('foodbills', 'New Food Bill', () => setIsFoodBillOpen(true))}
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
          onClick={() => guardAction('advance_reciept', 'Room Advance Receipt', () => setIsAdvanceReceiptOpen(true))}
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
          onClick={() => guardAction('receipt', 'Receipt Register', () => setIsReceiptRegisterOpen(true))}
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
          onClick={() => guardAction('payment', 'Payment Register', () => setIsPaymentRegisterOpen(true))}
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
          onClick={() => guardAction('ledger', 'Party & Guest Ledger', () => setIsLedgerOpen(true))}
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
          onClick={() => guardAction('Restaurant Module', 'Restaurant Table Matrix', () => setIsTableDashboardOpen(true))}
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
          onClick={() => guardAction('purchase', 'Purchase Inward', () => setIsPurchaseOpen(true))}
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
          onClick={() => {
            guardAction('Stock_Transfer', 'Stock Transfer', () => {
              setStockTransferMode('transfer');
              setIsStockTransferOpen(true);
            });
          }}
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
          onClick={() => {
            guardAction('Stock_Transfer', 'Stock Issue', () => {
              setStockTransferMode('issue');
              setIsStockTransferOpen(true);
            });
          }}
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
          onClick={() => guardAction('Store Wise Stock', 'Store Wise Stock Report', () => setIsStoreWiseStockOpen(true))}
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
        {/* Video 20: Online Booking Engine & Unconfirmed Bookings Tiles */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => setIsOnlineGuestBookingOpen(true)}
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
          onClick={() => guardAction('Unconfirmed Bookings', 'Unconfirmed Bookings', () => setIsUnconfirmedBookingsOpen(true))}
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

        {/* Video 21 & 23: Multi-User, Roles & Permissions, Multi-Location & Mobile Tiles */}
        <button
          type="button"
          className="hub-tile-btn tile-users"
          onClick={() => guardAction('view user', 'User Accounts & Staff Shift Roster', () => setIsUserManagementOpen(true))}
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
          onClick={() => setIsStaffPayrollOpen(true)}
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
          onClick={() => setIsEodAnalyticsOpen(true)}
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
          onClick={() => setIsRoomQrManagerOpen(true)}
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

        <button
          type="button"
          className="hub-tile-btn tile-roles"
          onClick={() => guardAction('view role', 'Roles & Permissions Matrix', () => setIsRolesPermissionsOpen(true))}
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
          onClick={() => guardAction('Setting', 'Chain Branches', () => setIsChainPropertyOpen(true))}
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
          onClick={() => setIsDevicePreviewOpen(true)}
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

        {/* Video 22: Auto WhatsApp SMS Integration & Outbox Tiles */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => setIsWhatsAppSettingOpen(true)}
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
          onClick={() => setIsWhatsAppLogsOpen(true)}
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

        {/* Video 24: Police Station Front Office Report Tile (Frame 0100) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => guardAction('Police Station Report', 'Police Station Report', () => setIsPoliceReportOpen(true))}
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

        {/* Video 25: Online vs Offline Architecture & Disaster Recovery Tile (Frame 0070, 0120) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => guardAction('Setting', 'Online vs Offline Architecture', () => setIsOnlineVsOfflineOpen(true))}
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

        {/* Video 26: Bill Format Engine & Print Viewer (Frames 0115, 0170, 0195, 0215) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => { setSelectedBillCheckout(null); setActiveBillFormat('Format_3_A4_Standard'); setIsBillFormatOpen(true); }}
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

        {/* Video 26: Room Check Out Register (/roomcheckouts - Frame 0150) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => guardAction('roomcheckout', 'Check Out Register', () => setIsCheckOutRegisterOpen(true))}
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

        {/* Video 26: Company Logo, UPI QR & Digital Assets (/comp_pic_form - Frame 0240) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => guardAction('Setting', 'Company Logo & Media', () => { setCompanyBrandingTab('pictures'); setIsCompanyBrandingOpen(true); })}
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

        {/* Video 27: Top 20 Features Showcase Tile (Frames 0005-0815) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => setIsTop20FeaturesOpen(true)}
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

        {/* Video 28: Room & Food Bill GST Report Tile (Frames 0200, 0210, 0270) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => { setIsPaymentRegisterOpen(false); setIsReceiptRegisterOpen(false); setGstReportTab('consolidated'); setIsGstReportsOpen(true); }}
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

        {/* Video 28: B2B & B2C GST Register Tiles (Frames 0110, 0170) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => { setIsPaymentRegisterOpen(false); setIsReceiptRegisterOpen(false); setGstReportTab('b2b'); setIsGstReportsOpen(true); }}
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

        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => { setIsPaymentRegisterOpen(false); setIsReceiptRegisterOpen(false); setGstReportTab('b2c'); setIsGstReportsOpen(true); }}
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

        {/* Video 28: Master 28-Report Dashboard Tile (Frame 0100) */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => { setIsPaymentRegisterOpen(false); setIsReceiptRegisterOpen(false); setGstReportTab('dashboard'); setIsGstReportsOpen(true); }}
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

        {/* Video 30: RoomG Training & Support Helpdesk Suite Tiles */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => { setHelpInitialTab('videos'); setIsHelpAndSupportOpen(true); }}
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
          onClick={() => { setHelpInitialTab('remote'); setIsHelpAndSupportOpen(true); }}
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
          onClick={() => { setHelpInitialTab('tickets'); setIsHelpAndSupportOpen(true); }}
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

        {/* Video 31: MR & Salesman Wise Commission Tracking & Top 15 PMS Features Tiles */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => setIsAgentCommissionOpen(true)}
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
          onClick={() => setIsAgentCommissionOpen(true)}
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

        {/* Video 32: Liquor & Bar Management Software Suite Tiles */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => setIsLiquorBarOpen(true)}
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
          onClick={() => setIsLiquorBarOpen(true)}
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

        {/* Video 33: No-Discount Item & Margin Protection Rules Tiles */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => setIsNoDiscountOpen(true)}
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
          onClick={() => setIsNoDiscountOpen(true)}
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

        {/* Video 34: Stock Report & Inventory Control Tiles */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => setIsStoreWiseStockOpen(true)}
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
          onClick={() => setIsStoreWiseStockOpen(true)}
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

        {/* Video 35: Banquet Hall Billing & Event/Party Hall Invoice Demo */}
        <button
          type="button"
          className="hub-tile-btn"
          onClick={() => setIsBanquetOpen(true)}
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
          onClick={() => setIsBanquetOpen(true)}
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

          {/* Video 14 Core Feature: Unprinted KOT Alerts below Overview Table (Frames 0145, 0230, 0255) */}
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {unprintedRoomKots.length > 0 && (
              <div
                onClick={() => setIsRoomKotRegisterOpen(true)}
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
                onClick={() => setIsRestaurantKotOpen(true)}
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

            {/* Video 20: Unconfirmed Online Bookings Banner */}
            {unconfirmedBookings.length > 0 && (
              <div
                onClick={() => setIsUnconfirmedBookingsOpen(true)}
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
        onKotSaved={() => {
          setIsKotOpen(false);
          setSelectedKotTable(undefined);
        }}
      />

      <FoodBillModal
        isOpen={isFoodBillOpen}
        onClose={() => {
          setIsFoodBillOpen(false);
          setSelectedBillTable(undefined);
        }}
        defaultTableNo={selectedBillTable}
        onBillSaved={() => {
          setIsFoodBillOpen(false);
          setSelectedBillTable(undefined);
        }}
      />

      <RoomCheckOutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        targetRoom={rooms.find(r => r.status === 'occupied') || rooms[0]}
        onCheckoutComplete={() => {
          setIsCheckoutOpen(false);
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
        titleOverride="Room KOT Register"
      />

      {/* Video 15 General Receipt Register Modal (Frame 0090, 0250) */}
      <ReceiptRegisterModal
        isOpen={isReceiptRegisterOpen}
        onClose={() => setIsReceiptRegisterOpen(false)}
      />

      {/* Video 15 & 29 Outstanding Receivables (Dr) & Payables (Cr - Frame 0160) */}
      <OutstandingReceivablesModal
        isOpen={isOutstandingReceivablesOpen}
        onClose={() => setIsOutstandingReceivablesOpen(false)}
        initialMode={outstandingMode}
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

      <StockReportMasterModal
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

      {/* Video 29: All Hotel Reports Master Suite */}
      <DayEndReportModal
        isOpen={isDayEndModalOpen}
        onClose={() => setIsDayEndModalOpen(false)}
      />

      <ItemWiseSalesReportModal
        isOpen={isItemWiseSaleModalOpen}
        onClose={() => setIsItemWiseSaleModalOpen(false)}
      />

      <ItemWiseStockModal
        isOpen={isItemWiseStockModalOpen}
        onClose={() => setIsItemWiseStockModalOpen(false)}
      />

      <GuestLogModal
        isOpen={isGuestLogModalOpen}
        onClose={() => setIsGuestLogModalOpen(false)}
        onOpenRoomDashboard={onOpenRoomMatrix}
        onOpenCheckOut={() => setIsCheckOutRegisterOpen(true)}
      />

      <ShiftHandoverModal
        isOpen={isShiftHandoverModalOpen}
        onClose={() => setIsShiftHandoverModalOpen(false)}
      />

      {/* Video 30: RoomG Training & Support Helpdesk Suite */}
      <HelpAndSupportModal
        isOpen={isHelpAndSupportOpen}
        onClose={() => setIsHelpAndSupportOpen(false)}
        initialTab={helpInitialTab}
      />

      {/* Video 31: MR & Salesman Wise Commission Tracking & Top 15 PMS Features */}
      <AgentCommissionModal
        isOpen={isAgentCommissionOpen}
        onClose={() => setIsAgentCommissionOpen(false)}
        onLaunchFeature={handleLaunchFeatureFromTop20}
      />

      {/* Video 32: Liquor & Bar Management Software Suite */}
      <LiquorBarManagementModal
        isOpen={isLiquorBarOpen}
        onClose={() => setIsLiquorBarOpen(false)}
        onOpenTableDashboard={() => setIsTableDashboardOpen(true)}
      />

      {/* Video 33: No-Discount Item & Margin Protection Suite */}
      <NoDiscountMasterModal
        isOpen={isNoDiscountOpen}
        onClose={() => setIsNoDiscountOpen(false)}
        onOpenFoodBill={() => setIsFoodBillOpen(true)}
      />

      {/* Video 35: Banquet Hall Billing, Marriage Garden & Event Invoice Demo */}
      <BanquetHallBillingModal
        isOpen={isBanquetOpen}
        onClose={() => setIsBanquetOpen(false)}
      />

      {/* Module 1: Staff Profiles, Monthly Salaries, and Advance Salary Tracking */}
      <StaffPayrollManagementModal
        isOpen={isStaffPayrollOpen}
        onClose={() => setIsStaffPayrollOpen(false)}
      />

      {/* Module 2: End-of-Day (EOD) Expenditures & Detailed Revenue Analytics */}
      <EodExpenditureAnalyticsModal
        isOpen={isEodAnalyticsOpen}
        onClose={() => setIsEodAnalyticsOpen(false)}
      />

      {/* Modules 3 & 4: 18-Room QR Standee Generator & Tiered Amenities Modal */}
      <RoomQrCodeManagerModal
        isOpen={isRoomQrManagerOpen}
        onClose={() => setIsRoomQrManagerOpen(false)}
        onOpenGuestPortal={(roomNo) => setActiveGuestPortalRoom(roomNo)}
      />

      {/* Modules 3 & 4: In-PMS Guest Room Service Portal Preview */}
      {activeGuestPortalRoom && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          backgroundColor: '#0a0f1d',
          overflowY: 'auto'
        }}>
          <GuestRoomServicePortalPage
            initialRoomNo={activeGuestPortalRoom}
            onClose={() => setActiveGuestPortalRoom(null)}
          />
        </div>
      )}
    </div>
  );
};
