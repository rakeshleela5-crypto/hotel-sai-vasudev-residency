import React, { useState } from 'react';
import type { PmsExpenseRecord } from '../../types/pmsModels';
import { PmsStore, usePmsSync } from '../../services/pmsStore';

interface PettyExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PettyExpenseModal: React.FC<PettyExpenseModalProps> = ({ isOpen, onClose }) => {
  usePmsSync();
  const [activeTab, setActiveTab] = useState<'expenses' | 'nightAudit'>('expenses');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // New expense form state
  const [category, setCategory] = useState<PmsExpenseRecord['category']>('Vegetables & Dairy');
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PmsExpenseRecord['paymentMode']>('Cash');
  const [paidTo, setPaidTo] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [billNumber, setBillNumber] = useState<string>('');
  const [approvedBy, setApprovedBy] = useState<string>('General Manager');

  // Night audit feedback
  const [auditSuccessMsg, setAuditSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const expenses = PmsStore.getExpenses();
  const nightAudits = PmsStore.getNightAudits();
  const latestAudit = nightAudits[0];

  // Cash Calculation:
  const cashPayments = PmsStore.getFolioPayments().filter(p => p.paymentMode === 'Cash').reduce((s, p) => s + p.amount, 0);
  const cashExpenses = expenses.filter(e => e.paymentMode === 'Cash').reduce((s, e) => s + e.amount, 0);
  const startingFloat = 15000; // Base cash drawer
  const netCashInHand = Math.max(0, startingFloat + cashPayments - cashExpenses);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }
    if (!paidTo.trim()) {
      alert('Please specify the recipient or vendor name.');
      return;
    }

    const now = new Date();
    PmsStore.addExpense({
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      category,
      amount: numAmount,
      paymentMode,
      paidTo: paidTo.trim(),
      description: description.trim() || `${category} purchase`,
      billNumber: billNumber.trim() || undefined,
      approvedBy
    });

    setAmount('');
    setPaidTo('');
    setDescription('');
    setBillNumber('');
    setIsAddExpenseOpen(false);
  };

  const handleRunNightAudit = () => {
    const record = PmsStore.runNightAudit('General Manager / Shift Lead');
    setAuditSuccessMsg(`Night Audit ${record.auditId} completed successfully! Posted daily room tariffs + GST for ${record.occupiedRoomsCount} occupied room(s). Shift handover report archived.`);
    setTimeout(() => {
      setAuditSuccessMsg(null);
    }, 6000);
  };

  return (
    <div className="pms-modal-backdrop" style={{ zIndex: 12000 }}>
      <div className="pms-modal-window" style={{ maxWidth: '1100px', width: '96%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="pms-modal-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>💰</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Petty Cash Expenses &amp; Daily Night Audit Ledger</h3>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
                Hotel Sai Vasudev Residency &bull; Financial Controls, Shift Handover &amp; Daily Revenue Ledger
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="view-toggle-btns" style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.12)', padding: '2px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('expenses')}
                style={{
                  background: activeTab === 'expenses' ? '#ffffff' : 'transparent',
                  color: activeTab === 'expenses' ? '#0f172a' : '#ffffff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🧾 Petty Cash Expenses
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('nightAudit')}
                style={{
                  background: activeTab === 'nightAudit' ? '#ffffff' : 'transparent',
                  color: activeTab === 'nightAudit' ? '#0f172a' : '#ffffff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🌙 Night Audit &amp; Handover
              </button>
            </div>
            <button type="button" className="pms-close-btn" onClick={onClose} style={{ color: '#ffffff' }}>&times;</button>
          </div>
        </div>

        {/* Financial KPI Banner */}
        <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Net Cash in Hand</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#059669' }}>₹{netCashInHand.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Drawer Float + Inward - Cash Outward</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Expenses (Today/Recorded)</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#dc2626' }}>₹{totalExpenses.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{expenses.length} voucher(s) logged</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Last Night Audit</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>{latestAudit ? latestAudit.auditId : 'Pending'}</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>{latestAudit ? latestAudit.executedAt : 'Run audit tonight'}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setIsAddExpenseOpen(true)}
              style={{
                padding: '8px 14px',
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>+ Add Petty Expense</span>
            </button>
            <button
              type="button"
              onClick={handleRunNightAudit}
              style={{
                padding: '8px 14px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>🌙 Run Night Audit (Post Tariffs)</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {auditSuccessMsg && (
          <div style={{ margin: '12px 20px 0', padding: '10px 14px', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
            ✨ {auditSuccessMsg}
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'expenses' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>Itemized Petty Cash &amp; Operating Expenses</h4>
                <span style={{ fontSize: '12px', color: '#64748b' }}>All cash expenses deduct automatically from the physical drawer float.</span>
              </div>

              <table className="pms-table" style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: '#ffffff' }}>
                    <th style={{ padding: '8px' }}>Voucher #</th>
                    <th style={{ padding: '8px' }}>Date &amp; Time</th>
                    <th style={{ padding: '8px' }}>Category</th>
                    <th style={{ padding: '8px' }}>Paid To (Vendor)</th>
                    <th style={{ padding: '8px' }}>Description</th>
                    <th style={{ padding: '8px' }}>Mode</th>
                    <th style={{ padding: '8px' }}>Approved By</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Amount (₹)</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        No expenses logged yet. Click "+ Add Petty Expense" above.
                      </td>
                    </tr>
                  ) : (
                    expenses.map(exp => (
                      <tr key={exp.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px', fontWeight: 800, color: '#2563eb' }}>{exp.expenseNo}</td>
                        <td style={{ padding: '8px', fontSize: '11px', color: '#64748b' }}>{exp.date} {exp.time}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: exp.category === 'Vegetables & Dairy' ? '#dcfce7' : exp.category === 'Housekeeping Supplies' ? '#e0e7ff' : exp.category === 'Electricity/DG Fuel' ? '#fef3c7' : '#fee2e2',
                            color: exp.category === 'Vegetables & Dairy' ? '#166534' : exp.category === 'Housekeeping Supplies' ? '#3730a3' : exp.category === 'Electricity/DG Fuel' ? '#92400e' : '#991b1b'
                          }}>
                            {exp.category}
                          </span>
                        </td>
                        <td style={{ padding: '8px', fontWeight: 700 }}>{exp.paidTo}</td>
                        <td style={{ padding: '8px' }}>{exp.description} {exp.billNumber && <small style={{ color: '#64748b' }}>({exp.billNumber})</small>}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ fontWeight: 700, color: exp.paymentMode === 'Cash' ? '#059669' : '#0284c7' }}>
                            {exp.paymentMode}
                          </span>
                        </td>
                        <td style={{ padding: '8px', fontSize: '12px', color: '#475569' }}>{exp.approvedBy}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => PmsStore.deleteExpense(exp.id)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
                            title="Delete Voucher"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Night Audit Records */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>Daily Night Audit History &amp; Handover Reports</h4>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Each run automatically posts nightly room tariff + 12% GST to in-house occupied rooms.</span>
              </div>

              {nightAudits.map(audit => (
                <div key={audit.auditId} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', marginBottom: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '16px', color: '#1e293b' }}>Audit ID: {audit.auditId}</strong>
                      <span style={{ marginLeft: '10px', fontSize: '12px', color: '#64748b' }}>Executed: {audit.executedAt} by {audit.executedBy}</span>
                    </div>
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                      ✓ Verified &amp; Closed
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '10px', background: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '12px' }}>
                    <div>Occupied Rooms: <strong>{audit.occupiedRoomsCount}</strong></div>
                    <div>Room Tariffs Posted: <strong>₹{audit.totalRoomTariffPosted.toLocaleString('en-IN')}</strong></div>
                    <div>GST Posted: <strong>₹{audit.totalGstPosted.toLocaleString('en-IN')}</strong></div>
                    <div>Cash In Drawer: <strong style={{ color: '#059669' }}>₹{audit.cashInHand.toLocaleString('en-IN')}</strong></div>
                    <div>UPI Collections: <strong style={{ color: '#0284c7' }}>₹{audit.upiTotal.toLocaleString('en-IN')}</strong></div>
                    <div>Card Collections: <strong style={{ color: '#7c3aed' }}>₹{audit.cardTotal.toLocaleString('en-IN')}</strong></div>
                    <div>Pending Receivables: <strong style={{ color: '#dc2626' }}>₹{audit.pendingReceivables.toLocaleString('en-IN')}</strong></div>
                  </div>

                  {audit.roomsAuditSummary && audit.roomsAuditSummary.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>In-House Room Postings:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {audit.roomsAuditSummary.map(r => (
                          <div key={r.roomNo} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '4px 8px', fontSize: '11px' }}>
                            <strong>Room {r.roomNo}</strong> ({r.guestName}): Posted ₹{r.totalPosted} (Tariff ₹{r.baseTariff} + GST ₹{r.gstAmount}) &bull; Folio Due: ₹{r.folioBalanceAfter}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal for adding new Petty Expense */}
        {isAddExpenseOpen && (
          <div className="pms-modal-backdrop" style={{ zIndex: 13000 }}>
            <div className="pms-modal-window" style={{ maxWidth: '480px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#dc2626' }}>
                  + Add Hotel Petty Expense Voucher
                </h4>
                <button type="button" onClick={() => setIsAddExpenseOpen(false)} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
              </div>

              <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Expense Category:</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="Vegetables & Dairy">Vegetables &amp; Dairy (Rasoi Fresh Produce)</option>
                    <option value="Housekeeping Supplies">Housekeeping Supplies (Chemicals, Linen, Soap)</option>
                    <option value="Electricity/DG Fuel">Electricity / DG Fuel (Generator Diesel)</option>
                    <option value="Staff Advance">Staff Advance (Kitchen / Front Desk Advance)</option>
                    <option value="Maintenance Repair">Maintenance Repair (Plumbing, AC, Electrical)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Amount (₹):</label>
                    <input
                      type="number"
                      step="1"
                      required
                      placeholder="e.g. 1250"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Payment Mode:</label>
                    <select
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value as any)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="Cash">Cash (Deducts from Drawer)</option>
                      <option value="UPI">UPI (GooglePay / PhonePe)</option>
                      <option value="Card">Company Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer / IMPS</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Paid To (Vendor / Person):</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shirdi Fresh Veggies Mandi / Sai Electricals"
                    value={paidTo}
                    onChange={e => setPaidTo(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Description / Items Purchased:</label>
                  <textarea
                    rows={2}
                    placeholder="Itemized summary of items purchased or work completed..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Vendor Bill # (Optional):</label>
                    <input
                      type="text"
                      placeholder="e.g. BILL-8921"
                      value={billNumber}
                      onChange={e => setBillNumber(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Approved By:</label>
                    <select
                      value={approvedBy}
                      onChange={e => setApprovedBy(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="General Manager">General Manager</option>
                      <option value="Front Desk Lead">Front Desk Lead</option>
                      <option value="Housekeeping Head">Housekeeping Head</option>
                      <option value="Managing Director">Managing Director</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddExpenseOpen(false)}
                    style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f1f5f9', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: 800, cursor: 'pointer' }}
                  >
                    Post Expense Voucher
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
