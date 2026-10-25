"""KAARIGAR – AI Space Stylist Chatbot Router.

Endpoints:
  POST /chatbot/analyze-space – analyze uploaded room photograph and return
                                tailored recommendations from the real product catalogue.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.data.catalogue import get_all_catalogue_products
from app.schemas import (
    ChatbotAnalyzeResponse,
    ChatbotChatRequest,
    ChatbotChatResponse,
    ChatbotProductOut,
    ChatbotRecommendation,
    ChatbotSpaceAnalysis,
)
from app.services import ai_service, rag_service

logger = logging.getLogger(__name__)

router = APIRouter()


MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024  # 8 MB
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post(
    "/analyze-space",
    response_model=ChatbotAnalyzeResponse,
    summary="Analyze interior space image and return real catalogue recommendations",
)
async def analyze_space_endpoint(
    image: UploadFile = File(..., description="Photograph of room, desk, shelf, or wall space"),
    preference: str = Form("", description="Optional user preferences e.g. budget, color, placement"),
    db: Session = Depends(get_db),
):
    """Analyze an uploaded room/space photograph using Gemini Vision.

    Retrieves real products from the KAARIGAR catalogue, prompts Gemini with the visual context
    and product details, and returns structured analysis along with grounded recommendations.
    """
    # 1. Validate content type
    content_type = image.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type: '{content_type}'. Allowed types: JPEG, PNG, WebP.",
        )

    # 2. Read image bytes and validate size
    try:
        image_bytes = await image.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded image: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read uploaded image file.",
        )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image file is empty.",
        )

    if len(image_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image size exceeds {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB limit.",
        )

    # 3. Retrieve catalogue products (flagship masterpieces + published listings)
    catalogue = get_all_catalogue_products(db=db)
    catalogue_by_id = {p["id"]: p for p in catalogue}

    # 4. Invoke AI vision analysis
    try:
        raw_result = await ai_service.analyze_space(
            image_bytes=image_bytes,
            mime_type=content_type,
            user_preference=preference.strip(),
            catalogue=catalogue,
        )
    except RuntimeError as e:
        logger.warning(f"Chatbot analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Chatbot space analysis encountered an unexpected exception")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while analyzing your space: {str(e)}",
        )

    # 5. Hydrate recommendations with full product records from catalogue
    recommendations_out: list[ChatbotRecommendation] = []
    for rec in raw_result.get("recommendations", []):
        prod_id = rec.get("productId")
        prod_data = catalogue_by_id.get(prod_id)
        if not prod_data:
            continue

        product_out = ChatbotProductOut(
            id=prod_data["id"],
            title=prod_data["title"],
            craftTradition=prod_data.get("craftTradition", ""),
            category=prod_data.get("category", "crafts"),
            price=float(prod_data.get("price", 0)),
            artisan=prod_data.get("artisan", "Master Artisan"),
            region=prod_data.get("region", "India"),
            state=prod_data.get("state", ""),
            dimensions=prod_data.get("dimensions", ""),
            image=prod_data.get("image", "/images/textile.jpg"),
            colorPalette=prod_data.get("colorPalette", []),
            materials=prod_data.get("materials", []),
            technique=prod_data.get("technique", ""),
        )

        recommendations_out.append(
            ChatbotRecommendation(
                product=product_out,
                reason=rec.get("reason", "Aesthetic artisanal complement for your space."),
                matchScore=int(rec.get("matchScore", 85)),
            )
        )

    # 6. Format space analysis response
    raw_analysis = raw_result.get("spaceAnalysis", {})
    space_analysis_out = ChatbotSpaceAnalysis(
        isSuitable=bool(raw_analysis.get("isSuitable", True)),
        unsuitableMessage=raw_analysis.get("unsuitableMessage", ""),
        dominantColors=raw_analysis.get("dominantColors", []),
        interiorStyle=raw_analysis.get("interiorStyle", "contemporary"),
        spaceMood=raw_analysis.get("spaceMood", "Curated space"),
        colorDescription=raw_analysis.get("colorDescription", ""),
        spaceDescription=raw_analysis.get("spaceDescription", ""),
        suggestedCategories=raw_analysis.get("suggestedCategories", []),
        suggestedPlacements=raw_analysis.get("suggestedPlacements", []),
        maxBudget=raw_analysis.get("maxBudget"),
    )

    return ChatbotAnalyzeResponse(
        spaceAnalysis=space_analysis_out,
        recommendations=recommendations_out,
    )


@router.post(
    "/chat",
    response_model=ChatbotChatResponse,
    summary="Ask the KAARIGAR Curatorial Chatbot questions about crafts, artisans, or policies",
)
async def chat_endpoint(
    payload: ChatbotChatRequest,
    db: Session = Depends(get_db),
):
    """Query the KAARIGAR Curatorial Assistant.

    Retrieves verified knowledge chunks across craft traditions, master artisan lineages,
    making stages, and platform policies, and generates a context-augmented response with
    source citations and real product suggestions.
    """
    try:
        response = await rag_service.generate_rag_response(
            query=payload.message,
            history=payload.history,
            db=db,
        )
        return response
    except Exception as e:
        logger.exception("Error in chatbot RAG chat endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot failed to generate a response: {str(e)}",
        )

