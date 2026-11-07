import React, { useState, useEffect, useCallback } from 'react';
import { hotelApi } from '../../services/api';
import type {
  CorporateAgingReport,
  CorporateReceivable,
  CorporateSettlementResponse
} from '../../types/pmsModels';

interface CorporateArAgingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CorporateArAgingModal: React.FC<CorporateArAgingModalProps> = ({
  isOpen,
  onClose
}) => {
  const [report, setReport] = useState<CorporateAgingReport | null>(null);
  const [receivables, setReceivables] = useState<CorporateReceivable[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'aging_matrix' | 'receivables' | 'new_invoice' | 'settle'>('aging_matrix');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Invoice Form State
  const [newInvoiceNo, setNewInvoiceNo] = useState<string>('');
  const [newPartyName, setNewPartyName] = useState<string>('');
  const [newGuestName, setNewGuestName] = useState<string>('');
  const [newBookingRef, setNewBookingRef] = useState<string>('');
  const [newAmount, setNewAmount] = useState<number | ''>('');
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');

  // Settle Remittance Form State
  const [settlePartyName, setSettlePartyName] = useState<string>('');
  const [settleAmount, setSettleAmount] = useState<number | ''>('');
  const [settleMode, setSettleMode] = useState<string>('NEFT');
  const [settleTdsPct, setSettleTdsPct] = useState<number>(0);
  const [settleUtr, setSettleUtr] = useState<string>('');
  const [settleNotes, setSettleNotes] = useState<string>('');

  // Bad Debt Write-Off Modal State
  const [writeOffModalOpen, setWriteOffModalOpen] = useState<boolean>(false);
  const [selectedReceivable, setSelectedReceivable] = useState<CorporateReceivable | null>(null);
  const [writeOffReason, setWriteOffReason] = useState<string>('Uncollectible Bad Debt');
  const [writeOffPin, setWriteOffPin] = useState<string>('');
  const [authorizedBy, setAuthorizedBy] = useState<string>('Finance Director');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [agingReport, recs] = await Promise.all([
        hotelApi.getCorporateAgingReport(),
        hotelApi.getCorporateReceivables()
      ]);
      setReport(agingReport);
      setReceivables(recs || []);
    } catch (err: any) {
      console.error('Failed to load corporate AR data:', err);
      setActionNotice({ type: 'error', text: err.message || 'Failed to load AR aging data' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActionNotice(null);
      loadData();
    }
  }, [isOpen, loadData]);

  if (!isOpen) return null;

  const handleCreateReceivable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceNo || !newPartyName || !newAmount || Number(newAmount) <= 0) {
      setActionNotice({ type: 'error', text: 'Invoice number, client name, and valid amount are required.' });
      return;
    }
    setLoading(true);
    try {
      await hotelApi.createCorporateReceivable({
        invoice_no: newInvoiceNo.trim(),
        party_name: newPartyName.trim(),
        guest_name: newGuestName.trim() || undefined,
        booking_ref: newBookingRef.trim() || undefined,
        invoice_amount: Number(newAmount),
        due_date: newDueDate || undefined,
        notes: newNotes.trim() || undefined
      });
      setActionNotice({ type: 'success', text: `Invoice ${newInvoiceNo} posted to Corporate City Ledger.` });
      setNewInvoiceNo('');
      setNewPartyName('');
      setNewGuestName('');
      setNewBookingRef('');
      setNewAmount('');
      setNewDueDate('');
      setNewNotes('');
      await loadData();
      setActiveTab('aging_matrix');
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSettleRemittance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlePartyName || !settleAmount || Number(settleAmount) <= 0) {
      setActionNotice({ type: 'error', text: 'Select a corporate client and specify a positive remittance amount.' });
      return;
    }
    setLoading(true);
    try {
      const result: CorporateSettlementResponse = await hotelApi.settleCorporateInvoices({
        party_name: settlePartyName,
        payment_amount: Number(settleAmount),
        payment_mode: settleMode,
        tds_rate_pct: Number(settleTdsPct),
        bank_utr_ref: settleUtr.trim() || undefined,
        notes: settleNotes.trim() || undefined
      });
      setActionNotice({
        type: 'success',
        text: `Remittance of ₹${result.total_credited_rupees.toLocaleString('en-IN')} allocated across ${result.invoices_settled_count} invoices (Receipt: ${result.receipt_voucher_no}).`
      });
      setSettleAmount('');
      setSettleUtr('');
      setSettleNotes('');
      await loadData();
      setActiveTab('aging_matrix');
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleWriteOffBadDebt = async () => {
    if (!selectedReceivable || !writeOffPin) {
      setActionNotice({ type: 'error', text: 'Manager PIN is mandatory for bad debt write-off authorization.' });
      return;
    }
    setLoading(true);
    try {
      await hotelApi.writeOffBadDebt({
        receivable_id: selectedReceivable.id,
        reason: writeOffReason,
        manager_pin: writeOffPin,
        authorized_by: authorizedBy
      });
      setActionNotice({
        type: 'success',
        text: `Invoice ${selectedReceivable.invoice_no} (₹${selectedReceivable.outstanding_amount.toLocaleString('en-IN')}) written off to GL.`
      });
      setWriteOffModalOpen(false);
      setSelectedReceivable(null);
      setWriteOffPin('');
      await loadData();
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = report?.corporate_clients.filter((client) =>
    client.party_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredReceivables = receivables.filter((rec) =>
    rec.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.party_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rec.guest_name && rec.guest_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-xl">
              🏛️
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Corporate Debtor AR Aging Master
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  City Ledger 5-Tier
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Statutory Sec 194C TDS Deduction • FIFO Auto-Reconciliation • Manager Credit Lock
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition"
              title="Refresh Aging"
            >
              <span className={`inline-block ${loading ? 'animate-spin' : ''}`}>🔄</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Global Summary KPI Bar */}
        {report && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-slate-950/60 border-b border-slate-800/80">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total AR Due</div>
              <div className="text-lg font-black text-amber-400 mt-1">
                ₹{report.total_receivables.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{report.corporate_clients.length} Corporate Accounts</div>
            </div>

            <div className="bg-slate-900/90 border border-emerald-900/40 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                ✅ Current (Not Due)
              </div>
              <div className="text-lg font-bold text-emerald-300 mt-1">
                ₹{(report.summary_by_bucket['Current'] || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-blue-900/40 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">1-30 Days</div>
              <div className="text-lg font-bold text-blue-300 mt-1">
                ₹{(report.summary_by_bucket['1-30 Days'] || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-yellow-900/40 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-yellow-400 uppercase tracking-wider">31-60 Days</div>
              <div className="text-lg font-bold text-yellow-300 mt-1">
                ₹{(report.summary_by_bucket['31-60 Days'] || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-orange-900/40 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                ⚠️ 61-90 Days
              </div>
              <div className="text-lg font-bold text-orange-300 mt-1">
                ₹{(report.summary_by_bucket['61-90 Days'] || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                🛡️ 90+ Days (Blocked)
              </div>
              <div className="text-lg font-black text-rose-300 mt-1">
                ₹{(report.summary_by_bucket['90+ Days'] || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}

        {/* Action Notice */}
        {actionNotice && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl flex items-center justify-between text-sm ${
              actionNotice.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                : 'bg-rose-950/60 border border-rose-800 text-rose-200'
            }`}
          >
            <span>{actionNotice.text}</span>
            <button onClick={() => setActionNotice(null)} className="text-xs underline hover:no-underline ml-4">
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 pt-4 border-b border-slate-800">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('aging_matrix')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition border-b-2 flex items-center gap-2 ${
                activeTab === 'aging_matrix'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📊</span>
              Corporate Aging Matrix ({report?.corporate_clients.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('receivables')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition border-b-2 flex items-center gap-2 ${
                activeTab === 'receivables'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📄</span>
              All Receivables ({receivables.length})
            </button>
            <button
              onClick={() => setActiveTab('settle')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition border-b-2 flex items-center gap-2 ${
                activeTab === 'settle'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>💰</span>
              Remittance Settlement &amp; TDS
            </button>
            <button
              onClick={() => setActiveTab('new_invoice')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition border-b-2 flex items-center gap-2 ${
                activeTab === 'new_invoice'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>↗️</span>
              Post Corporate Bill
            </button>
          </div>

          <div className="relative pb-2 flex items-center">
            <input
              type="text"
              placeholder="Search client or invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-3 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: Corporate Aging Matrix */}
          {activeTab === 'aging_matrix' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Corporate Client</th>
                      <th className="py-3 px-4 text-right">Credit Limit</th>
                      <th className="py-3 px-4 text-right text-emerald-400">Current</th>
                      <th className="py-3 px-4 text-right text-blue-400">1-30 Days</th>
                      <th className="py-3 px-4 text-right text-yellow-400">31-60 Days</th>
                      <th className="py-3 px-4 text-right text-orange-400">61-90 Days</th>
                      <th className="py-3 px-4 text-right text-rose-400">90+ Days</th>
                      <th className="py-3 px-4 text-right font-bold text-white">Total Due</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-500">
                          No corporate debtors found.
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60 transition">
                          <td className="py-3 px-4 font-semibold text-slate-200">
                            <div>{client.party_name}</div>
                            <div className="text-[10px] text-slate-500">
                              {client.unpaid_invoices_count} pending bill{client.unpaid_invoices_count !== 1 ? 's' : ''} • {client.payment_terms_days}d terms
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-300 font-mono">
                            {client.credit_limit > 0 ? `₹${client.credit_limit.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-300">
                            ₹{client.current_amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-blue-300">
                            ₹{client.bucket_1_30_days.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-yellow-300">
                            ₹{client.bucket_31_60_days.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-orange-300">
                            ₹{client.bucket_61_90_days.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                            ₹{client.bucket_90_plus_days.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-amber-400 text-sm">
                            ₹{client.total_outstanding.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {client.is_credit_blocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                🛡️ Blocked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                ✅ Clear
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center space-x-2">
                            <button
                              onClick={() => {
                                setSettlePartyName(client.party_name);
                                setSettleAmount(client.total_outstanding);
                                setActiveTab('settle');
                              }}
                              className="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded text-[11px] font-medium transition"
                            >
                              Settle
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: All Receivables Detail */}
          {activeTab === 'receivables' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Corporate Party</th>
                      <th className="py-3 px-4">Guest / Booking</th>
                      <th className="py-3 px-4">Invoice Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">Invoice Amt</th>
                      <th className="py-3 px-4 text-right text-amber-400">Balance Due</th>
                      <th className="py-3 px-4 text-center">Aging Bucket</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredReceivables.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-500">
                          No corporate receivable records found.
                        </td>
                      </tr>
                    ) : (
                      filteredReceivables.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-900/60 transition">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-300">{rec.invoice_no}</td>
                          <td className="py-3 px-4 font-semibold text-slate-200">{rec.party_name}</td>
                          <td className="py-3 px-4 text-slate-400">
                            <div>{rec.guest_name || '—'}</div>
                            {rec.booking_ref && <div className="text-[10px] text-slate-500">{rec.booking_ref}</div>}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono">{rec.invoice_date}</td>
                          <td className="py-3 px-4 text-slate-400 font-mono">
                            <div>{rec.due_date}</div>
                            {rec.days_overdue > 0 && (
                              <div className="text-[10px] text-rose-400 font-semibold">{rec.days_overdue}d overdue</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300">
                            ₹{rec.invoice_amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                            ₹{rec.outstanding_amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.aging_bucket === 'Current'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : rec.aging_bucket === '1-30 Days'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : rec.aging_bucket === '31-60 Days'
                                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                  : rec.aging_bucket === '61-90 Days'
                                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {rec.aging_bucket}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                rec.status === 'Settled'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : rec.status === 'Written Off'
                                  ? 'bg-slate-700/50 text-slate-400 line-through'
                                  : rec.status === 'Partially Paid'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {rec.status !== 'Settled' && rec.status !== 'Written Off' && (
                              <button
                                onClick={() => {
                                  setSelectedReceivable(rec);
                                  setWriteOffModalOpen(true);
                                }}
                                className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-200 rounded text-[10px] font-medium transition"
                              >
                                Write Off
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Remittance Settlement & TDS */}
          {activeTab === 'settle' && (
            <div className="max-w-2xl mx-auto bg-slate-950/60 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <span>💰</span>
                Corporate Remittance &amp; Statutory TDS Allocation
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Auto-reconciles lump-sum payments across oldest overdue invoices (FIFO) and posts double-entry GL journals.
              </p>

              <form onSubmit={handleSettleRemittance} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Corporate Client *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Vedanta Alumina Ltd"
                    value={settlePartyName}
                    onChange={(e) => setSettlePartyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Net Remittance Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      placeholder="e.g., 49000"
                      value={settleAmount}
                      onChange={(e) => setSettleAmount(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Mode</label>
                    <select
                      value={settleMode}
                      onChange={(e) => setSettleMode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="NEFT">NEFT Transfer</option>
                      <option value="RTGS">RTGS Transfer</option>
                      <option value="Cheque">Corporate Cheque</option>
                      <option value="UPI">Corporate UPI</option>
                      <option value="Bank Transfer">Direct Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Section 194C TDS Rate (%)
                    </label>
                    <select
                      value={settleTdsPct}
                      onChange={(e) => setSettleTdsPct(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value={0}>0% - No TDS Deducted</option>
                      <option value={1}>1% - Individual / HUF Contractor (Sec 194C)</option>
                      <option value={2}>2% - Corporate / Company (Sec 194C)</option>
                      <option value={5}>5% - Rent / Special Category</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Bank UTR / Cheque Ref #</label>
                    <input
                      type="text"
                      placeholder="e.g., UTR-HDFC-9918237"
                      value={settleUtr}
                      onChange={(e) => setSettleUtr(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {settleAmount && Number(settleAmount) > 0 && (
                  <div className="p-3 bg-indigo-950/40 border border-indigo-900/60 rounded-xl space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-slate-300">
                      <span>Net Cash Remittance:</span>
                      <span>₹{Number(settleAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {settleTdsPct > 0 && (
                      <div className="flex justify-between text-yellow-300">
                        <span>Statutory TDS ({settleTdsPct}%):</span>
                        <span>
                          +₹{((Number(settleAmount) / (1 - settleTdsPct / 100)) * (settleTdsPct / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-emerald-400 font-bold border-t border-indigo-900/60 pt-1 mt-1">
                      <span>Total City Ledger Credit:</span>
                      <span>
                        ₹{(settleTdsPct > 0
                          ? Number(settleAmount) / (1 - settleTdsPct / 100)
                          : Number(settleAmount)
                        ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Remittance Notes</label>
                  <input
                    type="text"
                    placeholder="e.g., Batch remittance for Q3 executive conference"
                    value={settleNotes}
                    onChange={(e) => setSettleNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 font-bold text-white rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <span>✅</span>
                    Process Settlement &amp; Post Double-Entry Journal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: Post Corporate Bill */}
          {activeTab === 'new_invoice' && (
            <div className="max-w-2xl mx-auto bg-slate-950/60 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <span>↗️</span>
                Post Corporate Receivable Invoice
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Directly charge a verified corporate client account against hotel stays or conference hall events.
              </p>

              <form onSubmit={handleCreateReceivable} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., INV-CORP-2026-0042"
                      value={newInvoiceNo}
                      onChange={(e) => setNewInvoiceNo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Corporate Client *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Vedanta Alumina Ltd"
                      value={newPartyName}
                      onChange={(e) => setNewPartyName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Guest / Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g., Mr. Debashish Ray"
                      value={newGuestName}
                      onChange={(e) => setNewGuestName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Booking Ref #</label>
                    <input
                      type="text"
                      placeholder="e.g., BK-2026-1049"
                      value={newBookingRef}
                      onChange={(e) => setNewBookingRef(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice Total (₹) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      placeholder="e.g., 45000"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Description</label>
                  <textarea
                    rows={2}
                    placeholder="Details of room nights, conference food &amp; beverage billings..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 font-bold text-white rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <span>✅</span>
                    Record Receivable Invoice
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Bad Debt Write-Off Prompt Submodal */}
        {writeOffModalOpen && selectedReceivable && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-rose-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center space-x-3 text-rose-400">
                <span className="text-2xl">🛡️</span>
                <h4 className="text-base font-bold text-white">Authorize Bad Debt Write-Off</h4>
              </div>
              <p className="text-xs text-slate-300">
                You are about to write off{' '}
                <strong className="text-rose-400 font-mono">
                  ₹{selectedReceivable.outstanding_amount.toLocaleString('en-IN')}
                </strong>{' '}
                for Invoice{' '}
                <span className="font-mono text-indigo-300">{selectedReceivable.invoice_no}</span> (
                {selectedReceivable.party_name}).
                <br />
                This will debit <span className="text-amber-300">Bad Debts Written Off Expense</span> and credit{' '}
                <span className="text-amber-300">Corporate City Ledger</span> in the General Ledger.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Write-Off</label>
                <input
                  type="text"
                  value={writeOffReason}
                  onChange={(e) => setWriteOffReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Authorized Official</label>
                <input
                  type="text"
                  value={authorizedBy}
                  onChange={(e) => setAuthorizedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-300 mb-1 flex items-center gap-1">
                  <span>🔑</span> Manager Security PIN *
                </label>
                <input
                  type="password"
                  placeholder="Enter 4-digit Manager PIN"
                  value={writeOffPin}
                  onChange={(e) => setWriteOffPin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-rose-700 rounded-lg text-sm text-white font-mono tracking-widest text-center"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setWriteOffModalOpen(false);
                    setSelectedReceivable(null);
                    setWriteOffPin('');
                  }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleWriteOffBadDebt}
                  disabled={loading || !writeOffPin}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 font-bold text-white rounded-xl text-xs shadow-lg"
                >
                  Confirm Write-Off
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
