import glob
import os
import re

def forensic_deep_scan():
    modals = glob.glob('src/components/pms/**/*.tsx', recursive=True)
    print(f"Total PMS Modals to audit: {len(modals)}\n")

    findings = []

    for mpath in sorted(modals):
        with open(mpath, 'r', encoding='utf-8') as f:
            code = f.read()

        fname = os.path.basename(mpath)

        # 1. Check for buttons with onClick inline state mutations without API/Store
        # e.g. onClick={() => setIsSignedOff(true)}
        inline_state_actions = re.findall(r'onClick=\{\(\)\s*=>\s*\{\s*(set[A-Z][a-zA-Z0-9_]*\([^)]+\);?\s*)\}\}', code)
        inline_single = re.findall(r'onClick=\{\(\)\s*=>\s*(set[A-Z][a-zA-Z0-9_]*\([^)]+\))\}', code)
        
        all_inline = inline_state_actions + inline_single
        for action in all_inline:
            clean_act = action.strip()
            # If the action sets a state like isSignedOff, isApproved, isVerified, isCompleted, isResolved, status
            if any(w in clean_act.lower() for w in ['sign', 'approve', 'verify', 'resolve', 'complete', 'status', 'confirm', 'paid', 'accept', 'save', 'submit']):
                findings.append({
                    'file': fname,
                    'type': 'INLINE_REACT_STATE_ONLY_ACTION',
                    'detail': clean_act[:120]
                })

        # 2. Check for handler functions that perform mutations without API/PmsStore
        handlers = re.findall(r'const\s+(handle[A-Z][a-zA-Z0-9_]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{([\s\S]*?)\n  \};', code)
        for hname, hbody in handlers:
            # Skip pure UI handlers like toggle, close, tab switch, filter, print
            if any(ui in hname.lower() for ui in ['print', 'close', 'tab', 'filter', 'search', 'toggle', 'change', 'select', 'cancel', 'copy', 'view', 'navigate']):
                continue
            
            # Check if this handler is doing business operations
            is_business_action = any(b in hname.lower() for b in ['save', 'submit', 'create', 'update', 'delete', 'resolve', 'approve', 'sign', 'accept', 'verify', 'post', 'transfer', 'dispatch', 'clear', 'void', 'checkout', 'checkin', 'refund', 'generate'])
            
            if is_business_action:
                has_api = 'hotelApi.' in hbody
                has_store = 'PmsStore.' in hbody
                has_ls = 'localStorage.' in hbody

                if not has_api and not has_store:
                    findings.append({
                        'file': fname,
                        'type': 'HANDLER_MUTATION_WITHOUT_BACKEND_OR_STORE',
                        'detail': f"{hname}(): {hbody.strip()[:100].replace(chr(10), ' ')}"
                    })
                elif has_store and not has_api:
                    # Check which PmsStore methods it calls
                    store_calls = re.findall(r'PmsStore\.([a-zA-Z0-9_]+)', hbody)
                    findings.append({
                        'file': fname,
                        'type': 'HANDLER_STORE_ONLY_CHECK_IF_PERSISTED',
                        'detail': f"{hname}() calls PmsStore.{', PmsStore.'.join(store_calls)}"
                    })

    print(f"Total suspicious findings: {len(findings)}\n")
    for f in findings:
        clean_detail = f['detail'].encode('ascii', 'ignore').decode('ascii')
        print(f"[{f['type']:38}] {f['file']:30} -> {clean_detail}")

if __name__ == '__main__':
    forensic_deep_scan()
