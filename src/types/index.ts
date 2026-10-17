export interface Room {
  id: number;
  name: string;
  slug: string;
  room_type: string;
  price_per_night: number;
  capacity: number;
  bed_type: string;
  room_size: string;
  description: string;
  amenities: string;
  image_url: string;
  badge?: string;
  is_available: boolean;
}

export interface BookingPayload {
  room_id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  total_nights: number;
  total_price: number;
  special_requests?: string;
}

export interface BookingResponse {
  id: number;
  booking_ref: string;
  room_id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  total_nights: number;
  total_price: number;
  status: string;
  special_requests?: string;
  created_at: string;
  room?: Room;
}

export interface InquiryPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface InquiryResponse {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  created_at: string;
}
