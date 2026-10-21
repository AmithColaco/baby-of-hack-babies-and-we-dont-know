"""KalaHaat – Pydantic schemas (request / response models)."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ──────────────────────────── Auth ───────────────────────────────

class OTPRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15, examples=["+919876543210"])


class OTPVerify(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    otp: str = Field(..., min_length=6, max_length=6, examples=["123456"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    is_new_user: bool = False


# ──────────────────────────── User / Profile ─────────────────────

class UserOut(BaseModel):
    id: str
    role: str
    name: str
    phone: str
    language: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ArtisanProfileIn(BaseModel):
    name: str = Field("", max_length=255)
    craft_types: str = Field("", max_length=500, description="Comma-separated craft types")
    village: str = Field("", max_length=255)
    years_practising: int = Field(0, ge=0)
    bio: str = ""
    avatar_url: str = ""
    role: str = Field("artisan", description="Role to set: artisan, buyer, facilitator")


class ArtisanProfileOut(BaseModel):
    user_id: str
    craft_types: str
    village: str
    years_practising: int
    bio: str
    avatar_url: str
    verified: bool
    created_by: Optional[str] = None

    model_config = {"from_attributes": True}


class ProfileOut(BaseModel):
    user: UserOut
    artisan_profile: Optional[ArtisanProfileOut] = None


# ──────────────────────────── Listings ───────────────────────────

class ListingImageOut(BaseModel):
    id: str
    url: str
    position: int

    model_config = {"from_attributes": True}


class StoryOut(BaseModel):
    id: str
    origin_text: str
    process_text: str
    price_rationale_json: str
    qr_code_url: str

    model_config = {"from_attributes": True}


class ListingCreate(BaseModel):
    title: str = Field(..., max_length=500)
    description: str = ""
    craft_type: str = Field(..., max_length=100)
    materials: str = ""
    technique: str = ""
    dimensions: str = ""
    hours_to_make: float = Field(0.0, ge=0)
    price_inr: float = Field(0.0, ge=0)
    stock: int = Field(1, ge=0)


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    craft_type: Optional[str] = None
    materials: Optional[str] = None
    technique: Optional[str] = None
    dimensions: Optional[str] = None
    hours_to_make: Optional[float] = None
    price_inr: Optional[float] = None
    stock: Optional[int] = None
    status: Optional[str] = None

    # story fields (optional – updated alongside)
    story_origin_text: Optional[str] = None
    story_process_text: Optional[str] = None
    story_price_rationale_json: Optional[str] = None


class ListingOut(BaseModel):
    id: str
    artisan_id: str
    title: str
    description: str
    craft_type: str
    materials: str
    technique: str
    dimensions: str
    hours_to_make: float
    price_inr: float
    stock: int
    status: str
    gallery_wing: str
    created_at: datetime
    images: list[ListingImageOut] = []
    story: Optional[StoryOut] = None

    # denormalized artisan info for storefront
    artisan_name: str = ""
    artisan_village: str = ""

    model_config = {"from_attributes": True}


class ListingBrief(BaseModel):
    """Compact listing for catalogue grid."""
    id: str
    title: str
    price_inr: float
    stock: int
    craft_type: str
    status: str
    artisan_name: str = ""
    thumbnail_url: str = ""

    model_config = {"from_attributes": True}


# ──────────────────────────── AI Draft ───────────────────────────

class AIDraftResponse(BaseModel):
    title: str = ""
    description: str = ""
    materials: list[str] = []
    technique: str = ""
    story: str = ""
    tags: list[str] = []
    suggested_price_range: dict = Field(default_factory=lambda: {"min": 0, "max": 0})


# ──────────────────────────── Price ──────────────────────────────

class PriceSuggestionRequest(BaseModel):
    craft_type: str
    hours_to_make: float = Field(..., ge=0)
    materials_cost: float = Field(0.0, ge=0)
    technique_complexity: str = Field("medium", description="low | medium | high | very_high")


class PriceBreakdown(BaseModel):
    materials_cost: float
    labour_cost: float
    fair_hourly_wage: float
    hours: float
    craft_premium_multiplier: float
    craft_premium_amount: float
    platform_fee: float
    suggested_price: float
    suggested_range: dict = Field(default_factory=lambda: {"min": 0, "max": 0})
    reasoning: str = ""


# ──────────────────────────── Cart / Orders ──────────────────────

class CartItem(BaseModel):
    listing_id: str
    qty: int = Field(1, ge=1)


class CheckoutRequest(BaseModel):
    items: list[CartItem] = Field(..., min_length=1)
    address: dict = Field(default_factory=dict)
    payment_method: str = Field("mock_upi", description="mock_upi | mock_card | mock_cod")
    idempotency_key: str = Field(..., min_length=1, max_length=64)


class OrderItemOut(BaseModel):
    id: str
    listing_id: str
    qty: int
    unit_price_inr: float
    listing_title: str = ""

    model_config = {"from_attributes": True}


class PaymentOut(BaseModel):
    id: str
    provider: str
    status: str
    ref: str
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: str
    buyer_id: str
    status: str
    total_inr: float
    address_json: str
    payment_status: str
    idempotency_key: str
    created_at: datetime
    items: list[OrderItemOut] = []
    payment: Optional[PaymentOut] = None

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="CONFIRMED | SHIPPED | DELIVERED | CANCELLED")


# ──────────────────────────── Gallery ────────────────────────────

class GalleryItem(BaseModel):
    id: str
    title: str
    price_inr: float
    craft_type: str
    image_url: str = ""
    artisan_name: str = ""
    gallery_wing: str = ""
    position_hint: int = 0


# ──────────────────────────── Guide ──────────────────────────────

class NarrateRequest(BaseModel):
    listing_id: str
    language: str = "en"


class NarrateResponse(BaseModel):
    narration: str
    listing_id: str


# ──────────────────────────── Craft Reference ────────────────────

class CraftReferenceOut(BaseModel):
    craft_type: str
    origin_text: str
    premium_multiplier: float
    notes: str

    model_config = {"from_attributes": True}
