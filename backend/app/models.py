"""KalaHaat – database models (SQLAlchemy 2).

Core data models:
  users, artisan_profiles, listings, listing_images,
  stories, craft_reference, orders, order_items, payments
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# ──────────────────────────── helpers ────────────────────────────

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return uuid.uuid4().hex


# ──────────────────────────── enums ──────────────────────────────

class UserRole(str, enum.Enum):
    artisan = "artisan"
    buyer = "buyer"
    facilitator = "facilitator"
    admin = "admin"


class ListingStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class OrderStatus(str, enum.Enum):
    PLACED = "PLACED"
    CONFIRMED = "CONFIRMED"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


# ──────────────────────────── models ─────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    role: Mapped[str] = mapped_column(Enum(UserRole), default=UserRole.buyer)
    name: Mapped[str] = mapped_column(String(255), default="")
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    language: Mapped[str] = mapped_column(String(10), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # relationships
    artisan_profile: Mapped["ArtisanProfile | None"] = relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="ArtisanProfile.user_id",
    )
    listings: Mapped[list["Listing"]] = relationship(back_populates="artisan", cascade="all, delete-orphan")
    orders: Mapped[list["Order"]] = relationship(back_populates="buyer", cascade="all, delete-orphan")


class ArtisanProfile(Base):
    __tablename__ = "artisan_profiles"

    user_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    craft_types: Mapped[str] = mapped_column(Text, default="")  # comma-separated
    village: Mapped[str] = mapped_column(String(255), default="")
    years_practising: Mapped[int] = mapped_column(Integer, default=0)
    bio: Mapped[str] = mapped_column(Text, default="")
    avatar_url: Mapped[str] = mapped_column(String(500), default="")
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("users.id"), nullable=True
    )

    user: Mapped["User"] = relationship(back_populates="artisan_profile", foreign_keys=[user_id])


class CraftReference(Base):
    """Curated seed data: one row per recognised craft type."""
    __tablename__ = "craft_reference"

    craft_type: Mapped[str] = mapped_column(String(100), primary_key=True)
    origin_text: Mapped[str] = mapped_column(Text, default="")
    premium_multiplier: Mapped[float] = mapped_column(Float, default=1.0)
    notes: Mapped[str] = mapped_column(Text, default="")


class Story(Base):
    __tablename__ = "stories"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    listing_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("listings.id", ondelete="CASCADE"), unique=True
    )
    origin_text: Mapped[str] = mapped_column(Text, default="")
    process_text: Mapped[str] = mapped_column(Text, default="")
    price_rationale_json: Mapped[str] = mapped_column(Text, default="{}")
    qr_code_url: Mapped[str] = mapped_column(String(500), default="")

    listing: Mapped["Listing"] = relationship(back_populates="story")


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    artisan_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(500), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    craft_type: Mapped[str] = mapped_column(String(100), default="")
    materials: Mapped[str] = mapped_column(Text, default="")  # comma-separated
    technique: Mapped[str] = mapped_column(String(255), default="")
    dimensions: Mapped[str] = mapped_column(String(255), default="")
    hours_to_make: Mapped[float] = mapped_column(Float, default=0.0)
    price_inr: Mapped[float] = mapped_column(Float, default=0.0)
    stock: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(Enum(ListingStatus), default=ListingStatus.DRAFT)
    gallery_wing: Mapped[str] = mapped_column(String(100), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # relationships
    artisan: Mapped["User"] = relationship(back_populates="listings")
    images: Mapped[list["ListingImage"]] = relationship(
        back_populates="listing", cascade="all, delete-orphan", order_by="ListingImage.position"
    )
    story: Mapped["Story | None"] = relationship(
        back_populates="listing", uselist=False, cascade="all, delete-orphan"
    )
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="listing")


class ListingImage(Base):
    __tablename__ = "listing_images"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    listing_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("listings.id", ondelete="CASCADE")
    )
    url: Mapped[str] = mapped_column(String(500), default="")
    position: Mapped[int] = mapped_column(Integer, default=0)

    listing: Mapped["Listing"] = relationship(back_populates="images")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    buyer_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(Enum(OrderStatus), default=OrderStatus.PLACED)
    total_inr: Mapped[float] = mapped_column(Float, default=0.0)
    address_json: Mapped[str] = mapped_column(Text, default="{}")
    payment_status: Mapped[str] = mapped_column(
        Enum(PaymentStatus), default=PaymentStatus.PENDING
    )
    idempotency_key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # relationships
    buyer: Mapped["User"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    payment: Mapped["Payment | None"] = relationship(
        back_populates="order", uselist=False, cascade="all, delete-orphan"
    )

    __table_args__ = (UniqueConstraint("idempotency_key"),)


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    order_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("orders.id", ondelete="CASCADE")
    )
    listing_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("listings.id", ondelete="RESTRICT")
    )
    qty: Mapped[int] = mapped_column(Integer, default=1)
    unit_price_inr: Mapped[float] = mapped_column(Float, default=0.0)

    order: Mapped["Order"] = relationship(back_populates="items")
    listing: Mapped["Listing"] = relationship(back_populates="order_items")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    order_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("orders.id", ondelete="CASCADE"), unique=True
    )
    provider: Mapped[str] = mapped_column(String(50), default="mock")
    status: Mapped[str] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    ref: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    order: Mapped["Order"] = relationship(back_populates="payment")
