import datetime
from zoneinfo import ZoneInfo
from typing import Optional, Union
from sqlalchemy import TypeDecorator, DateTime
from sqlalchemy.dialects.postgresql import TIMESTAMP

# Canonical timezones
UTC_TZ = datetime.timezone.utc
IST_TZ = ZoneInfo("Asia/Kolkata")

def now_utc() -> datetime.datetime:
    """Returns current timestamp as timezone-aware UTC datetime."""
    return datetime.datetime.now(UTC_TZ)

def now_ist() -> datetime.datetime:
    """Returns current timestamp in Indian Standard Time (Asia/Kolkata)."""
    return datetime.datetime.now(IST_TZ)

def to_ist(dt: Optional[datetime.datetime]) -> Optional[datetime.datetime]:
    """
    Converts a datetime (naive UTC or aware) to Asia/Kolkata (IST).
    If naive, assumes UTC.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC_TZ)
    return dt.astimezone(IST_TZ)

def to_utc(dt: Optional[datetime.datetime]) -> Optional[datetime.datetime]:
    """
    Converts any datetime to timezone-aware UTC.
    If naive, assumes UTC.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC_TZ)
    return dt.astimezone(UTC_TZ)

def format_ist(dt: Optional[datetime.datetime], fmt: str = "%Y-%m-%d %I:%M:%S %p") -> str:
    """Formats datetime as human-readable IST string (e.g. 2026-10-28 11:59:00 PM IST)."""
    if dt is None:
        return ""
    ist_dt = to_ist(dt)
    return ist_dt.strftime(fmt)

def today_ist_str() -> str:
    """Returns today's date in IST as YYYY-MM-DD."""
    return now_ist().strftime("%Y-%m-%d")

class TimezoneAwareDateTime(TypeDecorator):
    """
    SQLAlchemy TypeDecorator that persists datetimes as PostgreSQL TIMESTAMPTZ (or DateTime with tz in SQLite)
    and ensures datetimes returned to Python are timezone-aware UTC.
    """
    impl = DateTime(timezone=True)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(TIMESTAMP(timezone=True))
        return dialect.type_descriptor(DateTime(timezone=True))

    def process_bind_param(self, value: Optional[Union[datetime.datetime, str]], dialect):
        if value is None:
            return None
        if isinstance(value, str):
            try:
                value = datetime.datetime.fromisoformat(value)
            except Exception:
                return value
        return to_utc(value)

    def process_result_value(self, value: Optional[datetime.datetime], dialect):
        if value is None:
            return None
        return to_utc(value)
