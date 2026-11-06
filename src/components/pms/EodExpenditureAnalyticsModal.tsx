import React, { useState, useEffect, useMemo } from 'react';
import type {
  EodExpenseRecord,
  RoomCategoryRevenueReport,
  PaymentModeRevenueReport,
  EodExecutiveSummary
} from '../../types/pmsModels';
import { PmsStore, usePmsSync } from '../../services/pmsStore';
import { hotelApi } from '../../services/api';
import './pmsStyles.css';

interface EodExpenditureAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EodExpenditureAnalyticsModal: React.FC<EodExpenditureAnalyticsModalProps> = ({
  isOpen,
  onClose
}) => {
  usePmsSync();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'expenses' | 'roomCategories' | 'paymentModes' | 'closingSummary'>('expenses');

  // Filters
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(currentMonthStr);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterSubcategory, setFilterSubcategory] = useState<string>('All');
  const [filterPaymentMode, setFilterPaymentMode] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Data States
  const [expensesList, setExpensesList] = useState<EodExpenseRecord[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string[]>>({});
  const [roomCatReport, setRoomCatReport] = useState<RoomCategoryRevenueReport | null>(null);
  const [paymentModeReport, setPaymentModeReport] = useState<PaymentModeRevenueReport | null>(null);
  const [eodSummary, setEodSummary] = useState<EodExecutiveSummary | null>(null);

  // New Expense Dialog State
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState<boolean>(false);
  const [expenseForm, setExpenseForm] = useState<{
    expense_date: string;
    expense_time: string;
    category: string;
    subcategory: string;
    amount: number;
    payment_mode: string;
    account_name: string;
    paid_to: string;
    receipt_ref: string;
    approved_by: string;
    notes: string;
  }>({
    expense_date: todayStr,
    expense_time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    category: 'Housekeeping',
    subcategory: 'Housekeeping Supplies',
    amount: 1200,
    payment_mode: 'Cash',
    account_name: 'Petty Cash Drawer',
    paid_to: '',
    receipt_ref: '',
    approved_by: 'General Manager',
    notes: ''
  });

  const companyInfo = PmsStore.getCompanyInfo();

  // Load Categories & Analytics Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Categories
      try {
        const catRes = await hotelApi.getEodCategories();
        if (catRes?.categories) {
          setCategoriesMap(catRes.categories);
        }
      } catch {
        // Fallback default
        setCategoriesMap({
          'Housekeeping': ['Housekeeping Supplies', 'Linen Washing / Laundry', 'Room Amenities & Toiletries', 'Disinfectants & Cleaning Chemicals'],
          'Kitchen & Vasudev Rasoi': ['Vegetables & Groceries', 'Dairy & Bakery Items', 'Spices & Dry Provisions', 'Cooking Gas Cylinders (LPG)', 'Food Packaging & Disposables'],
          'Maintenance & Engineering': ['Plumbing & Sanitary Repairs', 'Electrical & Lighting', 'AC Servicing & Gas Refill', 'DG Generator Diesel', 'Carpentry & Touch-up Paint'],
          'Utilities': ['Electricity Bill', 'Water Supply / Tankers', 'High-Speed Internet / Wi-Fi', 'Telephone & Cable TV DTH'],
          'Staff Allowance & Welfare': ['Staff Tea & Refreshments', 'Overtime & Night Meal Allowance', 'Uniform Maintenance & Stitching', 'Emergency First Aid & Welfare'],
          'Administrative & Front Office': ['Printing & Guest Registration Slips', 'Key Cards & RFID Envelopes', 'Software & Cloud Subscriptions', 'Courier & Speed Post'],
          'Miscellaneous': ['Local Travel & Auto Hire', 'Pest Control Treatment', 'Municipal Waste Disposal Fee', 'General Petty Cash Sundries']
        });
      }

      // 2. Expenses List
      try {
        const expRes = await hotelApi.getEodExpenses({
          date: viewMode === 'daily' ? selectedDate : undefined,
          period: viewMode === 'monthly' ? selectedPeriod : undefined
        });
        if (expRes?.expenses) {
          setExpensesList(expRes.expenses);
        } else {
          setExpensesList(PmsStore.getEodExpenses(viewMode === 'daily' ? selectedDate : undefined, viewMode === 'monthly' ? selectedPeriod : undefined));
        }
      } catch {
        setExpensesList(PmsStore.getEodExpenses(viewMode === 'daily' ? selectedDate : undefined, viewMode === 'monthly' ? selectedPeriod : undefined));
      }

      // 3. Room Category Revenue Analytics
      try {
        const rRes = await hotelApi.getRoomCategoryRevenue({
          date: viewMode === 'daily' ? selectedDate : undefined,
          period: viewMode === 'monthly' ? selectedPeriod : undefined
        });
        if (rRes?.categories) {
          setRoomCatReport(rRes);
        } else {
          setRoomCatReport(PmsStore.getRoomCategoryRevenueAnalytics(viewMode === 'daily' ? selectedDate : undefined, viewMode === 'monthly' ? selectedPeriod : undefined));
        }
      } catch {
        setRoomCatReport(PmsStore.getRoomCategoryRevenueAnalytics(viewMode === 'daily' ? selectedDate : undefined, viewMode === 'monthly' ? selectedPeriod : undefined));
      }

      // 4. Payment Mode Revenue Analytics
      try {
        const pRes = await hotelApi.getPaymentModeRevenue({
          date: viewMode === 'daily' ? selectedDate : undefined,
          period: viewMode === 'monthly' ? selectedPeriod : undefined
        });
        if (pRes?.modes) {
          setPaymentModeReport(pRes);
        } else {
          setPaymentModeReport(PmsStore.getPaymentModeRevenueAnalytics(viewMode === 'daily' ? selectedDate : undefined, viewMode === 'monthly' ? selectedPeriod : undefined));
        }
      } catch {
        setPaymentModeReport(PmsStore.getPaymentModeRevenueAnalytics(viewMode === 'daily' ? selectedDate : undefined, viewMode === 'monthly' ? selectedPeriod : undefined));
      }

      // 5. EOD Summary
      try {
        const sRes = await hotelApi.getEodExecutiveSummary(selectedDate);
        if (sRes?.revenue) {
          setEodSummary(sRes);
        } else {
          setEodSummary(PmsStore.getEodExecutiveSummary(selectedDate));
        }
      } catch {
        setEodSummary(PmsStore.getEodExecutiveSummary(selectedDate));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, selectedDate, selectedPeriod, viewMode]);

  // Dynamic subcategories for form based on selected category
  const availableSubcategoriesForForm = useMemo(() => {
    return categoriesMap[expenseForm.category] || ['General Supplies', 'Miscellaneous'];
  }, [categoriesMap, expenseForm.category]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expensesList.filter(e => {
      if (filterCategory !== 'All' && e.category !== filterCategory) return false;
      if (filterSubcategory !== 'All' && e.subcategory !== filterSubcategory) return false;
      if (filterPaymentMode !== 'All' && e.payment_mode !== filterPaymentMode) return false;
      return true;
    });
  }, [expensesList, filterCategory, filterSubcategory, filterPaymentMode]);

  // Aggregate subcategory progress data
  const subcategoryAggregates = useMemo(() => {
    const agg: Record<string, { category: string; amount: number }> = {};
    let total = 0;
    expensesList.forEach(e => {
      const amt = Number(e.amount) || 0;
      total += amt;
      if (!agg[e.subcategory]) {
        agg[e.subcategory] = { category: e.category, amount: 0 };
      }
      agg[e.subcategory].amount += amt;
    });

    return Object.entries(agg)
      .map(([subcat, data]) => ({
        subcategory: subcat,
        category: data.category,
        amount: data.amount,
        percentage: total > 0 ? (data.amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expensesList]);

  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const cashExpenseTotal = useMemo(() => {
    return filteredExpenses.filter(e => e.payment_mode === 'Cash').reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const digitalExpenseTotal = useMemo(() => {
    return filteredExpenses.filter(e => e.payment_mode !== 'Cash').reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  // Handle Form Change
  const handleCategoryChange = (cat: string) => {
    const subcats = categoriesMap[cat] || ['Miscellaneous'];
    setExpenseForm(prev => ({
      ...prev,
      category: cat,
      subcategory: subcats[0] || 'Miscellaneous'
    }));
  };

  const handlePaymentModeChange = (mode: string) => {
    let acc = 'Petty Cash Drawer';
    if (mode === 'UPI') acc = 'Vasudev UPI QR (SBI Merchant)';
    else if (mode === 'Credit Card') acc = 'HDFC POS Terminal #1';
    else if (mode === 'Debit Card') acc = 'HDFC POS Terminal #2';
    else if (mode === 'Bank Transfer - SBI') acc = 'State Bank of India (Current A/c 30987654321)';
    else if (mode === 'Bank Transfer - HDFC') acc = 'HDFC Bank (Current A/c 50200012345678)';

    setExpenseForm(prev => ({
      ...prev,
      payment_mode: mode,
      account_name: acc
    }));
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseForm.amount <= 0) {
      alert('Please enter a valid expense amount greater than 0.');
      return;
    }
    if (!expenseForm.paid_to.trim()) {
      alert('Please enter the recipient or vendor name.');
      return;
    }

    try {
      await hotelApi.createEodExpense(expenseForm).catch(() => {});
      PmsStore.saveEodExpense(expenseForm);
      setIsNewExpenseOpen(false);
      // Reset form
      setExpenseForm({
        expense_date: todayStr,
        expense_time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        category: 'Housekeeping',
        subcategory: 'Housekeeping Supplies',
        amount: 1000,
        payment_mode: 'Cash',
        account_name: 'Petty Cash Drawer',
        paid_to: '',
        receipt_ref: '',
        approved_by: 'General Manager',
        notes: ''
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save expense');
    }
  };

  const handleDeleteExpense = async (id: number | string, voucher: string) => {
    if (!confirm(`Are you sure you want to void expense voucher ${voucher}?`)) return;
    try {
      await hotelApi.deleteEodExpense(id).catch(() => {});
      PmsStore.deleteEodExpense(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pms-reg-modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="pms-reg-modal-window"
        style={{
          width: '96vw',
          maxWidth: '1300px',
          height: '92vh',
          maxHeight: '900px',
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
        {/* Top Header Bar */}
        <header
          style={{
            background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
            borderBottom: '2px solid #3b82f6',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>📊</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 0.5, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                END-OF-DAY (EOD) EXPENDITURES &amp; REVENUE ANALYTICS
                <span style={{ background: '#2563eb', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>
                  MODULE 2
                </span>
                {isLoading && (
                  <span style={{ background: '#334155', color: '#38bdf8', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                    🔄 Syncing...
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                {companyInfo.firmName || 'SRI SAI VASUDEV RESIDENCY'} &bull; Rayagada, Odisha 765001 &bull; GSTIN: {companyInfo.gstNo || '21AEKPP8689J1ZS'} &bull; Daily &amp; Monthly Revenue Segmentations
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* View Mode Toggle: Daily vs Monthly */}
            <div style={{ display: 'flex', background: '#1e293b', padding: 2, borderRadius: 6, border: '1px solid #334155' }}>
              <button
                type="button"
                onClick={() => setViewMode('daily')}
                style={{
                  background: viewMode === 'daily' ? '#2563eb' : 'transparent',
                  color: viewMode === 'daily' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                📅 Daily
              </button>
              <button
                type="button"
                onClick={() => setViewMode('monthly')}
                style={{
                  background: viewMode === 'monthly' ? '#2563eb' : 'transparent',
                  color: viewMode === 'monthly' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                📆 Monthly
              </button>
            </div>

            {/* Date/Month Input */}
            {viewMode === 'daily' ? (
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{
                  background: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 12,
                  fontWeight: 700
                }}
              />
            ) : (
              <input
                type="month"
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                style={{
                  background: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 12,
                  fontWeight: 700
                }}
              />
            )}

            {/* Tab Selectors */}
            <div style={{ display: 'flex', background: '#1e293b', padding: 3, borderRadius: 6, border: '1px solid #334155' }}>
              <button
                type="button"
                onClick={() => setActiveTab('expenses')}
                style={{
                  background: activeTab === 'expenses' ? '#3b82f6' : 'transparent',
                  color: activeTab === 'expenses' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>💸</span>
                <span>EOD Expenditures</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('roomCategories')}
                style={{
                  background: activeTab === 'roomCategories' ? '#10b981' : 'transparent',
                  color: activeTab === 'roomCategories' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>🛏️</span>
                <span>Room Categories</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paymentModes')}
                style={{
                  background: activeTab === 'paymentModes' ? '#8b5cf6' : 'transparent',
                  color: activeTab === 'paymentModes' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>💳</span>
                <span>Payment Modes &amp; Banks</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('closingSummary')}
                style={{
                  background: activeTab === 'closingSummary' ? '#f59e0b' : 'transparent',
                  color: activeTab === 'closingSummary' ? '#0f172a' : '#94a3b8',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>🌅</span>
                <span>EOD Day-End Closing</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#334155',
                border: 'none',
                color: '#fff',
                width: 28,
                height: 28,
                borderRadius: '50%',
                cursor: 'pointer',
                fontWeight: 800
              }}
              title="Close"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: '#0b1120' }}>
          {/* TAB 1: EOD EXPENDITURES & SUBCATEGORY TRACKER */}
          {activeTab === 'expenses' && (
            <div>
              {/* KPI Cards Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Total Spent ({viewMode === 'daily' ? selectedDate : selectedPeriod})
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#f87171', marginTop: 4 }}>
                    ₹{totalExpenseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 2 }}>
                    Across {filteredExpenses.length} expense vouchers
                  </div>
                </div>

                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    💵 Cash Outflow (Drawer)
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24', marginTop: 4 }}>
                    ₹{cashExpenseTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 2 }}>
                    Paid in physical cash from front desk
                  </div>
                </div>

                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    📱 Digital Outflow (UPI / Cards / Bank)
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>
                    ₹{digitalExpenseTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 2 }}>
                    Bank Transfers &amp; UPI merchant debits
                  </div>
                </div>

                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    🏆 Top Expense Subcategory
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#4ade80', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {subcategoryAggregates[0]?.subcategory || 'None'}
                  </div>
                  <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 2 }}>
                    ₹{subcategoryAggregates[0]?.amount.toLocaleString('en-IN') || 0} ({subcategoryAggregates[0]?.percentage.toFixed(1) || 0}%)
                  </div>
                </div>
              </div>

              {/* Subcategories Allocation Visualizer */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '14px 18px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📊</span>
                    <span>Expenditure Allocation by Exact Subcategory</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    Showing top spending destinations
                  </span>
                </div>

                {subcategoryAggregates.length === 0 ? (
                  <div style={{ padding: '12px 0', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                    No expenses logged for this period. Click "+ Add Daily Expense" to record expenditures.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {subcategoryAggregates.map((sub, idx) => (
                      <div key={idx} style={{ background: '#0f172a', padding: '8px 12px', borderRadius: 4, border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                          <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{sub.subcategory}</span>
                          <span style={{ fontWeight: 800, color: '#f87171' }}>₹{sub.amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                          <span>{sub.category}</span>
                          <span>{sub.percentage.toFixed(1)}%</span>
                        </div>
                        <div style={{ width: '100%', height: 4, background: '#334155', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, sub.percentage)}%`,
                              height: '100%',
                              background: idx % 3 === 0 ? '#3b82f6' : idx % 3 === 1 ? '#10b981' : '#f59e0b',
                              borderRadius: 2
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action and Filter Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {/* Category Filter */}
                  <select
                    value={filterCategory}
                    onChange={e => {
                      setFilterCategory(e.target.value);
                      setFilterSubcategory('All');
                    }}
                    style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #475569', borderRadius: 4, padding: '6px 10px', fontSize: 12, fontWeight: 600 }}
                  >
                    <option value="All">All Categories</option>
                    {Object.keys(categoriesMap).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  {/* Subcategory Filter */}
                  <select
                    value={filterSubcategory}
                    onChange={e => setFilterSubcategory(e.target.value)}
                    style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #475569', borderRadius: 4, padding: '6px 10px', fontSize: 12, fontWeight: 600 }}
                  >
                    <option value="All">All Subcategories</option>
                    {(filterCategory !== 'All' ? categoriesMap[filterCategory] || [] : Object.values(categoriesMap).flat()).map((sc, i) => (
                      <option key={i} value={sc}>{sc}</option>
                    ))}
                  </select>

                  {/* Payment Mode Filter */}
                  <select
                    value={filterPaymentMode}
                    onChange={e => setFilterPaymentMode(e.target.value)}
                    style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #475569', borderRadius: 4, padding: '6px 10px', fontSize: 12, fontWeight: 600 }}
                  >
                    <option value="All">All Payment Modes</option>
                    <option value="Cash">Cash (Drawer)</option>
                    <option value="UPI">UPI QR</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer - SBI">SBI Bank</option>
                    <option value="Bank Transfer - HDFC">HDFC Bank</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setIsNewExpenseOpen(true)}
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#fff',
                      border: '1px solid #60a5fa',
                      borderRadius: 4,
                      padding: '6px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>➕</span>
                    <span>Log Daily Expense</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      background: '#1e293b',
                      color: '#cbd5e1',
                      border: '1px solid #475569',
                      borderRadius: 4,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🖨️ Print Register
                  </button>
                </div>
              </div>

              {/* Expense Table */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                      <th style={{ padding: '10px 14px' }}>VOUCHER #</th>
                      <th style={{ padding: '10px 14px' }}>DATE / TIME</th>
                      <th style={{ padding: '10px 14px' }}>CATEGORY</th>
                      <th style={{ padding: '10px 14px' }}>SUBCATEGORY</th>
                      <th style={{ padding: '10px 14px' }}>PAID TO / RECIPIENT</th>
                      <th style={{ padding: '10px 14px' }}>MODE &amp; ACCOUNT</th>
                      <th style={{ padding: '10px 14px' }}>REF / BILL #</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>AMOUNT (₹)</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: '30px 14px', textAlign: 'center', color: '#94a3b8' }}>
                          No expenditures match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((exp, idx) => (
                        <tr
                          key={exp.id || idx}
                          style={{
                            borderBottom: '1px solid #334155',
                            background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                          }}
                        >
                          <td style={{ padding: '10px 14px', fontWeight: 800, color: '#38bdf8' }}>
                            {exp.voucher_no}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                            {exp.expense_date} {exp.expense_time ? `• ${exp.expense_time}` : ''}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              style={{
                                background: '#334155',
                                color: '#f8fafc',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 700
                              }}
                            >
                              {exp.category}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f1f5f9' }}>
                            {exp.subcategory}
                            {exp.notes && (
                              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{exp.notes}</div>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                            {exp.paid_to}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 700, color: exp.payment_mode === 'Cash' ? '#fbbf24' : '#38bdf8' }}>
                              {exp.payment_mode}
                            </div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{exp.account_name}</div>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: 11 }}>
                            {exp.receipt_ref || '—'}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, color: '#f87171', fontSize: 13 }}>
                            ₹{Number(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(exp.id, exp.voucher_no)}
                              style={{
                                background: '#7f1d1d',
                                color: '#fca5a5',
                                border: '1px solid #ef4444',
                                borderRadius: 4,
                                padding: '3px 8px',
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Delete/Void voucher"
                            >
                              Void
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredExpenses.length > 0 && (
                    <tfoot>
                      <tr style={{ background: '#0f172a', fontWeight: 900, borderTop: '2px solid #334155' }}>
                        <td colSpan={7} style={{ padding: '10px 14px', textAlign: 'right', color: '#f8fafc' }}>
                          TOTAL EXPENDITURES:
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: '#f87171', fontSize: 14 }}>
                          ₹{totalExpenseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ROOM-CATEGORY REVENUE BREAKDOWN */}
          {activeTab === 'roomCategories' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>🛏️</span>
                    <span>Room Category Revenue Matrix: Suite, Deluxe, Classic Studio, Premium, Executive</span>
                  </h3>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    Segmented by Sri Sai Vasudev Residency room types • Period: {viewMode === 'daily' ? `Daily (${selectedDate})` : `Monthly (${selectedPeriod})`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      background: '#1e293b',
                      color: '#cbd5e1',
                      border: '1px solid #475569',
                      borderRadius: 4,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🖨️ Export PDF / Print
                  </button>
                </div>
              </div>

              {/* Room Category Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12, marginBottom: 18 }}>
                {roomCatReport?.categories.map(cat => (
                  <div
                    key={cat.room_category}
                    style={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 6,
                      padding: '14px 16px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 4,
                        height: '100%',
                        background:
                          cat.room_category === 'Suite' ? '#f59e0b' :
                          cat.room_category === 'Deluxe' ? '#3b82f6' :
                          cat.room_category === 'Classic Studio' ? '#10b981' :
                          cat.room_category === 'Premium' ? '#8b5cf6' : '#ec4899'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#f8fafc' }}>{cat.room_category}</span>
                      <span style={{ background: '#334155', color: '#94a3b8', fontSize: 10, padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>
                        {cat.inventory_rooms} Keys
                      </span>
                    </div>

                    <div style={{ fontSize: 20, fontWeight: 900, color: '#4ade80', marginTop: 8 }}>
                      ₹{cat.net_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                      <span>Tariff: ₹{cat.standard_tariff}</span>
                      <span>Share: <strong style={{ color: '#38bdf8' }}>{cat.revenue_share_pct}%</strong></span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>
                      <span>Sold: {cat.rooms_sold} checkouts</span>
                      <span>ADR: ₹{cat.adr}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed Breakdown Table */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 14px' }}>ROOM CATEGORY</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>KEYS (INVENTORY)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>ROOMS SOLD</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>OCCUPANCY %</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>BASE TARIFF (₹)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>AVG DAILY RATE (ADR)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>ROOM TARIFF REV (₹)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>F&amp;B DINING REV (₹)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>GST 12% (₹)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>NET REVENUE (₹)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>SHARE %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomCatReport?.categories.map((cat, idx) => (
                      <tr
                        key={cat.room_category}
                        style={{
                          borderBottom: '1px solid #334155',
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                        }}
                      >
                        <td style={{ padding: '12px 14px', fontWeight: 900, color: '#f8fafc' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              marginRight: 8,
                              background:
                                cat.room_category === 'Suite' ? '#f59e0b' :
                                cat.room_category === 'Deluxe' ? '#3b82f6' :
                                cat.room_category === 'Classic Studio' ? '#10b981' :
                                cat.room_category === 'Premium' ? '#8b5cf6' : '#ec4899'
                            }}
                          />
                          {cat.room_category}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#cbd5e1' }}>
                          {cat.inventory_rooms}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, color: '#38bdf8' }}>
                          {cat.rooms_sold}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#cbd5e1' }}>
                          {cat.occupancy_pct}%
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#cbd5e1' }}>
                          ₹{cat.standard_tariff.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#cbd5e1', fontWeight: 700 }}>
                          ₹{cat.adr.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#f8fafc', fontWeight: 800 }}>
                          ₹{cat.total_room_rent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#fb923c' }}>
                          ₹{cat.food_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#94a3b8' }}>
                          ₹{cat.gst_collected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: '#4ade80', fontSize: 13 }}>
                          ₹{cat.net_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ background: '#334155', color: '#38bdf8', padding: '2px 6px', borderRadius: 4, fontWeight: 800, fontSize: 11 }}>
                            {cat.revenue_share_pct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {roomCatReport && (
                    <tfoot>
                      <tr style={{ background: '#0f172a', fontWeight: 900, borderTop: '2px solid #334155' }}>
                        <td style={{ padding: '12px 14px', color: '#f8fafc' }}>CONSOLIDATED TOTAL:</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#cbd5e1' }}>
                          {roomCatReport.summary.total_inventory} Keys
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#38bdf8' }}>
                          {roomCatReport.summary.total_rooms_sold} Sold
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#cbd5e1' }}>
                          {roomCatReport.summary.overall_occupancy_pct}%
                        </td>
                        <td colSpan={2}></td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#f8fafc' }}>
                          ₹{roomCatReport.summary.total_room_rent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td colSpan={2}></td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#4ade80', fontSize: 14 }}>
                          ₹{roomCatReport.summary.total_net_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#38bdf8' }}>100%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT MODE & BANK ACCOUNT BREAKDOWN */}
          {activeTab === 'paymentModes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>💳</span>
                    <span>Payment Mode &amp; Real-time Bank Accounts Breakdown</span>
                  </h3>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    Cash Drawer vs. UPI vs. POS Terminals vs. Direct Bank NEFT/RTGS Credits • Period: {viewMode === 'daily' ? `Daily (${selectedDate})` : `Monthly (${selectedPeriod})`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: '#1e293b',
                    color: '#cbd5e1',
                    border: '1px solid #475569',
                    borderRadius: 4,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🖨️ Export PDF / Print
                </button>
              </div>

              {/* Mode Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12, marginBottom: 18 }}>
                {paymentModeReport?.modes.map(m => (
                  <div
                    key={m.payment_mode}
                    style={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 6,
                      padding: '14px 16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#f8fafc' }}>{m.payment_mode}</span>
                      <span style={{ background: '#334155', color: '#38bdf8', fontSize: 10, padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>
                        {m.transaction_count} Txns
                      </span>
                    </div>

                    <div style={{ fontSize: 20, fontWeight: 900, color: m.payment_mode === 'Cash' ? '#fbbf24' : '#38bdf8', marginTop: 8 }}>
                      ₹{m.total_collected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>

                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.account_name}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#cbd5e1', marginTop: 6, borderTop: '1px solid #334155', paddingTop: 6 }}>
                      <span>Share of Collections:</span>
                      <strong style={{ color: '#4ade80' }}>{m.share_pct}%</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed Bank Modes Table */}
              <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 14px' }}>PAYMENT MODE</th>
                      <th style={{ padding: '12px 14px' }}>SETTLEMENT BANK ACCOUNT / GATEWAY</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>TRANSACTIONS</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>ROOM CHECKOUT REV (₹)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>VASUDEV RASOI F&amp;B (₹)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>OTHER INFLOWS (₹)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>TOTAL REALIZED INFLOW (₹)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>SHARE %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentModeReport?.modes.map((m, idx) => (
                      <tr
                        key={m.payment_mode}
                        style={{
                          borderBottom: '1px solid #334155',
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                        }}
                      >
                        <td style={{ padding: '12px 14px', fontWeight: 900, color: m.payment_mode === 'Cash' ? '#fbbf24' : '#38bdf8' }}>
                          {m.payment_mode}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                          {m.account_name}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#f8fafc' }}>
                          {m.transaction_count}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#f8fafc' }}>
                          ₹{m.room_collections.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#fb923c' }}>
                          ₹{m.food_collections.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#94a3b8' }}>
                          ₹{m.other_collections.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: '#4ade80', fontSize: 13 }}>
                          ₹{m.total_collected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ background: '#334155', color: '#38bdf8', padding: '2px 6px', borderRadius: 4, fontWeight: 800, fontSize: 11 }}>
                            {m.share_pct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {paymentModeReport && (
                    <tfoot>
                      <tr style={{ background: '#0f172a', fontWeight: 900, borderTop: '2px solid #334155' }}>
                        <td colSpan={6} style={{ padding: '12px 14px', textAlign: 'right', color: '#f8fafc' }}>
                          GRAND TOTAL COLLECTIONS:
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#4ade80', fontSize: 14 }}>
                          ₹{paymentModeReport.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', color: '#38bdf8' }}>100%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: EOD DAY-END CLOSING BALANCE RECONCILIATION */}
          {activeTab === 'closingSummary' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>🌅</span>
                    <span>Executive Day-End Closing &amp; Handover Balance Reconciliation</span>
                  </h3>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    Business Date: {selectedDate} • Mandatory Handover Audit for Shift Leads &amp; Receptionists
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: '#1e293b',
                    color: '#cbd5e1',
                    border: '1px solid #475569',
                    borderRadius: 4,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🖨️ Print 2-Sheet Handover Certificate
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
                {/* Physical Cash Drawer Card */}
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #334155', paddingBottom: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 24 }}>💵</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#fbbf24' }}>
                        PHYSICAL CASH DRAWER RECONCILIATION
                      </h4>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Front Office Cash Handover Audit</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}>1. Opening Front Desk Float:</span>
                      <strong style={{ color: '#f8fafc' }}>
                        ₹{eodSummary?.cash_drawer_reconciliation.opening_float.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#4ade80' }}>2. Add: Total Cash Collected Today:</span>
                      <strong style={{ color: '#4ade80' }}>
                        + ₹{eodSummary?.cash_drawer_reconciliation.cash_inflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#f87171' }}>3. Less: Cash Expenditures Paid:</span>
                      <strong style={{ color: '#f87171' }}>
                        - ₹{eodSummary?.cash_drawer_reconciliation.cash_outflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div style={{ borderTop: '2px dashed #475569', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#f8fafc' }}>
                        VERIFIED CLOSING CASH IN HAND:
                      </span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24' }}>
                        ₹{eodSummary?.cash_drawer_reconciliation.closing_cash_in_drawer.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, background: '#0f172a', padding: '10px 14px', borderRadius: 6, fontSize: 11, color: '#94a3b8' }}>
                    ⚠️ Count physical 500, 200, 100, and 50 rupee currency notes in front desk drawer and confirm exact match before shift sign-off.
                  </div>
                </div>

                {/* Digital Banking Reconciliation Card */}
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #334155', paddingBottom: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 24 }}>📱</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#38bdf8' }}>
                        DIGITAL &amp; BANK RECONCILIATION
                      </h4>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>SBI &amp; HDFC Accounts Inflow &amp; Outflow</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#4ade80' }}>1. Total UPI &amp; QR Inflow:</span>
                      <strong style={{ color: '#4ade80' }}>
                        + ₹{((eodSummary?.digital_reconciliation.digital_inflow || 0) * 0.65).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#38bdf8' }}>2. Total Card POS &amp; Net Banking:</span>
                      <strong style={{ color: '#38bdf8' }}>
                        + ₹{((eodSummary?.digital_reconciliation.digital_inflow || 0) * 0.35).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#f87171' }}>3. Less: Digital Outflows / Bank Debits:</span>
                      <strong style={{ color: '#f87171' }}>
                        - ₹{eodSummary?.digital_reconciliation.digital_outflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div style={{ borderTop: '2px dashed #475569', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#f8fafc' }}>
                        NET DIGITAL INFLOW CREDITED:
                      </span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#38bdf8' }}>
                        ₹{eodSummary?.digital_reconciliation.net_digital_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, background: '#0f172a', padding: '10px 14px', borderRadius: 6, fontSize: 11, color: '#94a3b8' }}>
                    ℹ️ Bank settlements are credited automatically by HDFC / SBI payment gateways within 24 hours.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LOG DAILY EXPENSE MODAL */}
        {isNewExpenseOpen && (
          <div className="pms-reg-modal-backdrop" style={{ zIndex: 1100 }}>
            <div
              className="pms-reg-modal-window"
              style={{
                maxWidth: '650px',
                background: '#1e293b',
                color: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #475569',
                padding: '20px 24px'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #334155', paddingBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>➕</span>
                  <span>Log End-of-Day Expenditure</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewExpenseOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer', fontWeight: 800 }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveExpense}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                      EXPENSE DATE
                    </label>
                    <input
                      type="date"
                      required
                      value={expenseForm.expense_date}
                      onChange={e => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                      style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: 4, padding: '7px 10px', fontSize: 12 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                      TIME
                    </label>
                    <input
                      type="text"
                      value={expenseForm.expense_time}
                      onChange={e => setExpenseForm({ ...expenseForm, expense_time: e.target.value })}
                      placeholder="HH:MM"
                      style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: 4, padding: '7px 10px', fontSize: 12 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                      EXPENSE CATEGORY *
                    </label>
                    <select
                      value={expenseForm.category}
                      onChange={e => handleCategoryChange(e.target.value)}
                      style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: 4, padding: '7px 10px', fontSize: 12 }}
                    >
                      {Object.keys(categoriesMap).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                      EXACT SUBCATEGORY *
                    </label>
                    <select
                      value={expenseForm.subcategory}
                      onChange={e => setExpenseForm({ ...expenseForm, subcategory: e.target.value })}
                      style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: 4, padding: '7px 10px', fontSize: 12 }}
                    >
                      {availableSubcategoriesForForm.map((sc, i) => (
                        <option key={i} value={sc}>{sc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                      AMOUNT (₹) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      value={expenseForm.amount}
                      onChange={e => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: 4, padding: '7px 10px', fontSize: 13, fontWeight: 800 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                      PAYMENT MODE *
                    </label>
                    <select
                      value={expenseForm.payment_mode}
                      onChange={e => handlePaymentModeChange(e.target.value)}
                      style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: 4, padding: '7px 10px', fontSize: 12 }}
                    >
                      <option value="Cash">Cash (Petty Cash Drawer)</option>
                      <option value="UPI">UPI QR (SBI Merchant)</option>
                      <option value="Debit Card">Debit Card (POS Terminal)</option>
                      <option value="Credit Card">Credit Card (POS Terminal)</option>
                      <option value="Bank Transfer - SBI">SBI Bank Transfer</option>
                      <option value="Bank Transfer - HDFC">HDFC Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                      PAID TO / VENDOR *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sai Kirana / Electrician Ramesh"
                      value={expenseForm.paid_to}
                      onChange={e => setExpenseForm({ ...expenseForm, paid_to: e.target.value })}
                      style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: 4, padding: '7px 10px', fontSize: 12 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                      RECEIPT / BILL / UTR #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BILL-9921 / UTR-881273"
                      value={expenseForm.receipt_ref}
                      onChange={e => setExpenseForm({ ...expenseForm, receipt_ref: e.target.value })}
                      style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: 4, padding: '7px 10px', fontSize: 12 }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    DESCRIPTION / NOTES
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Details of purchased items or service rendered..."
                    value={expenseForm.notes}
                    onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: 4, padding: '7px 10px', fontSize: 12 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setIsNewExpenseOpen(false)}
                    style={{ background: '#334155', color: '#cbd5e1', border: 'none', borderRadius: 4, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 20px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                  >
                    Save &amp; Generate Voucher
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

