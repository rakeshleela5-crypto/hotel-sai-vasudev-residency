import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { FoodBillItem, PmsFoodBill, PmsKotRecord, PmsRoom } from '../../types/pmsModels';

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
  if (!isOpen) return null;

  const occupiedRooms = PmsStore.getRooms().filter(r => r.status === 'occupied');
  const initialRoom = occupiedRooms.find(r => r.roomNo === defaultRoomNo) || occupiedRooms[0] || {
    roomNo: '103',
    currentGuest: { name: 'ALOK JAIN' }
  } as PmsRoom;

  const [selectedRoomNo, setSelectedRoomNo] = useState<string>(defaultTableNo || initialRoom.roomNo);
  const selectedGuestName = defaultTableNo
    ? `Dine-In (${defaultTableNo})`
    : occupiedRooms.find(r => r.roomNo === selectedRoomNo)?.currentGuest?.name || 'ALOK JAIN';

  const defaultBillNo = `SHRI/${Math.floor(250 + Math.random() * 50)}/24-25`;
  const [billNo, setBillNo] = useState<string>(defaultBillNo);
  const [billDate, setBillDate] = useState<string>('07-06-2025');
  const [billTime, setBillTime] = useState<string>('06:37');
  const [printApproval, setPrintApproval] = useState<boolean>(true);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [settlementType, setSettlementType] = useState<'Settle To Room' | 'Cash' | 'UPI' | 'Card'>(
    defaultTableNo ? 'Cash' : 'Settle To Room'
  );

  // Load KOTs for selected room or table
  const [pendingKots, setPendingKots] = useState<PmsKotRecord[]>([]);
  const [billItems, setBillItems] = useState<FoodBillItem[]>([]);
  const [showPrintSlip, setShowPrintSlip] = useState<boolean>(false);
  const [savedBill, setSavedBill] = useState<PmsFoodBill | null>(null);

  useEffect(() => {
    // Find KOTs for this room or table
    const cleanSearch = selectedRoomNo.replace(/^Table\s+/i, '').trim().toLowerCase();
    const kots = PmsStore.getKots().filter(k => {
      const matchRoom = k.roomNo && k.roomNo.toLowerCase() === selectedRoomNo.toLowerCase();
      const matchTable = k.tableNo && k.tableNo.replace(/^Table\s+/i, '').trim().toLowerCase() === cleanSearch;
      const isOpen = k.status !== 'Billed' && k.status !== 'Cancelled';
      return (matchRoom || matchTable) && isOpen;
    });
    setPendingKots(kots);

    if (kots.length > 0) {
      // Flatten items from all pending KOTs
      let sNo = 1;
      const items: FoodBillItem[] = [];
      kots.forEach(k => {
        k.items.forEach(it => {
          const taxable = it.amount;
          const gstAmount = Number(((taxable * 5) / 100).toFixed(2));
          const value = Number((taxable + gstAmount).toFixed(2));
          items.push({
            sNo: sNo++,
            itemName: it.itemName,
            itemCode: it.itemCode,
            qty: it.qty,
            rate: it.rate,
            amount: it.amount,
            discountPercent: 0,
            discountAmount: 0,
            taxable,
            gstPercent: 5.0,
            gstAmount,
            vatPercent: 0,
            surPercent: 0,
            value
          });
        });
      });
      setBillItems(items);
    } else {
      // Default sample matching Frame 0200
      setBillItems([
        {
          sNo: 1,
          itemName: 'WATER BOTLE',
          itemCode: '10003',
          qty: 1,
          rate: 28.57,
          amount: 28.57,
          discountPercent: 0,
          discountAmount: 0,
          taxable: 28.57,
          gstPercent: 5.0,
          gstAmount: 1.43,
          vatPercent: 0,
          surPercent: 0,
          value: 30.00
        }
      ]);
    }
  }, [selectedRoomNo]);

  const kotNoDisplay = pendingKots.map(k => k.kotNo.replace(/\D/g, '').slice(-3) || k.kotNo).join(', ') || '351';

  // Calculations
  const totalQty = billItems.reduce((acc, it) => acc + it.qty, 0);
  const totalAmount = Number(billItems.reduce((acc, it) => acc + it.amount, 0).toFixed(2));
  const totalTaxable = Number((totalAmount - discountAmount).toFixed(2));
  const gstAmount = Number(((totalTaxable * 5) / 100).toFixed(2));
  const cgstAmount = Number((gstAmount / 2).toFixed(2));
  const sgstAmount = Number((gstAmount / 2).toFixed(2));
  const rawNet = totalTaxable + gstAmount;
  const netBillAmount = Math.round(rawNet);
  const roundOff = Number((netBillAmount - rawNet).toFixed(2));

  const handleDiscountPercentChange = (pct: number) => {
    setDiscountPercent(pct);
    const amt = Number(((totalAmount * pct) / 100).toFixed(2));
    setDiscountAmount(amt);
  };

  const handleDiscountAmountChange = (amt: number) => {
    setDiscountAmount(amt);
    const pct = totalAmount > 0 ? Number(((amt / totalAmount) * 100).toFixed(2)) : 0;
    setDiscountPercent(pct);
  };

  const convertNumberToWords = (num: number): string => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (num === 0) return 'Zero Rupees Only';
    if (num < 20) return `${units[num]} Rupees Only`;
    if (num < 100) return `${tens[Math.floor(num / 10)]} ${units[num % 10]} Rupees Only`.trim();
    if (num < 1000) return `${units[Math.floor(num / 100)]} Hundred ${tens[Math.floor((num % 100) / 10)]} ${units[num % 10]} Rupees Only`.trim();
    return `${num} Rupees Only`;
  };

  const amountInWords = convertNumberToWords(netBillAmount);

  const handleSaveBill = (printSlip: boolean = true) => {
    const kotNums = pendingKots.map(k => k.kotNo);
    if (kotNums.length === 0) {
      kotNums.push('KOT/351/24-25');
    }

    const billRecord: PmsFoodBill = {
      billNo,
      date: billDate,
      time: billTime,
      roomNo: selectedRoomNo,
      guestName: selectedGuestName,
      kotNumbers: kotNums,
      items: billItems,
      taxableAmount: totalTaxable,
      gstPercent: 5.0,
      cgstAmount,
      sgstAmount,
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

    if (onBillSaved) {
      onBillSaved(billRecord);
    }

    if (printSlip) {
      setShowPrintSlip(true);
    } else {
      alert(`Food Bill ${billNo} saved successfully! Settled via: ${settlementType}`);
      onClose();
    }
  };

  const handleAddNew = () => {
    setBillNo(`SHRI/${Math.floor(250 + Math.random() * 50)}/24-25`);
    setBillItems([]);
    setShowPrintSlip(false);
  };

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div 
        className="pms-form-box" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: showPrintSlip ? 480 : 1050 }}
      >
        {!showPrintSlip ? (
          <>
            {/* Top Bar matching Frame 0200 */}
            <div className="pms-form-banner banner-navy" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Food Bill Generation &bull; demo.datahouseerp.com/facttkot_records</span>
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
                  Food &amp; Beverage Bill (5% GST &bull; SAC 996331)
                </span>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleAddNew}
                    style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '5px 14px', borderRadius: 3, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Add New
                  </button>

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
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '5px 18px', borderRadius: 3, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                  >
                    Save &amp; Print
                  </button>
                </div>
              </div>

              {/* Header Controls (Frame 0200) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.3fr 1.8fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
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
                  <label className="form-label-pms">Time</label>
                  <input
                    type="text"
                    value={billTime}
                    onChange={e => setBillTime(e.target.value)}
                    className="form-input-pms"
                  />
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Bill No</label>
                  <input
                    type="text"
                    readOnly
                    value={billNo}
                    className="form-input-pms"
                    style={{ background: '#f1f5f9', fontWeight: 800 }}
                  />
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Select Room (Guest || Room)</label>
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
                    {occupiedRooms.length === 0 && (
                      <option value="103">ALOK JAIN || 103</option>
                    )}
                  </select>
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">KOT No</label>
                  <input
                    type="text"
                    readOnly
                    value={kotNoDisplay}
                    className="form-input-pms"
                    style={{ background: '#f1f5f9', fontWeight: 700 }}
                  />
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Dis %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={discountPercent}
                    onChange={e => handleDiscountPercentChange(Number(e.target.value))}
                    className="form-input-pms"
                    style={{ textAlign: 'right' }}
                  />
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Dis Amt</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={e => handleDiscountAmountChange(Number(e.target.value))}
                    className="form-input-pms"
                    style={{ textAlign: 'right' }}
                  />
                </div>
              </div>

              {/* Exact Table matching Frame 0200 */}
              <div style={{ overflowX: 'auto', border: '1px solid #0f172a', borderRadius: 3, marginBottom: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#fff', textAlign: 'left' }}>
                      <th style={{ padding: '6px 6px', width: 35 }}>S.No</th>
                      <th style={{ padding: '6px 6px' }}>Item Name</th>
                      <th style={{ padding: '6px 6px', width: 50, textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '6px 6px', width: 70, textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: '6px 6px', width: 75, textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '6px 6px', width: 55, textAlign: 'right' }}>Dis%</th>
                      <th style={{ padding: '6px 6px', width: 65, textAlign: 'right' }}>Dis Amt</th>
                      <th style={{ padding: '6px 6px', width: 75, textAlign: 'right' }}>Taxable</th>
                      <th style={{ padding: '6px 6px', width: 65, textAlign: 'right' }}>GST%</th>
                      <th style={{ padding: '6px 6px', width: 55, textAlign: 'right' }}>VAT%</th>
                      <th style={{ padding: '6px 6px', width: 55, textAlign: 'right' }}>SUR%</th>
                      <th style={{ padding: '6px 6px', width: 80, textAlign: 'right' }}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td style={{ padding: '5px 6px' }}>{item.sNo}</td>
                        <td style={{ padding: '5px 6px', fontWeight: 600 }}>{item.itemName}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'center', fontWeight: 700 }}>{item.qty.toFixed(2)}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right' }}>{item.amount.toFixed(2)}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right' }}>{(item.discountPercent || 0).toFixed(2)}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right' }}>{(item.discountAmount || 0).toFixed(2)}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600 }}>{item.taxable.toFixed(2)}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right' }}>{item.gstPercent.toFixed(4)}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right' }}>{(item.vatPercent || 0).toFixed(2)}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right' }}>{(item.surPercent || 0).toFixed(2)}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 800, color: '#0369a1' }}>
                          {item.value.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {billItems.length === 0 && (
                      <tr>
                        <td colSpan={12} style={{ textAlign: 'center', padding: 18, color: '#94a3b8' }}>
                          No pending KOT items for this room.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#1e293b', color: '#fff', fontWeight: 800 }}>
                      <td style={{ padding: '6px 6px' }}>Total</td>
                      <td style={{ padding: '6px 6px' }}>{billItems.length}</td>
                      <td style={{ padding: '6px 6px', textAlign: 'center' }}>{totalQty}</td>
                      <td></td>
                      <td style={{ padding: '6px 6px', textAlign: 'right' }}>{totalAmount.toFixed(2)}</td>
                      <td></td>
                      <td style={{ padding: '6px 6px', textAlign: 'right' }}>{discountAmount.toFixed(2)}</td>
                      <td style={{ padding: '6px 6px', textAlign: 'right' }}>{totalTaxable.toFixed(2)}</td>
                      <td style={{ padding: '6px 6px', textAlign: 'right' }}>{gstAmount.toFixed(2)}</td>
                      <td style={{ padding: '6px 6px', textAlign: 'right' }}>0.00</td>
                      <td style={{ padding: '6px 6px', textAlign: 'right' }}>0.00</td>
                      <td style={{ padding: '6px 6px', textAlign: 'right' }}>{netBillAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bottom Settlement Controls matching Frame 0200 */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: 10,
                borderRadius: 4,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1.2fr 2fr 1fr 1.5fr',
                gap: 8,
                alignItems: 'center'
              }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block' }}>Taxable Amt</label>
                  <input
                    type="text"
                    readOnly
                    value={`₹${totalTaxable.toFixed(2)}`}
                    className="form-input-pms"
                    style={{ background: '#f1f5f9', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block' }}>Round Off</label>
                  <input
                    type="text"
                    readOnly
                    value={`${roundOff >= 0 ? '+' : ''}${roundOff.toFixed(2)}`}
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
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block' }}>Amount In Words</label>
                  <input
                    type="text"
                    readOnly
                    value={amountInWords}
                    className="form-input-pms"
                    style={{ background: '#f1f5f9', fontSize: 11 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', display: 'block' }}>Net Payable</label>
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
                    onChange={e => setSettlementType(e.target.value as any)}
                    className="form-select-pms"
                    style={{ fontWeight: 800, borderColor: '#0284c7' }}
                  >
                    <option value="Settle To Room">Settle To Room (Folio)</option>
                    <option value="Cash">Cash (Immediate Pay)</option>
                    <option value="UPI">UPI / PhonePe</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  * Selecting 'Settle To Room' posts this ₹{netBillAmount} directly into Room {selectedRoomNo}'s checkout folio.
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
                    onClick={() => handleSaveBill(true)}
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 20px', borderRadius: 3, fontWeight: 800, cursor: 'pointer' }}
                  >
                    Generate Bill
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Thermal POS & GST Food Bill Print Slip */
          <div style={{ padding: 16 }}>
            <div style={{
              background: '#fff',
              border: '1px solid #334155',
              padding: 16,
              fontFamily: 'monospace',
              fontSize: 12,
              color: '#000'
            }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #334155', paddingBottom: 8, marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>HOTEL SAI VASUDEV RESIDENCY</h3>
                <p style={{ margin: '2px 0', fontSize: 11 }}>Pimpalwadi Road, Near Sai Temple, Shirdi - 423109</p>
                <p style={{ margin: '2px 0', fontSize: 10 }}>GSTIN: 27AABCS1429B1Z2 &bull; SAC: 996331</p>
                <div style={{
                  display: 'inline-block',
                  border: '1px solid #000',
                  padding: '2px 8px',
                  fontWeight: 900,
                  fontSize: 12,
                  marginTop: 4
                }}>
                  FOOD &amp; BEVERAGE BILL
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 11, marginBottom: 8 }}>
                <div><strong>Bill No:</strong> {savedBill?.billNo || billNo}</div>
                <div style={{ textAlign: 'right' }}><strong>Room No:</strong> {selectedRoomNo}</div>
                <div><strong>Date:</strong> {billDate} {billTime}</div>
                <div style={{ textAlign: 'right' }}><strong>Guest:</strong> {selectedGuestName}</div>
                <div><strong>KOT Ref:</strong> {kotNoDisplay}</div>
                <div style={{ textAlign: 'right', color: '#16a34a', fontWeight: 800 }}>
                  <strong>{settlementType}</strong>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', marginBottom: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 35px 55px 65px', fontWeight: 900 }}>
                  <span>#</span>
                  <span>Item</span>
                  <span style={{ textAlign: 'center' }}>Qty</span>
                  <span style={{ textAlign: 'right' }}>Rate</span>
                  <span style={{ textAlign: 'right' }}>Amount</span>
                </div>
                {billItems.map((it, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 35px 55px 65px', padding: '2px 0' }}>
                    <span>{idx + 1}</span>
                    <span>{it.itemName}</span>
                    <span style={{ textAlign: 'center' }}>{it.qty}</span>
                    <span style={{ textAlign: 'right' }}>₹{it.rate.toFixed(2)}</span>
                    <span style={{ textAlign: 'right', fontWeight: 700 }}>₹{it.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Taxable Food Amount:</span>
                  <span>₹{totalTaxable.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CGST @ 2.5%:</span>
                  <span>₹{cgstAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>SGST @ 2.5%:</span>
                  <span>₹{sgstAmount.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>Less Discount ({discountPercent}%):</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {roundOff !== 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Round Off:</span>
                    <span>{roundOff.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #000', paddingTop: 4, marginTop: 4, fontSize: 13, fontWeight: 900 }}>
                  <span>NET BILL AMOUNT:</span>
                  <span>₹{netBillAmount.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: 10, fontStyle: 'italic', marginTop: 2 }}>
                  ({amountInWords})
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #000', paddingTop: 8, marginTop: 8, textAlign: 'center', fontSize: 10 }}>
                Thank you for dining with us! &bull; Om Sai Ram
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
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
                  Print Bill
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 3, cursor: 'pointer', fontWeight: 800 }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
