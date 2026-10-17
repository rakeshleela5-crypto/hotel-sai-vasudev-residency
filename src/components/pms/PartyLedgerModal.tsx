import React, { useState } from 'react';
import { PmsStore } from '../../services/pmsStore';

interface PartyLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAccount?: string;
}

export const PartyLedgerModal: React.FC<PartyLedgerModalProps> = ({
  isOpen,
  onClose,
  initialAccount = 'Cash'
}) => {
  const [selectedAccount, setSelectedAccount] = useState<string>(initialAccount);
  const [searchTerm, setSearchTerm] = useState<string>(initialAccount);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fromDate, setFromDate] = useState('01-05-2025');
  const [toDate, setToDate] = useState('16-06-2025');
  const [activeAccount, setActiveAccount] = useState<string>(initialAccount);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  if (!isOpen) return null;

  const accountOptions = PmsStore.getLedgerAccountOptions();

  // Filter accounts by search term
  const filteredAccounts = accountOptions.filter(acc =>
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (acc.phone && acc.phone.includes(searchTerm))
  );

  const ledgerData = PmsStore.getPartyLedger(activeAccount, fromDate, toDate);
  const companyInfo = PmsStore.getCompanyInfo();

  const handleSelectAccount = (accId: string, accName: string) => {
    setSelectedAccount(accId);
    setSearchTerm(accName);
    setIsDropdownOpen(false);
    setActiveAccount(accId);
    if (accId.toLowerCase() === 'online') {
      setFromDate('01-06-2025');
      setToDate('16-06-2025');
    } else if (accId.toLowerCase().includes('sunder') || accId.toLowerCase().includes('owner')) {
      setFromDate('01-06-2025');
      setToDate('16-06-2025');
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveAccount(selectedAccount);
    setIsDropdownOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pms-overlay" onClick={onClose}>
      <div
        className="pms-window"
        style={{ maxWidth: 1100, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="pms-header" style={{ justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📑</span>
            <div>
              <h2 className="pms-brand-title" style={{ margin: 0 }}>
                Party & Account Ledger
              </h2>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                demo.datahouseerp.com/ledger_show &bull; Video 17 Double-Entry Statement
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowPrintPreview(!showPrintPreview)}
              style={{
                background: showPrintPreview ? '#475569' : '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: 4,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {showPrintPreview ? '✕ Close Preview' : '🖨️ Print Sheet Preview'}
            </button>
            <button type="button" className="pms-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px 24px', background: '#ffffff', color: '#0f172a', overflowY: 'auto', flex: 1 }}>
          {showPrintPreview ? (
            /* ======================================================== */
            /* Print Preview matching Video 17 Frame 0190 Letterhead    */
            /* ======================================================== */
            <div
              style={{
                maxWidth: 820,
                margin: '0 auto',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                padding: '30px 40px',
                borderRadius: 4,
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              {/* Hotel Letterhead Frame 0190 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '2px solid #0f172a',
                  paddingBottom: 14,
                  marginBottom: 16
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      background: '#0f172a',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f59e0b',
                      fontSize: 24,
                      fontWeight: 800
                    }}
                  >
                    🏨
                  </div>
                  <div>
                    <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: 0.5, color: '#0f172a' }}>
                      {companyInfo.firmName || 'HOTEL SAI VASUDEV RESIDENCY'}
                    </h1>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                      {companyInfo.address1 || 'NEAR RAILWAY STATION, MAIN ROAD, BILASPUR CHHATTISGARH 495220'}
                    </div>
                    <div style={{ fontSize: 11, color: '#475569' }}>
                      India &bull; Email: {companyInfo.email || 'saivasudevresidency@gmail.com'} &bull; Phone: {companyInfo.phone || companyInfo.mobile || '9303985799'}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      border: '1px dashed #94a3b8',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      color: '#64748b',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: 16 }}>📱</div>
                    <span>QR Verify</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                    GSTIN: {companyInfo.gstNo || '22AAAAA0000A1Z5'}
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '8px 12px',
                  borderRadius: 4,
                  marginBottom: 14,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0f172a'
                }}
              >
                Ledger for Account: <span style={{ color: '#0284c7' }}>{activeAccount}</span> &nbsp;&nbsp;&bull;&nbsp;&nbsp; From Date: <strong>{fromDate}</strong> To Date: <strong>{toDate}</strong>
              </div>

              {/* Printable Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px', width: 75 }}>Date</th>
                    <th style={{ padding: '6px 8px', width: 110 }}>Type</th>
                    <th style={{ padding: '6px 8px', width: 120 }}>Account</th>
                    <th style={{ padding: '6px 8px' }}>Remark</th>
                    <th style={{ padding: '6px 8px', width: 75, textAlign: 'right' }}>Debit</th>
                    <th style={{ padding: '6px 8px', width: 75, textAlign: 'right' }}>Credit</th>
                    <th style={{ padding: '6px 8px', width: 90, textAlign: 'right' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.entries.map((entry, idx) => {
                    const isOpening = entry.accountName === 'Opening Balnce';
                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          background: isOpening ? '#f1f5f9' : idx % 2 === 0 ? '#ffffff' : '#fafafa'
                        }}
                      >
                        <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{entry.date}</td>
                        <td style={{ padding: '5px 8px', color: '#0284c7', fontWeight: entry.type ? 600 : 400 }}>
                          {isOpening ? '' : entry.type}
                        </td>
                        <td style={{ padding: '5px 8px', fontWeight: isOpening ? 700 : 500 }}>
                          {entry.accountName}
                        </td>
                        <td style={{ padding: '5px 8px', color: '#334155' }}>{entry.remark}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600 }}>
                          {entry.debit > 0 ? entry.debit.toLocaleString('en-IN') : ''}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600, color: entry.credit > 0 ? '#15803d' : undefined }}>
                          {entry.credit > 0 ? entry.credit.toLocaleString('en-IN') : ''}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700 }}>
                          {entry.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {entry.balanceType}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #0f172a', fontWeight: 700 }}>
                    <td style={{ padding: '6px 8px' }} colSpan={4}>TOTAL</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                      {ledgerData.totalDebit.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#15803d' }}>
                      {ledgerData.totalCredit.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                      {ledgerData.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {ledgerData.closingType}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700 }}>
                Closing Balance = {ledgerData.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {ledgerData.closingType}
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 10 }}>
                <div style={{ textAlign: 'center', width: 180, borderTop: '1px solid #94a3b8', fontSize: 11, color: '#475569' }}>
                  Prepared By (Cashier)
                </div>
                <div style={{ textAlign: 'center', width: 180, borderTop: '1px solid #94a3b8', fontSize: 11, color: '#475569' }}>
                  Authorized Signatory / Manager
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 24px',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🖨️ Print Document
                </button>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* Standard Ledger View matching Video 17 Frame 0130, 0180  */
            /* ======================================================== */
            <>
              {/* Top Filter Bar matching Frame 0130, 0180 */}
              <form
                onSubmit={handleFilterSubmit}
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 12,
                  marginBottom: 16,
                  background: '#f8fafc',
                  padding: '12px 16px',
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  position: 'relative'
                }}
              >
                {/* Searchable Account Dropdown */}
                <div style={{ flex: 1.5, position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 3 }}>
                    Select Account Name
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="Type account name (e.g. Cash, Online, sunder, Vivek)..."
                      className="form-input-pms"
                      style={{ width: '100%', padding: '7px 10px', fontSize: 13, borderRadius: 4 }}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setIsDropdownOpen(true);
                        }}
                        style={{
                          position: 'absolute',
                          right: 8,
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          fontSize: 14
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dropdown Options Popup matching Frame 0180 */}
                  {isDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 50,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 4,
                        boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
                        maxHeight: 240,
                        overflowY: 'auto',
                        marginTop: 2
                      }}
                    >
                      {filteredAccounts.length === 0 ? (
                        <div style={{ padding: '8px 12px', fontSize: 12, color: '#94a3b8' }}>
                          No accounts found
                        </div>
                      ) : (
                        filteredAccounts.map(acc => (
                          <div
                            key={acc.id}
                            onClick={() => handleSelectAccount(acc.id, acc.name)}
                            style={{
                              padding: '8px 12px',
                              fontSize: 13,
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9',
                              background: selectedAccount.toLowerCase() === acc.id.toLowerCase() ? '#e0f2fe' : '#ffffff',
                              color: selectedAccount.toLowerCase() === acc.id.toLowerCase() ? '#0369a1' : '#1e293b',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                            onMouseLeave={e =>
                              (e.currentTarget.style.background =
                                selectedAccount.toLowerCase() === acc.id.toLowerCase() ? '#e0f2fe' : '#ffffff')
                            }
                          >
                            <div>
                              <span style={{ fontWeight: 600 }}>{acc.name}</span>
                              {acc.phone && (
                                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>
                                  ({acc.phone})
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: 10,
                                background: '#f1f5f9',
                                color: '#475569',
                                padding: '2px 6px',
                                borderRadius: 10
                              }}
                            >
                              {acc.category}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* From Date */}
                <div style={{ width: 140 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 3 }}>
                    From Date
                  </label>
                  <input
                    type="text"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    placeholder="DD-MM-YYYY"
                    className="form-input-pms"
                    style={{ width: '100%', padding: '6px 8px', fontSize: 13 }}
                  />
                </div>

                {/* To Date */}
                <div style={{ width: 140 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 3 }}>
                    To Date
                  </label>
                  <input
                    type="text"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    placeholder="DD-MM-YYYY"
                    className="form-input-pms"
                    style={{ width: '100%', padding: '6px 8px', fontSize: 13 }}
                  />
                </div>

                {/* OK Button matching Frame 0130, 0180 */}
                <button
                  type="submit"
                  style={{
                    background: '#007bff',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '8px 24px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,123,255,0.25)'
                  }}
                >
                  OK
                </button>
              </form>

              {/* Title Banner matching Frame 0130, 0180 */}
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
                Ledger for Account: <span style={{ color: '#007bff' }}>{activeAccount}</span>
                &nbsp;&nbsp;&nbsp;&nbsp; From Date- {fromDate} To Date- {toDate}
              </div>

              {/* Ledger Table */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: 2, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#ffffff', borderBottom: '1px solid #cbd5e1', color: '#1e293b' }}>
                      <th style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1', width: 95 }}>Date</th>
                      <th style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1', width: 140 }}>Type</th>
                      <th style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1', width: 160 }}>Account Name</th>
                      <th style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1' }}>Remark</th>
                      <th style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1', width: 95, textAlign: 'right' }}>Debit</th>
                      <th style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1', width: 95, textAlign: 'right' }}>Credit</th>
                      <th style={{ padding: '8px 12px', width: 110, textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerData.entries.map((entry, idx) => {
                      const isOpening = entry.accountName === 'Opening Balnce';
                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            background: isOpening ? '#f8fafc' : '#ffffff'
                          }}
                        >
                          <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                            {entry.date}
                          </td>
                          <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', color: '#0284c7', fontWeight: entry.type ? 600 : 400 }}>
                            {isOpening ? '' : entry.type}
                          </td>
                          <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: isOpening ? 600 : 400 }}>
                            {entry.accountName}
                          </td>
                          <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', color: '#475569' }}>
                            {entry.remark}
                          </td>
                          <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 600 }}>
                            {entry.debit > 0 ? entry.debit.toLocaleString('en-IN') : ''}
                          </td>
                          <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 600, color: entry.credit > 0 ? '#15803d' : undefined }}>
                            {entry.credit > 0 ? entry.credit.toLocaleString('en-IN') : ''}
                          </td>
                          <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700 }}>
                            {entry.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {entry.balanceType}
                          </td>
                        </tr>
                      );
                    })}

                    {/* TOTAL Row matching Frame 0130, 0180 */}
                    <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 700 }}>
                      <td style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1' }}>TOTAL</td>
                      <td style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1' }}></td>
                      <td style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1' }}></td>
                      <td style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1' }}></td>
                      <td style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>
                        {ledgerData.totalDebit.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1', textAlign: 'right', color: '#15803d' }}>
                        {ledgerData.totalCredit.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        {ledgerData.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {ledgerData.closingType}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Closing Balance Notice matching Frame 0180 */}
              <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                Closing Balance = {ledgerData.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {ledgerData.closingType}
              </div>

              {/* Centered Black Print Bar matching Frame 0180 */}
              <div
                style={{
                  marginTop: 20,
                  background: '#000000',
                  borderRadius: 4,
                  padding: '10px 0',
                  textAlign: 'center'
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(true)}
                  style={{
                    background: 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: 0.5
                  }}
                >
                  Print
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
