# FORENSIC AUDIT: FRONTEND-ONLY STATE, LOCALSTORAGE & DATABASE ISOLATION
**Hotel Sai Vasudev Residency (Opp. Sai Baba Temple, Shirdi)**  
**Target Database:** PostgreSQL (Railway) | **Backend Framework:** FastAPI (Python 3.11)  
**Client Application:** React 19 + TypeScript + Vite + Dexie.js (Cloudflare Pages)  
**Audit Purpose:** Identify all frontend-only transient React state, mock arrays, and `localStorage` keys causing desynchronization across multi-terminal front desk operations.

---

## 1. Executive Summary of Audit Findings

Across 79 frontend PMS components and 14,735 lines in `pmsStore.ts`, the system currently relies on **57 distinct `localStorage` keys** and multiple unpersisted React component states (`useState` / `useReducer`). While partial backend endpoints and SQLAlchemy models exist in `app/models.py`, several operational workflows either:
1. **Bypass the PostgreSQL database entirely**, writing mutations strictly to browser `localStorage` (e.g. `CheckOutRegisterModal`, `AdvanceReceiptModal`, `ShiftHandoverModal`).
2. **Lose critical business and tax fields** during serialization because the PostgreSQL tables or schemas lack corresponding columns (e.g. walk-in KYC travel history, checkout multi-split payments, banquet KOT order items, and liquor pegs inventory).
3. **Fail silently due to URL route mismatches** (e.g. Agent Commissions calling `/api/v1/pms/agent-commissions` while FastAPI listens on `/agent-commission-accruals`, resulting in 404s and fallback to local browser cache).

---

## 2. Forensic Audit Matrix

| Module / Component File | Isolated State / localStorage Key | Data Structure Fields | Missing PostgreSQL Table / Columns | Missing FastAPI Endpoints | Priority (Critical / High / Medium) |
|---|---|---|---|---|---|
| **Front Desk Walk-In Check-In**<br>`src/components/pms/NewRoomCheckInModal.tsx` | • Transient React `useState`<br>• `localStorage: svr_pms_checkins`<br>• `localStorage: svr_pms_rooms` | `guestName`, `mobile`, `email`, `comingFrom`, `proceedingTo`, `stayDays`, `selectedRoom`, `tariff`, `idProofType`, `idProofNumber`, `vehicleNo`, `advanceAmount`, `paymentMode`, `darshanSlot`, `roomType` | **Missing Columns in `bookings`:**<br>• `coming_from` (VARCHAR(150))<br>• `proceeding_to` (VARCHAR(150))<br>• `vehicle_no` (VARCHAR(50))<br>• `darshan_slot` (VARCHAR(100))<br>• `guest_gender` (VARCHAR(20))<br>• `guest_age` (INTEGER) | `POST /api/v1/pms/walkin-checkin` exists but strips `comingFrom`, `proceedingTo`, `vehicleNo`, and `darshanSlot` before saving to `bookings` | **Critical** |
| **Room Checkout & Settlement**<br>`src/components/pms/RoomCheckOutModal.tsx` | • React `useState: paymentSplits`<br>• `localStorage: svr_pms_checkouts`<br>• `localStorage: svr_pms_folio_discounts` | `invoiceNo`, `bookingRef`, `roomNo`, `checkoutTime`, `paymentSplits: [{ mode: 'Cash'\|'UPI'\|'Card', amount: number, utr?: string, authCode?: string }]`, `finalTotal`, `discountAmount`, `roundOff`, `netPayable` | **Missing Columns in `checkout_records`:**<br>• `payment_splits_json` (TEXT - JSON array of split settlements)<br>• `settled_by_user_id` (VARCHAR(100))<br>• `round_off_amount` (FLOAT) | `POST /api/v1/pms/checkouts` does not atomically persist individual payment splits into `booking_payments` table | **Critical** |
| **Checkout Register & Invoices**<br>`src/components/pms/CheckOutRegisterModal.tsx` | • Direct `localStorage.setItem('svr_pms_checkouts')`<br>• Direct `localStorage.getItem('svr_pms_checkouts')` | Array of `PmsCheckOutDetail` (`invoiceNo`, `roomNo`, `guestName`, `checkInDate`, `checkOutDate`, `totalRoomRent`, `foodAmount`, `discount`, `advancePaid`, `netPayable`, `paymentMode`, `gstSummary`) | **Missing Columns in `checkout_records`:**<br>• `is_cancelled` (BOOLEAN DEFAULT FALSE)<br>• `cancellation_reason` (VARCHAR(255))<br>• `cancelled_by` (VARCHAR(100)) | Modal never queries `GET /api/v1/pms/checkouts` on load; performs in-browser mutations. Missing `DELETE /api/v1/pms/checkouts/{invoice_no}` soft-delete sync | **Critical** |
| **Restaurant & In-Room KOT Entry**<br>`src/components/pms/KotEntryModal.tsx` | • React `useState: cartItems`<br>• `localStorage: svr_pms_kots`<br>• `localStorage: svr_pms_table_sessions` | `kotNo`, `tableNo`, `roomNo`, `waiterName`, `paxCount`, `date`, `time`, `orderType`, `cartItems: [{ code, name, qty, rate, amount, instruction }]`, `status` | **Missing Table / Columns:**<br>• Table `kot_items` missing relational line-item rows (currently serializes entire cart into `kot_tickets.items_json` which breaks SQL analytics on item consumption) | `POST /api/v1/pms/kots` does not populate relational items or broadcast WebSocket event to Kitchen Display System | **Critical** |
| **Restaurant Food Bill Generation**<br>`src/components/pms/FoodBillModal.tsx` | • Transient React `useState`<br>• `localStorage: svr_pms_foodbills`<br>• `localStorage: hotel_pms_foodbills` | `billNo`, `date`, `time`, `tableNo`, `roomNo`, `customerName`, `customerMobile`, `gstin`, `kotNumbers: string[]`, `items: FoodBillItem[]`, `taxableAmount`, `cgstAmount`, `sgstAmount`, `discountAmount`, `netBillAmount`, `paymentMode` | **Missing Columns in `food_bills`:**<br>• `items_json` (TEXT - JSON array of items)<br>• `discount_reason` (VARCHAR(255))<br>• `payment_ref` (VARCHAR(100))<br>• `billed_by` (VARCHAR(100)) | `POST /api/v1/pms/food-bills` exists, but payload items and tax breakdown are stripped when stored in PostgreSQL (only header numbers are kept) | **Critical** |
| **Banquet & Marriage Hall Billing**<br>`src/components/pms/BanquetHallBillingModal.tsx` | • `localStorage: svr_pms_banquet_venues`<br>• `localStorage: svr_pms_banquet_bookings` | `id`, `bookingNo`, `eventName`, `eventType`, `hostName`, `contactPerson`, `contactMobile`, `venueId`, `venueTariff`, `kots: PmsBanquetKot[]`, `payments: BanquetPayment[]`, `financialSummary`, `linkedRooms`, `seatingLayout` | **Missing Columns in `banquet_bookings`:**<br>• `kots_json` (TEXT - Catering KOT orders)<br>• `payments_json` (TEXT - Milestone installments & receipts)<br>• `linked_rooms_json` (TEXT - Rooms bundled with banquet)<br>• `seating_layout` (VARCHAR(100)) | `POST /api/v1/pms/banquet-bookings/kots` and `POST /api/v1/pms/banquet-bookings/payments` endpoints are completely missing in FastAPI | **Critical** |
| **Restro-Bar & Liquor Excise Management**<br>`src/components/pms/LiquorBarManagementModal.tsx` | • Hardcoded `INITIAL_LIQUOR_STOCKS`<br>• `localStorage: svr_pms_liquor_stocks`<br>• `localStorage: svr_pms_liquor_items`<br>• `localStorage: svr_pms_bar_invoices` | `brandWiseStock: [{ brand, bottleSizeMl, openingBottles, receivedBottles, soldPegs, balancePegs, closingBottles }]`, `barInvoices`, `liquorAdjustments` | **Missing PostgreSQL Table:**<br>• `liquor_stocks` table does not exist (stocks are computed solely in browser client memory from mock constants) | `GET /api/v1/pms/liquor-stocks`<br>`POST /api/v1/pms/liquor-stocks/audit`<br>`POST /api/v1/pms/liquor-stocks/adjust` are completely missing | **High** |
| **Travel Agent Commission & Payouts**<br>`src/components/pms/AgentCommissionModal.tsx` | • `localStorage: svr_pms_commission_agents`<br>• `localStorage: svr_pms_agent_commissions`<br>• `localStorage: svr_pms_agent_payout_vouchers` | `commissionId`, `agentId`, `agentName`, `bookingRefNo`, `roomNo`, `guestName`, `checkInDate`, `checkOutDate`, `roomTariff`, `commissionRate`, `grossCommission`, `tdsAmount`, `netPayable`, `status: 'PENDING'\|'PAID'`, `voucherNo` | **Missing Columns in `agent_commissions`:**<br>• `payout_voucher_id` (INTEGER)<br>• `approved_by` (VARCHAR(100))<br>• `payment_mode` (VARCHAR(50))<br>• `utr_reference` (VARCHAR(100)) | Route Disconnection: Frontend calls `/pms/agent-commissions` (404 Not Found) because backend declared `/agent-commission-accruals`. `PUT /api/v1/pms/agent-commissions/{id}/status` is missing | **High** |
| **Cashier Shift Handover**<br>`src/components/pms/ShiftHandoverModal.tsx` | • Hardcoded mock `'19-07-2025'`<br>• Transient `handoverRecord` state<br>• `pmsStore.getShiftHandoverData()` | `shiftId`, `shiftDate`, `shiftType: 'Morning'\|'Evening'\|'Night'`, `userEmail`, `userName`, `physicalCashInDrawer`, `openingBalance`, `totalCashCollected`, `totalUpiCollected`, `totalCardCollected`, `totalExpensesCash`, `handoverToUser`, `handoverStatus`, `notes` | Table `shift_handovers` exists in `models.py`, but has no active linkage to live day cashier totals | `GET /api/v1/pms/shift-handovers`<br>`POST /api/v1/pms/shift-handovers`<br>`GET /api/v1/pms/shift-handovers/current-metrics` are completely missing in FastAPI routes | **High** |
| **Advance Deposit Receipts**<br>`src/components/pms/AdvanceReceiptModal.tsx` | • Direct `localStorage.setItem('svr_pms_advance_receipts')`<br>• `pmsStore.getAdvanceReceipts()` | `receiptNo`, `bookingNo`, `guestName`, `mobile`, `amount`, `date`, `paymentMode`, `remarks`, `createdBy` | **Missing Columns in `advance_receipts`:**<br>• `payment_mode` (VARCHAR(50))<br>• `transaction_ref` (VARCHAR(100))<br>• `is_settled_in_checkout` (BOOLEAN DEFAULT FALSE) | Modal writes merged state to `localStorage` instead of calling `POST /api/v1/pms/advance-receipts`. Missing status update endpoint when advance is applied during checkout | **High** |
| **Petty Cash & Rasoi Expenses**<br>`src/components/pms/PettyExpenseModal.tsx` | • Hardcoded `INITIAL_EXPENSES`<br>• `localStorage: svr_pms_expenses`<br>• `localStorage: svr_pms_business_date` | `expenseNo`, `date`, `time`, `category`, `amount`, `paymentMode`, `paidTo`, `description`, `billNumber`, `approvedBy`, `createdAt` | **Missing Columns in `petty_expenses`:**<br>• `vendor_gstin` (VARCHAR(20))<br>• `attachment_url` (VARCHAR(500) - Cloudflare R2 voucher scan) | Modal relies on `PmsStore.addExpense()`. Endpoint `POST /api/v1/pms/expenses` exists but lacks image/voucher upload support and payment mode ledger debit sync | **High** |
| **General Cashier Payments & Receipts**<br>`src/components/pms/PaymentRegisterModal.tsx`<br>`src/components/pms/ReceiptRegisterModal.tsx` | • `localStorage: svr_pms_payments`<br>• `localStorage: svr_pms_receipts` | `sNo`, `voucherName`, `voucherNo`, `date`, `accountHead`, `amount`, `paymentMode`, `narration`, `preparedBy` | Tables `general_payments` and `general_receipts` exist in `models.py` | `POST /api/v1/pms/general-payments`<br>`POST /api/v1/pms/general-receipts`<br>`GET /api/v1/pms/general-payments`<br>`GET /api/v1/pms/general-receipts` are missing from `app/routes/pms.py` | **High** |
| **Inventory Purchases & Suppliers**<br>`src/components/pms/PurchaseEntryModal.tsx` | • `localStorage: svr_pms_purchases`<br>• React `useState: cartItems` | `billNo`, `billDate`, `supplierName`, `supplierGstin`, `godown`, `items: [{ itemId, name, qty, unit, rate, taxPercent, taxAmount, totalAmount }]`, `grossAmount`, `netBillAmount` | **Missing Relational Table:**<br>• Table `inventory_purchase_items` missing. Currently stored as untyped `inventory_purchases.items_json` text string, preventing stock inventory balance recalculation | `POST /api/v1/pms/inventory/purchases` exists but does not atomically update Godown stock quantity levels in PostgreSQL | **High** |
| **Godown Stock Transfers**<br>`src/components/pms/StockTransferModal.tsx` | • `localStorage: svr_pms_stock_transfers`<br>• React `useState: transferItems` | `entryNo`, `date`, `fromGodown`, `toGodown`, `billDate`, `items: [{ itemId, name, qty, unit }]`, `remarks`, `transferredBy` | Table `stock_transfers` exists, but line items are locked in `items_json` | `POST /api/v1/pms/inventory/transfers` exists, but lacks transactional debit from `fromGodown` and credit to `toGodown` in database | **High** |
| **RFID Keycard Encoding & Tracking**<br>`src/components/pms/RfidKeyCardModal.tsx` | • Hardcoded bridge `127.0.0.1:8080`<br>• `localStorage: svr_pms_rfid_keycards` | `cardNumber`, `cardUuid`, `roomNo`, `guestName`, `checkInTime`, `validUntil`, `status: 'Active'\|'Expired'\|'Deactivated'`, `issuedBy` | Table `rfid_keycards` and `key_card_access` exist in `models.py` | Modal targets offline bridge port 8080. If bridge fails, card is only stored in browser `localStorage`. Endpoint `POST /api/v1/pms/keycards/encode` not called by modal | **High** |
| **Housekeeping Room Inspection Tracker**<br>`src/components/pms/HousekeepingTrackerModal.tsx` | • Hardcoded `INITIAL_HOUSEKEEPING`<br>• `localStorage: svr_pms_housekeeping`<br>• `localStorage: svr_pms_rooms` | `roomNo`, `status: 'Clean'\|'Dirty'\|'Inspected'\|'Under Maintenance'`, `assignedStaff`, `priority`, `lastCleanedTime`, `remarks` | Table `housekeeping_records` exists in `models.py` | Modal only invokes `PmsStore.saveHousekeepingRecord()`. Missing batch update endpoint: `PUT /api/v1/pms/housekeeping/batch-assign` | **High** |
| **Housekeeping Physical Discrepancy**<br>`src/components/pms/HousekeepingDiscrepancyModal.tsx` | • `localStorage: svr_pms_hk_discrepancies` | `discrepancyId`, `roomNo`, `frontDeskStatus`, `housekeepingStatus`, `reportedBy`, `remarks`, `resolved: boolean`, `resolvedBy`, `resolvedAt` | Table `housekeeping_discrepancies` exists in `models.py` | Modal handlers `handleCreateDiscrepancy` and `handleResolve` call `PmsStore` but lack real-time WebSocket alert dispatch to front desk cashier | **High** |
| **Company Legal & Banking Profile**<br>`src/components/pms/CompanyInfoModal.tsx`<br>`src/components/pms/CompanyBrandingModal.tsx` | • Hardcoded `DEFAULT_COMPANY_INFO`<br>• `localStorage: pms_company_info`<br>• `localStorage: pms_default_bill_format` | `firmName`, `legalName`, `gstNo`, `address`, `city`, `state`, `pincode`, `phone`, `email`, `website`, `bankName`, `bankAccountNo`, `bankIfsc`, `bankBranch`, `upiId`, `phonePeGpay`, `termsAndConditions` | **Missing Columns in `hotel_company_info`:**<br>• `legal_name` (VARCHAR(150))<br>• `pan_number` (VARCHAR(20))<br>• `bank_name` (VARCHAR(100))<br>• `bank_account_no` (VARCHAR(50))<br>• `bank_ifsc` (VARCHAR(20))<br>• `bank_branch` (VARCHAR(100))<br>• `upi_id` (VARCHAR(50))<br>• `phonepe_gpay` (VARCHAR(50))<br>• `jurisdiction` (VARCHAR(100)) | `PUT /api/v1/pms/company-info` does not save banking & UPI details to PostgreSQL (falls back to hardcoded default values) | **High** |
| **User Staff Accounts & Access Control**<br>`src/components/pms/UserManagementModal.tsx`<br>`src/components/pms/RolesPermissionsModal.tsx` | • Hardcoded `INITIAL_USERS`<br>• `localStorage: svr_pms_users`<br>• `localStorage: svr_pms_roles`<br>• `localStorage: svr_pms_current_user` | `userId`, `userName`, `emailId`, `mobileNo`, `roleId`, `roleName`, `department`, `isActive`, `permissions: string[]` | Tables `user_accounts` and `roles_permissions` exist in `models.py` | `PUT /api/v1/pms/users/{user_id}/status` and `PUT /api/v1/pms/roles/{role_id}` missing; password hash validation missing for local users | **High** |
| **Group Reservations & Tour Blocks**<br>`src/components/pms/BookingCalendarModal.tsx` | • Direct `localStorage.setItem('svr_pms_group_bookings')` | `groupId`, `groupName`, `contactPerson`, `contactPhone`, `bookingSource`, `roomsCount`, `totalAmount`, `advancePaid`, `status`, `notes` | Table `group_bookings` exists in `models.py` | Modal directly writes merged group bookings to `localStorage` bypassing `hotelApi.getGroupBookings()` and `POST /api/v1/pms/group-bookings` | **High** |
| **Unconfirmed Web Reservations**<br>`src/components/pms/UnconfirmedBookingsModal.tsx` | • `localStorage: svr_pms_bookings`<br>• `PmsStore.getUnconfirmedBookings()` | `bookingNo`, `guestName`, `phone`, `checkInDate`, `checkOutDate`, `roomType`, `roomsCount`, `status: 'Unconfirmed'` | Table `bookings` has `status` column | Modal confirm/delete calls `PmsStore.confirmBooking()` and `deleteBooking()`. Delete booking currently marks as `Cancelled` but lacks undo or audit reason capture | **Medium** |
| **Dining Table Shifts & Merge**<br>`src/components/pms/ShiftTableModal.tsx` | • `localStorage: svr_pms_table_shifts`<br>• `localStorage: svr_pms_table_sessions` | `shiftId`, `fromTable`, `toTable`, `transferredCount`, `reason`, `shiftedBy`, `createdAt` | Tables `table_shifts` and `table_sessions` exist in `models.py` | `POST /api/v1/pms/tables/shift-session` and `POST /api/v1/pms/tables/merge-sessions` exist, but modal executes optimistic local state changes without handling rollback on failure | **Medium** |
| **Void KOT Audit Logs**<br>`src/components/pms/CancelKotModal.tsx` | • `localStorage: svr_pms_kot_void_audit` | `tableSessionId`, `kotNo`, `tableNo`, `itemName`, `qtyVoided`, `reason`, `authorizedByManager`, `timestamp` | Table `kot_void_audit_logs` exists in `models.py` | `POST /api/v1/pms/kot/void` exists, but does not reverse inventory de-allocations for cancelled food items | **Medium** |
| **WhatsApp Notification Engine**<br>`src/components/pms/WhatsAppSettingModal.tsx`<br>`src/components/pms/WhatsAppLogsModal.tsx` | • `localStorage: svr_pms_whatsapp_templates`<br>• `localStorage: svr_pms_whatsapp_config`<br>• `localStorage: svr_pms_whatsapp_logs` | `templateId`, `voucherType`, `message`, `active`, `recipientMobile`, `recipientName`, `status: 'Sent'\|'Failed'` | Tables `whatsapp_templates`, `whatsapp_configs`, `whatsapp_logs` exist in `models.py` | `DELETE /api/v1/pms/whatsapp-logs` (Clear all logs) missing from backend router; template variables are not validated server-side | **Medium** |
| **Discount Exemption Rules & Overrides**<br>`src/components/pms/NoDiscountMasterModal.tsx` | • `localStorage: svr_pms_no_discount_config`<br>• `localStorage: svr_pms_discount_audit_logs` | `protectedGroups: string[]`, `maxAllowedDiscountPercent`, `overrideRoleRequired`, `auditLogs: [{ billNo, discountPercent, reason, managerName }]` | Tables `no_discount_configs` and `discount_audit_logs` exist in `models.py` | `POST /api/v1/pms/discounts/audit` missing dedicated router entry; relies on generic `POST /pms/masters` | **Medium** |
| **Master Codes (GST, Business Source, Lockers)**<br>`src/components/pms/OtherMasterModal.tsx` | • `localStorage: svr_pms_gst_masters`<br>• `localStorage: svr_pms_business_sources`<br>• `localStorage: svr_pms_lockers`<br>• `localStorage: svr_pms_other_charges` | `id`, `name`, `code`, `ratePercent`, `rateType`, `hsnCode`, `status` | Generic `master_items` table is used (`category`, `code`, `name`, `payload_json`) | Missing strongly-typed relational tables for `gst_masters`, `business_sources`, and `other_charges`. Generic JSON payload prevents database foreign keys | **Medium** |

---

## 3. Recommended PostgreSQL Schema Additions (For Approval)

To eliminate all 57 isolated `localStorage` keys and prevent cross-terminal desynchronization, the following SQL schema migrations are proposed:

### 3.1 Migration A: Core Reservation & Checkout KYC Additions
```sql
-- Add missing walk-in guest and police reporting columns to bookings
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS coming_from VARCHAR(150),
  ADD COLUMN IF NOT EXISTS proceeding_to VARCHAR(150),
  ADD COLUMN IF NOT EXISTS vehicle_no VARCHAR(50),
  ADD COLUMN IF NOT EXISTS darshan_slot VARCHAR(100),
  ADD COLUMN IF NOT EXISTS guest_gender VARCHAR(20),
  ADD COLUMN IF NOT EXISTS guest_age INTEGER;

-- Add split payment and audit tracking to checkout_records
ALTER TABLE checkout_records
  ADD COLUMN IF NOT EXISTS payment_splits_json TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS settled_by_user_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS round_off_amount FLOAT DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(255);
```

### 3.2 Migration B: Banquet Hall Full-Relational Columns
```sql
-- Enhance banquet_bookings to retain KOT items and payment installments
ALTER TABLE banquet_bookings
  ADD COLUMN IF NOT EXISTS kots_json TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS payments_json TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS linked_rooms_json TEXT DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS seating_layout VARCHAR(100) DEFAULT 'Standard Banquet';
```

### 3.3 Migration C: Restro-Bar & Liquor Excise Inventory Table
```sql
-- Create persistent physical stock table for bar excise compliance
CREATE TABLE IF NOT EXISTS liquor_stocks (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(150) NOT NULL,
    bottle_size_ml INTEGER DEFAULT 750,
    opening_bottles FLOAT DEFAULT 0.0,
    received_bottles FLOAT DEFAULT 0.0,
    sold_pegs FLOAT DEFAULT 0.0,
    pegs_per_bottle INTEGER DEFAULT 25,
    closing_bottles FLOAT DEFAULT 0.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_liquor_stocks_brand ON liquor_stocks(brand);
```

### 3.4 Migration D: Company Banking & Legal Profile Additions
```sql
-- Extend hotel_company_info with statutory and digital payment credentials
ALTER TABLE hotel_company_info
  ADD COLUMN IF NOT EXISTS legal_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS bank_account_no VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(20),
  ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(100),
  ADD COLUMN IF NOT EXISTS upi_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS phonepe_gpay VARCHAR(50),
  ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR(100);
```

---

## 4. Next Steps (Pending User Approval)
1. **Database Schema Approval:** Review the proposed migrations in Section 3.
2. **Backend Router Alignment:**
   - Fix `/pms/agent-commissions` route mismatch in `app/routes/pms.py`.
   - Add missing endpoints for Shift Handover metrics, Banquet KOTs/Payments, and General Cashier Vouchers.
3. **Frontend Store Refactoring:**
   - Transition `PmsStore` from synchronous `localStorage` writes to async React Query / API calls with Dexie.js offline caching.
   - Remove direct `localStorage.setItem` calls inside modal components.
