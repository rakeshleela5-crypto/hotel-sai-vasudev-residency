"""
Module 3 & 4: Tiered Room Service Amenities and 18-Room QR Code Self-Service Orders.
Supports:
1. Tiered Room Service Amenities:
   - Deluxe & Classic Studio: General White Towels, Comforter, Duvet, Soaps, Shampoos.
   - Premium & Executive: Moisturizer, Shampoo, Toothbrush, Electric Kettle, Hair Dryer.
2. 18-Room QR Self-Service Orders:
   - Order food from Vasudev Rasoi or request tiered amenities.
   - Payment options: 'Transfer to Room Folio' or 'Immediate UPI/Card'.
   - Real-time notification trigger for Receptionist dashboard.
"""

import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import GuestRoomServiceOrder, Booking, RoomFolioItem, Room

router = APIRouter()

def now_utc():
    return datetime.now(timezone.utc)

# =========================================================================
# 18 ROOMS MASTER CONFIGURATION
# Ground Floor (101-107) + 1st Floor (201-211) = 18 Rooms
# =========================================================================
ROOMS_MASTER_DATA = [
    {"room_no": "101", "floor": 0, "room_type": "Deluxe", "tariff": 1500, "bed_type": "Single / Queen Size"},
    {"room_no": "102", "floor": 0, "room_type": "Deluxe", "tariff": 1500, "bed_type": "Queen Size"},
    {"room_no": "103", "floor": 0, "room_type": "Classic Studio", "tariff": 2000, "bed_type": "Queen Size"},
    {"room_no": "104", "floor": 0, "room_type": "Classic Studio", "tariff": 2000, "bed_type": "Queen Size"},
    {"room_no": "105", "floor": 0, "room_type": "Classic Studio", "tariff": 2000, "bed_type": "Queen Size"},
    {"room_no": "106", "floor": 0, "room_type": "Executive", "tariff": 2500, "bed_type": "King Size"},
    {"room_no": "107", "floor": 0, "room_type": "Executive", "tariff": 2500, "bed_type": "King Size"},
    {"room_no": "201", "floor": 1, "room_type": "Executive", "tariff": 2500, "bed_type": "King Size"},
    {"room_no": "202", "floor": 1, "room_type": "Deluxe", "tariff": 1500, "bed_type": "Single Bed"},
    {"room_no": "203", "floor": 1, "room_type": "Classic Studio", "tariff": 2000, "bed_type": "Queen Bed"},
    {"room_no": "204", "floor": 1, "room_type": "Classic Studio", "tariff": 2000, "bed_type": "Queen Bed"},
    {"room_no": "205", "floor": 1, "room_type": "Classic Studio", "tariff": 2000, "bed_type": "Queen Bed"},
    {"room_no": "206", "floor": 1, "room_type": "Executive", "tariff": 2500, "bed_type": "King Size"},
    {"room_no": "207", "floor": 1, "room_type": "Executive", "tariff": 2500, "bed_type": "King Size"},
    {"room_no": "208", "floor": 1, "room_type": "Executive", "tariff": 2500, "bed_type": "King Size"},
    {"room_no": "209", "floor": 1, "room_type": "Executive", "tariff": 2500, "bed_type": "King Size"},
    {"room_no": "210", "floor": 1, "room_type": "Premium", "tariff": 3000, "bed_type": "King Size"},
    {"room_no": "211", "floor": 1, "room_type": "Premium", "tariff": 3000, "bed_type": "King Size"}
]

# =========================================================================
# TIERED AMENITIES CONFIGURATION
# Deluxe & Classic Studio vs Premium & Executive
# =========================================================================
TIERED_AMENITIES_CONFIG = {
    "Deluxe": {
        "tier_name": "Standard Comfort Tier",
        "badge": "Deluxe / Classic Studio Tier",
        "description": "Essential fresh linens and cleansing amenities for Deluxe and Classic Studio rooms.",
        "amenities": [
            {
                "id": "amenity-wt",
                "name": "General White Towels",
                "description": "Freshly laundered, high-absorbency 100% cotton white bath & hand towels",
                "icon": "🛁",
                "is_complimentary": True,
                "max_qty": 4
            },
            {
                "id": "amenity-cf",
                "name": "Comforter",
                "description": "Plush all-season micro-fiber warm comforter with sanitised cover",
                "icon": "🛏️",
                "is_complimentary": True,
                "max_qty": 2
            },
            {
                "id": "amenity-dv",
                "name": "Duvet",
                "description": "Premium soft down-alternative duvet for air-conditioned room comfort",
                "icon": "🛋️",
                "is_complimentary": True,
                "max_qty": 2
            },
            {
                "id": "amenity-sp",
                "name": "Soaps",
                "description": "Herbal Ayurvedic sanitising bath & hand soap bars (Medimix / Mysore Sandal)",
                "icon": "🧼",
                "is_complimentary": True,
                "max_qty": 4
            },
            {
                "id": "amenity-sh",
                "name": "Shampoos",
                "description": "Gentle daily hair cleanser shampoo sachets with conditioner",
                "icon": "🧴",
                "is_complimentary": True,
                "max_qty": 4
            }
        ]
    },
    "Classic Studio": {
        "tier_name": "Standard Comfort Tier",
        "badge": "Deluxe / Classic Studio Tier",
        "description": "Essential fresh linens and cleansing amenities for Deluxe and Classic Studio rooms.",
        "amenities": [
            {
                "id": "amenity-wt",
                "name": "General White Towels",
                "description": "Freshly laundered, high-absorbency 100% cotton white bath & hand towels",
                "icon": "🛁",
                "is_complimentary": True,
                "max_qty": 4
            },
            {
                "id": "amenity-cf",
                "name": "Comforter",
                "description": "Plush all-season micro-fiber warm comforter with sanitised cover",
                "icon": "🛏️",
                "is_complimentary": True,
                "max_qty": 2
            },
            {
                "id": "amenity-dv",
                "name": "Duvet",
                "description": "Premium soft down-alternative duvet for air-conditioned room comfort",
                "icon": "🛋️",
                "is_complimentary": True,
                "max_qty": 2
            },
            {
                "id": "amenity-sp",
                "name": "Soaps",
                "description": "Herbal Ayurvedic sanitising bath & hand soap bars (Medimix / Mysore Sandal)",
                "icon": "🧼",
                "is_complimentary": True,
                "max_qty": 4
            },
            {
                "id": "amenity-sh",
                "name": "Shampoos",
                "description": "Gentle daily hair cleanser shampoo sachets with conditioner",
                "icon": "🧴",
                "is_complimentary": True,
                "max_qty": 4
            }
        ]
    },
    "Premium": {
        "tier_name": "Executive & Luxury Tier",
        "badge": "Premium / Executive Luxury Tier",
        "description": "Upgraded luxury personal care items and electric appliances for Premium & Executive rooms.",
        "amenities": [
            {
                "id": "amenity-mz",
                "name": "Moisturizer",
                "description": "Hydrating botanical body lotion / skin moisturizer bottle (Forest Essentials / Biotique)",
                "icon": "✨",
                "is_complimentary": True,
                "max_qty": 2
            },
            {
                "id": "amenity-sh-prem",
                "name": "Shampoo",
                "description": "Enriched nourishing herbal shampoo & scalp repair bottle",
                "icon": "🧴",
                "is_complimentary": True,
                "max_qty": 2
            },
            {
                "id": "amenity-tb",
                "name": "Toothbrush (Dental Kit)",
                "description": "Eco-friendly bamboo soft-bristle toothbrush with Colgate/Meswak herbal paste",
                "icon": "🪥",
                "is_complimentary": True,
                "max_qty": 4
            },
            {
                "id": "amenity-ek",
                "name": "Electric Kettle",
                "description": "In-room rapid boiling 1.5L electric kettle with tea/coffee/sugar/creamer sachets",
                "icon": "🫖",
                "is_complimentary": True,
                "max_qty": 1
            },
            {
                "id": "amenity-hd",
                "name": "Hair Dryer",
                "description": "1200W ionic dual-heat hair dryer with diffuser nozzle for rapid styling",
                "icon": "💨",
                "is_complimentary": True,
                "max_qty": 1
            }
        ]
    },
    "Executive": {
        "tier_name": "Executive & Luxury Tier",
        "badge": "Premium / Executive Luxury Tier",
        "description": "Upgraded luxury personal care items and electric appliances for Premium & Executive rooms.",
        "amenities": [
            {
                "id": "amenity-mz",
                "name": "Moisturizer",
                "description": "Hydrating botanical body lotion / skin moisturizer bottle (Forest Essentials / Biotique)",
                "icon": "✨",
                "is_complimentary": True,
                "max_qty": 2
            },
            {
                "id": "amenity-sh-prem",
                "name": "Shampoo",
                "description": "Enriched nourishing herbal shampoo & scalp repair bottle",
                "icon": "🧴",
                "is_complimentary": True,
                "max_qty": 2
            },
            {
                "id": "amenity-tb",
                "name": "Toothbrush (Dental Kit)",
                "description": "Eco-friendly bamboo soft-bristle toothbrush with Colgate/Meswak herbal paste",
                "icon": "🪥",
                "is_complimentary": True,
                "max_qty": 4
            },
            {
                "id": "amenity-ek",
                "name": "Electric Kettle",
                "description": "In-room rapid boiling 1.5L electric kettle with tea/coffee/sugar/creamer sachets",
                "icon": "🫖",
                "is_complimentary": True,
                "max_qty": 1
            },
            {
                "id": "amenity-hd",
                "name": "Hair Dryer",
                "description": "1200W ionic dual-heat hair dryer with diffuser nozzle for rapid styling",
                "icon": "💨",
                "is_complimentary": True,
                "max_qty": 1
            }
        ]
    },
    "Suite": {
        "tier_name": "Presidential Suite Tier",
        "badge": "Suite Luxury Tier",
        "description": "Complete all-inclusive suite package with luxury grooming and electric appliances.",
        "amenities": [
            {
                "id": "amenity-mz",
                "name": "Moisturizer",
                "description": "Hydrating botanical body lotion / skin moisturizer bottle",
                "icon": "✨",
                "is_complimentary": True,
                "max_qty": 2
            },
            {
                "id": "amenity-sh-prem",
                "name": "Shampoo",
                "description": "Enriched nourishing herbal shampoo & scalp repair bottle",
                "icon": "🧴",
                "is_complimentary": True,
                "max_qty": 2
            },
            {
                "id": "amenity-tb",
                "name": "Toothbrush (Dental Kit)",
                "description": "Eco-friendly bamboo soft-bristle toothbrush with herbal paste",
                "icon": "🪥",
                "is_complimentary": True,
                "max_qty": 4
            },
            {
                "id": "amenity-ek",
                "name": "Electric Kettle",
                "description": "In-room rapid boiling 1.5L electric kettle with tea/coffee/sugar/creamer sachets",
                "icon": "🫖",
                "is_complimentary": True,
                "max_qty": 1
            },
            {
                "id": "amenity-hd",
                "name": "Hair Dryer",
                "description": "1200W ionic dual-heat hair dryer with diffuser nozzle",
                "icon": "💨",
                "is_complimentary": True,
                "max_qty": 1
            }
        ]
    }
}

# =========================================================================
# VASUDEV RASOI DEFAULT FOOD MENU
# =========================================================================
DEFAULT_MENU_ITEMS = [
    # 1. Morning Breakfast
    {"id": "m-101", "name": "Rayagada Special Poha", "category": "Morning Breakfast (7:00 AM–10:30 AM)", "rate": 80, "is_veg": True, "description": "Tempered flattened rice with roasted peanuts, curry leaves & mustard"},
    {"id": "m-102", "name": "Steamed Idli Sambar (2 Pcs)", "category": "Morning Breakfast (7:00 AM–10:30 AM)", "rate": 90, "is_veg": True, "description": "Fluffy steamed rice-lentil cakes served with drumstick sambar & coconut chutney"},
    {"id": "m-103", "name": "Medu Vada Sambar (2 Pcs)", "category": "Morning Breakfast (7:00 AM–10:30 AM)", "rate": 110, "is_veg": True, "description": "Crispy golden lentil fritters with aromatic podi sambar"},
    {"id": "m-104", "name": "Special Masala Dosa", "category": "Morning Breakfast (7:00 AM–10:30 AM)", "rate": 130, "is_veg": True, "description": "Crispy golden crepe stuffed with spiced potato masala & pure butter"},
    {"id": "m-105", "name": "Poori Bhaji (4 Pcs)", "category": "Morning Breakfast (7:00 AM–10:30 AM)", "rate": 120, "is_veg": True, "description": "Puffed whole wheat pooris served with spiced aloo bhaji"},
    {"id": "m-106", "name": "Sabudana Khichdi (Upvas Special)", "category": "Morning Breakfast (7:00 AM–10:30 AM)", "rate": 110, "is_veg": True, "description": "Sago pearls sautéed with roasted peanuts, green chillies & sendha namak"},
    
    # 2. Sattvic & Jain Thalis
    {"id": "m-201", "name": "Sai Prasad Maha Thali (Pure Desi Ghee)", "category": "Sattvic & Jain Thalis", "rate": 280, "is_veg": True, "description": "Paneer curry, Dal Tadka, Seasonal Sabzi, 4 Ghee Phulkas, Jeera Rice, Gulab Jamun & Raita"},
    {"id": "m-202", "name": "Jain Special Thali (No Onion/Garlic)", "category": "Sattvic & Jain Thalis", "rate": 260, "is_veg": True, "description": "Prepared strictly according to Jain dietary rules without onion, garlic or root vegetables"},
    {"id": "m-203", "name": "Gujarati Sattvic Bhojan Thali", "category": "Sattvic & Jain Thalis", "rate": 240, "is_veg": True, "description": "Kadhi, Gujarati Dal, Sukhi Bhaji, Rotlis, Sweet Farsan & Khichdi"},
    {"id": "m-204", "name": "Temple Mini Prasad Thali", "category": "Sattvic & Jain Thalis", "rate": 180, "is_veg": True, "description": "Dal Fry, Mixed Veg, 3 Rotis, Steamed Rice & Kheer"},

    # 3. Main Course Curries
    {"id": "m-301", "name": "Paneer Butter Masala", "category": "Main Course Curries", "rate": 220, "is_veg": True, "description": "Fresh cottage cheese simmered in rich creamy tomato cashew gravy"},
    {"id": "m-302", "name": "Kadhai Paneer Special", "category": "Main Course Curries", "rate": 230, "is_veg": True, "description": "Cottage cheese tossed with bell peppers, onions and freshly ground kadhai masala"},
    {"id": "m-303", "name": "Shahi Paneer (Desi Ghee)", "category": "Main Course Curries", "rate": 240, "is_veg": True, "description": "Royal mild gravy enriched with melon seeds, cardamom and saffron milk"},
    {"id": "m-304", "name": "Dal Makhani Slow Cooked", "category": "Main Course Curries", "rate": 190, "is_veg": True, "description": "Overnight slow-cooked black lentils finished with cream and fresh white butter"},
    {"id": "m-305", "name": "Yellow Dal Tadka (Double Chhonk)", "category": "Main Course Curries", "rate": 150, "is_veg": True, "description": "Yellow toor dal tempered with cumin, garlic, red chillies and pure desi ghee"},
    {"id": "m-306", "name": "Aloo Gobi Adraki Masala", "category": "Main Course Curries", "rate": 160, "is_veg": True, "description": "Homestyle potatoes and cauliflower tossed with julienned fresh ginger"},

    # 4. Rotis, Naans & Rice
    {"id": "m-401", "name": "Butter Roti (Tandoori / Phulka)", "category": "Breads & Rice", "rate": 25, "is_veg": True, "description": "Fresh whole wheat flatbread brushed with Amul butter"},
    {"id": "m-402", "name": "Plain Tandoori Roti", "category": "Breads & Rice", "rate": 20, "is_veg": True, "description": "Crisp whole wheat clay oven roti"},
    {"id": "m-403", "name": "Butter Naan", "category": "Breads & Rice", "rate": 50, "is_veg": True, "description": "Leavened oven-baked flatbread glazed with butter"},
    {"id": "m-404", "name": "Garlic Butter Naan", "category": "Breads & Rice", "rate": 70, "is_veg": True, "description": "Leavened bread topped with roasted garlic and coriander"},
    {"id": "m-405", "name": "Jeera Rice Basmati", "category": "Breads & Rice", "rate": 130, "is_veg": True, "description": "Fragrant aged basmati rice tempered with toasted cumin seeds"},
    {"id": "m-406", "name": "Veg Dum Biryani with Mirchi Salan", "category": "Breads & Rice", "rate": 220, "is_veg": True, "description": "Slow-cooked saffron basmati rice layered with marinated vegetables and whole spices"},

    # 5. Beverages & Desi Refreshments
    {"id": "m-501", "name": "Masala Chai (Ginger & Cardamom)", "category": "Beverages & Drinks", "rate": 30, "is_veg": True, "description": "Aromatic CTC tea brewed with freshly pounded ginger, green cardamom and milk"},
    {"id": "m-502", "name": "Filter Coffee (South Indian Chicory Blend)", "category": "Beverages & Drinks", "rate": 45, "is_veg": True, "description": "Traditional frothy filter decoction coffee"},
    {"id": "m-503", "name": "Sweet Lassi (Clay Kulhad)", "category": "Beverages & Drinks", "rate": 70, "is_veg": True, "description": "Churned rich curd topped with malai, dry fruits and rose essence"},
    {"id": "m-504", "name": "Masala Chaas (Spiced Buttermilk)", "category": "Beverages & Drinks", "rate": 40, "is_veg": True, "description": "Refreshing churned curd tempered with roasted cumin, rock salt and mint"},
    {"id": "m-505", "name": "Packaged Mineral Water (1 Litre)", "category": "Beverages & Drinks", "rate": 25, "is_veg": True, "description": "Sealed packaged mineral water bottle"}
]

# =========================================================================
# PYDANTIC SCHEMAS
# =========================================================================
class OrderItemPayload(BaseModel):
    item_id: Optional[str] = None
    item_name: str
    rate: float = Field(..., ge=0)
    qty: int = Field(..., ge=1)
    amount: float = Field(..., ge=0)
    notes: Optional[str] = None

class AmenityItemPayload(BaseModel):
    amenity_id: str
    amenity_name: str
    qty: int = Field(default=1, ge=1)
    notes: Optional[str] = None

class CreateGuestOrderPayload(BaseModel):
    room_no: str = Field(..., min_length=1, max_length=20)
    room_category: str = Field(..., min_length=2, max_length=50)
    order_type: str = Field(..., pattern=r"^(Amenity Request|Food Order|Combined)$")
    amenities: List[AmenityItemPayload] = Field(default_factory=list)
    items: List[OrderItemPayload] = Field(default_factory=list)
    subtotal_amount: float = Field(default=0.0, ge=0)
    tax_amount: float = Field(default=0.0, ge=0)
    total_amount: float = Field(default=0.0, ge=0)
    payment_method: str = Field(default="Transfer to Room Folio")  # "Transfer to Room Folio" | "Immediate UPI" | "Immediate Card" | "Complimentary"
    guest_name: Optional[str] = None
    guest_phone: Optional[str] = None
    special_instructions: Optional[str] = None
    payment_reference: Optional[str] = None

class UpdateOrderStatusPayload(BaseModel):
    status: str = Field(..., pattern=r"^(New Order|Acknowledged|In Preparation|Delivered|Cancelled)$")
    delivery_staff: Optional[str] = None
    remarks: Optional[str] = None
    payment_status: Optional[str] = None


# =========================================================================
# API ROUTES
# =========================================================================

@router.get("/amenities-config", summary="Get Tiered Room Amenities Configuration")
def get_amenities_config():
    """
    Returns the tiered amenity configuration:
    - Deluxe Room & Classic Studio: Towels, Comforter, Duvet, Soaps, Shampoos.
    - Premium Room & Executive Room: Moisturizer, Shampoo, Toothbrush, Electric Kettle, Hair Dryer.
    """
    return {
        "status": "success",
        "tiers": TIERED_AMENITIES_CONFIG,
        "note": "Tiered room service amenities are strictly segregated by room category as per hotel policy."
    }

@router.get("/rooms", summary="List All 18 Rooms with Category and Amenities Tier")
def get_18_rooms():
    """
    Returns the 18 physical rooms (101-107 on Ground Floor, 201-211 on First Floor)
    with their category and assigned amenity tier.
    """
    enriched = []
    for r in ROOMS_MASTER_DATA:
        tier_data = TIERED_AMENITIES_CONFIG.get(r["room_type"], TIERED_AMENITIES_CONFIG["Deluxe"])
        enriched.append({
            **r,
            "tier_badge": tier_data["badge"],
            "tier_name": tier_data["tier_name"],
            "amenities_count": len(tier_data["amenities"])
        })
    return {
        "status": "success",
        "total_rooms": len(enriched),
        "rooms": enriched
    }

@router.get("/menu", summary="Get Vasudev Rasoi Food Menu")
def get_food_menu():
    """
    Returns the food items with categories, prices, and descriptions.
    """
    # Group by category
    categories_dict: Dict[str, List[Dict[str, Any]]] = {}
    for item in DEFAULT_MENU_ITEMS:
        cat = item["category"]
        if cat not in categories_dict:
            categories_dict[cat] = []
        categories_dict[cat].append(item)
    
    return {
        "status": "success",
        "total_items": len(DEFAULT_MENU_ITEMS),
        "categories": list(categories_dict.keys()),
        "grouped_menu": categories_dict,
        "items": DEFAULT_MENU_ITEMS
    }

@router.post("/orders", status_code=status.HTTP_201_CREATED, summary="Place Room Service or Food Order")
def create_guest_order(payload: CreateGuestOrderPayload, db: Session = Depends(get_db)):
    """
    Places an order from the 18-room QR self-service portal:
    - Supports Amenity Request (complimentary), Food Order (with billing), or Combined.
    - Checkout: 'Transfer to Room Folio' or 'Immediate UPI/Card'.
    - Stores order and triggers notification for Receptionist dashboard.
    """
    # Validate room number
    room_found = next((r for r in ROOMS_MASTER_DATA if r["room_no"] == payload.room_no), None)
    if not room_found:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Room {payload.room_no} is not a valid room number (Valid: 101-107, 201-211)."
        )

    # Validate amenity tier eligibility and quantity limits (Bug-02 & Bug-03)
    room_category = payload.room_category or room_found["room_type"]
    tier_config = TIERED_AMENITIES_CONFIG.get(room_category) or TIERED_AMENITIES_CONFIG.get("Deluxe")
    valid_amenities_map = {a["id"]: a for a in tier_config["amenities"]} if tier_config else {}

    for amenity in payload.amenities:
        if valid_amenities_map and amenity.amenity_id not in valid_amenities_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Amenity '{amenity.amenity_name}' is not complimentary for room category '{room_category}'."
            )
        max_allowed = valid_amenities_map[amenity.amenity_id]["max_qty"] if amenity.amenity_id in valid_amenities_map else 5
        if amenity.qty > max_allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested quantity {amenity.qty} exceeds maximum allowed ({max_allowed}) for '{amenity.amenity_name}'."
            )

    # Generate sequential unique Order ID: RSO-YYYYMM-XXXX
    timestamp_prefix = datetime.now().strftime("%Y%m")
    count_this_month = db.query(GuestRoomServiceOrder).filter(
        GuestRoomServiceOrder.order_number.like(f"RSO-{timestamp_prefix}-%")
    ).count()
    order_number = f"RSO-{timestamp_prefix}-{count_this_month + 1:04d}"

    # Determine payment status
    if payload.order_type == "Amenity Request" or payload.total_amount == 0:
        payment_status = "Complimentary"
        payment_method = "Complimentary"
    elif payload.payment_method == "Transfer to Room Folio":
        payment_status = "Folio Accrued"
        payment_method = "Transfer to Room Folio"
    elif "UPI" in payload.payment_method or "Card" in payload.payment_method:
        payment_status = "Paid" if payload.payment_reference else "Pending Payment"
        payment_method = payload.payment_method
    else:
        payment_status = "Pending"
        payment_method = payload.payment_method

    new_order = GuestRoomServiceOrder(
        order_number=order_number,
        room_no=payload.room_no,
        room_category=payload.room_category or room_found["room_type"],
        order_type=payload.order_type,
        amenities_json=json.dumps([a.model_dump() for a in payload.amenities]),
        items_json=json.dumps([i.model_dump() for i in payload.items]),
        subtotal_amount=payload.subtotal_amount,
        tax_amount=payload.tax_amount,
        total_amount=payload.total_amount,
        payment_method=payment_method,
        payment_status=payment_status,
        payment_reference=payload.payment_reference,
        status="New Order",
        guest_name=payload.guest_name or f"Guest (Room {payload.room_no})",
        guest_phone=payload.guest_phone,
        special_instructions=payload.special_instructions,
        created_at=now_utc(),
        updated_at=now_utc()
    )

    db.add(new_order)

    # If settled to room folio, bind charges to active guest booking (Bug-04)
    if payload.payment_method == "Transfer to Room Folio" and payload.total_amount > 0:
        active_booking = db.query(Booking).join(
            Room, Booking.room_id == Room.id
        ).filter(
            (Room.name.ilike(f"%{payload.room_no}%")) | (Room.slug.ilike(f"%{payload.room_no}%")),
            Booking.status.in_(["Checked-In", "Confirmed"]),
            Booking.is_deleted == False
        ).order_by(Booking.id.desc()).first()

        if active_booking:
            items_desc = ", ".join(f"{it.item_name} x{it.qty}" for it in payload.items) if payload.items else "In-Room Dining Order"
            folio_item = RoomFolioItem(
                booking_id=active_booking.id,
                item_type="Food_KOT",
                description=f"In-Room QR Order #{order_number}: {items_desc[:200]}",
                sac_code="996331",
                kot_number=order_number,
                quantity=1,
                unit_price=payload.subtotal_amount,
                taxable_amount=payload.subtotal_amount,
                gst_rate=5.0,
                cgst_amount=round(payload.tax_amount / 2, 2),
                sgst_amount=round(payload.tax_amount / 2, 2),
                total_amount=payload.total_amount,
                created_at=now_utc()
            )
            db.add(folio_item)

    db.commit()
    db.refresh(new_order)

    return {
        "status": "success",
        "message": f"Order {order_number} submitted successfully for Room {payload.room_no}!",
        "order": {
            "id": new_order.id,
            "order_number": new_order.order_number,
            "room_no": new_order.room_no,
            "room_category": new_order.room_category,
            "order_type": new_order.order_type,
            "total_amount": new_order.total_amount,
            "payment_method": new_order.payment_method,
            "payment_status": new_order.payment_status,
            "status": new_order.status,
            "guest_name": new_order.guest_name,
            "created_at": new_order.created_at.isoformat() if new_order.created_at else None
        }
    }

@router.get("/orders", summary="List All Room Service Orders")
def list_guest_orders(
    room_no: Optional[str] = Query(None, description="Filter by room number"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by order status"),
    order_type: Optional[str] = Query(None, description="Filter by order type"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    List room service and food orders with optional filters.
    """
    query = db.query(GuestRoomServiceOrder)
    if room_no:
        query = query.filter(GuestRoomServiceOrder.room_no == room_no)
    if status_filter:
        query = query.filter(GuestRoomServiceOrder.status == status_filter)
    if order_type:
        query = query.filter(GuestRoomServiceOrder.order_type == order_type)

    orders = query.order_by(desc(GuestRoomServiceOrder.id)).limit(limit).all()

    results = []
    for o in orders:
        try:
            amenities = json.loads(o.amenities_json) if o.amenities_json else []
        except Exception:
            amenities = []
        try:
            items = json.loads(o.items_json) if o.items_json else []
        except Exception:
            items = []

        results.append({
            "id": o.id,
            "order_number": o.order_number,
            "room_no": o.room_no,
            "room_category": o.room_category,
            "order_type": o.order_type,
            "amenities": amenities,
            "items": items,
            "subtotal_amount": o.subtotal_amount,
            "tax_amount": o.tax_amount,
            "total_amount": o.total_amount,
            "payment_method": o.payment_method,
            "payment_status": o.payment_status,
            "payment_reference": o.payment_reference,
            "status": o.status,
            "guest_name": o.guest_name,
            "guest_phone": o.guest_phone,
            "special_instructions": o.special_instructions,
            "delivery_staff": o.delivery_staff,
            "acknowledged_at": o.acknowledged_at.isoformat() if o.acknowledged_at else None,
            "delivered_at": o.delivered_at.isoformat() if o.delivered_at else None,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "updated_at": o.updated_at.isoformat() if o.updated_at else None
        })

    return {
        "status": "success",
        "count": len(results),
        "orders": results
    }

@router.get("/orders/{order_id}", summary="Get Order Details")
def get_order_detail(order_id: int, db: Session = Depends(get_db)):
    """
    Get detailed breakdown of a specific room order.
    """
    order = db.query(GuestRoomServiceOrder).filter(GuestRoomServiceOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order ID {order_id} not found.")

    try:
        amenities = json.loads(order.amenities_json) if order.amenities_json else []
    except Exception:
        amenities = []
    try:
        items = json.loads(order.items_json) if order.items_json else []
    except Exception:
        items = []

    return {
        "status": "success",
        "order": {
            "id": order.id,
            "order_number": order.order_number,
            "room_no": order.room_no,
            "room_category": order.room_category,
            "order_type": order.order_type,
            "amenities": amenities,
            "items": items,
            "subtotal_amount": order.subtotal_amount,
            "tax_amount": order.tax_amount,
            "total_amount": order.total_amount,
            "payment_method": order.payment_method,
            "payment_status": order.payment_status,
            "payment_reference": order.payment_reference,
            "status": order.status,
            "guest_name": order.guest_name,
            "guest_phone": order.guest_phone,
            "special_instructions": order.special_instructions,
            "delivery_staff": order.delivery_staff,
            "acknowledged_at": order.acknowledged_at.isoformat() if order.acknowledged_at else None,
            "delivered_at": order.delivered_at.isoformat() if order.delivered_at else None,
            "created_at": order.created_at.isoformat() if order.created_at else None
        }
    }

@router.put("/orders/{order_id}/status", summary="Update Order Status (Receptionist / Service Desk)")
def update_order_status(order_id: int, payload: UpdateOrderStatusPayload, db: Session = Depends(get_db)):
    """
    Update order status:
    - New Order -> Acknowledged -> In Preparation -> Delivered (or Cancelled)
    - Records staff name and timestamps.
    """
    order = db.query(GuestRoomServiceOrder).filter(GuestRoomServiceOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order ID {order_id} not found.")

    order.status = payload.status
    if payload.delivery_staff:
        order.delivery_staff = payload.delivery_staff
    if payload.payment_status:
        order.payment_status = payload.payment_status

    if payload.status == "Acknowledged" and not order.acknowledged_at:
        order.acknowledged_at = now_utc()
    elif payload.status == "Delivered" and not order.delivered_at:
        order.delivered_at = now_utc()
        if order.payment_status == "Pending Payment" and order.payment_method == "Transfer to Room Folio":
            order.payment_status = "Folio Accrued"

    order.updated_at = now_utc()
    db.commit()
    db.refresh(order)

    return {
        "status": "success",
        "message": f"Order {order.order_number} marked as '{order.status}'.",
        "order": {
            "id": order.id,
            "order_number": order.order_number,
            "room_no": order.room_no,
            "status": order.status,
            "delivery_staff": order.delivery_staff,
            "acknowledged_at": order.acknowledged_at.isoformat() if order.acknowledged_at else None,
            "delivered_at": order.delivered_at.isoformat() if order.delivered_at else None
        }
    }

@router.get("/receptionist-alert-summary", summary="Receptionist Notification Polling & Active Count")
def get_receptionist_alert_summary(db: Session = Depends(get_db)):
    """
    High-speed endpoint called by Receptionist Dashboard every few seconds.
    Returns:
    - new_orders_count (unacknowledged)
    - active_orders_count (New Order + In Preparation)
    - latest_unacknowledged: list of new orders needing immediate action
    """
    new_orders = db.query(GuestRoomServiceOrder).filter(
        GuestRoomServiceOrder.status == "New Order"
    ).order_by(desc(GuestRoomServiceOrder.id)).limit(10).all()

    in_prep_count = db.query(GuestRoomServiceOrder).filter(
        GuestRoomServiceOrder.status.in_(["Acknowledged", "In Preparation"])
    ).count()

    items_summary = []
    for o in new_orders:
        items_summary.append({
            "id": o.id,
            "order_number": o.order_number,
            "room_no": o.room_no,
            "room_category": o.room_category,
            "order_type": o.order_type,
            "total_amount": o.total_amount,
            "guest_name": o.guest_name,
            "created_at": o.created_at.isoformat() if o.created_at else None
        })

    return {
        "status": "success",
        "has_alerts": len(new_orders) > 0,
        "new_orders_count": len(new_orders),
        "in_preparation_count": in_prep_count,
        "active_total_count": len(new_orders) + in_prep_count,
        "latest_new_orders": items_summary
    }

