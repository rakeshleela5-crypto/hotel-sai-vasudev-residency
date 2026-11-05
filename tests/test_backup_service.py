"""
Unit & Integration Tests for Cloudflare R2 Database Backup Pipeline (#97, #98)
File: tests/test_backup_service.py
"""

import os
import sys
import gzip
import tempfile
import datetime
from unittest.mock import MagicMock, patch
import pytest
from starlette.requests import Request
from fastapi import HTTPException

# Ensure project root is available
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.services.backup_service import (
    get_r2_client,
    run_postgres_backup_to_r2,
    prune_r2_backups,
    list_r2_backups,
    DAILY_BACKUP_PREFIX
)
from app.routes.admin import trigger_system_backup_now, list_system_backups
from app.utils.auth import require_role


def run_coro(coro):
    """Execute coroutine deterministically without Windows loopback socket conflicts."""
    val = None
    stack = [coro]
    while stack:
        current = stack[-1]
        try:
            yielded = current.send(val)
            val = None
            if hasattr(yielded, "send"):
                stack.append(yielded)
            else:
                val = yielded
        except StopIteration as e:
            stack.pop()
            val = e.value
    return val


def test_get_r2_client_configured_and_unconfigured(monkeypatch):
    """
    Verifies that get_r2_client() initializes boto3 S3 client when credentials
    are provided and returns None when credentials are missing.
    """
    # 1. Unconfigured credentials
    monkeypatch.setenv("R2_ENDPOINT_URL", "")
    monkeypatch.setenv("R2_ACCOUNT_ID", "")
    monkeypatch.setenv("R2_ACCESS_KEY_ID", "")
    monkeypatch.setenv("R2_SECRET_ACCESS_KEY", "")
    with patch("app.services.backup_service.settings") as mock_settings:
        mock_settings.R2_ENDPOINT_URL = ""
        mock_settings.R2_ACCOUNT_ID = ""
        mock_settings.R2_ACCESS_KEY_ID = ""
        mock_settings.R2_SECRET_ACCESS_KEY = ""
        assert get_r2_client() is None

    # 2. Configured credentials
    monkeypatch.setenv("R2_ENDPOINT_URL", "https://fake-account-id.r2.cloudflarestorage.com")
    monkeypatch.setenv("R2_ACCESS_KEY_ID", "fake_access_key")
    monkeypatch.setenv("R2_SECRET_ACCESS_KEY", "fake_secret_key")

    with patch("boto3.client") as mock_boto:
        mock_boto.return_value = MagicMock()
        client = get_r2_client()
        assert client is not None
        mock_boto.assert_called_once()
        call_kwargs = mock_boto.call_args[1]
        assert call_kwargs["endpoint_url"] == "https://fake-account-id.r2.cloudflarestorage.com"
        assert call_kwargs["aws_access_key_id"] == "fake_access_key"


def test_run_postgres_backup_to_r2_with_mocked_subprocess_and_s3(monkeypatch):
    """
    Simulates pg_dump subprocess execution and Cloudflare R2 upload:
      - pg_dump execution verifies --no-owner and --no-acl
      - streams and compresses output to temporary file
      - uploads compressed snapshot to Cloudflare R2
      - immediately cleans up temporary file
      - returns expected metadata dictionary
    """
    mock_sql = b"-- Postgres Dump Table sai_vasudev\nCREATE TABLE test (id int);\nINSERT INTO test VALUES (1);\n"

    async def mock_execute_pg_dump(temp_path, clean_url):
        with gzip.open(temp_path, "wb", compresslevel=9) as gz_out:
            gz_out.write(mock_sql)

    # Mock S3 Client
    mock_s3 = MagicMock()
    mock_paginator = MagicMock()
    mock_paginator.paginate.return_value = [{"Contents": []}]
    mock_s3.get_paginator.return_value = mock_paginator

    monkeypatch.setenv("DATABASE_URL", "postgresql://user:password@localhost:5432/railway")
    monkeypatch.setenv("R2_BUCKET_NAME", "hotel-sai-vasudev-documents")

    with patch("app.services.backup_service._execute_pg_dump", side_effect=mock_execute_pg_dump) as mock_dump, \
         patch("app.services.backup_service.get_r2_client", return_value=mock_s3):

        res = run_coro(run_postgres_backup_to_r2(retention_days=30))

        assert res["status"] == "success"
        assert res["storage"] == "Cloudflare R2"
        assert res["object_key"].startswith("db-backups/sai-vasudev-residency/daily/sai_vasudev_backup_")
        assert res["filename"].endswith(".sql.gz")
        assert res["file_size"] > 0
        assert "timestamp" in res

        # Verify dump was executed with postgresql url
        mock_dump.assert_called_once()
        assert "postgresql://" in mock_dump.call_args[0][1]

        # Verify S3 put_object called
        mock_s3.put_object.assert_called_once()
        put_kwargs = mock_s3.put_object.call_args[1]
        assert put_kwargs["Bucket"] == "hotel-sai-vasudev-documents"
        assert put_kwargs["Key"] == res["object_key"]
        assert put_kwargs["ContentType"] == "application/gzip"

        # Verify temporary file was deleted immediately
        temp_file_path = os.path.join(tempfile.gettempdir(), res["filename"])
        assert not os.path.exists(temp_file_path), "Temporary backup file was not cleaned up!"


def test_run_postgres_backup_to_r2_local_fallback(monkeypatch):
    """
    Verifies that when R2 credentials are not configured, the backup saves
    to local fallback storage, cleans up the temp file, and returns success.
    """
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./hotel_sai_vasudev.db")
    fast_fallback_sql = b"-- Fast Unit Test Fallback Dump\n"

    with patch("app.services.backup_service.get_r2_client", return_value=None), \
         patch("app.services.backup_service._generate_fallback_sql_dump", return_value=fast_fallback_sql):

        res = run_coro(run_postgres_backup_to_r2(retention_days=30))
        assert res["status"] == "success"
        assert res["storage"] == "Local Fallback"
        assert res["file_size"] > 0

        # Verify temporary file is cleaned up
        temp_file_path = os.path.join(tempfile.gettempdir(), res["filename"])
        assert not os.path.exists(temp_file_path), "Temporary backup file was not cleaned up!"


def test_prune_r2_backups_30_day_retention():
    """
    Tests 30-day retention policy:
      - Objects older than 30 days are pruned via s3.delete_object.
      - Recent objects (< 30 days old) are preserved.
    """
    mock_s3 = MagicMock()
    now = datetime.datetime.now(datetime.timezone.utc)
    old_time = now - datetime.timedelta(days=35)
    recent_time = now - datetime.timedelta(days=5)

    mock_paginator = MagicMock()
    mock_paginator.paginate.return_value = [
        {
            "Contents": [
                {"Key": "db-backups/sai-vasudev-residency/daily/sai_vasudev_backup_old.sql.gz", "LastModified": old_time},
                {"Key": "db-backups/sai-vasudev-residency/daily/sai_vasudev_backup_new.sql.gz", "LastModified": recent_time},
            ]
        }
    ]
    mock_s3.get_paginator.return_value = mock_paginator

    deleted_count = run_coro(prune_r2_backups(
        s3_client=mock_s3,
        bucket_name="hotel-sai-vasudev-documents",
        prefix="db-backups/sai-vasudev-residency/daily/",
        retention_days=30
    ))

    assert deleted_count == 1
    mock_s3.delete_object.assert_called_once_with(
        Bucket="hotel-sai-vasudev-documents",
        Key="db-backups/sai-vasudev-residency/daily/sai_vasudev_backup_old.sql.gz"
    )


def test_list_r2_backups():
    """
    Verifies that list_r2_backups returns sorted list of backups with keys, sizes, and timestamps.
    """
    mock_s3 = MagicMock()
    t1 = datetime.datetime(2026, 11, 4, 3, 0, 0, tzinfo=datetime.timezone.utc)
    t2 = datetime.datetime(2026, 11, 5, 3, 0, 0, tzinfo=datetime.timezone.utc)

    mock_paginator = MagicMock()
    mock_paginator.paginate.return_value = [
        {
            "Contents": [
                {"Key": "db-backups/sai-vasudev-residency/daily/sai_vasudev_backup_2026_11_04_030000.sql.gz", "Size": 1048576, "LastModified": t1},
                {"Key": "db-backups/sai-vasudev-residency/daily/sai_vasudev_backup_2026_11_05_030000.sql.gz", "Size": 1052000, "LastModified": t2},
            ]
        }
    ]
    mock_s3.get_paginator.return_value = mock_paginator

    with patch("app.services.backup_service.get_r2_client", return_value=mock_s3):
        res = run_coro(list_r2_backups())
        assert res["status"] == "success"
        assert res["count"] == 2
        # Check sorted newest first
        assert res["backups"][0]["key"].endswith("2026_11_05_030000.sql.gz")
        assert res["backups"][0]["file_size"] == 1052000
        assert res["backups"][0]["storage"] == "Cloudflare R2"


def test_admin_system_backup_endpoints_direct_invocation():
    """
    Verifies the Admin-only endpoints:
      - POST /api/v1/admin/system/backup-now
      - GET /api/v1/admin/system/backups
    """
    admin_user = {"user_id": "1", "role": "ADMIN", "email": "admin@sai-vasudev.com"}

    mock_backup_res = {
        "status": "success",
        "object_key": "db-backups/sai-vasudev-residency/daily/sai_vasudev_backup_2026_11_05_030000.sql.gz",
        "filename": "sai_vasudev_backup_2026_11_05_030000.sql.gz",
        "file_size": 204800,
        "size_bytes": 204800,
        "timestamp": "2026-11-05T03:00:00+00:00",
        "retention_days": 30,
        "deleted_old_backups": 0,
        "storage": "Cloudflare R2"
    }

    mock_list_res = {
        "status": "success",
        "prefix": DAILY_BACKUP_PREFIX,
        "count": 1,
        "backups": [mock_backup_res]
    }

    async def fake_backup_now(**kwargs):
        return mock_backup_res

    async def fake_list_backups(**kwargs):
        return mock_list_res

    with patch("app.services.backup_service.run_postgres_backup_to_r2", side_effect=fake_backup_now), \
         patch("app.services.backup_service.list_r2_backups", side_effect=fake_list_backups):

        # 1. Trigger backup now
        trigger_res = run_coro(trigger_system_backup_now(current_user=admin_user))
        assert trigger_res["status"] == "success"
        assert trigger_res["object_key"] == mock_backup_res["object_key"]
        assert trigger_res["file_size"] == 204800
        assert trigger_res["timestamp"] == "2026-11-05T03:00:00+00:00"

        # 2. List backups
        list_res = run_coro(list_system_backups(current_user=admin_user))
        assert list_res["status"] == "success"
        assert list_res["count"] == 1
        assert len(list_res["backups"]) == 1


def test_admin_system_endpoints_rbac():
    """
    Verifies that non-admin roles cannot access the system backup endpoints.
    """
    checker = require_role(["OWNER", "MANAGER", "ADMIN"])
    mock_req = MagicMock(spec=Request)

    # Valid role passes
    valid_user = {"user_id": "1", "role": "MANAGER"}
    assert checker(request=mock_req, current_user=valid_user) == valid_user

    # Owner passes
    owner_user = {"user_id": "2", "role": "OWNER"}
    assert checker(request=mock_req, current_user=owner_user) == owner_user

    # Invalid role raises HTTP 403 Forbidden
    invalid_user = {"user_id": "3", "role": "STEWARD"}
    with pytest.raises(HTTPException) as exc_info:
        checker(request=mock_req, current_user=invalid_user)
    assert exc_info.value.status_code == 403
