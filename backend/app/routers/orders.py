"""KalaHaat – orders router.

Endpoints:
  POST   /orders                    – checkout (atomic, idempotent)
  GET    /orders/{id}               – order detail (buyer or artisan)
  GET    /orders                    – buyer's orders
  GET    /artisan/orders            – artisan's incoming orders
  PATCH  /orders/{id}/status        – artisan state transition
"""

import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, get_current_user_optional
from app.database import get_db
from app.models import (
    Listing,
    Order,
    OrderItem,
    OrderStatus,
    OrderTimelineUpdate,
    Payment,
    PaymentStatus,
    User,
    UserRole,
)
from app.schemas import (
    CheckoutRequest,
    OrderOut,
    OrderItemOut,
    OrderStatusUpdate,
    OrderTimelineUpdateCreate,
    OrderTimelineUpdateOut,
    PaymentOut,
)
from app.services.payment_service import payment_provider

router = APIRouter()

# Legal order status transitions (order state machine)
_TRANSITIONS: dict[str, set[str]] = {
    OrderStatus.PLACED: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
    OrderStatus.CONFIRMED: {OrderStatus.SHIPPED, OrderStatus.CANCELLED},
    OrderStatus.SHIPPED: {OrderStatus.DELIVERED},
    OrderStatus.DELIVERED: set(),
    OrderStatus.CANCELLED: set(),
}


def _order_to_out(order: Order) -> OrderOut:
    """Convert ORM Order to response schema with enriched items."""
    items = []
    for item in order.items:
        out = OrderItemOut.model_validate(item)
        if item.listing:
            out.listing_title = item.listing.title
        items.append(out)

    payment_out = None
    if order.payment:
        payment_out = PaymentOut.model_validate(order.payment)

    timeline_list = []
    if hasattr(order, "timeline_updates") and order.timeline_updates:
        timeline_list = [OrderTimelineUpdateOut.model_validate(t) for t in order.timeline_updates]

    return OrderOut(
        id=order.id,
        buyer_id=order.buyer_id,
        status=order.status,
        total_inr=order.total_inr,
        address_json=order.address_json,
        payment_status=order.payment_status,
        courier=getattr(order, "courier", "BlueDart Heritage Express") or "BlueDart Heritage Express",
        tracking_number=getattr(order, "tracking_number", "") or f"KG-{order.id[:8].upper()}-IN",
        payment_method=getattr(order, "payment_method", "mock_upi") or "mock_upi",
        upi_ref=getattr(order, "upi_ref", "") or "",
        idempotency_key=order.idempotency_key,
        created_at=order.created_at,
        items=items,
        payment=payment_out,
        timeline_updates=timeline_list,
    )


# ──────────────────────── Checkout ───────────────────────────────

@router.post("", response_model=OrderOut, status_code=201, summary="Checkout – create order (atomic)")
def checkout(
    body: CheckoutRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atomic checkout:
    1. Check idempotency key – return existing order if duplicate.
    2. Require authenticated buyer.
    3. Lock and validate stock for each item.
    4. Create order + items in one transaction.
    5. Process mock payment.
    6. Commit or rollback.
    """
    # 1. Idempotency – return existing order if key already used
    existing = db.query(Order).filter(Order.idempotency_key == body.idempotency_key).first()
    if existing:
        return _order_to_out(existing)

    # 3. Lock listings and validate stock
    total = 0.0
    order_items: list[dict] = []

    for cart_item in body.items:
        # SELECT ... FOR UPDATE (on Postgres; SQLite just does a normal select)
        listing = (
            db.query(Listing)
            .filter(Listing.id == cart_item.listing_id)
            .with_for_update()
            .first()
        )
        if not listing:
            raise HTTPException(status_code=404, detail=f"Listing {cart_item.listing_id} not found")
        if listing.status != "PUBLISHED":
            raise HTTPException(status_code=400, detail=f"Listing '{listing.title}' is not available")
        if listing.stock < cart_item.qty:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{listing.title}' (available: {listing.stock}, requested: {cart_item.qty})",
            )

        # Decrement stock
        listing.stock -= cart_item.qty
        line_total = listing.price_inr * cart_item.qty
        total += line_total

        order_items.append({
            "listing_id": listing.id,
            "qty": cart_item.qty,
            "unit_price_inr": listing.price_inr,
        })

    # 3. Create order with courier and tracking number
    courier_choice = getattr(body, "courier", "BlueDart Heritage Express") or "BlueDart Heritage Express"
    tracking_code = f"KG-{int(datetime.now().timestamp() * 1000) % 100000000}-IN"

    order = Order(
        buyer_id=user.id,
        status=OrderStatus.PLACED,
        total_inr=round(total, 2),
        address_json=json.dumps(body.address),
        payment_status=PaymentStatus.PENDING,
        courier=courier_choice,
        tracking_number=tracking_code,
        payment_method=body.payment_method or "mock_upi",
        upi_ref=getattr(body, "upi_ref", "") or f"UPI-DEMO-{int(datetime.now().timestamp() * 1000) % 1000000}",
        idempotency_key=body.idempotency_key,
    )
    db.add(order)
    db.flush()  # get order.id

    for item_data in order_items:
        db.add(OrderItem(order_id=order.id, **item_data))

    # Initial Stage 1 timeline update
    initial_timeline = OrderTimelineUpdate(
        order_id=order.id,
        stage_index=1,
        stage_name="Raw Material Allocation & Order Inscribed",
        photo_url=order_items[0]["listing_id"] if order_items else "",
        note="Order confirmed. Certified natural materials and accession plates allocated at master atelier.",
    )
    db.add(initial_timeline)

    # 4. Process payment
    result = payment_provider.charge(
        amount_inr=order.total_inr,
        method=body.payment_method,
        metadata=body.address,
    )

    payment = Payment(
        order_id=order.id,
        provider=result.provider,
        status=PaymentStatus.SUCCESS if result.success else PaymentStatus.FAILED,
        ref=result.ref,
    )
    db.add(payment)

    if result.success:
        order.payment_status = PaymentStatus.SUCCESS
    else:
        order.payment_status = PaymentStatus.FAILED
        order.status = OrderStatus.CANCELLED
        # Restore stock on payment failure
        for cart_item in body.items:
            listing = db.get(Listing, cart_item.listing_id)
            if listing:
                listing.stock += cart_item.qty

    # 5. Commit
    db.commit()
    db.refresh(order)

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Payment failed: {result.message}",
        )

    return _order_to_out(order)


# ──────────────────────── Buyer orders ───────────────────────────

@router.get("", response_model=list[OrderOut], summary="List buyer's orders")
def list_buyer_orders(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
):
    orders = (
        db.query(Order)
        .filter(Order.buyer_id == user.id)
        .options(
            joinedload(Order.items).joinedload(OrderItem.listing),
            joinedload(Order.payment),
        )
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    # Deduplicate
    seen = set()
    unique = []
    for o in orders:
        if o.id not in seen:
            seen.add(o.id)
            unique.append(o)
    return [_order_to_out(o) for o in unique]


# ──────────────────────── Artisan orders ─────────────────────────
# NOTE: This route MUST be defined before /{order_id} to avoid
# FastAPI matching "artisan" as an order_id.

@router.get(
    "/artisan/orders",
    response_model=list[OrderOut],
    summary="Artisan's incoming orders",
)
def list_artisan_orders(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
):
    """Return orders that contain at least one item from this artisan's listings."""
    artisan_listing_ids = [l.id for l in user.listings] if user.listings else []
    if not artisan_listing_ids:
        return []

    query = (
        db.query(Order)
        .join(OrderItem)
        .filter(OrderItem.listing_id.in_(artisan_listing_ids))
        .options(
            joinedload(Order.items).joinedload(OrderItem.listing),
            joinedload(Order.payment),
        )
    )

    if status_filter:
        query = query.filter(Order.status == status_filter)

    orders = query.order_by(Order.created_at.desc()).offset(offset).limit(limit).all()
    seen = set()
    unique = []
    for o in orders:
        if o.id not in seen:
            seen.add(o.id)
            unique.append(o)
    return [_order_to_out(o) for o in unique]


# ──────────────────────── Order detail ───────────────────────────

@router.get("/{order_id}", response_model=OrderOut, summary="Get order detail")
def get_order(
    order_id: str,
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .options(
            joinedload(Order.items).joinedload(OrderItem.listing),
            joinedload(Order.payment),
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # If authenticated, enforce ownership unless admin or artisan who made the piece
    if user is not None and user.role not in ("admin",):
        if order.buyer_id != user.id:
            artisan_listing_ids = {l.id for l in user.listings} if user.listings else set()
            order_listing_ids = {item.listing_id for item in order.items}
            if not artisan_listing_ids & order_listing_ids:
                raise HTTPException(status_code=403, detail="Not your order")

    return _order_to_out(order)


# ──────────────────────── Status transitions ─────────────────────

@router.patch("/{order_id}/status", response_model=OrderOut, summary="Update order status")
def update_order_status(
    order_id: str,
    body: OrderStatusUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Enforce legal state transitions:
    PLACED → CONFIRMED → SHIPPED → DELIVERED
    Any non-terminal → CANCELLED
    """
    order = (
        db.query(Order)
        .options(
            joinedload(Order.items).joinedload(OrderItem.listing),
            joinedload(Order.payment),
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Only the artisan whose listings are in this order (or admin) can transition
    if user.role not in ("admin",):
        artisan_listing_ids = {l.id for l in user.listings} if user.listings else set()
        order_listing_ids = {item.listing_id for item in order.items}
        if not artisan_listing_ids & order_listing_ids:
            raise HTTPException(status_code=403, detail="Not your order to manage")

    current = order.status
    target = body.status

    allowed = _TRANSITIONS.get(current, set())
    if target not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {current} to {target}. Allowed: {allowed or 'none (terminal state)'}",
        )

    order.status = target

    # If cancelled, restore stock
    if target == OrderStatus.CANCELLED:
        for item in order.items:
            listing = db.get(Listing, item.listing_id)
            if listing:
                listing.stock += item.qty

    db.commit()
    db.refresh(order)
    return _order_to_out(order)


# ──────────────────────── Process Timeline Updates ──────────────────────────

@router.post("/{order_id}/timeline", response_model=OrderTimelineUpdateOut, status_code=201, summary="Artisan posts stage photo & note")
def add_order_timeline_update(
    order_id: str,
    body: OrderTimelineUpdateCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Artisan posts photographic proof and progress notes for a made-to-order piece."""
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    timeline_entry = OrderTimelineUpdate(
        order_id=order_id,
        stage_index=body.stage_index,
        stage_name=body.stage_name,
        photo_url=body.photo_url,
        note=body.note,
    )
    db.add(timeline_entry)

    # Automatically advance order status if stage 4 or 5
    if body.stage_index >= 4 and order.status in (OrderStatus.PLACED, OrderStatus.CONFIRMED):
        order.status = OrderStatus.SHIPPED
    elif body.stage_index >= 2 and order.status == OrderStatus.PLACED:
        order.status = OrderStatus.CONFIRMED

    db.commit()
    db.refresh(timeline_entry)
    return OrderTimelineUpdateOut.model_validate(timeline_entry)


@router.get("/{order_id}/timeline", response_model=list[OrderTimelineUpdateOut], summary="Get stage timeline updates for an order")
def get_order_timeline(
    order_id: str,
    db: Session = Depends(get_db),
):
    """Public/buyer lookup of artisan crafting milestones for an accessioned piece."""
    updates = (
        db.query(OrderTimelineUpdate)
        .filter(OrderTimelineUpdate.order_id == order_id)
        .order_by(OrderTimelineUpdate.stage_index.asc(), OrderTimelineUpdate.created_at.asc())
        .all()
    )
    return [OrderTimelineUpdateOut.model_validate(u) for u in updates]

