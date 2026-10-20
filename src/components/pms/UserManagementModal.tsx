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
  const [activeTab, setActiveTab] = useState<'users' | 'roster'>('users');
  const [currentUser, setCurrentUser] = useState<PmsUserAccount>(PmsStore.getCurrentUser());

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
  const [formDepartment, setFormDepartment] = useState<PmsUserAccount['department']>('Front Office');
  const [formShift, setFormShift] = useState<PmsUserAccount['shift']>('Morning (07:00 - 15:00)');
  const [formIsOnDuty, setFormIsOnDuty] = useState(true);

  const refreshData = () => {
    setUsers(PmsStore.getUsers());
    setRoles(PmsStore.getRoles());
    setProperties(PmsStore.getProperties());
    setCurrentUser(PmsStore.getCurrentUser());
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
      setFormDepartment(user.department || 'Front Office');
      setFormShift(user.shift || 'Morning (07:00 - 15:00)');
      setFormIsOnDuty(user.isOnDuty !== false);
    } else {
      setEditingUser(null);
      setFormFirmId('DEMO0004');
      setFormUserName('');
      setFormEmailId('');
      setFormRoleId(roles[0]?.id || 3);
      setFormMobile('');
      setFormPassword('');
      setFormStatus('Verified');
      setFormDepartment('Front Office');
      setFormShift('Morning (07:00 - 15:00)');
      setFormIsOnDuty(true);
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
        password: formPassword.trim() || editingUser.password,
        department: formDepartment,
        shift: formShift,
        isOnDuty: formIsOnDuty
      };
      PmsStore.saveUser(updatedUser);
      setSuccessBanner(`Staff Account "${updatedUser.userName}" (${updatedUser.roleName}) updated successfully!`);
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
        password: formPassword.trim() || 'SaiVasudev@123',
        department: formDepartment,
        shift: formShift,
        isOnDuty: formIsOnDuty
      };
      PmsStore.saveUser(newUser);
      setSuccessBanner(`New Staff User "${newUser.userName}" assigned to ${newUser.roleName} successfully!`);
    }

    setIsAddUserOpen(false);
    refreshData();
  };

  const handleSwitchActiveStaff = (user: PmsUserAccount) => {
    PmsStore.setCurrentUser(user);
    setCurrentUser(user);
    setSuccessBanner(`Active Hotel Staff Switched to "${user.userName}" (${user.roleName}). System boundaries & rights updated!`);
    refreshData();
  };

  const handleToggleVerify = (user: PmsUserAccount) => {
    PmsStore.toggleUserStatus(user.id);
    const newStatus = user.status === 'Verified' ? 'Pending' : 'Verified';
    setSuccessBanner(`Status of ${user.userName} changed to ${newStatus}.`);
    refreshData();
  };

  // Video 23 Anti-Theft Protection: delete user permission check
  const handleDeleteUser = (user: PmsUserAccount) => {
    if (!PmsStore.hasPermission('delete user')) {
      alert('Permission Denied: Standard staff are restricted from deleting user accounts ("delete user" permission required). Contact Hotel Super-Admin.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete staff account "${user.userName}" (${user.emailId})?`)) {
      PmsStore.deleteUser(user.id);
      setSuccessBanner(`User account ${user.userName} deleted successfully.`);
      refreshData();
    }
  };

  const handleExport = (type: string) => {
    if (type.toLowerCase().includes('csv') || type.toLowerCase().includes('excel')) {
      const headers = ['User Name', 'Email ID', 'Role', 'Status', 'Branch Firm ID', 'Department'];
      const rows = users.map(u => [
        `"${u.userName}"`,
        `"${u.emailId}"`,
        `"${u.roleName}"`,
        `"${u.status}"`,
        `"${u.firmId}"`,
        `"${u.department || 'Front Office'}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `hotel_sai_vasudev_staff_users_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccessBanner(`Staff user list exported as ${type} successfully.`);
    } else {
      window.print();
    }
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
                Route: /userprofile &bull; Enterprise Multi-User Mobile, PC &amp; Laptop Controls
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

        {/* Sub-Tabs: User Accounts vs Staff Shift Roster (Video 23) */}
        <div style={{
          padding: '8px 20px 0 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: 8
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeTab === 'users' ? '3px solid #2563eb' : '3px solid transparent',
              background: activeTab === 'users' ? '#ffffff' : 'transparent',
              color: activeTab === 'users' ? '#2563eb' : '#64748b',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4
            }}
          >
            👥 User Accounts (/users)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeTab === 'roster' ? '3px solid #2563eb' : '3px solid transparent',
              background: activeTab === 'roster' ? '#ffffff' : 'transparent',
              color: activeTab === 'roster' ? '#2563eb' : '#64748b',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4
            }}
          >
            🛡️ Staff Shift Roster &amp; Access Controls
          </button>
        </div>

        {/* Toolbar matching Video 21 & Video 23 Frame 0120, 0165 */}
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
              + Add New Staff
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>Search:</label>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search staff user..."
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

        {/* VIEW 1: Account List Table from Frame 0165 & 0120 */}
        {activeTab === 'users' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 700, width: 45 }}>Id</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Staff Name</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700 }}>Email (Login ID)</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700, width: 120 }}>Department</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700, width: 140 }}>Shift</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700, width: 110 }}>Assigned Role</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700, width: 85 }}>Status</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700, width: 115, textAlign: 'center' }}>Active Duty</th>
                  <th style={{ padding: '8px 10px', fontWeight: 700, width: 170, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                      No staff accounts found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => {
                    const isCurrent = currentUser?.id === u.id;
                    return (
                      <tr 
                        key={u.id}
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          background: isCurrent ? '#f0fdf4' : idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                        }}
                      >
                        <td style={{ padding: '10px 10px', fontWeight: 700, color: '#0f172a' }}>
                          {u.sNo || u.id}
                        </td>
                        <td style={{ padding: '10px 10px', fontWeight: 700, color: '#1e293b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: isCurrent ? '#16a34a' : '#3b82f6',
                              color: '#fff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 700
                            }}>
                              {u.userName.charAt(0)}
                            </span>
                            <span>{u.userName}</span>
                          </div>
                          {u.mobile && (
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 1, marginLeft: 28 }}>
                              📞 {u.mobile}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 10px', color: '#475569' }}>
                          {u.emailId}
                        </td>
                        <td style={{ padding: '10px 10px', color: '#334155', fontWeight: 600 }}>
                          {u.department || 'Front Office'}
                        </td>
                        <td style={{ padding: '10px 10px', fontSize: 11, color: '#64748b' }}>
                          {u.shift || 'General (09:00 - 18:00)'}
                        </td>
                        <td style={{ padding: '10px 10px' }}>
                          <span style={{
                            background: u.roleName === 'super-admin' ? '#fef3c7' : u.roleName === 'admin' ? '#e0f2fe' : u.roleName === 'Receptionist' ? '#f0fdf4' : u.roleName === 'Restaurent' ? '#ffedd5' : u.roleName === 'Billing' ? '#ede9fe' : '#f1f5f9',
                            color: u.roleName === 'super-admin' ? '#b45309' : u.roleName === 'admin' ? '#0369a1' : u.roleName === 'Receptionist' ? '#15803d' : u.roleName === 'Restaurent' ? '#c2410c' : u.roleName === 'Billing' ? '#6d28d9' : '#334155',
                            border: `1px solid ${u.roleName === 'super-admin' ? '#fde68a' : u.roleName === 'admin' ? '#bae6fd' : u.roleName === 'Receptionist' ? '#bbf7d0' : '#cbd5e1'}`,
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
                            fontSize: 10,
                            fontWeight: 700
                          }}>
                            {u.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                          {isCurrent ? (
                            <span style={{
                              background: '#16a34a',
                              color: '#ffffff',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 800
                            }}>
                              🟢 LOGGED IN
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSwitchActiveStaff(u)}
                              title={`Switch active logged-in operator to ${u.userName} (${u.roleName})`}
                              style={{
                                background: '#0284c7',
                                color: '#ffffff',
                                border: 'none',
                                padding: '3px 8px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              ⚡ Set Active
                            </button>
                          )}
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleToggleVerify(u)}
                              title="Toggle Verification Status"
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
                              title="Edit Staff Account"
                              style={{
                                background: '#16a34a',
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
                              title="Delete Staff Account (Protected by delete user permission)"
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* VIEW 2: Staff Shift Roster & Security Boundary Controls (Video 23) */
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: '#f8fafc' }}>
            {/* Banner explaining Anti-Theft Strategy */}
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 6,
              padding: '12px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12
            }}>
              <span style={{ fontSize: 24 }}>🛡️</span>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e40af' }}>
                  Hotel Staff Management &amp; Security Protection Matrix
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
                  In Hotel Sai Vasudev Residency ERP, every staff member is assigned a dedicated User ID tied to a specific Role.
                  Removing delete rights prevents front desk staff from deleting guest bills to pocket cash.
                  Restricting tariff changes prevents unauthorized discounts, and anti-backdating prevents fraudulent retroactive ledger tampering.
                </p>
              </div>
            </div>

            {/* Department Breakdown Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {/* Front Office */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h5 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                    🏢 Front Office &amp; Reception
                  </h5>
                  <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                    Role: Receptionist / staff
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>
                  <strong>On-Duty Staff:</strong> Reception (Morning: 07:00 - 15:00), Reception (Evening: 15:00 - 23:00)
                </div>
                <div style={{ background: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 11 }}>
                  <div style={{ color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>
                    ✓ Allowed Operations:
                  </div>
                  <div>Room Dashboard, Booking, Check-in, Checkout, Booking Calendar, GRC Printing, Advance Receipts</div>
                  <div style={{ color: '#dc2626', fontWeight: 700, marginTop: 8, marginBottom: 4 }}>
                    🔒 Strictly Blocked Boundary (Anti-Theft):
                  </div>
                  <div style={{ color: '#991b1b' }}>
                    ❌ Bill Deletion (Prevent cash skimming)<br />
                    ❌ Tariff Modification (Prevent unauthorized discounts)<br />
                    ❌ Date &amp; Time Alteration (Prevent backdated entries)<br />
                    ❌ Company / Business Settings Access
                  </div>
                </div>
              </div>

              {/* Restaurant & Dining */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h5 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                    🍽️ Restaurant, Bar &amp; Kitchen (F&amp;B)
                  </h5>
                  <span style={{ background: '#ffedd5', color: '#c2410c', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                    Role: Restaurent
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>
                  <strong>On-Duty Staff:</strong> Chef Sanjeev, Restaurant Captain (Morning &amp; Evening)
                </div>
                <div style={{ background: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 11 }}>
                  <div style={{ color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>
                    ✓ Allowed Operations:
                  </div>
                  <div>Table Matrix, KOT Generation, Kitchen KDS Dashboard, Food Bills, Item Sales, Stock Inward</div>
                  <div style={{ color: '#dc2626', fontWeight: 700, marginTop: 8, marginBottom: 4 }}>
                    🔒 Strictly Blocked Boundary:
                  </div>
                  <div style={{ color: '#991b1b' }}>
                    ❌ Hotel Rooms Dashboard &amp; Check-ins (Hidden)<br />
                    ❌ Guest Ledgers &amp; Room Shift (Hidden)<br />
                    ❌ Bill Deletion / KOT Cancel (Owner alert required)
                  </div>
                </div>
              </div>

              {/* Accounts & Cashier */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h5 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                    💵 Cashier &amp; Accounts
                  </h5>
                  <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                    Role: Billing
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>
                  <strong>On-Duty Staff:</strong> Cashier Rahul (Evening: 15:00 - 23:00)
                </div>
                <div style={{ background: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 11 }}>
                  <div style={{ color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>
                    ✓ Allowed Operations:
                  </div>
                  <div>Checkout Settlements, Food Bills, Receipts, Outstanding Receivables, Day End Closing, GST Report</div>
                  <div style={{ color: '#dc2626', fontWeight: 700, marginTop: 8, marginBottom: 4 }}>
                    🔒 Strictly Blocked Boundary:
                  </div>
                  <div style={{ color: '#991b1b' }}>
                    ❌ Delete Records / Cancel Vouchers<br />
                    ❌ Modify Room Base Tariff<br />
                    ❌ System SQL Queries / User Accounts
                  </div>
                </div>
              </div>

              {/* WhatsApp & Marketing */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h5 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                    💬 Guest Messaging &amp; Marketing
                  </h5>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                    Role: Only_Whatsapp / Lead Managment
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>
                  <strong>On-Duty Staff:</strong> whatsapp operator, RIFAT ULLAH (General Shift)
                </div>
                <div style={{ background: '#f8fafc', padding: 8, borderRadius: 4, fontSize: 11 }}>
                  <div style={{ color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>
                    ✓ Allowed Operations:
                  </div>
                  <div>WhatsApp SMS Setting, Outbox Logs, Inquiries, Guest Contact Directory</div>
                  <div style={{ color: '#dc2626', fontWeight: 700, marginTop: 8, marginBottom: 4 }}>
                    🔒 Strictly Blocked Boundary:
                  </div>
                  <div style={{ color: '#991b1b' }}>
                    ❌ Zero Access to Room Operations &amp; Billing<br />
                    ❌ Zero Access to Financial Cash Ledger<br />
                    ❌ Zero Access to Master Settings
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    Department *
                  </label>
                  <select
                    value={formDepartment}
                    onChange={e => setFormDepartment(e.target.value as any)}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                  >
                    <option value="Front Office">Front Office (Reception)</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Restaurant & F&B">Restaurant &amp; Dining (F&amp;B)</option>
                    <option value="Kitchen">Kitchen (KDS / Chef)</option>
                    <option value="Accounts & Cashier">Accounts &amp; Cashier</option>
                    <option value="Security & Audit">Security &amp; Audit</option>
                    <option value="General Management">General Management</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Assigned Shift *
                  </label>
                  <select
                    value={formShift}
                    onChange={e => setFormShift(e.target.value as any)}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                  >
                    <option value="Morning (07:00 - 15:00)">Morning (07:00 - 15:00)</option>
                    <option value="Evening (15:00 - 23:00)">Evening (15:00 - 23:00)</option>
                    <option value="Night (23:00 - 07:00)">Night (23:00 - 07:00)</option>
                    <option value="General (09:00 - 18:00)">General (09:00 - 18:00)</option>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="form_is_on_duty"
                  checked={formIsOnDuty}
                  onChange={e => setFormIsOnDuty(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#16a34a' }}
                />
                <label htmlFor="form_is_on_duty" style={{ fontSize: 12, fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                  Currently On Duty (Active Operational Staff)
                </label>
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
