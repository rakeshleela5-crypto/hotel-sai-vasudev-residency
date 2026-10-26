import React, { useState, useEffect } from 'react';
import type { PmsRoom, PmsCheckOutDetail, PaymentSplit, PmsFoodBill, DayWiseRentItem, BillFormatType } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import { HotelBillFormatModal } from './HotelBillFormatModal';
import { DecentroUpiQrModal } from './DecentroUpiQrModal';
import { DecentroVirtualAccountModal } from './DecentroVirtualAccountModal';
import { decentroApi } from '../../services/decentroApi';

interface RoomCheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRoom: PmsRoom | null;
  onCheckoutComplete: (checkout: PmsCheckOutDetail) => void;
}

export const RoomCheckOutModal: React.FC<RoomCheckOutModalProps> = ({
  isOpen,
  onClose,
  targetRoom,
  onCheckoutComplete
}) => {
  if (!isOpen || !targetRoom) return null;

  const existingCheckouts = PmsStore.getCheckouts();
  const nextSeq = String(1040 + existingCheckouts.length + 1).padStart(4, '0');
  const defaultInvoiceNo = `SVR/2026-27/INV-${nextSeq}`;
  const guest = targetRoom.currentGuest;
  const businessSettings = PmsStore.getBusinessSettings();
  const companyInfo = PmsStore.getCompanyInfo();

  // Basic Stay Details
  const normalizeDateDDMMYYYY = (dStr?: string) => {
    if (!dStr) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      return `${dd}-${mm}-${today.getFullYear()}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
      const [y, m, d] = dStr.split('-');
      return `${d}-${m}-${y}`;
    }
    return dStr;
  };

  const [checkInDate, setCheckInDate] = useState(() => normalizeDateDDMMYYYY(guest?.checkInDate || '19-10-2026'));
  const [checkInTime, setCheckInTime] = useState(guest?.checkInTime || '12:25 AM');
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  });

  useEffect(() => {
    if (guest?.checkInDate) {
      setCheckInDate(normalizeDateDDMMYYYY(guest.checkInDate));
    }
  }, [guest?.checkInDate]);
  const [checkOutTime, setCheckOutTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  });
  const [calculationType, setCalculationType] = useState<'24hour' | '12hour'>(
    guest?.calculationType || businessSettings.calculationType || '12hour'
  );
  const [noOfDays, setNoOfDays] = useState(1);
  const [perDayTariff, setPerDayTariff] = useState(targetRoom.tariff || 1800);
  const [dayWiseRent, setDayWiseRent] = useState<DayWiseRentItem[]>([]);
  const [invoiceFormat, setInvoiceFormat] = useState<'A4_Standard' | 'A5_HalfPage' | 'Detailed'>('A4_Standard');
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [isFullBillFormatOpen, setIsFullBillFormatOpen] = useState(false);
  const [fullBillFormat, setFullBillFormat] = useState<BillFormatType>('Format_3_A4_Standard');

  // Guest KYC & Police C-Form data
  const [guestName, setGuestName] = useState(guest?.name || 'Alok Jain');
  const [guestPhone, setGuestPhone] = useState(guest?.phone || '9822100042');
  const [guestIdType] = useState((guest as any)?.idType || 'Aadhaar Card');
  const [guestIdNumber] = useState((guest as any)?.idNumber || 'XXXX-XXXX-4589');
  const [comingFrom] = useState((guest as any)?.comingFrom || 'Mumbai');
  const [proceedingTo] = useState((guest as any)?.proceedingTo || 'Pune');
  const [purpose] = useState((guest as any)?.purpose || 'Temple Darshan');
  const [companyName, setCompanyName] = useState((guest as any)?.companyName || '');
  const [companyAddress, setCompanyAddress] = useState('Main Road, Shirdi');
  const [gstNumber, setGstNumber] = useState((guest as any)?.gstNumber || (guest as any)?.gstin || '');
  const [checkoutRemark, setCheckoutRemark] = useState('Checked out peacefully. Key returned.');
  
  // Decentro Banking & KYC State
  const [showDecentroQrModal, setShowDecentroQrModal] = useState<boolean>(false);
  const [showDecentroVaModal, setShowDecentroVaModal] = useState<boolean>(false);
  const [isVerifyingGstin, setIsVerifyingGstin] = useState<boolean>(false);
  const [gstinVerifiedBadge, setGstinVerifiedBadge] = useState<string | null>(null);

  const handleVerifyGstin = async () => {
    if (!gstNumber || gstNumber.trim().length !== 15) {
      alert('Please enter a valid 15-character GSTIN (e.g. 21AEKPP8689J1ZS or 21AAACJ...)');
      return;
    }
    setIsVerifyingGstin(true);
    try {
      const res = await decentroApi.verifyGstin(gstNumber);
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
      alert(err.message || 'Error verifying GSTIN via Decentro Public Registry');
    } finally {
      setIsVerifyingGstin(false);
    }
  };

  // Recalculate day-wise rent
  useEffect(() => {
    const res = PmsStore.computeDayWiseRent({
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      perDayTariff,
      calculationType,
      standardCheckoutTime: businessSettings.standardCheckoutTime || '11:00 AM'
    });
    setDayWiseRent(res.dayWiseRent);
    setNoOfDays(res.totalDays);
  }, [checkInDate, checkInTime, checkOutDate, checkOutTime, perDayTariff, calculationType, businessSettings.standardCheckoutTime]);

  // Food Bill automatically pulled from room account (Vasudev Rasoi POS)
  const foodBills = PmsStore.getFoodBills().filter(f => f.roomNo === targetRoom.roomNo);
  const foodBillNo = foodBills[0]?.billNo || 'VR/KOT-ROOM-FOLIO';
  const foodAmount = foodBills.reduce((s, f) => s + f.netBillAmount, 0) || targetRoom.foodAmount || 0;

  // Tax and Special Toggles
  const [isMyCheckout, setIsMyCheckout] = useState(false);
  const activeInvoiceNo = isMyCheckout ? `SVR/2026-27/PERS-${targetRoom.roomNo}` : defaultInvoiceNo;
  const [isTaxInclusive, setIsTaxInclusive] = useState(true); // Default True: Published tariffs are strictly GST-inclusive
  const [splitFolioMode, setSplitFolioMode] = useState<'single' | 'split'>('single');
  const [isComplimentary, setIsComplimentary] = useState(false);
  const [gstPercent, setGstPercent] = useState<number>(12);
  const [addOthers, setAddOthers] = useState<number>(0);
  const [lessDiscount, setLessDiscount] = useState<number>(0);
  const [isCityLedgerApproved, setIsCityLedgerApproved] = useState<boolean>(false);

  // Security locks
  const canChangeTariff = PmsStore.hasPermission('Change_Room_Tariff');
  const canChangeDateTime = PmsStore.hasPermission('Change_Date&Time');
  
  // Dynamic Advance Calculation
  const roomAdvanceReceipts = PmsStore.getAdvanceReceiptsByRoom(targetRoom.roomNo);
  const totalAdvanceFromReceipts = roomAdvanceReceipts.reduce((sum, r) => sum + Number(r.amount), 0);
  const [advanceDeducted, setAdvanceDeducted] = useState<number>(
    totalAdvanceFromReceipts > 0 ? totalAdvanceFromReceipts : (guest?.advancePaid || 0)
  );

  // Pending KOTs enforcement
  const [pendingKots, setPendingKots] = useState(PmsStore.getPendingKotsByRoom(targetRoom.roomNo));
  const pendingKotAmount = pendingKots.reduce((sum, k) => sum + k.totalAmount, 0);

  const handleClearKotsToFoodBill = () => {
    if (pendingKots.length === 0) return;
    const billRecord: PmsFoodBill = {
      billNo: `VR/FB-${Math.floor(250 + Math.random() * 50)}/26-27`,
      date: checkOutDate,
      time: checkOutTime,
      roomNo: targetRoom.roomNo,
      guestName: guestName || 'ALOK JAIN',
      kotNumbers: pendingKots.map(k => k.kotNo),
      items: pendingKots.flatMap(k => k.items),
      taxableAmount: Number((pendingKotAmount / 1.05).toFixed(2)),
      gstPercent: 5.0,
      cgstAmount: Number(((pendingKotAmount / 1.05 * 0.025)).toFixed(2)),
      sgstAmount: Number(((pendingKotAmount / 1.05 * 0.025)).toFixed(2)),
      discountPercent: 0,
      discountAmount: 0,
      roundOff: 0,
      netBillAmount: Math.round(pendingKotAmount),
      settlementType: 'Settle To Room',
      status: 'Settled',
      createdAt: new Date().toISOString()
    };
    PmsStore.saveFoodBill(billRecord);
    setPendingKots([]);
    alert(`Pending KOTs cleared into Food Bill ${billRecord.billNo} and posted to Room Account!`);
  };

  const [isSezUnitWithLut, setIsSezUnitWithLut] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Late check-out detection (Standard checkout: 11:00 AM with 30-min grace period till 11:30 AM)
  const parseCheckoutHour = (timeStr: string): number => {
    try {
      const isPm = /pm/i.test(timeStr);
      const isAm = /am/i.test(timeStr);
      const parts = timeStr.replace(/[^\d:]/g, '').split(':');
      let h = parseInt(parts[0] || '11', 10);
      const m = parseInt(parts[1] || '0', 10);
      if (isPm && h < 12) h += 12;
      if (isAm && h === 12) h = 0;
      return h + m / 60;
    } catch {
      return 11.0;
    }
  };

  const checkoutDecimalHour = parseCheckoutHour(checkOutTime);
  const isLateCheckout = checkoutDecimalHour > 11.5;
  const [lateCheckoutApplied, setLateCheckoutApplied] = useState<'none' | 'half' | 'full' | 'waived'>('none');
  const [lateCheckoutWaiverNote, setLateCheckoutWaiverNote] = useState('');

  const lateCheckoutFee = (() => {
    if (lateCheckoutApplied === 'half') return Math.round(perDayTariff * 0.5);
    if (lateCheckoutApplied === 'full') return perDayTariff;
    return 0;
  })();

  // Computations
  // Base Room Rent: If lateCheckout fee is explicitly applied ('half' or 'full'), prevent charging an extra full day from dayWiseRent
  const baseRoomDaysRent = (calculationType === '12hour' && (lateCheckoutApplied === 'half' || lateCheckoutApplied === 'full') && dayWiseRent.length > 1)
    ? (dayWiseRent.length - 1) * perDayTariff
    : (dayWiseRent.length > 0 ? dayWiseRent.reduce((s, r) => s + r.rent, 0) : perDayTariff * noOfDays);

  const rawRent = baseRoomDaysRent + lateCheckoutFee;

  // Base Room Taxable (Gross Room minus Pre-Tax Discount)
  const baseRoomRent = isComplimentary
    ? 0
    : isTaxInclusive
    ? Number((rawRent / 1.12).toFixed(2))
    : rawRent;
  const netRoomTaxable = Math.max(0, baseRoomRent - lessDiscount);

  // Place of Supply Rule (Section 12(3)(c) of IGST Act 2017):
  // Immovable property accommodation (SAC 996311) and dining (SAC 996331) in Shirdi (MH)
  // always have Place of Supply = 27 (Maharashtra).
  // CGST + SGST is ALWAYS levied for both domestic and out-of-state guests, UNLESS SEZ Unit with LUT.
  const isLocalGst = !isSezUnitWithLut;

  // Dynamic Room GST Slab:
  // If tariff per night <= ₹7,500: 12% (6% CGST + 6% SGST)
  // If tariff per night > ₹7,500: 18% (9% CGST + 9% SGST)
  const effectivePerNight = noOfDays > 0 ? (netRoomTaxable / noOfDays) : netRoomTaxable;
  const roomGstRate = effectivePerNight > 7500 ? 0.18 : 0.12;
  const roomCgstRate = roomGstRate / 2;
  const roomSgstRate = roomGstRate / 2;

  // 1. SAC 996311 (Accommodation & Extra Bed @ 12% or 18%)
  const roomCgst = isComplimentary || !isLocalGst ? 0 : Number((netRoomTaxable * roomCgstRate).toFixed(2));
  const roomSgst = isComplimentary || !isLocalGst ? 0 : Number((netRoomTaxable * roomSgstRate).toFixed(2));
  const roomIgst = isComplimentary || isLocalGst ? 0 : Number((netRoomTaxable * roomGstRate).toFixed(2));
  const roomTotalGst = isComplimentary ? 0 : isLocalGst ? Number((roomCgst + roomSgst).toFixed(2)) : roomIgst;

  // 2. SAC 996331 (Vasudev Rasoi Food & Room Service @ 5%)
  const foodTaxable = foodAmount > 0 ? Number((foodAmount / 1.05).toFixed(2)) : 0;
  const foodGstAmount = foodAmount > 0 ? Number((foodAmount - foodTaxable).toFixed(2)) : 0;
  const foodCgst = isLocalGst ? Number((foodTaxable * 0.025).toFixed(2)) : 0;
  const foodSgst = isLocalGst ? Number((foodGstAmount - foodCgst).toFixed(2)) : 0;
  const foodIgst = !isLocalGst ? foodGstAmount : 0;
  const foodTotalGst = isLocalGst ? Number((foodCgst + foodSgst).toFixed(2)) : foodIgst;

  // 3. SAC 9997 (Laundry / Miscellaneous Services @ 18%)
  const miscTaxable = addOthers > 0 ? Number((addOthers / 1.18).toFixed(2)) : 0;
  const miscGstAmount = addOthers > 0 ? Number((addOthers - miscTaxable).toFixed(2)) : 0;
  const miscCgst = isLocalGst ? Number((miscTaxable * 0.09).toFixed(2)) : 0;
  const miscSgst = isLocalGst ? Number((miscGstAmount - miscCgst).toFixed(2)) : 0;
  const miscIgst = !isLocalGst ? miscGstAmount : 0;
  const miscTotalGst = isLocalGst ? Number((miscCgst + miscSgst).toFixed(2)) : miscIgst;

  // Folio Grand Totals (Accurate Folio Accounting Formula)
  const totalTaxableValue = Number((netRoomTaxable + foodTaxable + miscTaxable).toFixed(2));
  const cgstAmount = Number((roomCgst + foodCgst + miscCgst).toFixed(2));
  const sgstAmount = Number((roomSgst + foodSgst + miscSgst).toFixed(2));
  const igstAmount = Number((roomIgst + foodIgst + miscIgst).toFixed(2));
  const gstAmount = isLocalGst ? Number((cgstAmount + sgstAmount).toFixed(2)) : igstAmount;

  // Grand Invoice Total (Rounded to nearest ₹ per Section 170 CGST Act)
  const netBillAmount = Math.round(totalTaxableValue + gstAmount);
  const netPayable = Math.max(0, netBillAmount - advanceDeducted);

  // Multi-Payment Splits
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([
    { mode: 'Cash', amount: netPayable > 0 ? netPayable : 0, referenceNo: '', remark: 'Cash Settlement' }
  ]);

  // Auto-align split payment when netPayable changes if only single row exists
  useEffect(() => {
    if (paymentSplits.length === 1 && paymentSplits[0].amount === 0 && netPayable > 0) {
      setPaymentSplits([{ mode: paymentSplits[0].mode || 'Cash', amount: netPayable, referenceNo: '', remark: 'Full Settlement' }]);
    }
  }, [netPayable]);

  const totalPaidAtCheckout = paymentSplits.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingToSettle = Math.max(0, Math.round(netPayable - totalPaidAtCheckout));

  const handleAutoSettle = () => {
    setPaymentSplits([
      { mode: paymentSplits[0]?.mode || 'Cash', amount: netPayable, referenceNo: paymentSplits[0]?.referenceNo || '', remark: 'Full Settlement' }
    ]);
  };

  const handleAddPaymentMode = () => {
    setPaymentSplits([
      ...paymentSplits,
      { mode: 'UPI', amount: remainingToSettle > 0 ? remainingToSettle : 0, referenceNo: '', remark: 'PhonePe QR' }
    ]);
  };

  const handleUpdateSplit = (idx: number, field: keyof PaymentSplit, val: any) => {
    const updated = [...paymentSplits];
    updated[idx] = { ...updated[idx], [field]: val };
    setPaymentSplits(updated);
  };

  const handleRemoveSplit = (idx: number) => {
    if (paymentSplits.length <= 1) return;
    setPaymentSplits(paymentSplits.filter((_, i) => i !== idx));
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (pendingKots.length > 0) {
      alert("Hard Interlock 1: Pending Kitchen Orders Block:\n\nCannot submit checkout because KOT amount is greater than ₹0! Please convert all pending KOTs to Food Bill before checkout (Click '⚡ Clear to Food Bill').");
      return;
    }

    if (isLateCheckout && lateCheckoutApplied === 'none') {
      alert(`Hard Interlock 2: Late Check-Out Detection:\n\nGuest is departing after the 11:30 AM grace window (Check-Out Time: ${checkOutTime}).\n\nPlease select a Late Check-Out option (Half-Day charge, Full-Day charge, or apply Manager Waiver) before proceeding.`);
      return;
    }

    if (!isCityLedgerApproved && remainingToSettle > 0.01) {
      alert(`Hard Interlock 3: Zero-Balance Settlement Policy:\n\nNet Payable Balance is ₹${netPayable.toFixed(2)}, but payment allocated across Cash/UPI/Card is ₹${totalPaidAtCheckout.toFixed(2)} (Remaining Unsettled: ₹${remainingToSettle.toFixed(2)}).\n\nCheck-out cannot complete unless Net Payable Balance === ₹0.00. Please allocate the full payment (or check 'Corporate Credit / City Ledger Approved') to complete checkout.`);
      return;
    }

    setIsProcessing(true);

    const checkoutData: PmsCheckOutDetail = {
      invoiceNo: activeInvoiceNo,
      roomNo: targetRoom.roomNo,
      roomType: targetRoom.roomType,
      guestName,
      guestPhone,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      calculationType,
      numberOfDays: noOfDays,
      perDayTariff,
      totalRoomRent: netRoomTaxable,
      roomRentTotal: rawRent,
      foodAmount,
      foodBillNo,
      gstPercent: isComplimentary ? 0 : (roomGstRate * 100),
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      addOthers,
      lessDiscount,
      advanceDeducted,
      billAmount: netBillAmount,
      netPayable,
      paidAmount: totalPaidAtCheckout,
      balanceAmount: isCityLedgerApproved ? remainingToSettle : 0,
      paymentMode: paymentSplits[0]?.mode || 'Cash',
      payments: paymentSplits,
      checkoutRemark: checkoutRemark + (lateCheckoutFee > 0 ? ` [Late Check-Out: ₹${lateCheckoutFee}]` : lateCheckoutApplied === 'waived' ? ` [Late Check-Out Waived: ${lateCheckoutWaiverNote}]` : ''),
      gstNumber,
      companyName,
      companyAddress,
      city: 'Shirdi',
      state: 'Maharashtra',
      country: 'India',
      pinCode: '423109',
      sacCode: '996311',
      invoiceFormat,
      isTaxInclusive,
      isComplimentary,
      billingOfficer: 'Front Desk Mgr',
      dayWiseRent,
      idType: guestIdType,
      idNumber: guestIdNumber,
      comingFrom,
      proceedingTo,
      purpose,
      roomTaxable: netRoomTaxable,
      foodTaxable,
      miscTaxable,
      roomGstAmount: roomTotalGst,
      foodGstAmount: foodTotalGst,
      miscGstAmount: miscTotalGst
    };

    // Save checkout & automatically mark room as Dirty (VACANT_DIRTY) and enqueue high-priority housekeeping
    PmsStore.saveCheckout(checkoutData);

    // Double-Entry Journal Vouchers upon Final Checkout Settlement
    try {
      // 1. Post Receipt Vouchers for payments collected at checkout
      paymentSplits.forEach(split => {
        if (split.amount > 0) {
          const debitAcc = split.mode === 'Cash'
            ? 'Cash in Hand (Reception)'
            : split.mode === 'Card'
            ? 'Card EDC Receivable'
            : (split.mode as string) === 'Credit'
            ? 'Corporate City Ledger (Sundry Debtors)'
            : 'HDFC Bank / UPI Settlement A/c';
          
          PmsStore.postJournalEntry({
            date: checkOutDate,
            time: checkOutTime,
            referenceNo: activeInvoiceNo,
            voucherType: 'CheckOut',
            debitAccount: debitAcc,
            creditAccount: 'In-House Guest Folio Receivable',
            amountPaise: Math.round(split.amount * 100),
            amountRupees: split.amount,
            narration: `Checkout settlement for Room ${targetRoom.roomNo} (${guestName}) via ${split.mode}`,
            postedBy: 'Front Desk Mgr'
          });
        }
      });

      // 2. Room Revenue & Output Tax Journal
      if (netRoomTaxable > 0) {
        PmsStore.postJournalEntry({
          date: checkOutDate,
          time: checkOutTime,
          referenceNo: activeInvoiceNo,
          voucherType: 'CheckOut',
          debitAccount: 'In-House Guest Folio Receivable',
          creditAccount: 'Room Accommodation Revenue',
          amountPaise: Math.round(netRoomTaxable * 100),
          amountRupees: netRoomTaxable,
          narration: `Room accommodation revenue finalized on checkout for Room ${targetRoom.roomNo}`,
          postedBy: 'Front Desk Mgr'
        });
      }

      if (isLocalGst && roomCgst > 0) {
        PmsStore.postJournalEntry({
          date: checkOutDate,
          time: checkOutTime,
          referenceNo: activeInvoiceNo,
          voucherType: 'CheckOut',
          debitAccount: 'In-House Guest Folio Receivable',
          creditAccount: 'Output CGST @ 6%',
          amountPaise: Math.round(roomCgst * 100),
          amountRupees: roomCgst,
          narration: `Output CGST levied on Room ${targetRoom.roomNo} invoice ${activeInvoiceNo}`,
          postedBy: 'Front Desk Mgr'
        });
        PmsStore.postJournalEntry({
          date: checkOutDate,
          time: checkOutTime,
          referenceNo: activeInvoiceNo,
          voucherType: 'CheckOut',
          debitAccount: 'In-House Guest Folio Receivable',
          creditAccount: 'Output SGST @ 6%',
          amountPaise: Math.round(roomSgst * 100),
          amountRupees: roomSgst,
          narration: `Output SGST levied on Room ${targetRoom.roomNo} invoice ${activeInvoiceNo}`,
          postedBy: 'Front Desk Mgr'
        });
      }
    } catch (jErr) {
      console.error('Error posting checkout journal entries:', jErr);
    }

    // Auto WhatsApp on checkout
    const waConfig = PmsStore.getWhatsAppConfig();
    if (waConfig.autoSendOnCheckOut && guestPhone) {
      PmsStore.sendWhatsAppNotification({
        voucherType: 'Check_out_store',
        recipientMobile: guestPhone,
        recipientName: guestName,
        voucherNo: activeInvoiceNo,
        roomNo: targetRoom.roomNo,
        templateParams: {
          checkout_date: checkOutDate,
          total_billamount: netPayable.toFixed(2)
        }
      });
    }

    setIsProcessing(false);
    onCheckoutComplete(checkoutData);
    setShowInvoicePreview(true);
  };

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div 
        className="pms-form-box" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: showInvoicePreview ? 920 : 1180, maxHeight: '95vh' }}
      >
        {!showInvoicePreview ? (
          /* Master Checkout Folio Screen */
          <>
            <div className="pms-form-banner" style={{ background: '#84cc16', color: '#000', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Room Checkout &amp; Dual-Slab Settlement &bull; Room {targetRoom.roomNo} ({targetRoom.roomType})</span>
              <span style={{ fontSize: 11, background: '#0f172a', color: '#fff', padding: '2px 8px', borderRadius: 2, fontWeight: 800 }}>
                Inv: {activeInvoiceNo} &bull; Hotel Sai Vasudev Residency
              </span>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="pms-form-body" style={{ padding: '10px 14px' }}>
              {/* Header Info Banner */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 6,
                marginBottom: 8,
                borderBottom: '1px solid #cbd5e1'
              }}>
                <div>
                  <div style={{ fontSize: 11, color: '#0369a1', fontWeight: 700, textTransform: 'uppercase' }}>Active Guest &amp; Room Folio</div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                    {guestName} &bull; +91 {guestPhone} &bull; Room {targetRoom.roomNo} ({targetRoom.roomType})
                  </span>
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                    Origin: {comingFrom} &rarr; Destination: {proceedingTo} ({purpose})
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isMyCheckout;
                      setIsMyCheckout(next);
                      if (next) {
                        setGstPercent(0);
                        setIsComplimentary(true);
                      } else {
                        setGstPercent(12);
                        setIsComplimentary(false);
                      }
                    }}
                    style={{
                      background: isMyCheckout ? '#15803d' : '#475569',
                      color: '#fff',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: 3,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    title="Toggle Personal / Non-commercial stay"
                  >
                    {isMyCheckout ? '✓ Personal Stay (Exempt)' : 'Personal / Dir'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const rawRent = perDayTariff * noOfDays;
                      const taxVal = Number((rawRent / 1.12).toFixed(2));
                      const gstVal = Number((rawRent - taxVal).toFixed(2));
                      setIsTaxInclusive(true);
                      alert(`Hotel Sai Vasudev Residency:\n\nRoom Rent Tax Inclusive (12%):\nTaxable Base: ₹${taxVal}\nGST (CGST 6% + SGST 6%): ₹${gstVal}\nTotal Tariff: ₹${rawRent}`);
                    }}
                    style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: 3,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    title="Calculate Tax Inclusive"
                  >
                    Calculate Bill (Tax Inclusive)
                  </button>

                  <label style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <input
                      type="checkbox"
                      checked={isTaxInclusive}
                      onChange={e => setIsTaxInclusive(e.target.checked)}
                    />
                    Tax Inc
                  </label>

                  <label style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <input
                      type="checkbox"
                      checked={isComplimentary}
                      onChange={e => setIsComplimentary(e.target.checked)}
                    />
                    Complimentary
                  </label>
                </div>
              </div>

              {/* Hard Interlock 2: Late Check-Out Detection Banner */}
              {isLateCheckout && (
                <div style={{
                  background: lateCheckoutApplied === 'waived' ? '#f0fdf4' : '#fffbeb',
                  border: `2px solid ${lateCheckoutApplied === 'waived' ? '#16a34a' : '#f59e0b'}`,
                  borderRadius: 6,
                  padding: '8px 12px',
                  marginBottom: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <div style={{ fontWeight: 800, color: lateCheckoutApplied === 'waived' ? '#15803d' : '#b45309', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>⚠️ LATE CHECK-OUT DETECTED &bull; Time: {checkOutTime}</span>
                      <span style={{ fontSize: 11, background: '#0f172a', color: '#fff', padding: '1px 6px', borderRadius: 3 }}>
                        Std: 11:00 AM (30m Grace)
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                      {lateCheckoutApplied === 'none' && 'Departure is past the 11:30 AM grace window. Please select late checkout tariff or apply manager waiver.'}
                      {lateCheckoutApplied === 'half' && `Half-Day Late Checkout applied: +₹${lateCheckoutFee} (11:30 AM–4:00 PM).`}
                      {lateCheckoutApplied === 'full' && `Full-Day Late Checkout applied: +₹${lateCheckoutFee} (>4:00 PM).`}
                      {lateCheckoutApplied === 'waived' && `Manager Waiver applied: ${lateCheckoutWaiverNote || 'Waived per GM approval'}.`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setLateCheckoutApplied('half')}
                      style={{
                        background: lateCheckoutApplied === 'half' ? '#d97706' : '#ffffff',
                        color: lateCheckoutApplied === 'half' ? '#ffffff' : '#334155',
                        border: '1px solid #cbd5e1',
                        padding: '4px 10px',
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Half Day (+₹{Math.round(perDayTariff * 0.5)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLateCheckoutApplied('full')}
                      style={{
                        background: lateCheckoutApplied === 'full' ? '#b91c1c' : '#ffffff',
                        color: lateCheckoutApplied === 'full' ? '#ffffff' : '#334155',
                        border: '1px solid #cbd5e1',
                        padding: '4px 10px',
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Full Day (+₹{perDayTariff})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const note = prompt('Enter Manager Waiver Reason (e.g. VIP Pilgrim / Delayed Darshan Aarti):', 'Complimentary extension for temple darshan aarti');
                        if (note) {
                          setLateCheckoutApplied('waived');
                          setLateCheckoutWaiverNote(note);
                        }
                      }}
                      style={{
                        background: lateCheckoutApplied === 'waived' ? '#16a34a' : '#ffffff',
                        color: lateCheckoutApplied === 'waived' ? '#ffffff' : '#334155',
                        border: '1px solid #cbd5e1',
                        padding: '4px 10px',
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Manager Waiver (₹0)
                    </button>
                  </div>
                </div>
              )}

              {/* Guest Profile & Police C-Form KYC Details */}
              <div className="pms-checkout-kyc-grid" style={{
                background: '#f8fafc',
                padding: '6px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                marginBottom: 8
              }}>
                <div>
                  <label style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 800, display: 'block' }}>Guest Name</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    className="form-input-pms"
                    style={{ fontSize: 11, padding: '2px 6px', background: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 800, display: 'block' }}>Mobile (10 Digits)</label>
                  <input
                    type="text"
                    value={guestPhone}
                    onChange={e => setGuestPhone(e.target.value)}
                    className="form-input-pms"
                    style={{ fontSize: 11, padding: '2px 6px', background: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 800, display: 'block' }}>ID Verification</label>
                  <input
                    type="text"
                    value={`${guestIdType}: ${guestIdNumber}`}
                    readOnly
                    className="form-input-pms"
                    style={{ fontSize: 11, padding: '2px 6px', background: '#f1f5f9' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 800, display: 'block' }}>Darshan / Police Route</label>
                  <input
                    type="text"
                    value={`${comingFrom} → ${proceedingTo} (${purpose})`}
                    readOnly
                    className="form-input-pms"
                    style={{ fontSize: 11, padding: '2px 6px', background: '#f1f5f9' }}
                  />
                </div>
              </div>

              {/* Stay Time & Policy Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                background: '#f1f5f9',
                padding: '6px 10px',
                borderRadius: 4,
                border: '1px solid #cbd5e1',
                marginBottom: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: 3 }}>
                    Check-In: {!canChangeDateTime && <span title="Locked for staff: Anti-Backdating fraud guard">🔒</span>}
                  </span>
                  <input
                    type="text"
                    value={checkInDate}
                    onChange={e => setCheckInDate(e.target.value)}
                    readOnly={!canChangeDateTime}
                    className="form-input-pms"
                    style={{
                      width: 90,
                      padding: '1px 4px',
                      fontSize: 11,
                      background: !canChangeDateTime ? '#e2e8f0' : '#ffffff',
                      cursor: !canChangeDateTime ? 'not-allowed' : 'text'
                    }}
                  />
                  <input
                    type="text"
                    value={checkInTime}
                    onChange={e => setCheckInTime(e.target.value)}
                    readOnly={!canChangeDateTime}
                    className="form-input-pms"
                    style={{
                      width: 65,
                      padding: '1px 4px',
                      fontSize: 11,
                      background: !canChangeDateTime ? '#e2e8f0' : '#ffffff',
                      cursor: !canChangeDateTime ? 'not-allowed' : 'text'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: 3 }}>
                    Check-Out: {!canChangeDateTime && <span title="Locked for staff">🔒</span>}
                  </span>
                  <input
                    type="text"
                    value={checkOutDate}
                    onChange={e => setCheckOutDate(e.target.value)}
                    readOnly={!canChangeDateTime}
                    className="form-input-pms"
                    style={{
                      width: 90,
                      padding: '1px 4px',
                      fontSize: 11,
                      background: !canChangeDateTime ? '#e2e8f0' : '#ffffff',
                      cursor: !canChangeDateTime ? 'not-allowed' : 'text'
                    }}
                  />
                  <input
                    type="text"
                    value={checkOutTime}
                    onChange={e => setCheckOutTime(e.target.value)}
                    readOnly={!canChangeDateTime}
                    className="form-input-pms"
                    style={{
                      width: 65,
                      padding: '1px 4px',
                      fontSize: 11,
                      background: !canChangeDateTime ? '#e2e8f0' : '#ffffff',
                      cursor: !canChangeDateTime ? 'not-allowed' : 'text'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 800, color: '#0369a1' }}>Policy:</span>
                  <select
                    value={calculationType}
                    onChange={e => setCalculationType(e.target.value as '12hour' | '24hour')}
                    className="form-select-pms"
                    style={{ padding: '2px 6px', fontSize: 11, fontWeight: 700 }}
                  >
                    <option value="12hour">12-Hour (Standard 11:00 AM Checkout)</option>
                    <option value="24hour">24-Hour (Exact 24h from checkin)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: 3 }}>
                    Tariff/Day: {!canChangeTariff && <span title="Locked for staff">🔒</span>}
                  </span>
                  <input
                    type="number"
                    value={perDayTariff}
                    onChange={e => setPerDayTariff(Number(e.target.value))}
                    readOnly={!canChangeTariff}
                    className="form-input-pms"
                    style={{
                      width: 75,
                      padding: '2px 4px',
                      fontSize: 11,
                      fontWeight: 800,
                      background: !canChangeTariff ? '#e2e8f0' : '#ffffff',
                      cursor: !canChangeTariff ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
              </div>

              {/* 4 Multi-Card Inspection Grid */}
              <div className="pms-checkout-4cards-grid" style={{ marginBottom: 10 }}>
                {/* Card 1: Pending Kot List */}
                <div style={{ border: '1px solid #38bdf8', borderRadius: 3, background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                  <div>
                    <div style={{
                      background: '#bef264',
                      color: '#000000',
                      fontWeight: 800,
                      fontSize: 11,
                      padding: '4px 8px',
                      borderBottom: '1px solid #a3e635'
                    }}>
                      Pending Kot List (Vasudev Rasoi)
                    </div>
                    <div style={{ overflowX: 'auto', minHeight: 95, maxHeight: 115, padding: 2 }}>
                      <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                            <th style={{ padding: '2px 4px' }}>S.No</th>
                            <th style={{ padding: '2px 4px' }}>Date</th>
                            <th style={{ padding: '2px 4px' }}>KOT #</th>
                            <th style={{ padding: '2px 4px' }}>Qty</th>
                            <th style={{ padding: '2px 4px', textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingKots.length > 0 ? (
                            pendingKots.map((k, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '2px 4px' }}>{idx + 1}</td>
                                <td style={{ padding: '2px 4px' }}>{k.date || k.createdAt?.slice(0, 10) || 'Today'}</td>
                                <td style={{ padding: '2px 4px', fontWeight: 700 }}>{k.kotNo}</td>
                                <td style={{ padding: '2px 4px' }}>{k.items.reduce((s, i) => s + i.qty, 0)}</td>
                                <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 700 }}>₹{k.totalAmount.toFixed(2)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} style={{ padding: '14px 4px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                No Pending KOTs
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div style={{ height: 32, padding: '4px 6px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
                    <input
                      type="text"
                      readOnly
                      value={`₹${pendingKotAmount.toFixed(2)}`}
                      className="form-input-pms"
                      style={{ width: 75, fontSize: 10, padding: '1px 4px', fontWeight: 700, background: '#fff' }}
                      title="Total Pending KOT Amount"
                    />
                    {pendingKots.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearKotsToFoodBill}
                        style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: 2, fontSize: 9, fontWeight: 800, cursor: 'pointer' }}
                        title="Convert pending KOTs into Food Bill"
                      >
                        ⚡ Clear to Food Bill
                      </button>
                    )}
                  </div>
                </div>

                {/* Card 2: Posted Food Bill (SAC 996331 @ 5% GST) */}
                <div style={{ border: '1px solid #38bdf8', borderRadius: 3, background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                  <div>
                    <div style={{
                      background: '#bef264',
                      color: '#000000',
                      fontWeight: 800,
                      fontSize: 11,
                      padding: '4px 8px',
                      borderBottom: '1px solid #a3e635'
                    }}>
                      Posted Food Bills (SAC 996331)
                    </div>
                    <div style={{ overflowX: 'auto', minHeight: 95, maxHeight: 115, padding: 2 }}>
                      <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                            <th style={{ padding: '2px 4px' }}>S.No</th>
                            <th style={{ padding: '2px 4px' }}>Bill #</th>
                            <th style={{ padding: '2px 4px' }}>Items</th>
                            <th style={{ padding: '2px 4px', textAlign: 'right' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {foodBills.length > 0 ? (
                            foodBills.map((fb, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '2px 4px' }}>{idx + 1}</td>
                                <td style={{ padding: '2px 4px', fontWeight: 700 }}>{fb.billNo}</td>
                                <td style={{ padding: '2px 4px' }}>{fb.items.reduce((s, i) => s + i.qty, 0)} items</td>
                                <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 700 }}>₹{fb.netBillAmount.toFixed(2)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} style={{ padding: '14px 4px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                {foodAmount > 0 ? `Posted Food: ₹${foodAmount.toFixed(2)}` : 'No Food Orders'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div style={{ height: 32, padding: '4px 6px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, boxSizing: 'border-box' }}>
                    <span>Food Taxable: <strong>₹{foodTaxable.toFixed(2)}</strong></span>
                    <input
                      type="text"
                      readOnly
                      value={`₹${foodAmount.toFixed(2)}`}
                      className="form-input-pms"
                      style={{ width: 75, fontSize: 10, padding: '1px 4px', fontWeight: 800, textAlign: 'right', background: '#fff' }}
                      title="Total Food Amount with 5% GST"
                    />
                  </div>
                </div>

                {/* Card 3: Day Wise Rent (SAC 996311 @ 12% GST) */}
                <div style={{ border: '1px solid #38bdf8', borderRadius: 3, background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                  <div>
                    <div style={{
                      background: '#bef264',
                      color: '#000000',
                      fontWeight: 800,
                      fontSize: 11,
                      padding: '4px 8px',
                      borderBottom: '1px solid #a3e635',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>Day Wise Rent (SAC 996311)</span>
                      <span style={{ fontSize: 9, background: '#0f172a', color: '#fff', padding: '1px 4px', borderRadius: 2 }}>
                        {calculationType === '12hour' ? '12-Hour' : '24-Hour'}
                      </span>
                    </div>
                    <div style={{ overflowX: 'auto', minHeight: 95, maxHeight: 115, padding: 2 }}>
                      <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                            <th style={{ padding: '2px 4px' }}>Start</th>
                            <th style={{ padding: '2px 4px' }}>End</th>
                            <th style={{ padding: '2px 4px', textAlign: 'center' }}>Nights</th>
                            <th style={{ padding: '2px 4px', textAlign: 'right' }}>Rent</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayWiseRent.map((slab, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '2px 4px', whiteSpace: 'nowrap' }}>{slab.startDate}</td>
                              <td style={{ padding: '2px 4px', whiteSpace: 'nowrap' }}>{slab.endDate}</td>
                              <td style={{ padding: '2px 4px', textAlign: 'center', fontWeight: 700 }}>{slab.dayCount}</td>
                              <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 700 }}>₹{slab.rent.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div style={{
                    height: 32,
                    padding: '4px 6px',
                    borderTop: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 10,
                    boxSizing: 'border-box'
                  }}>
                    <span>Nights: <strong>{noOfDays}</strong></span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>Room Rent:</span>
                      <input
                        type="text"
                        readOnly
                        value={`₹${rawRent.toFixed(2)}`}
                        className="form-input-pms"
                        style={{ width: 75, fontSize: 10, padding: '1px 4px', fontWeight: 800, textAlign: 'right', background: '#fff' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card 4: Right Settlement & Split Payment Box */}
                <div style={{
                  border: '1px solid #84cc16',
                  borderRadius: 3,
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%'
                }}>
                  <div>
                    <div style={{
                      background: '#bef264',
                      color: '#000000',
                      fontWeight: 800,
                      fontSize: 11,
                      padding: '4px 8px',
                      borderBottom: '1px solid #a3e635',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>Bill Summary &amp; Payment Allocation</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => setShowDecentroQrModal(true)}
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
                          title="Generate dynamic UPI QR via Decentro Banking for instant room settlement"
                        >
                          ⚡ Decentro UPI QR
                        </button>
                        <button
                          type="button"
                          onClick={handleAutoSettle}
                          style={{
                            background: '#15803d',
                            color: '#fff',
                            border: 'none',
                            padding: '1px 5px',
                            borderRadius: 2,
                            fontSize: 9,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Auto-fill balance into payment split"
                        >
                          ⚡ Settle Full
                        </button>
                      </div>
                    </div>

                    <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Less Pre-tax Discount (-) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#334155', display: 'flex', alignItems: 'center', gap: 3 }}>
                          Less Discount (-) {!canChangeTariff && <span title="Discount locked for staff">🔒</span>}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={lessDiscount}
                          onChange={e => setLessDiscount(Number(e.target.value))}
                          readOnly={!canChangeTariff}
                          className="form-input-pms"
                          style={{
                            width: 85,
                            fontSize: 10,
                            padding: '1px 4px',
                            textAlign: 'right',
                            background: !canChangeTariff ? '#e2e8f0' : '#ffffff',
                            cursor: !canChangeTariff ? 'not-allowed' : 'text'
                          }}
                        />
                      </div>

                      {/* Grand Bill Amount */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>Grand Bill Total (Round)</span>
                        <input
                          type="text"
                          readOnly
                          value={`₹${netBillAmount.toFixed(2)}`}
                          className="form-input-pms"
                          style={{ width: 85, fontSize: 10, padding: '1px 4px', textAlign: 'right', fontWeight: 800, background: '#fff' }}
                        />
                      </div>

                      {/* Total Advance Paid */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#334155' }}>Advance Deducted (-)</span>
                        <input
                          type="number"
                          value={advanceDeducted}
                          onChange={e => setAdvanceDeducted(Number(e.target.value))}
                          className="form-input-pms"
                          style={{ width: 85, fontSize: 10, padding: '1px 4px', textAlign: 'right', color: '#b91c1c', fontWeight: 700 }}
                        />
                      </div>

                      {/* Net Balance To Pay */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#15803d' }}>Net Balance To Pay</span>
                        <input
                          type="text"
                          readOnly
                          value={`₹${netPayable.toFixed(2)}`}
                          className="form-input-pms"
                          style={{ width: 85, fontSize: 10, padding: '1px 4px', textAlign: 'right', fontWeight: 800, background: '#dcfce7', color: '#166534' }}
                        />
                      </div>

                      {/* Split Payment Rows */}
                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 3, marginTop: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
                          <span>Payment Allocation:</span>
                          <button
                            type="button"
                            onClick={handleAddPaymentMode}
                            style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '1px 5px', borderRadius: 2, fontSize: 9, fontWeight: 700, cursor: 'pointer' }}
                          >
                            + Split Mode
                          </button>
                        </div>

                        {paymentSplits.map((split, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 3, alignItems: 'center', marginBottom: 2 }}>
                            <select
                              value={split.mode}
                              onChange={e => handleUpdateSplit(idx, 'mode', e.target.value)}
                              className="form-select-pms"
                              style={{ fontSize: 9, padding: '1px 2px', width: 68 }}
                            >
                              <option value="Cash">Cash</option>
                              <option value="UPI">UPI</option>
                              <option value="Card">Card</option>
                              <option value="Online">Online</option>
                              <option value="Credit">Credit</option>
                            </select>
                            <input
                              type="number"
                              value={split.amount || 0}
                              onChange={e => handleUpdateSplit(idx, 'amount', Number(e.target.value))}
                              className="form-input-pms"
                              style={{ width: 62, fontSize: 10, padding: '1px 3px', textAlign: 'right', fontWeight: 700 }}
                            />
                            <input
                              type="text"
                              placeholder="Ref / UTR"
                              value={split.referenceNo || ''}
                              onChange={e => handleUpdateSplit(idx, 'referenceNo', e.target.value)}
                              className="form-input-pms"
                              style={{ flex: 1, fontSize: 9, padding: '1px 3px' }}
                            />
                            {paymentSplits.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSplit(idx)}
                                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0 4px', borderRadius: 2, fontSize: 10, cursor: 'pointer' }}
                                title="Remove split"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Corporate Ledger Approval Checkbox */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#0369a1', cursor: 'pointer', marginTop: 1 }}>
                        <input
                          type="checkbox"
                          checked={isCityLedgerApproved}
                          onChange={e => setIsCityLedgerApproved(e.target.checked)}
                        />
                        <span>Corporate Credit / City Ledger Approved</span>
                      </label>
                    </div>
                  </div>

                  {/* Live Settlement Status Footer Bar (32px Matching Aligned Height) */}
                  <div style={{
                    height: 32,
                    padding: '4px 8px',
                    borderTop: `1px solid ${remainingToSettle === 0 || isCityLedgerApproved ? '#86efac' : '#fca5a5'}`,
                    background: remainingToSettle === 0 || isCityLedgerApproved ? '#dcfce7' : '#fee2e2',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                    boxSizing: 'border-box'
                  }}>
                    <span>Allocated: ₹{totalPaidAtCheckout.toFixed(2)}</span>
                    <span style={{ color: remainingToSettle === 0 || isCityLedgerApproved ? '#166534' : '#b91c1c' }}>
                      {remainingToSettle === 0
                        ? '✓ Balanced (₹0.00)'
                        : isCityLedgerApproved
                        ? `City Ledger (₹${remainingToSettle.toFixed(2)})`
                        : `⚠️ Unsettled: ₹${remainingToSettle.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Corporate GST & Discount Row */}
              <div className="pms-checkout-corporate-grid" style={{ marginBottom: 8 }}>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Company Name (B2B)</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Tata Motors Ltd" className="form-input-pms" />
                </div>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <label className="form-label-pms" style={{ margin: 0 }}>Party GSTIN (15 Chars)</label>
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
                      title="Verify GSTIN with Decentro Public Registry & auto-fill corporate details"
                    >
                      {isVerifyingGstin ? 'Verifying...' : '🔍 Verify (Decentro)'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={e => {
                      setGstNumber(e.target.value.toUpperCase());
                      setGstinVerifiedBadge(null);
                    }}
                    placeholder="e.g. 21AEKPP8689J1ZS"
                    className="form-input-pms"
                  />
                  {gstinVerifiedBadge && (
                    <div style={{ fontSize: 9, color: '#15803d', fontWeight: 800, marginTop: 2 }}>
                      {gstinVerifiedBadge}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, color: '#4338ca', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isSezUnitWithLut}
                        onChange={e => setIsSezUnitWithLut(e.target.checked)}
                      />
                      <span>SEZ Unit (LUT)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 800, color: '#047857', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={splitFolioMode === 'split'}
                        onChange={e => setSplitFolioMode(e.target.checked ? 'split' : 'single')}
                      />
                      <span>⚡ Split B2B Folio</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDecentroVaModal(true)}
                      style={{
                        background: '#312e81',
                        color: '#fff',
                        border: 'none',
                        padding: '1px 6px',
                        borderRadius: 2,
                        fontSize: 9,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                      title="Create or view Decentro Dedicated Virtual Account for NEFT/RTGS/IMPS wire transfers"
                    >
                      🏢 Virtual Account
                    </button>
                  </div>
                </div>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Laundry / Other (₹) (SAC 9997)</label>
                  <input type="number" min="0" value={addOthers} onChange={e => setAddOthers(Number(e.target.value))} className="form-input-pms" />
                </div>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Pre-Tax Discount (₹)</label>
                  <input type="number" min="0" value={lessDiscount} onChange={e => setLessDiscount(Number(e.target.value))} className="form-input-pms" />
                </div>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Room GST Slabs</label>
                  <select value={gstPercent} onChange={e => setGstPercent(Number(e.target.value))} className="form-select-pms" disabled={isComplimentary}>
                    <option value={12}>12% GST (SAC 996311 Standard)</option>
                    <option value={18}>18% GST (SAC 996311 Luxury)</option>
                    <option value={0}>0% GST (Exempt / Complimentary)</option>
                  </select>
                </div>
              </div>

              {splitFolioMode === 'split' && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 11,
                  marginBottom: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8
                }}>
                  <div>
                    <strong style={{ color: '#166534' }}>🏢 Folio A (Corporate B2B):</strong> Room Tariff ₹{rawRent.toFixed(2)} (Net Taxable ₹{netRoomTaxable.toFixed(2)} + 12% GST ₹{roomTotalGst.toFixed(2)}) &bull; Billed to: <strong>{companyName || 'Corporate Entity'}</strong> ({gstNumber || 'B2B GSTIN'})
                  </div>
                  <div>
                    <strong style={{ color: '#0369a1' }}>👤 Folio B (Personal Extras):</strong> Food & Extras ₹{(foodAmount + addOthers).toFixed(2)} &bull; Paid Personally by Guest ({guestName})
                  </div>
                </div>
              )}

              {/* GST Calculation Status & Local Policy Banner */}
              <div style={{
                background: isComplimentary ? '#f8fafc' : isLocalGst ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${isComplimentary ? '#cbd5e1' : isLocalGst ? '#86efac' : '#fde68a'}`,
                padding: '6px 12px',
                borderRadius: 4,
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                fontSize: 11
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 3,
                    background: isComplimentary ? '#64748b' : isLocalGst ? '#16a34a' : '#d97706',
                    color: '#fff',
                    fontSize: 10
                  }}>
                    {isComplimentary
                      ? 'EXEMPT (0% GST)'
                      : isLocalGst
                      ? 'MAHARASHTRA LOCAL SALES (SGST + CGST)'
                      : `INTERSTATE SALES (IGST ${gstPercent}%)`}
                  </span>
                  <span style={{ color: '#475569', fontSize: 10 }}>
                    {isSezUnitWithLut
                      ? '✓ Zero-Rated IGST per SEZ Unit with LUT filing'
                      : '✓ Sec 12(3)(c) IGST Act: Hotel Immovable Property Place of Supply = 27 Maharashtra (Intrastate CGST + SGST)'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>
                    {isLocalGst ? (
                      <span>SGST: ₹{sgstAmount.toFixed(2)} | CGST: ₹{cgstAmount.toFixed(2)}</span>
                    ) : (
                      <span style={{ color: '#b45309' }}>IGST: ₹{igstAmount.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Address & Remark */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 8, marginBottom: 8 }}>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Company Address / Billing Address</label>
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={e => setCompanyAddress(e.target.value)}
                    className="form-input-pms"
                    placeholder="e.g. Plot 10, MIDC Industrial Area, Pune"
                  />
                </div>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Checkout Remark / Keys Deposited</label>
                  <input
                    type="text"
                    value={checkoutRemark}
                    onChange={e => setCheckoutRemark(e.target.value)}
                    className="form-input-pms"
                    placeholder="e.g. Checked out peacefully. Key returned to front desk."
                  />
                </div>
              </div>

              {/* Financial Summary */}
              <div style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12 }}>
                  Taxable Room: <strong>₹{netRoomTaxable.toFixed(2)}</strong> (SAC 996311) &bull;
                  Food: <strong>₹{foodAmount.toFixed(2)}</strong> (SAC 996331 @ 5%) &bull;
                  Total GST: <strong>₹{gstAmount.toFixed(2)}</strong> &bull;
                  Advance: <strong style={{ color: '#b91c1c' }}>-₹{advanceDeducted.toFixed(2)}</strong>
                </span>

                <span style={{ fontSize: 14, fontWeight: 900, color: '#15803d' }}>
                  Net Payable Balance: ₹{netPayable.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pms-btn-group" style={{ marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '6px 18px', borderRadius: 3, fontWeight: 700, cursor: 'pointer' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || (!isCityLedgerApproved && remainingToSettle > 0.01)}
                  style={{
                    background: isProcessing || (!isCityLedgerApproved && remainingToSettle > 0.01) ? '#94a3b8' : '#16a34a',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 24px',
                    borderRadius: 3,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: isProcessing || (!isCityLedgerApproved && remainingToSettle > 0.01) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isProcessing ? 'Processing Settlement...' : '✓ Complete Checkout & Generate Final Tax Invoice'}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Multi-Format Tax Invoice Preview */
          <div>
            {/* Format Switcher Toolbar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#0f172a',
              padding: '8px 14px',
              color: '#fff'
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Invoice Format:</span>
                <button
                  type="button"
                  onClick={() => setInvoiceFormat('A4_Standard')}
                  style={{
                    background: invoiceFormat === 'A4_Standard' ? '#38bdf8' : '#334155',
                    color: invoiceFormat === 'A4_Standard' ? '#0f172a' : '#fff',
                    border: 'none',
                    padding: '3px 10px',
                    borderRadius: 3,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  A4 Standard (Official GST)
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceFormat('Detailed')}
                  style={{
                    background: invoiceFormat === 'Detailed' ? '#38bdf8' : '#334155',
                    color: invoiceFormat === 'Detailed' ? '#0f172a' : '#fff',
                    border: 'none',
                    padding: '3px 10px',
                    borderRadius: 3,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Detailed Breakdown
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setFullBillFormat('Format_3_A4_Standard');
                    setIsFullBillFormatOpen(true);
                  }}
                  style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  title="Open Multi-Format Bill Suite"
                >
                  <span>🧾</span> Multi-Format Bill Suite
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '4px 14px', borderRadius: 3, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <span>🖨️</span> Print GST Tax Invoice (A4)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const guestPhoneNum = guestPhone || '9822100042';
                    PmsStore.sendWhatsAppNotification({
                      voucherType: 'Check_out_store',
                      recipientMobile: guestPhoneNum,
                      recipientName: guestName || 'Guest',
                      voucherNo: activeInvoiceNo,
                      roomNo: targetRoom.roomNo,
                      templateParams: {
                        checkout_date: checkOutDate,
                        total_billamount: netPayable.toFixed(2)
                      },
                      openDirectly: true
                    });
                  }}
                  style={{ background: '#25d366', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  title="Send digital tax invoice to guest on WhatsApp"
                >
                  <span>💬</span> WhatsApp Bill
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Printable Tax Invoice Document (Isolated by @media print) */}
            <div id="printable-tax-invoice" style={{ padding: 24, background: '#ffffff', fontSize: 12, color: '#0f172a', fontFamily: 'Arial, Helvetica, sans-serif' }}>
              {/* Hotel Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: 10, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ textAlign: 'left', fontSize: 11, color: '#475569' }}>
                    <div><strong>GSTIN:</strong> 21AEKPP8689J1ZS</div>
                    <div><strong>PAN:</strong> AEKPP8689J</div>
                    <div><strong>State:</strong> Odisha (21)</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: 1.5, color: '#0f172a' }}>
                      SRI SAI VASUDEV RESIDENCY
                    </h1>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#b45309' }}>
                      Proprietorship: PAIDISETTY MANMADHA RAO
                    </div>
                    <div style={{ fontSize: 11, color: '#334155' }}>
                      Near Andhra Bank, New Colony, Rayagada, Odisha 765001
                    </div>
                    <div style={{ fontSize: 11, color: '#334155' }}>
                      Phone: <strong>+91 94402 89999</strong> &bull; Email: reservations@hotelsai-vasudev.com
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: '#475569' }}>
                    <div style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 3, border: '1px solid #cbd5e1', fontWeight: 800, color: '#0f172a' }}>
                      ORIGINAL FOR RECIPIENT
                    </div>
                    <div style={{ marginTop: 4 }}>SAC: 996311 / 996331</div>
                  </div>
                </div>
                <div style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '4px 14px',
                  borderRadius: 2,
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginTop: 6
                }}>
                  TAX INVOICE (FINAL GUEST SETTLEMENT)
                </div>
              </div>

              {/* Guest KYC & Stay Particulars Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, border: '1px solid #cbd5e1', borderRadius: 4, padding: 10, marginBottom: 12, background: '#f8fafc', fontSize: 11 }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#0369a1', borderBottom: '1px solid #cbd5e1', paddingBottom: 3, marginBottom: 5 }}>
                    GUEST KYC &amp; BILLING DETAILS
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '125px 1fr', rowGap: 3 }}>
                    <strong>Guest Full Name:</strong> <span style={{ fontWeight: 700 }}>{guestName}</span>
                    <strong>Contact Mobile:</strong> <span>+91 {guestPhone}</span>
                    <strong>ID Verification:</strong> <span>{guestIdType}: {guestIdNumber}</span>
                    <strong>Police C-Form Route:</strong> <span>{comingFrom} &rarr; Going to {proceedingTo}</span>
                    <strong>Purpose of Visit:</strong> <span>{purpose}</span>
                    {companyName && <><strong>Company Name:</strong> <span style={{ fontWeight: 700 }}>{companyName}</span></>}
                    {gstNumber && <><strong>Customer GSTIN:</strong> <span style={{ fontWeight: 800, color: '#0f172a' }}>{gstNumber}</span></>}
                    {companyAddress && <><strong>Billing Address:</strong> <span>{companyAddress}</span></>}
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: 12 }}>
                  <div style={{ fontWeight: 800, color: '#854d0e', borderBottom: '1px solid #cbd5e1', paddingBottom: 3, marginBottom: 5 }}>
                    INVOICE &amp; STAY PARTICULARS
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '125px 1fr', rowGap: 3 }}>
                    <strong>Invoice Number:</strong> <span style={{ fontWeight: 900, color: '#0f172a' }}>{activeInvoiceNo}</span>
                    <strong>Invoice Date:</strong> <span>{checkOutDate} {checkOutTime}</span>
                    <strong>Room Assigned:</strong> <span style={{ fontWeight: 800 }}>Room {targetRoom.roomNo} ({targetRoom.roomType})</span>
                    <strong>Check-In Stay:</strong> <span>{checkInDate} {checkInTime}</span>
                    <strong>Check-Out Stay:</strong> <span>{checkOutDate} {checkOutTime}</span>
                    <strong>Total Stay Billed:</strong> <span><strong>{noOfDays} Night{noOfDays > 1 ? 's' : ''}</strong> ({calculationType === '12hour' ? '12-Hour Standard' : '24-Hour Policy'})</span>
                    <strong>Billing Officer:</strong> <span>Front Desk Supervisor</span>
                  </div>
                </div>
              </div>

              {/* Itemized Folio Table with SAC Codes */}
              <table className="pms-table-compact" style={{ width: '100%', marginBottom: 12, borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderTop: '1px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                    <th style={{ width: 35, padding: '5px 6px' }}>S.No</th>
                    <th style={{ width: 75, padding: '5px 6px' }}>SAC Code</th>
                    <th style={{ padding: '5px 6px' }}>Description of Service / Goods</th>
                    <th style={{ width: 55, textAlign: 'center', padding: '5px 6px' }}>Qty/Nts</th>
                    <th style={{ width: 85, textAlign: 'right', padding: '5px 6px' }}>Rate (₹)</th>
                    <th style={{ width: 65, textAlign: 'center', padding: '5px 6px' }}>GST Rate</th>
                    <th style={{ width: 105, textAlign: 'right', padding: '5px 6px' }}>Taxable Amt (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '5px 6px' }}>1</td>
                    <td style={{ padding: '5px 6px', fontWeight: 700 }}>996311</td>
                    <td style={{ padding: '5px 6px' }}>
                      <strong>Room Accommodation &amp; Stay</strong> &bull; {targetRoom.roomType} (Room {targetRoom.roomNo})
                    </td>
                    <td style={{ textAlign: 'center', padding: '5px 6px' }}>{noOfDays}</td>
                    <td style={{ textAlign: 'right', padding: '5px 6px' }}>{perDayTariff.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: '5px 6px' }}>{isComplimentary ? '0%' : '12%'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, padding: '5px 6px' }}>{netRoomTaxable.toFixed(2)}</td>
                  </tr>
                  {foodAmount > 0 && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '5px 6px' }}>2</td>
                      <td style={{ padding: '5px 6px', fontWeight: 700 }}>996331</td>
                      <td style={{ padding: '5px 6px' }}>
                        <strong>Vasudev Rasoi Pure Veg Restaurant &amp; Room Dining</strong> ({foodBillNo})
                      </td>
                      <td style={{ textAlign: 'center', padding: '5px 6px' }}>1</td>
                      <td style={{ textAlign: 'right', padding: '5px 6px' }}>{foodTaxable.toFixed(2)}</td>
                      <td style={{ textAlign: 'center', padding: '5px 6px' }}>5%</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, padding: '5px 6px' }}>{foodTaxable.toFixed(2)}</td>
                    </tr>
                  )}
                  {addOthers > 0 && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '5px 6px' }}>{foodAmount > 0 ? 3 : 2}</td>
                      <td style={{ padding: '5px 6px', fontWeight: 700 }}>9997</td>
                      <td style={{ padding: '5px 6px' }}>
                        <strong>Laundry &amp; Miscellaneous Guest Services</strong>
                      </td>
                      <td style={{ textAlign: 'center', padding: '5px 6px' }}>1</td>
                      <td style={{ textAlign: 'right', padding: '5px 6px' }}>{miscTaxable.toFixed(2)}</td>
                      <td style={{ textAlign: 'center', padding: '5px 6px' }}>18%</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, padding: '5px 6px' }}>{miscTaxable.toFixed(2)}</td>
                    </tr>
                  )}
                  {lessDiscount > 0 && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#dc2626' }}>
                      <td style={{ padding: '5px 6px' }}>-</td>
                      <td style={{ padding: '5px 6px' }}>-</td>
                      <td style={{ padding: '5px 6px' }}>
                        <strong>Less: Pre-Tax Promotional / Special Discount</strong>
                      </td>
                      <td style={{ textAlign: 'center', padding: '5px 6px' }}>-</td>
                      <td style={{ textAlign: 'right', padding: '5px 6px' }}>-</td>
                      <td style={{ textAlign: 'center', padding: '5px 6px' }}>-</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, padding: '5px 6px' }}>-{lessDiscount.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #0f172a', fontWeight: 800 }}>
                    <td colSpan={6} style={{ textAlign: 'right', padding: '6px' }}>Total Net Taxable Value (₹):</td>
                    <td style={{ textAlign: 'right', padding: '6px', color: '#0f172a' }}>₹{totalTaxableValue.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>

              {/* HSN/SAC Tax Summary Box */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#334155', marginBottom: 4 }}>
                  HSN/SAC TAX SUMMARY BOX (DUAL-SLAB GST BREAKDOWN)
                </div>
                <table className="pms-table-compact" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, border: '1px solid #cbd5e1' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '4px 6px' }}>SAC Code</th>
                      <th style={{ padding: '4px 6px' }}>Category Description</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right' }}>Taxable Value (₹)</th>
                      <th style={{ padding: '4px 6px', textAlign: 'center' }}>GST Rate</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right' }}>CGST (₹)</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right' }}>SGST (₹)</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right' }}>IGST (₹)</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right' }}>Total Tax (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '4px 6px', fontWeight: 800 }}>996311</td>
                      <td style={{ padding: '4px 6px' }}>Hotel Accommodation &amp; Extra Bed</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{netRoomTaxable.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>{isComplimentary ? '0%' : '12%'}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{roomCgst.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{roomSgst.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{roomIgst.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>₹{roomTotalGst.toFixed(2)}</td>
                    </tr>
                    {foodAmount > 0 && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '4px 6px', fontWeight: 800 }}>996331</td>
                        <td style={{ padding: '4px 6px' }}>Vasudev Rasoi Food &amp; Beverage</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{foodTaxable.toFixed(2)}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center' }}>5%</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{foodCgst.toFixed(2)}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{foodSgst.toFixed(2)}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{foodIgst.toFixed(2)}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>₹{foodTotalGst.toFixed(2)}</td>
                      </tr>
                    )}
                    {addOthers > 0 && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '4px 6px', fontWeight: 800 }}>9997</td>
                        <td style={{ padding: '4px 6px' }}>Laundry &amp; Miscellaneous Services</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{miscTaxable.toFixed(2)}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center' }}>18%</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{miscCgst.toFixed(2)}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{miscSgst.toFixed(2)}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{miscIgst.toFixed(2)}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>₹{miscTotalGst.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc', borderTop: '1px solid #cbd5e1', fontWeight: 900 }}>
                      <td colSpan={2} style={{ padding: '4px 6px', textAlign: 'right' }}>TOTAL TAXES:</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{totalTaxableValue.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'center' }}>-</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{cgstAmount.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{sgstAmount.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{igstAmount.toFixed(2)}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: '#0f172a' }}>₹{gstAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Settlement Summary & Deductions Box */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 14 }}>
                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 10, lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>SETTLEMENT &amp; PAYMENT ALLOCATION</div>
                  <div><strong>Payment Modes:</strong> {paymentSplits.map(p => `${p.mode}: ₹${(Number(p.amount) || 0).toFixed(2)}${p.referenceNo ? ` (${p.referenceNo})` : ''}`).join(' + ')}</div>
                  <div><strong>Amount Paid at Checkout:</strong> ₹{totalPaidAtCheckout.toFixed(2)}</div>
                  {advanceDeducted > 0 && <div><strong>Advance Receipts Deducted:</strong> ₹{advanceDeducted.toFixed(2)}</div>}
                  <div><strong>Electronic Transfer:</strong> {companyInfo.bankName} &bull; A/C: {companyInfo.bankAccountNo} &bull; IFSC: {companyInfo.bankIfsc}</div>
                  <div><strong>UPI ID:</strong> {companyInfo.upiId} &bull; Main Branch Shirdi</div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, padding: 10, background: '#ffffff', fontSize: 11, lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Net Taxable Value:</span>
                    <span>₹{totalTaxableValue.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Dual-Slab GST:</span>
                    <span>₹{gstAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '1px solid #cbd5e1', paddingTop: 2 }}>
                    <span>Grand Invoice Total (Round):</span>
                    <span>₹{netBillAmount.toFixed(2)}</span>
                  </div>
                  {advanceDeducted > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c' }}>
                      <span>Less: Advance Deposit:</span>
                      <span>-₹{advanceDeducted.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 13, borderTop: '2px solid #0f172a', paddingTop: 3, color: '#15803d' }}>
                    <span>Net Payable Balance:</span>
                    <span>₹{netPayable.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontWeight: 800 }}>
                    <span>Amount Paid &amp; Settled:</span>
                    <span>₹{totalPaidAtCheckout.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: remainingToSettle === 0 ? '#166534' : '#dc2626' }}>
                    <span>Balance Due:</span>
                    <span>₹{remainingToSettle.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures & Sacred Pilgrim Message */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 12, borderTop: '1px solid #cbd5e1', paddingTop: 10, marginTop: 10, alignItems: 'flex-end', fontSize: 10 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: 40 }}></div>
                  <div style={{ borderTop: '1px dashed #64748b', paddingTop: 4, fontWeight: 700 }}>
                    Guest Signature
                  </div>
                </div>

                <div style={{ textAlign: 'center', color: '#475569', fontStyle: 'italic', padding: '0 8px' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#b45309', fontStyle: 'normal' }}>
                    🕉️ Om Sai Ram!
                  </div>
                  <div>Thank you for staying at Hotel Sai Vasudev Residency. May Shri Sai Baba bless you with peace &amp; prosperity. Have a blessed journey!</div>
                  <div style={{ fontWeight: 700, marginTop: 4, color: '#0f172a', fontStyle: 'normal' }}>
                    🔑 Please return your room key card to the reception desk.
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: 40 }}></div>
                  <div style={{ borderTop: '1px dashed #64748b', paddingTop: 4, fontWeight: 700 }}>
                    For HOTEL SAI VASUDEV RESIDENCY<br />
                    <span style={{ fontSize: 9, color: '#64748b' }}>Authorized Signatory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Format Bill Suite Modal */}
      <HotelBillFormatModal
        isOpen={isFullBillFormatOpen}
        onClose={() => setIsFullBillFormatOpen(false)}
        initialFormat={fullBillFormat}
        initialCheckout={{
          invoiceNo: activeInvoiceNo,
          roomNo: targetRoom.roomNo,
          roomType: targetRoom.roomType,
          guestName,
          guestPhone,
          checkInDate,
          checkInTime,
          checkOutDate,
          checkOutTime,
          calculationType,
          numberOfDays: noOfDays,
          perDayTariff,
          totalRoomRent: netRoomTaxable,
          foodAmount,
          gstPercent,
          gstAmount,
          cgstAmount,
          sgstAmount,
          addOthers,
          lessDiscount,
          advanceDeducted,
          billAmount: netBillAmount,
          netPayable,
          paymentMode: paymentSplits[0]?.mode || 'Cash',
          payments: paymentSplits,
          checkoutRemark,
          city: 'Shirdi',
          state: 'Maharashtra',
          country: 'India',
          pinCode: '423109',
          sacCode: '996311',
          invoiceFormat: 'A4_Standard'
        }}
      />

      {/* Decentro Dynamic UPI QR Modal with Real-Time Webhook Auto-Reconciliation */}
      <DecentroUpiQrModal
        isOpen={showDecentroQrModal}
        onClose={() => setShowDecentroQrModal(false)}
        amount={remainingToSettle > 0 ? remainingToSettle : netPayable}
        purpose={`Room ${targetRoom.roomNo} Settlement (${activeInvoiceNo})`}
        roomNo={targetRoom.roomNo}
        bookingId={guest ? (guest as any).bookingId : undefined}
        onPaymentSuccess={txn => {
          const nonUpiSplits = paymentSplits.filter(p => p.mode !== 'UPI');
          setPaymentSplits([
            ...nonUpiSplits,
            {
              mode: 'UPI',
              amount: txn.amount,
              referenceNo: txn.bank_reference_number || txn.reference_id,
              remark: `Decentro UPI Reconciled (${txn.payer_vpa || 'App'})`
            }
          ]);
          setShowDecentroQrModal(false);
        }}
      />

      {/* Decentro Dedicated Corporate Virtual Account Modal */}
      <DecentroVirtualAccountModal
        isOpen={showDecentroVaModal}
        onClose={() => setShowDecentroVaModal(false)}
        bookingId={guest ? (guest as any).bookingId : undefined}
        defaultCorporateName={companyName || 'Corporate Client'}
        onAccountCreated={va => {
          alert(`Dedicated Virtual Account ${va.account_number} (IFSC: ${va.ifsc_code}, ${va.bank_name}) generated successfully! Direct NEFT/RTGS/IMPS deposits will auto-credit this room.`);
        }}
      />
    </div>
  );
};
