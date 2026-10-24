"""KAARIGAR – seed script: craft reference data, demo users, and authentic craft listings.

Run with:  python seed.py
Creates the DB tables (if they don't exist) and inserts:
  - 9 craft reference entries (all protected traditions)
  - Demo artisan and collector users with profile records (matches README credentials)
  - 6 flagship museum masterpieces (exact IDs matching frontend catalogue)
  - 15 coastal craft listings with stories and provenance
"""

import json
import sys
import os

# Add parent to path so we can import app modules
sys.path.insert(0, os.path.dirname(__file__))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import (
    ArtisanProfile,
    CraftReference,
    Listing,
    ListingImage,
    ListingStatus,
    Story,
    User,
    UserRole,
)


def seed():
    """Insert seed data."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── 1. Craft References ──────────────────────────────────────
        craft_refs = [
            CraftReference(
                craft_type="Pahari Miniature",
                origin_text="Circa 1780 Kangra Kalam. Wasli paper, lapis lazuli, 24K gold foil, and single-hair squirrel brushwork.",
                premium_multiplier=1.8,
                notes="Requires 140+ hours per masterwork. Protected Himalayan court tradition.",
            ),
            CraftReference(
                craft_type="Jaipur Blue Pottery",
                origin_text="Clay-free quartz dough formulation glazed with natural cobalt and copper oxides, wood-fired in Sanganer.",
                premium_multiplier=1.4,
                notes="Zero clay shrinkage; non-ferrous ceramic formulation with Turko-Persian lineage.",
            ),
            CraftReference(
                craft_type="Chanderi Silk",
                origin_text="Pure mulberry silk warp with fine un-degummed cotton weft, woven on pit looms with electroplated zari.",
                premium_multiplier=1.6,
                notes="Vedic and Mughal court weaving lineage with interlocking kadwa extra-weft.",
            ),
            CraftReference(
                craft_type="Bastar Dhokra",
                origin_text="4,000-year Harappan cire-perdue lost-wax bell-metal bronze casting by indigenous Ghadwa metalsmiths.",
                premium_multiplier=1.6,
                notes="Single-use alluvial riverbed clay molds and pure forest beeswax filigree.",
            ),
            CraftReference(
                craft_type="Channapatna Woodcraft",
                origin_text="Turned seasoned Ivory Wood (Wrightia tinctoria) sealed with friction-melted vegetable lac dyes.",
                premium_multiplier=1.3,
                notes="Tipu Sultan royal court atelier lineage in Karnataka.",
            ),
            CraftReference(
                craft_type="Kundan & Meenakari",
                origin_text="22K/24K gold champlevé vitreous enamel and uncut polki diamonds set in pure gold foil.",
                premium_multiplier=2.0,
                notes="Imperial Rajput and Mughal court jewellery guild.",
            ),
            CraftReference(
                craft_type="Kasuti",
                origin_text=(
                    "Kasuti is a traditional form of embroidery practised in northern Karnataka, "
                    "particularly in Dharwad, Belgaum, and surrounding districts. Traces back to Chalukyan dynasty (6th Century)."
                ),
                premium_multiplier=1.5,
                notes="Four stitches: Gavanti, Murgi, Negi, Menthi. GI-tagged Karnataka craft.",
            ),
            CraftReference(
                craft_type="Beedu",
                origin_text="Coastal Karnataka korai grass and coconut shell carving with metal inlays.",
                premium_multiplier=1.3,
                notes="Coastal indigenous artisans weaving sustainable riverbed reeds.",
            ),
            CraftReference(
                craft_type="Shell Craft",
                origin_text="Marine community heirloom art transforming beach cowrie shells and mother-of-pearl.",
                premium_multiplier=1.2,
                notes="Karwar and Gokarna coastal livelihood craft tradition.",
            ),
        ]

        for ref in craft_refs:
            existing = db.get(CraftReference, ref.craft_type)
            if not existing:
                db.add(ref)

        db.flush()

        # ── 2. Demo Users (Matches README credentials) ────────────────
        users_data = [
            # Artisans
            {
                "phone": "+919123456780",
                "name": "Pandit Ram Swaroop Sharma",
                "role": UserRole.artisan,
                "craft_types": "Pahari Miniature, Kasuti",
                "village": "Kangra Valley",
                "years_practising": 42,
                "bio": "4th generation Wasli painter and National Master Artist preserving Kangra Kalam court miniatures.",
            },
            {
                "phone": "+919998887777",
                "name": "Mahesh Kumar & Sanganer Guild",
                "role": UserRole.artisan,
                "craft_types": "Jaipur Blue Pottery",
                "village": "Sanganer, Jaipur",
                "years_practising": 28,
                "bio": "Master Ceramist recognized with the UNESCO Seal of Excellence.",
            },
            {
                "phone": "+919876543001",
                "name": "Savitri Devi",
                "role": UserRole.artisan,
                "craft_types": "Kasuti",
                "village": "Dharwad",
                "years_practising": 25,
                "bio": "Third-generation Kasuti embroiderer specializing in pure silk counted threadwork.",
            },
            {
                "phone": "+919876543002",
                "name": "Ramesh Shetty",
                "role": UserRole.artisan,
                "craft_types": "Beedu",
                "village": "Udupi",
                "years_practising": 15,
                "bio": "Creates decorative items using coconut shell and brass inlay with temple-inspired motifs.",
            },
            {
                "phone": "+919876543003",
                "name": "Lakshmi Naik",
                "role": UserRole.artisan,
                "craft_types": "Shell Craft",
                "village": "Malpe",
                "years_practising": 12,
                "bio": "Collects beach shells and transforms them into fine jewelry and decorative heirlooms.",
            },
            # Collectors / Patrons
            {
                "phone": "+919876543210",
                "name": "Vikramaditya Singhania",
                "role": UserRole.buyer,
                "village": "Mumbai",
                "bio": "Heritage Indian art patron and living craft connoisseur.",
            },
            {
                "phone": "+919820155432",
                "name": "Anya Shroff",
                "role": UserRole.buyer,
                "village": "Bengaluru",
                "bio": "Collector of handwoven textiles and ancient bronze sculptures.",
            },
        ]

        seeded_users: dict[str, User] = {}
        for ud in users_data:
            user = db.query(User).filter(User.phone == ud["phone"]).first()
            if not user:
                user = User(
                    phone=ud["phone"],
                    name=ud["name"],
                    role=ud["role"],
                )
                db.add(user)
                db.flush()

                if ud["role"] == UserRole.artisan:
                    profile = ArtisanProfile(
                        user_id=user.id,
                        craft_types=ud.get("craft_types", ""),
                        village=ud.get("village", ""),
                        years_practising=ud.get("years_practising", 10),
                        bio=ud.get("bio", ""),
                        verified=True,
                    )
                    db.add(profile)
            seeded_users[ud["phone"]] = user

        db.flush()

        # ── 3. Seed 6 Flagship Masterpieces (Exact Catalogue IDs) ──────
        flagship_masterpieces = [
            {
                "id": "pahari-miniature",
                "artisan_phone": "+919123456780",
                "title": "Radha & Krishna in the Groves of Kangra",
                "description": "Created over 140 meticulous hours in the high valley of Kangra, this miniature follows the late-18th century Gita Govinda lineage with 24K beaten gold foil illumination.",
                "craft_type": "Pahari Miniature",
                "materials": "Handmade Wasli Paper, Lapis Lazuli, Malachite, Cinnabar, 24K Beaten Gold Leaf",
                "technique": "Single-hair kalam-kaari, agate burnishing, gum acacia binding",
                "dimensions": "28.5 cm × 21.0 cm (Framed: 42 cm × 34 cm)",
                "hours_to_make": 140,
                "price_inr": 48500,
                "stock": 3,
                "image": "/images/pahari.jpg",
                "origin_text": "Circa 1780 revival from the Kangra Kalam court tradition of Himachal Pradesh.",
                "process_text": "Three layers of acid-free wasli paper are laminated, hand-burnished with heated agate, and illuminated with natural gemstone pigments.",
            },
            {
                "id": "jaipur-blue-pottery",
                "artisan_phone": "+919998887777",
                "title": "Cobalt Meena Arabesque Urn",
                "description": "Turned without clay using crushed quartz rock, recycled glass powder, and katira gum. Decorated with freehand cobalt oxide floral brushwork.",
                "craft_type": "Jaipur Blue Pottery",
                "materials": "Ground Quartz Rock, Recycled Glass Cullet, Natural Katira Gond, Cobalt Oxide",
                "technique": "Non-clay quartz dough molding, oxide brushwork, borax glaze wood firing",
                "dimensions": "38.0 cm Height × 22.5 cm Diameter",
                "hours_to_make": 36,
                "price_inr": 24000,
                "stock": 4,
                "image": "/images/bluepottery.jpg",
                "origin_text": "Turko-Persian glazed pottery tradition revived under Sawai Ram Singh II.",
                "process_text": "Quartz dough molded by hand, painted with fine squirrel hair brushes, and glazed at 850°C.",
            },
            {
                "id": "chanderi-handwoven-silk",
                "artisan_phone": "+919123456780",
                "title": "Chanderi Royal Peacock Zari Weave",
                "description": "Pure un-degummed mulberry silk warp with fine cotton weft, woven with extra-weft kadwa gold zari interlocking peacocks on subterranean pit looms.",
                "craft_type": "Chanderi Silk",
                "materials": "Pure Mulberry Silk Warp, Fine 120s Count Cotton Weft, Real Silver Electroplated Gold Zari",
                "technique": "Pit loom weaving with extra-weft kadwa interlocking technique",
                "dimensions": "5.5 m Length × 1.15 m Width",
                "hours_to_make": 90,
                "price_inr": 36500,
                "stock": 2,
                "image": "/images/textile.jpg",
                "origin_text": "Vedic and Scindia court handloom weaving of Pranpur, Chanderi.",
                "process_text": "Two master weavers synchronize movements across 90 hours to lock pure zari threads.",
            },
            {
                "id": "bastar-dhokra-brass",
                "artisan_phone": "+919876543002",
                "title": "Bastar Lost-Wax Ritual Guardian Horse",
                "description": "4,000-year Harappan cire-perdue cast bell metal bronze depicting the sacred tribal spirit horse of Kondagaon.",
                "craft_type": "Bastar Dhokra",
                "materials": "Recycled Brass & Bell Metal, Forest Beeswax, Riverbed Alluvial Clay, Rice Husk",
                "technique": "Lost-wax cire-perdue hollow core casting with hand-extruded wax filigree",
                "dimensions": "32.0 cm Height × 26.0 cm Length",
                "hours_to_make": 55,
                "price_inr": 32000,
                "stock": 3,
                "image": "/images/dhokra.jpg",
                "origin_text": "Harappan cire-perdue metalcraft preserved by indigenous Ghadwa tribal clans.",
                "process_text": "Clay core shaped, wrapped with fine beeswax wire ribbons, encased in secondary clay, and cast in open charcoal pits.",
            },
            {
                "id": "channapatna-wood-sculpture",
                "artisan_phone": "+919876543002",
                "title": "Temple Spire & Avian Harmony Totem",
                "description": "Turned on traditional hand lathes from seasoned Ivory Wood and colored using heat-friction applied natural vegetable lac.",
                "craft_type": "Channapatna Woodcraft",
                "materials": "Seasoned Ivory Wood (Wrightia tinctoria), Natural Tree Lac, Turmeric & Indigo Extract",
                "technique": "Lathe turning and frictional heat polishing with talc leaves",
                "dimensions": "42.0 cm Height × 14.0 cm Diameter Base",
                "hours_to_make": 24,
                "price_inr": 18500,
                "stock": 5,
                "image": "/images/woodcraft.jpg",
                "origin_text": "Tipu Sultan royal court atelier lineage in Channapatna, Karnataka.",
                "process_text": "Ivory wood turned on high-speed lathe, dyed with vegetable resin, and burnished with kewda leaf.",
            },
            {
                "id": "kundan-meenakari-necklace",
                "artisan_phone": "+919998887777",
                "title": "Navratna Imperial Champlevé Hasli",
                "description": "Uncut natural polki diamonds set in pure 24K gold foil, featuring secret five-color floral champlevé vitreous enamel on the reverse.",
                "craft_type": "Kundan & Meenakari",
                "materials": "22K Solid Gold Core, 24K Pure Beaten Gold Foil, Polki Diamonds, Vitreous Enamel",
                "technique": "Champlevé engraving, kiln vitreous enameling, jadau cold fusion",
                "dimensions": "Inner collar circumference: 38 cm",
                "hours_to_make": 120,
                "price_inr": 85000,
                "stock": 1,
                "image": "/images/jewellery.jpg",
                "origin_text": "Imperial Jaipur Rajput court jewellery guild of Johari Bazaar.",
                "process_text": "Engraved by chiteras, enameled at 800°C by meenakars, and set with polki diamonds using pure varq foil.",
            },
        ]

        for item in flagship_masterpieces:
            existing_listing = db.get(Listing, item["id"])
            artisan = seeded_users[item["artisan_phone"]]

            if not existing_listing:
                listing = Listing(
                    id=item["id"],
                    artisan_id=artisan.id,
                    title=item["title"],
                    description=item["description"],
                    craft_type=item["craft_type"],
                    materials=item["materials"],
                    technique=item["technique"],
                    dimensions=item["dimensions"],
                    hours_to_make=item["hours_to_make"],
                    price_inr=item["price_inr"],
                    stock=item["stock"],
                    status=ListingStatus.PUBLISHED,
                    gallery_wing=item["craft_type"],
                )
                db.add(listing)
                db.flush()

                story = Story(
                    listing_id=listing.id,
                    origin_text=item["origin_text"],
                    process_text=item["process_text"],
                    price_rationale_json=json.dumps({
                        "materials_cost": round(item["price_inr"] * 0.25, 0),
                        "labour_hours": item["hours_to_make"],
                        "hourly_wage": settings.FAIR_HOURLY_WAGE_INR,
                        "craft_premium": 1.6,
                        "explanation": f"Fair price based on {item['hours_to_make']}h of master craftsmanship",
                    }),
                )
                db.add(story)

                image = ListingImage(
                    listing_id=listing.id,
                    url=item["image"],
                    position=0,
                )
                db.add(image)
            else:
                # Ensure stock is positive
                if existing_listing.stock < 1:
                    existing_listing.stock = item["stock"]
                existing_listing.status = ListingStatus.PUBLISHED

        db.flush()

        # ── 4. Seed Coastal Craft Listings ───────────────────────────
        coastal_artisan_1 = seeded_users["+919876543001"]
        coastal_artisan_2 = seeded_users["+919876543002"]
        coastal_artisan_3 = seeded_users["+919876543003"]

        coastal_listings = [
            # Kasuti (Savitri Devi)
            {
                "artisan": coastal_artisan_1,
                "title": "Kasuti Embroidered Silk Saree — Peacock Motif",
                "description": "Rich ilkal silk saree with hand-embroidered Kasuti peacock motifs on the pallu and border. Uses all four traditional stitches.",
                "craft_type": "Kasuti",
                "materials": "Ilkal silk, cotton thread, natural dyes",
                "technique": "Four-stitch Kasuti (Gavanti, Murgi, Negi, Menthi)",
                "dimensions": "5.5m x 1.2m saree with 0.8m pallu",
                "hours_to_make": 200,
                "price_inr": 12500,
                "stock": 3,
                "image": "/images/kasuti.jpg",
                "story_origin": "Chalukyan dynasty 900-year living needlework heritage.",
                "story_process": "Savitri Devi counted every warp and weft thread by hand without drawing or tracing.",
            },
            {
                "artisan": coastal_artisan_1,
                "title": "Kasuti Table Runner — Temple Border",
                "description": "Handloom cotton table runner with intricate Kasuti temple border pattern in deep maroon thread.",
                "craft_type": "Kasuti",
                "materials": "Handloom cotton, pure cotton thread",
                "technique": "Gavanti and Negi stitch",
                "dimensions": "150cm x 35cm",
                "hours_to_make": 40,
                "price_inr": 2800,
                "stock": 5,
                "image": "/images/kasuti.jpg",
                "story_origin": "Temple gopuram geometric symbols of northern Karnataka.",
                "story_process": "Exact geometric symmetry on front and reverse side.",
            },
            # Beedu (Ramesh Shetty)
            {
                "artisan": coastal_artisan_2,
                "title": "Coconut Shell Carved Lamp — Ganesha",
                "description": "Handcrafted table lamp carved from whole coconut shell, casting intricate shadow patterns.",
                "craft_type": "Beedu",
                "materials": "Coconut shell, LED bulb holder, wooden base",
                "technique": "Shell carving and piercing",
                "dimensions": "18cm height, 12cm diameter",
                "hours_to_make": 12,
                "price_inr": 1200,
                "stock": 6,
                "image": "/images/beedu.jpg",
                "story_origin": "Sustainable coastal art converting natural agricultural materials into sacred lighting.",
                "story_process": "Carved freehand using hardened steel chisels.",
            },
            # Shell Craft (Lakshmi Naik)
            {
                "artisan": coastal_artisan_3,
                "title": "Shell Necklace — Cowrie and Pearl",
                "description": "Statement necklace combining natural polished beach cowrie shells with freshwater pearls.",
                "craft_type": "Shell Craft",
                "materials": "Cowrie shells, freshwater pearls, waxed cotton cord",
                "technique": "Shell drilling and stringing",
                "dimensions": "45cm length, adjustable",
                "hours_to_make": 6,
                "price_inr": 650,
                "stock": 8,
                "image": "/images/shellcraft.jpg",
                "story_origin": "Ancient maritime currency reborn as sustainable coastal ornamentation.",
                "story_process": "Each shell is hand-selected from the Malpe tideline, cut, polished, and bound.",
            },
        ]

        for data in coastal_listings:
            existing = (
                db.query(Listing)
                .filter(Listing.artisan_id == data["artisan"].id, Listing.title == data["title"])
                .first()
            )
            if existing:
                if existing.stock < 1:
                    existing.stock = data["stock"]
                continue

            listing = Listing(
                artisan_id=data["artisan"].id,
                title=data["title"],
                description=data["description"],
                craft_type=data["craft_type"],
                materials=data["materials"],
                technique=data["technique"],
                dimensions=data["dimensions"],
                hours_to_make=data["hours_to_make"],
                price_inr=data["price_inr"],
                stock=data["stock"],
                status=ListingStatus.PUBLISHED,
                gallery_wing=data["craft_type"],
            )
            db.add(listing)
            db.flush()

            story = Story(
                listing_id=listing.id,
                origin_text=data["story_origin"],
                process_text=data["story_process"],
                price_rationale_json=json.dumps({
                    "materials_cost": round(data["price_inr"] * 0.2, 0),
                    "labour_hours": data["hours_to_make"],
                    "hourly_wage": settings.FAIR_HOURLY_WAGE_INR,
                    "craft_premium": 1.3,
                }),
            )
            db.add(story)

            image = ListingImage(
                listing_id=listing.id,
                url=data["image"],
                position=0,
            )
            db.add(image)

        db.commit()
        print("✅ KAARIGAR Living Archive database seeded successfully!")
        print(f"   - {len(craft_refs)} craft reference entries")
        print(f"   - {len(users_data)} registered demo artisan & collector accounts")
        print(f"   - {len(flagship_masterpieces)} core flagship museum masterpieces seeded with exact IDs")
        print(f"   - {len(coastal_listings)} coastal tradition listings seeded")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
