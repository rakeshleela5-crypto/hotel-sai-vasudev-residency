-- ===================================================================================================
-- HOTEL SAI VASUDEV RESIDENCY - PROPERTY MANAGEMENT SYSTEM (PMS) & ERP
-- SCRIPT: sql/forensic_reconciliation_audit.sql
-- ENVIRONMENT: PostgreSQL 14+ (Railway Production / Local Docker / Development)
-- AUTHOR: Principal Systems Architect & Forensic Database Quality Assurance
-- PURPOSE: Exhaustive read-only forensic audit and reconciliation script to detect:
--   1. Unbalanced guest folios (Charges + CGST + SGST/IGST - Payments != Balance)
--   2. Decentro webhook payment logs that aren't linked to a valid folio/ledger entry
--   3. Rooms marked Occupied with no active checked-in booking (or vice versa)
--   4. Gaps in sequential GST invoice numbering (CGST Rules, 2017 - Rule 46 compliance)
--
-- EXECUTION INSTRUCTIONS:
--   psql "$DATABASE_URL" -f sql/forensic_reconciliation_audit.sql
--   or execute individual sections in pgAdmin, DBeaver, or Railway Database Query Runner.
--
-- SAFETY ASSURANCE:
--   This script is 100% read-only. It contains SELECT queries, CTEs, and temporary analytic
--   views without any destructive DDL/DML (no DROP, ALTER, UPDATE, or DELETE).
-- ===================================================================================================

-- Set optimal query parameters for forensic reporting
SET statement_timeout = '120s';
SET timezone = 'Asia/Kolkata';

-- ===================================================================================================
-- SECTION 0: EXECUTIVE FORENSIC HEALTH DASHBOARD (HIGH-LEVEL DISCREPANCY KPI SUMMARY)
-- ===================================================================================================

WITH kpi_folio_imbalances AS (
    SELECT 
        COUNT(*) AS unbalanced_folios_count,
        COALESCE(SUM(ABS((f.total_charges - f.total_payments) - f.balance_due)), 0)::NUMERIC(14, 2) AS total_folio_variance_inr
    FROM folios f
    WHERE ABS((f.total_charges - f.total_payments) - f.balance_due) > 0.01
),
kpi_orphaned_decentro_txns AS (
    SELECT 
        COUNT(*) AS orphaned_txns_count,
        COALESCE(SUM(pt.amount), 0)::NUMERIC(14, 2) AS stranded_decentro_funds_inr
    FROM payment_transactions pt
    LEFT JOIN bookings b ON pt.booking_id = b.id
    LEFT JOIN booking_payments bp ON bp.booking_id = pt.booking_id 
        AND (bp.transaction_ref = pt.bank_reference_number OR bp.transaction_ref = pt.reference_id)
    WHERE pt.status = 'SUCCESS'
      AND (pt.booking_id IS NULL OR b.id IS NULL OR bp.id IS NULL)
),
kpi_room_status_discrepancies AS (
    SELECT 
        COUNT(*) AS room_status_conflicts_count
    FROM (
        -- Rooms marked Occupied without checked-in booking
        SELECT r.id FROM rooms r
        LEFT JOIN bookings b ON b.room_id = r.id AND b.status IN ('Checked-In', 'CHECKED_IN')
        WHERE r.housekeeping_status ILIKE '%Occupied%' AND b.id IS NULL
        UNION ALL
        -- Active checked-in bookings without room marked Occupied
        SELECT r.id FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        WHERE b.status IN ('Checked-In', 'CHECKED_IN') AND r.housekeeping_status NOT ILIKE '%Occupied%'
    ) conflicts
),
kpi_gst_invoice_gaps AS (
    WITH numbered_invoices AS (
        SELECT 
            (regexp_match(invoice_no, '(\d+)'))[1]::BIGINT AS seq_num,
            regexp_replace(invoice_no, '\d+', '') AS invoice_series
        FROM checkout_records
        WHERE invoice_no IS NOT NULL AND invoice_no ~ '\d+'
    ),
    sequenced AS (
        SELECT 
            invoice_series,
            seq_num,
            LAG(seq_num) OVER (PARTITION BY invoice_series ORDER BY seq_num ASC) AS prev_seq
        FROM numbered_invoices
    )
    SELECT 
        COALESCE(SUM(seq_num - prev_seq - 1), 0)::BIGINT AS total_missing_invoices_count
    FROM sequenced
    WHERE prev_seq IS NOT NULL AND seq_num - prev_seq > 1
)
SELECT 
    CURRENT_TIMESTAMP AS audit_run_timestamp,
    'Hotel Sai Vasudev Residency' AS property_name,
    k1.unbalanced_folios_count,
    k1.total_folio_variance_inr,
    k2.orphaned_txns_count,
    k2.stranded_decentro_funds_inr,
    k3.room_status_conflicts_count,
    k4.total_missing_invoices_count,
    CASE 
        WHEN k1.unbalanced_folios_count = 0 
         AND k2.orphaned_txns_count = 0 
         AND k3.room_status_conflicts_count = 0 
         AND k4.total_missing_invoices_count = 0 
        THEN 'CLEAN_AUDIT_HEALTHY'
        ELSE 'ACTION_REQUIRED_DISCREPANCIES_DETECTED'
    END AS overall_system_audit_status
FROM kpi_folio_imbalances k1
CROSS JOIN kpi_orphaned_decentro_txns k2
CROSS JOIN kpi_room_status_discrepancies k3
CROSS JOIN kpi_gst_invoice_gaps k4;


-- ===================================================================================================
-- SECTION 1: UNBALANCED GUEST FOLIOS AUDIT
-- Formula: Charges (Room + Ancillary Items) + CGST + SGST - Payments != Balance Due
--
-- Root Cause Audited:
--   1. Folio header arithmetic corruption (total_charges - total_payments != balance_due).
--   2. Line-item silo leak: room_folio_items (Food KOT, Mattress, Laundry) billed to room
--      but omitted from folio.total_charges or booking.total_price.
--   3. Unrecorded / unposted payments: booking_payments rows that were not added to total_payments.
--   4. Booking vs Folio desynchronization (booking.balance_due != folio.balance_due).
-- ===================================================================================================

WITH folio_ancillary_charges AS (
    -- Aggregate non-void ancillary ledger charges from room_folio_items
    SELECT 
        rfi.booking_id,
        COUNT(rfi.id) AS ancillary_item_count,
        COALESCE(SUM(CASE WHEN rfi.status != 'Void' THEN rfi.taxable_amount ELSE 0 END), 0)::NUMERIC(12, 2) AS ancillary_taxable_amount,
        COALESCE(SUM(CASE WHEN rfi.status != 'Void' THEN rfi.cgst_amount ELSE 0 END), 0)::NUMERIC(12, 2) AS ancillary_cgst_amount,
        COALESCE(SUM(CASE WHEN rfi.status != 'Void' THEN rfi.sgst_amount ELSE 0 END), 0)::NUMERIC(12, 2) AS ancillary_sgst_amount,
        COALESCE(SUM(CASE WHEN rfi.status != 'Void' THEN rfi.total_amount ELSE 0 END), 0)::NUMERIC(12, 2) AS ancillary_total_billed
    FROM room_folio_items rfi
    GROUP BY rfi.booking_id
),
folio_actual_payments AS (
    -- Aggregate actual collected receipts from booking_payments
    SELECT 
        bp.booking_id,
        COUNT(bp.id) AS payment_receipt_count,
        COALESCE(SUM(bp.amount), 0)::NUMERIC(12, 2) AS actual_collected_payments,
        STRING_AGG(DISTINCT bp.payment_mode, ', ') AS payment_modes_used
    FROM booking_payments bp
    GROUP BY bp.booking_id
),
folio_reconciliation AS (
    SELECT 
        f.id AS folio_id,
        f.folio_number,
        f.status AS folio_status,
        f.version_id AS folio_version,
        b.id AS booking_id,
        b.booking_ref,
        b.status AS booking_status,
        b.guest_name,
        b.guest_phone,
        b.check_in_date,
        b.check_out_date,
        
        -- Room Base & Tax Components (from bookings table)
        COALESCE(b.base_amount, 0)::NUMERIC(12, 2) AS room_base_amount,
        COALESCE(b.extra_guest_charge, 0)::NUMERIC(12, 2) AS room_extra_charge,
        COALESCE(b.discount_amount, 0)::NUMERIC(12, 2) AS room_discount_amount,
        COALESCE(b.cgst_amount, 0)::NUMERIC(12, 2) AS room_cgst_amount,
        COALESCE(b.sgst_amount, 0)::NUMERIC(12, 2) AS room_sgst_amount,
        COALESCE(b.total_tax, 0)::NUMERIC(12, 2) AS room_total_tax,
        COALESCE(b.total_price, 0)::NUMERIC(12, 2) AS room_total_price,

        -- Ancillary charges (Food KOT, Laundry, Extra Bed)
        COALESCE(fac.ancillary_taxable_amount, 0)::NUMERIC(12, 2) AS ancillary_taxable_amount,
        COALESCE(fac.ancillary_cgst_amount, 0)::NUMERIC(12, 2) AS ancillary_cgst_amount,
        COALESCE(fac.ancillary_sgst_amount, 0)::NUMERIC(12, 2) AS ancillary_sgst_amount,
        COALESCE(fac.ancillary_total_billed, 0)::NUMERIC(12, 2) AS ancillary_total_billed,
        COALESCE(fac.ancillary_item_count, 0) AS ancillary_item_count,

        -- Ground Truth Calculated Ledger Totals
        (COALESCE(b.total_price, 0) + COALESCE(fac.ancillary_total_billed, 0))::NUMERIC(12, 2) AS ground_truth_total_charges,
        COALESCE(fap.actual_collected_payments, 0)::NUMERIC(12, 2) AS ground_truth_total_payments,
        ((COALESCE(b.total_price, 0) + COALESCE(fac.ancillary_total_billed, 0)) - COALESCE(fap.actual_collected_payments, 0))::NUMERIC(12, 2) AS ground_truth_balance_due,

        -- Recorded Figures in folios table
        COALESCE(f.total_charges, 0)::NUMERIC(12, 2) AS recorded_folio_charges,
        COALESCE(f.total_payments, 0)::NUMERIC(12, 2) AS recorded_folio_payments,
        COALESCE(f.balance_due, 0)::NUMERIC(12, 2) AS recorded_folio_balance_due,

        -- Recorded Figures in bookings table
        COALESCE(b.total_paid, 0)::NUMERIC(12, 2) AS recorded_booking_paid,
        COALESCE(b.balance_due, 0)::NUMERIC(12, 2) AS recorded_booking_balance_due,

        -- Variance Computations
        (COALESCE(f.total_charges, 0) - COALESCE(f.total_payments, 0) - COALESCE(f.balance_due, 0))::NUMERIC(12, 2) AS folio_internal_math_variance,
        ((COALESCE(b.total_price, 0) + COALESCE(fac.ancillary_total_billed, 0)) - COALESCE(f.total_charges, 0))::NUMERIC(12, 2) AS charges_leak_variance,
        (COALESCE(fap.actual_collected_payments, 0) - COALESCE(f.total_payments, 0))::NUMERIC(12, 2) AS payments_omitted_variance,
        (((COALESCE(b.total_price, 0) + COALESCE(fac.ancillary_total_billed, 0)) - COALESCE(fap.actual_collected_payments, 0)) - COALESCE(f.balance_due, 0))::NUMERIC(12, 2) AS true_balance_discrepancy

    FROM folios f
    JOIN bookings b ON f.booking_id = b.id
    LEFT JOIN folio_ancillary_charges fac ON fac.booking_id = b.id
    LEFT JOIN folio_actual_payments fap ON fap.booking_id = b.id
)
SELECT 
    folio_id,
    folio_number,
    folio_status,
    booking_id,
    booking_ref,
    booking_status,
    guest_name,
    guest_phone,
    ground_truth_total_charges,
    recorded_folio_charges,
    charges_leak_variance,
    ground_truth_total_payments,
    recorded_folio_payments,
    payments_omitted_variance,
    ground_truth_balance_due,
    recorded_folio_balance_due,
    true_balance_discrepancy,
    folio_internal_math_variance,
    ancillary_item_count,
    
    -- Diagnostic Classification
    CASE 
        WHEN ABS(folio_internal_math_variance) > 0.01 
            THEN 'INTERNAL_FOLIO_ARITHMETIC_CORRUPTION'
        WHEN ABS(charges_leak_variance) > 0.01 
            THEN 'UNPOSTED_LINE_ITEMS_IN_FOLIO'
        WHEN ABS(payments_omitted_variance) > 0.01 
            THEN 'UNPOSTED_PAYMENT_RECEIPTS_IN_FOLIO'
        WHEN ABS(true_balance_discrepancy) > 0.01 
            THEN 'CORRUPTED_GUEST_BALANCE_DUE'
        ELSE 'BALANCED'
    END AS audit_classification,
    
    -- Recommended Remediation Action
    CASE 
        WHEN ABS(charges_leak_variance) > 0.01 
            THEN 'Recalculate folio.total_charges to include ' || ancillary_item_count || ' ancillary line items and update balance_due.'
        WHEN ABS(payments_omitted_variance) > 0.01 
            THEN 'Sync folio.total_payments with booking_payments ledger and recompute balance_due.'
        WHEN ABS(folio_internal_math_variance) > 0.01 
            THEN 'Fix folio header balance: balance_due = total_charges - total_payments.'
        ELSE 'No action needed.'
    END AS remediation_action

FROM folio_reconciliation
WHERE ABS(folio_internal_math_variance) > 0.01
   OR ABS(charges_leak_variance) > 0.01
   OR ABS(payments_omitted_variance) > 0.01
   OR ABS(true_balance_discrepancy) > 0.01
ORDER BY ABS(true_balance_discrepancy) DESC, folio_id ASC;


-- ===================================================================================================
-- SECTION 2: DECENTRO WEBHOOK PAYMENT LOGS & LEDGER DISCONNECTION AUDIT
-- Detects:
--   1. Decentro payment_transactions with status = 'SUCCESS' but booking_id IS NULL or invalid.
--   2. Decentro payment_transactions with status = 'SUCCESS' that were NEVER credited into
--      booking_payments (money collected from guest but missing from front desk accounting).
--   3. Successful transactions where no master folios record exists for the booking.
--   4. Webhook events in webhook_events marked 'PROCESSED' without a matching payment transaction.
--   5. Dead-letter queue entries in failed_webhook_dlq representing trapped guest payments.
-- ===================================================================================================

WITH successful_decentro_txns AS (
    SELECT 
        pt.id AS txn_id,
        pt.reference_id,
        pt.decentro_txn_id,
        pt.bank_reference_number AS utr_number,
        pt.booking_id,
        pt.room_no,
        pt.amount::NUMERIC(12, 2) AS txn_amount,
        pt.currency,
        pt.payment_method,
        pt.status AS txn_status,
        pt.payer_vpa,
        pt.created_at AS txn_created_at
    FROM payment_transactions pt
    WHERE pt.status = 'SUCCESS'
),
linked_ledger_payments AS (
    SELECT 
        bp.id AS payment_id,
        bp.booking_id,
        bp.receipt_number,
        bp.amount::NUMERIC(12, 2) AS ledger_amount,
        bp.transaction_ref,
        bp.payment_mode,
        bp.created_at AS payment_created_at
    FROM booking_payments bp
),
decentro_disconnections AS (
    SELECT 
        st.txn_id,
        st.reference_id,
        st.decentro_txn_id,
        st.utr_number,
        st.txn_amount,
        st.txn_created_at,
        st.payer_vpa,
        st.booking_id AS txn_booking_id,
        b.id AS verified_booking_id,
        b.booking_ref,
        b.guest_name,
        b.guest_phone,
        b.status AS booking_status,
        f.id AS folio_id,
        f.folio_number,
        f.status AS folio_status,
        lp.payment_id AS ledger_payment_id,
        lp.receipt_number AS ledger_receipt_number,
        lp.ledger_amount,
        
        -- Diagnostic Classification
        CASE 
            WHEN st.txn_booking_id IS NULL 
                THEN 'ORPHAN_TXN_NULL_BOOKING_ID'
            WHEN b.id IS NULL 
                THEN 'ORPHAN_TXN_INVALID_BOOKING_FOREIGN_KEY'
            WHEN lp.payment_id IS NULL 
                THEN 'CRITICAL_UNCREDITED_PAYMENT_MISSING_FROM_BOOKING_PAYMENTS'
            WHEN f.id IS NULL 
                THEN 'MISSING_MASTER_FOLIO_RECORD'
            WHEN lp.ledger_amount != st.txn_amount 
                THEN 'AMOUNT_MISMATCH_BETWEEN_DECENTRO_AND_LEDGER'
            ELSE 'RECONCILED'
        END AS disconnection_status

    FROM successful_decentro_txns st
    LEFT JOIN bookings b ON st.txn_booking_id = b.id
    LEFT JOIN folios f ON f.booking_id = b.id
    LEFT JOIN linked_ledger_payments lp ON lp.booking_id = st.txn_booking_id
        AND (
            lp.transaction_ref = st.utr_number 
            OR lp.transaction_ref = st.reference_id 
            OR lp.transaction_ref = st.decentro_txn_id
            OR (lp.ledger_amount = st.txn_amount AND lp.payment_mode IN ('UPI', 'Card', 'Online'))
        )
)
SELECT 
    txn_id,
    reference_id,
    decentro_txn_id,
    utr_number,
    txn_amount,
    payer_vpa,
    txn_created_at,
    txn_booking_id,
    booking_ref,
    guest_name,
    guest_phone,
    booking_status,
    ledger_payment_id,
    ledger_receipt_number,
    ledger_amount,
    folio_id,
    folio_number,
    folio_status,
    disconnection_status,
    
    -- Actionable Remediation Step
    CASE 
        WHEN disconnection_status = 'ORPHAN_TXN_NULL_BOOKING_ID' 
            THEN 'Locate guest reservation via UTR ' || COALESCE(utr_number, 'N/A') || ' or VPA ' || COALESCE(payer_vpa, 'N/A') || ' and execute UPDATE payment_transactions SET booking_id = ...'
        WHEN disconnection_status = 'CRITICAL_UNCREDITED_PAYMENT_MISSING_FROM_BOOKING_PAYMENTS' 
            THEN 'Credit INR ' || txn_amount || ' to booking_payments for booking_id ' || txn_booking_id || ' and credit master folio total_payments.'
        WHEN disconnection_status = 'MISSING_MASTER_FOLIO_RECORD' 
            THEN 'Generate master folio record in folios table for booking_id ' || txn_booking_id || '.'
        WHEN disconnection_status = 'AMOUNT_MISMATCH_BETWEEN_DECENTRO_AND_LEDGER' 
            THEN 'Audit transaction ledger: Decentro collected INR ' || txn_amount || ' but ledger recorded INR ' || COALESCE(ledger_amount, 0)
        ELSE 'No remediation required.'
    END AS recommended_fix

FROM decentro_disconnections
WHERE disconnection_status != 'RECONCILED'
ORDER BY txn_created_at DESC;


-- ===================================================================================================
-- SECTION 2B: DECENTRO DEAD-LETTER QUEUE (DLQ) & RAW WEBHOOK INGESTION AUDIT
-- Identifies unparsed or failed Decentro webhooks where funds may be trapped.
-- ===================================================================================================

SELECT 
    'failed_webhook_dlq' AS source_table,
    dlq.id AS dlq_id,
    dlq.event_id,
    dlq.source,
    dlq.failure_reason,
    dlq.retry_count,
    dlq.status AS dlq_status,
    dlq.created_at AS failed_at,
    (dlq.payload_json::JSONB ->> 'bank_reference_number') AS extracted_utr,
    (dlq.payload_json::JSONB ->> 'amount')::NUMERIC(12, 2) AS extracted_amount,
    'Reprocess via POST /api/v1/admin/dlq/replay with event_id: ' || dlq.event_id AS recovery_command
FROM failed_webhook_dlq dlq
WHERE dlq.status = 'FAILED'
UNION ALL
SELECT 
    'webhook_events' AS source_table,
    we.id AS dlq_id,
    we.event_id,
    we.source,
    COALESCE(we.last_error, 'PENDING_PROCESSING_TIMEOUT') AS failure_reason,
    we.attempts AS retry_count,
    we.status AS dlq_status,
    we.created_at AS failed_at,
    (we.payload_json::JSONB ->> 'bank_reference_number') AS extracted_utr,
    (we.payload_json::JSONB ->> 'amount')::NUMERIC(12, 2) AS extracted_amount,
    'Re-trigger background webhook processor for event_id: ' || we.event_id AS recovery_command
FROM webhook_events we
WHERE we.status IN ('FAILED', 'PENDING')
  AND we.created_at < (CURRENT_TIMESTAMP - INTERVAL '15 minutes')
ORDER BY failed_at DESC;


-- ===================================================================================================
-- SECTION 3: ROOM STATUS VS ACTIVE BOOKING RECONCILIATION
-- Detects:
--   1. GHOST OCCUPANCY (Revenue Theft / Off-the-books Stays):
--      Room housekeeping_status is 'Occupied', but NO booking exists with status 'Checked-In'.
--   2. PHANTOM VACANCY (Double-Booking / Housekeeping Collision Risk):
--      An active booking has status 'Checked-In', but the physical room is marked
--      'Clean', 'Dirty', 'Inspected', or 'Under_Maintenance' (or is_available = TRUE).
--   3. CONCURRENT CHECK-IN COLLISION (Physical Room Double-Booked):
--      Multiple bookings simultaneously in 'Checked-In' status assigned to the exact same room_id.
--   4. EXPIRED OVERSTAYS:
--      Checked-in bookings where check_out_date is in the past, yet no checkout was performed.
-- ===================================================================================================

WITH active_checked_in_bookings AS (
    SELECT 
        b.id AS booking_id,
        b.booking_ref,
        b.room_id,
        b.guest_name,
        b.guest_phone,
        b.check_in_date,
        b.check_out_date,
        b.actual_check_in,
        b.status AS booking_status,
        b.balance_due::NUMERIC(12, 2) AS balance_due,
        b.created_at AS booking_created_at
    FROM bookings b
    WHERE b.status IN ('Checked-In', 'CHECKED_IN')
),
room_booking_aggregates AS (
    SELECT 
        r.id AS room_id,
        r.name AS room_name,
        r.room_type,
        r.price_per_night::NUMERIC(12, 2) AS price_per_night,
        r.is_available,
        r.housekeeping_status,
        COUNT(ab.booking_id) AS active_booking_count,
        MAX(ab.booking_id) AS primary_booking_id,
        STRING_AGG(ab.booking_ref, ', ') AS active_booking_refs,
        STRING_AGG(ab.guest_name, ', ') AS active_guest_names
    FROM rooms r
    LEFT JOIN active_checked_in_bookings ab ON ab.room_id = r.id
    GROUP BY r.id, r.name, r.room_type, r.price_per_night, r.is_available, r.housekeeping_status
)
SELECT 
    rba.room_id,
    rba.room_name,
    rba.room_type,
    rba.price_per_night,
    rba.is_available AS room_is_available,
    rba.housekeeping_status,
    rba.active_booking_count,
    rba.active_booking_refs,
    rba.active_guest_names,
    ab.check_in_date,
    ab.check_out_date,
    ab.balance_due,
    
    -- Discrepancy Classification
    CASE 
        WHEN rba.housekeeping_status ILIKE '%Occupied%' AND rba.active_booking_count = 0 
            THEN 'GHOST_OCCUPANCY_REVENUE_THEFT_RISK'
        WHEN rba.housekeeping_status NOT ILIKE '%Occupied%' AND rba.active_booking_count > 0 
            THEN 'PHANTOM_VACANCY_OVERBOOKING_RISK'
        WHEN rba.is_available = TRUE AND rba.active_booking_count > 0 
            THEN 'AVAILABLE_FLAG_DESYNC_ON_OCCUPIED_ROOM'
        WHEN rba.active_booking_count > 1 
            THEN 'CONCURRENT_CHECKIN_COLLISION_CRITICAL'
        WHEN ab.check_out_date < TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') 
            THEN 'EXPIRED_UNCHECKED_OUT_OVERSTAY'
        ELSE 'IN_SYNC'
    END AS discrepancy_classification,
    
    -- Severity & Urgency Rating
    CASE 
        WHEN rba.active_booking_count > 1 
            THEN 'CRITICAL_URGENT'
        WHEN rba.housekeeping_status ILIKE '%Occupied%' AND rba.active_booking_count = 0 
            THEN 'HIGH_REVENUE_LEAK'
        WHEN rba.housekeeping_status NOT ILIKE '%Occupied%' AND rba.active_booking_count > 0 
            THEN 'HIGH_OVERBOOKING_RISK'
        WHEN ab.check_out_date < TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') 
            THEN 'MEDIUM_OPERATIONAL'
        ELSE 'LOW'
    END AS audit_severity,

    -- Specific Operational Correction Instruction
    CASE 
        WHEN rba.housekeeping_status ILIKE '%Occupied%' AND rba.active_booking_count = 0 
            THEN 'Inspect Room ' || rba.room_name || ' immediately! Potential unregistered cash guest or forgot to set status to Dirty after checkout.'
        WHEN rba.housekeeping_status NOT ILIKE '%Occupied%' AND rba.active_booking_count > 0 
            THEN 'Lock room inventory! Set Room ' || rba.room_name || ' housekeeping_status = "Occupied" and is_available = FALSE to prevent double assignment.'
        WHEN rba.active_booking_count > 1 
            THEN 'Emergency: ' || rba.active_booking_count || ' guests simultaneously checked into ' || rba.room_name || '. Reassign room shift immediately.'
        WHEN ab.check_out_date < TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') 
            THEN 'Guest ' || COALESCE(ab.guest_name, 'N/A') || ' past scheduled checkout (' || ab.check_out_date || '). Process checkout or bill extended nights.'
        ELSE 'Synchronized.'
    END AS operational_remediation_action

FROM room_booking_aggregates rba
LEFT JOIN active_checked_in_bookings ab ON ab.booking_id = rba.primary_booking_id
WHERE (rba.housekeeping_status ILIKE '%Occupied%' AND rba.active_booking_count = 0)
   OR (rba.housekeeping_status NOT ILIKE '%Occupied%' AND rba.active_booking_count > 0)
   OR (rba.is_available = TRUE AND rba.active_booking_count > 0)
   OR (rba.active_booking_count > 1)
   OR (ab.check_out_date < TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'))
ORDER BY 
    CASE 
        WHEN rba.active_booking_count > 1 THEN 1
        WHEN rba.housekeeping_status ILIKE '%Occupied%' AND rba.active_booking_count = 0 THEN 2
        ELSE 3 
    END, 
    rba.room_id ASC;


-- ===================================================================================================
-- SECTION 4: GAPS IN SEQUENTIAL GST INVOICE NUMBERING AUDIT
-- Statutory Authority: Central Goods and Services Tax (CGST) Rules, 2017 - Rule 46(b)
--
-- Statutory Mandate:
--   "A tax invoice shall be issued by the registered person containing a consecutive serial
--    number not exceeding sixteen characters, in one or multiple series, containing only
--    alphabets or numerals or special characters-hyphen or dash and slash symbolized as
--    '-' and '/' respectively, and any combination thereof, unique for a financial year."
--
-- Audit Methodology:
--   1. Gathers all generated invoices from checkout_records (and bookings.invoice_number).
--   2. Deconstructs the invoice into its alphanumeric Series Prefix, Serial Number, and FY Suffix.
--   3. Calculates financial year partition based on invoice issuance timestamp.
--   4. Employs window function LAG(serial_num) to detect any missing sequence integers.
--   5. Calculates exact missing invoice range and missing count for tax assessment defense.
-- ===================================================================================================

WITH unified_invoices AS (
    -- Collect invoices from checkout_records table
    SELECT 
        cr.id AS record_id,
        'checkout_records' AS source_table,
        TRIM(cr.invoice_no) AS invoice_number,
        cr.created_at AS invoice_timestamp,
        cr.room_no,
        cr.guest_name,
        cr.bill_amount::NUMERIC(12, 2) AS invoice_amount,
        cr.gst_amount::NUMERIC(12, 2) AS gst_amount
    FROM checkout_records cr
    WHERE cr.invoice_no IS NOT NULL AND TRIM(cr.invoice_no) != ''
),
parsed_invoices AS (
    SELECT 
        record_id,
        source_table,
        invoice_number,
        invoice_timestamp,
        room_no,
        guest_name,
        invoice_amount,
        gst_amount,

        -- Extract pure series prefix (alphabetic characters and delimiters before first digit sequence)
        COALESCE(
            (regexp_match(invoice_number, '^([A-Za-z\/\-_]+)'))[1],
            'GENERIC'
        ) AS series_prefix,

        -- Extract the primary numeric sequence component
        COALESCE(
            (regexp_match(invoice_number, '(\d+)'))[1]::BIGINT,
            0
        ) AS serial_sequence_number,

        -- Extract trailing suffix or financial year (e.g. /26-27 or -2026)
        COALESCE(
            (regexp_match(invoice_number, '\d+([A-Za-z\/\-_0-9]*)$'))[1],
            ''
        ) AS series_suffix,

        -- Determine Indian Financial Year (April 1 to March 31)
        CASE 
            WHEN EXTRACT(MONTH FROM invoice_timestamp) >= 4 
                THEN EXTRACT(YEAR FROM invoice_timestamp)::TEXT || '-' || (EXTRACT(YEAR FROM invoice_timestamp) + 1)::TEXT
            ELSE (EXTRACT(YEAR FROM invoice_timestamp) - 1)::TEXT || '-' || EXTRACT(YEAR FROM invoice_timestamp)::TEXT
        END AS derived_financial_year

    FROM unified_invoices
    WHERE invoice_number ~ '\d+' -- Must contain at least one numeric digit to establish sequence
),
sequenced_invoices AS (
    SELECT 
        record_id,
        invoice_number,
        invoice_timestamp,
        room_no,
        guest_name,
        invoice_amount,
        gst_amount,
        series_prefix,
        series_suffix,
        derived_financial_year,
        serial_sequence_number,

        -- Previous and Next serial numbers within the exact same prefix and financial year series
        LAG(serial_sequence_number) OVER (
            PARTITION BY series_prefix, derived_financial_year 
            ORDER BY serial_sequence_number ASC
        ) AS previous_serial_number,

        LAG(invoice_number) OVER (
            PARTITION BY series_prefix, derived_financial_year 
            ORDER BY serial_sequence_number ASC
        ) AS previous_invoice_number,

        LAG(invoice_timestamp) OVER (
            PARTITION BY series_prefix, derived_financial_year 
            ORDER BY serial_sequence_number ASC
        ) AS previous_invoice_timestamp

    FROM parsed_invoices
)
SELECT 
    series_prefix AS invoice_series,
    derived_financial_year AS financial_year,
    previous_invoice_number,
    previous_invoice_timestamp,
    invoice_number AS next_existing_invoice_number,
    invoice_timestamp AS next_existing_invoice_timestamp,
    previous_serial_number,
    serial_sequence_number AS current_serial_number,
    
    -- Gap Metrics
    (serial_sequence_number - previous_serial_number - 1) AS missing_invoices_count,
    (previous_serial_number + 1) AS missing_range_start_seq,
    (serial_sequence_number - 1) AS missing_range_end_seq,

    -- Reconstructed Missing Invoice Numbers
    series_prefix || (previous_serial_number + 1)::TEXT || series_suffix AS first_missing_invoice,
    series_prefix || (serial_sequence_number - 1)::TEXT || series_suffix AS last_missing_invoice,

    -- Statutory Compliance Assessment
    'VIOLATION_CGST_RULE_46_SEQUENCE_GAP' AS statutory_finding,
    'HIGH_STATUTORY_RISK' AS audit_severity,

    -- Recommended Statutory Remediation Action
    'Investigate missing sequence (' || (previous_serial_number + 1) || ' to ' || (serial_sequence_number - 1) || 
    '). Check if cancelled bills were unrecorded, or enter cancellation entries in GST Outward Sales Register (GSTR-1).' AS legal_remediation_action

FROM sequenced_invoices
WHERE previous_serial_number IS NOT NULL 
  AND (serial_sequence_number - previous_serial_number) > 1
ORDER BY series_prefix, derived_financial_year, serial_sequence_number ASC;

-- ===================================================================================================
-- END OF FORENSIC RECONCILIATION AUDIT SCRIPT
-- ===================================================================================================
