import React, { useState, useMemo } from 'react';
import { PmsStore } from '../../services/pmsStore';

interface MonthlyHotelSaleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonthlyHotelSaleReportModal: React.FC<MonthlyHotelSaleReportModalProps> = ({ isOpen, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('JUNE 2026');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const rows = useMemo(() => {
    return PmsStore.getMonthlyHotelSaleReport(selectedMonth);
  }, [selectedMonth]);

  const company = PmsStore.getCompanyInfo();

  if (!isOpen) return null;

  const handleExportXlsx = () => {
    PmsStore.exportHotelSaleReportXlsx(selectedMonth);
  };

  const filteredRows = rows.filter((r: any) =>
    searchQuery === '' || 
    r.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.roomNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.guestName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRent = rows.reduce((s: number, r: any) => s + (r.rent || 0), 0);
  const totalCgst = rows.reduce((s: number, r: any) => s + (r.cgst || 0), 0);
  const totalSgst = rows.reduce((s: number, r: any) => s + (r.sgst || 0), 0);
  const totalLaundry = rows.reduce((s: number, r: any) => s + (r.laundry || 0), 0);
  const totalRoomService = rows.reduce((s: number, r: any) => s + (r.roomService || 0), 0);
  const totalNet = rows.reduce((s: number, r: any) => s + (r.netAmount || 0), 0);
  const totalAdvance = rows.reduce((s: number, r: any) => s + (r.advance || 0), 0);
  const totalDiscount = rows.reduce((s: number, r: any) => s + (r.discount || 0), 0);
  const totalCash = rows.reduce((s: number, r: any) => s + (r.cash || 0), 0);
  const totalCard = rows.reduce((s: number, r: any) => s + (r.creditCard || 0), 0);
  const totalOnline = rows.reduce((s: number, r: any) => s + (r.online || 0), 0);
  const totalSettled = totalCash + totalCard + totalOnline;

  return (
    <div className="pms-submodal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="pms-form-box"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 1400, width: '97vw', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Banner Header */}
        <div className="pms-form-banner banner-navy" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>📊</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 14 }}>
                Monthly Hotel Sale &amp; Tax Report &mdash; {selectedMonth}
              </div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>
                Exact Schema Mapped to HOTEL SALE REPORT JUNE MONTH.xlsx &bull; {company.hotelName || company.firmName} ({company.gstNo || company.gstin})
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        {/* Toolbar Bar */}
        <div style={{ padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>
              Select Accounting Month:
            </label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="form-select-pms"
              style={{ fontWeight: 800, width: 160 }}
            >
              <option value="JUNE 2026">JUNE 2026</option>
              <option value="MAY 2026">MAY 2026</option>
              <option value="APRIL 2026">APRIL 2026</option>
              <option value="JULY 2026">JULY 2026</option>
            </select>

            <input
              type="text"
              placeholder="Search date, room, guest..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input-pms"
              style={{ width: 220, fontSize: 12 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={handleExportXlsx}
              style={{
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '7px 20px',
                borderRadius: 4,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(22,163,74,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>📥</span>
              <span>Export HOTEL SALE REPORT (XLSX)</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, padding: '12px 20px', background: '#f1f5f9' }}>
          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>TOTAL ROOM RENT</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
              ₹{totalRent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 9, color: '#16a34a', fontWeight: 600 }}>SAC 996311</div>
          </div>

          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>TAX COLLECTED (CGST+SGST)</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#0284c7', marginTop: 2 }}>
              ₹{(totalCgst + totalSgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 9, color: '#64748b' }}>Intra-state Odisha (21)</div>
          </div>

          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>NET INVOICED TURNOVER</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#16a34a', marginTop: 2 }}>
              ₹{totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 9, color: '#059669', fontWeight: 700 }}>Gross Total Realized</div>
          </div>

          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>DIGITAL (UPI + CARD)</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#7c3aed', marginTop: 2 }}>
              ₹{(totalOnline + totalCard).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 9, color: '#64748b' }}>Electronic Bank Settlements</div>
          </div>

          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>CASH AT DESK</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#d97706', marginTop: 2 }}>
              ₹{totalCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 9, color: '#64748b' }}>Physical Cashier Counter</div>
          </div>
        </div>

        {/* 26-Column Excel Grid Table */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '10px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>
            SRI SAI VASUDEV RESIDENCY &bull; DAILY ROOM SALE REGISTER (HOTEL SALE REPORT JUNE MONTH.xlsx)
          </div>
          <table className="pms-table-compact" style={{ width: '100%', minWidth: 1600, fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#fff' }}>
                <th style={{ width: 45, textAlign: 'center' }}>S.NO</th>
                <th style={{ width: 85, textAlign: 'center' }}>DATE</th>
                <th>BILL NO</th>
                <th>R.NO</th>
                <th style={{ textAlign: 'right' }}>RENT (₹)</th>
                <th style={{ textAlign: 'right' }}>CGST (₹)</th>
                <th style={{ textAlign: 'right' }}>SGST (₹)</th>
                <th style={{ textAlign: 'right' }}>MISC</th>
                <th style={{ textAlign: 'right' }}>LAUNDRY</th>
                <th style={{ textAlign: 'right' }}>MIN.B</th>
                <th style={{ textAlign: 'right' }}>R/S (₹)</th>
                <th style={{ textAlign: 'right', background: '#15803d' }}>NET AMT (₹)</th>
                <th style={{ textAlign: 'right' }}>ADVANCE</th>
                <th style={{ textAlign: 'right' }}>DISCOUNT</th>
                <th style={{ textAlign: 'right' }}>COMPLT</th>
                <th style={{ textAlign: 'right' }}>CASH (₹)</th>
                <th style={{ textAlign: 'right' }}>C.C (₹)</th>
                <th style={{ textAlign: 'right' }}>ONLINE (₹)</th>
                <th>REMARK</th>
                <th>GUEST NAME</th>
                <th>COMPANY</th>
                <th>G.S.T NO.</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r: any, idx: number) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.sNo}</td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: '#0369a1' }}>{r.date}</td>
                  <td style={{ fontWeight: 700 }}>{r.billNo}</td>
                  <td style={{ fontWeight: 800, color: '#0f172a' }}>{r.roomNo}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.rent.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', color: '#0284c7' }}>{r.cgst.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', color: '#7c3aed' }}>{r.sgst.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{r.misc}</td>
                  <td style={{ textAlign: 'right' }}>{r.laundry}</td>
                  <td style={{ textAlign: 'right' }}>{r.minBar}</td>
                  <td style={{ textAlign: 'right' }}>{r.roomService.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 900, background: '#dcfce7', color: '#15803d' }}>
                    {r.netAmount.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right' }}>{r.advance.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', color: '#dc2626' }}>{r.discount.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{r.complimentary}</td>
                  <td style={{ textAlign: 'right', color: '#d97706', fontWeight: 700 }}>{r.cash > 0 ? r.cash.toFixed(2) : '-'}</td>
                  <td style={{ textAlign: 'right', color: '#0284c7' }}>{r.creditCard > 0 ? r.creditCard.toFixed(2) : '-'}</td>
                  <td style={{ textAlign: 'right', color: '#7c3aed', fontWeight: 700 }}>{r.online > 0 ? r.online.toFixed(2) : '-'}</td>
                  <td style={{ fontSize: 10, color: '#64748b' }}>{r.remark}</td>
                  <td style={{ fontWeight: 700 }}>{r.guestName}</td>
                  <td style={{ fontSize: 10 }}>{r.company}</td>
                  <td style={{ fontSize: 10, fontWeight: 700, color: '#0284c7' }}>{r.gstNo}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#e2e8f0', fontWeight: 900, fontSize: 11 }}>
                <td colSpan={4} style={{ textAlign: 'center', padding: '8px 10px' }}>TOTAL:</td>
                <td style={{ textAlign: 'right' }}>{totalRent.toFixed(2)}</td>
                <td style={{ textAlign: 'right', color: '#0284c7' }}>{totalCgst.toFixed(2)}</td>
                <td style={{ textAlign: 'right', color: '#7c3aed' }}>{totalSgst.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>0</td>
                <td style={{ textAlign: 'right' }}>{totalLaundry.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>0</td>
                <td style={{ textAlign: 'right' }}>{totalRoomService.toFixed(2)}</td>
                <td style={{ textAlign: 'right', background: '#bbf7d0', color: '#15803d' }}>{totalNet.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>{totalAdvance.toFixed(2)}</td>
                <td style={{ textAlign: 'right', color: '#dc2626' }}>{totalDiscount.toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>0</td>
                <td style={{ textAlign: 'right', color: '#d97706' }}>{totalCash.toFixed(2)}</td>
                <td style={{ textAlign: 'right', color: '#0284c7' }}>{totalCard.toFixed(2)}</td>
                <td style={{ textAlign: 'right', color: '#7c3aed' }}>{totalOnline.toFixed(2)}</td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            Report dynamically aggregated from live PMS guest folios for {selectedMonth} &bull; Total Settled: ₹{totalSettled.toFixed(2)}
          </div>
          <button type="button" onClick={onClose} className="btn-pms-cancel">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
