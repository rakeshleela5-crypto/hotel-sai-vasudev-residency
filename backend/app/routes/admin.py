import logging
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.auth import require_role
from app.services.scheduler import run_night_audit, run_database_backup
from app.services.r2_storage import r2_service
from app.config import settings

logger = logging.getLogger("pms_admin")
router = APIRouter(prefix="/admin", tags=["Administrative Operations & DevOps"])

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
