import React, { useState, useMemo } from 'react';
import type { 
  PmsGstReportTab, 
  PmsB2BInvoiceRecord, 
  PmsB2CInvoiceRecord, 
  PmsConsolidatedGstItem 
} from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import './pmsStyles.css';

interface GstReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PmsGstReportTab;
  onLaunchReportAction?: (actionKey: string) => void;
}

export const GstReportsModal: React.FC<GstReportsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'consolidated',
  onLaunchReportAction
}) => {
  const [activeTab, setActiveTab] = useState<PmsGstReportTab>(initialTab);
  const [fromDate, setFromDate] = useState<string>('01-06-2025');
  const [toDate, setToDate] = useState<string>('30-06-2025');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Sync initial tab when changed
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const b2bData: PmsB2BInvoiceRecord[] = PmsStore.getB2BReport(fromDate, toDate);
  const b2cData: PmsB2CInvoiceRecord[] = PmsStore.getB2CReport(fromDate, toDate);
  const consolidatedData: PmsConsolidatedGstItem[] = PmsStore.getConsolidatedGstReport(fromDate, toDate);
  const dashboardButtons = PmsStore.getReportDashboardButtons();
  const companyInfo = PmsStore.getCompanyInfo();

  // Filtered views based on search term
  const filteredB2B = b2bData.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.gstin.toLowerCase().includes(term) ||
      item.receiverName.toLowerCase().includes(term) ||
      item.invoiceNumber.toLowerCase().includes(term) ||
      item.placeOfSupply.toLowerCase().includes(term)
    );
  });

  const filteredB2C = b2cData.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.type.toLowerCase().includes(term) ||
      item.placeOfSupply.toLowerCase().includes(term) ||
      String(item.rate).includes(term)
    );
  });

  const filteredConsolidated = consolidatedData.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.voucherNo.toLowerCase().includes(term) ||
      item.guestName.toLowerCase().includes(term) ||
      item.roomNoOrTable.toLowerCase().includes(term) ||
      item.mobile.toLowerCase().includes(term) ||
      item.firmName.toLowerCase().includes(term) ||
      item.gstin.toLowerCase().includes(term) ||
      item.city.toLowerCase().includes(term) ||
      item.state.toLowerCase().includes(term)
    );
  });

  // Calculate totals for Consolidated
  const consolidatedTotals = useMemo(() => {
    return filteredConsolidated.reduce((acc, row) => ({
      sgst: acc.sgst + row.sgst,
      cgst: acc.cgst + row.cgst,
      igst: acc.igst + row.igst,
      taxable: acc.taxable + row.taxable,
      totalGst: acc.totalGst + row.totalGst,
      billAmount: acc.billAmount + row.billAmount,
      advanceOrDiscount: acc.advanceOrDiscount + row.advanceOrDiscount,
      netPayAmount: acc.netPayAmount + row.netPayAmount
    }), {
      sgst: 0,
      cgst: 0,
      igst: 0,
      taxable: 0,
      totalGst: 0,
      billAmount: 0,
      advanceOrDiscount: 0,
      netPayAmount: 0
    });
  }, [filteredConsolidated]);

  // Calculate totals for B2B
  const b2bTotals = useMemo(() => {
    return filteredB2B.reduce((acc, row) => ({
      invoiceValue: acc.invoiceValue + row.invoiceValue,
      taxableValue: acc.taxableValue + row.taxableValue,
      cessAmount: acc.cessAmount + row.cessAmount
    }), {
      invoiceValue: 0,
      taxableValue: 0,
      cessAmount: 0
    });
  }, [filteredB2B]);

  // Calculate totals for B2C
  const b2cTotals = useMemo(() => {
    return filteredB2C.reduce((acc, row) => ({
      taxableValue: acc.taxableValue + row.taxableValue,
      cessAmount: acc.cessAmount + row.cessAmount
    }), {
      taxableValue: 0,
      cessAmount: 0
    });
  }, [filteredB2C]);

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleCopy = () => {
    let text = '';
    if (activeTab === 'b2b') {
      text = PmsStore.exportGstCsv('b2b', fromDate, toDate);
    } else if (activeTab === 'b2c') {
      text = PmsStore.exportGstCsv('b2c', fromDate, toDate);
    } else if (activeTab === 'consolidated') {
      text = PmsStore.exportGstCsv('consolidated', fromDate, toDate);
    }
    if (text) {
      navigator.clipboard.writeText(text);
      showToast('Data copied to clipboard in CSV format!');
    }
  };

  const handleDownloadCsv = () => {
    if (activeTab === 'dashboard') return;
    const csvContent = PmsStore.exportGstCsv(activeTab, fromDate, toDate);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GST_Report_${activeTab}_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded GST_Report_${activeTab}.csv successfully!`);
  };

  const handleDownloadExcel = () => {
    // Generate native CSV that opens automatically in Microsoft Excel 2010/2016/365
    handleDownloadCsv();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendToCaWhatsApp = () => {
    const config = PmsStore.getWhatsAppConfig();
    const caMobile = config.ownerMobile || '7999663696';
    const message = 
      `*GST Tax Return Summary - ${companyInfo.firmName}*\n` +
      `*Report Period:* ${fromDate} to ${toDate}\n` +
      `*GSTIN:* ${companyInfo.gstNo || '27AABCU9603R1ZX'}\n\n` +
      `*1. B2B Sales (Registered):* ₹${b2bTotals.invoiceValue.toFixed(2)} (Taxable: ₹${b2bTotals.taxableValue.toFixed(2)})\n` +
      `*2. B2C Sales (Unregistered):* Taxable ₹${b2cTotals.taxableValue.toFixed(2)}\n` +
      `*3. Total Tax Liability:* CGST: ₹${consolidatedTotals.cgst.toFixed(2)} | SGST: ₹${consolidatedTotals.sgst.toFixed(2)} | IGST: ₹${consolidatedTotals.igst.toFixed(2)}\n` +
      `*Total Tax Payable:* ₹${consolidatedTotals.totalGst.toFixed(2)}\n` +
      `*Total Turnover (Gross):* ₹${consolidatedTotals.billAmount.toFixed(2)}\n\n` +
      `_Generated via Hotel Sai Vasudev Residency ERP. Please file GSTR-1 and GSTR-3B accordingly._`;

    const cleanMobile = caMobile.replace(/\D/g, '');
    const mobileWithCode = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    const url = `https://api.whatsapp.com/send?phone=${mobileWithCode}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="pms-modal-backdrop" 
      style={{ zIndex: 12000 }}
      onClick={onClose}
    >
      <div 
        className="pms-modal-container" 
        style={{ width: '96%', maxWidth: 1400, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        
        {/* Top Header matching Video 28 Frames 0100, 0110, 0170, 0200 */}
        <div style={{
          background: '#1e293b',
          color: '#ffffff',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderBottom: '2px solid #0284c7'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📜</span>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '0.5px' }}>
                {activeTab === 'consolidated' && 'Room & Food Bill GST Report (Consolidated Tax Audit Register)'}
                {activeTab === 'b2b' && 'Room Check Out B2B Register (Only GST Customer Invoice)'}
                {activeTab === 'b2c' && 'B2C Register (Only Without GST Customer Invoice)'}
                {activeTab === 'dashboard' && 'Hotel & Restaurant Master Report Dashboard'}
              </h2>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>
              {activeTab === 'consolidated' && 'pms.hotelsai-vasudev.com/room_food_gstreport_pageshow & /roomfood_gstreport'}
              {activeTab === 'b2b' && 'pms.hotelsai-vasudev.com/b2bsales_pageshow & /b2bsales (GSTR-1 Table 4)'}
              {activeTab === 'b2c' && 'pms.hotelsai-vasudev.com/b2csales (GSTR-1 Table 7)'}
              {activeTab === 'dashboard' && 'pms.hotelsai-vasudev.com/report_dashboard'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handleSendToCaWhatsApp}
              style={{
                background: '#25D366',
                color: '#ffffff',
                border: 'none',
                borderRadius: 4,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              title="Share monthly GST return summary with Chartered Accountant via WhatsApp"
            >
              <span>📲</span>
              <span>Send Summary to CA</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 800,
                borderRadius: 4,
                width: 28,
                height: 28,
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation matching Video 28 Suite */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          borderBottom: '1px solid #cbd5e1',
          padding: '0 16px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('consolidated')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'consolidated' ? '3px solid #16a34a' : '3px solid transparent',
              background: 'transparent',
              fontWeight: activeTab === 'consolidated' ? 800 : 600,
              color: activeTab === 'consolidated' ? '#16a34a' : '#64748b',
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>📜</span>
            <span>Room &amp; Food Bill GST (Consolidated)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('b2b')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'b2b' ? '3px solid #0284c7' : '3px solid transparent',
              background: 'transparent',
              fontWeight: activeTab === 'b2b' ? 800 : 600,
              color: activeTab === 'b2b' ? '#0284c7' : '#64748b',
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>🏢</span>
            <span>B2B Register (With GST No)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('b2c')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'b2c' ? '3px solid #dc2626' : '3px solid transparent',
              background: 'transparent',
              fontWeight: activeTab === 'b2c' ? 800 : 600,
              color: activeTab === 'b2c' ? '#dc2626' : '#64748b',
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>👥</span>
            <span>B2C Register (Without GST)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'dashboard' ? '3px solid #f59e0b' : '3px solid transparent',
              background: 'transparent',
              fontWeight: activeTab === 'dashboard' ? 800 : 600,
              color: activeTab === 'dashboard' ? '#d97706' : '#64748b',
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>📊</span>
            <span>Master Report Hub ({dashboardButtons.length} Reports)</span>
          </button>
        </div>

        {/* Toast Feedback */}
        {copiedToast && (
          <div style={{
            background: '#16a34a',
            color: '#fff',
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 700,
            textAlign: 'center'
          }}>
            {copiedToast}
          </div>
        )}

        {/* Filter Bar & Export Toolbar matching Frame 0110, 0170, 0200 */}
        {activeTab !== 'dashboard' && (
          <div style={{
            padding: '10px 20px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            {/* Date Pickers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>From Date:</label>
                <input
                  type="text"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholder="DD-MM-YYYY"
                  style={{
                    padding: '5px 8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 4,
                    fontSize: 12,
                    width: 105,
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>To Date:</label>
                <input
                  type="text"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholder="DD-MM-YYYY"
                  style={{
                    padding: '5px 8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 4,
                    fontSize: 12,
                    width: 105,
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <button
                type="button"
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '5px 16px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                OK
              </button>

              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                <button
                  type="button"
                  onClick={() => { setFromDate('01-06-2025'); setToDate('30-06-2025'); }}
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 3, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: '#475569' }}
                >
                  June 2025 (Demo)
                </button>
                <button
                  type="button"
                  onClick={() => { setFromDate('01-07-2025'); setToDate('31-07-2025'); }}
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 3, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: '#475569' }}
                >
                  July 2025
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const d = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
                    setFromDate(`01-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`);
                    setToDate(d);
                  }}
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 3, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: '#475569' }}
                >
                  Current Month
                </button>
              </div>
            </div>

            {/* Export Toolbar matching Frame 0110: Copy, CSV, Excel, PDF, Print */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{ background: '#f8fafc', border: 'none', borderRight: '1px solid #cbd5e1', padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#334155' }}
                  title="Copy table to clipboard"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  style={{ background: '#f8fafc', border: 'none', borderRight: '1px solid #cbd5e1', padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#334155' }}
                  title="Export to CSV"
                >
                  CSV
                </button>
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  style={{ background: '#f8fafc', border: 'none', borderRight: '1px solid #cbd5e1', padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#16a34a' }}
                  title="Export to Excel 2010 file"
                >
                  Excel
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  style={{ background: '#f8fafc', border: 'none', borderRight: '1px solid #cbd5e1', padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#334155' }}
                  title="Save or view as PDF"
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  style={{ background: '#f8fafc', border: 'none', padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#334155' }}
                  title="Print Report"
                >
                  Print
                </button>
              </div>

              {/* Search Field */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Search:</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter records..."
                  style={{
                    padding: '5px 8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 4,
                    fontSize: 12,
                    width: 140
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Body / Tab Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#f8fafc' }}>
          
          {/* TAB 1: Consolidated Room & Food Bill GST Report (Frames 0200, 0210, 0230, 0270) */}
          {activeTab === 'consolidated' && (
            <div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', maxHeight: '58vh' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left', minWidth: 1500 }}>
                    <thead>
                      <tr style={{ background: '#1e293b', color: '#ffffff', position: 'sticky', top: 0, zIndex: 10 }}>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', width: 40, textAlign: 'center' }}>S.No</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 110 }}>Voucher No</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 80 }}>Room/Table</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 120 }}>Guest Name</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 100 }}>Address</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 80 }}>City</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 80 }}>State</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 90 }}>Mobile</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 110 }}>Firm Name</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 110 }}>GST No</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 80 }}>Check In</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 80 }}>Invoice Date</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', width: 50, textAlign: 'center' }}>Days</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 70 }}>Type</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', width: 50, textAlign: 'right' }}>GST %</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', width: 65, textAlign: 'right' }}>SGST</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', width: 65, textAlign: 'right' }}>CGST</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', width: 65, textAlign: 'right' }}>IGST</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 80, textAlign: 'right', background: '#0f172a' }}>Taxable</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 75, textAlign: 'right' }}>Total GST</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 80, textAlign: 'right' }}>Bill Amt</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 75, textAlign: 'right' }}>Advance/Disc</th>
                        <th style={{ padding: '8px 6px', borderBottom: '2px solid #0284c7', minWidth: 85, textAlign: 'right', background: '#0f172a' }}>Net Pay Amt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredConsolidated.length === 0 ? (
                        <tr>
                          <td colSpan={23} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                            No GST transactions found for the selected date range.
                          </td>
                        </tr>
                      ) : (
                        filteredConsolidated.map((row, idx) => (
                          <tr key={row.sNo} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '6px', textAlign: 'center', color: '#64748b' }}>{row.sNo}</td>
                            <td style={{ padding: '6px', fontWeight: 700, color: '#0284c7', fontFamily: 'monospace' }}>{row.voucherNo}</td>
                            <td style={{ padding: '6px' }}>{row.roomNoOrTable}</td>
                            <td style={{ padding: '6px', fontWeight: 600 }}>{row.guestName}</td>
                            <td style={{ padding: '6px', color: '#64748b' }}>{row.address}</td>
                            <td style={{ padding: '6px' }}>{row.city}</td>
                            <td style={{ padding: '6px' }}>{row.state}</td>
                            <td style={{ padding: '6px', fontFamily: 'monospace' }}>{row.mobile}</td>
                            <td style={{ padding: '6px', fontWeight: row.firmName ? 600 : 400 }}>{row.firmName || '-'}</td>
                            <td style={{ padding: '6px', fontFamily: 'monospace', color: row.gstin ? '#16a34a' : '#94a3b8' }}>{row.gstin || '-'}</td>
                            <td style={{ padding: '6px' }}>{row.checkInDate}</td>
                            <td style={{ padding: '6px' }}>{row.invoiceDate}</td>
                            <td style={{ padding: '6px', textAlign: 'center' }}>{row.totalDays}</td>
                            <td style={{ padding: '6px' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: 3,
                                fontSize: 10,
                                fontWeight: 700,
                                background: row.type === 'Room Bill' ? '#eff6ff' : '#fef3c7',
                                color: row.type === 'Room Bill' ? '#1d4ed8' : '#b45309'
                              }}>
                                {row.type}
                              </span>
                            </td>
                            <td style={{ padding: '6px', textAlign: 'right' }}>{row.gstRate.toFixed(2)}</td>
                            <td style={{ padding: '6px', textAlign: 'right' }}>{row.sgst.toFixed(2)}</td>
                            <td style={{ padding: '6px', textAlign: 'right' }}>{row.cgst.toFixed(2)}</td>
                            <td style={{ padding: '6px', textAlign: 'right' }}>{row.igst.toFixed(2)}</td>
                            <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700, background: '#f1f5f9' }}>{row.taxable.toFixed(2)}</td>
                            <td style={{ padding: '6px', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>{row.totalGst.toFixed(2)}</td>
                            <td style={{ padding: '6px', textAlign: 'right' }}>{row.billAmount.toFixed(2)}</td>
                            <td style={{ padding: '6px', textAlign: 'right', color: row.advanceOrDiscount < 0 ? '#dc2626' : '#64748b' }}>
                              {row.advanceOrDiscount.toFixed(2)}
                            </td>
                            <td style={{ padding: '6px', textAlign: 'right', fontWeight: 800, background: '#f1f5f9', color: '#0f172a' }}>
                              {row.netPayAmount.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {/* Bottom Totals Footer matching Video 28 Frame 0210 */}
                    <tfoot>
                      <tr style={{ background: '#0f172a', color: '#ffffff', fontWeight: 800, position: 'sticky', bottom: 0, zIndex: 10 }}>
                        <td colSpan={14} style={{ padding: '8px 12px', textAlign: 'right', letterSpacing: '0.5px' }}>
                          Total:
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', color: '#38bdf8' }}>{consolidatedTotals.sgst.toFixed(2)}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', color: '#38bdf8' }}>{consolidatedTotals.cgst.toFixed(2)}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', color: '#38bdf8' }}>{consolidatedTotals.igst.toFixed(2)}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', color: '#facc15' }}>{consolidatedTotals.taxable.toFixed(2)}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', color: '#4ade80' }}>{consolidatedTotals.totalGst.toFixed(2)}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right' }}>{consolidatedTotals.billAmount.toFixed(2)}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', color: '#f87171' }}>{consolidatedTotals.advanceOrDiscount.toFixed(2)}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', color: '#4ade80' }}>{consolidatedTotals.netPayAmount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: B2B Register (Only GST Customer Invoice - Frames 0110, 0130) */}
          {activeTab === 'b2b' && (
            <div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', maxHeight: '58vh' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left', minWidth: 1100 }}>
                    <thead>
                      <tr style={{ background: '#1e293b', color: '#ffffff', position: 'sticky', top: 0, zIndex: 10 }}>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #0284c7', minWidth: 140 }}>GSTIN/UIN</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #0284c7', minWidth: 140 }}>Receiver Name</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #0284c7', minWidth: 120 }}>Invoice Number</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #0284c7', minWidth: 100 }}>Invoice date</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #0284c7', minWidth: 100, textAlign: 'right' }}>Invoice Value</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #0284c7', minWidth: 120 }}>Place Of Supply</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #0284c7', width: 90, textAlign: 'center' }}>Reverse Charge</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #0284c7', width: 90, textAlign: 'center' }}>Applicable %</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #0284c7', minWidth: 100 }}>Invoice Type</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #0284c7', minWidth: 120 }}>E-Commerce GSTIN</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #0284c7', width: 60, textAlign: 'right' }}>Rate</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #0284c7', minWidth: 100, textAlign: 'right', background: '#0f172a' }}>Taxable Value</th>
                        <th style={{ padding: '10px 8px', borderBottom: '2px solid #0284c7', width: 70, textAlign: 'right' }}>Cess</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredB2B.length === 0 ? (
                        <tr>
                          <td colSpan={13} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                            No registered B2B invoices found for the selected date range.
                          </td>
                        </tr>
                      ) : (
                        filteredB2B.map((row, idx) => (
                          <tr key={row.sNo} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px', fontWeight: 700, color: '#0284c7', fontFamily: 'monospace' }}>{row.gstin}</td>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{row.receiverName || '-'}</td>
                            <td style={{ padding: '8px', fontFamily: 'monospace' }}>{row.invoiceNumber}</td>
                            <td style={{ padding: '8px' }}>{row.invoiceDate}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>{row.invoiceValue.toFixed(2)}</td>
                            <td style={{ padding: '8px' }}>{row.placeOfSupply}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{row.reverseCharge}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{row.applicableTaxRate}</td>
                            <td style={{ padding: '8px' }}>
                              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: 3, fontSize: 11, fontWeight: 700 }}>
                                {row.invoiceType}
                              </span>
                            </td>
                            <td style={{ padding: '8px', color: '#94a3b8' }}>{row.eCommerceGstin || '-'}</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>{row.rate}%</td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, background: '#f1f5f9', color: '#0f172a' }}>
                              {row.taxableValue.toFixed(2)}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>{row.cessAmount.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#0f172a', color: '#ffffff', fontWeight: 800 }}>
                        <td colSpan={4} style={{ padding: '10px 8px', textAlign: 'right' }}>Total B2B Outward Supplies:</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#4ade80' }}>{b2bTotals.invoiceValue.toFixed(2)}</td>
                        <td colSpan={6} style={{ padding: '10px 8px' }}></td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#facc15' }}>{b2bTotals.taxableValue.toFixed(2)}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right' }}>{b2bTotals.cessAmount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: B2C Register (Only Without GST Customer Invoice - Frame 0170) */}
          {activeTab === 'b2c' && (
            <div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', maxHeight: '58vh' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', color: '#ffffff', position: 'sticky', top: 0, zIndex: 10 }}>
                        <th style={{ padding: '10px 12px', borderBottom: '2px solid #0284c7', width: 90 }}>Type</th>
                        <th style={{ padding: '10px 12px', borderBottom: '2px solid #0284c7', minWidth: 160 }}>Place Of Supply</th>
                        <th style={{ padding: '10px 12px', borderBottom: '2px solid #0284c7', width: 140, textAlign: 'center' }}>Applicable % of Tax Rate</th>
                        <th style={{ padding: '10px 12px', borderBottom: '2px solid #0284c7', width: 100, textAlign: 'right' }}>Rate (%)</th>
                        <th style={{ padding: '10px 12px', borderBottom: '2px solid #0284c7', minWidth: 160, textAlign: 'right', background: '#0f172a' }}>Taxable Value</th>
                        <th style={{ padding: '10px 12px', borderBottom: '2px solid #0284c7', width: 110, textAlign: 'right' }}>Cess Amount</th>
                        <th style={{ padding: '10px 12px', borderBottom: '2px solid #0284c7', minWidth: 150 }}>E-Commerce GSTIN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredB2C.map((row, idx) => (
                        <tr key={row.sNo} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>{row.type}</td>
                          <td style={{ padding: '10px 12px' }}>{row.placeOfSupply}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>{row.applicableTaxRate}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: row.rate === 5 ? '#b45309' : '#1d4ed8' }}>
                            {row.rate}% {row.rate === 5 ? '(F&B / Restaurant)' : '(Room Stay)'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, background: '#f1f5f9', color: '#0f172a', fontSize: 13 }}>
                            ₹{row.taxableValue.toFixed(2)}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>{row.cessAmount.toFixed(2)}</td>
                          <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{row.eCommerceGstin || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#0f172a', color: '#ffffff', fontWeight: 800 }}>
                        <td colSpan={4} style={{ padding: '12px', textAlign: 'right' }}>Total B2C Taxable Supplies:</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#facc15', fontSize: 14 }}>
                          ₹{b2cTotals.taxableValue.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{b2cTotals.cessAmount.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Master Report Dashboard (Frame 0100) */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: 16
              }}>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e293b' }}>
                      All 28 Operational &amp; Financial MIS Reports (/report_dashboard)
                    </h3>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                      Click any tile below to launch the corresponding operational register or audit report.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', padding: '3px 8px', borderRadius: 3, fontWeight: 700 }}>Active</span>
                    <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0284c7', padding: '3px 8px', borderRadius: 3, fontWeight: 700 }}>28 Reports</span>
                  </div>
                </div>

                {/* 28 Buttons Grid matching Frame 0100 exactly */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 10
                }}>
                  {dashboardButtons.map((btn) => (
                    <button
                      key={btn.route}
                      type="button"
                      onClick={() => {
                        if (btn.actionKey === 'gst_report') {
                          setActiveTab('consolidated');
                        } else if (btn.actionKey === 'b2b_gst') {
                          setActiveTab('b2b');
                        } else if (btn.actionKey === 'b2c_gst') {
                          setActiveTab('b2c');
                        } else if (onLaunchReportAction) {
                          onClose();
                          onLaunchReportAction(btn.actionKey);
                        }
                      }}
                      style={{
                        background: btn.bgColor,
                        color: btn.textColor,
                        border: 'none',
                        borderRadius: 5,
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'transform 0.15s ease, filter 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.filter = 'brightness(1.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.filter = 'brightness(1)';
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{btn.icon}</span>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {btn.title}
                        </div>
                        <div style={{ fontSize: 10, opacity: 0.8, fontFamily: 'monospace' }}>
                          {btn.route}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer with Anti-Theft & CA Filing Notice */}
        <div style={{
          padding: '10px 20px',
          background: '#f1f5f9',
          borderTop: '1px solid #cbd5e1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          fontSize: 12
        }}>
          <div style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>💡</span>
            <span>
              <strong>CA Submission Note:</strong> Export Excel directly and send via WhatsApp/Email to CA for GSTR-1 (Table 4 B2B, Table 7 B2C) and GSTR-3B monthly return filing.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#64748b',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              padding: '6px 16px',
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
  );
};
