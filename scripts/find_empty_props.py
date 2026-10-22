import os
import glob
import re

modals = sorted(glob.glob('src/components/pms/**/*.tsx', recursive=True))

print("=== CHECKING ALL EMPTY CALLBACKS IN PMS MODALS ===")

for m in modals:
    fname = os.path.basename(m)
    with open(m, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    for idx, line in enumerate(lines):
        if re.search(r'on[A-Z]\w+\s*=\s*\{\s*\(\)\s*=>\s*\{\s*\}\s*\}', line):
            print(f"[{fname}:L{idx+1}]: {line.strip()}")
