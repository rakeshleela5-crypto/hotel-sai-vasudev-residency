import urllib.request
import json
import urllib.error

base = 'https://hotel-sai-vasudev-residency-production.up.railway.app/api/v1'

def test_ep(path, method='GET', data=None):
    url = base + path
    headers = {'User-Agent': 'Mozilla/5.0'}
    payload = None
    if data:
        headers['Content-Type'] = 'application/json'
        payload = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            try:
                parsed = json.loads(content)
                summary = str(type(parsed)) + (f" (len {len(parsed)})" if isinstance(parsed, (list, dict)) else "")
            except Exception:
                summary = f"text (len {len(content)})"
            print(f"[PASS {resp.status}] {method} {path} -> {summary}")
            return True, None
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        print(f"[FAIL {e.code}] {method} {path} -> {err_msg[:200]}")
        return False, (e.code, err_msg)
    except Exception as e:
        print(f"[ERR] {method} {path} -> {e}")
        return False, str(e)

endpoints = [
    ('/rooms', 'GET', None),
    ('/pms/sync/full-state', 'GET', None),
    ('/pms/company-info', 'GET', None),
    ('/pms/housekeeping-discrepancies', 'GET', None),
    ('/pms/key-cards', 'GET', None),
    ('/pms/virtual-accounts', 'GET', None),
    ('/pms/tables', 'GET', None),
    ('/pms/restaurant/table-shifts', 'GET', None),
    ('/pms/restaurant/table-sessions', 'GET', None),
    ('/pms/expenses', 'GET', None),
    ('/pms/lockers', 'GET', None),
    ('/pms/room-types', 'GET', None),
]

for path, method, payload in endpoints:
    test_ep(path, method, payload)
