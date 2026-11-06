import React, { useState, useEffect, useMemo } from 'react';
import type { 
  StaffProfile, 
  StaffSalaryAdvance, 
  StaffMonthlyPayroll, 
  StaffDepartment,
  StaffGender
} from '../../types/pmsModels';
import { PmsStore, usePmsSync } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';
import './pmsStyles.css';

interface StaffPayrollManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEPARTMENTS: StaffDepartment[] = [
  'Front Office',
  'Housekeeping',
  'Vasudev Rasoi F&B',
  'Kitchen',
  'Maintenance & Engineering',
  'Security',
  'Accounts & Administration'
];

export const StaffPayrollManagementModal: React.FC<StaffPayrollManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  usePmsSync();

  const [activeTab, setActiveTab] = useState<'directory' | 'advances' | 'payroll'>('directory');
  const companyInfo = PmsStore.getCompanyInfo();

  // Current month default: "YYYY-MM"
  const defaultCurrentPeriod = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedPeriod, setSelectedPeriod] = useState<string>(defaultCurrentPeriod);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [advancesList, setAdvancesList] = useState<StaffSalaryAdvance[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Dialog States
  const [isStaffFormOpen, setIsStaffFormOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);
  const [isAdvanceFormOpen, setIsAdvanceFormOpen] = useState<boolean>(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState<boolean>(false);
  const [payoutTarget, setPayoutTarget] = useState<StaffMonthlyPayroll | null>(null);
  const [isPaySlipModalOpen, setIsPaySlipModalOpen] = useState<boolean>(false);
  const [slipTarget, setSlipTarget] = useState<StaffMonthlyPayroll | null>(null);

  // Staff Form State
  const [staffFormData, setStaffFormData] = useState<{
    staff_code: string;
    full_name: string;
    gender: StaffGender;
    role: string;
    department: string;
    phone: string;
    monthly_base_salary: number;
    emergency_contact: string;
    date_of_joining: string;
    bank_name: string;
    bank_account_no: string;
    bank_ifsc: string;
    aadhaar_number: string;
  }>({
    staff_code: '',
    full_name: '',
    gender: 'Male',
    role: '',
    department: 'Front Office',
    phone: '',
    monthly_base_salary: 15000,
    emergency_contact: '',
    date_of_joining: new Date().toISOString().slice(0, 10),
    bank_name: 'State Bank of India',
    bank_account_no: '',
    bank_ifsc: 'SBIN000390',
    aadhaar_number: ''
  });

  // Advance Form State
  const [advanceFormData, setAdvanceFormData] = useState<{
    staff_id: number;
    advance_date: string;
    amount: number;
    payment_mode: string;
    remarks: string;
  }>({
    staff_id: 1,
    advance_date: new Date().toISOString().slice(0, 10),
    amount: 2000,
    payment_mode: 'Cash',
    remarks: 'Personal urgent expense advance'
  });

  // Payout Form State
  const [payoutFormData, setPayoutFormData] = useState<{
    payment_date: string;
    payment_mode: string;
    payment_reference: string;
    remarks: string;
  }>({
    payment_date: new Date().toISOString().slice(0, 10),
    payment_mode: 'Bank Transfer',
    payment_reference: 'NEFT-' + Math.floor(100000 + Math.random() * 900000),
    remarks: 'Monthly salary credited'
  });

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Staff Profiles from API with store fallback
      let staff: StaffProfile[] = [];
      try {
        staff = await hotelApi.getStaffProfiles();
      } catch {
        staff = PmsStore.getStaffProfiles();
      }
      setStaffList(staff);

      // 2. Fetch Advances
      let advances: StaffSalaryAdvance[] = [];
      try {
        advances = await hotelApi.getStaffAdvances({ month_period: selectedPeriod });
      } catch {
        advances = PmsStore.getStaffAdvances(selectedPeriod);
      }
      setAdvancesList(advances);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, selectedPeriod]);

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      if (!s.is_active) return false;
      if (selectedDepartment !== 'All' && s.department !== selectedDepartment) return false;
      if (selectedGender !== 'All' && s.gender !== selectedGender) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.full_name.toLowerCase().includes(q);
        const matchRole = s.role.toLowerCase().includes(q);
        const matchCode = s.staff_code.toLowerCase().includes(q);
        const matchPhone = s.phone.includes(q);
        if (!matchName && !matchRole && !matchCode && !matchPhone) return false;
      }
      return true;
    });
  }, [staffList, selectedDepartment, selectedGender, searchQuery]);

  // Payroll Calculation
  const payrollData = useMemo(() => {
    return PmsStore.getMonthlyPayroll(selectedPeriod);
  }, [selectedPeriod, staffList, advancesList]);

  if (!isOpen) return null;

  // Handle Open Staff Form
  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setStaffFormData({
      staff_code: `SVR-STF-${String(staffList.length + 1).padStart(3, '0')}`,
      full_name: '',
      gender: 'Male',
      role: '',
      department: 'Front Office',
      phone: '',
      monthly_base_salary: 16000,
      emergency_contact: '',
      date_of_joining: new Date().toISOString().slice(0, 10),
      bank_name: 'State Bank of India',
      bank_account_no: '',
      bank_ifsc: 'SBIN000390',
      aadhaar_number: ''
    });
    setIsStaffFormOpen(true);
  };

  const handleOpenEditStaff = (staff: StaffProfile) => {
    setEditingStaff(staff);
    setStaffFormData({
      staff_code: staff.staff_code,
      full_name: staff.full_name,
      gender: staff.gender,
      role: staff.role,
      department: staff.department,
      phone: staff.phone,
      monthly_base_salary: staff.monthly_base_salary,
      emergency_contact: staff.emergency_contact || '',
      date_of_joining: staff.date_of_joining || '',
      bank_name: staff.bank_name || '',
      bank_account_no: staff.bank_account_no || '',
      bank_ifsc: staff.bank_ifsc || '',
      aadhaar_number: staff.aadhaar_number || ''
    });
    setIsStaffFormOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFormData.full_name.trim() || !staffFormData.role.trim() || !staffFormData.phone.trim()) {
      alert('Please fill out Full Name, Role, and Phone number.');
      return;
    }

    try {
      if (editingStaff) {
        await hotelApi.updateStaffProfile(editingStaff.id, staffFormData).catch(() => {});
        PmsStore.saveStaffProfile({ id: editingStaff.id, ...staffFormData });
      } else {
        await hotelApi.createStaffProfile(staffFormData).catch(() => {});
        PmsStore.saveStaffProfile(staffFormData);
      }
      setIsStaffFormOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save staff profile');
    }
  };

  const handleDeleteStaff = async (staffId: number, staffName: string) => {
    if (!confirm(`Are you sure you want to deactivate ${staffName}?`)) return;
    try {
      await hotelApi.deleteStaffProfile(staffId).catch(() => {});
      PmsStore.deleteStaffProfile(staffId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate staff');
    }
  };

  // Handle Advance Form
  const handleOpenAdvanceFor = (staffId?: number) => {
    const targetId = staffId || (staffList[0]?.id ?? 1);
    setAdvanceFormData({
      staff_id: targetId,
      advance_date: new Date().toISOString().slice(0, 10),
      amount: 2000,
      payment_mode: 'Cash',
      remarks: 'Mid-month personal salary advance'
    });
    setIsAdvanceFormOpen(true);
  };

  const handleSaveAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (advanceFormData.amount <= 0) {
      alert('Please enter a valid advance amount greater than 0.');
      return;
    }

    try {
      await hotelApi.recordStaffAdvance({
        ...advanceFormData,
        month_period: selectedPeriod
      }).catch(() => {});
      PmsStore.recordStaffAdvance({
        ...advanceFormData,
        month_period: selectedPeriod
      });
      setIsAdvanceFormOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to record advance');
    }
  };

  const handleDeleteAdvance = async (advId: number) => {
    if (!confirm('Are you sure you want to void this advance record?')) return;
    try {
      await hotelApi.deleteStaffAdvance(advId).catch(() => {});
      PmsStore.deleteStaffAdvance(advId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete advance');
    }
  };

  // Handle Payout Status
  const handleOpenPayout = (row: StaffMonthlyPayroll) => {
    setPayoutTarget(row);
    setPayoutFormData({
      payment_date: new Date().toISOString().slice(0, 10),
      payment_mode: 'Bank Transfer',
      payment_reference: 'NEFT-' + Math.floor(100000 + Math.random() * 900000),
      remarks: `November salary for ${row.staff_name}`
    });
    setIsPayoutModalOpen(true);
  };

  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutTarget) return;

    try {
      await hotelApi.updatePayrollPayoutStatus(payoutTarget.staff_id, selectedPeriod, {
        payout_status: 'Paid',
        payment_date: payoutFormData.payment_date,
        payment_mode: payoutFormData.payment_mode,
        payment_reference: payoutFormData.payment_reference,
        remarks: payoutFormData.remarks
      }).catch(() => {});

      PmsStore.updatePayrollStatus(payoutTarget.staff_id, selectedPeriod, 'Paid', payoutFormData);
      setIsPayoutModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to mark salary as paid');
    }
  };

  const handleResetPayoutPending = async (staffId: number) => {
    try {
      await hotelApi.updatePayrollPayoutStatus(staffId, selectedPeriod, {
        payout_status: 'Pending'
      }).catch(() => {});
      PmsStore.updatePayrollStatus(staffId, selectedPeriod, 'Pending');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleOpenPaySlip = (row: StaffMonthlyPayroll) => {
    setSlipTarget(row);
    setIsPaySlipModalOpen(true);
  };

  const formatPeriodDisplay = (periodStr: string) => {
    const [y, m] = periodStr.split('-');
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="pms-reg-modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div 
        className="pms-reg-modal-window"
        style={{
          width: '95vw',
          maxWidth: '1240px',
          height: '92vh',
          maxHeight: '880px',
          display: 'flex',
          flexDirection: 'column',
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: 8,
          border: '1px solid #334155',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <header
          style={{
            background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
            borderBottom: '2px solid #0284c7',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>👷</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 0.5, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                STAFF PROFILES, MONTHLY SALARIES &amp; ADVANCE PAYROLL
                <span style={{ background: '#0284c7', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>
                  MODULE 1
                </span>
                {isLoading && (
                  <span style={{ background: '#334155', color: '#38bdf8', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                    🔄 Syncing...
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'} &bull; Rayagada, Odisha 765001 &bull; Active Workers Directory &amp; Automated End-of-Month Payroll
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Tab Selectors */}
            <div style={{ display: 'flex', background: '#1e293b', padding: 3, borderRadius: 6, border: '1px solid #334155' }}>
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'directory' ? '#0284c7' : 'transparent',
                  color: activeTab === 'directory' ? '#ffffff' : '#94a3b8'
                }}
              >
                👷 Staff Directory ({staffList.filter(s => s.is_active).length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('advances')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'advances' ? '#f59e0b' : 'transparent',
                  color: activeTab === 'advances' ? '#0f172a' : '#94a3b8'
                }}
              >
                💸 Advances Register ({advancesList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payroll')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'payroll' ? '#10b981' : 'transparent',
                  color: activeTab === 'payroll' ? '#ffffff' : '#94a3b8'
                }}
              >
                📊 Monthly Payroll Sheet
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#334155',
                color: '#f8fafc',
                border: 'none',
                width: 32,
                height: 32,
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 14
              }}
              title="Close Modal"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Modal Body Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#0b1329' }}>
          
          {/* ========================================================================= */}
          {/* TAB 1: STAFF PROFILES & WORKER DIRECTORY                                 */}
          {/* ========================================================================= */}
          {activeTab === 'directory' && (
            <div>
              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                <div style={{ background: '#1e293b', padding: 14, borderRadius: 6, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Active Staff</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>
                    {staffList.filter(s => s.is_active).length}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Across 7 Operational Departments</div>
                </div>

                <div style={{ background: '#1e293b', padding: 14, borderRadius: 6, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Gender Composition</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', marginTop: 6, display: 'flex', gap: 12 }}>
                    <span style={{ color: '#38bdf8' }}>♂ {staffList.filter(s => s.is_active && s.gender === 'Male').length} Male</span>
                    <span style={{ color: '#ec4899' }}>♀ {staffList.filter(s => s.is_active && s.gender === 'Female').length} Female</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>Equal opportunity hotel employment</div>
                </div>

                <div style={{ background: '#1e293b', padding: 14, borderRadius: 6, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Monthly Payroll Base</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981', marginTop: 4 }}>
                    ₹{staffList.filter(s => s.is_active).reduce((sum, s) => sum + s.monthly_base_salary, 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Total Fixed Monthly Base Obligation</div>
                </div>

                <div style={{ background: '#1e293b', padding: 14, borderRadius: 6, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Average Base Wage</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#facc15', marginTop: 4 }}>
                    ₹{Math.round(staffList.filter(s => s.is_active).length > 0
                      ? staffList.filter(s => s.is_active).reduce((sum, s) => sum + s.monthly_base_salary, 0) / staffList.filter(s => s.is_active).length
                      : 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Average per active employee</div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12 }}>
                <div style={{ display: 'flex', gap: 10, flex: 1, maxWidth: 700 }}>
                  <input
                    type="text"
                    placeholder="Search worker by name, code, role or mobile..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 4,
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: 12
                    }}
                  />

                  <select
                    value={selectedDepartment}
                    onChange={e => setSelectedDepartment(e.target.value)}
                    style={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 4,
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: 12
                    }}
                  >
                    <option value="All">All Departments</option>
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <select
                    value={selectedGender}
                    onChange={e => setSelectedGender(e.target.value)}
                    style={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 4,
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: 12
                    }}
                  >
                    <option value="All">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddStaff}
                  style={{
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '8px 18px',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>+</span> Add New Staff Profile
                </button>
              </div>

              {/* Staff Table */}
              <div style={{ background: '#1e293b', borderRadius: 6, border: '1px solid #334155', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', width: 90 }}>Code</th>
                      <th style={{ padding: '10px 12px' }}>Worker Name</th>
                      <th style={{ padding: '10px 12px', width: 80 }}>Gender</th>
                      <th style={{ padding: '10px 12px' }}>Department</th>
                      <th style={{ padding: '10px 12px' }}>Role / Profession</th>
                      <th style={{ padding: '10px 12px', width: 110 }}>Phone</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', width: 130 }}>Base Salary</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', width: 160 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                          No staff members found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map(stf => (
                        <tr key={stf.id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                            {stf.staff_code}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f8fafc' }}>
                            {stf.full_name}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              background: stf.gender === 'Female' ? '#831843' : '#1e3a5f',
                              color: stf.gender === 'Female' ? '#f472b6' : '#60a5fa',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 800
                            }}>
                              {stf.gender === 'Female' ? '♀ Female' : '♂ Male'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>
                            {stf.department}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#e2e8f0', fontWeight: 600 }}>
                            {stf.role}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {stf.phone}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#10b981' }}>
                            ₹{stf.monthly_base_salary.toLocaleString('en-IN')}.00
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleOpenAdvanceFor(stf.id)}
                                style={{
                                  background: '#ca8a04',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '3px 8px',
                                  borderRadius: 3,
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  fontWeight: 700
                                }}
                                title="Give Salary Advance"
                              >
                                💸 Advance
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditStaff(stf)}
                                style={{
                                  background: '#334155',
                                  color: '#38bdf8',
                                  border: 'none',
                                  padding: '3px 8px',
                                  borderRadius: 3,
                                  cursor: 'pointer',
                                  fontSize: 11
                                }}
                                title="Edit Profile"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStaff(stf.id, stf.full_name)}
                                style={{
                                  background: '#334155',
                                  color: '#ef4444',
                                  border: 'none',
                                  padding: '3px 8px',
                                  borderRadius: 3,
                                  cursor: 'pointer',
                                  fontSize: 11
                                }}
                                title="Deactivate"
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
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MID-MONTH SALARY ADVANCES REGISTER                                */}
          {/* ========================================================================= */}
          {activeTab === 'advances' && (
            <div>
              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                <div style={{ background: '#1e293b', padding: 14, borderRadius: 6, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Advances in {formatPeriodDisplay(selectedPeriod)}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', marginTop: 4 }}>
                    ₹{advancesList.reduce((sum, a) => sum + a.amount, 0).toLocaleString('en-IN')}.00
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Will be automatically deducted from monthly salary</div>
                </div>

                <div style={{ background: '#1e293b', padding: 14, borderRadius: 6, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Number of Advances Given</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>
                    {advancesList.length}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Logged with voucher sequences</div>
                </div>

                <div style={{ background: '#1e293b', padding: 14, borderRadius: 6, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Average Advance Issued</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#e2e8f0', marginTop: 4 }}>
                    ₹{Math.round(advancesList.length > 0 ? advancesList.reduce((sum, a) => sum + a.amount, 0) / advancesList.length : 0).toLocaleString('en-IN')}.00
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Per recorded advance voucher</div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>Payroll Month:</span>
                  <input
                    type="month"
                    value={selectedPeriod}
                    onChange={e => setSelectedPeriod(e.target.value)}
                    style={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 4,
                      padding: '6px 12px',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  />
                  <span style={{ fontSize: 12, color: '#38bdf8', fontWeight: 800 }}>
                    {formatPeriodDisplay(selectedPeriod)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAdvanceFor()}
                  style={{
                    background: '#f59e0b',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: 4,
                    padding: '8px 18px',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>💸</span> Issue New Salary Advance
                </button>
              </div>

              {/* Advances Table */}
              <div style={{ background: '#1e293b', borderRadius: 6, border: '1px solid #334155', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', width: 120 }}>Voucher No</th>
                      <th style={{ padding: '10px 12px', width: 100 }}>Date</th>
                      <th style={{ padding: '10px 12px' }}>Worker Name</th>
                      <th style={{ padding: '10px 12px' }}>Department</th>
                      <th style={{ padding: '10px 12px', width: 90 }}>Mode</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', width: 120 }}>Amount (₹)</th>
                      <th style={{ padding: '10px 12px' }}>Remarks / Reason</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', width: 80 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advancesList.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                          No salary advances recorded for {formatPeriodDisplay(selectedPeriod)}.
                        </td>
                      </tr>
                    ) : (
                      advancesList.map(adv => (
                        <tr key={adv.id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#f59e0b', fontWeight: 700 }}>
                            {adv.advance_voucher_no}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>
                            {adv.advance_date}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f8fafc' }}>
                            {adv.staff_name}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                            {adv.department}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              background: '#334155',
                              color: '#38bdf8',
                              padding: '2px 6px',
                              borderRadius: 3,
                              fontSize: 10,
                              fontWeight: 700
                            }}>
                              {adv.payment_mode}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#f59e0b' }}>
                            ₹{adv.amount.toLocaleString('en-IN')}.00
                          </td>
                          <td style={{ padding: '10px 12px', color: '#cbd5e1', fontStyle: 'italic' }}>
                            {adv.remarks || '-'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteAdvance(adv.id)}
                              style={{
                                background: '#334155',
                                color: '#ef4444',
                                border: 'none',
                                padding: '3px 8px',
                                borderRadius: 3,
                                cursor: 'pointer',
                                fontSize: 11
                              }}
                              title="Void Advance"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: AUTOMATED END-OF-MONTH PAYROLL CALCULATION                         */}
          {/* ========================================================================= */}
          {activeTab === 'payroll' && (
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
                <div style={{ background: '#1e293b', padding: 12, borderRadius: 6, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Staff</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#f8fafc', marginTop: 4 }}>
                    {payrollData.summary.total_staff_count}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Active employees</div>
                </div>

                <div style={{ background: '#1e293b', padding: 12, borderRadius: 6, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Gross Base Salary</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>
                    ₹{payrollData.summary.total_base_salaries.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Pre-deduction obligation</div>
                </div>

                <div style={{ background: '#1e293b', padding: 12, borderRadius: 6, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 10, color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>Total Advances Deducted</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#f59e0b', marginTop: 4 }}>
                    -₹{payrollData.summary.total_advances_deducted.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Auto-deducted from advances</div>
                </div>

                <div style={{ background: '#1e293b', padding: 12, borderRadius: 6, border: '1px solid #10b981' }}>
                  <div style={{ fontSize: 10, color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Net Payable Salary</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981', marginTop: 4 }}>
                    ₹{payrollData.summary.total_net_payable.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Actual cash/bank payout</div>
                </div>

                <div style={{ background: '#1e293b', padding: 12, borderRadius: 6, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Payout Progress</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: payrollData.summary.total_pending_count === 0 ? '#10b981' : '#f59e0b', marginTop: 4 }}>
                    {payrollData.summary.total_paid_count} / {payrollData.summary.total_staff_count}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>
                    {payrollData.summary.total_pending_count} Pending disbursement
                  </div>
                </div>
              </div>

              {/* Month Selector & Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>Select Month:</span>
                  <input
                    type="month"
                    value={selectedPeriod}
                    onChange={e => setSelectedPeriod(e.target.value)}
                    style={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 4,
                      padding: '6px 12px',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  />
                  <span style={{ fontSize: 13, color: '#10b981', fontWeight: 800 }}>
                    {formatPeriodDisplay(selectedPeriod)} Payroll Calculation
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={async () => {
                      await hotelApi.calculateMonthlyPayroll(selectedPeriod).catch(() => {});
                      loadData();
                      alert(`Payroll for ${formatPeriodDisplay(selectedPeriod)} successfully calculated and synchronized!`);
                    }}
                    style={{
                      background: '#10b981',
                      color: '#0f172a',
                      border: 'none',
                      borderRadius: 4,
                      padding: '8px 16px',
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>⚡</span> Recalculate &amp; Lock Payroll
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      background: '#334155',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '8px 16px',
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    🖨️ Print Sheet
                  </button>
                </div>
              </div>

              {/* Payroll Calculation Table */}
              <div style={{ background: '#1e293b', borderRadius: 6, border: '1px solid #334155', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', width: 85 }}>Code</th>
                      <th style={{ padding: '10px 12px' }}>Staff Name</th>
                      <th style={{ padding: '10px 12px' }}>Department &amp; Role</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', width: 120 }}>Base Salary (₹)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', width: 120, color: '#f59e0b' }}>Advances Deducted (₹)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', width: 130, color: '#10b981' }}>Net Payable (₹)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', width: 110 }}>Payout Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', width: 170 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollData.rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                          No staff found to generate payroll.
                        </td>
                      </tr>
                    ) : (
                      payrollData.rows.map(row => (
                        <tr key={row.staff_id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                            {row.staff_code}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f8fafc' }}>
                            {row.staff_name}
                            <span style={{ fontSize: 10, color: '#64748b', marginLeft: 6 }}>
                              ({row.gender === 'Female' ? '♀' : '♂'})
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>
                            <div>{row.role}</div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>{row.department}</div>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                            {row.monthly_base_salary.toLocaleString('en-IN')}.00
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#f59e0b' }}>
                            {row.total_advance_deducted > 0 ? `-${row.total_advance_deducted.toLocaleString('en-IN')}.00` : '₹0.00'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#10b981', fontSize: 13 }}>
                            ₹{row.net_payable_salary.toLocaleString('en-IN')}.00
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{
                              background: row.payout_status === 'Paid' ? '#064e3b' : '#78350f',
                              color: row.payout_status === 'Paid' ? '#34d399' : '#fde68a',
                              padding: '3px 10px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 900,
                              letterSpacing: 0.5,
                              display: 'inline-block'
                            }}>
                              {row.payout_status === 'Paid' ? '✓ PAID' : '⏳ PENDING'}
                            </span>
                            {row.payment_mode && (
                              <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>
                                {row.payment_mode}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              {row.payout_status === 'Pending' ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPayout(row)}
                                  style={{
                                    background: '#10b981',
                                    color: '#0f172a',
                                    border: 'none',
                                    padding: '3px 9px',
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                    fontSize: 11,
                                    fontWeight: 800
                                  }}
                                  title="Mark Salary as Paid"
                                >
                                  💳 Pay
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleResetPayoutPending(row.staff_id)}
                                  style={{
                                    background: '#334155',
                                    color: '#94a3b8',
                                    border: 'none',
                                    padding: '3px 7px',
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                    fontSize: 11
                                  }}
                                  title="Reset to Pending"
                                >
                                  ↩
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenPaySlip(row)}
                                style={{
                                  background: '#334155',
                                  color: '#38bdf8',
                                  border: 'none',
                                  padding: '3px 9px',
                                  borderRadius: 3,
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  fontWeight: 700
                                }}
                                title="View / Print Salary Slip"
                              >
                                📄 Slip
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {payrollData.rows.length > 0 && (
                    <tfoot>
                      <tr style={{ background: '#0f172a', borderTop: '2px solid #334155', fontWeight: 900 }}>
                        <td colSpan={3} style={{ padding: '10px 12px', textAlign: 'right' }}>Total Hotel Obligation:</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#38bdf8' }}>
                          ₹{payrollData.summary.total_base_salaries.toLocaleString('en-IN')}.00
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#f59e0b' }}>
                          -₹{payrollData.summary.total_advances_deducted.toLocaleString('en-IN')}.00
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#10b981', fontSize: 13 }}>
                          ₹{payrollData.summary.total_net_payable.toLocaleString('en-IN')}.00
                        </td>
                        <td colSpan={2} style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>
                          {payrollData.summary.total_paid_count} Paid / {payrollData.summary.total_pending_count} Pending
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <footer
          style={{
            background: '#0f172a',
            borderTop: '1px solid #334155',
            padding: '10px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11,
            color: '#94a3b8',
            flexShrink: 0
          }}
        >
          <div>
            Sri Sai Vasudev Residency &bull; Staff HR, Advance Loans &amp; Automated Payroll System &bull; Rayagada (REG-06)
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#334155',
              color: '#fff',
              border: 'none',
              padding: '6px 16px',
              borderRadius: 4,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </footer>
      </div>

      {/* ========================================================================= */}
      {/* DIALOG 1: ADD / EDIT STAFF PROFILE MODAL                                  */}
      {/* ========================================================================= */}
      {isStaffFormOpen && (
        <div 
          className="pms-reg-modal-backdrop"
          onClick={() => setIsStaffFormOpen(false)}
          style={{ zIndex: 1100, background: 'rgba(0,0,0,0.7)' }}
        >
          <div
            className="pms-reg-modal-window"
            style={{
              width: '90vw',
              maxWidth: '640px',
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #475569',
              padding: 24
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#38bdf8' }}>
                {editingStaff ? `✏️ Edit Staff: ${editingStaff.full_name}` : '➕ Add New Hotel Worker Profile'}
              </div>
              <button type="button" onClick={() => setIsStaffFormOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                    Staff Code *
                  </label>
                  <input
                    type="text"
                    value={staffFormData.staff_code}
                    onChange={e => setStaffFormData({ ...staffFormData, staff_code: e.target.value })}
                    required
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12, fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Nayak"
                    value={staffFormData.full_name}
                    onChange={e => setStaffFormData({ ...staffFormData, full_name: e.target.value })}
                    required
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                    Gender *
                  </label>
                  <select
                    value={staffFormData.gender}
                    onChange={e => setStaffFormData({ ...staffFormData, gender: e.target.value as StaffGender })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                    Department *
                  </label>
                  <select
                    value={staffFormData.department}
                    onChange={e => setStaffFormData({ ...staffFormData, department: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                    Profession / Role *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room Attendant, Head Chef, Steward"
                    value={staffFormData.role}
                    onChange={e => setStaffFormData({ ...staffFormData, role: e.target.value })}
                    required
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9437123450"
                    value={staffFormData.phone}
                    onChange={e => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                    required
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
                    Fixed Monthly Base Salary (₹) *
                  </label>
                  <input
                    type="number"
                    value={staffFormData.monthly_base_salary}
                    onChange={e => setStaffFormData({ ...staffFormData, monthly_base_salary: parseFloat(e.target.value) || 0 })}
                    required
                    min={0}
                    step={100}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #10b981', borderRadius: 4, padding: '7px 10px', color: '#10b981', fontSize: 13, fontWeight: 900 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                    Date of Joining
                  </label>
                  <input
                    type="date"
                    value={staffFormData.date_of_joining}
                    onChange={e => setStaffFormData({ ...staffFormData, date_of_joining: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={staffFormData.bank_name}
                    onChange={e => setStaffFormData({ ...staffFormData, bank_name: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                    Bank Account No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 39485729103"
                    value={staffFormData.bank_account_no}
                    onChange={e => setStaffFormData({ ...staffFormData, bank_account_no: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, borderTop: '1px solid #334155', paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setIsStaffFormOpen(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: 4, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}
                >
                  {editingStaff ? 'Update Profile' : 'Save Staff Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 2: RECORD SALARY ADVANCE MODAL                                    */}
      {/* ========================================================================= */}
      {isAdvanceFormOpen && (
        <div 
          className="pms-reg-modal-backdrop"
          onClick={() => setIsAdvanceFormOpen(false)}
          style={{ zIndex: 1100, background: 'rgba(0,0,0,0.7)' }}
        >
          <div
            className="pms-reg-modal-window"
            style={{
              width: '90vw',
              maxWidth: '520px',
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #f59e0b',
              padding: 24
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#f59e0b' }}>
                💸 Issue Mid-Month Salary Advance
              </div>
              <button type="button" onClick={() => setIsAdvanceFormOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdvance}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                    Select Staff Member *
                  </label>
                  <select
                    value={advanceFormData.staff_id}
                    onChange={e => setAdvanceFormData({ ...advanceFormData, staff_id: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '8px 10px', color: '#fff', fontSize: 12 }}
                  >
                    {staffList.filter(s => s.is_active).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.staff_code} &bull; {s.department} &bull; Base: ₹{s.monthly_base_salary})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                      Advance Date *
                    </label>
                    <input
                      type="date"
                      value={advanceFormData.advance_date}
                      onChange={e => setAdvanceFormData({ ...advanceFormData, advance_date: e.target.value })}
                      required
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '8px 10px', color: '#fff', fontSize: 12 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                      Advance Amount (₹) *
                    </label>
                    <input
                      type="number"
                      value={advanceFormData.amount}
                      onChange={e => setAdvanceFormData({ ...advanceFormData, amount: parseFloat(e.target.value) || 0 })}
                      required
                      min={100}
                      step={100}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #f59e0b', borderRadius: 4, padding: '8px 10px', color: '#f59e0b', fontSize: 13, fontWeight: 900 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                    Disbursement Payment Mode *
                  </label>
                  <select
                    value={advanceFormData.payment_mode}
                    onChange={e => setAdvanceFormData({ ...advanceFormData, payment_mode: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '8px 10px', color: '#fff', fontSize: 12 }}
                  >
                    <option value="Cash">Cash in Drawer</option>
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="Bank Transfer">Bank Transfer (IMPS / NEFT)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                    Reason / Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Family festival, medical emergency advance"
                    value={advanceFormData.remarks}
                    onChange={e => setAdvanceFormData({ ...advanceFormData, remarks: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '8px 10px', color: '#fff', fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, borderTop: '1px solid #334155', paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setIsAdvanceFormOpen(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '8px 24px', borderRadius: 4, fontWeight: 900, cursor: 'pointer', fontSize: 12 }}
                >
                  Confirm &amp; Issue Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 3: MARK SALARY AS PAID MODAL                                      */}
      {/* ========================================================================= */}
      {isPayoutModalOpen && payoutTarget && (
        <div 
          className="pms-reg-modal-backdrop"
          onClick={() => setIsPayoutModalOpen(false)}
          style={{ zIndex: 1100, background: 'rgba(0,0,0,0.7)' }}
        >
          <div
            className="pms-reg-modal-window"
            style={{
              width: '90vw',
              maxWidth: '480px',
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #10b981',
              padding: 24
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#10b981' }}>
                💳 Disburse Salary Payout
              </div>
              <button type="button" onClick={() => setIsPayoutModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ background: '#0f172a', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#94a3b8' }}>Staff Member:</span>
                <strong style={{ color: '#f8fafc' }}>{payoutTarget.staff_name} ({payoutTarget.staff_code})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#94a3b8' }}>Monthly Base Salary:</span>
                <span>₹{payoutTarget.monthly_base_salary.toLocaleString('en-IN')}.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#f59e0b' }}>
                <span>Advances Deducted:</span>
                <span>-₹{payoutTarget.total_advance_deducted.toLocaleString('en-IN')}.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: 6, marginTop: 6, fontSize: 14, fontWeight: 900 }}>
                <span style={{ color: '#10b981' }}>Net Payable Amount:</span>
                <span style={{ color: '#10b981' }}>₹{payoutTarget.net_payable_salary.toLocaleString('en-IN')}.00</span>
              </div>
            </div>

            <form onSubmit={handleSavePayout}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      value={payoutFormData.payment_date}
                      onChange={e => setPayoutFormData({ ...payoutFormData, payment_date: e.target.value })}
                      required
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                      Payment Mode *
                    </label>
                    <select
                      value={payoutFormData.payment_mode}
                      onChange={e => setPayoutFormData({ ...payoutFormData, payment_mode: e.target.value })}
                      style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                      <option value="Cash">Cash in Hand</option>
                      <option value="UPI">UPI (GPay / PhonePe)</option>
                      <option value="Cheque">Bank Cheque</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                    Bank UTR / Reference Number
                  </label>
                  <input
                    type="text"
                    value={payoutFormData.payment_reference}
                    onChange={e => setPayoutFormData({ ...payoutFormData, payment_reference: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12, fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                    Payment Remarks
                  </label>
                  <input
                    type="text"
                    value={payoutFormData.remarks}
                    onChange={e => setPayoutFormData({ ...payoutFormData, remarks: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, borderTop: '1px solid #334155', paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#10b981', color: '#0f172a', border: 'none', padding: '8px 24px', borderRadius: 4, fontWeight: 900, cursor: 'pointer', fontSize: 12 }}
                >
                  Confirm Payout &amp; Mark Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 4: PRINTABLE SALARY PAY SLIP MODAL                                */}
      {/* ========================================================================= */}
      {isPaySlipModalOpen && slipTarget && (
        <div 
          className="pms-reg-modal-backdrop"
          onClick={() => setIsPaySlipModalOpen(false)}
          style={{ zIndex: 1100, background: 'rgba(0,0,0,0.75)' }}
        >
          <div
            className="pms-reg-modal-window"
            style={{
              width: '90vw',
              maxWidth: '680px',
              background: '#ffffff',
              color: '#000000',
              borderRadius: 6,
              padding: 28,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
              fontFamily: "'Courier New', Courier, monospace"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Pay Slip Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>
                {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'}
              </div>
              <div style={{ fontSize: 11 }}>
                PROPRIETOR: PAIDISETTY MANMADHA RAO &bull; GSTIN: 21AEKPP8689J1ZS
              </div>
              <div style={{ fontSize: 10.5, color: '#334155' }}>
                SR RESIDENCY, NEAR ANDHRA BANK, NEW COLONY, Rayagada, Odisha - 765001
              </div>
              <div style={{
                display: 'inline-block',
                border: '1.5px solid #000',
                padding: '2px 14px',
                fontSize: 12,
                fontWeight: 900,
                marginTop: 6
              }}>
                SALARY &amp; EARNINGS PAY SLIP &bull; {formatPeriodDisplay(slipTarget.payroll_period).toUpperCase()}
              </div>
            </div>

            {/* Employee Details Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, borderBottom: '1px solid #000', paddingBottom: 10, marginBottom: 12, fontSize: 11 }}>
              <div><strong>Staff Code:</strong> {slipTarget.staff_code}</div>
              <div><strong>Payment Date:</strong> {slipTarget.payment_date || new Date().toISOString().slice(0, 10)}</div>
              <div><strong>Employee Name:</strong> {slipTarget.staff_name}</div>
              <div><strong>Gender:</strong> {slipTarget.gender}</div>
              <div><strong>Department:</strong> {slipTarget.department}</div>
              <div><strong>Role / Designation:</strong> {slipTarget.role}</div>
              <div><strong>Mobile:</strong> {slipTarget.phone}</div>
              <div><strong>Payout Status:</strong> {slipTarget.payout_status.toUpperCase()}</div>
            </div>

            {/* Earnings & Deductions Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
              <thead>
                <tr style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', background: '#f8fafc' }}>
                  <th style={{ padding: '4px 6px', textAlign: 'left', width: '60%' }}>SALARY COMPONENT</th>
                  <th style={{ padding: '4px 6px', textAlign: 'right', width: '40%' }}>AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '5px 6px' }}>Monthly Basic CTC Salary</td>
                  <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 700 }}>
                    ₹{slipTarget.monthly_base_salary.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '5px 6px', color: '#b91c1c' }}>
                    Less: Mid-Month Salary Advance Recovered
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'right', color: '#b91c1c', fontWeight: 700 }}>
                    -₹{slipTarget.total_advance_deducted.toFixed(2)}
                  </td>
                </tr>
                {slipTarget.bonus_or_allowance ? (
                  <tr>
                    <td style={{ padding: '5px 6px' }}>Special Performance Allowance / Bonus</td>
                    <td style={{ padding: '5px 6px', textAlign: 'right' }}>
                      +₹{slipTarget.bonus_or_allowance.toFixed(2)}
                    </td>
                  </tr>
                ) : null}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', fontWeight: 900, fontSize: 13 }}>
                  <td style={{ padding: '6px' }}>NET TAKE-HOME SALARY:</td>
                  <td style={{ padding: '6px', textAlign: 'right', color: '#047857' }}>
                    ₹{slipTarget.net_payable_salary.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Payout Details */}
            {slipTarget.payment_mode && (
              <div style={{ fontSize: 10, marginBottom: 14, background: '#f1f5f9', padding: 8, border: '1px dashed #64748b' }}>
                <div><strong>Disbursement Mode:</strong> {slipTarget.payment_mode}</div>
                {slipTarget.payment_reference && <div><strong>Bank UTR / Ref:</strong> {slipTarget.payment_reference}</div>}
              </div>
            )}

            {/* Signature Blocks */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 32, paddingTop: 6, fontSize: 10 }}>
              <div style={{ textAlign: 'center', width: 180, borderTop: '1px dashed #000', paddingTop: 4 }}>
                <strong>EMPLOYEE SIGNATURE</strong>
                <div style={{ fontSize: 9, color: '#64748b' }}>Acknowledged Receipt</div>
              </div>
              <div style={{ textAlign: 'center', width: 220, borderTop: '1px dashed #000', paddingTop: 4 }}>
                <strong>AUTHORIZED SIGNATORY</strong>
                <div style={{ fontSize: 9, color: '#64748b' }}>For Sri Sai Vasudev Residency</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setIsPaySlipModalOpen(false)}
                style={{ background: '#334155', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 20px', borderRadius: 4, fontWeight: 800, cursor: 'pointer', fontSize: 11 }}
              >
                🖨️ Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
