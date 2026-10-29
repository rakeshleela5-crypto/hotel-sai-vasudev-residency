import React from 'react';
import type { PmsCheckIn } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';

interface CheckInSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkIn: PmsCheckIn | null;
}

export const CheckInSlipModal: React.FC<CheckInSlipModalProps> = ({
  isOpen,
  onClose,
  checkIn
}) => {
  if (!isOpen || !checkIn) return null;

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
        <div id="printable-checkin-slip">
          {/* Top Yellow Bar matching Frame 0340 */}
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
            <span style={{ fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Room Check Inn Slip</span>
            <span>POLICE VERIFIED &bull; RAYAGADA</span>
          </div>

          {/* Hotel Header with Single QR Code matching Frame 0340 */}
          <div style={{
            background: '#facc15',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #eab308'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#1c1917', letterSpacing: 1 }}>
                {company.firmName || 'HOTEL SAI VASUDEV RESIDENCY'}
              </h2>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#44403c', marginTop: 3 }}>
                {[company.address1, company.address2, company.city, company.state, company.pincode].filter(Boolean).join(', ') || 'Opp. Gate No. 2, Pimpalwadi Road, Shirdi, Maharashtra - 423109'}
              </div>
              <div style={{ fontSize: 11, color: '#44403c', marginTop: 2 }}>
                Email: {company.email || 'info@saivasudevresidency.com'} &bull; Phone: {company.phone || '02423-255555'} &bull; Mobile: {company.mobile || company.phone || '+91 98765 43210'}
              </div>
            </div>

            {/* QR Code on Right */}
            <div style={{
              width: 60,
              height: 60,
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
              <span style={{ fontSize: 22 }}>📱</span>
              <span>VERIFY GRC</span>
            </div>
          </div>

          <div style={{ padding: 16 }}>
            {/* Guest Detail & Check In Detail Cards (Frame 0340) */}
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
                <div><strong>Guest Name:</strong> {checkIn.guestName}</div>
                <div><strong>Add:</strong> {checkIn.addressLine1 || 'Main Road'}</div>
                <div><strong>city:</strong> {checkIn.city || 'Renukot'}</div>
                <div><strong>State:</strong> {checkIn.state || 'M.P.'}</div>
                <div><strong>Mob:</strong> {checkIn.mobile}</div>
                <div><strong>Email:</strong> {checkIn.email || 'N/A'}</div>
                {checkIn.documentNo && (
                  <div><strong>ID Proof:</strong> {checkIn.documentName || 'Aadhaar'} - {checkIn.documentNo}</div>
                )}
                {checkIn.secondGuestName && (
                  <div style={{ marginTop: 4, borderTop: '1px dashed #6ee7b7', paddingTop: 2 }}>
                    <strong>Co-Guest 2:</strong> {checkIn.secondGuestName} ({checkIn.secondGuestIdName} {checkIn.secondGuestIdNo})
                  </div>
                )}
              </div>

              {/* Gold/Yellow Check In Detail Card (Frame 0340) */}
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
                  Check In Detail
                </div>
                <div><strong>Checkin No :</strong> <span style={{ color: '#0369a1', fontWeight: 800 }}>{checkIn.checkInNo}</span></div>
                <div><strong>Check In Date:</strong> {checkIn.checkInDate}</div>
                <div><strong>Check In Time:</strong> {checkIn.checkInTime}</div>
                <div><strong>Commited Days :</strong> {checkIn.numberOfDays}</div>
                <div><strong>Total Guest :</strong> {checkIn.numberOfGuests}</div>
                <div><strong>Business Source :</strong> {checkIn.businessSource}</div>
              </div>
            </div>

            {/* Police & Tourism Compliance Room Table (Frame 0340) */}
            <table className="pms-table-compact" style={{ marginBottom: 12 }}>
              <thead>
                <tr>
                  <th>Room No</th>
                  <th>No of Guest</th>
                  <th>Commited Days</th>
                  <th>Room Tariff Per Day</th>
                  <th>Purpose Of Visit</th>
                  <th>Comming From</th>
                  <th>Going To</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 800, color: '#1e40af' }}>{checkIn.roomNo}</td>
                  <td>{checkIn.numberOfGuests}</td>
                  <td>{checkIn.numberOfDays}</td>
                  <td style={{ fontWeight: 800 }}>₹{checkIn.tariffPerDay.toFixed(2)}</td>
                  <td>{checkIn.purposeOfVisit || 'Darshan / Pilgrimage'}</td>
                  <td>{checkIn.comingFrom || 'Renukot'}</td>
                  <td>{checkIn.goingTo || 'Mumbai'}</td>
                </tr>
              </tbody>
            </table>

            {/* Financial Advance Row (Frame 0340) */}
            <table className="pms-table-compact" style={{ marginBottom: 14 }}>
              <thead>
                <tr>
                  <th>Checkin Advance (₹)</th>
                  <th>Payment Remark</th>
                  <th>Refrance No</th>
                  <th>Agent</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 800, fontSize: 14, color: '#16a34a' }}>₹{checkIn.advancePaid.toFixed(2)}</td>
                  <td>{checkIn.paymentRemark || checkIn.paymentMode || 'CASH'}</td>
                  <td>{checkIn.paymentReferenceNo || 'N/A'}</td>
                  <td>{checkIn.businessSource}</td>
                </tr>
              </tbody>
            </table>

            {/* Terms and Signatures */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1.6fr',
              gap: 14,
              borderTop: '1px solid #cbd5e1',
              paddingTop: 12,
              fontSize: 11,
              color: '#475569'
            }}>
              <div>
                <strong style={{ color: '#1e293b' }}>Terms & Conditions:</strong>
                <ol style={{ paddingLeft: 16, marginTop: 4, lineHeight: 1.5 }}>
                  <li>1. Extra person charge - Rs. 40% on tariff per person.</li>
                  <li>2. Standard check out time is 12:00 Noon.</li>
                  <li>3. Government Photo ID mandatory for all occupants.</li>
                </ol>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingTop: 40
              }}>
                <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: 140, paddingTop: 4 }}>
                  <strong>Guest Signature</strong>
                </div>

                <div style={{ textAlign: 'center', borderTop: '1px solid #94a3b8', width: 160, paddingTop: 4 }}>
                  <strong>Authorized Signatory</strong>
                  <div style={{ fontSize: 9 }}>For Hotel Sai Vasudev</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pms-btn-group" style={{ padding: '12px 16px', background: '#f8fafc' }}>
          <button id="close-checkin-slip-btn" type="button" onClick={onClose} className="btn-pms-cancel">
            Close
          </button>
          <button type="button" onClick={handlePrint} className="btn-pms-print">
            🖨️ Print Room Check Inn Slip
          </button>
          <button
            type="button"
            onClick={() => {
              if (checkIn.mobile) {
                PmsStore.sendWhatsAppNotification({
                  voucherType: 'Check_in_store',
                  recipientMobile: checkIn.mobile,
                  recipientName: checkIn.guestName,
                  voucherNo: checkIn.checkInNo,
                  roomNo: checkIn.roomNo,
                  templateParams: {
                    checkin_date: checkIn.checkInDate,
                    total_billamount: checkIn.tariffPerDay.toString()
                  },
                  openDirectly: true
                });
              } else {
                alert('No guest mobile number found on this check-in slip');
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
            title="Open check-in slip & welcome voucher directly in WhatsApp Web (Option 1: wa.me 100% Free)"
          >
            💬 WhatsApp Slip (wa.me)
          </button>
        </div>
      </div>
    </div>
  );
};
