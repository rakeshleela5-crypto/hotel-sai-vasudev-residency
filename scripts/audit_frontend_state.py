import os
import re
import json

def analyze_pms_components():
    components_dir = 'src/components/pms'
    all_files = []
    for root, dirs, files in os.walk('src'):
        for f in files:
            if f.endswith('.tsx') or f.endswith('.ts'):
                all_files.append(os.path.join(root, f))

    findings = []
    
    for fpath in sorted(all_files):
        with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # 1. localStorage / sessionStorage
        ls_calls = re.findall(r'(localStorage|sessionStorage)\.(getItem|setItem|removeItem|clear)\(([^)]*)\)', content)
        
        # 2. Initial state with hardcoded data
        # Check useState patterns
        state_inits = []
        for match in re.finditer(r'const\s+\[(\w+),\s*(set\w+)\]\s*=\s*useState(?:<[^>]+>)?\(([\s\S]*?)\);', content):
            var_name, setter, init_val = match.groups()
            init_val_clean = init_val.strip()
            # If init_val has object/array literals with items or hardcoded strings
            if (init_val_clean.startswith('[') and len(init_val_clean) > 2) or \
               (init_val_clean.startswith('{') and len(init_val_clean) > 10) or \
               ('INITIAL_' in init_val_clean) or ('DEFAULT_' in init_val_clean):
                state_inits.append({
                    'var': var_name,
                    'setter': setter,
                    'init_snippet': init_val_clean[:120].replace('\n', ' ')
                })

        # 3. Form submit / save handlers
        handlers = []
        for match in re.finditer(r'(?:const|function)\s+(handle[A-Z]\w+|on[A-Z]\w+|save[A-Z]\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?:=>)?\s*\{([\s\S]*?)\n  \};', content):
            h_name, params, body = match.groups()
            calls_fetch = 'fetch(' in body
            calls_hotel_api = 'hotelApi.' in body
            calls_decentro_api = 'decentroApi.' in body
            calls_pms_store = 'PmsStore.' in body
            pms_methods = re.findall(r'PmsStore\.(\w+)\(', body)
            calls_set_state = bool(re.search(r'\bset[A-Z]\w+\(', body))
            
            # Check if it mutates state without backend call
            if not calls_fetch and not calls_hotel_api and not calls_decentro_api:
                handlers.append({
                    'name': h_name,
                    'calls_pms_store': calls_pms_store,
                    'pms_methods': pms_methods,
                    'calls_set_state': calls_set_state,
                    'body_preview': body.strip()[:150].replace('\n', ' ')
                })

        if ls_calls or state_inits or handlers:
            findings.append({
                'file': os.path.relpath(fpath),
                'ls_calls': [{'type': c[0], 'action': c[1], 'arg': c[2].strip()} for c in ls_calls],
                'state_inits': state_inits,
                'handlers_without_api': handlers
            })

    with open('frontend_state_audit.json', 'w', encoding='utf-8') as out:
        json.dump(findings, out, indent=2)

    print(f"Audit completed. Analyzed {len(all_files)} files. Found {len(findings)} files with isolated state, localStorage, or transient handlers.")

if __name__ == '__main__':
    analyze_pms_components()
