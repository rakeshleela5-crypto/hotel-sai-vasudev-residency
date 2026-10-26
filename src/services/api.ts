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
import { R2StorageClient, type R2UploadResult, type R2FileItem, type R2StatusResponse, type R2TestConnectionResponse } from './r2Storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Official 18-Room Inventory for Hotel Sai Vasudev Residency (Shirdi)
// Tariffs listed are INCLUSIVE of GST per the property specification sheets
const FALLBACK_ROOMS: Room[] = [
  {
    id: 1,
    name: "Deluxe Room",
    slug: "deluxe-room",
    room_type: "Deluxe",
    price_per_night: 1500,
    capacity: 1,          // Single-occupancy (rooms 101, 102, 202 are 1-adult max)
    total_inventory: 3,   // Rooms: 101, 102, 202
    bed_type: "Single / Queen Size",
    room_size: "200 sq ft",
    description: "Comfortable and affordable pilgrimage rooms. Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, and Coffee Maker. Single-occupancy. Up to 2 children (0–6 yrs) stay free. GST inclusive.",
    amenities: "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker",
    image_url: "/images/deluxe_room.jpg",
    badge: "Best Value",
    is_available: true
  },
  {
    id: 2,
    name: "Classic Studio Room",
    slug: "classic-studio-room",
    room_type: "Classic Studio",
    price_per_night: 2000,
    capacity: 2,
    total_inventory: 6,   // Rooms: 103, 104, 105, 203, 204, 205
    bed_type: "Queen Bed",
    room_size: "280 sq ft",
    description: "Spacious classic rooms with modern comforts. Free Wi-Fi, TV, 24/7 Hot Water, Coffee Maker, Sofa, Hair Dryer, and Mini Fridge. Max 2 Adults + 2 Children (0–6 free). GST inclusive.",
    amenities: "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Sofa Seating, Hair Dryer, Mini Fridge",
    image_url: "/images/deluxe_room.jpg",
    badge: "Popular",
    is_available: true
  },
  {
    id: 3,
    name: "Executive Room",
    slug: "executive-room",
    room_type: "Executive",
    price_per_night: 2500,
    capacity: 2,
    total_inventory: 7,   // Rooms: 106, 107, 201, 206, 207, 208, 209
    bed_type: "King Size",
    room_size: "340 sq ft",
    description: "Premium executive rooms with elevated amenities. Free Wi-Fi, TV, 24/7 Hot Water, Coffee Maker, Sofa, Hair Dryer, and Mini Fridge. Max 2 Adults + 2 Children (0–6 free). GST inclusive.",
    amenities: "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Sofa Seating, Hair Dryer, Mini Fridge",
    image_url: "/images/hero.jpg",
    badge: "Recommended",
    is_available: true
  },
  {
    id: 4,
    name: "Premium Room",
    slug: "premium-room",
    room_type: "Premium",
    price_per_night: 3000,
    capacity: 2,
    total_inventory: 2,   // Rooms: 210, 211
    bed_type: "King Size",
    room_size: "400 sq ft",
    description: "Top-of-the-range rooms with luxury finishes. Free Wi-Fi, TV, 24/7 Hot Water, Coffee Maker, Sofa, Hair Dryer, and Mini Fridge. Max 2 Adults + 2 Children (0–6 free). GST inclusive.",
    amenities: "Free Wi-Fi, Flat-screen TV, 24/7 Hot Water, Coffee Maker, Sofa Seating, Hair Dryer, Mini Fridge",
    image_url: "/images/hero.jpg",
    badge: "Luxury Pick",
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
      const deluxeAvail    = localRooms.filter(r => r.roomType === 'Deluxe'       && r.status === 'vacant').length;
      const studioAvail    = localRooms.filter(r => r.roomType === 'Classic Studio' && r.status === 'vacant').length;
      const executiveAvail = localRooms.filter(r => r.roomType === 'Executive'    && r.status === 'vacant').length;
      const premiumAvail   = localRooms.filter(r => r.roomType === 'Premium'      && r.status === 'vacant').length;

      const liveRooms: Room[] = FALLBACK_ROOMS.map(r => {
        let availCount = 0;
        if (r.id === 1) availCount = deluxeAvail;
        else if (r.id === 2) availCount = studioAvail;
        else if (r.id === 3) availCount = executiveAvail;
        else if (r.id === 4) availCount = premiumAvail;

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
    const room = FALLBACK_ROOMS.find(r => r.id === roomId) || FALLBACK_ROOMS[2]; // default Executive
    const localRooms = typeof window !== 'undefined' ? PmsStore.getRooms() : [];
    
    // Map public room-card ID → PMS roomType name
    const typeMap: Record<number, string> = {
      1: 'Deluxe', 2: 'Classic Studio', 3: 'Executive', 4: 'Premium'
    };
    let matchedCategoryRooms = localRooms.filter(r => r.roomType === (typeMap[roomId] || 'Executive'));
    if (matchedCategoryRooms.length === 0) matchedCategoryRooms = localRooms;

    const vacantRooms = matchedCategoryRooms.filter(r => r.status === 'vacant');
    const remainingRoomsCount = vacantRooms.length;

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    // -----------------------------------------------------------------------
    // GST-INCLUSIVE PRICING: Tariff already contains 12% GST (all rooms ≤ ₹7,500)
    // We extract CGST + SGST from the tariff — we do NOT add them on top.
    // -----------------------------------------------------------------------
    const grandTotal = room.price_per_night * nights;  // what the guest pays
    const gstRate = 12;  // always 12% (all tariffs ≤ ₹7,500/night)
    const exGstBase = Math.round((grandTotal / 1.12) * 100) / 100;
    const cgst = Math.round(((grandTotal - exGstBase) / 2) * 100) / 100;
    const sgst = cgst;
    const totalTax = Math.round((cgst + sgst) * 100) / 100;
    const taxable = exGstBase; // pre-GST amount for GSTR-1

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
      base_subtotal: grandTotal,
      extra_guest_charge: 0,  // included in tariff
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
      const matchedRoom = FALLBACK_ROOMS.find(r => r.id === payload.room_id) || FALLBACK_ROOMS[2];
      const start = new Date(payload.check_in_date);
      const end = new Date(payload.check_out_date);
      const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      // GST-inclusive: grand total = tariff × nights
      const grandTotal = matchedRoom.price_per_night * nights;
      const gstRate = 12;
      const exGstBase = Math.round((grandTotal / 1.12) * 100) / 100;
      const cgst = Math.round(((grandTotal - exGstBase) / 2) * 100) / 100;
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
        advancePaid: payload.payment_method === 'Pay at Hotel' ? 0 : Math.round(grandTotal * 0.25),
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
        base_amount: grandTotal,
        extra_guest_charge: 0,
        gst_rate: gstRate,
        cgst_amount: cgst,
        sgst_amount: sgst,
        total_tax: cgst + sgst,
        total_price: grandTotal,
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
    const res = await fetch(`${API_BASE_URL}/bookings/${encodeURIComponent(bookingRef.trim().toUpperCase())}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        payment_status: paymentStatus,
        cancellation_reason: cancellationReason
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to update booking status: HTTP ${res.status}`);
    }
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
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE_URL}/pms/sync/dashboard`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  },

  async uploadGuestDocument(file: File, onProgress?: (pct: number) => void): Promise<R2UploadResult> {
    return await R2StorageClient.uploadGuestKycDocument(file, onProgress);
  },

  async uploadPropertyImage(file: File, onProgress?: (pct: number) => void): Promise<R2UploadResult> {
    return await R2StorageClient.uploadPropertyImage(file, onProgress);
  },

  async uploadBrandingAsset(file: File, onProgress?: (pct: number) => void): Promise<R2UploadResult> {
    return await R2StorageClient.uploadBrandingGraphic(file, onProgress);
  },

  async getR2Status(): Promise<R2StatusResponse> {
    return await R2StorageClient.getStatus();
  },

  async testR2Connection(): Promise<R2TestConnectionResponse> {
    return await R2StorageClient.testConnection();
  },

  async listR2Files(folder?: string, limit: number = 100): Promise<R2FileItem[]> {
    return await R2StorageClient.listFiles(folder, limit);
  },

  async deleteR2File(objectKey: string): Promise<boolean> {
    return await R2StorageClient.deleteFile(objectKey);
  },

  async getR2PresignedDownloadUrl(objectKey: string, expiresIn: number = 3600): Promise<string> {
    return await R2StorageClient.getPresignedDownloadUrl(objectKey, expiresIn);
  },

  async exportDatabaseBackup() {
    const headers: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('svr_admin_api_key');
      if (savedKey) headers['X-API-Key'] = savedKey;
    }
    const res = await fetch(`${API_BASE_URL}/pms/backup/export`, { headers });
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

  async applyFolioDiscount(payload: { booking_ref: string; discount_amount: number; discount_percentage?: number; discount_reason: string; approved_by?: string }) {
    const res = await fetch(`${API_BASE_URL}/pms/folio/discount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to apply folio discount');
    }
    return await res.json();
  },

  async getFolioDiscounts(roomOrRef?: string) {
    const target = roomOrRef ? encodeURIComponent(roomOrRef.trim().toUpperCase()) : 'ALL';
    const res = await fetch(`${API_BASE_URL}/pms/folio/discounts/${target}`);
    if (!res.ok) throw new Error('Failed to fetch folio discounts');
    return await res.json();
  },

  async saveFoodBill(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/food-bills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to persist food bill');
    }
    return await res.json();
  },

  async getFoodBills(startDate?: string, endDate?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/pms/food-bills${qs}`);
    if (!res.ok) throw new Error('Failed to fetch food bills');
    return await res.json();
  },

  async savePettyExpense(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to persist expense record');
    }
    return await res.json();
  },

  async getPettyExpenses(startDate?: string, endDate?: string, category?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (category) params.append('category', category);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/pms/expenses${qs}`);
    if (!res.ok) throw new Error('Failed to fetch petty expenses');
    return await res.json();
  },

  async getNightAudits(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/pms/night-audits`);
    if (!res.ok) throw new Error('Failed to fetch night audit records');
    return await res.json();
  },

  async saveInventoryPurchase(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/inventory/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to persist purchase entry');
    }
    return await res.json();
  },

  async getInventoryPurchases(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/pms/inventory/purchases`);
    if (!res.ok) throw new Error('Failed to fetch inventory purchases');
    return await res.json();
  },

  async voidKotItem(payload: { kot_id?: number; kot_number?: string; item_name: string; quantity: number; void_reason: string; voided_by?: string; table_number?: string; room_number?: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/kot/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to void KOT item');
    }
    return await res.json();
  },

  async getKotVoidLogs(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/pms/kot/void-logs`);
    if (!res.ok) throw new Error('Failed to fetch KOT void logs');
    return await res.json();
  },

  async shiftDiningTableSession(payload: { from_table: string; to_table: string; shifted_by?: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/tables/shift-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to shift dining table');
    }
    return await res.json();
  },

  async mergeDiningTableSessions(payload: { source_table: string; target_table: string; merged_by?: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/tables/merge-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to merge dining tables');
    }
    return await res.json();
  },

  async encodeKeycardAccess(payload: { room_number: string; guest_name: string; check_out_time: string; card_number?: string; operator_name?: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/keycards/encode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to encode keycard');
    }
    return await res.json();
  },

  async extendKeycardAccess(payload: { room_number: string; new_check_out_time: string; operator_name?: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/keycards/extend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to extend keycard');
    }
    return await res.json();
  },

  async reportHousekeepingDiscrepancy(payload: { room_id: number; room_number: string; pms_status: string; physical_status: string; discrepancy_type: string; reported_by?: string; notes?: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/housekeeping/audit-discrepancy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to report discrepancy');
    }
    return await res.json();
  },

  async getHousekeepingDiscrepancies(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/pms/housekeeping/discrepancies`);
    if (!res.ok) throw new Error('Failed to fetch housekeeping discrepancies');
    return await res.json();
  },

  async getFullCloudState(): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${API_BASE_URL}/pms/sync/full-state`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  }
};
