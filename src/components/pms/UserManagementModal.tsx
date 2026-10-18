import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { PmsUserAccount, PmsRole, PmsChainProperty } from '../../types/pmsModels';
import './pmsStyles.css';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRoles?: () => void;
  onOpenProperties?: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  onOpenRoles,
  onOpenProperties
}) => {
  const [users, setUsers] = useState<PmsUserAccount[]>([]);
  const [roles, setRoles] = useState<PmsRole[]>([]);
  const [properties, setProperties] = useState<PmsChainProperty[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Add / Edit Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PmsUserAccount | null>(null);
  const [formFirmId, setFormFirmId] = useState('DEMO0004');
  const [formUserName, setFormUserName] = useState('');
  const [formEmailId, setFormEmailId] = useState('');
  const [formRoleId, setFormRoleId] = useState<number>(3);
  const [formMobile, setFormMobile] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formStatus, setFormStatus] = useState<'Verified' | 'Pending'>('Verified');

  const refreshData = () => {
    setUsers(PmsStore.getUsers());
    setRoles(PmsStore.getRoles());
    setProperties(PmsStore.getProperties());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setSuccessBanner(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenAddUser = (user?: PmsUserAccount) => {
    if (user) {
      setEditingUser(user);
      setFormFirmId(user.firmId);
      setFormUserName(user.userName);
      setFormEmailId(user.emailId);
      setFormRoleId(user.roleId);
      setFormMobile(user.mobile || '');
      setFormPassword(user.password || '');
      setFormStatus(user.status === 'Verified' ? 'Verified' : 'Pending');
    } else {
      setEditingUser(null);
      setFormFirmId('DEMO0004');
      setFormUserName('');
      setFormEmailId('');
      setFormRoleId(roles[0]?.id || 3);
      setFormMobile('');
      setFormPassword('');
      setFormStatus('Verified');
    }
    setIsAddUserOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserName.trim()) {
      alert('Please enter User Name');
      return;
    }
    if (!formEmailId.trim()) {
      alert('Please enter Email ID');
      return;
    }

    const selectedRole = roles.find(r => r.id === Number(formRoleId));
    const roleName = selectedRole ? selectedRole.name : 'staff';

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (editingUser) {
      const updatedUser: PmsUserAccount = {
        ...editingUser,
        firmId: formFirmId,
        userName: formUserName.trim(),
        emailId: formEmailId.trim(),
        roleId: Number(formRoleId),
        roleName,
        status: formStatus,
        verifiedDate: formStatus === 'Verified' ? (editingUser.verifiedDate || nowStr) : undefined,
        mobile: formMobile.trim(),
        password: formPassword.trim() || editingUser.password
      };
      PmsStore.saveUser(updatedUser);
      setSuccessBanner(`User ${updatedUser.userName} (${updatedUser.emailId}) updated successfully!`);
    } else {
      const newId = Math.max(0, ...users.map(u => u.id)) + 1;
      const newUser: PmsUserAccount = {
        id: newId,
        sNo: newId,
        firmId: formFirmId,
        userName: formUserName.trim(),
        emailId: formEmailId.trim(),
        roleId: Number(formRoleId),
        roleName,
        status: formStatus,
        regDate: nowStr,
        verifiedDate: formStatus === 'Verified' ? nowStr : undefined,
        mobile: formMobile.trim(),
        password: formPassword.trim() || 'RoomG@123'
      };
      PmsStore.saveUser(newUser);
      setSuccessBanner(`New User ${newUser.userName} created successfully!`);
    }

    setIsAddUserOpen(false);
    refreshData();
  };

  const handleToggleVerify = (user: PmsUserAccount) => {
    PmsStore.toggleUserStatus(user.id);
    const newStatus = user.status === 'Verified' ? 'Pending' : 'Verified';
    setSuccessBanner(`Status of ${user.userName} changed to ${newStatus}.`);
    refreshData();
  };

  const handleDeleteUser = (user: PmsUserAccount) => {
    if (window.confirm(`Are you sure you want to delete user account "${user.userName}" (${user.emailId})?`)) {
      PmsStore.deleteUser(user.id);
      setSuccessBanner(`User account ${user.userName} deleted successfully.`);
      refreshData();
    }
  };

  const handleExport = (type: string) => {
    alert(`Account list exported as ${type} successfully!`);
  };

  const filteredUsers = users.filter(u => 
    u.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.emailId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.roleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.firmId.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {/* Top Header bar matching Frame 0120 */}
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
            <span style={{ fontSize: 20 }}>👥</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '0.5px' }}>
                Account List (Multi-User Hotel Staff &amp; Device Access)
              </h2>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Route: /userprofile &bull; Video 21 Frame 0120 &bull; Multi-User Mobile, PC &amp; Laptop Controls
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {onOpenRoles && (
              <button
                type="button"
                onClick={onOpenRoles}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🛡️ Roles &amp; Permissions
              </button>
            )}
            {onOpenProperties && (
              <button
                type="button"
                onClick={onOpenProperties}
                style={{
                  background: '#0d9488',
                  color: '#fff',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🏨 Chain Properties
              </button>
            )}
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

        {/* Toolbar matching Video 21 Frame 0120 */}
        <div style={{
          padding: '12px 20px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          {/* Action Buttons: Copy, CSV, Excel, PDF, Print */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              onClick={() => handleExport('Clipboard')}
              style={{ padding: '4px 10px', border: '1px solid #000', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => handleExport('CSV')}
              style={{ padding: '4px 10px', border: '1px solid #000', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport('Excel')}
              style={{ padding: '4px 10px', border: '1px solid #000', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Excel
            </button>
            <button
              type="button"
              onClick={() => handleExport('PDF')}
              style={{ padding: '4px 10px', border: '1px solid #000', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              PDF
            </button>
            <button
              type="button"
              onClick={() => handleExport('Print')}
              style={{ padding: '4px 10px', border: '1px solid #000', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Print
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => handleOpenAddUser()}
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
              + Add New User
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>Search:</label>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search user..."
                style={{
                  padding: '5px 8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  fontSize: 12,
                  width: 170
                }}
              />
            </div>
          </div>
        </div>

        {/* Account List Table from Frame 0120 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                <th style={{ padding: '8px 10px', fontWeight: 700, width: 55 }}>S.No</th>
                <th style={{ padding: '8px 10px', fontWeight: 700, width: 100 }}>Firm Id</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>User Name</th>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Email Id</th>
                <th style={{ padding: '8px 10px', fontWeight: 700, width: 90 }}>Role</th>
                <th style={{ padding: '8px 10px', fontWeight: 700, width: 140 }}>Status</th>
                <th style={{ padding: '8px 10px', fontWeight: 700, width: 150 }}>Reg.Date</th>
                <th style={{ padding: '8px 10px', fontWeight: 700, width: 180, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr 
                    key={u.id}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                    }}
                  >
                    <td style={{ padding: '10px 10px', fontWeight: 700, color: '#0f172a' }}>
                      {u.sNo || u.id}
                    </td>
                    <td style={{ padding: '10px 10px', fontWeight: 600, color: '#2563eb' }}>
                      {u.firmId}
                    </td>
                    <td style={{ padding: '10px 10px', fontWeight: 700, color: '#1e293b' }}>
                      {u.userName}
                    </td>
                    <td style={{ padding: '10px 10px', color: '#475569' }}>
                      {u.emailId}
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{
                        background: u.roleName === 'super-admin' ? '#fef3c7' : u.roleName === 'admin' ? '#e0f2fe' : '#f1f5f9',
                        color: u.roleName === 'super-admin' ? '#b45309' : u.roleName === 'admin' ? '#0369a1' : '#334155',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700
                      }}>
                        {u.roleName}
                      </span>
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{
                        background: u.status === 'Verified' ? '#dcfce7' : '#fee2e2',
                        color: u.status === 'Verified' ? '#15803d' : '#b91c1c',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700
                      }}>
                        {u.status}
                      </span>
                      {u.verifiedDate && (
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                          {u.verifiedDate}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 10px', fontSize: 11, color: '#64748b' }}>
                      {u.regDate}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleToggleVerify(u)}
                          title="Toggle Verification Status (Frame 0120)"
                          style={{
                            background: '#06b6d4',
                            color: '#ffffff',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: 3,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Varify
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAddUser(u)}
                          title="Edit User Account"
                          style={{
                            background: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: 3,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          title="Delete User Account"
                          style={{
                            background: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: 3,
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info banner */}
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
            Showing <strong>{filteredUsers.length}</strong> user accounts across chain firm <strong>DEMO0004</strong> &bull; Multi-User Mobile/PC Active
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

      {/* Add / Edit User Submodal */}
      {isAddUserOpen && (
        <div className="pms-submodal-overlay" style={{ zIndex: 1200 }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 8,
            width: 480,
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
                {editingUser ? 'Edit User Account' : 'Add New User Account'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Firm / Property ID
                </label>
                <select
                  value={formFirmId}
                  onChange={e => setFormFirmId(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                >
                  {properties.map(p => (
                    <option key={p.firmId} value={p.firmId}>
                      {p.firmId} - {p.firmName} ({p.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  User Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reception Staff, Manager, Accountant"
                  value={formUserName}
                  onChange={e => setFormUserName(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Email ID (Login Username) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. reception@hotel.com"
                  value={formEmailId}
                  onChange={e => setFormEmailId(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Role Assignment *
                  </label>
                  <select
                    value={formRoleId}
                    onChange={e => setFormRoleId(Number(e.target.value))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Verification Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                  >
                    <option value="Verified">Verified (Active)</option>
                    <option value="Pending">Pending Approval</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={formMobile}
                    onChange={e => setFormMobile(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder={editingUser ? 'Leave blank to keep same' : 'Enter password'}
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
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
                  {editingUser ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
