"""KalaHaat – price suggestion service.

Implements the deterministic pricing formula from PRD §F4:

  suggested_price = (materials_cost + hours × fair_hourly_wage)
                    × craft_premium_multiplier
                    + platform_fee

The multiplier comes from craft_reference seed data.
Technique complexity adjusts the multiplier.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.config import settings
from app.models import CraftReference
from app.schemas import PriceBreakdown, PriceSuggestionRequest


# Complexity → multiplier bump on top of the base craft premium
_COMPLEXITY_BUMP: dict[str, float] = {
    "low": -0.1,
    "medium": 0.0,
    "high": 0.15,
    "very_high": 0.3,
}


def suggest_price(req: PriceSuggestionRequest, db: Session) -> PriceBreakdown:
    """Return a transparent price breakdown the artisan can review and override."""

    # Look up craft reference for the premium multiplier
    craft_ref = db.get(CraftReference, req.craft_type)
    base_multiplier = craft_ref.premium_multiplier if craft_ref else 1.0

    # Adjust by technique complexity
    complexity_bump = _COMPLEXITY_BUMP.get(req.technique_complexity, 0.0)
    craft_premium_multiplier = round(base_multiplier + complexity_bump, 2)

    # Core calculation
    fair_wage = settings.FAIR_HOURLY_WAGE_INR
    labour_cost = req.hours_to_make * fair_wage
    subtotal = req.materials_cost + labour_cost
    craft_premium_amount = round(subtotal * (craft_premium_multiplier - 1.0), 2)
    platform_fee = settings.PLATFORM_FEE_INR

    suggested = round(subtotal * craft_premium_multiplier + platform_fee, 2)

    # Provide a ±15 % range
    range_min = round(suggested * 0.85, 2)
    range_max = round(suggested * 1.15, 2)

    reasoning = (
        f"Materials ₹{req.materials_cost:.0f} + {req.hours_to_make:.1f}h × ₹{fair_wage:.0f}/h "
        f"= ₹{subtotal:.0f} base, ×{craft_premium_multiplier} craft premium "
        f"({req.craft_type}, {req.technique_complexity} complexity)"
    )

    return PriceBreakdown(
        materials_cost=req.materials_cost,
        labour_cost=round(labour_cost, 2),
        fair_hourly_wage=fair_wage,
        hours=req.hours_to_make,
        craft_premium_multiplier=craft_premium_multiplier,
        craft_premium_amount=craft_premium_amount,
        platform_fee=platform_fee,
        suggested_price=suggested,
        suggested_range={"min": range_min, "max": range_max},
        reasoning=reasoning,
    )
