import os
import re
import json

PMS_DIR = 'src/components/pms'
files = [f for f in os.listdir(PMS_DIR) if f.endswith('.tsx')]

report = {
    "isolated_localstorage_keys": [],
    "components_without_store_persistence": [],
    "missing_ledger_integrations": [],
    "data_mismatches": [],
    "cloud_sync_omissions": [],
    "double_billing_or_leakage": []
}

# 1. Check all files for localStorage keys that don't match STORAGE_KEYS
with open('src/services/pmsStore.ts', 'r', encoding='utf-8') as f:
    store_code = f.read()

# Collect STORAGE_KEYS
sk_dict = {}
m = re.search(r'const STORAGE_KEYS = \{([^}]+)\};', store_code)
if m:
    for line in m.group(1).splitlines():
        km = re.search(r'([A-Z0-9_]+)\s*:\s*[\'"]([^\'"]+)[\'"]', line)
        if km:
            sk_dict[km.group(1)] = km.group(2)

valid_keys = set(sk_dict.values())

for f in files:
    path = os.path.join(PMS_DIR, f)
    with open(path, 'r', encoding='utf-8') as fp:
        code = fp.read()
    ls_matches = re.findall(r'localStorage\.(?:getItem|setItem|removeItem)\s*\(\s*[\'"]([^\'"]+)[\'"]', code)
    for k in set(ls_matches):
        if k not in valid_keys:
            report["isolated_localstorage_keys"].append({
                "file": f,
                "key": k,
                "note": "Custom key not defined in STORAGE_KEYS"
            })

with open('scripts/audit_disconnections_summary.json', 'w', encoding='utf-8') as out:
    json.dump(report, out, indent=2)

print("Saved report to scripts/audit_disconnections_summary.json")
