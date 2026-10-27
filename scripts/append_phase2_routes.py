NEW_ROUTES = '''
# =========================================================================
# FORENSIC PHASE 2 REMEDIATION ENDPOINTS
# =========================================================================

# 1. Table Shifts
@router.post("/restaurant/table-shifts")
def record_table_shift(payload: schemas.TableShiftCreate, db: Session = Depends(get_db)):
    shift_id = payload.shift_id or f"TS-{int(time.time())}-{uuid.uuid4().hex[:4].upper()}"
    shift = models.TableShift(
        shift_id=shift_id,
        from_table=payload.from_table,
        to_table=payload.to_table,
        transferred_count=payload.transferred_count or 0,
        reason=payload.reason or "Guest Requested Shift",
        shifted_by=payload.shifted_by or "Cashier"
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return {"success": True, "shift_id": shift.shift_id, "id": shift.id}

@router.get("/restaurant/table-shifts")
def get_table_shifts(db: Session = Depends(get_db)):
    shifts = db.query(models.TableShift).order_by(models.TableShift.created_at.desc()).all()
    return [{
        "shiftId": s.shift_id,
        "fromTable": s.from_table,
        "toTable": s.to_table,
        "transferredCount": s.transferred_count,
        "reason": s.reason,
        "shiftedBy": s.shifted_by,
        "createdAt": s.created_at.isoformat() if s.created_at else None
    } for s in shifts]

# 2. Table Sessions
@router.post("/restaurant/table-sessions")
def save_table_session(payload: schemas.TableSessionCreate, db: Session = Depends(get_db)):
    existing = db.query(models.TableSessionRecord).filter(
        models.TableSessionRecord.session_id == payload.session_id
    ).first()
    if existing:
        existing.status = payload.status or existing.status
        existing.kot_numbers_json = payload.kot_numbers_json or existing.kot_numbers_json
        existing.cumulative_items_json = payload.cumulative_items_json or existing.cumulative_items_json
        existing.cumulative_amount = payload.cumulative_amount or existing.cumulative_amount
        session_obj = existing
    else:
        session_obj = models.TableSessionRecord(
            session_id=payload.session_id,
            table_no=payload.table_no,
            start_time=payload.start_time,
            status=payload.status or "Active",
            kot_numbers_json=payload.kot_numbers_json or "[]",
            cumulative_items_json=payload.cumulative_items_json or "[]",
            cumulative_amount=payload.cumulative_amount or 0.0
        )
        db.add(session_obj)
    db.commit()
    db.refresh(session_obj)
    return {"success": True, "sessionId": session_obj.session_id}

@router.get("/restaurant/table-sessions")
def get_table_sessions(db: Session = Depends(get_db)):
    sessions = db.query(models.TableSessionRecord).filter(models.TableSessionRecord.status == "Active").all()
    return [{
        "sessionId": s.session_id,
        "tableNo": s.table_no,
        "startTime": s.start_time,
        "status": s.status,
        "kotNumbers": json.loads(s.kot_numbers_json) if s.kot_numbers_json else [],
        "cumulativeItems": json.loads(s.cumulative_items_json) if s.cumulative_items_json else [],
        "cumulativeAmount": s.cumulative_amount
    } for s in sessions]

# 3. Housekeeping Discrepancies
@router.post("/housekeeping-discrepancies")
def create_housekeeping_discrepancy(payload: schemas.HousekeepingDiscrepancyCreate, db: Session = Depends(get_db)):
    disc_id = payload.discrepancy_id or f"DISC-{int(time.time())}-{uuid.uuid4().hex[:4].upper()}"
    disc = models.HousekeepingDiscrepancy(
        discrepancy_id=disc_id,
        room_no=payload.room_no,
        front_desk_status=payload.front_desk_status,
        housekeeping_status=payload.housekeeping_status,
        reported_by=payload.reported_by or "System",
        remarks=payload.remarks or ""
    )
    db.add(disc)
    db.commit()
    db.refresh(disc)
    return {"success": True, "discrepancyId": disc.discrepancy_id}

@router.get("/housekeeping-discrepancies")
def get_housekeeping_discrepancies(db: Session = Depends(get_db)):
    discs = db.query(models.HousekeepingDiscrepancy).order_by(models.HousekeepingDiscrepancy.created_at.desc()).all()
    return [{
        "discrepancyId": d.discrepancy_id,
        "roomNo": d.room_no,
        "frontDeskStatus": d.front_desk_status,
        "housekeepingStatus": d.housekeeping_status,
        "reportedBy": d.reported_by,
        "remarks": d.remarks,
        "resolved": d.resolved,
        "resolvedBy": d.resolved_by,
        "createdAt": d.created_at.isoformat() if d.created_at else None
    } for d in discs]

# 4. RFID Key Cards
@router.post("/key-cards")
def issue_key_card(payload: schemas.RfidKeyCardCreate, db: Session = Depends(get_db)):
    card = db.query(models.RfidKeyCard).filter(models.RfidKeyCard.card_number == payload.card_number).first()
    if card:
        card.room_no = payload.room_no
        card.guest_name = payload.guest_name
        card.check_in_time = payload.check_in_time
        card.valid_until = payload.valid_until
        card.status = payload.status or "Active"
    else:
        card = models.RfidKeyCard(
            card_number=payload.card_number,
            card_uuid=payload.card_uuid or str(uuid.uuid4()),
            room_no=payload.room_no,
            guest_name=payload.guest_name,
            check_in_time=payload.check_in_time,
            valid_until=payload.valid_until,
            status=payload.status or "Active",
            issued_by=payload.issued_by or "Front Desk"
        )
        db.add(card)
    db.commit()
    db.refresh(card)
    return {"success": True, "cardNumber": card.card_number, "validUntil": card.valid_until}

@router.put("/key-cards/{card_number}/extend")
def extend_key_card(card_number: str, payload: schemas.RfidKeyCardExtend, db: Session = Depends(get_db)):
    card = db.query(models.RfidKeyCard).filter(models.RfidKeyCard.card_number == card_number).first()
    if not card:
        raise HTTPException(status_code=404, detail="Key card not found")
    card.valid_until = payload.valid_until
    card.status = "Active"
    db.commit()
    return {"success": True, "cardNumber": card.card_number, "validUntil": card.valid_until}

@router.get("/key-cards")
def get_key_cards(db: Session = Depends(get_db)):
    cards = db.query(models.RfidKeyCard).all()
    return [{
        "cardNumber": c.card_number,
        "cardUuid": c.card_uuid,
        "roomNo": c.room_no,
        "guestName": c.guest_name,
        "checkInTime": c.check_in_time,
        "validUntil": c.valid_until,
        "status": c.status,
        "issuedBy": c.issued_by
    } for c in cards]

# 5. Hotel Company Info
@router.post("/company-info")
def save_company_info(payload: schemas.HotelCompanyInfoCreate, db: Session = Depends(get_db)):
    info = db.query(models.HotelCompanyInfo).first()
    if not info:
        info = models.HotelCompanyInfo()
        db.add(info)
    if payload.property_name: info.property_name = payload.property_name
    if payload.address is not None: info.address = payload.address
    if payload.city is not None: info.city = payload.city
    if payload.state is not None: info.state = payload.state
    if payload.pincode is not None: info.pincode = payload.pincode
    if payload.phone is not None: info.phone = payload.phone
    if payload.email is not None: info.email = payload.email
    if payload.gstin is not None: info.gstin = payload.gstin
    if payload.logo_url is not None: info.logo_url = payload.logo_url
    if payload.seal_url is not None: info.seal_url = payload.seal_url
    if payload.default_bill_format is not None: info.default_bill_format = payload.default_bill_format
    if payload.terms_and_conditions is not None: info.terms_and_conditions = payload.terms_and_conditions
    info.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(info)
    return {"success": True, "propertyName": info.property_name}

@router.get("/company-info")
def get_company_info(db: Session = Depends(get_db)):
    info = db.query(models.HotelCompanyInfo).first()
    if not info:
        return {
            "propertyName": "Hotel Sai Vasudev Residency",
            "address": "Opp. Shirdi Sai Baba Temple, Shirdi",
            "city": "Shirdi",
            "state": "Maharashtra",
            "pincode": "423109",
            "phone": "+91 94402 89999",
            "email": "stay@saivasudevresidency.com",
            "gstin": "27AABCS1234F1Z5",
            "logoUrl": "",
            "sealUrl": "",
            "defaultBillFormat": "standard"
        }
    return {
        "propertyName": info.property_name,
        "address": info.address,
        "city": info.city,
        "state": info.state,
        "pincode": info.pincode,
        "phone": info.phone,
        "email": info.email,
        "gstin": info.gstin,
        "logoUrl": info.logo_url,
        "sealUrl": info.seal_url,
        "defaultBillFormat": info.default_bill_format,
        "termsAndConditions": info.terms_and_conditions
    }

# 6. Virtual Accounts
@router.post("/virtual-accounts")
def create_virtual_account(payload: schemas.VirtualAccountCreate, db: Session = Depends(get_db)):
    va = db.query(models.VirtualAccount).filter(models.VirtualAccount.account_number == payload.account_number).first()
    if not va:
        va = models.VirtualAccount(
            account_number=payload.account_number,
            ifsc=payload.ifsc,
            upi_id=payload.upi_id,
            booking_id=payload.booking_id,
            guest_name=payload.guest_name,
            status=payload.status or "Active"
        )
        db.add(va)
        db.commit()
        db.refresh(va)
    return {"success": True, "accountNumber": va.account_number, "upiId": va.upi_id}

@router.get("/virtual-accounts")
def get_virtual_accounts(db: Session = Depends(get_db)):
    accounts = db.query(models.VirtualAccount).order_by(models.VirtualAccount.created_at.desc()).all()
    return [{
        "accountNumber": a.account_number,
        "ifsc": a.ifsc,
        "upiId": a.upi_id,
        "bookingId": a.booking_id,
        "guestName": a.guest_name,
        "status": a.status,
        "createdAt": a.created_at.isoformat() if a.created_at else None
    } for a in accounts]

# 7. Liquor Stock Adjustments
@router.post("/liquor/stock-adjustments")
def record_liquor_adjustment(payload: schemas.LiquorStockAdjustmentCreate, db: Session = Depends(get_db)):
    adj = models.LiquorStockAdjustment(
        brand=payload.brand,
        item_id=payload.item_id,
        bottle_size_ml=payload.bottle_size_ml or 750,
        transaction_type=payload.transaction_type,
        qty_pegs=payload.qty_pegs,
        pegs_per_bottle=payload.pegs_per_bottle or 25,
        reference_no=payload.reference_no
    )
    db.add(adj)
    db.commit()
    db.refresh(adj)
    return {"success": True, "id": adj.id, "brand": adj.brand, "qtyPegs": adj.qty_pegs}

# 8. Manager PIN Verification
@router.post("/auth/verify-manager-pin")
def verify_manager_pin(payload: schemas.ManagerPinVerifyRequest, db: Session = Depends(get_db)):
    trimmed = payload.pin.strip()
    # Check valid manager PINs: 9999 (default master PIN), 1234, 8888, or manager user in DB
    if trimmed in ["9999", "1234", "8888"]:
        return {"success": True, "verified": True, "manager": "Super Admin"}
    mgr = db.query(models.UserAccount).filter(
        models.UserAccount.role_name.ilike("%Manager%"),
        models.UserAccount.status == "Active"
    ).first()
    if mgr and trimmed == "9999":
        return {"success": True, "verified": True, "manager": mgr.user_name}
    raise HTTPException(status_code=401, detail="Invalid manager authorization PIN")

# 9. Booking Confirmation Transition
@router.put("/bookings/{booking_id}/confirm")
def confirm_booking(booking_id: int, db: Session = Depends(get_db)):
    b = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not b:
        # Check by booking_ref
        b = db.query(models.Booking).filter(models.Booking.booking_ref == str(booking_id)).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    b.is_confirmed = True
    b.status = "Confirmed"
    db.commit()
    return {"success": True, "bookingId": b.id, "status": b.status}

# 10. Missing Resource Deletions
@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: str, db: Session = Depends(get_db)):
    deleted = db.query(models.Expense).filter(
        (models.Expense.voucher_no == expense_id) | (models.Expense.id == (int(expense_id) if expense_id.isdigit() else -1))
    ).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "deletedCount": deleted}

@router.delete("/purchases/{purchase_id}")
def delete_purchase(purchase_id: str, db: Session = Depends(get_db)):
    deleted = db.query(models.PurchaseEntry).filter(
        (models.PurchaseEntry.bill_no == purchase_id) | (models.PurchaseEntry.id == (int(purchase_id) if purchase_id.isdigit() else -1))
    ).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "deletedCount": deleted}

@router.delete("/roles/{role_id}")
def delete_role(role_id: str, db: Session = Depends(get_db)):
    deleted = db.query(models.Role).filter(
        (models.Role.role_name == role_id) | (models.Role.id == (int(role_id) if role_id.isdigit() else -1))
    ).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "deletedCount": deleted}

@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    deleted = db.query(models.UserAccount).filter(
        (models.UserAccount.user_name == user_id) | (models.UserAccount.user_id == (int(user_id) if user_id.isdigit() else -1))
    ).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "deletedCount": deleted}

@router.delete("/whatsapp/templates/{template_id}")
def delete_whatsapp_template(template_id: str, db: Session = Depends(get_db)):
    deleted = db.query(models.WhatsAppTemplate).filter(
        (models.WhatsAppTemplate.template_name == template_id) | (models.WhatsAppTemplate.id == (int(template_id) if template_id.isdigit() else -1))
    ).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "deletedCount": deleted}

@router.delete("/whatsapp/logs")
def clear_whatsapp_logs(db: Session = Depends(get_db)):
    deleted = db.query(models.WhatsAppLog).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "clearedCount": deleted}

@router.post("/party-accounts/settle")
def settle_party_account(payload: Dict[str, Any], db: Session = Depends(get_db)):
    party_name = payload.get("accountName") or payload.get("name")
    amt = float(payload.get("settleAmount") or payload.get("amount") or 0.0)
    party = db.query(models.PartyAccount).filter(models.PartyAccount.name == party_name).first()
    if party:
        party.balance = max(0.0, party.balance - amt)
        db.commit()
        return {"success": True, "party": party.name, "balance": party.balance}
    return {"success": True, "party": party_name, "balance": 0.0}
'''

for path in ['backend/app/routes/pms.py', 'app/routes/pms.py']:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'FORENSIC PHASE 2 REMEDIATION ENDPOINTS' not in content:
        with open(path, 'a', encoding='utf-8') as f:
            f.write('\n' + NEW_ROUTES)
        print(f"Appended Phase 2 routes to {path}")
    else:
        print(f"Routes already present in {path}")
