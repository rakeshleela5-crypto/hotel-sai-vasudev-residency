import logging
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, update, case
from sqlalchemy.ext.asyncio import AsyncSession
from app import models
from app.utils.timezone import now_utc

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


# =========================================================================
# ATOMIC FOLIO UPDATES & OPTIMISTIC CONCURRENCY CONTROL (NO LOST UPDATES)
# =========================================================================
def ensure_folio_exists(db: Session, booking_id: int) -> models.Folio:
    """Ensures a Master Folio record exists for the booking."""
    folio = db.query(models.Folio).filter(models.Folio.booking_id == booking_id).first()
    if not folio:
        booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
        if booking:
            folio = models.Folio(
                booking_id=booking.id,
                folio_number=f"FOL-{booking.booking_ref}",
                status="OPEN",
                total_charges=booking.total_price or 0.0,
                total_payments=booking.total_paid or 0.0,
                balance_due=booking.balance_due or (booking.total_price or 0.0),
                version_id=1,
                created_at=now_utc(),
                updated_at=now_utc()
            )
            db.add(folio)
            db.flush()
    return folio


def atomic_add_folio_charge(
    db: Session, 
    booking_id: int, 
    charge_amount: float
) -> Tuple[models.Booking, Optional[models.Folio]]:
    """
    Atomically increments total_price and balance_due on Booking and Folio tables
    using atomic database-level arithmetic and version bump (eliminates in-memory lost updates).
    """
    amt = float(round(charge_amount, 2))
    ensure_folio_exists(db, booking_id)

    # 1. Atomic update on Booking
    db.execute(
        update(models.Booking)
        .where(models.Booking.id == booking_id)
        .values(
            total_price=models.Booking.total_price + amt,
            balance_due=models.Booking.balance_due + amt,
            version_id=models.Booking.version_id + 1,
            updated_at=now_utc()
        )
    )

    # 2. Atomic update on Folio
    db.execute(
        update(models.Folio)
        .where(models.Folio.booking_id == booking_id)
        .values(
            total_charges=models.Folio.total_charges + amt,
            balance_due=models.Folio.balance_due + amt,
            status=case((models.Folio.status == "SETTLED", "OPEN"), else_=models.Folio.status),
            version_id=models.Folio.version_id + 1,
            updated_at=now_utc()
        )
    )
    db.flush()
    b = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    f = db.query(models.Folio).filter(models.Folio.booking_id == booking_id).first()
    return b, f


def atomic_record_folio_payment(
    db: Session, 
    booking_id: int, 
    payment_amount: float, 
    payment_method: Optional[str] = None
) -> Tuple[models.Booking, Optional[models.Folio]]:
    """
    Atomically increments total_paid and decrements balance_due on Booking and Folio tables
    using database-level atomic arithmetic and CASE expressions (prevents lost updates).
    """
    amt = float(round(payment_amount, 2))
    ensure_folio_exists(db, booking_id)

    new_bal_expr = case(
        (models.Booking.balance_due - amt < 0.0, 0.0),
        else_=models.Booking.balance_due - amt
    )
    new_status_expr = case(
        (models.Booking.balance_due - amt <= 0.0, "Paid"),
        else_="Partial"
    )

    values_b = {
        models.Booking.total_paid: models.Booking.total_paid + amt,
        models.Booking.balance_due: new_bal_expr,
        models.Booking.payment_status: new_status_expr,
        models.Booking.version_id: models.Booking.version_id + 1,
        models.Booking.updated_at: now_utc()
    }
    if payment_method:
        values_b[models.Booking.payment_method] = payment_method

    db.execute(
        update(models.Booking)
        .where(models.Booking.id == booking_id)
        .values(values_b)
    )

    new_folio_bal_expr = case(
        (models.Folio.balance_due - amt < 0.0, 0.0),
        else_=models.Folio.balance_due - amt
    )
    new_folio_status_expr = case(
        (models.Folio.balance_due - amt <= 0.0, "SETTLED"),
        else_=models.Folio.status
    )
    db.execute(
        update(models.Folio)
        .where(models.Folio.booking_id == booking_id)
        .values(
            total_payments=models.Folio.total_payments + amt,
            balance_due=new_folio_bal_expr,
            status=new_folio_status_expr,
            version_id=models.Folio.version_id + 1,
            updated_at=now_utc()
        )
    )
    db.flush()
    b = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    f = db.query(models.Folio).filter(models.Folio.booking_id == booking_id).first()
    return b, f


def atomic_reverse_folio_charge(
    db: Session, 
    booking_id: int, 
    charge_amount: float
) -> Tuple[models.Booking, Optional[models.Folio]]:
    """Atomically decrements total_price and balance_due on Booking and Folio tables."""
    amt = float(round(charge_amount, 2))
    ensure_folio_exists(db, booking_id)

    new_price_expr = case(
        (models.Booking.total_price - amt < 0.0, 0.0),
        else_=models.Booking.total_price - amt
    )
    new_bal_expr = case(
        (models.Booking.balance_due - amt < 0.0, 0.0),
        else_=models.Booking.balance_due - amt
    )
    db.execute(
        update(models.Booking)
        .where(models.Booking.id == booking_id)
        .values(
            total_price=new_price_expr,
            balance_due=new_bal_expr,
            version_id=models.Booking.version_id + 1,
            updated_at=now_utc()
        )
    )
    db.execute(
        update(models.Folio)
        .where(models.Folio.booking_id == booking_id)
        .values(
            total_charges=case((models.Folio.total_charges - amt < 0.0, 0.0), else_=models.Folio.total_charges - amt),
            balance_due=case((models.Folio.balance_due - amt < 0.0, 0.0), else_=models.Folio.balance_due - amt),
            version_id=models.Folio.version_id + 1,
            updated_at=now_utc()
        )
    )
    db.flush()
    b = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    f = db.query(models.Folio).filter(models.Folio.booking_id == booking_id).first()
    return b, f
