# PRD: KalaHaat — Virtual Marketplace for Coastal Artisans

**Problem statement:** PS 4.2 | Digital Market Access for Local Artisans **Author:** Chinmay | **Status:** MVP draft v0.1 | **Working title:** KalaHaat (haat = local market)

## 1. Overview

Artisans making Kasuti embroidery, Beedu craft and other coastal crafts have almost no digital presence and no direct line to buyers. Middlemen capture most of the margin, and the story behind each piece (who made it, how long it took, what tradition it belongs to) is lost, which also makes fair pricing hard.

KalaHaat is a simple, voice-friendly platform where an artisan can photograph a piece, get an AI-drafted listing with a craft story and a suggested price, and sell directly to buyers. Buyers browse either a normal catalogue or an immersive **3D virtual gallery** (reusing the 3D viewing layer from the Heritage Lens project), where each piece hangs in a walkable space with an AI guide narrating its provenance.

**One-line pitch:** *A virtual haat where every craft tells its own story, and the artisan sets up shop in under five minutes.*

## 2. Goals and non-goals

### Goals (MVP)

- An artisan with minimal training can create a listing in under 5 minutes, from a phone.
- A buyer can discover, view (2D and 3D), and place an order end to end.
- Every listing carries a craft story / provenance card that supports its price.
- A working demo with seeded data for at least Kasuti, Beedu and one more coastal craft.

### Non-goals (MVP)

- Real payments, real logistics, real KYC (all mocked or stubbed).
- Native mobile apps (we ship a responsive PWA).
- Full 3D scanning of products (we fake depth with framed planes and optional GLB models).
- Multi-seller carts, returns, disputes.

## 3. Users and personas

| Persona | Who | Key needs |
| --- | --- | --- |
| **Artisan (seller)** | Kasuti embroiderer or Beedu craftsperson, often low digital literacy, phone-first, Kannada/Tulu speaker | Zero-friction onboarding, voice input, local language, fair price guidance, simple order alerts |
| **Buyer** | Urban or diaspora buyer, gift shopper, interior designer, heritage enthusiast | Trust, authenticity, story, easy checkout |
| **Facilitator / admin** | NGO worker, cooperative, or student volunteer who onboards artisans | Bulk onboarding, moderation, ability to list on behalf of an artisan |

The facilitator persona matters for realism: many artisans will first appear on the platform through a helper, so "list on behalf of" is a first-class flow.

## 4. Product concept

Think of the product as three layers:

1. **Seller console (CRUD + AI assist):** create and manage listings and orders.
2. **Storefront (catalogue):** a plain, fast, searchable grid. This is the safe, always-works path.
3. **Virtual gallery (3D):** a scene graph where each listing is a node (framed textile, craft on a pedestal). Click a node to open its product and story panel. An AI guide can auto-walk the visitor and narrate, reusing the guide behaviour from the Heritage Lens build.

The 3D gallery is the differentiator; the catalogue is the fallback so the demo never depends on WebGL working.

## 5. Scope and prioritisation

**P0 = must ship for MVP, P1 = ship if time permits, P2 = future.**

| # | Feature | Priority |
| --- | --- | --- |
| F1 | Artisan onboarding (phone + OTP, mocked) with profile and craft type | P0 |
| F2 | Listing creation: photos, title, price, stock, craft type | P0 |
| F3 | AI listing assistant (Gemini): photo to title, description, story, tags | P0 |
| F4 | Price suggestion with transparent breakdown | P0 |
| F5 | Storefront catalogue: browse, filter by craft, search, product page | P0 |
| F6 | Provenance / craft story card on every product | P0 |
| F7 | Cart + checkout + order creation with mocked payment | P0 |
| F8 | Artisan order dashboard with status updates | P0 |
| F9 | 3D virtual gallery (walkable or orbit view, clickable pieces) | P0 (basic) |
| F10 | Voice input for listing (Web Speech API STT) | P1 |
| F11 | AI gallery guide with TTS narration | P1 |
| F12 | Kannada / English UI toggle | P1 |
| F13 | Facilitator mode (list on behalf of an artisan) | P1 |
| F14 | QR code on product that links to its story page | P1 |
| F15 | WhatsApp-style order notification (mocked as in-app + log) | P2 |
| F16 | AR "view on your wall" | P2 |

## 6. User flows

### 6.1 Artisan: create a listing

1. Opens the app on phone, enters phone number, enters mock OTP.
2. Picks craft type (Kasuti, Beedu, Other) and fills a 3-field profile (name, village/town, years of practice).
3. Taps **Add piece**, uploads 1 to 4 photos.
4. Optionally speaks a short description in Kannada or English (voice to text).
5. AI returns a draft: title, description, craft story, tags, and a suggested price range. Everything is editable.
6. Artisan confirms price and stock, taps **Publish**. The piece appears in both catalogue and 3D gallery.

### 6.2 Buyer: discover and buy

1. Lands on home page with two entry points: **Browse shop** and **Enter gallery**.
2. In the gallery, walks or orbits, clicks a piece, sees the product panel (photo, price, story, artisan).
3. Adds to cart, enters name and address, picks mock payment (UPI / card / COD stub).
4. Sees order confirmation and an order tracking page.

### 6.3 Artisan: fulfil an order

1. Sees new order in dashboard (badge + list).
2. Moves order through states: `PLACED -> CONFIRMED -> SHIPPED -> DELIVERED` (or `CANCELLED`).
3. Buyer's tracking page updates accordingly.

The order lifecycle is just a small state machine; enforce legal transitions server-side.

## 7. Feature specifications

### F1. Onboarding

- Phone number + mock OTP (any 6-digit code accepted in demo mode, or fixed `123456`).
- Issues a JWT stored in memory plus an httpOnly cookie.
- Profile: display name, location, craft type(s), years of practice, optional photo, short bio.
- Roles: `artisan`, `buyer`, `facilitator`, `admin`.

### F2. Listings

- Fields: title, description, craft type, materials, dimensions, time to make (hours), price (INR), stock, images (max 4), story reference.
- Status: `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- Image upload with client-side compression before upload (phones produce large images).

### F3. AI listing assistant

- Input: images + optional voice transcript + craft type.
- Output (strict JSON): `title`, `description`, `materials[]`, `technique`, `story`, `tags[]`, `suggested_price_range`.
- Implementation: FastAPI endpoint calls Gemini multimodal with a system prompt and a JSON response schema; validate with Pydantic; on invalid output retry once, then fall back to a blank editable form.
- The artisan always edits and approves; AI output is a draft, never auto-published.

### F4. Price suggestion (transparent, not a black box)

Compute a breakdown the artisan can see and override:

```
suggested_price = (materials_cost + hours * fair_hourly_wage) * craft_premium_multiplier + platform_fee
```

- `fair_hourly_wage`: configurable constant (set it above local casual labour rates, document the assumption).
- `craft_premium_multiplier`: lookup by craft and technique complexity (e.g. dense Kasuti work scores higher than simple motifs).
- Gemini estimates technique complexity and hours from photos and the description; the **arithmetic is deterministic in code**, not left to the LLM. Show the range plus the reasoning in one or two lines.
- Optionally compare against seeded comparable listings (median price of the same craft and size band).

### F5. Storefront catalogue

- Grid with image, title, price, artisan name, craft badge.
- Filters: craft type, price range, in stock. Search by title/tag (Postgres full-text search or simple `ILIKE` for MVP).
- Product page: image carousel, price, stock, story card, artisan card, **View in gallery** button.

### F6. Provenance / craft story

Each listing has a story card with:

- **Craft origin:** one or two lines on the tradition (curated per craft, seeded, and reviewed for accuracy).
- **Maker:** artisan name, place, years practising.
- **Making process:** materials, technique, hours.
- **Why it is priced this way:** the F4 breakdown in plain language.
- **Authenticity:** a unique piece ID and QR code (P1). Verified badge if a facilitator or cooperative vouches (future).

Accuracy note: have the craft-origin text checked against reliable sources or the artisans themselves before the demo; do not let the model invent history. Keep the curated craft facts in a seed file and feed them to Gemini as grounding context.

### F7. Cart, checkout, orders

- Single-seller or multi-item cart held in client state, synced to backend on checkout.
- Mock payment service behind a `PaymentProvider` interface with a `MockProvider` (always succeeds, or fails on a magic card number to demo the failure path). Swap in Razorpay test mode later without touching order logic.
- Order creation is transactional: decrement stock and insert order and order items in one DB transaction; reject if stock is insufficient. This is the main concurrency guard (use `SELECT ... FOR UPDATE` on the product rows).
- Idempotency key on checkout to avoid double orders on retries.

### F8. Artisan dashboard

- Tabs: **Orders**, **My pieces**, **Add piece**.
- Big touch targets, icon-plus-label buttons, minimal text. Test on a low-end Android viewport.

### F9. 3D virtual gallery

- Built with **three.js via react-three-fiber** and **drei** helpers.
- Scene: a simple gallery room (walls, floor, lighting), one wing per craft type.
- Textiles (Kasuti): image texture mapped to a framed plane on the wall with a subtle normal map to hint at thread texture.
- 3D crafts (Beedu etc.): either a GLB model if available (loaded with `useGLTF`) or a turntable of photos on a pedestal as a fallback.
- Navigation: orbit controls by default (reliable on mobile and desktop); first-person walking is a P1 stretch. Click a piece to raycast-select and open a side panel with product info and **Add to cart**.
- Performance: lazy-load textures, cap texture size (1024px), compress with KTX2/Basis later, limit draw calls with instancing for repeated frames.
- Gallery layout is **generated from data**: given N published listings, place them along walls by craft. The scene is a pure function of the listings list, which keeps it easy to test and demo.
- Fallback: if WebGL is unavailable or the device is slow, show the catalogue.

### F10. Voice input

- Browser Web Speech API for speech-to-text (supports `en-IN`; Kannada support varies by browser, so test and keep typed input as fallback).

### F11. AI gallery guide

- Reuses the Heritage Lens guide pattern: FastAPI endpoint takes the current piece and returns a short narration from the story data; the browser speaks it with Web Speech API TTS.
- Auto-tour mode moves the camera along a precomputed path between pieces (camera tween between waypoints).

### F12. Language

- i18n with `react-i18next`; ship English plus Kannada strings for the artisan flow first.

### F13. Facilitator mode

- A facilitator account can create artisan profiles and listings on their behalf, with `created_by` tracked on each record.

## 8. Architecture

```
[React PWA (Vite + TS)]
   |-- Storefront / Seller console / R3F Gallery
   |-- Web Speech API (STT/TTS) in browser
   v  REST (JSON)
[FastAPI backend]
   |-- Auth (JWT)
   |-- Listings / Orders / Users services
   |-- AI service  --> Gemini API (multimodal + JSON mode)
   |-- Pricing service (deterministic)
   |-- Payment service (MockProvider)
   v
[PostgreSQL]        [Object storage: Cloudinary or S3-compatible]
```

## 9. Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React + Vite + TypeScript | Fast dev loop, strong typing |
| Styling | Tailwind CSS (+ shadcn/ui components) | Quick, consistent, accessible UI |
| State | Zustand (client), TanStack Query (server cache) | Light, minimal boilerplate |
| 3D | three.js, @react-three/fiber, @react-three/drei | Declarative scene graph in React |
| Voice | Web Speech API (STT + TTS) | Free, no server cost, already used before |
| i18n | react-i18next | Standard |
| PWA | vite-plugin-pwa | Installable, offline shell |
| Backend | FastAPI (Python 3.11+), Pydantic v2 | Type-validated APIs, auto OpenAPI docs |
| ORM / migrations | SQLAlchemy 2 + Alembic | Standard, reliable |
| Database | PostgreSQL (SQLite fallback for quick local demo) | Transactions, full-text search |
| AI | Gemini API (multimodal Flash-class model, JSON schema output) | Photo understanding, structured output |
| Storage | Cloudinary (free tier) or local disk for demo | Image resizing and CDN |
| Auth | JWT (python-jose) + mock OTP | Simple, swap-ready for real SMS OTP |
| Payments | `PaymentProvider` interface, `MockProvider` | Real gateway swappable later |
| Testing | pytest, httpx; Vitest + Testing Library; Playwright for one e2e path | Cover the money path |
| Deploy | Vercel (frontend) + Render/Railway (backend + Postgres) | Free tiers, quick |
| CI | GitHub Actions (lint + tests) | Cheap safety net |

Before building, check the current Gemini model names and free-tier limits in the official docs, since they change.

## 10. Data model

```
users(id, role, name, phone, language, created_at)
artisan_profiles(user_id PK/FK, craft_types[], village, years_practising, bio, avatar_url, verified bool, created_by FK users)
listings(id, artisan_id FK, title, description, craft_type, materials[], technique, dimensions, hours_to_make, price_inr, stock, status, story_id FK, gallery_wing, created_at)
listing_images(id, listing_id FK, url, position)
stories(id, listing_id FK, origin_text, process_text, price_rationale_json, qr_code_url)
craft_reference(craft_type PK, origin_text, premium_multiplier, notes)   -- curated seed data
orders(id, buyer_id FK, status, total_inr, address_json, payment_status, idempotency_key UNIQUE, created_at)
order_items(id, order_id FK, listing_id FK, qty, unit_price_inr)
payments(id, order_id FK, provider, status, ref, created_at)
```

Order `status` enum: `PLACED, CONFIRMED, SHIPPED, DELIVERED, CANCELLED`.

## 11. API surface (REST)

| Method + path | Purpose |
| --- | --- |
| `POST /auth/otp/request`, `POST /auth/otp/verify` | Mock OTP login |
| `GET/PUT /me` | Profile |
| `POST /listings/ai-draft` | Images + transcript in, structured draft out |
| `POST /listings/price-suggestion` | Deterministic price breakdown |
| `POST /listings`, `PATCH /listings/{id}`, `POST /listings/{id}/publish` | Listing CRUD |
| `GET /listings?craft=&q=&min=&max=` | Catalogue |
| `GET /listings/{id}` | Product + story |
| `GET /gallery` | Compact payload: id, image, position hints, title, price for the 3D scene |
| `POST /guide/narrate` | Narration text for a piece |
| `POST /orders` | Checkout (idempotency key header) |
| `GET /orders/{id}`, `GET /artisan/orders` | Tracking and dashboard |
| `PATCH /orders/{id}/status` | Artisan state transition |

## 12. AI design notes

- **Grounded generation:** pass the curated `craft_reference` text into the prompt so the model describes the real tradition instead of inventing one.
- **Structured output:** request JSON matching a schema, validate with Pydantic, one retry, then graceful fallback.
- **Human in the loop:** every AI field is editable and nothing publishes without the artisan's confirmation.
- **Cost and rate control:** cache by image hash, resize images before sending, and rate-limit the AI endpoints per user.
- **Safety:** moderate uploaded images and text (basic checks) before publishing.

## 13. Non-functional requirements

- **Usability:** artisan flow works one-handed on a \~360px-wide phone; primary actions are large and labelled.
- **Performance:** catalogue loads in under 3 seconds on a mid-range phone on 4G; gallery scene under about 15 MB of assets.
- **Reliability:** order creation is atomic and idempotent.
- **Security:** validate uploads (type and size), sanitise text, hash nothing sensitive we do not need to store, CORS locked to the frontend origin, secrets in environment variables.
- **Accessibility:** alt text from AI captions, keyboard-reachable controls, sufficient contrast.

## 14. Build plan

The plan is ordered so a working vertical slice exists as early as possible. Adjust the day counts to the real deadline.

1. **Foundation:** repo, FastAPI skeleton, Postgres schema, auth (mock OTP), seed script for craft reference and about 15 demo listings.
2. **Core commerce slice:** listing CRUD, catalogue, product page, cart, checkout with mock payment, order dashboard.
3. **AI layer:** `ai-draft` endpoint, price suggestion service, story card.
4. **3D gallery:** scene from `/gallery` data, orbit controls, click-to-open panel, add-to-cart from the panel.
5. **Polish and P1:** voice input, guide narration, language toggle, PWA, QR on product.
6. **Demo hardening:** seed data, record a backup demo video, test on a real phone, deploy.

If time runs short, cut in this order: F16, F15, F14, F13, F12, walking mode in F9. Never cut F5 or F7; the catalogue and order flow are what judges can verify quickly.

## 15. Demo script (3 minutes)

1. (20s) Problem: artisans have skill but no direct buyers.
2. (60s) Artisan flow on a phone: photo of a Kasuti piece, AI draft appears, price breakdown, publish.
3. (50s) Buyer flow: enter the 3D gallery, find that same piece, guide narrates the story, add to cart, mock checkout.
4. (20s) Artisan dashboard receives the order and marks it confirmed.
5. (30s) Roadmap: real payments, logistics, cooperatives, more crafts.

## 16. Success metrics

**Hackathon:** end-to-end flow works live; listing created in under 5 minutes; story and price rationale visible on every piece; 3D gallery loads reliably.

**Post-MVP:** artisans onboarded, listings per artisan, visitor-to-cart and cart-to-order conversion, repeat buyers, average artisan earnings versus their prior channel.

## 17. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| 3D gallery is slow or breaks on low-end devices | Catalogue fallback, texture caps, orbit mode default |
| Kannada speech recognition is unreliable | Typed input fallback, English voice as the demo path |
| AI invents craft history | Curated reference data as grounding, human review |
| Gemini rate limits or outage during demo | Cache seeded drafts, fallback to manual form |
| Scope creep | Strict P0 list; vertical slice first |
| Authenticity claims we cannot verify | Call it "maker-declared" until a facilitator verification flow exists |

## 18. Future plans

**Near term (after the hackathon)**

- Real payments via Razorpay (test mode first, then live) and real SMS OTP.
- Shipping integration (Shiprocket or similar) with tracking.
- Photogrammetry or phone-scan to GLB for 3D crafts such as Beedu pieces.
- Walkable first-person gallery with themed rooms and seasonal exhibitions.
- Full Kannada and Tulu interface; voice-first listing in regional languages.

**Medium term**

- Cooperative and NGO accounts with verification and bulk onboarding.
- Authenticity certificates (signed QR, optional blockchain-anchored provenance record).
- Custom orders: buyer requests a commission, artisan quotes and negotiates.
- Dynamic pricing insights from sales and demand data.
- AR "see it on your wall / wear it" preview.
- Analytics for artisans: what sells, when, to whom.

**Long term**

- Export and diaspora marketplace with international shipping and currency support.
- Craft learning layer: workshops and video lessons by artisans.
- Expansion to other regions and crafts, and API access for retailers and designers.
- Geographical Indication (GI) tag integration where a craft qualifies.

## 19. Open questions

- Final deadline and team size (this decides how much of P1 is realistic).
- Are there real artisans or a cooperative we can talk to for a quick validation call before submission?
- Do we show the platform fee in the MVP, or keep it at zero and document the model?
- Which third craft beyond Kasuti and Beedu do we seed (for example coastal shell craft, wood carving, or Mundkur-style weaving), and where do we source verified facts for it?
- Does the hackathon require a specific AI or cloud provider?
