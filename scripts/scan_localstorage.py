import os
import re

def scan_all_localstorage():
    src_dir = 'src'
    results = []
    for root, dirs, files in os.walk(src_dir):
        for f in files:
            if f.endswith('.ts') or f.endswith('.tsx'):
                path = os.path.join(root, f)
                rel_path = os.path.relpath(path, src_dir)
                with open(path, 'r', encoding='utf-8') as fp:
                    lines = fp.readlines()
                for idx, line in enumerate(lines, 1):
                    # match localStorage
                    m = re.findall(r'localStorage\.(getItem|setItem|removeItem)\s*\(\s*([^,\)]+)', line)
                    if m:
                        for action, arg in m:
                            arg_clean = arg.strip().strip("'\"`")
                            results.append({
                                'file': rel_path,
                                'line': idx,
                                'action': action,
                                'key_expr': arg.strip(),
                                'key_str': arg_clean
                            })
    return results

if __name__ == '__main__':
    items = scan_all_localstorage()
    print(f"Total localStorage calls in src: {len(items)}")
    by_file = {}
    for item in items:
        by_file.setdefault(item['file'], []).append(item)
    
    print("\nFiles using localStorage outside services/pmsStore.ts:")
    for f, calls in sorted(by_file.items()):
        if f != os.path.join('services', 'pmsStore.ts') and f != 'services/pmsStore.ts':
            print(f"\n--- {f} ({len(calls)} calls) ---")
            for c in calls:
                print(f"  L{c['line']}: {c['action']}({c['key_expr']})")
