import React, { useState, useEffect } from 'react';
import type { PmsBooking, PmsRoom, PaymentSplit } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';

interface NewRoomBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedRoom?: PmsRoom | null;
  onBookingCreated: (booking: PmsBooking) => void;
}

export const NewRoomBookingModal: React.FC<NewRoomBookingModalProps> = ({
  isOpen,
  onClose,
  preselectedRoom,
  onBookingCreated
}) => {
  const allRooms = PmsStore.getRooms();

  // Booking format from Video 02: RM/63/24-25
  const defaultBookingNo = `RM/${Math.floor(60 + Math.random() * 40)}/24-25`;
  const todayStr = new Date().toISOString().split('T')[0];

  const [bookingNo] = useState(defaultBookingNo);
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [bookingTime, setBookingTime] = useState('11:56 PM');
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkInTime, setCheckInTime] = useState('11:56 PM');
  const [checkOutDate, setCheckOutDate] = useState(todayStr);
  const [checkOutTime, setCheckOutTime] = useState('11:56 PM');
  const [noOfDays, setNoOfDays] = useState(1);
  const [noOfGuests, setNoOfGuests] = useState(2);
  const [businessSource, setBusinessSource] = useState<PmsBooking['businessSource']>('Walk-in');
  const [selectedPackage, setSelectedPackage] = useState<PmsBooking['package']>('ROOM ONLY || 0');
  const [vehicleNo, setVehicleNo] = useState('');
  const [parkingNo, setParkingNo] = useState('');
  const [bookingRemark, setBookingRemark] = useState('');

  // Search Customer State
  const [searchContact, setSearchContact] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Guest Details
  const [guestName, setGuestName] = useState('');
  const [mobile, setMobile] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nationality, setNationality] = useState('India');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country] = useState('India');
  const [pinCode, setPinCode] = useState('');
  const [agent, setAgent] = useState('');
  const [documentName, setDocumentName] = useState<'Aadhaar Card' | 'Passport' | 'Driving License' | 'Voter ID' | 'Other'>('Aadhaar Card');
  const [documentNo, setDocumentNo] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [gstNo, setGstNo] = useState('');

  // Photos
  const [guestPhoto, setGuestPhoto] = useState<string | null>(null);
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [isUploadingBookingId, setIsUploadingBookingId] = useState(false);
  const [isUploadingGuestPic, setIsUploadingGuestPic] = useState(false);
  const [bookingUploadError, setBookingUploadError] = useState<string | null>(null);

  // Selected Rooms
  const [selectedRoomNos, setSelectedRoomNos] = useState<string[]>(
    preselectedRoom ? [preselectedRoom.roomNo] : (allRooms.length > 0 ? [allRooms[0].roomNo] : [])
  );

  // Multi-Payment Splits (Video 02 Frame 0090)
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([]);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentRemark, setPaymentRemark] = useState('');

  // Auto-calculate No of Days whenever dates change
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      const d1 = new Date(checkInDate);
      const d2 = new Date(checkOutDate);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setNoOfDays(diffDays > 0 ? diffDays : 1);
    }
  }, [checkInDate, checkOutDate]);

  if (!isOpen) return null;

  const handleCustomerSearch = () => {
    const query = searchContact.trim();
    if (!query) {
      alert('Please enter contact number to search.');
      return;
    }

    const checkouts = PmsStore.getCheckouts();
    const checkIns = PmsStore.getCheckIns();
    const bookings = PmsStore.getBookings();

    const matchedCo = checkouts.find(c => c.guestPhone === query);
    const matchedCi = checkIns.find(c => c.mobile === query);
    const matchedBk = bookings.find(b => b.mobile === query);

    if (matchedCo) {
      setSearchFeedback('Record Found in Past Stays');
      setGuestName(matchedCo.guestName);
      setMobile(matchedCo.guestPhone);
      setAddressLine1(matchedCo.addressLine1 || '');
      setAddressLine2(matchedCo.addressLine2 || '');
      setCity(matchedCo.city || 'Rayagada');
      setState(matchedCo.state || 'Odisha');
      setPinCode(matchedCo.pinCode || '765001');
      setNationality(matchedCo.country || 'India');
    } else if (matchedCi) {
      setSearchFeedback('Record Found in Check-In Register');
      setGuestName(matchedCi.guestName);
      setMobile(matchedCi.mobile);
      setAddressLine1(matchedCi.addressLine1 || '');
      setCity(matchedCi.city || 'Rayagada');
      setState(matchedCi.state || 'Odisha');
      setPinCode(matchedCi.pinCode || '765001');
      setNationality(matchedCi.nationality || 'India');
      if (matchedCi.documentName) setDocumentName(matchedCi.documentName as any);
      if (matchedCi.documentNo) setDocumentNo(matchedCi.documentNo);
    } else if (matchedBk) {
      setSearchFeedback('Record Found in Bookings');
      setGuestName(matchedBk.guestName);
      setMobile(matchedBk.mobile);
      setAddressLine1(matchedBk.addressLine1 || '');
      setCity(matchedBk.city || 'Rayagada');
      setState(matchedBk.state || 'Odisha');
      setPinCode(matchedBk.pinCode || '765001');
      setNationality(matchedBk.nationality || 'India');
    } else {
      setSearchFeedback('No existing record found. New customer entry.');
      setMobile(query);
    }
  };

  const handleToggleRoom = (roomNo: string) => {
    if (selectedRoomNos.includes(roomNo)) {
      setSelectedRoomNos(selectedRoomNos.filter(n => n !== roomNo));
    } else {
      setSelectedRoomNos([...selectedRoomNos, roomNo]);
    }
  };

  const handleAddPaymentMode = () => {
    setPaymentSplits([
      ...paymentSplits,
      { mode: 'UPI', amount: 1000, referenceNo: '', remark: '' }
    ]);
  };

  const handleUpdateSplit = (index: number, field: keyof PaymentSplit, val: any) => {
    const updated = [...paymentSplits];
    updated[index] = { ...updated[index], [field]: val };
    setPaymentSplits(updated);
  };

  const handleRemoveSplit = (index: number) => {
    if (paymentSplits.length <= 1) return;
    setPaymentSplits(paymentSplits.filter((_, i) => i !== index));
  };

  const selectedRoomsList = allRooms.filter(r => selectedRoomNos.includes(r.roomNo));
  const totalTariffPerDay = selectedRoomsList.reduce((sum, r) => sum + r.tariff, 0);
  const totalAmount = totalTariffPerDay * noOfDays;
  const totalAdvancePaid = paymentSplits.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !mobile.trim()) {
      alert('Please enter Guest Name and Mobile Number.');
      return;
    }
    if (selectedRoomsList.length === 0) {
      alert('Please select at least one room.');
      return;
    }

    const newBooking: PmsBooking = {
      bookingNo,
      bookingDate,
      bookingTime,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      numberOfDays: noOfDays,
      numberOfGuests: noOfGuests,
      businessSource,
      package: selectedPackage,
      vehicleNo,
      parkingNo,
      bookingRemark,
      guestName,
      nationality,
      mobile,
      phone,
      email,
      addressLine1,
      addressLine2,
      city: city || 'Rayagada',
      state: state || 'Odisha',
      country,
      pinCode: pinCode || '765001',
      agent,
      documentName,
      documentNo,
      companyName,
      companyAddress,
      gstNo,
      guestPhoto: guestPhoto || undefined,
      idProofPhoto: idPhoto || undefined,
      rooms: selectedRoomsList.map(r => ({
        roomNo: r.roomNo,
        roomType: r.roomType,
        tariff: r.tariff
      })),
      totalAmount,
      bookingAmount: totalAdvancePaid,
      paymentMode: paymentSplits[0]?.mode || 'Cash',
      paymentReferenceNo: paymentReference,
      paymentRemark,
      payments: paymentSplits,
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };

    PmsStore.saveBooking(newBooking);
    onBookingCreated(newBooking);
  };

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div className="pms-form-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 1080 }}>
        {/* Exact Green Banner from Video 02 (Frames 0050, 0065) with close button */}
        <div className="pms-form-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 14px' }}>
          <span>🏨 New Room Booking Entery</span>
          <button
            id="close-booking-x-btn"
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#1e293b', fontSize: 18, fontWeight: 'bold', cursor: 'pointer' }}
            title="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pms-form-body" noValidate>
          {/* Top Customer Search & Live Image Preview Row (Frames 0050, 0065) */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            paddingBottom: 10,
            borderBottom: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>Search Customer</span>
                <input
                  type="text"
                  placeholder="Enter Contact Number (e.g. 8305741149)"
                  value={searchContact}
                  onChange={e => setSearchContact(e.target.value)}
                  className="form-input-pms"
                  style={{ width: 220 }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCustomerSearch();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleCustomerSearch}
                  className="pms-search-btn"
                  title="Search Returning Customer"
                >
                  🔍
                </button>
              </div>
              {searchFeedback && (
                <div style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: searchFeedback.includes('Successfully') ? '#16a34a' : '#d97706',
                  marginTop: 4
                }}>
                  {searchFeedback}
                </div>
              )}
            </div>

            {/* Dual Images matching Video 02 */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="pms-photo-box" style={{ overflow: 'hidden' }}>
                {guestPhoto ? (
                  <img src={guestPhoto} alt="Guest" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>Guest Image<br />Will Show Here</span>
                )}
              </div>
              <div className="pms-photo-box" style={{ overflow: 'hidden' }}>
                {idPhoto ? (
                  <img src={idPhoto} alt="ID Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>Uploaded ID<br />Will Show Here</span>
                )}
              </div>
            </div>
          </div>

          <div className="pms-grid-2col">
            {/* Left Form: Stay & Guest Master Fields */}
            <div>
              {/* Row 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10 }}>
                <div className="form-group-pms">
                  <label className="form-label-pms"><span className="req">*</span> Room Booking No</label>
                  <input type="text" readOnly value={bookingNo} className="form-input-pms" style={{ background: '#f1f5f9', fontWeight: 700 }} />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms"><span className="req">*</span> Booking Date</label>
                  <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms"><span className="req">*</span> Booking Time</label>
                  <input type="text" value={bookingTime} onChange={e => setBookingTime(e.target.value)} className="form-input-pms" />
                </div>
              </div>

              {/* Row 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10 }}>
                <div className="form-group-pms">
                  <label className="form-label-pms"><span className="req">*</span> Check In Date</label>
                  <input type="date" value={checkInDate} onChange={e => setCheckInDate(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms"><span className="req">*</span> Check In Time</label>
                  <input type="text" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms"><span className="req">*</span> No Of Days</label>
                  <input type="number" min="1" value={noOfDays} onChange={e => setNoOfDays(Number(e.target.value))} className="form-input-pms" style={{ fontWeight: 700 }} />
                </div>
              </div>

              {/* Row 3 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10 }}>
                <div className="form-group-pms">
                  <label className="form-label-pms"><span className="req">*</span> Check Out Date</label>
                  <input type="date" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms"><span className="req">*</span> Check Out Time</label>
                  <input type="text" value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms"><span className="req">*</span> No Of Guest</label>
                  <input type="number" min="1" value={noOfGuests} onChange={e => setNoOfGuests(Number(e.target.value))} className="form-input-pms" />
                </div>
              </div>

              {/* Row 4: Sources from Video 02 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group-pms">
                  <label className="form-label-pms"><span className="req">*</span> Business Source</label>
                  <select value={businessSource} onChange={e => setBusinessSource(e.target.value as any)} className="form-select-pms" style={{ fontWeight: 600 }}>
                    <option value="Walk-in">Walk-in (Counter)</option>
                    <option value="OYO">OYO Rooms</option>
                    <option value="MakeMyTrip">MakeMyTrip</option>
                    <option value="Goibibo">Goibibo</option>
                    <option value="Booking.com">Booking.com</option>
                    <option value="Agoda">Agoda</option>
                    <option value="Corporate">Corporate / Direct Company</option>
                    <option value="Phone">Phone Booking</option>
                  </select>
                </div>

                <div className="form-group-pms">
                  <label className="form-label-pms"><span className="req">*</span> Package</label>
                  <select value={selectedPackage} onChange={e => setSelectedPackage(e.target.value as any)} className="form-select-pms" style={{ fontWeight: 600 }}>
                    <option value="ROOM ONLY || 0">ROOM ONLY || 0</option>
                    <option value="WITH BREAKFAST || 0">WITH BREAKFAST || 0</option>
                    <option value="EP">EP (European Plan - Room Only)</option>
                    <option value="CP">CP (Continental Plan - Breakfast)</option>
                    <option value="MAP">MAP (Modified American - Breakfast + Dinner)</option>
                    <option value="AP">AP (American Plan - All Meals)</option>
                  </select>
                </div>
              </div>

              {/* Vehicle & Parking & Remark (Frame 0050) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 10 }}>
                <div className="form-group-pms">
                  <label className="form-label-pms">Vehicle No</label>
                  <input type="text" placeholder="e.g. MH-12-AB-1234" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Parking No</label>
                  <input type="text" placeholder="e.g. P-04" value={parkingNo} onChange={e => setParkingNo(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Booking Remark</label>
                  <input type="text" placeholder="Special Request" value={bookingRemark} onChange={e => setBookingRemark(e.target.value)} className="form-input-pms" />
                </div>
              </div>

              {/* Guest Profile Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
                <div className="form-group-pms">
                  <label className="form-label-pms"><span className="req">*</span> Guest Name</label>
                  <input type="text" placeholder="e.g. Guest Full Name" value={guestName} onChange={e => setGuestName(e.target.value)} className="form-input-pms" required />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms"><span className="req">*</span> Mobile</label>
                  <input type="tel" placeholder="10-digit number" value={mobile} onChange={e => setMobile(e.target.value)} className="form-input-pms" required />
                </div>
              </div>

              {/* Address Details (Video 02 Frame 0080) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group-pms">
                  <label className="form-label-pms">Address Line 1</label>
                  <input type="text" placeholder="e.g. main road ac" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Address Line 2</label>
                  <input type="text" placeholder="Area / Landmark" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} className="form-input-pms" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                <div className="form-group-pms">
                  <label className="form-label-pms">City</label>
                  <input type="text" placeholder="jabalpur" value={city} onChange={e => setCity(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">State</label>
                  <input type="text" placeholder="m.p." value={state} onChange={e => setState(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Country</label>
                  <input type="text" readOnly value={country} className="form-input-pms" style={{ background: '#f1f5f9' }} />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Pin Code</label>
                  <input type="text" placeholder="482001" value={pinCode} onChange={e => setPinCode(e.target.value)} className="form-input-pms" />
                </div>
              </div>

              {/* Nationality, Phone, Email (Frame 0080) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div className="form-group-pms">
                  <label className="form-label-pms">Nationality</label>
                  <input type="text" value={nationality} onChange={e => setNationality(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Phone</label>
                  <input type="tel" placeholder="Landline / Alt" value={phone} onChange={e => setPhone(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Email</label>
                  <input type="email" placeholder="guest@email.com" value={email} onChange={e => setEmail(e.target.value)} className="form-input-pms" />
                </div>
              </div>

              {/* ID Proof & Corporate Details (Frame 0080) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div className="form-group-pms">
                  <label className="form-label-pms">Document Name</label>
                  <select value={documentName} onChange={e => setDocumentName(e.target.value as any)} className="form-select-pms">
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Other">Other ID</option>
                  </select>
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Document No</label>
                  <input type="text" placeholder="7564767657..." value={documentNo} onChange={e => setDocumentNo(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Agent</label>
                  <input type="text" placeholder="Agent Name" value={agent} onChange={e => setAgent(e.target.value)} className="form-input-pms" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 10 }}>
                <div className="form-group-pms">
                  <label className="form-label-pms">Company Name</label>
                  <input type="text" placeholder="Corporate Account" value={companyName} onChange={e => setCompanyName(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Company Address</label>
                  <input type="text" placeholder="Office Location" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">GST NO</label>
                  <input type="text" placeholder="21AEKPP8689J1ZS" value={gstNo} onChange={e => setGstNo(e.target.value)} className="form-input-pms" />
                </div>
              </div>

              {/* Document Image & Guest Image upload clickables (Cloudflare R2 Encrypted) */}
              {bookingUploadError && (
                <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: 4, fontSize: 11, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>⚠️ {bookingUploadError}</span>
                  <button type="button" onClick={() => setBookingUploadError(null)} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label-pms">Document Image</label>
                    <span style={{ fontSize: 9, color: '#0284c7' }}>☁️ R2</span>
                  </div>
                  <label style={{
                    display: 'block',
                    border: '2px dashed #93c5fd',
                    padding: '8px',
                    textAlign: 'center',
                    borderRadius: 4,
                    fontSize: 12,
                    color: isUploadingBookingId ? '#0369a1' : '#2563eb',
                    cursor: isUploadingBookingId ? 'not-allowed' : 'pointer',
                    background: '#eff6ff'
                  }}>
                    {isUploadingBookingId ? '⏳ Uploading to Cloudflare R2...' : '📎 Click to upload to R2'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={isUploadingBookingId}
                      style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setBookingUploadError(null);
                          setIsUploadingBookingId(true);
                          try {
                            const res = await hotelApi.uploadGuestDocument(file);
                            setIdPhoto(res.url);
                          } catch (err: any) {
                            setBookingUploadError(`Document upload failed: ${err.message}`);
                          } finally {
                            setIsUploadingBookingId(false);
                          }
                        }
                      }}
                    />
                  </label>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label-pms">Guest Image</label>
                    <span style={{ fontSize: 9, color: '#0284c7' }}>☁️ R2</span>
                  </div>
                  <label style={{
                    display: 'block',
                    border: '2px dashed #93c5fd',
                    padding: '8px',
                    textAlign: 'center',
                    borderRadius: 4,
                    fontSize: 12,
                    color: isUploadingGuestPic ? '#0369a1' : '#2563eb',
                    cursor: isUploadingGuestPic ? 'not-allowed' : 'pointer',
                    background: '#eff6ff'
                  }}>
                    {isUploadingGuestPic ? '⏳ Uploading to Cloudflare R2...' : '📷 Click to upload to R2'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingGuestPic}
                      style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setBookingUploadError(null);
                          setIsUploadingGuestPic(true);
                          try {
                            const res = await hotelApi.uploadGuestDocument(file);
                            setGuestPhoto(res.url);
                          } catch (err: any) {
                            setBookingUploadError(`Guest photo upload failed: ${err.message}`);
                          } finally {
                            setIsUploadingGuestPic(false);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Room Selection Table & Multi-Payment Split Detail Box */}
            <div>
              {/* Room Checkbox Selection Table (Video 02 Frame 0050) */}
              <div style={{ border: '2px solid #38bdf8', borderRadius: 4, padding: 8, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#0369a1' }}>
                  Select Rooms for Booking:
                </div>
                <div style={{ maxHeight: 170, overflowY: 'auto' }}>
                  <table className="pms-table-compact">
                    <thead>
                      <tr>
                        <th style={{ width: 35 }}>#</th>
                        <th>Room No</th>
                        <th>Room Type</th>
                        <th>Tariff (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allRooms.map(r => (
                        <tr key={r.id}>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={selectedRoomNos.includes(r.roomNo)}
                              onChange={() => handleToggleRoom(r.roomNo)}
                            />
                          </td>
                          <td style={{ fontWeight: 600 }}>{r.roomNo}</td>
                          <td>{r.roomType}</td>
                          <td>₹{r.tariff}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Detail Box with Split Payments (Video 02 Frames 0080, 0090) */}
              <div style={{ border: '2px solid #a3e635', borderRadius: 4, padding: 12, background: '#f8fafc' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#166534', marginBottom: 8, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>
                  Payment Detail
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Per Day Room Tariff</span>
                  <input
                    type="text"
                    readOnly
                    value={totalTariffPerDay.toFixed(2)}
                    className="form-input-pms"
                    style={{ width: 110, textAlign: 'right', background: '#f1f5f9', fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Total Booking Amount ({noOfDays} Days)</span>
                  <input
                    type="text"
                    readOnly
                    value={`₹${totalAmount}`}
                    className="form-input-pms"
                    style={{ width: 110, textAlign: 'right', background: '#dcfce7', fontWeight: 800, color: '#15803d' }}
                  />
                </div>

                {/* Split Payment Rows */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Advance Payment Modes:
                  </div>
                  {paymentSplits.map((split, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                      <select
                        value={split.mode}
                        onChange={e => handleUpdateSplit(idx, 'mode', e.target.value)}
                        className="form-select-pms"
                        style={{ width: 120, fontWeight: 600 }}
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI / QR</option>
                        <option value="Card">Card</option>
                        <option value="Bank Transfer">Bank / NEFT</option>
                      </select>

                      <input
                        type="number"
                        min="0"
                        placeholder="Amount"
                        value={split.amount}
                        onChange={e => handleUpdateSplit(idx, 'amount', Number(e.target.value))}
                        className="form-input-pms"
                        style={{ width: 90, textAlign: 'right', fontWeight: 700 }}
                      />

                      {paymentSplits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSplit(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  {/* + Payment Mode Button (Frame 0090) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={handleAddPaymentMode}
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      + Payment Mode
                    </button>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#15803d' }}>
                      Advance Paid: ₹{totalAdvancePaid.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Payment Reference & Remark (Frame 0090) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  <div className="form-group-pms" style={{ margin: 0 }}>
                    <label className="form-label-pms">Payment Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. cash adv / UTR"
                      value={paymentReference}
                      onChange={e => setPaymentReference(e.target.value)}
                      className="form-input-pms"
                    />
                  </div>

                  <div className="form-group-pms" style={{ margin: 0 }}>
                    <label className="form-label-pms">Payment Remark</label>
                    <input
                      type="text"
                      placeholder="e.g. by raju"
                      value={paymentRemark}
                      onChange={e => setPaymentRemark(e.target.value)}
                      className="form-input-pms"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons matching Video 02 Frame 0080 */}
          <div className="pms-btn-group">
            <button
              id="close-advance-booking-btn"
              type="button"
              onClick={onClose}
              style={{
                background: '#1e293b',
                color: '#ffffff',
                border: 'none',
                padding: '7px 20px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Back
            </button>
            <button
              id="save-advance-booking-btn"
              type="button"
              onClick={handleSubmit as any}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '7px 24px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
