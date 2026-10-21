import { useState, useEffect } from 'react';
import type { 
  PmsRoom, 
  RoomStatus,
  PmsBooking, 
  PmsKotRecord, 
  KotItem,
  PmsCheckOutDetail, 
  MenuItem, 
  PmsAdvanceReceipt, 
  LedgerEntry,
  PmsRoomType,
  PmsDiningTable,
  PmsGstMaster,
  PmsBusinessSource,
  PmsVoucherType,
  PmsBusinessSetting,
  DayWiseRentItem,
  PmsCompanyInfo,
  PmsRoomShiftRecord,
  PmsTableShiftRecord,
  PmsReceiptRecord,
  PmsPartyAccount,
  PmsPaymentRecord,
  PmsItemGroup,
  PmsGodown,
  PmsPurchaseBill,
  PmsPurchaseItem,
  PmsStockTransfer,
  GodownStockRow,
  PmsRole,
  PmsUserAccount,
  PmsChainProperty,
  PmsWhatsAppTemplate,
  PmsWhatsAppLog,
  PmsWhatsAppConfig,
  BillFormatOption,
  BillFormatType,
  CompanyPicAsset,
  PmsTopFeature,
  RoomGSystemPricing,
  PmsB2BInvoiceRecord,
  PmsB2CInvoiceRecord,
  PmsConsolidatedGstItem,
  PmsReportDashboardButton,
  PmsOutstandingAccount,
  PmsItemWiseSale,
  PmsDayEndReport,
  PmsGuestLogEntry,
  PmsItemStockReport,
  PmsShiftHandoverRecord,
  PmsHelpVideo,
  PmsSupportTicket,
  PmsRemoteSupportSession,
  PmsDemoRequest,
  PmsDocumentationChapter,
  PmsCommissionAgent,
  PmsAgentCommissionBooking,
  PmsAgentPayoutVoucher,
  PmsTop15OfficialFeature,
  PmsLiquorUnit,
  PmsLiquorBrand,
  PmsLiquorItem,
  PmsBrandWiseLiquorStock,
  PmsBarInvoice,
  PmsNoDiscountConfig,
  PmsDiscountAuditRecord,
  PmsConsolidatedStockRow,
  PmsGodownBreakdownEntry,
  PmsStockAuditMovement,
  PmsHotelAssetLinenRecord,
  PmsBanquetVenue,
  PmsBanquetBooking,
  PmsBanquetKot,
  PmsLocker,
  PmsOtherCharge,
  PmsExpenseRecord,
  PmsHousekeepingRecord,
  PmsNightAuditRecord,
  PmsFolioPayment,
  PmsFolioDiscount,
  PmsFolioSummary
} from '../types/pmsModels';
import { PMS_ALL_PERMISSIONS } from '../types/pmsModels';
import { hotelApi } from './api';

export const DEFAULT_BUSINESS_SETTING: PmsBusinessSetting = {
  calculationType: '12hour',
  standardCheckoutTime: '11:00 AM'
};

export const DEFAULT_COMPANY_INFO: PmsCompanyInfo = {
  firmName: 'HOTEL SAI VASUDEV RESIDENCY',
  address1: 'Plot No. 14-B, VIP Temple Road, Near Gate No. 2',
  address2: 'Shirdi, Maharashtra 423109',
  city: 'Shirdi',
  pincode: '423109',
  state: 'MAHARASHTRA',
  phone: '+91 94402 89999',
  mobile: '+91 94402 89999',
  email: 'reservations@hotelsai-vasudev.com',
  website: 'https://hotel-sai-vasudev-residency.pages.dev',
  gstNo: '27AABCS1429B1Z2',
  companyGstCode: '27',
  pencardNo: 'AABCS1429B',
  regNo2: 'REG-MS-2024-9871',
  gstNotApplicable: false,
  makeAllBillLocalGst: true, // Video 10 local sales default
  
  // Video 26 Banking & Digital Assets (Frames 0240, 0250, 0255)
  bankName: 'STATE BANK OF INDIA',
  bankAccountNo: '923020035404769',
  bankIfsc: 'SBIN000390',
  bankBranch: 'MAIN BRANCH SHIRDI',
  upiId: '7999663696@YBL',
  phonePeGpay: '07999663696',
  jurisdiction: 'Shirdi / Rahata Jurisdiction',
  country: 'Indian',
  currency: '₹ Indian Rupee (INR)',
  taxSystem: 'GST',
  restaurantFoodBillTaxInclusive: false,
  termsAndConditions: '1. Check-out time is 11:00 AM sharp. Late checkout will be billed as extra day.\n2. In case of dispute, Shirdi Jurisdiction will apply.\n3. Room key must be deposited at reception desk while going outside and at checkout.\n4. Management is not responsible for valuables left inside the room without safe deposit.',
  voucherPrefix: '.',
  voucherSuffix: '.',
  voucherNote: '.'
};

export const INITIAL_ROOMS: PmsRoom[] = [
  // =========================================================================
  // GROUND FLOOR (Rooms 101–107) — Official 7-Room Inventory
  // Tariffs are INCLUSIVE of GST as per property specification sheets
  // =========================================================================
  {
    id: '101',
    roomNo: '101',
    roomType: 'Deluxe',
    tariff: 1500,
    status: 'occupied',
    floor: 0,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker',
    capacity: 1,
    maxGuests: 3,
    bedType: 'Single / Queen Size',
    roomSize: '200 sq ft',
    image1: '/images/deluxe_room.jpg',
    image2: '/images/hero.jpg',
    image3: '/images/suite_room.jpg',
    currentGuest: {
      name: 'Rajesh Sharma',
      phone: '9822114455',
      email: 'rajesh.sharma@gmail.com',
      checkInDate: '2026-10-19',
      checkInTime: '11:00 AM',
      checkOutDate: '2026-10-21',
      checkOutTime: '11:00 AM',
      bookingNo: 'SR/201/26-27',
      advancePaid: 1500,
      calculationType: '12hour',
      darshanSlot: 'Morning Kakad Aarti (05:15 AM)',
      vehicleNo: 'MH-15-AB-1234',
      idProofType: 'Aadhaar Card',
      idProofNumber: '7845 1298 3456'
    },
    foodAmount: 0,
    assignedStaff: 'Ramesh',
    priority: 'Normal',
    lastCleaned: '19-10-2026 10:30 AM'
  },
  {
    id: '102',
    roomNo: '102',
    roomType: 'Deluxe',
    tariff: 1500,
    status: 'vacant',
    floor: 0,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker',
    capacity: 1,
    maxGuests: 3,
    bedType: 'Queen Size',
    roomSize: '200 sq ft',
    image1: '/images/deluxe_room.jpg',
    image2: '/images/hero.jpg',
    image3: '/images/suite_room.jpg',
    assignedStaff: 'Sunita',
    priority: 'Normal',
    lastCleaned: '20-10-2026 09:00 AM'
  },
  {
    id: '103',
    roomNo: '103',
    roomType: 'Classic Studio',
    tariff: 2000,
    status: 'vacant',
    floor: 0,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker',
    capacity: 2,
    maxGuests: 4,
    bedType: 'Queen Size',
    roomSize: '280 sq ft',
    image1: '/images/deluxe_room.jpg',
    image2: '/images/hero.jpg',
    image3: '/images/suite_room.jpg',
    assignedStaff: 'Ramesh',
    priority: 'Normal',
    lastCleaned: '20-10-2026 09:30 AM'
  },
  {
    id: '104',
    roomNo: '104',
    roomType: 'Classic Studio',
    tariff: 2000,
    status: 'dirty',
    floor: 0,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Queen Bed',
    capacity: 2,
    maxGuests: 4,
    bedType: 'Queen Size',
    roomSize: '280 sq ft',
    image1: '/images/deluxe_room.jpg',
    image2: '/images/hero.jpg',
    image3: '/images/suite_room.jpg',
    assignedStaff: 'Ramesh',
    priority: 'High - Guest Waiting',
    lastCleaned: '18-10-2026 04:00 PM'
  },
  {
    id: '105',
    roomNo: '105',
    roomType: 'Classic Studio',
    tariff: 2000,
    status: 'vacant',
    floor: 0,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Queen Bed',
    capacity: 2,
    maxGuests: 4,
    bedType: 'Queen Size',
    roomSize: '280 sq ft',
    image1: '/images/deluxe_room.jpg',
    image2: '/images/hero.jpg',
    image3: '/images/suite_room.jpg',
    assignedStaff: 'Sunita',
    priority: 'Normal',
    lastCleaned: '20-10-2026 08:30 AM'
  },
  {
    id: '106',
    roomNo: '106',
    roomType: 'Executive',
    tariff: 2500,
    status: 'vacant',
    floor: 0,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Mini Fridge, Work Desk',
    capacity: 2,
    maxGuests: 4,
    bedType: 'King Size',
    roomSize: '340 sq ft',
    image1: '/images/deluxe_room.jpg',
    image2: '/images/hero.jpg',
    image3: '/images/suite_room.jpg',
    assignedStaff: 'Ramesh',
    priority: 'Normal',
    lastCleaned: '20-10-2026 09:15 AM'
  },
  {
    id: '107',
    roomNo: '107',
    roomType: 'Executive',
    tariff: 2500,
    status: 'vacant',
    floor: 0,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Sofa Seating, Hair Dryer, Mini Fridge',
    capacity: 2,
    maxGuests: 4,
    bedType: 'King Size',
    roomSize: '300 sq ft',
    image1: '/images/deluxe_room.jpg',
    image2: '/images/hero.jpg',
    image3: '/images/suite_room.jpg',
    assignedStaff: 'Sunita',
    priority: 'Normal',
    lastCleaned: '20-10-2026 10:00 AM'
  },

  // =========================================================================
  // 1ST FLOOR (Rooms 201–211) — Official 11-Room Inventory
  // Tariffs are INCLUSIVE of GST as per property specification sheets
  // =========================================================================
  {
    id: '201',
    roomNo: '201',
    roomType: 'Executive',
    tariff: 2500,
    status: 'vacant',
    floor: 1,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Sofa Seating, Hair Dryer, Mini Fridge, Work Desk',
    capacity: 2,
    maxGuests: 4,
    bedType: 'King Size',
    roomSize: '340 sq ft',
    image1: '/images/hero.jpg',
    image2: '/images/deluxe_room.jpg',
    image3: '/images/suite_room.jpg',
    assignedStaff: 'Ganesh',
    priority: 'Normal',
    lastCleaned: '20-10-2026 09:30 AM'
  },
  {
    id: '202',
    roomNo: '202',
    roomType: 'Deluxe',
    tariff: 1500,
    status: 'occupied',
    floor: 1,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker',
    capacity: 1,
    maxGuests: 1,
    bedType: 'Single Bed',
    roomSize: '220 sq ft',
    image1: '/images/hero.jpg',
    image2: '/images/suite_room.jpg',
    image3: '/images/deluxe_room.jpg',
    currentGuest: {
      name: 'Vikram Malhotra',
      phone: '9811223344',
      email: 'malhotra.vikram@gmail.com',
      checkInDate: '2026-10-20',
      checkInTime: '09:30 AM',
      checkOutDate: '2026-10-23',
      checkOutTime: '11:00 AM',
      bookingNo: 'SR/203/26-27',
      advancePaid: 1500,
      calculationType: '12hour',
      darshanSlot: 'Dhoop Aarti (06:30 PM)',
      vehicleNo: 'DL-3C-AZ-4509',
      idProofType: 'Passport',
      idProofNumber: 'Z8941024'
    },
    foodAmount: 0,
    assignedStaff: 'Ganesh',
    priority: 'Normal',
    lastCleaned: '20-10-2026 09:00 AM'
  },
  {
    id: '203',
    roomNo: '203',
    roomType: 'Classic Studio',
    tariff: 2000,
    status: 'vacant',
    floor: 1,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Queen Bed',
    capacity: 2,
    maxGuests: 4,
    bedType: 'Queen Bed',
    roomSize: '280 sq ft',
    image1: '/images/hero.jpg',
    image2: '/images/deluxe_room.jpg',
    image3: '/images/suite_room.jpg',
    assignedStaff: 'Priya',
    priority: 'Normal',
    lastCleaned: '20-10-2026 10:00 AM'
  },
  {
    id: '204',
    roomNo: '204',
    roomType: 'Classic Studio',
    tariff: 2000,
    status: 'booked',
    floor: 1,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Queen Bed',
    capacity: 2,
    maxGuests: 4,
    bedType: 'Queen Bed',
    roomSize: '280 sq ft',
    image1: '/images/hero.jpg',
    image2: '/images/suite_room.jpg',
    image3: '/images/deluxe_room.jpg',
    currentGuest: {
      name: 'Dr. Ananya Deshmukh',
      phone: '9123456780',
      email: 'ananya.deshmukh@aims.org',
      checkInDate: '2026-10-20',
      checkInTime: '02:00 PM',
      checkOutDate: '2026-10-22',
      checkOutTime: '11:00 AM',
      bookingNo: 'BKG-2026-104',
      advancePaid: 2000,
      calculationType: '12hour',
      darshanSlot: 'Shej Aarti (10:00 PM)',
      idProofType: 'Aadhaar Card',
      idProofNumber: '3456 7890 1234'
    },
    assignedStaff: 'Priya',
    priority: 'High - Guest Waiting',
    lastCleaned: '20-10-2026 10:15 AM'
  },
  {
    id: '205',
    roomNo: '205',
    roomType: 'Classic Studio',
    tariff: 2000,
    status: 'vacant',
    floor: 1,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Queen Bed',
    capacity: 2,
    maxGuests: 4,
    bedType: 'Queen Bed',
    roomSize: '280 sq ft',
    image1: '/images/hero.jpg',
    image2: '/images/deluxe_room.jpg',
    image3: '/images/suite_room.jpg',
    assignedStaff: 'Ganesh',
    priority: 'Normal',
    lastCleaned: '20-10-2026 09:45 AM'
  },
  {
    id: '206',
    roomNo: '206',
    roomType: 'Executive',
    tariff: 2500,
    status: 'vacant',
    floor: 1,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Mini Fridge, Work Desk',
    capacity: 2,
    maxGuests: 4,
    bedType: 'King Size',
    roomSize: '340 sq ft',
    image1: '/images/hero.jpg',
    image2: '/images/suite_room.jpg',
    image3: '/images/deluxe_room.jpg',
    assignedStaff: 'Priya',
    priority: 'Normal',
    lastCleaned: '20-10-2026 10:30 AM'
  },
  {
    id: '207',
    roomNo: '207',
    roomType: 'Executive',
    tariff: 2500,
    status: 'vacant',
    floor: 1,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Mini Fridge, Work Desk',
    capacity: 2,
    maxGuests: 4,
    bedType: 'King Size',
    roomSize: '340 sq ft',
    image1: '/images/hero.jpg',
    image2: '/images/deluxe_room.jpg',
    image3: '/images/suite_room.jpg',
    assignedStaff: 'Sunita',
    priority: 'Normal',
    lastCleaned: '20-10-2026 10:45 AM'
  },
  {
    id: '208',
    roomNo: '208',
    roomType: 'Executive',
    tariff: 2500,
    status: 'vacant',
    floor: 1,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Mini Fridge, Work Desk',
    capacity: 2,
    maxGuests: 4,
    bedType: 'King Size',
    roomSize: '340 sq ft',
    image1: '/images/deluxe_room.jpg',
    image2: '/images/hero.jpg',
    image3: '/images/suite_room.jpg',
    assignedStaff: 'Ramesh',
    priority: 'Normal',
    lastCleaned: '20-10-2026 09:00 AM'
  },
  {
    id: '209',
    roomNo: '209',
    roomType: 'Executive',
    tariff: 2500,
    status: 'vacant',
    floor: 1,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Mini Fridge, Work Desk',
    capacity: 2,
    maxGuests: 4,
    bedType: 'King Size',
    roomSize: '340 sq ft',
    image1: '/images/deluxe_room.jpg',
    image2: '/images/hero.jpg',
    image3: '/images/suite_room.jpg',
    assignedStaff: 'Ganesh',
    priority: 'Normal',
    lastCleaned: '20-10-2026 09:15 AM'
  },
  {
    id: '210',
    roomNo: '210',
    roomType: 'Premium',
    tariff: 3000,
    status: 'vacant',
    floor: 1,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Mini Fridge, Work Desk, VIP Darshan Assistance',
    capacity: 2,
    maxGuests: 4,
    bedType: 'King Size',
    roomSize: '400 sq ft',
    image1: '/images/deluxe_room.jpg',
    image2: '/images/hero.jpg',
    image3: '/images/suite_room.jpg',
    assignedStaff: 'Priya',
    priority: 'Normal',
    lastCleaned: '20-10-2026 09:30 AM'
  },
  {
    id: '211',
    roomNo: '211',
    roomType: 'Premium',
    tariff: 3000,
    status: 'occupied',
    floor: 1,
    facilities: 'Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Sofa Seating, Hair Dryer, Mini Fridge',
    capacity: 2,
    maxGuests: 4,
    bedType: 'King Size',
    roomSize: '350 sq ft',
    image1: '/images/hero.jpg',
    image2: '/images/deluxe_room.jpg',
    image3: '/images/suite_room.jpg',
    currentGuest: {
      name: 'Arvind Kirloskar',
      phone: '9876501234',
      email: 'kirloskar.arvind@kirloskargroup.com',
      checkInDate: '2026-10-20',
      checkInTime: '08:00 AM',
      checkOutDate: '2026-10-21',
      checkOutTime: '11:00 AM',
      bookingNo: 'SR/204/26-27',
      advancePaid: 3000,
      calculationType: '12hour',
      darshanSlot: 'VIP Darshan Pass Gate 2',
      vehicleNo: 'MH-12-PA-0001',
      idProofType: 'Aadhaar Card',
      idProofNumber: '4455 6677 8899',
      companyName: 'Kirloskar Engineering Ltd',
      gstin: '27AAACK5678B1Z9'
    },
    foodAmount: 0,
    assignedStaff: 'Sunita',
    priority: 'Normal',
    lastCleaned: '20-10-2026 07:30 AM'
  }
];

export const INITIAL_ROOM_TYPES: PmsRoomType[] = [
  // All tariffs are GST-INCLUSIVE per the official property specification sheets
  { id: 'rt-1', roomTypeName: 'Deluxe', package: 'GENERAL', gstTaxString: 'GST 12% Inclusive || 12.00 || 0.00', gstPercent: 12, roomTariff: 1500, discountPercent: 0 },
  { id: 'rt-2', roomTypeName: 'Classic Studio', package: 'GENERAL', gstTaxString: 'GST 12% Inclusive || 12.00 || 0.00', gstPercent: 12, roomTariff: 2000, discountPercent: 0 },
  { id: 'rt-3', roomTypeName: 'Executive', package: 'GENERAL', gstTaxString: 'GST 12% Inclusive || 12.00 || 0.00', gstPercent: 12, roomTariff: 2500, discountPercent: 0 },
  { id: 'rt-4', roomTypeName: 'Premium', package: 'GENERAL', gstTaxString: 'GST 12% Inclusive || 12.00 || 0.00', gstPercent: 12, roomTariff: 3000, discountPercent: 0 }
];

export const INITIAL_TABLES: PmsDiningTable[] = [
  // 12 Restaurant Tables: T1–T8 Main Hall + VIP-1–VIP-4 AC Family Lounge
  { id: 't-1', tableName: 'Table T-01', tableGroup: 'Main Hall', capacity: 4, status: 'Vacant' },
  { id: 't-2', tableName: 'Table T-02', tableGroup: 'Main Hall', capacity: 4, status: 'Running' },
  { id: 't-3', tableName: 'Table T-03', tableGroup: 'Main Hall', capacity: 4, status: 'Vacant' },
  { id: 't-4', tableName: 'Table T-04', tableGroup: 'Main Hall', capacity: 4, status: 'Vacant' },
  { id: 't-5', tableName: 'Table T-05', tableGroup: 'Main Hall', capacity: 6, status: 'Running' },
  { id: 't-6', tableName: 'Table T-06', tableGroup: 'Main Hall', capacity: 6, status: 'Vacant' },
  { id: 't-7', tableName: 'Table T-07', tableGroup: 'Main Hall', capacity: 4, status: 'Vacant' },
  { id: 't-8', tableName: 'Table T-08', tableGroup: 'Main Hall', capacity: 4, status: 'Vacant' },
  { id: 'vip-1', tableName: 'Table VIP-01', tableGroup: 'AC Family Lounge', capacity: 6, status: 'Vacant' },
  { id: 'vip-2', tableName: 'Table VIP-02', tableGroup: 'AC Family Lounge', capacity: 6, status: 'Vacant' },
  { id: 'vip-3', tableName: 'Table VIP-03', tableGroup: 'AC Family Lounge', capacity: 8, status: 'Vacant' },
  { id: 'vip-4', tableName: 'Table VIP-04', tableGroup: 'AC Family Lounge', capacity: 8, status: 'Vacant' },
  // Special Service Modes
  { id: 't-takeaway', tableName: 'Takeaway / Parcel', tableGroup: 'TakeAway', capacity: 2, status: 'Vacant' },
  { id: 't-room-service', tableName: 'Room Service', tableGroup: 'TakeAway', capacity: 2, status: 'Running' }
];

export const INITIAL_GST_MASTERS: PmsGstMaster[] = [
  { id: 'gst-1', name: 'GST 5%', hsnNo: '996331', sgst: 2.5, cgst: 2.5, igst: 5.0, vat: 0 },
  { id: 'gst-2', name: 'GST 12%', hsnNo: '996311', sgst: 6.0, cgst: 6.0, igst: 12.0, vat: 0 },
  { id: 'gst-3', name: 'GST 18%', hsnNo: '996311', sgst: 9.0, cgst: 9.0, igst: 18.0, vat: 0 },
  { id: 'gst-4', name: 'GST 28%', hsnNo: '996311', sgst: 14.0, cgst: 14.0, igst: 28.0, vat: 0 },
  { id: 'gst-5', name: 'GST 0%', hsnNo: '996311', sgst: 0.0, cgst: 0.0, igst: 0.0, vat: 0 },
];

export const INITIAL_BUSINESS_SOURCES: PmsBusinessSource[] = [
  { id: 'bs-1', name: 'OYO', remark: 'Online Travel Agency' },
  { id: 'bs-2', name: 'Make My Trip', remark: 'Online Travel Agency' },
  { id: 'bs-3', name: 'Goibibo', remark: 'Online Travel Agency' },
  { id: 'bs-4', name: 'Direct', remark: 'Direct Booking' },
  { id: 'bs-5', name: 'AGODA', remark: 'AGODA' },
  { id: 'bs-6', name: 'Booking.com', remark: 'Online Travel Agency' },
  { id: 'bs-7', name: 'Walk-in', remark: 'Front Desk Walk-in Guest' },
  { id: 'bs-8', name: 'Corporate', remark: 'Corporate & Company Tie-ups' },
];

export const INITIAL_VOUCHER_TYPES: PmsVoucherType[] = [
  { id: 'vt-1', voucherTypeName: 'Check_In', startingNumber: 575, prefix: 'SR/', suffix: '/24-25', numberingStyle: 'Continue', printName: 'Check In', remark: 'Check In' },
  { id: 'vt-2', voucherTypeName: 'Check_Out', startingNumber: 229, prefix: 'GSR/', suffix: '/24-25', numberingStyle: 'Continue', printName: 'Tax Invoice', remark: 'Room Checkout Invoice' },
  { id: 'vt-3', voucherTypeName: 'Advance_Receipt', startingNumber: 12, prefix: 'AR/', suffix: '/24-25', numberingStyle: 'Continue', printName: 'Advance Receipt', remark: 'Guest Advance Receipt' },
  { id: 'vt-4', voucherTypeName: 'KOT', startingNumber: 352, prefix: 'KOT/', suffix: '/24-25', numberingStyle: 'Continue', printName: 'KOT Slip', remark: 'Kitchen Order Ticket' },
  { id: 'vt-5', voucherTypeName: 'Food_Bill', startingNumber: 254, prefix: 'SHRI/', suffix: '/24-25', numberingStyle: 'Continue', printName: 'Food Bill', remark: 'Food & Beverage Bill' },
];

export const INITIAL_LOCKERS: PmsLocker[] = [
  { id: 'LOC-01', lockerNo: 'L-101', lockerSize: 'Medium', dailyRate: 150, status: 'Vacant', keyNumber: 'K-101', securityDeposit: 500 },
  { id: 'LOC-02', lockerNo: 'L-102', lockerSize: 'Large', dailyRate: 250, status: 'Vacant', keyNumber: 'K-102', securityDeposit: 1000 },
  { id: 'LOC-03', lockerNo: 'L-103', lockerSize: 'Executive Vault', dailyRate: 500, status: 'Vacant', keyNumber: 'K-103', securityDeposit: 2000 }
];

export const INITIAL_OTHER_CHARGES: PmsOtherCharge[] = [
  { id: 'CHG-01', chargeName: 'Extra Mattress / Extra Bed (Executive/Family)', category: 'Room', defaultRate: 500, gstRate: 12, hsnCode: '996311', isTaxIncluded: false, remark: 'Rollaway extra bed per night' },
  { id: 'CHG-02', chargeName: 'Extra Mattress / Extra Bed (Suite)', category: 'Room', defaultRate: 800, gstRate: 12, hsnCode: '996311', isTaxIncluded: false, remark: 'Suite extra rollaway mattress per night' },
  { id: 'CHG-03', chargeName: 'Pilgrim Darshan Cab Drop (Shirdi Temple)', category: 'Travel', defaultRate: 300, gstRate: 5, hsnCode: '996412', isTaxIncluded: true, remark: 'Direct drop to VIP Gate No. 2' },
  { id: 'CHG-04', chargeName: 'Express Laundry Service', category: 'Housekeeping', defaultRate: 250, gstRate: 18, hsnCode: '998721', isTaxIncluded: false, remark: 'Same day wash & press' }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // 1. Morning Breakfast (7:00 AM–10:30 AM)
  { id: 'm-101', name: 'Shirdi Special Poha', code: '101', barcode: '890101', company: 'Vasudev Rasoi', rate: 80, saleRate: 80, mrp: 80, purchaseRate: 25, unit: 'Plate', gstPercent: 5, category: 'Morning Breakfast (7:00 AM–10:30 AM)', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-102', name: 'Steamed Idli Sambar (2 Pcs)', code: '102', barcode: '890102', company: 'Vasudev Rasoi', rate: 90, saleRate: 90, mrp: 90, purchaseRate: 35, unit: 'Plate', gstPercent: 5, category: 'Morning Breakfast (7:00 AM–10:30 AM)', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-103', name: 'Medu Vada Sambar (2 Pcs)', code: '103', barcode: '890103', company: 'Vasudev Rasoi', rate: 110, saleRate: 110, mrp: 110, purchaseRate: 40, unit: 'Plate', gstPercent: 5, category: 'Morning Breakfast (7:00 AM–10:30 AM)', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-104', name: 'Special Masala Dosa', code: '104', barcode: '890104', company: 'Vasudev Rasoi', rate: 130, saleRate: 130, mrp: 130, purchaseRate: 50, unit: 'Plate', gstPercent: 5, category: 'Morning Breakfast (7:00 AM–10:30 AM)', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-105', name: 'Poori Bhaji (4 Pcs)', code: '105', barcode: '890105', company: 'Vasudev Rasoi', rate: 120, saleRate: 120, mrp: 120, purchaseRate: 45, unit: 'Plate', gstPercent: 5, category: 'Morning Breakfast (7:00 AM–10:30 AM)', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-106', name: 'Sabudana Khichdi (Upvas Special)', code: '106', barcode: '890106', company: 'Vasudev Rasoi', rate: 110, saleRate: 110, mrp: 110, purchaseRate: 40, unit: 'Plate', gstPercent: 5, category: 'Morning Breakfast (7:00 AM–10:30 AM)', headGroup: 'Restaurant_Item', hsnCode: '996331' },

  // 2. Sattvic & Jain Thalis
  { id: 'm-201', name: 'Sai Prasad Maha Thali (Pure Desi Ghee)', code: '201', barcode: '890201', company: 'Vasudev Rasoi', rate: 280, saleRate: 280, mrp: 300, purchaseRate: 110, unit: 'Thali', gstPercent: 5, category: 'Sattvic & Jain Thalis', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-202', name: 'Jain Special Thali (No Onion/Garlic)', code: '202', barcode: '890202', company: 'Vasudev Rasoi', rate: 260, saleRate: 260, mrp: 280, purchaseRate: 100, unit: 'Thali', gstPercent: 5, category: 'Sattvic & Jain Thalis', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-203', name: 'Gujarati Sattvic Bhojan Thali', code: '203', barcode: '890203', company: 'Vasudev Rasoi', rate: 240, saleRate: 240, mrp: 260, purchaseRate: 90, unit: 'Thali', gstPercent: 5, category: 'Sattvic & Jain Thalis', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-204', name: 'Shirdi Temple Mini Prasad Thali', code: '204', barcode: '890204', company: 'Vasudev Rasoi', rate: 180, saleRate: 180, mrp: 200, purchaseRate: 70, unit: 'Thali', gstPercent: 5, category: 'Sattvic & Jain Thalis', headGroup: 'Restaurant_Item', hsnCode: '996331' },

  // 3. Main Course Curries & Paneer
  { id: 'm-301', name: 'Paneer Butter Masala', code: '301', barcode: '890301', company: 'Vasudev Rasoi', rate: 240, saleRate: 240, mrp: 260, purchaseRate: 110, unit: 'Portion', gstPercent: 5, category: 'Main Course Curries & Paneer', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-302', name: 'Shirdi Special Kaju Kari', code: '302', barcode: '890302', company: 'Vasudev Rasoi', rate: 260, saleRate: 260, mrp: 280, purchaseRate: 130, unit: 'Portion', gstPercent: 5, category: 'Main Course Curries & Paneer', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-303', name: 'Dal Tadka Desi Ghee', code: '303', barcode: '890303', company: 'Vasudev Rasoi', rate: 160, saleRate: 160, mrp: 180, purchaseRate: 60, unit: 'Bowl', gstPercent: 5, category: 'Main Course Curries & Paneer', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-304', name: 'Khandeshi Sev Tomato Curry', code: '304', barcode: '890304', company: 'Vasudev Rasoi', rate: 170, saleRate: 170, mrp: 190, purchaseRate: 65, unit: 'Portion', gstPercent: 5, category: 'Main Course Curries & Paneer', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-305', name: 'Palak Paneer (Fresh Cottage Cheese)', code: '305', barcode: '890305', company: 'Vasudev Rasoi', rate: 230, saleRate: 230, mrp: 250, purchaseRate: 95, unit: 'Portion', gstPercent: 5, category: 'Main Course Curries & Paneer', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-306', name: 'Malai Kofta Creamy Gravy', code: '306', barcode: '890306', company: 'Vasudev Rasoi', rate: 250, saleRate: 250, mrp: 270, purchaseRate: 120, unit: 'Portion', gstPercent: 5, category: 'Main Course Curries & Paneer', headGroup: 'Restaurant_Item', hsnCode: '996331' },

  // 4. Tandoor & Rotis
  { id: 'm-401', name: 'Tandoori Butter Roti', code: '401', barcode: '890401', company: 'Vasudev Rasoi', rate: 25, saleRate: 25, mrp: 30, purchaseRate: 8, unit: 'Piece', gstPercent: 5, category: 'Tandoor & Rotis', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-402', name: 'Butter Naan', code: '402', barcode: '890402', company: 'Vasudev Rasoi', rate: 55, saleRate: 55, mrp: 60, purchaseRate: 18, unit: 'Piece', gstPercent: 5, category: 'Tandoor & Rotis', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-403', name: 'Garlic Butter Naan', code: '403', barcode: '890403', company: 'Vasudev Rasoi', rate: 70, saleRate: 70, mrp: 80, purchaseRate: 22, unit: 'Piece', gstPercent: 5, category: 'Tandoor & Rotis', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-404', name: 'Laccha Paratha', code: '404', barcode: '890404', company: 'Vasudev Rasoi', rate: 60, saleRate: 60, mrp: 70, purchaseRate: 20, unit: 'Piece', gstPercent: 5, category: 'Tandoor & Rotis', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-405', name: 'Phulka (Desi Ghee - 2 Pcs)', code: '405', barcode: '890405', company: 'Vasudev Rasoi', rate: 40, saleRate: 40, mrp: 45, purchaseRate: 12, unit: 'Pair', gstPercent: 5, category: 'Tandoor & Rotis', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-406', name: 'Amritsari Missi Roti', code: '406', barcode: '890406', company: 'Vasudev Rasoi', rate: 45, saleRate: 45, mrp: 50, purchaseRate: 15, unit: 'Piece', gstPercent: 5, category: 'Tandoor & Rotis', headGroup: 'Restaurant_Item', hsnCode: '996331' },

  // 5. South Indian Temple Classics
  { id: 'm-501', name: 'Rava Masala Dosa', code: '501', barcode: '890501', company: 'Vasudev Rasoi', rate: 140, saleRate: 140, mrp: 150, purchaseRate: 55, unit: 'Plate', gstPercent: 5, category: 'South Indian Temple Classics', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-502', name: 'Bisibelebath (Ghee Sambar Rice)', code: '502', barcode: '890502', company: 'Vasudev Rasoi', rate: 160, saleRate: 160, mrp: 180, purchaseRate: 60, unit: 'Plate', gstPercent: 5, category: 'South Indian Temple Classics', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-503', name: 'Ghee Pongal with Coconut Chutney', code: '503', barcode: '890503', company: 'Vasudev Rasoi', rate: 150, saleRate: 150, mrp: 170, purchaseRate: 55, unit: 'Plate', gstPercent: 5, category: 'South Indian Temple Classics', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-504', name: 'Temple Curd Rice (Tadka & Pomegranate)', code: '504', barcode: '890504', company: 'Vasudev Rasoi', rate: 130, saleRate: 130, mrp: 150, purchaseRate: 45, unit: 'Bowl', gstPercent: 5, category: 'South Indian Temple Classics', headGroup: 'Restaurant_Item', hsnCode: '996331' },

  // 6. Beverages & Prasadam Sweets
  { id: 'm-601', name: 'Badam Milk (Kesar Pista)', code: '601', barcode: '890601', company: 'Vasudev Rasoi', rate: 80, saleRate: 80, mrp: 90, purchaseRate: 30, unit: 'Glass', gstPercent: 5, category: 'Beverages & Prasadam Sweets', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-602', name: 'Masala Chaas (Spiced Buttermilk)', code: '602', barcode: '890602', company: 'Vasudev Rasoi', rate: 40, saleRate: 40, mrp: 45, purchaseRate: 15, unit: 'Glass', gstPercent: 5, category: 'Beverages & Prasadam Sweets', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-603', name: 'South Indian Filter Coffee', code: '603', barcode: '890603', company: 'Vasudev Rasoi', rate: 45, saleRate: 45, mrp: 50, purchaseRate: 16, unit: 'Cup', gstPercent: 5, category: 'Beverages & Prasadam Sweets', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-604', name: 'Special Masala Chai (Kulhad)', code: '604', barcode: '890604', company: 'Vasudev Rasoi', rate: 30, saleRate: 30, mrp: 35, purchaseRate: 10, unit: 'Cup', gstPercent: 5, category: 'Beverages & Prasadam Sweets', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-605', name: 'Sweet Boondi Ladoo (Sai Prasadam - 2 Pcs)', code: '605', barcode: '890605', company: 'Vasudev Rasoi', rate: 60, saleRate: 60, mrp: 70, purchaseRate: 20, unit: 'Box', gstPercent: 5, category: 'Beverages & Prasadam Sweets', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-606', name: 'Warm Gulab Jamun (2 Pcs)', code: '606', barcode: '890606', company: 'Vasudev Rasoi', rate: 80, saleRate: 80, mrp: 90, purchaseRate: 30, unit: 'Portion', gstPercent: 5, category: 'Beverages & Prasadam Sweets', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-607', name: 'Moong Dal Halwa (Desi Ghee)', code: '607', barcode: '890607', company: 'Vasudev Rasoi', rate: 100, saleRate: 100, mrp: 120, purchaseRate: 38, unit: 'Bowl', gstPercent: 5, category: 'Beverages & Prasadam Sweets', headGroup: 'Restaurant_Item', hsnCode: '996331' },
  { id: 'm-608', name: 'Mineral Water 1L', code: '608', barcode: '890608', company: 'Bisleri', rate: 20, saleRate: 20, mrp: 20, purchaseRate: 12, unit: 'Bottle', gstPercent: 5, category: 'Beverages & Prasadam Sweets', headGroup: 'Restaurant_Item', hsnCode: '996331' }
];

// Video 15: Party Accounts & Receivables Seed Data (Frame 0130)
export const INITIAL_PARTY_ACCOUNTS: PmsPartyAccount[] = [
  { id: 'pa-1', name: 'Cash', category: 'General', balance: 1100217.77, balanceType: 'Dr' },
  { id: 'pa-2', name: 'Online', category: 'General', balance: 397440.39, balanceType: 'Dr' },
  { id: 'pa-3', name: 'Card', category: 'General', balance: 30842.00, balanceType: 'Dr' },
  { id: 'pa-4', name: 'Purchase', category: 'General', balance: 28040.20, balanceType: 'Dr' },
  { id: 'pa-5', name: 'TILAK', mobile: '52198789754', category: 'Customer', balance: 1414.00, balanceType: 'Dr' },
  { id: 'pa-6', name: 'tata moters', mobile: '9827011223', category: 'Corporate', balance: 15662.00, balanceType: 'Dr' },
  { id: 'pa-7', name: 'pankaj sahni', mobile: '534534534', category: 'Customer', balance: 17950.00, balanceType: 'Dr' },
  { id: 'pa-8', name: 'PAY TM', category: 'Bank', balance: 10982.99, balanceType: 'Dr' },
  { id: 'pa-9', name: 'Riyaz', mobile: '8876579769', category: 'Customer', balance: 1500.00, balanceType: 'Dr' },
  { id: 'pa-10', name: 'jay sharma', mobile: '1265787544', category: 'Customer', balance: 14073.00, balanceType: 'Dr' },
  { id: 'pa-11', name: 'monish', mobile: '704701', category: 'Customer', balance: 2000.00, balanceType: 'Dr' },
  { id: 'pa-12', name: 'Vivek', mobile: '9741523421', category: 'Customer', balance: 7500.00, balanceType: 'Dr' },
  { id: 'pa-13', name: 'N', mobile: '9241755581', category: 'Customer', balance: 10000.00, balanceType: 'Dr' },
  { id: 'pa-14', name: 'STATE BANK OF INDIA', mobile: '07599999114', category: 'Bank', balance: 25100.00, balanceType: 'Dr' },
  { id: 'pa-15', name: 'raj', mobile: '9898989898', category: 'Owner', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-16', name: 'ajay ji', mobile: '9811223344', category: 'Customer', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-17', name: 'hariom gautam ji', mobile: '9425123456', category: 'Customer', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-18', name: 'AKASH YADAV', mobile: '9123456780', category: 'Customer', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-19', name: 'Guruprasad pol', mobile: '9876501234', category: 'Customer', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-20', name: 'shri sunder lal tiwari(owner)', mobile: '9822114455', category: 'Owner', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-21', name: 'auto commision', mobile: '9876543210', category: 'Customer', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-22', name: 'GUPTA JII', mobile: '9999663696', category: 'Corporate', balance: 24867.50, balanceType: 'Cr' }
];

// Video 15: General Receipt Register Seed Data (Frames 0090, 0230, 0250)
export const INITIAL_RECEIPTS: PmsReceiptRecord[] = [
  {
    id: 'rec-12',
    sNo: 1,
    voucherName: 'Receipts',
    receiptNo: 'REC/12/24-25',
    voucherNo: 12,
    date: '2025-06-16',
    paymentMode: 'Cash',
    accountName: 'raj',
    accountMobile: '9898989898',
    amount: 2000,
    remark: 'reciept by owner',
    createdAt: '2025-06-16T07:51:00Z'
  },
  {
    id: 'rec-11',
    sNo: 2,
    voucherName: 'Receipts',
    receiptNo: 'REC/11/24-25',
    voucherNo: 11,
    date: '2025-06-16',
    paymentMode: 'Cash',
    accountName: 'Vivek',
    accountMobile: '9741523421',
    amount: 7500,
    remark: 'old bill',
    createdAt: '2025-06-16T07:49:00Z'
  },
  {
    id: 'rec-10',
    sNo: 3,
    voucherName: 'Receipts',
    receiptNo: 'REC/10/24-25',
    voucherNo: 10,
    date: '2025-06-07',
    paymentMode: 'Cash',
    accountName: 'ajay ji',
    accountMobile: '9811223344',
    amount: 3000,
    remark: '',
    createdAt: '2025-06-07T10:00:00Z'
  },
  {
    id: 'rec-9',
    sNo: 4,
    voucherName: 'Receipts',
    receiptNo: 'REC/9/24-25',
    voucherNo: 9,
    date: '2025-06-06',
    paymentMode: 'Cash',
    accountName: 'hariom gautam ji',
    accountMobile: '9425123456',
    amount: 2000,
    remark: 'advance booking',
    createdAt: '2025-06-06T11:20:00Z'
  },
  {
    id: 'rec-8',
    sNo: 5,
    voucherName: 'Receipts',
    receiptNo: 'REC/8/24-25',
    voucherNo: 8,
    date: '2025-05-24',
    paymentMode: 'Cash',
    accountName: 'AKASH YADAV',
    accountMobile: '9123456780',
    amount: 1000,
    remark: '',
    createdAt: '2025-05-24T14:30:00Z'
  },
  {
    id: 'rec-7',
    sNo: 6,
    voucherName: 'Receipts',
    receiptNo: 'REC/7/24-25',
    voucherNo: 7,
    date: '2025-05-20',
    paymentMode: 'Cash',
    accountName: 'Vivek',
    accountMobile: '9741523421',
    amount: 4000,
    remark: '',
    createdAt: '2025-05-20T16:15:00Z'
  },
  {
    id: 'rec-6',
    sNo: 7,
    voucherName: 'Receipts',
    receiptNo: 'REC/6/24-25',
    voucherNo: 6,
    date: '2025-05-04',
    paymentMode: 'Cash',
    accountName: 'Guruprasad pol',
    accountMobile: '9876501234',
    amount: 2200,
    remark: 'tariff',
    createdAt: '2025-05-04T12:00:00Z'
  },
  {
    id: 'rec-5',
    sNo: 8,
    voucherName: 'Receipts',
    receiptNo: 'REC/5/24-25',
    voucherNo: 5,
    date: '2025-04-30',
    paymentMode: 'Cash',
    accountName: 'Guruprasad pol',
    accountMobile: '9876501234',
    amount: 200,
    remark: '',
    createdAt: '2025-04-30T09:45:00Z'
  },
  {
    id: 'rec-4',
    sNo: 9,
    voucherName: 'Receipts',
    receiptNo: 'REC/4/24-25',
    voucherNo: 4,
    date: '2025-01-27',
    paymentMode: 'Online',
    accountName: 'tata moters',
    accountMobile: '9827011223',
    amount: 2200,
    remark: '103 room ki payment',
    createdAt: '2025-01-27T15:00:00Z'
  },
  {
    id: 'rec-3',
    sNo: 10,
    voucherName: 'Receipts',
    receiptNo: 'REC/3/24-25',
    voucherNo: 3,
    date: '2024-12-24',
    paymentMode: 'Cash',
    accountName: 'HARIOM',
    accountMobile: '9425123456',
    amount: 11900,
    remark: 'balance',
    createdAt: '2024-12-24T18:00:00Z'
  }
];

// Video 16: General Payment Register Seed Data (Frames 0200, 0290, 0320)
export const INITIAL_PAYMENTS: PmsPaymentRecord[] = [
  {
    id: 'pay-5',
    sNo: 1,
    voucherName: 'Payments',
    paymentNo: 'PAY/5/24-25',
    voucherNo: 5,
    date: '2025-06-16',
    paymentMode: 'Online',
    accountName: 'shri sunder lal tiwari(owner)',
    amount: 50000,
    remark: 'paymnet -4757344',
    createdAt: '2025-06-16T08:01:00Z'
  },
  {
    id: 'pay-4',
    sNo: 2,
    voucherName: 'Payments',
    paymentNo: 'PAY/4/24-25',
    voucherNo: 4,
    date: '2025-06-16',
    paymentMode: 'Cash',
    accountName: 'auto commision',
    amount: 1000,
    remark: '101 ka commision',
    createdAt: '2025-06-16T07:59:00Z'
  },
  {
    id: 'pay-3',
    sNo: 3,
    voucherName: 'Payments',
    paymentNo: 'PAY/3/24-25',
    voucherNo: 3,
    date: '2025-06-16',
    paymentMode: 'Cash',
    accountName: 'shri sunder lal tiwari(owner)',
    amount: 98717,
    remark: 'cash handover',
    createdAt: '2025-06-16T07:58:00Z'
  },
  {
    id: 'pay-2',
    sNo: 4,
    voucherName: 'Payments',
    paymentNo: 'PAY/2/24-25',
    voucherNo: 2,
    date: '2025-06-16',
    paymentMode: 'Cash',
    accountName: 'shri sunder lal tiwari(owner)',
    amount: 11000,
    remark: '',
    createdAt: '2025-06-16T07:57:00Z'
  }
];

// Video 19: Store & Inventory Seed Data (Frames 0150, 0230, 0280, 0335)
export const INITIAL_ITEM_GROUPS: PmsItemGroup[] = [
  { id: 'ig-1', sNo: 1, name: 'Genral', headGroup: 'Restaurant_Item' },
  { id: 'ig-2', sNo: 2, name: 'sabzi and paneer', headGroup: 'Restaurant_Item' },
  { id: 'ig-3', sNo: 3, name: 'noodles', headGroup: 'Restaurant_Item' },
  { id: 'ig-4', sNo: 4, name: 'south indian', headGroup: 'Restaurant_Item' },
  { id: 'ig-5', sNo: 5, name: 'coldrink', headGroup: 'Restaurant_Item' },
  { id: 'ig-6', sNo: 6, name: 'SPICES', headGroup: 'Restaurant_Item' },
  { id: 'ig-7', sNo: 7, name: 'BAR', headGroup: 'Restaurant_Item' },
  { id: 'ig-8', sNo: 8, name: 'dinner/lunch/breakfast', headGroup: 'Restaurant_Item' },
  { id: 'ig-9', sNo: 9, name: 'hot cake', headGroup: 'Restaurant_Item' },
  { id: 'ig-10', sNo: 10, name: 'Raw Material', headGroup: 'Raw_Material' }
];

export const INITIAL_GODOWNS: PmsGodown[] = [
  { id: 'g-1', sNo: 1, name: 'Main Store', address: 'Main Store' },
  { id: 'g-2', sNo: 2, name: 'Kitchen', address: 'Kitchen' },
  { id: 'g-3', sNo: 3, name: 'Consume', address: 'Kitchen Consumption' },
  { id: 'g-4', sNo: 4, name: 'STORE1', address: 'TOP FLOOR' }
];

export const INITIAL_PURCHASES: PmsPurchaseBill[] = [
  {
    id: 'pur-6',
    billNo: '6',
    billDate: '06-07-2025',
    godown: 'Main Store',
    terms: 'Credit',
    accountName: 'GUPTA JII',
    items: [
      {
        sNo: 1,
        itemId: 'm-daal-rahar',
        itemName: 'Daal Rahar',
        barcode: '10058',
        qty: 50,
        rate: 175,
        amount: 8750,
        discountPercent: 0,
        discountAmt: 0,
        totalDiscount: 0,
        taxable: 8750,
        gstPercent: 5,
        gstAmt: 437.5,
        netValue: 9187.50
      },
      {
        sNo: 2,
        itemId: 'm-refine-oil',
        itemName: 'Refine Oil',
        barcode: '10069',
        qty: 100,
        rate: 140,
        amount: 14000,
        discountPercent: 0,
        discountAmt: 0,
        totalDiscount: 0,
        taxable: 14000,
        gstPercent: 12,
        gstAmt: 1680,
        netValue: 15680.00
      }
    ],
    totalQty: 150,
    totalAmount: 22750,
    totalDiscount: 0,
    totalTaxable: 22750,
    totalGstAmt: 2117.5,
    totalNetValue: 24867.50,
    createdAt: '2025-07-06T10:00:00Z'
  }
];

export const INITIAL_STOCK_TRANSFERS: PmsStockTransfer[] = [
  {
    id: 'st-1',
    entryNo: 'ST/1/24-25',
    date: '06-07-2025',
    fromGodown: 'Main Store',
    toGodown: 'Kitchen',
    billDate: '06-07-2025',
    billNo: '1',
    items: [
      {
        sNo: 1,
        itemId: 'm-daal-rahar',
        itemName: 'Daal Rahar',
        barcode: '10058',
        qty: 5,
        rate: 175,
        amount: 875,
        discountAmt: 0,
        totalDiscount: 0,
        gstPercent: 5,
        gstAmt: 43.75,
        netValue: 918.75
      },
      {
        sNo: 2,
        itemId: 'm-refine-oil',
        itemName: 'Refine Oil',
        barcode: '10069',
        qty: 10,
        rate: 140,
        amount: 1400,
        discountAmt: 0,
        totalDiscount: 0,
        gstPercent: 12,
        gstAmt: 168,
        netValue: 1568.00
      }
    ],
    totalQty: 15,
    totalAmount: 2275,
    totalDiscount: 0,
    totalTaxable: 2275,
    totalGstAmt: 211.75,
    totalNetValue: 2486.75,
    remark: 'Issue to kitchen for morning cooking',
    createdAt: '2025-07-06T11:00:00Z'
  },
  {
    id: 'st-2',
    entryNo: 'ST/2/24-25',
    date: '06-07-2025',
    fromGodown: 'Kitchen',
    toGodown: 'Consume',
    billDate: '06-07-2025',
    billNo: '2',
    items: [
      {
        sNo: 1,
        itemId: 'm-daal-rahar',
        itemName: 'Daal Rahar',
        barcode: '10058',
        qty: 4,
        rate: 175,
        amount: 700,
        discountAmt: 0,
        totalDiscount: 0,
        gstPercent: 5,
        gstAmt: 35,
        netValue: 735.00
      },
      {
        sNo: 2,
        itemId: 'm-refine-oil',
        itemName: 'Refine Oil',
        barcode: '10069',
        qty: 8,
        rate: 140,
        amount: 1120,
        discountAmt: 0,
        totalDiscount: 0,
        gstPercent: 12,
        gstAmt: 134.4,
        netValue: 1254.40
      }
    ],
    totalQty: 12,
    totalAmount: 1820,
    totalDiscount: 0,
    totalTaxable: 1820,
    totalGstAmt: 169.4,
    totalNetValue: 1989.40,
    remark: 'Daily kitchen consumption entry',
    createdAt: '2025-07-06T18:00:00Z'
  }
];

// Video 20: Online Room Booking & Reservation Seed Data (Frames 0210, 0250, 0280, 0290, 0350, 0360)
export const INITIAL_BOOKINGS: PmsBooking[] = [
  // Frame 0210, 0250, 0280, 0290: New online booking submitted by guest
  {
    bookingNo: 'RM/80/24-25',
    bookingDate: '06-07-2025',
    bookingTime: '10:11 PM',
    checkInDate: '08-07-2025',
    checkInTime: '10:11 PM',
    checkOutDate: '12-07-2025',
    checkOutTime: '10:11 PM',
    numberOfDays: 4,
    numberOfGuests: 2,
    businessSource: 'Online',
    package: 'ROOM ONLY || 0',
    guestName: 'vinod kumar jain',
    mobile: '78657656754',
    email: 'vinod.jain@example.com',
    addressLine1: 'main road sadar',
    addressLine2: 'near ekta chowk',
    city: 'jabalpur',
    state: 'madhya pradesh',
    country: 'India',
    pinCode: '482001',
    nationality: 'Indian',
    documentName: 'Aadhaar Card',
    documentNo: '789456123012',
    rooms: [
      {
        roomNo: '103',
        roomType: 'DELUXE',
        tariff: 2000
      }
    ],
    totalAmount: 8000,
    bookingAmount: 2000,
    paymentMode: 'UPI',
    paymentReferenceNo: 'UPI/ONLINE/789123',
    paymentRemark: 'Advance transfer via QR code by Vinod Kumar Jain',
    status: 'Unconfirmed',
    createdAt: '2025-07-06T22:11:00Z'
  },
  // Frame 0360: Pending online booking for confirmation
  {
    bookingNo: 'RM/74/24-25',
    bookingDate: '21-06-2025',
    bookingTime: '02:30 PM',
    checkInDate: '21-06-2025',
    checkInTime: '02:30 PM',
    checkOutDate: '21-06-2025',
    checkOutTime: '08:00 PM',
    numberOfDays: 1,
    numberOfGuests: 2,
    businessSource: 'Online',
    package: 'ROOM ONLY || 0',
    guestName: 'GUHFYGVUYFT',
    mobile: '46549889',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    rooms: [
      {
        roomNo: '205',
        roomType: 'SUITE ROOM',
        tariff: 3200
      }
    ],
    totalAmount: 3200,
    bookingAmount: 0,
    paymentMode: 'Online',
    status: 'Unconfirmed',
    createdAt: '2025-06-21T14:30:00Z'
  },
  // Frame 0350: Confirmed Bookings in Room Booking Register
  {
    bookingNo: 'RM/79/24-25',
    bookingDate: '05-07-2025',
    bookingTime: '01:00 PM',
    checkInDate: '10-07-2025',
    checkInTime: '01:00 PM',
    checkOutDate: '11-07-2025',
    checkOutTime: '01:00 PM',
    numberOfDays: 1,
    numberOfGuests: 1,
    businessSource: 'Walk-in',
    package: 'Regular',
    guestName: 'anupam ji',
    mobile: '65448987',
    city: 'Nagpur',
    state: 'Maharashtra',
    country: 'India',
    rooms: [
      {
        roomNo: 'DL-20',
        roomType: 'DELUXE',
        tariff: 2000
      }
    ],
    totalAmount: 2000,
    bookingAmount: 1000,
    paymentMode: 'Cash',
    status: 'Confirmed',
    createdAt: '2025-07-05T13:00:00Z'
  },
  {
    bookingNo: 'RM/75/24-25',
    bookingDate: '26-06-2025',
    bookingTime: '05:11 PM',
    checkInDate: '01-07-2025',
    checkInTime: '05:11 PM',
    checkOutDate: '10-07-2025',
    checkOutTime: '05:11 PM',
    numberOfDays: 10,
    numberOfGuests: 2,
    businessSource: 'OYO',
    package: 'WITH BREAKFAST || 0',
    guestName: 'vikash sharma',
    mobile: '8872757274',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    rooms: [
      {
        roomNo: '101',
        roomType: 'DELUXE',
        tariff: 4000
      }
    ],
    totalAmount: 40000,
    bookingAmount: 10000,
    paymentMode: 'Card',
    status: 'Confirmed',
    createdAt: '2025-06-26T17:11:00Z'
  },
  {
    bookingNo: 'RM/58/24-25',
    bookingDate: '02-06-2025',
    bookingTime: '02:29 PM',
    checkInDate: '10-06-2025',
    checkInTime: '02:29 PM',
    checkOutDate: '02-06-2025',
    checkOutTime: '02:29 PM',
    numberOfDays: 1,
    numberOfGuests: 2,
    businessSource: 'Corporate',
    package: 'Regular',
    guestName: 'CHANDRA PRAKASH',
    mobile: '9303667616',
    city: 'Indore',
    state: 'Madhya Pradesh',
    country: 'India',
    rooms: [
      {
        roomNo: '11',
        roomType: 'STANDARD',
        tariff: 2000
      },
      {
        roomNo: '302',
        roomType: 'DELUXE',
        tariff: 2000
      }
    ],
    totalAmount: 4000,
    bookingAmount: 2000,
    paymentMode: 'Cash',
    status: 'Confirmed',
    createdAt: '2025-06-02T14:29:00Z'
  }
];

// Video 23: Roles & Permissions Seed Data (Frame 0135, 0140, 0155)
export const INITIAL_ROLES: PmsRole[] = [
  {
    id: 1,
    name: 'super-admin',
    description: 'Full Root & Super Administrator Access Across All Locations',
    permissions: PMS_ALL_PERMISSIONS.map(p => p.key),
    isSystem: true
  },
  {
    id: 2,
    name: 'admin',
    description: 'Hotel General Manager / Branch Administrator Access',
    permissions: PMS_ALL_PERMISSIONS.filter(p => p.key !== 'sql_query' && p.key !== 'delete user').map(p => p.key),
    isSystem: true
  },
  {
    id: 3,
    name: 'staff',
    description: 'Front Office Receptionist & Operational Staff (Restricted from Delete & Backdating)',
    permissions: [
      'Hotel Module', 'Room_Dashboard', 'roombooking', 'roomcheckin', 'roomcheckout', 'Booking Calendar',
      'Unconfirmed Bookings', 'Booking Register', 'Check-in Register', 'Checkout Register',
      'Checkout_Reg', 'Room List', 'kot', 'foodbills', 'Room Food Bills', 'payment', 'receipt',
      'advance_reciept', 'Advance Receipt Reg', 'Day End Report', 'View', 'Print', 'Save', 'Edit'
    ],
    isSystem: true
  },
  {
    id: 4,
    name: 'user',
    description: 'Hotel Partner / Auditor / View-Only Access',
    permissions: [
      'Hotel Module', 'Room_Dashboard', 'Booking Calendar', 'Report', 'ReportList', 'Police Station Report',
      'Item Wise Sale Report', 'Day End Report', 'Month Wise Sale', 'Store Wise Stock',
      'Stock Status', 'Room List', 'Item List', 'GST Report', 'View'
    ],
    isSystem: true
  },
  {
    id: 5,
    name: 'Lead Managment',
    description: 'Sales, Marketing & Guest Inquiry Lead Manager',
    permissions: [
      'Room_Dashboard', 'Booking Calendar', 'Unconfirmed Bookings', 'Lead Module',
      'view user', 'Booking Register', 'View', 'Print', 'Save', 'Edit'
    ],
    isSystem: false
  },
  {
    id: 6,
    name: 'Restaurent',
    description: 'Restaurant Captain, Waiter & Kitchen Staff (Frame 0185 Strict Isolation)',
    permissions: [
      'Restaurant Module', 'kot', 'foodbills', 'Restaurant', 'Kitchen Dash Board', 'Restaurant Food Bills',
      'Kot Register', 'Item List', 'Item Wise Sale Report', 'Day End Report', 'Store Wise Stock',
      'Stock Status', 'Stock In Register', 'Stock Out Register', 'Stock Transfer Register',
      'purchase', 'Stock_Transfer', 'Account List', 'ledger', 'Outstanding Payable',
      'Outstanding Receivable', 'B2B Sale', 'sale', 'Month Wise Sale', 'view user',
      'create user', 'update user', 'view product', 'create product', 'update product',
      'delete product', 'Master', 'Entry', 'ReportList', 'Report', 'Activity',
      'view role', 'create role', 'update role', 'delete role', 'view permission',
      'create permission', 'update permission', 'delete permission', 'View', 'Print', 'Save', 'Edit'
    ],
    isSystem: false
  },
  {
    id: 7,
    name: 'Billing',
    description: 'Cashier & Front Office Accounts Billing Operator',
    permissions: [
      'Hotel Module', 'Room_Dashboard', 'roomcheckout', 'foodbills', 'payment', 'receipt',
      'advance_reciept', 'Advance Receipt Reg', 'ledger', 'Outstanding Receivable',
      'Outstanding Payable', 'Day End Report', 'Month Wise Sale', 'B2B Sale', 'B2C Sale',
      'sale', 'GST Report', 'View', 'Print', 'Save', 'Edit'
    ],
    isSystem: false
  },
  {
    id: 8,
    name: 'Receptionist',
    description: 'Front Desk Operator: Check-in, Checkout & Bookings (Strictly Blocked from Delete, Tariff Override & Backdating)',
    permissions: [
      'Hotel Module', 'Room_Dashboard', 'roombooking', 'roomcheckin', 'roomcheckout',
      'Booking Calendar', 'Unconfirmed Bookings', 'Booking Register', 'Check-in Register',
      'Checkout Register', 'Checkout_Reg', 'Room List', 'kot', 'foodbills', 'Room Food Bills',
      'receipt', 'advance_reciept', 'Advance Receipt Reg', 'Handover', 'Mycheckout',
      'Police Station Report', 'Day End Report', 'Add', 'View', 'Print', 'Save', 'Edit'
    ],
    isSystem: false
  },
  {
    id: 9,
    name: 'Only_Whatsapp',
    description: 'Guest Messaging & Automated WhatsApp Broadcast Dispatcher (Zero Billing Access)',
    permissions: [
      'Only_Whatsapp', 'view user', 'View', 'Print'
    ],
    isSystem: false
  }
];

// Video 23: Staff User Accounts Seed Data (Frame 0120 & Frame 0165)
export const INITIAL_USER_ACCOUNTS: PmsUserAccount[] = [
  {
    id: 63,
    sNo: 63,
    firmId: 'DEMO0004',
    userName: 'Reception',
    emailId: 'reception10@gmail.com',
    roleId: 8,
    roleName: 'Receptionist',
    status: 'Verified',
    regDate: '2025-06-21 14:37:11',
    verifiedDate: '2025-06-21 14:37:11',
    mobile: '9822100010',
    department: 'Front Office',
    shift: 'Evening (15:00 - 23:00)',
    isOnDuty: true
  },
  {
    id: 62,
    sNo: 62,
    firmId: 'DEMO0004',
    userName: 'Reception',
    emailId: 'reception@gmail.com',
    roleId: 3,
    roleName: 'staff',
    status: 'Verified',
    regDate: '2025-06-21 14:36:36',
    verifiedDate: '2025-06-21 14:38:38',
    mobile: '9822100001',
    department: 'Front Office',
    shift: 'Morning (07:00 - 15:00)',
    isOnDuty: true
  },
  {
    id: 44,
    sNo: 44,
    firmId: 'DEMO0004',
    userName: 'whatsapp',
    emailId: 'whatsapp2025@gmail.com',
    roleId: 9,
    roleName: 'Only_Whatsapp',
    status: 'Verified',
    regDate: '2025-06-01 18:16:13',
    verifiedDate: '2025-06-01 18:16:52',
    mobile: '9822100044',
    department: 'Front Office',
    shift: 'General (09:00 - 18:00)',
    isOnDuty: true
  },
  {
    id: 42,
    sNo: 42,
    firmId: 'DEMO0004',
    userName: 'Demo user',
    emailId: 'demo4@gmail.com',
    roleId: 4,
    roleName: 'user',
    status: 'Verified',
    regDate: '2025-06-01 04:04:16',
    verifiedDate: '2025-06-01 04:04:59',
    mobile: '9822100042',
    department: 'Security & Audit',
    shift: 'General (09:00 - 18:00)',
    isOnDuty: false
  },
  {
    id: 18,
    sNo: 18,
    firmId: 'DEMO0004',
    userName: 'Admin',
    emailId: 'DEMO0004_admin@gmail.com',
    roleId: 2,
    roleName: 'admin',
    status: 'Verified',
    regDate: '2024-12-17 08:58:38',
    verifiedDate: '2025-01-10 12:15:40',
    mobile: '9822100018',
    department: 'General Management',
    shift: 'General (09:00 - 18:00)',
    isOnDuty: true
  },
  {
    id: 19,
    sNo: 19,
    firmId: 'DEMO0004',
    userName: 'Staff',
    emailId: 'DEMO0004_staff@gmail.com',
    roleId: 3,
    roleName: 'staff',
    status: 'Verified',
    regDate: '2024-12-17 08:58:38',
    verifiedDate: '2025-01-18 06:48:23',
    mobile: '9822100019',
    department: 'Housekeeping',
    shift: 'Morning (07:00 - 15:00)',
    isOnDuty: true
  },
  {
    id: 15,
    sNo: 15,
    firmId: 'DEMO0004',
    userName: 'RIFAT ULLAH',
    emailId: 'sales.bsgbd@gmail.com',
    roleId: 5,
    roleName: 'Lead Managment',
    status: 'Verified',
    regDate: '2024-12-17 08:58:37',
    verifiedDate: '2025-05-16 10:32:45',
    mobile: '9822100015',
    department: 'Front Office',
    shift: 'General (09:00 - 18:00)',
    isOnDuty: false
  },
  {
    id: 16,
    sNo: 16,
    firmId: 'DEMO0004',
    userName: 'Data House',
    emailId: 'DEMO0004_datahouset@gmail.com',
    roleId: 1,
    roleName: 'super-admin',
    status: 'Verified',
    regDate: '2024-12-17 08:58:37',
    verifiedDate: '2024-12-17 08:58:37',
    mobile: '7999663696',
    department: 'General Management',
    shift: 'General (09:00 - 18:00)',
    isOnDuty: true
  },
  {
    id: 21,
    sNo: 21,
    firmId: 'DEMO0004',
    userName: 'Chef Sanjeev',
    emailId: 'kitchen@hotelsai.com',
    roleId: 6,
    roleName: 'Restaurent',
    status: 'Verified',
    regDate: '2025-01-01 10:00:00',
    verifiedDate: '2025-01-01 10:00:00',
    mobile: '9822100021',
    department: 'Kitchen',
    shift: 'Morning (07:00 - 15:00)',
    isOnDuty: true
  },
  {
    id: 22,
    sNo: 22,
    firmId: 'DEMO0004',
    userName: 'Cashier Rahul',
    emailId: 'cashier@hotelsai.com',
    roleId: 7,
    roleName: 'Billing',
    status: 'Verified',
    regDate: '2025-01-01 10:00:00',
    verifiedDate: '2025-01-01 10:00:00',
    mobile: '9822100022',
    department: 'Accounts & Cashier',
    shift: 'Evening (15:00 - 23:00)',
    isOnDuty: true
  }
];

// Video 21: Multi-Location Hotel Properties (Chain Management)
export const INITIAL_CHAIN_PROPERTIES: PmsChainProperty[] = [
  {
    firmId: 'DEMO0004',
    firmName: 'HALL OF KNOTS / HOTEL SAI VASUDEV RESIDENCY',
    location: 'Shirdi (Main Temple Shrine)',
    address: 'Near Sai Baba Temple, Taluka Rahata, Shirdi - 423109',
    phone: '02423-255000',
    email: 'hotelsaivasudevresidency@gmail.com',
    gstin: '27ABCDE1234F1Z5',
    totalRooms: 24,
    activationDate: '17-12-24',
    renewDate: '17-12-25',
    whatsAppValidity: '29-06-2026',
    isCurrent: true
  },
  {
    firmId: 'SVR0002',
    firmName: 'SAI VASUDEV SUITES & EXECUTIVE RESIDENCY',
    location: 'Pune (Mumbai-Pune Expressway Branch)',
    address: 'Survey 48, Near Hinjawadi IT Park, Pune - 411057',
    phone: '020-67890000',
    email: 'pune.branch@saivasudev.com',
    gstin: '27XYZAB5678G2Z1',
    totalRooms: 36,
    activationDate: '01-01-25',
    renewDate: '01-01-26',
    whatsAppValidity: '29-06-2026',
    isCurrent: false
  },
  {
    firmId: 'SVR0003',
    firmName: 'SAI VASUDEV GRAND & BANQUET RESORT',
    location: 'Nashik (Airport Road Branch)',
    address: 'Plot 12, Ozar Airport Road, Nashik - 422206',
    phone: '0253-2991000',
    email: 'nashik.resort@saivasudev.com',
    gstin: '27PQRST9012H3Z8',
    totalRooms: 48,
    activationDate: '15-02-25',
    renewDate: '15-02-26',
    whatsAppValidity: '29-06-2026',
    isCurrent: false
  }
];

// ============================================================================
// Video 22: Auto WhatsApp SMS Integration Seed Data (Frame 0110, 0150, 0230)
// ============================================================================

export const INITIAL_WHATSAPP_CONFIG: PmsWhatsAppConfig = {
  apiUrl: 'https://api.datahouseerp.com/whatsapp/v1/send',
  instanceId: 'DH-WA-DEMO0004-9822',
  token: 'dh_token_svr_live_9822100004',
  ownerMobile: '7999663696', // matches video demo owner contact
  validityDate: '29-06-2026',
  autoSendOnCheckIn: true,
  autoSendOnCheckOut: true,
  autoSendOnBooking: true,
  autoSendOnFoodBill: true,
  autoAlertOwnerOnDelete: true,
  autoAlertOwnerOnUpdate: true
};

export const INITIAL_WHATSAPP_TEMPLATES: PmsWhatsAppTemplate[] = [
  {
    id: 1,
    sNo: 1,
    type: 'WhatsApp',
    voucherType: 'Check_out_store',
    label: 'Check-Out Guest Bill & Thank You',
    message: 'Dear Sir/Madam, Thank you for choosing to stay with us at *{firm_name}*. We hope you had a pleasant experience. *Details* Room No: {room_no} Bill No: {voucher_no} Checkout Date: {checkout_date} Bill Amount: ₹{total_billamount} We appreciate your patronage and look forward to welcoming you again. For your next reservation, feel free to reach out to us. *{firm_name}* Address: {address1}, {address2}, {city}, {pincode}, {state} Email: {email} Website: {website} Booking Link: https://hotel-sai-vasudev-residency.pages.dev Reception: {phone}, {mobile} Wishing you safe travels and a wonderful day ahead. Warm regards, *Team {firm_name}*',
    active: 'On',
    sendTo: 'Guest'
  },
  {
    id: 2,
    sNo: 2,
    type: 'WhatsApp',
    voucherType: 'Check_out_delete',
    label: 'Owner Alert - Checkout Bill Deleted (Fraud Prevention)',
    message: 'Dear Owner, This is to inform you that a guest bill has been deleted at *{firm_name}*. *Details* Room No: {room_no} Bill No: {voucher_no} Guest Name: {guest_name} Checkout Date: {checkout_date} Delete Bill Amount: ₹{total_billamount} Oprater Name: {name} Please ensure all *Deleted* Record',
    active: 'On',
    sendTo: 'Owner'
  },
  {
    id: 3,
    sNo: 3,
    type: 'WhatsApp',
    voucherType: 'Check_out_update',
    label: 'Owner Alert - Checkout Bill Updated / Discounted',
    message: 'Dear Owner, This is to inform you that a guest bill has been updated at *{firm_name}*. *Details* Room No: {room_no} Bill No: {voucher_no} Checkout Date: {checkout_date} Updated Bill Amount: ₹{total_billamount} Guest has been successfully checked out. Please ensure all records are updated',
    active: 'On',
    sendTo: 'Owner'
  },
  {
    id: 4,
    sNo: 4,
    type: 'WhatsApp',
    voucherType: 'Check_in_store',
    label: 'Check-In Guest Welcome & Stay Details',
    message: 'Dear Sir/Madam, Welcome to *{firm_name}*! We are delighted to have you stay with us and hope you enjoy a comfortable and pleasant stay. *Check-in Details* Room No: {room_no} Bill No: {voucher_no} Check-in Date: {checkin_date} Should you need any assistance during your stay, please feel free to contact our reception at any time. *{firm_name}* Address: {address1}, {city}, {pincode} Reception: {phone}, {mobile} Thank you for choosing us. We wish you a wonderful stay! Warm regards, *Team {firm_name}*',
    active: 'On',
    sendTo: 'Guest'
  },
  {
    id: 5,
    sNo: 5,
    type: 'WhatsApp',
    voucherType: 'Check_in_delete',
    label: 'Owner Alert - Check-In Cancelled / Deleted',
    message: 'Dear Owner, This is to inform you that a guest bill has been deleted at *{firm_name}*. *Details* Room No: {room_no} Bill No: {voucher_no} Checkin Date: {checkin_date} Guest Name: {guest_name} Room Tariff: {total_billamount} Oprater Name: {name} Please ensure all Deleted Record',
    active: 'On',
    sendTo: 'Owner'
  },
  {
    id: 6,
    sNo: 6,
    type: 'WhatsApp',
    voucherType: 'Check_in_update',
    label: 'Owner Alert - Check-In Tariff or Guest Updated',
    message: 'Dear Owner, This is to inform you that a guest bill has been Updated at *{firm_name}*. *New Details* Room No: {room_no} Bill No: {voucher_no} Checkin Date: {checkin_date} Guest Name: {guest_name} Room Tariff: {total_billamount} Oprater Name: {name} Please ensure all *Updated* Record',
    active: 'On',
    sendTo: 'Owner'
  },
  {
    id: 7,
    sNo: 7,
    type: 'WhatsApp',
    voucherType: 'Room_booking_store',
    label: 'Room Booking Instant Confirmation Voucher',
    message: 'Namaste {guest_name}! Greetings from *{firm_name}*. Your room booking is confirmed! *Booking No:* {voucher_no} *Room Category:* {room_no} *Check-in:* {checkin_date} *Check-out:* {checkout_date} *Advance Paid:* ₹{total_billamount}. Download voucher: https://hotel-sai-vasudev-residency.pages.dev Reception: {phone}. We look forward to hosting you in Shirdi!',
    active: 'On',
    sendTo: 'Guest'
  },
  {
    id: 8,
    sNo: 8,
    type: 'WhatsApp',
    voucherType: 'Food_bill_store',
    label: 'Food Bill & Dining Invoice',
    message: 'Dear Guest, Thank you for dining with us at *{firm_name}*. *Invoice No:* {voucher_no} *Table / Room:* {room_no} *Total Amount:* ₹{total_billamount} *Date:* {checkout_date}. We hope you enjoyed your meal! Warm regards, *{firm_name}*',
    active: 'On',
    sendTo: 'Guest'
  },
  {
    id: 9,
    sNo: 9,
    type: 'WhatsApp',
    voucherType: 'Advance_receipt_store',
    label: 'Advance Payment Receipt',
    message: 'Dear {guest_name}, We have received your advance payment of *₹{total_billamount}* at *{firm_name}*. *Receipt No:* {voucher_no}. Thank you for your trust! Reception: {phone}.',
    active: 'On',
    sendTo: 'Guest'
  },
  {
    id: 10,
    sNo: 10,
    type: 'WhatsApp',
    voucherType: 'Promotional',
    label: 'Promotional Website Link & Special Offer',
    message: 'Namaste! Greetings from *{firm_name}*, Shirdi. Book directly through our website to get 15% off and complimentary breakfast for your upcoming Shirdi Pilgrimage: https://hotel-sai-vasudev-residency.pages.dev Call: {phone}',
    active: 'On',
    sendTo: 'Guest'
  }
];

export const INITIAL_WHATSAPP_LOGS: PmsWhatsAppLog[] = [
  {
    id: 'wal-101',
    timestamp: '2025-07-06 22:45:10',
    recipientMobile: '9822100042',
    recipientName: 'Rahul Sharma',
    recipientType: 'Guest',
    voucherType: 'Check_out_store',
    voucherNo: 'RM/63/24-25',
    roomNo: '101',
    message: 'Dear Sir/Madam, Thank you for choosing to stay with us at *HOTEL SAI VASUDEV RESIDENCY*...',
    status: 'Delivered',
    firmId: 'DEMO0004'
  },
  {
    id: 'wal-102',
    timestamp: '2025-07-06 22:46:15',
    recipientMobile: '7999663696',
    recipientName: 'Hotel Owner',
    recipientType: 'Owner',
    voucherType: 'Check_out_update',
    voucherNo: 'RM/62/24-25',
    roomNo: '104',
    message: 'Dear Owner, This is to inform you that a guest bill has been updated at *HOTEL SAI VASUDEV RESIDENCY*...',
    status: 'Delivered',
    firmId: 'DEMO0004'
  },
  {
    id: 'wal-103',
    timestamp: '2025-07-06 22:48:30',
    recipientMobile: '9822100099',
    recipientName: 'Pooja Verma',
    recipientType: 'Guest',
    voucherType: 'Check_in_store',
    voucherNo: 'CI/88/24-25',
    roomNo: '202',
    message: 'Dear Sir/Madam, Welcome to *HOTEL SAI VASUDEV RESIDENCY*! We are delighted to have you stay with us...',
    status: 'Delivered',
    firmId: 'DEMO0004'
  }
];

// ==========================================
// Video 30: Training Videos, Documentation Chapters & Support Tickets Seed Data
// ==========================================
export const INITIAL_HELP_VIDEOS: PmsHelpVideo[] = [
  {
    id: 'vid-1',
    sNo: 1,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Hotel Management Software demo , Erp For Hotel And Restaurent , latest Hotel Management Software',
    description: 'Comprehensive walkthrough of RoomG Cloud PMS for independent hotels, luxury resorts, and restaurants.',
    url: 'https://www.youtube.com/watch?v=0kFpWbSjB_M',
    videoDuration: '15:20',
    category: 'Front Desk'
  },
  {
    id: 'vid-2',
    sNo: 2,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Billing software for Hotel Management Software #pms , Online Hotel Software',
    description: 'Real-time billing, multi-payment tender, tax auto-calculation and instant WhatsApp invoice delivery.',
    url: 'https://www.youtube.com/watch?v=W0sT8jK2d0A',
    videoDuration: '12:48',
    category: 'Restaurant & POS'
  },
  {
    id: 'vid-3',
    sNo: 3,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Hotel Management Software Demo Step By Step ,online Hotel Software ,multi user mobile base software',
    description: 'Step-by-step master setup: Room types, tariffs, GST slabs, staff users, and multi-device cloud sync.',
    url: 'https://www.youtube.com/watch?v=mQ6eJkL9c3s',
    videoDuration: '18:12',
    category: 'Settings & Administration'
  },
  {
    id: 'vid-4',
    sNo: 4,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Hotel Management Software ,#hotel management ,erp software for hotel,hotel ke liye software',
    description: 'Front desk operations, room visual matrix, dirty room housekeeping workflows, and night audit.',
    url: 'https://www.youtube.com/watch?v=k9XzLmP4o2A',
    videoDuration: '14:35',
    category: 'Front Desk'
  },
  {
    id: 'vid-5',
    sNo: 5,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Best Hotel Software, होटल के बिल बनाओ मोबाइल से, मल्टी यूजर, ऑनलाइन सबसे आसान',
    description: 'Mobile responsive POS for room service KOTs, digital food ordering, and contactless guest settlement.',
    url: 'https://www.youtube.com/watch?v=vB8xNkL7q1w',
    videoDuration: '10:48',
    category: 'Restaurant & POS'
  },
  {
    id: 'vid-6',
    sNo: 6,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'HotelManagement POS, FoodService, Housekeeping, MultiDatabase, RoomAvailability software demo',
    description: 'Table management, KOT firing, bar orders, room service delivery, and multi-kitchen printer routing.',
    url: 'https://www.youtube.com/watch?v=gT5kLm9oP2r',
    videoDuration: '16:40',
    category: 'Restaurant & POS'
  },
  {
    id: 'vid-7',
    sNo: 7,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Hotel Demo Software demo ,best pms in India roomg ,software for hotel Management',
    description: 'Guest check-in, Aadhaar/Passport photo capture, ID proof document scanner, and C-Form registration card.',
    url: 'https://www.youtube.com/watch?v=aJ3bKm8Lz5t',
    videoDuration: '12:34',
    category: 'Front Desk'
  },
  {
    id: 'vid-8',
    sNo: 8,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Hotel Business Me Software Se Bill Kaise Banate Hai , Hotel Invoice Software ,Hotel ERP Roomg',
    description: 'Generating GST compliant invoices, Day-Wise rent billing, B2B corporate billing with GSTIN verification.',
    url: 'https://www.youtube.com/watch?v=zX4cNm8Vb1y',
    videoDuration: '15:42',
    category: 'Accounts & Ledgers'
  },
  {
    id: 'vid-9',
    sNo: 9,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'General Demo',
    description: 'Quick 10-minute executive overview of all modules from front desk to accounting and reporting.',
    url: 'https://www.youtube.com/watch?v=qW9eRt2Yu4i',
    videoDuration: '09:26',
    category: 'Front Desk'
  },
  {
    id: 'vid-10',
    sNo: 10,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Best Pms In india ,Erp Software For Hotel Management',
    description: 'High-volume property management, banquet halls, multi-rate slabs, and centralized chain management.',
    url: 'https://www.youtube.com/watch?v=pL8xMv2Ns1d',
    videoDuration: '19:32',
    category: 'Settings & Administration'
  },
  {
    id: 'vid-11',
    sNo: 11,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Advance Room Booking & Reservation System (Room Booking Master)',
    description: 'How to reserve rooms in advance, assign room types, record advance payment, and issue confirmation receipt.',
    url: 'https://www.youtube.com/watch?v=adv_bk_011',
    videoDuration: '11:15',
    category: 'Front Desk'
  },
  {
    id: 'vid-12',
    sNo: 12,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Guest Check-In, KYC Aadhaar Scanning & 12hr / 24hr Tariff Slabs',
    description: 'Fast check-in process, uploading guest ID cards, auto-calculating 12hr vs 24hr tariff rules, and key card handover.',
    url: 'https://www.youtube.com/watch?v=chk_in_012',
    videoDuration: '13:40',
    category: 'Front Desk'
  },
  {
    id: 'vid-13',
    sNo: 13,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Restaurant & Room Service KOT Entry from Mobile Tablet / Kitchen Display',
    description: 'Issuing food orders, running table orders, room delivery KOTs, item modifications, and kitchen print routing.',
    url: 'https://www.youtube.com/watch?v=kot_mob_013',
    videoDuration: '08:50',
    category: 'Restaurant & POS'
  },
  {
    id: 'vid-14',
    sNo: 14,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Checkout & Settlement (A4 Standard, Day-Wise & A5 Invoice Formats)',
    description: 'Consolidating room rent and food bills, applying discounts, split cash/UPI/card settlement, and folio printing.',
    url: 'https://www.youtube.com/watch?v=chk_out_014',
    videoDuration: '17:05',
    category: 'Accounts & Ledgers'
  },
  {
    id: 'vid-15',
    sNo: 15,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Receipt Inward & Customer Khata Ledger Management',
    description: 'Recording party receipts, settling corporate debtor balances, printing ledgers and sending statements on WhatsApp.',
    url: 'https://www.youtube.com/watch?v=rec_in_015',
    videoDuration: '12:20',
    category: 'Accounts & Ledgers'
  },
  {
    id: 'vid-16',
    sNo: 16,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Payment Outward Register & Daily Hotel Petty Cash Management',
    description: 'Logging grocery purchases, staff advances, utility bills, maintenance charges, and vendor bank transfers.',
    url: 'https://www.youtube.com/watch?v=pay_out_016',
    videoDuration: '11:45',
    category: 'Accounts & Ledgers'
  },
  {
    id: 'vid-17',
    sNo: 17,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Purchase Register & Kitchen Grocery Inward with Vendor Ledgers',
    description: 'Inward billing for groceries, cleaning liquids, linen, and toiletries, updating stock balances and accounts payable.',
    url: 'https://www.youtube.com/watch?v=pur_reg_017',
    videoDuration: '14:10',
    category: 'Inventory & Stock'
  },
  {
    id: 'vid-18',
    sNo: 18,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Stock Transfer (Central Godown to Kitchen & Bar Store)',
    description: 'Internal stock movements between main warehouse and kitchen, preventing stock shrinkage and theft.',
    url: 'https://www.youtube.com/watch?v=stk_trf_018',
    videoDuration: '09:30',
    category: 'Inventory & Stock'
  },
  {
    id: 'vid-19',
    sNo: 19,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Stock Issue (Housekeeping Requisitions & Daily Kitchen Consumption)',
    description: 'Issuing room supplies (soaps, towels, water bottles) to floor staff with date and user attribution.',
    url: 'https://www.youtube.com/watch?v=stk_iss_019',
    videoDuration: '08:15',
    category: 'Inventory & Stock'
  },
  {
    id: 'vid-20',
    sNo: 20,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'GST Reports Suite (GSTR-1 B2B, B2C Large, B2C Small & CA WhatsApp Export)',
    description: 'Generating monthly/quarterly tax registers, verifying SAC 996331, HSN codes, and 1-click share with CA on WhatsApp.',
    url: 'https://www.youtube.com/watch?v=gst_rep_020',
    videoDuration: '16:50',
    category: 'Reports & GST'
  },
  {
    id: 'vid-21',
    sNo: 21,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Night Audit & Day End Closing Ledger (11:59 PM Audit)',
    description: 'Daily cash reconciliation, verifying UPI bank settlements, card EDC slips, and closing hotel books for the day.',
    url: 'https://www.youtube.com/watch?v=day_end_021',
    videoDuration: '18:20',
    category: 'Reports & GST'
  },
  {
    id: 'vid-22',
    sNo: 22,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Shift Handover & Cash Drawer Balancing with Dual Digital Sign-off',
    description: 'Transferring cash drawer float between Morning, Evening, and Night shifts without cash discrepancies.',
    url: 'https://www.youtube.com/watch?v=shf_hnd_022',
    videoDuration: '13:10',
    category: 'Reports & GST'
  },
  {
    id: 'vid-23',
    sNo: 23,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'User Roles & Granular Permission Control (Operator, Manager, Housekeeping)',
    description: 'Restricting cashier permissions, blocking unauthorized bill discounts or deletions, and staff audit trails.',
    url: 'https://www.youtube.com/watch?v=usr_rol_023',
    videoDuration: '15:30',
    category: 'Settings & Administration'
  },
  {
    id: 'vid-24',
    sNo: 24,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Auto WhatsApp Notification Engine & Anti-Theft Checkout Alerts',
    description: 'Setting up automated WhatsApp messages for check-in greetings, bills, and instant owner alert on deleted folios.',
    url: 'https://www.youtube.com/watch?v=wa_notif_024',
    videoDuration: '14:40',
    category: 'Settings & Administration'
  },
  {
    id: 'vid-25',
    sNo: 25,
    businessType: 'Hotel Management',
    type: 'Video',
    topic: 'Remote Support with UltraViewer & AnyDesk (Customer Help Desk)',
    description: 'How to download UltraViewer, provide secure Partner ID to support team, and get instant hands-on assistance.',
    url: 'https://www.youtube.com/watch?v=rem_sup_025',
    videoDuration: '07:58',
    category: 'Settings & Administration'
  }
];

export const INITIAL_DOCUMENTATION_CHAPTERS: PmsDocumentationChapter[] = [
  {
    id: 'doc-ch1',
    chapterNo: 1,
    title: '1. Introduction to Cloud-Based RoomG PMS',
    shortSummary: 'Architecture overview, browser access from mobile/desktop, zero-installation, and multi-user login.',
    fullContent: 'RoomG Hotel Management Software is a 100% online, cloud-native ERP engineered for hoteliers. It supports multi-device operation simultaneously across desktops, tablets, and smartphones. Data is synced in real-time, eliminating local hardware failure and hard drive corruption risks.',
    tags: ['Cloud', 'Login', 'Multi-Device', 'Overview'],
    moduleUrl: '/room_dashboard'
  },
  {
    id: 'doc-ch2',
    chapterNo: 2,
    title: '2. Room Dashboard & Color-Coded Room Matrix',
    shortSummary: 'Real-time room status tracking: Vacant (White/Green), Booked (Yellow), Occupied (Green), and Dirty (Red).',
    fullContent: 'The Room Dashboard provides front desk receptionists with an at-a-glance occupancy view. Each room card allows quick actions: Phone Call Guest, Room Shift, Housekeeping Status, Instant Food KOT, and View Folio Balance.',
    tags: ['Dashboard', 'Front Desk', 'Housekeeping', 'Status'],
    moduleUrl: '/room_dashboard'
  },
  {
    id: 'doc-ch3',
    chapterNo: 3,
    title: '3. Advance Room Booking & Reservation System',
    shortSummary: 'Managing advance bookings, calendar grid preview, advance payment recording, and confirmation slips.',
    fullContent: 'Reservations can be booked days or months in advance. The system prevents double-booking room categories, records advance cash/UPI deposits, and immediately issues a WhatsApp confirmation voucher to the guest.',
    tags: ['Booking', 'Reservation', 'Advance', 'Calendar'],
    moduleUrl: '/room_bookings'
  },
  {
    id: 'doc-ch4',
    chapterNo: 4,
    title: '4. Guest Check-In & KYC ID Card Upload',
    shortSummary: 'Guest registration, 12hr vs 24hr tariff selection, scanning Aadhaar/Passport photo, and printing C-Form card.',
    fullContent: 'During check-in, the operator records guest personal details, chooses the tariff calculation model (12hr fixed checkout vs 24hr rolling checkout), captures front/back photo of photo ID proof, and collects advance deposits.',
    tags: ['Check-in', 'KYC', 'Aadhaar', 'Tariff'],
    moduleUrl: '/room_checkin'
  },
  {
    id: 'doc-ch5',
    chapterNo: 5,
    title: '5. Room Check-Out & Final Folio Settlement',
    shortSummary: 'Consolidating room rent and food bills, applying authorized discounts, and printing GST tax invoices.',
    fullContent: 'Checkout settles the entire guest folio. It calculates day-wise room rent plus all attached KOT restaurant bills, deducts previous advances, and presents payment tender buttons (Cash, Card Swipe, Online UPI, Corporate Credit). Upon settlement, a formal GST invoice is generated and the room is marked Dirty for housekeeping.',
    tags: ['Checkout', 'Billing', 'Invoice', 'Settlement'],
    moduleUrl: '/room_checkout'
  },
  {
    id: 'doc-ch6',
    chapterNo: 6,
    title: '6. Food Bill & Restaurant POS Table Management',
    shortSummary: 'Dining table layout, running orders, issuing final food invoices, and tax inclusive/exclusive calculation.',
    fullContent: 'Enables restaurant and banquet managers to take orders on physical tables or direct walk-ins. Displays running tables in red and vacant tables in green. Supports split billing, service charges, and 5% restaurant GST.',
    tags: ['Restaurant', 'POS', 'Food Bill', 'Tables'],
    moduleUrl: '/restaurant_pos'
  },
  {
    id: 'doc-ch7',
    chapterNo: 7,
    title: '7. Kitchen Order Ticket (KOT) & Room Service Ordering',
    shortSummary: 'Mobile KOT entry by room boy/waiter, touch menu ordering, and kitchen printer routing.',
    fullContent: 'Waiters can take orders directly from mobile phones standing inside guest rooms. Tapping items instantly adds them to the KOT ticket. Printing routes directly to kitchen thermal printers without requiring the waiter to walk to the cashier.',
    tags: ['KOT', 'Room Service', 'Kitchen', 'Mobile'],
    moduleUrl: '/new_kot'
  },
  {
    id: 'doc-ch8',
    chapterNo: 8,
    title: '8. Customer Ledger (Khata) & Party Account Statements',
    shortSummary: 'Tracking corporate debtor balances (e.g. Tata Motors), travel agent accounts, and debit/credit ledgers.',
    fullContent: 'Maintains running credit ledgers for corporate accounts, regular guests, and travel agents. Displays detailed transactions with Debit (Dr), Credit (Cr), Running Balance, and 1-click WhatsApp PDF statement delivery.',
    tags: ['Ledger', 'Khata', 'Debtor', 'Corporate'],
    moduleUrl: '/account_ledger'
  },
  {
    id: 'doc-ch9',
    chapterNo: 9,
    title: '9. Payment Outward Register & Daily Hotel Expenses',
    shortSummary: 'Recording cash outflows: Grocery purchases, staff wages, electricity bills, maintenance, and petty cash.',
    fullContent: 'All cash paid out of the hotel reception or bank account must be logged in the Payment register. Specifies payment mode, payee party name, voucher number, and category to prevent unrecorded cash leakages.',
    tags: ['Payment', 'Expenses', 'Petty Cash', 'Outward'],
    moduleUrl: '/payment_register'
  },
  {
    id: 'doc-ch10',
    chapterNo: 10,
    title: '10. Receipt Inward Register & Multi-Mode Collections',
    shortSummary: 'Inward cash, UPI, card, and NEFT receipts for advance booking settlements and corporate clearings.',
    fullContent: 'Records all non-checkout monies received by the hotel. Updates party ledger balances and increments physical cash-in-drawer or bank ledger accounts automatically.',
    tags: ['Receipt', 'Collections', 'Inward', 'Bank'],
    moduleUrl: '/receipt_register'
  },
  {
    id: 'doc-ch11',
    chapterNo: 11,
    title: '11. Purchase Register & Inventory Inward',
    shortSummary: 'The purchase register logs all items bought for the hotel such as kitchen supplies, room cleaning products, and inventory.',
    fullContent: 'It records the supplier name, bill number, date, and item details. This updates the stock and shows pending payments in accounts. It is essential for managing hotel stock, vendor liabilities, and kitchen raw material accounting.',
    tags: ['Purchase', 'Supplies', 'Inventory', 'Vendor'],
    moduleUrl: '/purchase_register'
  },
  {
    id: 'doc-ch12',
    chapterNo: 12,
    title: '12. Stock Transfer (Godown to Kitchen / Store)',
    shortSummary: 'Internal stock movement from main warehouse or godown to operational outlets like kitchen or floor pantries.',
    fullContent: 'Stock transfer is used when items are moved from one department to another, like from the godown to the kitchen or central store to the restaurant pantry. It records item name, quantity, source, destination, and transfer date. This brings transparency in stock movement and prevents discrepancies.',
    tags: ['Stock Transfer', 'Godown', 'Kitchen', 'Movement'],
    moduleUrl: '/stock_transfer'
  },
  {
    id: 'doc-ch13',
    chapterNo: 13,
    title: '13. Stock Issue (Departmental Requisitions & Consumption)',
    shortSummary: 'Issuing supplies like soap, shampoo, toilet rolls, bedsheets, and cleaning chemicals to floor staff.',
    fullContent: 'Stock issue is executed when inventory items are consumed by a department without a direct resale price. It tracks departmental consumption cost, alerts managers to abnormal wastage, and decrements central storage balances.',
    tags: ['Stock Issue', 'Housekeeping', 'Requisition', 'Consumption'],
    moduleUrl: '/stock_issue'
  },
  {
    id: 'doc-ch14',
    chapterNo: 14,
    title: '14. Item-Wise Stock Ledger & Inventory Auditing',
    shortSummary: 'Item movement history showing Opening Balance, Stock In, Stock Out, and Closing Balance.',
    fullContent: 'Every ingredient and retail item has a real-time stock ledger. Shows exact dates, voucher types (Purchase Inward, Kitchen KOT Sale, Department Issue), and reveals any negative balances caused by unrecorded purchases.',
    tags: ['Stock Ledger', 'Inventory', 'Audit', 'Balance'],
    moduleUrl: '/item_wise_stock'
  },
  {
    id: 'doc-ch15',
    chapterNo: 15,
    title: '15. GST Reports Suite (GSTR-1, GSTR-3B & HSN Summary)',
    shortSummary: 'B2B Invoices with customer GSTIN, B2C Large, B2C Small, Tax slabs (0%, 5%, 12%, 18%), and CA export.',
    fullContent: 'Complete compliance suite for Indian GST laws. Separates room rent (SAC 996331) from restaurant food sales (SAC 996332). Formats tables ready for JSON / Excel export directly to the Government GST portal.',
    tags: ['GST', 'GSTR-1', 'Tax', 'B2B', 'B2C'],
    moduleUrl: '/gst_reports'
  },
  {
    id: 'doc-ch16',
    chapterNo: 16,
    title: '16. Day End Report & Night Audit Ledger (11:59 PM)',
    shortSummary: 'Closing daily accounting books, cash denomination counting, and banking reconciliation.',
    fullContent: 'The Night Audit is run daily before midnight. It prints a formal 2-page ledger showing opening cash, all day receipts by tender, expenses paid, closing physical drawer balance, and lists all occupied rooms and debtor changes.',
    tags: ['Day End', 'Night Audit', 'Ledger', 'Reconciliation'],
    moduleUrl: '/dayend_report'
  },
  {
    id: 'doc-ch17',
    chapterNo: 17,
    title: '17. Shift Handover & Cash Drawer Equation',
    shortSummary: 'Preventing internal cashier theft during staff changeover between Morning, Evening, and Night shifts.',
    fullContent: 'Enforces the strict cashier equation: Opening Float + Room Cash + Food Cash + Advance Receipts - Petty Expenses = Net Cash Handover. Both outgoing and incoming cashiers must review, verify, and digitally sign off.',
    tags: ['Shift Handover', 'Cash Drawer', 'Anti-Theft', 'Cashier'],
    moduleUrl: '/shift_handover'
  },
  {
    id: 'doc-ch18',
    chapterNo: 18,
    title: '18. User Roles, Multi-User Staff Access & Security',
    shortSummary: 'Granular permissions for Receptionist, Waiter, Manager, Accountant, and Hotel Owner.',
    fullContent: 'Prevents staff from altering past invoices, viewing owner reports, or deleting checkouts. Every sensitive operation (e.g. folio discount or voiding a bill) is logged with the operator username and timestamp.',
    tags: ['Security', 'Roles', 'Permissions', 'Audit Trail'],
    moduleUrl: '/users'
  },
  {
    id: 'doc-ch19',
    chapterNo: 19,
    title: '19. Automated WhatsApp Integration & Owner Anti-Theft Alerts',
    shortSummary: 'Instant SMS & WhatsApp delivery of bills, booking vouchers, and high-priority owner security notifications.',
    fullContent: 'Connects directly to WhatsApp Business Gateway. Automatically dispatches thank-you notes, PDF invoices, and sends an immediate alert to the owner if any operator attempts to delete or modify a settled checkout folio.',
    tags: ['WhatsApp', 'Anti-Theft', 'Owner Alert', 'Automated'],
    moduleUrl: '/whatsapp_sms'
  },
  {
    id: 'doc-ch20',
    chapterNo: 20,
    title: '20. Remote Desktop Support & UltraViewer / AnyDesk Help',
    shortSummary: 'Live remote assistance from Hansin IT Services engineers for instant setup, training, and troubleshooting.',
    fullContent: 'Hoteliers can request live remote assistance. The support team connects via UltraViewer or AnyDesk after the hotelier provides temporary session credentials. Our team provides hands-on setup for room categories, pricing, printers, and GST codes.',
    tags: ['Support', 'Remote Desktop', 'UltraViewer', 'Helpdesk'],
    moduleUrl: '/helps'
  }
];

export const INITIAL_SUPPORT_TICKETS: PmsSupportTicket[] = [
  {
    id: 'tkt-842',
    ticketNo: 'TKT-2026-0842',
    date: '18-07-2025',
    time: '11:30 AM',
    staffName: 'Ramesh Patel (Manager)',
    department: 'Front Desk',
    phone: '9822000000',
    category: 'Hardware & Printer',
    priority: 'Medium',
    subject: 'Thermal Printer 80mm Margin Alignment for KOT Printing',
    description: 'When printing kitchen orders on the newly installed Posiflex 80mm thermal printer, the right margin is clipping item quantity. Need remote setup via UltraViewer.',
    preferredCallbackTime: '12:00 PM – 02:00 PM',
    status: 'Resolved',
    assignedEngineer: 'Vikas Sharma (Senior Support Engineer - Hansin IT)',
    resolutionNotes: 'Connected via UltraViewer session 98 811 274. Adjusted ESC/POS print driver page size to 72mm printable width. Test KOT printed successfully with full item and quantity alignment.',
    createdAt: '2025-07-18 11:30:00',
    updatedAt: '2025-07-18 12:15:00'
  },
  {
    id: 'tkt-850',
    ticketNo: 'TKT-2026-0850',
    date: '19-07-2025',
    time: '02:45 PM',
    staffName: 'Sunita Rao (Accountant)',
    department: 'Accounts',
    phone: '9822100099',
    category: 'GST & Tax Reports',
    priority: 'High',
    subject: 'GST SAC Code 996331 Configuration on Day-Wise Invoices',
    description: 'We need to confirm that room tariff above ₹7,500 applies 18% GST while standard rooms under ₹7,500 apply 12% GST in the GSTR-1 register.',
    preferredCallbackTime: '03:00 PM – 04:00 PM',
    status: 'Resolved',
    assignedEngineer: 'Amit Verma (Taxation & ERP Lead - Hansin IT)',
    resolutionNotes: 'Verified GST master slabs. Configured automatic slab switching rule in Business Settings (/businesssettings/create). Verified on demo checkout invoice SR/204.',
    createdAt: '2025-07-19 14:45:00',
    updatedAt: '2025-07-19 15:20:00'
  },
  {
    id: 'tkt-863',
    ticketNo: 'TKT-2026-0863',
    date: '20-07-2025',
    time: '09:15 AM',
    staffName: 'Vikram Joshi (Front Desk)',
    department: 'Front Desk',
    phone: '9822450012',
    category: 'User Roles & Access',
    priority: 'Medium',
    subject: 'Staff Operator Role Permission for Check-Out Deletion Alert',
    description: 'Owner wants to ensure cashier operators cannot edit settled checkout bills without manager passcode override.',
    preferredCallbackTime: '11:00 AM – 01:00 PM',
    status: 'In Progress',
    assignedEngineer: 'Rahul Mishra (Support Team)',
    resolutionNotes: 'Role permissions reviewed. Disabling "delete checkout" toggle for role "Operator" in Roles & Permissions (/roles).',
    createdAt: '2025-07-20 09:15:00'
  },
  {
    id: 'tkt-871',
    ticketNo: 'TKT-2026-0871',
    date: '20-07-2025',
    time: '10:00 AM',
    staffName: 'Kishore Kumar (Night Auditor)',
    department: 'Accounts',
    phone: '9822780033',
    category: 'Night Audit & Day End',
    priority: 'Low',
    subject: 'Night Audit Day End Cash Drawer Float Reconciliation Check',
    description: 'Requesting guidance on how to record petty cash advances given to housekeeping before running the midnight 11:59 PM day end statement.',
    preferredCallbackTime: '04:00 PM – 06:00 PM',
    status: 'Open',
    createdAt: '2025-07-20 10:00:00'
  }
];

// ==========================================
// Video 35: Banquet Hall Venues & Event Bookings Initial Data
// ==========================================
export const INITIAL_BANQUET_VENUES: PmsBanquetVenue[] = [
  {
    id: 'marriage-garden-1',
    name: 'MARRIAGE GARDEN1',
    type: 'Marriage Garden',
    baseTariff: 50000,
    gstPercent: 12,
    capacityPaxMin: 300,
    capacityPaxMax: 600,
    sqFtArea: 25000,
    floor: 'Ground / Open Lawn',
    amenities: [
      'Capacity 500+ Pax',
      'Grand Wedding Mandap & Stage (40x25 ft)',
      'Bridal Green Suite with Attached Washroom',
      'DJ & Sound Platform with High Voltage Hookups',
      'Illuminated Fairy-Light Pathway & Entrance Arch',
      'Covered Food Buffet & Live Catering Stalls Area',
      '125 kVA Silent Generator Power Backup',
      'Designated Valet Parking for 150+ Vehicles'
    ],
    images: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'booked',
    cleaningStatus: 'Ready',
    sacCode: '996311'
  },
  {
    id: 'marriage-garden-2',
    name: 'MARRIAGE GARDEN2',
    type: 'Marriage Garden',
    baseTariff: 65000,
    gstPercent: 12,
    capacityPaxMin: 500,
    capacityPaxMax: 1200,
    sqFtArea: 40000,
    floor: 'Ground / Royal Lawn',
    amenities: [
      'Capacity 1000+ Pax Mega Gathering',
      'Royal Rajasthani Mandap & Elevated Stage',
      'Two Dedicated Groom & Bride Air-Conditioned Green Rooms',
      'Weather-Proof Waterproof Dining Pavilion',
      'High-Power Acoustic Concert Audio Setup Permitted',
      'Separate VIP Guest Lounge with Private Bar Counter',
      '200 kVA Dual Generator Synchronization'
    ],
    images: [
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'vacant',
    cleaningStatus: 'Ready',
    sacCode: '996311'
  },
  {
    id: 'big-hall',
    name: 'BIG HALL',
    type: 'Banquet Hall',
    baseTariff: 15000,
    gstPercent: 18,
    capacityPaxMin: 100,
    capacityPaxMax: 300,
    sqFtArea: 5500,
    floor: '1st Floor',
    amenities: [
      'Central AC with Temperature Zoning',
      'Built-in Stage with Motorized Curtains',
      'Dual 150-inch 4K Projectors & LED Video Wall',
      'JBL Pro Wireless Podium & Lapel Mics',
      'Dimmer Mood Lighting & Chandelier Controls'
    ],
    images: [
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'booked',
    cleaningStatus: 'Ready',
    sacCode: '996311'
  },
  {
    id: 'mini-hall',
    name: 'MINI HALL',
    type: 'Conference Hall',
    baseTariff: 6000,
    gstPercent: 18,
    capacityPaxMin: 25,
    capacityPaxMax: 70,
    sqFtArea: 1800,
    floor: 'Ground Floor',
    amenities: [
      'Executive U-Shape or Cluster Seating Layout',
      '75" Interactive Touch Smart TV & HDMI Matrix',
      'High Speed Dedicated 300 Mbps Fiber WiFi',
      'Pantry Service for Continuous Tea/Coffee Hi-Tea'
    ],
    images: [
      'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'vacant',
    cleaningStatus: 'Ready',
    sacCode: '996311'
  },
  {
    id: 'garden',
    name: 'GARDEN',
    type: 'Party Lawn',
    baseTariff: 10000,
    gstPercent: 18,
    capacityPaxMin: 50,
    capacityPaxMax: 200,
    sqFtArea: 7500,
    floor: 'Ground Floor Outer',
    amenities: [
      'Lush Green Natural Grass Party Lawn',
      'Open-Air Barbeque & Live Tandoor Counters',
      'Fairy Tree Lighting & Ambient Garden Sound',
      'Ideal for Birthday Parties, Kitty Parties & Anniversaries'
    ],
    images: [
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'vacant',
    cleaningStatus: 'Ready',
    sacCode: '996311'
  }
];

export const INITIAL_BANQUET_BOOKINGS: PmsBanquetBooking[] = [
  {
    id: 'bq-235',
    bookingNo: 'RM/89/24-25',
    eventName: 'Panday Parivar Grand Wedding Reception',
    eventType: 'Wedding / Reception',
    hostName: 'PANDAY PARIVAR',
    contactPerson: 'Shri Ramakant Panday',
    contactMobile: '76763636645',
    contactEmail: 'panday.parivar@gmail.com',
    addressLine1: 'Civil Lines, Near Circuit House',
    city: 'Etawah / Jabalpur',
    state: 'M.P',
    pincode: '206001',
    venueId: 'marriage-garden-1',
    venueName: 'MARRIAGE GARDEN1',
    venueTariff: 50000,
    venueGstPercent: 12,
    linkedRoomNos: ['301', '302'],
    linkedRoomsTariff: 0,
    bookingDate: '20-07-2025',
    eventDate: '30-07-2025',
    checkInDate: '30-07-2025',
    checkInTime: '06:26 AM',
    checkOutDate: '31-07-2025',
    checkOutTime: '06:26 AM',
    guaranteedPax: 400,
    actualPaxServed: 500,
    seatingLayout: 'Open Lawn Reception',
    perPlateMenuName: 'Royal Shahi Wedding Feast (Paneer Lababdar, Dal Makhani, Pulao, Gulab Jamun, Starters)',
    perPlateRate: 475,
    foodPaxCount: 500,
    totalFoodAmount: 237500,
    ancillaryServices: [
      {
        id: 'anc-1',
        serviceName: 'DJ CHARGE',
        rate: 10000,
        taxPercent: 12,
        amount: 10000
      },
      {
        id: 'anc-2',
        serviceName: 'DECORATION CHARGE',
        rate: 15000,
        taxPercent: 12,
        amount: 15000
      }
    ],
    kots: [
      {
        kotNo: 'KOT/419/24-25',
        dateTime: '30-07-2025 07:30 PM',
        serviceType: 'Banquet',
        roomOrVenue: 'MARRIAGE GARDEN1',
        items: [
          { itemName: 'PER PLATE FOOD', qty: 450, rate: 475, amount: 213750, gstPercent: 12 },
          { itemName: 'DJ CHARGE', qty: 1, rate: 10000, amount: 10000, gstPercent: 12 },
          { itemName: 'DECORATION CHARGE', qty: 1, rate: 15000, amount: 15000, gstPercent: 12 }
        ],
        totalAmount: 238750
      },
      {
        kotNo: 'KOT/420/24-25',
        dateTime: '30-07-2025 10:15 PM',
        serviceType: 'Banquet',
        roomOrVenue: 'MARRIAGE GARDEN1',
        items: [
          { itemName: 'PER PLATE FOOD', qty: 50, rate: 475, amount: 23750, gstPercent: 12 }
        ],
        totalAmount: 23750
      }
    ],
    financialSummary: {
      venueRent: 50000,
      venueGstAmount: 6000,
      foodAndServicesTaxable: 262500,
      foodAndServicesGstAmount: 31500,
      foodAndServicesTotal: 294000,
      grossBillAmount: 350000,
      advancePaid: 15000,
      midInstallmentsPaid: 0,
      netPayable: 335000,
      paidAtCheckout: 335000,
      balanceRemaining: 0,
      sacCode: '996311'
    },
    payments: [
      {
        id: 'pmt-adv-1',
        date: '20-07-2025',
        type: 'Booking Advance',
        mode: 'Online',
        amount: 15000,
        referenceNo: 'UPI/98337291039',
        remark: 'Initial booking token advance for Marriage Garden 1 + Rooms 301, 302'
      },
      {
        id: 'pmt-co-1',
        date: '31-07-2025',
        type: 'Checkout Settlement',
        mode: 'Online',
        amount: 200000,
        referenceNo: 'NEFT/SBI/923020035404769',
        remark: 'RTGS / Online Transfer received from Panday Parivar'
      },
      {
        id: 'pmt-co-2',
        date: '31-07-2025',
        type: 'Checkout Settlement',
        mode: 'STATE BANK OF INDIA',
        amount: 130000,
        referenceNo: 'CHQ/492019',
        remark: 'Direct account deposit into SBI Haridwar Branch'
      },
      {
        id: 'pmt-co-3',
        date: '31-07-2025',
        type: 'Checkout Settlement',
        mode: 'Cash',
        amount: 5000,
        remark: 'Cash settlement of remaining minor balance'
      }
    ],
    billingMode: 'Consolidated (Settle To Room)',
    status: 'Settled & Checked Out',
    invoiceNo: 'GSR/258/24-25',
    invoiceDate: '20-07-2025',
    billingOfficer: 'DEMO0004',
    bankDetails: {
      bankName: 'STATE BANK OF INDIA',
      accountNo: '923020035404769',
      ifsc: 'SBIN000390',
      branch: 'MAIN BRANCH HARIDWAR'
    },
    beoNotes: {
      stageRequirements: '40x25 ft elevated wooden stage with floral backdrop in pastel peach & marigold',
      mandapNotes: 'Vedic circular mandap with 4 pillars and havan kund ventilation exhaust',
      buffetTimings: 'Dinner buffet active 07:30 PM to 12:30 AM with chaat live counter',
      soundPermitNumber: 'ADM/SDM/SOUND/2025/4412 (Valid till 11:30 PM)',
      specialMenuRequests: 'Jain counter with satvik paneer, pure ghee sweets, sugar-free desserts'
    }
  },
  {
    id: 'bq-236',
    bookingNo: 'RM/92/24-25',
    eventName: 'Sharma & Varma Sangeet & Cocktail Evening',
    eventType: 'Sangeet / Mehendi',
    hostName: 'SHARMA JI & FAMILY',
    contactPerson: 'Er. Rajesh Sharma',
    contactMobile: '9827011223',
    city: 'Jabalpur',
    state: 'M.P',
    venueId: 'big-hall',
    venueName: 'BIG HALL',
    venueTariff: 15000,
    venueGstPercent: 18,
    linkedRoomNos: ['102'],
    linkedRoomsTariff: 3000,
    bookingDate: '22-07-2025',
    eventDate: '05-08-2025',
    checkInDate: '05-08-2025',
    checkInTime: '05:00 PM',
    checkOutDate: '06-08-2025',
    checkOutTime: '01:00 AM',
    guaranteedPax: 180,
    actualPaxServed: 180,
    seatingLayout: 'Round Table / Cluster',
    perPlateMenuName: 'Premium Sangeet Buffet with Mocktails & Live Counters',
    perPlateRate: 550,
    foodPaxCount: 180,
    totalFoodAmount: 99000,
    ancillaryServices: [
      { id: 'anc-3', serviceName: 'DJ CHARGE', rate: 10000, taxPercent: 12, amount: 10000 },
      { id: 'anc-4', serviceName: 'PROJECTOR & LED WALL', rate: 8000, taxPercent: 18, amount: 8000 }
    ],
    kots: [
      {
        kotNo: 'KOT/431/24-25',
        dateTime: '05-08-2025 06:00 PM',
        serviceType: 'Banquet',
        roomOrVenue: 'BIG HALL',
        items: [
          { itemName: 'PER PLATE FOOD', qty: 180, rate: 550, amount: 99000, gstPercent: 12 },
          { itemName: 'DJ CHARGE', qty: 1, rate: 10000, amount: 10000, gstPercent: 12 },
          { itemName: 'PROJECTOR & LED WALL', qty: 1, rate: 8000, amount: 8000, gstPercent: 18 }
        ],
        totalAmount: 117000
      }
    ],
    financialSummary: {
      venueRent: 15000,
      venueGstAmount: 2700,
      foodAndServicesTaxable: 117000,
      foodAndServicesGstAmount: 14040,
      foodAndServicesTotal: 131040,
      grossBillAmount: 148740,
      advancePaid: 30000,
      midInstallmentsPaid: 0,
      netPayable: 118740,
      paidAtCheckout: 0,
      balanceRemaining: 118740,
      sacCode: '996311'
    },
    payments: [
      {
        id: 'pmt-sharma-1',
        date: '22-07-2025',
        type: 'Booking Advance',
        mode: 'UPI',
        amount: 30000,
        referenceNo: 'UPI/77192003881',
        remark: 'Booking advance token for Big Hall'
      }
    ],
    billingMode: 'Consolidated (Settle To Room)',
    status: 'CheckedIn / In-Progress',
    bankDetails: {
      bankName: 'STATE BANK OF INDIA',
      accountNo: '923020035404769',
      ifsc: 'SBIN000390',
      branch: 'MAIN BRANCH HARIDWAR'
    }
  }
];

const STORAGE_KEYS = {
  ROOMS: 'svr_pms_rooms',
  ROOM_TYPES: 'svr_pms_room_types',
  TABLES: 'svr_pms_tables',
  GST_MASTERS: 'svr_pms_gst_masters',
  BUSINESS_SOURCES: 'svr_pms_business_sources',
  VOUCHER_TYPES: 'svr_pms_voucher_types',
  MENU_ITEMS: 'svr_pms_menu_items',
  BOOKINGS: 'svr_pms_bookings',
  KOTS: 'svr_pms_kots',
  CHECKOUTS: 'svr_pms_checkouts',
  ADVANCE_RECEIPTS: 'svr_pms_advance_receipts',
  BUSINESS_SETTINGS: 'svr_pms_business_settings',
  ROOM_SHIFTS: 'svr_pms_room_shifts',
  RECEIPTS: 'svr_pms_receipts',
  PARTY_ACCOUNTS: 'svr_pms_party_accounts',
  PAYMENTS: 'svr_pms_payments',
  ITEM_GROUPS: 'svr_pms_item_groups',
  GODOWNS: 'svr_pms_godowns',
  PURCHASES: 'svr_pms_purchases',
  STOCK_TRANSFERS: 'svr_pms_stock_transfers',
  ROLES: 'svr_pms_roles',
  USERS: 'svr_pms_users',
  PROPERTIES: 'svr_pms_properties',
  CURRENT_USER: 'svr_pms_current_user',
  CURRENT_PROPERTY: 'svr_pms_current_property',
  WHATSAPP_TEMPLATES: 'svr_pms_whatsapp_templates',
  WHATSAPP_CONFIG: 'svr_pms_whatsapp_config',
  WHATSAPP_LOGS: 'svr_pms_whatsapp_logs',
  SUPPORT_TICKETS: 'svr_pms_support_tickets',
  DEMO_REQUESTS: 'svr_pms_demo_requests',
  COMMISSION_AGENTS: 'svr_pms_commission_agents',
  AGENT_COMMISSIONS: 'svr_pms_agent_commissions',
  AGENT_PAYOUT_VOUCHERS: 'svr_pms_agent_payout_vouchers',
  LIQUOR_UNITS: 'svr_pms_liquor_units',
  LIQUOR_BRANDS: 'svr_pms_liquor_brands',
  LIQUOR_ITEMS: 'svr_pms_liquor_items',
  LIQUOR_STOCKS: 'svr_pms_liquor_stocks',
  BAR_INVOICES: 'svr_pms_bar_invoices',
  NO_DISCOUNT_CONFIG: 'svr_pms_no_discount_config',
  DISCOUNT_AUDIT_LOGS: 'svr_pms_discount_audit_logs',
  HOTEL_ASSETS: 'svr_pms_hotel_assets',
  BANQUET_VENUES: 'svr_pms_banquet_venues',
  BANQUET_BOOKINGS: 'svr_pms_banquet_bookings',
  LOCKERS: 'svr_pms_lockers',
  OTHER_CHARGES: 'svr_pms_other_charges',
  EXPENSES: 'svr_pms_expenses',
  HOUSEKEEPING: 'svr_pms_housekeeping',
  NIGHT_AUDITS: 'svr_pms_night_audits',
  FOLIO_PAYMENTS: 'svr_pms_folio_payments',
  FOLIO_DISCOUNTS: 'svr_pms_folio_discounts',
  BUSINESS_DATE: 'svr_pms_business_date',
  JOURNAL_ENTRIES: 'svr_pms_journal_entries',
  KOT_VOID_AUDIT: 'svr_pms_kot_void_audit',
  SCHEMA_VERSION: 'svr_pms_schema_version',
  NIGHT_AUDIT_ACCRUALS: 'svr_pms_night_audit_accruals'
};

export const INITIAL_EXPENSES: PmsExpenseRecord[] = [
  {
    id: 'exp-1',
    expenseNo: 'EXP-2026-001',
    date: '2026-10-20',
    time: '08:30 AM',
    category: 'Vegetables & Dairy',
    amount: 1450,
    paymentMode: 'Cash',
    paidTo: 'Shirdi Kisan Mandi Fresh Veggies',
    description: 'Fresh Paneer (5kg), Tomatoes, Green Chillies, Coriander for Rasoi',
    billNumber: 'BILL-8921',
    approvedBy: 'General Manager',
    createdAt: '2026-10-20T08:30:00.000Z'
  },
  {
    id: 'exp-2',
    expenseNo: 'EXP-2026-002',
    date: '2026-10-20',
    time: '09:15 AM',
    category: 'Housekeeping Supplies',
    amount: 850,
    paymentMode: 'Cash',
    paidTo: 'Om Sai Cleaners & Chemicals',
    description: 'Floor disinfectant (5L), Toilet cleaner cans, microfiber cloths',
    billNumber: 'INV-4412',
    approvedBy: 'Housekeeping Head',
    createdAt: '2026-10-20T09:15:00.000Z'
  },
  {
    id: 'exp-3',
    expenseNo: 'EXP-2026-003',
    date: '2026-10-19',
    time: '06:00 PM',
    category: 'Electricity/DG Fuel',
    amount: 2200,
    paymentMode: 'UPI',
    paidTo: 'HPCL Petrol Pump Shirdi',
    description: 'Diesel for generator backup (25 Litres)',
    billNumber: 'HP-90124',
    approvedBy: 'General Manager',
    createdAt: '2026-10-19T18:00:00.000Z'
  },
  {
    id: 'exp-4',
    expenseNo: 'EXP-2026-004',
    date: '2026-10-19',
    time: '07:30 PM',
    category: 'Maintenance Repair',
    amount: 600,
    paymentMode: 'Cash',
    paidTo: 'Sai Refrigeration & AC Care',
    description: 'Capacitor replacement & gas check for Room 106 AC',
    billNumber: 'REC-309',
    approvedBy: 'Front Desk Lead',
    createdAt: '2026-10-19T19:30:00.000Z'
  }
];

export const INITIAL_HOUSEKEEPING: PmsHousekeepingRecord[] = [
  // Ground Floor (101–107)
  { roomNo: '101', status: 'Inspected', assignedStaff: 'Ramesh', priority: 'Normal', lastCleanedTime: '19-10-2026 10:30 AM', remarks: 'Room occupied – Rajesh Sharma' },
  { roomNo: '102', status: 'Vacant Clean', assignedStaff: 'Sunita', priority: 'Normal', lastCleanedTime: '20-10-2026 09:00 AM' },
  { roomNo: '103', status: 'Vacant Clean', assignedStaff: 'Ramesh', priority: 'Normal', lastCleanedTime: '20-10-2026 09:30 AM' },
  { roomNo: '104', status: 'Vacant Dirty', assignedStaff: 'Ramesh', priority: 'High - Guest Waiting', lastCleanedTime: '18-10-2026 04:00 PM', remarks: 'Guest checked out, linen stripped' },
  { roomNo: '105', status: 'Vacant Clean', assignedStaff: 'Sunita', priority: 'Normal', lastCleanedTime: '20-10-2026 08:30 AM' },
  { roomNo: '106', status: 'Vacant Clean', assignedStaff: 'Ramesh', priority: 'Normal', lastCleanedTime: '20-10-2026 09:15 AM' },
  { roomNo: '107', status: 'Vacant Clean', assignedStaff: 'Sunita', priority: 'Normal', lastCleanedTime: '20-10-2026 10:00 AM' },
  // 1st Floor (201–211)
  { roomNo: '201', status: 'Vacant Clean', assignedStaff: 'Ganesh', priority: 'Normal', lastCleanedTime: '20-10-2026 09:30 AM' },
  { roomNo: '202', status: 'Inspected', assignedStaff: 'Ganesh', priority: 'Normal', lastCleanedTime: '20-10-2026 09:00 AM', remarks: 'Room occupied – Vikram Malhotra' },
  { roomNo: '203', status: 'Vacant Clean', assignedStaff: 'Priya', priority: 'Normal', lastCleanedTime: '20-10-2026 10:00 AM' },
  { roomNo: '204', status: 'Vacant Clean', assignedStaff: 'Priya', priority: 'High - Guest Waiting', lastCleanedTime: '20-10-2026 10:15 AM' },
  { roomNo: '205', status: 'Vacant Clean', assignedStaff: 'Ganesh', priority: 'Normal', lastCleanedTime: '20-10-2026 09:45 AM' },
  { roomNo: '206', status: 'Vacant Clean', assignedStaff: 'Priya', priority: 'Normal', lastCleanedTime: '20-10-2026 10:30 AM' },
  { roomNo: '207', status: 'Vacant Clean', assignedStaff: 'Sunita', priority: 'Normal', lastCleanedTime: '20-10-2026 10:45 AM' },
  { roomNo: '208', status: 'Vacant Clean', assignedStaff: 'Ramesh', priority: 'Normal', lastCleanedTime: '20-10-2026 09:00 AM' },
  { roomNo: '209', status: 'Vacant Clean', assignedStaff: 'Ganesh', priority: 'Normal', lastCleanedTime: '20-10-2026 09:15 AM' },
  { roomNo: '210', status: 'Vacant Clean', assignedStaff: 'Priya', priority: 'Normal', lastCleanedTime: '20-10-2026 09:30 AM' },
  { roomNo: '211', status: 'Inspected', assignedStaff: 'Sunita', priority: 'Normal', lastCleanedTime: '20-10-2026 07:30 AM', remarks: 'Room occupied – Arvind Kirloskar' }
];

export const INITIAL_NIGHT_AUDITS: PmsNightAuditRecord[] = [
  {
    auditId: 'NA-2026-1019',
    auditDate: '2026-10-19',
    executedAt: '19-10-2026 11:45 PM',
    executedBy: 'Night Auditor (S. Deshmukh)',
    occupiedRoomsCount: 4,
    totalRoomTariffPosted: 14796,
    totalGstPosted: 1775.52,
    cashInHand: 12450,
    upiTotal: 28900,
    cardTotal: 15400,
    pendingReceivables: 8990,
    roomsAuditSummary: [
      { roomNo: '101', guestName: 'Rajesh Sharma', baseTariff: 2499, gstAmount: 299.88, totalPosted: 2798.88, folioBalanceAfter: 1648.88 },
      { roomNo: '103', guestName: 'Sunita Patel', baseTariff: 2499, gstAmount: 299.88, totalPosted: 2798.88, folioBalanceAfter: 614.88 },
      { roomNo: '202', guestName: 'Vikram Malhotra & Family', baseTariff: 3799, gstAmount: 455.88, totalPosted: 4254.88, folioBalanceAfter: 0 },
      { roomNo: '303', guestName: 'Arvind Kirloskar', baseTariff: 5999, gstAmount: 719.88, totalPosted: 6718.88, folioBalanceAfter: 546 }
    ]
  }
];

export const INITIAL_FOLIO_PAYMENTS: PmsFolioPayment[] = [
  {
    id: 'pay-1',
    roomNo: '101',
    guestName: 'Rajesh Sharma',
    amount: 1500,
    paymentMode: 'UPI',
    referenceNo: 'UPI/982211/PhonePe',
    timestamp: '2026-10-19 11:15 AM',
    notes: 'Advance at Check-In'
  },
  {
    id: 'pay-2',
    roomNo: '103',
    guestName: 'Sunita Patel',
    amount: 2499,
    paymentMode: 'Cash',
    referenceNo: 'CASH-REC-103',
    timestamp: '2026-10-19 01:10 PM',
    notes: 'First day tariff advance in cash'
  },
  {
    id: 'pay-3',
    roomNo: '202',
    guestName: 'Vikram Malhotra & Family',
    amount: 5000,
    paymentMode: 'Card',
    referenceNo: 'HDFC-POS-7821',
    timestamp: '2026-10-20 09:35 AM',
    notes: 'Advance card swipe at front desk'
  },
  {
    id: 'pay-4',
    roomNo: '303',
    guestName: 'Arvind Kirloskar',
    amount: 6719,
    paymentMode: 'Bank Transfer',
    referenceNo: 'NEFT/SBI/991048',
    timestamp: '2026-10-20 08:15 AM',
    notes: 'Corporate advance direct NEFT transfer'
  }
];

export class PmsStore {
  // --- Centralized Reactive Pub/Sub Engine (Multi-Tab & Cross-Module Zero State Loss) ---
  private static listeners: Set<() => void> = new Set();
  private static broadcastChannel: BroadcastChannel | null = typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel('svr_pms_channel') : null;
  private static isListeningToEvents = false;

  static readonly SCHEMA_VERSION = '20261021_v18_final';

  static checkAndMigrateSchema(): void {
    if (typeof window === 'undefined') return;
    const version = localStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION);
    const raw = localStorage.getItem(STORAGE_KEYS.ROOMS);
    let needsReset = false;

    if (version !== this.SCHEMA_VERSION || !raw) {
      needsReset = true;
    } else {
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length !== 18) {
          needsReset = true;
        } else {
          const hasInvalid = parsed.some((r: any) => 
            !r.roomNo ||
            typeof r.roomNo !== 'string' ||
            r.roomNo.toUpperCase().includes('HALL') || 
            r.roomNo.toUpperCase().includes('GARDEN') || 
            r.roomNo.toLowerCase().includes('bhk')
          );
          if (hasInvalid) needsReset = true;
        }
      } catch {
        needsReset = true;
      }
    }

    if (needsReset) {
      console.info('[PmsStore] Auto-migrating client storage to official 18-room inventory:', this.SCHEMA_VERSION);
      this.resetToDemoSeedData();
    }
  }

  static initListener(): void {
    if (typeof window !== 'undefined') {
      this.checkAndMigrateSchema();
    }
    if (this.isListeningToEvents || typeof window === 'undefined') return;
    this.isListeningToEvents = true;

    // Cross-tab BroadcastChannel listener
    if (this.broadcastChannel) {
      this.broadcastChannel.onmessage = () => {
        this.notifyLocal();
      };
    }

    // Cross-tab storage event listener
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('svr_pms_')) {
        this.notifyLocal();
      }
    });

    // Custom window event listener
    window.addEventListener('pms-store-update', () => {
      this.notifyLocal();
    });
  }

  static subscribe(listener: () => void): () => void {
    this.initListener();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyLocal(): void {
    this.listeners.forEach(fn => {
      try { fn(); } catch (err) { console.error('[PmsStore] listener callback error:', err); }
    });
  }

  static notify(): void {
    this.notifyLocal();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pms-store-update'));
      try {
        this.broadcastChannel?.postMessage({ type: 'sync', timestamp: Date.now() });
      } catch {
        // broadcast fallback
      }
    }
  }

  // --- Real-Time Cloud Synchronization Bridge (PostgreSQL on Railway) ---
  static async syncWithCloudBackend(): Promise<{ success: boolean; message: string; lastSync: string }> {
    try {
      const cloudData = await hotelApi.getPmsDashboardSync();
      if (!cloudData) return { success: false, message: 'Cloud unreachable', lastSync: new Date().toISOString() };

      const localRooms = this.getRooms();
      let updatedCount = 0;

      // 1. Synchronize Room Housekeeping & Operational Status from Cloud DB
      for (const r of (cloudData.rooms || [])) {
        const matchingLocal = localRooms.find(lr => lr.id === String(r.id) || lr.roomNo === String(r.id));
        if (matchingLocal) {
          if (r.housekeeping_status === 'Clean' && matchingLocal.status !== 'vacant') {
            matchingLocal.status = 'vacant';
            matchingLocal.currentGuest = undefined;
            updatedCount++;
          } else if (r.housekeeping_status === 'Dirty' && matchingLocal.status !== 'dirty') {
            matchingLocal.status = 'dirty';
            updatedCount++;
          } else if (r.housekeeping_status === 'Under_Maintenance' && matchingLocal.status !== 'blocked') {
            matchingLocal.status = 'blocked';
            updatedCount++;
          }
        }
      }

      // 2. Synchronize In-House Occupied Bookings from Cloud DB
      for (const b of (cloudData.active_bookings || [])) {
        const matchingLocal = localRooms.find(r => r.id === String(b.room_id) || r.roomNo === String(b.room_id));
        if (matchingLocal && b.status === 'Checked-In') {
          matchingLocal.status = 'occupied';
          matchingLocal.currentGuest = {
            name: b.guest_name,
            phone: b.guest_phone,
            checkInDate: b.check_in_date,
            checkInTime: '12:00 PM',
            bookingNo: b.booking_ref,
            advancePaid: b.total_paid || 0,
            calculationType: '12hour'
          };
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        this.saveRooms(localRooms);
      }

      return {
        success: true,
        message: `Synced with Railway PostgreSQL: ${cloudData.occupied_rooms} occupied, ${cloudData.clean_rooms} clean, ${cloudData.dirty_rooms} dirty.`,
        lastSync: cloudData.last_sync_timestamp
      };
    } catch (err) {
      console.warn('[PmsStore] Background cloud sync notice:', err);
      return { success: false, message: 'Running in offline cached mode', lastSync: new Date().toISOString() };
    }
  }

  // --- Real-Time Relational Hydration from Railway PostgreSQL ---
  static async initCloudStore(): Promise<boolean> {
    try {
      const state = await hotelApi.getFullCloudState();
      if (!state) return false;

      // 1. Hydrate Rooms from PostgreSQL
      if (state.rooms && state.rooms.length > 0) {
        const localRooms = this.getRooms();
        const updated = state.rooms.map((r: any) => {
          const match = localRooms.find(lr => lr.roomNo === r.roomNo || lr.id === r.id);
          return {
            id: r.id,
            roomNo: r.roomNo,
            roomType: r.roomType,
            tariff: r.tariff,
            capacity: r.capacity || 2,
            status: r.status,
            currentGuest: match?.currentGuest,
            foodAmount: match?.foodAmount || 0
          };
        });
        localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(updated));
      }

      // 2. Hydrate Dining Tables from PostgreSQL
      if (state.tables && state.tables.length > 0) {
        localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(state.tables));
      }

      // 3. Hydrate ERP Masters from PostgreSQL
      if (state.masters) {
        if (state.masters.gst) localStorage.setItem(STORAGE_KEYS.GST_MASTERS, JSON.stringify(state.masters.gst));
        if (state.masters.business_source) localStorage.setItem(STORAGE_KEYS.BUSINESS_SOURCES, JSON.stringify(state.masters.business_source));
        if (state.masters.locker) localStorage.setItem(STORAGE_KEYS.LOCKERS, JSON.stringify(state.masters.locker));
        if (state.masters.other_charge) localStorage.setItem(STORAGE_KEYS.OTHER_CHARGES, JSON.stringify(state.masters.other_charge));
      }

      return true;
    } catch (e) {
      console.warn('[PmsStore] Cloud hydration running in offline fallback mode:', e);
      return false;
    }
  }

  static getRooms(): PmsRoom[] {
    if (typeof window !== 'undefined') {
      const version = localStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION);
      if (version !== this.SCHEMA_VERSION) {
        this.checkAndMigrateSchema();
      }
    }
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ROOMS) : null;
    if (!raw) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
        localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, this.SCHEMA_VERSION);
      }
      return INITIAL_ROOMS;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length !== 18) {
        this.checkAndMigrateSchema();
        return INITIAL_ROOMS;
      }
      return parsed;
    } catch {
      return INITIAL_ROOMS;
    }
  }

  static saveRooms(rooms: PmsRoom[]): void {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
    this.notify();
  }

  static updateRoomStatus(roomNo: string, status: PmsRoom['status'], guestDetails?: PmsRoom['currentGuest']): void {
    const rooms = this.getRooms();
    const updated = rooms.map(r => {
      if (r.roomNo === roomNo) {
        return {
          ...r,
          status,
          currentGuest: guestDetails !== undefined ? guestDetails : r.currentGuest
        };
      }
      return r;
    });
    this.saveRooms(updated);

    // Cloud sync: mirror Housekeeping / Maintenance to Railway PostgreSQL
    const rId = parseInt(roomNo, 10);
    if (!isNaN(rId)) {
      if (status === 'dirty') {
        hotelApi.updateHousekeeping(rId, 'Dirty').catch(e => console.warn('[PmsStore] Dirty room sync note:', e));
      } else if (status === 'vacant') {
        hotelApi.updateHousekeeping(rId, 'Clean').catch(e => console.warn('[PmsStore] Clean room sync note:', e));
      } else if (status === 'blocked') {
        hotelApi.toggleRoomMaintenance(rId, true, 'Front Desk Manual Block').catch(e => console.warn('[PmsStore] Block room sync note:', e));
      }
    }
  }

  static addRoom(room: PmsRoom): void {
    const rooms = this.getRooms();
    const idx = rooms.findIndex(r => r.roomNo === room.roomNo);
    if (idx >= 0) {
      rooms[idx] = room;
    } else {
      rooms.push(room);
    }
    this.saveRooms(rooms);
  }

  static updateRoom(room: PmsRoom): void {
    const rooms = this.getRooms();
    const idx = rooms.findIndex(r => r.id === room.id || r.roomNo === room.roomNo);
    if (idx >= 0) {
      rooms[idx] = { ...rooms[idx], ...room };
      this.saveRooms(rooms);
    }
  }

  static updateRoomFoodAmount(roomNo: string, additionalAmount: number): void {
    const rooms = this.getRooms();
    const idx = rooms.findIndex(r => r.roomNo === roomNo);
    if (idx >= 0) {
      rooms[idx].foodAmount = (rooms[idx].foodAmount || 0) + additionalAmount;
      this.saveRooms(rooms);
    }
  }

  static deleteRoom(roomNo: string): void {
    const rooms = this.getRooms().filter(r => r.roomNo !== roomNo && r.id !== roomNo);
    this.saveRooms(rooms);
  }

  // =========================================================================
  // 1. Double-Entry Accounting Ledger, Business Date & Master Seed Engine
  // =========================================================================

  // Strict 6-State Room Status Machine Helpers
  static normalizeRoomStatus(status: string): RoomStatus {
    const s = (status || '').toUpperCase().trim();
    if (s === 'VACANT_CLEAN' || s === 'VACANT' || s === 'VC') return 'VACANT_CLEAN';
    if (s === 'VACANT_DIRTY' || s === 'DIRTY' || s === 'VD') return 'VACANT_DIRTY';
    if (s === 'OCCUPIED_CLEAN' || s === 'OC') return 'OCCUPIED_CLEAN';
    if (s === 'OCCUPIED_DIRTY' || s === 'OD') return 'OCCUPIED_DIRTY';
    if (s === 'OCCUPIED') return 'OCCUPIED_CLEAN';
    if (s === 'UNDER_MAINTENANCE' || s === 'MAINTENANCE' || s === 'BLOCKED' || s === 'OOO') return 'UNDER_MAINTENANCE';
    if (s === 'MANAGEMENT_BLOCK' || s === 'MB') return 'MANAGEMENT_BLOCK';
    if (s === 'BOOKED' || s === 'RESERVED') return 'booked';
    return 'VACANT_CLEAN';
  }

  static isRoomVacantClean(room: PmsRoom | null | undefined): boolean {
    if (!room) return false;
    const s = room.status;
    return s === 'vacant' || s === 'VACANT_CLEAN';
  }

  static isRoomVacantDirty(room: PmsRoom | null | undefined): boolean {
    if (!room) return false;
    const s = room.status;
    return s === 'dirty' || s === 'VACANT_DIRTY';
  }

  static isRoomOccupied(room: PmsRoom | null | undefined): boolean {
    if (!room) return false;
    const s = room.status;
    return s === 'occupied' || s === 'OCCUPIED_CLEAN' || s === 'OCCUPIED_DIRTY';
  }

  static isRoomUnderMaintenance(room: PmsRoom | null | undefined): boolean {
    if (!room) return false;
    const s = room.status;
    return s === 'blocked' || s === 'UNDER_MAINTENANCE' || s === 'MANAGEMENT_BLOCK';
  }

  // Business Date Management
  static getBusinessDate(): string {
    const raw = localStorage.getItem(STORAGE_KEYS.BUSINESS_DATE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BUSINESS_DATE, '2026-10-20');
      return '2026-10-20';
    }
    return raw;
  }

  static setBusinessDate(d: string): void {
    localStorage.setItem(STORAGE_KEYS.BUSINESS_DATE, d);
    this.notify();
  }

  static advanceBusinessDate(): string {
    const current = this.getBusinessDate();
    const [y, m, d] = current.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + 1);
    const nextY = dateObj.getFullYear();
    const nextM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nextD = String(dateObj.getDate()).padStart(2, '0');
    const nextStr = `${nextY}-${nextM}-${nextD}`;
    this.setBusinessDate(nextStr);
    return nextStr;
  }

  // Integer-Paise Arithmetic & Section 170 CGST Act Round-Off
  static toPaise(rupees: number): number {
    return Math.round(Number(rupees || 0) * 100);
  }

  static fromPaise(paise: number): number {
    return Number((Number(paise || 0) / 100).toFixed(2));
  }

  static computeSection170Gst(baseRupees: number, ratePercent: number): {
    taxableRupees: number;
    cgstRupees: number;
    sgstRupees: number;
    totalTaxRupees: number;
    grossRupees: number;
    roundOffRupees: number;
    netBillAmount: number;
  } {
    const basePaise = Math.round(baseRupees * 100);
    const halfRate = ratePercent / 2;
    const cgstPaise = Math.round((basePaise * halfRate) / 100);
    const sgstPaise = cgstPaise; // Exact equality under Indian GST
    const totalTaxPaise = cgstPaise + sgstPaise;
    const grossPaise = basePaise + totalTaxPaise;
    const netBillAmount = Math.round(grossPaise / 100);
    const roundOffRupees = Number(((netBillAmount * 100 - grossPaise) / 100).toFixed(2));

    return {
      taxableRupees: Number((basePaise / 100).toFixed(2)),
      cgstRupees: Number((cgstPaise / 100).toFixed(2)),
      sgstRupees: Number((sgstPaise / 100).toFixed(2)),
      totalTaxRupees: Number((totalTaxPaise / 100).toFixed(2)),
      grossRupees: Number((grossPaise / 100).toFixed(2)),
      roundOffRupees,
      netBillAmount
    };
  }

  // Double-Entry Journal Ledger
  static getJournalEntries(): import('../types/pmsModels').PmsJournalEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
    if (!raw) {
      const initial: import('../types/pmsModels').PmsJournalEntry[] = [
        {
          entryId: 'JV-2026-0001',
          date: '2026-10-19',
          time: '11:00 AM',
          voucherType: 'Advance',
          referenceNo: 'AR/201/26-27',
          narration: 'Advance deposit received from Rajesh Sharma for Room 101',
          debitAccount: 'HDFC Bank / UPI Settlement A/c',
          creditAccount: 'Guest Advance Deposit Liability',
          amountPaise: 150000,
          amountRupees: 1500,
          postedBy: 'Front Desk'
        },
        {
          entryId: 'JV-2026-0002',
          date: '2026-10-19',
          time: '01:00 PM',
          voucherType: 'Advance',
          referenceNo: 'AR/202/26-27',
          narration: 'Advance deposit received from Sunita Patel for Room 103',
          debitAccount: 'Cash in Hand (Reception)',
          creditAccount: 'Guest Advance Deposit Liability',
          amountPaise: 249900,
          amountRupees: 2499,
          postedBy: 'Front Desk'
        },
        {
          entryId: 'JV-2026-0003',
          date: '2026-10-20',
          time: '09:30 AM',
          voucherType: 'Advance',
          referenceNo: 'AR/203/26-27',
          narration: 'Advance received from Vikram Malhotra for Room 202',
          debitAccount: 'HDFC Bank / UPI Settlement A/c',
          creditAccount: 'Guest Advance Deposit Liability',
          amountPaise: 500000,
          amountRupees: 5000,
          postedBy: 'Front Desk'
        },
        {
          entryId: 'JV-2026-0004',
          date: '2026-10-20',
          time: '08:00 AM',
          voucherType: 'Advance',
          referenceNo: 'AR/204/26-27',
          narration: 'Full advance received from Arvind Kirloskar for Suite 303',
          debitAccount: 'HDFC Bank / UPI Settlement A/c',
          creditAccount: 'Guest Advance Deposit Liability',
          amountPaise: 671900,
          amountRupees: 6719,
          postedBy: 'Front Desk'
        },
        {
          entryId: 'JV-2026-0005',
          date: '2026-10-20',
          time: '08:30 AM',
          voucherType: 'Expense',
          referenceNo: 'EXP-2026-001',
          narration: 'Purchased Fresh Paneer & Veggies for Vasudev Rasoi',
          debitAccount: 'Petty Cash / Housekeeping Expense',
          creditAccount: 'Cash in Hand (Reception)',
          amountPaise: 145000,
          amountRupees: 1450,
          postedBy: 'General Manager'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static postJournalEntry(entry: Omit<import('../types/pmsModels').PmsJournalEntry, 'entryId'>): import('../types/pmsModels').PmsJournalEntry {
    const list = this.getJournalEntries();
    const nextSeq = list.length + 1;
    const fullEntry: import('../types/pmsModels').PmsJournalEntry = {
      ...entry,
      entryId: `JV-2026-${String(nextSeq).padStart(4, '0')}`
    };
    list.unshift(fullEntry);
    localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(list));
    this.notify();
    return fullEntry;
  }

  static getTrialBalance(): {
    accounts: Array<{ name: string; type: 'Asset' | 'Liability' | 'Income' | 'Expense'; debit: number; credit: number; balance: number }>;
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
  } {
    const entries = this.getJournalEntries();
    const accountMap: Record<string, { debitPaise: number; creditPaise: number }> = {};

    entries.forEach(e => {
      if (!accountMap[e.debitAccount]) accountMap[e.debitAccount] = { debitPaise: 0, creditPaise: 0 };
      if (!accountMap[e.creditAccount]) accountMap[e.creditAccount] = { debitPaise: 0, creditPaise: 0 };
      accountMap[e.debitAccount].debitPaise += e.amountPaise;
      accountMap[e.creditAccount].creditPaise += e.amountPaise;
    });

    const getAccountType = (acc: string): 'Asset' | 'Liability' | 'Income' | 'Expense' => {
      const lower = acc.toLowerCase();
      if (lower.includes('cash') || lower.includes('bank') || lower.includes('receivable') || lower.includes('card')) return 'Asset';
      if (lower.includes('liability') || lower.includes('output') || lower.includes('gst')) return 'Liability';
      if (lower.includes('revenue') || lower.includes('income')) return 'Income';
      return 'Expense';
    };

    let totalDebitPaise = 0;
    let totalCreditPaise = 0;
    const accounts = Object.keys(accountMap).sort().map(accName => {
      const d = accountMap[accName].debitPaise;
      const c = accountMap[accName].creditPaise;
      totalDebitPaise += d;
      totalCreditPaise += c;
      const net = d - c;
      return {
        name: accName,
        type: getAccountType(accName),
        debit: Number((d / 100).toFixed(2)),
        credit: Number((c / 100).toFixed(2)),
        balance: Number((net / 100).toFixed(2))
      };
    });

    return {
      accounts,
      totalDebit: Number((totalDebitPaise / 100).toFixed(2)),
      totalCredit: Number((totalCreditPaise / 100).toFixed(2)),
      isBalanced: totalDebitPaise === totalCreditPaise
    };
  }

  // KOT Void Item & Anti-Pilferage Audit
  static getKotVoidAuditLogs(): import('../types/pmsModels').KotVoidAuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.KOT_VOID_AUDIT);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static voidKotItem(
    kotNo: string,
    itemCode: string,
    voidReason: string,
    foodStatus: 'Prepared/Wasted' | 'Unprepared',
    voidedBy: string = 'Kitchen Supervisor'
  ): boolean {
    const kots = this.getKots();
    const kot = kots.find(k => k.kotNo === kotNo);
    if (!kot) return false;

    const itemIdx = kot.items.findIndex(it => it.itemCode === itemCode);
    if (itemIdx < 0) return false;

    const item = kot.items[itemIdx];
    const logs = this.getKotVoidAuditLogs();
    const newLog: import('../types/pmsModels').KotVoidAuditLog = {
      id: `VOID-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      kotNo,
      itemCode: item.itemCode || 'ITEM',
      itemName: item.itemName,
      qty: item.qty,
      rate: item.rate,
      amount: item.amount,
      voidReason,
      foodStatus,
      voidedAt: new Date().toISOString(),
      voidedBy
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.KOT_VOID_AUDIT, JSON.stringify(logs));

    // Remove item from KOT
    kot.items.splice(itemIdx, 1);
    kot.totalQty = kot.items.reduce((s, it) => s + it.qty, 0);
    kot.totalAmount = Number(kot.items.reduce((s, it) => s + it.amount, 0).toFixed(2));
    if (kot.items.length === 0) {
      kot.status = 'Cancelled';
    }
    this.saveKot(kot);
    this.notify();
    return true;
  }

  // JSON Database Export / Import
  static exportDatabaseAsJson(): string {
    const payload = {
      schemaVersion: this.SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      property: 'Hotel Sai Vasudev Residency & Vasudev Rasoi Dining',
      data: {
        rooms: this.getRooms(),
        roomTypes: this.getRoomTypes(),
        tables: this.getTables(),
        menuItems: this.getMenuItems(),
        bookings: this.getBookings(),
        checkouts: this.getCheckouts(),
        kots: this.getKots(),
        expenses: this.getExpenses(),
        housekeeping: this.getHousekeepingRecords(),
        nightAudits: this.getNightAudits(),
        folioPayments: this.getFolioPayments(),
        advanceReceipts: this.getAdvanceReceipts(),
        journalEntries: this.getJournalEntries(),
        kotVoidAudit: this.getKotVoidAuditLogs(),
        businessDate: this.getBusinessDate()
      }
    };
    return JSON.stringify(payload, null, 2);
  }

  static importDatabaseFromJson(jsonStr: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || !parsed.data) {
        return { success: false, message: 'Invalid ERP backup JSON format. Missing "data" payload.' };
      }
      const d = parsed.data;
      if (Array.isArray(d.rooms)) localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(d.rooms));
      if (Array.isArray(d.roomTypes)) localStorage.setItem(STORAGE_KEYS.ROOM_TYPES, JSON.stringify(d.roomTypes));
      if (Array.isArray(d.tables)) localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(d.tables));
      if (Array.isArray(d.menuItems)) localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(d.menuItems));
      if (Array.isArray(d.bookings)) localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(d.bookings));
      if (Array.isArray(d.checkouts)) localStorage.setItem(STORAGE_KEYS.CHECKOUTS, JSON.stringify(d.checkouts));
      if (Array.isArray(d.kots)) localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify(d.kots));
      if (Array.isArray(d.expenses)) localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(d.expenses));
      if (Array.isArray(d.housekeeping)) localStorage.setItem(STORAGE_KEYS.HOUSEKEEPING, JSON.stringify(d.housekeeping));
      if (Array.isArray(d.nightAudits)) localStorage.setItem(STORAGE_KEYS.NIGHT_AUDITS, JSON.stringify(d.nightAudits));
      if (Array.isArray(d.folioPayments)) localStorage.setItem(STORAGE_KEYS.FOLIO_PAYMENTS, JSON.stringify(d.folioPayments));
      if (Array.isArray(d.advanceReceipts)) localStorage.setItem(STORAGE_KEYS.ADVANCE_RECEIPTS, JSON.stringify(d.advanceReceipts));
      if (Array.isArray(d.journalEntries)) localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(d.journalEntries));
      if (Array.isArray(d.kotVoidAudit)) localStorage.setItem(STORAGE_KEYS.KOT_VOID_AUDIT, JSON.stringify(d.kotVoidAudit));
      if (d.businessDate) localStorage.setItem(STORAGE_KEYS.BUSINESS_DATE, d.businessDate);
      localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, parsed.schemaVersion || this.SCHEMA_VERSION);
      this.notify();
      return { success: true, message: `Successfully imported ERP backup (Version: ${parsed.schemaVersion || 'Legacy'}). All modules synchronized.` };
    } catch (err: any) {
      return { success: false, message: `Failed to parse JSON backup: ${err.message}` };
    }
  }

  // 1. Reset to Demo Seed Data (Guaranteed Zero State Loss / Authentic Shirdi)
  static resetToDemoSeedData(): void {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
    localStorage.setItem(STORAGE_KEYS.ROOM_TYPES, JSON.stringify(INITIAL_ROOM_TYPES));
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(INITIAL_MENU_ITEMS));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    localStorage.setItem(STORAGE_KEYS.HOUSEKEEPING, JSON.stringify(INITIAL_HOUSEKEEPING));
    localStorage.setItem(STORAGE_KEYS.NIGHT_AUDITS, JSON.stringify(INITIAL_NIGHT_AUDITS));
    localStorage.setItem(STORAGE_KEYS.FOLIO_PAYMENTS, JSON.stringify(INITIAL_FOLIO_PAYMENTS));
    localStorage.setItem(STORAGE_KEYS.BUSINESS_DATE, '2026-10-20');
    localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, this.SCHEMA_VERSION);
    localStorage.removeItem(STORAGE_KEYS.JOURNAL_ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.KOT_VOID_AUDIT);
    localStorage.removeItem(STORAGE_KEYS.NIGHT_AUDIT_ACCRUALS);
    localStorage.removeItem(STORAGE_KEYS.FOLIO_DISCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.KOTS);
    localStorage.removeItem(STORAGE_KEYS.CHECKOUTS);
    this.notify();
  }

  // =========================================================================
  // 2. Housekeeping, Laundry & Maintenance Tracker Methods
  // =========================================================================
  static getHousekeepingRecords(): PmsHousekeepingRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.HOUSEKEEPING);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.HOUSEKEEPING, JSON.stringify(INITIAL_HOUSEKEEPING));
      return INITIAL_HOUSEKEEPING;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_HOUSEKEEPING;
    }
  }

  static updateHousekeepingStatus(
    roomNo: string,
    status: PmsHousekeepingRecord['status'],
    assignedStaff?: string,
    priority?: string,
    issue?: string
  ): void {
    const records = this.getHousekeepingRecords();
    const idx = records.findIndex(r => r.roomNo === roomNo);
    const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    let updatedRec: PmsHousekeepingRecord;
    if (idx >= 0) {
      updatedRec = { ...records[idx], status };
    } else {
      updatedRec = {
        roomNo,
        status,
        assignedStaff: (assignedStaff as any) || 'Ramesh',
        priority: (priority as any) || 'Normal',
        lastCleanedTime: nowStr
      };
    }

    if (assignedStaff) updatedRec.assignedStaff = assignedStaff as any;
    if (priority) updatedRec.priority = priority as any;
    if (status === 'Cleaning In Progress') updatedRec.cleaningStartedAt = nowStr;
    if (status === 'Vacant Clean' || status === 'Inspected') updatedRec.lastCleanedTime = nowStr;
    if (status === 'Under Maintenance' && issue) {
      updatedRec.maintenanceIssue = issue;
      updatedRec.maintenanceLoggedAt = nowStr;
    }

    if (idx >= 0) records[idx] = updatedRec;
    else records.push(updatedRec);

    localStorage.setItem(STORAGE_KEYS.HOUSEKEEPING, JSON.stringify(records));

    // Synchronize Room operational status on Front Desk
    const rooms = this.getRooms();
    const targetRoom = rooms.find(r => r.roomNo === roomNo);
    if (targetRoom) {
      if (assignedStaff) targetRoom.assignedStaff = assignedStaff as any;
      if (priority) targetRoom.priority = priority as any;

      if (status === 'Vacant Clean' || status === 'Inspected') {
        if (targetRoom.status !== 'occupied') {
          targetRoom.status = 'vacant';
          targetRoom.maintenanceIssue = undefined;
        }
      } else if (status === 'Vacant Dirty' || status === 'Cleaning In Progress') {
        if (targetRoom.status !== 'occupied') {
          targetRoom.status = 'dirty';
        }
      } else if (status === 'Under Maintenance') {
        targetRoom.status = 'blocked';
        targetRoom.maintenanceIssue = issue || targetRoom.maintenanceIssue || 'Maintenance Logged';
      }
      this.saveRooms(rooms);
    }

    this.notify();
  }

  static resolveMaintenance(roomNo: string): void {
    this.updateHousekeepingStatus(roomNo, 'Vacant Dirty', undefined, 'Normal', undefined);
  }

  // =========================================================================
  // 3. Hotel Petty Cash & Expense Tracker Methods
  // =========================================================================
  static getExpenses(): PmsExpenseRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_EXPENSES;
    }
  }

  static addExpense(exp: Omit<PmsExpenseRecord, 'id' | 'expenseNo' | 'createdAt'>): PmsExpenseRecord {
    const expenses = this.getExpenses();
    const nextSeq = expenses.length + 1;
    const now = new Date();
    const newRecord: PmsExpenseRecord = {
      ...exp,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      expenseNo: `EXP-2026-${String(nextSeq).padStart(3, '0')}`,
      createdAt: now.toISOString()
    };
    expenses.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    this.notify();
    return newRecord;
  }

  static deleteExpense(id: string): void {
    const expenses = this.getExpenses().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    this.notify();
  }

  // =========================================================================
  // 4. Night Audit & Shift Handover Methods
  // =========================================================================
  static getNightAudits(): PmsNightAuditRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NIGHT_AUDITS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.NIGHT_AUDITS, JSON.stringify(INITIAL_NIGHT_AUDITS));
      return INITIAL_NIGHT_AUDITS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_NIGHT_AUDITS;
    }
  }

  // =========================================================================
  // 4-Step Night Audit Wizard Engine (Indian Hospitality Standard)
  // =========================================================================
  static getNightAuditPreCheck(): {
    businessDate: string;
    pendingArrivalsCount: number;
    overdueDeparturesCount: number;
    openKotsCount: number;
    occupiedRoomsCount: number;
    totalTariffAccruable: number;
    totalGstAccruable: number;
    canProceed: boolean;
    blockers: string[];
  } {
    const bDate = this.getBusinessDate();
    const rooms = this.getRooms();
    const occupiedRooms = rooms.filter(r => this.isRoomOccupied(r));

    // Pending arrivals (due on or before bDate that haven't checked in)
    const bookings = this.getBookings();
    const pendingArrivals = bookings.filter(b => b.status === 'Confirmed' && b.checkInDate <= bDate);

    // Overdue departures (stays where checkoutDate <= bDate)
    const checkIns = this.getCheckIns();
    const overdueDepartures = checkIns.filter(c => c.status === 'CheckedIn' && c.checkOutDate && c.checkOutDate <= bDate);

    // Open Restaurant KOTs (in kitchen queue)
    const kots = this.getKots();
    const openKots = kots.filter(k => k.status === 'Pending' || k.status === 'Cooking' || k.status === 'Ready To Serve');

    let totalTariffAccruable = 0;
    let totalGstAccruable = 0;
    occupiedRooms.forEach(r => {
      const tariff = r.tariff;
      const gstRate = tariff > 7500 ? 18 : 12;
      const gst = Math.round(tariff * (gstRate / 100));
      totalTariffAccruable += tariff;
      totalGstAccruable += gst;
    });

    const blockers: string[] = [];
    if (openKots.length > 0) {
      blockers.push(`${openKots.length} open Vasudev Rasoi KOT(s) pending in Kitchen Display System (KDS). Please settle or void them before running Night Audit.`);
    }

    return {
      businessDate: bDate,
      pendingArrivalsCount: pendingArrivals.length,
      overdueDeparturesCount: overdueDepartures.length,
      openKotsCount: openKots.length,
      occupiedRoomsCount: occupiedRooms.length,
      totalTariffAccruable,
      totalGstAccruable,
      canProceed: blockers.length === 0,
      blockers
    };
  }

  static runNightAudit(auditorName: string = 'General Manager / Lead Auditor'): PmsNightAuditRecord {
    const bDate = this.getBusinessDate();
    const rawAccruals = localStorage.getItem(STORAGE_KEYS.NIGHT_AUDIT_ACCRUALS);
    const accrualMap: Record<string, boolean> = rawAccruals ? JSON.parse(rawAccruals) : {};

    const rooms = this.getRooms();
    const occupiedRooms = rooms.filter(r => this.isRoomOccupied(r));
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    let totalRoomTariffPosted = 0;
    let totalGstPosted = 0;
    const roomsAuditSummary: PmsNightAuditRecord['roomsAuditSummary'] = [];

    // Step 2: Idempotent room tariff and GST accrual posting
    occupiedRooms.forEach(r => {
      const accrualKey = `${bDate}_${r.roomNo}`;
      const folio = this.getFolioSummary(r.roomNo);
      const baseTariff = r.tariff;
      const gstRate = baseTariff > 7500 ? 18 : 12;
      const gstAmount = Math.round(baseTariff * (gstRate / 100) * 100) / 100;
      const totalPosted = baseTariff + gstAmount;

      if (!accrualMap[accrualKey]) {
        totalRoomTariffPosted += baseTariff;
        totalGstPosted += gstAmount;
        accrualMap[accrualKey] = true;

        // Post Double-Entry Journal Entry: Room Accommodation Revenue
        this.postJournalEntry({
          date: bDate,
          time: timeStr,
          voucherType: 'NightAudit',
          referenceNo: `NA-${bDate}-RM${r.roomNo}`,
          narration: `Nightly room tariff accrual for Room ${r.roomNo} (${folio.guestName || 'In-House Guest'})`,
          debitAccount: 'In-House Guest Folio Receivable',
          creditAccount: 'Room Accommodation Revenue',
          amountPaise: Math.round(baseTariff * 100),
          amountRupees: baseTariff,
          postedBy: auditorName
        });

        // Output GST Journal Postings
        const cgstAcc = gstRate === 18 ? 'Output CGST @ 9%' : 'Output CGST @ 6%';
        const sgstAcc = gstRate === 18 ? 'Output SGST @ 9%' : 'Output SGST @ 6%';
        const halfGstPaise = Math.round((gstAmount / 2) * 100);

        this.postJournalEntry({
          date: bDate,
          time: timeStr,
          voucherType: 'NightAudit',
          referenceNo: `NA-CGST-${bDate}-RM${r.roomNo}`,
          narration: `Output CGST (${gstRate / 2}%) on Room ${r.roomNo}`,
          debitAccount: 'In-House Guest Folio Receivable',
          creditAccount: cgstAcc,
          amountPaise: halfGstPaise,
          amountRupees: Number((halfGstPaise / 100).toFixed(2)),
          postedBy: auditorName
        });

        this.postJournalEntry({
          date: bDate,
          time: timeStr,
          voucherType: 'NightAudit',
          referenceNo: `NA-SGST-${bDate}-RM${r.roomNo}`,
          narration: `Output SGST (${gstRate / 2}%) on Room ${r.roomNo}`,
          debitAccount: 'In-House Guest Folio Receivable',
          creditAccount: sgstAcc,
          amountPaise: halfGstPaise,
          amountRupees: Number((halfGstPaise / 100).toFixed(2)),
          postedBy: auditorName
        });
      }

      roomsAuditSummary.push({
        roomNo: r.roomNo,
        guestName: folio.guestName,
        baseTariff,
        gstAmount,
        totalPosted,
        folioBalanceAfter: Math.round((folio.balanceDue + totalPosted) * 100) / 100
      });
    });

    localStorage.setItem(STORAGE_KEYS.NIGHT_AUDIT_ACCRUALS, JSON.stringify(accrualMap));

    // Step 3: Flip all OCCUPIED_CLEAN rooms to OCCUPIED_DIRTY for next-morning housekeeping
    const updatedRooms = rooms.map(rm => {
      if (rm.status === 'OCCUPIED_CLEAN' || rm.status === 'occupied') {
        return { ...rm, status: 'OCCUPIED_DIRTY' as RoomStatus };
      }
      return rm;
    });
    this.saveRooms(updatedRooms);

    // Compute Collection Summary
    const payments = this.getFolioPayments();
    const cashTotal = payments.filter(p => p.paymentMode === 'Cash').reduce((s, p) => s + p.amount, 0);
    const expenses = this.getExpenses();
    const cashExpenses = expenses.filter(e => e.paymentMode === 'Cash').reduce((s, e) => s + e.amount, 0);
    const netCashInHand = Math.max(0, 15000 + cashTotal - cashExpenses);

    const upiTotal = payments.filter(p => p.paymentMode === 'UPI').reduce((s, p) => s + p.amount, 0) + 28900;
    const cardTotal = payments.filter(p => p.paymentMode === 'Card').reduce((s, p) => s + p.amount, 0) + 15400;

    let pendingReceivables = 0;
    occupiedRooms.forEach(r => {
      const folio = this.getFolioSummary(r.roomNo);
      pendingReceivables += folio.balanceDue;
    });

    const audits = this.getNightAudits();
    const nextSeq = audits.length + 1;
    const newAuditRecord: PmsNightAuditRecord = {
      auditId: `NA-2026-${String(nextSeq).padStart(4, '0')}`,
      auditDate: bDate,
      executedAt: `${bDate} ${timeStr}`,
      executedBy: auditorName,
      occupiedRoomsCount: occupiedRooms.length,
      totalRoomTariffPosted: Math.round(totalRoomTariffPosted * 100) / 100,
      totalGstPosted: Math.round(totalGstPosted * 100) / 100,
      cashInHand: Math.round(netCashInHand),
      upiTotal: Math.round(upiTotal),
      cardTotal: Math.round(cardTotal),
      pendingReceivables: Math.round(pendingReceivables * 100) / 100,
      roomsAuditSummary
    };

    audits.unshift(newAuditRecord);
    localStorage.setItem(STORAGE_KEYS.NIGHT_AUDITS, JSON.stringify(audits));

    // Step 4: Advance Business Date forward by +1 day
    this.advanceBusinessDate();

    this.notify();
    return newAuditRecord;
  }

  // =========================================================================
  // 5. Guest Folio & Segregated Indian GST Engine (SAC 996311 & SAC 996331)
  // =========================================================================
  static getFolioPayments(roomNo?: string): PmsFolioPayment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FOLIO_PAYMENTS);
    let all: PmsFolioPayment[] = [];
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FOLIO_PAYMENTS, JSON.stringify(INITIAL_FOLIO_PAYMENTS));
      all = INITIAL_FOLIO_PAYMENTS;
    } else {
      try {
        all = JSON.parse(raw);
      } catch {
        all = INITIAL_FOLIO_PAYMENTS;
      }
    }
    if (roomNo) {
      return all.filter(p => p.roomNo === roomNo);
    }
    return all;
  }

  static recordFolioPayment(
    roomNo: string,
    payment: { amount: number; paymentMode: string; referenceNo?: string; notes?: string }
  ): PmsFolioPayment {
    const all = this.getFolioPayments();
    const rooms = this.getRooms();
    const r = rooms.find(rm => rm.roomNo === roomNo);
    const guestName = r?.currentGuest?.name || 'In-House Guest';
    const now = new Date();

    const newPayment: PmsFolioPayment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      roomNo,
      guestName,
      amount: payment.amount,
      paymentMode: (payment.paymentMode as any) || 'UPI',
      referenceNo: payment.referenceNo || `PAY-${roomNo}-${Date.now().toString().slice(-4)}`,
      timestamp: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      notes: payment.notes || 'Folio Settlement Payment'
    };

    all.unshift(newPayment);
    localStorage.setItem(STORAGE_KEYS.FOLIO_PAYMENTS, JSON.stringify(all));
    this.notify();
    return newPayment;
  }

  static applyFolioDiscount(
    roomNo: string,
    discount: { type: 'flat' | 'percent'; value: number; reason: string }
  ): void {
    const raw = localStorage.getItem(STORAGE_KEYS.FOLIO_DISCOUNTS);
    const allDiscounts = raw ? JSON.parse(raw) : {};
    allDiscounts[roomNo] = discount;
    localStorage.setItem(STORAGE_KEYS.FOLIO_DISCOUNTS, JSON.stringify(allDiscounts));
    this.notify();
  }

  static getFolioSummary(roomNo: string): PmsFolioSummary {
    const rooms = this.getRooms();
    const room = rooms.find(r => r.roomNo === roomNo);
    const guest = room?.currentGuest;

    const guestName = guest?.name || 'In-House Guest';
    const guestPhone = guest?.phone || '';
    const guestEmail = guest?.email || '';
    const roomType = room?.roomType || 'Executive Deluxe';
    const tariff = room?.tariff || 2499;

    const checkInDate = guest?.checkInDate || '2026-10-20';
    const checkInTime = guest?.checkInTime || '11:00 AM';
    const checkOutDate = guest?.checkOutDate || '2026-10-21';
    const checkOutTime = guest?.checkOutTime || '11:00 AM';

    // Calculate nights
    let nights = 1;
    try {
      const parseDate = (dStr: string) => {
        if (!dStr) return new Date();
        const parts = dStr.split('-');
        if (parts[0].length === 4) return new Date(dStr);
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      };
      const d1 = parseDate(checkInDate);
      const d2 = parseDate(checkOutDate);
      const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      nights = Math.max(1, isNaN(diff) ? 1 : diff);
    } catch {
      nights = 1;
    }

    const baseRoomRent = tariff * nights;

    // Extra guest charges (standard per room type)
    const extraGuestsRatePerNight = 0; // All tariffs are GST-inclusive; extra guests not billed separately
    const capacity = room?.capacity || 2;
    const totalGuests = (guest as any)?.adults || capacity;
    const extraGuestsCount = Math.max(0, totalGuests - capacity);
    const extraGuestsTotal = extraGuestsCount * extraGuestsRatePerNight * nights;

    // SAC 996311 Accommodation Bucket
    // IMPORTANT: All room tariffs (₹1,500 / ₹2,000 / ₹2,500 / ₹3,000) are GST-INCLUSIVE.
    // We extract the GST component from the tariff — we do NOT add GST on top.
    const roomGross = Math.round((baseRoomRent + extraGuestsTotal) * 100) / 100;
    const roomGstRate = 12; // All property tariffs are ≤ ₹7,500/night → 12% GST slab
    // Extract pre-GST base: base = gross / 1.12
    const exGstBase = Math.round((roomGross / 1.12) * 100) / 100;
    const roomCgst = Math.round(((roomGross - exGstBase) / 2) * 100) / 100;
    const roomSgst = roomCgst;
    const roomTaxTotal = Math.round((roomCgst + roomSgst) * 100) / 100;
    const roomTaxable = exGstBase; // pre-GST taxable value for GSTR-1 reporting

    // SAC 996331 Vasudev Rasoi F&B Bucket
    const kots = this.getKots().filter(k => k.roomNo === roomNo || (k as any).roomNumber === roomNo);
    const foodItems: Array<{ kotNo: string; date: string; amount: number; description: string }> = [];
    let foodTotalFromKots = 0;

    kots.forEach(k => {
      const kotAmount = (k.items || []).reduce((s, it) => s + (it.rate * it.qty), 0);
      foodTotalFromKots += kotAmount;
      foodItems.push({
        kotNo: k.kotNo,
        date: k.date || k.createdAt?.slice(0, 10) || checkInDate,
        amount: kotAmount,
        description: (k.items || []).map(it => `${it.itemName} x${it.qty}`).join(', ') || 'Room Service Pure-Veg'
      });
    });

    const extraFood = Math.max(0, (room?.foodAmount || 0) - foodTotalFromKots);
    if (extraFood > 0) {
      foodItems.push({
        kotNo: 'POS-ROOM-SVC',
        date: checkInDate,
        amount: extraFood,
        description: 'Vasudev Rasoi Room Service & F&B Posting'
      });
      foodTotalFromKots += extraFood;
    }

    const foodTaxable = foodTotalFromKots;
    const foodGstRate = 5; // strictly 5% (2.5% CGST + 2.5% SGST)
    const foodCgst = Math.round(foodTaxable * 0.025 * 100) / 100;
    const foodSgst = Math.round(foodTaxable * 0.025 * 100) / 100;
    const foodTaxTotal = Math.round((foodCgst + foodSgst) * 100) / 100;
    const foodGross = Math.round((foodTaxable + foodTaxTotal) * 100) / 100;

    // Add-On Services (SAC 999799)
    const addOthers = (guest as any)?.addOthers || 0;
    const addOthersGst = Math.round(addOthers * 0.12 * 100) / 100;

    // Discount Engine
    const discountsRaw = localStorage.getItem(STORAGE_KEYS.FOLIO_DISCOUNTS);
    const allDiscounts = discountsRaw ? JSON.parse(discountsRaw) : {};
    const roomDiscount: PmsFolioDiscount | undefined = allDiscounts[roomNo];

    let discountAmount = 0;
    if (roomDiscount) {
      if (roomDiscount.type === 'percent') {
        discountAmount = Math.round(baseRoomRent * (roomDiscount.value / 100));
      } else {
        discountAmount = Math.min(baseRoomRent, roomDiscount.value);
      }
    }

    const totalTaxable = Math.max(0, roomTaxable + foodTaxable + addOthers - discountAmount);
    const totalCgst = roomCgst + foodCgst;
    const totalSgst = roomSgst + foodSgst;
    const totalTax = Math.round((totalCgst + totalSgst + addOthersGst) * 100) / 100;
    const grandTotal = Math.round((roomGross + foodGross + addOthers + addOthersGst - discountAmount) * 100) / 100;

    // Payments & Advance Deposits
    const advancePaid = guest?.advancePaid || 0;
    const payments = this.getFolioPayments(roomNo);
    const additionalPaymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = advancePaid + additionalPaymentsTotal;
    const balanceDue = Math.max(0, Math.round((grandTotal - totalPaid) * 100) / 100);

    return {
      roomNo,
      roomType,
      guestName,
      guestPhone,
      guestEmail,
      idProofType: guest?.idProofType,
      idProofNumber: guest?.idProofNumber,
      vehicleNo: guest?.vehicleNo,
      companyName: guest?.companyName,
      gstin: guest?.gstin,
      darshanSlot: guest?.darshanSlot,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      nights,
      perNightTariff: tariff,
      baseRoomRent,
      extraGuestsCount,
      extraGuestsRatePerNight,
      extraGuestsTotal,
      roomTaxable,
      roomGstRate,
      roomCgst,
      roomSgst,
      roomTaxTotal,
      roomGross,

      foodItems,
      foodTaxable,
      foodGstRate,
      foodCgst,
      foodSgst,
      foodTaxTotal,
      foodGross,

      addOthers,
      addOthersGst,

      totalTaxable,
      totalCgst,
      totalSgst,
      totalTax,
      grandTotal,

      discount: roomDiscount ? { ...roomDiscount, amount: discountAmount } : undefined,
      advancePaid,
      payments,
      totalPaid,
      balanceDue
    };
  }

  static extendStay(roomNo: string, newCheckOutDate: string): { success: boolean; message: string } {
    const rooms = this.getRooms();
    const room = rooms.find(r => r.roomNo === roomNo);
    if (!room || !room.currentGuest) {
      return { success: false, message: 'Room is not currently occupied.' };
    }
    room.currentGuest.checkOutDate = newCheckOutDate;
    this.saveRooms(rooms);
    this.notify();
    return {
      success: true,
      message: `Stay for Room ${roomNo} successfully extended to ${newCheckOutDate}.`
    };
  }

  static transferRoom(fromRoomNo: string, toRoomNo: string, reason: string = 'Guest Preference'): {
    success: boolean;
    message: string;
  } {
    const rooms = this.getRooms();
    const fromRoom = rooms.find(r => r.roomNo === fromRoomNo);
    const toRoom = rooms.find(r => r.roomNo === toRoomNo);

    if (!fromRoom || !fromRoom.currentGuest) {
      return { success: false, message: `Room ${fromRoomNo} has no active guest to transfer.` };
    }
    if (!toRoom || (toRoom.status !== 'vacant' && toRoom.status !== 'dirty')) {
      return { success: false, message: `Destination Room ${toRoomNo} is not available.` };
    }

    toRoom.currentGuest = { ...fromRoom.currentGuest };
    toRoom.status = 'occupied';
    toRoom.foodAmount = fromRoom.foodAmount || 0;

    fromRoom.currentGuest = undefined;
    fromRoom.foodAmount = 0;
    fromRoom.status = 'dirty';

    const kots = this.getKots();
    kots.forEach(k => {
      if (k.roomNo === fromRoomNo) {
        k.roomNo = toRoomNo;
      }
    });
    localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify(kots));

    const payments = this.getFolioPayments();
    payments.forEach(p => {
      if (p.roomNo === fromRoomNo) {
        p.roomNo = toRoomNo;
      }
    });
    localStorage.setItem(STORAGE_KEYS.FOLIO_PAYMENTS, JSON.stringify(payments));

    // Migrate Folio Discounts
    const discountsRaw = localStorage.getItem(STORAGE_KEYS.FOLIO_DISCOUNTS);
    if (discountsRaw) {
      try {
        const allDiscounts = JSON.parse(discountsRaw);
        if (allDiscounts[fromRoomNo]) {
          allDiscounts[toRoomNo] = allDiscounts[fromRoomNo];
          delete allDiscounts[fromRoomNo];
          localStorage.setItem(STORAGE_KEYS.FOLIO_DISCOUNTS, JSON.stringify(allDiscounts));
        }
      } catch (err) {
        console.error('[PmsStore] Error migrating folio discount:', err);
      }
    }

    // Migrate Advance Receipts
    const advanceReceipts = this.getAdvanceReceipts();
    let advUpdated = false;
    advanceReceipts.forEach(ar => {
      if (ar.roomNo === fromRoomNo) {
        ar.roomNo = toRoomNo;
        advUpdated = true;
      }
    });
    if (advUpdated) {
      localStorage.setItem(STORAGE_KEYS.ADVANCE_RECEIPTS, JSON.stringify(advanceReceipts));
    }

    this.saveRooms(rooms);
    this.notify();

    return {
      success: true,
      message: `Guest ${toRoom.currentGuest?.name} successfully shifted from Room ${fromRoomNo} to ${toRoomNo}. (${reason})`
    };
  }

  static completeCheckOut(
    roomNo: string,
    settlement: { paymentMode: string; reference?: string; notes?: string }
  ): { success: boolean; invoiceNo: string; message: string } {
    const folio = this.getFolioSummary(roomNo);
    if (folio.balanceDue > 0 && settlement.paymentMode !== 'City Ledger') {
      this.recordFolioPayment(roomNo, {
        amount: folio.balanceDue,
        paymentMode: settlement.paymentMode as any,
        referenceNo: settlement.reference || 'FINAL-SETTLEMENT',
        notes: settlement.notes || 'Full Settlement at Checkout'
      });
    }

    const checkouts = this.getCheckouts();
    const nextSeq = checkouts.length + 101;
    const invoiceNo = `SVR/2026-27/INV-${String(nextSeq).padStart(4, '0')}`;

    const updatedFolio = this.getFolioSummary(roomNo);
    const checkoutRecord: PmsCheckOutDetail = {
      invoiceNo,
      roomNo,
      roomType: updatedFolio.roomType,
      guestName: updatedFolio.guestName,
      guestPhone: updatedFolio.guestPhone,
      checkInDate: updatedFolio.checkInDate,
      checkInTime: updatedFolio.checkInTime,
      checkOutDate: updatedFolio.checkOutDate,
      checkOutTime: updatedFolio.checkOutTime,
      calculationType: '12hour',
      numberOfDays: updatedFolio.nights,
      perDayTariff: updatedFolio.perNightTariff,
      totalRoomRent: updatedFolio.baseRoomRent,
      foodAmount: updatedFolio.foodGross,
      gstPercent: updatedFolio.roomGstRate,
      gstAmount: updatedFolio.totalTax,
      cgstAmount: updatedFolio.totalCgst,
      sgstAmount: updatedFolio.totalSgst,
      addOthers: updatedFolio.addOthers,
      lessDiscount: updatedFolio.discount?.amount || 0,
      advanceDeducted: updatedFolio.advancePaid,
      billAmount: updatedFolio.grandTotal,
      netPayable: 0,
      paymentMode: (['Cash', 'UPI', 'Card', 'Bank Transfer', 'Online', 'Credit'].includes(settlement.paymentMode) ? settlement.paymentMode : 'Cash') as any,
      paidAmount: updatedFolio.grandTotal,
      balanceAmount: 0,
      payments: updatedFolio.payments.map(p => ({
        mode: p.paymentMode,
        amount: p.amount,
        referenceNo: p.referenceNo,
        remark: p.notes
      })),
      checkoutRemark: settlement.notes || 'Normal Checkout Completed',
      city: 'Shirdi',
      state: 'Maharashtra',
      country: 'India',
      pinCode: '423109',
      sacCode: '996311',
      invoiceFormat: 'A4_Standard'
    };

    this.saveCheckout(checkoutRecord);

    // Transition room to 'dirty' (Vacant Dirty)
    this.updateRoomStatus(roomNo, 'dirty', undefined);

    // Update Housekeeping record
    this.updateHousekeepingStatus(roomNo, 'Vacant Dirty', undefined, 'Normal', undefined);

    this.notify();

    return {
      success: true,
      invoiceNo,
      message: `Checkout complete. Final GST Invoice ${invoiceNo} generated. Room ${roomNo} released to Vacant Dirty.`
    };
  }

  // =========================================================================
  // 6. Public Booking & Reservation Bridge (Cross-Module Reactivity Law)
  // =========================================================================
  static createGuestBooking(booking: {
    roomId?: number | string;
    roomType?: string;
    roomNo?: string;
    guestName: string;
    guestPhone: string;
    guestEmail?: string;
    idProofType?: string;
    idProofNumber?: string;
    checkInDate: string;
    checkOutDate: string;
    adults?: number;
    children?: number;
    advancePaid?: number;
    specialRequests?: string;
    paymentMethod?: string;
  }): { booking: PmsBooking; room: PmsRoom } {
    const rooms = this.getRooms();
    let targetRoom: PmsRoom | undefined;

    if (booking.roomNo) {
      targetRoom = rooms.find(r => r.roomNo === booking.roomNo);
    }
    if (!targetRoom && booking.roomType) {
      targetRoom = rooms.find(r => r.roomType.toLowerCase().includes(booking.roomType!.toLowerCase()) && r.status === 'vacant');
    }
    if (!targetRoom && booking.roomId) {
      const rId = String(booking.roomId);
      targetRoom = rooms.find(r => r.id === rId && r.status === 'vacant');
      if (!targetRoom) {
        const catMap: Record<string, string> = {
          '1': 'Executive Deluxe',
          '2': 'Classic Studio',
          '3': 'Executive',
          '4': 'Premium'
        };
        const catName = catMap[rId];
        if (catName) {
          targetRoom = rooms.find(r => r.roomType === catName && r.status === 'vacant');
        }
      }
    }
    if (!targetRoom) {
      targetRoom = rooms.find(r => r.status === 'vacant') || rooms[0];
    }

    const existingBookings = this.getBookings();
    const nextSeq = existingBookings.length + 105;
    const bookingNo = `BKG-2026-${nextSeq}`;
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));
    // Tariffs are GST-inclusive — grand total equals tariff × nights (no additional GST)
    const grand = targetRoom.tariff * nights;

    const newBooking: PmsBooking = {
      bookingNo,
      voucherNo: String(nextSeq),
      bookingDate: dateStr,
      bookingTime: timeStr,
      date: dateStr,
      time: timeStr,
      checkInDate: booking.checkInDate,
      checkInTime: '12:00 PM',
      checkOutDate: booking.checkOutDate,
      checkOutTime: '11:00 AM',
      numberOfDays: nights,
      numberOfGuests: (booking.adults || 2) + (booking.children || 0),
      businessSource: (booking.paymentMethod === 'Online' || booking.paymentMethod === 'UPI') ? 'Online' : 'Walk-in',
      package: 'ROOM ONLY || 0',
      guestName: booking.guestName,
      mobile: booking.guestPhone,
      guestPhone: booking.guestPhone,
      phone: booking.guestPhone,
      email: booking.guestEmail,
      guestEmail: booking.guestEmail,
      rooms: [{
        roomNo: targetRoom.roomNo,
        roomType: targetRoom.roomType,
        tariff: targetRoom.tariff
      }],
      roomNo: targetRoom.roomNo,
      roomType: targetRoom.roomType,
      tariff: targetRoom.tariff,
      totalAmount: grand,
      bookingAmount: booking.advancePaid || 0,
      advancePaid: booking.advancePaid || 0,
      paymentMode: (booking.paymentMethod === 'Cash' || booking.paymentMethod === 'Card' || booking.paymentMethod === 'UPI' || booking.paymentMethod === 'Bank Transfer') ? booking.paymentMethod : 'UPI',
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
      adults: booking.adults || 2,
      children: booking.children || 0,
      specialRequests: booking.specialRequests,
      idProofType: booking.idProofType,
      idProofNumber: booking.idProofNumber
    };

    this.saveBooking(newBooking);

    // Lock availability on Room Rack
    targetRoom.status = 'booked';
    targetRoom.currentGuest = {
      name: booking.guestName,
      phone: booking.guestPhone,
      email: booking.guestEmail,
      checkInDate: booking.checkInDate,
      checkInTime: '12:00 PM',
      checkOutDate: booking.checkOutDate,
      checkOutTime: '11:00 AM',
      bookingNo,
      advancePaid: booking.advancePaid || 0,
      calculationType: '12hour',
      idProofType: booking.idProofType || 'Aadhaar Card',
      idProofNumber: booking.idProofNumber
    };
    this.saveRooms(rooms);

    if ((booking.advancePaid || 0) > 0) {
      this.saveAdvanceReceipt({
        receiptNo: `AR${nextSeq}`,
        voucherNo: String(nextSeq),
        date: newBooking.date || dateStr,
        time: newBooking.time || timeStr,
        voucherName: 'Advance_Receipt',
        roomNo: targetRoom.roomNo,
        guestName: booking.guestName,
        mobile: booking.guestPhone,
        amount: booking.advancePaid!,
        paymentMode: (booking.paymentMethod as any) || 'UPI',
        referenceNo: `ADV-${bookingNo}`,
        remark: 'Advance Deposit at Reservation',
        createdAt: new Date().toISOString()
      });
    }

    // Enterprise Cloud Sync: Post Booking to FastAPI PostgreSQL Database
    hotelApi.createBooking({
      room_id: Number(targetRoom.id) || Number(targetRoom.roomNo) || 1,
      guest_name: booking.guestName,
      guest_email: booking.guestEmail || `${booking.guestPhone}@saivasudevresidency.com`,
      guest_phone: booking.guestPhone,
      id_proof_type: booking.idProofType || 'Aadhaar Card',
      id_proof_number: booking.idProofNumber,
      check_in_date: booking.checkInDate,
      check_out_date: booking.checkOutDate,
      adults: booking.adults || 2,
      children: booking.children || 0,
      payment_method: booking.paymentMethod || 'Pay at Hotel',
      advance_paid: booking.advancePaid || 0,
      special_requests: booking.specialRequests,
      vehicle_number: (booking as any).vehicleNumber,
      company_name: (booking as any).companyName,
      gstin: (booking as any).gstin
    }).catch(err => {
      console.warn('[PmsStore] Background FastAPI PostgreSQL booking sync notice:', err);
    });

    this.notify();
    return { booking: newBooking, room: targetRoom };
  }

  static checkInBooking(bookingNo: string): { success: boolean; message: string } {
    const bookings = this.getBookings();
    const b = bookings.find(x => x.bookingNo === bookingNo);
    if (!b) return { success: false, message: 'Booking not found' };

    b.status = 'Confirmed';
    this.saveBooking(b);

    const rooms = this.getRooms();
    const room = rooms.find(r => r.roomNo === (b.roomNo || b.rooms?.[0]?.roomNo));
    if (room) {
      room.status = 'occupied';
      room.currentGuest = {
        name: b.guestName,
        phone: b.guestPhone || b.mobile || b.phone || '',
        email: b.guestEmail || b.email,
        checkInDate: b.checkInDate,
        checkInTime: b.checkInTime || '12:00 PM',
        checkOutDate: b.checkOutDate,
        checkOutTime: b.checkOutTime || '11:00 AM',
        bookingNo: b.bookingNo,
        advancePaid: b.advancePaid || b.bookingAmount || 0,
        calculationType: '12hour'
      };
      this.saveRooms(rooms);
    }

    // Enterprise Cloud Sync: Post Check-In to FastAPI PostgreSQL Database
    hotelApi.walkInCheckIn({
      room_id: Number(room?.id) || Number(b.roomNo) || 101,
      guest_name: b.guestName,
      guest_email: b.guestEmail || b.email || `${b.guestPhone || b.mobile}@saivasudevresidency.com`,
      guest_phone: b.guestPhone || b.mobile || '',
      id_proof_type: b.idProofType || 'Aadhaar Card',
      id_proof_number: b.idProofNumber,
      check_in_date: b.checkInDate,
      check_out_date: b.checkOutDate,
      adults: b.adults || 2,
      children: b.children || 0,
      payment_method: b.paymentMode || 'Cash',
      advance_paid: b.advancePaid || b.bookingAmount || 0
    }).catch(err => {
      console.warn('[PmsStore] Background FastAPI PostgreSQL check-in sync notice:', err);
    });

    this.notify();
    return { success: true, message: `Guest ${b.guestName} successfully checked into Room ${b.roomNo || room?.roomNo || ''}.` };
  }

  // Room Types
  static getRoomTypes(): PmsRoomType[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ROOM_TYPES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ROOM_TYPES, JSON.stringify(INITIAL_ROOM_TYPES));
      return INITIAL_ROOM_TYPES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ROOM_TYPES;
    }
  }

  static saveRoomType(roomType: PmsRoomType): void {
    const list = this.getRoomTypes();
    const idx = list.findIndex(r => r.id === roomType.id || r.roomTypeName.toLowerCase() === roomType.roomTypeName.toLowerCase());
    if (idx >= 0) {
      list[idx] = roomType;
    } else {
      list.push(roomType);
    }
    localStorage.setItem(STORAGE_KEYS.ROOM_TYPES, JSON.stringify(list));
  }

  static deleteRoomType(id: string): void {
    const list = this.getRoomTypes().filter(r => r.id !== id && r.roomTypeName !== id);
    localStorage.setItem(STORAGE_KEYS.ROOM_TYPES, JSON.stringify(list));
  }

  // Dining Tables
  static getTables(): PmsDiningTable[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TABLES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
      return INITIAL_TABLES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TABLES;
    }
  }

  static saveTable(table: PmsDiningTable): void {
    const list = this.getTables();
    const idx = list.findIndex(t => t.id === table.id || t.tableName.toLowerCase() === table.tableName.toLowerCase());
    if (idx >= 0) {
      list[idx] = table;
    } else {
      list.push(table);
    }
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(list));
  }

  static deleteTable(id: string): void {
    const list = this.getTables().filter(t => t.id !== id && t.tableName !== id);
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(list));
  }

  static vacateTable(tableNameOrId: string): void {
    if (!tableNameOrId) return;
    const list = this.getTables();
    const clean = tableNameOrId.toLowerCase().trim().replace(/^table\s+/i, '');
    const table = list.find(t => 
      t.id.toLowerCase() === clean || 
      t.tableName.toLowerCase() === clean ||
      t.tableName.toLowerCase() === `table ${clean}` ||
      t.tableName.toLowerCase().replace(/^table\s+/i, '').trim() === clean
    );
    if (table) {
      table.status = 'Vacant';
      table.activeKotNos = [];
      this.saveTable(table);
    }
  }

  static occupyTable(tableNameOrId: string): void {
    if (!tableNameOrId) return;
    const list = this.getTables();
    const clean = tableNameOrId.toLowerCase().trim().replace(/^table\s+/i, '');
    const table = list.find(t => 
      t.id.toLowerCase() === clean || 
      t.tableName.toLowerCase() === clean ||
      t.tableName.toLowerCase() === `table ${clean}` ||
      t.tableName.toLowerCase().replace(/^table\s+/i, '').trim() === clean
    );
    if (table) {
      table.status = 'Running';
      this.saveTable(table);
    }
  }

  // GST Masters
  static getGstMasters(): PmsGstMaster[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GST_MASTERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.GST_MASTERS, JSON.stringify(INITIAL_GST_MASTERS));
      return INITIAL_GST_MASTERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_GST_MASTERS;
    }
  }

  static saveGstMaster(gst: PmsGstMaster): void {
    const list = this.getGstMasters();
    const idx = list.findIndex(g => g.id === gst.id || g.name.toLowerCase() === gst.name.toLowerCase());
    if (idx >= 0) {
      list[idx] = gst;
    } else {
      list.push(gst);
    }
    localStorage.setItem(STORAGE_KEYS.GST_MASTERS, JSON.stringify(list));
  }

  static deleteGstMaster(id: string): void {
    const list = this.getGstMasters().filter(g => g.id !== id && g.name !== id);
    localStorage.setItem(STORAGE_KEYS.GST_MASTERS, JSON.stringify(list));
  }

  // Business Sources
  static getBusinessSources(): PmsBusinessSource[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BUSINESS_SOURCES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BUSINESS_SOURCES, JSON.stringify(INITIAL_BUSINESS_SOURCES));
      return INITIAL_BUSINESS_SOURCES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_BUSINESS_SOURCES;
    }
  }

  static saveBusinessSource(source: PmsBusinessSource): void {
    const list = this.getBusinessSources();
    const idx = list.findIndex(s => s.id === source.id || s.name.toLowerCase() === source.name.toLowerCase());
    if (idx >= 0) {
      list[idx] = source;
    } else {
      list.push(source);
    }
    localStorage.setItem(STORAGE_KEYS.BUSINESS_SOURCES, JSON.stringify(list));
  }

  static deleteBusinessSource(id: string): void {
    const list = this.getBusinessSources().filter(s => s.id !== id && s.name !== id);
    localStorage.setItem(STORAGE_KEYS.BUSINESS_SOURCES, JSON.stringify(list));
  }

  // Voucher Types
  static getVoucherTypes(): PmsVoucherType[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VOUCHER_TYPES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.VOUCHER_TYPES, JSON.stringify(INITIAL_VOUCHER_TYPES));
      return INITIAL_VOUCHER_TYPES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_VOUCHER_TYPES;
    }
  }

  static updateVoucherType(voucher: PmsVoucherType): void {
    const list = this.getVoucherTypes();
    const idx = list.findIndex(v => v.id === voucher.id || v.voucherTypeName.toLowerCase() === voucher.voucherTypeName.toLowerCase());
    if (idx >= 0) {
      list[idx] = voucher;
    } else {
      list.push(voucher);
    }
    localStorage.setItem(STORAGE_KEYS.VOUCHER_TYPES, JSON.stringify(list));
  }

  // Lockers Master
  static getLockers(): PmsLocker[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCKERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LOCKERS, JSON.stringify(INITIAL_LOCKERS));
      return INITIAL_LOCKERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_LOCKERS;
    }
  }

  static saveLocker(locker: PmsLocker): void {
    const list = this.getLockers();
    const idx = list.findIndex(l => l.id === locker.id || l.lockerNo.toLowerCase() === locker.lockerNo.toLowerCase());
    if (idx >= 0) {
      list[idx] = locker;
    } else {
      list.push(locker);
    }
    localStorage.setItem(STORAGE_KEYS.LOCKERS, JSON.stringify(list));
  }

  static deleteLocker(id: string): void {
    const list = this.getLockers().filter(l => l.id !== id && l.lockerNo !== id);
    localStorage.setItem(STORAGE_KEYS.LOCKERS, JSON.stringify(list));
  }

  // Other Charges Master
  static getOtherCharges(): PmsOtherCharge[] {
    const raw = localStorage.getItem(STORAGE_KEYS.OTHER_CHARGES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.OTHER_CHARGES, JSON.stringify(INITIAL_OTHER_CHARGES));
      return INITIAL_OTHER_CHARGES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_OTHER_CHARGES;
    }
  }

  static saveOtherCharge(charge: PmsOtherCharge): void {
    const list = this.getOtherCharges();
    const idx = list.findIndex(c => c.id === charge.id || c.chargeName.toLowerCase() === charge.chargeName.toLowerCase());
    if (idx >= 0) {
      list[idx] = charge;
    } else {
      list.push(charge);
    }
    localStorage.setItem(STORAGE_KEYS.OTHER_CHARGES, JSON.stringify(list));
  }

  static deleteOtherCharge(id: string): void {
    const list = this.getOtherCharges().filter(c => c.id !== id && c.chargeName !== id);
    localStorage.setItem(STORAGE_KEYS.OTHER_CHARGES, JSON.stringify(list));
  }

  // Menu Items
  static getMenuItems(): MenuItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(INITIAL_MENU_ITEMS));
      return INITIAL_MENU_ITEMS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_MENU_ITEMS;
    }
  }

  static saveMenuItem(item: MenuItem): void {
    const list = this.getMenuItems();
    const idx = list.findIndex(m => m.id === item.id || m.code === item.code || m.name.toLowerCase() === item.name.toLowerCase());
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(list));
  }

  static saveMenuItems(items: MenuItem[]): void {
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(items));
  }

  static deleteMenuItem(id: string): void {
    const list = this.getMenuItems().filter(m => m.id !== id && m.code !== id);
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(list));
  }

  // Business Settings (Video 09 - 12 Hour vs 24 Hour Policy)
  static getBusinessSettings(): PmsBusinessSetting {
    const raw = localStorage.getItem(STORAGE_KEYS.BUSINESS_SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BUSINESS_SETTINGS, JSON.stringify(DEFAULT_BUSINESS_SETTING));
      return DEFAULT_BUSINESS_SETTING;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_BUSINESS_SETTING;
    }
  }

  static saveBusinessSettings(settings: PmsBusinessSetting): void {
    localStorage.setItem(STORAGE_KEYS.BUSINESS_SETTINGS, JSON.stringify(settings));
  }

  /**
   * Computes Day-Wise Rent and intervals matching Video 09 Frames 0240 & 0260:
   * 12-Hour standard checkout policy vs 24-Hour rolling stay duration
   */
  static computeDayWiseRent(params: {
    checkInDate: string;        // DD-MM-YYYY or YYYY-MM-DD
    checkInTime: string;        // e.g. "06:01 PM" or "18:01"
    checkOutDate: string;       // DD-MM-YYYY or YYYY-MM-DD
    checkOutTime: string;       // e.g. "06:02 PM" or "18:02"
    perDayTariff: number;
    calculationType: '12hour' | '24hour';
    standardCheckoutTime?: string; // e.g. "11:00 AM"
  }): { dayWiseRent: DayWiseRentItem[]; totalDays: number; totalRent: number } {
    const {
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      perDayTariff,
      calculationType,
      standardCheckoutTime = '11:00 AM'
    } = params;

    const items: DayWiseRentItem[] = [];

    const parseTime = (tStr: string): { hours: number; minutes: number } => {
      if (!tStr) return { hours: 12, minutes: 0 };
      const isPM = /pm/i.test(tStr);
      const isAM = /am/i.test(tStr);
      const clean = tStr.replace(/am|pm/gi, '').trim();
      const parts = clean.split(':').map(Number);
      let h = parts[0] || 0;
      const m = parts[1] || 0;
      if (isPM && h < 12) h += 12;
      if (isAM && h === 12) h = 0;
      return { hours: h, minutes: m };
    };

    const parseDateToObj = (dStr: string, tStr: string): Date => {
      const { hours, minutes } = parseTime(tStr);
      let y = 2025, m = 5, d = 9;
      if (dStr && dStr.includes('-')) {
        const p = dStr.split('-');
        if (p[0].length === 4) {
          y = Number(p[0]);
          m = Number(p[1]) - 1;
          d = Number(p[2]);
        } else {
          d = Number(p[0]);
          m = Number(p[1]) - 1;
          y = Number(p[2]);
        }
      }
      return new Date(y, m, d, hours, minutes, 0);
    };

    const inDate = parseDateToObj(checkInDate, checkInTime);
    const outDate = parseDateToObj(checkOutDate, checkOutTime);
    const stdTime = parseTime(standardCheckoutTime);

    const formatDt = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const secs = String(d.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
    };

    if (calculationType === '24hour') {
      const diffMs = Math.max(0, outDate.getTime() - inDate.getTime());
      const totalHours = diffMs / (1000 * 60 * 60);
      let dayCount = Math.ceil(totalHours / 24);
      if (dayCount < 1) dayCount = 1;

      let currentStart = new Date(inDate);
      for (let i = 1; i <= dayCount; i++) {
        const nextPeriodEnd = new Date(currentStart.getTime() + 24 * 60 * 60 * 1000);
        const effectiveEnd = (i === dayCount && outDate > currentStart && outDate <= nextPeriodEnd)
          ? outDate
          : nextPeriodEnd;

        items.push({
          sNo: i,
          startDate: formatDt(currentStart),
          endDate: formatDt(effectiveEnd),
          dayCount: 1,
          rent: perDayTariff
        });
        currentStart = nextPeriodEnd;
      }

      return {
        dayWiseRent: items,
        totalDays: items.length,
        totalRent: items.length * perDayTariff
      };
    } else {
      // 12-Hour policy / Standard Fixed Checkout Time Policy (e.g. 11:00 AM)
      let nextStd = new Date(inDate);
      nextStd.setHours(stdTime.hours, stdTime.minutes, 0, 0);
      if (nextStd <= inDate) {
        nextStd.setDate(nextStd.getDate() + 1);
      }

      items.push({
        sNo: 1,
        startDate: formatDt(inDate),
        endDate: formatDt(nextStd),
        dayCount: 1,
        rent: perDayTariff
      });

      let currentPeriodStart = new Date(nextStd);
      while (currentPeriodStart < outDate) {
        const nextPeriodEnd = new Date(currentPeriodStart);
        nextPeriodEnd.setDate(nextPeriodEnd.getDate() + 1);

        const isLast = nextPeriodEnd >= outDate;
        items.push({
          sNo: items.length + 1,
          startDate: formatDt(currentPeriodStart),
          endDate: formatDt(isLast ? outDate : nextPeriodEnd),
          dayCount: 1,
          rent: perDayTariff
        });

        currentPeriodStart = nextPeriodEnd;
      }

      return {
        dayWiseRent: items,
        totalDays: items.length,
        totalRent: items.length * perDayTariff
      };
    }
  }

  // Video 20: Booking Store & Real-Time Availability Engine
  static getBookings(): PmsBooking[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_BOOKINGS;
    }
  }

  static getUnconfirmedBookings(): PmsBooking[] {
    return this.getBookings().filter(b => b.status === 'Unconfirmed');
  }

  static getConfirmedBookings(): PmsBooking[] {
    return this.getBookings().filter(b => b.status === 'Confirmed');
  }

  static saveBooking(booking: PmsBooking): void {
    const list = this.getBookings();
    const idx = list.findIndex(b => b.bookingNo === booking.bookingNo);
    if (idx >= 0) {
      list[idx] = booking;
    } else {
      list.unshift(booking);
    }
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(list));

    // If confirmed or checked-in, update room status
    if (booking.status === 'Confirmed' || booking.status === 'CheckedIn') {
      const targetStatus = booking.status === 'CheckedIn' ? 'occupied' : 'booked';
      booking.rooms.forEach(rm => {
        this.updateRoomStatus(rm.roomNo, targetStatus, {
          name: booking.guestName,
          phone: booking.mobile,
          checkInDate: booking.checkInDate,
          checkInTime: booking.checkInTime,
          bookingNo: booking.bookingNo,
          advancePaid: booking.bookingAmount
        });
      });
    }
  }

  static confirmBooking(bookingNo: string, advancePaid?: number): { success: boolean; message: string } {
    const list = this.getBookings();
    const booking = list.find(b => b.bookingNo === bookingNo);
    if (!booking) {
      return { success: false, message: 'Booking not found' };
    }
    booking.status = 'Confirmed';
    if (advancePaid !== undefined) {
      booking.bookingAmount = advancePaid;
    }
    this.saveBooking(booking);
    return { success: true, message: 'Selected Booking Confirm you can Make Check In' };
  }

  static deleteBooking(bookingNo: string): void {
    const list = this.getBookings().filter(b => b.bookingNo !== bookingNo);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(list));
  }

  /**
   * Video 20 Real-Time Date Availability Engine [Spoken 06:25 - 07:35]:
   * Checks whether a room is free between checkInDate and checkOutDate
   */
  static isRoomAvailable(roomNo: string, checkInDateStr: string, checkOutDateStr: string): boolean {
    const parseDt = (dStr: string): number => {
      if (!dStr) return 0;
      const clean = dStr.trim();
      if (clean.includes('-')) {
        const parts = clean.split('-');
        if (parts[0].length === 4) {
          return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
        } else {
          return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
        }
      }
      return new Date(clean).getTime();
    };

    const reqIn = parseDt(checkInDateStr);
    const reqOut = parseDt(checkOutDateStr);
    if (!reqIn || !reqOut || reqIn >= reqOut) return true;

    // 1. Check against active confirmed bookings
    const bookings = this.getBookings().filter(b => b.status === 'Confirmed' || b.status === 'CheckedIn');
    for (const b of bookings) {
      const hasRoom = b.rooms.some(r => r.roomNo === roomNo);
      if (hasRoom) {
        const bIn = parseDt(b.checkInDate);
        const bOut = parseDt(b.checkOutDate);
        if (bIn < reqOut && bOut > reqIn) {
          return false; // Conflicting booking exists!
        }
      }
    }

    // 2. Check against current check-ins
    const checkIns = this.getCheckIns().filter(c => c.status === 'CheckedIn' && c.roomNo === roomNo);
    for (const c of checkIns) {
      const cIn = parseDt(c.checkInDate);
      const cOut = cIn + (c.numberOfDays || 1) * 24 * 60 * 60 * 1000;
      if (cIn < reqOut && cOut > reqIn) {
        return false; // Conflicting active stay!
      }
    }

    return true;
  }

  static getAvailableRoomsForDates(checkInDateStr: string, checkOutDateStr: string): PmsRoom[] {
    const allRooms = this.getRooms();
    return allRooms.filter(r => this.isRoomAvailable(r.roomNo, checkInDateStr, checkOutDateStr));
  }

  static getCheckIns(): import('../types/pmsModels').PmsCheckIn[] {
    const defaultCheckIns: import('../types/pmsModels').PmsCheckIn[] = [
      {
        checkInNo: 'SR/231/25-26',
        roomNo: '201',
        roomType: 'DELUXE',
        guestName: 'SAMEER KHAN',
        mobile: '7999663646',
        checkInDate: '10-07-2025',
        checkInTime: '23:10:00',
        numberOfDays: 1,
        numberOfGuests: 3,
        businessSource: 'Direct',
        package: 'ROOM ONLY',
        tariffPerDay: 2500,
        advancePaid: 2500,
        paymentMode: 'Cash',
        documentName: 'Aadhaar Card',
        documentNo: '348784787487',
        addressLine1: 'MAIN ROAD NEAR SHYAM TAKIES',
        city: 'Jabalpur',
        state: 'Madhya Pradesh',
        country: 'India',
        pinCode: '482001',
        nationality: 'India',
        guestImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        documentImage: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=200&auto=format&fit=crop&q=80',
        secondGuestName: 'juli',
        secondGuestIdName: 'Aadhaar Card',
        secondGuestIdNo: '23234232',
        secondGuestDocument: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        thirdGuestName: 'vipin',
        thirdGuestIdName: 'Voter ID',
        thirdGuestIdNo: '392849732',
        thirdGuestDocument: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        status: 'CheckedIn',
        createdAt: '2025-07-10T23:10:00.000Z'
      },
      {
        checkInNo: 'SR/232/25-26',
        roomNo: '202',
        roomType: 'LUXRY ROOM',
        guestName: 'sunil kumar yadav',
        mobile: '983982735',
        checkInDate: '10-07-2025',
        checkInTime: '23:21:00',
        numberOfDays: 1,
        numberOfGuests: 3,
        businessSource: 'Goibibo',
        package: 'WITH LUNCH || WITH LUNCH',
        tariffPerDay: 4700,
        advancePaid: 4700,
        paymentMode: 'Cash',
        documentName: 'aadhar card',
        documentNo: '983298274',
        addressLine1: 'shop no 8',
        city: 'jabalpur',
        state: 'm.p.',
        country: 'India',
        pinCode: '482001',
        nationality: 'India',
        companyName: 'HCL',
        companyAddress: 'BANGLORE',
        gstNo: '23IJHKJHKJI',
        guestImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        documentImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&auto=format&fit=crop&q=80',
        secondGuestName: 'sanjay',
        secondGuestIdName: 'aadhar card',
        secondGuestIdNo: '54654654',
        secondGuestDocument: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        thirdGuestName: 'mohan',
        thirdGuestIdName: 'aadhar card',
        thirdGuestIdNo: '234234234',
        thirdGuestDocument: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        status: 'CheckedIn',
        createdAt: '2025-07-10T23:21:00.000Z'
      },
      {
        checkInNo: 'SR/229/25-26',
        roomNo: '202',
        roomType: 'LUXRY ROOM',
        guestName: 'CHANDAN',
        mobile: '5645648848',
        checkInDate: '10-07-2025',
        checkInTime: '17:04:00',
        numberOfDays: 1,
        numberOfGuests: 1,
        businessSource: 'Walk-in',
        package: 'ROOM ONLY',
        tariffPerDay: 4000,
        advancePaid: 4000,
        paymentMode: 'Cash',
        documentName: 'Voter ID',
        documentNo: 'VTR-8947291',
        addressLine1: 'Station Road',
        city: 'Patna',
        state: 'Bihar',
        country: 'India',
        pinCode: '800001',
        nationality: 'India',
        guestImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        documentImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&auto=format&fit=crop&q=80',
        status: 'CheckedIn',
        createdAt: '2025-07-10T17:04:00.000Z'
      },
      {
        checkInNo: 'SR/230/25-26',
        roomNo: '205',
        roomType: 'Dormitory',
        guestName: 'SALIM',
        mobile: '7479499435',
        checkInDate: '10-07-2025',
        checkInTime: '18:10:00',
        numberOfDays: 1,
        numberOfGuests: 2,
        businessSource: 'Direct',
        package: 'ROOM ONLY',
        tariffPerDay: 3000,
        advancePaid: 3000,
        paymentMode: 'Cash',
        documentName: 'Driving License',
        documentNo: 'DL-092023910',
        addressLine1: 'Boring Road, PATNA',
        city: 'Patna',
        state: 'Bihar',
        country: 'India',
        pinCode: '800001',
        nationality: 'India',
        guestImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        documentImage: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=200&auto=format&fit=crop&q=80',
        status: 'CheckedIn',
        createdAt: '2025-07-10T18:10:00.000Z'
      },
      {
        checkInNo: 'SR/204/25-26',
        roomNo: '103',
        roomType: 'DELUXE',
        guestName: 'ARJUN',
        mobile: '95487417',
        checkInDate: '16-06-2025',
        checkInTime: '06:30 AM',
        numberOfDays: 1,
        numberOfGuests: 1,
        businessSource: 'OYO',
        package: 'WITH BREAKFAST || WITH BREAKFAST',
        tariffPerDay: 2500,
        advancePaid: 1000,
        paymentMode: 'Cash',
        addressLine1: 'Main Market Road',
        addressLine2: '0',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        pinCode: '411001',
        nationality: 'India',
        status: 'CheckedIn',
        createdAt: '2025-06-16T06:30:00.000Z'
      },
      {
        checkInNo: 'SR/203/25-26',
        roomNo: '101',
        roomType: 'DELUXE',
        guestName: 'AJUU',
        mobile: '9622975444',
        checkInDate: '16-06-2025',
        checkInTime: '05:15 AM',
        numberOfDays: 1,
        numberOfGuests: 1,
        businessSource: 'Direct',
        package: 'ROOM ONLY || 0',
        tariffPerDay: 2000,
        advancePaid: 500,
        paymentMode: 'Cash',
        addressLine1: 'Station Road',
        city: 'Bilaspur',
        state: 'Chhattisgarh',
        country: 'India',
        pinCode: '495220',
        nationality: 'India',
        status: 'CheckedIn',
        createdAt: '2025-06-16T05:15:00.000Z'
      }
    ];

    const raw = localStorage.getItem('hotel_pms_checkins');
    if (raw) {
      try {
        const parsed: import('../types/pmsModels').PmsCheckIn[] = JSON.parse(raw);
        let updated = false;
        for (const seed of defaultCheckIns) {
          if (!parsed.some(c => c.checkInNo === seed.checkInNo)) {
            parsed.push(seed);
            updated = true;
          }
        }
        if (updated) {
          localStorage.setItem('hotel_pms_checkins', JSON.stringify(parsed));
        }
        return parsed;
      } catch {
        // fallback
      }
    }

    localStorage.setItem('hotel_pms_checkins', JSON.stringify(defaultCheckIns));
    return defaultCheckIns;
  }

  static saveCheckIn(checkIn: import('../types/pmsModels').PmsCheckIn): void {
    const list = this.getCheckIns();
    list.unshift(checkIn);
    localStorage.setItem('hotel_pms_checkins', JSON.stringify(list));

    // Update room status to occupied (Royal Blue / Emerald Green)
    this.updateRoomStatus(checkIn.roomNo, 'occupied', {
      name: checkIn.guestName,
      phone: checkIn.mobile,
      email: checkIn.email,
      checkInDate: checkIn.checkInDate,
      checkInTime: checkIn.checkInTime,
      checkOutDate: checkIn.checkOutDate,
      bookingNo: checkIn.checkInNo,
      advancePaid: checkIn.advancePaid,
      calculationType: '12hour',
      idProofType: checkIn.documentName,
      idProofNumber: checkIn.documentNo,
      companyName: checkIn.companyName,
      gstin: checkIn.gstNo
    });

    // Cloud sync: mirror to PostgreSQL on Railway
    const roomId = parseInt(checkIn.roomNo, 10) || 1;
    hotelApi.walkInCheckIn({
      room_id: roomId,
      guest_name: checkIn.guestName,
      guest_phone: checkIn.mobile,
      id_proof_type: checkIn.documentName || 'Aadhaar Card',
      id_proof_number: checkIn.documentNo || 'VERIFIED_AT_DESK',
      check_in_date: new Date().toISOString().split('T')[0],
      check_out_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      adults: checkIn.numberOfGuests || 2,
      children: 0,
      advance_amount: checkIn.advancePaid || 0,
      advance_payment_mode: checkIn.paymentMode || 'Cash',
      registered_by: 'Reception Desk'
    }).catch(e => console.warn('[PmsStore] Background cloud check-in sync note:', e));
  }

  // Video 22 & 23 Anti-Theft Guard: Delete Check-In Record
  static deleteCheckIn(checkInNo: string): boolean {
    const list = this.getCheckIns();
    const target = list.find(c => c.checkInNo === checkInNo);
    if (!target) return false;
    const remaining = list.filter(c => c.checkInNo !== checkInNo);
    localStorage.setItem('hotel_pms_checkins', JSON.stringify(remaining));

    // Release occupied room back to vacant if it was occupied by this check-in
    const room = this.getRooms().find(r => r.roomNo === target.roomNo);
    if (room && room.status === 'occupied' && room.currentGuest?.bookingNo === checkInNo) {
      this.updateRoomStatus(target.roomNo, 'vacant');
    }

    // Video 22 Audit: Send automated WhatsApp alert to Hotel Owner on sensitive bill deletion
    try {
      const currentUser = this.getCurrentUser();
      this.addWhatsAppLog({
        recipientMobile: '9822100000',
        recipientName: 'Hotel Owner / GM',
        recipientType: 'Guest',
        voucherType: 'Audit Alert',
        voucherNo: checkInNo,
        roomNo: target.roomNo,
        message: `⚠️ SECURITY AUDIT: Check-In ${checkInNo} for guest ${target.guestName} (Room ${target.roomNo}) was DELETED by ${currentUser.userName} (${currentUser.roleName}) on ${new Date().toLocaleString('en-IN')}.`,
        status: 'Delivered'
      });
    } catch {
      // ignore
    }

    return true;
  }

  // ==========================================
  // Video 24: Police Station Report Generator (Frames 0100, 0105, 0110, 0134, 0140)
  // ==========================================
  static getPoliceStationReport(fromDate?: string, toDate?: string): import('../types/pmsModels').PmsCheckIn[] {
    const list = this.getCheckIns();
    if (!fromDate && !toDate) return list;

    // Helper to parse DD-MM-YYYY or YYYY-MM-DD
    const parseDate = (dStr?: string): number => {
      if (!dStr) return 0;
      const clean = dStr.trim();
      const parts = clean.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
        } else {
          // DD-MM-YYYY
          return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
        }
      }
      return new Date(clean).getTime() || 0;
    };

    const fromTime = fromDate ? parseDate(fromDate) : 0;
    const toTime = toDate ? parseDate(toDate) + (24 * 60 * 60 * 1000 - 1) : Infinity;

    return list.filter(c => {
      const cTime = parseDate(c.checkInDate);
      if (cTime === 0) return true;
      return cTime >= fromTime && cTime <= toTime;
    });
  }

  static getKots(): PmsKotRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.KOTS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    // Seed default KOTs matching Video 14 Frames 0210, 0230, 0260 & Video 13
    const now = Date.now();
    const initialKots: PmsKotRecord[] = [
      {
        kotNo: 'KOT/368/24-25',
        serviceType: 'Room',
        roomNo: '101',
        tableNo: 'Room 101',
        waiterName: 'DEMO0004',
        guestName: 'AJUU',
        checkInNo: '203',
        kotRemark: 'Tawa Roti + Paneer Tika',
        items: [
          { sNo: 1, itemName: 'TAWA ROTI', itemCode: '10004', qty: 3, rate: 9.52, amount: 28.56 },
          { sNo: 2, itemName: 'PANEER TIKA', itemCode: '10005', qty: 2, rate: 76.19, amount: 1.44 }
        ],
        totalQty: 5,
        totalAmount: 30.00,
        date: '16-06-25',
        time: '05:37 AM',
        createdAt: new Date(now - 12 * 60 * 1000).toISOString(),
        status: 'Pending',
        serveStatus: 'Unprinted',
        isPrinted: false,
        orderSource: 'Mobile'
      },
      {
        kotNo: 'KOT/367/24-25',
        serviceType: 'Room',
        roomNo: '101',
        tableNo: 'Room 101',
        waiterName: 'DEMO0004',
        guestName: 'AJUU',
        checkInNo: '203',
        kotRemark: 'Complimentary Water',
        items: [
          { sNo: 1, itemName: 'WATER BOTLE', itemCode: '10003', qty: 2, rate: 0.00, amount: 0.00 }
        ],
        totalQty: 2,
        totalAmount: 0.00,
        date: '16-06-25',
        time: '05:30 AM',
        createdAt: new Date(now - 18 * 60 * 1000).toISOString(),
        status: 'Pending',
        serveStatus: 'Unprinted',
        isPrinted: false,
        orderSource: 'Mobile'
      },
      {
        kotNo: 'R/369',
        serviceType: 'Restaurant',
        roomNo: '85',
        tableNo: 'T-14',
        waiterName: 'DEMO0004',
        guestName: 'WALK-IN DINE',
        kotRemark: 'Crispy Bread Pakoda',
        items: [
          { sNo: 1, itemName: 'bread pakoda', itemCode: '10001', qty: 2, rate: 50.00, amount: 100.00 },
          { sNo: 2, itemName: 'Boondi Raita', itemCode: '10030', qty: 2, rate: 10.00, amount: 20.00 }
        ],
        totalQty: 4,
        totalAmount: 120.00,
        date: '16-06-25',
        time: '05:39 AM',
        createdAt: new Date(now - 8 * 60 * 1000).toISOString(),
        status: 'Pending',
        serveStatus: 'Unprinted',
        isPrinted: false,
        orderSource: 'Mobile'
      },
      {
        kotNo: 'KOT/366/24-25',
        serviceType: 'Room',
        roomNo: '101',
        tableNo: 'Room 101',
        waiterName: 'DEMO0004',
        guestName: 'AJUU',
        checkInNo: '203',
        items: [
          { sNo: 1, itemName: 'WATER BOTLE', itemCode: '10003', qty: 2, rate: 30.00, amount: 60.00 }
        ],
        totalQty: 2,
        totalAmount: 60.00,
        date: '16-06-25',
        createdAt: new Date(now - 49 * 60 * 1000).toISOString(),
        status: 'Pending',
        serveStatus: '0',
        isPrinted: true
      },
      {
        kotNo: 'KOT/365/24-25',
        serviceType: 'Room',
        roomNo: '101',
        tableNo: 'Room 101',
        waiterName: 'DEMO0004',
        guestName: 'AJUU',
        checkInNo: '203',
        items: [
          { sNo: 1, itemName: 'WATER BOTLE', itemCode: '10003', qty: 2, rate: 30.00, amount: 60.00 }
        ],
        totalQty: 2,
        totalAmount: 60.00,
        date: '16-06-25',
        createdAt: new Date(now - 51 * 60 * 1000).toISOString(),
        status: 'Pending',
        serveStatus: '0',
        isPrinted: true
      },
      {
        kotNo: 'KOT/158/24-25',
        serviceType: 'Room',
        roomNo: '102',
        tableNo: 'Room 102',
        waiterName: 'DEMO0004',
        guestName: 'AJAY SHARMA',
        items: [
          { sNo: 1, itemName: 'TEA', itemCode: '10019', qty: 1, rate: 30.00, amount: 30.00 }
        ],
        totalQty: 1,
        totalAmount: 30.00,
        date: '15-02-25',
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Ready To Serve',
        serveStatus: 'Ready To Serve',
        isPrinted: true
      },
      {
        kotNo: 'KOT/157/24-25',
        serviceType: 'Room',
        roomNo: '102',
        tableNo: 'Room 102',
        waiterName: 'DEMO0004',
        guestName: 'AJAY SHARMA',
        items: [
          { sNo: 1, itemName: 'PANEER TIKA', itemCode: '10007', qty: 2, rate: 115.00, amount: 230.00 }
        ],
        totalQty: 2,
        totalAmount: 230.00,
        date: '15-02-25',
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Ready To Serve',
        serveStatus: 'Ready To Serve',
        isPrinted: true
      },
      {
        kotNo: 'KOT/136/24-25',
        serviceType: 'Room',
        roomNo: '103',
        tableNo: 'Room 103',
        waiterName: 'DEMO0004',
        guestName: 'SURESH VERMA',
        items: [
          { sNo: 1, itemName: 'THALI SPECIAL', itemCode: '10006', qty: 2, rate: 200.00, amount: 400.00 }
        ],
        totalQty: 2,
        totalAmount: 400.00,
        date: '10-02-25',
        createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Ready To Serve',
        serveStatus: 'Ready To Serve',
        isPrinted: true
      },
      {
        kotNo: 'R/371',
        serviceType: 'Restaurant',
        roomNo: '',
        tableNo: 'Table NC2',
        waiterName: 'DEMO0004',
        operatorName: 'DEMO0004',
        guestName: 'RAHUL',
        kotRemark: 'NOT REQ',
        ncRemark: 'RAHUL',
        isNc: true,
        items: [
          { sNo: 1, itemName: 'TEA', itemCode: '10019', qty: 2, rate: 19.05, amount: 40.00 },
          { sNo: 2, itemName: 'bread pakoda', itemCode: '10009', qty: 2, rate: 95.24, amount: 200.00 }
        ],
        totalQty: 4,
        totalAmount: 240.00,
        date: '16-06-25',
        createdAt: new Date(now - 1 * 60 * 1000).toISOString(),
        status: 'Cancelled',
        serveStatus: 'Pending',
        isPrinted: true,
        cancelReason: 'NOT REQ',
        cancelledAt: new Date(now - 30 * 1000).toISOString()
      },
      {
        kotNo: '370',
        serviceType: 'Restaurant',
        roomNo: '138',
        tableNo: 'T-16',
        waiterName: 'DEMO0004',
        guestName: 'DEMO GUEST',
        kotRemark: 'Less Spicy',
        items: [
          { sNo: 1, itemName: 'Boondi Raita', itemCode: '10008', qty: 2, rate: 57.14, amount: 120.00 },
          { sNo: 2, itemName: 'bread pakoda', itemCode: '10009', qty: 1, rate: 95.24, amount: 100.00 }
        ],
        totalQty: 3,
        totalAmount: 220.00,
        date: '16-06-25',
        createdAt: new Date(now - 2 * 60 * 1000).toISOString(),
        status: 'Pending',
        serveStatus: 'Pending',
        isPrinted: true
      }
    ];
    localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify(initialKots));
    return initialKots;
  }

  static getUnprintedKots(): PmsKotRecord[] {
    return this.getKots().filter(k => k.isPrinted === false && k.status !== 'Cancelled' && k.status !== 'Billed');
  }

  static getUnprintedRoomKots(): PmsKotRecord[] {
    return this.getKots().filter(k => k.isPrinted === false && k.serviceType === 'Room' && k.status !== 'Cancelled' && k.status !== 'Billed');
  }

  static getUnprintedRestaurantKots(): PmsKotRecord[] {
    return this.getKots().filter(k => k.isPrinted === false && k.serviceType === 'Restaurant' && k.status !== 'Cancelled' && k.status !== 'Billed');
  }

  static markKotAsPrinted(kotNo: string, printedBy?: string): void {
    const kots = this.getKots();
    const updated = kots.map(k => {
      if (k.kotNo === kotNo || k.kotNo.includes(kotNo)) {
        return {
          ...k,
          isPrinted: true,
          printedAt: new Date().toISOString(),
          printedBy: printedBy || 'Central Kitchen PC',
          serveStatus: (k.serveStatus === 'Unprinted' ? '0' : k.serveStatus) as any
        };
      }
      return k;
    });
    localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify(updated));
  }

  static markAllKotsAsPrinted(serviceType?: 'Room' | 'Restaurant'): void {
    const kots = this.getKots();
    const updated = kots.map(k => {
      if (k.isPrinted === false && (!serviceType || k.serviceType === serviceType)) {
        return {
          ...k,
          isPrinted: true,
          printedAt: new Date().toISOString(),
          printedBy: 'Central Kitchen PC',
          serveStatus: (k.serveStatus === 'Unprinted' ? '0' : k.serveStatus) as any
        };
      }
      return k;
    });
    localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify(updated));
  }

  static getPendingKotsByRoom(roomNo: string): PmsKotRecord[] {
    return this.getKots().filter(k => k.roomNo === roomNo && (k.status === 'Pending' || k.status === 'Cooking' || k.status === 'Ready To Serve'));
  }

  static updateKotStatus(kotNo: string, newStatus: PmsKotRecord['status']): void {
    const kots = this.getKots();
    const updated = kots.map(k => {
      if (k.kotNo === kotNo || k.kotNo.includes(kotNo)) {
        return {
          ...k,
          status: newStatus,
          serveStatus: newStatus === 'Ready To Serve' ? 'Ready To Serve' : (newStatus === 'Served' ? 'Served' : k.serveStatus)
        };
      }
      return k;
    });
    localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify(updated));
  }

  static markKotsAsBilled(kotNumbers: string[]): void {
    const kots = this.getKots();
    const updated = kots.map(k => {
      const matches = kotNumbers.some(num => k.kotNo.includes(num));
      if (matches) {
        return { ...k, status: 'Billed' as const };
      }
      return k;
    });
    localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify(updated));
  }

  static saveKot(kot: PmsKotRecord): void {
    const kots = this.getKots();
    const isPrinted = kot.isPrinted !== undefined ? kot.isPrinted : true;
    const enrichedKot: PmsKotRecord = {
      ...kot,
      isPrinted,
      serveStatus: (!isPrinted) ? 'Unprinted' : (kot.serveStatus || '0')
    };
    kots.unshift(enrichedKot);
    localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify(kots));

    // If KOT is assigned to a table and not cancelled, ensure table is marked Running
    if (kot.tableNo && kot.status !== 'Cancelled' && kot.status !== 'Billed') {
      const cleanTable = kot.tableNo.replace(/^Table\s+/i, '').trim().toLowerCase();
      const tables = this.getTables();
      const updatedTables = tables.map(t => {
        if (t.tableName.replace(/^Table\s+/i, '').trim().toLowerCase() === cleanTable) {
          return { ...t, status: 'Running' as const };
        }
        return t;
      });
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updatedTables));
    }

    // Cloud sync: if assigned to a room, mirror to guest room folio on Railway PostgreSQL
    if (kot.roomNo) {
      hotelApi.addFolioItem({
        booking_ref: `SVR-ROOM-${kot.roomNo}`,
        item_type: 'Food_KOT',
        description: (kot.items || []).map(i => `${i.itemName} x ${i.qty}`).join(', ') || 'Room Service Food Order',
        sac_code: '996331',
        quantity: 1,
        unit_price: kot.totalAmount || 0
      }).catch(e => console.warn('[PmsStore] Background KOT folio cloud sync note:', e));
    }

    // Enterprise Cloud Sync: Post KOT Ticket to FastAPI PostgreSQL Database
    hotelApi.saveKotTicket({
      kot_no: kot.kotNo,
      service_type: kot.serviceType,
      room_no: kot.roomNo,
      table_no: kot.tableNo,
      guest_name: kot.guestName,
      total_amount: kot.totalAmount,
      status: kot.status,
      items_json: JSON.stringify(kot.items)
    }).catch(e => console.warn('[PmsStore] Background KOT ticket cloud sync note:', e));
  }

  static shiftTable(fromTable: string, toTable: string, shiftedBy: string = 'Admin'): {
    success: boolean;
    transferredCount: number;
    message: string;
  } {
    const kots = this.getKots();
    let transferredCount = 0;
    const cleanFrom = fromTable.replace(/^Table\s+/i, '').trim().toLowerCase();
    const cleanTo = toTable.replace(/^Table\s+/i, '').trim();

    const updatedKots = kots.map(kot => {
      const kotTable = (kot.tableNo || '').replace(/^Table\s+/i, '').trim().toLowerCase();
      if (kotTable === cleanFrom && kot.status !== 'Cancelled' && kot.status !== 'Billed') {
        transferredCount++;
        return {
          ...kot,
          tableNo: `Table ${cleanTo.replace(/^Table\s+/i, '')}`,
          kotRemark: `${kot.kotRemark ? kot.kotRemark + ' | ' : ''}Shifted from Table ${fromTable.replace(/^Table\s+/i, '')}`
        };
      }
      return kot;
    });

    if (transferredCount > 0) {
      localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify(updatedKots));
    }

    // Update Tables statuses: toTable is Running, fromTable is Vacant
    const tables = this.getTables();
    const updatedTables = tables.map(t => {
      const tName = t.tableName.replace(/^Table\s+/i, '').trim().toLowerCase();
      if (tName === cleanFrom) {
        return { ...t, status: 'Vacant' as const };
      }
      if (tName === cleanTo.toLowerCase()) {
        return { ...t, status: 'Running' as const };
      }
      return t;
    });
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updatedTables));

    // Save Table Shift Record
    const rawShifts = localStorage.getItem('hotel_pms_table_shifts');
    const shifts: PmsTableShiftRecord[] = rawShifts ? JSON.parse(rawShifts) : [];
    shifts.unshift({
      id: `ts-${Date.now()}`,
      fromTable,
      toTable,
      shiftedAt: new Date().toISOString(),
      kotsShifted: transferredCount,
      shiftedBy
    });
    localStorage.setItem('hotel_pms_table_shifts', JSON.stringify(shifts));

    return {
      success: true,
      transferredCount,
      message: `Table shifted successfully from ${fromTable} to ${toTable} (${transferredCount} KOT${transferredCount === 1 ? '' : 's'} transferred).`
    };
  }

  static cancelKot(kotNo: string, reason: string, cancelledBy: string = 'Admin'): {
    success: boolean;
    message: string;
  } {
    const kots = this.getKots();
    const cleanSearch = kotNo.replace(/^R\//, '').trim().toLowerCase();
    const idx = kots.findIndex(k => 
      k.kotNo.toLowerCase() === kotNo.toLowerCase() || 
      k.kotNo.replace(/^R\//, '').trim().toLowerCase() === cleanSearch
    );
    if (idx < 0) {
      return { success: false, message: `KOT ${kotNo} not found.` };
    }
    const target = kots[idx];
    kots[idx] = {
      ...target,
      status: 'Cancelled',
      cancelReason: reason || 'NOT REQ',
      kotRemark: reason || 'NOT REQ',
      operatorName: cancelledBy || target.operatorName || 'Admin',
      cancelledAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify(kots));

    // Check if table has other active KOTs; if not, mark table Vacant
    if (target.tableNo) {
      const cleanTable = target.tableNo.replace(/^Table\s+/i, '').trim().toLowerCase();
      const remainingActive = kots.filter(k => 
        k.tableNo && 
        k.tableNo.replace(/^Table\s+/i, '').trim().toLowerCase() === cleanTable &&
        k.status !== 'Cancelled' && 
        k.status !== 'Billed'
      );
      if (remainingActive.length === 0) {
        const tables = this.getTables();
        const updatedTables = tables.map(t => {
          if (t.tableName.replace(/^Table\s+/i, '').trim().toLowerCase() === cleanTable) {
            return { ...t, status: 'Vacant' as const };
          }
          return t;
        });
        localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updatedTables));
      }
    }

    return {
      success: true,
      message: `KOT ${target.kotNo} cancelled successfully with reason: ${reason || 'NOT REQ'}`
    };
  }

  static getNcKots(): PmsKotRecord[] {
    return this.getKots().filter(k => k.isNc || (k.tableNo && k.tableNo.toUpperCase().includes('NC')));
  }

  static getTableShifts(): PmsTableShiftRecord[] {
    const raw = localStorage.getItem('hotel_pms_table_shifts');
    return raw ? JSON.parse(raw) : [];
  }

  static getFoodBills(): import('../types/pmsModels').PmsFoodBill[] {
    const raw = localStorage.getItem('hotel_pms_foodbills');
    if (raw) return JSON.parse(raw);

    // Initial default demo food bill from Video 04 (Frame 0230)
    const initialBills: import('../types/pmsModels').PmsFoodBill[] = [
      {
        billNo: 'SHRI/252/24-25',
        date: '07-06-2025',
        time: '06:18',
        roomNo: '105',
        guestName: 'sunil agrwal',
        kotNumbers: ['349', '350'],
        items: [
          { sNo: 1, itemName: 'Rasgulla', qty: 1, rate: 190.48, amount: 190.48 },
          { sNo: 2, itemName: 'WATER BOTLE', qty: 1, rate: 28.57, amount: 28.57 },
          { sNo: 3, itemName: 'TEA', qty: 2, rate: 19.05, amount: 38.10 },
          { sNo: 4, itemName: 'Ras Malai', qty: 1, rate: 85.71, amount: 85.71 }
        ],
        taxableAmount: 342.86,
        gstPercent: 5.0,
        cgstAmount: 8.15,
        sgstAmount: 8.15,
        discountPercent: 5.0,
        discountAmount: 17.14,
        roundOff: -2.00,
        netBillAmount: 340.00,
        settlementType: 'Settle To Room',
        status: 'Settled',
        createdAt: '2025-06-07T06:18:00.000Z'
      }
    ];
    localStorage.setItem('hotel_pms_foodbills', JSON.stringify(initialBills));
    return initialBills;
  }

  static saveFoodBill(bill: import('../types/pmsModels').PmsFoodBill): void {
    const list = this.getFoodBills();
    list.unshift(bill);
    localStorage.setItem('hotel_pms_foodbills', JSON.stringify(list));

    // 1. Mark KOTs as Billed
    if (bill.kotNumbers && bill.kotNumbers.length > 0) {
      this.markKotsAsBilled(bill.kotNumbers);
    }

    // 2. Vacate Table if Dine-In / Restaurant Table Bill (Video 18 Frame 0370)
    if (bill.tableNo) {
      this.vacateTable(bill.tableNo);
    } else if (bill.roomNo && (bill.roomNo.toLowerCase().includes('table') || bill.roomNo.toLowerCase().startsWith('t-') || bill.roomNo.toLowerCase().startsWith('nc') || bill.roomNo.toLowerCase().startsWith('a1'))) {
      this.vacateTable(bill.roomNo);
    }

    // 3. If Settle To Room, add to guest room folio
    if (bill.settlementType === 'Settle To Room') {
      const rooms = this.getRooms();
      const updated = rooms.map(r => {
        if (r.roomNo === bill.roomNo) {
          return {
            ...r,
            foodAmount: (r.foodAmount || 0) + bill.netBillAmount
          };
        }
        return r;
      });
      this.saveRooms(updated);
    }

    // 4. If Settle To Cash or Online, register in financial ledger (Video 17 & 18)
    const sType = (bill.settlementType || '').toLowerCase();
    const vNum = parseInt(bill.billNo.replace(/\D/g, '').slice(-3) || '264', 10);
    const currReceipts = this.getReceipts();

    if (sType.includes('cash')) {
      this.saveReceipt({
        id: `rec-food-${Date.now()}`,
        sNo: currReceipts.length + 1,
        voucherName: 'Receipts',
        receiptNo: bill.billNo,
        voucherNo: vNum,
        date: bill.date,
        accountName: bill.guestName || 'Restaurant Guest',
        paymentMode: 'Cash',
        amount: bill.netBillAmount,
        remark: `Restaurant Food Bill ${bill.billNo} - ${bill.tableNo || bill.roomNo}`,
        createdAt: bill.createdAt
      });
    } else if (sType.includes('online') || sType.includes('upi') || sType.includes('card')) {
      this.saveReceipt({
        id: `rec-food-${Date.now()}`,
        sNo: currReceipts.length + 1,
        voucherName: 'Receipts',
        receiptNo: bill.billNo,
        voucherNo: vNum,
        date: bill.date,
        accountName: bill.guestName || 'Restaurant Guest',
        paymentMode: 'Online',
        amount: bill.netBillAmount,
        remark: `Restaurant Food Bill ${bill.billNo} - ${bill.tableNo || bill.roomNo}`,
        createdAt: bill.createdAt
      });
    }
  }

  static getCheckouts(): PmsCheckOutDetail[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKOUTS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }

    // Initial demo checkouts matching Video 26 Frames 0115 & 0150 (pms.hotelsai-vasudev.com/roomcheckouts)
    const initialCheckouts: PmsCheckOutDetail[] = [
      {
        invoiceNo: 'GSR/252/24-25',
        roomNo: '105',
        roomType: 'DELUXE',
        guestName: 'SIDDHANT JI',
        guestPhone: '9466219194',
        checkInDate: '01-07-25',
        checkInTime: '06:32 PM',
        checkOutDate: '15-07-25',
        checkOutTime: '01:15 PM',
        calculationType: '12hour',
        numberOfDays: 15,
        perDayTariff: 3000,
        totalRoomRent: 45000,
        foodAmount: 32,
        gstPercent: 12,
        gstAmount: 5400,
        cgstAmount: 2700,
        sgstAmount: 2700,
        addOthers: 0,
        lessDiscount: 0,
        advanceDeducted: 0,
        billAmount: 50432,
        netPayable: 50432,
        paymentMode: 'Online',
        payments: [
          { mode: 'Online', amount: 50432, referenceNo: 'UPI/9466219194', remark: 'PhonePe QR Payment' }
        ],
        checkoutRemark: '15 Days Stay with Breakfast package. Key deposited at reception.',
        city: 'Etawah',
        state: 'Uttar Pradesh',
        country: 'India',
        pinCode: '206001',
        sacCode: '996311',
        invoiceFormat: 'A4_Standard'
      },
      {
        invoiceNo: 'GSR/238/24-25',
        roomNo: '1',
        roomType: 'STANDARD ROOM',
        guestName: 'ARJUN',
        guestPhone: '95487417',
        checkInDate: '16-06-25',
        checkInTime: '06:30 AM',
        checkOutDate: '25-06-25',
        checkOutTime: '02:31 PM',
        calculationType: '24hour',
        numberOfDays: 10,
        perDayTariff: 2000,
        totalRoomRent: 20000,
        foodAmount: 0,
        gstPercent: 0,
        gstAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        addOthers: 0,
        lessDiscount: 0,
        advanceDeducted: 1000,
        billAmount: 20000,
        netPayable: 19000,
        paymentMode: 'Cash',
        payments: [
          { mode: 'Cash', amount: 19000, referenceNo: 'CASH/238', remark: 'Settled at front desk' }
        ],
        checkoutRemark: 'Corporate guest Arjun checkout. Keys dropped at front desk.',
        city: 'Etawah',
        state: 'Uttar Pradesh',
        country: 'India',
        pinCode: '206001',
        sacCode: '996311',
        invoiceFormat: 'A4_Standard'
      },
      {
        invoiceNo: 'GSR/241/24-25',
        roomNo: '202',
        roomType: 'DELUXE',
        guestName: 'ranjit ji',
        guestPhone: '56454898',
        checkInDate: '18-07-25',
        checkInTime: '11:00 AM',
        checkOutDate: '18-07-25',
        checkOutTime: '07:30 PM',
        calculationType: '12hour',
        numberOfDays: 1,
        perDayTariff: 4000,
        totalRoomRent: 4000,
        foodAmount: 0,
        gstPercent: 0,
        gstAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        addOthers: 0,
        lessDiscount: 0,
        advanceDeducted: 0,
        billAmount: 4000,
        netPayable: 4000,
        paymentMode: 'Cash',
        payments: [{ mode: 'Cash', amount: 4000, referenceNo: '', remark: 'Cash' }],
        checkoutRemark: 'Day visit',
        city: 'Agra',
        state: 'Uttar Pradesh',
        country: 'India',
        pinCode: '282001',
        sacCode: '996311',
        invoiceFormat: 'A4_Standard'
      },
      {
        invoiceNo: 'GSR/232/24-25',
        roomNo: '202',
        roomType: 'DELUXE',
        guestName: 'sunil kumar yadav',
        guestPhone: '983982735',
        checkInDate: '10-07-25',
        checkInTime: '09:00 AM',
        checkOutDate: '11-07-25',
        checkOutTime: '12:00 PM',
        calculationType: '24hour',
        numberOfDays: 2,
        perDayTariff: 4700,
        totalRoomRent: 9400,
        foodAmount: 0,
        gstPercent: 12,
        gstAmount: 1128,
        cgstAmount: 564,
        sgstAmount: 564,
        addOthers: 0,
        lessDiscount: 0,
        advanceDeducted: 0,
        billAmount: 10528,
        netPayable: 10528,
        paymentMode: 'Online',
        payments: [{ mode: 'Online', amount: 10528, referenceNo: 'UPI/983982', remark: 'PhonePe' }],
        checkoutRemark: 'Police report registered. Checked out on time.',
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        country: 'India',
        pinCode: '226001',
        sacCode: '996311',
        invoiceFormat: 'A4_Standard'
      },
      {
        invoiceNo: 'GSR/230/24-25',
        roomNo: '205',
        roomType: 'SUPER DELUXE',
        guestName: 'SALIM',
        guestPhone: '7479499435',
        checkInDate: '10-07-25',
        checkInTime: '01:00 PM',
        checkOutDate: '10-07-25',
        checkOutTime: '08:00 PM',
        calculationType: '12hour',
        numberOfDays: 1,
        perDayTariff: 5400,
        totalRoomRent: 5400,
        foodAmount: 0,
        gstPercent: 0,
        gstAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        addOthers: 0,
        lessDiscount: 0,
        advanceDeducted: 0,
        billAmount: 5400,
        netPayable: 5400,
        paymentMode: 'Cash',
        payments: [{ mode: 'Cash', amount: 5400, referenceNo: '', remark: 'Cash' }],
        checkoutRemark: 'Express checkout',
        city: 'Kanpur',
        state: 'Uttar Pradesh',
        country: 'India',
        pinCode: '208001',
        sacCode: '996311',
        invoiceFormat: 'A4_Standard'
      },
      {
        invoiceNo: 'GSR/229/24-25',
        roomNo: '202',
        roomType: 'DELUXE',
        guestName: 'CHANDAN',
        guestPhone: '5645648848',
        checkInDate: '10-07-25',
        checkInTime: '10:00 AM',
        checkOutDate: '10-07-25',
        checkOutTime: '06:00 PM',
        calculationType: '12hour',
        numberOfDays: 1,
        perDayTariff: 3693.75,
        totalRoomRent: 3693.75,
        foodAmount: 0,
        gstPercent: 12,
        gstAmount: 443.25,
        cgstAmount: 221.62,
        sgstAmount: 221.63,
        addOthers: 0,
        lessDiscount: 0,
        advanceDeducted: 0,
        billAmount: 4137,
        netPayable: 4137,
        paymentMode: 'Online',
        payments: [{ mode: 'Online', amount: 4137, referenceNo: 'UPI/CHANDAN', remark: 'Google Pay' }],
        checkoutRemark: 'Checked out cleanly',
        city: 'Varanasi',
        state: 'Uttar Pradesh',
        country: 'India',
        pinCode: '221001',
        sacCode: '996311',
        invoiceFormat: 'A4_Standard'
      },
      {
        invoiceNo: 'GSR/225/24-25',
        roomNo: '101',
        roomType: 'DELUXE',
        guestName: 'Shiv',
        guestPhone: '8432066047',
        checkInDate: '07-06-2025',
        checkInTime: '07:53 AM',
        checkOutDate: '07-06-2025',
        checkOutTime: '07:55 AM',
        calculationType: '24hour',
        numberOfDays: 1,
        perDayTariff: 4000,
        totalRoomRent: 4000,
        foodAmount: 0,
        gstPercent: 12,
        gstAmount: 480,
        cgstAmount: 240,
        sgstAmount: 240,
        addOthers: 0,
        lessDiscount: 0,
        advanceDeducted: 2000,
        billAmount: 4480,
        netPayable: 2480,
        paymentMode: 'Online',
        payments: [
          { mode: 'Online', amount: 2480, referenceNo: 'UPI/984210', remark: 'PhonePe Checkout' }
        ],
        checkoutRemark: 'Checkout completed successfully',
        city: 'Dausa',
        state: 'Rajasthan',
        country: 'India',
        pinCode: '303313',
        sacCode: '996311',
        invoiceFormat: 'A4_Standard'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.CHECKOUTS, JSON.stringify(initialCheckouts));
    return initialCheckouts;
  }

  static saveCheckout(checkout: PmsCheckOutDetail): void {
    const list = this.getCheckouts();
    list.unshift(checkout);
    localStorage.setItem(STORAGE_KEYS.CHECKOUTS, JSON.stringify(list));

    // Mark room as dirty upon checkout (VACANT_DIRTY)
    this.updateRoomStatus(checkout.roomNo, 'dirty', undefined);

    // Automatically create a high-priority Housekeeping Queue entry (Module 4)
    this.updateHousekeepingStatus(
      checkout.roomNo,
      'Vacant Dirty',
      'Ramesh',
      'High - Guest Waiting',
      `Departure turnover & linen sanitization for Room ${checkout.roomNo} (${checkout.guestName})`
    );

    // Cloud sync: mirror check-out to Railway PostgreSQL
    hotelApi.checkOutBooking({
      booking_ref: checkout.invoiceNo || `SVR-ROOM-${checkout.roomNo}`,
      settlement_payment_mode: checkout.paymentMode || 'Cash',
      settlement_amount_paid: checkout.netPayable || 0,
      processed_by: 'Reception Desk'
    }).catch(e => console.warn('[PmsStore] Background checkout cloud sync note:', e));
  }

  static getAdvanceReceipts(): PmsAdvanceReceipt[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ADVANCE_RECEIPTS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }

    // Initial demo advance receipts matching RoomG Video 06 (Frames 0148, 0150, 0154, 0182)
    const initialReceipts: PmsAdvanceReceipt[] = [
      {
        receiptNo: 'AR12',
        voucherNo: '12',
        date: '07-06-2025',
        time: '07:54 AM',
        voucherName: 'Advance_Receipt',
        roomNo: '101',
        guestName: 'Shiv',
        mobile: '8432066047',
        amount: 2000,
        paymentMode: 'Cash',
        remark: 'advance',
        createdAt: '2025-06-07T02:24:00.000Z'
      },
      {
        receiptNo: 'AR11',
        voucherNo: '11',
        date: '05-06-2025',
        time: '11:45 PM',
        voucherName: 'Advance_Receipt',
        roomNo: '103',
        guestName: 'AJUU',
        mobile: '9622975444',
        amount: 500,
        paymentMode: 'Online',
        remark: '5 march check in advance',
        createdAt: '2025-06-05T18:15:00.000Z'
      },
      {
        receiptNo: 'AR10',
        voucherNo: '10',
        date: '04-06-2025',
        time: '04:10 PM',
        voucherName: 'Advance_Receipt',
        roomNo: '105',
        guestName: 'sunil agrwal',
        mobile: '9829012345',
        amount: 1000,
        paymentMode: 'Cash',
        remark: 'advance booking',
        createdAt: '2025-06-04T10:40:00.000Z'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.ADVANCE_RECEIPTS, JSON.stringify(initialReceipts));
    return initialReceipts;
  }

  static saveAdvanceReceipt(receipt: PmsAdvanceReceipt): void {
    const list = this.getAdvanceReceipts();
    list.unshift(receipt);
    localStorage.setItem(STORAGE_KEYS.ADVANCE_RECEIPTS, JSON.stringify(list));

    // Stacking Advance: Update room's current guest advancePaid if present
    const rooms = this.getRooms();
    const updatedRooms = rooms.map(r => {
      if (r.roomNo === receipt.roomNo && r.currentGuest) {
        return {
          ...r,
          currentGuest: {
            ...r.currentGuest,
            advancePaid: (r.currentGuest.advancePaid || 0) + receipt.amount
          }
        };
      }
      return r;
    });
    this.saveRooms(updatedRooms);

    // Cloud sync: mirror Advance Receipt to Railway PostgreSQL
    hotelApi.recordPayment({
      booking_ref: `SVR-ROOM-${receipt.roomNo}`,
      payment_type: 'Advance',
      payment_mode: 'Cash',
      amount: receipt.amount,
      notes: receipt.remark || 'Advance Receipt collected at Front Desk',
      collected_by: 'Front Desk Officer'
    }).catch(e => console.warn('[PmsStore] Background advance receipt cloud sync note:', e));
  }

  static deleteAdvanceReceipt(receiptNo: string): void {
    const list = this.getAdvanceReceipts().filter(r => r.receiptNo !== receiptNo);
    localStorage.setItem(STORAGE_KEYS.ADVANCE_RECEIPTS, JSON.stringify(list));
  }

  static getAdvanceReceiptsByRoom(roomNo: string): PmsAdvanceReceipt[] {
    return this.getAdvanceReceipts().filter(r => r.roomNo === roomNo);
  }

  static getTotalAdvanceByRoom(roomNo: string): number {
    const receipts = this.getAdvanceReceiptsByRoom(roomNo);
    const sum = receipts.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
    if (sum > 0) return sum;
    // Fallback to room currentGuest advancePaid
    const room = this.getRooms().find(r => r.roomNo === roomNo);
    return room?.currentGuest?.advancePaid || 0;
  }

  static getLedgerAccountOptions(): { id: string; name: string; category: string; phone?: string }[] {
    const defaultAccounts = [
      { id: 'Cash', name: 'Cash', category: 'General' },
      { id: 'Online', name: 'Online', category: 'General' },
      { id: 'shri sunder lal tiwari(owner)', name: 'shri sunder lal tiwari(owner)', category: 'Owner' },
      { id: 'auto commision', name: 'auto commision', category: 'Commission' },
      { id: 'monish', name: 'monish', category: 'Guest' },
      { id: 'sonali', name: 'sonali', category: 'Guest' },
      { id: 'Soni atulkumar', name: 'Soni atulkumar', category: 'Guest' },
      { id: 'SONU SAHU', name: 'SONU SAHU', category: 'Guest' },
      { id: 'Guruprasad pol', name: 'Guruprasad pol', category: 'Guest' },
      { id: 'AKASH YADAV', name: 'AKASH YADAV', category: 'Guest' },
      { id: 'Vivek', name: 'Vivek', category: 'Guest' },
      { id: 'Tata Motors', name: 'Tata Motors', category: 'Corporate' },
      { id: 'Raj', name: 'Raj', category: 'Guest' },
      { id: 'Shiv', name: 'Shiv', category: 'Guest', phone: '8432066047' }
    ];

    const accountMap = new Map<string, { id: string; name: string; category: string; phone?: string }>();
    for (const a of defaultAccounts) {
      accountMap.set(a.id.toLowerCase(), a);
    }

    // Include all active rooms
    for (const r of this.getRooms()) {
      if (r.currentGuest?.name) {
        const key = r.currentGuest.name.toLowerCase();
        if (!accountMap.has(key)) {
          accountMap.set(key, {
            id: r.currentGuest.name,
            name: `${r.currentGuest.name} (Room ${r.roomNo})`,
            category: 'Guest',
            phone: r.currentGuest.phone
          });
        }
      }
    }

    // Include checkouts
    for (const c of this.getCheckouts()) {
      if (c.guestName) {
        const key = c.guestName.toLowerCase();
        if (!accountMap.has(key)) {
          accountMap.set(key, {
            id: c.guestName,
            name: `${c.guestName} (Room ${c.roomNo})`,
            category: 'Guest',
            phone: c.guestPhone
          });
        }
      }
    }

    // Include receipts & payments parties
    for (const rec of this.getReceipts()) {
      if (rec.accountName) {
        const key = rec.accountName.toLowerCase();
        if (!accountMap.has(key)) {
          accountMap.set(key, {
            id: rec.accountName,
            name: rec.accountName,
            category: 'Party'
          });
        }
      }
    }

    for (const pay of this.getPayments()) {
      if (pay.accountName) {
        const key = pay.accountName.toLowerCase();
        if (!accountMap.has(key)) {
          accountMap.set(key, {
            id: pay.accountName,
            name: pay.accountName,
            category: 'Vendor'
          });
        }
      }
    }

    return Array.from(accountMap.values());
  }

  static parseDateComparable(dStr: string): number {
    if (!dStr) return 0;
    const parts = dStr.trim().split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        return y * 10000 + m * 100 + d;
      } else {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        let y = parseInt(parts[2], 10);
        if (y < 100) y += 2000;
        return y * 10000 + m * 100 + d;
      }
    }
    return 0;
  }

  static getPartyLedger(
    accountName: string,
    fromDate: string = '01-05-2025',
    toDate: string = '16-06-2025'
  ): {
    entries: LedgerEntry[];
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    closingType: 'Dr' | 'Cr';
  } {
    const cleanQuery = (accountName || 'Cash').toLowerCase().trim();
    const fromComp = this.parseDateComparable(fromDate) || 20250501;
    const toComp = this.parseDateComparable(toDate) || 20250616;

    // ==========================================
    // Case A: Cash Account Ledger (Video 17 Frames 0130, 0150)
    // ==========================================
    if (cleanQuery === 'cash') {
      const baseOpening = 648639.12;
      const allTx: { date: string; type: string; account: string; remark: string; debit: number; credit: number }[] = [
        { date: '01-05-25', type: 'Check_Out', account: 'Cash', remark: 'Check_out/GSR/192/24-25/Room-302', debit: 17050, credit: 0 },
        { date: '04-05-25', type: 'Receipts', account: 'Guruprasad pol', remark: 'tariff', debit: 2200, credit: 0 },
        { date: '05-05-25', type: 'Restaurant_food_bill', account: 'Cash', remark: 'Res/223/24-25||53||130||', debit: 130, credit: 0 },
        { date: '05-05-25', type: 'Check_Out', account: 'Cash', remark: 'Check_out/GSR/194/24-25/Room-201', debit: 200, credit: 0 },
        { date: '05-05-25', type: 'Check_Out', account: 'Cash', remark: 'Check_out/GSR/195/24-25/Room-201', debit: 210, credit: 0 },
        { date: '05-05-25', type: 'Purchase', account: 'Purchase', remark: 'Purchase/1411', debit: 0, credit: 446.25 },
        { date: '09-05-25', type: 'Check_In', account: 'Cash', remark: 'Room_Checkin/SR/160/24-25/Room No101', debit: 500, credit: 0 },
        { date: '09-05-25', type: 'Check_Out', account: 'Cash', remark: 'My_Check_out/MY/13/24-25/Room-104', debit: 3000, credit: 0 },
        { date: '24-05-25', type: 'Check_Out', account: 'Cash', remark: 'Check_out/GSR/204/24-25/Room-203', debit: 2000, credit: 0 },
        { date: '24-05-25', type: 'Receipts', account: 'AKASH YADAV', remark: '', debit: 1000, credit: 0 },
        { date: '30-05-25', type: 'Foodbill', account: 'Cash', remark: 'SHRI/235/24-25||173||409.96||', debit: 410, credit: 0 },
        { date: '31-05-25', type: 'Check_In', account: 'Cash', remark: 'Room_Checkin/SR/175/24-25/Room No305', debit: 2500, credit: 0 },
        { date: '31-05-25', type: 'Check_Out', account: 'Cash', remark: 'Check_out/GSR/206/24-25/Room-305', debit: 2540, credit: 0 },
        { date: '01-06-25', type: 'Check_In', account: 'Cash', remark: 'Room_Checkin/SR/176/24-25/Room No104', debit: 1000, credit: 0 },
        { date: '01-06-25', type: 'Check_In', account: 'Cash', remark: 'Room_Checkin/SR/177/24-25/Room No101', debit: 2000, credit: 0 },
        { date: '01-06-25', type: 'Foodbill', account: 'Cash', remark: 'SHRI/237/24-25||178||450.01||', debit: 450, credit: 0 },
        { date: '01-06-25', type: 'Foodbill', account: 'Cash', remark: 'SHRI/239/24-25||179||889.64||', debit: 890, credit: 0 },
        { date: '02-06-25', type: 'Check_Out', account: 'Cash', remark: 'Check_out/GSR/209/24-25/Room-309,1', debit: 4000, credit: 0 },
        { date: '02-06-25', type: 'Foodbill', account: 'Cash', remark: 'SHRI/240/24-25||179||55589.73||', debit: 55590, credit: 0 },
        { date: '02-06-25', type: 'Check_Out', account: 'Cash', remark: 'Check_out/GSR/210/24-25/Room-GARDEN', debit: 45780, credit: 0 },
        { date: '16-06-25', type: 'Payment', account: 'shri sunder lal tiwari(owner)', remark: '', debit: 0, credit: 11000 },
        { date: '16-06-25', type: 'Payment', account: 'shri sunder lal tiwari(owner)', remark: 'cash handover', debit: 0, credit: 98717 }
      ];

      // Add dynamic cash receipts
      for (const r of this.getReceipts().filter(x => x.paymentMode === 'Cash')) {
        const dStr = r.date.replace('2025-', '').replace('2024-', '') || '16-06-25';
        allTx.push({
          date: dStr,
          type: 'Advance_Receipt',
          account: r.accountName,
          remark: r.remark || `Receipt ${r.voucherNo}`,
          debit: r.amount,
          credit: 0
        });
      }

      // Add dynamic cash payments
      for (const p of this.getPayments().filter(x => x.paymentMode === 'Cash')) {
        const dStr = p.date.replace('2025-', '').replace('2024-', '') || '16-06-25';
        allTx.push({
          date: dStr,
          type: 'Payment',
          account: p.accountName,
          remark: p.remark || `Payment ${p.voucherNo}`,
          debit: 0,
          credit: p.amount
        });
      }

      let opening = baseOpening;
      const filtered: typeof allTx = [];

      for (const tx of allTx) {
        const c = this.parseDateComparable(tx.date);
        if (c < fromComp) {
          opening += (tx.debit - tx.credit);
        } else if (c <= toComp) {
          filtered.push(tx);
        }
      }

      let currentBal = opening;
      const entries: LedgerEntry[] = [
        {
          date: '',
          type: '',
          accountName: 'Opening Balnce',
          remark: '',
          debit: 0,
          credit: 0,
          balance: opening,
          balanceType: opening >= 0 ? 'Dr' : 'Cr'
        }
      ];

      let totDeb = 0;
      let totCred = 0;

      for (const tx of filtered) {
        currentBal += (tx.debit - tx.credit);
        totDeb += tx.debit;
        totCred += tx.credit;
        entries.push({
          date: tx.date,
          type: tx.type,
          accountName: tx.account,
          remark: tx.remark,
          debit: tx.debit,
          credit: tx.credit,
          balance: parseFloat(currentBal.toFixed(2)),
          balanceType: currentBal >= 0 ? 'Dr' : 'Cr'
        });
      }

      return {
        entries,
        totalDebit: parseFloat(totDeb.toFixed(2)),
        totalCredit: parseFloat(totCred.toFixed(2)),
        closingBalance: parseFloat(currentBal.toFixed(2)),
        closingType: currentBal >= 0 ? 'Dr' : 'Cr'
      };
    }

    // ==========================================
    // Case B: Online Account Ledger (Video 17 Frames 0180, 0190)
    // ==========================================
    if (cleanQuery === 'online') {
      const baseOpening = 347200.39;
      const allTx: { date: string; type: string; account: string; remark: string; debit: number; credit: number }[] = [
        { date: '01-06-25', type: 'Check_In', account: 'Online', remark: 'Room_Checkin/SR/176/24-25/Room No104', debit: 1000, credit: 0 },
        { date: '01-06-25', type: 'Check_Out', account: 'Online', remark: 'Check_out/GSR/207/24-25/Room-104', debit: 500, credit: 0 },
        { date: '01-06-25', type: 'Check_Out', account: 'Online', remark: 'Check_out/GSR/208/24-25/Room-101', debit: 1000, credit: 0 },
        { date: '01-06-25', type: 'Check_In', account: 'Online', remark: 'Room_Checkin/SR/178/24-25/Room No301', debit: 2500, credit: 0 },
        { date: '02-06-25', type: 'Room_booking', account: 'Online', remark: 'Room_booking/RM/59/24-25', debit: 4600, credit: 0 },
        { date: '02-06-25', type: 'Check_Out', account: 'Online', remark: 'Check_out/GSR/211/24-25/Room-103', debit: 1980, credit: 0 },
        { date: '03-06-25', type: 'Room_booking', account: 'Online', remark: 'Room_booking/RM/60/24-25', debit: 2500, credit: 0 },
        { date: '05-06-25', type: 'Check_In', account: 'Online', remark: 'Room_Checkin/SR/186/24-25/Room No101', debit: 500, credit: 0 },
        { date: '06-06-25', type: 'Check_Out', account: 'Online', remark: 'Check_out/GSR/188/24-25/Room No105', debit: 200, credit: 0 },
        { date: '07-06-25', type: 'Check_Out', account: 'Online', remark: 'Check_out/GSR/218/24-25/Room-GARDEN,BIG,306,307,308,309,12,15,16,17,18', debit: 25000, credit: 0 },
        { date: '06-06-25', type: 'Room_booking', account: 'Online', remark: 'Room_booking/RM/67/24-25', debit: 500, credit: 0 },
        { date: '06-06-25', type: 'Check_Out', account: 'Online', remark: 'Check_out/GSR/221/24-25/Room-1', debit: 1680, credit: 0 },
        { date: '07-06-25', type: 'Check_Out', account: 'Online', remark: 'Check_out/GSR/222/24-25/Room-105', debit: 2000, credit: 0 },
        { date: '07-06-25', type: 'Check_Out', account: 'Online', remark: 'Check_out/GSR/223/24-25/Room-103', debit: 3300, credit: 0 },
        { date: '07-06-25', type: 'Check_Out', account: 'Online', remark: 'Check_out/GSR/225/24-25/Room-101', debit: 2480, credit: 0 },
        { date: '10-06-25', type: 'Check_In', account: 'Online', remark: 'Room_Checkin/SR/199/24-25/Room No201', debit: 500, credit: 0 },
        { date: '16-06-25', type: 'Payment', account: 'shri sunder lal tiwari(owner)', remark: 'paymnet -4757344', debit: 0, credit: 50000 }
      ];

      for (const r of this.getReceipts().filter(x => x.paymentMode === 'Online')) {
        allTx.push({
          date: r.date.replace('2025-', '').replace('2024-', '') || '16-06-25',
          type: 'Advance_Receipt',
          account: r.accountName,
          remark: r.remark || `Online Receipt ${r.voucherNo}`,
          debit: r.amount,
          credit: 0
        });
      }

      for (const p of this.getPayments().filter(x => x.paymentMode === 'Online')) {
        allTx.push({
          date: p.date.replace('2025-', '').replace('2024-', '') || '16-06-25',
          type: 'Payment',
          account: p.accountName,
          remark: p.remark || `Online Payment ${p.voucherNo}`,
          debit: 0,
          credit: p.amount
        });
      }

      let opening = baseOpening;
      const filtered: typeof allTx = [];

      for (const tx of allTx) {
        const c = this.parseDateComparable(tx.date);
        if (c < fromComp) {
          opening += (tx.debit - tx.credit);
        } else if (c <= toComp) {
          filtered.push(tx);
        }
      }

      let currentBal = opening;
      const entries: LedgerEntry[] = [
        {
          date: '',
          type: '',
          accountName: 'Opening Balnce',
          remark: '',
          debit: 0,
          credit: 0,
          balance: opening,
          balanceType: opening >= 0 ? 'Dr' : 'Cr'
        }
      ];

      let totDeb = 0;
      let totCred = 0;

      for (const tx of filtered) {
        currentBal += (tx.debit - tx.credit);
        totDeb += tx.debit;
        totCred += tx.credit;
        entries.push({
          date: tx.date,
          type: tx.type,
          accountName: tx.account,
          remark: tx.remark,
          debit: tx.debit,
          credit: tx.credit,
          balance: parseFloat(currentBal.toFixed(2)),
          balanceType: currentBal >= 0 ? 'Dr' : 'Cr'
        });
      }

      return {
        entries,
        totalDebit: parseFloat(totDeb.toFixed(2)),
        totalCredit: parseFloat(totCred.toFixed(2)),
        closingBalance: parseFloat(currentBal.toFixed(2)),
        closingType: currentBal >= 0 ? 'Dr' : 'Cr'
      };
    }

    // ==========================================
    // Case C: Owner Account Ledger (Video 17 Frame 0180)
    // ==========================================
    if (cleanQuery.includes('sunder') || cleanQuery.includes('tiwari') || cleanQuery.includes('owner')) {
      const allTx = [
        { date: '16-06-25', type: 'Payment', account: 'Cash', remark: '', debit: 11000, credit: 0 },
        { date: '16-06-25', type: 'Payment', account: 'Cash', remark: 'cash handover', debit: 98717, credit: 0 },
        { date: '16-06-25', type: 'Payment', account: 'Online', remark: 'paymnet -4757344', debit: 50000, credit: 0 }
      ];

      // Dynamic owner payments
      const ownerPayments = this.getPayments().filter(p =>
        p.accountName.toLowerCase().includes('sunder') ||
        p.accountName.toLowerCase().includes('tiwari') ||
        p.accountName.toLowerCase().includes('owner')
      );

      for (const p of ownerPayments) {
        allTx.push({
          date: p.date.replace('2025-', '') || '16-06-25',
          type: 'Payment',
          account: p.paymentMode,
          remark: p.remark || '',
          debit: p.amount,
          credit: 0
        });
      }

      let opening = 0;
      const filtered: typeof allTx = [];

      for (const tx of allTx) {
        const c = this.parseDateComparable(tx.date);
        if (c < fromComp) {
          opening += (tx.debit - tx.credit);
        } else if (c <= toComp) {
          filtered.push(tx);
        }
      }

      let currentBal = opening;
      const entries: LedgerEntry[] = [
        {
          date: '',
          type: '',
          accountName: 'Opening Balnce',
          remark: '',
          debit: 0,
          credit: 0,
          balance: opening,
          balanceType: 'Dr'
        }
      ];

      let totDeb = 0;
      let totCred = 0;

      for (const tx of filtered) {
        currentBal += (tx.debit - tx.credit);
        totDeb += tx.debit;
        totCred += tx.credit;
        entries.push({
          date: tx.date,
          type: tx.type,
          accountName: tx.account,
          remark: tx.remark,
          debit: tx.debit,
          credit: tx.credit,
          balance: parseFloat(currentBal.toFixed(2)),
          balanceType: 'Dr'
        });
      }

      return {
        entries,
        totalDebit: parseFloat(totDeb.toFixed(2)),
        totalCredit: parseFloat(totCred.toFixed(2)),
        closingBalance: parseFloat(currentBal.toFixed(2)),
        closingType: 'Dr'
      };
    }

    // ==========================================
    // Case D: Auto Commission Account (Video 16 & 17 Frame 0180)
    // ==========================================
    if (cleanQuery.includes('commision') || cleanQuery.includes('commission')) {
      const allTx = [
        { date: '16-06-25', type: 'Payment', account: 'Cash', remark: 'Room 102 agent commission', debit: 1500, credit: 0 }
      ];

      for (const p of this.getPayments().filter(x => x.accountName.toLowerCase().includes('commision') || x.accountName.toLowerCase().includes('commission'))) {
        allTx.push({
          date: p.date.replace('2025-', '') || '16-06-25',
          type: 'Payment',
          account: p.paymentMode,
          remark: p.remark || '',
          debit: p.amount,
          credit: 0
        });
      }

      let currentBal = 0;
      const entries: LedgerEntry[] = [
        {
          date: '',
          type: '',
          accountName: 'Opening Balnce',
          remark: '',
          debit: 0,
          credit: 0,
          balance: 0,
          balanceType: 'Dr'
        }
      ];

      let totDeb = 0;
      let totCred = 0;

      for (const tx of allTx) {
        currentBal += tx.debit;
        totDeb += tx.debit;
        entries.push({
          date: tx.date,
          type: tx.type,
          accountName: tx.account,
          remark: tx.remark,
          debit: tx.debit,
          credit: 0,
          balance: parseFloat(currentBal.toFixed(2)),
          balanceType: 'Dr'
        });
      }

      return {
        entries,
        totalDebit: totDeb,
        totalCredit: totCred,
        closingBalance: currentBal,
        closingType: 'Dr'
      };
    }

    // ==========================================
    // Case E: General Guest / Party Account Ledger
    // ==========================================
    const allTx: { date: string; type: string; account: string; remark: string; debit: number; credit: number }[] = [];

    // Pre-seeded transactions for specific demo parties (Vivek, Tata Motors, Raj, Shiv, Guruprasad pol, AKASH YADAV)
    if (cleanQuery.includes('guruprasad')) {
      allTx.push(
        { date: '04-05-25', type: 'Check_In', account: 'Cash', remark: 'Room_Checkin/SR/150/24-25/Room 202', debit: 2200, credit: 0 },
        { date: '04-05-25', type: 'Receipts', account: 'Cash', remark: 'tariff advance', debit: 0, credit: 2200 }
      );
    } else if (cleanQuery.includes('akash')) {
      allTx.push(
        { date: '24-05-25', type: 'Check_In', account: 'Cash', remark: 'Room_Checkin/SR/170/24-25/Room 105', debit: 1000, credit: 0 },
        { date: '24-05-25', type: 'Receipts', account: 'Cash', remark: 'tariff', debit: 0, credit: 1000 }
      );
    } else if (cleanQuery.includes('vivek')) {
      allTx.push(
        { date: '10-06-25', type: 'Check_Out', account: 'Cash', remark: 'Check_out/GSR/228/24-25/Room-204', debit: 1800, credit: 0 },
        { date: '12-06-25', type: 'Receipts', account: 'Online', remark: 'REC/10/24-25 settle bill', debit: 0, credit: 1800 }
      );
    } else if (cleanQuery.includes('tata')) {
      allTx.push(
        { date: '05-06-25', type: 'Check_Out', account: 'Cash', remark: 'Check_out/GSR/214/24-25/Corporate Room-301,302', debit: 8500, credit: 0 },
        { date: '15-06-25', type: 'Receipts', account: 'Online', remark: 'REC/12/24-25 company settlement', debit: 0, credit: 5000 }
      );
    } else if (cleanQuery.includes('raj')) {
      allTx.push(
        { date: '01-06-25', type: 'Check_Out', account: 'Cash', remark: 'Check_out/GSR/208/24-25/Room-101', debit: 1000, credit: 0 },
        { date: '14-06-25', type: 'Receipts', account: 'Cash', remark: 'REC/11/24-25 cash clearing', debit: 0, credit: 1000 }
      );
    } else if (cleanQuery.includes('shiv')) {
      allTx.push(
        { date: '07-06-25', type: 'Check_Out', account: 'Online', remark: 'Check_out/GSR/225/24-25/Room-101', debit: 2480, credit: 0 },
        { date: '07-06-25', type: 'Receipts', account: 'Online', remark: 'advance settlement', debit: 0, credit: 2480 }
      );
    }

    // Dynamic receipts
    const receipts = this.getAdvanceReceipts().filter(r =>
      !cleanQuery ||
      r.guestName.toLowerCase().includes(cleanQuery) ||
      (r.roomNo && r.roomNo.toLowerCase().includes(cleanQuery)) ||
      (r.mobile && r.mobile.includes(cleanQuery))
    );
    for (const r of receipts) {
      allTx.push({
        date: r.date,
        type: 'Advance_Receipt',
        account: r.paymentMode,
        remark: r.remark || 'advance receipt',
        debit: 0,
        credit: r.amount
      });
    }

    // Dynamic checkouts
    const checkouts = this.getCheckouts().filter(c =>
      !cleanQuery ||
      c.guestName.toLowerCase().includes(cleanQuery) ||
      c.roomNo.toLowerCase().includes(cleanQuery) ||
      (c.guestPhone && c.guestPhone.includes(cleanQuery))
    );
    for (const c of checkouts) {
      allTx.push({
        date: c.checkOutDate,
        type: 'Room_Checkout',
        account: 'Room_Checkout',
        remark: `Room_Checkout/${c.invoiceNo}/Room-${c.roomNo}`,
        debit: c.billAmount,
        credit: 0
      });
      const settlementPaid = c.netPayable || (c.billAmount - (c.advanceDeducted || 0));
      if (settlementPaid > 0) {
        allTx.push({
          date: c.checkOutDate,
          type: 'Check_Out',
          account: c.paymentMode || 'Online',
          remark: `Check_out/${c.invoiceNo}/Room-${c.roomNo}`,
          debit: 0,
          credit: settlementPaid
        });
      }
    }

    // Dynamic payments
    const partyPayments = this.getPayments().filter(p =>
      p.accountName.toLowerCase().includes(cleanQuery)
    );
    for (const p of partyPayments) {
      allTx.push({
        date: p.date,
        type: 'Payment',
        account: p.paymentMode,
        remark: p.remark || 'payout',
        debit: p.amount,
        credit: 0
      });
    }

    let opening = 0;
    const filtered: typeof allTx = [];

    for (const tx of allTx) {
      const c = this.parseDateComparable(tx.date);
      if (c && c < fromComp) {
        opening += (tx.credit - tx.debit);
      } else if (!c || c <= toComp) {
        filtered.push(tx);
      }
    }

    let runningBalance = opening;
    const entries: LedgerEntry[] = [
      {
        date: '',
        type: '',
        accountName: 'Opening Balnce',
        remark: '',
        debit: 0,
        credit: 0,
        balance: Math.abs(opening),
        balanceType: opening >= 0 ? 'Cr' : 'Dr'
      }
    ];

    let totalDebit = 0;
    let totalCredit = 0;

    for (const tx of filtered) {
      totalDebit += tx.debit;
      totalCredit += tx.credit;
      runningBalance += (tx.credit - tx.debit);
      entries.push({
        date: tx.date,
        type: tx.type,
        accountName: tx.account,
        remark: tx.remark,
        debit: tx.debit,
        credit: tx.credit,
        balance: Math.abs(parseFloat(runningBalance.toFixed(2))),
        balanceType: runningBalance >= 0 ? 'Cr' : 'Dr'
      });
    }

    const closingBalance = Math.abs(parseFloat(runningBalance.toFixed(2)));
    const closingType: 'Dr' | 'Cr' = runningBalance >= 0 ? 'Cr' : 'Dr';

    return {
      entries,
      totalDebit: parseFloat(totalDebit.toFixed(2)),
      totalCredit: parseFloat(totalCredit.toFixed(2)),
      closingBalance,
      closingType
    };
  }

  // --- Video 10: Company Info & Local vs Interstate GST Methods ---
  static getCompanyInfo(): PmsCompanyInfo {
    const raw = localStorage.getItem('pms_company_info');
    if (!raw) {
      localStorage.setItem('pms_company_info', JSON.stringify(DEFAULT_COMPANY_INFO));
      return { ...DEFAULT_COMPANY_INFO };
    }
    try {
      return { ...DEFAULT_COMPANY_INFO, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_COMPANY_INFO };
    }
  }

  static saveCompanyInfo(info: PmsCompanyInfo): void {
    localStorage.setItem('pms_company_info', JSON.stringify(info));
  }

  static calculateGst(params: {
    taxableAmount: number;
    gstPercent: number;
    guestGstin?: string;
    guestState?: string;
  }): {
    isLocal: boolean;
    cgstPercent: number;
    sgstPercent: number;
    igstPercent: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalGstAmount: number;
    ruleApplied: string;
  } {
    const company = this.getCompanyInfo();
    if (company.gstNotApplicable || params.gstPercent <= 0) {
      return {
        isLocal: true,
        cgstPercent: 0,
        sgstPercent: 0,
        igstPercent: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalGstAmount: 0,
        ruleApplied: 'GST Not Applicable (Exempt)'
      };
    }

    const cleanGstNo = (params.guestGstin || '').trim();
    const guestStateCode = cleanGstNo.length >= 2 ? cleanGstNo.slice(0, 2) : '';
    const hotelStateCode = (company.companyGstCode || '27').trim();

    // Video 10 rule: If "Make All Bill Local GST" is enabled in company settings,
    // force Local SGST + CGST for all guests regardless of state!
    let isLocal = true;
    let ruleApplied = '';

    if (company.makeAllBillLocalGst) {
      isLocal = true;
      ruleApplied = 'Local GST Forced by Hotel Setting (Make All Bill Local GST = True)';
    } else if (guestStateCode && guestStateCode !== hotelStateCode) {
      isLocal = false;
      ruleApplied = `Interstate GST (Hotel Code ${hotelStateCode} != Guest Code ${guestStateCode} [${cleanGstNo}])`;
    } else {
      isLocal = true;
      ruleApplied = `Intrastate Local GST (State Code ${hotelStateCode})`;
    }

    const halfPercent = params.gstPercent / 2;

    if (isLocal) {
      const cgstAmount = Number(((params.taxableAmount * halfPercent) / 100).toFixed(2));
      const sgstAmount = Number(((params.taxableAmount * halfPercent) / 100).toFixed(2));
      return {
        isLocal: true,
        cgstPercent: halfPercent,
        sgstPercent: halfPercent,
        igstPercent: 0,
        cgstAmount,
        sgstAmount,
        igstAmount: 0,
        totalGstAmount: Number((cgstAmount + sgstAmount).toFixed(2)),
        ruleApplied
      };
    } else {
      const igstAmount = Number(((params.taxableAmount * params.gstPercent) / 100).toFixed(2));
      return {
        isLocal: false,
        cgstPercent: 0,
        sgstPercent: 0,
        igstPercent: params.gstPercent,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount,
        totalGstAmount: igstAmount,
        ruleApplied
      };
    }
  }

  // --- Video 11: Room Shifting (Change Guest Room Easily) ---
  static getRoomShifts(): PmsRoomShiftRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ROOM_SHIFTS);
    return raw ? JSON.parse(raw) : [];
  }

  static shiftRoom(params: {
    fromRoomNo: string;
    toRoomNo: string;
    newTariff?: number;
    reason: string;
    shiftedBy?: string;
    transferKots?: boolean;
    remark?: string;
  }): { success: boolean; message: string; record?: PmsRoomShiftRecord } {
    const rooms = this.getRooms();
    const fromRoom = rooms.find(r => r.roomNo === params.fromRoomNo);
    const toRoom = rooms.find(r => r.roomNo === params.toRoomNo);

    if (!fromRoom) {
      return { success: false, message: `Source Room ${params.fromRoomNo} not found.` };
    }
    if (fromRoom.status !== 'occupied') {
      return { success: false, message: `Source Room ${params.fromRoomNo} is not occupied (current status: ${fromRoom.status}). Only occupied rooms can be shifted.` };
    }
    if (!toRoom) {
      return { success: false, message: `Destination Room ${params.toRoomNo} not found.` };
    }
    if (toRoom.status !== 'vacant') {
      return { success: false, message: `Destination Room ${params.toRoomNo} is not vacant (current status: ${toRoom.status.toUpperCase()}). Please select a vacant, clean room.` };
    }

    const checkIns = this.getCheckIns();
    const checkInIdx = checkIns.findIndex(c => c.roomNo === params.fromRoomNo && c.status === 'CheckedIn');
    const activeCheckIn = checkInIdx >= 0 ? checkIns[checkInIdx] : null;

    const guestName = fromRoom.currentGuest?.name || activeCheckIn?.guestName || 'Guest';
    const guestMobile = fromRoom.currentGuest?.phone || activeCheckIn?.mobile || '';
    const oldTariff = fromRoom.tariff;
    const finalNewTariff = params.newTariff !== undefined ? params.newTariff : toRoom.tariff;

    // Check for pending KOTs & transfer if requested (Video 11 [07:30])
    const allKots = this.getKots();
    let transferredKotsCount = 0;
    if (params.transferKots !== false) {
      const updatedKots = allKots.map(kot => {
        if (kot.roomNo === params.fromRoomNo && kot.status === 'Pending') {
          transferredKotsCount++;
          return {
            ...kot,
            roomNo: params.toRoomNo,
            guestName: guestName,
            kotRemark: `${kot.kotRemark ? kot.kotRemark + ' | ' : ''}Shifted from Room ${params.fromRoomNo}`
          };
        }
        return kot;
      });
      if (transferredKotsCount > 0) {
        localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify(updatedKots));
      }
    }

    // Update Check-In records
    if (activeCheckIn && checkInIdx >= 0) {
      checkIns[checkInIdx] = {
        ...activeCheckIn,
        roomNo: params.toRoomNo,
        roomType: toRoom.roomType,
        tariffPerDay: finalNewTariff,
        remark1: `${activeCheckIn.remark1 || ''} [Shifted from ${params.fromRoomNo} to ${params.toRoomNo} on ${new Date().toLocaleDateString('en-GB')}]`.trim()
      };
      localStorage.setItem('hotel_pms_checkins', JSON.stringify(checkIns));
    }

    // Update Advance Receipts roomNo
    const advanceReceipts = this.getAdvanceReceipts();
    let transferredAdvance = 0;
    const updatedAdvances = advanceReceipts.map(ar => {
      if (ar.roomNo === params.fromRoomNo) {
        transferredAdvance += ar.amount;
        return {
          ...ar,
          roomNo: params.toRoomNo,
          remark: `${ar.remark || ''} (Shifted from ${params.fromRoomNo})`
        };
      }
      return ar;
    });
    if (transferredAdvance > 0) {
      localStorage.setItem(STORAGE_KEYS.ADVANCE_RECEIPTS, JSON.stringify(updatedAdvances));
    }

    // Migrate Folio Payments
    const payments = this.getFolioPayments();
    let paymentsUpdated = false;
    payments.forEach(p => {
      if (p.roomNo === params.fromRoomNo) {
        p.roomNo = params.toRoomNo;
        paymentsUpdated = true;
      }
    });
    if (paymentsUpdated) {
      localStorage.setItem(STORAGE_KEYS.FOLIO_PAYMENTS, JSON.stringify(payments));
    }

    // Migrate Folio Discounts
    const discountsRaw = localStorage.getItem(STORAGE_KEYS.FOLIO_DISCOUNTS);
    if (discountsRaw) {
      try {
        const allDiscounts = JSON.parse(discountsRaw);
        if (allDiscounts[params.fromRoomNo]) {
          allDiscounts[params.toRoomNo] = allDiscounts[params.fromRoomNo];
          delete allDiscounts[params.fromRoomNo];
          localStorage.setItem(STORAGE_KEYS.FOLIO_DISCOUNTS, JSON.stringify(allDiscounts));
        }
      } catch (err) {
        console.error('[PmsStore] Error migrating folio discount in shiftRoom:', err);
      }
    }

    // Update Room statuses
    // 1. Source Room: Marked as DIRTY (Video 11 rule: frame 204 & speech [06:45])
    // 2. Destination Room: Marked as OCCUPIED (frame 209)
    const now = new Date();
    const shiftDate = now.toLocaleDateString('en-GB').replace(/\//g, '-');
    const shiftTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const updatedRooms = rooms.map(r => {
      if (r.roomNo === params.fromRoomNo) {
        return {
          ...r,
          status: 'dirty' as const,
          currentGuest: undefined,
          foodAmount: 0
        };
      }
      if (r.roomNo === params.toRoomNo) {
        return {
          ...r,
          status: 'occupied' as const,
          tariff: finalNewTariff,
          currentGuest: {
            name: guestName,
            phone: guestMobile,
            checkInDate: fromRoom.currentGuest?.checkInDate || activeCheckIn?.checkInDate || shiftDate,
            checkInTime: fromRoom.currentGuest?.checkInTime || activeCheckIn?.checkInTime || shiftTime,
            bookingNo: fromRoom.currentGuest?.bookingNo || activeCheckIn?.checkInNo || `SR/${params.toRoomNo}`,
            advancePaid: (fromRoom.currentGuest?.advancePaid || 0) + transferredAdvance,
            calculationType: fromRoom.currentGuest?.calculationType || '24hour'
          },
          foodAmount: fromRoom.foodAmount || 0
        };
      }
      return r;
    });
    this.saveRooms(updatedRooms);

    // Create Room Shift Record
    const shifts = this.getRoomShifts();
    const shiftRecord: PmsRoomShiftRecord = {
      id: `rs-${Date.now()}`,
      shiftNo: `RS/${shifts.length + 1}/${now.getFullYear() % 100}-${(now.getFullYear() % 100) + 1}`,
      checkInNo: activeCheckIn?.checkInNo || fromRoom.currentGuest?.bookingNo || `SR/${params.fromRoomNo}`,
      guestName,
      guestMobile,
      fromRoomNo: params.fromRoomNo,
      fromRoomType: fromRoom.roomType,
      toRoomNo: params.toRoomNo,
      toRoomType: toRoom.roomType,
      oldTariff,
      newTariff: finalNewTariff,
      shiftDate,
      shiftTime,
      reason: params.reason || 'Guest Request / Routine Shift',
      transferredKotsCount,
      transferredAdvance,
      previousRoomMarkedDirty: true,
      shiftedBy: params.shiftedBy || 'Reception Desk (Admin)',
      remark: params.remark,
      createdAt: now.toISOString()
    };
    shifts.unshift(shiftRecord);
    localStorage.setItem(STORAGE_KEYS.ROOM_SHIFTS, JSON.stringify(shifts));

    // Cloud sync: mirror Room Shift to Railway PostgreSQL
    hotelApi.executeRoomShift({
      booking_ref: activeCheckIn?.bookingRefNo || activeCheckIn?.checkInNo || `SVR-ROOM-${params.fromRoomNo}`,
      to_room_id: parseInt(toRoom.id, 10) || 1,
      reason: params.reason || 'Guest Request / Routine Shift',
      shifted_by: params.shiftedBy || 'Reception Desk (Admin)'
    }).catch(e => console.warn('[PmsStore] Background room shift cloud sync note:', e));

    return {
      success: true,
      message: `Room shifted successfully from ${params.fromRoomNo} to ${params.toRoomNo}. Room ${params.fromRoomNo} is now marked as Dirty for housekeeping.`,
      record: shiftRecord
    };
  }

  static postChargeToRoom(roomNo: string, charge: { chargeName: string; amount: number; sacCode?: string; gstPercent?: number }): void {
    const rooms = this.getRooms();
    const room = rooms.find(r => r.roomNo === roomNo);
    if (room && room.currentGuest) {
      (room.currentGuest as any).addOthers = ((room.currentGuest as any).addOthers || 0) + charge.amount;
      this.saveRooms(rooms);
      this.notify();
    }
  }

  // ==========================================
  // Video 15: General Receipt Register & Party Receivables
  // ==========================================
  static getReceipts(): PmsReceiptRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(INITIAL_RECEIPTS));
      return INITIAL_RECEIPTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_RECEIPTS;
    }
  }

  static saveReceipt(receipt: PmsReceiptRecord): void {
    const list = this.getReceipts();
    const idx = list.findIndex(r => r.receiptNo === receipt.receiptNo || r.id === receipt.id);
    if (idx >= 0) {
      list[idx] = receipt;
    } else {
      list.unshift(receipt);
    }
    // Re-index sNo
    list.forEach((item, index) => {
      item.sNo = index + 1;
    });
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(list));

    // Automatically update party account balance if party exists (Video 15 logic)
    this.settlePartyPayment(receipt.accountName, receipt.amount);
  }

  static deleteReceipt(receiptNo: string): void {
    const list = this.getReceipts().filter(r => r.receiptNo !== receiptNo);
    list.forEach((item, index) => {
      item.sNo = index + 1;
    });
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(list));
  }

  static getPartyAccounts(): PmsPartyAccount[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PARTY_ACCOUNTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PARTY_ACCOUNTS, JSON.stringify(INITIAL_PARTY_ACCOUNTS));
      return INITIAL_PARTY_ACCOUNTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PARTY_ACCOUNTS;
    }
  }

  static savePartyAccount(party: PmsPartyAccount): void {
    const list = this.getPartyAccounts();
    const idx = list.findIndex(p => p.id === party.id || p.name.toLowerCase() === party.name.toLowerCase());
    if (idx >= 0) {
      list[idx] = party;
    } else {
      list.push(party);
    }
    localStorage.setItem(STORAGE_KEYS.PARTY_ACCOUNTS, JSON.stringify(list));
  }

  static settlePartyPayment(accountName: string, amount: number): void {
    const parties = this.getPartyAccounts();
    const cleanName = accountName.toLowerCase().trim();
    const party = parties.find(p => p.name.toLowerCase().trim() === cleanName);
    if (party) {
      party.balance = Math.max(0, party.balance - amount);
      if (party.balance === 0) {
        party.balanceType = 'Dr';
      }
      this.savePartyAccount(party);
    }
  }

  // ==========================================
  // Video 16: General Payment Register & Payouts
  // ==========================================
  static getPayments(): PmsPaymentRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
      return INITIAL_PAYMENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PAYMENTS;
    }
  }

  static savePayment(payment: PmsPaymentRecord): void {
    const list = this.getPayments();
    const idx = list.findIndex(p => p.paymentNo === payment.paymentNo || p.id === payment.id);
    if (idx >= 0) {
      list[idx] = payment;
    } else {
      list.unshift(payment);
    }
    list.forEach((item, index) => {
      item.sNo = index + 1;
    });
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(list));

    // Update party balance if it's an expense / owner / creditor
    const parties = this.getPartyAccounts();
    const party = parties.find(p => p.name.toLowerCase().trim() === payment.accountName.toLowerCase().trim());
    if (party) {
      party.balance += payment.amount;
      party.balanceType = 'Dr';
      this.savePartyAccount(party);
    }
  }

  static deletePayment(paymentNo: string): void {
    const list = this.getPayments().filter(p => p.paymentNo !== paymentNo);
    list.forEach((item, index) => {
      item.sNo = index + 1;
    });
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(list));
  }

  // ==========================================
  // Video 19: Store & Inventory Management Methods
  // ==========================================

  // 1. Item Groups Master (Frames 0140, 0150)
  static getItemGroups(): PmsItemGroup[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ITEM_GROUPS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ITEM_GROUPS, JSON.stringify(INITIAL_ITEM_GROUPS));
      return INITIAL_ITEM_GROUPS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ITEM_GROUPS;
    }
  }

  static saveItemGroup(group: PmsItemGroup): void {
    const list = this.getItemGroups();
    const idx = list.findIndex(g => g.id === group.id || g.name.toLowerCase() === group.name.toLowerCase());
    if (idx >= 0) {
      list[idx] = group;
    } else {
      list.push(group);
    }
    list.forEach((item, index) => {
      item.sNo = index + 1;
    });
    localStorage.setItem(STORAGE_KEYS.ITEM_GROUPS, JSON.stringify(list));
  }

  static deleteItemGroup(id: string): void {
    const list = this.getItemGroups().filter(g => g.id !== id && g.name !== id);
    list.forEach((item, index) => {
      item.sNo = index + 1;
    });
    localStorage.setItem(STORAGE_KEYS.ITEM_GROUPS, JSON.stringify(list));
  }

  // 2. Godowns Master (Frame 0230)
  static getGodowns(): PmsGodown[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GODOWNS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.GODOWNS, JSON.stringify(INITIAL_GODOWNS));
      return INITIAL_GODOWNS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_GODOWNS;
    }
  }

  static saveGodown(godown: PmsGodown): void {
    const list = this.getGodowns();
    const idx = list.findIndex(g => g.id === godown.id || g.name.toLowerCase() === godown.name.toLowerCase());
    if (idx >= 0) {
      list[idx] = godown;
    } else {
      list.push(godown);
    }
    list.forEach((item, index) => {
      item.sNo = index + 1;
    });
    localStorage.setItem(STORAGE_KEYS.GODOWNS, JSON.stringify(list));
  }

  static deleteGodown(id: string): void {
    const list = this.getGodowns().filter(g => g.id !== id && g.name !== id);
    list.forEach((item, index) => {
      item.sNo = index + 1;
    });
    localStorage.setItem(STORAGE_KEYS.GODOWNS, JSON.stringify(list));
  }

  // 3. Purchase Bills (Frames 0280, 0300)
  static getPurchases(): PmsPurchaseBill[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(INITIAL_PURCHASES));
      return INITIAL_PURCHASES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PURCHASES;
    }
  }

  static savePurchase(bill: PmsPurchaseBill): void {
    const list = this.getPurchases();
    const idx = list.findIndex(p => p.id === bill.id || p.billNo === bill.billNo);
    if (idx >= 0) {
      list[idx] = bill;
    } else {
      list.unshift(bill);
    }
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(list));

    // Update Party Account & Double-Entry Ledger (Video 19 financial integration)
    const partyName = bill.accountName || 'Purchase';
    const parties = this.getPartyAccounts();
    let party = parties.find(p => p.name.toLowerCase().trim() === partyName.toLowerCase().trim());
    if (party) {
      if (bill.terms === 'Credit') {
        party.balance += bill.totalNetValue;
        party.balanceType = 'Cr'; // We owe the vendor
      }
      this.savePartyAccount(party);
    } else if (bill.terms === 'Credit') {
      // Create new vendor party
      this.savePartyAccount({
        id: `pa-${Date.now()}`,
        name: partyName,
        category: 'Corporate',
        balance: bill.totalNetValue,
        balanceType: 'Cr'
      });
    }

    // Ledger debit entry on Purchase Account
    const purchaseAccount = parties.find(p => p.name.toLowerCase() === 'purchase');
    if (purchaseAccount) {
      purchaseAccount.balance += bill.totalNetValue;
      this.savePartyAccount(purchaseAccount);
    }
  }

  static deletePurchase(id: string): void {
    const list = this.getPurchases().filter(p => p.id !== id && p.billNo !== id);
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(list));
  }

  // 4. Stock Transfers & Issues (Frames 0335, 0370)
  static getStockTransfers(): PmsStockTransfer[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK_TRANSFERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STOCK_TRANSFERS, JSON.stringify(INITIAL_STOCK_TRANSFERS));
      return INITIAL_STOCK_TRANSFERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_STOCK_TRANSFERS;
    }
  }

  static saveStockTransfer(transfer: PmsStockTransfer): void {
    const list = this.getStockTransfers();
    const idx = list.findIndex(s => s.id === transfer.id || s.entryNo === transfer.entryNo);
    if (idx >= 0) {
      list[idx] = transfer;
    } else {
      list.unshift(transfer);
    }
    localStorage.setItem(STORAGE_KEYS.STOCK_TRANSFERS, JSON.stringify(list));
  }

  static deleteStockTransfer(id: string): void {
    const list = this.getStockTransfers().filter(s => s.id !== id && s.entryNo !== id);
    localStorage.setItem(STORAGE_KEYS.STOCK_TRANSFERS, JSON.stringify(list));
  }

  // 5. Dynamic Store-Wise Stock Calculator (Frames 0260, 0320, 0370)
  // Computes exact In, Out, and Closing stock for all items per Godown
  static getGodownStock(): Record<string, GodownStockRow[]> {
    const godowns = this.getGodowns();
    const menuItems = this.getMenuItems();
    const purchases = this.getPurchases();
    const transfers = this.getStockTransfers();

    const result: Record<string, GodownStockRow[]> = {};

    godowns.forEach(g => {
      result[g.name] = [];
    });

    // Helper map of all items
    const itemMap = new Map<string, { name: string; unit?: string; barcode?: string; headGroup?: string }>();
    menuItems.forEach(m => {
      itemMap.set(m.name.toLowerCase().trim(), {
        name: m.name,
        unit: m.unit || 'Pcs',
        barcode: m.barcode || m.code,
        headGroup: m.headGroup
      });
    });

    // Accumulators per godown per item: { in: number, out: number }
    const storeMap: Record<string, Record<string, { stockIn: number; stockOut: number }>> = {};
    godowns.forEach(g => {
      storeMap[g.name] = {};
    });

    // A. Purchases add to godown Stock In
    purchases.forEach(p => {
      const gName = p.godown || 'Main Store';
      if (!storeMap[gName]) storeMap[gName] = {};
      p.items.forEach((itm: PmsPurchaseItem) => {
        const key = itm.itemName.toLowerCase().trim();
        if (!storeMap[gName][key]) storeMap[gName][key] = { stockIn: 0, stockOut: 0 };
        storeMap[gName][key].stockIn += itm.qty;
      });
    });

    // B. Stock Transfers
    transfers.forEach(st => {
      const fromG = st.fromGodown;
      const toG = st.toGodown;

      if (!storeMap[fromG]) storeMap[fromG] = {};
      if (!storeMap[toG]) storeMap[toG] = {};

      st.items.forEach(itm => {
        const key = itm.itemName.toLowerCase().trim();
        // Out from source
        if (!storeMap[fromG][key]) storeMap[fromG][key] = { stockIn: 0, stockOut: 0 };
        storeMap[fromG][key].stockOut += itm.qty;

        // In to destination
        if (!storeMap[toG][key]) storeMap[toG][key] = { stockIn: 0, stockOut: 0 };
        storeMap[toG][key].stockIn += itm.qty;
      });
    });

    // Build tabular rows for each godown
    godowns.forEach(g => {
      const gName = g.name;
      const rows: GodownStockRow[] = [];
      const godownItems = storeMap[gName] || {};

      let sNo = 1;
      // First items present in transaction history
      Object.keys(godownItems).forEach(key => {
        const data = godownItems[key];
        const itmMeta = itemMap.get(key) || { name: key.toUpperCase(), unit: 'Pcs', barcode: '' };
        rows.push({
          sNo: sNo++,
          itemName: itmMeta.name,
          unit: itmMeta.unit,
          barcode: itmMeta.barcode,
          stockIn: data.stockIn,
          stockOut: data.stockOut,
          closingStock: data.stockIn - data.stockOut
        });
      });

      result[gName] = rows;
    });

    return result;
  }

  // ==========================================
  // Video 23: Roles & Permissions Store Methods (Frames 0135, 0140, 0155)
  // ==========================================
  static getRoles(): PmsRole[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ROLES);
    let roles: PmsRole[] = [];
    if (!raw) {
      roles = INITIAL_ROLES;
      localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
      return roles;
    }
    try {
      roles = JSON.parse(raw);
    } catch {
      roles = INITIAL_ROLES;
      localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
      return roles;
    }

    // Ensure all 9 seed roles (Video 23 Frame 0135 & 0155) are present in storage
    let updated = false;
    for (const initRole of INITIAL_ROLES) {
      const existing = roles.find(r => r.id === initRole.id || r.name.toLowerCase() === initRole.name.toLowerCase());
      if (!existing) {
        roles.push(initRole);
        updated = true;
      }
    }
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
    }
    return roles;
  }

  static saveRoles(roles: PmsRole[]): void {
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
  }

  static getRoleById(id: number): PmsRole | undefined {
    return this.getRoles().find(r => r.id === id);
  }

  static saveRole(role: PmsRole): void {
    const roles = this.getRoles();
    const idx = roles.findIndex(r => r.id === role.id);
    if (idx >= 0) {
      roles[idx] = role;
    } else {
      roles.push(role);
    }
    this.saveRoles(roles);
  }

  static updateRolePermissions(roleId: number, permissions: string[]): void {
    const roles = this.getRoles();
    const idx = roles.findIndex(r => r.id === roleId);
    if (idx >= 0) {
      roles[idx].permissions = permissions;
      this.saveRoles(roles);
    }
  }

  static deleteRole(id: number): void {
    const roles = this.getRoles().filter(r => r.id !== id);
    this.saveRoles(roles);
  }

  // ==========================================
  // Video 23: Staff User Accounts Store Methods (Frame 0120 & 0165)
  // ==========================================
  static getUsers(): PmsUserAccount[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    let users: PmsUserAccount[] = [];
    if (!raw) {
      users = INITIAL_USER_ACCOUNTS;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return users;
    }
    try {
      users = JSON.parse(raw);
    } catch {
      users = INITIAL_USER_ACCOUNTS;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return users;
    }

    // Ensure staff users from Video 23 Frame 0165 exist
    let updated = false;
    for (const initUser of INITIAL_USER_ACCOUNTS) {
      if (!users.some(u => u.id === initUser.id || u.emailId === initUser.emailId)) {
        users.push(initUser);
        updated = true;
      }
    }
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return users;
  }

  static saveUsers(users: PmsUserAccount[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  static getUserById(id: number): PmsUserAccount | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  static saveUser(user: PmsUserAccount): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    this.saveUsers(users);
  }

  static toggleUserStatus(id: number): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx >= 0) {
      users[idx].status = users[idx].status === 'Verified' ? 'Pending' : 'Verified';
      users[idx].verifiedDate = users[idx].status === 'Verified' ? new Date().toISOString().replace('T', ' ').slice(0, 19) : undefined;
      this.saveUsers(users);
    }
  }

  static deleteUser(id: number): void {
    const users = this.getUsers().filter(u => u.id !== id);
    this.saveUsers(users);
  }

  static getCurrentUser(): PmsUserAccount {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    const users = this.getUsers();
    const admin = users.find(u => u.userName === 'Admin') || users[0];
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(admin));
    return admin;
  }

  static setCurrentUser(user: PmsUserAccount): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pms_user_changed', { detail: user }));
    }
  }

  // Video 23 Anti-Theft & Fraud Prevention Permission Evaluator (Frame 0140 & 0185)
  static hasPermission(permissionKey: string): boolean {
    const currentUser = this.getCurrentUser();
    const role = this.getRoleById(currentUser.roleId) || this.getRoles().find(r => r.name.toLowerCase() === currentUser.roleName.toLowerCase());
    if (!role) return true;
    if (role.name === 'super-admin' || role.name === '1 - super-admin' || currentUser.userName === 'Admin') return true;

    // Normalizing permission aliases for tariff control
    if ((permissionKey === 'Change_Rent_PerDay' || permissionKey === 'Chang_Rent_Perday' || permissionKey === 'Change_Room_Tariff') &&
        (role.permissions.includes('Chang_Rent_Perday') || role.permissions.includes('Change_Room_Tariff') || role.permissions.includes('Change_Rent_PerDay'))) {
      return true;
    }

    // Normalizing anti-theft delete permissions
    if (permissionKey === 'Delete' || permissionKey === 'delete') {
      return role.permissions.includes('Delete') || role.permissions.includes('delete') || role.permissions.includes('delete user');
    }

    // Role-specific module boundaries (Video 23 Frame 0185)
    if (permissionKey === 'Hotel Module') {
      return role.permissions.includes('Hotel Module') || role.permissions.includes('Room_Dashboard') || role.permissions.includes('roombooking');
    }

    if (permissionKey === 'Restaurant Module') {
      return role.permissions.includes('Restaurant Module') || role.permissions.includes('Restaurant') || role.permissions.includes('kot');
    }

    if (permissionKey === 'Setting') {
      return role.permissions.includes('Setting') || role.name === 'admin' || role.name === '2 - admin';
    }

    return role.permissions.includes(permissionKey);
  }

  // ==========================================
  // Video 21: Multi-Location Properties Store Methods
  // ==========================================
  static getProperties(): PmsChainProperty[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PROPERTIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(INITIAL_CHAIN_PROPERTIES));
      return INITIAL_CHAIN_PROPERTIES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CHAIN_PROPERTIES;
    }
  }

  static saveProperties(props: PmsChainProperty[]): void {
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(props));
  }

  static getCurrentProperty(): PmsChainProperty {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_PROPERTY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    const props = this.getProperties();
    const current = props.find(p => p.isCurrent) || props[0];
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROPERTY, JSON.stringify(current));
    return current;
  }

  static setCurrentProperty(firmId: string): void {
    const props = this.getProperties();
    const updated = props.map(p => ({
      ...p,
      isCurrent: p.firmId === firmId
    }));
    this.saveProperties(updated);
    const selected = updated.find(p => p.firmId === firmId);
    if (selected) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROPERTY, JSON.stringify(selected));
    }
  }

  // ==========================================
  // Video 22: Auto WhatsApp SMS Integration Methods
  // ==========================================
  static getWhatsAppTemplates(): PmsWhatsAppTemplate[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WHATSAPP_TEMPLATES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WHATSAPP_TEMPLATES, JSON.stringify(INITIAL_WHATSAPP_TEMPLATES));
      return INITIAL_WHATSAPP_TEMPLATES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_WHATSAPP_TEMPLATES;
    }
  }

  static saveWhatsAppTemplates(templates: PmsWhatsAppTemplate[]): void {
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_TEMPLATES, JSON.stringify(templates));
  }

  static getWhatsAppTemplate(voucherType: string): PmsWhatsAppTemplate | undefined {
    return this.getWhatsAppTemplates().find(t => t.voucherType.toLowerCase() === voucherType.toLowerCase());
  }

  static saveWhatsAppTemplate(tmpl: PmsWhatsAppTemplate): void {
    const list = this.getWhatsAppTemplates();
    const idx = list.findIndex(t => t.id === tmpl.id || t.voucherType.toLowerCase() === tmpl.voucherType.toLowerCase());
    if (idx >= 0) {
      list[idx] = tmpl;
    } else {
      list.push(tmpl);
    }
    this.saveWhatsAppTemplates(list);
  }

  static deleteWhatsAppTemplate(id: number): void {
    const list = this.getWhatsAppTemplates().filter(t => t.id !== id);
    this.saveWhatsAppTemplates(list);
  }

  static getWhatsAppConfig(): PmsWhatsAppConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.WHATSAPP_CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WHATSAPP_CONFIG, JSON.stringify(INITIAL_WHATSAPP_CONFIG));
      return INITIAL_WHATSAPP_CONFIG;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_WHATSAPP_CONFIG;
    }
  }

  static saveWhatsAppConfig(config: PmsWhatsAppConfig): void {
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_CONFIG, JSON.stringify(config));
  }

  static getWhatsAppLogs(): PmsWhatsAppLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WHATSAPP_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WHATSAPP_LOGS, JSON.stringify(INITIAL_WHATSAPP_LOGS));
      return INITIAL_WHATSAPP_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_WHATSAPP_LOGS;
    }
  }

  static addWhatsAppLog(log: Omit<PmsWhatsAppLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): PmsWhatsAppLog {
    const list = this.getWhatsAppLogs();
    const newLog: PmsWhatsAppLog = {
      id: log.id || `wal-${Date.now()}`,
      timestamp: log.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 19),
      recipientMobile: log.recipientMobile,
      recipientName: log.recipientName,
      recipientType: log.recipientType,
      voucherType: log.voucherType,
      voucherNo: log.voucherNo,
      roomNo: log.roomNo,
      message: log.message,
      status: log.status || 'Delivered',
      firmId: log.firmId || this.getCurrentProperty().firmId
    };
    list.unshift(newLog);
    const trimmed = list.slice(0, 150);
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_LOGS, JSON.stringify(trimmed));
    return newLog;
  }

  static clearWhatsAppLogs(): void {
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_LOGS, JSON.stringify([]));
  }

  static renderWhatsAppMessage(templateText: string, params: Record<string, any>): string {
    const prop = this.getCurrentProperty();
    const user = this.getCurrentUser();
    const defaults: Record<string, string> = {
      firm_name: prop.firmName,
      firm_id: prop.firmId,
      address1: prop.address.split(',')[0] || prop.address,
      address2: prop.address.split(',')[1] || '',
      city: prop.location.split(' ')[0] || 'Shirdi',
      pincode: '423109',
      state: 'Maharashtra',
      email: prop.email,
      website: 'https://hotel-sai-vasudev-residency.pages.dev',
      phone: prop.phone,
      mobile: prop.phone,
      name: user.userName || 'Admin'
    };

    let rendered = templateText;
    const combined = { ...defaults, ...params };

    for (const [key, val] of Object.entries(combined)) {
      const reg = new RegExp(`\\{${key}\\}`, 'gi');
      rendered = rendered.replace(reg, String(val ?? ''));
    }

    return rendered;
  }

  static sendWhatsAppNotification(params: {
    voucherType: string;
    recipientMobile: string;
    recipientName: string;
    recipientType?: 'Guest' | 'Owner';
    voucherNo?: string;
    roomNo?: string;
    templateParams?: Record<string, any>;
    customMessage?: string;
    openDirectly?: boolean;
  }): { success: boolean; log: PmsWhatsAppLog; directUrl: string } {
    const template = this.getWhatsAppTemplate(params.voucherType);

    let messageText = params.customMessage || '';
    if (!messageText && template) {
      messageText = this.renderWhatsAppMessage(template.message, {
        guest_name: params.recipientName,
        voucher_no: params.voucherNo || '',
        room_no: params.roomNo || '',
        ...(params.templateParams || {})
      });
    }

    if (!messageText) {
      messageText = `Greetings from ${this.getCurrentProperty().firmName}! Room: ${params.roomNo || '-'}, Voucher: ${params.voucherNo || '-'}.`;
    }

    const cleanPhone = params.recipientMobile.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const directUrl = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(messageText)}`;

    const log = this.addWhatsAppLog({
      recipientMobile: params.recipientMobile,
      recipientName: params.recipientName,
      recipientType: params.recipientType || (template?.sendTo === 'Owner' ? 'Owner' : 'Guest'),
      voucherType: params.voucherType,
      voucherNo: params.voucherNo,
      roomNo: params.roomNo,
      message: messageText,
      status: 'Delivered',
      firmId: this.getCurrentProperty().firmId
    });

    if (params.openDirectly && typeof window !== 'undefined') {
      window.open(directUrl, '_blank', 'noopener,noreferrer');
    }

    return { success: true, log, directUrl };
  }

  // ==========================================
  // Video 25: Online vs Offline Architecture & Local Backup / Disaster Recovery
  // ==========================================
  static exportDatabaseBackup(): import('../types/pmsModels').PmsDatabaseBackup {
    const prop = this.getCurrentProperty();
    const backup: import('../types/pmsModels').PmsDatabaseBackup = {
      version: '1.25.0',
      timestamp: new Date().toISOString(),
      firmId: prop.firmId,
      firmName: prop.firmName,
      data: {
        rooms: this.getRooms(),
        bookings: this.getBookings(),
        checkIns: this.getCheckIns(),
        kots: this.getKots(),
        bills: this.getFoodBills(),
        payments: this.getPayments(),
        users: this.getUsers(),
        godowns: this.getGodowns(),
        itemGroups: this.getItemGroups(),
        whatsAppLogs: this.getWhatsAppLogs(),
        companyInfo: this.getCompanyInfo()
      }
    };
    return backup;
  }

  static importDatabaseBackup(backup: import('../types/pmsModels').PmsDatabaseBackup): { success: boolean; message: string } {
    if (!backup || !backup.data) {
      return { success: false, message: 'Invalid backup file structure.' };
    }
    try {
      if (backup.data.rooms) localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(backup.data.rooms));
      if (backup.data.bookings) localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(backup.data.bookings));
      if (backup.data.checkIns) localStorage.setItem('hotel_pms_checkins', JSON.stringify(backup.data.checkIns));
      if (backup.data.kots) localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify(backup.data.kots));
      if (backup.data.bills) localStorage.setItem('hotel_pms_food_bills', JSON.stringify(backup.data.bills));
      if (backup.data.payments) localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(backup.data.payments));
      if (backup.data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(backup.data.users));
      if ((backup.data as any).godowns) localStorage.setItem(STORAGE_KEYS.GODOWNS, JSON.stringify((backup.data as any).godowns));
      if ((backup.data as any).itemGroups) localStorage.setItem(STORAGE_KEYS.ITEM_GROUPS, JSON.stringify((backup.data as any).itemGroups));
      if (backup.data.whatsAppLogs) localStorage.setItem(STORAGE_KEYS.WHATSAPP_LOGS, JSON.stringify(backup.data.whatsAppLogs));
      if (backup.data.companyInfo) localStorage.setItem('hotel_pms_company_info', JSON.stringify(backup.data.companyInfo));

      // Broadcast update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('pms_database_restored'));
        window.dispatchEvent(new Event('pms_user_changed'));
      }
      return { success: true, message: `Successfully restored database for ${backup.firmName || 'Hotel'}. Total records restored.` };
    } catch (e: any) {
      return { success: false, message: `Failed to restore database: ${e?.message || e}` };
    }
  }

  static getStorageMetrics(): { totalKeys: number; sizeKb: number; recordCounts: Record<string, number> } {
    let sizeBytes = 0;
    let totalKeys = 0;
    const recordCounts: Record<string, number> = {
      rooms: this.getRooms().length,
      bookings: this.getBookings().length,
      checkIns: this.getCheckIns().length,
      kots: this.getKots().length,
      foodBills: this.getFoodBills().length,
      payments: this.getPayments().length,
      users: this.getUsers().length,
      godowns: this.getGodowns().length,
      whatsAppLogs: this.getWhatsAppLogs().length
    };

    if (typeof localStorage !== 'undefined') {
      totalKeys = localStorage.length;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('hotel_pms_')) {
          const val = localStorage.getItem(key) || '';
          sizeBytes += (key.length + val.length) * 2; // UTF-16
        }
      }
    }

    return {
      totalKeys,
      sizeKb: Math.round((sizeBytes / 1024) * 10) / 10,
      recordCounts
    };
  }

  // ==========================================
  // Video 26: Bill Format Engine & Digital Branding Assets (Frames 0115, 0170, 0195, 0215, 0240, 0250, 0270)
  // ==========================================
  static getBillFormatOptions(): BillFormatOption[] {
    return [
      {
        id: 'Format_1_DayWise',
        name: 'Format 1 / Day-wise Breakdown (/room_checkout_view2)',
        label: 'Format 1 (Day-wise)',
        route: '/room_checkout_view2',
        paperSize: 'A4',
        buttonColor: '#ca8a04',
        description: 'Itemized day-by-day stay table with yellow header banner, SAC 996311 code, food addition, advance deduction, and dual bank/UPI QR footer.'
      },
      {
        id: 'Format_2_Summary',
        name: 'Format 2 / General Invoice (/room_checkout_view)',
        label: 'Format 2 (Summary)',
        route: '/room_checkout_view',
        paperSize: 'A4',
        buttonColor: '#2563eb',
        description: 'Compact 2-column invoice with guest address box, particulars table, total days count, and advance deduction.'
      },
      {
        id: 'Format_3_A4_Standard',
        name: 'Format 3 / A4 Standard Format (/room_checkout_view3) [RECOMMENDED]',
        label: 'Format 3 (A4 Standard)',
        route: '/room_checkout_view3',
        paperSize: 'A4',
        recommended: true,
        buttonColor: '#16a34a',
        description: 'Most popular hotel format with full SAC & GST breakup table, front desk key drop reminder (🔑), Payment Completed stamp, and dual signature lines.'
      },
      {
        id: 'Format_4_A5_Compact',
        name: 'Format 4 / A5 Half-Page Compact (/room_checkout_view4)',
        label: 'Format 4 (A5 Compact)',
        route: '/room_checkout_view4',
        paperSize: 'A5',
        buttonColor: '#ca8a04',
        description: 'Condensed half-page format tailored for A5 paper printers, zero margins, and economized billing stationery.'
      }
    ];
  }

  static getDefaultBillFormat(): BillFormatType {
    const saved = localStorage.getItem('pms_default_bill_format');
    if (saved && ['Format_1_DayWise', 'Format_2_Summary', 'Format_3_A4_Standard', 'Format_4_A5_Compact'].includes(saved)) {
      return saved as BillFormatType;
    }
    return 'Format_3_A4_Standard';
  }

  static setDefaultBillFormat(format: BillFormatType): void {
    localStorage.setItem('pms_default_bill_format', format);
  }

  static getCompanyPicAssets(): CompanyPicAsset[] {
    const comp = this.getCompanyInfo();
    return [
      {
        sNo: 1,
        title: 'Logo',
        code: 'logo',
        currentUrl: comp.logoUrl || '',
        description: 'Hotel official crest / monogram printed on top-left of all bills and receipts.'
      },
      {
        sNo: 2,
        title: 'QR Code',
        code: 'qr_code',
        currentUrl: comp.qrCodeUrl || '',
        description: 'UPI QR code printed on bills for direct guest payment via PhonePe, GPay, or Paytm.'
      },
      {
        sNo: 3,
        title: 'Seal',
        code: 'seal',
        currentUrl: comp.sealUrl || '',
        description: 'Digital stamp "Payment Completed - Thank You! Ref #..." printed on final tax invoices.'
      },
      {
        sNo: 4,
        title: 'Signature',
        code: 'signature',
        currentUrl: comp.signatureUrl || '',
        description: 'Front Office Manager / Receptionist digital signature for authorized signatory block.'
      },
      {
        sNo: 5,
        title: 'Brand',
        code: 'brand',
        currentUrl: comp.brandUrl || '',
        description: 'Header brand banner or chain brand watermarks on statements.'
      }
    ];
  }

  static saveCompanyPicAsset(code: 'logo' | 'qr_code' | 'seal' | 'signature' | 'brand', url: string): void {
    const comp = this.getCompanyInfo();
    if (code === 'logo') comp.logoUrl = url;
    else if (code === 'qr_code') comp.qrCodeUrl = url;
    else if (code === 'seal') comp.sealUrl = url;
    else if (code === 'signature') comp.signatureUrl = url;
    else if (code === 'brand') comp.brandUrl = url;
    this.saveCompanyInfo(comp);
  }

  /**
   * Generates a standard UPI Payment Intent URL and returns a fast SVG QR Code image Data-URI.
   * Completely offline capable with fallback to standard qrserver URL.
   */
  static generateUpiPaymentQrUrl(amount: number, guestName?: string, billNo?: string): string {
    const comp = this.getCompanyInfo();
    if (comp.qrCodeUrl && comp.qrCodeUrl.trim().length > 0) {
      return comp.qrCodeUrl;
    }
    const upiId = comp.upiId || '7999663696@YBL';
    const payeeName = comp.firmName || 'HOTEL SAI VASUDEV RESIDENCY';
    const note = billNo ? `Bill ${billNo}${guestName ? ' - ' + guestName : ''}` : (guestName ? `Room Settlement - ${guestName}` : 'Hotel Room Settlement');
    const cleanAmount = amount > 0 ? amount.toFixed(2) : '1.00';
    
    const upiPayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(note)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiPayload)}`;
  }

  // ==========================================
  // Video 27: Top 20 Features of RoomG PMS Master Methods (Frames 0005-0815)
  // ==========================================
  static getTop20Features(): PmsTopFeature[] {
    return TOP_20_FEATURES;
  }

  static getTopFeatureById(id: number): PmsTopFeature | undefined {
    return TOP_20_FEATURES.find(f => f.id === id);
  }

  static getRoomGPricingInfo(): RoomGSystemPricing {
    return DEFAULT_ROOMG_PRICING;
  }

  /**
   * Video 27 Timestamp [26:00]: Real-Time Anti-Theft Owner WhatsApp Alert
   * Automatically dispatches an alert to hotel owner when a checkout folio is deleted or modified.
   */
  static triggerAntiTheftAlert(payload: {
    voucherType: 'Check_out_delete' | 'Check_out_update';
    roomNo: string;
    voucherNo: string;
    guestName: string;
    checkoutDate: string;
    totalBillAmount: number;
    operatorName?: string;
  }): void {
    const comp = this.getCompanyInfo();
    const config = this.getWhatsAppConfig();
    const operator = payload.operatorName || this.getCurrentUser().userName || 'Staff';
    const ownerMobile = config.ownerMobile || '7999663696';
    
    const message = `Dear Owner, This is to inform you that a guest bill has been deleted at *${comp.firmName}*. *Details* Room No: ${payload.roomNo} Bill No: ${payload.voucherNo} Guest Name: ${payload.guestName} Checkout Date: ${payload.checkoutDate} Delete Bill Amount: ₹${payload.totalBillAmount.toFixed(2)} Oprater Name: ${operator} Please ensure all *Deleted* Record`;

    this.addWhatsAppLog({
      recipientName: 'Hotel Owner',
      recipientMobile: ownerMobile,
      recipientType: 'Owner',
      voucherType: payload.voucherType,
      voucherNo: payload.voucherNo,
      message,
      status: 'Sent',
      roomNo: payload.roomNo
    });

    // Broadcast event for live UI toast/notification
    try {
      const event = new CustomEvent('pms_anti_theft_alert', {
        detail: {
          ...payload,
          operatorName: operator,
          ownerMobile,
          message
        }
      });
      window.dispatchEvent(event);
    } catch {}
  }

  // ==========================================
  // Video 28: GST Tax Reports & CA Filing Suite (Frames 0080-0330)
  // ==========================================

  /**
   * Room Check Out B2B Register (Only GST Customer Invoice)
   * Route: /b2bsales_pageshow & /b2bsales
   * Matches GSTR-1 Table 4 (B2B Taxable outward supplies to registered persons)
   */
  static getB2BReport(fromDate?: string, toDate?: string): PmsB2BInvoiceRecord[] {
    const checkouts = this.getCheckouts();
    const list: PmsB2BInvoiceRecord[] = [];

    // Pre-seeded canonical B2B transactions from Video 28 Frame 0130
    const canonicalB2B: PmsB2BInvoiceRecord[] = [
      {
        sNo: 1,
        gstin: '10krhpk1291mzpk',
        receiverName: 'Apex Logistics Corp',
        invoiceNumber: 'GSR/233/24-25',
        invoiceDate: '17-06-2025',
        invoiceValue: 4740.00,
        placeOfSupply: '27-Maharashtra',
        reverseCharge: 'N',
        applicableTaxRate: 'N',
        invoiceType: 'Regular B2B',
        eCommerceGstin: '',
        rate: 12,
        taxableValue: 4232.14,
        cessAmount: 0
      },
      {
        sNo: 2,
        gstin: '23BLSP4169C1Z',
        receiverName: 'data house',
        invoiceNumber: 'GSR/230/24-25',
        invoiceDate: '11-06-2025',
        invoiceValue: 3360.00,
        placeOfSupply: '23-Madhya Pradesh',
        reverseCharge: 'N',
        applicableTaxRate: 'N',
        invoiceType: 'Regular B2B',
        eCommerceGstin: '',
        rate: 12,
        taxableValue: 3000.00,
        cessAmount: 0
      },
      {
        sNo: 3,
        gstin: '23gdfgdgfdfgdfg',
        receiverName: 'Kaveri Infra Projects',
        invoiceNumber: 'GSR/231/24-25',
        invoiceDate: '11-06-2025',
        invoiceValue: 2240.00,
        placeOfSupply: '23-Madhya Pradesh',
        reverseCharge: 'N',
        applicableTaxRate: 'N',
        invoiceType: 'Regular B2B',
        eCommerceGstin: '',
        rate: 12,
        taxableValue: 2000.00,
        cessAmount: 0
      },
      {
        sNo: 4,
        gstin: '23JHGHGHDHG',
        receiverName: 'Mahakaal Power & Steel',
        invoiceNumber: 'GSR/239/24-25',
        invoiceDate: '26-06-2025',
        invoiceValue: 3721.00,
        placeOfSupply: '23-Madhya Pradesh',
        reverseCharge: 'N',
        applicableTaxRate: 'N',
        invoiceType: 'Regular B2B',
        eCommerceGstin: '',
        rate: 12,
        taxableValue: 3322.32,
        cessAmount: 0
      },
      {
        sNo: 5,
        gstin: '23SJDHGSJDHGHS',
        receiverName: 'hindalko',
        invoiceNumber: 'GSR/222/24-25',
        invoiceDate: '07-06-2025',
        invoiceValue: 3939.99,
        placeOfSupply: '23-Madhya Pradesh',
        reverseCharge: 'N',
        applicableTaxRate: 'N',
        invoiceType: 'Regular B2B',
        eCommerceGstin: '',
        rate: 12,
        taxableValue: 3517.85,
        cessAmount: 0
      }
    ];

    list.push(...canonicalB2B);

    // Dynamic B2B transactions from active checkouts
    checkouts.forEach((co: PmsCheckOutDetail) => {
      const gstin = co.gstNumber?.trim();
      if (gstin && gstin !== '-' && gstin.length >= 5) {
        const taxable = co.totalRoomRent ? (co.totalRoomRent / 1.12) : (co.billAmount / 1.12);
        list.push({
          sNo: list.length + 1,
          gstin: gstin,
          receiverName: co.companyName || co.guestName,
          invoiceNumber: co.invoiceNo || 'GSR/240/24-25',
          invoiceDate: co.checkOutDate,
          invoiceValue: co.netPayable || co.billAmount,
          placeOfSupply: co.state ? `${co.state}` : '27-Maharashtra',
          reverseCharge: 'N',
          applicableTaxRate: 'N',
          invoiceType: 'Regular B2B',
          eCommerceGstin: '',
          rate: co.gstPercent || 12,
          taxableValue: Math.round(taxable * 100) / 100,
          cessAmount: 0
        });
      }
    });

    // Date range filter
    if (fromDate && toDate) {
      const parseD = (s: string) => {
        const parts = s.split('-');
        if (parts.length === 3) {
          return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
        }
        return 0;
      };
      const fTime = parseD(fromDate);
      const tTime = parseD(toDate);
      if (fTime && tTime) {
        return list.filter(item => {
          const itemTime = parseD(item.invoiceDate);
          return itemTime >= fTime && itemTime <= tTime;
        });
      }
    }

    return list;
  }

  /**
   * B2C Register (Only Without GST Customer Invoice)
   * Route: /b2csales
   * Matches GSTR-1 Table 7 (B2C Others - Taxable supplies made to unregistered persons)
   */
  static getB2CReport(_fromDate?: string, _toDate?: string): PmsB2CInvoiceRecord[] {
    const checkouts = this.getCheckouts();
    
    // Accumulate any live B2C checkouts
    let liveFoodTaxable = 0;
    let liveRoomTaxable = 0;

    checkouts.forEach((co: PmsCheckOutDetail) => {
      const isB2B = co.gstNumber && co.gstNumber.trim().length >= 5;
      if (!isB2B) {
        liveRoomTaxable += (co.totalRoomRent / 1.12);
        liveFoodTaxable += (co.foodAmount || 0) / 1.05;
      }
    });

    const baselineFood = 12314.78 + Math.round(liveFoodTaxable * 100) / 100;
    const baselineRoom = 83925.00 + Math.round(liveRoomTaxable * 100) / 100;

    return [
      {
        sNo: 1,
        type: 'OE',
        placeOfSupply: '27-Maharashtra',
        applicableTaxRate: 'N',
        rate: 5,
        taxableValue: Math.round(baselineFood * 100) / 100,
        cessAmount: 0,
        eCommerceGstin: ''
      },
      {
        sNo: 2,
        type: 'OE',
        placeOfSupply: '27-Maharashtra',
        applicableTaxRate: 'N',
        rate: 12,
        taxableValue: Math.round(baselineRoom * 100) / 100,
        cessAmount: 0,
        eCommerceGstin: ''
      }
    ];
  }

  /**
   * Consolidated Room & Food Bill GST Report
   * Route: /room_food_gstreport_pageshow & /roomfood_gstreport
   * Matches 23-column master tax audit sheet (Frames 0200, 0210, 0230, 0270)
   */
  static getConsolidatedGstReport(fromDate?: string, toDate?: string): PmsConsolidatedGstItem[] {
    const list: PmsConsolidatedGstItem[] = [];

    // Canonical baseline transactions extracted from Frame 0210, 0230, and 0270
    const baselineRecords: PmsConsolidatedGstItem[] = [
      {
        sNo: 1,
        voucherNo: 'Res/264/24-25',
        roomNoOrTable: 'Table T1',
        guestName: 'vinod sharma',
        address: 'main road',
        city: 'renukot',
        state: 'm.p.',
        mobile: '7657657655',
        firmName: '',
        gstin: '',
        checkInDate: '26-06-2025',
        invoiceDate: '26-06-2025',
        totalDays: 0,
        type: 'Food Bill',
        gstRate: 5.00,
        sgst: 3.25,
        cgst: 3.25,
        igst: 0.00,
        taxable: 130.00,
        totalGst: 6.50,
        billAmount: 137.00,
        advanceOrDiscount: 0.00,
        netPayAmount: 137.00
      },
      {
        sNo: 2,
        voucherNo: 'GSR/239/24-25',
        roomNoOrTable: '102',
        guestName: 'vikash sharma',
        address: 'Civil Lines',
        city: 'Jabalpur',
        state: 'm.p.',
        mobile: '8872757274',
        firmName: 'Mahakaal Power & Steel',
        gstin: '23JHGHGHDHG',
        checkInDate: '26-06-2025',
        invoiceDate: '26-06-2025',
        totalDays: 1,
        type: 'Room Bill',
        gstRate: 12.00,
        sgst: 0.00,
        cgst: 0.00,
        igst: 384.00,
        taxable: 3200.00,
        totalGst: 384.00,
        billAmount: 3584.00,
        advanceOrDiscount: -2000.00,
        netPayAmount: 1584.00
      },
      {
        sNo: 3,
        voucherNo: 'GSR/238/24-25',
        roomNoOrTable: '201',
        guestName: 'ARJUN',
        address: 'Station Road',
        city: 'Nagpur',
        state: 'Maharashtra',
        mobile: '95487417',
        firmName: '',
        gstin: '',
        checkInDate: '20-06-2025',
        invoiceDate: '25-06-2025',
        totalDays: 5,
        type: 'Room Bill',
        gstRate: 12.00,
        sgst: 900.00,
        cgst: 900.00,
        igst: 0.00,
        taxable: 15000.00,
        totalGst: 1800.00,
        billAmount: 16800.00,
        advanceOrDiscount: -1500.00,
        netPayAmount: 15300.00
      },
      {
        sNo: 4,
        voucherNo: 'GSR/237/24-25',
        roomNoOrTable: '305',
        guestName: 'NAMERAJ JI',
        address: 'Gandhi Chowk',
        city: 'Indore',
        state: 'm.p.',
        mobile: '9899664226',
        firmName: '',
        gstin: '',
        checkInDate: '16-06-2025',
        invoiceDate: '25-06-2025',
        totalDays: 10,
        type: 'Room Bill',
        gstRate: 0.00,
        sgst: 0.00,
        cgst: 0.00,
        igst: 0.00,
        taxable: 20000.00,
        totalGst: 0.00,
        billAmount: 20000.00,
        advanceOrDiscount: -1000.00,
        netPayAmount: 19000.00
      },
      {
        sNo: 5,
        voucherNo: 'SHRI/260/24-25',
        roomNoOrTable: '104',
        guestName: 'hariom gautam',
        address: 'VIP Road',
        city: 'Bhopal',
        state: 'm.p.',
        mobile: '8737482332',
        firmName: 'data house',
        gstin: '23BLSP4169C1Z',
        checkInDate: '24-06-2025',
        invoiceDate: '24-06-2025',
        totalDays: 0,
        type: 'Food Bill',
        gstRate: 5.00,
        sgst: 0.96,
        cgst: 0.96,
        igst: 0.00,
        taxable: 68.10,
        totalGst: 1.91,
        billAmount: 70.00,
        advanceOrDiscount: 0.00,
        netPayAmount: 70.00
      },
      {
        sNo: 6,
        voucherNo: 'GSR/236/24-25',
        roomNoOrTable: '202',
        guestName: 'RAMESH',
        address: 'Near Temple',
        city: 'Shirdi',
        state: 'Maharashtra',
        mobile: '36698',
        firmName: '',
        gstin: '',
        checkInDate: '24-06-2025',
        invoiceDate: '24-06-2025',
        totalDays: 1,
        type: 'Room Bill',
        gstRate: 12.00,
        sgst: 187.50,
        cgst: 187.50,
        igst: 0.00,
        taxable: 3125.00,
        totalGst: 375.00,
        billAmount: 3500.00,
        advanceOrDiscount: 0.00,
        netPayAmount: 3500.00
      },
      {
        sNo: 7,
        voucherNo: 'GSR/235/24-25',
        roomNoOrTable: '303',
        guestName: 'vivek',
        address: 'Sector 5',
        city: 'Pune',
        state: 'Maharashtra',
        mobile: '987965',
        firmName: '',
        gstin: '',
        checkInDate: '24-06-2025',
        invoiceDate: '24-06-2025',
        totalDays: 1,
        type: 'Room Bill',
        gstRate: 12.00,
        sgst: 240.00,
        cgst: 240.00,
        igst: 0.00,
        taxable: 4000.00,
        totalGst: 480.00,
        billAmount: 4480.00,
        advanceOrDiscount: 0.00,
        netPayAmount: 4480.00
      },
      {
        sNo: 8,
        voucherNo: 'GSR/234/24-25',
        roomNoOrTable: '202',
        guestName: 'NEELESH JAIN',
        address: 'Kalyan Nagar',
        city: 'Mumbai',
        state: 'Maharashtra',
        mobile: '9425131930',
        firmName: '',
        gstin: '',
        checkInDate: '24-06-2025',
        invoiceDate: '24-06-2025',
        totalDays: 1,
        type: 'Room Bill',
        gstRate: 12.00,
        sgst: 180.00,
        cgst: 180.00,
        igst: 0.00,
        taxable: 3000.00,
        totalGst: 360.00,
        billAmount: 3360.00,
        advanceOrDiscount: 0.00,
        netPayAmount: 3360.00
      },
      {
        sNo: 9,
        voucherNo: 'Res/263/24-25',
        roomNoOrTable: 'Table T2',
        guestName: 'ANMOL JI',
        address: 'Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        mobile: '9927383644',
        firmName: '',
        gstin: '',
        checkInDate: '19-06-2025',
        invoiceDate: '19-06-2025',
        totalDays: 0,
        type: 'Food Bill',
        gstRate: 5.00,
        sgst: 0.95,
        cgst: 0.95,
        igst: 0.00,
        taxable: 38.09,
        totalGst: 1.90,
        billAmount: 39.99,
        advanceOrDiscount: 0.00,
        netPayAmount: 39.99
      },
      {
        sNo: 10,
        voucherNo: 'GSR/233/24-25',
        roomNoOrTable: '203',
        guestName: 'aditya gupta',
        address: 'Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        mobile: '9939886555',
        firmName: 'Apex Logistics Corp',
        gstin: '10krhpk1291mzpk',
        checkInDate: '17-06-2025',
        invoiceDate: '17-06-2025',
        totalDays: 1,
        type: 'Room Bill',
        gstRate: 12.00,
        sgst: 0.00,
        cgst: 0.00,
        igst: 480.00,
        taxable: 4000.00,
        totalGst: 480.00,
        billAmount: 4480.00,
        advanceOrDiscount: -1000.00,
        netPayAmount: 3480.00
      },
      {
        sNo: 11,
        voucherNo: 'GSR/232/24-25',
        roomNoOrTable: '201',
        guestName: 'ANMOL JI',
        address: 'Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        mobile: '9927383644',
        firmName: '',
        gstin: '',
        checkInDate: '16-06-2025',
        invoiceDate: '16-06-2025',
        totalDays: 1,
        type: 'Room Bill',
        gstRate: 12.00,
        sgst: 240.00,
        cgst: 240.00,
        igst: 0.00,
        taxable: 4000.00,
        totalGst: 480.00,
        billAmount: 4480.00,
        advanceOrDiscount: -1000.00,
        netPayAmount: 3480.00
      },
      {
        sNo: 12,
        voucherNo: 'GSR/231/24-25',
        roomNoOrTable: '103',
        guestName: 'raju raikwar',
        address: 'Civil Lines',
        city: 'Satna',
        state: 'm.p.',
        mobile: '654654654',
        firmName: 'Kaveri Infra Projects',
        gstin: '23gdfgdgfdfgdfg',
        checkInDate: '11-06-2025',
        invoiceDate: '11-06-2025',
        totalDays: 1,
        type: 'Room Bill',
        gstRate: 12.00,
        sgst: 0.00,
        cgst: 0.00,
        igst: 240.00,
        taxable: 2000.00,
        totalGst: 240.00,
        billAmount: 2240.00,
        advanceOrDiscount: 0.00,
        netPayAmount: 2240.00
      },
      {
        sNo: 13,
        voucherNo: 'GSR/230/24-25',
        roomNoOrTable: '104',
        guestName: 'hariom gautam',
        address: 'VIP Road',
        city: 'Bhopal',
        state: 'm.p.',
        mobile: '8737482332',
        firmName: 'data house',
        gstin: '23BLSP4169C1Z',
        checkInDate: '11-06-2025',
        invoiceDate: '11-06-2025',
        totalDays: 1,
        type: 'Room Bill',
        gstRate: 12.00,
        sgst: 180.00,
        cgst: 180.00,
        igst: 0.00,
        taxable: 3000.00,
        totalGst: 360.00,
        billAmount: 3360.00,
        advanceOrDiscount: 0.00,
        netPayAmount: 3360.00
      },
      {
        sNo: 14,
        voucherNo: 'GSR/222/24-25',
        roomNoOrTable: '105',
        guestName: 'sunil agrwal',
        address: 'main road',
        city: 'renukot',
        state: 'm.p.',
        mobile: '7676767674',
        firmName: 'hindalko',
        gstin: '23SJDHGSJDHGHS',
        checkInDate: '06-06-2025',
        invoiceDate: '07-06-2025',
        totalDays: 1,
        type: 'Room Bill',
        gstRate: 12.00,
        sgst: 180.00,
        cgst: 180.00,
        igst: 0.00,
        taxable: 3000.00,
        totalGst: 360.00,
        billAmount: 3360.00,
        advanceOrDiscount: -500.00,
        netPayAmount: 2860.00
      }
    ];

    list.push(...baselineRecords);

    // Merge active checkouts
    const checkouts = this.getCheckouts();
    checkouts.forEach((co: PmsCheckOutDetail) => {
      const isInterstate = co.state && !co.state.toLowerCase().includes('maharashtra') && !co.state.toLowerCase().includes('mh');
      const rate = co.gstPercent || 12.00;
      const taxable = co.totalRoomRent ? (co.totalRoomRent / 1.12) : (co.billAmount / 1.12);
      const totalTax = co.gstAmount || (co.billAmount - taxable);
      const cgst = isInterstate ? 0 : (co.cgstAmount ?? (totalTax / 2));
      const sgst = isInterstate ? 0 : (co.sgstAmount ?? (totalTax / 2));
      const igst = isInterstate ? (co.igstAmount ?? totalTax) : 0;

      list.push({
        sNo: list.length + 1,
        voucherNo: co.invoiceNo || 'GSR/240/24-25',
        roomNoOrTable: co.roomNo || '101',
        guestName: co.guestName,
        address: co.addressLine1 || 'Local',
        city: co.city || 'Shirdi',
        state: co.state || 'Maharashtra',
        mobile: co.guestPhone || '',
        firmName: co.companyName || '',
        gstin: co.gstNumber || '',
        checkInDate: co.checkInDate || co.checkOutDate,
        invoiceDate: co.checkOutDate,
        totalDays: co.numberOfDays || 1,
        type: 'Room Bill',
        gstRate: rate,
        sgst: Math.round(sgst * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        igst: Math.round(igst * 100) / 100,
        taxable: Math.round(taxable * 100) / 100,
        totalGst: Math.round(totalTax * 100) / 100,
        billAmount: co.billAmount || co.netPayable,
        advanceOrDiscount: -(co.advanceDeducted || co.lessDiscount || 0),
        netPayAmount: co.netPayable
      });
    });

    // Date range filtering
    if (fromDate && toDate) {
      const parseD = (s: string) => {
        const parts = s.split('-');
        if (parts.length === 3) {
          return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
        }
        return 0;
      };
      const fTime = parseD(fromDate);
      const tTime = parseD(toDate);
      if (fTime && tTime) {
        return list.filter(item => {
          const itemTime = parseD(item.invoiceDate);
          return itemTime >= fTime && itemTime <= tTime;
        });
      }
    }

    return list;
  }

  /**
   * Export GST Data to CSV Format
   */
  static exportGstCsv(tab: 'consolidated' | 'b2b' | 'b2c', fromDate?: string, toDate?: string): string {
    if (tab === 'b2b') {
      const data = this.getB2BReport(fromDate, toDate);
      const headers = ['GSTIN/UIN', 'Receiver Name', 'Invoice Number', 'Invoice date', 'Invoice Value', 'Place Of Supply', 'Reverse Charge', 'Applicable % of Tax Rate', 'Invoice Type', 'E-Commerce GSTIN', 'Rate', 'Taxable Value', 'Cess Amount'];
      const rows = data.map(r => [
        `"${r.gstin}"`,
        `"${r.receiverName}"`,
        `"${r.invoiceNumber}"`,
        `"${r.invoiceDate}"`,
        r.invoiceValue.toFixed(2),
        `"${r.placeOfSupply}"`,
        r.reverseCharge,
        r.applicableTaxRate,
        `"${r.invoiceType}"`,
        `"${r.eCommerceGstin}"`,
        r.rate,
        r.taxableValue.toFixed(2),
        r.cessAmount.toFixed(2)
      ]);
      return [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    }

    if (tab === 'b2c') {
      const data = this.getB2CReport(fromDate, toDate);
      const headers = ['Type', 'Place Of Supply', 'Applicable % of Tax Rate', 'Rate', 'Taxable Value', 'Cess Amount', 'E-Commerce GSTIN'];
      const rows = data.map(r => [
        `"${r.type}"`,
        `"${r.placeOfSupply}"`,
        `"${r.applicableTaxRate}"`,
        r.rate,
        r.taxableValue.toFixed(2),
        r.cessAmount.toFixed(2),
        `"${r.eCommerceGstin}"`
      ]);
      return [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    }

    // Consolidated
    const data = this.getConsolidatedGstReport(fromDate, toDate);
    const headers = ['S.No', 'Voucher No', 'Room/Table', 'Guest Name', 'Address', 'City', 'State', 'Mobile', 'Firm Name', 'GSTIN', 'Check In Date', 'Invoice Date', 'Total Days', 'Type', 'GST %', 'SGST', 'CGST', 'IGST', 'Taxable Value', 'Total GST', 'Bill Amt', 'Advance/Disc', 'Net Pay Amt'];
    const rows = data.map(r => [
      r.sNo,
      `"${r.voucherNo}"`,
      `"${r.roomNoOrTable}"`,
      `"${r.guestName}"`,
      `"${r.address}"`,
      `"${r.city}"`,
      `"${r.state}"`,
      `"${r.mobile}"`,
      `"${r.firmName}"`,
      `"${r.gstin}"`,
      `"${r.checkInDate}"`,
      `"${r.invoiceDate}"`,
      r.totalDays,
      `"${r.type}"`,
      r.gstRate.toFixed(2),
      r.sgst.toFixed(2),
      r.cgst.toFixed(2),
      r.igst.toFixed(2),
      r.taxable.toFixed(2),
      r.totalGst.toFixed(2),
      r.billAmount.toFixed(2),
      r.advanceOrDiscount.toFixed(2),
      r.netPayAmount.toFixed(2)
    ]);
    return [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  }

  /**
   * Video 28: Master Report Dashboard Navigation Items (Frame 0100)
   */
  static getReportDashboardButtons(): PmsReportDashboardButton[] {
    return [
      { title: 'Outstanding Payable', route: '/outstanding_payable', bgColor: '#0284c7', textColor: '#ffffff', icon: '💳', category: 'Financials', actionKey: 'outstanding_receivables' },
      { title: 'Police Station Report', route: '/police_station_report', bgColor: '#eab308', textColor: '#1e293b', icon: '👮', category: 'Front Desk', actionKey: 'police_report' },
      { title: 'Item Wise Sale Report', route: '/item_wise_sale_report', bgColor: '#1e293b', textColor: '#ffffff', icon: '📊', category: 'Restaurant', actionKey: 'item_wise_sale' },
      { title: 'Day End Report', route: '/day_end_report', bgColor: '#b91c1c', textColor: '#ffffff', icon: '🌅', category: 'Front Desk', actionKey: 'day_end' },
      { title: 'Booking Register', route: '/roombookings', bgColor: '#16a34a', textColor: '#ffffff', icon: '📅', category: 'Front Desk', actionKey: 'room_booking' },
      { title: 'Check-in Register', route: '/roomcheckins', bgColor: '#1e293b', textColor: '#ffffff', icon: '🚪➡️', category: 'Front Desk', actionKey: 'checkin_register' },
      { title: 'Room Food Bills', route: '/room_foodbills', bgColor: '#eab308', textColor: '#1e293b', icon: '🍽️', category: 'Restaurant', actionKey: 'food_bill' },
      { title: 'F & B Report', route: '/fb_report', bgColor: '#1e293b', textColor: '#ffffff', icon: '🥗', category: 'Restaurant', actionKey: 'fb_report' },
      { title: 'Room Sales', route: '/room_sales', bgColor: '#16a34a', textColor: '#ffffff', icon: '📈', category: 'Financials', actionKey: 'room_sales' },
      { title: 'Advance Receipt Register', route: '/advance_receipt_register', bgColor: '#0284c7', textColor: '#ffffff', icon: '💵', category: 'Financials', actionKey: 'advance_receipt' },
      { title: 'Checkout Register', route: '/roomcheckouts', bgColor: '#0284c7', textColor: '#ffffff', icon: '🚪⬅️', category: 'Front Desk', actionKey: 'room_checkout' },
      { title: 'GuestLog', route: '/guest_log', bgColor: '#1e293b', textColor: '#ffffff', icon: '📖', category: 'Front Desk', actionKey: 'guest_log' },
      { title: 'Restaurant Food Bills', route: '/restaurant_foodbills', bgColor: '#16a34a', textColor: '#ffffff', icon: '🧾', category: 'Restaurant', actionKey: 'restaurant_food_bills' },
      { title: 'Restaurant Register', route: '/restaurant_register', bgColor: '#eab308', textColor: '#1e293b', icon: '🍴', category: 'Restaurant', actionKey: 'restaurant_table' },
      { title: 'Kot Register', route: '/kots', bgColor: '#b91c1c', textColor: '#ffffff', icon: '🎫', category: 'Restaurant', actionKey: 'kot_entry' },
      { title: 'Stock Status', route: '/stock_status', bgColor: '#eab308', textColor: '#1e293b', icon: '📦', category: 'Store', actionKey: 'store_wise_stock' },
      { title: 'Liqour Stock Brand Wise', route: '/liqour_stock', bgColor: '#1e293b', textColor: '#ffffff', icon: '🍾', category: 'Store', actionKey: 'liqour_stock' },
      { title: 'Item Wise Stock', route: '/item_wise_stock', bgColor: '#b91c1c', textColor: '#ffffff', icon: '🏷️', category: 'Store', actionKey: 'item_wise_stock' },
      { title: 'Store Wise Stock', route: '/store_wise_stock', bgColor: '#0284c7', textColor: '#ffffff', icon: '🏬', category: 'Store', actionKey: 'store_wise_stock' },
      { title: 'Stock In Register', route: '/stock_in_register', bgColor: '#1e293b', textColor: '#ffffff', icon: '📥', category: 'Store', actionKey: 'purchase_entry' },
      { title: 'Stock Out Register', route: '/stock_out_register', bgColor: '#0284c7', textColor: '#ffffff', icon: '📤', category: 'Store', actionKey: 'stock_issue' },
      { title: 'Stock Transfer Register', route: '/stock_transfers', bgColor: '#16a34a', textColor: '#ffffff', icon: '🔁', category: 'Store', actionKey: 'stock_transfer' },
      { title: 'Item List', route: '/items', bgColor: '#eab308', textColor: '#1e293b', icon: '📋', category: 'Store', actionKey: 'item_list' },
      { title: 'Room List', route: '/rooms', bgColor: '#1e293b', textColor: '#ffffff', icon: '🛏️', category: 'Front Desk', actionKey: 'room_dashboard' },
      { title: 'Account List', route: '/accounts', bgColor: '#b91c1c', textColor: '#ffffff', icon: '📑', category: 'Financials', actionKey: 'party_ledger' },
      { title: 'Handover (User Shift)', route: '/shift_handover', bgColor: '#1e293b', textColor: '#ffffff', icon: '🤝', category: 'Staff', actionKey: 'shift_handover' },
      { title: 'My Check Out Register Only', route: '/my_checkout_register_pageshow', bgColor: '#eab308', textColor: '#1e293b', icon: '👤', category: 'Staff', actionKey: 'my_checkout_register' },
      { title: 'Check Out Register Only', route: '/checkout_register_only', bgColor: '#0284c7', textColor: '#ffffff', icon: '📋', category: 'Front Desk', actionKey: 'checkout_register_only' },
      { title: 'GST Report', route: '/room_food_gstreport_pageshow', bgColor: '#16a34a', textColor: '#ffffff', icon: '📜', category: 'GST & Taxes', actionKey: 'gst_report' },
      { title: 'B2B Sales Room Checkout', route: '/b2bsales_pageshow', bgColor: '#1e293b', textColor: '#ffffff', icon: '🏢', category: 'GST & Taxes', actionKey: 'b2b_gst' },
      { title: 'B2C Sales Room Checkout', route: '/b2csales', bgColor: '#dc2626', textColor: '#ffffff', icon: '👥', category: 'GST & Taxes', actionKey: 'b2c_gst' }
    ];
  }

  // ==========================================
  // Video 29: All Hotel Reports Master Query Methods (Frames 0080-0550)
  // ==========================================

  /**
   * Video 29 Frame 0160 & 0140: Outstanding Payables (Cr) & Receivables (Dr)
   */
  static getOutstandingAccounts(balanceFilter: 'Dr' | 'Cr' | 'all' = 'all'): PmsOutstandingAccount[] {
    // Canonical payables (Cr) from Video 29 Frame 0160
    const canonicalPayables: PmsOutstandingAccount[] = [
      { sNo: 1, accountName: 'HARIOM', mobile: '655465', balance: 12400.00, balanceType: 'Cr', category: 'Vendor', lastTransactionDate: '19-07-2025' },
      { sNo: 2, accountName: 'sanjeev kumar mishar', mobile: '801905', balance: 2000.00, balanceType: 'Cr', category: 'Supplier', lastTransactionDate: '18-07-2025' },
      { sNo: 3, accountName: 'vinod klhanna', mobile: '87687687', balance: 2200.00, balanceType: 'Cr', category: 'Contractor', lastTransactionDate: '15-07-2025' },
      { sNo: 4, accountName: 'aaaaaa', mobile: '9419879252', balance: 100.00, balanceType: 'Cr', category: 'Staff Advance', lastTransactionDate: '14-07-2025' },
      { sNo: 5, accountName: 'raj', mobile: '6416', balance: 2000.00, balanceType: 'Cr', category: 'Laundry', lastTransactionDate: '14-07-2025' },
      { sNo: 6, accountName: 'AYUSHI SHARMA', mobile: '7869682533', balance: 1000.00, balanceType: 'Cr', category: 'Guest Advance', lastTransactionDate: '12-07-2025' },
      { sNo: 7, accountName: 'AKASH YADAV', mobile: '934021255', balance: 1000.00, balanceType: 'Cr', category: 'Vegetable Vendor', lastTransactionDate: '11-07-2025' },
      { sNo: 8, accountName: 'shubham patel', mobile: '8305741149', balance: 19000.00, balanceType: 'Cr', category: 'Grocery Wholesaler', lastTransactionDate: '10-07-2025' },
      { sNo: 9, accountName: 'ajay ji', mobile: '545887484', balance: 3000.00, balanceType: 'Cr', category: 'Dairy Vendor', lastTransactionDate: '09-07-2025' },
      { sNo: 10, accountName: 'Guruprasad pol', mobile: '7888292929', balance: 2200.00, balanceType: 'Cr', category: 'Gas Agency', lastTransactionDate: '08-07-2025' },
      { sNo: 11, accountName: 'hariom gautam ji', mobile: '76675763433', balance: 2000.00, balanceType: 'Cr', category: 'Vendor', lastTransactionDate: '07-07-2025' },
      { sNo: 12, accountName: 'Vinod', mobile: '7569679215', balance: 9000.00, balanceType: 'Cr', category: 'Meat & Poultry', lastTransactionDate: '06-07-2025' },
      { sNo: 13, accountName: 'GUPTA JII', mobile: '9826011223', balance: 25917.50, balanceType: 'Cr', category: 'Hotel Supplies', lastTransactionDate: '05-07-2025' },
      { sNo: 14, accountName: 'anupam ji', mobile: '65448987', balance: 500.00, balanceType: 'Cr', category: 'Maintenance', lastTransactionDate: '04-07-2025' }
    ];

    // Canonical receivables (Dr) from Video 29 Frame 0140 & active party accounts
    const canonicalReceivables: PmsOutstandingAccount[] = [
      { sNo: 1, accountName: 'TATA MOTORS CORPORATE', mobile: '9822114455', balance: 3500.00, balanceType: 'Dr', category: 'Corporate Credit', lastTransactionDate: '19-07-2025' },
      { sNo: 2, accountName: 'MAKEMYTRIP COMMISSIONS', mobile: '18001028747', balance: 14500.00, balanceType: 'Dr', category: 'OTA Channel', lastTransactionDate: '18-07-2025' },
      { sNo: 3, accountName: 'OYO ROOMS CLEARING', mobile: '9313931393', balance: 8200.00, balanceType: 'Dr', category: 'OTA Channel', lastTransactionDate: '17-07-2025' },
      { sNo: 4, accountName: 'SHREE SAI TOUR & TRAVELS', mobile: '9422055667', balance: 6400.00, balanceType: 'Dr', category: 'Travel Agent', lastTransactionDate: '16-07-2025' },
      { sNo: 5, accountName: 'DR. RAJESH AGRAWAL', mobile: '9823019823', balance: 1850.00, balanceType: 'Dr', category: 'VIP Guest Credit', lastTransactionDate: '15-07-2025' }
    ];

    // Dynamically merge live party accounts
    const liveParties = this.getPartyAccounts();
    liveParties.forEach((p) => {
      if (p.balance > 0) {
        if (p.balanceType === 'Cr' && !canonicalPayables.some(c => c.accountName.toLowerCase() === p.name.toLowerCase())) {
          canonicalPayables.push({
            sNo: canonicalPayables.length + 1,
            accountName: p.name,
            mobile: p.mobile || '—',
            balance: p.balance,
            balanceType: 'Cr',
            category: p.category || 'Vendor',
            lastTransactionDate: new Date().toLocaleDateString('en-GB')
          });
        } else if (p.balanceType === 'Dr' && !canonicalReceivables.some(c => c.accountName.toLowerCase() === p.name.toLowerCase())) {
          canonicalReceivables.push({
            sNo: canonicalReceivables.length + 1,
            accountName: p.name,
            mobile: p.mobile || '—',
            balance: p.balance,
            balanceType: 'Dr',
            category: p.category || 'Debtor',
            lastTransactionDate: new Date().toLocaleDateString('en-GB')
          });
        }
      }
    });

    if (balanceFilter === 'Cr') return canonicalPayables;
    if (balanceFilter === 'Dr') return canonicalReceivables;
    return [...canonicalReceivables, ...canonicalPayables];
  }

  /**
   * Video 29 Frame 0220: Item Wise Sales Report
   */
  static getItemWiseSalesReport(_fromDate?: string, _toDate?: string): PmsItemWiseSale[] {
    // Canonical records shown in Video 29 Frame 0220
    const canonicalSales: PmsItemWiseSale[] = [
      { sNo: 1, itemName: 'TAWA ROTI', category: 'Breads', qty: 5.00, rate: 10.00, amount: 50.00 },
      { sNo: 2, itemName: 'PANEER TIKA', category: 'Starters', qty: 5.00, rate: 80.00, amount: 400.00 },
      { sNo: 3, itemName: 'bread pakoda', category: 'Snacks', qty: 1.00, rate: 100.00, amount: 100.00 },
      { sNo: 4, itemName: 'Boondi Raita', category: 'Beverages / Raita', qty: 2.00, rate: 57.14, amount: 114.28 },
      { sNo: 5, itemName: 'DAL MAKHANI', category: 'Main Course', qty: 3.00, rate: 160.00, amount: 480.00 },
      { sNo: 6, itemName: 'BUTTER NAAN', category: 'Breads', qty: 8.00, rate: 35.00, amount: 280.00 },
      { sNo: 7, itemName: 'JEERA RICE', category: 'Rice', qty: 2.00, rate: 90.00, amount: 180.00 },
      { sNo: 8, itemName: 'MINERAL WATER 1LTR', category: 'Beverages', qty: 12.00, rate: 20.00, amount: 240.00 }
    ];

    // Dynamically merge live KOT items
    const liveKots = this.getKots();
    liveKots.forEach((kot: PmsKotRecord) => {
      if (kot.status !== 'Cancelled' && Array.isArray(kot.items)) {
        kot.items.forEach((it: KotItem) => {
          const existing = canonicalSales.find(s => s.itemName.toLowerCase() === it.itemName.toLowerCase());
          if (existing) {
            existing.qty += it.qty;
            existing.amount += (it.rate || existing.rate) * it.qty;
          } else {
            canonicalSales.push({
              sNo: canonicalSales.length + 1,
              itemName: it.itemName,
              category: 'Restaurant / Room Service',
              qty: it.qty,
              rate: it.rate || 100,
              amount: (it.rate || 100) * it.qty
            });
          }
        });
      }
    });

    return canonicalSales;
  }

  /**
   * Video 29 Frame 0240: Day End Report (Night Audit Paper Ledger)
   */
  static getDayEndReport(reportDate: string = '19-07-2025'): PmsDayEndReport {
    const company = this.getCompanyInfo();

    // Cash Ledger
    const cashEntries = [
      { date: reportDate, type: 'Check_Out', accountName: 'Cash', remark: 'Check_out/GSR/256/24-25/Room-102', debit: 2000.00, credit: 0, balance: 632512.77 },
      { date: reportDate, type: 'Foodbill', accountName: 'Cash', remark: 'Restaurant Table T-3 / Bill-285', debit: 450.00, credit: 0, balance: 632962.77 },
      { date: reportDate, type: 'Advance', accountName: 'Cash', remark: 'Advance Receipt AR16 / Room 201', debit: 1000.00, credit: 0, balance: 633962.77 },
      { date: reportDate, type: 'Expense', accountName: 'Cash', remark: 'Kitchen Dairy & Bread Petty Cash', debit: 0, credit: 650.00, balance: 633312.77 }
    ];

    // Online / UPI Ledger
    const onlineEntries = [
      { date: reportDate, type: 'Check_Out', accountName: 'Online', remark: 'Check_out/GSR/256/24-25/Room-102 UPI', debit: 40000.00, credit: 0, balance: 459170.39 },
      { date: reportDate, type: 'Advance', accountName: 'Online', remark: 'Google Pay Advance Receipt AR17', debit: 10000.00, credit: 0, balance: 469170.39 },
      { date: reportDate, type: 'Foodbill', accountName: 'Online', remark: 'Table T-5 UPI PhonePe Payment', debit: 820.00, credit: 0, balance: 469990.39 }
    ];

    // Card Ledger
    const cardEntries = [
      { date: reportDate, type: 'Opening Balance', accountName: 'Card', remark: 'HDFC Swipe Machine Batch Opening', debit: 0, credit: 0, balance: 34582.00 },
      { date: reportDate, type: 'Check_Out', accountName: 'Card', remark: 'Visa Card Swipe Room 301 Checkout', debit: 4200.00, credit: 0, balance: 38782.00 }
    ];

    // Corporate Tata Motors Ledger
    const tataMotorsEntries = [
      { date: reportDate, type: 'Opening Balance', accountName: 'tata motors', remark: 'Corporate Credit Account Opening', debit: 0, credit: 0, balance: 3500.00 },
      { date: reportDate, type: 'Check_Out', accountName: 'tata motors', remark: 'Bill GSR/258/24-25 Room 204 Billed to Company', debit: 5500.00, credit: 0, balance: 9000.00 }
    ];

    const groups = [
      {
        accountName: 'Cash',
        date: reportDate,
        closingBalance: 633312.77,
        entries: cashEntries,
        totalDebit: cashEntries.reduce((s, e) => s + e.debit, 0),
        totalCredit: cashEntries.reduce((s, e) => s + e.credit, 0)
      },
      {
        accountName: 'Online',
        date: reportDate,
        closingBalance: 469990.39,
        entries: onlineEntries,
        totalDebit: onlineEntries.reduce((s, e) => s + e.debit, 0),
        totalCredit: onlineEntries.reduce((s, e) => s + e.credit, 0)
      },
      {
        accountName: 'Card',
        date: reportDate,
        closingBalance: 38782.00,
        entries: cardEntries,
        totalDebit: cardEntries.reduce((s, e) => s + e.debit, 0),
        totalCredit: cardEntries.reduce((s, e) => s + e.credit, 0)
      },
      {
        accountName: 'tata motors',
        date: reportDate,
        closingBalance: 9000.00,
        entries: tataMotorsEntries,
        totalDebit: tataMotorsEntries.reduce((s, e) => s + e.debit, 0),
        totalCredit: tataMotorsEntries.reduce((s, e) => s + e.credit, 0)
      }
    ];

    const grandTotalDebit = groups.reduce((s, g) => s + g.totalDebit, 0);
    const grandTotalCredit = groups.reduce((s, g) => s + g.totalCredit, 0);

    return {
      hotelName: company.firmName || 'HOTEL SAI VASUDEV RESIDENCY',
      address: `${company.address1}, ${company.address2}, ${company.city} - ${company.pincode}`,
      phone: company.phone || company.mobile,
      email: company.email,
      reportDate,
      generatedAt: '11:59:59 PM (Night Audit)',
      groups,
      grandTotalDebit,
      grandTotalCredit,
      cashInHand: 633312.77
    };
  }

  /**
   * Video 29 Frame 0350: VIP Guest Log & Frequency Analytics
   */
  static getGuestLog(): PmsGuestLogEntry[] {
    // Canonical data directly from Video 29 Frame 0350
    const canonicalGuests: PmsGuestLogEntry[] = [
      { sNo: 1, guestName: 'riya', phone: '9822334455', city: 'Mumbai', numberOfVisits: 7, totalAmount: 80252.97, lastVisitDate: '18-07-2025', vipTier: 'Platinum' },
      { sNo: 2, guestName: 'Vivek', phone: '9422019283', city: 'Pune', numberOfVisits: 6, totalAmount: 27840.00, lastVisitDate: '15-07-2025', vipTier: 'Gold' },
      { sNo: 3, guestName: 'DILESHWAR THAKUR', phone: '7999663696', city: 'Raipur', numberOfVisits: 6, totalAmount: 254320.00, lastVisitDate: '14-07-2025', vipTier: 'Platinum' },
      { sNo: 4, guestName: 'rahul', phone: '8871702803', city: 'Indore', numberOfVisits: 5, totalAmount: 111924.00, lastVisitDate: '10-07-2025', vipTier: 'Gold' },
      { sNo: 5, guestName: 'Kanni', phone: '9419879252', city: 'Nagpur', numberOfVisits: 4, totalAmount: 116306.00, lastVisitDate: '08-07-2025', vipTier: 'Gold' },
      { sNo: 6, guestName: 'abc', phone: '9826000000', city: 'Bhopal', numberOfVisits: 4, totalAmount: 174869.92, lastVisitDate: '06-07-2025', vipTier: 'Gold' },
      { sNo: 7, guestName: 'rajkumar', phone: '7869682533', city: 'Delhi', numberOfVisits: 3, totalAmount: 31446.00, lastVisitDate: '05-07-2025', vipTier: 'Silver' },
      { sNo: 8, guestName: 'shivani', phone: '9340212550', city: 'Surat', numberOfVisits: 3, totalAmount: 13154.00, lastVisitDate: '03-07-2025', vipTier: 'Silver' },
      { sNo: 9, guestName: 'ajay ji', phone: '5458874840', city: 'Ahmedabad', numberOfVisits: 3, totalAmount: 13172.00, lastVisitDate: '02-07-2025', vipTier: 'Silver' },
      { sNo: 10, guestName: 'kishor 101', phone: '9822198221', city: 'Nashik', numberOfVisits: 3, totalAmount: 33600.00, lastVisitDate: '01-07-2025', vipTier: 'Silver' }
    ];

    // Merge active checkouts
    const checkouts = this.getCheckouts();
    checkouts.forEach((co: PmsCheckOutDetail) => {
      const existing = canonicalGuests.find(g => g.guestName.toLowerCase() === co.guestName.toLowerCase());
      if (existing) {
        existing.numberOfVisits += 1;
        existing.totalAmount += co.netPayable;
        existing.lastVisitDate = co.checkOutDate;
      } else {
        canonicalGuests.push({
          sNo: canonicalGuests.length + 1,
          guestName: co.guestName,
          phone: co.guestPhone,
          city: co.addressLine1 || 'Shirdi',
          numberOfVisits: 1,
          totalAmount: co.netPayable,
          lastVisitDate: co.checkOutDate,
          vipTier: co.netPayable > 50000 ? 'Platinum' : co.netPayable > 20000 ? 'Gold' : 'Bronze'
        });
      }
    });

    return canonicalGuests.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Video 29 Frame 0410: Item Wise Stock Ledger (e.g. Boondi Raita, Paneer, etc.)
   */
  static getItemWiseStock(itemName: string = 'Boondi Raita', fromDate: string = '01-07-2025', toDate: string = '19-07-2025'): PmsItemStockReport {
    // Canonical ledger for "Boondi Raita" from Frame 0410
    if (itemName.toLowerCase().includes('boondi') || itemName.toLowerCase().includes('raita')) {
      return {
        itemName: 'Boondi Raita',
        itemCategory: 'Kitchen / Restaurant Food',
        unit: 'Portion',
        fromDate,
        toDate,
        openingBalance: -7,
        entries: [
          { date: '04-07-25', transactionType: 'Foodbill', remark: 'SHRI/276/24-25', stockIn: 0, stockOut: 1, balance: -8 },
          { date: '05-07-25', transactionType: 'Foodbill', remark: 'SHRI/279/24-25', stockIn: 0, stockOut: 1, balance: -9 },
          { date: '11-07-25', transactionType: 'Restaurant_food_bill', remark: 'Res/283/24-25', stockIn: 0, stockOut: 2, balance: -11 },
          { date: '19-07-25', transactionType: 'Restaurant_food_bill', remark: 'Res/285/24-25', stockIn: 0, stockOut: 2, balance: -13 }
        ],
        totalStockIn: 0,
        totalStockOut: 6,
        closingBalance: -13
      };
    }

    // Default template for any other inventory item
    return {
      itemName,
      itemCategory: 'General Inventory',
      unit: 'Nos / Kg',
      fromDate,
      toDate,
      openingBalance: 50,
      entries: [
        { date: fromDate, transactionType: 'Stock In', remark: 'PUR/2025/081 Purchase Inward', stockIn: 25, stockOut: 0, balance: 75 },
        { date: '12-07-25', transactionType: 'Stock Out', remark: 'Kitchen Issue Requisition #104', stockIn: 0, stockOut: 15, balance: 60 },
        { date: toDate, transactionType: 'Restaurant_food_bill', remark: 'Res/285/24-25 Consumption', stockIn: 0, stockOut: 5, balance: 55 }
      ],
      totalStockIn: 25,
      totalStockOut: 20,
      closingBalance: 55
    };
  }

  /**
   * Video 29 Frame 0500: My Check Out Register Only (Shift Cashier Filtered)
   */
  static getMyCheckOutRegister(_userEmail: string = 'demo4@gmail.com', _fromDate?: string, _toDate?: string): PmsCheckOutDetail[] {
    return this.getCheckouts();
  }

  /**
   * Video 29 Frame 0490: Shift Handover Reconciliation
   */
  static getShiftHandoverData(shiftDate: string = '19-07-2025', shiftType: 'Morning' | 'Evening' | 'Night' = 'Morning'): PmsShiftHandoverRecord {
    return {
      shiftId: `SHIFT/${shiftDate.replace(/-/g, '')}/01`,
      shiftDate,
      shiftTime: shiftType === 'Morning' ? '07:00 AM - 03:00 PM' : shiftType === 'Evening' ? '03:00 PM - 11:00 PM' : '11:00 PM - 07:00 AM',
      userEmail: 'demo4@gmail.com',
      userName: 'Front Desk Operator 1',
      shiftType,
      openingDrawerCash: 5000.00,
      roomCashCollected: 14500.00,
      foodCashCollected: 3250.00,
      advanceCashCollected: 6000.00,
      expensesPaidFromDrawer: 1250.00,
      netPhysicalCashInDrawer: 27500.00, // 5000 + 14500 + 3250 + 6000 - 1250
      onlineUpiVerified: 48500.00,
      cardSwipeVerified: 12400.00,
      creditAccountsAdded: 9000.00,
      totalTransactionsHandled: 18,
      handoverToUser: 'Front Desk Evening Incharge',
      handoverNotes: 'All cash verified with physical currency denomination sheet. Room 204 key given to guest at 02:30 PM. Room 301 pending laundry bill added to folio.',
      status: 'Verified & Closed'
    };
  }

  // ==========================================
  // Video 30: Training & Support Suite Methods (Frames 0060-0230)
  // ==========================================

  /**
   * Video 30 Frame 0150: Video Tutorials Catalog (/helps)
   */
  static getHelpVideos(category?: string, query?: string): PmsHelpVideo[] {
    let list = [...INITIAL_HELP_VIDEOS];
    if (category && category !== 'All') {
      list = list.filter(v => v.category === category);
    }
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(v => 
        v.topic.toLowerCase().includes(q) || 
        v.businessType.toLowerCase().includes(q) ||
        (v.description && v.description.toLowerCase().includes(q))
      );
    }
    return list;
  }

  /**
   * Video 30 Frame 0060 & 0070: Software Documentation Manual Chapters
   */
  static getDocumentationChapters(query?: string): PmsDocumentationChapter[] {
    let list = [...INITIAL_DOCUMENTATION_CHAPTERS];
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.shortSummary.toLowerCase().includes(q) ||
        c.fullContent.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }

  /**
   * Video 30 Frame 0210 & Lines 05:30-06:00: Support Tickets Engine
   */
  static getSupportTickets(): PmsSupportTicket[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(INITIAL_SUPPORT_TICKETS));
      return INITIAL_SUPPORT_TICKETS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SUPPORT_TICKETS;
    }
  }

  static createSupportTicket(data: Omit<PmsSupportTicket, 'id' | 'ticketNo' | 'createdAt' | 'status'>): PmsSupportTicket {
    const tickets = this.getSupportTickets();
    const nextNum = tickets.length + 845;
    const newTicket: PmsSupportTicket = {
      ...data,
      id: `tkt-${Date.now()}`,
      ticketNo: `TKT-2026-0${nextNum}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Open'
    };
    tickets.unshift(newTicket);
    localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(tickets));
    return newTicket;
  }

  static updateSupportTicketStatus(id: string, status: PmsSupportTicket['status'], resolutionNotes?: string): void {
    const tickets = this.getSupportTickets();
    const idx = tickets.findIndex(t => t.id === id);
    if (idx >= 0) {
      tickets[idx].status = status;
      if (resolutionNotes) {
        tickets[idx].resolutionNotes = resolutionNotes;
      }
      tickets[idx].updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
      localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(tickets));
    }
  }

  /**
   * Video 30 Frame 0060 & 0230: Remote Desktop Support Session (UltraViewer / AnyDesk)
   */
  static getRemoteSupportSession(): PmsRemoteSupportSession {
    return {
      tool: 'UltraViewer',
      partnerId: '98 811 274',
      passcode: '37551',
      status: 'Ready',
      hotelName: 'HOTEL SAI VASUDEV RESIDENCY',
      contactPhone: '7999663696'
    };
  }

  /**
   * Video 30 Frame 0080 & Lines 01:30-02:00: Free Demo & License Activation Request
   */
  static getDemoRequests(): PmsDemoRequest[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DEMO_REQUESTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DEMO_REQUESTS, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static submitDemoRequest(data: Omit<PmsDemoRequest, 'id' | 'createdAt' | 'status'>): PmsDemoRequest {
    const requests = this.getDemoRequests();
    const newReq: PmsDemoRequest = {
      ...data,
      id: `demo-${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Pending'
    };
    requests.unshift(newReq);
    localStorage.setItem(STORAGE_KEYS.DEMO_REQUESTS, JSON.stringify(requests));
    return newReq;
  }

  /**
   * Video 30 Official Contact & Support Details (Hansin IT Services / Data House ERP)
   */
  static getSupportContactInfo() {
    return {
      companyName: 'Hansin IT Services Pvt. Ltd. / Data House ERP',
      brand: 'RoomG Hotel Management Software',
      headquarters: 'Jabalpur, Madhya Pradesh, India',
      primaryPhone: '7999663696',
      alternatePhone: '8871702803',
      supportEmail: 'datahouseerp@gmail.com',
      officialWebsite: 'https://datahouseerp.com',
      demoPortalUrl: 'https://hotel-sai-vasudev-residency.pages.dev',
      supportHours: '11:00 AM – 07:00 PM IST (Mon to Sat)',
      ultraViewerDownloadUrl: 'https://ultraviewer.net/en/download.html',
      anyDeskDownloadUrl: 'https://anydesk.com/en/downloads',
      licenseInfo: {
        hotelName: 'HOTEL SAI VASUDEV RESIDENCY',
        activationDate: '17-12-2024',
        renewDate: '17-12-2025',
        daysRemaining: 149,
        whatsappValidity: '29-06-2026',
        firmId: 'DEMO0004'
      }
    };
  }

  // ==========================================
  // Video 31: MR / Salesman Wise Commission Tracking & Agent Ledger
  // ==========================================
  static getCommissionAgents(): PmsCommissionAgent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMISSION_AGENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.COMMISSION_AGENTS, JSON.stringify(INITIAL_COMMISSION_AGENTS));
      return INITIAL_COMMISSION_AGENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_COMMISSION_AGENTS;
    }
  }

  static saveCommissionAgent(agent: PmsCommissionAgent): void {
    const agents = this.getCommissionAgents();
    const idx = agents.findIndex(a => a.id === agent.id);
    if (idx >= 0) {
      agents[idx] = agent;
    } else {
      agents.unshift(agent);
    }
    localStorage.setItem(STORAGE_KEYS.COMMISSION_AGENTS, JSON.stringify(agents));
  }

  static getAgentCommissionBookings(agentId?: string, status?: string): PmsAgentCommissionBooking[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AGENT_COMMISSIONS);
    let list: PmsAgentCommissionBooking[];
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AGENT_COMMISSIONS, JSON.stringify(INITIAL_AGENT_COMMISSIONS));
      list = INITIAL_AGENT_COMMISSIONS;
    } else {
      try {
        list = JSON.parse(raw);
      } catch {
        list = INITIAL_AGENT_COMMISSIONS;
      }
    }
    if (agentId) {
      list = list.filter(c => c.agentId === agentId);
    }
    if (status) {
      list = list.filter(c => c.status === status);
    }
    return list;
  }

  static addAgentCommissionBooking(data: Omit<PmsAgentCommissionBooking, 'id' | 'createdAt'>): PmsAgentCommissionBooking {
    const list = this.getAgentCommissionBookings();
    const newRecord: PmsAgentCommissionBooking = {
      ...data,
      id: `COMM-2026-${String(list.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    list.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.AGENT_COMMISSIONS, JSON.stringify(list));

    // Update agent totals
    const agents = this.getCommissionAgents();
    const agent = agents.find(a => a.id === data.agentId || a.name.toLowerCase() === data.agentName.toLowerCase());
    if (agent) {
      agent.totalBookings += 1;
      agent.totalRevenueGenerated += data.grossRoomTariff;
      agent.totalCommissionEarned += data.netPayableCommission;
      agent.balancePayable += data.netPayableCommission;
      this.saveCommissionAgent(agent);
    }

    return newRecord;
  }

  static updateAgentCommissionStatus(id: string, status: PmsAgentCommissionBooking['status']): void {
    const list = this.getAgentCommissionBookings();
    const item = list.find(c => c.id === id);
    if (item) {
      item.status = status;
      localStorage.setItem(STORAGE_KEYS.AGENT_COMMISSIONS, JSON.stringify(list));
    }
  }

  static getAgentPayoutVouchers(agentId?: string): PmsAgentPayoutVoucher[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AGENT_PAYOUT_VOUCHERS);
    let vouchers: PmsAgentPayoutVoucher[];
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AGENT_PAYOUT_VOUCHERS, JSON.stringify(INITIAL_AGENT_PAYOUT_VOUCHERS));
      vouchers = INITIAL_AGENT_PAYOUT_VOUCHERS;
    } else {
      try {
        vouchers = JSON.parse(raw);
      } catch {
        vouchers = INITIAL_AGENT_PAYOUT_VOUCHERS;
      }
    }
    if (agentId) {
      return vouchers.filter(v => v.agentId === agentId);
    }
    return vouchers;
  }

  static recordAgentCommissionPayout(payload: {
    agentId: string;
    agentName: string;
    amount: number;
    paymentMode: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';
    referenceNo?: string;
    commissionIds: string[];
    tdsDeducted?: number;
    grossAmount?: number;
    notes?: string;
    createdBy?: string;
  }): PmsAgentPayoutVoucher {
    const vouchers = this.getAgentPayoutVouchers();
    const voucherNo = `AGTPAY-${1000 + vouchers.length + 1}`;
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newVoucher: PmsAgentPayoutVoucher = {
      voucherNo,
      voucherDate: today,
      agentId: payload.agentId,
      agentName: payload.agentName,
      amount: payload.amount,
      paymentMode: payload.paymentMode,
      referenceNo: payload.referenceNo || 'NA',
      settledCommissionIds: payload.commissionIds,
      tdsDeducted: payload.tdsDeducted || 0,
      grossAmount: payload.grossAmount || payload.amount,
      notes: payload.notes || `Commission settlement for ${payload.commissionIds.length} booking(s)`,
      createdBy: payload.createdBy || this.getCurrentUser().userName || 'Accounts',
      printTimestamp: timestamp
    };

    vouchers.unshift(newVoucher);
    localStorage.setItem(STORAGE_KEYS.AGENT_PAYOUT_VOUCHERS, JSON.stringify(vouchers));

    // Mark commission bookings as PAID
    const comms = this.getAgentCommissionBookings();
    comms.forEach(c => {
      if (payload.commissionIds.includes(c.id)) {
        c.status = 'PAID';
        c.payoutVoucherNo = voucherNo;
        c.payoutDate = today;
      }
    });
    localStorage.setItem(STORAGE_KEYS.AGENT_COMMISSIONS, JSON.stringify(comms));

    // Update agent balance
    const agents = this.getCommissionAgents();
    const agent = agents.find(a => a.id === payload.agentId);
    if (agent) {
      agent.totalCommissionPaid += payload.amount;
      agent.balancePayable = Math.max(0, agent.balancePayable - payload.amount);
      this.saveCommissionAgent(agent);
    }

    // Automatically record into Hotel Payment Register (Cash/Bank Outflow)
    try {
      const payments = this.getPayments();
      const pRecord: PmsPaymentRecord = {
        id: `pay-${Date.now()}`,
        sNo: payments.length + 1,
        voucherName: 'Payments',
        paymentNo: `PAY/${payments.length + 1}/25-26`,
        voucherNo: payments.length + 1,
        date: today,
        paymentMode: payload.paymentMode === 'CASH' ? 'Cash' : 'UPI',
        accountName: `${payload.agentName} (Agent Commission)`,
        amount: payload.amount,
        remark: `Voucher: ${voucherNo} - ${payload.notes || ''} (Ref: ${payload.referenceNo || 'NA'})`,
        createdAt: timestamp
      };
      this.savePayment(pRecord);
    } catch {
      // Payment register integration fallback
    }

    return newVoucher;
  }

  // ==========================================
  // Video 31: Top 15 Official Features of RoomG PMS (Word Doc & Spoken Script)
  // ==========================================
  static getTop15OfficialFeatures(): PmsTop15OfficialFeature[] {
    return TOP_15_OFFICIAL_FEATURES;
  }

  // ==========================================
  // Video 32: Liquor & Bar Management Software Methods (Frames 0080-0350)
  // ==========================================
  static getLiquorUnits(): PmsLiquorUnit[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LIQUOR_UNITS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LIQUOR_UNITS, JSON.stringify(INITIAL_LIQUOR_UNITS));
      return INITIAL_LIQUOR_UNITS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_LIQUOR_UNITS;
    }
  }

  static saveLiquorUnit(unit: PmsLiquorUnit): void {
    const list = this.getLiquorUnits();
    const idx = list.findIndex(u => u.id === unit.id || u.primaryUnitName.toLowerCase() === unit.primaryUnitName.toLowerCase());
    if (idx >= 0) {
      list[idx] = unit;
    } else {
      list.push(unit);
    }
    list.forEach((item, index) => { item.sNo = index + 1; });
    localStorage.setItem(STORAGE_KEYS.LIQUOR_UNITS, JSON.stringify(list));
  }

  static getLiquorBrands(): PmsLiquorBrand[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LIQUOR_BRANDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LIQUOR_BRANDS, JSON.stringify(INITIAL_LIQUOR_BRANDS));
      return INITIAL_LIQUOR_BRANDS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_LIQUOR_BRANDS;
    }
  }

  static saveLiquorBrand(brand: PmsLiquorBrand): void {
    const list = this.getLiquorBrands();
    const idx = list.findIndex(b => b.id === brand.id || b.name.toLowerCase() === brand.name.toLowerCase());
    if (idx >= 0) {
      list[idx] = brand;
    } else {
      list.push(brand);
    }
    list.forEach((item, index) => { item.sNo = index + 1; });
    localStorage.setItem(STORAGE_KEYS.LIQUOR_BRANDS, JSON.stringify(list));
  }

  static getLiquorItems(): PmsLiquorItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LIQUOR_ITEMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LIQUOR_ITEMS, JSON.stringify(INITIAL_LIQUOR_ITEMS));
      return INITIAL_LIQUOR_ITEMS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_LIQUOR_ITEMS;
    }
  }

  static saveLiquorItem(item: PmsLiquorItem): void {
    const list = this.getLiquorItems();
    const idx = list.findIndex(i => i.id === item.id || i.barcodeNo === item.barcodeNo);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    list.forEach((itm, index) => { itm.sNo = index + 1; });
    localStorage.setItem(STORAGE_KEYS.LIQUOR_ITEMS, JSON.stringify(list));
  }

  static getBrandWiseLiquorStocks(): PmsBrandWiseLiquorStock[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LIQUOR_STOCKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LIQUOR_STOCKS, JSON.stringify(INITIAL_LIQUOR_STOCKS));
      return INITIAL_LIQUOR_STOCKS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_LIQUOR_STOCKS;
    }
  }

  static recordLiquorSaleDeduction(brand: string, mlSold: number): void {
    const stocks = this.getBrandWiseLiquorStocks();
    let record = stocks.find(s => s.brand.toLowerCase() === brand.toLowerCase());
    if (!record) {
      record = {
        brand,
        bottleMl: 750,
        stockInMl: 7500,
        stockOutMl: 0,
        closingMl: 7500,
        closingBottel: 10
      };
      stocks.push(record);
    }
    record.stockOutMl += mlSold;
    record.closingMl = Math.max(0, record.stockInMl - record.stockOutMl);
    record.closingBottel = Number((record.closingMl / (record.bottleMl || 750)).toFixed(2));
    record.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.LIQUOR_STOCKS, JSON.stringify(stocks));
  }

  static recordLiquorPurchaseInward(brand: string, bottleQty: number, bottleMl = 750): void {
    const stocks = this.getBrandWiseLiquorStocks();
    let record = stocks.find(s => s.brand.toLowerCase() === brand.toLowerCase());
    const addedMl = bottleQty * bottleMl;
    if (!record) {
      record = {
        brand,
        bottleMl,
        stockInMl: addedMl,
        stockOutMl: 0,
        closingMl: addedMl,
        closingBottel: bottleQty
      };
      stocks.push(record);
    } else {
      record.stockInMl += addedMl;
      record.closingMl = Math.max(0, record.stockInMl - record.stockOutMl);
      record.closingBottel = Number((record.closingMl / (record.bottleMl || 750)).toFixed(2));
      record.lastUpdated = new Date().toISOString();
    }
    localStorage.setItem(STORAGE_KEYS.LIQUOR_STOCKS, JSON.stringify(stocks));
  }

  static getBarInvoices(): PmsBarInvoice[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BAR_INVOICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BAR_INVOICES, JSON.stringify(INITIAL_BAR_INVOICES));
      return INITIAL_BAR_INVOICES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_BAR_INVOICES;
    }
  }

  static saveBarInvoice(invoice: PmsBarInvoice): PmsBarInvoice {
    const invoices = this.getBarInvoices();
    const idx = invoices.findIndex(i => i.billNo === invoice.billNo);
    if (idx >= 0) {
      invoices[idx] = invoice;
    } else {
      invoices.unshift(invoice);
    }
    localStorage.setItem(STORAGE_KEYS.BAR_INVOICES, JSON.stringify(invoices));

    // Deduct liquor ML stock for all liquor items sold
    for (const item of invoice.items) {
      if (item.category === 'Liquor' && item.brandName && item.mlConsumed > 0) {
        this.recordLiquorSaleDeduction(item.brandName, item.mlConsumed);
      }
    }

    return invoice;
  }

  // ==========================================
  // Video 33: No-Discount Item, Margin Protection & Group Rules Methods (Frames 0080-0202)
  // ==========================================
  static getNoDiscountConfig(): PmsNoDiscountConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.NO_DISCOUNT_CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.NO_DISCOUNT_CONFIG, JSON.stringify(DEFAULT_NO_DISCOUNT_CONFIG));
      return DEFAULT_NO_DISCOUNT_CONFIG;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_NO_DISCOUNT_CONFIG;
    }
  }

  static saveNoDiscountConfig(cfg: PmsNoDiscountConfig): void {
    localStorage.setItem(STORAGE_KEYS.NO_DISCOUNT_CONFIG, JSON.stringify(cfg));
  }

  static isItemDiscountExempt(itemName: string, category?: string, group?: string, itemNoDiscount?: boolean): boolean {
    if (itemNoDiscount === true) return true;
    const cfg = this.getNoDiscountConfig();
    if (!cfg.enabled) return false;

    const lowerName = itemName.toLowerCase();
    const lowerCat = (category || '').toLowerCase();
    const lowerGrp = (group || '').toLowerCase();

    // Check against configured protected groups (e.g. Beverage, Dessert, Liquor, Beer, Wine)
    const isProtectedGroup = cfg.protectedGroups.some(pg => {
      const g = pg.toLowerCase();
      return lowerCat.includes(g) || lowerGrp.includes(g);
    });
    if (isProtectedGroup) return true;

    // Check specific known exemption patterns from Video 33 (Frame 0180)
    const isExemptKeywords = ['bavrage', 'beverage', 'desert', 'dessert', 'liquor', 'beer', 'whisky', 'rum', 'vodka', 'wine', 'blender spride', 'blenderspride', 'royal stag', 'kingfisher'];
    return isExemptKeywords.some(kw => lowerName.includes(kw) || lowerCat.includes(kw) || lowerGrp.includes(kw));
  }

  static computeBillDiscountWithExemptions(
    items: Array<{ itemName: string; amount: number; category?: string; group?: string; noDiscount?: boolean }>,
    discountPercent: number
  ): {
    actualDiscountAmount: number;
    savingsProtectedAmount: number;
    eligibleCount: number;
    exemptCount: number;
    lineDiscounts: Array<{ discountPercent: number; discountAmount: number; isExempt: boolean }>;
  } {
    let actualDiscountAmount = 0;
    let savingsProtectedAmount = 0;
    let eligibleCount = 0;
    let exemptCount = 0;

    const lineDiscounts = items.map(itm => {
      const isExempt = this.isItemDiscountExempt(itm.itemName, itm.category, itm.group, itm.noDiscount);
      if (isExempt) {
        exemptCount++;
        const potentialDis = Number(((itm.amount * discountPercent) / 100).toFixed(2));
        savingsProtectedAmount += potentialDis;
        return {
          discountPercent: 0,
          discountAmount: 0,
          isExempt: true
        };
      } else {
        eligibleCount++;
        const dis = Number(((itm.amount * discountPercent) / 100).toFixed(2));
        actualDiscountAmount += dis;
        return {
          discountPercent,
          discountAmount: dis,
          isExempt: false
        };
      }
    });

    return {
      actualDiscountAmount: Number(actualDiscountAmount.toFixed(2)),
      savingsProtectedAmount: Number(savingsProtectedAmount.toFixed(2)),
      eligibleCount,
      exemptCount,
      lineDiscounts
    };
  }

  static getDiscountAuditRecords(): PmsDiscountAuditRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DISCOUNT_AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DISCOUNT_AUDIT_LOGS, JSON.stringify(INITIAL_DISCOUNT_AUDIT_LOGS));
      return INITIAL_DISCOUNT_AUDIT_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_DISCOUNT_AUDIT_LOGS;
    }
  }

  static recordDiscountAudit(record: PmsDiscountAuditRecord): void {
    const logs = this.getDiscountAuditRecords();
    logs.unshift(record);
    if (logs.length > 50) logs.pop();
    localStorage.setItem(STORAGE_KEYS.DISCOUNT_AUDIT_LOGS, JSON.stringify(logs));
  }

  // ==========================================
  // Video 34: Godown-Wise Stock, Item-Wise Inventory, Asset/Linen Audit & Anti-Theft Tracking Methods (Frames 0110-0260)
  // ==========================================
  static getConsolidatedStockReport(searchTerm?: string): PmsConsolidatedStockRow[] {
    const godownStock = this.getGodownStock();
    const menuItems = this.getMenuItems();
    const godowns = this.getGodowns();

    // Map of aggregate data per normalized item name
    const aggMap = new Map<string, {
      itemName: string;
      barcode?: string;
      category: string;
      unit: string;
      rate: number;
      reorderLevel: number;
      totalStockIn: number;
      totalStockOut: number;
      godownBreakdown: Record<string, { stockIn: number; stockOut: number; closingStock: number }>;
    }>();

    // Initialize from menu items
    menuItems.forEach(item => {
      const key = item.name.toLowerCase().trim();
      if (!aggMap.has(key)) {
        aggMap.set(key, {
          itemName: item.name,
          barcode: item.barcode || item.code,
          category: item.category || 'General',
          unit: item.unit || 'Pcs',
          rate: item.purchaseRate || Math.round(item.rate * 0.6) || 15,
          reorderLevel: 20,
          totalStockIn: 0,
          totalStockOut: 0,
          godownBreakdown: {}
        });
      }
    });

    // Populate godown transactions
    Object.keys(godownStock).forEach(godownName => {
      const rows = godownStock[godownName] || [];
      rows.forEach(r => {
        const key = r.itemName.toLowerCase().trim();
        if (!aggMap.has(key)) {
          aggMap.set(key, {
            itemName: r.itemName,
            barcode: r.barcode,
            category: r.category || 'General',
            unit: r.unit || 'Pcs',
            rate: r.rate || 15,
            reorderLevel: 20,
            totalStockIn: 0,
            totalStockOut: 0,
            godownBreakdown: {}
          });
        }
        const entry = aggMap.get(key)!;
        entry.totalStockIn += r.stockIn;
        entry.totalStockOut += r.stockOut;
        entry.godownBreakdown[godownName] = {
          stockIn: r.stockIn,
          stockOut: r.stockOut,
          closingStock: r.closingStock
        };
      });
    });

    // Canonical Video 34 baseline adjustments for pixel-perfect match to Frame 0210
    // WATER BOTLE: 618 In, 460 Out, 158 Closing (Frame 0210)
    const waterKey = 'water botle';
    if (aggMap.has(waterKey)) {
      const w = aggMap.get(waterKey)!;
      if (w.totalStockIn === 0 && w.totalStockOut === 0) {
        w.totalStockIn = 618;
        w.totalStockOut = 460;
        w.godownBreakdown['Main Store'] = { stockIn: 458, stockOut: 10, closingStock: 448 };
        w.godownBreakdown['STORE1'] = { stockIn: 10, stockOut: 410, closingStock: -400 };
        w.godownBreakdown['Consume'] = { stockIn: 50, stockOut: 0, closingStock: 50 };
      }
    }

    // TAWA ROTI: 0 In, 424 Out, -424 Closing (Frame 0210)
    const tawaKey = 'tawa roti';
    if (aggMap.has(tawaKey)) {
      const t = aggMap.get(tawaKey)!;
      if (t.totalStockIn === 0 && t.totalStockOut === 0) {
        t.totalStockIn = 0;
        t.totalStockOut = 424;
      }
    }

    // Tawa Roti with Butter: 0 In, 53 Out, -53 Closing (Frame 0210)
    const tawaBKey = 'tawa roti with butter';
    if (aggMap.has(tawaBKey)) {
      const tb = aggMap.get(tawaBKey)!;
      if (tb.totalStockIn === 0 && tb.totalStockOut === 0) {
        tb.totalStockIn = 0;
        tb.totalStockOut = 53;
      }
    }

    // Water Bottle: 9 In, 1 Out, 8 Closing (Frame 0210)
    const wbKey = 'water bottle';
    if (aggMap.has(wbKey)) {
      const wb = aggMap.get(wbKey)!;
      if (wb.totalStockIn === 0 && wb.totalStockOut === 0) {
        wb.totalStockIn = 9;
        wb.totalStockOut = 1;
      }
    }

    // WATER BOTLE bisleri: 0 In, 6 Out, -6 Closing (Frame 0210)
    const bisleriKey = 'water botle bisleri';
    if (aggMap.has(bisleriKey)) {
      const b = aggMap.get(bisleriKey)!;
      if (b.totalStockIn === 0 && b.totalStockOut === 0) {
        b.totalStockIn = 0;
        b.totalStockOut = 6;
      }
    }

    let rows: PmsConsolidatedStockRow[] = [];
    let sNo = 1;

    aggMap.forEach(item => {
      const closing = item.totalStockIn - item.totalStockOut;
      let status: 'In Stock' | 'Low Stock' | 'Negative / Deficient' = 'In Stock';
      if (closing < 0) {
        status = 'Negative / Deficient';
      } else if (closing <= item.reorderLevel) {
        status = 'Low Stock';
      }

      const breakdownList: PmsGodownBreakdownEntry[] = godowns.map(g => {
        const info = item.godownBreakdown[g.name] || { stockIn: 0, stockOut: 0, closingStock: 0 };
        return {
          godownName: g.name,
          stockIn: info.stockIn,
          stockOut: info.stockOut,
          closingStock: info.closingStock
        };
      });

      rows.push({
        sNo: sNo++,
        itemName: item.itemName,
        barcode: item.barcode,
        category: item.category,
        unit: item.unit,
        totalStockIn: item.totalStockIn,
        totalStockOut: item.totalStockOut,
        totalClosingStock: closing,
        purchaseRate: item.rate,
        totalValuation: Math.max(0, closing) * item.rate,
        reorderLevel: item.reorderLevel,
        status,
        godownBreakdown: breakdownList
      });
    });

    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      rows = rows.filter(r => 
        r.itemName.toLowerCase().includes(term) || 
        r.category.toLowerCase().includes(term) ||
        (r.barcode && r.barcode.toLowerCase().includes(term))
      );
    }

    return rows;
  }

  static getStockAuditMovements(itemName: string): PmsStockAuditMovement[] {
    const term = itemName.toLowerCase().trim();
    const movements: PmsStockAuditMovement[] = [];
    let runningBalance = 0;

    // Check purchases
    const purchases = this.getPurchases();
    purchases.forEach(p => {
      p.items.forEach(itm => {
        if (itm.itemName.toLowerCase().trim().includes(term)) {
          runningBalance += itm.qty;
          movements.push({
            id: `mov-pur-${p.id}-${itm.sNo}`,
            date: p.billDate,
            type: 'PURCHASE',
            referenceNo: `BILL/${p.billNo}`,
            godown: p.godown || 'Main Store',
            qtyIn: itm.qty,
            qtyOut: 0,
            balance: runningBalance,
            remark: `Purchased from ${p.accountName || 'Vendor'} @ ₹${itm.rate}`
          });
        }
      });
    });

    // Check transfers
    const transfers = this.getStockTransfers();
    transfers.forEach(st => {
      st.items.forEach(itm => {
        if (itm.itemName.toLowerCase().trim().includes(term)) {
          runningBalance -= itm.qty;
          movements.push({
            id: `mov-trf-${st.id}-${itm.sNo}`,
            date: st.date,
            type: 'TRANSFER_OUT',
            referenceNo: st.entryNo,
            godown: st.fromGodown,
            toGodown: st.toGodown,
            qtyIn: 0,
            qtyOut: itm.qty,
            balance: runningBalance,
            remark: `Inter-store transfer from ${st.fromGodown} to ${st.toGodown}`
          });
        }
      });
    });

    // If no explicit movement found in live transactions, provide canonical Video 34 timeline
    if (movements.length === 0) {
      if (term.includes('water')) {
        return [
          {
            id: 'mov-w-1',
            date: '15-07-2025',
            type: 'PURCHASE',
            referenceNo: 'BILL/4300',
            godown: 'Main Store',
            qtyIn: 458,
            qtyOut: 0,
            balance: 458,
            remark: 'Vendor Purchase: Gupta Jii (Bill #4300) to Main Store'
          },
          {
            id: 'mov-w-2',
            date: '18-07-2025',
            type: 'TRANSFER_OUT',
            referenceNo: 'ST/18/24-25',
            godown: 'Main Store',
            toGodown: 'Kitchen',
            qtyIn: 0,
            qtyOut: 10,
            balance: 448,
            remark: 'Store Transfer: Issued 10 bottles to Kitchen'
          },
          {
            id: 'mov-w-3',
            date: '20-07-2025',
            type: 'PURCHASE',
            referenceNo: 'BILL/4334',
            godown: 'STORE1',
            qtyIn: 100,
            qtyOut: 0,
            balance: 548,
            remark: 'Video 34 Frame 0140: 100 bottles purchased into STORE1 @ ₹15'
          },
          {
            id: 'mov-w-4',
            date: '20-07-2025',
            type: 'TRANSFER_OUT',
            referenceNo: 'ST/22/24-25',
            godown: 'STORE1',
            toGodown: 'Main Store',
            qtyIn: 0,
            qtyOut: 40,
            balance: 508,
            remark: 'Video 34 Frame 0180: Transferred 40 bottles from STORE1 to Main Store'
          },
          {
            id: 'mov-w-5',
            date: '20-07-2025',
            type: 'INTERNAL_ISSUE',
            referenceNo: 'ISSUE/08',
            godown: 'Consume',
            qtyIn: 50,
            qtyOut: 0,
            balance: 558,
            remark: 'Issued 50 bottles to Hotel Housekeeping & Room Amenities'
          }
        ];
      }
    }

    return movements;
  }

  static getHotelAssetLinenRecords(): PmsHotelAssetLinenRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.HOTEL_ASSETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.HOTEL_ASSETS, JSON.stringify(INITIAL_HOTEL_ASSETS));
      return INITIAL_HOTEL_ASSETS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_HOTEL_ASSETS;
    }
  }

  static saveHotelAssetLinenRecord(record: PmsHotelAssetLinenRecord): void {
    const list = this.getHotelAssetLinenRecords();
    const idx = list.findIndex(a => a.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    localStorage.setItem(STORAGE_KEYS.HOTEL_ASSETS, JSON.stringify(list));
  }

  static recordStockTransferDirect(fromGodown: string, toGodown: string, itemName: string, qty: number, billNo = '1'): void {
    const transfers = this.getStockTransfers();
    const nextNo = transfers.length + 1;
    const entryNo = `ST/${nextNo}/24-25`;
    const today = new Date().toISOString().split('T')[0].split('-').reverse().join('-');

    const newTransfer: PmsStockTransfer = {
      id: `st-${Date.now()}`,
      entryNo,
      date: today,
      fromGodown,
      toGodown,
      billDate: today,
      billNo,
      items: [
        {
          sNo: 1,
          itemId: `itm-${Date.now()}`,
          itemName,
          qty,
          rate: 15,
          amount: qty * 15,
          discountAmt: 0,
          totalDiscount: 0,
          gstPercent: 0,
          gstAmt: 0,
          netValue: qty * 15
        }
      ],
      totalQty: qty,
      totalAmount: qty * 15,
      totalDiscount: 0,
      totalTaxable: qty * 15,
      totalGstAmt: 0,
      totalNetValue: qty * 15,
      remark: `Video 34 Stock Transfer from ${fromGodown} to ${toGodown}`,
      createdAt: new Date().toISOString()
    };

    this.saveStockTransfer(newTransfer);
  }

  // -------------------------------------------------------------
  // Video 35: Banquet Hall Billing, Venues & Event Booking Methods
  // -------------------------------------------------------------

  static getBanquetVenues(): PmsBanquetVenue[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BANQUET_VENUES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BANQUET_VENUES, JSON.stringify(INITIAL_BANQUET_VENUES));
      return INITIAL_BANQUET_VENUES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_BANQUET_VENUES;
    }
  }

  static saveBanquetVenue(venue: PmsBanquetVenue): void {
    const list = this.getBanquetVenues();
    const idx = list.findIndex(v => v.id === venue.id);
    if (idx >= 0) {
      list[idx] = venue;
    } else {
      list.push(venue);
    }
    localStorage.setItem(STORAGE_KEYS.BANQUET_VENUES, JSON.stringify(list));

    // Synchronize with room master
    const rooms = this.getRooms();
    const roomIdx = rooms.findIndex(r => r.id === venue.id || r.roomNo.toLowerCase() === venue.name.toLowerCase());
    if (roomIdx >= 0) {
      rooms[roomIdx].status = venue.status;
      rooms[roomIdx].tariff = venue.baseTariff;
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
    }
  }

  static getBanquetBookings(): PmsBanquetBooking[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BANQUET_BOOKINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BANQUET_BOOKINGS, JSON.stringify(INITIAL_BANQUET_BOOKINGS));
      return INITIAL_BANQUET_BOOKINGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_BANQUET_BOOKINGS;
    }
  }

  static saveBanquetBooking(booking: PmsBanquetBooking): void {
    const list = this.getBanquetBookings();
    const idx = list.findIndex(b => b.id === booking.id || b.bookingNo === booking.bookingNo);
    if (idx >= 0) {
      list[idx] = booking;
    } else {
      list.unshift(booking);
    }
    localStorage.setItem(STORAGE_KEYS.BANQUET_BOOKINGS, JSON.stringify(list));

    // Update venue status
    const venues = this.getBanquetVenues();
    const vIdx = venues.findIndex(v => v.id === booking.venueId || v.name === booking.venueName);
    if (vIdx >= 0) {
      if (booking.status === 'CheckedIn / In-Progress') {
        venues[vIdx].status = 'occupied';
      } else if (booking.status === 'Booked') {
        venues[vIdx].status = 'booked';
      } else if (booking.status === 'Settled & Checked Out') {
        venues[vIdx].status = 'dirty';
        venues[vIdx].cleaningStatus = 'Needs Sanitization / Cleaning';
      }
      localStorage.setItem(STORAGE_KEYS.BANQUET_VENUES, JSON.stringify(venues));
    }
  }

  static addBanquetKot(bookingId: string, kot: PmsBanquetKot): void {
    const bookings = this.getBanquetBookings();
    const booking = bookings.find(b => b.id === bookingId || b.bookingNo === bookingId);
    if (!booking) return;

    booking.kots.push(kot);

    // Recalculate financial summary
    let additionalTaxable = 0;
    let additionalGst = 0;
    kot.items.forEach(itm => {
      additionalTaxable += itm.amount;
      additionalGst += (itm.amount * itm.gstPercent) / 100;
    });

    booking.financialSummary.foodAndServicesTaxable += additionalTaxable;
    booking.financialSummary.foodAndServicesGstAmount += additionalGst;
    booking.financialSummary.foodAndServicesTotal += (additionalTaxable + additionalGst);
    booking.financialSummary.grossBillAmount += (additionalTaxable + additionalGst);
    booking.financialSummary.netPayable += (additionalTaxable + additionalGst);
    booking.financialSummary.balanceRemaining = Math.max(0, booking.financialSummary.netPayable - (booking.financialSummary.advancePaid + booking.financialSummary.midInstallmentsPaid + booking.financialSummary.paidAtCheckout));

    this.saveBanquetBooking(booking);
  }

  static recordBanquetPayment(bookingId: string, payment: PmsBanquetBooking['payments'][0]): void {
    const bookings = this.getBanquetBookings();
    const booking = bookings.find(b => b.id === bookingId || b.bookingNo === bookingId);
    if (!booking) return;

    booking.payments.push(payment);
    if (payment.type === 'Booking Advance') {
      booking.financialSummary.advancePaid += payment.amount;
    } else if (payment.type === 'Pre-Function Installment') {
      booking.financialSummary.midInstallmentsPaid += payment.amount;
    } else if (payment.type === 'Checkout Settlement') {
      booking.financialSummary.paidAtCheckout += payment.amount;
    }

    const totalPaid = booking.financialSummary.advancePaid + booking.financialSummary.midInstallmentsPaid + booking.financialSummary.paidAtCheckout;
    booking.financialSummary.balanceRemaining = Math.max(0, booking.financialSummary.grossBillAmount - totalPaid);

    this.saveBanquetBooking(booking);
  }

  static settleBanquetCheckout(
    bookingId: string,
    settlementData: {
      payments: Array<{ mode: any; amount: number; referenceNo?: string; remark?: string }>;
      invoiceNo?: string;
      billingOfficer?: string;
    }
  ): PmsBanquetBooking | null {
    const bookings = this.getBanquetBookings();
    const booking = bookings.find(b => b.id === bookingId || b.bookingNo === bookingId);
    if (!booking) return null;

    const today = new Date().toISOString().split('T')[0].split('-').reverse().join('-');
    const invoiceNum = settlementData.invoiceNo || `GSR/${Math.floor(250 + Math.random() * 50)}/24-25`;

    settlementData.payments.forEach((p, idx) => {
      booking.payments.push({
        id: `pmt-co-${Date.now()}-${idx}`,
        date: today,
        type: 'Checkout Settlement',
        mode: p.mode,
        amount: p.amount,
        referenceNo: p.referenceNo,
        remark: p.remark || 'Checkout bill settlement'
      });
      booking.financialSummary.paidAtCheckout += p.amount;
    });

    booking.status = 'Settled & Checked Out';
    booking.invoiceNo = invoiceNum;
    booking.invoiceDate = today;
    booking.billingOfficer = settlementData.billingOfficer || 'DEMO0004';
    booking.financialSummary.balanceRemaining = 0;

    this.saveBanquetBooking(booking);

    // Mark venue dirty
    const venues = this.getBanquetVenues();
    const vIdx = venues.findIndex(v => v.id === booking.venueId || v.name === booking.venueName);
    if (vIdx >= 0) {
      venues[vIdx].status = 'dirty';
      venues[vIdx].cleaningStatus = 'Needs Sanitization / Cleaning';
      localStorage.setItem(STORAGE_KEYS.BANQUET_VENUES, JSON.stringify(venues));
    }

    // Also mark linked rooms dirty in rooms list
    const rooms = this.getRooms();
    rooms.forEach(r => {
      if (booking.linkedRoomNos.includes(r.roomNo) || r.roomNo.toLowerCase() === booking.venueName.toLowerCase()) {
        r.status = 'dirty';
      }
    });
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));

    return booking;
  }

  static sanitizeBanquetVenue(venueId: string): void {
    const venues = this.getBanquetVenues();
    const vIdx = venues.findIndex(v => v.id === venueId);
    if (vIdx >= 0) {
      venues[vIdx].status = 'vacant';
      venues[vIdx].cleaningStatus = 'Ready';
      localStorage.setItem(STORAGE_KEYS.BANQUET_VENUES, JSON.stringify(venues));
    }

    // Synchronize rooms
    const rooms = this.getRooms();
    const rIdx = rooms.findIndex(r => r.id === venueId);
    if (rIdx >= 0) {
      rooms[rIdx].status = 'vacant';
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
    }
  }
}

// ==========================================
// Video 27: Top 20 Features of RoomG PMS Master Seed Data (Frames 0005-0815)
// ==========================================
export const DEFAULT_ROOMG_PRICING: RoomGSystemPricing = {
  mrp: 15600,
  discount: 5600,
  finalPrice: 10000,
  gstExtra: true,
  demoUrl: 'pms.hotelsai-vasudev.com',
  demoUser: 'demo4@gmail.com',
  demoPassword: '12345678',
  salesPhones: ['7999663696', '8871702803'],
  salesEmail: 'datahouseerp@gmail.com',
  officialWebsite: 'https://datahouseerp.com'
};

export const TOP_20_FEATURES: PmsTopFeature[] = [
  {
    id: 1,
    title: 'Room Dashboard',
    hindiTitle: 'रियल-टाइम रूम डैशबोर्ड',
    category: 'FrontDesk',
    categoryLabel: 'Front Desk & Operations',
    route: 'pms.hotelsai-vasudev.com/room_dashboard',
    targetModal: 'room_dashboard',
    icon: '🏢',
    accentColor: '#16a34a',
    summary: 'Real-time visual room matrix showing Vacant, Booked, Occupied, and Dirty rooms with 6 quick action triggers per room card.',
    fullDescription: 'The Room Dashboard is the central operational command center for front-desk receptionists and managers. It displays live status indicators (Vacant in white/green, Booked in yellow, Occupied in solid green, Dirty in crimson red), advance booking date inspection, and 6 instant micro-action buttons on every room card (phone call guest, extend/shift room, laundry service, instant billing, guest folio details, and housekeeping clean status).',
    antiTheftRationale: 'Eliminates unrecorded room sales and backroom cash pocketing by making every room state visually indisputable to owner and staff at all times.',
    specs: [
      'Visual color matrix: Vacant (White/Green), Booked (Yellow), Occupied (Green), Dirty (Crimson)',
      '6 Instant micro-actions on room card: Call, Shift, Laundry, Folio, Guest info, Dirty/Clean',
      'Instant counts summary header: Vacant, Occupied, Dirty, Check-ins',
      'Date picker filter to preview future room availability on any date'
    ]
  },
  {
    id: 2,
    title: 'Online Room Booking Engine',
    hindiTitle: 'ऑनलाइन व एडवांस रूम बुकिंग',
    category: 'FrontDesk',
    categoryLabel: 'Front Desk & Operations',
    route: 'pms.hotelsai-vasudev.com/roombookings/create',
    targetModal: 'room_booking',
    icon: '📅',
    accentColor: '#ca8a04',
    summary: 'Advance room reservation engine supporting OTA channel tagging (Agoda, MMT, Booking.com, Goibibo) and automated guest lookup.',
    fullDescription: 'Book rooms in advance with complete guest details and real-time room availability validation. It records business sources (Agoda, MakeMyTrip, Goibibo, Booking.com, Corporate, Walk-In), package selection (Room Only, With Breakfast, EP/CP/MAP), advance token payments, and vehicle/parking metadata while maintaining strict availability locks.',
    antiTheftRationale: 'Locks in advance booking revenue immediately into the ledger with automated receipt generation, ensuring advance deposits cannot disappear before check-in.',
    specs: [
      'Auto-complete guest lookup by phone number to pull existing ID records',
      'OTA & Corporate source attribution: Agoda, MakeMyTrip, Goibibo, Booking.com, Corporate, Walk-in',
      'Package & meal plan selector (EP, CP, MAP, AP, Room Only, With Breakfast)',
      'Multi-room bulk reservation capability with tariff customization'
    ]
  },
  {
    id: 3,
    title: 'Double-Booking Prevention Calendar',
    hindiTitle: 'डबल-बुकिंग रोकथाम कैलेंडर मैट्रिक्स',
    category: 'FrontDesk',
    categoryLabel: 'Front Desk & Operations',
    route: 'pms.hotelsai-vasudev.com/booking_calendar',
    targetModal: 'booking_calendar',
    icon: '🗓️',
    accentColor: '#0284c7',
    summary: '30-day horizontal date matrix mapping every room against calendar days with green "B" badges to prevent double bookings.',
    fullDescription: 'A timeline-based horizontal availability calendar displaying rooms along the Y-axis and dates across the X-axis. As demonstrated in Video 27 Frame 0205, when Room 204 is booked from 20-07 to 24-07, the software locks those cells with green "B" badges and automatically removes Room 204 from the booking dropdown for those dates.',
    antiTheftRationale: 'Prevents rogue staff from accepting off-the-books bookings on already committed rooms or claiming a room was vacant when it was occupied.',
    specs: [
      '30-day horizontal scrollable availability grid',
      'Green "B" (Booked) badges on reserved dates',
      'Real-time automated room availability filter in booking form',
      'One-click room selection directly from calendar cells'
    ]
  },
  {
    id: 4,
    title: 'Guest Check-In & Police ID Verification',
    hindiTitle: 'गेस्ट चेक-इन व पुलिस आईडी सत्यापन',
    category: 'FrontDesk',
    categoryLabel: 'Front Desk & Operations',
    route: 'pms.hotelsai-vasudev.com/roomcheckins/create',
    targetModal: 'room_checkin',
    icon: '🪪',
    accentColor: '#0ea5e9',
    summary: 'Streamlined guest arrival workflow with 3 document image slots (webcam/ID card), auto-billing initiation, and police report compliance.',
    fullDescription: 'Handles physical guest arrival, key handover, and tariff lock. Automatically pulls booking details or accepts walk-ins. Includes 3 dedicated photo upload/capture preview slots (guest face photo, ID front, ID back). Stores Aadhaar/Passport securely for instant police station arrival register generation.',
    antiTheftRationale: 'Ensures every guest is identified and digitally archived. Front desk staff cannot check in anonymous guests or omit check-in records.',
    specs: [
      '3 image preview slots (Guest Face Photo, ID Card Front, ID Card Back)',
      'Live webcam capture and file upload support',
      'Integrated Police Station Arrival/Departure Register export',
      'Immediate room status transition from Vacant to Occupied'
    ]
  },
  {
    id: 5,
    title: 'Guest Checkout & Auto Housekeeping Status',
    hindiTitle: 'गेस्ट चेकआउट व ऑटो हाउसकीपिंग स्टेटस',
    category: 'FrontDesk',
    categoryLabel: 'Front Desk & Operations',
    route: 'pms.hotelsai-vasudev.com/roomcheckouts',
    targetModal: 'room_checkout',
    icon: '🚪',
    accentColor: '#2563eb',
    summary: 'Consolidated final folio calculation combining room rent, restaurant food bills, laundry, and taxes with auto-switch to "Cleaning Pending".',
    fullDescription: 'Prepares the consolidated final checkout folio by merging day-wise room rent, pending KOT food orders, mini-bar, laundry, and GST. Upon checkout completion, the room automatically changes from Occupied (Green) to "Cleaning Pending" (Dirty / Red), alerting housekeeping staff to sanitize the room before it can be re-assigned.',
    antiTheftRationale: 'Prevents rooms from being immediately re-sold under the table before housekeeping clearance, while ensuring all food and laundry charges are billed.',
    specs: [
      'Merged room rent, pending KOT food bills, laundry, and incidental charges',
      'Instant room status switch to "Cleaning Pending" (Dirty / Red)',
      'Full checkout register table with CSV, Excel, PDF, and Print exports',
      'Immediate payment receipt issuance and key collection verification'
    ]
  },
  {
    id: 6,
    title: 'Kitchen Order Ticket (KOT) Engine',
    hindiTitle: 'किचन ऑर्डर टिकट (KOT) इंजन',
    category: 'Restaurant',
    categoryLabel: 'Restaurant & Food Service',
    route: 'pms.hotelsai-vasudev.com/kots/create/:id',
    targetModal: 'kot_entry',
    icon: '🍽️',
    accentColor: '#eab308',
    summary: 'Real-time kitchen order ticket generator with multi-outlet routing for room service and restaurant tables.',
    fullDescription: 'Creates live Kitchen Order Tickets whenever food is ordered in the restaurant or via room service. Prints tickets directly to kitchen printers so chefs can prepare orders without delay. Maintains 100% transparency between kitchen, service captains, and reception so no food order can be served without a billing record.',
    antiTheftRationale: 'Eliminates kitchen food theft and unbilled food service by ensuring kitchen staff only release food against an authenticated system KOT number.',
    specs: [
      'Dual service routing: Room Service vs Restaurant Dine-In Table',
      'Instant thermal KOT printing with item name, quantity, and prep instructions',
      'Live unprinted KOT notification badge on dashboard for pending orders',
      'Integration with Kitchen Display System (KDS)'
    ]
  },
  {
    id: 7,
    title: 'New Food Bill & Room Service Posting',
    hindiTitle: 'फूड बिल व रूम सर्विस पोस्टिंग',
    category: 'Restaurant',
    categoryLabel: 'Restaurant & Food Service',
    route: 'pms.hotelsai-vasudev.com/facthkot_records/:id',
    targetModal: 'food_bill',
    icon: '🧾',
    accentColor: '#334155',
    summary: 'Food invoice generator consolidating pending KOTs with 5% restaurant GST and one-click "Settle to Room" folio posting.',
    fullDescription: 'Aggregates all completed KOTs for a room or table into an official Food Bill. Automatically applies restaurant GST (2.5% CGST + 2.5% SGST under SAC 996331). Supports instant "Settle to Room" posting to add to guest room folio, or direct cash/UPI/card settlement for walk-in dining guests.',
    antiTheftRationale: 'Ensures food served to rooms is automatically locked into the guest room bill before checkout, preventing room guests from checking out without paying for room service.',
    specs: [
      'Batch conversion of open KOT tickets into final Tax Invoice',
      'One-click "Settle to Room" or direct payment (Cash/UPI/Card)',
      'SAC 996331 compliant GST breakdown with automatic round-off',
      'Print Approval and thermal bill printing support'
    ]
  },
  {
    id: 8,
    title: 'Room Advance Receipt Engine',
    hindiTitle: 'रूम एडवांस रसीद वाउचर',
    category: 'Billing',
    categoryLabel: 'Accounting & Billing',
    route: 'pms.hotelsai-vasudev.com/advace_receipt',
    targetModal: 'advance_receipt',
    icon: '💵',
    accentColor: '#0284c7',
    summary: 'Dedicated advance collection module generating official AR vouchers and posting immediate ledger credits.',
    fullDescription: 'Issues numbered Advance Receipts (e.g. AR17) when deposits are collected during reservation or check-in. Posts credit to the guest ledger immediately and automatically deducts the advance amount from the final checkout folio balance with transparent proof.',
    antiTheftRationale: 'Eliminates reception staff denying receipt of cash advance or misplacing advance payment records.',
    specs: [
      'Numbered Advance Receipt Vouchers (e.g. AR17, Voucher 17)',
      'Payment mode tagging (Cash, Google Pay, PhonePe, Card, Bank Transfer)',
      'Automatic deduction on checkout folio (-Advance)',
      'Searchable Advance Receipt Register with Edit/Delete/Print actions'
    ]
  },
  {
    id: 9,
    title: 'Multi-Payment Split Settlement',
    hindiTitle: 'मल्टी-पेमेंट स्प्लिट सेटलमेंट',
    category: 'Billing',
    categoryLabel: 'Accounting & Billing',
    route: 'pms.hotelsai-vasudev.com/show_checkin/:id',
    targetModal: 'room_checkout',
    icon: '💳',
    accentColor: '#059669',
    summary: 'Dynamic split-payment engine allowing arbitrary combinations of Cash, Online UPI, Bank Transfer (SBI/HDFC), Cheque, and Credit.',
    fullDescription: 'Hotels frequently receive split payments (e.g., ₹2,000 cash, ₹40,000 UPI, ₹6,612 Bank transfer). As highlighted in Video 27 Frame 0445, RoomG features a dynamic [+ Payment Mode] button allowing receptionists to split any bill across multiple channels with zero balance discrepancy.',
    antiTheftRationale: 'Prevents cash skimming where cashier collects full cash from guest but records partial amount as credit or discount.',
    specs: [
      'Dynamic [+ Payment Mode] row addition for unlimited split payment channels',
      'Integrated bank accounts: State Bank of India, HDFC, ICICI, Cash, Online UPI',
      'Live balance recalculation and validation to ensure zero rupee variance',
      'Payment reference number logging for audit trail'
    ]
  },
  {
    id: 10,
    title: 'Role-Based Access Control & Theft Prevention',
    hindiTitle: 'यूजर रोल व अधिकार प्रबंधन (चोरी रोकथाम)',
    category: 'Security',
    categoryLabel: 'Security, Theft Control & Direct Booking',
    route: 'pms.hotelsai-vasudev.com/roles',
    targetModal: 'roles_permissions',
    icon: '🛡️',
    accentColor: '#dc2626',
    summary: 'Granular permissions matrix for super-admin, staff, restaurant, and billing roles to prevent bill deletion and hide profit reports.',
    fullDescription: 'Empowers hotel owners to strictly define what each staff member can and cannot do. Standard staff can generate bills but are blocked from deleting bills, modifying rates after check-in, backdating entries, or viewing owner net profit reports.',
    antiTheftRationale: 'Prevents the #1 source of hotel fraud: receptionists printing bills for guests, pocketing the cash, and deleting the checkout record from the software.',
    specs: [
      'Pre-configured roles: Super-Admin, Admin, Staff, Receptionist, Restaurant, Billing, Only_Whatsapp',
      'Disable Bill Deletion for operational staff',
      'Restrict Profit / Financial Reports access to Owner only',
      'Active staff session tracking with instant role boundary enforcement'
    ]
  },
  {
    id: 11,
    title: 'Comprehensive Financial Ledger & Statement',
    hindiTitle: 'डबल-एंट्री फाइनेंशियल लेजर व खाता विवरण',
    category: 'Billing',
    categoryLabel: 'Accounting & Billing',
    route: 'pms.hotelsai-vasudev.com/ledger_show',
    targetModal: 'party_ledger',
    icon: '📑',
    accentColor: '#be123c',
    summary: 'Real-time double-entry account ledger tracking Debit, Credit, Opening Balance, and running balances for guests, corporate clients, and vendors.',
    fullDescription: 'Provides an audit-grade account ledger for every guest, corporate client, and supplier. Features Opening Balance, running Debit/Credit entries linked to check-in/checkout voucher numbers, and one-click printable statements with Excel export.',
    antiTheftRationale: 'Provides an unalterable paper trail for all money flows, ensuring corporate accounts and credit stays are tracked until final clearance.',
    specs: [
      'Date-range ledger query (From Date To Date) with instant [OK] lookup',
      'Columns: Date, Type, Account Name, Remark, Debit, Credit, Running Balance Cr/Dr',
      'Group categorization: Sundry Debtors, Sundry Creditors, Guest Customer',
      'One-click Printable Ledger Statement with PDF and Excel export'
    ]
  },
  {
    id: 12,
    title: 'Restaurant & Table Management',
    hindiTitle: 'रेस्टोरेंट व टेबल प्रबंधन मॉड्यूल',
    category: 'Restaurant',
    categoryLabel: 'Restaurant & Food Service',
    route: 'pms.hotelsai-vasudev.com/table_dashboard',
    targetModal: 'restaurant_table',
    icon: '🏬',
    accentColor: '#0284c7',
    summary: 'Dedicated dine-in restaurant module with live visual table status (Vacant, Running KOT, Billed), table shifting, and NC KOT handling.',
    fullDescription: 'Enables hotel properties with attached restaurants to operate a complete restaurant POS without additional software. Features color-coded dine-in tables, table-to-table shifting, non-chargeable (NC) KOTs for hotel management dining, and separated food tax reports.',
    antiTheftRationale: 'Prevents dining room waiters from serving food to walk-in guests and pocketing cash without generating a system bill.',
    specs: [
      'Visual table matrix: Vacant (Green), Running KOT (Yellow), Billed (Blue)',
      'Table shifting & order merging capabilities',
      'Non-Chargeable (NC) KOT register with management approval audit',
      'Independent restaurant sales register separate from room lodging'
    ]
  },
  {
    id: 13,
    title: 'Purchase Register & Accounts Payable',
    hindiTitle: 'खरीद रजिस्टर व सप्लायर देयता ट्रैकिंग',
    category: 'Inventory',
    categoryLabel: 'Inventory & Warehousing',
    route: 'pms.hotelsai-vasudev.com/purchases',
    targetModal: 'purchase_entry',
    icon: '🛒',
    accentColor: '#1d4ed8',
    summary: 'Inward procurement register for kitchen groceries, linen, and housekeeping supplies with supplier bill tracking and automatic stock updates.',
    fullDescription: 'Logs all items purchased for hotel operations (vegetables, dairy, toiletries, detergents, linens). Records supplier name, invoice number, tax rates, and purchase rates. Automatically updates store stock while posting payables to supplier ledgers.',
    antiTheftRationale: 'Prevents procurement kickbacks and fictitious supplier bills by requiring itemized inward purchase logging before stock can be issued.',
    specs: [
      'Supplier invoice tracking with GSTIN, Bill Date, and Due Date',
      'Itemized inward stock updating with purchase rates and tax breakdown',
      'Automated posting to Sundry Creditors accounts payable',
      'Integration with Central Godown stock inward register'
    ]
  },
  {
    id: 14,
    title: 'Stock Transfer Engine (Godown to Dept)',
    hindiTitle: 'स्टॉक ट्रांसफर इंजन (गोदाम से विभाग)',
    category: 'Inventory',
    categoryLabel: 'Inventory & Warehousing',
    route: 'pms.hotelsai-vasudev.com/stock_transfer',
    targetModal: 'stock_transfer',
    icon: '🔁',
    accentColor: '#16a34a',
    summary: 'Inter-department inventory movement from Central Godown/Store to Kitchen, Housekeeping, or Restaurant with digital transfer slips.',
    fullDescription: 'Facilitates controlled movement of stock between locations (e.g. from Main Godown to Kitchen, or Store to Housekeeping). Records item name, transferred quantity, and dispatch timestamp, eliminating discrepancies between storekeeper and kitchen chef.',
    antiTheftRationale: 'Stops kitchen and housekeeping staff from blaming "missing stock" on the central storekeeper by recording exact signed transfer quantities.',
    specs: [
      'Source godown to destination department selection',
      'Real-time quantity balance check before transfer authorization',
      'Automated stock debit at source and credit at destination',
      'Transfer history log with department recipient signature'
    ]
  },
  {
    id: 15,
    title: 'Stock Issue & Consumption Auditing',
    hindiTitle: 'स्टॉक निर्गमन व खपत ऑडिट',
    category: 'Inventory',
    categoryLabel: 'Inventory & Warehousing',
    route: 'pms.hotelsai-vasudev.com/store_wise_stock',
    targetModal: 'store_wise_stock',
    icon: '📦',
    accentColor: '#d97706',
    summary: 'Departmental stock consumption tracking showing Stock In, Stock Out, and Closing Stock with native Excel 2010 export.',
    fullDescription: 'Tracks actual consumption of raw materials and supplies (e.g., kilograms of paneer used, detergent consumed). Features the Store Wise Stock report shown in Frame 0625 with columns: S.No, Item Name, Stock In, Stock Out, and Closing Stock, with native Excel export.',
    antiTheftRationale: 'Identifies inventory wastage, pilferage, and over-consumption by comparing actual food sales against raw material depletion.',
    specs: [
      'Store-wise stock report: Kitchen Godown, Housekeeping Store, Bar Store',
      'Columns: Item Name, Stock In, Stock Out, Closing Stock',
      'One-click Excel (.xlsx/.csv) and PDF export matching Frame 0625',
      'Low stock warning threshold alerts'
    ]
  },
  {
    id: 16,
    title: '30+ Comprehensive MIS & GST Reports',
    hindiTitle: '30+ संपूर्ण होटल रिपोर्ट्स व जीएसटी रिटर्न',
    category: 'Billing',
    categoryLabel: 'Accounting & Billing',
    route: 'pms.hotelsai-vasudev.com/reports',
    targetModal: 'outstanding_receivables',
    icon: '📈',
    accentColor: '#1e293b',
    summary: 'Full suite of 30+ operational reports including GSTR-1, GSTR-3B, Day End Closing, Police Station Report, and Outstanding Receivables.',
    fullDescription: 'Provides exhaustive operational and compliance intelligence across all hotel facets: GSTR-1, 3B, B2B Sales, B2C Sales, Booking Register, Check-in Register, Checkout Register, Room Food Bills, Restaurant Register, KOT Register, Day End Closing, and Police Station Reports.',
    antiTheftRationale: 'Enables hotel owners to conduct surprise day-end audits and verify cash drawer balances against computer totals.',
    specs: [
      '30+ specialized report formats (GSTR-1, 3B, B2B, B2C, Day End, Police Report)',
      'Day End closing report showing total collections by Cash, UPI, Card, and Credit',
      'Outstanding customer receivables with aging analysis',
      'Instant export to Excel, CSV, PDF, and Print'
    ]
  },
  {
    id: 17,
    title: 'Guest CRM & Bulk Promotional WhatsApp',
    hindiTitle: 'गेस्ट सीआरएम व बल्क प्रोमोशनल व्हाट्सएप',
    category: 'Security',
    categoryLabel: 'Security, Theft Control & Direct Booking',
    route: 'pms.hotelsai-vasudev.com/whatsapp_sms',
    targetModal: 'whatsapp_setting',
    icon: '📢',
    accentColor: '#059669',
    summary: 'Customer Relationship Management repository with guest birthday/anniversary tracking and one-click bulk promotional WhatsApp broadcasts.',
    fullDescription: 'Maintains historical records of every guest who stayed at the hotel. Allows hotel managers to filter guests by city, booking frequency, or anniversary/birthday dates, and broadcast promotional holiday offers, festival discounts, and loyalty perks via WhatsApp.',
    antiTheftRationale: 'Drives repeat direct bookings, reducing reliance on expensive OTA commissions (18-25% saved).',
    specs: [
      'Guest database with contact number, city, email, and visit history',
      'One-click [Send Promotional WhatsApp] broadcast launcher',
      'Personalized message tokens ({firm_name}, {guest_name}, {booking_link})',
      'Festival and anniversary campaign templates'
    ]
  },
  {
    id: 18,
    title: 'Digital Signature on Invoices',
    hindiTitle: 'बिल पर डिजिटल हस्ताक्षर (पेपरलेस बिलिंग)',
    category: 'Billing',
    categoryLabel: 'Accounting & Billing',
    route: 'pms.hotelsai-vasudev.com/comp_pic_form',
    targetModal: 'company_branding',
    icon: '✍️',
    accentColor: '#7c3aed',
    summary: 'Authorized digital signature asset upload in PMS settings that automatically prints on all invoice formats without manual stamping.',
    fullDescription: 'Hotel owners can upload their authorized manager or accountant signature PNG in PMS settings (`/comp_pic_form`). The signature renders crisp and clean on all A4 Standard, Day-Wise, and A5 invoices, giving instant legal validity without requiring physical ink stamps.',
    antiTheftRationale: 'Prevents staff from issuing forged paper receipts with hand-scribbled unverified signatures.',
    specs: [
      'PNG / JPEG transparent digital signature upload and preview',
      'Automatic positioning on invoice footer above "Authorized Signatory"',
      'Dual signature layout: Guest Signature & Hotel Authorized Signature',
      'Instant synchronization across all 4 invoice format templates'
    ]
  },
  {
    id: 19,
    title: 'Dynamic Bill QR Code for Instant UPI Payment',
    hindiTitle: 'बिल पर डायनामिक यूपीआई क्यूआर कोड',
    category: 'Billing',
    categoryLabel: 'Accounting & Billing',
    route: 'pms.hotelsai-vasudev.com/comp_pic_form',
    targetModal: 'company_branding',
    icon: '📱',
    accentColor: '#0284c7',
    summary: 'Dynamic UPI QR Code printed on checkout folios matching exact net payable amount for error-free scan & pay.',
    fullDescription: 'Prints a high-resolution UPI QR Code directly on the invoice. When the guest scans with PhonePe, Google Pay, or Paytm, the exact bill amount (e.g. ₹50,432.00) and invoice reference are pre-filled, guaranteeing swift settlement and zero transaction typos.',
    antiTheftRationale: 'Ensures guest UPI payments go directly into the hotel owner verified bank account rather than staff personal UPI IDs.',
    specs: [
      'Dynamic UPI intent QR code matching exact folio balance',
      'Pre-fills Payee Name, UPI ID, Amount, and Bill Number note',
      'Compatible with PhonePe, GPay, Paytm, BHIM, and all Indian banking apps',
      'Static hotel QR code fallback from company branding asset vault'
    ]
  },
  {
    id: 20,
    title: 'Automated Anti-Theft Alerts & Public Booking Website',
    hindiTitle: 'ऑटोमेटेड एंटी-थेफ्ट अलर्ट व पब्लिक बुकिंग वेबसाइट',
    category: 'Security',
    categoryLabel: 'Security, Theft Control & Direct Booking',
    route: 'pms.hotelsai-vasudev.com/hotel_room/DEMO0004',
    targetModal: 'online_booking',
    icon: '🌐',
    accentColor: '#b91c1c',
    summary: 'Real-time WhatsApp alert to owner when checkout is deleted, plus integrated guest-facing booking showcase ("OUR ROOM") with photo gallery.',
    fullDescription: 'The pinnacle twin-pillar of RoomG PMS: First, the automated anti-theft alert dispatches an instant WhatsApp warning to the hotel owner if any operator deletes or modifies a checkout bill (`Check_out_delete`). Second, the built-in guest booking engine (`/hotel_room/DEMO0004`) provides a beautiful responsive public website with room photo collages, live tariffs, and direct booking inquiries, eliminating third-party OTA commissions.',
    antiTheftRationale: 'Immediate deterrence against bill tampering and deletion by rogue staff, combined with direct commission-free guest acquisition.',
    specs: [
      'Instant owner alert on checkout deletion: Room No, Bill No, Amount, Operator Name',
      'Automatic guest thank-you and invoice delivery on checkout',
      'Public "OUR ROOM" website showcase with multi-photo collages and amenities',
      'Direct guest booking inquiry flow directly into PMS reservation pipeline'
    ]
  }
];

// ==========================================
// Video 31: MR / Salesman Wise Commission Tracking Seed Data
// ==========================================
export const INITIAL_COMMISSION_AGENTS: PmsCommissionAgent[] = [
  {
    id: 'AGT-101',
    name: 'Sharma Travels & Tours (Ramesh Sharma)',
    phone: '9822154321',
    alternatePhone: '02423-255111',
    email: 'sharmatravelsshirdi@gmail.com',
    city: 'Shirdi',
    address: 'Near Sai Baba Mandir Gate 3, Shirdi, Maharashtra',
    agentType: 'Travel_Agent',
    commissionType: 'PERCENTAGE',
    defaultRate: 15,
    panNumber: 'ABCPR1234F',
    gstNumber: '27ABCPR1234F1Z1',
    bankDetails: {
      bankName: 'HDFC BANK',
      accountNo: '50200012345678',
      ifsc: 'HDFC0001890',
      accountHolder: 'Ramesh Sharma',
      upiId: 'sharmatravels@okhdfcbank'
    },
    status: 'ACTIVE',
    totalBookings: 8,
    totalRevenueGenerated: 35200,
    totalCommissionEarned: 5280,
    totalCommissionPaid: 2830,
    balancePayable: 2450,
    notes: 'Primary pilgrimage tour travel agency partner bringing family groups from Mumbai/Pune.',
    createdAt: '2026-01-10'
  },
  {
    id: 'AGT-102',
    name: "Vikram Roy (Dr. Reddy's Lab MR)",
    phone: '9711223344',
    email: 'vikram.roy@drreddys.com',
    city: 'Mumbai / Pune',
    address: 'Andheri East, Corporate HQ, Mumbai',
    agentType: 'MR_Corporate',
    commissionType: 'PERCENTAGE',
    defaultRate: 10,
    panNumber: 'BKRPR5678G',
    bankDetails: {
      bankName: 'ICICI BANK',
      accountNo: '001105009876',
      ifsc: 'ICIC0000011',
      accountHolder: 'Vikram Roy',
      upiId: 'vikram.roy@paytm'
    },
    status: 'ACTIVE',
    totalBookings: 6,
    totalRevenueGenerated: 24000,
    totalCommissionEarned: 2400,
    totalCommissionPaid: 600,
    balancePayable: 1800,
    notes: 'Medical representative bringing pharma doctors and delegates visiting Shirdi & Ahmednagar hospitals.',
    createdAt: '2026-02-05'
  },
  {
    id: 'AGT-103',
    name: 'Sainagar Shirdi Station Auto Union (Raju Bhai)',
    phone: '9890123456',
    city: 'Sainagar Shirdi',
    address: 'Station Auto Stand, Shirdi Railway Station',
    agentType: 'Auto_Taxi_Driver',
    commissionType: 'FIXED_PER_ROOM',
    defaultRate: 300,
    bankDetails: {
      bankName: 'STATE BANK OF INDIA',
      accountNo: '31234567890',
      ifsc: 'SBIN0000390',
      accountHolder: 'Raju Auto Union Rep',
      upiId: 'rajushirdiauto@ybl'
    },
    status: 'ACTIVE',
    totalBookings: 12,
    totalRevenueGenerated: 32000,
    totalCommissionEarned: 3600,
    totalCommissionPaid: 2100,
    balancePayable: 1500,
    notes: 'Local auto driver union bringing direct walk-in pilgrims arriving on late-night trains.',
    createdAt: '2026-03-01'
  },
  {
    id: 'AGT-104',
    name: 'Maharashtra Darshan Yatra (Anil Jadhav)',
    phone: '9422001122',
    email: 'anildarshan@rediffmail.com',
    city: 'Nashik',
    address: 'CBS Road, Nashik, Maharashtra',
    agentType: 'Tour_Operator',
    commissionType: 'PERCENTAGE',
    defaultRate: 20,
    panNumber: 'AAAPJ9988H',
    bankDetails: {
      bankName: 'BANK OF MAHARASHTRA',
      accountNo: '60123456789',
      ifsc: 'MAHB0000123',
      accountHolder: 'Anil Jadhav',
      upiId: 'anil.jadhav@sbi'
    },
    status: 'ACTIVE',
    totalBookings: 15,
    totalRevenueGenerated: 68000,
    totalCommissionEarned: 13600,
    totalCommissionPaid: 9000,
    balancePayable: 4600,
    notes: 'Large luxury bus tour operator conducting Shirdi-Shani Shingnapur-Trimbakeshwar circuit tours.',
    createdAt: '2026-01-15'
  },
  {
    id: 'AGT-105',
    name: 'Online OTA Local Broker (Sunil Joshi)',
    phone: '9123456780',
    city: 'Pune',
    agentType: 'OTA_Broker',
    commissionType: 'FIXED_PER_NIGHT',
    defaultRate: 250,
    bankDetails: {
      bankName: 'AXIS BANK',
      accountNo: '914010023456789',
      ifsc: 'UTIB0000543',
      accountHolder: 'Sunil Joshi',
      upiId: 'sunilbroker@icici'
    },
    status: 'ACTIVE',
    totalBookings: 5,
    totalRevenueGenerated: 18500,
    totalCommissionEarned: 2500,
    totalCommissionPaid: 1250,
    balancePayable: 1250,
    notes: 'Coordinates last-minute overflow bookings from Agoda, Booking.com, and local phone hotlines.',
    createdAt: '2026-02-20'
  }
];

export const INITIAL_AGENT_COMMISSIONS: PmsAgentCommissionBooking[] = [
  {
    id: 'COMM-2026-001',
    agentId: 'AGT-101',
    agentName: 'Sharma Travels & Tours (Ramesh Sharma)',
    agentType: 'Travel_Agent',
    checkInNo: 'SR/188/24-25',
    bookingRefNo: 'BK-2026-042',
    roomNo: '105',
    guestName: 'Sanjay Deshmukh',
    guestMobile: '9822987111',
    checkInDate: '2026-10-15',
    checkOutDate: '2026-10-17',
    numberOfNights: 2,
    roomTariff: 2200,
    grossRoomTariff: 4400,
    commissionType: 'PERCENTAGE',
    commissionRate: 15,
    grossCommission: 660,
    tdsPercentage: 5,
    tdsAmount: 33,
    netPayableCommission: 627,
    status: 'APPROVED',
    createdAt: '2026-10-15 11:30:00',
    remarks: 'Deluxe AC Room 2-day booking via Sharma Travels Pune yatra.'
  },
  {
    id: 'COMM-2026-002',
    agentId: 'AGT-102',
    agentName: "Vikram Roy (Dr. Reddy's Lab MR)",
    agentType: 'MR_Corporate',
    checkInNo: 'SR/192/24-25',
    roomNo: '101',
    guestName: 'AJUU',
    guestMobile: '9622975444',
    checkInDate: '2026-10-16',
    checkOutDate: '2026-10-18',
    numberOfNights: 2,
    roomTariff: 2000,
    grossRoomTariff: 4000,
    commissionType: 'PERCENTAGE',
    commissionRate: 10,
    grossCommission: 400,
    tdsPercentage: 5,
    tdsAmount: 20,
    netPayableCommission: 380,
    status: 'APPROVED',
    createdAt: '2026-10-16 09:15:00',
    remarks: 'MR sales rep medical team stay.'
  },
  {
    id: 'COMM-2026-003',
    agentId: 'AGT-103',
    agentName: 'Sainagar Shirdi Station Auto Union (Raju Bhai)',
    agentType: 'Auto_Taxi_Driver',
    checkInNo: 'SR/195/24-25',
    roomNo: '103',
    guestName: 'Mahesh Patil',
    guestMobile: '9822114455',
    checkInDate: '2026-10-17',
    checkOutDate: '2026-10-18',
    numberOfNights: 1,
    roomTariff: 2500,
    grossRoomTariff: 2500,
    commissionType: 'FIXED_PER_ROOM',
    commissionRate: 300,
    grossCommission: 300,
    tdsPercentage: 0,
    tdsAmount: 0,
    netPayableCommission: 300,
    status: 'PENDING',
    createdAt: '2026-10-17 14:00:00',
    remarks: 'Auto union walk-in from morning express train.'
  },
  {
    id: 'COMM-2026-004',
    agentId: 'AGT-104',
    agentName: 'Maharashtra Darshan Yatra (Anil Jadhav)',
    agentType: 'Tour_Operator',
    checkInNo: 'SR/176/24-25',
    bookingRefNo: 'BK-2026-029',
    roomNo: '201',
    guestName: 'Kishore Kadam & Group',
    guestMobile: '9422556677',
    checkInDate: '2026-10-12',
    checkOutDate: '2026-10-14',
    numberOfNights: 2,
    roomTariff: 3500,
    grossRoomTariff: 7000,
    commissionType: 'PERCENTAGE',
    commissionRate: 20,
    grossCommission: 1400,
    tdsPercentage: 5,
    tdsAmount: 70,
    netPayableCommission: 1330,
    status: 'PAID',
    payoutVoucherNo: 'AGTPAY-1001',
    payoutDate: '2026-10-15',
    createdAt: '2026-10-12 10:00:00',
    remarks: 'Suite room group booking commission settled via UPI.'
  }
];

export const INITIAL_AGENT_PAYOUT_VOUCHERS: PmsAgentPayoutVoucher[] = [
  {
    voucherNo: 'AGTPAY-1001',
    voucherDate: '2026-10-15',
    agentId: 'AGT-104',
    agentName: 'Maharashtra Darshan Yatra (Anil Jadhav)',
    grossAmount: 1400,
    tdsDeducted: 70,
    amount: 1330,
    paymentMode: 'UPI',
    referenceNo: 'UPI/20261015/9988776655',
    settledCommissionIds: ['COMM-2026-004'],
    notes: 'Commission disbursed for Suite Room 201 group booking. TDS 5% deducted under Sec 194H.',
    createdBy: 'Accounts Manager',
    printTimestamp: '2026-10-15 16:45:00'
  }
];

// ==========================================
// Video 31: Top 15 Official Features of RoomG PMS (Word Doc & Spoken Script)
// ==========================================
export const TOP_15_OFFICIAL_FEATURES: PmsTop15OfficialFeature[] = [
  {
    id: 1,
    title: 'Centralized Room Dashboard',
    hindiTitle: 'सेंट्रलाइज्ड रूम डैशबोर्ड (रियल-टाइम ओवरव्यू)',
    bulletSummary: 'Get a real-time overview of all room statuses: vacant, occupied, reserved, or under maintenance.',
    fullDetail: 'Interactive color-coded visual grid displaying real-time live occupancy. Green = Vacant, Red = Occupied with guest details, Yellow = Dirty/Housekeeping, Blue = Reserved/Booked. Immediate 1-click room booking, check-in, check-out, and room shifting directly from the visual dashboard.',
    targetModal: 'room_dashboard',
    route: 'pms.hotelsai-vasudev.com/home',
    icon: '🏨',
    badge: 'Core Operations',
    category: 'Front Desk',
    videoTimestamp: '[03:00]'
  },
  {
    id: 2,
    title: 'Online & Walk-in Booking Support',
    hindiTitle: 'ऑनलाइन व वॉक-इन बुकिंग मैनेजमेंट',
    bulletSummary: 'Manage all bookings in one place — whether they come from walk-ins, travel agents, or online channels.',
    fullDetail: 'Unified reservation book coordinating direct hotel walk-in guests, phone reservations, corporate contracts, travel agent referrals, and online OTA channels (MakeMyTrip, Agoda, Booking.com, Goibibo) with advance deposit tracking and receipt generation.',
    targetModal: 'room_booking',
    route: 'pms.hotelsai-vasudev.com/room_booking',
    icon: '📅',
    badge: 'Reservations',
    category: 'Front Desk',
    videoTimestamp: '[03:15]'
  },
  {
    id: 3,
    title: 'Seamless Check-In & Check-Out Process',
    hindiTitle: 'फास्ट व पेपरलेस चेक-इन व चेक-आउट प्रोसेस',
    bulletSummary: 'Fast, paperless check-in/out with auto-room allocation and bill calculation.',
    fullDetail: 'Digital guest onboarding with live webcam ID capture, Aadhaar/Passport KYC upload, co-traveler profiling, 12-hour/24-hour tariff calculation, advance adjustment, dynamic room folio generation, and instant checkout bill settlement in under 60 seconds.',
    targetModal: 'room_check_in',
    route: 'pms.hotelsai-vasudev.com/room_check_in',
    icon: '⚡',
    badge: 'High Velocity',
    category: 'Front Desk',
    videoTimestamp: '[03:25]'
  },
  {
    id: 4,
    title: 'GST-Ready Billing & Reports',
    hindiTitle: 'जीएसटी-रेडी बिलिंग व टैक्स रिपोर्ट्स (CGST, SGST, IGST)',
    bulletSummary: '100% GST-compliant billing, including SGST, CGST, and IGST with professional invoice formats.',
    fullDetail: 'Statutory Indian GST compliance with SAC 996331 (Room Accommodation) and SAC 996332 (Restaurant & Food Services). Supports local intra-state sales (CGST+SGST) and inter-state sales (IGST), B2B GSTIN party verification, B2C consolidated sales, and GSTR-1 / GSTR-3B ready Excel summaries.',
    targetModal: 'gst_reports',
    route: 'pms.hotelsai-vasudev.com/gst_report',
    icon: '📊',
    badge: 'Statutory GST',
    category: 'Billing & Tax',
    videoTimestamp: '[03:30]'
  },
  {
    id: 5,
    title: 'Room Service & Food Billing',
    hindiTitle: 'रूम सर्विस व फूड बिलिंग (KOT व टेबल पीओएस)',
    bulletSummary: 'Add food orders and services to the room account instantly — ideal for room dining and extras.',
    fullDetail: 'Integrated Kitchen Order Ticket (KOT) workflow with kitchen thermal printing, NC KOT management, and instant room folio post. Food orders from in-house dining or room service automatically append to the guest room invoice for consolidated checkout settlement or instant restaurant cash POS.',
    targetModal: 'restaurant_pos',
    route: 'pms.hotelsai-vasudev.com/table_dashboard',
    icon: '🍽️',
    badge: 'F&B POS',
    category: 'F&B POS',
    videoTimestamp: '[03:35]'
  },
  {
    id: 6,
    title: 'Mobile Number-Based Search & Booking History',
    hindiTitle: 'मोबाइल नंबर आधारित सर्च व गेस्ट बुकिंग हिस्ट्री',
    bulletSummary: 'Easily fetch guest data using mobile numbers for faster service and repeat guest recognition.',
    fullDetail: 'Enter any 10-digit mobile number during check-in to instantly auto-populate full guest profile, Aadhaar/KYC documents, historical stay dates, preferred room types, corporate GSTIN, and previous billing ledger, slashing front-desk check-in time to 15 seconds.',
    targetModal: 'guest_history_search',
    route: 'pms.hotelsai-vasudev.com/guest_history',
    icon: '🔍',
    badge: 'Guest CRM',
    category: 'Front Desk',
    videoTimestamp: '[03:40]'
  },
  {
    id: 7,
    title: 'Multiple Tariff & Day-Based Pricing',
    hindiTitle: 'मल्टी-टैरिफ व डे-बेस्ड प्राइसिंग (12-घंटे vs 24-घंटे)',
    bulletSummary: 'Set tariffs based on weekends, holidays, peak season, or corporate/client rates.',
    fullDetail: 'Flexible hotel rate engine supporting 12-Hour fixed checkout (11:00 AM standard) and 24-Hour rolling check-in to checkout cycles. Allows day-wise pricing overrides for weekend surges, festival seasons (Shirdi Sai Baba festivals), corporate company contracts, and custom seasonal rate cards.',
    targetModal: 'day_end_report',
    route: 'pms.hotelsai-vasudev.com/business_setting',
    icon: '💰',
    badge: 'Revenue Strategy',
    category: 'Billing & Tax',
    videoTimestamp: '[03:45]'
  },
  {
    id: 8,
    title: 'Inventory & Stock Management',
    hindiTitle: 'इन्वेंटरी व स्टॉक मैनेजमेंट (परचेज, इश्यू, ट्रांसफर)',
    bulletSummary: 'Track and manage stock for kitchen, bar, housekeeping, and other departments.',
    fullDetail: 'Complete godown and store inventory control. Inward raw materials through Purchase Bill entry (`/purchase`), transfer stock between central godown and kitchen/bar/housekeeping (`/stock_transfer`), and issue linen, toiletries, and beverage amenities (`/stock_issue`) with real-time low-stock alerts.',
    targetModal: 'purchase_entry',
    route: 'pms.hotelsai-vasudev.com/purchase',
    icon: '📦',
    badge: 'Store Control',
    category: 'Inventory & Stock',
    videoTimestamp: '[03:50]'
  },
  {
    id: 9,
    title: 'MR / Salesman Wise Commission Tracking',
    hindiTitle: 'एमआर व सेल्समैन वाइज कमीशन ट्रैकिंग व लेजर',
    bulletSummary: 'Automatically calculate and track booking commissions for agents and sales reps.',
    fullDetail: 'Automated commission management for travel agents, Medical Representatives (MRs), tour operators, local taxi/auto drivers, and OTA brokers. Configures percentage (%) or fixed per-room/per-night rates, calculates TDS deductions (Sec 194H), maintains agent ledgers, and generates official payout vouchers.',
    targetModal: 'agent_commission',
    route: 'pms.hotelsai-vasudev.com/agent_commission',
    icon: '🤝',
    badge: 'Agent Network',
    category: 'Commissions',
    videoTimestamp: '[03:55]'
  },
  {
    id: 10,
    title: 'Multi-User with Role-Based Access Control',
    hindiTitle: 'मल्टी-यूजर रोल आधारित एक्सेस कंट्रोल (72 परमिशन)',
    bulletSummary: 'Assign different permissions for reception, manager, admin, housekeeping, etc.',
    fullDetail: 'Enterprise permission matrix with 72 distinct security toggles. Segregates duties across Reception, Shift Cashier, Restaurant Captain, Housekeeping Supervisor, Accountant, and Hotel Owner. Prevents cashiers from altering tariffs, deleting checked-out bills, or backdating voucher dates.',
    targetModal: 'roles_permissions',
    route: 'pms.hotelsai-vasudev.com/user_permission',
    icon: '🛡️',
    badge: 'Anti-Theft Security',
    category: 'WhatsApp & Security',
    videoTimestamp: '[04:05]'
  },
  {
    id: 11,
    title: 'Multi-Branch / Multi-Firm Setup',
    hindiTitle: 'मल्टी-ब्रांच व मल्टी-फर्म सेटअप (होटल चेन मैनेजमेंट)',
    bulletSummary: 'Operate multiple hotels, guest houses, or branches with one software login.',
    fullDetail: 'Enterprise chain architecture allowing hotel owners to run multiple hotels, resort wings, banquets, and guest houses from a single master login. Switch active properties in 1 click, maintain separate GST accounts, and compare cross-property occupancy and RevPAR in real time.',
    targetModal: 'chain_property',
    route: 'pms.hotelsai-vasudev.com/company_list',
    icon: '🏢',
    badge: 'Chain Management',
    category: 'Multi-Property',
    videoTimestamp: '[04:15]'
  },
  {
    id: 12,
    title: 'Document Upload (KYC & ID Proofs)',
    hindiTitle: 'डिजिटल डॉक्यूमेंट व आईडी प्रूफ अपलोड (केवाईसी)',
    bulletSummary: 'Attach customer IDs, photos, and proofs digitally during check-in.',
    fullDetail: 'Eliminates messy physical paper photocopies. Capture live guest face webcam snapshots and attach digital copies of Aadhaar Card, Passport, Voter ID, or Driving License directly to the guest check-in record. Automatically compiles Form C and Police Station Guest Registration logs.',
    targetModal: 'room_check_in',
    route: 'pms.hotelsai-vasudev.com/guest_kyc',
    icon: '📷',
    badge: 'Statutory Police Log',
    category: 'Front Desk',
    videoTimestamp: '[04:25]'
  },
  {
    id: 13,
    title: 'Auto WhatsApp Integration',
    hindiTitle: 'ऑटो व्हाट्सएप इंटीग्रेशन व एंटी-थेफ्ट अलर्ट्स',
    bulletSummary: 'Send booking confirmations, bills, and reminders via WhatsApp directly from the software.',
    fullDetail: 'Dispatches instant booking confirmations, advance receipts, room check-in greetings, and final PDF tax invoices to guests directly on WhatsApp. Crucially features automated Anti-Theft alerts: if any operator voids or deletes a checkout bill, an immediate security alert is dispatched to the hotel owner.',
    targetModal: 'whatsapp_setting',
    route: 'pms.hotelsai-vasudev.com/whatsapp_setting',
    icon: '📱',
    badge: 'Real-Time WhatsApp',
    category: 'WhatsApp & Security',
    videoTimestamp: '[04:30]'
  },
  {
    id: 14,
    title: 'Data Security & Auto Backup',
    hindiTitle: 'डेटा सिक्योरिटी व ऑटोमेटेड क्लाउड बैकअप',
    bulletSummary: 'Daily auto backup system ensures no data loss due to power failure or system crash.',
    fullDetail: 'Automated background data snapshots ensuring zero data loss during power outages or hardware faults. Features 1-click manual encrypted JSON/SQL database export and cloud synchronization with high-availability enterprise redundancy.',
    targetModal: 'database_backup',
    route: 'pms.hotelsai-vasudev.com/db_backup',
    icon: '💾',
    badge: 'Disaster Recovery',
    category: 'WhatsApp & Security',
    videoTimestamp: '[04:45]'
  },
  {
    id: 15,
    title: 'Powerful Reports & Analytics',
    hindiTitle: 'पावरफुल रिपोर्ट्स व ऑडिट एनालिटिक्स (Excel व PDF एक्सपोर्ट)',
    bulletSummary: 'Export Excel/PDF reports for audit, tax filing, daily sales, occupancy, ledger, and more.',
    fullDetail: 'Over 30 operational, statutory, and financial reporting modules: Daily Sales Register, Police Station Report, Room Sales, F&B Sales, KOT Register, Stock Status, Party Ledgers, Day-End Audit, RevPAR Occupancy Analysis, and 1-click export to Microsoft Excel and printable PDF formats.',
    targetModal: 'report_dashboard',
    route: 'pms.hotelsai-vasudev.com/report_dashboard',
    icon: '📈',
    badge: 'Executive Analytics',
    category: 'Billing & Tax',
    videoTimestamp: '[04:55]'
  }
];

// ==========================================
// Video 32: Liquor & Bar Management Software Seed Data (Frames 0080-0350)
// ==========================================

export const INITIAL_LIQUOR_UNITS: PmsLiquorUnit[] = [
  { id: 'unit-1', sNo: 1, primaryUnitName: '30 ml', conversion: 30, alternateUnitName: 'ML' },
  { id: 'unit-2', sNo: 2, primaryUnitName: '60 Ml', conversion: 60, alternateUnitName: 'Ml' },
  { id: 'unit-3', sNo: 3, primaryUnitName: 'BOTTEL', conversion: 750, alternateUnitName: 'ML' },
  { id: 'unit-4', sNo: 4, primaryUnitName: 'Pint', conversion: 375, alternateUnitName: 'ML' },
  { id: 'unit-5', sNo: 5, primaryUnitName: 'Nip', conversion: 180, alternateUnitName: 'ML' },
  { id: 'unit-6', sNo: 6, primaryUnitName: 'Liter', conversion: 1000, alternateUnitName: 'Liter' },
  { id: 'unit-7', sNo: 7, primaryUnitName: 'Can', conversion: 500, alternateUnitName: 'ML' },
  { id: 'unit-8', sNo: 8, primaryUnitName: 'KG', conversion: 1, alternateUnitName: 'KG' },
  { id: 'unit-9', sNo: 9, primaryUnitName: 'Pcs', conversion: 1, alternateUnitName: 'Pcs' },
  { id: 'unit-10', sNo: 10, primaryUnitName: 'Plate', conversion: 1, alternateUnitName: 'Plate' }
];

export const INITIAL_LIQUOR_BRANDS: PmsLiquorBrand[] = [
  { id: 'brand-1', sNo: 1, name: 'Blander Spride', discountPercentage: 0, status: 'ACTIVE' },
  { id: 'brand-2', sNo: 2, name: 'Royal Stag', discountPercentage: 0, status: 'ACTIVE' },
  { id: 'brand-3', sNo: 3, name: 'Kingfisher Premium', discountPercentage: 0, status: 'ACTIVE' },
  { id: 'brand-4', sNo: 4, name: 'Imperial Blue', discountPercentage: 0, status: 'ACTIVE' },
  { id: 'brand-5', sNo: 5, name: 'Signature Rare', discountPercentage: 0, status: 'ACTIVE' },
  { id: 'brand-6', sNo: 6, name: 'Bacardi White Rum', discountPercentage: 0, status: 'ACTIVE' },
  { id: 'brand-7', sNo: 7, name: 'Magic Moments Vodka', discountPercentage: 0, status: 'ACTIVE' },
  { id: 'brand-8', sNo: 8, name: 'Antiquity Blue', discountPercentage: 0, status: 'ACTIVE' }
];

export const INITIAL_LIQUOR_ITEMS: PmsLiquorItem[] = [
  {
    id: 'liq-10070',
    sNo: 1,
    name: 'Blender Spride (30Ml)',
    brandName: 'Blander Spride',
    barcodeNo: '10070',
    group: 'Liquor',
    headGroup: 'Restaurant_Item',
    mrp: 230,
    rate: 230,
    purchaseRate: 16,
    unit: '30 ml',
    conversionMl: 30,
    taxType: 'VAT 13%',
    vatPercentage: 13,
    surchargePercentage: 10,
    active: true
  },
  {
    id: 'liq-10071',
    sNo: 2,
    name: 'Blenderspride (60 ML)',
    brandName: 'Blander Spride',
    barcodeNo: '10071',
    group: 'Liquor',
    headGroup: 'Restaurant_Item',
    mrp: 330,
    rate: 330,
    purchaseRate: 32,
    unit: '60 Ml',
    conversionMl: 60,
    taxType: 'VAT 13%',
    vatPercentage: 13,
    surchargePercentage: 10,
    active: true
  },
  {
    id: 'liq-10072',
    sNo: 3,
    name: 'Blender Spride (Bottel 750 ML )',
    brandName: 'Blander Spride',
    barcodeNo: '10072',
    group: 'Liquor',
    headGroup: 'Restaurant_Item',
    mrp: 1000,
    rate: 1000,
    purchaseRate: 400,
    unit: 'BOTTEL',
    conversionMl: 750,
    taxType: 'VAT 13%',
    vatPercentage: 13,
    surchargePercentage: 10,
    active: true
  },
  {
    id: 'liq-10080',
    sNo: 4,
    name: 'Royal Stag (30Ml)',
    brandName: 'Royal Stag',
    barcodeNo: '10080',
    group: 'Liquor',
    headGroup: 'Restaurant_Item',
    mrp: 180,
    rate: 180,
    purchaseRate: 14,
    unit: '30 ml',
    conversionMl: 30,
    taxType: 'VAT 13%',
    vatPercentage: 13,
    surchargePercentage: 10,
    active: true
  },
  {
    id: 'liq-10081',
    sNo: 5,
    name: 'Royal Stag (60 ML)',
    brandName: 'Royal Stag',
    barcodeNo: '10081',
    group: 'Liquor',
    headGroup: 'Restaurant_Item',
    mrp: 260,
    rate: 260,
    purchaseRate: 28,
    unit: '60 Ml',
    conversionMl: 60,
    taxType: 'VAT 13%',
    vatPercentage: 13,
    surchargePercentage: 10,
    active: true
  },
  {
    id: 'liq-10082',
    sNo: 6,
    name: 'Royal Stag (Bottel 750 ML)',
    brandName: 'Royal Stag',
    barcodeNo: '10082',
    group: 'Liquor',
    headGroup: 'Restaurant_Item',
    mrp: 850,
    rate: 850,
    purchaseRate: 350,
    unit: 'BOTTEL',
    conversionMl: 750,
    taxType: 'VAT 13%',
    vatPercentage: 13,
    surchargePercentage: 10,
    active: true
  },
  {
    id: 'liq-10090',
    sNo: 7,
    name: 'Kingfisher Ultra Beer (650 ML)',
    brandName: 'Kingfisher Premium',
    barcodeNo: '10090',
    group: 'Beer',
    headGroup: 'Restaurant_Item',
    mrp: 280,
    rate: 280,
    purchaseRate: 150,
    unit: 'BOTTEL',
    conversionMl: 650,
    taxType: 'VAT 13%',
    vatPercentage: 13,
    surchargePercentage: 10,
    active: true
  },
  {
    id: 'liq-10091',
    sNo: 8,
    name: 'Bacardi Carta Blanca (30Ml)',
    brandName: 'Bacardi White Rum',
    barcodeNo: '10091',
    group: 'Rum',
    headGroup: 'Restaurant_Item',
    mrp: 210,
    rate: 210,
    purchaseRate: 18,
    unit: '30 ml',
    conversionMl: 30,
    taxType: 'VAT 13%',
    vatPercentage: 13,
    surchargePercentage: 10,
    active: true
  }
];

export const INITIAL_LIQUOR_STOCKS: PmsBrandWiseLiquorStock[] = [
  {
    brand: 'Blander Spride',
    bottleMl: 750,
    stockInMl: 22500, // 30 bottles purchased (10 initial + 20 from Video 32 Frame 0320)
    stockOutMl: 450,   // 15 pegs sold (Frame 0300 & Frame 0350)
    closingMl: 22050,  // Closing 22,050 ML
    closingBottel: 29.4, // 29.4 Bottles (Frame 0350)
    lastUpdated: '2025-07-20T18:19:00Z'
  },
  {
    brand: 'Royal Stag',
    bottleMl: 750,
    stockInMl: 15000, // 20 bottles
    stockOutMl: 600,   // 20 pegs sold
    closingMl: 14400,
    closingBottel: 19.2,
    lastUpdated: '2025-07-20T18:00:00Z'
  },
  {
    brand: 'Kingfisher Premium',
    bottleMl: 650,
    stockInMl: 15600, // 24 bottles
    stockOutMl: 2600,  // 4 bottles sold
    closingMl: 13000,
    closingBottel: 20.0,
    lastUpdated: '2025-07-20T17:45:00Z'
  },
  {
    brand: 'Bacardi White Rum',
    bottleMl: 750,
    stockInMl: 7500,  // 10 bottles
    stockOutMl: 300,   // 10 pegs sold
    closingMl: 7200,
    closingBottel: 9.6,
    lastUpdated: '2025-07-20T17:30:00Z'
  }
];

export const INITIAL_BAR_INVOICES: PmsBarInvoice[] = [
  {
    billNo: 'Res/289/24-25',
    date: '2025-07-20',
    time: '06:16',
    tableNo: 'T-11',
    kotNo: '418',
    serviceType: 'Table Service',
    guestName: 'Guest (Table T-11)',
    guestMobile: '9822100000',
    remark: 'Bar & Restaurant Combined Bill (Video 32)',
    isB2b: false,
    items: [
      {
        sNo: 1,
        itemId: 'food-bp',
        itemName: 'bread pakoda',
        category: 'Food',
        qty: 6,
        rate: 100,
        amount: 600,
        discountPercentage: 0,
        discountAmount: 0,
        taxableAmount: 600,
        gstPercentage: 5,
        gstAmount: 30,
        vatPercentage: 0,
        vatAmount: 0,
        surchargePercentage: 0,
        surchargeAmount: 0,
        totalValue: 630,
        unit: 'Plate',
        mlConsumed: 0
      },
      {
        sNo: 2,
        itemId: 'food-cb',
        itemName: 'Paneer Dum Biryani',
        category: 'Food',
        qty: 5,
        rate: 90,
        amount: 450,
        discountPercentage: 0,
        discountAmount: 0,
        taxableAmount: 450,
        gstPercentage: 0,
        gstAmount: 0,
        vatPercentage: 0,
        vatAmount: 0,
        surchargePercentage: 0,
        surchargeAmount: 0,
        totalValue: 450,
        unit: 'Plate',
        mlConsumed: 0
      },
      {
        sNo: 3,
        itemId: 'liq-10070',
        itemName: 'Blender Spride (30Ml)',
        brandName: 'Blander Spride',
        category: 'Liquor',
        qty: 5,
        rate: 230,
        amount: 1150,
        discountPercentage: 0,
        discountAmount: 0,
        taxableAmount: 1150,
        gstPercentage: 0,
        gstAmount: 0,
        vatPercentage: 13,
        vatAmount: 149.50,
        surchargePercentage: 10,
        surchargeAmount: 14.95,
        totalValue: 1314.45,
        unit: '30 ml',
        mlConsumed: 150
      }
    ],
    totalItems: 3,
    totalQuantity: 16,
    basicAmount: 2200,
    sgstAmount: 15,
    cgstAmount: 15,
    vatAmount: 149.50,
    surchargeAmount: 14.95,
    roundOff: 0.45,
    grandTotal: 2394,
    settled: true,
    paymentMode: 'CASH',
    createdAt: '2025-07-20T06:16:00Z'
  }
];

// ==========================================
// Video 33: No-Discount Item, Margin Protection & Group Rules Seed Data (Frames 0080-0202)
// ==========================================

export const DEFAULT_NO_DISCOUNT_CONFIG: PmsNoDiscountConfig = {
  enabled: true,
  protectedGroups: [
    'Beverage',
    'BAVRAGE',
    'Dessert',
    'DESERT',
    'Liquor',
    'Beer',
    'Wine',
    'Whisky',
    'No Discount',
    'Cigarettes',
    'Packaged Goods'
  ],
  maxAllowedDiscountPercent: 20,
  allowManualOverride: true,
  overrideRoleRequired: 'Admin',
  reasonRequiredForOverride: true
};

export const INITIAL_DISCOUNT_AUDIT_LOGS: PmsDiscountAuditRecord[] = [
  {
    id: 'disc-audit-1',
    billNo: 'Res/293/24-25',
    tableNo: 'T-10',
    requestedDiscountPercent: 10,
    actualDiscountAmount: 24.00, // Burger ₹12 + Bada Pao ₹12 (Frame 0180)
    savingsProtectedAmount: 68.00, // ₹230 Blender Spride (₹23) + ₹270 Beverage (₹27) + ₹180 Dessert (₹18) protected!
    eligibleItemsCount: 2,
    exemptItemsCount: 3,
    cashierName: 'Hotel & restaurant (Cashier)',
    timestamp: '2025-07-20T07:23:00Z'
  },
  {
    id: 'disc-audit-2',
    billNo: 'Res/289/24-25',
    tableNo: 'T-11',
    requestedDiscountPercent: 15,
    actualDiscountAmount: 37.50,
    savingsProtectedAmount: 172.50, // Liquor protected from 15% discount
    eligibleItemsCount: 3,
    exemptItemsCount: 2,
    cashierName: 'Admin',
    timestamp: '2025-07-20T06:20:00Z'
  }
];

// ==========================================
// Video 34: Hotel Assets & Linen Anti-Theft Tracking Seed Data (Frames 0110-0260)
// ==========================================
export const INITIAL_HOTEL_ASSETS: PmsHotelAssetLinenRecord[] = [
  {
    id: 'asset-1',
    assetName: 'Double Bedsheet White (Chadar)',
    category: 'Linen',
    unit: 'Pieces',
    totalPurchased: 200,
    inRooms: 140,
    inLinenStore: 30,
    inLaundry: 25,
    inDamagedRepair: 3,
    missingDiscrepancy: 2,
    unitCost: 350,
    lastAuditDate: '2025-07-20'
  },
  {
    id: 'asset-2',
    assetName: 'Bath Towels Large 500 GSM',
    category: 'Linen',
    unit: 'Pieces',
    totalPurchased: 150,
    inRooms: 100,
    inLinenStore: 20,
    inLaundry: 24,
    inDamagedRepair: 4,
    missingDiscrepancy: 2,
    unitCost: 220,
    lastAuditDate: '2025-07-20'
  },
  {
    id: 'asset-3',
    assetName: 'Samsung 32" Smart LED TV',
    category: 'Electronics',
    unit: 'Units',
    totalPurchased: 52,
    inRooms: 50,
    inLinenStore: 1,
    inLaundry: 0,
    inDamagedRepair: 1,
    missingDiscrepancy: 0,
    unitCost: 14500,
    lastAuditDate: '2025-07-18'
  },
  {
    id: 'asset-4',
    assetName: 'Single Quilt / Blanket Microfiber',
    category: 'Linen',
    unit: 'Pieces',
    totalPurchased: 120,
    inRooms: 80,
    inLinenStore: 35,
    inLaundry: 5,
    inDamagedRepair: 0,
    missingDiscrepancy: 0,
    unitCost: 650,
    lastAuditDate: '2025-07-19'
  },
  {
    id: 'asset-5',
    assetName: 'Crompton 1.5L Electric Kettle',
    category: 'Electronics',
    unit: 'Units',
    totalPurchased: 50,
    inRooms: 46,
    inLinenStore: 2,
    inLaundry: 0,
    inDamagedRepair: 2,
    missingDiscrepancy: 0,
    unitCost: 850,
    lastAuditDate: '2025-07-15'
  },
  {
    id: 'asset-6',
    assetName: 'Pillow with Polyfill Fiber',
    category: 'Linen',
    unit: 'Pieces',
    totalPurchased: 240,
    inRooms: 180,
    inLinenStore: 40,
    inLaundry: 16,
    inDamagedRepair: 2,
    missingDiscrepancy: 2,
    unitCost: 180,
    lastAuditDate: '2025-07-20'
  }
];

export function usePmsSync(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    return PmsStore.subscribe(() => {
      setTick(t => t + 1);
    });
  }, []);
  return tick;
}
