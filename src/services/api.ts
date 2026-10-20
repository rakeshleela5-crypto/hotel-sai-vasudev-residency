import type { 
  Room, 
  BookingPayload, 
  BookingResponse, 
  InquiryPayload, 
  InquiryResponse,
  AvailabilityCheckResponse,
  TaxInvoice 
} from '../types';
import { PmsStore } from './pmsStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Authentic 16-Room Categories for Hotel Sai Vasudev Residency (Shirdi)
const FALLBACK_ROOMS: Room[] = [
  {
    id: 1,
    name: "Executive Deluxe Room",
    slug: "executive-deluxe-room",
    room_type: "Deluxe",
    price_per_night: 2499,
    capacity: 2,
    total_inventory: 6,
    bed_type: "King Bed",
    room_size: "340 sq ft",
    description: "Sophisticated modern room on Floor 1 (Rooms 101-106). Features soundproof windows, premium posture-pedic King bed, ambient warm cove lighting, 43\" 4K Smart TV, and Italian marble bathroom. Max 2+1 Guests.",
    amenities: "High-Speed Wi-Fi, 43\" 4K Smart TV, Central AC, 24/7 Room Service, Complimentary Tea/Coffee Maker, Luxurious Toiletries, Daily Housekeeping",
    image_url: "/images/deluxe_room.jpg",
    badge: "Best Value",
    is_available: true
  },
  {
    id: 2,
    name: "Super Deluxe Family Room",
    slug: "super-deluxe-family-room",
    room_type: "Super Deluxe",
    price_per_night: 3799,
    capacity: 4,
    total_inventory: 6,
    bed_type: "Two Queen Beds",
    room_size: "480 sq ft",
    description: "Spacious pilgrim haven on Floor 2 (Rooms 201-206). Two queen beds, cozy sofa seating, double wardrobe, mini refrigerator, and temple-facing balconies. Max 4+1 Guests.",
    amenities: "High-Speed Wi-Fi, 50\" 4K Smart TV, Central AC, Mini Fridge, 24/7 Room Service, Temple Darshan Assistance, Dedicated Work Desk",
    image_url: "/images/hero.jpg",
    badge: "Family Favorite",
    is_available: true
  },
  {
    id: 3,
    name: "Sai Presidential Suite",
    slug: "sai-presidential-suite",
    room_type: "Suite",
    price_per_night: 5999,
    capacity: 4,
    total_inventory: 4,
    bed_type: "Master King + Living Lounge",
    room_size: "720 sq ft",
    description: "The pinnacle of divine hospitality on Floor 3 (Rooms 301-304). Private master bedroom, separate luxurious living lounge, marble coffee table, soaking bathtub, and 24/7 VIP concierge service. Max 4+2 Guests.",
    amenities: "High-Speed Wi-Fi, 55\" OLED Smart TV, Luxury Bathrobe & Slippers, Soaking Bathtub, Express Check-In, Complimentary Buffet Breakfast, 24/7 Butler on Call",
    image_url: "/images/suite_room.jpg",
    badge: "Luxury Suite",
    is_available: true
  }
];

export const hotelApi = {
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  async checkHealth(): Promise<{ status: string; database: string; engine: string }> {
    try {
      const rootUrl = API_BASE_URL.replace('/api/v1', '');
      const res = await fetch(`${rootUrl}/health`, { method: 'GET' });
      if (res.ok) {
        return await res.json();
      }
      return { status: 'offline', database: 'unavailable', engine: 'Railway Postgres / SQLite' };
    } catch {
      return { status: 'offline', database: 'unavailable', engine: 'Railway Postgres / SQLite' };
    }
  },

  async getRooms(roomType?: string, maxPrice?: number): Promise<Room[]> {
    try {
      const localRooms = typeof window !== 'undefined' ? PmsStore.getRooms() : [];
      const deluxeAvailable = localRooms.filter(r => r.roomType === 'Executive Deluxe' && r.status === 'vacant').length;
      const familyAvailable = localRooms.filter(r => r.roomType === 'Super Deluxe Family' && r.status === 'vacant').length;
      const suiteAvailable = localRooms.filter(r => r.roomType === 'Sai Presidential Suite' && r.status === 'vacant').length;

      const liveRooms: Room[] = FALLBACK_ROOMS.map(r => {
        let availCount = 0;
        if (r.id === 1) availCount = deluxeAvailable;
        else if (r.id === 2) availCount = familyAvailable;
        else if (r.id === 3) availCount = suiteAvailable;

        return {
          ...r,
          is_available: availCount > 0,
          badge: availCount > 0 ? `${availCount} Available Now` : 'Sold Out'
        };
      });

      let results = liveRooms;
      if (roomType && roomType !== 'All') {
        results = results.filter(r => r.room_type.toLowerCase().includes(roomType.toLowerCase()));
      }
      if (maxPrice !== undefined && maxPrice > 0) {
        results = results.filter(r => r.price_per_night <= maxPrice);
      }
      return results;
    } catch (err) {
      console.warn('Using fallback room inventory:', err);
      let results = FALLBACK_ROOMS;
      if (roomType && roomType !== 'All') {
        results = results.filter(r => r.room_type.toLowerCase().includes(roomType.toLowerCase()));
      }
      if (maxPrice !== undefined && maxPrice > 0) {
        results = results.filter(r => r.price_per_night <= maxPrice);
      }
      return results;
    }
  },

  async checkRoomAvailability(
    roomId: number, 
    checkIn: string, 
    checkOut: string, 
    adults: number = 2
  ): Promise<AvailabilityCheckResponse> {
    const room = FALLBACK_ROOMS.find(r => r.id === roomId) || FALLBACK_ROOMS[0];
    const localRooms = typeof window !== 'undefined' ? PmsStore.getRooms() : [];
    
    let matchedCategoryRooms = localRooms.filter(r => {
      if (roomId === 1) return r.roomType === 'Executive Deluxe';
      if (roomId === 2) return r.roomType === 'Super Deluxe Family';
      return r.roomType === 'Sai Presidential Suite';
    });
    if (matchedCategoryRooms.length === 0) matchedCategoryRooms = localRooms;

    const vacantRooms = matchedCategoryRooms.filter(r => r.status === 'vacant');
    const remainingRoomsCount = vacantRooms.length;

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const baseSubtotal = room.price_per_night * nights;
    
    // Extra guest charge (₹500 for Deluxe/Family, ₹800 for Suite)
    const extraRatePerGuest = roomId === 3 ? 800 : 500;
    const extraGuests = Math.max(0, adults - room.capacity);
    const extraCharge = extraGuests * extraRatePerGuest * nights;
    
    // SAC 996311 GST Engine: 12% if <= ₹7,500/night else 18%
    const taxable = baseSubtotal + extraCharge;
    const gstRate = taxable / nights <= 7500 ? 12 : 18;
    const halfRate = gstRate / 200;
    const cgst = Math.round(taxable * halfRate * 100) / 100;
    const sgst = Math.round(taxable * halfRate * 100) / 100;
    const totalTax = cgst + sgst;
    const grandTotal = taxable + totalTax;

    return {
      available: remainingRoomsCount > 0,
      room_id: room.id,
      room_name: room.name,
      check_in_date: checkIn,
      check_out_date: checkOut,
      nights,
      capacity: room.capacity,
      adults,
      base_rate_per_night: room.price_per_night,
      base_subtotal: baseSubtotal,
      extra_guest_charge: extraCharge,
      taxable_amount: taxable,
      gst_rate: gstRate,
      cgst_amount: cgst,
      sgst_amount: sgst,
      total_tax: totalTax,
      grand_total: grandTotal,
      remaining_rooms_count: remainingRoomsCount,
      message: remainingRoomsCount > 0 ? `${remainingRoomsCount} room(s) available for reservation.` : 'Selected category is sold out for these dates.'
    };
  },

  async createBooking(payload: BookingPayload): Promise<BookingResponse> {
    try {
      const matchedRoom = FALLBACK_ROOMS.find(r => r.id === payload.room_id) || FALLBACK_ROOMS[0];
      const start = new Date(payload.check_in_date);
      const end = new Date(payload.check_out_date);
      const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const baseSubtotal = matchedRoom.price_per_night * nights;
      const extraRatePerGuest = matchedRoom.id === 3 ? 800 : 500;
      const extraGuests = Math.max(0, payload.adults - matchedRoom.capacity);
      const extraCharge = extraGuests * extraRatePerGuest * nights;
      const taxable = baseSubtotal + extraCharge;
      const gstRate = taxable / nights <= 7500 ? 12 : 18;
      const cgst = Math.round(taxable * (gstRate / 200) * 100) / 100;
      const sgst = cgst;

      // 1. Cross-Module Reactivity Law: Immediately create booking in PmsStore
      const { booking, room } = PmsStore.createGuestBooking({
        roomId: payload.room_id,
        roomType: matchedRoom.name,
        guestName: payload.guest_name,
        guestPhone: payload.guest_phone,
        guestEmail: payload.guest_email,
        idProofType: payload.id_proof_type,
        checkInDate: payload.check_in_date,
        checkOutDate: payload.check_out_date,
        adults: payload.adults,
        children: payload.children,
        advancePaid: payload.payment_method === 'Pay at Hotel' ? 0 : Math.round((taxable + cgst + sgst) * 0.25),
        specialRequests: payload.special_requests,
        paymentMethod: payload.payment_method
      });

      return {
        id: Math.floor(Math.random() * 1000) + 1,
        booking_ref: booking.bookingNo,
        invoice_number: `INV-${booking.bookingNo}`,
        room_id: payload.room_id,
        guest_name: payload.guest_name,
        guest_email: payload.guest_email,
        guest_phone: payload.guest_phone,
        id_proof_type: payload.id_proof_type || 'Aadhaar Card',
        check_in_date: payload.check_in_date,
        check_out_date: payload.check_out_date,
        adults: payload.adults,
        children: payload.children,
        total_nights: nights,
        base_rate: matchedRoom.price_per_night,
        base_amount: baseSubtotal,
        extra_guest_charge: extraCharge,
        gst_rate: gstRate,
        cgst_amount: cgst,
        sgst_amount: sgst,
        total_tax: cgst + sgst,
        total_price: taxable + cgst + sgst,
        payment_status: payload.payment_method === 'Pay at Hotel' ? 'Pending' : 'Paid',
        payment_method: payload.payment_method || 'Pay at Hotel',
        status: 'Confirmed',
        special_requests: payload.special_requests,
        created_at: new Date().toISOString(),
        room: { ...matchedRoom, name: `${matchedRoom.name} (Room ${room.roomNo})` }
      };
    } catch (err: unknown) {
      console.error('[hotelApi.createBooking] Error:', err);
      throw err;
    }
  },

  async getBookingByRef(bookingRef: string): Promise<BookingResponse> {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingRef.trim().toUpperCase()}`);
    if (!res.ok) throw new Error(`Booking ${bookingRef} not found`);
    return await res.json();
  },

  async getBookingInvoice(bookingRef: string): Promise<TaxInvoice> {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingRef.trim().toUpperCase()}/invoice`);
    if (!res.ok) throw new Error(`Tax invoice for ${bookingRef} not found`);
    return await res.json();
  },

  getPrintSlipUrl(bookingRef: string): string {
    return `${API_BASE_URL}/bookings/${bookingRef.trim().toUpperCase()}/print-slip`;
  },

  async updateBookingStatus(
    bookingRef: string,
    status: string,
    paymentStatus?: string,
    cancellationReason?: string
  ): Promise<BookingResponse> {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingRef.trim().toUpperCase()}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        payment_status: paymentStatus,
        cancellation_reason: cancellationReason
      })
    });
    if (!res.ok) throw new Error(`Failed to update booking status: HTTP ${res.status}`);
    return await res.json();
  },

  async listBookings(status?: string): Promise<BookingResponse[]> {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.append('status', status);
    const res = await fetch(`${API_BASE_URL}/bookings?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch bookings`);
    return await res.json();
  },

  async submitInquiry(payload: InquiryPayload): Promise<InquiryResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {
        id: Date.now(),
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        subject: payload.subject,
        message: payload.message,
        created_at: new Date().toISOString()
      };
    }
  },

  // --- PMS Enterprise Operations ---
  async executeRoomShift(data: { booking_ref: string; to_room_id: number; reason: string; shifted_by?: string }) {
    const res = await fetch(`${API_BASE_URL}/pms/room-shift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Room shift failed');
    }
    return await res.json();
  },

  async recordPayment(data: { booking_ref: string; payment_type: string; payment_mode: string; amount: number; transaction_ref?: string; notes?: string; collected_by?: string }) {
    const res = await fetch(`${API_BASE_URL}/pms/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Payment recording failed');
    }
    return await res.json();
  },

  async addFolioItem(data: { booking_ref: string; item_type: string; description: string; quantity: number; unit_price: number; sac_code?: string; kot_number?: string }) {
    const res = await fetch(`${API_BASE_URL}/pms/folio/add-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to add folio item');
    }
    return await res.json();
  },

  async getMasterFolio(bookingRef: string) {
    const res = await fetch(`${API_BASE_URL}/pms/folio/${bookingRef.trim().toUpperCase()}`);
    if (!res.ok) throw new Error(`Master folio for ${bookingRef} not found`);
    return await res.json();
  },

  async submitPoliceStationLog(data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE_URL}/pms/police-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to log police register record');
    }
    return await res.json();
  },

  async getPoliceStationLogs() {
    const res = await fetch(`${API_BASE_URL}/pms/police-register`);
    if (!res.ok) throw new Error('Failed to retrieve police station register');
    return await res.json();
  },

  async updateHousekeeping(roomId: number, status: string, updatedBy?: string) {
    const res = await fetch(`${API_BASE_URL}/pms/housekeeping/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: roomId, housekeeping_status: status, updated_by: updatedBy })
    });
    if (!res.ok) throw new Error('Failed to update housekeeping status');
    return await res.json();
  },

  async runNightAudit(auditDate?: string, auditedBy?: string) {
    const res = await fetch(`${API_BASE_URL}/pms/night-audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audit_date: auditDate, audited_by: auditedBy })
    });
    if (!res.ok) throw new Error('Failed to run night audit');
    return await res.json();
  },

  // --- Local Hardware Bridge (Thermal Printer & RFID Encoder) ---
  async checkHardwareBridge(): Promise<boolean> {
    try {
      const res = await fetch('http://127.0.0.1:8080/status', { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  async printThermalReceipt(receiptData: { booking_ref: string; guest_name: string; room_name: string; total_amount: number }) {
    try {
      const res = await fetch('http://127.0.0.1:8080/print-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData)
      });
      return await res.json();
    } catch {
      window.open(this.getPrintSlipUrl(receiptData.booking_ref), '_blank');
      return { status: 'FALLBACK_BROWSER_PRINT', message: 'Printed via browser dialog' };
    }
  },

  async encodeRfidKeycard(keyData: { room_no: string; guest_name: string; check_out_date: string }) {
    try {
      const res = await fetch('http://127.0.0.1:8080/encode-keycard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keyData)
      });
      return await res.json();
    } catch {
      return { status: 'BRIDGE_OFFLINE', message: 'Local Hardware Bridge not running on port 8080. Start backend/hardware_bridge.py on desk PC.' };
    }
  },

  // --- Real-Time Front-Desk Synchronization ---
  async walkInCheckIn(payload: Record<string, unknown>): Promise<BookingResponse> {
    const res = await fetch(`${API_BASE_URL}/pms/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Walk-in check-in failed');
    }
    return await res.json();
  },

  async checkOutBooking(payload: { booking_ref: string; settlement_payment_mode?: string; settlement_amount_paid?: number; transaction_ref?: string; processed_by?: string }) {
    const res = await fetch(`${API_BASE_URL}/pms/check-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Check-out settlement failed');
    }
    return await res.json();
  },

  async toggleRoomMaintenance(roomId: number, underMaintenance: boolean, reason?: string) {
    const res = await fetch(`${API_BASE_URL}/pms/rooms/${roomId}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: roomId, is_under_maintenance: underMaintenance, reason })
    });
    if (!res.ok) throw new Error('Failed to toggle room maintenance');
    return await res.json();
  },

  async getPmsDashboardSync() {
    const res = await fetch(`${API_BASE_URL}/pms/sync/dashboard`);
    if (!res.ok) throw new Error('Failed to synchronize PMS dashboard');
    return await res.json();
  },

  async uploadGuestDocument(file: File): Promise<{ status: string; storage: string; url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/uploads/guest-document`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Document upload to Cloudflare R2 failed');
    }
    return await res.json();
  },

  async exportDatabaseBackup() {
    const res = await fetch(`${API_BASE_URL}/pms/backup/export`);
    if (!res.ok) throw new Error('Failed to export database backup');
    return await res.json();
  },

  // --- Real-Time Relational CRUD API Operations ---
  async getDiningTables(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/pms/tables`);
    if (!res.ok) throw new Error('Failed to fetch dining tables');
    return await res.json();
  },

  async saveDiningTable(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save dining table');
    return await res.json();
  },

  async getKotTickets(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/pms/kots`);
    if (!res.ok) throw new Error('Failed to fetch KOT tickets');
    return await res.json();
  },

  async saveKotTicket(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/kots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save KOT ticket');
    return await res.json();
  },

  async getMasterItems(category: string): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/pms/masters/${category}`);
    if (!res.ok) throw new Error(`Failed to fetch master items for ${category}`);
    return await res.json();
  },

  async saveMasterItem(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/masters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save master item');
    return await res.json();
  },

  async deleteMasterItem(category: string, code: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/masters/${category}/${code}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete master item');
    return await res.json();
  },

  async getFullCloudState(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/sync/full-state`);
    if (!res.ok) throw new Error('Failed to fetch full cloud state');
    return await res.json();
  }
};
