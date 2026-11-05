import React, { useState, useEffect } from 'react';
import type {
  PmsNoDiscountConfig,
  PmsDiscountAuditRecord,
  MenuItem
} from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import './pmsStyles.css';

interface NoDiscountMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFoodBill?: () => void;
}

export const NoDiscountMasterModal: React.FC<NoDiscountMasterModalProps> = ({
  isOpen,
  onClose,
  onOpenFoodBill
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'simulator' | 'items' | 'audit'>('rules');
  const [config, setConfig] = useState<PmsNoDiscountConfig>(PmsStore.getNoDiscountConfig());
  const [auditLogs, setAuditLogs] = useState<PmsDiscountAuditRecord[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchItem, setSearchItem] = useState('');
  
  // Simulator State (Frame 0180 from Video 33)
  const [simDiscountPercent, setSimDiscountPercent] = useState<number>(10);
  const [simCustomGroup, setSimCustomGroup] = useState<string>('');

  const loadData = () => {
    setConfig(PmsStore.getNoDiscountConfig());
    setAuditLogs(PmsStore.getDiscountAuditRecords());
    setMenuItems(PmsStore.getMenuItems());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleGroup = (groupName: string) => {
    const updatedGroups = config.protectedGroups.includes(groupName)
      ? config.protectedGroups.filter(g => g !== groupName)
      : [...config.protectedGroups, groupName];
    
    const newCfg = { ...config, protectedGroups: updatedGroups };
    setConfig(newCfg);
    PmsStore.saveNoDiscountConfig(newCfg);
  };

  const handleAddCustomGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simCustomGroup.trim()) return;
    if (!config.protectedGroups.includes(simCustomGroup.trim())) {
      const newCfg = { ...config, protectedGroups: [...config.protectedGroups, simCustomGroup.trim()] };
      setConfig(newCfg);
      PmsStore.saveNoDiscountConfig(newCfg);
    }
    setSimCustomGroup('');
  };

  const handleToggleItemExemption = (itemId: string) => {
    const updated = menuItems.map(itm => {
      if (itm.id === itemId) {
        return { ...itm, noDiscount: !itm.noDiscount };
      }
      return itm;
    });
    setMenuItems(updated);
    PmsStore.saveMenuItems(updated);
  };

  // Video 33 Frame 0180 Canonical Items Simulator
  const simBillItems = [
    { name: 'Burger', qty: 2, rate: 60, amount: 120, category: 'Snacks', group: 'fast_food', isProtected: false },
    { name: 'BADA PAO', qty: 2, rate: 60, amount: 120, category: 'Snacks', group: 'fast_food', isProtected: false },
    { name: 'Blender Spride (30Ml)', qty: 1, rate: 230, amount: 230, category: 'Liquor', group: 'Liquor', isProtected: true },
    { name: 'BAVRAGE', qty: 3, rate: 90, amount: 270, category: 'Beverage', group: 'BAVRAGE', isProtected: true },
    { name: 'DESERT', qty: 2, rate: 90, amount: 180, category: 'Dessert', group: 'DESERT', isProtected: true },
  ];

  const totalGrossAmount = simBillItems.reduce((acc, itm) => acc + itm.amount, 0); // 920.00
  
  // Calculate with protection
  const lineSimResults = simBillItems.map(itm => {
    const isExempt = itm.isProtected || config.protectedGroups.some(g => itm.category.toLowerCase().includes(g.toLowerCase()) || itm.group.toLowerCase().includes(g.toLowerCase()));
    const disPct = isExempt ? 0 : simDiscountPercent;
    const disAmt = Number(((itm.amount * disPct) / 100).toFixed(2));
    const taxable = itm.amount - disAmt;
    return {
      ...itm,
      isExempt,
      disPct,
      disAmt,
      taxable
    };
  });

  const actualDiscountGiven = lineSimResults.reduce((acc, itm) => acc + itm.disAmt, 0); // 24.00
  const naiveDiscountWithoutProtection = Number(((totalGrossAmount * simDiscountPercent) / 100).toFixed(2)); // 92.00
  const marginSaved = Number((naiveDiscountWithoutProtection - actualDiscountGiven).toFixed(2)); // 68.00

  // Taxes
  const simGst = 41.40;
  const simVat = 29.90;
  const simSur = 2.99;
  const netPayable = Math.round(totalGrossAmount - actualDiscountGiven + simGst + simVat + simSur);

  const handleSaveSimAsAudit = () => {
    const record: PmsDiscountAuditRecord = {
      id: `audit-${Date.now()}`,
      billNo: `Res/${294 + auditLogs.length}/24-25`,
      tableNo: 'T-10',
      requestedDiscountPercent: simDiscountPercent,
      actualDiscountAmount: actualDiscountGiven,
      savingsProtectedAmount: marginSaved,
      eligibleItemsCount: lineSimResults.filter(l => !l.isExempt).length,
      exemptItemsCount: lineSimResults.filter(l => l.isExempt).length,
      cashierName: 'Hotel & restaurant (Cashier)',
      timestamp: new Date().toISOString()
    };
    PmsStore.recordDiscountAudit(record);
    setAuditLogs(PmsStore.getDiscountAuditRecords());
    alert(`Audit Log Recorded for Bill ${record.billNo}: ₹${marginSaved} saved!`);
  };

  return (
    <div className="pms-modal-overlay">
      <div
        className="pms-modal-container"
        style={{
          maxWidth: 1100,
          width: '95vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: 8,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          border: '1px solid #334155'
        }}
      >
        {/* Top Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            padding: '14px 20px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>🛡️</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#f8fafc' }}>
                  No-Discount Item &amp; Margin Protection System
                </h2>
                <span style={{ background: '#f59e0b', color: '#0f172a', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>
                  Live Margin Demo
                </span>
                <span style={{ background: '#10b981', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                  Active Margin Guard
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                Auto-exempt Beverages, Desserts, and Liquor from Table Discounts &bull; Protect Hotel Bottom Line
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#334155',
              color: '#f8fafc',
              border: 'none',
              borderRadius: 4,
              width: 32,
              height: 32,
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            background: '#1e293b',
            display: 'flex',
            borderBottom: '1px solid #334155',
            padding: '0 16px',
            gap: 4
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            style={{
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 700,
              background: activeTab === 'rules' ? '#0f172a' : 'transparent',
              color: activeTab === 'rules' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'rules' ? '2px solid #38bdf8' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>⚙️</span>
            <span>Exemption Rules &amp; Group Master</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            style={{
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 700,
              background: activeTab === 'simulator' ? '#0f172a' : 'transparent',
              color: activeTab === 'simulator' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'simulator' ? '2px solid #38bdf8' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>🧮</span>
            <span>Live Bill Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('items')}
            style={{
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 700,
              background: activeTab === 'items' ? '#0f172a' : 'transparent',
              color: activeTab === 'items' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'items' ? '2px solid #38bdf8' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>🍽️</span>
            <span>Item Exemption Register (/item)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            style={{
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 700,
              background: activeTab === 'audit' ? '#0f172a' : 'transparent',
              color: activeTab === 'audit' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'audit' ? '2px solid #38bdf8' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>📋</span>
            <span>Protection Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#0f172a' }}>

          {/* TAB 1: Rules & Groups */}
          {activeTab === 'rules' && (
            <div style={{ maxWidth: 850, margin: '0 auto' }}>
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#f8fafc' }}>
                      Master Discount Exemption Engine
                    </h3>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      Enforce strict protection: never give discounts on MRP items or government tax-controlled goods
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => {
                        const newCfg = { ...config, enabled: e.target.checked };
                        setConfig(newCfg);
                        PmsStore.saveNoDiscountConfig(newCfg);
                      }}
                      style={{ width: 18, height: 18, accentColor: '#10b981', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 800, color: config.enabled ? '#34d399' : '#94a3b8' }}>
                      {config.enabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </label>
                </div>

                <div style={{ borderTop: '1px solid #334155', paddingTop: 16 }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#38bdf8', fontWeight: 700 }}>
                    Protected Product Categories &amp; Item Groups:
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {config.protectedGroups.map((grp) => (
                      <span
                        key={grp}
                        onClick={() => handleToggleGroup(grp)}
                        style={{
                          background: '#0f172a',
                          border: '1px solid #38bdf8',
                          color: '#38bdf8',
                          padding: '6px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                        title="Click to toggle group exemption"
                      >
                        <span>✓</span>
                        <span>{grp}</span>
                        <span style={{ color: '#ef4444', marginLeft: 4 }}>✕</span>
                      </span>
                    ))}
                  </div>

                  <form onSubmit={handleAddCustomGroup} style={{ display: 'flex', gap: 8, maxWidth: 380 }}>
                    <input
                      type="text"
                      value={simCustomGroup}
                      onChange={(e) => setSimCustomGroup(e.target.value)}
                      placeholder="Add custom group (e.g. Seafood)"
                      style={{ flex: 1, background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px 10px', borderRadius: 4, fontSize: 12 }}
                    />
                    <button
                      type="submit"
                      style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Add Group
                    </button>
                  </form>
                </div>
              </div>

              {/* Security Sentry Box */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 20 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#f59e0b', fontWeight: 800 }}>
                  Anti-Abuse Discount Constraints
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Max Cap on Table Discount (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={config.maxAllowedDiscountPercent}
                      onChange={(e) => {
                        const newCfg = { ...config, maxAllowedDiscountPercent: parseInt(e.target.value) || 0 };
                        setConfig(newCfg);
                        PmsStore.saveNoDiscountConfig(newCfg);
                      }}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fbbf24', fontWeight: 800, padding: '6px 10px', fontSize: 14, borderRadius: 4 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Manager Role Required for Override</label>
                    <input
                      type="text"
                      readOnly
                      value={config.overrideRoleRequired}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px 10px', fontSize: 13, borderRadius: 4 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Live Simulator (Frame 0180) */}
          {activeTab === 'simulator' && (
            <div>
              {/* Header explanation */}
              <div style={{ background: '#1e293b', borderLeft: '4px solid #f59e0b', padding: '12px 16px', borderRadius: 4, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24' }}>
                  Table T-10 Bill (Res/293/24-25)
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  The guest orders Food, Liquor, Soft Drinks, and Desserts. Watch how applying a 10% Bill Discount calculates discount strictly on Food, while saving ₹68 on protected items!
                </div>
              </div>

              {/* Slider Controller */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Requested Bill Discount Percentage:</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#fbbf24' }}>{simDiscountPercent}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={simDiscountPercent}
                    onChange={(e) => setSimDiscountPercent(parseInt(e.target.value) || 0)}
                    style={{ width: '100%', marginTop: 8, cursor: 'pointer', accentColor: '#fbbf24' }}
                  />
                </div>
                <div style={{ textAlign: 'right', minWidth: 200 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Hotel Margin Saved:</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981' }}>+₹{marginSaved.toFixed(2)}</div>
                </div>
              </div>

              {/* Table matching Frame 0180 */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, overflowX: 'auto', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: '#0284c7', color: '#fff', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', width: 40 }}>S.No</th>
                      <th style={{ padding: '8px 10px' }}>Item Name</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Dis%</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Dis Amt</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Taxable</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Exemption Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineSimResults.map((itm, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? '#1e293b' : '#0f172a' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 800, color: itm.isExempt ? '#38bdf8' : '#f8fafc' }}>
                          {itm.name}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>{itm.qty.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{itm.rate.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{itm.amount.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                          {itm.disPct > 0 ? `${itm.disPct}%` : '-'}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: itm.disAmt > 0 ? '#f87171' : '#64748b' }}>
                          ₹{itm.disAmt.toFixed(2)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#34d399' }}>
                          ₹{itm.taxable.toFixed(2)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {itm.isExempt ? (
                            <span style={{ background: '#7f1d1d', color: '#fca5a5', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>
                              🚫 NO DISCOUNT
                            </span>
                          ) : (
                            <span style={{ background: '#065f46', color: '#6ee7b7', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                              ✓ DISCOUNTABLE
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#0f172a', fontWeight: 800, color: '#f8fafc', borderTop: '2px solid #334155' }}>
                      <td colSpan={2} style={{ padding: '10px' }}>Total (5 Items, 10 Qty)</td>
                      <td colSpan={2}></td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>₹{totalGrossAmount.toFixed(2)}</td>
                      <td></td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#f87171' }}>-₹{actualDiscountGiven.toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#34d399' }}>₹{(totalGrossAmount - actualDiscountGiven).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#fbbf24' }}>
                        Net Payable: ₹{netPayable}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Comparison Card */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#450a0a', border: '1px solid #991b1b', borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5' }}>❌ Standard Discount Applied:</div>
                  <div style={{ fontSize: 11, color: '#fecaca', marginTop: 4 }}>
                    Naive discount across all items: 10% of ₹920.00 = <strong style={{ color: '#fff' }}>₹92.00 given away</strong>. Hotel gives up margin on fixed MRP cold drinks and government-taxed liquor!
                  </div>
                </div>

                <div style={{ background: '#064e3b', border: '1px solid #059669', borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6ee7b7' }}>✓ Protected (No-Discount Enforced):</div>
                  <div style={{ fontSize: 11, color: '#a7f3d0', marginTop: 4 }}>
                    Discount applied solely to Burger and Bada Pao = <strong style={{ color: '#fff' }}>₹24.00</strong>. Exact <strong style={{ color: '#fbbf24' }}>₹68.00 retained</strong> in hotel bottom line profit!
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type="button"
                  onClick={handleSaveSimAsAudit}
                  style={{
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  📝 Record Audit Log Sample
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Item Exemption Register */}
          {activeTab === 'items' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <input
                  type="text"
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                  placeholder="Filter menu items..."
                  style={{ background: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '6px 12px', borderRadius: 4, fontSize: 12, width: 260 }}
                />
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  Toggle the switch to lock an individual item against bill discounts
                </div>
              </div>

              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#0284c7', color: '#fff', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px' }}>Item Name</th>
                      <th style={{ padding: '8px 10px' }}>Category</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>No-Discount Status</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems
                      .filter(m => m.name.toLowerCase().includes(searchItem.toLowerCase()) || m.category.toLowerCase().includes(searchItem.toLowerCase()))
                      .map((itm) => {
                        const isExempt = itm.noDiscount === true || PmsStore.isItemDiscountExempt(itm.name, itm.category);
                        return (
                          <tr key={itm.id} style={{ borderBottom: '1px solid #334155', background: '#1e293b' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#f8fafc' }}>{itm.name}</td>
                            <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{itm.category}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>₹{itm.rate}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              {isExempt ? (
                                <span style={{ background: '#7f1d1d', color: '#fca5a5', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>
                                  NO DISCOUNT
                                </span>
                              ) : (
                                <span style={{ background: '#065f46', color: '#6ee7b7', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                                  DISCOUNTABLE
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleToggleItemExemption(itm.id)}
                                style={{
                                  background: isExempt ? '#334155' : '#dc2626',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '4px 10px',
                                  borderRadius: 3,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {isExempt ? 'Make Discountable' : 'Lock as No-Discount'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Audit Logs */}
          {activeTab === 'audit' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Margin Protected</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                    ₹{auditLogs.reduce((acc, a) => acc + a.savingsProtectedAmount, 0).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Protected from unauthorized cashier discounting</div>
                </div>

                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Bills Audited</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                    {auditLogs.length}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>F&amp;B and Bar bills processed with discount</div>
                </div>
              </div>

              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#0284c7', color: '#fff', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px' }}>Bill No</th>
                      <th style={{ padding: '8px 10px' }}>Table No</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Requested %</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actual Discount</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Margin Saved</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Exempt/Eligible Items</th>
                      <th style={{ padding: '8px 10px' }}>Cashier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #334155', background: '#1e293b' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 800, color: '#38bdf8' }}>{log.billNo}</td>
                        <td style={{ padding: '8px 10px', color: '#f8fafc' }}>{log.tableNo}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{log.requestedDiscountPercent}%</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f87171', fontWeight: 700 }}>₹{log.actualDiscountAmount.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#34d399', fontWeight: 800 }}>+₹{log.savingsProtectedAmount.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <span style={{ color: '#fca5a5' }}>{log.exemptItemsCount} locked</span> / <span style={{ color: '#6ee7b7' }}>{log.eligibleItemsCount} disc</span>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{log.cashierName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div
          style={{
            background: '#1e293b',
            borderTop: '1px solid #334155',
            padding: '10px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12
          }}
        >
          <div style={{ color: '#94a3b8' }}>
            <span>Hotel SRI SAI VASUDEV RESIDENCY &bull; Price Integrity &bull; Margin Protection</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {onOpenFoodBill && (
              <button
                type="button"
                onClick={onOpenFoodBill}
                style={{
                  background: '#334155',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  padding: '5px 14px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🧾 Open Restaurant Food Bill POS
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '5px 18px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
