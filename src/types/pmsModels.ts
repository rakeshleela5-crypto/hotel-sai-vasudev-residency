/**
 * Hotel SAI VASUDEV RESIDENCY - Enterprise Hotel PMS Models & Data Contracts
 * Derived from Video 01: RoomG PMS Training & Feature Analysis
 */

export type RoomStatus = 'vacant' | 'booked' | 'occupied' | 'dirty';

export interface PmsRoom {
  id: string;
  roomNo: string;
  roomType: 'DELUXE' | 'SUITE ROOM' | 'LUXURY ROOM' | 'STANDARD' | 'DORMITORY' | 'HALL';
  tariff: number;
  status: RoomStatus;
  floor: number;
  facilities: string;
  image1?: string;
  image2?: string;
  image3?: string;
  currentGuest?: {
    name: string;
    phone: string;
    checkInDate: string;
    checkInTime: string;
    bookingNo?: string;
    advancePaid?: number;
    calculationType?: '24hour' | '12hour';
  };
  foodAmount?: number;
}

export interface PaymentSplit {
  mode: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Online';
  amount: number;
  referenceNo?: string;
  remark?: string;
}

export interface PmsBooking {
  bookingNo: string;          // e.g. RM/63/24-25
  bookingDate: string;        // DD-MM-YYYY
  bookingTime: string;        // HH:MM AM/PM
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  numberOfDays: number;
  numberOfGuests: number;
  businessSource: 'Walk-in' | 'OYO' | 'MakeMyTrip' | 'Goibibo' | 'Booking.com' | 'Agoda' | 'Corporate' | 'Phone' | 'Online' | 'Other';
  package: 'ROOM ONLY || 0' | 'WITH BREAKFAST || 0' | 'EP' | 'CP' | 'MAP' | 'AP' | 'Regular';
  vehicleNo?: string;
  parkingNo?: string;
  bookingRemark?: string;
  guestName: string;
  nationality?: string;
  mobile: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  agent?: string;
  documentName?: 'Aadhaar Card' | 'Passport' | 'Driving License' | 'Voter ID' | 'Other';
  documentNo?: string;
  companyName?: string;
  companyAddress?: string;
  gstNo?: string;
  guestPhoto?: string;
  idProofPhoto?: string;
  rooms: {
    roomNo: string;
    roomType: string;
    tariff: number;
  }[];
  totalAmount: number;
  bookingAmount: number;      // Total advance paid
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Online';
  paymentReferenceNo?: string;
  paymentRemark?: string;
  payments?: PaymentSplit[];  // Support for split payments from Video 02
  referenceNo?: string;
  isWithoutRoomAllocation?: boolean; // Room Booking Without Room (Frame 0080 / Spoken 08:15)
  assignedRoomType?: string;
  status: 'Unconfirmed' | 'Confirmed' | 'CheckedIn' | 'CheckedOut' | 'Cancelled';
  createdAt: string;
}

export interface CalendarRoomBookingDay {
  roomNo: string;
  roomType: string;
  dates: {
    [dateStr: string]: 'vacant' | 'booked' | 'occupied' | 'dirty';
  };
}

export interface KotItem {
  sNo: number;
  itemName: string;
  itemCode?: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface PmsKotRecord {
  kotNo: string;              // e.g. KOT/343/24-25 or R/370
  serviceType: 'Room' | 'Restaurant' | 'Banquet';
  roomNo: string;
  tableNo?: string;           // Dining Table, e.g. T-16, T-8, T-14
  waiterName?: string;        // e.g. DEMO0004, Ramesh, Suresh
  guestName: string;
  checkInNo?: string;         // e.g. 203 (Frame 0275)
  kotRemark?: string;
  items: KotItem[];
  totalAmount: number;
  totalQty?: number;
  date?: string;
  time?: string;
  createdAt: string;
  status: 'Pending' | 'Cooking' | 'Ready To Serve' | 'Served' | 'Billed' | 'Cancelled';
  serveStatus?: 'Pending' | 'Cooking' | 'Ready To Serve' | 'Served' | 'Unprinted' | '0';
  isNc?: boolean;
  ncRemark?: string;
  operatorName?: string;
  cancelReason?: string;
  cancelledAt?: string;
  isPrinted?: boolean;        // Video 14: true if printed, false if unprinted
  printedAt?: string;
  printedBy?: string;
  orderSource?: 'Mobile' | 'Desktop';
}
export interface PmsCheckIn {
  checkInNo: string;          // e.g. SR/188/24-25
  roomNo: string;
  roomType: string;
  guestName: string;
  mobile: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  nationality?: string;
  phone?: string;
  email?: string;
  checkInDate: string;        // DD-MM-YYYY
  checkInTime: string;        // HH:MM AM/PM
  numberOfDays: number;
  numberOfGuests: number;
  businessSource: 'Walk-in' | 'OYO' | 'Make My Trip' | 'Goibibo' | 'Direct' | 'Corporate' | 'Other';
  package: string;
  tariffPerDay: number;
  advancePaid: number;
  paymentMode: 'Cash' | 'Online' | 'UPI' | 'Card' | 'Bank Transfer';
  paymentReferenceNo?: string;
  paymentRemark?: string;
  payments?: PaymentSplit[];
  documentName?: string;
  documentNo?: string;
  documentImage?: string;
  guestImage?: string;
  idProofBackImage?: string;
  // Co-travelers KYC (Video 03 Frame 0260)
  secondGuestName?: string;
  secondGuestIdName?: string;
  secondGuestIdNo?: string;
  secondGuestDocument?: string;
  thirdGuestName?: string;
  thirdGuestIdName?: string;
  thirdGuestIdNo?: string;
  thirdGuestDocument?: string;
  // Police / Tourism Compliance (Video 03 Frame 0340)
  purposeOfVisit?: 'Darshan / Pilgrimage' | 'Business' | 'Leisure' | 'Transit' | 'Other';
  comingFrom?: string;
  goingTo?: string;
  companyName?: string;
  companyAddress?: string;
  gstNo?: string;
  remark1?: string;
  remark2?: string;
  bookingRefNo?: string;      // If converted from advance booking
  status: 'CheckedIn' | 'CheckedOut';
  createdAt: string;
  foodAmount?: number;
}

export interface FoodBillItem {
  sNo: number;
  itemName: string;
  itemCode?: string;
  qty: number;
  rate: number;
  amount: number;
  discountPercent?: number;
  discountAmount?: number;
  taxable: number;
  gstPercent: number;
  gstAmount?: number;
  vatPercent?: number;
  surPercent?: number;
  value: number;
}

export interface PmsFoodBill {
  billNo: string;             // e.g. SHRI/253/24-25 or Res/264/24-25
  date: string;
  time: string;
  roomNo: string;
  tableNo?: string;
  serviceType?: string;       // Table Service, Take Away, Room Service, Home Delivery
  guestName: string;
  mobile?: string;
  address?: string;
  remark?: string;
  paymentRemark?: string;
  kotNumbers: string[];       // e.g. ['372', '374']
  items: (KotItem | FoodBillItem)[];
  taxableAmount: number;
  gstPercent: number;         // 5.0000%
  cgstAmount: number;         // 2.5%
  sgstAmount: number;         // 2.5%
  discountPercent: number;    // e.g. 5.0%
  discountAmount: number;
  roundOff: number;           // e.g. -0.00
  netBillAmount: number;      // e.g. 266.00
  amountInWords?: string;
  settlementType: 'Settle To Room' | 'Cash' | 'UPI' | 'Card' | 'Online' | 'Settle To Cash' | 'Settle To Online' | 'Due / Credit' | string;
  status: 'Pending' | 'Settled';
  createdAt: string;
}

export interface PmsCheckOutDetail {
  invoiceNo: string;          // e.g. GSR/217/24-25
  roomNo: string;
  roomType: string;
  guestName: string;
  guestPhone: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  calculationType: '24hour' | '12hour';
  numberOfDays: number;
  perDayTariff: number;
  totalRoomRent: number;
  foodAmount: number;
  foodBillNo?: string;
  gstPercent: number;         // 12.0000, 18.0000, etc.
  gstAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  addOthers: number;
  lessDiscount: number;
  advanceDeducted: number;
  billAmount: number;
  netPayable: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Credit' | 'Online' | 'Bank Transfer';
  payments?: PaymentSplit[];
  checkoutRemark?: string;
  gstNumber?: string;
  companyName?: string;
  companyAddress?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  email?: string;
  sacCode?: string;           // 996311 (Hotel Accommodation)
  invoiceFormat?: 'A4_Standard' | 'A5_HalfPage' | 'Detailed';
  isTaxInclusive?: boolean;
  isComplimentary?: boolean;
  billingOfficer?: string;    // e.g. DEMO0004
  dayWiseRent?: DayWiseRentItem[];
}

export interface DayWiseRentItem {
  sNo: number;
  startDate: string;
  endDate: string;
  dayCount: number;
  rent: number;
}

export interface PmsBusinessSetting {
  calculationType: '12hour' | '24hour';
  standardCheckoutTime: string; // e.g. "11:00 AM"
  updatedAt?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  code: string;
  rate: number;
  category: string;
  barcode?: string;
  company?: string;
  mrp?: number;
  saleRate?: number;
  rateA?: number;
  rateB?: number;
  rateC?: number;
  purchaseRate?: number;
  unit?: string;
  gstPercent?: number;
  image?: string;
  headGroup?: 'Restaurant_Item' | 'Raw_Material';
  group?: string;
}

export interface PmsRoomType {
  id: string;
  roomTypeName: string;
  package: string;
  gstTaxString: string;
  gstPercent: number;
  roomTariff: number;
  discountPercent: number;
}

export type TableGroup = 'General' | 'TakeAway' | 'Nc' | 'SelfService' | string;

export interface PmsDiningTable {
  id: string;
  tableName: string;
  tableGroup: TableGroup;
  capacity?: number;
  status?: 'Vacant' | 'Running' | 'Billed' | 'Occupied';
  activeKotNos?: string[];
}

export interface PmsTableShiftRecord {
  id: string;
  fromTable: string;
  toTable: string;
  shiftedAt: string;
  kotsShifted: number;
  shiftedBy: string;
}

export interface PmsGstMaster {
  id: string;
  name: string;
  hsnNo: string;
  sgst: number;
  cgst: number;
  igst: number;
  vat: number;
  tax1?: number;
  tax2?: number;
  tax3?: number;
  tax4?: number;
  tax5?: number;
}

export interface PmsBusinessSource {
  id: string;
  name: string;
  remark: string;
}

export interface PmsVoucherType {
  id: string;
  voucherTypeName: string;
  startingNumber: number;
  prefix: string;
  suffix: string;
  numberingStyle: 'Continue' | 'Yearly';
  printName: string;
  remark: string;
}

export interface PmsAdvanceReceipt {
  receiptNo: string;        // e.g. AR12 or AR/101/24-25
  voucherNo?: string;       // e.g. 12
  date: string;             // DD-MM-YYYY
  time: string;
  voucherName: 'Advance_Receipt';
  roomNo: string;
  guestName: string;
  mobile: string;
  amount: number;
  paymentMode: 'Cash' | 'Online' | 'Card' | 'PAY TM' | 'STATE BANK OF INDIA' | 'tata moters';
  referenceNo?: string;
  remark: string;
  createdAt: string;
}

export interface LedgerEntry {
  date: string;
  type: string;
  accountName: string;
  remark: string;
  debit: number;
  credit: number;
  balance: number;
  balanceType: 'Dr' | 'Cr';
}

export interface PmsCompanyInfo {
  firmName: string;
  address1: string;
  address2?: string;
  city: string;
  pincode: string;
  state: string;
  phone?: string;
  mobile: string;
  email: string;
  website?: string;
  gstNo: string;
  companyGstCode: string; // 2-digit state code, e.g. "27" (Maharashtra) or "22" (Chhattisgarh)
  pencardNo?: string;
  regNo2?: string;
  gstNotApplicable: boolean;
  makeAllBillLocalGst: boolean;
  updatedAt?: string;
}

// Video 11: Room Shifting Data Contracts
export interface PmsRoomShiftRecord {
  id: string;
  shiftNo: string;              // e.g. RS/01/24-25
  checkInNo: string;            // e.g. SR/204/25-26
  guestName: string;
  guestMobile: string;
  fromRoomNo: string;
  fromRoomType: string;
  toRoomNo: string;
  toRoomType: string;
  oldTariff: number;
  newTariff: number;
  shiftDate: string;            // DD-MM-YYYY
  shiftTime: string;            // HH:MM AM/PM
  reason: string;
  transferredKotsCount: number;
  transferredAdvance: number;
  previousRoomMarkedDirty: boolean;
  shiftedBy: string;
  remark?: string;
  createdAt: string;
}

// Video 15: General Receipt Entry & Outstanding Receivables
export interface PmsReceiptRecord {
  id: string;
  sNo: number;
  voucherName: string;          // e.g. "Receipts"
  receiptNo: string;            // e.g. "REC/12/24-25"
  voucherNo: number;            // e.g. 12
  date: string;                 // YYYY-MM-DD or DD-MM-YYYY
  paymentMode: 'Cash' | 'Online' | 'Card' | 'UPI' | 'Cheque';
  accountName: string;          // e.g. "raj", "Vivek", "tata moters"
  accountMobile?: string;       // e.g. "9741523421"
  amount: number;               // e.g. 7500, 2000
  remark: string;               // e.g. "old bill", "reciept by owner"
  createdAt: string;
}

export interface PmsPartyAccount {
  id: string;
  name: string;
  mobile?: string;
  category: 'Customer' | 'Corporate' | 'Owner' | 'Bank' | 'General';
  balance: number;              // Current balance
  balanceType: 'Dr' | 'Cr';     // Debit or Credit
}

// Video 16: Payment Voucher & Payouts Entry
export interface PmsPaymentRecord {
  id: string;
  sNo: number;
  voucherName: string;          // e.g. "Payments"
  paymentNo: string;            // e.g. "PAY/5/24-25"
  voucherNo: number;            // e.g. 5
  date: string;                 // YYYY-MM-DD or DD-MM-YYYY
  paymentMode: 'Cash' | 'Online' | 'Card' | 'UPI' | 'Cheque';
  accountName: string;          // e.g. "shri sunder lal tiwari(owner)", "auto commision"
  accountMobile?: string;
  amount: number;               // e.g. 11000, 98717, 1000, 50000
  remark: string;               // e.g. "cash handover", "101 ka commision", "paymnet -4757344"
  createdAt: string;
}

// ==========================================
// Video 19: Store Management & Stock Control Contracts
// ==========================================
export type ItemHeadGroup = 'Restaurant_Item' | 'Raw_Material';

export interface PmsItemGroup {
  id: string;
  sNo: number;
  name: string;               // e.g. "Genral", "Raw Material", "spices", "sabzi and paneer"
  headGroup: ItemHeadGroup;   // "Restaurant_Item" vs "Raw_Material"
  createdAt?: string;
}

export interface PmsGodown {
  id: string;
  sNo: number;
  name: string;               // e.g. "Main Store", "Kitchen", "Consume", "STORE1"
  address: string;            // e.g. "Main Store", "Kitchen", "Kitchen Consumption", "TOP FLOOR"
  createdAt?: string;
}

export interface PmsPurchaseItem {
  sNo: number;
  itemId: string;
  itemName: string;
  barcode?: string;
  qty: number;
  rate: number;
  amount: number;             // qty * rate
  discountPercent: number;
  discountAmt: number;
  totalDiscount: number;
  taxable: number;
  gstPercent: number;
  gstAmt: number;
  netValue: number;
}

export interface PmsPurchaseBill {
  id: string;
  billNo: string;             // e.g. "6" or "PUR/6/24-25"
  billDate: string;           // DD-MM-YYYY
  godown: string;             // e.g. "Main Store"
  terms: 'Credit' | 'Cash' | 'Online';
  accountName: string;        // e.g. "GUPTA JII", "M/S KIRANA STORE"
  items: PmsPurchaseItem[];
  totalQty: number;
  totalAmount: number;
  totalDiscount: number;
  totalTaxable: number;
  totalGstAmt: number;
  totalNetValue: number;
  createdAt: string;
}

export interface PmsStockTransferItem {
  sNo: number;
  itemId: string;
  itemName: string;
  barcode?: string;
  qty: number;
  rate: number;
  amount: number;
  discountAmt?: number;
  totalDiscount?: number;
  gstPercent?: number;
  gstAmt?: number;
  netValue?: number;
}

export interface PmsStockTransfer {
  id: string;
  entryNo: string;            // e.g. "ST/1/24-25"
  date: string;               // DD-MM-YYYY
  fromGodown: string;         // e.g. "Main Store", "Kitchen"
  toGodown: string;           // e.g. "Kitchen", "Consume"
  billDate: string;           // DD-MM-YYYY
  billNo: string;             // e.g. "1", "101"
  items: PmsStockTransferItem[];
  totalQty: number;
  totalAmount: number;
  totalDiscount?: number;
  totalTaxable?: number;
  totalGstAmt?: number;
  totalNetValue?: number;
  remark?: string;
  createdAt: string;
}

export interface GodownStockRow {
  sNo: number;
  itemName: string;
  barcode?: string;
  unit?: string;
  stockIn: number;
  stockOut: number;
  closingStock: number;
}

// ==========================================
// Video 21: Multi-User, Multi-Location & Role-Based Access Control Models (Frames 0115 - 0180)
// ==========================================

export interface PmsRole {
  id: number;
  name: string; // 'super-admin' | 'admin' | 'staff' | 'user' | 'Lead Managment' | 'Restaurent' | 'Billing' | custom
  description?: string;
  permissions: string[];
  isSystem?: boolean;
}

export interface PmsUserAccount {
  id: number;
  sNo: number;
  firmId: string; // 'DEMO0004', 'SVR0001', etc.
  userName: string;
  emailId: string;
  roleId: number;
  roleName: string;
  status: 'Verified' | 'Pending' | 'Active' | 'Inactive';
  regDate: string; // 'YYYY-MM-DD HH:mm:ss'
  verifiedDate?: string;
  mobile?: string;
  password?: string;
  department?: 'Front Office' | 'Housekeeping' | 'Restaurant & F&B' | 'Kitchen' | 'Accounts & Cashier' | 'Security & Audit' | 'General Management';
  shift?: 'Morning (07:00 - 15:00)' | 'Evening (15:00 - 23:00)' | 'Night (23:00 - 07:00)' | 'General (09:00 - 18:00)';
  isOnDuty?: boolean;
}

export interface PmsChainProperty {
  firmId: string; // e.g. "DEMO0004", "SVR0001", "SVR0002"
  firmName: string; // e.g. "HALL OF KNOTS / SAI VASUDEV RESIDENCY"
  location: string; // e.g. "Shirdi", "Pune", "Nashik"
  address: string;
  phone: string;
  email: string;
  gstin: string;
  totalRooms: number;
  activationDate: string;
  renewDate: string;
  whatsAppValidity: string;
  isCurrent?: boolean;
}

// RoomG Video 23: Complete 72 Granular Permission Matrix (Frame 0140 & 0185)
export const PMS_ALL_PERMISSIONS: { key: string; label: string; category: string }[] = [
  // Role & Permission Management (Column 1 & 2 Frame 0140)
  { key: 'view role', label: 'View Role', category: 'Roles & Permissions' },
  { key: 'create role', label: 'Create Role', category: 'Roles & Permissions' },
  { key: 'update role', label: 'Update Role', category: 'Roles & Permissions' },
  { key: 'delete role', label: 'Delete Role', category: 'Roles & Permissions' },
  { key: 'view permission', label: 'View Permission', category: 'Roles & Permissions' },
  { key: 'create permission', label: 'Create Permission', category: 'Roles & Permissions' },
  { key: 'update permission', label: 'Update Permission', category: 'Roles & Permissions' },
  { key: 'delete permission', label: 'Delete Permission', category: 'Roles & Permissions' },

  // User & Staff Management (Column 3 & 4 Frame 0140)
  { key: 'view user', label: 'View User', category: 'User Management' },
  { key: 'create user', label: 'Create User', category: 'User Management' },
  { key: 'update user', label: 'Update User', category: 'User Management' },
  { key: 'delete user', label: 'Delete User', category: 'User Management' },
  { key: 'Account List', label: 'Account List', category: 'User Management' },

  // Master & Catalogs (Frame 0140)
  { key: 'view product', label: 'View Product / Item', category: 'Catalog & Master' },
  { key: 'create product', label: 'Create Product', category: 'Catalog & Master' },
  { key: 'update product', label: 'Update Product', category: 'Catalog & Master' },
  { key: 'delete product', label: 'Delete Product', category: 'Catalog & Master' },
  { key: 'Master', label: 'Master Submenu', category: 'Catalog & Master' },
  { key: 'Item List', label: 'Item List', category: 'Catalog & Master' },
  { key: 'Room List', label: 'Room List', category: 'Catalog & Master' },

  // Front Office & Hotel Module (Frame 0140 & Frame 0185)
  { key: 'Hotel Module', label: 'Hotel Module Access', category: 'Front Office & Rooms' },
  { key: 'Room_Dashboard', label: 'Room Dashboard', category: 'Front Office & Rooms' },
  { key: 'roombooking', label: 'Room Booking', category: 'Front Office & Rooms' },
  { key: 'roomcheckin', label: 'Room Check In', category: 'Front Office & Rooms' },
  { key: 'roomcheckout', label: 'Room Check Out', category: 'Front Office & Rooms' },
  { key: 'Booking Calendar', label: 'Booking Calendar', category: 'Front Office & Rooms' },
  { key: 'Unconfirmed Bookings', label: 'Unconfirmed Bookings', category: 'Front Office & Rooms' },
  { key: 'Booking Register', label: 'Booking Register', category: 'Front Office & Rooms' },
  { key: 'Check-in Register', label: 'Check-in Register', category: 'Front Office & Rooms' },
  { key: 'Checkout Register', label: 'Checkout Register', category: 'Front Office & Rooms' },
  { key: 'Checkout_Reg', label: 'Checkout Register Quick', category: 'Front Office & Rooms' },
  { key: 'Handover', label: 'Shift Handover', category: 'Front Office & Rooms' },
  { key: 'Mycheckout', label: 'My Checkout Operations', category: 'Front Office & Rooms' },

  // Critical Anti-Fraud & Boundary Control Permissions (Video 23 Spoken Transcript)
  { key: 'Change_Room_Tariff', label: 'Change Room Tariff (Price Override)', category: 'Anti-Theft Security' },
  { key: 'Chang_Rent_Perday', label: 'Change Rent Per Day', category: 'Anti-Theft Security' },
  { key: 'Change_Date&Time', label: 'Change Date & Time (Anti-Backdating)', category: 'Anti-Theft Security' },
  { key: 'sql_query', label: 'SQL Query Console (Root Access)', category: 'Anti-Theft Security' },

  // Restaurant & Kitchen POS (Frame 0140 & Frame 0185)
  { key: 'Restaurant Module', label: 'Restaurant Module Access', category: 'Restaurant & POS' },
  { key: 'kot', label: 'KOT Entry', category: 'Restaurant & POS' },
  { key: 'foodbills', label: 'Food Bills', category: 'Restaurant & POS' },
  { key: 'Restaurant', label: 'Restaurant Matrix', category: 'Restaurant & POS' },
  { key: 'Kitchen Dash Board', label: 'Kitchen Dashboard', category: 'Restaurant & POS' },
  { key: 'Room Food Bills', label: 'Room Food Bills', category: 'Restaurant & POS' },
  { key: 'Restaurant Food Bills', label: 'Restaurant Food Bills', category: 'Restaurant & POS' },
  { key: 'Kot Register', label: 'KOT Register', category: 'Restaurant & POS' },

  // Accounting, Payments & Ledgers (Frame 0140)
  { key: 'payment', label: 'Payment Entry', category: 'Accounting & Ledgers' },
  { key: 'receipt', label: 'Receipt Entry', category: 'Accounting & Ledgers' },
  { key: 'advance_reciept', label: 'Advance Receipt', category: 'Accounting & Ledgers' },
  { key: 'Advance Receipt Reg', label: 'Advance Receipt Register', category: 'Accounting & Ledgers' },
  { key: 'ledger', label: 'Party Ledger', category: 'Accounting & Ledgers' },
  { key: 'Outstanding Receivable', label: 'Outstanding Receivables', category: 'Accounting & Ledgers' },
  { key: 'Outstanding Payable', label: 'Outstanding Payables', category: 'Accounting & Ledgers' },
  { key: 'sale', label: 'Sales Management', category: 'Accounting & Ledgers' },
  { key: 'Month Wise Sale', label: 'Month Wise Sale', category: 'Accounting & Ledgers' },
  { key: 'B2B Sale', label: 'B2B GST Sale', category: 'Accounting & Ledgers' },
  { key: 'B2C Sale', label: 'B2C Retail Sale', category: 'Accounting & Ledgers' },

  // Store & Inventory (Frame 0140)
  { key: 'purchase', label: 'Purchase Inward', category: 'Store & Inventory' },
  { key: 'Stock_Transfer', label: 'Stock Transfer & Issue', category: 'Store & Inventory' },
  { key: 'Store Wise Stock', label: 'Store Wise Stock', category: 'Store & Inventory' },
  { key: 'Stock Status', label: 'Stock Status', category: 'Store & Inventory' },
  { key: 'Stock In Register', label: 'Stock In Register', category: 'Store & Inventory' },
  { key: 'Stock Out Register', label: 'Stock Out Register', category: 'Store & Inventory' },
  { key: 'Stock Transfer Register', label: 'Stock Transfer Register', category: 'Store & Inventory' },

  // Reports, Audit & Compliance (Frame 0140)
  { key: 'Report', label: 'Report Menu', category: 'Reports & Compliance' },
  { key: 'ReportList', label: 'Report List', category: 'Reports & Compliance' },
  { key: 'Police Station Report', label: 'Police Station Report', category: 'Reports & Compliance' },
  { key: 'Item Wise Sale Report', label: 'Item Wise Sale Report', category: 'Reports & Compliance' },
  { key: 'Day End Report', label: 'Day End Closing Report', category: 'Reports & Compliance' },
  { key: 'GST Report', label: 'GST Statutory Report', category: 'Reports & Compliance' },

  // System, Settings & Action Operations (Frame 0140)
  { key: 'Entry', label: 'Entry Submenu', category: 'System & Controls' },
  { key: 'Setting', label: 'Setting Submenu', category: 'System & Controls' },
  { key: 'Activity', label: 'Activity Logs', category: 'System & Controls' },
  { key: 'Membership', label: 'Membership', category: 'System & Controls' },
  { key: 'Lead Module', label: 'Lead Management Module', category: 'System & Controls' },
  { key: 'Only_Whatsapp', label: 'Only WhatsApp Messaging', category: 'System & Controls' },
  { key: 'Add', label: 'Add Records', category: 'System & Controls' },
  { key: 'View', label: 'View Details', category: 'System & Controls' },
  { key: 'Print', label: 'Print Reports & Invoices', category: 'System & Controls' },
  { key: 'Save', label: 'Save Records', category: 'System & Controls' },
  { key: 'Edit', label: 'Edit Records', category: 'System & Controls' },
  { key: 'Delete', label: 'Delete Records (Strict Anti-Fraud)', category: 'System & Controls' }
];

// ============================================================================
// Video 22: Auto WhatsApp SMS Integration, Message Templates & Fraud Alerts
// ============================================================================

export interface PmsWhatsAppTemplate {
  id: number;
  sNo: number;
  type: 'WhatsApp' | 'SMS';
  voucherType: string; // e.g. "Check_out_store", "Check_out_delete", "Check_in_store"
  label: string;       // e.g. "Check-Out Guest Bill & Thank You"
  message: string;
  active: 'On' | 'Off';
  sendTo: 'Guest' | 'Owner' | 'Both';
}

export interface PmsWhatsAppLog {
  id: string;
  timestamp: string;      // DD-MM-YYYY HH:mm:ss
  recipientMobile: string;
  recipientName: string;
  recipientType: 'Guest' | 'Owner' | 'Staff';
  voucherType: string;
  voucherNo?: string;
  roomNo?: string;
  message: string;
  status: 'Sent' | 'Delivered' | 'Pending' | 'Failed';
  firmId?: string;
}

export interface PmsWhatsAppConfig {
  apiUrl: string;
  instanceId: string;
  token: string;
  ownerMobile: string;
  validityDate: string;    // e.g. "2026-06-29"
  autoSendOnCheckIn: boolean;
  autoSendOnCheckOut: boolean;
  autoSendOnBooking: boolean;
  autoSendOnFoodBill: boolean;
  autoAlertOwnerOnDelete: boolean;
  autoAlertOwnerOnUpdate: boolean;
}

// ==========================================
// Video 24: Police Station Report Types (Frames 0100, 0105, 0110, 0125, 0140)
// ==========================================
export interface PoliceStationReportFilter {
  fromDate: string;   // DD-MM-YYYY
  toDate: string;     // DD-MM-YYYY
  format: 'format1' | 'format2'; // format1 = Interactive Table, format2 = Official Police Verification PDF
}

export interface PoliceGuestProfileItem {
  checkInNo: string;
  guestName: string;
  documentNo?: string;
  secondGuestName?: string;
  thirdGuestName?: string;
  photos: {
    label: string;
    url: string;
  }[];
}

// ==========================================
// Video 25: Online Vs Offline Architecture & Backup Types (Frames 0120, 0280, 0320, 0350)
// ==========================================
export interface PmsDatabaseBackup {
  version: string;
  timestamp: string;
  firmId: string;
  firmName: string;
  data: {
    rooms?: any[];
    bookings?: any[];
    checkIns?: any[];
    kots?: any[];
    bills?: any[];
    payments?: any[];
    users?: any[];
    godowns?: any[];
    itemGroups?: any[];
    whatsAppLogs?: any[];
    companyInfo?: any;
  };
}

export interface ArchitectureComparisonItem {
  sNo: number;
  feature: string;
  category: 'Core' | 'Security' | 'Operations' | 'Enterprise';
  offline: {
    status: 'yes' | 'no' | 'partial';
    text: string;
  };
  online: {
    status: 'yes' | 'no' | 'partial';
    text: string;
  };
}
