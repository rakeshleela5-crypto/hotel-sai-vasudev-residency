import os
import re

files_to_check = [
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
    'src/components/pms/ReceiptRegisterModal.tsx',
]

css_classes = set()
for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith('.css'):
            cpath = os.path.join(root, f)
            with open(cpath, 'r', encoding='utf-8', errors='ignore') as cfile:
                txt = cfile.read()
                matches = re.findall(r'\.([a-zA-Z0-9_\-\[\]\\:\.]+)', txt)
                for m in matches:
                    clean_m = m.split('{')[0].split('>')[0].split(':')[0].strip().replace('\\', '')
                    css_classes.add(clean_m)

all_missing = set()
for fpath in files_to_check:
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    class_instances = re.findall(r'className=["\']([^"\']+)["\']', content)
    for inst in class_instances:
        for c in inst.split():
            c = c.strip()
            if c and not c.startswith('{') and not c.startswith('$'):
                if c not in css_classes and not any(p in c for p in ['active', 'open', 'show', 'hide', 'selected', 'disabled']):
                    all_missing.add(c)

print(f"Total distinct unmapped classes across the 13 modals: {len(all_missing)}")
with open('scripts/unmapped_classes.txt', 'w', encoding='utf-8') as out:
    for c in sorted(all_missing):
        out.write(c + '\n')
print("Saved to scripts/unmapped_classes.txt")
