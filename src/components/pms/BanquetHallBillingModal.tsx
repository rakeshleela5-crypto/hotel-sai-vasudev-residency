import React, { useState, useEffect, useMemo } from 'react';
import type { 
  PmsBanquetVenue, 
  PmsBanquetBooking, 
  PmsBanquetKot
} from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';

interface BanquetHallBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVenueId?: string;
}

export const BanquetHallBillingModal: React.FC<BanquetHallBillingModalProps> = ({
  isOpen,
  onClose,
  preselectedVenueId
}) => {
  const [activeTab, setActiveTab] = useState<'venues' | 'booking' | 'catering' | 'checkout' | 'beo' | 'crm'>('venues');
  const [venues, setVenues] = useState<PmsBanquetVenue[]>([]);
  const [bookings, setBookings] = useState<PmsBanquetBooking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('bq-235');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'vacant' | 'booked' | 'occupied' | 'dirty'>('ALL');

  // Booking Form State
  const [formVenueId, setFormVenueId] = useState<string>('marriage-garden-1');
  const [formEventName, setFormEventName] = useState('Panday Parivar Wedding Reception');
  const [formEventType, setFormEventType] = useState<PmsBanquetBooking['eventType']>('Wedding / Reception');
  const [formHostName, setFormHostName] = useState('PANDAY PARIVAR');
  const [formContactPerson, setFormContactPerson] = useState('Shri Ramakant Panday');
  const [formMobile, setFormMobile] = useState('76763636645');
  const [formEmail, setFormEmail] = useState('panday.parivar@gmail.com');
  const [formState, setFormState] = useState('M.P');
  const [formEventDate, setFormEventDate] = useState('30-07-2025');
  const [formGuaranteedPax, setFormGuaranteedPax] = useState<number>(400);
  const [formVenueTariff, setFormVenueTariff] = useState<number>(50000);
  const [formAdvanceAmount, setFormAdvanceAmount] = useState<number>(15000);
  const [formAdvanceMode, setFormAdvanceMode] = useState<'Online' | 'Cash' | 'Bank Transfer'>('Online');
  const [formLinkedRooms, setFormLinkedRooms] = useState<string[]>(['301', '302']);
  const [formSeatingLayout, setFormSeatingLayout] = useState<PmsBanquetBooking['seatingLayout']>('Open Lawn Reception');

  // Catering KOT Form State
  const [kotPaxCount, setKotPaxCount] = useState<number>(50);
  const [kotPerPlateRate, setKotPerPlateRate] = useState<number>(475);

  // Settlement Form State
  const [settleOnlineAmt, setSettleOnlineAmt] = useState<number>(200000);
  const [settleBankAmt, setSettleBankAmt] = useState<number>(130000);
  const [settleCashAmt, setSettleCashAmt] = useState<number>(5000);
  const [settleOfficer, setSettleOfficer] = useState<string>('DEMO0004');

  // WhatsApp Alert State
  const [whatsAppSuccessMessage, setWhatsAppSuccessMessage] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadData();
      if (preselectedVenueId) {
        setFormVenueId(preselectedVenueId);
      }
    }
  }, [isOpen, preselectedVenueId]);

  const loadData = () => {
    const vList = PmsStore.getBanquetVenues();
    const bList = PmsStore.getBanquetBookings();
    setVenues(vList);
    setBookings(bList);
    if (bList.length > 0 && !bList.some(b => b.id === selectedBookingId)) {
      setSelectedBookingId(bList[0].id);
    }
  };

  const selectedBooking = useMemo(() => {
    return bookings.find(b => b.id === selectedBookingId) || bookings[0] || null;
  }, [bookings, selectedBookingId]);

  const filteredVenues = useMemo(() => {
    return venues.filter(v => {
      const matchSearch = v.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                          v.type.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          v.amenities.some(a => a.toLowerCase().includes(searchFilter.toLowerCase()));
      const matchStatus = statusFilter === 'ALL' || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [venues, searchFilter, statusFilter]);

  // Handle Create Booking
  const handleCreateBooking = () => {
    const selectedVenue = venues.find(v => v.id === formVenueId);
    const nextBookingNum = bookings.length + 89;
    const bookingNo = `RM/${nextBookingNum}/24-25`;
    const venueName = selectedVenue ? selectedVenue.name : 'MARRIAGE GARDEN1';
    const venueTariff = formVenueTariff || (selectedVenue ? selectedVenue.baseTariff : 50000);

    const newBooking: PmsBanquetBooking = {
      id: `bq-${Date.now()}`,
      bookingNo,
      eventName: formEventName,
      eventType: formEventType,
      hostName: formHostName.toUpperCase(),
      contactPerson: formContactPerson,
      contactMobile: formMobile,
      contactEmail: formEmail,
      state: formState,
      city: 'Haridwar / Jabalpur',
      venueId: formVenueId,
      venueName,
      venueTariff,
      venueGstPercent: 12,
      linkedRoomNos: formLinkedRooms,
      linkedRoomsTariff: 0,
      bookingDate: new Date().toISOString().split('T')[0].split('-').reverse().join('-'),
      eventDate: formEventDate,
      checkInDate: formEventDate,
      checkInTime: '06:26 AM',
      checkOutDate: formEventDate,
      checkOutTime: '06:26 AM',
      guaranteedPax: formGuaranteedPax,
      actualPaxServed: formGuaranteedPax,
      seatingLayout: formSeatingLayout,
      perPlateMenuName: 'Royal Shahi Banquet Feast',
      perPlateRate: 475,
      foodPaxCount: formGuaranteedPax,
      totalFoodAmount: formGuaranteedPax * 475,
      ancillaryServices: [
        { id: `anc-${Date.now()}-1`, serviceName: 'DJ CHARGE', rate: 10000, taxPercent: 12, amount: 10000 },
        { id: `anc-${Date.now()}-2`, serviceName: 'DECORATION CHARGE', rate: 15000, taxPercent: 12, amount: 15000 }
      ],
      kots: [
        {
          kotNo: `KOT/${Math.floor(400 + Math.random() * 50)}/24-25`,
          dateTime: `${formEventDate} 07:00 PM`,
          serviceType: 'Banquet',
          roomOrVenue: venueName,
          items: [
            { itemName: 'PER PLATE FOOD', qty: formGuaranteedPax, rate: 475, amount: formGuaranteedPax * 475, gstPercent: 12 },
            { itemName: 'DJ CHARGE', qty: 1, rate: 10000, amount: 10000, gstPercent: 12 },
            { itemName: 'DECORATION CHARGE', qty: 1, rate: 15000, amount: 15000, gstPercent: 12 }
          ],
          totalAmount: (formGuaranteedPax * 475) + 25000
        }
      ],
      financialSummary: {
        venueRent: venueTariff,
        venueGstAmount: (venueTariff * 12) / 100,
        foodAndServicesTaxable: (formGuaranteedPax * 475) + 25000,
        foodAndServicesGstAmount: (((formGuaranteedPax * 475) + 25000) * 12) / 100,
        foodAndServicesTotal: Math.round(((formGuaranteedPax * 475) + 25000) * 1.12),
        grossBillAmount: Math.round(venueTariff * 1.12 + ((formGuaranteedPax * 475) + 25000) * 1.12),
        advancePaid: formAdvanceAmount,
        midInstallmentsPaid: 0,
        netPayable: Math.round((venueTariff * 1.12 + ((formGuaranteedPax * 475) + 25000) * 1.12) - formAdvanceAmount),
        paidAtCheckout: 0,
        balanceRemaining: Math.round((venueTariff * 1.12 + ((formGuaranteedPax * 475) + 25000) * 1.12) - formAdvanceAmount),
        sacCode: '996311'
      },
      payments: [
        {
          id: `pmt-${Date.now()}`,
          date: new Date().toISOString().split('T')[0].split('-').reverse().join('-'),
          type: 'Booking Advance',
          mode: formAdvanceMode,
          amount: formAdvanceAmount,
          referenceNo: `ADV/${Date.now().toString().slice(-6)}`,
          remark: `Booking token received for ${venueName}`
        }
      ],
      billingMode: 'Consolidated (Settle To Room)',
      status: 'Booked',
      bankDetails: {
        bankName: 'STATE BANK OF INDIA',
        accountNo: '923020035404769',
        ifsc: 'SBIN000390',
        branch: 'MAIN BRANCH HARIDWAR'
      },
      beoNotes: {
        stageRequirements: 'Elevated wooden mandap platform with fresh flower backdrop',
        mandapNotes: 'Vedic mandap setup by 04:00 PM',
        buffetTimings: 'Dinner 07:30 PM - 12:00 Midnight',
        soundPermitNumber: 'ADM/PERMIT/2025/HARIDWAR',
        specialMenuRequests: 'Live Jalebi & Rabdi counter + Jain items clearly labeled'
      }
    };

    PmsStore.saveBanquetBooking(newBooking);
    loadData();
    setSelectedBookingId(newBooking.id);
    setActiveTab('beo');
  };

  // Handle Add Running Food Pax or Service KOT
  const handleAddRunningKot = () => {
    if (!selectedBooking) return;
    const nextKotNo = `KOT/${Math.floor(420 + Math.random() * 50)}/24-25`;
    const today = new Date().toISOString().split('T')[0].split('-').reverse().join('-');
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newKot: PmsBanquetKot = {
      kotNo: nextKotNo,
      dateTime: `${today} ${nowTime}`,
      serviceType: 'Banquet',
      roomOrVenue: selectedBooking.venueName,
      items: [
        {
          itemName: 'PER PLATE FOOD',
          qty: kotPaxCount,
          rate: kotPerPlateRate,
          amount: kotPaxCount * kotPerPlateRate,
          gstPercent: 12
        }
      ],
      totalAmount: kotPaxCount * kotPerPlateRate
    };

    PmsStore.addBanquetKot(selectedBooking.id, newKot);
    loadData();
  };

  // Handle Checkout Settlement
  const handleFinalCheckout = () => {
    if (!selectedBooking) return;
    const splitPayments = [
      { mode: 'Online', amount: settleOnlineAmt, referenceNo: 'RTGS/ONLINE/TRANSFER' },
      { mode: 'STATE BANK OF INDIA', amount: settleBankAmt, referenceNo: 'CHQ/BANK/TRANSFER' },
      { mode: 'Cash', amount: settleCashAmt, referenceNo: 'CASH/COUNTER' }
    ].filter(p => p.amount > 0);

    PmsStore.settleBanquetCheckout(selectedBooking.id, {
      payments: splitPayments,
      invoiceNo: `GSR/258/24-25`,
      billingOfficer: settleOfficer
    });

    loadData();
    setActiveTab('checkout');
  };

  // Sanitize venue back to ready
  const handleSanitizeVenue = (venueId: string) => {
    PmsStore.sanitizeBanquetVenue(venueId);
    loadData();
  };

  // WhatsApp Share Dispatcher
  const handleShareWhatsApp = (type: 'VOUCHER' | 'BEO' | 'INVOICE') => {
    if (!selectedBooking) return;
    const phone = selectedBooking.contactMobile;
    let text = '';
    if (type === 'INVOICE') {
      text = `*HOTEL SAI VASUDEV RESIDENCY - TAX INVOICE*\n` +
             `Namaste ${selectedBooking.hostName},\n` +
             `Invoice No: ${selectedBooking.invoiceNo || 'GSR/258/24-25'}\n` +
             `Event: ${selectedBooking.eventName}\n` +
             `Venue: ${selectedBooking.venueName} + Rooms: ${selectedBooking.linkedRoomNos.join(', ')}\n` +
             `Net Bill Amount: ₹${selectedBooking.financialSummary.grossBillAmount.toLocaleString('en-IN')}\n` +
             `Less Advance: ₹${selectedBooking.financialSummary.advancePaid.toLocaleString('en-IN')}\n` +
             `Net Paid: ₹${(selectedBooking.financialSummary.grossBillAmount - selectedBooking.financialSummary.advancePaid).toLocaleString('en-IN')}\n` +
             `Balance Remaining: ₹0.00 (Fully Settled)\n\n` +
             `Thank you for celebrating with us! Download Official GST PDF: https://hotel-sai-vasudev-residency.pages.dev/invoice/${selectedBooking.invoiceNo || '258'}`;
    } else if (type === 'BEO') {
      text = `*HOTEL SAI VASUDEV RESIDENCY - BANQUET EVENT ORDER (BEO)*\n` +
             `Host: ${selectedBooking.hostName}\n` +
             `Event: ${selectedBooking.eventName} on ${selectedBooking.eventDate}\n` +
             `Venue: ${selectedBooking.venueName} (Guaranteed Pax: ${selectedBooking.guaranteedPax})\n` +
             `Layout: ${selectedBooking.seatingLayout}\n` +
             `Stage & Decor: ${selectedBooking.beoNotes?.stageRequirements}\n` +
             `Buffet Timings: ${selectedBooking.beoNotes?.buffetTimings}\n\n` +
             `Our banquet coordinators are at your service!`;
    } else {
      text = `*HOTEL SAI VASUDEV RESIDENCY - BANQUET BOOKING VOUCHER*\n` +
             `Booking No: ${selectedBooking.bookingNo}\n` +
             `Host: ${selectedBooking.hostName}\n` +
             `Venue: ${selectedBooking.venueName} | Date: ${selectedBooking.eventDate}\n` +
             `Advance Received: ₹${selectedBooking.financialSummary.advancePaid.toLocaleString('en-IN')}\n` +
             `Thank you for trusting Hotel Sai Vasudev Residency.`;
    }

    const encoded = encodeURIComponent(text);
    const waUrl = `https://wa.me/91${phone}?text=${encoded}`;
    window.open(waUrl, '_blank');
    setWhatsAppSuccessMessage(`WhatsApp notification successfully sent to ${selectedBooking.hostName} (+91 ${phone})!`);
    setTimeout(() => setWhatsAppSuccessMessage(null), 5000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-7xl rounded-xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden text-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 px-6 py-4 border-b border-emerald-700/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-emerald-600/30 border border-emerald-400/50 flex items-center justify-center text-emerald-300 text-2xl shadow-inner">
              🏰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-wide text-white">
                  Banquet Hall Billing & Event Invoice Master
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Verified Enterprise Standard
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Marriage Garden, Banquet Hall, Party Lawn, Catering Per-Plate, Multi-Room Linking & GST Tax Invoice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Property: <strong className="text-white">HALL OF KNOTS / SAI VASUDEV</strong>
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors text-xl font-bold"
              title="Close Modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* WhatsApp Notification Toast */}
        {whatsAppSuccessMessage && (
          <div className="bg-emerald-900/90 border-b border-emerald-500 px-4 py-2 text-xs text-emerald-200 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <span>{whatsAppSuccessMessage}</span>
            </div>
            <button onClick={() => setWhatsAppSuccessMessage(null)} className="text-emerald-300 hover:text-white font-bold">✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-slate-800/95 border-b border-slate-700 px-6 flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setActiveTab('venues')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'venues'
                ? 'bg-slate-900 text-emerald-400 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent'
            }`}
          >
            <span>🏰</span> Venues & Availability Grid
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 text-[10px]">{venues.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('booking')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'booking'
                ? 'bg-slate-900 text-emerald-400 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent'
            }`}
          >
            <span>📋</span> New Event Booking & Multi-Room Allocation
          </button>

          <button
            onClick={() => setActiveTab('catering')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'catering'
                ? 'bg-slate-900 text-emerald-400 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent'
            }`}
          >
            <span>🍽️</span> Catering & Running KOT Manager
          </button>

          <button
            onClick={() => setActiveTab('checkout')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'checkout'
                ? 'bg-slate-900 text-emerald-400 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent'
            }`}
          >
            <span>🧾</span> Grand Banquet Tax Invoice
          </button>

          <button
            onClick={() => setActiveTab('beo')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'beo'
                ? 'bg-slate-900 text-emerald-400 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent'
            }`}
          >
            <span>📜</span> Banquet Event Order (BEO)
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'crm'
                ? 'bg-slate-900 text-emerald-400 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent'
            }`}
          >
            <span>📱</span> WhatsApp & Anniversary CRM
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950/60">
          
          {/* TAB 1: VENUES & AVAILABILITY GRID */}
          {activeTab === 'venues' && (
            <div className="space-y-6">
              {/* Filter and Stats Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow">
                  <div className="text-xs text-slate-400 font-medium">Total Banquet Capacity</div>
                  <div className="text-2xl font-bold text-white mt-1">2,270 Pax</div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">5 Dedicated Event Spaces</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow">
                  <div className="text-xs text-slate-400 font-medium">Active & Upcoming Events</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">{bookings.length} Bookings</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">₹4,98,740 Cumulative Value</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow">
                  <div className="text-xs text-slate-400 font-medium">Featured Showcase Booking</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">PANDAY PARIVAR</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">MARRIAGE GARDEN1 + Rooms 301, 302</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow">
                  <div className="text-xs text-slate-400 font-medium">Post-Event Sanitization</div>
                  <div className="text-2xl font-bold text-rose-400 mt-1">
                    {venues.filter(v => v.status === 'dirty').length} Venue Dirty
                  </div>
                  <div className="text-[11px] text-rose-300/80 mt-0.5">Auto-Housekeeping Schedule</div>
                </div>
              </div>

              {/* Venue Search & Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <span className="text-slate-400 text-sm">🔍</span>
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    placeholder="Search venue by name, layout, or amenities..."
                    className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 w-full focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Status Filter:</span>
                  {(['ALL', 'vacant', 'booked', 'occupied', 'dirty'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                        statusFilter === st
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Venues Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVenues.map(venue => {
                  const statusColors: Record<string, string> = {
                    vacant: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
                    booked: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
                    occupied: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
                    dirty: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
                    blocked: 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                  };

                  return (
                    <div
                      key={venue.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all flex flex-col group shadow-lg"
                    >
                      <div className="relative h-44 overflow-hidden bg-slate-950">
                        <img
                          src={venue.images[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80'}
                          alt={venue.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                        <div className="absolute top-3 left-3">
                          <span className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-md border tracking-wider ${statusColors[venue.status]}`}>
                            {venue.status}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-md text-xs font-bold text-white border border-slate-700">
                          ₹{venue.baseTariff.toLocaleString('en-IN')}/day
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                          <div>
                            <span className="text-[11px] text-emerald-400 font-semibold">{venue.type}</span>
                            <h3 className="text-base font-bold text-white leading-tight">{venue.name}</h3>
                          </div>
                          <span className="text-[11px] text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                            {venue.capacityPaxMin}-{venue.capacityPaxMax} Pax
                          </span>
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
                            <span>Area: <strong className="text-slate-200">{venue.sqFtArea.toLocaleString('en-IN')} sq ft</strong></span>
                            <span>GST SAC: <strong className="text-slate-200">{venue.sacCode} (12%)</strong></span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Key Facilities:</span>
                            <ul className="text-xs text-slate-300 space-y-1">
                              {venue.amenities.slice(0, 3).map((a, i) => (
                                <li key={i} className="flex items-center gap-1.5 truncate">
                                  <span className="text-emerald-400">✓</span> {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                          {venue.status === 'dirty' ? (
                            <button
                              onClick={() => handleSanitizeVenue(venue.id)}
                              className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow"
                            >
                              <span>🧹</span> Mark Sanitized / Ready
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setFormVenueId(venue.id);
                                setFormVenueTariff(venue.baseTariff);
                                setActiveTab('booking');
                              }}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow"
                            >
                              <span>📋</span> Book This Venue
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: NEW EVENT BOOKING & MULTI-ROOM ALLOCATION */}
          {activeTab === 'booking' && (
            <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>📋</span> New Banquet & Marriage Garden Booking Entery
                  </h3>
                  <p className="text-xs text-slate-400">
                    Banquet & Event Management with Multi-Room Group Linkage
                  </p>
                </div>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-600 px-3 py-1 rounded text-xs font-mono font-bold">
                  URL: /roombookings/create
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Event / Function Name *
                  </label>
                  <input
                    type="text"
                    value={formEventName}
                    onChange={e => setFormEventName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Panday Parivar Wedding Reception"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Event Type *
                  </label>
                  <select
                    value={formEventType}
                    onChange={e => setFormEventType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Wedding / Reception">Wedding / Reception (विवाह समारोह)</option>
                    <option value="Sangeet / Mehendi">Sangeet / Mehendi (संगीत संध्या)</option>
                    <option value="Birthday Party">Birthday Party (जन्मदिन)</option>
                    <option value="Corporate Seminar">Corporate Seminar / Conference</option>
                    <option value="Anniversary">Anniversary Celebration</option>
                    <option value="Kitty Party">Kitty Party / Family Gathering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Host / Family Name (for Invoice Header) *
                  </label>
                  <input
                    type="text"
                    value={formHostName}
                    onChange={e => setFormHostName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. PANDAY PARIVAR"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={formContactPerson}
                    onChange={e => setFormContactPerson(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Shri Ramakant Panday"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="text"
                    value={formMobile}
                    onChange={e => setFormMobile(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 76763636645"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    State / Jurisdiction
                  </label>
                  <input
                    type="text"
                    value={formState}
                    onChange={e => setFormState(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. M.P / U.P / Maharashtra"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Host Email Address
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. panday.parivar@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Event / Function Date (DD-MM-YYYY)
                  </label>
                  <input
                    type="text"
                    value={formEventDate}
                    onChange={e => setFormEventDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="30-07-2025"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Banquet Venue Selection *
                  </label>
                  <select
                    value={formVenueId}
                    onChange={e => {
                      setFormVenueId(e.target.value);
                      const fv = venues.find(v => v.id === e.target.value);
                      if (fv) setFormVenueTariff(fv.baseTariff);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {venues.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.type}) — Base ₹{v.baseTariff.toLocaleString('en-IN')} [{v.status}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Venue Tariff (₹)
                  </label>
                  <input
                    type="number"
                    value={formVenueTariff}
                    onChange={e => setFormVenueTariff(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Expected / Guaranteed Guest Pax *
                  </label>
                  <input
                    type="number"
                    value={formGuaranteedPax}
                    onChange={e => setFormGuaranteedPax(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Seating Layout Configuration
                  </label>
                  <select
                    value={formSeatingLayout}
                    onChange={e => setFormSeatingLayout(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Open Lawn Reception">Open Lawn Reception (मुक्त लॉन रिसेप्शन)</option>
                    <option value="Round Table / Cluster">Round Table / Cluster (गोल मेज क्लस्टर)</option>
                    <option value="Theatre Style">Theatre Style (ऑडिटोरियम शैली)</option>
                    <option value="Classroom">Classroom / Training Style</option>
                    <option value="U-Shape">Executive U-Shape Boardroom</option>
                  </select>
                </div>
              </div>

              {/* Multi-Room Group Allocation (Frame 0280 & Audio 09:00) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🏨</span> Multi-Room Group Linkage
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Complimentary / Bridal Family Rooms billed at ₹0
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['301', '302', '101', '102', '103', '201'].map(rNo => {
                    const isSelected = formLinkedRooms.includes(rNo);
                    return (
                      <label
                        key={rNo}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormLinkedRooms([...formLinkedRooms, rNo]);
                            } else {
                              setFormLinkedRooms(formLinkedRooms.filter(x => x !== rNo));
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-0"
                        />
                        <span>Room {rNo} {rNo === '301' ? '(Suite)' : rNo === '302' ? '(Deluxe)' : ''}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Advance Booking Payment Detail (Frame 0300) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Booking Advance Token (₹) *
                  </label>
                  <input
                    type="number"
                    value={formAdvanceAmount}
                    onChange={e => setFormAdvanceAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none"
                    placeholder="15000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Advance Payment Mode
                  </label>
                  <select
                    value={formAdvanceMode}
                    onChange={e => setFormAdvanceMode(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Online">Online (UPI / QR / Netbanking)</option>
                    <option value="Cash">Cash at Reception</option>
                    <option value="Bank Transfer">State Bank of India Transfer</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleCreateBooking}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>💾</span> Save & Generate Booking Voucher
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CATERING & RUNNING KOT MANAGER */}
          {activeTab === 'catering' && selectedBooking && (
            <div className="space-y-6">
              {/* Event Selector Card */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">Active Event Session</span>
                  <h3 className="text-lg font-bold text-white">
                    {selectedBooking.eventName} ({selectedBooking.bookingNo})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Host: <strong className="text-slate-200">{selectedBooking.hostName}</strong> • Venue: <strong className="text-slate-200">{selectedBooking.venueName}</strong> • Linked Rooms: <strong className="text-slate-200">{selectedBooking.linkedRoomNos.join(', ')}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedBookingId}
                    onChange={e => setSelectedBookingId(e.target.value)}
                    className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white"
                  >
                    {bookings.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.hostName} — {b.venueName} ({b.bookingNo})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setActiveTab('checkout')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <span>🧾</span> View Final Tax Invoice
                  </button>
                </div>
              </div>

              {/* Running KOT Section (Frames 0480 & 0550) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Add Running KOT Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>➕</span> Add Running KOT / Additional Food Pax
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Live Catering Adjustment: Host requested +50 extra food plates mid-party!
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Additional Pax Count (प्लेटों की संख्या)
                      </label>
                      <input
                        type="number"
                        value={kotPaxCount}
                        onChange={e => setKotPaxCount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        placeholder="50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Per Plate Rate (₹)
                      </label>
                      <input
                        type="number"
                        value={kotPerPlateRate}
                        onChange={e => setKotPerPlateRate(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        placeholder="475"
                      />
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Additional Taxable Amount:</span>
                        <span className="font-bold text-white">₹{(kotPaxCount * kotPerPlateRate).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>GST @ 12%:</span>
                        <span className="font-bold text-white">₹{Math.round((kotPaxCount * kotPerPlateRate) * 0.12).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
                        <span>Net KOT Value:</span>
                        <span>₹{Math.round((kotPaxCount * kotPerPlateRate) * 1.12).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleAddRunningKot}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                    >
                      <span>🔥</span> Dispatch Running KOT to Kitchen
                    </button>
                  </div>
                </div>

                {/* Right: KOT History & Food Bill (Frame 0550) */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>📜</span> Cumulative Banquet KOTs & Food Bill
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Bill No: <strong className="text-slate-200">SHRI/290/24-25</strong> • Settle Mode: <strong className="text-emerald-400">Settle To Room</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => handleShareWhatsApp('BEO')}
                      className="px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <span>💬</span> Share BEO via WhatsApp
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                          <th className="py-2.5 px-3">S.No</th>
                          <th className="py-2.5 px-3">Item / Service Name</th>
                          <th className="py-2.5 px-3 text-right">Qty</th>
                          <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                          <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                          <th className="py-2.5 px-3 text-right">GST %</th>
                          <th className="py-2.5 px-3 text-right">Net Value (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        <tr>
                          <td className="py-2 px-3">1</td>
                          <td className="py-2 px-3 font-sans text-white font-semibold">PER PLATE FOOD (Wedding Shahi Buffet)</td>
                          <td className="py-2 px-3 text-right">{selectedBooking.foodPaxCount}.00</td>
                          <td className="py-2 px-3 text-right">{selectedBooking.perPlateRate}.00</td>
                          <td className="py-2 px-3 text-right">{selectedBooking.totalFoodAmount.toLocaleString('en-IN')}.00</td>
                          <td className="py-2 px-3 text-right">12.00%</td>
                          <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                            {(selectedBooking.totalFoodAmount * 1.12).toLocaleString('en-IN')}.00
                          </td>
                        </tr>
                        {selectedBooking.ancillaryServices.map((svc, i) => (
                          <tr key={svc.id}>
                            <td className="py-2 px-3">{i + 2}</td>
                            <td className="py-2 px-3 font-sans text-white font-semibold">{svc.serviceName}</td>
                            <td className="py-2 px-3 text-right">1.00</td>
                            <td className="py-2 px-3 text-right">{svc.rate.toLocaleString('en-IN')}.00</td>
                            <td className="py-2 px-3 text-right">{svc.amount.toLocaleString('en-IN')}.00</td>
                            <td className="py-2 px-3 text-right">{svc.taxPercent}.00%</td>
                            <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                              {(svc.amount * (1 + svc.taxPercent / 100)).toLocaleString('en-IN')}.00
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-950 font-bold text-white border-t border-slate-700">
                          <td colSpan={2} className="py-2.5 px-3 text-slate-300">Total F&B & Services</td>
                          <td className="py-2.5 px-3 text-right font-mono">{selectedBooking.foodPaxCount + selectedBooking.ancillaryServices.length}</td>
                          <td className="py-2.5 px-3"></td>
                          <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                            ₹{selectedBooking.financialSummary.foodAndServicesTaxable.toLocaleString('en-IN')}.00
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">₹{selectedBooking.financialSummary.foodAndServicesGstAmount.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-400 text-sm">
                            ₹{selectedBooking.financialSummary.foodAndServicesTotal.toLocaleString('en-IN')}.00
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Consolidated Food Bill Amount:</span>
                      <div className="text-xl font-bold text-emerald-400">
                        ₹{selectedBooking.financialSummary.foodAndServicesTotal.toLocaleString('en-IN')}.00
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab('checkout')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition-colors flex items-center gap-1.5"
                      >
                        <span>✓</span> Proceed to Checkout & Tax Invoice
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CHECKOUT & GRAND TAX INVOICE GENERATOR (FRAME 0700 CLONE) */}
          {activeTab === 'checkout' && selectedBooking && (
            <div className="space-y-6">
              {/* Settlement Control Bar */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-xl font-bold">
                    ₹
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Invoice Settlement Status: <span className="text-emerald-400">{selectedBooking.status}</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Invoice No: <strong className="text-slate-200">{selectedBooking.invoiceNo || 'GSR/258/24-25'}</strong> • Officer: <strong className="text-slate-200">{selectedBooking.billingOfficer || 'DEMO0004'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <span>🖨️</span> Print Invoice
                  </button>
                  <button
                    onClick={() => handleShareWhatsApp('INVOICE')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow"
                  >
                    <span>💬</span> Send Invoice via WhatsApp
                  </button>
                </div>
              </div>

              {/* Video 35 Frame 0650: Multi-Mode Settlement Form (/show_checkin/235) */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 max-w-4xl mx-auto">
                <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>💳</span> Payment Settlement Detail (/show_checkin/235)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Multi-Mode payment split: Online (₹2,00,000) + State Bank of India (₹1,30,000) + Cash (₹5,000) = ₹3,35,000
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded">
                    Net Payable: ₹{selectedBooking.financialSummary.netPayable.toLocaleString('en-IN')}.00
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Online / UPI Transfer (₹)</label>
                    <input
                      type="number"
                      value={settleOnlineAmt}
                      onChange={e => setSettleOnlineAmt(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">State Bank of India (₹)</label>
                    <input
                      type="number"
                      value={settleBankAmt}
                      onChange={e => setSettleBankAmt(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Cash at Counter (₹)</label>
                    <input
                      type="number"
                      value={settleCashAmt}
                      onChange={e => setSettleCashAmt(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Billing Officer</label>
                    <input
                      type="text"
                      value={settleOfficer}
                      onChange={e => setSettleOfficer(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-400">Total Tendered: <strong className="text-white">₹{(settleOnlineAmt + settleBankAmt + settleCashAmt).toLocaleString('en-IN')}.00</strong></span>
                    <span className="text-slate-400">Balance: <strong className="text-emerald-400">₹{Math.max(0, selectedBooking.financialSummary.netPayable - (settleOnlineAmt + settleBankAmt + settleCashAmt)).toLocaleString('en-IN')}.00</strong></span>
                  </div>
                  <button
                    onClick={handleFinalCheckout}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg shadow-lg transition-all flex items-center gap-2"
                  >
                    <span>💾</span> Save &amp; Settle To Room
                  </button>
                </div>
              </div>

              {/* MICROSCOPIC CLONE OF FRAME 0700 INVOICE */}
              <div className="bg-white text-slate-900 rounded-lg shadow-2xl overflow-hidden border border-slate-300 max-w-4xl mx-auto print:m-0 print:border-none print:shadow-none">
                
                {/* Yellow Top Banner (Exact Frame 0700 header) */}
                <div className="bg-[#FFFF00] text-black px-4 py-1.5 text-center text-xs font-semibold border-b border-black/20">
                  Phone Mobile 9466219198 website https://mmazz-hotel-hotels-in-etawah-hotels-in-etawah.business.site/
                </div>

                {/* Dual Column Header */}
                <div className="p-4 grid grid-cols-2 gap-4 text-xs border-b border-black/30 font-sans">
                  <div className="space-y-1">
                    <div className="flex"><span className="w-28 font-semibold">Invoice No</span><span>: {selectedBooking.invoiceNo || 'GSR/258/24-25'}</span></div>
                    <div className="flex"><span className="w-28 font-semibold">Room No</span><span>: <strong className="bg-blue-100 text-blue-900 px-1 rounded">{selectedBooking.linkedRoomNos.join(',')},{selectedBooking.venueName}</strong></span></div>
                    <div className="flex"><span className="w-28 font-semibold">Guest Name</span><span>: <strong className="text-black">{selectedBooking.hostName}</strong></span></div>
                    <div className="flex"><span className="w-28 font-semibold">Company</span><span>: 0</span></div>
                    <div className="flex"><span className="w-28 font-semibold">Address</span><span>: {selectedBooking.addressLine1 || 'Civil Lines'}</span></div>
                    <div className="flex"><span className="w-28 font-semibold">City</span><span>: {selectedBooking.city || 'Etawah'}</span></div>
                    <div className="flex"><span className="w-28 font-semibold">State</span><span>: {selectedBooking.state || 'M.P'}</span></div>
                    <div className="flex"><span className="w-28 font-semibold">Mobile</span><span>: {selectedBooking.contactMobile}</span></div>
                    <div className="flex"><span className="w-28 font-semibold">Email</span><span>: {selectedBooking.contactEmail || ''}</span></div>
                    <div className="flex"><span className="w-28 font-semibold">Party'S GSTIN</span><span>: </span></div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex"><span className="w-32 font-semibold">Invoice Date</span><span>: {selectedBooking.eventDate}</span></div>
                    <div className="flex"><span className="w-32 font-semibold">Arrival Date</span><span>: {selectedBooking.checkInDate}</span></div>
                    <div className="flex"><span className="w-32 font-semibold">Arrival Time</span><span>: {selectedBooking.checkInTime}</span></div>
                    <div className="flex"><span className="w-32 font-semibold">Departure Date</span><span>: {selectedBooking.checkOutDate}</span></div>
                    <div className="flex"><span className="w-32 font-semibold">Departure Time</span><span>: {selectedBooking.checkOutTime}</span></div>
                    <div className="flex"><span className="w-32 font-semibold">Billing Officer</span><span>: {selectedBooking.billingOfficer || 'DEMO0004'}</span></div>
                  </div>
                </div>

                {/* Items Table (Frame 0700) */}
                <div className="p-4 space-y-4">
                  <table className="w-full text-xs border border-black/40 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black/40 font-bold text-slate-800">
                        <th className="p-2 border-r border-black/40 text-center w-12">S.No</th>
                        <th className="p-2 border-r border-black/40 text-left">Particulars</th>
                        <th className="p-2 border-r border-black/40 text-center w-20">Days</th>
                        <th className="p-2 border-r border-black/40 text-right w-32">Rate</th>
                        <th className="p-2 border-r border-black/40 text-right w-24">GST</th>
                        <th className="p-2 text-right w-32">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/20">
                      <tr>
                        <td className="p-2 text-center border-r border-black/40">1</td>
                        <td className="p-2 border-r border-black/40 font-semibold">SUITE ROOM / {selectedBooking.venueName}</td>
                        <td className="p-2 text-center border-r border-black/40">1</td>
                        <td className="p-2 text-right border-r border-black/40 font-mono">{selectedBooking.venueTariff.toFixed(2)}</td>
                        <td className="p-2 text-right border-r border-black/40 font-mono">12.00%</td>
                        <td className="p-2 text-right font-mono font-bold">{selectedBooking.venueTariff.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Calculations & Subtotals (Exact Frame 0700 values) */}
                  <div className="flex justify-end font-mono text-xs">
                    <div className="w-72 space-y-1.5 border-t border-black/30 pt-2">
                      <div className="flex justify-between">
                        <span className="font-sans">SGST (6%)</span>
                        <span>{selectedBooking.financialSummary.venueGstAmount ? (selectedBooking.financialSummary.venueGstAmount / 2).toFixed(2) : '3000.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-sans">CGST (6%)</span>
                        <span>{selectedBooking.financialSummary.venueGstAmount ? (selectedBooking.financialSummary.venueGstAmount / 2).toFixed(2) : '3000.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-sans">IGST</span>
                        <span>0.00</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 border-t border-slate-300 pt-1">
                        <span className="font-sans">Food Amount (Catering & DJ)</span>
                        <span>{selectedBooking.financialSummary.foodAndServicesTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="font-sans">Add Other Charge</span>
                        <span>0.00</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="font-sans">Less Discount</span>
                        <span>0.00</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 border-t border-slate-400 pt-1 text-sm">
                        <span className="font-sans">Net Bill Amount</span>
                        <span>{selectedBooking.financialSummary.grossBillAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-rose-700 font-bold">
                        <span className="font-sans">Less Advance</span>
                        <span>-{selectedBooking.financialSummary.advancePaid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-emerald-800 border-t-2 border-black pt-1 text-base">
                        <span className="font-sans">Net Payable Amount</span>
                        <span>{selectedBooking.financialSummary.netPayable.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Statutory GST SAC Table (Frame 0700) */}
                  <div className="border border-black/40 pt-1">
                    <table className="w-full text-xs text-center border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-black/40 font-bold">
                          <th className="p-1 border-r border-black/40">SAC Code</th>
                          <th className="p-1 border-r border-black/40">Taxable Amount</th>
                          <th className="p-1 border-r border-black/40">GST%</th>
                          <th className="p-1 border-r border-black/40">SGST</th>
                          <th className="p-1 border-r border-black/40">CGST</th>
                          <th className="p-1 border-r border-black/40">IGST</th>
                          <th className="p-1">Total Tax</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        <tr>
                          <td className="p-1 border-r border-black/40">996311</td>
                          <td className="p-1 border-r border-black/40">{selectedBooking.venueTariff.toFixed(2)}</td>
                          <td className="p-1 border-r border-black/40">12.00</td>
                          <td className="p-1 border-r border-black/40">3000.00</td>
                          <td className="p-1 border-r border-black/40">3000.00</td>
                          <td className="p-1 border-r border-black/40">0.00</td>
                          <td className="p-1 font-bold">6000.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Bank Details (Exact Frame 0700 banner) */}
                  <div className="bg-slate-100 p-2.5 rounded border border-black/20 text-center text-xs font-semibold">
                    Bank Name: <strong className="text-blue-900">STATE BANK OF INDIA</strong> &nbsp;|&nbsp; 
                    Bank A/C No: <strong className="font-mono">923020035404769</strong> &nbsp;|&nbsp; 
                    Bank IFSC: <strong className="font-mono">SBIN000390</strong> &nbsp;|&nbsp; 
                    Bank Branch: <strong className="text-black">MAIN BRANCH HARIDWAR</strong>
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-between items-end pt-8 text-xs font-semibold px-4 pb-2">
                    <div>Guest Signature / Acceptance</div>
                    <div>For {selectedBooking.venueName} / Authorized Signatory</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BANQUET EVENT ORDER (BEO) */}
          {activeTab === 'beo' && selectedBooking && (
            <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>📜</span> Banquet Event Order (BEO) & Operations Sheet
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comprehensive coordination protocol for Kitchen, Housekeeping, AV/DJ, and Security
                  </p>
                </div>
                <button
                  onClick={() => handleShareWhatsApp('BEO')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span>💬</span> Share BEO with Banquet Manager
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider">Event Overview</span>
                  <div className="space-y-1 text-slate-300">
                    <p>Booking No: <strong className="text-white">{selectedBooking.bookingNo}</strong></p>
                    <p>Host: <strong className="text-white">{selectedBooking.hostName}</strong> ({selectedBooking.contactPerson})</p>
                    <p>Contact: <strong className="text-white">{selectedBooking.contactMobile}</strong></p>
                    <p>Venue: <strong className="text-emerald-400">{selectedBooking.venueName}</strong></p>
                    <p>Linked Suites: <strong className="text-white">{selectedBooking.linkedRoomNos.join(', ')}</strong></p>
                    <p>Guaranteed Pax: <strong className="text-white">{selectedBooking.guaranteedPax} Pax</strong></p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-amber-400 uppercase tracking-wider">Timetable & Schedule</span>
                  <div className="space-y-1 text-slate-300">
                    <p>Mandap Setup Ready: <strong className="text-white">04:00 PM</strong></p>
                    <p>Sound & DJ Soundcheck: <strong className="text-white">05:30 PM</strong></p>
                    <p>Guest Welcome & Drinks: <strong className="text-white">06:30 PM</strong></p>
                    <p>Baraat & Varmala: <strong className="text-white">08:00 PM</strong></p>
                    <p>Main Buffet Service: <strong className="text-white">08:30 PM – 12:30 AM</strong></p>
                    <p>Sound Cutoff Deadline: <strong className="text-rose-400">11:30 PM (SDM Permit)</strong></p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <span className="font-bold text-slate-200 uppercase tracking-wider">Special Operational Notes & Dietary Instructions</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
                  <div>
                    <h5 className="font-semibold text-emerald-400 mb-1">Mandap & Stage Decor:</h5>
                    <p className="text-slate-400 leading-relaxed">
                      {selectedBooking.beoNotes?.stageRequirements || '40x25 ft elevated stage with floral backdrop in pastel peach & marigold.'}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-emerald-400 mb-1">Catering & Live Stalls:</h5>
                    <p className="text-slate-400 leading-relaxed">
                      {selectedBooking.beoNotes?.specialMenuRequests || 'Jain counter with satvik paneer, pure ghee sweets, live jalebi counter.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: WHATSAPP & ANNIVERSARY CRM */}
          {activeTab === 'crm' && (
            <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📱</span> WhatsApp Marketing & Anniversary CRM (Audio 23:30)
                </h3>
                <p className="text-xs text-slate-400">
                  Automated Guest Notification: Dispatch instant confirmation, BEOs, and schedule anniversary greetings to repeat clients
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>💬</span> Instant Dispatch Templates
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleShareWhatsApp('VOUCHER')}
                      className="w-full text-left p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs transition-colors"
                    >
                      <div className="font-bold text-white">1. Advance Booking Confirmation</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">Sends token receipt and booked dates to host.</div>
                    </button>
                    <button
                      onClick={() => handleShareWhatsApp('BEO')}
                      className="w-full text-left p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs transition-colors"
                    >
                      <div className="font-bold text-white">2. Banquet Event Order (BEO) Schedule</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">Sends layout, timetable and catering plan.</div>
                    </button>
                    <button
                      onClick={() => handleShareWhatsApp('INVOICE')}
                      className="w-full text-left p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs transition-colors"
                    >
                      <div className="font-bold text-white">3. Final Tax Invoice</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">Sends PDF link with SAC 996311 GST summary.</div>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                    <span>🎉</span> Upcoming Anniversary & Reunion Reminders
                  </h4>
                  <div className="space-y-2 text-xs">
                    {bookings.map(b => (
                      <div key={b.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                        <div>
                          <strong className="text-white block">{b.hostName}</strong>
                          <span className="text-[11px] text-slate-400">{b.eventName} • {b.eventDate}</span>
                        </div>
                        <button
                          onClick={() => {
                            const msg = encodeURIComponent(`Warm greetings from Hotel Sai Vasudev Residency! Wishing ${b.hostName} a very happy upcoming wedding anniversary! We would be delighted to host your celebration again with special privileges.`);
                            window.open(`https://wa.me/91${b.contactMobile}?text=${msg}`, '_blank');
                          }}
                          className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-300 rounded text-[11px] font-bold"
                        >
                          Send Greeting
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 border-t border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Hotel Sai Vasudev Residency Banquet Billing Suite</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
