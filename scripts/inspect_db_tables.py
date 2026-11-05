import sqlite3

conn = sqlite3.connect('hotel_sai_vasudev.db')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [r[0] for r in cur.fetchall()]
print(f"Total tables: {len(tables)}")
for t in sorted(tables):
    if not t.startswith('sqlite'):
        try:
            cnt = cur.execute(f'SELECT count(*) FROM "{t}"').fetchone()[0]
            print(f"  {t}: {cnt}")
        except Exception as e:
            print(f"  {t}: ERROR ({e})")
conn.close()

