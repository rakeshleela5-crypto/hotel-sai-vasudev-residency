import React, { useState } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { PmsItemWiseSale } from '../../types/pmsModels';
import './pmsStyles.css';

interface ItemWiseSalesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ItemWiseSalesReportModal: React.FC<ItemWiseSalesReportModalProps> = ({ isOpen, onClose }) => {
  const [fromDate, setFromDate] = useState<string>('19-07-2025');
  const [toDate, setToDate] = useState<string>('19-07-2025');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  if (!isOpen) return null;

  const salesData: PmsItemWiseSale[] = PmsStore.getItemWiseSalesReport(fromDate, toDate);

  const filteredSales = salesData.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.itemName.toLowerCase().includes(term) ||
      (item.category && item.category.toLowerCase().includes(term))
    );
  });

  const totalQty = filteredSales.reduce((s, it) => s + it.qty, 0);
  const totalAmount = filteredSales.reduce((s, it) => s + it.amount, 0);

  const handleCopy = () => {
    const text = filteredSales.map(i => `${i.sNo}\t${i.itemName}\t${i.qty.toFixed(2)}\t${i.rate.toFixed(2)}\t${i.amount.toFixed(2)}`).join('\n');
    navigator.clipboard.writeText(`S.No\tItem Name\tQty\tRate\tAmount\n${text}`);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleExportCsv = () => {
    const headers = ['S.No', 'Item Name', 'Category', 'Quantity', 'Rate', 'Amount'];
    const rows = filteredSales.map(i => [i.sNo, `"${i.itemName}"`, `"${i.category || 'General'}"`, i.qty.toFixed(2), i.rate.toFixed(2), i.amount.toFixed(2)]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `item_wise_sales_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pms-reg-modal-backdrop" onClick={onClose}>
      <div 
        className="pms-reg-modal-window"
        style={{ maxWidth: '960px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pms-reg-header">
          <div className="pms-reg-header-left">
            <span className="pms-reg-header-icon">📊</span>
            <div>
              <h2 className="pms-reg-header-title">
                ITEM WISE SALES REPORT
              </h2>
              <div className="pms-reg-header-sub">
                pms.hotelsai-vasudev.com/item_wise_sale_report &bull; <span className="gold">HOTEL SAI VASUDEV RESIDENCY</span> &bull; Restaurant &amp; Room Service Dish Sales
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

        {/* Date Filter Bar */}
        <div className="bg-slate-100 px-6 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-800 focus:outline-none focus:border-blue-500 w-32 shadow-2xs"
              placeholder="From Date"
            />
            <input
              type="text"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-800 focus:outline-none focus:border-blue-500 w-32 shadow-2xs"
              placeholder="To Date"
            />
            <button
              type="button"
              className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-xs cursor-pointer transition-colors"
            >
              OK
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setFromDate('19-07-2025'); setToDate('19-07-2025'); }}
              className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 cursor-pointer"
            >
              Date (19-07-2025)
            </button>
            <button
              type="button"
              onClick={() => { setFromDate('01-07-2025'); setToDate('31-07-2025'); }}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-50 rounded border border-slate-300 cursor-pointer"
            >
              Full Month (July 2025)
            </button>
          </div>
        </div>

        {/* Action Toolbar & Search (Frame 0220 Exact Layout) */}
        <div className="px-6 py-2.5 bg-white border-b border-gray-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-xs font-medium text-gray-700 transition-colors cursor-pointer"
            >
              {copiedToast ? '✓ Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-xs font-medium text-gray-700 transition-colors cursor-pointer"
            >
              CSV
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-xs font-medium text-gray-700 transition-colors cursor-pointer"
            >
              Excel
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-xs font-medium text-gray-700 transition-colors cursor-pointer"
            >
              PDF
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-xs font-medium text-gray-700 transition-colors cursor-pointer"
            >
              Print
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-medium">Search:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-3 py-1 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-blue-500 w-48 shadow-2xs"
              placeholder="Filter items..."
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          <div className="bg-white border border-gray-300 rounded-sm shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-gray-300 text-gray-700 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-4 border-r border-gray-300 w-16 text-center">S.No</th>
                  <th className="py-2.5 px-4 border-r border-gray-300">Item Name</th>
                  <th className="py-2.5 px-4 border-r border-gray-300 w-32">Category</th>
                  <th className="py-2.5 px-4 border-r border-gray-300 w-24 text-right">Qty</th>
                  <th className="py-2.5 px-4 border-r border-gray-300 w-28 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-4 text-right w-32">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-yellow-50/60 transition-colors">
                    <td className="py-2 px-4 border-r border-gray-200 text-center font-mono text-gray-500">{item.sNo}</td>
                    <td className="py-2 px-4 border-r border-gray-200 font-bold text-gray-800">
                      {item.itemName}
                    </td>
                    <td className="py-2 px-4 border-r border-gray-200 text-gray-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-700">
                        {item.category || 'Kitchen'}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-r border-gray-200 text-right font-mono font-semibold text-blue-700">
                      {item.qty.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 border-r border-gray-200 text-right font-mono text-gray-700">
                      {item.rate.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono font-bold text-emerald-700">
                      {item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200 font-bold text-xs border-t-2 border-gray-400">
                  <td colSpan={3} className="py-2.5 px-4 text-right uppercase tracking-wider text-gray-700 border-r border-gray-300">
                    Total Dishes Sold ({filteredSales.length} items)
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-blue-900 border-r border-gray-300">
                    {totalQty.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 border-r border-gray-300"></td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-900 font-black">
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            Showing 1 to {filteredSales.length} of {filteredSales.length} entries
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
