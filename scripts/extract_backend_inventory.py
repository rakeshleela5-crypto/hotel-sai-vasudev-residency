import os
import re
import json

def extract_backend_inventory():
    models_file = 'app/models.py'
    schemas_file = 'app/schemas.py'
    routes_dir = 'app/routes'
    
    # 1. Models and their columns
    models = {}
    with open(models_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Matches class X(Base): ...
    class_blocks = re.split(r'\nclass\s+', content)
    for block in class_blocks[1:]:
        header = block.split('\n')[0]
        if '(Base)' not in header:
            continue
        class_name = header.split('(')[0].strip()
        
        table_name_match = re.search(r'__tablename__\s*=\s*[\'"]([^\'"]+)[\'"]', block)
        table_name = table_name_match.group(1) if table_name_match else None
        
        # Columns
        col_matches = re.findall(r'(\w+)\s*=\s*Column\(([^)]+)\)', block)
        columns = [c[0] for c in col_matches]
        
        models[class_name] = {
            'table_name': table_name,
            'columns': columns
        }
    
    # 2. FastAPI Endpoints
    endpoints = []
    for rfile in os.listdir(routes_dir):
        if not rfile.endswith('.py') or rfile == '__init__.py':
            continue
        rfpath = os.path.join(routes_dir, rfile)
        with open(rfpath, 'r', encoding='utf-8') as f:
            rcontent = f.read()
        
        # Look for @router.get/post/put/delete/patch
        route_matches = re.finditer(r'@router\.(get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"]', rcontent)
        for rm in route_matches:
            method, path = rm.groups()
            endpoints.append({
                'file': rfile,
                'method': method.upper(),
                'path': path
            })
            
    with open('backend_inventory.json', 'w', encoding='utf-8') as out:
        json.dump({
            'models': models,
            'endpoints': endpoints
        }, out, indent=2)
        
    print(f"Backend inventory extracted: {len(models)} SQLAlchemy models, {len(endpoints)} endpoints across app/routes.")

if __name__ == '__main__':
    extract_backend_inventory()
