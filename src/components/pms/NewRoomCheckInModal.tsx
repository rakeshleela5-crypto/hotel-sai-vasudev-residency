import React, { useState, useEffect } from 'react';
import type { PmsCheckIn, PmsRoom, PaymentSplit } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';
import { CheckInSlipModal } from './CheckInSlipModal';
import { decentroApi } from '../../services/decentroApi';
import { DecentroUpiQrModal } from './DecentroUpiQrModal';

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
  // Filter out dirty, maintenance and occupied rooms (strict 6-state VACANT_CLEAN)
  const availableRooms = allRooms.filter(r => PmsStore.isRoomVacantClean(r));

  const existingBookings = PmsStore.getBookings().filter(b => b.status === 'Confirmed');

  // Check In format: SR/188/26-27
  const defaultCheckInNo = `SR/${Math.floor(180 + Math.random() * 20)}/26-27`;
  const todayStr = PmsStore.getBusinessDate();
  const tomorrowStr = (() => {
    const d = new Date(todayStr);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const [checkInNo] = useState(defaultCheckInNo);
  const [selectedBookingRef, setSelectedBookingRef] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Strict Date & Night Calculation (Module 2 Requirement)
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(tomorrowStr);
  const [checkInTime, setCheckInTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  });
  const [noOfDays, setNoOfDays] = useState(1);

  // Extra Guest / Mattress & Occupancy (Module 2 Requirement)
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const noOfGuests = adults + children;

  const [businessSource, setBusinessSource] = useState<PmsCheckIn['businessSource']>('Direct');
  const [selectedPackage, setSelectedPackage] = useState('WITH BREAKFAST || 0');
  const [remark1, setRemark1] = useState('');
  const [remark2, setRemark2] = useState('');

  // Permission checks
  const canChangeTariff = PmsStore.hasPermission('Change_Room_Tariff');
  const canChangeDateTime = PmsStore.hasPermission('Change_Date&Time');

  // Selected Room & Custom Tariff
  const [selectedRoomNo, setSelectedRoomNo] = useState<string>(
    preselectedRoom ? preselectedRoom.roomNo : (availableRooms[0]?.roomNo || '101')
  );
  const [customTariff, setCustomTariff] = useState<number>(
    preselectedRoom ? preselectedRoom.tariff : (availableRooms[0]?.tariff || 2499)
  );

  // 6-State Room Status Machine & Supervisor Override Gate
  const selectedRoomObj = allRooms.find(r => r.roomNo === selectedRoomNo) || preselectedRoom;
  const currentRoomType = selectedRoomObj?.roomType || 'Executive Deluxe';
  const roomNormStatus = PmsStore.normalizeRoomStatus(selectedRoomObj?.status || 'VACANT_CLEAN');
  const isRoomClean = roomNormStatus === 'VACANT_CLEAN';
  const isRoomDirty = roomNormStatus === 'VACANT_DIRTY';

  const [supervisorOverride, setSupervisorOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [housekeepingAlertSent, setHousekeepingAlertSent] = useState(false);

  // Early Check-In Policy Engine (< 6 AM Full Day, 6-9 AM Half Day, 9-12 PM Complimentary)
  const parseArrivalHour = (timeStr: string): number => {
    try {
      const isPm = /pm/i.test(timeStr);
      const isAm = /am/i.test(timeStr);
      const parts = timeStr.replace(/[^\d:]/g, '').split(':');
      let h = parseInt(parts[0] || '12', 10);
      if (isPm && h < 12) h += 12;
      if (isAm && h === 12) h = 0;
      return h;
    } catch {
      return 12;
    }
  };

  const arrivalHour = parseArrivalHour(checkInTime);
  const isEarlyArrival = arrivalHour < 12;
  const defaultEarlyPolicy = arrivalHour < 6 ? 'full' : arrivalHour < 9 ? 'half' : 'complimentary';
  const [earlyCheckInPolicy, setEarlyCheckInPolicy] = useState<'standard' | 'full' | 'half' | 'complimentary' | 'custom'>(
    isEarlyArrival ? defaultEarlyPolicy : 'standard'
  );
  const [customEarlyCharge, setCustomEarlyCharge] = useState<number>(0);

  const earlyCheckInCharge = (() => {
    if (!isEarlyArrival || earlyCheckInPolicy === 'standard' || earlyCheckInPolicy === 'complimentary') return 0;
    if (earlyCheckInPolicy === 'full') return customTariff;
    if (earlyCheckInPolicy === 'half') return Math.round(customTariff * 0.5);
    if (earlyCheckInPolicy === 'custom') return customEarlyCharge;
    return 0;
  })();

  // Sync when preselectedRoom prop changes (e.g. clicked + Walk-In Check-In on Room 102)
  useEffect(() => {
    if (preselectedRoom) {
      setSelectedRoomNo(preselectedRoom.roomNo);
      setCustomTariff(preselectedRoom.tariff);
    }
  }, [preselectedRoom]);

  const getCapacityRules = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('premium')) {
      return { baseCapacity: 2, extraRate: 0, label: 'Premium' };
    }
    if (t.includes('executive')) {
      return { baseCapacity: 2, extraRate: 0, label: 'Executive' };
    }
    if (t.includes('classic') || t.includes('studio')) {
      return { baseCapacity: 2, extraRate: 0, label: 'Classic Studio' };
    }
    // Deluxe (rooms 101, 102, 202) — single-occupancy
    return { baseCapacity: 1, extraRate: 0, label: 'Deluxe' };
  };

  const capacityRule = getCapacityRules(currentRoomType);
  const extraGuestsCount = Math.max(0, noOfGuests - capacityRule.baseCapacity);
  const extraGuestChargePerNight = extraGuestsCount * capacityRule.extraRate;
  const totalExtraGuestCharge = extraGuestChargePerNight * noOfDays;
  const baseRoomRentTotal = customTariff * noOfDays;
  const grandAccommodationTotal = baseRoomRentTotal + totalExtraGuestCharge + earlyCheckInCharge;

  // Strict Calendar Date Difference & Minimum 1-Night Calculation (Module 2)
  const calculateCalendarNights = (inDate: string, outDate: string): number => {
    if (!inDate || !outDate) return 1;
    const dIn = new Date(inDate);
    const dOut = new Date(outDate);
    const diffMs = dOut.getTime() - dIn.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    // Same-day pilgrim day-use stays always bill minimum 1 night
    return Math.max(1, diffDays);
  };

  const handleCheckInDateChange = (val: string) => {
    setCheckInDate(val);
    if (checkOutDate < val) {
      setCheckOutDate(val);
      setNoOfDays(1);
    } else {
      setNoOfDays(calculateCalendarNights(val, checkOutDate));
    }
  };

  const handleCheckOutDateChange = (val: string) => {
    if (val < checkInDate) {
      alert('Check-Out date cannot be earlier than Check-In date. For same-day pilgrim day-use darshan stays, select the same date (billed as 1 night).');
      setCheckOutDate(checkInDate);
      setNoOfDays(1);
      return;
    }
    setCheckOutDate(val);
    setNoOfDays(calculateCalendarNights(checkInDate, val));
  };

  const handleDaysChange = (days: number) => {
    const valid = Math.max(1, days);
    setNoOfDays(valid);
    const d = new Date(checkInDate);
    d.setDate(d.getDate() + valid);
    setCheckOutDate(d.toISOString().split('T')[0]);
  };

  // Guest Details & Mandatory Indian KYC
  const [guestName, setGuestName] = useState('');
  const [mobile, setMobile] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [country] = useState('India');
  const [pinCode, setPinCode] = useState('');
  const [nationality, setNationality] = useState('India');
  const [passportNo, setPassportNo] = useState('');
  const [visaNo, setVisaNo] = useState('');
  const [visaExpiry, setVisaExpiry] = useState('');
  const [cFormAcknowledged, setCFormAcknowledged] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [agent, setAgent] = useState('');
  const [documentName, setDocumentName] = useState('Aadhaar Card');
  const [documentNo, setDocumentNo] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [gstNo, setGstNo] = useState('');

  // Decentro Banking & KYC State
  const [showDecentroAdvanceQr, setShowDecentroAdvanceQr] = useState<boolean>(false);
  const [isVerifyingGstin, setIsVerifyingGstin] = useState<boolean>(false);
  const [gstinVerifiedBadge, setGstinVerifiedBadge] = useState<string | null>(null);

  const handleVerifyGstin = async () => {
    if (!gstNo || gstNo.trim().length !== 15) {
      alert('Please enter a 15-character GSTIN (e.g. 21AEKPP8689J1ZS or 21AAACJ...)');
      return;
    }
    setIsVerifyingGstin(true);
    try {
      const res = await decentroApi.verifyGstin(gstNo);
      if (res.success) {
        if (res.trade_name || res.legal_name) {
          setCompanyName(res.trade_name || res.legal_name);
        }
        if (res.address) {
          setCompanyAddress(res.address);
        }
        setGstinVerifiedBadge(`✓ ${res.legal_name} (${res.state || 'Verified'})`);
      } else {
        alert(res.message || 'GSTIN verification failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error verifying GSTIN via Decentro KYC');
    } finally {
      setIsVerifyingGstin(false);
    }
  };

  // Photos (Cloudflare R2 Encrypted)
  const [guestPhoto, setGuestPhoto] = useState<string | null>(null);
  const [idPhotoFront, setIdPhotoFront] = useState<string | null>(null);
  const [idPhotoBack, setIdPhotoBack] = useState<string | null>(null);
  const [uploadingDocSlot, setUploadingDocSlot] = useState<string | null>(null);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);

  // Co-Travelers KYC
  const [secondGuestName, setSecondGuestName] = useState('');
  const [secondGuestIdName, setSecondGuestIdName] = useState('Aadhaar Card');
  const [secondGuestIdNo, setSecondGuestIdNo] = useState('');
  const [thirdGuestName, setThirdGuestName] = useState('');
  const [thirdGuestIdName, setThirdGuestIdName] = useState('Aadhaar Card');
  const [thirdGuestIdNo, setThirdGuestIdNo] = useState('');

  // Police & Tourism Compliance (C-Form Fields)
  const [purposeOfVisit, setPurposeOfVisit] = useState<PmsCheckIn['purposeOfVisit']>('Darshan / Pilgrimage');
  const [comingFrom, setComingFrom] = useState('Mumbai');
  const [goingTo, setGoingTo] = useState('Shani Shingnapur');

  // Advance Deposit Receipt (Amount, Payment Mode, Ref No)
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([
    { mode: 'UPI', amount: 1000, referenceNo: 'UPI/2026/ADV', remark: 'PhonePe Advance' }
  ]);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentRemark, setPaymentRemark] = useState('Advance Deposit');

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

  // Handle Advance Booking Selection
  const handleSelectBooking = (bookingNo: string) => {
    setSelectedBookingRef(bookingNo);
    if (!bookingNo) return;

    const b = existingBookings.find(x => x.bookingNo === bookingNo);
    if (b) {
      setGuestName(b.guestName);
      setMobile(b.mobile);
      setCity(b.city || '');
      setState(b.state || 'Maharashtra');
      setPinCode(b.pinCode || '');
      setDocumentName(b.documentName || 'Aadhaar Card');
      setDocumentNo(b.documentNo || '');
      setAdults(b.adults || b.numberOfGuests || 2);
      setChildren(b.children || 0);
      setNoOfDays(b.numberOfDays || 1);
      if (b.checkInDate) setCheckInDate(b.checkInDate);
      if (b.checkOutDate) setCheckOutDate(b.checkOutDate);
      if (b.rooms[0]) {
        setSelectedRoomNo(b.rooms[0].roomNo);
        setCustomTariff(b.rooms[0].tariff);
      }
      if (b.bookingAmount > 0) {
        setPaymentSplits([{ mode: b.paymentMode as any, amount: b.bookingAmount, referenceNo: b.paymentReferenceNo, remark: 'Advance converted' }]);
      }
    }
  };

  // Handle Select Guest Dropdown
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
      { mode: 'Cash', amount: 500, referenceNo: '', remark: 'Cash deposit' }
    ]);
  };

  const handleUpdateSplit = (index: number, field: keyof PaymentSplit, val: any) => {
    const updated = [...paymentSplits];
    updated[index] = { ...updated[index], [field]: val };
    setPaymentSplits(updated);
  };

  const totalAdvancePaid = paymentSplits.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Strict Form Validation (Module 2 Requirement)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 0. Hard Room Status Machine Check: Block if not clean unless supervisor override
    if (!isRoomClean && !supervisorOverride) {
      alert(`Hard Check-In Block:\n\nRoom ${selectedRoomNo} is currently in ${roomNormStatus} state.\n\nOnly VACANT_CLEAN rooms may be checked in. If the room has been cleaned and inspected, please use "Supervisor Inspection Override" or alert Housekeeping.`);
      return;
    }

    // 0.1 Foreign National C-Form & Passport Validation
    if (nationality.trim().toLowerCase() !== 'india') {
      if (!passportNo.trim()) {
        alert("Mandatory Foreign National KYC:\n\nPlease enter the guest's valid Passport Number.");
        return;
      }
      if (!visaNo.trim()) {
        alert("Mandatory Foreign National KYC:\n\nPlease enter the guest's Indian Visa Number.");
        return;
      }
      if (!cFormAcknowledged) {
        alert("Mandatory Police / Bureau of Immigration Compliance:\n\nPlease check the C-Form verification checkbox.");
        return;
      }
    }

    // 1. Full Name Validation
    const cleanName = guestName.trim();
    if (!cleanName || cleanName.length < 3) {
      alert('Please enter a valid Guest Full Name (minimum 3 characters).');
      return;
    }

    // 2. 10-Digit Indian Mobile Number Validation (^[6-9]\d{9}$)
    const cleanMobile = mobile.trim().replace(/\D/g, '');
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(cleanMobile)) {
      alert(`Invalid Mobile Number "${mobile}". Indian KYC requires a valid 10-digit mobile number starting with 6, 7, 8, or 9 (e.g. 9822000000).`);
      return;
    }

    // 3. Indian ID Proof Validation
    if (!documentNo.trim()) {
      alert(`Please enter the ${documentName} Number for Indian KYC & Police C-Form verification.`);
      return;
    }

    // 4. Police C-Form Origin & Destination Validation
    if (!comingFrom.trim() || !goingTo.trim()) {
      alert('Police C-Form & Tourism compliance requires both "Coming From (City)" and "Proceeding To (Destination)".');
      return;
    }

    // 5. Optional B2B 15-Character GSTIN Validation
    if (gstNo.trim()) {
      const cleanGst = gstNo.trim().toUpperCase();
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(cleanGst) && cleanGst.length !== 15) {
        alert(`Invalid GSTIN "${gstNo}". Indian B2B Tax Invoices require a 15-character valid GSTIN (e.g. 27AAAAA0000A1Z5).`);
        return;
      }
    }

    const checkInRecord: PmsCheckIn = {
      checkInNo,
      roomNo: selectedRoomNo,
      roomType: currentRoomType,
      guestName: cleanName,
      mobile: cleanMobile,
      addressLine1,
      addressLine2,
      city: city.trim() || 'Renukot',
      state: state.trim() || 'Maharashtra',
      country,
      pinCode,
      nationality,
      phone,
      email,
      checkInDate,
      checkInTime,
      checkOutDate,
      numberOfDays: noOfDays,
      numberOfGuests: noOfGuests,
      adults,
      children,
      extraGuests: extraGuestsCount,
      extraGuestCharge: totalExtraGuestCharge,
      extraGuestRate: capacityRule.extraRate,
      totalStayTariff: grandAccommodationTotal,
      businessSource,
      package: selectedPackage,
      tariffPerDay: customTariff,
      advancePaid: totalAdvancePaid,
      paymentMode: paymentSplits[0]?.mode || 'Cash',
      paymentReferenceNo: paymentReference || paymentSplits[0]?.referenceNo || '',
      paymentRemark,
      payments: paymentSplits,
      documentName,
      documentNo: documentNo.trim(),
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
      comingFrom: comingFrom.trim(),
      goingTo: goingTo.trim(),
      companyName: companyName.trim(),
      companyAddress: companyAddress.trim(),
      gstNo: gstNo.trim().toUpperCase(),
      remark1,
      remark2,
      bookingRefNo: selectedBookingRef || undefined,
      status: 'CheckedIn',
      createdAt: new Date().toISOString()
    };

    // Save to PmsStore & update room status to occupied
    PmsStore.saveCheckIn(checkInRecord);

    // Submit official Police Station / Form C Registration Log to Railway PostgreSQL
    hotelApi.submitPoliceStationLog({
      booking_ref: selectedBookingRef || `SVR-ROOM-${selectedRoomNo}`,
      guest_name: cleanName,
      age: 35,
      gender: 'Male',
      nationality: nationality || 'Indian',
      id_proof_type: documentName || 'Aadhaar Card',
      id_proof_number: documentNo.trim() || 'VERIFIED_AT_DESK',
      permanent_address: `${addressLine1} ${city} ${state} ${pinCode}`.trim() || 'Not Provided',
      origin_city: comingFrom.trim() || 'Shirdi',
      next_destination: goingTo.trim() || 'Home',
      purpose_of_visit: purposeOfVisit || 'Temple Darshan',
      vehicle_number: undefined,
      is_foreign_national: nationality?.toLowerCase() !== 'india' && nationality?.toLowerCase() !== 'indian'
    }).catch(err => {
      console.warn('[NewRoomCheckInModal] Police registration log note:', err);
    });

    // Post Early Check-In Charge to Room Account if applicable
    if (earlyCheckInCharge > 0) {
      PmsStore.postChargeToRoom(selectedRoomNo, {
        chargeName: `Early Check-In Surcharge (${earlyCheckInPolicy.toUpperCase()})`,
        sacCode: '996311',
        amount: earlyCheckInCharge,
        gstPercent: customTariff > 7500 ? 18 : 12
      });
    }

    // Post Double-Entry Journal entries for Advance Payment
    if (totalAdvancePaid > 0) {
      const mode = paymentSplits[0]?.mode || 'Cash';
      const debitAccount = mode === 'Cash'
        ? 'Cash in Hand (Reception)'
        : mode === 'Card'
        ? 'Card EDC Receivable'
        : 'HDFC Bank / UPI Settlement A/c';

      // 1. Advance Receipt Voucher Entry: Dr Cash/Bank, Cr Guest Advance Deposit Liability
      PmsStore.postJournalEntry({
        date: checkInDate,
        time: checkInTime,
        referenceNo: `ARV-2026-${checkInNo.replace(/[^\d]/g, '').slice(-4) || '1001'}`,
        voucherType: 'Advance',
        debitAccount,
        creditAccount: 'Guest Advance Deposit Liability',
        amountPaise: Math.round(totalAdvancePaid * 100),
        amountRupees: totalAdvancePaid,
        narration: `Advance received for Check-in ${checkInNo} (Room ${selectedRoomNo}, ${cleanName}) via ${mode}`,
        postedBy: 'Front Desk'
      });

      // 2. Transfer from Guest Advance Deposit Liability into In-House Guest Folio Receivable
      PmsStore.postJournalEntry({
        date: checkInDate,
        time: checkInTime,
        referenceNo: `ADV-FOLIO-${selectedRoomNo}`,
        voucherType: 'Advance',
        debitAccount: 'Guest Advance Deposit Liability',
        creditAccount: 'In-House Guest Folio Receivable',
        amountPaise: Math.round(totalAdvancePaid * 100),
        amountRupees: totalAdvancePaid,
        narration: `Advance credit transferred into In-House Folio for Room ${selectedRoomNo}`,
        postedBy: 'Front Desk'
      });
    }

    // Salesman / Travel Agent Commission Tracking
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
        
        const grossRoomTariff = grandAccommodationTotal;
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
          guestName: cleanName,
          guestMobile: cleanMobile,
          checkInDate,
          checkOutDate,
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

    setIsProcessing(false);
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

          {/* 6-State Status Alert & Hard Interlock Banner */}
          {!isRoomClean && (
            <div style={{
              background: isRoomDirty ? '#fef3c7' : '#fee2e2',
              border: `2px solid ${isRoomDirty ? '#f59e0b' : '#ef4444'}`,
              borderRadius: 6,
              padding: '10px 14px',
              margin: '12px 14px 0 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap'
            }}>
              <div>
                <div style={{ fontWeight: 900, color: isRoomDirty ? '#92400e' : '#b91c1c', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{isRoomDirty ? '⚠️ ROOM NOT CLEANED (VACANT_DIRTY)' : '⛔ ROOM BLOCKED / OCCUPIED'}</span>
                  <span style={{ background: '#0f172a', color: '#fff', padding: '1px 6px', borderRadius: 3, fontSize: 11 }}>
                    Status: {roomNormStatus}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                  {isRoomDirty 
                    ? `Room ${selectedRoomNo} is currently dirty from previous guest departure. Check-in is restricted to prevent guest dissatisfaction.`
                    : `Room ${selectedRoomNo} is currently in ${roomNormStatus} state. Check-in is blocked. Please select another clean room.`}
                </div>
              </div>

              {isRoomDirty && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setHousekeepingAlertSent(true);
                      alert(`🧹 Housekeeping Dispatched!\n\nExpress cleaning alert sent for Room ${selectedRoomNo}. Housekeeping priority elevated.`);
                    }}
                    style={{
                      background: housekeepingAlertSent ? '#16a34a' : '#d97706',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 4,
                      fontWeight: 800,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    {housekeepingAlertSent ? '✓ Housekeeping Alerted' : '🧹 1-Click Alert Housekeeping'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const reason = prompt('Enter Supervisor Override Authorization Note (e.g., Quick Darshan inspection passed):', 'Supervisor inspected - Guest arrived early for Shirdi Darshan');
                      if (reason) {
                        setSupervisorOverride(true);
                        setOverrideReason(reason);
                      }
                    }}
                    style={{
                      background: supervisorOverride ? '#059669' : '#1e293b',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 4,
                      fontWeight: 800,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    {supervisorOverride ? `✓ Override Granted (${overrideReason.slice(0, 15)}...)` : '🛡️ Supervisor Inspection Override'}
                  </button>
                </div>
              )}
            </div>
          )}

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

              {/* Guest Live Image Box (Cloudflare R2 Direct Upload) */}
              <label 
                className="pms-photo-box" 
                style={{ 
                  overflow: 'hidden', 
                  cursor: uploadingDocSlot === 'guest' ? 'not-allowed' : 'pointer',
                  position: 'relative',
                  border: guestPhoto ? '2px solid #22c55e' : '1px dashed #3b82f6',
                  background: guestPhoto ? '#000' : '#f0f9ff'
                }}
                title="Click to upload guest face photo or webcam capture to Cloudflare R2"
              >
                {uploadingDocSlot === 'guest' ? (
                  <span style={{ fontSize: 10, color: '#0369a1', fontWeight: 700 }}>⏳ Uploading to R2...</span>
                ) : guestPhoto ? (
                  <>
                    <img src={guestPhoto} alt="Guest" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(15, 23, 42, 0.8)', color: '#38bdf8', fontSize: 8, padding: '1px 4px', borderRadius: 2 }}>
                      ☁️ R2
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: 10, color: '#1d4ed8' }}>
                    📷 Click to Upload<br /><b>Guest Photo</b>
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingDocSlot === 'guest'}
                  style={{ display: 'none' }}
                  onChange={async e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setDocUploadError(null);
                      setUploadingDocSlot('guest');
                      try {
                        const res = await hotelApi.uploadGuestDocument(f);
                        setGuestPhoto(res.url);
                      } catch (err: any) {
                        setDocUploadError(`Guest photo upload error: ${err.message}`);
                      } finally {
                        setUploadingDocSlot(null);
                      }
                    }
                  }}
                />
              </label>

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

              {/* Stacked ID Proof Front & Back Photos (Cloudflare R2 Direct Upload) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label 
                  className="pms-photo-box" 
                  style={{ 
                    width: 96, 
                    height: 42, 
                    overflow: 'hidden', 
                    cursor: uploadingDocSlot === 'idFront' ? 'not-allowed' : 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: idPhotoFront ? '1.5px solid #22c55e' : '1px dashed #94a3b8',
                    position: 'relative'
                  }}
                  title="Upload ID Proof Front to Cloudflare R2"
                >
                  {uploadingDocSlot === 'idFront' ? (
                    <span style={{ fontSize: 9, color: '#0369a1' }}>⏳ R2...</span>
                  ) : idPhotoFront ? (
                    <>
                      <img src={idPhotoFront} alt="ID Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', bottom: 1, right: 2, background: 'rgba(0,0,0,0.7)', color: '#38bdf8', fontSize: 7, padding: '0 2px' }}>R2</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 9, color: '#475569' }}>📎 ID Front (R2)</span>
                  )}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    disabled={uploadingDocSlot === 'idFront'}
                    style={{ display: 'none' }}
                    onChange={async e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setDocUploadError(null);
                        setUploadingDocSlot('idFront');
                        try {
                          const res = await hotelApi.uploadGuestDocument(f);
                          setIdPhotoFront(res.url);
                        } catch (err: any) {
                          setDocUploadError(`ID Front upload failed: ${err.message}`);
                        } finally {
                          setUploadingDocSlot(null);
                        }
                      }
                    }}
                  />
                </label>
                <label 
                  className="pms-photo-box" 
                  style={{ 
                    width: 96, 
                    height: 42, 
                    overflow: 'hidden', 
                    cursor: uploadingDocSlot === 'idBack' ? 'not-allowed' : 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: idPhotoBack ? '1.5px solid #22c55e' : '1px dashed #94a3b8',
                    position: 'relative'
                  }}
                  title="Upload ID Proof Back to Cloudflare R2"
                >
                  {uploadingDocSlot === 'idBack' ? (
                    <span style={{ fontSize: 9, color: '#0369a1' }}>⏳ R2...</span>
                  ) : idPhotoBack ? (
                    <>
                      <img src={idPhotoBack} alt="ID Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', bottom: 1, right: 2, background: 'rgba(0,0,0,0.7)', color: '#38bdf8', fontSize: 7, padding: '0 2px' }}>R2</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 9, color: '#475569' }}>📎 ID Back (R2)</span>
                  )}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    disabled={uploadingDocSlot === 'idBack'}
                    style={{ display: 'none' }}
                    onChange={async e => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setDocUploadError(null);
                        setUploadingDocSlot('idBack');
                        try {
                          const res = await hotelApi.uploadGuestDocument(f);
                          setIdPhotoBack(res.url);
                        } catch (err: any) {
                          setDocUploadError(`ID Back upload failed: ${err.message}`);
                        } finally {
                          setUploadingDocSlot(null);
                        }
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {docUploadError && (
              <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: 4, fontSize: 11, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>⚠️ {docUploadError}</span>
                <button type="button" onClick={() => setDocUploadError(null)} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
              </div>
            )}

            <div className="pms-grid-2col">
              {/* Left Column: Stay and Guest Details */}
              <div>
                {/* Stay Dates & Nights (Strict Calendar Calculation - Module 2) */}
                <div style={{ background: '#f0fdf4', padding: '10px 12px', borderRadius: '6px', border: '1px solid #bbf7d0', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                      📅 Stay Schedule &amp; Night Calculation
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#047857', background: '#d1fae5', padding: '1px 6px', borderRadius: 4 }}>
                      {noOfDays} Night{noOfDays > 1 ? 's' : ''} (Min. 1 Night for Day-Use)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr 1fr 1.1fr 0.8fr', gap: 8 }}>
                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms"><span className="req">*</span> Check In No</label>
                      <input type="text" readOnly value={checkInNo} className="form-input-pms" style={{ background: '#f1f5f9', fontWeight: 800 }} />
                    </div>

                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms">
                        <span className="req">*</span> Check In Date {!canChangeDateTime && <span title="Date Locked: Anti-Backdating Guard" style={{ color: '#e11d48' }}>🔒</span>}
                      </label>
                      <input 
                        type="date" 
                        value={checkInDate} 
                        readOnly={!canChangeDateTime}
                        onChange={e => {
                          if (!canChangeDateTime) {
                            alert('Permission Denied: Standard staff are restricted from altering Date & Time to prevent backdated ledger manipulation (Anti-Backdating Security Policy).');
                            return;
                          }
                          handleCheckInDateChange(e.target.value);
                        }} 
                        className="form-input-pms" 
                        style={{ background: !canChangeDateTime ? '#f1f5f9' : '#ffffff', cursor: !canChangeDateTime ? 'not-allowed' : 'auto', fontWeight: 700 }}
                      />
                    </div>

                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms">
                        Check In Time {!canChangeDateTime && <span title="Time Locked" style={{ color: '#e11d48' }}>🔒</span>}
                      </label>
                      <input 
                        type="text" 
                        value={checkInTime} 
                        readOnly={!canChangeDateTime}
                        onChange={e => {
                          if (!canChangeDateTime) return;
                          setCheckInTime(e.target.value);
                        }} 
                        className="form-input-pms" 
                        style={{ background: !canChangeDateTime ? '#f1f5f9' : '#ffffff', cursor: !canChangeDateTime ? 'not-allowed' : 'auto', fontWeight: 600 }}
                      />
                    </div>

                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms">
                        <span className="req">*</span> Check Out Date
                      </label>
                      <input 
                        type="date" 
                        min={checkInDate}
                        value={checkOutDate} 
                        onChange={e => handleCheckOutDateChange(e.target.value)} 
                        className="form-input-pms" 
                        style={{ fontWeight: 700, borderColor: '#059669' }}
                      />
                    </div>

                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms"><span className="req">*</span> Nights</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={noOfDays} 
                        onChange={e => handleDaysChange(Number(e.target.value))} 
                        className="form-input-pms" 
                        style={{ fontWeight: 800, textAlign: 'center', background: '#ecfdf5', color: '#047857' }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Early Check-In Policy Engine (Arrival before 12:00 PM) */}
                {isEarlyArrival && (
                  <div style={{ background: '#fefce8', padding: '10px 12px', borderRadius: '6px', border: '1px solid #fef08a', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#854d0e', textTransform: 'uppercase' }}>
                        🌅 Early Check-In Policy Engine &bull; Arrival Time: {checkInTime}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '1px 8px', borderRadius: 4 }}>
                        Standard Check-In: 12:00 PM &bull; Surcharge: ₹{earlyCheckInCharge}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setEarlyCheckInPolicy('complimentary')}
                        style={{
                          background: earlyCheckInPolicy === 'complimentary' ? '#15803d' : '#ffffff',
                          color: earlyCheckInPolicy === 'complimentary' ? '#ffffff' : '#334155',
                          border: '1px solid #cbd5e1',
                          padding: '6px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        9 AM - 12 PM<br /><strong>Complimentary (₹0)</strong>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEarlyCheckInPolicy('half')}
                        style={{
                          background: earlyCheckInPolicy === 'half' ? '#d97706' : '#ffffff',
                          color: earlyCheckInPolicy === 'half' ? '#ffffff' : '#334155',
                          border: '1px solid #cbd5e1',
                          padding: '6px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        6 AM - 9 AM<br /><strong>Half Day (₹{Math.round(customTariff * 0.5)})</strong>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEarlyCheckInPolicy('full')}
                        style={{
                          background: earlyCheckInPolicy === 'full' ? '#b91c1c' : '#ffffff',
                          color: earlyCheckInPolicy === 'full' ? '#ffffff' : '#334155',
                          border: '1px solid #cbd5e1',
                          padding: '6px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        &lt; 6 AM<br /><strong>Full Day (₹{customTariff})</strong>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEarlyCheckInPolicy('custom');
                          const val = prompt('Enter custom early check-in charge (₹):', String(customEarlyCharge || 500));
                          if (val) setCustomEarlyCharge(Number(val));
                        }}
                        style={{
                          background: earlyCheckInPolicy === 'custom' ? '#4338ca' : '#ffffff',
                          color: earlyCheckInPolicy === 'custom' ? '#ffffff' : '#334155',
                          border: '1px solid #cbd5e1',
                          padding: '6px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Custom Override<br /><strong>₹{customEarlyCharge}</strong>
                      </button>
                    </div>
                  </div>
                )}

                {/* Occupancy & Extra Guest Mattress Auto-Charge (Module 2) */}
                <div style={{ background: '#eff6ff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #bfdbfe', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>
                      👥 Guest Occupancy &amp; Room Capacity
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: extraGuestsCount > 0 ? '#b45309' : '#1d4ed8', background: extraGuestsCount > 0 ? '#fef3c7' : '#dbeafe', padding: '1px 8px', borderRadius: 4 }}>
                      {currentRoomType} (Base: {capacityRule.baseCapacity} Guests)
                      {extraGuestsCount > 0 && ` &bull; +${extraGuestsCount} Extra Mattress @ ₹${capacityRule.extraRate}/nt`}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr 1.5fr', gap: 10 }}>
                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms"><span className="req">*</span> Adults (12+ Yrs)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="8" 
                        value={adults} 
                        onChange={e => setAdults(Math.max(1, Number(e.target.value)))} 
                        className="form-input-pms" 
                        style={{ fontWeight: 800 }} 
                      />
                    </div>

                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms">Children</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="6" 
                        value={children} 
                        onChange={e => setChildren(Math.max(0, Number(e.target.value)))} 
                        className="form-input-pms" 
                      />
                    </div>

                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms"><span className="req">*</span> Business Source</label>
                      <select value={businessSource} onChange={e => setBusinessSource(e.target.value as any)} className="form-select-pms" style={{ fontWeight: 600 }}>
                        <option value="Direct">Direct (Walk-in Counter)</option>
                        <option value="OYO">OYO</option>
                        <option value="Make My Trip">Make My Trip</option>
                        <option value="Goibibo">Goibibo</option>
                        <option value="Corporate">Corporate</option>
                      </select>
                    </div>

                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms"><span className="req">*</span> Package</label>
                      <select value={selectedPackage} onChange={e => setSelectedPackage(e.target.value)} className="form-select-pms" style={{ fontWeight: 600 }}>
                        <option value="WITH BREAKFAST || 0">WITH BREAKFAST || 0</option>
                        <option value="ROOM ONLY || 0">ROOM ONLY || 0</option>
                        <option value="CP">CP (Breakfast Included)</option>
                        <option value="MAP">MAP (Breakfast + Dinner)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms">Special Request (Remark 1)</label>
                      <input type="text" placeholder="e.g. Ground floor preferred" value={remark1} onChange={e => setRemark1(e.target.value)} className="form-input-pms" />
                    </div>
                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms">Desk Notes (Remark 2)</label>
                      <input type="text" placeholder="e.g. Verified pilgrim ID" value={remark2} onChange={e => setRemark2(e.target.value)} className="form-input-pms" />
                    </div>
                  </div>
                </div>

                {/* Primary Guest Details & Mandatory Indian KYC */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> Guest Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Ramesh Chandra Sharma" 
                      value={guestName} 
                      onChange={e => setGuestName(e.target.value)} 
                      className="form-input-pms" 
                      style={{ fontWeight: 700 }}
                      required 
                    />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">
                      <span className="req">*</span> 10-Digit Mobile <span style={{ fontSize: 10, color: '#64748b' }}>(^[6-9]\d&#123;9&#125;$)</span>
                    </label>
                    <input 
                      type="tel" 
                      maxLength={10} 
                      placeholder="9822000000" 
                      value={mobile} 
                      onChange={e => setMobile(e.target.value.replace(/\D/g, ''))} 
                      className="form-input-pms" 
                      style={{ fontWeight: 800, letterSpacing: '0.5px' }}
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Address Line 1</label>
                    <input type="text" placeholder="Plot / Flat No, Street" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Address Line 2 / Landmark</label>
                    <input type="text" placeholder="Area / Landmark" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} className="form-input-pms" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> City</label>
                    <input type="text" placeholder="Mumbai" value={city} onChange={e => setCity(e.target.value)} className="form-input-pms" required />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">State</label>
                    <input type="text" placeholder="Maharashtra" value={state} onChange={e => setState(e.target.value)} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Country</label>
                    <input type="text" readOnly value={country} className="form-input-pms" style={{ background: '#f1f5f9' }} />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Pin Code</label>
                    <input type="text" placeholder="400001" value={pinCode} onChange={e => setPinCode(e.target.value)} className="form-input-pms" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Nationality</label>
                    <input type="text" value={nationality} onChange={e => setNationality(e.target.value)} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Phone / Alt Mobile</label>
                    <input type="tel" placeholder="Alt Mobile No." value={phone} onChange={e => setPhone(e.target.value)} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Email (For E-Receipt)</label>
                    <input type="email" placeholder="guest@example.com" value={email} onChange={e => setEmail(e.target.value)} className="form-input-pms" />
                  </div>
                </div>

                {/* Foreign National Mandatory C-Form Details */}
                {nationality.trim().toLowerCase() !== 'india' && (
                  <div style={{ background: '#fff1f2', padding: '10px 12px', borderRadius: '6px', border: '1px solid #fecdd3', margin: '10px 0' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#be123c', marginBottom: 6 }}>
                      🌍 Foreign National Compliance &bull; Bureau of Immigration C-Form:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <div>
                        <label className="form-label-pms"><span className="req">*</span> Passport Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. A12345678" 
                          value={passportNo} 
                          onChange={e => setPassportNo(e.target.value.toUpperCase())} 
                          className="form-input-pms" 
                          style={{ fontWeight: 800 }} 
                          required 
                        />
                      </div>
                      <div>
                        <label className="form-label-pms"><span className="req">*</span> Indian Visa Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. V987654321" 
                          value={visaNo} 
                          onChange={e => setVisaNo(e.target.value.toUpperCase())} 
                          className="form-input-pms" 
                          style={{ fontWeight: 800 }} 
                          required 
                        />
                      </div>
                      <div>
                        <label className="form-label-pms">Visa Expiry Date</label>
                        <input 
                          type="date" 
                          value={visaExpiry} 
                          onChange={e => setVisaExpiry(e.target.value)} 
                          className="form-input-pms" 
                        />
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, color: '#9f1239', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={cFormAcknowledged} 
                        onChange={e => setCFormAcknowledged(e.target.checked)} 
                        style={{ width: 16, height: 16 }} 
                      />
                      <span>I certify that Foreign Guest Passport and Indian Visa have been verified for Bureau of Immigration C-Form filing.</span>
                    </label>
                  </div>
                )}

                {/* ID Proof Selection & Number Validation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> ID Proof Type</label>
                    <select 
                      value={documentName} 
                      onChange={e => setDocumentName(e.target.value)} 
                      className="form-select-pms"
                      style={{ fontWeight: 700 }}
                    >
                      <option value="Aadhaar Card">Aadhaar Card (12 Digits)</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Voter ID">Voter ID / Election Card</option>
                    </select>
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms"><span className="req">*</span> {documentName} Number</label>
                    <input 
                      type="text" 
                      placeholder={documentName === 'Aadhaar Card' ? 'XXXX XXXX XXXX' : 'ID Number'} 
                      value={documentNo} 
                      onChange={e => setDocumentNo(e.target.value)} 
                      className="form-input-pms" 
                      style={{ fontWeight: 800 }}
                      required 
                    />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Agent / Referral</label>
                    <input 
                      type="text" 
                      list="pms-agent-datalist"
                      placeholder="Select Agent / MR" 
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

                {/* B2B GSTIN Corporate Details (Optional 15-character GSTIN) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 10 }}>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Company Name (B2B)</label>
                    <input type="text" placeholder="Corporate / Firm Name" value={companyName} onChange={e => setCompanyName(e.target.value)} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <label className="form-label-pms">Company Address</label>
                    <input type="text" placeholder="Registered office address" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="form-input-pms" />
                  </div>
                  <div className="form-group-pms">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <label className="form-label-pms" style={{ margin: 0 }}>15-Digit GSTIN (B2B)</label>
                      <button
                        type="button"
                        onClick={handleVerifyGstin}
                        disabled={isVerifyingGstin}
                        style={{
                          background: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          padding: '1px 6px',
                          borderRadius: 2,
                          fontSize: 9,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                        title="Verify GSTIN with Decentro Public Registry & auto-fill corporate name/address"
                      >
                        {isVerifyingGstin ? 'Verifying...' : '🔍 Verify (Decentro)'}
                      </button>
                    </div>
                    <input 
                      type="text" 
                      maxLength={15}
                      placeholder="21AEKPP8689J1ZS" 
                      value={gstNo} 
                      onChange={e => {
                        setGstNo(e.target.value.toUpperCase());
                        setGstinVerifiedBadge(null);
                      }} 
                      className="form-input-pms" 
                      style={{ fontWeight: 700, textTransform: 'uppercase' }}
                    />
                    {gstinVerifiedBadge && (
                      <div style={{ fontSize: 9, color: '#15803d', fontWeight: 800, marginTop: 2 }}>
                        {gstinVerifiedBadge}
                      </div>
                    )}
                  </div>
                </div>

                {/* Indian Police C-Form Fields (Coming From, Going To, Purpose) */}
                <div style={{ background: '#fdf4ff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #f0abfc', marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#86198f', marginBottom: 6 }}>
                    🏛️ Indian Police C-Form &amp; Pilgrim Tourism Compliance:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10 }}>
                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms"><span className="req">*</span> Purpose Of Visit</label>
                      <select value={purposeOfVisit} onChange={e => setPurposeOfVisit(e.target.value as any)} className="form-select-pms" style={{ fontWeight: 700 }}>
                        <option value="Darshan / Pilgrimage">🕉️ Temple Darshan / Pilgrimage</option>
                        <option value="Business">💼 Business / Official</option>
                        <option value="Leisure">👨‍👩‍👧 Family Leisure / Holiday</option>
                        <option value="Transit">🚆 Transit Stay</option>
                      </select>
                    </div>
                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms"><span className="req">*</span> Coming From (City)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Hyderabad / Mumbai" 
                        value={comingFrom} 
                        onChange={e => setComingFrom(e.target.value)} 
                        className="form-input-pms" 
                        required 
                      />
                    </div>
                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms"><span className="req">*</span> Proceeding To</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Shani Shingnapur" 
                        value={goingTo} 
                        onChange={e => setGoingTo(e.target.value)} 
                        className="form-input-pms" 
                        required 
                      />
                    </div>
                  </div>
                </div>

                {/* Co-Travelers KYC (Police Station Verification) */}
                <div style={{ background: '#f8fafc', padding: 8, borderRadius: 4, marginTop: 10, border: '1px solid #cbd5e1' }}>
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
              </div>

              {/* Right Column: Room Selection & Negotiated Tariff & Payment Box */}
              <div>
                {/* Available Rooms Table with In-line Editable Tariff */}
                <div style={{ border: '2px solid #38bdf8', borderRadius: 4, padding: 8, marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6, color: '#0369a1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Available Vacant Rooms ({availableRooms.length}):</span>
                    <span style={{ fontSize: 11, color: canChangeTariff ? '#64748b' : '#dc2626', fontWeight: !canChangeTariff ? 700 : 400 }}>
                      {canChangeTariff ? 'Tariff is Negotiable' : '🔒 Published Tariff Enforced'}
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
                                        alert('Permission Denied: Only Super-Admin or General Manager can modify room tariff.');
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
                                    title={!canChangeTariff ? 'Room Tariff Locked' : 'Tariff is editable'}
                                  />
                                  {!canChangeTariff && (
                                    <span title="Tariff Locked" style={{ fontSize: 11, color: '#e11d48', cursor: 'help' }}>
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

                {/* Payment Detail Box with Split Payments & Auto Extra Guest Charge */}
                <div style={{ border: '2px solid #84cc16', borderRadius: 6, padding: 12, background: '#f8fafc' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#15803d', marginBottom: 8, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>
                    💳 Tariff &amp; Advance Deposit Receipt
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Per Night Base Tariff:</span>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>₹{customTariff.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Base Room Rent ({noOfDays} Night{noOfDays > 1 ? 's' : ''}):</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#15803d' }}>₹{baseRoomRentTotal.toFixed(2)}</span>
                  </div>

                  {/* Extra Guest Auto Charge Breakdown */}
                  {extraGuestsCount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, background: '#fef3c7', padding: '4px 8px', borderRadius: 4, border: '1px solid #fde68a' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e' }}>
                        Extra Bed ({extraGuestsCount} extra @ ₹{capacityRule.extraRate}/nt x {noOfDays} nt):
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#b45309' }}>
                        +₹{totalExtraGuestCharge.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Early Check-In Surcharge Breakdown */}
                  {earlyCheckInCharge > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, background: '#fefce8', padding: '4px 8px', borderRadius: 4, border: '1px solid #fef08a' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#854d0e' }}>
                        Early Check-In Surcharge ({earlyCheckInPolicy.toUpperCase()}):
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#b45309' }}>
                        +₹{earlyCheckInCharge.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '6px 8px', background: '#dcfce7', borderRadius: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#166534' }}>Total Stay Accommodation:</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#15803d' }}>₹{grandAccommodationTotal.toFixed(2)}</span>
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
                          style={{ width: 110, fontWeight: 600 }}
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI / QR</option>
                          <option value="Card">Card</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Online">Online</option>
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
                      <div style={{ display: 'flex', gap: 6 }}>
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
                        <button
                          type="button"
                          onClick={() => setShowDecentroAdvanceQr(true)}
                          style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: 3,
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                          title="Generate Decentro Dynamic UPI QR for advance deposit"
                        >
                          ⚡ Decentro UPI QR
                        </button>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#15803d' }}>
                        Advance Paid: ₹{totalAdvancePaid.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms">UTR / Ref No.</label>
                      <input
                        type="text"
                        placeholder="e.g. 4239849283 / UTR"
                        value={paymentReference}
                        onChange={e => setPaymentReference(e.target.value)}
                        className="form-input-pms"
                      />
                    </div>
                    <div className="form-group-pms" style={{ margin: 0 }}>
                      <label className="form-label-pms">Payment Remark</label>
                      <input
                        type="text"
                        placeholder="e.g. Google Pay / Cash"
                        value={paymentRemark}
                        onChange={e => setPaymentRemark(e.target.value)}
                        className="form-input-pms"
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 8, padding: '4px 8px', background: '#f1f5f9', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Balance Due at Checkout:</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#dc2626' }}>
                      ₹{Math.max(0, grandAccommodationTotal - totalAdvancePaid).toFixed(2)}
                    </span>
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
                disabled={isProcessing || (!isRoomClean && !supervisorOverride)}
                style={{
                  background: isProcessing || (!isRoomClean && !supervisorOverride) ? '#94a3b8' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '7px 24px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isProcessing || (!isRoomClean && !supervisorOverride) ? 'not-allowed' : 'pointer'
                }}
              >
                {isProcessing ? 'Saving Check-In...' : 'Save CheckIn'}
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

      {/* Decentro Dynamic UPI QR Modal for Advance Collection */}
      <DecentroUpiQrModal
        isOpen={showDecentroAdvanceQr}
        onClose={() => setShowDecentroAdvanceQr(false)}
        amount={totalAdvancePaid > 0 ? totalAdvancePaid : 1000}
        purpose={`Advance Deposit for Room ${selectedRoomNo || 'Check-In'}`}
        roomNo={selectedRoomNo}
        onPaymentSuccess={txn => {
          setPaymentSplits([
            {
              mode: 'UPI',
              amount: txn.amount,
              referenceNo: txn.bank_reference_number || txn.reference_id,
              remark: `Decentro Advance UPI Reconciled (${txn.payer_vpa || 'App'})`
            }
          ]);
          setPaymentReference(txn.bank_reference_number || txn.reference_id);
          setShowDecentroAdvanceQr(false);
        }}
      />
    </>
  );
};
