import re

with open("src/services/pmsStore.ts", "r", encoding="utf-8") as f:
    lines = f.readlines()[:2841]

for i, line in enumerate(lines, 1):
    m = re.match(r'^(?:export\s+)?const\s+([A-Z0-9_]+)', line)
    if m:
        print(f"Line {i}: {m.group(1)} -> {line.strip()[:80]}")

