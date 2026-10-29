import os
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
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

@router.post("/secure-view")
def create_secure_view_url(req: PresignedDownloadRequest):
    """
    Generates a strictly time-limited 60-second pre-signed URL for private staff viewing (#50).
    """
    res = r2_service.generate_secure_view_url(
        object_key=req.object_key,
        expires_in=req.expires_in or 60
    )
    return {
        "status": "success",
        **res
    }

@router.post("/guest-id")
async def upload_guest_id_endpoint(
    file: UploadFile = File(...),
    booking_ref: str = Form("WALKIN")
):
    """
    Uploads and validates guest ID scan (Aadhaar/Passport/DL) to private R2 storage (#45, #50).
    Enforces strict MIME (JPEG, PNG, PDF) and max 5MB size limit.
    """
    try:
        content = await file.read()
        object_key, file_url = r2_service.upload_guest_id_scan(
            file_bytes=content,
            filename=file.filename or "guest_id.jpg",
            booking_ref=booking_ref
        )
        secure_view = r2_service.generate_secure_view_url(object_key, expires_in=60)
        return {
            "status": "success",
            "message": "Guest ID uploaded and stored securely (#50)",
            "object_key": object_key,
            "url": file_url,
            "secure_view_url": secure_view.get("download_url"),
            "expires_in": 60
        }
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))

@router.post("/invoice-pdf")
async def upload_invoice_pdf_endpoint(
    file: UploadFile = File(...),
    invoice_number: str = Form("INV-TEMP")
):
    """
    Uploads and validates GST invoice PDF to private R2 storage (#45, #50).
    Enforces strict PDF MIME type and max 5MB size limit.
    """
    try:
        content = await file.read()
        object_key, file_url = r2_service.upload_invoice_pdf(
            pdf_bytes=content,
            invoice_number=invoice_number
        )
        secure_view = r2_service.generate_secure_view_url(object_key, expires_in=60)
        return {
            "status": "success",
            "message": "GST Tax Invoice uploaded to private R2 key (#50)",
            "object_key": object_key,
            "url": file_url,
            "secure_view_url": secure_view.get("download_url"),
            "expires_in": 60
        }
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))

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

# =========================================================================
# DATABASE-LINKED CLOUDFLARE R2 ROUTES (POSTGRESQL RECORD BINDING)
# =========================================================================

@router.post("/booking-kyc/{booking_id}", response_model=schemas.BookingKycUploadResponse)
async def upload_booking_kyc_document(
    booking_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Securely uploads guest KYC / ID proof document (Aadhaar, Passport, DL) to Cloudflare R2
    under kyc/ folder and permanently binds the private object key to the Booking record in PostgreSQL.
    """
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking with ID {booking_id} not found.")

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{content_type}'. Allowed types: JPG, PNG, WEBP, PDF."
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum size limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
        )

    # Clean up old KYC document if replaced
    if booking.id_proof_document_key:
        try:
            r2_service.delete_file(booking.id_proof_document_key)
        except Exception:
            pass

    object_key, _ = r2_service.upload_file(
        file_bytes=contents,
        original_filename=file.filename or f"kyc_guest_{booking_id}.pdf",
        folder="kyc",
        content_type=content_type
    )

    # Persist in PostgreSQL
    booking.id_proof_document_key = object_key
    if booking.police_log:
        booking.police_log.id_document_key = object_key
    db.commit()
    db.refresh(booking)

    return schemas.BookingKycUploadResponse(
        booking_id=booking.id,
        object_key=object_key,
        storage="Cloudflare R2" if r2_service.is_configured() else "Local Fallback",
        filename=file.filename,
        content_type=content_type,
        size_bytes=len(contents),
        message=f"KYC document securely uploaded to Cloudflare R2 and attached to booking #{booking.booking_ref} in PostgreSQL."
    )

@router.get("/booking-kyc/{booking_id}/presigned-url", response_model=schemas.BookingKycPresignedResponse)
def get_booking_kyc_presigned_url(
    booking_id: int,
    expires_in: int = Query(900, ge=60, le=86400, description="Expiration time in seconds (default: 15 minutes)"),
    db: Session = Depends(get_db)
):
    """
    Generates a secure, temporary S3 pre-signed GET URL (valid for 15 minutes) for confidential guest KYC documents.
    Does not expose raw credentials or make the bucket publicly readable.
    """
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking with ID {booking_id} not found.")

    if not booking.id_proof_document_key:
        raise HTTPException(status_code=404, detail=f"No KYC document has been uploaded for booking #{booking.booking_ref}.")

    res = r2_service.generate_presigned_download_url(
        object_key=booking.id_proof_document_key,
        expires_in=expires_in
    )

    return schemas.BookingKycPresignedResponse(
        booking_id=booking.id,
        object_key=booking.id_proof_document_key,
        download_url=res.get("download_url", ""),
        expires_in=expires_in,
        storage=res.get("storage", "Cloudflare R2")
    )

@router.delete("/booking-kyc/{booking_id}")
def delete_booking_kyc_document(
    booking_id: int,
    db: Session = Depends(get_db)
):
    """
    Deletes the guest KYC document from Cloudflare R2 and removes the object key from the Booking in PostgreSQL.
    """
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking with ID {booking_id} not found.")

    if not booking.id_proof_document_key:
        return {"status": "success", "message": "No KYC document attached to booking."}

    key_to_delete = booking.id_proof_document_key
    r2_service.delete_file(key_to_delete)

    booking.id_proof_document_key = None
    if booking.police_log and booking.police_log.id_document_key == key_to_delete:
        booking.police_log.id_document_key = None
    db.commit()

    return {
        "status": "success",
        "booking_id": booking.id,
        "deleted_key": key_to_delete,
        "message": "KYC document deleted from Cloudflare R2 and cleared from PostgreSQL reservation record."
    }

@router.post("/room-photo/{room_id}", response_model=schemas.RoomPhotoUploadResponse)
async def upload_room_photo_and_update(
    room_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Uploads a public room photo to Cloudflare R2 and updates room.image_url in PostgreSQL.
    """
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail=f"Room with ID {room_id} not found.")

    content_type = file.content_type or "image/jpeg"
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Room photo must be a valid image file.")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image size exceeds maximum limit.")

    object_key, file_url = r2_service.upload_file(
        file_bytes=contents,
        original_filename=file.filename or f"room_{room_id}.jpg",
        folder="rooms",
        content_type=content_type
    )

    room.image_url = file_url
    db.commit()
    db.refresh(room)

    return schemas.RoomPhotoUploadResponse(
        room_id=room.id,
        object_key=object_key,
        image_url=file_url,
        storage="Cloudflare R2" if r2_service.is_configured() else "Local Fallback",
        message=f"Room photo successfully uploaded to Cloudflare R2 and updated for {room.name} in PostgreSQL."
    )

@router.post("/booking-invoice/{booking_id}")
async def upload_booking_invoice_pdf(
    booking_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Uploads generated GST Tax Invoice PDF to Cloudflare R2 under invoices/ and binds invoice_pdf_key to the booking.
    """
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking with ID {booking_id} not found.")

    contents = await file.read()
    object_key, _ = r2_service.upload_file(
        file_bytes=contents,
        original_filename=file.filename or f"invoice_{booking.invoice_number}.pdf",
        folder="invoices",
        content_type="application/pdf"
    )

    booking.invoice_pdf_key = object_key
    db.commit()
    db.refresh(booking)

    return {
        "status": "success",
        "booking_id": booking.id,
        "invoice_number": booking.invoice_number,
        "object_key": object_key,
        "message": "GST Invoice PDF securely archived in Cloudflare R2 and bound to reservation in PostgreSQL."
    }

@router.get("/booking-invoice/{booking_id}/presigned-url")
def get_booking_invoice_presigned_url(
    booking_id: int,
    expires_in: int = Query(900, ge=60, le=86400),
    db: Session = Depends(get_db)
):
    """
    Generates a secure 15-minute temporary download link for the booking's GST tax invoice.
    """
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking or not booking.invoice_pdf_key:
        raise HTTPException(status_code=404, detail="Invoice PDF not found for this booking.")

    res = r2_service.generate_presigned_download_url(
        object_key=booking.invoice_pdf_key,
        expires_in=expires_in
    )
    return {
        "status": "success",
        "booking_id": booking.id,
        "invoice_number": booking.invoice_number,
        "download_url": res.get("download_url"),
        "expires_in": expires_in,
        "storage": res.get("storage", "Cloudflare R2")
    }

# =========================================================================
# GENERAL CATCH-ALL OBJECT STORAGE ROUTES (MUST BE AT THE END OF FILE)
# =========================================================================

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


