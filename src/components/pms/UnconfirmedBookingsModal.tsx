import React, { useState } from 'react';
import type { PmsBooking } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';

interface UnconfirmedBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCalendar: () => void;
}

export const UnconfirmedBookingsModal: React.FC<UnconfirmedBookingsModalProps> = ({
  isOpen,
  onClose,
  onOpenCalendar
}) => {
  // Sample initial unconfirmed online requests as demonstrated in Video 02 [15:00]
  const [unconfirmedList, setUnconfirmedList] = useState<PmsBooking[]>([
    {
      bookingNo: 'RM/64/24-25',
      bookingDate: '2025-06-06',
      bookingTime: '12:05 AM',
      checkInDate: '2025-06-20',
      checkInTime: '12:05 PM',
      checkOutDate: '2025-06-24',
      checkOutTime: '10:05 AM',
      numberOfDays: 4,
      numberOfGuests: 2,
      businessSource: 'Online',
      package: 'WITH BREAKFAST || 0',
      guestName: 'hariom gautam ji',
      mobile: '76675763433',
      city: 'jabalpur',
      state: 'm.p.',
      country: 'India',
      documentName: 'Aadhaar Card',
      documentNo: '544654651234',
      rooms: [{ roomNo: '103', roomType: 'DELUXE', tariff: 2000 }],
      totalAmount: 8000,
      bookingAmount: 2000,
      paymentMode: 'UPI',
      paymentReferenceNo: 'UPI/ONLINE/987123',
      paymentRemark: 'Advance by Hariom Gautam',
      status: 'Unconfirmed',
      createdAt: new Date().toISOString()
    }
  ]);

  const [whatsappSentMessage, setWhatsappSentMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmBooking = (booking: PmsBooking) => {
    // 1. Save to confirmed store
    const confirmed: PmsBooking = {
      ...booking,
      status: 'Confirmed'
    };
    PmsStore.saveBooking(confirmed);

    // 2. Remove from unconfirmed list
    setUnconfirmedList(unconfirmedList.filter(b => b.bookingNo !== booking.bookingNo));

    // 3. Automated WhatsApp message demonstrated in Video 02 [17:15]
    const msg = `Dear ${booking.guestName}, Thanks for payment of Rs. ${booking.bookingAmount} for room booking. Your room booking ${booking.bookingNo} (Room ${booking.rooms[0]?.roomNo}) is CONFIRMED from ${booking.checkInDate} to ${booking.checkOutDate} at HOTEL SAI VASUDEV RESIDENCY, Shirdi. Looking forward to welcoming you!`;
    setWhatsappSentMessage(msg);
  };

  const handleReject = (bookingNo: string) => {
    if (confirm('Are you sure you want to decline this reservation request?')) {
      setUnconfirmedList(unconfirmedList.filter(b => b.bookingNo !== bookingNo));
    }
  };

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div className="pms-form-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 960 }}>
        {/* Banner from Video 02 Spoken [15:00] */}
        <div className="pms-form-banner banner-cyan">
          Online Unconfirmed Bookings (Entry &gt; Room &gt; Unconfirmed Booking)
        </div>

        <div className="pms-form-body">
          {whatsappSentMessage && (
            <div style={{
              background: '#dcfce7',
              border: '1px solid #86efac',
              padding: '10px 14px',
              borderRadius: 4,
              marginBottom: 14,
              fontSize: 12,
              color: '#166534'
            }}>
              <strong>💬 Automated WhatsApp Confirmation Sent!</strong>
              <div style={{ marginTop: 4, fontStyle: 'italic' }}>"{whatsappSentMessage}"</div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
              Pending Online Requests ({unconfirmedList.length})
            </div>
            <button
              type="button"
              onClick={onOpenCalendar}
              style={{
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              📅 Check Room Availability in Calendar
            </button>
          </div>

          <table className="pms-table-compact">
            <thead>
              <tr>
                <th>Booking No</th>
                <th>Guest Name</th>
                <th>Contact</th>
                <th>Requested Dates</th>
                <th>Room &amp; Type</th>
                <th>Advance (₹)</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {unconfirmedList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
                    No unconfirmed online reservations pending at this moment.
                  </td>
                </tr>
              ) : (
                unconfirmedList.map(b => (
                  <tr key={b.bookingNo}>
                    <td style={{ fontWeight: 800, color: '#0369a1' }}>{b.bookingNo}</td>
                    <td style={{ fontWeight: 700 }}>{b.guestName}</td>
                    <td>{b.mobile}</td>
                    <td>{b.checkInDate} to {b.checkOutDate} ({b.numberOfDays} days)</td>
                    <td>Room {b.rooms[0]?.roomNo} ({b.rooms[0]?.roomType})</td>
                    <td style={{ fontWeight: 800, color: '#16a34a' }}>₹{b.bookingAmount} ({b.paymentMode})</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleConfirmBooking(b)}
                          style={{
                            background: '#16a34a',
                            color: '#fff',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: 3,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Confirm & Block Room on Calendar"
                        >
                          ✅ Confirm &amp; Block
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(b.bookingNo)}
                          style={{
                            background: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: 3,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Decline Request"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="pms-btn-group">
            <button type="button" onClick={onClose} className="btn-pms-cancel">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
