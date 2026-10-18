import React, { useState, useEffect } from 'react';
import type { PmsRoom, PmsCheckOutDetail, PaymentSplit, PmsFoodBill, DayWiseRentItem } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';

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

  const defaultInvoiceNo = `GSR/${Math.floor(200 + Math.random() * 50)}/24-25`;
  const guest = targetRoom.currentGuest;
  const businessSettings = PmsStore.getBusinessSettings();

  // Basic Details
  const [invoiceNo] = useState(defaultInvoiceNo);
  const [checkInDate, setCheckInDate] = useState(guest?.checkInDate || '06-06-2025');
  const [checkInTime, setCheckInTime] = useState(guest?.checkInTime || '12:25 AM');
  const [checkOutDate, setCheckOutDate] = useState('07-06-2025');
  const [checkOutTime, setCheckOutTime] = useState('06:21 AM');
  const [calculationType, setCalculationType] = useState<'24hour' | '12hour'>(
    guest?.calculationType || businessSettings.calculationType || '12hour'
  );
  const [noOfDays, setNoOfDays] = useState(1);
  const [perDayTariff, setPerDayTariff] = useState(targetRoom.tariff || 1800);
  const [dayWiseRent, setDayWiseRent] = useState<DayWiseRentItem[]>([]);
  const [invoiceFormat, setInvoiceFormat] = useState<'A4_Standard' | 'A5_HalfPage' | 'Detailed'>('A4_Standard');
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  // Automatically recalculate day-wise rent matching Video 09 Frames 0240 & 0260
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

  // Food Bill automatically pulled from room account (Video 04 Frame 0230 / Spoken [10:30])
  const foodBills = PmsStore.getFoodBills().filter(f => f.roomNo === targetRoom.roomNo);
  const foodBillNo = foodBills[0]?.billNo || 'SHRI/252/24-25';
  const foodAmount = foodBills.reduce((s, f) => s + f.netBillAmount, 0) || targetRoom.foodAmount || 0;
  // Tax and Special Toggles (Video 04 [12:00, 12:45] / Video 05 [08:15])
  const [isMyCheckout, setIsMyCheckout] = useState(false);
  const activeInvoiceNo = isMyCheckout ? `MC/${targetRoom.roomNo}/24-25` : defaultInvoiceNo;
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  const [isComplimentary, setIsComplimentary] = useState(false);
  const [gstPercent, setGstPercent] = useState<number>(12);
  const [addOthers, setAddOthers] = useState<number>(0);
  const [lessDiscount, setLessDiscount] = useState<number>(0);

  // Video 23 Anti-Theft Staff Permission Evaluator (Frame 0140 & Spoken 02:40 - 05:30)
  const canChangeTariff = PmsStore.hasPermission('Change_Room_Tariff');
  const canChangeDateTime = PmsStore.hasPermission('Change_Date&Time');
  
  // Dynamic Advance Calculation (Video 06 Frame 0200)
  const roomAdvanceReceipts = PmsStore.getAdvanceReceiptsByRoom(targetRoom.roomNo);
  const totalAdvanceFromReceipts = roomAdvanceReceipts.reduce((sum, r) => sum + Number(r.amount), 0);
  const [advanceDeducted, setAdvanceDeducted] = useState<number>(
    totalAdvanceFromReceipts > 0 ? totalAdvanceFromReceipts : (guest?.advancePaid || 0)
  );

  // Pending KOTs enforcement (Video 05 [03:45 - 06:00])
  const [pendingKots, setPendingKots] = useState(PmsStore.getPendingKotsByRoom(targetRoom.roomNo));
  const pendingKotAmount = pendingKots.reduce((sum, k) => sum + k.totalAmount, 0);

  const handleClearKotsToFoodBill = () => {
    if (pendingKots.length === 0) return;
    const billRecord: PmsFoodBill = {
      billNo: `SHRI/${Math.floor(250 + Math.random() * 50)}/24-25`,
      date: checkOutDate,
      time: checkOutTime,
      roomNo: targetRoom.roomNo,
      guestName: guest?.name || 'ALOK JAIN',
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
    alert(`Pending KOTs cleared into Food Bill ${billRecord.billNo} and added to Room Account!`);
  };

  // Multi-Payment Splits (Video 04 Frame 0340 / Spoken [12:45])
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([
    { mode: 'Cash', amount: 939.99, referenceNo: '', remark: 'Cash Settlement' },
    { mode: 'Online', amount: 2000, referenceNo: 'UPI/786123', remark: 'PhonePe' }
  ]);
  const [paymentReference, setPaymentReference] = useState('5454353');
  const [paymentRemark, setPaymentRemark] = useState('PHONE PAY');

  // Customer Corporate/Personal Info
  const [companyName, setCompanyName] = useState('hindalko');
  const [companyAddress, setCompanyAddress] = useState('main road, renukot, m.p.');
  const [gstNumber, setGstNumber] = useState('23SJDHGSJDHGHS');
  const [checkoutRemark, setCheckoutRemark] = useState('Checked out peacefully. Key returned.');

  const companyInfo = PmsStore.getCompanyInfo();
  const [forceLocalGst, setForceLocalGst] = useState<boolean>(companyInfo.makeAllBillLocalGst);

  // Computations
  // If Tax Inclusive: base rate is derived so that Base + 12% GST = Total Tariff
  const rawRent = dayWiseRent.length > 0
    ? dayWiseRent.reduce((s, r) => s + r.rent, 0)
    : perDayTariff * noOfDays;
  const taxableRoomRent = isComplimentary
    ? 0
    : isTaxInclusive
    ? Number((rawRent / 1.12).toFixed(2))
    : rawRent;

  // Video 10 GST Calculation Engine
  const cleanPartyGstin = (gstNumber || '').trim();
  const partyStateCode = cleanPartyGstin.length >= 2 ? cleanPartyGstin.slice(0, 2) : '';
  const hotelStateCode = (companyInfo.companyGstCode || '27').trim();

  // If forceLocalGst is active: Local SGST + CGST for all guests regardless of state!
  const isLocalGst = forceLocalGst || !partyStateCode || partyStateCode === hotelStateCode;

  const halfPercent = gstPercent / 2;
  const cgstAmount = isComplimentary
    ? 0
    : isLocalGst
    ? isTaxInclusive
      ? Number(((rawRent - taxableRoomRent) / 2).toFixed(2))
      : Number(((taxableRoomRent * halfPercent) / 100).toFixed(2))
    : 0;

  const sgstAmount = isComplimentary
    ? 0
    : isLocalGst
    ? isTaxInclusive
      ? Number(((rawRent - taxableRoomRent) / 2).toFixed(2))
      : Number(((taxableRoomRent * halfPercent) / 100).toFixed(2))
    : 0;

  const igstAmount = isComplimentary
    ? 0
    : !isLocalGst
    ? isTaxInclusive
      ? Number((rawRent - taxableRoomRent).toFixed(2))
      : Number(((taxableRoomRent * gstPercent) / 100).toFixed(2))
    : 0;

  const gstAmount = isComplimentary
    ? 0
    : isLocalGst
    ? Number((cgstAmount + sgstAmount).toFixed(2))
    : igstAmount;

  const netBillAmount = isComplimentary
    ? 0
    : taxableRoomRent + gstAmount + foodAmount + addOthers - lessDiscount;

  const netPayable = Math.max(0, netBillAmount - advanceDeducted);

  const handleAddPaymentMode = () => {
    setPaymentSplits([
      ...paymentSplits,
      { mode: 'Cash', amount: 0, referenceNo: '', remark: '' }
    ]);
  };

  const handleUpdateSplit = (idx: number, field: keyof PaymentSplit, val: any) => {
    const updated = [...paymentSplits];
    updated[idx] = { ...updated[idx], [field]: val };
    setPaymentSplits(updated);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (pendingKots.length > 0) {
      alert("demo.datahouseerp.com says:\n\nCannot submit the form because Kot amount is greater than 0! Please convert all pending KOTs to Food Bill before checkout (Click '⚡ Clear to Food Bill' on the Pending Kot card).");
      return;
    }

    const checkoutData: PmsCheckOutDetail = {
      invoiceNo: activeInvoiceNo,
      roomNo: targetRoom.roomNo,
      roomType: targetRoom.roomType,
      guestName: guest?.name || 'akash ji',
      guestPhone: guest?.phone || '787846514',
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      calculationType,
      numberOfDays: noOfDays,
      perDayTariff,
      totalRoomRent: taxableRoomRent,
      foodAmount,
      foodBillNo,
      gstPercent: isComplimentary ? 0 : gstPercent,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      addOthers,
      lessDiscount,
      advanceDeducted,
      billAmount: netBillAmount,
      netPayable,
      paymentMode: paymentSplits[0]?.mode || 'Cash',
      payments: paymentSplits,
      checkoutRemark,
      gstNumber,
      companyName,
      companyAddress,
      sacCode: '996311',
      invoiceFormat,
      isTaxInclusive,
      isComplimentary,
      billingOfficer: 'DEMO0004',
      dayWiseRent
    };

    // Save checkout & mark room as Dirty (Red card 🧹)
    PmsStore.saveCheckout(checkoutData);

    // Video 22: Auto WhatsApp on checkout
    const waConfig = PmsStore.getWhatsAppConfig();
    if (waConfig.autoSendOnCheckOut && guest?.phone) {
      PmsStore.sendWhatsAppNotification({
        voucherType: 'Check_out_store',
        recipientMobile: guest.phone || '9822100042',
        recipientName: guest.name || 'Guest',
        voucherNo: activeInvoiceNo,
        roomNo: targetRoom.roomNo,
        templateParams: {
          checkout_date: checkOutDate,
          total_billamount: netPayable.toFixed(2)
        }
      });
    }

    onCheckoutComplete(checkoutData);
    setShowInvoicePreview(true);
  };

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div 
        className="pms-form-box" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: showInvoicePreview ? 920 : 1150 }}
      >
        {!showInvoicePreview ? (
          /* Master Checkout Folio Screen matching demo.datahouseerp.com/show_checkin/200 (Video 07 Frame 0080 & 0130) */
          <>
            <div className="pms-form-banner" style={{ background: '#84cc16', color: '#000', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>New Room Check Out Ente &bull; Room {targetRoom.roomNo} ({targetRoom.roomType})</span>
              <span style={{ fontSize: 11, background: '#0f172a', color: '#fff', padding: '2px 8px', borderRadius: 2, fontWeight: 800 }}>
                Inv: {activeInvoiceNo} &bull; demo.datahouseerp.com/show_checkin/200
              </span>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="pms-form-body">
              {/* Header Info matching Video 07 Frame 0080 & 0130 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 8,
                marginBottom: 12,
                borderBottom: '1px solid #cbd5e1'
              }}>
                <div>
                  <div style={{ fontSize: 11, color: '#0369a1', fontWeight: 700, textTransform: 'uppercase' }}>Selected Checkin Detail</div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                    {guest?.name || 'akash ji'} || {guest?.phone || '787846514'} || {targetRoom.roomNo}
                  </span>
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                    Stay Register: SR/193/24-25
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {/* My Checkout Button (Video 07 Frame 0080 / Spoken [05:15]) */}
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
                      background: isMyCheckout ? '#15803d' : '#dc2626',
                      color: '#fff',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: 3,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    title="Toggle Personal / Non-commercial stay (Video 07 Frame 0080)"
                  >
                    {isMyCheckout ? '✓ My Checkout (Personal)' : 'My Checkout'}
                  </button>

                  {/* Calculate Bill (Tax Inclusive) Button (Video 07 Frame 0130 / Spoken [03:45]) */}
                  <button
                    type="button"
                    onClick={() => {
                      const rawRent = perDayTariff * noOfDays;
                      const taxVal = Number((rawRent / 1.12).toFixed(2));
                      const gstVal = Number((rawRent - taxVal).toFixed(2));
                      setIsTaxInclusive(true);
                      alert(`demo.datahouseerp.com says\n\nTaxable Value: ${taxVal}\nGST /Tax value : ${gstVal}`);
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
                    title="Calculate Tax Inclusive (Video 07 Frame 0130)"
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

              {/* Guest Profile Details matching Video 09 Frame 0240 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1.5fr',
                gap: 8,
                background: '#f8fafc',
                padding: '6px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                marginBottom: 10
              }}>
                <div>
                  <label style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 800, display: 'block' }}>Nationality</label>
                  <input
                    type="text"
                    value="India"
                    readOnly
                    className="form-input-pms"
                    style={{ fontSize: 11, padding: '2px 6px', background: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 800, display: 'block' }}>Mobile</label>
                  <input
                    type="text"
                    value={guest?.phone || '787846514'}
                    readOnly
                    className="form-input-pms"
                    style={{ fontSize: 11, padding: '2px 6px', background: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 800, display: 'block' }}>Phone</label>
                  <input
                    type="text"
                    placeholder="Phone"
                    defaultValue=""
                    className="form-input-pms"
                    style={{ fontSize: 11, padding: '2px 6px', background: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 800, display: 'block' }}>Email</label>
                  <input
                    type="text"
                    placeholder="Email"
                    defaultValue={(guest as any)?.email || ''}
                    className="form-input-pms"
                    style={{ fontSize: 11, padding: '2px 6px', background: '#fff' }}
                  />
                </div>
              </div>

              {/* Stay Time & Policy Controls matching Video 09 Frames 0120 & 0240 */}
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
                marginBottom: 10
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
                      width: 85,
                      padding: '1px 4px',
                      fontSize: 11,
                      background: !canChangeDateTime ? '#e2e8f0' : '#ffffff',
                      cursor: !canChangeDateTime ? 'not-allowed' : 'text'
                    }}
                    title={!canChangeDateTime ? "🔒 Security Guard: Date modification locked to prevent backdating fraud (Video 23)" : undefined}
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
                    title={!canChangeDateTime ? "🔒 Security Guard: Time modification locked to prevent backdating fraud (Video 23)" : undefined}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ fontWeight: 800, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 3 }}>
                    Check-Out: {!canChangeDateTime && <span title="Locked for staff: Anti-Backdating fraud guard">🔒</span>}
                  </span>
                  <input
                    type="text"
                    value={checkOutDate}
                    onChange={e => setCheckOutDate(e.target.value)}
                    readOnly={!canChangeDateTime}
                    className="form-input-pms"
                    style={{
                      width: 85,
                      padding: '1px 4px',
                      fontSize: 11,
                      background: !canChangeDateTime ? '#e2e8f0' : '#ffffff',
                      cursor: !canChangeDateTime ? 'not-allowed' : 'text'
                    }}
                    title={!canChangeDateTime ? "🔒 Security Guard: Date modification locked to prevent backdating fraud (Video 23)" : undefined}
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
                    title={!canChangeDateTime ? "🔒 Security Guard: Time modification locked to prevent backdating fraud (Video 23)" : undefined}
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
                    Tariff/Day: {!canChangeTariff && <span title="Locked for staff: Anti-discount theft guard">🔒</span>}
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
                    title={!canChangeTariff ? "🔒 Security Guard: Room Tariff override locked for staff (Video 23)" : undefined}
                  />
                </div>
              </div>

              {/* 4 Multi-Card Inspection Grid matching Video 09 Frames 0240 & 0260 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.35fr 1.45fr', gap: 8, marginBottom: 12 }}>
                {/* Card 1: Pending Kot List (Frame 0240 / 0260) */}
                <div style={{ border: '1px solid #38bdf8', borderRadius: 2, background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    background: '#bef264',
                    color: '#000000',
                    fontWeight: 800,
                    fontSize: 11,
                    padding: '4px 8px',
                    borderBottom: '1px solid #a3e635'
                  }}>
                    Pending Kot List
                  </div>
                  <div style={{ overflowX: 'auto', minHeight: 110, maxHeight: 130, flex: 1, padding: 2 }}>
                    <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                          <th style={{ padding: '2px 4px' }}>S.No</th>
                          <th style={{ padding: '2px 4px' }}>Date</th>
                          <th style={{ padding: '2px 4px' }}>KOT No</th>
                          <th style={{ padding: '2px 4px' }}>Total Qty</th>
                          <th style={{ padding: '2px 4px', textAlign: 'right' }}>Total Amou</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingKots.length > 0 ? (
                          pendingKots.map((k, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '2px 4px' }}>{idx + 1}</td>
                              <td style={{ padding: '2px 4px' }}>{k.date || k.createdAt?.slice(0, 10) || '06-06-2025'}</td>
                              <td style={{ padding: '2px 4px', fontWeight: 700 }}>{k.kotNo}</td>
                              <td style={{ padding: '2px 4px' }}>{k.items.reduce((s, i) => s + i.qty, 0)}</td>
                              <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 700 }}>₹{k.totalAmount.toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ padding: '12px 4px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                              No Pending KOTs
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding: '4px 6px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                      type="text"
                      readOnly
                      value={pendingKotAmount.toFixed(2)}
                      className="form-input-pms"
                      style={{ width: 70, fontSize: 10, padding: '1px 4px', fontWeight: 700, background: '#fff' }}
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

                {/* Card 2: Pending Food Bill (Frame 0240 / 0260) */}
                <div style={{ border: '1px solid #38bdf8', borderRadius: 2, background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    background: '#bef264',
                    color: '#000000',
                    fontWeight: 800,
                    fontSize: 11,
                    padding: '4px 8px',
                    borderBottom: '1px solid #a3e635'
                  }}>
                    Pending Food Bill
                  </div>
                  <div style={{ overflowX: 'auto', minHeight: 110, maxHeight: 130, flex: 1, padding: 2 }}>
                    <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                          <th style={{ padding: '2px 4px' }}>S.No</th>
                          <th style={{ padding: '2px 4px' }}>Date</th>
                          <th style={{ padding: '2px 4px' }}>Bill No</th>
                          <th style={{ padding: '2px 4px' }}>Total Qty</th>
                          <th style={{ padding: '2px 4px', textAlign: 'right' }}>Total Amou</th>
                        </tr>
                      </thead>
                      <tbody>
                        {foodBills.length > 0 ? (
                          foodBills.map((fb, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '2px 4px' }}>{idx + 1}</td>
                              <td style={{ padding: '2px 4px' }}>{fb.date}</td>
                              <td style={{ padding: '2px 4px', fontWeight: 700 }}>{fb.billNo}</td>
                              <td style={{ padding: '2px 4px' }}>{fb.items.reduce((s, i) => s + i.qty, 0)}</td>
                              <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 700 }}>₹{fb.netBillAmount.toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ padding: '12px 4px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                              No Pending Food Bill
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding: '4px 6px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <input
                      type="text"
                      readOnly
                      value={foodAmount.toFixed(2)}
                      className="form-input-pms"
                      style={{ width: 70, fontSize: 10, padding: '1px 4px', fontWeight: 700, background: '#fff' }}
                      title="Total Food Bill Amount"
                    />
                  </div>
                </div>

                {/* Card 3: Day Wise Rent (Frame 0240 / 0260) */}
                <div style={{ border: '1px solid #38bdf8', borderRadius: 2, background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
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
                    <span>Day Wise Rent</span>
                    <span style={{ fontSize: 9, background: '#0f172a', color: '#fff', padding: '1px 4px', borderRadius: 2 }}>
                      {calculationType === '12hour' ? '12-Hour' : '24-Hour'}
                    </span>
                  </div>
                  <div style={{ overflowX: 'auto', minHeight: 110, maxHeight: 130, flex: 1, padding: 2 }}>
                    <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                          <th style={{ padding: '2px 4px' }}>Start Date</th>
                          <th style={{ padding: '2px 4px' }}>End Date</th>
                          <th style={{ padding: '2px 4px', textAlign: 'center' }}>Day Count</th>
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
                  <div style={{
                    padding: '4px 6px',
                    borderTop: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 10
                  }}>
                    <span>Days: <strong>{noOfDays}</strong></span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>Total Rent:</span>
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

                {/* Card 4: Right Settlement Box (Green Border Outline - Frame 0240 / 0260) */}
                <div style={{
                  border: '2px solid #84cc16',
                  borderRadius: 4,
                  background: '#f8fafc',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  {/* Less Discount (-) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#334155', display: 'flex', alignItems: 'center', gap: 3 }}>
                      Less Discount (-) {!canChangeTariff && <span title="Discount locked for staff account">🔒</span>}
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
                        padding: '2px 4px',
                        textAlign: 'right',
                        background: !canChangeTariff ? '#e2e8f0' : '#ffffff',
                        cursor: !canChangeTariff ? 'not-allowed' : 'text'
                      }}
                      title={!canChangeTariff ? "🔒 Security Guard: Discount modification locked for staff (Video 23)" : undefined}
                    />
                  </div>

                  {/* Bill Amount */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>Bill Amount</span>
                    <input
                      type="text"
                      readOnly
                      value={netBillAmount.toFixed(2)}
                      className="form-input-pms"
                      style={{ width: 85, fontSize: 10, padding: '2px 4px', textAlign: 'right', fontWeight: 800, background: '#fff' }}
                    />
                  </div>

                  {/* Total Advance */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#334155' }}>Total Advance</span>
                    <input
                      type="number"
                      value={advanceDeducted}
                      onChange={e => setAdvanceDeducted(Number(e.target.value))}
                      className="form-input-pms"
                      style={{ width: 85, fontSize: 10, padding: '2px 4px', textAlign: 'right' }}
                    />
                  </div>

                  {/* Balance To Pay + Recalculate */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#15803d' }}>Balance To Pay</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => alert(`Folio Recalculated:\nRent (${noOfDays} days): ₹${taxableRoomRent}\nGST (12%): ₹${gstAmount}\nFood: ₹${foodAmount}\nAdvance: -₹${advanceDeducted}\nNet: ₹${netPayable}`)}
                        style={{
                          background: '#475569',
                          color: '#fff',
                          border: 'none',
                          padding: '1px 5px',
                          borderRadius: 2,
                          fontSize: 9,
                          cursor: 'pointer'
                        }}
                      >
                        Recalculate
                      </button>
                      <input
                        type="text"
                        readOnly
                        value={netPayable.toFixed(2)}
                        className="form-input-pms"
                        style={{ width: 75, fontSize: 10, padding: '2px 4px', textAlign: 'right', fontWeight: 800, background: '#dcfce7', color: '#166534' }}
                      />
                    </div>
                  </div>

                  {/* Select Mode */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                    <select
                      value={paymentSplits[0]?.mode || 'Cash'}
                      onChange={e => handleUpdateSplit(0, 'mode', e.target.value)}
                      className="form-select-pms"
                      style={{ fontSize: 10, padding: '1px 4px', flex: 1 }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online">Online</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Credit">Credit</option>
                    </select>
                    <input
                      type="number"
                      value={paymentSplits[0]?.amount || 0}
                      onChange={e => handleUpdateSplit(0, 'amount', Number(e.target.value))}
                      className="form-input-pms"
                      style={{ width: 75, fontSize: 10, padding: '2px 4px', textAlign: 'right' }}
                    />
                  </div>

                  {/* + Payment Mode Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                    <button
                      type="button"
                      onClick={handleAddPaymentMode}
                      style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        padding: '2px 8px',
                        borderRadius: 2,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      + Payment Mode
                    </button>
                    {paymentSplits.length > 1 ? (
                      <input
                        type="number"
                        value={paymentSplits[1]?.amount || 0}
                        onChange={e => handleUpdateSplit(1, 'amount', Number(e.target.value))}
                        className="form-input-pms"
                        style={{ width: 75, fontSize: 10, padding: '2px 4px', textAlign: 'right' }}
                      />
                    ) : (
                      <input
                        type="text"
                        disabled
                        placeholder="Split Amount"
                        className="form-input-pms"
                        style={{ width: 75, fontSize: 10, padding: '2px 4px', background: '#f1f5f9' }}
                      />
                    )}
                  </div>

                  {/* Credit to guest */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#475569' }}>Credit to {guest?.name || 'akash ji'}</span>
                    <input
                      type="number"
                      defaultValue={0}
                      className="form-input-pms"
                      style={{ width: 75, fontSize: 10, padding: '2px 4px', textAlign: 'right' }}
                    />
                  </div>

                  {/* Balance */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#475569' }}>Balance</span>
                    <input
                      type="number"
                      defaultValue={0}
                      className="form-input-pms"
                      style={{ width: 75, fontSize: 10, padding: '2px 4px', textAlign: 'right' }}
                    />
                  </div>

                  {/* Payment Reference */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#475569' }}>Payment Reference</span>
                    <input
                      type="text"
                      placeholder="Ref / UTR"
                      value={paymentReference}
                      onChange={e => setPaymentReference(e.target.value)}
                      className="form-input-pms"
                      style={{ width: 75, fontSize: 10, padding: '2px 4px' }}
                    />
                  </div>

                  {/* Payment Remark */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#475569' }}>Payment Remark</span>
                    <input
                      type="text"
                      placeholder="Remark"
                      value={paymentRemark}
                      onChange={e => setPaymentRemark(e.target.value)}
                      className="form-input-pms"
                      style={{ width: 75, fontSize: 10, padding: '2px 4px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Corporate GST & Discount Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Company Name</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Party GSTIN</label>
                  <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Other Charge (₹)</label>
                  <input type="number" min="0" value={addOthers} onChange={e => setAddOthers(Number(e.target.value))} className="form-input-pms" />
                </div>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Discount (₹)</label>
                  <input type="number" min="0" value={lessDiscount} onChange={e => setLessDiscount(Number(e.target.value))} className="form-input-pms" />
                </div>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">GST Rate</label>
                  <select value={gstPercent} onChange={e => setGstPercent(Number(e.target.value))} className="form-select-pms" disabled={isComplimentary}>
                    <option value={12}>12% GST (Standard)</option>
                    <option value={18}>18% GST (Luxury)</option>
                    <option value={0}>0% (Exempt)</option>
                  </select>
                </div>
              </div>

              {/* Video 10 GST Calculation Status & Local Policy Banner */}
              <div style={{
                background: isComplimentary ? '#f8fafc' : isLocalGst ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${isComplimentary ? '#cbd5e1' : isLocalGst ? '#86efac' : '#fde68a'}`,
                padding: '6px 12px',
                borderRadius: 4,
                marginBottom: 10,
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
                      ? `LOCAL SALES (SGST ${halfPercent}% + CGST ${halfPercent}%)`
                      : `INTERSTATE SALES (IGST ${gstPercent}%)`}
                  </span>
                  <span style={{ color: '#475569', fontSize: 10 }}>
                    {forceLocalGst
                      ? '✓ Local GST Forced by Hotel Settings (Make All Bill Local GST = True)'
                      : partyStateCode && partyStateCode !== hotelStateCode
                      ? `Interstate Party: State ${partyStateCode} != Hotel State ${hotelStateCode} (Maharashtra)`
                      : `Intrastate Party: Maharashtra State Code ${hotelStateCode}`}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontWeight: 700, color: '#0369a1', fontSize: 11 }}>
                    <input
                      type="checkbox"
                      checked={forceLocalGst}
                      onChange={e => setForceLocalGst(e.target.checked)}
                    />
                    <span>Make All Bill Local GST (Video 10)</span>
                  </label>

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
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 8, marginBottom: 12 }}>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Company Address</label>
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={e => setCompanyAddress(e.target.value)}
                    className="form-input-pms"
                    placeholder="e.g. main road, renukot, m.p."
                  />
                </div>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Checkout Remark / Keys</label>
                  <input
                    type="text"
                    value={checkoutRemark}
                    onChange={e => setCheckoutRemark(e.target.value)}
                    className="form-input-pms"
                    placeholder="e.g. Checked out peacefully. Key returned."
                  />
                </div>
              </div>

              {/* Financial Summary */}
              <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12 }}>
                  Room Rent: <strong>₹{taxableRoomRent.toFixed(2)}</strong> &bull;
                  GST ({gstPercent}%): <strong>₹{gstAmount.toFixed(2)}</strong> &bull;
                  Food: <strong>₹{foodAmount.toFixed(2)}</strong> &bull;
                  Advance: <strong style={{ color: '#b91c1c' }}>-₹{advanceDeducted.toFixed(2)}</strong>
                </span>

                <span style={{ fontSize: 14, fontWeight: 900, color: '#15803d' }}>
                  Net Payable: ₹{netPayable.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons (Frame 0340) */}
              <div className="pms-btn-group" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '6px 18px', borderRadius: 3, fontWeight: 700, cursor: 'pointer' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 22px', borderRadius: 3, fontWeight: 800, cursor: 'pointer' }}
                >
                  Save &amp; Generate Invoice
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Multi-Format Tax Invoice matching demo.datahouseerp.com/room_checkout_view3/222 (Frame 0420) */
          <div>
            {/* Format Switcher Toolbar (Video 04 [13:30 - 14:15]) */}
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
                  A4 Standard
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceFormat('A5_HalfPage')}
                  style={{
                    background: invoiceFormat === 'A5_HalfPage' ? '#38bdf8' : '#334155',
                    color: invoiceFormat === 'A5_HalfPage' ? '#0f172a' : '#fff',
                    border: 'none',
                    padding: '3px 10px',
                    borderRadius: 3,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  A5 Half-Page
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
                  Detailed
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  🖨️ Print
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Exporting Tax Invoice as PDF...');
                    window.print();
                  }}
                  style={{ background: '#d97706', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  📄 PDF
                </button>
                {/* Video 22: Send WhatsApp Bill */}
                <button
                  type="button"
                  onClick={() => {
                    const guestPhone = guest?.phone || '9822100042';
                    PmsStore.sendWhatsAppNotification({
                      voucherType: 'Check_out_store',
                      recipientMobile: guestPhone,
                      recipientName: guest?.name || 'Guest',
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
                  title="Send digital tax invoice & thank you message to guest on WhatsApp"
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

            {/* Printable Tax Invoice Body matching Frame 0420 & Video 07 Frame 0290 */}
            <div id="printable-tax-invoice" style={{ padding: 18, background: '#fff', fontSize: 12, color: '#0f172a' }}>
              {invoiceFormat === 'Detailed' ? (
                /* Video 07 Frame 0290 Detailed Yellow Header & Two-Column Split */
                <div>
                  <div style={{ background: '#facc15', border: '1px solid #eab308', padding: '10px 14px', borderRadius: 4, marginBottom: 10, textAlign: 'center', position: 'relative' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#000' }}>GST NO: {companyInfo.gstNo}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, margin: '2px 0' }}>INVOICE</div>
                    <div style={{ fontSize: 17, fontWeight: 800, textTransform: 'uppercase' }}>{companyInfo.firmName}</div>
                    <div style={{ fontSize: 10, fontWeight: 600 }}>{companyInfo.address1}, {companyInfo.city} - {companyInfo.pincode} ({companyInfo.state})</div>
                    <div style={{ fontSize: 10, fontWeight: 600 }}>India Email: {companyInfo.email} Phone Mobile {companyInfo.mobile}</div>
                    <div style={{ position: 'absolute', right: 14, top: 12, border: '1px solid #ca8a04', background: '#fef08a', padding: '4px 8px', fontSize: 9, fontWeight: 700 }}>
                      [QR Code]
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', padding: 8, borderRadius: 3, fontSize: 11 }}>
                      <div style={{ fontWeight: 800, borderBottom: '1px solid #7dd3fc', paddingBottom: 3, marginBottom: 4, color: '#0369a1' }}>Guest Detail</div>
                      <div><strong>Guest Name:</strong> {guest?.name || 'akash ji'}</div>
                      <div><strong>Add:</strong> {companyAddress || 'Shirdi'}</div>
                      <div><strong>City:</strong> Shirdi</div>
                      <div><strong>State:</strong> Maharashtra</div>
                      <div><strong>Mob:</strong> {guest?.phone || '787846514'}</div>
                      <div><strong>Email:</strong> {guest?.phone ? `${guest.phone}@guest.in` : '-'}</div>
                      <div><strong>GST NO:</strong> {gstNumber || '-'}</div>
                    </div>

                    <div style={{ background: '#fef08a', border: '1px solid #fde047', padding: 8, borderRadius: 3, fontSize: 11 }}>
                      <div style={{ fontWeight: 800, borderBottom: '1px solid #fde047', paddingBottom: 3, marginBottom: 4, color: '#854d0e' }}>Detail</div>
                      <div><strong>Invoice No:</strong> {invoiceNo}</div>
                      <div><strong>Check In Date:</strong> {checkInDate}</div>
                      <div><strong>Check In Time:</strong> {checkInTime}</div>
                      <div><strong>Check Out Date:</strong> {checkOutDate}</div>
                      <div><strong>Check Out Time:</strong> {checkOutTime}</div>
                      <div><strong>Total Day:</strong> {noOfDays}</div>
                      <div><strong>Room No:</strong> {targetRoom.roomNo} ({targetRoom.roomType})</div>
                    </div>
                  </div>

                  <table className="pms-table-compact" style={{ marginBottom: 12 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ width: 45 }}>S.No</th>
                        <th>Particulars</th>
                        <th style={{ width: 60, textAlign: 'center' }}>Days</th>
                        <th style={{ width: 120, textAlign: 'right' }}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>1</td>
                        <td>Room Rent Per Day - {perDayTariff.toFixed(2)}</td>
                        <td style={{ textAlign: 'center' }}>{noOfDays}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{taxableRoomRent.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>2</td>
                        <td>GST % ({gstPercent}%)</td>
                        <td style={{ textAlign: 'center' }}>-</td>
                        <td style={{ textAlign: 'right' }}>{gstAmount.toFixed(2)}</td>
                      </tr>
                      <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                        <td>3</td>
                        <td>Total Room Tariff</td>
                        <td style={{ textAlign: 'center' }}>-</td>
                        <td style={{ textAlign: 'right' }}>{(taxableRoomRent + gstAmount).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>4</td>
                        <td>Food Amount</td>
                        <td style={{ textAlign: 'center' }}>-</td>
                        <td style={{ textAlign: 'right' }}>{foodAmount.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>5</td>
                        <td>Add Other Charge</td>
                        <td style={{ textAlign: 'center' }}>-</td>
                        <td style={{ textAlign: 'right' }}>{addOthers.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>6</td>
                        <td>Less Discount</td>
                        <td style={{ textAlign: 'center' }}>-</td>
                        <td style={{ textAlign: 'right', color: '#dc2626' }}>{lessDiscount > 0 ? `-${lessDiscount.toFixed(2)}` : '0.00'}</td>
                      </tr>
                      <tr style={{ background: '#e0f2fe', fontWeight: 800, fontSize: 13 }}>
                        <td colSpan={3} style={{ textAlign: 'right' }}>Net Bill Amount:</td>
                        <td style={{ textAlign: 'right', color: '#0369a1' }}>₹{netBillAmount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Standard & Half-Page Formats */
                <>
                  {/* Hotel Header */}
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: 8, marginBottom: 10 }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: 1 }}>
                      {companyInfo.firmName}
                    </h2>
                    <div style={{ fontSize: 11, color: '#475569' }}>
                      {companyInfo.address1}, {companyInfo.city}, {companyInfo.state} - {companyInfo.pincode} &bull; GSTIN: {companyInfo.gstNo}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', marginTop: 4, letterSpacing: 1 }}>
                      TAX INVOICE (GUEST CHECKOUT)
                    </div>
                  </div>

                  {/* Guest & Stay Details Grid (Frame 0420) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, borderBottom: '1px solid #cbd5e1', paddingBottom: 8, marginBottom: 10 }}>
                    <div>
                      <div><strong>Company:</strong> {companyName || 'N/A'}</div>
                      <div><strong>Address:</strong> {companyAddress || 'Main Road'}</div>
                      <div><strong>Guest Name:</strong> {guest?.name || 'sunil agrwal'}</div>
                      <div><strong>Mobile:</strong> {guest?.phone || '7676767674'}</div>
                      <div><strong>Party's GSTIN:</strong> {gstNumber || 'N/A'}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div><strong>Invoice No:</strong> {invoiceNo}</div>
                      <div><strong>Departure Date:</strong> {checkOutDate}</div>
                      <div><strong>Departure Time:</strong> {checkOutTime}</div>
                      <div><strong>Billing Officer:</strong> DEMO0004</div>
                      <div><strong>Room No:</strong> {targetRoom.roomNo} ({targetRoom.roomType})</div>
                    </div>
                  </div>

                  {/* Invoice Particulars Table (Frame 0420) */}
                  <table className="pms-table-compact" style={{ marginBottom: 10 }}>
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Particulars</th>
                        <th>Days</th>
                        <th>Rate (₹)</th>
                        <th>GST</th>
                        <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>1</td>
                        <td style={{ fontWeight: 700 }}>{targetRoom.roomType} (Room {targetRoom.roomNo})</td>
                        <td>{noOfDays}</td>
                        <td>{(taxableRoomRent / noOfDays).toFixed(2)}</td>
                        <td>{gstPercent.toFixed(2)}%</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{taxableRoomRent.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}

              {/* Financial Sub-Calculations (Frame 0420) */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <div style={{ width: 280, fontSize: 11, lineHeight: 1.7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>SGST ({isLocalGst ? halfPercent.toFixed(2) : '0.00'}%):</span>
                    <span style={{ fontWeight: isLocalGst && sgstAmount > 0 ? 700 : 400 }}>₹{sgstAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>CGST ({isLocalGst ? halfPercent.toFixed(2) : '0.00'}%):</span>
                    <span style={{ fontWeight: isLocalGst && cgstAmount > 0 ? 700 : 400 }}>₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>IGST ({!isLocalGst ? gstPercent.toFixed(2) : '0.00'}%):</span>
                    <span style={{ fontWeight: !isLocalGst && igstAmount > 0 ? 700 : 400, color: !isLocalGst && igstAmount > 0 ? '#b45309' : undefined }}>
                      ₹{igstAmount.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: 2 }}>
                    <span>Food Amount ({foodBillNo}):</span>
                    <span>₹{foodAmount.toFixed(2)}</span>
                  </div>
                  {addOthers > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Add Other Charge:</span>
                      <span>₹{addOthers.toFixed(2)}</span>
                    </div>
                  )}
                  {lessDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                      <span>Less Discount:</span>
                      <span>-₹{lessDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #cbd5e1', paddingTop: 2 }}>
                    <span>Net Bill Amount:</span>
                    <span>₹{netBillAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c' }}>
                    <span>Less Advance:</span>
                    <span>-₹{advanceDeducted.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 13, borderTop: '2px solid #0f172a', paddingTop: 4, color: '#15803d' }}>
                    <span>Net Payable Amount:</span>
                    <span>₹{netPayable.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* SAC Code & GST Breakup Box (Frame 0420) */}
              <table className="pms-table-compact" style={{ marginBottom: 12, fontSize: 11 }}>
                <thead>
                  <tr>
                    <th>SAC Code</th>
                    <th>Taxable Amount (₹)</th>
                    <th>GST %</th>
                    <th>SGST (₹)</th>
                    <th>CGST (₹)</th>
                    <th>IGST (₹)</th>
                    <th>Total Tax (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 800 }}>996311</td>
                    <td>₹{taxableRoomRent.toFixed(2)}</td>
                    <td>{gstPercent.toFixed(2)}%</td>
                    <td>₹{sgstAmount.toFixed(2)}</td>
                    <td>₹{cgstAmount.toFixed(2)}</td>
                    <td>₹0.00</td>
                    <td style={{ fontWeight: 800 }}>₹{gstAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Bank Details (Frame 0420) */}
              <div style={{ background: '#f8fafc', padding: 8, borderRadius: 3, border: '1px solid #e2e8f0', fontSize: 10, marginBottom: 12 }}>
                <strong>Bank Details for Electronic Transfer:</strong> Bank Name: <strong>STATE BANK OF INDIA</strong> &bull; Bank A/C No: <strong>389201948210</strong> &bull; IFSC: <strong>SBIN0001234</strong> &bull; Branch: <strong>SHIRDI TEMPLE ROAD</strong>
              </div>

              {/* Footer with Key Drop Notice & Payment Completed Badge (Frame 0420) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #cbd5e1', paddingTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 24 }}>🔑</span>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
                    PLEASE REMEMBER TO DROP YOUR ROOM KEYS AT THE FRONT DESK
                  </div>
                </div>

                <div style={{
                  background: '#dcfce7',
                  border: '1px solid #86efac',
                  padding: '4px 12px',
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#166534',
                  fontSize: 11,
                  fontWeight: 800
                }}>
                  <span>✓</span>
                  <span>Payment Completed &bull; Room Checked Out</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
