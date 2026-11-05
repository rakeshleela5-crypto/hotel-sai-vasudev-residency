import React from 'react';

export const Testimonials: React.FC = () => {
  const reviews = [
    {
      name: "Suresh & Anita Sharma",
      city: "New Delhi",
      rating: 5,
      date: "October 2026",
      text: "SRI SAI VASUDEV RESIDENCY made our visit to Rayagada completely stress-free! The hotel is conveniently located near Andhra Bank, New Colony. The rooms were spotless, AC was crisp, and the staff was extremely helpful."
    },
    {
      name: "Venkatesh Raman",
      city: "Bengaluru",
      rating: 5,
      date: "September 2026",
      text: "We booked the Classic Studio room for our parents and kids. Very spacious, clean bathrooms with hot water, and delicious South Indian breakfast at their Vasudev Rasoi restaurant. Highly recommended!"
    },
    {
      name: "Meenakshi Kulkarni",
      city: "Pune",
      rating: 5,
      date: "August 2026",
      text: "Outstanding hospitality. The staff treats guests like family. Safe covered parking, fast elevator, and peace of mind. We will definitely stay only at SRI SAI VASUDEV RESIDENCY on every visit to Rayagada."
    }
  ];

  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="section-header-center">
          <div className="section-tag">
            <span>VALUED GUEST TESTIMONIALS</span>
          </div>
          <h2 className="section-title">Cherished By Over 1,400+ Families</h2>
          <p className="section-subtitle">
            Read authentic reviews from guests who made SRI SAI VASUDEV RESIDENCY their preferred home away from home in Rayagada.
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
