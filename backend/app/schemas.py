"""KalaHaat – Pydantic schemas (request / response models)."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

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
    accession_id: Optional[str] = ""
    voice_clip_url: Optional[str] = ""
    is_women_shg: Optional[bool] = False
    shg_name: Optional[str] = ""
    material_cost: Optional[float] = 0.0
    skill_rate_per_hour: Optional[float] = 150.0
    heritage_premium: Optional[float] = 0.0
    machine_lookalike_price: Optional[float] = 0.0
    machine_lookalike_notes: Optional[str] = ""


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

    # Provenance, Voice Clip & Story-backed pricing
    accession_id: str = ""
    voice_clip_url: str = ""
    is_women_shg: bool = False
    shg_name: str = ""
    material_cost: float = 0.0
    skill_rate_per_hour: float = 150.0
    heritage_premium: float = 0.0
    machine_lookalike_price: float = 0.0
    machine_lookalike_notes: str = ""

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
    courier: str = Field("BlueDart Heritage Express", description="Courier partner")
    upi_ref: Optional[str] = Field(None, description="Mock UPI transaction UTR / reference")
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


class OrderTimelineUpdateCreate(BaseModel):
    stage_index: int = Field(..., ge=1, le=5)
    stage_name: str = Field(..., max_length=100)
    photo_url: str = Field("", max_length=500)
    note: str = ""


class OrderTimelineUpdateOut(BaseModel):
    id: str
    order_id: str
    stage_index: int
    stage_name: str
    photo_url: str
    note: str
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: str
    buyer_id: str
    status: str
    total_inr: float
    address_json: str
    payment_status: str
    courier: str = "BlueDart Heritage Express"
    tracking_number: str = ""
    payment_method: str = "mock_upi"
    upi_ref: str = ""
    idempotency_key: str
    created_at: datetime
    items: list[OrderItemOut] = []
    payment: Optional[PaymentOut] = None
    timeline_updates: list[OrderTimelineUpdateOut] = []

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="CONFIRMED | SHIPPED | DELIVERED | CANCELLED")


# ──────────────────────────── Custom Commissions ──────────────────────────────

class CommissionQuoteCreate(BaseModel):
    quoted_price: float = Field(..., gt=0)
    estimated_days: int = Field(..., ge=1)
    materials_description: str = ""
    notes: str = ""


class CommissionQuoteOut(BaseModel):
    id: str
    commission_id: str
    artisan_id: str
    quoted_price: float
    estimated_days: int
    materials_description: str
    notes: str
    status: str
    created_at: datetime
    artisan_name: str = ""

    model_config = {"from_attributes": True}


class CommissionRequestCreate(BaseModel):
    craft_type: str = Field(..., max_length=100)
    title: str = Field(..., max_length=255)
    description: str = Field(..., min_length=10)
    dimensions: str = ""
    target_budget: float = Field(0.0, ge=0)
    deadline_days: int = Field(30, ge=1)
    reference_image_url: str = ""


class CommissionRequestOut(BaseModel):
    id: str
    buyer_id: str
    craft_type: str
    title: str
    description: str
    dimensions: str
    target_budget: float
    deadline_days: int
    reference_image_url: str
    status: str
    created_at: datetime
    buyer_name: str = ""
    quotes: list[CommissionQuoteOut] = []

    model_config = {"from_attributes": True}


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


# ──────────────────────────── Chatbot / Space Stylist ────────────

class ChatbotSpaceAnalysis(BaseModel):
    isSuitable: bool = True
    unsuitableMessage: str = ""
    dominantColors: list[str] = Field(default_factory=list)
    interiorStyle: str = ""
    secondaryInfluences: list[str] = Field(default_factory=list)
    spaceMood: str = ""
    colorDescription: str = ""
    spaceDescription: str = ""
    suggestedCategories: list[str] = Field(default_factory=list)
    suggestedPlacements: list[str] = Field(default_factory=list)
    maxBudget: Optional[float] = None
    ambientCctKelvin: Optional[int] = None
    lightDirectionality: Optional[str] = None
    diffusionLevel: Optional[str] = None
    lightingRecommendation: Optional[str] = None
    suitabilityStatus: str = "APPROVED"
    fixedEnvelope: Optional[dict[str, Any]] = None
    stylingNarrative: Optional[str] = None


class ChatbotProductOut(BaseModel):
    id: str
    title: str
    craftTradition: str
    category: str
    price: float
    artisan: str
    region: str
    state: str = ""
    dimensions: str = ""
    image: str = ""
    colorPalette: list[str] = Field(default_factory=list)
    materials: list[str] = Field(default_factory=list)
    technique: str = ""


class ChatbotRecommendation(BaseModel):
    product: ChatbotProductOut
    reason: str
    matchScore: int = Field(..., ge=0, le=100)
    designRationale: Optional[dict[str, str]] = None
    spatialPlacement: Optional[dict[str, Any]] = None
    photometricInteraction: Optional[str] = None


class ChatbotAnalyzeResponse(BaseModel):
    spaceAnalysis: ChatbotSpaceAnalysis
    recommendations: list[ChatbotRecommendation]


class RAGSourceOut(BaseModel):
    id: str
    title: str
    category: str
    snippet: str
    relevanceScore: float = 0.0
    productId: Optional[str] = None


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatbotChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = Field(default_factory=list)


class ChatbotChatResponse(BaseModel):
    answer: str
    sources: list[RAGSourceOut] = Field(default_factory=list)
    suggestedProducts: list[ChatbotProductOut] = Field(default_factory=list)
    confidenceScore: float = 0.95
    usedFallback: bool = False
    objectQueryDetected: bool = False
    noObjectsFound: bool = False
    hasReachedEnd: bool = False
    endMessage: Optional[str] = None


