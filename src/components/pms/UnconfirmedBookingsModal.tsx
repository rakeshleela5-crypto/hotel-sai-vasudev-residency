import React, { useState, useEffect } from 'react';
import type { PmsBooking } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import { OnlineGuestBookingModal } from './OnlineGuestBookingModal';
import './pmsStyles.css';

interface UnconfirmedBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCalendar?: () => void;
  onOpenNewBooking?: () => void;
  onOpenCheckInForBooking?: (booking: PmsBooking) => void;
}

export const UnconfirmedBookingsModal: React.FC<UnconfirmedBookingsModalProps> = ({
  isOpen,
  onClose,
  onOpenCalendar,
  onOpenNewBooking,
  onOpenCheckInForBooking
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed'>('pending');
  const [unconfirmedList, setUnconfirmedList] = useState<PmsBooking[]>([]);
  const [confirmedList, setConfirmedList] = useState<PmsBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  
  // Success confirmation banner matching Frame 0360:
  // "Selected Booking Confirm you can Make Check In"
  const [confirmBannerMessage, setConfirmBannerMessage] = useState<string | null>(null);
  const [lastConfirmedBooking, setLastConfirmedBooking] = useState<PmsBooking | null>(null);

  // View / Print Voucher Modal
  const [viewingBooking, setViewingBooking] = useState<PmsBooking | null>(null);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);

  // New Guest Online Portal Modal
  const [isGuestPortalOpen, setIsGuestPortalOpen] = useState(false);

  const refreshData = () => {
    const unconfirmed = PmsStore.getUnconfirmedBookings();
    const confirmed = PmsStore.getConfirmedBookings();
    setUnconfirmedList(unconfirmed);
    setConfirmedList(confirmed);
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setConfirmBannerMessage(null);
      const unsub = PmsStore.subscribe(refreshData);
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentList = activeTab === 'pending' ? unconfirmedList : confirmedList;

  const filteredList = currentList.filter(b => {
    const q = searchQuery.toLowerCase();
    const rNo = b.rooms.map(r => r.roomNo).join(', ').toLowerCase();
    return (
      b.bookingNo.toLowerCase().includes(q) ||
      b.guestName.toLowerCase().includes(q) ||
      b.mobile.includes(q) ||
      rNo.includes(q)
    );
  });

  const handleConfirm = (booking: PmsBooking) => {
    const res = PmsStore.confirmBooking(booking.bookingNo);
    if (res.success) {
      setConfirmBannerMessage(res.message); // "Selected Booking Confirm you can Make Check In"
      setLastConfirmedBooking(booking);
      refreshData();

      // Automated WhatsApp notification (Video 02 [17:15] & Video 20 [11:40])
      const msg = encodeURIComponent(
        `Namaste ${booking.guestName} ji! Your reservation ${booking.bookingNo} for Room ${booking.rooms[0]?.roomNo} (${booking.checkInDate} to ${booking.checkOutDate}) is now CONFIRMED at HOTEL SAI VASUDEV RESIDENCY, Shirdi. Looking forward to welcoming you!`
      );
      // Auto open or log
      console.log('WhatsApp notification ready:', msg);
    }
  };

  const handleDelete = (bookingNo: string) => {
    if (confirm(`Are you sure you want to delete reservation ${bookingNo}?`)) {
      PmsStore.deleteBooking(bookingNo);
      refreshData();
    }
  };

  const handleOpenVoucher = (b: PmsBooking) => {
    setViewingBooking(b);
    setIsVoucherOpen(true);
  };

  return (
    <div className="pms-submodal-overlay" onClick={onClose} style={{ zIndex: 9990 }}>
      <div 
        className="pms-form-box" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: 1100, 
          width: '94vw', 
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: '#ffffff',
          borderRadius: 6,
          overflow: 'hidden'
        }}
      >
        {/* Top Window Bar */}
        <div style={{
          background: '#1e293b',
          color: '#ffffff',
          padding: '10px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>📋</span>
            <span style={{ fontWeight: 800, fontSize: 14 }}>
              Room Booking &bull; Unconfirmed Bookings Register
            </span>
            <span style={{
              background: '#e11d48',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 800
            }}>
              {unconfirmedList.length} Pending
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => setIsGuestPortalOpen(true)}
              style={{
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                padding: '4px 12px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🌐 Open Guest Web Portal
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: 18,
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', background: '#ffffff' }}>
          
          {/* Success Banner from Frame 0360 */}
          {confirmBannerMessage && (
            <div style={{
              background: '#dbeafe',
              border: '1px solid #93c5fd',
              color: '#1e40af',
              padding: '10px 16px',
              borderRadius: 4,
              marginBottom: 14,
              fontSize: 13,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>✅</span>
                <span>{confirmBannerMessage}</span>
              </div>

              {lastConfirmedBooking && onOpenCheckInForBooking && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCheckInForBooking(lastConfirmedBooking);
                  }}
                  style={{
                    background: '#1d4ed8',
                    color: '#ffffff',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Make Check In Now &rarr;
                </button>
              )}
            </div>
          )}

          {/* Subtitle from Frame 0350 */}
          <div style={{ fontSize: 14, fontWeight: 700, color: '#475569', marginBottom: 12 }}>
            Room Booking
          </div>

          {/* 4 Action Buttons matching Frame 0350 & Frame 0360 */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <button
              type="button"
              onClick={onOpenCalendar || onClose}
              style={{
                background: '#eab308',
                color: '#0f172a',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Room Dash Board
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenNewBooking) {
                  onClose();
                  onOpenNewBooking();
                } else {
                  setIsGuestPortalOpen(true);
                }
              }}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Book New Room
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              style={{
                background: activeTab === 'pending' ? '#e11d48' : '#cbd5e1',
                color: activeTab === 'pending' ? '#ffffff' : '#334155',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Pending For Confirmation ({unconfirmedList.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('confirmed')}
              style={{
                background: activeTab === 'confirmed' ? '#1e293b' : '#cbd5e1',
                color: activeTab === 'confirmed' ? '#ffffff' : '#334155',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Confirmed Bookings ({confirmedList.length})
            </button>
          </div>

          {/* Table Controls (Entries per page & Search) matching Frame 0350 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
              <select
                value={entriesPerPage}
                onChange={e => setEntriesPerPage(Number(e.target.value))}
                style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries per page</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#475569' }}>Search:</span>
              <input
                type="text"
                placeholder="Search guest, room, mobile..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '4px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, width: 220 }}
              />
            </div>
          </div>

          {/* Table matching Frame 0350 & Frame 0360 */}
          <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: 4 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#1e293b', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', width: 45, textAlign: 'center' }}>S.No</th>
                  <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1' }}>Room No</th>
                  <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1' }}>Bookig No</th>
                  <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1' }}>Guest Name</th>
                  <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1' }}>Contact No</th>
                  <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1' }}>Booking Date</th>
                  <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1' }}>Check in Date</th>
                  <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1' }}>Check Out Date</th>
                  <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', width: 40, textAlign: 'center' }}>Print</th>
                  <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', width: 40, textAlign: 'center' }}>View</th>
                  {activeTab === 'pending' && (
                    <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', width: 60, textAlign: 'center', color: '#16a34a' }}>
                      Confirm
                    </th>
                  )}
                  <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', width: 40, textAlign: 'center' }}>Edit</th>
                  <th style={{ padding: '8px 10px', width: 40, textAlign: 'center' }}>Delete</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.slice(0, entriesPerPage).map((b, idx) => {
                  const roomStr = b.rooms.map(r => r.roomNo).join(', ');

                  return (
                    <tr 
                      key={b.bookingNo}
                      style={{ 
                        borderBottom: '1px solid #e2e8f0',
                        background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                      }}
                    >
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', fontWeight: 800, color: '#0284c7' }}>
                        {roomStr}
                      </td>
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', fontWeight: 600 }}>
                        {b.bookingNo}
                      </td>
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', fontWeight: 700, color: '#0f172a' }}>
                        {b.guestName}
                      </td>
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1' }}>
                        {b.mobile}
                      </td>
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>
                        {b.bookingDate}
                      </td>
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', fontWeight: 600, color: '#16a34a' }}>
                        {b.checkInDate}
                      </td>
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', fontWeight: 600, color: '#dc2626' }}>
                        {b.checkOutDate}
                      </td>

                      {/* Print Icon */}
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenVoucher(b)}
                          title="Print Guest Booking Voucher"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
                        >
                          🖨️
                        </button>
                      </td>

                      {/* View Icon */}
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenVoucher(b)}
                          title="View Details"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
                        >
                          👁️
                        </button>
                      </td>

                      {/* Confirm (✓) Icon matching Frame 0360 */}
                      {activeTab === 'pending' && (
                        <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleConfirm(b)}
                            title="Confirm Booking &amp; Block Room"
                            style={{
                              background: '#22c55e',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              padding: '2px 8px',
                              fontWeight: 900,
                              fontSize: 12,
                              cursor: 'pointer'
                            }}
                          >
                            ✓
                          </button>
                        </td>
                      )}

                      {/* Edit Icon */}
                      <td style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenVoucher(b)}
                          title="Edit Details"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
                        >
                          ✏️
                        </button>
                      </td>

                      {/* Delete Icon */}
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(b.bookingNo)}
                          title="Delete / Cancel Booking"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
                        >
                          🗑️
                        </button>
                      </td>

                    </tr>
                  );
                })}

                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={activeTab === 'pending' ? 13 : 12} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                      No {activeTab === 'pending' ? 'unconfirmed' : 'confirmed'} bookings found matching search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
            Showing 1 to {Math.min(filteredList.length, entriesPerPage)} of {filteredList.length} entries
          </div>

        </div>
      </div>

      {/* Guest Slip Modal Overlay */}
      {isVoucherOpen && viewingBooking && (
        <div 
          className="pms-submodal-overlay" 
          onClick={() => setIsVoucherOpen(false)}
          style={{ zIndex: 10005 }}
        >
          <div 
            className="pms-form-box" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: 880, padding: 0, overflow: 'hidden' }}
          >
            {/* Header matching Frame 0290 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', borderBottom: '1px solid #cbd5e1' }}>
              <div style={{ background: '#a7f3d0', padding: 14, borderRight: '1px solid #6ee7b7' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#064e3b', marginBottom: 6 }}>Guest Detail</div>
                <div style={{ fontSize: 12, color: '#065f46', lineHeight: 1.6 }}>
                  <div><strong>Guest Name:</strong> {viewingBooking.guestName}</div>
                  <div><strong>Add:</strong> {viewingBooking.addressLine1 || 'Main Road'} {viewingBooking.addressLine2}</div>
                  <div><strong>city:</strong> {viewingBooking.city || 'Shirdi'}</div>
                  <div><strong>State:</strong> {viewingBooking.state || 'Maharashtra'}</div>
                  <div><strong>Mob:</strong> {viewingBooking.mobile}</div>
                  <div><strong>Email:</strong> {viewingBooking.email || 'N/A'}</div>
                </div>
              </div>

              <div style={{ background: '#fde047', padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#713f12', marginBottom: 6 }}>Booking Detail</div>
                <div style={{ fontSize: 12, color: '#854d0e', lineHeight: 1.6 }}>
                  <div><strong>Booking No :</strong> {viewingBooking.bookingNo}</div>
                  <div><strong>Booking Date:</strong> {viewingBooking.bookingDate}</div>
                  <div><strong>Booking Time:</strong> {viewingBooking.bookingTime}</div>
                  <div><strong>Aspected Check In Date:</strong> {viewingBooking.checkInDate}</div>
                  <div><strong>Check In Time:</strong> {viewingBooking.checkInTime}</div>
                  <div><strong>Aspected Check Out Date:</strong> {viewingBooking.checkOutDate}</div>
                  <div><strong>Check Out Time:</strong> {viewingBooking.checkOutTime}</div>
                  <div><strong>Total Day :</strong> {viewingBooking.numberOfDays}</div>
                </div>
              </div>
            </div>

            {/* Middle Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '1px solid #cbd5e1', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#1e293b', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>Room No</th>
                  <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>Total Rooms</th>
                  <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>No of Guest</th>
                  <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>Commited Days</th>
                  <th style={{ padding: '8px' }}>Tariff</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ textAlign: 'center', fontWeight: 700 }}>
                  <td style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>{viewingBooking.rooms[0]?.roomNo || '103'}</td>
                  <td style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>{viewingBooking.rooms.length}</td>
                  <td style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>{viewingBooking.numberOfGuests}</td>
                  <td style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>{viewingBooking.numberOfDays}</td>
                  <td style={{ padding: '8px', color: '#16a34a' }}>₹{viewingBooking.rooms[0]?.tariff.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {/* Actions */}
            <div style={{ padding: '12px 16px', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 18px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🖨️ Print Slip
              </button>
              <button
                type="button"
                onClick={() => setIsVoucherOpen(false)}
                style={{
                  background: '#1e293b',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 18px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Online Booking Portal Modal */}
      <OnlineGuestBookingModal
        isOpen={isGuestPortalOpen}
        onClose={() => {
          setIsGuestPortalOpen(false);
          refreshData();
        }}
      />
    </div>
  );
};
