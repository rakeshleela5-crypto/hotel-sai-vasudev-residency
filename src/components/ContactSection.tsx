import React, { useState } from 'react';
import { hotelApi } from '../services/api';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Room Booking & Darshan Guidance');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await hotelApi.submitInquiry({
        name,
        email,
        phone,
        subject,
        message
      });
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch {
      setErrorMsg('Failed to submit message. Please call or WhatsApp us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <div className="contact-wrapper">
          <div className="contact-info-col">
            <div className="section-tag dark">
              <span>GET IN TOUCH</span>
            </div>
            <h2 className="section-title light">Connect With Our Front Desk</h2>
            <p className="contact-lead light">
              Planning your visit? Have special pilgrimage needs or bulk family bookings? 
              Our 24/7 concierge is at your service.
            </p>

            <div className="contact-channel-list">
              <div className="channel-item">
                <span className="channel-icon">📞</span>
                <div>
                  <strong>Direct Front Desk</strong>
                  <p><a href="tel:+919876543210">+91 98765 43210</a> / <a href="tel:+919876543211">+91 98765 43211</a></p>
                </div>
              </div>

              <div className="channel-item">
                <span className="channel-icon">💬</span>
                <div>
                  <strong>WhatsApp Reservations</strong>
                  <p><a href="https://wa.me/919876543210" target="_blank" rel="noreferrer">+91 98765 43210 (Instant Chat)</a></p>
                </div>
              </div>

              <div className="channel-item">
                <span className="channel-icon">✉️</span>
                <div>
                  <strong>Email Desk</strong>
                  <p><a href="mailto:stay@saivasudevresidency.com">stay@saivasudevresidency.com</a></p>
                </div>
              </div>

              <div className="channel-item">
                <span className="channel-icon">📍</span>
                <div>
                  <strong>Address</strong>
                  <p>Plot No. 14-B, VIP Temple Road, Near Gate No. 2, Spiritual City, Pin 423109</p>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-form-col">
            <div className="contact-form-card">
              <h3>Send An Inquiry</h3>
              <p>We typically respond within 15 minutes during operating hours.</p>

              {submitted ? (
                <div className="alert-box success">
                  ✓ <strong>Inquiry Received!</strong> Our guest relations team has received your message and will reach out to your phone/email shortly.
                  <button 
                    className="btn btn-outline-gold" 
                    style={{ marginTop: '12px', padding: '6px 16px', fontSize: '0.85rem' }}
                    onClick={() => setSubmitted(false)}
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="inquiry-form">
                  {errorMsg && (
                    <div className="alert-box error">⚠️ {errorMsg}</div>
                  )}

                  <div className="form-group">
                    <label htmlFor="inquiry-name">Your Full Name</label>
                    <input
                      id="inquiry-name"
                      type="text"
                      placeholder="e.g. Ramesh Patel"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="inquiry-email">Email Address</label>
                      <input
                        id="inquiry-email"
                        type="email"
                        placeholder="ramesh@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="inquiry-phone">Phone / WhatsApp</label>
                      <input
                        id="inquiry-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="inquiry-subject">Subject</label>
                    <select
                      id="inquiry-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    >
                      <option value="Room Booking & Darshan Guidance">Room Booking & Darshan Guidance</option>
                      <option value="Family / Group Booking (3+ Rooms)">Family / Group Booking (3+ Rooms)</option>
                      <option value="Airport / Station Pickup Service">Airport / Station Pickup Service</option>
                      <option value="Satsang / Banquet Hall Inquiry">Satsang / Banquet Hall Inquiry</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="inquiry-message">Your Message</label>
                    <textarea
                      id="inquiry-message"
                      rows={3}
                      placeholder="Specify your travel dates, number of persons, or special queries..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    id="submit-inquiry-btn"
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting to Railway Backend...' : 'Send Inquiry Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
