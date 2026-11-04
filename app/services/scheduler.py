import asyncio
import datetime
import gzip
import io
import json
import logging
import os
import subprocess
import threading
import zoneinfo
from typing import Dict, Any, List, Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal, engine
from app import models
from app.utils.audit import record_audit_log
from app.utils.encryption import get_fernet_cipher
from app.services.r2_storage import r2_service

logger = logging.getLogger("pms_scheduler")

# PostgreSQL Advisory Lock IDs (#41, #97)
LOCK_ID_NIGHT_AUDIT = 88472910
LOCK_ID_DB_BACKUP = 88472911

# In-memory thread lock fallback for SQLite/test environments
_advisory_memory_locks: Dict[int, threading.Lock] = {
    LOCK_ID_NIGHT_AUDIT: threading.Lock(),
    LOCK_ID_DB_BACKUP: threading.Lock(),
}

def acquire_advisory_lock(db: Session, lock_id: int) -> bool:
    """
    Acquires a PostgreSQL advisory lock (pg_try_advisory_lock) to prevent duplicate
    cron job execution across horizontal multi-worker / container deployments (#41).
    Falls back to in-memory threading lock for SQLite/dev environments.
    """
    is_postgres = "postgresql" in str(engine.url)
    if is_postgres:
        try:
            res = db.execute(text("SELECT pg_try_advisory_lock(:lock_id)"), {"lock_id": lock_id}).scalar()
            acquired = bool(res)
            logger.info(f"[Scheduler] PostgreSQL advisory lock {lock_id} acquired={acquired}")
            return acquired
        except Exception as e:
            logger.warning(f"[Scheduler] Failed to query PostgreSQL advisory lock: {e}")
            return True

    # Fallback for SQLite / unit tests
    lock = _advisory_memory_locks.get(lock_id)
    if lock:
        acquired = lock.acquire(blocking=False)
        logger.info(f"[Scheduler] In-memory advisory lock {lock_id} acquired={acquired}")
        return acquired
    return True

def release_advisory_lock(db: Session, lock_id: int) -> bool:
    """Releases PostgreSQL or in-memory advisory lock."""
    is_postgres = "postgresql" in str(engine.url)
    if is_postgres:
        try:
            res = db.execute(text("SELECT pg_advisory_unlock(:lock_id)"), {"lock_id": lock_id}).scalar()
            logger.info(f"[Scheduler] PostgreSQL advisory lock {lock_id} released={res}")
            return bool(res)
        except Exception as e:
            logger.warning(f"[Scheduler] Failed to release PostgreSQL advisory lock: {e}")
            return False

    lock = _advisory_memory_locks.get(lock_id)
    if lock and lock.locked():
        lock.release()
        logger.info(f"[Scheduler] In-memory advisory lock {lock_id} released")
        return True
    return True


# ==============================================================================
# JOB 1: Automated Hotel Night Audit (#41, #94)
# Runs Daily at 23:59 Asia/Kolkata
# ==============================================================================

def run_night_audit(db: Optional[Session] = None, audit_date: Optional[str] = None) -> Dict[str, Any]:
    """
    Automated Hotel Night Audit (#41):
    1. Posts nightly room tariff + GST to active folios of in-house guests (Checked-In).
    2. Flags unarrived guaranteed/confirmed reservations as No-Shows.
    3. Aggregates daily room, food, and petty cash collection metrics.
    4. Writes immutable audit log and DailyNightAudit record.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    lock_acquired = acquire_advisory_lock(db, LOCK_ID_NIGHT_AUDIT)
    if not lock_acquired:
        logger.warning("[NightAudit] Another worker instance is currently executing Night Audit. Skipping.")
        if close_db:
            db.close()
        return {"status": "skipped", "reason": "Advisory lock busy"}

    try:
        ist_tz = zoneinfo.ZoneInfo("Asia/Kolkata")
        today_ist = audit_date or datetime.datetime.now(ist_tz).date().isoformat()
        logger.info(f"[NightAudit] Starting Automated Night Audit for business date: {today_ist}")

        # 1. Post room tariff + GST to active in-house folios
        active_in_house = db.query(models.Booking).filter(
            models.Booking.status == "Checked-In"
        ).all()

        posted_folios_count = 0
        total_nightly_room_charges = 0.0

        for b in active_in_house:
            # Check if room tariff for this business date was already posted
            desc_tag = f"Night Stay Tariff ({today_ist})"
            existing_charge = db.query(models.RoomFolioItem).filter(
                models.RoomFolioItem.booking_id == b.id,
                models.RoomFolioItem.description.like(f"%{today_ist}%"),
                models.RoomFolioItem.item_type == "ROOM_TARIFF"
            ).first()

            if not existing_charge:
                room_rate = float(b.base_rate or b.total_price or 2000.0)
                taxable = round(room_rate / 1.12, 2)
                gst_total = round(room_rate - taxable, 2)
                cgst = round(gst_total / 2.0, 2)
                sgst = round(gst_total - cgst, 2)

                folio_item = models.RoomFolioItem(
                    booking_id=b.id,
                    item_type="ROOM_TARIFF",
                    description=desc_tag,
                    sac_code="996311",
                    quantity=1,
                    unit_price=room_rate,
                    taxable_amount=taxable,
                    gst_rate=12.0,
                    cgst_amount=cgst,
                    sgst_amount=sgst,
                    total_amount=room_rate,
                    status="Posted",
                    created_at=datetime.datetime.now(datetime.timezone.utc)
                )
                db.add(folio_item)
                posted_folios_count += 1
                total_nightly_room_charges += room_rate

                # Idempotently update booking & folio balances
                b.total_price = round((b.total_price or 0.0) + room_rate, 2)
                b.balance_due = max(0.0, round(b.total_price - (b.total_paid or 0.0), 2))
                folio = db.query(models.Folio).filter(models.Folio.booking_id == b.id).first()
                if folio:
                    folio.total_charges = round((folio.total_charges or 0.0) + room_rate, 2)
                    folio.balance_due = max(0.0, round(folio.total_charges - (folio.total_payments or 0.0), 2))
                    folio.updated_at = datetime.datetime.now(datetime.timezone.utc)

        # 2. Flag No-Shows: Confirmed reservations where check_in_date <= today_ist and never checked in
        no_shows = db.query(models.Booking).filter(
            models.Booking.status.in_(["Confirmed", "Guaranteed"]),
            models.Booking.check_in_date <= today_ist
        ).all()

        no_shows_count = 0
        for ns in no_shows:
            ns.status = "No-Show"
            ns.cancellation_reason = f"Automated Night Audit {today_ist}: Guest did not arrive by 23:59 IST"
            no_shows_count += 1

        # 3. Sum revenues and collections for daily summary
        total_rooms = db.query(models.Room).count() or 1
        occupied_rooms = len(active_in_house)
        occupancy_rate = round((occupied_rooms / total_rooms) * 100, 2)

        # Revenue sums
        room_rev = sum(b.base_amount or b.total_price for b in active_in_house)
        total_gst = sum(b.total_tax for b in active_in_house)

        all_food = db.query(models.RoomFolioItem).filter(
            models.RoomFolioItem.item_type.in_(["Food_KOT", "Restaurant"])
        ).all()
        food_rev = sum(f.taxable_amount for f in all_food)

        payments = db.query(models.BookingPayment).all()
        cash_total = sum(p.amount for p in payments if p.payment_mode == "Cash")
        card_total = sum(p.amount for p in payments if p.payment_mode == "Card")
        upi_total = sum(p.amount for p in payments if p.payment_mode == "UPI")
        btc_total = sum(p.amount for p in payments if p.payment_mode == "Direct_BTC")

        # Record or update daily night audit log (idempotent)
        existing_audit = db.query(models.DailyNightAudit).filter(models.DailyNightAudit.audit_date == today_ist).first()
        if existing_audit:
            existing_audit.total_rooms_occupied = occupied_rooms
            existing_audit.total_room_revenue = round(room_rev, 2)
            existing_audit.total_food_revenue = round(food_rev, 2)
            existing_audit.total_gst_collected = round(total_gst, 2)
            existing_audit.no_shows_processed = no_shows_count
            existing_audit.cash_in_drawer = round(cash_total, 2)
            existing_audit.card_total = round(card_total, 2)
            existing_audit.upi_total = round(upi_total, 2)
            existing_audit.btc_credit_total = round(btc_total, 2)
            existing_audit.audited_by = "APScheduler Automated Night Audit"
            existing_audit.audit_status = "Closed"
            audit_record = existing_audit
        else:
            audit_record = models.DailyNightAudit(
                audit_date=today_ist,
                total_rooms_occupied=occupied_rooms,
                total_room_revenue=round(room_rev, 2),
                total_food_revenue=round(food_rev, 2),
                total_gst_collected=round(total_gst, 2),
                no_shows_processed=no_shows_count,
                cash_in_drawer=round(cash_total, 2),
                card_total=round(card_total, 2),
                upi_total=round(upi_total, 2),
                btc_credit_total=round(btc_total, 2),
                audited_by="APScheduler Automated Night Audit",
                audit_status="Closed"
            )
            db.add(audit_record)

        # Write immutable entry to audit_logs table (#48)
        record_audit_log(
            db=db,
            action="NIGHT_AUDIT_EXECUTED",
            entity_type="SYSTEM",
            entity_id=f"AUDIT-{today_ist}",
            new_data={
                "audit_date": today_ist,
                "rooms_occupied": occupied_rooms,
                "occupancy_rate_pct": occupancy_rate,
                "posted_folios": posted_folios_count,
                "no_shows_flagged": no_shows_count,
                "room_revenue": round(room_rev, 2),
                "food_revenue": round(food_rev, 2),
                "total_gst": round(total_gst, 2)
            },
            staff_id="SYSTEM_CRON",
            role="SYSTEM"
        )

        db.commit()
        logger.info(f"[NightAudit] Successfully completed Night Audit for {today_ist}: {posted_folios_count} folios posted, {no_shows_count} no-shows flagged.")

        return {
            "status": "success",
            "audit_date": today_ist,
            "rooms_occupied": occupied_rooms,
            "total_rooms": total_rooms,
            "occupancy_rate": occupancy_rate,
            "posted_folios_count": posted_folios_count,
            "no_shows_count": no_shows_count,
            "total_room_revenue": round(room_rev, 2),
            "total_food_revenue": round(food_rev, 2),
            "total_gst_collected": round(total_gst, 2)
        }

    except Exception as e:
        db.rollback()
        logger.error(f"[NightAudit] Execution failed: {e}", exc_info=True)
        return {"status": "error", "error": str(e)}

    finally:
        release_advisory_lock(db, LOCK_ID_NIGHT_AUDIT)
        if close_db:
            db.close()


# ==============================================================================
# JOB 2: Automated PostgreSQL Backup & Cloudflare R2 Upload (#97, #98)
# Runs Daily at 03:00 Asia/Kolkata
# pg_dump -> gzip -> Fernet encrypt -> upload to R2 backups/db/ -> prune >30 days
# ==============================================================================

def generate_database_dump_sql(db: Session) -> str:
    """
    Generates a full SQL dump representation of the active database.
    If PostgreSQL and pg_dump CLI is present, uses pg_dump; otherwise uses SQLAlchemy metadata reflection.
    """
    is_postgres = "postgresql" in str(engine.url)
    
    # Attempt pg_dump CLI if PostgreSQL
    if is_postgres:
        try:
            parsed_url = engine.url
            env = os.environ.copy()
            if parsed_url.password:
                env["PGPASSWORD"] = str(parsed_url.password)

            cmd = [
                "pg_dump",
                "--clean",
                "--no-owner",
                "--no-privileges",
                "-h", parsed_url.host or "localhost",
                "-p", str(parsed_url.port or 5432),
                "-U", parsed_url.username or "postgres",
                "-d", parsed_url.database or "railway"
            ]
            result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=60)
            if result.returncode == 0 and result.stdout:
                logger.info("[DBBackup] Successfully generated dump via native pg_dump CLI")
                return result.stdout
            else:
                logger.warning(f"[DBBackup] pg_dump CLI returned non-zero code ({result.returncode}), using reflection fallback: {result.stderr}")
        except Exception as exc:
            logger.info(f"[DBBackup] pg_dump CLI not executable ({exc}), falling back to metadata reflection.")

    # Universal SQL schema + data dump fallback (works on SQLite, PostgreSQL, testing engines)
    dump_lines = [
        f"-- Hotel Sai Vasudev Residency Database Backup Dump",
        f"-- Generated: {datetime.datetime.now(datetime.timezone.utc).isoformat()}",
        f"-- Engine: {engine.url.drivername}",
        "BEGIN TRANSACTION;"
    ]

    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    import re
    for table_name in table_names:
        if not re.match(r'^[a-zA-Z0-9_]+$', table_name):
            continue
        safe_table = f'"{table_name}"'
        # Extract rows
        try:
            rows = db.execute(text(f"SELECT * FROM {safe_table}")).fetchall()
            if rows:
                dump_lines.append(f"\n-- Table: {table_name} ({len(rows)} records)")
                cols = [col["name"] for col in inspector.get_columns(table_name) if re.match(r'^[a-zA-Z0-9_]+$', col["name"])]
                col_str = ", ".join(f'"{c}"' for c in cols)
                for r in rows:
                    val_strs = []
                    for v in r:
                        if v is None:
                            val_strs.append("NULL")
                        elif isinstance(v, (int, float)):
                            val_strs.append(str(v))
                        elif isinstance(v, bool):
                            val_strs.append("TRUE" if v else "FALSE")
                        else:
                            clean_val = str(v).replace("'", "''")
                            val_strs.append(f"'{clean_val}'")
                    dump_lines.append(f"INSERT INTO {safe_table} ({col_str}) VALUES ({', '.join(val_strs)});")
        except Exception as e:
            logger.debug(f"[DBBackup] Skipped table {table_name}: {e}")

    dump_lines.append("COMMIT;")
    return "\n".join(dump_lines)


def prune_old_backups(days_to_keep: int = 30) -> int:
    """
    Deletes backups from Cloudflare R2 that are older than retention policy (#98).
    Default: 30 days retention.
    """
    pruned_count = 0
    cutoff_time = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days_to_keep)

    try:
        if r2_service.s3_client:
            paginator = r2_service.s3_client.get_paginator('list_objects_v2')
            page_iterator = paginator.paginate(
                Bucket=settings.R2_BUCKET_NAME,
                Prefix="backups/db/"
            )

            for page in page_iterator:
                if 'Contents' in page:
                    for obj in page['Contents']:
                        key = obj['Key']
                        last_mod = obj['LastModified']
                        # Check age
                        if last_mod < cutoff_time:
                            r2_service.s3_client.delete_object(
                                Bucket=settings.R2_BUCKET_NAME,
                                Key=key
                            )
                            pruned_count += 1
                            logger.info(f"[DBBackup Pruning] Deleted expired backup from R2: {key}")
        else:
            # Local fallback pruning
            local_backup_dir = os.path.join(r2_service.local_storage_path, "backups", "db")
            if os.path.exists(local_backup_dir):
                for fname in os.listdir(local_backup_dir):
                    fpath = os.path.join(local_backup_dir, fname)
                    file_mtime = datetime.datetime.fromtimestamp(os.path.getmtime(fpath), tz=datetime.timezone.utc)
                    if file_mtime < cutoff_time:
                        os.remove(fpath)
                        pruned_count += 1
                        logger.info(f"[DBBackup Pruning] Deleted expired local backup: {fname}")
    except Exception as exc:
        logger.warning(f"[DBBackup Pruning] Error during backup retention sweep: {exc}")

    return pruned_count


def run_database_backup(db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Automated Daily PostgreSQL Backup (#97, #98):
    1. Acquires PostgreSQL advisory lock (pg_try_advisory_lock).
    2. Streams SQL dump -> gzip compresses.
    3. Encrypts payload with Fernet key before transmission.
    4. Uploads to Cloudflare R2 under key: backups/db/sai-vasudev-YYYY-MM-DD-HHMMSS.sql.gz.enc
    5. Prunes backup artifacts older than 30 days.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    lock_acquired = acquire_advisory_lock(db, LOCK_ID_DB_BACKUP)
    if not lock_acquired:
        logger.warning("[DBBackup] Another worker instance is currently executing DB Backup. Skipping.")
        if close_db:
            db.close()
        return {"status": "skipped", "reason": "Advisory lock busy"}

    try:
        now_ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%S")
        backup_key = f"backups/db/sai-vasudev-backup-{now_ts}.sql.gz.enc"
        logger.info(f"[DBBackup] Initiating automated database backup: {backup_key}")

        # 1. Generate SQL dump text
        raw_sql = generate_database_dump_sql(db)

        # 2. Gzip compress
        compressed_bytes = gzip.compress(raw_sql.encode("utf-8"), compresslevel=9)

        # 3. Fernet encrypt compressed archive (#50, #97)
        cipher = get_fernet_cipher()
        encrypted_bytes = cipher.encrypt(compressed_bytes)

        # 4. Upload to Cloudflare R2
        uploaded_key, file_url = r2_service.upload_file(
            file_data=encrypted_bytes,
            object_key=backup_key,
            content_type="application/octet-stream"
        )
        storage_mode = "Cloudflare R2" if r2_service.s3_client else "Local Fallback"

        # 5. Prune backups older than 30 days (#98)
        pruned_count = prune_old_backups(days_to_keep=settings.BACKUP_RETENTION_DAYS)

        # 6. Record audit log entry (#48)
        record_audit_log(
            db=db,
            action="DATABASE_BACKUP_COMPLETED",
            entity_type="BACKUP",
            entity_id=backup_key,
            new_data={
                "backup_key": backup_key,
                "file_url": file_url,
                "raw_size_bytes": len(raw_sql),
                "compressed_size_bytes": len(compressed_bytes),
                "encrypted_size_bytes": len(encrypted_bytes),
                "pruned_expired_count": pruned_count,
                "storage_mode": storage_mode
            },
            staff_id="SYSTEM_CRON",
            role="SYSTEM"
        )

        db.commit()
        logger.info(f"[DBBackup] Backup completed successfully: {backup_key} ({len(encrypted_bytes)} bytes)")

        return {
            "status": "success",
            "backup_key": backup_key,
            "raw_size_bytes": len(raw_sql),
            "compressed_size_bytes": len(compressed_bytes),
            "encrypted_size_bytes": len(encrypted_bytes),
            "pruned_expired_count": pruned_count,
            "uploaded_key": uploaded_key,
            "file_url": file_url,
            "storage_mode": storage_mode
        }

    except Exception as e:
        logger.error(f"[DBBackup] Automated backup failed: {e}", exc_info=True)
        return {"status": "error", "error": str(e)}

    finally:
        release_advisory_lock(db, LOCK_ID_DB_BACKUP)
        if close_db:
            db.close()



# ==============================================================================
# JOB 3: Automated Daily 12:00 PM IST Checkout Rollover (#41, #97)
# Runs Daily at 12:00 Asia/Kolkata
# Flags in-house rooms due for departure and broadcasts front desk alerts
# ==============================================================================

def run_checkout_rollover(db: Optional[Session] = None, business_date: Optional[str] = None) -> Dict[str, Any]:
    """
    Daily 12:00 PM IST Checkout Rollover Job (#41, #97):
    1. Identifies all in-house bookings (Checked-In) whose check_out_date is today (or earlier).
    2. Flags them as pending checkout and generates alerts for the front desk.
    3. Broadcasts real-time alert via WebSockets to front_desk channel.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        ist_tz = zoneinfo.ZoneInfo("Asia/Kolkata")
        today_ist = business_date or datetime.datetime.now(ist_tz).date().isoformat()
        logger.info(f"[CheckoutRollover] Running 12:00 PM IST checkout check for date: {today_ist}")

        # Find in-house guests due for departure
        due_checkouts = db.query(models.Booking).filter(
            models.Booking.status == "Checked-In",
            models.Booking.check_out_date <= today_ist,
            models.Booking.is_deleted == False
        ).all()

        alerted_count = 0
        alerts = []

        for b in due_checkouts:
            room_name = b.room.name if b.room else str(b.room_id)
            alerts.append({
                "booking_ref": b.booking_ref,
                "room_name": room_name,
                "guest_name": b.guest_name,
                "check_out_date": b.check_out_date,
                "balance_due": b.balance_due
            })
            alerted_count += 1

            # Log audit record
            record_audit_log(
                db=db,
                action="CHECKOUT_DUE_ALERT",
                entity_type="BOOKING",
                entity_id=b.booking_ref,
                new_data={
                    "room_name": room_name,
                    "guest_name": b.guest_name,
                    "check_out_date": b.check_out_date,
                    "alert_time_ist": "12:00 PM",
                    "balance_due": b.balance_due
                },
                staff_id="SYSTEM_CRON",
                role="SYSTEM"
            )

        db.commit()
        logger.info(f"[CheckoutRollover] 12:00 PM IST rollover completed: {alerted_count} rooms flagged for checkout.")

        # Broadcast WebSocket event to front desk if ws_manager is available
        try:
            from app.services.websocket_manager import ws_manager
            for alert in alerts:
                ws_manager.broadcast_sync(
                    channel="front_desk",
                    event={
                        "event_type": "CHECKOUT_DUE_ALERT",
                        "data": alert
                    }
                )
        except Exception as ws_err:
            logger.debug(f"[CheckoutRollover] WebSocket alert broadcast notice: {ws_err}")

        return {
            "status": "success",
            "business_date": today_ist,
            "flagged_count": alerted_count,
            "alerts": alerts
        }
    except Exception as e:
        db.rollback()
        logger.error(f"[CheckoutRollover] Execution failed: {e}", exc_info=True)
        return {"status": "error", "error": str(e)}
    finally:
        if close_db:
            db.close()


# ==============================================================================
# AsyncIOScheduler Configuration tied to FastAPI Lifespan
# ==============================================================================

scheduler = AsyncIOScheduler(timezone=zoneinfo.ZoneInfo("Asia/Kolkata"))

async def scheduled_checkout_rollover_wrapper():
    """Async wrapper executed by APScheduler daily at 12:00 PM IST"""
    logger.info("[Scheduler] Triggering Daily Checkout Rollover cron job (12:00 PM IST)...")
    await asyncio.to_thread(run_checkout_rollover)

async def scheduled_night_audit_wrapper():
    """Async wrapper executed by APScheduler daily at 23:59 IST"""
    logger.info("[Scheduler] Triggering Daily Night Audit cron job (23:59 IST)...")
    await asyncio.to_thread(run_night_audit)

async def scheduled_db_backup_wrapper():
    """Async wrapper executed by APScheduler daily at 03:00 IST"""
    logger.info("[Scheduler] Triggering Daily DB Backup cron job (03:00 IST)...")
    await asyncio.to_thread(run_database_backup)

def start_scheduler():
    """Initializes and starts APScheduler jobs with Asia/Kolkata timezone (#41, #97)."""
    if not settings.ENABLE_CRON_SCHEDULER:
        logger.info("[Scheduler] ENABLE_CRON_SCHEDULER is False. Cron scheduler not started.")
        return

        # Job A: Automated Daily Checkout Due Check (12:00 PM IST)
    scheduler.add_job(
        scheduled_checkout_rollover_wrapper,
        trigger=CronTrigger(hour=12, minute=0, timezone=zoneinfo.ZoneInfo("Asia/Kolkata")),
        id="job_checkout_rollover",
        name="Automated Daily Checkout Due Check (12:00 PM IST)",
        replace_existing=True
    )

    # Job 1: Hotel Night Audit daily at 23:59 IST (#41)
    scheduler.add_job(
        scheduled_night_audit_wrapper,
        trigger=CronTrigger(hour=23, minute=59, timezone=zoneinfo.ZoneInfo("Asia/Kolkata")),
        id="job_night_audit",
        name="Automated Daily Night Audit (23:59 IST)",
        replace_existing=True
    )

    # Job 2: PostgreSQL Backup daily at 03:00 IST (#97, #98)
    scheduler.add_job(
        scheduled_db_backup_wrapper,
        trigger=CronTrigger(hour=3, minute=0, timezone=zoneinfo.ZoneInfo("Asia/Kolkata")),
        id="job_database_backup",
        name="Automated Daily PostgreSQL Backup to R2 (03:00 IST)",
        replace_existing=True
    )

    scheduler.start()
    logger.info("[Scheduler] APScheduler successfully started with Night Audit (23:59 IST) and DB Backup (03:00 IST).")

def stop_scheduler():
    """Graceful shutdown of APScheduler on application termination."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[Scheduler] APScheduler stopped.")
