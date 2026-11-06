/**
 * SRI SAI VASUDEV RESIDENCY - Enterprise Hotel PMS Models & Data Contracts
 * Derived from Video 01: RoomG PMS Training & Feature Analysis
 */

export type RoomStatus =
  | 'vacant'
  | 'booked'
  | 'occupied'
  | 'dirty'
  | 'blocked'
  | 'maintenance'
  | 'VACANT_CLEAN'
  | 'VACANT_DIRTY'
  | 'OCCUPIED_CLEAN'
  | 'OCCUPIED_DIRTY'
  | 'UNDER_MAINTENANCE'
  | 'MANAGEMENT_BLOCK';

export interface PmsJournalEntry {
  entryId: string;
  date: string;
  time: string;
  voucherType: 'Advance' | 'NightAudit' | 'PosBill' | 'RoomPosting' | 'CheckOut' | 'Expense' | 'Manual';
  referenceNo: string;
  narration: string;
  debitAccount: string;
  creditAccount: string;
  amountPaise: number;
  amountRupees: number;
  postedBy?: string;
}

export interface KotVoidAuditLog {
  id: string;
  tableSessionId?: string;
  tableNo?: string;
  kotNo: string;
  itemCode: string;
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
  voidReason: string;
  stewardId?: string;
  approvingManagerId?: string;
  managerPin?: string;
  foodStatus: 'Prepared/Wasted' | 'Unprepared';
  voidedAt: string;
  voidedBy: string;
}

export interface TableSession {
  sessionId: string;
  tableNo: string;
  startTime: string;
  status: 'Active' | 'Billed' | 'Closed' | 'Settled';
  kotNumbers: string[];
  cumulativeItems: KotItem[];
  cumulativeAmount: number;
  mergedTables?: string[];
  waiterName?: string;
  guestName?: string;
}

export interface RfidKeyCard {
  cardUid: string;
  roomNo: string;
  guestName: string;
  checkInTime: string;
  scheduledCheckoutTime: string;
  cardDeactivationTime: string; // T-minus 1 hour cutoff
  status: 'ACTIVE' | 'WARNING_T_MINUS_1H' | 'DEACTIVATED' | 'EXTENDED' | 'Deactivated';
  extensionLogged: boolean;
  extensionFee: number;
  encodedBy: string;
  lastUpdated: string;
  expiryTime?: string;
  checkoutTime?: string;
  issuedAt?: string;
}

export interface HousekeepingDiscrepancy {
  id: string;
  roomNo: string;
  frontDeskStatus?: string;       // e.g. "Occupied"
  housekeepingStatus: string;     // e.g. "Vacant Dirty"
  reportedAt: string;
  reportedBy: string;
  resolved?: boolean;
  notes: string;
  isShortStaySuspect?: boolean;
  pmsStatus?: string;
  status?: string;
  severity?: string;
  guestName?: string;
  discrepancyType?: string;
}

export interface GroupBookingGuest {
  name: string;
  phone?: string;
  idProofType?: string;
  idProofNumber?: string;
  age?: number;
  roomAssigned: string;
  isPrimary: boolean;
}

export interface GroupBookingMetadata {
  groupId: string;
  groupName: string;
  contactPerson: string;
  contactPhone: string;
  bookingSource: 'Direct Phone Reservation' | 'Online Booking Engine' | 'Corporate Travel';
  roomsAllocated: string[];
  guests: GroupBookingGuest[];
  advancePaid: number;
  balanceDue: number;
  specialInstructions: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'Confirmed' | 'Checked-In' | 'Completed' | 'Cancelled';
}

export interface PmsRoom {
  id: string;
  roomNo: string;
  roomType: 'Deluxe' | 'Classic Studio' | 'Executive' | 'Premium' | string;
  tariff: number;
  status: RoomStatus;
  floor: number;
  facilities: string;
  capacity?: number;
  maxGuests?: number;
  bedType?: string;
  roomSize?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  currentGuest?: {
    name: string;
    phone: string;
    email?: string;
    checkInDate: string;
    checkInTime: string;
    checkOutDate?: string;
    checkOutTime?: string;
    bookingNo?: string;
    advancePaid?: number;
    calculationType?: '24hour' | '12hour';
    darshanSlot?: string;
    vehicleNo?: string;
    idProofType?: string;
    idProofNumber?: string;
    companyName?: string;
    gstin?: string;
  };
  foodAmount?: number;
  assignedStaff?: 'Ramesh' | 'Sunita' | 'Ganesh' | 'Priya' | string;
  priority?: 'High - Guest Waiting' | 'Normal' | 'VIP Suite';
  lastCleaned?: string;
  maintenanceIssue?: string;
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

  // Modern Cross-Module Compatibility Fields
  roomNo?: string;
  roomType?: string;
  tariff?: number;
  guestPhone?: string;
  guestEmail?: string;
  advancePaid?: number;
  voucherNo?: string;
  date?: string;
  time?: string;
  adults?: number;
  children?: number;
  source?: string;
  specialRequests?: string;
  idProofType?: string;
  idProofNumber?: string;
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
  isJain?: boolean;
  jainPrep?: boolean;
  lessSpicy?: boolean;
  noGhee?: boolean;
  instructions?: string;
  notes?: string;
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
  tableSessionId?: string;    // Module 1: Single active table session ID
  kotSequence?: number;       // Sequential KOT #1, #2, #3 for the session
  isDelta?: boolean;          // Module 2: True if running KOT contains delta newly added items
  deltaItems?: KotItem[];     // Newly added items for chef KDS display
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
  checkOutDate?: string;       // YYYY-MM-DD
  checkOutTime?: string;       // HH:MM AM/PM
  numberOfDays: number;
  numberOfGuests: number;
  adults?: number;
  children?: number;
  extraGuests?: number;
  extraGuestCharge?: number;
  extraGuestRate?: number;
  totalStayTariff?: number;
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
  documentKey?: string;
  idProofDocumentKey?: string;
  guestImage?: string;
  guestPhotoUrl?: string;
  idProofBackImage?: string;
  invoicePdfKey?: string;
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
  noDiscount?: boolean;
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
  steward?: string;           // e.g. Dilip, Ranjan
  covers?: number;            // Number of dining guests / covers (e.g. 2)
  outlet?: string;            // e.g. PEARL RESTAURANT, Vasudev Rasoi
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
  paidAmount?: number;
  balanceAmount?: number;
  rate?: number;
  extraBedCharge?: number;
  roomRentTotal?: number;
  foodCharge?: number;
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
  invoiceFormat?: 'A4_Standard' | 'A5_HalfPage' | 'Detailed' | 'Enterprise_Folio' | 'Card_EDC_Slip' | 'Restaurant_DineIn' | 'RoomService';
  isTaxInclusive?: boolean;
  isComplimentary?: boolean;
  isCancelled?: boolean;
  is_deleted?: boolean;
  billingOfficer?: string;    // e.g. DEMO0004
  dayWiseRent?: DayWiseRentItem[];
  idType?: string;
  idNumber?: string;
  comingFrom?: string;
  proceedingTo?: string;
  purpose?: string;
  roomTaxable?: number;
  foodTaxable?: number;
  miscTaxable?: number;
  roomGstAmount?: number;
  foodGstAmount?: number;
  miscGstAmount?: number;
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
  hsnCode?: string;
  sacCode?: string;
  noDiscount?: boolean; // Video 33: Flag to prohibit bill discounts on protected items
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
  activeSessionId?: string; // Module 1: Single active session ID
  sessionStartTime?: string;
  mergedWithTables?: string[]; // Module 1: Merged tables list
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
  id?: string;
  sNo?: number;
  receiptNo: string;        // e.g. AR12 or AR/101/24-25
  voucherNo?: string;       // e.g. 12
  date: string;             // DD-MM-YYYY
  time: string;
  voucherName: 'Advance_Receipt';
  roomNo: string;
  guestName: string;
  mobile: string;
  amount: number;
  paymentMode: 'Cash' | 'Online' | 'Card' | 'UPI' | 'Bank Transfer' | 'PAY TM' | 'STATE BANK OF INDIA' | 'tata moters' | string;
  referenceNo?: string;
  remark: string;
  createdAt?: string;
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
  legalName?: string;
  address1: string;
  address2?: string;
  city: string;
  district?: string;
  pincode: string;
  state: string;
  phone?: string;
  mobile: string;
  email: string;
  website?: string;
  gstNo: string;
  companyGstCode: string; // 2-digit state code, e.g. "21" (Odisha)
  pencardNo?: string;
  regNo2?: string;
  gstNotApplicable: boolean;
  makeAllBillLocalGst: boolean;
  tradeName?: string;
  hotelName?: string;
  gstin?: string;
  pan?: string;
  panNo?: string;
  constitution?: string;
  proprietorName?: string;
  proprietorResidence?: string;
  buildingPremises?: string;
  landmarkStreet?: string;
  dateOfLiability?: string;
  periodOfValidity?: string;
  approvingOfficer?: string;
  additionalPlaces?: number;
  gstNotice?: string;
  
  // Video 26 Banking, UPI & Branding Details (Frames 0240, 0250, 0255)
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankBranch?: string;
  upiId?: string;
  phonePeGpay?: string;
  jurisdiction?: string;
  country?: string;
  currency?: string;
  taxSystem?: string;
  restaurantFoodBillTaxInclusive?: boolean;
  termsAndConditions?: string;
  logoUrl?: string;
  qrCodeUrl?: string;
  sealUrl?: string;
  signatureUrl?: string;
  brandUrl?: string;
  voucherPrefix?: string;
  voucherSuffix?: string;
  voucherNote?: string;
  
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
  name: string;               // e.g. "Genral", "Raw Material", "spices", "sabzi and paneer", "Beverage", "Dessert", "Liquor"
  headGroup: ItemHeadGroup;   // "Restaurant_Item" vs "Raw_Material"
  noDiscount?: boolean;       // Video 33: Auto-exempts all items under this group from bill discounts
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
  category?: string;
  headGroup?: string;
  stockIn: number;
  stockOut: number;
  closingStock: number;
  rate?: number;
  stockValue?: number;
  reorderLevel?: number;
  isLowStock?: boolean;
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
  firmName: string; // e.g. "SRI SAI VASUDEV RESIDENCY"
  location: string; // e.g. "Rayagada", "Bhubaneswar", "Visakhapatnam"
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
  mode?: 'direct_wame' | 'api_gateway'; // Option 1: Direct wa.me (Click-to-Chat - 100% Free Forever) vs Option 2: Gateway API
  apiUrl: string;
  instanceId: string;
  token: string;
  ownerMobile: string;
  validityDate: string;    // e.g. "Lifetime (100% Free Forever)" or "2026-06-29"
  wamePhonePrefix?: string; // Default '91' for India
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
    [key: string]: any;
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

// ==========================================
// Video 26: Bill Format Engine & Digital Branding Assets (Frames 0115, 0170, 0195, 0215, 0240, 0250, 0270)
// ==========================================
export type BillFormatType = 
  | 'Format_1_DayWise'       // /room_checkout_view2/:id - Itemized daily stay breakdown with yellow header & SAC 996311
  | 'Format_2_Summary'       // /room_checkout_view/:id - General Tax Invoice with guest & room details
  | 'Format_3_A4_Standard'   // /room_checkout_view3/:id - A4 Standard Format with key drop notice, GST table & signatures (RECOMMENDED)
  | 'Format_4_A5_Compact'    // /room_checkout_view4/:id - A5 Half-Page condensed format for thermal/A5 stationery
  | 'Format_5_Enterprise_Folio' // /enterprise_folio/:id - Classic Dot-Matrix Master Folio (Document 3) with SAC ledger & dual tax breakdown
  | 'Format_6_Restaurant_DineIn' // /restaurant_bill/:id - Restaurant Dine-In Bill with Room Transfer Block (Document 1)
  | 'Format_7_RoomService'   // /room_service_bill/:id - In-Room Dining Service Bill with Guest Authorization (Document 2)
  | 'Format_8_Card_EDC_Slip'; // /pos_card_slip/:id - EDC Thermal Card Swipe Settlement Slip (Document 4)

export interface BillFormatOption {
  id: BillFormatType;
  name: string;
  label: string;
  route: string;
  paperSize: 'A4' | 'A5' | 'Letter';
  recommended?: boolean;
  buttonColor: string;
  description: string;
}

export interface CompanyPicAsset {
  sNo: number;
  title: string;
  code: 'logo' | 'qr_code' | 'seal' | 'signature' | 'brand';
  currentUrl?: string;
  description: string;
}

// ==========================================
// Video 27: Top 20 Features of RoomG PMS Master Models (Frames 0005-0815)
// ==========================================
export type PmsFeatureCategory = 
  | 'FrontDesk' 
  | 'Restaurant' 
  | 'Billing' 
  | 'Inventory' 
  | 'Security';

export interface PmsTopFeature {
  id: number;
  title: string;
  hindiTitle: string;
  category: PmsFeatureCategory;
  categoryLabel: string;
  route: string;
  summary: string;
  fullDescription: string;
  antiTheftRationale?: string;
  targetModal: string;
  icon: string;
  accentColor: string;
  specs: string[];
}

export interface RoomGSystemPricing {
  mrp: number;
  discount: number;
  finalPrice: number;
  gstExtra: boolean;
  demoUrl: string;
  demoUser: string;
  demoPassword: string;
  salesPhones: string[];
  salesEmail: string;
  officialWebsite: string;
}

// ==========================================
// Video 28: GST Reports & Report Dashboard Types (Frames 0080-0330)
// ==========================================
export type PmsGstReportTab = 'consolidated' | 'b2b' | 'b2c' | 'dashboard';

export interface PmsB2BInvoiceRecord {
  sNo: number;
  gstin: string;
  receiverName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  placeOfSupply: string;
  reverseCharge: 'Y' | 'N';
  applicableTaxRate: string;
  invoiceType: 'Regular B2B' | 'SEZ Supplies' | 'Deemed Exports';
  eCommerceGstin: string;
  rate: number;
  taxableValue: number;
  cessAmount: number;
}

export interface PmsB2CInvoiceRecord {
  sNo: number;
  type: string;
  placeOfSupply: string;
  applicableTaxRate: string;
  rate: number;
  taxableValue: number;
  cessAmount: number;
  eCommerceGstin: string;
}

export interface PmsConsolidatedGstItem {
  sNo: number;
  voucherNo: string;
  roomNoOrTable: string;
  guestName: string;
  address: string;
  city: string;
  state: string;
  mobile: string;
  firmName: string;
  gstin: string;
  checkInDate: string;
  invoiceDate: string;
  totalDays: number;
  type: 'Room Bill' | 'Food Bill' | 'Banquet Event' | 'Bar & Lounge';
  gstRate: number;
  sgst: number;
  cgst: number;
  igst: number;
  taxable: number;
  totalGst: number;
  billAmount: number;
  advanceOrDiscount: number;
  netPayAmount: number;
}

export interface PmsReportDashboardButton {
  title: string;
  route: string;
  bgColor: string;
  textColor: string;
  icon: string;
  category: 'Front Desk' | 'Restaurant' | 'Store' | 'Financials' | 'GST & Taxes' | 'Staff';
  actionKey: string;
}

// ==========================================
// Video 29: All Hotel Reports Master Models (Frames 0080-0550)
// ==========================================

export interface PmsOutstandingAccount {
  sNo: number;
  accountName: string;
  mobile: string;
  balance: number;
  balanceType: 'Dr' | 'Cr';
  category?: string;
  lastTransactionDate?: string;
}

export interface PmsItemWiseSale {
  sNo: number;
  itemName: string;
  category?: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface PmsDayEndLedgerEntry {
  date: string;
  type: string;
  accountName: string;
  remark: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface PmsDayEndAccountGroup {
  accountName: string;
  date: string;
  closingBalance: number;
  entries: PmsDayEndLedgerEntry[];
  totalDebit: number;
  totalCredit: number;
}

export interface PmsDayEndReport {
  hotelName: string;
  address: string;
  phone: string;
  email: string;
  reportDate: string;
  generatedAt: string;
  groups: PmsDayEndAccountGroup[];
  grandTotalDebit: number;
  grandTotalCredit: number;
  cashInHand: number;
}

export interface PmsGuestLogEntry {
  sNo: number;
  guestName: string;
  phone?: string;
  city?: string;
  numberOfVisits: number;
  totalAmount: number;
  lastVisitDate?: string;
  vipTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export interface PmsItemStockLedgerEntry {
  date: string;
  transactionType: string;
  remark: string;
  stockIn: number;
  stockOut: number;
  balance: number;
}

export interface PmsItemStockReport {
  itemName: string;
  itemCategory: string;
  unit: string;
  fromDate: string;
  toDate: string;
  openingBalance: number;
  entries: PmsItemStockLedgerEntry[];
  totalStockIn: number;
  totalStockOut: number;
  closingBalance: number;
}

export interface PmsShiftHandoverRecord {
  shiftId: string;
  shiftDate: string;
  shiftTime: string;
  userEmail: string;
  userName: string;
  shiftType: 'Morning' | 'Evening' | 'Night';
  openingDrawerCash: number;
  roomCashCollected: number;
  foodCashCollected: number;
  advanceCashCollected: number;
  expensesPaidFromDrawer: number;
  netPhysicalCashInDrawer: number;
  onlineUpiVerified: number;
  cardSwipeVerified: number;
  creditAccountsAdded: number;
  totalTransactionsHandled: number;
  handoverToUser: string;
  handoverNotes: string;
  status: 'Pending Verification' | 'Verified & Closed';
}

// Video 30: RoomG Hotel Management Software Training & Support Models
export interface PmsHelpVideo {
  id: string;
  sNo: number;
  businessType: string;
  type: string;
  topic: string;
  description?: string;
  url: string;
  videoDuration?: string;
  category?: 'All' | 'Front Desk' | 'Restaurant & POS' | 'Accounts & Ledgers' | 'Inventory & Stock' | 'Reports & GST' | 'Settings & Administration';
}

export interface PmsSupportTicket {
  id: string;
  ticketNo: string;
  date: string;
  time: string;
  staffName: string;
  department: string;
  phone: string;
  category: 'Check-in & KYC' | 'Billing & Checkout' | 'KOT & Kitchen POS' | 'GST & Tax Reports' | 'Stock & Inventory' | 'Night Audit & Day End' | 'Hardware & Printer' | 'WhatsApp SMS Integration' | 'User Roles & Access' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  subject: string;
  description: string;
  preferredCallbackTime: string;
  status: 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  assignedEngineer?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PmsRemoteSupportSession {
  tool: 'UltraViewer' | 'AnyDesk';
  partnerId: string;
  passcode: string;
  status: 'Ready' | 'Connected' | 'Disconnected';
  hotelName: string;
  contactPhone: string;
}

export interface PmsDemoRequest {
  id: string;
  hotelName: string;
  contactPerson: string;
  phoneNumber: string;
  whatsappNumber: string;
  email: string;
  propertyType: 'Hotel' | 'Resort' | 'Guest House' | 'Lodge' | 'Restaurant & Rooms' | 'Service Apartment';
  roomCount: number;
  hasRestaurant: boolean;
  city: string;
  state: string;
  preferredDate: string;
  status: 'Pending' | 'Demo Scheduled' | 'Demo Completed' | 'Trial Active';
  notes?: string;
  createdAt: string;
}

export interface PmsDocumentationChapter {
  id: string;
  chapterNo: number;
  title: string;
  shortSummary: string;
  fullContent: string;
  tags: string[];
  moduleUrl: string;
}

// ==========================================
// Video 31: MR / Salesman Wise Commission Tracking & Top 15 PMS Features
// ==========================================

export type PmsAgentType = 
  | 'Travel_Agent'
  | 'MR_Corporate'
  | 'Tour_Operator'
  | 'Auto_Taxi_Driver'
  | 'OTA_Broker'
  | 'Local_Guide';

export type PmsCommissionCalcType = 
  | 'PERCENTAGE'
  | 'FIXED_PER_ROOM'
  | 'FIXED_PER_NIGHT';

export interface PmsCommissionAgent {
  id: string; // e.g. AGT-101
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  city: string;
  address?: string;
  agentType: PmsAgentType;
  commissionType: PmsCommissionCalcType;
  defaultRate: number; // e.g. 15 for 15% or 300 for ₹300/room
  panNumber?: string;
  gstNumber?: string;
  bankDetails?: {
    bankName: string;
    accountNo: string;
    ifsc: string;
    accountHolder: string;
    upiId?: string;
  };
  status: 'ACTIVE' | 'INACTIVE';
  totalBookings: number;
  totalRevenueGenerated: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  balancePayable: number;
  notes?: string;
  createdAt: string;
}

export interface PmsAgentCommissionBooking {
  id: string; // e.g. COMM-2026-001
  agentId: string;
  agentName: string;
  agentType: PmsAgentType;
  checkInNo: string;
  bookingRefNo?: string;
  roomNo: string;
  guestName: string;
  guestMobile: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  roomTariff: number;
  grossRoomTariff: number; // Tariff * nights
  commissionType: PmsCommissionCalcType;
  commissionRate: number;
  grossCommission: number;
  tdsPercentage: number; // default 5% TDS under Sec 194H if PAN available, or 0%
  tdsAmount: number;
  netPayableCommission: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'VOID';
  payoutVoucherNo?: string;
  payoutDate?: string;
  createdAt: string;
  remarks?: string;
}

export interface PmsAgentPayoutVoucher {
  voucherNo: string; // e.g. AGTPAY-1001
  voucherDate: string;
  agentId: string;
  agentName: string;
  amount: number;
  paymentMode: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE';
  referenceNo?: string; // UTR or Cheque No
  settledCommissionIds: string[];
  tdsDeducted: number;
  grossAmount: number;
  notes?: string;
  createdBy: string;
  printTimestamp: string;
}

export interface PmsTop15OfficialFeature {
  id: number;
  title: string;
  hindiTitle: string;
  bulletSummary: string;
  fullDetail: string;
  targetModal: string;
  route: string;
  icon: string;
  badge: string;
  category: 'Front Desk' | 'Billing & Tax' | 'F&B POS' | 'Inventory & Stock' | 'Commissions' | 'Multi-Property' | 'WhatsApp & Security';
  videoTimestamp: string;
}

// ==========================================
// Video 32: Liquor & Bar Management Software Contracts (Frames 0080-0350)
// ==========================================
export interface PmsLiquorUnit {
  id: string;
  sNo: number;
  primaryUnitName: string;    // e.g. "30 ml", "60 Ml", "BOTTEL", "Pcs"
  conversion: number;         // e.g. 30, 60, 750, 1
  alternateUnitName: string;  // e.g. "ML", "Ml", "ML"
}

export interface PmsLiquorBrand {
  id: string;
  sNo: number;
  name: string;               // e.g. "Blander Spride", "Royal Stag", "Kingfisher", "Signature", "Imperial Blue"
  discountPercentage: number; // e.g. 0 or 5
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PmsLiquorItem {
  id: string;
  sNo: number;
  name: string;               // e.g. "Blender Spride (30Ml)", "Blenderspride (60 ML)", "Blender Spride (Bottel 750 ML )"
  brandName: string;          // e.g. "Blander Spride"
  barcodeNo: string;          // e.g. "10070", "10071", "10072"
  group: 'Liquor' | 'Beer' | 'Wine' | 'Whisky' | 'Vodka' | 'Rum';
  headGroup: 'Restaurant_Item';
  mrp: number;                // e.g. 230, 330, 1000
  rate: number;               // e.g. 230, 330, 1000
  purchaseRate: number;       // e.g. 400 (for 750ml bottle)
  unit: string;               // e.g. "30 ml", "60 Ml", "BOTTEL"
  conversionMl: number;       // e.g. 30, 60, 750
  taxType: 'VAT 13%' | 'VAT 10%' | 'GST 5%' | 'EXEMPT';
  vatPercentage: number;      // e.g. 13
  surchargePercentage: number;// e.g. 10 (Surcharge on VAT)
  active: boolean;
}

export interface PmsBrandWiseLiquorStock {
  brand: string;              // e.g. "Blander Spride"
  bottleMl: number;           // e.g. 750
  stockInMl: number;          // e.g. 22500
  stockOutMl: number;         // e.g. 450
  closingMl: number;          // e.g. 22050
  closingBottel: number;      // e.g. 29.4 (closingMl / bottleMl)
  lastUpdated?: string;
}

export interface PmsBarBillItem {
  sNo: number;
  itemId: string;
  itemName: string;
  brandName?: string;
  category: 'Liquor' | 'Food';
  qty: number;
  rate: number;
  amount: number;
  discountPercentage: number;
  discountAmount: number;
  taxableAmount: number;
  gstPercentage: number;      // e.g. 5% for food, 0% for liquor
  gstAmount: number;
  vatPercentage: number;      // e.g. 13% for liquor, 0% for food
  vatAmount: number;
  surchargePercentage: number;// e.g. 10% on VAT for liquor
  surchargeAmount: number;
  totalValue: number;
  unit: string;
  mlConsumed: number;         // e.g. qty * 30 ml
}

export interface PmsBarInvoice {
  billNo: string;             // e.g. "Res/289/24-25"
  date: string;               // e.g. "2025-07-20"
  time: string;               // e.g. "06:16"
  tableNo: string;            // e.g. "T-11"
  kotNo: string;              // e.g. "418"
  serviceType: 'Table Service' | 'Bar Counter' | 'Room Service' | 'TakeAway';
  guestName?: string;
  guestAddress?: string;
  guestMobile?: string;
  remark?: string;
  isB2b: boolean;
  gstin?: string;
  items: PmsBarBillItem[];
  totalItems: number;
  totalQuantity: number;
  basicAmount: number;
  sgstAmount: number;
  cgstAmount: number;
  vatAmount: number;
  surchargeAmount: number;
  roundOff: number;
  grandTotal: number;
  settled: boolean;
  paymentMode?: 'CASH' | 'CARD' | 'UPI' | 'ROOM_FOLIO';
  roomNo?: string;
  createdAt: string;
}

// ==========================================
// Video 33: No-Discount Item, Margin Protection & Group Rules Contracts (Frames 0080-0202)
// ==========================================
export interface PmsNoDiscountConfig {
  enabled: boolean;
  protectedGroups: string[];   // e.g. ["Beverage", "BAVRAGE", "Dessert", "DESERT", "Liquor", "Beer", "No Discount", "Tobacco"]
  maxAllowedDiscountPercent: number; // e.g. 20%
  allowManualOverride: boolean;
  overrideRoleRequired: string; // e.g. "Admin"
  reasonRequiredForOverride: boolean;
}

export interface PmsDiscountAuditRecord {
  id: string;
  billNo: string;
  tableNo: string;
  requestedDiscountPercent: number;
  actualDiscountAmount: number;
  savingsProtectedAmount: number; // The discount amount blocked from non-discount items
  eligibleItemsCount: number;
  exemptItemsCount: number;
  cashierName: string;
  timestamp: string;
}

// ==========================================
// Video 34: Godown-Wise Stock, Item-Wise Inventory, Asset/Linen Audit & Anti-Theft Tracking (Frames 0110-0260)
// ==========================================
export interface PmsGodownBreakdownEntry {
  godownName: string;
  stockIn: number;
  stockOut: number;
  closingStock: number;
}

export interface PmsConsolidatedStockRow {
  sNo: number;
  itemName: string;
  barcode?: string;
  category: string;
  unit: string;
  totalStockIn: number;
  totalStockOut: number;
  totalClosingStock: number;
  purchaseRate: number;
  totalValuation: number;
  reorderLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Negative / Deficient';
  godownBreakdown: PmsGodownBreakdownEntry[];
}

export interface PmsStockAuditMovement {
  id: string;
  date: string;
  type: 'PURCHASE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'KOT_SALE' | 'INTERNAL_ISSUE' | 'LAUNDRY_OUT' | 'LAUNDRY_IN' | 'REPAIR';
  referenceNo: string;
  godown: string;
  toGodown?: string;
  qtyIn: number;
  qtyOut: number;
  balance: number;
  remark: string;
}

export interface PmsHotelAssetLinenRecord {
  id: string;
  assetName: string;
  category: 'Linen' | 'Electronics' | 'Furniture' | 'Toiletries' | 'Kitchen Equipment';
  unit: string;
  totalPurchased: number;
  inRooms: number;
  inLinenStore: number;
  inLaundry: number;
  inDamagedRepair: number;
  missingDiscrepancy: number;
  unitCost: number;
  lastAuditDate: string;
}

// -------------------------------------------------------------
// Video 35: Banquet Hall Billing, Event & Party Hall Invoice Models
// -------------------------------------------------------------

export interface PmsBanquetVenue {
  id: string;
  name: string; // e.g. 'MARRIAGE GARDEN1', 'MARRIAGE GARDEN2', 'BIG HALL', 'MINI HALL', 'GARDEN'
  type: 'Marriage Garden' | 'Banquet Hall' | 'Party Lawn' | 'Conference Hall' | 'Poolside Lawn';
  baseTariff: number; // e.g. 50000
  gstPercent: number; // e.g. 12 or 18
  capacityPaxMin: number;
  capacityPaxMax: number;
  sqFtArea: number;
  floor: number | string;
  amenities: string[];
  images: string[];
  status: RoomStatus; // 'vacant' | 'booked' | 'occupied' | 'dirty'
  cleaningStatus: 'Ready' | 'Needs Sanitization / Cleaning' | 'Maintenance Underway';
  sacCode: string; // e.g. '996311' (Mandatory GST SAC code for room/hall hire)
}

export interface PmsBanquetAncillaryService {
  id: string;
  serviceName: string; // 'DJ CHARGE', 'DECORATION CHARGE', 'FLOWER SETUP', 'PROJECTOR LED WALL', 'GENERATOR POWER'
  rate: number;
  taxPercent: number;
  amount: number;
}

export interface PmsBanquetKot {
  kotNo: string; // e.g. 'KOT/419/24-25'
  dateTime: string;
  serviceType: 'Banquet' | 'Room';
  roomOrVenue: string;
  items: Array<{
    itemName: string;
    qty: number;
    rate: number;
    amount: number;
    gstPercent: number;
  }>;
  totalAmount: number;
}

export interface PmsBanquetBooking {
  id: string;
  bookingNo: string; // e.g. 'RM/89/24-25' or 'BQ/89/24-25'
  eventName: string; // e.g. 'Panday Parivar Wedding Reception'
  eventType: 'Wedding / Reception' | 'Sangeet / Mehendi' | 'Birthday Party' | 'Anniversary' | 'Corporate Seminar' | 'Kitty Party' | 'Exhibition';
  hostName: string; // e.g. 'PANDAY PARIVAR'
  contactPerson: string;
  contactMobile: string; // e.g. '76763636645'
  contactEmail?: string;
  addressLine1?: string;
  city?: string;
  state?: string; // e.g. 'M.P'
  pincode?: string;
  venueId: string;
  venueName: string; // e.g. 'MARRIAGE GARDEN1'
  venueTariff: number; // e.g. 50000
  venueGstPercent: number; // e.g. 12%
  linkedRoomNos: string[]; // e.g. ['301', '302'] (Suite/Deluxe rooms for bride/groom family)
  linkedRoomsTariff: number; // e.g. 0 (complimentary) or 2000
  bookingDate: string; // e.g. '20-07-2025'
  eventDate: string; // e.g. '30-07-2025'
  checkInDate: string; // e.g. '30-07-2025'
  checkInTime: string; // e.g. '06:26 AM'
  checkOutDate: string; // e.g. '31-07-2025'
  checkOutTime: string; // e.g. '06:26 AM'
  guaranteedPax: number; // e.g. 400
  actualPaxServed?: number; // e.g. 500
  seatingLayout: 'Round Table / Cluster' | 'Theatre Style' | 'Classroom' | 'U-Shape' | 'Open Lawn Reception';
  perPlateMenuName: string; // e.g. 'Royal Wedding Buffet'
  perPlateRate: number; // e.g. 475
  foodPaxCount: number; // e.g. 500
  totalFoodAmount: number; // e.g. 237500
  ancillaryServices: PmsBanquetAncillaryService[];
  kots: PmsBanquetKot[];
  financialSummary: {
    venueRent: number; // 50000
    venueGstAmount: number; // 6000
    foodAndServicesTaxable: number; // 262500 (Food 237500 + DJ 10000 + Decor 15000)
    foodAndServicesGstAmount: number; // 31500 (12%)
    foodAndServicesTotal: number; // 294000
    grossBillAmount: number; // 350000 (50000 rent + 6000 gst + 294000 food/services)
    advancePaid: number; // 15000
    midInstallmentsPaid: number; // 0
    netPayable: number; // 335000
    paidAtCheckout: number;
    balanceRemaining: number;
    sacCode: string; // '996311'
  };
  payments: Array<{
    id: string;
    date: string;
    type: 'Booking Advance' | 'Pre-Function Installment' | 'Checkout Settlement';
    mode: 'Cash' | 'Online' | 'STATE BANK OF INDIA' | 'UPI' | 'Card' | 'Bank Transfer';
    amount: number;
    referenceNo?: string;
    remark?: string;
  }>;
  billingMode: 'Consolidated (Settle To Room)' | 'Split Billing (Food Separate / Hall Separate)';
  status: 'Booked' | 'CheckedIn / In-Progress' | 'Settled & Checked Out' | 'Cancelled';
  invoiceNo?: string; // e.g. 'GSR/258/24-25'
  invoiceDate?: string;
  billingOfficer?: string; // e.g. 'DEMO0004'
  bankDetails?: {
    bankName: string;
    accountNo: string;
    ifsc: string;
    branch: string;
  };
  beoNotes?: {
    stageRequirements?: string;
    mandapNotes?: string;
    buffetTimings?: string;
    soundPermitNumber?: string;
    specialMenuRequests?: string;
  };
}

// ==========================================
// Video 08: Safe Deposit Locker & Other Charges Master Contracts
// ==========================================
export interface PmsLocker {
  id: string;
  lockerNo: string;
  lockerSize: 'Small' | 'Medium' | 'Large' | 'Executive Vault';
  dailyRate: number;
  status: 'Vacant' | 'Occupied' | 'Under Maintenance';
  assignedGuestName?: string;
  assignedRoomNo?: string;
  keyNumber: string;
  securityDeposit: number;
}

export interface PmsOtherCharge {
  id: string;
  chargeName: string;
  category: 'Room' | 'F&B' | 'Housekeeping' | 'Travel' | 'Banquet';
  defaultRate: number;
  gstRate: number;
  hsnCode: string;
  isTaxIncluded: boolean;
  remark?: string;
}

// ==========================================
// Hotel Expenses & Petty Cash Tracker
// ==========================================
export interface PmsExpenseRecord {
  id: string;
  expenseNo: string; // e.g. EXP-2026-001
  date: string;
  time: string;
  category: 'Vegetables & Dairy' | 'Housekeeping Supplies' | 'Electricity/DG Fuel' | 'Staff Advance' | 'Maintenance Repair';
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
  paidTo: string;
  description: string;
  billNumber?: string;
  approvedBy: string;
  createdAt: string;
}

// ==========================================
// Housekeeping, Laundry & Maintenance Tracker
// ==========================================
export interface PmsHousekeepingRecord {
  roomNo: string;
  status: 'Vacant Clean' | 'Cleaning In Progress' | 'Vacant Dirty' | 'Inspected' | 'Under Maintenance';
  assignedStaff: 'Ramesh' | 'Sunita' | 'Ganesh' | 'Priya';
  priority: 'High - Guest Waiting' | 'Normal' | 'VIP Suite';
  lastCleanedTime: string;
  cleaningStartedAt?: string;
  maintenanceIssue?: string;
  maintenanceLoggedAt?: string;
  remarks?: string;
}

// ==========================================
// Night Audit & Shift Handover
// ==========================================
export interface PmsNightAuditRecord {
  auditId: string;
  auditDate: string;
  executedAt: string;
  executedBy: string;
  occupiedRoomsCount: number;
  totalRoomTariffPosted: number;
  totalGstPosted: number;
  cashInHand: number;
  upiTotal: number;
  cardTotal: number;
  pendingReceivables: number;
  roomsAuditSummary: Array<{
    roomNo: string;
    guestName: string;
    baseTariff: number;
    gstAmount: number;
    totalPosted: number;
    folioBalanceAfter: number;
  }>;
  id?: string;
  totalRooms?: number;
  occupiedRooms?: number;
  vacantRooms?: number;
  dirtyRooms?: number;
  maintenanceRooms?: number;
  occupancyPercentage?: number;
  totalRoomRevenue?: number;
  totalFoodRevenue?: number;
  totalBanquetRevenue?: number;
  totalGrossRevenue?: number;
  auditedAt?: string;
  auditedBy?: string;
}

// ==========================================
// Guest Folio & Segregated Indian GST Models
// ==========================================
export interface PmsFolioPayment {
  id: string;
  roomNo: string;
  guestName: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
  referenceNo?: string;
  timestamp: string;
  notes?: string;
}

export interface PmsFolioDiscount {
  type: 'flat' | 'percent';
  value: number;
  reason: string;
  amount: number;
}

export interface PmsFolioSummary {
  roomNo: string;
  roomType: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  idProofType?: string;
  idProofNumber?: string;
  vehicleNo?: string;
  companyName?: string;
  gstin?: string;
  darshanSlot?: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  nights: number;
  perNightTariff: number;
  baseRoomRent: number;
  extraGuestsCount: number;
  extraGuestsRatePerNight: number;
  extraGuestsTotal: number;
  roomTaxable: number;
  roomGstRate: number; // 12% or 18% (SAC 996311)
  roomCgst: number;
  roomSgst: number;
  roomTaxTotal: number;
  roomGross: number;

  foodItems: Array<{
    kotNo: string;
    date: string;
    amount: number;
    description: string;
  }>;
  foodTaxable: number;
  foodGstRate: number; // strictly 5% (SAC 996331: 2.5% CGST + 2.5% SGST)
  foodCgst: number;
  foodSgst: number;
  foodTaxTotal: number;
  foodGross: number;

  addOthers: number;
  addOthersGst: number;

  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalTax: number;
  grandTotal: number;

  discount?: PmsFolioDiscount;
  advancePaid: number;
  payments: PmsFolioPayment[];
  totalPaid: number;
  balanceDue: number;
  tariff?: number;
  standardCapacity?: number;
  adults?: number;
  isFullySettled?: boolean;
}

// ==========================================
// Module 1: Staff Profiles, Monthly Payroll & Advance Salary Tracking
// ==========================================
export type StaffGender = 'Male' | 'Female' | 'Other';

export type StaffDepartment =
  | 'Front Office'
  | 'Housekeeping'
  | 'Vasudev Rasoi F&B'
  | 'Kitchen'
  | 'Maintenance & Engineering'
  | 'Security'
  | 'Accounts & Administration';

export interface StaffProfile {
  id: number;
  staff_code: string;
  full_name: string;
  gender: StaffGender;
  role: string;
  department: StaffDepartment | string;
  phone: string;
  monthly_base_salary: number;
  emergency_contact?: string;
  date_of_joining?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_ifsc?: string;
  aadhaar_number?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StaffSalaryAdvance {
  id: number;
  advance_voucher_no: string;
  staff_id: number;
  staff_code?: string;
  staff_name?: string;
  department?: string;
  role?: string;
  advance_date: string;
  month_period: string; // e.g. "2026-11"
  amount: number;
  payment_mode: 'Cash' | 'UPI' | 'Bank Transfer' | string;
  remarks?: string;
  is_deducted?: boolean;
  created_at?: string;
}

export interface StaffMonthlyPayroll {
  payroll_id?: number | null;
  payroll_period: string; // "YYYY-MM"
  staff_id: number;
  staff_code: string;
  staff_name: string;
  gender: StaffGender;
  department: string;
  role: string;
  phone: string;
  monthly_base_salary: number;
  total_advance_deducted: number;
  bonus_or_allowance?: number;
  other_deductions?: number;
  net_payable_salary: number;
  payout_status: 'Pending' | 'Paid';
  payment_date?: string | null;
  payment_mode?: string | null;
  payment_reference?: string | null;
  remarks?: string;
}

export interface MonthlyPayrollSummary {
  total_staff_count: number;
  total_base_salaries: number;
  total_advances_deducted: number;
  total_net_payable: number;
  total_paid_count: number;
  total_pending_count: number;
}

// =========================================================================
// Module 2: End-of-Day (EOD) Expenditures & Detailed Revenue Analytics
// =========================================================================

export interface EodExpenseRecord {
  id: number | string;
  voucher_no: string;
  expense_date: string; // YYYY-MM-DD
  expense_time?: string; // HH:MM
  category: string;
  subcategory: string;
  amount: number;
  payment_mode: 'Cash' | 'UPI' | 'Debit Card' | 'Credit Card' | 'Bank Transfer - SBI' | 'Bank Transfer - HDFC' | string;
  account_name: string;
  paid_to: string;
  receipt_ref?: string;
  approved_by: string;
  notes?: string;
  created_at?: string;
}

export interface EodExpenseListResponse {
  expenses: EodExpenseRecord[];
  total_amount: number;
  total_count: number;
  by_subcategory: Record<string, number>;
  by_category: Record<string, number>;
  by_payment_mode: Record<string, number>;
}

export interface RoomCategoryRevenueItem {
  room_category: 'Suite' | 'Deluxe' | 'Classic Studio' | 'Premium' | 'Executive' | string;
  inventory_rooms: number;
  rooms_sold: number;
  total_room_rent: number;
  food_revenue: number;
  gst_collected: number;
  net_revenue: number;
  standard_tariff: number;
  adr: number;
  occupancy_pct: number;
  revenue_share_pct: number;
}

export interface RoomCategoryRevenueReport {
  period: string; // YYYY-MM
  date?: string | null; // YYYY-MM-DD
  categories: RoomCategoryRevenueItem[];
  summary: {
    total_rooms_sold: number;
    total_room_rent: number;
    total_net_revenue: number;
    total_inventory: number;
    overall_occupancy_pct: number;
  };
}

export interface PaymentModeRevenueItem {
  payment_mode: string;
  account_name: string;
  transaction_count: number;
  room_collections: number;
  food_collections: number;
  other_collections: number;
  total_collected: number;
  share_pct: number;
}

export interface PaymentModeRevenueReport {
  period: string;
  date?: string | null;
  modes: PaymentModeRevenueItem[];
  grand_total: number;
}

export interface EodExecutiveSummary {
  business_date: string;
  revenue: {
    room_revenue: number;
    food_revenue: number;
    gst_collected: number;
    net_total_billed: number;
  };
  expenditures: {
    total_expenses: number;
    cash_expenses: number;
    digital_expenses: number;
    by_subcategory: Record<string, number>;
    count: number;
  };
  cash_drawer_reconciliation: {
    opening_float: number;
    cash_inflow: number;
    cash_outflow: number;
    closing_cash_in_drawer: number;
  };
  digital_reconciliation: {
    digital_inflow: number;
    digital_outflow: number;
    net_digital_balance: number;
  };
}



