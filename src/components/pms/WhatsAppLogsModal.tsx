import React, { useState, useEffect } from 'react';
import type { PmsWhatsAppLog } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';

interface WhatsAppLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const WhatsAppLogsModal: React.FC<WhatsAppLogsModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings
}) => {
  const [logs, setLogs] = useState<PmsWhatsAppLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Guest' | 'Owner'>('All');
  const [selectedLog, setSelectedLog] = useState<PmsWhatsAppLog | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const loadLogs = () => {
    setLogs(PmsStore.getWhatsAppLogs());
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all WhatsApp outbox records?')) {
      PmsStore.clearWhatsAppLogs();
      loadLogs();
    }
  };

  const handleResend = (log: PmsWhatsAppLog) => {
    const cleanDigits = log.recipientMobile.replace(/\D/g, '');
    const phoneWithCountry = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const directUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(log.message)}`;
    window.open(directUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  const filteredLogs = logs.filter(l => {
    const matchesSearch =
      l.recipientMobile.includes(searchTerm) ||
      l.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.voucherType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.voucherNo && l.voucherNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.roomNo && l.roomNo.includes(searchTerm));
    const matchesType =
      filterType === 'All' ? true : l.recipientType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xl shadow-md">
              📜
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">WhatsApp Message Logs & Outbox</h2>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">/whatsapp_logs</span>
              </div>
              <p className="text-xs text-slate-400">Complete audit trail of dispatched guest vouchers, bills, and owner fraud alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              >
                <span>⚙️</span> SMS Settings
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setFilterType('All')}
                className={`px-3 py-1.5 rounded-md transition-all ${filterType === 'All' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All Messages ({logs.length})
              </button>
              <button
                onClick={() => setFilterType('Guest')}
                className={`px-3 py-1.5 rounded-md transition-all ${filterType === 'Guest' ? 'bg-white text-blue-800 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Guest Receipts ({logs.filter(l => l.recipientType === 'Guest').length})
              </button>
              <button
                onClick={() => setFilterType('Owner')}
                className={`px-3 py-1.5 rounded-md transition-all ${filterType === 'Owner' ? 'bg-white text-rose-800 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                🚨 Owner Fraud Alerts ({logs.filter(l => l.recipientType === 'Owner').length})
              </button>
            </div>

            <button
              onClick={handleClearLogs}
              className="text-xs text-slate-500 hover:text-rose-600 hover:underline px-2 py-1"
            >
              Clear Outbox
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, mobile, voucher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
            <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-3 w-36">Timestamp</th>
                  <th className="py-3 px-3 w-36">Recipient</th>
                  <th className="py-3 px-3 w-28 text-center">Target</th>
                  <th className="py-3 px-3 w-36">Event</th>
                  <th className="py-3 px-3 w-20 text-center">Room / Voucher</th>
                  <th className="py-3 px-4">Message Snippet</th>
                  <th className="py-3 px-3 w-24 text-center">Status</th>
                  <th className="py-3 px-3 w-24 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      No WhatsApp message records found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50 transition-colors ${log.recipientType === 'Owner' ? 'bg-rose-50/30' : ''}`}
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{log.recipientName}</div>
                        <div className="text-[11px] font-mono text-emerald-700 font-bold">{log.recipientMobile}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          log.recipientType === 'Owner'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {log.recipientType === 'Owner' ? 'Owner Alert' : 'Guest'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {log.voucherType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="font-bold text-slate-800">{log.roomNo ? `Rm ${log.roomNo}` : '-'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{log.voucherNo || ''}</div>
                      </td>
                      <td className="py-3 px-4">
                        <p
                          onClick={() => setSelectedLog(log)}
                          className="text-slate-600 truncate max-w-xs cursor-pointer hover:text-blue-600"
                          title="Click to view full message"
                        >
                          {log.message}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[11px] font-semibold text-slate-700"
                            title="View Full Message"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleResend(log)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-0.5"
                            title="Open in WhatsApp"
                          >
                            <span>💬</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-600">
          <span>Showing {filteredLogs.length} logged dispatches</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded font-semibold text-xs"
          >
            Close
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-300 flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>💬</span>
                <h3 className="text-base font-bold">Dispatched WhatsApp Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border rounded-lg">
                <div><span className="text-slate-500">Recipient:</span> <strong>{selectedLog.recipientName}</strong></div>
                <div><span className="text-slate-500">Mobile:</span> <strong className="font-mono text-emerald-700">{selectedLog.recipientMobile}</strong></div>
                <div><span className="text-slate-500">Event:</span> <strong className="font-mono">{selectedLog.voucherType}</strong></div>
                <div><span className="text-slate-500">Timestamp:</span> <strong className="font-mono">{selectedLog.timestamp}</strong></div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">WhatsApp Chat Bubble Preview:</label>
                <div className="bg-[#e5ddd5] p-4 rounded-xl border border-[#c4b5a5]">
                  <div className="bg-white p-3 rounded-lg shadow-sm text-xs font-sans text-slate-800 leading-relaxed whitespace-pre-wrap border-l-4 border-emerald-500">
                    {selectedLog.message}
                    <div className="text-[10px] text-slate-400 text-right mt-2">{selectedLog.timestamp.slice(11, 16)} ✓✓ Delivered</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 px-6 py-3 flex items-center justify-end gap-2 border-t">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => handleResend(selectedLog)}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-2"
              >
                <span>💬</span> Re-Open in WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
