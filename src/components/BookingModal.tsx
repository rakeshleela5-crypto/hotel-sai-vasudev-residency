import React, { useState, useMemo } from 'react';
import type { Room, BookingResponse } from '../types';
import { hotelApi } from '../services/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoom: Room | null;
  initialDates?: { checkIn: string; checkOut: string; guests: number };
}

const TODAY_STR = new Date().toISOString().split('T')[0];
const TOMORROW_STR = new Date(Date.now() + 86400000).toISOString().split('T')[0];

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedRoom,
  initialDates
}) => {
  const [checkIn, setCheckIn] = useState(initialDates?.checkIn || TODAY_STR);
  const [checkOut, setCheckOut] = useState(initialDates?.checkOut || TOMORROW_STR);
  const [adults, setAdults] = useState(initialDates?.guests || 2);
  const [children, setChildren] = useState(0);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculate nights
  const totalNights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [checkIn, checkOut]);

  // Price calculations
  const roomPrice = selectedRoom?.price_per_night || 2499;
  const subtotal = roomPrice * totalNights;
  const taxes = Math.round(subtotal * 0.12); // 12% GST
  const grandTotal = subtotal + taxes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const response = await hotelApi.createBooking({
        room_id: selectedRoom.id,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        check_in_date: checkIn,
        check_out_date: checkOut,
        adults,
        children,
        total_nights: totalNights,
        total_price: grandTotal,
        special_requests: specialRequests
      });

      setBookingResult(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to process reservation. Please try again.';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setBookingResult(null);
    setErrorMsg(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleResetAndClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button 
          className="modal-close-btn" 
          onClick={handleResetAndClose}
          aria-label="Close Booking Modal"
        >
          ✕
        </button>

        {!bookingResult ? (
          <div className="modal-booking-view">
            <div className="modal-header">
              <span className="badge badge-gold">DIRECT RESERVATION</span>
              <h2 className="modal-title">Confirm Your Stay</h2>
              <p className="modal-subtitle">
                Hotel Sai Vasudev Residency &bull; Instant Confirmation via FastAPI & PostgreSQL
              </p>
            </div>

            {selectedRoom && (
              <div className="modal-room-summary">
                <img src={selectedRoom.image_url} alt={selectedRoom.name} className="modal-room-thumb" />
                <div className="modal-room-info">
                  <h4>{selectedRoom.name}</h4>
                  <p>{selectedRoom.bed_type} &bull; {selectedRoom.room_size} &bull; Up to {selectedRoom.capacity} Guests</p>
                  <span className="modal-rate">₹{selectedRoom.price_per_night.toLocaleString('en-IN')} / night</span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="alert-box error">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="modal-checkin">Check-in Date</label>
                  <input
                    id="modal-checkin"
                    type="date"
                    min={TODAY_STR}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="modal-checkout">Check-out Date</label>
                  <input
                    id="modal-checkout"
                    type="date"
                    min={checkIn || TODAY_STR}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="modal-adults">Adults</label>
                  <select
                    id="modal-adults"
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                  >
                    <option value={1}>1 Adult</option>
                    <option value={2}>2 Adults</option>
                    <option value={3}>3 Adults</option>
                    <option value={4}>4 Adults</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="modal-children">Children (Under 12)</label>
                  <select
                    id="modal-children"
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                  >
                    <option value={0}>0 Children</option>
                    <option value={1}>1 Child</option>
                    <option value={2}>2 Children</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="modal-guest-name">Full Name (Primary Guest)</label>
                <input
                  id="modal-guest-name"
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="modal-guest-email">Email Address</label>
                  <input
                    id="modal-guest-email"
                    type="email"
                    placeholder="name@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="modal-guest-phone">Phone / WhatsApp</label>
                  <input
                    id="modal-guest-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="modal-special-requests">Special Requests / Darshan Timings (Optional)</label>
                <textarea
                  id="modal-special-requests"
                  rows={2}
                  placeholder="Need ground floor room, late check-in, or VIP darshan pass assistance..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                />
              </div>

              {/* Price Calculation Box */}
              <div className="price-breakdown-card">
                <div className="breakdown-line">
                  <span>Room Rate ({totalNights} night{totalNights > 1 ? 's' : ''})</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="breakdown-line">
                  <span>GST & Hospitality Taxes (12%)</span>
                  <span>₹{taxes.toLocaleString('en-IN')}</span>
                </div>
                <div className="breakdown-divider"></div>
                <div className="breakdown-line total">
                  <span>Total Payable</span>
                  <span className="total-gold">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="payment-terms-note">
                  🔒 Pay during check-in at the front desk or via UPI / Card. Free cancellation up to 24 hours prior.
                </div>
              </div>

              <button
                id="submit-booking-reservation-btn"
                type="submit"
                className="btn btn-primary modal-submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <span>Connecting to Railway API & Database...</span>
                ) : (
                  <span>Confirm Reservation Now</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="booking-success-view">
            <div className="success-icon-badge">✓</div>
            <h2 className="success-title">Reservation Confirmed!</h2>
            <p className="success-subtitle">
              Thank you for choosing Hotel Sai Vasudev Residency. Your sacred retreat is secured.
            </p>

            <div className="booking-confirmation-ticket">
              <div className="ticket-header">
                <div>
                  <span className="ticket-label">BOOKING REFERENCE NUMBER</span>
                  <div className="ticket-ref">{bookingResult.booking_ref}</div>
                </div>
                <span className="status-pill confirmed">● Confirmed</span>
              </div>

              <div className="ticket-details-grid">
                <div>
                  <span className="ticket-label">GUEST NAME</span>
                  <strong>{bookingResult.guest_name}</strong>
                </div>
                <div>
                  <span className="ticket-label">ROOM CATEGORY</span>
                  <strong>{selectedRoom?.name || 'Deluxe Room'}</strong>
                </div>
                <div>
                  <span className="ticket-label">CHECK-IN</span>
                  <strong>{bookingResult.check_in_date} (12:00 PM)</strong>
                </div>
                <div>
                  <span className="ticket-label">CHECK-OUT</span>
                  <strong>{bookingResult.check_out_date} (11:00 AM)</strong>
                </div>
                <div>
                  <span className="ticket-label">TOTAL GUESTS</span>
                  <strong>{bookingResult.adults} Adults, {bookingResult.children} Children</strong>
                </div>
                <div>
                  <span className="ticket-label">TOTAL AMOUNT</span>
                  <strong className="total-gold">₹{bookingResult.total_price.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="ticket-footer-note">
                📍 <strong>Hotel Sai Vasudev Residency</strong> &bull; Near Temple Main Gate No. 2
                <br />
                A confirmation SMS & Email has been dispatched to {bookingResult.guest_phone}.
              </div>
            </div>

            <div className="success-actions">
              <a
                href={`https://wa.me/919876543210?text=Hello%20Hotel%20Sai%20Vasudev%20Residency,%20my%20booking%20reference%20is%20${bookingResult.booking_ref}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <span>💬 WhatsApp Front Desk</span>
              </a>
              <button className="btn btn-outline-gold" onClick={handleResetAndClose}>
                Close Window
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
