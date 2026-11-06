import React, { useState } from 'react';
import { PmsStore } from '../../services/pmsStore';
import { getRoomPortalUrl, getQrCodeImageUrl } from '../../utils/qrCodeGenerator';
import type { RoomQrStandeeConfig } from '../../types/pmsModels';

interface RoomQrCodeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGuestPortal?: (roomNo: string) => void;
}

export const RoomQrCodeManagerModal: React.FC<RoomQrCodeManagerModalProps> = ({
  isOpen,
  onClose,
  onOpenGuestPortal
}) => {
  const [selectedFloor, setSelectedFloor] = useState<'All' | '0' | '1'>('All');
  const [selectedRoomNo, setSelectedRoomNo] = useState<string>('101');
  const [activeTab, setActiveTab] = useState<'standees' | 'batch_print' | 'tier_matrix'>('standees');

  if (!isOpen) return null;

  const standees: RoomQrStandeeConfig[] = PmsStore.get18RoomStandees();
  
  const filteredStandees = standees.filter(s => {
    if (selectedFloor === 'All') return true;
    return String(s.floor) === selectedFloor;
  });

  const activeStandee = standees.find(s => s.room_no === selectedRoomNo) || standees[0];
  const activeTierConfig = PmsStore.getTieredAmenities(activeStandee?.room_type || 'Deluxe');

  const handlePrintSingle = (roomNo: string) => {
    const standee = standees.find(s => s.room_no === roomNo);
    if (!standee) return;

    const tier = PmsStore.getTieredAmenities(standee.room_type);
    const portalUrl = getRoomPortalUrl(standee.room_no);
    const qrImg = getQrCodeImageUrl(portalUrl, 300);

    const printWin = window.open('', '_blank', 'width=700,height=900');
    if (!printWin) {
      alert('Please allow popups to print room standees.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Room ${standee.room_no} QR Standee - Sri Sai Vasudev Residency</title>
        <style>
          @page { size: A5 portrait; margin: 10mm; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #ffffff;
            color: #1e293b;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .standee-card {
            width: 130mm;
            border: 3px solid #d4af37;
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .hotel-title {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 2px;
          }
          .hotel-sub {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 14px;
          }
          .room-badge {
            background: #0f172a;
            color: #d4af37;
            padding: 8px 18px;
            border-radius: 10px;
            display: inline-block;
            margin-bottom: 14px;
          }
          .room-num {
            font-size: 26px;
            font-weight: 900;
          }
          .room-type {
            font-size: 11px;
            color: #ffffff;
            font-weight: 600;
          }
          .qr-box {
            padding: 10px;
            display: inline-block;
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            margin-bottom: 12px;
          }
          .scan-title {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .scan-desc {
            font-size: 11px;
            color: #475569;
            margin-bottom: 14px;
            line-height: 1.4;
          }
          .tier-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px;
            text-align: left;
            font-size: 10.5px;
          }
          .tier-title {
            color: #b45309;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .tier-items {
            color: #475569;
          }
          .footer-note {
            margin-top: 14px;
            font-size: 9.5px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="standee-card">
          <div class="hotel-title">Sri Sai Vasudev Residency</div>
          <div class="hotel-sub">Rayagada, Odisha • Guest Room Self-Service</div>

          <div class="room-badge">
            <div class="room-num">ROOM ${standee.room_no}</div>
            <div class="room-type">${standee.room_type} (${standee.floor === 0 ? 'Ground Floor' : '1st Floor'})</div>
          </div>

          <div class="qr-box">
            <img src="${qrImg}" width="200" height="200" />
          </div>

          <div class="scan-title">📱 Scan with any smartphone</div>
          <div class="scan-desc">
            Order delicious food from <b>Vasudev Rasoi</b> and request your room's complimentary amenities directly to your door!
          </div>

          <div class="tier-box">
            <div class="tier-title">⭐ ${tier.badge}</div>
            <div class="tier-items">
              ${tier.amenities.map(a => `${a.icon} ${a.name}`).join(' • ')}
            </div>
          </div>

          <div class="footer-note">
            Front Desk Assistance: Ext. 9 / +91 7999663696
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          }
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleBatchPrintAll = () => {
    const printWin = window.open('', '_blank', 'width=800,height=950');
    if (!printWin) {
      alert('Please allow popups to batch print all 18 room standees.');
      return;
    }

    const cardsHtml = standees.map(s => {
      const tier = PmsStore.getTieredAmenities(s.room_type);
      const portalUrl = getRoomPortalUrl(s.room_no);
      const qrImg = getQrCodeImageUrl(portalUrl, 260);

      return `
        <div class="standee-card page-break">
          <div class="hotel-title">Sri Sai Vasudev Residency</div>
          <div class="hotel-sub">Rayagada, Odisha • Guest Room Self-Service</div>

          <div class="room-badge">
            <div class="room-num">ROOM ${s.room_no}</div>
            <div class="room-type">${s.room_type} (${s.floor === 0 ? 'Ground Floor' : '1st Floor'})</div>
          </div>

          <div class="qr-box">
            <img src="${qrImg}" width="180" height="180" />
          </div>

          <div class="scan-title">📱 Scan with any smartphone</div>
          <div class="scan-desc">
            Order food from <b>Vasudev Rasoi</b> & request complimentary room amenities.
          </div>

          <div class="tier-box">
            <div class="tier-title">⭐ ${tier.badge}</div>
            <div class="tier-items">
              ${tier.amenities.map(a => `${a.icon} ${a.name}`).join(' • ')}
            </div>
          </div>

          <div class="footer-note">
            Front Desk: Ext. 9 / +91 7999663696
          </div>
        </div>
      `;
    }).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>All 18 Room Standees - Sri Sai Vasudev Residency</title>
        <style>
          @page { size: A5 portrait; margin: 8mm; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #ffffff;
            color: #1e293b;
            margin: 0;
            padding: 10px;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          .standee-card {
            width: 130mm;
            margin: 0 auto 30px auto;
            border: 2.5px solid #d4af37;
            border-radius: 14px;
            padding: 18px;
            text-align: center;
          }
          .hotel-title {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 2px;
          }
          .hotel-sub {
            font-size: 10px;
            color: #64748b;
            margin-bottom: 12px;
          }
          .room-badge {
            background: #0f172a;
            color: #d4af37;
            padding: 6px 14px;
            border-radius: 8px;
            display: inline-block;
            margin-bottom: 10px;
          }
          .room-num {
            font-size: 24px;
            font-weight: 900;
          }
          .room-type {
            font-size: 10px;
            color: #ffffff;
            font-weight: 600;
          }
          .qr-box {
            padding: 8px;
            display: inline-block;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            margin-bottom: 10px;
          }
          .scan-title {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .scan-desc {
            font-size: 10.5px;
            color: #475569;
            margin-bottom: 12px;
            line-height: 1.3;
          }
          .tier-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px;
            text-align: left;
            font-size: 9.5px;
          }
          .tier-title {
            color: #b45309;
            font-weight: 700;
            margin-bottom: 2px;
          }
          .tier-items {
            color: #475569;
          }
          .footer-note {
            margin-top: 10px;
            font-size: 9px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        ${cardsHtml}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          }
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      zIndex: 9000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#0a1120',
        border: '2px solid #d4af37',
        borderRadius: '16px',
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        color: '#f8fafc',
        overflow: 'hidden'
      }}>
        {/* Modal Top Header */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #0d1b2a 0%, #1e293b 100%)',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#d4af37', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Modules 3 & 4: Room Service & Guest Portal
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📱 18-Room QR Standee Generator & Tiered Amenities</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleBatchPrintAll}
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #b89628 100%)',
                color: '#0d1b2a',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🖨️ Batch Print All 18 Rooms</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sub-Nav Bar */}
        <div style={{
          padding: '10px 20px',
          background: '#0d1627',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('standees')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'standees' ? '#d4af37' : '#1e293b',
                color: activeTab === 'standees' ? '#0d1b2a' : '#cbd5e1'
              }}
            >
              🖼️ Individual Room Standees
            </button>

            <button
              onClick={() => setActiveTab('tier_matrix')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'tier_matrix' ? '#d4af37' : '#1e293b',
                color: activeTab === 'tier_matrix' ? '#0d1b2a' : '#cbd5e1'
              }}
            >
              📋 Tiered Amenities Matrix
            </button>
          </div>

          {/* Floor filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <span style={{ color: '#94a3b8' }}>Filter Floor:</span>
            {(['All', '0', '1'] as const).map(fl => (
              <button
                key={fl}
                onClick={() => setSelectedFloor(fl)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: selectedFloor === fl ? '#38bdf8' : '#1e293b',
                  color: selectedFloor === fl ? '#0d1b2a' : '#cbd5e1'
                }}
              >
                {fl === 'All' ? 'All 18 Rooms' : fl === '0' ? 'Ground Floor (101-107)' : '1st Floor (201-211)'}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'standees' && (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
              {/* Left Column: 18 Rooms Selection List */}
              <div style={{
                background: '#0d1627',
                borderRadius: '12px',
                padding: '14px',
                border: '1px solid #1e293b',
                maxHeight: '62vh',
                overflowY: 'auto'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#d4af37', marginBottom: '10px', textTransform: 'uppercase' }}>
                  Select Physical Room ({filteredStandees.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {filteredStandees.map(s => {
                    const isSelected = s.room_no === selectedRoomNo;
                    return (
                      <div
                        key={s.room_no}
                        onClick={() => setSelectedRoomNo(s.room_no)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: isSelected ? '1.5px solid #d4af37' : '1px solid #1e293b',
                          background: isSelected ? 'rgba(212, 175, 55, 0.12)' : '#131f33',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 800, color: isSelected ? '#d4af37' : '#f8fafc', fontSize: '13.5px' }}>
                            Room {s.room_no}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>
                            • {s.room_type}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px', background: '#1e293b', padding: '2px 6px', borderRadius: '4px', color: '#cbd5e1' }}>
                          Fl {s.floor}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Active Room Standee Preview & Actions */}
              {activeStandee && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Standee Preview Card (A5 Table-Tent format) */}
                  <div style={{
                    width: '380px',
                    padding: '24px',
                    background: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)',
                    borderRadius: '16px',
                    border: '3px solid #d4af37',
                    textAlign: 'center',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '11px', color: '#d4af37', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Sri Sai Vasudev Residency
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '12px' }}>
                      Rayagada, Odisha • Guest Room Self-Service
                    </div>

                    <div style={{
                      background: 'rgba(212, 175, 55, 0.15)',
                      border: '1.5px solid #d4af37',
                      borderRadius: '10px',
                      padding: '8px 16px',
                      display: 'inline-block',
                      marginBottom: '14px'
                    }}>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>
                        ROOM {activeStandee.room_no}
                      </div>
                      <div style={{ fontSize: '11px', color: '#d4af37', fontWeight: 700 }}>
                        {activeStandee.room_type} ({activeStandee.floor === 0 ? 'Ground Floor' : '1st Floor'})
                      </div>
                    </div>

                    {/* QR Code Container */}
                    <div style={{
                      background: '#ffffff',
                      padding: '10px',
                      borderRadius: '12px',
                      display: 'inline-block',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
                      marginBottom: '12px'
                    }}>
                      <img
                        src={getQrCodeImageUrl(getRoomPortalUrl(activeStandee.room_no), 240)}
                        alt={`Room ${activeStandee.room_no} QR`}
                        style={{ width: '180px', height: '180px', display: 'block' }}
                      />
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9', marginBottom: '4px' }}>
                      📱 Scan with any phone camera
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '12px', lineHeight: 1.3 }}>
                      Order food from <b>Vasudev Rasoi</b> & request your room tier's complimentary amenities instantly!
                    </div>

                    {/* Tier Amenities preview pill */}
                    <div style={{
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '10.5px',
                      textAlign: 'left'
                    }}>
                      <div style={{ color: '#d4af37', fontWeight: 800, marginBottom: '3px' }}>
                        ⭐ {activeTierConfig.badge}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '10px', lineHeight: 1.3 }}>
                        {activeTierConfig.amenities.map(a => `${a.icon} ${a.name}`).join(' • ')}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this Standee */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handlePrintSingle(activeStandee.room_no)}
                      style={{
                        background: 'linear-gradient(135deg, #d4af37 0%, #b89628 100%)',
                        color: '#0d1b2a',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 18px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>🖨️ Print Room {activeStandee.room_no} Standee</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onOpenGuestPortal) {
                          onOpenGuestPortal(activeStandee.room_no);
                        } else {
                          window.open(getRoomPortalUrl(activeStandee.room_no), '_blank');
                        }
                      }}
                      style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid #38bdf8',
                        color: '#38bdf8',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>📱 Open Guest View</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TIERED AMENITIES MATRIX TABLE */}
          {activeTab === 'tier_matrix' && (
            <div>
              <div style={{
                background: '#0d1627',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #1e293b',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#d4af37', marginBottom: '4px' }}>
                  Room Category Tiered Amenities Mapping
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Strictly configured to prevent supply leakage while providing tailored luxury to premium guests.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Tier 1: Deluxe & Classic Studio */}
                <div style={{
                  background: '#131f33',
                  borderRadius: '12px',
                  padding: '18px',
                  border: '1.5px solid #334155'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                      Standard Comfort Tier
                    </span>
                    <span style={{ fontSize: '11px', background: '#3b82f6', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                      Deluxe & Classic Studio
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
                    Applicable to: Rooms 101, 102, 103, 104, 105, 202, 203, 204, 205 (9 Rooms total)
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { icon: '🛁', name: 'General White Towels', desc: '100% cotton fresh bath & hand towels' },
                      { icon: '🛏️', name: 'Comforter', desc: 'Warm all-season micro-fiber comforter' },
                      { icon: '🛋️', name: 'Duvet', desc: 'Soft down-alternative duvet for AC comfort' },
                      { icon: '🧼', name: 'Soaps', desc: 'Herbal Medimix / Mysore Sandal bathing bars' },
                      { icon: '🧴', name: 'Shampoos', desc: 'Daily conditioning hair cleanser sachets' }
                    ].map(a => (
                      <div key={a.name} style={{
                        background: '#0d1627',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        border: '1px solid #1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{ fontSize: '20px' }}>{a.icon}</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>{a.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{a.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tier 2: Premium & Executive */}
                <div style={{
                  background: '#131f33',
                  borderRadius: '12px',
                  padding: '18px',
                  border: '1.5px solid #d4af37'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                      Executive & Luxury Tier
                    </span>
                    <span style={{ fontSize: '11px', background: '#d4af37', color: '#0d1b2a', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                      Premium & Executive
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
                    Applicable to: Rooms 106, 107, 201, 206, 207, 208, 209, 210, 211 (9 Rooms total)
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { icon: '✨', name: 'Moisturizer', desc: 'Botanical skin lotion bottle (Forest Essentials/Biotique)' },
                      { icon: '🧴', name: 'Shampoo', desc: 'Enriched nourishing herbal shampoo bottle' },
                      { icon: '🪥', name: 'Toothbrush (Dental Kit)', desc: 'Eco-friendly bamboo toothbrush with herbal paste' },
                      { icon: '🫖', name: 'Electric Kettle', desc: 'In-room kettle with tea/coffee/sugar/creamer sachets' },
                      { icon: '💨', name: 'Hair Dryer', desc: '1200W ionic dual-heat styling dryer' }
                    ].map(a => (
                      <div key={a.name} style={{
                        background: '#0d1627',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        border: '1px solid #1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{ fontSize: '20px' }}>{a.icon}</span>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#d4af37' }}>{a.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{a.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
