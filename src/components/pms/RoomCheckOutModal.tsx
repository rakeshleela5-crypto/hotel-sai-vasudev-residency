import React, { useState } from 'react';
import type { PmsRoom, PmsCheckOutDetail, PaymentSplit, PmsFoodBill } from '../../types/pmsModels';
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
  // Basic Details
  const [invoiceNo] = useState(defaultInvoiceNo);
  const [checkInDate] = useState(guest?.checkInDate || '06-06-2025');
  const [checkInTime] = useState(guest?.checkInTime || '12:25 AM');
  const [checkOutDate, setCheckOutDate] = useState('07-06-2025');
  const [checkOutTime, setCheckOutTime] = useState('06:21 AM');
  const [calculationType, setCalculationType] = useState<'24hour' | '12hour'>(
    guest?.calculationType || '24hour'
  );
  const [noOfDays, setNoOfDays] = useState(2);
  const [perDayTariff, setPerDayTariff] = useState(targetRoom.tariff || 1800);
  const [invoiceFormat, setInvoiceFormat] = useState<'A4_Standard' | 'A5_HalfPage' | 'Detailed'>('A4_Standard');
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

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

  // Computations
  // If Tax Inclusive: base rate is derived so that Base + 12% GST = Total Tariff
  const rawRent = perDayTariff * noOfDays;
  const taxableRoomRent = isComplimentary
    ? 0
    : isTaxInclusive
    ? Number((rawRent / 1.12).toFixed(2))
    : rawRent;

  const gstAmount = isComplimentary
    ? 0
    : isTaxInclusive
    ? Number((rawRent - taxableRoomRent).toFixed(2))
    : Number(((taxableRoomRent * gstPercent) / 100).toFixed(2));

  const cgstAmount = Number((gstAmount / 2).toFixed(2));
  const sgstAmount = Number((gstAmount / 2).toFixed(2));

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
      alert("Cannot submit: Total Pending KOT is greater than 0! Please convert all pending KOTs to Food Bill before checkout (Click '⚡ Clear to Food Bill' on the Pending Kot card).");
      return;
    }

    const checkoutData: PmsCheckOutDetail = {
      invoiceNo: activeInvoiceNo,
      roomNo: targetRoom.roomNo,
      roomType: targetRoom.roomType,
      guestName: guest?.name || 'ALOK JAIN',
      guestPhone: guest?.phone || '9407525111',
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
      igstAmount: 0,
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
      billingOfficer: 'DEMO0004'
    };

    // Save checkout & mark room as Dirty (Red card 🧹)
    PmsStore.saveCheckout(checkoutData);

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
          /* Master Checkout Folio Screen matching demo.datahouseerp.com/show_checkin/188 (Frame 0340) */
          <>
            <div className="pms-form-banner banner-navy" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Room Checkout Settlement Folio &bull; Room {targetRoom.roomNo} ({targetRoom.roomType})</span>
              <span style={{ fontSize: 11, background: '#38bdf8', color: '#0f172a', padding: '2px 8px', borderRadius: 2, fontWeight: 800 }}>
                Inv: {activeInvoiceNo}
              </span>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="pms-form-body">
              {/* Header Info matching Frame 0260 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 8,
                marginBottom: 12,
                borderBottom: '1px solid #cbd5e1'
              }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0369a1' }}>
                    Guest: {guest?.name || 'ALOK JAIN'}
                  </span>
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                    Contact: {guest?.phone || '9407525111'} &bull; Stay Register: SR/193/24-25
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {/* My Checkout Button (Video 05 Frame 0260 / Spoken [08:15]) */}
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
                    title="Toggle Personal / Non-commercial stay (Frame 0260 / Spoken 08:15)"
                  >
                    {isMyCheckout ? '✓ My Checkout (Personal)' : 'My Checkout'}
                  </button>

                  <label style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="checkbox"
                      checked={isTaxInclusive}
                      onChange={e => setIsTaxInclusive(e.target.checked)}
                    />
                    Tax Inclusive
                  </label>

                  <label style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="checkbox"
                      checked={isComplimentary}
                      onChange={e => setIsComplimentary(e.target.checked)}
                    />
                    Complimentary / Non-GST
                  </label>
                </div>
              </div>

              {/* 4 Multi-Card Inspection Grid (Frame 0180 / 0340) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr 1.6fr', gap: 10, marginBottom: 12 }}>
                {/* Card 1: Pending Kot List (Video 05 [03:45 - 06:00]) */}
                <div style={{ border: pendingKots.length > 0 ? '2px solid #ef4444' : '1px solid #93c5fd', borderRadius: 4, background: '#f8fafc', padding: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#1e40af', borderBottom: '1px solid #bfdbfe', paddingBottom: 4, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Pending Kot List</span>
                    <span style={{ background: pendingKots.length > 0 ? '#ef4444' : '#16a34a', color: '#fff', padding: '1px 5px', borderRadius: 2, fontSize: 9, fontWeight: 800 }}>
                      {pendingKots.length} Pending
                    </span>
                  </div>
                  <div style={{ maxHeight: 110, overflowY: 'auto', fontSize: 11 }}>
                    {pendingKots.map((k, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span>{k.kotNo} ({k.items[0]?.itemName || 'Order'})</span>
                        <strong>₹{k.totalAmount.toFixed(2)}</strong>
                      </div>
                    ))}
                    {pendingKots.length === 0 && (
                      <div style={{ color: '#16a34a', fontStyle: 'italic', padding: '8px 0', textAlign: 'center' }}>
                        ✓ All KOTs cleared to Food Bill
                      </div>
                    )}
                  </div>
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 4, marginTop: 4, fontSize: 11, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Pending: ₹{pendingKotAmount.toFixed(2)}</span>
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

                {/* Card 2: Pending Food Bill (Frame 0180) */}
                <div style={{ border: '1px solid #6ee7b7', borderRadius: 4, background: '#f0fdf4', padding: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#065f46', borderBottom: '1px solid #a7f3d0', paddingBottom: 4, marginBottom: 6 }}>
                    Pending Food Bill
                  </div>
                  <div style={{ fontSize: 11 }}>
                    <div><strong>Bill No:</strong> {foodBillNo}</div>
                    <div><strong>Date:</strong> {checkOutDate}</div>
                    <div><strong>Taxable:</strong> ₹{foodAmount > 0 ? (foodAmount / 1.05).toFixed(2) : '0.00'}</div>
                    <div><strong>5% GST:</strong> ₹{foodAmount > 0 ? (foodAmount - (foodAmount / 1.05)).toFixed(2) : '0.00'}</div>
                    <div style={{ marginTop: 4, fontWeight: 800, color: '#16a34a' }}>Net Billed: ₹{foodAmount.toFixed(2)}</div>
                  </div>
                </div>

                {/* Card 3: Room Stay Report */}
                <div style={{ border: '1px solid #fed7aa', borderRadius: 4, background: '#fffbeb', padding: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#9a3412', borderBottom: '1px solid #fde68a', paddingBottom: 4, marginBottom: 6 }}>
                    Room Stay Report
                  </div>
                  <div style={{ fontSize: 11 }}>
                    <div><strong>Check In:</strong> {checkInDate} {checkInTime}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <span><strong>Out:</strong></span>
                      <input
                        type="text"
                        value={checkOutDate}
                        onChange={e => setCheckOutDate(e.target.value)}
                        className="form-input-pms"
                        style={{ width: 75, padding: '1px 4px', fontSize: 10 }}
                      />
                      <input
                        type="text"
                        value={checkOutTime}
                        onChange={e => setCheckOutTime(e.target.value)}
                        className="form-input-pms"
                        style={{ width: 60, padding: '1px 4px', fontSize: 10 }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <span>Calc:</span>
                      <select
                        value={calculationType}
                        onChange={e => setCalculationType(e.target.value as '24hour' | '12hour')}
                        className="form-select-pms"
                        style={{ padding: '1px 4px', fontSize: 10, flex: 1 }}
                      >
                        <option value="24hour">24 Hours</option>
                        <option value="12hour">12 Hours</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span>Days:</span>
                      <input
                        type="number"
                        min="1"
                        value={noOfDays}
                        onChange={e => setNoOfDays(Number(e.target.value))}
                        className="form-input-pms"
                        style={{ width: 55, padding: '2px 4px', fontWeight: 800 }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span>Rate/Day:</span>
                      <input
                        type="number"
                        value={perDayTariff}
                        onChange={e => setPerDayTariff(Number(e.target.value))}
                        className="form-input-pms"
                        style={{ width: 75, padding: '2px 4px', fontWeight: 800 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card 4: Settlement Box with Green Outline (Frame 0340) */}
                <div style={{ border: '2px solid #22c55e', borderRadius: 4, background: '#f8fafc', padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#15803d' }}>Balance To Pay</span>
                    <button
                      type="button"
                      onClick={() => alert(`Folio Recalculated:\nRent: ₹${taxableRoomRent}\nGST: ₹${gstAmount}\nFood: ₹${foodAmount}\nAdvance: -₹${advanceDeducted}\nNet: ₹${netPayable}`)}
                      style={{ background: '#475569', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: 2, fontSize: 10, cursor: 'pointer' }}
                    >
                      Recalculate
                    </button>
                    <input
                      type="text"
                      readOnly
                      value={`₹${netPayable.toFixed(2)}`}
                      className="form-input-pms"
                      style={{ width: 95, fontWeight: 800, textAlign: 'right', background: '#dcfce7', color: '#166534' }}
                    />
                  </div>

                  {/* Payment Splits */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Settlement Splits:
                  </div>
                  {paymentSplits.map((split, i) => (
                    <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      <select
                        value={split.mode}
                        onChange={e => handleUpdateSplit(i, 'mode', e.target.value)}
                        className="form-select-pms"
                        style={{ width: 85, fontSize: 10 }}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Online">Online</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                      </select>
                      <input
                        type="number"
                        value={split.amount}
                        onChange={e => handleUpdateSplit(i, 'amount', Number(e.target.value))}
                        className="form-input-pms"
                        style={{ width: 80, fontSize: 10, textAlign: 'right', fontWeight: 700 }}
                      />
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={handleAddPaymentMode}
                      style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: 2, fontSize: 10, cursor: 'pointer' }}
                    >
                      + Payment Mode
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 700 }}>
                        Total Advance (-):
                      </span>
                      <input
                        type="number"
                        value={advanceDeducted}
                        onChange={e => setAdvanceDeducted(Number(e.target.value))}
                        className="form-input-pms"
                        style={{ width: 65, fontSize: 10, padding: '1px 4px', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                    <input
                      type="text"
                      placeholder="Ref / UTR"
                      value={paymentReference}
                      onChange={e => setPaymentReference(e.target.value)}
                      className="form-input-pms"
                      style={{ fontSize: 10, padding: 3 }}
                    />
                    <input
                      type="text"
                      placeholder="Remark (PHONE PAY)"
                      value={paymentRemark}
                      onChange={e => setPaymentRemark(e.target.value)}
                      className="form-input-pms"
                      style={{ fontSize: 10, padding: 3 }}
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
                <button
                  type="button"
                  onClick={onClose}
                  style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Printable Tax Invoice Body matching Frame 0420 */}
            <div id="printable-tax-invoice" style={{ padding: 18, background: '#fff', fontSize: 12, color: '#0f172a' }}>
              {/* Hotel Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: 8, marginBottom: 10 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: 1 }}>
                  HOTEL SAI VASUDEV RESIDENCY
                </h2>
                <div style={{ fontSize: 11, color: '#475569' }}>
                  Opp. Gate No. 2, Pimpalwadi Road, Shirdi, Maharashtra - 423109 &bull; GSTIN: 27AABCS1429B1Z2
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

              {/* Financial Sub-Calculations (Frame 0420) */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <div style={{ width: 280, fontSize: 11, lineHeight: 1.7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>SGST (6.00%):</span>
                    <span>₹{sgstAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>CGST (6.00%):</span>
                    <span>₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>IGST (0.00%):</span>
                    <span>₹0.00</span>
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
