import json
import re

with open('frontend_state_audit.json') as f:
    audit_data = json.load(f)

with open('backend_inventory.json') as f:
    backend_data = json.load(f)

models = backend_data['models']
endpoints = backend_data['endpoints']

# Let's inspect each component
modules = []

for item in audit_data:
    fname = item['file']
    if not fname.startswith('src\\components\\pms') and not fname.startswith('src/components/pms') and not fname.endswith('pmsStore.ts') and not fname.endswith('api.ts'):
        continue
        
    ls_calls = item['ls_calls']
    state_inits = item['state_inits']
    handlers = item['handlers_without_api']
    
    modules.append({
        'file': fname,
        'ls_calls': ls_calls,
        'state_inits': state_inits,
        'handlers': handlers
    })

print(f"Total PMS-relevant files to analyze: {len(modules)}")
for m in modules[:15]:
    print(f"- {m['file']}: {len(m['ls_calls'])} LS calls, {len(m['state_inits'])} state inits, {len(m['handlers'])} handlers")
