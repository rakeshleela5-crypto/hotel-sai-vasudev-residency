import re
import os

files = [
    'src/components/pms/BanquetHallBillingModal.tsx',
    'src/components/pms/WhatsAppSettingModal.tsx',
    'src/components/pms/WhatsAppLogsModal.tsx',
    'src/components/pms/DayEndReportModal.tsx',
    'src/components/pms/ShiftHandoverModal.tsx',
    'src/components/pms/GuestLogModal.tsx',
    'src/components/pms/OutstandingReceivablesModal.tsx',
    'src/components/pms/ItemWiseStockModal.tsx',
    'src/components/pms/ItemWiseSalesReportModal.tsx',
    'src/components/pms/AddReceiptModal.tsx',
    'src/components/pms/AddPaymentModal.tsx',
    'src/components/pms/PaymentRegisterModal.tsx',
    'src/components/pms/ReceiptRegisterModal.tsx'
]

with open('src/services/pmsStore.ts', 'r', encoding='utf-8') as f:
    pms_store_code = f.read()

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        code = f.read()
    
    store_calls = set(re.findall(r'PmsStore\.([a-zA-Z0-9_]+)', code))
    api_calls = set(re.findall(r'hotelApi\.([a-zA-Z0-9_]+)', code))
    local_storage_calls = set(re.findall(r'localStorage\.([a-zA-Z0-9_]+)', code))

    ls_only_store = []
    api_backed_store = []
    for sc in store_calls:
        pattern = r'static\s+(?:async\s+)?' + re.escape(sc) + r'\b\s*\([^{]*\{([\s\S]*?)(?=\n\s*(?:static\s+[a-zA-Z0-9_]+\s*\(|\/\*\*|\}\s*\n))'
        m_def = re.search(pattern, pms_store_code)
        if m_def:
            body = m_def.group(1)
            if 'hotelApi.' in body or 'fetch(' in body:
                api_backed_store.append(sc)
            else:
                ls_only_store.append(sc)
        else:
            ls_only_store.append(sc)

    fname = os.path.basename(fpath)
    print(f"\n=== {fname} ===")
    print(f"  Direct hotelApi calls: {list(api_calls) if api_calls else 'None'}")
    print(f"  Direct localStorage calls: {list(local_storage_calls) if local_storage_calls else 'None'}")
    print(f"  PmsStore API-backed methods ({len(api_backed_store)}): {api_backed_store}")
    print(f"  PmsStore localStorage-only methods ({len(ls_only_store)}): {ls_only_store}")
