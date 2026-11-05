import re

BAK_PATH = 'src/services/pmsStore.ts.bak'
TARGET_PATH = 'src/services/pmsStore.ts'

with open(BAK_PATH, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update SCHEMA_VERSION
text = re.sub(
    r"static readonly SCHEMA_VERSION = '[^']+';",
    "static readonly SCHEMA_VERSION = '20261105_svr_production_v1';",
    text
)

# 2. Clean INITIAL_ROOMS (Make all 18 rooms vacant, remove currentGuest, foodAmount = 0)
match_rooms = re.search(r'export const INITIAL_ROOMS: PmsRoom\[\] = \[\s*([\s\S]*?)\n\];', text)
if match_rooms:
    rooms_text = match_rooms.group(1)
    cleaned_rooms = re.sub(r'currentGuest:\s*\{[\s\S]*?\},\n', '', rooms_text)
    cleaned_rooms = re.sub(r"status:\s*'(?:occupied|dirty|booked)'", "status: 'vacant'", cleaned_rooms)
    cleaned_rooms = re.sub(r"foodAmount:\s*[0-9.]+", "foodAmount: 0", cleaned_rooms)
    cleaned_rooms = re.sub(r"priority:\s*'[^']+'", "priority: 'Normal'", cleaned_rooms)
    replacement = f"export const INITIAL_ROOMS: PmsRoom[] = [\n{cleaned_rooms}\n];"
    text = text[:match_rooms.start()] + replacement + text[match_rooms.end():]

# 3. Clean constants
new_party_accounts = """export const INITIAL_PARTY_ACCOUNTS: PmsPartyAccount[] = [
  { id: 'pa-1', name: 'Cash', category: 'General', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-2', name: 'Online', category: 'General', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-3', name: 'Card', category: 'General', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-4', name: 'Purchase', category: 'General', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-5', name: 'Bank - SBI', category: 'Bank', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-6', name: 'UPI / QR', category: 'Bank', balance: 0.00, balanceType: 'Dr' }
];"""
text = re.sub(r'export const INITIAL_PARTY_ACCOUNTS: PmsPartyAccount\[\] = \[\s*[\s\S]*?\n\];', new_party_accounts, text)
text = re.sub(r'export const INITIAL_RECEIPTS: PmsReceiptRecord\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_RECEIPTS: PmsReceiptRecord[] = [];', text)
text = re.sub(r'export const INITIAL_PAYMENTS: PmsPaymentRecord\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_PAYMENTS: PmsPaymentRecord[] = [];', text)
text = re.sub(r'export const INITIAL_PURCHASES: PmsPurchaseBill\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_PURCHASES: PmsPurchaseBill[] = [];', text)
text = re.sub(r'export const INITIAL_STOCK_TRANSFERS: PmsStockTransfer\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_STOCK_TRANSFERS: PmsStockTransfer[] = [];', text)
text = re.sub(r'export const INITIAL_BOOKINGS: PmsBooking\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_BOOKINGS: PmsBooking[] = [];', text)

new_user_accounts = """export const INITIAL_USER_ACCOUNTS: PmsUserAccount[] = [
  {
    id: 1,
    sNo: 1,
    firmId: 'DEMO0004',
    userName: 'Admin',
    emailId: 'admin@hotelsai-vasudev.com',
    roleId: 1,
    roleName: 'super-admin',
    status: 'Verified',
    regDate: '2025-02-05 10:00:00',
    verifiedDate: '2025-02-05 10:00:00',
    mobile: '9440289999',
    department: 'General Management',
    shift: 'General (09:00 - 18:00)',
    isOnDuty: true
  },
  {
    id: 2,
    sNo: 2,
    firmId: 'DEMO0004',
    userName: 'Rakesh Nandyala',
    emailId: 'rakesh@sai-vasudev.com',
    roleId: 2,
    roleName: 'admin',
    status: 'Verified',
    regDate: '2025-02-05 10:00:00',
    verifiedDate: '2025-02-05 10:00:00',
    mobile: '9440289999',
    department: 'General Management',
    shift: 'General (09:00 - 18:00)',
    isOnDuty: true
  },
  {
    id: 3,
    sNo: 3,
    firmId: 'DEMO0004',
    userName: 'Front Desk',
    emailId: 'reservations@hotelsai-vasudev.com',
    roleId: 8,
    roleName: 'Receptionist',
    status: 'Verified',
    regDate: '2025-02-05 10:00:00',
    verifiedDate: '2025-02-05 10:00:00',
    mobile: '9440289999',
    department: 'Front Office',
    shift: 'Morning (07:00 - 15:00)',
    isOnDuty: true
  }
];"""
text = re.sub(r'export const INITIAL_USER_ACCOUNTS: PmsUserAccount\[\] = \[\s*[\s\S]*?\n\];', new_user_accounts, text)

new_chain_properties = """export const INITIAL_CHAIN_PROPERTIES: PmsChainProperty[] = [
  {
    firmId: 'DEMO0004',
    firmName: 'SRI SAI VASUDEV RESIDENCY',
    location: 'Rayagada (New Colony)',
    address: 'Near Andhra Bank, New Colony, Rayagada, Odisha - 765001',
    phone: '+91 94402 89999',
    email: 'reservations@hotelsai-vasudev.com',
    gstin: '21AEKPP8689J1ZS',
    totalRooms: 18,
    activationDate: '05-02-25',
    renewDate: '05-02-35',
    whatsAppValidity: '29-06-2030',
    isCurrent: true
  }
];"""
text = re.sub(r'export const INITIAL_CHAIN_PROPERTIES: PmsChainProperty\[\] = \[\s*[\s\S]*?\n\];', new_chain_properties, text)
text = re.sub(r'export const INITIAL_WHATSAPP_LOGS: PmsWhatsAppLog\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_WHATSAPP_LOGS: PmsWhatsAppLog[] = [];', text)
text = re.sub(r'export const INITIAL_SUPPORT_TICKETS: PmsSupportTicket\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_SUPPORT_TICKETS: PmsSupportTicket[] = [];', text)
text = re.sub(r'export const INITIAL_BANQUET_BOOKINGS: PmsBanquetBooking\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_BANQUET_BOOKINGS: PmsBanquetBooking[] = [];', text)
text = re.sub(r'export const INITIAL_EXPENSES: PmsExpenseRecord\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_EXPENSES: PmsExpenseRecord[] = [];', text)

new_housekeeping = """export const INITIAL_HOUSEKEEPING: PmsHousekeepingRecord[] = [
  { roomNo: '101', status: 'Vacant Clean', assignedStaff: 'Sunita', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '102', status: 'Vacant Clean', assignedStaff: 'Sunita', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '103', status: 'Vacant Clean', assignedStaff: 'Ramesh', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '104', status: 'Vacant Clean', assignedStaff: 'Ramesh', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '105', status: 'Vacant Clean', assignedStaff: 'Sunita', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '106', status: 'Vacant Clean', assignedStaff: 'Ramesh', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '107', status: 'Vacant Clean', assignedStaff: 'Sunita', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '201', status: 'Vacant Clean', assignedStaff: 'Ganesh', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '202', status: 'Vacant Clean', assignedStaff: 'Ganesh', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '203', status: 'Vacant Clean', assignedStaff: 'Priya', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '204', status: 'Vacant Clean', assignedStaff: 'Priya', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '205', status: 'Vacant Clean', assignedStaff: 'Ganesh', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '206', status: 'Vacant Clean', assignedStaff: 'Priya', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '207', status: 'Vacant Clean', assignedStaff: 'Sunita', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '208', status: 'Vacant Clean', assignedStaff: 'Ramesh', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '209', status: 'Vacant Clean', assignedStaff: 'Ganesh', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '210', status: 'Vacant Clean', assignedStaff: 'Priya', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' },
  { roomNo: '211', status: 'Vacant Clean', assignedStaff: 'Sunita', priority: 'Normal', lastCleanedTime: '05-02-2025 09:00 AM' }
];"""
text = re.sub(r'export const INITIAL_HOUSEKEEPING: PmsHousekeepingRecord\[\] = \[\s*[\s\S]*?\n\];', new_housekeeping, text)
text = re.sub(r'export const INITIAL_NIGHT_AUDITS: PmsNightAuditRecord\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_NIGHT_AUDITS: PmsNightAuditRecord[] = [];', text)
text = re.sub(r'export const INITIAL_FOLIO_PAYMENTS: PmsFolioPayment\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_FOLIO_PAYMENTS: PmsFolioPayment[] = [];', text)
text = re.sub(r'export const INITIAL_AGENT_COMMISSIONS: PmsAgentCommissionBooking\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_AGENT_COMMISSIONS: PmsAgentCommissionBooking[] = [];', text)
text = re.sub(r'export const INITIAL_AGENT_PAYOUT_VOUCHERS: PmsAgentPayoutVoucher\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_AGENT_PAYOUT_VOUCHERS: PmsAgentPayoutVoucher[] = [];', text)
text = re.sub(r'export const INITIAL_LIQUOR_STOCKS: PmsBrandWiseLiquorStock\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_LIQUOR_STOCKS: PmsBrandWiseLiquorStock[] = [];', text)
text = re.sub(r'export const INITIAL_BAR_INVOICES: PmsBarInvoice\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_BAR_INVOICES: PmsBarInvoice[] = [];', text)
text = re.sub(r'export const INITIAL_DISCOUNT_AUDIT_LOGS: PmsDiscountAuditRecord\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_DISCOUNT_AUDIT_LOGS: PmsDiscountAuditRecord[] = [];', text)

# Update resetToDemoSeedData
new_reset_method = """  static resetToDemoSeedData(): void {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
    localStorage.setItem(STORAGE_KEYS.ROOM_TYPES, JSON.stringify(INITIAL_ROOM_TYPES));
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(INITIAL_MENU_ITEMS));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.HOUSEKEEPING, JSON.stringify(INITIAL_HOUSEKEEPING));
    localStorage.setItem(STORAGE_KEYS.NIGHT_AUDITS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.FOLIO_PAYMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BUSINESS_DATE, new Date().toISOString().split('T')[0]);
    localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, this.SCHEMA_VERSION);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CHECKOUTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.KOTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.FOOD_BILLS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.STOCK_TRANSFERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PARTY_ACCOUNTS, JSON.stringify(INITIAL_PARTY_ACCOUNTS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USER_ACCOUNTS));
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(INITIAL_CHAIN_PROPERTIES));
    localStorage.removeItem(STORAGE_KEYS.JOURNAL_ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.KOT_VOID_AUDIT);
    localStorage.removeItem(STORAGE_KEYS.NIGHT_AUDIT_ACCRUALS);
    localStorage.removeItem(STORAGE_KEYS.FOLIO_DISCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.GROUP_BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.ADVANCE_RECEIPTS);
    localStorage.removeItem(STORAGE_KEYS.ROOM_SHIFTS);
    localStorage.removeItem(STORAGE_KEYS.AGENT_PAYOUT_VOUCHERS);
    localStorage.removeItem(STORAGE_KEYS.BANQUET_BOOKINGS);
    localStorage.removeItem(STORAGE_KEYS.BAR_INVOICES);
    localStorage.removeItem(STORAGE_KEYS.LIQUOR_STOCKS);
    localStorage.removeItem(STORAGE_KEYS.DISCOUNT_AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.WHATSAPP_LOGS);
    localStorage.removeItem(STORAGE_KEYS.SUPPORT_TICKETS);
    localStorage.removeItem('hotel_pms_checkins');
    localStorage.removeItem('hotel_pms_foodbills');
    localStorage.removeItem('hotel_pms_food_bills');
    localStorage.removeItem('hotel_pms_checkouts');
    this.notify();
  }"""

# Replace a static method cleanly by finding its declaration up to next static method or section
def replace_method(src, method_sig, new_code):
    pos = src.find(method_sig)
    if pos == -1:
        print(f"FAILED to find {method_sig}")
        return src
    
    # Find next static method or class end
    next_pos = src.find('\n  static ', pos + len(method_sig))
    if next_pos == -1:
        next_pos = src.find('\n  //', pos + len(method_sig))
    if next_pos == -1:
        next_pos = src.rfind('\n}')
    
    return src[:pos] + new_code.strip() + '\n\n' + src[next_pos:].lstrip('\n')

text = replace_method(text, 'static resetToDemoSeedData(): void {', new_reset_method)

text = replace_method(text, 'static getJournalEntries(): import(\'../types/pmsModels\').PmsJournalEntry[] {', """  static getJournalEntries(): import('../types/pmsModels').PmsJournalEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }""")

text = replace_method(text, 'static getCheckIns(): import(\'../types/pmsModels\').PmsCheckIn[] {', """  static getCheckIns(): import('../types/pmsModels').PmsCheckIn[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKINS) || localStorage.getItem('hotel_pms_checkins');
    if (raw) {
      try {
        const parsed: import('../types/pmsModels').PmsCheckIn[] = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return [];
  }""")

text = replace_method(text, 'static getKots(): PmsKotRecord[] {', """  static getKots(): PmsKotRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.KOTS);
    if (raw) {
      try {
        const parsed: PmsKotRecord[] = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return [];
  }""")

text = replace_method(text, 'static getGroupBookings(): GroupBookingMetadata[] {', """  static getGroupBookings(): GroupBookingMetadata[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GROUP_BOOKINGS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }""")

text = replace_method(text, 'static getFoodBills(): import(\'../types/pmsModels\').PmsFoodBill[] {', """  static getFoodBills(): import('../types/pmsModels').PmsFoodBill[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FOOD_BILLS) || localStorage.getItem('hotel_pms_foodbills') || localStorage.getItem('hotel_pms_food_bills');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }""")

text = replace_method(text, 'static getCheckouts(): PmsCheckOutDetail[] {', """  static getCheckouts(): PmsCheckOutDetail[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKOUTS);
    if (raw) {
      try {
        const parsed: PmsCheckOutDetail[] = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return [];
  }""")

text = replace_method(text, 'static getAdvanceReceipts(): PmsAdvanceReceipt[] {', """  static getAdvanceReceipts(): PmsAdvanceReceipt[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ADVANCE_RECEIPTS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return [];
  }""")

text = replace_method(text, 'static getLedgerAccountOptions(): { id: string; name: string; category: string; phone?: string }[] {', """  static getLedgerAccountOptions(): { id: string; name: string; category: string; phone?: string }[] {
    const parties = this.getPartyAccounts();
    return parties.map(p => ({
      id: p.name,
      name: p.name,
      category: p.category || 'General',
      phone: p.mobile
    }));
  }""")

text = replace_method(text, 'static getPartyLedger(', """  static getPartyLedger(
    accountName: string,
    _fromDate: string = '01-05-2025',
    _toDate: string = '16-06-2025'
  ): {
    entries: LedgerEntry[];
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    closingType: 'Dr' | 'Cr';
  } {
    const cleanQuery = (accountName || 'Cash').toLowerCase().trim();
    const allTx: { date: string; type: string; account: string; remark: string; debit: number; credit: number }[] = [];

    // Receipts
    const receipts = this.getReceipts();
    receipts.forEach(r => {
      const mode = (r.paymentMode || '').toLowerCase();
      const acc = (r.accountName || '').toLowerCase();
      if (cleanQuery === 'cash' && mode === 'cash') {
        allTx.push({ date: r.date, type: 'Receipts', account: r.accountName, remark: r.remark || '', debit: r.amount, credit: 0 });
      } else if (cleanQuery === 'online' && (mode === 'online' || mode === 'upi')) {
        allTx.push({ date: r.date, type: 'Receipts', account: r.accountName, remark: r.remark || '', debit: r.amount, credit: 0 });
      } else if (cleanQuery === 'card' && mode === 'card') {
        allTx.push({ date: r.date, type: 'Receipts', account: r.accountName, remark: r.remark || '', debit: r.amount, credit: 0 });
      } else if (acc.includes(cleanQuery)) {
        allTx.push({ date: r.date, type: 'Receipts', account: r.paymentMode, remark: r.remark || '', debit: 0, credit: r.amount });
      }
    });

    // Payments
    const payments = this.getPayments();
    payments.forEach(p => {
      const mode = (p.paymentMode || '').toLowerCase();
      const acc = (p.accountName || '').toLowerCase();
      if (cleanQuery === 'cash' && mode === 'cash') {
        allTx.push({ date: p.date, type: 'Payment', account: p.accountName, remark: p.remark || '', debit: 0, credit: p.amount });
      } else if (cleanQuery === 'online' && (mode === 'online' || mode === 'upi')) {
        allTx.push({ date: p.date, type: 'Payment', account: p.accountName, remark: p.remark || '', debit: 0, credit: p.amount });
      } else if (cleanQuery === 'card' && mode === 'card') {
        allTx.push({ date: p.date, type: 'Payment', account: p.accountName, remark: p.remark || '', debit: 0, credit: p.amount });
      } else if (acc.includes(cleanQuery)) {
        allTx.push({ date: p.date, type: 'Payment', account: p.paymentMode, remark: p.remark || '', debit: p.amount, credit: 0 });
      }
    });

    // Checkouts
    const checkouts = this.getCheckouts();
    checkouts.forEach(co => {
      const mode = (co.paymentMode || '').toLowerCase();
      const gName = (co.guestName || '').toLowerCase();
      const cName = (co.companyName || '').toLowerCase();
      if (cleanQuery === 'cash' && mode.includes('cash')) {
        allTx.push({ date: co.checkOutDate, type: 'Check_Out', account: co.guestName, remark: `Checkout #${co.invoiceNo} Room ${co.roomNo}`, debit: co.netPayable, credit: 0 });
      } else if (cleanQuery === 'online' && (mode.includes('online') || mode.includes('upi'))) {
        allTx.push({ date: co.checkOutDate, type: 'Check_Out', account: co.guestName, remark: `Checkout #${co.invoiceNo} Room ${co.roomNo}`, debit: co.netPayable, credit: 0 });
      } else if (cleanQuery === 'card' && mode.includes('card')) {
        allTx.push({ date: co.checkOutDate, type: 'Check_Out', account: co.guestName, remark: `Checkout #${co.invoiceNo} Room ${co.roomNo}`, debit: co.netPayable, credit: 0 });
      } else if (gName.includes(cleanQuery) || cName.includes(cleanQuery)) {
        allTx.push({ date: co.checkOutDate, type: 'Check_Out', account: co.paymentMode, remark: `Invoice #${co.invoiceNo}`, debit: co.netPayable, credit: 0 });
      }
    });

    const opening = 0.00;
    let currentBal = opening;
    const entries: LedgerEntry[] = [
      {
        date: '',
        type: '',
        accountName: 'Opening Balance',
        remark: '',
        debit: 0,
        credit: 0,
        balance: opening,
        balanceType: 'Dr'
      }
    ];

    let totDeb = 0;
    let totCred = 0;

    for (const tx of allTx) {
      currentBal += (tx.debit - tx.credit);
      totDeb += tx.debit;
      totCred += tx.credit;
      entries.push({
        date: tx.date,
        type: tx.type,
        accountName: tx.account,
        remark: tx.remark,
        debit: tx.debit,
        credit: tx.credit,
        balance: parseFloat(currentBal.toFixed(2)),
        balanceType: currentBal >= 0 ? 'Dr' : 'Cr'
      });
    }

    return {
      entries,
      totalDebit: parseFloat(totDeb.toFixed(2)),
      totalCredit: parseFloat(totCred.toFixed(2)),
      closingBalance: parseFloat(currentBal.toFixed(2)),
      closingType: currentBal >= 0 ? 'Dr' : 'Cr'
    };
  }""")

text = replace_method(text, 'static getB2BReport(fromDate?: string, toDate?: string): PmsB2BInvoiceRecord[] {', """  static getB2BReport(_fromDate?: string, _toDate?: string): PmsB2BInvoiceRecord[] {
    const checkouts = this.getCheckouts();
    const list: PmsB2BInvoiceRecord[] = [];

    checkouts.forEach((co: PmsCheckOutDetail) => {
      const isB2B = co.gstNumber && co.gstNumber.trim().length >= 5;
      if (isB2B) {
        list.push({
          sNo: list.length + 1,
          gstin: co.gstNumber || '',
          receiverName: co.companyName || co.guestName,
          invoiceNumber: co.invoiceNo,
          invoiceDate: co.checkOutDate,
          invoiceValue: co.netPayable,
          placeOfSupply: '21-Odisha',
          reverseCharge: 'N',
          applicableTaxRate: 'N',
          invoiceType: 'Regular B2B',
          eCommerceGstin: '',
          rate: co.gstPercent || 12,
          taxableValue: co.totalRoomRent,
          cessAmount: 0
        });
      }
    });

    return list;
  }""")

# Clean getB2CReport
text = replace_method(text, 'static getB2CReport(_fromDate?: string, _toDate?: string): PmsB2CInvoiceRecord[] {', """  static getB2CReport(_fromDate?: string, _toDate?: string): PmsB2CInvoiceRecord[] {
    const checkouts = this.getCheckouts();
    let liveFoodTaxable = 0;
    let liveRoomTaxable = 0;

    checkouts.forEach((co: PmsCheckOutDetail) => {
      const isB2B = co.gstNumber && co.gstNumber.trim().length >= 5;
      if (!isB2B) {
        liveRoomTaxable += (co.totalRoomRent / 1.12);
        liveFoodTaxable += (co.foodAmount || 0) / 1.05;
      }
    });

    const foodTaxable = Math.round(liveFoodTaxable * 100) / 100;
    const roomTaxable = Math.round(liveRoomTaxable * 100) / 100;

    return [
      {
        sNo: 1,
        type: 'OE',
        placeOfSupply: '21-Odisha',
        applicableTaxRate: 'N',
        rate: 5,
        taxableValue: foodTaxable,
        cessAmount: 0,
        eCommerceGstin: ''
      },
      {
        sNo: 2,
        type: 'OE',
        placeOfSupply: '21-Odisha',
        applicableTaxRate: 'N',
        rate: 12,
        taxableValue: roomTaxable,
        cessAmount: 0,
        eCommerceGstin: ''
      }
    ];
  }""")

text = replace_method(text, 'static getConsolidatedGstReport(fromDate?: string, toDate?: string): PmsConsolidatedGstItem[] {', """  static getConsolidatedGstReport(_fromDate?: string, _toDate?: string): PmsConsolidatedGstItem[] {
    const list: PmsConsolidatedGstItem[] = [];

    const checkouts = this.getCheckouts();
    checkouts.forEach((co: PmsCheckOutDetail) => {
      const isInterState = co.state && !co.state.toLowerCase().includes('odisha') && !co.state.toLowerCase().includes('orissa');
      const gstAmt = co.gstAmount || 0;
      const cgst = isInterState ? 0 : gstAmt / 2;
      const sgst = isInterState ? 0 : gstAmt / 2;
      const igst = isInterState ? gstAmt : 0;

      list.push({
        sNo: list.length + 1,
        voucherNo: co.invoiceNo,
        roomNoOrTable: co.roomNo,
        guestName: co.guestName,
        address: co.addressLine1 || '',
        city: co.city || 'Rayagada',
        state: co.state || 'Odisha',
        mobile: co.guestPhone || '',
        firmName: co.companyName || '',
        gstin: co.gstNumber || '',
        checkInDate: co.checkInDate,
        invoiceDate: co.checkOutDate,
        totalDays: co.numberOfDays || 1,
        type: 'Room Bill',
        gstRate: co.gstPercent || 12,
        sgst: Math.round(sgst * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        igst: Math.round(igst * 100) / 100,
        taxable: Math.round(co.totalRoomRent * 100) / 100,
        totalGst: Math.round(gstAmt * 100) / 100,
        billAmount: Math.round((co.totalRoomRent + gstAmt) * 100) / 100,
        advanceOrDiscount: -(co.advanceDeducted || 0) - (co.lessDiscount || 0),
        netPayAmount: co.netPayable
      });
    });

    const foodBills = this.getFoodBills();
    foodBills.forEach((fb: any) => {
      list.push({
        sNo: list.length + 1,
        voucherNo: fb.billNo,
        roomNoOrTable: fb.roomNo || fb.tableNo || 'Table',
        guestName: fb.guestName || 'Walk-in Guest',
        address: '',
        city: 'Rayagada',
        state: 'Odisha',
        mobile: fb.mobile || '',
        firmName: '',
        gstin: '',
        checkInDate: fb.date,
        invoiceDate: fb.date,
        totalDays: 0,
        type: 'Food Bill',
        gstRate: 5.0,
        sgst: Math.round(((fb.gstAmount || 0) / 2) * 100) / 100,
        cgst: Math.round(((fb.gstAmount || 0) / 2) * 100) / 100,
        igst: 0,
        taxable: fb.taxableAmount || 0,
        totalGst: fb.gstAmount || 0,
        billAmount: fb.totalAmount || fb.netBillAmount || 0,
        advanceOrDiscount: -(fb.discountAmount || 0),
        netPayAmount: fb.netBillAmount || 0
      });
    });

    return list;
  }""")

text = replace_method(text, 'static getOutstandingAccounts(balanceFilter: \'Dr\' | \'Cr\' | \'all\' = \'all\'): PmsOutstandingAccount[] {', """  static getOutstandingAccounts(balanceFilter: 'Dr' | 'Cr' | 'all' = 'all'): PmsOutstandingAccount[] {
    const list: PmsOutstandingAccount[] = [];
    const parties = this.getPartyAccounts();

    parties.forEach(p => {
      if (p.balance > 0) {
        if (balanceFilter === 'all' || p.balanceType === balanceFilter) {
          list.push({
            sNo: list.length + 1,
            accountName: p.name,
            mobile: p.mobile || '—',
            balance: p.balance,
            balanceType: p.balanceType,
            category: p.category || 'Vendor',
            lastTransactionDate: new Date().toLocaleDateString('en-GB').replace(/\\//g, '-')
          });
        }
      }
    });

    return list;
  }""")

text = replace_method(text, 'static getItemWiseSalesReport(_fromDate?: string, _toDate?: string): PmsItemWiseSale[] {', """  static getItemWiseSalesReport(_fromDate?: string, _toDate?: string): PmsItemWiseSale[] {
    const itemMap = new Map<string, PmsItemWiseSale>();
    const liveKots = this.getKots();

    liveKots.forEach((kot: PmsKotRecord) => {
      if (kot.status !== 'Cancelled' && Array.isArray(kot.items)) {
        kot.items.forEach((it: KotItem) => {
          const key = it.itemName.toLowerCase().trim();
          if (itemMap.has(key)) {
            const entry = itemMap.get(key)!;
            entry.qty += it.qty;
            entry.amount += (it.rate || entry.rate) * it.qty;
          } else {
            itemMap.set(key, {
              sNo: itemMap.size + 1,
              itemName: it.itemName,
              category: 'Restaurant / Room Service',
              qty: it.qty,
              rate: it.rate || 100,
              amount: (it.rate || 100) * it.qty
            });
          }
        });
      }
    });

    return Array.from(itemMap.values());
  }""")

text = replace_method(text, 'static getDayEndReport(reportDate: string = \'19-07-2025\'): PmsDayEndReport {', """  static getDayEndReport(reportDate?: string): PmsDayEndReport {
    const activeDate = reportDate || this.getBusinessDate();
    const matchDate = (d1?: string, d2?: string) => {
      if (!d1 || !d2) return false;
      const c1 = d1.trim().replace(/\\//g, '-');
      const c2 = d2.trim().replace(/\\//g, '-');
      if (c1 === c2) return true;
      const p1 = c1.split('-');
      const p2 = c2.split('-');
      if (p1.length === 3 && p2.length === 3) {
        if ((p1[2].length === 4 && p2[2].length === 2) || (p1[2].length === 2 && p2[2].length === 4)) {
          return p1[0] === p2[0] && p1[1] === p2[1] && (p1[2].slice(-2) === p2[2].slice(-2));
        }
      }
      return false;
    };

    const cashEntries: PmsDayEndLedgerEntry[] = [];
    const onlineEntries: PmsDayEndLedgerEntry[] = [];
    const cardEntries: PmsDayEndLedgerEntry[] = [];

    const checkouts = this.getCheckouts();
    checkouts.forEach((co: PmsCheckOutDetail) => {
      if (matchDate(co.checkOutDate, activeDate)) {
        const mode = (co.paymentMode || 'Cash').toLowerCase();
        const entry: PmsDayEndLedgerEntry = {
          date: activeDate,
          type: 'Check_Out',
          accountName: co.paymentMode || 'Cash',
          remark: `Check_out/${co.invoiceNo}/Room-${co.roomNo}`,
          debit: co.netPayable,
          credit: 0,
          balance: 0
        };
        if (mode.includes('cash')) cashEntries.push(entry);
        else if (mode.includes('online') || mode.includes('upi')) onlineEntries.push(entry);
        else if (mode.includes('card')) cardEntries.push(entry);
      }
    });

    const receipts = this.getReceipts();
    receipts.forEach((r: PmsReceiptRecord) => {
      if (matchDate(r.date, activeDate)) {
        const mode = (r.paymentMode || 'Cash').toLowerCase();
        const entry: PmsDayEndLedgerEntry = {
          date: activeDate,
          type: 'Receipts',
          accountName: r.accountName,
          remark: r.remark || `Receipt #${r.receiptNo}`,
          debit: r.amount,
          credit: 0,
          balance: 0
        };
        if (mode.includes('cash')) cashEntries.push(entry);
        else if (mode.includes('online') || mode.includes('upi')) onlineEntries.push(entry);
        else if (mode.includes('card')) cardEntries.push(entry);
      }
    });

    const payments = this.getPayments();
    payments.forEach((p: PmsPaymentRecord) => {
      if (matchDate(p.date, activeDate)) {
        const mode = (p.paymentMode || 'Cash').toLowerCase();
        const entry: PmsDayEndLedgerEntry = {
          date: activeDate,
          type: 'Payment',
          accountName: p.accountName,
          remark: p.remark || `Payment #${p.voucherNo}`,
          debit: 0,
          credit: p.amount,
          balance: 0
        };
        if (mode.includes('cash')) cashEntries.push(entry);
        else if (mode.includes('online') || mode.includes('upi')) onlineEntries.push(entry);
        else if (mode.includes('card')) cardEntries.push(entry);
      }
    });

    const foodBills = this.getFoodBills();
    foodBills.forEach((fb: any) => {
      if (matchDate(fb.date, activeDate)) {
        const mode = (fb.paymentMode || 'Cash').toLowerCase();
        const entry: PmsDayEndLedgerEntry = {
          date: activeDate,
          type: 'Foodbill',
          accountName: fb.paymentMode || 'Cash',
          remark: `${fb.billNo || 'Food Bill'} - ${fb.roomNo || fb.tableNo || ''}`,
          debit: fb.netBillAmount || fb.totalAmount || 0,
          credit: 0,
          balance: 0
        };
        if (mode.includes('cash')) cashEntries.push(entry);
        else if (mode.includes('online') || mode.includes('upi')) onlineEntries.push(entry);
        else if (mode.includes('card')) cardEntries.push(entry);
      }
    });

    let cashRunning = 0;
    cashEntries.forEach(e => {
      cashRunning += (e.debit - e.credit);
      e.balance = cashRunning;
    });

    let onlineRunning = 0;
    onlineEntries.forEach(e => {
      onlineRunning += (e.debit - e.credit);
      e.balance = onlineRunning;
    });

    let cardRunning = 0;
    cardEntries.forEach(e => {
      cardRunning += (e.debit - e.credit);
      e.balance = cardRunning;
    });

    const groups: PmsDayEndAccountGroup[] = [
      {
        accountName: 'Cash',
        date: activeDate,
        entries: cashEntries,
        totalDebit: cashEntries.reduce((s, e) => s + e.debit, 0),
        totalCredit: cashEntries.reduce((s, e) => s + e.credit, 0),
        closingBalance: cashRunning
      },
      {
        accountName: 'Online',
        date: activeDate,
        entries: onlineEntries,
        totalDebit: onlineEntries.reduce((s, e) => s + e.debit, 0),
        totalCredit: onlineEntries.reduce((s, e) => s + e.credit, 0),
        closingBalance: onlineRunning
      },
      {
        accountName: 'Card',
        date: activeDate,
        entries: cardEntries,
        totalDebit: cardEntries.reduce((s, e) => s + e.debit, 0),
        totalCredit: cardEntries.reduce((s, e) => s + e.credit, 0),
        closingBalance: cardRunning
      }
    ];

    const grandTotalDebit = groups.reduce((s, g) => s + g.totalDebit, 0);
    const grandTotalCredit = groups.reduce((s, g) => s + g.totalCredit, 0);

    return {
      reportDate: activeDate,
      hotelName: 'SRI SAI VASUDEV RESIDENCY',
      address: 'Near Andhra Bank, New Colony, Rayagada, Odisha - 765001',
      phone: '+91 94402 89999',
      email: 'reservations@hotelsai-vasudev.com',
      generatedAt: new Date().toLocaleTimeString('en-IN'),
      groups,
      grandTotalDebit,
      grandTotalCredit,
      cashInHand: cashRunning
    };
  }""")

text = replace_method(text, 'static getGuestLog(): PmsGuestLogEntry[] {', """  static getGuestLog(): PmsGuestLogEntry[] {
    const guestMap = new Map<string, PmsGuestLogEntry>();

    const checkouts = this.getCheckouts();
    checkouts.forEach((co: PmsCheckOutDetail) => {
      if (!co.guestName) return;
      const key = co.guestName.toLowerCase().trim();
      if (guestMap.has(key)) {
        const g = guestMap.get(key)!;
        g.numberOfVisits += 1;
        g.totalAmount += (Number(co.netPayable) || 0);
        g.lastVisitDate = co.checkOutDate;
        g.vipTier = g.totalAmount > 50000 ? 'Platinum' : g.totalAmount > 20000 ? 'Gold' : 'Silver';
      } else {
        guestMap.set(key, {
          sNo: guestMap.size + 1,
          guestName: co.guestName,
          phone: co.guestPhone || '',
          city: co.city || co.addressLine1 || 'Rayagada',
          numberOfVisits: 1,
          totalAmount: Number(co.netPayable) || 0,
          lastVisitDate: co.checkOutDate,
          vipTier: (Number(co.netPayable) || 0) > 50000 ? 'Platinum' : (Number(co.netPayable) || 0) > 20000 ? 'Gold' : 'Bronze'
        });
      }
    });

    const checkIns = this.getCheckIns();
    checkIns.forEach(ci => {
      if (!ci.guestName) return;
      const key = ci.guestName.toLowerCase().trim();
      if (!guestMap.has(key)) {
        guestMap.set(key, {
          sNo: guestMap.size + 1,
          guestName: ci.guestName,
          phone: ci.mobile || '',
          city: ci.city || 'Rayagada',
          numberOfVisits: 1,
          totalAmount: Number(ci.advancePaid) || 0,
          lastVisitDate: ci.checkInDate,
          vipTier: 'Bronze'
        });
      }
    });

    return Array.from(guestMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }""")

text = replace_method(text, 'static getItemWiseStock(itemName: string = \'Boondi Raita\', fromDate: string = \'01-07-2025\', toDate: string = \'19-07-2025\'): PmsItemStockReport {', """  static getItemWiseStock(itemName: string = 'Paneer', _fromDate?: string, _toDate?: string): PmsItemStockReport {
    const dynamicEntries: PmsItemStockLedgerEntry[] = [];
    const initialBalance = 0;

    const purchases = this.getPurchases();
    purchases.forEach(p => {
      p.items.forEach(itm => {
        if (itm.itemName.toLowerCase().includes(itemName.toLowerCase())) {
          dynamicEntries.push({
            date: p.billDate,
            transactionType: 'Stock In (Purchase)',
            remark: `${p.billNo} - ${p.accountName}`,
            stockIn: itm.qty,
            stockOut: 0,
            balance: 0
          });
        }
      });
    });

    const transfers = this.getStockTransfers();
    transfers.forEach(st => {
      st.items?.forEach(itm => {
        if (itm.itemName.toLowerCase().includes(itemName.toLowerCase())) {
          dynamicEntries.push({
            date: st.date,
            transactionType: 'Stock Transfer',
            remark: `${st.fromGodown} -> ${st.toGodown}`,
            stockIn: 0,
            stockOut: itm.qty,
            balance: 0
          });
        }
      });
    });

    const kots = this.getKots();
    kots.forEach(k => {
      if (k.status !== 'Cancelled' && Array.isArray(k.items)) {
        k.items.forEach(it => {
          if (it.itemName && it.itemName.toLowerCase().includes(itemName.toLowerCase())) {
            dynamicEntries.push({
              date: k.date || new Date().toISOString().split('T')[0],
              transactionType: 'Restaurant / Room Consumption',
              remark: `${k.kotNo} (${k.roomNo || k.tableNo || ''})`,
              stockIn: 0,
              stockOut: it.qty,
              balance: 0
            });
          }
        });
      }
    });

    let running = initialBalance;
    dynamicEntries.forEach(e => {
      running = running + e.stockIn - e.stockOut;
      e.balance = running;
    });

    const totalStockIn = dynamicEntries.reduce((s, e) => s + e.stockIn, 0);
    const totalStockOut = dynamicEntries.reduce((s, e) => s + e.stockOut, 0);

    return {
      itemName,
      itemCategory: 'F&B',
      unit: 'Unit',
      fromDate: _fromDate || '01-05-2025',
      toDate: _toDate || '16-06-2025',
      openingBalance: initialBalance,
      entries: dynamicEntries,
      totalStockIn,
      totalStockOut,
      closingBalance: running
    };
  }""")

text = replace_method(text, 'static getShiftHandoverData(shiftDate: string = \'19-07-2025\', shiftType: \'Morning\' | \'Evening\' | \'Night\' = \'Morning\'): PmsShiftHandoverRecord {', """  static getShiftHandoverData(shiftDate?: string, shiftType: 'Morning' | 'Evening' | 'Night' = 'Morning'): PmsShiftHandoverRecord {
    const activeDate = shiftDate || this.getBusinessDate();
    const dayEnd = this.getDayEndReport(activeDate);
    const currentUser = this.getCurrentUser();
    const cashGroup = dayEnd.groups.find(g => g.accountName === 'Cash');
    const onlineGroup = dayEnd.groups.find(g => g.accountName === 'Online');
    const cardGroup = dayEnd.groups.find(g => g.accountName === 'Card');

    return {
      shiftId: `SHIFT/${activeDate.replace(/-/g, '')}/${shiftType.toUpperCase()}`,
      shiftDate: activeDate,
      shiftTime: shiftType === 'Morning' ? '07:00 AM - 03:00 PM' : shiftType === 'Evening' ? '03:00 PM - 11:00 PM' : '11:00 PM - 07:00 AM',
      userName: currentUser.userName || 'Front Desk',
      userEmail: currentUser.emailId || 'admin@hotelsai-vasudev.com',
      shiftType,
      openingDrawerCash: 0,
      roomCashCollected: cashGroup?.entries.filter(e => e.type === 'Check_Out').reduce((s, e) => s + e.debit, 0) || 0,
      foodCashCollected: cashGroup?.entries.filter(e => e.type === 'Foodbill').reduce((s, e) => s + e.debit, 0) || 0,
      advanceCashCollected: cashGroup?.entries.filter(e => e.type === 'Receipts').reduce((s, e) => s + e.debit, 0) || 0,
      expensesPaidFromDrawer: cashGroup?.entries.filter(e => e.type === 'Payment').reduce((s, e) => s + e.credit, 0) || 0,
      netPhysicalCashInDrawer: dayEnd.cashInHand || 0,
      onlineUpiVerified: onlineGroup?.closingBalance || 0,
      cardSwipeVerified: cardGroup?.closingBalance || 0,
      creditAccountsAdded: 0,
      totalTransactionsHandled: dayEnd.groups.reduce((s, g) => s + g.entries.length, 0),
      handoverToUser: 'Next Shift Incharge',
      handoverNotes: 'Shift reconciled cleanly with PMS ledger.',
      status: 'Pending Verification'
    };
  }""")

# Clean up initCloudStore array checks
text = re.sub(r'if \(state\.([a-zA-Z0-9_]+) && state\.\1\.length > 0\)', r'if (Array.isArray(state.\1))', text)

# Clean getMyCheckOutRegister default demo user
text = text.replace("static getMyCheckOutRegister(_userEmail: string = 'demo4@gmail.com'", "static getMyCheckOutRegister(_userEmail?: string")

# Clean DEFAULT_ROOMG_PRICING
text = text.replace("demoUser: 'demo4@gmail.com',", "demoUser: 'admin@hotelsai-vasudev.com',")
text = text.replace("demoPassword: '12345678',", "demoPassword: '••••••••',")
text = text.replace("demoUrl: 'pms.hotelsai-vasudev.com',", "demoUrl: 'sai-vasudev-residency.pages.dev',")
text = text.replace("salesPhones: ['7999663696', '8871702803'],", "salesPhones: ['+91 94402 89999'],")
text = text.replace("salesEmail: 'datahouseerp@gmail.com',", "salesEmail: 'reservations@hotelsai-vasudev.com',")
text = text.replace("supportEmail: 'datahouseerp@gmail.com',", "supportEmail: 'reservations@hotelsai-vasudev.com',")
text = text.replace("officialWebsite: 'https://datahouseerp.com'", "officialWebsite: 'https://sai-vasudev-residency.pages.dev'")

# Remove canonical Video 34 baseline adjustments in getConsolidatedStockReport
canonical_v34_block = r'    // Canonical Video 34 baseline adjustments[\s\S]*?w\.godownBreakdown\[\'Consume\'\] = \{ stockIn: 50, stockOut: 0, closingStock: 50 \};\s*\}\s*\}'
text = re.sub(canonical_v34_block, '', text)

# Remove fallback movements timeline in getStockAuditMovements
fallback_timeline_block = r'    // If no explicit movement found in live transactions, provide canonical Video 34 timeline[\s\S]*?return movements;'
text = re.sub(fallback_timeline_block, '    return movements;', text)

with open(TARGET_PATH, 'w', encoding='utf-8') as f:
    f.write(text)

print("Successfully written clean pmsStore.ts!")
