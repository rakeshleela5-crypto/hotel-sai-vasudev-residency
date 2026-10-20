import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { FoodBillItem, PmsFoodBill, PmsKotRecord } from '../../types/pmsModels';

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

  const tables = PmsStore.getTables();
  const occupiedRooms = PmsStore.getRooms().filter(r => r.status === 'occupied');
  const companyInfo = PmsStore.getCompanyInfo();

  const isTableMode = Boolean(defaultTableNo) || (!defaultRoomNo && tables.length > 0);

  const [serviceType, setServiceType] = useState<string>(
    defaultTableNo ? 'Table Service' : defaultRoomNo ? 'Room Service' : 'Table Service'
  );
  const [selectedTable, setSelectedTable] = useState<string>(
    defaultTableNo || (tables.find(t => t.status === 'Running')?.tableName || 'Table T-1')
  );
  const [selectedRoomNo, setSelectedRoomNo] = useState<string>(
    defaultRoomNo || occupiedRooms[0]?.roomNo || '103'
  );

  const [customerName, setCustomerName] = useState<string>('vinod sharma');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('7657657655');
  const [customerRemark, setCustomerRemark] = useState<string>('');
  const [paymentRemark, setPaymentRemark] = useState<string>('');

  const [billNo, setBillNo] = useState<string>(
    isTableMode ? `Res/${Math.floor(260 + Math.random() * 20)}/24-25` : `SHRI/${Math.floor(235 + Math.random() * 20)}/24-25`
  );
  const [billDate, setBillDate] = useState<string>('16-06-2025');
  const billTime = '08:18';
  const [printApproval, setPrintApproval] = useState<boolean>(true);
  const [discountPercent, setDiscountPercent] = useState<number>(5);
  const [discountAmount, setDiscountAmount] = useState<number>(13.69);
  const [settlementType, setSettlementType] = useState<string>(
    isTableMode ? 'Settle To Cash' : 'Settle To Room'
  );

  const [pendingKots, setPendingKots] = useState<PmsKotRecord[]>([]);
  const [billItems, setBillItems] = useState<FoodBillItem[]>([]);
  const [showPrintSlip, setShowPrintSlip] = useState<boolean>(false);
  const [savedBill, setSavedBill] = useState<PmsFoodBill | null>(null);

  // Load KOTs
  useEffect(() => {
    let kots: PmsKotRecord[] = [];
    if (serviceType === 'Room Service') {
      kots = PmsStore.getKots().filter(
        k => k.roomNo === selectedRoomNo && k.status !== 'Billed' && k.status !== 'Cancelled'
      );
      const room = occupiedRooms.find(r => r.roomNo === selectedRoomNo);
      if (room?.currentGuest) {
        setCustomerName(room.currentGuest.name);
        setCustomerMobile(room.currentGuest.phone || '');
      }
    } else {
      const cleanTable = selectedTable.toLowerCase().replace(/^table\s+/i, '').trim();
      kots = PmsStore.getKots().filter(k => {
        const kTable = (k.tableNo || '').toLowerCase().replace(/^table\s+/i, '').trim();
        return kTable === cleanTable && k.status !== 'Billed' && k.status !== 'Cancelled';
      });
      if (kots.length > 0 && kots[0].guestName && kots[0].guestName !== 'Walk-In Guest') {
        setCustomerName(kots[0].guestName);
      } else {
        setCustomerName('vinod sharma');
        setCustomerMobile('7657657655');
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
      // Default sample matching Video 18 Frame 0330
      const defaultSample: FoodBillItem[] = [
        {
          sNo: 1,
          itemName: 'WATER BOTLE',
          itemCode: '10003',
          qty: 1.0,
          rate: 28.57,
          amount: 28.57,
          discountPercent: 5,
          discountAmount: 1.43,
          taxable: 27.14,
          gstPercent: 5.0,
          gstAmount: 1.36,
          vatPercent: 0,
          surPercent: 0,
          value: 28.50
        },
        {
          sNo: 2,
          itemName: 'bread pakoda',
          itemCode: '10006',
          qty: 1.0,
          rate: 95.24,
          amount: 95.24,
          discountPercent: 5,
          discountAmount: 4.76,
          taxable: 90.48,
          gstPercent: 5.0,
          gstAmount: 4.52,
          vatPercent: 0,
          surPercent: 0,
          value: 95.00
        },
        {
          sNo: 3,
          itemName: 'Paneer Dum Biryani',
          itemCode: '10018',
          qty: 1.0,
          rate: 90.0,
          amount: 90.0,
          discountPercent: 5,
          discountAmount: 4.50,
          taxable: 85.50,
          gstPercent: 5.0,
          gstAmount: 4.28,
          vatPercent: 0,
          surPercent: 0,
          value: 89.78
        },
        {
          sNo: 4,
          itemName: 'BADA PAO',
          itemCode: '10022',
          qty: 1.0,
          rate: 60.0,
          amount: 60.0,
          discountPercent: 5,
          discountAmount: 3.00,
          taxable: 57.00,
          gstPercent: 0.0,
          gstAmount: 0.0,
          vatPercent: 0,
          surPercent: 0,
          value: 57.00
        }
      ];
      setBillItems(defaultSample);
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
      kotNums.push('KOT/372/24-25', 'KOT/374/24-25');
    }

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
      remark: customerRemark,
      paymentRemark,
      kotNumbers: kotNums,
      items: billItems,
      taxableAmount: totalTaxable,
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

    if (onBillSaved) {
      onBillSaved(billRecord);
    }

    if (printSlip) {
      setShowPrintSlip(true);
    } else {
      alert(`Restaurant Food Bill ${billNo} saved & settled! Table ${selectedTable} has been vacated.`);
      onClose();
    }
  };

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div 
        className="pms-form-box" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: showPrintSlip ? 450 : 1080, maxHeight: '92vh', overflowY: 'auto' }}
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
                    style={{
                      background: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 20px',
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(2,132,199,0.3)'
                    }}
                  >
                    Save &amp; Print
                  </button>
                </div>
              </div>

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
                      {occupiedRooms.length === 0 && <option value="103">ALOK JAIN || 103</option>}
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
                    onChange={e => applyDiscount(Number(e.target.value))}
                    className="form-input-pms"
                    style={{ textAlign: 'right', fontWeight: 700 }}
                  />
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

              {/* Row 2 Customer Info matching Frame 0330 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.6fr 1.6fr 1.4fr 1.4fr',
                  gap: 8,
                  marginBottom: 12
                }}
              >
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Name</label>
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
                    {billItems.map((item, idx) => (
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
                    ))}
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
                    title="Send food bill receipt to guest WhatsApp"
                  >
                    <span>💬</span> WhatsApp Food Bill
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveBill(true)}
                    style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '7px 22px', borderRadius: 4, fontWeight: 800, cursor: 'pointer' }}
                  >
                    Save &amp; Settle Bill
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Thermal POS Food Bill Print Slip matching Frame 0370 */
          <div style={{ padding: 16 }}>
            <div
              id="food-bill-print-slip"
              className="printable-thermal-receipt"
              style={{
                background: '#fff',
                border: '1px solid #334155',
                padding: '20px 16px',
                fontFamily: 'monospace',
                fontSize: 12,
                color: '#000',
                maxWidth: 380,
                margin: '0 auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {/* Hotel Header */}
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #334155', paddingBottom: 8, marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900 }}>
                  {companyInfo.firmName || 'HOTEL SAI VASUDEV RESIDENCY'}
                </h3>
                <p style={{ margin: '2px 0', fontSize: 10 }}>
                  {companyInfo.address1 || 'Plot No. 14-B VIP Temple Road, Shirdi - 423109'}
                </p>
                <p style={{ margin: '2px 0', fontSize: 10 }}>
                  GSTIN: {companyInfo.gstNo || '27ABCDE1234F1Z5'} &bull; SAC: 996331
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
      </div>
    </div>
  );
};
