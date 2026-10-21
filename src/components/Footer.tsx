import React, { useState, useEffect } from 'react';
import { hotelApi } from '../services/api';

export const Footer: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<{ status: string; engine: string }>({
    status: 'checking...',
    engine: 'Railway Postgres'
  });

  useEffect(() => {
    hotelApi.checkHealth().then((res) => {
      setBackendStatus({ status: res.status, engine: res.engine });
    });
  }, []);

  return (
    <footer className="hotel-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <div className="footer-logo">
              <span className="logo-emblem">SVR</span>
              <span className="logo-title">Hotel Sai Vasudev Residency</span>
            </div>
            <p className="footer-desc">
              A luxury boutique sanctuary dedicated to offering sacred comfort, peace of mind, 
              and authentic hospitality just steps away from the temple shrine.
            </p>
            <div className="hotel-timings-badge">
              <span>🕒 Check-In: 12:00 PM</span>
              <span className="divider">•</span>
              <span>🕚 Check-Out: 11:00 AM</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links-col">
            <h4>Quick Navigation</h4>
            <ul>
              <li><a href="#overview">Hotel Overview</a></li>
              <li><a href="#rooms">Rooms &amp; Suites</a></li>
              <li><a href="#amenities">Hotel Amenities</a></li>
              <li><a href="#dining">Vasudev Rasoi Dining</a></li>
              <li><a href="#location">Pilgrimage &amp; Directions</a></li>
              <li><a href="#contact">Contact &amp; Reservations</a></li>
            </ul>
          </div>

          {/* Room Categories */}
          <div className="footer-links-col">
            <h4>Room Categories</h4>
            <ul>
              <li><a href="#rooms">Deluxe (₹1,500/night)</a></li>
              <li><a href="#rooms">Classic Studio (₹2,000/night)</a></li>
              <li><a href="#rooms">Executive (₹2,500/night)</a></li>
              <li><a href="#rooms">Premium (₹3,000/night)</a></li>
              <li><a href="#contact">Group &amp; Satsang Bookings</a></li>
            </ul>
          </div>

          {/* Cloudflare Pages + Railway Infrastructure Status */}
          <div className="footer-infra-col">
            <h4>Deployment Infrastructure</h4>
            <div className="infra-card">
              <div className="infra-item">
                <span className="infra-icon" aria-hidden="true">☁️</span>
                <div>
                  <strong>Cloudflare Pages</strong>
                  <p>Global Edge Frontend CDN</p>
                </div>
              </div>
              <div className="infra-item">
                <span className="infra-icon" aria-hidden="true">🚀</span>
                <div>
                  <strong>FastAPI + PostgreSQL</strong>
                  <p>Railway Cloud Server</p>
                </div>
              </div>
              <div className="infra-status-row">
                <span className={`status-indicator-dot ${backendStatus.status === 'healthy' ? 'online' : 'standby'}`}></span>
                <span className="status-label">
                  Backend: {backendStatus.status === 'healthy' ? 'Railway Live' : 'Ready for Railway URL'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>&copy; {new Date().getFullYear()} Hotel Sai Vasudev Residency. All Rights Reserved.</p>
          <div className="footer-bottom-links">
            <a href="#overview" title="Verified Hotel Guest Privacy Guarantee">Privacy Guarantee</a>
            <span>•</span>
            <a href="#overview" title="Check-In at 12 PM, Check-Out at 11 AM">Terms of Stay</a>
            <span>•</span>
            <a href="#overview" title="Free cancellation up to 24 hours prior to arrival">24h Cancellation Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
