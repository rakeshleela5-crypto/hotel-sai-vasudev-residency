import React, { useState } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { PmsItemStockReport } from '../../types/pmsModels';
import './pmsStyles.css';

interface ItemWiseStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItem?: string;
}

export const ItemWiseStockModal: React.FC<ItemWiseStockModalProps> = ({
  isOpen,
  onClose,
  initialItem = 'Boondi Raita'
}) => {
  const [selectedItem, setSelectedItem] = useState<string>(initialItem);
  const [fromDate, setFromDate] = useState<string>('01-07-2025');
  const [toDate, setToDate] = useState<string>('19-07-2025');
  const [stockReport, setStockReport] = useState<PmsItemStockReport>(() => 
    PmsStore.getItemWiseStock('Boondi Raita', '01-07-2025', '19-07-2025')
  );

  if (!isOpen) return null;

  const handleFetchStock = () => {
    setStockReport(PmsStore.getItemWiseStock(selectedItem, fromDate, toDate));
  };

  const handlePrint = () => {
    window.print();
  };

  const availableItems = [
    'Boondi Raita',
    'PANEER TIKA',
    'TAWA ROTI',
    'bread pakoda',
    'DAL MAKHANI',
    'MINERAL WATER 1LTR',
    'Cooking Oil 15L'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div 
        className="bg-white rounded-lg shadow-2xl border border-gray-300 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header (Frame 0410) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏷️</span>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Item Wise Stock Ledger
              </h2>
              <div className="text-[11px] text-slate-300">
                demo.datahouseerp.com/item_wise_stock &bull; Video 29 Frame 0410 Kitchen Stock Audit
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 px-2.5 py-1 rounded text-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filter Bar (Dropdown + Date Range) */}
        <div className="bg-slate-100 px-6 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <select
              value={selectedItem}
              onChange={e => { setSelectedItem(e.target.value); }}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-800 focus:outline-none focus:border-blue-500 w-48 shadow-2xs"
            >
              {availableItems.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
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
              onClick={handleFetchStock}
              className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-xs cursor-pointer transition-colors"
            >
              OK
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setSelectedItem('Boondi Raita'); setFromDate('01-07-2025'); setToDate('19-07-2025'); handleFetchStock(); }}
              className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 cursor-pointer"
            >
              Video 29 Boondi Raita Benchmark
            </button>
          </div>
        </div>

        {/* Content Canvas */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          <div className="bg-white border border-gray-300 rounded-sm shadow-xs p-6">
            
            {/* Ledger Title Banner (Matching Frame 0410 exactly) */}
            <div className="mb-4 pb-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Stock Ledger for Item : <span className="text-blue-800 underline">{stockReport.itemName}</span> From Date- {stockReport.fromDate} To Date- {stockReport.toDate}
                </h3>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Category: {stockReport.itemCategory} &bull; Base Unit: {stockReport.unit}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 block">Current Status</span>
                <span className={`text-sm font-black font-mono ${stockReport.closingBalance < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  Closing Balance = {stockReport.closingBalance}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="border border-gray-300 rounded-sm overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-gray-300 text-gray-700 font-bold uppercase text-[11px]">
                    <th className="py-2 px-4 border-r border-gray-300 w-28">Date</th>
                    <th className="py-2 px-4 border-r border-gray-300 w-44">Transection Type</th>
                    <th className="py-2 px-4 border-r border-gray-300">Remark</th>
                    <th className="py-2 px-4 border-r border-gray-300 w-28 text-right">Stock in</th>
                    <th className="py-2 px-4 border-r border-gray-300 w-28 text-right">Stock Out</th>
                    <th className="py-2 px-4 text-right w-32">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening Balance Row */}
                  <tr className="bg-slate-50/70 border-b border-gray-200 font-semibold text-gray-700">
                    <td className="py-2 px-4 border-r border-gray-200"></td>
                    <td className="py-2 px-4 border-r border-gray-200"></td>
                    <td className="py-2 px-4 border-r border-gray-200 italic text-gray-600">Opening Balnce</td>
                    <td className="py-2 px-4 border-r border-gray-200 text-right font-mono"></td>
                    <td className="py-2 px-4 border-r border-gray-200 text-right font-mono"></td>
                    <td className="py-2 px-4 text-right font-mono font-bold text-gray-900">
                      {stockReport.openingBalance}
                    </td>
                  </tr>

                  {/* Transaction Rows */}
                  {stockReport.entries.map((entry, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-yellow-50/60 transition-colors">
                      <td className="py-2 px-4 border-r border-gray-200 font-mono text-gray-600">{entry.date}</td>
                      <td className="py-2 px-4 border-r border-gray-200 font-medium text-gray-800">
                        {entry.transactionType}
                      </td>
                      <td className="py-2 px-4 border-r border-gray-200 font-mono text-blue-700">
                        {entry.remark}
                      </td>
                      <td className="py-2 px-4 border-r border-gray-200 text-right font-mono font-semibold text-emerald-700">
                        {entry.stockIn > 0 ? entry.stockIn : ''}
                      </td>
                      <td className="py-2 px-4 border-r border-gray-200 text-right font-mono font-semibold text-red-600">
                        {entry.stockOut > 0 ? entry.stockOut : ''}
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-gray-900">
                        {entry.balance}
                      </td>
                    </tr>
                  ))}

                  {/* TOTAL Row */}
                  <tr className="bg-slate-200 font-bold border-t-2 border-gray-300">
                    <td className="py-2 px-4 border-r border-gray-300"></td>
                    <td className="py-2 px-4 border-r border-gray-300 uppercase tracking-wider text-gray-800 font-black">
                      TOTAL
                    </td>
                    <td className="py-2 px-4 border-r border-gray-300"></td>
                    <td className="py-2 px-4 text-right font-mono border-r border-gray-300 text-emerald-800">
                      {stockReport.totalStockIn}
                    </td>
                    <td className="py-2 px-4 text-right font-mono border-r border-gray-300 text-red-700">
                      {stockReport.totalStockOut}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-gray-900">
                      {stockReport.closingBalance}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Statement (Frame 0410) */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm font-black text-gray-900">
                Closing Balance = {stockReport.closingBalance}
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <span>🖨️</span>
                <span>Print Ledger</span>
              </button>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            RoomG PMS Inventory &amp; Consumption Stock Ledger &bull; Frame 0410
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
