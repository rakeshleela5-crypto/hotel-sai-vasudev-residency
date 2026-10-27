import re

def generate_table():
    gaps = [
        {
            "file": "src/components/pms/RoomMasterModal.tsx",
            "modal": "Room Master & Inventory Modal",
            "bug": "PmsStore.addRoom, updateRoom, and deleteRoom mutate localStorage (STORAGE_KEYS.ROOMS) without calling hotelApi. Rooms added or deleted revert or desync across devices.",
            "missing_db": "Existing 'rooms' table lacks cascade handling on room deletions and audit log entry.",
            "required_endpoint": "POST /pms/rooms, PUT /pms/rooms/{id}, DELETE /pms/rooms/{id}"
        },
        {
            "file": "src/components/pms/TableMasterModal.tsx",
            "modal": "Restaurant Table Master Modal",
            "bug": "PmsStore.saveTable and deleteTable mutate localStorage (STORAGE_KEYS.TABLES) without calling hotelApi.",
            "missing_db": "Existing 'restaurant_tables' table lacks complete sync with frontend Table definition (active_session_id, capacity).",
            "required_endpoint": "POST /pms/restaurant/tables, DELETE /pms/restaurant/tables/{id}"
        },
        {
            "file": "src/components/pms/ShiftTableModal.tsx",
            "modal": "Restaurant Shift Table Modal",
            "bug": "PmsStore.shiftTable creates table shift records and reallocates KOTs only in localStorage (STORAGE_KEYS.TABLE_SHIFTS).",
            "missing_db": "Missing 'table_shifts' table in PostgreSQL (shift_id, from_table, to_table, transferred_kots, reason, shifted_by, timestamp).",
            "required_endpoint": "POST /pms/restaurant/table-shifts, GET /pms/restaurant/table-shifts"
        },
        {
            "file": "src/components/pms/FoodBillModal.tsx",
            "modal": "Restaurant Food Bill & Table Sessions",
            "bug": "PmsStore.saveTableSession and createOrAppendTableSession maintain open dining sessions only in localStorage (STORAGE_KEYS.TABLE_SESSIONS).",
            "missing_db": "Missing 'table_sessions' table (session_id, table_no, status, cumulative_items_json, cumulative_amount, start_time, closed_at).",
            "required_endpoint": "POST /pms/restaurant/table-sessions, GET /pms/restaurant/table-sessions/{table_no}"
        },
        {
            "file": "src/components/pms/UnconfirmedBookingsModal.tsx",
            "modal": "Unconfirmed Bookings Approval Modal",
            "bug": "handleConfirm calls PmsStore.confirmBooking which sets isConfirmed=true only in localStorage. Database booking remains unconfirmed.",
            "missing_db": "'bookings' table has is_confirmed column, but no atomic confirmation transition or log.",
            "required_endpoint": "PUT /pms/bookings/{booking_id}/confirm"
        },
        {
            "file": "src/components/pms/HousekeepingTrackerModal.tsx",
            "modal": "Housekeeping Discrepancy & Maintenance Logger",
            "bug": "PmsStore.recordHousekeepingDiscrepancy and resolveMaintenance modify localStorage only without syncing to backend.",
            "missing_db": "Missing 'housekeeping_discrepancies' table (discrepancy_id, room_no, front_desk_status, housekeeping_status, reported_by, remarks, resolved, created_at).",
            "required_endpoint": "POST /pms/housekeeping-discrepancies, GET /pms/housekeeping-discrepancies"
        },
        {
            "file": "src/components/pms/RfidKeyCardModal.tsx",
            "modal": "RFID Key Card Encoder & Extender Modal",
            "bug": "PmsStore.extendKeyCard and handleConfirmExtension update card expiration only in localStorage (STORAGE_KEYS.KEY_CARDS).",
            "missing_db": "Missing 'rfid_keycards' table (card_uuid, card_number, room_no, guest_name, check_in_time, valid_until, status, issued_by).",
            "required_endpoint": "POST /pms/key-cards, PUT /pms/key-cards/{card_number}/extend, GET /pms/key-cards"
        },
        {
            "file": "src/components/pms/CompanyBrandingModal.tsx",
            "modal": "Hotel Company Branding & Bill Format",
            "bug": "PmsStore.saveCompanyInfo and setDefaultBillFormat write to 'pms_company_info' and 'pms_default_bill_format' in localStorage.",
            "missing_db": "Missing 'hotel_company_info' table (property_name, address, gstin, phone, email, logo_url, seal_url, default_bill_format, terms_and_conditions).",
            "required_endpoint": "POST /pms/company-info, GET /pms/company-info"
        },
        {
            "file": "src/components/pms/PettyExpenseModal.tsx",
            "modal": "Petty Cash & Expense Register",
            "bug": "PmsStore.deleteExpense filters expense from localStorage array without executing backend delete. Database retains deleted expenses.",
            "missing_db": "'expenses' table exists in PostgreSQL, but endpoint DELETE /pms/expenses/{id} was not wired.",
            "required_endpoint": "DELETE /pms/expenses/{id}"
        },
        {
            "file": "src/components/pms/PurchaseEntryModal.tsx",
            "modal": "Inventory Purchase Entry Modal",
            "bug": "PmsStore.deletePurchase removes purchase from localStorage without executing backend deletion in PostgreSQL.",
            "missing_db": "'purchases' table exists in PostgreSQL, but DELETE /pms/purchases/{id} was missing.",
            "required_endpoint": "DELETE /pms/purchases/{id}"
        },
        {
            "file": "src/components/pms/PartyPaymentModal.tsx",
            "modal": "Party Ledger Settlement Modal",
            "bug": "PmsStore.settlePartyPayment recalculates party balance in localStorage without recording a formal settlement entry in PostgreSQL.",
            "missing_db": "Missing 'party_settlements' table or linkage to 'payments' / 'receipts' table for party accounts.",
            "required_endpoint": "POST /pms/party-accounts/settle"
        },
        {
            "file": "src/components/pms/RolesPermissionsModal.tsx",
            "modal": "Roles & Permissions Config Modal",
            "bug": "PmsStore.updateRolePermissions and deleteRole only mutate localStorage (STORAGE_KEYS.ROLES). Role edits desync on refresh.",
            "missing_db": "Existing 'roles' table needs permissions_json update endpoint and delete endpoint.",
            "required_endpoint": "PUT /pms/roles/{role_id}/permissions, DELETE /pms/roles/{role_id}"
        },
        {
            "file": "src/components/pms/UserManagementModal.tsx",
            "modal": "Staff User Management Modal",
            "bug": "PmsStore.deleteUser removes user from localStorage without executing DELETE on PostgreSQL 'users' table.",
            "missing_db": "'users' table exists, missing DELETE endpoint with foreign key safeguard.",
            "required_endpoint": "DELETE /pms/users/{user_id}"
        },
        {
            "file": "src/components/pms/WhatsAppSettingModal.tsx",
            "modal": "WhatsApp Templates & Config Modal",
            "bug": "PmsStore.deleteWhatsAppTemplate and clearWhatsAppLogs only update localStorage arrays.",
            "missing_db": "'whatsapp_templates' and 'whatsapp_logs' tables exist, missing delete template & clear logs endpoints.",
            "required_endpoint": "DELETE /pms/whatsapp/templates/{id}, DELETE /pms/whatsapp/logs"
        },
        {
            "file": "src/components/pms/LiquorBarManagementModal.tsx",
            "modal": "Liquor Bar Stock & Dispense Modal",
            "bug": "PmsStore.recordLiquorSaleDeduction and recordLiquorPurchaseInward update brand-wise stocks only in localStorage.",
            "missing_db": "Missing 'liquor_stock_ledger' table (item_id, brand, bottle_size_ml, transaction_type, qty_pegs, balance_pegs, timestamp).",
            "required_endpoint": "POST /pms/liquor/stock-adjustments, GET /pms/liquor/stocks"
        },
        {
            "file": "src/components/pms/StockReportMasterModal.tsx",
            "modal": "Stock Godown Transfer Modal",
            "bug": "handleSimStep2Transfer calls PmsStore.recordStockTransferDirect which only appends to localStorage.",
            "missing_db": "'stock_transfers' table exists, but frontend was bypassing hotelApi.saveStockTransfer.",
            "required_endpoint": "POST /pms/stock-transfers (wire to backend)"
        },
        {
            "file": "src/components/pms/BanquetBillingModal.tsx",
            "modal": "Banquet Event Billing & KOT Modal",
            "bug": "PmsStore.addBanquetKot, recordBanquetPayment, and settleBanquetCheckout mutate booking in localStorage only.",
            "missing_db": "Missing 'banquet_kots' and 'banquet_payments' tables linked to 'banquet_bookings'.",
            "required_endpoint": "POST /pms/banquet/kot, POST /pms/banquet/payments, POST /pms/banquet/checkout"
        },
        {
            "file": "src/components/pms/ManagerPinModal.tsx",
            "modal": "Manager Override & Void Authorizer",
            "bug": "handleSubmit checks hardcoded PINs (9999, 1234, 8888) in local React state instead of validating against PostgreSQL manager role/PIN.",
            "missing_db": "Missing manager_pin column on 'users' table or dedicated PIN verification function in backend.",
            "required_endpoint": "POST /pms/auth/verify-manager-pin"
        },
        {
            "file": "src/components/pms/DecentroVirtualAccountModal.tsx",
            "modal": "Decentro Virtual Account / Dynamic UPI",
            "bug": "handleCreate receives virtual account payload from Decentro API but never persists account details into PostgreSQL.",
            "missing_db": "Missing 'virtual_accounts' table (account_number, ifsc, upi_id, booking_id, guest_name, status, created_at).",
            "required_endpoint": "POST /pms/virtual-accounts, GET /pms/virtual-accounts"
        },
        {
            "file": "src/components/pms/AdvanceReceiptModal.tsx",
            "modal": "Advance Receipt Direct Ledger",
            "bug": "Direct localStorage.getItem(STORAGE_KEYS.ADVANCE_RECEIPTS) bypasses backend synchronization on component mount.",
            "missing_db": "'receipts' / 'advance_receipts' exists, needs direct fetch from hotelApi.getAdvanceReceipts().",
            "required_endpoint": "GET /pms/advance-receipts"
        },
        {
            "file": "src/components/pms/BookingCalendarModal.tsx",
            "modal": "Group Booking & Calendar Matrix",
            "bug": "Reads and writes 'svr_pms_group_bookings' directly via localStorage.getItem/setItem without calling backend.",
            "missing_db": "'group_bookings' table exists, needs direct fetch from hotelApi.getGroupBookings().",
            "required_endpoint": "GET /pms/group-bookings, POST /pms/group-bookings"
        },
        {
            "file": "src/components/pms/CheckOutRegisterModal.tsx",
            "modal": "Check-Out Master Register",
            "bug": "Direct read from localStorage.getItem(STORAGE_KEYS.CHECKOUTS) without fetching verified records from PostgreSQL.",
            "missing_db": "'checkouts' table exists, needs direct hydration from hotelApi.getCheckouts().",
            "required_endpoint": "GET /pms/checkouts"
        }
    ]

    print(f"| File Path | Modal / Feature Name | Current Bug (React State / localStorage) | Missing DB Table / Column | Required FastAPI Endpoint |")
    print(f"|---|---|---|---|---|")
    for g in gaps:
        print(f"| `{g['file']}` | **{g['modal']}** | {g['bug']} | {g['missing_db']} | `{g['required_endpoint']}` |")

if __name__ == '__main__':
    generate_table()
