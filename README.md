# KalaHaat – Virtual Marketplace for Coastal Artisans

> A voice-friendly platform where coastal artisans photograph a piece, get an AI-drafted listing with a craft story and fair price, and sell directly to buyers — with an immersive 3D virtual gallery.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + TypeScript |
| 3D Gallery | react-three-fiber + drei |
| i18n | react-i18next (English + Kannada) |
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL (SQLite fallback) |
| AI | Gemini API (multimodal) |
| Auth | JWT + mock OTP |
| Payments | MockProvider (Razorpay-swappable) |

## Project structure

```
kalahaat/
├── frontend/          # Vite React PWA
│   └── src/
│       ├── api/       # Axios API calls
│       ├── components/# Shared UI components
│       ├── contexts/  # AuthContext, CartContext
│       ├── gallery/   # Three.js/R3F scene components
│       ├── i18n/      # en.json, kn.json
│       ├── pages/     # Route-level pages
│       └── types/     # TypeScript types
└── backend/           # FastAPI
    └── app/
        ├── routers/   # auth, listings, orders, gallery, guide
        └── services/  # ai_service, price_service, payment_service
```

## Quick start

```bash
# Frontend
cd frontend
npm install
npm run dev           # http://localhost:5173

# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # fill in secrets
uvicorn main:app --reload  # http://localhost:8000
```

## Core Features

- **F1** Artisan onboarding (mock OTP + JWT)
- **F2** Listing creation with image upload
- **F3** AI listing assistant (Gemini multimodal)
- **F4** Transparent price suggestion
- **F5** Storefront catalogue with filters + search
- **F6** Craft provenance story card on every product
- **F7** Cart, checkout, and orders (mock payment)
- **F8** Artisan order dashboard
- **F9** 3D virtual gallery (orbit + click-to-buy)
- **F10** Voice input (Web Speech API)
- **F11** AI gallery guide with TTS narration
- **F12** English / Kannada language toggle
- **F13** Facilitator mode