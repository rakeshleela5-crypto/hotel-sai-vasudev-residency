import React, { useState, useEffect } from 'react';
import type { PmsRoom, PmsRoomShiftRecord, PmsKotRecord } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';

interface RoomShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFromRoomNo?: string;
  onShiftCompleted: (record: PmsRoomShiftRecord) => void;
}

export const RoomShiftModal: React.FC<RoomShiftModalProps> = ({
  isOpen,
  onClose,
  initialFromRoomNo,
  onShiftCompleted
}) => {
  const [activeTab, setActiveTab] = useState<'shift' | 'history'>('shift');
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [fromRoomNo, setFromRoomNo] = useState<string>('');
  const [toRoomNo, setToRoomNo] = useState<string>('');
  const [tariffOption, setTariffOption] = useState<'keep' | 'new' | 'custom'>('new');
  const [customTariff, setCustomTariff] = useState<number>(2000);
  const [reason, setReason] = useState<string>('Guest Preference / Upgrade');
  const [customReason, setCustomReason] = useState<string>('');
  const [transferKots, setTransferKots] = useState<boolean>(true);
  const [pendingKots, setPendingKots] = useState<PmsKotRecord[]>([]);
  const [shiftHistory, setShiftHistory] = useState<PmsRoomShiftRecord[]>([]);
  const [searchHistory, setSearchHistory] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const allRooms = PmsStore.getRooms();
      setRooms(allRooms);
      setShiftHistory(PmsStore.getRoomShifts());

      const occupied = allRooms.filter(r => r.status === 'occupied');
      const targetFrom = (initialFromRoomNo && occupied.some(r => r.roomNo === initialFromRoomNo))
        ? initialFromRoomNo
        : (occupied[0]?.roomNo || '');
      setFromRoomNo(targetFrom);

      const vacant = allRooms.filter(r => r.status === 'vacant');
      const targetTo = vacant[0]?.roomNo || '';
      setToRoomNo(targetTo);

      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, initialFromRoomNo]);

  useEffect(() => {
    if (fromRoomNo) {
      const kots = PmsStore.getPendingKotsByRoom(fromRoomNo);
      setPendingKots(kots);
    } else {
      setPendingKots([]);
    }
  }, [fromRoomNo]);

  const selectedFromRoom = rooms.find(r => r.roomNo === fromRoomNo);
  const selectedToRoom = rooms.find(r => r.roomNo === toRoomNo);

  useEffect(() => {
    if (selectedToRoom) {
      setCustomTariff(selectedToRoom.tariff);
    }
  }, [selectedToRoom]);

  if (!isOpen) return null;

  const occupiedRooms = rooms.filter(r => r.status === 'occupied');
  const vacantRooms = rooms.filter(r => r.status === 'vacant');

  const getEffectiveTariff = (): number => {
    if (tariffOption === 'keep' && selectedFromRoom) {
      return selectedFromRoom.tariff;
    }
    if (tariffOption === 'new' && selectedToRoom) {
      return selectedToRoom.tariff;
    }
    return customTariff || 0;
  };

  const handleShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fromRoomNo) {
      setErrorMsg('Please select an occupied room to shift from.');
      return;
    }
    if (!toRoomNo) {
      setErrorMsg('Please select a vacant room to shift into.');
      return;
    }
    if (fromRoomNo === toRoomNo) {
      setErrorMsg('Source room and destination room cannot be the same.');
      return;
    }

    const finalReason = reason === 'Other' ? (customReason.trim() || 'Other') : reason;
    const finalTariff = getEffectiveTariff();

    const res = PmsStore.shiftRoom({
      fromRoomNo,
      toRoomNo,
      newTariff: finalTariff,
      reason: finalReason,
      transferKots,
      shiftedBy: 'Reception Desk (Admin)'
    });

    if (res.success && res.record) {
      setSuccessMsg(res.message);
      setShiftHistory(PmsStore.getRoomShifts());
      setRooms(PmsStore.getRooms());
      onShiftCompleted(res.record);
      setTimeout(() => {
        onClose();
      }, 1400);
    } else {
      setErrorMsg(res.message || 'Failed to shift room.');
    }
  };

  const filteredHistory = shiftHistory.filter(h =>
    h.guestName.toLowerCase().includes(searchHistory.toLowerCase()) ||
    h.fromRoomNo.toLowerCase().includes(searchHistory.toLowerCase()) ||
    h.toRoomNo.toLowerCase().includes(searchHistory.toLowerCase()) ||
    h.shiftNo.toLowerCase().includes(searchHistory.toLowerCase())
  );

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div 
        className="pms-form-box" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 860, width: '95%', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Banner matching Video 11 */}
        <div 
          className="pms-form-banner" 
          style={{ 
            background: 'linear-gradient(135deg, #1e3a8a 0%, #0369a1 100%)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '10px 16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🔄</span>
            <span style={{ fontWeight: 800, letterSpacing: 0.8, fontSize: 15 }}>
              ROOM SHIFTING &bull; GUEST TRANSFER MANAGEMENT
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', padding: '6px 12px', gap: 8 }}>
          <button
            type="button"
            onClick={() => setActiveTab('shift')}
            style={{
              padding: '6px 16px',
              borderRadius: 4,
              border: 'none',
              background: activeTab === 'shift' ? '#0284c7' : '#e2e8f0',
              color: activeTab === 'shift' ? '#ffffff' : '#334155',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            🔄 New Room Shift
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '6px 16px',
              borderRadius: 4,
              border: 'none',
              background: activeTab === 'history' ? '#0284c7' : '#e2e8f0',
              color: activeTab === 'history' ? '#ffffff' : '#334155',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            📜 Shift History Register ({shiftHistory.length})
          </button>
        </div>

        {errorMsg && (
          <div style={{ margin: '12px 16px 0', padding: '8px 12px', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: 4, color: '#991b1b', fontSize: 12, fontWeight: 600 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ margin: '12px 16px 0', padding: '8px 12px', background: '#dcfce7', border: '1px solid #22c55e', borderRadius: 4, color: '#166534', fontSize: 12, fontWeight: 700 }}>
            ✅ {successMsg}
          </div>
        )}

        {activeTab === 'shift' ? (
          <form onSubmit={handleShiftSubmit} className="pms-form-body" style={{ padding: 16 }}>
            {/* Top comparison panels: From Room vs To Room */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              {/* SOURCE ROOM */}
              <div style={{ background: '#f8fafc', border: '2px solid #ef4444', borderRadius: 6, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>
                    SOURCE (FROM ROOM)
                  </span>
                  <span style={{ fontSize: 10, background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>
                    WILL BECOME DIRTY 🧹
                  </span>
                </div>

                <div className="form-group-pms" style={{ marginBottom: 8 }}>
                  <label className="form-label-pms" style={{ fontSize: 11 }}>Select Occupied Room *</label>
                  <select
                    value={fromRoomNo}
                    onChange={e => setFromRoomNo(e.target.value)}
                    className="form-select-pms"
                    style={{ fontWeight: 700, fontSize: 13, borderColor: '#ef4444' }}
                  >
                    {occupiedRooms.length === 0 ? (
                      <option value="">No occupied rooms currently</option>
                    ) : (
                      occupiedRooms.map(r => (
                        <option key={r.id} value={r.roomNo}>
                          Room {r.roomNo} &bull; {r.currentGuest?.name || 'Guest'} ({r.roomType})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {selectedFromRoom && (
                  <div style={{ fontSize: 11, background: '#ffffff', padding: 8, borderRadius: 4, border: '1px solid #e2e8f0', lineHeight: 1.6 }}>
                    <div><strong>Guest:</strong> {selectedFromRoom.currentGuest?.name || 'N/A'} ({selectedFromRoom.currentGuest?.phone || 'No Phone'})</div>
                    <div><strong>Check-In No:</strong> {selectedFromRoom.currentGuest?.bookingNo || 'N/A'}</div>
                    <div><strong>Category:</strong> {selectedFromRoom.roomType} &bull; <strong>Tariff:</strong> ₹{selectedFromRoom.tariff}/day</div>
                    <div><strong>Advance Paid:</strong> ₹{selectedFromRoom.currentGuest?.advancePaid || 0}</div>
                    {pendingKots.length > 0 && (
                      <div style={{ color: '#b45309', fontWeight: 700, marginTop: 4 }}>
                        🍴 {pendingKots.length} Pending KOT(s) (₹{pendingKots.reduce((a, b) => a + b.totalAmount, 0).toFixed(2)})
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ARROW ICON */}
              <div style={{ textAlign: 'center', fontSize: 24, color: '#0284c7', fontWeight: 900 }}>
                ➡️
              </div>

              {/* DESTINATION ROOM */}
              <div style={{ background: '#f8fafc', border: '2px solid #16a34a', borderRadius: 6, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>
                    DESTINATION (TO ROOM)
                  </span>
                  <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>
                    WILL BECOME OCCUPIED ✨
                  </span>
                </div>

                <div className="form-group-pms" style={{ marginBottom: 8 }}>
                  <label className="form-label-pms" style={{ fontSize: 11 }}>Select Vacant Room *</label>
                  <select
                    value={toRoomNo}
                    onChange={e => setToRoomNo(e.target.value)}
                    className="form-select-pms"
                    style={{ fontWeight: 700, fontSize: 13, borderColor: '#16a34a' }}
                  >
                    {vacantRooms.length === 0 ? (
                      <option value="">No vacant rooms available</option>
                    ) : (
                      vacantRooms.map(r => (
                        <option key={r.id} value={r.roomNo}>
                          Room {r.roomNo} &bull; {r.roomType} &bull; ₹{r.tariff}/day ({r.floor === 0 ? 'Ground Floor' : '1st Floor'})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {selectedToRoom && (
                  <div style={{ fontSize: 11, background: '#ffffff', padding: 8, borderRadius: 4, border: '1px solid #e2e8f0', lineHeight: 1.6 }}>
                    <div><strong>Category:</strong> {selectedToRoom.roomType}</div>
                    <div><strong>Standard Tariff:</strong> ₹{selectedToRoom.tariff}/day (Incl. GST)</div>
                    <div><strong>Floor:</strong> {selectedToRoom.floor === 0 ? 'Ground Floor' : '1st Floor'}</div>
                    <div><strong>Facilities:</strong> {selectedToRoom.facilities}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Room Grid Selector matching RoomG visual selector */}
            <div style={{ marginBottom: 14 }}>
              <label className="form-label-pms" style={{ fontSize: 11, marginBottom: 4 }}>
                Quick Click Vacant Room:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 90, overflowY: 'auto', padding: 4, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4 }}>
                {vacantRooms.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setToRoomNo(r.roomNo)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: toRoomNo === r.roomNo ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: toRoomNo === r.roomNo ? '#0284c7' : '#ffffff',
                      color: toRoomNo === r.roomNo ? '#ffffff' : '#0f172a',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {r.roomNo} ({r.roomType})
                  </button>
                ))}
              </div>
            </div>

            {/* Tariff Adjustment Rule - Video 11 [06:00] */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: 12, marginBottom: 14 }}>
              <label className="form-label-pms" style={{ color: '#1e40af', fontWeight: 800, fontSize: 12 }}>
                Per Day Room Tariff Policy (Category & Tariff Rule)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="tariffOpt"
                    checked={tariffOption === 'new'}
                    onChange={() => setTariffOption('new')}
                  />
                  <span>
                    Apply New Room Tariff (<strong>₹{selectedToRoom?.tariff || 0}</strong>)
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="tariffOpt"
                    checked={tariffOption === 'keep'}
                    onChange={() => setTariffOption('keep')}
                  />
                  <span>
                    Keep Original Room Tariff (<strong>₹{selectedFromRoom?.tariff || 0}</strong>)
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="tariffOpt"
                    checked={tariffOption === 'custom'}
                    onChange={() => setTariffOption('custom')}
                  />
                  <span>Custom Tariff:</span>
                  <input
                    type="number"
                    value={customTariff}
                    onChange={e => {
                      setCustomTariff(Number(e.target.value));
                      setTariffOption('custom');
                    }}
                    style={{ width: 85, padding: '2px 6px', fontSize: 12, border: '1px solid #94a3b8', borderRadius: 3 }}
                  />
                </label>
              </div>

              <div style={{ fontSize: 11, color: '#1d4ed8', marginTop: 6, fontWeight: 600 }}>
                &bull; Effective Tariff Applied: ₹{getEffectiveTariff().toFixed(2)}/day
              </div>
            </div>

            {/* Shifting Reason & Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div className="form-group-pms">
                <label className="form-label-pms">Reason for Shifting *</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="form-select-pms"
                >
                  <option value="Guest Preference / Upgrade">Guest Preference / Upgrade</option>
                  <option value="AC / Electrical Malfunction">AC / Electrical Malfunction</option>
                  <option value="Geyser / Plumbing Issue">Geyser / Plumbing Issue</option>
                  <option value="Floor / Accessibility Change">Floor / Accessibility Change</option>
                  <option value="Noise / Disturbance">Noise / Disturbance</option>
                  <option value="Other">Other Custom Reason</option>
                </select>
              </div>

              <div className="form-group-pms">
                <label className="form-label-pms">Remarks / Specific Note</label>
                <input
                  type="text"
                  placeholder="e.g. Guest shifted to Room 1 as requested"
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  className="form-input-pms"
                />
              </div>
            </div>

            {/* KOT & Housekeeping Options (Video 11 [06:45, 07:30]) */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <input
                  type="checkbox"
                  id="transferKotsCheck"
                  checked={transferKots}
                  onChange={e => setTransferKots(e.target.checked)}
                />
                <label htmlFor="transferKotsCheck" style={{ fontSize: 12, fontWeight: 700, color: '#92400e', cursor: 'pointer' }}>
                  Auto-Transfer Pending KOTs &amp; Food Bills ({pendingKots.length} orders) to New Room
                </label>
              </div>
              <div style={{ fontSize: 11, color: '#78350f', marginLeft: 22 }}>
                Ensures restaurant revenue is automatically billed to the new room folio without double entry.
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pms-btn-group" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-pms-cancel"
                style={{ padding: '8px 18px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-pms-save"
                disabled={!fromRoomNo || !toRoomNo}
                style={{
                  padding: '8px 24px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: (!fromRoomNo || !toRoomNo) ? 'not-allowed' : 'pointer'
                }}
              >
                Confirm Room Shift 🔄
              </button>
            </div>
          </form>
        ) : (
          /* Shift History Register Tab */
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                All Room Shift Transactions
              </div>
              <input
                type="text"
                placeholder="Search by Guest, Room, Shift No..."
                value={searchHistory}
                onChange={e => setSearchHistory(e.target.value)}
                style={{ width: 260, padding: '4px 8px', fontSize: 11, border: '1px solid #cbd5e1', borderRadius: 4 }}
              />
            </div>

            {filteredHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: 13, background: '#f8fafc', borderRadius: 6 }}>
                No room shift records found. Perform a room shift to record audit history.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                      <th style={{ padding: '8px 10px' }}>Shift No</th>
                      <th style={{ padding: '8px 10px' }}>Date &amp; Time</th>
                      <th style={{ padding: '8px 10px' }}>Guest Name</th>
                      <th style={{ padding: '8px 10px' }}>From Room</th>
                      <th style={{ padding: '8px 10px' }}>To Room</th>
                      <th style={{ padding: '8px 10px' }}>Old Tariff</th>
                      <th style={{ padding: '8px 10px' }}>New Tariff</th>
                      <th style={{ padding: '8px 10px' }}>Reason</th>
                      <th style={{ padding: '8px 10px' }}>Shifted By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0284c7' }}>{item.shiftNo}</td>
                        <td style={{ padding: '8px 10px' }}>{item.shiftDate} {item.shiftTime}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>{item.guestName}</td>
                        <td style={{ padding: '8px 10px', color: '#dc2626', fontWeight: 700 }}>
                          Room {item.fromRoomNo} <span style={{ fontSize: 9, background: '#fee2e2', padding: '1px 4px', borderRadius: 2 }}>DIRTY</span>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#16a34a', fontWeight: 700 }}>
                          Room {item.toRoomNo} <span style={{ fontSize: 9, background: '#dcfce7', padding: '1px 4px', borderRadius: 2 }}>OCCUPIED</span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>₹{item.oldTariff}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>₹{item.newTariff}</td>
                        <td style={{ padding: '8px 10px' }}>{item.reason}</td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{item.shiftedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
