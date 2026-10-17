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
  kotNo: string;              // e.g. KOT/343/24-25
  serviceType: 'Room' | 'Restaurant' | 'Banquet';
  roomNo: string;
  guestName: string;
  kotRemark?: string;
  items: KotItem[];
  totalAmount: number;
  createdAt: string;
  status: 'Pending' | 'Served' | 'Billed';
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

export interface PmsDiningTable {
  id: string;
  tableName: string;
  tableGroup: string;
  capacity?: number;
  status?: 'Vacant' | 'Running' | 'Billed';
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

