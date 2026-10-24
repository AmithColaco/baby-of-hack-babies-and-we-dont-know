"""KAARIGAR – Core Product Catalogue.

Serves as the authoritative product catalogue source for the AI Space Stylist,
mirroring the 6 core artisanal masterpieces defined in the frontend
(frontend/src/data/craftsData.ts) and merging dynamically with published
listings from the database.
"""

from __future__ import annotations

from typing import Any, Optional
from sqlalchemy.orm import Session

from app.models import Listing, ListingStatus

# 6 Core Heritage Crafts
CORE_CATALOGUE: list[dict[str, Any]] = [
    {
        "id": "pahari-miniature",
        "title": "Radha & Krishna in the Groves of Kangra",
        "craftTradition": "Pahari Miniature Painting",
        "category": "paintings",
        "price": 48500.0,
        "currency": "INR",
        "artisan": "Pandit Ram Swaroop Sharma",
        "artisanTitle": "National Master Artist · 4th Generation Wasli Painter",
        "region": "Kangra Valley",
        "state": "Himachal Pradesh",
        "dimensions": "28.5 cm × 21.0 cm (Framed: 42 cm × 34 cm)",
        "materials": [
            "Handmade Wasli Paper",
            "Lapis Lazuli (Ultramarine)",
            "Malachite (Mineral green)",
            "Cinnabar (Vermilion)",
            "24K Beaten Gold Leaf",
        ],
        "technique": "Single-hair lining (kalam-kaari), agate stone burnishing, gum acacia binding",
        "image": "/images/pahari.jpg",
        "colorPalette": ["#1C2E4A", "#E2A838", "#8A2D23", "#2D5A3A"],
        "colorNames": ["Deep Indigo / Lapis", "Warm Ochre / Gold", "Crimson Vermilion", "Forest Malachite"],
        "suggestedPlacements": ["wall decor", "curated art wall", "reading nook focal point"],
        "styleAffinity": ["traditional-indian", "eclectic", "contemporary-heritage"],
    },
    {
        "id": "jaipur-blue-pottery",
        "title": "Cobalt Meena Arabesque Urn",
        "craftTradition": "Jaipur Blue Pottery",
        "category": "ceramics",
        "price": 24000.0,
        "currency": "INR",
        "artisan": "Mahesh Kumar & Sanganer Guild",
        "artisanTitle": "Master Ceramist · UNESCO Seal of Excellence",
        "region": "Sanganer, Jaipur",
        "state": "Rajasthan",
        "dimensions": "38.0 cm Height × 22.5 cm Diameter",
        "materials": [
            "Ground Quartz Rock (70%)",
            "Recycled Glass Powder",
            "Natural Katira Gond",
            "Cobalt Oxide & Copper Carbonate",
        ],
        "technique": "Non-clay quartz dough molding, freehand oxide brushwork, borax glaze wood firing",
        "image": "/images/bluepottery.jpg",
        "colorPalette": ["#0A4275", "#1EA5C4", "#FAF7F2", "#EBB036"],
        "colorNames": ["Cobalt Royal Blue", "Turquoise / Cerulean", "Crisp Ivory", "Mustard Gold"],
        "suggestedPlacements": ["shelf accent", "entryway console", "table centerpiece", "mantelpiece"],
        "styleAffinity": ["mediterranean", "contemporary", "minimalist", "traditional-indian", "scandinavian"],
    },
    {
        "id": "chanderi-handwoven-silk",
        "title": "Chanderi Royal Peacock Zari Weave",
        "craftTradition": "Handwoven Chanderi Brocade",
        "category": "textiles",
        "price": 36500.0,
        "currency": "INR",
        "artisan": "Master Weaver Bismillah Ansari",
        "artisanTitle": "Sant Kabir National Awardee · 5th Generation Weaver",
        "region": "Chanderi",
        "state": "Madhya Pradesh",
        "dimensions": "5.5 m Length × 1.15 m Width",
        "materials": [
            "Pure Mulberry Silk Warp",
            "Fine 120s Count Cotton Weft",
            "Real Silver Electroplated Gold Zari",
            "Natural Madder Root Dye",
        ],
        "technique": "Pit loom weaving with extra-weft kadwa interlocking technique",
        "image": "/images/textile.jpg",
        "colorPalette": ["#7A1C29", "#E0A838", "#1F2A38", "#EDE6D6"],
        "colorNames": ["Rich Burgundy / Madder", "Antique Gold Zari", "Deep Slate Charcoal", "Warm Cream"],
        "suggestedPlacements": ["draped textile", "framed fabric panel", "statement throw", "lounge accent"],
        "styleAffinity": ["luxurious-traditional", "bohemian", "warm-minimalist", "eclectic"],
    },
    {
        "id": "bastar-dhokra-brass",
        "title": "Bastar Lost-Wax Ritual Guardian Horse",
        "craftTradition": "Bastar Dhokra Lost-Wax Metalcraft",
        "category": "metalcraft",
        "price": 32000.0,
        "currency": "INR",
        "artisan": "Sukhruram Ghadwa",
        "artisanTitle": "Tribal Master Sculptor · Ghadwa Community",
        "region": "Kondagaon, Bastar",
        "state": "Chhattisgarh",
        "dimensions": "34.0 cm Height × 29.5 cm Length × 12.0 cm Depth",
        "materials": [
            "Bell Metal Bronze Alloy (78% Copper, 22% Tin)",
            "Forest Beeswax & Dammar Resin",
            "Alluvial Riverbed Clay",
        ],
        "technique": "Lost-wax casting (Cire Perdue), hand-extruded wax filigree cording",
        "image": "/images/dhokra.jpg",
        "colorPalette": ["#A07830", "#4B4228", "#2D4436", "#E8D5B0"],
        "colorNames": ["Burnished Brass / Bronze", "Dark Patina Bronze", "Verdigris Olive", "Warm Sandstone"],
        "suggestedPlacements": ["desk accent", "coffee table sculptural anchor", "bookshelf accent", "sideboard centerpiece"],
        "styleAffinity": ["modern-industrial", "rustic", "wabi-sabi", "contemporary", "tribal-heritage"],
    },
    {
        "id": "channapatna-wood-sculpture",
        "title": "Temple Spire & Avian Harmony Totem",
        "craftTradition": "Channapatna Lathe-Turned Woodcraft",
        "category": "woodcraft",
        "price": 18500.0,
        "currency": "INR",
        "artisan": "Syed Khaleel & Sons",
        "artisanTitle": "Master Wood Turner · 38 Years Atelier Practice",
        "region": "Channapatna, Ramanagara",
        "state": "Karnataka",
        "dimensions": "52.0 cm Height × 15.0 cm Base Diameter",
        "materials": [
            "Aale Mara / Ivory Wood (Wrightia tinctoria)",
            "Indian Rosewood",
            "Natural Kerria Lacca Vegetable Lac",
            "Turmeric, Indigo & Vermilion Dyes",
        ],
        "technique": "Lathe wood-turning, frictional vegetable lac application, buffed leaf finish",
        "image": "/images/woodcraft.jpg",
        "colorPalette": ["#A64B2A", "#D99B26", "#3D2817", "#EFE3CE"],
        "colorNames": ["Terracotta Orange", "Turmeric Amber", "Deep Walnut Brown", "Natural Ivory Wood"],
        "suggestedPlacements": ["floor accent", "pedestal", "tall bookshelf niche", "minimalist corner"],
        "styleAffinity": ["scandinavian", "mid-century modern", "playful-contemporary", "minimalist"],
    },
    {
        "id": "kundan-meenakari-jewellery",
        "title": "Navratna Polki & Enamel Kundan Amulet",
        "craftTradition": "Jaipur Royal Kundan & Meenakari",
        "category": "jewellery",
        "price": 89000.0,
        "currency": "INR",
        "artisan": "Sunar Govind Lal Meenakar",
        "artisanTitle": "Royal Guild Court Goldsmith · 7th Generation Meenakar",
        "region": "Old Walled City, Jaipur",
        "state": "Rajasthan",
        "dimensions": "7.8 cm Height × 5.4 cm Width",
        "materials": [
            "24K Refined Kundan Gold Foil",
            "22K Yellow Gold Base",
            "Uncut Natural Polki Diamonds",
            "Colombian Emerald Cabochon",
            "Vitreous Champlevé Enamel",
        ],
        "technique": "Ghaat shaping, Khudai engraving, Meenakari enamel firing, Jadai setting",
        "image": "/images/jewellery.jpg",
        "colorPalette": ["#A8201A", "#EC9A29", "#0F8B8D", "#143642"],
        "colorNames": ["Ruby Enamel Red", "Rich Gold Leaf", "Emerald / Peacock Cyan", "Midnight Navy"],
        "suggestedPlacements": ["display vitrine", "curated vanity tray", "collector shadowbox"],
        "styleAffinity": ["royal-heritage", "maximalist", "curio-cabinet", "glamour-eclectic"],
    },
]


def get_all_catalogue_products(db: Optional[Session] = None) -> list[dict[str, Any]]:
    """Retrieve full catalogue: core flagship pieces plus any published DB listings."""
    core_ids = {c["id"] for c in CORE_CATALOGUE}
    catalogue = list(CORE_CATALOGUE)

    if db is not None:
        try:
            db_listings = (
                db.query(Listing)
                .filter(Listing.status == ListingStatus.PUBLISHED)
                .all()
            )
            for item in db_listings:
                if str(item.id) in core_ids:
                    continue  # already in core catalogue with rich curatorial metadata
                img_url = "/images/textile.jpg"
                if item.images and len(item.images) > 0:
                    raw_url = item.images[0].url
                    img_url = raw_url

                materials_list = (
                    [m.strip() for m in item.materials.split(",") if m.strip()]
                    if item.materials
                    else ["Authentic Coastal Materials"]
                )

                artisan_name = item.artisan.name if item.artisan else "Coastal Master Artisan"
                region = "Coastal Karnataka"
                if item.artisan and item.artisan.artisan_profile:
                    region = item.artisan.artisan_profile.village or region

                catalogue.append({
                    "id": str(item.id),
                    "title": item.title,
                    "craftTradition": item.craft_type,
                    "category": "crafts",
                    "price": float(item.price_inr),
                    "currency": "INR",
                    "artisan": artisan_name,
                    "artisanTitle": "Master Craftsman",
                    "region": region,
                    "state": "Karnataka",
                    "dimensions": "",  # dimensions not explicitly guaranteed
                    "materials": materials_list,
                    "technique": item.technique or "Traditional artisan technique",
                    "image": img_url,
                    "colorPalette": ["#8A4B38", "#D4A373", "#CCD5AE"],
                    "colorNames": ["Terracotta Earth", "Sandy Ochre", "Sage Khadi"],
                    "suggestedPlacements": ["shelf accent", "table centerpiece"],
                    "styleAffinity": ["traditional-indian", "rustic"],
                })
        except Exception:
            pass  # Fall back to core catalogue cleanly

    return catalogue
