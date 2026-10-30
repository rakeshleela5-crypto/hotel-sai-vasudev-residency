import json

with open('frontend_state_audit.json', 'r') as f:
    audit = json.load(f)

with open('backend_inventory.json', 'r') as f:
    backend = json.load(f)

models = backend['models']
endpoints = backend['endpoints']

# Let's inspect each component in src/components/pms/
pms_items = [item for item in audit if 'src\\components\\pms' in item['file'] or 'src/components/pms' in item['file']]

print(f"PMS Components found: {len(pms_items)}")
for item in pms_items:
    ls = item['ls_calls']
    inits = item['state_inits']
    handlers = item['handlers_without_api']
    print(f"\n--- {item['file']} ---")
    if ls:
        print(f"  LocalStorage: {ls}")
    if inits:
        print(f"  Mock/Transient State inits ({len(inits)}): {[i['var'] for i in inits]}")
    if handlers:
        print(f"  Handlers mutating without direct API ({len(handlers)}): {[h['name'] + ' (PmsStore: ' + str(h['pms_methods']) + ')' for h in handlers[:4]]}")
