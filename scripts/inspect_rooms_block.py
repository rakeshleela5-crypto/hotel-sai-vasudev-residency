with open("src/services/pmsStore.ts", "r", encoding="utf-8") as f:
    text = f.read()

import re
m = re.search(r'export const INITIAL_ROOMS: PmsRoom\[\] = \[(.*?)\n\];', text, re.DOTALL)
if m:
    rooms_block = m.group(1)
    # find all room blocks
    room_entries = re.findall(r'\{\s*id:\s*\'(\d+)\'.*?roomNo:\s*\'(\d+)\'.*?roomType:\s*\'([^\']+)\'.*?tariff:\s*(\d+)', rooms_block, re.DOTALL)
    print(f"Total rooms in INITIAL_ROOMS: {len(room_entries)}")
    for r in room_entries:
        print(f"  Room {r[1]}: id={r[0]}, type={r[2]}, tariff={r[3]}")

