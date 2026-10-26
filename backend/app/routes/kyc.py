import re
from fastapi import APIRouter, HTTPException, Depends
from app.schemas import DecentroGstinVerifyRequest, DecentroGstinVerifyResponse
from app.services.decentro_client import decentro_client, logger

router = APIRouter(tags=["Decentro KYC"])

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
