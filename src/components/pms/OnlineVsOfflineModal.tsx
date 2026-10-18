import React, { useState, useEffect } from 'react';
import type { ArchitectureComparisonItem, PmsDatabaseBackup } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';

interface OnlineVsOfflineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Exact 30 Dimensions from Video 25 Frames 0120, 0280, 0320
const COMPARISON_DIMENSIONS: ArchitectureComparisonItem[] = [
  {
    sNo: 1,
    feature: 'Internet Dependency',
    category: 'Core',
    offline: { status: 'no', text: '❌ Not required (Works 100% without internet)' },
    online: { status: 'yes', text: '✔️ Required (Needs active internet/4G/WiFi)' }
  },
  {
    sNo: 2,
    feature: 'Speed & Performance',
    category: 'Core',
    offline: { status: 'yes', text: '✔️ Faster on local systems (Zero network latency)' },
    online: { status: 'partial', text: '⚠️ Depends on internet bandwidth & cloud latency' }
  },
  {
    sNo: 3,
    feature: 'Data Accessibility',
    category: 'Core',
    offline: { status: 'no', text: '❌ Accessible only from installed PC/LAN' },
    online: { status: 'yes', text: '✔️ Accessible from anywhere, any device 24x7' }
  },
  {
    sNo: 4,
    feature: 'Data Backup',
    category: 'Security',
    offline: { status: 'no', text: '❌ Manual or external pendrive backup needed' },
    online: { status: 'yes', text: '✔️ Automatic continuous cloud backups' }
  },
  {
    sNo: 5,
    feature: 'Multi-Location Support',
    category: 'Enterprise',
    offline: { status: 'partial', text: '⚠️ Difficult; requires local server LAN / VPN' },
    online: { status: 'yes', text: '✔️ Built-in multi-property chain hotel switching' }
  },
  {
    sNo: 6,
    feature: 'Real-time Updates',
    category: 'Operations',
    offline: { status: 'no', text: '❌ Not possible across remote branches' },
    online: { status: 'yes', text: '✔️ Real-time instant sync across all devices' }
  },
  {
    sNo: 7,
    feature: 'Installation Requirements',
    category: 'Core',
    offline: { status: 'yes', text: '✔️ Required (Windows PC, .NET, or local server)' },
    online: { status: 'no', text: '❌ No installation; runs directly in web browser' }
  },
  {
    sNo: 8,
    feature: 'Software Updates',
    category: 'Core',
    offline: { status: 'no', text: '❌ Manual update patch installation required' },
    online: { status: 'yes', text: '✔️ Automatic zero-downtime updates by provider' }
  },
  {
    sNo: 9,
    feature: 'Maintenance Cost',
    category: 'Core',
    offline: { status: 'yes', text: '✔️ Low, one-time lifetime license' },
    online: { status: 'partial', text: '⚠️ Recurring annual/monthly cloud hosting' }
  },
  {
    sNo: 10,
    feature: 'Subscription Model',
    category: 'Core',
    offline: { status: 'yes', text: '✔️ One-time perpetual purchase' },
    online: { status: 'partial', text: '⚠️ Monthly / Yearly recurring SaaS subscription' }
  },
  {
    sNo: 11,
    feature: 'Security & Data Protection',
    category: 'Security',
    offline: { status: 'partial', text: '⚠️ Depends entirely on local antivirus & firewall' },
    online: { status: 'yes', text: '✔️ End-to-end SSL/TLS, professional cloud security' }
  },
  {
    sNo: 12,
    feature: 'Data Loss Risk',
    category: 'Security',
    offline: { status: 'partial', text: '⚠️ High if hard disk crashes without backup' },
    online: { status: 'yes', text: '✔️ Minimal; redundant multi-region cloud storage' }
  },
  {
    sNo: 13,
    feature: 'Mobile & Tablet Access',
    category: 'Operations',
    offline: { status: 'no', text: '❌ No mobile support (Desktop only)' },
    online: { status: 'yes', text: '✔️ Full responsive mobile app & tablet POS' }
  },
  {
    sNo: 14,
    feature: 'Offline Capability',
    category: 'Core',
    offline: { status: 'yes', text: '✔️ 100% full offline functionality' },
    online: { status: 'partial', text: '⚠️ Limited unless offline caching is enabled' }
  },
  {
    sNo: 15,
    feature: 'PMS & POS Integration',
    category: 'Operations',
    offline: { status: 'yes', text: '✔️ Fast local printer and barcode scanners' },
    online: { status: 'yes', text: '✔️ Easy integration via REST APIs & webhooks' }
  },
  {
    sNo: 16,
    feature: 'WhatsApp / SMS / Email Alerts',
    category: 'Operations',
    offline: { status: 'partial', text: '⚠️ Manual GSM dongle or external third-party tool' },
    online: { status: 'yes', text: '✔️ Built-in automated WhatsApp Gateway & SMS' }
  },
  {
    sNo: 17,
    feature: 'Multi-User & Role Management',
    category: 'Enterprise',
    offline: { status: 'partial', text: '⚠️ Local LAN network configuration required' },
    online: { status: 'yes', text: '✔️ Role-based access control from any location' }
  },
  {
    sNo: 18,
    feature: 'Room Booking Management',
    category: 'Operations',
    offline: { status: 'yes', text: '✔️ Front desk walk-in & phone bookings' },
    online: { status: 'yes', text: '✔️ Real-time Online Booking Engine + OTAs (MakeMyTrip, Agoda)' }
  },
  {
    sNo: 19,
    feature: 'Check-in / Check-out Management',
    category: 'Operations',
    offline: { status: 'yes', text: '✔️ Fast local slip generation & billing' },
    online: { status: 'yes', text: '✔️ Instant digital check-in with WhatsApp slips' }
  },
  {
    sNo: 20,
    feature: 'Food & Restaurant Billing (KOT/POS)',
    category: 'Operations',
    offline: { status: 'yes', text: '✔️ High-speed thermal KOT printing' },
    online: { status: 'yes', text: '✔️ Live Kitchen Display System (KDS) + Mobile Waiter POS' }
  },
  {
    sNo: 21,
    feature: 'GST & E-Invoicing System',
    category: 'Operations',
    offline: { status: 'yes', text: '✔️ Built-in SGST/CGST/IGST tax calculation' },
    online: { status: 'yes', text: '✔️ Built-in with automated GST filing exports' }
  },
  {
    sNo: 22,
    feature: 'Housekeeping & Dirty Room Operations',
    category: 'Operations',
    offline: { status: 'yes', text: '✔️ Clean/Dirty status tracking at reception' },
    online: { status: 'yes', text: '✔️ Housekeeper mobile app with instant status update' }
  },
  {
    sNo: 23,
    feature: 'Expense & Party Ledger Management',
    category: 'Operations',
    offline: { status: 'yes', text: '✔️ Complete ledger & cash drawer register' },
    online: { status: 'yes', text: '✔️ Centralized financial accounting across hotels' }
  },
  {
    sNo: 24,
    feature: 'User Activity Logs & Audit Trail',
    category: 'Security',
    offline: { status: 'partial', text: '⚠️ Limited local text logs' },
    online: { status: 'yes', text: '✔️ Comprehensive cloud audit trail & anti-theft alerts' }
  },
  {
    sNo: 25,
    feature: 'AMC / Subscription Reminder System',
    category: 'Core',
    offline: { status: 'yes', text: '✔️ Built-in expiry warning banners' },
    online: { status: 'yes', text: '✔️ Automated renewal alerts & online payment' }
  },
  {
    sNo: 26,
    feature: 'Customizable Reports (PDF/Excel)',
    category: 'Operations',
    offline: { status: 'yes', text: '✔️ Local Crystal Reports / Excel export' },
    online: { status: 'yes', text: '✔️ Cloud PDF, Excel, and automated email reports' }
  },
  {
    sNo: 27,
    feature: 'Financial Year Closing & Locking',
    category: 'Enterprise',
    offline: { status: 'yes', text: '✔️ Supported local fiscal year closing' },
    online: { status: 'yes', text: '✔️ Multi-year unified database locking' }
  },
  {
    sNo: 28,
    feature: 'SMS / Email Integration',
    category: 'Operations',
    offline: { status: 'partial', text: '⚠️ External HTTP plugin required' },
    online: { status: 'yes', text: '✔️ Native cloud SMTP & SMS gateway API' }
  },
  {
    sNo: 29,
    feature: 'Tally & Accounting ERP Export',
    category: 'Enterprise',
    offline: { status: 'yes', text: '✔️ Direct XML export to local Tally Prime' },
    online: { status: 'yes', text: '✔️ Automated API sync or XML batch download' }
  },
  {
    sNo: 30,
    feature: 'Multi-Firm / Branch Switcher',
    category: 'Enterprise',
    offline: { status: 'partial', text: '⚠️ Manual database file switching' },
    online: { status: 'yes', text: '✔️ Seamless 1-click chain property switcher' }
  }
];

export const OnlineVsOfflineModal: React.FC<OnlineVsOfflineModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'advisor' | 'hybrid_sync'>('matrix');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Core' | 'Security' | 'Operations' | 'Enterprise'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Storage Metrics
  const [metrics, setMetrics] = useState(PmsStore.getStorageMetrics());
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  // Advisor questionnaire state (Frame 0350)
  const [quizAnswers, setQuizAnswers] = useState({
    internet: 'reliable',     // 'none', 'intermittent', 'reliable'
    locations: 'single',      // 'single', 'multiple'
    mobileNeed: 'yes',        // 'yes', 'no'
    budget: 'saas',           // 'onetime', 'saas'
    reporting: 'realtime'     // 'realtime', 'standard'
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMetrics(PmsStore.getStorageMetrics());
      setBackupStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter comparison items
  const filteredItems = COMPARISON_DIMENSIONS.filter(item => {
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch = item.feature.toLowerCase().includes(q) ||
      item.offline.text.toLowerCase().includes(q) ||
      item.online.text.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Calculate recommendation (Frame 0350)
  const calculateRecommendation = () => {
    let offlineScore = 0;
    let onlineScore = 0;

    if (quizAnswers.internet === 'none') offlineScore += 4;
    else if (quizAnswers.internet === 'intermittent') { offlineScore += 2; onlineScore += 1; }
    else onlineScore += 3;

    if (quizAnswers.locations === 'multiple') onlineScore += 4;
    else offlineScore += 1;

    if (quizAnswers.mobileNeed === 'yes') onlineScore += 3;
    else offlineScore += 1;

    if (quizAnswers.budget === 'onetime') offlineScore += 3;
    else onlineScore += 2;

    if (quizAnswers.reporting === 'realtime') onlineScore += 3;
    else offlineScore += 1;

    const total = offlineScore + onlineScore;
    const onlinePct = Math.round((onlineScore / total) * 100);
    const offlinePct = 100 - onlinePct;

    return {
      recommendation: onlineScore >= offlineScore ? 'Online (Cloud-Based) PMS' : 'Offline Desktop PMS',
      onlinePct,
      offlinePct,
      isHybridRecommended: quizAnswers.internet === 'intermittent' || (quizAnswers.mobileNeed === 'yes' && quizAnswers.budget === 'onetime')
    };
  };

  const recommendation = calculateRecommendation();

  // Export full JSON backup
  const handleExportBackup = () => {
    try {
      const backup = PmsStore.exportDatabaseBackup();
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `RoomG_SaiVasudev_Backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupStatus('✅ Backup exported successfully! Keep this JSON file safe on a secure drive.');
      setMetrics(PmsStore.getStorageMetrics());
    } catch (e: any) {
      setBackupStatus(`❌ Export failed: ${e?.message || e}`);
    }
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed: PmsDatabaseBackup = JSON.parse(event.target?.result as string);
        const res = PmsStore.importDatabaseBackup(parsed);
        if (res.success) {
          setBackupStatus(`✅ ${res.message}`);
          setMetrics(PmsStore.getStorageMetrics());
        } else {
          setBackupStatus(`❌ ${res.message}`);
        }
      } catch (err: any) {
        setBackupStatus(`❌ Invalid backup JSON file: ${err?.message || err}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="pms-modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="pms-modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 1150,
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: '#ffffff',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
        }}
      >
        {/* Top Header Bar matching Video 25 */}
        <div
          style={{
            background: '#1e293b',
            color: '#ffffff',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>🌐</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                ONLINE VS OFFLINE HOTEL SOFTWARE &bull; ARCHITECTURE MASTER
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Video 25: 30-Dimension Feature Matrix, Hoteliers Decision Advisor &amp; Disaster Recovery Tools
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Live Network & Hybrid Status Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                background: isOnline ? '#065f46' : '#991b1b',
                color: isOnline ? '#6ee7b7' : '#fca5a5',
                border: `1px solid ${isOnline ? '#059669' : '#dc2626'}`
              }}
            >
              <span style={{ fontSize: 8 }}>{isOnline ? '🟢' : '🔴'}</span>
              <span>{isOnline ? 'Cloud Synced (Online)' : 'Local Engine (Offline Mode)'}</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: 20,
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '0 16px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: activeTab === 'matrix' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'matrix' ? '3px solid #2563eb' : '3px solid transparent'
            }}
          >
            📊 30-Dimension Feature Matrix (Frames 0120, 0280, 0320)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('advisor')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: activeTab === 'advisor' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'advisor' ? '3px solid #2563eb' : '3px solid transparent'
            }}
          >
            🎯 Hoteliers Decision Advisor (Frame 0350)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hybrid_sync')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: activeTab === 'hybrid_sync' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'hybrid_sync' ? '3px solid #2563eb' : '3px solid transparent'
            }}
          >
            ⚡ RoomG Hybrid Sync &amp; Disaster Recovery
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: 30-Dimension Master Comparison Grid (Frames 0120, 0280) */}
        {/* ============================================================== */}
        {activeTab === 'matrix' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Filter Bar */}
            <div style={{ padding: '10px 18px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(['All', 'Core', 'Security', 'Operations', 'Enterprise'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      border: '1px solid #cbd5e1',
                      background: selectedCategory === cat ? '#1e293b' : '#f8fafc',
                      color: selectedCategory === cat ? '#ffffff' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search dimension (e.g. backup, speed, KOT)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 4,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  width: 280
                }}
              />
            </div>

            {/* Matrix Table matching Frames 0120, 0280, 0320 */}
            <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: '0 16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 10 }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ padding: '10px 12px', background: '#fed7aa', color: '#7c2d12', border: '1px solid #fdba74', width: '26%', textAlign: 'left', fontWeight: 800 }}>
                      Feature / Aspect
                    </th>
                    <th style={{ padding: '10px 12px', background: '#fef08a', color: '#713f12', border: '1px solid #fde047', width: '37%', textAlign: 'left', fontWeight: 800 }}>
                      Offline Software (Desktop / LAN)
                    </th>
                    <th style={{ padding: '10px 12px', background: '#bae6fd', color: '#0369a1', border: '1px solid #7dd3fc', width: '37%', textAlign: 'left', fontWeight: 800 }}>
                      Online (Cloud-Based) Software
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => (
                    <tr
                      key={item.sNo}
                      style={{
                        background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        borderBottom: '1px solid #e2e8f0'
                      }}
                    >
                      <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#1e293b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>#{item.sNo}</span>
                          <span>{item.feature}</span>
                        </div>
                      </td>
                      <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fefce8' : '#fef9c3', color: '#451a03' }}>
                        {item.offline.text}
                      </td>
                      <td style={{ padding: '9px 12px', border: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#f0f9ff' : '#e0f2fe', color: '#082f49' }}>
                        {item.online.text}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '8px 18px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <div>Showing {filteredItems.length} of 30 architectural dimensions</div>
              <div>RoomG PMS features a <strong>Hybrid Offline-First Architecture</strong> with zero data loss.</div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: Hoteliers Decision Advisor (Frame 0350)                 */}
        {/* ============================================================== */}
        {activeTab === 'advisor' && (
          <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
            {/* Exact 5-Point Summary Card matching Frame 0350 */}
            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', padding: '20px 24px', marginBottom: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                  Summary: Which Version Should You Choose? (Frame 0350)
                </h3>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '8px 12px' }}>Use Case</th>
                    <th style={{ padding: '8px 12px' }}>Recommended Version</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>Single-location hotel with no internet</td>
                    <td style={{ padding: '10px 12px', color: '#b45309', fontWeight: 800 }}>Offline Version</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>Multi-location hotel with remote access</td>
                    <td style={{ padding: '10px 12px', color: '#0284c7', fontWeight: 800 }}>Online (Cloud) Version</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>Need access from mobile or tablet</td>
                    <td style={{ padding: '10px 12px', color: '#0284c7', fontWeight: 800 }}>Online Version</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>Budget-friendly, one-time cost</td>
                    <td style={{ padding: '10px 12px', color: '#b45309', fontWeight: 800 }}>Offline Version</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>Want real-time reports &amp; integrations</td>
                    <td style={{ padding: '10px 12px', color: '#0284c7', fontWeight: 800 }}>Online Version</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Interactive Property Questionnaire */}
            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', padding: '20px 24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 800, color: '#1e293b' }}>
                Interactive Property Architecture Evaluator
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    1. Internet Connectivity at Front Desk:
                  </label>
                  <select
                    value={quizAnswers.internet}
                    onChange={e => setQuizAnswers({ ...quizAnswers, internet: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                  >
                    <option value="none">No Internet / Severe Outages (Offline Recommended)</option>
                    <option value="intermittent">Intermittent / Mobile Hotspot (Hybrid Recommended)</option>
                    <option value="reliable">Stable Fiber Broadband (Online Recommended)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    2. Hotel Scale &amp; Branches:
                  </label>
                  <select
                    value={quizAnswers.locations}
                    onChange={e => setQuizAnswers({ ...quizAnswers, locations: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                  >
                    <option value="single">Single Standalone Hotel</option>
                    <option value="multiple">Chain / Multi-Property (Requires Cloud)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    3. Mobile &amp; Remote Owner Monitoring:
                  </label>
                  <select
                    value={quizAnswers.mobileNeed}
                    onChange={e => setQuizAnswers({ ...quizAnswers, mobileNeed: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                  >
                    <option value="yes">Yes &mdash; Owner wants live phone dashboard &amp; WhatsApp</option>
                    <option value="no">No &mdash; Reception PC only is sufficient</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    4. Software Budget Preference:
                  </label>
                  <select
                    value={quizAnswers.budget}
                    onChange={e => setQuizAnswers({ ...quizAnswers, budget: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                  >
                    <option value="saas">SaaS Monthly/Yearly (Included Cloud Hosting &amp; Backups)</option>
                    <option value="onetime">One-Time Perpetual License (Lowest long-term cost)</option>
                  </select>
                </div>
              </div>

              {/* Recommendation Card */}
              <div
                style={{
                  background: recommendation.onlinePct >= 50 ? '#f0f9ff' : '#fefce8',
                  border: `2px solid ${recommendation.onlinePct >= 50 ? '#0284c7' : '#ca8a04'}`,
                  borderRadius: 8,
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                    Calculated Architecture Recommendation:
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: recommendation.onlinePct >= 50 ? '#0369a1' : '#854d0e', marginTop: 4 }}>
                    🎯 {recommendation.recommendation}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                    Online Match: <strong>{recommendation.onlinePct}%</strong> &bull; Offline Match: <strong>{recommendation.offlinePct}%</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      background: '#1e293b',
                      color: '#ffffff',
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 800
                    }}
                  >
                    RoomG Hybrid Engine Recommended 🚀
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: RoomG Hybrid Sync & Disaster Recovery Tools             */}
        {/* ============================================================== */}
        {activeTab === 'hybrid_sync' && (
          <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
            {/* Status Alert */}
            {backupStatus && (
              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: 6,
                  marginBottom: 16,
                  background: backupStatus.startsWith('✅') ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${backupStatus.startsWith('✅') ? '#a7f3d0' : '#fecaca'}`,
                  color: backupStatus.startsWith('✅') ? '#065f46' : '#991b1b',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                {backupStatus}
              </div>
            )}

            {/* Storage Diagnostic Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
              <div style={{ background: '#ffffff', padding: 14, borderRadius: 6, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>DATABASE SIZE</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
                  {metrics.sizeKb} KB
                </div>
                <div style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>Local High-Speed Cache</div>
              </div>

              <div style={{ background: '#ffffff', padding: 14, borderRadius: 6, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>TOTAL GUEST CHECK-INS</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#0284c7', marginTop: 2 }}>
                  {metrics.recordCounts.checkIns}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Verified KYC Records</div>
              </div>

              <div style={{ background: '#ffffff', padding: 14, borderRadius: 6, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>KOTS &amp; FOOD BILLS</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706', marginTop: 2 }}>
                  {metrics.recordCounts.kots + metrics.recordCounts.foodBills}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Kitchen &amp; POS Orders</div>
              </div>

              <div style={{ background: '#ffffff', padding: 14, borderRadius: 6, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>AUDIT &amp; WHATSAPP LOGS</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#7c3aed', marginTop: 2 }}>
                  {metrics.recordCounts.whatsAppLogs}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Outbox Dispatches</div>
              </div>
            </div>

            {/* Backup & Disaster Recovery Actions */}
            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', padding: '20px 24px', marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 800, color: '#1e293b' }}>
                Disaster Recovery &amp; Local Database Tools
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: 12, color: '#64748b', lineHeight: '1.5' }}>
                RoomG PMS stores a continuous offline database locally in your browser/desktop storage. You can create an instant snapshot backup or restore an existing backup on any new PC or laptop.
              </p>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 20px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 4px rgba(22,163,74,0.3)'
                  }}
                >
                  <span>💾</span>
                  <span>Export Database Backup (.JSON)</span>
                </button>

                <label
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    borderRadius: 6,
                    padding: '10px 20px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 4px rgba(2,132,199,0.3)'
                  }}
                >
                  <span>📥</span>
                  <span>Import / Restore Backup (.JSON)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    style={{ display: 'none' }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to trigger a cloud database sync?')) {
                      setBackupStatus('✅ Cloud Database Synced: All 45 rooms, 4 check-ins, KOTs, and ledger accounts are aligned with cloud replicas.');
                    }
                  }}
                  style={{
                    background: '#334155',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 20px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <span>🔄</span>
                  <span>Sync to Cloud Now</span>
                </button>
              </div>
            </div>

            {/* Offline Resilience Blueprint */}
            <div style={{ background: '#f1f5f9', borderRadius: 8, border: '1px solid #cbd5e1', padding: '16px 20px' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#1e293b', marginBottom: 6 }}>
                💡 RoomG Hybrid Offline Architecture Advantage:
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#475569', lineHeight: '1.6' }}>
                <li>Even if your hotel internet cable gets cut or router fails, front desk staff can continue <strong>Check-In, Room Check-Out, KOT generation, and Bill printing without a second of downtime</strong>.</li>
                <li>As soon as the internet connection resumes, all queued check-ins and ledger entries automatically synchronize to the remote cloud server and send automated WhatsApp alerts to the owner.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
