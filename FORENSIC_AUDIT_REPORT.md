# FORENSIC AUDIT REPORT: ERP & PROPERTY MANAGEMENT SYSTEM
**Hotel Sai Vasudev Residency (Opp. Sai Baba Temple, Shirdi)**  
**Production URLs:** Frontend: `https://sai-vasudev-residency.pages.dev/` | Backend API: `https://sai-vasudev-residency-production.up.railway.app`  
**System Architecture:** Cloudflare Pages (React/Vite/TS/Dexie) + FastAPI (Railway) + PostgreSQL + Cloudflare R2 (Object Storage) + Decentro Banking Hub (Virtual Accounts & UPI Collections)  
**Audit Class:** Pre-Handover Forensic Architectural & Integrity Inspection  
**Audit Authority:** Principal Systems Architect & Forensic QA Engineering Lead  
**Audit Date:** October 2026  
**Status:** PHASE 1 FORENSIC AUDIT (INVESTIGATION & CATALOGING ONLY — NO TEST SUITES WRITTEN YET)

---

## EXECUTIVE SUMMARY & SYSTEM TOPOLOGY

This forensic audit represents an exhaustive, line-by-line inspection of the Hotel Sai Vasudev Residency ERP and Property Management codebase, spanning 191 FastAPI backend endpoints, 194 frontend `fetch()` API calls, 28 database entities across `backend/app/models.py`, Cloudflare R2 bucket integration pipelines in `backend/app/routes/uploads.py`, and Decentro UPI/Virtual Account banking handlers in `backend/app/routes/payments.py`.

The inspection identified critical structural vulnerabilities across four operational pillars that threaten commercial stability, data consistency, statutory GST compliance, and banking reconciliation:
1. **Frontend-to-Backend Disconnections:** Health checks that permanently report the system as offline, GSTIN verification prefix mismatches causing 404s, agent commission endpoints mapped to non-existent URLs, and restaurant food bill payloads whose order items and tax amounts are completely stripped before being stored in PostgreSQL.
2. **Database & Transaction Silos:** Multi-table mutations executing without `try...except: db.rollback()` atomic wrappers, walk-in check-in workflows that bypass the `Folio` accounting ledger, duplicate checkout endpoints executing inconsistent state updates, and untracked plain-text foreign keys without relational integrity or cascade constraints.
3. **Cloudflare R2 Object Storage Silos:** Non-atomic document upload workflows where a database transaction rollback leaves orphaned identity documents and tax invoices in private R2 buckets, direct guest-ID upload endpoints that never bind to any database entity, and booking cancellations that leak private PII documents indefinitely.
4. **Accounting & Decentro Vulnerabilities:** Universal IEEE-754 binary floating-point representation (`Float`) used across 28 financial models causing rounding drift on Indian GST calculations (SAC 996311 / 996331), Decentro webhook workers lacking transaction status idempotency (allowing duplicate webhooks or replays to credit payments twice and generate negative balances), non-unique bank UTR columns, and out-of-order status downgrades.

---

## PILLAR 1: FRONTEND-TO-BACKEND DISCONNECTIONS

### 1.1 Backend Health Probe Disconnection (System Status False Negative)
* **Frontend Location:** [src/services/api.ts:96](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/src/services/api.ts#L96)
* **Backend Location:** [backend/app/main.py:171-173](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/main.py#L171-L173), [backend/app/routes/health.py:13-30](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/health.py#L13-L30)
* **HTTP Method:** `GET`
* **Requested URL:** `${rootUrl}/health` (where `rootUrl = API_BASE_URL.replace('/api/v1', '')`)
* **Disconnection Diagnosis:**
  In `src/services/api.ts`, `hotelApi.checkHealth()` attempts to probe `${rootUrl}/health`. However, in `backend/app/routes/health.py`, the router is defined with `prefix="/health"` and contains only `/live` and `/ready`. In `backend/app/main.py`, this router is mounted as:
  ```python
  app.include_router(health.router, prefix=settings.API_V1_STR) # /api/v1/health/live, /api/v1/health/ready
  app.include_router(health.router, prefix="/api")               # /api/health/live, /api/health/ready
  app.include_router(health.router)                              # /health/live, /health/ready
  ```
  The naked endpoint `/health` does not exist in FastAPI. FastAPI immediately returns **HTTP 404 Not Found**.
* **Failure Mode & Operational Impact:**
  `res.ok` evaluates to `false`. `hotelApi.checkHealth()` unconditionally falls back to returning:
  `{ status: 'offline', database: 'unavailable', engine: 'Railway Postgres / SQLite' }`.
  Any frontend telemetry widget or health indicator displays the backend server as "Offline" even when Railway and PostgreSQL are 100% operational.

---

### 1.2 Decentro GSTIN Verification Router Prefix 404
* **Frontend Location:** [src/services/decentroApi.ts:361-378](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/src/services/decentroApi.ts#L361-L378)
* **Backend Location:** [backend/app/main.py:191](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/main.py#L191), [backend/app/routes/kyc.py:15-30](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/kyc.py#L15-L30)
* **HTTP Method:** `POST`
* **Requested URL:** `${API_BASE_URL}/kyc/decentro/verify-gstin` (expands to `/api/v1/kyc/decentro/verify-gstin`)
* **Disconnection Diagnosis:**
  `backend/app/main.py` line 191 mounts `kyc.router` solely under the prefix `prefix="/api"`:
  ```python
  app.include_router(kyc.router, prefix="/api")
  ```
  It is **NOT** registered under `settings.API_V1_STR` (`/api/v1`).
  When `src/services/decentroApi.ts` calls `/api/v1/kyc/decentro/verify-gstin`, Railway immediately responds with **HTTP 404 Not Found**.
* **Failure Mode & Operational Impact:**
  Every GSTIN verification attempt initiates a guaranteed failed network round-trip, polluting browser developer tools with 404 console errors before falling back to line 368 (`${API_BASE_URL.replace('/v1', '')}/kyc/decentro/verify-gstin`). Under high-latency mobile networks at the reception desk, this doubles corporate check-in verification wait times.

---

### 1.3 Agent Commission Accruals URL Disconnection & 404
* **Frontend Location:** [src/services/api.ts:1668, 1678, 1688](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/src/services/api.ts#L1668)
* **Backend Location:** [backend/app/routes/pms.py:4050, 4088, 4104](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/pms.py#L4050)
* **HTTP Method:** `GET`, `POST`, `PUT`
* **Requested URLs:**
  * `GET ${API_BASE_URL}/pms/agent-commissions` (line 1668)
  * `POST ${API_BASE_URL}/pms/agent-commissions` (line 1678)
  * `PUT ${API_BASE_URL}/pms/agent-commissions/${commissionId}/status` (line 1688)
* **Disconnection Diagnosis:**
  FastAPI in `backend/app/routes/pms.py` does not define `/pms/agent-commissions`. The actual backend endpoints are:
  * `@router.post("/agent-commission-accruals")` (line 4050)
  * `@router.get("/agent-commission-accruals")` (line 4088)
  * `@router.delete("/agent-commission-accruals/{commission_id}")` (line 4104)
  No `PUT /agent-commissions/{id}/status` exists anywhere in the backend codebase.
* **Failure Mode & Operational Impact:**
  `hotelApi.getAgentCommissions()` silently catches the 404 and returns `[]`. Commission payouts, agent accruals, and travel agent ledger settlements fail silently; managers cannot view or accrue tour operator commissions in the cloud database.

---

### 1.4 Restaurant Food Bill Order Items & GST Obliteration Payload Mismatch
* **Frontend Location:** [src/services/pmsStore.ts:7776-7793](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/src/services/pmsStore.ts#L7776-L7793)
* **Backend Location:** [backend/app/schemas.py:547-564](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/schemas.py#L547-L564), [backend/app/routes/pms.py:1904-1925](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/pms.py#L1904-L1925)
* **HTTP Method:** `POST`
* **Target Endpoint:** `/api/v1/pms/food-bills`
* **Disconnection Diagnosis:**
  In `src/services/pmsStore.ts`, the background sync payload sends serialized JSON strings:
  ```typescript
  hotelApi.saveFoodBill({
    bill_no: bill.billNo,
    ...
    kot_numbers_json: JSON.stringify(bill.kotNumbers || []),
    items_json: JSON.stringify(bill.items || []),
    taxable_amount: bill.taxableAmount,
    cgst_amount: bill.cgstAmount,
    sgst_amount: bill.sgstAmount,
    discount_amount: bill.discountAmount,
    net_bill_amount: bill.netBillAmount
  })
  ```
  However, `schemas.FoodBillCreate` in `backend/app/schemas.py` expects:
  ```python
  class FoodBillCreate(BaseModel):
      kot_numbers: Optional[List[str]] = []
      items: Optional[List[Dict[str, Any]]] = []
      food_gross_amount: float = 0.0
      gst_amount: float = 0.0
  ```
  1. `FoodBillCreate` does not recognize `kot_numbers_json` or `items_json`. Pydantic ignores these fields, leaving `kot_numbers = []` and `items = []`.
  2. In `backend/app/routes/pms.py:1917-1918`, the backend writes `json.dumps(payload.kot_numbers or [])` and `json.dumps(payload.items or [])`.
  3. Consequently, PostgreSQL `food_bills.kot_numbers_json` and `food_bills.items_json` are written as `"[]"` and `"[]"`. Every food bill synced from the frontend loses 100% of its line items and KOT identifiers.
  4. The frontend sends `cgst_amount` and `sgst_amount`, but **omits `gst_amount`**. `payload.gst_amount` defaults to `0.0`. In `backend/app/routes/pms.py:1923`, `bill.gst_amount` is saved as `0.0`, recording ₹0.00 tax in the database for restaurant dining bills.
* **Failure Mode & Operational Impact:**
  Auditing restaurant sales in PostgreSQL shows zero line items, zero KOT associations, and ₹0.00 tax collected. If a room folio bill is generated from restaurant room service (`settlement_type == "Settle To Room"` at line 1943), `folio_item.cgst_amount` and `folio_item.sgst_amount` are computed as `round(0.0 / 2.0, 2) = 0.0`. Room folio invoices understate GST payable to the government.

---

### 1.5 Petty Expenses Date & Category Filter Query Dropping
* **Frontend Location:** [src/services/api.ts:722-731](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/src/services/api.ts#L722-L731)
* **Backend Location:** [backend/app/routes/pms.py:2000-2003](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/pms.py#L2000-L2003)
* **HTTP Method:** `GET`
* **Requested URL:** `${API_BASE_URL}/pms/expenses?start_date=...&end_date=...&category=...`
* **Disconnection Diagnosis:**
  `hotelApi.getPettyExpenses()` appends `start_date`, `end_date`, and `category` as query parameters.
  However, in `backend/app/routes/pms.py`, the endpoint definition is:
  ```python
  @router.get("/expenses", response_model=List[schemas.PettyExpenseResponse])
  def list_petty_expenses(limit: int = 150, db: Session = Depends(get_db)):
      return db.query(models.PettyExpense).order_by(models.PettyExpense.id.desc()).limit(limit).all()
  ```
  The router accepts only `limit`. It completely ignores `start_date`, `end_date`, and `category`.
* **Failure Mode & Operational Impact:**
  The frontend UI displays unfiltered expenses regardless of the date range chosen by the general manager or auditor. End-of-month expense reconciliation and department-specific expense summaries fail to filter properly.

---

### 1.6 Restaurant Food Bills Date Query Parameter Dropping
* **Frontend Location:** [src/services/api.ts:700-708](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/src/services/api.ts#L700-L708)
* **Backend Location:** [backend/app/routes/pms.py:1967-1970](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/pms.py#L1967-L1970)
* **HTTP Method:** `GET`
* **Requested URL:** `${API_BASE_URL}/pms/food-bills?start_date=...&end_date=...`
* **Disconnection Diagnosis:**
  In `backend/app/routes/pms.py`:
  ```python
  @router.get("/food-bills", response_model=List[schemas.FoodBillResponse])
  def list_food_bills(limit: int = 100, db: Session = Depends(get_db)):
      return db.query(models.FoodBill).order_by(models.FoodBill.id.desc()).limit(limit).all()
  ```
  `list_food_bills` accepts only `limit: int = 100`. It does not accept date range filters.
* **Failure Mode & Operational Impact:**
  Auditing restaurant food revenue for specific accounting periods or shift handovers is impossible via the API, as the backend always returns the latest 100 records across all dates.

---

### 1.7 Checkout Flow Architectural Bifurcation & WebSocket Event Bypass
* **Frontend Location:** [src/components/pms/RoomCheckOutModal.tsx:431-438](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/src/components/pms/RoomCheckOutModal.tsx#L431-L438)
* **Backend Location:** [backend/app/routes/pms.py:701-768](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/pms.py#L701-L768) vs [backend/app/routes/pms.py:2901-3037](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/pms.py#L2901-L3037)
* **Disconnection Diagnosis:**
  The backend contains two competing, parallel checkout endpoints:
  1. `POST /api/v1/pms/check-out` (`execute_check_out` at line 701): Acquires canonical row-level locks (`acquire_canonical_locks`), updates booking to `Checked-Out`, sets room to `Dirty`, generates audit log (`log_audit`), and broadcasts real-time WebSocket events (`ws_manager.emit_booking_event_sync` and `ws_manager.emit_room_status_event_sync`).
  2. `POST /api/v1/pms/checkouts` (`save_checkout` at line 2901): Inserts `CheckoutRecord`, updates room to `Dirty`, but **does NOT acquire canonical locks**, **does NOT generate an audit log**, and **does NOT emit WebSocket broadcasts**.
  In `src/components/pms/RoomCheckOutModal.tsx` line 433:
  ```typescript
  await hotelApi.saveCheckout(checkoutData);
  ```
  The frontend calls `hotelApi.saveCheckout()` which hits `/api/v1/pms/checkouts`.
* **Failure Mode & Operational Impact:**
  `execute_check_out` is completely bypassed. When a front-desk agent completes a checkout, other reception consoles and housekeeping tablets never receive the real-time WebSocket event (`CHECK_OUT` and `ROOM_STATUS_CHANGED`). Other terminals continue to show the room as occupied until manual browser refresh.

---

### 1.8 Unhandled Double-Entry Financial Journal Cloud Synchronization
* **Frontend Location:** [src/components/pms/RoomCheckOutModal.tsx:441-512](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/src/components/pms/RoomCheckOutModal.tsx#L441-L512), [src/services/pmsStore.ts:3656](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/src/services/pmsStore.ts#L3656)
* **Backend Location:** [backend/app/routes/pms.py:3430-3460](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/pms.py#L3430-L3460)
* **Disconnection Diagnosis:**
  Upon final checkout, `RoomCheckOutModal.tsx` dispatches multiple journal vouchers (Receipt, Room Revenue, Output CGST, Output SGST) via `PmsStore.postJournalEntry()`.
  Inside `src/services/pmsStore.ts` line 3656:
  ```typescript
  hotelApi.postJournalEntry(fullEntry).catch(e => console.warn('[PmsStore] Journal entry background cloud sync note:', e));
  ```
  The API call is fired as an unawaited background promise with an empty error catcher.
* **Failure Mode & Operational Impact:**
  If the network drops or the backend returns an error (such as validation failure or database lock timeout), `localStorage` records the journal entry, but PostgreSQL receives nothing. The user receives no notification, and no offline retry queue persists the unsynced entries. The cloud trial balance immediately drifts from the physical reception ledger.

---

### 1.9 Mixed-Content Hardware Bridge Integration Risk
* **Frontend Location:** [src/services/api.ts:445, 454, 468](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/src/services/api.ts#L445)
* **Disconnection Diagnosis:**
  `hotelApi` defines direct calls to an unencrypted local IP address:
  * `http://127.0.0.1:8080/status` (Hardware bridge status)
  * `http://127.0.0.1:8080/print-receipt` (ESC/POS thermal printer)
  * `http://127.0.0.1:8080/encode-keycard` (RFID keycard encoder)
* **Failure Mode & Operational Impact:**
  The frontend is served over HTTPS via Cloudflare Pages (`https://hotel-sai-vasudev-residency.pages.dev`). Modern browsers (Chrome, Edge) strictly enforce Private Network Access (PNA) and Mixed Content restrictions on requests from HTTPS origins to `http://127.0.0.1`. The browser blocks thermal printing and RFID keycard encoding before network transmission unless local loopback certificates or a browser flag override are present.

---

## PILLAR 2: DATABASE & TRANSACTION SILOS

### 2.1 Walk-In Check-In Master Folio Omission & Missing Rollback Wrapper
* **File & Line Range:** [backend/app/routes/pms.py:576-698](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/pms.py#L576-L698) (`execute_walk_in_check_in`)
* **Tables Mutated:** `bookings`, `booking_payments`, `rooms`, `police_station_logs`, `audit_logs`
* **Forensic Diagnosis:**
  1. **Complete Folio Ledger Silo:** In standard bookings (`backend/app/routes/bookings.py:151-163`), creating a booking automatically instantiates a primary Master Folio in `models.Folio`. In `execute_walk_in_check_in`, `models.Folio` is **never instantiated**. Walk-in guests have active bookings and occupied rooms, but zero master folio records in the database.
  2. **Advance Receipt Ledger Silo:** When a walk-in guest pays an advance tariff at reception (e.g. ₹3,000 cash), a `BookingPayment` is added, but no corresponding entry is added to `advance_receipts` or `general_receipts`.
  3. **Absence of Atomic Rollback:** Lines 576–698 execute mutations across 5 tables without a `try...except Exception: db.rollback()` block. If `PoliceStationLog` validation fails or WebSocket broadcasting raises an error, earlier changes remain uncommitted or fail without atomic reversion.
* **Failure Mode & Operational Impact:**
  Querying Master Folios for room billing fails to locate a linked folio. Billing reconciliation reports omit walk-in revenue, and front-desk audits reveal cash collected without advance receipt vouchers.

---

### 2.2 Competing Checkout Endpoints & Lack of Atomic Rollback
* **File & Line Range:**
  * Endpoint A: [backend/app/routes/pms.py:701-768](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/pms.py#L701-L768) (`execute_check_out`)
  * Endpoint B: [backend/app/routes/pms.py:2901-3037](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/pms.py#L2901-L3037) (`save_checkout`)
* **Tables Mutated:** `bookings`, `booking_payments`, `rooms`, `checkout_records`, `audit_logs`
* **Forensic Diagnosis:**
  1. `execute_check_out` updates `Booking` status to `Checked-Out`, updates `Room.housekeeping_status` to `Dirty`, inserts `BookingPayment`, and records `AuditLog`. However, it **never writes to `checkout_records`** and **never sets `models.Folio.status = 'SETTLED'`**.
  2. `save_checkout` writes to `checkout_records`, updates `Room.housekeeping_status`, and sets `Booking.status = 'Checked-Out'`. However, it **does not acquire canonical row locks**, **does not log audit events**, and **does not update `models.Folio`**.
  3. Neither endpoint wraps its multi-table operations in a `try...except Exception: db.rollback()` block.
* **Failure Mode & Operational Impact:**
  `models.Folio` remains in an `OPEN` state forever after guest departure, distorting accounts receivable. Running night audits flags checked-out rooms as having unsettled active folios.

---

### 2.3 Folio Discount Ledger Isolation
* **File & Line Range:** [backend/app/routes/pms.py:1847-1893](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/pms.py#L1847-L1893) (`apply_folio_discount`)
* **Tables Mutated:** `bookings`, `folio_discount_records`, `audit_logs`
* **Forensic Diagnosis:**
  When a manager grants a courtesy or promotional discount (e.g. ₹500 off), `apply_folio_discount` updates `booking.discount_amount`, `booking.total_price`, and `booking.balance_due`, and inserts a `FolioDiscountRecord`.
  However, it **never updates `models.Folio`**.
  `models.Folio.total_charges` and `models.Folio.balance_due` remain unadjusted.
  Furthermore, the endpoint does not use a `try...except Exception: db.rollback()` block.
* **Failure Mode & Operational Impact:**
  The `Booking` record reflects the discounted price, while the `Folio` record retains the original undiscounted price. When the guest checks out, the master folio invoice displays the undiscounted total, resulting in disputes at the front desk.

---

### 2.4 Restaurant Food Bill Folio & Accounting Ledger Isolation
* **File & Line Range:** [backend/app/routes/pms.py:1904-1965](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/pms.py#L1904-L1965) (`save_food_bill`)
* **Tables Mutated:** `food_bills`, `room_folio_items`, `bookings`, `dining_tables`
* **Forensic Diagnosis:**
  When restaurant room service is billed to a guest room (`settlement_type == "Settle To Room"` at line 1931):
  1. A `RoomFolioItem` is inserted.
  2. `booking.total_price` and `booking.balance_due` are increased.
  3. `dining_tables.status` is updated to `Vacant`.
  However, **`models.Folio` is never updated**. `folio.total_charges` remains unadjusted.
  Moreover, no corresponding entry is posted to `journal_entries` or general ledger tables.
  There is no `try...except: db.rollback()` block protecting the transaction.
* **Failure Mode & Operational Impact:**
  A failure during table status update or folio item insertion leaves partial database state committed. Furthermore, restaurant revenue billed to rooms is omitted from Master Folio exports.

---

### 2.5 Relational Integrity & Missing Foreign Key Review
* **File Location:** [backend/app/models.py](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/models.py)
* **Forensic Diagnosis:**
  An audit of foreign key constraints and indexes across `backend/app/models.py` reveals multiple unconstrained text columns masquerading as relationships:

| Table Name | Column Name | Current Type | Missing Foreign Key Target | Missing Cascade / Index Risk |
| :--- | :--- | :--- | :--- | :--- |
| `folio_discount_records` | `booking_ref` (line 456) | `String(100)` | `bookings.booking_ref` | Orphaned discount records if booking is deleted |
| `advance_receipts` | `room_no` (line 532) | `String(50)` | `rooms.name` | Cannot verify if room exists; unindexed |
| `food_bills` | `room_no` (line 422) | `String(50)` | `rooms.name` | Unconstrained text; typos break room billing |
| `food_bills` | `table_no` (line 423) | `String(50)` | `dining_tables.table_code` | Orphaned restaurant billing records |
| `checkout_records` | `room_no` (line 490) | `String(50)` | `rooms.name` | Missing FK constraint |
| `housekeeping_records` | `room_no` (line 977) | `String(20)` | `rooms.name` | Dirty/clean status unlinked from physical room table |
| `agent_commission_accruals` | `agent_id` (line 993) | `String(100)` | `commission_agents.agent_id` | Accruals persist even if agent profile is deleted |
| `agent_payout_vouchers` | `agent_id` (line 691) | `String(100)` | `commission_agents.agent_id` | Missing relational validation |
| `table_sessions` | `table_no` (line 1132) | `String(50)` | `dining_tables.table_code` | Unindexed, unconstrained session tracking |
| `room_folio_items` | `booking_id` (line 140) | `Integer, FK` | `bookings.id` | Missing `ondelete="CASCADE"`; deleting booking fails FK check |
| `booking_payments` | `booking_id` (line 104) | `Integer, FK` | `bookings.id` | Missing `ondelete="CASCADE"`; leaves orphaned payments |
| `room_shifts` | `booking_id` (line 166) | `Integer, FK` | `bookings.id` | Missing `ondelete="CASCADE"`; room shift history blocks deletion |

---

## PILLAR 3: CLOUDFLARE R2 OBJECT STORAGE SILOS

```
                    NON-ATOMIC STORAGE VULNERABILITY FLOW
                    
    [Client KYC/Invoice Upload]
                │
                ▼
    1. Upload bytes directly to Cloudflare R2 Bucket
       (r2_service.upload_file -> object_key created)
                │
                ▼
    2. Execute PostgreSQL database commit:
       booking.id_proof_document_key = object_key
       db.commit() ────► [DB FAILS: Lock Timeout / DB Disconnect / Constraint Error]
                │                       │
                ▼                       ▼
    [DB SUCCESS]                [TRANSACTION ROLLS BACK]
    File key saved in DB.       PostgreSQL forgets object_key.
                                BUT R2 file was NOT deleted!
                                        │
                                        ▼
                                Permanent Orphan in Cloudflare R2:
                                - Wasted storage costs
                                - Leaked private Aadhaar/PII
                                - Ghost file with zero DB owner
```

### 3.1 Orphaned Identity Documents on Failed Database Commit
* **File & Line Range:** [backend/app/routes/uploads.py:255-312](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/uploads.py#L255-L312) (`upload_booking_kyc_document`)
* **Forensic Diagnosis:**
  In `upload_booking_kyc_document`:
  1. Line 286 deletes the old document key from R2: `r2_service.delete_file(booking.id_proof_document_key)`.
  2. Line 290 uploads the new document to R2: `object_key, _ = r2_service.upload_file(...)`.
  3. Line 298 assigns `booking.id_proof_document_key = object_key`.
  4. Line 301 executes `db.commit()`.
  If `db.commit()` raises an exception (such as a connection dropout, serialization conflict, or database constraint violation):
  * The database transaction rolls back.
  * The newly uploaded file at `object_key` remains in Cloudflare R2 indefinitely with no database record referencing it (**Orphaned File**).
  * Simultaneously, the previous file was already deleted in step 1. PostgreSQL still points to the old key, which no longer exists in R2 (**Broken URL Reference**).
  * No compensating transaction exists to delete the uploaded file upon commit failure.
* **Failure Mode & Operational Impact:**
  Confidential guest identity proofs (Aadhaar cards, passports) become permanently orphaned in private storage buckets, while PostgreSQL points to missing files, causing 404 errors during police inspections.

---

### 3.2 Orphaned Tax Invoices on Failed Database Commit
* **File & Line Range:** [backend/app/routes/uploads.py:414-445](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/uploads.py#L414-L445) (`upload_booking_invoice_pdf`)
* **Forensic Diagnosis:**
  Line 428 uploads the generated PDF directly to Cloudflare R2 under `invoices/`.
  Line 435 binds `booking.invoice_pdf_key = object_key`.
  Line 436 executes `db.commit()`.
  If `db.commit()` fails, the invoice PDF remains stored in Cloudflare R2 with no database association.
* **Failure Mode & Operational Impact:**
  Archived GST tax invoices accumulate in storage with no database reference, increasing storage costs and creating unreferenced financial records.

---

### 3.3 Direct Guest-ID Uploads without Database Binding
* **File & Line Range:** [backend/app/routes/uploads.py:110-137](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/uploads.py#L110-L137) (`upload_guest_id_endpoint`)
* **Forensic Diagnosis:**
  `POST /api/v1/uploads/guest-id` accepts an uploaded file and a form parameter `booking_ref = Form("WALKIN")`.
  Line 121 uploads the file to `guest_ids/` and returns `object_key` and a temporary pre-signed URL.
  It **never links or binds the `object_key` to any database table**.
  If a guest at reception uploads their Aadhaar card but leaves before completing registration, or if the browser tab crashes, the document remains in R2 indefinitely.
* **Failure Mode & Operational Impact:**
  Unlinked PII identity documents accumulate in Cloudflare R2 without an associated booking or customer profile, violating data minimization principles under the Digital Personal Data Protection (DPDP) Act.

---

### 3.4 Booking Cancellation Storage Leakage
* **File & Line Range:** [backend/app/routes/bookings.py:192-222](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/bookings.py#L192-L222) (`update_booking_status`)
* **Forensic Diagnosis:**
  When a booking status is patched to `Cancelled`, the system sets `booking.status = "Cancelled"`.
  However, neither `booking.id_proof_document_key` nor `booking.invoice_pdf_key` is purged from Cloudflare R2.
* **Failure Mode & Operational Impact:**
  Cancelled bookings retain sensitive KYC documents and invalid invoice PDFs in storage indefinitely, with no lifecycle policy or automatic purging mechanism.

---

## PILLAR 4: ACCOUNTING & DECENTRO VULNERABILITIES

### 4.1 IEEE-754 Binary Floating-Point Financial Representation Flaw
* **File Location:** [backend/app/models.py](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/models.py) (across 28 models), [backend/app/routes/bookings.py:38-63](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/bookings.py#L38-L63) (`compute_tax_and_pricing`)
* **Affected Columns in `models.py`:**
  * `Room.price_per_night` (line 23)
  * `Booking.base_rate`, `base_amount`, `gst_rate`, `cgst_amount`, `sgst_amount`, `total_tax`, `total_price`, `total_paid`, `balance_due` (lines 67–80)
  * `BookingPayment.amount` (line 111)
  * `RoomFolioItem.unit_price`, `taxable_amount`, `cgst_amount`, `sgst_amount`, `total_amount` (lines 145–150)
  * `DailyNightAudit.total_room_revenue`, `total_food_revenue`, `total_gst_collected`, `cash_in_drawer`, `card_total`, `upi_total` (lines 215–222)
  * `PaymentTransaction.amount` (line 378)
  * `FoodBill.food_gross_amount`, `discount_amount`, `taxable_amount`, `gst_amount`, `net_bill_amount` (lines 427–432)
  * `PettyExpense.amount` (line 444)
  * `FolioDiscountRecord.discount_value`, `discount_amount` (lines 460–461)
  * `CheckoutRecord.per_day_tariff`, `total_room_rent`, `food_amount`, `gst_amount`, `cgst_amount`, `sgst_amount`, `bill_amount`, `net_payable` (lines 500–511)
  * `Folio.total_charges`, `total_payments`, `balance_due` (lines 1306–1308)
  * `PartyAccount.balance` (line 815)
* **Forensic Diagnosis:**
  All currency and tax attributes are defined as `Column(Float)` instead of `Column(Numeric(12, 2))` or integer paise (`Column(BigInteger)`).
  Binary floating-point numbers cannot accurately represent decimal fractions (e.g., `0.1 + 0.2 = 0.30000000000000004`).
  In `compute_tax_and_pricing` ([backend/app/routes/bookings.py:38-63](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/bookings.py#L38-L63)):
  ```python
  total_tax = round(taxable_value * (gst_rate / 100.0), 2)
  cgst_amount = round(total_tax / 2.0, 2)
  sgst_amount = round(total_tax - cgst_amount, 2)
  ```
  When summing floating-point tax amounts across hundreds of room nights or restaurant food bills in PostgreSQL:
  ```sql
  SELECT SUM(cgst_amount) FROM bookings; -- Yields drift like 14250.000000000004
  ```
* **Statutory Compliance & Legal Impact:**
  Under Indian GST law (Section 170 of the CGST Act, 2017), tax rounding must be done to the nearest whole rupee or exact paisa. Floating-point precision drift creates discrepancies between GSTR-1 outward supply summaries and GSTR-3B tax returns, exposing the hotel to tax scrutiny, penalties, and audit reconciliation failures.

---

### 4.2 Decentro Webhook Non-Idempotent Payment Double-Crediting
* **File & Line Range:** [backend/app/routes/payments.py:78-125](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/payments.py#L78-L125) (`process_decentro_webhook_background`)
* **Forensic Diagnosis:**
  When Decentro delivers a payment callback webhook:
  ```python
  if status == "SUCCESS":
      txn.status = "SUCCESS"
      ...
      if booking:
          booking.total_paid = round((booking.total_paid or 0.0) + txn.amount, 2)
          booking.balance_due = max(0.0, round(booking.total_price - booking.total_paid, 2))
          ...
          bp = BookingPayment(
              booking_id=booking.id,
              payment_type="Settlement",
              payment_mode="UPI (Decentro)",
              amount=txn.amount,
              transaction_ref=bank_ref,
              ...
          )
          db.add(bp)
  ```
  **CRITICAL VULNERABILITY:**
  The background worker checks `if status == "SUCCESS"`, but **does NOT check whether `txn.status` was ALREADY `"SUCCESS"`**.
  Decentro guarantees at-least-once webhook delivery. If Decentro retries an event due to a transient network timeout, or if an attacker replays the webhook payload:
  1. `txn.amount` is added to `booking.total_paid` a second time.
  2. A duplicate `BookingPayment` row is inserted into the database.
  3. `folio.total_payments` is incremented again.
* **Failure Mode & Financial Loss:**
  A guest paying ₹2,500 via UPI QR will be credited ₹5,000 in the folio if the webhook retries. The hotel system marks the guest as having overpaid, creating an erroneous refund obligation.

---

### 4.3 Missing Unique Constraint on Bank Reference Number (UTR Replay Attack)
* **File Location:** [backend/app/models.py:384](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/models.py#L384), [backend/app/models.py:112](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/models.py#L112)
* **Forensic Diagnosis:**
  In `models.PaymentTransaction`:
  ```python
  bank_reference_number = Column(String(100), nullable=True, index=True)
  ```
  In `models.BookingPayment`:
  ```python
  transaction_ref = Column(String(100), nullable=True)
  ```
  Neither column enforces a `unique=True` database constraint.
  An attacker can capture a legitimate UPI transaction UTR from an earlier stay, submit it as the payment reference for a new room reservation or checkout settlement, and the system will accept the UTR without detecting that it was already used for a prior transaction.
* **Failure Mode & Fraud Vulnerability:**
  Replay attacks using previously settled bank UTRs allow malicious actors to confirm bookings and check out without transferring actual funds to the hotel's bank account.

---

### 4.4 Out-of-Order Webhook Status Downgrade Vulnerability
* **File & Line Range:** [backend/app/routes/payments.py:149-155](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/payments.py#L149-L155)
* **Forensic Diagnosis:**
  Lines 149–155 handle non-SUCCESS statuses:
  ```python
  else:
      txn.status = status
      if event_rec:
          event_rec.status = "PROCESSED"
          event_rec.processed_at = now_utc()
      db.commit()
      return True
  ```
  If a payment succeeded and was processed at time $T_0$, but an earlier queued webhook event (e.g. `PENDING` or `EXPIRED`) arrives out-of-order at time $T_1$ due to network delays:
  * Line 150 unconditionally overwrites `txn.status = "EXPIRED"`.
  * The transaction is downgraded from `SUCCESS` to `EXPIRED` in the database, even though money was collected.
* **Failure Mode & Operational Impact:**
  A paid transaction is recorded as expired or failed in the payment audit ledger, creating discrepancies between bank statements and software records.

---

## MASTER FORENSIC REMEDIATION MATRIX

| # | Severity | Pillar | Component / File | Line Numbers | Root Cause & Failure Mode | Remediation Blueprint |
| :---: | :---: | :---: | :--- | :--- | :--- | :--- |
| **1** | **CRITICAL** | Accounting & Banking | [backend/app/routes/payments.py](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/payments.py) | 78–125 | Decentro webhook worker lacks status idempotency; retried webhooks credit `booking.total_paid` and `folio.total_payments` multiple times. | Check `if txn.status == "SUCCESS": return True` before applying payment credits. |
| **2** | **CRITICAL** | Accounting & Banking | [backend/app/models.py](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/models.py) | 112, 384 | `bank_reference_number` and `transaction_ref` lack `unique=True` constraints, enabling UTR replay attacks. | Add `UniqueConstraint("bank_reference_number")` and validate unique UTRs before settlement. |
| **3** | **CRITICAL** | Accounting & Banking | [backend/app/models.py](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/models.py) | 23, 67–80, 111, 145–150, 427–432, 500–511, 1306–1308 | Universal `Float` usage across 28 financial models causes IEEE-754 precision drift on GST taxes (SAC 996311 / 996331). | Migrate all monetary/tax columns to `Numeric(12, 2)` and enforce integer paise calculations. |
| **4** | **CRITICAL** | Frontend-Backend | [src/services/pmsStore.ts](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/src/services/pmsStore.ts) | 7776–7793 | Food bill sync sends `kot_numbers_json` and `items_json` as strings; drops items and tax to `"[]"` and `₹0.00` in PostgreSQL. | Align payload keys with `schemas.FoodBillCreate`: send `kot_numbers`, `items`, `food_gross_amount`, and `gst_amount`. |
| **5** | **HIGH** | Database & Silos | [backend/app/routes/pms.py](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/pms.py) | 576–698 | Walk-in check-in mutates 5 tables without `db.rollback()` and omits creating a Master `Folio` record. | Add `try...except: db.rollback()` and instantiate primary `models.Folio` matching standard bookings. |
| **6** | **HIGH** | Database & Silos | [backend/app/routes/pms.py](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/pms.py) | 701–768 vs 2901–3037 | Dual competing checkout endpoints: `save_checkout` bypasses canonical row locks, audit logs, and WebSocket broadcasts. | Unify checkout logic into a single atomic workflow that updates `Booking`, `Room`, `CheckoutRecord`, and `Folio`. |
| **7** | **HIGH** | R2 Storage Silos | [backend/app/routes/uploads.py](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/uploads.py) | 284–302, 428–437 | Failed `db.commit()` leaves orphaned identity files and invoices in R2, while DB points to missing/deleted keys. | Implement compensating transaction: delete newly uploaded R2 key if `db.commit()` raises an exception. |
| **8** | **HIGH** | R2 Storage Silos | [backend/app/routes/uploads.py](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/routes/uploads.py) | 110–137 | Direct guest-ID upload endpoint creates unbound files in R2 with no database linkage. | Require `booking_id` or link document key directly within the guest registration transaction. |
| **9** | **MEDIUM** | Frontend-Backend | [src/services/api.ts](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/src/services/api.ts) | 96 | `checkHealth()` calls `${rootUrl}/health` which does not exist in FastAPI; status always returns "offline". | Route probe to `${API_BASE_URL}/health/ready` or add root `/health` alias in `main.py`. |
| **10** | **MEDIUM** | Frontend-Backend | [src/services/decentroApi.ts](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/src/services/decentroApi.ts) | 361 | Primary GSTIN verification calls `/api/v1/kyc/...` which returns 404 because `kyc.router` is mounted only under `/api`. | Mount `kyc.router` under `settings.API_V1_STR` (`/api/v1`) in `main.py`. |
| **11** | **MEDIUM** | Frontend-Backend | [src/services/api.ts](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/src/services/api.ts) | 1668, 1678, 1688 | `getAgentCommissions` calls `/pms/agent-commissions` instead of `/pms/agent-commission-accruals`. | Update frontend URLs to match backend route or add URL aliases in `pms.py`. |
| **12** | **MEDIUM** | Frontend-Backend | [src/services/api.ts](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/src/services/api.ts) | 704, 728 | Query parameters (`start_date`, `end_date`, `category`) are dropped by `list_petty_expenses` and `list_food_bills`. | Add query filtering parameters (`start_date: Optional[str] = None`, etc.) to backend router functions. |
| **13** | **MEDIUM** | Database & Silos | [backend/app/models.py](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/backend/app/models.py) | 140, 166, 422, 456, 490, 532, 691, 993 | Foreign keys missing on discount records, advance receipts, food bills, and commissions; missing cascade on delete. | Add explicit `ForeignKey` constraints, indexes, and `ondelete="CASCADE"` on dependent child tables. |
| **14** | **LOW** | Frontend-Backend | [src/services/api.ts](file:///c:/Users/rakes/hotel%20SAI%20VASUDEV%20RESIDENCY/src/services/api.ts) | 445, 454, 468 | Hardcoded HTTP localhost URLs for hardware bridge trigger mixed-content blocks in HTTPS browsers. | Implement secure WebSocket bridge (`wss://127.0.0.1:8443`) or local print proxy service. |

---

## CONCLUSION & HANDOVER READINESS VERDICT

The system demonstrates solid architectural foundations: robust multi-layer CORS configurations, canonical database locking primitives (`acquire_canonical_locks`), Decentro circuit breakers, and Cloudflare R2 presigned URL support.

However, commercial handover cannot proceed until the **Critical** and **High** vulnerabilities identified above are addressed. Specifically:
1. The Decentro webhook double-crediting bug and missing UTR uniqueness constraints present financial exposure.
2. The IEEE-754 `Float` precision representation introduces statutory tax compliance risks under Indian GST rules.
3. The restaurant food bill payload mismatch results in permanent data loss in PostgreSQL.
4. Non-atomic database and storage mutations risk inconsistent database state and orphaned PII files.

Addressing these issues in Phase 2 will ensure commercial-grade stability, data consistency, and regulatory compliance.
