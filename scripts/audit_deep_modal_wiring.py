import os
import glob
import re

modals = sorted(glob.glob('src/components/pms/**/*.tsx', recursive=True))

print(f"=== DEEP AUDITING ALL {len(modals)} PMS MODALS FOR DISCONNECTIONS & SILOS ===\n")

findings = []

for m in modals:
    fname = os.path.basename(m)
    with open(m, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Check for unused submodal states: const [isOpenX, setIsOpenX] = useState(false);
    state_matches = re.findall(r'const\s+\[([a-zA-Z0-9_]+ModalOpen|[a-zA-Z0-9_]+Open),\s*(set[a-zA-Z0-9_]+)\]\s*=\s*useState\s*\(\s*false\s*\)', content)
    for state_var, setter_var in state_matches:
        # Check if setter_var is called with true or toggle anywhere
        setter_calls = re.findall(rf'{setter_var}\s*\(\s*(true|!|prev)', content)
        if not setter_calls:
            findings.append((fname, f"Dead Submodal State: {state_var}", f"{setter_var}(true/toggle) is never called! Submodal is unreachable."))

    # 2. Check for button or elements with onClick that only do console.log
    console_clicks = re.findall(r'onClick\s*=\s*\{\s*\(\)\s*=>\s*console\.log\([^)]*\)\s*\}', content)
    if console_clicks:
        findings.append((fname, "Console.log Click", f"{len(console_clicks)} button(s) only log to console!"))

    # 3. Check for buttons that have no onClick handler at all
    # e.g. <button className="..." >Save</button> without type="submit" in a form, or without onClick
    button_tags = re.findall(r'<button\b([^>]*)>(.*?)</button>', content, re.DOTALL)
    for attrs, inner in button_tags:
        text_clean = re.sub(r'<[^>]+>', '', inner).strip()
        if any(keyword in text_clean.lower() for keyword in ['save', 'submit', 'delete', 'cancel', 'update', 'confirm', 'apply', 'settle', 'print', 'export', 'transfer']):
            if 'onclick' not in attrs.lower() and 'type="submit"' not in attrs.lower() and 'type=\'submit\'' not in attrs.lower():
                findings.append((fname, f"Button missing action: '{text_clean}'", "Has action text but no onClick or type='submit'!"))

    # 4. Check for alerts in handlers
    simple_alerts = re.findall(r'onClick\s*=\s*\{\s*\(\)\s*=>\s*alert\(\s*[\'"]([^\'"]+)[\'"]\s*\)\s*\}', content)
    for a in simple_alerts:
        findings.append((fname, "Static Alert Click", f"onClick direct alert: {a}"))

print(f"Total findings: {len(findings)}\n")
for f in findings:
    print(f"[{f[0]}] -> {f[1]}: {f[2]}")
