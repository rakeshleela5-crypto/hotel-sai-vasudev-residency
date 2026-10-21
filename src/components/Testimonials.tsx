import React from 'react';

export const Testimonials: React.FC = () => {
  const reviews = [
    {
      name: "Suresh & Anita Sharma",
      city: "New Delhi",
      rating: 5,
      date: "October 2026",
      text: "Hotel Sai Vasudev Residency made our pilgrimage trip completely stress-free! The hotel is literally a 2-minute walk from Gate 2. The rooms were spotless, AC was crisp, and the staff even guided us for the Kakad Aarti passes."
    },
    {
      name: "Venkatesh Raman",
      city: "Bengaluru",
      rating: 5,
      date: "September 2026",
      text: "We booked the Classic Studio room for our parents and kids. Very spacious, clean bathrooms with hot water, and delicious South Indian filter coffee & idlis at their Vasudev Rasoi restaurant. Highly recommended!"
    },
    {
      name: "Meenakshi Kulkarni",
      city: "Pune",
      rating: 5,
      date: "August 2026",
      text: "Outstanding hospitality. The staff treats guests like family. Safe covered parking, fast elevator, and peace of mind. We will definitely stay only at Sai Vasudev Residency on every spiritual visit."
    }
  ];

  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="section-header-center">
          <div className="section-tag">
            <span>DEVOTEE & GUEST TESTIMONIALS</span>
          </div>
          <h2 className="section-title">Cherished By Over 1,400+ Families</h2>
          <p className="section-subtitle">
            Read authentic reviews from guests who made Hotel Sai Vasudev Residency their divine home away from home.
          </p>
        </div>

        <div className="testimonials-grid">
          {reviews.map((rev, idx) => (
            <div key={idx} className="review-card">
              <div className="stars-row">
                {"★".repeat(rev.rating)}
              </div>
              <p className="review-quote">"{rev.text}"</p>
              <div className="review-author-block">
                <div className="author-avatar">{rev.name.charAt(0)}</div>
                <div>
                  <h4 className="author-name">{rev.name}</h4>
                  <span className="author-city">{rev.city} &bull; {rev.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
