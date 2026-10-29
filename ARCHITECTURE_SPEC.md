# Hotel Sai Vasudev Residency — Enterprise Architecture Specification
**Domain:** `sai-vasudev-residency.pages.dev`  
**System:** Enterprise PMS, Booking Engine, POS/KOT & Financial ERP

---

## 1. System Technology Stack
- **Frontend:** React (Vite, TypeScript) hosted on Cloudflare Pages + Dexie.js (IndexedDB) for local caching & offline resilience.
- **Backend:** Python FastAPI (Async) hosted on Railway.
- **Database:** PostgreSQL (Async SQLAlchemy + asyncpg + Alembic) hosted on Railway.
- **Storage:** Cloudflare R2 (S3-compatible via boto3, pre-signed temporary URLs).
- **Banking & Compliance:** Decentro Banking Hub APIs (Dynamic UPI QR, Virtual Account RTGS/NEFT collections, Supplier Payouts, GSTIN Verification).

---

## 2. Core Architectural Directives
- **Zero Double-Booking Guarantee:** Pessimistic locking (`with_for_update`) during room allocation, PostgreSQL exclusion constraints/triggers for date overlap prevention, and optimistic concurrency (`version_id`) on master records.
- **Financial & Idempotency Integrity:** Mandatory `X-Idempotency-Key` on financial/transactional POST routes, raw webhook ingestion with HMAC-SHA256 verification, and Dead Letter Queue (DLQ) with replay capabilities.
- **Resilience:** Circuit breaker and retry mechanisms on outbound banking calls; offline queue and synchronization in frontend POS/KOT.
- **Security & Privacy:** Fernet encryption for guest PII, private R2 document access via 60s pre-signed URLs, role-based access control (RBAC), and immutable audit logs.
- **Observability & DevOps:** Centralized `/api/v1` versioning, live/ready health checks, structured JSON logging with correlation IDs, and automated R2 database backups.

---

## 3. The 6 Architecture Modules (42 System Design Requirements)

### MODULE 1: Decentro Financial Integrity & Asynchronous Webhooks
1. **Idempotency Middleware (#1):** Require `X-Idempotency-Key` header on all POST routes for bookings, folio settlements, KOT creation, and Decentro payouts. Store `(idempotency_key, endpoint, request_hash, response_status, response_body, created_at)` in PostgreSQL `idempotency_keys` table with 24-hour TTL cleanup.
2. **Decentro Outbound Client Timeouts (#10):** Wrap `httpx.AsyncClient` calls to Decentro APIs with strict timeouts (`connect=5.0s`, `read=10.0s`).
3. **Decentro Retry Mechanism (#11):** Tenacity retries with exponential backoff + jitter (only on network timeouts and 5xx errors for idempotent operations).
4. **Decentro Circuit Breaker (#12):** In-memory Circuit Breaker that trips after 5 consecutive failures.
5. **Decentro Fallback Response (#13):** Clean fallback instruction returning "Switch to Manual Front-Desk POS/Cash Mode" when circuit is OPEN.
6. **Decentro HMAC-SHA256 Webhook Verification (#17):** Verify inbound `POST /api/v1/webhooks/decentro` signatures against `DECENTRO_WEBHOOK_SECRET`.
7. **Webhook Event Ingestion & Idempotency (#36):** Persist raw incoming webhook events immediately to `webhook_events` table (`PENDING`, `PROCESSED`, `FAILED`), ignoring duplicate `decentro_txn_id` callbacks.
8. **Asynchronous Webhook Processing (#38):** Process folio balance updates and R2 PDF receipt generation via FastAPI `BackgroundTasks`.
9. **Webhook DLQ & Replay Mechanism (#39):** Move failed webhooks to `failed_webhook_dlq` after 3 failed retries. Expose `GET /api/v1/admin/dlq/replay` and `POST /api/v1/admin/dlq/replay` for administrative recovery.

### MODULE 2: Zero Double-Booking Concurrency & PostgreSQL Optimization
10. **Async Connection Pool Tuning (#4):** Configure `create_async_engine` with `pool_size=10`, `max_overflow=20`, and `pool_pre_ping=True`.
11. **Deadlock Prevention & Lock Timeout (#15):** Set PostgreSQL session `lock_timeout = '5s'`. Enforce canonical lock acquisition order (`Booking -> Folio -> Room`).
12. **Pessimistic Locking (#14):** Utilize `SELECT ... FOR UPDATE` (`.with_for_update()`) during room allocation and folio balance settlement.
13. **Exclusion Constraint / Date-Overlap Prevention (#25):** Add PostgreSQL GiST exclusion constraint (`tsrange` on check_in, check_out) or date-overlap enforcement ensuring no overlapping active (`CONFIRMED`, `CHECKED_IN`) bookings exist for the same `room_id`.
14. **Optimistic Locking (#26):** Implement `version_id` integer column and concurrency check on `rooms`, `rate_plans`, and `guests` tables to return `409 Conflict` on concurrent updates.
15. **Eager Loading Optimization (#5):** Eliminate N+1 queries on Room Rack, Tape Chart, and KOT dashboards using `selectinload()` and `joinedload()`.
16. **Composite Indexing: Bookings & Folios (#20):** Create composite B-Tree indexes on `bookings(check_in, check_out, status)` and `folios(booking_id, status)`.
17. **Composite Indexing: Orders & Guests (#21):** Create composite B-Tree indexes on `kot_orders(room_id, status)` and `guests(phone, gstin)`.
18. **Alembic Schema Version Tracking (#23):** Maintain clean migration version history and autogenerate scripts.
19. **Strict UTC/IST Timezone Handling (#24):** Store all timestamps in `TIMESTAMPTZ` (UTC) and convert explicitly to `Asia/Kolkata` (IST) in business logic.
20. **Automated IST Night Audit Scheduler (#41, #94):** Run APScheduler daily at 23:59 IST with `pg_try_advisory_lock` to post room tariff + CGST/SGST, mark no-shows, and snapshot daily revenue.

### MODULE 3: Real-Time WebSockets, Caching & Offline Sync
21. **Multi-Channel WebSocket Architecture (#16):** WebSocket endpoint `/api/v1/ws/{channel}` supporting channels: `front_desk`, `kitchen_kds`, `housekeeping`.
22. **WebSocket Heartbeat & Connection Cleanup (#54):** 30-second ping/pong heartbeats, dead connection detection, and guaranteed cleanup in `finally` blocks.
23. **Instant Event Broadcasting (#80):** Real-time pub/sub notifications for KOT placement, food ready, and housekeeping room status (`DIRTY -> CLEAN -> INSPECTED`).
24. **In-Memory TTL Cache (#6):** In-memory TTL caching (`cachetools`) for public room tariffs and restaurant menu items.
25. **Cache Invalidation & Busting (#7):** Automatic eviction/invalidation of cached tariffs and menus upon Admin CRUD operations.
26. **Frontend Offline Dexie.js Caching (#33 - Part A):** React Dexie.js (IndexedDB) caching for active room rack state and menu items.
27. **Offline KOT Queue & Auto-Sync (#33 - Part B):** Local queuing of steward KOT orders during network outages with auto-sync and idempotency keys upon reconnection.

### MODULE 4: Hospitality RBAC, Security Hardening & Private R2 Storage
28. **JWT Access & Refresh Token Rotation (#47):** Short-lived access tokens (15m) + rotating HttpOnly/DB-backed refresh tokens (7d).
29. **Hospitality Role Guards (#48 - Part A):** Enforce strict RBAC dependencies for `OWNER`, `MANAGER`, `RECEPTIONIST`, `STEWARD`, `HOUSEKEEPING`.
30. **Immutable Audit Logs (#48 - Part B):** Log all privileged actions (tariff overrides, bill discounts, voided KOTs, manual settlements) to an immutable `audit_logs` table.
31. **Application-Layer PII Encryption (#50 - Part A):** Fernet symmetric encryption for sensitive guest identifiers (Aadhaar, Passport) prior to database insertion.
32. **Private R2 Document Storage & Pre-signed URLs (#50 - Part B, #77):** Upload guest ID proofs and GST tax invoices to private R2 buckets, validated for MIME type (`image/jpeg`, `image/png`, `application/pdf`) and max 5MB size, served via 60-second S3 pre-signed URLs.
33. **API Rate Limiting (#18):** Slowapi rate limiting configured on login (5/min), public booking engine (10/min), and Decentro endpoints.
34. **Strict CORS Policy (#19):** Whitelist strictly `https://sai-vasudev-residency.pages.dev` and explicit production custom domains.
35. **Pydantic-Settings & Configuration Validation (#42):** Type-safe environment settings with startup validation.
36. **Input Sanitization & Security Headers (#2, #44):** Free-text XSS sanitization and security response headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options).

### MODULE 5: DevOps Readiness, Automated R2 Backups & Observability
37. **Unified API Versioning Prefix (#74):** Ensure all REST routes are strictly organized under `/api/v1/*`.
38. **Liveness Health Probe (#75):** `GET /api/v1/health/live` returning instant server status.
39. **Readiness Health Probe (#76):** `GET /api/v1/health/ready` verifying active PostgreSQL pool connectivity (`SELECT 1`).
40. **Scheduled R2 Database Backups (#97):** Daily 03:00 IST scheduled task streaming compressed, encrypted `pg_dump` backups to Cloudflare R2 (`backups/db/sai-vasudev-YYYY-MM-DD.sql.gz`).
41. **Backup Retention & Pruning (#98):** Automated lifecycle deletion of database backups older than 30 days in R2.
42. **Structured JSON Logging & Critical Error Alerts (#100, #101, #103, #104):** JSON formatted logs with `X-Request-ID` correlation, execution duration, masked PII, and global exception hooks triggering instant webhook notifications on unhandled 500 errors and banking reconciliation failures.
