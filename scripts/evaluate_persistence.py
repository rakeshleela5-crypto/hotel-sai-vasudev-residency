import json
import re

with open('component_forensics.json', 'r') as f:
    comps = json.load(f)

with open('backend_inventory.json', 'r') as f:
    backend = json.load(f)

models = backend['models']
endpoints = backend['endpoints']

# Let's inspect each component
table_map = {}
for m_name, m_data in models.items():
    t_name = m_data['table_name']
    if t_name:
        table_map[t_name] = {
            'model': m_name,
            'cols': set(m_data['columns'])
        }

endpoint_list = [(ep['method'], ep['path']) for ep in endpoints]

print(f"Loaded {len(comps)} components, {len(table_map)} tables, {len(endpoint_list)} endpoints.")

# Let's print out components that have PmsStore writes or localStorage or pure state mutation
for c in comps:
    writes = set()
    for h in c['handlers']:
        for w in h['pms_writes']:
            writes.add(w)
    
    if c['ls_keys'] or writes or any(not h['has_api'] and h['body_has_setstate'] for h in c['handlers']):
        # Candidate for forensic audit
        pass
