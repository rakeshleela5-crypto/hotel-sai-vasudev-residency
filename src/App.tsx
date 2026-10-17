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
import type { Room } from './types';
import './App.css';

export function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPmsOpen, setIsPmsOpen] = useState(false);
  const [isGuestEngineOpen, setIsGuestEngineOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchDates, setSearchDates] = useState<{ checkIn: string; checkOut: string; guests: number } | undefined>(undefined);

  useEffect(() => {
    // Automatically open PMS if URL has #pms or ?pms
    if (window.location.hash === '#pms' || window.location.search.includes('pms')) {
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
  }, []);

  const handleOpenBooking = (category?: string) => {
    if (category) {
      setSelectedCategory(category);
    }
    setIsGuestEngineOpen(true);
  };

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsGuestEngineOpen(true);
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
      roomsEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="hotel-app">
      <Navbar 
        onOpenBooking={() => handleOpenBooking()} 
        onOpenPms={() => setIsPmsOpen(true)}
        onOpenGuestEngine={() => setIsGuestEngineOpen(true)}
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

      {/* Guest Public Reservation Modal (Legacy Quick Modal) */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedRoom={selectedRoom}
        initialDates={searchDates}
      />

      {/* Video 20 Public Guest Web Booking Engine Portal (/hotel_room/DEMO0004) */}
      <OnlineGuestBookingModal
        isOpen={isGuestEngineOpen}
        onClose={() => setIsGuestEngineOpen(false)}
      />

      {/* Receptionist Enterprise PMS Portal (Video 01-20 Cloned) */}
      <HotelPmsModal
        isOpen={isPmsOpen}
        onClose={() => setIsPmsOpen(false)}
      />
    </div>
  );
}

export default App;
