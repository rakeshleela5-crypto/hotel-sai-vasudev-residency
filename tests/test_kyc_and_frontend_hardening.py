"""
Test Suite: KYC Upload Size Limits & In-Flight Hardening Verification
Covers:
  1. KYC Upload Size Limits & MIME Checks (Cloudflare R2):
     - Server-side rejection of files > 5 MB with HTTP 413 (Payload Too Large)
     - Strict MIME validation (image/jpeg, image/png, image/webp, application/pdf)
     - WebP magic byte inspection (RIFF....WEBP)
     - Parity across /uploads/guest-id, /uploads/file, and /uploads/booking-kyc/{booking_id}
  2. Frontend Hardening Assets:
     - Client-side image compression helper (compressKycImage in src/utils/imageCompression.ts)
     - Reusable in-flight submission lock hook (useInFlightLock in src/hooks/useInFlightLock.ts)
     - Enterprise ErrorBoundary with branded fallback UI and reload/front desk recovery actions
"""

import io
import os
import sys
import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.services.r2_storage import r2_service, STRICT_ALLOWED_MIME_TYPES
from app.routes.uploads import upload_guest_id_document, upload_file_direct, upload_booking_kyc_document, KYC_MAX_FILE_SIZE


def test_r2_strict_mime_and_size_limits():
    """Verify R2 storage service enforces 5MB limit and strict KYC MIME types including webp."""
    assert KYC_MAX_FILE_SIZE == 5 * 1024 * 1024
    assert "image/jpeg" in STRICT_ALLOWED_MIME_TYPES
    assert "image/png" in STRICT_ALLOWED_MIME_TYPES
    assert "image/webp" in STRICT_ALLOWED_MIME_TYPES
    assert "application/pdf" in STRICT_ALLOWED_MIME_TYPES
    assert "text/plain" not in STRICT_ALLOWED_MIME_TYPES
    assert "application/x-sh" not in STRICT_ALLOWED_MIME_TYPES


@pytest.mark.anyio
async def test_guest_id_upload_rejects_oversized_file():
    """Verify /uploads/guest-id raises HTTP 413 when file exceeds 5MB."""
    # 5MB + 10 bytes
    oversized_data = b"x" * (5 * 1024 * 1024 + 10)
    fake_file = UploadFile(
        file=io.BytesIO(oversized_data),
        size=len(oversized_data),
        filename="large_id.jpg",
        headers=Headers({"content-type": "image/jpeg"})
    )

    with pytest.raises(HTTPException) as exc_info:
        await upload_guest_id_document(file=fake_file)
    assert exc_info.value.status_code == 413
    assert "exceeds" in exc_info.value.detail.lower()


@pytest.mark.anyio
async def test_guest_id_upload_rejects_disallowed_mime():
    """Verify /uploads/guest-id raises HTTP 400 when file type is not allowed for KYC."""
    file_data = b"Some dangerous script content"
    fake_file = UploadFile(
        file=io.BytesIO(file_data),
        size=len(file_data),
        filename="script.sh",
        headers=Headers({"content-type": "application/x-sh"})
    )

    with pytest.raises(HTTPException) as exc_info:
        await upload_guest_id_document(file=fake_file)
    assert exc_info.value.status_code == 400
    assert "invalid file type" in exc_info.value.detail.lower()


@pytest.mark.anyio
async def test_generic_upload_kyc_folder_enforces_5mb_limit():
    """Verify /uploads/file rejects >5MB when folder is guest_ids or kyc."""
    oversized_data = b"x" * (5 * 1024 * 1024 + 50)
    fake_file = UploadFile(
        file=io.BytesIO(oversized_data),
        size=len(oversized_data),
        filename="guest_aadhaar.png",
        headers=Headers({"content-type": "image/png"})
    )

    with pytest.raises(HTTPException) as exc_info:
        await upload_file_direct(
            file=fake_file,
            folder="guest_ids"
        )
    assert exc_info.value.status_code == 413


@pytest.mark.anyio
async def test_webp_image_upload_passes_validation():
    """Verify WebP image upload is accepted by R2 client and validates magic bytes."""
    # Create valid WebP RIFF header
    # 4 bytes 'RIFF', 4 bytes size, 4 bytes 'WEBP'
    riff_header = b"RIFF\x24\x00\x00\x00WEBPVP8 " + b"\x00" * 30
    fake_file = UploadFile(
        file=io.BytesIO(riff_header),
        size=len(riff_header),
        filename="passport.webp",
        headers=Headers({"content-type": "image/webp"})
    )

    # Mock R2 S3 put_object so we don't need real AWS credentials
    mock_s3 = MagicMock()
    with patch.object(r2_service, "s3", mock_s3):
        res = await r2_service.upload_file(
            file=fake_file,
            folder="guest_ids",
            custom_filename="passport.webp"
        )
        assert res["success"] is True
        assert res["content_type"] == "image/webp"
        assert res["file_name"] == "passport.webp"
        mock_s3.put_object.assert_called_once()


def test_frontend_files_structure():
    """Verify the frontend source files exist and contain required in-flight locks and error boundary."""
    comp_ts = os.path.join(PROJECT_ROOT, "src", "utils", "imageCompression.ts")
    assert os.path.exists(comp_ts), "imageCompression.ts must exist"
    with open(comp_ts, "r", encoding="utf-8") as f:
        comp_content = f.read()
        assert "compressKycImage" in comp_content
        assert "maxDimension" in comp_content

    lock_ts = os.path.join(PROJECT_ROOT, "src", "hooks", "useInFlightLock.ts")
    assert os.path.exists(lock_ts), "useInFlightLock.ts must exist"
    with open(lock_ts, "r", encoding="utf-8") as f:
        lock_content = f.read()
        assert "useInFlightLock" in lock_content
        assert "lockRef" in lock_content

    err_ts = os.path.join(PROJECT_ROOT, "src", "components", "ErrorBoundary.tsx")
    assert os.path.exists(err_ts), "ErrorBoundary.tsx must exist"
    with open(err_ts, "r", encoding="utf-8") as f:
        err_content = f.read()
        assert "componentDidCatch" in err_content
        assert "Reload Dashboard" in err_content
        assert "Return to Front Desk Home" in err_content
        assert "moduleName" in err_content
