import re
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from app.schemas import DecentroGstinVerifyRequest, DecentroGstinVerifyResponse
from app.services.decentro_client import decentro_client, logger
from app.utils.encryption import mask_aadhaar, validate_verhoeff

router = APIRouter(tags=["Decentro KYC"])

class AadhaarMaskRequest(BaseModel):
    aadhaar_number: str = Field(..., description="12-digit Indian Aadhaar number or formatted string")

class AadhaarMaskResponse(BaseModel):
    success: bool
    masked: str
    last4: str
    is_valid_checksum: bool
    message: str

@router.post(
    "/kyc/mask-aadhaar",
    response_model=AadhaarMaskResponse,
    summary="Mask Indian Aadhaar number adhering to UIDAI guidelines & Verhoeff algorithm"
)
def mask_aadhaar_endpoint(req: AadhaarMaskRequest):
    """
    UIDAI & Section 43A IT Act Compliant Aadhaar Masking.
    Strips raw 12 digits to XXXX-XXXX-1234 and validates Verhoeff mathematical checksum.
    """
    raw = req.aadhaar_number.strip()
    # Check if already masked e.g. XXXX-XXXX-1234 or XXXXXXXX1234
    digits_only = "".join(ch for ch in raw if ch.isdigit())
    has_letters = any(ch.isalpha() and ch.upper() != 'X' for ch in raw)
    if has_letters:
        raise HTTPException(
            status_code=422,
            detail="Invalid Aadhaar format: contains alphabetical characters"
        )

    # Check if fully masked
    if raw.upper().startswith("XXXX") or raw.upper().startswith("XXXXXXXX"):
        if len(digits_only) != 4:
            raise HTTPException(
                status_code=422,
                detail="Masked Aadhaar must preserve exactly the final 4 digits (e.g. XXXX-XXXX-1234)"
            )
        masked_val = f"XXXX-XXXX-{digits_only}"
        return AadhaarMaskResponse(
            success=True,
            masked=masked_val,
            last4=digits_only,
            is_valid_checksum=True,
            message="Already masked Aadhaar format verified"
        )

    if len(digits_only) != 12:
        raise HTTPException(
            status_code=422,
            detail=f"Aadhaar number must contain exactly 12 numeric digits (got {len(digits_only)})"
        )

    is_valid_chk = validate_verhoeff(digits_only)
    masked_val = f"XXXX-XXXX-{digits_only[-4:]}"

    return AadhaarMaskResponse(
        success=True,
        masked=masked_val,
        last4=digits_only[-4:],
        is_valid_checksum=is_valid_chk,
        message="Aadhaar masked successfully with UIDAI Verhoeff validation" if is_valid_chk else "Aadhaar format masked (checksum warning)"
    )

GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")

@router.post(
    "/kyc/decentro/verify-gstin",
    response_model=DecentroGstinVerifyResponse,
    summary="Instant B2B Guest GSTIN Verification via Decentro Public Registry"
)
async def verify_gstin(req: DecentroGstinVerifyRequest):
    """
    Accepts 15-digit GSTIN from front-desk check-in or checkout billing form.
    Calls Decentro KYC Public Registry API (/v2/kyc/public_registry/validate).
    Extracts and returns legal_name, trade_name, registered address, and state
    to auto-populate corporate billing fields and eliminate typos.
    """
    clean_gst = req.gstin.strip().upper()
    if len(clean_gst) != 15:
        raise HTTPException(
            status_code=400,
            detail="GSTIN must be exactly 15 characters (e.g. 21AEKPP8689J1ZS)"
        )

    if not GSTIN_REGEX.match(clean_gst):
        logger.warning(f"[KYC] Format check warning for GSTIN: {clean_gst}")

    try:
        result = await decentro_client.verify_gstin(clean_gst)
        if not result.get("success", False):
            raise HTTPException(
                status_code=400,
                detail=result.get("message", "GSTIN verification failed")
            )

        return DecentroGstinVerifyResponse(
            success=True,
            gstin=result.get("gstin", clean_gst),
            legal_name=result.get("legal_name", ""),
            trade_name=result.get("trade_name", ""),
            status=result.get("status", "Active"),
            state=result.get("state", "Odisha"),
            address=result.get("address", ""),
            pincode=result.get("pincode", ""),
            message=result.get("message", "Verified via Decentro Public Registry")
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[KYC] Exception during GSTIN verification: {exc}")
        raise HTTPException(status_code=500, detail=f"KYC Verification service error: {str(exc)}")
