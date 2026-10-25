"""KAARIGAR – Retrieval-Augmented Generation (RAG) Service for Heritage Chatbot.

Provides:
  1. Comprehensive multi-category knowledge corpus (Craft Traditions, Flagship Masterpieces,
     Artisan Lineages, Making Stages, Platform Economics & Provenance Policies).
  2. Hybrid Retrieval Engine (Dense Gemini Embeddings + Lexical BM25/TF-IDF Scoring).
  3. Context-Augmented Generation with Gemini 2.0 / Flash and intelligent curatorial fallback.
  4. Real catalogue product recommendation mapping and source citation attribution.
"""

from __future__ import annotations

import json
import logging
import math
import os
import re
from dataclasses import dataclass, field
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.data.catalogue import CORE_CATALOGUE, get_all_catalogue_products
from app.models import CraftReference, Listing, ListingStatus
from app.schemas import (
    ChatMessage,
    ChatbotChatResponse,
    ChatbotProductOut,
    RAGSourceOut,
)
from app.services import ai_service

logger = logging.getLogger(__name__)

# Stop words for lexical tokenization
STOP_WORDS = {
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", "by",
    "from", "about", "into", "through", "during", "is", "are", "was", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "can", "could",
    "will", "would", "shall", "should", "of", "it", "its", "this", "that", "these",
    "those", "what", "how", "why", "who", "which", "where", "tell", "me", "show",
    "give", "please", "i", "you", "we", "they", "my", "your", "our", "their", "much",
    "does", "cost", "price",
}

# In-memory vector embedding cache: {chunk_id: embedding_vector}
_EMBEDDING_CACHE: dict[str, list[float]] = {}


@dataclass
class RAGChunk:
    id: str
    title: str
    category: str  # craft_tradition, product, artisan, making_stage, platform_policy, editorial_story
    content: str
    product_id: Optional[str] = None
    tags: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


# ─────────────────────────────────────────────────────────────────────────────
# Static Curated Heritage Knowledge Corpus
# ─────────────────────────────────────────────────────────────────────────────

STATIC_KNOWLEDGE_CORPUS: list[RAGChunk] = [
    # ── Platform Policies & Economics ─────────────────────────────────────────
    RAGChunk(
        id="policy_pricing_transparency",
        title="KAARIGAR 4-Part Transparent Pricing Formula",
        category="platform_policy",
        content=(
            "KAARIGAR enforces an uncompromised 4-part transparent pricing breakdown on every craftwork:\n"
            "1. Actual Artisan Price (Base Price): 100% of this amount goes directly to the master craftsperson or guild.\n"
            "2. Platform Infrastructure Fee: A modest 5% fee dedicated strictly to secure digital archiving, 3D photogrammetry, high-resolution media hosting, and artisan technical onboarding.\n"
            "3. Applicable Taxes (GST): Exact 5% statutory goods and services tax.\n"
            "4. Total Final Price: The clear arithmetic sum (Base Price + 5% Platform Fee + 5% Tax). No hidden markups, distributor cuts, or dealer margins."
        ),
        tags=["pricing", "fee", "platform fee", "tax", "gst", "cost", "breakdown", "direct share", "margin", "fair trade"],
    ),
    RAGChunk(
        id="policy_provenance_and_authenticity",
        title="Master-Bench Inspection & Certificate of Authenticity",
        category="platform_policy",
        content=(
            "Every single piece catalogued on KAARIGAR undergoes rigorous physical master-bench examination before dispatch. "
            "Each certified item arrives with a tamper-evident, serialised Certificate of Authenticity embedded with: "
            "(1) The artisan's registered fingerprint or seal, (2) Geographical Indication (GI) registry registration number, "
            "(3) Exact material composition breakdown verified by mineral/fibre assay, and (4) An encrypted QR code that leads "
            "to the permanent digital ledger entry recording the piece's accession number, lineage, and master maker."
        ),
        tags=["authenticity", "certificate", "gi", "geographical indication", "inspection", "verification", "qr code", "genuine", "original"],
    ),
    RAGChunk(
        id="policy_escrow_and_returns",
        title="Artisan Escrow Protection & 7-Day White-Glove Inspection Window",
        category="platform_policy",
        content=(
            "To safeguard both our patrons and our master makers, patron funds are held in secure escrow upon ordering. "
            "Artisan payout is released once the piece arrives safely and the patron completes their 7-day white-glove "
            "inspection window. All shipments travel in bespoke, climate-cushioned archival crating insured for 100% of value. "
            "In the rare circumstance of transit damage, KAARIGAR provides immediate insured recovery and replacement, with zero financial liability on the artisan."
        ),
        tags=["escrow", "delivery", "shipping", "packaging", "return", "refund", "damage", "inspection", "insurance"],
    ),
    RAGChunk(
        id="policy_login_checkout",
        title="Mandatory Authentication for Checkout & Provenance Ownership",
        category="platform_policy",
        content=(
            "Patrons must sign in (via mobile OTP or credentials) before completing checkout. "
            "This ensures that ownership records, serialised certificates of authenticity, and immutable accession tracking "
            "are securely bound to the patron's verified digital profile, preventing unauthorized resale or fraudulent acquisition."
        ),
        tags=["login", "checkout", "auth", "account", "provenance", "order tracking", "security"],
    ),

    # ── Flagship Masterpieces from Core Catalogue ──────────────────────────────
    RAGChunk(
        id="prod_pahari_miniature",
        title="Radha & Krishna in the Groves of Kangra (Pahari Miniature)",
        category="product",
        product_id="pahari-miniature",
        content=(
            "Flagship Masterwork: 'Radha & Krishna in the Groves of Kangra'.\n"
            "Craft Tradition: Pahari Miniature Painting (Kangra Kalam revival, circa 1780 Gita Govinda lineage).\n"
            "Master Artist: Pandit Ram Swaroop Sharma (Chamba-Kangra Parampara Gurukulam, Himachal Pradesh).\n"
            "Base Price: ₹48,500 INR.\n"
            "Materials: Handmade Wasli Paper (laminated with rice-starch & neem paste), genuine Badakhshan Lapis Lazuli ultramarine, "
            "Deccan Malachite mineral green, Cinnabar vermilion, and 24K beaten gold leaf (varq illumination).\n"
            "Technique: Painted with a single-hair brush gathered from the throat of a Himalayan mountain squirrel. "
            "Agate stone burnishing (ghontai) imparts a cold milk-silk sheen to the paper.\n"
            "Dimensions: 28.5 cm × 21.0 cm (Framed: 42 cm × 34 cm in teak & glass mount). Weight: 1.4 kg.\n"
            "Ideal Placements: Curated art wall, reading nook focal point, intimate salon."
        ),
        tags=["pahari", "kangra", "miniature", "painting", "radha krishna", "ram swaroop sharma", "wasli", "lapis lazuli", "gold leaf", "himachal"],
    ),
    RAGChunk(
        id="prod_jaipur_blue_pottery",
        title="Cobalt Meena Arabesque Urn (Jaipur Blue Pottery)",
        category="product",
        product_id="jaipur-blue-pottery",
        content=(
            "Flagship Masterwork: 'Cobalt Meena Arabesque Urn'.\n"
            "Craft Tradition: Jaipur Blue Pottery (Turko-Persian glazed faience lineage, Sanganer, Rajasthan).\n"
            "Master Ceramist: Mahesh Kumar & Sanganer Guild (UNESCO Seal of Excellence awardee).\n"
            "Base Price: ₹24,000 INR.\n"
            "Materials: 70% Ground Quartz Rock from the Aravalli hills, 15% recycled glass powder, natural Katira Gond, "
            "Fuller's earth (Multani Mitti 5%), Cobalt Oxide & Copper Carbonate pigments, low-fire Borax & Feldspar glaze. Completely 100% clay-free.\n"
            "Technique: Hand-pressed into two-part terracotta open molds with wood ash internal cores, painted freehand with camel-hair brushes, "
            "and fired at 850°C in an indigenous wood-fired kiln.\n"
            "Dimensions: 38.0 cm Height × 22.5 cm Diameter. Weight: 3.6 kg.\n"
            "Ideal Placements: Entryway console, shelf accent, table centerpiece, mantelpiece."
        ),
        tags=["blue pottery", "jaipur", "urn", "cobalt", "ceramics", "mahesh kumar", "quartz", "sanganer", "rajasthan", "vessel"],
    ),
    RAGChunk(
        id="prod_chanderi_silk",
        title="Chanderi Royal Peacock Zari Weave (Handwoven Brocade)",
        category="product",
        product_id="chanderi-handwoven-silk",
        content=(
            "Flagship Masterwork: 'Chanderi Royal Peacock Zari Weave'.\n"
            "Craft Tradition: Handwoven Chanderi Brocade (Vedic gossamer silk tradition, Pranpur, Madhya Pradesh).\n"
            "Master Artisan: Master Weaver Bismillah Ansari (Sant Kabir National Awardee · 5th Generation Weaver).\n"
            "Base Price: ₹36,500 INR.\n"
            "Materials: Pure un-degummed Mulberry Silk warp (20/22 denier) preserving natural sericin for crystalline drape, "
            "fine 120s count cotton weft, real silver electroplated gold zari thread, natural Manjistha (madder root) crimson dye.\n"
            "Technique: Woven in subterranean earthen pit-looms with foot-treadle tension control. "
            "Extra-weft kadwa interlocking ensures each golden peacock motif is an isolated island of zari with no loose floats on the underside.\n"
            "Dimensions: 5.5 m Length × 1.15 m Width (with blouse piece). Weight: 520 g (ultra-fine gossamer).\n"
            "Ideal Placements: Draped statement textile, framed fabric panel, formal lounge accent."
        ),
        tags=["chanderi", "silk", "saree", "brocade", "zari", "bismillah ansari", "textile", "weft", "pit loom", "kadwa", "madhya pradesh"],
    ),
    RAGChunk(
        id="prod_bastar_dhokra",
        title="Bastar Lost-Wax Ritual Guardian Horse (Dhokra Bell Metal)",
        category="product",
        product_id="bastar-dhokra-brass",
        content=(
            "Flagship Masterwork: 'Bastar Lost-Wax Ritual Guardian Horse'.\n"
            "Craft Tradition: Bastar Dhokra Lost-Wax Metalcraft (Cire Perdue, 4,000-year Harappan metallurgical lineage).\n"
            "Master Sculptor: Sukhruram Ghadwa (Ghadwa tribal community, Kondagaon, Bastar, Chhattisgarh).\n"
            "Base Price: ₹32,000 INR.\n"
            "Materials: Traditional bell metal bronze alloy (78% copper, 22% tin), forest wild honeycomb beeswax, "
            "Sal tree resin (dammar), and riverbed alluvial clay with termite soil.\n"
            "Technique: Wax is extruded through hardwood presses into gossamer threads and coiled concentric spirals around an inner clay core. "
            "Molten bronze at 1200°C vaporizes the wax entirely. The clay mold is broken open with an iron mallet, rendering every casting 100% unique.\n"
            "Dimensions: 34.0 cm Height × 29.5 cm Length × 12.0 cm Depth. Weight: 4.8 kg.\n"
            "Ideal Placements: Executive desk accent, coffee table sculptural anchor, bookshelf display, sideboard centerpiece."
        ),
        tags=["dhokra", "bastar", "lost-wax", "brass", "bronze", "sukhruram ghadwa", "metalcraft", "sculpture", "horse", "chhattisgarh"],
    ),
    RAGChunk(
        id="prod_channapatna_wood",
        title="Temple Spire & Avian Harmony Totem (Channapatna Woodcraft)",
        category="product",
        product_id="channapatna-wood-sculpture",
        content=(
            "Flagship Masterwork: 'Temple Spire & Avian Harmony Totem'.\n"
            "Craft Tradition: Channapatna Lathe-Turned Woodcraft (Gombegala Ooru / Toy Town, Ramanagara, Karnataka).\n"
            "Master Craftsman: Syed Khaleel & Sons (Master Wood Turner · 38 Years Atelier Practice).\n"
            "Base Price: ₹18,500 INR.\n"
            "Materials: Sustainably harvested Aale Mara / Ivory Wood (Wrightia tinctoria), seasoned Indian Rosewood base, "
            "natural Kerria lacca vegetable resin, botanical dyes (turmeric amber, indigo blue, vermilion red).\n"
            "Technique: Hand-turned on high-speed treadle lathes, vegetable-lac sticks applied through dry friction heat, "
            "and buffed with Talegari (palm leaves) to achieve a glass-like child-safe organic luster.\n"
            "Dimensions: 52.0 cm Height × 15.0 cm Base Diameter. Weight: 2.2 kg.\n"
            "Ideal Placements: Minimalist corner pedestal, tall bookshelf niche, console sculptural punctuation."
        ),
        tags=["channapatna", "woodcraft", "lathe", "ivory wood", "lacquer", "syed khaleel", "karnataka", "totem", "toy town"],
    ),
    RAGChunk(
        id="prod_kundan_meenakari",
        title="Navratna Polki & Enamel Kundan Amulet (Jaipur Royal Court)",
        category="product",
        product_id="kundan-meenakari-jewellery",
        content=(
            "Flagship Masterwork: 'Navratna Polki & Enamel Kundan Amulet'.\n"
            "Craft Tradition: Jaipur Royal Kundan & Meenakari (Mughal-Rajput court goldsmithing lineage, Jaipur, Rajasthan).\n"
            "Master Goldsmith: Sunar Govind Lal Meenakar (7th Generation Court Goldsmith).\n"
            "Base Price: ₹89,000 INR.\n"
            "Materials: 24K refined Kundan gold foil, 22K yellow gold base framework, natural uncut Polki diamonds, "
            "Colombian emerald cabochon, and vitreous champlevé mineral enamels (peacock blue, ruby red, bottle green).\n"
            "Technique: Four-stage classical synthesis: Ghaat (framework shaping), Khudai (intaglio engraving of floral wells), "
            "Meenakari (kiln-fired vitreous enamel filling on the reverse), and Jadai (setting uncut gems with cold-burnished 24K pure gold leaf).\n"
            "Dimensions: 7.8 cm Height × 5.4 cm Width. Weight: 46 g (Net Gold: 34 g 22K/24K).\n"
            "Ideal Placements: Display vitrine, vanity tray, museum-grade shadowbox frame."
        ),
        tags=["kundan", "meenakari", "jewellery", "gold", "polki", "emerald", "jaipur", "govind lal", "rajasthan", "amulet"],
    ),

    # ── Regional Craft Traditions & Geographical Indications (GI) ─────────────
    RAGChunk(
        id="craft_kasuti_embroidery",
        title="Kasuti Embroidery of Karnataka (GI Protected)",
        category="craft_tradition",
        content=(
            "Kasuti is an intricate count-thread embroidery tradition native to the Dharwad and North Karnataka region, dating back to the Chalukya era. "
            "Craftswomen embroider without knotting the thread or tracing outlines, working stitch-by-stitch counted against the warp and weft of Ilkal handloom sarees. "
            "Four distinct stitches characterize authentic Kasuti:\n"
            "1. Gavanti (Double running stitch forming straight lines, completely reversible on both sides).\n"
            "2. Murgi (Zig-zag stepped stitch creating diamond patterns).\n"
            "3. Neygi (Running stitch resembling woven tapestry).\n"
            "4. Menthi (Cross-stitch used for dense floral and temple Gopura fills).\n"
            "Traditional motifs include temple chariots (rathas), tulsi katte, peacocks, elephants, and sacred geometric kolams. Master awardees include Parvati Devi."
        ),
        tags=["kasuti", "embroidery", "karnataka", "dharwad", "gavanti", "murgi", "neygi", "menthi", "ilkal", "parvati devi", "gi"],
    ),
    RAGChunk(
        id="craft_bidriware_karnataka",
        title="Bidriware Damascene Metalcraft of Bidar (GI Protected)",
        category="craft_tradition",
        content=(
            "Bidriware is an archaic metal handicraft originating from Bidar in northern Karnataka, developed during the 14th-century Bahmani Sultanate. "
            "The body is cast from an alloy of zinc (95%) and copper (5%). The surface is engraved with intricate arabesques, and pure silver wire or sheet "
            "is hammered into the chiselled grooves (Tarkashi and Tehnishan inlay techniques). "
            "The magic of Bidriware occurs during the final boiling in a paste containing soil gathered exclusively from beneath the foundation of the 500-year-old Bidar Fort, "
            "rich in natural potassium nitrate. The paste turns the zinc alloy a deep velvety matte jet-black, leaving the pure silver gleaming with celestial contrast."
        ),
        tags=["bidriware", "bidri", "bidar", "karnataka", "silver inlay", "zinc", "damascene", "fort soil", "gi", "metalcraft"],
    ),
    RAGChunk(
        id="craft_mata_ni_pachedi",
        title="Mata ni Pachedi (Mother Goddess Shrines of Gujarat)",
        category="craft_tradition",
        content=(
            "Mata ni Pachedi ('That which behind the Mother lies') is a sacred ritual textile art practiced by the nomadic Chitara community along the Sabarmati River in Gujarat. "
            "Originating when marginalized Vaghari tribes were forbidden from entering stone temples, they painted portable nomadic shrines onto unbleached cotton cloths. "
            "Drawn freehand using bamboo reed pens (kalam) and hand-carved date wood blocks. Dyes are 100% natural: black from fermented iron shavings and jaggery, "
            "crimson red from alum mordant boiled with madder root (alizarin), and white reserved un-dyed cloth. Every cloth is consecrated through river washings."
        ),
        tags=["mata ni pachedi", "chitara", "gujarat", "kalamkari", "goddess", "textile", "natural dyes", "alum", "sacred art"],
    ),
    RAGChunk(
        id="craft_kashmiri_walnut_carving",
        title="Kashmiri Walnut Wood Carving (Juglans Regia)",
        category="craft_tradition",
        content=(
            "Kashmiri Walnut Wood Carving is centered in the Kashmir Valley, utilizing exclusively the timber of Juglans regia (indigenous walnut trees) "
            "that have reached natural maturity (over 100 years old). The timber is dry-cured for two to three years to eliminate sap moisture and prevent warping. "
            "Master carvers employ four levels of carving: (1) Deep relief (Akkasi), (2) Undercut hollowed carving (Jali work), (3) Shallow engraving, and (4) Semi-relief. "
            "Iconic motifs include Chinar leaves, Kashmiri iris, trailing grapevines, and Mughal geometric lattice windows. Finished with natural beeswax and agate burnishing."
        ),
        tags=["kashmir", "walnut wood", "wood carving", "chinar", "jali", "relief", "craft", "woodcraft"],
    ),
    RAGChunk(
        id="craft_patan_patola",
        title="Patan Patola Double Ikat (Queen of Silks)",
        category="craft_tradition",
        content=(
            "Patan Patola from northern Gujarat is the pinnacle of double-ikat weaving worldwide. Both the silk warp and weft threads are individually tied and dyed "
            "with natural botanical resists (turmeric, madder, marigold, pomegranate rind) before touching the loom. When woven, the warp and weft meet with mathematical "
            "sub-millimeter precision to form identical geometric patterns on both the front and reverse sides of the textile. "
            "A single Patola takes a family of master weavers four to eight months of continuous calculation on a slant-beam rosewood loom. Celebrated in Gujarati lore: "
            "'Padi patole bhat, fatey pan fitey nahin' (The fabric may tear with centuries, but the sacred color shall never fade)."
        ),
        tags=["patan patola", "double ikat", "patola", "gujarat", "silk", "ikat", "weaving", "salvi", "handloom"],
    ),

    # ── Editorial Stories & Master Artisan Biographies ─────────────────────────
    RAGChunk(
        id="story_breath_on_wasli",
        title="The Breath on Wasli: Why Kangra Miniatures Cannot Be Rushed",
        category="editorial_story",
        product_id="pahari-miniature",
        content=(
            "In Pandit Ram Swaroop Sharma's atelier in the Kangra Valley, time is measured not by clocks but by stone burnishing and pigment settling. "
            "Wasli paper requires laminating three sheets of acid-free rag paper with neem-infused starch paste to prevent pest infestation. "
            "Once sun-cured against marble slabs, the artist rubs the surface with a heated agate stone until it acquires the dense smoothness of ivory. "
            "Sharma uses a squirrel-hair brush with three hairs plucked from a wild mountain squirrel. As Sharma explains: "
            "'A miniature is meant to be held inches from your eyelashes. If your heartbeat accelerates, the brush wavers. To paint the divine romance, "
            "the artist must silence all thoughts of the market. When you grind a mountain stone, light enters the crystal and stays for four hundred years.'"
        ),
        tags=["story", "kangra", "wasli", "ram swaroop sharma", "miniature", "agate", "squirrel hair", "pigments"],
    ),
    RAGChunk(
        id="story_four_thousand_year_wire",
        title="The Four-Thousand-Year Wire: Bastar's Lost-Wax Lineage",
        category="editorial_story",
        product_id="bastar-dhokra-brass",
        content=(
            "In the Sal forests of Bastar, metal begins with wild honey hunters who climb trees to harvest combs. "
            "Tribal master Sukhruram Ghadwa blends raw beeswax with Sal tree resin (dammar) and strains it into cold river water. "
            "The elastic wax is hand-extruded through hardwood presses into gossamer threads, which are wound in concentric spirals over a sun-dried clay core. "
            "Sukhruram reflects: 'There is no master mold. When we pour molten bell metal bronze at twelve hundred degrees, the beeswax vaporizes into smoke. "
            "It gives its life so the bronze can take its place. To create one horse, the wax must die.' "
            "Because each clay mold is shattered with an iron mallet upon cooling, every single Dhokra sculpture is an irreproducible, singular monument of archaic metallurgy."
        ),
        tags=["story", "dhokra", "bastar", "sukhruram ghadwa", "lost-wax", "beeswax", "bronze", "chhattisgarh"],
    ),
    RAGChunk(
        id="story_woven_air_chanderi",
        title="The Woven Air of the Bundelkhand Plains",
        category="editorial_story",
        product_id="chanderi-handwoven-silk",
        content=(
            "Step down into the subterranean pit-loom workshop of Master Weaver Bismillah Ansari in Pranpur, and the intense summer heat drops ten degrees. "
            "The packed damp earthen floor preserves the vital moisture of fine 20/22 denier mulberry silk. "
            "Ansari's hands dance across the wooden reed with rhythmic percussion as foot treadles control warp tension. "
            "'Chanderi is distinct because of its transparent structure,' Ansari explains. 'We do not boil off the natural sericin gum before weaving, "
            "giving the fabric its crystalline transparency and characteristic soft crackle.' "
            "Each peacock motif on the pallu is hand-interlocked with the kadwa extra-weft technique, eliminating all loose underside floats. "
            "Through KAARIGAR's fair-trade economics, 86% of the purchase price flows directly into the Pranpur weaver collective."
        ),
        tags=["story", "chanderi", "bismillah ansari", "pit loom", "silk", "zari", "kadwa", "pranpur", "gossamer"],
    ),
]


# ─────────────────────────────────────────────────────────────────────────────
# Dynamic DB Knowledge Ingestion
# ─────────────────────────────────────────────────────────────────────────────

def get_dynamic_db_chunks(db: Optional[Session]) -> list[RAGChunk]:
    """Ingest live knowledge chunks from database models:
    - CraftReference (GI origins, premium multipliers, notes)
    - Published Listings + Artisan Profiles + Stories
    """
    if db is None:
        return []

    chunks: list[RAGChunk] = []

    try:
        # Ingest CraftReference
        craft_refs = db.query(CraftReference).all()
        for cr in craft_refs:
            content = f"Craft Reference: {cr.craft_type}.\nOrigin & Heritage: {cr.origin_text}\n"
            if cr.notes:
                content += f"Technique Notes: {cr.notes}\n"
            content += f"Heritage Multiplier Factor: {cr.premium_multiplier}x."
            chunks.append(
                RAGChunk(
                    id=f"craft_ref_{cr.craft_type.lower().replace(' ', '_')}",
                    title=f"{cr.craft_type} Heritage Reference",
                    category="craft_tradition",
                    content=content,
                    tags=[cr.craft_type.lower(), "craft", "origin", "gi"],
                    metadata={"craft_type": cr.craft_type, "multiplier": cr.premium_multiplier},
                )
            )

        # Ingest Published Listings
        published_listings = (
            db.query(Listing)
            .filter(Listing.status == ListingStatus.PUBLISHED)
            .all()
        )
        for item in published_listings:
            artisan_name = item.artisan.name if item.artisan else "Master Artisan"
            artisan_bio = ""
            artisan_village = "India"
            if item.artisan and item.artisan.artisan_profile:
                prof = item.artisan.artisan_profile
                artisan_bio = prof.bio or ""
                artisan_village = prof.village or artisan_village

            story_origin = ""
            story_process = ""
            if item.story:
                story_origin = item.story.origin_text or ""
                story_process = item.story.process_text or ""

            content = (
                f"Catalogue Piece: '{item.title}' (Accession ID: {item.id}).\n"
                f"Craft Type: {item.craft_type} · Technique: {item.technique or 'Traditional technique'}.\n"
                f"Master Artisan: {artisan_name} ({artisan_village}).\n"
                f"Base Artisan Price: ₹{item.price_inr:,.0f} INR · Hours Invested: {item.hours_to_make:.0f} hours.\n"
                f"Materials: {item.materials or 'Natural authentic materials'}.\n"
                f"Dimensions: {item.dimensions or 'Standard artisanal dimensions'}.\n"
                f"Description: {item.description}\n"
            )
            if story_origin:
                content += f"Story Origin: {story_origin}\n"
            if story_process:
                content += f"Process Description: {story_process}\n"
            if artisan_bio:
                content += f"Artisan Lineage: {artisan_bio}\n"

            chunks.append(
                RAGChunk(
                    id=f"listing_{item.id}",
                    title=f"{item.title} ({item.craft_type})",
                    category="product",
                    product_id=str(item.id),
                    content=content,
                    tags=[item.craft_type.lower(), artisan_name.lower(), "product", "listing"],
                    metadata={"listing_id": str(item.id), "price": item.price_inr},
                )
            )
    except Exception as e:
        logger.warning(f"Error querying dynamic DB chunks for RAG: {e}")

    return chunks


def get_full_knowledge_corpus(db: Optional[Session] = None) -> list[RAGChunk]:
    """Return combined static + dynamic database chunks."""
    corpus = list(STATIC_KNOWLEDGE_CORPUS)
    if db is not None:
        dynamic = get_dynamic_db_chunks(db)
        corpus.extend(dynamic)
    return corpus


# ─────────────────────────────────────────────────────────────────────────────
# Hybrid Retrieval: Lexical Token BM25/TF-IDF Scoring
# ─────────────────────────────────────────────────────────────────────────────

def _tokenize(text: str) -> list[str]:
    """Tokenize text into lowercase alphanumeric stems, removing common stopwords."""
    words = re.findall(r"\b[a-zA-Z0-9_\-]+\b", text.lower())
    return [w for w in words if len(w) > 2 and w not in STOP_WORDS]


def compute_lexical_score(query: str, chunk: RAGChunk, corpus_len: int = 20) -> float:
    """Calculate normalized BM25-inspired lexical relevance score for a chunk."""
    query_tokens = _tokenize(query)
    if not query_tokens:
        return 0.0

    chunk_text = f"{chunk.title} {chunk.category} {' '.join(chunk.tags)} {chunk.content}".lower()
    title_text = chunk.title.lower()
    tags_text = " ".join(chunk.tags).lower()

    score = 0.0
    matched_tokens = 0

    for token in query_tokens:
        # Title match bonus (3.0x)
        if token in title_text:
            score += 3.0
            matched_tokens += 1
        # Tag match bonus (2.0x)
        elif token in tags_text:
            score += 2.0
            matched_tokens += 1
        # Body content frequency
        count = chunk_text.count(token)
        if count > 0:
            # Sub-linear term frequency saturation
            tf = math.log(1.0 + count)
            score += tf * 1.0
            matched_tokens += 1

    # Exact phrase bonus
    clean_query = query.strip().lower()
    if len(clean_query) > 5 and clean_query in chunk_text:
        score += 4.0

    # Normalize by query length
    normalized = (score / (len(query_tokens) * 2.5))
    return min(1.0, max(0.0, normalized))


# ─────────────────────────────────────────────────────────────────────────────
# Dense Vector Embeddings (Gemini text-embedding-004)
# ─────────────────────────────────────────────────────────────────────────────

def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Calculate cosine similarity between two float vectors."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return max(0.0, min(1.0, dot / (norm_a * norm_b)))


def _get_embedding(text: str, is_query: bool = False) -> Optional[list[float]]:
    """Generate dense vector embedding using Gemini API if key is available.
    Returns None if API key is missing or call fails.
    """
    api_key = ai_service.get_gemini_api_key()
    if not api_key:
        return None

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key, transport="rest")
        task_type = "retrieval_query" if is_query else "retrieval_document"
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text[:2000],  # Bound input length
            task_type=task_type,
        )
        if isinstance(result, dict) and "embedding" in result:
            return result["embedding"]
        if hasattr(result, "embedding"):
            return result.embedding
    except Exception as e:
        logger.debug(f"Gemini embedding call failed or not configured: {e}")

    return None


def get_chunk_embedding(chunk: RAGChunk) -> Optional[list[float]]:
    """Retrieve cached chunk embedding or compute and cache it."""
    global _EMBEDDING_CACHE
    if chunk.id in _EMBEDDING_CACHE:
        return _EMBEDDING_CACHE[chunk.id]

    text_to_embed = f"{chunk.title}\n{chunk.category}\n{chunk.content}"
    emb = _get_embedding(text_to_embed, is_query=False)
    if emb:
        _EMBEDDING_CACHE[chunk.id] = emb
    return emb


# ─────────────────────────────────────────────────────────────────────────────
# Hybrid Retrieval Pipeline
# ─────────────────────────────────────────────────────────────────────────────

def retrieve_relevant_chunks(
    query: str,
    db: Optional[Session] = None,
    top_k: int = 4,
    min_score: float = 0.08,
) -> list[tuple[RAGChunk, float]]:
    """Perform hybrid retrieval over the knowledge corpus using both dense vectors and lexical signals.
    Returns ranked list of (RAGChunk, combined_score) tuples.
    """
    corpus = get_full_knowledge_corpus(db=db)
    if not corpus:
        return []

    # 1. Attempt query embedding
    query_emb = _get_embedding(query, is_query=True)

    ranked_chunks: list[tuple[RAGChunk, float]] = []

    for chunk in corpus:
        # Lexical score (0.0 to 1.0)
        lex_score = compute_lexical_score(query, chunk, corpus_len=len(corpus))

        # Dense score if query embedding available
        dense_score = 0.0
        if query_emb:
            chunk_emb = get_chunk_embedding(chunk)
            if chunk_emb:
                dense_score = _cosine_similarity(query_emb, chunk_emb)

        # Hybrid fusion
        if query_emb and dense_score > 0.0:
            # 65% dense semantic similarity + 35% lexical keyword precision
            final_score = (0.65 * dense_score) + (0.35 * lex_score)
        else:
            final_score = lex_score

        if final_score >= min_score or (lex_score > 0.15):
            ranked_chunks.append((chunk, final_score))

    # Sort descending by score
    ranked_chunks.sort(key=lambda x: x[1], reverse=True)

    # Return top K
    return ranked_chunks[:top_k]


# ─────────────────────────────────────────────────────────────────────────────
# Strict Object / Product Filtering & End of Catalogue Detection
# ─────────────────────────────────────────────────────────────────────────────

def filter_catalogue_for_query(
    query: str,
    catalogue: list[dict[str, Any]],
    top_chunks: list[tuple[RAGChunk, float]],
) -> tuple[list[dict[str, Any]], bool, bool, str]:
    """Strictly filter catalogue products based on the patron's specific object inquiry.

    Returns:
      (matched_products, object_query_detected, no_objects_found, end_message)
    """
    clean_q = query.strip().lower()

    # 1. Parse budget constraint (e.g. "under ₹30,000", "under 30000", "below 50000")
    budget_limit: Optional[float] = None
    budget_match = re.search(
        r'(?:under|below|less than|within|budget(?:\s*of)?)\s*(?:rs\.?|inr|₹)?\s*([0-9,]+)',
        clean_q,
    )
    if budget_match:
        try:
            budget_limit = float(budget_match.group(1).replace(",", ""))
        except ValueError:
            budget_limit = None

    # 2. Check for object search intent
    object_action_words = {
        "show", "display", "recommend", "suggest", "find", "buy", "purchase", "browse",
        "looking for", "search", "pieces", "piece", "items", "item", "objects", "object",
        "products", "product", "collection", "catalogue", "catalog", "under", "below",
        "budget", "masterwork", "masterpiece", "masterpieces", "decor", "gift", "have you got",
        "do you have", "what can i buy", "available", "cost", "price", "pricing for", "wear",
    }

    # Specific object and craft noun keywords
    craft_object_nouns = {
        "painting", "paintings", "miniature", "wasli", "kalam", "kangra", "pahari",
        "pottery", "urn", "urns", "vase", "vases", "ceramic", "ceramics", "faience", "blue pottery",
        "textile", "textiles", "silk", "saree", "sari", "sarees", "brocade", "chanderi", "kadwa", "weave",
        "metal", "metalcraft", "dhokra", "dokra", "horse", "brass", "bronze", "lost-wax", "sculpture", "statue",
        "wood", "woodcraft", "toy", "toys", "totem", "channapatna", "lathe",
        "jewellery", "jewelry", "amulet", "kundan", "meenakari", "polki", "pendant", "necklace", "gold",
        # Non-catalogue objects patrons might inquire about
        "sword", "swords", "dagger", "carpet", "carpets", "rug", "rugs", "shoe", "shoes", "jooti", "mojari",
        "furniture", "chair", "chairs", "table", "tables", "bed", "sofa", "lamp", "lamps", "candle",
        "shawl", "shawls", "pashmina", "bag", "bags", "leather", "curtain", "curtains"
    }

    words = set(re.findall(r'\b[a-z0-9_\-]+\b', clean_q))
    has_action = any(w in words or w in clean_q for w in object_action_words)
    has_noun = any(w in words or w in clean_q for w in craft_object_nouns)

    # Check if this is purely a policy/faq inquiry without object purchase/viewing intent
    is_pure_policy_or_technique = False
    policy_keywords = {"fee", "platform fee", "5%", "tax", "gst", "escrow", "shipping", "delivery", "return", "refund", "auth", "login", "certificate", "inspection"}
    if any(pk in clean_q for pk in policy_keywords) and not has_noun and not any(w in words for w in ["buy", "show", "pieces", "products"]):
        is_pure_policy_or_technique = True

    object_query_detected = (has_action or has_noun or budget_limit is not None) and not is_pure_policy_or_technique

    if not object_query_detected:
        return [], False, False, False, ""


    # 3. Score and strictly filter products from catalogue
    matched_products: list[dict[str, Any]] = []

    for prod in catalogue:
        p_id = str(prod["id"]).lower()
        p_title = prod["title"].lower()
        p_tradition = prod.get("craftTradition", "").lower()
        p_category = prod.get("category", "").lower()
        p_price = float(prod.get("price", 0))

        # Must satisfy budget if budget limit was specified
        if budget_limit is not None and p_price > budget_limit:
            continue

        is_match = False

        # If user explicitly asked for "all" or general collection browse with budget only
        if budget_limit is not None and not has_noun:
            is_match = True
        elif ("all" in words or "collection" in words or "catalogue" in words) and not has_noun:
            is_match = True
        else:
            # Strict categorical / tradition / object matching
            if any(k in clean_q for k in ["painting", "miniature", "pahari", "kangra", "wasli", "radha"]):
                if "painting" in p_category or "pahari" in p_id or "miniature" in p_title:
                    is_match = True

            if any(k in clean_q for k in ["pottery", "ceramic", "urn", "vase", "blue pottery", "arabesque"]):
                if "ceramic" in p_category or "pottery" in p_id or "urn" in p_title:
                    is_match = True

            if any(k in clean_q for k in ["textile", "silk", "saree", "sari", "brocade", "chanderi", "kadwa", "zari"]):
                if "textile" in p_category or "silk" in p_id or "chanderi" in p_title:
                    is_match = True

            if any(k in clean_q for k in ["dhokra", "dokra", "horse", "brass", "bronze", "bell metal"]) or ("metal" in clean_q and "metalcraft" in p_category):
                if "metalcraft" in p_category or "dhokra" in p_id or "horse" in p_title:
                    is_match = True

            if any(k in clean_q for k in ["wood", "woodcraft", "toy", "totem", "channapatna", "lathe"]):
                if "woodcraft" in p_category or "wood" in p_id or "totem" in p_title or "channapatna" in p_tradition:
                    is_match = True

            if any(k in clean_q for k in ["jewel", "amulet", "kundan", "meenakari", "polki", "gold"]):
                if "jewellery" in p_category or "kundan" in p_id or "amulet" in p_title:
                    is_match = True

            # Check distinct title tokens (excluding generic terms like 'piece', 'item', 'design')
            generic_tokens = {"piece", "pieces", "item", "items", "product", "products", "craft", "crafts", "design", "designs", "traditional", "handmade", "authentic", "collection", "object", "objects", "artisan", "blouse", "work"}
            title_tokens = [t for t in re.findall(r'\b[a-z0-9]+\b', p_title) if len(t) > 3 and t not in STOP_WORDS and t not in generic_tokens]
            if not has_noun and any(t in words for t in title_tokens):
                is_match = True


        if is_match:
            matched_products.append(prod)

    # 4. Determine end status and suitable messages
    if len(matched_products) == 0:
        no_objects_found = True
        has_reached_end = True
        end_message = "No masterworks in our current archive match this specific search. Our collection is strictly limited to authenticated living heritage pieces."
    else:
        no_objects_found = False
        has_reached_end = True
        end_message = f"✦ Displaying all {len(matched_products)} matching masterwork{'s' if len(matched_products) > 1 else ''} in collection (End of results) ✦"

    return matched_products, object_query_detected, no_objects_found, has_reached_end, end_message



# ─────────────────────────────────────────────────────────────────────────────
# Graceful Curatorial Synthesis (Fallback when Gemini is unavailable)
# ─────────────────────────────────────────────────────────────────────────────

def _synthesize_curatorial_fallback(
    query: str,
    top_chunks: list[tuple[RAGChunk, float]],
    catalogue_products: list[dict[str, Any]],
    matched_products: list[dict[str, Any]],
    object_query_detected: bool,
    no_objects_found: bool,
) -> str:
    """Generate an authoritative, warm, and highly structured curatorial answer
    grounded directly in the retrieved heritage documents and matched objects.
    """
    clean_q = query.strip()

    # Case 1: Patron asked for an object, but no such object exists in the collection
    if object_query_detected and no_objects_found:
        return (
            f"### Curatorial Archive Notice\n\n"
            f"We could not find any authenticated masterworks matching **\"{clean_q}\"** in our active collection.\n\n"
            f"KAARIGAR exclusively curates museum-grade works from recognized Geographical Indication (GI) ateliers and national awardees. "
            f"Our current authenticated collection includes:\n"
            f"- **Bastar Lost-Wax Dhokra** (Bell Metal Bronze Sculptures by Sukhruram Ghadwa)\n"
            f"- **Pahari Miniature Paintings** (Kangra Wasli with 24K Gold & Lapis Lazuli by Pandit Ram Swaroop Sharma)\n"
            f"- **Jaipur Blue Pottery** (Clay-free Quartz Frit Faience by Mahesh Kumar)\n"
            f"- **Handwoven Chanderi Brocades** (Pit-Loom Mulberry Silk & Gold Zari by Master Bismillah Ansari)\n"
            f"- **Channapatna Woodcraft** (Ivory Wood & Botanical Lacquer Sculptures by Syed Khaleel)\n"
            f"- **Jaipur Royal Kundan & Meenakari** (24K Gold & Uncut Polki Amulets by Sunar Govind Lal)\n\n"
            f"> *Please select from one of our available living craft traditions or ask for recommendations by room placement and budget.*"
        )

    # Case 2: Patron asked for an object, and specific matching products were found
    if object_query_detected and matched_products:
        response_lines = [
            f"### Curated Masterwork{'s' if len(matched_products) > 1 else ''} for \"{clean_q}\"\n",
            f"I have retrieved **{len(matched_products)}** authenticated piece{'s' if len(matched_products) > 1 else ''} from our collection matching your criteria:\n",
        ]
        for p in matched_products:
            response_lines.append(
                f"- **{p['title']}** ({p.get('craftTradition', 'Heritage Craft')})\n"
                f"  *Master Artisan:* {p.get('artisan', 'Master Maker')} · {p.get('region', 'India')}\n"
                f"  *Price:* ₹{p.get('price', 0):,.0f} INR · *Materials:* {', '.join(p.get('materials', [])[:3])}\n"
            )
        response_lines.append(
            "\n> *All matching pieces in our active archives are presented below. Every work arrives with a serialised Certificate of Authenticity and 7-day white-glove inspection protection.*"
        )
        return "\n".join(response_lines)

    if not top_chunks:
        return (
            "Welcome to KAARIGAR. I am your Curatorial Guide to India's living artisanal masterworks.\n\n"
            "I can illuminate our mastercrafts—including **Bastar Lost-Wax Dhokra**, **Pahari Kangra Miniature Painting**, "
            "**Jaipur Blue Pottery**, **Handwoven Chanderi Brocade**, **Channapatna Lathe-Turned Woodcraft**, and **Royal Kundan Meenakari**—"
            "as well as detail our 4-part transparent pricing formula (100% direct artisan share, 5% platform fee, 5% GST), "
            "authenticity certification, and white-glove archival delivery.\n\n"
            "What tradition or masterwork may I curate for you today?"
        )

    primary_chunk, primary_score = top_chunks[0]

    # Handle Platform Policy inquiries
    if primary_chunk.category == "platform_policy":
        body = primary_chunk.content
        if len(top_chunks) > 1 and top_chunks[1][0].category == "platform_policy":
            body += f"\n\n**Additional Assurance:**\n{top_chunks[1][0].content}"
        return (
            f"### {primary_chunk.title}\n\n"
            f"{body}\n\n"
            f"> *Every craftwork on KAARIGAR is directly represented by its living lineage maker, "
            f"protected by escrow, and accompanied by a serialised Certificate of Authenticity.*"
        )

    # Handle Craft Traditions & Historical Inquiries
    response_lines = [
        f"### {primary_chunk.title}\n",
        f"{primary_chunk.content}\n",
    ]

    for chunk, _ in top_chunks[1:]:
        if chunk.id == primary_chunk.id:
            continue
        if chunk.category in ("making_stage", "editorial_story", "craft_tradition"):
            response_lines.append(f"**From the Archives — {chunk.title}:**\n{chunk.content}\n")

    return "\n".join(response_lines)


# ─────────────────────────────────────────────────────────────────────────────
# Context-Augmented Generation (Gemini LLM Synthesis)
# ─────────────────────────────────────────────────────────────────────────────

async def generate_rag_response(
    query: str,
    history: list[ChatMessage],
    db: Optional[Session] = None,
) -> ChatbotChatResponse:
    """Execute complete RAG pipeline:
    1. Retrieve relevant knowledge chunks via hybrid vector/lexical retrieval.
    2. Strictly filter catalogue products to ONLY those asked for.
    3. Detect if no objects exist or if all objects have been shown.
    4. Generate synthesized answer via Gemini (or graceful fallback).
    5. Return grounded response with citations, matching products, and end message.
    """
    clean_query = query.strip()
    if not clean_query:
        return ChatbotChatResponse(
            answer="Please ask a question about our heritage crafts, master artisans, or platform provenance.",
            sources=[],
            suggestedProducts=[],
            confidenceScore=1.0,
            usedFallback=False,
            objectQueryDetected=False,
            noObjectsFound=False,
            hasReachedEnd=False,
        )

    # 1. Retrieve top chunks
    top_chunks = retrieve_relevant_chunks(clean_query, db=db, top_k=4)

    # 2. Retrieve full catalogue
    catalogue = get_all_catalogue_products(db=db)

    # 3. Strictly filter catalogue products for the user's inquiry
    matched_products, object_query_detected, no_objects_found, has_reached_end, end_message = filter_catalogue_for_query(
        query=clean_query,
        catalogue=catalogue,
        top_chunks=top_chunks,
    )


    # Prepare Source Citations
    sources_out: list[RAGSourceOut] = []
    for chunk, score in top_chunks:
        snippet = chunk.content[:180] + ("..." if len(chunk.content) > 180 else "")
        sources_out.append(
            RAGSourceOut(
                id=chunk.id,
                title=chunk.title,
                category=chunk.category,
                snippet=snippet,
                relevanceScore=round(score, 3),
                productId=chunk.product_id,
            )
        )

    # 4. Check if Gemini Model is available
    model = ai_service._get_model()
    answer_text = ""
    used_fallback = False

    if model is not None:
        try:
            # Build Context String
            context_blocks = []
            for i, (chunk, score) in enumerate(top_chunks, start=1):
                context_blocks.append(
                    f"--- DOCUMENT [{i}] ({chunk.title} | Category: {chunk.category}) ---\n"
                    f"{chunk.content}\n"
                )
            context_text = "\n".join(context_blocks) if context_blocks else "No archival documents found."

            # Build Conversation History String
            history_lines = []
            for h in history[-4:]:  # Keep last 4 turns for context
                role_label = "Patron" if h.role == "user" else "Curator"
                history_lines.append(f"{role_label}: {h.content}")
            history_text = "\n".join(history_lines) if history_lines else "None"

            # Object-specific constraint instructions for Gemini
            object_instruction = ""
            if object_query_detected:
                if no_objects_found:
                    object_instruction = (
                        f"CRITICAL PRODUCT CONSTRAINT:\n"
                        f"The patron is looking for an object ('{clean_query}'), but NO such object exists in our catalogue.\n"
                        f"You MUST clearly and politely inform the patron that KAARIGAR currently has no authenticated pieces matching this search. "
                        f"Explain that our collection is strictly curated across recognized GI traditions, and invite them to explore our available ceramics, textiles, metalcraft, or paintings. "
                        f"DO NOT pretend that we have this item or invent fake products.\n"
                    )
                else:
                    matched_names = [p["title"] for p in matched_products]
                    object_instruction = (
                        f"CRITICAL PRODUCT CONSTRAINT:\n"
                        f"The patron is asking for specific objects ('{clean_query}').\n"
                        f"ONLY the following {len(matched_products)} piece(s) from our collection match this request: {matched_names}.\n"
                        f"You MUST ONLY highlight and discuss these exact piece(s). DO NOT recommend or discuss any other unrelated products.\n"
                    )

            system_instruction = (
                "You are the KAARIGAR Senior Curatorial Concierge, an authoritative and warm expert "
                "on India's living craft traditions, master artisans, museum-grade pieces, and platform policies.\n\n"
                "GUIDELINES:\n"
                "1. Answer authoritatively, eloquently, and warmly using the ARCHIVAL CONTEXT below.\n"
                "2. When discussing craft techniques (e.g. Bastar Dhokra lost-wax, Kangra wasli burnishing, Chanderi kadwa, Jaipur blue pottery quartz frit, Kasuti stitches), "
                "explain the historical lineage, raw natural materials, and artisan stages faithfully.\n"
                "3. If platform economics or policies are asked, clearly articulate our 4-part formula: 100% direct artisan share, 5% platform infrastructure fee, 5% GST, total price, "
                "as well as our physical master-bench inspection, tamper-proof Certificate of Authenticity, and 7-day white-glove inspection window.\n"
                f"{object_instruction}"
                "4. Keep responses concise, beautiful, and formatted in clean GitHub Markdown.\n"
                "5. Do NOT fabricate crafts or artisans not present in the archives.\n"
                "6. Never use emojis anywhere in your response. Maintain an authoritative, museum-grade curatorial tone free of emojis.\n"
                "7. Never mention technical AI or system terminology such as 'RAG', 'Retrieval-Augmented Generation', 'LLM', or 'vector database'. Refer exclusively to the KAARIGAR Curatorial Archives and master registers."
            )

            prompt = (
                f"{system_instruction}\n\n"
                f"### VERIFIED ARCHIVAL CONTEXT:\n{context_text}\n\n"
                f"### RECENT CONVERSATION:\n{history_text}\n\n"
                f"### PATRON'S QUESTION:\n{clean_query}\n\n"
                f"Provide your curatorial response now:"
            )

            response = ai_service._generate_content_with_fallback(
                [prompt],
            )
            raw_text = (response.text or "").strip()
            if raw_text:
                answer_text = raw_text


        except Exception as e:
            logger.warning(f"Gemini RAG LLM call encountered error, engaging fallback: {e}")
            answer_text = ""

    # 5. Fallback to curatorial synthesis if Gemini is absent or failed
    if not answer_text:
        answer_text = _synthesize_curatorial_fallback(
            query=clean_query,
            top_chunks=top_chunks,
            catalogue_products=catalogue,
            matched_products=matched_products,
            object_query_detected=object_query_detected,
            no_objects_found=no_objects_found,
        )
        used_fallback = True

    # 6. Hydrate ONLY the strictly matched products
    suggested_products_out: list[ChatbotProductOut] = []
    for pdata in matched_products:
        suggested_products_out.append(
            ChatbotProductOut(
                id=str(pdata["id"]),
                title=pdata["title"],
                craftTradition=pdata.get("craftTradition", ""),
                category=pdata.get("category", "crafts"),
                price=float(pdata.get("price", 0)),
                artisan=pdata.get("artisan", "Master Artisan"),
                region=pdata.get("region", "India"),
                state=pdata.get("state", ""),
                dimensions=pdata.get("dimensions", ""),
                image=pdata.get("image", "/images/textile.jpg"),
                colorPalette=pdata.get("colorPalette", []),
                materials=pdata.get("materials", []),
                technique=pdata.get("technique", ""),
            )
        )

    # Compute overall confidence score
    confidence = 0.96 if not used_fallback else (0.88 if top_chunks else 0.75)

    return ChatbotChatResponse(
        answer=answer_text,
        sources=sources_out,
        suggestedProducts=suggested_products_out,
        confidenceScore=confidence,
        usedFallback=used_fallback,
        objectQueryDetected=object_query_detected,
        noObjectsFound=no_objects_found,
        hasReachedEnd=has_reached_end,
        endMessage=end_message if (object_query_detected or no_objects_found) else None,
    )

