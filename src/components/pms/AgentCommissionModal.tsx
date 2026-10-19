import React, { useState } from 'react';
import type { 
  PmsCommissionAgent, 
  PmsAgentPayoutVoucher,
  PmsAgentType,
  PmsCommissionCalcType
} from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import './pmsStyles.css';

interface AgentCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchFeature?: (modalName: string) => void;
}

export const AgentCommissionModal: React.FC<AgentCommissionModalProps> = ({
  isOpen,
  onClose,
  onLaunchFeature
}) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'agents' | 'payouts' | 'top15'>('ledger');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // New Agent Registration Form State
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentPhone, setNewAgentPhone] = useState('');
  const [newAgentCity, setNewAgentCity] = useState('Shirdi');
  const [newAgentType, setNewAgentType] = useState<PmsAgentType>('Travel_Agent');
  const [newCommType, setNewCommType] = useState<PmsCommissionCalcType>('PERCENTAGE');
  const [newCommRate, setNewCommRate] = useState<number>(15);
  const [newPanNo, setNewPanNo] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newAccountNo, setNewAccountNo] = useState('');
  const [newIfsc, setNewIfsc] = useState('');
  const [newUpiId, setNewUpiId] = useState('');
  const [newAgentNotes, setNewAgentNotes] = useState('');

  // Payout Drawer / Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAgentId, setPayoutAgentId] = useState<string>('');
  const [payoutPaymentMode, setPayoutPaymentMode] = useState<'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE'>('UPI');
  const [payoutRefNo, setPayoutRefNo] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>([]);

  // Printable Voucher State
  const [printedVoucher, setPrintedVoucher] = useState<PmsAgentPayoutVoucher | null>(null);

  if (!isOpen) return null;

  const agents = PmsStore.getCommissionAgents();
  const allCommissions = PmsStore.getAgentCommissionBookings();
  const payouts = PmsStore.getAgentPayoutVouchers();
  const top15Features = PmsStore.getTop15OfficialFeatures();
  const company = PmsStore.getCompanyInfo();

  // Filtered Commissions
  const filteredCommissions = allCommissions.filter(c => {
    const matchesAgent = selectedAgentFilter === 'ALL' || c.agentId === selectedAgentFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      c.agentName.toLowerCase().includes(term) ||
      c.guestName.toLowerCase().includes(term) ||
      c.roomNo.toLowerCase().includes(term) ||
      c.checkInNo.toLowerCase().includes(term) ||
      (c.bookingRefNo && c.bookingRefNo.toLowerCase().includes(term));
    return matchesAgent && matchesStatus && matchesSearch;
  });

  // Calculate Metrics
  const totalAgents = agents.length;
  const totalBookingsReferred = allCommissions.length;
  const totalRevenueReferred = allCommissions.reduce((sum, c) => sum + c.grossRoomTariff, 0);
  const totalCommissionEarned = allCommissions.reduce((sum, c) => sum + c.netPayableCommission, 0);
  const totalCommissionPaid = allCommissions
    .filter(c => c.status === 'PAID')
    .reduce((sum, c) => sum + c.netPayableCommission, 0);
  const totalBalancePayable = agents.reduce((sum, a) => sum + a.balancePayable, 0);

  // Handle Registering a New Agent
  const handleSaveNewAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentPhone.trim()) {
      alert('Please enter Agent Name and Contact Number');
      return;
    }
    const newId = `AGT-${100 + agents.length + 1}`;
    const agentObj: PmsCommissionAgent = {
      id: newId,
      name: newAgentName.trim(),
      phone: newAgentPhone.trim(),
      city: newAgentCity.trim() || 'Shirdi',
      agentType: newAgentType,
      commissionType: newCommType,
      defaultRate: Number(newCommRate) || 10,
      panNumber: newPanNo.trim() ? newPanNo.trim().toUpperCase() : undefined,
      bankDetails: newBankName.trim() ? {
        bankName: newBankName.trim(),
        accountNo: newAccountNo.trim(),
        ifsc: newIfsc.trim().toUpperCase(),
        accountHolder: newAgentName.trim(),
        upiId: newUpiId.trim() || undefined
      } : (newUpiId.trim() ? {
        bankName: 'UPI Digital',
        accountNo: 'NA',
        ifsc: 'NA',
        accountHolder: newAgentName.trim(),
        upiId: newUpiId.trim()
      } : undefined),
      status: 'ACTIVE',
      totalBookings: 0,
      totalRevenueGenerated: 0,
      totalCommissionEarned: 0,
      totalCommissionPaid: 0,
      balancePayable: 0,
      notes: newAgentNotes.trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0]
    };

    PmsStore.saveCommissionAgent(agentObj);
    setIsAddingAgent(false);
    // Reset form
    setNewAgentName('');
    setNewAgentPhone('');
    setNewPanNo('');
    setNewBankName('');
    setNewAccountNo('');
    setNewIfsc('');
    setNewUpiId('');
    setNewAgentNotes('');
    alert(`Agent ${agentObj.name} (${agentObj.id}) registered successfully!`);
  };

  // Open Payout Modal for an Agent
  const handleOpenPayout = (agentId: string) => {
    const ag = agents.find(a => a.id === agentId);
    if (!ag) return;
    setPayoutAgentId(agentId);
    const pendingComms = allCommissions.filter(c => c.agentId === agentId && c.status !== 'PAID' && c.status !== 'VOID');
    setSelectedCommissionIds(pendingComms.map(c => c.id));
    setPayoutRefNo(ag.bankDetails?.upiId ? `UPI/${Date.now().toString().slice(-6)}` : `CASH-${Date.now().toString().slice(-4)}`);
    setPayoutNotes(`Commission settlement for ${pendingComms.length} bookings`);
    setIsPayoutModalOpen(true);
  };

  // Execute Payout
  const handleExecutePayout = () => {
    const ag = agents.find(a => a.id === payoutAgentId);
    if (!ag) return;

    const commsToSettle = allCommissions.filter(c => selectedCommissionIds.includes(c.id));
    const grossAmount = commsToSettle.reduce((sum, c) => sum + c.grossCommission, 0);
    const tdsDeducted = commsToSettle.reduce((sum, c) => sum + c.tdsAmount, 0);
    const netPayoutAmount = commsToSettle.reduce((sum, c) => sum + c.netPayableCommission, 0);

    if (netPayoutAmount <= 0) {
      alert('Selected bookings have zero payable commission.');
      return;
    }

    const voucher = PmsStore.recordAgentCommissionPayout({
      agentId: ag.id,
      agentName: ag.name,
      amount: netPayoutAmount,
      grossAmount,
      tdsDeducted,
      paymentMode: payoutPaymentMode,
      referenceNo: payoutRefNo,
      commissionIds: selectedCommissionIds,
      notes: payoutNotes
    });

    setIsPayoutModalOpen(false);
    setPrintedVoucher(voucher);
  };

  // Format Indian Currency
  const formatINR = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const renderBadge = (type: PmsAgentType) => {
    switch (type) {
      case 'Travel_Agent':
        return <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>✈️ Travel Agent</span>;
      case 'MR_Corporate':
        return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>👔 MR Corporate</span>;
      case 'Tour_Operator':
        return <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>🚌 Tour Operator</span>;
      case 'Auto_Taxi_Driver':
        return <span style={{ background: '#ffedd5', color: '#9a3412', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>🛺 Auto / Taxi</span>;
      case 'OTA_Broker':
        return <span style={{ background: '#ccfbf1', color: '#115e59', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>🌐 OTA Broker</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>👤 Agent</span>;
    }
  };

  return (
    <div className="pms-overlay" onClick={onClose}>
      <div 
        className="pms-window" 
        onClick={e => e.stopPropagation()}
        style={{
          width: '96vw',
          maxWidth: 1240,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#f8fafc',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
        }}
      >
        {/* Top Header */}
        <header
          style={{
            background: '#1e293b',
            color: '#ffffff',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '3px solid #f59e0b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>🤝</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '0.5px' }}>
                  MR & SALESMAN COMMISSION TRACKING & TOP 15 PMS FEATURES
                </span>
                <span
                  style={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    color: '#38bdf8',
                    fontFamily: 'monospace'
                  }}
                >
                  pms.hotelsai-vasudev.com/agent_commission
                </span>
                <span
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 800
                  }}
                >
                  Video 31 &bull; 100% Exact Clone
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                Travel Agent & MR Commissions &bull; TDS Section 194H &bull; Auto Attribution on Check-In &bull; Top 15 PMS Core Pillars
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => window.print()}
              style={{
                background: '#334155',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              🖨️ Print Report
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 14
              }}
              title="Close"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Navigation Tabs Bar */}
        <div
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'ledger', label: '📊 Commission Ledger & Bookings', count: allCommissions.length },
              { id: 'agents', label: '👥 Agent & MR Directory', count: agents.length },
              { id: 'payouts', label: '💸 Payout Vouchers Register', count: payouts.length },
              { id: 'top15', label: '🏆 Top 15 PMS Features Hub', count: top15Features.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '3px solid #f59e0b' : '3px solid transparent',
                  padding: '12px 16px',
                  fontWeight: activeTab === tab.id ? 800 : 600,
                  color: activeTab === tab.id ? '#1e293b' : '#64748b',
                  cursor: 'pointer',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {tab.label}
                <span
                  style={{
                    background: activeTab === tab.id ? '#fef3c7' : '#f1f5f9',
                    color: activeTab === tab.id ? '#b45309' : '#64748b',
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 10,
                    fontWeight: 700
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {activeTab === 'agents' && (
            <button
              onClick={() => setIsAddingAgent(!isAddingAgent)}
              style={{
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              ➕ {isAddingAgent ? 'Cancel New Agent' : 'Register New Agent / MR'}
            </button>
          )}
        </div>

        {/* KPI Summary Bar (Video 31 Executive Dashboard) */}
        <div
          style={{
            background: '#ffffff',
            padding: '12px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 12
          }}
        >
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Active Agents & MRs</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>{totalAgents} Registered</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total Bookings Referred</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#2563eb', marginTop: 2 }}>{totalBookingsReferred} Rooms</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Referred Room Revenue</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#059669', marginTop: 2 }}>{formatINR(totalRevenueReferred)}</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total Comm. Earned</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#7c3aed', marginTop: 2 }}>{formatINR(totalCommissionEarned)}</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total Comm. Disbursed</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a', marginTop: 2 }}>{formatINR(totalCommissionPaid)}</div>
          </div>
          <div style={{ background: '#fef2f2', padding: '10px 14px', borderRadius: 6, border: '1px solid #fecaca' }}>
            <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 700 }}>Balance Outstanding</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#dc2626', marginTop: 2 }}>{formatINR(totalBalancePayable)}</div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* TAB 1: COMMISSION LEDGER & BOOKINGS */}
          {activeTab === 'ledger' && (
            <div>
              {/* Filter Toolbar */}
              <div
                style={{
                  background: '#ffffff',
                  padding: 14,
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
                  <input
                    type="text"
                    placeholder="Search by Agent, Guest, Room No, or Check-In No..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: 4,
                      fontSize: 13
                    }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      style={{ background: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Agent:</label>
                    <select
                      value={selectedAgentFilter}
                      onChange={e => setSelectedAgentFilter(e.target.value)}
                      style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                    >
                      <option value="ALL">All Agents & MRs</option>
                      {agents.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.city})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</label>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="PAID">PAID</option>
                      <option value="VOID">VOID</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      const csvHeader = 'CheckInNo,AgentName,RoomNo,GuestName,Nights,RoomTariff,GrossRevenue,CommRate,GrossComm,TDS,NetPayable,Status\n';
                      const csvRows = filteredCommissions.map(c => 
                        `"${c.checkInNo}","${c.agentName}","${c.roomNo}","${c.guestName}",${c.numberOfNights},${c.roomTariff},${c.grossRoomTariff},"${c.commissionRate}${c.commissionType === 'PERCENTAGE' ? '%' : ' INR'}",${c.grossCommission},${c.tdsAmount},${c.netPayableCommission},"${c.status}"`
                      ).join('\n');
                      const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Agent_Commissions_${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                    }}
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 12px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    📥 Export CSV
                  </button>
                </div>
              </div>

              {/* Commission Data Table */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#1e293b', color: '#ffffff', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>S.No</th>
                      <th style={{ padding: '10px 12px' }}>Check-In No / Date</th>
                      <th style={{ padding: '10px 12px' }}>Room</th>
                      <th style={{ padding: '10px 12px' }}>Guest Details</th>
                      <th style={{ padding: '10px 12px' }}>Agent / MR Name</th>
                      <th style={{ padding: '10px 12px' }}>Nights & Tariff</th>
                      <th style={{ padding: '10px 12px' }}>Gross Revenue</th>
                      <th style={{ padding: '10px 12px' }}>Commission Rate</th>
                      <th style={{ padding: '10px 12px' }}>Gross Comm</th>
                      <th style={{ padding: '10px 12px' }}>TDS (5%)</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800 }}>Net Payable</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCommissions.length === 0 ? (
                      <tr>
                        <td colSpan={13} style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8' }}>
                          No agent commission records found matching the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredCommissions.map((comm, idx) => (
                        <tr
                          key={comm.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                          }}
                        >
                          <td style={{ padding: '10px 12px', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{comm.checkInNo}</div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>{comm.checkInDate} to {comm.checkOutDate}</div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ background: '#e2e8f0', color: '#1e293b', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>
                              {comm.roomNo}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{comm.guestName}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>📞 {comm.guestMobile}</div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{comm.agentName}</div>
                            <div style={{ marginTop: 2 }}>{renderBadge(comm.agentType)}</div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div>{comm.numberOfNights} Night(s)</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>@ {formatINR(comm.roomTariff)}/night</div>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                            {formatINR(comm.grossRoomTariff)}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>
                              {comm.commissionRate}{comm.commissionType === 'PERCENTAGE' ? '%' : ' ₹/rm'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#475569' }}>
                            {formatINR(comm.grossCommission)}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#dc2626' }}>
                            {comm.tdsAmount > 0 ? `-${formatINR(comm.tdsAmount)}` : '₹0'}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 900, color: '#059669', fontSize: 13 }}>
                            {formatINR(comm.netPayableCommission)}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {comm.status === 'PAID' ? (
                              <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4, fontWeight: 800, fontSize: 11 }}>
                                ✓ PAID ({comm.payoutVoucherNo})
                              </span>
                            ) : comm.status === 'APPROVED' ? (
                              <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 4, fontWeight: 800, fontSize: 11 }}>
                                ● APPROVED
                              </span>
                            ) : comm.status === 'VOID' ? (
                              <span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 4, fontWeight: 800, fontSize: 11 }}>
                                ✕ VOID
                              </span>
                            ) : (
                              <span style={{ background: '#fef9c3', color: '#a16207', padding: '2px 8px', borderRadius: 4, fontWeight: 800, fontSize: 11 }}>
                                ⏳ PENDING
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            {comm.status === 'PENDING' && (
                              <button
                                onClick={() => {
                                  PmsStore.updateAgentCommissionStatus(comm.id, 'APPROVED');
                                  alert(`Booking ${comm.checkInNo} commission approved!`);
                                }}
                                style={{
                                  background: '#2563eb',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  fontWeight: 700
                                }}
                              >
                                Approve
                              </button>
                            )}
                            {comm.status === 'APPROVED' && (
                              <button
                                onClick={() => handleOpenPayout(comm.agentId)}
                                style={{
                                  background: '#059669',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  fontWeight: 700
                                }}
                              >
                                Pay Now
                              </button>
                            )}
                            {comm.status === 'PAID' && (
                              <button
                                onClick={() => {
                                  const v = payouts.find(p => p.voucherNo === comm.payoutVoucherNo);
                                  if (v) setPrintedVoucher(v);
                                }}
                                style={{
                                  background: '#475569',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  fontWeight: 600
                                }}
                              >
                                View Voucher
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: AGENT & MR DIRECTORY */}
          {activeTab === 'agents' && (
            <div>
              {/* Optional New Agent Form */}
              {isAddingAgent && (
                <div
                  style={{
                    background: '#ffffff',
                    padding: 20,
                    borderRadius: 8,
                    border: '2px solid #059669',
                    marginBottom: 20,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>
                      Register New Travel Agent / MR / Tour Operator
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Video 31 Agent Registration Module</span>
                  </div>

                  <form onSubmit={handleSaveNewAgent}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                          Agent / Representative Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Balaji Tours & Travels / Vikram Roy"
                          value={newAgentName}
                          onChange={e => setNewAgentName(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                          Contact Phone / WhatsApp *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="98XXXXXXXX"
                          value={newAgentPhone}
                          onChange={e => setNewAgentPhone(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                          City / Operating Hub
                        </label>
                        <input
                          type="text"
                          placeholder="Shirdi, Nashik, Pune, Mumbai"
                          value={newAgentCity}
                          onChange={e => setNewAgentCity(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                          Agent Type / Profession
                        </label>
                        <select
                          value={newAgentType}
                          onChange={e => setNewAgentType(e.target.value as any)}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                        >
                          <option value="Travel_Agent">Travel Agent</option>
                          <option value="MR_Corporate">MR (Medical Rep / Corporate)</option>
                          <option value="Tour_Operator">Tour Operator (Bus / Group)</option>
                          <option value="Auto_Taxi_Driver">Auto / Taxi Driver</option>
                          <option value="OTA_Broker">OTA Channel Broker</option>
                          <option value="Local_Guide">Local Guide</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                          Commission Calculation Type
                        </label>
                        <select
                          value={newCommType}
                          onChange={e => setNewCommType(e.target.value as any)}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                        >
                          <option value="PERCENTAGE">Percentage of Room Tariff (%)</option>
                          <option value="FIXED_PER_ROOM">Fixed Amount per Room (₹)</option>
                          <option value="FIXED_PER_NIGHT">Fixed Amount per Room-Night (₹)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                          Default Commission Rate
                        </label>
                        <input
                          type="number"
                          value={newCommRate}
                          onChange={e => setNewCommRate(Number(e.target.value))}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                          PAN Card No (Section 194H TDS)
                        </label>
                        <input
                          type="text"
                          placeholder="ABCDE1234F"
                          value={newPanNo}
                          onChange={e => setNewPanNo(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                          UPI ID for Instant Payout
                        </label>
                        <input
                          type="text"
                          placeholder="agent@okhdfcbank"
                          value={newUpiId}
                          onChange={e => setNewUpiId(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                          Bank Name & Account No
                        </label>
                        <input
                          type="text"
                          placeholder="SBI / HDFC - A/c 5020..."
                          value={newBankName}
                          onChange={e => setNewBankName(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                        Special Notes / Agency Contract Details
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Brings groups on weekends from Pune, prefers UPI payouts on Mondays."
                        value={newAgentNotes}
                        onChange={e => setNewAgentNotes(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13 }}
                      />
                    </div>

                    <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setIsAddingAgent(false)}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 800 }}
                      >
                        Save & Register Agent
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Agents Directory Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
                {agents.map(ag => (
                  <div
                    key={ag.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: 16,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                          {ag.id}
                        </span>
                        {renderBadge(ag.agentType)}
                      </div>

                      <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>
                        {ag.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        📍 {ag.city} &bull; 📞 {ag.phone}
                      </div>

                      <div
                        style={{
                          background: '#f8fafc',
                          padding: 10,
                          borderRadius: 6,
                          margin: '12px 0',
                          border: '1px solid #e2e8f0',
                          fontSize: 12
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ color: '#64748b' }}>Rate Structure:</span>
                          <span style={{ fontWeight: 800, color: '#b45309' }}>
                            {ag.defaultRate}{ag.commissionType === 'PERCENTAGE' ? '%' : ' ₹/rm'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ color: '#64748b' }}>Referred Bookings:</span>
                          <span style={{ fontWeight: 700 }}>{ag.totalBookings} Rooms</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ color: '#64748b' }}>Revenue Generated:</span>
                          <span style={{ fontWeight: 700, color: '#059669' }}>{formatINR(ag.totalRevenueGenerated)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ color: '#64748b' }}>Commission Earned:</span>
                          <span style={{ fontWeight: 700, color: '#7c3aed' }}>{formatINR(ag.totalCommissionEarned)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Commission Disbursed:</span>
                          <span style={{ fontWeight: 700, color: '#16a34a' }}>{formatINR(ag.totalCommissionPaid)}</span>
                        </div>
                      </div>

                      {ag.bankDetails?.upiId && (
                        <div style={{ fontSize: 11, color: '#0284c7', background: '#f0f9ff', padding: '6px 10px', borderRadius: 4, marginBottom: 12 }}>
                          📱 UPI: <strong>{ag.bankDetails.upiId}</strong>
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>Balance Payable:</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: ag.balancePayable > 0 ? '#dc2626' : '#15803d' }}>
                          {formatINR(ag.balancePayable)}
                        </div>
                      </div>

                      {ag.balancePayable > 0 ? (
                        <button
                          onClick={() => handleOpenPayout(ag.id)}
                          style={{
                            background: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 700
                          }}
                        >
                          Disburse Payout
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: '#15803d', fontWeight: 700 }}>
                          ✓ All Settled
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PAYOUT VOUCHERS REGISTER */}
          {activeTab === 'payouts' && (
            <div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#1e293b', color: '#ffffff', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>Voucher No</th>
                      <th style={{ padding: '10px 12px' }}>Date</th>
                      <th style={{ padding: '10px 12px' }}>Agent Name</th>
                      <th style={{ padding: '10px 12px' }}>Payment Mode</th>
                      <th style={{ padding: '10px 12px' }}>Reference / UTR No</th>
                      <th style={{ padding: '10px 12px' }}>Settled Bookings</th>
                      <th style={{ padding: '10px 12px' }}>Gross Comm</th>
                      <th style={{ padding: '10px 12px' }}>TDS Deducted</th>
                      <th style={{ padding: '10px 12px', fontWeight: 800 }}>Net Disbursed</th>
                      <th style={{ padding: '10px 12px' }}>Authorized By</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Voucher</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8' }}>
                          No commission payout vouchers generated yet.
                        </td>
                      </tr>
                    ) : (
                      payouts.map((v, idx) => (
                        <tr
                          key={v.voucherNo}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                          }}
                        >
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0f172a' }}>{v.voucherNo}</td>
                          <td style={{ padding: '10px 12px', color: '#475569' }}>{v.voucherDate}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>{v.agentName}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                              {v.paymentMode}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#64748b' }}>{v.referenceNo}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ background: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                              {v.settledCommissionIds.length} Booking(s)
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{formatINR(v.grossAmount)}</td>
                          <td style={{ padding: '10px 12px', color: '#dc2626' }}>
                            {v.tdsDeducted > 0 ? `-${formatINR(v.tdsDeducted)}` : '₹0'}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 900, color: '#15803d', fontSize: 13 }}>
                            {formatINR(v.amount)}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748b' }}>{v.createdBy}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button
                              onClick={() => setPrintedVoucher(v)}
                              style={{
                                background: '#1e293b',
                                color: '#ffffff',
                                border: 'none',
                                padding: '4px 10px',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 11,
                                fontWeight: 700
                              }}
                            >
                              🖨️ Print Slip
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

          {/* TAB 4: TOP 15 PMS FEATURES DIRECT HUB (VIDEO 31 WORD DOC PRESENTATION) */}
          {activeTab === 'top15' && (
            <div>
              {/* Official Banner Matching Video 31 Frame 0100/0120 */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  color: '#ffffff',
                  padding: '18px 24px',
                  borderRadius: 8,
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderLeft: '5px solid #f59e0b'
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.5px' }}>
                    Top 15 PMS (Property Management System) Features
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    Canonical Enterprise Feature Set Presented in RoomG Training Video 31 &bull; Complete PMS Solution for Hotels & Resorts
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#cbd5e1' }}>Official Inquiry & License Helpline:</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#f59e0b', fontFamily: 'monospace' }}>
                    📞 7999663696 / 8871702803
                  </div>
                </div>
              </div>

              {/* Grid of 15 Features */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
                {top15Features.map(feat => (
                  <div
                    key={feat.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: 16,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              background: '#fef3c7',
                              color: '#b45309',
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: 12
                            }}
                          >
                            {feat.id}
                          </span>
                          <span style={{ fontSize: 20 }}>{feat.icon}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{ background: '#f1f5f9', color: '#475569', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                            {feat.category}
                          </span>
                          <span style={{ background: '#0f172a', color: '#38bdf8', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
                            {feat.videoTimestamp}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
                        {feat.id}. {feat.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 2 }}>
                        {feat.hindiTitle}
                      </div>

                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '8px 10px',
                          borderRadius: 4,
                          margin: '10px 0',
                          borderLeft: '3px solid #0284c7',
                          fontSize: 11,
                          color: '#334155',
                          lineHeight: 1.4
                        }}
                      >
                        <strong>Exact Video Word Doc:</strong> {feat.bulletSummary}
                      </div>

                      <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.5, margin: '6px 0 12px 0' }}>
                        {feat.fullDetail}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                        {feat.route}
                      </span>
                      {onLaunchFeature && (
                        <button
                          onClick={() => {
                            onClose();
                            onLaunchFeature(feat.targetModal);
                          }}
                          style={{
                            background: '#1e293b',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          Launch Feature 🚀
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Payout Modal Drawer */}
        {isPayoutModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: 8,
                width: 580,
                maxWidth: '90vw',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ background: '#059669', color: '#ffffff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 16 }}>Disburse Agent Commission Payout</span>
                <button
                  onClick={() => setIsPayoutModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: 18, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: 20 }}>
                {(() => {
                  const ag = agents.find(a => a.id === payoutAgentId);
                  const eligibleComms = allCommissions.filter(c => c.agentId === payoutAgentId && c.status !== 'PAID' && c.status !== 'VOID');
                  const selectedComms = eligibleComms.filter(c => selectedCommissionIds.includes(c.id));
                  const grossComm = selectedComms.reduce((s, c) => s + c.grossCommission, 0);
                  const tdsComm = selectedComms.reduce((s, c) => s + c.tdsAmount, 0);
                  const netComm = selectedComms.reduce((s, c) => s + c.netPayableCommission, 0);

                  return (
                    <div>
                      <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 16, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{ag?.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          ID: {ag?.id} &bull; 📞 {ag?.phone} &bull; {ag?.city}
                        </div>
                        {ag?.panNumber && (
                          <div style={{ fontSize: 11, color: '#0284c7', marginTop: 4 }}>
                            PAN: <strong>{ag.panNumber}</strong> (Section 194H 5% TDS applied)
                          </div>
                        )}
                        {ag?.bankDetails?.upiId && (
                          <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
                            UPI ID: <strong>{ag.bankDetails.upiId}</strong>
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                          Select Bookings to Settle ({selectedCommissionIds.length} of {eligibleComms.length} selected):
                        </label>
                        <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: 4, padding: 8 }}>
                          {eligibleComms.map(c => (
                            <label
                              key={c.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 8px',
                                borderBottom: '1px solid #f1f5f9',
                                fontSize: 11,
                                cursor: 'pointer'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedCommissionIds.includes(c.id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedCommissionIds([...selectedCommissionIds, c.id]);
                                  } else {
                                    setSelectedCommissionIds(selectedCommissionIds.filter(id => id !== c.id));
                                  }
                                }}
                              />
                              <span style={{ fontWeight: 700 }}>{c.checkInNo} (Rm {c.roomNo})</span>
                              <span style={{ color: '#64748b' }}>- {c.guestName}</span>
                              <span style={{ marginLeft: 'auto', fontWeight: 800, color: '#059669' }}>
                                {formatINR(c.netPayableCommission)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Payment Calculations */}
                      <div style={{ background: '#fef3c7', padding: 12, borderRadius: 6, marginBottom: 14, fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span>Gross Commission:</span>
                          <span style={{ fontWeight: 700 }}>{formatINR(grossComm)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#dc2626' }}>
                          <span>TDS Deducted (Sec 194H):</span>
                          <span style={{ fontWeight: 700 }}>-{formatINR(tdsComm)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #fde68a', paddingTop: 6, fontWeight: 900, fontSize: 14, color: '#15803d' }}>
                          <span>Net Payout Amount:</span>
                          <span>{formatINR(netComm)}</span>
                        </div>
                      </div>

                      {/* Payment Mode & Reference */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12, marginBottom: 14 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                            Payment Mode
                          </label>
                          <select
                            value={payoutPaymentMode}
                            onChange={e => setPayoutPaymentMode(e.target.value as any)}
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                          >
                            <option value="UPI">UPI Transfer</option>
                            <option value="CASH">Cash Counter</option>
                            <option value="BANK_TRANSFER">Bank NEFT / RTGS</option>
                            <option value="CHEQUE">Cheque</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                            UTR / Cheque / Transaction Ref No
                          </label>
                          <input
                            type="text"
                            value={payoutRefNo}
                            onChange={e => setPayoutRefNo(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                          Payout Narration
                        </label>
                        <input
                          type="text"
                          value={payoutNotes}
                          onChange={e => setPayoutNotes(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12 }}
                        />
                      </div>

                      <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setIsPayoutModalOpen(false)}
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleExecutePayout}
                          disabled={selectedCommissionIds.length === 0}
                          style={{
                            background: selectedCommissionIds.length === 0 ? '#94a3b8' : '#059669',
                            color: '#ffffff',
                            border: 'none',
                            padding: '8px 22px',
                            borderRadius: 4,
                            cursor: selectedCommissionIds.length === 0 ? 'not-allowed' : 'pointer',
                            fontSize: 13,
                            fontWeight: 800
                          }}
                        >
                          Confirm & Print Voucher ({formatINR(netComm)})
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Printable Payment Voucher Slip */}
        {printedVoucher && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001
            }}
          >
            <div
              style={{
                background: '#ffffff',
                width: 620,
                maxWidth: '92vw',
                borderRadius: 8,
                padding: 24,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                fontFamily: 'Arial, sans-serif'
              }}
            >
              {/* Hotel Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #1e293b', paddingBottom: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', letterSpacing: '0.5px' }}>
                  {company.firmName}
                </div>
                <div style={{ fontSize: 11, color: '#475569' }}>
                  {company.address1}, {company.address2}, {company.city} - {company.pincode}
                </div>
                <div style={{ fontSize: 11, color: '#475569' }}>
                  📞 {company.phone} | ✉️ {company.email} | GSTIN: <strong>{company.gstNo}</strong>
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    background: '#1e293b',
                    color: '#ffffff',
                    padding: '4px 14px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 800,
                    marginTop: 8,
                    letterSpacing: '1px'
                  }}
                >
                  MR & AGENT COMMISSION PAYOUT VOUCHER
                </div>
              </div>

              {/* Voucher Meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 12 }}>
                <div>
                  <div>Voucher No: <strong style={{ color: '#0284c7' }}>{printedVoucher.voucherNo}</strong></div>
                  <div>Agent Name: <strong>{printedVoucher.agentName}</strong></div>
                  <div>Agent ID: <strong>{printedVoucher.agentId}</strong></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Date: <strong>{printedVoucher.voucherDate}</strong></div>
                  <div>Payment Mode: <strong>{printedVoucher.paymentMode}</strong></div>
                  <div>Ref / UTR: <strong style={{ fontFamily: 'monospace' }}>{printedVoucher.referenceNo}</strong></div>
                </div>
              </div>

              {/* Settlement Table */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: 12, marginBottom: 14, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Gross Commission Amount:</span>
                  <span style={{ fontWeight: 700 }}>{formatINR(printedVoucher.grossAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#dc2626' }}>
                  <span>TDS Deducted (Income Tax Sec 194H):</span>
                  <span style={{ fontWeight: 700 }}>-{formatINR(printedVoucher.tdsDeducted)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed #cbd5e1', paddingTop: 6, fontWeight: 900, fontSize: 15, color: '#15803d' }}>
                  <span>Net Disbursed Amount:</span>
                  <span>{formatINR(printedVoucher.amount)}</span>
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 6 }}>
                  Covering {printedVoucher.settledCommissionIds.length} room booking(s): {printedVoucher.settledCommissionIds.join(', ')}
                </div>
              </div>

              {/* Notes */}
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 20 }}>
                <strong>Narration:</strong> {printedVoucher.notes}
              </div>

              {/* Signature Blocks */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 10, borderTop: '1px solid #cbd5e1', fontSize: 11 }}>
                <div style={{ textAlign: 'center', width: 180 }}>
                  <div style={{ marginBottom: 4, height: 20 }}></div>
                  <div style={{ borderTop: '1px dashed #64748b', paddingTop: 4 }}>Agent / Representative Sign</div>
                </div>
                <div style={{ textAlign: 'center', width: 180 }}>
                  <div style={{ marginBottom: 4, fontWeight: 700 }}>{printedVoucher.createdBy}</div>
                  <div style={{ borderTop: '1px dashed #64748b', paddingTop: 4 }}>Cashier / Accounts Sign</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button
                  onClick={() => setPrintedVoucher(null)}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                >
                  🖨️ Print Voucher
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
