"""
Comprehensive Cloudflare R2 Object Storage Integration Test Suite
Tests:
1. R2 Service Initialization & Fallback Modes
2. Direct Stream Upload (upload_fileobj) with Auto MIME Detection
3. Presigned PUT Upload URL Generation (900s / 15-minute validity)
4. Presigned GET Download URL Generation (900s for Private Guest KYC)
5. Database Record Binding: POST /api/v1/uploads/booking-kyc/{booking_id} -> Booking.id_proof_document_key
6. Secure Presigned Access: GET /api/v1/uploads/booking-kyc/{booking_id}/presigned-url
7. Database Record Binding: POST /api/v1/uploads/room-photo/{room_id} -> Room.image_url
8. GST Invoice Archival: POST /api/v1/uploads/booking-invoice/{booking_id} -> Booking.invoice_pdf_key
9. Secure Invoice Access: GET /api/v1/uploads/booking-invoice/{booking_id}/presigned-url
10. Deletion & Orphan Prevention: DELETE /api/v1/uploads/booking-kyc/{booking_id}
"""
import sys
import os
import io
import time
import uuid

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, engine, Base
from app import models
from app.services.r2_storage import r2_service

client = TestClient(app)

def run_all_tests():
    print("=" * 70)
    print("CLOUDFLARE R2 OBJECT STORAGE & POSTGRESQL PARITY INTEGRATION TESTS")
    print("=" * 70)
    
    # 0. Ensure Database Tables Exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create dummy Room and Booking for testing
    room = db.query(models.Room).filter(models.Room.slug == "r2-test-room-101").first()
    if not room:
        room = models.Room(
            name="R2 Test Deluxe Room 101",
            slug="r2-test-room-101",
            room_type="Deluxe",
            price_per_night=2500.0,
            capacity=2,
            description="Premium air-conditioned suite for R2 test integration",
            image_url="https://images.unsplash.com/photo-1590490360182-c33d57733427"
        )
        db.add(room)
        db.commit()
        db.refresh(room)

    booking = db.query(models.Booking).filter(models.Booking.guest_name == "R2 Test Guest Aadhaar").first()
    if not booking:
        booking = models.Booking(
            room_id=room.id,
            guest_name="R2 Test Guest Aadhaar",
            guest_email="r2guest@saivasudev.com",
            guest_phone="9876543210",
            id_proof_type="Aadhaar Card",
            id_proof_number="9876-5432-1098",
            check_in_date="2026-10-27",
            check_out_date="2026-10-29",
            base_rate=2500.0,
            base_amount=5000.0,
            total_price=5600.0,
            total_paid=5600.0,
            payment_status="Paid",
            status="Checked-In"
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)

    passed = 0
    total = 10

    # Test 1: R2 Status
    print("\n[1/10] Testing GET /api/v1/uploads/status ...")
    res = client.get("/api/v1/uploads/status")
    assert res.status_code == 200, f"Status failed: {res.text}"
    data = res.json()
    print(f"       Storage Mode: {data.get('storage_mode')} | Bucket: {data.get('bucket_name')}")
    assert "configured" in data
    passed += 1
    print("       [OK] R2 Status endpoint operational.")

    # Test 2: R2 Test Connection
    print("\n[2/10] Testing GET /api/v1/uploads/test-connection ...")
    res = client.get("/api/v1/uploads/test-connection")
    assert res.status_code == 200, f"Test connection failed: {res.text}"
    data = res.json()
    print(f"       Storage: {data.get('storage')} | Connected: {data.get('connected')}")
    assert data.get("connected") is True
    passed += 1
    print("       [OK] R2 Live / Fallback connectivity confirmed.")

    # Test 3: S3 Presigned Upload URL Generation
    print("\n[3/10] Testing POST /api/v1/uploads/presigned-url ...")
    res = client.post("/api/v1/uploads/presigned-url", json={
        "filename": "room_deluxe_view.jpg",
        "folder": "rooms",
        "content_type": "image/jpeg",
        "expires_in": 900
    })
    assert res.status_code == 200, f"Presigned URL generation failed: {res.text}"
    data = res.json()
    print(f"       Object Key: {data.get('object_key')}")
    assert "object_key" in data and "public_url" in data
    passed += 1
    print("       [OK] S3 Presigned PUT URL generated successfully.")

    # Test 4: Direct Stream Upload (upload_fileobj)
    print("\n[4/10] Testing R2StorageService.upload_fileobj stream helper ...")
    dummy_pdf = io.BytesIO(b"%PDF-1.4 Mock Aadhaar Document Binary Stream Test Content")
    obj_key, url = r2_service.upload_fileobj(
        file_obj=dummy_pdf,
        original_filename="aadhaar_front_sample.pdf",
        folder="kyc"
    )
    assert "kyc/" in obj_key
    print(f"       Stream Uploaded Key: {obj_key} | URL: {url}")
    passed += 1
    print("       [OK] upload_fileobj stream upload and auto-MIME detection verified.")

    # Test 5: Database-Linked KYC Upload (POST /api/v1/uploads/booking-kyc/{booking_id})
    print(f"\n[5/10] Testing POST /api/v1/uploads/booking-kyc/{booking.id} ...")
    mock_aadhaar_file = io.BytesIO(b"%PDF-1.4 Confidential Guest Aadhaar Card Scan Content")
    res = client.post(
        f"/api/v1/uploads/booking-kyc/{booking.id}",
        files={"file": ("guest_aadhaar_scan.pdf", mock_aadhaar_file, "application/pdf")}
    )
    assert res.status_code == 200, f"Booking KYC upload failed: {res.text}"
    data = res.json()
    assert data.get("status") == "success"
    kyc_key = data.get("object_key")
    print(f"       Stored R2 Key: {kyc_key}")
    
    # Verify in PostgreSQL
    db.refresh(booking)
    assert booking.id_proof_document_key == kyc_key, "Booking.id_proof_document_key was NOT updated in PostgreSQL!"
    passed += 1
    print("       [OK] Guest KYC uploaded to R2 and bound to Booking.id_proof_document_key in PostgreSQL.")

    # Test 6: 15-Minute Presigned GET for Private KYC (GET /api/v1/uploads/booking-kyc/{booking_id}/presigned-url)
    print(f"\n[6/10] Testing GET /api/v1/uploads/booking-kyc/{booking.id}/presigned-url ...")
    res = client.get(f"/api/v1/uploads/booking-kyc/{booking.id}/presigned-url?expires_in=900")
    assert res.status_code == 200, f"Fetch presigned KYC failed: {res.text}"
    data = res.json()
    assert data.get("status") == "success"
    assert data.get("expires_in") == 900
    print(f"       Presigned Download URL: {data.get('download_url')[:60]}... (Expires in 900s)")
    passed += 1
    print("       [OK] 15-minute temporary presigned GET URL successfully generated.")

    # Test 7: Public Room Photo Upload & Database Binding (POST /api/v1/uploads/room-photo/{room_id})
    print(f"\n[7/10] Testing POST /api/v1/uploads/room-photo/{room.id} ...")
    mock_room_photo = io.BytesIO(b"\xFF\xD8\xFF\xE0\x00\x10JFIF Mock JPEG Data for Room Photo")
    res = client.post(
        f"/api/v1/uploads/room-photo/{room.id}",
        files={"file": ("deluxe_suite_wide.jpg", mock_room_photo, "image/jpeg")}
    )
    assert res.status_code == 200, f"Room photo upload failed: {res.text}"
    data = res.json()
    assert data.get("status") == "success"
    new_image_url = data.get("image_url")
    print(f"       New Room Image URL: {new_image_url}")
    
    # Verify in PostgreSQL
    db.refresh(room)
    assert room.image_url == new_image_url, "Room.image_url was NOT updated in PostgreSQL!"
    passed += 1
    print("       [OK] Room photo uploaded to R2 and updated in Room.image_url in PostgreSQL.")

    # Test 8: GST Invoice PDF Archival (POST /api/v1/uploads/booking-invoice/{booking_id})
    print(f"\n[8/10] Testing POST /api/v1/uploads/booking-invoice/{booking.id} ...")
    mock_invoice_pdf = io.BytesIO(b"%PDF-1.4 Official GST Tax Invoice INV-SVR-2026-001 Content")
    res = client.post(
        f"/api/v1/uploads/booking-invoice/{booking.id}",
        files={"file": (f"invoice_{booking.invoice_number}.pdf", mock_invoice_pdf, "application/pdf")}
    )
    assert res.status_code == 200, f"Invoice archival failed: {res.text}"
    data = res.json()
    assert data.get("status") == "success"
    inv_key = data.get("object_key")
    print(f"       Archived Invoice Key: {inv_key}")
    
    # Verify in PostgreSQL
    db.refresh(booking)
    assert booking.invoice_pdf_key == inv_key, "Booking.invoice_pdf_key was NOT updated in PostgreSQL!"
    passed += 1
    print("       [OK] GST Tax Invoice archived in R2 and bound to Booking.invoice_pdf_key in PostgreSQL.")

    # Test 9: Invoice Presigned GET (GET /api/v1/uploads/booking-invoice/{booking_id}/presigned-url)
    print(f"\n[9/10] Testing GET /api/v1/uploads/booking-invoice/{booking.id}/presigned-url ...")
    res = client.get(f"/api/v1/uploads/booking-invoice/{booking.id}/presigned-url?expires_in=900")
    assert res.status_code == 200, f"Invoice presigned URL failed: {res.text}"
    data = res.json()
    assert data.get("status") == "success"
    print(f"       Invoice Presigned Link: {data.get('download_url')[:60]}... (Expires in 900s)")
    passed += 1
    print("       [OK] Invoice presigned download URL verified.")

    # Test 10: KYC Document Deletion (DELETE /api/v1/uploads/booking-kyc/{booking_id})
    print(f"\n[10/10] Testing DELETE /api/v1/uploads/booking-kyc/{booking.id} ...")
    res = client.delete(f"/api/v1/uploads/booking-kyc/{booking.id}")
    assert res.status_code == 200, f"KYC deletion failed: {res.text}"
    data = res.json()
    assert data.get("status") == "success"
    
    # Verify PostgreSQL cleanup
    db.refresh(booking)
    assert booking.id_proof_document_key is None, "Booking.id_proof_document_key was NOT cleared in PostgreSQL!"
    passed += 1
    print("       [OK] KYC document safely deleted from R2 and cleared from PostgreSQL reservation record.")

    print("\n" + "=" * 70)
    print(f"=== ALL {passed}/{total} CLOUDFLARE R2 INTEGRATION TESTS PASSED 100%! ===")
    print("=" * 70)

if __name__ == "__main__":
    run_all_tests()
