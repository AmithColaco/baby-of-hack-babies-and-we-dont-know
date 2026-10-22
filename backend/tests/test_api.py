import uuid
import pytest
from fastapi.testclient import TestClient
from main import app
from app.config import settings

client = TestClient(app)


def test_health_and_root():
    """Verify health and root endpoints."""
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}

    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_crafts_endpoint():
    """Verify craft reference seed data is retrievable."""
    res = client.get("/crafts")
    assert res.status_code == 200
    crafts = res.json()
    assert len(crafts) >= 3
    craft_names = [c["craft_type"] for c in crafts]
    assert "Kasuti" in craft_names
    assert "Beedu" in craft_names
    assert "Shell Craft" in craft_names


def test_auth_otp_flow_and_me():
    """Verify mock OTP login and profile endpoints."""
    # 1. Request OTP
    res = client.post("/auth/otp/request", json={"phone": "+919988776655"})
    assert res.status_code == 200

    # 2. Verify OTP
    res = client.post("/auth/otp/verify", json={"phone": "+919988776655", "otp": "123456"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. GET /me (alias) and /auth/me
    res = client.get("/me", headers=headers)
    assert res.status_code == 200
    profile = res.json()
    assert profile["user"]["phone"] == "+919988776655"

    res_auth = client.get("/auth/me", headers=headers)
    assert res_auth.status_code == 200
    assert res_auth.json()["user"]["id"] == profile["user"]["id"]

    # 4. Update profile as artisan
    update_data = {
        "name": "Ramesh Artisan",
        "craft_types": "Kasuti Embroidery, Terracotta",
        "village": "Gokarna",
        "years_practising": 12,
        "bio": "Third-generation master artisan.",
        "avatar_url": "https://example.com/avatar.jpg",
        "role": "artisan",
    }
    res = client.put("/me", json=update_data, headers=headers)
    assert res.status_code == 200
    updated = res.json()
    assert updated["user"]["name"] == "Ramesh Artisan"
    assert updated["artisan_profile"]["village"] == "Gokarna"
    assert updated["artisan_profile"]["years_practising"] == 12


def test_public_artisans_directory():
    """Verify public directory of artisans is retrievable."""
    res = client.get("/artisans")
    assert res.status_code == 200
    artisans = res.json()
    assert len(artisans) >= 1
    artisan_user_id = artisans[0]["user"]["id"]

    # Fetch individual public profile
    res = client.get(f"/auth/artisans/{artisan_user_id}")
    assert res.status_code == 200
    assert res.json()["user"]["id"] == artisan_user_id


def test_price_suggestion():
    """Verify deterministic pricing breakdown per fair pricing formula."""
    body = {
        "craft_type": "Kasuti",
        "hours_to_make": 10.0,
        "materials_cost": 300.0,
        "technique_complexity": "high",
    }
    res = client.post("/listings/price-suggestion", json=body)
    assert res.status_code == 200
    breakdown = res.json()
    assert breakdown["materials_cost"] == 300.0
    assert breakdown["hours"] == 10.0
    assert breakdown["fair_hourly_wage"] == settings.FAIR_HOURLY_WAGE_INR
    assert breakdown["suggested_price"] > 0
    assert breakdown["suggested_range"]["min"] < breakdown["suggested_price"] < breakdown["suggested_range"]["max"]
    assert "reasoning" in breakdown


def test_listings_catalogue_browse_and_filter():
    """Verify catalogue browsing, search, and price filtering."""
    # List all published
    res = client.get("/listings")
    assert res.status_code == 200
    listings = res.json()
    assert len(listings) > 0

    first_item = listings[0]
    listing_id = first_item["id"]

    # Detail view
    res = client.get(f"/listings/{listing_id}")
    assert res.status_code == 200
    detail = res.json()
    assert detail["id"] == listing_id
    assert "story" in detail

    # Filter by craft
    craft_type = first_item["craft_type"]
    res = client.get(f"/listings?craft={craft_type}")
    assert res.status_code == 200
    for item in res.json():
        assert item["craft_type"] == craft_type


def test_listing_crud_lifecycle():
    """Verify creating a draft, updating, publishing, and archiving."""
    # Login as an artisan
    login_res = client.post("/auth/otp/verify", json={"phone": "+919111222333", "otp": "123456"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    client.put("/me", json={"name": "Creator Artisan", "craft_types": "Seashell Craft", "role": "artisan"}, headers=headers)

    # 1. Create draft
    create_payload = {
        "title": "Handcrafted Shell Windchime",
        "description": "Melodic coastal chime made from natural beach shells",
        "craft_type": "Seashell Craft",
        "materials": "Found seashells, coconut coir cord, driftwood",
        "technique": "Hand drilled and knotted",
        "dimensions": "45cm x 15cm",
        "hours_to_make": 4.5,
        "price_inr": 850.0,
        "stock": 5,
    }
    res = client.post("/listings", json=create_payload, headers=headers)
    assert res.status_code == 201
    listing = res.json()
    listing_id = listing["id"]
    assert listing["status"] == "DRAFT"

    # 2. Update listing
    update_payload = {
        "title": "Deluxe Handcrafted Shell Windchime",
        "price_inr": 950.0,
        "story_origin_text": "Crafted along the sands of Karwar beach.",
    }
    res = client.patch(f"/listings/{listing_id}", json=update_payload, headers=headers)
    assert res.status_code == 200
    assert res.json()["title"] == "Deluxe Handcrafted Shell Windchime"
    assert res.json()["price_inr"] == 950.0

    # 3. Publish listing
    res = client.post(f"/listings/{listing_id}/publish", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "PUBLISHED"

    # 4. Archive listing
    res = client.post(f"/listings/{listing_id}/archive", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "ARCHIVED"


def test_gallery_and_guide():
    """Verify 3D virtual gallery payload and AI narration guide."""
    # 1. Gallery
    res = client.get("/gallery")
    assert res.status_code == 200
    gallery_items = res.json()
    assert len(gallery_items) > 0
    assert "position_hint" in gallery_items[0]
    assert "gallery_wing" in gallery_items[0]

    # 2. Guide narration
    listing_id = gallery_items[0]["id"]
    res = client.post("/guide/narrate", json={"listing_id": listing_id, "language": "en"})
    assert res.status_code == 200
    data = res.json()
    assert data["listing_id"] == listing_id
    assert len(data["narration"]) > 10


def test_checkout_order_flow_and_inventory_guard():
    """Verify atomic order checkout, idempotency, and status transitions."""
    # 1. Get a published listing
    cat_res = client.get("/listings?status=PUBLISHED")
    listings = cat_res.json()
    assert len(listings) > 0
    target_listing = listings[0]
    listing_id = target_listing["id"]
    initial_stock = target_listing["stock"]

    # 2. Buyer login
    buyer_login = client.post("/auth/otp/verify", json={"phone": "+919444555666", "otp": "123456"})
    buyer_token = buyer_login.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # 3. Checkout
    import uuid
    idempotency_key = f"test-checkout-{uuid.uuid4().hex}"
    checkout_payload = {
        "items": [{"listing_id": listing_id, "qty": 1}],
        "address": {"city": "Bengaluru", "pincode": "560001", "address_line": "123 MG Road"},
        "payment_method": "mock_upi",
        "idempotency_key": idempotency_key,
    }

    res = client.post("/orders", json=checkout_payload, headers=buyer_headers)
    assert res.status_code == 201
    order = res.json()
    order_id = order["id"]
    assert order["status"] == "PLACED"
    assert order["payment_status"] == "SUCCESS"

    # 4. Test idempotency: re-submitting same key returns same order without double charge/decrement
    res_idemp = client.post("/orders", json=checkout_payload, headers=buyer_headers)
    assert res_idemp.status_code == 201 or res_idemp.status_code == 200
    assert res_idemp.json()["id"] == order_id

    # Check inventory was decremented by exactly 1
    updated_listing = client.get(f"/listings/{listing_id}").json()
    assert updated_listing["stock"] == initial_stock - 1

    # 5. Order detail
    order_detail = client.get(f"/orders/{order_id}", headers=buyer_headers).json()
    assert order_detail["id"] == order_id

    # 6. Status transitions by artisan / admin
    artisan_user_id = target_listing["artisan_id"]
    # Get artisan user to transition status
    artisan_phone = None
    artisans = client.get("/artisans").json()
    for a in artisans:
        if a["user"]["id"] == artisan_user_id:
            artisan_phone = a["user"]["phone"]
            break

    if artisan_phone:
        art_login = client.post("/auth/otp/verify", json={"phone": artisan_phone, "otp": "123456"})
        art_headers = {"Authorization": f"Bearer {art_login.json()['access_token']}"}

        # Check artisan orders endpoint (both routes)
        art_orders_res = client.get("/artisan/orders", headers=art_headers)
        assert art_orders_res.status_code == 200

        # Valid transition: PLACED -> CONFIRMED
        t_res = client.patch(f"/orders/{order_id}/status", json={"status": "CONFIRMED"}, headers=art_headers)
        assert t_res.status_code == 200
        assert t_res.json()["status"] == "CONFIRMED"

        # Invalid transition: CONFIRMED -> DELIVERED (skipping SHIPPED)
        bad_res = client.patch(f"/orders/{order_id}/status", json={"status": "DELIVERED"}, headers=art_headers)
        assert bad_res.status_code == 400


def test_guest_checkout_and_unauthenticated_order_tracking():
    """Verify that checkout requires authentication (unauthenticated is rejected with 401)."""
    # Find a published listing with stock
    listings = client.get("/listings?status=PUBLISHED").json()
    assert len(listings) > 0
    target = listings[0]

    checkout_payload = {
        "items": [{"listing_id": target["id"], "qty": 1}],
        "address": {
            "full_name": "Radha Iyengar",
            "phone": "+919123456789",
            "address_line": "12 Temple Street",
            "city": "Mangalore",
            "state": "Karnataka",
            "pincode": "575001",
        },
        "payment_method": "mock_upi",
        "idempotency_key": f"guest-test-{uuid.uuid4().hex}",
    }

    # 1. Unauthenticated request must be rejected with 401
    res_unauth = client.post("/orders", json=checkout_payload)
    assert res_unauth.status_code == 401

    # 2. Authenticated user can checkout successfully
    login_res = client.post("/auth/otp/verify", json={"phone": "+919123456789", "otp": "123456"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/orders", json=checkout_payload, headers=headers)
    assert res.status_code == 201
    order = res.json()
    order_id = order["id"]
    assert order["payment_status"] == "SUCCESS"

    # Tracking order with token
    track_res = client.get(f"/orders/{order_id}", headers=headers)
    assert track_res.status_code == 200
    assert track_res.json()["id"] == order_id


def test_artisan_listings_filtering_and_draft_visibility():
    """Verify that artisan queries return all listings (including drafts) without hiding them."""
    # 1. Login as an artisan
    art_phone = "+919845012345"
    token_res = client.post("/auth/otp/verify", json={"phone": art_phone, "otp": "123456"}).json()
    token = token_res["access_token"]
    art_id = token_res["user_id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create a DRAFT listing
    draft_payload = {
        "title": "Unfinished Test Craft Item",
        "description": "Work in progress",
        "craft_type": "Kasuti",
        "materials": "Cotton",
        "technique": "Handloom",
        "dimensions": "50cm x 50cm",
        "hours_to_make": 12.0,
        "price_inr": 1500.0,
        "stock": 2,
    }
    draft_res = client.post("/listings", json=draft_payload, headers=headers)
    assert draft_res.status_code == 201
    draft_listing = draft_res.json()
    assert draft_listing["status"] == "DRAFT"

    # 3. Public catalogue browse (without artisan_id) must NOT show the draft
    public_res = client.get("/listings?status=PUBLISHED").json()
    assert not any(l["id"] == draft_listing["id"] for l in public_res)

    # 4. Artisan dashboard query (with artisan_id) MUST return the draft
    artisan_all_res = client.get(f"/listings?artisan_id={art_id}").json()
    assert any(l["id"] == draft_listing["id"] for l in artisan_all_res)


def test_validation_and_error_edge_cases():
    """Verify system resilience across negative paths and invalid inputs."""
    # Invalid OTP formats
    res = client.post("/auth/otp/verify", json={"phone": "+919845012345", "otp": "123"})
    assert res.status_code in (400, 422)

    res = client.post("/auth/otp/verify", json={"phone": "+919845012345", "otp": "abcdef"})
    assert res.status_code in (400, 422)

    # Non-existent listing 404
    res = client.get("/listings/non-existent-listing-uuid")
    assert res.status_code == 404

    # Non-existent order 404
    res = client.get("/orders/non-existent-order-uuid")
    assert res.status_code == 404

    # Payment card decline failure path
    listings = client.get("/listings?status=PUBLISHED").json()
    assert len(listings) > 0
    target = listings[0]
    decline_payload = {
        "items": [{"listing_id": target["id"], "qty": 1}],
        "address": {"card_number": "4000000000000002", "phone": "+919999888877"},
        "payment_method": "mock_card",
        "idempotency_key": f"decline-test-{uuid.uuid4().hex}",
    }
    # Unauthenticated checkout must return 401
    res_unauth = client.post("/orders", json=decline_payload)
    assert res_unauth.status_code == 401

    # Authenticated checkout with declined card returns 402
    buyer_login = client.post("/auth/otp/verify", json={"phone": "+919444555666", "otp": "123456"})
    buyer_headers = {"Authorization": f"Bearer {buyer_login.json()['access_token']}"}
    res = client.post("/orders", json=decline_payload, headers=buyer_headers)
    assert res.status_code == 402

