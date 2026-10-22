import os
import re

with open('src/services/pmsStore.ts', 'r', encoding='utf-8') as f:
    store_code = f.read()

print("--- EXAMINING VECTOR 1: ROOM SHIFTING METHODS IN pmsStore.ts ---")
# Find transferRoom and shiftRoom definitions and contents
transfer_match = re.search(r'(static\s+transferRoom\s*\([^)]*\)\s*:\s*[^{]*\{[\s\S]*?\n  \})', store_code)
if transfer_match:
    print(f"transferRoom length: {len(transfer_match.group(1))} chars")
    # check what keys are migrated
    for k in ['KOTS', 'FOLIO_PAYMENTS', 'FOLIO_DISCOUNTS', 'ADVANCE_RECEIPTS', 'OTHER_CHARGES', 'ROOM_SHIFTS']:
        found = k in transfer_match.group(1)
        print(f"  transferRoom migrates {k}: {found}")

shift_match = re.search(r'(static\s+shiftRoom\s*\([^)]*\)\s*:\s*[^{]*\{[\s\S]*?\n  \})', store_code)
if shift_match:
    print(f"shiftRoom length: {len(shift_match.group(1))} chars")
    for k in ['KOTS', 'FOLIO_PAYMENTS', 'FOLIO_DISCOUNTS', 'ADVANCE_RECEIPTS', 'OTHER_CHARGES', 'ROOM_SHIFTS']:
        found = k in shift_match.group(1)
        print(f"  shiftRoom migrates {k}: {found}")

print("\n--- EXAMINING VECTOR 2: CHECKOUT & LEDGERS IN pmsStore.ts ---")
checkout_match = re.search(r'(static\s+completeCheckOut\s*\([^)]*\)\s*:\s*[^{]*\{[\s\S]*?\n  \})', store_code)
if checkout_match:
    ch_code = checkout_match.group(1)
    print(f"completeCheckOut length: {len(ch_code)} chars")
    print(f"  Updates JOURNAL_ENTRIES: {'JOURNAL_ENTRIES' in ch_code}")
    print(f"  Updates RECEIPTS: {'RECEIPTS' in ch_code}")
    print(f"  Updates PARTY_ACCOUNTS: {'PARTY_ACCOUNTS' in ch_code}")
    print(f"  Updates OUTSTANDING: {'OUTSTANDING' in ch_code or 'outstanding' in ch_code.lower()}")
    print(f"  Updates HOUSEKEEPING: {'HOUSEKEEPING' in ch_code or 'housekeeping' in ch_code.lower()}")
    print(f"  Updates GUEST_LOG: {'GUEST_LOG' in ch_code or 'guestlog' in ch_code.lower()}")
    print(f"  Cleans up KOTS: {'kots' in ch_code.lower()}")
    print(f"  Cleans up FOLIO_PAYMENTS: {'folio_payments' in ch_code.lower() or 'foliopayments' in ch_code.lower()}")
    print(f"  Cleans up FOLIO_DISCOUNTS: {'folio_discounts' in ch_code.lower() or 'foliodiscounts' in ch_code.lower()}")

print("\n--- EXAMINING VECTOR 4: ADVANCE RECEIPT & REGISTERS ---")
adv_match = re.search(r'(static\s+addAdvanceReceipt\s*\([^)]*\)\s*:\s*[^{]*\{[\s\S]*?\n  \})', store_code)
if adv_match:
    adv_code = adv_match.group(1)
    print(f"addAdvanceReceipt length: {len(adv_code)} chars")
    print(f"  Updates RECEIPTS: {'RECEIPTS' in adv_code}")
    print(f"  Updates JOURNAL_ENTRIES: {'JOURNAL_ENTRIES' in adv_code}")
    print(f"  Updates Room Balance/Advance: {'advanceAmount' in adv_code or 'balance' in adv_code}")

print("\n--- EXAMINING VECTOR 5: PURCHASES & STOCK ---")
pur_match = re.search(r'(static\s+addPurchaseBill\s*\([^)]*\)\s*:\s*[^{]*\{[\s\S]*?\n  \})', store_code)
if pur_match:
    pur_code = pur_match.group(1)
    print(f"addPurchaseBill length: {len(pur_code)} chars")
    print(f"  Updates GODOWNS / Stocks: {'godown' in pur_code.lower() or 'stock' in pur_code.lower()}")
    print(f"  Updates PAYMENTS / PAYABLES: {'payments' in pur_code.lower() or 'outstanding' in pur_code.lower() or 'party' in pur_code.lower()}")
    print(f"  Updates JOURNAL_ENTRIES: {'journal' in pur_code.lower()}")

print("\n--- EXAMINING VECTOR 10: CLOUD SYNC IN pmsStore.ts ---")
sync_match = re.search(r'(static\s+syncWithCloudBackend\s*\([^)]*\)\s*:\s*[^{]*\{[\s\S]*?\n  \})', store_code)
if sync_match:
    sync_code = sync_match.group(1)
    print(f"syncWithCloudBackend length: {len(sync_code)} chars")
    # see what keys are sent to backend
    keys_sent = re.findall(r'([a-zA-Z0-9_]+)\s*:\s*(?:this\.|STORAGE_KEYS|JSON\.parse)', sync_code)
    print(f"  Keys included in syncWithCloudBackend: {set(keys_sent)}")
