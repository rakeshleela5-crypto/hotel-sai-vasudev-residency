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
import { apiClient, API_BASE_URL as CLIENT_API_BASE_URL } from './apiClient';
import { cacheRoomsLocally, cacheMenuLocally, getCachedMenu, queueOfflineKot } from './db';

const API_BASE_URL = CLIENT_API_BASE_URL;
// Wrap global fetch to automatically enforce UUIDv4 Idempotency Keys (#1), JWT refresh rotation (#47), and 409 handling (#25)
const fetch = apiClient.fetch;

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
      let res = await fetch(`${rootUrl}/health`, { method: 'GET' });
      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/health/ready`, { method: 'GET' });
      }
      if (res.ok) {
        const data = await res.json();
        return {
          status: data.status || 'ready',
          database: data.database || 'connected',
          engine: data.engine || 'PostgreSQL (Railway)'
        };
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
      // Dexie.js cache synchronization (#6, #33 Part A)
      if (typeof window !== 'undefined' && localRooms.length > 0) {
        cacheRoomsLocally(localRooms).catch(e => console.debug('[hotelApi.getRooms] Dexie cache note:', e));
      }
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

  async getRoomShifts(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/room-shifts`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
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

  async getCheckIns(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/check-ins`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteCheckIn(bookingRef: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/check-ins/${encodeURIComponent(bookingRef)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to cancel check-in');
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

  async uploadBookingKyc(bookingId: number, file: File) {
    return await R2StorageClient.uploadBookingKyc(bookingId, file);
  },

  async getBookingKycPresignedUrl(bookingId: number, expiresIn: number = 900) {
    return await R2StorageClient.getBookingKycPresignedUrl(bookingId, expiresIn);
  },

  async deleteBookingKyc(bookingId: number) {
    return await R2StorageClient.deleteBookingKyc(bookingId);
  },

  async uploadRoomPhoto(roomId: number, file: File) {
    return await R2StorageClient.uploadRoomPhoto(roomId, file);
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
    try {
      if (typeof window !== 'undefined' && !window.navigator.onLine) {
        console.info('[hotelApi.saveKotTicket] Wi-Fi offline, queuing steward KOT in Dexie (#33)');
        return await queueOfflineKot(payload);
      }
      const res = await fetch(`${API_BASE_URL}/pms/kots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save KOT ticket to PostgreSQL');
      return await res.json();
    } catch (err) {
      console.warn('[hotelApi.saveKotTicket] Network error, fallback queuing steward KOT in Dexie:', err);
      return await queueOfflineKot(payload);
    }
  },

  async deleteKotTicket(kotNo: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/kots/${encodeURIComponent(kotNo)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete KOT ticket');
    return await res.json();
  },

  async getMasterItems(category: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/masters/${category}`);
      if (res.ok) {
        const data = await res.json();
        if (typeof window !== 'undefined' && (category.toLowerCase().includes('food') || category.toLowerCase().includes('menu') || category.toLowerCase().includes('item'))) {
          cacheMenuLocally(data);
        }
        return data;
      }
    } catch (err) {
      console.warn(`[hotelApi.getMasterItems] Network error, reading Dexie cache for ${category}:`, err);
    }
    if (category.toLowerCase().includes('food') || category.toLowerCase().includes('menu')) {
      const cached = await getCachedMenu();
      if (cached.length > 0) return cached;
    }
    return [];
  },

  async saveMasterItem(payload: any): Promise<any> {
    const endpoint = (payload.itemData || payload.itemName) ? `${API_BASE_URL}/pms/master-items` : `${API_BASE_URL}/pms/masters`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save master item');
    return await res.json();
  },

  async deleteMasterItem(category: string, codeOrName: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/master-items/${encodeURIComponent(category)}/${encodeURIComponent(codeOrName)}`, {
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

  async deleteFoodBill(billNo: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/food-bills/${encodeURIComponent(billNo)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete food bill');
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

  async deletePettyExpense(expenseId: string | number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/expenses/${encodeURIComponent(String(expenseId))}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete petty expense');
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
    try {
      const res = await fetch(`${API_BASE_URL}/pms/housekeeping-discrepancies`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
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
  },

  async encodeKeycard(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/keycards/encode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to encode keycard in cloud');
    }
    return await res.json();
  },

  async getKeycards(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/pms/keycards`);
    if (!res.ok) return [];
    return await res.json();
  },

  async saveGroupBooking(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/group-bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save group booking to cloud database');
    }
    return await res.json();
  },

  async getGroupBookings(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/pms/group-bookings`);
    if (!res.ok) throw new Error('Failed to fetch group bookings from cloud database');
    return await res.json();
  },

  async cancelGroupBooking(groupId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/group-bookings/${groupId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to cancel group booking');
    }
    return await res.json();
  },

  // Module 19: Full Checkout & Folio Settlement Persistence
  async saveCheckout(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/checkouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to persist checkout to PostgreSQL');
    }
    return await res.json();
  },

  async getCheckouts(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/pms/checkouts`);
    if (!res.ok) throw new Error('Failed to fetch checkouts from PostgreSQL');
    return await res.json();
  },

  async deleteCheckout(invoiceNo: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/checkouts/${encodeURIComponent(invoiceNo)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete checkout from PostgreSQL');
    return await res.json();
  },

  // Module 20: Advance Receipts & Guest Deposits
  async saveAdvanceReceipt(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/advance-receipts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to persist advance receipt to PostgreSQL');
    }
    return await res.json();
  },

  async getAdvanceReceipts(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/pms/advance-receipts`);
    if (!res.ok) throw new Error('Failed to fetch advance receipts from PostgreSQL');
    return await res.json();
  },

  async deleteAdvanceReceipt(receiptNo: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/advance-receipts/${encodeURIComponent(receiptNo)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete advance receipt from PostgreSQL');
    return await res.json();
  },

  // Module 21: Double-Entry Financial Journal Ledger
  async postJournalEntry(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/journal-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to post journal entry to PostgreSQL');
    }
    return await res.json();
  },

  async getJournalEntries(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/journal-entries`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // Module 22: Party Accounts (Sundry Creditors & Debtors)
  async savePartyAccount(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/party-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save party account to PostgreSQL');
    }
    return await res.json();
  },

  async getPartyAccounts(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/party-accounts`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async deletePartyAccount(accountId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/party-accounts/${encodeURIComponent(accountId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete party account from PostgreSQL');
    return await res.json();
  },

  // Module 23: General Receipts Register
  async saveGeneralReceipt(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/general-receipts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to persist general receipt to PostgreSQL');
    }
    return await res.json();
  },

  async getGeneralReceipts(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/general-receipts`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteGeneralReceipt(receiptNo: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/general-receipts/${encodeURIComponent(receiptNo)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete general receipt from PostgreSQL');
    return await res.json();
  },

  // Module 24: General Payments Register
  async saveGeneralPayment(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/general-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to persist general payment to PostgreSQL');
    }
    return await res.json();
  },

  async getGeneralPayments(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/general-payments`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteGeneralPayment(paymentNo: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/general-payments/${encodeURIComponent(paymentNo)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete general payment from PostgreSQL');
    return await res.json();
  },

  // Module 25: Multi-Godown Warehouse Masters
  async saveGodown(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/godowns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save godown to PostgreSQL');
    }
    return await res.json();
  },

  async getGodowns(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/godowns`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteGodown(godownId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/godowns/${encodeURIComponent(godownId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete godown from PostgreSQL');
    return await res.json();
  },

  // Module 26: Inventory Item Groups Master
  async saveItemGroup(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/item-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save item group to PostgreSQL');
    }
    return await res.json();
  },

  async getItemGroups(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/item-groups`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteItemGroup(groupId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/item-groups/${encodeURIComponent(groupId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete item group from PostgreSQL');
    return await res.json();
  },

  // Module 27: Stock Transfers & Issues
  async saveStockTransfer(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/stock-transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to persist stock transfer to PostgreSQL');
    }
    return await res.json();
  },

  async getStockTransfers(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/stock-transfers`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteStockTransfer(entryNo: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/stock-transfers/${encodeURIComponent(entryNo)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete stock transfer from PostgreSQL');
    return await res.json();
  },

  // Module 28: User Staff Accounts & Roles
  async saveUserAccount(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save user account to PostgreSQL');
    }
    return await res.json();
  },

  async getUserAccounts(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/users`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteUserAccount(userId: number | string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/users/${encodeURIComponent(String(userId))}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete user account from PostgreSQL');
    return await res.json();
  },

  // Module 29: Commission Agents
  async saveCommissionAgent(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/commission-agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save commission agent to PostgreSQL');
    }
    return await res.json();
  },

  async getCommissionAgents(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/commission-agents`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteCommissionAgent(agentId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/commission-agents/${encodeURIComponent(agentId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete commission agent from PostgreSQL');
    return await res.json();
  },

  // Module 30: Agent Commission Payout Vouchers
  async saveAgentPayoutVoucher(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/agent-payout-vouchers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save agent payout voucher to PostgreSQL');
    }
    return await res.json();
  },

  async getAgentPayoutVouchers(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/agent-payout-vouchers`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // Module 31: Shift Handovers & Cash Reconciliation
  async saveShiftHandover(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/shift-handovers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save shift handover to PostgreSQL');
    }
    return await res.json();
  },

  async getShiftHandovers(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/shift-handovers`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // Module 32: Banquet Venues & Event Bookings
  async saveBanquetVenue(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/banquet-venues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save banquet venue to PostgreSQL');
    }
    return await res.json();
  },

  async getBanquetVenues(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/banquet-venues`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteBanquetVenue(venueId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/banquet-venues/${encodeURIComponent(venueId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete banquet venue from PostgreSQL');
    return await res.json();
  },

  async saveBanquetBooking(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/banquet-bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save banquet booking to PostgreSQL');
    }
    return await res.json();
  },

  async getBanquetBookings(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/banquet-bookings`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteBanquetBooking(bookingNo: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/banquet-bookings/${encodeURIComponent(bookingNo)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete banquet booking from PostgreSQL');
    return await res.json();
  },

  async addBanquetKot(bookingNo: string, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/banquet-bookings/${encodeURIComponent(bookingNo)}/kots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to add catering KOT to banquet booking');
    return await res.json();
  },

  async recordBanquetPayment(bookingNo: string, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/banquet-bookings/${encodeURIComponent(bookingNo)}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to record payment for banquet booking');
    return await res.json();
  },

  // Module 33: Restro-Bar & Liquor Excise
  async saveLiquorItem(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/liquor-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save liquor item to PostgreSQL');
    }
    return await res.json();
  },

  async getLiquorItems(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/liquor-items`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteLiquorItem(itemCode: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/liquor-items/${encodeURIComponent(itemCode)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete liquor item from PostgreSQL');
    return await res.json();
  },

  async saveBarInvoice(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/bar-invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save bar invoice to PostgreSQL');
    }
    return await res.json();
  },

  async getBarInvoices(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/bar-invoices`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteBarInvoice(billNo: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/bar-invoices/${encodeURIComponent(billNo)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete bar invoice from PostgreSQL');
    return await res.json();
  },

  async getLiquorStocks(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/liquor-stocks`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async saveLiquorStock(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/liquor-stocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update liquor stock in PostgreSQL');
    return await res.json();
  },

  // Module 34: Hotel Assets & Linen Master
  async saveHotelAsset(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/hotel-assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save hotel asset to PostgreSQL');
    }
    return await res.json();
  },

  async getHotelAssets(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/hotel-assets`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteHotelAsset(assetId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/hotel-assets/${encodeURIComponent(assetId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete hotel asset from PostgreSQL');
    return await res.json();
  },

  // Module 35: Pilgrim Valuables & Lockers
  async saveLocker(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/lockers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save locker to PostgreSQL');
    }
    return await res.json();
  },

  async getLockers(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/lockers`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteLocker(lockerNo: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/lockers/${encodeURIComponent(lockerNo)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete locker from PostgreSQL');
    return await res.json();
  },

  // Module 36: WhatsApp CRM & Guest Communication
  async saveWhatsAppLog(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/whatsapp-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save WhatsApp log to PostgreSQL');
    }
    return await res.json();
  },

  async getWhatsAppLogs(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/whatsapp-logs`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async saveWhatsAppConfig(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/whatsapp-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save WhatsApp configuration to PostgreSQL');
    }
    return await res.json();
  },

  async getWhatsAppConfig(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/whatsapp-config`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Module 37: Support & Service Tickets
  async saveSupportTicket(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/support-tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to save support ticket to PostgreSQL');
    }
    return await res.json();
  },

  async getSupportTickets(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/support-tickets`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async deleteSupportTicket(ticketNo: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/support-tickets/${encodeURIComponent(ticketNo)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete support ticket from PostgreSQL');
    return await res.json();
  },

  // Module 38: Hotel Settings & Identity
  async getHotelSettings(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/settings`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async saveHotelSettings(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save hotel settings');
    return await res.json();
  },

  // Module 39: Room Types Master
  async getRoomTypes(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/room-types`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async saveRoomType(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/room-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save room type');
    return await res.json();
  },

  async deleteRoomType(typeId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/room-types/${encodeURIComponent(typeId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete room type');
    return await res.json();
  },

  // Module 40: Restaurant Menu Items
  async getMenuItems(category?: string): Promise<any[]> {
    try {
      const url = category ? `${API_BASE_URL}/pms/menu-items?category=${encodeURIComponent(category)}` : `${API_BASE_URL}/pms/menu-items`;
      const res = await fetch(url);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async saveMenuItem(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save menu item');
    return await res.json();
  },

  async saveMenuItemsBulk(items: any[]): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/menu-items/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items)
    });
    if (!res.ok) throw new Error('Failed to save menu items bulk');
    return await res.json();
  },

  async deleteMenuItem(itemCode: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/menu-items/${encodeURIComponent(itemCode)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete menu item');
    return await res.json();
  },

  // Module 41: Housekeeping Duty Records
  async getHousekeepingRecords(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/housekeeping`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async saveHousekeepingRecord(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/housekeeping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save housekeeping record');
    return await res.json();
  },

  // Module 42: Agent Commission Accruals
  async getAgentCommissions(agentId?: string, status?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (agentId) params.append('agent_id', agentId);
      if (status) params.append('status', status);
      const url = `${API_BASE_URL}/pms/agent-commissions${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async saveAgentCommission(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/agent-commissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save agent commission');
    return await res.json();
  },

  async updateAgentCommissionStatus(commissionId: string, status: string, payoutVoucherNo?: string, payoutDate?: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/agent-commissions/${encodeURIComponent(commissionId)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, payoutVoucherNo, payoutDate })
    });
    if (!res.ok) throw new Error('Failed to update agent commission status');
    return await res.json();
  },

  // Module 43: WhatsApp & SMS Notification Templates
  async getWhatsAppTemplates(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/whatsapp-templates`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async saveWhatsAppTemplate(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/whatsapp-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save whatsapp template');
    return await res.json();
  },

  async saveWhatsAppTemplatesBulk(templates: any[]): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/whatsapp-templates/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templates)
    });
    if (!res.ok) throw new Error('Failed to bulk save whatsapp templates');
    return await res.json();
  },

  // Module 44: Roles & Permissions Matrix
  async getRoles(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/roles`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async saveRole(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save role');
    return await res.json();
  },

  // Module 45: No-Discount Margin Protection Config
  async getNoDiscountConfig(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/no-discount-config`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async saveNoDiscountConfig(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/no-discount-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save no-discount config');
    return await res.json();
  },

  // Module 46: Liquor Brands & Dispensing Units
  async getLiquorBrands(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/liquor-brands`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async saveLiquorBrand(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/liquor-brands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save liquor brand');
    return await res.json();
  },

  async getLiquorUnits(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/liquor-units`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async saveLiquorUnit(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/liquor-units`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save liquor unit');
    return await res.json();
  },

  // Module 46: User Shift Handovers & Cash Drawer Reconciliation
  async recordShiftHandover(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/shift-handovers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save shift handover');
    return await res.json();
  },

  // Module 47: Anti-Theft Discount Audit Logs
  async recordDiscountAudit(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/discount-audit-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save discount audit log');
    return await res.json();
  },

  async getDiscountAuditLogs(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/discount-audit-logs`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // Module 48: Multi-Branch Hotel Properties Master
  async saveProperty(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save property');
    return await res.json();
  },

  async saveProperties(props: any[]): Promise<any> {
    const results = await Promise.all(
      props.map(p => this.saveProperty(p).catch(() => null))
    );
    return results;
  },

  async getProperties(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/properties`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // Module 49: Extend Stay on Booking
  async extendStay(roomNo: string, newCheckOutDate: string, extendedBy: string = 'Duty Manager'): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/bookings/extend-stay`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomNo, newCheckOutDate, extendedBy })
    });
    if (!res.ok) throw new Error('Failed to extend stay');
    return await res.json();
  },

  // Module 50: Room Folio Incidental Charges
  async postRoomFolioItem(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/room-folio-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to post room folio charge');
    return await res.json();
  },

  async getRoomFolioItems(roomNo: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/room-folio-items/${encodeURIComponent(roomNo)}`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // Module 51: Housekeeping Discrepancy Resolution
  async resolveHousekeepingDiscrepancy(discrepancyId: string | number, notes?: string, resolvedBy: string = 'Duty Manager'): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/housekeeping-discrepancies/${encodeURIComponent(String(discrepancyId))}/resolve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, resolvedBy })
    });
    if (!res.ok) throw new Error('Failed to resolve housekeeping discrepancy');
    return await res.json();
  },

  // Module 52: Demo Requests / Enterprise Leads
  async submitDemoRequest(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/demo-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit demo request');
    return await res.json();
  },

  // Module 53: Table Shifts
  async recordTableShift(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/restaurant/table-shifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to record table shift');
    return await res.json();
  },

  async getTableShifts(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/restaurant/table-shifts`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // Module 54: Table Sessions
  async saveTableSession(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/restaurant/table-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save table session');
    return await res.json();
  },

  async getTableSessions(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/restaurant/table-sessions`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // Module 55: Housekeeping Discrepancies
  async createHousekeepingDiscrepancy(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/housekeeping-discrepancies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create housekeeping discrepancy');
    return await res.json();
  },


  // Module 56: RFID Key Cards
  async issueKeyCard(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/key-cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to issue key card');
    return await res.json();
  },

  async extendKeyCard(cardNumber: string, validUntil: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/key-cards/${encodeURIComponent(cardNumber)}/extend`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valid_until: validUntil })
    });
    if (!res.ok) throw new Error('Failed to extend key card');
    return await res.json();
  },

  async getKeyCards(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/key-cards`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // Module 57: Company Info
  async saveCompanyInfo(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/company-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save company branding');
    return await res.json();
  },

  async getCompanyInfo(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/company-info`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Module 58: Virtual Accounts
  async createVirtualAccount(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/virtual-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to record virtual account');
    return await res.json();
  },

  async getVirtualAccounts(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/virtual-accounts`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // Module 59: Liquor Stock Adjustments
  async recordLiquorAdjustment(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/liquor/stock-adjustments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to record liquor adjustment');
    return await res.json();
  },

  // Module 60: Manager PIN Verification
  async verifyManagerPin(pin: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/pms/auth/verify-manager-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Module 61: Confirm Booking
  async confirmBooking(bookingId: string | number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/bookings/${encodeURIComponent(String(bookingId))}/confirm`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Failed to confirm booking');
    return await res.json();
  },

  // Module 62: Deletions
  async deleteExpense(expenseId: string | number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/expenses/${encodeURIComponent(String(expenseId))}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete expense');
    return await res.json();
  },

  async deletePurchase(purchaseId: string | number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/purchases/${encodeURIComponent(String(purchaseId))}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete purchase');
    return await res.json();
  },

  async deleteRole(roleId: string | number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/roles/${encodeURIComponent(String(roleId))}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete role');
    return await res.json();
  },

  async deleteUser(userId: string | number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/users/${encodeURIComponent(String(userId))}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return await res.json();
  },

  async deleteWhatsAppTemplate(templateId: string | number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/whatsapp/templates/${encodeURIComponent(String(templateId))}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete WhatsApp template');
    return await res.json();
  },

  async clearWhatsAppLogs(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/whatsapp/logs`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to clear WhatsApp logs');
    return await res.json();
  },

  async settlePartyAccount(accountName: string, amount: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/party-accounts/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountName, amount })
    });
    if (!res.ok) throw new Error('Failed to settle party account');
    return await res.json();
  },

  async createRoom(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create room in database');
    return await res.json();
  },

  async updateRoom(roomId: string | number, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update room in database');
    return await res.json();
  },

  async deleteRoom(roomId: string | number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/rooms/${roomId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete room in database');
    return await res.json();
  },

  async saveTable(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save table in database');
    return await res.json();
  },

  async deleteTable(tableId: string | number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/pms/tables/${tableId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete table in database');
    return await res.json();
  }
};


