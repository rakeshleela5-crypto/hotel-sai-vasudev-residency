import React from 'react';

export const Amenities: React.FC = () => {
  const amenitiesList = [
    {
      icon: "🛕",
      title: "Temple Darshan Assistance",
      desc: "Our dedicated spiritual desk assists with VIP Aarti passes, special puja schedules, and direct shuttle to the temple gates."
    },
    {
      icon: "🍽️",
      title: "Pure Vegetarian Cuisine",
      desc: "In-house sattvic and multi-cuisine restaurant serving authentic South Indian delicacies, North Indian curries, and breakfast buffet."
    },
    {
      icon: "⚡",
      title: "100% Power Backup & Central AC",
      desc: "Seamless 24/7 generator backup ensuring continuous uninterrupted air conditioning, lighting, and elevator operation."
    },
    {
      icon: "📶",
      title: "High-Speed Wi-Fi & Smart TVs",
      desc: "Dedicated optical fiber connection in all rooms and public lobbies, plus smart TVs with OTT streaming capabilities."
    },
    {
      icon: "🚗",
      title: "Valet Parking & Travel Desk",
      desc: "Spacious private parking with 24/7 CCTV surveillance, chauffeur accommodation, and rental cars for local sightseeing."
    },
    {
      icon: "🚿",
      title: "24-Hour Hot & Cold Water",
      desc: "Instant pressurized solar-assisted hot water in all Italian marble bathrooms, complete with branded ayurvedic toiletries."
    },
    {
      icon: "🛎️",
      title: "24/7 In-Room Dining Service",
      desc: "Prompt room service for midnight cravings, herbal tea, warm milk, and fresh snacks right to your bedside."
    },
    {
      icon: "👥",
      title: "Satsang & Banquet Hall",
      desc: "An acoustic-treated hall for spiritual gatherings, family functions, devotional events, and private meetings."
    }
  ];

  return (
    <section id="amenities" className="amenities-section">
      <div className="container">
        <div className="section-header-center">
          <div className="section-tag">
            <span>PREMIUM HOSPITALITY</span>
          </div>
          <h2 className="section-title">Amenities Designed For Your Solace</h2>
          <p className="section-subtitle">
            Every facility at SRI SAI VASUDEV RESIDENCY is curated to make your stay and travel thoroughly peaceful and revitalizing.
          </p>
        </div>

        <div className="amenities-grid">
          {amenitiesList.map((item, idx) => (
            <div key={idx} className="amenity-card">
              <div className="amenity-icon-box">{item.icon}</div>
              <h3 className="amenity-title">{item.title}</h3>
              <p className="amenity-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
