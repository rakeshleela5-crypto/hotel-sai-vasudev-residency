import React, { useState, useEffect, useMemo } from 'react';
import type { 
  StaffProfile, 
  StaffSalaryAdvance, 
  StaffMonthlyPayroll, 
  StaffDepartment,
  StaffGender,
  DailyAttendanceReport,
  MonthlyAttendanceReport,
  HardwareStatusInfo
} from '../../types/pmsModels';
import { PmsStore, usePmsSync } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
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

  const [activeTab, setActiveTab] = useState<'directory' | 'advances' | 'payroll' | 'attendance'>('directory');
  const companyInfo = PmsStore.getCompanyInfo();

  // Module 5: Hardware eSSL AIFACE-ERIS Biometric Attendance State
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [attendanceSubTab, setAttendanceSubTab] = useState<'daily' | 'monthly'>('daily');
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendanceReport | null>(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState<MonthlyAttendanceReport | null>(null);
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatusInfo | null>(null);
  const [isSyncingDevice, setIsSyncingDevice] = useState<boolean>(false);
  const [isManualPunchOpen, setIsManualPunchOpen] = useState<boolean>(false);
  const [manualPunchData, setManualPunchData] = useState<{
    staff_id: number;
    punch_date: string;
    punch_time: string;
    punch_type: 'Check-In' | 'Check-Out';
    notes: string;
  }>({
    staff_id: 1,
    punch_date: new Date().toISOString().slice(0, 10),
    punch_time: '09:00',
    punch_type: 'Check-In',
    notes: 'Front Desk manual punch entry'
  });

  // Current month default: "YYYY-MM"
  const defaultCurrentPeriod = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedPeriod, setSelectedPeriod] = useState<string>(defaultCurrentPeriod);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [advancesList, setAdvancesList] = useState<StaffSalaryAdvance[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 200);
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

  // Module 5: Load Biometric Attendance Data from eSSL AIFACE-ERIS / Store
  const loadAttendanceData = async () => {
    try {
      // 1. Daily Summary
      try {
        const d = await hotelApi.getDailyAttendanceSummary({
          target_date: attendanceDate,
          department: selectedDepartment !== 'All' ? selectedDepartment : undefined
        });
        setDailyAttendance(d);
      } catch {
        const dStore = PmsStore.getDailyAttendanceSummary(attendanceDate, selectedDepartment);
        setDailyAttendance(dStore);
      }

      // 2. Monthly Summary
      try {
        const m = await hotelApi.getMonthlyAttendanceSummary({
          month_period: selectedPeriod,
          department: selectedDepartment !== 'All' ? selectedDepartment : undefined
        });
        setMonthlyAttendance(m);
      } catch {
        const mStore = PmsStore.getMonthlyAttendanceSummary(selectedPeriod, selectedDepartment);
        setMonthlyAttendance(mStore);
      }

      // 3. Hardware Diagnostics
      try {
        const hw = await hotelApi.getHardwareStatus();
        setHardwareStatus(hw);
      } catch {
        const hwStore = PmsStore.getHardwareStatusInfo();
        setHardwareStatus(hwStore);
      }
    } catch (err) {
      console.warn('[StaffPayrollManagementModal] Attendance load warning:', err);
    }
  };

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

      // 3. Fetch Biometric Attendance
      await loadAttendanceData();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, selectedPeriod, attendanceDate, selectedDepartment]);

  // Sync eSSL Device Punches Handler
  const handleSyncEsslDevice = async () => {
    setIsSyncingDevice(true);
    try {
      let count = 0;
      try {
        const res = await hotelApi.syncEsslDevice();
        count = res.synced_punches || 0;
      } catch {
        const syncRes = await PmsStore.syncEsslDevicePunches();
        count = syncRes.count || 0;
      }
      await loadAttendanceData();
      alert(`✓ Successfully synchronized ${count} facial recognition punches from eSSL AIFACE-ERIS terminal.`);
    } catch (err: any) {
      alert(`Failed to sync eSSL device: ${err.message || 'Device offline'}`);
    } finally {
      setIsSyncingDevice(false);
    }
  };

  // Manual Punch Handler
  const handleSaveManualPunch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      try {
        await hotelApi.recordManualPunch({
          staff_id: manualPunchData.staff_id,
          punch_date: manualPunchData.punch_date,
          punch_time: manualPunchData.punch_time,
          punch_type: manualPunchData.punch_type,
          notes: manualPunchData.notes
        });
      } catch {
        PmsStore.saveBiometricPunch({
          staff_id: manualPunchData.staff_id,
          punch_date: manualPunchData.punch_date,
          punch_time: manualPunchData.punch_time,
          punch_type: manualPunchData.punch_type,
          verification_mode: 'Manual Override',
          status: 'Present',
          notes: manualPunchData.notes
        });
      }
      setIsManualPunchOpen(false);
      await loadAttendanceData();
      alert('✓ Front desk attendance punch recorded successfully.');
    } catch (err: any) {
      alert(`Error saving punch: ${err.message || 'Operation failed'}`);
    }
  };

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      if (!s.is_active) return false;
      if (selectedDepartment !== 'All' && s.department !== selectedDepartment) return false;
      if (selectedGender !== 'All' && s.gender !== selectedGender) return false;
      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase();
        const matchName = s.full_name.toLowerCase().includes(q);
        const matchRole = s.role.toLowerCase().includes(q);
        const matchCode = s.staff_code.toLowerCase().includes(q);
        const matchPhone = s.phone.includes(q);
        if (!matchName && !matchRole && !matchCode && !matchPhone) return false;
      }
      return true;
    });
  }, [staffList, selectedDepartment, selectedGender, debouncedSearchQuery]);

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
              <button
                type="button"
                onClick={() => setActiveTab('attendance')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'attendance' ? '#8b5cf6' : 'transparent',
                  color: activeTab === 'attendance' ? '#ffffff' : '#94a3b8'
                }}
              >
                👤 Face Attendance (eSSL ERIS)
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

          {/* ========================================================================= */}
          {/* TAB 4: eSSL AIFACE-ERIS BIOMETRIC FACE ATTENDANCE (MODULE 5)              */}
          {/* ========================================================================= */}
          {activeTab === 'attendance' && (
            <div>
              {/* Hardware Diagnostic Banner */}
              <div
                style={{
                  background: 'linear-gradient(90deg, #1e1b4b 0%, #1e293b 100%)',
                  padding: '14px 18px',
                  borderRadius: 6,
                  border: '1px solid #6366f1',
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 28 }}>🤖</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 8 }}>
                      eSSL AIFACE-ERIS FACE RECOGNITION TERMINAL
                      <span style={{ background: '#059669', color: '#ffffff', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>
                        🟢 ONLINE &bull; PUSH SYNCED
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>
                      Device IP: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{hardwareStatus?.essl_aiface_eris?.ip_address || '192.168.1.201'}:{hardwareStatus?.essl_aiface_eris?.port || 4370}</span> &bull; 
                      Serial: <span style={{ fontFamily: 'monospace', color: '#facc15' }}>{hardwareStatus?.essl_aiface_eris?.serial_no || 'ERIS-2026-SVR01'}</span> &bull; 
                      Protocol: <span style={{ color: '#34d399', fontFamily: 'monospace' }}>ADMS /iclock/cdata</span> &bull; 
                      Mode: Visible Light Facial Bio
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleSyncEsslDevice}
                    disabled={isSyncingDevice}
                    style={{
                      background: isSyncingDevice ? '#475569' : '#4f46e5',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: isSyncingDevice ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>{isSyncingDevice ? '⏳' : '🔄'}</span>
                    <span>{isSyncingDevice ? 'Syncing Hardware...' : 'Sync eSSL Device Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setManualPunchData({
                        staff_id: staffList[0]?.id ?? 1,
                        punch_date: attendanceDate,
                        punch_time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                        punch_type: 'Check-In',
                        notes: 'Front Desk manual check-in'
                      });
                      setIsManualPunchOpen(true);
                    }}
                    style={{
                      background: '#334155',
                      color: '#38bdf8',
                      border: '1px solid #475569',
                      padding: '8px 14px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ➕ Manual Punch
                  </button>
                </div>
              </div>

              {/* Sub-tab selection: Daily Log vs Monthly Payable Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', background: '#1e293b', padding: 3, borderRadius: 6, border: '1px solid #334155' }}>
                  <button
                    type="button"
                    onClick={() => setAttendanceSubTab('daily')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      background: attendanceSubTab === 'daily' ? '#6366f1' : 'transparent',
                      color: attendanceSubTab === 'daily' ? '#ffffff' : '#94a3b8'
                    }}
                  >
                    📅 Daily Punch Log &amp; Work Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceSubTab('monthly')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      background: attendanceSubTab === 'monthly' ? '#10b981' : 'transparent',
                      color: attendanceSubTab === 'monthly' ? '#ffffff' : '#94a3b8'
                    }}
                  >
                    📊 Monthly Attendance &amp; Effective Payable Days
                  </button>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {attendanceSubTab === 'daily' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>Punch Date:</label>
                      <input
                        type="date"
                        value={attendanceDate}
                        onChange={e => setAttendanceDate(e.target.value)}
                        style={{
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: 4,
                          padding: '5px 8px',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 700
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>Month:</label>
                      <input
                        type="month"
                        value={selectedPeriod}
                        onChange={e => setSelectedPeriod(e.target.value)}
                        style={{
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: 4,
                          padding: '5px 8px',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 700
                        }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>Dept:</label>
                    <select
                      value={selectedDepartment}
                      onChange={e => setSelectedDepartment(e.target.value)}
                      style={{
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 4,
                        padding: '5px 8px',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700
                      }}
                    >
                      <option value="All">All Departments</option>
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SUB-VIEW 1: DAILY ATTENDANCE */}
              {attendanceSubTab === 'daily' && (
                <div>
                  {/* Daily KPI Badges */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: '#1e293b', padding: 12, borderRadius: 6, border: '1px solid #334155' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Staff</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#38bdf8', marginTop: 2 }}>
                        {dailyAttendance?.total_staff ?? staffList.filter(s => s.is_active).length}
                      </div>
                      <div style={{ fontSize: 9, color: '#64748b' }}>Active Profiles</div>
                    </div>

                    <div style={{ background: '#1e293b', padding: 12, borderRadius: 6, border: '1px solid #334155' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Present Today</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#34d399', marginTop: 2 }}>
                        {dailyAttendance?.present_count ?? 0}
                      </div>
                      <div style={{ fontSize: 9, color: '#059669' }}>Facial Bio Confirmed</div>
                    </div>

                    <div style={{ background: '#1e293b', padding: 12, borderRadius: 6, border: '1px solid #334155' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Late Arrivals</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24', marginTop: 2 }}>
                        {dailyAttendance?.late_count ?? 0}
                      </div>
                      <div style={{ fontSize: 9, color: '#d97706' }}>After 09:15 AM</div>
                    </div>

                    <div style={{ background: '#1e293b', padding: 12, borderRadius: 6, border: '1px solid #334155' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Absent</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#f87171', marginTop: 2 }}>
                        {dailyAttendance?.absent_count ?? 0}
                      </div>
                      <div style={{ fontSize: 9, color: '#dc2626' }}>No punch registered</div>
                    </div>

                    <div style={{ background: '#1e293b', padding: 12, borderRadius: 6, border: '1px solid #334155' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Attendance Rate</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#c084fc', marginTop: 2 }}>
                        {dailyAttendance?.attendance_rate_pct ?? 0}%
                      </div>
                      <div style={{ fontSize: 9, color: '#9333ea' }}>Overall daily turnout</div>
                    </div>
                  </div>

                  {/* Daily Punch Grid */}
                  <div style={{ background: '#1e293b', borderRadius: 6, border: '1px solid #334155', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#0f172a', borderBottom: '2px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                          <th style={{ padding: '10px 12px', width: 90 }}>Staff Code</th>
                          <th style={{ padding: '10px 12px' }}>Worker Name</th>
                          <th style={{ padding: '10px 12px' }}>Department &amp; Role</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', width: 100 }}>First In</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', width: 100 }}>Last Out</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', width: 90 }}>Work Hours</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', width: 100 }}>Status</th>
                          <th style={{ padding: '10px 12px', width: 150 }}>Verification</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', width: 70 }}>Punches</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!dailyAttendance || dailyAttendance.rows.length === 0 ? (
                          <tr>
                            <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                              No attendance punches found for {attendanceDate}. Click &quot;Sync eSSL Device Now&quot; to fetch logs.
                            </td>
                          </tr>
                        ) : (
                          dailyAttendance.rows.map(row => (
                            <tr key={row.staff_id} style={{ borderBottom: '1px solid #334155' }}>
                              <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                                {row.staff_code}
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f8fafc' }}>
                                {row.full_name}
                                <span style={{ fontSize: 10, color: '#64748b', marginLeft: 6 }}>
                                  ({row.gender === 'Female' ? '♀' : '♂'})
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>
                                <div>{row.role}</div>
                                <div style={{ fontSize: 10, color: '#64748b' }}>{row.department}</div>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'monospace', color: row.check_in !== '--' ? '#34d399' : '#64748b', fontWeight: 700 }}>
                                {row.check_in}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'monospace', color: row.check_out !== '--' ? '#38bdf8' : '#64748b', fontWeight: 700 }}>
                                {row.check_out}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: row.work_hours >= 8 ? '#34d399' : row.work_hours > 0 ? '#fbbf24' : '#64748b' }}>
                                {row.work_hours > 0 ? `${row.work_hours.toFixed(1)} hrs` : '--'}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    fontSize: 10,
                                    fontWeight: 900,
                                    letterSpacing: 0.5,
                                    background:
                                      row.status === 'Present'
                                        ? '#064e3b'
                                        : row.status === 'Late'
                                        ? '#78350f'
                                        : row.status === 'Half Day'
                                        ? '#1e3a8a'
                                        : '#7f1d1d',
                                    color:
                                      row.status === 'Present'
                                        ? '#34d399'
                                        : row.status === 'Late'
                                        ? '#fbbf24'
                                        : row.status === 'Half Day'
                                        ? '#93c5fd'
                                        : '#f87171'
                                  }}
                                >
                                  {row.status.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: 11, color: '#94a3b8' }}>
                                {row.verification_mode || 'Face Recognition'}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: '#38bdf8' }}>
                                {row.punch_count}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-VIEW 2: MONTHLY ATTENDANCE SUMMARY & EFFECTIVE PAYABLE DAYS */}
              {attendanceSubTab === 'monthly' && (
                <div>
                  <div style={{ background: '#1e293b', borderRadius: 6, border: '1px solid #334155', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 16px', background: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#10b981' }}>
                        📊 MONTHLY ATTENDANCE MATRIX &bull; {formatPeriodDisplay(selectedPeriod)}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        Directly links eSSL Biometric Punches to Module 1 Staff Base Salary
                      </span>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#0f172a', borderBottom: '2px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                          <th style={{ padding: '10px 12px', width: 90 }}>Staff Code</th>
                          <th style={{ padding: '10px 12px' }}>Worker Name</th>
                          <th style={{ padding: '10px 12px' }}>Department &amp; Role</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', width: 120 }}>Base Salary (₹)</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', width: 80 }}>Month Days</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', width: 80, color: '#34d399' }}>Present</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', width: 70, color: '#fbbf24' }}>Late</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', width: 70, color: '#f87171' }}>Absent</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', width: 90, color: '#38bdf8' }}>Payable Days</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', width: 130, color: '#10b981' }}>Earned Wage (₹)</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', width: 90 }}>Turnout %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!monthlyAttendance || monthlyAttendance.summary.length === 0 ? (
                          <tr>
                            <td colSpan={11} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                              No monthly attendance data available for {selectedPeriod}.
                            </td>
                          </tr>
                        ) : (
                          monthlyAttendance.summary.map(row => (
                            <tr key={row.staff_id} style={{ borderBottom: '1px solid #334155' }}>
                              <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                                {row.staff_code}
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f8fafc' }}>
                                {row.full_name}
                                <span style={{ fontSize: 10, color: '#64748b', marginLeft: 6 }}>
                                  ({row.gender === 'Female' ? '♀' : '♂'})
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>
                                <div>{row.role}</div>
                                <div style={{ fontSize: 10, color: '#64748b' }}>{row.department}</div>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                                ₹{row.monthly_base_salary.toLocaleString('en-IN')}.00
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8' }}>
                                {row.total_days_in_month}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: '#34d399' }}>
                                {row.present_days}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#fbbf24' }}>
                                {row.late_count}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#f87171' }}>
                                {row.absent_days}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 900, color: '#38bdf8' }}>
                                {row.effective_payable_days.toFixed(1)}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#10b981', fontSize: 13 }}>
                                ₹{row.attendance_earned_salary.toLocaleString('en-IN')}.00
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                                  <div style={{ width: 42, height: 6, background: '#334155', borderRadius: 3, overflow: 'hidden' }}>
                                    <div
                                      style={{
                                        width: `${row.attendance_rate_pct}%`,
                                        height: '100%',
                                        background: row.attendance_rate_pct >= 90 ? '#10b981' : row.attendance_rate_pct >= 75 ? '#fbbf24' : '#ef4444'
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: '#cbd5e1' }}>
                                    {row.attendance_rate_pct}%
                                  </span>
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

      {/* ========================================================================= */}
      {/* DIALOG 5: FRONT DESK MANUAL PUNCH MODAL                                   */}
      {/* ========================================================================= */}
      {isManualPunchOpen && (
        <div
          className="pms-reg-modal-backdrop"
          onClick={() => setIsManualPunchOpen(false)}
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
              border: '1px solid #475569',
              padding: 24
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#38bdf8' }}>
                ➕ Record Front Desk Attendance Punch
              </div>
              <button type="button" onClick={() => setIsManualPunchOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualPunch}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  Select Worker *
                </label>
                <select
                  value={manualPunchData.staff_id}
                  onChange={e => setManualPunchData({ ...manualPunchData, staff_id: Number(e.target.value) })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                >
                  {staffList.filter(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.staff_code} - {s.full_name} ({s.department} &bull; {s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                    Punch Date *
                  </label>
                  <input
                    type="date"
                    value={manualPunchData.punch_date}
                    onChange={e => setManualPunchData({ ...manualPunchData, punch_date: e.target.value })}
                    required
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                    Punch Time (24h) *
                  </label>
                  <input
                    type="time"
                    value={manualPunchData.punch_time}
                    onChange={e => setManualPunchData({ ...manualPunchData, punch_time: e.target.value })}
                    required
                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  Punch Type *
                </label>
                <select
                  value={manualPunchData.punch_type}
                  onChange={e => setManualPunchData({ ...manualPunchData, punch_type: e.target.value as any })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                >
                  <option value="Check-In">Check-In (Morning / Shift In)</option>
                  <option value="Check-Out">Check-Out (Evening / Shift Out)</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  Remarks / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Outdoor maintenance duty or biometric terminal override"
                  value={manualPunchData.notes}
                  onChange={e => setManualPunchData({ ...manualPunchData, notes: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '7px 10px', color: '#fff', fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsManualPunchOpen(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}
                >
                  Save Punch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
