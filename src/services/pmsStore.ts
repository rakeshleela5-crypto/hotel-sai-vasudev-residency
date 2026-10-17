import type { 
  PmsRoom, 
  PmsBooking, 
  PmsKotRecord, 
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
  PmsPaymentRecord
} from '../types/pmsModels';

export const DEFAULT_BUSINESS_SETTING: PmsBusinessSetting = {
  calculationType: '12hour',
  standardCheckoutTime: '11:00 AM'
};

export const DEFAULT_COMPANY_INFO: PmsCompanyInfo = {
  firmName: 'HOTEL SAI VASUDEV RESIDENCY',
  address1: 'Near Sai Baba Temple, Shirdi',
  address2: 'Taluka Rahata, Ahmednagar District',
  city: 'Shirdi',
  pincode: '423109',
  state: 'MAHARASHTRA',
  phone: '02423-255000',
  mobile: '9822000000',
  email: 'hotelsaivasudevresidency@gmail.com',
  website: 'https://hotel-sai-vasudev-residency.pages.dev',
  gstNo: '27ABCDE1234F1Z5',
  companyGstCode: '27',
  pencardNo: 'ABCDE1234F',
  regNo2: 'REG-MS-2024-9871',
  gstNotApplicable: false,
  makeAllBillLocalGst: true // Video 10 local sales default
};

export const INITIAL_ROOMS: PmsRoom[] = [
  // Ground / Halls
  { id: '1', roomNo: '1', roomType: 'STANDARD', tariff: 2000, status: 'vacant', floor: 1, facilities: 'AC, Geyser, TV, Double Bed' },
  { id: '2', roomNo: '2', roomType: 'STANDARD', tariff: 2000, status: 'vacant', floor: 1, facilities: 'AC, Double Bed, TV' },
  { id: 'g-2bhk', roomNo: 'ground 2 bhk', roomType: 'SUITE ROOM', tariff: 4500, status: 'vacant', floor: 0, facilities: 'AC, Hall, Kitchen, 2 Bedrooms' },
  { id: 'mini-hall', roomNo: 'MINI HALL', roomType: 'HALL', tariff: 6000, status: 'vacant', floor: 0, facilities: 'Seating 50 pax, Stage, Mic' },
  { id: 'garden', roomNo: 'GARDEN', roomType: 'HALL', tariff: 10000, status: 'booked', floor: 0, facilities: 'Lawn Area, Lights, Buffet Setup' },
  { id: 'big-hall', roomNo: 'BIG HALL', roomType: 'HALL', tariff: 15000, status: 'booked', floor: 0, facilities: 'Seating 200 pax, Central AC' },

  // 1st Floor
  { 
    id: '101', 
    roomNo: '101', 
    roomType: 'DELUXE', 
    tariff: 2000, 
    status: 'occupied', 
    floor: 1, 
    facilities: 'AC, Geyser, TV, Double Bed',
    currentGuest: {
      name: 'AJUU',
      phone: '9622975444',
      checkInDate: '16-06-2025',
      checkInTime: '05:15 AM',
      bookingNo: 'SR/203/25-26',
      advancePaid: 500,
      calculationType: '24hour'
    }
  },
  { id: '102', roomNo: '102', roomType: 'SUITE ROOM', tariff: 3000, status: 'vacant', floor: 1, facilities: 'Living Area, Sofa, King Bed, Bathtub' },
  { 
    id: '103', 
    roomNo: '103', 
    roomType: 'DELUXE', 
    tariff: 2500, 
    status: 'occupied', 
    floor: 1, 
    facilities: 'AC, Smart TV, Wi-Fi, Balcony',
    currentGuest: {
      name: 'ARJUN',
      phone: '95487417',
      checkInDate: '16-06-2025',
      checkInTime: '06:30 AM',
      bookingNo: 'SR/204/25-26',
      advancePaid: 1000,
      calculationType: '24hour'
    },
    foodAmount: 100
  },
  { id: '104', roomNo: '104', roomType: 'DELUXE', tariff: 2000, status: 'dirty', floor: 1, facilities: 'AC, Geyser, TV, Wardrobe' },
  { id: '105', roomNo: '105', roomType: 'DELUXE', tariff: 2000, status: 'vacant', floor: 1, facilities: 'AC, King Bed, Work Desk' },

  // 2nd Floor
  { id: '201', roomNo: '201', roomType: 'DELUXE', tariff: 2200, status: 'vacant', floor: 2, facilities: 'AC, Smart TV, Balcony' },
  { id: '202', roomNo: '202', roomType: 'LUXURY ROOM', tariff: 3500, status: 'vacant', floor: 2, facilities: 'King Bed, Minibar, City View' },
  { id: '203', roomNo: '203', roomType: 'STANDARD', tariff: 1500, status: 'vacant', floor: 2, facilities: 'Non-AC, TV, Attached Bath' },
  { id: '204', roomNo: '204', roomType: 'DELUXE', tariff: 2200, status: 'vacant', floor: 2, facilities: 'AC, Geyser, Work Desk' },
  { id: '205', roomNo: '205', roomType: 'SUITE ROOM', tariff: 3200, status: 'vacant', floor: 2, facilities: 'Living Room, Jacuzzi, Balcony' },

  // 3rd Floor
  { id: '301', roomNo: '301', roomType: 'DELUXE', tariff: 2400, status: 'vacant', floor: 3, facilities: 'AC, Temple View, Smart TV' },
  { id: '302', roomNo: '302', roomType: 'DELUXE', tariff: 2400, status: 'vacant', floor: 3, facilities: 'AC, Balcony, Safe Locker' },
  { id: '303', roomNo: '303', roomType: 'STANDARD', tariff: 1600, status: 'vacant', floor: 3, facilities: 'Fan, Attached Bath, Clean Linen' },
  { id: '304', roomNo: '304 Dormitory', roomType: 'DORMITORY', tariff: 800, status: 'vacant', floor: 3, facilities: '10 Bunk Beds, Lockers, Shared Bath' },
  { id: '305', roomNo: '305', roomType: 'LUXURY ROOM', tariff: 4000, status: 'booked', floor: 3, facilities: 'Penthouse View, Premium Bedding' },
  { id: '306', roomNo: '306', roomType: 'DELUXE', tariff: 2400, status: 'booked', floor: 3, facilities: 'AC, Geyser, TV' },
  { id: '307', roomNo: '307', roomType: 'DELUXE', tariff: 2400, status: 'booked', floor: 3, facilities: 'AC, Geyser, TV' },
  { id: '308', roomNo: '308', roomType: 'DELUXE', tariff: 2400, status: 'booked', floor: 3, facilities: 'AC, Balcony, Wi-Fi' },
  { id: '309', roomNo: '309', roomType: 'SUITE ROOM', tariff: 3500, status: 'booked', floor: 3, facilities: 'Luxury Suite with Hill View' },
  { id: 'dl-20', roomNo: 'DL-20', roomType: 'DORMITORY', tariff: 600, status: 'vacant', floor: 3, facilities: 'Single Bed in Dormitory' },
];

export const INITIAL_ROOM_TYPES: PmsRoomType[] = [
  { id: 'rt-1', roomTypeName: 'LUXURY ROOM', package: 'GENERAL', gstTaxString: 'GST 18% || 18.00 || 0.00', gstPercent: 18, roomTariff: 4000, discountPercent: 0 },
  { id: 'rt-2', roomTypeName: 'SUITE ROOM', package: 'GENERAL', gstTaxString: 'GST 12% || 12.00 || 0.00', gstPercent: 12, roomTariff: 3000, discountPercent: 0 },
  { id: 'rt-3', roomTypeName: 'DELUXE', package: 'GENERAL', gstTaxString: 'GST 12% || 12.00 || 0.00', gstPercent: 12, roomTariff: 2000, discountPercent: 0 },
  { id: 'rt-4', roomTypeName: 'STANDARD', package: 'GENERAL', gstTaxString: 'GST 12% || 12.00 || 0.00', gstPercent: 12, roomTariff: 1500, discountPercent: 0 },
  { id: 'rt-5', roomTypeName: 'AC EXECUTIVE ROOM', package: 'GENERAL', gstTaxString: 'GST 12% || 12.00 || 0.00', gstPercent: 12, roomTariff: 1500, discountPercent: 0 },
  { id: 'rt-6', roomTypeName: 'GROUND 2 BHK', package: 'WITHOUT BREACKFAST', gstTaxString: 'GST 5% || 5.00 || 0.00', gstPercent: 5, roomTariff: 5500, discountPercent: 10 },
  { id: 'rt-7', roomTypeName: 'MINI HALL', package: 'GENERAL', gstTaxString: 'GST 0% || 0.00 || 0.00', gstPercent: 0, roomTariff: 10000, discountPercent: 0 },
  { id: 'rt-8', roomTypeName: 'GARDEN', package: 'GENERAL', gstTaxString: 'GST 0% || 0.00 || 0.00', gstPercent: 0, roomTariff: 45000, discountPercent: 0 },
  { id: 'rt-9', roomTypeName: 'BADA HALL', package: 'GENERAL', gstTaxString: 'GST 0% || 0.00 || 0.00', gstPercent: 0, roomTariff: 35000, discountPercent: 0 },
  { id: 'rt-10', roomTypeName: 'STANDRAD ROOM', package: 'GENERAL', gstTaxString: 'GST 0% || 0.00 || 0.00', gstPercent: 0, roomTariff: 1500, discountPercent: 0 },
  { id: 'rt-11', roomTypeName: 'DELUXE ROOM', package: 'GENERAL', gstTaxString: 'GST 0% || 0.00 || 0.00', gstPercent: 0, roomTariff: 2500, discountPercent: 0 },
  { id: 'rt-12', roomTypeName: 'DORMITORY', package: 'GENERAL', gstTaxString: 'GST 0% || 0.00 || 0.00', gstPercent: 0, roomTariff: 800, discountPercent: 0 },
];

export const INITIAL_TABLES: PmsDiningTable[] = [
  // General Dining Tables (matching Video 13 Frames 110 & 140)
  { id: 't-1', tableName: 'Table T-1', tableGroup: 'General', capacity: 4, status: 'Vacant' },
  { id: 't-2', tableName: 'Table T-2', tableGroup: 'General', capacity: 4, status: 'Vacant' },
  { id: 't-3', tableName: 'Table T- 3', tableGroup: 'General', capacity: 4, status: 'Running' },
  { id: 't-4', tableName: 'Table T-4', tableGroup: 'General', capacity: 4, status: 'Vacant' },
  { id: 't-5', tableName: 'Table T-5', tableGroup: 'General', capacity: 6, status: 'Running' },
  { id: 't-6', tableName: 'Table T-6', tableGroup: 'General', capacity: 6, status: 'Running' },
  { id: 't-7', tableName: 'Table T-7', tableGroup: 'General', capacity: 2, status: 'Running' },
  { id: 't-8', tableName: 'Table T-8', tableGroup: 'General', capacity: 2, status: 'Running' },
  { id: 't-9', tableName: 'Table T-9', tableGroup: 'General', capacity: 8, status: 'Vacant' },
  { id: 't-10', tableName: 'Table T-10', tableGroup: 'General', capacity: 4, status: 'Vacant' },
  { id: 't-11', tableName: 'Table T-11', tableGroup: 'General', capacity: 4, status: 'Vacant' },
  { id: 't-12', tableName: 'Table T-12', tableGroup: 'General', capacity: 4, status: 'Vacant' },
  { id: 't-13', tableName: 'Table T-13', tableGroup: 'General', capacity: 4, status: 'Vacant' },
  { id: 't-14', tableName: 'Table T-14', tableGroup: 'General', capacity: 4, status: 'Running' },
  { id: 't-15', tableName: 'Table T-15', tableGroup: 'General', capacity: 4, status: 'Vacant' },
  { id: 't-ncc', tableName: 'Table NCC', tableGroup: 'General', capacity: 6, status: 'Running' },
  { id: 't-16', tableName: 'Table T-16', tableGroup: 'General', capacity: 6, status: 'Running' },

  // TakeAway Group
  { id: 't-a1', tableName: 'Table A1', tableGroup: 'TakeAway', capacity: 2, status: 'Vacant' },

  // NC Group (Non-Chargeable tables for Owner, VIP, Staff dining)
  { id: 't-nc1', tableName: 'Table NC1', tableGroup: 'Nc', capacity: 4, status: 'Vacant' },
  { id: 't-nc2', tableName: 'Table NC2', tableGroup: 'Nc', capacity: 4, status: 'Running' },

  // SelfService Group
  { id: 't-s1', tableName: 'Table S1', tableGroup: 'SelfService', capacity: 4, status: 'Vacant' },
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

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  { id: 'm-1', name: 'Paneer Rice', code: '11', barcode: '8901234001', company: 'In-House', rate: 140, saleRate: 140, mrp: 160, purchaseRate: 80, unit: 'Plate', gstPercent: 5, category: 'Rice' },
  { id: 'm-2', name: 'PANEER TIKA', code: '10005', barcode: '8901234002', company: 'In-House', rate: 220, saleRate: 220, mrp: 250, purchaseRate: 120, unit: 'Portion', gstPercent: 5, category: 'Starters' },
  { id: 'm-3', name: 'sahi paneer', code: '10028', barcode: '8901234003', company: 'In-House', rate: 240, saleRate: 240, mrp: 270, purchaseRate: 130, unit: 'Portion', gstPercent: 5, category: 'Main Course' },
  { id: 'm-4', name: 'paneer bhurji', code: '10040', barcode: '8901234004', company: 'In-House', rate: 200, saleRate: 200, mrp: 220, purchaseRate: 110, unit: 'Portion', gstPercent: 5, category: 'Main Course' },
  { id: 'm-5', name: 'Dal Tadka', code: '10012', barcode: '8901234005', company: 'In-House', rate: 160, saleRate: 160, mrp: 180, purchaseRate: 70, unit: 'Bowl', gstPercent: 5, category: 'Dal' },
  { id: 'm-6', name: 'Butter Roti', code: '10001', barcode: '8901234006', company: 'In-House', rate: 25, saleRate: 25, mrp: 30, purchaseRate: 10, unit: 'Piece', gstPercent: 5, category: 'Breads' },
  { id: 'm-7', name: 'Mineral Water 1L', code: '10002', barcode: '8901234007', company: 'Bisleri', rate: 20, saleRate: 20, mrp: 20, purchaseRate: 12, unit: 'Bottle', gstPercent: 12, category: 'Beverages' },
  { id: 'm-8', name: 'Masala Tea', code: '10003', barcode: '8901234008', company: 'In-House', rate: 30, saleRate: 30, mrp: 35, purchaseRate: 10, unit: 'Cup', gstPercent: 5, category: 'Beverages' },
  { id: 'm-9', name: 'Veg Thali Deluxe', code: '10050', barcode: '8901234009', company: 'In-House', rate: 180, saleRate: 180, mrp: 200, purchaseRate: 90, unit: 'Plate', gstPercent: 5, category: 'Thali' },
  { id: 'm-10', name: 'Jeera Rice', code: '10015', barcode: '8901234010', company: 'In-House', rate: 110, saleRate: 110, mrp: 130, purchaseRate: 50, unit: 'Plate', gstPercent: 5, category: 'Rice' },
  { id: 'm-11', name: 'KACHOOMER SALAD', code: '10060', barcode: '8901234011', company: 'In-House', rate: 90, saleRate: 90, mrp: 100, purchaseRate: 30, unit: 'Portion', gstPercent: 5, category: 'Salad' }
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
  { id: 'pa-21', name: 'auto commision', mobile: '9876543210', category: 'Customer', balance: 0.00, balanceType: 'Dr' }
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
  PAYMENTS: 'svr_pms_payments'
};

export class PmsStore {
  static getRooms(): PmsRoom[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ROOMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
      return INITIAL_ROOMS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ROOMS;
    }
  }

  static saveRooms(rooms: PmsRoom[]): void {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
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

  static deleteRoom(roomNo: string): void {
    const rooms = this.getRooms().filter(r => r.roomNo !== roomNo && r.id !== roomNo);
    this.saveRooms(rooms);
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

  static getBookings(): PmsBooking[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return raw ? JSON.parse(raw) : [];
  }

  static saveBooking(booking: PmsBooking): void {
    const bookings = this.getBookings();
    bookings.unshift(booking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    // Update room status to booked or occupied
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

  static getCheckIns(): import('../types/pmsModels').PmsCheckIn[] {
    const raw = localStorage.getItem('hotel_pms_checkins');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }

    const defaultCheckIns: import('../types/pmsModels').PmsCheckIn[] = [
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
    localStorage.setItem('hotel_pms_checkins', JSON.stringify(defaultCheckIns));
    return defaultCheckIns;
  }

  static saveCheckIn(checkIn: import('../types/pmsModels').PmsCheckIn): void {
    const list = this.getCheckIns();
    list.unshift(checkIn);
    localStorage.setItem('hotel_pms_checkins', JSON.stringify(list));

    // Update room status to occupied (Emerald Green)
    this.updateRoomStatus(checkIn.roomNo, 'occupied', {
      name: checkIn.guestName,
      phone: checkIn.mobile,
      checkInDate: checkIn.checkInDate,
      checkInTime: checkIn.checkInTime,
      bookingNo: checkIn.checkInNo,
      advancePaid: checkIn.advancePaid,
      calculationType: '24hour'
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

    // Mark KOTs as Billed
    if (bill.kotNumbers && bill.kotNumbers.length > 0) {
      this.markKotsAsBilled(bill.kotNumbers);
    }

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

    // Initial demo checkout matching Video 06 Frame 0200 & 0230 (Shiv Room 101)
    const initialCheckouts: PmsCheckOutDetail[] = [
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

    // Mark room as dirty upon checkout
    this.updateRoomStatus(checkout.roomNo, 'dirty', undefined);
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

    return {
      success: true,
      message: `Room shifted successfully from ${params.fromRoomNo} to ${params.toRoomNo}. Room ${params.fromRoomNo} is now marked as Dirty for housekeeping.`,
      record: shiftRecord
    };
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
}

