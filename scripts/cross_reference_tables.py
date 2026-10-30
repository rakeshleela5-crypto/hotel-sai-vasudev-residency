import json

with open('backend_inventory.json', 'r') as f:
    backend = json.load(f)

models = backend['models']
endpoints = backend['endpoints']

# Let's list table names and model classes
table_map = {}
for m_name, m_data in models.items():
    t_name = m_data['table_name']
    table_map[t_name] = {
        'model_class': m_name,
        'columns': m_data['columns']
    }

# Endpoint paths list
endpoint_paths = set((ep['method'], ep['path']) for ep in endpoints)

print(f"Total tables: {len(table_map)}")
print(f"Total endpoints: {len(endpoint_paths)}")

STORAGE_KEYS = [
  ("ROOMS", "svr_pms_rooms", "PmsRoom"),
  ("ROOM_TYPES", "svr_pms_room_types", "PmsRoomType"),
  ("TABLES", "svr_pms_tables", "PmsDiningTable"),
  ("GST_MASTERS", "svr_pms_gst_masters", "PmsGstMaster"),
  ("BUSINESS_SOURCES", "svr_pms_business_sources", "PmsBusinessSource"),
  ("VOUCHER_TYPES", "svr_pms_voucher_types", "PmsVoucherType"),
  ("MENU_ITEMS", "svr_pms_menu_items", "MenuItem"),
  ("BOOKINGS", "svr_pms_bookings", "PmsBooking"),
  ("KOTS", "svr_pms_kots", "PmsKotRecord"),
  ("CHECKOUTS", "svr_pms_checkouts", "PmsCheckOutDetail"),
  ("ADVANCE_RECEIPTS", "svr_pms_advance_receipts", "PmsAdvanceReceipt"),
  ("BUSINESS_SETTINGS", "svr_pms_business_settings", "PmsBusinessSetting"),
  ("ROOM_SHIFTS", "svr_pms_room_shifts", "PmsRoomShiftRecord"),
  ("RECEIPTS", "svr_pms_receipts", "PmsReceiptRecord"),
  ("PARTY_ACCOUNTS", "svr_pms_party_accounts", "PmsPartyAccount"),
  ("PAYMENTS", "svr_pms_payments", "PmsPaymentRecord"),
  ("ITEM_GROUPS", "svr_pms_item_groups", "PmsItemGroup"),
  ("GODOWNS", "svr_pms_godowns", "PmsGodown"),
  ("PURCHASES", "svr_pms_purchases", "PmsPurchaseBill"),
  ("STOCK_TRANSFERS", "svr_pms_stock_transfers", "PmsStockTransfer"),
  ("ROLES", "svr_pms_roles", "PmsRole"),
  ("USERS", "svr_pms_users", "PmsUserAccount"),
  ("PROPERTIES", "svr_pms_properties", "PmsChainProperty"),
  ("CURRENT_USER", "svr_pms_current_user", "PmsUserAccount"),
  ("CURRENT_PROPERTY", "svr_pms_current_property", "PmsChainProperty"),
  ("WHATSAPP_TEMPLATES", "svr_pms_whatsapp_templates", "PmsWhatsAppTemplate"),
  ("WHATSAPP_CONFIG", "svr_pms_whatsapp_config", "PmsWhatsAppConfig"),
  ("WHATSAPP_LOGS", "svr_pms_whatsapp_logs", "PmsWhatsAppLog"),
  ("SUPPORT_TICKETS", "svr_pms_support_tickets", "PmsSupportTicket"),
  ("DEMO_REQUESTS", "svr_pms_demo_requests", "PmsDemoRequest"),
  ("COMMISSION_AGENTS", "svr_pms_commission_agents", "PmsCommissionAgent"),
  ("AGENT_COMMISSIONS", "svr_pms_agent_commissions", "PmsAgentCommissionBooking"),
  ("AGENT_PAYOUT_VOUCHERS", "svr_pms_agent_payout_vouchers", "PmsAgentPayoutVoucher"),
  ("LIQUOR_UNITS", "svr_pms_liquor_units", "PmsLiquorUnit"),
  ("LIQUOR_BRANDS", "svr_pms_liquor_brands", "PmsLiquorBrand"),
  ("LIQUOR_ITEMS", "svr_pms_liquor_items", "PmsLiquorItem"),
  ("LIQUOR_STOCKS", "svr_pms_liquor_stocks", "PmsBrandWiseLiquorStock"),
  ("BAR_INVOICES", "svr_pms_bar_invoices", "PmsBarInvoice"),
  ("NO_DISCOUNT_CONFIG", "svr_pms_no_discount_config", "PmsNoDiscountConfig"),
  ("DISCOUNT_AUDIT_LOGS", "svr_pms_discount_audit_logs", "PmsDiscountAuditRecord"),
  ("HOTEL_ASSETS", "svr_pms_hotel_assets", "PmsHotelAssetLinenRecord"),
  ("BANQUET_VENUES", "svr_pms_banquet_venues", "PmsBanquetVenue"),
  ("BANQUET_BOOKINGS", "svr_pms_banquet_bookings", "PmsBanquetBooking"),
  ("LOCKERS", "svr_pms_lockers", "PmsLocker"),
  ("OTHER_CHARGES", "svr_pms_other_charges", "PmsOtherCharge"),
  ("EXPENSES", "svr_pms_expenses", "PmsExpenseRecord"),
  ("HOUSEKEEPING", "svr_pms_housekeeping", "PmsHousekeepingRecord"),
  ("NIGHT_AUDITS", "svr_pms_night_audits", "PmsNightAuditRecord"),
  ("FOLIO_PAYMENTS", "svr_pms_folio_payments", "PmsFolioPayment"),
  ("FOLIO_DISCOUNTS", "svr_pms_folio_discounts", "PmsFolioDiscount"),
  ("BUSINESS_DATE", "svr_pms_business_date", "string"),
  ("JOURNAL_ENTRIES", "svr_pms_journal_entries", "PmsJournalEntry"),
  ("KOT_VOID_AUDIT", "svr_pms_kot_void_audit", "KotVoidAuditLog"),
  ("CHECKINS", "svr_pms_checkins", "PmsCheckInRecord"),
  ("FOOD_BILLS", "svr_pms_foodbills", "PmsFoodBill"),
  ("COMPANY_INFO", "pms_company_info", "PmsCompanyInfo"),
  ("TABLE_SHIFTS", "svr_pms_table_shifts", "PmsTableShiftRecord"),
  ("BILL_FORMAT", "pms_default_bill_format", "string"),
  ("TABLE_SESSIONS", "svr_pms_table_sessions", "TableSession"),
  ("KEY_CARDS", "svr_pms_rfid_keycards", "RfidKeyCard"),
  ("HOUSEKEEPING_DISCREPANCIES", "svr_pms_hk_discrepancies", "HousekeepingDiscrepancy"),
  ("GROUP_BOOKINGS", "svr_pms_group_bookings", "GroupBookingMetadata")
]

print("\n--- CHECKING TABLES FOR STORAGE KEYS ---")
for key_name, storage_key, ts_type in STORAGE_KEYS:
    # Look for matching table
    matched_table = None
    for t_name in table_map:
        if key_name.lower() in t_name or t_name in key_name.lower() or t_name.replace('_', '') in key_name.lower().replace('_', ''):
            matched_table = t_name
            break
    status = f"MATCH: {matched_table} ({table_map[matched_table]['model_class']})" if matched_table else "MISSING OR MISNAMED"
    print(f"{key_name:<25} ({storage_key:<28}) -> {status}")
