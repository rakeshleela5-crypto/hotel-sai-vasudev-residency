import React, { useState } from 'react';
import type { PmsExpenseRecord, PmsNightAuditRecord } from '../../types/pmsModels';
import { PmsStore, usePmsSync } from '../../services/pmsStore';

interface PettyExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PettyExpenseModal: React.FC<PettyExpenseModalProps> = ({ isOpen, onClose }) => {
  usePmsSync();
  const [activeTab, setActiveTab] = useState<'expenses' | 'nightAudit' | 'trialBalance' | 'auditArchive'>('expenses');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // 4-Step Night Audit Wizard State
  const [auditStep, setAuditStep] = useState<1 | 2 | 3 | 4>(1);
  const [auditorName, setAuditorName] = useState<string>('General Manager / Shift Lead');
  const [auditRemarks, setAuditRemarks] = useState<string>('All night rounds completed. Physical cash drawer verified.');
  const [overrideKotBlocker, setOverrideKotBlocker] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [auditSuccessMsg, setAuditSuccessMsg] = useState<string | null>(null);
  const [completedAuditRecord, setCompletedAuditRecord] = useState<PmsNightAuditRecord | null>(null);

  // New expense form state
  const [category, setCategory] = useState<PmsExpenseRecord['category']>('Vegetables & Dairy');
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PmsExpenseRecord['paymentMode']>('Cash');
  const [paidTo, setPaidTo] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [billNumber, setBillNumber] = useState<string>('');
  const [approvedBy, setApprovedBy] = useState<string>('General Manager');

  if (!isOpen) return null;

  const businessDate = PmsStore.getBusinessDate();
  const expenses = PmsStore.getExpenses();
  const nightAudits = PmsStore.getNightAudits();
  const preCheck = PmsStore.getNightAuditPreCheck();
  const trialBalance = PmsStore.getTrialBalance();

  const rooms = PmsStore.getRooms();
  const occupiedRooms = rooms.filter(r => PmsStore.isRoomOccupied(r));

  // Cash Drawer Calculation:
  const cashPayments = PmsStore.getFolioPayments().filter(p => p.paymentMode === 'Cash').reduce((s, p) => s + p.amount, 0);
  const cashExpenses = expenses.filter(e => e.paymentMode === 'Cash').reduce((s, e) => s + e.amount, 0);
  const startingFloat = 15000; // Base cash drawer
  const netCashInHand = Math.max(0, startingFloat + cashPayments - cashExpenses);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }
    if (!paidTo.trim()) {
      alert('Please specify the recipient or vendor name.');
      return;
    }

    setIsProcessing(true);
    try {
      const now = new Date();
      PmsStore.addExpense({
        date: businessDate,
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
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteNightAudit = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const record = PmsStore.runNightAudit(auditorName.trim() || 'General Manager / Shift Lead');
      setCompletedAuditRecord(record);
      setAuditSuccessMsg(`Night Audit ${record.auditId} executed successfully! Business Date rolled to ${PmsStore.getBusinessDate()}. Room tariffs posted for ${record.occupiedRoomsCount} room(s).`);
    } catch (err: any) {
      alert(`Night Audit error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pms-modal-backdrop" style={{ zIndex: 12000 }}>
      <div className="pms-modal-window" style={{ maxWidth: '1180px', width: '96%', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="pms-modal-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '26px' }}>💰</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Financial Controls, Night Audit &amp; Journal Ledger</h3>
                <span style={{ background: '#2563eb', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                  📅 BIZ DATE: {businessDate}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.9 }}>
                Hotel Sai Vasudev Residency &bull; Section 170 CGST Act Compliant &bull; Double-Entry Accrual Engine
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="view-toggle-btns" style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.12)', padding: '3px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('expenses')}
                disabled={isProcessing}
                style={{
                  background: activeTab === 'expenses' ? '#ffffff' : 'transparent',
                  color: activeTab === 'expenses' ? '#0f172a' : '#ffffff',
                  border: 'none',
                  padding: '5px 11px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                🧾 Petty Cash Expenses
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('nightAudit')}
                disabled={isProcessing}
                style={{
                  background: activeTab === 'nightAudit' ? '#ffffff' : 'transparent',
                  color: activeTab === 'nightAudit' ? '#0f172a' : '#ffffff',
                  border: 'none',
                  padding: '5px 11px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                🌙 Night Audit Wizard
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('trialBalance')}
                disabled={isProcessing}
                style={{
                  background: activeTab === 'trialBalance' ? '#ffffff' : 'transparent',
                  color: activeTab === 'trialBalance' ? '#0f172a' : '#ffffff',
                  border: 'none',
                  padding: '5px 11px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                ⚖️ Trial Balance
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('auditArchive')}
                disabled={isProcessing}
                style={{
                  background: activeTab === 'auditArchive' ? '#ffffff' : 'transparent',
                  color: activeTab === 'auditArchive' ? '#0f172a' : '#ffffff',
                  border: 'none',
                  padding: '5px 11px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                📁 Audit History
              </button>
            </div>
            <button type="button" className="pms-close-btn" onClick={onClose} disabled={isProcessing} style={{ color: '#ffffff' }}>&times;</button>
          </div>
        </div>

        {/* Financial KPI Banner */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Net Cash in Hand</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#059669' }}>₹{netCashInHand.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Drawer Float + Inward - Expenses</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Expenses (Today)</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#dc2626' }}>₹{totalExpenses.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{expenses.length} voucher(s) logged</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Trial Balance Status</div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: trialBalance.isBalanced ? '#059669' : '#dc2626' }}>
              {trialBalance.isBalanced ? '✓ TALLY BALANCED' : '⚠️ OUT OF BALANCE'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>
              Dr ₹{trialBalance.totalDebit.toLocaleString('en-IN')} | Cr ₹{trialBalance.totalCredit.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setIsAddExpenseOpen(true)}
              disabled={isProcessing}
              style={{
                padding: '7px 12px',
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
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
              onClick={() => { setActiveTab('nightAudit'); setAuditStep(1); }}
              disabled={isProcessing}
              style={{
                padding: '7px 12px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>🌙 Open Night Audit Wizard</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {auditSuccessMsg && (
          <div style={{ margin: '12px 20px 0', padding: '10px 14px', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: '6px', fontSize: '12px', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>✨ {auditSuccessMsg}</span>
            <button type="button" onClick={() => setAuditSuccessMsg(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, color: '#166534' }}>&times;</button>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: PETTY CASH EXPENSES */}
          {activeTab === 'expenses' && (
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
                            disabled={isProcessing}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: isProcessing ? 'not-allowed' : 'pointer', fontSize: '13px' }}
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
          )}

          {/* TAB 2: 4-STEP NIGHT AUDIT WIZARD */}
          {activeTab === 'nightAudit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Stepper Progress Indicator */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', background: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
                {[
                  { step: 1, title: 'Step 1: System Health Check', desc: 'Pre-Audit Interlocks' },
                  { step: 2, title: 'Step 2: Room Tariff & GST Accrual', desc: 'SAC 996311 Ledger' },
                  { step: 3, title: 'Step 3: Housekeeping Roll', desc: 'Linen & Morning Status' },
                  { step: 4, title: 'Step 4: Execute & Trial Balance', desc: 'Date Roll & Tally' }
                ].map(s => {
                  const isActive = auditStep === s.step;
                  const isDone = auditStep > s.step;
                  return (
                    <div
                      key={s.step}
                      onClick={() => !isProcessing && setAuditStep(s.step as any)}
                      style={{
                        background: isActive ? '#ffffff' : isDone ? '#e0f2fe' : 'transparent',
                        border: isActive ? '2px solid #2563eb' : isDone ? '1px solid #7dd3fc' : '1px solid transparent',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: isActive ? '#2563eb' : isDone ? '#059669' : '#cbd5e1',
                          color: '#ffffff'
                        }}>
                          {isDone ? '✓' : s.step}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: isActive ? '#1e293b' : '#64748b' }}>
                          {s.title}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '26px' }}>
                        {s.desc}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* STEP 1: PRE-AUDIT SYSTEM HEALTH CHECK */}
              {auditStep === 1 && (
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                        Step 1: Pre-Audit System Health Check &amp; Interlocks
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                        Verifying pending arrivals, overdue departures, and restaurant KDS orders for Business Date: <strong>{preCheck.businessDate}</strong>.
                      </p>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 800,
                      background: preCheck.canProceed ? '#dcfce7' : '#fee2e2',
                      color: preCheck.canProceed ? '#166534' : '#991b1b'
                    }}>
                      {preCheck.canProceed ? '✓ Ready to Proceed' : '⚠️ Interlocks Detected'}
                    </span>
                  </div>

                  {/* 4 Health Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: preCheck.pendingArrivalsCount > 0 ? '#fffbeb' : '#f8fafc' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Expected Arrivals Pending</div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: preCheck.pendingArrivalsCount > 0 ? '#d97706' : '#059669', margin: '4px 0' }}>
                        {preCheck.pendingArrivalsCount}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {preCheck.pendingArrivalsCount > 0 ? 'Guests booked today not yet checked in. Will roll over or mark No-Show.' : 'All booked arrivals processed.'}
                      </div>
                    </div>

                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: preCheck.overdueDeparturesCount > 0 ? '#fffbeb' : '#f8fafc' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Overdue Departures</div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: preCheck.overdueDeparturesCount > 0 ? '#d97706' : '#059669', margin: '4px 0' }}>
                        {preCheck.overdueDeparturesCount}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {preCheck.overdueDeparturesCount > 0 ? 'Checkouts due on or before today still marked In-House.' : 'All scheduled departures settled.'}
                      </div>
                    </div>

                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: preCheck.openKotsCount > 0 ? '#fee2e2' : '#f8fafc' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Vasudev Rasoi Open KOTs</div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: preCheck.openKotsCount > 0 ? '#dc2626' : '#059669', margin: '4px 0' }}>
                        {preCheck.openKotsCount}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {preCheck.openKotsCount > 0 ? '⚠️ Unsettled tickets in Kitchen Display System (KDS).' : 'All dining and room service KOTs billed & closed.'}
                      </div>
                    </div>

                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#eff6ff' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>Occupied In-House Rooms</div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#2563eb', margin: '4px 0' }}>
                        {preCheck.occupiedRoomsCount} / 18
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Daily room tariff &amp; 12%/18% GST will be posted to folios.
                      </div>
                    </div>
                  </div>

                  {/* Blockers Notification */}
                  {preCheck.blockers.length > 0 && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px', marginBottom: '14px' }}>
                      <strong style={{ color: '#991b1b', fontSize: '13px' }}>⚠️ Night Audit Hard Interlocks:</strong>
                      <ul style={{ margin: '6px 0 10px', paddingLeft: '20px', fontSize: '12px', color: '#b91c1c' }}>
                        {preCheck.blockers.map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#7f1d1d', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={overrideKotBlocker}
                          onChange={e => setOverrideKotBlocker(e.target.checked)}
                          disabled={isProcessing}
                        />
                        <span>Auditor Override: I verify that kitchen operations are concluded and authorize proceeding.</span>
                      </label>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setAuditStep(2)}
                      disabled={isProcessing || (!preCheck.canProceed && !overrideKotBlocker)}
                      style={{
                        padding: '9px 18px',
                        background: (!preCheck.canProceed && !overrideKotBlocker) ? '#94a3b8' : '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: (!preCheck.canProceed && !overrideKotBlocker) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>Proceed to Step 2: Tariff &amp; GST Preview &rarr;</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: ROOM TARIFF & GST ACCRUAL PREVIEW */}
              {auditStep === 2 && (
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                        Step 2: Room Tariff &amp; Statutory GST Accrual Preview (SAC 996311)
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                        Posting daily accommodation revenue &amp; Output CGST + SGST to occupied in-house guest folios.
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Total Night Accrual</span>
                      <strong style={{ fontSize: '16px', color: '#059669' }}>
                        ₹{(preCheck.totalTariffAccruable + preCheck.totalGstAccruable).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  {/* Summary Metric Callouts */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Base Room Tariffs (Revenue)</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>₹{preCheck.totalTariffAccruable.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Cr Room Accommodation Revenue</div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Statutory GST (CGST + SGST)</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#7c3aed' }}>₹{preCheck.totalGstAccruable.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Cr Output CGST &amp; Cr Output SGST</div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Total In-House Receivables</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>
                        ₹{(preCheck.totalTariffAccruable + preCheck.totalGstAccruable).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Dr In-House Guest Folio Receivable</div>
                    </div>
                  </div>

                  {/* Itemized Occupied Rooms Accrual Table */}
                  <table className="pms-table" style={{ width: '100%', fontSize: '12px', marginBottom: '14px' }}>
                    <thead>
                      <tr style={{ background: '#1e293b', color: '#ffffff' }}>
                        <th style={{ padding: '8px' }}>Room #</th>
                        <th style={{ padding: '8px' }}>Room Category</th>
                        <th style={{ padding: '8px' }}>Guest Name</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Tariff (₹)</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>GST Slab</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>CGST (₹)</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>SGST (₹)</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Daily Total (₹)</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Folio Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {occupiedRooms.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                            No occupied rooms in hotel tonight. No tariffs to accrue.
                          </td>
                        </tr>
                      ) : (
                        occupiedRooms.map(r => {
                          const folio = PmsStore.getFolioSummary(r.roomNo);
                          const tariff = r.tariff;
                          const gstRate = tariff > 7500 ? 18 : 12;
                          const gstAmount = Math.round(tariff * (gstRate / 100));
                          const cgst = Math.round(gstAmount / 2);
                          const sgst = cgst;
                          const dailyTotal = tariff + cgst + sgst;
                          const newBalanceForecast = folio.balanceDue + dailyTotal;

                          return (
                            <tr key={r.roomNo} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '8px', fontWeight: 800, color: '#2563eb' }}>Room {r.roomNo}</td>
                              <td style={{ padding: '8px', color: '#475569' }}>{r.roomType}</td>
                              <td style={{ padding: '8px', fontWeight: 700 }}>{folio.guestName || 'In-House Guest'}</td>
                              <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>₹{tariff.toLocaleString('en-IN')}</td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>
                                <span style={{ background: gstRate === 18 ? '#fef3c7' : '#e0f2fe', color: gstRate === 18 ? '#92400e' : '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                  {gstRate}% (SAC 996311)
                                </span>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>₹{cgst.toLocaleString('en-IN')}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>₹{sgst.toLocaleString('en-IN')}</td>
                              <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, color: '#1e293b' }}>₹{dailyTotal.toLocaleString('en-IN')}</td>
                              <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                                ₹{newBalanceForecast.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  <div style={{ background: '#f1f5f9', borderRadius: '6px', padding: '10px', fontSize: '11px', color: '#64748b', marginBottom: '14px' }}>
                    🔒 <strong>Section 170 CGST Act &amp; Idempotency Protection:</strong> Each room's tariff and tax accrual is keyed by <code>{preCheck.businessDate}_[RoomNo]</code>. Rerunning Night Audit for the same business date will never duplicate charges.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      onClick={() => setAuditStep(1)}
                      disabled={isProcessing}
                      style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                    >
                      &larr; Back to Step 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuditStep(3)}
                      disabled={isProcessing}
                      style={{ padding: '9px 18px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 800, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                    >
                      Proceed to Step 3: Housekeeping Roll &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: HOUSEKEEPING MORNING ROLL */}
              {auditStep === 3 && (
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                        Step 3: Housekeeping Status Roll &amp; Morning Shift Handover
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                        Transitioning room statuses for the morning cleaning shift and logging shift handover notes.
                      </p>
                    </div>
                    <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                      🧹 Morning Housekeeping Prep
                    </span>
                  </div>

                  {/* Housekeeping Action Summary */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', background: '#f8fafc', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🔄</span>
                      <strong style={{ fontSize: '14px', color: '#1e293b' }}>Automatic Room Status Roll:</strong>
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#475569' }}>
                      All <strong>{occupiedRooms.length} occupied room(s)</strong> currently flagged as <code>OCCUPIED_CLEAN</code> will be flipped to <code>OCCUPIED_DIRTY</code>.
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#475569' }}>
                      <li>Morning Housekeeping roster (Ramesh, Suresh, Meena) will receive prioritized cleaning tasks.</li>
                      <li>Bed linen change, fresh bath towels, and Sai Darshan devotee kit replenishment will be assigned.</li>
                      <li>Front Desk inspection dashboard will reflect live housekeeping progression.</li>
                    </ul>
                  </div>

                  {/* Auditor Details & Remarks */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Auditor / Shift Lead Name:</label>
                      <input
                        type="text"
                        value={auditorName}
                        onChange={e => setAuditorName(e.target.value)}
                        disabled={isProcessing}
                        placeholder="e.g. Ramesh Patil (Night Auditor)"
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Shift Handover Remarks / Cash Drawer Notes:</label>
                      <input
                        type="text"
                        value={auditRemarks}
                        onChange={e => setAuditRemarks(e.target.value)}
                        disabled={isProcessing}
                        placeholder="e.g. Verified physical cash float ₹15,000 against reception safe."
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      onClick={() => setAuditStep(2)}
                      disabled={isProcessing}
                      style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                    >
                      &larr; Back to Step 2
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuditStep(4)}
                      disabled={isProcessing}
                      style={{ padding: '9px 18px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 800, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                    >
                      Proceed to Step 4: Final Execution &amp; Date Roll &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: EXECUTE & TRIAL BALANCE */}
              {auditStep === 4 && (
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                        Step 4: Execute Night Audit, Roll Business Date &amp; Reconcile Ledger
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                        Post Double-Entry Journal Vouchers, roll ERP business date forward by +1 day, and generate balanced Trial Balance.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePrint}
                      disabled={isProcessing}
                      style={{ padding: '6px 12px', background: '#475569', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                    >
                      🖨️ Print Audit Summary
                    </button>
                  </div>

                  {/* Execution Action Box */}
                  <div style={{ background: completedAuditRecord ? '#ecfdf5' : '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '6px' }}>
                      {completedAuditRecord ? '🎉' : '🌙'}
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: '#166534' }}>
                      {completedAuditRecord ? `Night Audit ${completedAuditRecord.auditId} Completed!` : 'Ready for Final Night Audit Execution'}
                    </h3>
                    <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#374151', maxWidth: '600px', marginInline: 'auto' }}>
                      {completedAuditRecord ? (
                        <>
                          Successfully posted accommodation charges for <strong>{completedAuditRecord.occupiedRoomsCount} occupied room(s)</strong>.
                          Current ERP Business Date is now <strong>{businessDate}</strong>.
                        </>
                      ) : (
                        <>
                          Executing will post ₹{preCheck.totalTariffAccruable.toLocaleString('en-IN')} in room tariffs + ₹{preCheck.totalGstAccruable.toLocaleString('en-IN')} in GST, flip occupied rooms to OCCUPIED_DIRTY, and advance the ERP date to next day.
                        </>
                      )}
                    </p>

                    {!completedAuditRecord ? (
                      <button
                        type="button"
                        onClick={handleExecuteNightAudit}
                        disabled={isProcessing}
                        style={{
                          padding: '12px 28px',
                          background: isProcessing ? '#94a3b8' : '#059669',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '15px',
                          fontWeight: 900,
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 6px rgba(5, 150, 105, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>{isProcessing ? '⏳ Posting Journal Vouchers...' : '🌙 Confirm & Execute Night Audit'}</span>
                      </button>
                    ) : (
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 800 }}>
                          ✓ Shift Closed &bull; Archived in Night Audit History
                        </span>
                        <button
                          type="button"
                          onClick={() => { setCompletedAuditRecord(null); setAuditStep(1); }}
                          disabled={isProcessing}
                          style={{ padding: '6px 12px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                        >
                          Start New Audit Cycle
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Live Balanced Trial Balance Section */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
                        Reconciled Double-Entry Trial Balance (Post-Audit)
                      </h5>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: trialBalance.isBalanced ? '#dcfce7' : '#fee2e2',
                        color: trialBalance.isBalanced ? '#166534' : '#991b1b'
                      }}>
                        {trialBalance.isBalanced ? '✓ TALLY BALANCED (Debit === Credit)' : '⚠️ OUT OF BALANCE'}
                      </span>
                    </div>

                    <table className="pms-table" style={{ width: '100%', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                          <th style={{ padding: '6px 8px' }}>General Ledger Account Name</th>
                          <th style={{ padding: '6px 8px' }}>Classification</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>Debit (Dr ₹)</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>Credit (Cr ₹)</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>Net Balance (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trialBalance.accounts.map(acc => (
                          <tr key={acc.name} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 700 }}>{acc.name}</td>
                            <td style={{ padding: '6px 8px' }}>
                              <span style={{
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 700,
                                background: acc.type === 'Asset' ? '#e0f2fe' : acc.type === 'Liability' ? '#fef3c7' : acc.type === 'Income' ? '#dcfce7' : '#fee2e2',
                                color: acc.type === 'Asset' ? '#0369a1' : acc.type === 'Liability' ? '#92400e' : acc.type === 'Income' ? '#166534' : '#991b1b'
                              }}>
                                {acc.type}
                              </span>
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: acc.debit > 0 ? 700 : 400 }}>
                              ₹{acc.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: acc.credit > 0 ? 700 : 400 }}>
                              ₹{acc.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: acc.balance >= 0 ? '#059669' : '#dc2626' }}>
                              ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f8fafc', borderTop: '2px solid #0f172a', fontWeight: 900 }}>
                          <td colSpan={2} style={{ padding: '8px' }}>TOTAL TRIAL BALANCE TALLY</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#0f172a', fontSize: '13px' }}>
                            ₹{trialBalance.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#0f172a', fontSize: '13px' }}>
                            ₹{trialBalance.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', color: trialBalance.isBalanced ? '#059669' : '#dc2626' }}>
                            {trialBalance.isBalanced ? '✓ Balanced' : 'Diff: ₹' + Math.abs(trialBalance.totalDebit - trialBalance.totalCredit).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '14px' }}>
                    <button
                      type="button"
                      onClick={() => setAuditStep(3)}
                      disabled={isProcessing}
                      style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                    >
                      &larr; Back to Step 3
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRIAL BALANCE VIEW */}
          {activeTab === 'trialBalance' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                    Double-Entry Statutory Trial Balance (Dr / Cr Ledger)
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                    Continuous balance verification across Guest Advance Liability, Room Revenue, F&amp;B Revenue, and Output CGST/SGST.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 800,
                    background: trialBalance.isBalanced ? '#dcfce7' : '#fee2e2',
                    color: trialBalance.isBalanced ? '#166534' : '#991b1b'
                  }}>
                    {trialBalance.isBalanced ? '✓ TALLY BALANCED' : '⚠️ OUT OF BALANCE'}
                  </span>
                  <button
                    type="button"
                    onClick={handlePrint}
                    disabled={isProcessing}
                    style={{ padding: '6px 12px', background: '#475569', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                  >
                    🖨️ Print
                  </button>
                </div>
              </div>

              <table className="pms-table" style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                    <th style={{ padding: '8px' }}>Account Name</th>
                    <th style={{ padding: '8px' }}>Type</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Debit Total (Dr ₹)</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Credit Total (Cr ₹)</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Net Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.accounts.map(acc => (
                    <tr key={acc.name} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', fontWeight: 700 }}>{acc.name}</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: acc.type === 'Asset' ? '#e0f2fe' : acc.type === 'Liability' ? '#fef3c7' : acc.type === 'Income' ? '#dcfce7' : '#fee2e2',
                          color: acc.type === 'Asset' ? '#0369a1' : acc.type === 'Liability' ? '#92400e' : acc.type === 'Income' ? '#166534' : '#991b1b'
                        }}>
                          {acc.type}
                        </span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: acc.debit > 0 ? 700 : 400 }}>
                        ₹{acc.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: acc.credit > 0 ? 700 : 400 }}>
                        ₹{acc.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: acc.balance >= 0 ? '#059669' : '#dc2626' }}>
                        ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #0f172a', fontWeight: 900, fontSize: '13px' }}>
                    <td colSpan={2} style={{ padding: '10px 8px' }}>TRIAL BALANCE TOTAL</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#0f172a' }}>
                      ₹{trialBalance.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#0f172a' }}>
                      ₹{trialBalance.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: trialBalance.isBalanced ? '#059669' : '#dc2626' }}>
                      {trialBalance.isBalanced ? '✓ Tally Zero-Diff' : 'Diff: ₹' + Math.abs(trialBalance.totalDebit - trialBalance.totalCredit).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* TAB 4: AUDIT HISTORY ARCHIVE */}
          {activeTab === 'auditArchive' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>Daily Night Audit History &amp; Handover Reports</h4>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Archived records of daily tariff postings, drawer cash counts &amp; receivables.</span>
              </div>

              {nightAudits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  No night audit records archived yet.
                </div>
              ) : (
                nightAudits.map(audit => (
                  <div key={audit.auditId} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', marginBottom: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '15px', color: '#1e293b' }}>Audit ID: {audit.auditId}</strong>
                        <span style={{ marginLeft: '10px', fontSize: '12px', color: '#64748b' }}>Executed: {audit.executedAt} by {audit.executedBy}</span>
                      </div>
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                        ✓ Verified &amp; Closed
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '10px', background: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '12px' }}>
                      <div>Occupied Rooms: <strong>{audit.occupiedRoomsCount}</strong></div>
                      <div>Room Tariffs: <strong>₹{audit.totalRoomTariffPosted.toLocaleString('en-IN')}</strong></div>
                      <div>GST Posted: <strong>₹{audit.totalGstPosted.toLocaleString('en-IN')}</strong></div>
                      <div>Cash In Drawer: <strong style={{ color: '#059669' }}>₹{audit.cashInHand.toLocaleString('en-IN')}</strong></div>
                      <div>UPI Collections: <strong style={{ color: '#0284c7' }}>₹{audit.upiTotal.toLocaleString('en-IN')}</strong></div>
                      <div>Card Collections: <strong style={{ color: '#7c3aed' }}>₹{audit.cardTotal.toLocaleString('en-IN')}</strong></div>
                      <div>Receivables: <strong style={{ color: '#dc2626' }}>₹{audit.pendingReceivables.toLocaleString('en-IN')}</strong></div>
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
                ))
              )}
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
                <button type="button" onClick={() => setIsAddExpenseOpen(false)} disabled={isProcessing} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: isProcessing ? 'not-allowed' : 'pointer' }}>&times;</button>
              </div>

              <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Expense Category:</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    disabled={isProcessing}
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
                      disabled={isProcessing}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Payment Mode:</label>
                    <select
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value as any)}
                      disabled={isProcessing}
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
                    disabled={isProcessing}
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
                    disabled={isProcessing}
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
                      disabled={isProcessing}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Approved By:</label>
                    <select
                      value={approvedBy}
                      onChange={e => setApprovedBy(e.target.value)}
                      disabled={isProcessing}
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
                    disabled={isProcessing}
                    style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f1f5f9', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: 800, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                  >
                    {isProcessing ? 'Posting...' : 'Post Expense Voucher'}
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

