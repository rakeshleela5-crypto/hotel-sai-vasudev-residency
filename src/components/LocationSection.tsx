import React from 'react';

export const LocationSection: React.FC = () => {
  const distances = [
    { place: "Main Temple Shrine (Gate No. 2)", distance: "250 Meters", time: "2-Min Walk", icon: "🛕" },
    { place: "Central Bus Terminal", distance: "1.2 km", time: "4-Min Drive", icon: "🚌" },
    { place: "Main Railway Station", distance: "2.8 km", time: "8-Min Drive", icon: "🚂" },
    { place: "Regional Airport Terminal", distance: "14 km", time: "22-Min Drive", icon: "✈️" },
    { place: "Pilgrim Shopping Bazaar", distance: "100 Meters", time: "1-Min Walk", icon: "🛍️" },
    { place: "Satsang & Meditation Ashram", distance: "400 Meters", time: "4-Min Walk", icon: "🌸" }
  ];

  return (
    <section id="location" className="location-section">
      <div className="container">
        <div className="section-header-center">
          <div className="section-tag">
            <span>UNBEATABLE PROXIMITY</span>
          </div>
          <h2 className="section-title">Prime Pilgrimage Location</h2>
          <p className="section-subtitle">
            Skip the traffic and early morning hassles. Reach the sacred shrine effortlessly on foot whenever you wish.
          </p>
        </div>

        <div className="location-grid">
          <div className="location-cards-column">
            {distances.map((item, idx) => (
              <div key={idx} className="distance-card">
                <span className="distance-icon">{item.icon}</span>
                <div className="distance-info">
                  <h4>{item.place}</h4>
                  <p>{item.distance}</p>
                </div>
                <div className="time-badge">{item.time}</div>
              </div>
            ))}
          </div>

          <div className="location-map-column">
            <div className="map-styled-card">
              <div className="map-header">
                <div className="map-marker-pin">📍</div>
                <div>
                  <h3>Sri Sai Vasudev Residency</h3>
                  <p>SR RESIDENCY, NEAR ANDHRA BANK, NEW COLONY, Rayagada, Odisha - 765001</p>
                </div>
              </div>

              <div className="map-visual-placeholder">
                <div className="map-radar-pulse"></div>
                <div className="temple-pin">
                  🛕 Jagannath Temple (Rayagada)
                </div>
                <div className="hotel-pin">
                  🏨 Sri Sai Vasudev Residency
                </div>
                <div className="path-dotted-line"></div>
              </div>

              <div className="map-actions">
                <a 
                  href="https://maps.google.com/?q=Sri+Sai+Vasudev+Residency+Rayagada" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-outline-gold"
                  style={{ width: '100%' }}
                >
                  <span>🗺️ Open in Google Maps</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
