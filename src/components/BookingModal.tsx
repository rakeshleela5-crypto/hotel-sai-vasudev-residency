import React, { useState, useMemo, useEffect } from 'react';
import type { Room, BookingResponse, AvailabilityCheckResponse } from '../types';
import { hotelApi } from '../services/api';
import { getTodayIST, addDays, calculateNights, validateIndianPhone, validateEmail } from '../utils/validation';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoom: Room | null;
  initialDates?: { checkIn: string; checkOut: string; guests: number };
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedRoom,
  initialDates
}) => {
  const todayIST = getTodayIST();
  const [checkIn, setCheckIn] = useState(initialDates?.checkIn || todayIST);
  const [checkOut, setCheckOut] = useState(initialDates?.checkOut || addDays(todayIST, 1));
  const [adults, setAdults] = useState(initialDates?.guests || 2);
  const [children, setChildren] = useState(0);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [idProofType, setIdProofType] = useState('Aadhaar Card');
  const [paymentMethod, setPaymentMethod] = useState('Pay at Hotel');
  const [specialRequests, setSpecialRequests] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [availData, setAvailData] = useState<AvailabilityCheckResponse | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial dates if provided
  useEffect(() => {
    if (initialDates?.checkIn) {
      setCheckIn(initialDates.checkIn);
    }
    if (initialDates?.checkOut) {
      setCheckOut(initialDates.checkOut);
    }
    if (initialDates?.guests) {
      setAdults(Math.max(1, initialDates.guests));
    }
  }, [initialDates]);

  // Strict Date Math Guards
  const handleCheckInChange = (newCheckIn: string) => {
    setCheckIn(newCheckIn);
    if (!checkOut || newCheckIn >= checkOut) {
      setCheckOut(addDays(newCheckIn, 1));
    }
  };

  const handleCheckOutChange = (newCheckOut: string) => {
    if (newCheckOut <= checkIn) {
      setCheckOut(addDays(checkIn, 1));
    } else {
      setCheckOut(newCheckOut);
    }
  };

  // Calculate nights
  const totalNights = useMemo(() => {
    return calculateNights(checkIn, checkOut);
  }, [checkIn, checkOut]);

  // Real-time phone validation
  const handlePhoneChange = (val: string) => {
    setGuestPhone(val);
    if (phoneTouched) {
      const res = validateIndianPhone(val);
      setPhoneError(res.isValid ? null : res.error || 'Invalid mobile number');
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    const res = validateIndianPhone(guestPhone);
    setPhoneError(res.isValid ? null : res.error || 'Invalid mobile number');
  };

  const handleEmailChange = (val: string) => {
    setGuestEmail(val);
    if (val.trim() && !validateEmail(val)) {
      setEmailError('Please enter a valid email address (e.g. name@domain.com)');
    } else {
      setEmailError(null);
    }
  };

  // Check real-time server inventory
  useEffect(() => {
    if (!selectedRoom || !checkIn || !checkOut) return;
    let isCurrent = true;
    setCheckingAvail(true);
    setErrorMsg(null);

    hotelApi.checkRoomAvailability(selectedRoom.id, checkIn, checkOut, adults)
      .then((res) => {
        if (isCurrent) {
          setAvailData(res);
          if (!res.available) {
            setErrorMsg(res.message);
          }
        }
      })
      .catch((err) => {
        if (isCurrent) console.warn('Could not verify availability live:', err);
      })
      .finally(() => {
        if (isCurrent) setCheckingAvail(false);
      });

    return () => { isCurrent = false; };
  }, [selectedRoom, checkIn, checkOut, adults]);

  // Authoritative Indian GST Pricing Slabs (Statutory Compliance)
  // Slabs: 12% GST for room tariffs <= ₹7,500/night (6% CGST + 6% SGST)
  //        18% GST for room tariffs > ₹7,500/night (9% CGST + 9% SGST)
  const roomPrice = selectedRoom?.price_per_night || 2499;
  const standardCapacity = selectedRoom?.capacity || 2;
  const extraAdults = Math.max(0, adults - standardCapacity);
  const extraCharge = availData?.extra_guest_charge ?? (extraAdults * 500 * totalNights);
  const subtotal = availData?.base_subtotal ?? (roomPrice * totalNights);
  const taxableAmount = subtotal + extraCharge;
  const gstRate = availData?.gst_rate ?? (roomPrice > 7500 ? 18 : 12);
  const taxes = availData?.total_tax ?? Math.round(taxableAmount * (gstRate / 100));
  const grandTotal = availData?.grand_total ?? (taxableAmount + taxes);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    // Validate phone strictly
    const phoneVal = validateIndianPhone(guestPhone);
    if (!phoneVal.isValid) {
      setPhoneTouched(true);
      setPhoneError(phoneVal.error || 'Invalid phone number');
      setErrorMsg(phoneVal.error || 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (guestEmail && !validateEmail(guestEmail)) {
      setEmailError('Please enter a valid email address');
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (availData && !availData.available) {
      setErrorMsg('This room is currently fully booked for these dates. Please choose another date or category.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const response = await hotelApi.createBooking({
        room_id: selectedRoom.id,
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim(),
        guest_phone: phoneVal.sanitized,
        id_proof_type: idProofType,
        check_in_date: checkIn,
        check_out_date: checkOut,
        adults,
        children,
        total_nights: totalNights,
        payment_method: paymentMethod,
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
    setPhoneError(null);
    setEmailError(null);
    onClose();
  };

  if (!isOpen) return null;

  // Pre-fill WhatsApp inquiry text with user selected values
  const whatsappQueryText = encodeURIComponent(
    `Namaste Hotel Sai Vasudev Residency! I would like to inquire about booking:
• Room: ${selectedRoom?.name || 'Deluxe Room'}
• Check-In: ${checkIn}
• Check-Out: ${checkOut} (${totalNights} Night${totalNights > 1 ? 's' : ''})
• Guests: ${adults} Adults${children > 0 ? `, ${children} Children` : ''}
• Guest Name: ${guestName || 'Devotee'}
Please share availability and direct booking assistance.`
  );

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
                Hotel Sai Vasudev Residency &bull; Guaranteed Best Rate &bull; {totalNights} {totalNights === 1 ? 'Night' : 'Nights'}
              </p>
            </div>

            {selectedRoom && (
              <div className="modal-room-summary">
                <img 
                  src={selectedRoom.image_url} 
                  alt={selectedRoom.name} 
                  className="modal-room-thumb" 
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/hero.jpg';
                  }}
                />
                <div className="modal-room-info">
                  <h4>{selectedRoom.name}</h4>
                  <p>{selectedRoom.bed_type} &bull; {selectedRoom.room_size} &bull; Standard Capacity: {standardCapacity} Guests</p>
                  <span className="modal-rate">₹{selectedRoom.price_per_night.toLocaleString('en-IN')} / night</span>
                  {availData && (
                    <div style={{ marginTop: 4, fontSize: 12, color: availData.available ? '#2e7d32' : '#c62828', fontWeight: 700 }}>
                      {availData.available ? `✓ ${availData.remaining_rooms_count} Room(s) Available` : `✕ Sold Out for Selected Dates`}
                    </div>
                  )}
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="alert-box error" style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: 8, margin: '12px 0', border: '1px solid #ef9a9a' }}>
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
                    min={todayIST}
                    value={checkIn}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="modal-checkout">Check-out Date ({totalNights} {totalNights === 1 ? 'Night' : 'Nights'})</label>
                  <input
                    id="modal-checkout"
                    type="date"
                    min={addDays(checkIn, 1)}
                    value={checkOut}
                    onChange={(e) => handleCheckOutChange(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="modal-adults">Adults (Min 1)</label>
                  <select
                    id="modal-adults"
                    value={adults}
                    onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))}
                  >
                    <option value={1}>1 Adult</option>
                    <option value={2}>2 Adults (Standard)</option>
                    <option value={3}>3 Adults (+₹500 Extra Bed)</option>
                    <option value={4}>4 Adults (+₹1,000 Extra Bed)</option>
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
                    <option value={1}>1 Child (Complimentary)</option>
                    <option value={2}>2 Children (Complimentary)</option>
                  </select>
                </div>
              </div>

              {extraAdults > 0 && (
                <div style={{ fontSize: '12px', color: '#b45309', background: '#fef3c7', padding: '6px 10px', borderRadius: '6px', marginBottom: '10px' }}>
                  ℹ️ Selected guests ({adults}) exceed standard room capacity ({standardCapacity}). Extra bed charge ₹500/night included in breakdown.
                </div>
              )}

              <div className="form-group">
                <label htmlFor="modal-guest-name">Full Name (Primary Guest)</label>
                <input
                  id="modal-guest-name"
                  type="text"
                  placeholder="e.g. Ramesh Patel"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="modal-guest-phone">
                    Phone / WhatsApp <span style={{ color: '#c62828' }}>*</span>
                  </label>
                  <input
                    id="modal-guest-phone"
                    type="tel"
                    placeholder="9440289999 (10-digit Indian mobile)"
                    value={guestPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                    required
                    style={phoneError ? { borderColor: '#c62828' } : undefined}
                  />
                  {phoneError && (
                    <small style={{ color: '#c62828', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                      {phoneError}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="modal-guest-email">Email Address</label>
                  <input
                    id="modal-guest-email"
                    type="email"
                    placeholder="name@example.com"
                    value={guestEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    required
                    style={emailError ? { borderColor: '#c62828' } : undefined}
                  />
                  {emailError && (
                    <small style={{ color: '#c62828', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                      {emailError}
                    </small>
                  )}
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="modal-id-proof">Govt ID Proof Type</label>
                  <select
                    id="modal-id-proof"
                    value={idProofType}
                    onChange={(e) => setIdProofType(e.target.value)}
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="modal-payment-mode">Payment Option</label>
                  <select
                    id="modal-payment-mode"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Pay at Hotel">Pay at Hotel (Cash / UPI / Card)</option>
                    <option value="UPI QR Code">Instant UPI Transfer / QR</option>
                    <option value="Credit/Debit Card">Online Card Payment</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="modal-special-requests">Special Requests / Darshan Timings (Optional)</label>
                <textarea
                  id="modal-special-requests"
                  rows={2}
                  placeholder="Need ground floor room, early check-in, or VIP darshan pass assistance..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                />
              </div>

              {/* Server-Side Tax & Price Calculation Box */}
              <div className="price-breakdown-card">
                <div className="breakdown-line">
                  <span>Room Base ({totalNights} {totalNights === 1 ? 'night' : 'nights'} × ₹{roomPrice.toLocaleString('en-IN')})</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {extraCharge > 0 && (
                  <div className="breakdown-line">
                    <span>Extra Guest Charge ({extraAdults} guest × ₹500 × {totalNights} nights)</span>
                    <span>₹{extraCharge.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="breakdown-line">
                  <span>Indian Hotel GST ({gstRate === 18 ? 'CGST 9% + SGST 9% = 18%' : 'CGST 6% + SGST 6% = 12%'})</span>
                  <span>₹{taxes.toLocaleString('en-IN')}</span>
                </div>
                <div className="breakdown-divider"></div>
                <div className="breakdown-line total">
                  <span>Total Authoritative Payable</span>
                  <span className="total-gold">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="payment-terms-note">
                  🔒 Verified reservation with atomic inventory lock. Free cancellation up to 24h prior to arrival.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  id="submit-booking-reservation-btn"
                  type="submit"
                  className="btn btn-primary modal-submit-btn"
                  disabled={submitting || checkingAvail || (availData?.available === false)}
                  style={{ flex: 1 }}
                >
                  {submitting ? (
                    <span>Confirming Reservation...</span>
                  ) : checkingAvail ? (
                    <span>Verifying Room Inventory...</span>
                  ) : availData?.available === false ? (
                    <span>Room Category Sold Out</span>
                  ) : (
                    <span>Confirm Reservation (₹{grandTotal.toLocaleString('en-IN')})</span>
                  )}
                </button>

                <a
                  href={`https://wa.me/919440289999?text=${whatsappQueryText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-gold"
                  title="Direct WhatsApp Reservation Inquiry"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', minHeight: '44px' }}
                >
                  💬 WhatsApp
                </a>
              </div>
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
                <span className="status-pill confirmed">● {bookingResult.status}</span>
              </div>

              <div className="ticket-details-grid">
                <div>
                  <span className="ticket-label">GUEST NAME</span>
                  <strong>{bookingResult.guest_name}</strong>
                </div>
                <div>
                  <span className="ticket-label">INVOICE NUMBER</span>
                  <strong>{bookingResult.invoice_number || `INV-${bookingResult.booking_ref}`}</strong>
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
                  <span className="ticket-label">TOTAL STAY</span>
                  <strong>{totalNights} {totalNights === 1 ? 'Night' : 'Nights'}</strong>
                </div>
                <div>
                  <span className="ticket-label">PAYMENT MODE</span>
                  <strong>{bookingResult.payment_method} ({bookingResult.payment_status || 'Pending'})</strong>
                </div>
                <div>
                  <span className="ticket-label">TOTAL AUTHORIZED BILL</span>
                  <strong className="total-gold" style={{ fontSize: 18 }}>₹{bookingResult.total_price.toLocaleString('en-IN')} (incl. GST)</strong>
                </div>
              </div>

              <div className="ticket-footer-note">
                📍 <strong>Hotel Sai Vasudev Residency</strong> &bull; Near Temple Main Gate No. 2, Shirdi
                <br />
                A confirmation SMS &amp; Email has been dispatched to {bookingResult.guest_phone}.
              </div>
            </div>

            <div className="success-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <a
                href={hotelApi.getPrintSlipUrl(bookingResult.booking_ref)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ background: '#8B1E28', color: '#fff' }}
              >
                <span>🖨️ View &amp; Print Official Voucher</span>
              </a>
              <a
                href={`https://wa.me/919440289999?text=${encodeURIComponent(`Namaste Hotel Sai Vasudev Residency, my booking reference is ${bookingResult.booking_ref} for ${bookingResult.guest_name}. Please confirm my check-in details.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-gold"
              >
                <span>💬 WhatsApp Front Desk</span>
              </a>
              <button className="btn btn-outline" onClick={handleResetAndClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
