import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';
import type { PmsAdvanceReceipt } from '../../types/pmsModels';

interface AdvanceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRoomNo?: string;
}

export const AdvanceReceiptModal: React.FC<AdvanceReceiptModalProps> = ({
  isOpen,
  onClose,
  targetRoomNo
}) => {
  const [receipts, setReceipts] = useState<PmsAdvanceReceipt[]>(PmsStore.getAdvanceReceipts());
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [printingReceipt, setPrintingReceipt] = useState<PmsAdvanceReceipt | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setReceipts(PmsStore.getAdvanceReceipts());
    const unsub = PmsStore.subscribe(() => {
      setReceipts(PmsStore.getAdvanceReceipts());
    });

    // Sync from PostgreSQL
    hotelApi.getAdvanceReceipts()
      .then(pgReceipts => {
        if (Array.isArray(pgReceipts) && pgReceipts.length > 0) {
          const current = PmsStore.getAdvanceReceipts();
          const map = new Map(current.map(r => [r.receiptNo, r]));
          pgReceipts.forEach(r => map.set(r.receiptNo, r));
          const merged = Array.from(map.values());
          localStorage.setItem('svr_pms_advance_receipts', JSON.stringify(merged));
          setReceipts(merged);
        }
      })
      .catch(err => {
        console.warn('[AdvanceReceiptModal] PostgreSQL sync note:', err);
      });

    return () => unsub();
  }, [isOpen]);

  // Form state for "Add Reciept" modal (matching Video 06 Frame 0148 & 0154)
  const rooms = PmsStore.getRooms();
  const occupiedRooms = rooms.filter(r => r.status === 'occupied' && r.currentGuest);

  const [receiptNo, setReceiptNo] = useState(`AR${Math.floor(13 + Math.random() * 20)}`);
  const [voucherNo, setVoucherNo] = useState(`${Math.floor(13 + Math.random() * 20)}`);
  const [receiptDate, setReceiptDate] = useState('07-06-2025');
  const [paymentMode, setPaymentMode] = useState<PmsAdvanceReceipt['paymentMode']>('Cash');
  const [selectedAccount, setSelectedAccount] = useState<string>(
    occupiedRooms.length > 0 
      ? `${occupiedRooms[0].currentGuest?.name}||${occupiedRooms[0].currentGuest?.checkInDate || '2025-06-07'}|| ${occupiedRooms[0].roomNo}||${occupiedRooms[0].currentGuest?.phone || '8432066047'}`
      : 'Shiv||2025-06-07|| 101||8432066047'
  );
  const [amount, setAmount] = useState<number | ''>('');
  const [remark, setRemark] = useState('advance');

  if (!isOpen) return null;

  const filteredReceipts = receipts.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.receiptNo.toLowerCase().includes(q) ||
      r.guestName.toLowerCase().includes(q) ||
      r.roomNo.toLowerCase().includes(q) ||
      (r.mobile && r.mobile.includes(q)) ||
      (r.remark && r.remark.toLowerCase().includes(q))
    );
  });

  const handleOpenAddModal = (presetRoomNo?: string) => {
    const nextNum = receipts.length + 12;
    setReceiptNo(`AR${nextNum}`);
    setVoucherNo(`${nextNum}`);
    setAmount('');
    setRemark('advance');
    setPaymentMode('Cash');

    if (presetRoomNo) {
      const match = occupiedRooms.find(r => r.roomNo === presetRoomNo);
      if (match && match.currentGuest) {
        setSelectedAccount(`${match.currentGuest.name}||${match.currentGuest.checkInDate || '2025-06-07'}|| ${match.roomNo}||${match.currentGuest.phone || ''}`);
      }
    } else if (occupiedRooms.length > 0) {
      const match = occupiedRooms[0];
      setSelectedAccount(`${match.currentGuest?.name}||${match.currentGuest?.checkInDate || '2025-06-07'}|| ${match.roomNo}||${match.currentGuest?.phone || ''}`);
    }

    setIsAddModalOpen(true);
  };

  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid advance amount.');
      return;
    }

    // Parse the selected account string: GuestName||CheckInDate|| RoomNo||Mobile
    const parts = selectedAccount.split('||').map(s => s.trim());
    const guestName = parts[0] || 'Guest';
    const roomNo = parts[2] || targetRoomNo || '101';
    const mobile = parts[3] || '9876543210';

    const newReceipt: PmsAdvanceReceipt = {
      receiptNo,
      voucherNo,
      date: receiptDate,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      voucherName: 'Advance_Receipt',
      roomNo,
      guestName,
      mobile,
      amount: Number(amount),
      paymentMode,
      remark: remark || 'advance',
      createdAt: new Date().toISOString()
    };

    setIsSaving(true);
    try {
      await hotelApi.saveAdvanceReceipt({
        receiptNo: newReceipt.receiptNo,
        voucherNo: newReceipt.voucherNo,
        date: newReceipt.date,
        time: newReceipt.time,
        voucherName: newReceipt.voucherName,
        roomNo: newReceipt.roomNo,
        guestName: newReceipt.guestName,
        mobile: newReceipt.mobile,
        amount: newReceipt.amount,
        paymentMode: newReceipt.paymentMode,
        remark: newReceipt.remark
      });
    } catch (err) {
      console.warn('[AdvanceReceiptModal] PostgreSQL sync deferred to background:', err);
    } finally {
      PmsStore.saveAdvanceReceipt(newReceipt);
      setReceipts(PmsStore.getAdvanceReceipts());
      setIsSaving(false);
      setIsAddModalOpen(false);
      setPrintingReceipt(newReceipt);
    }
  };

  const handleDeleteReceipt = (receiptNoToDelete: string) => {
    if (confirm(`Are you sure you want to delete Advance Receipt ${receiptNoToDelete}?`)) {
      PmsStore.deleteAdvanceReceipt(receiptNoToDelete);
      setReceipts(PmsStore.getAdvanceReceipts());
    }
  };

  const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString().length > 9 ? parseFloat(num.toString().substring(0, 9)) : num) === 0) return 'Zero';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
    str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'Only' : 'Only';
    return str;
  };

  return (
    <div className="pms-overlay" onClick={onClose}>
      <div className="pms-window" style={{ maxWidth: 1100 }} onClick={e => e.stopPropagation()}>
        {/* Top Header */}
        <div className="pms-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>💵</span>
            <div>
              <h2 className="pms-brand-title" style={{ margin: 0 }}>
                ADD Advance Receipt
              </h2>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                pms.hotelsai-vasudev.com/advace_receipt &bull; Room Advance Register
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="pms-btn-action"
              style={{ background: '#0284c7', color: '#fff' }}
              onClick={() => handleOpenAddModal(targetRoomNo)}
            >
              ➕ Add Advance Receipt
            </button>
            <button type="button" className="pms-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px 20px', background: '#f8fafc', color: '#0f172a', minHeight: 480 }}>
          {/* Top filter toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: '#475569' }}>
              Show{' '}
              <select className="form-select-pms" style={{ display: 'inline-block', width: 65, padding: '2px 4px' }}>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>{' '}
              entries per page
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Search:</label>
              <input
                type="text"
                placeholder="Guest, Room, Receipt No..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-input-pms"
                style={{ width: 220, padding: '4px 8px' }}
              />
            </div>
          </div>

          {/* Table matching Frame 0148 & 0150 */}
          <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                  <th style={{ padding: '8px 10px', width: 45, textAlign: 'center' }}>S.No</th>
                  <th style={{ padding: '8px 10px' }}>Date</th>
                  <th style={{ padding: '8px 10px' }}>Receipt No</th>
                  <th style={{ padding: '8px 10px' }}>Voucher No</th>
                  <th style={{ padding: '8px 10px' }}>Room No</th>
                  <th style={{ padding: '8px 10px' }}>Account / Guest Name</th>
                  <th style={{ padding: '8px 10px' }}>Mobile</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount (₹)</th>
                  <th style={{ padding: '8px 10px' }}>Payment Mode</th>
                  <th style={{ padding: '8px 10px' }}>Remark</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                      No advance receipts found. Click <strong>+ Add Advance Receipt</strong> to record guest advance.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((r, idx) => (
                    <tr key={r.receiptNo} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{r.date}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0369a1' }}>{r.receiptNo}</td>
                      <td style={{ padding: '8px 10px' }}>{r.voucherNo || '-'}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>
                          Room {r.roomNo}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.guestName}</td>
                      <td style={{ padding: '8px 10px', color: '#64748b' }}>{r.mobile}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                        ₹{Number(r.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 3, fontSize: 11, fontWeight: 600 }}>
                          {r.paymentMode}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#475569', fontStyle: 'italic' }}>
                        {r.remark || '-'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                          <button
                            type="button"
                            title="Print Advance Slip"
                            onClick={() => setPrintingReceipt(r)}
                            style={{ background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: 3, padding: '3px 6px', cursor: 'pointer', fontSize: 13 }}
                          >
                            🖨️
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => handleDeleteReceipt(r.receiptNo)}
                            style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 3, padding: '3px 6px', cursor: 'pointer', color: '#b91c1c', fontSize: 13 }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 14, fontSize: 12, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
            <span>Showing {filteredReceipts.length} of {receipts.length} entries</span>
            <span>Total Advance Stacked: ₹{receipts.reduce((sum, r) => sum + Number(r.amount), 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* "Add Reciept" Modal Popup matching Video 06 Frame 0148 & 0154 */}
      {isAddModalOpen && (
        <div
          className="pms-overlay"
          style={{ background: 'rgba(0,0,0,0.6)', zIndex: 9999 }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 6,
              width: 440,
              maxWidth: '92vw',
              padding: '16px 20px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
              color: '#1e293b'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                Add Reciept
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReceipt} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                  Voucher Name
                </label>
                <input
                  type="text"
                  value="Advance_Receipt"
                  disabled
                  className="form-input-pms"
                  style={{ background: '#f1f5f9', cursor: 'not-allowed', color: '#475569' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                    Reciept No
                  </label>
                  <input
                    type="text"
                    value={receiptNo}
                    onChange={e => setReceiptNo(e.target.value)}
                    className="form-input-pms"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                    Voucher No
                  </label>
                  <input
                    type="text"
                    value={voucherNo}
                    onChange={e => setVoucherNo(e.target.value)}
                    className="form-input-pms"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                  Date
                </label>
                <input
                  type="text"
                  value={receiptDate}
                  onChange={e => setReceiptDate(e.target.value)}
                  className="form-input-pms"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value as any)}
                  className="form-select-pms"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                  <option value="Card">Card</option>
                  <option value="PAY TM">PAY TM</option>
                  <option value="STATE BANK OF INDIA">STATE BANK OF INDIA</option>
                  <option value="tata moters">tata moters</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2, textDecoration: 'underline' }}>
                  Account
                </label>
                <select
                  value={selectedAccount}
                  onChange={e => setSelectedAccount(e.target.value)}
                  className="form-select-pms"
                >
                  <option value="">Select Account</option>
                  {occupiedRooms.map(r => (
                    <option
                      key={r.roomNo}
                      value={`${r.currentGuest?.name}||${r.currentGuest?.checkInDate || '2025-06-07'}|| ${r.roomNo}||${r.currentGuest?.phone || ''}`}
                    >
                      {`${r.currentGuest?.name}||${r.currentGuest?.checkInDate || '2025-06-07'}|| ${r.roomNo}||${r.currentGuest?.phone || ''}`}
                    </option>
                  ))}
                  <option value="Shiv||2025-06-07|| 101||8432066047">
                    Shiv||2025-06-07|| 101||8432066047
                  </option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                  Amount
                </label>
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="form-input-pms"
                  style={{ fontWeight: 700, fontSize: 14 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                  Remark
                </label>
                <input
                  type="text"
                  placeholder="Remark"
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  className="form-input-pms"
                />
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                  {['advance', 'advacnce againstchekin', 'advance mila for room booking', 'tariff'].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setRemark(chip)}
                      style={{
                        background: '#e2e8f0',
                        border: 'none',
                        borderRadius: 3,
                        padding: '1px 6px',
                        fontSize: 10,
                        cursor: 'pointer',
                        color: '#334155'
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    background: '#e2e8f0',
                    color: '#334155',
                    border: 'none',
                    borderRadius: 4,
                    padding: '6px 14px',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    background: isSaving ? '#64748b' : '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '6px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {isSaving ? '⏳ Saving to PostgreSQL...' : '✓ Save Receipt & Sync DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voucher Print Preview Modal */}
      {printingReceipt && (
        <div
          className="pms-overlay"
          style={{ background: 'rgba(0,0,0,0.7)', zIndex: 99999 }}
          onClick={() => setPrintingReceipt(null)}
        >
          <div
            style={{
              background: '#fff',
              color: '#000',
              padding: 24,
              borderRadius: 6,
              width: 500,
              maxWidth: '95vw',
              fontFamily: 'system-ui, sans-serif'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Printable Voucher Slip */}
            <div style={{ border: '2px solid #000', padding: 16 }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: 8, marginBottom: 10 }}>
                {(() => {
                  const comp = PmsStore.getCompanyInfo();
                  return (
                    <>
                      <h2 style={{ margin: 0, fontSize: 18, textTransform: 'uppercase' }}>{comp.firmName}</h2>
                      <div style={{ fontSize: 11 }}>{comp.address1}, {comp.city} - {comp.pincode} ({comp.state})</div>
                      <div style={{ fontSize: 11 }}>Tel: {comp.mobile} | GSTIN: {comp.gstNo}</div>
                    </>
                  );
                })()}
                <div style={{ display: 'inline-block', background: '#000', color: '#fff', padding: '2px 10px', fontSize: 12, fontWeight: 700, marginTop: 6, borderRadius: 2 }}>
                  ROOM ADVANCE RECEIPT
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 11, marginBottom: 8 }}>
                <div><strong>Receipt No:</strong> {printingReceipt.receiptNo}</div>
                <div style={{ textAlign: 'right' }}><strong>Date:</strong> {printingReceipt.date} {printingReceipt.time}</div>
                <div><strong>Voucher No:</strong> {printingReceipt.voucherNo || '-'}</div>
                <div style={{ textAlign: 'right' }}><strong>Room No:</strong> {printingReceipt.roomNo}</div>
              </div>

              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '8px 0', fontSize: 12, marginBottom: 12 }}>
                <div style={{ marginBottom: 4 }}>
                  <strong>Received with thanks from:</strong> {printingReceipt.guestName}
                </div>
                <div style={{ marginBottom: 4 }}>
                  <strong>Mobile Number:</strong> {printingReceipt.mobile}
                </div>
                <div style={{ marginBottom: 4 }}>
                  <strong>The Sum of Rupees:</strong> {numberToWords(printingReceipt.amount)}
                </div>
                <div style={{ marginBottom: 4 }}>
                  <strong>Payment Mode:</strong> {printingReceipt.paymentMode}
                </div>
                <div>
                  <strong>Remark / Purpose:</strong> {printingReceipt.remark || 'Advance against room stay'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 800, border: '1px solid #000', padding: '4px 12px' }}>
                  ₹ {Number(printingReceipt.amount).toFixed(2)}
                </div>
                <div style={{ fontSize: 10, fontStyle: 'italic', color: '#555' }}>
                  *Subject to realization of payment
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, fontSize: 11, borderTop: '1px solid #ccc', paddingTop: 8 }}>
                <div>Guest Signature</div>
                <div>Authorized Cashier / Reception</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setPrintingReceipt(null)}
                style={{ background: '#e2e8f0', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
              >
                🖨️ Print Voucher
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetMobile = printingReceipt.mobile || prompt('Enter Guest WhatsApp Mobile Number (10 digits):', '9822100042') || '';
                  if (!targetMobile) return;
                  PmsStore.sendWhatsAppNotification({
                    voucherType: 'Advance_receipt_store',
                    recipientMobile: targetMobile,
                    recipientName: printingReceipt.guestName,
                    voucherNo: printingReceipt.receiptNo,
                    roomNo: printingReceipt.roomNo || '',
                    templateParams: {
                      total_billamount: printingReceipt.amount.toString()
                    },
                    openDirectly: true
                  });
                }}
                style={{ background: '#25d366', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                title="Send advance payment receipt to guest WhatsApp via direct wa.me (Free)"
              >
                <span>💬</span> WhatsApp Receipt (wa.me)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
