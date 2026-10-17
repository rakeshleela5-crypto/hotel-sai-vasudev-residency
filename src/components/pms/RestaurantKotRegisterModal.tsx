import React, { useState, useEffect } from 'react';
import type { PmsKotRecord } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import { NcKotRegisterModal } from './NcKotRegisterModal';
import { CancelKotModal } from './CancelKotModal';

interface RestaurantKotRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenKitchenDashboard: () => void;
  onOpenNewKot: () => void;
}

export const RestaurantKotRegisterModal: React.FC<RestaurantKotRegisterModalProps> = ({
  isOpen,
  onClose,
  onOpenKitchenDashboard,
  onOpenNewKot
}) => {
  const [kots, setKots] = useState<PmsKotRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Ready To Serve' | 'Served' | 'Billed' | 'Cancelled'>('All');
  const [selectedKotForView, setSelectedKotForView] = useState<PmsKotRecord | null>(null);
  const [isNcRegisterOpen, setIsNcRegisterOpen] = useState(false);
  const [selectedKotForCancel, setSelectedKotForCancel] = useState<string | null>(null);

  const loadKots = () => {
    setKots(PmsStore.getKots());
  };

  useEffect(() => {
    if (isOpen) {
      loadKots();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredKots = kots.filter(k => {
    const matchesSearch =
      k.kotNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.tableNo && k.tableNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      k.roomNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.guestName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Ready To Serve'
        ? k.status === 'Ready To Serve' || k.serveStatus === 'Ready To Serve'
        : k.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div
        className="pms-form-box"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 1120, width: '96%', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Banner matching Video 12 Frame 0300 */}
        <div
          className="pms-form-banner"
          style={{
            background: '#1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            borderBottom: '2px solid #0284c7'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🍴</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#ffffff', letterSpacing: 0.5 }}>
              Restaurant KOT Register (Video 12 Frame 0300)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Top 7 Action Buttons matching Video 12 Frame 0300 */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 16,
              background: '#f8fafc',
              padding: 10,
              borderRadius: 6,
              border: '1px solid #e2e8f0'
            }}
          >
            {/* 1. New KOT (Green) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewKot();
              }}
              style={{
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: 4,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              New KOT ➕
            </button>

            {/* 2. Cleared KOT List (Blue) */}
            <button
              type="button"
              onClick={() => setStatusFilter('Billed')}
              style={{
                background: statusFilter === 'Billed' ? '#0369a1' : '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: 4,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Cleared KOT List
            </button>

            {/* 3. NC KOT Register (Burgundy / Red - Video 13) */}
            <button
              type="button"
              onClick={() => setIsNcRegisterOpen(true)}
              style={{
                background: '#9d174d',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: 4,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Nc KOT Register
            </button>

            {/* 4. Cancel KOT (Red) */}
            <button
              type="button"
              onClick={() => setStatusFilter('Cancelled')}
              style={{
                background: statusFilter === 'Cancelled' ? '#991b1b' : '#dc2626',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: 4,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Cancel KOT List
            </button>

            {/* 5. Table Wise Item (Dark) */}
            <button
              type="button"
              onClick={() => alert('Table Wise Item: Active dining table order consolidation.')}
              style={{
                background: '#1e293b',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: 4,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Table Wise Item
            </button>

            {/* 6. Kot Register (Cyan) */}
            <button
              type="button"
              onClick={() => setStatusFilter('All')}
              style={{
                background: statusFilter === 'All' ? '#0891b2' : '#06b6d4',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: 4,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Kot Register (All)
            </button>

            {/* 7. Kitchen Dashboard (Yellow/Gold) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenKitchenDashboard();
              }}
              style={{
                background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                color: '#0f172a',
                border: 'none',
                padding: '7px 16px',
                borderRadius: 4,
                fontWeight: 900,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <span>🍳</span>
              <span>Kitchen Dashboard</span>
            </button>
          </div>

          {/* Search & Pagination Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569' }}>
              <select
                value={entriesPerPage}
                onChange={e => setEntriesPerPage(Number(e.target.value))}
                style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries per page</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Search:</span>
              <input
                type="text"
                placeholder="Search KOT No, Table, Room..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  width: 240
                }}
              />
            </div>
          </div>

          {/* Restaurant KOT Table matching Frame 0300 */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#1e293b' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'center', width: 45 }}>S.No</th>
                  <th style={{ padding: '10px 10px' }}>Date</th>
                  <th style={{ padding: '10px 10px', fontWeight: 800 }}>KOT No</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 800 }}>Table / Room</th>
                  <th style={{ padding: '10px 10px', textAlign: 'right' }}>Total Qty</th>
                  <th style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 800 }}>Total Amount</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 800 }}>Serve Status</th>
                  <th style={{ padding: '10px 10px' }}>Remark</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center', width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredKots.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
                      No KOT records found.
                    </td>
                  </tr>
                ) : (
                  filteredKots.slice(0, entriesPerPage).map((item, idx) => {
                    const isCancelled = item.status === 'Cancelled';
                    const isReady = item.status === 'Ready To Serve' || item.serveStatus === 'Ready To Serve';
                    const isPending = item.status === 'Pending' || item.status === 'Cooking';
                    const isServed = item.status === 'Served';
                    const isBilled = item.status === 'Billed';

                    return (
                      <tr
                        key={item.kotNo}
                        style={{
                          borderBottom: isCancelled ? '1px solid #f87171' : '1px solid #e2e8f0',
                          background: isCancelled ? '#fee2e2' : idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                        }}
                      >
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#64748b' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '10px 10px' }}>
                          {item.date || new Date(item.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td style={{ padding: '10px 10px', fontWeight: 800, color: '#0284c7' }}>
                          {item.kotNo}
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 700 }}>
                          {item.tableNo || `Room ${item.roomNo}`}
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                          {item.totalQty || item.items.reduce((a, b) => a + b.qty, 0)}.00
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          ₹{item.totalAmount.toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                          <span
                            style={{
                              background: isCancelled ? '#fecaca' : isReady ? '#dcfce7' : isPending ? '#fee2e2' : isServed ? '#fef3c7' : isBilled ? '#e0e7ff' : '#f1f5f9',
                              color: isCancelled ? '#991b1b' : isReady ? '#166534' : isPending ? '#b91c1c' : isServed ? '#92400e' : isBilled ? '#3730a3' : '#475569',
                              padding: '2px 8px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 800
                            }}
                          >
                            {isCancelled ? 'cancel' : isReady ? 'Ready To Serve' : isPending ? 'Cooking / Pending' : isServed ? 'Served' : isBilled ? 'Billed' : item.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 10px', color: isCancelled ? '#b91c1c' : '#64748b', fontSize: 11, fontWeight: isCancelled ? 700 : 400 }}>
                          {item.cancelReason || item.kotRemark || (item.isNc ? item.ncRemark : '-')}
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                            {/* Print */}
                            <button
                              type="button"
                              title="Print KOT Slip"
                              onClick={() => setSelectedKotForView(item)}
                              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '3px 6px', cursor: 'pointer', fontSize: 12 }}
                            >
                              🖨️
                            </button>

                            {/* View */}
                            <button
                              type="button"
                              title="View KOT Details"
                              onClick={() => setSelectedKotForView(item)}
                              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '3px 6px', cursor: 'pointer', fontSize: 12 }}
                            >
                              👁️
                            </button>

                            {/* Cancel */}
                            {item.status !== 'Billed' && !isCancelled ? (
                              <button
                                type="button"
                                title="Cancel KOT"
                                onClick={() => setSelectedKotForCancel(item.kotNo)}
                                style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', borderRadius: 4, padding: '3px 6px', cursor: 'pointer', fontSize: 12 }}
                              >
                                ❌
                              </button>
                            ) : isCancelled ? (
                              <span style={{ fontSize: 11, color: '#b91c1c', fontWeight: 700 }}>
                                Cancelled
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 11, color: '#64748b' }}>
            <div>
              Showing 1 to {Math.min(filteredKots.length, entriesPerPage)} of {filteredKots.length} entries
            </div>
          </div>
        </div>

        {/* View Modal */}
        {selectedKotForView && (
          <div className="pms-submodal-overlay" onClick={() => setSelectedKotForView(null)}>
            <div className="pms-form-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460, padding: 20 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 15, borderBottom: '1px solid #cbd5e1', paddingBottom: 6 }}>
                KOT #{selectedKotForView.kotNo} &bull; {selectedKotForView.tableNo || `Room ${selectedKotForView.roomNo}`}
              </h3>
              <div style={{ fontSize: 12, lineHeight: 1.8, marginBottom: 12 }}>
                <div><strong>Guest:</strong> {selectedKotForView.guestName}</div>
                <div><strong>Waiter:</strong> {selectedKotForView.waiterName || 'DEMO0004'}</div>
                <div><strong>Status:</strong> {selectedKotForView.status}</div>
                <div><strong>Remark:</strong> {selectedKotForView.kotRemark || 'None'}</div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 12 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Item</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedKotForView.items.map((it, i) => (
                    <tr key={i} style={{ borderBottom: '1px dashed #e2e8f0' }}>
                      <td style={{ padding: '6px 8px' }}>{it.itemName}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{it.qty}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>₹{it.rate}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>₹{it.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 13, marginBottom: 14 }}>
                Total Amount: ₹{selectedKotForView.totalAmount.toFixed(2)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedKotForView(null)}
                  className="btn-pms-cancel"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    setSelectedKotForView(null);
                  }}
                  className="btn-pms-save"
                >
                  Print Slip 🖨️
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submodals */}
        <NcKotRegisterModal
          isOpen={isNcRegisterOpen}
          onClose={() => setIsNcRegisterOpen(false)}
          onOpenNewKot={() => {
            setIsNcRegisterOpen(false);
            onOpenNewKot();
          }}
        />

        {selectedKotForCancel && (
          <CancelKotModal
            isOpen={Boolean(selectedKotForCancel)}
            onClose={() => setSelectedKotForCancel(null)}
            kotNo={selectedKotForCancel}
            onCancelSuccess={() => {
              loadKots();
            }}
          />
        )}
      </div>
    </div>
  );
};
