import logging
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app import models

logger = logging.getLogger("pms_locking")

def acquire_canonical_locks(
    db: Session,
    booking_id: Optional[int] = None,
    folio_id: Optional[int] = None,
    room_id: Optional[int] = None
) -> Tuple[Optional[models.Booking], Optional[models.Folio], Optional[models.Room]]:
    """
    Acquires pessimistic row-level locks (.with_for_update()) in strict canonical order:
    1. Booking
    2. Folio
    3. Room
    This order prevents deadlocks between concurrent check-ins, KOT postings, and room shifts (#15, #26).
    Falls back gracefully if running in SQLite local environment.
    """
    locked_booking = None
    locked_folio = None
    locked_room = None

    # 1. Lock Booking first
    if booking_id:
        try:
            locked_booking = db.query(models.Booking).filter(
                models.Booking.id == booking_id
            ).with_for_update().first()
        except Exception as e:
            logger.debug(f"[Locking] with_for_update fallback on Booking: {e}")
            locked_booking = db.query(models.Booking).filter(
                models.Booking.id == booking_id
            ).first()

    # 2. Lock Folio second
    if folio_id:
        try:
            locked_folio = db.query(models.Folio).filter(
                models.Folio.id == folio_id
            ).with_for_update().first()
        except Exception as e:
            logger.debug(f"[Locking] with_for_update fallback on Folio: {e}")
            locked_folio = db.query(models.Folio).filter(
                models.Folio.id == folio_id
            ).first()

    # 3. Lock Room third
    if room_id:
        try:
            locked_room = db.query(models.Room).filter(
                models.Room.id == room_id
            ).with_for_update().first()
        except Exception as e:
            logger.debug(f"[Locking] with_for_update fallback on Room: {e}")
            locked_room = db.query(models.Room).filter(
                models.Room.id == room_id
            ).first()

    return locked_booking, locked_folio, locked_room

async def acquire_canonical_locks_async(
    session: AsyncSession,
    booking_id: Optional[int] = None,
    folio_id: Optional[int] = None,
    room_id: Optional[int] = None
) -> Tuple[Optional[models.Booking], Optional[models.Folio], Optional[models.Room]]:
    """Asynchronous implementation of canonical row locking via asyncpg / AsyncSession."""
    locked_booking = None
    locked_folio = None
    locked_room = None

    if booking_id:
        stmt = select(models.Booking).where(models.Booking.id == booking_id).with_for_update()
        try:
            res = await session.execute(stmt)
            locked_booking = res.scalars().first()
        except Exception:
            stmt = select(models.Booking).where(models.Booking.id == booking_id)
            res = await session.execute(stmt)
            locked_booking = res.scalars().first()

    if folio_id:
        stmt = select(models.Folio).where(models.Folio.id == folio_id).with_for_update()
        try:
            res = await session.execute(stmt)
            locked_folio = res.scalars().first()
        except Exception:
            stmt = select(models.Folio).where(models.Folio.id == folio_id)
            res = await session.execute(stmt)
            locked_folio = res.scalars().first()

    if room_id:
        stmt = select(models.Room).where(models.Room.id == room_id).with_for_update()
        try:
            res = await session.execute(stmt)
            locked_room = res.scalars().first()
        except Exception:
            stmt = select(models.Room).where(models.Room.id == room_id)
            res = await session.execute(stmt)
            locked_room = res.scalars().first()

    return locked_booking, locked_folio, locked_room
