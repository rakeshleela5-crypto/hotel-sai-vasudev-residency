import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';
import type { HousekeepingDiscrepancy } from '../../types/pmsModels';

interface HousekeepingDiscrepancyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HousekeepingDiscrepancyModal: React.FC<HousekeepingDiscrepancyModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'discrepancies' | 'shortstay'>('discrepancies');
  const [rooms, setRooms] = useState(PmsStore.getRooms());
  const [discrepancies, setDiscrepancies] = useState<HousekeepingDiscrepancy[]>([]);
  const [shortStayAlerts, setShortStayAlerts] = useState<Array<{
    roomNo: string;
    guestName: string;
    stayHours: number;
    checkInTime: string;
    checkOutTime: string;
  }>>([]);
  const [selectedRoomNo, setSelectedRoomNo] = useState<string>('');
  const [attendantReportStatus, setAttendantReportStatus] = useState<'Vacant Dirty' | 'Vacant Clean' | 'Physically Occupied'>('Vacant Dirty');
  const [attendantName, setAttendantName] = useState<string>('Ramesh Attendant (Floor 1)');
  const [auditNotes, setAuditNotes] = useState<string>('Guest vacated room earlier than checkout; room is empty.');
  const [resolveNotes, setResolveNotes] = useState<string>('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const refreshData = () => {
    setRooms(PmsStore.getRooms());
    setDiscrepancies(PmsStore.getHousekeepingDiscrepancies());
    setShortStayAlerts(PmsStore.checkShortStayAlerts());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      if (!selectedRoomNo) {
        const occ = PmsStore.getRooms().find(r => r.status === 'occupied');
        if (occ) setSelectedRoomNo(occ.roomNo);
        else setSelectedRoomNo('101');
      }

      const unsub = PmsStore.subscribe(() => {
        refreshData();
      });

      hotelApi.getHousekeepingDiscrepancies().then(cloudDiscs => {
        if (Array.isArray(cloudDiscs) && cloudDiscs.length > 0) {
          const mapped: HousekeepingDiscrepancy[] = cloudDiscs.map((d: any) => ({
            id: d.discrepancy_id || d.id,
            roomNo: d.room_no || d.roomNo,
            pmsStatus: d.front_desk_status || d.pmsStatus || 'occupied',
            housekeepingStatus: d.housekeeping_status || d.housekeepingStatus || 'Vacant Dirty',
            guestName: d.guest_name || 'In-House Guest',
            reportedBy: d.reported_by || 'Housekeeping Attendant',
            reportedAt: d.reported_at || new Date().toISOString(),
            discrepancyType: d.discrepancy_type || 'PMS_OCCUPIED_HK_VACANT',
            severity: d.severity || 'CRITICAL_FRAUD_ALERT',
            notes: d.remarks || d.notes || '',
            status: d.resolved ? 'Resolved' : 'Pending',
            resolved: d.resolved
          }));
          PmsStore.syncHousekeepingDiscrepancies(mapped);
          setDiscrepancies(mapped);
        }
      }).catch(err => console.warn('[HousekeepingDiscrepancyModal] Cloud fetch note:', err));

      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRecordInspection = () => {
    if (!selectedRoomNo) {
      alert('Please select a room.');
      return;
    }
    const room = rooms.find(r => r.roomNo === selectedRoomNo);
    const pmsStatus = room ? room.status : 'vacant';

    // Anti-fraud check: Front Desk shows occupied, but attendant finds room vacant
    const isDiscrepant = pmsStatus === 'occupied' && (attendantReportStatus === 'Vacant Dirty' || attendantReportStatus === 'Vacant Clean');
    const guest = room?.currentGuest?.name || 'In-House Guest';

    const newDisc: HousekeepingDiscrepancy = {
      id: `HSA-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      roomNo: selectedRoomNo,
      pmsStatus,
      housekeepingStatus: attendantReportStatus,
      guestName: guest,
      reportedBy: attendantName,
      reportedAt: new Date().toISOString(),
      discrepancyType: isDiscrepant ? 'PMS_OCCUPIED_HK_VACANT' : 'NONE',
      severity: isDiscrepant ? 'CRITICAL_FRAUD_ALERT' : 'NORMAL',
      notes: auditNotes,
      status: isDiscrepant ? 'Pending' : 'Resolved'
    };

    PmsStore.recordHousekeepingDiscrepancy(newDisc);
    refreshData();

    if (isDiscrepant) {
      alert(`🚨 HIGH-PRIORITY FRAUD ALERT TRIGGERED!\n\nRoom ${selectedRoomNo} is marked OCCUPIED at Front Desk, but Housekeeping Attendant independently found it VACANT!\n\nThis incident has been logged into the Owner Audit Register to prevent unrecorded short-stay room resales.`);
      setActiveTab('discrepancies');
    } else {
      alert(`Housekeeping inspection for Room ${selectedRoomNo} saved successfully.`);
    }
  };

  const handleResolve = (id: string) => {
    if (!resolveNotes.trim()) {
      alert('Please enter resolution notes explaining manager findings.');
      return;
    }
    PmsStore.resolveHousekeepingDiscrepancy(id, resolveNotes);
    setResolvingId(null);
    setResolveNotes('');
    refreshData();
    alert('Discrepancy marked as Resolved and recorded in manager log.');
  };

  const pendingDiscrepancies = discrepancies.filter(d => d.status === 'Pending');

  return (
    <div className="pms-submodal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="pms-form-box" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 1050, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Banner Header */}
        <div className="pms-form-banner banner-red" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 14 }}>
                Anti-Fraud Short-Stay Theft Prevention & Housekeeping Audit Portal
              </div>
              <div style={{ fontSize: 11, opacity: 0.9 }}>
                Automated Room Discrepancy Detection &bull; Eliminates Off-The-Books Cash Turnovers
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

        {/* Tab Controls */}
        <div style={{ display: 'flex', borderBottom: '2px solid #cbd5e1', padding: '0 20px', background: '#f8fafc' }}>
          {[
            { id: 'discrepancies', label: '🚨 Room Discrepancy Alerts', count: pendingDiscrepancies.length },
            { id: 'shortstay', label: '⏱️ Short-Stay Early Checkout Logs (< 4h)', count: shortStayAlerts.length },
            { id: 'audit', label: '📱 Mobile Room Attendant Audit Entry', count: null }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #dc2626' : '3px solid transparent',
                color: activeTab === tab.id ? '#dc2626' : '#64748b',
                fontWeight: activeTab === tab.id ? 800 : 600,
                fontSize: 12,
                padding: '12px 18px',
                cursor: 'pointer',
                marginBottom: -2,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  borderRadius: 10,
                  fontSize: 10,
                  padding: '1px 6px',
                  fontWeight: 800
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {activeTab === 'discrepancies' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>
                    Front Desk vs Housekeeping Status Discrepancies
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Triggered when Housekeeping marks a room Vacant while Reception maintains room as Occupied.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ➕ New Floor Audit
                </button>
              </div>

              {pendingDiscrepancies.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '2px dashed #cbd5e1' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>
                    Zero Discrepancies Detected!
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    Front desk occupancy matches physical housekeeping room inspections perfectly.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingDiscrepancies.map(d => (
                    <div
                      key={d.id}
                      style={{
                        background: '#fff5f5',
                        border: '2px solid #ef4444',
                        borderRadius: 6,
                        padding: 14,
                        boxShadow: '0 2px 6px rgba(239,68,68,0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{
                            background: '#b91c1c',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 900,
                            padding: '2px 8px',
                            borderRadius: 3,
                            textTransform: 'uppercase'
                          }}>
                            {d.severity}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 900, marginLeft: 10, color: '#0f172a' }}>
                            Room {d.roomNo} &bull; Guest: {d.guestName}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                          Reported: {new Date(d.reportedAt).toLocaleTimeString()} ({new Date(d.reportedAt).toLocaleDateString()})
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10, background: '#ffffff', padding: 10, borderRadius: 4, border: '1px solid #fed7d7' }}>
                        <div>
                          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>FRONT DESK (PMS) STATUS</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>
                            🔴 {d.pmsStatus}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>HOUSEKEEPING ATTENDANT STATUS</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>
                            🟢 {d.housekeepingStatus}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>REPORTED BY</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                            {d.reportedBy}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: '#475569', marginTop: 8 }}>
                        <strong>Inspection Notes:</strong> {d.notes}
                      </div>

                      {resolvingId === d.id ? (
                        <div style={{ marginTop: 10, padding: 10, background: '#f8fafc', borderRadius: 4, border: '1px solid #cbd5e1' }}>
                          <label style={{ fontSize: 11, fontWeight: 800, color: '#1e293b' }}>
                            Manager Resolution Findings / Reason:
                          </label>
                          <input
                            type="text"
                            value={resolveNotes}
                            onChange={e => setResolveNotes(e.target.value)}
                            placeholder="e.g. Guest checked out early at 9:15 AM; receptionist forgot to click check-out in PMS. Reconciled."
                            className="form-input-pms"
                            style={{ marginTop: 4, marginBottom: 8 }}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => handleResolve(d.id)}
                              style={{
                                background: '#16a34a',
                                color: '#fff',
                                border: 'none',
                                padding: '5px 14px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              Confirm Resolution
                            </button>
                            <button
                              type="button"
                              onClick={() => setResolvingId(null)}
                              className="btn-pms-cancel"
                              style={{ padding: '5px 12px' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                          <button
                            type="button"
                            onClick={() => setResolvingId(d.id)}
                            style={{
                              background: '#2563eb',
                              color: '#fff',
                              border: 'none',
                              padding: '5px 14px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            Investigate &amp; Resolve Discrepancy
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'shortstay' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                Short-Stay (&lt; 4 Hours) Anti-Fraud Turnover Audit
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                Identifies guests who departed within 1–4 hours of check-in. Prevents cash theft where the receptionist pockets cash and keeps room occupied in PMS.
              </div>

              {shortStayAlerts.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '2px dashed #cbd5e1' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>⏱️</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>
                    No irregular short-stay checkouts detected in recent records.
                  </div>
                </div>
              ) : (
                <table className="pms-table-compact" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#fff' }}>
                      <th>Room No</th>
                      <th>Guest Name</th>
                      <th>Check-In Time</th>
                      <th>Check-Out Time</th>
                      <th style={{ textAlign: 'center' }}>Total Duration</th>
                      <th>Risk Classification</th>
                      <th style={{ textAlign: 'center' }}>SMS/WhatsApp Audit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortStayAlerts.map((sa, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 800, color: '#0369a1' }}>Room {sa.roomNo}</td>
                        <td style={{ fontWeight: 700 }}>{sa.guestName}</td>
                        <td>{sa.checkInTime}</td>
                        <td>{sa.checkOutTime}</td>
                        <td style={{ textAlign: 'center', fontWeight: 900, color: '#dc2626' }}>
                          {sa.stayHours} hrs
                        </td>
                        <td>
                          <span style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            fontSize: 10,
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontWeight: 800
                          }}>
                            Short-Stay (&lt; 4h) Turnover
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
                            ✅ Digital Invoice Dispatched
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div style={{ maxWidth: 600, margin: '0 auto', background: '#f8fafc', padding: 20, borderRadius: 8, border: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
                Floor Room Attendant Physical Inspection Form
              </div>

              <div className="form-group-pms">
                <label className="form-label-pms">Select Room Number</label>
                <select
                  value={selectedRoomNo}
                  onChange={e => setSelectedRoomNo(e.target.value)}
                  className="form-select-pms"
                  style={{ fontWeight: 800 }}
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.roomNo}>
                      Room {r.roomNo} ({r.roomType}) &mdash; PMS Status: {r.status.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group-pms">
                <label className="form-label-pms">Physical Status Found by Housekeeper</label>
                <select
                  value={attendantReportStatus}
                  onChange={e => setAttendantReportStatus(e.target.value as any)}
                  className="form-select-pms"
                  style={{ fontWeight: 800, color: attendantReportStatus.includes('Vacant') ? '#16a34a' : '#0284c7' }}
                >
                  <option value="Vacant Dirty">Vacant Dirty (Guest Vacated / Key Dropped / Dirty Linen)</option>
                  <option value="Vacant Clean">Vacant Clean (Turned Over & Ready for Check-in)</option>
                  <option value="Physically Occupied">Physically Occupied (Guest Belongings / Guest Inside)</option>
                </select>
              </div>

              <div className="form-group-pms">
                <label className="form-label-pms">Housekeeping Attendant / Supervisor Name</label>
                <input
                  type="text"
                  value={attendantName}
                  onChange={e => setAttendantName(e.target.value)}
                  className="form-input-pms"
                  style={{ fontWeight: 700 }}
                />
              </div>

              <div className="form-group-pms">
                <label className="form-label-pms">Inspection Observations / Notes</label>
                <textarea
                  value={auditNotes}
                  onChange={e => setAuditNotes(e.target.value)}
                  rows={3}
                  className="form-input-pms"
                  placeholder="Record physical luggage presence, keycard slot status, power activity..."
                />
              </div>

              <button
                type="button"
                onClick={handleRecordInspection}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  marginTop: 8
                }}
              >
                Submit Independent Housekeeping Inspection
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            Hotel SRI SAI VASUDEV RESIDENCY &bull; Security &amp; Loss Prevention Protocol
          </div>
          <button type="button" onClick={onClose} className="btn-pms-cancel">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
