import React, { useState, useMemo } from 'react';
import { PmsStore } from '../../services/pmsStore';

interface MonthlyRestaurantSaleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonthlyRestaurantSaleReportModal: React.FC<MonthlyRestaurantSaleReportModalProps> = ({ isOpen, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('JUNE 2026');
  const [activeSheet, setActiveSheet] = useState<'sheet1' | 'sheet2'>('sheet1');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const reportData = useMemo(() => {
    return PmsStore.getMonthlyRestaurantSaleReport(selectedMonth);
  }, [selectedMonth]);

  const company = PmsStore.getCompanyInfo();

  if (!isOpen) return null;

  const handleExportXlsx = () => {
    PmsStore.exportRestaurantSaleReportXlsx(selectedMonth);
  };

  const filteredRows = reportData.dailyRows.filter((r: any) =>
    searchQuery === '' || String(r.date).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pms-submodal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="pms-form-box"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 1280, width: '95vw', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Banner Header */}
        <div className="pms-form-banner banner-navy" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🍽️</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 14 }}>
                Monthly Restaurant POS Sale &amp; 5% GST Report &mdash; {selectedMonth}
              </div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>
                Exact Schema Mapped to RESTAURENT SALE REPORT JUNE MONTH.xlsx &bull; SAC 996331 &bull; {company.hotelName || company.tradeName || company.firmName}
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
              placeholder="Search date (e.g. 01-06-2026)..."
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
              <span>Export RESTAURANT SALE REPORT (XLSX)</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, padding: '12px 20px', background: '#f1f5f9' }}>
          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>TAXABLE F&amp;B VALUE (5%)</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
              ₹{reportData.grandTotals.sale5Percent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 9, color: '#16a34a', fontWeight: 600 }}>Pure Food &amp; Beverage Net</div>
          </div>

          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>CGST 2.5% + SGST 2.5%</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#0284c7', marginTop: 2 }}>
              ₹{(reportData.grandTotals.cgst + reportData.grandTotals.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 9, color: '#64748b' }}>Equal 2.5% Intra-state Split</div>
          </div>

          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>GROSS POS RESTAURANT SALE</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#16a34a', marginTop: 2 }}>
              ₹{reportData.grandTotals.saleTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 9, color: '#059669', fontWeight: 700 }}>Taxable + Taxes Collected</div>
          </div>

          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>DIGITAL PAYMENTS (UPI+CARD)</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#7c3aed', marginTop: 2 }}>
              ₹{(reportData.grandTotals.upi + reportData.grandTotals.creditCard).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 9, color: '#64748b' }}>QR UPI &amp; POS Card Swipes</div>
          </div>

          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>ROOM FOLIO TRANSFERS</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#d97706', marginTop: 2 }}>
              ₹{reportData.grandTotals.roomCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 9, color: '#64748b' }}>Billed to In-House Folios</div>
          </div>
        </div>

        {/* Sheet Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #cbd5e1', padding: '0 20px', background: '#f8fafc' }}>
          <button
            type="button"
            onClick={() => setActiveSheet('sheet1')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeSheet === 'sheet1' ? '3px solid #0284c7' : '3px solid transparent',
              color: activeSheet === 'sheet1' ? '#0284c7' : '#64748b',
              fontWeight: activeSheet === 'sheet1' ? 800 : 600,
              fontSize: 12,
              padding: '10px 18px',
              cursor: 'pointer',
              marginBottom: -2
            }}
          >
            📋 Sheet 1: Commercial Restaurant Sales ({filteredRows.length} Days)
          </button>
          <button
            type="button"
            onClick={() => setActiveSheet('sheet2')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeSheet === 'sheet2' ? '3px solid #0284c7' : '3px solid transparent',
              color: activeSheet === 'sheet2' ? '#0284c7' : '#64748b',
              fontWeight: activeSheet === 'sheet2' ? 800 : 600,
              fontSize: 12,
              padding: '10px 18px',
              cursor: 'pointer',
              marginBottom: -2
            }}
          >
            ☕ Sheet 2: Management &amp; Staff Complimentary Meals ({reportData.complimentarySales.length})
          </button>
        </div>

        {/* Table Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
          {activeSheet === 'sheet1' && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>
                SRI SAI VASUDEV RESIDENCY &bull; RESTAURANT SALE REPORT &bull; RAYAGADA, ODISHA
              </div>
              <table className="pms-table-compact" style={{ width: '100%', minWidth: 1000, fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#fff' }}>
                    <th style={{ width: 45, textAlign: 'center' }}>SL NO</th>
                    <th style={{ width: 95, textAlign: 'center' }}>DATE</th>
                    <th style={{ textAlign: 'right', background: '#1e3a8a' }}>SALE 5% (₹)</th>
                    <th style={{ textAlign: 'right', background: '#0284c7' }}>CGST 2.5% (₹)</th>
                    <th style={{ textAlign: 'right', background: '#7c3aed' }}>SGST 2.5% (₹)</th>
                    <th style={{ textAlign: 'right', background: '#15803d' }}>SALE TOTAL (₹)</th>
                    <th style={{ textAlign: 'right', color: '#d97706' }}>CASH (₹)</th>
                    <th style={{ textAlign: 'right', color: '#7c3aed' }}>UPI (₹)</th>
                    <th style={{ textAlign: 'right', color: '#0284c7' }}>CREDIT CARD (₹)</th>
                    <th style={{ textAlign: 'right', color: '#d97706' }}>ROOM CREDIT (₹)</th>
                    <th style={{ textAlign: 'right', background: '#334155', color: '#fff' }}>TOTAL (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
                        No restaurant sales records found for this period.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r: any, idx: number) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.slNo}</td>
                        <td style={{ textAlign: 'center', fontWeight: 800, color: '#0369a1' }}>{r.date}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.sale5Percent.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', color: '#0284c7' }}>{r.cgst.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', color: '#7c3aed' }}>{r.sgst.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 900, background: '#ecfdf5', color: '#15803d' }}>
                          {r.saleTotal.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right' }}>{r.cash > 0 ? r.cash.toFixed(2) : '-'}</td>
                        <td style={{ textAlign: 'right' }}>{r.upi > 0 ? r.upi.toFixed(2) : '-'}</td>
                        <td style={{ textAlign: 'right' }}>{r.creditCard > 0 ? r.creditCard.toFixed(2) : '-'}</td>
                        <td style={{ textAlign: 'right' }}>{r.roomCredit > 0 ? r.roomCredit.toFixed(2) : '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, background: '#f1f5f9' }}>
                          {r.totalSettled.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#e2e8f0', fontWeight: 900, fontSize: 11 }}>
                    <td colSpan={2} style={{ textAlign: 'center', padding: '8px 10px' }}>TOTAL:</td>
                    <td style={{ textAlign: 'right', color: '#1e3a8a' }}>{reportData.grandTotals.sale5Percent.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#0284c7' }}>{reportData.grandTotals.cgst.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#7c3aed' }}>{reportData.grandTotals.sgst.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', background: '#bbf7d0', color: '#15803d' }}>
                      {reportData.grandTotals.saleTotal.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>{reportData.grandTotals.cash.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{reportData.grandTotals.upi.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{reportData.grandTotals.creditCard.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{reportData.grandTotals.roomCredit.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', background: '#cbd5e1' }}>{reportData.grandTotals.totalSettled.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Tax Reconciliation Summary */}
              <div style={{ maxWidth: 500, marginTop: 14, background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#1e3a8a', marginBottom: 6 }}>
                  RESTAURANT FOOD TAX RECONCILIATION SUMMARY (SAC 996331)
                </div>
                <table className="pms-table-compact" style={{ width: '100%', fontSize: 11 }}>
                  <tbody>
                    <tr>
                      <td>Net Food Taxable (5% Slab):</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{reportData.taxReconciliation.taxableFood.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>CGST @ 2.5%:</td>
                      <td style={{ textAlign: 'right', color: '#0284c7', fontWeight: 700 }}>₹{reportData.taxReconciliation.cgst2_5.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>SGST @ 2.5%:</td>
                      <td style={{ textAlign: 'right', color: '#7c3aed', fontWeight: 700 }}>₹{reportData.taxReconciliation.sgst2_5.toFixed(2)}</td>
                    </tr>
                    <tr style={{ background: '#e2e8f0', fontWeight: 900 }}>
                      <td>Gross Commercial Restaurant Sale:</td>
                      <td style={{ textAlign: 'right', color: '#16a34a' }}>₹{reportData.taxReconciliation.totalFoodSale.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSheet === 'sheet2' && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>
                MANAGEMENT &amp; STAFF COMPLIMENTARY FOOD REGISTER &bull; ZERO TAX COMMERCIAL EXCLUSION
              </div>
              <table className="pms-table-compact" style={{ width: '100%', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#fff' }}>
                    <th style={{ width: 45, textAlign: 'center' }}>SL NO</th>
                    <th style={{ width: 95, textAlign: 'center' }}>DATE</th>
                    <th>COMPLIMENTARY NATURE / BENEFICIARY</th>
                    <th style={{ textAlign: 'right' }}>VALUE (₹)</th>
                    <th>AUTHORIZED BY</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.complimentarySales.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
                        No complimentary meals recorded.
                      </td>
                    </tr>
                  ) : (
                    reportData.complimentarySales.map((c: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{c.slNo}</td>
                        <td style={{ textAlign: 'center', fontWeight: 800, color: '#0369a1' }}>{c.date}</td>
                        <td style={{ fontWeight: 600 }}>{c.particulars}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>₹{c.amount.toFixed(2)}</td>
                        <td style={{ fontWeight: 700, color: '#64748b' }}>{c.authorizedBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            Auto-synchronizes real-time Vasudev Rasoi POS bills for {selectedMonth} &bull; SAC 996331 &bull; 5% GST
          </div>
          <button type="button" onClick={onClose} className="btn-pms-cancel">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
