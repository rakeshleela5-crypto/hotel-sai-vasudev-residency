import React, { useState } from 'react';

interface HeroProps {
  onCheckAvailability: (searchParams: {
    checkIn: string;
    checkOut: string;
    roomType: string;
    guests: number;
  }) => void;
}

const TODAY_STR = new Date().toISOString().split('T')[0];
const TOMORROW_STR = new Date(Date.now() + 86400000).toISOString().split('T')[0];

export const Hero: React.FC<HeroProps> = ({ onCheckAvailability }) => {
  const [checkIn, setCheckIn] = useState(TODAY_STR);
  const [checkOut, setCheckOut] = useState(TOMORROW_STR);
  const [roomType, setRoomType] = useState('All');
  const [guests, setGuests] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCheckAvailability({
      checkIn,
      checkOut,
      roomType,
      guests
    });
  };

  return (
    <section id="overview" className="hero-section">
      <div className="hero-bg-wrapper">
        <img 
          src="/images/hero.jpg" 
          alt="Hotel Sai Vasudev Residency Twilight View" 
          className="hero-bg-img"
        />
        <div className="hero-overlay"></div>
      </div>

      <div className="container hero-content-wrapper">
        <div className="hero-content">
          <div className="section-tag dark animate-fade">
            <span>⚜️ PURE LUXURY &bull; SACRED HOSPITALITY</span>
          </div>

          <h1 className="hero-title animate-fade">
            Divine Comfort. <br />
            <span className="gold-text">Unmatched Elegance.</span>
          </h1>

          <p className="hero-description animate-fade">
            Welcome to <strong>Hotel Sai Vasudev Residency</strong>. Your serene retreat just footsteps away 
            from the sacred temple shrine. Designed with plush Italian marble, acoustic soundproof rooms, 
            pure vegetarian gourmet dining, and warm traditional hospitality.
          </p>

          <div className="hero-trust-badges animate-fade">
            <div className="trust-badge-item">
              <span className="trust-icon">⭐</span>
              <div>
                <strong>4.9 / 5.0 Rating</strong>
                <p>1,400+ Verified Pilgrim Reviews</p>
              </div>
            </div>
            <div className="trust-badge-item">
              <span className="trust-icon">🛕</span>
              <div>
                <strong>2-Min Temple Proximity</strong>
                <p>VIP Darshan Assistance Desk</p>
              </div>
            </div>
            <div className="trust-badge-item">
              <span className="trust-icon">🍽️</span>
              <div>
                <strong>Pure Veg Dining</strong>
                <p>Sattvic & Multi-Cuisine Food</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Booking Search Widget */}
        <div className="booking-widget-card animate-fade">
          <div className="widget-header">
            <h3>Check Availability & Direct Rates</h3>
            <span className="widget-subtitle">Guaranteed Best Rates & Free Cancellation</span>
          </div>

          <form onSubmit={handleSubmit} className="booking-form-grid">
            <div className="form-group">
              <label htmlFor="hero-checkin">Check-in Date</label>
              <div className="input-with-icon">
                <input 
                  id="hero-checkin"
                  type="date" 
                  min={TODAY_STR}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="hero-checkout">Check-out Date</label>
              <div className="input-with-icon">
                <input 
                  id="hero-checkout"
                  type="date" 
                  min={checkIn || TODAY_STR}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="hero-room-type">Room Category</label>
              <select 
                id="hero-room-type"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
              >
                <option value="All">All Room Categories</option>
                <option value="Deluxe">Executive Deluxe Room</option>
                <option value="Super Deluxe">Super Deluxe Family</option>
                <option value="Suite">Sai Presidential Suite</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="hero-guests">Guests</label>
              <select 
                id="hero-guests"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
              >
                <option value={1}>1 Guest (Single)</option>
                <option value={2}>2 Guests (Double)</option>
                <option value={3}>3 Guests (Triple)</option>
                <option value={4}>4+ Guests (Family)</option>
              </select>
            </div>

            <div className="form-group form-submit-col">
              <button id="hero-search-availability-btn" type="submit" className="btn btn-primary widget-btn">
                <span>Check Rates & Book</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
