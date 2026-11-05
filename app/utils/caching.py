import logging
from typing import Any, Optional, Dict
from cachetools import TTLCache
from app.config import settings

logger = logging.getLogger("pms_caching")

# In-Memory TTLCache for public room categories & tariffs (#6, #7)
# Max 100 items, TTL from settings (default 300s = 5 minutes)
rooms_cache: TTLCache = TTLCache(maxsize=100, ttl=settings.CACHE_TTL_ROOMS)

# In-Memory TTLCache for restaurant menu items (#6, #7)
menu_cache: TTLCache = TTLCache(maxsize=100, ttl=settings.CACHE_TTL_MENUS)

# --- Room Cache Operations ---

def get_cached_rooms(cache_key: str) -> Optional[Any]:
    """Retrieves cached room category list if present and not expired."""
    data = rooms_cache.get(cache_key)
    if data is not None:
        logger.debug(f"[TTLCache] Room cache HIT for key: {cache_key}")
        return data
    logger.debug(f"[TTLCache] Room cache MISS for key: {cache_key}")
    return None

def set_cached_rooms(cache_key: str, data: Any) -> None:
    """Stores room list in TTLCache."""
    try:
        rooms_cache[cache_key] = data
        logger.debug(f"[TTLCache] Stored room cache for key: {cache_key} (size={len(rooms_cache)})")
    except Exception as e:
        logger.warning(f"[TTLCache] Failed to cache rooms: {e}")

def invalidate_rooms_cache() -> int:
    """
    Evicts all cached room categories/tariffs (#7).
    Called automatically when Admin/Manager updates tariffs, adds rooms, or alters inventory.
    """
    cleared_count = len(rooms_cache)
    rooms_cache.clear()
    try:
        from app.core.cache import invalidate_cache_prefix_sync
        invalidate_cache_prefix_sync("rooms")
    except Exception:
        pass
    logger.info(f"[TTLCache] Room categories & tariffs cache INVALIDATED ({cleared_count} keys evicted)")
    return cleared_count

# --- Menu Cache Operations ---

def get_cached_menu(cache_key: str) -> Optional[Any]:
    """Retrieves cached restaurant menu list if present."""
    data = menu_cache.get(cache_key)
    if data is not None:
        logger.debug(f"[TTLCache] Menu cache HIT for key: {cache_key}")
        return data
    logger.debug(f"[TTLCache] Menu cache MISS for key: {cache_key}")
    return None

def set_cached_menu(cache_key: str, data: Any) -> None:
    """Stores menu items in TTLCache."""
    try:
        menu_cache[cache_key] = data
        logger.debug(f"[TTLCache] Stored menu cache for key: {cache_key} (size={len(menu_cache)})")
    except Exception as e:
        logger.warning(f"[TTLCache] Failed to cache menu: {e}")

def invalidate_menu_cache() -> int:
    """
    Evicts all cached restaurant menu items (#7).
    Called automatically when Admin/Manager updates item rates, categories, or adds dishes.
    """
    cleared_count = len(menu_cache)
    menu_cache.clear()
    try:
        from app.core.cache import invalidate_cache_prefix_sync
        invalidate_cache_prefix_sync("menu")
    except Exception:
        pass
    logger.info(f"[TTLCache] Restaurant menu cache INVALIDATED ({cleared_count} keys evicted)")
    return cleared_count
