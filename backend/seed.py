"""KalaHaat – seed script: craft reference data and demo listings.

Run with:  python seed.py
Creates the DB tables (if they don't exist) and inserts:
  - 3 craft reference entries (Kasuti, Beedu, Shell Craft)
  - 3 demo artisan users with profiles
  - 15 demo listings with stories and placeholder images
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
    OrderStatus,
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
        # ── Craft Reference ──────────────────────────────────────────
        craft_refs = [
            CraftReference(
                craft_type="Kasuti",
                origin_text=(
                    "Kasuti is a traditional form of embroidery practised in northern Karnataka, "
                    "particularly in Dharwad, Belgaum, and surrounding districts. Its origins trace "
                    "back to the Chalukyan period (6th–12th century). The word 'Kasuti' derives from "
                    "'kai' (hand) and 'suti' (cotton), literally meaning 'hand-worked cotton'. It is "
                    "characterised by intricate geometric patterns worked on handloom fabric using "
                    "pure cotton or silk threads, with four distinct stitches: Gavanti, Murgi, Negi, "
                    "and Menthi."
                ),
                premium_multiplier=1.5,
                notes=(
                    "Dense Kasuti with all four stitch types commands a higher premium. "
                    "A single saree pallu can take 200+ hours. "
                    "Recognised as a Geographical Indication (GI) tagged craft of Karnataka."
                ),
            ),
            CraftReference(
                craft_type="Beedu",
                origin_text=(
                    "Beedu craft (also spelled 'Bidri' or 'Bidriware' in its metal form) "
                    "originates from the Deccan plateau region. Coastal Karnataka artisans have "
                    "adapted the tradition, creating decorative items using locally sourced materials "
                    "like coconut shell, wood, and metal inlay. The craft involves intricate carving "
                    "and inlay work, often depicting scenes from mythology, nature motifs, and "
                    "geometric patterns inspired by temple architecture."
                ),
                premium_multiplier=1.3,
                notes=(
                    "3D objects; if possible, provide a GLB model. "
                    "Complexity depends on fineness of inlay and number of materials used."
                ),
            ),
            CraftReference(
                craft_type="Shell Craft",
                origin_text=(
                    "Coastal shell craft is a living tradition along the Karnataka and Goa coastline. "
                    "Artisans collect shells from beaches and rivers, cleaning, cutting, and assembling "
                    "them into decorative and functional items — jewellery, wall hangings, lamp shades, "
                    "and figurines. Each piece reflects the marine heritage of the region. The craft "
                    "supports coastal livelihoods and has been passed down through fishing communities "
                    "for generations."
                ),
                premium_multiplier=1.2,
                notes=(
                    "Relatively lower premium due to accessible materials, but fine lacework "
                    "and artistic composition can push complexity higher."
                ),
            ),
        ]

        for ref in craft_refs:
            existing = db.get(CraftReference, ref.craft_type)
            if not existing:
                db.add(ref)

        db.flush()

        # ── Demo Artisans ────────────────────────────────────────────
        artisans_data = [
            {
                "phone": "+919876543001",
                "name": "Savitri Devi",
                "craft_types": "Kasuti",
                "village": "Dharwad",
                "years_practising": 25,
                "bio": "Third-generation Kasuti embroiderer. Learned from her grandmother. Specialises in bridal sarees with all four traditional stitches.",
            },
            {
                "phone": "+919876543002",
                "name": "Ramesh Shetty",
                "craft_types": "Beedu",
                "village": "Udupi",
                "years_practising": 15,
                "bio": "Creates decorative items using coconut shell and metal inlay. Known for his temple-inspired motifs and nature scenes.",
            },
            {
                "phone": "+919876543003",
                "name": "Lakshmi Naik",
                "craft_types": "Shell Craft",
                "village": "Malpe",
                "years_practising": 12,
                "bio": "Collects shells from the Malpe beach and transforms them into stunning jewellery and home décor pieces.",
            },
        ]

        artisan_users = []
        for data in artisans_data:
            user = db.query(User).filter(User.phone == data["phone"]).first()
            if not user:
                user = User(
                    phone=data["phone"],
                    name=data["name"],
                    role=UserRole.artisan,
                )
                db.add(user)
                db.flush()

                profile = ArtisanProfile(
                    user_id=user.id,
                    craft_types=data["craft_types"],
                    village=data["village"],
                    years_practising=data["years_practising"],
                    bio=data["bio"],
                )
                db.add(profile)
            artisan_users.append(user)

        db.flush()

        # ── Demo Listings ────────────────────────────────────────────
        listings_data = [
            # ─── Kasuti (Savitri Devi) ───
            {
                "artisan": 0,
                "title": "Kasuti Embroidered Silk Saree — Peacock Motif",
                "description": "A rich ilkal silk saree with hand-embroidered Kasuti peacock motifs on the pallu and border. Uses all four traditional stitches: Gavanti, Murgi, Negi, and Menthi.",
                "craft_type": "Kasuti",
                "materials": "Ilkal silk, cotton thread, natural dyes",
                "technique": "Four-stitch Kasuti (Gavanti, Murgi, Negi, Menthi)",
                "dimensions": "5.5m x 1.2m saree with 0.8m pallu",
                "hours_to_make": 200,
                "price_inr": 12500,
                "stock": 1,
                "story_origin": "This saree continues a 900-year-old embroidery tradition from the Chalukyan era of Karnataka.",
                "story_process": "Savitri Devi spent over 200 hours hand-stitching every motif. The peacock design uses all four Kasuti stitches, making it among the most complex pieces in her collection.",
            },
            {
                "artisan": 0,
                "title": "Kasuti Table Runner — Temple Border",
                "description": "Handloom cotton table runner with intricate Kasuti temple border pattern in deep maroon thread.",
                "craft_type": "Kasuti",
                "materials": "Handloom cotton, pure cotton thread",
                "technique": "Gavanti and Negi stitch",
                "dimensions": "150cm x 35cm",
                "hours_to_make": 40,
                "price_inr": 2800,
                "stock": 3,
                "story_origin": "Temple borders in Kasuti represent the gopurams of Karnataka's ancient temples.",
                "story_process": "Each runner takes about 40 hours of focused work, with the temple motifs requiring precise counting of warp and weft threads.",
            },
            {
                "artisan": 0,
                "title": "Kasuti Cushion Cover Set — Lotus Pattern",
                "description": "Set of 2 cushion covers with delicate Kasuti lotus patterns on cream handloom fabric.",
                "craft_type": "Kasuti",
                "materials": "Handloom cotton, silk thread",
                "technique": "Murgi and Menthi stitch",
                "dimensions": "40cm x 40cm each",
                "hours_to_make": 30,
                "price_inr": 1800,
                "stock": 5,
                "story_origin": "The lotus motif symbolises purity and beauty in Karnataka's textile traditions.",
                "story_process": "Savitri uses the Murgi stitch for outlines and fills with the reversible Menthi stitch, ensuring both sides of the fabric look equally beautiful.",
            },
            {
                "artisan": 0,
                "title": "Kasuti Blouse Piece — Chariot Design",
                "description": "Unstitched blouse piece with Kasuti chariot (ratha) design, perfect for pairing with a plain silk saree.",
                "craft_type": "Kasuti",
                "materials": "Raw silk, cotton thread",
                "technique": "All four Kasuti stitches",
                "dimensions": "1m x 0.8m",
                "hours_to_make": 45,
                "price_inr": 3200,
                "stock": 2,
                "story_origin": "The ratha (chariot) motif is inspired by the grand temple chariots of Hampi and other Karnataka pilgrimage towns.",
                "story_process": "The chariot design demands mastery of all four Kasuti stitches. Each chariot wheel alone requires several hours of meticulous counting.",
            },
            {
                "artisan": 0,
                "title": "Kasuti Wall Hanging — Nandi Bull",
                "description": "Framed wall art featuring the sacred Nandi bull in traditional Kasuti embroidery on ecru fabric.",
                "craft_type": "Kasuti",
                "materials": "Handloom cotton, silk thread, wooden frame",
                "technique": "Gavanti and Murgi stitch",
                "dimensions": "30cm x 30cm (framed)",
                "hours_to_make": 25,
                "price_inr": 1500,
                "stock": 4,
                "story_origin": "Nandi, the sacred bull, is a beloved motif in Karnataka's craft traditions, representing devotion and strength.",
                "story_process": "This piece is ideal for displaying the beauty of Kasuti as art. The Nandi figure is rendered in fine Gavanti stitch with Murgi outlining.",
            },
            # ─── Beedu (Ramesh Shetty) ───
            {
                "artisan": 1,
                "title": "Coconut Shell Carved Lamp — Ganesha",
                "description": "A handcrafted table lamp carved from a whole coconut shell, featuring an intricate Ganesha cutout that casts beautiful shadow patterns.",
                "craft_type": "Beedu",
                "materials": "Coconut shell, LED bulb holder, wooden base",
                "technique": "Shell carving and piercing",
                "dimensions": "18cm height, 12cm diameter",
                "hours_to_make": 12,
                "price_inr": 1200,
                "stock": 6,
                "story_origin": "Coconut shell carving is a sustainable craft tradition of coastal Karnataka, turning agricultural waste into art.",
                "story_process": "Ramesh selects mature coconut shells, cleans and sands them, then carefully draws and carves the Ganesha figure freehand with fine chisels.",
            },
            {
                "artisan": 1,
                "title": "Wood and Metal Inlay Box — Floral",
                "description": "A small jewellery box with rosewood body and brass inlay in a floral pattern inspired by Hoysala temple carvings.",
                "craft_type": "Beedu",
                "materials": "Rosewood, brass sheet, lacquer finish",
                "technique": "Metal inlay on wood",
                "dimensions": "15cm x 10cm x 6cm",
                "hours_to_make": 20,
                "price_inr": 2200,
                "stock": 3,
                "story_origin": "Metal inlay on wood draws from the Bidriware and Hoysala sculpting traditions of Karnataka.",
                "story_process": "Ramesh carves channels in the rosewood, then hammers thin brass strips into the grooves. The box is finished with natural lacquer for durability.",
            },
            {
                "artisan": 1,
                "title": "Carved Coconut Shell Bowl Set",
                "description": "Set of 3 serving bowls carved from coconut shells, polished to a natural sheen. Food-safe finish.",
                "craft_type": "Beedu",
                "materials": "Coconut shell, food-safe oil finish",
                "technique": "Shell carving and shaping",
                "dimensions": "12cm diameter each",
                "hours_to_make": 8,
                "price_inr": 900,
                "stock": 10,
                "story_origin": "Coastal Karnataka communities have used coconut shells as vessels for centuries, turning everyday objects into crafted pieces.",
                "story_process": "Each shell is cut, shaped on a lathe, sanded smooth, and finished with food-safe coconut oil to bring out the natural grain.",
            },
            {
                "artisan": 1,
                "title": "Wooden Wall Panel — Yakshagana Mask",
                "description": "Hand-carved wooden wall panel depicting a Yakshagana performer's crown and face, painted with natural pigments.",
                "craft_type": "Beedu",
                "materials": "Jackfruit wood, natural pigments, lacquer",
                "technique": "Wood carving and painting",
                "dimensions": "45cm x 30cm",
                "hours_to_make": 35,
                "price_inr": 4500,
                "stock": 2,
                "story_origin": "Yakshagana is a centuries-old theatre form of coastal Karnataka. This panel captures the dramatic headgear of a Yakshagana artist.",
                "story_process": "Ramesh carves the panel from a single piece of jackfruit wood, then paints it using traditional natural pigments mixed with gum arabic.",
            },
            {
                "artisan": 1,
                "title": "Decorative Coconut Shell Pendant Lamp",
                "description": "Hanging pendant lamp crafted from a large coconut shell with geometric cutout patterns. Creates stunning light play.",
                "craft_type": "Beedu",
                "materials": "Coconut shell, jute rope, LED fixture",
                "technique": "Shell piercing and geometric carving",
                "dimensions": "20cm diameter, 50cm hanging length",
                "hours_to_make": 15,
                "price_inr": 1800,
                "stock": 4,
                "story_origin": "Geometric patterns in coastal crafts often mirror the wave patterns and net designs of fishing communities.",
                "story_process": "The shell is marked with a compass for perfect geometric symmetry, then each hole is drilled and shaped by hand.",
            },
            # ─── Shell Craft (Lakshmi Naik) ───
            {
                "artisan": 2,
                "title": "Shell Necklace — Cowrie and Pearl",
                "description": "Handcrafted statement necklace combining natural cowrie shells with freshwater pearls on a cotton cord.",
                "craft_type": "Shell Craft",
                "materials": "Cowrie shells, freshwater pearls, waxed cotton cord",
                "technique": "Shell drilling and stringing",
                "dimensions": "45cm length, adjustable",
                "hours_to_make": 6,
                "price_inr": 650,
                "stock": 8,
                "story_origin": "Cowrie shells were once used as currency along the Indian coast. Today they live on as cherished ornaments.",
                "story_process": "Lakshmi hand-picks matching cowrie shells from the beach, drills them carefully, and strings them with pearls for a modern coastal look.",
            },
            {
                "artisan": 2,
                "title": "Shell Mosaic Wall Hanging — Turtle",
                "description": "A decorative wall piece featuring a sea turtle mosaic made from assorted beach shells on a wooden backing.",
                "craft_type": "Shell Craft",
                "materials": "Assorted beach shells, plywood, adhesive, lacquer",
                "technique": "Shell mosaic and arrangement",
                "dimensions": "30cm x 25cm",
                "hours_to_make": 10,
                "price_inr": 1100,
                "stock": 5,
                "story_origin": "Sea turtles nest on the Karnataka coast every year. This piece celebrates the marine life of the region.",
                "story_process": "Each shell is sorted by size and colour, then arranged piece by piece to form the turtle shape. The final piece is sealed with marine lacquer.",
            },
            {
                "artisan": 2,
                "title": "Shell Wind Chime — Ocean Breeze",
                "description": "A melodic wind chime made with driftwood and assorted shells. Each chime produces a soft, natural tinkling sound.",
                "craft_type": "Shell Craft",
                "materials": "Driftwood, shells, fishing line, metal ring",
                "technique": "Shell selection and suspension",
                "dimensions": "40cm length",
                "hours_to_make": 4,
                "price_inr": 450,
                "stock": 12,
                "story_origin": "Wind chimes have been part of coastal home décor for generations, bringing the sound of the sea indoors.",
                "story_process": "Lakshmi collects driftwood and shells that produce the best sounds when struck together, assembling each chime for tonal balance.",
            },
            {
                "artisan": 2,
                "title": "Shell Photo Frame — Beach Memories",
                "description": "A handcrafted photo frame adorned with an array of tiny shells, starfish, and sea glass. Holds a 5x7 inch photo.",
                "craft_type": "Shell Craft",
                "materials": "MDF frame, shells, starfish, sea glass, adhesive",
                "technique": "Shell arrangement and adhesion",
                "dimensions": "22cm x 17cm (fits 5×7 photo)",
                "hours_to_make": 5,
                "price_inr": 550,
                "stock": 7,
                "story_origin": "Coastal artisans transform beach treasures into keepsakes that carry the memory of the sea.",
                "story_process": "Each frame is individually designed — no two are alike. Lakshmi arranges shells by size, creating a flowing border around the photo opening.",
            },
            {
                "artisan": 2,
                "title": "Shell Earrings — Conch Drop",
                "description": "Elegant drop earrings carved from small conch shells with silver-plated hooks. Lightweight and comfortable.",
                "craft_type": "Shell Craft",
                "materials": "Conch shell, silver-plated hooks",
                "technique": "Shell carving and polishing",
                "dimensions": "4cm drop length",
                "hours_to_make": 3,
                "price_inr": 350,
                "stock": 15,
                "story_origin": "Conch shells hold deep spiritual significance in Indian culture, symbolising the sacred sound of Om.",
                "story_process": "Each earring is carved from a single small conch, shaped on a fine grinding wheel, polished to a natural lustre, and fitted with hypoallergenic hooks.",
            },
        ]

        for data in listings_data:
            # Check if listing with this title already exists for this artisan
            artisan = artisan_users[data["artisan"]]
            existing = (
                db.query(Listing)
                .filter(Listing.artisan_id == artisan.id, Listing.title == data["title"])
                .first()
            )
            if existing:
                continue

            listing = Listing(
                artisan_id=artisan.id,
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

            # Create story
            # Build price rationale
            craft_ref = db.get(CraftReference, data["craft_type"])
            multiplier = craft_ref.premium_multiplier if craft_ref else 1.0
            price_rationale = {
                "materials_cost": round(data["price_inr"] * 0.2, 0),
                "labour_hours": data["hours_to_make"],
                "hourly_wage": settings.FAIR_HOURLY_WAGE_INR,
                "craft_premium": multiplier,
                "explanation": f"Fair price based on {data['hours_to_make']}h of skilled work at ₹{settings.FAIR_HOURLY_WAGE_INR}/h with {data['craft_type']} craft premium of {multiplier}x",
            }

            story = Story(
                listing_id=listing.id,
                origin_text=data["story_origin"],
                process_text=data["story_process"],
                price_rationale_json=json.dumps(price_rationale),
            )
            db.add(story)

            # Add a placeholder image reference
            image = ListingImage(
                listing_id=listing.id,
                url=f"https://placehold.co/600x400/e8d5b7/3d2b1f?text={data['craft_type'].replace(' ', '+')}",
                position=0,
            )
            db.add(image)

        db.commit()
        print("✅ Seed data inserted successfully!")
        print(f"   - {len(craft_refs)} craft reference entries")
        print(f"   - {len(artisans_data)} demo artisans")
        print(f"   - {len(listings_data)} demo listings with stories")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
