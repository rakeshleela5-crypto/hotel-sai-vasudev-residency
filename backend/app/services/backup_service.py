"""
Automated PostgreSQL Database Replication & Daily Backup Pipeline to Cloudflare R2
Location: backend/app/services/backup_service.py

Functionality:
  1. Executes pg_dump --no-owner --no-acl via asyncio.create_subprocess_exec (with resilient ORM fallback).
  2. Streams & compresses output with gzip into a temporary file named sai_vasudev_backup_YYYY_MM_DD_HHMMSS.sql.gz.
  3. Uploads the compressed snapshot to Cloudflare R2 under prefix db-backups/sai-vasudev-residency/daily/.
  4. Immediately cleans up local temporary file in a finally block.
  5. Enforces 30-day retention policy in R2 by listing and pruning objects older than 30 days.
  6. Provides list_r2_backups() to inspect existing backup snapshots.
"""

import os
import sys
import gzip
import shutil
import logging
import tempfile
import datetime
import asyncio
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse
import boto3
from botocore.config import Config

from app.config import settings

logger = logging.getLogger("svr_backup_service")

DAILY_BACKUP_PREFIX = "db-backups/sai-vasudev-residency/daily/"

def get_r2_client():
    """
    Initializes and returns a boto3 S3 client configured for Cloudflare R2.
    Uses R2_ENDPOINT_URL (or constructs from R2_ACCOUNT_ID), R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.
    """
    endpoint_url = os.getenv("R2_ENDPOINT_URL") or getattr(settings, "R2_ENDPOINT_URL", "")
    account_id = os.getenv("R2_ACCOUNT_ID") or getattr(settings, "R2_ACCOUNT_ID", "")

    if not endpoint_url and account_id:
        endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

    access_key = os.getenv("R2_ACCESS_KEY_ID") or getattr(settings, "R2_ACCESS_KEY_ID", "")
    secret_key = os.getenv("R2_SECRET_ACCESS_KEY") or getattr(settings, "R2_SECRET_ACCESS_KEY", "")

    if not (endpoint_url and access_key and secret_key):
        return None

    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
            retries={"max_attempts": 3, "mode": "standard"},
            connect_timeout=10,
            read_timeout=60
        )
    )

async def _execute_pg_dump(temp_path: str, clean_url: str):
    """Executes pg_dump --no-owner --no-acl using asyncio.create_subprocess_exec and streams into gzip file."""
    parsed = urlparse(clean_url)
    env = os.environ.copy()
    if parsed.password:
        env["PGPASSWORD"] = parsed.password

    pg_dump_bin = shutil.which("pg_dump") or "pg_dump"
    cmd = [
        pg_dump_bin,
        "--no-owner",
        "--no-acl",
        "-d", clean_url
    ]

    logger.info(f"[BackupService] Executing pg_dump --no-owner --no-acl via asyncio.create_subprocess_exec")
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=env
    )

    with gzip.open(temp_path, "wb", compresslevel=9) as gz_out:
        while True:
            chunk = await proc.stdout.read(64 * 1024)
            if not chunk:
                break
            gz_out.write(chunk)

    _, stderr_data = await proc.communicate()
    if proc.returncode != 0:
        err_msg = stderr_data.decode("utf-8", errors="ignore")
        raise RuntimeError(f"pg_dump exited with code {proc.returncode}: {err_msg}")

def _generate_fallback_sql_dump() -> bytes:
    """
    Generates a structured SQL dump export via ORM reflection when pg_dump is unavailable
    or when running on SQLite in testing/development environments.
    """
    from app.database import engine, SessionLocal
    from sqlalchemy import text, inspect
    import re

    db = SessionLocal()
    try:
        sql_lines = [
            "-- Hotel Sai Vasudev Residency Database SQL Dump (Fallback)",
            f"-- Generated: {datetime.datetime.now(datetime.timezone.utc).isoformat()}",
            f"-- Engine: {engine.url.drivername}",
            "BEGIN TRANSACTION;\n"
        ]
        inspector = inspect(engine)
        for table_name in inspector.get_table_names():
            if not re.match(r'^[a-zA-Z0-9_]+$', table_name):
                continue
            safe_table = f'"{table_name}"'
            try:
                res = db.execute(text(f"SELECT * FROM {safe_table}"))
                cols = list(res.keys())
                rows = res.fetchall()
                if rows:
                    col_str = ", ".join([f'"{c}"' for c in cols])
                    for row in rows:
                        vals = []
                        for val in row:
                            if val is None:
                                vals.append("NULL")
                            elif isinstance(val, (int, float)):
                                vals.append(str(val))
                            elif isinstance(val, bool):
                                vals.append("1" if val else "0")
                            else:
                                escaped = str(val).replace("'", "''")
                                vals.append(f"'{escaped}'")
                        sql_lines.append(f"INSERT INTO {safe_table} ({col_str}) VALUES ({', '.join(vals)});")
            except Exception as t_err:
                logger.debug(f"[BackupService] Skipped table {table_name}: {t_err}")

        sql_lines.append("COMMIT;\n")
        return "\n".join(sql_lines).encode("utf-8")
    finally:
        db.close()

async def prune_r2_backups(
    s3_client: Optional[Any],
    bucket_name: str,
    prefix: str = DAILY_BACKUP_PREFIX,
    retention_days: int = 30
) -> int:
    """
    Applies retention policy: deletes backups under prefix older than retention_days.
    Works for Cloudflare R2 and local filesystem fallback.
    """
    deleted_count = 0
    cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=retention_days)

    if s3_client and bucket_name:
        try:
            paginator = s3_client.get_paginator("list_objects_v2")
            for page in paginator.paginate(Bucket=bucket_name, Prefix=prefix):
                for obj in page.get("Contents", []):
                    key = obj.get("Key", "")
                    if key.endswith("/"):
                        continue
                    last_mod = obj.get("LastModified")
                    if last_mod and last_mod.tzinfo is None:
                        last_mod = last_mod.replace(tzinfo=datetime.timezone.utc)
                    if last_mod and last_mod < cutoff:
                        s3_client.delete_object(Bucket=bucket_name, Key=key)
                        deleted_count += 1
                        logger.info(f"[Retention] Deleted R2 backup older than {retention_days} days: {key}")
        except Exception as exc:
            logger.warning(f"[Retention] Error pruning R2 backups: {exc}")
    else:
        # Local fallback cleanup
        local_base = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
        local_daily_dir = os.path.join(local_base, prefix.replace("/", os.sep))
        if os.path.exists(local_daily_dir):
            for fname in os.listdir(local_daily_dir):
                fpath = os.path.join(local_daily_dir, fname)
                try:
                    mtime = datetime.datetime.fromtimestamp(os.path.getmtime(fpath), tz=datetime.timezone.utc)
                    if mtime < cutoff:
                        os.remove(fpath)
                        deleted_count += 1
                        logger.info(f"[Retention] Deleted local fallback backup older than {retention_days} days: {fname}")
                except Exception as l_err:
                    logger.warning(f"[Retention] Error deleting local backup {fname}: {l_err}")

    return deleted_count

async def run_postgres_backup_to_r2(retention_days: int = 30) -> Dict[str, Any]:
    """
    Executes automated database backup pipeline to Cloudflare R2:
      1. Executes pg_dump --no-owner --no-acl using asyncio.create_subprocess_exec (with ORM fallback).
      2. Streams and compresses the output with gzip into temporary file sai_vasudev_backup_YYYY_MM_DD_HHMMSS.sql.gz.
      3. Uploads the compressed backup to Cloudflare R2 under prefix db-backups/sai-vasudev-residency/daily/.
      4. Immediately cleans up local temporary file in a finally block.
      5. Applies 30-day retention policy in R2 (lists objects and deletes snapshots older than 30 days).
    """
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    timestamp_str = now_utc.strftime("%Y_%m_%d_%H%M%S")
    filename = f"sai_vasudev_backup_{timestamp_str}.sql.gz"
    prefix = DAILY_BACKUP_PREFIX
    object_key = f"{prefix}{filename}"

    database_url = os.getenv("DATABASE_URL") or getattr(settings, "DATABASE_URL", "sqlite:///./hotel_sai_vasudev.db")
    bucket_name = os.getenv("R2_BUCKET_NAME") or getattr(settings, "R2_BUCKET_NAME", "hotel-sai-vasudev-documents")

    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, filename)

    clean_url = database_url.strip()
    if clean_url.startswith("postgres://"):
        clean_url = clean_url.replace("postgres://", "postgresql://", 1)

    is_postgres = clean_url.startswith("postgresql://") or clean_url.startswith("postgresql+psycopg")

    try:
        # Step 1: Dump & Gzip Compress to temp file
        dump_success = False
        if is_postgres:
            try:
                await _execute_pg_dump(temp_path, clean_url)
                dump_success = True
            except Exception as pg_err:
                logger.warning(f"[BackupService] pg_dump failed ({pg_err}), using structured SQL reflection fallback.")

        if not dump_success:
            fallback_bytes = _generate_fallback_sql_dump()
            with gzip.open(temp_path, "wb", compresslevel=9) as gz_out:
                gz_out.write(fallback_bytes)

        file_size = os.path.getsize(temp_path)

        # Step 2: Upload to Cloudflare R2
        s3_client = get_r2_client()
        storage_mode = "Cloudflare R2"

        if s3_client and bucket_name:
            try:
                with open(temp_path, "rb") as f:
                    s3_client.put_object(
                        Bucket=bucket_name,
                        Key=object_key,
                        Body=f.read(),
                        ContentType="application/gzip",
                        Metadata={
                            "created_at": now_utc.isoformat(),
                            "app": "Hotel Sai Vasudev Residency",
                            "retention_days": str(retention_days)
                        }
                    )
                logger.info(f"[BackupService] Successfully uploaded {object_key} ({file_size} bytes) to Cloudflare R2.")
            except Exception as r2_err:
                logger.warning(f"[BackupService] R2 upload failed ({r2_err}), falling back to local storage.")
                s3_client = None

        if not s3_client:
            storage_mode = "Local Fallback"
            local_base = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
            local_daily_dir = os.path.join(local_base, prefix.replace("/", os.sep))
            os.makedirs(local_daily_dir, exist_ok=True)
            local_dest = os.path.join(local_daily_dir, filename)
            shutil.copy2(temp_path, local_dest)
            logger.info(f"[BackupService] Stored backup locally at {local_dest} ({file_size} bytes).")

        # Step 3: Retention cleanup (prune snapshots older than retention_days)
        deleted_count = await prune_r2_backups(
            s3_client=s3_client,
            bucket_name=bucket_name,
            prefix=prefix,
            retention_days=retention_days
        )

        return {
            "status": "success",
            "object_key": object_key,
            "filename": filename,
            "file_size": file_size,
            "size_bytes": file_size,
            "timestamp": now_utc.isoformat(),
            "retention_days": retention_days,
            "deleted_old_backups": deleted_count,
            "storage": storage_mode
        }
    finally:
        # Step 4: Immediate cleanup of local temporary file
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                logger.debug(f"[BackupService] Cleaned up temporary backup file {temp_path}")
            except Exception as rm_err:
                logger.warning(f"[BackupService] Error removing temp file {temp_path}: {rm_err}")

async def list_r2_backups(prefix: str = DAILY_BACKUP_PREFIX) -> Dict[str, Any]:
    """
    Lists existing database backups stored in Cloudflare R2 under prefix
    with timestamps and file sizes. Falls back to local directory if R2 is not configured.
    """
    s3_client = get_r2_client()
    bucket_name = os.getenv("R2_BUCKET_NAME") or getattr(settings, "R2_BUCKET_NAME", "hotel-sai-vasudev-documents")
    backups: List[Dict[str, Any]] = []

    if s3_client and bucket_name:
        try:
            paginator = s3_client.get_paginator("list_objects_v2")
            for page in paginator.paginate(Bucket=bucket_name, Prefix=prefix):
                for obj in page.get("Contents", []):
                    key = obj.get("Key", "")
                    if key.endswith("/"):
                        continue
                    last_mod = obj.get("LastModified")
                    ts = last_mod.isoformat() if hasattr(last_mod, "isoformat") else str(last_mod)
                    size = obj.get("Size", 0)
                    backups.append({
                        "object_key": key,
                        "key": key,
                        "file_size": size,
                        "size_bytes": size,
                        "timestamp": ts,
                        "last_modified": ts,
                        "storage": "Cloudflare R2"
                    })
        except Exception as exc:
            logger.warning(f"[BackupService] Error listing R2 backups: {exc}")
    else:
        # Local fallback listing
        local_base = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
        local_daily_dir = os.path.join(local_base, prefix.replace("/", os.sep))
        if os.path.exists(local_daily_dir):
            for fname in os.listdir(local_daily_dir):
                fpath = os.path.join(local_daily_dir, fname)
                if os.path.isfile(fpath):
                    stat = os.stat(fpath)
                    mtime = datetime.datetime.fromtimestamp(stat.st_mtime, tz=datetime.timezone.utc).isoformat()
                    backups.append({
                        "object_key": f"{prefix}{fname}",
                        "key": f"{prefix}{fname}",
                        "file_size": stat.st_size,
                        "size_bytes": stat.st_size,
                        "timestamp": mtime,
                        "last_modified": mtime,
                        "storage": "Local Fallback"
                    })

    sorted_backups = sorted(backups, key=lambda x: str(x.get("timestamp") or x.get("key")), reverse=True)
    return {
        "status": "success",
        "prefix": prefix,
        "count": len(sorted_backups),
        "backups": sorted_backups
    }

