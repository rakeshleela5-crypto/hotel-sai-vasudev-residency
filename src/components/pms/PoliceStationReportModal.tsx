import React, { useState, useEffect } from 'react';
import type { PmsCheckIn } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';

interface PoliceStationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFromDate?: string;
  initialToDate?: string;
}

export const PoliceStationReportModal: React.FC<PoliceStationReportModalProps> = ({
  isOpen,
  onClose,
  initialFromDate,
  initialToDate
}) => {
  // Navigation views: 'filter' (Frame 0105), 'format1' (Frame 0110), 'format2' (Frame 0140), 'profile_print' (Frame 0125)
  const [viewMode, setViewMode] = useState<'filter' | 'format1' | 'format2' | 'profile_print'>('filter');
  
  // Date and format filter
  const todayStr = '10-07-2025'; // matches Video 24 demo date (or fallback to current date)
  const [fromDate, setFromDate] = useState<string>(initialFromDate || todayStr);
  const [toDate, setToDate] = useState<string>(initialToDate || todayStr);
  const [selectedFormat, setSelectedFormat] = useState<'format1' | 'format2'>('format1');

  // Report records
  const [reportList, setReportList] = useState<PmsCheckIn[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfileCheckIn, setSelectedProfileCheckIn] = useState<PmsCheckIn | null>(null);

  const currentProperty = PmsStore.getCurrentProperty();
  const currentUser = PmsStore.getCurrentUser();

  const loadReportData = async (fDate: string, tDate: string) => {
    const localList = PmsStore.getPoliceStationReport(fDate, tDate);
    setReportList(localList);

    try {
      const cloudLogs = await hotelApi.getPoliceStationLogs();
      if (Array.isArray(cloudLogs) && cloudLogs.length > 0) {
        const existingNos = new Set(localList.map(l => l.checkInNo.toLowerCase()));
        const extra: PmsCheckIn[] = [];
        for (const log of cloudLogs) {
          const ref = log.booking_ref || `POL-${log.id}`;
          if (!existingNos.has(ref.toLowerCase())) {
            extra.push({
              checkInNo: ref,
              roomNo: log.room_number || '101',
              guestName: log.guest_name,
              mobile: log.phone || '',
              checkInDate: log.created_at ? log.created_at.slice(0, 10) : fDate,
              checkInTime: '11:00 AM',
              checkOutDate: tDate,
              checkOutTime: '11:00 AM',
              numberOfGuests: log.total_pax || 1,
              documentName: log.id_proof_type || 'Aadhaar Card',
              documentNo: log.id_proof_number || '',
              addressLine1: log.permanent_address || '',
              city: log.city || log.origin_city || '',
              state: log.state || '',
              pinCode: log.pincode || '',
              comingFrom: log.origin_city || '',
              goingTo: log.next_destination || '',
              purposeOfVisit: log.purpose_of_visit || 'Temple Darshan',
              status: 'CheckedIn'
            } as PmsCheckIn);
          }
        }
        if (extra.length > 0) {
          setReportList([...localList, ...extra]);
        }
      }
    } catch (err) {
      console.warn('[PoliceStationReportModal] Cloud police log fetch note:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setViewMode('filter');
      loadReportData(fromDate, toDate);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyFilter = () => {
    loadReportData(fromDate, toDate);
    if (selectedFormat === 'format1') {
      setViewMode('format1');
    } else {
      setViewMode('format2');
    }
  };

  const handleOpenProfilePrint = (item: PmsCheckIn) => {
    setSelectedProfileCheckIn(item);
    setViewMode('profile_print');
  };

  const filteredList = reportList.filter(item => {
    const q = searchTerm.toLowerCase();
    return (
      item.guestName.toLowerCase().includes(q) ||
      item.roomNo.toLowerCase().includes(q) ||
      item.checkInNo.toLowerCase().includes(q) ||
      (item.mobile && item.mobile.includes(q)) ||
      (item.documentNo && item.documentNo.toLowerCase().includes(q)) ||
      (item.city && item.city.toLowerCase().includes(q)) ||
      (item.secondGuestName && item.secondGuestName.toLowerCase().includes(q)) ||
      (item.thirdGuestName && item.thirdGuestName.toLowerCase().includes(q))
    );
  });

  const handleExportCSV = () => {
    const headers = ['S.No', 'CheckIn No', 'Room No', 'Guest Name', 'Contact No', 'CheckIn Date', 'CheckIn Time', 'Document Name', 'Document No', 'Members', 'Address', 'City', 'State', 'PinCode'];
    const rows = filteredList.map((item, idx) => [
      idx + 1,
      `"${item.checkInNo}"`,
      `"${item.roomNo}"`,
      `"${item.guestName}"`,
      `"${item.mobile || ''}"`,
      `"${item.checkInDate}"`,
      `"${item.checkInTime}"`,
      `"${item.documentName || 'Aadhaar Card'}"`,
      `"${item.documentNo || ''}"`,
      item.numberOfGuests || 1,
      `"${(item.addressLine1 || '').replace(/"/g, '""')}"`,
      `"${item.city || ''}"`,
      `"${item.state || ''}"`,
      `"${item.pinCode || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Police_Station_Report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pms-modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="pms-modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: viewMode === 'filter' ? 560 : 1180,
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: '#ffffff',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
        }}
      >
        {/* Master Header matching Video 24 Frame 0105 */}
        <div
          style={{
            background: '#1e293b',
            color: '#ffffff',
            padding: '12px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>👮</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                POLICE STATION REPORT &bull; SRI SAI VASUDEV RESIDENCY
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Local Police Station &amp; CID Guest Verification Compliance
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {viewMode !== 'filter' && (
              <button
                type="button"
                onClick={() => setViewMode('filter')}
                style={{
                  background: '#334155',
                  color: '#f8fafc',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 10px',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                📅 Change Dates / Format
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: 18,
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* VIEW 1: Filter / Format Selector Modal (Video 24 Frame 0105)   */}
        {/* ============================================================== */}
        {viewMode === 'filter' && (
          <div style={{ padding: '24px 28px', background: '#f8fafc', flex: 1 }}>
            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#1e293b', fontWeight: 800 }}>
                Police Station Report
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    From Date
                  </label>
                  <input
                    type="text"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    placeholder="DD-MM-YYYY"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 4,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      background: '#fff'
                    }}
                  />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>e.g. 10-07-2025 or today</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    To Date
                  </label>
                  <input
                    type="text"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    placeholder="DD-MM-YYYY"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 4,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      background: '#fff'
                    }}
                  />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>e.g. 10-07-2025 or today</div>
                </div>
              </div>

              {/* Radio Format Selection matching Frame 0105 */}
              <div style={{ marginBottom: 24, padding: '12px 16px', background: '#f1f5f9', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>
                  Select Format:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#1e293b' }}>
                    <input
                      type="radio"
                      name="policeReportFormat"
                      checked={selectedFormat === 'format1'}
                      onChange={() => setSelectedFormat('format1')}
                      style={{ cursor: 'pointer', width: 16, height: 16 }}
                    />
                    <div>
                      <strong>Format 1</strong> &mdash; Interactive Grid with Guest &amp; ID Photos
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        Shows photo thumbnails, clickable 4-photo dossier print sheet, and document verification.
                      </div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#1e293b' }}>
                    <input
                      type="radio"
                      name="policeReportFormat"
                      checked={selectedFormat === 'format2'}
                      onChange={() => setSelectedFormat('format2')}
                      style={{ cursor: 'pointer', width: 16, height: 16 }}
                    />
                    <div>
                      <strong>Format 2</strong> &mdash; Official Police Station Verification Statement PDF
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        Formal statutory statement with Guest Details, Check-in/out, No of Members, Full Address, and Signatures.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 12 }}>
                <button
                  type="button"
                  onClick={handleApplyFilter}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '8px 24px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(37,99,235,0.3)'
                  }}
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: '#e2e8f0',
                    color: '#475569',
                    border: 'none',
                    borderRadius: 4,
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: FORMAT 1 - Interactive Table (Video 24 Frames 0110, 0210)*/}
        {/* ============================================================== */}
        {viewMode === 'format1' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ padding: '10px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                  Filter: {fromDate} to {toDate} &bull; ({filteredList.length} guests)
                </span>
                <input
                  type="text"
                  placeholder="Search guest, room, aadhar, city..."
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setViewMode('format2')}
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '5px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  📄 View Police PDF (Format 2)
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  style={{
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '5px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  📥 Export Excel/CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '5px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  🖨️ Print
                </button>
              </div>
            </div>

            {/* Table matching Frame 0110 & 0210 */}
            <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: '0 12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 8 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#1e293b', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>S.No</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Check In No</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Room No</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Name</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Contact No</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Date</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Time</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Person Pic</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Name (Doc)</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Documnet No</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Documnet Pic</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Address / Occupants</th>
                    <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={13} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                        No guest check-in records found for dates {fromDate} to {toDate}.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((item, idx) => {
                      const guestImg = item.guestImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80';
                      const docImg = item.documentImage || 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=160&auto=format&fit=crop&q=80';
                      return (
                        <tr
                          key={item.checkInNo}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                          }}
                        >
                          <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', fontWeight: 700 }}>{idx + 1}</td>
                          <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', color: '#0369a1', fontWeight: 600 }}>
                            {item.checkInNo}
                          </td>
                          <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', fontWeight: 800, color: '#047857' }}>
                            {item.roomNo}
                          </td>
                          <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', fontWeight: 700, textTransform: 'uppercase' }}>
                            {item.guestName}
                          </td>
                          <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>{item.mobile}</td>
                          <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>{item.checkInDate}</td>
                          <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>{item.checkInTime}</td>

                          {/* Person Pic Thumbnail (Frame 0110, 0210) */}
                          <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <div
                              onClick={() => handleOpenProfilePrint(item)}
                              title="Click to view full 4-photo dossier print sheet"
                              style={{
                                width: 52,
                                height: 52,
                                borderRadius: 4,
                                overflow: 'hidden',
                                border: '1px solid #cbd5e1',
                                display: 'inline-block',
                                cursor: 'pointer',
                                background: '#f1f5f9'
                              }}
                            >
                              <img
                                src={guestImg}
                                alt={item.guestName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          </td>

                          <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', textTransform: 'uppercase', fontWeight: 600 }}>
                            {item.documentName || 'AADHAR CARD'}
                          </td>
                          <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#1e293b' }}>
                            {item.documentNo || '348784787487'}
                          </td>

                          {/* Document Pic Thumbnail (Frame 0115, 0210) */}
                          <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <div
                              onClick={() => handleOpenProfilePrint(item)}
                              title="Click to view ID Proof & Profile Dossier"
                              style={{
                                width: 64,
                                height: 46,
                                borderRadius: 4,
                                overflow: 'hidden',
                                border: '1px solid #cbd5e1',
                                display: 'inline-block',
                                cursor: 'pointer',
                                background: '#f1f5f9'
                              }}
                            >
                              <img
                                src={docImg}
                                alt="ID Proof"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          </td>

                          <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', fontSize: 11 }}>
                            <div>{item.addressLine1 || 'Main Road'} {item.city ? `, ${item.city}` : ''} {item.state ? `, ${item.state}` : ''}</div>
                            {(item.secondGuestName || item.thirdGuestName) && (
                              <div style={{ marginTop: 3, color: '#0369a1', fontWeight: 600 }}>
                                Co-occupants: {[item.secondGuestName, item.thirdGuestName].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenProfilePrint(item)}
                              title="Print 4-Photo Verification Sheet"
                              style={{
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                padding: '4px 8px',
                                fontSize: 11,
                                cursor: 'pointer',
                                fontWeight: 700
                              }}
                            >
                              📸 Dossier
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '10px 18px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: 12, color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>Showing 1 to {filteredList.length} of {filteredList.length} entries</div>
              <div style={{ fontSize: 11, color: '#0369a1' }}>
                Note: In accordance with State Police Directives, daily reports must be submitted within 24 hours of guest arrival.
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: Guest Profile Photo Dossier Print (Frame 0120, 0125, 0220) */}
        {/* ============================================================== */}
        {viewMode === 'profile_print' && selectedProfileCheckIn && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
            {/* Top Toolbar */}
            <div style={{ padding: '10px 18px', background: '#1e293b', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                Guest Verification Photo Dossier &bull; Check-In: {selectedProfileCheckIn.checkInNo} (Room {selectedProfileCheckIn.roomNo})
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '5px 14px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  🖨️ Print Dossier
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode(selectedFormat)}
                  style={{
                    background: '#475569',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '5px 12px',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  ⬅️ Back to Report
                </button>
              </div>
            </div>

            {/* Dossier Document Sheet matching Frame 0120 & 0125 */}
            <div style={{ padding: 24, maxWidth: 880, margin: '0 auto', width: '100%' }}>
              {/* Green info box matching Frame 0120 */}
              <div
                style={{
                  background: '#a7f3d0',
                  border: '1px solid #34d399',
                  borderRadius: 6,
                  padding: '12px 18px',
                  marginBottom: 20,
                  fontSize: 13,
                  color: '#064e3b',
                  lineHeight: '1.6'
                }}
              >
                <div><strong>Primary Guest Name :</strong> {selectedProfileCheckIn.guestName}</div>
                <div><strong>Document No :</strong> {selectedProfileCheckIn.documentNo || '348784787487'} ({selectedProfileCheckIn.documentName || 'Aadhaar Card'})</div>
                {selectedProfileCheckIn.secondGuestName && (
                  <div><strong>2nd Guest Name :</strong> {selectedProfileCheckIn.secondGuestName} ({selectedProfileCheckIn.secondGuestIdNo || 'Verified'})</div>
                )}
                {selectedProfileCheckIn.thirdGuestName && (
                  <div><strong>3rd Guest Name :</strong> {selectedProfileCheckIn.thirdGuestName} ({selectedProfileCheckIn.thirdGuestIdNo || 'Verified'})</div>
                )}
                <div><strong>Hotel Name :</strong> {currentProperty.firmName} &bull; Rayagada (Jurisdiction: Rayagada Police Station)</div>
              </div>

              {/* 2x2 Photo Grid matching Frame 0125 & 0220 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                  marginBottom: 24
                }}
              >
                {/* Photo 1: Primary Guest Face */}
                <div style={{ background: '#ffffff', borderRadius: 6, border: '1px solid #cbd5e1', overflow: 'hidden', padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    1. Primary Guest Face Photograph
                  </div>
                  <div style={{ width: '100%', height: 230, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <img
                      src={selectedProfileCheckIn.guestImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'}
                      alt="Guest Face"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: '#0f172a', fontWeight: 600, marginTop: 4 }}>
                    {selectedProfileCheckIn.guestName}
                  </div>
                </div>

                {/* Photo 2: ID Document Proof */}
                <div style={{ background: '#ffffff', borderRadius: 6, border: '1px solid #cbd5e1', overflow: 'hidden', padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    2. Official Govt ID Proof (Front)
                  </div>
                  <div style={{ width: '100%', height: 230, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <img
                      src={selectedProfileCheckIn.documentImage || 'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=400&auto=format&fit=crop&q=80'}
                      alt="Govt ID Proof"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: '#0f172a', fontWeight: 600, marginTop: 4 }}>
                    {selectedProfileCheckIn.documentName || 'Govt ID'}: {selectedProfileCheckIn.documentNo || '348784787487'}
                  </div>
                </div>

                {/* Photo 3: 2nd Guest / ID Back */}
                <div style={{ background: '#ffffff', borderRadius: 6, border: '1px solid #cbd5e1', overflow: 'hidden', padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    3. {selectedProfileCheckIn.secondGuestName ? `Co-Occupant: ${selectedProfileCheckIn.secondGuestName}` : 'ID Proof (Back / Address Proof)'}
                  </div>
                  <div style={{ width: '100%', height: 230, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <img
                      src={selectedProfileCheckIn.secondGuestDocument || selectedProfileCheckIn.idProofBackImage || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80'}
                      alt="Second Guest Photo"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: '#0f172a', fontWeight: 600, marginTop: 4 }}>
                    {selectedProfileCheckIn.secondGuestName || 'Address Proof Verification'}
                  </div>
                </div>

                {/* Photo 4: 3rd Guest / Vehicle / Registration */}
                <div style={{ background: '#ffffff', borderRadius: 6, border: '1px solid #cbd5e1', overflow: 'hidden', padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    4. {selectedProfileCheckIn.thirdGuestName ? `Co-Occupant: ${selectedProfileCheckIn.thirdGuestName}` : 'Guest Signature / Registration Slip'}
                  </div>
                  <div style={{ width: '100%', height: 230, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <img
                      src={selectedProfileCheckIn.thirdGuestDocument || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'}
                      alt="Third Guest Photo"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: '#0f172a', fontWeight: 600, marginTop: 4 }}>
                    {selectedProfileCheckIn.thirdGuestName || 'Verified Front Office Record'}
                  </div>
                </div>
              </div>

              {/* Bottom Print Button matching Frame 0125 */}
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '8px 32px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(37,99,235,0.4)'
                  }}
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: FORMAT 2 - Official Police Station PDF (Frame 0140)   */}
        {/* ============================================================== */}
        {viewMode === 'format2' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', background: '#e2e8f0', padding: 18 }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, background: '#ffffff', padding: '8px 16px', borderRadius: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                Official Police Verification Document (Format 2) &bull; {fromDate} to {toDate}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setViewMode('format1')}
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '5px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  📋 Switch to Table View (Format 1)
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '5px 16px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  🖨️ Print PDF
                </button>
              </div>
            </div>

            {/* Official PDF Document Layout matching Frame 0134, 0135, 0140 */}
            <div
              style={{
                background: '#ffffff',
                maxWidth: 960,
                margin: '0 auto',
                width: '100%',
                padding: '32px 36px',
                borderRadius: 4,
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                minHeight: 650
              }}
            >
              {/* Hotel Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0284c7', paddingBottom: 12, marginBottom: 16 }}>
                <h2 style={{ margin: '0 0 4px 0', fontSize: 20, color: '#0f172a', fontWeight: 900, textTransform: 'uppercase' }}>
                  {currentProperty.firmName}
                </h2>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  {currentProperty.address} &bull; Phone: {currentProperty.phone} &bull; Email: {currentProperty.email}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginTop: 4 }}>
                  POLICE STATION GUEST ARRIVAL &amp; DEPARTURE STATEMENT
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  Period: <strong>{fromDate}</strong> to <strong>{toDate}</strong> &bull; Police Jurisdiction: Rayagada Police Station
                </div>
              </div>

              {/* Police Table with Solid Blue Header Bar matching Frame 0140 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginTop: 8 }}>
                <thead>
                  <tr style={{ background: '#0284c7', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', border: '1px solid #0284c7', width: '32%' }}>Guest Details</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #0284c7', width: '16%' }}>Check-in Date</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #0284c7', width: '16%' }}>Check-out Date</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #0284c7', width: '12%', textAlign: 'center' }}>No. of Members</th>
                    <th style={{ padding: '8px 12px', border: '1px solid #0284c7', width: '24%' }}>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item, idx) => (
                    <tr
                      key={item.checkInNo}
                      style={{
                        borderBottom: '1px solid #cbd5e1',
                        background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                      }}
                    >
                      {/* Guest Details Column matching Frame 0140 */}
                      <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', fontSize: 12 }}>
                          {item.guestName}
                        </div>
                        <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                          ID: {item.documentNo || '348784787487'} ({item.documentName || 'Aadhaar Card'})
                        </div>
                        {item.secondGuestName && (
                          <div style={{ fontSize: 10, color: '#0369a1', marginTop: 2 }}>
                            {item.secondGuestName} {item.secondGuestIdNo ? `(${item.secondGuestIdNo})` : ''}
                          </div>
                        )}
                        {item.thirdGuestName && (
                          <div style={{ fontSize: 10, color: '#0369a1', marginTop: 1 }}>
                            {item.thirdGuestName} {item.thirdGuestIdNo ? `(${item.thirdGuestIdNo})` : ''}
                          </div>
                        )}
                        <div style={{ fontSize: 9, color: '#64748b', marginTop: 3 }}>
                          Room: <strong>{item.roomNo}</strong> &bull; Check-in No: {item.checkInNo}
                        </div>
                      </td>

                      {/* Check-in Date Column */}
                      <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                        <div>{item.checkInDate}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{item.checkInTime}</div>
                      </td>

                      {/* Check-out Date Column */}
                      <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                        <div>{item.checkInDate}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>11:00 AM (Exp.)</div>
                      </td>

                      {/* No. of Members Column */}
                      <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', verticalAlign: 'top', textAlign: 'center', fontWeight: 700 }}>
                        {item.numberOfGuests || (1 + (item.secondGuestName ? 1 : 0) + (item.thirdGuestName ? 1 : 0))}
                      </td>

                      {/* Address Column matching Frame 0140 */}
                      <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', verticalAlign: 'top', textTransform: 'uppercase', fontSize: 10, lineHeight: '1.4' }}>
                        {item.addressLine1 && <div>{item.addressLine1}</div>}
                        {item.addressLine2 && <div>{item.addressLine2}</div>}
                        <div>
                          {[item.city, item.state, item.pinCode].filter(Boolean).join(', ')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Official Signatures & Verification Footer matching Frame 0140 */}
              <div style={{ marginTop: 40, borderTop: '1px solid #cbd5e1', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 10, color: '#475569' }}>
                  <div style={{ textAlign: 'center', width: 200 }}>
                    <div style={{ height: 40 }}></div>
                    <div style={{ borderTop: '1px dashed #64748b', paddingTop: 4, fontWeight: 700 }}>
                      Front Office Receptionist
                    </div>
                    <div style={{ fontSize: 9 }}>Prepared By: {currentUser.userName}</div>
                  </div>

                  <div style={{ textAlign: 'center', width: 200 }}>
                    <div style={{ height: 40 }}></div>
                    <div style={{ borderTop: '1px dashed #64748b', paddingTop: 4, fontWeight: 700 }}>
                      General Manager / Hotel Seal
                    </div>
                    <div style={{ fontSize: 9 }}>SRI SAI VASUDEV RESIDENCY</div>
                  </div>

                  <div style={{ textAlign: 'center', width: 220 }}>
                    <div style={{ height: 40 }}></div>
                    <div style={{ borderTop: '1px dashed #64748b', paddingTop: 4, fontWeight: 700, color: '#0369a1' }}>
                      Police Station Receiving Officer
                    </div>
                    <div style={{ fontSize: 9 }}>Seal, Signature &amp; Date Received</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: 9, color: '#94a3b8', marginTop: 24 }}>
                  Page 1 of 1 &bull; System Generated by SRI SAI VASUDEV RESIDENCY ERP &bull; Compliance with Section 176 IPC &amp; Local Police Regulations
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
