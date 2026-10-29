import os
import re
import json

backend_routes = set()

# 1. Get backend routes from app
import sys
sys.path.insert(0, 'backend')
from app.main import app

openapi = app.openapi()
paths = openapi.get('paths', {})

backend_map = {} # path -> list of methods
for p, p_info in paths.items():
    backend_map[p] = list(p_info.keys())

print(f"Loaded {len(backend_map)} backend endpoints from OpenAPI.")

# 2. Scan frontend files
frontend_calls = []
for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            fpath = os.path.join(root, f)
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                content = fp.read()
                lines = content.split('\n')
                for line_no, line in enumerate(lines, 1):
                    # Find all strings that look like endpoints or URLs
                    matches = re.findall(r'[`\'"]([/][a-zA-Z0-9_\-\./\$\{\}:]+)[`\'"]', line)
                    for m in matches:
                        if m.startswith('/api') or m.startswith('/pms') or m.startswith('/uploads') or m.startswith('/bookings') or m.startswith('/rooms') or m.startswith('/auth') or m.startswith('/health'):
                            frontend_calls.append({
                                'file': fpath,
                                'line': line_no,
                                'endpoint': m,
                                'snippet': line.strip()
                            })

print(f"Discovered {len(frontend_calls)} frontend API references.")

with open('frontend_api_scan.json', 'w', encoding='utf-8') as out:
    json.dump({
        'backend_endpoints': backend_map,
        'frontend_calls': frontend_calls
    }, out, indent=2)

print("Saved frontend_api_scan.json")
