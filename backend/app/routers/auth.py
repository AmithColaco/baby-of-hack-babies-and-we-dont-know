"""KAARIGAR – auth router with Gmail SMTP OTP support.

Endpoints:
  POST /auth/otp/request  – send OTP to email (real Gmail SMTP) or phone (mock)
  POST /auth/otp/verify   – verify OTP, return JWT
  GET  /auth/me           – current user profile
  PUT  /auth/me           – update profile / artisan details
  GET  /auth/artisans     – list all artisans (public)
  GET  /auth/artisans/{id} – get specific artisan profile (public)

Email OTP flow (recommended):
  Set SMTP_USER and SMTP_PASSWORD in .env to your Gmail + App Password.
  A 6-digit OTP is generated, stored in memory (TTL 10 min), and emailed.
  When SMTP_USER is empty the server falls back to mock mode (any 6 digits work).
"""

import logging
import random
import re
import smtplib
import string
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user
from app.config import settings
from app.database import engine, get_db
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
logger = logging.getLogger(__name__)

# ─────────────────────── OTP store (DB backed + memory cache) ─────
# { identifier: {"code": "123456", "expires_at": datetime} }
_otp_store: dict[str, dict] = {}
OTP_TTL_MINUTES = 10


def _ensure_otp_table():
    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS otp_verifications (
                        identifier VARCHAR(255) PRIMARY KEY,
                        code VARCHAR(10) NOT NULL,
                        expires_at DATETIME NOT NULL
                    )
                    """
                )
            )
    except Exception as exc:
        logger.warning("Could not ensure otp_verifications table: %s", exc)


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def _store_otp(identifier: str) -> str:
    _ensure_otp_table()
    code = _generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)
    _otp_store[identifier] = {
        "code": code,
        "expires_at": expires_at,
    }
    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    INSERT INTO otp_verifications (identifier, code, expires_at)
                    VALUES (:id, :code, :exp)
                    ON CONFLICT(identifier) DO UPDATE SET code=:code, expires_at=:exp
                    """
                ),
                {"id": identifier, "code": code, "exp": expires_at.isoformat()},
            )
    except Exception as exc:
        logger.warning("Could not persist OTP in DB: %s", exc)
    return code


def _verify_otp_code(identifier: str, code: str) -> bool:
    """Return True if the code is valid.

    Mock mode (no SMTP_USER configured): accept any 6-digit numeric code.
    Real mode: check against the stored OTP and expiry (memory cache + SQLite).
    """
    if not settings.SMTP_USER:
        return len(code) == 6 and code.isdigit()

    now = datetime.now(timezone.utc)

    # 1. Check in-memory cache
    entry = _otp_store.get(identifier)
    if entry:
        if entry["expires_at"] < now:
            _otp_store.pop(identifier, None)
        elif entry["code"] == code:
            _otp_store.pop(identifier, None)
            try:
                with engine.begin() as conn:
                    conn.execute(
                        text("DELETE FROM otp_verifications WHERE identifier = :id"),
                        {"id": identifier},
                    )
            except Exception:
                pass
            return True

    # 2. Check SQLite table (survives uvicorn reloads and multi-process)
    try:
        _ensure_otp_table()
        with engine.begin() as conn:
            row = conn.execute(
                text("SELECT code, expires_at FROM otp_verifications WHERE identifier = :id"),
                {"id": identifier},
            ).fetchone()
            if row:
                stored_code, exp_val = row[0], row[1]
                exp_dt = None
                if isinstance(exp_val, str):
                    exp_dt = datetime.fromisoformat(exp_val)
                elif isinstance(exp_val, datetime):
                    exp_dt = exp_val
                if exp_dt and exp_dt.tzinfo is None:
                    exp_dt = exp_dt.replace(tzinfo=timezone.utc)

                if exp_dt and exp_dt < now:
                    conn.execute(
                        text("DELETE FROM otp_verifications WHERE identifier = :id"),
                        {"id": identifier},
                    )
                    return False

                if stored_code == code:
                    conn.execute(
                        text("DELETE FROM otp_verifications WHERE identifier = :id"),
                        {"id": identifier},
                    )
                    _otp_store.pop(identifier, None)
                    return True
    except Exception as exc:
        logger.warning("Error verifying OTP from DB: %s", exc)

    return False


# ─────────────────────── Email sender ────────────────────────────

def _send_otp_email(to_email: str, otp: str) -> None:
    """Send OTP email via Gmail SMTP (TLS on port 587)."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"{otp} is your KAARIGAR login code"
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to_email

    plain = (
        f"Your KAARIGAR verification code is: {otp}\n\n"
        f"This code expires in {OTP_TTL_MINUTES} minutes.\n"
        "If you did not request this, you can safely ignore this message."
    )
    html = f"""
    <html><body style="font-family:'Helvetica Neue',sans-serif;background:#FAF6EE;padding:0;margin:0;">
      <div style="max-width:480px;margin:40px auto;background:#fff;border:1px solid #E5D8C4;border-radius:12px;overflow:hidden;">
        <div style="background:#1C160E;padding:24px 32px;">
          <div style="color:#fff;font-size:1.4rem;font-weight:700;letter-spacing:0.08em;">KAARIGAR</div>
          <div style="color:#C4A882;font-size:0.8rem;margin-top:4px;">Direct from master hands to conscious homes</div>
        </div>
        <div style="padding:32px;">
          <p style="color:#3D3731;font-size:1rem;margin:0 0 8px 0;">Your login code:</p>
          <div style="font-size:2.75rem;font-weight:800;letter-spacing:0.18em;color:#1C160E;background:#F5EDE0;border-radius:8px;padding:16px 24px;display:inline-block;">{otp}</div>
          <p style="color:#7A6B59;font-size:0.85rem;margin:20px 0 0 0;">Expires in {OTP_TTL_MINUTES} minutes. Do not share this code.</p>
        </div>
        <div style="background:#FAF6EE;padding:16px 32px;border-top:1px solid #E5D8C4;">
          <p style="color:#8C7B6A;font-size:0.75rem;margin:0;">You are receiving this because you signed in to KAARIGAR.</p>
        </div>
      </div>
    </body></html>
    """
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to_email, msg.as_string())


# ─────────────────────────── OTP flow ────────────────────────────

@router.post("/otp/request", summary="Request OTP (email or phone)")
def request_otp(body: OTPRequest):
    """
    Sends a 6-digit OTP.
    - If `email` is provided and SMTP_USER is configured → real email via Gmail SMTP.
    - Otherwise falls back to mock mode (any 6-digit code works; demo: 123456).
    """
    identifier = (body.email or body.phone or "").strip().lower()
    if not identifier:
        raise HTTPException(status_code=400, detail="Provide email or phone.")

    use_real_email = bool(body.email and settings.SMTP_USER)

    if use_real_email:
        if not re.match(r"[^@]+@[^@]+\.[^@]+", body.email):
            raise HTTPException(status_code=400, detail="Invalid email address.")
        otp = _store_otp(identifier)
        try:
            _send_otp_email(body.email, otp)
            logger.info("OTP email sent to %s", body.email)
        except Exception as exc:
            logger.error("SMTP error sending OTP to %s: %s", body.email, exc)
            # Remove from store so the failed attempt doesn't block retry
            _otp_store.pop(identifier, None)
            raise HTTPException(
                status_code=500,
                detail="Could not send OTP email. Check SMTP settings in .env.",
            ) from exc
        return {"message": f"OTP sent to {body.email}", "email": body.email}

    # Phone / mock mode
    if body.phone:
        identifier = body.phone
    otp = _store_otp(identifier)
    logger.info("Mock OTP for %s: %s", identifier, otp)
    return {
        "message": f"Verification code sent to {body.phone or body.email}",
        "phone": body.phone,
    }


@router.post("/otp/verify", response_model=TokenResponse, summary="Verify OTP and get JWT")
def verify_otp(body: OTPVerify, db: Session = Depends(get_db)):
    """
    Accept the OTP and return a JWT.
    - Creates the user on first login (auto-registration).
    - `role` in the request body sets the role for new users (artisan | buyer).
    """
    identifier = (body.email or body.phone or "").strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Provide email or phone.")

    if len(body.otp) != 6 or not body.otp.isdigit():
        raise HTTPException(status_code=400, detail="OTP must be 6 digits.")

    lookup_id = identifier.lower()
    if not _verify_otp_code(lookup_id, body.otp):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP. Request a new code.",
        )

    # Find or create user
    user: User | None = None
    is_new = False

    if body.email:
        user = db.query(User).filter(User.email == body.email.lower()).first()
    elif body.phone:
        user = db.query(User).filter(User.phone == body.phone).first()

    if user is None:
        is_new = True
        desired_role_str = (body.role or "buyer").lower()
        desired_role = UserRole.artisan if desired_role_str == "artisan" else UserRole.buyer

        user = User(
            phone=body.phone or None,
            email=body.email.lower() if body.email else None,
            role=desired_role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Auto-create artisan profile stub for artisan role
        if user.role in (UserRole.artisan, UserRole.facilitator):
            profile = ArtisanProfile(user_id=user.id)
            db.add(profile)
            db.commit()
    else:
        # Existing user: update role if requested and currently buyer
        if body.role and body.role.lower() == "artisan" and user.role == UserRole.buyer:
            user.role = UserRole.artisan
            if not user.artisan_profile:
                profile = ArtisanProfile(user_id=user.id)
                db.add(profile)
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
    if body.name:
        user.name = body.name
    if body.role in {r.value for r in UserRole}:
        user.role = body.role

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
