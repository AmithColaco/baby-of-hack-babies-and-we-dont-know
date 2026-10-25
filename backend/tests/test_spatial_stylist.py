"""KAARIGAR – Tests for Craft in Your Space (AI Interior Stylist) Spatial Intelligence Engine."""

import io
import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from main import app
from app.services.spatial_stylist import (
    SpatialStylistOutput,
    evaluate_room_spatial_intelligence,
)
from app.data.catalogue import CORE_CATALOGUE

client = TestClient(app)


def test_spatial_stylist_heuristic_pipeline():
    """Verify 4-phase sequential execution on valid interior room inputs."""
    # Synthetic 1x1 JPEG byte stream
    fake_img = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"

    import asyncio
    output: SpatialStylistOutput = asyncio.run(
        evaluate_room_spatial_intelligence(
            image_bytes=fake_img,
            mime_type="image/jpeg",
            room_metadata={"preference": "warm mid-century living room, teak console, budget 45000"},
            catalog_corpus=CORE_CATALOGUE,
        )
    )

    # Phase 1: Architectural Aesthetic & Fixed Envelope
    ra = output.room_assessment
    assert ra.primary_architectural_style != ""
    assert len(ra.secondary_influences) > 0
    assert ra.fixed_envelope_elements.flooring != ""
    assert ra.fixed_envelope_elements.walls != ""

    # Phase 2: Photometric CCT Profile (2200K - 6500K)
    photo = ra.photometric_profile
    assert 2200 <= photo.ambient_cct_kelvin <= 6500
    assert photo.diffusion_level in ("direct", "diffused", "high_contrast")
    assert len(photo.lighting_recommendation) > 10

    # Phase 3: Spatial Clearance & Suitability Guardrails
    guard = output.suitability_guard
    assert guard.status in ("APPROVED", "CONDITIONAL")
    assert len(guard.critical_spatial_constraints) > 0
    assert any("clearance" in c.clearance_rule.lower() or "cm" in c.clearance_rule.lower() for c in guard.critical_spatial_constraints)
    assert guard.max_furniture_envelope.max_length_cm > 0

    # Phase 4: Masterwork Harmonization & Curated Selection
    recs = output.harmonized_recommendations
    assert len(recs) > 0
    assert len(recs) <= 3
    for r in recs:
        assert r.sku != ""
        assert r.suitability_verdict in ("APPROVED", "CONDITIONAL")
        assert len(r.design_rationale.aesthetic_bridge) > 10
        assert len(r.design_rationale.material_dialogue) > 10
        assert "60-30-10" in r.design_rationale.chromatic_fit or "palette" in r.design_rationale.chromatic_fit.lower()
        assert r.spatial_placement.anchor_reference != ""
        assert r.spatial_placement.recommended_clearance_cm >= 75.0
        assert len(r.photometric_interaction) > 10

    # Executive Styling Narrative
    assert len(output.styling_narrative) > 30


def test_spatial_stylist_endpoint_api():
    """Verify POST /chatbot/spatial-stylist endpoint contract."""
    fake_img = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
    files = {"image": ("room.jpg", fake_img, "image/jpeg")}
    data = {
        "room_metadata": json.dumps({"room_type": "Living Room", "dimensions": "5m x 4m", "ceiling_height": "3.2m"}),
        "preference": "Minimalist gallery wall, budget 50000",
    }

    res = client.post("/chatbot/spatial-stylist", files=files, data=data)
    assert res.status_code == 200
    data_out = res.json()

    assert "room_assessment" in data_out
    assert "suitability_guard" in data_out
    assert "harmonized_recommendations" in data_out
    assert "styling_narrative" in data_out

    ra = data_out["room_assessment"]
    assert "primary_architectural_style" in ra
    assert "photometric_profile" in ra
    assert ra["photometric_profile"]["ambient_cct_kelvin"] > 0

    assert data_out["suitability_guard"]["status"] in ("APPROVED", "CONDITIONAL")
    assert len(data_out["harmonized_recommendations"]) > 0


def test_analyze_space_enriched_with_spatial_intelligence():
    """Verify that existing POST /chatbot/analyze-space is enriched with spatial metadata."""
    fake_img = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
    files = {"image": ("room.jpg", fake_img, "image/jpeg")}
    data = {"preference": "teak credenza display"}

    res = client.post("/chatbot/analyze-space", files=files, data=data)
    assert res.status_code == 200
    res_data = res.json()

    assert "spaceAnalysis" in res_data
    assert "recommendations" in res_data
    sa = res_data["spaceAnalysis"]
    assert sa["isSuitable"] is True
    assert sa["ambientCctKelvin"] is not None
    assert sa["ambientCctKelvin"] >= 2200
    assert sa["stylingNarrative"] is not None

    if res_data["recommendations"]:
        first_rec = res_data["recommendations"][0]
        assert "designRationale" in first_rec
        assert "spatialPlacement" in first_rec
