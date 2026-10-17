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
  PmsVoucherType
} from '../types/pmsModels';

export const INITIAL_ROOMS: PmsRoom[] = [
  // Ground / Halls
  { id: 'g-2bhk', roomNo: 'ground 2 bhk', roomType: 'SUITE ROOM', tariff: 4500, status: 'vacant', floor: 0, facilities: 'AC, Hall, Kitchen, 2 Bedrooms' },
  { id: 'mini-hall', roomNo: 'MINI HALL', roomType: 'HALL', tariff: 6000, status: 'vacant', floor: 0, facilities: 'Seating 50 pax, Stage, Mic' },
  { id: 'garden', roomNo: 'GARDEN', roomType: 'HALL', tariff: 10000, status: 'booked', floor: 0, facilities: 'Lawn Area, Lights, Buffet Setup' },
  { id: 'big-hall', roomNo: 'BIG HALL', roomType: 'HALL', tariff: 15000, status: 'booked', floor: 0, facilities: 'Seating 200 pax, Central AC' },

  // 1st Floor
  { id: '101', roomNo: '101', roomType: 'DELUXE', tariff: 2000, status: 'dirty', floor: 1, facilities: 'AC, Geyser, TV, Double Bed' },
  { id: '102', roomNo: '102', roomType: 'SUITE ROOM', tariff: 3000, status: 'vacant', floor: 1, facilities: 'Living Area, Sofa, King Bed, Bathtub' },
  { 
    id: '103', 
    roomNo: '103', 
    roomType: 'DELUXE', 
    tariff: 2000, 
    status: 'occupied', 
    floor: 1, 
    facilities: 'AC, Smart TV, Wi-Fi, Balcony',
    currentGuest: {
      name: 'AJUU',
      phone: '9622975444',
      checkInDate: '05-06-2025',
      checkInTime: '11:34 PM',
      bookingNo: 'RM/60/24-25',
      advancePaid: 500,
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
  { id: 't-1', tableName: 'T-1', tableGroup: 'General', capacity: 4, status: 'Vacant' },
  { id: 't-2', tableName: 'T-2', tableGroup: 'General', capacity: 4, status: 'Vacant' },
  { id: 't-3', tableName: 'T-3', tableGroup: 'General', capacity: 4, status: 'Vacant' },
  { id: 't-4', tableName: 'T-4', tableGroup: 'General', capacity: 4, status: 'Vacant' },
  { id: 't-5', tableName: 'T-5', tableGroup: 'General', capacity: 6, status: 'Vacant' },
  { id: 't-6', tableName: 'T-6', tableGroup: 'General', capacity: 6, status: 'Vacant' },
  { id: 't-7', tableName: 'T-7', tableGroup: 'General', capacity: 2, status: 'Vacant' },
  { id: 't-8', tableName: 'T-8', tableGroup: 'General', capacity: 2, status: 'Vacant' },
  { id: 't-9', tableName: 'T-9', tableGroup: 'General', capacity: 8, status: 'Vacant' },
  { id: 't-nc1', tableName: 'NC1', tableGroup: 'NC', capacity: 4, status: 'Vacant' },
  { id: 't-nc2', tableName: 'NC2', tableGroup: 'NC', capacity: 4, status: 'Vacant' },
  { id: 't-g1', tableName: 'G-1', tableGroup: 'Garden', capacity: 6, status: 'Vacant' },
  { id: 't-g2', tableName: 'G-2', tableGroup: 'Garden', capacity: 6, status: 'Vacant' },
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
  ADVANCE_RECEIPTS: 'svr_pms_advance_receipts'
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
    return raw ? JSON.parse(raw) : [];
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
    // Seed default KOT matching Video 05 Frame 0150
    const initialKots: PmsKotRecord[] = [
      {
        kotNo: 'KOT/351/24-25',
        serviceType: 'Room',
        roomNo: '103',
        guestName: 'ALOK JAIN',
        kotRemark: 'Quick Room Delivery',
        items: [
          { sNo: 1, itemName: 'WATER BOTLE', itemCode: '10003', qty: 1, rate: 28.57, amount: 28.57 }
        ],
        totalAmount: 28.57,
        createdAt: '2025-06-07T06:36:00.000Z',
        status: 'Pending'
      },
      {
        kotNo: 'KOT/349/24-25',
        serviceType: 'Room',
        roomNo: '105',
        guestName: 'sunil agrwal',
        items: [
          { sNo: 1, itemName: 'TEA', itemCode: '10003', qty: 2, rate: 19.05, amount: 38.10 }
        ],
        totalAmount: 38.10,
        createdAt: '2025-06-07T06:10:00.000Z',
        status: 'Billed'
      },
      {
        kotNo: 'KOT/350/24-25',
        serviceType: 'Room',
        roomNo: '105',
        guestName: 'sunil agrwal',
        items: [
          { sNo: 1, itemName: 'Rasgulla', itemCode: '10002', qty: 1, rate: 190.48, amount: 190.48 },
          { sNo: 2, itemName: 'Ras Malai', itemCode: '10015', qty: 1, rate: 85.71, amount: 85.71 },
          { sNo: 3, itemName: 'WATER BOTLE', itemCode: '10003', qty: 1, rate: 28.57, amount: 28.57 }
        ],
        totalAmount: 304.76,
        createdAt: '2025-06-07T06:12:00.000Z',
        status: 'Billed'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify(initialKots));
    return initialKots;
  }

  static getPendingKotsByRoom(roomNo: string): PmsKotRecord[] {
    return this.getKots().filter(k => k.roomNo === roomNo && k.status === 'Pending');
  }

  static markKotsAsBilled(kotNumbers: string[]): void {
    const kots = this.getKots();
    const updated = kots.map(k => {
      // Handle matching by full kotNo 'KOT/351/24-25' or number '351'
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
}
