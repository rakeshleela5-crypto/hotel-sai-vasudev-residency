import glob
import os
import re

def main():
    modals = glob.glob('src/components/pms/**/*.tsx', recursive=True)
    print(f"Checking {len(modals)} modals in src/components/pms/...\n")

    results = []
    for m in sorted(modals):
        with open(m, 'r', encoding='utf-8') as f:
            code = f.read()

        fname = os.path.basename(m)
        has_api = 'hotelApi.' in code or 'fetch(' in code or 'axios' in code
        has_store = 'PmsStore.' in code

        # Search for alerts, toasts, or state messages indicating action completion
        alerts = re.findall(r'alert\((.*?)\)', code, re.DOTALL)
        set_states = re.findall(r'set[A-Za-z0-9_]*(?:Message|Success|Status|Notice|Feedback)\((.*?)\)', code, re.DOTALL)
        
        all_msgs = alerts + set_states
        action_msgs = []
        for msg in all_msgs:
            clean = ' '.join(msg.split())
            if any(w in clean.lower() for w in ['success', 'saved', 'created', 'updated', 'registered', 'recorded', 'generated', 'completed', 'verified', 'transferred', 'posted', 'cleared', 'booked', 'dispatched', 'confirmed']):
                action_msgs.append(clean[:120])

        if action_msgs or not has_store:
            status = 'BOTH' if (has_api and has_store) else ('API_ONLY' if has_api else ('STORE_ONLY' if has_store else 'NEITHER_REACT_STATE_ONLY'))
            results.append({
                'file': fname,
                'path': m,
                'status': status,
                'action_msgs': action_msgs[:3]
            })

    print(f"{'STATUS':26} | {'MODAL FILE':40} | {'SAMPLE USER MESSAGE'}")
    print("-" * 110)
    for r in results:
        msg_sample = r['action_msgs'][0] if r['action_msgs'] else '(No explicit alert/msg string)'
        msg_clean = msg_sample.encode('ascii', 'ignore').decode('ascii')
        print(f"{r['status']:26} | {r['file']:40} | {msg_clean[:40]}")

    print("\n--- DEEP FOCUS: Modals with NEITHER (React State Only) or STORE_ONLY ---")
    dangerous = [r for r in results if r['status'] in ('NEITHER_REACT_STATE_ONLY', 'STORE_ONLY')]
    print(f"Total modals not directly calling backend API: {len(dangerous)}")
    for d in dangerous:
        print(f"  [{d['status']:24}] {d['file']}")
        for msg in d['action_msgs']:
            m_clean = msg.encode('ascii', 'ignore').decode('ascii')
            print(f"       -> {m_clean}")

if __name__ == '__main__':
    main()
