"""KalaHaat – Gemini AI service.

Provides:
  1. `generate_ai_draft()`  – images + transcript → structured listing draft
  2. `generate_narration()` – listing data → gallery guide narration text

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


def _get_model():
    """Lazily initialise the Gemini model so import never fails."""
    global _model
    if _model is not None:
        return _model

    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set – AI features will return fallback data")
        return None

    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        _model = genai.GenerativeModel(settings.GEMINI_MODEL)
        return _model
    except Exception:
        logger.exception("Failed to initialise Gemini model")
        return None


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
Price: ₹{price}

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
            f"{story} It is priced at ₹{price:.0f}."
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
            f"{story} It is priced at ₹{price:.0f}."
        )
