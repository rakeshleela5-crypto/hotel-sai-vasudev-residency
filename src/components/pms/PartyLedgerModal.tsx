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
  initialAccount = 'Shiv'
}) => {
  const [selectedAccount, setSelectedAccount] = useState<string>(initialAccount);
  const [fromDate, setFromDate] = useState('07-06-2025');
  const [toDate, setToDate] = useState('07-06-2025');
  const [activeAccount, setActiveAccount] = useState<string>(initialAccount);

  if (!isOpen) return null;

  // Build account options from active rooms, checkouts, and advance receipts
  const rooms = PmsStore.getRooms();
  const checkouts = PmsStore.getCheckouts();
  const receipts = PmsStore.getAdvanceReceipts();

  const accountOptionsMap = new Map<string, string>();
  // Shiv (Video 06 Frame 0130 default)
  accountOptionsMap.set('Shiv', 'Shiv ::Dausa= 8432066047');
  
  for (const r of rooms) {
    if (r.currentGuest) {
      accountOptionsMap.set(r.currentGuest.name, `${r.currentGuest.name} ::Room ${r.roomNo}= ${r.currentGuest.phone || ''}`);
    }
  }

  for (const c of checkouts) {
    if (c.guestName) {
      accountOptionsMap.set(c.guestName, `${c.guestName} ::Room ${c.roomNo}= ${c.guestPhone || ''}`);
    }
  }

  for (const rec of receipts) {
    if (rec.guestName && !accountOptionsMap.has(rec.guestName)) {
      accountOptionsMap.set(rec.guestName, `${rec.guestName} ::Room ${rec.roomNo}= ${rec.mobile}`);
    }
  }

  const ledgerData = PmsStore.getPartyLedger(activeAccount, fromDate, toDate);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveAccount(selectedAccount);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pms-overlay" onClick={onClose}>
      <div className="pms-window" style={{ maxWidth: 1050 }} onClick={e => e.stopPropagation()}>
        {/* Top Header */}
        <div className="pms-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📑</span>
            <div>
              <h2 className="pms-brand-title" style={{ margin: 0 }}>
                Party & Guest Ledger
              </h2>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                demo.datahouseerp.com/ledger_show &bull; Double-Entry Account Statement
              </div>
            </div>
          </div>
          <button type="button" className="pms-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Content Body matching Video 06 Frame 0130, 0182, 0230 */}
        <div style={{ padding: '16px 24px', background: '#ffffff', color: '#0f172a', minHeight: 500 }}>
          {/* Top Filter Bar matching Frame 0130 & 0182 */}
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
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ flex: 1.5 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 3 }}>
                Select Account Name
              </label>
              <select
                value={selectedAccount}
                onChange={e => setSelectedAccount(e.target.value)}
                className="form-select-pms"
                style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
              >
                {Array.from(accountOptionsMap.entries()).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: 140 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 3 }}>
                Form Date
              </label>
              <input
                type="text"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="form-input-pms"
                style={{ width: '100%', padding: '6px 8px', fontSize: 13 }}
              />
            </div>

            <div style={{ width: 140 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 3 }}>
                To Date
              </label>
              <input
                type="text"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="form-input-pms"
                style={{ width: '100%', padding: '6px 8px', fontSize: 13 }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: 4,
                padding: '7px 20px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              OK
            </button>
          </form>

          {/* Ledger Banner matching Frame 0182 & 0230 */}
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
            Ledger for Account: <span style={{ color: '#0369a1' }}>{activeAccount}</span> &nbsp;&nbsp;&nbsp;&nbsp; From Date- {fromDate} To Date- {toDate}
          </div>

          {/* Ledger Table */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: 2, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#ffffff', borderBottom: '1px solid #cbd5e1', color: '#1e293b' }}>
                  <th style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1', width: 90 }}>Date</th>
                  <th style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1', width: 130 }}>Type</th>
                  <th style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1', width: 150 }}>Account Name</th>
                  <th style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1' }}>Remark</th>
                  <th style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1', width: 90, textAlign: 'right' }}>Debit</th>
                  <th style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1', width: 90, textAlign: 'right' }}>Credit</th>
                  <th style={{ padding: '8px 12px', width: 100, textAlign: 'right' }}>Balance</th>
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
                      <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', color: '#0369a1', fontWeight: entry.type ? 600 : 400 }}>
                        {isOpening ? '' : entry.type}
                      </td>
                      <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', fontWeight: isOpening ? 600 : 400 }}>
                        {entry.accountName}
                      </td>
                      <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', color: '#475569' }}>
                        {entry.remark}
                      </td>
                      <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 600 }}>
                        {entry.debit > 0 ? entry.debit : ''}
                      </td>
                      <td style={{ padding: '6px 12px', borderRight: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 600, color: entry.credit > 0 ? '#15803d' : undefined }}>
                        {entry.credit > 0 ? entry.credit : ''}
                      </td>
                      <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700 }}>
                        {entry.balance.toFixed(2)} {entry.balanceType}
                      </td>
                    </tr>
                  );
                })}

                {/* TOTAL Row matching Frame 0182 & 0230 */}
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 700 }}>
                  <td style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1' }}>TOTAL</td>
                  <td style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1' }}></td>
                  <td style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1' }}></td>
                  <td style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1' }}></td>
                  <td style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>
                    {ledgerData.totalDebit}
                  </td>
                  <td style={{ padding: '8px 12px', borderRight: '1px solid #cbd5e1', textAlign: 'right', color: '#15803d' }}>
                    {ledgerData.totalCredit}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    {ledgerData.closingBalance.toFixed(2)} {ledgerData.closingType}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Closing Balance Notice matching Frame 0182 & 0230 */}
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
            Closing Balance ={ledgerData.closingBalance} {ledgerData.closingType}
          </div>

          {/* Centered Black Print Bar matching Frame 0182 & 0230 */}
          <div
            style={{
              marginTop: 20,
              background: '#0f172a',
              borderRadius: 4,
              padding: '8px 0',
              textAlign: 'center'
            }}
          >
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: 'transparent',
                color: '#ffffff',
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: 0.5
              }}
            >
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
