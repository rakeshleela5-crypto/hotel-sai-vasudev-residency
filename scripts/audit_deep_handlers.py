import os
import glob
import re

modals = sorted(glob.glob('src/components/pms/**/*.tsx', recursive=True))

print(f"Total PMS Modals to audit: {len(modals)}\n")

disconnections = []

for m in modals:
    fname = os.path.basename(m)
    with open(m, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Look for TODOs or FIXMEs
    todos = re.findall(r'(?://|/\*)\s*(?:TODO|FIXME|stub|mock|hardcoded|placeholder)[^\n]*', content, re.IGNORECASE)
    if todos:
        for t in todos:
            if 'canonical' not in t.lower() and 'roomg' not in t.lower() and 'video' not in t.lower():
                disconnections.append((fname, "TODO/STUB comment", t.strip()))

    # 2. Look for empty handlers: onClick={() => {}} or () => alert('...')
    empty_handlers = re.findall(r'on\w+=\{?\s*\(\)\s*=>\s*\{\s*\}', content)
    if empty_handlers:
        disconnections.append((fname, "Empty Handler", f"{len(empty_handlers)} empty on* handler(s)"))

    # 3. Check for alerts that indicate unfinished features
    dummy_alerts = re.findall(r'alert\s*\(\s*[\'"][^\'"]*(?:coming soon|not implemented|work in progress|dummy|demo only)[^\'"]*[\'"]\s*\)', content, re.IGNORECASE)
    if dummy_alerts:
        for a in dummy_alerts:
            disconnections.append((fname, "Unimplemented Alert", a))

    # 4. Check if modal has a Save/Submit button that does NOT call PmsStore
    # We look for form submit or save buttons
    save_buttons = re.findall(r'(?:handleSave|handleSubmit|handleConfirm|handleCreate|handleRecord|handleAdd)\w*', content)
    for handler_name in set(save_buttons):
        # find the function definition
        func_match = re.search(rf'const\s+{handler_name}\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{{(.*?)\n  \}};', content, re.DOTALL)
        if not func_match:
            func_match = re.search(rf'function\s+{handler_name}\s*\([^)]*\)\s*\{{(.*?)\n  \}}', content, re.DOTALL)
        if func_match:
            func_body = func_match.group(1)
            # Check if func body writes to PmsStore or calls onSave / onClose / props
            if 'PmsStore' not in func_body and 'localStorage' not in func_body and 'onSave' not in func_body and 'onSubmit' not in func_body and 'onSuccess' not in func_body:
                # If it only does setState, it's an isolated local state!
                if 'set' in func_body:
                    disconnections.append((fname, f"Isolated Handler: {handler_name}", "Modifies local state without persisting to PmsStore or calling parent callback!"))

print("=== AUDIT REPORT: DETECTED DISCONNECTIONS & STUBS ===")
for d in disconnections:
    print(f"[{d[0]}] - {d[1]}: {d[2]}")
