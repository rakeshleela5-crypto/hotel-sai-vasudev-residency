import React from 'react';
import type { PmsKotRecord } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';

interface KotPrintViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  kot: PmsKotRecord | null;
  onPrinted?: () => void;
}

export const KotPrintViewModal: React.FC<KotPrintViewModalProps> = ({
  isOpen,
  onClose,
  kot,
  onPrinted
}) => {
  if (!isOpen || !kot) return null;

  const handlePrint = () => {
    // Mark KOT as printed in PmsStore
    PmsStore.markKotAsPrinted(kot.kotNo);
    if (onPrinted) {
      onPrinted();
    }
    window.print();
  };

  const totalQty = kot.totalQty || kot.items.reduce((sum, it) => sum + it.qty, 0);
  const totalAmount = kot.totalAmount || kot.items.reduce((sum, it) => sum + it.amount, 0);

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div
        className="pms-form-box"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 620,
          width: '95%',
          background: '#ffffff',
          borderRadius: 6,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1'
        }}
      >
        {/* Printable KOT slip container */}
        <div id="kot-print-area" style={{ padding: '24px 28px', background: '#ffffff' }}>
          {/* Top Yellow Header Box matching Frame 0275 */}
          <div
            style={{
              background: '#fde047',
              textAlign: 'center',
              padding: '12px 10px',
              border: '2px solid #ca8a04',
              borderRadius: '4px 4px 0 0'
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: 2,
                color: '#1e293b'
              }}
            >
              KOT
            </h1>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: '#334155',
                marginTop: 2,
                letterSpacing: 0.5
              }}
            >
              HOTEL SRI SAI VASUDEV RESIDENCY
            </div>
          </div>

          {/* Guest & KOT Details Two-Column Box matching Frame 0275 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              borderLeft: '2px solid #ca8a04',
              borderRight: '2px solid #ca8a04',
              borderBottom: '2px solid #ca8a04'
            }}
          >
            {/* Left Mint Green Guest Box */}
            <div
              style={{
                background: '#a7f3d0',
                padding: '10px 14px',
                borderRight: '1px solid #86efac',
                fontSize: 13,
                color: '#064e3b',
                lineHeight: 1.6
              }}
            >
              <div style={{ fontWeight: 800, textDecoration: 'underline', marginBottom: 4 }}>
                Guest Detail
              </div>
              <div>
                <strong>Guest Name:</strong> {kot.guestName || 'Guest'}
              </div>
              <div>
                <strong>
                  {kot.serviceType === 'Restaurant' ? 'Guest Table No:' : 'Guest Room No:'}
                </strong>{' '}
                {kot.tableNo || kot.roomNo || '101'}
              </div>
              <div>
                <strong>Check In No:</strong> {kot.checkInNo || '203'}
              </div>
              {kot.kotRemark && (
                <div style={{ fontStyle: 'italic', color: '#047857' }}>
                  <strong>Remark:</strong> {kot.kotRemark}
                </div>
              )}
            </div>

            {/* Right Yellow KOT Box */}
            <div
              style={{
                background: '#fef08a',
                padding: '10px 14px',
                fontSize: 13,
                color: '#713f12',
                lineHeight: 1.6
              }}
            >
              <div>
                <strong>Kot No :</strong>{' '}
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{kot.kotNo}</span>
              </div>
              <div>
                <strong>Date :</strong> {kot.date || '16-06-25'}
              </div>
              <div>
                <strong>Time :</strong> {kot.time || '05:37 AM'}
              </div>
              <div>
                <strong>Source :</strong> {kot.orderSource || 'Mobile Waiter'}
              </div>
            </div>
          </div>

          {/* Items Table matching Frame 0275 */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: 14,
              border: '1px solid #cbd5e1',
              fontSize: 13
            }}
          >
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #94a3b8' }}>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: 50, borderRight: '1px solid #cbd5e1' }}>
                  S.no
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>
                  Item Name
                </th>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: 60, borderRight: '1px solid #cbd5e1' }}>
                  Qty
                </th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: 80, borderRight: '1px solid #cbd5e1' }}>
                  Rate
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'right', width: 90 }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {kot.items.map((it, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                    background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                  }}
                >
                  <td style={{ padding: '6px 10px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, borderRight: '1px solid #e2e8f0' }}>
                    {it.itemName}
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, borderRight: '1px solid #e2e8f0' }}>
                    {it.qty}
                  </td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', borderRight: '1px solid #e2e8f0' }}>
                    {it.rate.toFixed(2)}
                  </td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700 }}>
                    {it.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Total Summary Bar matching Frame 0275 */}
          <div
            style={{
              marginTop: 10,
              padding: '8px 14px',
              textAlign: 'center',
              fontWeight: 800,
              fontSize: 14,
              color: '#0f172a',
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: 4
            }}
          >
            Total Item QTY = {totalQty.toFixed(2)} &nbsp;&nbsp;|&nbsp;&nbsp; Total Amount = ₹{totalAmount.toFixed(2)}
          </div>

          {kot.isPrinted === false && (
            <div
              style={{
                marginTop: 10,
                textAlign: 'center',
                color: '#dc2626',
                fontWeight: 700,
                fontSize: 12
              }}
            >
              ⚠️ Status: Unprinted Queue (Waiters order from mobile)
            </div>
          )}
        </div>

        {/* Modal Action Buttons matching Frame 0275 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 14,
            padding: '14px 20px',
            background: '#f1f5f9',
            borderTop: '1px solid #e2e8f0'
          }}
        >
          <button
            type="button"
            onClick={handlePrint}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '8px 24px',
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 4px rgba(37,99,235,0.3)'
            }}
          >
            🖨️ Print
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#06b6d4',
              color: '#ffffff',
              border: 'none',
              padding: '8px 24px',
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 4px rgba(6,182,212,0.3)'
            }}
          >
            Restaurant
          </button>
        </div>
      </div>
    </div>
  );
};
