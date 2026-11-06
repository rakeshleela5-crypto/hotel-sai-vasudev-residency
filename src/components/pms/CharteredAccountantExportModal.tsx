import React, { useState, useEffect, useMemo } from 'react';
import type { CaExportData } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';
import './pmsStyles.css';

interface CharteredAccountantExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

const YEAR_OPTIONS = [2025, 2026, 2027, 2028];

export const CharteredAccountantExportModal: React.FC<CharteredAccountantExportModalProps> = ({
  isOpen,
  onClose
}) => {
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = String(now.getMonth() + 1).padStart(2, '0');

  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const [activeTab, setActiveTab] = useState<'preview' | 'room_invoices' | 'food_bills' | 'tax_slabs' | 'payments' | 'expenses' | 'json_viewer'>('preview');
  
  const [exportData, setExportData] = useState<CaExportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [invoiceCategoryFilter, setInvoiceCategoryFilter] = useState<'All' | 'B2B' | 'B2C'>('All');

  const currentPeriodStr = `${selectedYear}-${selectedMonth}`;

  const monthName = useMemo(() => {
    const m = MONTH_OPTIONS.find(o => o.value === selectedMonth);
    return m ? m.label : selectedMonth;
  }, [selectedMonth]);

  const financialYearLabel = useMemo(() => {
    const mNum = parseInt(selectedMonth, 10);
    if (mNum >= 4) {
      return `FY ${selectedYear}-${String(selectedYear + 1).slice(-2)}`;
    } else {
      return `FY ${selectedYear - 1}-${String(selectedYear).slice(-2)}`;
    }
  }, [selectedYear, selectedMonth]);

  // Load CA Export Data from API with local fallback
  const loadData = async () => {
    setIsLoading(true);
    try {
      let data: CaExportData;
      try {
        data = await hotelApi.getCharteredAccountantExport(currentPeriodStr, selectedYear, selectedMonth);
      } catch {
        data = PmsStore.generateCharteredAccountantExport(currentPeriodStr);
      }
      setExportData(data);
    } catch (err) {
      console.warn('[CA Export Modal] Error compiling CA JSON export:', err);
      const fallback = PmsStore.generateCharteredAccountantExport(currentPeriodStr);
      setExportData(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, selectedYear, selectedMonth]);

  if (!isOpen) return null;

  // Compile JSON string for copy & download
  const compiledJsonString = exportData ? JSON.stringify(exportData, null, 2) : '';

  const handleDownloadJson = () => {
    if (!exportData) return;
    const gstin = exportData.export_metadata.hotel.gstin || '21AEKPP8689J1ZS';
    const filename = `CA_EXPORT_SAI_VASUDEV_${gstin}_${currentPeriodStr}.json`;
    const blob = new Blob([compiledJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    if (!compiledJsonString) return;
    navigator.clipboard.writeText(compiledJsonString);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const allRoomInvoices = [
    ...(exportData?.b2b_invoices || []),
    ...(exportData?.b2c_invoices || [])
  ];

  const filteredRoomInvoices = allRoomInvoices.filter(inv => {
    if (invoiceCategoryFilter === 'All') return true;
    return inv.invoice_category === invoiceCategoryFilter;
  });

  const preview = exportData?.preview_summary || {
    total_invoices_count: 0,
    room_invoices_count: 0,
    restaurant_bills_count: 0,
    b2b_invoices_count: 0,
    b2c_invoices_count: 0,
    total_taxable_value: 0,
    total_cgst: 0,
    total_sgst: 0,
    total_igst: 0,
    total_tax: 0,
    total_invoice_value: 0,
    total_operating_expenditures: 0,
    total_staff_payroll: 0,
    net_monthly_operating_profit: 0
  };

  const hotel = exportData?.export_metadata.hotel || {
    hotel_name: 'SRI SAI VASUDEV RESIDENCY',
    legal_name: 'PAIDISETTY MANMADHA RAO',
    gstin: '21AEKPP8689J1ZS',
    pan: 'AEKPP8689J',
    state: 'Odisha',
    state_code: '21'
  };

  return (
    <div className="pms-reg-modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="pms-reg-modal-window"
        style={{
          width: '95vw',
          maxWidth: '1280px',
          height: '92vh',
          maxHeight: '900px',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0f1d',
          color: '#f8fafc',
          borderRadius: 8,
          border: '1px solid #1e293b',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header
          style={{
            background: 'linear-gradient(90deg, #091322 0%, #0f233a 100%)',
            borderBottom: '2px solid #0284c7',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>⚖️</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 0.5, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                CHARTERED ACCOUNTANT (CA) MONTHLY JSON EXPORT ENGINE
                <span style={{ background: '#0284c7', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>
                  MODULE 6 &bull; GSTR / TALLY
                </span>
                {isLoading && (
                  <span style={{ background: '#334155', color: '#38bdf8', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                    🔄 Compiling Data...
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                {hotel.hotel_name} &bull; Legal: {hotel.legal_name} &bull; GSTIN: <strong style={{ color: '#facc15' }}>{hotel.gstin}</strong> &bull; PAN: {hotel.pan} &bull; Rayagada, Odisha ({hotel.state_code})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handleDownloadJson}
              disabled={isLoading || !exportData}
              style={{
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              title="One-click download of standardized JSON for Chartered Accountant"
            >
              <span>📥</span>
              <span>Export JSON for Chartered Accountant</span>
            </button>

            <button
              type="button"
              onClick={handleCopyJson}
              disabled={isLoading || !exportData}
              style={{
                background: '#334155',
                color: isCopied ? '#34d399' : '#38bdf8',
                border: '1px solid #475569',
                padding: '8px 14px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>{isCopied ? '✓' : '📋'}</span>
              <span>{isCopied ? 'Copied to Clipboard!' : 'Copy JSON'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                width: 32,
                height: 32,
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 14
              }}
              title="Close Modal"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Month & Year Selection Bar */}
        <div
          style={{
            background: '#0d1527',
            padding: '10px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            flexShrink: 0
          }}
        >
          {/* Period Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
              📅 Return Accounting Period:
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Month:</label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#fff',
                  borderRadius: 4,
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                {MONTH_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label} ({o.value})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Year:</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#fff',
                  borderRadius: 4,
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                {YEAR_OPTIONS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div style={{ background: '#1e293b', padding: '4px 10px', borderRadius: 4, border: '1px solid #334155' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981' }}>
                {monthName} {selectedYear} &bull; {financialYearLabel}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', background: '#1e293b', padding: 3, borderRadius: 6, border: '1px solid #334155' }}>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              style={{
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'preview' ? '#0284c7' : 'transparent',
                color: activeTab === 'preview' ? '#ffffff' : '#94a3b8'
              }}
            >
              📊 Summary Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('room_invoices')}
              style={{
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'room_invoices' ? '#0284c7' : 'transparent',
                color: activeTab === 'room_invoices' ? '#ffffff' : '#94a3b8'
              }}
            >
              🏢 Room Invoices ({preview.room_invoices_count})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('food_bills')}
              style={{
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'food_bills' ? '#0284c7' : 'transparent',
                color: activeTab === 'food_bills' ? '#ffffff' : '#94a3b8'
              }}
            >
              🍽️ Food Bills ({preview.restaurant_bills_count})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tax_slabs')}
              style={{
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'tax_slabs' ? '#0284c7' : 'transparent',
                color: activeTab === 'tax_slabs' ? '#ffffff' : '#94a3b8'
              }}
            >
              ⚖️ GST Slabs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              style={{
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'payments' ? '#0284c7' : 'transparent',
                color: activeTab === 'payments' ? '#ffffff' : '#94a3b8'
              }}
            >
              💳 Payment Ledger
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              style={{
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'expenses' ? '#0284c7' : 'transparent',
                color: activeTab === 'expenses' ? '#ffffff' : '#94a3b8'
              }}
            >
              💸 Expenditures ({exportData?.daily_expenditures?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('json_viewer')}
              style={{
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'json_viewer' ? '#8b5cf6' : 'transparent',
                color: activeTab === 'json_viewer' ? '#ffffff' : '#94a3b8'
              }}
            >
              📜 Raw JSON Viewer
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#060b17' }}>

          {/* ========================================================================= */}
          {/* TAB 1: SUMMARY PREVIEW (ON-SCREEN PREVIEW AS REQUIRED)                   */}
          {/* ========================================================================= */}
          {activeTab === 'preview' && (
            <div>
              {/* Primary 4 Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
                <div style={{ background: '#0f172a', padding: 14, borderRadius: 6, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Invoices Compiled</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>
                    {preview.total_invoices_count}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                    {preview.room_invoices_count} Room Invoices &bull; {preview.restaurant_bills_count} Food Bills
                  </div>
                </div>

                <div style={{ background: '#0f172a', padding: 14, borderRadius: 6, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Taxable Value</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#facc15', marginTop: 4 }}>
                    ₹{preview.total_taxable_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                    Base revenue before GST output tax
                  </div>
                </div>

                <div style={{ background: '#0f172a', padding: 14, borderRadius: 6, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Tax (Output GST)</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#f43f5e', marginTop: 4 }}>
                    ₹{preview.total_tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                    CGST: ₹{preview.total_cgst.toFixed(2)} &bull; SGST: ₹{preview.total_sgst.toFixed(2)}
                  </div>
                </div>

                <div style={{ background: '#0f172a', padding: 14, borderRadius: 6, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Gross Invoice Value</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981', marginTop: 4 }}>
                    ₹{preview.total_invoice_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                    Gross collections across all categories
                  </div>
                </div>
              </div>

              {/* Secondary 4 Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                <div style={{ background: '#0f172a', padding: 12, borderRadius: 6, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>B2B Corporate Invoices</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#a78bfa', marginTop: 2 }}>
                    {preview.b2b_invoices_count}
                  </div>
                  <div style={{ fontSize: 9, color: '#64748b' }}>With verified customer GSTIN</div>
                </div>

                <div style={{ background: '#0f172a', padding: 12, borderRadius: 6, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>B2C Consumer Invoices</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
                    {preview.b2c_invoices_count}
                  </div>
                  <div style={{ fontSize: 9, color: '#64748b' }}>Unregistered guest folios</div>
                </div>

                <div style={{ background: '#0f172a', padding: 12, borderRadius: 6, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Operating Expenses</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fb923c', marginTop: 2 }}>
                    ₹{preview.total_operating_expenditures.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 9, color: '#64748b' }}>From Module 2 EOD Tracker</div>
                </div>

                <div style={{ background: '#0f172a', padding: 12, borderRadius: 6, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Net Operating Profit (EBITDA)</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: preview.net_monthly_operating_profit >= 0 ? '#34d399' : '#f87171', marginTop: 2 }}>
                    ₹{preview.net_monthly_operating_profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 9, color: '#64748b' }}>Revenue - (Expenses + Payroll)</div>
                </div>
              </div>

              {/* Tax Slabs Overview in Preview */}
              <div style={{ background: '#0f172a', borderRadius: 6, border: '1px solid #1e293b', padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>⚖️ GST Output Tax Slabs (HSN / SAC Grouping)</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Odisha Intra-State Supply (POS: 21)</span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px' }}>SAC Code</th>
                      <th style={{ padding: '8px 10px' }}>Description</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>GST Rate</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Invoices</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Taxable Value (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>CGST (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>SGST (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Gross Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(exportData?.tax_slabs_summary || []).map((slab, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                          {slab.sac_code}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#f8fafc' }}>
                          {slab.description}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800, color: '#facc15' }}>
                          {slab.gst_rate_pct}%
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {slab.invoices_count}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                          ₹{slab.taxable_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f43f5e' }}>
                          ₹{slab.cgst_amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f43f5e' }}>
                          ₹{slab.sgst_amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                          ₹{slab.gross_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#1e293b', borderTop: '2px solid #334155', fontWeight: 900 }}>
                      <td colSpan={4} style={{ padding: '8px 10px', textAlign: 'right' }}>Consolidated Monthly Total:</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#facc15' }}>
                        ₹{preview.total_taxable_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f43f5e' }}>
                        ₹{preview.total_cgst.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f43f5e' }}>
                        ₹{preview.total_sgst.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10b981' }}>
                        ₹{preview.total_invoice_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Chartered Accountant Download Banner */}
              <div
                style={{
                  background: 'linear-gradient(90deg, #1e1b4b 0%, #0f172a 100%)',
                  padding: 18,
                  borderRadius: 6,
                  border: '1px solid #6366f1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#a5b4fc' }}>
                    READY FOR CHARTERED ACCOUNTANT TAX AUDIT &amp; GSTR-1 FILING
                  </div>
                  <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>
                    Click below to download the compiled JSON package. It contains room folios, food bills, B2B customer GSTINs, SAC codes, payment mode splits, and EOD expenditures.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)'
                  }}
                >
                  📥 Download {currentPeriodStr} JSON Pack
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ROOM INVOICES TABLE (B2B & B2C)                                   */}
          {/* ========================================================================= */}
          {activeTab === 'room_invoices' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#f8fafc' }}>
                    🏢 Room Accommodation Invoices (SAC 996311)
                  </span>
                  <div style={{ display: 'flex', background: '#1e293b', padding: 2, borderRadius: 4, border: '1px solid #334155' }}>
                    <button
                      type="button"
                      onClick={() => setInvoiceCategoryFilter('All')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: invoiceCategoryFilter === 'All' ? '#0284c7' : 'transparent',
                        color: invoiceCategoryFilter === 'All' ? '#fff' : '#94a3b8'
                      }}
                    >
                      All ({allRoomInvoices.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceCategoryFilter('B2B')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: invoiceCategoryFilter === 'B2B' ? '#a78bfa' : 'transparent',
                        color: invoiceCategoryFilter === 'B2B' ? '#fff' : '#94a3b8'
                      }}
                    >
                      B2B With GSTIN ({exportData?.b2b_invoices?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceCategoryFilter('B2C')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 3,
                        fontSize: 10,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: invoiceCategoryFilter === 'B2C' ? '#0284c7' : 'transparent',
                        color: invoiceCategoryFilter === 'B2C' ? '#fff' : '#94a3b8'
                      }}
                    >
                      B2C Consumer ({exportData?.b2c_invoices?.length || 0})
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  Showing {filteredRoomInvoices.length} of {allRoomInvoices.length} room folios
                </div>
              </div>

              <div style={{ background: '#0f172a', borderRadius: 6, border: '1px solid #1e293b', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', width: 110 }}>Invoice #</th>
                      <th style={{ padding: '8px 10px', width: 90 }}>Date</th>
                      <th style={{ padding: '8px 10px', width: 90 }}>Room</th>
                      <th style={{ padding: '8px 10px' }}>Guest / Firm Name</th>
                      <th style={{ padding: '8px 10px', width: 140 }}>Customer GSTIN</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: 110 }}>Taxable (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: 90 }}>CGST (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: 90 }}>SGST (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: 110 }}>Total (₹)</th>
                      <th style={{ padding: '8px 10px', width: 100 }}>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoomInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                          No room checkout invoices found for {monthName} {selectedYear}.
                        </td>
                      </tr>
                    ) : (
                      filteredRoomInvoices.map((inv, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                            {inv.invoice_no}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#cbd5e1' }}>
                            {inv.invoice_date}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ fontWeight: 800, color: '#fff' }}>Room {inv.room_no}</span>
                            <div style={{ fontSize: 10, color: '#64748b' }}>{inv.room_category} ({inv.nights}N)</div>
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 700 }}>
                            {inv.customer_firm_name || inv.guest_name}
                            {inv.guest_phone && <div style={{ fontSize: 10, color: '#64748b' }}>{inv.guest_phone}</div>}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            {inv.customer_gstin ? (
                              <span style={{ fontFamily: 'monospace', color: '#a78bfa', fontWeight: 800, background: '#2e1065', padding: '2px 6px', borderRadius: 3, fontSize: 10 }}>
                                {inv.customer_gstin}
                              </span>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: 10 }}>URP (Consumer)</span>
                            )}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                            ₹{inv.taxable_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f43f5e' }}>
                            ₹{inv.cgst_amount.toFixed(2)}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f43f5e' }}>
                            ₹{inv.sgst_amount.toFixed(2)}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                            ₹{inv.total_invoice_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '8px 10px', fontSize: 11, color: '#cbd5e1' }}>
                            {inv.payment_mode}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: RESTAURANT FOOD BILLS TABLE                                       */}
          {/* ========================================================================= */}
          {activeTab === 'food_bills' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#f8fafc' }}>
                  🍽️ Vasudev Rasoi Restaurant &amp; Room Service Food Bills (SAC 996331 &bull; 5% GST)
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  Total {exportData?.restaurant_food_bills?.length || 0} Settled Bills
                </span>
              </div>

              <div style={{ background: '#0f172a', borderRadius: 6, border: '1px solid #1e293b', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', width: 110 }}>Bill #</th>
                      <th style={{ padding: '8px 10px', width: 90 }}>Date</th>
                      <th style={{ padding: '8px 10px', width: 70 }}>Time</th>
                      <th style={{ padding: '8px 10px', width: 100 }}>Room / Table</th>
                      <th style={{ padding: '8px 10px' }}>Guest Name</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: 110 }}>Taxable (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: 80 }}>CGST 2.5%</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: 80 }}>SGST 2.5%</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: 110 }}>Net Bill (₹)</th>
                      <th style={{ padding: '8px 10px', width: 120 }}>Settlement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!exportData?.restaurant_food_bills || exportData.restaurant_food_bills.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                          No food bills found for {monthName} {selectedYear}.
                        </td>
                      </tr>
                    ) : (
                      exportData.restaurant_food_bills.map((fb, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                            {fb.bill_no}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#cbd5e1' }}>
                            {fb.bill_date}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {fb.bill_time}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 700 }}>
                            {fb.room_or_table_no}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            {fb.guest_name}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                            ₹{fb.taxable_value.toFixed(2)}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f43f5e' }}>
                            ₹{fb.cgst_amount.toFixed(2)}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f43f5e' }}>
                            ₹{fb.sgst_amount.toFixed(2)}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                            ₹{fb.net_bill_amount.toFixed(2)}
                          </td>
                          <td style={{ padding: '8px 10px', fontSize: 11, color: '#cbd5e1' }}>
                            {fb.settlement_type}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: GST TAX SLABS & HSN/SAC SUMMARY                                   */}
          {/* ========================================================================= */}
          {activeTab === 'tax_slabs' && (
            <div>
              <div style={{ background: '#0f172a', borderRadius: 6, border: '1px solid #1e293b', padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', marginBottom: 12 }}>
                  Official HSN / SAC GST Summary (GSTR-1 Table 12 Compliant)
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>SAC / HSN Code</th>
                      <th style={{ padding: '10px 12px' }}>Service Category Description</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>GST Rate</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>CGST %</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>SGST %</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Taxable Value (₹)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>CGST (₹)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>SGST (₹)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Gross Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(exportData?.tax_slabs_summary || []).map((slab, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 800 }}>
                          {slab.sac_code}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#f8fafc' }}>
                          {slab.description}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: '#facc15' }}>
                          {slab.gst_rate_pct}%
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#f43f5e' }}>
                          {slab.cgst_rate_pct}%
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#f43f5e' }}>
                          {slab.sgst_rate_pct}%
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                          ₹{slab.taxable_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#f43f5e' }}>
                          ₹{slab.cgst_amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#f43f5e' }}>
                          ₹{slab.sgst_amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                          ₹{slab.gross_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: PAYMENT MODES SUMMARY                                             */}
          {/* ========================================================================= */}
          {activeTab === 'payments' && (
            <div>
              <div style={{ background: '#0f172a', borderRadius: 6, border: '1px solid #1e293b', padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', marginBottom: 12 }}>
                  Monthly Gross Revenue Collections by Payment Mode &amp; Banking Channel
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                  {Object.entries(exportData?.payment_modes_summary || {}).map(([mode, amt], idx) => (
                    <div key={idx} style={{ background: '#1e293b', padding: 14, borderRadius: 6, border: '1px solid #334155' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                        {mode === 'Cash' ? '💵 Cash in Hand' : mode === 'UPI' ? '📱 UPI / QR Scan' : mode === 'Card' ? '💳 EDC Credit/Debit Card' : mode === 'Bank Transfer' ? '🏦 Direct Bank NEFT' : '🏨 Room Folio Transfers'}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981', marginTop: 4 }}>
                        ₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                        {preview.total_invoice_value > 0 ? `${((amt / preview.total_invoice_value) * 100).toFixed(1)}% of total` : '0%'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: EOD EXPENDITURES (MODULE 2 INTEGRATION)                           */}
          {/* ========================================================================= */}
          {activeTab === 'expenses' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#f8fafc' }}>
                  💸 Monthly End-of-Day (EOD) Expenditures &amp; Granular Subcategories
                </span>
                <span style={{ fontSize: 11, color: '#fb923c', fontWeight: 800 }}>
                  Total Expenses: ₹{preview.total_operating_expenditures.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ background: '#0f172a', borderRadius: 6, border: '1px solid #1e293b', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', width: 130 }}>Voucher #</th>
                      <th style={{ padding: '8px 10px', width: 90 }}>Date</th>
                      <th style={{ padding: '8px 10px', width: 120 }}>Category</th>
                      <th style={{ padding: '8px 10px', width: 140 }}>Subcategory</th>
                      <th style={{ padding: '8px 10px' }}>Paid To / Vendor</th>
                      <th style={{ padding: '8px 10px', width: 100 }}>Payment Mode</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: 110 }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!exportData?.daily_expenditures || exportData.daily_expenditures.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                          No daily expenditures recorded for {monthName} {selectedYear}.
                        </td>
                      </tr>
                    ) : (
                      exportData.daily_expenditures.map((exp, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#f59e0b', fontWeight: 700 }}>
                            {exp.voucher_no}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#cbd5e1' }}>
                            {exp.date}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 700 }}>
                            {exp.category}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#38bdf8' }}>
                            {exp.subcategory}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            {exp.paid_to}
                            {exp.receipt_ref && <span style={{ fontSize: 10, color: '#64748b', marginLeft: 6 }}>({exp.receipt_ref})</span>}
                          </td>
                          <td style={{ padding: '8px 10px', fontSize: 11 }}>
                            {exp.payment_mode}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#f87171' }}>
                            ₹{Number(exp.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: RAW JSON VIEWER & CODE INSPECTOR                                  */}
          {/* ========================================================================= */}
          {activeTab === 'json_viewer' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa' }}>
                  📜 Standardized JSON Document for Chartered Accountant
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    style={{
                      background: '#1e293b',
                      color: isCopied ? '#34d399' : '#38bdf8',
                      border: '1px solid #334155',
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isCopied ? '✓ Copied' : '📋 Copy JSON'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    style={{
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      padding: '4px 12px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    📥 Download JSON File
                  </button>
                </div>
              </div>

              <div
                style={{
                  background: '#030712',
                  border: '1px solid #1e293b',
                  borderRadius: 6,
                  padding: 16,
                  maxHeight: '480px',
                  overflowY: 'auto'
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: 11,
                    lineHeight: 1.5,
                    color: '#34d399',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}
                >
                  {compiledJsonString || '// Compiling JSON schema...'}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <footer
          style={{
            background: '#091322',
            borderTop: '1px solid #1e293b',
            padding: '10px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11,
            color: '#94a3b8',
            flexShrink: 0
          }}
        >
          <div>
            Sri Sai Vasudev Residency &bull; Module 6 CA JSON Export &bull; Rayagada Circle &bull; Tally / GSTR-1 Offline Tool Compliant
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #334155',
                padding: '6px 16px',
                borderRadius: 4,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownloadJson}
              style={{
                background: '#059669',
                color: '#fff',
                border: 'none',
                padding: '6px 18px',
                borderRadius: 4,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              📥 Export JSON for Chartered Accountant
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

