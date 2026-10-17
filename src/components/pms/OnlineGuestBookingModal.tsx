import React, { useState } from 'react';
import type { PmsBooking, PmsRoom } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import { BookingReceiptModal } from './BookingReceiptModal';

interface OnlineGuestBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoom?: PmsRoom | null;
}

export const OnlineGuestBookingModal: React.FC<OnlineGuestBookingModalProps> = ({
  isOpen,
  onClose,
  initialRoom
}) => {
  const rooms = PmsStore.getRooms();
  const availableRooms = rooms.filter(r => r.status === 'vacant');

  const defaultBookingNo = `RM/${Math.floor(60 + Math.random() * 40)}/24-25`;
  const todayStr = new Date().toISOString().split('T')[0];

  const [bookingNo] = useState(defaultBookingNo);
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(todayStr);
  const [noOfDays, setNoOfDays] = useState(1);
  const [noOfGuests, setNoOfGuests] = useState(2);
  const [selectedPackage, setSelectedPackage] = useState<PmsBooking['package']>('WITH BREAKFAST || 0');
  const [selectedRoomNo, setSelectedRoomNo] = useState<string>(
    initialRoom?.roomNo || availableRooms[0]?.roomNo || '102'
  );

  // Guest Details
  const [guestName, setGuestName] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [email, setEmail] = useState('');
  const [documentName, setDocumentName] = useState<'Aadhaar Card' | 'Passport' | 'Driving License' | 'Voter ID' | 'Other'>('Aadhaar Card');
  const [documentNo, setDocumentNo] = useState('');
  const [paymentMode, setPaymentMode] = useState<PmsBooking['paymentMode']>('UPI');
  const [advanceAmount, setAdvanceAmount] = useState<number>(1000);

  // Completed Voucher State
  const [confirmedBooking, setConfirmedBooking] = useState<PmsBooking | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  if (!isOpen) return null;

  const targetRoom = rooms.find(r => r.roomNo === selectedRoomNo) || rooms[0];
  const totalAmount = (targetRoom ? targetRoom.tariff : 2000) * noOfDays;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !mobile.trim()) {
      alert('Please enter your Name and Mobile Number.');
      return;
    }

    const booking: PmsBooking = {
      bookingNo,
      bookingDate: todayStr,
      bookingTime: '12:05 AM',
      checkInDate,
      checkInTime: '12:05 PM',
      checkOutDate,
      checkOutTime: '10:05 AM',
      numberOfDays: noOfDays,
      numberOfGuests: noOfGuests,
      businessSource: 'Online',
      package: selectedPackage,
      guestName,
      mobile,
      email,
      city: city || 'Shirdi',
      state: state || 'Maharashtra',
      country: 'India',
      documentName,
      documentNo,
      rooms: [
        {
          roomNo: targetRoom.roomNo,
          roomType: targetRoom.roomType,
          tariff: targetRoom.tariff
        }
      ],
      totalAmount,
      bookingAmount: advanceAmount,
      paymentMode,
      paymentReferenceNo: `ONLINE/UPI/${Date.now().toString().slice(-6)}`,
      paymentRemark: 'Online Web Booking',
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };

    PmsStore.saveBooking(booking);
    setConfirmedBooking(booking);
    setIsReceiptOpen(true);
  };

  return (
    <>
      <div className="pms-submodal-overlay" onClick={onClose}>
        <div className="pms-form-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 840 }}>
          {/* Exact Top Green Header from Video 02 Frame 0180 */}
          <div className="pms-form-banner">
            New Room Booking Entery (Guest Online Direct)
          </div>

          <form onSubmit={handleBookingSubmit} className="pms-form-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
              {/* Left Column */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> Room Booking No</label>
                    <input type="text" readOnly value={bookingNo} className="form-input-pms" style={{ background: '#f1f5f9', fontWeight: 700 }} />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> Package</label>
                    <select value={selectedPackage} onChange={e => setSelectedPackage(e.target.value as any)} className="form-select-pms" style={{ fontWeight: 700 }}>
                      <option value="WITH BREAKFAST || 0">WITH BREAKFAST || 0</option>
                      <option value="ROOM ONLY || 0">ROOM ONLY || 0</option>
                      <option value="MAP">MAP (Breakfast + Dinner)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> Check In Date</label>
                    <input type="date" value={checkInDate} onChange={e => setCheckInDate(e.target.value)} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> Check Out Date</label>
                    <input type="date" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} className="form-input-pms" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms">No Of Days</label>
                    <input type="number" min="1" value={noOfDays} onChange={e => setNoOfDays(Number(e.target.value))} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">No Of Guest</label>
                    <input type="number" min="1" value={noOfGuests} onChange={e => setNoOfGuests(Number(e.target.value))} className="form-input-pms" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> Guest Full Name</label>
                    <input type="text" placeholder="e.g. Hariom Gautam" value={guestName} onChange={e => setGuestName(e.target.value)} className="form-input-pms" required />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> Mobile Number</label>
                    <input type="tel" placeholder="10-digit number" value={mobile} onChange={e => setMobile(e.target.value)} className="form-input-pms" required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms">City</label>
                    <input type="text" placeholder="e.g. Jabalpur / Mumbai" value={city} onChange={e => setCity(e.target.value)} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">State</label>
                    <input type="text" placeholder="e.g. M.P. / Maharashtra" value={state} onChange={e => setState(e.target.value)} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Email</label>
                    <input type="email" placeholder="guest@email.com" value={email} onChange={e => setEmail(e.target.value)} className="form-input-pms" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms">ID Proof Type</label>
                    <select value={documentName} onChange={e => setDocumentName(e.target.value as any)} className="form-select-pms">
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                    </select>
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Document / ID No</label>
                    <input type="text" placeholder="e.g. 544654651234" value={documentNo} onChange={e => setDocumentNo(e.target.value)} className="form-input-pms" />
                  </div>
                </div>
              </div>

              {/* Right Column: Room Selector & Payment Box */}
              <div>
                <div className="form-group-pms">
                  <label className="form-label-pms"><span className="req">*</span> Select Room</label>
                  <select
                    value={selectedRoomNo}
                    onChange={e => setSelectedRoomNo(e.target.value)}
                    className="form-select-pms"
                    style={{ fontWeight: 700 }}
                  >
                    {availableRooms.map(r => (
                      <option key={r.id} value={r.roomNo}>
                        Room {r.roomNo} - {r.roomType} (₹{r.tariff}/night)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Detail Box (Frame 0180) */}
                <div style={{ border: '2px solid #84cc16', borderRadius: 4, padding: 12, background: '#f8fafc', marginTop: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#15803d', marginBottom: 8, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>
                    Payment Detail
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Per Day Room Tariff</span>
                    <input type="text" readOnly value={`₹${targetRoom?.tariff || 2000}`} className="form-input-pms" style={{ width: 100, textAlign: 'right', background: '#f1f5f9', fontWeight: 700 }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Total Room Rent</span>
                    <input type="text" readOnly value={`₹${totalAmount}`} className="form-input-pms" style={{ width: 100, textAlign: 'right', background: '#dcfce7', fontWeight: 800, color: '#15803d' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1e40af' }}>Advance Deposit (₹)</span>
                    <input
                      type="number"
                      min="500"
                      value={advanceAmount}
                      onChange={e => setAdvanceAmount(Number(e.target.value))}
                      className="form-input-pms"
                      style={{ width: 100, textAlign: 'right', fontWeight: 800 }}
                    />
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <label className="form-label-pms">Payment Mode</label>
                    <select value={paymentMode} onChange={e => setPaymentMode(e.target.value as any)} className="form-select-pms" style={{ fontWeight: 700 }}>
                      <option value="UPI">UPI / Google Pay / PhonePe</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="Cash">Pay at Hotel (Cash on Check-in)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="pms-btn-group">
              <button type="button" onClick={onClose} className="btn-pms-cancel">
                Cancel
              </button>
              <button type="submit" className="btn-pms-save">
                Confirm & Generate Booking Slip
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Slip */}
      <BookingReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          onClose();
        }}
        booking={confirmedBooking}
      />
    </>
  );
};
