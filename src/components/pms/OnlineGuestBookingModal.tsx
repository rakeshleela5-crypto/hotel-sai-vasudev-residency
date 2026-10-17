import React, { useState, useEffect } from 'react';
import type { PmsBooking, PmsRoom } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import './pmsStyles.css';

interface OnlineGuestBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoom?: PmsRoom | null;
  initialMode?: 'portal' | 'form' | 'slip';
}

export const OnlineGuestBookingModal: React.FC<OnlineGuestBookingModalProps> = ({
  isOpen,
  onClose,
  initialRoom,
  initialMode = 'portal'
}) => {
  // Navigation View: 'portal' (/hotel_room) | 'form' (/booking_by_guest_create) | 'slip' (/store_by_guest_booking)
  const [viewMode, setViewMode] = useState<'portal' | 'form' | 'slip'>(initialMode);
  const [copiedLink, setCopiedLink] = useState(false);

  // Rooms Data & Real-Time Availability
  const [allRooms, setAllRooms] = useState<PmsRoom[]>([]);
  const [availableRooms, setAvailableRooms] = useState<PmsRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<PmsRoom | null>(initialRoom || null);

  // Form Header State (Frame 0210 & 0280)
  const todayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getFutureDateStr = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [bookingNo] = useState(`RM/${Math.floor(80 + Math.random() * 20)}/24-25`);
  const [bookingDate] = useState(todayStr());
  const [bookingTime] = useState('10:11 PM');
  const [checkInDate, setCheckInDate] = useState(todayStr());
  const [checkInTime, setCheckInTime] = useState('10:11 PM');
  const [checkOutDate, setCheckOutDate] = useState(getFutureDateStr(2));
  const [checkOutTime, setCheckOutTime] = useState('10:11 PM');
  const [noOfDays, setNoOfDays] = useState(2);
  const [noOfGuests, setNoOfGuests] = useState(2);
  const [businessSource, setBusinessSource] = useState('Online');
  const [packageType, setPackageType] = useState('WITHOUT BREAKFAST || 0');
  const [vehicleNo, setVehicleNo] = useState('');
  const [parkingNo, setParkingNo] = useState('');
  const [bookingRemark, setBookingRemark] = useState('');

  // Guest Personal Details
  const [guestName, setGuestName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [pinCode, setPinCode] = useState('');
  const [mobile, setMobile] = useState('');
  const phone = '';
  const [email, setEmail] = useState('');
  const nationality = 'Indian';
  const [documentName, setDocumentName] = useState('Aadhaar Card');
  const [documentNo, setDocumentNo] = useState('');
  const companyName = '';
  const gstNo = '';

  // Payment Details (Right Box)
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Card' | 'Bank Transfer' | 'Online'>('UPI');
  const [advanceAmount, setAdvanceAmount] = useState<number>(1000);
  const [paymentReference, setPaymentReference] = useState('');

  // Completed Booking Voucher
  const [savedBooking, setSavedBooking] = useState<PmsBooking | null>(null);

  // Autocomplete suggestions matching Frame 0250
  const GUEST_SUGGESTIONS = [
    { name: 'vinod kumar jain', city: 'jabalpur', state: 'madhya pradesh', mobile: '78657656754' },
    { name: 'hariom gautam ji', city: 'jabalpur', state: 'madhya pradesh', mobile: '76675763433' },
    { name: 'vikash sharma', city: 'delhi', state: 'delhi', mobile: '8872757274' },
    { name: 'anupam ji', city: 'nagpur', state: 'maharashtra', mobile: '65448987' },
    { name: 'RAM KISHOR', city: 'indore', state: 'madhya pradesh', mobile: '9827011223' },
    { name: 'ADITI MEHNDIRATTA', city: 'pune', state: 'maharashtra', mobile: '9823456789' }
  ];

  // Refresh available rooms whenever dates change (Video 20 core feature [06:25 - 07:35])
  const recalculateAvailability = () => {
    const rooms = PmsStore.getRooms();
    setAllRooms(rooms);

    // Compute number of days between checkInDate and checkOutDate
    const d1 = new Date(checkInDate).getTime();
    const d2 = new Date(checkOutDate).getTime();
    const diffDays = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
    setNoOfDays(diffDays);

    // Filter available rooms in real time
    const freeRooms = PmsStore.getAvailableRoomsForDates(checkInDate, checkOutDate);
    setAvailableRooms(freeRooms);

    // If current selected room is not free in the new date range, pick the first available room
    if (selectedRoom && !freeRooms.some(r => r.roomNo === selectedRoom.roomNo)) {
      setSelectedRoom(freeRooms[0] || null);
    } else if (!selectedRoom && freeRooms.length > 0) {
      setSelectedRoom(freeRooms[0]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      recalculateAvailability();
      if (initialRoom) {
        setSelectedRoom(initialRoom);
        setViewMode('form');
      } else {
        setViewMode(initialMode);
      }
    }
  }, [isOpen, checkInDate, checkOutDate, initialRoom, initialMode]);

  if (!isOpen) return null;

  const currentTariff = selectedRoom ? selectedRoom.tariff : 2000;
  const totalAmount = currentTariff * noOfDays;

  const handleSelectRoomFromGrid = (rm: PmsRoom) => {
    setSelectedRoom(rm);
    setViewMode('form');
  };

  const handleCopyLink = () => {
    const url = 'https://hotel-sai-vasudev-residency.pages.dev/hotel_room';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSelectSuggestion = (sug: typeof GUEST_SUGGESTIONS[0]) => {
    setGuestName(sug.name);
    setCity(sug.city);
    setState(sug.state);
    setMobile(sug.mobile);
  };

  const handleSaveBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      alert('Please enter Guest Name');
      return;
    }
    if (!mobile.trim() || mobile.length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!selectedRoom) {
      alert('Please select an available room from the right panel');
      return;
    }

    const bookingRecord: PmsBooking = {
      bookingNo,
      bookingDate,
      bookingTime,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      numberOfDays: noOfDays,
      numberOfGuests: noOfGuests,
      businessSource: 'Online',
      package: packageType as any,
      vehicleNo,
      parkingNo,
      bookingRemark,
      guestName,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      pinCode,
      mobile,
      phone,
      email,
      nationality,
      documentName: documentName as any,
      documentNo,
      companyName,
      gstNo,
      rooms: [
        {
          roomNo: selectedRoom.roomNo,
          roomType: selectedRoom.roomType,
          tariff: selectedRoom.tariff
        }
      ],
      totalAmount,
      bookingAmount: advanceAmount,
      paymentMode,
      paymentReferenceNo: paymentReference || `ONLINE/UPI/${Date.now().toString().slice(-6)}`,
      paymentRemark: `Guest Online Reservation (${packageType})`,
      status: 'Unconfirmed', // Lands in Unconfirmed / Pending confirmation for receptionist review
      createdAt: new Date().toISOString()
    };

    // Save to store
    PmsStore.saveBooking(bookingRecord);
    setSavedBooking(bookingRecord);
    setViewMode('slip');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = (b: PmsBooking) => {
    const msg = encodeURIComponent(
      `Namaste ${b.guestName} ji! Greetings from HOTEL SAI VASUDEV RESIDENCY, Shirdi.\n\nYour Online Reservation Slip:\nBooking No: ${b.bookingNo}\nRoom No: ${b.rooms[0]?.roomNo} (${b.rooms[0]?.roomType})\nDates: ${b.checkInDate} to ${b.checkOutDate} (${b.numberOfDays} Nights)\nTariff: Rs. ${b.totalAmount}\nAdvance Received: Rs. ${b.bookingAmount}\n\nOur team will confirm your reservation shortly. Shirdi Temple assistance available. Helpline: +91 9822000000.`
    );
    window.open(`https://wa.me/91${b.mobile}?text=${msg}`, '_blank');
  };

  return (
    <div className="pms-submodal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="pms-form-box" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: viewMode === 'portal' ? 1180 : (viewMode === 'form' ? 1140 : 880),
          width: '95vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          background: '#ffffff',
          borderRadius: 8,
          overflow: 'hidden'
        }}
      >
        {/* Top Browser Bar & Mode Toggle */}
        <div style={{
          background: '#0f172a',
          color: '#ffffff',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 16 }}>🌐</span>
            <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>
              HOTEL SAI VASUDEV RESIDENCY &bull; ONLINE GUEST BOOKING ENGINE (Video 20)
            </span>
            <span style={{ 
              background: '#0284c7', 
              color: '#fff', 
              padding: '2px 8px', 
              borderRadius: 12, 
              fontSize: 10, 
              fontWeight: 700 
            }}>
              {viewMode === 'portal' ? '/hotel_room' : (viewMode === 'form' ? '/booking_by_guest_create' : '/store_by_guest_booking')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Link Copied Toast from Frame 0400 */}
            {copiedLink && (
              <span style={{
                background: '#16a34a',
                color: '#fff',
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800,
                animation: 'fadeIn 0.2s'
              }}>
                🔗 Link copied
              </span>
            )}
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy direct guest reservation portal URL"
              style={{
                background: '#334155',
                color: '#fff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              📋 Copy Link Address
            </button>

            <button
              type="button"
              onClick={() => setViewMode('portal')}
              style={{
                background: viewMode === 'portal' ? '#2563eb' : '#1e293b',
                color: '#fff',
                border: '1px solid #475569',
                padding: '4px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🏨 Room Showcase
            </button>

            <button
              type="button"
              onClick={() => setViewMode('form')}
              style={{
                background: viewMode === 'form' ? '#16a34a' : '#1e293b',
                color: '#fff',
                border: '1px solid #475569',
                padding: '4px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              📝 Reservation Form
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: 18,
                cursor: 'pointer',
                marginLeft: 6
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', background: '#f8fafc' }}>
          
          {/* ========================================================================= */}
          {/* VIEW 1: Public Web Portal Showcase (/hotel_room/DEMO0004) - Frame 0165 & 0190 */}
          {/* ========================================================================= */}
          {viewMode === 'portal' && (
            <div>
              {/* Hotel Public Header Bar */}
              <div style={{
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 6,
                marginBottom: 16,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>🪷</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
                      HOTEL SAI VASUDEV RESIDENCY
                    </h2>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      Shirdi Divine Sanctuary &bull; Pure Veg Hospitality
                    </div>
                  </div>
                </div>

                {/* Navbar Links from Frame 0190 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 13, fontWeight: 700, color: '#334155' }}>
                  <span style={{ color: '#dc2626', borderBottom: '2px solid #dc2626', paddingBottom: 2 }}>HOME</span>
                  <span style={{ cursor: 'pointer' }}>ABOUT</span>
                  <span style={{ cursor: 'pointer' }}>OUR ROOM</span>
                  <span style={{ cursor: 'pointer' }}>GALLERY</span>
                  <span style={{ cursor: 'pointer' }}>BLOG</span>
                  <span style={{ cursor: 'pointer' }}>CONTACT US</span>
                </div>
              </div>

              {/* Hero Banner with Slider matching Frame 0165 */}
              <div style={{
                position: 'relative',
                height: 240,
                borderRadius: 8,
                overflow: 'hidden',
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.6)), url(/images/hero.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.75)',
                  padding: '20px 40px',
                  borderRadius: 6,
                  textAlign: 'center',
                  borderLeft: '4px solid #dc2626'
                }}>
                  <h1 style={{
                    color: '#ffffff',
                    margin: '0 0 12px',
                    fontSize: 26,
                    fontWeight: 900,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase'
                  }}>
                    BOOK A ROOM ONLINE
                  </h1>
                  <button
                    type="button"
                    onClick={() => setViewMode('form')}
                    style={{
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 28px',
                      borderRadius: 4,
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(220, 38, 38, 0.4)'
                    }}
                  >
                    Book Now
                  </button>
                </div>
              </div>

              {/* "OUR ROOM" Section Headline matching Frame 0190 */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h2 style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: 1,
                  margin: '0 0 6px',
                  textTransform: 'uppercase'
                }}>
                  OUR ROOM
                </h2>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  Explore our exquisite accommodations for comfort and luxury.
                </div>
              </div>

              {/* Grid of Rooms matching Frame 0190 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 20
              }}>
                {allRooms.slice(0, 9).map(rm => {
                  const img1 = rm.image1 || '/images/deluxe_room.jpg';
                  const img2 = rm.image2 || '/images/suite_room.jpg';
                  const img3 = rm.image3 || '/images/hero.jpg';

                  return (
                    <div
                      key={rm.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* 3-Photo Collage matching Frame 0180 & Frame 0190 */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', height: 180, gap: 2, background: '#000' }}>
                        <img 
                          src={img1} 
                          alt={`Room ${rm.roomNo} view 1`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 2 }}>
                          <img 
                            src={img2} 
                            alt={`Room ${rm.roomNo} view 2`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                          <img 
                            src={img3} 
                            alt={`Room ${rm.roomNo} view 3`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        </div>
                      </div>

                      {/* Room Card Body */}
                      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                              Room No {rm.roomNo}
                            </h3>
                            <span style={{
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700
                            }}>
                              {rm.roomType}
                            </span>
                          </div>

                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                            {rm.facilities || 'AC, Geyser, Smart TV, Wi-Fi, King Bed'}
                          </div>

                          <div style={{ fontSize: 16, fontWeight: 900, color: '#16a34a', marginTop: 10 }}>
                            ₹{rm.tariff.toLocaleString()} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>/ Night</span>
                          </div>
                        </div>

                        <div style={{ marginTop: 14 }}>
                          <button
                            type="button"
                            onClick={() => handleSelectRoomFromGrid(rm)}
                            style={{
                              width: '100%',
                              background: '#dc2626',
                              color: '#ffffff',
                              border: 'none',
                              padding: '8px 14px',
                              borderRadius: 4,
                              fontSize: 13,
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: New Room Booking Entery Form (/booking_by_guest_create) - Frame 0210 */}
          {/* ========================================================================= */}
          {viewMode === 'form' && (
            <form onSubmit={handleSaveBooking}>
              {/* Green Title Banner from Frame 0210 */}
              <div style={{
                background: '#84cc16',
                color: '#0f172a',
                padding: '8px 16px',
                textAlign: 'center',
                fontWeight: 900,
                fontSize: 15,
                borderRadius: '4px 4px 0 0',
                letterSpacing: 0.5,
                marginBottom: 16
              }}>
                New Room Booking Entery
              </div>

              {/* Main 2-Column Split matching Frame 0210 & Frame 0280 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18 }}>
                
                {/* Left Column: Dates, Source, Package, Guest Details */}
                <div style={{ background: '#ffffff', padding: 16, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  
                  {/* Row 1: Booking No, Booking Date, Booking Time */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>
                        <span style={{ color: '#dc2626' }}>*</span> Room Booking No
                      </label>
                      <input 
                        type="text" 
                        readOnly 
                        value={bookingNo} 
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f8fafc', fontWeight: 700, fontSize: 12 }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>
                        <span style={{ color: '#dc2626' }}>*</span> Booking Date
                      </label>
                      <input 
                        type="text" 
                        readOnly 
                        value={bookingDate} 
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f8fafc', fontSize: 12 }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>
                        <span style={{ color: '#dc2626' }}>*</span> Booking Time
                      </label>
                      <input 
                        type="text" 
                        readOnly 
                        value={bookingTime} 
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f8fafc', fontSize: 12 }} 
                      />
                    </div>
                  </div>

                  {/* Row 2: Check In Date & Time, Check Out Date & Time, No Of Days */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 1fr 0.8fr', gap: 8, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>
                        <span style={{ color: '#dc2626' }}>*</span> Check In Date
                      </label>
                      <input 
                        type="date" 
                        value={checkInDate} 
                        onChange={e => setCheckInDate(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #3b82f6', borderRadius: 4, fontWeight: 700, fontSize: 12, background: '#eff6ff' }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>
                        <span style={{ color: '#dc2626' }}>*</span> Check In Time
                      </label>
                      <input 
                        type="text" 
                        value={checkInTime} 
                        onChange={e => setCheckInTime(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>
                        <span style={{ color: '#dc2626' }}>*</span> Check Out Date
                      </label>
                      <input 
                        type="date" 
                        value={checkOutDate} 
                        onChange={e => setCheckOutDate(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #3b82f6', borderRadius: 4, fontWeight: 700, fontSize: 12, background: '#eff6ff' }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>
                        <span style={{ color: '#dc2626' }}>*</span> Check Out Time
                      </label>
                      <input 
                        type="text" 
                        value={checkOutTime} 
                        onChange={e => setCheckOutTime(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>
                        <span style={{ color: '#dc2626' }}>*</span> No Of Days
                      </label>
                      <input 
                        type="number" 
                        readOnly 
                        value={noOfDays} 
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f1f5f9', fontWeight: 800, fontSize: 12, textAlign: 'center' }} 
                      />
                    </div>
                  </div>

                  {/* Row 3: No of Guest, Business Source, Package */}
                  <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr 1.6fr', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>
                        <span style={{ color: '#dc2626' }}>*</span> No Of Guest
                      </label>
                      <input 
                        type="number" 
                        min={1} 
                        max={10} 
                        value={noOfGuests} 
                        onChange={e => setNoOfGuests(Number(e.target.value))}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>
                        <span style={{ color: '#dc2626' }}>*</span> Business Source
                      </label>
                      <select 
                        value={businessSource} 
                        onChange={e => setBusinessSource(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                      >
                        <option value="Online">Online / Web</option>
                        <option value="Walk-in">Walk-in</option>
                        <option value="OYO">OYO</option>
                        <option value="MakeMyTrip">MakeMyTrip</option>
                        <option value="Corporate">Corporate</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>
                        <span style={{ color: '#dc2626' }}>*</span> Package
                      </label>
                      <select 
                        value={packageType} 
                        onChange={e => setPackageType(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, fontWeight: 700 }}
                      >
                        <option value="WITHOUT BREAKFAST || 0">WITHOUT BREAKFAST || 0</option>
                        <option value="WITH BREAKFAST || 0">WITH BREAKFAST || 0</option>
                        <option value="EP (Room Only)">EP (Room Only)</option>
                        <option value="CP (With Breakfast)">CP (With Breakfast)</option>
                        <option value="MAP (Breakfast + Dinner)">MAP (Breakfast + Dinner)</option>
                        <option value="AP (All Meals)">AP (All Meals)</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 4: Vehicle, Parking, Remark */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.6fr', gap: 10, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Vehicle No</label>
                      <input 
                        type="text" 
                        placeholder="MH 17 AB 1234"
                        value={vehicleNo} 
                        onChange={e => setVehicleNo(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Parking No</label>
                      <input 
                        type="text" 
                        placeholder="P-12"
                        value={parkingNo} 
                        onChange={e => setParkingNo(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Booking Remark</label>
                      <input 
                        type="text" 
                        placeholder="Ground floor preferred / early arrival"
                        value={bookingRemark} 
                        onChange={e => setBookingRemark(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} 
                      />
                    </div>
                  </div>

                  {/* Section Divider */}
                  <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                      Guest Information (Identification &amp; Contact)
                    </div>

                    {/* Quick Suggestions Chips matching Frame 0250 */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Quick Fill:</span>
                      {GUEST_SUGGESTIONS.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSuggestion(s)}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: 12,
                            padding: '1px 8px',
                            fontSize: 10,
                            color: '#1e293b',
                            cursor: 'pointer'
                          }}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>

                    {/* Guest Name & Mobile */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>
                          <span style={{ color: '#dc2626' }}>*</span> Guest Name
                        </label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Vinod Kumar Jain"
                          value={guestName} 
                          onChange={e => setGuestName(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, fontWeight: 700 }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>
                          <span style={{ color: '#dc2626' }}>*</span> Mobile
                        </label>
                        <input 
                          type="tel" 
                          required
                          placeholder="10-digit mobile number"
                          value={mobile} 
                          onChange={e => setMobile(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, fontWeight: 700 }} 
                        />
                      </div>
                    </div>

                    {/* Address Line 1 & Line 2 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Address Line 1</label>
                        <input 
                          type="text" 
                          placeholder="House / Street / Area"
                          value={addressLine1} 
                          onChange={e => setAddressLine1(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Address Line 2</label>
                        <input 
                          type="text" 
                          placeholder="Landmark"
                          value={addressLine2} 
                          onChange={e => setAddressLine2(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} 
                        />
                      </div>
                    </div>

                    {/* City, State, Country, Pin Code */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 0.8fr', gap: 8, marginBottom: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>City</label>
                        <input 
                          type="text" 
                          value={city} 
                          onChange={e => setCity(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>State</label>
                        <input 
                          type="text" 
                          value={state} 
                          onChange={e => setState(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Country</label>
                        <input 
                          type="text" 
                          value={country} 
                          onChange={e => setCountry(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Pin Code</label>
                        <input 
                          type="text" 
                          value={pinCode} 
                          onChange={e => setPinCode(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} 
                        />
                      </div>
                    </div>

                    {/* Document Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Document Name</label>
                        <select
                          value={documentName}
                          onChange={e => setDocumentName(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                        >
                          <option value="Aadhaar Card">Aadhaar Card</option>
                          <option value="Passport">Passport</option>
                          <option value="Driving License">Driving License</option>
                          <option value="Voter ID">Voter ID</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Document No</label>
                        <input 
                          type="text" 
                          placeholder="XXXX-XXXX-XXXX"
                          value={documentNo} 
                          onChange={e => setDocumentNo(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Email</label>
                        <input 
                          type="email" 
                          placeholder="guest@mail.com"
                          value={email} 
                          onChange={e => setEmail(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} 
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Column: Real-Time Dynamic Room Availability Matrix & Payment Detail (Frame 0210) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  
                  {/* Top Right: Real-time Available Rooms Table (Blue Border) */}
                  <div style={{
                    background: '#ffffff',
                    border: '2px solid #38bdf8',
                    borderRadius: 6,
                    padding: 12,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                      borderBottom: '1px solid #e2e8f0',
                      paddingBottom: 6
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#0369a1' }}>
                        🏨 Available Rooms ({availableRooms.length})
                      </div>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        Dates: {checkInDate} to {checkOutDate}
                      </span>
                    </div>

                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#f0f9ff', color: '#0369a1', borderBottom: '1px solid #bae6fd' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'center', width: 40 }}>#</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Room No</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Room Type</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>Tariff</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableRooms.map(rm => {
                            const isSelected = selectedRoom?.roomNo === rm.roomNo;
                            return (
                              <tr 
                                key={rm.id}
                                onClick={() => setSelectedRoom(rm)}
                                style={{
                                  borderBottom: '1px solid #f1f5f9',
                                  background: isSelected ? '#e0f2fe' : 'transparent',
                                  cursor: 'pointer'
                                }}
                              >
                                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => setSelectedRoom(rm)}
                                  />
                                </td>
                                <td style={{ padding: '6px 8px', fontWeight: 800, color: '#0f172a' }}>
                                  {rm.roomNo}
                                </td>
                                <td style={{ padding: '6px 8px', color: '#475569' }}>
                                  {rm.roomType}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                                  ₹{rm.tariff}
                                </td>
                              </tr>
                            );
                          })}
                          {availableRooms.length === 0 && (
                            <tr>
                              <td colSpan={4} style={{ padding: 16, textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>
                                ⚠️ No rooms available for selected dates! Please try different dates.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bottom Right: Payment Detail Box matching Frame 0210 & Frame 0280 */}
                  <div style={{
                    background: '#ffffff',
                    border: '2px solid #38bdf8',
                    borderRadius: 6,
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{
                      background: '#84cc16',
                      padding: '6px 12px',
                      fontSize: 13,
                      fontWeight: 900,
                      color: '#0f172a'
                    }}>
                      Payment Detail
                    </div>

                    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                          Per Day Room Tariff:
                        </span>
                        <input 
                          type="text" 
                          readOnly 
                          value={`₹${currentTariff}.00`}
                          style={{ padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f8fafc', fontWeight: 900, textAlign: 'right', fontSize: 13, color: '#0f172a' }} 
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                          Total Stay Rent ({noOfDays} Days):
                        </span>
                        <input 
                          type="text" 
                          readOnly 
                          value={`₹${totalAmount}.00`}
                          style={{ padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f8fafc', fontWeight: 900, textAlign: 'right', fontSize: 13, color: '#16a34a' }} 
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                          Payment Mode:
                        </span>
                        <select 
                          value={paymentMode} 
                          onChange={e => setPaymentMode(e.target.value as any)}
                          style={{ padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, fontWeight: 700 }}
                        >
                          <option value="UPI">UPI / QR Code</option>
                          <option value="Bank Transfer">Bank Transfer / NEFT</option>
                          <option value="Card">Credit / Debit Card</option>
                          <option value="Online">Pay at Hotel Check-in</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                          Advance Amount:
                        </span>
                        <input 
                          type="number" 
                          value={advanceAmount} 
                          onChange={e => setAdvanceAmount(Number(e.target.value))}
                          style={{ padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontWeight: 800, textAlign: 'right', fontSize: 13, color: '#0f172a' }} 
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                          Payment Reference:
                        </span>
                        <input 
                          type="text" 
                          placeholder="Txn ID / UTR No"
                          value={paymentReference} 
                          onChange={e => setPaymentReference(e.target.value)}
                          style={{ padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }} 
                        />
                      </div>

                      {/* Bank Details & QR Preview */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px dashed #cbd5e1',
                        borderRadius: 4,
                        padding: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 4
                      }}>
                        <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>
                          <div><strong>Bank:</strong> HDFC Bank / SBI Shirdi</div>
                          <div><strong>A/C No:</strong> 50200087654321</div>
                          <div><strong>IFSC:</strong> HDFC0001234</div>
                        </div>
                        <div style={{
                          width: 48,
                          height: 48,
                          background: '#fff',
                          border: '1px solid #94a3b8',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 8,
                          fontWeight: 800
                        }}>
                          <span style={{ fontSize: 16 }}>📱</span>
                          <span>UPI QR</span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

              </div>

              {/* Action Buttons matching Frame 0280 */}
              <div style={{
                marginTop: 18,
                display: 'flex',
                justifyContent: 'center',
                gap: 14
              }}>
                <button
                  type="submit"
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 36px',
                    borderRadius: 4,
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(37,99,235,0.3)'
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('portal')}
                  style={{
                    background: '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 28px',
                    borderRadius: 4,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
              </div>

            </form>
          )}

          {/* ========================================================================= */}
          {/* VIEW 3: Guest Online Booking Voucher Slip (/store_by_guest_booking) - Frame 0290 */}
          {/* ========================================================================= */}
          {viewMode === 'slip' && savedBooking && (
            <div id="printable-guest-slip">
              {/* Dual Header Panels matching Frame 0290 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 0, border: '1px solid #cbd5e1' }}>
                
                {/* Left Panel: Mint Green (#a7f3d0) Guest Detail */}
                <div style={{
                  background: '#a7f3d0',
                  padding: 14,
                  borderRight: '1px solid #6ee7b7'
                }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#064e3b', marginBottom: 8 }}>
                    Guest Detail
                  </div>
                  <div style={{ fontSize: 12, color: '#065f46', lineHeight: 1.6 }}>
                    <div><strong>Guest Name:</strong> {savedBooking.guestName}</div>
                    <div><strong>Add:</strong> {savedBooking.addressLine1 || 'Main Road'} {savedBooking.addressLine2}</div>
                    <div><strong>city:</strong> {savedBooking.city || 'Shirdi'}</div>
                    <div><strong>State:</strong> {savedBooking.state || 'Maharashtra'}</div>
                    <div><strong>Mob:</strong> {savedBooking.mobile}</div>
                    <div><strong>Email:</strong> {savedBooking.email || 'N/A'}</div>
                  </div>
                </div>

                {/* Right Panel: Gold/Yellow (#fde047) Booking Detail */}
                <div style={{
                  background: '#fde047',
                  padding: 14
                }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#713f12', marginBottom: 8 }}>
                    Booking Detail
                  </div>
                  <div style={{ fontSize: 12, color: '#854d0e', lineHeight: 1.6 }}>
                    <div><strong>Booking No :</strong> {savedBooking.bookingNo}</div>
                    <div><strong>Booking Date:</strong> {savedBooking.bookingDate}</div>
                    <div><strong>Booking Time:</strong> {savedBooking.bookingTime}</div>
                    <div><strong>Aspected Check In Date:</strong> {savedBooking.checkInDate}</div>
                    <div><strong>Check In Time:</strong> {savedBooking.checkInTime}</div>
                    <div><strong>Aspected Check Out Date:</strong> {savedBooking.checkOutDate}</div>
                    <div><strong>Check Out Time:</strong> {savedBooking.checkOutTime}</div>
                    <div><strong>Total Day :</strong> {savedBooking.numberOfDays}</div>
                  </div>
                </div>

              </div>

              {/* Middle Table matching Frame 0290 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: 12, marginTop: -1 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#1e293b', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>Room No</th>
                    <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>Total Rooms</th>
                    <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>No of Guest</th>
                    <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>Commited Days</th>
                    <th style={{ padding: '8px' }}>Tariff</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e1', fontWeight: 700 }}>
                    <td style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>{savedBooking.rooms[0]?.roomNo || '103'}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>{savedBooking.rooms.length}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>{savedBooking.numberOfGuests}</td>
                    <td style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>{savedBooking.numberOfDays}</td>
                    <td style={{ padding: '8px', color: '#16a34a' }}>{savedBooking.rooms[0]?.tariff.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Middle Table Row 2 matching Frame 0290 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: 12, marginTop: -1 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#1e293b', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>Booking Amount</th>
                    <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>Payment Refrance No</th>
                    <th style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>Refrance No</th>
                    <th style={{ padding: '8px' }}>Agent</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e1', fontWeight: 700 }}>
                    <td style={{ padding: '8px', borderRight: '1px solid #cbd5e1', color: '#2563eb' }}>
                      {savedBooking.bookingAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>
                      {savedBooking.paymentReferenceNo || '-'}
                    </td>
                    <td style={{ padding: '8px', borderRight: '1px solid #cbd5e1' }}>-</td>
                    <td style={{ padding: '8px' }}>-</td>
                  </tr>
                </tbody>
              </table>

              {/* Bottom Box matching Frame 0290 */}
              <div style={{
                border: '1px solid #cbd5e1',
                marginTop: -1,
                display: 'grid',
                gridTemplateColumns: '1.6fr 1fr',
                background: '#f8fafc'
              }}>
                {/* Left Terms & Bank Info */}
                <div style={{ padding: 14, borderRight: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>
                    Terms &amp; Conditions
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5, marginBottom: 12 }}>
                    &bull; Standard Check-in: 12:00 PM, Check-out: 11:00 AM.<br />
                    &bull; Valid Government ID (Aadhaar / Passport) mandatory for all adult guests upon arrival.<br />
                    &bull; Booking is subject to management confirmation under Unconfirmed Bookings queue.
                  </div>

                  <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 8, fontSize: 11, color: '#334155' }}>
                    <div><strong>Bank Name:</strong> STATE BANK OF INDIA / HDFC BANK</div>
                    <div><strong>Bank A/C No:</strong> 50200087654321</div>
                    <div><strong>Bank IFSC:</strong> SBIN0001234 / HDFC0001234</div>
                    <div><strong>Bank Branch:</strong> Shirdi Temple Road, Rahata</div>
                  </div>
                </div>

                {/* Right Stamp & QR Code */}
                <div style={{ padding: 14, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>
                    For HOTEL SAI VASUDEV RESIDENCY
                  </div>
                  <div style={{
                    width: 70,
                    height: 70,
                    background: '#fff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#16a34a'
                  }}>
                    <span style={{ fontSize: 24 }}>✅</span>
                    <span>ONLINE SLIP</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 6 }}>
                    Authorized Digital Signature
                  </div>
                </div>
              </div>

              {/* Action Buttons matching Frame 0290 */}
              <div style={{
                marginTop: 18,
                display: 'flex',
                justifyContent: 'center',
                gap: 12
              }}>
                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 24px',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🖨️ Print
                </button>
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(savedBooking)}
                  style={{
                    background: '#22c55e',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  💬 Share WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('portal')}
                  style={{
                    background: '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 24px',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Home
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
