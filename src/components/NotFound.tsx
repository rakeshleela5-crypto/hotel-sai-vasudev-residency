import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a111e 0%, #0f172a 50%, #1e293b 100%)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '580px',
          width: '100%',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: '20px',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
          padding: '44px 32px',
        }}
      >
        {/* Gold Monogram Badge */}
        <div
          style={{
            width: '76px',
            height: '76px',
            margin: '0 auto 20px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #f2d77a 0%, #d4af37 100%)',
            color: '#0a111e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 900,
            fontFamily: 'serif',
            boxShadow: '0 8px 24px rgba(212, 175, 55, 0.4)',
          }}
        >
          SV
        </div>

        {/* 404 Status Pill */}
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '1px',
            marginBottom: '14px',
          }}
        >
          ERROR 404 • ROUTE NOT FOUND
        </div>

        <h1
          style={{
            fontSize: '30px',
            fontWeight: 800,
            color: '#fae084',
            margin: '0 0 8px 0',
            letterSpacing: '0.5px',
          }}
        >
          Page Not Found
        </h1>

        <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginBottom: '22px' }}>
          HOTEL SAI VASUDEV RESIDENCY &bull; SHIRDI VIP ROAD
        </div>

        <p
          style={{
            fontSize: '14px',
            lineHeight: 1.6,
            color: '#cbd5e1',
            margin: '0 0 32px 0',
          }}
        >
          The page or reservation service you are attempting to reach does not exist, has been moved, or is temporarily restricted.
          You can return to the public guest portal or access the front-desk operational dashboard below.
        </p>

        {/* Navigation Actions */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                flex: 1,
                minWidth: '180px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '13px 20px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <span>🏨</span>
              <span>Back to Home</span>
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href = '/erp';
              }}
              style={{
                flex: 1,
                minWidth: '180px',
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '13px 20px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <span>🛎️</span>
              <span>Return to Front Desk Dashboard</span>
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', fontSize: '12px' }}>
            <button
              type="button"
              onClick={() => navigate('/privacy-policy')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Privacy Policy
            </button>
            <span style={{ color: '#475569' }}>&bull;</span>
            <button
              type="button"
              onClick={() => navigate('/terms-and-conditions')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Terms of Stay
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          24/7 Front Desk Hotline: +91 94402 89999 &bull; Shirdi VIP Road &bull; Near Sai Baba Temple
        </div>
      </div>
    </div>
  );
};
export default NotFound;

