import React, { useState, useEffect } from 'react';
import { PmsStore } from '../services/pmsStore';

export interface NavbarProps {
  portalMode?: 'public' | 'erp';
  onModeChange?: (mode: 'public' | 'erp') => void;
  activeRole?: 'admin' | 'reception' | 'steward' | 'housekeeping';
  onRoleChange?: (role: 'admin' | 'reception' | 'steward' | 'housekeeping') => void;
  onOpenRoleView?: (role: 'admin' | 'reception' | 'steward' | 'housekeeping') => void;
  onOpenBooking: (roomType?: string) => void;
  onOpenPms?: () => void;
  onOpenGuestEngine?: () => void;
  onOpenHousekeeping?: () => void;
  onOpenPettyCash?: () => void;
  onOpenPos?: () => void;
  onOpenRoomService?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  portalMode = 'public',
  onModeChange,
  activeRole = 'admin',
  onRoleChange,
  onOpenRoleView,
  onOpenBooking,
  onOpenPms,
  onOpenGuestEngine,
  onOpenHousekeeping,
  onOpenPettyCash,
  onOpenPos,
  onOpenRoomService
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [businessDate, setBusinessDate] = useState(() => PmsStore.getBusinessDate());

  useEffect(() => {
    const unsub = PmsStore.subscribe(() => {
      setBusinessDate(PmsStore.getBusinessDate());
    });
    return unsub;
  }, []);

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
    'Namaste Sri Sai Vasudev Residency! I would like assistance with room booking, tariff details, and pilgrimage guidance.'
  )}`;

  // Precise smooth scrolling with dynamic navbar offset compensation
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: Math.max(0, elementPosition - navOffset),
        behavior: 'smooth'
      });
      try {
        window.history.replaceState(null, '', `#${id}`);
      } catch {
        // Safe fallback
      }
    }
  };

  return (
    <header className="site-header" style={{ position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
      {/* ========================================================================= */}
      {/* 1. PROMINENT STICKY PUBLIC-TO-ERP MODE SWITCHER & STAFF ROLE SWITCHER BAR */}
      {/* ========================================================================= */}
      <div 
        className="erp-mode-switcher-bar"
        style={{
          background: portalMode === 'erp' 
            ? 'linear-gradient(90deg, #091220 0%, #0f1e36 50%, #07111f 100%)' 
            : 'linear-gradient(90deg, #0b1324 0%, #111d33 50%, #0d1627 100%)',
          borderBottom: portalMode === 'erp' ? '2px solid #38bdf8' : '1px solid #1e293b',
          color: '#f8fafc',
          padding: '6px 0',
          fontSize: '12px'
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          {/* Left: Interactive Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Portal View:
            </span>
            <div 
              style={{
                display: 'inline-flex',
                background: '#0a0f1d',
                borderRadius: '6px',
                padding: '2px',
                border: '1px solid #1e2e4a'
              }}
              role="radiogroup"
              aria-label="Portal Mode"
            >
              <button
                type="button"
                id="mode-toggle-public"
                onClick={() => onModeChange && onModeChange('public')}
                style={{
                  background: portalMode === 'public' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                  color: portalMode === 'public' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  boxShadow: portalMode === 'public' ? '0 1px 4px rgba(2,132,199,0.4)' : 'none'
                }}
              >
                <span>🏨</span>
                <span>Public Guest Website</span>
              </button>

              <button
                type="button"
                id="mode-toggle-erp"
                onClick={() => onModeChange && onModeChange('erp')}
                style={{
                  background: portalMode === 'erp' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                  color: portalMode === 'erp' ? '#0f172a' : '#cbd5e1',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  boxShadow: portalMode === 'erp' ? '0 1px 6px rgba(245,158,11,0.5)' : 'none'
                }}
              >
                <span>🔑</span>
                <span>Staff ERP / PMS Portal</span>
              </button>
            </div>
          </div>

          {/* Right: Role Switcher & Contextual Quick Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Live ERP Business Date Badge */}
            <div 
              id="erp-business-date-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#0f172a',
                border: '1px solid #38bdf8',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                color: '#38bdf8',
                fontWeight: 800,
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }}
              title="Current ERP Accounting Business Date (Controlled by Night Audit)"
            >
              <span>📅</span>
              <span>Biz Date:</span>
              <strong style={{ color: '#f8fafc' }}>{businessDate}</strong>
            </div>

            {portalMode === 'erp' ? (
              <>
                {/* Staff Role Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>Staff Role:</span>
                  <select
                    id="staff-role-switcher"
                    value={activeRole}
                    onChange={(e) => onRoleChange && onRoleChange(e.target.value as any)}
                    style={{
                      background: '#1e293b',
                      color: '#f8fafc',
                      border: '1px solid #38bdf8',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    title="Select Staff Login Persona"
                  >
                    <option value="admin">👑 Admin / General Manager</option>
                    <option value="reception">🛎️ Front Desk Receptionist</option>
                    <option value="steward">🍽️ Vasudev Rasoi POS Steward</option>
                    <option value="housekeeping">🧹 Housekeeping Staff</option>
                  </select>
                </div>

                {/* Direct Role Action Launchers */}
                <button
                  type="button"
                  id="erp-quick-rack-btn"
                  onClick={() => onOpenRoleView ? onOpenRoleView('reception') : (onOpenPms && onOpenPms())}
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 9px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Open 16-Room Visual Rack"
                >
                  <span>🏢</span>
                  <span>Room Rack</span>
                </button>

                <button
                  type="button"
                  id="erp-quick-pos-btn"
                  onClick={() => onOpenPos ? onOpenPos() : (onOpenRoleView ? onOpenRoleView('steward') : (onOpenPms && onOpenPms()))}
                  style={{
                    background: '#15803d',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 9px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Open Vasudev Rasoi POS / Table Map"
                >
                  <span>🍽️</span>
                  <span>Rasoi POS</span>
                </button>

                <button
                  type="button"
                  id="erp-quick-hk-btn"
                  onClick={() => onOpenHousekeeping ? onOpenHousekeeping() : (onOpenRoleView ? onOpenRoleView('housekeeping') : (onOpenPms && onOpenPms()))}
                  style={{
                    background: '#7c3aed',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 9px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Open 16-Room Housekeeping Kanban Board"
                >
                  <span>🧹</span>
                  <span>Housekeeping</span>
                </button>

                <button
                  type="button"
                  id="erp-quick-cash-btn"
                  onClick={() => onOpenPettyCash ? onOpenPettyCash() : (onOpenPms && onOpenPms())}
                  style={{
                    background: '#ca8a04',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 9px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Open Petty Cash & Night Audit Ledger"
                >
                  <span>💰</span>
                  <span>Night Audit</span>
                </button>

                <button
                  type="button"
                  id="erp-launch-full-btn"
                  onClick={onOpenPms}
                  style={{
                    background: '#ea580c',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Open Full Enterprise PMS Terminal"
                >
                  <span>⚡</span>
                  <span>Launch PMS Terminal</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  type="button" 
                  id="nav-online-booking-engine-btn"
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

                <span style={{ color: '#475569' }}>•</span>

                <button 
                  type="button" 
                  id="nav-room-service-portal-btn"
                  onClick={onOpenRoomService}
                  title="Guest Room Service & Vasudev Rasoi Self-Service Portal"
                  style={{
                    background: '#d4af37',
                    color: '#0d1b2a',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  📱 Room Service
                </button>

                <span style={{ color: '#475569' }}>•</span>

                <button 
                  type="button" 
                  id="nav-receptionist-pms-btn"
                  onClick={onOpenPms}
                  title="Receptionist Cloud PMS"
                  style={{
                    background: '#ca8a04',
                    color: '#ffffff',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🔑 Receptionist PMS
                </button>

                <span style={{ color: '#475569' }}>•</span>

                <a href="tel:+919440289999" className="banner-contact" aria-label="Call Front Desk" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 700, fontSize: '11px' }}>
                  📞 +91 94402 89999
                </a>

                <span style={{ color: '#475569' }}>•</span>

                <a 
                  href={whatsappDirectUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="banner-whatsapp"
                  aria-label="Chat on WhatsApp"
                  style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 700, fontSize: '11px' }}
                >
                  💬 WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN BRAND NAVIGATION BAR WITH SMOOTH SCROLL ANCHORS & DIRECT BOOKING */}
      {/* ========================================================================= */}
      <nav className={`main-nav ${isScrolled ? 'scrolled' : ''}`} aria-label="Main Navigation">
        <div className="container nav-container">
          <a 
            href="#overview" 
            className="brand-logo" 
            aria-label="Sri Sai Vasudev Residency Homepage"
            onClick={(e) => scrollToSection(e, 'overview')}
          >
            <div className="logo-emblem">
              <span className="emblem-text">SVR</span>
            </div>
            <div className="brand-text-block">
              <span className="brand-title">SRI SAI VASUDEV</span>
              <span className="brand-subtitle">RESIDENCY &bull; BOUTIQUE HOTEL &bull; RAYAGADA</span>
            </div>
          </a>

          {/* Desktop Nav Items with Guaranteed Smooth Scrolling */}
          <ul className="nav-links">
            <li>
              <a href="#overview" onClick={(e) => scrollToSection(e, 'overview')}>Overview</a>
            </li>
            <li>
              <a href="#rooms" onClick={(e) => scrollToSection(e, 'rooms')}>Rooms &amp; Rates</a>
            </li>
            <li>
              <a href="#amenities" onClick={(e) => scrollToSection(e, 'amenities')}>Amenities</a>
            </li>
            <li>
              <a href="#dining" onClick={(e) => scrollToSection(e, 'dining')}>Dining</a>
            </li>
            <li>
              <a href="#location" onClick={(e) => scrollToSection(e, 'location')}>Pilgrimage &amp; Map</a>
            </li>
            <li>
              <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')}>Contact</a>
            </li>
          </ul>

          {/* Action Button */}
          <div className="nav-actions">
            <button 
              id="nav-book-now-btn" 
              className="btn btn-primary nav-book-btn"
              onClick={() => onOpenBooking()}
              aria-label="Book your stay"
              style={{ minHeight: '44px', fontWeight: 800 }}
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
            <div style={{ padding: '10px 16px', background: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  onModeChange && onModeChange('public');
                  setMobileMenuOpen(false);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: portalMode === 'public' ? '#0284c7' : '#1e293b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 800
                }}
              >
                🏨 Public Website
              </button>
              <button
                type="button"
                onClick={() => {
                  onModeChange && onModeChange('erp');
                  setMobileMenuOpen(false);
                  if (onOpenPms) onOpenPms();
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: portalMode === 'erp' ? '#f59e0b' : '#1e293b',
                  color: portalMode === 'erp' ? '#0f172a' : '#cbd5e1',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 900
                }}
              >
                🔑 Staff ERP
              </button>
            </div>

            <ul className="mobile-links">
              <li><a href="#overview" onClick={(e) => scrollToSection(e, 'overview')}>Overview</a></li>
              <li><a href="#rooms" onClick={(e) => scrollToSection(e, 'rooms')}>Rooms &amp; Rates</a></li>
              <li><a href="#amenities" onClick={(e) => scrollToSection(e, 'amenities')}>Amenities</a></li>
              <li><a href="#dining" onClick={(e) => scrollToSection(e, 'dining')}>Dining</a></li>
              <li><a href="#location" onClick={(e) => scrollToSection(e, 'location')}>Pilgrimage &amp; Map</a></li>
              <li><a href="#contact" onClick={(e) => scrollToSection(e, 'contact')}>Contact</a></li>
              
              <li style={{ padding: '8px 16px', borderTop: '1px solid #334155' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenHousekeeping) onOpenHousekeeping();
                      else if (onOpenPms) onOpenPms();
                    }}
                    style={{ padding: '8px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}
                  >
                    🧹 Housekeeping
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenPettyCash) onOpenPettyCash();
                      else if (onOpenPms) onOpenPms();
                    }}
                    style={{ padding: '8px', background: '#ca8a04', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}
                  >
                    💰 Night Audit
                  </button>
                </div>
              </li>

              <li className="mobile-cta-item">
                <button 
                  className="btn btn-primary"
                  style={{ width: '100%', minHeight: '44px', fontWeight: 800 }}
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
    </header>
  );
};
