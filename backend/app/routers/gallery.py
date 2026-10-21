"""KalaHaat – gallery router.

Endpoint:
  GET /gallery – compact payload with position hints for the 3D scene
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Listing, ListingImage, ListingStatus, User
from app.schemas import GalleryItem

router = APIRouter()


@router.get("", response_model=list[GalleryItem], summary="Gallery data for 3D scene")
def get_gallery_items(
    craft: str | None = Query(None, description="Filter by craft type / wing"),
    db: Session = Depends(get_db),
):
    """Return a compact list of published listings with position hints
    for the react-three-fiber gallery.

    Each item includes: id, title, price, craft_type, first image URL,
    artisan name, gallery wing, and an auto-generated position hint
    (sequential index within the wing).
    """
    query = (
        db.query(Listing)
        .filter(Listing.status == ListingStatus.PUBLISHED)
        .options(
            joinedload(Listing.images),
            joinedload(Listing.artisan),
        )
        .order_by(Listing.gallery_wing, Listing.created_at)
    )
    if craft:
        query = query.filter(Listing.craft_type == craft)

    listings = query.all()

    # Deduplicate from joinedload
    seen = set()
    unique = []
    for l in listings:
        if l.id not in seen:
            seen.add(l.id)
            unique.append(l)

    # Build items with sequential position per wing
    wing_counters: dict[str, int] = {}
    items = []
    for listing in unique:
        wing = listing.gallery_wing or listing.craft_type
        pos = wing_counters.get(wing, 0)
        wing_counters[wing] = pos + 1

        # Pick first image
        image_url = ""
        if listing.images:
            sorted_imgs = sorted(listing.images, key=lambda img: img.position)
            image_url = sorted_imgs[0].url

        items.append(GalleryItem(
            id=listing.id,
            title=listing.title,
            price_inr=listing.price_inr,
            craft_type=listing.craft_type,
            image_url=image_url,
            artisan_name=listing.artisan.name if listing.artisan else "",
            gallery_wing=wing,
            position_hint=pos,
        ))

    return items
