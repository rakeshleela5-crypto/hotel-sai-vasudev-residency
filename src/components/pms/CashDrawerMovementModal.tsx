import React, { useState, useEffect } from 'react';
import { hotelApi } from '../../services/api';
import { PmsStore } from '../../services/pmsStore';

interface CashDrawerMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CashDrawerMovementModal: React.FC<CashDrawerMovementModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [movementType, setMovementType] = useState<'FLOAT_IN' | 'DROP_TO_SAFE' | 'PETTY_PAYOUT'>('DROP_TO_SAFE');
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('');
  const [destinationOrSource, setDestinationOrSource] = useState<string>('Main Drop Safe');
  const [managerPin, setManagerPin] = useState<string>('');
  const [cashierName, setCashierName] = useState<string>('Cashier');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successVoucher, setSuccessVoucher] = useState<string | null>(null);
  const [drawerSummary, setDrawerSummary] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessVoucher(null);
      // Fetch current shift drawer metrics
      hotelApi.getCashDrawerSummary()
        .then(res => {
          if (res && res.status === 'success') {
            setDrawerSummary(res.summary);
          }
        })
        .catch(() => {});

      // Pick cashier name from logged in user or staff profiles
      const staff = PmsStore.getStaffProfiles();
      if (staff && staff.length > 0) {
        setCashierName(staff[0].full_name || 'Front Desk Cashier');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const requiresManagerPin = movementType === 'DROP_TO_SAFE' && typeof amount === 'number' && amount >= 5000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessVoucher(null);

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Please specify a positive movement amount.');
      return;
    }

    if (requiresManagerPin && !managerPin) {
      setErrorMsg('Manager authorization PIN is strictly mandatory for safe skims >= ₹5,000.');
      return;
    }

    setLoading(true);
    try {
      const res = await hotelApi.recordCashDrawerMovement({
        movement_type: movementType,
        amount: numericAmount,
        cashier_name: cashierName,
        manager_pin: requiresManagerPin ? managerPin : undefined,
        reason: reason || (movementType === 'DROP_TO_SAFE' ? 'Excess cash drop to drop safe' : 'Float top-up'),
        destination_or_source: destinationOrSource
      });

      if (res && res.status === 'success') {
        setSuccessVoucher(res.movement.voucher_no);
        setAmount('');
        setReason('');
        setManagerPin('');
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res?.message || 'Failed to record movement');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while communicating with PMS backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl max-w-lg w-full p-6 text-slate-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏦</span>
            <div>
              <h3 className="text-lg font-bold text-amber-400">Cash Drawer Movement & Safe Skim</h3>
              <p className="text-xs text-slate-400">P&L Float Management & Double-Entry Journaling</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl font-bold leading-none"
          >
            &times;
          </button>
        </div>

        {/* Drawer Float Summary Bar if available */}
        {drawerSummary && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3 text-xs grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-slate-400 uppercase text-[10px]">Opening Float</div>
              <div className="text-white font-bold text-sm">₹{drawerSummary.opening_float?.toFixed(2) || '0.00'}</div>
            </div>
            <div>
              <div className="text-slate-400 uppercase text-[10px]">Safe Drops Today</div>
              <div className="text-amber-400 font-bold text-sm">₹{drawerSummary.total_drops_to_safe?.toFixed(2) || '0.00'}</div>
            </div>
            <div>
              <div className="text-slate-400 uppercase text-[10px]">Expected Cash</div>
              <div className="text-emerald-400 font-bold text-sm">₹{drawerSummary.current_expected_cash?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successVoucher && (
          <div className="bg-emerald-950/60 border border-emerald-500/60 rounded-lg p-3 text-emerald-300 text-xs flex flex-col gap-1">
            <div className="font-bold flex items-center gap-1.5">
              <span>✓</span> Movement Recorded Successfully!
            </div>
            <div>
              Voucher No: <span className="font-mono font-bold text-white">{successVoucher}</span> (Journal entry posted to General Ledger)
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-950/60 border border-rose-500/60 rounded-lg p-3 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Movement Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {/* Movement Type Tabs */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">Operation Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMovementType('DROP_TO_SAFE');
                  setDestinationOrSource('Main Drop Safe');
                }}
                className={`py-2 px-2.5 rounded-lg font-semibold border transition-all text-center ${
                  movementType === 'DROP_TO_SAFE'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Safe Skim / Drop
              </button>
              <button
                type="button"
                onClick={() => {
                  setMovementType('FLOAT_IN');
                  setDestinationOrSource('Admin Cash Vault');
                }}
                className={`py-2 px-2.5 rounded-lg font-semibold border transition-all text-center ${
                  movementType === 'FLOAT_IN'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Float Top-Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setMovementType('PETTY_PAYOUT');
                  setDestinationOrSource('Operational Vendor');
                }}
                className={`py-2 px-2.5 rounded-lg font-semibold border transition-all text-center ${
                  movementType === 'PETTY_PAYOUT'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Petty Payout
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Amount (₹) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-300 font-bold focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Reason / Narrative */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Reason / Voucher Narrative</label>
            <input
              type="text"
              placeholder={
                movementType === 'DROP_TO_SAFE'
                  ? 'Mid-shift safe drop per cash holding threshold'
                  : movementType === 'FLOAT_IN'
                  ? 'Morning drawer change float injection'
                  : 'Emergency operational cash payout'
              }
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Source / Destination */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                {movementType === 'FLOAT_IN' ? 'Source' : 'Destination'}
              </label>
              <input
                type="text"
                value={destinationOrSource}
                onChange={e => setDestinationOrSource(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Cashier / Staff</label>
              <input
                type="text"
                value={cashierName}
                onChange={e => setCashierName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Manager PIN Authentication (Enforced for Safe Drops >= ₹5,000) */}
          {requiresManagerPin && (
            <div className="bg-amber-950/40 border border-amber-600/60 rounded-lg p-3 flex flex-col gap-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <span>🔒</span> Manager PIN Authorization Required
                </span>
                <span className="text-[10px] bg-amber-800/40 text-amber-200 px-2 py-0.5 rounded">
                  Skim ≥ ₹5,000
                </span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                Statutory cash governance requires supervisor PIN verification to move cash to safe custody.
              </p>
              <input
                type="password"
                maxLength={8}
                placeholder="Enter 4-digit Manager PIN"
                value={managerPin}
                onChange={e => setManagerPin(e.target.value)}
                required
                className="w-full bg-slate-900 border border-amber-600/60 rounded px-3 py-1.5 text-center font-mono tracking-widest text-amber-300 font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Authorize & Post Movement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
