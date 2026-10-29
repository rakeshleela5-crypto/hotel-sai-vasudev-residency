import json
import re

with open('frontend_api_scan.json', 'r') as f:
    api_scan = json.load(f)
backend_endpoints = api_scan['backend_endpoints']

with open('analyzed_calls.json', 'r') as f:
    analyzed_calls = json.load(f)

# Normalize backend endpoints to regex
def endpoint_to_regex(endpoint):
    # replace {param} with [^/]+
    pattern = re.sub(r'\{[^}]+\}', r'[^/]+', endpoint)
    return f"^{pattern}$"

backend_patterns = []
for ep, methods in backend_endpoints.items():
    backend_patterns.append({
        'raw': ep,
        'regex': re.compile(endpoint_to_regex(ep)),
        'methods': [m.upper() for m in methods]
    })

disconnections = []

for call in analyzed_calls:
    file = call['file']
    line = call['line']
    url_raw = call['url_raw']
    method = call['method']
    ctx = call['context']

    # Clean url_raw
    # e.g. `${API_BASE_URL}/pms/rooms` -> `/api/v1/pms/rooms`
    clean_url = url_raw
    clean_url = clean_url.replace('${API_BASE_URL}', '/api/v1')
    clean_url = clean_url.replace('${rootUrl}', '')
    clean_url = re.sub(r'\$\{[^}]+\}', 'TEST_PARAM', clean_url)
    clean_url = clean_url.strip('`\'"')

    # Remove query string for matching
    clean_path = clean_url.split('?')[0]

    # Check if matches any backend pattern
    matched = False
    method_matched = False
    matched_ep = None
    
    for bp in backend_patterns:
        if bp['regex'].match(clean_path):
            matched = True
            matched_ep = bp['raw']
            if method in bp['methods']:
                method_matched = True
            break
            
    if not matched:
        disconnections.append({
            'file': file,
            'line': line,
            'issue': 'URL_NOT_FOUND',
            'url_raw': url_raw,
            'clean_path': clean_path,
            'method': method,
            'details': 'No matching backend endpoint found in FastAPI routes',
            'context': ctx[:200]
        })
    elif not method_matched:
        disconnections.append({
            'file': file,
            'line': line,
            'issue': 'METHOD_MISMATCH',
            'url_raw': url_raw,
            'clean_path': clean_path,
            'method': method,
            'expected_methods': [m for bp in backend_patterns if bp['raw'] == matched_ep for m in bp['methods']],
            'matched_endpoint': matched_ep,
            'details': f'Method {method} not allowed on endpoint {matched_ep}',
            'context': ctx[:200]
        })

print(f"Total potential disconnections detected: {len(disconnections)}")
for d in disconnections:
    print(f"[{d['issue']}] {d['file']}:{d['line']} -> {d['method']} {d['clean_path']} (raw: {d['url_raw']})")

with open('disconnections_report.json', 'w', encoding='utf-8') as f:
    json.dump(disconnections, f, indent=2)
