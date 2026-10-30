import os
import re
import json

with open('backend_inventory.json') as f:
    backend = json.load(f)

models = backend['models']
endpoints = backend['endpoints']

# Map table names to model columns
tables = {}
for m_name, m_data in models.items():
    if m_data['table_name']:
        tables[m_data['table_name']] = set(m_data['columns'])

endpoint_paths = {}
for ep in endpoints:
    method = ep['method']
    path = ep['path']
    if path not in endpoint_paths:
        endpoint_paths[path] = []
    endpoint_paths[path].append(method)

def inspect_component(fpath):
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        code = f.read()
    
    fname = os.path.basename(fpath)
    
    # 1. LocalStorage keys
    ls_keys = list(set(re.findall(r'localStorage\.(?:getItem|setItem|removeItem)\([\'"]([^\'"]+)[\'"]', code)))
    
    # 2. PmsStore calls
    pms_calls = list(set(re.findall(r'PmsStore\.(\w+)\(', code)))
    
    # 3. Direct fetch/api calls
    direct_fetch = list(set(re.findall(r'fetch\([\'"`]([^\'"`]+)[\'"`]', code)))
    hotel_api_calls = list(set(re.findall(r'hotelApi\.(\w+)\(', code)))
    decentro_calls = list(set(re.findall(r'decentroApi\.(\w+)\(', code)))
    
    # 4. State initializations with hardcoded or PmsStore
    state_inits = []
    for match in re.finditer(r'const\s+\[(\w+),\s*set\w+\]\s*=\s*useState(?:<[^>]+>)?\(([\s\S]*?)\);', code):
        vname, init_val = match.groups()
        init_clean = init_val.strip()
        if 'PmsStore.' in init_clean or 'INITIAL_' in init_clean or 'DEFAULT_' in init_clean or init_clean.startswith('[') or init_clean.startswith('{'):
            state_inits.append((vname, init_clean[:80].replace('\n', ' ')))
            
    # 5. Handlers
    handlers = []
    for match in re.finditer(r'(?:const|function)\s+(handle[A-Z]\w+|save[A-Z]\w+|on[A-Z]\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?:=>)?\s*\{([\s\S]*?)\n  \};', code):
        hname, params, body = match.groups()
        has_api = ('fetch(' in body) or ('hotelApi.' in body) or ('decentroApi.' in body)
        pms_writes = re.findall(r'PmsStore\.(save\w+|set\w+|update\w+|add\w+|delete\w+|remove\w+|record\w+|shift\w+|create\w+)\(', body)
        handlers.append({
            'name': hname,
            'has_api': has_api,
            'pms_writes': list(set(pms_writes)),
            'body_has_setstate': bool(re.search(r'\bset[A-Z]\w+\(', body))
        })
        
    return {
        'file': fname,
        'rel_path': os.path.relpath(fpath),
        'ls_keys': ls_keys,
        'pms_calls': pms_calls,
        'direct_fetch': direct_fetch,
        'hotel_api_calls': hotel_api_calls,
        'decentro_calls': decentro_calls,
        'state_inits': state_inits,
        'handlers': handlers
    }

components_dir = 'src/components/pms'
comp_files = [os.path.join(components_dir, f) for f in os.listdir(components_dir) if f.endswith('.tsx')]

results = [inspect_component(f) for f in comp_files]

with open('component_forensics.json', 'w', encoding='utf-8') as out:
    json.dump(results, out, indent=2)

print(f"Extracted forensics for {len(results)} PMS components.")
