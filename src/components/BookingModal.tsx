import React, { useState, useMemo, useEffect } from 'react';
import type { Room, BookingResponse, AvailabilityCheckResponse } from '../types';
import { hotelApi } from '../services/api';
import { PmsStore } from '../services/pmsStore';
import { getTodayIST, addDays, calculateNights, validateIndianPhone, validateEmail } from '../utils/validation';
import { useSafeAsyncRequest } from '../hooks/useSafeAsyncRequest';

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
  const [idProofNumber, setIdProofNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [advanceDeposit, setAdvanceDeposit] = useState<number>(0);
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

  const { runSafeAsync } = useSafeAsyncRequest();

  // Check real-time server inventory with AbortController and incrementing requestId guard
  useEffect(() => {
    if (!selectedRoom || !checkIn || !checkOut) return;
    setCheckingAvail(true);
    setErrorMsg(null);

    runSafeAsync(
      async ({ signal }) => {
        return await hotelApi.checkRoomAvailability(selectedRoom.id, checkIn, checkOut, adults, { signal });
      },
      (res) => {
        setAvailData(res);
        if (!res.available) {
          setErrorMsg(res.message);
        }
        setCheckingAvail(false);
      },
      (err) => {
        console.warn('Could not verify availability live:', err);
        setCheckingAvail(false);
      }
    );
  }, [selectedRoom, checkIn, checkOut, adults, runSafeAsync]);

  // PRD Business Rule: All listed room tariffs (₹1,500 to ₹3,000) are Inclusive of GST (12% slab for SAC 996311)
  // Pre-GST taxable base is extracted via gross / 1.12 for GSTR-1 reporting rather than adding tax on top.
  const roomPrice = selectedRoom?.price_per_night || 2000;
  const standardCapacity = selectedRoom?.capacity || 2;
  const extraAdults = Math.max(0, adults - standardCapacity);
  const grandTotal = availData?.grand_total ?? (roomPrice * totalNights);
  const taxableAmount = availData?.taxable_amount ?? (Math.round((grandTotal / 1.12) * 100) / 100);
  const taxes = availData?.total_tax ?? (Math.round((grandTotal - taxableAmount) * 100) / 100);
  const netDue = Math.max(0, grandTotal - advanceDeposit);

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
        id_proof_number: idProofNumber.trim() || undefined,
        vehicle_number: vehicleNumber.trim() || undefined,
        company_name: companyName.trim() || undefined,
        gstin: gstin.trim() || undefined,
        advance_paid: advanceDeposit > 0 ? advanceDeposit : undefined,
        check_in_date: checkIn,
        check_out_date: checkOut,
        adults,
        children,
        total_nights: totalNights,
        payment_method: paymentMethod,
        special_requests: specialRequests
      });

      // Synchronize Public Online Booking directly into Front Desk PMS Engine
      try {
        const refNo = response.booking_ref || `WEB-${Date.now().toString().slice(-6)}`;
        const assignedRoomNo = selectedRoom.name.replace(/\D/g, '') || String(100 + selectedRoom.id);
        const mappedMode: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Online' = 
          paymentMethod.toLowerCase().includes('cash') ? 'Cash' :
          paymentMethod.toLowerCase().includes('upi') ? 'UPI' :
          paymentMethod.toLowerCase().includes('card') ? 'Card' : 'Online';

        const pmsBooking: import('../types/pmsModels').PmsBooking = {
          bookingNo: refNo,
          voucherNo: refNo.replace(/\D/g, '').slice(-4) || '101',
          bookingDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
          bookingTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          numberOfDays: totalNights,
          numberOfGuests: adults + children,
          businessSource: 'Online',
          package: 'ROOM ONLY || 0',
          checkInDate: checkIn,
          checkInTime: '11:00 AM',
          checkOutDate: checkOut,
          checkOutTime: '10:00 AM',
          guestName: guestName.trim(),
          mobile: phoneVal.sanitized,
          email: guestEmail.trim(),
          companyName: companyName.trim(),
          gstNo: gstin.trim(),
          totalAmount: grandTotal,
          bookingAmount: advanceDeposit,
          paymentMode: mappedMode,
          status: advanceDeposit > 0 ? 'Confirmed' : 'Unconfirmed',
          rooms: [
            {
              roomNo: assignedRoomNo,
              roomType: selectedRoom.room_type || selectedRoom.name,
              tariff: selectedRoom.price_per_night
            }
          ],
          specialRequests,
          createdAt: new Date().toISOString()
        };
        PmsStore.saveBooking(pmsBooking);

        if (advanceDeposit > 0) {
          PmsStore.saveAdvanceReceipt({
            receiptNo: `AR-WEB-${Date.now().toString().slice(-4)}`,
            voucherNo: `${Date.now().toString().slice(-4)}`,
            date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            voucherName: 'Advance_Receipt',
            roomNo: assignedRoomNo,
            guestName: guestName.trim(),
            mobile: phoneVal.sanitized,
            amount: advanceDeposit,
            paymentMode: mappedMode,
            remark: `Online Website Booking Advance Deposit (Ref: ${refNo})`
          });
        }
      } catch (pmsSyncErr) {
        console.warn('[BookingModal] Note: Local PMS booking queue sync:', pmsSyncErr);
      }

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
    `Namaste SRI SAI VASUDEV RESIDENCY! I would like to inquire about booking:
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
                SRI SAI VASUDEV RESIDENCY &bull; Guaranteed Best Rate &bull; {totalNights} {totalNights === 1 ? 'Night' : 'Nights'}
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
                    <option value="Aadhaar Card">Aadhaar Card (UIDAI)</option>
                    <option value="Passport">Passport (Indian / International)</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID Card</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="modal-id-number">ID Proof Number</label>
                  <input
                    id="modal-id-number"
                    type="text"
                    placeholder="e.g. 7654 8923 1234"
                    value={idProofNumber}
                    onChange={(e) => setIdProofNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="modal-vehicle">Vehicle Number (Free Parking Log)</label>
                  <input
                    id="modal-vehicle"
                    type="text"
                    placeholder="e.g. MH 17 AB 1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="modal-advance">Advance Deposit Amount (₹)</label>
                  <input
                    id="modal-advance"
                    type="number"
                    min="0"
                    placeholder="e.g. 1000"
                    value={advanceDeposit || ''}
                    onChange={(e) => setAdvanceDeposit(Math.max(0, Number(e.target.value)))}
                  />
                </div>
              </div>

              {/* B2B GST Fields (Optional) */}
              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="modal-company">Company / Firm Name (Optional)</label>
                  <input
                    id="modal-company"
                    type="text"
                    placeholder="For corporate GST invoice"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="modal-gstin">15-Digit GSTIN (Optional)</label>
                  <input
                    id="modal-gstin"
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="form-row-2">
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
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="modal-darshan-slot">Pilgrim Darshan Time Slot</label>
                  <select
                    id="modal-darshan-slot"
                    onChange={(e) => {
                      if (e.target.value) {
                        setSpecialRequests(prev => prev ? `${prev} | Darshan Slot: ${e.target.value}` : `Darshan Slot: ${e.target.value}`);
                      }
                    }}
                  >
                    <option value="">Select Darshan Timing (Optional)</option>
                    <option value="Kakad Aarti (4:30 AM)">Kakad Aarti (4:30 AM)</option>
                    <option value="Madhyan Aarti (12:00 PM)">Madhyan Aarti (12:00 PM)</option>
                    <option value="Dhoop Aarti (Sunset 6:30 PM)">Dhoop Aarti (Sunset 6:30 PM)</option>
                    <option value="Shej Aarti (10:30 PM)">Shej Aarti (10:30 PM)</option>
                    <option value="Regular Darshan (General Queue)">Regular Darshan (General Queue)</option>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ✓ Inclusive of GST (12%)
                  </span>
                  <span style={{ fontSize: '10px', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    SAC 996311
                  </span>
                </div>
                <div className="breakdown-line">
                  <span>Room Tariff ({totalNights} {totalNights === 1 ? 'night' : 'nights'} × ₹{roomPrice.toLocaleString('en-IN')})</span>
                  <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="breakdown-line" style={{ color: '#64748b', fontSize: '12px' }}>
                  <span>&emsp;↳ Pre-GST Taxable Base (GSTR-1)</span>
                  <span>₹{taxableAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="breakdown-line" style={{ color: '#64748b', fontSize: '12px' }}>
                  <span>&emsp;↳ GST 12% (CGST 6% + SGST 6% Included)</span>
                  <span>₹{taxes.toLocaleString('en-IN')}</span>
                </div>
                <div className="breakdown-divider"></div>
                <div className="breakdown-line total">
                  <span>Total Authoritative Payable (Incl. of GST)</span>
                  <span className="total-gold">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
                {advanceDeposit > 0 && (
                  <>
                    <div className="breakdown-line" style={{ color: '#16a34a' }}>
                      <span>Advance Deposit Paid Now</span>
                      <span>-₹{advanceDeposit.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="breakdown-line" style={{ fontWeight: 800 }}>
                      <span>Net Balance Due at Check-In</span>
                      <span style={{ color: '#dc2626' }}>₹{netDue.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
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
              Thank you for choosing SRI SAI VASUDEV RESIDENCY. Your reservation is secured.
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
                📍 <strong>Sri Sai Vasudev Residency</strong> &bull; SR Residency, Near Andhra Bank, New Colony, Rayagada, Odisha - 765001
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
                href={`https://wa.me/919440289999?text=${encodeURIComponent(`Namaste Sri Sai Vasudev Residency, my booking reference is ${bookingResult.booking_ref} for ${bookingResult.guest_name}. Please confirm my check-in details.`)}`}
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
