"""KalaHaat – auth router (mock OTP login).

Endpoints:
  POST /auth/otp/request  – send (mock) OTP to phone
  POST /auth/otp/verify   – verify OTP, return JWT
  GET  /auth/me           – current user profile
  PUT  /auth/me           – update profile / artisan details
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user
from app.config import settings
from app.database import get_db
from app.models import ArtisanProfile, User, UserRole
from app.schemas import (
    ArtisanProfileIn,
    ArtisanProfileOut,
    OTPRequest,
    OTPVerify,
    ProfileOut,
    TokenResponse,
    UserOut,
)

router = APIRouter()


# ─────────────────────────── OTP flow ────────────────────────────

@router.post("/otp/request", summary="Request a mock OTP")
def request_otp(body: OTPRequest):
    """In demo mode, this always succeeds.  Real SMS integration goes here later."""
    return {
        "message": f"OTP sent to {body.phone} (demo: use {settings.MOCK_OTP_CODE})",
        "phone": body.phone,
    }


@router.post("/otp/verify", response_model=TokenResponse, summary="Verify OTP and get JWT")
def verify_otp(body: OTPVerify, db: Session = Depends(get_db)):
    """Accept any 6-digit OTP in demo mode, or the fixed mock code.

    Creates the user on first login (auto-registration).
    """
    # In demo mode accept any 6-digit code
    if len(body.otp) != 6 or not body.otp.isdigit():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP must be 6 digits")

    # Find or create user
    user = db.query(User).filter(User.phone == body.phone).first()
    is_new = user is None

    if user is None:
        user = User(phone=body.phone, role=UserRole.buyer)
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id, user.role)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        role=user.role,
        is_new_user=is_new,
    )


# ─────────────────────────── Profile ─────────────────────────────

@router.get("/me", response_model=ProfileOut, summary="Get current user profile")
def get_me(user: User = Depends(get_current_user)):
    return ProfileOut(
        user=UserOut.model_validate(user),
        artisan_profile=(
            ArtisanProfileOut.model_validate(user.artisan_profile)
            if user.artisan_profile
            else None
        ),
    )


@router.put("/me", response_model=ProfileOut, summary="Update profile and/or artisan details")
def update_me(
    body: ArtisanProfileIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the user's name and optionally create/update their artisan profile.

    Setting ``role`` to ``artisan`` auto-creates the artisan profile.
    """
    # Update user fields
    if body.name:
        user.name = body.name
    if body.role in {r.value for r in UserRole}:
        user.role = body.role

    # Create or update artisan profile when role is artisan or facilitator
    if user.role in (UserRole.artisan, "artisan", UserRole.facilitator, "facilitator"):
        profile = user.artisan_profile
        if profile is None:
            profile = ArtisanProfile(user_id=user.id)
            db.add(profile)

        profile.craft_types = body.craft_types
        profile.village = body.village
        profile.years_practising = body.years_practising
        profile.bio = body.bio
        if body.avatar_url:
            profile.avatar_url = body.avatar_url

    db.commit()
    db.refresh(user)

    return ProfileOut(
        user=UserOut.model_validate(user),
        artisan_profile=(
            ArtisanProfileOut.model_validate(user.artisan_profile)
            if user.artisan_profile
            else None
        ),
    )


# ─────────────────────────── Public Artisan Profiles ─────────────

@router.get("/artisans", response_model=list[ProfileOut], summary="List all active artisans")
def list_artisans(db: Session = Depends(get_db)):
    """Public directory of all registered artisans with their profiles."""
    artisans = (
        db.query(User)
        .join(ArtisanProfile, ArtisanProfile.user_id == User.id)
        .all()
    )
    return [
        ProfileOut(
            user=UserOut.model_validate(u),
            artisan_profile=ArtisanProfileOut.model_validate(u.artisan_profile) if u.artisan_profile else None,
        )
        for u in artisans
    ]


@router.get("/artisans/{user_id}", response_model=ProfileOut, summary="Get public artisan profile")
def get_artisan_public_profile(user_id: str, db: Session = Depends(get_db)):
    """Fetch public profile for a specific artisan."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.artisan_profile:
        raise HTTPException(status_code=404, detail="Artisan profile not found")
    return ProfileOut(
        user=UserOut.model_validate(user),
        artisan_profile=ArtisanProfileOut.model_validate(user.artisan_profile),
    )

