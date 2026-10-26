import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';
import type { PmsReceiptRecord } from '../../types/pmsModels';
import { AddReceiptModal } from './AddReceiptModal';
import { OutstandingReceivablesModal } from './OutstandingReceivablesModal';

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
      hotelApi.getGeneralReceipts().then(cloudList => {
        if (cloudList && cloudList.length > 0) {
          setReceipts(cloudList);
        }
      }).catch(err => console.warn('[ReceiptRegisterModal] Cloud receipts fetch note:', err));
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
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
        <div 
          className="bg-white rounded-lg shadow-2xl border border-gray-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-150"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">📄</span>
              <div>
                <h2 className="text-base font-bold text-gray-900 tracking-tight">
                  ADD Reciept
                </h2>
                <div className="text-[11px] text-gray-500">
                  pms.hotelsai-vasudev.com/reciepts &bull; General Payment Receipts &amp; Collections
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

          {/* Action Top Bar matching Frame 0090 & 0250 */}
          <div className="px-6 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenAdd()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Add New Reciept</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOutstandingOpen(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>💰</span>
                <span>Outstanding Receivables</span>
              </button>
            </div>

            <div className="text-xs text-gray-500">
              Total Receipts Recorded: <span className="font-bold text-gray-800">{receipts.length}</span>
            </div>
          </div>

          {/* Success Banner matching Frame 0250 (exact RoomG banner text) */}
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

          {/* Table Controls (10 entries per page & Search) - Frame 0090 */}
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

          {/* Table matching Frame 0090 and 0250 */}
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
                {paginatedReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500 italic border border-gray-200">
                      No receipt records found.
                    </td>
                  </tr>
                ) : (
                  paginatedReceipts.map((r, idx) => (
                    <tr 
                      key={r.id}
                      className={`hover:bg-blue-50/50 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/70' : 'bg-white'}`}
                    >
                      <td className="border border-gray-300 px-3 py-1.5 text-center font-medium text-gray-700">
                        {r.sNo || (currentPage - 1) * entriesPerPage + idx + 1}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-center font-mono text-gray-600">
                        {r.date}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-center font-mono font-semibold text-blue-700">
                        {r.receiptNo}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          r.paymentMode === 'Cash' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : r.paymentMode === 'Online' || r.paymentMode === 'UPI' 
                              ? 'bg-sky-100 text-sky-800' 
                              : 'bg-purple-100 text-purple-800'
                        }`}>
                          {r.paymentMode}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-1.5 font-medium text-gray-900">
                        {r.accountName}
                        {r.accountMobile && (
                          <span className="text-[10px] text-gray-400 block font-normal">
                            📱 {r.accountMobile}
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-right font-mono font-bold text-gray-900">
                        {r.amount.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-1.5 text-gray-600">
                        {r.remark || '—'}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Print Icon Button */}
                          <button
                            type="button"
                            title="Print Receipt Slip"
                            onClick={() => setPrintingReceipt(r)}
                            className="w-7 h-7 inline-flex items-center justify-center bg-gray-50 hover:bg-gray-200 border border-gray-300 rounded text-gray-700 transition-colors"
                          >
                            🖨️
                          </button>

                          {/* Edit Icon Button (blue pen in box) - Frame 0090 */}
                          <button
                            type="button"
                            title="Edit Receipt"
                            onClick={() => handleEdit(r)}
                            className="w-7 h-7 inline-flex items-center justify-center bg-blue-50 hover:bg-blue-600 border border-blue-300 hover:border-blue-600 rounded text-blue-700 hover:text-white transition-colors"
                          >
                            ✏️
                          </button>

                          {/* Delete Icon Button (red trash bin in box) - Frame 0090 */}
                          <button
                            type="button"
                            title="Delete Receipt"
                            onClick={() => handleDelete(r)}
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

          {/* Pagination Footer - Frame 0090 */}
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
            <div>
              Showing {filteredReceipts.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{' '}
              {Math.min(currentPage * entriesPerPage, filteredReceipts.length)} of {filteredReceipts.length} entries
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div 
        className="bg-white rounded-lg shadow-2xl border border-gray-400 w-full max-w-lg p-6 text-gray-900 animate-in fade-in zoom-in-95"
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
