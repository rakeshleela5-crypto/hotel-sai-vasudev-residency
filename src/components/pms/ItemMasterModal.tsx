import React, { useState, useEffect } from 'react';
import type { MenuItem, PmsItemGroup, PmsGodown, ItemHeadGroup } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import './pmsStyles.css';

interface ItemMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'list' | 'form' | 'groups' | 'godowns';
}

export const ItemMasterModal: React.FC<ItemMasterModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'list'
}) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [itemGroups, setItemGroups] = useState<PmsItemGroup[]>([]);
  const [godowns, setGodowns] = useState<PmsGodown[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'form' | 'groups' | 'godowns'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form Fields matching Frame 0180 & Frame 0250
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formItemName, setFormItemName] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCompany, setFormCompany] = useState('Genral');
  const [formGroup, setFormGroup] = useState('Raw Material');
  const [formHeadGroup, setFormHeadGroup] = useState<ItemHeadGroup>('Raw_Material');
  const [formMrp, setFormMrp] = useState<number>(0);
  const [formSaleRate, setFormSaleRate] = useState<number>(0);
  const [formRateA, setFormRateA] = useState<number>(0);
  const [formRateB, setFormRateB] = useState<number>(0);
  const [formRateC, setFormRateC] = useState<number>(0);
  const [formPurchaseRate, setFormPurchaseRate] = useState<number>(0);
  const [formUnit, setFormUnit] = useState('KG');
  const [formGstPercent, setFormGstPercent] = useState<number>(5);
  const [formImage, setFormImage] = useState<string>('');

  // Add Item Group Modal State (Frame 0140)
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newHeadGroup, setNewHeadGroup] = useState<ItemHeadGroup>('Raw_Material');

  // Add Godown Modal State (Frame 0230)
  const [showAddGodownModal, setShowAddGodownModal] = useState(false);
  const [newGodownName, setNewGodownName] = useState('');
  const [newGodownAddress, setNewGodownAddress] = useState('');

  const ITEM_COMPANIES = ['Genral', 'In-House', 'Bisleri', 'Amul', 'Haldirams', 'PepsiCo', 'Mother Dairy', 'Coca Cola', 'Britannia'];
  const UNITS = ['KG', 'Liter', 'Plate', 'Portion', 'Piece', 'Cup', 'Bottle', 'Bowl', 'Glass', 'Pcs'];

  const refreshData = () => {
    setItems(PmsStore.getMenuItems());
    setItemGroups(PmsStore.getItemGroups());
    setGodowns(PmsStore.getGodowns());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setViewMode(initialTab);
      setSuccessBanner(null);
      setShowAddGroupModal(false);
      setShowAddGodownModal(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleOpenForm = (item?: MenuItem) => {
    if (item) {
      setEditingItemId(item.id);
      setFormItemName(item.name);
      setFormBarcode(item.barcode || item.code);
      setFormCompany(item.company || 'Genral');
      setFormGroup(item.category);
      setFormHeadGroup(item.headGroup || 'Restaurant_Item');
      setFormMrp(item.mrp || item.rate);
      setFormSaleRate(item.saleRate || item.rate);
      setFormRateA(item.rateA || item.rate);
      setFormRateB(item.rateB || item.rate);
      setFormRateC(item.rateC || item.rate);
      setFormPurchaseRate(item.purchaseRate || Math.round(item.rate * 0.5));
      setFormUnit(item.unit || 'Pcs');
      setFormGstPercent(item.gstPercent || 5);
      setFormImage(item.image || '');
    } else {
      setEditingItemId(null);
      setFormItemName('');
      setFormBarcode(`100${Math.floor(10 + Math.random() * 90)}`);
      setFormCompany('Genral');
      setFormGroup('Raw Material');
      setFormHeadGroup('Raw_Material');
      setFormMrp(150);
      setFormSaleRate(150);
      setFormRateA(150);
      setFormRateB(140);
      setFormRateC(130);
      setFormPurchaseRate(140);
      setFormUnit('KG');
      setFormGstPercent(5);
      setFormImage('');
    }
    setViewMode('form');
  };

  const handleGroupSelectionChange = (grpName: string) => {
    setFormGroup(grpName);
    const matched = itemGroups.find(g => g.name.toLowerCase() === grpName.toLowerCase());
    if (matched) {
      setFormHeadGroup(matched.headGroup);
    }
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
      headGroup: formHeadGroup,
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

  // Group creation (Frame 0140 & Frame 0150)
  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      alert('Please enter Item Group Name');
      return;
    }

    const newGroup: PmsItemGroup = {
      id: `ig-${Date.now()}`,
      sNo: itemGroups.length + 1,
      name: newGroupName.trim(),
      headGroup: newHeadGroup
    };

    PmsStore.saveItemGroup(newGroup);
    setSuccessBanner('Group created successfully!');
    setShowAddGroupModal(false);
    setNewGroupName('');
    refreshData();
  };

  // Godown creation (Frame 0230)
  const handleSaveGodown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGodownName.trim()) {
      alert('Please enter Godown Name');
      return;
    }

    const newG: PmsGodown = {
      id: `g-${Date.now()}`,
      sNo: godowns.length + 1,
      name: newGodownName.trim(),
      address: newGodownAddress.trim() || newGodownName.trim()
    };

    PmsStore.saveGodown(newG);
    setSuccessBanner(`Godown "${newG.name}" created successfully!`);
    setShowAddGodownModal(false);
    setNewGodownName('');
    setNewGodownAddress('');
    refreshData();
  };

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.barcode && i.barcode.includes(searchQuery)) ||
    i.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pms-overlay" onClick={onClose}>
      <div className="pms-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 1180, width: '95%', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header className="pms-header" style={{ background: '#1e293b', color: '#fff', padding: '10px 18px' }}>
          <div className="pms-header-left" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🍽️</span>
            <h2 className="pms-brand-title" style={{ fontSize: 15, margin: 0, fontWeight: 700 }}>
              HOTEL SRI SAI VASUDEV RESIDENCY &bull; {
                viewMode === 'form' ? 'ADD / EDIT ITEM (/itemform)' :
                viewMode === 'groups' ? 'ITEM GROUP LIST (/itemgroups)' :
                viewMode === 'godowns' ? 'GODOWN LIST (/godowns)' :
                'ITEM LIST (/item)'
              }
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

        {/* Toolbar Tabs matching Video 19 navigation */}
        <div style={{ background: '#f8fafc', padding: '10px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { setViewMode('list'); setSuccessBanner(null); }}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                cursor: 'pointer',
                background: viewMode === 'list' ? '#2563eb' : '#fff',
                color: viewMode === 'list' ? '#fff' : '#475569'
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
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                cursor: 'pointer',
                background: viewMode === 'form' ? '#2563eb' : '#fff',
                color: viewMode === 'form' ? '#fff' : '#475569'
              }}
            >
              + Add New Item
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('groups'); setSuccessBanner(null); }}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                cursor: 'pointer',
                background: viewMode === 'groups' ? '#2563eb' : '#fff',
                color: viewMode === 'groups' ? '#fff' : '#475569'
              }}
            >
              🏷️ Item Groups ({itemGroups.length})
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('godowns'); setSuccessBanner(null); }}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                cursor: 'pointer',
                background: viewMode === 'godowns' ? '#2563eb' : '#fff',
                color: viewMode === 'godowns' ? '#fff' : '#475569'
              }}
            >
              🏬 Godowns / Stores ({godowns.length})
            </button>
          </div>

          {/* Sub-action per view */}
          {viewMode === 'groups' && (
            <button
              type="button"
              onClick={() => setShowAddGroupModal(true)}
              style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              + Add New Item Group
            </button>
          )}

          {viewMode === 'godowns' && (
            <button
              type="button"
              onClick={() => setShowAddGodownModal(true)}
              style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              + Add New Godown
            </button>
          )}
        </div>

        {/* Flash Banner */}
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

        {/* VIEW 1: ITEMS LIST (Frame 0130 & Frame 0210) */}
        {viewMode === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderBottom: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
                <select
                  value={entriesPerPage}
                  onChange={e => setEntriesPerPage(Number(e.target.value))}
                  style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 3 }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>entries per page</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 13, color: '#475569' }}>Search:</label>
                <input
                  type="text"
                  placeholder="e.g. ref, daal, water..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 3, width: 220, fontSize: 13 }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 18, background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '10px 12px', width: 55 }}>S.No</th>
                    <th style={{ padding: '10px 12px' }}>Item Name</th>
                    <th style={{ padding: '10px 12px', width: 90 }}>Company</th>
                    <th style={{ padding: '10px 12px', width: 100 }}>Barcode</th>
                    <th style={{ padding: '10px 12px', width: 120 }}>Group</th>
                    <th style={{ padding: '10px 12px', width: 130 }}>Head Group</th>
                    <th style={{ padding: '10px 12px', width: 75, textAlign: 'right' }}>MRP</th>
                    <th style={{ padding: '10px 12px', width: 75, textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '10px 12px', width: 65, textAlign: 'center' }}>Unit</th>
                    <th style={{ padding: '10px 12px', width: 85, textAlign: 'center' }}>GST %</th>
                    <th style={{ padding: '10px 12px', width: 90, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.slice(0, entriesPerPage).map((item, idx) => (
                    <tr
                      key={item.id}
                      style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}
                    >
                      <td style={{ padding: '8px 12px', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '8px 12px', color: '#475569' }}>{item.company || 'Genral'}</td>
                      <td style={{ padding: '8px 12px', color: '#64748b', fontSize: 12 }}>{item.barcode || item.code}</td>
                      <td style={{ padding: '8px 12px' }}>{item.category}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span
                          style={{
                            background: item.headGroup === 'Raw_Material' ? '#fef3c7' : '#e0f2fe',
                            color: item.headGroup === 'Raw_Material' ? '#b45309' : '#0369a1',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        >
                          {item.headGroup || 'Restaurant_Item'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>₹{item.mrp || item.rate}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>₹{item.rate}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>{item.unit || 'Pcs'}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>GST {item.gstPercent || 5}%</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenForm(item)}
                            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 3, width: 24, height: 24, cursor: 'pointer', fontSize: 11 }}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 3, width: 24, height: 24, cursor: 'pointer', fontSize: 11 }}
                            title="Delete"
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

            <div style={{ background: '#f8fafc', padding: '8px 18px', borderTop: '1px solid #e2e8f0', fontSize: 12, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>Showing 1 to {Math.min(filteredItems.length, entriesPerPage)} of {filteredItems.length} entries</span>
              <span>HOTEL SRI SAI VASUDEV RESIDENCY &bull; STORE &amp; RESTAURANT PMS</span>
            </div>
          </div>
        )}

        {/* VIEW 2: ADD / EDIT ITEM FORM (Frame 0180) */}
        {viewMode === 'form' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f8fafc' }}>
            <div style={{ maxWidth: 850, margin: '0 auto', background: '#fff', padding: 24, borderRadius: 6, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 20 }}>
                {editingItemId ? 'Edit Item' : 'Add Item'}
              </h2>

              <form onSubmit={handleSaveItem}>
                {/* Row 1: Item Name & Barcode */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Item/Product Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Daal Rahar, Refine Oil, Paneer Tika"
                      value={formItemName}
                      onChange={e => setFormItemName(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 14, fontWeight: 600 }}
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Barcode No
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10058, 10069"
                      value={formBarcode}
                      onChange={e => setFormBarcode(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 14 }}
                    />
                  </div>
                </div>

                {/* Row 2: Company, Group & Head Group */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Select Item Company
                    </label>
                    <select
                      value={formCompany}
                      onChange={e => setFormCompany(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                    >
                      {ITEM_COMPANIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Select Item Group
                    </label>
                    <select
                      value={formGroup}
                      onChange={e => handleGroupSelectionChange(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13, fontWeight: 600 }}
                    >
                      {itemGroups.map(g => (
                        <option key={g.id} value={g.name}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Head Group (Segregation)
                    </label>
                    <select
                      value={formHeadGroup}
                      onChange={e => setFormHeadGroup(e.target.value as ItemHeadGroup)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 700,
                        background: formHeadGroup === 'Raw_Material' ? '#fef3c7' : '#e0f2fe',
                        color: formHeadGroup === 'Raw_Material' ? '#b45309' : '#0369a1'
                      }}
                    >
                      <option value="Restaurant_Item">Restaurant_Item (Sale/KOT Menu)</option>
                      <option value="Raw_Material">Raw_Material (Store Stock Only)</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Rates */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>MRP</label>
                    <input
                      type="number"
                      value={formMrp}
                      onChange={e => setFormMrp(Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Sale Rate</label>
                    <input
                      type="number"
                      value={formSaleRate}
                      onChange={e => setFormSaleRate(Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4 }}>Rate A</label>
                    <input
                      type="number"
                      value={formRateA}
                      onChange={e => setFormRateA(Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4 }}>Rate B</label>
                    <input
                      type="number"
                      value={formRateB}
                      onChange={e => setFormRateB(Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4 }}>Rate C</label>
                    <input
                      type="number"
                      value={formRateC}
                      onChange={e => setFormRateC(Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#0284c7', marginBottom: 4 }}>Purchase Rate</label>
                    <input
                      type="number"
                      value={formPurchaseRate}
                      onChange={e => setFormPurchaseRate(Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #0284c7', borderRadius: 4, fontSize: 13, fontWeight: 700 }}
                    />
                  </div>
                </div>

                {/* Row 4: Unit, GST, Image */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Unit</label>
                    <select
                      value={formUnit}
                      onChange={e => setFormUnit(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                    >
                      {UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>GST / Tax %</label>
                    <select
                      value={formGstPercent}
                      onChange={e => setFormGstPercent(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                    >
                      <option value={0}>GST 0%</option>
                      <option value={5}>GST 5%</option>
                      <option value={12}>GST 12%</option>
                      <option value={18}>GST 18%</option>
                      <option value={28}>GST 28%</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Item Image</label>
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

                {/* Save and Back buttons matching Frame 0180 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      background: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      padding: '11px 16px',
                      borderRadius: 4,
                      fontSize: 15,
                      fontWeight: 700,
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
                        background: '#1e293b',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 24px',
                        borderRadius: 4,
                        fontSize: 13,
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

        {/* VIEW 3: ITEM GROUPS LIST (Frame 0150) */}
        {viewMode === 'groups' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 18, background: '#fff' }}>
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '10px 12px', width: 65, textAlign: 'center' }}>S.No</th>
                    <th style={{ padding: '10px 12px' }}>Item Group</th>
                    <th style={{ padding: '10px 12px', width: 220 }}>Item Head Group</th>
                    <th style={{ padding: '10px 12px', width: 100, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {itemGroups.map((g, idx) => (
                    <tr key={g.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b' }}>{g.sNo}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>{g.name}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span
                          style={{
                            background: g.headGroup === 'Raw_Material' ? '#fef3c7' : '#e0f2fe',
                            color: g.headGroup === 'Raw_Material' ? '#b45309' : '#0369a1',
                            padding: '3px 10px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700
                          }}
                        >
                          {g.headGroup}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => {
                              PmsStore.deleteItemGroup(g.id);
                              refreshData();
                            }}
                            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 3, width: 24, height: 24, cursor: 'pointer', fontSize: 11 }}
                            title="Delete"
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
          </div>
        )}

        {/* VIEW 4: GODOWNS / STORES LIST (Frame 0230) */}
        {viewMode === 'godowns' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 18, background: '#fff' }}>
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '10px 12px', width: 65, textAlign: 'center' }}>S.No</th>
                    <th style={{ padding: '10px 12px', width: 250 }}>Godown Name</th>
                    <th style={{ padding: '10px 12px' }}>Godown Address</th>
                    <th style={{ padding: '10px 12px', width: 100, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {godowns.map((g, idx) => (
                    <tr key={g.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b' }}>{g.sNo}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b' }}>{g.name}</td>
                      <td style={{ padding: '8px 12px', color: '#475569' }}>{g.address}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete godown "${g.name}"?`)) {
                              PmsStore.deleteGodown(g.id);
                              refreshData();
                            }
                          }}
                          style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 3, width: 24, height: 24, cursor: 'pointer', fontSize: 11 }}
                          title="Delete"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: ADD GROUP (Frame 0140) */}
        {showAddGroupModal && (
          <div className="pms-overlay" style={{ zIndex: 1100 }}>
            <div className="pms-window" style={{ maxWidth: 460, padding: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Add Group</h3>
                <button type="button" onClick={() => setShowAddGroupModal(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}>✕</button>
              </div>

              <form onSubmit={handleSaveGroup} style={{ padding: 18 }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Item Group Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Raw Material, SPICES"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4 }}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Head Group
                  </label>
                  <select
                    value={newHeadGroup}
                    onChange={e => setNewHeadGroup(e.target.value as ItemHeadGroup)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4 }}
                  >
                    <option value="Raw_Material">Raw_Material (Store / Purchases Only)</option>
                    <option value="Restaurant_Item">Restaurant_Item (Sale/Food Bill Menu)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddGroupModal(false)}
                    style={{ padding: '6px 16px', background: '#64748b', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '6px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD GODOWN (Frame 0230) */}
        {showAddGodownModal && (
          <div className="pms-overlay" style={{ zIndex: 1100 }}>
            <div className="pms-window" style={{ maxWidth: 460, padding: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Add Godown</h3>
                <button type="button" onClick={() => setShowAddGodownModal(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}>✕</button>
              </div>

              <form onSubmit={handleSaveGodown} style={{ padding: 18 }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Godown Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Main Store, Kitchen, STORE1"
                    value={newGodownName}
                    onChange={e => setNewGodownName(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4 }}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Godown Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ground Floor Store, Kitchen Prep, Top Floor"
                    value={newGodownAddress}
                    onChange={e => setNewGodownAddress(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 4 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddGodownModal(false)}
                    style={{ padding: '6px 16px', background: '#64748b', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '6px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
