import React, { useState, useEffect } from 'react';
import type { PmsKotRecord } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';

interface KitchenDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewKot?: () => void;
}

export const KitchenDashboardModal: React.FC<KitchenDashboardModalProps> = ({
  isOpen,
  onClose,
  onOpenNewKot
}) => {
  const [kots, setKots] = useState<PmsKotRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'ready' | 'served' | 'unprinted'>('pending');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [nowTime, setNowTime] = useState(Date.now());
  const [selectedKotForPrint, setSelectedKotForPrint] = useState<PmsKotRecord | null>(null);

  // KOT Anti-Pilferage & Void Modal State
  const [voidTargetKot, setVoidTargetKot] = useState<PmsKotRecord | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [voidReason, setVoidReason] = useState<string>('Guest Changed Mind');
  const [foodStatus, setFoodStatus] = useState<'Unprepared' | 'Prepared/Wasted'>('Unprepared');
  const [voidManagerPin, setVoidManagerPin] = useState<string>('Restaurant Mgr');
  const [showAuditLogModal, setShowAuditLogModal] = useState<boolean>(false);

  const refreshKots = () => {
    setKots(PmsStore.getKots());
    setNowTime(Date.now());
    setCountdown(30);
  };

  const handleConfirmVoid = () => {
    if (!voidTargetKot) return;
    const item = voidTargetKot.items[selectedItemIndex];
    if (!item) return;
    const ok = PmsStore.voidKotItem(
      voidTargetKot.kotNo,
      item.itemCode || item.itemName,
      voidReason,
      foodStatus,
      voidManagerPin
    );
    if (ok) {
      alert(`Item successfully voided from KOT ${voidTargetKot.kotNo} and logged to Anti-Pilferage Audit Report!`);
      setVoidTargetKot(null);
      refreshKots();
    } else {
      alert('Unable to void item: KOT not found or invalid item.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshKots();
    }
  }, [isOpen]);

  // Live timer tick every second for real-time order timers & 30s auto-refresh (Video 12 [08:15])
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setNowTime(Date.now());
      setCountdown(prev => {
        if (prev <= 1) {
          if (autoRefresh) {
            setKots(PmsStore.getKots());
          }
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  if (!isOpen) return null;

  // Format elapsed time: (0h 51m 15s) matching Video 12 Frame 0225
  const getElapsedTimeString = (createdAt: string): { text: string; totalMinutes: number } => {
    const created = new Date(createdAt).getTime();
    const diffMs = Math.max(0, nowTime - created);
    const totalSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return {
      text: `${hours}h ${mins}m ${secs}s`,
      totalMinutes: Math.floor(totalSecs / 60)
    };
  };

  const handleStartPrep = (kotNo: string) => {
    PmsStore.updateKotStatus(kotNo, 'Cooking');
    refreshKots();
  };

  const handleReadyToServe = (kotNo: string) => {
    PmsStore.updateKotStatus(kotNo, 'Ready To Serve');
    refreshKots();
  };

  const handleServeAndPrint = (kot: PmsKotRecord) => {
    PmsStore.updateKotStatus(kot.kotNo, 'Served');
    PmsStore.markKotAsPrinted(kot.kotNo);
    setSelectedKotForPrint(kot);
    refreshKots();
  };

  const handlePrintOnly = (kot: PmsKotRecord) => {
    PmsStore.markKotAsPrinted(kot.kotNo);
    setSelectedKotForPrint(kot);
    refreshKots();
  };

  const filteredKots = kots.filter(k => {
    if (activeFilter === 'unprinted') {
      return k.isPrinted === false && k.status !== 'Cancelled';
    }
    if (activeFilter === 'pending') {
      return k.status === 'Pending' || k.status === 'Cooking';
    }
    if (activeFilter === 'ready') {
      return k.status === 'Ready To Serve';
    }
    if (activeFilter === 'served') {
      return k.status === 'Served' || k.status === 'Billed';
    }
    return k.status !== 'Cancelled';
  });

  const pendingCount = kots.filter(k => k.status === 'Pending' || k.status === 'Cooking').length;
  const readyCount = kots.filter(k => k.status === 'Ready To Serve').length;
  const servedCount = kots.filter(k => k.status === 'Served' || k.status === 'Billed').length;
  const unprintedCount = kots.filter(k => k.isPrinted === false && k.status !== 'Cancelled').length;

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div
        className="pms-form-box"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 1180, width: '96%', maxHeight: '94vh', overflowY: 'auto' }}
      >
        {/* Header Banner matching RoomG KDS */}
        <div
          className="pms-form-banner"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            borderBottom: '3px solid #eab308'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🍳</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#ffffff', letterSpacing: 0.5 }}>
                KITCHEN DISPLAY SYSTEM (KDS) &bull; LIVE KOT DASHBOARD
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Android TV &amp; Kitchen Touch Terminal Mode
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* 30s Auto Refresh Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#334155',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                color: '#f8fafc'
              }}
            >
              <input
                type="checkbox"
                id="kdsAutoRefresh"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
              />
              <label htmlFor="kdsAutoRefresh" style={{ cursor: 'pointer' }}>
                Auto-Refresh in <strong>{countdown}s</strong>
              </label>
              <button
                type="button"
                onClick={refreshKots}
                style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: 12 }}
                title="Refresh Now"
              >
                🔄
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Status Filter & Action Bar */}
        <div
          style={{
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '10px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setActiveFilter('pending')}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                border: 'none',
                background: activeFilter === 'pending' ? '#ef4444' : '#e2e8f0',
                color: activeFilter === 'pending' ? '#ffffff' : '#334155',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>🔥 Cooking / In-Progress</span>
              <span style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: 10, fontSize: 10 }}>
                {pendingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('ready')}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                border: 'none',
                background: activeFilter === 'ready' ? '#16a34a' : '#e2e8f0',
                color: activeFilter === 'ready' ? '#ffffff' : '#334155',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>✅ Ready To Serve</span>
              <span style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: 10, fontSize: 10 }}>
                {readyCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('served')}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                border: 'none',
                background: activeFilter === 'served' ? '#0284c7' : '#e2e8f0',
                color: activeFilter === 'served' ? '#ffffff' : '#334155',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              <span>Served / History ({servedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                border: 'none',
                background: activeFilter === 'all' ? '#64748b' : '#e2e8f0',
                color: activeFilter === 'all' ? '#ffffff' : '#334155',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              <span>All Tickets</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAuditLogModal(true)}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                border: 'none',
                background: '#475569',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>📋 Void Audit Log ({PmsStore.getKotVoidAuditLogs().length})</span>
            </button>

            {unprintedCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter('unprinted')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 4,
                  border: 'none',
                  background: activeFilter === 'unprinted' ? '#dc2626' : '#fee2e2',
                  color: activeFilter === 'unprinted' ? '#ffffff' : '#b91c1c',
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>📱 Unprinted Mobile</span>
                <span style={{ background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: 10, fontSize: 10 }}>
                  {unprintedCount}
                </span>
              </button>
            )}

            {unprintedCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  PmsStore.markAllKotsAsPrinted();
                  refreshKots();
                  alert(`All ${unprintedCount} unprinted KOTs dispatched to Kitchen Thermal Printer!`);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 4,
                  border: 'none',
                  background: '#059669',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>🖨️ Print All Unprinted ({unprintedCount})</span>
              </button>
            )}
          </div>

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
                padding: '6px 14px',
                borderRadius: 4,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>➕</span>
              <span>Create New KOT</span>
            </button>
          )}
        </div>

        {/* Live KOT Cards Grid matching Video 12 Frame 0225 */}
        <div style={{ padding: 20 }}>
          {filteredKots.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '50px 20px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '2px dashed #cbd5e1',
                color: '#64748b'
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 10 }}>👨‍🍳✨</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#334155' }}>
                All clear! No pending orders in this view.
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                New orders placed from Room Service or Dining Tables will appear here live.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 16
              }}
            >
              {filteredKots.map(kot => {
                const { text: elapsedText, totalMinutes } = getElapsedTimeString(kot.createdAt);
                const isUrgent = totalMinutes >= 30;
                const isMedium = totalMinutes >= 15 && totalMinutes < 30;
                const headerBg = isUrgent
                  ? '#fee2e2'
                  : isMedium
                  ? '#fef3c7'
                  : '#f1f5f9';
                const headerTextColor = isUrgent
                  ? '#b91c1c'
                  : isMedium
                  ? '#b45309'
                  : '#0f172a';

                return (
                  <div
                    key={kot.kotNo}
                    style={{
                      background: '#ffffff',
                      border: isUrgent ? '2px solid #ef4444' : '1px solid #cbd5e1',
                      borderRadius: 6,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Top Header line matching Frame 0225: Kot No: 365, (0h 51m 15s) */}
                    <div
                      style={{
                        background: headerBg,
                        color: headerTextColor,
                        padding: '8px 10px',
                        borderBottom: '1px solid #cbd5e1',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontWeight: 900, fontSize: 13 }}>
                        Kot No: {kot.kotNo}
                      </span>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        ⏱️ ({elapsedText})
                      </span>
                    </div>

                    {/* Video 14: Mobile Unprinted KOT indicator on Kitchen card */}
                    {kot.isPrinted === false && (
                      <div
                        style={{
                          background: '#22c55e',
                          color: '#ffffff',
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 800,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '1px solid #16a34a'
                        }}
                      >
                        <span>📱 Unprinted Mobile Order</span>
                        <button
                          type="button"
                          onClick={() => handlePrintOnly(kot)}
                          style={{
                            background: '#ffffff',
                            color: '#15803d',
                            border: 'none',
                            borderRadius: 3,
                            padding: '2px 8px',
                            fontWeight: 800,
                            fontSize: 11,
                            cursor: 'pointer'
                          }}
                        >
                          🖨️ Print Slip
                        </button>
                      </div>
                    )}

                    {/* Room/Table Metadata line matching Frame 0225:
                        Room No:203|| Total Qty:2.00|| Remark: || Waiter: DEMO0004||Total Qty:2.00 */}
                    <div
                      style={{
                        padding: '6px 10px',
                        fontSize: 10,
                        background: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        color: '#334155',
                        lineHeight: 1.5
                      }}
                    >
                      <div>
                        <strong>{kot.tableNo ? `Table: ${kot.tableNo}` : `Room No: ${kot.roomNo}`}</strong>
                        {' || '}
                        Total Qty: {kot.totalQty || kot.items.reduce((a, b) => a + b.qty, 0)}.00
                      </div>
                      <div>
                        {kot.kotRemark ? `Remark: ${kot.kotRemark} || ` : ''}
                        Waiter: {kot.waiterName || 'DEMO0004'}
                      </div>
                    </div>

                    {/* Items Table matching Frame 0225 */}
                    <div style={{ flex: 1, padding: '4px 10px', minHeight: 90 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                            <th style={{ textAlign: 'left', padding: '4px 0', fontWeight: 800 }}>Item Name</th>
                            <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 800, width: 45 }}>QTY</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kot.items.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px dashed #f1f5f9' }}>
                              <td style={{ padding: '4px 0', fontWeight: 700, color: '#0f172a' }}>
                                {item.itemName}
                              </td>
                              <td style={{ textAlign: 'right', padding: '4px 0', fontWeight: 800, color: '#0284c7' }}>
                                {item.qty}.00
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Action Buttons: Start Prep -> Mark Food Ready -> Served */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: kot.status === 'Ready To Serve' || kot.status === 'Served' ? '1fr' : '1fr 1fr',
                        gap: 6,
                        padding: '8px 10px',
                        background: '#f8fafc',
                        borderTop: '1px solid #e2e8f0'
                      }}
                    >
                      {kot.status === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => handleStartPrep(kot.kotNo)}
                          style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            padding: '7px 4px',
                            borderRadius: 4,
                            fontWeight: 800,
                            fontSize: 11,
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          👨‍🍳 Start Prep
                        </button>
                      )}

                      {kot.status === 'Cooking' && (
                        <div
                          style={{
                            background: '#e0f2fe',
                            color: '#0369a1',
                            padding: '6px 4px',
                            borderRadius: 4,
                            fontWeight: 800,
                            fontSize: 10,
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          🔥 Prep in Progress
                        </div>
                      )}

                      {(kot.status === 'Pending' || kot.status === 'Cooking') && (
                        <button
                          type="button"
                          onClick={() => handleReadyToServe(kot.kotNo)}
                          style={{
                            background: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            padding: '7px 4px',
                            borderRadius: 4,
                            fontWeight: 800,
                            fontSize: 11,
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          ✓ Mark Food Ready
                        </button>
                      )}

                      {kot.status === 'Ready To Serve' && (
                        <button
                          type="button"
                          onClick={() => handleServeAndPrint(kot)}
                          style={{
                            background: '#eab308',
                            color: '#0f172a',
                            border: 'none',
                            padding: '8px 4px',
                            borderRadius: 4,
                            fontWeight: 900,
                            fontSize: 12,
                            cursor: 'pointer',
                            textAlign: 'center',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                          }}
                        >
                          🍽️ Food Ready &bull; Click to Mark Served &amp; Print
                        </button>
                      )}

                      {kot.status === 'Served' && (
                        <div
                          style={{
                            background: '#f1f5f9',
                            color: '#64748b',
                            padding: '6px 4px',
                            borderRadius: 4,
                            fontWeight: 800,
                            fontSize: 11,
                            textAlign: 'center'
                          }}
                        >
                          ✓ Order Served &amp; Fulfilled
                        </div>
                      )}
                    </div>

                    {/* Anti-Pilferage Lock: Void Item Action */}
                    {kot.status !== 'Served' && kot.status !== 'Billed' && kot.status !== 'Cancelled' && (
                      <div style={{ padding: '0 10px 8px 10px', background: '#f8fafc' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setVoidTargetKot(kot);
                            setSelectedItemIndex(0);
                            setVoidReason('Guest Changed Mind');
                            setFoodStatus('Unprepared');
                          }}
                          style={{
                            width: '100%',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            padding: '4px 6px',
                            borderRadius: 3,
                            fontWeight: 700,
                            fontSize: 10,
                            cursor: 'pointer'
                          }}
                        >
                          🚫 Void Item (Anti-Pilferage Lock)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Print Slip Dialog matching Video 12 Frame 0151 */}
        {selectedKotForPrint && (
          <div className="pms-submodal-overlay" onClick={() => setSelectedKotForPrint(null)}>
            <div
              className="pms-form-box"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 440, padding: 0, overflow: 'hidden', background: '#ffffff' }}
            >
              {/* Slip Header matching Frame 0151 (Yellow Header) */}
              <div
                style={{
                  background: '#fef08a',
                  padding: '12px 16px',
                  textAlign: 'center',
                  borderBottom: '2px solid #000'
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2, color: '#000' }}>
                  KOT
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginTop: 2 }}>
                  HOTEL SAI VASUDEV RESIDENCY
                </div>
              </div>

              {/* Guest / Table Detail (Green & Yellow side by side Frame 0151) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #000', fontSize: 11 }}>
                <div style={{ background: '#bbf7d0', padding: 10, borderRight: '1px solid #000' }}>
                  <div style={{ fontWeight: 700, color: '#166534' }}>Guest Detail</div>
                  <div style={{ fontSize: 12, fontWeight: 800, marginTop: 4 }}>
                    {selectedKotForPrint.tableNo ? `Table: ${selectedKotForPrint.tableNo}` : `Room: ${selectedKotForPrint.roomNo}`}
                  </div>
                  <div style={{ color: '#334155' }}>{selectedKotForPrint.guestName}</div>
                </div>

                <div style={{ background: '#fef08a', padding: 10 }}>
                  <div><strong>Kot No:</strong> {selectedKotForPrint.kotNo}</div>
                  <div><strong>Date:</strong> {selectedKotForPrint.date || new Date().toISOString().split('T')[0]}</div>
                  <div><strong>Time:</strong> {new Date(selectedKotForPrint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div><strong>Waiter:</strong> {selectedKotForPrint.waiterName || 'DEMO0004'}</div>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ padding: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <th style={{ padding: '4px 2px', width: 25 }}>S.no</th>
                      <th style={{ padding: '4px 6px' }}>Item Name</th>
                      <th style={{ padding: '4px 6px', textAlign: 'center', width: 40 }}>Qty</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right', width: 55 }}>Rate</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right', width: 60 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedKotForPrint.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px dashed #cbd5e1' }}>
                        <td style={{ padding: '4px 2px' }}>{idx + 1}</td>
                        <td style={{ padding: '4px 6px', fontWeight: 700 }}>{item.itemName}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center' }}>{item.qty}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{item.rate.toFixed(1)}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>₹{item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div
                  style={{
                    borderTop: '1px solid #000',
                    marginTop: 8,
                    paddingTop: 6,
                    textAlign: 'right',
                    fontSize: 12,
                    fontWeight: 800
                  }}
                >
                  Total Item QTY={selectedKotForPrint.items.reduce((a, b) => a + b.qty, 0).toFixed(2)} Total Amount =₹{selectedKotForPrint.totalAmount.toFixed(2)}
                </div>
              </div>

              {/* Slip Buttons matching Frame 0151: [Print] & [Restaurant] */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: 12, background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    setSelectedKotForPrint(null);
                  }}
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 24px',
                    borderRadius: 4,
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  Print 🖨️
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedKotForPrint(null)}
                  style={{
                    background: '#06b6d4',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: 4,
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  Restaurant
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Void Item Modal (Anti-Pilferage Lock) */}
        {voidTargetKot && (
          <div className="pms-submodal-overlay" onClick={() => setVoidTargetKot(null)} style={{ zIndex: 12500 }}>
            <div
              className="pms-form-box"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 480, padding: '16px 20px', background: '#ffffff', borderRadius: 8 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '2px solid #ef4444', paddingBottom: 8 }}>
                <div style={{ fontWeight: 900, color: '#b91c1c', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🚫</span>
                  <span>Void Item &bull; Anti-Pilferage Lock</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVoidTargetKot(null)}
                  style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b' }}
                >
                  &times;
                </button>
              </div>

              <div style={{ fontSize: 12, color: '#475569', marginBottom: 12, background: '#fef2f2', padding: 8, borderRadius: 4, border: '1px solid #fecdd3' }}>
                <strong>Strict Internal Audit Rule:</strong> Fired kitchen items cannot be silently removed. Voiding requires a documented reason, food waste status, and authorizing manager credential for statutory anti-fraud compliance.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label className="form-label-pms" style={{ fontWeight: 800 }}>KOT Number</label>
                  <input type="text" readOnly value={`${voidTargetKot.kotNo} (${voidTargetKot.tableNo ? voidTargetKot.tableNo : `Room ${voidTargetKot.roomNo}`})`} className="form-input-pms" style={{ background: '#f1f5f9', fontWeight: 700 }} />
                </div>

                <div>
                  <label className="form-label-pms" style={{ fontWeight: 800 }}><span className="req">*</span> Select Item to Void</label>
                  <select
                    value={selectedItemIndex}
                    onChange={e => setSelectedItemIndex(Number(e.target.value))}
                    className="form-select-pms"
                    style={{ fontWeight: 700 }}
                  >
                    {voidTargetKot.items.map((item, idx) => (
                      <option key={idx} value={idx}>
                        {item.itemName} &bull; Qty: {item.qty} &bull; ₹{item.amount.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="form-label-pms" style={{ fontWeight: 800 }}><span className="req">*</span> Void Reason</label>
                    <select
                      value={voidReason}
                      onChange={e => setVoidReason(e.target.value)}
                      className="form-select-pms"
                      style={{ fontWeight: 600 }}
                    >
                      <option value="Guest Changed Mind">Guest Changed Mind</option>
                      <option value="Kitchen Out of Stock">Kitchen Out of Stock</option>
                      <option value="Wrong Order Entry">Wrong Order Entry</option>
                      <option value="Excessive Wait Time">Excessive Wait Time</option>
                      <option value="Quality Concern">Quality Concern</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label-pms" style={{ fontWeight: 800 }}><span className="req">*</span> Food Waste Status</label>
                    <select
                      value={foodStatus}
                      onChange={e => setFoodStatus(e.target.value as any)}
                      className="form-select-pms"
                      style={{ fontWeight: 600 }}
                    >
                      <option value="Unprepared">Unprepared (Zero Waste)</option>
                      <option value="Prepared/Wasted">Prepared (Wasted Food Cost)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label-pms" style={{ fontWeight: 800 }}><span className="req">*</span> Authorizing Manager PIN / Name</label>
                  <input
                    type="text"
                    value={voidManagerPin}
                    onChange={e => setVoidManagerPin(e.target.value)}
                    className="form-input-pms"
                    placeholder="e.g. GM / Restaurant Lead"
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setVoidTargetKot(null)}
                    style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '7px 16px', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmVoid}
                    style={{ background: '#b91c1c', color: '#ffffff', border: 'none', padding: '7px 20px', borderRadius: 4, fontWeight: 800, cursor: 'pointer' }}
                  >
                    Confirm Void &amp; Log Audit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Anti-Pilferage Audit Log Report Dialog */}
        {showAuditLogModal && (
          <div className="pms-submodal-overlay" onClick={() => setShowAuditLogModal(false)} style={{ zIndex: 12500 }}>
            <div
              className="pms-form-box"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: 840, padding: 0, overflow: 'hidden', background: '#ffffff', borderRadius: 8 }}
            >
              <div style={{ background: '#0f172a', color: '#ffffff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📋</span>
                  <span>KOT Anti-Pilferage &amp; Void Audit Register</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAuditLogModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
                  Immutable audit trail of all voided food items, waste classifications, and supervisor authorizations.
                </div>

                {PmsStore.getKotVoidAuditLogs().length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontStyle: 'italic' }}>
                    No voided items recorded. Restaurant kitchen operates with 100% item integrity!
                  </div>
                ) : (
                  <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '2px solid #cbd5e1' }}>
                          <th style={{ padding: '6px 8px' }}>Timestamp</th>
                          <th style={{ padding: '6px 8px' }}>KOT #</th>
                          <th style={{ padding: '6px 8px' }}>Room / Table</th>
                          <th style={{ padding: '6px 8px' }}>Voided Item</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>Amount</th>
                          <th style={{ padding: '6px 8px' }}>Reason</th>
                          <th style={{ padding: '6px 8px' }}>Food Waste</th>
                          <th style={{ padding: '6px 8px' }}>Voided By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {PmsStore.getKotVoidAuditLogs().map(log => (
                          <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '6px 8px', color: '#64748b' }}>{new Date(log.voidedAt).toLocaleString()}</td>
                            <td style={{ padding: '6px 8px', fontWeight: 700 }}>{log.kotNo}</td>
                            <td style={{ padding: '6px 8px' }}>{log.kotNo}</td>
                            <td style={{ padding: '6px 8px', fontWeight: 700, color: '#0f172a' }}>{log.itemName} (x{log.qty})</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: '#b91c1c' }}>₹{log.amount.toFixed(2)}</td>
                            <td style={{ padding: '6px 8px' }}>{log.voidReason}</td>
                            <td style={{ padding: '6px 8px' }}>
                              <span style={{
                                background: log.foodStatus === 'Prepared/Wasted' ? '#fee2e2' : '#f0fdf4',
                                color: log.foodStatus === 'Prepared/Wasted' ? '#b91c1c' : '#166534',
                                padding: '1px 6px',
                                borderRadius: 3,
                                fontSize: 10,
                                fontWeight: 700
                              }}>
                                {log.foodStatus === 'Prepared/Wasted' ? 'Wasted Food' : 'Unprepared'}
                              </span>
                            </td>
                            <td style={{ padding: '6px 8px', fontWeight: 600 }}>{log.voidedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setShowAuditLogModal(false)}
                    style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
