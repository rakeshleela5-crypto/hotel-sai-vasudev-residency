import sqlite3
import glob
import os

for db_path in glob.glob("*.db"):
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        if "bookings" in tables:
            cols = [r[1] for r in cur.execute("PRAGMA table_info(bookings)").fetchall()]
            if "guest_signature_url" not in cols:
                cur.execute("ALTER TABLE bookings ADD COLUMN guest_signature_url TEXT")
                conn.commit()
                print(f"Added guest_signature_url to {db_path}")
            else:
                print(f"guest_signature_url already exists in {db_path}")
        conn.close()
    except Exception as e:
        print(f"Error {db_path}: {e}")

