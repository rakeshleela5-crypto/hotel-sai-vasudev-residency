import re

with open("src/services/pmsStore.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Find initial data or default arrays
default_vars = re.findall(r'(?:const|let)\s+([A-Z0-9_]+)\s*=\s*(\[.*?\]|\{.*?\});', text, re.DOTALL)
print(f"Total default objects/arrays found: {len(default_vars)}")
for name, val in default_vars:
    if any(k in val.lower() for k in ["booking", "guest", "revenue", "invoice", "room", "folio"]):
        print(f"  {name}: {val[:120]}...\n")

# Find localStorage default fallbacks
fallbacks = re.findall(r'localStorage\.getItem\([^)]+\)\s*\|\|\s*([^;\n]+)', text)
print(f"Total localStorage fallbacks: {len(fallbacks)}")
for fb in fallbacks[:10]:
    print(f"  Fallback: {fb[:100]}")

