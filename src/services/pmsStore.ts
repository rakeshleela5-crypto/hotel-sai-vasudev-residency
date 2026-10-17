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
  PmsTableShiftRecord
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
  ROOM_SHIFTS: 'svr_pms_room_shifts'
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
    // Seed default KOT matching Video 05 & Video 12 Frames 0225, 0300
    const now = Date.now();
    const initialKots: PmsKotRecord[] = [
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
        createdAt: new Date(now - 2 * 60 * 1000).toISOString(), // 2 mins ago
        status: 'Pending',
        serveStatus: 'Pending'
      },
      {
        kotNo: '369',
        serviceType: 'Restaurant',
        roomNo: '85',
        tableNo: 'T-14',
        waiterName: 'DEMO0004',
        guestName: 'WALK-IN DINE',
        kotRemark: 'Crispy Bread',
        items: [
          { sNo: 1, itemName: 'bread pakoda', itemCode: '10009', qty: 2, rate: 50.00, amount: 100.00 },
          { sNo: 2, itemName: 'Boondi Raita', itemCode: '10008', qty: 2, rate: 10.00, amount: 20.00 }
        ],
        totalQty: 4,
        totalAmount: 120.00,
        createdAt: new Date(now - 28 * 60 * 1000).toISOString(), // 28 mins ago
        status: 'Pending',
        serveStatus: 'Pending'
      },
      {
        kotNo: '368',
        serviceType: 'Room',
        roomNo: '203',
        tableNo: 'Room 203',
        waiterName: 'DEMO0004',
        guestName: 'AJUU',
        kotRemark: 'Hot Delivery',
        items: [
          { sNo: 1, itemName: 'TAWA ROTI', itemCode: '10010', qty: 3, rate: 20.00, amount: 60.00 },
          { sNo: 2, itemName: 'PANEER TIKA', itemCode: '10007', qty: 2, rate: 100.00, amount: 200.00 }
        ],
        totalQty: 5,
        totalAmount: 260.00,
        createdAt: new Date(now - 30 * 60 * 1000).toISOString(), // 30 mins ago
        status: 'Pending',
        serveStatus: 'Pending'
      },
      {
        kotNo: '367',
        serviceType: 'Room',
        roomNo: '203',
        tableNo: 'Room 203',
        waiterName: 'DEMO0004',
        guestName: 'AJUU',
        items: [
          { sNo: 1, itemName: 'WATER BOTLE', itemCode: '10003', qty: 2, rate: 28.57, amount: 57.14 }
        ],
        totalQty: 2,
        totalAmount: 57.14,
        createdAt: new Date(now - 37 * 60 * 1000).toISOString(), // 37 mins ago
        status: 'Pending',
        serveStatus: 'Pending'
      },
      {
        kotNo: '366',
        serviceType: 'Room',
        roomNo: '203',
        tableNo: 'Room 203',
        waiterName: 'DEMO0004',
        guestName: 'AJUU',
        items: [
          { sNo: 1, itemName: 'WATER BOTLE', itemCode: '10003', qty: 2, rate: 28.57, amount: 57.14 }
        ],
        totalQty: 2,
        totalAmount: 57.14,
        createdAt: new Date(now - 49 * 60 * 1000).toISOString(), // 49 mins ago
        status: 'Pending',
        serveStatus: 'Pending'
      },
      {
        kotNo: '365',
        serviceType: 'Room',
        roomNo: '203',
        tableNo: 'Room 203',
        waiterName: 'DEMO0004',
        guestName: 'AJUU',
        items: [
          { sNo: 1, itemName: 'WATER BOTLE', itemCode: '10003', qty: 2, rate: 28.57, amount: 57.14 }
        ],
        totalQty: 2,
        totalAmount: 57.14,
        createdAt: new Date(now - 51 * 60 * 1000).toISOString(), // 51 mins ago
        status: 'Pending',
        serveStatus: 'Pending'
      },
      {
        kotNo: 'R/362',
        serviceType: 'Restaurant',
        roomNo: 'T-8',
        tableNo: 'T-8',
        waiterName: 'DEMO0004',
        guestName: 'VASUH MHANGGLAM',
        items: [
          { sNo: 1, itemName: 'PANEER TIKA', itemCode: '10007', qty: 1, rate: 76.20, amount: 80.00 },
          { sNo: 2, itemName: 'WATER BOTLE', itemCode: '10003', qty: 5, rate: 28.60, amount: 150.00 },
          { sNo: 3, itemName: 'coldrink 750 ml', itemCode: '10011', qty: 3, rate: 25.40, amount: 90.00 }
        ],
        totalQty: 9,
        totalAmount: 320.00,
        createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
        status: 'Ready To Serve',
        serveStatus: 'Ready To Serve'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify(initialKots));
    return initialKots;
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
    kots.unshift(kot);
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

  static getPartyLedger(
    accountName: string,
    _fromDate: string = '07-06-2025',
    _toDate: string = '07-06-2025'
  ): {
    entries: LedgerEntry[];
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    closingType: 'Dr' | 'Cr';
  } {
    const cleanQuery = accountName.toLowerCase().trim();
    const entries: LedgerEntry[] = [];
    let runningBalance = 0; // positive for Credit, negative for Debit

    // 1. Opening Balance row (Always 0.00 as shown in Frame 0182 & 0230)
    entries.push({
      date: '',
      type: 'Advance_Receipt',
      accountName: 'Opening Balnce',
      remark: '',
      debit: 0,
      credit: 0,
      balance: 0,
      balanceType: 'Cr'
    });

    // 2. Fetch all Advance Receipts matching this guest / account
    const receipts = this.getAdvanceReceipts().filter(r => 
      !cleanQuery || 
      r.guestName.toLowerCase().includes(cleanQuery) || 
      (r.roomNo && r.roomNo.toLowerCase().includes(cleanQuery)) ||
      (r.mobile && r.mobile.includes(cleanQuery))
    );

    for (const r of receipts) {
      runningBalance += r.amount;
      entries.push({
        date: r.date,
        type: 'Advance_Receipt',
        accountName: r.paymentMode,
        remark: r.remark || 'advance',
        debit: 0,
        credit: r.amount,
        balance: Math.abs(runningBalance),
        balanceType: runningBalance >= 0 ? 'Cr' : 'Dr'
      });
    }

    // 3. Fetch all Checkouts matching this guest / account
    const checkouts = this.getCheckouts().filter(c =>
      !cleanQuery ||
      c.guestName.toLowerCase().includes(cleanQuery) ||
      c.roomNo.toLowerCase().includes(cleanQuery) ||
      (c.guestPhone && c.guestPhone.includes(cleanQuery))
    );

    for (const c of checkouts) {
      // 3a. Check_Out settlement payment (Credit)
      const settlementPaid = c.netPayable || (c.billAmount - (c.advanceDeducted || 0));
      if (settlementPaid > 0) {
        runningBalance += settlementPaid;
        entries.push({
          date: c.checkOutDate,
          type: 'Check_Out',
          accountName: c.paymentMode || 'Online',
          remark: `Check_out/${c.invoiceNo}/Room-${c.roomNo}`,
          debit: 0,
          credit: settlementPaid,
          balance: Math.abs(runningBalance),
          balanceType: runningBalance >= 0 ? 'Cr' : 'Dr'
        });
      }

      // 3b. Room_Checkout invoice bill charged (Debit)
      runningBalance -= c.billAmount;
      entries.push({
        date: c.checkOutDate,
        type: 'Room_Checkout',
        accountName: 'Room_Checkout',
        remark: `Room_Checkout/${c.invoiceNo}`,
        debit: c.billAmount,
        credit: 0,
        balance: Math.abs(runningBalance),
        balanceType: runningBalance >= 0 ? 'Dr' : 'Dr'
      });
    }

    const totalDebit = entries.reduce((s, e) => s + (e.debit || 0), 0);
    const totalCredit = entries.reduce((s, e) => s + (e.credit || 0), 0);
    const closingBalance = Math.abs(totalCredit - totalDebit);
    const closingType: 'Dr' | 'Cr' = totalCredit >= totalDebit ? 'Cr' : 'Dr';

    return {
      entries,
      totalDebit,
      totalCredit,
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
}

