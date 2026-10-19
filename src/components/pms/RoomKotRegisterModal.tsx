import React, { useState, useEffect } from 'react';
import type { PmsKotRecord } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import { KotPrintViewModal } from './KotPrintViewModal';
import { CancelKotModal } from './CancelKotModal';

interface RoomKotRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenKitchenDashboard?: () => void;
  onOpenNewKot?: () => void;
  filterServiceType?: 'Room' | 'Restaurant' | 'All';
  titleOverride?: string;
}

export const RoomKotRegisterModal: React.FC<RoomKotRegisterModalProps> = ({
  isOpen,
  onClose,
  onOpenKitchenDashboard,
  onOpenNewKot,
  filterServiceType = 'All',
  titleOverride
}) => {
  const [kots, setKots] = useState<PmsKotRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Unprinted' | 'Ready To Serve' | 'Cleared' | 'Cancelled'>('All');
  const [selectedKotForPrint, setSelectedKotForPrint] = useState<PmsKotRecord | null>(null);
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

  const handlePrintIndividual = (kot: PmsKotRecord) => {
    PmsStore.markKotAsPrinted(kot.kotNo);
    loadKots();
    setSelectedKotForPrint(kot);
  };

  const handlePrintAllUnprinted = () => {
    PmsStore.markAllKotsAsPrinted(filterServiceType === 'All' ? undefined : filterServiceType);
    loadKots();
    alert('All Unprinted KOTs dispatched to Central Thermal Printer & marked as Printed!');
  };

  const filteredKots = kots.filter(k => {
    if (filterServiceType !== 'All' && k.serviceType !== filterServiceType) {
      return false;
    }

    const matchesSearch =
      k.kotNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.tableNo && k.tableNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      k.roomNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.guestName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Unprinted'
        ? k.isPrinted === false
        : statusFilter === 'Ready To Serve'
        ? k.status === 'Ready To Serve' || k.serveStatus === 'Ready To Serve'
        : statusFilter === 'Cleared'
        ? k.status === 'Billed' || k.status === 'Served'
        : statusFilter === 'Cancelled'
        ? k.status === 'Cancelled'
        : true;

    return matchesSearch && matchesStatus;
  });

  const unprintedCount = kots.filter(
    k => (filterServiceType === 'All' || k.serviceType === filterServiceType) && k.isPrinted === false && k.status !== 'Cancelled'
  ).length;

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div
        className="pms-form-box"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 1100, width: '96%', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Banner matching Video 14 Frame 0260 demo.datahouseerp.com/kots */}
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
            <span style={{ fontSize: 20 }}>📋</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#ffffff', letterSpacing: 0.5 }}>
              {titleOverride || 'KOT Register & Mobile Order Tracking (Video 14 Frame 0260)'}
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
          {/* Action Buttons Row matching Video 14 Frame 0260 */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
              background: '#f8fafc',
              padding: 12,
              borderRadius: 6,
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {/* 1. New KOT (Green) */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenNewKot) onOpenNewKot();
                }}
                style={{
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '7px 16px',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                New KOT
              </button>

              {/* 2. Cleared KOT List (Blue) */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'Cleared' ? 'All' : 'Cleared')}
                style={{
                  background: statusFilter === 'Cleared' ? '#0369a1' : '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '7px 16px',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Cleared KOT List
              </button>

              {/* 3. Kitchen Dashboard (Yellow) */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenKitchenDashboard) onOpenKitchenDashboard();
                }}
                style={{
                  background: '#eab308',
                  color: '#0f172a',
                  border: 'none',
                  padding: '7px 16px',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Kitchen Dashboard
              </button>

              {/* Filter: All / Unprinted Only */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'Unprinted' ? 'All' : 'Unprinted')}
                style={{
                  background: statusFilter === 'Unprinted' ? '#dc2626' : '#f1f5f9',
                  color: statusFilter === 'Unprinted' ? '#ffffff' : '#475569',
                  border: '1px solid #cbd5e1',
                  padding: '7px 14px',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                {statusFilter === 'Unprinted' ? 'Show All KOTs' : 'Filter Unprinted Only'}
              </button>
            </div>

            {/* Print All Unprinted Batch Button (Video 14 Core Feature) */}
            {unprintedCount > 0 && (
              <button
                type="button"
                onClick={handlePrintAllUnprinted}
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: 4,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 4px rgba(5,150,105,0.3)',
                  animation: 'pulse 2s infinite'
                }}
              >
                🖨️ Print All Unprinted ({unprintedCount})
              </button>
            )}
          </div>

          {/* Table Controls (Entries per page & Search) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              fontSize: 13,
              color: '#334155'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select
                value={entriesPerPage}
                onChange={e => setEntriesPerPage(Number(e.target.value))}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #cbd5e1',
                  fontSize: 13
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries per page</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Search:</span>
              <input
                type="text"
                placeholder="Search KOT, Room, Table, Guest..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  width: 220
                }}
              />
            </div>
          </div>

          {/* Register Table matching Video 14 Frame 0260 */}
          <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: 4 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: 50, borderRight: '1px solid #e2e8f0' }}>S.No</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: 90, borderRight: '1px solid #e2e8f0' }}>Date</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', width: 140, borderRight: '1px solid #e2e8f0' }}>KOT No</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: 90, borderRight: '1px solid #e2e8f0' }}>Service On</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: 80, borderRight: '1px solid #e2e8f0' }}>Total Qty</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', width: 100, borderRight: '1px solid #e2e8f0' }}>Total Amount</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', width: 110, borderRight: '1px solid #e2e8f0' }}>Serve Status</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: 80, borderRight: '1px solid #e2e8f0' }}>Status</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', width: 140 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredKots.slice(0, entriesPerPage).map((kot, idx) => {
                  const isUnprinted = kot.isPrinted === false && kot.status !== 'Cancelled';
                  const isCancelled = kot.status === 'Cancelled';
                  
                  // Frame 0260: Unprinted rows are vibrant green (#22c55e)!
                  const rowBg = isUnprinted
                    ? '#22c55e'
                    : isCancelled
                    ? '#fee2e2'
                    : idx % 2 === 0
                    ? '#ffffff'
                    : '#f8fafc';

                  const textColor = isUnprinted ? '#ffffff' : isCancelled ? '#991b1b' : '#0f172a';

                  const serveStatusText = isUnprinted
                    ? 'Unprinted'
                    : kot.status === 'Ready To Serve' || kot.serveStatus === 'Ready To Serve'
                    ? 'Ready To Serve'
                    : kot.serveStatus === 'Served'
                    ? 'Served'
                    : '0';

                  const serviceOnDisplay = kot.serviceType === 'Restaurant'
                    ? (kot.tableNo || kot.roomNo)
                    : kot.roomNo || '101';

                  return (
                    <tr
                      key={kot.kotNo + idx}
                      style={{
                        background: rowBg,
                        color: textColor,
                        borderBottom: '1px solid #cbd5e1',
                        fontWeight: isUnprinted ? 700 : 500,
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.1)' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.1)' }}>
                        {kot.date || '16-06-25'}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 800, borderRight: '1px solid rgba(0,0,0,0.1)' }}>
                        {kot.kotNo}
                        {kot.orderSource === 'Mobile' && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              background: isUnprinted ? '#ffffff' : '#dbeafe',
                              color: isUnprinted ? '#15803d' : '#1e40af',
                              padding: '1px 5px',
                              borderRadius: 3,
                              fontWeight: 700
                            }}
                          >
                            📱 Mobile
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, borderRight: '1px solid rgba(0,0,0,0.1)' }}>
                        {serviceOnDisplay}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.1)' }}>
                        {(kot.totalQty || kot.items.reduce((sum, it) => sum + it.qty, 0)).toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, borderRight: '1px solid rgba(0,0,0,0.1)' }}>
                        {kot.totalAmount.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.1)' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 800,
                            background: isUnprinted
                              ? '#ffffff'
                              : serveStatusText === 'Ready To Serve'
                              ? '#dcfce7'
                              : '#f1f5f9',
                            color: isUnprinted
                              ? '#15803d'
                              : serveStatusText === 'Ready To Serve'
                              ? '#166534'
                              : '#475569'
                          }}
                        >
                          {serveStatusText}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid rgba(0,0,0,0.1)' }}>
                        {isCancelled ? 'cancel' : '0'}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                          {/* 1. Print Icon Button matching Frame 0260 (Green circular printer) */}
                          <button
                            type="button"
                            title="Print KOT Slip (Marks as Printed)"
                            onClick={() => handlePrintIndividual(kot)}
                            style={{
                              background: isUnprinted ? '#ffffff' : '#3b82f6',
                              color: isUnprinted ? '#16a34a' : '#ffffff',
                              border: isUnprinted ? '1px solid #16a34a' : 'none',
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                          >
                            🖨️
                          </button>

                          {/* 2. View Icon Button matching Frame 0260 (Purple circular eye) */}
                          <button
                            type="button"
                            title="View KOT Slip"
                            onClick={() => setSelectedKotForPrint(kot)}
                            style={{
                              background: '#7c3aed',
                              color: '#ffffff',
                              border: 'none',
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                          >
                            👁️
                          </button>

                          {/* 3. Edit Icon Button */}
                          <button
                            type="button"
                            title="Edit / Re-order KOT"
                            onClick={() => {
                              if (onOpenNewKot) {
                                onClose();
                                onOpenNewKot();
                              } else {
                                setSelectedKotForPrint(kot);
                              }
                            }}
                            style={{
                              background: '#0ea5e9',
                              color: '#ffffff',
                              border: 'none',
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                          >
                            ✏️
                          </button>

                          {/* 4. Cancel / Delete Icon Button matching Frame 0260 (Red trash) */}
                          {!isCancelled && (
                            <button
                              type="button"
                              title="Cancel KOT"
                              onClick={() => setSelectedKotForCancel(kot.kotNo)}
                              style={{
                                background: '#ef4444',
                                color: '#ffffff',
                                border: 'none',
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                              }}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer info matching Frame 0260 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 12,
              fontSize: 13,
              color: '#64748b'
            }}
          >
            <div>
              Showing 1 to {Math.min(filteredKots.length, entriesPerPage)} of {filteredKots.length} entries
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                disabled
                style={{ padding: '3px 8px', border: '1px solid #cbd5e1', background: '#f1f5f9', cursor: 'not-allowed' }}
              >
                «
              </button>
              <button
                type="button"
                style={{ padding: '3px 8px', border: '1px solid #0284c7', background: '#0284c7', color: '#fff', fontWeight: 700 }}
              >
                1
              </button>
              <button
                type="button"
                disabled
                style={{ padding: '3px 8px', border: '1px solid #cbd5e1', background: '#f1f5f9', cursor: 'not-allowed' }}
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KOT Print View Modal matching Frame 0275 */}
      <KotPrintViewModal
        isOpen={!!selectedKotForPrint}
        kot={selectedKotForPrint}
        onClose={() => setSelectedKotForPrint(null)}
        onPrinted={() => {
          loadKots();
        }}
      />

      {/* Cancel KOT Modal matching Frame 0290 */}
      <CancelKotModal
        isOpen={!!selectedKotForCancel}
        kotNo={selectedKotForCancel || ''}
        onClose={() => setSelectedKotForCancel(null)}
        onCancelSuccess={() => {
          loadKots();
          setSelectedKotForCancel(null);
        }}
      />
    </div>
  );
};
