import React, { useState, useEffect } from 'react';
import type { PmsGstMaster, PmsBusinessSource, PmsVoucherType, PmsLocker, PmsOtherCharge } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import './pmsStyles.css';

interface OtherMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'gst' | 'businessSource' | 'voucherType' | 'locker' | 'otherCharge';
}

export const OtherMasterModal: React.FC<OtherMasterModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'gst'
}) => {
  const [activeTab, setActiveTab] = useState<'gst' | 'businessSource' | 'voucherType' | 'locker' | 'otherCharge'>(initialTab);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Datasets
  const [gstMasters, setGstMasters] = useState<PmsGstMaster[]>([]);
  const [businessSources, setBusinessSources] = useState<PmsBusinessSource[]>([]);
  const [voucherTypes, setVoucherTypes] = useState<PmsVoucherType[]>([]);
  const [lockers, setLockers] = useState<PmsLocker[]>([]);
  const [otherCharges, setOtherCharges] = useState<PmsOtherCharge[]>([]);

  // Locker Modal
  const [isLockerModalOpen, setIsLockerModalOpen] = useState(false);
  const [editingLocker, setEditingLocker] = useState<PmsLocker | null>(null);
  const [formLockerNo, setFormLockerNo] = useState('');
  const [formLockerSize, setFormLockerSize] = useState<'Small' | 'Medium' | 'Large' | 'Executive Vault'>('Small');
  const [formDailyRate, setFormDailyRate] = useState<number>(150);
  const [formLockerStatus, setFormLockerStatus] = useState<'Vacant' | 'Occupied' | 'Under Maintenance'>('Vacant');
  const [formKeyNumber, setFormKeyNumber] = useState('');
  const [formSecurityDeposit, setFormSecurityDeposit] = useState<number>(500);
  const [formAssignedGuest, setFormAssignedGuest] = useState('');
  const [formAssignedRoom, setFormAssignedRoom] = useState('');

  // Other Charge Modal
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<PmsOtherCharge | null>(null);
  const [formChargeName, setFormChargeName] = useState('');
  const [formCategory, setFormCategory] = useState<'Room' | 'F&B' | 'Housekeeping' | 'Travel' | 'Banquet'>('Room');
  const [formDefaultRate, setFormDefaultRate] = useState<number>(500);
  const [formGstRate, setFormGstRate] = useState<number>(12);
  const [formHsnCode, setFormHsnCode] = useState('996311');
  const [formIsTaxIncluded, setFormIsTaxIncluded] = useState(true);
  const [formChargeRemark, setFormChargeRemark] = useState('');

  // GST Modal
  const [isGstModalOpen, setIsGstModalOpen] = useState(false);
  const [editingGst, setEditingGst] = useState<PmsGstMaster | null>(null);
  const [formGstName, setFormGstName] = useState('');
  const [formHsnNo, setFormHsnNo] = useState('996311');
  const [formSgst, setFormSgst] = useState<number>(6.0);
  const [formCgst, setFormCgst] = useState<number>(6.0);
  const [formIgst, setFormIgst] = useState<number>(12.0);
  const [formVat, setFormVat] = useState<number>(0.0);

  // Business Source Modal
  const [isBsModalOpen, setIsBsModalOpen] = useState(false);
  const [editingBs, setEditingBs] = useState<PmsBusinessSource | null>(null);
  const [formBsName, setFormBsName] = useState('');
  const [formBsRemark, setFormBsRemark] = useState('');

  // Voucher Type Modal
  const [isVtModalOpen, setIsVtModalOpen] = useState(false);
  const [editingVt, setEditingVt] = useState<PmsVoucherType | null>(null);
  const [formVtName, setFormVtName] = useState('');
  const [formStartingNumber, setFormStartingNumber] = useState<number>(100);
  const [formPrefix, setFormPrefix] = useState('SR/');
  const [formSuffix, setFormSuffix] = useState('/24-25');
  const [formNumberingStyle, setFormNumberingStyle] = useState<'Continue' | 'Yearly'>('Continue');
  const [formPrintName, setFormPrintName] = useState('Check In');
  const [formVtRemark, setFormVtRemark] = useState('');

  const refreshData = () => {
    setGstMasters(PmsStore.getGstMasters());
    setBusinessSources(PmsStore.getBusinessSources());
    setVoucherTypes(PmsStore.getVoucherTypes());
    setLockers(PmsStore.getLockers());
    setOtherCharges(PmsStore.getOtherCharges());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setActiveTab(initialTab);
      setSuccessBanner(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Handlers for GST
  const handleOpenGstModal = (g?: PmsGstMaster) => {
    if (g) {
      setEditingGst(g);
      setFormGstName(g.name);
      setFormHsnNo(g.hsnNo);
      setFormSgst(g.sgst);
      setFormCgst(g.cgst);
      setFormIgst(g.igst);
      setFormVat(g.vat);
    } else {
      setEditingGst(null);
      setFormGstName('GST 18%');
      setFormHsnNo('996311');
      setFormSgst(9.0);
      setFormCgst(9.0);
      setFormIgst(18.0);
      setFormVat(0.0);
    }
    setIsGstModalOpen(true);
  };

  const handleSaveGst = (e: React.FormEvent) => {
    e.preventDefault();
    const newGst: PmsGstMaster = {
      id: editingGst ? editingGst.id : `gst-${Date.now()}`,
      name: formGstName.trim(),
      hsnNo: formHsnNo.trim() || '0',
      sgst: Number(formSgst) || 0,
      cgst: Number(formCgst) || 0,
      igst: Number(formIgst) || 0,
      vat: Number(formVat) || 0
    };
    PmsStore.saveGstMaster(newGst);
    setSuccessBanner('GST / Tax Slab saved successfully!');
    setIsGstModalOpen(false);
    refreshData();
  };

  const handleDeleteGst = (id: string, name: string) => {
    if (window.confirm(`Delete GST record "${name}"?`)) {
      PmsStore.deleteGstMaster(id);
      setSuccessBanner(`Deleted ${name}`);
      refreshData();
    }
  };

  // Handlers for Business Source
  const handleOpenBsModal = (b?: PmsBusinessSource) => {
    if (b) {
      setEditingBs(b);
      setFormBsName(b.name);
      setFormBsRemark(b.remark);
    } else {
      setEditingBs(null);
      setFormBsName('');
      setFormBsRemark('Online Travel Agency');
    }
    setIsBsModalOpen(true);
  };

  const handleSaveBs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBsName.trim()) {
      alert('Enter Business Source Name');
      return;
    }
    const newBs: PmsBusinessSource = {
      id: editingBs ? editingBs.id : `bs-${Date.now()}`,
      name: formBsName.trim(),
      remark: formBsRemark.trim()
    };
    PmsStore.saveBusinessSource(newBs);
    setSuccessBanner('Business Source created successfully!');
    setIsBsModalOpen(false);
    refreshData();
  };

  const handleDeleteBs = (id: string, name: string) => {
    if (window.confirm(`Delete Business Source "${name}"?`)) {
      PmsStore.deleteBusinessSource(id);
      setSuccessBanner(`Deleted ${name}`);
      refreshData();
    }
  };

  // Handlers for Voucher Type
  const handleOpenVtModal = (v: PmsVoucherType) => {
    setEditingVt(v);
    setFormVtName(v.voucherTypeName);
    setFormStartingNumber(v.startingNumber);
    setFormPrefix(v.prefix);
    setFormSuffix(v.suffix);
    setFormNumberingStyle(v.numberingStyle);
    setFormPrintName(v.printName);
    setFormVtRemark(v.remark);
    setIsVtModalOpen(true);
  };

  const handleSaveVt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVt) return;
    const updated: PmsVoucherType = {
      ...editingVt,
      startingNumber: Number(formStartingNumber) || 1,
      prefix: formPrefix.trim(),
      suffix: formSuffix.trim(),
      numberingStyle: formNumberingStyle,
      printName: formPrintName.trim(),
      remark: formVtRemark.trim()
    };
    PmsStore.updateVoucherType(updated);
    setSuccessBanner('Voucher Type updated successfully!');
    setIsVtModalOpen(false);
    refreshData();
  };

  // Handlers for Lockers
  const handleOpenLockerModal = (locker?: PmsLocker) => {
    if (locker) {
      setEditingLocker(locker);
      setFormLockerNo(locker.lockerNo);
      setFormLockerSize(locker.lockerSize);
      setFormDailyRate(locker.dailyRate);
      setFormLockerStatus(locker.status);
      setFormKeyNumber(locker.keyNumber);
      setFormSecurityDeposit(locker.securityDeposit);
      setFormAssignedGuest(locker.assignedGuestName || '');
      setFormAssignedRoom(locker.assignedRoomNo || '');
    } else {
      setEditingLocker(null);
      setFormLockerNo(`L-${100 + lockers.length + 1}`);
      setFormLockerSize('Small');
      setFormDailyRate(150);
      setFormLockerStatus('Vacant');
      setFormKeyNumber(`K-${100 + lockers.length + 1}`);
      setFormSecurityDeposit(500);
      setFormAssignedGuest('');
      setFormAssignedRoom('');
    }
    setIsLockerModalOpen(true);
  };

  const handleSaveLocker = (e: React.FormEvent) => {
    e.preventDefault();
    const locker: PmsLocker = {
      id: editingLocker ? editingLocker.id : `loc-${Date.now()}`,
      lockerNo: formLockerNo.trim(),
      lockerSize: formLockerSize,
      dailyRate: Number(formDailyRate) || 0,
      status: formLockerStatus,
      keyNumber: formKeyNumber.trim() || `K-${formLockerNo}`,
      securityDeposit: Number(formSecurityDeposit) || 0,
      assignedGuestName: formAssignedGuest.trim() || undefined,
      assignedRoomNo: formAssignedRoom.trim() || undefined
    };
    PmsStore.saveLocker(locker);
    refreshData();
    setIsLockerModalOpen(false);
    setSuccessBanner(`Locker ${locker.lockerNo} successfully ${editingLocker ? 'updated' : 'added'}.`);
  };

  const handleDeleteLocker = (id: string, no: string) => {
    if (window.confirm(`Are you sure you want to remove Locker "${no}"?`)) {
      PmsStore.deleteLocker(id);
      refreshData();
      setSuccessBanner(`Locker ${no} deleted.`);
    }
  };

  // Handlers for Other Charges
  const handleOpenChargeModal = (charge?: PmsOtherCharge) => {
    if (charge) {
      setEditingCharge(charge);
      setFormChargeName(charge.chargeName);
      setFormCategory(charge.category);
      setFormDefaultRate(charge.defaultRate);
      setFormGstRate(charge.gstRate);
      setFormHsnCode(charge.hsnCode);
      setFormIsTaxIncluded(charge.isTaxIncluded);
      setFormChargeRemark(charge.remark || '');
    } else {
      setEditingCharge(null);
      setFormChargeName('');
      setFormCategory('Room');
      setFormDefaultRate(500);
      setFormGstRate(12);
      setFormHsnCode('996311');
      setFormIsTaxIncluded(true);
      setFormChargeRemark('');
    }
    setIsChargeModalOpen(true);
  };

  const handleSaveCharge = (e: React.FormEvent) => {
    e.preventDefault();
    const charge: PmsOtherCharge = {
      id: editingCharge ? editingCharge.id : `chg-${Date.now()}`,
      chargeName: formChargeName.trim(),
      category: formCategory,
      defaultRate: Number(formDefaultRate) || 0,
      gstRate: Number(formGstRate) || 0,
      hsnCode: formHsnCode.trim() || '996311',
      isTaxIncluded: formIsTaxIncluded,
      remark: formChargeRemark.trim() || undefined
    };
    PmsStore.saveOtherCharge(charge);
    refreshData();
    setIsChargeModalOpen(false);
    setSuccessBanner(`Charge "${charge.chargeName}" saved successfully.`);
  };

  const handleDeleteCharge = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove charge "${name}"?`)) {
      PmsStore.deleteOtherCharge(id);
      refreshData();
      setSuccessBanner(`Charge "${name}" removed.`);
    }
  };

  return (
    <div className="pms-overlay" onClick={onClose}>
      <div className="pms-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 1100, height: '88vh' }}>
        {/* Header */}
        <header className="pms-header" style={{ background: '#212529', color: '#fff' }}>
          <div className="pms-header-left">
            <span style={{ fontSize: 16 }}>⚙️</span>
            <h2 className="pms-brand-title" style={{ fontSize: 15 }}>
              HOTEL SAI VASUDEV RESIDENCY &bull; MASTER &bull; OTHER CONFIGURATIONS
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

        {/* Tab Strip */}
        <div style={{ background: '#f8f9fa', padding: '10px 18px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { setActiveTab('gst'); setSuccessBanner(null); }}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #ced4da',
                borderRadius: 4,
                cursor: 'pointer',
                background: activeTab === 'gst' ? '#0d6efd' : '#fff',
                color: activeTab === 'gst' ? '#fff' : '#495057'
              }}
            >
              ⚖️ GST / TAX Master ({gstMasters.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('businessSource'); setSuccessBanner(null); }}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #ced4da',
                borderRadius: 4,
                cursor: 'pointer',
                background: activeTab === 'businessSource' ? '#0d6efd' : '#fff',
                color: activeTab === 'businessSource' ? '#fff' : '#495057'
              }}
            >
              🌐 Business Source ({businessSources.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('voucherType'); setSuccessBanner(null); }}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #ced4da',
                borderRadius: 4,
                cursor: 'pointer',
                background: activeTab === 'voucherType' ? '#0d6efd' : '#fff',
                color: activeTab === 'voucherType' ? '#fff' : '#495057'
              }}
            >
              📄 Voucher Type ({voucherTypes.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('locker'); setSuccessBanner(null); }}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #ced4da',
                borderRadius: 4,
                cursor: 'pointer',
                background: activeTab === 'locker' ? '#0d6efd' : '#fff',
                color: activeTab === 'locker' ? '#fff' : '#495057'
              }}
            >
              🔒 Lockers (Safe Deposit) ({lockers.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('otherCharge'); setSuccessBanner(null); }}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #ced4da',
                borderRadius: 4,
                cursor: 'pointer',
                background: activeTab === 'otherCharge' ? '#0d6efd' : '#fff',
                color: activeTab === 'otherCharge' ? '#fff' : '#495057'
              }}
            >
              ➕ Other Charges ({otherCharges.length})
            </button>
          </div>

          <div>
            {activeTab === 'gst' && (
              <button
                type="button"
                onClick={() => handleOpenGstModal()}
                style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                + Add New GST / VAT / TAX %
              </button>
            )}
            {activeTab === 'businessSource' && (
              <button
                type="button"
                onClick={() => handleOpenBsModal()}
                style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                + Add New Business Source
              </button>
            )}
            {activeTab === 'locker' && (
              <button
                type="button"
                onClick={() => handleOpenLockerModal()}
                style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                + Add Safe Deposit Locker
              </button>
            )}
            {activeTab === 'otherCharge' && (
              <button
                type="button"
                onClick={() => handleOpenChargeModal()}
                style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                + Add New Other Charge
              </button>
            )}
          </div>
        </div>

        {/* Success Banner */}
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

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 18, background: '#fff' }}>
          {/* TAB 1: GST / VAT / TAX MASTER (Frame 0920) */}
          {activeTab === 'gst' && (
            <div>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#333' }}>GST / VAT / TAX Master</h3>
                <span style={{ fontSize: 12, color: '#6c757d' }}>Endpoint: pms.hotelsai-vasudev.com/gstmasters</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left', color: '#495057' }}>
                    <th style={{ padding: '8px 10px', width: 60 }}>S.No</th>
                    <th style={{ padding: '8px 10px' }}>NAME</th>
                    <th style={{ padding: '8px 10px' }}>HSN No</th>
                    <th style={{ padding: '8px 10px' }}>SGST %</th>
                    <th style={{ padding: '8px 10px' }}>CGST %</th>
                    <th style={{ padding: '8px 10px' }}>IGST %</th>
                    <th style={{ padding: '8px 10px' }}>VAT %</th>
                    <th style={{ padding: '8px 10px', width: 90, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {gstMasters.map((g, idx) => (
                    <tr key={g.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '8px 10px', color: '#6c757d' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{g.name}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{g.hsnNo}</td>
                      <td style={{ padding: '8px 10px' }}>{g.sgst.toFixed(4)}</td>
                      <td style={{ padding: '8px 10px' }}>{g.cgst.toFixed(4)}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#16a34a' }}>{g.igst.toFixed(4)}</td>
                      <td style={{ padding: '8px 10px' }}>{g.vat.toFixed(4)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenGstModal(g)}
                            style={{ background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGst(g.id, g.name)}
                            style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}
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
          )}

          {/* TAB 2: BUSINESS SOURCE MASTER (Frame 0980, 0990) */}
          {activeTab === 'businessSource' && (
            <div>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#333' }}>Business Source</h3>
                <span style={{ fontSize: 12, color: '#6c757d' }}>Endpoint: pms.hotelsai-vasudev.com/businesssources</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left', color: '#495057' }}>
                    <th style={{ padding: '8px 10px', width: 60 }}>S.No</th>
                    <th style={{ padding: '8px 10px', width: 280 }}>Business Source Name</th>
                    <th style={{ padding: '8px 10px' }}>Remark</th>
                    <th style={{ padding: '8px 10px', width: 90, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {businessSources.map((bs, idx) => (
                    <tr key={bs.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '8px 10px', color: '#6c757d' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{bs.name}</td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>{bs.remark}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenBsModal(bs)}
                            style={{ background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBs(bs.id, bs.name)}
                            style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}
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
          )}

          {/* TAB 3: VOUCHER TYPE MASTER (Frame 1000) */}
          {activeTab === 'voucherType' && (
            <div>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#333' }}>Voucher Type Configurations</h3>
                <span style={{ fontSize: 12, color: '#6c757d' }}>Endpoint: pms.hotelsai-vasudev.com/voucher_types</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left', color: '#495057' }}>
                    <th style={{ padding: '8px 10px', width: 60 }}>S.No</th>
                    <th style={{ padding: '8px 10px', width: 180 }}>Voucher Type</th>
                    <th style={{ padding: '8px 10px', width: 110 }}>Start No</th>
                    <th style={{ padding: '8px 10px', width: 100 }}>Prefix</th>
                    <th style={{ padding: '8px 10px', width: 100 }}>Suffix</th>
                    <th style={{ padding: '8px 10px', width: 120 }}>Numbering Style</th>
                    <th style={{ padding: '8px 10px' }}>Voucher Print Name</th>
                    <th style={{ padding: '8px 10px', width: 80, textAlign: 'center' }}>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {voucherTypes.map((vt, idx) => (
                    <tr key={vt.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '8px 10px', color: '#6c757d' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{vt.voucherTypeName}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#0369a1', fontWeight: 600 }}>{vt.startingNumber}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{vt.prefix}</td>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{vt.suffix}</td>
                      <td style={{ padding: '8px 10px' }}>{vt.numberingStyle}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#16a34a' }}>{vt.printName}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenVtModal(vt)}
                          style={{ background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 3, padding: '3px 10px', cursor: 'pointer', fontSize: 11 }}
                        >
                          ✎ Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: LOCKER MASTER (SAFE DEPOSIT) */}
          {activeTab === 'locker' && (
            <div>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#333' }}>Safe Deposit Lockers</h3>
                <span style={{ fontSize: 12, color: '#6c757d' }}>Security Deposit Vault &bull; Front Office</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left', color: '#495057' }}>
                    <th style={{ padding: '8px 10px', width: 50 }}>S.No</th>
                    <th style={{ padding: '8px 10px', width: 110 }}>Locker No</th>
                    <th style={{ padding: '8px 10px', width: 130 }}>Size</th>
                    <th style={{ padding: '8px 10px', width: 110 }}>Daily Rate</th>
                    <th style={{ padding: '8px 10px', width: 100 }}>Key No</th>
                    <th style={{ padding: '8px 10px', width: 130 }}>Deposit</th>
                    <th style={{ padding: '8px 10px', width: 120 }}>Status</th>
                    <th style={{ padding: '8px 10px' }}>Assigned Guest / Room</th>
                    <th style={{ padding: '8px 10px', width: 100, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lockers.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#6c757d' }}>No lockers configured. Click "+ Add Safe Deposit Locker" above.</td>
                    </tr>
                  ) : (
                    lockers.map((loc, idx) => (
                      <tr key={loc.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '8px 10px', color: '#6c757d' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{loc.lockerNo}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#e0f2fe', color: '#0369a1' }}>
                            {loc.lockerSize}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#16a34a' }}>₹{loc.dailyRate} / day</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{loc.keyNumber}</td>
                        <td style={{ padding: '8px 10px' }}>₹{loc.securityDeposit}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            background: loc.status === 'Vacant' ? '#dcfce7' : loc.status === 'Occupied' ? '#fee2e2' : '#fef3c7',
                            color: loc.status === 'Vacant' ? '#15803d' : loc.status === 'Occupied' ? '#b91c1c' : '#b45309'
                          }}>
                            {loc.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', color: loc.assignedGuestName ? '#1e293b' : '#94a3b8' }}>
                          {loc.assignedGuestName ? `${loc.assignedGuestName} (${loc.assignedRoomNo ? `Room ${loc.assignedRoomNo}` : 'Guest'})` : '—'}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenLockerModal(loc)}
                              style={{ background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLocker(loc.id, loc.lockerNo)}
                              style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: OTHER CHARGES MASTER */}
          {activeTab === 'otherCharge' && (
            <div>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#333' }}>Additional Services &amp; Surcharges</h3>
                <span style={{ fontSize: 12, color: '#6c757d' }}>HSN/SAC &bull; GST Linked Billing Add-ons</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left', color: '#495057' }}>
                    <th style={{ padding: '8px 10px', width: 50 }}>S.No</th>
                    <th style={{ padding: '8px 10px', width: 220 }}>Charge Description</th>
                    <th style={{ padding: '8px 10px', width: 120 }}>Category</th>
                    <th style={{ padding: '8px 10px', width: 110 }}>Rate (₹)</th>
                    <th style={{ padding: '8px 10px', width: 90 }}>GST %</th>
                    <th style={{ padding: '8px 10px', width: 90 }}>HSN/SAC</th>
                    <th style={{ padding: '8px 10px', width: 100 }}>Tax Inc.</th>
                    <th style={{ padding: '8px 10px' }}>Remark / Description</th>
                    <th style={{ padding: '8px 10px', width: 100, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {otherCharges.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#6c757d' }}>No other charges configured. Click "+ Add New Other Charge" above.</td>
                    </tr>
                  ) : (
                    otherCharges.map((chg, idx) => (
                      <tr key={chg.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '8px 10px', color: '#6c757d' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{chg.chargeName}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#f1f5f9', color: '#475569' }}>
                            {chg.category}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0369a1' }}>₹{chg.defaultRate}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#16a34a' }}>{chg.gstRate}%</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{chg.hsnCode}</td>
                        <td style={{ padding: '8px 10px' }}>{chg.isTaxIncluded ? '✓ Yes' : 'No'}</td>
                        <td style={{ padding: '8px 10px', color: '#64748b', fontSize: 12 }}>{chg.remark || '—'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenChargeModal(chg)}
                              style={{ background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCharge(chg.id, chg.chargeName)}
                              style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ background: '#f8f9fa', padding: '10px 18px', borderTop: '1px solid #dee2e6', fontSize: 12, color: '#6c757d', textAlign: 'right' }}>
          HOTEL SAI VASUDEV RESIDENCY &bull; SHIRDI PMS SYSTEM
        </div>
      </div>

      {/* ========================================================= */}
      {/* VOUCHER TYPE EDIT MODAL (Exact Replica of Frame 1000)      */}
      {/* ========================================================= */}
      {isVtModalOpen && editingVt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setIsVtModalOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              width: 520,
              maxWidth: '95vw',
              borderRadius: 6,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#212529' }}>
                Voucher Type Edit
              </h3>
              <button
                type="button"
                onClick={() => setIsVtModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6c757d' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVt} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Voucher Type Name</label>
                <input
                  type="text"
                  value={formVtName}
                  disabled
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4, background: '#f1f5f9', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Starting Number</label>
                <input
                  type="number"
                  value={formStartingNumber}
                  onChange={e => setFormStartingNumber(Number(e.target.value))}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Voucher Prefix</label>
                  <input
                    type="text"
                    value={formPrefix}
                    onChange={e => setFormPrefix(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Voucher Suffix</label>
                  <input
                    type="text"
                    value={formSuffix}
                    onChange={e => setFormSuffix(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Numbring Style</label>
                <select
                  value={formNumberingStyle}
                  onChange={e => setFormNumberingStyle(e.target.value as any)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                >
                  <option value="Continue">Continue</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Voucher Print Name</label>
                <input
                  type="text"
                  value={formPrintName}
                  onChange={e => setFormPrintName(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Voucher Remark</label>
                <input
                  type="text"
                  value={formVtRemark}
                  onChange={e => setFormVtRemark(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                />
              </div>

              {/* Frame 1000 Blue Update Button */}
              <div style={{ marginTop: 10 }}>
                <button
                  type="submit"
                  style={{
                    background: '#0d6efd',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 24px',
                    borderRadius: 4,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* BUSINESS SOURCE ADD MODAL (Frame 0980)                     */}
      {/* ========================================================= */}
      {isBsModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setIsBsModalOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              width: 440,
              maxWidth: '95vw',
              borderRadius: 6,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#212529' }}>
                {editingBs ? 'Edit Business Source' : 'Add Business Source'}
              </h3>
              <button
                type="button"
                onClick={() => setIsBsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6c757d' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBs} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Business Source Name</label>
                <input
                  type="text"
                  placeholder="e.g. AGODA, OYO, Make My Trip"
                  value={formBsName}
                  onChange={e => setFormBsName(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Remark</label>
                <input
                  type="text"
                  placeholder="e.g. Online Travel Agency, Direct Booking"
                  value={formBsRemark}
                  onChange={e => setFormBsRemark(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid #dee2e6' }}>
                <button
                  type="button"
                  onClick={() => setIsBsModalOpen(false)}
                  style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '6px 18px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* GST ADD / EDIT MODAL (Frame 0920)                          */}
      {/* ========================================================= */}
      {isGstModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setIsGstModalOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              width: 440,
              maxWidth: '95vw',
              borderRadius: 6,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#212529' }}>
                {editingGst ? 'Edit GST / TAX Slab' : 'Add New GST / VAT / TAX %'}
              </h3>
              <button
                type="button"
                onClick={() => setIsGstModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6c757d' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGst} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Tax Name</label>
                <input
                  type="text"
                  placeholder="e.g. GST 12%"
                  value={formGstName}
                  onChange={e => setFormGstName(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>HSN / SAC No</label>
                <input
                  type="text"
                  value={formHsnNo}
                  onChange={e => setFormHsnNo(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>SGST %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formSgst}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setFormSgst(v);
                      setFormCgst(v);
                      setFormIgst(v * 2);
                    }}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>CGST %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCgst}
                    onChange={e => setFormCgst(Number(e.target.value))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>IGST %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formIgst}
                    onChange={e => setFormIgst(Number(e.target.value))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>VAT %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formVat}
                    onChange={e => setFormVat(Number(e.target.value))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid #dee2e6' }}>
                <button
                  type="button"
                  onClick={() => setIsGstModalOpen(false)}
                  style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '6px 18px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LOCKER ADD / EDIT MODAL                                    */}
      {/* ========================================================= */}
      {isLockerModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setIsLockerModalOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              width: 520,
              maxWidth: '95vw',
              borderRadius: 6,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#212529' }}>
                {editingLocker ? 'Edit Safe Deposit Locker' : 'Add New Safe Deposit Locker'}
              </h3>
              <button
                type="button"
                onClick={() => setIsLockerModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6c757d' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLocker} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Locker Number</label>
                  <input
                    type="text"
                    value={formLockerNo}
                    onChange={e => setFormLockerNo(e.target.value)}
                    placeholder="e.g. L-101"
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4, fontWeight: 600 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Locker Size</label>
                  <select
                    value={formLockerSize}
                    onChange={e => setFormLockerSize(e.target.value as any)}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                  >
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                    <option value="Executive Vault">Executive Vault</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Daily Rate (₹)</label>
                  <input
                    type="number"
                    value={formDailyRate}
                    onChange={e => setFormDailyRate(Number(e.target.value))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={formSecurityDeposit}
                    onChange={e => setFormSecurityDeposit(Number(e.target.value))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Key / Tag Number</label>
                  <input
                    type="text"
                    value={formKeyNumber}
                    onChange={e => setFormKeyNumber(e.target.value)}
                    placeholder="e.g. K-101"
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Status</label>
                  <select
                    value={formLockerStatus}
                    onChange={e => setFormLockerStatus(e.target.value as any)}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                  >
                    <option value="Vacant">Vacant</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>

              {formLockerStatus === 'Occupied' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#f8fafc', padding: 10, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Guest Name</label>
                    <input
                      type="text"
                      value={formAssignedGuest}
                      onChange={e => setFormAssignedGuest(e.target.value)}
                      placeholder="e.g. Ramesh Patil"
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #ced4da', borderRadius: 4 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Room Number</label>
                    <input
                      type="text"
                      value={formAssignedRoom}
                      onChange={e => setFormAssignedRoom(e.target.value)}
                      placeholder="e.g. 101"
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #ced4da', borderRadius: 4 }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid #dee2e6' }}>
                <button
                  type="button"
                  onClick={() => setIsLockerModalOpen(false)}
                  style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '6px 18px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  Save Locker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* OTHER CHARGE ADD / EDIT MODAL                              */}
      {/* ========================================================= */}
      {isChargeModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setIsChargeModalOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              width: 520,
              maxWidth: '95vw',
              borderRadius: 6,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#212529' }}>
                {editingCharge ? 'Edit Additional Charge' : 'Add New Additional Charge'}
              </h3>
              <button
                type="button"
                onClick={() => setIsChargeModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6c757d' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCharge} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Charge Description / Name</label>
                <input
                  type="text"
                  value={formChargeName}
                  onChange={e => setFormChargeName(e.target.value)}
                  placeholder="e.g. Extra Bed / Rollaway Mattress"
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4, fontWeight: 600 }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                  >
                    <option value="Room">Room</option>
                    <option value="F&B">F&amp;B</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Travel">Travel</option>
                    <option value="Banquet">Banquet</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Default Rate (₹)</label>
                  <input
                    type="number"
                    value={formDefaultRate}
                    onChange={e => setFormDefaultRate(Number(e.target.value))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>GST Rate %</label>
                  <select
                    value={formGstRate}
                    onChange={e => setFormGstRate(Number(e.target.value))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>HSN / SAC Code</label>
                  <input
                    type="text"
                    value={formHsnCode}
                    onChange={e => setFormHsnCode(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="formIsTaxIncluded"
                  checked={formIsTaxIncluded}
                  onChange={e => setFormIsTaxIncluded(e.target.checked)}
                />
                <label htmlFor="formIsTaxIncluded" style={{ fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                  Rate is Inclusive of Tax
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Remark / Scope of Service</label>
                <input
                  type="text"
                  value={formChargeRemark}
                  onChange={e => setFormChargeRemark(e.target.value)}
                  placeholder="e.g. Standard pilgrim rollaway bed with clean linen"
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid #dee2e6' }}>
                <button
                  type="button"
                  onClick={() => setIsChargeModalOpen(false)}
                  style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '6px 18px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  Save Charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
