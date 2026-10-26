import React, { useState, useEffect } from 'react';
import type { PmsCheckOutDetail, BillFormatType } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';
import './pmsStyles.css';

interface CheckOutRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBillFormat: (checkout: PmsCheckOutDetail, format: BillFormatType) => void;
  onOpenNewCheckIn?: () => void;
}

export const CheckOutRegisterModal: React.FC<CheckOutRegisterModalProps> = ({
  isOpen,
  onClose,
  onOpenBillFormat
}) => {
  const [checkouts, setCheckouts] = useState<PmsCheckOutDetail[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [antiTheftAlert, setAntiTheftAlert] = useState<{
    show: boolean;
    invoiceNo: string;
    roomNo: string;
    amount: number;
    operator: string;
    message: string;
  } | null>(null);
  const itemsPerPage = 8;

  useEffect(() => {
    if (isOpen) {
      setCheckouts(PmsStore.getCheckouts());
      const unsub = PmsStore.subscribe(() => {
        setCheckouts(PmsStore.getCheckouts());
      });

      hotelApi.getCheckouts()
        .then(pgCheckouts => {
          if (Array.isArray(pgCheckouts) && pgCheckouts.length > 0) {
            const current = PmsStore.getCheckouts();
            const map = new Map(current.map(c => [c.invoiceNo, c]));
            pgCheckouts.forEach(c => map.set(c.invoiceNo, c));
            const merged = Array.from(map.values());
            localStorage.setItem('svr_pms_checkouts', JSON.stringify(merged));
            setCheckouts(merged);
          }
        })
        .catch(err => {
          console.warn('[CheckOutRegisterModal] PostgreSQL sync fallback to cache:', err);
        });

      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = checkouts.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.invoiceNo.toLowerCase().includes(term) ||
      c.guestName.toLowerCase().includes(term) ||
      c.guestPhone.toLowerCase().includes(term) ||
      c.roomNo.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleWhatsAppSend = (c: PmsCheckOutDetail) => {
    PmsStore.sendWhatsAppNotification({
      voucherType: 'Check_out_store',
      recipientMobile: c.guestPhone,
      recipientName: c.guestName,
      voucherNo: c.invoiceNo,
      roomNo: c.roomNo,
      templateParams: {
        checkout_date: c.checkOutDate,
        total_billamount: c.netPayable.toFixed(2)
      },
      openDirectly: true
    });
  };

  const handleDelete = (invoiceNo: string) => {
    const target = checkouts.find(c => c.invoiceNo === invoiceNo);
    if (!target) return;

    if (confirm(`⚠️ ANTI-THEFT AUDIT WARNING:\nAre you sure you want to delete checkout record ${invoiceNo} (Room ${target.roomNo}, ₹${target.netPayable.toFixed(2)})?\n\nAn instant fraud-prevention WhatsApp alert will be dispatched to the hotel owner!`)) {
      const currentUser = PmsStore.getCurrentUser();
      
      // Video 27: Trigger Anti-Theft alert to hotel owner
      PmsStore.triggerAntiTheftAlert({
        voucherType: 'Check_out_delete',
        roomNo: target.roomNo,
        voucherNo: target.invoiceNo,
        guestName: target.guestName,
        checkoutDate: target.checkOutDate,
        totalBillAmount: target.netPayable,
        operatorName: currentUser.userName
      });

      PmsStore.deleteCheckout(invoiceNo);
      setCheckouts(PmsStore.getCheckouts());

      setAntiTheftAlert({
        show: true,
        invoiceNo: target.invoiceNo,
        roomNo: target.roomNo,
        amount: target.netPayable,
        operator: currentUser.userName,
        message: `🚨 ANTI-THEFT OWNER ALERT DISPATCHED: Owner notified on WhatsApp (7999663696) that checkout folio ${target.invoiceNo} (Room ${target.roomNo}, ₹${target.netPayable.toFixed(2)}) was deleted by operator "${currentUser.userName}".`
      });

      setTimeout(() => setAntiTheftAlert(null), 8000);
    }
  };

  return (
    <div className="pms-overlay" onClick={onClose}>
      <div
        className="pms-window"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 1040,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff'
        }}
      >
        {/* Header matching Video 26 Frame 0150 */}
        <header
          style={{
            background: '#212529',
            color: '#fff',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #0284c7'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>📋</span>
            <span style={{ fontWeight: 800, fontSize: 14 }}>
              HOTEL &bull; CHECKOUT REGISTER (/roomcheckouts)
            </span>
            <span
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                color: '#38bdf8',
                fontFamily: 'monospace'
              }}
            >
              pms.hotelsai-vasudev.com/roomcheckouts
            </span>
          </div>

          <button type="button" onClick={onClose} className="pms-close-btn" title="Close">
            ✕
          </button>
        </header>

        {/* Video 27 Anti-Theft Fraud Prevention Banner */}
        {antiTheftAlert && (
          <div
            style={{
              background: '#fef2f2',
              borderBottom: '2px solid #ef4444',
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              animation: 'fadeIn 0.3s ease-in'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🚨</span>
              <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 700 }}>
                {antiTheftAlert.message}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAntiTheftAlert(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#991b1b',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Toolbar: Print & Search matching Frame 0150 */}
        <div
          style={{
            padding: '12px 18px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '5px 14px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>🖨️</span>
              <span>Print Table</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Guest, Room, Invoice..."
              style={{
                padding: '5px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                fontSize: 12,
                width: 220
              }}
            />
          </div>
        </div>

        {/* Checkouts Table matching Frame 0150 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 18px' }}>
          <table className="pms-table-compact" style={{ fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th>CheckIn / Inv No</th>
                <th style={{ textAlign: 'center', width: 75 }}>Room No</th>
                <th>Guest Name</th>
                <th>Contact No</th>
                <th style={{ textAlign: 'center' }}>Check in Date</th>
                <th style={{ textAlign: 'center' }}>Check Out Date</th>
                <th style={{ textAlign: 'center', width: 75 }}>Total Days</th>
                <th style={{ textAlign: 'right' }}>Bill Amount (₹)</th>
                <th style={{ textAlign: 'center', width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                    No checkouts found matching &quot;{searchTerm}&quot;
                  </td>
                </tr>
              ) : (
                paginated.map((c) => (
                  <tr key={c.invoiceNo}>
                    <td style={{ fontWeight: 700, color: '#0284c7' }}>{c.invoiceNo}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800 }}>{c.roomNo}</td>
                    <td style={{ fontWeight: 600 }}>{c.guestName}</td>
                    <td>{c.guestPhone}</td>
                    <td style={{ textAlign: 'center' }}>{c.checkInDate}</td>
                    <td style={{ textAlign: 'center' }}>{c.checkOutDate}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{c.numberOfDays}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                      {c.netPayable.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                        {/* Blue Print Icon - Opens Standard A4 Format 3 */}
                        <button
                          type="button"
                          onClick={() => onOpenBillFormat(c, 'Format_3_A4_Standard')}
                          style={{
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            padding: '3px 7px',
                            borderRadius: 3,
                            cursor: 'pointer',
                            fontSize: 11
                          }}
                          title="Print / View A4 Standard Tax Invoice (Format 3)"
                        >
                          🖨️
                        </button>

                        {/* Eye Icon - Opens Day-wise Breakdown Format 1 (/room_checkout_view2) */}
                        <button
                          type="button"
                          onClick={() => onOpenBillFormat(c, 'Format_1_DayWise')}
                          style={{
                            background: '#0284c7',
                            color: '#fff',
                            border: 'none',
                            padding: '3px 7px',
                            borderRadius: 3,
                            cursor: 'pointer',
                            fontSize: 11
                          }}
                          title="View Day-wise Itemized Statement (Format 1 / View 2)"
                        >
                          👁️
                        </button>

                        {/* Format 4 A5 Icon */}
                        <button
                          type="button"
                          onClick={() => onOpenBillFormat(c, 'Format_4_A5_Compact')}
                          style={{
                            background: '#ca8a04',
                            color: '#fff',
                            border: 'none',
                            padding: '3px 7px',
                            borderRadius: 3,
                            cursor: 'pointer',
                            fontSize: 11
                          }}
                          title="Print A5 Compact Half-Page Invoice (Format 4)"
                        >
                          📄
                        </button>

                        {/* Green WhatsApp Dispatch */}
                        <button
                          type="button"
                          onClick={() => handleWhatsAppSend(c)}
                          style={{
                            background: '#22c55e',
                            color: '#fff',
                            border: 'none',
                            padding: '3px 7px',
                            borderRadius: 3,
                            cursor: 'pointer',
                            fontSize: 11
                          }}
                          title="Dispatch WhatsApp Invoice to Guest"
                        >
                          💬
                        </button>

                        {/* Red Delete Icon */}
                        <button
                          type="button"
                          onClick={() => handleDelete(c.invoiceNo)}
                          style={{
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            padding: '3px 7px',
                            borderRadius: 3,
                            cursor: 'pointer',
                            fontSize: 11
                          }}
                          title="Delete Checkout Record"
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

        {/* Pagination matching Video 26 Frame 0150 */}
        <footer
          style={{
            padding: '10px 18px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12
          }}
        >
          <span style={{ color: '#64748b' }}>
            Showing {filtered.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} entries
          </span>

          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              style={{
                border: '1px solid #cbd5e1',
                background: '#fff',
                padding: '3px 8px',
                borderRadius: 3,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                style={{
                  border: '1px solid #cbd5e1',
                  background: currentPage === page ? '#2563eb' : '#fff',
                  color: currentPage === page ? '#fff' : '#000',
                  padding: '3px 8px',
                  borderRadius: 3,
                  fontWeight: currentPage === page ? 800 : 400,
                  cursor: 'pointer'
                }}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              style={{
                border: '1px solid #cbd5e1',
                background: '#fff',
                padding: '3px 8px',
                borderRadius: 3,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              &gt;
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
