import React from 'react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
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
            STATUTORY COMPLIANCE & PRIVACY GUARANTEE
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', margin: '12px 0 6px' }}>
            Privacy Policy &amp; Guest Data Protection
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Effective Date: April 1, 2026 &bull; Hotel Sai Vasudev Residency, Shirdi
          </p>
        </div>

        {/* Section 1 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fae084', marginBottom: 10 }}>
            1. Hotel Identity &amp; Commitment to Guest Privacy
          </h2>
          <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
            Hotel Sai Vasudev Residency (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Hotel&rdquo;), located on VIP Road, Shirdi,
            Maharashtra 423109, is dedicated to protecting the privacy, security, and confidentiality of our pilgrimage guests,
            corporate clients, and restaurant patrons. This policy details how personal data, statutory identity documents, and payment details
            are processed under Indian Information Technology laws and local hospitality police regulations.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fae084', marginBottom: 10 }}>
            2. Guest KYC Document Storage &amp; Police C-Form Compliance
          </h2>
          <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
            Under Maharashtra Police Regulations and the Bureau of Immigration (Ministry of Home Affairs), every hospitality property
            in Shirdi is legally required to verify and maintain the identity proof of all arriving guests.
          </p>
          <ul style={{ fontSize: '14px', color: '#cbd5e1', paddingLeft: 24, marginTop: 8 }}>
            <li>
              <strong>Indian Citizens:</strong> Verified via Government Photo ID (Aadhaar Card, Passport, Voter ID, or Driving License).
              Aadhaar numbers are recorded for verification purposes with masking options where applicable.
            </li>
            <li>
              <strong>Foreign Nationals:</strong> Mandatory recording of Passport Number, Visa Number, Indian Port of Entry, and submission
              of official Police Form-C declarations.
            </li>
            <li>
              <strong>Encrypted Cloud Storage:</strong> ID scan photos are compressed client-side and securely stored in encrypted
              Cloudflare R2 storage buckets with strict time-limited access tokens. ID files are never publicly indexed or accessible to third-party web crawlers.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fae084', marginBottom: 10 }}>
            3. Decentro Banking &amp; UPI Payment Processing
          </h2>
          <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
            All direct digital settlements—including Dynamic UPI QR codes, Card EDC settlements, and Dedicated Virtual Accounts—are powered
            through Decentro Banking APIs and integrated Indian banking partners (ICICI / Yes Bank).
          </p>
          <ul style={{ fontSize: '14px', color: '#cbd5e1', paddingLeft: 24, marginTop: 8 }}>
            <li>
              <strong>Zero Storage of Sensitive Credentials:</strong> Hotel Sai Vasudev Residency never sees, collects, or stores guest UPI PINs,
              debit/credit card CVV numbers, or net banking passwords.
            </li>
            <li>
              <strong>Dynamic QR Generation:</strong> Unique UPI payment links and QR images are generated on demand with strict 15-minute expiration windows.
            </li>
            <li>
              <strong>Cryptographic Webhook Verification:</strong> Real-time payment notifications are cryptographically verified using HMAC-SHA256 signatures,
              ensuring only authenticated bank callbacks reconcile guest folios.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fae084', marginBottom: 10 }}>
            4. Information We Collect During Your Stay
          </h2>
          <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
            We collect only information essential to deliver a seamless temple visit and hospitality stay:
          </p>
          <ul style={{ fontSize: '14px', color: '#cbd5e1', paddingLeft: 24, marginTop: 8 }}>
            <li>Contact Information: Primary guest name, 10-digit Indian mobile number, residential address, and email address.</li>
            <li>Stay History: Check-in date/time, check-out date/time, allocated room number, and accompanying family member counts.</li>
            <li>Vasudev Rasoi Dining Orders: Room service and restaurant Kitchen Order Tickets (KOT) consolidated to the guest room folio.</li>
            <li>Police Station Register Logs: Coming from (origin city), proceeding to (destination city), and purpose of visit (Temple Darshan).</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fae084', marginBottom: 10 }}>
            5. Data Retention &amp; Audit Integrity
          </h2>
          <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
            In accordance with statutory Indian GST laws and local police department mandates, room billing records, GST tax invoices (SAC 996311),
            and police guest registers are retained for a minimum statutory period of three (3) years. To prevent fraudulent billing gaps,
            cancelled transactions utilize soft-delete audit records rather than hard data deletion.
          </p>
        </section>

        {/* Section 6 */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fae084', marginBottom: 10 }}>
            6. Grievance Redressal &amp; Front Desk Contact
          </h2>
          <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
            If you have questions, corrections, or privacy requests regarding your guest profile or data handling, please contact our
            Front Desk Management directly:
          </p>
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '16px 20px',
              fontSize: '13px',
              color: '#e2e8f0',
              marginTop: 10,
            }}
          >
            <div><strong>General Manager:</strong> Hotel Sai Vasudev Residency</div>
            <div><strong>Address:</strong> VIP Road, Shirdi, Taluka Rahata, District Ahmednagar, Maharashtra 423109</div>
            <div><strong>24/7 Telephone:</strong> +91 94402 89999</div>
            <div><strong>Official Email:</strong> privacy@hotelsai-vasudev.com</div>
          </div>
        </section>
      </main>
    </div>
  );
};
export default PrivacyPolicy;

