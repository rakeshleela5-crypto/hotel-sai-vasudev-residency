import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from app.services.r2_storage import r2_service, LOCAL_UPLOAD_DIR

router = APIRouter(prefix="/uploads", tags=["Cloudflare R2 File Storage"])

@router.post("/guest-document")
async def upload_guest_id_document(
    file: UploadFile = File(...)
):
    """
    Upload guest identity document (Aadhaar / Passport / DL) directly to Cloudflare R2
    """
    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type '{file.content_type}'. Must be JPG, PNG, WEBP, or PDF."
        )

    # Read contents with 10MB limit
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum 10MB limit.")

    object_key, public_url = r2_service.upload_file(
        file_bytes=contents,
        original_filename=file.filename or "guest_id.jpg",
        folder="guest_ids",
        content_type=file.content_type
    )

    return {
        "status": "success",
        "storage": "Cloudflare R2" if r2_service.is_configured() else "Local Fallback",
        "object_key": object_key,
        "url": public_url,
        "filename": file.filename,
        "size_bytes": len(contents)
    }

@router.get("/files/{folder}/{filename}")
async def serve_local_file(folder: str, filename: str):
    """Fallback endpoint to serve uploaded files when local storage is used"""
    file_path = os.path.join(LOCAL_UPLOAD_DIR, folder, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
