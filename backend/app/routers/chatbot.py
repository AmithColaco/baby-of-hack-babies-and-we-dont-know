"""KAARIGAR – AI Space Stylist Chatbot Router.

Endpoints:
  POST /chatbot/analyze-space – analyze uploaded room photograph and return
                                tailored recommendations from the real product catalogue.
"""

from __future__ import annotations

import logging
import re
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
from app.services import ai_service, rag_service, spatial_stylist
from app.services.spatial_stylist import SpatialStylistOutput

logger = logging.getLogger(__name__)

router = APIRouter()


MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024  # 8 MB
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post(
    "/spatial-stylist",
    response_model=SpatialStylistOutput,
    summary="Principal Spatial AI Architect: 4-phase spatial reasoning and masterwork harmonization",
)
async def spatial_stylist_endpoint(
    image: Optional[UploadFile] = File(None, description="Photograph of room, wall, desk, or architectural envelope"),
    room_image: Optional[UploadFile] = File(None, description="Alternative field name matching data contract specification"),
    room_metadata: Optional[str] = Form(None, description="Optional JSON or text describing room type, dimensions, flooring"),
    preference: str = Form("", description="Optional patron budget and placement constraints"),
    db: Session = Depends(get_db),
):
    """Execute complete 4-phase Spatial AI Architecture evaluation:
    Phase 1: Architectural Aesthetic & Fixed Envelope Extraction
    Phase 2: Photometric & Light Temperature Profiling (CCT 2200K - 6500K)
    Phase 3: Spatial Clearance & Suitability Guardrails (circulation >= 75cm/90cm)
    Phase 4: Masterwork Harmonization & Curated Selection (60-30-10 rule, 3D placement)
    """
    target_file = room_image or image
    if target_file is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An image file is required under form field 'room_image' or 'image'.",
        )

    content_type = target_file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type: '{content_type}'. Allowed types: JPEG, PNG, WebP.",
        )

    try:
        image_bytes = await target_file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded image: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not read uploaded image.")

    if len(image_bytes) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded image file is empty.")
    if len(image_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Image size exceeds 8 MB.")

    meta_dict: dict = {}
    if room_metadata:
        try:
            meta_dict = json.loads(room_metadata) if room_metadata.strip().startswith("{") else {"description": room_metadata}
        except Exception:
            meta_dict = {"description": room_metadata}
    if preference:
        meta_dict["preference"] = preference.strip()

    catalogue = get_all_catalogue_products(db=db)

    result = await spatial_stylist.evaluate_room_spatial_intelligence(
        image_bytes=image_bytes,
        mime_type=content_type,
        room_metadata=meta_dict,
        catalog_corpus=catalogue,
    )
    return result


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
    """Analyze an uploaded room/space photograph using Spatial AI Architect & Gemini Vision.

    Retrieves real products from the KAARIGAR catalogue, evaluates architectural aesthetic,
    photometric CCT profile, and spatial clearance, returning grounded recommendations.
    """
    content_type = image.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type: '{content_type}'. Allowed types: JPEG, PNG, WebP.",
        )

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

    catalogue = get_all_catalogue_products(db=db)
    catalogue_by_id = {p["id"]: p for p in catalogue}

    # Execute Spatial AI Architect evaluation
    spatial_eval = await spatial_stylist.evaluate_room_spatial_intelligence(
        image_bytes=image_bytes,
        mime_type=content_type,
        room_metadata={"preference": preference.strip()},
        catalog_corpus=catalogue,
    )

    is_suitable = spatial_eval.suitability_guard.status != "REJECTED"
    unsuitable_msg = ""
    if not is_suitable:
        risk_msgs = [c.measured_risk for c in spatial_eval.suitability_guard.critical_spatial_constraints]
        unsuitable_msg = risk_msgs[0] if risk_msgs else "The uploaded photograph captures a person portrait or isolated item closeup rather than an interior living space."

    # Hydrate recommendations with full product records from catalogue
    recommendations_out: list[ChatbotRecommendation] = []
    if is_suitable:
        for rec in spatial_eval.harmonized_recommendations:
            prod_data = catalogue_by_id.get(rec.sku)
            if not prod_data:
                # Fallback search by title
                for p in catalogue:
                    if p["title"].lower() == rec.product_name.lower():
                        prod_data = p
                        break
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

            rationale_dict = {
                "aesthetic_bridge": rec.design_rationale.aesthetic_bridge,
                "material_dialogue": rec.design_rationale.material_dialogue,
                "chromatic_fit": rec.design_rationale.chromatic_fit,
            }
            placement_dict = {
                "anchor_reference": rec.spatial_placement.anchor_reference,
                "orientation_angle_deg": rec.spatial_placement.orientation_angle_deg,
                "recommended_clearance_cm": rec.spatial_placement.recommended_clearance_cm,
            }

            recommendations_out.append(
                ChatbotRecommendation(
                    product=product_out,
                    reason=f"{rec.design_rationale.aesthetic_bridge} {rec.design_rationale.chromatic_fit}",
                    matchScore=rec.match_score,
                    designRationale=rationale_dict,
                    spatialPlacement=placement_dict,
                    photometricInteraction=rec.photometric_interaction,
                )
            )

    # Format space analysis response
    ra = spatial_eval.room_assessment
    photo = ra.photometric_profile
    fixed = ra.fixed_envelope_elements

    budget = None
    b_match = re.search(r'[\u20b9]?\s*(\d[\d,]*)', preference)
    if b_match:
        try:
            budget = float(b_match.group(1).replace(",", ""))
        except ValueError:
            budget = None

    space_analysis_out = ChatbotSpaceAnalysis(
        isSuitable=is_suitable,
        unsuitableMessage=unsuitable_msg,
        dominantColors=["#EFE7DA", "#8C6239", "#2E4057", "#C07A46"] if is_suitable else [],
        interiorStyle=ra.primary_architectural_style,
        secondaryInfluences=ra.secondary_influences,
        spaceMood=f"{ra.primary_architectural_style} with {photo.diffusion_level} illumination",
        colorDescription=f"Ambient CCT estimated at {photo.ambient_cct_kelvin}K with {photo.light_directionality}.",
        spaceDescription=spatial_eval.styling_narrative,
        suggestedCategories=["ceramics", "textiles", "paintings", "metalcraft", "woodcraft"] if is_suitable else [],
        suggestedPlacements=[r.spatial_placement.anchor_reference for r in spatial_eval.harmonized_recommendations[:3]],
        maxBudget=budget,
        ambientCctKelvin=photo.ambient_cct_kelvin,
        lightDirectionality=photo.light_directionality,
        diffusionLevel=photo.diffusion_level,
        lightingRecommendation=photo.lighting_recommendation,
        suitabilityStatus=spatial_eval.suitability_guard.status,
        fixedEnvelope={
            "flooring": fixed.flooring,
            "walls": fixed.walls,
            "ceiling": fixed.ceiling,
            "architectural_features": fixed.architectural_features,
        },
        stylingNarrative=spatial_eval.styling_narrative,
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

