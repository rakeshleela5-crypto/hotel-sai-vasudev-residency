import React from 'react';
import type { PmsBooking } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';

interface BookingReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: PmsBooking | null;
}

export const BookingReceiptModal: React.FC<BookingReceiptModalProps> = ({
  isOpen,
  onClose,
  booking
}) => {
  if (!isOpen || !booking) return null;

  const company = PmsStore.getCompanyInfo();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div 
        className="pms-form-box" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 880, border: '2px solid #212529', padding: 0 }}
      >
        <div id="printable-booking-voucher">
          {/* Top Yellow Banner with GST & Room Booking Slip Title from Frame 0220 */}
          <div style={{
            background: '#fef08a',
            borderBottom: '2px solid #ca8a04',
            padding: '8px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            fontWeight: 800,
            color: '#854d0e'
          }}>
            <span>GST NO: {company.gstNo || '21AEKPP8689J1ZS'}</span>
            <span style={{ fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Room Booking Slip</span>
            <span>PAN: {company.pencardNo || 'AEKPP8689J'}</span>
          </div>

          {/* Hotel Information & Dual QR Codes matching Frame 0220 */}
          <div style={{
            background: '#facc15',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #eab308'
          }}>
            {/* Left QR Code */}
            <div style={{
              width: 58,
              height: 58,
              border: '2px dashed #854d0e',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 8,
              fontWeight: 800,
              color: '#854d0e'
            }}>
              <span style={{ fontSize: 20 }}>📱</span>
              <span>PAY/VERIFY</span>
            </div>

            {/* Hotel Center Title */}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1c1917', letterSpacing: 1 }}>
                {company.firmName || 'SRI SAI VASUDEV RESIDENCY'}
              </h2>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#44403c', marginTop: 3 }}>
                {[company.address1, company.address2, company.city, company.state, company.pincode].filter(Boolean).join(', ') || 'SR RESIDENCY, NEAR ANDHRA BANK, NEW COLONY, Rayagada, Odisha - 765001'}
              </div>
              <div style={{ fontSize: 11, color: '#44403c', marginTop: 2 }}>
                Email: {company.email || 'reservations@hotelsai-vasudev.com'} &bull; Phone: {company.phone || '+91 94402 89999'} &bull; Mobile: {company.mobile || company.phone || '+91 94402 89999'}
              </div>
            </div>

            {/* Right QR Code (Frame 0220) */}
            <div style={{
              width: 58,
              height: 58,
              border: '2px dashed #854d0e',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 8,
              fontWeight: 800,
              color: '#854d0e'
            }}>
              <span style={{ fontSize: 20 }}>🏨</span>
              <span>GUEST QR</span>
            </div>
          </div>

          <div style={{ padding: 16 }}>
            {/* Guest & Booking Detail 2-Column Boxes (Frame 0220) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {/* Mint Green Guest Detail Card */}
              <div style={{
                background: '#a7f3d0',
                border: '1px solid #6ee7b7',
                borderRadius: 4,
                padding: '10px 14px',
                fontSize: 12,
                color: '#064e3b',
                lineHeight: 1.65
              }}>
                <div style={{ fontWeight: 800, fontSize: 13, borderBottom: '1px solid #6ee7b7', paddingBottom: 4, marginBottom: 6 }}>
                  Guest Detail
                </div>
                <div><strong>Guest Name:</strong> {booking.guestName}</div>
                <div><strong>Add:</strong> {booking.addressLine1 || 'Main Temple Road'}</div>
                <div><strong>City:</strong> {booking.city || 'Rayagada'}</div>
                <div><strong>State:</strong> {booking.state || 'Odisha'}</div>
                <div><strong>Mob:</strong> {booking.mobile}</div>
                <div><strong>Email:</strong> {booking.email || 'N/A'}</div>
                {booking.documentNo && (
                  <div><strong>ID Document:</strong> {booking.documentName} - {booking.documentNo}</div>
                )}
              </div>

              {/* Gold/Yellow Booking Detail Card (Frame 0220) */}
              <div style={{
                background: '#fef08a',
                border: '1px solid #fde047',
                borderRadius: 4,
                padding: '10px 14px',
                fontSize: 12,
                color: '#713f12',
                lineHeight: 1.65
              }}>
                <div style={{ fontWeight: 800, fontSize: 13, borderBottom: '1px solid #fde047', paddingBottom: 4, marginBottom: 6 }}>
                  Booking Detail
                </div>
                <div><strong>Booking No:</strong> <span style={{ color: '#0369a1', fontWeight: 800 }}>{booking.bookingNo}</span></div>
                <div><strong>Booking Date:</strong> {booking.bookingDate} {booking.bookingTime}</div>
                <div><strong>Aspected Check In Date:</strong> {booking.checkInDate} ({booking.checkInTime})</div>
                <div><strong>Aspected Check Out Date:</strong> {booking.checkOutDate} ({booking.checkOutTime})</div>
                <div><strong>Total Day:</strong> {booking.numberOfDays}</div>
                <div><strong>Package:</strong> {booking.package}</div>
              </div>
            </div>

            {/* Room Tariff Table (Frame 0220) */}
            <table className="pms-table-compact" style={{ marginBottom: 12 }}>
              <thead>
                <tr>
                  <th>Room No</th>
                  <th>Total Rooms</th>
                  <th>Room Type</th>
                  <th>No of Guest</th>
                  <th>Commited Days</th>
                  <th>Tariff (₹)</th>
                </tr>
              </thead>
              <tbody>
                {booking.rooms.map((rm, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 800, color: '#1e40af' }}>{rm.roomNo}</td>
                    <td>1</td>
                    <td>{rm.roomType}</td>
                    <td>{booking.numberOfGuests}</td>
                    <td>{booking.numberOfDays}</td>
                    <td style={{ fontWeight: 700 }}>₹{rm.tariff.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Summary Table (Frame 0220) */}
            <table className="pms-table-compact" style={{ marginBottom: 14 }}>
              <thead>
                <tr>
                  <th>Total Amount</th>
                  <th>Booking Amount (Advance Paid)</th>
                  <th>Pending Balance</th>
                  <th>Payment Mode & Ref</th>
                  <th>Business Source / Agent</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 800, fontSize: 14 }}>₹{booking.totalAmount.toFixed(2)}</td>
                  <td style={{ fontWeight: 800, fontSize: 14, color: '#16a34a' }}>₹{booking.bookingAmount.toFixed(2)}</td>
                  <td style={{ fontWeight: 800, fontSize: 14, color: '#dc2626' }}>
                    ₹{Math.max(0, booking.totalAmount - booking.bookingAmount).toFixed(2)}
                  </td>
                  <td>
                    {booking.paymentMode} {booking.paymentReferenceNo ? `(${booking.paymentReferenceNo})` : ''}
                    {booking.paymentRemark ? ` - ${booking.paymentRemark}` : ''}
                  </td>
                  <td>{booking.businessSource} {booking.agent ? `(${booking.agent})` : ''}</td>
                </tr>
              </tbody>
            </table>

            {/* Terms and Conditions & Signature (Frame 0220) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.8fr 1.2fr',
              gap: 14,
              borderTop: '1px solid #cbd5e1',
              paddingTop: 12,
              fontSize: 11,
              color: '#475569'
            }}>
              <div>
                <strong style={{ color: '#1e293b' }}>Terms & Conditions:</strong>
                <ol style={{ paddingLeft: 16, marginTop: 4, lineHeight: 1.5 }}>
                  <li>1. Extra person charge - Rs. 40% ON triff per parson.</li>
                  <li>2. Check out time is 12:00 Noon standard.</li>
                  <li>3. Government Photo ID proof (Aadhaar/Passport/DL) mandatory for all guests.</li>
                  <li>4. This is an advance reservation confirmation slip.</li>
                </ol>
              </div>

              <div style={{
                textAlign: 'right',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div><strong>For SRI SAI VASUDEV RESIDENCY</strong></div>
                <div style={{ marginTop: 40, borderTop: '1px solid #94a3b8', paddingTop: 4 }}>
                  Authorized Signatory / Front Office Manager
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pms-btn-group" style={{ padding: '12px 16px', background: '#f8fafc' }}>
          <button type="button" onClick={onClose} className="btn-pms-cancel">
            Close
          </button>
          <button type="button" onClick={handlePrint} className="btn-pms-print">
            🖨️ Print Booking Slip
          </button>
          <button
            type="button"
            onClick={() => {
              if (booking.mobile) {
                PmsStore.sendWhatsAppNotification({
                  voucherType: 'Room_booking_store',
                  recipientMobile: booking.mobile,
                  recipientName: booking.guestName,
                  voucherNo: booking.bookingNo,
                  roomNo: booking.rooms?.map(r => r.roomNo).join(', ') || booking.assignedRoomType || 'Room',
                  templateParams: {
                    checkin_date: booking.checkInDate,
                    checkout_date: booking.checkOutDate,
                    total_billamount: booking.bookingAmount.toString(),
                    advance_paid: booking.bookingAmount.toString(),
                    balance_due: Math.max(0, booking.totalAmount - booking.bookingAmount).toString()
                  },
                  openDirectly: true
                });
              } else {
                alert('No guest mobile number found on this booking');
              }
            }}
            style={{
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Open booking confirmation voucher directly in WhatsApp Web via wa.me (Option 1: 100% Free)"
          >
            💬 WhatsApp Voucher (wa.me)
          </button>
        </div>
      </div>
    </div>
  );
};
