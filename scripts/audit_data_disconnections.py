import os
import re
import json

PMS_DIR = 'src/components/pms'
STORE_FILE = 'src/services/pmsStore.ts'
MODELS_FILE = 'src/types/pmsModels.ts'
BACKEND_MODELS = 'backend/app/models.py'
BACKEND_ROUTES = 'backend/app/routes/pms.py'

def analyze_modals():
    files = [f for f in os.listdir(PMS_DIR) if f.endswith('.tsx')]
    print(f"Total PMS UI Components: {len(files)}")
    
    component_data = {}
    for f in sorted(files):
        path = os.path.join(PMS_DIR, f)
        with open(path, 'r', encoding='utf-8') as fp:
            content = fp.read()
        
        # Check PmsStore usage
        pms_calls = re.findall(r'PmsStore\.([a-zA-Z0-9_]+)', content)
        
        # Check localStorage usage
        ls_gets = re.findall(r'localStorage\.getItem\s*\(\s*[\'"`]([^\'"`]+)[\'"`]\s*\)', content)
        ls_sets = re.findall(r'localStorage\.setItem\s*\(\s*[\'"`]([^\'"`]+)[\'"`]', content)
        
        # Check usePmsSync
        has_sync_hook = 'usePmsSync' in content or 'PmsStore.subscribe' in content
        
        # Check mock or hardcoded state
        has_mock_state = bool(re.search(r'const\s+(?:INITIAL|MOCK|DEFAULT)_[A-Z0-9_]+\s*=', content))
        
        component_data[f] = {
            'pms_methods': sorted(list(set(pms_calls))),
            'ls_gets': sorted(list(set(ls_gets))),
            'ls_sets': sorted(list(set(ls_sets))),
            'has_sync_hook': has_sync_hook,
            'has_mock_state': has_mock_state,
            'lines': len(content.splitlines())
        }
    return component_data

def analyze_store_keys():
    with open(STORE_FILE, 'r', encoding='utf-8') as fp:
        store_content = fp.read()
        
    keys_block = re.search(r'const STORAGE_KEYS = \{([^}]+)\};', store_content)
    keys = {}
    if keys_block:
        for line in keys_block.group(1).splitlines():
            m = re.search(r'([A-Z0-9_]+)\s*:\s*[\'"]([^\'"]+)[\'"]', line)
            if m:
                keys[m.group(1)] = m.group(2)
    return keys

def main():
    modals = analyze_modals()
    store_keys = analyze_store_keys()
    
    print(f"\n--- STORAGE KEYS IN STORE ({len(store_keys)}) ---")
    for k, v in store_keys.items():
        print(f"  {k} -> {v}")
        
    # Check for components with isolated localStorage keys not in STORAGE_KEYS
    all_store_key_vals = set(store_keys.values())
    print("\n--- CHECKING FOR ISOLATED/CUSTOM LOCALSTORAGE KEYS IN COMPONENTS ---")
    custom_keys_found = {}
    for comp, data in modals.items():
        custom = (set(data['ls_gets']) | set(data['ls_sets'])) - all_store_key_vals
        if custom:
            custom_keys_found[comp] = list(custom)
            print(f"  {comp}: {custom}")
            
    # Check for components that use NO PmsStore methods at all
    print("\n--- COMPONENTS WITH ZERO PmsStore METHODS (ISOLATED/EPHEMERAL SILOS) ---")
    zero_pms = [comp for comp, d in modals.items() if len(d['pms_methods']) == 0]
    for comp in zero_pms:
        print(f"  {comp} (Lines: {modals[comp]['lines']}, LS gets: {modals[comp]['ls_gets']}, LS sets: {modals[comp]['ls_sets']})")

if __name__ == '__main__':
    main()
