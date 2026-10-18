import React, { useState, useEffect } from 'react';
import type { PmsCheckIn, PmsRoom, PaymentSplit } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import { CheckInSlipModal } from './CheckInSlipModal';

interface NewRoomCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedRoom?: PmsRoom | null;
  onCheckInCompleted: (checkIn: PmsCheckIn) => void;
}

// Returning Guests Database (Video 03 Frame 0070)
const EXISTING_GUESTS: Record<string, {
  name: string;
  mobile: string;
  address1: string;
  city: string;
  state: string;
  pin: string;
  nationality: string;
  docName: string;
  docNo: string;
  companyName: string;
  companyAddress: string;
  gstNo: string;
  photoUrl: string;
  idUrl: string;
}> = {
  '7676767674': {
    name: 'sunil agrwal',
    mobile: '7676767674',
    address1: 'main road',
    city: 'renukot',
    state: 'm.p.',
    pin: '76576',
    nationality: 'India',
    docName: 'AADHAR CARD',
    docNo: '765765721234',
    companyName: 'hindalko',
    companyAddress: 'renukot',
    gstNo: '23SJDHGSJD123',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60',
    idUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&auto=format&fit=crop&q=60'
  },
  '87576576': {
    name: 'hariom gautam ji',
    mobile: '87576576',
    address1: 'Civil Lines Road',
    city: 'jabalpur',
    state: 'm.p.',
    pin: '482001',
    nationality: 'India',
    docName: 'AADHAR CARD',
    docNo: '544654651234',
    companyName: '',
    companyAddress: '',
    gstNo: '',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=60',
    idUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&auto=format&fit=crop&q=60'
  },
  '9622975444': {
    name: 'AJUU',
    mobile: '9622975444',
    address1: 'Station Road',
    city: 'Bilaspur',
    state: 'Chhattisgarh',
    pin: '495220',
    nationality: 'India',
    docName: 'Driving License',
    docNo: 'CG-10-20210089',
    companyName: '',
    companyAddress: '',
    gstNo: '',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=60',
    idUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&auto=format&fit=crop&q=60'
  }
};

export const NewRoomCheckInModal: React.FC<NewRoomCheckInModalProps> = ({
  isOpen,
  onClose,
  preselectedRoom,
  onCheckInCompleted
}) => {
  const allRooms = PmsStore.getRooms();
  // Filter out dirty and occupied rooms as per Video 03 verbal rules [02:15, 05:15]
  const availableRooms = allRooms.filter(r => r.status === 'vacant');

  const existingBookings = PmsStore.getBookings().filter(b => b.status === 'Confirmed');

  // Check In format from Video 03 (Frame 0070): SR/188/24-25
  const defaultCheckInNo = `SR/${Math.floor(180 + Math.random() * 20)}/24-25`;
  const todayStr = new Date().toISOString().split('T')[0];

  const [checkInNo] = useState(defaultCheckInNo);
  const [selectedBookingRef, setSelectedBookingRef] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkInTime, setCheckInTime] = useState('12:25 AM');
  const [noOfDays, setNoOfDays] = useState(3);
  const [noOfGuests, setNoOfGuests] = useState(2);
  const [businessSource, setBusinessSource] = useState<PmsCheckIn['businessSource']>('Direct');
  const [selectedPackage, setSelectedPackage] = useState('WITH BREAKFAST || 0');
  const [remark1, setRemark1] = useState('');
  const [remark2, setRemark2] = useState('');

  // Video 23 Anti-Theft & Boundary Protection: Permission checks
  const canChangeTariff = PmsStore.hasPermission('Change_Room_Tariff');
  const canChangeDateTime = PmsStore.hasPermission('Change_Date&Time');

  // Selected Room & Custom Tariff
  const [selectedRoomNo, setSelectedRoomNo] = useState<string>(
    preselectedRoom ? preselectedRoom.roomNo : (availableRooms[0]?.roomNo || '105')
  );
  const [customTariff, setCustomTariff] = useState<number>(
    preselectedRoom ? preselectedRoom.tariff : (availableRooms[0]?.tariff || 1800)
  );

  // Guest Details
  const [guestName, setGuestName] = useState('');
  const [mobile, setMobile] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country] = useState('India');
  const [pinCode, setPinCode] = useState('');
  const [nationality, setNationality] = useState('India');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [agent, setAgent] = useState('');
  const [documentName, setDocumentName] = useState('AADHAR CARD');
  const [documentNo, setDocumentNo] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [gstNo, setGstNo] = useState('');

  // Photos
  const [guestPhoto, setGuestPhoto] = useState<string | null>(null);
  const [idPhotoFront, setIdPhotoFront] = useState<string | null>(null);
  const [idPhotoBack, setIdPhotoBack] = useState<string | null>(null);

  // Co-Travelers KYC (Frame 0260)
  const [secondGuestName, setSecondGuestName] = useState('');
  const [secondGuestIdName, setSecondGuestIdName] = useState('Aadhaar Card');
  const [secondGuestIdNo, setSecondGuestIdNo] = useState('');
  const [thirdGuestName, setThirdGuestName] = useState('');
  const [thirdGuestIdName, setThirdGuestIdName] = useState('Aadhaar Card');
  const [thirdGuestIdNo, setThirdGuestIdNo] = useState('');

  // Police & Tourism Compliance (Frame 0340)
  const [purposeOfVisit, setPurposeOfVisit] = useState<PmsCheckIn['purposeOfVisit']>('Darshan / Pilgrimage');
  const [comingFrom, setComingFrom] = useState('Renukot');
  const [goingTo, setGoingTo] = useState('Mumbai');

  // Multi-Payment Splits (Frame 0260)
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([
    { mode: 'Cash', amount: 800, referenceNo: '', remark: 'Cash on checkin' }
  ]);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentRemark, setPaymentRemark] = useState('PHONE PAY');

  // Printed GRC Slip
  const [completedCheckIn, setCompletedCheckIn] = useState<PmsCheckIn | null>(null);
  const [isSlipOpen, setIsSlipOpen] = useState(false);

  // Update room tariff when selecting another room
  useEffect(() => {
    const rm = allRooms.find(r => r.roomNo === selectedRoomNo);
    if (rm) {
      setCustomTariff(rm.tariff);
    }
  }, [selectedRoomNo]);

  // Handle Advance Booking Selection (Video 03 [01:30])
  const handleSelectBooking = (bookingNo: string) => {
    setSelectedBookingRef(bookingNo);
    if (!bookingNo) return;

    const b = existingBookings.find(x => x.bookingNo === bookingNo);
    if (b) {
      setGuestName(b.guestName);
      setMobile(b.mobile);
      setCity(b.city || '');
      setState(b.state || '');
      setPinCode(b.pinCode || '');
      setDocumentName(b.documentName || 'AADHAR CARD');
      setDocumentNo(b.documentNo || '');
      setNoOfGuests(b.numberOfGuests);
      setNoOfDays(b.numberOfDays);
      if (b.rooms[0]) {
        setSelectedRoomNo(b.rooms[0].roomNo);
        setCustomTariff(b.rooms[0].tariff);
      }
      if (b.bookingAmount > 0) {
        setPaymentSplits([{ mode: b.paymentMode as any, amount: b.bookingAmount, referenceNo: b.paymentReferenceNo, remark: 'Advance converted' }]);
      }
    }
  };

  // Handle Select Guest Dropdown (Video 03 Frame 0070)
  const handleSelectGuest = (mobileKey: string) => {
    const g = EXISTING_GUESTS[mobileKey];
    if (g) {
      setGuestName(g.name);
      setMobile(g.mobile);
      setAddressLine1(g.address1);
      setCity(g.city);
      setState(g.state);
      setPinCode(g.pin);
      setNationality(g.nationality);
      setDocumentName(g.docName);
      setDocumentNo(g.docNo);
      setCompanyName(g.companyName);
      setCompanyAddress(g.companyAddress);
      setGstNo(g.gstNo);
      setGuestPhoto(g.photoUrl);
      setIdPhotoFront(g.idUrl);
    }
  };

  const handleAddPaymentMode = () => {
    setPaymentSplits([
      ...paymentSplits,
      { mode: 'Online', amount: 200, referenceNo: '', remark: 'PhonePe' }
    ]);
  };

  const handleUpdateSplit = (index: number, field: keyof PaymentSplit, val: any) => {
    const updated = [...paymentSplits];
    updated[index] = { ...updated[index], [field]: val };
    setPaymentSplits(updated);
  };

  const totalAdvancePaid = paymentSplits.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !mobile.trim()) {
      alert('Please enter Guest Name and Mobile Number.');
      return;
    }

    const checkInRecord: PmsCheckIn = {
      checkInNo,
      roomNo: selectedRoomNo,
      roomType: allRooms.find(r => r.roomNo === selectedRoomNo)?.roomType || 'DELUXE',
      guestName,
      mobile,
      addressLine1,
      addressLine2,
      city: city || 'Renukot',
      state: state || 'M.P.',
      country,
      pinCode,
      nationality,
      phone,
      email,
      checkInDate,
      checkInTime,
      numberOfDays: noOfDays,
      numberOfGuests: noOfGuests,
      businessSource,
      package: selectedPackage,
      tariffPerDay: customTariff,
      advancePaid: totalAdvancePaid,
      paymentMode: paymentSplits[0]?.mode || 'Cash',
      paymentReferenceNo: paymentReference,
      paymentRemark,
      payments: paymentSplits,
      documentName,
      documentNo,
      documentImage: idPhotoFront || undefined,
      guestImage: guestPhoto || undefined,
      idProofBackImage: idPhotoBack || undefined,
      secondGuestName,
      secondGuestIdName,
      secondGuestIdNo,
      thirdGuestName,
      thirdGuestIdName,
      thirdGuestIdNo,
      purposeOfVisit,
      comingFrom,
      goingTo,
      companyName,
      companyAddress,
      gstNo,
      remark1,
      remark2,
      bookingRefNo: selectedBookingRef || undefined,
      status: 'CheckedIn',
      createdAt: new Date().toISOString()
    };

    // Save to PmsStore & update room status to occupied
    PmsStore.saveCheckIn(checkInRecord);

    // Video 31: MR / Salesman Wise Commission Tracking (Frame 0120 & Spoken Hindi)
    if (agent && agent.trim()) {
      try {
        const allAgents = PmsStore.getCommissionAgents();
        const matchedAgent = allAgents.find(
          a => a.name.toLowerCase() === agent.trim().toLowerCase() || a.id === agent.trim()
        );
        const agentId = matchedAgent ? matchedAgent.id : `AGT-${Date.now().toString().slice(-4)}`;
        const agentName = matchedAgent ? matchedAgent.name : agent.trim();
        const agentType = matchedAgent ? matchedAgent.agentType : 'Travel_Agent';
        const commType = matchedAgent ? matchedAgent.commissionType : 'PERCENTAGE';
        const commRate = matchedAgent ? matchedAgent.defaultRate : 10;
        
        const grossRoomTariff = customTariff * noOfDays;
        let grossComm = 0;
        if (commType === 'PERCENTAGE') {
          grossComm = Math.round((grossRoomTariff * commRate) / 100);
        } else if (commType === 'FIXED_PER_NIGHT') {
          grossComm = Math.round(commRate * noOfDays);
        } else {
          grossComm = Math.round(commRate);
        }
        const tds = matchedAgent?.panNumber ? Math.round((grossComm * 5) / 100) : 0;
        const netPayable = grossComm - tds;

        PmsStore.addAgentCommissionBooking({
          agentId,
          agentName,
          agentType,
          checkInNo,
          bookingRefNo: selectedBookingRef || undefined,
          roomNo: selectedRoomNo,
          guestName,
          guestMobile: mobile,
          checkInDate,
          checkOutDate: new Date(Date.now() + noOfDays * 86400000).toISOString().split('T')[0],
          numberOfNights: noOfDays,
          roomTariff: customTariff,
          grossRoomTariff,
          commissionType: commType,
          commissionRate: commRate,
          grossCommission: grossComm,
          tdsPercentage: matchedAgent?.panNumber ? 5 : 0,
          tdsAmount: tds,
          netPayableCommission: netPayable,
          status: 'PENDING',
          remarks: `Attributed to ${agentName} on Check-in ${checkInNo} (Room ${selectedRoomNo})`
        });
      } catch (err) {
        console.error('Error logging agent commission:', err);
      }
    }

    setCompletedCheckIn(checkInRecord);
    setIsSlipOpen(true);
    onCheckInCompleted(checkInRecord);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="pms-submodal-overlay" onClick={onClose}>
        <div className="pms-form-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 1080 }}>
          {/* Exact Green Banner from Video 03 (Frames 0070, 0110) */}
          <div className="pms-form-banner">
            New Room CheckIn Entry
          </div>

          <form onSubmit={handleSubmit} className="pms-form-body">
            {/* Top Bar matching Video 03 Frame 0070 */}
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
              {/* Select Room Booking (Advance conversion) */}
              <div>
                <label className="form-label-pms" style={{ color: '#1e40af', fontWeight: 800 }}>
                  Select Room Booking
                </label>
                <select
                  value={selectedBookingRef}
                  onChange={e => handleSelectBooking(e.target.value)}
                  className="form-select-pms"
                  style={{ width: 220, fontWeight: 700 }}
                >
                  <option value="">Select Room Booking</option>
                  {existingBookings.map(b => (
                    <option key={b.bookingNo} value={b.bookingNo}>
                      {b.bookingNo} - {b.guestName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Guest Live Image Box */}
              <div className="pms-photo-box" style={{ overflow: 'hidden' }}>
                {guestPhoto ? (
                  <img src={guestPhoto} alt="Guest" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>Your Image<br />Will Show Here</span>
                )}
              </div>

              {/* Select Guest Searchable Dropdown */}
              <div>
                <label className="form-label-pms" style={{ color: '#1e40af', fontWeight: 800 }}>
                  Select Guest
                </label>
                <select
                  onChange={e => handleSelectGuest(e.target.value)}
                  className="form-select-pms"
                  style={{ width: 200, fontWeight: 700 }}
                  defaultValue=""
                >
                  <option value="" disabled>Select Guest</option>
                  <option value="7676767674">sunil agrwal - 7676767674</option>
                  <option value="87576576">hariom - 87576576</option>
                  <option value="9622975444">AJUU - 9622975444</option>
                </select>
              </div>

              {/* Stacked ID Proof Front & Back Photos (Frame 0070) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="pms-photo-box" style={{ width: 90, height: 42, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {idPhotoFront ? (
                    <img src={idPhotoFront} alt="ID Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 9 }}>ID Front</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const r = new FileReader();
                        r.onload = ev => setIdPhotoFront(ev.target?.result as string);
                        r.readAsDataURL(f);
                      }
                    }}
                  />
                </label>
                <label className="pms-photo-box" style={{ width: 90, height: 42, overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {idPhotoBack ? (
                    <img src={idPhotoBack} alt="ID Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 9 }}>ID Back</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const r = new FileReader();
                        r.onload = ev => setIdPhotoBack(ev.target?.result as string);
                        r.readAsDataURL(f);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="pms-grid-2col">
              {/* Left Column: Stay and Guest Details */}
              <div>
                {/* Row 1 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> Check In No</label>
                    <input type="text" readOnly value={checkInNo} className="form-input-pms" style={{ background: '#f1f5f9', fontWeight: 800 }} />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">
                      <span className="req">*</span> Check In Date {!canChangeDateTime && <span title="Date Locked: Anti-Backdating Guard (Video 23)" style={{ color: '#e11d48' }}>🔒</span>}
                    </label>
                    <input 
                      type="date" 
                      value={checkInDate} 
                      readOnly={!canChangeDateTime}
                      onChange={e => {
                        if (!canChangeDateTime) {
                          alert('Permission Denied: Standard staff are restricted from altering Date & Time to prevent backdated ledger manipulation (Video 23 Anti-Backdating Protection).');
                          return;
                        }
                        setCheckInDate(e.target.value);
                      }} 
                      className="form-input-pms" 
                      style={{ background: !canChangeDateTime ? '#f1f5f9' : '#ffffff', cursor: !canChangeDateTime ? 'not-allowed' : 'auto' }}
                      title={!canChangeDateTime ? 'Date locked: Anti-backdating protection active' : undefined}
                    />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">
                      <span className="req">*</span> Check In Time {!canChangeDateTime && <span title="Time Locked: Anti-Backdating Guard (Video 23)" style={{ color: '#e11d48' }}>🔒</span>}
                    </label>
                    <input 
                      type="text" 
                      value={checkInTime} 
                      readOnly={!canChangeDateTime}
                      onChange={e => {
                        if (!canChangeDateTime) {
                          alert('Permission Denied: Standard staff are restricted from altering Date & Time to prevent backdated ledger manipulation (Video 23 Anti-Backdating Protection).');
                          return;
                        }
                        setCheckInTime(e.target.value);
                      }} 
                      className="form-input-pms" 
                      style={{ background: !canChangeDateTime ? '#f1f5f9' : '#ffffff', cursor: !canChangeDateTime ? 'not-allowed' : 'auto' }}
                      title={!canChangeDateTime ? 'Time locked: Anti-backdating protection active' : undefined}
                    />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> No Of Days</label>
                    <input type="number" min="1" value={noOfDays} onChange={e => setNoOfDays(Number(e.target.value))} className="form-input-pms" style={{ fontWeight: 800 }} />
                  </div>
                </div>

                {/* Row 2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.5fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> No Of Guest</label>
                    <input type="number" min="1" value={noOfGuests} onChange={e => setNoOfGuests(Number(e.target.value))} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> Business Source</label>
                    <select value={businessSource} onChange={e => setBusinessSource(e.target.value as any)} className="form-select-pms" style={{ fontWeight: 600 }}>
                      <option value="Direct">Direct (Walk-in Counter)</option>
                      <option value="OYO">OYO</option>
                      <option value="Make My Trip">Make My Trip</option>
                      <option value="Goibibo">Goibibo</option>
                      <option value="Corporate">Corporate</option>
                    </select>
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> Package</label>
                    <select value={selectedPackage} onChange={e => setSelectedPackage(e.target.value)} className="form-select-pms" style={{ fontWeight: 600 }}>
                      <option value="WITH BREAKFAST || 0">WITH BREAKFAST || 0</option>
                      <option value="ROOM ONLY || 0">ROOM ONLY || 0</option>
                      <option value="CP">CP (Breakfast Included)</option>
                      <option value="MAP">MAP (Breakfast + Dinner)</option>
                    </select>
                  </div>
                </div>

                {/* Remarks Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Remark 1</label>
                    <input type="text" placeholder="Special Guest Request" value={remark1} onChange={e => setRemark1(e.target.value)} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Remark 2</label>
                    <input type="text" placeholder="Internal Notes" value={remark2} onChange={e => setRemark2(e.target.value)} className="form-input-pms" />
                  </div>
                </div>

                {/* Primary Guest Details (Frame 0210) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> Guest Name</label>
                    <input type="text" placeholder="sunil agrwal" value={guestName} onChange={e => setGuestName(e.target.value)} className="form-input-pms" required />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> Mobile</label>
                    <input type="tel" placeholder="7676767674" value={mobile} onChange={e => setMobile(e.target.value)} className="form-input-pms" required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Address Line 1</label>
                    <input type="text" placeholder="main road" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Address Line 2</label>
                    <input type="text" placeholder="Area / Landmark" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} className="form-input-pms" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms">City</label>
                    <input type="text" placeholder="renukot" value={city} onChange={e => setCity(e.target.value)} className="form-input-pms" />
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
                    <input type="text" placeholder="76576" value={pinCode} onChange={e => setPinCode(e.target.value)} className="form-input-pms" />
                  </div>
                </div>

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
                    <input type="email" placeholder="sunil@email.com" value={email} onChange={e => setEmail(e.target.value)} className="form-input-pms" />
                  </div>
                </div>

                {/* ID Proof & Corporate */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Document Name</label>
                    <input type="text" value={documentName} onChange={e => setDocumentName(e.target.value)} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Document No</label>
                    <input type="text" placeholder="7657657..." value={documentNo} onChange={e => setDocumentNo(e.target.value)} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Agent / MR (Video 31)</label>
                    <input 
                      type="text" 
                      list="pms-agent-datalist"
                      placeholder="Select or type Agent / MR" 
                      value={agent} 
                      onChange={e => setAgent(e.target.value)} 
                      className="form-input-pms" 
                    />
                    <datalist id="pms-agent-datalist">
                      {PmsStore.getCommissionAgents().map(ag => (
                        <option key={ag.id} value={ag.name}>{ag.city} &bull; {ag.defaultRate}{ag.commissionType === 'PERCENTAGE' ? '%' : ' ₹/rm'}</option>
                      ))}
                    </datalist>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Company Name</label>
                    <input type="text" placeholder="hindalko" value={companyName} onChange={e => setCompanyName(e.target.value)} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Company Address</label>
                    <input type="text" placeholder="renukot" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">GST NO</label>
                    <input type="text" placeholder="23SJDHGSJD..." value={gstNo} onChange={e => setGstNo(e.target.value)} className="form-input-pms" />
                  </div>
                </div>

                {/* Co-Travelers KYC (Video 03 Frame 0260) */}
                <div style={{ background: '#f8fafc', padding: 8, borderRadius: 4, marginTop: 8, border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                    Co-Travelers KYC (Police Station Verification):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 8, marginBottom: 6 }}>
                    <input type="text" placeholder="2nd Guest Name" value={secondGuestName} onChange={e => setSecondGuestName(e.target.value)} className="form-input-pms" />
                    <input type="text" placeholder="2nd Guest ID Type" value={secondGuestIdName} onChange={e => setSecondGuestIdName(e.target.value)} className="form-input-pms" />
                    <input type="text" placeholder="2nd Guest ID No" value={secondGuestIdNo} onChange={e => setSecondGuestIdNo(e.target.value)} className="form-input-pms" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 8 }}>
                    <input type="text" placeholder="3rd Guest Name" value={thirdGuestName} onChange={e => setThirdGuestName(e.target.value)} className="form-input-pms" />
                    <input type="text" placeholder="3rd Guest ID Type" value={thirdGuestIdName} onChange={e => setThirdGuestIdName(e.target.value)} className="form-input-pms" />
                    <input type="text" placeholder="3rd Guest ID No" value={thirdGuestIdNo} onChange={e => setThirdGuestIdNo(e.target.value)} className="form-input-pms" />
                  </div>
                </div>

                {/* Police & Tourism Compliance (Frame 0340) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 8 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Purpose Of Visit</label>
                    <select value={purposeOfVisit} onChange={e => setPurposeOfVisit(e.target.value as any)} className="form-select-pms">
                      <option value="Darshan / Pilgrimage">Darshan / Pilgrimage</option>
                      <option value="Business">Business</option>
                      <option value="Leisure">Leisure / Holiday</option>
                      <option value="Transit">Transit</option>
                    </select>
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Coming From</label>
                    <input type="text" value={comingFrom} onChange={e => setComingFrom(e.target.value)} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Going To</label>
                    <input type="text" value={goingTo} onChange={e => setGoingTo(e.target.value)} className="form-input-pms" />
                  </div>
                </div>
              </div>

              {/* Right Column: Room Selection & Negotiated Tariff & Payment Box */}
              <div>
                {/* Available Rooms Table with In-line Editable Tariff (Video 03 Frame 0210) */}
                <div style={{ border: '2px solid #38bdf8', borderRadius: 4, padding: 8, marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6, color: '#0369a1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Available Vacant Rooms ({availableRooms.length}):</span>
                    <span style={{ fontSize: 11, color: canChangeTariff ? '#64748b' : '#dc2626', fontWeight: !canChangeTariff ? 700 : 400 }}>
                      {canChangeTariff ? 'Tariff is Negotiable' : '🔒 Published Tariff Enforced (Staff Locked)'}
                    </span>
                  </div>
                  <div style={{ maxHeight: 180, overflowY: 'auto' }}>
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
                        {availableRooms.map(r => (
                          <tr key={r.id} style={{ background: selectedRoomNo === r.roomNo ? '#f0f9ff' : undefined }}>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="radio"
                                name="checkin_room_radio"
                                checked={selectedRoomNo === r.roomNo}
                                onChange={() => {
                                  setSelectedRoomNo(r.roomNo);
                                  setCustomTariff(r.tariff);
                                }}
                              />
                            </td>
                            <td style={{ fontWeight: 700 }}>{r.roomNo}</td>
                            <td>{r.roomType}</td>
                            <td>
                              {selectedRoomNo === r.roomNo ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <input
                                    type="number"
                                    value={customTariff}
                                    readOnly={!canChangeTariff}
                                    onChange={e => {
                                      if (!canChangeTariff) {
                                        alert('Permission Denied: Only Super-Admin or General Manager can modify room tariff. Standard staff cannot override rates or offer unauthorized discounts (Video 23 Anti-Theft Guard).');
                                        return;
                                      }
                                      setCustomTariff(Number(e.target.value));
                                    }}
                                    className="form-input-pms"
                                    style={{
                                      width: 85,
                                      padding: '2px 4px',
                                      fontWeight: 800,
                                      textAlign: 'right',
                                      background: !canChangeTariff ? '#f8fafc' : '#ffffff',
                                      cursor: !canChangeTariff ? 'not-allowed' : 'auto',
                                      borderColor: !canChangeTariff ? '#cbd5e1' : '#38bdf8'
                                    }}
                                    title={!canChangeTariff ? 'Room Tariff Locked: "Change_Room_Tariff" permission required to modify rates (Video 23 Anti-Theft Guard)' : 'Tariff is editable'}
                                  />
                                  {!canChangeTariff && (
                                    <span title="Tariff Locked: Standard staff restricted from unauthorized discounts (Video 23)" style={{ fontSize: 11, color: '#e11d48', cursor: 'help' }}>
                                      🔒
                                    </span>
                                  )}
                                </div>
                              ) : (
                                `₹${r.tariff}`
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Detail Box with Split Payments (Video 03 Frame 0260) */}
                <div style={{ border: '2px solid #84cc16', borderRadius: 4, padding: 12, background: '#f8fafc' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#15803d', marginBottom: 8, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>
                    Payment Detail
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Per Day Room Tariff</span>
                    <input
                      type="text"
                      readOnly
                      value={customTariff.toFixed(2)}
                      className="form-input-pms"
                      style={{ width: 110, textAlign: 'right', background: '#f1f5f9', fontWeight: 800 }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Total Room Rent ({noOfDays} Days)</span>
                    <input
                      type="text"
                      readOnly
                      value={`₹${(customTariff * noOfDays).toFixed(2)}`}
                      className="form-input-pms"
                      style={{ width: 110, textAlign: 'right', background: '#dcfce7', fontWeight: 800, color: '#15803d' }}
                    />
                  </div>

                  {/* Split Payment Rows */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Check-in Advance Modes:
                    </div>
                    {paymentSplits.map((split, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                        <select
                          value={split.mode}
                          onChange={e => handleUpdateSplit(idx, 'mode', e.target.value)}
                          className="form-select-pms"
                          style={{ width: 110, fontWeight: 600 }}
                        >
                          <option value="Cash">Cash</option>
                          <option value="Online">Online / PhonePe</option>
                          <option value="UPI">UPI / QR</option>
                          <option value="Card">Card</option>
                          <option value="Bank Transfer">Bank</option>
                        </select>

                        <input
                          type="number"
                          min="0"
                          placeholder="Amount"
                          value={split.amount}
                          onChange={e => handleUpdateSplit(idx, 'amount', Number(e.target.value))}
                          className="form-input-pms"
                          style={{ width: 95, textAlign: 'right', fontWeight: 800 }}
                        />

                        {paymentSplits.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPaymentSplits(paymentSplits.filter((_, i) => i !== idx))}
                            style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}

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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms">Payment Reference</label>
                      <input
                        type="text"
                        placeholder="e.g. 5454353 / UTR"
                        value={paymentReference}
                        onChange={e => setPaymentReference(e.target.value)}
                        className="form-input-pms"
                      />
                    </div>
                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms">Payment Remark</label>
                      <input
                        type="text"
                        placeholder="PHONE PAY"
                        value={paymentRemark}
                        onChange={e => setPaymentRemark(e.target.value)}
                        className="form-input-pms"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Buttons matching Video 03 Frame 0260 */}
            <div className="pms-btn-group">
              <button
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
                type="submit"
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

      {/* Guest Registration Check-in Slip Modal */}
      <CheckInSlipModal
        isOpen={isSlipOpen}
        onClose={() => {
          setIsSlipOpen(false);
          onClose();
        }}
        checkIn={completedCheckIn}
      />
    </>
  );
};
