"""KalaHaat – Gemini AI service.

Provides:
  1. `generate_ai_draft()`  – images + transcript → structured listing draft
  2. `generate_narration()` – listing data → gallery guide narration text
  3. `analyze_space()`      – room photograph → curated catalogue recommendations

Uses google-generativeai SDK with JSON-mode structured output.
Falls back gracefully if the API key is missing or the call fails.
"""

from __future__ import annotations

import json
import logging
from typing import Optional

from app.config import settings
from app.schemas import AIDraftResponse

logger = logging.getLogger(__name__)

# ──────────────────────────── SDK setup ──────────────────────────

_model = None


def _get_candidate_models() -> list[str]:
    """Return unique, priority-ordered list of candidate Gemini models."""
    raw = [
        settings.GEMINI_MODEL,
        "gemini-3-flash-preview",
        "gemini-3.8-flash",
        "gemini-flash-latest",
        "gemini-3.5-flash",
    ]
    seen = set()
    return [m for m in raw if m and not (m in seen or seen.add(m))]


def _get_model():
    """Lazily initialise the Gemini model so import never fails."""
    global _model
    if _model is not None:
        return _model

    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set in configuration")
        return None

    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY, transport="rest")
        for model_name in _get_candidate_models():
            try:
                _model = genai.GenerativeModel(model_name)
                logger.info("Gemini model initialised: %s", model_name)
                return _model
            except Exception as exc:
                logger.warning("Could not initialise Gemini model '%s': %s", model_name, exc)
                continue
        logger.error("All Gemini model candidates failed to initialise. Check GEMINI_API_KEY.")
        return None
    except Exception:
        logger.exception("Failed to initialise Gemini model")
        return None


def _generate_content_with_fallback(parts, generation_config=None):
    """Generate content using Gemini, falling back to alternative models if quota (429) or 404 occurs."""
    import google.generativeai as genai
    from google.api_core.exceptions import TooManyRequests, ResourceExhausted, NotFound

    models_to_try = _get_candidate_models()
    last_err = None

    for model_name in models_to_try:
        try:
            m = genai.GenerativeModel(model_name)
            logger.debug("Attempting Gemini generation with model: %s", model_name)
            return m.generate_content(parts, generation_config=generation_config)
        except (TooManyRequests, ResourceExhausted) as exc:
            logger.warning("Gemini model '%s' quota exceeded (429), trying fallback model: %s", model_name, exc)
            last_err = exc
            continue
        except NotFound as exc:
            logger.warning("Gemini model '%s' not found (404), trying fallback model: %s", model_name, exc)
            last_err = exc
            continue
        except Exception as exc:
            # Check for 429 in string representation for general API errors
            if "429" in str(exc) or "Quota exceeded" in str(exc):
                logger.warning("Gemini model '%s' hit quota limit (429), trying fallback model: %s", model_name, exc)
                last_err = exc
                continue
            raise

    raise last_err or RuntimeError("All candidate Gemini models failed")


# ──────────────────────────── AI Draft ───────────────────────────

_DRAFT_SYSTEM_PROMPT = """You are KalaHaat's AI listing assistant for coastal Indian artisan crafts.
Given one or more product photos and optional voice transcript, produce a JSON object with these keys:
- title: short product title (max 80 chars)
- description: 2–3 sentence product description
- materials: array of material strings
- technique: the craft technique used
- story: 2–3 sentence craft story connecting the piece to its tradition
- tags: array of search tags
- suggested_price_range: object with "min" and "max" keys in INR

Use the craft reference text below for grounding – do NOT invent history.

{craft_context}

Respond ONLY with valid JSON, no markdown fences."""


def _fallback_draft() -> AIDraftResponse:
    """Return a blank editable draft when AI is unavailable."""
    return AIDraftResponse(
        title="",
        description="",
        materials=[],
        technique="",
        story="",
        tags=[],
        suggested_price_range={"min": 0, "max": 0},
    )


async def generate_ai_draft(
    image_bytes_list: list[bytes],
    craft_type: str = "",
    transcript: str = "",
    craft_context: str = "",
) -> AIDraftResponse:
    """Generate a listing draft from images, optional voice transcript, and craft context."""
    model = _get_model()
    if model is None:
        return _fallback_draft()

    try:
        import google.generativeai as genai

        # Build multimodal content parts
        parts = []

        # System-style instruction
        system_prompt = _DRAFT_SYSTEM_PROMPT.format(craft_context=craft_context or "No specific craft context available.")
        parts.append(system_prompt)

        # Add images
        for img_bytes in image_bytes_list[:4]:  # max 4
            parts.append({"mime_type": "image/jpeg", "data": img_bytes})

        # User instruction
        user_text = f"Craft type: {craft_type or 'unknown'}."
        if transcript:
            user_text += f"\nArtisan's description: {transcript}"
        user_text += "\nGenerate the JSON listing draft."
        parts.append(user_text)

        response = model.generate_content(
            parts,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.4,
            ),
        )

        raw = response.text.strip()
        # Remove markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]

        data = json.loads(raw)
        return AIDraftResponse(**data)

    except Exception:
        logger.exception("AI draft generation failed – returning fallback")
        # One retry
        try:
            response = model.generate_content(
                parts,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )
            data = json.loads(response.text.strip())
            return AIDraftResponse(**data)
        except Exception:
            logger.exception("AI draft retry also failed")
            return _fallback_draft()


# ──────────────────────────── Narration ──────────────────────────

_NARRATE_PROMPT = """You are a friendly gallery guide at KalaHaat, a virtual marketplace for coastal Indian crafts.
A visitor is looking at: "{title}" by {artisan_name} from {village}.

Craft story: {story}
Materials: {materials}
Technique: {technique}
Price: \u20b9{price}

In 2–3 warm, engaging sentences, narrate this piece to the visitor as if you were standing beside them in the gallery.
Keep it concise for TTS. Language: {language}."""


async def generate_narration(
    title: str,
    artisan_name: str,
    village: str,
    story: str,
    materials: str,
    technique: str,
    price: float,
    language: str = "en",
) -> str:
    """Generate a short gallery-guide narration for TTS."""
    model = _get_model()
    if model is None:
        return (
            f"This is '{title}' by {artisan_name} from {village}. "
            f"{story} It is priced at \u20b9{price:.0f}."
        )

    try:
        prompt = _NARRATE_PROMPT.format(
            title=title,
            artisan_name=artisan_name,
            village=village,
            story=story,
            materials=materials,
            technique=technique,
            price=f"{price:.0f}",
            language="Kannada" if language == "kn" else "English",
        )

        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception:
        logger.exception("Narration generation failed – returning template")
        return (
            f"This is '{title}' by {artisan_name} from {village}. "
            f"{story} It is priced at \u20b9{price:.0f}."
        )


# ──────────────────────────── Space Stylist ──────────────────────

_SPACE_STYLIST_PROMPT = """You are KAARIGAR's AI Space Stylist — a discerning curator of handcrafted Indian artisanal decor pieces.
Analyze the uploaded photograph carefully and execute the following steps:

STEP 1: SPACE SUITABILITY CHECK
Determine whether the photograph depicts an interior space, room, living area, study, bedroom, dining room, wall, shelf, mantle, console table, or desk suitable for styling with home decor craft objects.
- If the photograph is of a human face/portrait, headshot, selfie, group of people, an animal/pet, food/dish, vehicle, gadget, outdoor landscape without decor surfaces, or a screenshot:
  Set "isSuitable": false
  Set "unsuitableMessage": "The uploaded photograph appears to be a portrait or non-interior subject rather than an interior space. Please upload a photograph of your room, shelf, desk, or wall so we can curate suitable handcrafted Indian decor pieces for your space."
  Set "spaceAnalysis": {{
    "dominantColors": [],
    "interiorStyle": "N/A",
    "spaceMood": "Non-interior photograph",
    "colorDescription": "The image is not an interior living space or decor surface.",
    "spaceDescription": "The uploaded photograph does not show an interior space, shelf, desk, or wall.",
    "suggestedCategories": [],
    "suggestedPlacements": []
  }}
  Set "recommendations": []
  STOP HERE if isSuitable is false. Do NOT recommend any products.

STEP 2: AESTHETIC SPACE ANALYSIS (Only if isSuitable is true)
Analyze the specific visual characteristics of the space in the photo:
- Dominant colors and lighting tones visible in the room.
- Interior style (e.g. minimalist, contemporary, traditional-indian, bohemian, modern-industrial, scandinavian, rustic, mid-century).
- Spatial mood and atmosphere.
- Specific architectural or furnishing details (wood shelving, neutral walls, stone textures, modern desk, etc.).

STEP 3: REAL CATALOGUE RECOMMENDATIONS (Only if isSuitable is true)
From the REAL KAARIGAR catalogue below, select 1 to 3 products whose colors, materials, and artisan tradition genuinely harmonize with THIS specific room.

REAL KAARIGAR PRODUCT CATALOGUE:
{catalog_summary}
{user_preference_note}

CRITICAL RULES:
1. ONLY recommend products whose IDs appear EXACTLY in the catalogue above. Do NOT invent products, prices, artisans, or materials.
2. If a product's physical dimensions are empty or missing, do NOT claim it will physically fit the user's shelf or room.
3. If the user specified a budget or constraint, prioritize products within that budget.
4. Each recommendation MUST explain specifically how its colors, materials, or craft tradition complement the visible elements of THIS room.
5. Provide matchScore as an integer between 65 and 98.
6. If isSuitable is false, "recommendations" MUST be an empty array [].
7. Return valid JSON and ONLY JSON. No markdown code fences.

JSON SCHEMA:
{{
  "isSuitable": true,
  "unsuitableMessage": "",
  "spaceAnalysis": {{
    "dominantColors": ["up to 4 dominant hex or color names from this specific photo"],
    "interiorStyle": "interior style string",
    "spaceMood": "short evocative description of atmosphere",
    "colorDescription": "1-2 sentences on lighting and color balance in this room",
    "spaceDescription": "2-3 sentences describing this specific room and why certain crafts complement it",
    "suggestedCategories": ["categories from catalogue that fit"],
    "suggestedPlacements": ["placement opportunities like shelf accent, wall decor, desk anchor, table centerpiece"]
  }},
  "recommendations": [
    {{
      "productId": "exact product id string from catalogue",
      "reason": "Specific 2-3 sentence reason connecting this craft to the visible room details",
      "matchScore": 88
    }}
  ]
}}
"""


def _parse_budget_number(preference: str) -> Optional[float]:
    """Extract numeric budget if present in preference string."""
    import re
    match = re.search(r'[\u20b9]?\s*(\d[\d,]*)', preference)
    if match:
        try:
            return float(match.group(1).replace(",", ""))
        except ValueError:
            return None
    return None


async def analyze_space(
    image_bytes: bytes,
    mime_type: str,
    user_preference: str,
    catalogue: list[dict],
) -> dict:
    """Perform multimodal interior analysis and product recommendation using Gemini Vision."""
    model = _get_model()
    if model is None:
        raise RuntimeError(
            "Gemini AI service is not initialized. Please verify that GEMINI_API_KEY is configured in backend/.env."
        )

    logger.info(
        "analyze_space called: image_bytes=%d bytes, mime_type=%s, model=%s, catalogue_products=%d",
        len(image_bytes),
        mime_type,
        getattr(model, "model_name", "unknown"),
        len(catalogue),
    )

    try:
        import google.generativeai as genai

        catalog_summary = "\n".join([
            f"- ID: \"{p['id']}\" | Title: \"{p['title']}\" | Category: {p.get('category')} | Price: \u20b9{p.get('price'):,.0f} | Colors: {', '.join(p.get('colorPalette', []))} | Craft: {p.get('craftTradition')} | Region: {p.get('region')} | Dimensions: {p.get('dimensions', 'Not specified')}"
            for p in catalogue
        ])

        pref_note = f"\nUser preference / constraints: \"{user_preference}\"" if user_preference else ""
        prompt_text = _SPACE_STYLIST_PROMPT.format(
            catalog_summary=catalog_summary,
            user_preference_note=pref_note,
        )

        # Build multimodal parts: image bytes first, then the text prompt.
        # The image_bytes contain the actual uploaded photograph pixels — Gemini Vision
        # uses them to analyze the room's colors, style, and placement opportunities.
        parts = [
            {"mime_type": mime_type or "image/jpeg", "data": image_bytes},
            prompt_text,
        ]

        response = _generate_content_with_fallback(
            parts,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )

        raw = response.text.strip()
        logger.debug("Gemini raw response (first 500 chars): %s", raw[:500])

        # Strip markdown code fences if Gemini wraps its JSON response in them.
        # Handles: ```json\n{...}\n```, ```\n{...}\n```, or plain {..} (no fences).
        if raw.startswith("```"):
            # Remove the opening fence line (e.g. '```json' or '```')
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        raw = raw.strip()
        if raw.endswith("```"):
            raw = raw[:-3].strip()

        parsed = json.loads(raw)

        is_suitable = parsed.get("isSuitable", True)
        unsuitable_msg = parsed.get("unsuitableMessage", "")
        space_analysis = parsed.get("spaceAnalysis", {})
        budget = _parse_budget_number(user_preference)
        space_analysis["maxBudget"] = budget
        space_analysis["isSuitable"] = is_suitable
        space_analysis["unsuitableMessage"] = unsuitable_msg

        logger.info(
            "Gemini analysis: isSuitable=%s, interiorStyle=%s, raw_recs=%d",
            is_suitable,
            space_analysis.get("interiorStyle", "N/A"),
            len(parsed.get("recommendations", [])),
        )

        # If image is unsuitable (e.g. face, pet, unrelated), return 0 recommendations
        if not is_suitable:
            return {
                "spaceAnalysis": space_analysis,
                "recommendations": [],
            }

        # Filter recommendations to ensure IDs strictly exist in the real catalogue.
        # Any hallucinated product ID from Gemini is logged and dropped.
        valid_ids = {p["id"] for p in catalogue}
        validated_recs = []
        for rec in parsed.get("recommendations", []):
            prod_id = rec.get("productId")
            if prod_id in valid_ids:
                validated_recs.append({
                    "productId": prod_id,
                    "reason": rec.get("reason", "Harmonious aesthetic match for this room."),
                    "matchScore": int(min(98, max(60, rec.get("matchScore", 85)))),
                })
            else:
                logger.warning(
                    "Gemini recommended productId '%s' which is NOT in the real catalogue — skipped.",
                    prod_id,
                )

        logger.info(
            "Validated recommendations: %d (from %d raw)",
            len(validated_recs),
            len(parsed.get("recommendations", [])),
        )

        return {
            "spaceAnalysis": space_analysis,
            "recommendations": validated_recs[:3],
        }

    except Exception as e:
        logger.exception("Gemini space analysis failed")
        # Propagate error clearly — no silent fallbacks or hardcoded defaults
        raise RuntimeError(f"Gemini Vision analysis error: {str(e)}")
