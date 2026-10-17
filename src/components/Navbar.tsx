import React, { useState, useEffect } from 'react';

interface NavbarProps {
  onOpenBooking: (roomType?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBooking }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="top-banner">
        <div className="container top-banner-content">
          <div className="banner-left">
            <span>✨ Best Rate Guarantee for Direct Bookings</span>
            <span className="banner-divider">•</span>
            <span>📍 2-Minute Walk to Sacred Temple & Main Shrine</span>
          </div>
          <div className="banner-right">
            <a href="tel:+919876543210" className="banner-contact">
              📞 +91 98765 43210
            </a>
            <span className="banner-divider">•</span>
            <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="banner-whatsapp">
              💬 WhatsApp Assistance
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className={`main-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container nav-container">
          <a href="#" className="brand-logo">
            <div className="logo-emblem">
              <span className="emblem-text">SVR</span>
            </div>
            <div className="brand-text-block">
              <span className="brand-title">SAI VASUDEV</span>
              <span className="brand-subtitle">RESIDENCY &bull; BOUTIQUE HOTEL</span>
            </div>
          </a>

          {/* Desktop Nav Items */}
          <ul className="nav-links">
            <li><a href="#overview">Overview</a></li>
            <li><a href="#rooms">Rooms & Rates</a></li>
            <li><a href="#amenities">Amenities</a></li>
            <li><a href="#dining">Dining</a></li>
            <li><a href="#location">Pilgrimage & Map</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          {/* Action Button */}
          <div className="nav-actions">
            <button 
              id="nav-book-now-btn" 
              className="btn btn-primary nav-book-btn"
              onClick={() => onOpenBooking()}
            >
              <span>Book Your Stay</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <button 
              className="mobile-toggle"
              aria-label="Toggle Navigation Menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="mobile-menu-drawer">
            <ul className="mobile-links">
              <li><a href="#overview" onClick={() => setMobileMenuOpen(false)}>Overview</a></li>
              <li><a href="#rooms" onClick={() => setMobileMenuOpen(false)}>Rooms & Rates</a></li>
              <li><a href="#amenities" onClick={() => setMobileMenuOpen(false)}>Amenities</a></li>
              <li><a href="#dining" onClick={() => setMobileMenuOpen(false)}>Dining</a></li>
              <li><a href="#location" onClick={() => setMobileMenuOpen(false)}>Pilgrimage & Map</a></li>
              <li><a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a></li>
              <li className="mobile-cta-item">
                <button 
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBooking();
                  }}
                >
                  Book Your Stay Now
                </button>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </>
  );
};
