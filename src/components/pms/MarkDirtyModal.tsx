import React, { useState } from 'react';
import type { PmsRoom } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';

interface MarkDirtyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export const MarkDirtyModal: React.FC<MarkDirtyModalProps> = ({
  isOpen,
  onClose,
  onStatusUpdated
}) => {
  const rooms = PmsStore.getRooms();
  const [selectedRoomNo, setSelectedRoomNo] = useState<string>(rooms[0]?.roomNo || '101');
  const [targetStatus, setTargetStatus] = useState<PmsRoom['status']>('dirty');
  const [housekeepingRemark, setHousekeepingRemark] = useState('');

  if (!isOpen) return null;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    PmsStore.updateRoomStatus(selectedRoomNo, targetStatus);
    onStatusUpdated();
    onClose();
  };

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div className="pms-form-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="pms-form-banner banner-amber">
          Room Housekeeping & Status Toggle
        </div>

        <form onSubmit={handleUpdate} className="pms-form-body">
          <div className="form-group-pms">
            <label className="form-label-pms">Select Room</label>
            <select
              value={selectedRoomNo}
              onChange={e => setSelectedRoomNo(e.target.value)}
              className="form-select-pms"
              style={{ fontWeight: 700 }}
            >
              {rooms.map(r => (
                <option key={r.id} value={r.roomNo}>
                  Room {r.roomNo} ({r.roomType}) - Current: {r.status.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-pms">
            <label className="form-label-pms">Change Status To</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="statusOption"
                  value="dirty"
                  checked={targetStatus === 'dirty'}
                  onChange={() => setTargetStatus('dirty')}
                />
                <span style={{ color: '#dc2626', fontWeight: 700 }}>Mark as Dirty 🧹</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="statusOption"
                  value="vacant"
                  checked={targetStatus === 'vacant'}
                  onChange={() => setTargetStatus('vacant')}
                />
                <span style={{ color: '#16a34a', fontWeight: 700 }}>Mark as Clean / Ready ✨</span>
              </label>
            </div>
          </div>

          <div className="form-group-pms">
            <label className="form-label-pms">Housekeeping Note</label>
            <input
              type="text"
              placeholder="e.g. Linen changed, sanitized"
              value={housekeepingRemark}
              onChange={e => setHousekeepingRemark(e.target.value)}
              className="form-input-pms"
            />
          </div>

          <div className="pms-btn-group">
            <button type="button" onClick={onClose} className="btn-pms-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-pms-save">
              Apply Status Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
