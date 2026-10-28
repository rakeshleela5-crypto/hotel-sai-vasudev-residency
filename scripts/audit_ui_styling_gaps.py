import os
import re
from collections import Counter

all_tsx = []
for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx'):
            all_tsx.append(os.path.join(root, f).replace('\\', '/'))

css_classes = set()
for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith('.css'):
            cpath = os.path.join(root, f)
            with open(cpath, 'r', encoding='utf-8', errors='ignore') as cfile:
                txt = cfile.read()
                # Extract class names accurately
                matches = re.findall(r'\.((?:[a-zA-Z0-9_\-\[\]#%/\.]|\\:)+)', txt)
                for m in matches:
                    # Strip any trailing pseudo-class like :hover, :focus, etc. (unless escaped)
                    clean = re.sub(r'(?<!\\):[a-zA-Z\-]+.*$', '', m)
                    clean = clean.split('{')[0].split('>')[0].split('~')[0].strip().replace('\\', '')
                    if clean:
                        css_classes.add(clean)

reports = []
all_missing_counter = Counter()

for fpath in all_tsx:
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    class_instances = re.findall(r'className=["\']([^"\']+)["\']', content)
    used_classes = set()
    for inst in class_instances:
        for c in inst.split():
            c = c.strip()
            if c and not c.startswith('{') and not c.startswith('$'):
                used_classes.add(c)

    missing = [c for c in used_classes if c not in css_classes and not any(p in c for p in ['active', 'open', 'show', 'hide', 'selected', 'disabled'])]
    for m in missing:
        all_missing_counter[m] += 1
        
    if len(missing) > 10:
        reports.append((fpath, len(missing), len(used_classes)))

reports.sort(key=lambda x: x[1], reverse=True)
print(f"=== ALL TSX FILES WITH > 10 UNMAPPED CLASSES ({len(reports)} files) ===")
for f, m, t in reports:
    print(f"  {f}: {m} missing / {t} used ({int(m/t*100)}%)")

print("\n=== TOP 40 MOST FREQUENTLY MISSING UTILITY CLASSES ===")
for cls, count in all_missing_counter.most_common(40):
    print(f"  {cls}: used in {count} files")
