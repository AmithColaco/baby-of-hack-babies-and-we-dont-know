"""KalaHaat – pytest fixtures and configuration."""

import os
import sys
from pathlib import Path
import pytest

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database import Base, SessionLocal, engine
from app.models import CraftReference


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Ensure database tables and baseline craft references exist before running tests."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(CraftReference).count() == 0:
            craft_refs = [
                CraftReference(
                    craft_type="Kasuti",
                    origin_text="Kasuti is a traditional form of embroidery practised in northern Karnataka.",
                    premium_multiplier=1.5,
                    notes="Dense Kasuti commands a higher premium.",
                ),
                CraftReference(
                    craft_type="Beedu",
                    origin_text="Beedu grass mat weaving is an indigenous craft of coastal Karnataka.",
                    premium_multiplier=1.2,
                    notes="Hand-cut riverbed reeds.",
                ),
                CraftReference(
                    craft_type="Shell Craft",
                    origin_text="Shell craft is rooted in coastal Karwar and Gokarna.",
                    premium_multiplier=1.1,
                    notes="Sustainably gathered seashells.",
                ),
            ]
            db.add_all(craft_refs)
            db.commit()

        # Ensure at least one demo artisan and published listing exists
        from app.models import User, UserRole, ArtisanProfile, Listing, ListingStatus, ListingImage, Story
        if db.query(Listing).filter(Listing.status == ListingStatus.PUBLISHED).count() == 0:
            artisan = db.query(User).filter(User.phone == "+919845012345").first()
            if not artisan:
                artisan = User(
                    name="Parvati Devi",
                    phone="+919845012345",
                    role=UserRole.artisan,
                    language="kn",
                )
                db.add(artisan)
                db.flush()
                profile = ArtisanProfile(
                    user_id=artisan.id,
                    craft_types="Kasuti",
                    village="Ankola",
                    years_practising=28,
                    bio="Master Kasuti custodian",
                )
                db.add(profile)
                db.flush()

            listing = Listing(
                artisan_id=artisan.id,
                title="Kasuti Embroidered Chariot & Peacock Saree",
                description="Masterwork handloom saree with authentic Kasuti needlework.",
                craft_type="Kasuti",
                materials="Pure cotton, natural indigo",
                technique="Gavanti & Murgi stitches",
                dimensions="5.5m x 1.2m",
                hours_to_make=80.0,
                price_inr=5200.0,
                stock=5,
                status=ListingStatus.PUBLISHED,
                gallery_wing="Kasuti",
            )
            db.add(listing)
            db.flush()
            image = ListingImage(
                listing_id=listing.id,
                url="/images/textile.jpg",
                position=0,
            )
            story = Story(
                listing_id=listing.id,
                origin_text="Centuries of living heritage memory.",
                process_text="Hand counting every thread.",
                price_rationale_json="{}",
            )
            db.add_all([image, story])
            db.commit()

        # Guarantee published listings have stock available for checkout testing
        db.query(Listing).filter(Listing.status == ListingStatus.PUBLISHED, Listing.stock < 5).update({"stock": 10})
        db.commit()
    finally:
        db.close()
    yield
