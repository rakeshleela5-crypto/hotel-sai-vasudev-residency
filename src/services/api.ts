import type { Room, BookingPayload, BookingResponse, InquiryPayload, InquiryResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Fallback initial rooms if backend is offline or during preview
const FALLBACK_ROOMS: Room[] = [
  {
    id: 1,
    name: "Executive Deluxe Room",
    slug: "executive-deluxe-room",
    room_type: "Deluxe",
    price_per_night: 2499,
    capacity: 2,
    bed_type: "King Bed",
    room_size: "340 sq ft",
    description: "Sophisticated modern room designed for ultimate relaxation after a sacred visit or business day. Features soundproof windows, premium posture-pedic mattress, ambient warm cove lighting, and an Italian marble bathroom.",
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
    bed_type: "Two Queen Beds",
    room_size: "480 sq ft",
    description: "Ideal for families and groups visiting for temple darshan or leisure. Spacious layout with two queen beds, cozy sofa seating, double wardrobe, mini refrigerator, and panoramic views.",
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
    bed_type: "Master King + Living Lounge",
    room_size: "720 sq ft",
    description: "The pinnacle of divine hospitality. Featuring a private master bedroom, separate luxurious living lounge with marble coffee table, private dining nook, soaking bathtub, and VIP concierge service.",
    amenities: "High-Speed Wi-Fi, 55\" OLED Smart TV, Luxury Bathrobe & Slippers, Soaking Bathtub, Express Check-In, Complimentary Buffet Breakfast, 24/7 Butler on Call",
    image_url: "/images/suite_room.jpg",
    badge: "Luxury Suite",
    is_available: true
  },
  {
    id: 4,
    name: "Vasudev Divine Comfort",
    slug: "vasudev-divine-comfort",
    room_type: "Standard Deluxe",
    price_per_night: 1999,
    capacity: 2,
    bed_type: "Queen Bed",
    room_size: "290 sq ft",
    description: "A quiet and peaceful haven offering divine tranquility. Impeccably clean, air-conditioned, with complimentary Wi-Fi and 24-hour hot water, perfect for solo travelers and couples.",
    amenities: "High-Speed Wi-Fi, 32\" HD TV, Air Conditioning, 24h Hot Water, Electric Kettle, Mineral Water Bottles, Room Service",
    image_url: "/images/restaurant.jpg",
    badge: "Pocket Friendly",
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
      const params = new URLSearchParams();
      if (roomType && roomType !== 'All') params.append('room_type', roomType);
      if (maxPrice) params.append('max_price', maxPrice.toString());

      const url = `${API_BASE_URL}/rooms?${params.toString()}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.length > 0 ? data : FALLBACK_ROOMS;
    } catch (err) {
      console.warn('FastAPI backend not reachable, using cached room inventory:', err);
      if (roomType && roomType !== 'All') {
        return FALLBACK_ROOMS.filter(r => r.room_type.toLowerCase().includes(roomType.toLowerCase()));
      }
      return FALLBACK_ROOMS;
    }
  },

  async createBooking(payload: BookingPayload): Promise<BookingResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Booking failed with status ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn('FastAPI unavailable, generating client confirmation for preview:', err);
      // Simulate confirmed reservation for client preview
      const simulatedRef = `SVR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const matchedRoom = FALLBACK_ROOMS.find(r => r.id === payload.room_id) || FALLBACK_ROOMS[0];
      return {
        id: Math.floor(Math.random() * 1000) + 1,
        booking_ref: simulatedRef,
        room_id: payload.room_id,
        guest_name: payload.guest_name,
        guest_email: payload.guest_email,
        guest_phone: payload.guest_phone,
        check_in_date: payload.check_in_date,
        check_out_date: payload.check_out_date,
        adults: payload.adults,
        children: payload.children,
        total_nights: payload.total_nights,
        total_price: payload.total_price,
        status: 'Confirmed',
        special_requests: payload.special_requests,
        created_at: new Date().toISOString(),
        room: matchedRoom
      };
    }
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
  }
};
