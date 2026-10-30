import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';
import type { PmsReceiptRecord } from '../../types/pmsModels';
import { AddReceiptModal } from './AddReceiptModal';
import { OutstandingReceivablesModal } from './OutstandingReceivablesModal';
import './registers.css';

interface ReceiptRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptRegisterModal: React.FC<ReceiptRegisterModalProps> = ({
  isOpen,
  onClose
}) => {
  const [receipts, setReceipts] = useState<PmsReceiptRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<PmsReceiptRecord | null>(null);
  const [isOutstandingOpen, setIsOutstandingOpen] = useState(false);
  const [presetPartyForAdd, setPresetPartyForAdd] = useState<string | undefined>();
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [printingReceipt, setPrintingReceipt] = useState<PmsReceiptRecord | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReceipts(PmsStore.getReceipts());
      const unsub = PmsStore.subscribe(() => {
        setReceipts(PmsStore.getReceipts());
      });
      hotelApi.getGeneralReceipts().then(cloudList => {
        if (cloudList && cloudList.length > 0) {
          PmsStore.syncReceipts(cloudList);
          setReceipts(cloudList);
        }
      }).catch(err => console.warn('[ReceiptRegisterModal] Cloud receipts fetch note:', err));
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const refreshList = () => {
    setReceipts(PmsStore.getReceipts());
  };

  const filteredReceipts = receipts.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.receiptNo.toLowerCase().includes(q) ||
      r.accountName.toLowerCase().includes(q) ||
      (r.accountMobile && r.accountMobile.includes(q)) ||
      r.paymentMode.toLowerCase().includes(q) ||
      (r.remark && r.remark.toLowerCase().includes(q)) ||
      r.date.includes(q) ||
      r.amount.toString().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredReceipts.length / entriesPerPage) || 1;
  const paginatedReceipts = filteredReceipts.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handleOpenAdd = (partyName?: string) => {
    setEditingReceipt(null);
    setPresetPartyForAdd(partyName);
    setIsAddOpen(true);
  };

  const handleEdit = (receipt: PmsReceiptRecord) => {
    setEditingReceipt(receipt);
    setIsAddOpen(true);
  };

  const handleDelete = (receipt: PmsReceiptRecord) => {
    if (confirm(`Are you sure you want to delete receipt ${receipt.receiptNo} of ₹${receipt.amount} for ${receipt.accountName}?`)) {
      PmsStore.deleteReceipt(receipt.receiptNo);
      refreshList();
    }
  };

  const handleReceiptSaved = (_saved: PmsReceiptRecord) => {
    refreshList();
    setSuccessBanner('entery saved created successfully!');
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
              <span className="pms-reg-header-icon">📄</span>
              <div>
                <h2 className="pms-reg-header-title">
                  ADD RECEIPT &amp; COLLECTIONS
                </h2>
                <div className="pms-reg-header-sub">
                  pms.hotelsai-vasudev.com/reciepts &bull; <span className="gold">HOTEL SAI VASUDEV RESIDENCY</span> &bull; General Payment Receipts &amp; Ledger
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
                onClick={() => handleOpenAdd()}
                className="pms-reg-btn-primary"
              >
                <span>➕</span>
                <span>Add New Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOutstandingOpen(true)}
                className="pms-reg-btn-dark"
              >
                <span>💰</span>
                <span>Outstanding Receivables</span>
              </button>
            </div>

            <div className="pms-reg-badge-counter">
              Total Receipts Recorded: <strong>{receipts.length}</strong>
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
                placeholder="Search receipts, account, mobile..."
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
                  <th className="pms-reg-td-center" style={{ width: '130px' }}>Receipt No</th>
                  <th className="pms-reg-td-center" style={{ width: '120px' }}>Payment Mode</th>
                  <th>Account / Guest Name</th>
                  <th className="pms-reg-td-right" style={{ width: '120px' }}>Amount (₹)</th>
                  <th>Remark</th>
                  <th className="pms-reg-td-center" style={{ width: '110px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="pms-reg-td-center" style={{ padding: '36px', color: '#94a3b8', fontStyle: 'italic' }}>
                      No receipt records found matching your search.
                    </td>
                  </tr>
                ) : (
                  paginatedReceipts.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="pms-reg-td-center" style={{ color: '#64748b', fontWeight: 600 }}>
                        {r.sNo || (currentPage - 1) * entriesPerPage + idx + 1}
                      </td>
                      <td className="pms-reg-td-center pms-reg-td-mono" style={{ color: '#475569' }}>
                        {r.date}
                      </td>
                      <td className="pms-reg-td-center pms-reg-td-mono" style={{ color: '#2563eb', fontWeight: 700 }}>
                        {r.receiptNo}
                      </td>
                      <td className="pms-reg-td-center">
                        <span className={`pms-reg-badge-mode ${
                          r.paymentMode === 'Cash' 
                            ? 'pms-reg-badge-cash' 
                            : r.paymentMode === 'Online' || r.paymentMode === 'UPI' 
                              ? 'pms-reg-badge-online' 
                              : 'pms-reg-badge-cheque'
                        }`}>
                          {r.paymentMode}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.accountName}</div>
                        {r.accountMobile && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            📱 {r.accountMobile}
                          </div>
                        )}
                      </td>
                      <td className="pms-reg-td-right pms-reg-td-mono" style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                        ₹{r.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ color: '#64748b' }}>
                        {r.remark || '—'}
                      </td>
                      <td className="pms-reg-td-center">
                        <div className="pms-reg-action-group">
                          <button
                            type="button"
                            title="Print Receipt Slip"
                            onClick={() => setPrintingReceipt(r)}
                            className="pms-reg-action-icon print"
                          >
                            🖨️
                          </button>
                          <button
                            type="button"
                            title="Edit Receipt"
                            onClick={() => handleEdit(r)}
                            className="pms-reg-action-icon edit"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            title="Delete Receipt"
                            onClick={() => handleDelete(r)}
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
              Showing <strong>{filteredReceipts.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1}</strong> to{' '}
              <strong>{Math.min(currentPage * entriesPerPage, filteredReceipts.length)}</strong> of{' '}
              <strong>{filteredReceipts.length}</strong> entries
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

      {/* Add / Edit Receipt Modal */}
      <AddReceiptModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onReceiptSaved={handleReceiptSaved}
        editingReceipt={editingReceipt}
        defaultPartyName={presetPartyForAdd}
      />

      {/* Outstanding Receivables Modal */}
      <OutstandingReceivablesModal
        isOpen={isOutstandingOpen}
        onClose={() => setIsOutstandingOpen(false)}
        onCollectPayment={(partyName) => handleOpenAdd(partyName)}
      />

      {/* Receipt Slip Print View Modal */}
      {printingReceipt && (
        <ReceiptPrintSlipModal
          receipt={printingReceipt}
          onClose={() => setPrintingReceipt(null)}
        />
      )}
    </>
  );
};

// ==========================================
// Money Receipt Print Voucher Component
// ==========================================
interface ReceiptPrintSlipModalProps {
  receipt: PmsReceiptRecord;
  onClose: () => void;
}

const ReceiptPrintSlipModal: React.FC<ReceiptPrintSlipModalProps> = ({ receipt, onClose }) => {
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
          <span className="text-xs font-semibold text-gray-600">Official Money Receipt Voucher</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1"
            >
              <span>🖨️</span>
              <span>Print Slip</span>
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

        {/* Printable Receipt Body */}
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
              Payment Receipt Voucher
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <span className="text-gray-500">Receipt No:</span>{' '}
              <span className="font-bold font-mono">{receipt.receiptNo}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500">Date:</span>{' '}
              <span className="font-semibold">{receipt.date}</span>
            </div>
            <div>
              <span className="text-gray-500">Payment Mode:</span>{' '}
              <span className="font-semibold">{receipt.paymentMode}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500">Voucher No:</span>{' '}
              <span className="font-mono">{receipt.voucherNo}</span>
            </div>
          </div>

          <div className="border-t border-b border-dashed border-gray-300 py-2 space-y-1.5">
            <div>
              <span className="text-gray-500">Received with thanks from:</span>{' '}
              <span className="font-bold text-sm text-gray-900">{receipt.accountName}</span>
              {receipt.accountMobile && (
                <span className="text-gray-500 text-[11px]"> ({receipt.accountMobile})</span>
              )}
            </div>
            <div>
              <span className="text-gray-500">Narration / Remark:</span>{' '}
              <span className="italic text-gray-800">{receipt.remark || 'Payment settlement'}</span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="flex items-center justify-between bg-gray-100 p-2.5 rounded border border-gray-300">
            <span className="font-bold text-gray-700">Amount Received:</span>
            <span className="text-base font-extrabold text-blue-900 font-mono">
              ₹{receipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 pt-6 text-[10px] text-gray-500">
            <div>Customer / Depositor Signature</div>
            <div className="text-right">Authorized Signatory / Reception Desk</div>
          </div>
        </div>
      </div>
    </div>
  );
};
