import type { PmsRoom, PmsBooking, PmsKotRecord, PmsCheckOutDetail, MenuItem, PmsAdvanceReceipt, LedgerEntry } from '../types/pmsModels';

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
