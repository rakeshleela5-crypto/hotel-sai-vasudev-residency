import React, { useState, useEffect } from 'react';
import type { PmsWhatsAppTemplate, PmsWhatsAppConfig } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';

interface WhatsAppSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogs?: () => void;
}

export const WhatsAppSettingModal: React.FC<WhatsAppSettingModalProps> = ({
  isOpen,
  onClose,
  onOpenLogs
}) => {
  const [templates, setTemplates] = useState<PmsWhatsAppTemplate[]>([]);
  const [config, setConfig] = useState<PmsWhatsAppConfig>(PmsStore.getWhatsAppConfig());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Guest' | 'Owner'>('All');
  
  // Modals inside setting
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PmsWhatsAppTemplate | null>(null);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testTemplate, setTestTemplate] = useState<PmsWhatsAppTemplate | null>(null);
  const [testMobile, setTestMobile] = useState('');
  const [testGuestName, setTestGuestName] = useState('Rahul Sharma');
  const [testRoomNo, setTestRoomNo] = useState('101');
  const [testVoucherNo, setTestVoucherNo] = useState('RM/63/24-25');
  const [testBillAmount, setTestBillAmount] = useState('2400');
  
  // Promo modal state
  const [promoMobile, setPromoMobile] = useState('');
  const [promoMessage, setPromoMessage] = useState('');

  // Toast / feedback message
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    setTemplates(PmsStore.getWhatsAppTemplates());
    setConfig(PmsStore.getWhatsAppConfig());
  };

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleToggleActive = (tmpl: PmsWhatsAppTemplate) => {
    const updated: PmsWhatsAppTemplate = {
      ...tmpl,
      active: tmpl.active === 'On' ? 'Off' : 'On'
    };
    PmsStore.saveWhatsAppTemplate(updated);
    loadData();
    showStatus(`Template "${tmpl.voucherType}" is now ${updated.active}.`);
  };

  const handleOpenEdit = (tmpl: PmsWhatsAppTemplate) => {
    setEditingTemplate({ ...tmpl });
    setIsEditModalOpen(true);
  };

  const handleAddNew = () => {
    const nextId = templates.length > 0 ? Math.max(...templates.map(t => t.id)) + 1 : 1;
    setEditingTemplate({
      id: nextId,
      sNo: nextId,
      type: 'WhatsApp',
      voucherType: 'Custom_alert',
      label: 'New WhatsApp Alert',
      message: 'Dear Guest, Greetings from *{firm_name}*. Room No: {room_no}. Contact: {phone}',
      active: 'On',
      sendTo: 'Guest'
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditing = () => {
    if (!editingTemplate) return;
    PmsStore.saveWhatsAppTemplate(editingTemplate);
    setIsEditModalOpen(false);
    setEditingTemplate(null);
    loadData();
    showStatus('WhatsApp Template saved successfully!');
  };

  const handleDeleteTemplate = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete template "${name}"?`)) {
      PmsStore.deleteWhatsAppTemplate(id);
      loadData();
      showStatus(`Template "${name}" deleted.`, 'error');
    }
  };

  const handleOpenTest = (tmpl: PmsWhatsAppTemplate) => {
    setTestTemplate(tmpl);
    setTestMobile(tmpl.sendTo === 'Owner' ? config.ownerMobile : '9822100042');
    setIsTestModalOpen(true);
  };

  const handleSendTest = () => {
    if (!testTemplate) return;
    if (!testMobile || testMobile.trim().length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    const { log } = PmsStore.sendWhatsAppNotification({
      voucherType: testTemplate.voucherType,
      recipientMobile: testMobile,
      recipientName: testTemplate.sendTo === 'Owner' ? 'Hotel Owner' : testGuestName,
      recipientType: testTemplate.sendTo === 'Owner' ? 'Owner' : 'Guest',
      voucherNo: testVoucherNo,
      roomNo: testRoomNo,
      templateParams: {
        total_billamount: testBillAmount,
        checkout_date: new Date().toLocaleDateString('en-GB'),
        checkin_date: new Date().toLocaleDateString('en-GB'),
        advance_paid: '500',
        balance_due: (Number(testBillAmount) - 500).toString(),
        name: PmsStore.getCurrentUser().userName
      },
      openDirectly: true
    });

    setIsTestModalOpen(false);
    showStatus(`Test WhatsApp dispatched to ${testMobile}! Log ID: ${log.id}`);
  };

  const handleSaveConfig = () => {
    PmsStore.saveWhatsAppConfig(config);
    setIsConfigModalOpen(false);
    showStatus('WhatsApp API Gateway settings saved successfully!');
  };

  const handleSendPromotional = () => {
    if (!promoMobile || promoMobile.trim().length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    const msg = promoMessage || PmsStore.getWhatsAppTemplate('Promotional')?.message || 'Greetings from Hotel Sai Vasudev Residency!';
    
    PmsStore.sendWhatsAppNotification({
      voucherType: 'Promotional',
      recipientMobile: promoMobile,
      recipientName: 'Valued Guest',
      recipientType: 'Guest',
      customMessage: PmsStore.renderWhatsAppMessage(msg, {}),
      openDirectly: true
    });

    setIsPromoModalOpen(false);
    setPromoMobile('');
    setPromoMessage('');
    showStatus(`Promotional WhatsApp sent to ${promoMobile}!`);
  };

  const insertVariable = (varName: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      message: editingTemplate.message + ` {${varName}}`
    });
  };

  if (!isOpen) return null;

  const filteredTemplates = templates.filter(t => {
    const matchesSearch =
      t.voucherType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === 'All' ? true : t.sendTo === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Top Header matching RoomG Frame 0150 */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xl shadow-md">
              💬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">WhatsApp SMS Setting</h2>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">/whatsapp_sms</span>
              </div>
              <p className="text-xs text-slate-400">Automated WhatsApp booking vouchers, guest receipts, and owner fraud alerts</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Validity Badge matching Frame 0110 */}
            <div className="hidden sm:flex items-center gap-2 bg-emerald-950/80 border border-emerald-600/60 px-3 py-1.5 rounded-lg text-emerald-300 text-xs font-semibold shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              WhatsApp Validity: {config.validityDate}
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-lg"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div className={`px-6 py-2 text-sm font-medium flex items-center justify-between ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'}`}>
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="text-xs hover:underline">Dismiss</button>
          </div>
        )}

        {/* Toolbar matching RoomG Frame 0150 */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Blue Button: Add New WhatsApp Message */}
            <button
              onClick={handleAddNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <span>➕</span> Add New WhatsApp Message
            </button>

            {/* Green Button: Send Promotional WhatsApp */}
            <button
              onClick={() => {
                setPromoMessage(PmsStore.getWhatsAppTemplate('Promotional')?.message || '');
                setIsPromoModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <span>📢</span> Send Promotional WhatsApp
            </button>

            {/* Gateway Settings Button */}
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
            >
              <span>⚙️</span> Gateway Settings
            </button>

            {/* Logs button */}
            {onOpenLogs && (
              <button
                onClick={onOpenLogs}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
              >
                <span>📜</span> Message Outbox Logs
              </button>
            )}
          </div>

          {/* Search & Audience Filter */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setFilterType('All')}
                className={`px-3 py-1.5 rounded-md transition-all ${filterType === 'All' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All ({templates.length})
              </button>
              <button
                onClick={() => setFilterType('Guest')}
                className={`px-3 py-1.5 rounded-md transition-all ${filterType === 'Guest' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Guest ({templates.filter(t => t.sendTo === 'Guest').length})
              </button>
              <button
                onClick={() => setFilterType('Owner')}
                className={`px-3 py-1.5 rounded-md transition-all ${filterType === 'Owner' ? 'bg-white text-rose-800 shadow' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Owner Alerts ({templates.filter(t => t.sendTo === 'Owner').length})
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
            </div>
          </div>
        </div>

        {/* Fraud Prevention Notification Callout matching Video 22 Audio */}
        <div className="bg-amber-50/70 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <span>
              <strong>Hotel Loss & Fraud Prevention Active:</strong> Automatic alerts are dispatched instantly to owner (<strong>{config.ownerMobile}</strong>) whenever check-in or checkout records are deleted or room tariffs are updated/discounted by operators.
            </span>
          </div>
          <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono text-[11px]">Anti-Theft Protocol</span>
        </div>

        {/* Templates Table matching RoomG Frame 0150, 0210, 0230 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">S.No</th>
                  <th className="py-3 px-3 w-24">Type</th>
                  <th className="py-3 px-4 w-48">Voucher Type</th>
                  <th className="py-3 px-4">Message Template</th>
                  <th className="py-3 px-3 w-28 text-center">Target</th>
                  <th className="py-3 px-3 w-20 text-center">Active</th>
                  <th className="py-3 px-3 w-32 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 text-sm">
                      No WhatsApp message templates found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map((tmpl, idx) => (
                    <tr key={tmpl.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span>💬</span> {tmpl.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 font-mono text-[11px]">{tmpl.voucherType}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{tmpl.label}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 leading-relaxed font-sans text-xs">
                        <div className="max-h-24 overflow-y-auto pr-2 bg-slate-50 p-2 rounded border border-slate-200/80 text-[11px] font-mono whitespace-pre-wrap">
                          {tmpl.message}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tmpl.sendTo === 'Owner' 
                            ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          {tmpl.sendTo === 'Owner' ? '🚨 Owner Alert' : '👤 Guest'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleActive(tmpl)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            tmpl.active === 'On'
                              ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                              : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
                          }`}
                          title={`Click to turn ${tmpl.active === 'On' ? 'Off' : 'On'}`}
                        >
                          {tmpl.active}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Send Test Button */}
                          <button
                            onClick={() => handleOpenTest(tmpl)}
                            className="w-7 h-7 rounded bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors shadow-sm"
                            title="Send Test WhatsApp"
                          >
                            🚀
                          </button>

                          {/* Edit Blue Icon matching RoomG Frame 0150 */}
                          <button
                            onClick={() => handleOpenEdit(tmpl)}
                            className="w-7 h-7 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-sm"
                            title="Edit Template"
                          >
                            ✏️
                          </button>

                          {/* Delete Red Icon matching RoomG Frame 0150 */}
                          <button
                            onClick={() => handleDeleteTemplate(tmpl.id, tmpl.voucherType)}
                            className="w-7 h-7 rounded bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-colors shadow-sm"
                            title="Delete Template"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 px-6 flex flex-wrap items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span>Showing {filteredTemplates.length} entries</span>
            <span>Gateway: <strong>DataHouse Cloud WhatsApp API</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded font-semibold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================================
          SUB-MODAL 1: EDIT / ADD TEMPLATE
      ====================================================================== */}
      {isEditModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-300 flex flex-col max-h-[94vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">✏️</span>
                <h3 className="text-lg font-bold">Edit WhatsApp Message Template</h3>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {editingTemplate.voucherType}
                </span>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Voucher Type</label>
                  <input
                    type="text"
                    value={editingTemplate.voucherType}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, voucherType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Check_out_store"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Display Label</label>
                  <input
                    type="text"
                    value={editingTemplate.label}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, label: e.target.value })}
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Guest Checkout Slip"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Recipient</label>
                  <select
                    value={editingTemplate.sendTo}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, sendTo: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Guest">Guest (Customer Mobile)</option>
                    <option value="Owner">Owner (Fraud Prevention Alert)</option>
                    <option value="Both">Both Guest & Owner</option>
                  </select>
                </div>
              </div>

              {/* Checkbox: Activate WhatsApp matching Frame 0180 */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="activateWhatsApp"
                  checked={editingTemplate.active === 'On'}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, active: e.target.checked ? 'On' : 'Off' })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="activateWhatsApp" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Activate WhatsApp Auto-Sending for this event
                </label>
              </div>

              {/* Variable Chips to click and insert */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Click to Insert Dynamic Placeholder Tags:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 border rounded-lg">
                  {[
                    'guest_name', 'room_no', 'voucher_no', 'checkout_date', 'checkin_date',
                    'total_billamount', 'advance_paid', 'balance_due', 'firm_name', 'phone',
                    'mobile', 'address1', 'city', 'pincode', 'name', 'email', 'website'
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertVariable(tag)}
                      className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-mono transition-colors"
                      title={`Insert {${tag}}`}
                    >
                      +{`{${tag}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Textarea matching Frame 0180 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp Message Body (Markdown formatted with *bold*, _italics_)
                </label>
                <textarea
                  rows={8}
                  value={editingTemplate.message}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, message: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-lg font-mono focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  placeholder="Enter message text with placeholders..."
                />
              </div>

              {/* Preview bubble */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Live Bubble Preview:</label>
                <div className="bg-[#e5ddd5] p-3 rounded-xl max-w-lg border border-[#c4b5a5]">
                  <div className="bg-white p-3 rounded-lg shadow-sm text-xs font-sans text-slate-800 leading-relaxed whitespace-pre-wrap border-l-4 border-emerald-500">
                    {PmsStore.renderWhatsAppMessage(editingTemplate.message, {
                      guest_name: 'Rahul Sharma',
                      room_no: '101',
                      voucher_no: 'RM/63/24-25',
                      checkout_date: '06-07-2025',
                      checkin_date: '05-07-2025',
                      total_billamount: '2400',
                      advance_paid: '500',
                      balance_due: '1900',
                      name: 'Reception Desk'
                    })}
                    <div className="text-[10px] text-slate-400 text-right mt-1">10:48 PM ✓✓</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 px-6 py-3 flex items-center justify-end gap-2 border-t">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              {/* Blue Update button matching Frame 0180 */}
              <button
                onClick={handleSaveEditing}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          SUB-MODAL 2: SEND PROMOTIONAL WHATSAPP
      ====================================================================== */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-300 flex flex-col">
            <div className="bg-emerald-700 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">📢</span>
                <h3 className="text-lg font-bold">Send Promotional WhatsApp</h3>
              </div>
              <button
                onClick={() => setIsPromoModalOpen(false)}
                className="text-emerald-200 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recipient Mobile Number (10 digits)</label>
                <div className="flex gap-2">
                  <span className="bg-slate-100 border px-3 py-2 rounded-lg font-bold text-slate-600">+91</span>
                  <input
                    type="text"
                    value={promoMobile}
                    onChange={(e) => setPromoMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                    placeholder="Enter guest 10-digit mobile number"
                    className="flex-1 px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Promotional Message Body</label>
                <textarea
                  rows={6}
                  value={promoMessage}
                  onChange={(e) => setPromoMessage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  placeholder="Enter promotional copy with website booking link..."
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-emerald-900 leading-relaxed">
                💡 <strong>Direct Instant Delivery:</strong> Clicking send will immediately format the message and launch WhatsApp Web or mobile app directly to dispatch without requiring QR scan repeatedly.
              </div>
            </div>

            <div className="bg-slate-100 px-6 py-3 flex items-center justify-end gap-2 border-t">
              <button
                onClick={() => setIsPromoModalOpen(false)}
                className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSendPromotional}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <span>🚀</span> Send Promotional WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          SUB-MODAL 3: SEND TEST DISPATCH
      ====================================================================== */}
      {isTestModalOpen && testTemplate && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-300 flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>🚀</span>
                <h3 className="text-base font-bold">Dispatch Test WhatsApp Notification</h3>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="p-2.5 bg-slate-100 rounded-lg border">
                <span className="font-semibold text-slate-800">Testing Template:</span>{' '}
                <span className="font-mono text-blue-700 font-bold">{testTemplate.voucherType}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">{testTemplate.label}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recipient Mobile Number</label>
                <input
                  type="text"
                  value={testMobile}
                  onChange={(e) => setTestMobile(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter 10-digit mobile number"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guest Name</label>
                  <input
                    type="text"
                    value={testGuestName}
                    onChange={(e) => setTestGuestName(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room No</label>
                  <input
                    type="text"
                    value={testRoomNo}
                    onChange={(e) => setTestRoomNo(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Voucher No</label>
                  <input
                    type="text"
                    value={testVoucherNo}
                    onChange={(e) => setTestVoucherNo(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bill Amount (₹)</label>
                  <input
                    type="text"
                    value={testBillAmount}
                    onChange={(e) => setTestBillAmount(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-100 px-6 py-3 flex items-center justify-end gap-2 border-t">
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTest}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-2"
              >
                <span>💬</span> Launch WhatsApp Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          SUB-MODAL 4: GATEWAY CONFIGURATION
      ====================================================================== */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-300 flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>⚙️</span>
                <h3 className="text-base font-bold">WhatsApp API Gateway Settings</h3>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cloud API Gateway Endpoint</label>
                <input
                  type="text"
                  value={config.apiUrl}
                  onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Instance ID</label>
                  <input
                    type="text"
                    value={config.instanceId}
                    onChange={(e) => setConfig({ ...config, instanceId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">API Secret Token</label>
                  <input
                    type="password"
                    value={config.token}
                    onChange={(e) => setConfig({ ...config, token: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-rose-700 mb-1">Owner Alert Mobile (Anti-Theft)</label>
                  <input
                    type="text"
                    value={config.ownerMobile}
                    onChange={(e) => setConfig({ ...config, ownerMobile: e.target.value })}
                    className="w-full px-3 py-2 border border-rose-300 rounded-lg font-mono font-bold text-rose-900 focus:ring-2 focus:ring-rose-500"
                    placeholder="Owner 10-digit number"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-emerald-700 mb-1">WhatsApp Validity Date</label>
                  <input
                    type="text"
                    value={config.validityDate}
                    onChange={(e) => setConfig({ ...config, validityDate: e.target.value })}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg font-mono font-bold text-emerald-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                <span className="font-bold text-slate-800 block">Automatic Dispatch Triggers:</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoSendOnCheckIn}
                      onChange={(e) => setConfig({ ...config, autoSendOnCheckIn: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <span>Auto Send Check-In Welcome</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoSendOnCheckOut}
                      onChange={(e) => setConfig({ ...config, autoSendOnCheckOut: e.target.checked })}
                      className="rounded text-emerald-600"
                    />
                    <span>Auto Send Checkout Bill</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoAlertOwnerOnDelete}
                      onChange={(e) => setConfig({ ...config, autoAlertOwnerOnDelete: e.target.checked })}
                      className="rounded text-rose-600"
                    />
                    <span className="text-rose-800 font-semibold">Alert Owner on Bill Delete</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoAlertOwnerOnUpdate}
                      onChange={(e) => setConfig({ ...config, autoAlertOwnerOnUpdate: e.target.checked })}
                      className="rounded text-rose-600"
                    />
                    <span className="text-rose-800 font-semibold">Alert Owner on Tariff Update</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 px-6 py-3 flex items-center justify-end gap-2 border-t">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
