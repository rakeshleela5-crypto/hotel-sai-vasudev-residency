import React, { useState } from 'react';
import type { PmsRoom, PmsCheckOutDetail } from '../../types/pmsModels';
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

  const defaultInvoiceNo = `GSR/${Math.floor(100 + Math.random() * 900)}/24-25`;
  const guest = targetRoom.currentGuest;

  const todayStr = new Date().toISOString().split('T')[0];

  const [invoiceNo] = useState(defaultInvoiceNo);
  const [checkInDate] = useState(guest?.checkInDate || todayStr);
  const [checkInTime] = useState(guest?.checkInTime || '11:34 PM');
  const [checkOutDate, setCheckOutDate] = useState(todayStr);
  const [checkOutTime, setCheckOutTime] = useState('11:42 PM');
  const [calculationType, setCalculationType] = useState<'24hour' | '12hour'>(
    guest?.calculationType || '24hour'
  );
  const [noOfDays, setNoOfDays] = useState(1);
  const [perDayTariff] = useState(targetRoom.tariff);

  // Charges
  const totalRoomRent = perDayTariff * noOfDays;
  const foodAmount = targetRoom.foodAmount || 100;
  const [gstPercent, setGstPercent] = useState<number>(12);
  const [addOthers, setAddOthers] = useState<number>(0);
  const [lessDiscount, setLessDiscount] = useState<number>(0);
  const advanceDeducted = guest?.advancePaid || 0;

  // Remarks
  const [checkInRemark, setCheckInRemark] = useState('');
  const [checkoutRemark, setCheckoutRemark] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState<PmsCheckOutDetail['paymentMode']>('Cash');

  // Compute Taxes & Total Bill Amount matching Frame 0140:
  // Rent = 2000, 12% GST = 240, Food = 100 => Bill Amount = 2340
  const gstAmount = Math.round((totalRoomRent * gstPercent) / 100);
  const grandTotal = totalRoomRent + gstAmount + foodAmount + addOthers - lessDiscount;
  const netPayable = Math.max(0, grandTotal - advanceDeducted);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const checkoutData: PmsCheckOutDetail = {
      invoiceNo,
      roomNo: targetRoom.roomNo,
      roomType: targetRoom.roomType,
      guestName: guest?.name || 'Walk-in Guest',
      guestPhone: guest?.phone || '9622975444',
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      calculationType,
      numberOfDays: noOfDays,
      perDayTariff,
      totalRoomRent,
      foodAmount,
      gstPercent,
      gstAmount,
      addOthers,
      lessDiscount,
      advanceDeducted,
      billAmount: grandTotal,
      paymentMode,
      checkoutRemark,
      gstNumber,
      city: 'Shirdi',
      state: 'Maharashtra',
      country: 'India',
      pinCode: '423109'
    };

    PmsStore.saveCheckout(checkoutData);
    onCheckoutComplete(checkoutData);
    onClose();
  };

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div className="pms-form-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 980 }}>
        {/* Yellow-Green Banner matching Frame 0140 */}
        <div className="pms-form-banner">
          New Room Check Out Ente
        </div>

        <form onSubmit={handleCheckoutSubmit} className="pms-form-body">
          {/* Top Info Banner & Action Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ flex: 1, marginRight: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', marginBottom: 3 }}>
                Selected Checkin Detail
              </div>
              <input
                type="text"
                readOnly
                value={`${guest?.name || 'AJUU'} || ${guest?.phone || '9622975444'} || Room: ${targetRoom.roomNo} (${targetRoom.roomType})`}
                className="form-input-pms"
                style={{ background: '#f8fafc', fontWeight: 700, color: '#0f172a' }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: '#c0392b',
                color: '#ffffff',
                border: 'none',
                padding: '8px 20px',
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              My Checkout
            </button>
          </div>

          <div className="pms-grid-2col">
            {/* Left Form: Stay & Guest Fields */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div className="form-group-pms">
                  <label className="form-label-pms">Invoice No</label>
                  <input type="text" readOnly value={invoiceNo} className="form-input-pms" style={{ background: '#f1f5f9', fontWeight: 700 }} />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Check In Date</label>
                  <input type="text" readOnly value={checkInDate} className="form-input-pms" style={{ background: '#f1f5f9' }} />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Check In Time</label>
                  <input type="text" readOnly value={checkInTime} className="form-input-pms" style={{ background: '#f1f5f9' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div className="form-group-pms">
                  <label className="form-label-pms">Check Out Date</label>
                  <input type="date" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Check Out Time</label>
                  <input type="text" value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Calculation Type</label>
                  <select value={calculationType} onChange={e => setCalculationType(e.target.value as any)} className="form-select-pms" style={{ fontWeight: 600 }}>
                    <option value="24hour">24hour System</option>
                    <option value="12hour">12hour Policy</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div className="form-group-pms">
                  <label className="form-label-pms">No Of Days</label>
                  <input type="number" min="1" value={noOfDays} onChange={e => setNoOfDays(Number(e.target.value))} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Per Day Tariff (₹)</label>
                  <input type="text" readOnly value={perDayTariff.toFixed(2)} className="form-input-pms" style={{ background: '#f1f5f9' }} />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Total Room Rent (₹)</label>
                  <input type="text" readOnly value={totalRoomRent} className="form-input-pms" style={{ background: '#e0f2fe', fontWeight: 700 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group-pms">
                  <label className="form-label-pms">Food Amount (From KOT)</label>
                  <input type="text" readOnly value={`₹${foodAmount}`} className="form-input-pms" style={{ background: '#fef3c7', fontWeight: 700 }} />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">GST NO</label>
                  <input type="text" placeholder="e.g. 27AAAAA0000A1Z5" value={gstNumber} onChange={e => setGstNumber(e.target.value)} className="form-input-pms" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group-pms">
                  <label className="form-label-pms">Check In Remark</label>
                  <input type="text" placeholder="Check-in note" value={checkInRemark} onChange={e => setCheckInRemark(e.target.value)} className="form-input-pms" />
                </div>
                <div className="form-group-pms">
                  <label className="form-label-pms">Checkout Remark</label>
                  <input type="text" placeholder="e.g. Guest checked out satisfied" value={checkoutRemark} onChange={e => setCheckoutRemark(e.target.value)} className="form-input-pms" />
                </div>
              </div>

              {/* Guest Profile Summary */}
              <div style={{ background: '#f8fafc', padding: 8, borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 11, color: '#475569' }}>
                <strong>Guest:</strong> {guest?.name || 'AJUU'} | <strong>Mobile:</strong> {guest?.phone || '9622975444'} | <strong>Country:</strong> India
              </div>
            </div>

            {/* Right Column: Room Mini Table & Detailed Settlement (Frame 0140) */}
            <div>
              {/* Room Badge Table */}
              <div style={{ border: '1px solid #84cc16', borderRadius: 4, padding: 6, marginBottom: 12 }}>
                <table className="pms-table-compact">
                  <thead>
                    <tr>
                      <th style={{ width: 30 }}>#</th>
                      <th>Room No</th>
                      <th>Room Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'center' }}>
                        <input type="checkbox" checked readOnly />
                      </td>
                      <td style={{ fontWeight: 700 }}>{targetRoom.roomNo}</td>
                      <td>{targetRoom.roomType}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Detail Box matching Frame 0140 */}
              <div style={{ border: '2px solid #84cc16', borderRadius: 4, padding: 12, background: '#f8fafc' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#15803d', borderBottom: '1px solid #cbd5e1', paddingBottom: 4, marginBottom: 10 }}>
                  Payment Detail
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Total Room Rent 🧾</span>
                  <input type="text" readOnly value={totalRoomRent} className="form-input-pms" style={{ width: 100, textAlign: 'right', background: '#f1f5f9' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>ADD GST %</span>
                    <select
                      value={gstPercent}
                      onChange={e => setGstPercent(Number(e.target.value))}
                      className="form-select-pms"
                      style={{ width: 90, padding: 2 }}
                    >
                      <option value="12">12.0000 %</option>
                      <option value="18">18.0000 %</option>
                      <option value="5">5.0000 %</option>
                      <option value="0">0.0000 %</option>
                    </select>
                  </div>
                  <input type="text" readOnly value={gstAmount} className="form-input-pms" style={{ width: 100, textAlign: 'right', background: '#f1f5f9' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Total Food Amt</span>
                  <input type="text" readOnly value={foodAmount} className="form-input-pms" style={{ width: 100, textAlign: 'right', background: '#f1f5f9' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Add Others (+)</span>
                  <input
                    type="number"
                    min="0"
                    value={addOthers}
                    onChange={e => setAddOthers(Number(e.target.value))}
                    className="form-input-pms"
                    style={{ width: 100, textAlign: 'right' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Less Discount (-)</span>
                  <input
                    type="number"
                    min="0"
                    value={lessDiscount}
                    onChange={e => setLessDiscount(Number(e.target.value))}
                    className="form-input-pms"
                    style={{ width: 100, textAlign: 'right' }}
                  />
                </div>

                {advanceDeducted > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, color: '#16a34a' }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Less Advance Paid (-)</span>
                    <input type="text" readOnly value={advanceDeducted} className="form-input-pms" style={{ width: 100, textAlign: 'right', background: '#dcfce7', fontWeight: 700, color: '#15803d' }} />
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '2px dashed #94a3b8',
                  paddingTop: 8,
                  marginTop: 6
                }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Bill Amount (₹)</span>
                  <input
                    type="text"
                    readOnly
                    value={grandTotal}
                    className="form-input-pms"
                    style={{ width: 110, textAlign: 'right', background: '#dcfce7', fontWeight: 800, fontSize: 15, color: '#15803d' }}
                  />
                </div>

                {advanceDeducted > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 6,
                    marginTop: 4,
                    color: '#b91c1c'
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>Net Balance Due (₹)</span>
                    <input
                      type="text"
                      readOnly
                      value={netPayable}
                      className="form-input-pms"
                      style={{ width: 110, textAlign: 'right', background: '#fee2e2', fontWeight: 800, fontSize: 14, color: '#b91c1c' }}
                    />
                  </div>
                )}

                <div style={{ marginTop: 10 }}>
                  <label className="form-label-pms">Payment Settlement Mode</label>
                  <select value={paymentMode} onChange={e => setPaymentMode(e.target.value as any)} className="form-select-pms" style={{ fontWeight: 700 }}>
                    <option value="Cash">Cash at Counter</option>
                    <option value="UPI">UPI / GooglePay / PhonePe</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Credit">Bill to Company / Corporate Credit</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="pms-btn-group">
            <button type="button" onClick={onClose} className="btn-pms-cancel">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                window.print();
              }}
              className="btn-pms-print"
            >
              🖨️ Print Bill / Invoice
            </button>
            <button type="submit" className="btn-pms-save">
              Complete Checkout & Settle Bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
