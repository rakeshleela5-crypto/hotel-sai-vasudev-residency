from app.core.limiter import limit_concurrency
import logging
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.auth import require_role
from app.services.scheduler import run_night_audit, run_database_backup
from app.services.r2_storage import r2_service
from app.utils.backup import create_and_upload_db_backup
from app.config import settings

logger = logging.getLogger("pms_admin")
router = APIRouter(prefix="/admin", tags=["Administrative Operations & DevOps"])

@router.post("/backup-db", summary="Export Compressed Database Snapshot to Cloudflare R2 (#18)")
def trigger_backup_db_endpoint(
    current_user: dict = Depends(require_role(["OWNER", "MANAGER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Exports a compressed snapshot of PostgreSQL database and uploads it to
    Cloudflare R2 under backups/sai_vasudev_db_YYYY_MM_DD.json.gz, keeping the last 30 days (#18).
    Restricted strictly to OWNER, MANAGER, and ADMIN roles.
    """
    admin_id = current_user.get("email") or current_user.get("sub") or "Admin"
    logger.info(f"[Admin] DB snapshot backup manually triggered by {admin_id}")
    return create_and_upload_db_backup(db=db)

@router.post("/night-audit/run")
def trigger_manual_night_audit(
    audit_date: str = None,
    current_user: dict = Depends(require_role(["OWNER", "MANAGER"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Manually triggers the Hotel Night Audit (#41).
    Posts room tariff + GST to folios, flags no-shows, aggregates revenue.
    Restricted strictly to OWNER and MANAGER roles.
    """
    logger.info(f"[Admin] Night audit manually triggered by {current_user.get('email', 'Admin')}")
    result = run_night_audit(db=db, audit_date=audit_date)
    return result

@router.post("/backups/run")
def trigger_manual_backup(
    current_user: dict = Depends(require_role(["OWNER", "MANAGER"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Manually triggers an encrypted PostgreSQL backup to Cloudflare R2 (#97, #98).
    Restricted strictly to OWNER and MANAGER roles.
    """
    logger.info(f"[Admin] DB backup manually triggered by {current_user.get('email', 'Admin')}")
    result = run_database_backup(db=db)
    return result

@router.post("/backups/trigger", summary="Trigger Automated Database Backup to Cloudflare R2 (#3)", dependencies=[Depends(limit_concurrency)])
def trigger_backup_endpoint(
    current_user: dict = Depends(require_role(["OWNER", "MANAGER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Triggers an on-demand database backup using backend/scripts/backup_db_to_r2.py,
    compresses the output to a timestamped .sql.gz file, uploads to R2 under db-backups/,
    and prunes backups older than 30 days. Restricted to Admin roles.
    """
    admin_id = current_user.get("email") or current_user.get("sub") or "Admin"
    logger.info(f"[Admin] On-demand R2 database backup triggered by {admin_id}")
    try:
        from backend.scripts.backup_db_to_r2 import run_backup
        result = run_backup(retention_days=getattr(settings, "BACKUP_RETENTION_DAYS", 30))
        return result
    except Exception as exc:
        logger.warning(f"[Admin] backup_db_to_r2 run_backup error ({exc}), using create_and_upload_db_backup fallback.")
        return create_and_upload_db_backup(db=db)

@router.post(
    "/system/backup-now",
    summary="Trigger Immediate PostgreSQL Database Backup to Cloudflare R2 (Phase 3)",
    dependencies=[Depends(limit_concurrency)]
)
async def trigger_system_backup_now(
    current_user: dict = Depends(require_role(["OWNER", "MANAGER", "ADMIN"]))
) -> Dict[str, Any]:
    """
    Triggers an immediate database backup pipeline:
    - Runs pg_dump --no-owner --no-acl via asyncio.create_subprocess_exec
    - Compresses to sai_vasudev_backup_YYYY_MM_DD_HHMMSS.sql.gz
    - Uploads to Cloudflare R2 under db-backups/sai-vasudev-residency/daily/
    - Cleans up local temp file immediately
    - Enforces 30-day retention cleanup
    Restricted strictly to OWNER, MANAGER, and ADMIN roles.
    """
    from app.services.backup_service import run_postgres_backup_to_r2
    admin_id = current_user.get("email") or current_user.get("sub") or "Admin"
    logger.info(f"[Admin] Immediate database backup to Cloudflare R2 triggered by {admin_id}")
    result = await run_postgres_backup_to_r2(retention_days=getattr(settings, "BACKUP_RETENTION_DAYS", 30))
    return result

@router.get(
    "/system/backups",
    summary="List Database Backups in Cloudflare R2 (Phase 3)"
)
async def list_system_backups(
    current_user: dict = Depends(require_role(["OWNER", "MANAGER", "ADMIN"]))
) -> Dict[str, Any]:
    """
    Lists existing database backups in Cloudflare R2 under db-backups/sai-vasudev-residency/daily/
    with timestamps and file sizes. Restricted to OWNER, MANAGER, and ADMIN roles.
    """
    from app.services.backup_service import list_r2_backups
    return await list_r2_backups()

@router.get("/backups")
def list_database_backups(
    current_user: dict = Depends(require_role(["OWNER", "MANAGER"]))
) -> Dict[str, Any]:
    """
    Lists available encrypted database backup files stored in Cloudflare R2 / local fallback.
    """
    backups = []
    try:
        if r2_service.s3_client:
            res = r2_service.s3_client.list_objects_v2(
                Bucket=settings.R2_BUCKET_NAME,
                Prefix="backups/db/"
            )
            for item in res.get("Contents", []):
                backups.append({
                    "key": item["Key"],
                    "size_bytes": item["Size"],
                    "last_modified": item["LastModified"].isoformat(),
                    "storage": "Cloudflare R2"
                })
        else:
            import os
            local_backup_dir = os.path.join(r2_service.local_storage_path, "backups", "db")
            if os.path.exists(local_backup_dir):
                for fname in os.listdir(local_backup_dir):
                    fpath = os.path.join(local_backup_dir, fname)
                    stat = os.stat(fpath)
                    backups.append({
                        "key": f"backups/db/{fname}",
                        "size_bytes": stat.st_size,
                        "last_modified": stat.st_mtime,
                        "storage": "Local Fallback"
                    })
    except Exception as exc:
        logger.warning(f"[Admin] Error listing backups: {exc}")

    return {
        "status": "success",
        "count": len(backups),
        "backups": sorted(backups, key=lambda x: str(x.get("key")), reverse=True)
    }


@router.put("/users/{user_id}/reset-password", summary="Admin Direct Reset Staff Password (#4)")
@router.post("/users/{user_id}/reset-password", summary="Admin Direct Reset Staff Password (#4)")
def admin_reset_staff_password(
    user_id: str,
    payload: Dict[str, Any],
    current_user: dict = Depends(require_role(["OWNER", "MANAGER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Directly reset a staff user's password from Admin/Manager dashboard.
    Restricted to OWNER, MANAGER, and ADMIN roles.
    """
    from app.utils.auth import get_password_hash
    from app import models

    new_pwd = str(payload.get("new_password") or payload.get("newPassword") or "").strip()
    if len(new_pwd) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    u = db.query(models.UserAccount).filter(
        (models.UserAccount.user_name == user_id) | 
        (models.UserAccount.email_id == user_id) | 
        (models.UserAccount.user_id == (int(user_id) if user_id.isdigit() else -1)) |
        (models.UserAccount.id == (int(user_id) if user_id.isdigit() else -1))
    ).first()

    staff = db.query(models.StaffUser).filter(
        (models.StaffUser.username == user_id) |
        (models.StaffUser.email == user_id) |
        (models.StaffUser.id == (int(user_id) if user_id.isdigit() else -1))
    ).first()

    if not u and not staff:
        raise HTTPException(status_code=404, detail=f"Staff user account '{user_id}' not found.")

    pwd_hash = get_password_hash(new_pwd)

    user_name = "Staff"
    user_num_id = 0
    if u:
        u.password_hash = pwd_hash
        user_name = u.user_name
        user_num_id = u.user_id
    if staff:
        staff.password_hash = pwd_hash
        if not u:
            user_name = staff.display_name or staff.username
            user_num_id = staff.id

    db.commit()
    admin_id = current_user.get("email") or current_user.get("sub") or "Admin"
    logger.info(f"[Admin] {admin_id} reset password for staff member {user_name} (ID: {user_num_id})")

    return {
        "success": True,
        "message": f"Password for {user_name} has been reset successfully by {admin_id}.",
        "userId": user_num_id,
        "userName": user_name
    }
