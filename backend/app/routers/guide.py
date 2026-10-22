"""KalaHaat – AI guide router.

Endpoint:
  POST /guide/narrate – generate narration text for a listing (for TTS)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.data.catalogue import CORE_CATALOGUE
from app.database import get_db
from app.models import Listing, User
from app.schemas import NarrateRequest, NarrateResponse
from app.services import ai_service
from app.auth import get_current_user

router = APIRouter()


@router.post("/narrate", response_model=NarrateResponse, summary="Generate gallery guide narration")
async def narrate(
    body: NarrateRequest,
    db: Session = Depends(get_db),
):
    """Generate a short, warm narration for TTS when a visitor clicks
    a piece in the 3D gallery. Uses the listing's story data plus
    Gemini to produce a natural-sounding guide speech.
    """
    listing = (
        db.query(Listing)
        .options(
            joinedload(Listing.story),
            joinedload(Listing.artisan).joinedload(User.artisan_profile),
        )
        .filter(Listing.id == body.listing_id)
        .first()
    )
    if not listing:
        # Check core catalogue (flagship masterpieces)
        core_item = next((c for c in CORE_CATALOGUE if c["id"] == body.listing_id), None)
        if core_item:
            narration = await ai_service.generate_narration(
                title=core_item["title"],
                artisan_name=core_item.get("artisan", "Master Artisan"),
                village=core_item.get("region", "India"),
                story=core_item.get("technique", ""),
                materials=", ".join(core_item.get("materials", [])),
                technique=core_item.get("technique", ""),
                price=core_item.get("price", 0),
                language=body.language,
            )
            return NarrateResponse(narration=narration, listing_id=body.listing_id)

        raise HTTPException(status_code=404, detail="Listing not found")

    artisan_name = listing.artisan.name if listing.artisan else "Unknown artisan"
    village = ""
    if listing.artisan and listing.artisan.artisan_profile:
        village = listing.artisan.artisan_profile.village

    story_text = ""
    if listing.story:
        story_text = listing.story.origin_text or listing.story.process_text or ""

    narration = await ai_service.generate_narration(
        title=listing.title,
        artisan_name=artisan_name,
        village=village or "coastal Karnataka",
        story=story_text,
        materials=listing.materials,
        technique=listing.technique,
        price=listing.price_inr,
        language=body.language,
    )

    return NarrateResponse(narration=narration, listing_id=listing.id)
