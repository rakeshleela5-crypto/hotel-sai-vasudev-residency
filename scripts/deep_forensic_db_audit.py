import os
import re
import glob

def run_deep_audit():
    # 1. Read pmsStore.ts
    with open(os.path.join('src', 'services', 'pmsStore.ts'), 'r', encoding='utf-8') as f:
        store_code = f.read()

    # Extract STORAGE_KEYS (lines 2613-2678)
    m = re.search(r'const STORAGE_KEYS = \{([\s\S]*?)\};', store_code)
    storage_keys = {}
    if m:
        for line in m.group(1).splitlines():
            k_m = re.search(r'([A-Z0-9_]+)\s*:\s*[\'"]([^\'"]+)[\'"]', line)
            if k_m:
                storage_keys[k_m.group(1)] = k_m.group(2)

    print(f"==================================================")
    print(f"PMS STORAGE KEYS AUDIT ({len(storage_keys)} keys found)")
    print(f"==================================================")

    # 2. Read backend/app/models.py
    with open(os.path.join('backend', 'app', 'models.py'), 'r', encoding='utf-8') as f:
        models_code = f.read()
    pg_tables = re.findall(r'__tablename__\s*=\s*[\'"]([^\'"]+)[\'"]', models_code)
    print(f"PostgreSQL Tables in backend/app/models.py: {len(pg_tables)}")

    # 3. Read backend/app/routes/pms.py
    with open(os.path.join('backend', 'app', 'routes/pms.py'), 'r', encoding='utf-8') as f:
        routes_code = f.read()
    router_endpoints = re.findall(r'@router\.(get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"]', routes_code)
    print(f"FastAPI Endpoints in routes/pms.py: {len(router_endpoints)}")

    # 4. Read src/services/api.ts
    with open(os.path.join('src', 'services', 'api.ts'), 'r', encoding='utf-8') as f:
        api_code = f.read()
    api_methods = re.findall(r'async\s+([a-zA-Z0-9_]+)\s*\(', api_code)
    print(f"hotelApi client methods in api.ts: {len(api_methods)}")

    # 5. Extract initCloudStore hydration keys
    init_match = re.search(r'static async initCloudStore\(\)[\s\S]*?\{([\s\S]*?)(?:return state;|\}\s*static)', store_code)
    hydrated_keys = set()
    if init_match:
        hydrated_keys = set(re.findall(r'STORAGE_KEYS\.([A-Z0-9_]+)', init_match.group(1)))
    print(f"STORAGE_KEYS hydrated on boot in initCloudStore: {len(hydrated_keys)}")

    # 6. Detailed key-by-key audit
    print("\n---------------- KEY-BY-KEY STATUS ----------------")
    key_report = []
    for k, v in storage_keys.items():
        is_hydrated = k in hydrated_keys
        usages = len(re.findall(r'STORAGE_KEYS\.' + k, store_code))
        
        k_lower = k.lower().replace('_', '')
        has_api_mention = any(k_lower in m.lower() for m in api_methods)

        key_report.append({
            'key': k,
            'storage_val': v,
            'hydrated': is_hydrated,
            'usages': usages,
            'has_api_method': has_api_mention
        })

    # Summary table
    unhydrated = [r for r in key_report if not r['hydrated']]
    no_api = [r for r in key_report if not r['has_api_method']]

    print(f"\nKeys NOT hydrated in initCloudStore ({len(unhydrated)}):")
    for r in unhydrated:
        print(f"  [UNHYDRATED] {r['key']} ('{r['storage_val']}') - Usages: {r['usages']}, API method: {r['has_api_method']}")

    print(f"\nKeys with NO apparent hotelApi method ({len(no_api)}):")
    for r in no_api:
        print(f"  [NO_API] {r['key']} ('{r['storage_val']}') - Hydrated: {r['hydrated']}")

    # 7. Audit all components for direct localStorage or local React state alerts
    print("\n==================================================")
    print("FRONTEND MODAL & COMPONENT FORENSIC AUDIT")
    print("==================================================")
    pms_modals = glob.glob('src/components/pms/**/*.tsx', recursive=True)
    all_components = glob.glob('src/components/**/*.tsx', recursive=True)
    
    print(f"Total PMS Modals: {len(pms_modals)}")
    
    suspicious_patterns = []
    
    for mpath in pms_modals:
        with open(mpath, 'r', encoding='utf-8') as f:
            mcode = f.read()
            
        mname = os.path.basename(mpath)
        
        # Check for alert("...saved...") or toast without store or api call
        has_alert_save = bool(re.search(r'alert\([\'"][^)]*(?:saved|successful|created|updated|success)[^)]*[\'"]\)', mcode, re.I))
        calls_store = 'PmsStore.' in mcode
        calls_api = 'hotelApi.' in mcode
        uses_localstorage = 'localStorage.' in mcode
        
        # Find form onSubmits
        submits = re.findall(r'(?:handleSubmit|handleSave|handleCreate|onSubmit)\s*=?\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{([\s\S]*?)\n  \};', mcode)
        
        # If modal has save/submit but neither PmsStore nor hotelApi is invoked in submit
        for s in submits:
            if ('alert(' in s or 'toast' in s or 'set' in s) and not ('PmsStore.' in s or 'hotelApi.' in s):
                suspicious_patterns.append({
                    'file': mname,
                    'type': 'REACT_STATE_OR_ALERT_ONLY_IN_SUBMIT',
                    'snippet': s[:150].strip().replace('\n', ' ')
                })
        
        if uses_localstorage:
            suspicious_patterns.append({
                'file': mname,
                'type': 'DIRECT_LOCALSTORAGE_USAGE',
                'snippet': ', '.join(re.findall(r'localStorage\.[a-zA-Z]+\([\'"]([^\'"]+)[\'"]', mcode))
            })

    print(f"\nSuspicious frontend patterns detected ({len(suspicious_patterns)}):")
    for sp in suspicious_patterns:
        print(f"  [SUSPICIOUS] [{sp['type']}] {sp['file']}: {sp['snippet']}")

if __name__ == '__main__':
    run_deep_audit()
