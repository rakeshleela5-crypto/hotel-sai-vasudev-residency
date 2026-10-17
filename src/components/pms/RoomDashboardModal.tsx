import React, { useState } from 'react';
import type { PmsRoom, PmsBooking } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import { NewRoomBookingModal } from './NewRoomBookingModal';
import { NewRoomCheckInModal } from './NewRoomCheckInModal';
import { BookingReceiptModal } from './BookingReceiptModal';
import { KotEntryModal } from './KotEntryModal';
import { FoodBillModal } from './FoodBillModal';
import { RoomCheckOutModal } from './RoomCheckOutModal';
import { MarkDirtyModal } from './MarkDirtyModal';

interface RoomDashboardModalProps {
  onSwitchToHomeHub?: () => void;
  onOpenCalendar?: () => void;
}

export const RoomDashboardModal: React.FC<RoomDashboardModalProps> = ({
  onSwitchToHomeHub,
  onOpenCalendar
}) => {
  const [rooms, setRooms] = useState<PmsRoom[]>(PmsStore.getRooms());
  const [activeFilter, setActiveFilter] = useState<'all' | 'vacant' | 'booked' | 'occupied' | 'dirty'>('all');
  const [advanceDate, setAdvanceDate] = useState('05-06-2025');

  // Submodals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<PmsRoom | null>(null);

  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [selectedRoomForCheckIn, setSelectedRoomForCheckIn] = useState<PmsRoom | null>(null);

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [latestBooking, setLatestBooking] = useState<PmsBooking | null>(null);

  const [isKotOpen, setIsKotOpen] = useState(false);
  const [selectedRoomForKot, setSelectedRoomForKot] = useState<PmsRoom | null>(null);

  const [isFoodBillOpen, setIsFoodBillOpen] = useState(false);
  const [selectedRoomForFoodBill, setSelectedRoomForFoodBill] = useState<PmsRoom | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedRoomForCheckout, setSelectedRoomForCheckout] = useState<PmsRoom | null>(null);

  const [isDirtyModalOpen, setIsDirtyModalOpen] = useState(false);

  const refreshData = () => {
    setRooms(PmsStore.getRooms());
  };

  // Counts
  const vacantCount = rooms.filter(r => r.status === 'vacant').length;
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const dirtyCount = rooms.filter(r => r.status === 'dirty').length;

  const filteredRooms = rooms.filter(r => {
    if (activeFilter === 'all') return true;
    return r.status === activeFilter;
  });

  // Action handlers from 6 micro icons
  const handleBedClick = (room: PmsRoom) => {
    if (room.status === 'occupied') {
      setSelectedRoomForCheckout(room);
      setIsCheckoutOpen(true);
    } else {
      setSelectedRoomForCheckIn(room);
      setIsCheckInOpen(true);
    }
  };

  const handleKotClick = (room: PmsRoom) => {
    const pendingKots = PmsStore.getPendingKotsByRoom(room.roomNo);
    if (pendingKots.length > 0) {
      setSelectedRoomForFoodBill(room);
      setIsFoodBillOpen(true);
    } else {
      setSelectedRoomForKot(room);
      setIsKotOpen(true);
    }
  };

  const handleCleaningClick = (room: PmsRoom) => {
    const nextStatus = room.status === 'dirty' ? 'vacant' : 'dirty';
    PmsStore.updateRoomStatus(room.roomNo, nextStatus);
    refreshData();
  };

  const handleGuestClick = (room: PmsRoom) => {
    if (room.currentGuest) {
      alert(`Guest Details for Room ${room.roomNo}:\nName: ${room.currentGuest.name}\nPhone: ${room.currentGuest.phone}\nCheck-In: ${room.currentGuest.checkInDate} ${room.currentGuest.checkInTime}\nTariff: ₹${room.tariff}`);
    } else {
      alert(`Room ${room.roomNo} is currently vacant (${room.roomType}).\nTariff: ₹${room.tariff}/night.`);
    }
  };

  const handlePhoneClick = (room: PmsRoom) => {
    if (room.currentGuest) {
      alert(`Calling guest in Room ${room.roomNo}: ${room.currentGuest.phone}`);
    } else {
      setSelectedRoomForBooking(room);
      setIsBookingOpen(true);
    }
  };

  const handleLaundryClick = (room: PmsRoom) => {
    alert(`Housekeeping & Laundry service dispatched to Room ${room.roomNo}.`);
  };

  return (
    <div className="pms-content">
      {/* Top Status & Filter Ribbon from Frames 0005, 0020 */}
      <div className="room-status-bar">
        <div className="status-pills-group">
          <button
            type="button"
            className={`status-btn btn-vacant ${activeFilter === 'vacant' ? 'active' : ''}`}
            onClick={() => setActiveFilter(activeFilter === 'vacant' ? 'all' : 'vacant')}
          >
            Vacant
          </button>
          <button
            type="button"
            className={`status-btn btn-booked ${activeFilter === 'booked' ? 'active' : ''}`}
            onClick={() => setActiveFilter(activeFilter === 'booked' ? 'all' : 'booked')}
          >
            Booked
          </button>
          <button
            type="button"
            className={`status-btn btn-check ${activeFilter === 'occupied' ? 'active' : ''}`}
            onClick={() => setActiveFilter(activeFilter === 'occupied' ? 'all' : 'occupied')}
          >
            Check (Occupied)
          </button>
          <button
            type="button"
            className={`status-btn btn-dirty ${activeFilter === 'dirty' ? 'active' : ''}`}
            onClick={() => setActiveFilter(activeFilter === 'dirty' ? 'all' : 'dirty')}
          >
            Dirty
          </button>
          <button
            type="button"
            className="status-btn btn-mark-dirty"
            onClick={() => setIsDirtyModalOpen(true)}
          >
            Mark Room Dirty 🧹
          </button>
          {onSwitchToHomeHub && (
            <button
              type="button"
              className="status-btn"
              style={{ background: '#0284c7', color: '#ffffff' }}
              onClick={onSwitchToHomeHub}
              title="Open 16-Tile Home Hub"
            >
              🏠 Home Hub
            </button>
          )}
          <button
            type="button"
            className="status-btn"
            style={{ background: '#d97706', color: '#ffffff' }}
            onClick={() => {
              setSelectedRoomForKot(null);
              setIsKotOpen(true);
            }}
            title="Create Kitchen Order Ticket (KOT)"
          >
            🍴 New KOT
          </button>
          <button
            type="button"
            className="status-btn"
            style={{ background: '#1e293b', color: '#ffffff' }}
            onClick={() => {
              setSelectedRoomForFoodBill(null);
              setIsFoodBillOpen(true);
            }}
            title="Generate Food Bill (FBB)"
          >
            🧾 Food Bill
          </button>
          {onOpenCalendar && (
            <button
              type="button"
              className="status-btn"
              style={{ background: '#059669', color: '#ffffff' }}
              onClick={onOpenCalendar}
              title="View Monthly Booking Calendar"
            >
              📅 Calendar
            </button>
          )}
        </div>

        {/* Real-time Counters */}
        <div className="status-counts-row">
          <span className="count-vacant">Vacant - {vacantCount}</span>
          <span className="count-occupied">Occupied - {occupiedCount}</span>
          <span className="count-dirty">Dirty - {dirtyCount}</span>
        </div>

        {/* Advance Booking Date Selector */}
        <div className="advance-date-picker">
          <span style={{ color: '#1e40af', fontSize: 12 }}>Check Advance Booked Room......Select Date:</span>
          <input
            type="text"
            value={advanceDate}
            onChange={e => setAdvanceDate(e.target.value)}
            className="advance-date-input"
            style={{ width: 100 }}
          />
          <button
            type="button"
            className="pms-search-btn"
            onClick={() => alert(`Showing advance booking status for: ${advanceDate}`)}
          >
            🔍
          </button>
        </div>
      </div>

      {/* Room Matrix Grid matching Frames 0005, 0020, 0040 */}
      <div className="room-matrix-grid">
        {filteredRooms.map(room => {
          const isOccupied = room.status === 'occupied';
          const isBooked = room.status === 'booked';
          const isDirty = room.status === 'dirty';

          return (
            <div
              key={room.id}
              className={`pms-room-card ${isOccupied ? 'is-occupied' : ''} ${isBooked ? 'is-booked' : ''} ${isDirty ? 'is-dirty' : ''}`}
            >
              {/* Room Header Banner */}
              <div className="pms-room-header">
                {room.roomNo}
              </div>

              {/* Occupied / Guest Information Strip */}
              {isOccupied && room.currentGuest && (
                <div className="room-guest-info-banner">
                  <div><strong>Name:</strong> {room.currentGuest.name} ({room.currentGuest.phone})</div>
                  <div><strong>Type:</strong> {room.roomType} || ₹{room.tariff}</div>
                  <div><strong>Facilities:</strong> {room.facilities}</div>
                </div>
              )}

              {/* 2x3 Micro Action Grid (Frames 0005, 0060) */}
              <div className="room-actions-grid">
                {/* 1. Phone (Inquiry / Contact) */}
                <div
                  className="room-action-cell cell-phone"
                  onClick={() => handlePhoneClick(room)}
                  title="Phone / Call Guest / Inquire"
                >
                  📞
                </div>

                {/* 2. Bed (Check In / Checkout) */}
                <div
                  className="room-action-cell cell-checkin"
                  onClick={() => handleBedClick(room)}
                  title={isOccupied ? "Check Out Guest" : "Check In / Book Room"}
                >
                  🛏️
                </div>

                {/* 3. Laundry / Housekeeping */}
                <div
                  className="room-action-cell cell-laundry"
                  onClick={() => handleLaundryClick(room)}
                  title="Laundry & Housekeeping Services"
                >
                  👕
                </div>

                {/* 4. Calculator / Food KOT */}
                <div
                  className="room-action-cell cell-bill"
                  onClick={() => handleKotClick(room)}
                  title="Create a New Food Bill / KOT"
                >
                  🧮
                </div>

                {/* 5. Guest / Room Shift */}
                <div
                  className="room-action-cell cell-guest"
                  onClick={() => handleGuestClick(room)}
                  title="Guest Details / Room Shift"
                >
                  🚶
                </div>

                {/* 6. Broom (Clean / Dirty Toggle) */}
                <div
                  className="room-action-cell cell-clean"
                  onClick={() => handleCleaningClick(room)}
                  title={isDirty ? "Mark Clean" : "Mark Dirty"}
                >
                  🧹
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submodals */}
      <NewRoomBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedRoom={selectedRoomForBooking}
        onBookingCreated={(b) => {
          setIsBookingOpen(false);
          setLatestBooking(b);
          setIsReceiptOpen(true);
          refreshData();
        }}
      />

      <NewRoomCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        preselectedRoom={selectedRoomForCheckIn}
        onCheckInCompleted={() => {
          setIsCheckInOpen(false);
          refreshData();
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
        defaultRoomNo={selectedRoomForKot?.roomNo}
        onKotSaved={() => {
          refreshData();
        }}
      />

      <FoodBillModal
        isOpen={isFoodBillOpen}
        onClose={() => setIsFoodBillOpen(false)}
        defaultRoomNo={selectedRoomForFoodBill?.roomNo}
        onBillSaved={() => {
          refreshData();
        }}
      />

      <RoomCheckOutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        targetRoom={selectedRoomForCheckout}
        onCheckoutComplete={() => {
          refreshData();
          alert('Room Checkout completed successfully! Room marked as DIRTY for Housekeeping.');
        }}
      />

      <MarkDirtyModal
        isOpen={isDirtyModalOpen}
        onClose={() => setIsDirtyModalOpen(false)}
        onStatusUpdated={refreshData}
      />
    </div>
  );
};
