import os
import uuid
import datetime
from typing import Optional, Tuple
from app.config import settings

# In-memory / local fallback folder if R2 credentials are not set
LOCAL_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(LOCAL_UPLOAD_DIR, exist_ok=True)

class R2StorageService:
    def __init__(self):
        self.account_id = os.getenv("R2_ACCOUNT_ID")
        self.access_key = os.getenv("R2_ACCESS_KEY_ID")
        self.secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
        self.bucket_name = os.getenv("R2_BUCKET_NAME", "hotel-sai-vasudev-documents")
        self.public_domain = os.getenv("R2_PUBLIC_DOMAIN")

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
                    config=Config(signature_version="s3v4")
                )
            except Exception as e:
                print(f"[R2Storage] Notice: boto3 initialization failed ({e}), falling back to local file storage.")

    def is_configured(self) -> bool:
        return self.s3_client is not None

    def upload_file(
        self, 
        file_bytes: bytes, 
        original_filename: str, 
        folder: str = "guest_ids", 
        content_type: str = "image/jpeg"
    ) -> Tuple[str, str]:
        """
        Upload file to Cloudflare R2 bucket (or local fallback).
        Returns (object_key, public_url).
        """
        ext = os.path.splitext(original_filename)[1].lower() or ".jpg"
        unique_name = f"{uuid.uuid4().hex[:12]}{ext}"
        object_key = f"{folder}/{datetime.datetime.utcnow().strftime('%Y/%m')}/{unique_name}"

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
                print(f"[R2Storage] Cloudflare R2 upload error ({err}), saving locally.")

        # Local fallback
        dest_folder = os.path.join(LOCAL_UPLOAD_DIR, folder)
        os.makedirs(dest_folder, exist_ok=True)
        local_path = os.path.join(dest_folder, unique_name)
        with open(local_path, "wb") as f:
            f.write(file_bytes)

        local_url = f"/api/v1/uploads/files/{folder}/{unique_name}"
        return object_key, local_url

r2_service = R2StorageService()
