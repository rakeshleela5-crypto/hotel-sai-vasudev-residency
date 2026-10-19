import React, { useState, useEffect } from 'react';
import type { Room } from '../types';
import { hotelApi } from '../services/api';

interface RoomsSectionProps {
  onSelectRoom: (room: Room) => void;
  selectedCategory?: string;
}

export const RoomsSection: React.FC<RoomsSectionProps> = ({ onSelectRoom, selectedCategory = 'All' }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [prevSelectedCategory, setPrevSelectedCategory] = useState(selectedCategory);

  if (prevSelectedCategory !== selectedCategory) {
    setPrevSelectedCategory(selectedCategory);
    setUserFilter(null);
  }

  const activeFilter = userFilter ?? selectedCategory;

  useEffect(() => {
    let isMounted = true;
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const data = await hotelApi.getRooms(activeFilter === 'All' ? undefined : activeFilter);
        if (isMounted) setRooms(data);
      } catch (err) {
        console.error('Error fetching rooms:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRooms();
    return () => {
      isMounted = false;
    };
  }, [activeFilter]);

  const categories = ['All', 'Deluxe', 'Super Deluxe', 'Suite'];

  return (
    <section id="rooms" className="rooms-section">
      <div className="container">
        <div className="section-header-center">
          <div className="section-tag">
            <span>LUXURY ACCOMMODATIONS</span>
          </div>
          <h2 className="section-title">Rooms &amp; Executive Suites</h2>
          <p className="section-subtitle">
            Indulge in plush bedding, soundproof acoustics, and modern conveniences designed for peace of mind and divine relaxation.
          </p>

          {/* Filter Pills */}
          <div className="room-filter-tabs" role="tablist" aria-label="Room Category Filters">
            {categories.map((cat) => (
              <button
                key={cat}
                role="tab"
                aria-selected={activeFilter === cat}
                className={`filter-pill ${activeFilter === cat ? 'active' : ''}`}
                onClick={() => setUserFilter(cat)}
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                {cat === 'All' ? 'All Accommodations' : cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading luxury rooms &amp; live rates...</p>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <div key={room.id} className="room-card">
                <div className="room-image-box">
                  <img 
                    src={room.image_url} 
                    alt={`${room.name} at Hotel Sai Vasudev Residency`} 
                    loading="lazy" 
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/hero.jpg';
                    }}
                  />
                  {room.badge && (
                    <span className="room-badge">{room.badge}</span>
                  )}
                  <div className="room-price-tag">
                    <span className="price-currency">₹</span>
                    <span className="price-amount">{room.price_per_night.toLocaleString('en-IN')}</span>
                    <span className="price-period">/ night</span>
                  </div>
                </div>

                <div className="room-card-body">
                  <div className="room-type-label">{room.room_type}</div>
                  <h3 className="room-title">{room.name}</h3>

                  <div className="room-features-row">
                    <div className="feature-item" title="Bed Type">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M2 4v16M2 8h18a2 2 0 012 2v10M2 17h20M6 8v9" />
                      </svg>
                      <span>{room.bed_type}</span>
                    </div>
                    <div className="feature-item" title="Capacity">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                      </svg>
                      <span>Up to {room.capacity} Guests</span>
                    </div>
                    <div className="feature-item" title="Room Size">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18M9 21V9" />
                      </svg>
                      <span>{room.room_size}</span>
                    </div>
                  </div>

                  <p className="room-desc">{room.description}</p>

                  <div className="room-amenities-tags">
                    {room.amenities.split(',').slice(0, 4).map((amenity, idx) => (
                      <span key={idx} className="amenity-pill">
                        ✓ {amenity.trim()}
                      </span>
                    ))}
                  </div>

                  <div className="room-card-footer">
                    <div className="cancellation-note">
                      <span>✓ Free Cancellation</span>
                      <small>Up to 24 hours prior to check-in</small>
                    </div>
                    <button
                      id={`book-room-btn-${room.id}`}
                      className="btn btn-primary room-book-btn"
                      onClick={() => onSelectRoom(room)}
                      aria-label={`Reserve ${room.name}`}
                      style={{ minHeight: '44px' }}
                    >
                      <span>Reserve Now</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
