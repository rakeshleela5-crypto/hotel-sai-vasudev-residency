import React, { useState, useEffect } from 'react';
import type { PmsPurchaseBill, PmsPurchaseItem, MenuItem, PmsGodown } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import './pmsStyles.css';

interface PurchaseEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PurchaseEntryModal: React.FC<PurchaseEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'register'>('create');
  const [godowns, setGodowns] = useState<PmsGodown[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [purchases, setPurchases] = useState<PmsPurchaseBill[]>([]);

  // Form Header State (RoomG Frame 0280)
  const [selectedGodown, setSelectedGodown] = useState('Main Store');
  const [terms, setTerms] = useState<'Credit' | 'Cash' | 'Online'>('Credit');
  const [accountName, setAccountName] = useState('GUPTA JII');
  const [billDate, setBillDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [billNo, setBillNo] = useState('6');

  // Line Item Input State
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [qty, setQty] = useState<number | ''>(1);
  const [rate, setRate] = useState<number | ''>(0);
  const [defaultRateHint, setDefaultRateHint] = useState<number | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number | ''>('');
  const [discountAmt, setDiscountAmt] = useState<number | ''>('');
  const [gstPercent, setGstPercent] = useState<number>(5);

  // Table Items
  const [items, setItems] = useState<PmsPurchaseItem[]>([]);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<PmsPurchaseBill | null>(null);

  const refreshData = () => {
    const allGodowns = PmsStore.getGodowns();
    setGodowns(allGodowns);
    if (allGodowns.length > 0 && !selectedGodown) {
      setSelectedGodown(allGodowns[0].name);
    }
    const allItems = PmsStore.getMenuItems();
    setMenuItems(allItems);
    const allPurchases = PmsStore.getPurchases();
    setPurchases(allPurchases);
    setBillNo(String(allPurchases.length + 6));
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setSuccessBanner(null);
      setSelectedBillForPrint(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Selected item change handler
  const handleSelectItem = (item: MenuItem) => {
    setSelectedItemId(item.id);
    setItemSearchTerm(`${item.name}||${item.barcode || item.code}`);
    setIsDropdownOpen(false);
    const pRate = item.purchaseRate || item.rate || 100;
    setRate(pRate);
    setDefaultRateHint(pRate);
    setGstPercent(item.gstPercent ?? 5);
  };

  // Calculations for current input row
  const currentQty = Number(qty) || 0;
  const currentRate = Number(rate) || 0;
  const basicAmt = currentQty * currentRate;
  
  let disAmtCalculated = 0;
  if (discountPercent !== '') {
    disAmtCalculated = (basicAmt * Number(discountPercent)) / 100;
  } else if (discountAmt !== '') {
    disAmtCalculated = Number(discountAmt);
  }
  const taxableAmt = Math.max(0, basicAmt - disAmtCalculated);
  const gstAmtCalculated = (taxableAmt * (gstPercent || 0)) / 100;
  const netAmtCalculated = taxableAmt + gstAmtCalculated;

  // Add Item to Purchase Table
  const handleAddItem = () => {
    if (!selectedItemId || !itemSearchTerm.trim()) {
      alert('Please select an item to add');
      return;
    }
    if (currentQty <= 0) {
      alert('Quantity must be greater than zero');
      return;
    }

    const matchedItem = menuItems.find(m => m.id === selectedItemId);
    const itmName = matchedItem ? matchedItem.name : itemSearchTerm.split('||')[0].trim();
    const barcode = matchedItem ? (matchedItem.barcode || matchedItem.code) : '';

    const newItem: PmsPurchaseItem = {
      sNo: items.length + 1,
      itemId: selectedItemId,
      itemName: itmName,
      barcode,
      qty: currentQty,
      rate: currentRate,
      amount: basicAmt,
      discountPercent: Number(discountPercent) || 0,
      discountAmt: disAmtCalculated,
      totalDiscount: disAmtCalculated,
      taxable: taxableAmt,
      gstPercent,
      gstAmt: gstAmtCalculated,
      netValue: netAmtCalculated
    };

    setItems([...items, newItem]);
    // Reset line input
    setSelectedItemId('');
    setItemSearchTerm('');
    setQty(1);
    setRate(0);
    setDefaultRateHint(null);
    setDiscountPercent('');
    setDiscountAmt('');
    setGstPercent(5);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index).map((itm, i) => ({
      ...itm,
      sNo: i + 1
    }));
    setItems(updated);
  };

  // Table Totals
  const totalQty = items.reduce((sum, itm) => sum + itm.qty, 0);
  const totalAmount = items.reduce((sum, itm) => sum + itm.amount, 0);
  const totalDiscount = items.reduce((sum, itm) => sum + itm.totalDiscount, 0);
  const totalTaxable = items.reduce((sum, itm) => sum + itm.taxable, 0);
  const totalGstAmt = items.reduce((sum, itm) => sum + itm.gstAmt, 0);
  const totalNetValue = items.reduce((sum, itm) => sum + itm.netValue, 0);

  // Save Purchase Bill
  const handleSavePurchase = () => {
    if (items.length === 0) {
      alert('Please add at least one item to save the purchase bill.');
      return;
    }
    if (!accountName.trim()) {
      alert('Please enter Vendor / Account Name.');
      return;
    }

    const formattedDate = billDate.split('-').reverse().join('-');

    const newBill: PmsPurchaseBill = {
      id: `pur-${Date.now()}`,
      billNo: billNo.trim() || String(purchases.length + 1),
      billDate: formattedDate,
      godown: selectedGodown,
      terms,
      accountName: accountName.trim(),
      items,
      totalQty,
      totalAmount,
      totalDiscount,
      totalTaxable,
      totalGstAmt,
      totalNetValue,
      createdAt: new Date().toISOString()
    };

    PmsStore.savePurchase(newBill);
    setSuccessBanner(`Purchase Bill #${newBill.billNo} saved successfully! ${totalQty} units added to ${selectedGodown}.`);
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
            <span style={{ fontSize: 18 }}>🛒</span>
            <h2 className="pms-brand-title" style={{ fontSize: 15, margin: 0, fontWeight: 700, letterSpacing: 0.5 }}>
              HOTEL SAI VASUDEV RESIDENCY &bull; PURCHASE ENTRY (RoomG /purchases/create)
            </h2>
          </div>
          <div className="pms-header-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, background: '#0284c7', color: '#fff', padding: '3px 8px', borderRadius: 4 }}>
              Active Godown: {selectedGodown}
            </span>
            <button type="button" onClick={onClose} className="pms-close-btn" title="Close">
              ✕
            </button>
          </div>
        </header>

        {/* Tab Toolbar */}
        <div style={{ background: '#f8fafc', padding: '8px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { setActiveTab('create'); setSelectedBillForPrint(null); }}
              style={{
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                cursor: 'pointer',
                background: activeTab === 'create' ? '#2563eb' : '#fff',
                color: activeTab === 'create' ? '#fff' : '#334155'
              }}
            >
              + New Purchase
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setSelectedBillForPrint(null); }}
              style={{
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                cursor: 'pointer',
                background: activeTab === 'register' ? '#2563eb' : '#fff',
                color: activeTab === 'register' ? '#fff' : '#334155'
              }}
            >
              📋 Purchase Register ({purchases.length})
            </button>
          </div>

          {activeTab === 'create' && (
            <div style={{ display: 'flex', gap: 8 }}>
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
                  padding: '6px 16px',
                  borderRadius: 4,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Add New
              </button>
              <button
                type="button"
                onClick={handleSavePurchase}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 20px',
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

        {/* TAB 1: NEW PURCHASE ENTRY FORM */}
        {activeTab === 'create' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 18, background: '#fff' }}>
            {/* Header Fields matching RoomG Frame 0280 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 18, background: '#f8fafc', padding: 14, borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Godown
                </label>
                <select
                  value={selectedGodown}
                  onChange={e => setSelectedGodown(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4, background: '#fff', fontWeight: 600 }}
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
                  Terms
                </label>
                <select
                  value={terms}
                  onChange={e => setTerms(e.target.value as any)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4, background: '#fff' }}
                >
                  <option value="Credit">Credit</option>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Account Name (Vendor)
                </label>
                <input
                  type="text"
                  list="vendor-accounts"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  placeholder="e.g. GUPTA JII, KIRANA STORE"
                  style={{ width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4 }}
                />
                <datalist id="vendor-accounts">
                  <option value="GUPTA JII" />
                  <option value="M/S KIRANA STORE" />
                  <option value="AMUL DAIRY AGENCY" />
                  <option value="SHREE SAI VEGETABLE SUPPLIERS" />
                  <option value="METRO CASH & CARRY" />
                  <option value="BISLERI DISTRIBUTORS" />
                </datalist>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Bill Date
                </label>
                <input
                  type="date"
                  value={billDate}
                  onChange={e => setBillDate(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4 }}
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
                  placeholder="e.g. 6"
                  style={{ width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4, fontWeight: 600 }}
                />
              </div>
            </div>

            {/* Item Input Row matching RoomG Frame 0280 & 0300 */}
            <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1fr 1fr 0.8fr 0.8fr 1fr 1fr 0.8fr 44px', gap: 8, alignItems: 'end' }}>
                {/* Item Autocomplete Search */}
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Select Item
                  </label>
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

                {/* Rate with tooltip suggestion */}
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Rate
                  </label>
                  <input
                    type="number"
                    value={rate}
                    onChange={e => setRate(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '7px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right', fontWeight: 600 }}
                  />
                  {defaultRateHint !== null && (
                    <span style={{ position: 'absolute', top: -14, right: 0, fontSize: 10, background: '#fef08a', color: '#854d0e', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>
                      Rate: {defaultRateHint}
                    </span>
                  )}
                </div>

                {/* Basic Amount */}
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

                {/* Dis% */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Dis%
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={discountPercent}
                    onChange={e => {
                      setDiscountPercent(e.target.value === '' ? '' : Number(e.target.value));
                      setDiscountAmt('');
                    }}
                    style={{ width: '100%', padding: '7px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'center' }}
                  />
                </div>

                {/* Dis Amt */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Dis Amt
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={discountAmt}
                    onChange={e => {
                      setDiscountAmt(e.target.value === '' ? '' : Number(e.target.value));
                      setDiscountPercent('');
                    }}
                    style={{ width: '100%', padding: '7px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right' }}
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
                    <option value={28}>28%</option>
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
                    style={{ width: '100%', padding: '7px 6px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 4, background: '#e2e8f0', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}
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

            {/* Items Table matching RoomG Frame 0280 Dark Theme Header */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden', marginBottom: 18 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: '#fff', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', width: 45 }}>S.No</th>
                    <th style={{ padding: '8px 10px' }}>Item Name</th>
                    <th style={{ padding: '8px 10px', width: 65, textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px 10px', width: 80, textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '8px 10px', width: 95, textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '8px 10px', width: 55, textAlign: 'center' }}>Dis%</th>
                    <th style={{ padding: '8px 10px', width: 75, textAlign: 'right' }}>Dis Amt</th>
                    <th style={{ padding: '8px 10px', width: 85, textAlign: 'right' }}>Total Disc</th>
                    <th style={{ padding: '8px 10px', width: 95, textAlign: 'right' }}>Taxable</th>
                    <th style={{ padding: '8px 10px', width: 55, textAlign: 'center' }}>GST%</th>
                    <th style={{ padding: '8px 10px', width: 85, textAlign: 'right' }}>GST Amt</th>
                    <th style={{ padding: '8px 10px', width: 105, textAlign: 'right' }}>Net Value</th>
                    <th style={{ padding: '8px 10px', width: 45, textAlign: 'center' }}>Act</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={13} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                        No items added to this purchase yet. Select items above and click '+'
                      </td>
                    </tr>
                  ) : (
                    items.map((itm, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{itm.sNo}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>
                          {itm.itemName}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>{itm.qty}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>{itm.rate.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>{itm.amount.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{itm.discountPercent || 0}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>{itm.discountAmt.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>{itm.totalDiscount.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{itm.taxable.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>{itm.gstPercent}%</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>{itm.gstAmt.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{itm.netValue.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 3, width: 22, height: 22, fontSize: 11, cursor: 'pointer', fontWeight: 700 }}
                            title="Delete Item"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* Total Summary Row matching RoomG Frame 0280 & 0300 */}
                <tfoot>
                  <tr style={{ background: '#1e293b', color: '#fff', fontWeight: 700 }}>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>Total</td>
                    <td style={{ padding: '8px 10px' }}>
                      <input
                        type="text"
                        readOnly
                        value={items.length}
                        style={{ width: '100%', background: '#fff', color: '#000', padding: '3px 6px', border: 'none', borderRadius: 2, fontSize: 11, fontWeight: 700 }}
                      />
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <input
                        type="text"
                        readOnly
                        value={totalQty}
                        style={{ width: '100%', background: '#fff', color: '#000', padding: '3px 6px', border: 'none', borderRadius: 2, fontSize: 11, fontWeight: 700, textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ padding: '8px 10px' }}></td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <input
                        type="text"
                        readOnly
                        value={totalAmount.toFixed(2)}
                        style={{ width: '100%', background: '#fff', color: '#000', padding: '3px 6px', border: 'none', borderRadius: 2, fontSize: 11, fontWeight: 700, textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ padding: '8px 10px' }}></td>
                    <td style={{ padding: '8px 10px' }}></td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <input
                        type="text"
                        readOnly
                        value={totalDiscount.toFixed(2)}
                        style={{ width: '100%', background: '#fff', color: '#000', padding: '3px 6px', border: 'none', borderRadius: 2, fontSize: 11, fontWeight: 700, textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <input
                        type="text"
                        readOnly
                        value={totalTaxable.toFixed(2)}
                        style={{ width: '100%', background: '#fff', color: '#000', padding: '3px 6px', border: 'none', borderRadius: 2, fontSize: 11, fontWeight: 700, textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ padding: '8px 10px' }}></td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <input
                        type="text"
                        readOnly
                        value={totalGstAmt.toFixed(2)}
                        style={{ width: '100%', background: '#fff', color: '#000', padding: '3px 6px', border: 'none', borderRadius: 2, fontSize: 11, fontWeight: 700, textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <input
                        type="text"
                        readOnly
                        value={totalNetValue.toFixed(2)}
                        style={{ width: '100%', background: '#fff', color: '#000', padding: '3px 6px', border: 'none', borderRadius: 2, fontSize: 11, fontWeight: 700, textAlign: 'right' }}
                      />
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PURCHASE REGISTER */}
        {activeTab === 'register' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 18, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: '#1e293b' }}>Historical Purchase Invoices</h3>
              <span style={{ fontSize: 12, color: '#64748b' }}>Total Bills: {purchases.length}</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: '1px solid #cbd5e1' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: '#fff', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', width: 60 }}>Bill #</th>
                  <th style={{ padding: '8px 10px', width: 110 }}>Date</th>
                  <th style={{ padding: '8px 10px', width: 140 }}>Godown</th>
                  <th style={{ padding: '8px 10px', width: 90 }}>Terms</th>
                  <th style={{ padding: '8px 10px' }}>Vendor Account</th>
                  <th style={{ padding: '8px 10px', width: 80, textAlign: 'center' }}>Total Qty</th>
                  <th style={{ padding: '8px 10px', width: 110, textAlign: 'right' }}>Taxable</th>
                  <th style={{ padding: '8px 10px', width: 90, textAlign: 'right' }}>GST Amt</th>
                  <th style={{ padding: '8px 10px', width: 120, textAlign: 'right' }}>Net Value (₹)</th>
                  <th style={{ padding: '8px 10px', width: 100, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p, idx) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700 }}>#{p.billNo}</td>
                    <td style={{ padding: '8px 10px' }}>{p.billDate}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {p.godown}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        background: p.terms === 'Credit' ? '#fee2e2' : '#dcfce7',
                        color: p.terms === 'Credit' ? '#b91c1c' : '#15803d',
                        padding: '2px 6px',
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        {p.terms}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{p.accountName}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>{p.totalQty}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{p.totalTaxable.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{p.totalGstAmt.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      ₹{p.totalNetValue.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedBillForPrint(p)}
                        style={{ padding: '3px 8px', fontSize: 11, background: '#0284c7', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', fontWeight: 600 }}
                      >
                        👁️ View / Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Bill View Modal / Print preview */}
            {selectedBillForPrint && (
              <div style={{ marginTop: 24, padding: 18, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: 10, marginBottom: 14 }}>
                  <h4 style={{ margin: 0, fontSize: 15 }}>
                    Purchase Voucher Details: Bill #{selectedBillForPrint.billNo} &bull; Vendor: {selectedBillForPrint.accountName}
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
                      onClick={() => setSelectedBillForPrint(null)}
                      style={{ padding: '4px 10px', fontSize: 12, background: '#64748b', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      ✕ Close Preview
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 12, marginBottom: 14 }}>
                  <div><strong>Bill Date:</strong> {selectedBillForPrint.billDate}</div>
                  <div><strong>Godown:</strong> {selectedBillForPrint.godown}</div>
                  <div><strong>Terms:</strong> {selectedBillForPrint.terms}</div>
                  <div><strong>Total Net Value:</strong> ₹{selectedBillForPrint.totalNetValue.toFixed(2)}</div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, border: '1px solid #e2e8f0', background: '#fff' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>S.No</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>Item Name</th>
                      <th style={{ padding: '6px 10px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>Taxable</th>
                      <th style={{ padding: '6px 10px', textAlign: 'center' }}>GST%</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>GST Amt</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>Net Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBillForPrint.items.map(itm => (
                      <tr key={itm.sNo} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 10px' }}>{itm.sNo}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{itm.itemName}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>{itm.qty}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right' }}>₹{itm.rate.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right' }}>₹{itm.taxable.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>{itm.gstPercent}%</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right' }}>₹{itm.gstAmt.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>₹{itm.netValue.toFixed(2)}</td>
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
