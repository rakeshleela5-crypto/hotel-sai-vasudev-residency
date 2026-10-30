import json

with open('backend_inventory.json') as f:
    d = json.load(f)

print(f"{'Table Name':<30} | {'Model Class':<25} | {'Columns Count'}")
print("-" * 75)
for k, v in sorted(d['models'].items(), key=lambda x: str(x[1]['table_name'])):
    tname = v['table_name'] or 'None'
    print(f"{tname:<30} | {k:<25} | {len(v['columns'])} cols: {', '.join(v['columns'][:6])}")
