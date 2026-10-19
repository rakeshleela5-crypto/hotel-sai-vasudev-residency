import os
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT_DIR, "src")

REPLACEMENTS = [
    (r"demo\.datahouseerp\.com says[:\s]*\\n\\n", "Hotel Sai Vasudev Residency:\\n\\n"),
    (r"demo\.datahouseerp\.com says[:\s]*\n\n", "Hotel Sai Vasudev Residency:\n\n"),
    (r"demo\.datahouseerp\.com says", "Hotel Sai Vasudev Residency:"),
    (r"https://demo\.datahouseerp\.com", "https://hotel-sai-vasudev-residency.pages.dev"),
    (r"demo\.datahouseerp\.com", "pms.hotelsai-vasudev.com"),
]

def clean_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content
    for pattern, replacement in REPLACEMENTS:
        new_content = re.sub(pattern, replacement, new_content)

    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"[CLEANED] {os.path.relpath(filepath, ROOT_DIR)}")
        return 1
    return 0

def main():
    total_cleaned = 0
    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            if f.endswith((".ts", ".tsx")):
                total_cleaned += clean_file(os.path.join(root, f))
    print(f"\nDone! Cleaned {total_cleaned} files.")

if __name__ == "__main__":
    main()
