import React, { useState } from 'react';
import type { PmsKotRecord, KotItem, PmsRoom } from '../../types/pmsModels';
import { PmsStore, INITIAL_MENU_ITEMS } from '../../services/pmsStore';
import { useInFlightLock } from '../../hooks/useInFlightLock';

interface AddKotModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRoom?: PmsRoom | null;
  onKotSaved: (kot: PmsKotRecord) => void;
}

export const AddKotModal: React.FC<AddKotModalProps> = ({
  isOpen,
  onClose,
  targetRoom,
  onKotSaved
}) => {
  const rooms = PmsStore.getRooms();
  const defaultKotNo = `KOT/${Math.floor(100 + Math.random() * 900)}/24-25`;

  const [kotNo] = useState(defaultKotNo);
  const [serviceType, setServiceType] = useState<PmsKotRecord['serviceType']>('Room');
  const [selectedRoomNo, setSelectedRoomNo] = useState<string>(
    targetRoom?.roomNo || '103'
  );
  const [kotRemark, setKotRemark] = useState('');

  // Item Addition Form
  const [selectedItemName, setSelectedItemName] = useState(INITIAL_MENU_ITEMS[0].name);
  const [itemCode, setItemCode] = useState(INITIAL_MENU_ITEMS[0].code);
  const [rate, setRate] = useState(INITIAL_MENU_ITEMS[0].rate);
  const [qty, setQty] = useState(1);

  // KOT Items Table
  const [itemsList, setItemsList] = useState<KotItem[]>([
    {
      sNo: 1,
      itemName: 'PANEER TIKA',
      itemCode: '10005',
      qty: 1,
      rate: 220,
      amount: 220
    }
  ]);

  if (!isOpen) return null;

  const currentRoomObj = rooms.find(r => r.roomNo === selectedRoomNo);
  const guestName = currentRoomObj?.currentGuest?.name || 'Walk-in Guest';

  const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = INITIAL_MENU_ITEMS.find(m => m.name === e.target.value);
    if (found) {
      setSelectedItemName(found.name);
      setItemCode(found.code);
      setRate(found.rate);
    }
  };

  const handleAddItem = () => {
    if (qty <= 0) return;
    const newItem: KotItem = {
      sNo: itemsList.length + 1,
      itemName: selectedItemName,
      itemCode,
      qty,
      rate,
      amount: qty * rate
    };
    setItemsList([...itemsList, newItem]);
    setQty(1);
  };

  const handleRemoveItem = (index: number) => {
    const updated = itemsList.filter((_, i) => i !== index).map((item, idx) => ({
      ...item,
      sNo: idx + 1
    }));
    setItemsList(updated);
  };

  const totalKotAmount = itemsList.reduce((sum, it) => sum + it.amount, 0);

  const { isSubmitting, runWithLock } = useInFlightLock(400);

  const handleSave = (printAfter = false) => {
    runWithLock(async () => {
      if (itemsList.length === 0) {
        alert('Please add at least one food item.');
        return;
      }

      const newKot: PmsKotRecord = {
        kotNo,
        serviceType,
        roomNo: selectedRoomNo,
        guestName,
        kotRemark,
        items: itemsList,
        totalAmount: totalKotAmount,
        createdAt: new Date().toISOString(),
        status: 'Served'
      };

      PmsStore.saveKot(newKot);
      onKotSaved(newKot);

      if (printAfter) {
        setTimeout(() => window.print(), 200);
      }
      onClose();
    });
  };

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div className="pms-form-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 880 }}>
        {/* Banner from Frame 0120 */}
        <div style={{
          background: '#dbeafe',
          color: '#1e40af',
          padding: '6px 14px',
          fontSize: 13,
          fontWeight: 600,
          borderBottom: '1px solid #bfdbfe'
        }}>
          Please Add Items for Kitchen Order Ticket
        </div>

        <div className="pms-form-body">
          {/* Header Row with Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e293b' }}>
              ADD KOT
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setItemsList([])}
                style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 3, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                + Add New
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSave(false)}
                style={{ background: isSubmitting ? '#94a3b8' : '#2563eb', color: '#fff', border: 'none', padding: '5px 14px', borderRadius: 3, fontSize: 12, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
              >
                {isSubmitting ? '⏳ Saving...' : 'Save'}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSave(true)}
                style={{ background: isSubmitting ? '#475569' : '#0f172a', color: '#fff', border: 'none', padding: '5px 14px', borderRadius: 3, fontSize: 12, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
              >
                {isSubmitting ? '⏳ Creating KOT...' : 'Save & Print'}
              </button>
            </div>
          </div>

          {/* Form Fields from Frame 0120 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 1fr', gap: 10, marginBottom: 12 }}>
            <div className="form-group-pms">
              <label className="form-label-pms">KOT No</label>
              <input type="text" readOnly value={kotNo} className="form-input-pms" style={{ background: '#f1f5f9', fontWeight: 700 }} />
            </div>

            <div className="form-group-pms">
              <label className="form-label-pms">Service Type</label>
              <select value={serviceType} onChange={e => setServiceType(e.target.value as any)} className="form-select-pms">
                <option value="Room">Room Service</option>
                <option value="Restaurant">Restaurant Table</option>
                <option value="Banquet">Banquet Hall</option>
              </select>
            </div>

            <div className="form-group-pms">
              <label className="form-label-pms">Select Room & Guest</label>
              <select value={selectedRoomNo} onChange={e => setSelectedRoomNo(e.target.value)} className="form-select-pms" style={{ fontWeight: 600 }}>
                {rooms.map(r => (
                  <option key={r.id} value={r.roomNo}>
                    {r.roomNo} {r.currentGuest ? `|| ${r.currentGuest.name}` : '(Vacant)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-pms">
              <label className="form-label-pms">KOT Remark</label>
              <input type="text" placeholder="e.g. Less Spicy, Hot" value={kotRemark} onChange={e => setKotRemark(e.target.value)} className="form-input-pms" />
            </div>
          </div>

          {/* Item Selector & Add Row */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 4,
            padding: 10,
            display: 'grid',
            gridTemplateColumns: '2fr 0.8fr 0.8fr 1fr 40px',
            gap: 10,
            alignItems: 'end',
            marginBottom: 14
          }}>
            <div className="form-group-pms" style={{ margin: 0 }}>
              <label className="form-label-pms">Select Menu Item</label>
              <select value={selectedItemName} onChange={handleItemSelect} className="form-select-pms" style={{ fontWeight: 600 }}>
                {INITIAL_MENU_ITEMS.map(m => (
                  <option key={m.id} value={m.name}>
                    {m.name} || Code: {m.code} (₹{m.rate})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-pms" style={{ margin: 0 }}>
              <label className="form-label-pms">QTY</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={e => setQty(Number(e.target.value))}
                className="form-input-pms"
                style={{ textAlign: 'center', fontWeight: 700 }}
              />
            </div>

            <div className="form-group-pms" style={{ margin: 0 }}>
              <label className="form-label-pms">Rate (₹)</label>
              <input type="text" readOnly value={rate} className="form-input-pms" style={{ background: '#f1f5f9', textAlign: 'center' }} />
            </div>

            <div className="form-group-pms" style={{ margin: 0 }}>
              <label className="form-label-pms">Amount (₹)</label>
              <input
                type="text"
                readOnly
                value={qty * rate}
                className="form-input-pms"
                style={{ background: '#dcfce7', fontWeight: 800, color: '#15803d', textAlign: 'center' }}
              />
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              style={{
                height: 32,
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                fontSize: 18,
                fontWeight: 800,
                cursor: 'pointer'
              }}
              title="Add Item to KOT"
            >
              +
            </button>
          </div>

          {/* KOT Live Table (Frame 0120) */}
          <table className="pms-table-compact">
            <thead>
              <tr>
                <th style={{ width: 45 }}>S.No</th>
                <th>Item Name</th>
                <th style={{ width: 70, textAlign: 'center' }}>Qty</th>
                <th style={{ width: 100, textAlign: 'right' }}>Rate (₹)</th>
                <th style={{ width: 110, textAlign: 'right' }}>Amount (₹)</th>
                <th style={{ width: 50, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {itemsList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: 14 }}>
                    No items added yet. Select an item above and click '+'
                  </td>
                </tr>
              ) : (
                itemsList.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center' }}>{item.sNo}</td>
                    <td style={{ fontWeight: 600 }}>{item.itemName}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.qty}</td>
                    <td style={{ textAlign: 'right' }}>₹{item.rate.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{item.amount.toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 800 }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#0f172a', color: '#ffffff', fontWeight: 800 }}>
                <td colSpan={2} style={{ color: '#fff' }}>Total Items: {itemsList.length}</td>
                <td style={{ textAlign: 'center', color: '#fff' }}>{itemsList.reduce((s, i) => s + i.qty, 0)}</td>
                <td></td>
                <td style={{ textAlign: 'right', color: '#4ade80', fontSize: 13 }}>
                  ₹{totalKotAmount.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          {/* Cancel Close Button */}
          <div className="pms-btn-group">
            <button type="button" onClick={onClose} className="btn-pms-cancel">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
