import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import { PMS_ALL_PERMISSIONS } from '../../types/pmsModels';
import type { PmsRole } from '../../types/pmsModels';
import './pmsStyles.css';

interface RolesPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUsers?: () => void;
}

export const RolesPermissionsModal: React.FC<RolesPermissionsModalProps> = ({
  isOpen,
  onClose,
  onOpenUsers
}) => {
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
  const [roles, setRoles] = useState<PmsRole[]>([]);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Permission Editing Mode (/roles/{id}/give-permissions from Frame 0132)
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<PmsRole | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Add / Edit Role Modal
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<PmsRole | null>(null);
  const [formRoleName, setFormRoleName] = useState('');
  const [formRoleDesc, setFormRoleDesc] = useState('');

  const refreshData = () => {
    setRoles(PmsStore.getRoles());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setSelectedRoleForPermissions(null);
      setSuccessBanner(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handlers for Add/Edit Role
  const handleOpenAddRole = (role?: PmsRole) => {
    if (role) {
      setEditingRole(role);
      setFormRoleName(role.name);
      setFormRoleDesc(role.description || '');
    } else {
      setEditingRole(null);
      setFormRoleName('');
      setFormRoleDesc('');
    }
    setIsAddRoleOpen(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRoleName.trim()) {
      alert('Please enter Role Name');
      return;
    }

    if (editingRole) {
      const updated: PmsRole = {
        ...editingRole,
        name: formRoleName.trim(),
        description: formRoleDesc.trim()
      };
      PmsStore.saveRole(updated);
      setSuccessBanner(`Role "${updated.name}" updated successfully!`);
    } else {
      const newId = Math.max(0, ...roles.map(r => r.id)) + 1;
      const newRole: PmsRole = {
        id: newId,
        name: formRoleName.trim(),
        description: formRoleDesc.trim(),
        permissions: ['Room_Dashboard', 'Room List'] // basic default
      };
      PmsStore.saveRole(newRole);
      setSuccessBanner(`New Role "${newRole.name}" created successfully!`);
    }

    setIsAddRoleOpen(false);
    refreshData();
  };

  const handleDeleteRole = (role: PmsRole) => {
    if (role.isSystem) {
      alert(`System role "${role.name}" cannot be deleted.`);
      return;
    }
    if (window.confirm(`Are you sure you want to delete role "${role.name}"?`)) {
      PmsStore.deleteRole(role.id);
      setSuccessBanner(`Role "${role.name}" deleted successfully.`);
      refreshData();
    }
  };

  // Handlers for Give Permissions (Frame 0132)
  const handleOpenGivePermissions = (role: PmsRole) => {
    setSelectedRoleForPermissions(role);
    setSelectedPermissions([...role.permissions]);
  };

  const handleTogglePermission = (key: string) => {
    if (selectedPermissions.includes(key)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== key));
    } else {
      setSelectedPermissions([...selectedPermissions, key]);
    }
  };

  const handleSelectAllPermissions = () => {
    setSelectedPermissions(PMS_ALL_PERMISSIONS.map(p => p.key));
  };

  const handleDeselectAllPermissions = () => {
    setSelectedPermissions([]);
  };

  const handleSaveRolePermissions = () => {
    if (!selectedRoleForPermissions) return;
    PmsStore.updateRolePermissions(selectedRoleForPermissions.id, selectedPermissions);
    setSuccessBanner(`Permissions for Role "${selectedRoleForPermissions.name}" saved successfully! (${selectedPermissions.length} active)`);
    setSelectedRoleForPermissions(null);
    refreshData();
  };

  return (
    <div className="pms-submodal-overlay" style={{ zIndex: 1100 }}>
      <div 
        className="pms-submodal-content"
        style={{
          width: '94%',
          maxWidth: 1180,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#f8fafc',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '1px solid #cbd5e1'
        }}
      >
        {/* Top Header */}
        <div style={{
          background: '#1e293b',
          color: '#ffffff',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '0.5px' }}>
                Roles &amp; Permissions Manager
              </h2>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Route: {selectedRoleForPermissions ? `/roles/${selectedRoleForPermissions.id}/give-permissions` : '/roles'} &bull; Video 21 Frames 0130 &amp; 0132
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: 22,
                cursor: 'pointer',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 3 Header Navigation Tabs matching Frame 0130 */}
        {!selectedRoleForPermissions && (
          <div style={{
            padding: '10px 20px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Roles Tab (Blue #2563eb) */}
              <button
                type="button"
                onClick={() => setActiveTab('roles')}
                style={{
                  background: activeTab === 'roles' ? '#2563eb' : '#f1f5f9',
                  color: activeTab === 'roles' ? '#ffffff' : '#334155',
                  border: 'none',
                  padding: '7px 18px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Roles
              </button>

              {/* Permissions Tab (Cyan #06b6d4) */}
              <button
                type="button"
                onClick={() => setActiveTab('permissions')}
                style={{
                  background: activeTab === 'permissions' ? '#06b6d4' : '#f1f5f9',
                  color: activeTab === 'permissions' ? '#ffffff' : '#334155',
                  border: 'none',
                  padding: '7px 18px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Permissions
              </button>

              {/* Users Tab (Yellow #eab308) */}
              {onOpenUsers && (
                <button
                  type="button"
                  onClick={onOpenUsers}
                  style={{
                    background: '#eab308',
                    color: '#ffffff',
                    border: 'none',
                    padding: '7px 18px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Users
                </button>
              )}
            </div>

            {activeTab === 'roles' && (
              <button
                type="button"
                onClick={() => handleOpenAddRole()}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                + Add Role
              </button>
            )}
          </div>
        )}

        {/* Success Banner */}
        {successBanner && (
          <div style={{
            background: '#dcfce7',
            color: '#166534',
            padding: '8px 20px',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #bbf7d0'
          }}>
            <span>✓ {successBanner}</span>
            <button 
              type="button" 
              onClick={() => setSuccessBanner(null)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: '#ffffff' }}>
          {/* VIEW 1: Give Permissions Mode (Frame 0132) */}
          {selectedRoleForPermissions ? (
            <div>
              {/* Top Banner with Role Name and Red Back Button matching Frame 0132 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 14,
                marginBottom: 16,
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>
                    Role : <span style={{ color: '#2563eb' }}>{selectedRoleForPermissions.name}</span>
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {selectedPermissions.length} of {PMS_ALL_PERMISSIONS.length} permissions granted
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleSelectAllPermissions}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      padding: '5px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllPermissions}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      padding: '5px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRoleForPermissions(null)}
                    style={{
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 16px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRolePermissions}
                    style={{
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 16px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    💾 Save Permissions
                  </button>
                </div>
              </div>

              {/* Permissions Section matching Frame 0132 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12 }}>
                  Permissions
                </div>

                {/* 6-column responsive checkbox grid replicating Frame 0132 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '10px 14px'
                }}>
                  {PMS_ALL_PERMISSIONS.map(p => {
                    const isChecked = selectedPermissions.includes(p.key);
                    return (
                      <label 
                        key={p.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          color: isChecked ? '#1e293b' : '#64748b',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(p.key)}
                          style={{
                            width: 15,
                            height: 15,
                            accentColor: '#2563eb',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{ fontWeight: isChecked ? 600 : 400 }}>
                          {p.key}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeTab === 'roles' ? (
            /* VIEW 2: Roles Table matching Frame 0130 */
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                Roles
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 700, width: 60 }}>Id</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, width: 220 }}>Name</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700 }}>Description</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, width: 120 }}>Active Rights</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, width: 340, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r, idx) => (
                    <tr 
                      key={r.id}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                        {r.id}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1e293b' }}>
                        {r.name}
                        {r.isSystem && (
                          <span style={{ marginLeft: 6, fontSize: 10, background: '#f1f5f9', color: '#64748b', padding: '1px 5px', borderRadius: 3 }}>
                            System
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12 }}>
                        {r.description || 'Custom role configured for hotel team'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          background: '#e0f2fe',
                          color: '#0369a1',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700
                        }}>
                          {r.permissions.length} rights
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {/* Yellow Button matching Frame 0130 */}
                          <button
                            type="button"
                            onClick={() => handleOpenGivePermissions(r)}
                            title="Configure Rights & Permissions (Frame 0132)"
                            style={{
                              background: '#eab308',
                              color: '#ffffff',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Add / Edit Role Permission
                          </button>

                          {/* Green Button matching Frame 0130 */}
                          <button
                            type="button"
                            onClick={() => handleOpenAddRole(r)}
                            title="Edit Role Name"
                            style={{
                              background: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>

                          {/* Red Button matching Frame 0130 */}
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(r)}
                            title="Delete Role"
                            style={{
                              background: '#dc2626',
                              color: '#ffffff',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* VIEW 3: Permissions Directory Tab */
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                System Permissions Directory ({PMS_ALL_PERMISSIONS.length})
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {PMS_ALL_PERMISSIONS.map(p => (
                  <div
                    key={p.key}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      padding: '10px 14px',
                      background: '#f8fafc'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                        {p.key}
                      </span>
                      <span style={{
                        fontSize: 10,
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '1px 6px',
                        borderRadius: 3,
                        fontWeight: 600
                      }}>
                        {p.category}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                      {p.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px',
          background: '#f1f5f9',
          borderTop: '1px solid #cbd5e1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: '#64748b'
        }}>
          <div>
            Total <strong>{roles.length}</strong> Roles configured with <strong>{PMS_ALL_PERMISSIONS.length}</strong> granular rights
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#64748b',
              color: '#fff',
              border: 'none',
              padding: '6px 16px',
              borderRadius: 4,
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Add / Edit Role Submodal */}
      {isAddRoleOpen && (
        <div className="pms-submodal-overlay" style={{ zIndex: 1200 }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 8,
            width: 440,
            maxWidth: '90%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid #cbd5e1'
          }}>
            <div style={{
              background: '#1e293b',
              color: '#ffffff',
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                {editingRole ? 'Edit Role' : 'Add New Role'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddRoleOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRole} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Receptionist, Store Manager, Housekeeping"
                  value={formRoleName}
                  onChange={e => setFormRoleName(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Responsibilities &amp; access scope for this role"
                  value={formRoleDesc}
                  onChange={e => setFormRoleDesc(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsAddRoleOpen(false)}
                  style={{
                    background: '#e2e8f0',
                    color: '#334155',
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '7px 18px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
