"""KalaHaat – FastAPI entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, listings, orders, gallery, guide

app = FastAPI(title="KalaHaat API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(listings.router, prefix="/listings", tags=["listings"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(gallery.router, prefix="/gallery", tags=["gallery"])
app.include_router(guide.router, prefix="/guide", tags=["guide"])


@app.get("/")
def root():
    return {"status": "ok", "app": "KalaHaat"}
