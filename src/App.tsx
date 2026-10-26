import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { RoomsSection } from './components/RoomsSection';
import { BookingModal } from './components/BookingModal';
import { Amenities } from './components/Amenities';
import { Dining } from './components/Dining';
import { LocationSection } from './components/LocationSection';
import { Testimonials } from './components/Testimonials';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { HotelPmsModal } from './components/pms/HotelPmsModal';
import { OnlineGuestBookingModal } from './components/pms/OnlineGuestBookingModal';
import { HousekeepingTrackerModal } from './components/pms/HousekeepingTrackerModal';
import { PettyExpenseModal } from './components/pms/PettyExpenseModal';
import { KotEntryModal } from './components/pms/KotEntryModal';
import { FoodBillModal } from './components/pms/FoodBillModal';
import { PmsStore } from './services/pmsStore';
import type { Room } from './types';
import './App.css';

export function App() {
  const [portalMode, setPortalMode] = useState<'public' | 'erp'>('public');
  const [staffRole, setStaffRole] = useState<'admin' | 'reception' | 'steward' | 'housekeeping'>('admin');

  // Modal display states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPmsOpen, setIsPmsOpen] = useState(false);
  const [isGuestEngineOpen, setIsGuestEngineOpen] = useState(false);
  const [isHousekeepingOpen, setIsHousekeepingOpen] = useState(false);
  const [isPettyCashOpen, setIsPettyCashOpen] = useState(false);
  const [isKotOpen, setIsKotOpen] = useState(false);
  const [isFoodBillOpen, setIsFoodBillOpen] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchDates, setSearchDates] = useState<{ checkIn: string; checkOut: string; guests: number } | undefined>(undefined);

  useEffect(() => {
    // Automatically open PMS if URL has /erp, #erp, #pms, or ?pms
    if (
      window.location.pathname.startsWith('/erp') ||
      window.location.hash === '#erp' ||
      window.location.hash === '#pms' ||
      window.location.search.includes('pms') ||
      window.location.search.includes('erp')
    ) {
      setPortalMode('erp');
      setIsPmsOpen(true);
    }
    // Automatically open Video 20 Online Guest Booking Engine if URL has #hotel_room or ?booking
    if (
      window.location.hash === '#hotel_room' || 
      window.location.hash === '#booking' || 
      window.location.search.includes('hotel_room') || 
      window.location.search.includes('booking')
    ) {
      setIsGuestEngineOpen(true);
    }

    // Connect to FastAPI & PostgreSQL on Railway Cloud immediately
    PmsStore.initCloudStore()
      .then(() => PmsStore.syncWithCloudBackend())
      .catch(err => console.warn('[App] Railway Cloud PostgreSQL connection notice:', err));

    // Continuous 15-second background cloud sync polling
    const syncInterval = setInterval(() => {
      PmsStore.syncWithCloudBackend().catch(() => {});
    }, 15000);

    return () => clearInterval(syncInterval);
  }, []);

  const handleModeChange = (mode: 'public' | 'erp') => {
    setPortalMode(mode);
    if (mode === 'erp') {
      setIsPmsOpen(true);
      try {
        window.history.pushState(null, '', '/erp');
      } catch {}
    } else {
      setIsPmsOpen(false);
      try {
        window.history.pushState(null, '', '/');
      } catch {}
    }
  };

  const handleRoleChange = (role: 'admin' | 'reception' | 'steward' | 'housekeeping') => {
    setStaffRole(role);
    const users = PmsStore.getUsers();
    let matchedUser = users.find(u => {
      if (role === 'admin') return u.roleName === 'admin' || u.roleName === 'super-admin';
      if (role === 'reception') return u.roleName.toLowerCase().includes('reception');
      if (role === 'housekeeping') return (u.department || '').toLowerCase().includes('housekeeping');
      if (role === 'steward') return (u.department || '').toLowerCase().includes('f&b') || u.roleName.toLowerCase().includes('staff');
      return false;
    });
    if (!matchedUser && users.length > 0) {
      matchedUser = users[0];
    }
    if (matchedUser) {
      PmsStore.setCurrentUser(matchedUser);
      window.dispatchEvent(new Event('pms_user_changed'));
    }
  };

  const handleOpenRoleView = (role: 'admin' | 'reception' | 'steward' | 'housekeeping') => {
    handleRoleChange(role);
    if (role === 'housekeeping') {
      setIsHousekeepingOpen(true);
    } else if (role === 'steward') {
      setIsFoodBillOpen(true);
    } else {
      setIsPmsOpen(true);
    }
  };

  const handleOpenBooking = (category?: string) => {
    if (category) {
      setSelectedCategory(category);
    }
    // Pre-select first room in category if available
    const allRooms = PmsStore.getRooms();
    const catRooms = category && category !== 'All' 
      ? allRooms.filter(r => r.roomType.toLowerCase().includes(category.toLowerCase()))
      : allRooms;
    const defaultRm = catRooms[0] || allRooms[0];
    if (defaultRm) {
      setSelectedRoom({
        id: Number(defaultRm.roomNo) || 101,
        name: `${defaultRm.roomType} (Room ${defaultRm.roomNo})`,
        slug: defaultRm.roomType.toLowerCase().replace(/\s+/g, '-'),
        room_type: defaultRm.roomType,
        price_per_night: defaultRm.tariff,
        capacity: defaultRm.capacity || 2,
        bed_type: defaultRm.roomType.includes('Suite') ? 'King Bed' : defaultRm.roomType.includes('Family') ? 'Two Queen Beds' : 'Queen Bed',
        room_size: defaultRm.roomType.includes('Suite') ? '720 sq ft' : defaultRm.roomType.includes('Family') ? '480 sq ft' : '340 sq ft',
        description: `Experience supreme comfort in ${defaultRm.roomType} at Hotel Sai Vasudev Residency Shirdi.`,
        amenities: defaultRm.facilities,
        image_url: defaultRm.roomType.includes('Suite') ? '/images/rooms/suite.jpg' : defaultRm.roomType.includes('Family') ? '/images/rooms/family.jpg' : '/images/rooms/deluxe.jpg',
        is_available: defaultRm.status === 'vacant'
      });
    }
    setIsModalOpen(true);
  };

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleSearchAvailability = (params: {
    checkIn: string;
    checkOut: string;
    roomType: string;
    guests: number;
  }) => {
    setSearchDates({
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guests: params.guests
    });
    if (params.roomType && params.roomType !== 'All') {
      setSelectedCategory(params.roomType);
    }
    // Scroll smoothly to rooms section
    const roomsEl = document.getElementById('rooms');
    if (roomsEl) {
      const navOffset = 100;
      const elementPosition = roomsEl.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: Math.max(0, elementPosition - navOffset),
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="hotel-app">
      <Navbar 
        portalMode={portalMode}
        onModeChange={handleModeChange}
        activeRole={staffRole}
        onRoleChange={handleRoleChange}
        onOpenRoleView={handleOpenRoleView}
        onOpenBooking={() => handleOpenBooking()} 
        onOpenPms={() => setIsPmsOpen(true)}
        onOpenGuestEngine={() => setIsGuestEngineOpen(true)}
        onOpenHousekeeping={() => setIsHousekeepingOpen(true)}
        onOpenPettyCash={() => setIsPettyCashOpen(true)}
        onOpenPos={() => setIsFoodBillOpen(true)}
      />

      <main>
        <Hero onCheckAvailability={handleSearchAvailability} />
        <RoomsSection 
          onSelectRoom={handleSelectRoom} 
          selectedCategory={selectedCategory} 
        />
        <Amenities />
        <Dining />
        <LocationSection />
        <Testimonials />
        <ContactSection />
      </main>

      <Footer />

      {/* Guest Public Reservation Modal (Direct Live Room Booking Modal with Strict KYC & Tariff) */}
      {isModalOpen && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedRoom={selectedRoom}
          initialDates={searchDates}
        />
      )}

      {/* Video 20 Public Guest Web Booking Engine Portal (/hotel_room/DEMO0004) */}
      {isGuestEngineOpen && (
        <OnlineGuestBookingModal
          isOpen={isGuestEngineOpen}
          onClose={() => setIsGuestEngineOpen(false)}
        />
      )}

      {/* Receptionist Enterprise PMS Portal (Video 01-20 Cloned) */}
      {isPmsOpen && (
        <HotelPmsModal
          isOpen={isPmsOpen}
          onClose={() => setIsPmsOpen(false)}
        />
      )}

      {/* Housekeeping 16-Room Cleanliness & Maintenance Kanban Board */}
      {isHousekeepingOpen && (
        <HousekeepingTrackerModal
          isOpen={isHousekeepingOpen}
          onClose={() => setIsHousekeepingOpen(false)}
        />
      )}

      {/* Petty Cash & 1-Click Night Audit Ledger */}
      {isPettyCashOpen && (
        <PettyExpenseModal
          isOpen={isPettyCashOpen}
          onClose={() => setIsPettyCashOpen(false)}
        />
      )}

      {/* Vasudev Rasoi KOT Entry Modal */}
      {isKotOpen && (
        <KotEntryModal
          isOpen={isKotOpen}
          onClose={() => setIsKotOpen(false)}
        />
      )}

      {/* Vasudev Rasoi Food Bill & POS Modal */}
      {isFoodBillOpen && (
        <FoodBillModal
          isOpen={isFoodBillOpen}
          onClose={() => setIsFoodBillOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
