import React, { useState, useEffect } from 'react';
import type { 
  GodownStockRow, 
  PmsGodown, 
  PmsConsolidatedStockRow, 
  PmsStockAuditMovement, 
  PmsHotelAssetLinenRecord 
} from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import './pmsStyles.css';

interface StockReportMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPurchase?: () => void;
  onOpenTransfer?: () => void;
  initialTab?: 'store_wise' | 'consolidated' | 'simulator' | 'linen_assets';
}

export const StockReportMasterModal: React.FC<StockReportMasterModalProps> = ({
  isOpen,
  onClose,
  onOpenPurchase,
  onOpenTransfer,
  initialTab = 'store_wise'
}) => {
  const [activeTab, setActiveTab] = useState<'store_wise' | 'consolidated' | 'simulator' | 'linen_assets'>(initialTab);
  
  // Data States
  const [godowns, setGodowns] = useState<PmsGodown[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, GodownStockRow[]>>({});
  const [consolidatedRows, setConsolidatedRows] = useState<PmsConsolidatedStockRow[]>([]);
  const [assetRecords, setAssetRecords] = useState<PmsHotelAssetLinenRecord[]>([]);
  
  // Search & Filter States
  const [selectedGodownFilter, setSelectedGodownFilter] = useState<string>('ALL');
  const [searchPerGodown, setSearchPerGodown] = useState<Record<string, string>>({});
  const [consolidatedSearch, setConsolidatedSearch] = useState<string>('');
  const [assetSearch, setAssetSearch] = useState<string>('');
  
  // Drill-down Modal State
  const [selectedItemAudit, setSelectedItemAudit] = useState<string | null>(null);
  const [auditMovements, setAuditMovements] = useState<PmsStockAuditMovement[]>([]);
  
  // Simulator State (Video 34 Step-by-Step Flow)
  const [simStep, setSimStep] = useState<number>(1);
  const [simPurchaseQty, setSimPurchaseQty] = useState<number>(100);
  const [simPurchaseRate, setSimPurchaseRate] = useState<number>(15);
  const [simTransferQty, setSimTransferQty] = useState<number>(40);
  const [simIssueQty, setSimIssueQty] = useState<number>(50);
  const [simSuccessMsg, setSimSuccessMsg] = useState<string | null>(null);

  // Copy Feedback State
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const loadData = () => {
    const allGodowns = PmsStore.getGodowns();
    setGodowns(allGodowns);
    const computedStock = PmsStore.getGodownStock();
    setStockMap(computedStock);
    const consolidated = PmsStore.getConsolidatedStockReport(consolidatedSearch);
    setConsolidatedRows(consolidated);
    const assets = PmsStore.getHotelAssetLinenRecords();
    setAssetRecords(assets);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setActiveTab(initialTab);
      setCopyFeedback(null);
      setSelectedItemAudit(null);
      setSimSuccessMsg(null);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen) {
      setConsolidatedRows(PmsStore.getConsolidatedStockReport(consolidatedSearch));
    }
  }, [consolidatedSearch, isOpen]);

  if (!isOpen) return null;

  const handleOpenItemAudit = (itemName: string) => {
    setSelectedItemAudit(itemName);
    setAuditMovements(PmsStore.getStockAuditMovements(itemName));
  };

  const handleSearchChange = (godownName: string, val: string) => {
    setSearchPerGodown(prev => ({
      ...prev,
      [godownName]: val
    }));
  };

  // Export handlers matching RoomG standard buttons (Copy, CSV, Excel, PDF, Print)
  const handleCopyGodown = (godownName: string, rows: GodownStockRow[]) => {
    const text = rows
      .map(r => `${r.sNo}\t${r.itemName}\t${r.stockIn}\t${r.stockOut}\t${r.closingStock}`)
      .join('\n');
    navigator.clipboard.writeText(`S.No\tItem Name\tStock In\tStock Out\tClosing Stock\n${text}`);
    setCopyFeedback(`Copied ${godownName} table!`);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleExportCsvGodown = (godownName: string, rows: GodownStockRow[]) => {
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

  const handleCopyConsolidated = () => {
    const text = consolidatedRows
      .map(r => `${r.sNo}\t${r.itemName}\t${r.category}\t${r.totalStockIn}\t${r.totalStockOut}\t${r.totalClosingStock}\t₹${r.purchaseRate}\t₹${r.totalValuation}\t${r.status}`)
      .join('\n');
    navigator.clipboard.writeText(`S.No\tItem Name\tCategory\tStock In\tStock Out\tClosing Stock\tRate\tValuation\tStatus\n${text}`);
    setCopyFeedback('Copied Consolidated Stock table!');
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleExportCsvConsolidated = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['S.No,Item Name,Category,Stock In,Stock Out,Closing Stock,Rate,Valuation,Status']
        .concat(consolidatedRows.map(r => `${r.sNo},"${r.itemName}","${r.category}",${r.totalStockIn},${r.totalStockOut},${r.totalClosingStock},${r.purchaseRate},${r.totalValuation},"${r.status}"`))
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Consolidated_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Video 34 Live Simulator Actions
  const handleSimStep1Purchase = () => {
    const purchases = PmsStore.getPurchases();
    const newPur = {
      id: `pur-sim-${Date.now()}`,
      billNo: '4334',
      billDate: '20-07-2025',
      godown: 'STORE1',
      terms: 'Credit' as const,
      accountName: 'GUPTA JII',
      items: [
        {
          sNo: 1,
          itemId: 'm-water-botle',
          itemName: 'WATER BOTLE',
          barcode: '10013',
          qty: simPurchaseQty,
          rate: simPurchaseRate,
          amount: simPurchaseQty * simPurchaseRate,
          discountPercent: 0,
          discountAmt: 0,
          totalDiscount: 0,
          taxable: simPurchaseQty * simPurchaseRate,
          gstPercent: 0,
          gstAmt: 0,
          netValue: simPurchaseQty * simPurchaseRate
        }
      ],
      totalQty: simPurchaseQty,
      totalAmount: simPurchaseQty * simPurchaseRate,
      totalDiscount: 0,
      totalTaxable: simPurchaseQty * simPurchaseRate,
      totalGstAmt: 0,
      totalNetValue: simPurchaseQty * simPurchaseRate,
      createdAt: new Date().toISOString()
    };
    purchases.unshift(newPur);
    localStorage.setItem('svr_pms_purchases', JSON.stringify(purchases));
    loadData();
    setSimStep(2);
    setSimSuccessMsg(`✅ Step 1 Complete: Purchased ${simPurchaseQty} pcs WATER BOTLE into STORE1 (Bill #4334, Vendor: Gupta Jii)`);
  };

  const handleSimStep2Transfer = () => {
    PmsStore.recordStockTransferDirect('STORE1', 'Main Store', 'WATER BOTLE', simTransferQty, 'S/2/24-25');
    loadData();
    setSimStep(3);
    setSimSuccessMsg(`✅ Step 2 Complete: Transferred ${simTransferQty} pcs WATER BOTLE from STORE1 to Main Store. STORE1 stock reduced, Main Store stock increased!`);
  };

  const handleSimStep3Issue = () => {
    PmsStore.recordStockTransferDirect('Main Store', 'Consume', 'WATER BOTLE', simIssueQty, 'ISSUE/50');
    loadData();
    setSimStep(4);
    setSimSuccessMsg(`✅ Step 3 Complete: Issued ${simIssueQty} pcs WATER BOTLE to Consume godown for hotel housekeeping & guest amenities.`);
  };

  const handleResetSimulator = () => {
    setSimStep(1);
    setSimSuccessMsg(null);
    loadData();
  };

  const visibleGodowns = selectedGodownFilter === 'ALL'
    ? godowns
    : godowns.filter(g => g.name === selectedGodownFilter);

  // Compute overall summary totals
  const totalValuationAll = consolidatedRows.reduce((acc, r) => acc + r.totalValuation, 0);
  const totalItemsCount = consolidatedRows.length;
  const totalStockInAll = consolidatedRows.reduce((acc, r) => acc + r.totalStockIn, 0);
  const totalStockOutAll = consolidatedRows.reduce((acc, r) => acc + r.totalStockOut, 0);
  const totalClosingStockAll = consolidatedRows.reduce((acc, r) => acc + r.totalClosingStock, 0);

  return (
    <div className="pms-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="pms-window"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 1320,
          width: '96%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Header matching RoomG Video 34 dark theme #1e293b */}
        <header
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #3b82f6'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>🏬</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: '0.5px', color: '#f8fafc' }}>
                  HOTEL SAI VASUDEV RESIDENCY &bull; STOCK REPORT &amp; INVENTORY CONTROL
                </h2>
                <span style={{ background: '#3b82f6', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>
                  Video 34 Canonical Suite
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>
                Store-Wise Stock (/store_wise_stock) &bull; Item-Wise Inventory (/inventories) &bull; Anti-Pilferage &amp; Linen Control
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {copyFeedback && (
              <span style={{ background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4 }}>
                {copyFeedback}
              </span>
            )}
            {onOpenPurchase && (
              <button
                type="button"
                onClick={onOpenPurchase}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>+</span> New Purchase
              </button>
            )}
            {onOpenTransfer && (
              <button
                type="button"
                onClick={onOpenTransfer}
                style={{
                  background: '#0d9488',
                  color: '#fff',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>⇄</span> Stock Transfer
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: 32,
                height: 32,
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', padding: '0 16px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('store_wise')}
            style={{
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'store_wise' ? '#ffffff' : 'transparent',
              color: activeTab === 'store_wise' ? '#0f172a' : '#64748b',
              borderBottom: activeTab === 'store_wise' ? '3px solid #2563eb' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>🏢</span>
            <span>Store Wise Stock (/store_wise_stock)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('consolidated')}
            style={{
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'consolidated' ? '#ffffff' : 'transparent',
              color: activeTab === 'consolidated' ? '#0f172a' : '#64748b',
              borderBottom: activeTab === 'consolidated' ? '3px solid #2563eb' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>📊</span>
            <span>Consolidated Item-Wise (/inventories)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            style={{
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'simulator' ? '#ffffff' : 'transparent',
              color: activeTab === 'simulator' ? '#0f172a' : '#64748b',
              borderBottom: activeTab === 'simulator' ? '3px solid #2563eb' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>⚡</span>
            <span>Live Flow Simulator (Video 34 Demo)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('linen_assets')}
            style={{
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              background: activeTab === 'linen_assets' ? '#ffffff' : 'transparent',
              color: activeTab === 'linen_assets' ? '#0f172a' : '#64748b',
              borderBottom: activeTab === 'linen_assets' ? '3px solid #2563eb' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>🛏️</span>
            <span>Hotel Linen &amp; Asset Anti-Theft Ledger</span>
          </button>
        </div>

        {/* Tab 1: Store Wise Stock Report matching Video 34 Frames 0200, 0230, 0240 */}
        {activeTab === 'store_wise' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {/* Top Bar: Godown Filter & Overall Stats */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                background: '#f8fafc',
                padding: '12px 16px',
                borderRadius: 6,
                border: '1px solid #e2e8f0',
                marginBottom: 20
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Filter Godown:</span>
                <select
                  value={selectedGodownFilter}
                  onChange={e => setSelectedGodownFilter(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#ffffff'
                  }}
                >
                  <option value="ALL">All Godowns (Consolidated View)</option>
                  {godowns.map(g => (
                    <option key={g.id} value={g.name}>{g.name} ({g.address || 'Store'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Total Godowns: <strong style={{ color: '#0f172a' }}>{godowns.length}</strong>
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Total Valuation: <strong style={{ color: '#16a34a' }}>₹{totalValuationAll.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

            {/* Loop through each Godown block matching RoomG Frames 0200, 0230, 0240 */}
            {visibleGodowns.map(godown => {
              const allRows = stockMap[godown.name] || [];
              const searchVal = searchPerGodown[godown.name] || '';
              const filteredRows = searchVal.trim()
                ? allRows.filter(r => r.itemName.toLowerCase().includes(searchVal.toLowerCase().trim()))
                : allRows;

              const totalIn = filteredRows.reduce((a, b) => a + b.stockIn, 0);
              const totalOut = filteredRows.reduce((a, b) => a + b.stockOut, 0);
              const totalClosing = filteredRows.reduce((a, b) => a + b.closingStock, 0);

              return (
                <div
                  key={godown.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    marginBottom: 24,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Godown Title & RoomG standard export action bar (Copy, CSV, Excel, PDF, Print) */}
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '12px 16px',
                      borderBottom: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                        Godown: <span style={{ color: '#2563eb' }}>{godown.name}</span>
                      </h3>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        Showing 1 to {filteredRows.length} of {allRows.length} entries (filtered from {allRows.length} total entries)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      {/* RoomG Button Palette (Frames 0200 & 0240) */}
                      <div style={{ display: 'inline-flex', border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                        <button
                          type="button"
                          onClick={() => handleCopyGodown(godown.name, filteredRows)}
                          style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: '#ffffff', border: 'none', borderRight: '1px solid #cbd5e1', cursor: 'pointer' }}
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportCsvGodown(godown.name, filteredRows)}
                          style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: '#ffffff', border: 'none', borderRight: '1px solid #cbd5e1', cursor: 'pointer' }}
                        >
                          CSV
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportCsvGodown(godown.name, filteredRows)}
                          style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: '#ffffff', border: 'none', borderRight: '1px solid #cbd5e1', cursor: 'pointer' }}
                        >
                          Excel
                        </button>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: '#ffffff', border: 'none', borderRight: '1px solid #cbd5e1', cursor: 'pointer' }}
                        >
                          PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: '#ffffff', border: 'none', cursor: 'pointer' }}
                        >
                          Print
                        </button>
                      </div>

                      {/* Search Input (Frame 0240 Search: WA) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Search:</label>
                        <input
                          type="text"
                          value={searchVal}
                          onChange={e => handleSearchChange(godown.name, e.target.value)}
                          placeholder="Search item..."
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #cbd5e1',
                            borderRadius: 4,
                            fontSize: 12,
                            width: 140
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Table with RoomG dark header (Frame 0200) */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#1e293b', color: '#ffffff' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'center', width: 60, fontWeight: 700 }}>S.No</th>
                          <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700 }}>Item Name</th>
                          <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700 }}>Stock In</th>
                          <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700 }}>Stock Out</th>
                          <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700 }}>Closing Stock</th>
                          <th style={{ padding: '8px 14px', textAlign: 'center', width: 90, fontWeight: 700 }}>Audit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                              No items recorded in this godown.
                            </td>
                          </tr>
                        ) : (
                          filteredRows.map((row, idx) => {
                            const isNeg = row.closingStock < 0;
                            return (
                              <tr
                                key={idx}
                                style={{
                                  borderBottom: '1px solid #f1f5f9',
                                  background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                                  transition: 'background 0.15s'
                                }}
                              >
                                <td style={{ padding: '7px 12px', textAlign: 'center', color: '#64748b' }}>{row.sNo}</td>
                                <td style={{ padding: '7px 14px', fontWeight: 700, color: '#0f172a' }}>
                                  {row.itemName}
                                </td>
                                <td style={{ padding: '7px 14px', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                                  {row.stockIn}
                                </td>
                                <td style={{ padding: '7px 14px', textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>
                                  {row.stockOut}
                                </td>
                                <td style={{ padding: '7px 14px', textAlign: 'right' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '2px 8px',
                                      borderRadius: 4,
                                      fontWeight: 800,
                                      background: isNeg ? '#fee2e2' : '#dcfce7',
                                      color: isNeg ? '#b91c1c' : '#15803d'
                                    }}
                                  >
                                    {row.closingStock}
                                  </span>
                                </td>
                                <td style={{ padding: '7px 14px', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenItemAudit(row.itemName)}
                                    title="View detailed stock movements, inward bills and transfers"
                                    style={{
                                      background: '#f1f5f9',
                                      border: '1px solid #cbd5e1',
                                      padding: '2px 6px',
                                      borderRadius: 3,
                                      fontSize: 10,
                                      cursor: 'pointer',
                                      fontWeight: 700,
                                      color: '#2563eb'
                                    }}
                                  >
                                    🔍 Ledger
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {/* Footer Row matching RoomG (Frames 0200, 0230, 0240) */}
                      <tfoot>
                        <tr style={{ background: '#0f172a', color: '#ffffff', fontWeight: 800 }}>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>Total</td>
                          <td style={{ padding: '8px 14px' }}>Total Items = {filteredRows.length}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', color: '#4ade80' }}>{totalIn}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', color: '#f87171' }}>{totalOut}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                            <span style={{ color: totalClosing < 0 ? '#f87171' : '#4ade80' }}>
                              {totalClosing}
                            </span>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Consolidated Item-Wise Stock (/inventories Frame 0210) */}
        {activeTab === 'consolidated' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {/* Top Bar matching Frame 0210 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                background: '#f8fafc',
                padding: '12px 16px',
                borderRadius: 6,
                border: '1px solid #e2e8f0',
                marginBottom: 16
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {onOpenPurchase && (
                  <button
                    type="button"
                    onClick={onOpenPurchase}
                    style={{
                      background: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    New Purchase
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('store_wise')}
                  style={{
                    background: '#1e293b',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Purchase Register
                </button>
              </div>

              {/* RoomG export toolbar + search "W" (Frame 0210) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={handleCopyConsolidated}
                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: '#ffffff', border: 'none', borderRight: '1px solid #cbd5e1', cursor: 'pointer' }}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCsvConsolidated}
                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: '#ffffff', border: 'none', borderRight: '1px solid #cbd5e1', cursor: 'pointer' }}
                  >
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCsvConsolidated}
                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: '#ffffff', border: 'none', borderRight: '1px solid #cbd5e1', cursor: 'pointer' }}
                  >
                    Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: '#ffffff', border: 'none', borderRight: '1px solid #cbd5e1', cursor: 'pointer' }}
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, background: '#ffffff', border: 'none', cursor: 'pointer' }}
                  >
                    Print
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Search:</label>
                  <input
                    type="text"
                    value={consolidatedSearch}
                    onChange={e => setConsolidatedSearch(e.target.value)}
                    placeholder="Search by name, barcode..."
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #cbd5e1',
                      borderRadius: 4,
                      fontSize: 12,
                      width: 180
                    }}
                  />
                  {consolidatedSearch && (
                    <button
                      type="button"
                      onClick={() => setConsolidatedSearch('')}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 800 }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Consolidated Table */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#1e293b', color: '#ffffff' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'center', width: 60, fontWeight: 700 }}>S.No</th>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700 }}>Item Name</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Category</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Stock In</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Stock Out</th>
                      <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700 }}>Closing Stock</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Cost Rate</th>
                      <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700 }}>Valuation</th>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700 }}>Godown Breakdown</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consolidatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                          No matching inventory items found.
                        </td>
                      </tr>
                    ) : (
                      consolidatedRows.map((row, idx) => {
                        const isNeg = row.totalClosingStock < 0;
                        const isLow = row.status === 'Low Stock';
                        return (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                            }}
                          >
                            <td style={{ padding: '7px 12px', textAlign: 'center', color: '#64748b' }}>{row.sNo}</td>
                            <td style={{ padding: '7px 14px', fontWeight: 700, color: '#0f172a' }}>
                              <a
                                href="#audit"
                                onClick={e => { e.preventDefault(); handleOpenItemAudit(row.itemName); }}
                                style={{ color: '#0284c7', textDecoration: 'none' }}
                                title="Click to view full stock movement audit"
                              >
                                {row.itemName}
                              </a>
                            </td>
                            <td style={{ padding: '7px 12px', color: '#64748b' }}>{row.category}</td>
                            <td style={{ padding: '7px 12px', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                              {row.totalStockIn}
                            </td>
                            <td style={{ padding: '7px 12px', textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>
                              {row.totalStockOut}
                            </td>
                            <td style={{ padding: '7px 14px', textAlign: 'right' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontWeight: 800,
                                  background: isNeg ? '#fee2e2' : isLow ? '#fef3c7' : '#dcfce7',
                                  color: isNeg ? '#b91c1c' : isLow ? '#b45309' : '#15803d'
                                }}
                              >
                                {row.totalClosingStock}
                              </span>
                            </td>
                            <td style={{ padding: '7px 12px', textAlign: 'right', color: '#475569' }}>
                              ₹{row.purchaseRate}
                            </td>
                            <td style={{ padding: '7px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                              ₹{row.totalValuation.toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '7px 14px' }}>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {row.godownBreakdown.map((gb, gIdx) => (
                                  <span
                                    key={gIdx}
                                    style={{
                                      fontSize: 10,
                                      background: '#f1f5f9',
                                      border: '1px solid #cbd5e1',
                                      padding: '1px 5px',
                                      borderRadius: 3,
                                      color: gb.closingStock < 0 ? '#b91c1c' : '#334155'
                                    }}
                                  >
                                    <strong>{gb.godownName}:</strong> {gb.closingStock}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{ padding: '7px 12px', textAlign: 'center' }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: 3,
                                  background: isNeg ? '#fee2e2' : isLow ? '#fef3c7' : '#dcfce7',
                                  color: isNeg ? '#b91c1c' : isLow ? '#b45309' : '#15803d'
                                }}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* Exact Frame 0210 Footer Row */}
                  <tfoot>
                    <tr style={{ background: '#0f172a', color: '#ffffff', fontWeight: 800 }}>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>Total</td>
                      <td colSpan={2} style={{ padding: '10px 14px' }}>Total Item = {totalItemsCount}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#4ade80' }}>{totalStockInAll}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#f87171' }}>{totalStockOutAll}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <span style={{ color: totalClosingStockAll < 0 ? '#f87171' : '#4ade80' }}>
                          {totalClosingStockAll}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#94a3b8' }}>Valuation</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#38bdf8' }}>
                        ₹{totalValuationAll.toLocaleString('en-IN')}
                      </td>
                      <td colSpan={2} style={{ padding: '10px 14px', fontSize: 11, color: '#94a3b8' }}>
                        Consolidated Across All Godowns
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Stock Transfer & Inward Flow Simulator */}
        {activeTab === 'simulator' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div
              style={{
                maxWidth: 900,
                margin: '0 auto',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: 24,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: 12, marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                  Video 34 Canonical Inventory Demonstration &amp; Multi-Godown Lifecycle
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                  Walk through the exact 3-step live scenario demonstrated by the speaker: Purchase Inward to Top Floor STORE1 &rarr; Transfer to Main Store &rarr; Issue to Housekeeping.
                </p>
              </div>

              {simSuccessMsg && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    color: '#166534',
                    padding: '10px 16px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 20
                  }}
                >
                  {simSuccessMsg}
                </div>
              )}

              {/* Progress Steps Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: simStep >= 1 ? 1 : 0.5 }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: simStep >= 1 ? '#2563eb' : '#cbd5e1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
                    1
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>Purchase Inward</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>100 pcs to STORE1</div>
                  </div>
                </div>

                <div style={{ flex: 1, height: 2, background: simStep >= 2 ? '#2563eb' : '#e2e8f0', margin: '0 12px' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: simStep >= 2 ? 1 : 0.5 }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: simStep >= 2 ? '#2563eb' : '#cbd5e1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
                    2
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>Stock Transfer</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>STORE1 &rarr; Main Store (40 pcs)</div>
                  </div>
                </div>

                <div style={{ flex: 1, height: 2, background: simStep >= 3 ? '#2563eb' : '#e2e8f0', margin: '0 12px' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: simStep >= 3 ? 1 : 0.5 }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: simStep >= 3 ? '#2563eb' : '#cbd5e1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
                    3
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>Stock Issue</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>Main Store &rarr; Consume (50 pcs)</div>
                  </div>
                </div>
              </div>

              {/* Step Forms */}
              {simStep === 1 && (
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                    Step 1: Purchase Inward (Frame 0140 /purchases/create)
                  </h4>
                  <p style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>
                    Gupta Jii delivers 100 bottles of packaged water directly to <strong>STORE1 (Top Floor Godown)</strong> at ₹15 per bottle.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Destination Godown:</label>
                      <input type="text" readOnly value="STORE1" style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f1f5f9', fontWeight: 700 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Vendor / Account:</label>
                      <input type="text" readOnly value="GUPTA JII" style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f1f5f9', fontWeight: 700 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Bill No:</label>
                      <input type="text" readOnly value="4334" style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f1f5f9', fontWeight: 700 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Quantity (Pieces):</label>
                      <input
                        type="number"
                        value={simPurchaseQty}
                        onChange={e => setSimPurchaseQty(Number(e.target.value))}
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Cost Rate (₹):</label>
                      <input
                        type="number"
                        value={simPurchaseRate}
                        onChange={e => setSimPurchaseRate(Number(e.target.value))}
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontWeight: 700 }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimStep1Purchase}
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Execute Inward &rarr; Save to STORE1
                  </button>
                </div>
              )}

              {simStep === 2 && (
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                    Step 2: Inter-Store Stock Transfer (Frame 0180 /stocktransfers/create)
                  </h4>
                  <p style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>
                    Hotel moves 40 bottles from <strong>STORE1</strong> down to <strong>Main Store</strong> for operational guest dining availability.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>From Godown:</label>
                      <input type="text" readOnly value="STORE1" style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f1f5f9', fontWeight: 700 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>To Godown:</label>
                      <input type="text" readOnly value="Main Store" style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f1f5f9', fontWeight: 700 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Transfer Qty (Pcs):</label>
                      <input
                        type="number"
                        value={simTransferQty}
                        onChange={e => setSimTransferQty(Number(e.target.value))}
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontWeight: 700 }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimStep2Transfer}
                    style={{
                      background: '#0d9488',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Execute Stock Transfer &rarr; Move to Main Store
                  </button>
                </div>
              )}

              {simStep === 3 && (
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                    Step 3: Internal Hotel Consumption Issue
                  </h4>
                  <p style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>
                    Issue 50 bottles from <strong>Main Store</strong> to <strong>Consume Godown</strong> for room amenities and housekeeping.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>From Godown:</label>
                      <input type="text" readOnly value="Main Store" style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f1f5f9', fontWeight: 700 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Destination Department:</label>
                      <input type="text" readOnly value="Consume (Housekeeping)" style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4, background: '#f1f5f9', fontWeight: 700 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Issue Quantity:</label>
                      <input
                        type="number"
                        value={simIssueQty}
                        onChange={e => setSimIssueQty(Number(e.target.value))}
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontWeight: 700 }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimStep3Issue}
                    style={{
                      background: '#b45309',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Authorize Consumption Issue
                  </button>
                </div>
              )}

              {simStep === 4 && (
                <div style={{ background: '#f0fdf4', padding: 24, borderRadius: 6, border: '1px solid #bbf7d0', textAlign: 'center' }}>
                  <span style={{ fontSize: 36 }}>🎉</span>
                  <h4 style={{ margin: '8px 0', fontSize: 16, fontWeight: 800, color: '#15803d' }}>
                    Multi-Godown Lifecycle Simulation Complete!
                  </h4>
                  <p style={{ fontSize: 12, color: '#166534', maxWidth: 500, margin: '0 auto 16px' }}>
                    All quantities have been automatically posted and reconciled across STORE1, Main Store, and Consume godowns. Check the Store Wise Stock or Consolidated reports to see live totals!
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('store_wise')}
                      style={{
                        background: '#15803d',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      View Store Wise Stock
                    </button>
                    <button
                      type="button"
                      onClick={handleResetSimulator}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        padding: '8px 16px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Restart Simulation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Hotel Linen & Asset Anti-Theft Ledger (Video 34 lines 17-18) */}
        {activeTab === 'linen_assets' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {/* Context Notice */}
            <div
              style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1px solid #93c5fd',
                borderRadius: 6,
                padding: '12px 18px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e40af' }}>
                  🛡️ Hotel Operational Asset, Linen (Chadar) &amp; Appliance Auditing
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#1e3a8a' }}>
                  Tracks circulating hotel inventory: White Bedsheets (Chadar), Bath Towels, Smart TVs, and Electric Kettles between Rooms, Linen Store, Laundry, and Repair. Stops inventory pilferage and shrinkage.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  value={assetSearch}
                  onChange={e => setAssetSearch(e.target.value)}
                  placeholder="Search linen / assets..."
                  style={{
                    padding: '5px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 4,
                    fontSize: 12,
                    background: '#ffffff'
                  }}
                />
              </div>
            </div>

            {/* Asset Table */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#1e293b', color: '#ffffff' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Asset / Linen Name</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Category</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Total Owned</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>In Rooms</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Linen Store</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>In Laundry</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Damaged/Repair</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Discrepancy (Missing)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Unit Cost</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700 }}>Audit Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetRecords
                      .filter(a => !assetSearch.trim() || a.assetName.toLowerCase().includes(assetSearch.toLowerCase().trim()))
                      .map((rec, idx) => {
                        const hasDiscrepancy = rec.missingDiscrepancy > 0;
                        return (
                          <tr
                            key={rec.id}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                            }}
                          >
                            <td style={{ padding: '8px 12px', fontWeight: 800, color: '#0f172a' }}>
                              {rec.assetName}
                            </td>
                            <td style={{ padding: '8px 10px', color: '#64748b' }}>
                              <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 3, fontSize: 10, fontWeight: 700 }}>
                                {rec.category}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                              {rec.totalPurchased} {rec.unit}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#2563eb', fontWeight: 600 }}>
                              {rec.inRooms}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#0d9488', fontWeight: 600 }}>
                              {rec.inLinenStore}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#b45309', fontWeight: 600 }}>
                              {rec.inLaundry}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b' }}>
                              {rec.inDamagedRepair}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontWeight: 800,
                                  background: hasDiscrepancy ? '#fee2e2' : '#dcfce7',
                                  color: hasDiscrepancy ? '#b91c1c' : '#15803d'
                                }}
                              >
                                {rec.missingDiscrepancy === 0 ? '✓ Reconciled' : `⚠️ -${rec.missingDiscrepancy} pcs (₹${rec.missingDiscrepancy * rec.unitCost})`}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: '#475569' }}>
                              ₹{rec.unitCost}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontSize: 11 }}>
                              {rec.lastAuditDate}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Drilldown Modal: Stock Movement Audit Ledger */}
        {selectedItemAudit && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
            onClick={() => setSelectedItemAudit(null)}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: 8,
                width: '100%',
                maxWidth: 850,
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div
                style={{
                  background: '#0f172a',
                  color: '#fff',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>
                    Stock Movement Audit &bull; {selectedItemAudit}
                  </h3>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    Chronological Ledger of Inward Purchases, Inter-Store Transfers &amp; Consumption Outward
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItemAudit(null)}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', fontWeight: 800 }}
                >
                  ✕
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Ref Voucher</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Godown</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Qty In</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Qty Out</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Balance</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditMovements.map((mov, mIdx) => (
                      <tr key={mov.id || mIdx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px', color: '#64748b' }}>{mov.date}</td>
                        <td style={{ padding: '8px' }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: 3,
                              background: mov.qtyIn > 0 ? '#dcfce7' : '#fee2e2',
                              color: mov.qtyIn > 0 ? '#15803d' : '#b91c1c'
                            }}
                          >
                            {mov.type}
                          </span>
                        </td>
                        <td style={{ padding: '8px', fontWeight: 700, color: '#0f172a' }}>{mov.referenceNo}</td>
                        <td style={{ padding: '8px', color: '#0284c7' }}>
                          {mov.godown} {mov.toGodown ? `➔ ${mov.toGodown}` : ''}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>
                          {mov.qtyIn > 0 ? `+${mov.qtyIn}` : '-'}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>
                          {mov.qtyOut > 0 ? `-${mov.qtyOut}` : '-'}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          {mov.balance}
                        </td>
                        <td style={{ padding: '8px', color: '#64748b', fontSize: 11 }}>{mov.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 18px', borderTop: '1px solid #cbd5e1', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => setSelectedItemAudit(null)}
                  style={{
                    background: '#1e293b',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Close Ledger
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
