"""KAARIGAR – Custom Commissions Router.

Allows buyers to commission bespoke handcrafted pieces directly from certified artisans,
and enables master artisans to submit competitive quotes with delivery timelines and material notes.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import CommissionQuote, CommissionRequest, User, UserRole
from app.routers.auth import get_current_user
from app.schemas import (
    CommissionQuoteCreate,
    CommissionQuoteOut,
    CommissionRequestCreate,
    CommissionRequestOut,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=CommissionRequestOut, status_code=status.HTTP_201_CREATED, summary="Create custom commission request")
def create_commission_request(
    body: CommissionRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """A buyer submits a bespoke handcrafted commission request."""
    req = CommissionRequest(
        buyer_id=current_user.id,
        craft_type=body.craft_type,
        title=body.title,
        description=body.description,
        dimensions=body.dimensions,
        target_budget=body.target_budget,
        deadline_days=body.deadline_days,
        reference_image_url=body.reference_image_url,
        status="OPEN",
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    out = CommissionRequestOut.model_validate(req)
    out.buyer_name = current_user.name or current_user.phone
    out.quotes = []
    return out


@router.get("/", response_model=list[CommissionRequestOut], summary="List custom commission requests")
def list_commission_requests(
    craft_type: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    my_requests: bool = Query(False),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List open commission requests for artisans to quote on, or patron's own requests."""
    query = db.query(CommissionRequest).options(
        joinedload(CommissionRequest.buyer),
        joinedload(CommissionRequest.quotes).joinedload(CommissionQuote.artisan),
    )

    if my_requests and current_user:
        query = query.filter(CommissionRequest.buyer_id == current_user.id)
    if craft_type:
        query = query.filter(CommissionRequest.craft_type == craft_type)
    if status_filter:
        query = query.filter(CommissionRequest.status == status_filter)

    records = query.order_by(CommissionRequest.created_at.desc()).all()

    result = []
    for r in records:
        item = CommissionRequestOut.model_validate(r)
        item.buyer_name = r.buyer.name if r.buyer and r.buyer.name else (r.buyer.phone if r.buyer else "Patron")
        quotes_out = []
        for q in r.quotes:
            q_out = CommissionQuoteOut.model_validate(q)
            q_out.artisan_name = q.artisan.name if q.artisan and q.artisan.name else "Master Artisan"
            quotes_out.append(q_out)
        item.quotes = quotes_out
        result.append(item)

    return result


@router.get("/{id}", response_model=CommissionRequestOut, summary="Get single commission request details")
def get_commission_request(
    id: str,
    db: Session = Depends(get_db),
):
    req = db.query(CommissionRequest).options(
        joinedload(CommissionRequest.buyer),
        joinedload(CommissionRequest.quotes).joinedload(CommissionQuote.artisan),
    ).filter(CommissionRequest.id == id).first()

    if not req:
        raise HTTPException(status_code=404, detail="Commission request not found")

    item = CommissionRequestOut.model_validate(req)
    item.buyer_name = req.buyer.name if req.buyer and req.buyer.name else (req.buyer.phone if req.buyer else "Patron")
    quotes_out = []
    for q in req.quotes:
        q_out = CommissionQuoteOut.model_validate(q)
        q_out.artisan_name = q.artisan.name if q.artisan and q.artisan.name else "Master Artisan"
        quotes_out.append(q_out)
    item.quotes = quotes_out
    return item


@router.post("/{id}/quote", response_model=CommissionQuoteOut, status_code=status.HTTP_201_CREATED, summary="Artisan submits quote for a commission")
def submit_commission_quote(
    id: str,
    body: CommissionQuoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """A master artisan submits a quote for an open commission request."""
    req = db.get(CommissionRequest, id)
    if not req:
        raise HTTPException(status_code=404, detail="Commission request not found")

    quote = CommissionQuote(
        commission_id=id,
        artisan_id=current_user.id,
        quoted_price=body.quoted_price,
        estimated_days=body.estimated_days,
        materials_description=body.materials_description,
        notes=body.notes,
        status="PENDING",
    )
    db.add(quote)

    # Update request status to QUOTED if still OPEN
    if req.status == "OPEN":
        req.status = "QUOTED"

    db.commit()
    db.refresh(quote)

    out = CommissionQuoteOut.model_validate(quote)
    out.artisan_name = current_user.name or current_user.phone or "Master Artisan"
    return out


@router.post("/{id}/accept-quote/{quote_id}", response_model=CommissionRequestOut, summary="Buyer accepts an artisan's quote")
def accept_commission_quote(
    id: str,
    quote_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """The buyer accepts a specific quote from an artisan."""
    req = db.get(CommissionRequest, id)
    if not req:
        raise HTTPException(status_code=404, detail="Commission request not found")

    if req.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the commission creator can accept a quote")

    quote = db.get(CommissionQuote, quote_id)
    if not quote or quote.commission_id != id:
        raise HTTPException(status_code=404, detail="Quote not found for this commission")

    quote.status = "ACCEPTED"
    req.status = "ACCEPTED"

    # Decline any other quotes
    for other in req.quotes:
        if other.id != quote_id:
            other.status = "DECLINED"

    db.commit()
    return get_commission_request(id, db)
