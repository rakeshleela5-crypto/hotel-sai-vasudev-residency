import React, { useState, useMemo } from 'react';
import { PmsStore, INITIAL_MENU_ITEMS } from '../../services/pmsStore';
import type { KotItem, PmsKotRecord, PmsRoom, MenuItem } from '../../types/pmsModels';

interface KotEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRoomNo?: string;
  defaultTableNo?: string;
  defaultServiceType?: 'Room' | 'Restaurant' | 'Banquet';
  onKotSaved?: (kot: PmsKotRecord) => void;
}

const VASUDEV_CATEGORIES = [
  'All Categories',
  'Morning Breakfast (7:00 AM–10:30 AM)',
  'Sattvic & Jain Thalis',
  'Main Course Curries & Paneer',
  'Tandoor & Rotis',
  'South Indian Temple Classics',
  'Beverages & Prasadam Sweets'
];

const RESTAURANT_TABLES = [
  'Table T-1',
  'Table T-2',
  'Table T-3',
  'Table T-4',
  'Table T-5',
  'Table T-6',
  'Table T-7',
  'Table T-8',
  'VIP-1 AC Family Lounge',
  'VIP-2 AC Family Lounge',
  'VIP-3 AC Family Lounge',
  'VIP-4 AC Family Lounge',
  'Takeaway / Parcel Counter'
];

export const KotEntryModal: React.FC<KotEntryModalProps> = ({
  isOpen,
  onClose,
  defaultRoomNo,
  defaultTableNo,
  defaultServiceType,
  onKotSaved
}) => {
  const occupiedRooms = PmsStore.getRooms().filter(r => r.status === 'occupied');
  const allMenuItems = PmsStore.getMenuItems().length > 0 ? PmsStore.getMenuItems() : INITIAL_MENU_ITEMS;

  const initialRoom = occupiedRooms.find(r => r.roomNo === defaultRoomNo) || occupiedRooms[0] || ({
    roomNo: '101',
    roomType: 'Executive Deluxe',
    currentGuest: { name: 'Rajesh Sharma', phone: '9822114455' }
  } as PmsRoom);

  // Service Type & Destination
  const [serviceType, setServiceType] = useState<'Room' | 'Restaurant' | 'Banquet'>(
    defaultServiceType || (defaultRoomNo ? 'Room' : 'Restaurant')
  );
  const [selectedRoomNo, setSelectedRoomNo] = useState<string>(initialRoom.roomNo);
  const [selectedTableNo, setSelectedTableNo] = useState<string>(defaultTableNo || 'Table T-1');

  // Sequential KOT Number
  const [kotNo] = useState<string>(() => `KOT/${Math.floor(360 + Math.random() * 40)}/26-27`);
  const [kotRemark, setKotRemark] = useState<string>('Standard Service');

  // Category Filtering & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [menuSearch, setMenuSearch] = useState<string>('');

  // Pure Veg / Jain / Sattvic Modifiers Engine
  const [isJain, setIsJain] = useState<boolean>(false);
  const [isSattvic, setIsSattvic] = useState<boolean>(false);
  const [isLessSpicy, setIsLessSpicy] = useState<boolean>(false);
  const [chefInstructions, setChefInstructions] = useState<string>('');

  // CP Plan Breakfast Detection (7:00 AM - 10:30 AM)
  const isBreakfastWindow = (() => {
    const h = new Date().getHours();
    const m = new Date().getMinutes();
    const totalMins = h * 60 + m;
    return totalMins >= (7 * 60) && totalMins <= (10 * 60 + 30);
  })();

  const selectedRoomObj = occupiedRooms.find(r => r.roomNo === selectedRoomNo);
  const isCpRoom = Boolean(selectedRoomObj && (
    selectedRoomObj.roomType.toLowerCase().includes('premium') ||
    (selectedRoomObj.currentGuest as any)?.package?.toLowerCase().includes('cp') ||
    (selectedRoomObj.currentGuest as any)?.package?.toLowerCase().includes('breakfast')
  ));

  const [isCpBreakfast, setIsCpBreakfast] = useState<boolean>(isCpRoom);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Active Cart State (Module 3)
  const [cartItems, setCartItems] = useState<KotItem[]>([
    {
      sNo: 1,
      itemName: 'South Indian Filter Coffee (Chikmagalur Blend)',
      itemCode: 'BEV-106',
      qty: 2,
      rate: 70,
      amount: 140,
      isJain: true
    }
  ]);

  // Views & Settlement Sub-flows
  const [showSlipPreview, setShowSlipPreview] = useState<boolean>(false);
  const [showCounterBillModal, setShowCounterBillModal] = useState<boolean>(false);
  const [savedKotRecord, setSavedKotRecord] = useState<PmsKotRecord | null>(null);
  const [billReceiptRecord, setBillReceiptRecord] = useState<{
    billNo: string;
    orderType: string;
    destination: string;
    guestName: string;
    items: KotItem[];
    subtotal: number;
    cgst: number;
    sgst: number;
    grandTotal: number;
    paymentMode: string;
    timestamp: string;
  } | null>(null);

  const [counterPaymentMode, setCounterPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('UPI');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const currentGuestName = serviceType === 'Room'
    ? occupiedRooms.find(r => r.roomNo === selectedRoomNo)?.currentGuest?.name || 'In-House Guest'
    : `Dine-In (${selectedTableNo})`;

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return allMenuItems.filter(item => {
      const matchCat = selectedCategory === 'All Categories' || item.category === selectedCategory;
      const matchSearch = menuSearch.trim() === '' || 
        item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(menuSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allMenuItems, selectedCategory, menuSearch]);

  // Cart Operations with CP Plan Breakfast Rule and Modifiers
  const handleAddToCart = (menuItem: MenuItem) => {
    const existingIndex = cartItems.findIndex(ci => ci.itemCode === menuItem.code);

    const tags: string[] = [];
    if (isJain) tags.push('Jain');
    if (isSattvic) tags.push('Sattvic');
    if (isLessSpicy) tags.push('Less Spicy');
    if (chefInstructions.trim()) tags.push(chefInstructions.trim());

    // CP Plan Breakfast check: If breakfast item for CP In-House Guest
    const isBreakfastItem = menuItem.category.includes('Breakfast') || menuItem.category.includes('South Indian');
    const isCpEligible = serviceType === 'Room' && isCpBreakfast && isBreakfastItem;
    if (isCpEligible) tags.push('CP Plan Included (₹0)');

    const note = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
    const itemRate = isCpEligible ? 0 : (menuItem.saleRate || menuItem.rate);

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].qty += 1;
      updated[existingIndex].amount = Number((updated[existingIndex].qty * updated[existingIndex].rate).toFixed(2));
      setCartItems(updated);
    } else {
      const newItem: KotItem = {
        sNo: cartItems.length + 1,
        itemName: `${menuItem.name}${note}`,
        itemCode: menuItem.code,
        qty: 1,
        rate: itemRate,
        amount: itemRate,
        isJain: isJain,
        instructions: chefInstructions.trim() || undefined
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const handleIncrementQty = (index: number) => {
    const updated = [...cartItems];
    updated[index].qty += 1;
    updated[index].amount = Number((updated[index].qty * updated[index].rate).toFixed(2));
    setCartItems(updated);
  };

  const handleDecrementQty = (index: number) => {
    const updated = [...cartItems];
    if (updated[index].qty <= 1) {
      // Decrementing to 0 removes the item from the cart array immediately
      handleRemoveItem(index);
    } else {
      updated[index].qty -= 1;
      updated[index].amount = Number((updated[index].qty * updated[index].rate).toFixed(2));
      setCartItems(updated);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updated = cartItems.filter((_, i) => i !== index).map((it, idx) => ({
      ...it,
      sNo: idx + 1
    }));
    setCartItems(updated);
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Calculations
  const totalQty = cartItems.reduce((sum, it) => sum + it.qty, 0);
  const taxableAmount = Number(cartItems.reduce((sum, it) => sum + it.amount, 0).toFixed(2));
  const cgstAmount = Number((taxableAmount * 0.025).toFixed(2));
  const sgstAmount = Number((taxableAmount * 0.025).toFixed(2));
  const totalTaxAmount = Number((cgstAmount + sgstAmount).toFixed(2));
  const grandTotal = Math.round(taxableAmount + totalTaxAmount);

  // Workflow 1: [🔥 Punch KOT to Kitchen]
  const handlePunchKot = () => {
    if (isProcessing) return;
    if (cartItems.length === 0) {
      alert('Cart is empty! Please add at least one item from the Vasudev Rasoi menu.');
      return;
    }

    setIsProcessing(true);
    try {
      const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const fullRemark = kotRemark + (isJain ? ' (Jain Prep)' : '') + (isSattvic ? ' (Sattvic Prep)' : '') + (isLessSpicy ? ' (Less Spicy)' : '');

      if (serviceType === 'Restaurant') {
        // Module 1 & 2: Single Active Table Session & Real-Time WebSocket Delta Dispatch
        const result = PmsStore.createOrAppendTableSession(
          selectedTableNo,
          cartItems,
          'DEMO0004',
          currentGuestName,
          fullRemark
        );
        setSavedKotRecord(result.kot);
        if (onKotSaved) onKotSaved(result.kot);

        showToast(result.isInitial
          ? `🔥 KOT ${result.kot.kotNo} (Table Session Initialized) dispatched to Kitchen & Cashier!`
          : `🔥 RUNNING KOT #${result.kot.kotSequence} (${result.kot.kotNo}) DELTA ticket dispatched to Kitchen! Cumulative bill updated at Cashier.`
        );
        setShowSlipPreview(true);
      } else {
        const targetRoomOrTable = selectedRoomNo;
        const kotRecord: PmsKotRecord = {
          kotNo,
          serviceType,
          roomNo: targetRoomOrTable,
          tableNo: undefined,
          guestName: currentGuestName,
          kotRemark: fullRemark,
          operatorName: 'DEMO0004',
          items: cartItems,
          totalAmount: taxableAmount,
          totalQty,
          date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
          time: nowTime,
          createdAt: new Date().toISOString(),
          status: 'Pending',
          serveStatus: 'Pending',
          isPrinted: true,
          orderSource: 'Desktop'
        };

        PmsStore.saveKot(kotRecord);
        PmsStore.playKotChime();
        PmsStore.broadcastKotEvent({
          type: 'KOT_PUNCHED',
          payload: {
            roomNo: targetRoomOrTable,
            kotNo,
            items: cartItems,
            totalAmount: taxableAmount
          }
        });

        setSavedKotRecord(kotRecord);
        if (onKotSaved) onKotSaved(kotRecord);

        showToast(`🔥 KOT ${kotNo} punched to live Kitchen Display System (KDS)!`);
        setShowSlipPreview(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Workflow 2: [🛎️ Post to Room Folio]
  const handlePostToRoomFolio = () => {
    if (isProcessing) return;
    if (cartItems.length === 0) {
      alert('Cart is empty! Please add items to post to the room folio.');
      return;
    }

    if (serviceType !== 'Room') {
      alert('Order Type must be set to "🛎️ Room Service" to post charges to an active guest folio.');
      setServiceType('Room');
      return;
    }

    const matchedRoom = occupiedRooms.find(r => r.roomNo === selectedRoomNo);
    if (!matchedRoom) {
      alert(`Room ${selectedRoomNo} is not currently OCCUPIED. Food orders can only be posted to active occupied guest folios.`);
      return;
    }

    setIsProcessing(true);
    try {
      const targetGuest = matchedRoom.currentGuest?.name || 'In-House Guest';
      const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      const kotRecord: PmsKotRecord = {
        kotNo,
        serviceType: 'Room',
        roomNo: selectedRoomNo,
        guestName: targetGuest,
        kotRemark: `Room Service • ${kotRemark}` + (isJain ? ' [Jain Prep]' : '') + (isSattvic ? ' [Sattvic]' : '') + (isLessSpicy ? ' [Less Spicy]' : ''),
        operatorName: 'Front Desk',
        items: cartItems,
        totalAmount: grandTotal,
        totalQty,
        date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
        time: nowTime,
        createdAt: new Date().toISOString(),
        status: 'Ready To Serve',
        serveStatus: 'Ready To Serve',
        isPrinted: true,
        orderSource: 'Desktop'
      };

      // Save KOT
      PmsStore.saveKot(kotRecord);

      // Update room foodAmount in store with gross bill amount (so checkout inverse 5% GST math matches POS exactly)
      PmsStore.updateRoomFoodAmount(selectedRoomNo, grandTotal);

      if (onKotSaved) onKotSaved(kotRecord);

      alert(`✅ Food Charge Posted to Room ${selectedRoomNo} (${targetGuest})!\n\nTaxable Amount: ₹${taxableAmount.toFixed(2)} (SAC 996331 @ 5% GST: ₹${totalTaxAmount.toFixed(2)})\nTotal Posted: ₹${grandTotal.toFixed(2)}\nLive Folio Balance updated successfully.`);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  // Workflow 3: [💳 Instant Counter Bill]
  const handleSettleCounterBill = () => {
    if (isProcessing) return;
    if (cartItems.length === 0) {
      alert('Cart is empty! Please add items before generating a counter bill.');
      return;
    }

    setIsProcessing(true);
    try {
      const billNo = `VR/2026-27/BILL-${Math.floor(1000 + Math.random() * 9000)}`;
      const billRecord = {
        billNo,
        orderType: serviceType,
        destination: serviceType === 'Restaurant' ? selectedTableNo : `Room ${selectedRoomNo}`,
        guestName: currentGuestName,
        items: cartItems,
        subtotal: taxableAmount,
        cgst: cgstAmount,
        sgst: sgstAmount,
        grandTotal,
        paymentMode: counterPaymentMode,
        timestamp: new Date().toLocaleString('en-IN')
      };

      setBillReceiptRecord(billRecord);
      setShowCounterBillModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pms-submodal-overlay" onClick={onClose}>
      <div
        className="pms-form-box"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: showSlipPreview || showCounterBillModal ? 480 : 1180,
          width: '96%',
          transition: 'all 0.2s ease',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div style={{
            position: 'absolute',
            top: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#065f46',
            color: '#ffffff',
            padding: '8px 18px',
            borderRadius: 6,
            fontWeight: 800,
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            zIndex: 10000
          }}>
            {toastMessage}
          </div>
        )}

        {/* 1. Thermal KOT Print Slip Preview */}
        {showSlipPreview && savedKotRecord ? (
          <div style={{ padding: 16 }}>
            <div
              id="kot-print-area"
              className="printable-thermal-receipt"
              style={{
                background: '#ffffff',
                border: '1px dashed #334155',
                padding: 16,
                fontFamily: 'monospace',
                fontSize: 12,
                color: '#000000'
              }}
            >
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 8, marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>VASUDEV RASOI</h3>
                <p style={{ margin: '2px 0', fontSize: 11, fontWeight: 700 }}>SRI SAI VASUDEV RESIDENCY</p>
                <p style={{ margin: 0, fontSize: 10 }}>Near Andhra Bank, New Colony, Rayagada - 765001</p>
                <div style={{ display: 'inline-block', border: '1px solid #000', padding: '2px 8px', fontWeight: 900, fontSize: 12, marginTop: 4 }}>
                  KITCHEN ORDER TICKET (KOT)
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 11, marginBottom: 8, gap: 2 }}>
                <div><strong>KOT No:</strong> {savedKotRecord.kotNo}</div>
                <div style={{ textAlign: 'right' }}><strong>Order Type:</strong> {savedKotRecord.serviceType}</div>
                <div><strong>Destination:</strong> {savedKotRecord.roomNo}</div>
                <div style={{ textAlign: 'right' }}><strong>Time:</strong> {savedKotRecord.time}</div>
                <div><strong>Guest:</strong> {savedKotRecord.guestName}</div>
                <div style={{ textAlign: 'right' }}><strong>Date:</strong> {savedKotRecord.date}</div>
              </div>

              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', marginBottom: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 40px', fontWeight: 900, marginBottom: 4 }}>
                  <span>#</span>
                  <span>Item Name</span>
                  <span style={{ textAlign: 'center' }}>Qty</span>
                </div>
                {savedKotRecord.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 40px', padding: '2px 0', fontSize: 11 }}>
                    <span>{idx + 1}</span>
                    <span>{it.itemName}</span>
                    <span style={{ textAlign: 'center', fontWeight: 900 }}>{it.qty}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, marginBottom: 6 }}>
                <strong>Remarks:</strong> {savedKotRecord.kotRemark || 'None'}
              </div>

              <div style={{ borderTop: '1px dashed #000', paddingTop: 6, textAlign: 'center', fontSize: 10 }}>
                *** KITCHEN PRODUCTION COPY &bull; SAC 996331 ***
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setShowSlipPreview(false)}
                style={{ background: '#475569', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}
              >
                ← Back to POS
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '7px 20px', borderRadius: 4, cursor: 'pointer', fontWeight: 800 }}
                >
                  🖨️ Print 80mm KOT
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '7px 18px', borderRadius: 4, cursor: 'pointer', fontWeight: 800 }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : showCounterBillModal && billReceiptRecord ? (
          /* 2. Instant Counter Bill Printable Preview (80mm Thermal Receipt) */
          <div style={{ padding: 16 }}>
            <div
              id="food-bill-print-slip"
              className="printable-thermal-receipt"
              style={{
                background: '#ffffff',
                border: '1px dashed #000000',
                padding: 16,
                fontFamily: 'monospace',
                fontSize: 12,
                color: '#000000'
              }}
            >
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 8, marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>VASUDEV RASOI</h3>
                <p style={{ margin: '2px 0', fontSize: 11, fontWeight: 700 }}>SRI SAI VASUDEV RESIDENCY</p>
                <p style={{ margin: 0, fontSize: 10 }}>Near Andhra Bank, New Colony, Rayagada 765001</p>
                <p style={{ margin: '2px 0', fontSize: 10 }}>GSTIN: 21AEKPP8689J1ZS &bull; Ph: +91 94402 89999</p>
                <div style={{ display: 'inline-block', border: '1px solid #000', padding: '2px 8px', fontWeight: 900, fontSize: 12, marginTop: 4 }}>
                  RESTAURANT TAX INVOICE (SAC 996331)
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 11, marginBottom: 8, gap: 2 }}>
                <div><strong>Bill No:</strong> {billReceiptRecord.billNo}</div>
                <div style={{ textAlign: 'right' }}><strong>Mode:</strong> {billReceiptRecord.paymentMode}</div>
                <div><strong>Table/Room:</strong> {billReceiptRecord.destination}</div>
                <div style={{ textAlign: 'right' }}><strong>Time:</strong> {billReceiptRecord.timestamp.split(',')[1]}</div>
                <div><strong>Guest:</strong> {billReceiptRecord.guestName}</div>
                <div style={{ textAlign: 'right' }}><strong>Date:</strong> {billReceiptRecord.timestamp.split(',')[0]}</div>
              </div>

              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', marginBottom: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 30px 60px', fontWeight: 900, marginBottom: 4 }}>
                  <span>#</span>
                  <span>Item</span>
                  <span style={{ textAlign: 'center' }}>Qty</span>
                  <span style={{ textAlign: 'right' }}>Amt (₹)</span>
                </div>
                {billReceiptRecord.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 30px 60px', padding: '2px 0', fontSize: 11 }}>
                    <span>{idx + 1}</span>
                    <span>{it.itemName}</span>
                    <span style={{ textAlign: 'center' }}>{it.qty}</span>
                    <span style={{ textAlign: 'right' }}>{it.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Dual-Slab 5% GST Breakdown (Module 4/5) */}
              <div style={{ fontSize: 11, lineHeight: 1.6, borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Food Subtotal (Taxable):</span>
                  <span>₹{billReceiptRecord.subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CGST @ 2.5% (SAC 996331):</span>
                  <span>₹{billReceiptRecord.cgst.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>SGST @ 2.5% (SAC 996331):</span>
                  <span>₹{billReceiptRecord.sgst.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 13, borderTop: '1px dashed #000', paddingTop: 4 }}>
                  <span>Grand Total (Paid):</span>
                  <span>₹{billReceiptRecord.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: 10, marginTop: 8 }}>
                *** OM SAI RAM &bull; THANK YOU FOR VISITING ***
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setShowCounterBillModal(false)}
                style={{ background: '#475569', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}
              >
                ← Back
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '7px 20px', borderRadius: 4, cursor: 'pointer', fontWeight: 800 }}
                >
                  🖨️ Print 80mm Receipt
                </button>
                <button
                  id="close-kot-slip-btn"
                  type="button"
                  onClick={onClose}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '7px 18px', borderRadius: 4, cursor: 'pointer', fontWeight: 800 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 3. Main Vasudev Rasoi Pure Veg POS Screen */
          <>
            {/* Header Banner */}
            <div
              className="pms-form-banner banner-navy"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                borderBottom: '3px solid #f59e0b'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>🍲</span>
                <div>
                  <div id="kot-modal-title" style={{ fontSize: 14, fontWeight: 900, letterSpacing: 0.5, color: '#ffffff' }}>
                    VASUDEV RASOI &bull; PURE VEG RESTAURANT POS &amp; KOT
                  </div>
                  <div style={{ fontSize: 11, color: '#93c5fd' }}>
                    Shirdi Temple Darshan Sattvic &amp; Jain Dining &bull; GST SAC 996331 (5%)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, background: '#1e293b', color: '#f59e0b', padding: '3px 8px', borderRadius: 4, fontWeight: 800 }}>
                  KOT: {kotNo}
                </span>
                <button
                  id="close-kot-modal-btn"
                  type="button"
                  onClick={onClose}
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="pms-form-body" style={{ padding: 14, overflowY: 'auto', flex: 1 }}>
              {/* Order Service Selector & Destination Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1.6fr 1.5fr',
                gap: 12,
                background: '#f8fafc',
                padding: 10,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                marginBottom: 12
              }}>
                {/* Order Type Toggle */}
                <div>
                  <label className="form-label-pms" style={{ fontWeight: 800, color: '#0f172a' }}>
                    Order Type
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setServiceType('Restaurant')}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 800,
                        border: serviceType === 'Restaurant' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: serviceType === 'Restaurant' ? '#eff6ff' : '#ffffff',
                        color: serviceType === 'Restaurant' ? '#1d4ed8' : '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      🍽️ Table (T1–T10)
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceType('Room')}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 800,
                        border: serviceType === 'Room' ? '2px solid #059669' : '1px solid #cbd5e1',
                        background: serviceType === 'Room' ? '#ecfdf5' : '#ffffff',
                        color: serviceType === 'Room' ? '#047857' : '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      🛎️ Room Service
                    </button>
                  </div>
                </div>

                {/* Destination Dropdown */}
                <div>
                  <label className="form-label-pms" style={{ fontWeight: 800, color: '#0f172a' }}>
                    {serviceType === 'Room' ? 'Select Occupied Room' : 'Select Dining Table'}
                  </label>
                  {serviceType === 'Room' ? (
                    <select
                      value={selectedRoomNo}
                      onChange={e => setSelectedRoomNo(e.target.value)}
                      className="form-select-pms"
                      style={{ fontWeight: 700, borderColor: '#059669' }}
                    >
                      {occupiedRooms.length === 0 ? (
                        <option value="">-- No Occupied Rooms (Cannot Post Room Service) --</option>
                      ) : (
                        occupiedRooms.map(r => (
                          <option key={r.roomNo} value={r.roomNo}>
                            Room {r.roomNo} &bull; {r.currentGuest?.name || 'In-House'} &bull; {r.roomType}
                          </option>
                        ))
                      )}
                    </select>
                  ) : (
                    <select
                      value={selectedTableNo}
                      onChange={e => setSelectedTableNo(e.target.value)}
                      className="form-select-pms"
                      style={{ fontWeight: 700 }}
                    >
                      {RESTAURANT_TABLES.map(t => (
                        <option key={t} value={t}>{t} (Pure Veg Dining)</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Guest & Steward Remark */}
                <div>
                  <label className="form-label-pms" style={{ fontWeight: 800, color: '#0f172a' }}>
                    Guest / Server Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Serve with Kakad Aarti Tea"
                    value={kotRemark}
                    onChange={e => setKotRemark(e.target.value)}
                    className="form-input-pms"
                  />
                </div>
              </div>

              {/* Dietary Modifiers Bar (Module 3) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                background: '#fefce8',
                borderRadius: 6,
                border: '1px solid #fef08a',
                marginBottom: 12,
                flexWrap: 'wrap'
              }}>
                <span style={{ fontWeight: 900, color: '#854d0e', fontSize: 11, textTransform: 'uppercase' }}>
                  Dietary Modifiers:
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#15803d', cursor: 'pointer', fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={isJain}
                    onChange={e => setIsJain(e.target.checked)}
                    style={{ accentColor: '#16a34a', width: 16, height: 16 }}
                  />
                  <span>🌱 Jain Prep (No Onion/Garlic)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#b45309', cursor: 'pointer', fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={isSattvic}
                    onChange={e => setIsSattvic(e.target.checked)}
                    style={{ accentColor: '#d97706', width: 16, height: 16 }}
                  />
                  <span>🕉️ Sattvic / Low Spice</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#ea580c', cursor: 'pointer', fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={isLessSpicy}
                    onChange={e => setIsLessSpicy(e.target.checked)}
                    style={{ accentColor: '#ea580c', width: 16, height: 16 }}
                  />
                  <span>🌶️ Less Spicy</span>
                </label>
                {isCpRoom && (
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontWeight: 800,
                      color: isBreakfastWindow ? '#0284c7' : '#64748b',
                      cursor: 'pointer',
                      fontSize: 12,
                      background: isBreakfastWindow ? '#e0f2fe' : '#f1f5f9',
                      padding: '2px 8px',
                      borderRadius: 4
                    }}
                    title={isBreakfastWindow ? 'Breakfast window active (7:00 AM - 10:30 AM)' : 'Complimentary breakfast window is 7:00 AM - 10:30 AM'}
                  >
                    <input
                      type="checkbox"
                      checked={isCpBreakfast}
                      onChange={e => setIsCpBreakfast(e.target.checked)}
                      style={{ accentColor: '#0284c7', width: 16, height: 16 }}
                    />
                    <span>☕ CP Breakfast Included {isBreakfastWindow ? '(Active 7:00-10:30)' : '(Off-Hours)'}</span>
                  </label>
                )}
                <input
                  type="text"
                  placeholder="Special instructions (e.g. extra crispy dosa, mild sambar, no green chillies)"
                  value={chefInstructions}
                  onChange={e => setChefInstructions(e.target.value)}
                  className="form-input-pms"
                  style={{ flex: 1, minWidth: 220, fontSize: 11, height: 28 }}
                />
              </div>

              {/* POS Split View: Menu Catalog (Left) vs Cart / Order Summary (Right) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
                {/* Left: 6 Category Pills & Menu Item Catalog */}
                <div>
                  {/* Category Filter Pills */}
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 8 }}>
                    {VASUDEV_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                          whiteSpace: 'nowrap',
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          border: selectedCategory === cat ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: selectedCategory === cat ? '#2563eb' : '#ffffff',
                          color: selectedCategory === cat ? '#ffffff' : '#334155',
                          cursor: 'pointer'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Menu Search Box */}
                  <div style={{ marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="🔍 Search Dish (e.g. Dosa, Thali, Paneer, Lassi)..."
                      value={menuSearch}
                      onChange={e => setMenuSearch(e.target.value)}
                      className="form-input-pms"
                      style={{ fontSize: 12, padding: '6px 10px' }}
                    />
                  </div>

                  {/* Items Grid */}
                  <div style={{
                    maxHeight: 330,
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: 8,
                    background: '#ffffff',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                    gap: 8
                  }}>
                    {filteredMenuItems.map(item => (
                      <div
                        key={item.id}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          padding: '8px 10px',
                          background: '#f8fafc',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: 80
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                              {item.name}
                            </span>
                            <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', padding: '1px 5px', borderRadius: 3, fontWeight: 800 }}>
                              Veg
                            </span>
                          </div>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                            {item.category} &bull; SAC 996331
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 4, borderTop: '1px dashed #cbd5e1' }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: '#15803d' }}>
                            ₹{(item.saleRate || item.rate).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            style={{
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              padding: '3px 10px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredMenuItems.length === 0 && (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                        No dishes matched this category or search term.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Cart Controls & 3 Billing Workflows */}
                <div style={{
                  background: '#f8fafc',
                  border: '2px solid #0f172a',
                  borderRadius: 6,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: 6, marginBottom: 8 }}>
                      <span style={{ fontWeight: 900, fontSize: 13, color: '#0f172a' }}>
                        🛒 Active Cart ({totalQty} items)
                      </span>
                      {cartItems.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearCart}
                          style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Clear Cart
                        </button>
                      )}
                    </div>

                    {/* Cart Items Table */}
                    <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 10 }}>
                      {cartItems.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 4,
                            padding: '6px 8px',
                            marginBottom: 6,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ flex: 1, paddingRight: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#1e293b' }}>
                              {item.itemName}
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>
                              ₹{item.rate.toFixed(2)} each &bull; ₹{item.amount.toFixed(2)}
                            </div>
                          </div>

                          {/* Working [+], [-], and [🗑️ Remove] Buttons (Module 3) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button
                              type="button"
                              onClick={() => handleDecrementQty(idx)}
                              title={item.qty <= 1 ? 'Remove from cart' : 'Decrease quantity'}
                              style={{
                                width: 22,
                                height: 22,
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: 3,
                                fontWeight: 900,
                                fontSize: 12,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: item.qty <= 1 ? '#dc2626' : '#0f172a'
                              }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: 12, fontWeight: 900, minWidth: 20, textAlign: 'center' }}>
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleIncrementQty(idx)}
                              title="Increase quantity"
                              style={{
                                width: 22,
                                height: 22,
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: 3,
                                fontWeight: 900,
                                fontSize: 12,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              title="Remove item from cart"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: 13,
                                cursor: 'pointer',
                                marginLeft: 4
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}

                      {cartItems.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: 12 }}>
                          Cart is empty. Select delicious pure veg dishes from the left to start!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calculations & Totals */}
                  <div>
                    <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 4, padding: 8, marginBottom: 10, fontSize: 11 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span>Food Taxable (SAC 996331):</span>
                        <span style={{ fontWeight: 700 }}>₹{taxableAmount.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, color: '#475569' }}>
                        <span>CGST @ 2.5%:</span>
                        <span>₹{cgstAmount.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, color: '#475569' }}>
                        <span>SGST @ 2.5%:</span>
                        <span>₹{sgstAmount.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', paddingTop: 4, marginTop: 4, fontWeight: 900, fontSize: 14, color: '#15803d' }}>
                        <span>Grand Total:</span>
                        <span>₹{grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* The 3 Core Module 3 Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {/* Button 1: [🔥 Punch KOT to Kitchen] */}
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handlePunchKot}
                        style={{
                          background: isProcessing ? '#9a3412' : '#ea580c',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          opacity: isProcessing ? 0.7 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        {isProcessing ? '⏳ Processing...' : '🔥 Punch KOT to Kitchen'}
                      </button>

                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* Button 2: [🛎️ Post to Room Folio] */}
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={handlePostToRoomFolio}
                          style={{
                            flex: 1,
                            background: isProcessing ? '#065f46' : '#059669',
                            color: '#ffffff',
                            border: 'none',
                            padding: '7px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            opacity: isProcessing ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4
                          }}
                        >
                          {isProcessing ? '⏳ Posting...' : '🛎️ Post to Room Folio'}
                        </button>

                        {/* Button 3: [💳 Instant Counter Bill] */}
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={handleSettleCounterBill}
                          style={{
                            flex: 1,
                            background: isProcessing ? '#1e40af' : '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '7px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            opacity: isProcessing ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4
                          }}
                        >
                          {isProcessing ? '⏳ Processing...' : '💳 Instant Counter Bill'}
                        </button>
                      </div>

                      {/* Payment Mode selector for counter settlement */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#475569', marginTop: 2 }}>
                        <span>Counter Bill Mode:</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {(['UPI', 'Cash', 'Card'] as const).map(mode => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setCounterPaymentMode(mode)}
                              style={{
                                padding: '1px 6px',
                                borderRadius: 3,
                                border: counterPaymentMode === mode ? '1px solid #2563eb' : '1px solid #cbd5e1',
                                background: counterPaymentMode === mode ? '#dbeafe' : '#ffffff',
                                color: counterPaymentMode === mode ? '#1e40af' : '#475569',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontSize: 10
                              }}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
