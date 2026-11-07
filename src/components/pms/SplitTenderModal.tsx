import React, { useState, useMemo } from 'react';
import type { PaymentSplit } from '../../types/pmsModels';
import { rupeesToPaise, paiseToRupees } from '../../utils/money';

interface SplitTenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalDueRupees: number;
  onConfirmSplits: (splits: PaymentSplit[]) => void;
  title?: string;
}

interface SplitRow {
  id: string;
  mode: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
  amount: number;
  referenceNo: string;
  remark: string;
}

export const SplitTenderModal: React.FC<SplitTenderModalProps> = ({
  isOpen,
  onClose,
  totalDueRupees,
  onConfirmSplits,
  title = 'Multi-Tender Split Payment'
}) => {
  const targetPaise = useMemo(() => rupeesToPaise(totalDueRupees), [totalDueRupees]);

  const [splits, setSplits] = useState<SplitRow[]>([
    { id: '1', mode: 'Cash', amount: totalDueRupees, referenceNo: '', remark: '' }
  ]);

  const totalAllocatedPaise = useMemo(() => {
    return splits.reduce((acc, row) => acc + rupeesToPaise(Number(row.amount) || 0), 0);
  }, [splits]);

  const remainingPaise = targetPaise - totalAllocatedPaise;
  const isBalanced = remainingPaise === 0;

  if (!isOpen) return null;

  const handleAddSplit = () => {
    const unallocatedRupees = Math.max(0, paiseToRupees(remainingPaise));
    const nextMode: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' = 
      splits.some(s => s.mode === 'Cash') ? 'UPI' : 'Card';

    setSplits(prev => [
      ...prev,
      {
        id: String(Date.now()),
        mode: nextMode,
        amount: unallocatedRupees,
        referenceNo: '',
        remark: ''
      }
    ]);
  };

  const handleRemoveSplit = (id: string) => {
    if (splits.length <= 1) return;
    setSplits(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateSplit = (id: string, field: keyof SplitRow, value: any) => {
    setSplits(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        return { ...s, [field]: value };
      })
    );
  };

  const handleAutoFillRemaining = (id: string) => {
    const currentSplit = splits.find(s => s.id === id);
    if (!currentSplit) return;
    const currentSplitPaise = rupeesToPaise(Number(currentSplit.amount) || 0);
    const newAmountPaise = currentSplitPaise + remainingPaise;
    if (newAmountPaise >= 0) {
      handleUpdateSplit(id, 'amount', paiseToRupees(newAmountPaise));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;

    const formatted: PaymentSplit[] = splits.map(s => ({
      mode: s.mode,
      amount: Number(s.amount) || 0,
      referenceNo: s.referenceNo ? s.referenceNo.trim() : undefined,
      remark: s.remark ? s.remark.trim() : undefined
    }));

    onConfirmSplits(formatted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl max-w-2xl w-full p-6 text-slate-100 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
              <span>💳</span> {title}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Industrial Split Settlement: Zero-drift integer paise validation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl font-bold leading-none p-1"
          >
            &times;
          </button>
        </div>

        {/* Amount Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-3 text-center">
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Total Bill Due</span>
            <span className="text-lg font-bold text-white">₹{totalDueRupees.toFixed(2)}</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-3 text-center">
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Total Allocated</span>
            <span className="text-lg font-bold text-sky-400">₹{paiseToRupees(totalAllocatedPaise).toFixed(2)}</span>
          </div>
          <div className={`p-3 rounded-lg border text-center transition-colors ${
            isBalanced
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : remainingPaise > 0
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
          }`}>
            <span className="text-xs uppercase tracking-wider block mb-1">
              {isBalanced ? 'Status' : remainingPaise > 0 ? 'Remaining Due' : 'Overallocated'}
            </span>
            <span className="text-lg font-bold">
              {isBalanced ? '✓ Balanced' : `₹${Math.abs(paiseToRupees(remainingPaise)).toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Tenders Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {splits.map((split, index) => (
              <div
                key={split.id}
                className="bg-slate-800/60 border border-slate-700 rounded-lg p-3.5 flex flex-col gap-2.5 transition-all hover:border-slate-600"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-amber-400/90 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                    Tender #{index + 1}
                  </span>
                  {splits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSplit(split.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:underline"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-12 gap-2.5 items-center">
                  {/* Mode Selector */}
                  <div className="col-span-4">
                    <label className="text-[11px] text-slate-400 block mb-1">Payment Mode</label>
                    <select
                      value={split.mode}
                      onChange={e => handleUpdateSplit(split.id, 'mode', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
                    >
                      <option value="Cash">💵 Cash</option>
                      <option value="UPI">📱 UPI / QR</option>
                      <option value="Card">💳 Credit/Debit Card</option>
                      <option value="Bank Transfer">🏦 Bank Transfer</option>
                    </select>
                  </div>

                  {/* Amount Input */}
                  <div className="col-span-4">
                    <label className="text-[11px] text-slate-400 block mb-1">Amount (₹)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={split.amount}
                        onChange={e => handleUpdateSplit(split.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-amber-300 font-bold focus:outline-none focus:border-amber-400 pr-7"
                      />
                      {remainingPaise !== 0 && (
                        <button
                          type="button"
                          title="Auto-fill remainder into this tender"
                          onClick={() => handleAutoFillRemaining(split.id)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 text-xs px-1"
                        >
                          ⚡
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Ref No / Note */}
                  <div className="col-span-4">
                    <label className="text-[11px] text-slate-400 block mb-1">
                      {split.mode === 'Cash' ? 'Cashier Remark' : 'Txn / Auth Ref'}
                    </label>
                    <input
                      type="text"
                      placeholder={split.mode === 'Cash' ? 'e.g. 500x7 notes' : 'e.g. UTR / Auth 1234'}
                      value={split.referenceNo}
                      onChange={e => handleUpdateSplit(split.id, 'referenceNo', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleAddSplit}
              className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors py-1.5 px-3 rounded bg-sky-950/40 border border-sky-800/40"
            >
              <span>+</span> Add Another Payment Tender
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isBalanced}
                className={`px-5 py-2 text-xs font-bold rounded-lg shadow transition-all ${
                  isBalanced
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                {isBalanced ? 'Confirm Split Settlement' : `Cannot Settle (₹${Math.abs(paiseToRupees(remainingPaise)).toFixed(2)} off)`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
