import re

with open('src/services/pmsStore.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Find all static methods in PmsStore
methods = re.findall(r'static\s+(async\s+)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)[^{]*\{([\s\S]*?)\n  \}', code)

print(f"Total PmsStore static methods found: {len(methods)}")

isolated_methods = []
persisted_methods = []

for is_async, name, args, body in methods:
    # Skip getters or pure calculators
    if name.startswith('get') or name.startswith('calc') or name.startswith('is') or name.startswith('has') or name.startswith('find'):
        continue
    
    # Mutation methods: save, delete, update, add, record, clear, resolve, extend, post, shift
    is_mutation = any(name.startswith(prefix) for prefix in ['save', 'delete', 'update', 'add', 'record', 'clear', 'resolve', 'extend', 'post', 'shift', 'checkin', 'checkout', 'confirm', 'cancel', 'void', 'create', 'transfer', 'set'])
    if not is_mutation:
        continue
        
    has_api = 'hotelApi.' in body
    has_ls = 'localStorage.' in body or 'this.setStorage' in body or 'setStorage' in body
    
    if not has_api:
        isolated_methods.append((name, 'LOCALSTORAGE_ONLY', body.strip()[:100].replace('\n', ' ')))
    else:
        persisted_methods.append((name, 'HOTEL_API_PERSISTED'))

print(f"\n--- MUTATION METHODS CALLING HOTEL_API ({len(persisted_methods)}) ---")
for m, status in persisted_methods:
    print(f"  [OK] {m}")

print(f"\n--- MUTATION METHODS ISOLATED IN LOCALSTORAGE ONLY ({len(isolated_methods)}) ---")
for m, status, snippet in isolated_methods:
    print(f"  [VULNERABLE] {m}: {snippet}")
