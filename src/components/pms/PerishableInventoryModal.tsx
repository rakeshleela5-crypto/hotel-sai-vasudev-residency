import React, { useState, useEffect, useCallback } from 'react';
import { hotelApi } from '../../services/api';
import type { InventoryLot, ExpiryAlert } from '../../types/pmsModels';

interface PerishableInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PerishableInventoryModal: React.FC<PerishableInventoryModalProps> = ({
  isOpen,
  onClose
}) => {
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'lots' | 'new_batch' | 'spoilage_log'>('lots');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [storeFilter, setStoreFilter] = useState<string>('All');

  // New Batch Form State
  const [itemName, setItemName] = useState<string>('');
  const [category, setCategory] = useState<string>('Dairy');
  const [storeName, setStoreName] = useState<string>('Kitchen Store');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unitOfMeasure, setUnitOfMeasure] = useState<string>('kg');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [invoiceRef, setInvoiceRef] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [batchNotes, setBatchNotes] = useState<string>('');

  // Requisition / Spoilage Action States
  const [selectedLotForWaste, setSelectedLotForWaste] = useState<InventoryLot | null>(null);
  const [wasteQty, setWasteQty] = useState<number | ''>('');
  const [wasteReason, setWasteReason] = useState<string>('Spoilage');
  const [reportedBy, setReportedBy] = useState<string>('Kitchen Supervisor');
  const [managerPin, setManagerPin] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchInventoryData = useCallback(async () => {
    setLoading(true);
    try {
      const [lotsData, alertsData] = await Promise.all([
        hotelApi.getInventoryLots(),
        hotelApi.getInventoryExpiryAlerts(48)
      ]);
      setLots(lotsData || []);
      setAlerts(alertsData || []);
    } catch (err: any) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActionMessage(null);
      fetchInventoryData();
    }
  }, [isOpen, fetchInventoryData]);

  if (!isOpen) return null;

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);

    const qty = Number(quantity);
    const cost = Number(unitCost);
    if (!itemName || qty <= 0 || cost < 0) {
      setActionMessage({ type: 'error', text: 'Please provide valid item name, quantity, and unit cost.' });
      return;
    }

    try {
      await hotelApi.createInventoryLot({
        item_name: itemName,
        category,
        store_name: storeName,
        quantity: qty,
        unit_cost: cost,
        unit_of_measure: unitOfMeasure,
        supplier_name: supplierName || undefined,
        invoice_ref: invoiceRef || undefined,
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        notes: batchNotes || undefined
      });

      setActionMessage({ type: 'success', text: `Batch lot for '${itemName}' registered successfully!` });
      setItemName('');
      setQuantity('');
      setUnitCost('');
      setSupplierName('');
      setInvoiceRef('');
      setExpiryDate('');
      setBatchNotes('');
      setActiveTab('lots');
      fetchInventoryData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to register inventory batch.' });
    }
  };

  const handleCondemnWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotForWaste) return;

    const wQty = Number(wasteQty);
    if (wQty <= 0 || wQty > selectedLotForWaste.remaining_quantity) {
      setActionMessage({ type: 'error', text: `Invalid waste quantity. Maximum available: ${selectedLotForWaste.remaining_quantity}` });
      return;
    }

    const estimatedLoss = wQty * selectedLotForWaste.unit_cost;
    if (estimatedLoss >= 1000 && !managerPin) {
      setActionMessage({ type: 'error', text: 'Manager PIN is required for food waste write-offs >= ₹1,000.' });
      return;
    }

    try {
      const res = await hotelApi.recordInventorySpoilage({
        lot_id: selectedLotForWaste.id,
        quantity_wasted: wQty,
        waste_reason: wasteReason,
        reported_by: reportedBy,
        manager_pin: managerPin || undefined,
        action_taken: 'Disposed in Organic Waste'
      });

      setActionMessage({
        type: 'success',
        text: `Voucher ${res.voucher_no} posted! Loss of ₹${res.total_loss_rupees.toFixed(2)} debited to Food Waste & Spoilage Expense.`
      });
      setSelectedLotForWaste(null);
      setWasteQty('');
      setManagerPin('');
      fetchInventoryData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to record food waste write-off.' });
    }
  };

  const filteredLots = lots.filter(lot => {
    if (categoryFilter !== 'All' && lot.category !== categoryFilter) return false;
    if (storeFilter !== 'All' && lot.store_name !== storeFilter) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/40 rounded-xl shadow-2xl max-w-5xl w-full p-6 text-slate-100 flex flex-col gap-4 max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🥬</span>
            <div>
              <h2 className="text-xl font-bold text-amber-400">
                Perishable Kitchen Inventory &amp; FIFO Batch Engine
              </h2>
              <p className="text-xs text-slate-400">
                Vasudev Rasoi &bull; First-In First-Out Shelf-Life Management &amp; Loss Prevention
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl font-bold leading-none p-1"
          >
            &times;
          </button>
        </div>

        {/* Expiry Warning Banner */}
        {alerts.length > 0 && (
          <div className="bg-rose-950/40 border border-rose-500/60 rounded-lg p-3 text-xs flex items-center justify-between gap-3 shrink-0 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="text-rose-400 text-lg">⚠️</span>
              <div>
                <span className="font-bold text-rose-300">
                  {alerts.length} Perishable Lot(s) Expired or Expiring in &lt; 48 Hours!
                </span>
                <span className="text-rose-200/80 block text-[11px]">
                  Prioritize these batches immediately for kitchen preparations to prevent spoilage shrinkage.
                </span>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {alerts.slice(0, 3).map(a => (
                <span
                  key={a.lot_id}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    a.alert_level === 'CRITICAL_EXPIRED'
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-600 text-slate-950'
                  }`}
                >
                  {a.item_name} ({a.hours_until_expiry <= 0 ? 'Expired' : `${Math.round(a.hours_until_expiry)}h left`})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action / Error Notification */}
        {actionMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold shrink-0 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/60 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/60 text-rose-300'
            }`}
          >
            {actionMessage.text}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('lots')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'lots'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Active Lots &amp; Stock ({filteredLots.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('new_batch')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'new_batch'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              + Ingest Shipment Batch
            </button>
          </div>

          {activeTab === 'lots' && (
            <div className="flex items-center gap-2 text-xs">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-slate-300 focus:outline-none focus:border-amber-400 text-xs"
              >
                <option value="All">All Categories</option>
                <option value="Dairy">Dairy</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Groceries">Groceries</option>
                <option value="Beverages">Beverages</option>
                <option value="Supplies">Supplies</option>
              </select>
              <select
                value={storeFilter}
                onChange={e => setStoreFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-slate-300 focus:outline-none focus:border-amber-400 text-xs"
              >
                <option value="All">All Locations</option>
                <option value="Kitchen Store">Kitchen Store</option>
                <option value="Central Store">Central Store</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Active Lots Table */}
        {activeTab === 'lots' && (
          <div className="overflow-y-auto flex-1 pr-1">
            {loading ? (
              <div className="text-center py-12 text-slate-400 text-sm">Loading inventory lots...</div>
            ) : filteredLots.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No active inventory lots found. Click '+ Ingest Shipment Batch' to record stock.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                    <th className="p-2.5">Lot Number</th>
                    <th className="p-2.5">Item Name</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Store</th>
                    <th className="p-2.5 text-right">Remaining Stock</th>
                    <th className="p-2.5 text-right">Unit Cost</th>
                    <th className="p-2.5">Expiry / Shelf-Life</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLots.map(lot => {
                    const days = lot.days_until_expiry;
                    let badgeClass = 'bg-slate-800 text-slate-400';
                    let badgeText = 'No Expiry Set';

                    if (days !== undefined && days !== null) {
                      if (days <= 0) {
                        badgeClass = 'bg-rose-950/80 border border-rose-500 text-rose-300 font-bold';
                        badgeText = 'Expired';
                      } else if (days <= 2) {
                        badgeClass = 'bg-amber-950/80 border border-amber-500 text-amber-300 font-bold';
                        badgeText = `${days.toFixed(1)} days left`;
                      } else {
                        badgeClass = 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300';
                        badgeText = `${days.toFixed(0)} days left`;
                      }
                    }

                    return (
                      <tr key={lot.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-2.5 font-mono text-amber-400/90 font-bold text-[11px]">{lot.lot_number}</td>
                        <td className="p-2.5 font-bold text-white">{lot.item_name}</td>
                        <td className="p-2.5 text-slate-300">{lot.category}</td>
                        <td className="p-2.5 text-slate-400">{lot.store_name}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-sky-400">
                          {lot.remaining_quantity.toFixed(2)} {lot.unit_of_measure}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-200">
                          ₹{lot.unit_cost.toFixed(2)}
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] inline-block ${badgeClass}`}>
                            {badgeText}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedLotForWaste(lot)}
                            className="bg-rose-950/50 hover:bg-rose-900 border border-rose-700/60 text-rose-300 px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer"
                            title="Condemn and record food spoilage or damage loss"
                          >
                            🗑️ Condemn Waste
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Ingest Shipment Batch Form */}
        {activeTab === 'new_batch' && (
          <form onSubmit={handleCreateBatch} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh Malai Paneer"
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="Dairy">Dairy (Milk, Paneer, Curd, Butter)</option>
                  <option value="Vegetables">Vegetables &amp; Fresh Produce</option>
                  <option value="Groceries">Groceries, Flour &amp; Rice</option>
                  <option value="Beverages">Beverages &amp; Tea/Coffee</option>
                  <option value="Supplies">Kitchen &amp; Cleaning Supplies</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Store Location</label>
                <select
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="Kitchen Store">Kitchen Store (Vasudev Rasoi)</option>
                  <option value="Central Store">Central Store (Main Godown)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Received Quantity *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Unit of Measure</label>
                <select
                  value={unitOfMeasure}
                  onChange={e => setUnitOfMeasure(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="kg">kg (Kilograms)</option>
                  <option value="L">L (Litres)</option>
                  <option value="packets">packets</option>
                  <option value="pcs">pcs (Pieces)</option>
                  <option value="crates">crates</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Unit Cost (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={unitCost}
                  onChange={e => setUnitCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Expiry Date &amp; Time (Perishables)</label>
                <input
                  type="datetime-local"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Supplier Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rayagada Local Dairy Coop"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Invoice / Delivery Challan Ref</label>
                <input
                  type="text"
                  placeholder="e.g. DC-2026-99"
                  value={invoiceRef}
                  onChange={e => setInvoiceRef(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('lots')}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Save &amp; Generate Lot Number
              </button>
            </div>
          </form>
        )}

        {/* Modal Subdialog: Condemn Food Waste / Spoilage */}
        {selectedLotForWaste && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 border border-rose-500/50 rounded-xl max-w-md w-full p-5 text-slate-100 flex flex-col gap-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-rose-400 text-sm flex items-center gap-1.5">
                  <span>🗑️</span> Condemn Spoilage: {selectedLotForWaste.item_name}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedLotForWaste(null)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="text-xs bg-slate-800/80 p-2.5 rounded border border-slate-700/80 flex justify-between">
                <span>Lot: <strong>{selectedLotForWaste.lot_number}</strong></span>
                <span>Available: <strong className="text-sky-400">{selectedLotForWaste.remaining_quantity} {selectedLotForWaste.unit_of_measure}</strong></span>
                <span>Rate: <strong>₹{selectedLotForWaste.unit_cost}/unit</strong></span>
              </div>

              <form onSubmit={handleCondemnWaste} className="flex flex-col gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Wasted Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedLotForWaste.remaining_quantity}
                    value={wasteQty}
                    onChange={e => setWasteQty(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-rose-300 font-bold focus:outline-none focus:border-rose-400"
                  />
                  {typeof wasteQty === 'number' && wasteQty > 0 && (
                    <span className="text-[11px] text-amber-300 mt-1 block">
                      Estimated Loss: ₹{(wasteQty * selectedLotForWaste.unit_cost).toFixed(2)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Reason for Condemnation</label>
                  <select
                    value={wasteReason}
                    onChange={e => setWasteReason(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-rose-400"
                  >
                    <option value="Spoilage">Spoilage / Curdled / Rotted</option>
                    <option value="Expired">Past Expiry Date</option>
                    <option value="Damaged">Transit / Storage Damage</option>
                    <option value="Spillage">Spillage / Container Breakage</option>
                    <option value="Quality Rejection">Quality &amp; Taste Rejection</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Reported By</label>
                  <input
                    type="text"
                    value={reportedBy}
                    onChange={e => setReportedBy(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>

                {/* Manager PIN required for loss >= 1000 */}
                {typeof wasteQty === 'number' && (wasteQty * selectedLotForWaste.unit_cost) >= 1000 && (
                  <div className="bg-amber-950/40 border border-amber-600/60 p-2.5 rounded">
                    <span className="text-[11px] text-amber-300 font-semibold block mb-1">
                      🔒 Manager PIN Required (Loss &ge; ₹1,000)
                    </span>
                    <input
                      type="password"
                      maxLength={8}
                      placeholder="Manager PIN"
                      value={managerPin}
                      onChange={e => setManagerPin(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-amber-600 rounded px-2.5 py-1 text-center font-mono font-bold text-amber-300"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedLotForWaste(null)}
                    className="px-3 py-1.5 rounded text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                  >
                    Post Spoilage Write-Off
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

