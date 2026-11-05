import os
import sys
import pytest

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Ensure tests run against an isolated test SQLite database, never polluting production/dev hotel_sai_vasudev.db
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_sai_vasudev.db")
if "hotel_sai_vasudev.db" in os.environ.get("DATABASE_URL", ""):
    os.environ["DATABASE_URL"] = "sqlite:///./test_sai_vasudev.db"

from app.database import engine, Base

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup test db after test session
    try:
        test_db_file = "test_sai_vasudev.db"
        if os.path.exists(test_db_file):
            pass  # Leave for inspection or remove if desired
    except Exception:
        pass
