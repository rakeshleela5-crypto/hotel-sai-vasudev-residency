import React, { useState, useEffect } from 'react';
import type { PmsStockTransfer, PmsStockTransferItem, MenuItem, PmsGodown } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';
import './pmsStyles.css';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'transfer' | 'issue';
  onSuccess?: () => void;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'transfer',
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'register'>('create');
  const [godowns, setGodowns] = useState<PmsGodown[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [transfers, setTransfers] = useState<PmsStockTransfer[]>([]);

  // Header State (Frame 0335)
  const [transferDate, setTransferDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [entryNo, setEntryNo] = useState('ST/1/24-25');
  const [fromGodown, setFromGodown] = useState('Main Store');
  const [toGodown, setToGodown] = useState('Kitchen');
  const [billDate, setBillDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [billNo, setBillNo] = useState('1');
  const [remark, setRemark] = useState('');

  // Line Item Input
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [qty, setQty] = useState<number | ''>(1);
  const [rate, setRate] = useState<number | ''>(0);
  const [gstPercent, setGstPercent] = useState<number>(5);
  const [transferStatus, setTransferStatus] = useState<'ISSUED' | 'PENDING'>('ISSUED');
  const [allowNegativeOverride, setAllowNegativeOverride] = useState(false);
  const [managerPin, setManagerPin] = useState('');

  // Items list
  const [items, setItems] = useState<PmsStockTransferItem[]>([]);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [selectedTransferForPrint, setSelectedTransferForPrint] = useState<PmsStockTransfer | null>(null);

  const refreshData = () => {
    const allGodowns = PmsStore.getGodowns();
    setGodowns(allGodowns);
    const allItems = PmsStore.getMenuItems();
    setMenuItems(allItems);
    const allTransfers = PmsStore.getStockTransfers();
    setTransfers(allTransfers);

    const yearSuffix = `${new Date().getFullYear() % 100}-${(new Date().getFullYear() % 100) + 1}`;
    setEntryNo(`ST/${allTransfers.length + 1}/${yearSuffix}`);
    setBillNo(String(allTransfers.length + 1));
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setSuccessBanner(null);
      setSelectedTransferForPrint(null);
      if (initialMode === 'issue') {
        setFromGodown('Kitchen');
        setToGodown('Consume');
        setRemark('Daily kitchen cooking consumption entry');
      } else {
        setFromGodown('Main Store');
        setToGodown('Kitchen');
        setRemark('Issue to kitchen from main store');
      }

      const unsub = PmsStore.subscribe(() => {
        refreshData();
      });

      hotelApi.getStockTransfers().then(cloudTransfers => {
        if (Array.isArray(cloudTransfers) && cloudTransfers.length > 0) {
          PmsStore.syncStockTransfers(cloudTransfers);
          setTransfers(cloudTransfers);
        }
      }).catch(err => console.warn('[StockTransferModal] Cloud sync note:', err));

      return () => unsub();
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Preset Workflow Handlers matching Video 19
  const applyPreset = (preset: 'store-to-kitchen' | 'kitchen-to-consume') => {
    if (preset === 'store-to-kitchen') {
      setFromGodown('Main Store');
      setToGodown('Kitchen');
      setRemark('Transfer from Main Store to Kitchen');
    } else {
      setFromGodown('Kitchen');
      setToGodown('Consume');
      setRemark('Daily Kitchen Cooking Consumption');
    }
  };

  // Line item selection
  const handleSelectItem = (item: MenuItem) => {
    setSelectedItemId(item.id);
    setItemSearchTerm(`${item.name}||${item.barcode || item.code}`);
    setIsDropdownOpen(false);
    const pRate = item.purchaseRate || item.rate || 100;
    setRate(pRate);
    setGstPercent(item.gstPercent ?? 5);
  };

  const currentQty = Number(qty) || 0;
  const currentRate = Number(rate) || 0;
  const basicAmt = currentQty * currentRate;
  const gstAmtCalculated = (basicAmt * (gstPercent || 0)) / 100;
  const netAmtCalculated = basicAmt + gstAmtCalculated;

  const handleAddItem = () => {
    if (!selectedItemId || !itemSearchTerm.trim()) {
      alert('Please select an item to transfer');
      return;
    }
    if (currentQty <= 0) {
      alert('Quantity must be greater than zero');
      return;
    }
    if (fromGodown === toGodown) {
      alert('Source Godown and Destination Godown cannot be the same!');
      return;
    }

    const matchedItem = menuItems.find(m => m.id === selectedItemId);
    const itmName = matchedItem ? matchedItem.name : itemSearchTerm.split('||')[0].trim();
    const barcode = matchedItem ? (matchedItem.barcode || matchedItem.code) : '';
    const availableStock = PmsStore.getAvailableStockAtGodown(fromGodown, itmName);

    if (transferStatus === 'ISSUED' && currentQty > availableStock && !allowNegativeOverride) {
      const confirmOverride = window.confirm(
        `Insufficient stock in [${fromGodown}]!\n` +
        `Item: ${itmName}\n` +
        `Available Balance: ${availableStock.toFixed(2)}\n` +
        `Requested Transfer: ${currentQty}\n\n` +
        `Do you have Manager Authorization to permit negative inventory override?`
      );
      if (!confirmOverride) return;
      const pin = window.prompt('Enter Manager Authorization PIN:') || '';
      if (!['9999', '1234', '8888'].includes(pin.trim())) {
        alert('Invalid Manager PIN. Transfer aborted to prevent inventory distortion.');
        return;
      }
      setAllowNegativeOverride(true);
      setManagerPin(pin.trim());
    }

    const newItem: PmsStockTransferItem = {
      sNo: items.length + 1,
      itemId: selectedItemId,
      itemName: itmName,
      barcode,
      qty: currentQty,
      rate: currentRate,
      amount: basicAmt,
      discountAmt: 0,
      totalDiscount: 0,
      gstPercent,
      gstAmt: gstAmtCalculated,
      netValue: netAmtCalculated
    };

    setItems([...items, newItem]);
    setSelectedItemId('');
    setItemSearchTerm('');
    setQty(1);
    setRate(0);
    setGstPercent(5);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index).map((itm, i) => ({
      ...itm,
      sNo: i + 1
    }));
    setItems(updated);
  };

  const totalQty = items.reduce((sum, itm) => sum + itm.qty, 0);
  const totalAmount = items.reduce((sum, itm) => sum + itm.amount, 0);
  const totalGstAmt = items.reduce((sum, itm) => sum + (itm.gstAmt || 0), 0);
  const totalNetValue = items.reduce((sum, itm) => sum + (itm.netValue || 0), 0);

  const handleSaveTransfer = () => {
    if (items.length === 0) {
      alert('Please add at least one item to transfer.');
      return;
    }
    if (fromGodown === toGodown) {
      alert('From Godown and To Godown cannot be identical.');
      return;
    }

    const formattedDate = transferDate.split('-').reverse().join('-');

    const newTransfer: PmsStockTransfer = {
      id: `st-${Date.now()}`,
      entryNo: entryNo.trim(),
      date: formattedDate,
      fromGodown,
      toGodown,
      billDate: billDate.split('-').reverse().join('-'),
      billNo: billNo.trim(),
      items,
      totalQty,
      totalAmount,
      totalDiscount: 0,
      totalTaxable: totalAmount,
      totalGstAmt,
      totalNetValue,
      status: transferStatus,
      allowNegativeOverride,
      managerPin: managerPin || undefined,
      remark: remark.trim(),
      createdAt: new Date().toISOString()
    };

    PmsStore.saveStockTransfer(newTransfer);
    setSuccessBanner(
      `Stock Transfer Voucher ${newTransfer.entryNo} saved successfully! ${totalQty} items transferred from [${fromGodown}] to [${toGodown}].`
    );
    setItems([]);
    refreshData();
    if (onSuccess) onSuccess();
  };

  const filteredMenuItems = menuItems.filter(m =>
    m.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
    (m.barcode && m.barcode.includes(itemSearchTerm)) ||
    m.code.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );

  return (
    <div className="pms-overlay" onClick={onClose}>
      <div
        className="pms-window"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 1250, width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header matching RoomG styling */}
        <header className="pms-header" style={{ background: '#1e293b', color: '#fff', padding: '10px 18px' }}>
          <div className="pms-header-left" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🔄</span>
            <h2 className="pms-brand-title" style={{ fontSize: 15, margin: 0, fontWeight: 700, letterSpacing: 0.5 }}>
              SRI SAI VASUDEV RESIDENCY &bull; STOCK TRANSFER &amp; ISSUE (/stocktransfers/create)
            </h2>
          </div>
          <div className="pms-header-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, background: '#16a34a', color: '#fff', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
              {fromGodown} ➔ {toGodown}
            </span>
            <button type="button" onClick={onClose} className="pms-close-btn" title="Close">
              ✕
            </button>
          </div>
        </header>

        {/* Tab & Workflow Toolbar */}
        <div style={{ background: '#f8fafc', padding: '8px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { setActiveTab('create'); setSelectedTransferForPrint(null); }}
              style={{
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                cursor: 'pointer',
                background: activeTab === 'create' ? '#16a34a' : '#fff',
                color: activeTab === 'create' ? '#fff' : '#334155'
              }}
            >
              + New Stock Transfer
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setSelectedTransferForPrint(null); }}
              style={{
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                cursor: 'pointer',
                background: activeTab === 'register' ? '#16a34a' : '#fff',
                color: activeTab === 'register' ? '#fff' : '#334155'
              }}
            >
              📋 Transfer Register ({transfers.length})
            </button>

            {activeTab === 'create' && (
              <div style={{ display: 'inline-flex', border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden', marginLeft: 8 }}>
                <button
                  type="button"
                  onClick={() => setTransferStatus('ISSUED')}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: transferStatus === 'ISSUED' ? '#2563eb' : '#fff',
                    color: transferStatus === 'ISSUED' ? '#fff' : '#64748b'
                  }}
                  title="Direct inter-department stock movement (immediately decrements source godown)"
                >
                  🚀 Direct Issue
                </button>
                <button
                  type="button"
                  onClick={() => setTransferStatus('PENDING')}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: transferStatus === 'PENDING' ? '#f59e0b' : '#fff',
                    color: transferStatus === 'PENDING' ? '#fff' : '#64748b'
                  }}
                  title="Raise a departmental store requisition pending Storekeeper approval"
                >
                  📝 Store Requisition
                </button>
              </div>
            )}
          </div>

          {activeTab === 'create' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Quick Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset('store-to-kitchen')}
                style={{
                  background: fromGodown === 'Main Store' && toGodown === 'Kitchen' ? '#0284c7' : '#e0f2fe',
                  color: fromGodown === 'Main Store' && toGodown === 'Kitchen' ? '#fff' : '#0369a1',
                  border: '1px solid #bae6fd',
                  padding: '5px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                📦 Store ➔ Kitchen
              </button>
              <button
                type="button"
                onClick={() => applyPreset('kitchen-to-consume')}
                style={{
                  background: fromGodown === 'Kitchen' && toGodown === 'Consume' ? '#d97706' : '#fef3c7',
                  color: fromGodown === 'Kitchen' && toGodown === 'Consume' ? '#fff' : '#b45309',
                  border: '1px solid #fde68a',
                  padding: '5px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🍳 Kitchen ➔ Consume (Daily Usage)
              </button>

              <button
                type="button"
                onClick={() => {
                  setItems([]);
                  setSuccessBanner(null);
                  refreshData();
                }}
                style={{
                  background: '#16a34a',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 4,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  marginLeft: 8
                }}
              >
                Add New
              </button>
              <button
                type="button"
                onClick={handleSaveTransfer}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 18px',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(37,99,235,0.3)'
                }}
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* Flash Message */}
        {successBanner && (
          <div style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '10px 18px', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>✓ {successBanner}</span>
            <button
              type="button"
              onClick={() => setSuccessBanner(null)}
              style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: NEW TRANSFER FORM */}
        {activeTab === 'create' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 18, background: '#fff' }}>
            {/* Header Fields matching RoomG Frame 0335 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 18, background: '#f8fafc', padding: 14, borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Date
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={e => setTransferDate(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Entry No
                </label>
                <input
                  type="text"
                  value={entryNo}
                  onChange={e => setEntryNo(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4, fontWeight: 600, background: '#f1f5f9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  From Godown (Source)
                </label>
                <select
                  value={fromGodown}
                  onChange={e => setFromGodown(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4, background: '#fff', fontWeight: 600 }}
                >
                  {godowns.map(g => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  To Godown (Destination)
                </label>
                <select
                  value={toGodown}
                  onChange={e => setToGodown(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4, background: '#fff', fontWeight: 600 }}
                >
                  {godowns.map(g => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Bill Date
                </label>
                <input
                  type="date"
                  value={billDate}
                  onChange={e => setBillDate(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Bill No
                </label>
                <input
                  type="text"
                  value={billNo}
                  onChange={e => setBillNo(e.target.value)}
                  placeholder="e.g. 1"
                  style={{ width: '100%', padding: '7px 8px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4 }}
                />
              </div>
            </div>

            {/* Line Item Inputs */}
            <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 1fr 1fr 44px', gap: 8, alignItems: 'end' }}>
                {/* Select Item */}
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>
                      Select Item
                    </label>
                    {selectedItemId && (
                      <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
                        📦 Avail in {fromGodown}: {PmsStore.getAvailableStockAtGodown(fromGodown, menuItems.find(m => m.id === selectedItemId)?.name || '')}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Type Item name or barcode..."
                    value={itemSearchTerm}
                    onChange={e => {
                      setItemSearchTerm(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    style={{ width: '100%', padding: '7px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4 }}
                  />
                  {isDropdownOpen && itemSearchTerm && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: 200, overflowY: 'auto' }}>
                      {filteredMenuItems.map(m => (
                        <div
                          key={m.id}
                          onClick={() => handleSelectItem(m)}
                          style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                        >
                          <span><strong>{m.name}</strong> || {m.barcode || m.code}</span>
                          <span style={{ color: '#0284c7', fontSize: 11 }}>₹{m.purchaseRate || m.rate}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* QTY */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    QTY
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={e => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '7px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'center', fontWeight: 600 }}
                  />
                </div>

                {/* Rate */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Rate
                  </label>
                  <input
                    type="number"
                    value={rate}
                    onChange={e => setRate(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '7px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right' }}
                  />
                </div>

                {/* Basic */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Basic
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={basicAmt.toFixed(2)}
                    style={{ width: '100%', padding: '7px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4, background: '#e2e8f0', textAlign: 'right', fontWeight: 600 }}
                  />
                </div>

                {/* GST % */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    GST %
                  </label>
                  <select
                    value={gstPercent}
                    onChange={e => setGstPercent(Number(e.target.value))}
                    style={{ width: '100%', padding: '7px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4, background: '#fff' }}
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                  </select>
                </div>

                {/* GST Amt */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    GST Amt
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={gstAmtCalculated.toFixed(2)}
                    style={{ width: '100%', padding: '7px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4, background: '#e2e8f0', textAlign: 'right' }}
                  />
                </div>

                {/* Net */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Net
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={netAmtCalculated.toFixed(2)}
                    style={{ width: '100%', padding: '7px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4, background: '#e2e8f0', textAlign: 'right', fontWeight: 700 }}
                  />
                </div>

                {/* + Button */}
                <div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    style={{
                      width: 40,
                      height: 33,
                      background: '#16a34a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Add Item"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Transfer Items Grid matching Frame 0335 */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden', marginBottom: 18 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: '#fff', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', width: 45 }}>S.No</th>
                    <th style={{ padding: '8px 10px' }}>Item Name</th>
                    <th style={{ padding: '8px 10px', width: 75, textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px 10px', width: 85, textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '8px 10px', width: 100, textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '8px 10px', width: 60, textAlign: 'center' }}>GST%</th>
                    <th style={{ padding: '8px 10px', width: 85, textAlign: 'right' }}>GST Amt</th>
                    <th style={{ padding: '8px 10px', width: 110, textAlign: 'right' }}>Net Value</th>
                    <th style={{ padding: '8px 10px', width: 45, textAlign: 'center' }}>Act</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                        No items added to this stock transfer voucher yet.
                      </td>
                    </tr>
                  ) : (
                    items.map((itm, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{itm.sNo}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>{itm.itemName}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>{itm.qty}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{itm.rate.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{itm.amount.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{itm.gstPercent}%</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{(itm.gstAmt || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>₹{(itm.netValue || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 3, width: 22, height: 22, fontSize: 11, cursor: 'pointer', fontWeight: 700 }}
                            title="Delete"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#1e293b', color: '#fff', fontWeight: 700 }}>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>Total</td>
                    <td style={{ padding: '8px 10px' }}>{items.length} items</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{totalQty}</td>
                    <td></td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{totalAmount.toFixed(2)}</td>
                    <td></td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{totalGstAmt.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{totalNetValue.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Remark */}
            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Transfer Remark / Purpose
              </label>
              <input
                type="text"
                placeholder="e.g. Issue to kitchen for morning cooking, or daily consumption"
                value={remark}
                onChange={e => setRemark(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4 }}
              />
            </div>
          </div>
        )}

        {/* TAB 2: TRANSFER REGISTER */}
        {activeTab === 'register' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 18, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: '#1e293b' }}>Stock Transfer &amp; Issue Register</h3>
              <span style={{ fontSize: 12, color: '#64748b' }}>Total Transfers: {transfers.length}</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: '1px solid #cbd5e1' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: '#fff', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', width: 110 }}>Entry No</th>
                  <th style={{ padding: '8px 10px', width: 100 }}>Date</th>
                  <th style={{ padding: '8px 10px', width: 130 }}>From Godown</th>
                  <th style={{ padding: '8px 10px', width: 130 }}>To Godown</th>
                  <th style={{ padding: '8px 10px', width: 80, textAlign: 'center' }}>Total Qty</th>
                  <th style={{ padding: '8px 10px', width: 110, textAlign: 'right' }}>Net Value</th>
                  <th style={{ padding: '8px 10px' }}>Remark</th>
                  <th style={{ padding: '8px 10px', width: 90, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((st, idx) => (
                  <tr key={st.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700 }}>{st.entryNo}</td>
                    <td style={{ padding: '8px 10px' }}>{st.date}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {st.fromGodown}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {st.toGodown}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>{st.totalQty}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>
                      ₹{(st.totalNetValue || st.totalAmount).toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#475569', fontSize: 12 }}>{st.remark || '-'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedTransferForPrint(st)}
                        style={{ padding: '3px 8px', fontSize: 11, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', fontWeight: 600 }}
                      >
                        👁️ View Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Slip View */}
            {selectedTransferForPrint && (
              <div style={{ marginTop: 24, padding: 18, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: 10, marginBottom: 14 }}>
                  <h4 style={{ margin: 0, fontSize: 15 }}>
                    Stock Transfer Note: {selectedTransferForPrint.entryNo} &bull; [{selectedTransferForPrint.fromGodown}] ➔ [{selectedTransferForPrint.toGodown}]
                  </h4>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      style={{ padding: '4px 12px', fontSize: 12, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                    >
                      🖨️ Print
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTransferForPrint(null)}
                      style={{ padding: '4px 10px', fontSize: 12, background: '#64748b', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      ✕ Close Preview
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 12, marginBottom: 14 }}>
                  <div><strong>Date:</strong> {selectedTransferForPrint.date}</div>
                  <div><strong>From Godown:</strong> {selectedTransferForPrint.fromGodown}</div>
                  <div><strong>To Godown:</strong> {selectedTransferForPrint.toGodown}</div>
                  <div><strong>Total Qty:</strong> {selectedTransferForPrint.totalQty}</div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, border: '1px solid #e2e8f0', background: '#fff' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>S.No</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>Item Name</th>
                      <th style={{ padding: '6px 10px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>Net Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransferForPrint.items.map(itm => (
                      <tr key={itm.sNo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 10px' }}>{itm.sNo}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{itm.itemName}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>{itm.qty}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right' }}>₹{itm.rate.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>₹{(itm.netValue || itm.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
