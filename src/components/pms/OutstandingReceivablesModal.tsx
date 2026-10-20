import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { PmsOutstandingAccount } from '../../types/pmsModels';
import { PartyLedgerModal } from './PartyLedgerModal';
import './pmsStyles.css';

interface OutstandingReceivablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollectPayment?: (partyName: string) => void;
  initialMode?: 'receivable' | 'payable';
}

export const OutstandingReceivablesModal: React.FC<OutstandingReceivablesModalProps> = ({
  isOpen,
  onClose,
  onCollectPayment,
  initialMode = 'receivable'
}) => {
  const [activeMode, setActiveMode] = useState<'receivable' | 'payable'>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLedgerParty, setSelectedLedgerParty] = useState<string | null>(null);

  useEffect(() => {
    if (initialMode) {
      setActiveMode(initialMode);
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const accounts: PmsOutstandingAccount[] = PmsStore.getOutstandingAccounts(activeMode === 'receivable' ? 'Dr' : 'Cr');

  const filteredAccounts = accounts.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.accountName.toLowerCase().includes(q) ||
      (p.mobile && p.mobile.includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  const totalOutstanding = filteredAccounts.reduce((sum, p) => sum + p.balance, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div 
          className="bg-white rounded-lg shadow-2xl border border-gray-300 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-150"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xl">{activeMode === 'receivable' ? '💰' : '💳'}</span>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  {activeMode === 'receivable' ? 'Outstanding Receivables Report (Debtors)' : 'Outstanding Payables Report (Creditors)'}
                </h2>
                <div className="text-[11px] text-slate-300">
                  {activeMode === 'receivable' 
                    ? 'pms.hotelsai-vasudev.com/outstanding_receivable &bull; Receivables Register' 
                    : 'pms.hotelsai-vasudev.com/outstanding_payable_result &bull; Payables Register'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>🖨️</span>
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white text-lg leading-none p-1 rounded transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="bg-slate-800 px-6 pt-2 border-b border-slate-700 flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveMode('receivable')}
              className={`px-4 py-2 text-xs font-bold rounded-t-md transition-colors cursor-pointer ${
                activeMode === 'receivable'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              💰 Outstanding Receivables (Dr)
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('payable')}
              className={`px-4 py-2 text-xs font-bold rounded-t-md transition-colors cursor-pointer ${
                activeMode === 'payable'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              💳 Outstanding Payables (Creditors)
            </button>
          </div>

          {/* Search and summary ribbon */}
          <div className="p-4 bg-slate-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <span className="text-gray-500 font-medium">Search:</span>
              <input
                type="text"
                placeholder={activeMode === 'receivable' ? "Search debtors or corporate..." : "Search vendors, suppliers, contractors..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white text-gray-800 text-xs focus:ring-1 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="text-gray-600">
                Accounts Listed: <span className="font-bold text-gray-900">{filteredAccounts.length}</span>
              </div>
              <div className={`px-3 py-1 rounded font-bold text-xs border ${
                activeMode === 'receivable' ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-red-100 border-red-300 text-red-900'
              }`}>
                Total {activeMode === 'receivable' ? 'Debtors' : 'Creditors'}: ₹{totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {activeMode === 'receivable' ? 'Dr' : 'Cr'}
              </div>
            </div>
          </div>

          {/* Table matching Video 29 Frame 0140 & Frame 0160 */}
          <div className="flex-1 overflow-auto p-4 bg-slate-50">
            <div className="bg-white border border-slate-300 rounded-sm shadow-xs overflow-hidden">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-left font-semibold">
                    <th className="border border-slate-400 px-3 py-2 text-center w-12">#</th>
                    <th className="border border-slate-400 px-4 py-2">Account Name</th>
                    <th className="border border-slate-400 px-4 py-2 w-32">Mobile</th>
                    <th className="border border-slate-400 px-4 py-2 text-right w-40">Balance</th>
                    <th className="border border-slate-400 px-3 py-2 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500 italic border border-gray-200">
                        No matching records found.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((party, idx) => (
                      <tr 
                        key={idx} 
                        className={`hover:bg-blue-50/60 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}`}
                      >
                        <td className="border border-slate-300 px-3 py-1.5 text-center text-gray-500 font-medium">
                          {party.sNo || idx + 1}
                        </td>
                        <td className="border border-slate-300 px-4 py-1.5 font-medium text-gray-900">
                          <span className="flex items-center gap-1.5">
                            {party.category && (
                              <span className="text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded font-semibold uppercase">
                                {party.category}
                              </span>
                            )}
                            <span className="font-bold">{party.accountName}</span>
                          </span>
                        </td>
                        <td className="border border-slate-300 px-4 py-1.5 font-mono text-gray-600">
                          {party.mobile || '—'}
                        </td>
                        <td className="border border-slate-300 px-4 py-1.5 text-right font-mono font-semibold">
                          <span className={party.balanceType === 'Cr' ? 'text-red-700 font-bold' : 'text-blue-800 font-bold'}>
                            {party.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {party.balanceType}
                          </span>
                        </td>
                        <td className="border border-slate-300 px-3 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Eye button matching Video 29 Frame 0160 right column */}
                            <button
                              type="button"
                              title={`View Ledger for ${party.accountName}`}
                              onClick={() => setSelectedLedgerParty(party.accountName)}
                              className="w-7 h-7 inline-flex items-center justify-center bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded border border-indigo-200 hover:border-indigo-600 transition-colors cursor-pointer"
                            >
                              👁️
                            </button>
                            {/* Direct Collect Receipt button for receivables */}
                            {activeMode === 'receivable' && onCollectPayment && party.balance > 0 && (
                              <button
                                type="button"
                                title="Record Receipt"
                                onClick={() => {
                                  onCollectPayment(party.accountName);
                                  onClose();
                                }}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                ₹ Collect
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-200 font-bold text-gray-900 border-t-2 border-slate-400">
                    <td colSpan={3} className="border border-slate-300 px-4 py-2 text-right uppercase text-[11px]">
                      Total {activeMode === 'receivable' ? 'Outstanding Receivables' : 'Outstanding Payables'}:
                    </td>
                    <td className={`border border-slate-300 px-4 py-2 text-right font-mono text-sm font-black ${
                      activeMode === 'receivable' ? 'text-blue-900' : 'text-red-800'
                    }`}>
                      {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {activeMode === 'receivable' ? 'Dr' : 'Cr'}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-center text-[10px] text-gray-500">
                      Live
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer note */}
          <div className="px-6 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500 shrink-0">
            <span>Hotel Sai Vasudev Residency ERP &bull; Receivables &amp; Payables Master</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Modal on demand */}
      {selectedLedgerParty && (
        <PartyLedgerModal
          isOpen={true}
          onClose={() => setSelectedLedgerParty(null)}
          initialAccount={selectedLedgerParty}
        />
      )}
    </>
  );
};
