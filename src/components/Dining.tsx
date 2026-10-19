import React from 'react';

export const Dining: React.FC = () => {
  return (
    <section id="dining" className="dining-section">
      <div className="container">
        <div className="dining-grid-layout">
          <div className="dining-image-column">
            <div className="dining-image-frame">
              <img 
                src="/images/restaurant.jpg" 
                alt="Vasudev Rasoi Pure Vegetarian Fine Dining Restaurant" 
                className="dining-img"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/hero.jpg';
                }}
              />
              <div className="dining-badge-overlay">
                <span className="gold-symbol" aria-hidden="true">🌿</span>
                <div>
                  <strong>100% Pure Vegetarian</strong>
                  <small>No Onion / Garlic &amp; Jain Food on Request</small>
                </div>
              </div>
            </div>
          </div>

          <div className="dining-content-column">
            <div className="section-tag">
              <span>CULINARY EXCELLENCE</span>
            </div>
            <h2 className="section-title">Vasudev Rasoi: Divine Vegetarian Flavors</h2>
            <p className="dining-lead">
              Nourish your soul after prayers with wholesome, flavorful vegetarian gastronomy. 
              Our chefs use farm-fresh ingredients, cold-pressed oils, and sacred culinary traditions.
            </p>

            <div className="dining-highlights-list">
              <div className="dining-highlight-item">
                <div className="bullet-point" aria-hidden="true">✦</div>
                <div>
                  <h4>Lavish Morning Buffet</h4>
                  <p>Crispy dosas, fluffy idlis, poha, poori-bhaji, seasonal fruits, and South Indian filter coffee.</p>
                </div>
              </div>
              <div className="dining-highlight-item">
                <div className="bullet-point" aria-hidden="true">✦</div>
                <div>
                  <h4>Royal North &amp; South Indian Thali</h4>
                  <p>Hand-crafted rotis, rich paneer gravies, dal tadka, aromatic biryani, and regional sweets.</p>
                </div>
              </div>
              <div className="dining-highlight-item">
                <div className="bullet-point" aria-hidden="true">✦</div>
                <div>
                  <h4>Special Fasting &amp; Jain Menus</h4>
                  <p>Special prasad delicacies and sattvic meals prepared in a strictly isolated clean kitchen.</p>
                </div>
              </div>
            </div>

            <div className="dining-timings-card">
              <div className="timing-col">
                <strong>Breakfast</strong>
                <span>7:00 AM – 10:30 AM</span>
              </div>
              <div className="timing-col">
                <strong>Lunch</strong>
                <span>12:30 PM – 3:30 PM</span>
              </div>
              <div className="timing-col">
                <strong>Dinner</strong>
                <span>7:00 PM – 11:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
