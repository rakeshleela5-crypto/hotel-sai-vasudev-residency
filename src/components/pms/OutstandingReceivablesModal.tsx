import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { PmsPartyAccount } from '../../types/pmsModels';
import { PartyLedgerModal } from './PartyLedgerModal';

interface OutstandingReceivablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollectPayment?: (partyName: string) => void;
}

export const OutstandingReceivablesModal: React.FC<OutstandingReceivablesModalProps> = ({
  isOpen,
  onClose,
  onCollectPayment
}) => {
  const [parties, setParties] = useState<PmsPartyAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLedgerParty, setSelectedLedgerParty] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setParties(PmsStore.getPartyAccounts());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredParties = parties.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.mobile && p.mobile.includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  const totalOutstanding = filteredParties.reduce((sum, p) => sum + (p.balanceType === 'Dr' ? p.balance : -p.balance), 0);

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
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <span className="text-xl">💰</span>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  Outstanding Receivables Report
                </h2>
                <div className="text-[11px] text-slate-300">
                  demo.datahouseerp.com/outstanding_receivable_result &bull; Guest &amp; Corporate Debtors
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1.5"
              >
                <span>🖨️</span>
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white text-lg leading-none p-1 rounded transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Search and summary ribbon */}
          <div className="p-4 bg-slate-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <span className="text-gray-500 font-medium">Search:</span>
              <input
                type="text"
                placeholder="Search by party name, corporate, or mobile..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white text-gray-800 text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="text-gray-600">
                Accounts Listed: <span className="font-bold text-gray-900">{filteredParties.length}</span>
              </div>
              <div className="px-3 py-1 bg-amber-100 border border-amber-300 rounded text-amber-900 font-bold text-xs">
                Total Debtors: ₹{totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dr
              </div>
            </div>
          </div>

          {/* Table matching Video 15 Frame 0130 */}
          <div className="flex-1 overflow-auto p-4">
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-900 text-white text-left font-semibold">
                  <th className="border border-slate-400 px-3 py-2 text-center w-12">#</th>
                  <th className="border border-slate-400 px-4 py-2">Account Name</th>
                  <th className="border border-slate-400 px-4 py-2">Mobile</th>
                  <th className="border border-slate-400 px-4 py-2 text-right">Balance</th>
                  <th className="border border-slate-400 px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParties.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500 italic border border-gray-200">
                      No matching debtor records found.
                    </td>
                  </tr>
                ) : (
                  filteredParties.map((party, idx) => (
                    <tr 
                      key={party.id} 
                      className={`hover:bg-blue-50/60 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}`}
                    >
                      <td className="border border-slate-300 px-3 py-1.5 text-center text-gray-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 px-4 py-1.5 font-medium text-gray-900">
                        <span className="flex items-center gap-1.5">
                          {party.category === 'Corporate' && <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">CORP</span>}
                          {party.category === 'Owner' && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">OWNER</span>}
                          {party.category === 'Bank' && <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-semibold">BANK</span>}
                          <span>{party.name}</span>
                        </span>
                      </td>
                      <td className="border border-slate-300 px-4 py-1.5 font-mono text-gray-600">
                        {party.mobile || '—'}
                      </td>
                      <td className="border border-slate-300 px-4 py-1.5 text-right font-mono font-semibold">
                        <span className={party.balance > 0 ? 'text-red-700' : 'text-emerald-600'}>
                          {party.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {party.balanceType}
                        </span>
                      </td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Eye button matching Video 15 Frame 0130 right column */}
                          <button
                            type="button"
                            title={`View Ledger for ${party.name}`}
                            onClick={() => setSelectedLedgerParty(party.name)}
                            className="w-7 h-7 inline-flex items-center justify-center bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded border border-indigo-200 hover:border-indigo-600 transition-colors"
                          >
                            👁️
                          </button>
                          {/* Direct Collect Receipt button */}
                          {onCollectPayment && party.balance > 0 && (
                            <button
                              type="button"
                              title="Record Receipt"
                              onClick={() => {
                                onCollectPayment(party.name);
                                onClose();
                              }}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-colors"
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
                <tr className="bg-slate-100 font-bold text-gray-900">
                  <td colSpan={3} className="border border-slate-300 px-4 py-2 text-right">
                    Total Outstanding Receivables:
                  </td>
                  <td className="border border-slate-300 px-4 py-2 text-right font-mono text-sm text-red-800">
                    {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dr
                  </td>
                  <td className="border border-slate-300 px-3 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer note */}
          <div className="px-6 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
            <span>RoomG Hotel Management PMS &bull; General Ledger &amp; Accounts Integration</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded transition-colors"
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
