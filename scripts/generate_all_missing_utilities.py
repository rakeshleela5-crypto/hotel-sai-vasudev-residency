import re

with open('scripts/unmapped_classes.txt', 'r', encoding='utf-8') as f:
    classes = [line.strip() for line in f if line.strip()]

css_rules = []

# Color mappings
colors = {
    'emerald-50': '#ecfdf5', 'emerald-100': '#d1fae5', 'emerald-200': '#a7f3d0', 'emerald-300': '#6ee7b7',
    'emerald-400': '#34d399', 'emerald-500': '#10b981', 'emerald-600': '#059669', 'emerald-700': '#047857',
    'emerald-800': '#065f46', 'emerald-900': '#064e3b', 'emerald-950': '#022c22',
    'amber-50': '#fffbeb', 'amber-100': '#fef3c7', 'amber-200': '#fde68a', 'amber-300': '#fcd34d',
    'amber-400': '#fbbf24', 'amber-500': '#f59e0b', 'amber-600': '#d97706', 'amber-700': '#b45309',
    'amber-800': '#92400e', 'amber-900': '#78350f',
    'blue-50': '#eff6ff', 'blue-100': '#dbeafe', 'blue-200': '#bfdbfe', 'blue-300': '#93c5fd',
    'blue-400': '#60a5fa', 'blue-500': '#3b82f6', 'blue-600': '#2563eb', 'blue-700': '#1d4ed8',
    'blue-800': '#1e40af', 'blue-900': '#1e3a8a',
    'rose-50': '#fff1f2', 'rose-100': '#ffe4e6', 'rose-200': '#fecdd3', 'rose-300': '#fda4af',
    'rose-400': '#fb7185', 'rose-500': '#f43f5e', 'rose-600': '#e11d48', 'rose-700': '#be123c',
    'rose-800': '#9f1239', 'rose-900': '#881337',
    'red-50': '#fef2f2', 'red-100': '#fee2e2', 'red-600': '#dc2626', 'red-700': '#b91c1c', 'red-800': '#991b1b',
    'slate-50': '#f8fafc', 'slate-100': '#f1f5f9', 'slate-200': '#e2e8f0', 'slate-300': '#cbd5e1',
    'slate-400': '#94a3b8', 'slate-500': '#64748b', 'slate-600': '#475569', 'slate-700': '#334155',
    'slate-800': '#1e293b', 'slate-900': '#0f172a', 'slate-950': '#020617',
    'gray-50': '#f9fafb', 'gray-100': '#f3f4f6', 'gray-200': '#e5e7eb', 'gray-300': '#d1d5db',
    'gray-400': '#9ca3af', 'gray-500': '#6b7280', 'gray-600': '#4b5563', 'gray-700': '#374151',
    'gray-800': '#1f2937', 'gray-900': '#111827',
    'indigo-50': '#eef2ff', 'indigo-100': '#e0e7ff', 'indigo-200': '#c7d2fe', 'indigo-800': '#3730a3', 'indigo-900': '#312e81',
    'purple-100': '#f3e8ff', 'purple-700': '#7e22ce', 'teal-900': '#134e4a',
    'black': '#000000', 'white': '#ffffff'
}

for cls in classes:
    # Escape class for CSS selector
    selector = '.' + re.sub(r'([:\/\[\]%#\.])', r'\\\1', cls)
    
    # 1. Backgrounds
    if cls.startswith('bg-'):
        rest = cls[3:]
        if rest in colors:
            css_rules.append(f"{selector} {{ background-color: {colors[rest]} !important; }}")
        elif '/20' in rest:
            base = rest.split('/')[0]
            c = colors.get(base, '#10b981')
            css_rules.append(f"{selector} {{ background-color: rgba(16, 185, 129, 0.2) !important; }}")
        elif '/30' in rest:
            base = rest.split('/')[0]
            css_rules.append(f"{selector} {{ background-color: rgba(5, 150, 105, 0.3) !important; }}")
        elif '/60' in rest:
            base = rest.split('/')[0]
            css_rules.append(f"{selector} {{ background-color: rgba(15, 23, 42, 0.6) !important; }}")
        elif '/70' in rest:
            base = rest.split('/')[0]
            css_rules.append(f"{selector} {{ background-color: rgba(15, 23, 42, 0.7) !important; }}")
        elif '/75' in rest:
            base = rest.split('/')[0]
            css_rules.append(f"{selector} {{ background-color: rgba(15, 23, 42, 0.75) !important; }}")
        elif '/80' in rest:
            base = rest.split('/')[0]
            css_rules.append(f"{selector} {{ background-color: rgba(15, 23, 42, 0.8) !important; }}")
        elif '/90' in rest:
            base = rest.split('/')[0]
            css_rules.append(f"{selector} {{ background-color: rgba(15, 23, 42, 0.9) !important; }}")
        elif '/95' in rest:
            base = rest.split('/')[0]
            css_rules.append(f"{selector} {{ background-color: rgba(15, 23, 42, 0.95) !important; }}")
        elif rest == 'gradient-to-r':
            css_rules.append(f"{selector} {{ background-image: linear-gradient(to right, var(--tw-gradient-stops, #065f46, #0f172a)) !important; }}")
        elif rest == 'gradient-to-t':
            css_rules.append(f"{selector} {{ background-image: linear-gradient(to top, var(--tw-gradient-stops, #0f172a, transparent)) !important; }}")
        elif '[#e5ddd5]' in rest:
            css_rules.append(f"{selector} {{ background-color: #e5ddd5 !important; }}")
        elif '[#FFFF00]' in rest:
            css_rules.append(f"{selector} {{ background-color: #FFFF00 !important; }}")

    # 2. Text colors
    elif cls.startswith('text-'):
        rest = cls[5:]
        if rest in colors:
            css_rules.append(f"{selector} {{ color: {colors[rest]} !important; }}")
        elif rest == 'center':
            css_rules.append(f"{selector} {{ text-align: center !important; }}")
        elif rest == 'left':
            css_rules.append(f"{selector} {{ text-align: left !important; }}")
        elif rest == 'right':
            css_rules.append(f"{selector} {{ text-align: right !important; }}")
        elif rest == 'justify':
            css_rules.append(f"{selector} {{ text-align: justify !important; }}")
        elif rest == '[9px]':
            css_rules.append(f"{selector} {{ font-size: 9px !important; }}")
        elif rest == '[10px]':
            css_rules.append(f"{selector} {{ font-size: 10px !important; }}")
        elif rest == '2xl':
            css_rules.append(f"{selector} {{ font-size: 24px !important; line-height: 32px !important; }}")
        elif rest == '3xl':
            css_rules.append(f"{selector} {{ font-size: 30px !important; line-height: 36px !important; }}")

    # 3. Borders
    elif cls.startswith('border-'):
        rest = cls[7:]
        if rest in colors:
            css_rules.append(f"{selector} {{ border-color: {colors[rest]} !important; }}")
        elif rest.startswith('t-2'):
            css_rules.append(f"{selector} {{ border-top-width: 2px !important; }}")
        elif rest.startswith('t-transparent'):
            css_rules.append(f"{selector} {{ border-top-color: transparent !important; }}")
        elif rest.startswith('l-4'):
            css_rules.append(f"{selector} {{ border-left-width: 4px !important; }}")
        elif rest == 'collapse':
            css_rules.append(f"{selector} {{ border-collapse: collapse !important; }}")
        elif rest == 'dashed':
            css_rules.append(f"{selector} {{ border-style: dashed !important; }}")
        elif '/40' in rest or '/50' in rest or '/60' in rest or '/80' in rest:
            css_rules.append(f"{selector} {{ border-color: rgba(52, 211, 153, 0.4) !important; }}")

    # 4. Grids & Flex
    elif cls == 'grid':
        css_rules.append(f"{selector} {{ display: grid !important; }}")
    elif cls.startswith('grid-cols-'):
        cols = cls[10:]
        css_rules.append(f"{selector} {{ grid-template-columns: repeat({cols}, minmax(0, 1fr)) !important; }}")
    elif cls.startswith('col-span-'):
        span = cls[9:]
        css_rules.append(f"{selector} {{ grid-column: span {span} / span {span} !important; }}")
    elif cls == 'block':
        css_rules.append(f"{selector} {{ display: block !important; }}")
    elif cls == 'inline-block':
        css_rules.append(f"{selector} {{ display: inline-block !important; }}")
    elif cls == 'inline-flex':
        css_rules.append(f"{selector} {{ display: inline-flex !important; }}")
    elif cls == 'justify-end':
        css_rules.append(f"{selector} {{ justify-content: flex-end !important; }}")
    elif cls == 'justify-start':
        css_rules.append(f"{selector} {{ justify-content: flex-start !important; }}")

    # 5. Spacing
    elif cls.startswith('space-y-'):
        val = int(float(cls[8:]) * 4)
        css_rules.append(f"{selector} > :not([hidden]) ~ :not([hidden]) {{ margin-top: {val}px !important; }}")
    elif cls.startswith('space-x-'):
        val = int(float(cls[8:]) * 4)
        css_rules.append(f"{selector} > :not([hidden]) ~ :not([hidden]) {{ margin-left: {val}px !important; }}")

    # 6. Widths & Heights
    elif cls.startswith('w-'):
        w_val = cls[2:]
        if w_val.isdigit():
            px = int(w_val) * 4
            css_rules.append(f"{selector} {{ width: {px}px !important; }}")
        elif w_val == 'auto':
            css_rules.append(f"{selector} {{ width: auto !important; }}")
        elif w_val == '1/2':
            css_rules.append(f"{selector} {{ width: 50% !important; }}")
        elif w_val == '1/3':
            css_rules.append(f"{selector} {{ width: 33.333333% !important; }}")
        elif w_val == '2/3':
            css_rules.append(f"{selector} {{ width: 66.666667% !important; }}")
        elif w_val == '1/4':
            css_rules.append(f"{selector} {{ width: 25% !important; }}")
        elif w_val == '3/4':
            css_rules.append(f"{selector} {{ width: 75% !important; }}")
    elif cls.startswith('h-'):
        h_val = cls[2:]
        if h_val.isdigit():
            px = int(h_val) * 4
            css_rules.append(f"{selector} {{ height: {px}px !important; }}")
        elif h_val == '2.5':
            css_rules.append(f"{selector} {{ height: 10px !important; }}")
        elif h_val == 'full':
            css_rules.append(f"{selector} {{ height: 100% !important; }}")
        elif h_val == 'auto':
            css_rules.append(f"{selector} {{ height: auto !important; }}")

    # 7. Margins & Paddings
    elif cls.startswith('mt-'):
        val = int(cls[3:]) * 4 if cls[3:].isdigit() else 4
        css_rules.append(f"{selector} {{ margin-top: {val}px !important; }}")
    elif cls.startswith('mb-'):
        val = int(cls[3:]) * 4 if cls[3:].isdigit() else 4
        css_rules.append(f"{selector} {{ margin-bottom: {val}px !important; }}")
    elif cls.startswith('my-'):
        val = int(cls[3:]) * 4 if cls[3:].isdigit() else 4
        css_rules.append(f"{selector} {{ margin-top: {val}px !important; margin-bottom: {val}px !important; }}")
    elif cls.startswith('mx-auto'):
        css_rules.append(f"{selector} {{ margin-left: auto !important; margin-right: auto !important; }}")
    elif cls.startswith('py-0.5'):
        css_rules.append(f"{selector} {{ padding-top: 2px !important; padding-bottom: 2px !important; }}")
    elif cls.startswith('py-8'):
        css_rules.append(f"{selector} {{ padding-top: 32px !important; padding-bottom: 32px !important; }}")
    elif cls.startswith('p-1'):
        css_rules.append(f"{selector} {{ padding: 4px !important; }}")
    elif cls.startswith('p-2.5'):
        css_rules.append(f"{selector} {{ padding: 10px !important; }}")
    elif cls.startswith('p-3'):
        css_rules.append(f"{selector} {{ padding: 12px !important; }}")
    elif cls.startswith('p-8'):
        css_rules.append(f"{selector} {{ padding: 32px !important; }}")

    # 8. Typography
    elif cls == 'uppercase':
        css_rules.append(f"{selector} {{ text-transform: uppercase !important; }}")
    elif cls == 'lowercase':
        css_rules.append(f"{selector} {{ text-transform: lowercase !important; }}")
    elif cls == 'capitalize':
        css_rules.append(f"{selector} {{ text-transform: capitalize !important; }}")
    elif cls == 'italic':
        css_rules.append(f"{selector} {{ font-style: italic !important; }}")
    elif cls == 'font-black':
        css_rules.append(f"{selector} {{ font-weight: 900 !important; }}")
    elif cls == 'tracking-tight':
        css_rules.append(f"{selector} {{ letter-spacing: -0.025em !important; }}")
    elif cls == 'tracking-wide':
        css_rules.append(f"{selector} {{ letter-spacing: 0.025em !important; }}")
    elif cls == 'tracking-wider':
        css_rules.append(f"{selector} {{ letter-spacing: 0.05em !important; }}")
    elif cls == 'tracking-widest':
        css_rules.append(f"{selector} {{ letter-spacing: 0.1em !important; }}")

    # 9. Radii & Shadows
    elif cls == 'rounded-full':
        css_rules.append(f"{selector} {{ border-radius: 9999px !important; }}")
    elif cls == 'rounded-sm':
        css_rules.append(f"{selector} {{ border-radius: 2px !important; }}")
    elif cls == 'shadow-2xs':
        css_rules.append(f"{selector} {{ box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05) !important; }}")
    elif cls == 'shadow-xl':
        css_rules.append(f"{selector} {{ box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important; }}")
    elif cls == 'shadow-inner':
        css_rules.append(f"{selector} {{ box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06) !important; }}")

    # 10. Transitions & Animations
    elif cls == 'transition-colors':
        css_rules.append(f"{selector} {{ transition-property: color, background-color, border-color !important; transition-duration: 150ms !important; }}")
    elif cls == 'transition-all':
        css_rules.append(f"{selector} {{ transition-property: all !important; transition-duration: 150ms !important; }}")
    elif cls == 'animate-spin':
        css_rules.append(f"{selector} {{ animation: spin 1s linear infinite !important; }}")
    elif cls == 'animate-pulse':
        css_rules.append(f"{selector} {{ animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite !important; }}")

    # 11. Focus & Hover states
    elif cls.startswith('hover:'):
        sub = cls[6:]
        if sub.startswith('bg-'):
            bg = sub[3:]
            c = colors.get(bg, '#1d4ed8')
            css_rules.append(f"{selector}:hover {{ background-color: {c} !important; }}")
        elif sub == 'text-white':
            css_rules.append(f"{selector}:hover {{ color: #ffffff !important; }}")
    elif cls.startswith('focus:'):
        sub = cls[6:]
        if sub == 'outline-none':
            css_rules.append(f"{selector}:focus {{ outline: 2px solid transparent !important; outline-offset: 2px !important; }}")
        elif sub.startswith('ring-'):
            css_rules.append(f"{selector}:focus {{ box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.4) !important; }}")
        elif sub.startswith('border-'):
            b = sub[7:]
            c = colors.get(b, '#2563eb')
            css_rules.append(f"{selector}:focus {{ border-color: {c} !important; }}")

    # 12. Miscellaneous
    elif cls == 'cursor-not-allowed':
        css_rules.append(f"{selector} {{ cursor: not-allowed !important; }}")
    elif cls == 'absolute':
        css_rules.append(f"{selector} {{ position: absolute !important; }}")
    elif cls == 'relative':
        css_rules.append(f"{selector} {{ position: relative !important; }}")
    elif cls == 'top-0':
        css_rules.append(f"{selector} {{ top: 0 !important; }}")
    elif cls == 'bottom-3':
        css_rules.append(f"{selector} {{ bottom: 12px !important; }}")
    elif cls == 'left-3':
        css_rules.append(f"{selector} {{ left: 12px !important; }}")
    elif cls == 'right-3':
        css_rules.append(f"{selector} {{ right: 12px !important; }}")

print(f"Generated {len(css_rules)} standard CSS utility rules.")
with open('scripts/generated_utilities.css', 'w', encoding='utf-8') as out:
    out.write("\n/* --- AUTOMATICALLY GENERATED ENTERPRISE UTILITIES --- */\n")
    out.write("@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\n")
    out.write("@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }\n\n")
    for r in css_rules:
        out.write(r + '\n')

print("Wrote generated CSS to scripts/generated_utilities.css")
