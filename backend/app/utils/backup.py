"""
Disaster Recovery Database Backup Utility (#18).
Exports a compressed snapshot (.json.gz / .sql.gz) of the PostgreSQL database
and uploads it to Cloudflare R2 under backups/sai_vasudev_db_YYYY_MM_DD.json.gz,
enforcing a 30-day retention window.
"""

import os
import gzip
import json
import logging
import datetime
import re
from typing import Dict, Any, Tuple, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text

from app.config import settings
from app.services.r2_storage import r2_service

logger = logging.getLogger("pms_backup")

def generate_database_json_snapshot(db: Session) -> str:
    """
    Serializes all database tables and rows into a structured JSON string.
    Safely handles DateTimes, Decimals, UUIDs, and binary objects.
    """
    bind = db.get_bind()
    inspector = inspect(bind)
    table_names = inspector.get_table_names()

    snapshot_data: Dict[str, Any] = {
        "metadata": {
            "app": "Hotel Sai Vasudev Residency",
            "version": getattr(settings, "VERSION", "2.0.0"),
            "database_engine": str(bind.url.drivername),
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "retention_policy_days": getattr(settings, "BACKUP_RETENTION_DAYS", 30)
        },
        "tables": {}
    }

    for table_name in table_names:
        if not re.match(r'^[a-zA-Z0-9_]+$', table_name):
            continue
        try:
            safe_table = f'"{table_name}"'
            result = db.execute(text(f"SELECT * FROM {safe_table}"))
            cols = list(result.keys())
            rows = result.fetchall()
            
            table_records = []
            for row in rows:
                row_dict = {}
                for col_name, val in zip(cols, row):
                    if isinstance(val, (datetime.datetime, datetime.date, datetime.time)):
                        row_dict[col_name] = val.isoformat()
                    elif isinstance(val, bytes):
                        row_dict[col_name] = val.hex()
                    else:
                        row_dict[col_name] = val
                table_records.append(row_dict)

            snapshot_data["tables"][table_name] = {
                "record_count": len(table_records),
                "columns": cols,
                "records": table_records
            }
        except Exception as exc:
            logger.warning(f"[DBBackup] Skipped table {table_name} during JSON dump: {exc}")

    return json.dumps(snapshot_data, indent=2, default=str)


def prune_old_r2_backups(days_to_keep: int = 30) -> int:
    """
    Enforces the 30-day Disaster Recovery retention policy (#18, #98).
    Deletes backup artifacts older than 30 days from Cloudflare R2 and local fallback storage.
    """
    pruned_count = 0
    cutoff_time = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days_to_keep)

    try:
        if r2_service.s3_client:
            paginator = r2_service.s3_client.get_paginator('list_objects_v2')
            page_iterator = paginator.paginate(
                Bucket=settings.R2_BUCKET_NAME,
                Prefix="backups/"
            )

            for page in page_iterator:
                for obj in page.get('Contents', []):
                    key = obj['Key']
                    last_mod = obj['LastModified']
                    if last_mod < cutoff_time:
                        r2_service.s3_client.delete_object(
                            Bucket=settings.R2_BUCKET_NAME,
                            Key=key
                        )
                        pruned_count += 1
                        logger.info(f"[DBBackup Retention] Pruned expired R2 backup ({days_to_keep}d policy): {key}")
        else:
            local_backup_dir = os.path.join(r2_service.local_storage_path, "backups")
            if os.path.exists(local_backup_dir):
                for root, _, files in os.walk(local_backup_dir):
                    for fname in files:
                        fpath = os.path.join(root, fname)
                        file_mtime = datetime.datetime.fromtimestamp(os.path.getmtime(fpath), tz=datetime.timezone.utc)
                        if file_mtime < cutoff_time:
                            os.remove(fpath)
                            pruned_count += 1
                            logger.info(f"[DBBackup Retention] Pruned expired local backup: {fname}")
    except Exception as exc:
        logger.warning(f"[DBBackup Retention] Retention sweep error: {exc}")

    return pruned_count


def create_and_upload_db_backup(db: Session, date_str: Optional[str] = None) -> Dict[str, Any]:
    """
    Exports a gzip-compressed JSON snapshot of the PostgreSQL database and uploads it to
    Cloudflare R2 under backups/sai_vasudev_db_YYYY_MM_DD.json.gz (#18).
    Applies 30-day retention pruning.
    """
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    date_formatted = date_str or now_utc.strftime("%Y_%m_%d")
    backup_filename = f"sai_vasudev_db_{date_formatted}.json.gz"
    backup_key = f"backups/{backup_filename}"

    # 1. Generate full database JSON snapshot
    json_str = generate_database_json_snapshot(db)
    raw_size_bytes = len(json_str.encode("utf-8"))

    # 2. Compress with gzip (maximum compression level 9)
    compressed_bytes = gzip.compress(json_str.encode("utf-8"), compresslevel=9)
    compressed_size_bytes = len(compressed_bytes)

    # 3. Upload to Cloudflare R2 (or local fallback)
    uploaded_key, file_url = r2_service.upload_file(
        file_data=compressed_bytes,
        object_key=backup_key,
        content_type="application/gzip"
    )

    storage_mode = "Cloudflare R2" if r2_service.s3_client else "Local Fallback"

    # 4. Prune snapshots older than 30 days (#18, #98)
    retention_days = getattr(settings, "BACKUP_RETENTION_DAYS", 30)
    pruned_count = prune_old_r2_backups(days_to_keep=retention_days)

    logger.info(
        f"[DisasterRecovery] Snapshot created: {backup_key} "
        f"({raw_size_bytes / 1024:.1f}KB -> {compressed_size_bytes / 1024:.1f}KB) "
        f"in {storage_mode}. Pruned {pruned_count} old backups."
    )

    return {
        "success": True,
        "status": "completed",
        "backup_key": uploaded_key,
        "filename": backup_filename,
        "raw_size_bytes": raw_size_bytes,
        "compressed_size_bytes": compressed_size_bytes,
        "storage": storage_mode,
        "url": file_url,
        "retention_days": retention_days,
        "pruned_count": pruned_count,
        "timestamp": now_utc.isoformat(),
        "message": f"Database snapshot successfully compressed and uploaded to Cloudflare R2 ({backup_key})."
    }

