import sys
import os

# Ensure current directory is in sys.path
sys.path.insert(0, os.path.abspath('.'))

from sqlalchemy import inspect, text
from app.database import engine, Base
import app.models as models

def run_migrations():
    print(f"Connecting to database using engine: {engine.url.drivername} ({engine.url})")
    
    # 1. Create any missing tables (like liquor_stocks)
    Base.metadata.create_all(bind=engine)
    print("Base.metadata.create_all completed.")
    
    # 2. Inspect existing columns and add missing ones
    inspector = inspect(engine)
    
    alterations = [
        # (table_name, column_name, sql_type)
        ("bookings", "coming_from", "VARCHAR(150)"),
        ("bookings", "proceeding_to", "VARCHAR(150)"),
        ("bookings", "vehicle_no", "VARCHAR(50)"),
        ("bookings", "darshan_slot", "VARCHAR(100)"),
        ("bookings", "guest_gender", "VARCHAR(20)"),
        ("bookings", "guest_age", "INTEGER"),
        
        ("checkout_records", "payment_splits_json", "TEXT DEFAULT '[]'"),
        ("checkout_records", "settled_by_user_id", "VARCHAR(100)"),
        ("checkout_records", "round_off_amount", "FLOAT DEFAULT 0.0"),
        ("checkout_records", "is_cancelled", "BOOLEAN DEFAULT FALSE"),
        ("checkout_records", "cancellation_reason", "VARCHAR(255)"),
        
        ("advance_receipts", "transaction_ref", "VARCHAR(100)"),
        ("advance_receipts", "is_settled_in_checkout", "BOOLEAN DEFAULT FALSE"),
        
        ("food_bills", "discount_reason", "VARCHAR(255)"),
        ("food_bills", "payment_ref", "VARCHAR(100)"),
        ("food_bills", "billed_by", "VARCHAR(100) DEFAULT 'Cashier'"),
        ("food_bills", "cgst_amount", "FLOAT DEFAULT 0.0"),
        ("food_bills", "sgst_amount", "FLOAT DEFAULT 0.0"),
        
        ("petty_expenses", "vendor_gstin", "VARCHAR(20)"),
        ("petty_expenses", "attachment_url", "VARCHAR(500)"),
        
        ("banquet_bookings", "kots_json", "TEXT DEFAULT '[]'"),
        ("banquet_bookings", "payments_json", "TEXT DEFAULT '[]'"),
        ("banquet_bookings", "linked_rooms_json", "TEXT DEFAULT '[]'"),
        ("banquet_bookings", "seating_layout", "VARCHAR(100) DEFAULT 'Standard Banquet'"),
        
        ("agent_commissions", "payout_voucher_id", "INTEGER"),
        ("agent_commissions", "approved_by", "VARCHAR(100) DEFAULT 'General Manager'"),
        ("agent_commissions", "payment_mode", "VARCHAR(50) DEFAULT 'Direct Transfer'"),
        ("agent_commissions", "utr_reference", "VARCHAR(100)"),
        
        ("hotel_company_info", "legal_name", "VARCHAR(150)"),
        ("hotel_company_info", "pan_number", "VARCHAR(20)"),
        ("hotel_company_info", "bank_name", "VARCHAR(100)"),
        ("hotel_company_info", "bank_account_no", "VARCHAR(50)"),
        ("hotel_company_info", "bank_ifsc", "VARCHAR(20)"),
        ("hotel_company_info", "bank_branch", "VARCHAR(100)"),
        ("hotel_company_info", "upi_id", "VARCHAR(50)"),
        ("hotel_company_info", "phonepe_gpay", "VARCHAR(50)"),
        ("hotel_company_info", "jurisdiction", "VARCHAR(100) DEFAULT 'Rayagada Jurisdiction'")
    ]
    
    with engine.connect() as conn:
        for table_name, col_name, col_type in alterations:
            existing_cols = [c['name'] for c in inspector.get_columns(table_name)]
            if col_name not in existing_cols:
                print(f"Adding column '{col_name}' ({col_type}) to table '{table_name}'...")
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            else:
                print(f"Column '{col_name}' already exists in table '{table_name}'.")
                
    print("\nAll database schema migrations executed successfully!")

if __name__ == '__main__':
    run_migrations()
