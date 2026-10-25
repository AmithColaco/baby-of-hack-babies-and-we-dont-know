"""KalaHaat – listings router.

Endpoints:
  POST   /listings                  – create a new listing (draft)
  GET    /listings                  – catalogue browse / search / filter
  GET    /listings/{id}             – product detail + story
  PATCH  /listings/{id}             – update listing fields
  POST   /listings/{id}/publish     – move from DRAFT → PUBLISHED
  POST   /listings/{id}/archive     – move to ARCHIVED
  POST   /listings/ai-draft         – AI-assisted draft from images
  POST   /listings/price-suggestion – deterministic price breakdown
  POST   /listings/{id}/images      – upload images for a listing
"""

import json
import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.models import (
    CraftReference,
    Listing,
    ListingImage,
    ListingStatus,
    Story,
    User,
    UserRole,
)
from app.schemas import (
    AIDraftResponse,
    CraftReferenceOut,
    ListingBrief,
    ListingCreate,
    ListingOut,
    ListingUpdate,
    PriceBreakdown,
    PriceSuggestionRequest,
)
from app.services import ai_service, price_service

router = APIRouter()

# ──────────────────────── upload directory ───────────────────────

UPLOAD_DIR = settings.UPLOAD_DIR
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ──────────────────────── helpers ────────────────────────────────

def _listing_to_out(listing: Listing) -> ListingOut:
    """Convert an ORM Listing (with joined relations) to the response schema."""
    out = ListingOut.model_validate(listing)
    if listing.artisan:
        out.artisan_name = listing.artisan.name
        if listing.artisan.artisan_profile:
            out.artisan_village = listing.artisan.artisan_profile.village
    return out


def _ensure_owner(listing: Listing, user: User):
    """Raise 403 if the user doesn't own the listing (unless admin/facilitator)."""
    if user.role in (UserRole.admin, "admin"):
        return
    if user.role in (UserRole.facilitator, "facilitator"):
        return  # facilitators can edit on behalf
    if listing.artisan_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your listing")


# ──────────────────────── CRUD ───────────────────────────────────

@router.post("", response_model=ListingOut, status_code=201, summary="Create a new listing (draft)")
def create_listing(
    body: ListingCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = Listing(
        artisan_id=user.id,
        title=body.title,
        description=body.description,
        craft_type=body.craft_type,
        materials=body.materials,
        technique=body.technique,
        dimensions=body.dimensions,
        hours_to_make=body.hours_to_make,
        price_inr=body.price_inr,
        stock=body.stock,
        status=ListingStatus.DRAFT,
        gallery_wing=body.craft_type,  # wing = craft type by default
    )
    # Create a blank story
    story = Story(
        listing_id=listing.id,
        origin_text="",
        process_text="",
        price_rationale_json="{}",
    )
    listing.story = story

    db.add(listing)
    db.commit()
    db.refresh(listing)

    return _listing_to_out(listing)


@router.get("", response_model=list[ListingOut], summary="Browse / search catalogue")
def list_listings(
    craft: Optional[str] = Query(None, description="Filter by craft type"),
    q: Optional[str] = Query(None, description="Search title/description"),
    min_price: Optional[float] = Query(None, alias="min", ge=0),
    max_price: Optional[float] = Query(None, alias="max", ge=0),
    status_filter: Optional[str] = Query(None, alias="status"),
    artisan_id: Optional[str] = Query(None, description="Filter by artisan"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Listing)
        .options(
            joinedload(Listing.images),
            joinedload(Listing.story),
            joinedload(Listing.artisan),
        )
    )

    # Status filtering:
    # If explicitly passed, filter by it (unless 'ALL' or empty)
    if isinstance(status_filter, str) and status_filter.upper() != "ALL" and status_filter.strip():
        query = query.filter(Listing.status == status_filter.upper())
    elif not status_filter or not isinstance(status_filter, str):
        if not artisan_id:
            # Default public catalogue browse shows PUBLISHED listings only
            query = query.filter(Listing.status == ListingStatus.PUBLISHED)
    # When artisan_id is provided without an explicit status, return all listings for that artisan
    if craft:
        query = query.filter(Listing.craft_type == craft)
    if artisan_id:
        query = query.filter(Listing.artisan_id == artisan_id)
    if min_price is not None:
        query = query.filter(Listing.price_inr >= min_price)
    if max_price is not None:
        query = query.filter(Listing.price_inr <= max_price)
    if q:
        pattern = f"%{q}%"
        query = query.filter(
            or_(
                Listing.title.ilike(pattern),
                Listing.description.ilike(pattern),
                Listing.craft_type.ilike(pattern),
            )
        )

    listings = query.order_by(Listing.created_at.desc()).offset(offset).limit(limit).all()
    # Deduplicate (joinedload can cause dupes)
    seen = set()
    unique = []
    for l in listings:
        if l.id not in seen:
            seen.add(l.id)
            unique.append(l)
    return [_listing_to_out(l) for l in unique]


@router.get("/crafts", response_model=list[CraftReferenceOut], summary="List craft references")
def list_crafts(db: Session = Depends(get_db)):
    """Return all curated craft traditions and their metadata."""
    return db.query(CraftReference).all()


@router.get("/{listing_id}", response_model=ListingOut, summary="Get listing detail + story")
def get_listing(listing_id: str, db: Session = Depends(get_db)):
    listing = (
        db.query(Listing)
        .options(
            joinedload(Listing.images),
            joinedload(Listing.story),
            joinedload(Listing.artisan).joinedload(User.artisan_profile),
        )
        .filter(Listing.id == listing_id)
        .first()
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return _listing_to_out(listing)


@router.patch("/{listing_id}", response_model=ListingOut, summary="Update listing fields")
def update_listing(
    listing_id: str,
    body: ListingUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    _ensure_owner(listing, user)

    # Update listing fields
    update_data = body.model_dump(exclude_unset=True, exclude={"story_origin_text", "story_process_text", "story_price_rationale_json"})
    for field, value in update_data.items():
        setattr(listing, field, value)

    # Update gallery wing if craft type changed
    if body.craft_type is not None:
        listing.gallery_wing = body.craft_type

    # Update story if story fields provided
    if any([body.story_origin_text is not None, body.story_process_text is not None, body.story_price_rationale_json is not None]):
        if listing.story is None:
            listing.story = Story(listing_id=listing.id)
            db.add(listing.story)
        if body.story_origin_text is not None:
            listing.story.origin_text = body.story_origin_text
        if body.story_process_text is not None:
            listing.story.process_text = body.story_process_text
        if body.story_price_rationale_json is not None:
            listing.story.price_rationale_json = body.story_price_rationale_json

    db.commit()
    db.refresh(listing)
    return _listing_to_out(listing)


@router.post("/{listing_id}/publish", response_model=ListingOut, summary="Publish a draft listing")
def publish_listing(
    listing_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    _ensure_owner(listing, user)

    if listing.status == ListingStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Already published")
    if not listing.title or listing.price_inr <= 0:
        raise HTTPException(status_code=400, detail="Title and price are required to publish")

    listing.status = ListingStatus.PUBLISHED
    db.commit()
    db.refresh(listing)
    return _listing_to_out(listing)


@router.post("/{listing_id}/archive", response_model=ListingOut, summary="Archive a listing")
def archive_listing(
    listing_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    _ensure_owner(listing, user)

    listing.status = ListingStatus.ARCHIVED
    db.commit()
    db.refresh(listing)
    return _listing_to_out(listing)


# ──────────────────────── Image upload ───────────────────────────

@router.post("/{listing_id}/images", response_model=ListingOut, summary="Upload images for a listing")
async def upload_images(
    listing_id: str,
    files: list[UploadFile] = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    _ensure_owner(listing, user)

    existing_count = db.query(ListingImage).filter(ListingImage.listing_id == listing_id).count()
    if existing_count + len(files) > settings.MAX_IMAGES_PER_LISTING:
        raise HTTPException(
            status_code=400,
            detail=f"Max {settings.MAX_IMAGES_PER_LISTING} images per listing",
        )

    for i, file in enumerate(files):
        # Validate type
        ct = (file.content_type or "").lower().split(";")[0].strip()
        if ct not in ("image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"):
            raise HTTPException(status_code=400, detail=f"Unsupported image type: {file.content_type}")

        # Save to disk
        ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        content = await file.read()
        if len(content) > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"Image too large (max {settings.MAX_IMAGE_SIZE_MB}MB)")

        with open(filepath, "wb") as f:
            f.write(content)

        image = ListingImage(
            listing_id=listing_id,
            url=f"/uploads/{filename}",
            position=existing_count + i,
        )
        db.add(image)

    db.commit()
    db.refresh(listing)
    return _listing_to_out(listing)


# ──────────────────────── AI Draft ───────────────────────────────

@router.post("/ai-draft", response_model=AIDraftResponse, summary="Generate AI listing draft from images")
async def ai_draft(
    files: list[UploadFile] = File(...),
    craft_type: str = Query("", description="Craft type hint"),
    transcript: str = Query("", description="Optional voice transcript"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Read image bytes
    image_bytes_list = []
    for file in files[:4]:
        content = await file.read()
        image_bytes_list.append(content)

    # Get craft context for grounding
    craft_ref = db.get(CraftReference, craft_type) if craft_type else None
    craft_context = ""
    if craft_ref:
        craft_context = f"Craft: {craft_ref.craft_type}\nOrigin: {craft_ref.origin_text}\nNotes: {craft_ref.notes}"

    draft = await ai_service.generate_ai_draft(
        image_bytes_list=image_bytes_list,
        craft_type=craft_type,
        transcript=transcript,
        craft_context=craft_context,
    )
    return draft


# ──────────────────────── Price suggestion ───────────────────────

@router.post("/price-suggestion", response_model=PriceBreakdown, summary="Get transparent price breakdown")
def get_price_suggestion(
    body: PriceSuggestionRequest,
    db: Session = Depends(get_db),
):
    return price_service.suggest_price(body, db)

