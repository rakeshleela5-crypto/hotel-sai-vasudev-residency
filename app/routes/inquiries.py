from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/inquiries", tags=["Inquiries"])

ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")

def mask_email(email: str) -> str:
    if not email or "@" not in email:
        return "***"
    parts = email.split("@")
    user, domain = parts[0], parts[1]
    masked_user = user[0] + "***" + user[-1] if len(user) > 2 else user[0] + "***"
    return f"{masked_user}@{domain}"

def mask_phone(phone: str) -> str:
    if not phone or len(phone) < 4:
        return "***"
    return phone[:2] + "******" + phone[-2:]

@router.post("", response_model=schemas.InquiryResponse, status_code=201)
def submit_inquiry(payload: schemas.InquiryCreate, db: Session = Depends(get_db)):
    """Submit a guest inquiry or special request with length sanitization"""
    inquiry = models.Inquiry(
        name=payload.name.strip()[:100],
        email=payload.email.strip().lower()[:150],
        phone=payload.phone.strip()[:20],
        subject=(payload.subject or "Pilgrimage Stay Inquiry").strip()[:200],
        message=payload.message.strip()[:2000]
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    return inquiry

@router.get("", response_model=List[schemas.InquiryResponse])
def get_inquiries(
    limit: int = Query(50, le=100), 
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db)
):
    """
    List customer inquiries. Masks guest PII (phone/email) for privacy
    unless an authorized admin API key is provided.
    """
    inquiries = db.query(models.Inquiry).order_by(models.Inquiry.created_at.desc()).limit(limit).all()
    
    is_authorized = bool(ADMIN_API_KEY and x_api_key == ADMIN_API_KEY)
    if is_authorized:
        return inquiries

    # Return privacy-masked copies to prevent unauthorized harvest of guest contact info
    return [
        schemas.InquiryResponse(
            id=inq.id,
            name=inq.name,
            email=mask_email(inq.email),
            phone=mask_phone(inq.phone),
            subject=inq.subject,
            message=inq.message,
            created_at=inq.created_at
        )
        for inq in inquiries
    ]
