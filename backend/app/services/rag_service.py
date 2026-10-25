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
from app.services import ai_service, knowledge_loader
from app.services.chunking import KnowledgeDocument, RAGChunk

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


# ─────────────────────────────────────────────────────────────────────────────
# JSON Knowledge Corpus Ingestion & Automated Chunking
# ─────────────────────────────────────────────────────────────────────────────

def load_static_corpus(force_reload: bool = False) -> list[RAGChunk]:
    """Retrieve automatically chunked heritage knowledge from JSON data source.

    Automated semantic chunking eliminates manual data fragmentation by dynamically
    segmenting curated documents along boundary-preserving hierarchies with context overlap.
    """
    return knowledge_loader.get_static_chunks(force_reload=force_reload)


# Maintain backward compatibility for any callers expecting STATIC_KNOWLEDGE_CORPUS
STATIC_KNOWLEDGE_CORPUS: list[RAGChunk] = load_static_corpus()


def reload_knowledge_corpus() -> list[RAGChunk]:
    """Force re-ingestion and re-chunking of the JSON knowledge corpus."""
    global STATIC_KNOWLEDGE_CORPUS
    STATIC_KNOWLEDGE_CORPUS = knowledge_loader.reload_knowledge_base()
    return STATIC_KNOWLEDGE_CORPUS


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
    """Return combined static (loaded from JSON & automatically chunked) + dynamic database chunks."""
    corpus = list(knowledge_loader.get_static_chunks())
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
) -> tuple[list[dict[str, Any]], bool, bool, bool, str]:
    """Strictly filter catalogue products based on the patron's specific object inquiry.

    Returns:
      (matched_products, object_query_detected, no_objects_found, has_reached_end, end_message)
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
    policy_keywords = {
        "fee", "platform fee", "5%", "tax", "gst", "escrow", "shipping", "delivery",
        "return", "refund", "auth", "login", "certificate", "inspection", "pricing formula",
        "pricing", "formula", "breakdown", "policy", "policies", "terms", "transparent pricing",
    }
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

