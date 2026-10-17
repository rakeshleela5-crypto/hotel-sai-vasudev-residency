import React, { useState, useEffect } from 'react';
import type { MenuItem } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import './pmsStyles.css';

interface ItemMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ItemMasterModal: React.FC<ItemMasterModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form Fields matching Frame 0250
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formItemName, setFormItemName] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCompany, setFormCompany] = useState('In-House');
  const [formGroup, setFormGroup] = useState('Main Course');
  const [formMrp, setFormMrp] = useState<number>(0);
  const [formSaleRate, setFormSaleRate] = useState<number>(0);
  const [formRateA, setFormRateA] = useState<number>(0);
  const [formRateB, setFormRateB] = useState<number>(0);
  const [formRateC, setFormRateC] = useState<number>(0);
  const [formPurchaseRate, setFormPurchaseRate] = useState<number>(0);
  const [formUnit, setFormUnit] = useState('Plate');
  const [formGstPercent, setFormGstPercent] = useState<number>(5);
  const [formImage, setFormImage] = useState<string>('');

  const ITEM_COMPANIES = ['In-House', 'Bisleri', 'Amul', 'Haldirams', 'PepsiCo', 'Mother Dairy', 'Coca Cola', 'Britannia'];
  const ITEM_GROUPS = ['Rice', 'Starters', 'Main Course', 'Dal', 'Breads', 'Beverages', 'Thali', 'Salad', 'Dessert', 'Soups', 'Chinese', 'South Indian', 'Snacks'];
  const UNITS = ['Plate', 'Portion', 'Piece', 'Cup', 'Bottle', 'Bowl', 'Glass', 'Kg', 'Half', 'Full'];

  const refreshData = () => {
    setItems(PmsStore.getMenuItems());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setViewMode('list');
      setSuccessBanner(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenForm = (item?: MenuItem) => {
    if (item) {
      setEditingItemId(item.id);
      setFormItemName(item.name);
      setFormBarcode(item.barcode || item.code);
      setFormCompany(item.company || 'In-House');
      setFormGroup(item.category);
      setFormMrp(item.mrp || item.rate);
      setFormSaleRate(item.saleRate || item.rate);
      setFormRateA(item.rateA || item.rate);
      setFormRateB(item.rateB || item.rate);
      setFormRateC(item.rateC || item.rate);
      setFormPurchaseRate(item.purchaseRate || Math.round(item.rate * 0.5));
      setFormUnit(item.unit || 'Plate');
      setFormGstPercent(item.gstPercent || 5);
      setFormImage(item.image || '');
    } else {
      setEditingItemId(null);
      setFormItemName('');
      setFormBarcode(`890${Math.floor(1000000 + Math.random() * 9000000)}`);
      setFormCompany('In-House');
      setFormGroup('Main Course');
      setFormMrp(150);
      setFormSaleRate(140);
      setFormRateA(140);
      setFormRateB(130);
      setFormRateC(120);
      setFormPurchaseRate(70);
      setFormUnit('Plate');
      setFormGstPercent(5);
      setFormImage('');
    }
    setViewMode('form');
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formItemName.trim()) {
      alert('Please enter Item/Product Name');
      return;
    }

    const newItem: MenuItem = {
      id: editingItemId ? editingItemId : `m-${Date.now()}`,
      name: formItemName.trim(),
      code: formBarcode.trim() || `ITM${Math.floor(100 + Math.random() * 900)}`,
      barcode: formBarcode.trim(),
      company: formCompany,
      category: formGroup,
      mrp: Number(formMrp) || 0,
      rate: Number(formSaleRate) || 0,
      saleRate: Number(formSaleRate) || 0,
      rateA: Number(formRateA) || 0,
      rateB: Number(formRateB) || 0,
      rateC: Number(formRateC) || 0,
      purchaseRate: Number(formPurchaseRate) || 0,
      unit: formUnit,
      gstPercent: Number(formGstPercent) || 5,
      image: formImage
    };

    PmsStore.saveMenuItem(newItem);
    setSuccessBanner(`Item "${newItem.name}" saved successfully!`);
    refreshData();
    setViewMode('list');
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete item "${name}"?`)) {
      PmsStore.deleteMenuItem(id);
      setSuccessBanner(`Item "${name}" deleted.`);
      refreshData();
    }
  };

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.barcode && i.barcode.includes(searchQuery)) ||
    i.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pms-overlay" onClick={onClose}>
      <div className="pms-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 1100, height: '90vh' }}>
        {/* Header */}
        <header className="pms-header" style={{ background: '#212529', color: '#fff' }}>
          <div className="pms-header-left">
            <span style={{ fontSize: 16 }}>🍽️</span>
            <h2 className="pms-brand-title" style={{ fontSize: 15 }}>
              HOTEL SAI VASUDEV RESIDENCY &bull; {viewMode === 'form' ? 'ADD / EDIT ITEM (/itemform)' : 'ITEM MASTER (/items)'}
            </h2>
          </div>
          <div className="pms-header-right">
            <button
              type="button"
              onClick={onClose}
              className="pms-close-btn"
              title="Close"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Toolbar */}
        <div style={{ background: '#f8f9fa', padding: '10px 18px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { setViewMode('list'); setSuccessBanner(null); }}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #ced4da',
                borderRadius: 4,
                cursor: 'pointer',
                background: viewMode === 'list' ? '#0d6efd' : '#fff',
                color: viewMode === 'list' ? '#fff' : '#495057'
              }}
            >
              📋 All Items ({items.length})
            </button>
            <button
              type="button"
              onClick={() => handleOpenForm()}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #ced4da',
                borderRadius: 4,
                cursor: 'pointer',
                background: viewMode === 'form' ? '#0d6efd' : '#fff',
                color: viewMode === 'form' ? '#fff' : '#495057'
              }}
            >
              + Add New Item
            </button>
          </div>
        </div>

        {/* Flash Banner */}
        {successBanner && (
          <div style={{ background: '#d1e7dd', color: '#0f5132', border: '1px solid #badbcc', padding: '10px 18px', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>✓ {successBanner}</span>
            <button
              type="button"
              onClick={() => setSuccessBanner(null)}
              style={{ background: 'none', border: 'none', color: '#0f5132', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* VIEW 1: ITEMS LIST */}
        {viewMode === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderBottom: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#495057' }}>
                <select
                  value={entriesPerPage}
                  onChange={e => setEntriesPerPage(Number(e.target.value))}
                  style={{ padding: '4px 8px', border: '1px solid #ced4da', borderRadius: 3 }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>entries per page</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 13, color: '#495057' }}>Search:</label>
                <input
                  type="text"
                  placeholder="Search item, code, group..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ padding: '4px 8px', border: '1px solid #ced4da', borderRadius: 3, width: 220, fontSize: 13 }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 18, background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left', color: '#495057' }}>
                    <th style={{ padding: '10px 12px', width: 60 }}>S.No</th>
                    <th style={{ padding: '10px 12px' }}>Item Name</th>
                    <th style={{ padding: '10px 12px', width: 120 }}>Item Code</th>
                    <th style={{ padding: '10px 12px', width: 140 }}>Group / Category</th>
                    <th style={{ padding: '10px 12px', width: 100 }}>Unit</th>
                    <th style={{ padding: '10px 12px', width: 100 }}>Sale Rate (₹)</th>
                    <th style={{ padding: '10px 12px', width: 100 }}>GST %</th>
                    <th style={{ padding: '10px 12px', width: 90, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.slice(0, entriesPerPage).map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '8px 12px', color: '#6c757d' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>{item.name}</td>
                      <td style={{ padding: '8px 12px', color: '#475569', fontFamily: 'monospace' }}>{item.code}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                          {item.category}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', color: '#475569' }}>{item.unit || 'Plate'}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#16a34a' }}>₹{(item.saleRate || item.rate).toFixed(2)}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 3, fontSize: 11, fontWeight: 600 }}>
                          {item.gstPercent || 5}%
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenForm(item)}
                            style={{
                              background: '#0d6efd',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 3,
                              padding: '3px 8px',
                              cursor: 'pointer',
                              fontSize: 11
                            }}
                            title="Edit Item"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            style={{
                              background: '#dc3545',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 3,
                              padding: '3px 8px',
                              cursor: 'pointer',
                              fontSize: 11
                            }}
                            title="Delete Item"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: '#f8f9fa', padding: '8px 18px', borderTop: '1px solid #dee2e6', fontSize: 12, color: '#6c757d', display: 'flex', justifyContent: 'space-between' }}>
              <span>Showing 1 to {filteredItems.length} of {items.length} entries</span>
              <span>HOTEL SAI VASUDEV RESIDENCY &bull; RESTAURANT PMS</span>
            </div>
          </div>
        )}

        {/* VIEW 2: ADD / EDIT ITEM FORM (Exact Frame 0250 Replica) */}
        {viewMode === 'form' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f8f9fa' }}>
            <div style={{ maxWidth: 850, margin: '0 auto', background: '#fff', padding: 24, borderRadius: 6, border: '1px solid #dee2e6', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#333', marginBottom: 20 }}>
                {editingItemId ? 'Edit Item' : 'Add Item'}
              </h2>

              <form onSubmit={handleSaveItem}>
                {/* Row 1: Item Name & Barcode */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>
                      Item/Product Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. KACHOOMER SALAD, PANEER TIKA"
                      value={formItemName}
                      onChange={e => setFormItemName(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 14, fontWeight: 600 }}
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>
                      Barcode No
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 8901234011"
                      value={formBarcode}
                      onChange={e => setFormBarcode(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 14 }}
                    />
                  </div>
                </div>

                {/* Row 2: Select Item Company & Select Item Group */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>
                      Select Item Company
                    </label>
                    <select
                      value={formCompany}
                      onChange={e => setFormCompany(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                    >
                      {ITEM_COMPANIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>
                      Select Item Group
                    </label>
                    <select
                      value={formGroup}
                      onChange={e => setFormGroup(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                    >
                      {ITEM_GROUPS.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: MRP, Sale Rate, Rate A, Rate B, Rate C, Purchase Rate */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#6c757d', marginBottom: 4 }}>MRP</label>
                    <input
                      type="number"
                      value={formMrp}
                      onChange={e => setFormMrp(Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#6c757d', marginBottom: 4 }}>Sale Rate</label>
                    <input
                      type="number"
                      value={formSaleRate}
                      onChange={e => setFormSaleRate(Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#6c757d', marginBottom: 4 }}>Rate A</label>
                    <input
                      type="number"
                      value={formRateA}
                      onChange={e => setFormRateA(Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#6c757d', marginBottom: 4 }}>Rate B</label>
                    <input
                      type="number"
                      value={formRateB}
                      onChange={e => setFormRateB(Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#6c757d', marginBottom: 4 }}>Rate C</label>
                    <input
                      type="number"
                      value={formRateC}
                      onChange={e => setFormRateC(Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#6c757d', marginBottom: 4 }}>Purchase Rate</label>
                    <input
                      type="number"
                      value={formPurchaseRate}
                      onChange={e => setFormPurchaseRate(Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                    />
                  </div>
                </div>

                {/* Row 4: Unit, GST / Tax %, Item Image */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Unit</label>
                    <select
                      value={formUnit}
                      onChange={e => setFormUnit(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                    >
                      {UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>GST / Tax %</label>
                    <select
                      value={formGstPercent}
                      onChange={e => setFormGstPercent(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                    >
                      <option value={0}>GST 0%</option>
                      <option value={5}>GST 5%</option>
                      <option value={12}>GST 12%</option>
                      <option value={18}>GST 18%</option>
                      <option value={28}>GST 28%</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Item Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setFormImage(file.name);
                      }}
                      style={{ fontSize: 12, width: '100%' }}
                    />
                  </div>
                </div>

                {/* Frame 0250 Action Buttons: Save (Blue full-width) and Back (Dark centered) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      background: '#0d6efd',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: 4,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Save
                  </button>

                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      style={{
                        background: '#212529',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 30px',
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Back
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
