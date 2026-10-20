import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { PmsChainProperty } from '../../types/pmsModels';
import './pmsStyles.css';

interface ChainPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProperty?: (property: PmsChainProperty) => void;
  onOpenUsers?: () => void;
  onOpenRoles?: () => void;
}

export const ChainPropertyModal: React.FC<ChainPropertyModalProps> = ({
  isOpen,
  onClose,
  onSelectProperty,
  onOpenUsers,
  onOpenRoles
}) => {
  const [properties, setProperties] = useState<PmsChainProperty[]>([]);
  const [currentProperty, setCurrentProperty] = useState<PmsChainProperty | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Add / Edit Property Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProp, setEditingProp] = useState<PmsChainProperty | null>(null);
  const [formFirmId, setFormFirmId] = useState('');
  const [formFirmName, setFormFirmName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formTotalRooms, setFormTotalRooms] = useState<number>(30);
  const [formActivationDate, setFormActivationDate] = useState('');
  const [formRenewDate, setFormRenewDate] = useState('');
  const [formWhatsAppValidity, setFormWhatsAppValidity] = useState('');

  const refreshData = () => {
    const list = PmsStore.getProperties();
    setProperties(list);
    const curr = PmsStore.getCurrentProperty();
    setCurrentProperty(curr);
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setSuccessBanner(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSwitchProperty = (prop: PmsChainProperty) => {
    PmsStore.setCurrentProperty(prop.firmId);
    refreshData();
    setSuccessBanner(`Switched active branch to ${prop.firmId} - ${prop.firmName} (${prop.location})`);
    if (onSelectProperty) {
      onSelectProperty(prop);
    }
    setTimeout(() => {
      setSuccessBanner(null);
    }, 4000);
  };

  const handleOpenAdd = () => {
    setEditingProp(null);
    const newId = `SVR000${properties.length + 1}`;
    setFormFirmId(newId);
    setFormFirmName('HOTEL SAI VASUDEV RESIDENCY');
    setFormLocation('Mumbai Highway Branch');
    setFormAddress('Near Sai Teerth, Shirdi, Maharashtra - 423109');
    setFormPhone('+91 98765 43210');
    setFormEmail('residency@saivasudev.com');
    setFormGstin('27AAACH1234F1Z8');
    setFormTotalRooms(24);
    setFormActivationDate(new Date().toISOString().slice(0, 10));
    setFormRenewDate('2028-03-31');
    setFormWhatsAppValidity('2028-03-31');
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (prop: PmsChainProperty) => {
    setEditingProp(prop);
    setFormFirmId(prop.firmId);
    setFormFirmName(prop.firmName);
    setFormLocation(prop.location);
    setFormAddress(prop.address);
    setFormPhone(prop.phone);
    setFormEmail(prop.email);
    setFormGstin(prop.gstin);
    setFormTotalRooms(prop.totalRooms);
    setFormActivationDate(prop.activationDate);
    setFormRenewDate(prop.renewDate);
    setFormWhatsAppValidity(prop.whatsAppValidity);
    setIsEditModalOpen(true);
  };

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFirmId.trim() || !formFirmName.trim()) {
      alert('Firm ID and Firm Name are required.');
      return;
    }

    const currentList = PmsStore.getProperties();
    const existingIndex = currentList.findIndex(p => p.firmId.toUpperCase() === formFirmId.trim().toUpperCase());

    const updatedItem: PmsChainProperty = {
      firmId: formFirmId.trim().toUpperCase(),
      firmName: formFirmName.trim(),
      location: formLocation.trim(),
      address: formAddress.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      gstin: formGstin.trim().toUpperCase(),
      totalRooms: Number(formTotalRooms) || 20,
      activationDate: formActivationDate || new Date().toISOString().slice(0, 10),
      renewDate: formRenewDate || '2028-03-31',
      whatsAppValidity: formWhatsAppValidity || '2028-03-31',
      isCurrent: editingProp ? editingProp.isCurrent : false
    };

    if (existingIndex >= 0) {
      currentList[existingIndex] = updatedItem;
      setSuccessBanner(`Branch ${updatedItem.firmId} updated successfully.`);
    } else {
      currentList.push(updatedItem);
      setSuccessBanner(`New branch ${updatedItem.firmId} added to your chain.`);
    }

    PmsStore.saveProperties(currentList);
    refreshData();
    setIsEditModalOpen(false);
  };

  const handleDeleteProperty = (firmId: string) => {
    if (firmId === 'DEMO0004') {
      alert('Default primary property (DEMO0004) cannot be deleted.');
      return;
    }
    if (currentProperty?.firmId === firmId) {
      alert('Cannot delete the currently active branch. Please switch to another branch first.');
      return;
    }
    if (!confirm(`Are you sure you want to delete property branch ${firmId}?`)) return;

    const filtered = properties.filter(p => p.firmId !== firmId);
    PmsStore.saveProperties(filtered);
    refreshData();
    setSuccessBanner(`Branch ${firmId} removed from chain.`);
  };

  const filteredProperties = properties.filter(p =>
    p.firmId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.firmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Consolidated Chain KPIs
  const totalChainRooms = properties.reduce((acc, p) => acc + (p.totalRooms || 0), 0);
  const chainPropertiesCount = properties.length;

  return (
    <div className="pms-modal-backdrop" style={{ zIndex: 1100 }}>
      <div
        className="pms-modal-container"
        style={{
          maxWidth: '1240px',
          width: '95vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
        }}
      >
        {/* Header Bar matching RoomG Video 21 */}
        <div
          style={{
            backgroundColor: '#1e293b',
            color: '#ffffff',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #0f172a'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🏨</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.5px' }}>
                Multi-Location & Chain Property Management
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Multi-Branch Architecture • Active Property Context Switching
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onOpenUsers && (
              <button
                onClick={onOpenUsers}
                style={{
                  backgroundColor: '#eab308',
                  color: '#000000',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                👥 User Setting (/userprofile)
              </button>
            )}
            {onOpenRoles && (
              <button
                onClick={onOpenRoles}
                style={{
                  backgroundColor: '#06b6d4',
                  color: '#ffffff',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🛡️ Roles & Permissions (/roles)
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: 'none',
                fontSize: '22px',
                cursor: 'pointer',
                lineHeight: 1
              }}
              title="Close Modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div
            style={{
              backgroundColor: '#ecfdf5',
              borderBottom: '1px solid #6ee7b7',
              color: '#065f46',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>✓ {successBanner}</span>
            <button
              onClick={() => setSuccessBanner(null)}
              style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
          {/* Active Property Highlight Card */}
          {currentProperty && (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                padding: '16px 20px',
                marginBottom: '20px',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    backgroundColor: '#dbeafe',
                    color: '#1d4ed8',
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 700
                  }}
                >
                  🏨
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        letterSpacing: '0.5px'
                      }}
                    >
                      CURRENT ACTIVE BRANCH
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#2563eb' }}>
                      Firm ID: {currentProperty.firmId}
                    </span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {currentProperty.firmName} ({currentProperty.location})
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    📍 {currentProperty.address} • 📞 {currentProperty.phone} • ✉️ {currentProperty.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Total Rooms</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                    {currentProperty.totalRooms} Rooms
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Software Validity</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>
                    {currentProperty.renewDate}
                  </div>
                </div>
                <button
                  onClick={() => handleOpenEdit(currentProperty)}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  ✏️ Edit Branch Info
                </button>
              </div>
            </div>
          )}

          {/* Chain Summary Metric Counters */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              marginBottom: '20px'
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 18px'
              }}
            >
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>CHAIN HOTEL LOCATIONS</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
                {chainPropertiesCount} Properties
              </div>
              <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
                ✓ Centralized Cloud Synchronization
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 18px'
              }}
            >
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>TOTAL CHAIN INVENTORY</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>
                {totalChainRooms} Rooms
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Across all registered branches
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 18px'
              }}
            >
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>MULTI-USER ARCHITECTURE</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                Active Multi-Tenant
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Branch-level data isolation
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px 18px'
              }}
            >
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>MULTI-DEVICE MOBILITY</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
                Mobile & Tablet Ready
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Waiter KOT, Housekeeping & Admin
              </div>
            </div>
          </div>

          {/* Properties Table Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            {/* Top Toolbar matching RoomG styling */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                  Registered Hotel Branches ({filteredProperties.length})
                </span>
                <button
                  onClick={handleOpenAdd}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>+</span> Add New Chain Location
                </button>
              </div>

              {/* Search Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Search:</label>
                <input
                  type="text"
                  placeholder="Filter branch by Firm ID, Name, City..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '13px',
                    width: '280px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                  color: '#1e293b'
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Firm ID</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Branch / Firm Name</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Location</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Contact & Email</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>Rooms</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>GSTIN</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        No hotel branches found matching query "{searchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredProperties.map(prop => {
                      const isCurrent = currentProperty?.firmId === prop.firmId;
                      return (
                        <tr
                          key={prop.firmId}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            backgroundColor: isCurrent ? '#f0fdf4' : 'transparent',
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#2563eb' }}>
                            {prop.firmId}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{prop.firmName}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{prop.address}</div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                backgroundColor: '#f1f5f9',
                                color: '#334155',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 600
                              }}
                            >
                              📍 {prop.location}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div>{prop.phone}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{prop.email}</div>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>
                            {prop.totalRooms}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '12px', fontFamily: 'monospace' }}>
                            {prop.gstin || '-'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {isCurrent ? (
                              <span
                                style={{
                                  backgroundColor: '#16a34a',
                                  color: '#ffffff',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '3px 10px',
                                  borderRadius: '12px'
                                }}
                              >
                                Active Context
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSwitchProperty(prop)}
                                style={{
                                  backgroundColor: '#06b6d4',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Switch Branch
                              </button>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenEdit(prop)}
                                title="Edit Branch"
                                style={{
                                  backgroundColor: '#2563eb',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '3px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Edit
                              </button>
                              {prop.firmId !== 'DEMO0004' && (
                                <button
                                  onClick={() => handleDeleteProperty(prop.firmId)}
                                  title="Delete Branch"
                                  style={{
                                    backgroundColor: '#dc2626',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Instruction Footer Note */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <strong>💡 Multi-Location Principle:</strong> In a chain hotel operation, each property maintains its own room inventory, KOT orders, food bills, check-in registrations, and cash registers under its distinct <code>Firm ID</code>. A Super-Admin or Auditor can switch between properties at any time without logging out.
              </div>
              <button
                onClick={refreshData}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                🔄 Refresh List
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            backgroundColor: '#f1f5f9',
            borderTop: '1px solid #cbd5e1',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Current Active Context: <strong>{currentProperty?.firmId} - {currentProperty?.firmName}</strong>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '6px 18px',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

        {/* Add / Edit Submodal */}
        {isEditModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1200
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                width: '640px',
                maxWidth: '92vw',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div
                style={{
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '15px' }}>
                  {editingProp ? `Edit Branch: ${editingProp.firmId}` : 'Add New Chain Property'}
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveProperty} style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Firm ID * (e.g. SVR0002)
                    </label>
                    <input
                      type="text"
                      required
                      value={formFirmId}
                      onChange={e => setFormFirmId(e.target.value)}
                      disabled={!!editingProp && editingProp.firmId === 'DEMO0004'}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Branch Location * (e.g. Pune / Shirdi)
                    </label>
                    <input
                      type="text"
                      required
                      value={formLocation}
                      onChange={e => setFormLocation(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Firm / Hotel Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formFirmName}
                    onChange={e => setFormFirmName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Full Property Address
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={e => setFormAddress(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Official Email
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      GSTIN No
                    </label>
                    <input
                      type="text"
                      value={formGstin}
                      onChange={e => setFormGstin(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Total Room Count
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={formTotalRooms}
                      onChange={e => setFormTotalRooms(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Software Renew Date
                    </label>
                    <input
                      type="date"
                      value={formRenewDate}
                      onChange={e => setFormRenewDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    style={{
                      backgroundColor: '#64748b',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 16px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 20px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Save Property
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
