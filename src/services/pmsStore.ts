import type { PmsRoom, PmsBooking, PmsKotRecord, PmsCheckOutDetail, MenuItem } from '../types/pmsModels';

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

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  { id: 'm-1', name: 'Paneer Rice', code: '11', rate: 140, category: 'Rice' },
  { id: 'm-2', name: 'PANEER TIKA', code: '10005', rate: 220, category: 'Starters' },
  { id: 'm-3', name: 'sahi paneer', code: '10028', rate: 240, category: 'Main Course' },
  { id: 'm-4', name: 'paneer bhurji', code: '10040', rate: 200, category: 'Main Course' },
  { id: 'm-5', name: 'Dal Tadka', code: '10012', rate: 160, category: 'Dal' },
  { id: 'm-6', name: 'Butter Roti', code: '10001', rate: 25, category: 'Breads' },
  { id: 'm-7', name: 'Mineral Water 1L', code: '10002', rate: 20, category: 'Beverages' },
  { id: 'm-8', name: 'Masala Tea', code: '10003', rate: 30, category: 'Beverages' },
  { id: 'm-9', name: 'Veg Thali Deluxe', code: '10050', rate: 180, category: 'Thali' },
  { id: 'm-10', name: 'Jeera Rice', code: '10015', rate: 110, category: 'Rice' }
];

const STORAGE_KEYS = {
  ROOMS: 'svr_pms_rooms',
  BOOKINGS: 'svr_pms_bookings',
  KOTS: 'svr_pms_kots',
  CHECKOUTS: 'svr_pms_checkouts'
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
    return raw ? JSON.parse(raw) : [];
  }

  static saveKot(kot: PmsKotRecord): void {
    const kots = this.getKots();
    kots.unshift(kot);
    localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify(kots));

    // Also update room's food amount
    const rooms = this.getRooms();
    const updated = rooms.map(r => {
      if (r.roomNo === kot.roomNo) {
        return {
          ...r,
          foodAmount: (r.foodAmount || 0) + kot.totalAmount
        };
      }
      return r;
    });
    this.saveRooms(updated);
  }

  static getCheckouts(): PmsCheckOutDetail[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKOUTS);
    return raw ? JSON.parse(raw) : [];
  }

  static saveCheckout(checkout: PmsCheckOutDetail): void {
    const list = this.getCheckouts();
    list.unshift(checkout);
    localStorage.setItem(STORAGE_KEYS.CHECKOUTS, JSON.stringify(list));

    // Mark room as dirty upon checkout
    this.updateRoomStatus(checkout.roomNo, 'dirty', undefined);
  }
}
