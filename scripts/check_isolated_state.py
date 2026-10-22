import os
import glob
import re

modals = glob.glob('src/components/pms/**/*.tsx', recursive=True)

print("=== CHECKING MODALS FOR ISOLATED COMPONENT STATE (useState with mock array) ===")
for m in sorted(modals):
    with open(m, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if component imports PmsStore or pmsStore
    has_store_import = 'pmsStore' in content or 'PmsStore' in content
    
    # Check for useState with non-empty array literal: useState([ { ... } ])
    state_matches = re.findall(r'useState<[^>]*>\s*\(\s*\[\s*\{', content)
    state_matches2 = re.findall(r'useState\s*\(\s*\[\s*\{', content)
    
    if (state_matches or state_matches2):
        print(f"{os.path.basename(m)}: has hardcoded array in useState! (Has PmsStore import: {has_store_import})")
