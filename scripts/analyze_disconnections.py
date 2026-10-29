import re
import json

with open('frontend_api_scan.json', 'r') as f:
    api_scan = json.load(f)
backend_endpoints = api_scan['backend_endpoints']

with open('all_fetch_calls.json', 'r') as f:
    fetch_calls = json.load(f)

print(f"Loaded {len(backend_endpoints)} backend endpoints and {len(fetch_calls)} fetch calls.")

analyzed = []

for item in fetch_calls:
    ctx = item['context']
    file = item['file']
    line = item['line']
    
    # Extract url from fetch(...)
    url_match = re.search(r'fetch\s*\(\s*([`\'"][^`\'"]+[`\'"]|\$\{?[a-zA-Z0-9_\.]+\}?|[^,\)]+)', ctx)
    url_raw = url_match.group(1).strip() if url_match else "UNKNOWN"
    
    # Extract method
    method_match = re.search(r'method\s*:\s*[\'"]([A-Z]+)[\'"]', ctx)
    method = method_match.group(1).upper() if method_match else "GET"
    
    analyzed.append({
        'file': file,
        'line': line,
        'url_raw': url_raw,
        'method': method,
        'context': ctx
    })

print(f"Analyzed {len(analyzed)} fetch calls.")

with open('analyzed_calls.json', 'w', encoding='utf-8') as f:
    json.dump(analyzed, f, indent=2)

# Print unique url patterns in api.ts and decentroApi.ts
print("\nUnique calls in services/api.ts:")
for a in analyzed:
    if 'services' in a['file']:
        print(f"[{a['method']}] {a['file']}:{a['line']} -> {a['url_raw']}")
