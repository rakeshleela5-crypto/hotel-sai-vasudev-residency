import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';
import type { PmsPaymentRecord } from '../../types/pmsModels';
import { AddPaymentModal } from './AddPaymentModal';
import { PartyLedgerModal } from './PartyLedgerModal';
import './registers.css';

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
      const unsub = PmsStore.subscribe(() => {
        setPayments(PmsStore.getPayments());
      });
      hotelApi.getGeneralPayments().then(cloudList => {
        if (cloudList && cloudList.length > 0) {
          PmsStore.syncPayments(cloudList);
          setPayments(cloudList);
        }
      }).catch(err => console.warn('[PaymentRegisterModal] Cloud payments fetch note:', err));
      return () => unsub();
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
        className="pms-reg-modal-backdrop" 
        onClick={onClose}
      >
        <div 
          className="pms-reg-modal-window"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="pms-reg-header">
            <div className="pms-reg-header-left">
              <span className="pms-reg-header-icon">💳</span>
              <div>
                <h2 className="pms-reg-header-title">
                  PAYMENT REGISTER &amp; OUTFLOWS
                </h2>
                <div className="pms-reg-header-sub">
                  pms.hotelsai-vasudev.com/payments &bull; <span className="gold">SRI SAI VASUDEV RESIDENCY</span> &bull; Vendor Payouts, Commissions &amp; Expenses
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="pms-reg-close-btn"
              title="Close Modal"
            >
              ✕
            </button>
          </div>

          {/* Action Top Bar */}
          <div className="pms-reg-toolbar">
            <div className="pms-reg-toolbar-actions">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="pms-reg-btn-primary"
              >
                <span>➕</span>
                <span>Add New Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCashLedgerOpen(true)}
                className="pms-reg-btn-emerald"
              >
                <span>📑</span>
                <span>View Cash Ledger</span>
              </button>
            </div>

            <div className="pms-reg-badge-counter">
              Total Payments Recorded: <strong>{payments.length}</strong>
            </div>
          </div>

          {/* Success Banner */}
          {successBanner && (
            <div className="pms-reg-banner">
              <span>{successBanner}</span>
              <button
                type="button"
                onClick={() => setSuccessBanner(null)}
                className="pms-reg-banner-close"
              >
                ✕
              </button>
            </div>
          )}

          {/* Table Controls (Entries per page & Search) */}
          <div className="pms-reg-controls">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={entriesPerPage}
                onChange={e => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="pms-reg-entries-select"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span style={{ color: '#64748b', fontSize: '12px' }}>entries per page</span>
            </div>

            <div className="pms-reg-search-box">
              <label style={{ color: '#475569', fontWeight: 600, fontSize: '12px' }}>Search:</label>
              <input
                type="text"
                placeholder="Search payments, payee, mobile..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pms-reg-search-input"
              />
            </div>
          </div>

          {/* Table */}
          <div className="pms-reg-table-wrapper">
            <table className="pms-reg-table">
              <thead>
                <tr>
                  <th className="pms-reg-td-center" style={{ width: '60px' }}>S.No</th>
                  <th className="pms-reg-td-center" style={{ width: '110px' }}>Date</th>
                  <th className="pms-reg-td-center" style={{ width: '130px' }}>Payment No</th>
                  <th className="pms-reg-td-center" style={{ width: '120px' }}>Payment Mode</th>
                  <th>Account / Payee Name</th>
                  <th className="pms-reg-td-right" style={{ width: '120px' }}>Amount (₹)</th>
                  <th>Remark</th>
                  <th className="pms-reg-td-center" style={{ width: '110px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="pms-reg-td-center" style={{ padding: '36px', color: '#94a3b8', fontStyle: 'italic' }}>
                      No payment records found matching your search.
                    </td>
                  </tr>
                ) : (
                  paginatedPayments.map((p, idx) => (
                    <tr key={p.id}>
                      <td className="pms-reg-td-center" style={{ color: '#64748b', fontWeight: 600 }}>
                        {p.sNo || (currentPage - 1) * entriesPerPage + idx + 1}
                      </td>
                      <td className="pms-reg-td-center pms-reg-td-mono" style={{ color: '#475569' }}>
                        {p.date}
                      </td>
                      <td className="pms-reg-td-center pms-reg-td-mono" style={{ color: '#0891b2', fontWeight: 700 }}>
                        {p.paymentNo}
                      </td>
                      <td className="pms-reg-td-center">
                        <span className={`pms-reg-badge-mode ${
                          p.paymentMode === 'Cash' 
                            ? 'pms-reg-badge-cash' 
                            : p.paymentMode === 'Online' || p.paymentMode === 'UPI' 
                              ? 'pms-reg-badge-online' 
                              : 'pms-reg-badge-cheque'
                        }`}>
                          {p.paymentMode}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.accountName}</div>
                        {p.accountMobile && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            📱 {p.accountMobile}
                          </div>
                        )}
                      </td>
                      <td className="pms-reg-td-right pms-reg-td-mono" style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                        ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ color: '#64748b' }}>
                        {p.remark || '—'}
                      </td>
                      <td className="pms-reg-td-center">
                        <div className="pms-reg-action-group">
                          <button
                            type="button"
                            title="Print Payment Voucher"
                            onClick={() => setPrintingPayment(p)}
                            className="pms-reg-action-icon print"
                          >
                            🖨️
                          </button>
                          <button
                            type="button"
                            title="Edit Payment"
                            onClick={() => handleEdit(p)}
                            className="pms-reg-action-icon edit"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            title="Delete Payment"
                            onClick={() => handleDelete(p)}
                            className="pms-reg-action-icon delete"
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

          {/* Pagination Footer */}
          <div className="pms-reg-footer">
            <div>
              Showing <strong>{filteredPayments.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1}</strong> to{' '}
              <strong>{Math.min(currentPage * entriesPerPage, filteredPayments.length)}</strong> of{' '}
              <strong>{filteredPayments.length}</strong> entries
            </div>

            <div className="pms-reg-pagination-btns">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="pms-reg-page-btn"
              >
                &laquo; Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i + 1}
                  type="button"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`pms-reg-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="pms-reg-page-btn"
              >
                Next &raquo;
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
      className="pms-reg-modal-backdrop" 
      style={{ zIndex: 13500 }}
      onClick={onClose}
    >
      <div 
        className="pms-reg-modal-window"
        style={{ maxWidth: '560px', padding: '20px' }}
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
