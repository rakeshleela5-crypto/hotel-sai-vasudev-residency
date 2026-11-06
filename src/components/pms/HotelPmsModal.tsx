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
import { StockReportMasterModal } from './StockReportMasterModal';
import { OnlineGuestBookingModal } from './OnlineGuestBookingModal';
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
import { NewRoomBookingModal } from './NewRoomBookingModal';
import { RoomCheckOutModal } from './RoomCheckOutModal';
import { HousekeepingTrackerModal } from './HousekeepingTrackerModal';
import { PettyExpenseModal } from './PettyExpenseModal';
import { Gstr1ExportModal } from './Gstr1ExportModal';
import { CloudflareR2StorageModal } from './CloudflareR2StorageModal';
import { HousekeepingDiscrepancyModal } from './HousekeepingDiscrepancyModal';
import { RfidKeyCardModal } from './RfidKeyCardModal';
import { MonthlyHotelSaleReportModal } from './MonthlyHotelSaleReportModal';
import { MonthlyRestaurantSaleReportModal } from './MonthlyRestaurantSaleReportModal';
import { StaffPayrollManagementModal } from './StaffPayrollManagementModal';
import { EodExpenditureAnalyticsModal } from './EodExpenditureAnalyticsModal';
import { RoomQrCodeManagerModal } from './RoomQrCodeManagerModal';
import { ReceptionistNotificationBanner } from './ReceptionistNotificationBanner';
import { GuestRoomServicePortalPage } from '../guest/GuestRoomServicePortalPage';
import { CharteredAccountantExportModal } from './CharteredAccountantExportModal';
import type { PmsUserAccount, PmsChainProperty, BillFormatType, PmsCheckOutDetail, PmsGstReportTab, PmsRoom } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import './pmsStyles.css';

interface HotelPmsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotelPmsModal: React.FC<HotelPmsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'hub'>('matrix');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [masterMenuOpen, setMasterMenuOpen] = useState(false);
  const [entryMenuOpen, setEntryMenuOpen] = useState(true);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [hotelMenuOpen, setHotelMenuOpen] = useState(false);
  const [activityMenuOpen, setActivityMenuOpen] = useState(false);
  const [otherSubmenuOpen, setOtherSubmenuOpen] = useState(false);
  const [settingMenuOpen, setSettingMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Direct Booking & Check Out Modals
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [selectedRoomForNewBooking, setSelectedRoomForNewBooking] = useState<PmsRoom | null>(null);
  const [isDirectCheckoutOpen, setIsDirectCheckoutOpen] = useState(false);
  const [selectedRoomForDirectCheckout, setSelectedRoomForDirectCheckout] = useState<PmsRoom | null>(null);

  // Calendar & Unconfirmed Bookings Modals
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isUnconfirmedOpen, setIsUnconfirmedOpen] = useState(false);
  const [isHousekeepingOpen, setIsHousekeepingOpen] = useState(false);
  const [isPettyExpenseOpen, setIsPettyExpenseOpen] = useState(false);
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
  const [otherMasterTab, setOtherMasterTab] = useState<'gst' | 'businessSource' | 'voucherType' | 'locker' | 'otherCharge'>('gst');

  // Video 09 Business Setting Modal (12 Hour vs 24 Hour Policy)
  const [isBusinessSettingOpen, setIsBusinessSettingOpen] = useState(false);

  // Video 10 Company Info Modal (Local vs Interstate GST & State Codes)
  const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState(false);
  const [, setRoomRefreshTrigger] = useState(0);

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
  const [allStaffUsers, setAllStaffUsers] = useState<PmsUserAccount[]>(PmsStore.getUsers());
  const [securityBanner, setSecurityBanner] = useState<string | null>(null);

  // Video 22: Auto WhatsApp SMS Integration & Message Outbox
  const [isWhatsAppSettingOpen, setIsWhatsAppSettingOpen] = useState(false);
  const [isWhatsAppLogsOpen, setIsWhatsAppLogsOpen] = useState(false);

  // Video 24: Police Station Report Modal (Frames 0100, 0105, 0110, 0140)
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

  // Video 27: Top 20 Features of RoomG PMS Master Navigator (Frames 0005-0815)
  const [isTop20FeaturesOpen, setIsTop20FeaturesOpen] = useState(false);

  // 10 Core Upgrade Modules Suite State
  const [isGstr1ExportOpen, setIsGstr1ExportOpen] = useState(false);
  const [isHousekeepingDiscrepancyOpen, setIsHousekeepingDiscrepancyOpen] = useState(false);
  const [isRfidKeyCardOpen, setIsRfidKeyCardOpen] = useState(false);
  const [isMonthlyHotelSaleOpen, setIsMonthlyHotelSaleOpen] = useState(false);
  const [isMonthlyRestaurantSaleOpen, setIsMonthlyRestaurantSaleOpen] = useState(false);

  // Video 28: GST Tax Reports & Master Report Dashboard (Frames 0080-0330)
  const [isGstReportsOpen, setIsGstReportsOpen] = useState(false);
  const [gstReportTab, setGstReportTab] = useState<PmsGstReportTab>('consolidated');

  // Video 29: All Hotel Reports Master Suite (Frames 0080-0550)
  const [isDayEndModalOpen, setIsDayEndModalOpen] = useState(false);
  const [isItemWiseSaleModalOpen, setIsItemWiseSaleModalOpen] = useState(false);
  const [isItemWiseStockModalOpen, setIsItemWiseStockModalOpen] = useState(false);
  const [isGuestLogModalOpen, setIsGuestLogModalOpen] = useState(false);
  const [isShiftHandoverModalOpen, setIsShiftHandoverModalOpen] = useState(false);
  const [outstandingMode, setOutstandingMode] = useState<'receivable' | 'payable'>('receivable');

  // Video 30: RoomG Training & Support Helpdesk Suite (Frames 0060-0230)
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
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

  // Cloudflare R2 Object Storage Explorer & Asset Manager
  const [isR2StorageOpen, setIsR2StorageOpen] = useState(false);

  // Module 1: Staff Profiles, Monthly Salaries & Advance Salary Tracking
  const [isStaffPayrollOpen, setIsStaffPayrollOpen] = useState(false);

  // Module 2: End-of-Day (EOD) Expenditures & Detailed Revenue Analytics
  const [isEodAnalyticsOpen, setIsEodAnalyticsOpen] = useState(false);

  // Modules 3 & 4: Tiered Amenities & 18-Room QR Standee Self-Service Portal
  const [isRoomQrManagerOpen, setIsRoomQrManagerOpen] = useState(false);
  const [activeGuestPortalRoom, setActiveGuestPortalRoom] = useState<string | null>(null);

  // Module 6: End-of-Month Chartered Accountant (CA) JSON Export
  const [isCaExportOpen, setIsCaExportOpen] = useState(false);

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
        setActiveTab('hub');
        break;
      case 'checkin_register':
        setIsCheckInRegisterOpen(true);
        break;
      case 'room_checkout':
      case 'checkout_register_only':
      case 'my_checkout_register':
        setIsCheckOutRegisterOpen(true);
        break;
      case 'food_bill':
      case 'restaurant_food_bills':
        setIsFoodBillModalOpen(true);
        break;
      case 'kot_entry':
        setIsKotModalOpen(true);
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
        setIsPartyLedgerOpen(true);
        break;
      case 'restaurant_table':
        setIsTableDashboardOpen(true);
        break;
      case 'fb_report':
        setIsFbbReportOpen(true);
        break;
      case 'room_dashboard':
        setActiveTab('matrix');
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
      case 'item_list':
        setItemMasterTab('list');
        setIsItemMasterOpen(true);
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
      case 'ca_export':
      case 'chartered_accountant':
      case 'monthly_ca_pack':
      case 'ca_json_export':
        setIsCaExportOpen(true);
        break;
      default:
        break;
    }
  };

  const handleLaunchFeatureFromTop20 = (targetModal: string) => {
    switch (targetModal) {
      case 'room_dashboard':
        setActiveTab('matrix');
        break;
      case 'room_booking':
        setActiveTab('hub');
        break;
      case 'booking_calendar':
        setIsCalendarOpen(true);
        break;
      case 'room_checkin':
        setIsNewCheckInOpen(true);
        break;
      case 'room_checkout':
        setIsCheckOutRegisterOpen(true);
        break;
      case 'kot_entry':
        setIsKotModalOpen(true);
        break;
      case 'food_bill':
        setIsFoodBillModalOpen(true);
        break;
      case 'advance_receipt':
        setIsAdvanceReceiptOpen(true);
        break;
      case 'roles_permissions':
        setIsRolesPermissionsOpen(true);
        break;
      case 'party_ledger':
        setIsPartyLedgerOpen(true);
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
      case 'ca_export':
      case 'chartered_accountant':
      case 'ca_json_export':
        setIsCaExportOpen(true);
        break;
      default:
        setActiveTab('hub');
        break;
    }
  };

  // Video 23: Real-Time Active Staff & Role Boundary Listener
  React.useEffect(() => {
    const handleUserChanged = () => {
      const u = PmsStore.getCurrentUser();
      setCurrentUser(u);
      setAllStaffUsers(PmsStore.getUsers());
    };
    window.addEventListener('pms_user_changed', handleUserChanged);
    return () => window.removeEventListener('pms_user_changed', handleUserChanged);
  }, []);

  // Real-Time Cloud Synchronization Bridge (PostgreSQL on Railway)
  const [syncStatus, setSyncStatus] = useState<{ isSyncing: boolean; text: string; status: 'online' | 'offline' }>({
    isSyncing: false,
    text: 'Railway DB Ready',
    status: 'online'
  });

  const handleSyncCloud = async () => {
    setSyncStatus(prev => ({ ...prev, isSyncing: true, text: 'Syncing...' }));
    const res = await PmsStore.syncWithCloudBackend();
    setSyncStatus({
      isSyncing: false,
      text: res.success ? 'Railway DB: Synced' : 'Offline Mode',
      status: res.success ? 'online' : 'offline'
    });
  };

  React.useEffect(() => {
    if (isOpen) {
      PmsStore.initCloudStore().finally(() => {
        handleSyncCloud();
      });
      const interval = setInterval(handleSyncCloud, 30000); // 30s auto sync polling
      return () => clearInterval(interval);
    }
  }, [isOpen]);


  const handleQuickSwitchUser = (user: PmsUserAccount) => {
    PmsStore.setCurrentUser(user);
    setCurrentUser(user);
    setUserDropdownOpen(false);
    setSecurityBanner(`⚡ Switched Active Staff to "${user.userName}" (${user.roleName}) &bull; ${user.department || 'Front Office'}. System boundaries & anti-theft guards active!`);
    setTimeout(() => setSecurityBanner(null), 4500);
  };

  const checkModuleAccess = (permissionKey: string, moduleName: string, onAllowed: () => void) => {
    if (PmsStore.hasPermission(permissionKey)) {
      setIsPaymentRegisterOpen(false);
      setIsReceiptRegisterOpen(false);
      setIsGstReportsOpen(false);
      onAllowed();
    } else {
      setSecurityBanner(`⛔ ACCESS DENIED (Security Boundary Active): Your active staff account "${currentUser.userName}" (${currentUser.roleName}) is restricted from accessing [${moduleName}]. Contact Super-Admin to update permissions in Roles & Rights (/roles).`);
      setTimeout(() => setSecurityBanner(null), 6000);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    // 1. Direct Room Number Match
    const allRooms = PmsStore.getRooms();
    const matchedRoom = allRooms.find(r => r.roomNo.toLowerCase() === query || `room ${r.roomNo.toLowerCase()}` === query);
    if (matchedRoom) {
      setActiveTab('matrix');
      if (matchedRoom.status === 'vacant') {
        setSelectedRoomForNewBooking(matchedRoom);
        setIsNewBookingModalOpen(true);
      } else if (matchedRoom.status === 'occupied') {
        setSelectedRoomForDirectCheckout(matchedRoom);
        setIsDirectCheckoutOpen(true);
      }
      return;
    }

    // 2. Keyword Router
    if (query.includes('book') || query.includes('reserv')) {
      setSelectedRoomForNewBooking(null);
      setIsNewBookingModalOpen(true);
    } else if (query.includes('checkin') || query.includes('check in')) {
      setIsNewCheckInOpen(true);
    } else if (query.includes('checkout') || query.includes('check out') || query.includes('billing')) {
      setIsCheckOutRegisterOpen(true);
    } else if (query.includes('kot') || query.includes('kitchen')) {
      setIsKotModalOpen(true);
    } else if (query.includes('food') || query.includes('fbb') || query.includes('restaurant')) {
      setIsFoodBillModalOpen(true);
    } else if (query.includes('police') || query.includes('c-form') || query.includes('c form')) {
      setIsPoliceReportOpen(true);
    } else if (query.includes('gst') || query.includes('tax') || query.includes('b2b') || query.includes('b2c')) {
      setGstReportTab('consolidated');
      setIsGstReportsOpen(true);
    } else if (query.includes('locker')) {
      setOtherMasterTab('locker');
      setIsOtherMasterOpen(true);
    } else if (query.includes('charge') || query.includes('extra bed') || query.includes('laundry')) {
      setOtherMasterTab('otherCharge');
      setIsOtherMasterOpen(true);
    } else if (query.includes('banquet') || query.includes('hall') || query.includes('event')) {
      setIsBanquetOpen(true);
    } else if (query.includes('bar') || query.includes('liquor')) {
      setIsLiquorBarOpen(true);
    } else if (query.includes('eod') || query.includes('expenditure') || query.includes('revenue analytics') || query.includes('payment mode')) {
      setIsEodAnalyticsOpen(true);
    } else if (query.includes('payroll') || query.includes('salary') || query.includes('advance') || query.includes('worker')) {
      setIsStaffPayrollOpen(true);
    } else if (query.includes('user') || query.includes('staff') || query.includes('role')) {
      setIsUserManagementOpen(true);
    } else if (query.includes('whatsapp') || query.includes('sms')) {
      setIsWhatsAppSettingOpen(true);
    } else if (query.includes('stock') || query.includes('store') || query.includes('inventory')) {
      setIsStoreWiseStockOpen(true);
    } else if (query.includes('table')) {
      setIsTableDashboardOpen(true);
    } else if (query.includes('housekeep') || query.includes('clean') || query.includes('dirty') || query.includes('maid')) {
      setIsHousekeepingOpen(true);
    } else if (query.includes('petty') || query.includes('expense') || query.includes('night audit') || query.includes('cash in hand')) {
      setIsPettyExpenseOpen(true);
    } else if (query.includes('calendar')) {
      setIsCalendarOpen(true);
    } else if (query.includes('r2') || query.includes('storage') || query.includes('cloud') || query.includes('bucket') || query.includes('media')) {
      setIsR2StorageOpen(true);
    } else {
      setActiveTab('matrix');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="pms-overlay" onClick={onClose}>
        <div className={`pms-window ${isMobileMode ? 'is-mobile-viewport' : ''}`} onClick={e => e.stopPropagation()}>
          {/* Master Header matching Video 01 & 02 */}
          {/* Master Header matching Video 01 & 02 */}
          <header className="pms-header">
            <div className="pms-header-left">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="pms-menu-toggle-btn"
                title="Toggle Menu"
              >
                ☰
              </button>
              <div className="pms-brand-col">
                <span className="pms-brand-main">HOTEL MANAGEMENT</span>
                <span className="pms-brand-sub">SYSTEM PMS</span>
              </div>

              <form onSubmit={handleSearch} className="pms-header-search">
                <input
                  type="text"
                  placeholder="Search room (101), guest, kot, gst, booking..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                  className="pms-search-input"
                />
                <button type="submit" className="pms-search-btn" title="Search room or feature">
                  🔍
                </button>
              </form>
            </div>

            <div className="pms-header-right">
              {/* Real-Time Railway Cloud DB Sync Button */}
              <button
                type="button"
                onClick={handleSyncCloud}
                disabled={syncStatus.isSyncing}
                title="Synchronize front desk terminal with Railway PostgreSQL & Cloudflare Pages"
                className="pms-header-btn"
                style={{
                  background: syncStatus.status === 'online' ? '#15803d' : '#475569',
                  color: '#ffffff',
                  cursor: syncStatus.isSyncing ? 'not-allowed' : 'pointer'
                }}
              >
                <span>🔄</span>
                <span>{syncStatus.isSyncing ? 'Syncing...' : syncStatus.text}</span>
              </button>

              {/* Quick Action Badges from Video 02 & Video 20 Transcripts */}
              <button
                type="button"
                onClick={() => setIsUnconfirmedOpen(true)}
                title="Click to view and confirm pending online guest bookings"
                className="pms-header-btn"
                style={{
                  background: unconfirmedCount > 0 ? '#e11d48' : '#f59e0b',
                  color: '#ffffff',
                  boxShadow: unconfirmedCount > 0 ? '0 0 8px rgba(225, 29, 72, 0.5)' : undefined
                }}
              >
                <span>🔔</span>
                <span>Unconfirmed ({unconfirmedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCalendarOpen(true)}
                title="Reservation Calendar"
                className="pms-header-btn"
                style={{ background: '#0284c7', color: '#ffffff' }}
              >
                <span>📅</span>
                <span>Calendar</span>
              </button>

              {/* 18-Room Live Housekeeping Tracker */}
              <button
                type="button"
                onClick={() => setIsHousekeepingOpen(true)}
                title="Click to view 18-Room Live Housekeeping & Maintenance Kanban Board"
                className="pms-header-btn"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', color: '#ffffff' }}
              >
                <span>🧹</span>
                <span>Housekeeping</span>
              </button>

              {/* Petty Cash & Daily Night Audit Ledger */}
              <button
                type="button"
                onClick={() => setIsPettyExpenseOpen(true)}
                title="Petty Cash float & Run 1-Click Night Audit"
                className="pms-header-btn"
                style={{ background: 'linear-gradient(135deg, #ca8a04 0%, #a16207 100%)', color: '#ffffff' }}
              >
                <span>💰</span>
                <span>Cash &amp; Night Audit</span>
              </button>

              {/* Cloudflare R2 Object Storage Explorer & Asset Manager */}
              <button
                type="button"
                onClick={() => setIsR2StorageOpen(true)}
                title="Cloudflare R2 Object Storage — Manage property images, KYC documents, backups"
                className="pms-header-btn"
                style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', color: '#ffffff' }}
              >
                <span>☁️</span>
                <span>Cloudflare R2</span>
              </button>

              {/* Video 21: Active Chain Property Selector */}
              <button
                type="button"
                onClick={() => setIsChainPropertyOpen(true)}
                title={`${currentProperty.firmName} — ${currentProperty.location} (Click to switch branch)`}
                className="pms-header-btn"
                style={{ background: '#047857', color: '#ffffff' }}
              >
                <span>📍</span>
                <span>Rayagada (Main)</span>
              </button>

              {/* Video 21: Mobile Responsive View Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !isMobileMode;
                  setIsMobileMode(next);
                  if (next) {
                    setSidebarOpen(false);
                  }
                }}
                title={isMobileMode ? "Switch back to Desktop View" : "Toggle Mobile Responsive View"}
                className="pms-header-btn"
                style={{
                  background: isMobileMode ? '#e11d48' : '#7c3aed',
                  color: '#ffffff',
                  boxShadow: isMobileMode ? '0 0 10px rgba(225, 29, 72, 0.6)' : undefined
                }}
              >
                <span>📱</span>
                <span>{isMobileMode ? 'Exit Mobile' : 'Mobile View'}</span>
              </button>

              {/* Video 22: WhatsApp Validity & Gateway Status Badge */}
              <button
                type="button"
                onClick={() => setIsWhatsAppSettingOpen(true)}
                title="WhatsApp SMS Gateway: Active & Valid until 29-06-2026 (Click to manage)"
                className="pms-header-btn"
                style={{ background: '#059669', color: '#ffffff' }}
              >
                <span>🟢</span>
                <span>WhatsApp Active</span>
              </button>

              {/* Video 25: Online vs Offline Architecture & Disaster Recovery Badge */}
              <button
                type="button"
                onClick={() => setIsOnlineVsOfflineOpen(true)}
                title="Click to view Cloud vs Offline Architecture Matrix & Disaster Recovery Tools"
                className="pms-header-btn"
                style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff' }}
              >
                <span>🌐</span>
                <span>Hybrid Sync</span>
              </button>

              {/* Video 27: Top 20 Features of RoomG PMS Master Navigator */}
              <button
                type="button"
                onClick={() => setIsTop20FeaturesOpen(true)}
                title="Click to explore all 20 Master Enterprise Features of Hotel ERP"
                className="pms-header-btn"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#0f172a',
                  border: '1px solid #fef08a'
                }}
              >
                <span>🏆</span>
                <span>Top 20 Features</span>
              </button>

              {/* Video 28: GST Tax Reports & CA Filing Suite */}
              <button
                type="button"
                onClick={() => { setGstReportTab('consolidated'); setIsGstReportsOpen(true); }}
                title="Click to view Room & Food GST Reports, B2B, B2C and Report Hub"
                className="pms-header-btn"
                style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#ffffff' }}
              >
                <span>📜</span>
                <span>GST Reports</span>
              </button>

              {/* Module 1: Staff Profiles, Monthly Salaries & Advance Salary Tracking */}
              <button
                type="button"
                onClick={() => setIsStaffPayrollOpen(true)}
                title="Manage Staff Profiles, Departments, Monthly Salaries & Advance Deductions"
                className="pms-header-btn"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                  color: '#ffffff',
                  border: '1px solid #818cf8'
                }}
              >
                <span>👷</span>
                <span>Staff &amp; Payroll</span>
              </button>

              {/* Module 2: EOD Expenditures & Detailed Revenue Analytics */}
              <button
                type="button"
                onClick={() => setIsEodAnalyticsOpen(true)}
                title="End-of-Day (EOD) Expenditures, Subcategories & Room Category Revenue Breakdown"
                className="pms-header-btn"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: '1px solid #38bdf8'
                }}
              >
                <span>📊</span>
                <span>EOD &amp; Revenue</span>
              </button>

              {/* Modules 3 & 4: 18-Room QR Standees & Room Service Manager */}
              <button
                type="button"
                onClick={() => setIsRoomQrManagerOpen(true)}
                title="18-Room QR Standee Generator, Download/Print Standees & Tiered Amenities Configuration"
                className="pms-header-btn"
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #b89628 100%)',
                  color: '#0d1b2a',
                  border: '1px solid #fef08a',
                  fontWeight: 800
                }}
              >
                <span>📱</span>
                <span>18-Room QR Standees</span>
              </button>

              {/* Modules 3 & 4: Receptionist Real-Time Order Alerts & Chime Banner */}
              <ReceptionistNotificationBanner
                onOpenQrManager={() => setIsRoomQrManagerOpen(true)}
                onOpenOrderDetails={(ord) => setActiveGuestPortalRoom(ord.room_no)}
              />

              {/* Video 30: Training & Support Suite Button */}
              <button
                type="button"
                onClick={() => { setHelpInitialTab('videos'); setIsHelpAndSupportOpen(true); }}
                title="Click to access System Guides, Support Tickets, Remote Support & User Manual"
                className="pms-header-btn"
                style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff' }}
              >
                <span>🎓</span>
                <span>Training &amp; Support</span>
              </button>

              {/* Video 31: MR & Salesman Commission Hub Button */}
              <button
                type="button"
                onClick={() => setIsAgentCommissionOpen(true)}
                title="Click to manage Agent & Referral Commissions, Directory & Key Features"
                className="pms-header-btn"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: '1px solid #6ee7b7'
                }}
              >
                <span>🤝</span>
                <span>Agent Commissions</span>
              </button>

              {/* Video 32: Liquor & Bar Management Software Button */}
              <button
                type="button"
                onClick={() => setIsLiquorBarOpen(true)}
                title="Click to manage Bar & Beverage Inventory, Peg Billing, VAT 13% + SUR 10%, and ML Stock"
                className="pms-header-btn"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  color: '#ffffff',
                  border: '1px solid #f87171'
                }}
              >
                <span>🍷</span>
                <span>Liquor &amp; Bar</span>
              </button>

              {/* Video 33: No-Discount Item & Margin Protection Control */}
              <button
                type="button"
                onClick={() => setIsNoDiscountOpen(true)}
                title="Click to configure No-Discount Items, Price Integrity, and Exemption Rules"
                className="pms-header-btn"
                style={{
                  background: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
                  color: '#ffffff',
                  border: '1px solid #fde68a'
                }}
              >
                <span>🛡️</span>
                <span>No-Discount Control</span>
              </button>

              {/* Video 34: Stock Report & Inventory Control Suite */}
              <button
                type="button"
                onClick={() => setIsStoreWiseStockOpen(true)}
                title="Click to view Store Wise Stock, Consolidated Inventories, Simulator & Linen Control"
                className="pms-header-btn"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: '1px solid #7dd3fc'
                }}
              >
                <span>🏬</span>
                <span>Stock Report</span>
              </button>

              {/* Video 35: Banquet Hall Billing & Event/Party Hall Invoice Demo */}
              <button
                type="button"
                onClick={() => setIsBanquetOpen(true)}
                title="Click to manage Banquet Halls, Event Catering, Multi-Room Linking & Tax Invoices"
                className="pms-header-btn"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: '1px solid #6ee7b7'
                }}
              >
                <span>🏰</span>
                <span>Banquet &amp; Events</span>
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
                      boxShadow: '0 10px 25px -3px rgba(0,0,0,0.6)',
                      width: 280,
                      zIndex: 1000,
                      overflow: 'hidden',
                      fontSize: 12
                    }}
                  >
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #334155', background: '#0f172a' }}>
                      <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{currentUser.userName}</span>
                        <span style={{ fontSize: 10, background: '#2563eb', color: '#fff', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                          {currentUser.roleName}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#38bdf8', marginTop: 2 }}>Dept: {currentUser.department || 'Front Office'}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Branch: {currentProperty.firmId} - {currentProperty.firmName}</div>
                    </div>

                    {/* Video 23: Quick Role & Staff Switcher */}
                    <div style={{ padding: '6px 10px', background: '#111827', borderBottom: '1px solid #334155' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                        ⚡ Quick Switch Staff
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3, maxHeight: 160, overflowY: 'auto' }}>
                        {allStaffUsers.slice(0, 8).map(u => {
                          const isActive = u.id === currentUser.id || u.userName === currentUser.userName;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => handleQuickSwitchUser(u)}
                              style={{
                                background: isActive ? 'linear-gradient(90deg, #1d4ed8 0%, #1e40af 100%)' : '#1e293b',
                                color: isActive ? '#ffffff' : '#cbd5e1',
                                border: isActive ? '1px solid #60a5fa' : '1px solid #334155',
                                borderRadius: 4,
                                padding: '4px 8px',
                                fontSize: 11,
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                              title={`Switch active login to ${u.userName} (${u.roleName})`}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>{isActive ? '●' : '○'}</span>
                                <span style={{ fontWeight: 700 }}>{u.userName}</span>
                              </div>
                              <span style={{
                                fontSize: 9,
                                background: isActive ? '#3b82f6' : '#334155',
                                padding: '1px 5px',
                                borderRadius: 3,
                                color: isActive ? '#fff' : '#94a3b8'
                              }}>
                                {u.roleName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      onClick={() => { setUserDropdownOpen(false); setIsUserManagementOpen(true); }}
                      style={{ padding: '8px 12px', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      👥 User Accounts &amp; Staff Shift Roster (/users)
                    </div>
                    <div
                      onClick={() => { setUserDropdownOpen(false); setIsStaffPayrollOpen(true); }}
                      style={{ padding: '8px 12px', color: '#a5b4fc', cursor: 'pointer', borderBottom: '1px solid #334155', fontWeight: 700 }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      👷 Staff Profiles, Advances &amp; Monthly Payroll
                    </div>
                    <div
                      onClick={() => { setUserDropdownOpen(false); setIsRolesPermissionsOpen(true); }}
                      style={{ padding: '8px 12px', color: '#fbbf24', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      🛡️ Roles &amp; Permissions Matrix (72 Permissions)
                    </div>
                    <div
                      onClick={() => { setUserDropdownOpen(false); setIsWhatsAppSettingOpen(true); }}
                      style={{ padding: '8px 12px', color: '#4ade80', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      💬 WhatsApp SMS Setting (/whatsapp_sms)
                    </div>
                    <div
                      onClick={() => { setUserDropdownOpen(false); setIsWhatsAppLogsOpen(true); }}
                      style={{ padding: '8px 12px', color: '#fb923c', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      📜 WhatsApp Outbox Logs (/whatsapp_logs)
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

          {/* Video 23: Dynamic Permission & Boundary Banner */}
          {securityBanner && (
            <div
              style={{
                background: securityBanner.startsWith('⛔') ? '#dc2626' : '#059669',
                color: '#ffffff',
                padding: '7px 16px',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
                animation: 'slideDown 0.25s ease-out',
                zIndex: 900
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{securityBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setSecurityBanner(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 14,
                  cursor: 'pointer',
                  fontWeight: 800,
                  padding: '0 4px'
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Master PMS Body Layout */}
          <div className="pms-body">
            {/* Slide-over backdrop overlay for mobile drawer */}
            <div
              className={`pms-sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
              onClick={() => setSidebarOpen(false)}
            />

            {/* Left Dark Sidebar matching Frames 0005, 0020, 0065, 0090 */}
            <aside className={`pms-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div
                  className={`pms-nav-item ${activeTab === 'matrix' ? 'active' : ''}`}
                  onClick={() => checkModuleAccess('Hotel Module', 'Room Dashboard', () => setActiveTab('matrix'))}
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
                        <div className="pms-nav-item" onClick={() => { setOtherMasterTab('locker'); setIsOtherMasterOpen(true); }}>
                          <span style={{ color: '#38bdf8', fontWeight: 600 }}>🔒 Locker Master</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => { setOtherMasterTab('gst'); setIsOtherMasterOpen(true); }}>
                          <span>⚖️ GST,TAX,VAT</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => { setOtherMasterTab('businessSource'); setIsOtherMasterOpen(true); }}>
                          <span>🌐 Business Source</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => { setOtherMasterTab('otherCharge'); setIsOtherMasterOpen(true); }}>
                          <span style={{ color: '#a3e635', fontWeight: 600 }}>➕ Other Charge Master</span>
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
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Hotel Module', 'Room Booking', () => { setSelectedRoomForNewBooking(null); setIsNewBookingModalOpen(true); })}>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>🏨 Advance Room Reservation</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Check-in Register', 'Room Check In Register', () => setIsCheckInRegisterOpen(true))}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>📋 Room Check In Register</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('roomcheckin', 'New Check In', () => setIsNewCheckInOpen(true))}>
                      <span>🚪 New Check In</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Hotel Module', 'Room Shifting', () => { setSelectedRoomForShift(undefined); setIsRoomShiftOpen(true); })}>
                      <span style={{ color: '#06b6d4', fontWeight: 800 }}>🔄 Room Shifting</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('kot', 'Room Service KOT Entry', () => setIsKotModalOpen(true))}>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>🍴 Room Service (KOT Entry)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Kot Register', 'Room KOT Register', () => setIsRoomKotRegisterOpen(true))}>
                      <span style={{ color: '#22c55e', fontWeight: 800 }}>📋 Room KOT Register</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Kitchen Dash Board', 'Kitchen Dashboard (KDS)', () => setIsKitchenDashboardOpen(true))}>
                      <span style={{ color: '#eab308', fontWeight: 800 }}>🍳 Kitchen Order Dashboard (KDS)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Restaurant Module', 'Restaurant KOT Register', () => setIsRestaurantKotOpen(true))}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>🍽️ Restaurant KOT Register</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Restaurant Module', 'Restaurant Table Matrix', () => setIsTableDashboardOpen(true))}>
                      <span style={{ color: '#84cc16', fontWeight: 800 }}>🏬 Restaurant Table Matrix</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Restaurant Module', 'Shift Table', () => setIsShiftTableOpen(true))}>
                      <span style={{ color: '#f43f5e', fontWeight: 700 }}>🔁 Shift Table</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Restaurant Module', 'NC KOT Register', () => setIsNcKotRegisterOpen(true))}>
                      <span style={{ color: '#ec4899', fontWeight: 800 }}>🍽️ NC KOT Register</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('foodbills', 'Food Bill (FBB)', () => setIsFoodBillModalOpen(true))}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>🧾 Food Bill (FBB)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('advance_reciept', 'Room Advance Receipt', () => setIsAdvanceReceiptOpen(true))}>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>💵 Room Advance Receipt</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('receipt', 'Receipt Register', () => setIsReceiptRegisterOpen(true))}>
                      <span style={{ color: '#60a5fa', fontWeight: 700 }}>📄 Receipt Register</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('payment', 'Payment Register', () => setIsPaymentRegisterOpen(true))}>
                      <span style={{ color: '#06b6d4', fontWeight: 700 }}>💳 Payment Register</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('purchase', 'Purchase Entry', () => setIsPurchaseOpen(true))}>
                      <span style={{ color: '#ec4899', fontWeight: 700 }}>🛒 Purchase Entry</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Stock_Transfer', 'Stock Transfer & Issue', () => { setStockTransferMode('transfer'); setIsStockTransferOpen(true); })}>
                      <span style={{ color: '#a855f7', fontWeight: 700 }}>🔁 Stock Transfer &amp; Issue</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('roomcheckout', 'Room Check Out', () => setIsCheckOutRegisterOpen(true))}>
                      <span style={{ color: '#f87171', fontWeight: 700 }}>🧾 Room Check Out &amp; Final Billing</span>
                    </div>
                    {/* Video 26: Check Out Register & Bill Formats (Frames 0115, 0150) */}
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('roomcheckout', 'Check Out Register', () => setIsCheckOutRegisterOpen(true))}>
                      <span style={{ color: '#38bdf8', fontWeight: 800 }}>📋 Room Check Out Register (/roomcheckouts)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => { setSelectedBillCheckout(null); setActiveBillFormat('Format_3_A4_Standard'); setIsBillFormatOpen(true); }}>
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>🧾 Bill Formats &amp; Design</span>
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
                      <span style={{ color: '#fb923c', fontWeight: 700 }}>💰 Outstanding Receivables</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsStoreWiseStockOpen(true)}>
                      <span style={{ color: '#10b981', fontWeight: 800 }}>📦 Store Wise Stock Report</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsCheckInRegisterOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>📋 Daily Check-in Report (/checkin_report)</span>
                    </div>
                    {/* Video 24: Police Station Report (Frames 0100, 0105, 0110, 0140) */}
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Police Station Report', 'Police Station Report', () => setIsPoliceReportOpen(true))}>
                      <span style={{ color: '#f59e0b', fontWeight: 800 }}>👮 Police Station Report</span>
                    </div>
                    {/* Video 28: GST Tax Reports Suite (Frames 0080-0330) */}
                    <div className="pms-nav-item" onClick={() => { setIsPaymentRegisterOpen(false); setIsReceiptRegisterOpen(false); setGstReportTab('consolidated'); setIsGstReportsOpen(true); }}>
                      <span style={{ color: '#4ade80', fontWeight: 800 }}>📜 Room &amp; Food Bill GST Report</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => { setIsPaymentRegisterOpen(false); setIsReceiptRegisterOpen(false); setGstReportTab('b2b'); setIsGstReportsOpen(true); }}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>🏢 B2B Register (Only GST Invoices)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => { setIsPaymentRegisterOpen(false); setIsReceiptRegisterOpen(false); setGstReportTab('b2c'); setIsGstReportsOpen(true); }}>
                      <span style={{ color: '#f87171', fontWeight: 700 }}>👥 B2C Register (Without GST Invoices)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => { setIsPaymentRegisterOpen(false); setIsReceiptRegisterOpen(false); setGstReportTab('dashboard'); setIsGstReportsOpen(true); }}>
                      <span style={{ color: '#fbbf24', fontWeight: 800 }}>📊 Master Report Hub (/report_dashboard)</span>
                    </div>
                    {/* Video 29: All Hotel Reports Master Suite */}
                    <div className="pms-nav-item" onClick={() => setIsDayEndModalOpen(true)}>
                      <span style={{ color: '#f43f5e', fontWeight: 800 }}>🌅 Day End Report (Night Audit)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsItemWiseSaleModalOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>📊 Item Wise Sales Report</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsItemWiseStockModalOpen(true)}>
                      <span style={{ color: '#a855f7', fontWeight: 700 }}>🏷️ Item Wise Stock Ledger</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsGuestLogModalOpen(true)}>
                      <span style={{ color: '#fbbf24', fontWeight: 800 }}>📖 Guest Log VIP Register</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsShiftHandoverModalOpen(true)}>
                      <span style={{ color: '#34d399', fontWeight: 800 }}>🤝 Shift Handover Report</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => { setOutstandingMode('payable'); setIsOutstandingReceivablesOpen(true); }}>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>💳 Outstanding Payables (Creditors)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsFbbReportOpen(true)}>
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>🍴 FBB Report (Food &amp; Beverage)</span>
                    </div>
                    {/* Video 31: MR & Salesman Commission Ledger & Top 15 PMS Features */}
                    <div className="pms-nav-item" onClick={() => setIsAgentCommissionOpen(true)}>
                      <span style={{ color: '#10b981', fontWeight: 800 }}>🤝 Agent &amp; Commission Ledger</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsAgentCommissionOpen(true)}>
                      <span style={{ color: '#f59e0b', fontWeight: 800 }}>🏆 Key PMS Features Hub</span>
                    </div>
                    {/* Video 32: Liquor & Bar Management Software */}
                    <div className="pms-nav-item" onClick={() => setIsLiquorBarOpen(true)}>
                      <span style={{ color: '#f43f5e', fontWeight: 800 }}>🍷 Bar &amp; Beverage POS</span>
                    </div>
                    {/* Video 33: No-Discount Item & Margin Protection Control */}
                    <div className="pms-nav-item" onClick={() => setIsNoDiscountOpen(true)}>
                      <span style={{ color: '#fbbf24', fontWeight: 800 }}>🛡️ No-Discount Items &amp; Margin Rules</span>
                    </div>
                    {/* Video 34: Stock Report & Inventory Control Suite */}
                    <div className="pms-nav-item" onClick={() => setIsStoreWiseStockOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 800 }}>🏬 Store-Wise Stock &amp; Inventory Suite</span>
                    </div>

                    {/* Module 4: CA-Ready GSTR-1 JSON Export Engine */}
                    <div className="pms-nav-item" onClick={() => setIsGstr1ExportOpen(true)}>
                      <span style={{ color: '#4ade80', fontWeight: 900 }}>⚖️ CA-Ready GSTR-1 JSON Export (HSN/SAC)</span>
                    </div>

                    {/* Module 9: Monthly Hotel Sale Report */}
                    <div className="pms-nav-item" onClick={() => setIsMonthlyHotelSaleOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 900 }}>📊 Monthly Hotel Sale Report (XLSX Schema)</span>
                    </div>

                    {/* Module 10: Monthly Restaurant Sale Report */}
                    <div className="pms-nav-item" onClick={() => setIsMonthlyRestaurantSaleOpen(true)}>
                      <span style={{ color: '#fb923c', fontWeight: 900 }}>🍽️ Monthly Restaurant POS Sale (5% GST)</span>
                    </div>

                    {/* Module 2: EOD Expenditures & Category Revenue Analytics */}
                    <div className="pms-nav-item" onClick={() => setIsEodAnalyticsOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 900 }}>📊 EOD Expenses &amp; Room-Category Revenue Analytics</span>
                    </div>

                    {/* Module 6: End-of-Month Chartered Accountant (CA) JSON Export */}
                    <div className="pms-nav-item" onClick={() => setIsCaExportOpen(true)}>
                      <span style={{ color: '#10b981', fontWeight: 900 }}>⚖️ CA Monthly JSON Export (Module 6)</span>
                    </div>
                  </div>
                )}

                {/* Hotel Submenu */}
                <div 
                  className="pms-nav-item"
                  onClick={() => setHotelMenuOpen(!hotelMenuOpen)}
                  style={{ background: hotelMenuOpen ? '#2c3136' : undefined }}
                >
                  <div className="pms-nav-item-left">
                    <span>🏨</span>
                    <span>Hotel</span>
                  </div>
                  <span>{hotelMenuOpen ? '▾' : '›'}</span>
                </div>

                {hotelMenuOpen && (
                  <div style={{ background: '#1a1e22', paddingLeft: 12, fontSize: 12 }}>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Hotel Module', 'Room Dashboard', () => setActiveTab('matrix'))}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>🏢 Room Status Matrix</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('roomcheckin', 'New Check In', () => setIsNewCheckInOpen(true))}>
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>🚪 New Room Check-In</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Hotel Module', 'Room Booking', () => { setSelectedRoomForNewBooking(null); setIsNewBookingModalOpen(true); })}>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>🏨 Advance Room Reservation</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('roomcheckout', 'Check Out Register', () => setIsCheckOutRegisterOpen(true))}>
                      <span style={{ color: '#f87171', fontWeight: 700 }}>🧾 Room Check Out &amp; Billing</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Hotel Module', 'Room Shifting', () => { setSelectedRoomForShift(undefined); setIsRoomShiftOpen(true); })}>
                      <span style={{ color: '#06b6d4', fontWeight: 700 }}>🔄 Room Shifting (/room_shift)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsCalendarOpen(true)}>
                      <span style={{ color: '#a78bfa', fontWeight: 700 }}>📅 30-Day Booking Calendar</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsCheckInRegisterOpen(true)}>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>📋 In-House Guest Register</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsHousekeepingOpen(true)}>
                      <span style={{ color: '#c084fc', fontWeight: 800 }}>🧹 Housekeeping Kanban (16 Rooms)</span>
                    </div>
                    {/* Module 5: Anti-Fraud Short-Stay Theft Prevention */}
                    <div className="pms-nav-item" onClick={() => setIsHousekeepingDiscrepancyOpen(true)}>
                      <span style={{ color: '#ef4444', fontWeight: 900 }}>🚨 Anti-Fraud Short-Stay Turnover Portal</span>
                    </div>
                    {/* Module 6: RFID Key Card Pre-Checkout Deactivation (-1h Cutoff) */}
                    <div className="pms-nav-item" onClick={() => setIsRfidKeyCardOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 900 }}>🔑 Smart RFID Keycards (-1h Expiry)</span>
                    </div>
                    {/* Module 3: Automated Midnight (00:00) Night Audit Rollover */}
                    <div className="pms-nav-item" onClick={() => {
                      const res = PmsStore.runAutomatedMidnightAudit('Manual Trigger (Manager)');
                      alert(`🌙 Automated Midnight Night Audit Executed!\n\nBusiness Date: ${res.auditDate}\nNightly Room Tariffs Posted: ₹${res.totalRoomTariffPosted.toFixed(2)}\nOccupied Rooms Audited: ${res.occupiedRoomsCount}\nDate rolled forward cleanly for 24/7/365 operations.`);
                    }}>
                      <span style={{ color: '#a855f7', fontWeight: 900 }}>🌙 Run Midnight Night Audit Rollover</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsPettyExpenseOpen(true)}>
                      <span style={{ color: '#fbbf24', fontWeight: 800 }}>💰 Petty Cash &amp; Daily Night Audit</span>
                    </div>
                  </div>
                )}

                {/* Activity Submenu */}
                <div 
                  className="pms-nav-item"
                  onClick={() => setActivityMenuOpen(!activityMenuOpen)}
                  style={{ background: activityMenuOpen ? '#2c3136' : undefined }}
                >
                  <div className="pms-nav-item-left">
                    <span>⚡</span>
                    <span>Activity</span>
                  </div>
                  <span>{activityMenuOpen ? '▾' : '›'}</span>
                </div>

                {activityMenuOpen && (
                  <div style={{ background: '#1a1e22', paddingLeft: 12, fontSize: 12 }}>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('kot', 'Room Service KOT Entry', () => setIsKotModalOpen(true))}>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>🍴 Room Service KOT Entry</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('foodbills', 'Food Bill (FBB)', () => setIsFoodBillModalOpen(true))}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>🧾 Food Bill Settlement (FBB)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('advance_reciept', 'Room Advance Receipt', () => setIsAdvanceReceiptOpen(true))}>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>💵 Room Advance / Deposit</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Stock_Transfer', 'Stock Transfer & Issue', () => { setStockTransferMode('transfer'); setIsStockTransferOpen(true); })}>
                      <span style={{ color: '#a855f7', fontWeight: 700 }}>📦 Store Stock Requisition</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsDayEndModalOpen(true)}>
                      <span style={{ color: '#f43f5e', fontWeight: 700 }}>🌅 Night Audit &amp; Day End</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Police Station Report', 'Police Station Report', () => setIsPoliceReportOpen(true))}>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>👮 Police C-Form Submission</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsShiftHandoverModalOpen(true)}>
                      <span style={{ color: '#60a5fa', fontWeight: 700 }}>🤝 Cash &amp; Shift Handover</span>
                    </div>
                  </div>
                )}

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
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Setting', 'Company Info', () => setIsCompanyInfoOpen(true))}>
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>🏢 Company Info (/company_info_form)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Setting', 'Business Setting', () => setIsBusinessSettingOpen(true))}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>⚙️ Business Setting (/businesssettings/create)</span>
                    </div>
                    {/* Video 21 & 23: Staff User Accounts & Roles */}
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('view user', 'User Setting', () => setIsUserManagementOpen(true))}>
                      <span style={{ color: '#06b6d4', fontWeight: 700 }}>👥 User Setting &amp; Staff Shift Roster (/users)</span>
                    </div>
                    {/* Module 1: Staff Profiles, Monthly Salaries & Advance Salary Tracking */}
                    <div className="pms-nav-item" onClick={() => setIsStaffPayrollOpen(true)}>
                      <span style={{ color: '#a5b4fc', fontWeight: 800 }}>👷 Staff Profiles, Advances &amp; Monthly Payroll</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('view role', 'Roles & Permissions', () => setIsRolesPermissionsOpen(true))}>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>🛡️ Roles &amp; Permissions (/roles)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Setting', 'Chain Locations', () => setIsChainPropertyOpen(true))}>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>🏨 Chain Locations (/multilocation)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsDevicePreviewOpen(true)}>
                      <span style={{ color: '#f472b6', fontWeight: 700 }}>📱 Multi-Device Simulator</span>
                    </div>
                    {/* Video 22: Auto WhatsApp SMS Integration & Logs */}
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Only_Whatsapp', 'WhatsApp SMS Setting', () => setIsWhatsAppSettingOpen(true))}>
                      <span style={{ color: '#22c55e', fontWeight: 800 }}>💬 WhatsApp SMS Setting (/whatsapp_sms)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Only_Whatsapp', 'WhatsApp Outbox Logs', () => setIsWhatsAppLogsOpen(true))}>
                      <span style={{ color: '#fb923c', fontWeight: 700 }}>📜 WhatsApp Outbox Logs (/whatsapp_logs)</span>
                    </div>
                    {/* Video 25: Online vs Offline Architecture & Disaster Recovery Tools */}
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Setting', 'Online vs Offline Architecture', () => setIsOnlineVsOfflineOpen(true))}>
                      <span style={{ color: '#38bdf8', fontWeight: 800 }}>🌐 Cloud Sync &amp; Offline Continuity</span>
                    </div>
                    {/* Video 26: Company Logo, QR, Banking & Bill Format Selector (Frames 0240, 0250, 0270) */}
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Setting', 'Company Logo & Media', () => { setCompanyBrandingTab('pictures'); setIsCompanyBrandingOpen(true); })}>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>🖼️ Company Logo &amp; QR (/comp_pic_form)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Setting', 'Bank & Footer Settings', () => { setCompanyBrandingTab('banking'); setIsCompanyBrandingOpen(true); })}>
                      <span style={{ color: '#60a5fa', fontWeight: 700 }}>🏦 Other Details &amp; Bank Settings (/comp_info_footer)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => checkModuleAccess('Setting', 'Bill Format Selector', () => { setCompanyBrandingTab('format'); setIsCompanyBrandingOpen(true); })}>
                      <span style={{ color: '#a3e635', fontWeight: 800 }}>🧾 Bill Format Selector (/checkout_print_view)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => { setSelectedBillCheckout(null); setActiveBillFormat('Format_3_A4_Standard'); setIsBillFormatOpen(true); }}>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>🖨️ Printer &amp; POS Format Setup</span>
                    </div>
                  </div>
                )}

                {/* Video 30: Help & Support Submenu (Frames 0130, 0150, 0180, 0230) */}
                <div 
                  className="pms-nav-item" 
                  onClick={() => setHelpMenuOpen(!helpMenuOpen)}
                  style={{ background: helpMenuOpen ? '#2c3136' : undefined }}
                >
                  <div className="pms-nav-item-left">
                    <span>❓</span>
                    <span>Help &amp; Video Training</span>
                  </div>
                  <span>{helpMenuOpen ? '▾' : '›'}</span>
                </div>

                {helpMenuOpen && (
                  <div style={{ background: '#1a1e22', paddingLeft: 12, fontSize: 12 }}>
                    <div className="pms-nav-item" onClick={() => { setHelpInitialTab('videos'); setIsHelpAndSupportOpen(true); }}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>🎥 Video Tutorials (/helps)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => { setHelpInitialTab('tickets'); setIsHelpAndSupportOpen(true); }}>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>🎫 Support Tickets (/support_tickets)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => { setHelpInitialTab('remote'); setIsHelpAndSupportOpen(true); }}>
                      <span style={{ color: '#34d399', fontWeight: 800 }}>🖥️ Remote Support (UltraViewer &amp; AnyDesk)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => { setHelpInitialTab('manual'); setIsHelpAndSupportOpen(true); }}>
                      <span style={{ color: '#a78bfa', fontWeight: 700 }}>📖 Software User Manual (/documentation)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => { setHelpInitialTab('demo'); setIsHelpAndSupportOpen(true); }}>
                      <span style={{ color: '#f472b6', fontWeight: 700 }}>🚀 Free Demo &amp; License Renewal</span>
                    </div>
                  </div>
                )}

                {/* Video 23: Dynamic Active Staff & Role Footer */}
                <div className="pms-sidebar-footer">
                  <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: 12 }}>
                    Logged in as: <strong style={{ color: '#38bdf8' }}>{currentUser.userName}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>Role:</span>
                    <strong style={{ background: '#334155', padding: '1px 5px', borderRadius: 3, color: '#f8fafc' }}>
                      {currentUser.roleName}
                    </strong>
                    {currentUser.department && <span style={{ color: '#94a3b8' }}>({currentUser.department})</span>}
                  </div>
                  <div style={{ marginTop: 4, color: currentUser.isOnDuty !== false ? '#4ade80' : '#94a3b8', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>●</span> {currentUser.isOnDuty !== false ? 'On Duty' : 'Off Duty'} &bull; {currentUser.shift || 'General'}
                  </div>
                </div>
              </aside>

            {/* Main Dynamic View: Matrix Grid vs Home Hub */}
            {activeTab === 'matrix' ? (
              <RoomDashboardModal 
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
        onOpenTableDashboard={() => setIsTableDashboardOpen(true)}
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
        titleOverride="Room KOT Register"
      />

      {/* Video 15: General Receipt Register Modal (Frame 0090, 0250) */}
      <ReceiptRegisterModal
        isOpen={isReceiptRegisterOpen}
        onClose={() => setIsReceiptRegisterOpen(false)}
      />

      {/* Video 15 & Video 29: Outstanding Receivables (Dr) & Payables (Cr - Frame 0160) */}
      <OutstandingReceivablesModal
        isOpen={isOutstandingReceivablesOpen}
        onClose={() => setIsOutstandingReceivablesOpen(false)}
        initialMode={outstandingMode}
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

      <StockReportMasterModal
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
        onSaved={() => {
          // Trigger rerender
        }}
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

      {/* Video 27: Top 20 Features of RoomG PMS Master Navigator */}
      <Top20FeaturesModal
        isOpen={isTop20FeaturesOpen}
        onClose={() => setIsTop20FeaturesOpen(false)}
        onLaunchFeature={handleLaunchFeatureFromTop20}
      />

      {/* Video 28: GST Tax Reports & CA Filing Suite */}
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
        onOpenRoomDashboard={() => setActiveTab('matrix')}
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
        onOpenFoodBill={() => setIsFoodBillModalOpen(true)}
      />

      {/* Video 35: Banquet Hall Billing, Marriage Garden & Event Invoice Demo */}
      <BanquetHallBillingModal
        isOpen={isBanquetOpen}
        onClose={() => setIsBanquetOpen(false)}
      />

      {/* Video 02 & Video 04: New Room Booking Modal */}
      <NewRoomBookingModal
        isOpen={isNewBookingModalOpen}
        onClose={() => setIsNewBookingModalOpen(false)}
        preselectedRoom={selectedRoomForNewBooking}
        onBookingCreated={() => {
          setIsNewBookingModalOpen(false);
          setRoomRefreshTrigger(prev => prev + 1);
        }}
      />

      {/* Video 26: Direct Room Check Out Modal */}
      {selectedRoomForDirectCheckout && (
        <RoomCheckOutModal
          isOpen={isDirectCheckoutOpen}
          onClose={() => {
            setIsDirectCheckoutOpen(false);
            setSelectedRoomForDirectCheckout(null);
            setRoomRefreshTrigger(prev => prev + 1);
          }}
          targetRoom={selectedRoomForDirectCheckout}
          onCheckoutComplete={() => {
            setRoomRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      {/* 16-Room Housekeeping Kanban Board Modal */}
      <HousekeepingTrackerModal
        isOpen={isHousekeepingOpen}
        onClose={() => {
          setIsHousekeepingOpen(false);
          setRoomRefreshTrigger(prev => prev + 1);
        }}
      />

      {/* Petty Cash & Daily Night Audit Ledger Modal */}
      <PettyExpenseModal
        isOpen={isPettyExpenseOpen}
        onClose={() => {
          setIsPettyExpenseOpen(false);
          setRoomRefreshTrigger(prev => prev + 1);
        }}
      />

      {/* Module 4: CA-Ready GSTR-1 JSON Export Engine */}
      <Gstr1ExportModal
        isOpen={isGstr1ExportOpen}
        onClose={() => setIsGstr1ExportOpen(false)}
        onOpenCaPack={() => {
          setIsGstr1ExportOpen(false);
          setIsCaExportOpen(true);
        }}
      />

      {/* Module 5: Anti-Fraud Housekeeping & Short Stay Discrepancy Portal */}
      <HousekeepingDiscrepancyModal
        isOpen={isHousekeepingDiscrepancyOpen}
        onClose={() => setIsHousekeepingDiscrepancyOpen(false)}
      />

      {/* Module 6: Smart RFID Key Card Encoding & -1 Hour Cutoff Lock System */}
      <RfidKeyCardModal
        isOpen={isRfidKeyCardOpen}
        onClose={() => setIsRfidKeyCardOpen(false)}
      />

      {/* Module 9: Monthly Hotel Sale Report Engine (HOTEL SALE REPORT JUNE MONTH.xlsx Schema) */}
      <MonthlyHotelSaleReportModal
        isOpen={isMonthlyHotelSaleOpen}
        onClose={() => setIsMonthlyHotelSaleOpen(false)}
      />

      {/* Module 10: Monthly Restaurant Sale Report Engine (RESTAURENT SALE REPORT JUNE MONTH.xlsx Schema) */}
      <MonthlyRestaurantSaleReportModal
        isOpen={isMonthlyRestaurantSaleOpen}
        onClose={() => setIsMonthlyRestaurantSaleOpen(false)}
      />

      {/* Cloudflare R2 Object Storage Explorer & Asset Manager */}
      <CloudflareR2StorageModal
        isOpen={isR2StorageOpen}
        onClose={() => setIsR2StorageOpen(false)}
      />

      {/* Module 1: Staff Profiles, Monthly Salaries & Advance Salary Tracking */}
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
      {/* Module 6: End-of-Month Chartered Accountant (CA) JSON Export */}
      <CharteredAccountantExportModal
        isOpen={isCaExportOpen}
        onClose={() => setIsCaExportOpen(false)}
      />
    </>
  );
};

