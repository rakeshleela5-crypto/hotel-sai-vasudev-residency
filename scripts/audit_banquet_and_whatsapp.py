import re

with open('src/services/pmsStore.ts', 'r', encoding='utf-8') as f:
    code = f.read()

keywords = ['Banquet', 'WhatsApp', 'DayEnd', 'ShiftHandover', 'GuestLog', 'Outstanding', 'ItemWise']

for kw in keywords:
    matches = re.findall(r'static\s+(?:async\s+)?([a-zA-Z0-9_]*' + kw + r'[a-zA-Z0-9_]*)\s*\([^{]*\{([\s\S]*?)(?=\n\s*(?:static\s+[a-zA-Z0-9_]+\s*\(|\/\*\*|\}\s*\n))', code, re.IGNORECASE)
    print(f"\n--- {kw} Methods in PmsStore ({len(matches)}) ---")
    for name, body in matches:
        has_api = 'hotelApi.' in body or 'fetch(' in body
        print(f"  {name}: {'API-BACKED' if has_api else 'LOCALSTORAGE-ONLY'}")
