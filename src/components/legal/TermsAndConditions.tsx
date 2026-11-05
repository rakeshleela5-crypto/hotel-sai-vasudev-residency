import React from 'react';
import { useNavigate } from 'react-router-dom';

export const TermsAndConditions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#090d16',
        color: '#e2e8f0',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        lineHeight: 1.7,
      }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '14px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f2d77a 0%, #d4af37 100%)',
                color: '#0a111e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontFamily: 'serif',
                fontSize: '18px',
              }}
            >
              SV
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#fae084', letterSpacing: '0.5px' }}>
                HOTEL SAI VASUDEV RESIDENCY
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>SHIRDI VIP ROAD • DIVINE HOSPITALITY</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #475569',
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← Back to Home
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/erp';
              }}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🛎️ Front Desk ERP
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ marginBottom: 32, borderBottom: '1px solid #334155', paddingBottom: 20 }}>
          <span
            style={{
              background: 'rgba(212, 175, 55, 0.15)',
              color: '#fae084',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '1px',
            }}
          >
            TERMS OF STAY &amp; RESERVATION CONTRACT
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', margin: '12px 0 6px' }}>
            Terms &amp; Conditions of Stay
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Effective Date: April 1, 2026 &bull; Hotel Sai Vasudev Residency, Shirdi
          </p>
        </div>

        {/* Section 1 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fae084', marginBottom: 10 }}>
            1. Check-In &amp; Check-Out Schedules
          </h2>
          <ul style={{ fontSize: '14px', color: '#cbd5e1', paddingLeft: 24, margin: 0 }}>
            <li>
              <strong>Standard Check-In Time:</strong> 12:00 PM (Noon) IST. Early check-in is subject to room cleanliness and availability.
            </li>
            <li>
              <strong>Standard Check-Out Time:</strong> 11:00 AM IST sharp with a standard 30-minute grace period until 11:30 AM IST.
            </li>
            <li>
              <strong>Late Check-Out Policy:</strong> Departures between 11:30 AM and 04:00 PM IST will be billed a half-day tariff charge.
              Departures after 04:00 PM IST incur a full-day tariff charge. All waivers require authorized Duty Manager sign-off.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fae084', marginBottom: 10 }}>
            2. Mandatory Guest KYC Verification
          </h2>
          <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
            In strict compliance with directives from the Maharashtra Police Department and Shirdi Local Administration:
          </p>
          <ul style={{ fontSize: '14px', color: '#cbd5e1', paddingLeft: 24, marginTop: 8 }}>
            <li>Every adult occupant must present an original, valid government-issued photo ID (Aadhaar Card, Passport, Voter ID, or Driving License).</li>
            <li>PAN Cards are not accepted as valid identity proof under Indian hotel regulations.</li>
            <li>Foreign national guests must present an original passport, valid Indian entry visa, and complete mandatory Police Form-C declarations upon arrival.</li>
            <li>Failure to provide mandatory identification will result in immediate cancellation of reservation without refund.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fae084', marginBottom: 10 }}>
            3. Tariff Structure, Invoicing &amp; GST Compliance
          </h2>
          <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
            Room tariffs are billed per room per night. Rates are subject to applicable Goods and Services Tax (GST):
          </p>
          <ul style={{ fontSize: '14px', color: '#cbd5e1', paddingLeft: 24, marginTop: 8 }}>
            <li><strong>Room Accommodation (SAC 996311):</strong> GST rate of 12% for tariffs up to ₹7,500/night; 18% for tariffs above ₹7,500/night.</li>
            <li><strong>Vasudev Rasoi Restaurant &amp; Room Dining (SAC 996331):</strong> GST rate of 5.0% (2.5% CGST + 2.5% SGST).</li>
            <li><strong>Corporate B2B Invoices:</strong> Valid 15-character GSTIN must be provided at the time of check-in to generate input tax credit (ITC) eligible invoices.</li>
            <li>Sequential GST invoice numbers are cryptographically recorded and cannot be retroactively modified.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fae084', marginBottom: 10 }}>
            4. Reservation, Advance Deposits &amp; Cancellation Policy
          </h2>
          <ul style={{ fontSize: '14px', color: '#cbd5e1', paddingLeft: 24, margin: 0 }}>
            <li>
              <strong>Advance Payment:</strong> A minimum 50% advance deposit (or full payment during peak festival dates like Guru Purnima, Ram Navami, and Vijayadashami)
              is required to secure confirmed reservations.
            </li>
            <li>
              <strong>Standard Cancellation:</strong> Cancellations made 48 hours prior to the check-in date are eligible for an 85% refund (15% processing fee applies).
            </li>
            <li>
              <strong>Late Cancellation &amp; No-Shows:</strong> Cancellations within 48 hours of check-in, or failure to arrive on the booked date, result in forfeiture of the advance deposit.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fae084', marginBottom: 10 }}>
            5. Decentro Digital Payments &amp; Zero-Balance Settlement Policy
          </h2>
          <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
            Digital settlements through Decentro Dynamic UPI QR, debit/credit cards, and bank transfers:
          </p>
          <ul style={{ fontSize: '14px', color: '#cbd5e1', paddingLeft: 24, marginTop: 8 }}>
            <li><strong>Folio Zero-Balance Policy:</strong> Check-out cannot be finalized until all room tariffs, dining KOTs, and incidental charges are fully settled.</li>
            <li><strong>Automated Bank Reconciliation:</strong> Dynamic QR payments are credited directly into hotel escrow accounts in real time via Decentro webhooks.</li>
            <li><strong>Failed Payment Handshake:</strong> If money is debited from a guest&rsquo;s bank account without an automated bank confirmation UTR, resolution will proceed under standard RBI T+1 banking reconciliation timelines.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fae084', marginBottom: 10 }}>
            6. House Rules &amp; Pilgrimage Decorum
          </h2>
          <ul style={{ fontSize: '14px', color: '#cbd5e1', paddingLeft: 24, margin: 0 }}>
            <li>All rooms and public corridors are strictly non-smoking zones. A sanitization fee of ₹2,500 applies for smoking inside guest rooms.</li>
            <li>Consuming narcotics or illegal substances is strictly prohibited and subject to immediate police reporting.</li>
            <li>To preserve the divine pilgrimage atmosphere of Shirdi, loud music, rowdy behavior, or disturbances after 10:00 PM IST are prohibited.</li>
            <li>Non-registered external visitors are not permitted in guest rooms between 10:00 PM and 07:00 AM IST.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fae084', marginBottom: 10 }}>
            7. Legal Jurisdiction
          </h2>
          <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
            Any disputes, legal claims, or arbitration arising from reservations, stays, or billing shall be governed strictly by Indian Law
            under the exclusive jurisdiction of the competent courts in Rahata / Ahmednagar District, Maharashtra, India.
          </p>
        </section>
      </main>
    </div>
  );
};
export default TermsAndConditions;

