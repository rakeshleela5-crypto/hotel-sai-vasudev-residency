import os
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.services.r2_storage import r2_service, LOCAL_UPLOAD_DIR, ALLOWED_FOLDERS

router = APIRouter(prefix="/uploads", tags=["Cloudflare R2 File Storage"])

ALLOWED_MIME_TYPES = {
    # Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "image/gif",
    # Documents
    "application/pdf",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/json",
    "text/plain"
}

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB Limit

class PresignedUploadRequest(BaseModel):
    filename: str
    folder: Optional[str] = "documents"
    content_type: Optional[str] = "image/jpeg"
    expires_in: Optional[int] = 900

class PresignedDownloadRequest(BaseModel):
    object_key: str
    expires_in: Optional[int] = 3600

@router.get("/status")
def get_r2_storage_status():
    """
    Check Cloudflare R2 credentials, bucket status, and storage operating mode
    """
    return {
        "status": "success",
        **r2_service.get_status()
    }

@router.get("/test-connection")
def test_r2_connection():
    """
    Test live network connectivity and read access to Cloudflare R2 bucket
    """
    return r2_service.test_connection()

@router.post("/presigned-url")
def create_presigned_upload_url(req: PresignedUploadRequest):
    """
    Generates a secure S3 pre-signed PUT URL for direct client-to-R2 upload.
    R2 API tokens and secrets remain entirely server-side.
    """
    if req.folder not in ALLOWED_FOLDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid folder '{req.folder}'. Allowed folders: {list(ALLOWED_FOLDERS)}"
        )

    res = r2_service.generate_presigned_upload_url(
        filename=req.filename,
        folder=req.folder,
        content_type=req.content_type or "image/jpeg",
        expires_in=req.expires_in or 900
    )
    return {
        "status": "success",
        **res
    }

@router.post("/presigned-download")
def create_presigned_download_url(req: PresignedDownloadRequest):
    """
    Generates a secure temporary GET URL for private files (e.g. guest Aadhaar/KYC).
    """
    res = r2_service.generate_presigned_download_url(
        object_key=req.object_key,
        expires_in=req.expires_in or 3600
    )
    return {
        "status": "success",
        **res
    }

@router.post("/file")
async def upload_file_direct(
    file: UploadFile = File(...),
    folder: str = Form("documents")
):
    """
    Direct upload endpoint: handles validation, uploads to Cloudflare R2 (or local fallback),
    and returns verified public URL and object key.
    """
    if folder not in ALLOWED_FOLDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid folder '{folder}'. Allowed: {list(ALLOWED_FOLDERS)}"
        )

    # Validate MIME type
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{content_type}'. Allowed types: JPG, PNG, WEBP, SVG, PDF, CSV, Excel."
        )

    # Read contents with size limit
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File size ({len(contents) / (1024 * 1024):.2f}MB) exceeds maximum {MAX_FILE_SIZE_BYTES / (1024 * 1024):.0f}MB limit."
        )

    object_key, file_url = r2_service.upload_file(
        file_bytes=contents,
        original_filename=file.filename or "upload.bin",
        folder=folder,
        content_type=content_type
    )

    return {
        "status": "success",
        "storage": "Cloudflare R2" if r2_service.is_configured() else "Local Fallback",
        "object_key": object_key,
        "url": file_url,
        "filename": file.filename,
        "folder": folder,
        "content_type": content_type,
        "size_bytes": len(contents)
    }

@router.post("/guest-document")
async def upload_guest_id_document(file: UploadFile = File(...)):
    """
    Dedicated KYC / ID document upload (Aadhaar, Passport, DL)
    """
    return await upload_file_direct(file=file, folder="guest_ids")

@router.post("/property-image")
async def upload_property_image(file: UploadFile = File(...)):
    """
    Dedicated room photo / hotel property image upload to Cloudflare R2
    """
    return await upload_file_direct(file=file, folder="rooms")

@router.post("/branding-asset")
async def upload_branding_asset(file: UploadFile = File(...)):
    """
    Dedicated logo, QR code, seal, or digital signature asset upload
    """
    return await upload_file_direct(file=file, folder="branding")

@router.get("/list")
def list_uploaded_files(
    folder: Optional[str] = Query(None, description="Optional folder filter"),
    limit: int = Query(100, ge=1, le=500)
):
    """
    Lists uploaded assets stored in Cloudflare R2 (or local fallback)
    """
    files = r2_service.list_files(folder=folder, max_keys=limit)
    return {
        "status": "success",
        "count": len(files),
        "folder": folder or "all",
        "files": files
    }

@router.delete("/{object_key:path}")
def delete_uploaded_file(object_key: str):
    """
    Deletes an object key from Cloudflare R2 and local storage
    """
    success = r2_service.delete_file(object_key)
    return {
        "status": "success" if success else "not_found",
        "deleted": success,
        "object_key": object_key
    }

@router.get("/files/{file_path:path}")
async def serve_local_fallback_file(file_path: str):
    """
    Secure local fallback file server with strict path traversal prevention
    """
    base_dir = os.path.abspath(LOCAL_UPLOAD_DIR)
    resolved_path = os.path.abspath(os.path.join(base_dir, file_path))

    # Boundary check ensuring resolved path is strictly within base_dir
    try:
        if os.path.commonpath([resolved_path, base_dir]) != base_dir:
            raise HTTPException(status_code=403, detail="Access denied.")
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied.")

    if not os.path.exists(resolved_path) or not os.path.isfile(resolved_path):
        raise HTTPException(status_code=404, detail="File not found on local storage.")

    return FileResponse(resolved_path)
