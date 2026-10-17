from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/inquiries", tags=["Inquiries"])

@router.post("", response_model=schemas.InquiryResponse, status_code=201)
def submit_inquiry(payload: schemas.InquiryCreate, db: Session = Depends(get_db)):
    """Submit a guest inquiry or special request"""
    inquiry = models.Inquiry(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        subject=payload.subject,
        message=payload.message
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    return inquiry

@router.get("", response_model=List[schemas.InquiryResponse])
def get_inquiries(limit: int = 50, db: Session = Depends(get_db)):
    """List customer inquiries"""
    return db.query(models.Inquiry).order_by(models.Inquiry.created_at.desc()).limit(limit).all()
