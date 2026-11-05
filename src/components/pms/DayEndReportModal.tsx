import React, { useState } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { PmsDayEndReport } from '../../types/pmsModels';
import './pmsStyles.css';

interface DayEndReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DayEndReportModal: React.FC<DayEndReportModalProps> = ({ isOpen, onClose }) => {
  const todayStr = React.useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();
    return `${day}-${m}-${y}`;
  }, []);
  const [reportDate, setReportDate] = useState<string>(todayStr);
  const [report, setReport] = useState<PmsDayEndReport>(() => PmsStore.getDayEndReport(todayStr));

  if (!isOpen) return null;

  const handleRefresh = () => {
    setReport(PmsStore.getDayEndReport(reportDate));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pms-reg-modal-backdrop" onClick={onClose}>
      <div 
        className="pms-reg-modal-window"
        style={{ maxWidth: '1080px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="pms-reg-header">
          <div className="pms-reg-header-left">
            <span className="pms-reg-header-icon">🌅</span>
            <div>
              <h2 className="pms-reg-header-title">
                DAY END REPORT &bull; NIGHT AUDIT PAPER LEDGER
              </h2>
              <div className="pms-reg-header-sub">
                pms.hotelsai-vasudev.com/dayend_report &bull; <span className="gold">SRI SAI VASUDEV RESIDENCY</span> &bull; Daily Revenue &amp; Occupancy Audit
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              className="pms-reg-btn-primary"
              style={{ padding: '6px 14px', fontSize: '11px' }}
            >
              <span>🖨️</span>
              <span>Print 2-Sheet Audit Paper</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="pms-reg-close-btn"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="bg-slate-100 px-5 py-2.5 border-b border-gray-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-700">Audit Date:</span>
            <input
              type="text"
              value={reportDate}
              onChange={e => setReportDate(e.target.value)}
              className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-800 focus:outline-none focus:border-blue-500 w-32"
              placeholder="DD-MM-YYYY"
            />
            <button
              type="button"
              onClick={handleRefresh}
              className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-xs cursor-pointer transition-colors"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => { setReportDate('19-07-2025'); handleRefresh(); }}
              className="text-[11px] text-blue-700 underline font-medium cursor-pointer"
            >
              Benchmark (19-07-2025)
            </button>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-gray-500">Night Audit Closes at 11:59 PM &bull; Real-time Cash, Online &amp; Card Sync</span>
          </div>
        </div>

        {/* Printable Paper Canvas Area (Matching Frame 0240) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 print:bg-white print:p-0">
          <div className="max-w-4xl mx-auto bg-white border border-gray-300 shadow-md p-8 rounded-sm text-gray-900 print:border-none print:shadow-none">
            
            {/* Hotel Letterhead */}
            <div className="text-center border-b border-gray-400 pb-4 mb-6">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Official Hotel Night Audit Report</div>
              <h1 className="text-2xl font-black text-gray-900 tracking-wide mt-1 uppercase">
                {report.hotelName}
              </h1>
              <p className="text-xs text-gray-600 mt-1 max-w-xl mx-auto">
                {report.address}
              </p>
              <div className="text-xs text-gray-600 mt-1 flex justify-center gap-4">
                <span><strong>Phone:</strong> {report.phone}</span>
                <span><strong>Email:</strong> {report.email}</span>
                <span><strong>Generated:</strong> {report.generatedAt}</span>
              </div>
            </div>

            {/* Quick Summary Strip */}
            <div className="grid grid-cols-4 gap-3 mb-6 bg-blue-50/70 p-3 rounded border border-blue-200 text-xs">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Audit Date</span>
                <span className="font-bold text-gray-900 text-sm">{report.reportDate}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Total Debits</span>
                <span className="font-bold text-emerald-700 text-sm">₹{report.grandTotalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Total Credits</span>
                <span className="font-bold text-red-600 text-sm">₹{report.grandTotalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Net Cash In Hand</span>
                <span className="font-bold text-blue-900 text-sm">₹{report.cashInHand.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Dr</span>
              </div>
            </div>

            {/* Account Ledger Blocks (Frame 0240 Exact Architecture) */}
            <div className="space-y-6">
              {report.groups.map((grp, gIdx) => (
                <div key={gIdx} className="border border-gray-400 rounded-sm overflow-hidden">
                  {/* Account Header */}
                  <div className="bg-slate-200 px-4 py-2 border-b border-gray-400 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                      Ledger for Account: <span className="text-blue-900 underline font-black">{grp.accountName}</span> &nbsp;&bull;&nbsp; Date: {grp.date}
                    </span>
                    <span className="text-xs font-bold text-gray-700">
                      Closing: ₹{grp.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Dr
                    </span>
                  </div>

                  {/* Account Entries Table */}
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-bold">
                        <th className="py-1.5 px-3 text-left border-r border-gray-300 w-24">Date</th>
                        <th className="py-1.5 px-3 text-left border-r border-gray-300 w-28">Type</th>
                        <th className="py-1.5 px-3 text-left border-r border-gray-300 w-32">Account Name</th>
                        <th className="py-1.5 px-3 text-left border-r border-gray-300">Remark / Voucher</th>
                        <th className="py-1.5 px-3 text-right border-r border-gray-300 w-24">Debit (₹)</th>
                        <th className="py-1.5 px-3 text-right border-r border-gray-300 w-24">Credit (₹)</th>
                        <th className="py-1.5 px-3 text-right w-28">Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grp.entries.map((entry, eIdx) => (
                        <tr key={eIdx} className="border-b border-gray-200 hover:bg-yellow-50/50">
                          <td className="py-1.5 px-3 border-r border-gray-200 font-mono text-[11px] text-gray-600">{entry.date}</td>
                          <td className="py-1.5 px-3 border-r border-gray-200 font-semibold text-gray-800">{entry.type}</td>
                          <td className="py-1.5 px-3 border-r border-gray-200 text-gray-700">{entry.accountName}</td>
                          <td className="py-1.5 px-3 border-r border-gray-200 text-gray-700">{entry.remark}</td>
                          <td className="py-1.5 px-3 border-r border-gray-200 text-right font-mono font-semibold text-emerald-700">
                            {entry.debit > 0 ? entry.debit.toFixed(2) : '0'}
                          </td>
                          <td className="py-1.5 px-3 border-r border-gray-200 text-right font-mono font-semibold text-red-600">
                            {entry.credit > 0 ? entry.credit.toFixed(2) : '0'}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-gray-900">
                            {entry.balance.toFixed(2)} Dr
                          </td>
                        </tr>
                      ))}
                      {/* Subtotal row for this account */}
                      <tr className="bg-slate-100 font-bold border-t border-gray-300">
                        <td colSpan={4} className="py-1.5 px-3 text-right uppercase text-[11px] border-r border-gray-300 text-gray-700">
                          TOTAL ({grp.accountName})
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-emerald-800 border-r border-gray-300">
                          {grp.totalDebit.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-red-700 border-r border-gray-300">
                          {grp.totalCredit.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-gray-900">
                          {grp.closingBalance.toFixed(2)} Dr
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Night Audit Signatures */}
            <div className="mt-12 pt-6 border-t border-gray-300 grid grid-cols-3 gap-6 text-center text-xs text-gray-600">
              <div>
                <div className="h-10 border-b border-gray-400 border-dashed mb-1.5"></div>
                <span className="font-bold text-gray-800">Night Auditor / Cashier</span>
                <p className="text-[10px] text-gray-500">Cash Verified with Safe</p>
              </div>
              <div>
                <div className="h-10 border-b border-gray-400 border-dashed mb-1.5"></div>
                <span className="font-bold text-gray-800">Front Office Manager</span>
                <p className="text-[10px] text-gray-500">Folios &amp; Vouchers Reconciled</p>
              </div>
              <div>
                <div className="h-10 border-b border-gray-400 border-dashed mb-1.5"></div>
                <span className="font-bold text-gray-800">General Manager / Owner</span>
                <p className="text-[10px] text-gray-500">Bank Deposits Approved</p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-600">
            Official Day End Report (Night Audit Register)
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded cursor-pointer transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
