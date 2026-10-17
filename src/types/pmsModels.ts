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
  billNo: string;             // e.g. SHRI/253/24-25
  date: string;
  time: string;
  roomNo: string;
  guestName: string;
  kotNumbers: string[];       // e.g. ['351']
  items: (KotItem | FoodBillItem)[];
  taxableAmount: number;
  gstPercent: number;         // 5.0000%
  cgstAmount: number;         // 2.5%
  sgstAmount: number;         // 2.5%
  discountPercent: number;    // e.g. 5.0%
  discountAmount: number;
  roundOff: number;           // e.g. -0.00
  netBillAmount: number;      // e.g. 30.00
  amountInWords?: string;
  settlementType: 'Settle To Room' | 'Cash' | 'UPI' | 'Card';
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
  type: 'Advance_Receipt' | 'Check_Out' | 'Room_Checkout' | 'Payment';
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



