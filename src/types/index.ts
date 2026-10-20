export interface Room {
  id: number;
  name: string;
  slug: string;
  room_type: string;
  price_per_night: number;
  capacity: number;
  total_inventory?: number;
  bed_type: string;
  room_size: string;
  description: string;
  amenities: string;
  image_url: string;
  badge?: string;
  is_available: boolean;
}

export interface AvailabilityCheckResponse {
  available: boolean;
  room_id: number;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  capacity: number;
  adults: number;
  base_rate_per_night: number;
  base_subtotal: number;
  extra_guest_charge: number;
  taxable_amount: number;
  gst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  total_tax: number;
  grand_total: number;
  remaining_rooms_count: number;
  message: string;
}

export interface BookingPayload {
  room_id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  id_proof_type?: string;
  id_proof_number?: string;
  vehicle_number?: string;
  company_name?: string;
  gstin?: string;
  advance_paid?: number;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  total_nights?: number;
  payment_method?: string;
  special_requests?: string;
}

export interface BookingResponse {
  id: number;
  booking_ref: string;
  invoice_number?: string;
  room_id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  id_proof_type?: string;
  id_proof_number?: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  total_nights: number;
  base_rate?: number;
  base_amount?: number;
  extra_guest_charge?: number;
  gst_rate?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  total_tax?: number;
  total_price: number;
  payment_status?: string;
  payment_method?: string;
  status: string;
  special_requests?: string;
  created_at: string;
  room?: Room;
}

export interface TaxInvoice {
  hotel_name: string;
  tagline: string;
  hotel_address: string;
  hotel_phone: string;
  hotel_email: string;
  hotel_gstin: string;
  sac_code: string;
  invoice_number: string;
  invoice_date: string;
  booking_ref: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  id_proof_type?: string;
  room_name: string;
  room_type: string;
  check_in_date: string;
  check_out_date: string;
  total_nights: number;
  adults: number;
  children: number;
  daily_tariff: number;
  base_amount: number;
  extra_guest_charge: number;
  taxable_value: number;
  gst_rate_percent: number;
  cgst_amount: number;
  sgst_amount: number;
  total_tax_amount: number;
  grand_total: number;
  payment_status: string;
  payment_method: string;
  status: string;
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
