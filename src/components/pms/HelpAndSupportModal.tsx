import React, { useState } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { 
  PmsHelpVideo, 
  PmsSupportTicket, 
  PmsDocumentationChapter,
  PmsDemoRequest
} from '../../types/pmsModels';

interface HelpAndSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'videos' | 'tickets' | 'remote' | 'manual' | 'demo';
}

export const HelpAndSupportModal: React.FC<HelpAndSupportModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'videos'
}) => {
  const [activeTab, setActiveTab] = useState<'videos' | 'tickets' | 'remote' | 'manual' | 'demo'>(initialTab);
  
  // Video Hub State
  const [videoCategory, setVideoCategory] = useState<string>('All');
  const [videoSearch, setVideoSearch] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<PmsHelpVideo | null>(null);

  // Manual / Documentation State
  const [manualSearch, setManualSearch] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<PmsDocumentationChapter | null>(null);

  // Tickets State
  const [tickets, setTickets] = useState<PmsSupportTicket[]>(() => PmsStore.getSupportTickets());
  const [ticketSearch, setTicketSearch] = useState<string>('');
  const [showNewTicketForm, setShowNewTicketForm] = useState<boolean>(false);
  
  // New Ticket Form State
  const [ticketCategory, setTicketCategory] = useState<PmsSupportTicket['category']>('Check-in & KYC');
  const [ticketPriority, setTicketPriority] = useState<PmsSupportTicket['priority']>('Medium');
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketDescription, setTicketDescription] = useState<string>('');
  const [ticketStaffName, setTicketStaffName] = useState<string>('Reception Incharge');
  const [ticketDepartment, setTicketDepartment] = useState<string>('Front Desk');
  const [ticketPhone, setTicketPhone] = useState<string>('9822000000');
  const [ticketCallback, setTicketCallback] = useState<string>('11:00 AM – 01:00 PM');
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState<string>('');

  // Remote Desktop State
  const remoteSession = PmsStore.getRemoteSupportSession();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Demo Request Form State
  const [demoHotelName, setDemoHotelName] = useState<string>('HOTEL SAI VASUDEV RESIDENCY');
  const [demoContactPerson, setDemoContactPerson] = useState<string>('Rakesh Sharma');
  const [demoPhone, setDemoPhone] = useState<string>('9822000000');
  const [demoWhatsapp, setDemoWhatsapp] = useState<string>('9822000000');
  const [demoEmail, setDemoEmail] = useState<string>('hotelsaivasudevresidency@gmail.com');
  const [demoPropertyType, setDemoPropertyType] = useState<PmsDemoRequest['propertyType']>('Hotel');
  const [demoRoomCount, setDemoRoomCount] = useState<number>(54);
  const [demoHasRestaurant, setDemoHasRestaurant] = useState<boolean>(true);
  const [demoCity, setDemoCity] = useState<string>('Shirdi');
  const [demoState, setDemoState] = useState<string>('Maharashtra');
  const [demoPreferredDate, setDemoPreferredDate] = useState<string>('2025-07-22');
  const [demoNotes, setDemoNotes] = useState<string>('Requesting live demo for multi-user mobile KOT and Night Audit setup.');
  const [demoSuccessMsg, setDemoSuccessMsg] = useState<string>('');

  const contactInfo = PmsStore.getSupportContactInfo();
  const helpVideos = PmsStore.getHelpVideos(videoCategory, videoSearch);
  const docChapters = PmsStore.getDocumentationChapters(manualSearch);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      alert('Please fill in Subject and Description for the support ticket.');
      return;
    }
    const newTkt = PmsStore.createSupportTicket({
      date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      staffName: ticketStaffName,
      department: ticketDepartment,
      phone: ticketPhone,
      category: ticketCategory,
      priority: ticketPriority,
      subject: ticketSubject,
      description: ticketDescription,
      preferredCallbackTime: ticketCallback
    });
    setTickets(PmsStore.getSupportTickets());
    setShowNewTicketForm(false);
    setTicketSubject('');
    setTicketDescription('');
    setTicketSuccessMsg(`Ticket ${newTkt.ticketNo} generated successfully! Our support engineer will call you.`);
    setTimeout(() => setTicketSuccessMsg(''), 6000);
  };

  const handleSubmitDemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoHotelName || !demoPhone) {
      alert('Please enter Property Name and Contact Phone.');
      return;
    }
    const req = PmsStore.submitDemoRequest({
      hotelName: demoHotelName,
      contactPerson: demoContactPerson,
      phoneNumber: demoPhone,
      whatsappNumber: demoWhatsapp,
      email: demoEmail,
      propertyType: demoPropertyType,
      roomCount: demoRoomCount,
      hasRestaurant: demoHasRestaurant,
      city: demoCity,
      state: demoState,
      preferredDate: demoPreferredDate,
      notes: demoNotes
    });
    setDemoSuccessMsg(`Thank you! Demo request submitted. Ref ID: ${req.id}. Opening WhatsApp confirmation...`);
    
    // Open WhatsApp inquiry
    const waText = encodeURIComponent(
      `Hello Hansin IT Services! I would like to request a Free Demo of RoomG Hotel Management Software.\n\n` +
      `Property: ${demoHotelName}\n` +
      `Contact Person: ${demoContactPerson}\n` +
      `Phone: ${demoPhone}\n` +
      `Rooms: ${demoRoomCount} | Restaurant: ${demoHasRestaurant ? 'Yes' : 'No'}\n` +
      `Location: ${demoCity}, ${demoState}\n` +
      `Preferred Date: ${demoPreferredDate}\n\n` +
      `Note: ${demoNotes}`
    );
    window.open(`https://wa.me/917999663696?text=${waText}`, '_blank');
    setTimeout(() => setDemoSuccessMsg(''), 6000);
  };

  const handleShareRemoteOnWhatsApp = () => {
    const waText = encodeURIComponent(
      `Hello Hansin IT Support Team, this is ${remoteSession.hotelName}.\n\n` +
      `We need remote support. Here are our ${remoteSession.tool} credentials:\n` +
      `Your ID: ${remoteSession.partnerId}\n` +
      `Password: ${remoteSession.passcode}\n\n` +
      `Please connect at your earliest convenience. Thank you!`
    );
    window.open(`https://wa.me/917999663696?text=${waText}`, '_blank');
  };

  const filteredTickets = tickets.filter(t => {
    if (!ticketSearch.trim()) return true;
    const q = ticketSearch.toLowerCase();
    return (
      t.ticketNo.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.staffName.toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="pms-modal-overlay" style={{ zIndex: 1200 }}>
      <div 
        className="pms-modal-content" 
        style={{ 
          maxWidth: 1140, 
          width: '95%', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0,
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Top Header Bar */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          padding: '16px 24px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>🎓</span>
              <h2 style={{ margin: 0, fontSize: 20, color: '#f8fafc', fontWeight: 800 }}>
                RoomG Training &amp; Customer Support Suite
              </h2>
              <span style={{ 
                background: '#0284c7', 
                color: '#fff', 
                fontSize: 11, 
                padding: '2px 8px', 
                borderRadius: 4, 
                fontWeight: 700 
              }}>
                Video 30 Master Helpdesk
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              Hansin IT Services / Data House ERP &bull; Support Hours: <strong>11:00 AM – 07:00 PM IST</strong> &bull; Helplines: <strong>7999663696 / 8871702803</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* WhatsApp Quick Escalation */}
            <a 
              href="https://wa.me/917999663696?text=Namaste%20RoomG%20Support%2C%20I%20need%20assistance%20with%20Hotel%20Sai%20Vasudev%20Residency." 
              target="_blank" 
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#22c55e',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                textDecoration: 'none'
              }}
            >
              <span>💬</span> WhatsApp Helpdesk
            </a>

            <button 
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid #475569',
                color: '#cbd5e1',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* License & Validity Banner (Frame 0130) */}
        <div style={{
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          padding: '8px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          fontSize: 12
        }}>
          <div style={{ color: '#cbd5e1' }}>
            <span>🏢 Property: <strong>{contactInfo.licenseInfo.hotelName}</strong> ({contactInfo.licenseInfo.firmId})</span>
            <span style={{ margin: '0 8px', color: '#64748b' }}>|</span>
            <span>Activation: <strong>{contactInfo.licenseInfo.activationDate}</strong> &bull; Renew: <strong>{contactInfo.licenseInfo.renewDate}</strong></span>
            <span style={{ margin: '0 8px', color: '#64748b' }}>|</span>
            <span>Days Remaining: <strong style={{ color: '#38bdf8' }}>{contactInfo.licenseInfo.daysRemaining} days</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: '#16a34a',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: 4,
              fontWeight: 800,
              fontSize: 11
            }}>
              WhatsApp Validity: {contactInfo.licenseInfo.whatsappValidity}
            </span>
            <span style={{
              background: '#0284c7',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 11
            }}>
              Cloud Multi-User Active
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          background: '#0f172a',
          borderBottom: '2px solid #334155',
          padding: '0 24px',
          overflowX: 'auto',
          gap: 6
        }}>
          <button
            onClick={() => setActiveTab('videos')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'videos' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'videos' ? '#38bdf8' : '#94a3b8',
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap'
            }}
          >
            <span>🎥</span> Video Tutorials Catalog (/helps)
            <span style={{
              background: activeTab === 'videos' ? '#0284c7' : '#334155',
              color: '#fff',
              fontSize: 11,
              padding: '1px 6px',
              borderRadius: 10
            }}>
              {helpVideos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'tickets' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'tickets' ? '#38bdf8' : '#94a3b8',
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap'
            }}
          >
            <span>🎫</span> Support Tickets &amp; Assistance (/support_tickets)
            <span style={{
              background: activeTab === 'tickets' ? '#0284c7' : '#334155',
              color: '#fff',
              fontSize: 11,
              padding: '1px 6px',
              borderRadius: 10
            }}>
              {tickets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('remote')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'remote' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'remote' ? '#38bdf8' : '#94a3b8',
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap'
            }}
          >
            <span>🖥️</span> Remote Desktop (UltraViewer &amp; AnyDesk)
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'manual' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'manual' ? '#38bdf8' : '#94a3b8',
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap'
            }}
          >
            <span>📖</span> User Manual &amp; Modules (/documentation)
          </button>

          <button
            onClick={() => setActiveTab('demo')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'demo' ? '3px solid #38bdf8' : '3px solid transparent',
              color: activeTab === 'demo' ? '#38bdf8' : '#94a3b8',
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap'
            }}
          >
            <span>🚀</span> Free Demo &amp; License Renewal
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#0b1120' }}>
          
          {/* TAB 1: VIDEO TUTORIALS CATALOG (Exact Frame 0150) */}
          {activeTab === 'videos' && (
            <div>
              {/* Card Header matching Frame 0150 "Package" */}
              <div style={{
                background: '#1e293b',
                borderRadius: 8,
                padding: 16,
                marginBottom: 20,
                border: '1px solid #334155'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, color: '#f8fafc', fontWeight: 800 }}>
                      Training Video Help &amp; Tutorials (Package)
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#94a3b8' }}>
                      Official RoomG ERP Hindi video training suite for front desk receptionists, restaurant captains, accountants, and hotel owners.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['All', 'Front Desk', 'Restaurant & POS', 'Accounts & Ledgers', 'Inventory & Stock', 'Reports & GST', 'Settings & Administration'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setVideoCategory(cat)}
                        style={{
                          background: videoCategory === cat ? '#0284c7' : '#1e293b',
                          color: videoCategory === cat ? '#ffffff' : '#cbd5e1',
                          border: `1px solid ${videoCategory === cat ? '#0284c7' : '#475569'}`,
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Toolbar Controls: Show 100 entries per page & Search */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  padding: '10px 0 0 0',
                  borderTop: '1px solid #334155'
                }}>
                  <div style={{ fontSize: 12, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Show</span>
                    <select
                      style={{
                        background: '#0f172a',
                        border: '1px solid #475569',
                        color: '#f8fafc',
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 12
                      }}
                      defaultValue="100"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <span>entries per page</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#cbd5e1' }}>Search:</span>
                    <input 
                      type="text"
                      placeholder="Search tutorial topic..."
                      value={videoSearch}
                      onChange={e => setVideoSearch(e.target.value)}
                      style={{
                        background: '#0f172a',
                        border: '1px solid #475569',
                        color: '#f8fafc',
                        padding: '4px 10px',
                        borderRadius: 4,
                        fontSize: 12,
                        minWidth: 220
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Exact Table Design from Frame 0150 */}
              <div style={{
                background: '#1e293b',
                borderRadius: 8,
                border: '1px solid #334155',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                      <th style={{ padding: '10px 12px', width: 60 }}>S.No</th>
                      <th style={{ padding: '10px 12px', width: 140 }}>Business Type</th>
                      <th style={{ padding: '10px 12px', width: 80 }}>Type</th>
                      <th style={{ padding: '10px 12px' }}>Topic</th>
                      <th style={{ padding: '10px 12px', width: 100, textAlign: 'center' }}>Url</th>
                    </tr>
                  </thead>
                  <tbody>
                    {helpVideos.map((video, idx) => (
                      <tr 
                        key={video.id}
                        style={{
                          borderBottom: '1px solid #334155',
                          background: idx % 2 === 0 ? 'rgba(30, 41, 59, 0.4)' : 'rgba(15, 23, 42, 0.6)',
                          transition: 'background 0.2s'
                        }}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#cbd5e1' }}>
                          {video.sNo}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                          {video.businessType}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            background: '#334155',
                            color: '#38bdf8',
                            fontSize: 11,
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontWeight: 700
                          }}>
                            {video.type}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div 
                            onClick={() => setSelectedVideo(video)}
                            style={{ 
                              color: '#38bdf8', 
                              cursor: 'pointer', 
                              textDecoration: 'underline',
                              fontWeight: 600,
                              lineHeight: 1.4
                            }}
                          >
                            {video.topic}
                          </div>
                          {video.description && (
                            <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>
                              {video.description} &bull; <span style={{ color: '#fbbf24' }}>Duration: {video.videoDuration || '10 min'}</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <button
                            onClick={() => setSelectedVideo(video)}
                            title="Watch Video Tutorial"
                            style={{
                              background: '#ef4444',
                              color: '#ffffff',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: 4,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 700
                            }}
                          >
                            <span>🎥</span> Watch
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Table Footer */}
                <div style={{
                  padding: '12px 16px',
                  background: '#0f172a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 12,
                  color: '#94a3b8'
                }}>
                  <div>
                    Showing 1 to {helpVideos.length} of {helpVideos.length} entries
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button disabled style={{ background: '#334155', border: 'none', color: '#64748b', padding: '3px 8px', borderRadius: 3 }}>‹</button>
                    <button style={{ background: '#0284c7', border: 'none', color: '#fff', padding: '3px 8px', borderRadius: 3, fontWeight: 700 }}>1</button>
                    <button disabled style={{ background: '#334155', border: 'none', color: '#64748b', padding: '3px 8px', borderRadius: 3 }}>›</button>
                  </div>
                </div>
              </div>

              {/* Video Player / Walkthrough Dialog */}
              {selectedVideo && (
                <div 
                  className="pms-modal-overlay" 
                  style={{ zIndex: 1300 }}
                  onClick={() => setSelectedVideo(null)}
                >
                  <div 
                    className="pms-modal-content"
                    onClick={e => e.stopPropagation()}
                    style={{
                      maxWidth: 680,
                      width: '90%',
                      background: '#1e293b',
                      borderRadius: 12,
                      padding: 24,
                      border: '1px solid #475569'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <span style={{ background: '#ef4444', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>
                          VIDEO #{selectedVideo.sNo}
                        </span>
                        <h3 style={{ margin: '8px 0 4px 0', fontSize: 16, color: '#f8fafc', fontWeight: 800 }}>
                          {selectedVideo.topic}
                        </h3>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                          Category: <strong>{selectedVideo.category}</strong> &bull; Duration: <strong>{selectedVideo.videoDuration || '15 min'}</strong>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedVideo(null)}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Mock Video Screen Preview */}
                    <div style={{
                      background: '#0f172a',
                      borderRadius: 8,
                      border: '1px solid #334155',
                      padding: 24,
                      textAlign: 'center',
                      marginBottom: 16,
                      position: 'relative'
                    }}>
                      <div style={{ fontSize: 48, marginBottom: 8 }}>🎬</div>
                      <h4 style={{ margin: 0, color: '#38bdf8', fontSize: 15 }}>
                        RoomG Hotel Management Software Step-by-Step Training
                      </h4>
                      <p style={{ color: '#cbd5e1', fontSize: 12, maxWidth: 500, margin: '8px auto 16px auto' }}>
                        {selectedVideo.description}
                      </p>
                      <a
                        href={selectedVideo.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          background: '#ef4444',
                          color: '#ffffff',
                          padding: '10px 20px',
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 800,
                          textDecoration: 'none'
                        }}
                      >
                        <span>▶</span> Open &amp; Watch on YouTube
                      </a>
                    </div>

                    <div style={{ background: '#0f172a', padding: 12, borderRadius: 6, fontSize: 12, color: '#94a3b8', border: '1px solid #334155' }}>
                      <strong style={{ color: '#fbbf24' }}>💡 Training Note:</strong> If you face any difficulty implementing the steps demonstrated in this video, you can raise an instant support ticket or request an UltraViewer remote assistance session from the top tabs.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SUPPORT TICKETS & ASSISTANCE (Frame 0210 & audio 05:30) */}
          {activeTab === 'tickets' && (
            <div>
              {ticketSuccessMsg && (
                <div style={{
                  background: '#14532d',
                  border: '1px solid #22c55e',
                  color: '#bbf7d0',
                  padding: '10px 16px',
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 13,
                  fontWeight: 700
                }}>
                  ✅ {ticketSuccessMsg}
                </div>
              )}

              {/* Action Toolbar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, color: '#f8fafc', fontWeight: 800 }}>
                    Hansin IT Support Helpdesk Tickets
                  </h3>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    Raise technical queries, printer configuration requests, GST slab verification, or staff training requests.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Search tickets by #, subject, status..."
                    value={ticketSearch}
                    onChange={e => setTicketSearch(e.target.value)}
                    style={{
                      background: '#1e293b',
                      border: '1px solid #475569',
                      color: '#f8fafc',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      width: 240
                    }}
                  />
                  <button
                    onClick={() => setShowNewTicketForm(!showNewTicketForm)}
                    style={{
                      background: showNewTicketForm ? '#475569' : '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 16px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>{showNewTicketForm ? '✕ Cancel' : '➕ Raise New Ticket'}</span>
                  </button>
                </div>
              </div>

              {/* New Ticket Form Modal / Drawer */}
              {showNewTicketForm && (
                <form 
                  onSubmit={handleCreateTicket}
                  style={{
                    background: '#1e293b',
                    padding: 20,
                    borderRadius: 8,
                    border: '1px solid #38bdf8',
                    marginBottom: 20
                  }}
                >
                  <h4 style={{ margin: '0 0 16px 0', fontSize: 14, color: '#38bdf8', fontWeight: 800 }}>
                    Create Support Ticket for Hansin IT Support Engineers
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Issue Category</label>
                      <select
                        value={ticketCategory}
                        onChange={e => setTicketCategory(e.target.value as any)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                      >
                        <option value="Check-in & KYC">Check-in &amp; KYC</option>
                        <option value="Billing & Checkout">Billing &amp; Checkout</option>
                        <option value="KOT & Kitchen POS">KOT &amp; Kitchen POS</option>
                        <option value="GST & Tax Reports">GST &amp; Tax Reports</option>
                        <option value="Stock & Inventory">Stock &amp; Inventory</option>
                        <option value="Night Audit & Day End">Night Audit &amp; Day End</option>
                        <option value="Hardware & Printer">Hardware &amp; Thermal Printer</option>
                        <option value="WhatsApp SMS Integration">WhatsApp SMS Integration</option>
                        <option value="User Roles & Access">User Roles &amp; Access Control</option>
                        <option value="Other">Other Query / Custom Feature</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Priority</label>
                      <select
                        value={ticketPriority}
                        onChange={e => setTicketPriority(e.target.value as any)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                      >
                        <option value="Low">Low - General Question</option>
                        <option value="Medium">Medium - Operational Need</option>
                        <option value="High">High - Front Desk Blocked</option>
                        <option value="Critical">Critical - Billing / Checkout Down</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Staff Name</label>
                      <input
                        type="text"
                        value={ticketStaffName}
                        onChange={e => setTicketStaffName(e.target.value)}
                        placeholder="Staff Name"
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Department</label>
                      <select
                        value={ticketDepartment}
                        onChange={e => setTicketDepartment(e.target.value)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                      >
                        <option value="Front Desk">Front Desk</option>
                        <option value="Accounts">Accounts</option>
                        <option value="Restaurant / F&B">Restaurant / F&amp;B</option>
                        <option value="Housekeeping">Housekeeping</option>
                        <option value="Management">Management</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Contact Phone (For Callback)</label>
                      <input
                        type="text"
                        value={ticketPhone}
                        onChange={e => setTicketPhone(e.target.value)}
                        placeholder="10-digit mobile"
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Preferred Callback Slot (11 AM - 7 PM)</label>
                      <select
                        value={ticketCallback}
                        onChange={e => setTicketCallback(e.target.value)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                      >
                        <option value="11:00 AM – 01:00 PM">11:00 AM – 01:00 PM</option>
                        <option value="01:00 PM – 03:00 PM">01:00 PM – 03:00 PM</option>
                        <option value="03:00 PM – 05:00 PM">03:00 PM – 05:00 PM</option>
                        <option value="05:00 PM – 07:00 PM">05:00 PM – 07:00 PM</option>
                        <option value="Immediate Urgent">Immediate (Urgent Billing Issue)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Subject</label>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={e => setTicketSubject(e.target.value)}
                      placeholder="e.g. Need assistance setting up Day End Audit cash drawer calculation"
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Detailed Description / Error Message</label>
                    <textarea
                      rows={3}
                      value={ticketDescription}
                      onChange={e => setTicketDescription(e.target.value)}
                      placeholder="Describe what happened, any error messages shown on screen, or specific report needed..."
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setShowNewTicketForm(false)}
                      style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ background: '#22c55e', color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 800 }}
                    >
                      🚀 Submit Ticket to Support Desk
                    </button>
                  </div>
                </form>
              )}

              {/* Tickets List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredTickets.map(t => (
                  <div
                    key={t.id}
                    style={{
                      background: '#1e293b',
                      borderRadius: 8,
                      border: '1px solid #334155',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          background: '#0284c7',
                          color: '#fff',
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontWeight: 800
                        }}>
                          {t.ticketNo}
                        </span>
                        <span style={{
                          background: t.priority === 'Critical' ? '#991b1b' : t.priority === 'High' ? '#c2410c' : t.priority === 'Medium' ? '#0369a1' : '#334155',
                          color: '#fff',
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontWeight: 700
                        }}>
                          {t.priority} Priority
                        </span>
                        <span style={{
                          background: '#1e293b',
                          color: '#38bdf8',
                          border: '1px solid #0284c7',
                          fontSize: 11,
                          padding: '1px 6px',
                          borderRadius: 4
                        }}>
                          {t.category}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          background: t.status === 'Resolved' ? '#166534' : t.status === 'In Progress' ? '#854d0e' : '#1e3a8a',
                          color: '#fff',
                          fontSize: 11,
                          padding: '2px 10px',
                          borderRadius: 12,
                          fontWeight: 800
                        }}>
                          ● {t.status}
                        </span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                          {t.date} {t.time}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                      {t.subject}
                    </div>

                    <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                      {t.description}
                    </div>

                    <div style={{
                      background: '#0f172a',
                      padding: '8px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      color: '#94a3b8',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginTop: 4
                    }}>
                      <div>
                        Staff: <strong style={{ color: '#f8fafc' }}>{t.staffName}</strong> ({t.department}) &bull; Phone: <strong style={{ color: '#38bdf8' }}>{t.phone}</strong> &bull; Callback Slot: <strong>{t.preferredCallbackTime}</strong>
                      </div>
                      {t.assignedEngineer && (
                        <div style={{ color: '#34d399' }}>
                          Assigned: <strong>{t.assignedEngineer}</strong>
                        </div>
                      )}
                    </div>

                    {t.resolutionNotes && (
                      <div style={{
                        background: 'rgba(22, 101, 52, 0.2)',
                        border: '1px solid #166534',
                        padding: '8px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        color: '#86efac'
                      }}>
                        <strong>Resolution Note:</strong> {t.resolutionNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REMOTE DESKTOP ASSISTANCE (Exact UltraViewer Frame 0230) */}
          {activeTab === 'remote' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              
              {/* UltraViewer Mock Session Panel (Frame 0230) */}
              <div style={{
                background: '#ffffff',
                color: '#1e293b',
                borderRadius: 8,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
                border: '1px solid #cbd5e1'
              }}>
                {/* UltraViewer Window Title Bar */}
                <div style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  padding: '8px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 12,
                  fontWeight: 700
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>💻</span> UltraViewer 6.6 - Free Remote Desktop Support
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ cursor: 'pointer' }}>_</span>
                    <span style={{ cursor: 'pointer', margin: '0 4px' }}>□</span>
                    <span style={{ cursor: 'pointer' }}>✕</span>
                  </div>
                </div>

                <div style={{ padding: 20 }}>
                  <div style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: 16,
                    marginBottom: 16,
                    background: '#f8fafc'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 13, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>📡</span> Allow Remote Control
                    </h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
                      Please tell your support engineer the following ID and Password if you would like to allow remote control.
                    </p>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 2 }}>Your ID</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="text"
                          readOnly
                          value={remoteSession.partnerId}
                          style={{
                            flex: 1,
                            background: '#ffffff',
                            border: '1px solid #94a3b8',
                            borderRadius: 4,
                            padding: '6px 10px',
                            fontSize: 14,
                            fontWeight: 800,
                            letterSpacing: 1,
                            color: '#0f172a'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(remoteSession.partnerId, 'id')}
                          style={{
                            background: '#e2e8f0',
                            border: '1px solid #cbd5e1',
                            borderRadius: 4,
                            padding: '6px 12px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {copiedField === 'id' ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 2 }}>Password</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="text"
                          readOnly
                          value={remoteSession.passcode}
                          style={{
                            flex: 1,
                            background: '#ffffff',
                            border: '1px solid #94a3b8',
                            borderRadius: 4,
                            padding: '6px 10px',
                            fontSize: 14,
                            fontWeight: 800,
                            letterSpacing: 2,
                            color: '#0f172a'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(remoteSession.passcode, 'pass')}
                          style={{
                            background: '#e2e8f0',
                            border: '1px solid #cbd5e1',
                            borderRadius: 4,
                            padding: '6px 12px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {copiedField === 'pass' ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#f1f5f9',
                    borderRadius: 4,
                    fontSize: 11,
                    color: '#475569'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#16a34a', fontSize: 16 }}>●</span>
                      <strong>Ready to connect</strong>
                    </div>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>Secure Encrypted SSL</span>
                  </div>

                  {/* 1-Click Share on WhatsApp */}
                  <button
                    type="button"
                    onClick={handleShareRemoteOnWhatsApp}
                    style={{
                      marginTop: 16,
                      width: '100%',
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <span>💬</span> Send ID &amp; Password to Support on WhatsApp
                  </button>
                </div>
              </div>

              {/* Explanatory Policy & AnyDesk Alternative (Audio 03:30 - 04:00) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{
                  background: '#1e293b',
                  borderRadius: 8,
                  padding: 20,
                  border: '1px solid #334155'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: 15, color: '#38bdf8', fontWeight: 800 }}>
                    🔒 Important Security &amp; Remote Access Policy
                  </h4>
                  <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 12px 0' }}>
                    As emphasized by our training head in Video 30: <em>&ldquo;जब तक आप हमें आईडी और पासवर्ड नहीं देंगे तब तक हम आपके कंप्यूटर को कनेक्ट नहीं कर सकते हैं। यह पूरी तरह से आपकी अनुमति पर आधारित है।&rdquo;</em>
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                    <li>The remote support engineer cannot connect in the background without you actively launching the app and giving credentials.</li>
                    <li>Passwords regenerate dynamically on every reboot or session refresh for total privacy.</li>
                    <li>You can see everything the engineer is clicking on your screen in real time.</li>
                    <li>You can terminate the session at any moment with a single click on ✕.</li>
                  </ul>
                </div>

                {/* Direct Download Links */}
                <div style={{
                  background: '#1e293b',
                  borderRadius: 8,
                  padding: 20,
                  border: '1px solid #334155'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#f8fafc', fontWeight: 700 }}>
                    Official Remote Assistance Tools
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <a
                      href="https://ultraviewer.net/en/download.html"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: 6,
                        color: '#f8fafc',
                        textDecoration: 'none',
                        fontSize: 12
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>📥</span>
                        <div>
                          <strong>Download UltraViewer 6.6</strong>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>Free &bull; 1.5 MB &bull; Windows 7, 8, 10, 11</div>
                        </div>
                      </div>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>Download ›</span>
                    </a>

                    <a
                      href="https://anydesk.com/en/downloads"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: 6,
                        color: '#f8fafc',
                        textDecoration: 'none',
                        fontSize: 12
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>⚡</span>
                        <div>
                          <strong>Download AnyDesk Remote</strong>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>Lightweight &bull; Multi-Platform &bull; 4 MB</div>
                        </div>
                      </div>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>Download ›</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SOFTWARE USER MANUAL & DOCUMENTATION (Frames 0060 & 0070) */}
          {activeTab === 'manual' && (
            <div>
              <div style={{
                background: '#1e293b',
                borderRadius: 8,
                padding: 16,
                marginBottom: 20,
                border: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, color: '#f8fafc', fontWeight: 800 }}>
                    RoomG PMS User Documentation Manual (Roomg PMS - english.pdf)
                  </h3>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    Comprehensive operational rules, anti-theft controls, inventory movement procedures, and accounting guides.
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Search manual by keyword..."
                  value={manualSearch}
                  onChange={e => setManualSearch(e.target.value)}
                  style={{
                    background: '#0f172a',
                    border: '1px solid #475569',
                    color: '#f8fafc',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    minWidth: 240
                  }}
                />
              </div>

              {/* Documentation Chapters Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                {docChapters.map(ch => (
                  <div
                    key={ch.id}
                    onClick={() => setSelectedChapter(ch)}
                    style={{
                      background: '#1e293b',
                      borderRadius: 8,
                      border: '1px solid #334155',
                      padding: 16,
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#38bdf8'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: 14, color: '#f8fafc', fontWeight: 700 }}>
                        {ch.title}
                      </h4>
                      <p style={{ margin: '0 0 10px 0', fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                        {ch.shortSummary}
                      </p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                        {ch.tags.map(t => (
                          <span
                            key={t}
                            style={{
                              background: '#0f172a',
                              color: '#38bdf8',
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 4
                            }}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>
                        Read Complete Module Guidelines ›
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chapter Detail Reader Modal */}
              {selectedChapter && (
                <div 
                  className="pms-modal-overlay" 
                  style={{ zIndex: 1300 }}
                  onClick={() => setSelectedChapter(null)}
                >
                  <div 
                    className="pms-modal-content"
                    onClick={e => e.stopPropagation()}
                    style={{
                      maxWidth: 640,
                      width: '90%',
                      background: '#1e293b',
                      borderRadius: 12,
                      padding: 24,
                      border: '1px solid #475569'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ background: '#0284c7', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>
                        CHAPTER #{selectedChapter.chapterNo}
                      </span>
                      <button 
                        onClick={() => setSelectedChapter(null)}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>

                    <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#f8fafc' }}>
                      {selectedChapter.title}
                    </h3>

                    <div style={{
                      background: '#0f172a',
                      padding: 16,
                      borderRadius: 8,
                      border: '1px solid #334155',
                      fontSize: 13,
                      color: '#cbd5e1',
                      lineHeight: 1.7,
                      marginBottom: 16
                    }}>
                      {selectedChapter.fullContent}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {selectedChapter.tags.map(t => (
                          <span key={t} style={{ background: '#334155', color: '#94a3b8', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>
                            {t}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedChapter(null);
                          onClose();
                        }}
                        style={{
                          background: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Launch Module in PMS ›
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FREE DEMO & LICENSE RENEWAL REQUEST (Audio 01:30 - 02:30) */}
          {activeTab === 'demo' && (
            <div style={{ maxWidth: 840, margin: '0 auto' }}>
              {demoSuccessMsg && (
                <div style={{
                  background: '#14532d',
                  border: '1px solid #22c55e',
                  color: '#bbf7d0',
                  padding: '10px 16px',
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 13,
                  fontWeight: 700
                }}>
                  ✅ {demoSuccessMsg}
                </div>
              )}

              <div style={{
                background: '#1e293b',
                borderRadius: 8,
                padding: 24,
                border: '1px solid #334155'
              }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <span style={{ fontSize: 32 }}>✨</span>
                  <h3 style={{ margin: '8px 0 4px 0', fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
                    Book a Free Demo / Schedule Personalized Training
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', maxWidth: 500, marginInline: 'auto' }}>
                    As outlined in Video 30: Connect directly with our Jabalpur Headquarters team for free live software demonstrations, branch onboarding, or license renewal.
                  </p>
                </div>

                <form onSubmit={handleSubmitDemo}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Hotel / Property Name</label>
                      <input
                        type="text"
                        value={demoHotelName}
                        onChange={e => setDemoHotelName(e.target.value)}
                        required
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Owner / Manager Contact Person</label>
                      <input
                        type="text"
                        value={demoContactPerson}
                        onChange={e => setDemoContactPerson(e.target.value)}
                        required
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Contact Phone Number</label>
                      <input
                        type="text"
                        value={demoPhone}
                        onChange={e => setDemoPhone(e.target.value)}
                        required
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>WhatsApp Number</label>
                      <input
                        type="text"
                        value={demoWhatsapp}
                        onChange={e => setDemoWhatsapp(e.target.value)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Email Address</label>
                      <input
                        type="email"
                        value={demoEmail}
                        onChange={e => setDemoEmail(e.target.value)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Property Type</label>
                      <select
                        value={demoPropertyType}
                        onChange={e => setDemoPropertyType(e.target.value as any)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                      >
                        <option value="Hotel">Hotel</option>
                        <option value="Resort">Resort &amp; Spa</option>
                        <option value="Guest House">Guest House</option>
                        <option value="Lodge">Lodge / Inn</option>
                        <option value="Restaurant & Rooms">Hotel &amp; Restaurant (Integrated)</option>
                        <option value="Service Apartment">Service Apartment / Villa</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Room Count</label>
                      <input
                        type="number"
                        value={demoRoomCount}
                        onChange={e => setDemoRoomCount(Number(e.target.value))}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>City / Location</label>
                      <input
                        type="text"
                        value={demoCity}
                        onChange={e => setDemoCity(e.target.value)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>State</label>
                      <input
                        type="text"
                        value={demoState}
                        onChange={e => setDemoState(e.target.value)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Preferred Demo Date</label>
                      <input
                        type="date"
                        value={demoPreferredDate}
                        onChange={e => setDemoPreferredDate(e.target.value)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 22 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#cbd5e1', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={demoHasRestaurant}
                          onChange={e => setDemoHasRestaurant(e.target.checked)}
                          style={{ accentColor: '#0284c7', width: 16, height: 16 }}
                        />
                        <span>Includes Restaurant &amp; KOT</span>
                      </label>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Specific Modules or Requirements</label>
                    <textarea
                      rows={2}
                      value={demoNotes}
                      onChange={e => setDemoNotes(e.target.value)}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 12 }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <span>🚀</span> Submit Demo Request &amp; Open WhatsApp Confirmation
                  </button>
                </form>

                {/* Company Footer Card */}
                <div style={{
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: '1px solid #334155',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  fontSize: 11,
                  color: '#94a3b8'
                }}>
                  <div>
                    <strong style={{ color: '#f8fafc' }}>{contactInfo.companyName}</strong><br />
                    Headquarters: {contactInfo.headquarters} &bull; Email: {contactInfo.supportEmail}
                  </div>
                  <div>
                    Helplines: <strong style={{ color: '#38bdf8' }}>{contactInfo.primaryPhone}</strong> / <strong style={{ color: '#38bdf8' }}>{contactInfo.alternatePhone}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Global Footer (Frame 0180) */}
        <div style={{
          background: '#0f172a',
          borderTop: '1px solid #334155',
          padding: '10px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: '#64748b'
        }}>
          <div>
            Copyright &copy; Hansin IT Services 2024-26 | Privacy Policy &bull; Terms &amp; Conditions
          </div>
          <div>
            RoomG Cloud PMS &bull; Enterprise 35-Module Edition
          </div>
        </div>
      </div>
    </div>
  );
};
