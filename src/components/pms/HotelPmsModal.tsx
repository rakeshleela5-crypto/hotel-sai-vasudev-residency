import React, { useState } from 'react';
import { RoomDashboardModal } from './RoomDashboardModal';
import { PmsHomeDashboardModal } from './PmsHomeDashboardModal';
import { BookingCalendarModal } from './BookingCalendarModal';
import { UnconfirmedBookingsModal } from './UnconfirmedBookingsModal';
import { FbbReportModal } from './FbbReportModal';
import { KotEntryModal } from './KotEntryModal';
import { FoodBillModal } from './FoodBillModal';
import { AdvanceReceiptModal } from './AdvanceReceiptModal';
import { PartyLedgerModal } from './PartyLedgerModal';
import { RoomMasterModal } from './RoomMasterModal';
import { TableMasterModal } from './TableMasterModal';
import { ItemMasterModal } from './ItemMasterModal';
import { OtherMasterModal } from './OtherMasterModal';
import { BusinessSettingModal } from './BusinessSettingModal';
import { CompanyInfoModal } from './CompanyInfoModal';
import { RoomShiftModal } from './RoomShiftModal';
import { RoomCheckInRegisterModal } from './RoomCheckInRegisterModal';
import { NewRoomCheckInModal } from './NewRoomCheckInModal';
import { KitchenDashboardModal } from './KitchenDashboardModal';
import { RestaurantKotRegisterModal } from './RestaurantKotRegisterModal';
import { RestaurantTableDashboardModal } from './RestaurantTableDashboardModal';
import { ShiftTableModal } from './ShiftTableModal';
import { NcKotRegisterModal } from './NcKotRegisterModal';
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
  const [settingMenuOpen, setSettingMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calendar & Unconfirmed Bookings Modals
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isUnconfirmedOpen, setIsUnconfirmedOpen] = useState(false);
  const [isFbbReportOpen, setIsFbbReportOpen] = useState(false);
  const [isKotModalOpen, setIsKotModalOpen] = useState(false);
  const [selectedKotTable, setSelectedKotTable] = useState<string | undefined>(undefined);
  const [isFoodBillModalOpen, setIsFoodBillModalOpen] = useState(false);
  const [selectedBillTable, setSelectedBillTable] = useState<string | undefined>(undefined);
  const [isAdvanceReceiptOpen, setIsAdvanceReceiptOpen] = useState(false);
  const [isPartyLedgerOpen, setIsPartyLedgerOpen] = useState(false);

  // Video 08 Master Modals
  const [isRoomMasterOpen, setIsRoomMasterOpen] = useState(false);
  const [isTableMasterOpen, setIsTableMasterOpen] = useState(false);
  const [isItemMasterOpen, setIsItemMasterOpen] = useState(false);
  const [isOtherMasterOpen, setIsOtherMasterOpen] = useState(false);
  const [otherMasterTab, setOtherMasterTab] = useState<'gst' | 'businessSource' | 'voucherType'>('gst');

  // Video 09 Business Setting Modal (12 Hour vs 24 Hour Policy)
  const [isBusinessSettingOpen, setIsBusinessSettingOpen] = useState(false);

  // Video 10 Company Info Modal (Local vs Interstate GST & State Codes)
  const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState(false);
  const [roomRefreshTrigger, setRoomRefreshTrigger] = useState(0);

  // Video 11 Room Shifting & Check In Register Modals
  const [isRoomShiftOpen, setIsRoomShiftOpen] = useState(false);
  const [selectedRoomForShift, setSelectedRoomForShift] = useState<string | undefined>(undefined);
  const [isCheckInRegisterOpen, setIsCheckInRegisterOpen] = useState(false);
  const [isNewCheckInOpen, setIsNewCheckInOpen] = useState(false);

  // Video 12 Kitchen Dashboard (KDS) & Restaurant KOT Register Modals
  const [isKitchenDashboardOpen, setIsKitchenDashboardOpen] = useState(false);
  const [isRestaurantKotOpen, setIsRestaurantKotOpen] = useState(false);

  // Video 13 Restaurant Table Matrix, Table Shifting, NC KOT Register
  const [isTableDashboardOpen, setIsTableDashboardOpen] = useState(false);
  const [isShiftTableOpen, setIsShiftTableOpen] = useState(false);
  const [isNcKotRegisterOpen, setIsNcKotRegisterOpen] = useState(false);

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
                    <div className="pms-nav-item" onClick={() => setIsItemMasterOpen(true)}>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>🍽️ Item Master</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsPartyLedgerOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 600 }}>💼 Account Master (Ledgers)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsRoomMasterOpen(true)}>
                      <span style={{ color: '#4ade80', fontWeight: 600 }}>🛏️ Room Master</span>
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
                        <div className="pms-nav-item" onClick={() => setIsTableMasterOpen(true)}>
                          <span style={{ color: '#fcd34d', fontWeight: 600 }}>🍽️ Table (Dine-in / KOT)</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => alert('Godown (Store): Multi-location inventory & store transfer.')}>
                          <span>🏬 Godown (Store)</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => alert('Locker Master: Safe deposit locker management.')}>
                          <span>🔒 Locker</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => { setOtherMasterTab('gst'); setIsOtherMasterOpen(true); }}>
                          <span>⚖️ GST,TAX,VAT</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => { setOtherMasterTab('businessSource'); setIsOtherMasterOpen(true); }}>
                          <span>🌐 Business Source</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => alert('Other Charge: Extra bed, laundry, early check-in charges.')}>
                          <span>➕ Other Charge</span>
                        </div>
                        <div className="pms-nav-item" onClick={() => { setOtherMasterTab('voucherType'); setIsOtherMasterOpen(true); }}>
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
                    <div className="pms-nav-item" onClick={() => setIsCheckInRegisterOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>📋 Room Check In Register</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsNewCheckInOpen(true)}>
                      <span>🚪 New Check In</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => { setSelectedRoomForShift(undefined); setIsRoomShiftOpen(true); }}>
                      <span style={{ color: '#06b6d4', fontWeight: 800 }}>🔄 Room Shifting (Video 11)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsKotModalOpen(true)}>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>🍴 Room Service (KOT Entry)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsKitchenDashboardOpen(true)}>
                      <span style={{ color: '#eab308', fontWeight: 800 }}>🍳 Kitchen Dashboard (KDS - Video 12)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsRestaurantKotOpen(true)}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>🍽️ Restaurant KOT Register</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsTableDashboardOpen(true)}>
                      <span style={{ color: '#84cc16', fontWeight: 800 }}>🏬 Restaurant Table Matrix (Video 13)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsShiftTableOpen(true)}>
                      <span style={{ color: '#f43f5e', fontWeight: 700 }}>🔁 Shift Table (Video 13)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsNcKotRegisterOpen(true)}>
                      <span style={{ color: '#ec4899', fontWeight: 800 }}>🍽️ NC KOT Register (Video 13)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsFoodBillModalOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>🧾 Food Bill (FBB)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsAdvanceReceiptOpen(true)}>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>💵 Room Advance Receipt</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setActiveTab('matrix')}>
                      <span>🧾 Room Check Out</span>
                    </div>
                  </div>
                )}

                {/* Report Submenu (Video 02 Transcript [07:30, 15:45] & Video 06) */}
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
                    <div className="pms-nav-item" onClick={() => setIsPartyLedgerOpen(true)}>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>📑 Party &amp; Guest Ledger</span>
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

                {/* Setting Submenu (Video 09 Frame 0120 & 0200) */}
                <div 
                  className="pms-nav-item" 
                  onClick={() => setSettingMenuOpen(!settingMenuOpen)}
                  style={{ background: settingMenuOpen ? '#2c3136' : undefined }}
                >
                  <div className="pms-nav-item-left">
                    <span>⚙️</span>
                    <span>Setting</span>
                  </div>
                  <span>{settingMenuOpen ? '▾' : '›'}</span>
                </div>

                {settingMenuOpen && (
                  <div style={{ background: '#1a1e22', paddingLeft: 12, fontSize: 12 }}>
                    <div className="pms-nav-item" onClick={() => setIsCompanyInfoOpen(true)}>
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>🏢 Company Info (/company_info_form)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => setIsBusinessSettingOpen(true)}>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>⚙️ Business Setting (/businesssettings/create)</span>
                    </div>
                    <div className="pms-nav-item" onClick={() => alert('Printer & Receipt Template Setup')}>
                      <span>🖨️ Printer &amp; POS Setup</span>
                    </div>
                  </div>
                )}

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
                key={roomRefreshTrigger}
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
        onClose={() => {
          setIsKotModalOpen(false);
          setSelectedKotTable(undefined);
        }}
        defaultTableNo={selectedKotTable}
        defaultServiceType={selectedKotTable ? 'Restaurant' : undefined}
        onKotSaved={() => setRoomRefreshTrigger(prev => prev + 1)}
      />

      {/* Food Bill Modal */}
      <FoodBillModal
        isOpen={isFoodBillModalOpen}
        onClose={() => {
          setIsFoodBillModalOpen(false);
          setSelectedBillTable(undefined);
        }}
        defaultTableNo={selectedBillTable}
        onBillSaved={() => setRoomRefreshTrigger(prev => prev + 1)}
      />

      {/* Advance Receipt Modal (Video 06) */}
      <AdvanceReceiptModal
        isOpen={isAdvanceReceiptOpen}
        onClose={() => setIsAdvanceReceiptOpen(false)}
      />

      {/* Party & Guest Ledger Modal (Video 06) */}
      <PartyLedgerModal
        isOpen={isPartyLedgerOpen}
        onClose={() => setIsPartyLedgerOpen(false)}
      />

      {/* Room Master & Room Type Master Modal (Video 08) */}
      <RoomMasterModal
        isOpen={isRoomMasterOpen}
        onClose={() => setIsRoomMasterOpen(false)}
        onRoomsChanged={() => setRoomRefreshTrigger(prev => prev + 1)}
      />

      {/* Table Master Modal (Video 08 Frame 0820) */}
      <TableMasterModal
        isOpen={isTableMasterOpen}
        onClose={() => setIsTableMasterOpen(false)}
      />

      {/* Item Master Modal (Video 08 Frame 0250) */}
      <ItemMasterModal
        isOpen={isItemMasterOpen}
        onClose={() => setIsItemMasterOpen(false)}
      />

      {/* Other Configurations Modal (Video 08 Frames 0920, 0980, 1000) */}
      <OtherMasterModal
        isOpen={isOtherMasterOpen}
        onClose={() => setIsOtherMasterOpen(false)}
        initialTab={otherMasterTab}
      />

      {/* Business Setting Modal (Video 09 - 12hr vs 24hr Policy) */}
      <BusinessSettingModal
        isOpen={isBusinessSettingOpen}
        onClose={() => setIsBusinessSettingOpen(false)}
      />

      {/* Company Info Modal (Video 10 - Local vs Interstate GST) */}
      <CompanyInfoModal
        isOpen={isCompanyInfoOpen}
        onClose={() => setIsCompanyInfoOpen(false)}
      />

      {/* Video 11: Room Shifting Modal */}
      <RoomShiftModal
        isOpen={isRoomShiftOpen}
        onClose={() => setIsRoomShiftOpen(false)}
        initialFromRoomNo={selectedRoomForShift}
        onShiftCompleted={() => setRoomRefreshTrigger(prev => prev + 1)}
      />

      {/* Video 11: Room Check In Register Table */}
      <RoomCheckInRegisterModal
        isOpen={isCheckInRegisterOpen}
        onClose={() => setIsCheckInRegisterOpen(false)}
        onOpenNewCheckIn={() => setIsNewCheckInOpen(true)}
        onOpenRoomShift={(rNo) => {
          setSelectedRoomForShift(rNo);
          setIsRoomShiftOpen(true);
        }}
        onOpenCheckout={() => setActiveTab('matrix')}
      />

      {/* New Room Check In Modal */}
      <NewRoomCheckInModal
        isOpen={isNewCheckInOpen}
        onClose={() => setIsNewCheckInOpen(false)}
        onCheckInCompleted={() => setRoomRefreshTrigger(prev => prev + 1)}
      />

      {/* Video 12: Kitchen Dashboard (KDS) */}
      <KitchenDashboardModal
        isOpen={isKitchenDashboardOpen}
        onClose={() => setIsKitchenDashboardOpen(false)}
        onOpenNewKot={() => setIsKotModalOpen(true)}
      />

      {/* Video 12: Restaurant KOT Register */}
      <RestaurantKotRegisterModal
        isOpen={isRestaurantKotOpen}
        onClose={() => setIsRestaurantKotOpen(false)}
        onOpenKitchenDashboard={() => setIsKitchenDashboardOpen(true)}
        onOpenNewKot={() => setIsKotModalOpen(true)}
      />

      {/* Video 13: Restaurant Table Matrix Dashboard */}
      <RestaurantTableDashboardModal
        isOpen={isTableDashboardOpen}
        onClose={() => setIsTableDashboardOpen(false)}
        onOpenKotForTable={(tbl) => {
          setSelectedKotTable(tbl);
          setIsKotModalOpen(true);
        }}
        onOpenBillForTable={(tbl) => {
          setSelectedBillTable(tbl);
          setIsFoodBillModalOpen(true);
        }}
        onOpenKitchenDashboard={() => setIsKitchenDashboardOpen(true)}
        onOpenKotRegister={() => setIsRestaurantKotOpen(true)}
      />

      {/* Video 13: Table Shifting Modal */}
      <ShiftTableModal
        isOpen={isShiftTableOpen}
        onClose={() => setIsShiftTableOpen(false)}
        onShiftCompleted={() => setRoomRefreshTrigger(prev => prev + 1)}
      />

      {/* Video 13: NC KOT Register */}
      <NcKotRegisterModal
        isOpen={isNcKotRegisterOpen}
        onClose={() => setIsNcKotRegisterOpen(false)}
        onOpenNewKot={() => {
          setSelectedKotTable('Table NC1');
          setIsKotModalOpen(true);
        }}
      />
    </>
  );
};
