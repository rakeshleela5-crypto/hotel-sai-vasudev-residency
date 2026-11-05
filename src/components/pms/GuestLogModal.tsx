import React, { useState } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { PmsGuestLogEntry } from '../../types/pmsModels';
import './pmsStyles.css';

interface GuestLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRoomDashboard?: () => void;
  onOpenCheckOut?: () => void;
}

export const GuestLogModal: React.FC<GuestLogModalProps> = ({
  isOpen,
  onClose,
  onOpenRoomDashboard,
  onOpenCheckOut
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  if (!isOpen) return null;

  const guests: PmsGuestLogEntry[] = PmsStore.getGuestLog();

  const filteredGuests = guests.filter(g => {
    const term = searchTerm.toLowerCase();
    return (
      g.guestName.toLowerCase().includes(term) ||
      (g.phone && g.phone.includes(term)) ||
      (g.city && g.city.toLowerCase().includes(term))
    );
  });

  const totalRevenue = filteredGuests.reduce((s, g) => s + g.totalAmount, 0);
  const totalVisits = filteredGuests.reduce((s, g) => s + g.numberOfVisits, 0);

  const handleCopy = () => {
    const text = filteredGuests.map(g => `${g.sNo}\t${g.guestName}\t${g.numberOfVisits}\t${g.totalAmount.toFixed(2)}`).join('\n');
    navigator.clipboard.writeText(`S.No\tGuest Name\tNo. of Visits\tTotal Amount (₹)\n${text}`);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleExportCsv = () => {
    const headers = ['S.No', 'Guest Name', 'Phone', 'City', 'No. of Visits', 'Total Amount (₹)', 'VIP Tier'];
    const rows = filteredGuests.map(g => [
      g.sNo,
      `"${g.guestName}"`,
      `"${g.phone || ''}"`,
      `"${g.city || ''}"`,
      g.numberOfVisits,
      g.totalAmount.toFixed(2),
      g.vipTier || 'Standard'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `guest_log_vip_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppVip = (guest: PmsGuestLogEntry) => {
    const phone = guest.phone ? guest.phone.replace(/[^0-9]/g, '') : '9822000000';
    const message = encodeURIComponent(
      `Dear ${guest.guestName},\nThank you for choosing SRI SAI VASUDEV RESIDENCY! As a valued guest with ${guest.numberOfVisits} visits, we are delighted to offer you exclusive VIP member privileges on your next stay. 🙏\nReservations: 7999663696`
    );
    window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="pms-reg-modal-backdrop" onClick={onClose}>
      <div 
        className="pms-reg-modal-window"
        style={{ maxWidth: '960px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="pms-reg-header">
          <div className="pms-reg-header-left">
            <span className="pms-reg-header-icon">📖</span>
            <div>
              <h2 className="pms-reg-header-title">
                GUEST LOG &amp; VIP FREQUENT GUEST REGISTER
              </h2>
              <div className="pms-reg-header-sub">
                pms.hotelsai-vasudev.com/guestlog &bull; <span className="gold">SRI SAI VASUDEV RESIDENCY</span> &bull; Guest Lifetime Value Audit
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

        {/* Top Action Buttons (Frame 0350 Exact Match) */}
        <div className="bg-slate-100 px-6 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { onClose(); if (onOpenRoomDashboard) onOpenRoomDashboard(); }}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded shadow-xs cursor-pointer transition-colors"
            >
              Room Dash Board
            </button>
            <button
              type="button"
              onClick={() => { onClose(); if (onOpenCheckOut) onOpenCheckOut(); }}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs cursor-pointer transition-colors"
            >
              New Check Out
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-slate-600">Total Unique Guests: <strong className="text-gray-900">{filteredGuests.length}</strong></span>
            <span className="text-slate-600">Lifetime Revenue: <strong className="text-emerald-700">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
          </div>
        </div>

        {/* Toolbar & Search Bar */}
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
              placeholder="Search guest or city..."
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
                  <th className="py-2.5 px-4 border-r border-gray-300">Guest Name</th>
                  <th className="py-2.5 px-4 border-r border-gray-300 w-32">City / Location</th>
                  <th className="py-2.5 px-4 border-r border-gray-300 w-28 text-center">No. of Visits</th>
                  <th className="py-2.5 px-4 border-r border-gray-300 text-right w-40">Total Amount (₹)</th>
                  <th className="py-2.5 px-4 text-center w-36">VIP Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b', fontStyle: 'italic', fontSize: '13px' }}>
                      No guest stay records found. Once guests check in or check out at the front desk, their lifetime audit profiles and VIP tiers will appear here.
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((guest, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-yellow-50/60 transition-colors">
                    <td className="py-2.5 px-4 border-r border-gray-200 text-center font-mono text-gray-500">{guest.sNo}</td>
                    <td className="py-2.5 px-4 border-r border-gray-200">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <span>{guest.guestName}</span>
                        {guest.vipTier === 'Platinum' && (
                          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 font-bold text-[9px] rounded uppercase">Platinum</span>
                        )}
                        {guest.vipTier === 'Gold' && (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold text-[9px] rounded uppercase">Gold</span>
                        )}
                        {guest.vipTier === 'Silver' && (
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 font-bold text-[9px] rounded uppercase">Silver</span>
                        )}
                      </div>
                      {guest.phone && <div className="text-[10px] text-gray-500">{guest.phone}</div>}
                    </td>
                    <td className="py-2.5 px-4 border-r border-gray-200 text-gray-600">
                      {guest.city || '—'}
                    </td>
                    <td className="py-2.5 px-4 border-r border-gray-200 text-center font-bold font-mono text-blue-800">
                      <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded-full">
                        {guest.numberOfVisits}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 border-r border-gray-200 text-right font-mono font-bold text-emerald-800">
                      {guest.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleWhatsAppVip(guest)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded shadow-2xs flex items-center justify-center gap-1 mx-auto cursor-pointer transition-colors"
                        title="Send VIP WhatsApp Privilege Message"
                      >
                        <span>💬</span>
                        <span>VIP Greeting</span>
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200 font-bold text-xs border-t-2 border-gray-400">
                  <td colSpan={3} className="py-2.5 px-4 text-right uppercase tracking-wider text-gray-700 border-r border-gray-300">
                    Grand Total ({filteredGuests.length} Guests)
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-blue-900 border-r border-gray-300 font-black">
                    {totalVisits} visits
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-900 font-black border-r border-gray-300">
                    ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-4 text-center text-[10px] text-gray-500">
                    Live Synced
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            Showing 1 to {filteredGuests.length} of {filteredGuests.length} entries 
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
