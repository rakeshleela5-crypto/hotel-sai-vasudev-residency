import React, { useState, useMemo } from 'react';
import { PmsStore } from '../../services/pmsStore';

interface Gstr1ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Gstr1ExportModal: React.FC<Gstr1ExportModalProps> = ({ isOpen, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('062026'); // June 2026
  const [selectedTab, setSelectedTab] = useState<'hsn' | 'b2b' | 'b2cs' | 'b2cl' | 'json'>('hsn');
  const [copied, setCopied] = useState<boolean>(false);

  const company = PmsStore.getCompanyInfo();
  const gstr1Data = useMemo(() => {
    return PmsStore.generateGstr1Json(selectedMonth);
  }, [selectedMonth]);

  if (!isOpen) return null;

  const monthLabel = selectedMonth === '062026' ? 'June 2026' :
    `${selectedMonth.slice(0, 2)}/${selectedMonth.slice(2)}`;

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(gstr1Data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1_${company.gstin || '21AEKPP8689J1ZS'}_${selectedMonth}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(gstr1Data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const hsnItems = gstr1Data.hsn?.data || [];
  const b2bInvoices = gstr1Data.b2b || [];
  const b2csList = gstr1Data.b2cs || [];
  const b2clList = gstr1Data.b2cl || [];

  const totalTaxable = hsnItems.reduce((s: number, it: any) => s + (it.txval || 0), 0);
  const totalCgst = hsnItems.reduce((s: number, it: any) => s + (it.camt || 0), 0);
  const totalSgst = hsnItems.reduce((s: number, it: any) => s + (it.samt || 0), 0);
  const totalTax = totalCgst + totalSgst;
  const grossInvoiceTotal = totalTaxable + totalTax;

  return (
    <div className="pms-submodal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="pms-form-box" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 1100, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Banner Header */}
        <div className="pms-form-banner banner-navy" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚖️</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 14 }}>
                Chartered Accountant (CA) Ready GSTR-1 JSON Export Engine
              </div>
              <div style={{ fontSize: 11, opacity: 0.9, fontWeight: 500 }}>
                Official GST Offline Tool Compliant &bull; HSN/SAC Mapped &bull; GSTIN: {company.gstin || company.gstNo} ({company.legalName || 'PAIDISETTY MANMADHA RAO'})
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

        {/* Top Controls Bar */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>
              Return Period (Month):
            </label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="form-select-pms"
              style={{ fontWeight: 700, width: 160 }}
            >
              <option value="062026">June 2026 (062026)</option>
              <option value="052026">May 2026 (052026)</option>
              <option value="042026">April 2026 (042026)</option>
              <option value="072026">July 2026 (072026)</option>
            </select>

            <span className="pms-badge-blue" style={{ fontSize: 11, padding: '4px 10px' }}>
              State Code: 21 (Odisha)
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={handleCopyJson}
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                border: '1px solid #bae6fd',
                padding: '6px 14px',
                borderRadius: 4,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              {copied ? '✅ JSON Copied!' : '📋 Copy JSON Schema'}
            </button>
            <button
              type="button"
              onClick={handleDownloadJson}
              style={{
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '6px 18px',
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
              <span>Download GSTR-1 JSON (Offline Tool)</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '14px 20px', background: '#f1f5f9' }}>
          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>TOTAL TAXABLE TURNOVER</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
              ₹{totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, marginTop: 2 }}>
              Across All Rooms, F&B & Banquets
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>CGST (CENTRAL TAX)</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0284c7', marginTop: 4 }}>
              ₹{totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
              Intra-state (Odisha 21)
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>SGST (STATE TAX)</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#7c3aed', marginTop: 4 }}>
              ₹{totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
              Intra-state (Odisha 21)
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>GROSS INVOICED REVENUE</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>
              ₹{grossInvoiceTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: 10, color: '#059669', fontWeight: 700, marginTop: 2 }}>
              Taxable + Taxes Collected
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '2px solid #cbd5e1', padding: '0 20px', background: '#f8fafc' }}>
          {[
            { id: 'hsn', label: '12. HSN/SAC Summary Table', count: hsnItems.length },
            { id: 'b2b', label: '4A. B2B Invoices (GSTIN Registered)', count: b2bInvoices.length },
            { id: 'b2cs', label: '7. B2CS (Consumer Small)', count: b2csList.length },
            { id: 'b2cl', label: '5. B2CL (Consumer Large)', count: b2clList.length },
            { id: 'json', label: 'Raw JSON Payload Preview', count: null }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id as any)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: selectedTab === tab.id ? '3px solid #0284c7' : '3px solid transparent',
                color: selectedTab === tab.id ? '#0284c7' : '#64748b',
                fontWeight: selectedTab === tab.id ? 800 : 600,
                fontSize: 12,
                padding: '10px 16px',
                cursor: 'pointer',
                marginBottom: -2,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span style={{
                  background: selectedTab === tab.id ? '#0284c7' : '#cbd5e1',
                  color: selectedTab === tab.id ? '#ffffff' : '#475569',
                  borderRadius: 10,
                  fontSize: 10,
                  padding: '1px 6px',
                  fontWeight: 700
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Body Contents */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {selectedTab === 'hsn' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>Table 12: HSN/SAC-wise Summary of Outward Supplies</span>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Period: {monthLabel}</span>
              </div>
              <table className="pms-table-compact" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#fff' }}>
                    <th style={{ width: 45 }}>S.No</th>
                    <th>SAC Code</th>
                    <th>Service Description</th>
                    <th>UQC</th>
                    <th style={{ textAlign: 'right' }}>Total Qty</th>
                    <th style={{ textAlign: 'right' }}>Total Value (₹)</th>
                    <th style={{ textAlign: 'right' }}>Taxable Value (₹)</th>
                    <th style={{ textAlign: 'right' }}>CGST (₹)</th>
                    <th style={{ textAlign: 'right' }}>SGST (₹)</th>
                    <th style={{ textAlign: 'center' }}>Tax Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {hsnItems.map((h: any, idx: number) => {
                    const desc = h.hsn_sc === '996311' ? 'Room Rent & Accommodation Service' :
                      h.hsn_sc === '996331' ? 'Restaurant Food & Beverage Services' :
                      h.hsn_sc === '997212' ? 'Banquet Hall & Marriage Garden Rental' :
                      h.hsn_sc === '999711' ? 'Laundry & Dry Cleaning Services' : 'Other Hospitality Services';
                    return (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{h.num || idx + 1}</td>
                        <td style={{ fontWeight: 800, color: '#0369a1' }}>{h.hsn_sc}</td>
                        <td style={{ fontWeight: 600 }}>{desc}</td>
                        <td style={{ textAlign: 'center' }}>{h.uqc}</td>
                        <td style={{ textAlign: 'right' }}>{h.qty || 1}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          ₹{((h.val || (h.txval + h.camt + h.samt))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          ₹{h.txval.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right', color: '#0284c7', fontWeight: 700 }}>
                          ₹{h.camt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right', color: '#7c3aed', fontWeight: 700 }}>
                          ₹{h.samt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>{h.rt}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#e2e8f0', fontWeight: 900 }}>
                    <td colSpan={5} style={{ textAlign: 'right', padding: '8px 10px' }}>TOTAL HSN/SAC SUMMARY:</td>
                    <td style={{ textAlign: 'right', padding: '8px 10px' }}>
                      ₹{grossInvoiceTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px 10px', color: '#0f172a' }}>
                      ₹{totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px 10px', color: '#0284c7' }}>
                      ₹{totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px 10px', color: '#7c3aed' }}>
                      ₹{totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {selectedTab === 'b2b' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
                Table 4A, 4B, 4C, 6B, 6C: B2B Invoices (Supplies to Registered Persons)
              </div>
              {b2bInvoices.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 6 }}>
                  No corporate B2B GSTIN registered invoices for this period. All counter sales classified under B2CS.
                </div>
              ) : (
                <table className="pms-table-compact" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#fff' }}>
                      <th>Recipient GSTIN</th>
                      <th>Invoice No</th>
                      <th>Invoice Date</th>
                      <th style={{ textAlign: 'right' }}>Invoice Value</th>
                      <th>POS</th>
                      <th>Reverse Charge</th>
                      <th style={{ textAlign: 'right' }}>Rate</th>
                      <th style={{ textAlign: 'right' }}>Taxable Value</th>
                      <th style={{ textAlign: 'right' }}>CGST</th>
                      <th style={{ textAlign: 'right' }}>SGST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b2bInvoices.map((b: any, idx: number) => {
                      const inv = b.inv[0];
                      const itm = inv.itms[0].itm_det;
                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: 800, color: '#0284c7' }}>{b.ctin}</td>
                          <td style={{ fontWeight: 700 }}>{inv.inum}</td>
                          <td>{inv.idt}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>₹{inv.val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td>{inv.pos}</td>
                          <td>{inv.rchrg}</td>
                          <td style={{ textAlign: 'right' }}>{itm.rt}%</td>
                          <td style={{ textAlign: 'right' }}>₹{itm.txval.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td style={{ textAlign: 'right' }}>₹{itm.camt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td style={{ textAlign: 'right' }}>₹{itm.samt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {selectedTab === 'b2cs' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
                Table 7: B2CS (Supplies Made to Consumers & Unregistered Persons - Intra-State)
              </div>
              <table className="pms-table-compact" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#fff' }}>
                    <th>Type</th>
                    <th>Place of Supply (POS)</th>
                    <th style={{ textAlign: 'right' }}>Rate (%)</th>
                    <th style={{ textAlign: 'right' }}>Taxable Value (₹)</th>
                    <th style={{ textAlign: 'right' }}>CGST Amount (₹)</th>
                    <th style={{ textAlign: 'right' }}>SGST Amount (₹)</th>
                    <th style={{ textAlign: 'right' }}>Total Invoiced (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {b2csList.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700 }}>{item.sply_ty || 'INTRA'}</td>
                      <td style={{ fontWeight: 800, color: '#0369a1' }}>{item.pos} (Odisha)</td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>{item.rt}%</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        ₹{item.txval.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', color: '#0284c7', fontWeight: 700 }}>
                        ₹{item.camt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', color: '#7c3aed', fontWeight: 700 }}>
                        ₹{item.samt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 900 }}>
                        ₹{(item.txval + item.camt + item.samt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedTab === 'b2cl' && (
            <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Table 5: B2CL (Interstate Supplies to Unregistered Persons &gt; ₹2.5 Lakhs)
              </div>
              <div>No interstate unregistered invoices exceeding ₹2,50,000 threshold for the selected tax period.</div>
            </div>
          )}

          {selectedTab === 'json' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>
                  Standard GST Offline Tool Schema (v1.4) Output
                </span>
                <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 700 }}>
                  Ready for direct upload at portal.gst.gov.in
                </span>
              </div>
              <pre
                style={{
                  background: '#0f172a',
                  color: '#38bdf8',
                  padding: 16,
                  borderRadius: 6,
                  fontSize: 11,
                  lineHeight: 1.5,
                  maxHeight: 420,
                  overflow: 'auto',
                  fontFamily: 'Consolas, Monaco, monospace'
                }}
              >
                {JSON.stringify(gstr1Data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            Generated for: <strong>{company.hotelName || company.tradeName || company.firmName}</strong> &bull; PAN: {company.pan || company.pencardNo || 'AEKPP8689J'} &bull; Rayagada, Odisha
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-pms-cancel"
            style={{ padding: '6px 20px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
