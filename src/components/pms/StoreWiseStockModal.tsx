import React, { useState, useEffect } from 'react';
import type { GodownStockRow, PmsGodown } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import './pmsStyles.css';

interface StoreWiseStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPurchase?: () => void;
  onOpenTransfer?: () => void;
}

export const StoreWiseStockModal: React.FC<StoreWiseStockModalProps> = ({
  isOpen,
  onClose,
  onOpenPurchase,
  onOpenTransfer
}) => {
  const [godowns, setGodowns] = useState<PmsGodown[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, GodownStockRow[]>>({});
  const [selectedGodownFilter, setSelectedGodownFilter] = useState<string>('ALL');
  const [searchPerGodown, setSearchPerGodown] = useState<Record<string, string>>({});
  const [copiedGodown, setCopiedGodown] = useState<string | null>(null);

  const refreshData = () => {
    const allGodowns = PmsStore.getGodowns();
    setGodowns(allGodowns);
    const computed = PmsStore.getGodownStock();
    setStockMap(computed);
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setCopiedGodown(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearchChange = (godownName: string, val: string) => {
    setSearchPerGodown(prev => ({
      ...prev,
      [godownName]: val
    }));
  };

  // Export handlers matching RoomG buttons (Copy, CSV, Excel, PDF, Print)
  const handleCopy = (godownName: string, rows: GodownStockRow[]) => {
    const text = rows
      .map(r => `${r.sNo}\t${r.itemName}\t${r.stockIn}\t${r.stockOut}\t${r.closingStock}`)
      .join('\n');
    navigator.clipboard.writeText(`S.No\tItem Name\tStock In\tStock Out\tClosing Stock\n${text}`);
    setCopiedGodown(godownName);
    setTimeout(() => setCopiedGodown(null), 2000);
  };

  const handleExportCsv = (godownName: string, rows: GodownStockRow[]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['S.No,Item Name,Stock In,Stock Out,Closing Stock']
        .concat(rows.map(r => `${r.sNo},"${r.itemName}",${r.stockIn},${r.stockOut},${r.closingStock}`))
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_${godownName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const visibleGodowns = selectedGodownFilter === 'ALL'
    ? godowns
    : godowns.filter(g => g.name === selectedGodownFilter);

  return (
    <div className="pms-overlay" onClick={onClose}>
      <div
        className="pms-window"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 1250, width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <header className="pms-header" style={{ background: '#1e293b', color: '#fff', padding: '10px 18px' }}>
          <div className="pms-header-left" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🏬</span>
            <h2 className="pms-brand-title" style={{ fontSize: 15, margin: 0, fontWeight: 700, letterSpacing: 0.5 }}>
              HOTEL SAI VASUDEV RESIDENCY &bull; STORE WISE STOCK REPORT (RoomG /store_wise_stock)
            </h2>
          </div>
          <div className="pms-header-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {onOpenPurchase && (
              <button
                type="button"
                onClick={onOpenPurchase}
                style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                + Purchase
              </button>
            )}
            {onOpenTransfer && (
              <button
                type="button"
                onClick={onOpenTransfer}
                style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                + Transfer / Issue
              </button>
            )}
            <button type="button" onClick={onClose} className="pms-close-btn" title="Close">
              ✕
            </button>
          </div>
        </header>

        {/* Filter bar */}
        <div style={{ background: '#f8fafc', padding: '10px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Filter Godown:</span>
            <button
              type="button"
              onClick={() => setSelectedGodownFilter('ALL')}
              style={{
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                cursor: 'pointer',
                background: selectedGodownFilter === 'ALL' ? '#0f172a' : '#fff',
                color: selectedGodownFilter === 'ALL' ? '#fff' : '#475569'
              }}
            >
              All Stores (Stacked)
            </button>
            {godowns.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGodownFilter(g.name)}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  cursor: 'pointer',
                  background: selectedGodownFilter === g.name ? '#0284c7' : '#fff',
                  color: selectedGodownFilter === g.name ? '#fff' : '#475569'
                }}
              >
                {g.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={refreshData}
              style={{ padding: '4px 12px', fontSize: 12, background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
            >
              🔄 Refresh Stock
            </button>
          </div>
        </div>

        {/* Content Area with Stacked Godown Tables (Frames 0260, 0320, 0370) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 18, background: '#fff' }}>
          {visibleGodowns.map(g => {
            const rawRows = stockMap[g.name] || [];
            const search = (searchPerGodown[g.name] || '').toLowerCase().trim();
            const filteredRows = rawRows.filter(r =>
              r.itemName.toLowerCase().includes(search) ||
              (r.barcode && r.barcode.includes(search))
            );

            const totalIn = filteredRows.reduce((sum, r) => sum + r.stockIn, 0);
            const totalOut = filteredRows.reduce((sum, r) => sum + r.stockOut, 0);
            const totalClosing = filteredRows.reduce((sum, r) => sum + r.closingStock, 0);

            return (
              <div key={g.id} style={{ marginBottom: 28, border: '1px solid #e2e8f0', borderRadius: 6, padding: 14, background: '#fafafa' }}>
                {/* Godown Title matching Frame 0260 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                    Godown: {g.name}
                  </h3>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    Address: {g.address}
                  </span>
                </div>

                {/* Toolbar matching RoomG buttons (Copy, CSV, Excel, PDF, Print, Search) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => handleCopy(g.name, filteredRows)}
                      style={{ padding: '4px 10px', fontSize: 12, background: '#fff', border: '1px solid #94a3b8', borderRadius: 2, cursor: 'pointer', fontWeight: 600 }}
                    >
                      {copiedGodown === g.name ? '✓ Copied' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportCsv(g.name, filteredRows)}
                      style={{ padding: '4px 10px', fontSize: 12, background: '#fff', border: '1px solid #94a3b8', borderRadius: 2, cursor: 'pointer', fontWeight: 600 }}
                    >
                      CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportCsv(g.name, filteredRows)}
                      style={{ padding: '4px 10px', fontSize: 12, background: '#fff', border: '1px solid #94a3b8', borderRadius: 2, cursor: 'pointer', fontWeight: 600 }}
                    >
                      Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      style={{ padding: '4px 10px', fontSize: 12, background: '#fff', border: '1px solid #94a3b8', borderRadius: 2, cursor: 'pointer', fontWeight: 600 }}
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      style={{ padding: '4px 10px', fontSize: 12, background: '#fff', border: '1px solid #94a3b8', borderRadius: 2, cursor: 'pointer', fontWeight: 600 }}
                    >
                      Print
                    </button>
                  </div>

                  {/* Search box per godown matching Frame 0260 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ fontSize: 12, color: '#475569' }}>Search:</label>
                    <input
                      type="text"
                      placeholder="e.g. ref, daal"
                      value={searchPerGodown[g.name] || ''}
                      onChange={e => handleSearchChange(g.name, e.target.value)}
                      style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 3, width: 140 }}
                    />
                  </div>
                </div>

                {/* Table matching RoomG Frame 0260 & 0320 */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden', background: '#fff' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#1e293b', color: '#fff', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px', width: 65, textAlign: 'center' }}>S.No</th>
                        <th style={{ padding: '8px 12px' }}>Item Name</th>
                        <th style={{ padding: '8px 12px', width: 120, textAlign: 'center' }}>Stock In</th>
                        <th style={{ padding: '8px 12px', width: 120, textAlign: 'center' }}>Stock Out</th>
                        <th style={{ padding: '8px 12px', width: 140, textAlign: 'center' }}>Closing Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '18px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                            No stock records found for {g.name}
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>{r.sNo}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>
                              {r.itemName}
                              {r.unit && <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>({r.unit})</span>}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#16a34a' }}>
                              {r.stockIn}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#dc2626' }}>
                              {r.stockOut}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 10px',
                                  borderRadius: 4,
                                  fontWeight: 700,
                                  background: r.closingStock >= 0 ? '#dcfce7' : '#fee2e2',
                                  color: r.closingStock >= 0 ? '#15803d' : '#b91c1c'
                                }}
                              >
                                {r.closingStock}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {/* Summary Footer matching Frame 0260 */}
                    <tfoot>
                      <tr style={{ background: '#1e293b', color: '#fff', fontWeight: 700 }}>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>Total</td>
                        <td style={{ padding: '8px 12px' }}>Total Items = {filteredRows.length}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{totalIn}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{totalOut}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{totalClosing}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
