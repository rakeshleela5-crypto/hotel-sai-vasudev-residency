import os
import re
import json

with open('frontend_api_scan.json', 'r') as f:
    data = json.load(f)

backend_endpoints = data['backend_endpoints']

# Scan src/services/api.ts and other files for all fetch calls
fetch_calls = []

pattern = re.compile(r'fetch\s*\(\s*([^\)]+)\)', re.DOTALL)

for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            fpath = os.path.join(root, f)
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                content = fp.read()
                lines = content.split('\n')
                for line_idx, line in enumerate(lines):
                    if 'fetch(' in line or 'fetch (' in line:
                        fetch_calls.append({
                            'file': fpath,
                            'line': line_idx + 1,
                            'context': '\n'.join(lines[max(0, line_idx - 2):min(len(lines), line_idx + 8)])
                        })

print(f"Total fetch calls in frontend: {len(fetch_calls)}")

with open('all_fetch_calls.json', 'w', encoding='utf-8') as out:
    json.dump(fetch_calls, out, indent=2)

print("Saved all_fetch_calls.json")
