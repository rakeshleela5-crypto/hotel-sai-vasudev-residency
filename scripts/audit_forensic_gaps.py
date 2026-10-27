import glob
import os
import re

def audit():
    modals = glob.glob('src/components/pms/**/*.tsx', recursive=True)
    print(f"Total modals found: {len(modals)}")

    gap_report = []

    for m in sorted(modals):
        with open(m, 'r', encoding='utf-8') as f:
            content = f.read()
        
        fname = os.path.basename(m)

        # 1. Direct localStorage usage
        ls_matches = re.findall(r'localStorage\.(getItem|setItem|removeItem)\([\'"]([^\'"]+)[\'"]', content)
        
        # 2. Check if file imports hotelApi
        has_api = 'hotelApi' in content
        
        # 3. Check for mutating PmsStore calls
        store_mutations = re.findall(r'PmsStore\.([a-zA-Z0-9_]+)', content)
        mutation_calls = [c for c in store_mutations if any(act in c.lower() for act in ['save', 'delete', 'update', 'add', 'record', 'create', 'clear', 'resolve', 'extend', 'post', 'shift', 'checkin', 'checkout'])]
        
        # 4. Check for submit / save handlers
        handlers = re.findall(r'const\s+(handle[a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{([\s\S]*?)\n  \};', content)
        
        # 5. Check for buttons
        buttons = re.findall(r'<button[^>]*>([\s\S]*?)</button>', content)
        save_buttons = [b.strip() for b in buttons if any(w in b.lower() for w in ['save', 'submit', 'confirm', 'delete', 'resolve', 'accept', 'sign', 'post', 'update', 'extend', 'shift'])]

        for hname, hbody in handlers:
            if any(w in hname.lower() for w in ['save', 'submit', 'confirm', 'delete', 'resolve', 'accept', 'sign', 'post', 'update', 'extend', 'shift', 'create']):
                # Does this handler call hotelApi?
                h_has_api = 'hotelApi.' in hbody
                # Does this handler call PmsStore?
                h_store_calls = re.findall(r'PmsStore\.([a-zA-Z0-9_]+)', hbody)
                h_has_ls = 'localStorage.' in hbody
                
                # If neither hotelApi nor PmsStore, or only setting React state / alert
                if not h_has_api and not h_store_calls:
                    gap_report.append({
                        'file': fname,
                        'handler': hname,
                        'issue': 'NO_BACKEND_NO_STORE_REACT_STATE_ONLY',
                        'detail': hbody.strip()[:120].replace('\n', ' ')
                    })
                elif not h_has_api and h_store_calls:
                    gap_report.append({
                        'file': fname,
                        'handler': hname,
                        'issue': 'STORE_ONLY',
                        'store_calls': h_store_calls
                    })

        if ls_matches:
            gap_report.append({
                'file': fname,
                'handler': 'TOP_LEVEL/EFFECT',
                'issue': 'DIRECT_LOCALSTORAGE',
                'detail': str(ls_matches)
            })

    print(f"Total gaps identified: {len(gap_report)}")
    for g in gap_report:
        print(f"[{g['issue']:35}] {g['file']:30} :: {g.get('handler','')} -> {g.get('detail', g.get('store_calls', ''))}")

if __name__ == '__main__':
    audit()
