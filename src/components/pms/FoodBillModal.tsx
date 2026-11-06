import React, { useState, useEffect, useRef } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { FoodBillItem, PmsFoodBill, PmsKotRecord, TableSession } from '../../types/pmsModels';
import { ManagerPinModal } from './ManagerPinModal';
import { DecentroUpiQrModal } from './DecentroUpiQrModal';

interface FoodBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRoomNo?: string;
  defaultTableNo?: string;
  onBillSaved?: (bill: PmsFoodBill) => void;
}

export const FoodBillModal: React.FC<FoodBillModalProps> = ({
  isOpen,
  onClose,
  defaultRoomNo,
  defaultTableNo,
  onBillSaved
}) => {
  const tables = PmsStore.getTables();
  const occupiedRooms = PmsStore.getRooms().filter(r => r.status === 'occupied');
  const companyInfo = PmsStore.getCompanyInfo();

  const isTableMode = Boolean(defaultTableNo) || (!defaultRoomNo && tables.length > 0);

  const now = new Date();
  const defaultTodayDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  const defaultTodayTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [serviceType, setServiceType] = useState<string>(
    defaultTableNo ? 'Table Service' : defaultRoomNo ? 'Room Service' : 'Table Service'
  );
  const [selectedTable, setSelectedTable] = useState<string>(
    defaultTableNo || (tables.find(t => t.status === 'Running')?.tableName || 'Table T-1')
  );
  const [selectedRoomNo, setSelectedRoomNo] = useState<string>(
    defaultRoomNo || occupiedRooms[0]?.roomNo || ''
  );

  const [customerName, setCustomerName] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [customerRemark, setCustomerRemark] = useState<string>('');
  const [paymentRemark, setPaymentRemark] = useState<string>('');

  const [billNo, setBillNo] = useState<string>(() => {
    const nextNum = PmsStore.getFoodBills().length + 1;
    return isTableMode ? `Res/${nextNum}/25-26` : `SHRI/${nextNum}/25-26`;
  });
  const [billDate, setBillDate] = useState<string>(defaultTodayDate);
  const billTime = defaultTodayTime;
  const [printApproval, setPrintApproval] = useState<boolean>(true);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [settlementType, setSettlementType] = useState<string>(
    isTableMode ? 'Settle To Cash' : 'Settle To Room'
  );

  // Document 1 & 2: Authentic Waitstaff & Covers attribution
  const [steward, setSteward] = useState<string>(
    defaultRoomNo ? 'Ranjan' : 'Dilip'
  );
  const [covers, setCovers] = useState<number>(2);
  const [foodPrintFormat, setFoodPrintFormat] = useState<
    'DineIn_Doc1' | 'RoomService_Doc2' | 'CardEDC_Doc4' | 'Thermal_80mm'
  >(defaultRoomNo ? 'RoomService_Doc2' : 'DineIn_Doc1');

  // Module 1: Single Active Table Session
  const [currentSession, setCurrentSession] = useState<TableSession | null>(null);

  // Module 7: Role-Based Discount Cap (5% Threshold)
  const [showManagerPinModal, setShowManagerPinModal] = useState<boolean>(false);
  const [pendingDiscountPct, setPendingDiscountPct] = useState<number>(0);
  const [isManagerDiscountApproved, setIsManagerDiscountApproved] = useState<boolean>(false);
  const [approvedDiscountReason, setApprovedDiscountReason] = useState<string>('');

  const [pendingKots, setPendingKots] = useState<PmsKotRecord[]>([]);
  const [billItems, setBillItems] = useState<FoodBillItem[]>([]);
  const [showPrintSlip, setShowPrintSlip] = useState<boolean>(false);
  const [savedBill, setSavedBill] = useState<PmsFoodBill | null>(null);
  const [showDecentroQrModal, setShowDecentroQrModal] = useState<boolean>(false);
  const [isSavingBill, setIsSavingBill] = useState<boolean>(false);
  const isSubmittingBillRef = useRef<boolean>(false);
  const isQrButtonLockedRef = useRef<boolean>(false);

  // Load KOTs & Active Table Session
  useEffect(() => {
    let kots: PmsKotRecord[] = [];
    if (serviceType === 'Room Service') {
      setSteward(s => (s === 'Dilip' ? 'Ranjan' : s));
      setFoodPrintFormat('RoomService_Doc2');
      setCurrentSession(null);
      kots = PmsStore.getKots().filter(
        k => k.roomNo === selectedRoomNo && k.status !== 'Billed' && k.status !== 'Cancelled'
      );
      const room = occupiedRooms.find(r => r.roomNo === selectedRoomNo);
      if (room?.currentGuest) {
        setCustomerName(room.currentGuest.name);
        setCustomerMobile(room.currentGuest.phone || '');
      }
    } else {
      const activeSession = PmsStore.getActiveTableSession(selectedTable);
      setCurrentSession(activeSession);
      const cleanTable = selectedTable.toLowerCase().replace(/^table\s+/i, '').trim();
      kots = PmsStore.getKots().filter(k => {
        const kTable = (k.tableNo || '').toLowerCase().replace(/^table\s+/i, '').trim();
        const matchSession = activeSession ? (k.tableSessionId === activeSession.sessionId || activeSession.kotNumbers.includes(k.kotNo)) : false;
        return (kTable === cleanTable || matchSession) && k.status !== 'Billed' && k.status !== 'Cancelled';
      });
      if (activeSession && activeSession.guestName) {
        setCustomerName(activeSession.guestName);
      } else if (kots.length > 0 && kots[0].guestName && kots[0].guestName !== 'Walk-In Guest') {
        setCustomerName(kots[0].guestName);
      } else {
        setCustomerName('');
        setCustomerMobile('');
      }
    }

    setPendingKots(kots);

    if (kots.length > 0) {
      let sNo = 1;
      const items: FoodBillItem[] = [];
      kots.forEach(k => {
        k.items.forEach(it => {
          const taxable = it.amount;
          const disAmt = Number(((taxable * discountPercent) / 100).toFixed(2));
          const netTaxable = Number((taxable - disAmt).toFixed(2));
          const gstRate = 5.0;
          const gstAmount = Number(((netTaxable * gstRate) / 100).toFixed(2));
          const value = Number((netTaxable + gstAmount).toFixed(2));
          items.push({
            sNo: sNo++,
            itemName: it.itemName,
            itemCode: it.itemCode,
            qty: it.qty,
            rate: it.rate,
            amount: it.amount,
            discountPercent,
            discountAmount: disAmt,
            taxable: netTaxable,
            gstPercent: gstRate,
            gstAmount,
            vatPercent: 0,
            surPercent: 0,
            value
          });
        });
      });
      setBillItems(items);
    } else {
      setBillItems([]);
    }
  }, [selectedTable, selectedRoomNo, serviceType]);

  // Video 33: Recalculate items when discount changes (Exempting No-Discount Items - Frames 0140 & 0180)
  const applyDiscount = (pct: number) => {
    setDiscountPercent(pct);
    const updated = billItems.map(item => {
      // Check if item is exempt from discount (Video 33 Frame 0180)
      const isExempt = item.noDiscount === true || PmsStore.isItemDiscountExempt(item.itemName);
      const effectivePct = isExempt ? 0 : pct;
      const disAmt = isExempt ? 0 : Number(((item.amount * pct) / 100).toFixed(2));
      const taxable = Number((item.amount - disAmt).toFixed(2));
      const gstVal = Number(((taxable * (item.gstPercent || 0)) / 100).toFixed(2));
      const value = Number((taxable + gstVal).toFixed(2));
      return {
        ...item,
        noDiscount: isExempt,
        discountPercent: effectivePct,
        discountAmount: disAmt,
        taxable,
        value
      };
    });
    setBillItems(updated);
    const totDisAmt = updated.reduce((s, it) => s + (it.discountAmount || 0), 0);
    setDiscountAmount(Number(totDisAmt.toFixed(2)));
  };

  // Module 7: Role-Based Discount Cap (5% Threshold for Receptionist/Cashier)
  const handleDiscountInputChange = (val: number) => {
    if (val > 5 && !isManagerDiscountApproved) {
      setPendingDiscountPct(val);
      setShowManagerPinModal(true);
      return;
    }
    applyDiscount(val);
  };

  const kotNoDisplay = pendingKots.length > 0
    ? pendingKots.map(k => k.kotNo.replace(/\D/g, '').slice(-3) || k.kotNo).join(',')
    : '372,374';

  const totalQty = billItems.reduce((acc, it) => acc + it.qty, 0);
  const totalAmount = Number(billItems.reduce((acc, it) => acc + it.amount, 0).toFixed(2));
  const totalTaxable = Number(billItems.reduce((acc, it) => acc + it.taxable, 0).toFixed(2));
  const totalGst = Number(billItems.reduce((acc, it) => acc + (it.gstAmount || 0), 0).toFixed(2));
  const totalValue = Number(billItems.reduce((acc, it) => acc + it.value, 0).toFixed(2));
  const netBillAmount = Math.round(totalValue);
  const roundOff = Number((netBillAmount - totalValue).toFixed(2));

  const convertNumberToWords = (num: number): string => {
    const rounded = Math.round(num);
    if (rounded === 0) return 'Zero Rupees Only';
    if (rounded < 0) return `Minus ${convertNumberToWords(-rounded)}`;

    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const formatBelowThousand = (n: number): string => {
      let str = '';
      if (n >= 100) {
        str += units[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        str += tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
      } else if (n > 0) {
        str += units[n];
      }
      return str.trim();
    };

    let remaining = rounded;
    let words = '';

    const crore = Math.floor(remaining / 10000000);
    remaining %= 10000000;
    if (crore > 0) words += `${formatBelowThousand(crore)} Crore `;

    const lakh = Math.floor(remaining / 100000);
    remaining %= 100000;
    if (lakh > 0) words += `${formatBelowThousand(lakh)} Lakh `;

    const thousand = Math.floor(remaining / 1000);
    remaining %= 1000;
    if (thousand > 0) words += `${formatBelowThousand(thousand)} Thousand `;

    if (remaining > 0) words += formatBelowThousand(remaining);

    return `${words.trim()} Rupees Only`;
  };

  const amountInWords = convertNumberToWords(netBillAmount);

  const handleSaveBill = (printSlip: boolean = true) => {
    if (isSubmittingBillRef.current) return;
    isSubmittingBillRef.current = true;
    setIsSavingBill(true);
    try {
    const kotNums = pendingKots.map(k => k.kotNo);

    const billRecord: PmsFoodBill = {
      billNo,
      date: billDate,
      time: billTime,
      roomNo: serviceType === 'Room Service' ? selectedRoomNo : selectedTable,
      tableNo: serviceType !== 'Room Service' ? selectedTable : undefined,
      serviceType,
      guestName: customerName,
      mobile: customerMobile,
      address: customerAddress,
      remark: customerRemark + (isManagerDiscountApproved ? ` [Mgr Disc Override: ${approvedDiscountReason}]` : ''),
      paymentRemark,
      kotNumbers: kotNums,
      items: billItems,
      taxableAmount: totalTaxable,
      steward,
      covers,
      outlet: serviceType === 'Room Service' ? 'ROOM SERVICE' : 'VASUDEV RASOI',
      gstPercent: 5.0,
      cgstAmount: Number((totalGst / 2).toFixed(2)),
      sgstAmount: Number((totalGst / 2).toFixed(2)),
      discountPercent,
      discountAmount,
      roundOff,
      netBillAmount,
      amountInWords,
      settlementType,
      status: 'Settled',
      createdAt: new Date().toISOString()
    };

    PmsStore.saveFoodBill(billRecord);
    setSavedBill(billRecord);

    // Module 1: Close active table session and release table back to Vacant
    if (serviceType !== 'Room Service') {
      const activeSession = PmsStore.getActiveTableSession(selectedTable);
      if (activeSession) {
        activeSession.status = 'Settled';
        PmsStore.saveTableSession(activeSession);
      }
      PmsStore.vacateTable(selectedTable);
    }

    if (onBillSaved) {
      onBillSaved(billRecord);
    }

    if (printSlip) {
      setShowPrintSlip(true);
    } else {
      alert(`Restaurant Food Bill ${billNo} saved & settled! Table ${selectedTable} has been vacated.`);
      onClose();
    }
    } finally {
      isSubmittingBillRef.current = false;
      setIsSavingBill(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div 
        className="pms-form-box" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: showPrintSlip ? (foodPrintFormat === 'CardEDC_Doc4' || foodPrintFormat === 'Thermal_80mm' ? 440 : 860) : 1080, maxHeight: '92vh', overflowY: 'auto' }}
      >
        {!showPrintSlip ? (
          <>
            {/* Top Bar matching Frame 0330 */}
            <div
              className="pms-form-banner banner-navy"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>Restaurant Food Bill Generation &bull; pms.hotelsai-vasudev.com/table_facthkot_records/52</span>
              <button 
                type="button" 
                onClick={onClose} 
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div className="pms-form-body">
              {/* Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0369a1' }}>
                  Restaurant POS Bill &bull; SAC 996331 &bull; 5% GST
                </span>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="checkbox"
                      checked={printApproval}
                      onChange={e => setPrintApproval(e.target.checked)}
                    />
                    Print Approval
                  </label>

                  <button
                    type="button"
                    onClick={() => handleSaveBill(true)}
                    disabled={isSavingBill}
                    style={{
                      background: isSavingBill ? '#94a3b8' : '#0284c7',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 20px',
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: isSavingBill ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 4px rgba(2,132,199,0.3)'
                    }}
                  >
                    {isSavingBill ? '⏳ Saving...' : 'Save & Print'}
                  </button>
                </div>
              </div>

              {/* Module 1: Single Active Table Session Indicator */}
              {currentSession && (
                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #93c5fd',
                  padding: '8px 14px',
                  borderRadius: 4,
                  marginBottom: 10,
                  fontSize: 12,
                  color: '#1e40af',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontWeight: 800 }}>🔗 Active Table Session:</span>{' '}
                    <code>{currentSession.sessionId}</code> &bull; Consolidated KOTs: {currentSession.kotNumbers.join(', ')} ({currentSession.kotNumbers.length} Punched Batches)
                  </div>
                  <span style={{ background: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>
                    Cumulative Items: {currentSession.cumulativeItems.reduce((s, it) => s + it.qty, 0)}
                  </span>
                </div>
              )}

              {/* Row 1 Controls matching Frame 0330 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1.3fr 1.3fr 1.2fr 1.2fr 0.9fr 1fr',
                  gap: 8,
                  marginBottom: 8
                }}
              >
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Date</label>
                  <input
                    type="text"
                    value={billDate}
                    onChange={e => setBillDate(e.target.value)}
                    className="form-input-pms"
                  />
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Bill No</label>
                  <input
                    type="text"
                    value={billNo}
                    onChange={e => setBillNo(e.target.value)}
                    className="form-input-pms"
                    style={{ fontWeight: 700, color: '#0369a1' }}
                  />
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Service Type</label>
                  <select
                    value={serviceType}
                    onChange={e => setServiceType(e.target.value)}
                    className="form-select-pms"
                    style={{ fontWeight: 600 }}
                  >
                    <option value="Table Service">Table Service</option>
                    <option value="Take Away">Take Away</option>
                    <option value="Room Service">Room Service</option>
                    <option value="Home Delivery">Home Delivery</option>
                  </select>
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">
                    {serviceType === 'Room Service' ? 'Select Room' : 'Selected Table'}
                  </label>
                  {serviceType === 'Room Service' ? (
                    <select
                      value={selectedRoomNo}
                      onChange={e => setSelectedRoomNo(e.target.value)}
                      className="form-select-pms"
                      style={{ fontWeight: 700 }}
                    >
                      {occupiedRooms.map(r => (
                        <option key={r.roomNo} value={r.roomNo}>
                          {r.currentGuest?.name || 'Guest'} || {r.roomNo}
                        </option>
                      ))}
                      {occupiedRooms.length === 0 && <option value="" disabled>No occupied rooms</option>}
                    </select>
                  ) : (
                    <select
                      value={selectedTable}
                      onChange={e => setSelectedTable(e.target.value)}
                      className="form-select-pms"
                      style={{ fontWeight: 700 }}
                    >
                      {tables.map(t => (
                        <option key={t.id} value={t.tableName}>
                          {t.tableName} ({t.status || 'Vacant'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">KOT No</label>
                  <input
                    type="text"
                    readOnly
                    value={kotNoDisplay}
                    className="form-input-pms"
                    style={{ background: '#f8fafc', fontWeight: 700 }}
                  />
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Dis %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={discountPercent}
                    onChange={e => handleDiscountInputChange(Number(e.target.value))}
                    className="form-input-pms"
                    style={{ textAlign: 'right', fontWeight: 700 }}
                  />
                  {isManagerDiscountApproved && (
                    <div style={{ fontSize: 9, color: '#16a34a', fontWeight: 800, marginTop: 2 }}>
                      🔓 Overridden: {approvedDiscountReason}
                    </div>
                  )}
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Dis Amt</label>
                  <input
                    type="number"
                    readOnly
                    value={discountAmount}
                    className="form-input-pms"
                    style={{ textAlign: 'right', background: '#f8fafc', color: '#dc2626', fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Row 2 Customer Info & Service Attribution matching Documents 1 & 2 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1.1fr 1fr 0.7fr 1.3fr 1fr',
                  gap: 8,
                  marginBottom: 12
                }}
              >
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Guest Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="vinod sharma"
                    className="form-input-pms"
                    style={{ fontWeight: 700 }}
                  />
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Mobile</label>
                  <input
                    type="text"
                    value={customerMobile}
                    onChange={e => setCustomerMobile(e.target.value)}
                    placeholder="7657657655"
                    className="form-input-pms"
                    style={{ fontWeight: 700 }}
                  />
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Steward (Staff)</label>
                  <input
                    type="text"
                    value={steward}
                    onChange={e => setSteward(e.target.value)}
                    placeholder="Dilip / Ranjan"
                    className="form-input-pms"
                    style={{ fontWeight: 700, color: '#0369a1' }}
                  />
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Covers</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={covers}
                    onChange={e => setCovers(parseInt(e.target.value, 10) || 1)}
                    className="form-input-pms"
                    style={{ textAlign: 'center', fontWeight: 700 }}
                  />
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Address</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    placeholder="Address / Area"
                    className="form-input-pms"
                  />
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Remark</label>
                  <input
                    type="text"
                    value={customerRemark}
                    onChange={e => setCustomerRemark(e.target.value)}
                    placeholder="Optional remark"
                    className="form-input-pms"
                  />
                </div>
              </div>

              {/* Exact Items Table matching Frame 0330 */}
              <div style={{ overflowX: 'auto', border: '1px solid #1e293b', borderRadius: 2, marginBottom: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#1e293b', color: '#fff', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px', width: 40 }}>S.No</th>
                      <th style={{ padding: '6px 8px' }}>Item Name</th>
                      <th style={{ padding: '6px 8px', width: 50, textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '6px 8px', width: 70, textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: '6px 8px', width: 75, textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '6px 8px', width: 50, textAlign: 'right' }}>Dis%</th>
                      <th style={{ padding: '6px 8px', width: 65, textAlign: 'right' }}>Dis Amt</th>
                      <th style={{ padding: '6px 8px', width: 75, textAlign: 'right' }}>Taxable</th>
                      <th style={{ padding: '6px 8px', width: 60, textAlign: 'right' }}>GST%</th>
                      <th style={{ padding: '6px 8px', width: 50, textAlign: 'right' }}>VAT%</th>
                      <th style={{ padding: '6px 8px', width: 50, textAlign: 'right' }}>SUR%</th>
                      <th style={{ padding: '6px 8px', width: 80, textAlign: 'right' }}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                          No KOT orders found for {serviceType === 'Dine-In' ? (selectedTable || 'selected table') : `Room ${selectedRoomNo}`}. Place orders from KOT Entry to populate bill items.
                        </td>
                      </tr>
                    ) : (
                      billItems.map((item, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          background: idx % 2 === 0 ? '#fff' : '#f8fafc'
                        }}
                      >
                        <td style={{ padding: '5px 8px' }}>{item.sNo}</td>
                        <td style={{ padding: '5px 8px', fontWeight: 600 }}>{item.itemName}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 700 }}>
                          {item.qty.toFixed(2)}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{item.amount.toFixed(2)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                          {item.noDiscount ? (
                            <span style={{ fontSize: 9, background: '#fee2e2', color: '#dc2626', padding: '1px 4px', borderRadius: 2, fontWeight: 800 }} title="No Discount Item (Protected)">
                              NO DISC
                            </span>
                          ) : (
                            item.discountPercent || 0
                          )}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: item.noDiscount ? '#94a3b8' : '#dc2626', fontWeight: item.noDiscount ? 400 : 700 }}>
                          {(item.discountAmount || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600 }}>
                          {item.taxable.toFixed(2)}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                          {(item.gstPercent || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                          {(item.vatPercent || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>
                          {(item.surPercent || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#0369a1' }}>
                          {item.value.toFixed(2)}
                        </td>
                      </tr>
                    )))}
                  </tbody>
                  <tfoot>
                    {/* TOTAL row matching Frame 0330 */}
                    <tr style={{ background: '#1e293b', color: '#fff', fontWeight: 800 }}>
                      <td style={{ padding: '6px 8px' }}>Total</td>
                      <td style={{ padding: '6px 8px' }}>{billItems.length}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{totalQty}</td>
                      <td></td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{totalAmount.toFixed(2)}</td>
                      <td></td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#fca5a5' }}>
                        {discountAmount.toFixed(3)}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{totalTaxable.toFixed(2)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{totalGst.toFixed(2)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>0.00</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>0.00</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#6ee7b7' }}>
                        {netBillAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bottom Settlement Controls matching Frame 0330 */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  padding: 10,
                  borderRadius: 4,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1.2fr 1.4fr 1fr 2fr',
                  gap: 8,
                  alignItems: 'center',
                  marginBottom: 10
                }}
              >
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block' }}>Amount</label>
                  <input
                    type="text"
                    readOnly
                    value={netBillAmount.toFixed(2)}
                    className="form-input-pms"
                    style={{ background: '#f1f5f9', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block' }}>Round Off</label>
                  <input
                    type="text"
                    readOnly
                    value={roundOff.toFixed(2)}
                    className="form-input-pms"
                    style={{ background: '#f1f5f9', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block' }}>Net Bill Amount</label>
                  <input
                    type="text"
                    readOnly
                    value={`₹${netBillAmount}`}
                    className="form-input-pms"
                    style={{ background: '#dcfce7', color: '#166534', fontWeight: 900, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: '#0369a1', display: 'block' }}>Settle to Payment</label>
                  <select
                    value={settlementType}
                    onChange={e => setSettlementType(e.target.value)}
                    className="form-select-pms"
                    style={{ fontWeight: 800, borderColor: '#0284c7' }}
                  >
                    <option value="Settle To Cash">Settle To Cash</option>
                    <option value="Settle To Online">Settle To Online / UPI</option>
                    <option value="Settle To Room">Settle To Room (Guest Folio)</option>
                    <option value="Due / Credit">Due / Credit</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block' }}>Amount To Post</label>
                  <input
                    type="text"
                    readOnly
                    value={netBillAmount}
                    className="form-input-pms"
                    style={{ background: '#f1f5f9', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block' }}>Amount In Words</label>
                  <input
                    type="text"
                    readOnly
                    value={amountInWords}
                    className="form-input-pms"
                    style={{ background: '#f1f5f9', fontSize: 11 }}
                  />
                </div>
              </div>

              {/* Payment Remark Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Payment Remark</label>
                  <input
                    type="text"
                    value={paymentRemark}
                    onChange={e => setPaymentRemark(e.target.value)}
                    placeholder="Cash counter / UPI transaction ID..."
                    className="form-input-pms"
                  />
                </div>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Remark</label>
                  <input
                    type="text"
                    value={customerRemark}
                    onChange={e => setCustomerRemark(e.target.value)}
                    placeholder="Optional notes..."
                    className="form-input-pms"
                  />
                </div>
              </div>

              {/* Bottom Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  * Settling will vacate {serviceType !== 'Room Service' ? selectedTable : `Room ${selectedRoomNo}`} and post ₹{netBillAmount} to {settlementType}.
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{ background: '#64748b', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 3, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const guestMobile = customerMobile || '9822100042';
                      PmsStore.sendWhatsAppNotification({
                        voucherType: 'Food_bill_store',
                        recipientMobile: guestMobile,
                        recipientName: customerName || 'Valued Guest',
                        voucherNo: billNo,
                        roomNo: serviceType === 'Room Service' ? selectedRoomNo : selectedTable,
                        templateParams: {
                          checkout_date: billDate,
                          total_billamount: netBillAmount.toString()
                        },
                        openDirectly: true
                      });
                    }}
                    style={{ background: '#25d366', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 4, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    title="Open food bill directly in WhatsApp Web via wa.me (Option 1: 100% Free)"
                  >
                    <span>💬</span> WhatsApp Food Bill (wa.me)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isQrButtonLockedRef.current) return;
                      isQrButtonLockedRef.current = true;
                      setShowDecentroQrModal(true);
                      setTimeout(() => { isQrButtonLockedRef.current = false; }, 400);
                    }}
                    style={{
                      background: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      padding: '7px 16px',
                      borderRadius: 4,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    title="Generate Dynamic Decentro UPI QR for guest to scan and settle food bill instantly"
                  >
                    <span>⚡</span> Decentro UPI QR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveBill(true)}
                    disabled={isSavingBill}
                    style={{
                      background: isSavingBill ? '#94a3b8' : '#15803d',
                      color: '#fff',
                      border: 'none',
                      padding: '7px 22px',
                      borderRadius: 4,
                      fontWeight: 800,
                      cursor: isSavingBill ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSavingBill ? '⏳ Settling Bill...' : 'Save & Settle Bill'}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Multi-Document F&B Print & Settlement View (Documents 1, 2, 4) */
          <div style={{ padding: 14 }}>
            {/* Format Switcher Toolbar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#0f172a',
              padding: '8px 12px',
              borderRadius: 4,
              marginBottom: 12,
              flexWrap: 'wrap',
              gap: 8,
              color: '#fff'
            }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>Slip Format:</span>
                <button
                  type="button"
                  onClick={() => setFoodPrintFormat('DineIn_Doc1')}
                  style={{
                    background: foodPrintFormat === 'DineIn_Doc1' ? '#059669' : '#334155',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: 3,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🍽️ Dine-In Bill (Doc 1 ★)
                </button>
                <button
                  type="button"
                  onClick={() => setFoodPrintFormat('RoomService_Doc2')}
                  style={{
                    background: foodPrintFormat === 'RoomService_Doc2' ? '#ea580c' : '#334155',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: 3,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🛎️ Room Service (Doc 2 ★)
                </button>
                <button
                  type="button"
                  onClick={() => setFoodPrintFormat('CardEDC_Doc4')}
                  style={{
                    background: foodPrintFormat === 'CardEDC_Doc4' ? '#0284c7' : '#334155',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: 3,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  💳 Card POS Slip (Doc 4 ★)
                </button>
                <button
                  type="button"
                  onClick={() => setFoodPrintFormat('Thermal_80mm')}
                  style={{
                    background: foodPrintFormat === 'Thermal_80mm' ? '#475569' : '#334155',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: 3,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🧾 80mm Thermal
                </button>
              </div>

              <div style={{ fontSize: 11, color: '#38bdf8', fontFamily: 'monospace' }}>
                {foodPrintFormat === 'DineIn_Doc1' && 'Table Slip + Room Charge Box (Doc 1)'}
                {foodPrintFormat === 'RoomService_Doc2' && 'In-Room Dining Voucher (Doc 2)'}
                {foodPrintFormat === 'CardEDC_Doc4' && 'HDFC / Mosambee EDC Thermal (Doc 4)'}
                {foodPrintFormat === 'Thermal_80mm' && 'Standard Counter POS'}
              </div>
            </div>

            <div
              id="food-bill-print-slip"
              className="printable-thermal-receipt"
              style={{
                background: '#fff',
                border: '1px solid #334155',
                padding: foodPrintFormat === 'CardEDC_Doc4' || foodPrintFormat === 'Thermal_80mm' ? '18px 14px' : '22px 20px',
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 12,
                color: '#000',
                maxWidth: foodPrintFormat === 'CardEDC_Doc4' || foodPrintFormat === 'Thermal_80mm' ? 360 : 800,
                margin: '0 auto',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
              }}
            >
              {/* ========================================================================= */}
              {/* DOCUMENT 1: RESTAURANT DINE-IN BILL (With Room Charge Box)                */}
              {/* ========================================================================= */}
              {foodPrintFormat === 'DineIn_Doc1' && (
                <div>
                  {/* Hotel Header & Outlet */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed #000', paddingBottom: 8, marginBottom: 8 }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 0.5 }}>VASUDEV RASOI</div>
                      <div style={{ fontSize: 10, color: '#475569' }}>FINE DINE &bull; PURE VEGETARIAN &amp; MULTI-CUISINE</div>
                      <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
                        FSSAI LIC NO: 12017026000083
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
                        {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'}
                      </div>
                      <div style={{ fontSize: 10 }}>
                        {companyInfo.address1 || 'SR RESIDENCY, NEAR ANDHRA BANK, NEW COLONY'}
                      </div>
                      <div style={{ fontSize: 10 }}>
                        Rayagada, Odisha - 765001 &bull; Ph: 06856-222001
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700 }}>
                        GSTIN: {companyInfo.gstNo || '21AEKPP8689J1ZS'}
                      </div>
                    </div>
                  </div>

                  {/* Metadata Strip */}
                  <div style={{
                    border: '1px solid #000',
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 0.8fr 0.9fr 1fr 1.1fr',
                    fontSize: 11,
                    padding: '4px 8px',
                    marginBottom: 10,
                    background: '#f8fafc'
                  }}>
                    <div><strong>STEWARD:</strong> {steward}</div>
                    <div><strong>TABLE NO:</strong> {serviceType !== 'Room Service' ? selectedTable.replace(/^Table\s+/i, '') : '28'}</div>
                    <div><strong>COVERS:</strong> {covers}</div>
                    <div><strong>TIME:</strong> {billTime}</div>
                    <div><strong>DATE:</strong> {billDate}</div>
                    <div><strong>BILL NO:</strong> {savedBill?.billNo ? savedBill.billNo.replace(/[^0-9]/g, '').slice(-4) || '1032' : '1032'}</div>
                  </div>

                  {/* 2-Column Body: Left Room Transfer Box | Right Items & Taxes */}
                  <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: 14, alignItems: 'start' }}>
                    {/* Left Room Transfer Box (Authentic Document 1) */}
                    <div style={{
                      border: '1.5px solid #000',
                      borderRadius: 4,
                      padding: '8px 10px',
                      fontSize: 10,
                      lineHeight: 1.45,
                      background: '#fff'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: 4, marginBottom: 4, fontWeight: 900 }}>
                        <span>ROOM NO:</span>
                        <span style={{ fontSize: 12, background: '#f1f5f9', padding: '0 6px', border: '1px solid #94a3b8' }}>
                          {serviceType === 'Room Service' ? selectedRoomNo : (selectedTable.replace(/^Table\s+/i, '') || '28')}
                        </span>
                      </div>

                      <div style={{ fontWeight: 800, textAlign: 'center', margin: '4px 0', fontSize: 9, color: '#dc2626' }}>
                        DO NOT SIGN IF PAID CASH
                      </div>

                      <div style={{ margin: '8px 0 4px', borderBottom: '1px solid #000', paddingBottom: 2 }}>
                        <strong>GUEST SIGNATURE:</strong>
                        <div style={{ fontStyle: 'italic', fontFamily: 'cursive', color: '#1e40af', fontSize: 11, marginTop: 4 }}>
                          {customerName || 'Guest'}
                        </div>
                      </div>

                      <div style={{ marginTop: 6, fontSize: 9.5 }}>
                        <div><strong>NAME:</strong> {customerName}</div>
                        <div><strong>COMPANY:</strong> _________________</div>
                        <div><strong>GSTIN:</strong> ___________________</div>
                        <div><strong>ADDRESS:</strong> Rayagada, Odisha</div>
                      </div>

                      <div style={{ borderTop: '1px solid #000', marginTop: 6, paddingTop: 4, fontSize: 8.5 }}>
                        UNCONSUMED FOOD AND DRINKS NOT TO BE TAKEN AWAY
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 8.5, marginTop: 2 }}>
                        &bull; ALL DISPUTES ARE SUBJECT TO RAYAGADA JURISDICTION
                      </div>
                      <div style={{ fontSize: 8.5, color: '#475569', marginTop: 2 }}>
                        FSSAI LIC NO: 12017026000083
                      </div>
                      <div style={{ fontSize: 8, fontStyle: 'italic', marginTop: 2 }}>
                        (A UNIT OF {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'})
                      </div>
                    </div>

                    {/* Right Items Table & Financials */}
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 8 }}>
                        <thead>
                          <tr style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', textAlign: 'left' }}>
                            <th style={{ padding: '4px 4px' }}>DESCRIPTION</th>
                            <th style={{ padding: '4px 4px', textAlign: 'center', width: 65 }}>HSN/SAC</th>
                            <th style={{ padding: '4px 4px', textAlign: 'center', width: 40 }}>QTY.</th>
                            <th style={{ padding: '4px 4px', textAlign: 'right', width: 60 }}>RATE</th>
                            <th style={{ padding: '4px 4px', textAlign: 'right', width: 70 }}>AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billItems.map((it, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px dotted #cbd5e1' }}>
                              <td style={{ padding: '3px 4px', fontWeight: 700 }}>{it.itemName.toUpperCase()}</td>
                              <td style={{ padding: '3px 4px', textAlign: 'center', fontSize: 10 }}>
                                {it.itemName.toLowerCase().includes('water') ? '996334' : '996332'}
                              </td>
                              <td style={{ padding: '3px 4px', textAlign: 'center' }}>{it.qty}</td>
                              <td style={{ padding: '3px 4px', textAlign: 'right' }}>{it.rate.toFixed(2)}</td>
                              <td style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 800 }}>{it.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Financial Summary */}
                      <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontSize: 11, lineHeight: 1.6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Total Amount:</span>
                          <strong>{totalAmount.toFixed(2)}</strong>
                        </div>
                        {discountAmount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                            <span>Discount:</span>
                            <span>-{discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>State GST 2.50 % (SGST):</span>
                          <span>{(totalGst / 2).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Central GST 2.50 % (CGST):</span>
                          <span>{(totalGst / 2).toFixed(2)}</span>
                        </div>
                        {roundOff !== 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Round Off:</span>
                            <span>{roundOff.toFixed(2)}</span>
                          </div>
                        )}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          borderTop: '1.5px solid #000',
                          borderBottom: '1.5px solid #000',
                          padding: '4px 0',
                          marginTop: 4,
                          fontSize: 13,
                          fontWeight: 900
                        }}>
                          <span>Net Amount:</span>
                          <span>₹{netBillAmount.toFixed(2)}</span>
                        </div>
                        <div style={{ fontSize: 9.5, fontStyle: 'italic', marginTop: 3 }}>
                          ({amountInWords})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statutory Footer Notice */}
                  <div style={{ borderTop: '1px dashed #000', marginTop: 10, paddingTop: 6, textAlign: 'center', fontSize: 9 }}>
                    &quot;The registration certificate is required to be prominently displayed at all places of business in the State&quot;
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* DOCUMENT 2: IN-ROOM DINING / ROOM SERVICE BILL                            */}
              {/* ========================================================================= */}
              {foodPrintFormat === 'RoomService_Doc2' && (
                <div>
                  {/* Hotel Header & Big Room Service Banner */}
                  <div style={{ borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
                      {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'}
                    </div>
                    <div style={{ fontSize: 10 }}>
                      {companyInfo.address1 || 'SR RESIDENCY, NEAR ANDHRA BANK, NEW COLONY, Rayagada, Odisha - 765001'}
                    </div>
                    <div style={{ fontSize: 10 }}>
                      Ph: 06856-222001 &bull; GSTIN: {companyInfo.gstNo || '21AEKPP8689J1ZS'}
                    </div>
                    <div style={{
                      display: 'inline-block',
                      border: '1.5px solid #000',
                      padding: '2px 16px',
                      fontSize: 13,
                      fontWeight: 900,
                      letterSpacing: 1.5,
                      marginTop: 4,
                      background: '#f8fafc'
                    }}>
                      ROOM SERVICE
                    </div>
                  </div>

                  {/* Metadata Strip */}
                  <div style={{
                    border: '1px solid #000',
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 0.8fr 0.9fr 1fr 1.1fr',
                    fontSize: 11,
                    padding: '4px 8px',
                    marginBottom: 10,
                    background: '#f8fafc'
                  }}>
                    <div><strong>STEWARD:</strong> {steward}</div>
                    <div><strong>ROOM NO:</strong> {serviceType === 'Room Service' ? selectedRoomNo : (selectedTable.replace(/^Table\s+/i, '') || '368')}</div>
                    <div><strong>COVERS:</strong> {covers}</div>
                    <div><strong>TIME:</strong> {billTime}</div>
                    <div><strong>DATE:</strong> {billDate}</div>
                    <div><strong>BILL NO:</strong> {savedBill?.billNo ? savedBill.billNo.replace(/[^0-9]/g, '').slice(-4) || '1059' : '1059'}</div>
                  </div>

                  {/* 2-Column Body: Left Room Transfer Box | Right Items & Taxes */}
                  <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: 14, alignItems: 'start' }}>
                    {/* Left Room Transfer Box */}
                    <div style={{
                      border: '1.5px solid #000',
                      borderRadius: 4,
                      padding: '8px 10px',
                      fontSize: 10,
                      lineHeight: 1.45,
                      background: '#fff'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: 4, marginBottom: 4, fontWeight: 900 }}>
                        <span>ROOM NO:</span>
                        <span style={{ fontSize: 13, background: '#f1f5f9', padding: '0 8px', border: '1px solid #94a3b8' }}>
                          {serviceType === 'Room Service' ? selectedRoomNo : '368'}
                        </span>
                      </div>

                      <div style={{ fontWeight: 800, textAlign: 'center', margin: '4px 0', fontSize: 9, color: '#dc2626' }}>
                        DO NOT SIGN IF PAID CASH
                      </div>

                      <div style={{ margin: '8px 0 4px', borderBottom: '1px solid #000', paddingBottom: 2 }}>
                        <strong>GUEST SIGNATURE:</strong>
                        <div style={{ fontStyle: 'italic', fontFamily: 'cursive', color: '#1e40af', fontSize: 11, marginTop: 4 }}>
                          {customerName || 'Guest'}
                        </div>
                      </div>

                      <div style={{ marginTop: 6, fontSize: 9.5 }}>
                        <div><strong>GUEST:</strong> {customerName}</div>
                        <div><strong>MOBILE:</strong> {customerMobile}</div>
                      </div>

                      <div style={{ borderTop: '1px solid #000', marginTop: 8, paddingTop: 4, fontSize: 8.5 }}>
                        UNCONSUMED FOOD AND DRINKS NOT TO BE TAKEN AWAY
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 8.5, marginTop: 2 }}>
                        &bull; ALL DISPUTES ARE SUBJECT TO RAYAGADA JURISDICTION
                      </div>
                      <div style={{ fontSize: 8.5, color: '#475569', marginTop: 2 }}>
                        FSSAI LIC NO: 12017026000083
                      </div>
                      <div style={{ fontSize: 8, fontStyle: 'italic', marginTop: 2 }}>
                        (A UNIT OF {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'})
                      </div>
                    </div>

                    {/* Right Items & Taxes */}
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 8 }}>
                        <thead>
                          <tr style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', textAlign: 'left' }}>
                            <th style={{ padding: '4px 4px' }}>DESCRIPTION</th>
                            <th style={{ padding: '4px 4px', textAlign: 'center', width: 65 }}>HSN/SAC</th>
                            <th style={{ padding: '4px 4px', textAlign: 'center', width: 40 }}>QTY.</th>
                            <th style={{ padding: '4px 4px', textAlign: 'right', width: 60 }}>RATE</th>
                            <th style={{ padding: '4px 4px', textAlign: 'right', width: 70 }}>AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billItems.map((it, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px dotted #cbd5e1' }}>
                              <td style={{ padding: '3px 4px', fontWeight: 700 }}>{it.itemName.toUpperCase()}</td>
                              <td style={{ padding: '3px 4px', textAlign: 'center', fontSize: 10 }}>996332</td>
                              <td style={{ padding: '3px 4px', textAlign: 'center' }}>{it.qty}</td>
                              <td style={{ padding: '3px 4px', textAlign: 'right' }}>{it.rate.toFixed(2)}</td>
                              <td style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 800 }}>{it.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Summary */}
                      <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontSize: 11, lineHeight: 1.6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Total Amount:</span>
                          <strong>{totalAmount.toFixed(2)}</strong>
                        </div>
                        {discountAmount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                            <span>Discount:</span>
                            <span>-{discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>State GST 2.50 % (SGST):</span>
                          <span>{(totalGst / 2).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Central GST 2.50 % (CGST):</span>
                          <span>{(totalGst / 2).toFixed(2)}</span>
                        </div>
                        {roundOff !== 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Round Off:</span>
                            <span>{roundOff.toFixed(2)}</span>
                          </div>
                        )}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          borderTop: '1.5px solid #000',
                          borderBottom: '1.5px solid #000',
                          padding: '4px 0',
                          marginTop: 4,
                          fontSize: 13,
                          fontWeight: 900
                        }}>
                          <span>Net Amount:</span>
                          <span>₹{netBillAmount.toFixed(2)}</span>
                        </div>
                        <div style={{ fontSize: 9.5, fontStyle: 'italic', marginTop: 3 }}>
                          ({amountInWords})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statutory Footer Notice */}
                  <div style={{ borderTop: '1px dashed #000', marginTop: 10, paddingTop: 6, textAlign: 'center', fontSize: 9 }}>
                    &quot;The registration certificate is required to be prominently displayed at all places of business in the State&quot;
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* DOCUMENT 4: CARD POS / EDC MACHINE SETTLEMENT THERMAL SLIP               */}
              {/* ========================================================================= */}
              {foodPrintFormat === 'CardEDC_Doc4' && (
                <div style={{ fontSize: 11, lineHeight: 1.45, fontFamily: "'Courier New', Courier, monospace" }}>
                  {/* Bank & Merchant Header */}
                  <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 0.5 }}>
                      [■] HDFC BANK
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2 }}>
                      {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'}
                    </div>
                    <div style={{ fontSize: 9.5 }}>
                      {companyInfo.address1 || 'SR RESIDENCY, NEAR ANDHRA BANK, NEW COLONY'}
                    </div>
                    <div style={{ fontSize: 9.5 }}>
                      RAYAGADA, ODISHA 765001
                    </div>
                  </div>

                  {/* Terminal Metadata Grid */}
                  <div style={{ fontSize: 10, marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>DATE: {billDate}</span>
                      <span>TIME: {billTime}:21</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>MID: E31758</span>
                      <span>TID: 67005863</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Batch No: 001163</span>
                      <span>Invoice: 008106</span>
                    </div>
                  </div>

                  {/* Status Box */}
                  <div style={{ textAlign: 'center', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', margin: '6px 0' }}>
                    <div style={{ fontWeight: 900, fontSize: 12 }}>Transaction Approved</div>
                    <div style={{ fontWeight: 800, fontSize: 11 }}>Sale</div>
                  </div>

                  {/* Card Security Parameters */}
                  <div style={{ fontSize: 9.5, lineHeight: 1.4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Card No:</span>
                      <strong>XXXXXXXXXXXX8884</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Card Entry Mode:</span>
                      <span>CHIP</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Card Type:</span>
                      <span>VISA</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Exp Date:</span>
                      <span>**/**</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>App Label:</span>
                      <span>VISA CREDIT</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>AID:</span>
                      <span>A0000000031010</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>APPR CODE:</span>
                      <strong>029844</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>RRN:</span>
                      <span>000000008164</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>TXN ID:</span>
                      <span>6109548993</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>TVR: 0080048000</span>
                      <span>TSI: E800</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>TC:</span>
                      <span>5C76CD64387ECA31</span>
                    </div>
                  </div>

                  {/* Net Sale Amount Banner */}
                  <div style={{
                    borderTop: '2px solid #000',
                    borderBottom: '2px solid #000',
                    padding: '6px 0',
                    margin: '8px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 13,
                    fontWeight: 900
                  }}>
                    <span>SALE AMT:</span>
                    <span>INR {netBillAmount.toFixed(2)}</span>
                  </div>

                  {/* Cardholder Verification & Agreement */}
                  <div style={{ textAlign: 'center', margin: '6px 0', fontSize: 10 }}>
                    <div style={{ fontWeight: 900 }}>PIN VERIFIED OK</div>
                    <div style={{ fontSize: 9 }}>SIGNATURE NOT REQUIRED</div>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: 6, borderTop: '1px dashed #000', paddingTop: 6, fontSize: 9 }}>
                    <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>{customerName ? customerName.toUpperCase() : 'VALUED GUEST'}</div>
                    <div style={{ fontStyle: 'italic', fontSize: 8.5, color: '#334155' }}>
                      I AGREE TO PAY AS PER THE CARD ISSUER AGREEMENT
                    </div>
                    <div style={{ fontWeight: 900, marginTop: 4, letterSpacing: 1 }}>CUSTOMER COPY</div>
                    <div style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>
                      Version 2.1.107.259 &bull; Powered by Mosambee
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* COMPACT 80MM THERMAL RECEIPT                                              */}
              {/* ========================================================================= */}
              {foodPrintFormat === 'Thermal_80mm' && (
                <div>
                  {/* Hotel Header */}
                  <div style={{ textAlign: 'center', borderBottom: '1px dashed #334155', paddingBottom: 8, marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900 }}>
                      {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'}
                    </h3>
                    <p style={{ margin: '2px 0', fontSize: 10 }}>
                      {companyInfo.address1 || 'SR RESIDENCY, NEAR ANDHRA BANK, NEW COLONY, Rayagada, Odisha - 765001'}
                    </p>
                    <p style={{ margin: '2px 0', fontSize: 10 }}>
                      GSTIN: {companyInfo.gstNo || '21AEKPP8689J1ZS'} &bull; SAC: 996331 &bull; State: Odisha (21)
                    </p>
                    <div
                      style={{
                        display: 'inline-block',
                        border: '1px solid #000',
                        padding: '2px 8px',
                        fontWeight: 900,
                        fontSize: 11,
                        marginTop: 4
                      }}
                    >
                      RESTAURANT TAX INVOICE
                    </div>
                  </div>

                  {/* Bill Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 11, marginBottom: 6 }}>
                    <div><strong>Bill No:</strong> {savedBill?.billNo || billNo}</div>
                    <div style={{ textAlign: 'right' }}>
                      <strong>{serviceType !== 'Room Service' ? 'Table:' : 'Room:'}</strong>{' '}
                      {serviceType !== 'Room Service' ? selectedTable : selectedRoomNo}
                    </div>
                    <div><strong>Date:</strong> {billDate} {billTime}</div>
                    <div style={{ textAlign: 'right' }}><strong>Guest:</strong> {customerName}</div>
                    <div><strong>Mobile:</strong> {customerMobile}</div>
                    <div style={{ textAlign: 'right', color: '#16a34a', fontWeight: 800 }}>
                      <strong>{settlementType}</strong>
                    </div>
                    <div><strong>KOT Ref:</strong> {kotNoDisplay}</div>
                  </div>

                  {/* Items Table */}
                  <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', marginBottom: 6 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 30px 45px 55px', fontWeight: 900 }}>
                      <span>#</span>
                      <span>Item</span>
                      <span style={{ textAlign: 'center' }}>Qty</span>
                      <span style={{ textAlign: 'right' }}>Rate</span>
                      <span style={{ textAlign: 'right' }}>Amount</span>
                    </div>
                    {billItems.map((it, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 30px 45px 55px', padding: '2px 0', fontSize: 11 }}>
                        <span>{idx + 1}</span>
                        <span>{it.itemName}</span>
                        <span style={{ textAlign: 'center' }}>{it.qty}</span>
                        <span style={{ textAlign: 'right' }}>₹{it.rate.toFixed(2)}</span>
                        <span style={{ textAlign: 'right', fontWeight: 700 }}>₹{it.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div style={{ fontSize: 11, lineHeight: 1.5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Item Subtotal:</span>
                      <span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                        <span>Less Discount ({discountPercent}%):</span>
                        <span>-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Taxable Food Amount:</span>
                      <span>₹{totalTaxable.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>CGST @ 2.5%:</span>
                      <span>₹{(totalGst / 2).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SGST @ 2.5%:</span>
                      <span>₹{(totalGst / 2).toFixed(2)}</span>
                    </div>
                    {roundOff !== 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Round Off:</span>
                        <span>{roundOff.toFixed(2)}</span>
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderTop: '1px solid #000',
                        paddingTop: 4,
                        marginTop: 4,
                        fontSize: 13,
                        fontWeight: 900
                      }}
                    >
                      <span>NET BILL AMOUNT:</span>
                      <span>₹{netBillAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: 10, fontStyle: 'italic', marginTop: 2 }}>
                      ({amountInWords})
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dashed #000', paddingTop: 6, marginTop: 6, textAlign: 'center', fontSize: 10 }}>
                    Thank you for dining with us! &bull; Visit Again
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setShowPrintSlip(false)}
                style={{ background: '#475569', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 3, cursor: 'pointer', fontWeight: 700 }}
              >
                Back to Bill
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 18px', borderRadius: 3, cursor: 'pointer', fontWeight: 800 }}
                >
                  Print Slip
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 3, cursor: 'pointer', fontWeight: 800 }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Module 7: Role-Based Discount Cap Manager Authorization Modal */}
        <ManagerPinModal
          isOpen={showManagerPinModal}
          onClose={() => {
            setShowManagerPinModal(false);
            setPendingDiscountPct(0);
          }}
          title="Manager PIN Authorization: Discount Cap Exceeded"
          actionDescription={`Cashier/Reception discount threshold is capped at 5%. You are attempting to grant a ${pendingDiscountPct}% discount (₹${((totalAmount * pendingDiscountPct) / 100).toFixed(2)}) on Table/Room ${serviceType === 'Room Service' ? selectedRoomNo : selectedTable}. Manager PIN and mandatory reason are required.`}
          onAuthorized={(_pin, reason) => {
            setIsManagerDiscountApproved(true);
            setApprovedDiscountReason(reason);
            applyDiscount(pendingDiscountPct);
            setShowManagerPinModal(false);
          }}
        />

        {/* Decentro Dynamic UPI QR Modal with Real-time Settlement for KOT Bills */}
        <DecentroUpiQrModal
          isOpen={showDecentroQrModal}
          onClose={() => setShowDecentroQrModal(false)}
          amount={netBillAmount}
          purpose={`KOT Bill ${billNo} - ${serviceType === 'Room Service' ? `Room ${selectedRoomNo}` : selectedTable}`}
          roomNo={serviceType === 'Room Service' ? selectedRoomNo : undefined}
          kotId={billNo}
          onSwitchToManualPos={() => {
            setShowDecentroQrModal(false);
            setSettlementType('Settle To Cash');
            setPaymentRemark('Manual Cash / Card POS Reference (Decentro Gateway Fallback)');
          }}
          onPaymentSuccess={txn => {
            setSettlementType('Settle To Online');
            setPaymentRemark(`Decentro UPI Reconciled (UTR: ${txn.bank_reference_number})`);
            setShowDecentroQrModal(false);
            handleSaveBill(true);
          }}
        />
      </div>
    </div>
  );
};
