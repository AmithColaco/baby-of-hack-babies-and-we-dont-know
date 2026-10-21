from contextlib import asynccontextmanager
import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.routers import auth, gallery, guide, listings, orders


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all tables on startup (for dev / demo).
    In production use Alembic migrations instead.
    """
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="KalaHaat API",
    version="0.1.0",
    description="Virtual Marketplace for Coastal Artisans — API",
    lifespan=lifespan,
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(listings.router, prefix="/listings", tags=["listings"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(gallery.router, prefix="/gallery", tags=["gallery"])
app.include_router(guide.router, prefix="/guide", tags=["guide"])

# ── Core Route Aliases (/me, /artisan/orders, /crafts, /artisans) ──
@app.get("/me", response_model=auth.ProfileOut, tags=["auth"], summary="Get current user profile (alias)")
def get_me_alias(user=Depends(auth.get_current_user)):
    return auth.get_me(user)


@app.put("/me", response_model=auth.ProfileOut, tags=["auth"], summary="Update profile (alias)")
def update_me_alias(
    body: auth.ArtisanProfileIn,
    user=Depends(auth.get_current_user),
    db=Depends(auth.get_db),
):
    return auth.update_me(body=body, user=user, db=db)


@app.get("/artisan/orders", response_model=list[orders.OrderOut], tags=["orders"], summary="Artisan orders (alias)")
def list_artisan_orders_alias(
    user=Depends(auth.get_current_user),
    db=Depends(orders.get_db),
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    return orders.list_artisan_orders(
        user=user, db=db, status_filter=status, limit=limit, offset=offset
    )


@app.get("/crafts", response_model=list[listings.CraftReferenceOut], tags=["crafts"], summary="List craft references (alias)")
def list_crafts_alias(db=Depends(listings.get_db)):
    return listings.list_crafts(db=db)


@app.get("/artisans", response_model=list[auth.ProfileOut], tags=["auth"], summary="List active artisans (alias)")
def list_artisans_alias(db=Depends(auth.get_db)):
    return auth.list_artisans(db=db)


# ── Static file serving for uploaded images ──
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "app": "KalaHaat", "docs": "/docs"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "healthy"}
