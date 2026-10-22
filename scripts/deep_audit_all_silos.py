import os
import glob
import re

modals = glob.glob('src/components/pms/**/*.tsx', recursive=True)
pms_store_path = 'src/services/pmsStore.ts'

print('=== 1. AUDITING DIRECT LOCALSTORAGE CALLS IN MODALS ===')
for m in sorted(modals):
    with open(m, 'r', encoding='utf-8') as f:
        content = f.read()
    ls_calls = re.findall(r'localStorage\.(?:getItem|setItem|removeItem)\s*\(\s*[\'"]([^\'"]+)[\'"]', content)
    if ls_calls:
        print(f'{os.path.basename(m)}: {sorted(list(set(ls_calls)))}')

print('\n=== 2. AUDITING COMPONENTS WITH STATIC MOCK/INITIAL DATA ARRAYS ===')
for m in sorted(modals):
    with open(m, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    for i, line in enumerate(lines):
        if re.search(r'const\s+(?:INITIAL|MOCK|DEFAULT|SAMPLE|DUMMY|BENCHMARK)_[A-Z0-9_]+\s*=', line):
            print(f'{os.path.basename(m)}:L{i+1}: {line.strip()[:80]}')

print('\n=== 3. AUDITING PMS STORE FOR HARDCODED RETURN DATA ===')
with open(pms_store_path, 'r', encoding='utf-8') as f:
    store_lines = f.readlines()

for i, line in enumerate(store_lines):
    if 'return [' in line or 'return {' in line:
        # Check if the surrounding lines have hardcoded static records instead of reading from localStorage
        surrounding = "".join(store_lines[max(0, i-5):min(len(store_lines), i+15)])
        if 'getItem' not in surrounding and ('2025' in surrounding or 'Sai Vasudev' in surrounding):
            # check method name
            for j in range(i, max(0, i-25), -1):
                if re.match(r'^\s*(?:static\s+)?(?:public\s+)?(?:async\s+)?(\w+)\s*\(', store_lines[j]):
                    print(f'pmsStore.ts:L{j+1}: {store_lines[j].strip()} -> potential hardcoded fallback')
                    break
