import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import { CancelKotModal } from './CancelKotModal';
import type { PmsKotRecord } from '../../types/pmsModels';

interface NcKotRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewKot?: () => void;
}

export const NcKotRegisterModal: React.FC<NcKotRegisterModalProps> = ({
  isOpen,
  onClose,
  onOpenNewKot
}) => {
  const [ncKots, setNcKots] = useState<PmsKotRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKotForCancel, setSelectedKotForCancel] = useState<string | null>(null);
  const [selectedKotForView, setSelectedKotForView] = useState<PmsKotRecord | null>(null);

  const loadData = () => {
    const data = PmsStore.getNcKots();
    setNcKots(data);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Flatten items for line-by-line register view matching Frame 280
  interface FlatNcRow {
    sNo: number;
    kotDate: string;
    kotTime: string;
    operatorName: string;
    billNo: string;
    itemName: string;
    qty: number;
    rate: number;
    amount: number;
    remark: string;
    status: string;
    rawKot: PmsKotRecord;
  }

  const flattenedRows: FlatNcRow[] = [];
  let counter = 1;

  ncKots.forEach((kot) => {
    const kotDate = kot.date || (kot.createdAt ? new Date(kot.createdAt).toLocaleDateString('en-GB') : '16-06-25');
    const kotTime = kot.createdAt ? new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:22';
    const operator = kot.operatorName || kot.waiterName || 'DEMO0004';
    const remark = kot.ncRemark || kot.guestName || kot.kotRemark || 'RAHUL';

    if (kot.items && kot.items.length > 0) {
      kot.items.forEach((item) => {
        flattenedRows.push({
          sNo: counter++,
          kotDate,
          kotTime,
          operatorName: operator,
          billNo: kot.kotNo.startsWith('R/') ? kot.kotNo : `R/${kot.kotNo}`,
          itemName: item.itemName,
          qty: item.qty,
          rate: item.rate,
          amount: item.amount,
          remark,
          status: kot.status,
          rawKot: kot
        });
      });
    } else {
      flattenedRows.push({
        sNo: counter++,
        kotDate,
        kotTime,
        operatorName: operator,
        billNo: kot.kotNo.startsWith('R/') ? kot.kotNo : `R/${kot.kotNo}`,
        itemName: 'General Item',
        qty: kot.totalQty || 1,
        rate: kot.totalAmount,
        amount: kot.totalAmount,
        remark,
        status: kot.status,
        rawKot: kot
      });
    }
  });

  const filteredRows = flattenedRows.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.billNo.toLowerCase().includes(q) ||
      r.itemName.toLowerCase().includes(q) ||
      r.remark.toLowerCase().includes(q) ||
      r.operatorName.toLowerCase().includes(q)
    );
  });

  const handleExport = (type: string) => {
    alert(`Exporting NC KOT Register to ${type}... Download will begin.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 8,
          width: '100%',
          maxWidth: 1100,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Dark Header */}
        <div
          style={{
            background: '#1e293b',
            color: '#ffffff',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🍽️</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              NC KOT Register (Non-Chargeable Orders)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {onOpenNewKot && (
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
                  padding: '5px 12px',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                + New NC KOT
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#334155',
                border: 'none',
                color: '#ffffff',
                borderRadius: 4,
                width: 28,
                height: 28,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sub Header - Frame 280 */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff'
          }}
        >
          <h2
            style={{
              textAlign: 'center',
              color: '#1e293b',
              fontSize: 20,
              fontWeight: 700,
              margin: '0 0 16px 0',
              fontFamily: 'inherit'
            }}
          >
            NC KOT Register
          </h2>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            {/* Left export tools matching Frame 280 */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleExport('Excel')}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  padding: '5px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#334155'
                }}
              >
                Excel
              </button>
              <button
                type="button"
                onClick={() => handleExport('PDF')}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  padding: '5px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#334155'
                }}
              >
                PDF
              </button>
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  padding: '5px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#334155'
                }}
              >
                Print
              </button>
            </div>

            {/* Right search input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Search:</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search KOT / Item / Remark..."
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  padding: '5px 10px',
                  fontSize: 13,
                  outline: 'none',
                  minWidth: 200
                }}
              />
            </div>
          </div>
        </div>

        {/* Table Content - Matching Frame 280 exactly */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 24px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12.5,
              marginTop: 12
            }}
          >
            <thead>
              <tr
                style={{
                  background: '#f8fafc',
                  borderTop: '1px solid #cbd5e1',
                  borderBottom: '2px solid #cbd5e1',
                  color: '#334155'
                }}
              >
                <th style={{ padding: '8px 6px', textAlign: 'center', width: 45 }}>S.No▴</th>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>KOT Date</th>
                <th style={{ padding: '8px 8px', textAlign: 'left' }}>KOT Time</th>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Oprater Name</th>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Bill No</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Item Name</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Remark</th>
                <th style={{ padding: '8px 8px', textAlign: 'center', width: 60 }}>Cancel</th>
                <th style={{ padding: '8px 8px', textAlign: 'center', width: 70 }}>Print Kot</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No NC KOT records found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const isCancelled = row.status === 'Cancelled';
                  return (
                    <tr
                      key={`${row.billNo}-${row.itemName}-${idx}`}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        background: isCancelled ? '#fee2e2' : idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                      }}
                    >
                      <td style={{ padding: '8px 6px', textAlign: 'center', color: '#64748b' }}>
                        {row.sNo}
                      </td>
                      <td style={{ padding: '8px 10px' }}>{row.kotDate}</td>
                      <td style={{ padding: '8px 8px' }}>{row.kotTime}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{row.operatorName}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0284c7' }}>
                        {row.billNo}
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row.itemName}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>{row.qty.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>{row.rate.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                        {row.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span
                          style={{
                            background: '#e0f2fe',
                            color: '#0369a1',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontWeight: 700,
                            fontSize: 11
                          }}
                        >
                          {row.remark}
                        </span>
                      </td>

                      {/* Cancel Action - Frame 280 red round cross */}
                      <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                        {isCancelled ? (
                          <span style={{ fontSize: 11, color: '#b91c1c', fontWeight: 700 }}>
                            Cancelled
                          </span>
                        ) : (
                          <button
                            type="button"
                            title="Cancel NC KOT"
                            onClick={() => setSelectedKotForCancel(row.billNo)}
                            style={{
                              background: '#ef4444',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '50%',
                              width: 22,
                              height: 22,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: 11,
                              lineHeight: 1
                            }}
                          >
                            ✖
                          </button>
                        )}
                      </td>

                      {/* Print Kot Action - Frame 280 purple eye */}
                      <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          title="View / Print NC KOT Slip"
                          onClick={() => setSelectedKotForView(row.rawKot)}
                          style={{
                            background: '#7c3aed',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 22,
                            height: 22,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: 11
                          }}
                        >
                          👁
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info & pagination */}
        <div
          style={{
            padding: '12px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12.5,
            color: '#64748b'
          }}
        >
          <div>
            Showing 1 to {filteredRows.length} of {flattenedRows.length} entries
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: 4,
                padding: '4px 10px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              1
            </button>
          </div>
        </div>

        {/* Bottom Business Explainer */}
        <div
          style={{
            background: '#fef3c7',
            padding: '8px 24px',
            borderTop: '1px solid #fde68a',
            fontSize: 11.5,
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span>ℹ️</span>
          <span>
            <strong>NC (Non-Chargeable) Orders:</strong> Compliments for owners, VIP guests, and staff dining. Bill total is zero, preserving revenue integrity while tracking all inventory deductions.
          </span>
        </div>
      </div>

      {/* Cancel Record Modal */}
      {selectedKotForCancel && (
        <CancelKotModal
          isOpen={Boolean(selectedKotForCancel)}
          onClose={() => setSelectedKotForCancel(null)}
          kotNo={selectedKotForCancel}
          onCancelSuccess={() => {
            loadData();
          }}
        />
      )}

      {/* Slip Modal View */}
      {selectedKotForView && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10002
          }}
          onClick={() => setSelectedKotForView(null)}
        >
          <div
            style={{
              background: '#fef9c3',
              border: '2px dashed #ca8a04',
              borderRadius: 8,
              padding: '24px',
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              fontFamily: 'monospace'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #ca8a04', paddingBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>*** NC KOT SLIP ***</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12 }}>HOTEL SAI VASUDEV RESIDENCY</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: '#b91c1c' }}>
                NON-CHARGEABLE ORDER
              </p>
            </div>
            <div style={{ fontSize: 12, margin: '10px 0', lineHeight: 1.6 }}>
              <div><strong>KOT No:</strong> {selectedKotForView.kotNo}</div>
              <div><strong>Table:</strong> {selectedKotForView.tableNo || 'NC'}</div>
              <div><strong>Beneficiary / Guest:</strong> {selectedKotForView.ncRemark || selectedKotForView.guestName}</div>
              <div><strong>Operator:</strong> {selectedKotForView.operatorName || 'DEMO0004'}</div>
              <div><strong>Date:</strong> {selectedKotForView.date || new Date(selectedKotForView.createdAt).toLocaleDateString('en-GB')}</div>
            </div>
            <table style={{ width: '100%', fontSize: 12, borderTop: '1px dashed #ca8a04', borderBottom: '1px dashed #ca8a04', margin: '8px 0', padding: '6px 0' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th>Item</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedKotForView.items.map((it, i) => (
                  <tr key={i}>
                    <td>{it.itemName}</td>
                    <td style={{ textAlign: 'center' }}>{it.qty}</td>
                    <td style={{ textAlign: 'right' }}>₹{it.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 13, marginTop: 6 }}>
              <div>Actual Food Cost: ₹{selectedKotForView.totalAmount.toFixed(2)}</div>
              <div style={{ color: '#16a34a' }}>Charge to Guest: ₹0.00 (NC)</div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ flex: 1, background: '#1e293b', color: '#fff', border: 'none', padding: '8px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
              >
                🖨️ Print Slip
              </button>
              <button
                type="button"
                onClick={() => setSelectedKotForView(null)}
                style={{ flex: 1, background: '#64748b', color: '#fff', border: 'none', padding: '8px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
