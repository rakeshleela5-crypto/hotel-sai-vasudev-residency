import React, { useState, useEffect } from 'react';
import type {
  PmsLiquorUnit,
  PmsLiquorBrand,
  PmsLiquorItem,
  PmsBrandWiseLiquorStock,
  PmsBarInvoice,
  PmsBarBillItem
} from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';
import './pmsStyles.css';

interface LiquorBarManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTableDashboard?: () => void;
}

export const LiquorBarManagementModal: React.FC<LiquorBarManagementModalProps> = ({
  isOpen,
  onClose,
  onOpenTableDashboard
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'billing' | 'items' | 'masters' | 'purchase'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data state
  const [stocks, setStocks] = useState<PmsBrandWiseLiquorStock[]>([]);
  const [items, setItems] = useState<PmsLiquorItem[]>([]);
  const [brands, setBrands] = useState<PmsLiquorBrand[]>([]);
  const [units, setUnits] = useState<PmsLiquorUnit[]>([]);
  const [invoices, setInvoices] = useState<PmsBarInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<PmsBarInvoice | null>(null);

  // New Item State
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemBrand, setNewItemBrand] = useState('Blander Spride');
  const [newItemBarcode, setNewItemBarcode] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'Liquor' | 'Beer' | 'Wine' | 'Whisky' | 'Vodka' | 'Rum'>('Liquor');
  const [newItemMrp, setNewItemMrp] = useState(230);
  const [newItemRate, setNewItemRate] = useState(230);
  const [newItemPurchaseRate, setNewItemPurchaseRate] = useState(16);
  const [newItemUnit, setNewItemUnit] = useState('30 ml');
  const [newItemConversion, setNewItemConversion] = useState(30);

  // Purchase Inward State (Frame 0320)
  const [purchaseGodown, setPurchaseGodown] = useState('STORE1');
  const [purchaseSupplier, setPurchaseSupplier] = useState('Genral Supplier');
  const [purchaseBillNo, setPurchaseBillNo] = useState('108');
  const [purchaseBrand, setPurchaseBrand] = useState('Blander Spride');
  const [purchaseBottleQty, setPurchaseBottleQty] = useState(20);
  const [purchaseRate, setPurchaseRate] = useState(400);
  const [purchaseSuccessToast, setPurchaseSuccessToast] = useState<string | null>(null);

  // POS Billing State (Frame 0260)
  const [posTableNo, setPosTableNo] = useState('T-11');
  const [posKotNo, setPosKotNo] = useState('425');
  const [posGuestName, setPosGuestName] = useState('Guest (Table T-11)');
  const [posGuestMobile, setPosGuestMobile] = useState('');
  const [posSelectedItemId, setPosSelectedItemId] = useState('');
  const [posItemQty, setPosItemQty] = useState(1);
  const [posCurrentItems, setPosCurrentItems] = useState<PmsBarBillItem[]>([
    {
      sNo: 1,
      itemId: 'food-bp',
      itemName: 'bread pakoda',
      category: 'Food',
      qty: 6,
      rate: 100,
      amount: 600,
      discountPercentage: 0,
      discountAmount: 0,
      taxableAmount: 600,
      gstPercentage: 5,
      gstAmount: 30,
      vatPercentage: 0,
      vatAmount: 0,
      surchargePercentage: 0,
      surchargeAmount: 0,
      totalValue: 630,
      unit: 'Plate',
      mlConsumed: 0
    },
    {
      sNo: 2,
      itemId: 'food-cb',
      itemName: 'Chiken Biryani',
      category: 'Food',
      qty: 5,
      rate: 90,
      amount: 450,
      discountPercentage: 0,
      discountAmount: 0,
      taxableAmount: 450,
      gstPercentage: 0,
      gstAmount: 0,
      vatPercentage: 0,
      vatAmount: 0,
      surchargePercentage: 0,
      surchargeAmount: 0,
      totalValue: 450,
      unit: 'Plate',
      mlConsumed: 0
    },
    {
      sNo: 3,
      itemId: 'liq-10070',
      itemName: 'Blender Spride (30Ml)',
      brandName: 'Blander Spride',
      category: 'Liquor',
      qty: 5,
      rate: 230,
      amount: 1150,
      discountPercentage: 0,
      discountAmount: 0,
      taxableAmount: 1150,
      gstPercentage: 0,
      gstAmount: 0,
      vatPercentage: 13,
      vatAmount: 149.50,
      surchargePercentage: 10,
      surchargeAmount: 14.95,
      totalValue: 1314.45,
      unit: '30 ml',
      mlConsumed: 150
    }
  ]);

  const loadData = () => {
    setStocks(PmsStore.getBrandWiseLiquorStocks());
    setItems(PmsStore.getLiquorItems());
    setBrands(PmsStore.getLiquorBrands());
    setUnits(PmsStore.getLiquorUnits());
    const invs = PmsStore.getBarInvoices();
    setInvoices(invs);
    if (!selectedInvoice && invs.length > 0) {
      setSelectedInvoice(invs[0]);
    }

    hotelApi.getLiquorStocks()
      .then(cloudStocks => {
        if (Array.isArray(cloudStocks) && cloudStocks.length > 0) {
          const mapped: PmsBrandWiseLiquorStock[] = cloudStocks.map((cs: any) => ({
            brand: cs.brand,
            bottleMl: cs.bottle_size_ml || 750,
            stockInMl: (Number(cs.opening_bottles || 0) + Number(cs.received_bottles || 0)) * (cs.bottle_size_ml || 750),
            stockOutMl: 0,
            closingMl: Number(cs.closing_bottles || 0) * (cs.bottle_size_ml || 750),
            closingBottel: Number(cs.closing_bottles || 0),
            lastUpdated: cs.updated_at || new Date().toISOString()
          }));
          PmsStore.syncLiquorStocks(mapped);
          setStocks(mapped);
        }
      })
      .catch(e => console.warn('[LiquorBarManagementModal] Cloud stocks fetch note:', e));

    hotelApi.getLiquorItems()
      .then(cloudItems => {
        if (Array.isArray(cloudItems) && cloudItems.length > 0) {
          PmsStore.syncLiquorItems(cloudItems);
          setItems(cloudItems);
        }
      })
      .catch(e => console.warn('[LiquorBarManagementModal] Cloud items fetch note:', e));
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      const unsub = PmsStore.subscribe(() => {
        setStocks(PmsStore.getBrandWiseLiquorStocks());
        setItems(PmsStore.getLiquorItems());
        setInvoices(PmsStore.getBarInvoices());
      });
      return () => unsub();
    }
  }, [isOpen]);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleCopyStocks = () => {
    const filtered = stocks.filter(s => s.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    const text = filtered
      .map((s, idx) => `${idx + 1}\t${s.brand}\t${s.bottleMl || 750} ML\t${s.stockInMl} ML\t${s.stockOutMl} ML\t${s.closingMl} ML\t${s.closingBottel} Btls`)
      .join('\n');
    navigator.clipboard.writeText(`S.No\tBrand Name\tBottle Size\tStock In ML\tStock Out ML\tClosing ML\tClosing Bottles\n${text}`);
    alert('Stock ledger copied to clipboard!');
  };

  const handleExportCsv = () => {
    const headers = ['S.No', 'Brand Name', 'Bottle Size (ML)', 'Stock In (ML)', 'Stock Out (ML)', 'Closing (ML)', 'Closing (Bottles)'];
    const filtered = stocks.filter(s => s.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    const rows = filtered.map((s, idx) => [
      idx + 1,
      `"${s.brand}"`,
      s.bottleMl || 750,
      s.stockInMl,
      s.stockOutMl,
      s.closingMl,
      s.closingBottel
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bar_Liquor_Excise_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportItemRegister = () => {
    const headers = ['S.No', 'Item Name', 'Brand', 'Barcode', 'Group', 'Rate', 'MRP', 'Purchase Rate', 'Unit', 'Conversion (ML)', 'VAT %', 'Surcharge %'];
    const rows = items.map(i => [
      i.sNo,
      `"${i.name}"`,
      `"${i.brandName}"`,
      `"${i.barcodeNo}"`,
      `"${i.group}"`,
      i.rate,
      i.mrp,
      i.purchaseRate,
      `"${i.unit}"`,
      i.conversionMl,
      i.vatPercentage,
      i.surchargePercentage
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bar_Liquor_Item_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            parsed.forEach(p => PmsStore.saveLiquorItem(p));
            loadData();
            alert(`Successfully imported ${parsed.length} liquor items!`);
          }
        } else {
          const lines = content.split('\n').filter(l => l.trim().length > 0);
          let imported = 0;
          const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;
          for (let i = startIndex; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
            if (cols.length >= 2 && (cols[1] || cols[0])) {
              const newItem: PmsLiquorItem = {
                id: `lq-imp-${Date.now()}-${i}`,
                sNo: items.length + imported + 1,
                name: cols[1] || cols[0],
                brandName: cols[2] || 'Imported Brand',
                barcodeNo: cols[3] || String(10080 + imported),
                group: 'Liquor',
                headGroup: 'Restaurant_Item',
                mrp: Number(cols[5]) || 250,
                rate: Number(cols[5]) || 250,
                purchaseRate: Number(cols[6]) || 20,
                unit: cols[7] || '30 ml',
                conversionMl: Number(cols[8]) || 30,
                taxType: 'VAT 13%',
                vatPercentage: 13,
                surchargePercentage: 10,
                active: true
              };
              PmsStore.saveLiquorItem(newItem);
              imported++;
            }
          }
          loadData();
          alert(`Imported ${imported} items successfully from ${file.name}!`);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse import file. Please upload valid CSV or JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleAddNewUnit = () => {
    const primaryUnit = window.prompt('Enter Primary Unit Name (e.g. 750 ML Bottle, 375 ML Half, 650 ML Beer):');
    if (!primaryUnit) return;
    const conversionStr = window.prompt('Enter ML Conversion factor (e.g. 750, 375, 650):', '750');
    const conversion = Number(conversionStr) || 750;
    const altUnit = window.prompt('Enter Alternate Unit Name:', 'ML') || 'ML';
    
    PmsStore.saveLiquorUnit({
      id: `unit-${Date.now()}`,
      sNo: units.length + 1,
      primaryUnitName: primaryUnit.trim(),
      conversion,
      alternateUnitName: altUnit.trim()
    });
    loadData();
    alert(`Unit "${primaryUnit}" created.`);
  };

  const handleAddNewCompany = () => {
    const compName = window.prompt('Enter Liquor Brand / Company Name:');
    if (!compName) return;
    const disStr = window.prompt('Enter standard discount % (optional):', '0');
    const dis = Number(disStr) || 0;
    
    PmsStore.saveLiquorBrand({
      id: `brand-${Date.now()}`,
      sNo: brands.length + 1,
      name: compName.trim(),
      discountPercentage: dis,
      status: 'ACTIVE'
    });
    loadData();
    alert(`Brand / Company "${compName}" saved.`);
  };

  if (!isOpen) return null;

  // POS Calculations matching Frame 0260
  const basicAmount = posCurrentItems.reduce((acc, itm) => acc + itm.amount, 0);
  const totalGst = posCurrentItems.reduce((acc, itm) => acc + itm.gstAmount, 0);
  const sgstAmount = Number((totalGst / 2).toFixed(2));
  const cgstAmount = Number((totalGst / 2).toFixed(2));
  const vatAmount = Number(posCurrentItems.reduce((acc, itm) => acc + itm.vatAmount, 0).toFixed(2));
  const surchargeAmount = Number(posCurrentItems.reduce((acc, itm) => acc + itm.surchargeAmount, 0).toFixed(2));
  const rawTotal = basicAmount + totalGst + vatAmount + surchargeAmount;
  const grandTotal = Math.round(rawTotal);
  const roundOff = Number((grandTotal - rawTotal).toFixed(2));
  const totalQuantity = posCurrentItems.reduce((acc, itm) => acc + itm.qty, 0);

  // Add Item to POS
  const handleAddItemToPos = () => {
    if (!posSelectedItemId) return;
    const found = items.find(i => i.id === posSelectedItemId);
    if (!found) return;

    const amount = found.rate * posItemQty;
    const vatAmt = Number(((amount * found.vatPercentage) / 100).toFixed(2));
    const surAmt = Number(((vatAmt * found.surchargePercentage) / 100).toFixed(2));
    const val = Number((amount + vatAmt + surAmt).toFixed(2));

    const newItem: PmsBarBillItem = {
      sNo: posCurrentItems.length + 1,
      itemId: found.id,
      itemName: found.name,
      brandName: found.brandName,
      category: 'Liquor',
      qty: posItemQty,
      rate: found.rate,
      amount,
      discountPercentage: 0,
      discountAmount: 0,
      taxableAmount: amount,
      gstPercentage: 0,
      gstAmount: 0,
      vatPercentage: found.vatPercentage,
      vatAmount: vatAmt,
      surchargePercentage: found.surchargePercentage,
      surchargeAmount: surAmt,
      totalValue: val,
      unit: found.unit,
      mlConsumed: found.conversionMl * posItemQty
    };

    setPosCurrentItems([...posCurrentItems, newItem]);
    setPosItemQty(1);
  };

  // Remove Item from POS
  const handleRemovePosItem = (idx: number) => {
    const updated = posCurrentItems.filter((_, i) => i !== idx).map((itm, i) => ({ ...itm, sNo: i + 1 }));
    setPosCurrentItems(updated);
  };

  // Save POS Bill (Frames 0260 & 0280)
  const handleSaveAndPrintBill = () => {
    if (posCurrentItems.length === 0) {
      alert('Please add at least 1 food or liquor item to generate bill.');
      return;
    }

    const now = new Date();
    const invoiceNo = `Res/${290 + invoices.length}/24-25`;
    const newInvoice: PmsBarInvoice = {
      billNo: invoiceNo,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tableNo: posTableNo,
      kotNo: posKotNo,
      serviceType: 'Table Service',
      guestName: posGuestName,
      guestMobile: posGuestMobile,
      remark: 'Liquor & Bar Table Order',
      isB2b: false,
      items: posCurrentItems,
      totalItems: posCurrentItems.length,
      totalQuantity,
      basicAmount,
      sgstAmount,
      cgstAmount,
      vatAmount,
      surchargeAmount,
      roundOff,
      grandTotal,
      settled: true,
      paymentMode: 'CASH',
      createdAt: now.toISOString()
    };

    PmsStore.saveBarInvoice(newInvoice);
    loadData();
    setSelectedInvoice(newInvoice);
    alert(`Bar & Restaurant Bill ${invoiceNo} generated successfully! Stock deducted in ML.`);
  };

  // Execute Purchase Inward (Frame 0320 & 0350)
  const handleExecutePurchaseInward = (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseBottleQty <= 0) {
      alert('Please enter valid bottle quantity.');
      return;
    }

    PmsStore.recordLiquorPurchaseInward(purchaseBrand, purchaseBottleQty, 750);
    loadData();
    const addedMl = purchaseBottleQty * 750;
    setPurchaseSuccessToast(`Purchase Bill #${purchaseBillNo} Recorded: ${purchaseBottleQty} Bottles (${addedMl.toLocaleString()} ML) added to ${purchaseBrand}! Stock ledger updated.`);
    setTimeout(() => setPurchaseSuccessToast(null), 5000);
  };

  // Create new liquor SKU item (Frame 0180)
  const handleCreateLiquorItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      alert('Please enter item name.');
      return;
    }

    const newItem: PmsLiquorItem = {
      id: `liq-${Date.now()}`,
      sNo: items.length + 1,
      name: newItemName.trim(),
      brandName: newItemBrand,
      barcodeNo: newItemBarcode || `${10070 + items.length}`,
      group: newItemCategory,
      headGroup: 'Restaurant_Item',
      mrp: newItemMrp,
      rate: newItemRate,
      purchaseRate: newItemPurchaseRate,
      unit: newItemUnit,
      conversionMl: newItemConversion,
      taxType: 'VAT 13%',
      vatPercentage: 13,
      surchargePercentage: 10,
      active: true
    };

    PmsStore.saveLiquorItem(newItem);
    loadData();
    setIsAddItemOpen(false);
    setNewItemName('');
    alert(`New Liquor SKU "${newItem.name}" saved with VAT 13% and Surcharge 10%!`);
  };

  // Total KPIs
  const totalStockMl = stocks.reduce((acc, s) => acc + s.closingMl, 0);
  const totalBottlesEqv = stocks.reduce((acc, s) => acc + s.closingBottel, 0);
  const totalOutflowMl = stocks.reduce((acc, s) => acc + s.stockOutMl, 0);

  return (
    <div className="pms-modal-overlay">
      <div 
        className="pms-modal-container"
        style={{
          maxWidth: 1200,
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
        {/* Top Header matching RoomG Video 32 */}
        <div 
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            padding: '12px 20px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>🍷</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#f8fafc' }}>
                  Liquor &amp; Bar Management Software
                </h2>
                <span style={{ background: '#dc2626', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>
                  Bar POS Live Demo
                </span>
                <span style={{ background: '#0284c7', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                  VAT 13% + SUR 10%
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                ML Conversion Inventory &bull; Peg &amp; Bottle Tracking &bull; Mixed Food &amp; Bar Billing &bull; Brand Wise Stock Ledger
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right', marginRight: 10 }}>
              <div style={{ fontSize: 10, color: '#64748b' }}>Technical Helpline (Hansin IT)</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8' }}>7999663696 / 8871702803</div>
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
        </div>

        {/* Navigation Tabs matching Video 32 Modules */}
        <div
          style={{
            background: '#1e293b',
            display: 'flex',
            borderBottom: '1px solid #334155',
            padding: '0 16px',
            overflowX: 'auto',
            gap: 4
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            style={{
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 700,
              background: activeTab === 'stock' ? '#0f172a' : 'transparent',
              color: activeTab === 'stock' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'stock' ? '2px solid #38bdf8' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>📊</span>
            <span>Brand-Wise Stock Ledger (/liqour_stock_brand_wise)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            style={{
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 700,
              background: activeTab === 'billing' ? '#0f172a' : 'transparent',
              color: activeTab === 'billing' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'billing' ? '2px solid #38bdf8' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>🧾</span>
            <span>Bar &amp; Table Billing POS</span>
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
            <span>🍾</span>
            <span>Liquor Item Master (/item)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('masters')}
            style={{
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 700,
              background: activeTab === 'masters' ? '#0f172a' : 'transparent',
              color: activeTab === 'masters' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'masters' ? '2px solid #38bdf8' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>⚙️</span>
            <span>Unit &amp; Brand Conversion Master (Frames 0120 &amp; 0150)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('purchase')}
            style={{
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 700,
              background: activeTab === 'purchase' ? '#0f172a' : 'transparent',
              color: activeTab === 'purchase' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'purchase' ? '2px solid #38bdf8' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>📥</span>
            <span>Liquor Purchase Inward</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#0f172a' }}>
          
          {/* TAB 1: Brand-Wise Stock Report (Frames 0300 & 0350) */}
          {activeTab === 'stock' && (
            <div>
              {/* KPI Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Bar Stock in ML</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                    {totalStockMl.toLocaleString()} <span style={{ fontSize: 14, color: '#94a3b8' }}>ML</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Physical liquid available across all brands</div>
                </div>

                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Closing Bottles (750ml Eqv)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                    {totalBottlesEqv.toFixed(1)} <span style={{ fontSize: 14, color: '#94a3b8' }}>Bottles</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Auto calculated from ML closing balance</div>
                </div>

                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Dispensed (Sales Outflow)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
                    {totalOutflowMl.toLocaleString()} <span style={{ fontSize: 14, color: '#94a3b8' }}>ML</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>~{Math.round(totalOutflowMl / 30)} Small Pegs (30ml) served</div>
                </div>

                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Tracked Brands</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#c084fc', marginTop: 4 }}>
                    {stocks.length} <span style={{ fontSize: 14, color: '#94a3b8' }}>Active Labels</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>State Excise &amp; VAT compliant ledger</div>
                </div>
              </div>

              {/* Action Toolbar matching Frame 0300 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={handleCopyStocks} style={{ background: '#334155', color: '#fff', border: '1px solid #475569', padding: '6px 12px', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    Copy
                  </button>
                  <button type="button" onClick={handleExportCsv} style={{ background: '#334155', color: '#fff', border: '1px solid #475569', padding: '6px 12px', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    CSV
                  </button>
                  <button type="button" onClick={handleExportCsv} style={{ background: '#334155', color: '#fff', border: '1px solid #475569', padding: '6px 12px', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    Excel
                  </button>
                  <button type="button" onClick={() => window.print()} style={{ background: '#334155', color: '#fff', border: '1px solid #475569', padding: '6px 12px', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    PDF
                  </button>
                  <button type="button" onClick={() => window.print()} style={{ background: '#334155', color: '#fff', border: '1px solid #475569', padding: '6px 12px', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    Print
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Search:</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Brand..."
                    style={{
                      background: '#1e293b',
                      border: '1px solid #475569',
                      color: '#f8fafc',
                      padding: '5px 10px',
                      borderRadius: 4,
                      fontSize: 12,
                      width: 180
                    }}
                  />
                </div>
              </div>

              {/* Exact Table from Frame 0300 & 0350 */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#0284c7', color: '#ffffff', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', borderRight: '1px solid #0369a1' }}>Brand</th>
                      <th style={{ padding: '10px 14px', borderRight: '1px solid #0369a1', textAlign: 'right' }}>stock In ML</th>
                      <th style={{ padding: '10px 14px', borderRight: '1px solid #0369a1', textAlign: 'right' }}>Stock Out ML</th>
                      <th style={{ padding: '10px 14px', borderRight: '1px solid #0369a1', textAlign: 'right' }}>Closing ML</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Closing Bottel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks
                      .filter(s => s.brand.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((row, idx) => (
                        <tr 
                          key={idx}
                          style={{
                            background: idx % 2 === 0 ? '#1e293b' : '#0f172a',
                            borderBottom: '1px solid #334155'
                          }}
                        >
                          <td style={{ padding: '10px 14px', fontWeight: 800, color: '#f8fafc', borderRight: '1px solid #334155' }}>
                            {row.brand}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#38bdf8', borderRight: '1px solid #334155' }}>
                            {row.stockInMl.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#f87171', borderRight: '1px solid #334155' }}>
                            {row.stockOutMl.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#34d399', borderRight: '1px solid #334155' }}>
                            {row.closingMl.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#fbbf24' }}>
                            {row.closingBottel.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Explanatory Rule Banner matching spoken Hindi narration */}
              <div style={{ marginTop: 16, background: '#1e293b', borderLeft: '4px solid #38bdf8', padding: '10px 14px', borderRadius: 4, fontSize: 12, color: '#cbd5e1' }}>
                <span style={{ fontWeight: 800, color: '#38bdf8' }}>💡 Beverage Billing Logic: </span>
                When 1 bottle of 750ml is purchased, 750 ML is added to <code style={{ color: '#fbbf24' }}>stock In ML</code>. When drinks are billed at tables/counters in 30ml small pegs or 60ml large pegs, the exact ML sold is automatically deducted. The closing stock dynamically displays both total remaining ML and bottle equivalent (e.g. 22,050 ML ÷ 750 = 29.4 Bottles).
              </div>
            </div>
          )}

          {/* TAB 2: Bar & Table Billing POS (Frames 0260 & 0280) */}
          {activeTab === 'billing' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
              {/* Left Column: POS Entry Table */}
              <div>
                {/* Order Top Bar matching Frame 0260 */}
                <div style={{ background: '#1e293b', padding: '12px 16px', borderRadius: 6, marginBottom: 16, border: '1px solid #334155' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Date</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={new Date().toLocaleDateString('en-GB')} 
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '4px 8px', fontSize: 12, borderRadius: 3 }} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Bill No</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={`Res/${290 + invoices.length}/24-25`} 
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#38bdf8', fontWeight: 700, padding: '4px 8px', fontSize: 12, borderRadius: 3 }} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Table No</label>
                      <select
                        value={posTableNo}
                        onChange={(e) => setPosTableNo(e.target.value)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '4px 8px', fontSize: 12, borderRadius: 3 }}
                      >
                        <option value="T-11">Table T-11 (Bar Lounge)</option>
                        <option value="T-1">Table T-1</option>
                        <option value="T-2">Table T-2</option>
                        <option value="T-4">Table T-4</option>
                        <option value="T-6">Table T-6</option>
                        <option value="T-7">Table T-7</option>
                        <option value="T-9">Table T-9</option>
                        <option value="T-14">Table T-14</option>
                        <option value="T-16">Table T-16</option>
                        <option value="Table NCC">Table NCC</option>
                        <option value="TakeAway A1">TakeAway A1</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>KOT No</label>
                      <input 
                        type="text" 
                        value={posKotNo} 
                        onChange={(e) => setPosKotNo(e.target.value)} 
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '4px 8px', fontSize: 12, borderRadius: 3 }} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Guest / Account</label>
                      <input 
                        type="text" 
                        value={posGuestName} 
                        onChange={(e) => setPosGuestName(e.target.value)} 
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '4px 8px', fontSize: 12, borderRadius: 3 }} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Guest Mobile</label>
                      <input 
                        type="text" 
                        value={posGuestMobile} 
                        onChange={(e) => setPosGuestMobile(e.target.value)} 
                        placeholder="Mobile No"
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '4px 8px', fontSize: 12, borderRadius: 3 }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Add Row */}
                <div style={{ background: '#1e293b', padding: '10px 16px', borderRadius: 6, marginBottom: 14, border: '1px solid #334155', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <select
                      value={posSelectedItemId}
                      onChange={(e) => setPosSelectedItemId(e.target.value)}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', padding: '6px 10px', fontSize: 12, borderRadius: 3 }}
                    >
                      <option value="">-- Select Liquor SKU or Food Item to Add --</option>
                      {items.map(itm => (
                        <option key={itm.id} value={itm.id}>
                          {itm.name} - ₹{itm.rate} ({itm.unit} | {itm.taxType} + SUR 10%)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: 80 }}>
                    <input
                      type="number"
                      min={1}
                      value={posItemQty}
                      onChange={(e) => setPosItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px 8px', fontSize: 12, borderRadius: 3, textAlign: 'center' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemToPos}
                    style={{
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 16px',
                      borderRadius: 3,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    + Add Item
                  </button>
                </div>

                {/* Frame 0260 Items Table */}
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, overflowX: 'auto', marginBottom: 14 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 640 }}>
                    <thead>
                      <tr style={{ background: '#0284c7', color: '#fff', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px', width: 35 }}>S.No</th>
                        <th style={{ padding: '8px 10px' }}>Item Name</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Qty</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Taxable</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>GST%</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>VAT%</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>SUR%</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Value</th>
                        <th style={{ padding: '8px 10px', width: 35 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posCurrentItems.map((itm, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? '#1e293b' : '#0f172a' }}>
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#94a3b8' }}>{itm.sNo}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: itm.category === 'Liquor' ? '#38bdf8' : '#f8fafc' }}>
                            {itm.itemName} {itm.category === 'Liquor' && <span style={{ fontSize: 9, background: '#0284c7', color: '#fff', padding: '1px 4px', borderRadius: 2 }}>BAR</span>}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{itm.qty.toFixed(2)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{itm.rate.toFixed(2)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{itm.amount.toFixed(2)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{itm.taxableAmount.toFixed(2)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: itm.gstPercentage > 0 ? '#4ade80' : '#64748b' }}>{itm.gstPercentage.toFixed(2)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: itm.vatPercentage > 0 ? '#f59e0b' : '#64748b', fontWeight: 700 }}>{itm.vatPercentage.toFixed(2)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: itm.surchargePercentage > 0 ? '#f87171' : '#64748b' }}>{itm.surchargePercentage.toFixed(2)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#34d399' }}>{itm.totalValue.toFixed(2)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemovePosItem(idx)}
                              style={{ background: '#dc2626', color: '#fff', border: 'none', width: 20, height: 20, borderRadius: 2, cursor: 'pointer', fontSize: 10 }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Action Bar */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setPosCurrentItems([])}
                    style={{ background: '#475569', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Clear Bill
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndPrintBill}
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 24px',
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    💾 Save &amp; Print Bill
                  </button>
                </div>
              </div>

              {/* Right Column: Calculations & Bill Preview matching Frame 0280 */}
              <div>
                {/* Yellow & Green Summary Boxes matching Frame 0280 */}
                <div style={{ background: '#dcfce7', color: '#065f46', padding: '12px 14px', borderRadius: '6px 6px 0 0', border: '1px solid #86efac' }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>Total Item = {posCurrentItems.length}.00</div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Total Qty = {totalQuantity}.00</div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Kot Nos = {posKotNo}</div>
                </div>

                <div style={{ background: '#fef9c3', color: '#713f12', padding: '14px', borderRadius: '0 0 6px 6px', border: '1px solid #fde047', borderTop: 'none', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Basic Amt:</span>
                    <span style={{ fontWeight: 700 }}>₹{basicAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>SGST Amt (Food 2.5%):</span>
                    <span>₹{sgstAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>CGST Amt (Food 2.5%):</span>
                    <span>₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#b45309', fontWeight: 800 }}>
                    <span>Vat Amt (Liquor 13%):</span>
                    <span>₹{vatAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#b45309', fontWeight: 800 }}>
                    <span>Sur Amt (Surcharge 10%):</span>
                    <span>₹{surchargeAmount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>Round Off:</span>
                    <span>₹{roundOff.toFixed(2)}</span>
                  </div>
                  <div style={{ borderTop: '2px dashed #ca8a04', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, color: '#854d0e' }}>
                    <span>Grand Total:</span>
                    <span>₹{grandTotal}</span>
                  </div>
                </div>

                {/* Print Invoice Button */}
                {selectedInvoice && (
                  <div style={{ marginTop: 14, background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: 12 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>Last Generated Invoice:</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8' }}>{selectedInvoice.billNo} ({selectedInvoice.tableNo})</div>
                    <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>Total: ₹{selectedInvoice.grandTotal} | {selectedInvoice.date}</div>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      style={{
                        marginTop: 10,
                        width: '100%',
                        background: '#0284c7',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      🖨️ Print Customer Invoice
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Liquor Item Master (Frames 0180 & 0210) */}
          {activeTab === 'items' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setIsAddItemOpen(true)}
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                  >
                    + Add New Item
                  </button>
                  <button
                    type="button"
                    onClick={handleExportItemRegister}
                    style={{ background: '#1e293b', color: '#fff', border: '1px solid #475569', padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    title="Export Complete Food & Beverage Item Register to CSV"
                  >
                    Register
                  </button>
                  <button
                    type="button"
                    onClick={handleImportClick}
                    style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                    title="Import items from CSV / JSON file"
                  >
                    Import
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileImport}
                    accept=".csv,.json"
                    style={{ display: 'none' }}
                  />
                </div>

                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  Showing {items.length} Liquor SKUs (Filtered from catalog)
                </div>
              </div>

              {/* Add New Item Modal Form (Frame 0180) */}
              {isAddItemOpen && (
                <div style={{ background: '#1e293b', border: '1px solid #38bdf8', borderRadius: 6, padding: 16, marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#38bdf8', fontWeight: 800 }}>
                    ➕ Edit / Add New Liquor Item
                  </h3>
                  <form onSubmit={handleCreateLiquorItem} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Item/Product Name *</label>
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="e.g. Royal Stag (30Ml)"
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px 10px', fontSize: 12, borderRadius: 3 }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Company / Brand</label>
                      <select
                        value={newItemBrand}
                        onChange={(e) => setNewItemBrand(e.target.value)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px 10px', fontSize: 12, borderRadius: 3 }}
                      >
                        {brands.map(b => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Barcode No</label>
                      <input
                        type="text"
                        value={newItemBarcode}
                        onChange={(e) => setNewItemBarcode(e.target.value)}
                        placeholder="10080"
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px 10px', fontSize: 12, borderRadius: 3 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Group</label>
                      <select
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value as any)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px 10px', fontSize: 12, borderRadius: 3 }}
                      >
                        <option value="Liquor">Liquor</option>
                        <option value="Beer">Beer</option>
                        <option value="Whisky">Whisky</option>
                        <option value="Vodka">Vodka</option>
                        <option value="Rum">Rum</option>
                        <option value="Wine">Wine</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>MRP (₹)</label>
                      <input
                        type="number"
                        value={newItemMrp}
                        onChange={(e) => setNewItemMrp(parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px 10px', fontSize: 12, borderRadius: 3 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Sale Rate (₹)</label>
                      <input
                        type="number"
                        value={newItemRate}
                        onChange={(e) => setNewItemRate(parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px 10px', fontSize: 12, borderRadius: 3 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Purchase Rate (₹)</label>
                      <input
                        type="number"
                        value={newItemPurchaseRate}
                        onChange={(e) => setNewItemPurchaseRate(parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px 10px', fontSize: 12, borderRadius: 3 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Unit</label>
                      <select
                        value={newItemUnit}
                        onChange={(e) => {
                          setNewItemUnit(e.target.value);
                          const u = units.find(x => x.primaryUnitName === e.target.value);
                          if (u) setNewItemConversion(u.conversion);
                        }}
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px 10px', fontSize: 12, borderRadius: 3 }}
                      >
                        {units.map(u => (
                          <option key={u.id} value={u.primaryUnitName}>{u.primaryUnitName} (Conv: {u.conversion} ML)</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Tax System</label>
                      <input
                        type="text"
                        readOnly
                        value="VAT 13% + SUR 10%"
                        style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#38bdf8', fontWeight: 700, padding: '6px 10px', fontSize: 12, borderRadius: 3 }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                      <button
                        type="button"
                        onClick={() => setIsAddItemOpen(false)}
                        style={{ background: '#475569', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 20px', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                      >
                        Update / Save Item
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Items Table matching Frame 0210 */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: '#0284c7', color: '#fff', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', width: 40 }}>S.No</th>
                      <th style={{ padding: '8px 10px' }}>Item Name</th>
                      <th style={{ padding: '8px 10px' }}>Company</th>
                      <th style={{ padding: '8px 10px' }}>Barcode</th>
                      <th style={{ padding: '8px 10px' }}>Group</th>
                      <th style={{ padding: '8px 10px' }}>Head Group</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>MRP</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: '8px 10px' }}>Unit</th>
                      <th style={{ padding: '8px 10px' }}>GST/TAX%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid #334155', background: row.sNo % 2 === 0 ? '#1e293b' : '#0f172a' }}>
                        <td style={{ padding: '8px 10px', color: '#94a3b8', textAlign: 'center' }}>{row.sNo}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 800, color: '#f8fafc' }}>{row.name}</td>
                        <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{row.brandName}</td>
                        <td style={{ padding: '8px 10px', color: '#38bdf8', fontFamily: 'monospace' }}>{row.barcodeNo}</td>
                        <td style={{ padding: '8px 10px', color: '#f59e0b' }}>{row.group}</td>
                        <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{row.headGroup}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{row.mrp}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#34d399' }}>₹{row.rate}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#c084fc' }}>{row.unit}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 800, color: '#f87171' }}>{row.taxType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Unit & Brand Conversion Master (Frames 0120 & 0150) */}
          {activeTab === 'masters' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Unit List (/units - Frame 0120) */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#38bdf8' }}>
                    Unit Master &amp; ML Conversion (/units)
                  </h3>
                  <button type="button" onClick={handleAddNewUnit} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    + Add New Unit
                  </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#0284c7', color: '#fff', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', width: 35 }}>S.No</th>
                      <th style={{ padding: '8px 10px' }}>Primary Unit Name</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Conversion</th>
                      <th style={{ padding: '8px 10px' }}>Alternate Unit Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((u, idx) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? '#1e293b' : '#0f172a' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: '#94a3b8' }}>{u.sNo}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#f8fafc' }}>{u.primaryUnitName}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#38bdf8' }}>{u.conversion}</td>
                        <td style={{ padding: '8px 10px', color: '#c084fc' }}>{u.alternateUnitName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Company / Brand List (/company - Frame 0150) */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#38bdf8' }}>
                    Company / Brand Master (/company)
                  </h3>
                  <button type="button" onClick={handleAddNewCompany} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    + Add New Company
                  </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#0284c7', color: '#fff', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', width: 35 }}>S.No</th>
                      <th style={{ padding: '8px 10px' }}>Company / Brand</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Dis %</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brands.map((b, idx) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? '#1e293b' : '#0f172a' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: '#94a3b8' }}>{b.sNo}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#f8fafc' }}>{b.name}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#94a3b8' }}>{b.discountPercentage}%</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <span style={{ background: '#065f46', color: '#6ee7b7', fontSize: 10, padding: '2px 6px', borderRadius: 2 }}>{b.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Liquor Purchase Inward */}
          {activeTab === 'purchase' && (
            <div style={{ maxWidth: 800, margin: '0 auto', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 24 }}>📥</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#f8fafc' }}>
                    Liquor Inward Purchase to Bar Godown
                  </h3>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    Recording bulk bottle purchases automatically updates ML stock in the brand ledger
                  </div>
                </div>
              </div>

              {purchaseSuccessToast && (
                <div style={{ background: '#065f46', color: '#6ee7b7', padding: '10px 14px', borderRadius: 4, marginBottom: 16, fontSize: 12, fontWeight: 700 }}>
                  ✓ {purchaseSuccessToast}
                </div>
              )}

              <form onSubmit={handleExecutePurchaseInward} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Destination Godown / Store</label>
                  <select
                    value={purchaseGodown}
                    onChange={(e) => setPurchaseGodown(e.target.value)}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px 10px', fontSize: 12, borderRadius: 3 }}
                  >
                    <option value="STORE1">STORE1 (Main Liquor Warehouse)</option>
                    <option value="BAR_COUNTER">BAR COUNTER (Dispensing Bar)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Distributor / Supplier</label>
                  <input
                    type="text"
                    value={purchaseSupplier}
                    onChange={(e) => setPurchaseSupplier(e.target.value)}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px 10px', fontSize: 12, borderRadius: 3 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Supplier Invoice / Bill No</label>
                  <input
                    type="text"
                    value={purchaseBillNo}
                    onChange={(e) => setPurchaseBillNo(e.target.value)}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#38bdf8', fontWeight: 700, padding: '6px 10px', fontSize: 12, borderRadius: 3 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Brand to Inward</label>
                  <select
                    value={purchaseBrand}
                    onChange={(e) => setPurchaseBrand(e.target.value)}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px 10px', fontSize: 12, borderRadius: 3 }}
                  >
                    {brands.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Purchased Bottle Qty (750ml bottles)</label>
                  <input
                    type="number"
                    min={1}
                    value={purchaseBottleQty}
                    onChange={(e) => setPurchaseBottleQty(parseInt(e.target.value) || 1)}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#10b981', fontWeight: 800, padding: '6px 10px', fontSize: 14, borderRadius: 3 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Purchase Rate per Bottle (₹)</label>
                  <input
                    type="number"
                    value={purchaseRate}
                    onChange={(e) => setPurchaseRate(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '6px 10px', fontSize: 12, borderRadius: 3 }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', background: '#0f172a', padding: 12, borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Liquid Volume Added:</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#38bdf8' }}>
                      {(purchaseBottleQty * 750).toLocaleString()} ML (approx. {purchaseBottleQty * 25} pegs of 30ml)
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Inward Bill Value:</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24' }}>
                      ₹{(purchaseBottleQty * purchaseRate).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    💾 Save Purchase Inward &amp; Update Stock Ledger
                  </button>
                </div>
              </form>
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
            <span>Hotel SRI SAI VASUDEV RESIDENCY &bull; Bar &amp; Beverage Management</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {onOpenTableDashboard && (
              <button
                type="button"
                onClick={onOpenTableDashboard}
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
                🍽️ Open Restaurant/Bar Table Matrix
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
