import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { RfidKeyCard, PmsRoom } from '../../types/pmsModels';

interface RfidKeyCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RfidKeyCardModal: React.FC<RfidKeyCardModalProps> = ({ isOpen, onClose }) => {
  const [cards, setCards] = useState<RfidKeyCard[]>([]);
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [selectedRoomNo, setSelectedRoomNo] = useState<string>('101');
  const [checkoutTimeStr, setCheckoutTimeStr] = useState<string>('11:00 AM');
  const [cardUid, setCardUid] = useState<string>(() => `RFID-${Math.floor(100000 + Math.random() * 900000)}`);
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Extension submodal state
  const [extendingCard, setExtendingCard] = useState<RfidKeyCard | null>(null);
  const [newCheckoutTime, setNewCheckoutTime] = useState<string>('02:00 PM');
  const [lateCheckoutFee, setLateCheckoutFee] = useState<number>(500);
  const [extensionReason, setExtensionReason] = useState<string>('Guest flight delayed; paid late checkout tariff');

  const refreshData = () => {
    setCards(PmsStore.getKeyCards());
    const occRooms = PmsStore.getRooms().filter(r => r.status === 'occupied');
    setRooms(occRooms.length > 0 ? occRooms : PmsStore.getRooms());
    if (occRooms.length > 0 && !selectedRoomNo) {
      setSelectedRoomNo(occRooms[0].roomNo);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  // Tick timer for countdowns
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setNowTime(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleIssueCard = () => {
    const matchedRoom = rooms.find(r => r.roomNo === selectedRoomNo);
    const guest = matchedRoom?.currentGuest?.name || 'In-House Guest';
    const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const fullCheckoutStr = `${today} ${checkoutTimeStr}`;

    const newCard = PmsStore.encodeKeyCard(
      selectedRoomNo,
      guest,
      fullCheckoutStr
    );

    const expiryDisplay = newCard.cardDeactivationTime || newCard.expiryTime || '10:00 AM';
    alert(`🔑 RFID Smart Key Card ${newCard.cardUid} Encoded for Room ${selectedRoomNo}!\n\nStandard Checkout: ${checkoutTimeStr}\nRFID Lock Auto-Expiry: ${expiryDisplay} (T-Minus 1 Hour Rule Applied)\n\nGuest must visit Front Desk to extend stay before lock deactivates.`);
    setCardUid(`RFID-${Math.floor(100000 + Math.random() * 900000)}`);
    refreshData();
  };

  const handleConfirmExtension = () => {
    if (!extendingCard) return;
    if (lateCheckoutFee < 0) {
      alert('Extension fee must be >= 0.');
      return;
    }

    const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const fullNewCheckout = `${today} ${newCheckoutTime}`;

    const result = PmsStore.extendKeyCard(
      extendingCard.cardUid,
      fullNewCheckout,
      lateCheckoutFee,
      extensionReason
    );

    if (result.success && result.card) {
      const exp = result.card.cardDeactivationTime || result.card.expiryTime || 'Extended';
      alert(`✅ Key Card Extended!\n\n${result.message}\nNew RFID Expiry: ${exp} (T-1h Cutoff)\nFee ₹${lateCheckoutFee} posted to guest room account.`);
      setExtendingCard(null);
      refreshData();
    } else {
      alert(result.message);
    }
  };

  const getStatusBadge = (card: RfidKeyCard) => {
    const timeStr = card.cardDeactivationTime || card.expiryTime || '';
    const expiryMs = timeStr ? new Date(timeStr).getTime() : 0;
    const diffMins = !isNaN(expiryMs) && expiryMs > 0 ? Math.round((expiryMs - nowTime) / (1000 * 60)) : 60;

    if (card.status === 'DEACTIVATED' || card.status === 'Deactivated' || diffMins <= 0) {
      return (
        <span style={{
          background: '#fee2e2',
          color: '#b91c1c',
          padding: '3px 8px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 800
        }}>
          🔒 DEACTIVATED (-1h)
        </span>
      );
    }
    if (diffMins <= 60) {
      return (
        <span style={{
          background: '#fef3c7',
          color: '#b45309',
          padding: '3px 8px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 800
        }}>
          ⚠️ EXPIRING IN {diffMins}m
        </span>
      );
    }
    return (
      <span style={{
        background: '#dcfce7',
        color: '#15803d',
        padding: '3px 8px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 800
      }}>
        ✅ ACTIVE ({card.status})
      </span>
    );
  };



  return (
    <div className="pms-submodal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="pms-form-box" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 1100, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Banner Header */}
        <div className="pms-form-banner banner-navy" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🏷️</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 14 }}>
                RFID Key Card Encoder &amp; Automated Pre-Checkout Deactivation (T-1 Hour Cutoff)
              </div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>
                Locks smart doors exactly 60 minutes prior to scheduled checkout &bull; Forces front-desk extension workflow
              </div>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        {/* Issue Card Bar */}
        <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0369a1', marginBottom: 10 }}>
            Encode New RFID Smart Key Card (Pre-Programmed T-1 Hour Lock Cutoff)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1fr', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group-pms" style={{ margin: 0 }}>
              <label className="form-label-pms">Select Occupied Room</label>
              <select
                value={selectedRoomNo}
                onChange={e => setSelectedRoomNo(e.target.value)}
                className="form-select-pms"
                style={{ fontWeight: 800 }}
              >
                {rooms.map(r => (
                  <option key={r.id} value={r.roomNo}>
                    Room {r.roomNo} ({r.currentGuest?.name || 'In-House'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-pms" style={{ margin: 0 }}>
              <label className="form-label-pms">RFID Card UID / Serial</label>
              <input
                type="text"
                value={cardUid}
                onChange={e => setCardUid(e.target.value)}
                className="form-input-pms"
                style={{ fontWeight: 700 }}
              />
            </div>

            <div className="form-group-pms" style={{ margin: 0 }}>
              <label className="form-label-pms">Scheduled Checkout Time</label>
              <select
                value={checkoutTimeStr}
                onChange={e => setCheckoutTimeStr(e.target.value)}
                className="form-select-pms"
                style={{ fontWeight: 700 }}
              >
                <option value="10:00 AM">10:00 AM (Deactivates 09:00 AM)</option>
                <option value="11:00 AM">11:00 AM (Deactivates 10:00 AM)</option>
                <option value="12:00 PM">12:00 PM (Deactivates 11:00 AM)</option>
                <option value="01:00 PM">01:00 PM (Deactivates 12:00 PM)</option>
                <option value="02:00 PM">02:00 PM (Deactivates 01:00 PM)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleIssueCard}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '9px 16px',
                borderRadius: 4,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(2,132,199,0.3)'
              }}
            >
              ⚡ Encode &amp; Issue Card
            </button>
          </div>
        </div>

        {/* Issued Cards Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>
              Active RFID Guest Smart Cards ({cards.length} Encoded)
            </span>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              Rule: Door Locks Deactivate 60 Mins Before Checkout to Ensure Timely Settlements
            </span>
          </div>

          <table className="pms-table-compact" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#fff' }}>
                <th>Card UID</th>
                <th>Room No</th>
                <th>Guest Name</th>
                <th>Issued At</th>
                <th>Scheduled Checkout</th>
                <th>RFID Lock Auto-Expiry (-1 Hour)</th>
                <th style={{ textAlign: 'center' }}>Live Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={{ fontWeight: 800, color: '#0369a1' }}>{c.cardUid}</td>
                  <td style={{ fontWeight: 900, color: '#0f172a' }}>Room {c.roomNo}</td>
                  <td style={{ fontWeight: 700 }}>{c.guestName}</td>
                  <td style={{ fontSize: 11, color: '#64748b' }}>
                    {c.checkInTime || c.issuedAt || '-'}
                  </td>
                  <td style={{ fontWeight: 700 }}>{c.scheduledCheckoutTime || c.checkoutTime || '-'}</td>
                  <td style={{ fontWeight: 900, color: '#b91c1c' }}>
                    {c.cardDeactivationTime || c.expiryTime || '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {getStatusBadge(c)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setExtendingCard(c)}
                      style={{
                        background: '#16a34a',
                        color: '#fff',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      🔄 Extend Stay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Extension Submodal */}
        {extendingCard && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001
          }}>
            <div style={{ background: '#ffffff', borderRadius: 8, padding: 20, width: 480, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
                Mandatory Stay Extension &amp; Re-Encode Workflow
              </div>

              <div style={{ fontSize: 12, color: '#334155', marginBottom: 12, background: '#f8fafc', padding: 10, borderRadius: 6 }}>
                <div><strong>Room:</strong> Room {extendingCard.roomNo} &bull; <strong>Guest:</strong> {extendingCard.guestName}</div>
                <div><strong>Card UID:</strong> {extendingCard.cardUid}</div>
              </div>

              <div className="form-group-pms">
                <label className="form-label-pms">New Scheduled Checkout Time</label>
                <select
                  value={newCheckoutTime}
                  onChange={e => setNewCheckoutTime(e.target.value)}
                  className="form-select-pms"
                  style={{ fontWeight: 700 }}
                >
                  <option value="01:00 PM">01:00 PM (Lock Cutoff: 12:00 PM)</option>
                  <option value="02:00 PM">02:00 PM (Lock Cutoff: 01:00 PM)</option>
                  <option value="04:00 PM">04:00 PM (Lock Cutoff: 03:00 PM)</option>
                  <option value="06:00 PM">06:00 PM (Lock Cutoff: 05:00 PM)</option>
                  <option value="11:00 AM (Next Day)">11:00 AM Next Day (Full Tariff)</option>
                </select>
              </div>

              <div className="form-group-pms">
                <label className="form-label-pms">Mandatory Stay Extension Fee / Tariff (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={lateCheckoutFee}
                  onChange={e => setLateCheckoutFee(Number(e.target.value))}
                  className="form-input-pms"
                  style={{ fontWeight: 800, color: '#0369a1' }}
                />
                <span style={{ fontSize: 10, color: '#64748b' }}>
                  Auto-posts to guest room folio under Late Checkout / Stay Extension
                </span>
              </div>

              <div className="form-group-pms">
                <label className="form-label-pms">Extension Reason / Guest Request</label>
                <input
                  type="text"
                  value={extensionReason}
                  onChange={e => setExtensionReason(e.target.value)}
                  className="form-input-pms"
                  style={{ fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setExtendingCard(null)}
                  className="btn-pms-cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExtension}
                  style={{
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Post Fee &amp; Re-Encode Key Card
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            RFID Smart Lock Protocol &bull; T-1 Hour Automated Access Control
          </div>
          <button type="button" onClick={onClose} className="btn-pms-cancel">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
