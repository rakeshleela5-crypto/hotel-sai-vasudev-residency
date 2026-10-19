import React, { useState, useEffect } from 'react';

interface NavbarProps {
  onOpenBooking: (roomType?: string) => void;
  onOpenPms?: () => void;
  onOpenGuestEngine?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBooking, onOpenPms, onOpenGuestEngine }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on Escape key (a11y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const whatsappDirectUrl = `https://wa.me/919440289999?text=${encodeURIComponent(
    'Namaste Hotel Sai Vasudev Residency! I would like assistance with room booking and darshan information.'
  )}`;

  return (
    <header className="site-header">
      {/* Top Announcement Bar */}
      <div className="top-banner">
        <div className="container top-banner-content">
          <div className="banner-left">
            <span>✨ Best Rate Guarantee for Direct Bookings</span>
            <span className="banner-divider">•</span>
            <span>📍 2-Minute Walk to Sacred Temple &amp; Main Shrine</span>
          </div>
          <div className="banner-right">
            <button 
              type="button" 
              onClick={onOpenGuestEngine}
              title="Open Online Guest Web Booking Engine"
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🌐 Online Booking Engine
            </button>
            <span className="banner-divider">•</span>
            <button 
              type="button" 
              onClick={onOpenPms}
              title="Receptionist Cloud PMS"
              style={{
                background: '#ca8a04',
                color: '#ffffff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🔑 Receptionist PMS
            </button>
            <span className="banner-divider">•</span>
            <a href="tel:+919440289999" className="banner-contact" aria-label="Call Front Desk">
              📞 +91 94402 89999
            </a>
            <span className="banner-divider">•</span>
            <a 
              href={whatsappDirectUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="banner-whatsapp"
              aria-label="Chat on WhatsApp"
            >
              💬 WhatsApp Assistance
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className={`main-nav ${isScrolled ? 'scrolled' : ''}`} aria-label="Main Navigation">
        <div className="container nav-container">
          <a href="#overview" className="brand-logo" aria-label="Hotel Sai Vasudev Residency Homepage">
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
            <li><a href="#rooms">Rooms &amp; Rates</a></li>
            <li><a href="#amenities">Amenities</a></li>
            <li><a href="#dining">Dining</a></li>
            <li><a href="#location">Pilgrimage &amp; Map</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          {/* Action Button */}
          <div className="nav-actions">
            <button 
              id="nav-book-now-btn" 
              className="btn btn-primary nav-book-btn"
              onClick={() => (onOpenGuestEngine ? onOpenGuestEngine() : onOpenBooking())}
              aria-label="Book your stay"
              style={{ minHeight: '44px' }}
            >
              <span>Book Your Stay</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <button 
              className="mobile-toggle"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
          <div className="mobile-menu-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation Menu">
            <ul className="mobile-links">
              <li><a href="#overview" onClick={() => setMobileMenuOpen(false)}>Overview</a></li>
              <li><a href="#rooms" onClick={() => setMobileMenuOpen(false)}>Rooms &amp; Rates</a></li>
              <li><a href="#amenities" onClick={() => setMobileMenuOpen(false)}>Amenities</a></li>
              <li><a href="#dining" onClick={() => setMobileMenuOpen(false)}>Dining</a></li>
              <li><a href="#location" onClick={() => setMobileMenuOpen(false)}>Pilgrimage &amp; Map</a></li>
              <li><a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a></li>
              <li className="mobile-cta-item">
                <button 
                  className="btn btn-primary"
                  style={{ width: '100%', minHeight: '44px' }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenGuestEngine) {
                      onOpenGuestEngine();
                    } else {
                      onOpenBooking();
                    }
                  }}
                >
                  Book Your Stay Now
                </button>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
};
