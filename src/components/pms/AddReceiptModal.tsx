import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { PmsReceiptRecord, PmsPartyAccount } from '../../types/pmsModels';

interface AddReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptSaved: (receipt: PmsReceiptRecord) => void;
  editingReceipt?: PmsReceiptRecord | null;
  defaultPartyName?: string;
}

export const AddReceiptModal: React.FC<AddReceiptModalProps> = ({
  isOpen,
  onClose,
  onReceiptSaved,
  editingReceipt,
  defaultPartyName
}) => {
  const [parties, setParties] = useState<PmsPartyAccount[]>([]);
  const [voucherName] = useState('Receipts');
  const [receiptNo, setReceiptNo] = useState('');
  const [voucherNo, setVoucherNo] = useState(1);
  const [receiptDate, setReceiptDate] = useState('');
  const [paymentMode, setPaymentMode] = useState<PmsReceiptRecord['paymentMode']>('Cash');
  const [selectedPartyString, setSelectedPartyString] = useState('');
  const [customPartyName, setCustomPartyName] = useState('');
  const [customMobile, setCustomMobile] = useState('');
  const [isCustomParty, setIsCustomParty] = useState(false);
  const [amount, setAmount] = useState<number | ''>('');
  const [remark, setRemark] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const allParties = PmsStore.getPartyAccounts();
      setParties(allParties);

      const allReceipts = PmsStore.getReceipts();
      const nextVoucher = allReceipts.length > 0 
        ? Math.max(...allReceipts.map(r => r.voucherNo || 0)) + 1 
        : 13;

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      setReceiptDate(today);

      if (editingReceipt) {
        setReceiptNo(editingReceipt.receiptNo);
        setVoucherNo(editingReceipt.voucherNo);
        setReceiptDate(editingReceipt.date);
        setPaymentMode(editingReceipt.paymentMode);
        setAmount(editingReceipt.amount);
        setRemark(editingReceipt.remark);

        const match = allParties.find(p => p.name.toLowerCase() === editingReceipt.accountName.toLowerCase());
        if (match) {
          setSelectedPartyString(`${match.name}|| ${match.mobile || ''}`);
          setIsCustomParty(false);
        } else {
          setIsCustomParty(true);
          setCustomPartyName(editingReceipt.accountName);
          setCustomMobile(editingReceipt.accountMobile || '');
        }
      } else {
        setReceiptNo(`REC/${nextVoucher}/24-25`);
        setVoucherNo(nextVoucher);
        setPaymentMode('Cash');
        setAmount('');
        setRemark('');

        if (defaultPartyName) {
          const match = allParties.find(p => p.name.toLowerCase() === defaultPartyName.toLowerCase());
          if (match) {
            setSelectedPartyString(`${match.name}|| ${match.mobile || ''}`);
            setIsCustomParty(false);
          } else {
            setIsCustomParty(true);
            setCustomPartyName(defaultPartyName);
            setCustomMobile('');
          }
        } else {
          // Default to Vivek if available (Video 15 frame 0170)
          const vivek = allParties.find(p => p.name.toLowerCase() === 'vivek');
          if (vivek) {
            setSelectedPartyString(`${vivek.name}|| ${vivek.mobile || ''}`);
          } else if (allParties.length > 0) {
            setSelectedPartyString(`${allParties[0].name}|| ${allParties[0].mobile || ''}`);
          }
          setIsCustomParty(false);
        }
      }
    }
  }, [isOpen, editingReceipt, defaultPartyName]);

  if (!isOpen) return null;

  // Selected party current balance calculation
  const getSelectedPartyInfo = () => {
    if (isCustomParty) return null;
    const partyName = selectedPartyString.split('||')[0]?.trim();
    return parties.find(p => p.name.toLowerCase() === partyName?.toLowerCase());
  };

  const selectedPartyInfo = getSelectedPartyInfo();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid receipt amount.');
      return;
    }

    let accountName = '';
    let accountMobile = '';

    if (isCustomParty) {
      if (!customPartyName.trim()) {
        alert('Please enter account name.');
        return;
      }
      accountName = customPartyName.trim();
      accountMobile = customMobile.trim();
    } else {
      const parts = selectedPartyString.split('||').map(s => s.trim());
      accountName = parts[0] || 'Unknown';
      accountMobile = parts[1] || '';
    }

    setIsSaving(true);

    setTimeout(() => {
      const receipt: PmsReceiptRecord = {
        id: editingReceipt?.id || `rec-${Date.now()}`,
        sNo: editingReceipt?.sNo || 1,
        voucherName: voucherName || 'Receipts',
        receiptNo: receiptNo || `REC/${voucherNo}/24-25`,
        voucherNo: Number(voucherNo),
        date: receiptDate,
        paymentMode,
        accountName,
        accountMobile,
        amount: Number(amount),
        remark: remark.trim(),
        createdAt: editingReceipt?.createdAt || new Date().toISOString()
      };

      PmsStore.saveReceipt(receipt);
      setIsSaving(false);
      onReceiptSaved(receipt);
      onClose();
    }, 400); // 400ms simulate server save with 'Please wait...' button state
  };

  return (
    <div 
      className="pms-modal-backdrop" 
      style={{ zIndex: 13000 }}
      onClick={onClose}
    >
      <div 
        className="pms-modal-container w-full max-w-md overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Video 15 Frame 0150 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-base font-semibold text-gray-800">
            {editingReceipt ? 'Edit Reciept' : 'Add Reciept'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none p-1 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body - Video 15 Frame 0150, 0170, 0230 */}
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

          {/* Receipt No */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">Reciept No</label>
            <input
              type="text"
              required
              value={receiptNo}
              onChange={e => setReceiptNo(e.target.value)}
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
              value={receiptDate}
              onChange={e => setReceiptDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-gray-800 text-xs"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value as PmsReceiptRecord['paymentMode'])}
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
                onClick={() => setIsCustomParty(!isCustomParty)}
                className="text-[11px] text-blue-600 hover:underline"
              >
                {isCustomParty ? '← Choose Existing Party' : '+ Enter Custom Party'}
              </button>
            </div>

            {isCustomParty ? (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Party / Person Name (e.g. raj)"
                  value={customPartyName}
                  onChange={e => setCustomPartyName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs"
                  required
                />
                <input
                  type="text"
                  placeholder="Mobile Number"
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
                    {p.name}{p.mobile ? `|| ${p.mobile}` : ''} ({p.balance > 0 ? `₹${p.balance.toLocaleString()} ${p.balanceType}` : 'Clear'})
                  </option>
                ))}
              </select>
            )}

            {/* Outstanding helper badge */}
            {selectedPartyInfo && (
              <div className="mt-1 flex items-center justify-between text-[11px] px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-amber-900">
                <span>Current Outstanding:</span>
                <span className="font-bold">₹{selectedPartyInfo.balance.toLocaleString()} {selectedPartyInfo.balanceType}</span>
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-gray-600 font-medium mb-1">Amount</label>
            <input
              type="number"
              placeholder="Amount (e.g. 7500)"
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
              placeholder="e.g. old bill, reciept by owner, advance booking"
              value={remark}
              onChange={e => setRemark(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded text-gray-800 focus:ring-1 focus:ring-blue-500 text-xs"
            />
          </div>

          {/* Actions - Frame 0170 & 0190 */}
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
