from pathlib import Path
import sys

backend_app_dir = Path(__file__).resolve().parent.parent / "backend" / "app"
__path__.append(str(backend_app_dir))

backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
