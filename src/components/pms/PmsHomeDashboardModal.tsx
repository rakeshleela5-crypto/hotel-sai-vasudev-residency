import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import { NewRoomBookingModal } from './NewRoomBookingModal';
import { NewRoomCheckInModal } from './NewRoomCheckInModal';
import { BookingReceiptModal } from './BookingReceiptModal';
import { KotEntryModal } from './KotEntryModal';
import { FoodBillModal } from './FoodBillModal';
import { RoomCheckOutModal } from './RoomCheckOutModal';
import { AdvanceReceiptModal } from './AdvanceReceiptModal';
import { PartyLedgerModal } from './PartyLedgerModal';
import { KitchenDashboardModal } from './KitchenDashboardModal';
import { RestaurantKotRegisterModal } from './RestaurantKotRegisterModal';
import type { PmsBooking } from '../../types/pmsModels';

interface PmsHomeDashboardModalProps {
  onOpenRoomMatrix: () => void;
}

export const PmsHomeDashboardModal: React.FC<PmsHomeDashboardModalProps> = ({
  onOpenRoomMatrix
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [whatsAppMobile, setWhatsAppMobile] = useState('');

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [latestBooking, setLatestBooking] = useState<PmsBooking | null>(null);

  const [isKotOpen, setIsKotOpen] = useState(false);
  const [isFoodBillOpen, setIsFoodBillOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdvanceReceiptOpen, setIsAdvanceReceiptOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isKitchenDashboardOpen, setIsKitchenDashboardOpen] = useState(false);
  const [isRestaurantKotOpen, setIsRestaurantKotOpen] = useState(false);

  const rooms = PmsStore.getRooms();
  const vacantCount = rooms.filter(r => r.status === 'vacant').length;
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const dirtyCount = rooms.filter(r => r.status === 'dirty').length;

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB');
      const timeStr = now.toLocaleTimeString();
      setCurrentTime(`${dateStr} Time ${timeStr}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSendWhatsApp = () => {
    if (!whatsAppMobile.trim() || whatsAppMobile.length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    const msg = encodeURIComponent(
      'Namaste! Greetings from Hotel SAI VASUDEV RESIDENCY, Shirdi. Visit our website for luxury stay & direct booking: https://hotel-sai-vasudev-residency.pages.dev'
    );
    window.open(`https://wa.me/91${whatsAppMobile}?text=${msg}`, '_blank');
  };

  return (
    <div className="pms-content">
      {/* Top Brand & Metadata Banner from Frame 0100 */}
      <div className="home-hub-header">
        <h1 className="hotel-hub-title">
          HOTEL SAI VASUDEV RESIDENCY
        </h1>
        <div className="hotel-hub-meta">
          <span>Hotel Dashboard Date: {currentTime}</span>
          <span>&bull;</span>
          <span>Activation Date: 17-12-24 & Renew Date: 17-12-25 & Day Remaining: 194</span>
          <span className="whatsapp-badge">WhatsApp Validity: 29-06-2025</span>
        </div>
      </div>

      {/* 16 Quick Module Action Tiles matching Frame 0100 */}
      <div className="home-tiles-grid">
        {/* Row 1 */}
        <button
          type="button"
          className="hub-tile-btn tile-room-dash"
          onClick={onOpenRoomMatrix}
        >
          <span className="tile-icon">🏠</span>
          <span>Room Dashboard</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-room-booking"
          onClick={() => setIsBookingOpen(true)}
        >
          <span className="tile-icon">📅</span>
          <span>Room Booking</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-check-in"
          onClick={() => setIsCheckInOpen(true)}
        >
          <span className="tile-icon">🚪➡️</span>
          <span>Room Check In</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-checkout"
          onClick={() => {
            const firstOccupied = rooms.find(r => r.status === 'occupied') || rooms[0];
            if (firstOccupied) {
              setIsCheckoutOpen(true);
            }
          }}
        >
          <span className="tile-icon">🚪⬅️</span>
          <span>Room Checkout</span>
        </button>

        {/* Row 2 */}
        <button
          type="button"
          className="hub-tile-btn tile-new-kot"
          onClick={() => setIsKotOpen(true)}
        >
          <span className="tile-icon">🍴</span>
          <span>New Kot</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-new-food-bill"
          onClick={() => setIsFoodBillOpen(true)}
        >
          <span className="tile-icon">🧾</span>
          <span>New Food Bill</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-advance-receipt"
          onClick={() => setIsAdvanceReceiptOpen(true)}
        >
          <span className="tile-icon">💵</span>
          <span>Room Advance Receipt</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-receipt"
          onClick={() => setIsAdvanceReceiptOpen(true)}
        >
          <span className="tile-icon">📄</span>
          <span>Receipt</span>
        </button>

        {/* Row 3 */}
        <button
          type="button"
          className="hub-tile-btn tile-payment"
          onClick={() => alert('Payment Entry Module: Record cash/UPI payment payouts.')}
        >
          <span className="tile-icon">💳</span>
          <span>Payment</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-ledger"
          onClick={() => setIsLedgerOpen(true)}
        >
          <span className="tile-icon">📑</span>
          <span>Ledger</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-restaurant"
          onClick={() => setIsRestaurantKotOpen(true)}
        >
          <span className="tile-icon">🏬</span>
          <span>Restaurant</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-purchase"
          onClick={() => alert('Purchase Inventory Module: Raw material & grocery procurement.')}
        >
          <span className="tile-icon">🛒</span>
          <span>Purchase</span>
        </button>

        {/* Row 4 */}
        <button
          type="button"
          className="hub-tile-btn tile-stock-transfer"
          onClick={() => alert('Stock Transfer: Move items from Central Store to Kitchen/Pantry.')}
        >
          <span className="tile-icon">🔁</span>
          <span>Stock Transfer</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-stock-issue"
          onClick={() => alert('Stock Issue: Consumption report & staff daily item issue.')}
        >
          <span className="tile-icon">📦</span>
          <span>Stock Issue</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-report"
          onClick={() => alert('PMS Analytics & Reports: Check-in, Police Station Report, GST, Stock.')}
        >
          <span className="tile-icon">📈</span>
          <span>Report</span>
        </button>

        <button
          type="button"
          className="hub-tile-btn tile-room-dash"
          onClick={onOpenRoomMatrix}
        >
          <span className="tile-icon">🏢</span>
          <span>All 24 Rooms</span>
        </button>
      </div>

      {/* Bottom Summary Bar & WhatsApp Promotion Tool from Frame 0100 */}
      <div style={{
        maxWidth: 1050,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
        background: '#f8fafc',
        padding: '16px 20px',
        borderRadius: 6,
        border: '1px solid #e2e8f0'
      }}>
        {/* Real-time Room Status Counts */}
        <div style={{ display: 'flex', gap: 24, fontSize: 14, fontWeight: 700 }}>
          <span style={{ color: '#0f172a' }}>Vacant: <strong style={{ fontSize: 18, color: '#2563eb' }}>{vacantCount}</strong></span>
          <span style={{ color: '#0f172a' }}>Occupied: <strong style={{ fontSize: 18, color: '#16a34a' }}>{occupiedCount}</strong></span>
          <span style={{ color: '#0f172a' }}>Dirty: <strong style={{ fontSize: 18, color: '#dc2626' }}>{dirtyCount}</strong></span>
        </div>

        {/* WhatsApp Sender Tool (Frame 0100) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="tel"
            placeholder="Enter mobile no"
            value={whatsAppMobile}
            onChange={e => setWhatsAppMobile(e.target.value)}
            className="form-input-pms"
            style={{ width: 170 }}
          />
          <span style={{ fontSize: 20 }}>📢</span>
          <button
            type="button"
            onClick={handleSendWhatsApp}
            style={{
              background: '#22c55e',
              color: '#ffffff',
              border: 'none',
              padding: '7px 14px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Send Website Link
          </button>
          <a
            href="https://hotel-sai-vasudev-residency.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#b91c1c',
              color: '#ffffff',
              textDecoration: 'none',
              padding: '7px 14px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 700
            }}
          >
            Visit Website
          </a>
        </div>
      </div>

      {/* Submodals */}
      <NewRoomBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBookingCreated={(b) => {
          setIsBookingOpen(false);
          setLatestBooking(b);
          setIsReceiptOpen(true);
        }}
      />

      <NewRoomCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onCheckInCompleted={() => {
          setIsCheckInOpen(false);
        }}
      />

      <BookingReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        booking={latestBooking}
      />

      <KotEntryModal
        isOpen={isKotOpen}
        onClose={() => setIsKotOpen(false)}
        onKotSaved={() => {}}
      />

      <FoodBillModal
        isOpen={isFoodBillOpen}
        onClose={() => setIsFoodBillOpen(false)}
        onBillSaved={() => {}}
      />

      <RoomCheckOutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        targetRoom={rooms.find(r => r.status === 'occupied') || rooms[0]}
        onCheckoutComplete={() => {
          alert('Room checkout completed! Room status updated.');
        }}
      />

      <AdvanceReceiptModal
        isOpen={isAdvanceReceiptOpen}
        onClose={() => setIsAdvanceReceiptOpen(false)}
      />

      <PartyLedgerModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
      />

      <KitchenDashboardModal
        isOpen={isKitchenDashboardOpen}
        onClose={() => setIsKitchenDashboardOpen(false)}
        onOpenNewKot={() => setIsKotOpen(true)}
      />

      <RestaurantKotRegisterModal
        isOpen={isRestaurantKotOpen}
        onClose={() => setIsRestaurantKotOpen(false)}
        onOpenKitchenDashboard={() => setIsKitchenDashboardOpen(true)}
        onOpenNewKot={() => setIsKotOpen(true)}
      />
    </div>
  );
};
