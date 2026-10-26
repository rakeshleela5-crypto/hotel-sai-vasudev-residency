-- =========================================================================
-- Hotel Sai Vasudev Residency PMS - Decentro Banking & KYC Database Migration
-- PostgreSQL DDL for Railway & Local Environments
-- =========================================================================

-- 1. Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    reference_id VARCHAR(100) UNIQUE NOT NULL,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    kot_id VARCHAR(100),
    room_no VARCHAR(50),
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    purpose_message VARCHAR(255),
    payment_method VARCHAR(50) DEFAULT 'UPI_QR',
    status VARCHAR(50) DEFAULT 'PENDING',
    decentro_txn_id VARCHAR(150),
    bank_reference_number VARCHAR(100),
    payer_vpa VARCHAR(100),
    qr_code_base64 TEXT,
    upi_intent_link TEXT,
    expiry_time TIMESTAMP WITH TIME ZONE,
    metadata_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning-fast webhook lookups & idempotency checks
CREATE INDEX IF NOT EXISTS idx_payment_transactions_ref_id ON payment_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_kot_id ON payment_transactions(kot_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_decentro_txn ON payment_transactions(decentro_txn_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_bank_ref ON payment_transactions(bank_reference_number);

-- 2. Create virtual_accounts table (Corporate & Group Booking NEFT/RTGS/IMPS)
CREATE TABLE IF NOT EXISTS virtual_accounts (
    id SERIAL PRIMARY KEY,
    reference_id VARCHAR(100) UNIQUE NOT NULL,
    corporate_client_id VARCHAR(100),
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    group_id VARCHAR(100),
    account_number VARCHAR(100) UNIQUE NOT NULL,
    ifsc_code VARCHAR(50) NOT NULL,
    bank_name VARCHAR(100) DEFAULT 'YES BANK',
    account_name VARCHAR(200) NOT NULL,
    upi_id VARCHAR(150),
    decentro_urn VARCHAR(150),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for virtual account search & routing
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_acc_num ON virtual_accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_corp_id ON virtual_accounts(corporate_client_id);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_booking_id ON virtual_accounts(booking_id);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_group_id ON virtual_accounts(group_id);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_decentro_urn ON virtual_accounts(decentro_urn);

-- 3. Trigger for updating updated_at timestamp automatically (PostgreSQL)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END $$;

DROP TRIGGER IF EXISTS trg_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER trg_payment_transactions_updated_at
BEFORE UPDATE ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_virtual_accounts_updated_at ON virtual_accounts;
CREATE TRIGGER trg_virtual_accounts_updated_at
BEFORE UPDATE ON virtual_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
