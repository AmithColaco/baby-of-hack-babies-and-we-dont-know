# KAARIGAR — Comprehensive Existing Project Audit and Review Report

**Date of Audit:** October 21, 2026  
**Auditor:** Senior Full-Stack Engineer, Software Architect, Frontend Reviewer & QA Engineer  
**Repository Root:** `c:\arjun\Major Projects\baby-of-hack-babies-and-we-dont-know`  
**Report File Location:** `c:\arjun\Major Projects\baby-of-hack-babies-and-we-dont-know\KAARIGAR_PROJECT_REVIEW.md`  

---

## 1. Executive Summary

This audit provides an exhaustive, evidence-based architectural, technical, visual, and QA evaluation of the **KAARIGAR** (formerly *KalaHaat*) repository in its current state.

### High-Level Verdict
1. **Frontend (`/frontend`):** A remarkably detailed, aesthetically sophisticated, and feature-dense Single Page Application (SPA) built with **React 19.3.1**, **TypeScript 6.0.3**, **Vite 6.4.4**, **React Three Fiber 9.8.2**, **Three.js 0.186.1**, and **React Router DOM 6.30.6**. The frontend delivers an immersive, museum-grade editorial user experience across 9 routes, an interactive 6-chapter product storytelling experience, a procedural 3D spatial artifact exhibition, an artisan onboarding and listing portal, a shopping bag, multi-step checkout, and order tracking.
2. **Backend (`/backend`):** A **non-functional placeholder scaffold**. While a FastAPI app instance is declared in `main.py`, every single internal module (`database.py`, `models.py`, `schemas.py`, `auth.py`, `seed.py`, all routers, and all services) consists exclusively of 1-line docstrings or empty `APIRouter()` declarations. There are zero database tables, zero migration scripts, zero API endpoints implemented beyond a root health check, zero authentication logic, and zero AI or payment integrations.
3. **Frontend–Backend Integration:** **Zero (0%) integration**. The frontend contains **no HTTP requests whatsoever** (no `fetch()`, no `axios` instances, no WebSockets). All application state (catalog products, artisan profile, wishlists, cart items, simulated orders) is handled purely through client-side React state, in-memory static datasets (`craftsData.ts`), and browser `localStorage` stores (`productStore.ts`, `CartContext.tsx`).
4. **Code Quality & Build Health:** The frontend codebase compiles cleanly with **0 TypeScript errors** (`npx tsc -b --noEmit` exited with code 0) and passes Oxlint with **0 errors and 13 warnings** (`npm run lint`). No unit or integration tests exist in either the frontend or backend.

---

## 2. Actual Technology Stack

The following matrix documents every technology identified in the repository, its version, location, role, and verification level.

| Technology | Version | Location | Role in Application | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **React** | `^19.3.1` (resolved 19.3.1) | `frontend/package.json`, `frontend/src/main.tsx` | Core UI library for component hierarchy and DOM rendering | **Confirmed by source & package.json** |
| **React DOM** | `^19.3.1` (resolved 19.3.1) | `frontend/package.json`, `frontend/src/main.tsx` | DOM rendering target for React | **Confirmed by source & package.json** |
| **TypeScript** | `~6.0.3` (resolved 6.0.3) | `frontend/package.json`, `frontend/tsconfig.json` | Type-checking and interface contracts | **Confirmed by source (`npx tsc` passed with 0 errors)** |
| **Vite** | `^6.4.4` (resolved 6.4.4) | `frontend/package.json`, `frontend/vite.config.ts` | Frontend build tool and local development server | **Confirmed by configuration & package.json** |
| **Vanilla CSS** | Modern CSS3 (Custom Design Tokens) | `frontend/src/index.css`, `frontend/src/editorial.css` | Comprehensive editorial styling, typography, animations, responsive layouts | **Confirmed by source (180KB+ custom CSS)** |
| **Tailwind CSS** | *None* | *Not in repository* | *Not installed or used* | **Confirmed absent** (No tailwind config or dependencies) |
| **Three.js** | `^0.186.1` (resolved 0.186.1) | `frontend/package.json`, `frontend/src/gallery/*` | 3D WebGL rendering engine, geometries, materials, lighting | **Confirmed by source in `gallery/`** |
| **@react-three/fiber** | `^9.8.2` (resolved 9.8.2) | `frontend/package.json`, `frontend/src/gallery/*` | React renderer wrapper for Three.js scene graph | **Confirmed by source in `GalleryCanvas.tsx`, `ArtisanArtifact3D.tsx`** |
| **@react-three/drei** | `^10.7.9` (resolved 10.7.9) | `frontend/package.json`, `frontend/src/gallery/GalleryCameraRig.tsx` | Helper utilities (`OrbitControls`) for 3D camera management | **Confirmed by source in `GalleryCameraRig.tsx`** |
| **React Router DOM** | `^6.30.6` (resolved 6.30.6) | `frontend/package.json`, `frontend/src/App.tsx` | Client-side routing across 9 route paths | **Confirmed by source in `App.tsx` and all pages** |
| **Framer Motion** | `^14.4.0` (resolved 14.4.0) | `frontend/package.json` | Declared dependency; primary animations are handled via CSS keyframes & R3F `useFrame` | **Declared dependency** (minimal direct imports) |
| **Axios** | `^1.20.0` (resolved 1.20.0) | `frontend/package.json`, `frontend/src/api/client.ts` | Declared HTTP client; referenced only in a single comment in `client.ts` | **Declared dependency only** (never imported in source) |
| **hls.js** | `^1.7.3` (resolved 1.7.3) | `frontend/package.json` | Video streaming library | **Declared dependency only** (never imported in source) |
| **i18next & react-i18next** | `^26.5.3` / `^17.1.0` | `frontend/package.json`, `frontend/src/i18n/*` | Internationalization (English + Kannada JSON dictionaries exist) | **Partially configured stub** (`i18n/index.ts` is empty) |
| **Oxlint** | `^1.88.0` (resolved 1.88.0) | `frontend/package.json`, `frontend/.oxlintrc.json` | High-speed Rust-based linter | **Confirmed by execution (`npm run lint`)** |
| **Python** | `3.11+` | `backend/runtime` | Backend language | **Inferred from requirements and typing syntax** |
| **FastAPI** | `>=0.111.0` | `backend/requirements.txt`, `backend/main.py` | Python REST API framework | **Confirmed in `main.py` entry point** |
| **Uvicorn** | `>=0.30.0` | `backend/requirements.txt` | ASGI web server | **Declared dependency only** |
| **SQLAlchemy** | `>=2.0.0` | `backend/requirements.txt`, `backend/app/models.py` | ORM for PostgreSQL | **Declared dependency only** (`models.py` is empty) |
| **Alembic** | `>=1.13.0` | `backend/requirements.txt`, `backend/seed.py` | Database migration tool | **Declared dependency only** (`seed.py` is empty) |
| **Pydantic** | `>=2.0.0` | `backend/requirements.txt`, `backend/app/schemas.py` | Data validation & serialization | **Declared dependency only** (`schemas.py` is empty) |
| **google-generativeai** | `>=0.7.0` | `backend/requirements.txt`, `backend/app/services/ai_service.py` | Gemini Multimodal API SDK | **Declared dependency only** (`ai_service.py` is empty) |
| **Cloudinary** | *Uninstalled* | Mentioned only in `backend/.env.example` | Media asset cloud storage | **Environment variable template only** |

---

## 3. Repository Structure and Backend Preservation

### 3.1 Repository Directory Structure

```
c:\arjun\Major Projects\baby-of-hack-babies-and-we-dont-know\
├── .git/                                 # Git version control metadata
├── .gitignore                            # Root ignore file
├── README.md                             # Original project overview ("KalaHaat")
├── backend/                              # Python FastAPI backend (scaffold)
│   ├── .env.example                      # Template for env secrets (DB, Gemini, Cloudinary)
│   ├── main.py                           # FastAPI entry point (CORSMiddleware + router stubs)
│   ├── requirements.txt                  # Python package specifications
│   ├── seed.py                           # 1-line stub for database seeding
│   └── app/
│       ├── __init__.py                   # Package initializer
│       ├── auth.py                       # 1-line stub for auth logic
│       ├── database.py                   # 1-line stub for SQLAlchemy engine/session
│       ├── models.py                     # 1-line stub for DB models
│       ├── schemas.py                    # 1-line stub for Pydantic schemas
│       ├── routers/
│       │   ├── __init__.py               # Package initializer
│       │   ├── auth.py                   # 5-line router stub (`router = APIRouter()`)
│       │   ├── gallery.py                # 5-line router stub (`router = APIRouter()`)
│       │   ├── guide.py                  # 5-line router stub (`router = APIRouter()`)
│       │   ├── listings.py               # 5-line router stub (`router = APIRouter()`)
│       │   └── orders.py                 # 5-line router stub (`router = APIRouter()`)
│       └── services/
│           ├── __init__.py               # Package initializer
│           ├── ai_service.py             # 1-line stub for Gemini AI integration
│           ├── payment_service.py        # 1-line stub for payment provider
│           └── price_service.py          # 1-line stub for price suggestions
└── frontend/                             # React 19 + TypeScript + Vite SPA
    ├── .gitignore                        # Frontend ignore file
    ├── .oxlintrc.json                    # Oxlint configuration
    ├── index.html                        # HTML entry point (Cinzel, Cormorant Garamond fonts)
    ├── package.json                      # NPM configuration and dependencies
    ├── package-lock.json                 # Pinned NPM lockfile
    ├── tsconfig.json                     # Root TypeScript configuration
    ├── tsconfig.app.json                 # App TypeScript configuration
    ├── tsconfig.node.json                # Vite/Node TypeScript configuration
    ├── vite.config.ts                    # Vite build configuration
    ├── public/
    │   ├── favicon.svg                   # Brand favicon
    │   ├── icons.svg                     # SVG sprite sheet
    │   └── images/                       # Local master craft photography
    │       ├── artisan.jpg               # Pandit Ram Swaroop Sharma atelier portrait (921 KB)
    │       ├── bluepottery.jpg           # Jaipur Blue Pottery Urn (663 KB)
    │       ├── dhokra.jpg                # Bastar Lost-Wax Bronze Guardian Horse (732 KB)
    │       ├── jewellery.jpg             # Kundan Meenakari Pendant Amulet (716 KB)
    │       ├── pahari.jpg                # Pahari Miniature Painting (856 KB)
    │       ├── textile.jpg               # Chanderi Handwoven Royal Silk Brocade (879 KB)
    │       └── woodcraft.jpg             # Channapatna Lathe-Turned Wood Totem (600 KB)
    └── src/
        ├── App.tsx                       # Main router layout & CartProvider wrapper
        ├── App.css                       # Minimal CSS stub
        ├── index.css                     # Core design tokens, base typography, 3D gallery CSS
        ├── editorial.css                 # Comprehensive marketplace styles (5,680+ lines)
        ├── main.tsx                      # React root rendering entry point
        ├── api/                          # Stubs for HTTP communication
        │   ├── client.ts                 # 2-line stub: `// KalaHaat – API client (axios instance)`
        │   ├── auth.ts                   # 1-line stub
        │   ├── listings.ts               # 1-line stub
        │   └── orders.ts                 # 1-line stub
        ├── assets/
        │   ├── hero.png                  # Static asset (13 KB)
        │   ├── react.svg                 # React icon
        │   └── vite.svg                  # Vite icon
        ├── components/                   # Shared UI and Layout Components
        │   ├── index.ts                  # Barrel export file
        │   ├── SiteHeader.tsx            # Sticky navigation bar, search modal, mobile drawer
        │   ├── SiteFooter.tsx            # Editorial 4-column footer with newsletter & provenance
        │   ├── CartDrawer.tsx            # Slide-out curatorial bag drawer & quick reservation
        │   ├── ObjectDetailPanel.tsx     # 3D spatial accession dossier (tabs: Provenance, Making, Artisan)
        │   ├── TwoDArchiveView.tsx       # 2D fallback/curatorial catalog for non-WebGL/alternative view
        │   ├── GalleryNav.tsx            # Floating curatorial bar in 3D gallery
        │   ├── HeroIntro.tsx             # Curatorial entrance gate for 3D exhibition
        │   ├── StoriesModal.tsx          # Multi-tab modal reading longform artisan monographs
        │   ├── MakingOfModal.tsx         # 6-stage raw earth to finished artifact modal
        │   ├── AboutModal.tsx            # KAARIGAR cultural manifesto modal
        │   ├── Button.tsx                # Reusable button component
        │   ├── CraftBadge.tsx            # Small GI badge component
        │   ├── LoadingSpinner.tsx        # Fallback spinner
        │   ├── Navbar.tsx                # Older navbar stub
        │   ├── ProductCard.tsx           # Legacy product card stub
        │   ├── StoryCard.tsx             # Legacy story card stub
        │   └── home/                     # Homepage Modular Sections
        │       ├── HeroSection.tsx       # Hero headline, metric badges, Exhibit I showcase card
        │       ├── CraftCategories.tsx   # 6 living pillars / craft category grid
        │       ├── FeaturedCarousel.tsx  # 3D orbital masterwork carousel with interactive inspection
        │       ├── ArtisanHighlights.tsx # Meet the masters cards with direct payout percentages
        │       ├── MakingJourney.tsx     # 4-stage interactive tabbed making process
        │       └── SellerCallToAction.tsx# Artisan onboarding call-to-action & atelier perks
        ├── contexts/
        │   ├── AuthContext.tsx           # 2-line stub: `// KalaHaat – auth context and hook`
        │   └── CartContext.tsx           # Full Cart state management, localStorage persistence
        ├── data/
        │   ├── craftsData.ts             # Curated heritage masterworks (6 objects), 3 stories, 6 making steps
        │   └── productStore.ts           # Product store hook, localStorage sync, wishlist, artisan profile
        ├── gallery/                      # Three.js / React Three Fiber 3D Spatial Canvas
        │   ├── ArtisanArtifact3D.tsx     # Procedural 3D composite meshes & pedestals for all 6 crafts
        │   ├── GalleryCameraRig.tsx      # Smooth camera interpolation & OrbitControls
        │   ├── GalleryCanvas.tsx         # R3F Canvas, texture loader, WebGL detector, floating HUD
        │   ├── GalleryEnvironment.tsx    # Atelier lighting, fog, floor reflections, floating gold dust
        │   ├── ArtworkFrame.tsx          # 1-line stub
        │   ├── GalleryPanel.tsx          # 1-line stub
        │   └── GalleryScene.tsx          # 1-line stub
        ├── i18n/
        │   ├── index.ts                  # 1-line stub
        │   ├── en.json                   # English UI string dictionary
        │   └── kn.json                   # Kannada UI string dictionary
        └── pages/                        # Route Page Components
            ├── Home.tsx                  # Landing page combining all 6 homepage sections
            ├── Catalogue.tsx             # Curated shop with search, categories, sorting, wishlist
            ├── Product.tsx               # 6-chapter interactive storyboard & archival specs
            ├── Gallery.tsx               # Fullscreen 3D Spatial Exhibition + 2D archive mode
            ├── Checkout.tsx              # Multi-step delivery & payment settlement form
            ├── Onboarding.tsx            # Artisan registration & OTP login simulation
            ├── Dashboard.tsx             # Seller atelier console (inventory, mock orders, profile)
            ├── CreateListing.tsx         # Inscribe/edit craft listing with live customer preview
            └── OrderTracking.tsx         # Post-purchase order milestone tracking & provenance seal
```

### 3.2 Git History and Backend Preservation Evidence

Inspection of the repository commit history via `git log` reveals the following exact trajectory:

1. **Commit `ac61ab4` (Oct 20, 2026, 18:55):** `Initial commit` (created root `README.md`).
2. **Commit `6da3a7a` (Oct 20, 2026, 20:01):** `chore: add node_modules dependencies and supporting files` by `AmithColaco`.
   - Created the entire `backend/` directory structure under the project name **KalaHaat**.
   - Created `main.py` with 26 lines, empty router files of 4 lines each, empty service stubs, empty database stubs, and `requirements.txt`.
   - Created the initial frontend scaffolding.
3. **Commit `fd01c97` (Oct 20, 2026, 21:27):** `Made a better UI` by `Sarvasva`.
   - Added authentic images to `frontend/public/images/`.
   - Implemented `ArtisanArtifact3D.tsx`, `GalleryCanvas.tsx`, `GalleryCameraRig.tsx`, `GalleryEnvironment.tsx`, `craftsData.ts`, `CartContext.tsx`, and `ObjectDetailPanel.tsx`.
   - Rebranded visual identity to **KAARIGAR**.
   - **Backend was untouched.**
4. **Commit `809c829` (Oct 21, 2026):** `feat: add product store and 2D archive view components for frontend` by `Sarvasva`.
   - Added `productStore.ts`, `editorial.css` (5,682 lines), `TwoDArchiveView.tsx`, and the comprehensive modular home components (`HeroSection.tsx`, `CraftCategories.tsx`, `FeaturedCarousel.tsx`, `ArtisanHighlights.tsx`, `MakingJourney.tsx`, `SellerCallToAction.tsx`).
   - Implemented `Catalogue.tsx`, `Checkout.tsx`, `CreateListing.tsx`, `Dashboard.tsx`, `Onboarding.tsx`, `OrderTracking.tsx`, and `Product.tsx`.
   - **Backend was untouched.**

**Definitive Evidence:** The backend has **never been modified or developed** since its initial creation as empty boilerplate in commit `6da3a7a`. No backend files have been overwritten or deleted in subsequent development; they were simply left in their initial stub state while all development effort concentrated exclusively on the frontend.

---

## 4. Current Frontend Experience

### A. Homepage (`/` -> `Home.tsx`)

The homepage implements an editorial visual narrative organized into six distinct sections:

1. **Header & Brand Identity (`SiteHeader.tsx`):**
   - Sticky header with glassmorphism transition on scroll (`site-header--scrolled`).
   - Wordmark: "कारिगर · EST. 2026 / KAARIGAR / Archive of Living Craft".
   - Navigation links: Collection (`/shop`), 3D Spatial Gallery (`/gallery`), Artisans (`/#artisans`), Craft Journey (`/#process`), and Seller Atelier (`/dashboard`).
   - Actions: Curatorial search icon (opens search modal with quick query tags), wishlist button with badge count, shopping bag button with item badge count, and an "Artisan Portal" CTA link to `/login`.
   - Mobile hamburger menu that opens a sliding overlay navigation drawer.
2. **Hero Composition (`HeroSection.tsx`):**
   - Dual-column editorial layout: Left column features headline (*"Every object has a maker. Every maker has a story."*), introductory manifesto, three CTAs (*Explore the Collection*, *Enter 3D Spatial Gallery*, *Sell Your Craft*), and three trust metrics (*85%+ Direct Artisan Payout*, *6 Protected Traditions*, *4,000 Yrs Continuous Lineage*).
   - Right column showcases *Exhibit I*: A framed visual card of the Kangra Wasli painting with accession badge, price (₹48,500), artisan attribution (*Pandit Ram Swaroop Sharma*), and direct story link.
   - Animated scroll cue pointing to `#categories`.
3. **Craft Categories (`CraftCategories.tsx`):**
   - Six living pillars displayed in a responsive grid:
     1. Traditional Miniature Paintings (Kangra Valley & Thanjavur)
     2. Glazed Quartz Blue Pottery (Sanganer, Rajasthan)
     3. Handwoven Gossamer Brocades (Chanderi, Madhya Pradesh)
     4. Bastar Lost-Wax Bronze & Bidri (Kondagaon, Bastar & Bidar)
     5. Lathe-Turned Lacquer Woodcraft (Channapatna, Karnataka)
     6. Royal Kundan & Champlevé Enamel (Old Walled City, Jaipur)
   - Each card features vernacular script, region, accession guild, photography, and links to `/shop?category=<id>`.
4. **Featured Carousel (`FeaturedCarousel.tsx`):**
   - Interactive masterwork orbital stage with Prev/Next buttons, keyboard arrow navigation, and dot pagination.
   - Shows active card flanked by tilted 3D-perspective neighboring cards.
   - Selecting a card instantly updates the linked **Curatorial Inspector Panel** below it, displaying accession number, region, price, vernacular title, summary, master specs (artisan, atelier, materials), direct payout percentage, and three action buttons: *Discover Interactive Story*, *Add to Shopping Bag*, and *Inspect in 3D Gallery*.
5. **Artisan Highlights (`ArtisanHighlights.tsx`):**
   - Focuses on living hands: *Pandit Ram Swaroop Sharma* (88% direct payout), *Master Weaver Bismillah Ansari* (86% direct payout), and *Sukhruram Ghadwa* (90% direct payout).
   - Each card features atelier photography, direct payout badge, pull-quotes, biographical summaries, and links to each master's storyboard.
6. **Making Journey (`MakingJourney.tsx`):**
   - Four-stage interactive tabbed timeline:
     - Stage 01: Earth & Mineral Alchemy
     - Stage 02: Gossamer & Structural Preparation
     - Stage 03: The Hand of the Master
     - Stage 04: The Living Heirloom
   - Switching tabs reveals key elements/ingredients as pill tags, descriptive explanations, and photography.
7. **Seller Entry Point (`SellerCallToAction.tsx`):**
   - Section titled *"Are You a Custodian of an Indian Craft Tradition?"*.
   - Outlines 4 perks: 85%+ Direct Payout, Dedicated Story Archiving, Global Collector Reach, Zero Upfront Listing Fees.
   - Dual CTAs: *Onboard Your Atelier* (`/login`) and *Enter Seller Dashboard* (`/dashboard`).
8. **Footer (`SiteFooter.tsx`):**
   - Four-column layout: Philosophy & direct payout badge, Craft Traditions links, Curatorial Archive links, Atelier Dispatches newsletter subscription form (triggers a simulated confirmation alert), and legal trust covenants.

---

### B. Collection & Product Catalogue (`/shop` -> `Catalogue.tsx`)

1. **Product Listing & Filtering:**
   - Displays all products sourced dynamically from `useProducts()` (default 6 items, plus any seller-created items stored in `localStorage`).
   - Category filtering tabs: *All Disciplines*, *Paintings & Wasli*, *Quartz Blue Pottery*, *Handwoven Silks*, *Dhokra & Bidri*, *Lathe Woodcraft*, *Kundan Meenakari*.
   - Dedicated *Wishlist* tab showing total saved count and filtering the view to favorited pieces.
2. **Search & Sorting:**
   - Real-time text search input filtering across product title, craft tradition, artisan name, geographic region, and material list.
   - Sort dropdown supporting: *Curated Lineage*, *Price: Low to High*, *Price: High to Low*, and *Highest Direct Artisan Payout*.
   - Filter count summary banner with a single-click *Clear all filters* reset button.
   - Empty state illustration with quick-reset CTA when search/filters yield zero matches.
3. **Product Cards (`shop-craft-card`):**
   - Card displays: High-resolution image, wishlist heart toggle button, direct payout badge (e.g. `88% Direct Payout`), craft tradition, region, title, vernacular title, artisan attribution, price in INR, *Discover Story →* button, and direct *Add to Bag* button.
   - Clicking the title or image navigates seamlessly to `/shop/:id`.

---

### C. 3D Spatial Gallery (`/gallery` -> `Gallery.tsx`)

1. **Scene Composition & Rendering (`GalleryCanvas.tsx`):**
   - Implemented with **React Three Fiber** `<Canvas>` with antialiasing, high-performance power preference, and soft shadow mapping.
   - Atmosphere (`GalleryEnvironment.tsx`): Warm ivory background (`#F9F5EE`), subtle exponential depth fog (`#F9F5EE`, near: 9, far: 24), ambient atelier fill light (`#FFFBF0`, intensity: 1.2), warm museum key spotlight (`#FFF4DE`, intensity: 2.0, shadow map: 1024x1024), cool sky fill light, floor reflection plane with four concentric brass rings, and 140 floating gold leaf dust particles gently orbiting in 3D space.
2. **Camera Controls (`GalleryCameraRig.tsx`):**
   - Controlled via Drei's `OrbitControls` with damping factor 0.06.
   - Min polar angle: $\pi/6$ ($30^\circ$), max polar angle: $\pi/2 - 0.02$ ($88^\circ$, preventing the camera from clipping below the museum floor).
   - Distance constrained between 1.2 and 14 units.
   - Smooth vector lerping (`lerp(targetCamPos, 0.055)`) smoothly pans the camera and focuses the OrbitControls target directly on any selected artifact when clicked.
3. **Artifact Geometry Architecture (`ArtisanArtifact3D.tsx`):**
   - **Crucial Technical Clarification:** There are **zero external 3D model files (`.gltf`, `.glb`, `.obj`)** loaded in the repository.
   - All 3D artifacts are **intricate procedural 3D composite assemblies** created using Three.js / R3F primitive meshes combined with high-performance `meshStandardMaterial` and `meshPhysicalMaterial` (with transmissions, clearcoats, and metalness):
     - **Exhibit I (Painting):** Carved teak outer box frame, stepped bevel, 24K beaten gold leaf fillet, plane geometry with `TextureLoader` mapping authentic painting photography, glass reflection plane with `meshPhysicalMaterial` transmission 0.94, reverse teak backing, and brass suspension rings.
     - **Exhibit II (Pottery):** Fluted ceramic foot base, gilded foot ring, swelling baluster urn body (`sphereGeometry` with blue pottery texture), tapered neck with Persian arabesque glaze, flanged lip, domed finial lid, 24K gold stupa peak, and twin acanthus loop handles with gold studs.
     - **Exhibit III (Textile):** Handcrafted rosewood suspension dowel, turned brass rod finials, draped undulating gossamer mulberry silk cylinder body with authentic textile texture, real silver electroplated gold zari border (pallu), and hanging gold silk tassels.
     - **Exhibit IV (Brass / Dhokra):** Cast bell-metal capsule torso, extruded wax wire filigree rings, elongated tubular neck, crested archival mane, muzzle head, tribal ears, ceremonial saddle, slender ritual legs with flared hooves, and braided bronze tail.
     - **Exhibit V (Woodcraft):** Rosewood foundation base, turmeric gold lacquer bead ring, spherical ivory wood vessel, four concentric lathe-turned lacquer tiers (Sindoor vermilion, turmeric, natural ivory, and forest indigo), lathe-spun conical shikhara spire, and mirror-gloss kalasha finial sphere.
     - **Exhibit VI (Jewellery):** Royal bail suspension loop, 22K gold octagonal amulet matrix, centered green emerald cabochon (`meshPhysicalMaterial` with green transmission 0.88), cold-set Kundan gold bezel, 8 radial uncut Polki diamonds with flat facets, reverse-side champlevé Meenakari enamel garden, and 5 hanging Basra seed pearls.
4. **Pedestal & Interaction:**
   - Each artifact sits atop a tiered sandstone base with a polished teak inset, beaten brass rim, accession plaque, and a point light that illuminates when hovered or selected.
   - Idle state: Subtle floating levitation sinusoidal animation (`sin(t * 1.1) * 0.04`) and yaw breathing.
   - Selected state: Smooth turntable 360-degree continuous rotation for connoisseur inspection (`modelPivotRef.current.rotation.y += 0.005`). Unselected artifacts dim to 0.28 opacity.
5. **HUD & Navigation:**
   - Selecting an artifact triggers a floating frosted-glass HUD bar at the bottom displaying accession number, title, artisan attribution, price, a *Discover Sacred Story →* button (linking to `/shop/:id`), and a *Reset View* button.
   - Clicking an artifact or pressing keyboard numbers `1` through `6` directly focuses on the corresponding piece. Left/Right arrows cycle through artifacts. `Escape` resets selection.
6. **2D Archive Mode & WebGL Fallback:**
   - Full 2D Curatorial Archive toggle (`TwoDArchiveView.tsx`) allows instant switching between 3D spatial exhibition and an editorial 2D grid.
   - Includes automatic WebGL detection: if `canvas.getContext('webgl')` fails, the component displays an archival notice instead of crashing.

---

### D. Product Detail and Storytelling (`/shop/:id` -> `Product.tsx`)

The product detail page provides an immersive 6-chapter interactive storyboard:

1. **Chapter Progression Tracker:**
   - Persistent top chapter bar (01 The Object, 02 The Maker, 03 Raw Alchemy, 04 The Making, 05 Dimensions, 06 Acquisition) with click-to-jump and keyboard navigation (`ArrowRight`/`ArrowLeft`, `PageDown`/`PageUp`).
   - View mode toggle between *Interactive Story* and *Archival Specs*.
2. **Chapter Breakdown:**
   - **Scene 01 (The Object):** High-resolution media frame, accession badge, title, vernacular title, craft tradition, period, summary, price, direct payout guarantee pill, *Discover Its Sacred Story →* button, and direct *Add to Bag* button.
   - **Scene 02 (The Maker):** Master artisan portrait (`/images/artisan.jpg`), atelier tag, master name, title, atelier location, callout pull-quote, full biography, and three financial metrics.
   - **Scene 03 (The Raw Materials):** Geological and organic breakdown of verified rare materials (e.g. Wasli paper, Lapis lazuli, Malachite, 24K beaten gold foil) rendered as numbered curatorial cards.
   - **Scene 04 (The Making Process):** Step-by-step transformation timeline rendering the 3 distinct stages from `product.makingStory.stages` with individual step numbers, stage titles, and procedural descriptions.
   - **Scene 05 (Collector Specifications):** Archival care specifications table detailing accession number, physical dimensions, net object weight, primary category, craft guild, GI origin certification, and packaging/mount details.
   - **Scene 06 (Acquire & Collect):** Purchase card featuring product image, acquisition price, complimentary archival transit badge, interactive quantity selector (`-`/`+`), primary *Add to Shopping Bag* CTA, wishlist toggle button, and the *KAARIGAR Provenance Covenant* showing the exact Rupee amount disbursed to the artisan's guild account.
3. **Complementary Pieces:**
   - Renders 3 related pieces from the same guild/category at the conclusion of Chapter 6.
4. **Data Specificity:**
   - Stories are **fully product-specific** because `Product.tsx` extracts data directly from the matching `CraftObject` in `useProducts()`.
   - **Minor Limitation:** The master artisan portrait image in Scene 02 is currently hardcoded to `/images/artisan.jpg` across all products, regardless of which artisan is displayed.

---

### E. Seller Experience (`/onboarding`, `/dashboard`, `/dashboard/create`, `/dashboard/edit/:id`)

1. **Artisan Onboarding (`Onboarding.tsx`):**
   - Role switcher between *Master Artisan* and *Art Collector*.
   - Artisan form fields: Name, Atelier, Craft Specialization, Valley/Region, State, 10-digit Phone Number, and Lineage Biography.
   - **Simulated OTP Verification:** Submitting the phone number advances to an OTP entry screen. Entering any 4-digit code (e.g. `1234`) verifies the session, updates `ArtisanProfile` in `localStorage`, and redirects to `/dashboard`.
2. **Seller Dashboard (`Dashboard.tsx`):**
   - Welcome banner displaying Atelier name, Master Custodian name, Region, and Craft Specialization, with buttons to *+ Add New Craft Piece* and *View Public Collection*.
   - Atelier metrics: *Active Listed Pieces* (`products.length`), *Direct Payout Rate* (88%), *Atelier Acquisitions* (static mock: ₹1,84,500), and *GI Provenance Status* (Certified).
   - Three functional tabs:
     - **Tab 1 (My Craft Pieces):** Itemized list of all products in `useProducts()`. Each piece displays thumbnail, accession number, tradition, region, title, vernacular title, materials, price, direct payout calculation, and action links: *Story →* (opens public storyboard), *Edit* (opens `/dashboard/edit/:id`), *Remove* (with an interactive two-step confirmation toggle), and *Reset Defaults* (resets catalog back to the initial 6 masterworks).
     - **Tab 2 (Recent Collector Acquisitions):** Displays a table of recent orders with Acquisition ID, Masterwork, Collector name, Value, Direct Payout (88%), and Status. **Note:** This table contains 3 static hardcoded mock rows (`KG-ORD-9281`, `KG-ORD-8814`, `KG-ORD-7402`) and does not pull from the checkout orders store.
     - **Tab 3 (Atelier Lineage Profile):** Editable form for Master Artisan Name, Atelier, Specialization, Region, and Lineage Biography. Clicking *Save Atelier Profile* updates `kaarigar_artisan_profile_v1` in `localStorage` and shows a confirmation banner.
3. **Listing Creation & Editing (`CreateListing.tsx`):**
   - Supports both creating new listings (`/dashboard/create`) and editing existing listings (`/dashboard/edit/:id`).
   - Fields: Piece Title, Vernacular Title, Primary Craft Discipline (dropdown), Specific Tradition/Lineage, Acquisition Value (INR), Direct Artisan Payout Slider (80%–95% with live Rupee payout calculation), Master Artisan Name, Atelier, Valley/District, State, Physical Dimensions, Net Weight, Materials (comma-separated), and Curatorial Summary.
   - Making Story Stages: Dedicated inputs for Stage 01, 02, and 03 titles and descriptions.
   - Imagery Selection: Allows selecting from 6 preset authentic local photographs or inputting a custom image URL. **Note:** There is no binary file upload input or cloud storage upload.
   - Live Customer Preview: Clicking *View Live Customer Preview* toggles a sticky sidebar showing the exact rendered craft card as it will appear in the collection, including an interactive summary of generated storyboard scenes.
   - Submitting: Validates required fields, generates a new accession number and ID, saves the product to `productStore` in `localStorage`, and navigates immediately to the live public storyboard (`/shop/:id`).
4. **Access Restrictions:**
   - **No route protection:** Routes `/dashboard`, `/dashboard/create`, and `/dashboard/edit/:id` have no authentication middleware or route guards. Any visitor can access them directly without logging in.

---

### F. Cart and Ordering (`CartDrawer.tsx`, `Checkout.tsx`, `OrderTracking.tsx`)

1. **Curatorial Bag Drawer (`CartDrawer.tsx`):**
   - Slide-out drawer accessible from any page via the header bag icon.
   - Displays itemized cards with image thumbnail, craft tradition, title, artisan name, calculated item total, and quantity stepper (`–`/`+`).
   - Includes *Direct Artisan Compensation* calculation showing the exact aggregate Rupee amount allocated to artisan funds.
   - Two checkout paths:
     - *Proceed to Secure Checkout →* (navigates to `/cart`).
     - *Quick Reserve Inquiry* (generates a random reservation number like `KG-849201`, displays an archival confirmation view, and clears the cart).
2. **Checkout Flow (`Checkout.tsx`):**
   - Route `/cart`. If the cart is empty, displays an empty-bag state with a link back to `/shop`.
   - Two-column acquisition form:
     - **Step 01 (Archival Transit Destination):** Fields for Collector Name, Email (for provenance deeds), Mobile (+91), Street Address, City, State, and Postal Code.
     - **Step 02 (Payment Settlement Method):** Three selectable radio options: *UPI Instant Settlement*, *Netbanking & Credit / Debit Card*, and *Archival Reserve upon Delivery* (inspect physical craftsmanship before releasing balance).
     - **Order Summary Sidebar:** Sticky card with itemized list, quantity adjustment, remove button, gross masterpiece value, complimentary courier badge, total amount due, and direct artisan impact note.
3. **Order Inscription & Persistence:**
   - Clicking *Confirm Acquisition*:
     1. Generates an Order ID (e.g. `KG-ORD-74912`).
     2. Serializes order data (ID, date, items, total amount, direct artisan total, customer info, payment method, status) into `localStorage` key `kaarigar_orders_v1`.
     3. Calls `clearCart()`.
     4. Navigates after 600ms to `/orders/:id`.
   - **No Payment Gateway:** No real payment processing (Stripe, Razorpay, or bank APIs) is connected. The flow is an entirely client-side simulated escrow acquisition.
4. **Order Tracking (`OrderTracking.tsx`):**
   - Route `/orders/:id`.
   - Reads order data from `kaarigar_orders_v1` in `localStorage` (or falls back gracefully to a sample Kangra miniature order if accessed directly).
   - Displays: Order Confirmed badge, Order ID, placement date, a 5-step milestone tracking timeline (*Order Confirmed & Escrow Funded* -> *Atelier Packaging & Sealing* -> *Provenance Certificate Inscribed* -> *Insured Specialized Transit* -> *Delivery & Balance Disbursement*), inscribed masterworks breakdown, delivery destination, and a verified GI Provenance Guarantee seal.

---

## 9. Frontend–Backend Integration

### 9.1 Data Flow Analysis

This is the most critical architectural finding of the audit: **The frontend is entirely decoupled from the backend.**

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ACTUAL DATA FLOW ARCHITECTURE                   │
└────────────────────────────────────────────────────────────────────────┘

  Customer browses collection:
  Catalogue.tsx ──► useProducts() ──► productStore.ts ──► localStorage ['kaarigar_products_catalog_v2']
                                                        └── fallback: craftsData.ts (Static TS File)
  
  Customer views 3D gallery:
  Gallery.tsx ──► GalleryCanvas.tsx ──► CRAFT_OBJECTS in craftsData.ts (Static TS File)
  
  Customer views product story:
  Product.tsx ──► useProducts() ──► productStore.ts ──► localStorage / craftsData.ts
  
  Customer adds to bag & checks out:
  CartDrawer.tsx / Checkout.tsx ──► CartContext.tsx ──► localStorage ['kaarigar_cart_v1']
                                                       └── On confirm: localStorage ['kaarigar_orders_v1']
  
  Artisan manages atelier:
  Dashboard.tsx / CreateListing.tsx ──► productStore.ts ──► localStorage ['kaarigar_products_catalog_v2']
                                      └── useArtisan()  ──► localStorage ['kaarigar_artisan_profile_v1']

  FastAPI Backend (backend/main.py):
  [ COMPLETELY UNCONNECTED — 0 API CALLS RECEIVED — ALL ROUTERS ARE EMPTY STUBS ]
```

### 9.2 Key Integration Observations

1. **HTTP Requests in Frontend:** A comprehensive search across `frontend/src` for `fetch(`, `axios`, `XMLHttpRequest`, and `WebSocket` returned **0 active instances**.
2. **API Client:** `frontend/src/api/client.ts` contains only a single comment line (`// KalaHaat – API client (axios instance)`) and exports nothing.
3. **API Endpoints:**
   - `frontend/src/api/auth.ts`: empty stub
   - `frontend/src/api/listings.ts`: empty stub
   - `frontend/src/api/orders.ts`: empty stub
4. **Backend Router Stubs:**
   - `backend/app/routers/auth.py`: `router = APIRouter()` (0 endpoints)
   - `backend/app/routers/listings.py`: `router = APIRouter()` (0 endpoints)
   - `backend/app/routers/orders.py`: `router = APIRouter()` (0 endpoints)
   - `backend/app/routers/gallery.py`: `router = APIRouter()` (0 endpoints)
   - `backend/app/routers/guide.py`: `router = APIRouter()` (0 endpoints)
5. **Database & ORM:** `backend/app/models.py`, `backend/app/database.py`, and `backend/app/schemas.py` are empty 1-line files. There is no database connection, table schema, or active migration.
6. **Catalogue Discrepancy:**
   - `Catalogue.tsx`, `Product.tsx`, and `FeaturedCarousel.tsx` read from `productStore.ts` (stored in `localStorage`). Newly created seller listings **do appear** in the buyer collection, product detail view, and homepage carousel.
   - However, `Gallery.tsx` and `GalleryCanvas.tsx` import directly from `CRAFT_OBJECTS` in `craftsData.ts`. Consequently, newly created seller listings **do not appear in the 3D gallery**.

---

## 10. Functionality Verification Matrix

| # | Feature | Existing Implementation | Evidence / File Location | Verified Behaviour | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Homepage Navigation** | Header with links to `/shop`, `/gallery`, `/#artisans`, `/#process`, `/dashboard` | `frontend/src/components/SiteHeader.tsx` | Links route correctly across pages and in-page anchor IDs | **VERIFIED WORKING** |
| 2 | **Collection Navigation** | Full page catalogue displaying all active pieces with search and filters | `frontend/src/pages/Catalogue.tsx` | Renders product grid dynamically from product store | **VERIFIED WORKING** |
| 3 | **Category Filtering** | Filter tabs for 6 craft disciplines and Wishlist | `frontend/src/pages/Catalogue.tsx` | Filters products by selected category and URL query parameters | **VERIFIED WORKING** |
| 4 | **Product Selection** | Clicking any craft card navigates to `/shop/:id` | `frontend/src/pages/Catalogue.tsx`, `frontend/src/components/home/FeaturedCarousel.tsx` | Navigates to product detail storyboard route | **VERIFIED WORKING** |
| 5 | **3D Gallery Rotation** | OrbitControls with smooth vector lerping and continuous turntable | `frontend/src/gallery/GalleryCameraRig.tsx`, `frontend/src/gallery/ArtisanArtifact3D.tsx` | Full 3D rotation, zoom constraints, and idle animation | **IMPLEMENTED, NOT TESTED (Runtime)** |
| 6 | **Product-Detail Navigation** | Click on 3D artifact HUD or collection card opens `/shop/:id` | `frontend/src/gallery/GalleryCanvas.tsx`, `frontend/src/pages/Product.tsx` | Opens product storyboard route | **VERIFIED WORKING** |
| 7 | **Product Storytelling** | 6-chapter interactive progression (The Object -> The Maker -> Materials -> Making -> Specs -> Acquisition) | `frontend/src/pages/Product.tsx` | Step-by-step chapter navigation, keyboard controls, dynamic data | **VERIFIED WORKING** |
| 8 | **Artisan Profiles** | Detailed master artisan biographies, pull-quotes, and direct payout stats | `frontend/src/pages/Product.tsx`, `frontend/src/components/home/ArtisanHighlights.tsx` | Displays artisan titles, atelier locations, and quotes | **VERIFIED WORKING** |
| 9 | **Seller Onboarding** | Atelier registration form with simulated mobile OTP verification | `frontend/src/pages/Onboarding.tsx` | Collects info, accepts simulated OTP, updates artisan profile in `localStorage` | **UI ONLY / MOCKED** |
| 10 | **Product Listing Creation** | Comprehensive 6-section listing form with live customer preview | `frontend/src/pages/CreateListing.tsx` | Saves craft to `localStorage` and redirects to live storyboard | **VERIFIED WORKING (Local)** |
| 11 | **Product Editing** | Edit form prepopulated with existing product data | `frontend/src/pages/CreateListing.tsx` | Updates existing craft object fields in `localStorage` | **VERIFIED WORKING (Local)** |
| 12 | **Image Uploads** | Selection of 6 preset local images or custom image URL input | `frontend/src/pages/CreateListing.tsx` | Sets image URL property on object; no binary file upload | **UI ONLY / MOCKED** |
| 13 | **Product Publishing** | Single-click publish button that adds piece to active inventory | `frontend/src/pages/CreateListing.tsx` | Immediately adds to `productStore` and navigates to public view | **VERIFIED WORKING (Local)** |
| 14 | **Seller Products in Catalogue** | Products created by sellers appearing in buyer storefront | `frontend/src/data/productStore.ts`, `frontend/src/pages/Catalogue.tsx` | Newly created products appear in `/shop` and `/shop/:id` | **VERIFIED WORKING (Local)** |
| 15 | **Add-to-Cart** | Add craft item to shopping bag with quantity and price | `frontend/src/contexts/CartContext.tsx` | Adds item, updates total count, triggers drawer and toast | **VERIFIED WORKING** |
| 16 | **Cart Quantity & Removal** | Quantity stepper (`–`/`+`) and remove button | `frontend/src/components/CartDrawer.tsx`, `frontend/src/pages/Checkout.tsx` | Updates item quantity or removes from cart | **VERIFIED WORKING** |
| 17 | **Cart Total Calculations** | Dynamic calculation of total items, gross value, and direct artisan share | `frontend/src/contexts/CartContext.tsx` | Computes correct totals and Rupee artisan share | **VERIFIED WORKING** |
| 18 | **Checkout Flow** | Delivery address and payment method selection form | `frontend/src/pages/Checkout.tsx` | Validates form fields and radio option selection | **VERIFIED WORKING (Local)** |
| 19 | **Order Creation** | Generates order record and navigates to tracking page | `frontend/src/pages/Checkout.tsx` | Creates simulated order in `localStorage` and clears cart | **VERIFIED WORKING (Local)** |
| 20 | **Payment Integration** | Radio options for UPI, Card, and Delivery Inspection | `frontend/src/pages/Checkout.tsx` | Simulates payment settlement; no payment gateway connected | **UI ONLY / MOCKED** |
| 21 | **Authentication** | User login / session management | `frontend/src/contexts/AuthContext.tsx`, `backend/app/auth.py` | Context and backend files are empty stubs | **NOT FOUND** |
| 22 | **Seller Permissions** | Role-based access control protecting seller console | `frontend/src/App.tsx` | Seller routes `/dashboard/*` are accessible to any visitor | **NOT FOUND** |
| 23 | **Responsive Layout** | Mobile header hamburger drawer, responsive grids, media queries | `frontend/src/editorial.css`, `frontend/src/index.css` | Comprehensive CSS breakpoints (`@media (max-width: 768px)`, etc.) | **IMPLEMENTED, NOT TESTED (Runtime)** |
| 24 | **Accessibility** | ARIA roles, landmarks, labels, keyboard navigation handlers | `frontend/src/pages/*`, `frontend/src/components/*` | Semantic `<main>`, `<header>`, `role="dialog"`, keyboard listeners | **IMPLEMENTED, NOT TESTED (Runtime)** |
| 25 | **Backend API Integration** | HTTP communication with FastAPI backend | `frontend/src/api/*`, `backend/main.py` | Zero API calls; frontend is entirely client-side | **NOT FOUND** |

---

## 11. Testing and Quality Review

The following non-destructive quality and compilation checks were actually executed:

### Test 1: Frontend Linting (`npm run lint`)
- **Command Executed:** `npm run lint` (running `oxlint` with 116 rules across 52 files using 12 threads)
- **Execution Result:** **Exited with code 0.**
- **Output Summary:** `Found 13 warnings and 0 errors. Finished in 177ms.`
- **Nature of Warnings:**
  - 4 warnings in `FeaturedCarousel.tsx` regarding `useCallback` manual memoization dependency mutation.
  - 1 warning in `GalleryCanvas.tsx` regarding `setState` inside `useEffect` during WebGL check.
  - 1 warning in `CartContext.tsx` regarding fast-refresh export of helper hook `useCart`.
  - 1 warning in `OrderTracking.tsx` regarding calling impure `Date` during render.
  - 2 warnings in `Product.tsx` and `CreateListing.tsx` regarding synchronous `setState` in `useEffect`.

### Test 2: TypeScript Compilation Check (`npx tsc -b --noEmit`)
- **Command Executed:** `npx tsc -b --noEmit`
- **Execution Result:** **Exited with code 0.**
- **Output Summary:** Clean compilation with **0 TypeScript errors**. All interfaces, props, types, and module imports pass strict type validation.

### Test 3: Backend Tests
- **Command Executed:** Checked repository for pytest configuration, test files, or test directories.
- **Execution Result:** **No test files exist.** There are zero backend test files (`test_*.py`, `tests/`) anywhere in the repository.

### Test 4: Frontend Unit / Component Tests
- **Command Executed:** Checked repository for Vitest, Jest, React Testing Library, or Cypress test suites.
- **Execution Result:** **No test files exist.** No `.test.tsx`, `.spec.tsx`, or test runners are configured in `package.json`.

### Test 5: Visual Browser Runtime Testing
- **Command Executed:** Attempted automated visual browser session via subagent at `http://localhost:5173/`.
- **Execution Result:** **Connection Refused (`ERR_CONNECTION_REFUSED`).**
- **Limitation Explanation:** Although the system process listing indicated an existing terminal command `npm run dev` running in the background, port 5173 was unresponsive or refused socket connections during the audit turn. In accordance with Critical Instruction 9 (*Never claim that you tested something unless you actually performed the test*), **live visual browser runtime rendering, WebGL frame rates, and mobile device rendering were not verified at runtime**. All visual assessments in Section 12 are based strictly on direct source code examination, CSS tokens, and component structure.

---

## 12. Visual Review

*Note: Visual assessment is conducted based on direct source code inspection of `index.html`, `index.css` (3,152 lines), `editorial.css` (5,682 lines), component layouts, and public high-resolution image assets.*

### 1. Visual Hierarchy & Composition
- **Contemporary Indian Craft Gallery Aesthetic:** The application establishes a distinguished cultural aesthetic that diverges completely from generic e-commerce templates. It successfully balances an archival museum catalog with a high-end editorial publication.
- **Typography Pairing:**
  - Display Serifs: Google Fonts **Cormorant Garamond** and **Cinzel** are utilized for high-impact headlines, Roman numeral exhibit designations, and editorial quotes.
  - Body & UI Sans-Serifs: **DM Sans**, **Plus Jakarta Sans**, and **Outfit** provide clean, legible typography for technical specifications, material tags, and commercial data.
  - Devanagari Script: Hindi vernacular titles (e.g. *काँगड़ा लघु चित्रकला*, *जयपुर नीली मृद्भाण्ड*) are integrated below English titles, grounding the cultural identity.
- **Color Palette & Design Tokens:**
  - Curated natural paper tones: `--warm-white: #FDFBF7`, `--ivory: #F8F4EE`, `--parchment: #EDE6D6`, `--cream: #F2EBE0`.
  - Charcoal & ink typography: `--charcoal: #1C1C1A`, `--ink: #2C2B28`, `--graphite: #4A4740`.
  - Muted earthy accents: `--terracotta: #B85C38`, `--sienna: #9C4A2A`, `--sand: #C89860`, `--ochre: #D4A843`.
  - Avoidance of generic primaries: No harsh hex blues, reds, or greens; all colors emulate natural mineral pigments (lapis, malachite, cinnabar, beaten gold).

### 2. Spacing & Grid System
- Generous editorial whitespace: Container max-widths (`1400px` for main shell, `1000px` for specs view, `700px` for checkout), ample section padding (`5rem` to `8rem`), and modular 2-column, 3-column, and 4-column CSS grid layouts.
- Consistent border styling: Warm hairline borders (`1px solid var(--fog)` / `rgba(184, 92, 56, 0.15)`) replicating fine archival bookbinding.

### 3. Image Assets & Treatment
- High-fidelity assets: Seven authentic photographs reside in `/public/images/` (ranging from 600 KB to 921 KB each).
- Cropping & Mounts: Framed inside rounded rectangular visual cards with shadow overlays, simulated mats, and accession tags.

### 4. 3D Scene Composition
- Warm museum gallery aesthetic: Ivory floor plane with concentric architectural brass rings, gentle warm spotlights, and floating gold leaf dust specks creating atmospheric depth without visual clutter.
- Pedestal Design: Layered sandstone plinths with polished teak tops, beaten brass rims, and engraved accession plaques.

---

## 13. Known Limitations

1. **Non-Functional Backend:** The FastAPI backend is entirely non-functional. All routers, database models, schemas, and services are empty stubs.
2. **Zero HTTP Communication:** The frontend does not communicate with any server. All data operations are localized to client-side state and browser `localStorage`.
3. **Absence of Real Authentication:** `AuthContext.tsx` is an empty stub. The onboarding OTP flow accepts any 4-digit number and simulates authentication without JWTs or password hashing.
4. **Unprotected Seller Routes:** Anyone can directly navigate to `/dashboard`, `/dashboard/create`, and `/dashboard/edit/:id` without logging in.
5. **No File Upload / Image Storage:** Inscribing a new craft piece supports only picking from 6 local preset images or entering a URL string. No binary multipart upload, camera integration, or Cloudinary storage exists.
6. **No Real Payment Gateway:** The checkout experience simulates payment settlement via UI radio buttons and generates a local order ID. No Razorpay, Stripe, or bank escrow API is integrated.
7. **3D Gallery Catalog Discrepancy:** Newly created seller products are saved to `productStore.ts` and appear in `/shop` and `/shop/:id`, but **do not appear in `/gallery`**, because `GalleryCanvas.tsx` imports statically from `craftsData.ts`.
8. **Hardcoded Artisan Portrait:** In `Product.tsx` Scene 02, the artisan portrait image is hardcoded to `/images/artisan.jpg` for every product, regardless of the artisan's actual identity.
9. **Hardcoded Dashboard Orders:** Tab 2 in `Dashboard.tsx` displays three hardcoded static mock orders rather than pulling dynamically from `kaarigar_orders_v1`.
10. **Unimplemented Internationalization:** While English and Kannada JSON dictionaries exist in `frontend/src/i18n/`, `i18n/index.ts` is an empty comment, and no language switcher is wired into the UI.

---

## 14. Unverified Questions

The following questions could not be definitively resolved from source code inspection alone and require live runtime verification or product stakeholder input:

1. **Browser Runtime Dev Server:** What caused the local Vite dev server on port 5173 to return `ERR_CONNECTION_REFUSED` during the audit turn despite process metadata indicating `npm run dev` was initiated?
2. **3D WebGL Performance on Mobile Devices:** How does the procedural 3D scene (with 140 points, multiple physical materials with transmission, and shadow maps) perform on low-power mobile GPUs and WebGL implementations?
3. **Original KalaHaat Backend Intent:** Was the Python FastAPI backend intended to be completed with PostgreSQL and Gemini AI multimodal listing generation, or has the project permanently transitioned to a client-side serverless model?
4. **Multi-Artisan Seller Support:** Is the seller dashboard intended to support multiple distinct artisan accounts with distinct inventory scopes, or is the single `ArtisanProfile` in `localStorage` the intended design for the current phase?

---

## 15. Key File References

### Frontend Core & Routing
- [frontend/package.json](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/package.json) — NPM dependencies and build scripts
- [frontend/index.html](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/index.html) — HTML root, Google Fonts (Cormorant Garamond, Cinzel, Plus Jakarta Sans)
- [frontend/src/main.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/main.tsx) — React 19 root entry point
- [frontend/src/App.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/App.tsx) — Main route definition across all 9 pages
- [frontend/src/types/index.ts](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/types/index.ts) — TypeScript interfaces for `CraftObject`, `CartItem`, `StoryArticle`

### Data & State Management
- [frontend/src/data/craftsData.ts](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/data/craftsData.ts) — Canonical dataset for 6 heritage crafts, monographs, and making steps
- [frontend/src/data/productStore.ts](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/data/productStore.ts) — Dynamic product store, wishlist store, artisan profile store (`localStorage`)
- [frontend/src/contexts/CartContext.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/contexts/CartContext.tsx) — Shopping bag state, persistence, and artisan share economics

### Pages
- [frontend/src/pages/Home.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/pages/Home.tsx) — Editorial homepage combining modular sections
- [frontend/src/pages/Catalogue.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/pages/Catalogue.tsx) — Curated collection catalogue with filters, search, and sorting
- [frontend/src/pages/Product.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/pages/Product.tsx) — 6-chapter interactive product storyboard & archival specs
- [frontend/src/pages/Gallery.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/pages/Gallery.tsx) — 3D Spatial Exhibition page with 2D fallback mode
- [frontend/src/pages/Checkout.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/pages/Checkout.tsx) — Multi-step checkout, delivery details, simulated payment
- [frontend/src/pages/Onboarding.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/pages/Onboarding.tsx) — Artisan registration and simulated OTP verification
- [frontend/src/pages/Dashboard.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/pages/Dashboard.tsx) — Seller atelier console (inventory, mock orders, profile)
- [frontend/src/pages/CreateListing.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/pages/CreateListing.tsx) — Inscribe/edit craft listing with live customer preview
- [frontend/src/pages/OrderTracking.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/pages/OrderTracking.tsx) — Post-purchase milestone tracker & GI provenance seal

### 3D Spatial Gallery
- [frontend/src/gallery/GalleryCanvas.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/gallery/GalleryCanvas.tsx) — R3F Canvas, texture preloading, WebGL fallback
- [frontend/src/gallery/ArtisanArtifact3D.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/gallery/ArtisanArtifact3D.tsx) — Procedural 3D composite meshes & pedestals for all 6 crafts
- [frontend/src/gallery/GalleryCameraRig.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/gallery/GalleryCameraRig.tsx) — Drei OrbitControls and camera focus vector lerping
- [frontend/src/gallery/GalleryEnvironment.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/gallery/GalleryEnvironment.tsx) — Museum lighting, fog, ground plane reflections, floating gold dust

### Key Components
- [frontend/src/components/SiteHeader.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/components/SiteHeader.tsx) — Sticky header, search overlay, mobile menu
- [frontend/src/components/CartDrawer.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/components/CartDrawer.tsx) — Curatorial bag drawer & quick reservation
- [frontend/src/components/ObjectDetailPanel.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/components/ObjectDetailPanel.tsx) — 3D gallery accession dossier modal
- [frontend/src/components/TwoDArchiveView.tsx](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/frontend/src/components/TwoDArchiveView.tsx) — 2D curatorial catalog view

### Backend Stubs
- [backend/main.py](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/backend/main.py) — FastAPI entry point with router inclusions
- [backend/requirements.txt](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/backend/requirements.txt) — Declared Python dependencies
- [backend/.env.example](file:///c:/arjun/Major%20Projects/baby-of-hack-babies-and-we-dont-know/backend/.env.example) — Template for backend environment variables
