import React, { useState } from 'react';
import { PmsStore } from '../../services/pmsStore';

interface FbbReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FbbReportModal: React.FC<FbbReportModalProps> = ({ isOpen, onClose }) => {
  const foodBills = PmsStore.getFoodBills();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('all');

  // Extract all distinct room and table numbers across PMS
  const allRooms = React.useMemo(() => {
    const set = new Set<string>();
    PmsStore.getRooms().forEach(r => set.add(r.roomNo));
    foodBills.forEach(b => {
      if (b.roomNo) set.add(b.roomNo);
      if (b.tableNo) set.add(b.tableNo);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [foodBills]);

  if (!isOpen) return null;

  const filtered = foodBills.filter(b => {
    if (selectedRoom !== 'all' && b.roomNo !== selectedRoom && b.tableNo !== selectedRoom) return false;
    if (selectedDate) {
      const cleanBillDate = (b.date || '').trim().replace(/\//g, '-');
      const cleanSelDate = selectedDate.trim().replace(/\//g, '-');
      // Normalize comparison (supports both DD-MM-YYYY and YYYY-MM-DD)
      const bParts = cleanBillDate.split('-');
      const sParts = cleanSelDate.split('-');
      const bNorm = bParts.length === 3 && bParts[0].length === 2 ? `${bParts[2]}-${bParts[1].padStart(2, '0')}-${bParts[0].padStart(2, '0')}` : cleanBillDate;
      const sNorm = sParts.length === 3 && sParts[0].length === 2 ? `${sParts[2]}-${sParts[1].padStart(2, '0')}-${sParts[0].padStart(2, '0')}` : cleanSelDate;
      if (bNorm !== sNorm) return false;
    }
    return true;
  });

  const totalTaxable = filtered.reduce((s, b) => s + b.taxableAmount, 0);
  const totalCgst = filtered.reduce((s, b) => s + b.cgstAmount, 0);
  const totalSgst = filtered.reduce((s, b) => s + b.sgstAmount, 0);
  const totalDiscount = filtered.reduce((s, b) => s + b.discountAmount, 0);
  const grandNet = filtered.reduce((s, b) => s + b.netBillAmount, 0);

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div className="pms-form-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 1050 }}>
        {/* Banner from Video 04 Spoken [09:45, 10:30] */}
        <div className="pms-form-banner banner-cyan">
          FBB Report &bull; Food &amp; Beverage Bill Register (Report &gt; FBB Report)
        </div>

        <div className="pms-form-body">
          {/* Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            paddingBottom: 8,
            borderBottom: '1px solid #cbd5e1',
            flexWrap: 'wrap',
            gap: 10
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0369a1' }}>Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="form-input-pms"
                style={{ width: 140 }}
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  style={{ fontSize: 11, background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}
                >
                  Show All Dates
                </button>
              )}

              <span style={{ fontSize: 13, fontWeight: 700, color: '#0369a1', marginLeft: 6 }}>Room / Table:</span>
              <select
                value={selectedRoom}
                onChange={e => setSelectedRoom(e.target.value)}
                className="form-select-pms"
                style={{ width: 150 }}
              >
                <option value="all">All Rooms &amp; Tables</option>
                {allRooms.map(rm => (
                  <option key={rm} value={rm}>
                    {rm.toLowerCase().includes('table') ? rm : `Room ${rm}`}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>
              Total F&amp;B Bills: {filtered.length} &bull; Total Sales: ₹{grandNet.toFixed(2)}
            </div>
          </div>

          {/* Table */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            <table className="pms-table-compact">
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Date &amp; Time</th>
                  <th>Room No</th>
                  <th>Guest Name</th>
                  <th>KOT Nos</th>
                  <th>Taxable (₹)</th>
                  <th>CGST (2.5%)</th>
                  <th>SGST (2.5%)</th>
                  <th>Dis (₹)</th>
                  <th>Net Bill (₹)</th>
                  <th>Settlement</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.billNo}>
                    <td style={{ fontWeight: 800, color: '#0369a1' }}>{b.billNo}</td>
                    <td>{b.date} {b.time}</td>
                    <td style={{ fontWeight: 700 }}>{b.roomNo}</td>
                    <td style={{ fontWeight: 600 }}>{b.guestName}</td>
                    <td>{b.kotNumbers.join(', ')}</td>
                    <td style={{ textAlign: 'right' }}>₹{b.taxableAmount.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>₹{b.cgstAmount.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>₹{b.sgstAmount.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#b91c1c' }}>-₹{b.discountAmount.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>₹{b.netBillAmount.toFixed(2)}</td>
                    <td>
                      <span style={{
                        background: b.settlementType === 'Settle To Room' ? '#dcfce7' : '#e0f2fe',
                        color: b.settlementType === 'Settle To Room' ? '#166534' : '#0369a1',
                        padding: '2px 8px',
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 700
                      }}>
                        {b.settlementType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 800 }}>
                  <td colSpan={5} style={{ textAlign: 'right' }}>Grand Totals:</td>
                  <td style={{ textAlign: 'right' }}>₹{totalTaxable.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>₹{totalCgst.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>₹{totalSgst.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', color: '#b91c1c' }}>-₹{totalDiscount.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', color: '#16a34a', fontSize: 13 }}>₹{grandNet.toFixed(2)}</td>
                  <td>—</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="pms-btn-group">
            <button type="button" onClick={onClose} className="btn-pms-cancel">
              Close
            </button>
            <button type="button" onClick={() => window.print()} className="btn-pms-print">
              🖨️ Print FBB Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
