import os
import re

PMS_STORE_PATH = 'src/services/pmsStore.ts'

with open(PMS_STORE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update SCHEMA_VERSION
content = re.sub(
    r"static readonly SCHEMA_VERSION = '[^']+';",
    "static readonly SCHEMA_VERSION = '20261105_svr_production_v1';",
    content
)

# 2. Clean INITIAL_ROOMS (Make all 18 rooms vacant, remove currentGuest, foodAmount = 0)
def clean_rooms_block(text):
    match = re.search(r'export const INITIAL_ROOMS: PmsRoom\[\] = \[\s*([\s\S]*?)\n\];', text)
    if not match:
        print("INITIAL_ROOMS not found!")
        return text
    
    # We will sanitize the rooms by removing currentGuest blocks and setting status to 'vacant', foodAmount: 0
    rooms_text = match.group(1)
    # Remove currentGuest: { ... }, blocks
    cleaned_rooms = re.sub(r'currentGuest:\s*\{[\s\S]*?\},\n', '', rooms_text)
    # Replace status: 'occupied' / 'dirty' / 'booked' with status: 'vacant'
    cleaned_rooms = re.sub(r"status:\s*'(?:occupied|dirty|booked)'", "status: 'vacant'", cleaned_rooms)
    # Replace foodAmount: [0-9.]+ with foodAmount: 0
    cleaned_rooms = re.sub(r"foodAmount:\s*[0-9.]+", "foodAmount: 0", cleaned_rooms)
    # Priority Normal
    cleaned_rooms = re.sub(r"priority:\s*'[^']+'", "priority: 'Normal'", cleaned_rooms)
    
    replacement = f"export const INITIAL_ROOMS: PmsRoom[] = [\n{cleaned_rooms}\n];"
    return text[:match.start()] + replacement + text[match.end():]

content = clean_rooms_block(content)

# 3. Clean INITIAL_PARTY_ACCOUNTS
new_party_accounts = """export const INITIAL_PARTY_ACCOUNTS: PmsPartyAccount[] = [
  { id: 'pa-1', name: 'Cash', category: 'General', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-2', name: 'Online', category: 'General', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-3', name: 'Card', category: 'General', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-4', name: 'Purchase', category: 'General', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-5', name: 'Bank - SBI', category: 'Bank', balance: 0.00, balanceType: 'Dr' },
  { id: 'pa-6', name: 'UPI / QR', category: 'Bank', balance: 0.00, balanceType: 'Dr' }
];"""
content = re.sub(r'export const INITIAL_PARTY_ACCOUNTS: PmsPartyAccount\[\] = \[\s*[\s\S]*?\n\];', new_party_accounts, content)

# 4. Clean INITIAL_RECEIPTS to []
content = re.sub(r'export const INITIAL_RECEIPTS: PmsReceiptRecord\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_RECEIPTS: PmsReceiptRecord[] = [];', content)

# 5. Clean INITIAL_PAYMENTS to []
content = re.sub(r'export const INITIAL_PAYMENTS: PmsPaymentRecord\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_PAYMENTS: PmsPaymentRecord[] = [];', content)

# 6. Clean INITIAL_PURCHASES to []
content = re.sub(r'export const INITIAL_PURCHASES: PmsPurchaseBill\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_PURCHASES: PmsPurchaseBill[] = [];', content)

# 7. Clean INITIAL_STOCK_TRANSFERS to []
content = re.sub(r'export const INITIAL_STOCK_TRANSFERS: PmsStockTransfer\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_STOCK_TRANSFERS: PmsStockTransfer[] = [];', content)

# 8. Clean INITIAL_BOOKINGS to []
content = re.sub(r'export const INITIAL_BOOKINGS: PmsBooking\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_BOOKINGS: PmsBooking[] = [];', content)

# 9. Clean INITIAL_USER_ACCOUNTS (keep real accounts: admin, Rakesh Nandyala, Front Desk)
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
content = re.sub(r'export const INITIAL_USER_ACCOUNTS: PmsUserAccount\[\] = \[\s*[\s\S]*?\n\];', new_user_accounts, content)

# 10. Clean INITIAL_CHAIN_PROPERTIES (keep only single Rayagada property)
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
content = re.sub(r'export const INITIAL_CHAIN_PROPERTIES: PmsChainProperty\[\] = \[\s*[\s\S]*?\n\];', new_chain_properties, content)

# 11. Clean INITIAL_WHATSAPP_LOGS to []
content = re.sub(r'export const INITIAL_WHATSAPP_LOGS: PmsWhatsAppLog\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_WHATSAPP_LOGS: PmsWhatsAppLog[] = [];', content)

# 12. Clean INITIAL_SUPPORT_TICKETS to []
content = re.sub(r'export const INITIAL_SUPPORT_TICKETS: PmsSupportTicket\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_SUPPORT_TICKETS: PmsSupportTicket[] = [];', content)

# 13. Clean INITIAL_BANQUET_BOOKINGS to []
content = re.sub(r'export const INITIAL_BANQUET_BOOKINGS: PmsBanquetBooking\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_BANQUET_BOOKINGS: PmsBanquetBooking[] = [];', content)

# 14. Clean INITIAL_EXPENSES to []
content = re.sub(r'export const INITIAL_EXPENSES: PmsExpenseRecord\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_EXPENSES: PmsExpenseRecord[] = [];', content)

# 15. Clean INITIAL_HOUSEKEEPING (all 18 rooms Vacant Clean with no mock remarks)
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
content = re.sub(r'export const INITIAL_HOUSEKEEPING: PmsHousekeepingRecord\[\] = \[\s*[\s\S]*?\n\];', new_housekeeping, content)

# 16. Clean INITIAL_NIGHT_AUDITS to []
content = re.sub(r'export const INITIAL_NIGHT_AUDITS: PmsNightAuditRecord\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_NIGHT_AUDITS: PmsNightAuditRecord[] = [];', content)

# 17. Clean INITIAL_FOLIO_PAYMENTS to []
content = re.sub(r'export const INITIAL_FOLIO_PAYMENTS: PmsFolioPayment\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_FOLIO_PAYMENTS: PmsFolioPayment[] = [];', content)

# 18. Clean INITIAL_AGENT_COMMISSIONS to []
content = re.sub(r'export const INITIAL_AGENT_COMMISSIONS: PmsAgentCommissionBooking\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_AGENT_COMMISSIONS: PmsAgentCommissionBooking[] = [];', content)

# 19. Clean INITIAL_AGENT_PAYOUT_VOUCHERS to []
content = re.sub(r'export const INITIAL_AGENT_PAYOUT_VOUCHERS: PmsAgentPayoutVoucher\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_AGENT_PAYOUT_VOUCHERS: PmsAgentPayoutVoucher[] = [];', content)

# 20. Clean INITIAL_LIQUOR_STOCKS to []
content = re.sub(r'export const INITIAL_LIQUOR_STOCKS: PmsBrandWiseLiquorStock\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_LIQUOR_STOCKS: PmsBrandWiseLiquorStock[] = [];', content)

# 21. Clean INITIAL_BAR_INVOICES to []
content = re.sub(r'export const INITIAL_BAR_INVOICES: PmsBarInvoice\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_BAR_INVOICES: PmsBarInvoice[] = [];', content)

# 22. Clean INITIAL_DISCOUNT_AUDIT_LOGS to []
content = re.sub(r'export const INITIAL_DISCOUNT_AUDIT_LOGS: PmsDiscountAuditRecord\[\] = \[\s*[\s\S]*?\n\];', 'export const INITIAL_DISCOUNT_AUDIT_LOGS: PmsDiscountAuditRecord[] = [];', content)

# 23. Update resetToDemoSeedData() to clean production reset
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
    localStorage.setItem(STORAGE_KEYS.CHAIN_PROPERTIES, JSON.stringify(INITIAL_CHAIN_PROPERTIES));
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
content = re.sub(r'  static resetToDemoSeedData\(\): void \{[\s\S]*?\n  \}', new_reset_method, content, count=1)

# 24. Replace getCheckIns()
new_get_checkins = """  static getCheckIns(): import('../types/pmsModels').PmsCheckIn[] {
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
  }"""
content = re.sub(r'  static getCheckIns\(\): import\(\'../types/pmsModels\'\)\.PmsCheckIn\[\] \{[\s\S]*?\n  \}', new_get_checkins, content, count=1)

# 25. Replace getCheckouts()
new_get_checkouts = """  static getCheckouts(): PmsCheckOutDetail[] {
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
  }"""
content = re.sub(r'  static getCheckouts\(\): PmsCheckOutDetail\[\] \{[\s\S]*?\n  \}', new_get_checkouts, content, count=1)

# 26. Replace getKots()
new_get_kots = """  static getKots(): PmsKotRecord[] {
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
  }"""
content = re.sub(r'  static getKots\(\): PmsKotRecord\[\] \{[\s\S]*?\n  \}', new_get_kots, content, count=1)

# 27. Replace getFoodBills()
new_get_foodbills = """  static getFoodBills(): import('../types/pmsModels').PmsFoodBill[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FOOD_BILLS) || localStorage.getItem('hotel_pms_foodbills') || localStorage.getItem('hotel_pms_food_bills');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }"""
content = re.sub(r'  static getFoodBills\(\): import\(\'../types/pmsModels\'\)\.PmsFoodBill\[\] \{[\s\S]*?\n  \}', new_get_foodbills, content, count=1)

# 28. Replace getAdvanceReceipts()
new_get_advance_receipts = """  static getAdvanceReceipts(): PmsAdvanceReceipt[] {
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
  }"""
content = re.sub(r'  static getAdvanceReceipts\(\): PmsAdvanceReceipt\[\] \{[\s\S]*?\n  \}', new_get_advance_receipts, content, count=1)

# 29. Replace getJournalEntries()
new_get_journal = """  static getJournalEntries(): import('../types/pmsModels').PmsJournalEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }"""
content = re.sub(r'  static getJournalEntries\(\): import\(\'../types/pmsModels\'\)\.PmsJournalEntry\[\] \{[\s\S]*?\n  \}', new_get_journal, content, count=1)

# 30. Replace getGroupBookings()
new_get_groups = """  static getGroupBookings(): GroupBookingMetadata[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GROUP_BOOKINGS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }"""
content = re.sub(r'  static getGroupBookings\(\): GroupBookingMetadata\[\] \{[\s\S]*?\n  \}', new_get_groups, content, count=1)

# 31. Replace getLedgerAccountOptions()
new_ledger_options = """  static getLedgerAccountOptions(): { id: string; name: string; category: string; phone?: string }[] {
    const parties = this.getPartyAccounts();
    return parties.map(p => ({
      id: p.name,
      name: p.name,
      category: p.category || 'General',
      phone: p.mobile
    }));
  }"""
content = re.sub(r'  static getLedgerAccountOptions\(\): \{ id: string; name: string; category: string; phone\?: string \}\[\] \{[\s\S]*?\n  \}', new_ledger_options, content, count=1)

# 32. Replace getB2BReport()
new_b2b_report = """  static getB2BReport(fromDate?: string, toDate?: string): PmsB2BInvoiceRecord[] {
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
  }"""
content = re.sub(r'  static getB2BReport\(fromDate\?: string, toDate\?: string\): PmsB2BInvoiceRecord\[\] \{[\s\S]*?\n  \}', new_b2b_report, content, count=1)

# 33. Replace getB2CReport()
new_b2c_report = """  static getB2CReport(fromDate?: string, toDate?: string): PmsB2CInvoiceRecord[] {
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
  }"""
content = re.sub(r'  static getB2CReport\(fromDate\?: string, toDate\?: string\): PmsB2CInvoiceRecord\[\] \{[\s\S]*?\n  \}', new_b2c_report, content, count=1)

# 34. Replace getConsolidatedGstReport()
new_gst_report = """  static getConsolidatedGstReport(fromDate?: string, toDate?: string): PmsConsolidatedGstItem[] {
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
  }"""
content = re.sub(r'  static getConsolidatedGstReport\(fromDate\?: string, toDate\?: string\): PmsConsolidatedGstItem\[\] \{[\s\S]*?\n  \}', new_gst_report, content, count=1)

# 35. Replace getOutstandingAccounts()
new_outstanding = """  static getOutstandingAccounts(balanceFilter: 'Dr' | 'Cr' | 'all' = 'all'): PmsOutstandingAccount[] {
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
  }"""
content = re.sub(r'  static getOutstandingAccounts\(balanceFilter: \'Dr\' \| \'Cr\' \| \'all\' = \'all\'\): PmsOutstandingAccount\[\] \{[\s\S]*?\n  \}', new_outstanding, content, count=1)

# 36. Replace getItemWiseSalesReport()
new_item_sales = """  static getItemWiseSalesReport(_fromDate?: string, _toDate?: string): PmsItemWiseSale[] {
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
  }"""
content = re.sub(r'  static getItemWiseSalesReport\(_fromDate\?: string, _toDate\?: string\): PmsItemWiseSale\[\] \{[\s\S]*?\n  \}', new_item_sales, content, count=1)

# 37. Replace getDayEndReport()
new_day_end = """  static getDayEndReport(reportDate?: string): PmsDayEndReport {
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

    // Live Checkouts
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

    // Live Receipts
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

    // Live Payments
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

    // Live Food Bills
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
        openingBalance: 0,
        entries: cashEntries,
        totalDebit: cashEntries.reduce((s, e) => s + e.debit, 0),
        totalCredit: cashEntries.reduce((s, e) => s + e.credit, 0),
        closingBalance: cashRunning
      },
      {
        accountName: 'Online',
        openingBalance: 0,
        entries: onlineEntries,
        totalDebit: onlineEntries.reduce((s, e) => s + e.debit, 0),
        totalCredit: onlineEntries.reduce((s, e) => s + e.credit, 0),
        closingBalance: onlineRunning
      },
      {
        accountName: 'Card',
        openingBalance: 0,
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
      accountGroups: groups,
      grandTotalDebit,
      grandTotalCredit,
      closingCashOnHand: cashRunning,
      closingOnlineBalance: onlineRunning,
      closingCardSettlement: cardRunning
    };
  }"""
content = re.sub(r'  static getDayEndReport\(reportDate: string = \'19-07-2025\'\): PmsDayEndReport \{[\s\S]*?\n  \}', new_day_end, content, count=1)

# 38. Replace getGuestLog()
new_guest_log = """  static getGuestLog(): PmsGuestLogEntry[] {
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
  }"""
content = re.sub(r'  static getGuestLog\(\): PmsGuestLogEntry\[\] \{[\s\S]*?\n  \}', new_guest_log, content, count=1)

# 39. Replace getItemWiseStock()
new_item_stock = """  static getItemWiseStock(itemName: string = 'Paneer', fromDate?: string, toDate?: string): PmsItemStockReport {
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
      if (st.itemName.toLowerCase().includes(itemName.toLowerCase())) {
        dynamicEntries.push({
          date: st.date,
          transactionType: 'Stock Transfer',
          remark: `${st.fromGodown} -> ${st.toGodown}`,
          stockIn: 0,
          stockOut: st.qty,
          balance: 0
        });
      }
    });

    const kots = this.getKots();
    kots.forEach(k => {
      if (k.status !== 'Cancelled' && Array.isArray(k.items)) {
        k.items.forEach(it => {
          if (it.itemName.toLowerCase().includes(itemName.toLowerCase())) {
            dynamicEntries.push({
              date: k.date,
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
      initialBalance,
      entries: dynamicEntries,
      totalStockIn,
      totalStockOut,
      closingStock: running
    };
  }"""
content = re.sub(r'  static getItemWiseStock\(itemName: string = \'Boondi Raita\'[\s\S]*?\n  \}', new_item_stock, content, count=1)

# 40. Replace getShiftHandoverData()
new_shift_handover = """  static getShiftHandoverData(shiftDate?: string, shiftType: 'Morning' | 'Evening' | 'Night' = 'Morning'): PmsShiftHandoverRecord {
    const activeDate = shiftDate || this.getBusinessDate();
    const dayEnd = this.getDayEndReport(activeDate);

    return {
      shiftId: `SHIFT/${activeDate.replace(/-/g, '')}/${shiftType.toUpperCase()}`,
      shiftDate: activeDate,
      shiftTime: shiftType === 'Morning' ? '07:00 AM - 03:00 PM' : shiftType === 'Evening' ? '03:00 PM - 11:00 PM' : '11:00 PM - 07:00 AM',
      handoverStaff: this.getCurrentUser().userName || 'Front Desk',
      cashOnHand: dayEnd.closingCashOnHand || 0,
      upiOnlineReceived: dayEnd.closingOnlineBalance || 0,
      cardSettlementTotal: dayEnd.closingCardSettlement || 0,
      pendingCheckIns: this.getUnconfirmedBookings().length,
      roomsOccupied: this.getRooms().filter(r => r.status === 'occupied').length,
      handoverNotes: 'Shift reconciled cleanly with PMS ledger.',
      userEmail: this.getCurrentUser().emailId || 'admin@hotelsai-vasudev.com'
    };
  }"""
content = re.sub(r'  static getShiftHandoverData\(shiftDate: string = \'19-07-2025\'[\s\S]*?\n  \}', new_shift_handover, content, count=1)

# 41. Replace getPartyLedger()
new_party_ledger = """  static getPartyLedger(
    accountName: string,
    fromDate: string = '01-05-2025',
    toDate: string = '16-06-2025'
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
  }"""
content = re.sub(r'  static getPartyLedger\(\s*accountName: string[\s\S]*?\n  \}', new_party_ledger, content, count=1)

# 42. In initCloudStore(), ensure empty arrays [] from backend update localStorage correctly
def update_init_cloud_store(text):
    # Replace if (state.checkouts && state.checkouts.length > 0) with if (Array.isArray(state.checkouts))
    text = re.sub(r'if \(state\.([a-zA-Z0-9_]+) && state\.\1\.length > 0\)', r'if (Array.isArray(state.\1))', text)
    return text

content = update_init_cloud_store(content)

# 43. Remove Canonical Video 34 baseline adjustments in getConsolidatedStockReport
canonical_v34_block = r'    // Canonical Video 34 baseline adjustments[\s\S]*?w\.godownBreakdown\[\'Consume\'\] = \{ stockIn: 50, stockOut: 0, closingStock: 50 \};\s*\}\s*\}'
content = re.sub(canonical_v34_block, '', content)

# 44. In getStockAuditMovements, remove fallback timeline
fallback_timeline_block = r'    // If no explicit movement found in live transactions, provide canonical Video 34 timeline[\s\S]*?return movements;'
new_movements_return = '    return movements;'
content = re.sub(fallback_timeline_block, new_movements_return, content)

with open(PMS_STORE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully cleaned pmsStore.ts!")

