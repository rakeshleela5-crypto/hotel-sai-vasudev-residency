import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';
import type { PmsPaymentRecord } from '../../types/pmsModels';
import { AddPaymentModal } from './AddPaymentModal';
import { PartyLedgerModal } from './PartyLedgerModal';

interface PaymentRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentRegisterModal: React.FC<PaymentRegisterModalProps> = ({
  isOpen,
  onClose
}) => {
  const [payments, setPayments] = useState<PmsPaymentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PmsPaymentRecord | null>(null);
  const [isCashLedgerOpen, setIsCashLedgerOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [printingPayment, setPrintingPayment] = useState<PmsPaymentRecord | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPayments(PmsStore.getPayments());
      hotelApi.getGeneralPayments().then(cloudList => {
        if (cloudList && cloudList.length > 0) {
          setPayments(cloudList);
        }
      }).catch(err => console.warn('[PaymentRegisterModal] Cloud payments fetch note:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const refreshList = () => {
    setPayments(PmsStore.getPayments());
  };

  const filteredPayments = payments.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.paymentNo.toLowerCase().includes(q) ||
      p.accountName.toLowerCase().includes(q) ||
      (p.accountMobile && p.accountMobile.includes(q)) ||
      p.paymentMode.toLowerCase().includes(q) ||
      (p.remark && p.remark.toLowerCase().includes(q)) ||
      p.date.includes(q) ||
      p.amount.toString().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredPayments.length / entriesPerPage) || 1;
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handleOpenAdd = () => {
    setEditingPayment(null);
    setIsAddOpen(true);
  };

  const handleEdit = (payment: PmsPaymentRecord) => {
    setEditingPayment(payment);
    setIsAddOpen(true);
  };

  const handleDelete = (payment: PmsPaymentRecord) => {
    if (confirm(`Are you sure you want to delete payment ${payment.paymentNo} of ₹${payment.amount} for ${payment.accountName}?`)) {
      PmsStore.deletePayment(payment.paymentNo);
      refreshList();
    }
  };

  const handlePaymentSaved = (_saved: PmsPaymentRecord) => {
    refreshList();
    setSuccessBanner('Entery saved successfully!');
    setTimeout(() => {
      setSuccessBanner(null);
    }, 4500);
  };

  return (
    <>
      <div 
        className="pms-modal-backdrop" 
        style={{ zIndex: 12500 }}
        onClick={onClose}
      >
        <div 
          className="pms-modal-container w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-150"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">💳</span>
              <div>
                <h2 className="text-base font-bold text-gray-900 tracking-tight">
                  Add Payment
                </h2>
                <div className="text-[11px] text-gray-500">
                  pms.hotelsai-vasudev.com/payments &bull; Hotel Expenses, Owner Payouts, Commissions &amp; Vendor Payments
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-lg leading-none p-1 rounded transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Action Top Bar matching Frame 0290 */}
          <div className="px-6 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Add New Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCashLedgerOpen(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>📑</span>
                <span>View Cash Ledger</span>
              </button>
            </div>

            <div className="text-xs text-gray-500">
              Total Payments Recorded: <span className="font-bold text-gray-800">{payments.length}</span>
            </div>
          </div>

          {/* Success Banner matching Frame 0290 */}
          {successBanner && (
            <div className="mx-6 mt-2 mb-1 px-4 py-2.5 bg-sky-100 border border-sky-300 rounded text-sky-800 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
              <span>{successBanner}</span>
              <button
                type="button"
                onClick={() => setSuccessBanner(null)}
                className="text-sky-600 hover:text-sky-900 font-bold ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {/* Table Controls (10 entries per page & Search) - Frame 0290 */}
          <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <select
                value={entriesPerPage}
                onChange={e => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-700"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-gray-600">entries per page</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-gray-600 font-medium">Search:</label>
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-3 py-1 text-xs bg-white text-gray-800 focus:ring-1 focus:ring-blue-500 w-48"
              />
            </div>
          </div>

          {/* Table matching Frame 0290 */}
          <div className="flex-1 overflow-auto px-6 pb-2">
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-800 font-semibold text-center border-b border-gray-300">
                  <th className="border border-gray-300 px-3 py-2 w-14">S.No▲</th>
                  <th className="border border-gray-300 px-3 py-2 w-28">Date</th>
                  <th className="border border-gray-300 px-3 py-2 w-32">Reciept No</th>
                  <th className="border border-gray-300 px-3 py-2 w-28">Payment Mode</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Account Name</th>
                  <th className="border border-gray-300 px-3 py-2 text-right w-24">Amount</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Remark</th>
                  <th className="border border-gray-300 px-3 py-2 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500 italic border border-gray-200">
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  paginatedPayments.map((p, idx) => (
                    <tr 
                      key={p.id}
                      className={`hover:bg-blue-50/50 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'}`}
                    >
                      <td className="border border-gray-300 px-3 py-1.5 text-center font-medium text-gray-700">
                        {p.sNo || (currentPage - 1) * entriesPerPage + idx + 1}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-center font-mono text-gray-600">
                        {p.date}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-center font-mono font-semibold text-cyan-700">
                        {p.paymentNo}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          p.paymentMode === 'Cash' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : p.paymentMode === 'Online' || p.paymentMode === 'UPI' 
                              ? 'bg-sky-100 text-sky-800' 
                              : 'bg-purple-100 text-purple-800'
                        }`}>
                          {p.paymentMode}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-1.5 font-medium text-gray-900">
                        {p.accountName}
                        {p.accountMobile && (
                          <span className="text-[10px] text-gray-400 block font-normal">
                            📱 {p.accountMobile}
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-right font-mono font-bold text-gray-900">
                        {p.amount.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-1.5 text-gray-600">
                        {p.remark || '—'}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Print Icon Button */}
                          <button
                            type="button"
                            title="Print Payment Voucher"
                            onClick={() => setPrintingPayment(p)}
                            className="w-7 h-7 inline-flex items-center justify-center bg-gray-50 hover:bg-gray-200 border border-gray-300 rounded text-gray-700 transition-colors"
                          >
                            🖨️
                          </button>

                          {/* Edit Icon Button (blue pen in box) - Frame 0290 */}
                          <button
                            type="button"
                            title="Edit Payment"
                            onClick={() => handleEdit(p)}
                            className="w-7 h-7 inline-flex items-center justify-center bg-blue-50 hover:bg-blue-600 border border-blue-300 hover:border-blue-600 rounded text-blue-700 hover:text-white transition-colors"
                          >
                            ✏️
                          </button>

                          {/* Delete Icon Button (red trash bin in box) - Frame 0290 */}
                          <button
                            type="button"
                            title="Delete Payment"
                            onClick={() => handleDelete(p)}
                            className="w-7 h-7 inline-flex items-center justify-center bg-red-50 hover:bg-red-600 border border-red-300 hover:border-red-600 rounded text-red-600 hover:text-white transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer - Frame 0290 */}
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
            <div>
              Showing {filteredPayments.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{' '}
              {Math.min(currentPage * entriesPerPage, filteredPayments.length)} of {filteredPayments.length} entries
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
              >
                &laquo;
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i + 1}
                  type="button"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border rounded text-xs ${
                    currentPage === i + 1 
                      ? 'border-blue-600 bg-blue-600 text-white font-bold' 
                      : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Payment Modal */}
      <AddPaymentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onPaymentSaved={handlePaymentSaved}
        editingPayment={editingPayment}
      />

      {/* Cash Ledger Modal */}
      {isCashLedgerOpen && (
        <PartyLedgerModal
          isOpen={true}
          onClose={() => setIsCashLedgerOpen(false)}
          initialAccount="Cash"
        />
      )}

      {/* Printable Payment Voucher Slip */}
      {printingPayment && (
        <PaymentPrintSlipModal
          payment={printingPayment}
          onClose={() => setPrintingPayment(null)}
        />
      )}
    </>
  );
};

// ==========================================
// Payment Voucher Slip Print Component
// ==========================================
interface PaymentPrintSlipModalProps {
  payment: PmsPaymentRecord;
  onClose: () => void;
}

const PaymentPrintSlipModal: React.FC<PaymentPrintSlipModalProps> = ({ payment, onClose }) => {
  const company = PmsStore.getCompanyInfo();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="pms-modal-backdrop" 
      style={{ zIndex: 13500 }}
      onClick={onClose}
    >
      <div 
        className="pms-modal-container w-full max-w-lg p-6 text-gray-900 animate-in fade-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        {/* Actions Top */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
          <span className="text-xs font-semibold text-gray-600">Official Payment Voucher Slip</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1"
            >
              <span>🖨️</span>
              <span>Print Voucher</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Payment Voucher Body */}
        <div className="border border-gray-400 p-5 rounded bg-white text-xs space-y-3">
          {/* Header */}
          <div className="text-center border-b border-gray-300 pb-2">
            <h2 className="text-base font-extrabold uppercase tracking-wide text-gray-900">
              {company.firmName}
            </h2>
            <div className="text-[11px] text-gray-600">
              {company.address1}, {company.city} - {company.pincode}
            </div>
            <div className="text-[10px] text-gray-500">
              Phone: {company.phone} | Mobile: {company.mobile} | GSTIN: {company.gstNo}
            </div>
            <div className="mt-1 text-xs font-bold text-gray-800 bg-gray-100 py-0.5 uppercase tracking-wider">
              Debit Payment Voucher
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <span className="text-gray-500">Voucher No:</span>{' '}
              <span className="font-bold font-mono">{payment.paymentNo}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500">Date:</span>{' '}
              <span className="font-semibold">{payment.date}</span>
            </div>
            <div>
              <span className="text-gray-500">Payment Mode:</span>{' '}
              <span className="font-semibold">{payment.paymentMode}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500">Index No:</span>{' '}
              <span className="font-mono">{payment.voucherNo}</span>
            </div>
          </div>

          <div className="border-t border-b border-dashed border-gray-300 py-2 space-y-1.5">
            <div>
              <span className="text-gray-500">Paid to Account / Payee:</span>{' '}
              <span className="font-bold text-sm text-gray-900">{payment.accountName}</span>
              {payment.accountMobile && (
                <span className="text-gray-500 text-[11px]"> ({payment.accountMobile})</span>
              )}
            </div>
            <div>
              <span className="text-gray-500">Narration / Purpose:</span>{' '}
              <span className="italic text-gray-800">{payment.remark || 'Hotel expense / Payout'}</span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="flex items-center justify-between bg-gray-100 p-2.5 rounded border border-gray-300">
            <span className="font-bold text-gray-700">Amount Paid:</span>
            <span className="text-base font-extrabold text-red-900 font-mono">
              ₹{payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 pt-6 text-[10px] text-gray-500">
            <div>Receiver's Signature</div>
            <div className="text-right">Manager / Cashier Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
};
