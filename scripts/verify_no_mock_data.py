import os
import re

PATTERNS = [
    r'suresh\s*raina',
    r'hariom\s*gautam',
    r'siddhant',
    r'vinod\s*kumar',
    r'demo4@gmail\.com',
    r'datahouseerp',
    r'U55101MH2024PTC123456',
    r'shirdi',
    r'maharashtra'
]

compiled = [re.compile(p, re.IGNORECASE) for p in PATTERNS]

src_dir = 'src'
found = []

for root, _, files in os.walk(src_dir):
    for f in files:
        if f.endswith(('.ts', '.tsx', '.js', '.jsx', '.json')):
            if f.endswith('.bak'):
                continue
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
                for line_no, line in enumerate(fp, 1):
                    for p in compiled:
                        if p.search(line):
                            found.append((path, line_no, line.strip()))

print(f"Total occurrences found in src/: {len(found)}")
for item in found[:20]:
    print(f"{item[0]}:{item[1]} -> {item[2]}")

