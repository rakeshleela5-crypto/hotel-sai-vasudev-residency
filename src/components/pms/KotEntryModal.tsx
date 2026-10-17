import React, { useState } from 'react';
import { PmsStore, INITIAL_MENU_ITEMS } from '../../services/pmsStore';
import type { KotItem, PmsKotRecord, PmsRoom } from '../../types/pmsModels';

interface KotEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRoomNo?: string;
  defaultTableNo?: string;
  defaultServiceType?: 'Room' | 'Restaurant' | 'Banquet';
  onKotSaved?: (kot: PmsKotRecord) => void;
}

export const KotEntryModal: React.FC<KotEntryModalProps> = ({
  isOpen,
  onClose,
  defaultRoomNo,
  defaultTableNo,
  defaultServiceType,
  onKotSaved
}) => {
  if (!isOpen) return null;

  const occupiedRooms = PmsStore.getRooms().filter(r => r.status === 'occupied');
  const tables = PmsStore.getTables();
  const menuItems = PmsStore.getMenuItems();

  const initialRoom = occupiedRooms.find(r => r.roomNo === defaultRoomNo) || occupiedRooms[0] || {
    roomNo: '103',
    currentGuest: { name: 'ALOK JAIN' }
  } as PmsRoom;

  const [selectedRoomNo, setSelectedRoomNo] = useState<string>(initialRoom.roomNo);
  const [selectedTableNo, setSelectedTableNo] = useState<string>(defaultTableNo || tables[0]?.tableName || 'Table T-1');
  const selectedGuestName = occupiedRooms.find(r => r.roomNo === selectedRoomNo)?.currentGuest?.name || 'ALOK JAIN';

  const defaultKotNo = defaultTableNo?.toUpperCase().includes('NC') ? 'R/371' : `KOT/${Math.floor(350 + Math.random() * 50)}/24-25`;
  const [kotNo, setKotNo] = useState<string>(defaultKotNo);
  const [serviceType, setServiceType] = useState<'Room' | 'Restaurant' | 'Banquet'>(
    defaultServiceType || (defaultTableNo ? 'Restaurant' : 'Room')
  );
  const [kotRemark, setKotRemark] = useState<string>(
    defaultTableNo?.toUpperCase().includes('NC') ? 'RAHUL' : 'Quick Room Delivery'
  );

  // Item row input
  const [selectedItemId, setSelectedItemId] = useState<string>(menuItems[0]?.id || '');
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemRate, setItemRate] = useState<number>(menuItems[0]?.rate || 140);
  const [itemAmount, setItemAmount] = useState<number>(itemQty * itemRate);

  // Items in this KOT
  const [kotItems, setKotItems] = useState<KotItem[]>([
    {
      sNo: 1,
      itemName: 'WATER BOTLE',
      itemCode: '10003',
      qty: 1,
      rate: 28.57,
      amount: 28.57
    }
  ]);

  const [showSlipPreview, setShowSlipPreview] = useState<boolean>(false);
  const [savedKotRecord, setSavedKotRecord] = useState<PmsKotRecord | null>(null);

  const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedItemId(id);
    const found = menuItems.find(m => m.id === id);
    if (found) {
      const r = found.saleRate || found.rate;
      setItemRate(r);
      setItemAmount(itemQty * r);
    }
  };

  const handleQtyChange = (val: number) => {
    const q = Math.max(1, val);
    setItemQty(q);
    setItemAmount(Number((q * itemRate).toFixed(2)));
  };

  const handleRateChange = (val: number) => {
    const r = Math.max(0, val);
    setItemRate(r);
    setItemAmount(Number((itemQty * r).toFixed(2)));
  };

  const handleAddItem = () => {
    const found = INITIAL_MENU_ITEMS.find(m => m.id === selectedItemId);
    const itemName = found?.name || 'Item';
    const itemCode = found?.code || '10001';

    const newItem: KotItem = {
      sNo: kotItems.length + 1,
      itemName,
      itemCode,
      qty: itemQty,
      rate: itemRate,
      amount: itemAmount
    };

    setKotItems([...kotItems, newItem]);
    setItemQty(1);
    setItemAmount(itemRate);
  };

  const handleDeleteItem = (index: number) => {
    const filtered = kotItems.filter((_, i) => i !== index).map((item, idx) => ({
      ...item,
      sNo: idx + 1
    }));
    setKotItems(filtered);
  };

  const totalQty = kotItems.reduce((acc, it) => acc + it.qty, 0);
  const totalAmount = Number(kotItems.reduce((acc, it) => acc + it.amount, 0).toFixed(2));

  const handleSaveKot = (printSlip: boolean = false) => {
    if (kotItems.length === 0) {
      alert('Please add at least one item to the KOT.');
      return;
    }

    const targetRoomOrTable = serviceType === 'Restaurant' ? selectedTableNo : selectedRoomNo;
    const isNcTable = selectedTableNo.toUpperCase().includes('NC');
    const targetGuest = isNcTable
      ? (kotRemark || 'Complimentary Guest')
      : serviceType === 'Restaurant'
      ? `Dine-In (${selectedTableNo})`
      : selectedGuestName;

    const kotRecord: PmsKotRecord = {
      kotNo,
      serviceType,
      roomNo: targetRoomOrTable,
      tableNo: serviceType === 'Restaurant' ? selectedTableNo : undefined,
      guestName: targetGuest,
      kotRemark,
      ncRemark: isNcTable ? (kotRemark || 'Complimentary Guest') : undefined,
      isNc: isNcTable,
      operatorName: 'DEMO0004',
      items: kotItems,
      totalAmount,
      totalQty,
      date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      createdAt: new Date().toISOString(),
      status: 'Pending',
      serveStatus: 'Pending'
    };

    PmsStore.saveKot(kotRecord);
    setSavedKotRecord(kotRecord);

    if (onKotSaved) {
      onKotSaved(kotRecord);
    }

    if (printSlip) {
      setShowSlipPreview(true);
    } else {
      alert(`KOT ${kotNo} successfully sent to Kitchen for Room ${selectedRoomNo}!`);
      onClose();
    }
  };

  const handleAddNew = () => {
    setKotNo(`KOT/${Math.floor(350 + Math.random() * 50)}/24-25`);
    setKotItems([]);
    setShowSlipPreview(false);
  };

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div 
        className="pms-form-box" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: showSlipPreview ? 460 : 860 }}
      >
        {!showSlipPreview ? (
          <>
            {/* Top Bar matching Frame 0150 */}
            <div className="pms-form-banner banner-navy" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Kitchen Order Ticket (KOT) Entry &bull; demo.datahouseerp.com/kots/create</span>
              <button 
                type="button" 
                onClick={onClose} 
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div className="pms-form-body">
              {/* Info alerts from Video 05 Frame 0150 */}
              <div style={{ background: '#dbeafe', color: '#1e40af', padding: '6px 12px', borderRadius: 4, fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
                &bull; Please Add Items to generate Kitchen Order Ticket
              </div>

              {/* Top Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={handleAddNew}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '5px 14px', borderRadius: 3, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Add New
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveKot(false)}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '5px 16px', borderRadius: 3, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveKot(true)}
                  style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '5px 16px', borderRadius: 3, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Save &amp; Print
                </button>
              </div>

              {/* Form Controls Row 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.8fr 1.5fr', gap: 10, marginBottom: 12 }}>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">KOT No</label>
                  <input
                    type="text"
                    readOnly
                    value={kotNo}
                    className="form-input-pms"
                    style={{ background: '#f1f5f9', fontWeight: 800 }}
                  />
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Service Type</label>
                  <select
                    value={serviceType}
                    onChange={e => setServiceType(e.target.value as any)}
                    className="form-select-pms"
                  >
                    <option value="Room">Room</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Banquet">Banquet</option>
                  </select>
                </div>

                {serviceType === 'Restaurant' ? (
                  <div className="form-group-pms" style={{ margin: 0 }}>
                    <label className="form-label-pms">Select Table (Table || Group)</label>
                    <select
                      value={selectedTableNo}
                      onChange={e => setSelectedTableNo(e.target.value)}
                      className="form-select-pms"
                      style={{ fontWeight: 700 }}
                    >
                      {tables.map(t => (
                        <option key={t.id} value={t.tableName}>
                          {t.tableName} || {t.tableGroup}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group-pms" style={{ margin: 0 }}>
                    <label className="form-label-pms">Select Room (Room || Guest)</label>
                    <select
                      value={selectedRoomNo}
                      onChange={e => setSelectedRoomNo(e.target.value)}
                      className="form-select-pms"
                      style={{ fontWeight: 700 }}
                    >
                      {occupiedRooms.map(r => (
                        <option key={r.roomNo} value={r.roomNo}>
                          {r.roomNo} || {r.currentGuest?.name || 'Guest'}
                        </option>
                      ))}
                      {occupiedRooms.length === 0 && (
                        <option value="103">103 || ALOK JAIN</option>
                      )}
                    </select>
                  </div>
                )}

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">KOT Remark</label>
                  <input
                    type="text"
                    value={kotRemark}
                    onChange={e => setKotRemark(e.target.value)}
                    placeholder="Instructions for Chef"
                    className="form-input-pms"
                  />
                </div>
              </div>

              {/* Add Item Row (Frame 0150) */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: 10,
                borderRadius: 4,
                marginBottom: 12,
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                gap: 8,
                alignItems: 'flex-end'
              }}>
                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Select Item (Name || Code)</label>
                  <select
                    value={selectedItemId}
                    onChange={handleItemSelect}
                    className="form-select-pms"
                  >
                    {menuItems.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} || {m.code} (₹{m.saleRate || m.rate})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">QTY</label>
                  <input
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={e => handleQtyChange(Number(e.target.value))}
                    className="form-input-pms"
                    style={{ textAlign: 'center', fontWeight: 800 }}
                  />
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemRate}
                    onChange={e => handleRateChange(Number(e.target.value))}
                    className="form-input-pms"
                    style={{ textAlign: 'right', fontWeight: 700 }}
                  />
                </div>

                <div className="form-group-pms" style={{ margin: 0 }}>
                  <label className="form-label-pms">Amount (₹)</label>
                  <input
                    type="text"
                    readOnly
                    value={`₹${itemAmount.toFixed(2)}`}
                    className="form-input-pms"
                    style={{ textAlign: 'right', fontWeight: 800, background: '#f1f5f9' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  style={{
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 3,
                    padding: '8px 14px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    fontSize: 16
                  }}
                  title="Add Item to KOT"
                >
                  +
                </button>
              </div>

              {/* Items Table matching Frame 0150 */}
              <div style={{ overflowX: 'auto', border: '1px solid #0f172a', borderRadius: 3 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#fff', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px', width: 40 }}>#</th>
                      <th style={{ padding: '6px 8px' }}>Item Name</th>
                      <th style={{ padding: '6px 8px', width: 80, textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '6px 8px', width: 100, textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: '6px 8px', width: 110, textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '6px 8px', width: 60, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kotItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td style={{ padding: '6px 8px' }}>{item.sNo}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                          {item.itemName} {item.itemCode && <span style={{ color: '#64748b', fontSize: 11 }}>({item.itemCode})</span>}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800 }}>{item.qty}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>₹{item.rate.toFixed(2)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>₹{item.amount.toFixed(2)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(idx)}
                            style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: 2, fontSize: 10, cursor: 'pointer' }}
                          >
                            Del
                          </button>
                        </td>
                      </tr>
                    ))}
                    {kotItems.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 18, color: '#94a3b8' }}>
                          No items added yet. Select an item above and click '+'
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#1e293b', color: '#fff', fontWeight: 800 }}>
                      <td colSpan={2} style={{ padding: '6px 8px' }}>Total ({kotItems.length} items)</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{totalQty}</td>
                      <td></td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>₹{totalAmount.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bottom Notice */}
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  * Rule: All KOTs must be converted into Food Bills before Room Checkout.
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ background: '#64748b', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 3, fontWeight: 700, cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Thermal Kitchen Order Ticket Print Slip */
          <div style={{ padding: 16 }}>
            <div style={{
              background: '#fff',
              border: '1px dashed #334155',
              padding: 16,
              fontFamily: 'monospace',
              fontSize: 12,
              color: '#000'
            }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #334155', paddingBottom: 8, marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>HOTEL SAI VASUDEV RESIDENCY</h3>
                <p style={{ margin: '2px 0', fontSize: 11 }}>Pimpalwadi Road, Shirdi - 423109</p>
                <div style={{
                  display: 'inline-block',
                  border: '1px solid #000',
                  padding: '2px 8px',
                  fontWeight: 900,
                  fontSize: 12,
                  marginTop: 4
                }}>
                  KITCHEN ORDER TICKET (KOT)
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 11, marginBottom: 8 }}>
                <div><strong>KOT No:</strong> {savedKotRecord?.kotNo || kotNo}</div>
                <div style={{ textAlign: 'right' }}><strong>Service:</strong> {serviceType}</div>
                <div><strong>Room No:</strong> {selectedRoomNo}</div>
                <div style={{ textAlign: 'right' }}><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
                <div><strong>Guest:</strong> {selectedGuestName}</div>
                <div style={{ textAlign: 'right' }}><strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</div>
              </div>

              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', marginBottom: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 40px', fontWeight: 900 }}>
                  <span>#</span>
                  <span>Item Name</span>
                  <span style={{ textAlign: 'center' }}>Qty</span>
                </div>
                {kotItems.map((it, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 40px', padding: '2px 0' }}>
                    <span>{idx + 1}</span>
                    <span>{it.itemName}</span>
                    <span style={{ textAlign: 'center', fontWeight: 900 }}>{it.qty}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, marginBottom: 8 }}>
                <strong>Special Note:</strong> {kotRemark || 'None'}
              </div>

              <div style={{ borderTop: '1px dashed #000', paddingTop: 8, textAlign: 'center', fontSize: 10 }}>
                *** KITCHEN PRODUCTION COPY ***
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <button
                type="button"
                onClick={() => setShowSlipPreview(false)}
                style={{ background: '#475569', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 3, cursor: 'pointer', fontWeight: 700 }}
              >
                Back to Entry
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 18px', borderRadius: 3, cursor: 'pointer', fontWeight: 800 }}
                >
                  Print KOT
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
