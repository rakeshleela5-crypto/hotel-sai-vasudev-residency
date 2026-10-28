import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { PmsPaymentRecord, PmsPartyAccount } from '../../types/pmsModels';
import './registers.css';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSaved: (payment: PmsPaymentRecord) => void;
  editingPayment?: PmsPaymentRecord | null;
  defaultAccountName?: string;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSaved,
  editingPayment,
  defaultAccountName
}) => {
  const [parties, setParties] = useState<PmsPartyAccount[]>([]);
  const [voucherName] = useState('Payments');
  const [paymentNo, setPaymentNo] = useState('');
  const [voucherNo, setVoucherNo] = useState(1);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMode, setPaymentMode] = useState<PmsPaymentRecord['paymentMode']>('Cash');
  const [selectedPartyString, setSelectedPartyString] = useState('');
  const [customAccountName, setCustomAccountName] = useState('');
  const [customMobile, setCustomMobile] = useState('');
  const [isCustomAccount, setIsCustomAccount] = useState(false);
  const [amount, setAmount] = useState<number | ''>('');
  const [remark, setRemark] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const allParties = PmsStore.getPartyAccounts();
      setParties(allParties);

      const allPayments = PmsStore.getPayments();
      const nextVoucher = allPayments.length > 0 
        ? Math.max(...allPayments.map(p => p.voucherNo || 0)) + 1 
        : 6;

      const today = new Date().toISOString().split('T')[0];
      setPaymentDate(today);

      if (editingPayment) {
        setPaymentNo(editingPayment.paymentNo);
        setVoucherNo(editingPayment.voucherNo);
        setPaymentDate(editingPayment.date);
        setPaymentMode(editingPayment.paymentMode);
        setAmount(editingPayment.amount);
        setRemark(editingPayment.remark);

        const match = allParties.find(p => p.name.toLowerCase() === editingPayment.accountName.toLowerCase());
        if (match) {
          setSelectedPartyString(`${match.name}|| ${match.mobile || ''}`);
          setIsCustomAccount(false);
        } else {
          setIsCustomAccount(true);
          setCustomAccountName(editingPayment.accountName);
          setCustomMobile(editingPayment.accountMobile || '');
        }
      } else {
        setPaymentNo(`PAY/${nextVoucher}/24-25`);
        setVoucherNo(nextVoucher);
        setPaymentMode('Cash');
        setAmount('');
        setRemark('');

        if (defaultAccountName) {
          const match = allParties.find(p => p.name.toLowerCase() === defaultAccountName.toLowerCase());
          if (match) {
            setSelectedPartyString(`${match.name}|| ${match.mobile || ''}`);
            setIsCustomAccount(false);
          } else {
            setIsCustomAccount(true);
            setCustomAccountName(defaultAccountName);
            setCustomMobile('');
          }
        } else {
          // Default to owner if available (Video 16 Frame 0200)
          const owner = allParties.find(p => p.name.toLowerCase().includes('sunder') || p.name.toLowerCase().includes('owner'));
          if (owner) {
            setSelectedPartyString(`${owner.name}|| ${owner.mobile || ''}`);
          } else if (allParties.length > 0) {
            setSelectedPartyString(`${allParties[0].name}|| ${allParties[0].mobile || ''}`);
          }
          setIsCustomAccount(false);
        }
      }
    }
  }, [isOpen, editingPayment, defaultAccountName]);

  if (!isOpen) return null;

  // Real-time source balance helper (Cash / Online balance)
  const getSourceBalance = () => {
    const ledger = PmsStore.getPartyLedger(paymentMode.toLowerCase());
    return ledger.closingBalance;
  };

  const currentSourceBalance = getSourceBalance();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    let accountName = '';
    let accountMobile = '';

    if (isCustomAccount) {
      if (!customAccountName.trim()) {
        alert('Please enter account / payee name.');
        return;
      }
      accountName = customAccountName.trim();
      accountMobile = customMobile.trim();
    } else {
      const parts = selectedPartyString.split('||').map(s => s.trim());
      accountName = parts[0] || 'Unknown';
      accountMobile = parts[1] || '';
    }

    setIsSaving(true);
    try {
      const payment: PmsPaymentRecord = {
        id: editingPayment?.id || `pay-${Date.now()}`,
        sNo: editingPayment?.sNo || 1,
        voucherName: voucherName || 'Payments',
        paymentNo: paymentNo || `PAY/${voucherNo}/24-25`,
        voucherNo: Number(voucherNo),
        date: paymentDate,
        paymentMode,
        accountName,
        accountMobile,
        amount: Number(amount),
        remark: remark.trim(),
        createdAt: editingPayment?.createdAt || new Date().toISOString()
      };

      PmsStore.savePayment(payment);
      onPaymentSaved(payment);
      onClose();
    } catch (err) {
      console.error('[AddPaymentModal] Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="pms-reg-modal-backdrop" 
      style={{ zIndex: 13000 }}
      onClick={onClose}
    >
      <div 
        className="pms-reg-modal-window"
        style={{ maxWidth: '480px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pms-reg-header">
          <div className="pms-reg-header-left">
            <span className="pms-reg-header-icon">💳</span>
            <div>
              <h2 className="pms-reg-header-title">
                {editingPayment ? 'Edit Payment' : 'Add New Payment'}
              </h2>
              <div className="pms-reg-header-sub">
                Official Cash/Bank Outflow Voucher Entry
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pms-reg-close-btn"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Form Body - Video 16 Frame 0200 & 0320 */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {/* Voucher Name */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">Voucher Name</label>
            <input
              type="text"
              readOnly
              value={voucherName}
              className="w-full px-3 py-1.5 border border-gray-300 rounded bg-gray-100 text-gray-700 font-medium cursor-not-allowed text-xs"
            />
          </div>

          {/* Payment No */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">Payment No</label>
            <input
              type="text"
              required
              value={paymentNo}
              onChange={e => setPaymentNo(e.target.value)}
              className="w-full px-3 py-1.5 border border-cyan-400 rounded focus:ring-1 focus:ring-cyan-500 font-semibold text-gray-800 text-xs"
            />
          </div>

          {/* Voucher No */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">Voucher No</label>
            <input
              type="number"
              required
              value={voucherNo}
              onChange={e => setVoucherNo(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-gray-800 text-xs"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">Date</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-gray-800 text-xs"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-gray-600 font-medium">Payment Mode</label>
              <span className="text-[11px] text-gray-500 font-mono">
                Available in {paymentMode}: <strong className="text-emerald-700">₹{currentSourceBalance.toLocaleString()}</strong>
              </span>
            </div>
            <select
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value as PmsPaymentRecord['paymentMode'])}
              className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 text-gray-800 text-xs"
            >
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          {/* Account */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-gray-600 font-medium">Account</label>
              <button
                type="button"
                onClick={() => setIsCustomAccount(!isCustomAccount)}
                className="text-[11px] text-blue-600 hover:underline"
              >
                {isCustomAccount ? '← Choose Existing Account' : '+ Add New Account / Vendor'}
              </button>
            </div>

            {isCustomAccount ? (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Account Name (e.g. Electricity Bill)"
                  value={customAccountName}
                  onChange={e => setCustomAccountName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs"
                  required
                />
                <input
                  type="text"
                  placeholder="Mobile / Ref (Optional)"
                  value={customMobile}
                  onChange={e => setCustomMobile(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs"
                />
              </div>
            ) : (
              <select
                value={selectedPartyString}
                onChange={e => setSelectedPartyString(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 text-gray-800 text-xs"
              >
                {parties.map(p => (
                  <option key={p.id} value={`${p.name}|| ${p.mobile || ''}`}>
                    {p.name}{p.mobile ? `|| ${p.mobile}` : '||'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">Amount</label>
            <input
              type="number"
              placeholder="Amount (e.g. 11000, 98717, 50000)"
              required
              min="1"
              step="any"
              value={amount}
              onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-gray-300 rounded font-semibold text-gray-800 focus:ring-1 focus:ring-blue-500 text-xs"
            />
          </div>

          {/* Remark */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">Remark</label>
            <input
              type="text"
              placeholder="e.g. cash handover, 101 ka commision, paymnet -4757344"
              value={remark}
              onChange={e => setRemark(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-blue-500 text-xs"
            />
          </div>

          {/* Actions - Frame 0200 & 0320 */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {isSaving ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Please wait...</span>
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
