import os
import re

PMS_DIR = 'src/components/pms'
files = [f for f in os.listdir(PMS_DIR) if f.endswith('.tsx')]

print(f"Scanning {len(files)} components for stubbed handlers, fake actions, or isolated state...\n")

issues = []

for f in sorted(files):
    path = os.path.join(PMS_DIR, f)
    with open(path, 'r', encoding='utf-8') as fp:
        lines = fp.readlines()
        
    for i, line in enumerate(lines):
        # Check for alert only handlers
        if re.search(r'(?:alert|console\.log)\s*\([^\)]*(?:TODO|todo|dummy|mock|simulat|demo|not implemented|coming soon)', line, re.IGNORECASE):
            issues.append((f, i + 1, 'TODO/Demo alert or log', line.strip()))
            
        # Check for empty functions
        if re.search(r'(?:const|function)\s+(?:handle[A-Za-z0-9_]+)\s*=\s*\([^)]*\)\s*=>\s*\{\s*\}', line):
            issues.append((f, i + 1, 'Empty handler', line.strip()))

print(f"Total potential stub issues found: {len(issues)}")
for f, l, kind, text in issues:
    print(f"  {f}:{l} [{kind}] -> {text[:90]}")
