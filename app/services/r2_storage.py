import os
import re
import uuid
import time
import datetime
import mimetypes
from typing import Optional, Tuple, List, Dict, Any
from app.config import settings

# Local filesystem fallback directory if Cloudflare R2 credentials are not configured
LOCAL_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(LOCAL_UPLOAD_DIR, exist_ok=True)

ALLOWED_FOLDERS = {"guest_ids", "rooms", "branding", "documents", "receipts", "backups", "kyc", "invoices"}

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal and remove unsafe characters"""
    base = os.path.basename(filename)
    # Remove characters that are not alphanumeric, dash, dot, or underscore
    clean = re.sub(r'[^a-zA-Z0-9._-]', '_', base)
    return clean[:80] or "file"

class R2StorageService:
    """
    Cloudflare R2 Object Storage Service (S3-Compatible)
    Supports direct uploads, secure presigned PUT/GET URLs, listing, and deletion
    with automated local filesystem fallback when credentials are not configured.
    """
    def __init__(self):
        self.account_id = os.getenv("R2_ACCOUNT_ID") or getattr(settings, "R2_ACCOUNT_ID", "")
        self.access_key = os.getenv("R2_ACCESS_KEY_ID") or getattr(settings, "R2_ACCESS_KEY_ID", "")
        self.secret_key = os.getenv("R2_SECRET_ACCESS_KEY") or getattr(settings, "R2_SECRET_ACCESS_KEY", "")
        self.bucket_name = os.getenv("R2_BUCKET_NAME") or getattr(settings, "R2_BUCKET_NAME", "hotel-sai-vasudev-documents")
        self.public_domain = os.getenv("R2_PUBLIC_DOMAIN") or os.getenv("R2_PUBLIC_URL") or os.getenv("VITE_R2_PUBLIC_URL") or getattr(settings, "R2_PUBLIC_DOMAIN", "") or getattr(settings, "R2_PUBLIC_URL", "")

        self.s3_client = None
        if self.account_id and self.access_key and self.secret_key:
            try:
                import boto3
                from botocore.config import Config
                self.s3_client = boto3.client(
                    "s3",
                    endpoint_url=f"https://{self.account_id}.r2.cloudflarestorage.com",
                    aws_access_key_id=self.access_key,
                    aws_secret_access_key=self.secret_key,
                    region_name="auto",
                    config=Config(
                        signature_version="s3v4",
                        s3={"addressing_style": "path"},
                        connect_timeout=10,
                        read_timeout=30,
                        retries={"max_attempts": 3, "mode": "standard"}
                    )
                )
                print(f"[Cloudflare R2] S3 Client initialized successfully for bucket '{self.bucket_name}'")
            except Exception as e:
                print(f"[Cloudflare R2] Initialization error ({e}), operating in local storage mode.")

    def is_configured(self) -> bool:
        """Returns True if Cloudflare R2 credentials and S3 client are active"""
        return self.s3_client is not None

    def get_status(self) -> Dict[str, Any]:
        """Returns detailed configuration status and masked metadata"""
        configured = self.is_configured()
        masked_acc = (self.account_id[:4] + "..." + self.account_id[-4:]) if (self.account_id and len(self.account_id) > 8) else ("Configured" if self.account_id else "Not Set")
        masked_key = (self.access_key[:4] + "..." + self.access_key[-4:]) if (self.access_key and len(self.access_key) > 8) else ("Configured" if self.access_key else "Not Set")
        
        return {
            "configured": configured,
            "storage_mode": "Cloudflare R2 (S3-Compatible)" if configured else "Local Filesystem Fallback",
            "bucket_name": self.bucket_name,
            "account_id_masked": masked_acc,
            "access_key_masked": masked_key,
            "endpoint": f"https://{self.account_id}.r2.cloudflarestorage.com" if self.account_id else "N/A",
            "public_domain": self.public_domain or "Private / Pre-signed URLs Only",
            "allowed_folders": list(ALLOWED_FOLDERS),
            "local_dir": LOCAL_UPLOAD_DIR
        }

    def test_connection(self) -> Dict[str, Any]:
        """Tests live network connection and bucket access against Cloudflare R2"""
        if not self.is_configured():
            return {
                "success": True,
                "storage": "Local Fallback",
                "connected": True,
                "message": "Local disk storage active. Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY to switch to Cloudflare R2.",
                "latency_ms": 0
            }

        start = time.time()
        try:
            self.s3_client.list_objects_v2(Bucket=self.bucket_name, MaxKeys=1)
            latency = round((time.time() - start) * 1000, 2)
            return {
                "success": True,
                "storage": "Cloudflare R2",
                "connected": True,
                "bucket": self.bucket_name,
                "message": f"Successfully connected to Cloudflare R2 bucket '{self.bucket_name}' ({latency}ms)",
                "latency_ms": latency
            }
        except Exception as err:
            return {
                "success": False,
                "storage": "Cloudflare R2",
                "connected": False,
                "bucket": self.bucket_name,
                "message": f"Connection to Cloudflare R2 failed: {str(err)}",
                "latency_ms": round((time.time() - start) * 1000, 2)
            }

    def generate_object_key(self, original_filename: str, folder: str = "documents") -> str:
        """Constructs an isolated, collision-free object key"""
        safe_folder = folder if folder in ALLOWED_FOLDERS else "documents"
        ext = os.path.splitext(original_filename)[1].lower() or ".bin"
        clean_name = sanitize_filename(original_filename)
        unique_token = uuid.uuid4().hex[:10]
        date_prefix = datetime.datetime.utcnow().strftime("%Y/%m")
        return f"{safe_folder}/{date_prefix}/{unique_token}_{clean_name}"

    def generate_presigned_upload_url(
        self,
        filename: str,
        folder: str = "documents",
        content_type: str = "image/jpeg",
        expires_in: int = 900
    ) -> Dict[str, Any]:
        """
        Generates a secure S3 pre-signed PUT URL.
        Clients can directly upload binary data to Cloudflare R2 with zero server-side credential exposure.
        """
        object_key = self.generate_object_key(filename, folder)

        if self.s3_client:
            try:
                upload_url = self.s3_client.generate_presigned_url(
                    ClientMethod="put_object",
                    Params={
                        "Bucket": self.bucket_name,
                        "Key": object_key,
                        "ContentType": content_type
                    },
                    ExpiresIn=expires_in
                )

                if self.public_domain:
                    public_url = f"{self.public_domain.rstrip('/')}/{object_key}"
                else:
                    public_url = f"https://{self.bucket_name}.r2.cloudflarestorage.com/{object_key}"

                return {
                    "upload_url": upload_url,
                    "object_key": object_key,
                    "public_url": public_url,
                    "expires_in": expires_in,
                    "storage": "Cloudflare R2"
                }
            except Exception as e:
                print(f"[Cloudflare R2] Failed to generate presigned upload URL: {e}")

        # Local fallback indicator
        return {
            "upload_url": None,
            "object_key": object_key,
            "public_url": f"/api/v1/uploads/files/{object_key}",
            "expires_in": 0,
            "storage": "Local Fallback"
        }

    def generate_presigned_download_url(
        self,
        object_key: str,
        expires_in: int = 3600
    ) -> Dict[str, Any]:
        """
        Generates a time-limited pre-signed GET URL for secure downloading of confidential documents (e.g. Aadhaar).
        """
        if self.s3_client:
            try:
                download_url = self.s3_client.generate_presigned_url(
                    ClientMethod="get_object",
                    Params={
                        "Bucket": self.bucket_name,
                        "Key": object_key
                    },
                    ExpiresIn=expires_in
                )
                return {
                    "download_url": download_url,
                    "object_key": object_key,
                    "expires_in": expires_in,
                    "storage": "Cloudflare R2"
                }
            except Exception as e:
                print(f"[Cloudflare R2] Presigned download generation error: {e}")

        return {
            "download_url": f"/api/v1/uploads/files/{object_key}",
            "object_key": object_key,
            "expires_in": 0,
            "storage": "Local Fallback"
        }

    def upload_file(
        self,
        file_bytes: bytes,
        original_filename: str,
        folder: str = "documents",
        content_type: str = "image/jpeg"
    ) -> Tuple[str, str]:
        """
        Directly uploads file to Cloudflare R2 bucket with automated local filesystem fallback.
        Returns (object_key, file_url).
        """
        object_key = self.generate_object_key(original_filename, folder)

        if self.s3_client:
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=object_key,
                    Body=file_bytes,
                    ContentType=content_type
                )
                if self.public_domain:
                    url = f"{self.public_domain.rstrip('/')}/{object_key}"
                else:
                    url = f"https://{self.bucket_name}.r2.cloudflarestorage.com/{object_key}"
                return object_key, url
            except Exception as err:
                print(f"[Cloudflare R2] Upload to bucket '{self.bucket_name}' failed ({err}). Falling back to disk.")

        # Local filesystem fallback
        dest_folder = os.path.join(LOCAL_UPLOAD_DIR, os.path.dirname(object_key))
        os.makedirs(dest_folder, exist_ok=True)
        local_path = os.path.join(LOCAL_UPLOAD_DIR, object_key)
        with open(local_path, "wb") as f:
            f.write(file_bytes)

        local_url = f"/api/v1/uploads/files/{object_key}"
        return object_key, local_url

    def upload_fileobj(
        self,
        file_obj,
        original_filename: str,
        folder: str = "documents",
        content_type: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Directly uploads a file stream/object to Cloudflare R2 bucket with automated Content-Type detection
        and local filesystem fallback.
        Returns (object_key, file_url).
        """
        if not content_type or content_type == "application/octet-stream":
            guessed_type, _ = mimetypes.guess_type(original_filename)
            content_type = guessed_type or "application/octet-stream"

        object_key = self.generate_object_key(original_filename, folder)

        if self.s3_client:
            try:
                if hasattr(file_obj, "seek"):
                    try:
                        file_obj.seek(0)
                    except Exception:
                        pass
                self.s3_client.upload_fileobj(
                    Fileobj=file_obj,
                    Bucket=self.bucket_name,
                    Key=object_key,
                    ExtraArgs={"ContentType": content_type}
                )
                if self.public_domain:
                    url = f"{self.public_domain.rstrip('/')}/{object_key}"
                else:
                    url = f"https://{self.bucket_name}.r2.cloudflarestorage.com/{object_key}"
                return object_key, url
            except Exception as err:
                print(f"[Cloudflare R2] upload_fileobj to bucket '{self.bucket_name}' failed ({err}). Falling back to disk.")

        # Local filesystem fallback
        dest_folder = os.path.join(LOCAL_UPLOAD_DIR, os.path.dirname(object_key))
        os.makedirs(dest_folder, exist_ok=True)
        local_path = os.path.join(LOCAL_UPLOAD_DIR, object_key)
        if hasattr(file_obj, "seek"):
            try:
                file_obj.seek(0)
            except Exception:
                pass
        with open(local_path, "wb") as f:
            if hasattr(file_obj, "read"):
                chunk = file_obj.read(65536)
                while chunk:
                    f.write(chunk)
                    chunk = file_obj.read(65536)
            else:
                f.write(file_obj)

        local_url = f"/api/v1/uploads/files/{object_key}"
        return object_key, local_url

    def delete_file(self, object_key: str) -> bool:
        """Deletes an object from Cloudflare R2 or local fallback storage"""
        deleted = False
        if self.s3_client:
            try:
                self.s3_client.delete_object(Bucket=self.bucket_name, Key=object_key)
                deleted = True
            except Exception as e:
                print(f"[Cloudflare R2] Object deletion error ({object_key}): {e}")

        # Also attempt local cleanup if present
        local_path = os.path.join(LOCAL_UPLOAD_DIR, object_key)
        if os.path.exists(local_path) and os.path.isfile(local_path):
            try:
                os.remove(local_path)
                deleted = True
            except Exception:
                pass

        return deleted

    def list_files(self, folder: Optional[str] = None, max_keys: int = 100) -> List[Dict[str, Any]]:
        """Lists objects in Cloudflare R2 bucket or local fallback directory"""
        results: List[Dict[str, Any]] = []

        if self.s3_client:
            try:
                prefix = f"{folder}/" if (folder and folder in ALLOWED_FOLDERS) else ""
                res = self.s3_client.list_objects_v2(
                    Bucket=self.bucket_name,
                    Prefix=prefix,
                    MaxKeys=max_keys
                )
                for item in res.get("Contents", []):
                    key = item.get("Key", "")
                    size = item.get("Size", 0)
                    last_mod = item.get("LastModified")
                    last_mod_str = last_mod.isoformat() if last_mod else datetime.datetime.utcnow().isoformat()
                    
                    if self.public_domain:
                        url = f"{self.public_domain.rstrip('/')}/{key}"
                    else:
                        url = f"https://{self.bucket_name}.r2.cloudflarestorage.com/{key}"

                    results.append({
                        "object_key": key,
                        "filename": os.path.basename(key),
                        "folder": key.split("/")[0] if "/" in key else "root",
                        "size_bytes": size,
                        "last_modified": last_mod_str,
                        "url": url,
                        "storage": "Cloudflare R2"
                    })
                return results
            except Exception as err:
                print(f"[Cloudflare R2] list_objects error: {err}")

        # Local fallback listing
        base_dir = os.path.abspath(LOCAL_UPLOAD_DIR)
        search_dir = os.path.join(base_dir, folder) if folder else base_dir
        if os.path.exists(search_dir):
            for root, _, files in os.walk(search_dir):
                for f in files:
                    full_p = os.path.join(root, f)
                    rel_p = os.path.relpath(full_p, base_dir).replace("\\", "/")
                    stat = os.stat(full_p)
                    results.append({
                        "object_key": rel_p,
                        "filename": f,
                        "folder": rel_p.split("/")[0] if "/" in rel_p else "root",
                        "size_bytes": stat.st_size,
                        "last_modified": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        "url": f"/api/v1/uploads/files/{rel_p}",
                        "storage": "Local Fallback"
                    })
                    if len(results) >= max_keys:
                        break

        return results

r2_service = R2StorageService()
