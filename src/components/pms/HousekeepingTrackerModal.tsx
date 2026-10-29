import React, { useState } from 'react';
import type { PmsHousekeepingRecord, PmsRoom } from '../../types/pmsModels';
import { PmsStore, usePmsSync } from '../../services/pmsStore';
import { useERPWebSocket } from '../../hooks/useERPWebSocket';

interface HousekeepingTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomSelect?: (roomNo: string) => void;
}

export const HousekeepingTrackerModal: React.FC<HousekeepingTrackerModalProps> = ({
  isOpen,
  onClose,
  onRoomSelect: _onRoomSelect
}) => {
  usePmsSync();
  const { isConnected: isWsConnected } = useERPWebSocket({
    channel: 'housekeeping',
    enabled: isOpen
  });
  const [activeTab, setActiveTab] = useState<'kanban' | 'table'>('kanban');
  const [filterFloor, setFilterFloor] = useState<'all' | '0' | '1'>('all');
  const [filterStaff, setFilterStaff] = useState<string>('all');
  const [maintenanceModalRoom, setMaintenanceModalRoom] = useState<string | null>(null);
  const [maintenanceIssueText, setMaintenanceIssueText] = useState('');

  if (!isOpen) return null;

  const rooms: PmsRoom[] = PmsStore.getRooms();
  const records: PmsHousekeepingRecord[] = PmsStore.getHousekeepingRecords();

  // Combine room + housekeeping info
  const combinedData = rooms.map(room => {
    const hk = records.find(r => r.roomNo === room.roomNo);
    return {
      roomNo: room.roomNo,
      roomType: room.roomType,
      floor: room.floor,
      roomStatus: room.status,
      currentGuest: room.currentGuest,
      hkStatus: hk?.status || (room.status === 'vacant' ? 'Vacant Clean' : room.status === 'dirty' ? 'Vacant Dirty' : room.status === 'blocked' ? 'Under Maintenance' : 'Inspected'),
      assignedStaff: hk?.assignedStaff || room.assignedStaff || 'Ramesh',
      priority: hk?.priority || room.priority || 'Normal',
      lastCleanedTime: hk?.lastCleanedTime || room.lastCleaned || 'Today 09:00 AM',
      maintenanceIssue: hk?.maintenanceIssue || room.maintenanceIssue
    };
  });

  const filteredData = combinedData.filter(item => {
    if (filterFloor !== 'all' && String(item.floor) !== filterFloor) return false;
    if (filterStaff !== 'all' && item.assignedStaff !== filterStaff) return false;
    return true;
  });

  // Status transition handlers
  const handleStartCleaning = (roomNo: string) => {
    PmsStore.updateHousekeepingStatus(roomNo, 'Cleaning In Progress');
  };

  const handleMarkClean = (roomNo: string) => {
    PmsStore.updateHousekeepingStatus(roomNo, 'Vacant Clean');
  };

  const handleOpenMaintenance = (roomNo: string) => {
    setMaintenanceModalRoom(roomNo);
    setMaintenanceIssueText('');
  };

  const handleSaveMaintenance = () => {
    if (!maintenanceModalRoom) return;
    const issue = maintenanceIssueText.trim() || 'General Maintenance Check';
    PmsStore.updateHousekeepingStatus(maintenanceModalRoom, 'Under Maintenance', undefined, undefined, issue);
    setMaintenanceModalRoom(null);
  };

  const handleResolveMaintenance = (roomNo: string) => {
    PmsStore.resolveMaintenance(roomNo);
  };

  const handleStaffChange = (roomNo: string, newStaff: string) => {
    PmsStore.updateHousekeepingStatus(roomNo, undefined as any, newStaff);
  };

  const handlePriorityChange = (roomNo: string, newPriority: string) => {
    PmsStore.updateHousekeepingStatus(roomNo, undefined as any, undefined, newPriority);
  };

  // Kanban Columns
  const dirtyRooms = filteredData.filter(d => d.hkStatus === 'Vacant Dirty');
  const cleaningRooms = filteredData.filter(d => d.hkStatus === 'Cleaning In Progress');
  const cleanRooms = filteredData.filter(d => d.hkStatus === 'Vacant Clean' || d.hkStatus === 'Inspected');
  const maintenanceRooms = filteredData.filter(d => d.hkStatus === 'Under Maintenance' || d.roomStatus === 'blocked');

  return (
    <div className="pms-modal-backdrop" style={{ zIndex: 12000 }}>
      <div className="pms-modal-window" style={{ maxWidth: '1240px', width: '96%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="pms-modal-header" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🧹</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Housekeeping, Linen &amp; Room Maintenance Tracker</h3>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
                Hotel Sai Vasudev Residency &bull; 16 Rooms Real-Time Cleanliness Board &bull; Shirdi
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Live Housekeeping WebSocket Indicator (#54) */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 9px',
                borderRadius: 16,
                background: isWsConnected ? 'rgba(236,253,245,0.9)' : 'rgba(254,242,242,0.9)',
                color: isWsConnected ? '#065f46' : '#991b1b',
                fontSize: 10,
                fontWeight: 800,
                border: `1px solid ${isWsConnected ? '#a7f3d0' : '#fecaca'}`,
                userSelect: 'none'
              }}
              title={isWsConnected ? "Live Housekeeping WebSocket connected (/api/v1/ws/housekeeping)" : "Reconnecting..."}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: isWsConnected ? '#10b981' : '#ef4444',
                  boxShadow: isWsConnected ? '0 0 6px #10b981' : 'none'
                }}
              />
              {isWsConnected ? 'LIVE HK WS' : 'RECONNECTING'}
            </div>

            <div className="view-toggle-btns" style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.15)', padding: '2px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('kanban')}
                style={{
                  background: activeTab === 'kanban' ? '#ffffff' : 'transparent',
                  color: activeTab === 'kanban' ? '#065f46' : '#ffffff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                📋 Kanban Board
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                style={{
                  background: activeTab === 'table' ? '#ffffff' : 'transparent',
                  color: activeTab === 'table' ? '#065f46' : '#ffffff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                📊 Table View
              </button>
            </div>
            <button type="button" className="pms-close-btn" onClick={onClose} style={{ color: '#ffffff' }}>&times;</button>
          </div>
        </div>

        {/* Filter Ribbon */}
        <div style={{ padding: '12px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Floor:</span>
            {(['all', '0', '1'] as const).map(fl => (
              <button
                key={fl}
                type="button"
                onClick={() => setFilterFloor(fl)}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: filterFloor === fl ? '#065f46' : '#ffffff',
                  color: filterFloor === fl ? '#ffffff' : '#334155',
                  cursor: 'pointer'
                }}
              >
                {fl === 'all' ? 'All Floors (18 Rooms)' : fl === '0' ? 'Ground Floor (101–107)' : '1st Floor (201–211)'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Assigned Attendant:</span>
            <select
              value={filterStaff}
              onChange={e => setFilterStaff(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 600 }}
            >
              <option value="all">All Staff Members</option>
              <option value="Ramesh">Ramesh (Ground Floor Lead)</option>
              <option value="Sunita">Sunita (Ground Floor)</option>
              <option value="Ganesh">Ganesh (1st Floor Lead)</option>
              <option value="Priya">Priya (1st Floor)</option>
            </select>
          </div>

          {/* Quick Counter Badges */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              🔴 Dirty ({dirtyRooms.length})
            </span>
            <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              🟡 Cleaning ({cleaningRooms.length})
            </span>
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              🟢 Clean &amp; Inspected ({cleanRooms.length})
            </span>
            <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
              ⚙️ OOO / Maintenance ({maintenanceRooms.length})
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'kanban' ? (
            /* 4-Column Kanban Board */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {/* Column 1: Vacant Dirty */}
              <div style={{ background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ef4444', paddingBottom: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#b91c1c' }}>🔴 Vacant Dirty ({dirtyRooms.length})</h4>
                  <small style={{ fontSize: '11px', color: '#dc2626' }}>Needs Sanitization</small>
                </div>
                {dirtyRooms.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#991b1b', fontStyle: 'italic', margin: '10px 0' }}>All rooms cleaned!</p>
                ) : (
                  dirtyRooms.map(item => (
                    <div key={item.roomNo} style={{ background: '#ffffff', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '15px', color: '#1e293b' }}>Room {item.roomNo}</strong>
                        <span style={{ fontSize: '11px', background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          {item.floor === 0 ? 'Ground Floor' : '1st Floor'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{item.roomType}</div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                        Attendant: <strong>{item.assignedStaff}</strong> &bull; Priority: <strong style={{ color: item.priority === 'High - Guest Waiting' ? '#dc2626' : '#2563eb' }}>{item.priority}</strong>
                      </div>
                      <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleStartCleaning(item.roomNo)}
                          style={{ flex: 1, padding: '5px 8px', background: '#d97706', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          ▶ Start Cleaning
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenMaintenance(item.roomNo)}
                          style={{ padding: '5px 8px', background: '#475569', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                          title="Log Maintenance Issue"
                        >
                          🛠️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Column 2: Cleaning In Progress */}
              <div style={{ background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f59e0b', paddingBottom: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#b45309' }}>🟡 Cleaning In Progress ({cleaningRooms.length})</h4>
                  <small style={{ fontSize: '11px', color: '#d97706' }}>Attendant Working</small>
                </div>
                {cleaningRooms.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#92400e', fontStyle: 'italic', margin: '10px 0' }}>No active cleaning in progress.</p>
                ) : (
                  cleaningRooms.map(item => (
                    <div key={item.roomNo} style={{ background: '#ffffff', border: '1px solid #fcd34d', borderRadius: '6px', padding: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '15px', color: '#1e293b' }}>Room {item.roomNo}</strong>
                        <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          {item.floor === 0 ? 'Ground Floor' : '1st Floor'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{item.roomType}</div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                        Attendant: <strong>{item.assignedStaff}</strong>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleMarkClean(item.roomNo)}
                          style={{ width: '100%', padding: '6px 8px', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          ✓ Mark Clean &amp; Ready
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Column 3: Vacant Clean & Inspected */}
              <div style={{ background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #10b981', paddingBottom: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#15803d' }}>🟢 Clean &amp; Ready ({cleanRooms.length})</h4>
                  <small style={{ fontSize: '11px', color: '#059669' }}>Unlocked for Check-In</small>
                </div>
                {cleanRooms.map(item => (
                  <div key={item.roomNo} style={{ background: '#ffffff', border: '1px solid #86efac', borderRadius: '6px', padding: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '15px', color: '#1e293b' }}>Room {item.roomNo}</strong>
                      <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {item.roomStatus === 'occupied' ? 'Occupied' : 'Vacant Clean'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{item.roomType}</div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                      Cleaned: {item.lastCleanedTime} &bull; By: {item.assignedStaff}
                    </div>
                    {item.currentGuest && (
                      <div style={{ fontSize: '11px', color: '#1d4ed8', marginTop: '4px', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>
                        Guest: {item.currentGuest.name}
                      </div>
                    )}
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => PmsStore.updateHousekeepingStatus(item.roomNo, 'Vacant Dirty')}
                        style={{ flex: 1, padding: '4px 6px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Mark Dirty
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenMaintenance(item.roomNo)}
                        style={{ padding: '4px 8px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                        title="Log Maintenance Issue"
                      >
                        🛠️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Column 4: Maintenance / OOO */}
              <div style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #64748b', paddingBottom: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#334155' }}>⚙️ Maintenance / OOO ({maintenanceRooms.length})</h4>
                  <small style={{ fontSize: '11px', color: '#64748b' }}>Blocked from Check-In</small>
                </div>
                {maintenanceRooms.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', margin: '10px 0' }}>All rooms fully operational!</p>
                ) : (
                  maintenanceRooms.map(item => (
                    <div key={item.roomNo} style={{ background: '#ffffff', border: '1px solid #94a3b8', borderRadius: '6px', padding: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '15px', color: '#1e293b' }}>Room {item.roomNo}</strong>
                        <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          OOO
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{item.roomType}</div>
                      <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', background: '#fee2e2', padding: '4px 6px', borderRadius: '4px' }}>
                        <strong>Issue:</strong> {item.maintenanceIssue || 'Maintenance Logged'}
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleResolveMaintenance(item.roomNo)}
                          style={{ width: '100%', padding: '6px 8px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          🔧 Resolve &amp; Restore to Vacant Dirty
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Tabular Matrix View */
            <div style={{ overflowX: 'auto' }}>
              <table className="pms-table" style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#064e3b', color: '#ffffff' }}>
                    <th style={{ padding: '8px' }}>Room #</th>
                    <th style={{ padding: '8px' }}>Category</th>
                    <th style={{ padding: '8px' }}>Floor</th>
                    <th style={{ padding: '8px' }}>Front Desk State</th>
                    <th style={{ padding: '8px' }}>Housekeeping Status</th>
                    <th style={{ padding: '8px' }}>Assigned Attendant</th>
                    <th style={{ padding: '8px' }}>Priority</th>
                    <th style={{ padding: '8px' }}>Last Cleaned</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>1-Click Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map(item => (
                    <tr key={item.roomNo} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', fontWeight: 800 }}>{item.roomNo}</td>
                      <td style={{ padding: '8px' }}>{item.roomType}</td>
                      <td style={{ padding: '8px' }}>{item.floor === 0 ? 'Ground Floor' : '1st Floor'}</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: item.roomStatus === 'occupied' ? '#dbeafe' : item.roomStatus === 'vacant' ? '#dcfce7' : item.roomStatus === 'dirty' ? '#fee2e2' : item.roomStatus === 'booked' ? '#fef3c7' : '#f1f5f9',
                          color: item.roomStatus === 'occupied' ? '#1d4ed8' : item.roomStatus === 'vacant' ? '#15803d' : item.roomStatus === 'dirty' ? '#b91c1c' : item.roomStatus === 'booked' ? '#b45309' : '#334155'
                        }}>
                          {item.roomStatus.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span style={{ fontWeight: 700, color: item.hkStatus === 'Vacant Clean' || item.hkStatus === 'Inspected' ? '#059669' : item.hkStatus === 'Vacant Dirty' ? '#dc2626' : item.hkStatus === 'Cleaning In Progress' ? '#d97706' : '#475569' }}>
                          {item.hkStatus}
                        </span>
                        {item.maintenanceIssue && (
                          <div style={{ fontSize: '10px', color: '#dc2626' }}>{item.maintenanceIssue}</div>
                        )}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <select
                          value={item.assignedStaff}
                          onChange={e => handleStaffChange(item.roomNo, e.target.value)}
                          style={{ padding: '3px 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        >
                          <option value="Ramesh">Ramesh</option>
                          <option value="Sunita">Sunita</option>
                          <option value="Ganesh">Ganesh</option>
                          <option value="Priya">Priya</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <select
                          value={item.priority}
                          onChange={e => handlePriorityChange(item.roomNo, e.target.value)}
                          style={{ padding: '3px 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        >
                          <option value="Normal">Normal</option>
                          <option value="High - Guest Waiting">High - Guest Waiting</option>
                          <option value="VIP Suite">VIP Suite</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px', fontSize: '11px', color: '#64748b' }}>{item.lastCleanedTime}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          {item.hkStatus === 'Vacant Dirty' && (
                            <button
                              type="button"
                              onClick={() => handleStartCleaning(item.roomNo)}
                              style={{ padding: '3px 8px', background: '#d97706', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Start Cleaning
                            </button>
                          )}
                          {(item.hkStatus === 'Cleaning In Progress' || item.hkStatus === 'Vacant Dirty') && (
                            <button
                              type="button"
                              onClick={() => handleMarkClean(item.roomNo)}
                              style={{ padding: '3px 8px', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Mark Clean &amp; Ready
                            </button>
                          )}
                          {item.hkStatus !== 'Under Maintenance' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenMaintenance(item.roomNo)}
                              style={{ padding: '3px 6px', background: '#475569', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                              title="Log Maintenance"
                            >
                              🛠️ Log Issue
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleResolveMaintenance(item.roomNo)}
                              style={{ padding: '3px 8px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal for logging Maintenance issue */}
        {maintenanceModalRoom && (
          <div className="pms-modal-backdrop" style={{ zIndex: 13000 }}>
            <div className="pms-modal-window" style={{ maxWidth: '440px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>
                  🛠️ Log Maintenance Issue &bull; Room {maintenanceModalRoom}
                </h4>
                <button type="button" onClick={() => setMaintenanceModalRoom(null)} style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer' }}>&times;</button>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                This will block Room {maintenanceModalRoom} as Under Maintenance (OOO) and prevent Front Desk check-in until resolved.
              </p>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Issue Description:</label>
                <input
                  type="text"
                  value={maintenanceIssueText}
                  onChange={e => setMaintenanceIssueText(e.target.value)}
                  placeholder="e.g. AC Cooling Low, Geyser Check, Flush Valve Leaking"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setMaintenanceModalRoom(null)}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f1f5f9', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMaintenance}
                  style={{ padding: '6px 14px', borderRadius: '4px', border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Block Room for Maintenance
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
