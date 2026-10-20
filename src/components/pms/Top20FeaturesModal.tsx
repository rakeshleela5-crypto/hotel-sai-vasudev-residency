import React, { useState } from 'react';
import type { PmsFeatureCategory } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import './pmsStyles.css';

interface Top20FeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchFeature: (targetModal: string) => void;
}

export const Top20FeaturesModal: React.FC<Top20FeaturesModalProps> = ({
  isOpen,
  onClose,
  onLaunchFeature
}) => {
  const [activeTab, setActiveTab] = useState<'all' | PmsFeatureCategory | 'pricing'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const features = PmsStore.getTop20Features();
  const pricing = PmsStore.getRoomGPricingInfo();

  const filteredFeatures = features.filter(f => {
    const matchesTab = activeTab === 'all' || f.category === activeTab;
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      f.title.toLowerCase().includes(term) ||
      f.hindiTitle.toLowerCase().includes(term) ||
      f.summary.toLowerCase().includes(term) ||
      f.route.toLowerCase().includes(term) ||
      f.specs.some(s => s.toLowerCase().includes(term));
    return matchesTab && matchesSearch;
  });

  const handleLaunch = (targetModal: string) => {
    onClose();
    onLaunchFeature(targetModal);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="pms-overlay" onClick={onClose}>
      <div
        className="pms-window"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 1140,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#f8fafc',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
        }}
      >
        {/* Top Header matching RoomG Charcoal #1e293b */}
        <header
          style={{
            background: '#1e293b',
            color: '#ffffff',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '3px solid #f59e0b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🏆</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '0.5px' }}>
                  TOP 20 ENTERPRISE FEATURES OF HOTEL SAI VASUDEV RESIDENCY ERP
                </span>
                <span
                  style={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    color: '#38bdf8',
                    fontFamily: 'monospace'
                  }}
                >
                  pms.hotelsai-vasudev.com/top20_features
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                Comprehensive 20-Pillar Enterprise Architecture &bull; Front Desk, Kitchen POS, Accounting & Cloud Sync
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handlePrintSummary}
              style={{
                background: '#334155',
                color: '#f8fafc',
                border: '1px solid #475569',
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              title="Print / Save PDF Feature Summary"
            >
              🖨️ Print Summary
            </button>
            <button type="button" onClick={onClose} className="pms-close-btn" title="Close">
              ✕
            </button>
          </div>
        </header>

        {/* Hero Spotlight Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
            padding: '16px 22px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ background: '#f59e0b', color: '#0f172a', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 900 }}>
                OFFICIAL 20-POINT AUDIT
              </span>
              <span style={{ fontSize: 12, color: '#cbd5e1' }}>
                Full Operational Blueprint • Built for Indian Hospitality &amp; GST Compliance
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#e2e8f0', maxWidth: 680, lineHeight: 1.5 }}>
              Hotel Sai Vasudev Residency ERP integrates front desk guest management, automated KOT kitchen printing, double-entry financial accounting, central warehouse inventory, anti-theft deletion guards, and direct WhatsApp guest marketing into a single real-time platform.
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#38bdf8' }}>20 / 20</div>
              <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Active Features</div>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#4ade80' }}>100%</div>
              <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Anti-Theft Guards</div>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#facc15' }}>30+</div>
              <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>MIS &amp; GST Reports</div>
            </div>
          </div>
        </div>

        {/* Toolbar & Category Filters */}
        <div
          style={{
            padding: '12px 20px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          {/* Tab buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'all' ? '#1e293b' : '#f1f5f9',
                color: activeTab === 'all' ? '#ffffff' : '#475569'
              }}
            >
              All Features (20)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('FrontDesk')}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'FrontDesk' ? '#0284c7' : '#f1f5f9',
                color: activeTab === 'FrontDesk' ? '#ffffff' : '#475569'
              }}
            >
              🏨 Front Desk &amp; Booking (5)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Restaurant')}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'Restaurant' ? '#ca8a04' : '#f1f5f9',
                color: activeTab === 'Restaurant' ? '#ffffff' : '#475569'
              }}
            >
              🍽️ Restaurant &amp; KOT (3)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Billing')}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'Billing' ? '#16a34a' : '#f1f5f9',
                color: activeTab === 'Billing' ? '#ffffff' : '#475569'
              }}
            >
              💰 Accounts &amp; Billing (6)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Inventory')}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'Inventory' ? '#9333ea' : '#f1f5f9',
                color: activeTab === 'Inventory' ? '#ffffff' : '#475569'
              }}
            >
              📦 Inventory &amp; Stores (3)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Security')}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'Security' ? '#dc2626' : '#f1f5f9',
                color: activeTab === 'Security' ? '#ffffff' : '#475569'
              }}
            >
              🛡️ Security &amp; Marketing (3)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pricing')}
              style={{
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'pricing' ? '#d97706' : '#fef3c7',
                color: activeTab === 'pricing' ? '#ffffff' : '#92400e'
              }}
            >
              📑 Brochure &amp; Pricing
            </button>
          </div>

          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>🔍</span>
            <input
              type="text"
              placeholder="Search 20 features, routes, workflows..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-input-pms"
              style={{ width: 260, fontSize: 13, padding: '6px 10px' }}
            />
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'pricing' ? (
            /* Official Brochure & Commercial License View (Frame 0055, 0060) */
            <div style={{ maxWidth: 880, margin: '0 auto', background: '#ffffff', borderRadius: 8, padding: '24px 30px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0f172a' }}>
                    Hotel Sai Vasudev Residency ERP &bull; Master Enterprise Architecture
                  </h2>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    Direct Enterprise Package from Data House ERP &bull; Frames 0055 &amp; 0060
                  </div>
                </div>
                <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #f59e0b', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                  Special Promo Price
                </span>
              </div>

              {/* Pricing Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 24 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: 18 }}>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Standard MRP</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#94a3b8', textDecoration: 'line-through', marginTop: 4 }}>
                    ₹{pricing.mrp.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Full perpetual license value</div>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 18 }}>
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>Special Discount</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>
                    - ₹{pricing.discount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: '#15803d', marginTop: 6 }}>Direct onboarding discount applied</div>
                </div>

                <div style={{ background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: 8, padding: 18 }}>
                  <div style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 800, textTransform: 'uppercase' }}>Final Offer Price</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#1d4ed8', marginTop: 4 }}>
                    ₹{pricing.finalPrice.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>+ GST</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#2563eb', marginTop: 6 }}>Complete 20-Module Enterprise Package</div>
                </div>
              </div>

              {/* Demo Credentials Box matching Frame 0055 */}
              <div style={{ background: '#f8fafc', border: '1px dashed #0284c7', borderRadius: 8, padding: 20, marginTop: 24 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🔑</span> Live Online Demo Access Credentials
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, fontSize: 13 }}>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Demo Portal URL: </span>
                    <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{pricing.demoUrl}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>User ID / Login: </span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{pricing.demoUser}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Default Password: </span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{pricing.demoPassword}</strong>
                  </div>
                </div>
              </div>

              {/* Sales & Engineering Contact details */}
              <div style={{ marginTop: 24, padding: 18, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 800, color: '#92400e' }}>
                  📞 ERP Technical Support &amp; Helpdesk
                </h4>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13, color: '#78350f' }}>
                  <div>
                    <strong>Direct Phones:</strong> {pricing.salesPhones.join(' / ')}
                  </div>
                  <div>
                    <strong>Email:</strong> {pricing.salesEmail}
                  </div>
                  <div>
                    <strong>Official Web:</strong> {pricing.officialWebsite}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => onLaunchFeature('online_booking')}
                  style={{
                    background: '#be123c',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🌐 Visit Public Room Booking Showcase (/hotel_room)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  style={{
                    background: '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ← Back to 20 Features Grid
                </button>
              </div>
            </div>
          ) : (
            /* 20 Features Cards Grid */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
              {filteredFeatures.map(feat => (
                <div
                  key={feat.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.03)';
                  }}
                >
                  {/* Card Header */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            background: feat.accentColor,
                            color: '#ffffff',
                            fontWeight: 900,
                            fontSize: 12,
                            padding: '3px 7px',
                            borderRadius: 4
                          }}
                        >
                          #{feat.id}
                        </span>
                        <span style={{ fontSize: 18 }}>{feat.icon}</span>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                          {feat.title}
                        </h3>
                      </div>
                      <span
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#64748b'
                        }}
                      >
                        {feat.categoryLabel}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 700, color: '#ca8a04', marginTop: 4 }}>
                      {feat.hindiTitle}
                    </div>

                    {/* Monospace route badge */}
                    <div
                      style={{
                        marginTop: 8,
                        background: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontFamily: 'monospace',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span>🔗</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {feat.route}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '14px 16px', flex: 1 }}>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                      {feat.summary}
                    </p>

                    {/* Anti-Theft Operational Rationale */}
                    {feat.antiTheftRationale && (
                      <div
                        style={{
                          background: '#fef2f2',
                          borderLeft: '3px solid #ef4444',
                          padding: '8px 10px',
                          borderRadius: '0 4px 4px 0',
                          fontSize: 11,
                          color: '#991b1b',
                          marginBottom: 12,
                          lineHeight: 1.4
                        }}
                      >
                        <strong style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          🛡️ Fraud Prevention Rationale:
                        </strong>
                        {feat.antiTheftRationale}
                      </div>
                    )}

                    {/* Technical Specs List */}
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                      {feat.specs.map((spec, sIdx) => (
                        <li key={sIdx}>{spec}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Card Footer with Direct Launch Button */}
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#f8fafc',
                      borderTop: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      Ready to operate
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLaunch(feat.targetModal)}
                      style={{
                        background: feat.accentColor,
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                      title={`Launch ${feat.title} module live in PMS`}
                    >
                      <span>🚀 Launch Screen</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer
          style={{
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#64748b'
          }}
        >
          <div>
            Showing <strong>{filteredFeatures.length}</strong> of <strong>20</strong> Enterprise Features &bull; Hotel ERP v27.0
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#e2e8f0',
                color: '#334155',
                border: 'none',
                padding: '6px 16px',
                borderRadius: 4,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
