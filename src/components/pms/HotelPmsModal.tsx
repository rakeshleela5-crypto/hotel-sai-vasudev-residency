import React, { useState } from 'react';
import { RoomDashboardModal } from './RoomDashboardModal';
import { PmsHomeDashboardModal } from './PmsHomeDashboardModal';
import { BookingCalendarModal } from './BookingCalendarModal';
import { UnconfirmedBookingsModal } from './UnconfirmedBookingsModal';
import { FbbReportModal } from './FbbReportModal';
import { KotEntryModal } from './KotEntryModal';
import { FoodBillModal } from './FoodBillModal';
import './pmsStyles.css';

interface HotelPmsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotelPmsModal: React.FC<HotelPmsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'hub'>('matrix');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [masterMenuOpen, setMasterMenuOpen] = useState(false);
  const [entryMenuOpen, setEntryMenuOpen] = useState(true);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [otherSubmenuOpen, setOtherSubmenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calendar & Unconfirmed Bookings Modals
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isUnconfirmedOpen, setIsUnconfirmedOpen] = useState(false);
  const [isFbbReportOpen, setIsFbbReportOpen] = useState(false);
  const [isKotModalOpen, setIsKotModalOpen] = useState(false);
  const [isFoodBillModalOpen, setIsFoodBillModalOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="pms-overlay" onClick={onClose}>
        <div className="pms-window" onClick={e => e.stopPropagation()}>
          {/* Master Header matching Video 01 & 02 */}
          <header className="pms-header">
            <div className="pms-header-left">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}
                title="Toggle Menu"
              >
                ☰
              </button>
              <h2 className="pms-brand-title">
                HOTEL MANAGEMENT SYSTEM &bull; PMS
              </h2>

              <div className="pms-header-search">
                <input
                  type="text"
                  placeholder="Search room, guest, booking..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pms-search-input"
                />
                <button type="button" className="pms-search-btn">
                  🔍
                </button>
              </div>
            </div>

            <div className="pms-header-right">
              {/* Quick Action Badges from Video 02 Transcripts */}
              <button
                type="button"
                onClick={() => setIsUnconfirmedOpen(true)}
                style={{
                  background: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '3px 10px',
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>🔔</span>
                <span>Unconfirmed (1)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCalendarOpen(true)}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '3px 10px',
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>📅</span>
                <span>Calendar</span>
              </button>

              <div className="pms-user-tag">
                <span>👤</span>
                <span>Reception Desk (Admin)</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="pms-close-btn"
                title="Close PMS & Return to Guest Website"
              >
                ✕
              </button>
            </div>
          </header>

          {/* Master PMS Body Layout */}
          <div className="pms-body">
            {/* Left Dark Sidebar matching Frames 0005, 0020, 0065, 0090 */}
            {sidebarOpen && (
              <aside className="pms-sidebar">
                <div
                  className={`pms-nav-item ${activeTab === 'matrix' ? 'active' : ''}`}
                  onClick={() => setActiveTab('matrix')}
                >
                  <div className="pms-nav-item-left">
                    <span>🏢</span>
                    <span>Room Dashboard</span>
                  </div>
                </div>

                <div
                  className={`pms-nav-item ${activeTab === 'hub' ? 'active' : ''}`}
                  onClick={() => setActiveTab('hub')}
                >
                  <div className="pms-nav-item-left">
                    <span>🏠</span>
                    <span>Home Hub (16 Tiles)</span>
                  </div>
                </div>

                {/* Master Submenu */}
                <div 
                  className="pms-nav-item" 
                  onClick={() => setMasterMenuOpen(!masterMenuOpen)}
                  style={{ background: masterMenuOpen ? '#2c3136' : undefined }}
                >
                  <div className="pms-nav-item-left">
                    <span>📋</span>
                    <span>Master</span>
                  </div>
                  <span>{masterMenuOpen ? '▾' : '›'}</span>
                </div>

                {masterMenuOpen && (
                  <div style={{ background: '#1a1e22', paddingLeft: 12, fontSize: 12 }}>
                    <div className="pms-nav-item" onClick={() => alert('Item Master: Manage restaurant food items, codes, and tariffs.')}>
                      <span>🍽️ Item Master</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => alert('Account Master: Chart of accounts, guest & vendor ledgers.')}>
                      <span>💼 Account Master</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => alert('Room Master: Configure room numbers, categories, and rack rates.')}>
                      <span>🛏️ Room Master</span>
                    </div>
                    <div 
                      className="pms-nav-item"
                      onClick={() => setOtherSubmenuOpen(!otherSubmenuOpen)}
                      style={{ justifyContent: 'space-between' }}
                    >
                      <span>⚙️ Other</span>
                      <span>{otherSubmenuOpen ? '▾' : '›'}</span>
                    </div>

                    {otherSubmenuOpen && (
                      <div style={{ background: '#111417', paddingLeft: 12, fontSize: 11 }}>
                        <div className="pms-nav-item" onClick={() => alert('Locker Master: Safe deposit locker management.')}>
                          <span>🔒 Locker</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => alert('GST, TAX, VAT: Tax slabs (12%, 18%, 5%) configuration.')}>
                          <span>⚖️ GST,TAX,VAT</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => alert('Business Source: Manage channels (Walk-in, OYO, MMT, Agoda, Corporate).')}>
                          <span>🌐 Business Source</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => alert('Other Charge: Extra bed, laundry, early check-in charges.')}>
                          <span>➕ Other Charge</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => alert('Voucher Type: Configure receipt & invoice numbering sequences.')}>
                          <span>📄 Voucher Type</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Entry Submenu (Video 02 Transcript [15:00]) */}
                <div 
                  className="pms-nav-item" 
                  onClick={() => setEntryMenuOpen(!entryMenuOpen)}
                  style={{ background: entryMenuOpen ? '#2c3136' : undefined }}
                >
                  <div className="pms-nav-item-left">
                    <span>📝</span>
                    <span>Entry</span>
                  </div>
                  <span>{entryMenuOpen ? '▾' : '›'}</span>
                </div>

                {entryMenuOpen && (
                  <div style={{ background: '#1a1e22', paddingLeft: 12, fontSize: 12 }}>
                    <div className="pms-nav-item" onClick={() => setIsUnconfirmedOpen(true)}>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>🔔 Unconfirmed Booking (1)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setActiveTab('matrix')}>
                      <span>🏨 Room Booking</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setActiveTab('matrix')}>
                      <span>🚪 Check In</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsKotModalOpen(true)}>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>🍴 Room Service (KOT Entry)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsFoodBillModalOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>🧾 Food Bill (FBB)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setActiveTab('matrix')}>
                      <span>🧾 Room Check Out</span>
                    </div>
                  </div>
                )}

                {/* Report Submenu (Video 02 Transcript [07:30, 15:45]) */}
                <div 
                  className="pms-nav-item" 
                  onClick={() => setReportMenuOpen(!reportMenuOpen)}
                  style={{ background: reportMenuOpen ? '#2c3136' : undefined }}
                >
                  <div className="pms-nav-item-left">
                    <span>📊</span>
                    <span>Report</span>
                  </div>
                  <span>{reportMenuOpen ? '▾' : '›'}</span>
                </div>

                {reportMenuOpen && (
                  <div style={{ background: '#1a1e22', paddingLeft: 12, fontSize: 12 }}>
                    <div className="pms-nav-item" onClick={() => setIsCalendarOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>📅 Booking Calendar</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => alert('Daily Check-in Report')}>
                      <span>📋 Check-in Report</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => alert('Police Station Front Office Report')}>
                      <span>👮 Police Station Report</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsFbbReportOpen(true)}>
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>🍴 FBB Report (Food &amp; Beverage)</span>
                    </div>
                  </div>
                )}

                <div className="pms-nav-item">
                  <div className="pms-nav-item-left">
                    <span>🏨</span>
                    <span>Hotel</span>
                  </div>
                  <span>›</span>
                </div>

                <div className="pms-nav-item">
                  <div className="pms-nav-item-left">
                    <span>⚡</span>
                    <span>Activity</span>
                  </div>
                  <span>›</span>
                </div>

                <div className="pms-nav-item">
                  <div className="pms-nav-item-left">
                    <span>⚙️</span>
                    <span>Setting</span>
                  </div>
                  <span>›</span>
                </div>

                <div className="pms-nav-item" onClick={() => alert('Help > Software Video Tutorials (Data House Technologies)')}>
                  <div className="pms-nav-item-left">
                    <span>❓</span>
                    <span>Help &amp; Video Training</span>
                  </div>
                  <span>›</span>
                </div>

                <div className="pms-sidebar-footer">
                  <div>Logged in as: <strong>Hotel Staff</strong></div>
                  <div style={{ marginTop: 4, color: '#4ade80' }}>● System Online</div>
                </div>
              </aside>
            )}

            {/* Main Dynamic View: Matrix Grid vs Home Hub */}
            {activeTab === 'matrix' ? (
              <RoomDashboardModal 
                onSwitchToHomeHub={() => setActiveTab('hub')}
                onOpenCalendar={() => setIsCalendarOpen(true)}
              />
            ) : (
              <PmsHomeDashboardModal onOpenRoomMatrix={() => setActiveTab('matrix')} />
            )}
          </div>
        </div>
      </div>

      {/* Booking Calendar Modal */}
      <BookingCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />

      {/* Unconfirmed Bookings Modal */}
      <UnconfirmedBookingsModal
        isOpen={isUnconfirmedOpen}
        onClose={() => setIsUnconfirmedOpen(false)}
        onOpenCalendar={() => {
          setIsUnconfirmedOpen(false);
          setIsCalendarOpen(true);
        }}
      />

      {/* FBB Report Modal */}
      <FbbReportModal
        isOpen={isFbbReportOpen}
        onClose={() => setIsFbbReportOpen(false)}
      />

      {/* Kot Entry Modal */}
      <KotEntryModal
        isOpen={isKotModalOpen}
        onClose={() => setIsKotModalOpen(false)}
      />

      {/* Food Bill Modal */}
      <FoodBillModal
        isOpen={isFoodBillModalOpen}
        onClose={() => setIsFoodBillModalOpen(false)}
      />
    </>
  );
};
