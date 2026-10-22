import re

with open('src/services/pmsStore.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Find all direct string literals in localStorage
matches = re.findall(r'localStorage\.(?:getItem|setItem|removeItem)\s*\(\s*[\'"]([^\'"]+)[\'"]', code)
print(f"Total raw string localStorage calls: {len(matches)}")
print("Unique direct string keys in pmsStore.ts:")
for k in sorted(set(matches)):
    print(f"  {k}")

# Also find STORAGE_KEYS references
sk_matches = re.findall(r'STORAGE_KEYS\.([A-Z0-9_]+)', code)
print(f"\nTotal STORAGE_KEYS references in pmsStore.ts: {len(sk_matches)}")
sk_set = set(sk_matches)

# Check which STORAGE_KEYS are NEVER referenced in pmsStore.ts
keys_block = re.search(r'const STORAGE_KEYS = \{([^}]+)\};', code)
all_defined_sk = []
if keys_block:
    for line in keys_block.group(1).splitlines():
        m = re.search(r'([A-Z0-9_]+)\s*:\s*[\'"]([^\'"]+)[\'"]', line)
        if m:
            all_defined_sk.append(m.group(1))

unreferenced = set(all_defined_sk) - sk_set
print(f"\nSTORAGE_KEYS defined but NEVER used in pmsStore.ts ({len(unreferenced)}):")
for u in sorted(unreferenced):
    print(f"  {u}")
