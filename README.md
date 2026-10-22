# KAARIGAR · The Living Craft Archive

> **An archival digital sanctuary connecting India’s living master artisans directly with global custodians of culture.**  
> Built with an uncompromising commitment to radical compensation (100% direct maker distribution), verifiable material provenance, and museum-grade presentation.

[![React](https://img.shields.io/badge/Frontend-React_19.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript_6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite_6.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Runtime-Python_3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Gemini](https://img.shields.io/badge/AI-Google_Gemini_Multimodal-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

---

## 🏛 Platform Overview

**KAARIGAR** is a specialized cultural commerce platform engineered to liberate indigenous Indian artisans from exploitative middlemen, commercial tourism cartels, and algorithmic discounting. Unlike generic e-commerce storefronts, KAARIGAR treats every handcrafted piece as a numbered museum plate with rigorous material provenance, guild lineage records, and interactive storytelling.

```mermaid
graph TD
    Client[Collector / Connoisseur] -->|Browse & Curate| FE[React 19 Single Page App]
    Artisan[Master Artisan Atelier] -->|Publish & Manage| FE
    FE -->|Atelier Portal /dashboard| RBAC{Role-Based Access Control}
    RBAC -->|isArtisan: true| Dashboard[Artisan Atelier Portal]
    RBAC -->|isArtisan: false| GalleryRedirect[/gallery Redirect]
    FE -->|REST API / Axios| BE[FastAPI Backend Server]
    BE --> DB[(SQLite / PostgreSQL Engine)]
    BE -->|Multimodal Vision & NLP| Gemini[Google Gemini AI Engine]
    FE -->|Visual Interior Analysis| Stylist[Space Stylist Agent]
    Stylist -->|Upload Room Photo| Gemini
```

---

## ✨ Core Pillars & Features

### 1. Curatorial Exhibition Gallery & 6-Chapter Storyboard
* **Digital Exhibition View (`/gallery`)**: High-performance responsive grid featuring curated filtering across major GI-tagged traditions (Paintings, Blue Pottery, Handwoven Silks, Bastar Dhokra, Channapatna Woodcraft, Kundan Meenakari, Kasuti, Beedu, and Shell Craft).
* **Deep 6-Chapter Storyboard (`/shop/:id`)**: An immersive sequential narrative for every masterwork:
  1. *Scene 01: Meet the Masterwork* (Accession number, plate notation, and material breakdown)
  2. *Scene 02: Meet the Master Artisan* (Generational lineage, guild atelier, and personal philosophy)
  3. *Scene 03: Natural Material Alchemy* (Raw minerals, botanical extracts, organic binders)
  4. *Scene 04: The Making Journey* (Step-by-step physical transformation)
  5. *Scene 05: The Guild Lineage* (Regional cultural preservation metrics)
  6. *Scene 06: Curatorial Acquisition* (Transparent pricing breakdown, certificate of authenticity, and escrow purchase)
* **Technical Specifications Toggle**: One-click switch from editorial narrative to archival catalog dimensions, weight, and care instructions.

### 2. Role-Based Access Control (Artisan vs. Collector)
* **Master Artisan Persona**:
  * Exclusive access to the **Artisan Atelier Portal** (`/dashboard`).
  * Direct self-publishing studio (`/dashboard/create` and `/dashboard/edit/:id`).
  * Real-time order fulfillment dispatch, pricing breakdown, and inquiry inbox.
  * Access links visible in the site header, hero section, user menu, and footer.
* **Collector / Patron Persona**:
  * Clean, distraction-free curation experience.
  * Restricted from artisan tooling (automatic redirect from `/dashboard` to `/gallery`).
  * Wishlist curation, itemized order tracking, and receipt generation.

### 3. "Craft in Your Space" AI Interior Stylist
* Floating intelligent design agent powered by Google Gemini multimodal vision.
* Connoisseurs upload a photograph of their living space or wall; the stylist analyzes architectural style, color palettes, ambient lighting, and undertones to deliver tailored craft acquisition recommendations with match scores and placement rationales.

### 4. Zero-Placeholder Image Guarantee
* High-resolution, authentic artisanal photographs across all craft disciplines.
* Centralized graceful fallback handling (`handleImageError`) ensuring zero broken image cards or missing asset glitches even in offline/constrained bandwidth scenarios.

---

## 🎨 Protected Craft Traditions

| Tradition | Region & State | Primary Materials | Historic Lineage |
| :--- | :--- | :--- | :--- |
| **Pahari Miniature Painting** | Kangra Valley, Himachal Pradesh | Wasli paper, lapis lazuli, 24K gold foil, squirrel-hair brush | Circa 1780 Kangra Kalam |
| **Jaipur Blue Pottery** | Sanganer, Rajasthan | Crushed quartz rock, glass cullet, natural cobalt oxide | Turko-Persian clay-free guild |
| **Chanderi Brocade Silk** | Chanderi, Madhya Pradesh | Un-degummed mulberry silk, pure silver electroplated zari | Vedic & Mughal court weaving |
| **Bastar Lost-Wax Dhokra** | Kondagaon, Chhattisgarh | Bell-metal bronze, forest beeswax, riverbed alluvial clay | 4,000-year Harappan cire-perdue |
| **Channapatna Woodcraft** | Channapatna, Karnataka | Ivory wood (*Wrightia tinctoria*), vegetable dye shellac | Tipu Sultan royal atelier |
| **Kundan & Meenakari** | Walled City, Jaipur | 22K gold champlevé enamel, polki diamonds, 24K varq foil | Imperial Rajput court jewellery |
| **Kasuti Hand Embroidery** | Dharwad & Belgaum, Karnataka | Pure silk floss, handloom cotton, Gavanti/Murgi stitches | Chalukyan dynasty (6th Century) |
| **Beedu Grass Weaving** | Coastal Karnataka | Wild riverbed korai grass, vegetable mineral dyes | Coastal indigenous weavers |
| **Coastal Shell Craft** | Karwar & Gokarna, Karnataka | Polished beach cowrie shells, mother-of-pearl, beeswax | Marine community heirloom art |

---

## 🛠 Technology Stack

### Frontend Architecture
* **Core**: React 19.3.1, TypeScript 6.0.3, Vite 6.4.4
* **Routing**: React Router DOM 6.30.6 (declarative protected routes, scroll restoration)
* **Animation & Motion**: Framer Motion 14.4.0
* **Typography & Styling**: Bespoke editorial design system (`editorial.css`, `index.css`) utilizing CSS custom properties, HSL color tokens, responsive typographic scaling, and accessible contrast ratios.
* **Internationalization**: `react-i18next` with multi-language support (English & Kannada).

### Backend Architecture
* **Framework**: FastAPI 0.115 (asynchronous Python REST microservices)
* **Database & ORM**: SQLAlchemy 2.0 with SQLite engine (fully swappable with PostgreSQL)
* **Authentication**: Real JWT authentication with cryptographic bearer tokens + mock OTP dispatch
* **AI Vision Integration**: Google Gemini multimodal vision service for interior space analysis and listing auto-drafting.

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **Python**: v3.11 or higher
* **Package Managers**: `npm` and `pip`

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# (Optional) Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Seed the database with authentic craft data and artisan accounts
python seed.py

# Start the FastAPI backend server (runs at http://127.0.0.1:8000)
python -m uvicorn main:app --port 8000 --reload
```

### 2. Frontend Setup

```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server (runs at http://localhost:5173)
npm run dev
```

### 3. Verification & Health Check
* Open your browser and navigate to **`http://localhost:5173/`**.
* FastAPI Swagger Documentation: **`http://localhost:8000/docs`**.
* Health Check Endpoint: **`http://localhost:8000/health`**.

---

## 🔐 Demo Credentials & User Roles

| Role | Mobile Number | OTP | Default Destination | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Master Artisan** | `9123456780` or `9998887777` | `123456` | `/dashboard` | Publish listings, edit inventory, manage dispatch, view atelier payouts |
| **Art Collector** | `9876543210` or `9820155432` | `123456` | `/gallery` | Explore collections, curate wishlists, simulate acquisitions |

---

## 📁 Repository Structure

```
kaarigar/
├── backend/
│   ├── app/
│   │   ├── auth.py             # JWT token handling & passwordless OTP verification
│   │   ├── config.py           # Pydantic environment configurations
│   │   ├── database.py         # SQLAlchemy engine and session dependency
│   │   ├── models.py           # DB models: User, Listing, Story, Order, CraftReference
│   │   ├── schemas.py          # Pydantic schemas for request/response serialization
│   │   ├── routers/            # API endpoints: auth, listings, orders, gallery, chatbot
│   │   └── services/           # Gemini AI service, price calculation service
│   ├── tests/                  # Pytest integration & endpoint test suite
│   ├── kalahaat.db             # SQLite database instance
│   ├── main.py                 # FastAPI application factory & CORS configuration
│   ├── requirements.txt        # Backend Python dependencies
│   └── seed.py                 # Database seeding script with authentic craft listings
├── frontend/
│   ├── public/
│   │   └── images/             # 10 High-res authentic Indian craft masterwork images
│   ├── src/
│   │   ├── api/                # Axios API clients (auth, listings, orders, geminiStylist)
│   │   ├── components/         # Reusable UI (SiteHeader, SiteFooter, CartDrawer, etc.)
│   │   │   └── home/           # Landing page modules (HeroSection, FeaturedCarousel, etc.)
│   │   ├── contexts/           # AuthContext (role management), CartContext (shopping bag)
│   │   ├── data/               # Crafts static data and productStore persistence
│   │   ├── pages/              # Route views (Home, Catalogue, Product, Dashboard, etc.)
│   │   ├── types/              # Core TypeScript type definitions
│   │   ├── utils/              # imageFallback.ts and utility helpers
│   │   ├── App.tsx             # Root router with ProtectedArtisanRoute
│   │   └── index.css           # Core styling tokens and typography
│   ├── package.json            # Node dependencies and build scripts
│   ├── tsconfig.json           # TypeScript configuration
│   └── vite.config.ts          # Vite bundler & reverse proxy configuration
├── .gitignore                  # Unified repository ignore rules
└── README.md                   # Single source of truth project documentation
```

---

## ⚖️ Curatorial Ethics & Fair Trade Charter

1. **Direct Compensation Guarantee**: 100% of listed artisan proceeds are disbursed directly to artisan guild bank accounts upon certified delivery.
2. **Provenance Traceability**: Every work is cataloged with an unalterable accession code (e.g., `KH-2026-01`), artisan genealogy, and raw material geography.
3. **Anti-Exploitation Policy**: Zero upfront listing fees or subscription barriers for indigenous artisans.

---

## 📄 License

Distributed under the **MIT License**. Crafted with reverence for India’s living masters.