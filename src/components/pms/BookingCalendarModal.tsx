import React, { useState } from 'react';
import { PmsStore } from '../../services/pmsStore';

interface BookingCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingCalendarModal: React.FC<BookingCalendarModalProps> = ({
  isOpen,
  onClose
}) => {
  const rooms = PmsStore.getRooms();
  const bookings = PmsStore.getBookings();

  // Current month view: June 2025 (as in demo) or current month
  const [selectedMonth, setSelectedMonth] = useState('2025-06');

  if (!isOpen) return null;

  // Generate days 10 to 25 of the month for visual clarity matching demo
  const days = Array.from({ length: 16 }, (_, i) => i + 10);

  // Helper to check booking status on a given day
  const getCellStatus = (roomNo: string, day: number) => {
    // Check bookings
    for (const b of bookings) {
      if (b.rooms.some(r => r.roomNo === roomNo)) {
        const startDay = parseInt(b.checkInDate.split('-')[0] || '1', 10);
        const endDay = parseInt(b.checkOutDate.split('-')[0] || '1', 10);
        if (day >= startDay && day <= endDay) {
          return {
            status: 'booked',
            guest: b.guestName,
            bookingNo: b.bookingNo
          };
        }
      }
    }

    // Default hardcoded bookings demonstrated in video:
    // Room 104 booked 11 to 19 June
    if (roomNo === '104' && day >= 11 && day <= 19) {
      return { status: 'booked', guest: 'suresh raina', bookingNo: 'RM/63/24-25' };
    }
    // Room 103 booked 20 to 24 June
    if (roomNo === '103' && day >= 20 && day <= 24) {
      return { status: 'booked', guest: 'hariom gautam ji', bookingNo: 'RM/64/24-25' };
    }
    // Room 103 currently occupied on 05 June
    if (roomNo === '103' && day <= 10) {
      return { status: 'occupied', guest: 'AJUU', bookingNo: 'RM/60/24-25' };
    }

    return { status: 'vacant', guest: '', bookingNo: '' };
  };

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div className="pms-form-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 1150 }}>
        {/* Banner from Video 02 Spoken [07:30, 15:45] */}
        <div className="pms-form-banner banner-cyan">
          Room Booking Calendar & Occupancy Schedule (Report &gt; Booking Calendar)
        </div>

        <div className="pms-form-body">
          {/* Header Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            paddingBottom: 8,
            borderBottom: '1px solid #cbd5e1'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0369a1' }}>Select Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="form-input-pms"
                style={{ width: 160, fontWeight: 700 }}
              />
            </div>

            {/* Status Legend */}
            <div style={{ display: 'flex', gap: 14, fontSize: 12, fontWeight: 700 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, background: '#22c55e', borderRadius: 2 }} /> Vacant
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, background: '#f59e0b', borderRadius: 2 }} /> Booked (Advance)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, background: '#10b981', borderRadius: 2 }} /> Checked In
              </span>
            </div>
          </div>

          {/* Calendar Grid Table */}
          <div style={{ maxHeight: 420, overflowY: 'auto', overflowX: 'auto' }}>
            <table className="pms-table-compact" style={{ minWidth: 950 }}>
              <thead>
                <tr>
                  <th style={{ width: 90, position: 'sticky', left: 0, zIndex: 3, background: '#0f172a' }}>Room No</th>
                  <th style={{ width: 90 }}>Category</th>
                  {days.map(d => (
                    <th key={d} style={{ textAlign: 'center', minWidth: 46 }}>
                      {d} Jun
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room.id}>
                    <td style={{
                      fontWeight: 800,
                      position: 'sticky',
                      left: 0,
                      background: '#f8fafc',
                      zIndex: 2,
                      color: '#0369a1'
                    }}>
                      {room.roomNo}
                    </td>
                    <td style={{ fontSize: 11, color: '#64748b' }}>{room.roomType}</td>
                    {days.map(d => {
                      const cell = getCellStatus(room.roomNo, d);
                      let bg = '#dcfce7'; // green vacant
                      let title = `Room ${room.roomNo} is Vacant on ${d} Jun`;

                      if (cell.status === 'booked') {
                        bg = '#fde68a'; // orange/amber booked
                        title = `Room ${room.roomNo} Booked by ${cell.guest} (${cell.bookingNo})`;
                      } else if (cell.status === 'occupied') {
                        bg = '#86efac';
                        title = `Room ${room.roomNo} Occupied by ${cell.guest}`;
                      }

                      return (
                        <td
                          key={d}
                          style={{
                            backgroundColor: bg,
                            textAlign: 'center',
                            cursor: 'pointer',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '4px 2px'
                          }}
                          title={title}
                          onClick={() => {
                            if (cell.status === 'booked') {
                              alert(`Booking Details:\nRoom: ${room.roomNo}\nGuest: ${cell.guest}\nVoucher: ${cell.bookingNo}`);
                            } else {
                              alert(`Room ${room.roomNo} is AVAILABLE on ${d} June 2025. Standard Tariff: ₹${room.tariff}`);
                            }
                          }}
                        >
                          {cell.status === 'booked' ? 'BKD' : cell.status === 'occupied' ? 'OCC' : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pms-btn-group">
            <button type="button" onClick={onClose} className="btn-pms-cancel">
              Close Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
