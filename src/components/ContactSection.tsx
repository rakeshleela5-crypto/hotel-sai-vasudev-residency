import React, { useState } from 'react';
import { hotelApi } from '../services/api';
import { validateIndianPhone, validateEmail } from '../utils/validation';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Room Booking & Darshan Guidance');
  const [message, setMessage] = useState('');

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (val.trim()) {
      const res = validateIndianPhone(val);
      setPhoneError(res.isValid ? null : res.error || 'Invalid mobile number');
    } else {
      setPhoneError(null);
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (val.trim() && !validateEmail(val)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phone.trim()) {
      const pRes = validateIndianPhone(phone);
      if (!pRes.isValid) {
        setPhoneError(pRes.error || 'Invalid phone number');
        setErrorMsg(pRes.error || 'Please enter a valid 10-digit Indian mobile number.');
        return;
      }
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await hotelApi.submitInquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject,
        message: message.trim()
      });
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setPhoneError(null);
      setEmailError(null);
    } catch {
      setErrorMsg('Failed to submit message online. Please call +91 94402 89999 or WhatsApp us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const prefilledWhatsAppUrl = `https://wa.me/919440289999?text=${encodeURIComponent(
    `Namaste Sri Sai Vasudev Residency! I would like to inquire about room reservations & tariff details.`
  )}`;

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
                <span className="channel-icon" aria-hidden="true">📞</span>
                <div>
                  <strong>Direct Front Desk (24/7)</strong>
                  <p>
                    <a href="tel:+919440289999">+91 94402 89999</a> &bull; <a href="tel:+919876543210">+91 98765 43210</a>
                  </p>
                </div>
              </div>

              <div className="channel-item">
                <span className="channel-icon" aria-hidden="true">💬</span>
                <div>
                  <strong>WhatsApp Front Desk</strong>
                  <p>
                    <a href={prefilledWhatsAppUrl} target="_blank" rel="noopener noreferrer">
                      +91 94402 89999 (Instant Chat)
                    </a>
                  </p>
                </div>
              </div>

              <div className="channel-item">
                <span className="channel-icon" aria-hidden="true">✉️</span>
                <div>
                  <strong>Email Desk</strong>
                  <p><a href="mailto:stay@saivasudevresidency.com">stay@saivasudevresidency.com</a></p>
                </div>
              </div>

              <div className="channel-item">
                <span className="channel-icon" aria-hidden="true">📍</span>
                <div>
                  <strong>Hotel Address</strong>
                  <p>SR RESIDENCY, NEAR ANDHRA BANK, NEW COLONY, Rayagada, Odisha - 765001</p>
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
                    <div className="alert-box error" style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: 8, margin: '12px 0', border: '1px solid #ef9a9a' }}>
                      ⚠️ {errorMsg}
                    </div>
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
                        onChange={(e) => handleEmailChange(e.target.value)}
                        required
                        style={emailError ? { borderColor: '#c62828' } : undefined}
                      />
                      {emailError && (
                        <small style={{ color: '#c62828', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                          {emailError}
                        </small>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="inquiry-phone">Phone / WhatsApp</label>
                      <input
                        id="inquiry-phone"
                        type="tel"
                        placeholder="9440289999 (10-digit Indian mobile)"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        style={phoneError ? { borderColor: '#c62828' } : undefined}
                      />
                      {phoneError && (
                        <small style={{ color: '#c62828', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                          {phoneError}
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="inquiry-subject">Subject</label>
                    <select
                      id="inquiry-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    >
                      <option value="Room Booking & Darshan Guidance">Room Booking &amp; Darshan Guidance</option>
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
                    style={{ width: '100%', minHeight: '44px' }}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting Inquiry Message...' : 'Send Inquiry Message'}
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
