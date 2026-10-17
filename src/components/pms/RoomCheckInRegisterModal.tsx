import React, { useState, useEffect } from 'react';
import type { PmsCheckIn } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';

interface RoomCheckInRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewCheckIn: () => void;
  onOpenRoomShift: (roomNo: string) => void;
  onOpenCheckout?: (roomNo: string) => void;
}

export const RoomCheckInRegisterModal: React.FC<RoomCheckInRegisterModalProps> = ({
  isOpen,
  onClose,
  onOpenNewCheckIn,
  onOpenRoomShift,
  onOpenCheckout
}) => {
  const [checkIns, setCheckIns] = useState<PmsCheckIn[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [selectedCheckIn, setSelectedCheckIn] = useState<PmsCheckIn | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCheckIns(PmsStore.getCheckIns());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCheckIns = checkIns.filter(c =>
    c.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.roomNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.checkInNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile.includes(searchTerm)
  );

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div
        className="pms-form-box"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 1040, width: '95%', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Banner matching Video 11 Frame 146 */}
        <div
          className="pms-form-banner"
          style={{
            background: '#1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📋</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#ffffff', letterSpacing: 0.5 }}>
              Room Check In Register (Video 11)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Action buttons matching Frame 146 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 16 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#eab308',
                color: '#0f172a',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 4,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <span>🏢</span>
              <span>Room Dash Board</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewCheckIn();
              }}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: 4,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <span>➕</span>
              <span>New Check In</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569' }}>
              <select
                value={entriesPerPage}
                onChange={e => setEntriesPerPage(Number(e.target.value))}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries per page</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Search:</span>
              <input
                type="text"
                placeholder="Search check-in, guest, room..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  width: 220
                }}
              />
            </div>
          </div>

          {/* Table matching Video 11 Frame 146 */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#1e293b' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'center', width: 45 }}>S.No</th>
                  <th style={{ padding: '10px 10px', fontWeight: 800 }}>Check In No</th>
                  <th style={{ padding: '10px 8px', fontWeight: 800, textAlign: 'center' }}>Room No</th>
                  <th style={{ padding: '10px 10px', fontWeight: 800 }}>Guest Name</th>
                  <th style={{ padding: '10px 10px' }}>Contact No</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Total Guest</th>
                  <th style={{ padding: '10px 10px' }}>Check in Date</th>
                  <th style={{ padding: '10px 10px' }}>Check in Time</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCheckIns.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
                      No check-in records found.
                    </td>
                  </tr>
                ) : (
                  filteredCheckIns.slice(0, entriesPerPage).map((item, idx) => (
                    <tr
                      key={item.checkInNo}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                      }}
                    >
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#64748b' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '10px 10px', fontWeight: 700, color: '#0284c7' }}>
                        {item.checkInNo}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>
                        {item.roomNo}
                      </td>
                      <td style={{ padding: '10px 10px', fontWeight: 700 }}>
                        {item.guestName}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#334155' }}>
                        {item.mobile}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        {item.numberOfGuests || 1}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        {item.checkInDate}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        {item.checkInTime}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        <span
                          style={{
                            background: item.status === 'CheckedIn' ? '#dcfce7' : '#f1f5f9',
                            color: item.status === 'CheckedIn' ? '#166534' : '#475569',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 700
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                          {/* Print Icon */}
                          <button
                            type="button"
                            title="Print GRC Slip"
                            onClick={() => alert(`Printing GRC slip for Check-In ${item.checkInNo} (${item.guestName})`)}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: 4,
                              padding: '3px 6px',
                              cursor: 'pointer',
                              fontSize: 12
                            }}
                          >
                            🖨️
                          </button>

                          {/* View Icon */}
                          <button
                            type="button"
                            title="View Guest Details"
                            onClick={() => setSelectedCheckIn(item)}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: 4,
                              padding: '3px 6px',
                              cursor: 'pointer',
                              fontSize: 12
                            }}
                          >
                            👁️
                          </button>

                          {/* Room Shift Icon (Video 11) */}
                          <button
                            type="button"
                            title="Shift Room (Video 11)"
                            onClick={() => {
                              onClose();
                              onOpenRoomShift(item.roomNo);
                            }}
                            style={{
                              background: '#e0f2fe',
                              border: '1px solid #38bdf8',
                              borderRadius: 4,
                              padding: '3px 6px',
                              cursor: 'pointer',
                              fontSize: 12,
                              color: '#0369a1'
                            }}
                          >
                            🔄
                          </button>

                          {/* Check Out / Folio Icon */}
                          <button
                            type="button"
                            title="Room Checkout"
                            onClick={() => {
                              if (onOpenCheckout) {
                                onClose();
                                onOpenCheckout(item.roomNo);
                              }
                            }}
                            style={{
                              background: '#fef3c7',
                              border: '1px solid #f59e0b',
                              borderRadius: 4,
                              padding: '3px 6px',
                              cursor: 'pointer',
                              fontSize: 12
                            }}
                          >
                            🧾
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 11, color: '#64748b' }}>
            <div>
              Showing 1 to {Math.min(filteredCheckIns.length, entriesPerPage)} of {filteredCheckIns.length} entries
            </div>
          </div>
        </div>

        {/* Selected Guest Details Sub-Modal */}
        {selectedCheckIn && (
          <div className="pms-submodal-overlay" onClick={() => setSelectedCheckIn(null)}>
            <div className="pms-form-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 15, borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>
                Guest Check-In Card: {selectedCheckIn.guestName}
              </h3>
              <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                <div><strong>Check In No:</strong> {selectedCheckIn.checkInNo}</div>
                <div><strong>Current Room:</strong> {selectedCheckIn.roomNo} ({selectedCheckIn.roomType})</div>
                <div><strong>Contact:</strong> {selectedCheckIn.mobile}</div>
                <div><strong>Check In Date/Time:</strong> {selectedCheckIn.checkInDate} {selectedCheckIn.checkInTime}</div>
                <div><strong>Per Day Tariff:</strong> ₹{selectedCheckIn.tariffPerDay}</div>
                <div><strong>Advance Paid:</strong> ₹{selectedCheckIn.advancePaid} ({selectedCheckIn.paymentMode})</div>
                <div><strong>Business Source:</strong> {selectedCheckIn.businessSource} &bull; {selectedCheckIn.package}</div>
                <div><strong>Address:</strong> {selectedCheckIn.addressLine1}, {selectedCheckIn.city}, {selectedCheckIn.state}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setSelectedCheckIn(null)}
                  className="btn-pms-cancel"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const r = selectedCheckIn.roomNo;
                    setSelectedCheckIn(null);
                    onClose();
                    onOpenRoomShift(r);
                  }}
                  className="btn-pms-save"
                >
                  Shift This Room 🔄
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
