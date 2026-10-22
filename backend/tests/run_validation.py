r"""
KAARIGAR AI Space Stylist – 4-case validation test (uses FastAPI TestClient, no server needed).
Run from: backend/
  venv\Scripts\python.exe tests\run_validation.py
"""
import sys
import os
import warnings
warnings.filterwarnings("ignore")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
import main

client = TestClient(main.app)

IMG_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/public/images"))

TEST_CASES = [
    {
        "case": "A. pahari.jpg — Gallery/room setting (should be SUITABLE + recommendations)",
        "path": os.path.join(IMG_BASE, "pahari.jpg"),
        "preference": "Authentic heritage craft for shelves",
        "expect_suitable": True,
    },
    {
        "case": "B. woodcraft.jpg — Craft studio/object (different visual characteristics from A)",
        "path": os.path.join(IMG_BASE, "woodcraft.jpg"),
        "preference": "",
        "expect_suitable": None,  # may or may not be classified suitable
    },
    {
        "case": "C. artisan.jpg — Person's face/portrait (MUST be UNSUITABLE, 0 recommendations)",
        "path": os.path.join(IMG_BASE, "artisan.jpg"),
        "preference": "",
        "expect_suitable": False,
    },
    {
        "case": "D. jewellery.jpg — Jewellery closeup / unrelated to room (should be UNSUITABLE)",
        "path": os.path.join(IMG_BASE, "jewellery.jpg"),
        "preference": "",
        "expect_suitable": False,
    },
]

print("=" * 70)
print("KAARIGAR AI SPACE STYLIST — 4-CASE VALIDATION (TestClient)")
print("=" * 70)

all_passed = True
for tc in TEST_CASES:
    print(f"\n--- {tc['case']} ---")

    if not os.path.exists(tc["path"]):
        print(f"  SKIP: Image not found: {tc['path']}")
        continue

    with open(tc["path"], "rb") as f:
        img_data = f.read()

    files = {"image": ("test.jpg", img_data, "image/jpeg")}
    data = {"preference": tc["preference"]}
    resp = client.post("/chatbot/analyze-space", files=files, data=data)

    print(f"  HTTP Status: {resp.status_code}")

    if resp.status_code != 200:
        print(f"  FAIL — Expected 200, got {resp.status_code}")
        print(f"  Body: {resp.text[:300]}")
        all_passed = False
        continue

    r = resp.json()
    sa = r.get("spaceAnalysis", {})
    recs = r.get("recommendations", [])

    is_suitable = sa.get("isSuitable")
    interior_style = sa.get("interiorStyle", "N/A")
    space_mood = sa.get("spaceMood", "N/A")
    dominant_colors = sa.get("dominantColors", [])
    unsuitable_msg = sa.get("unsuitableMessage", "")

    print(f"  isSuitable: {is_suitable}")

    if not is_suitable:
        print(f"  unsuitableMessage: {unsuitable_msg[:100]}")
        print(f"  recommendations: {len(recs)} (expected: 0)")
        if len(recs) != 0:
            print(f"  FAIL — Got {len(recs)} recommendations for unsuitable image!")
            all_passed = False
        else:
            print("  PASS — Correctly returned 0 recommendations for unsuitable image.")
    else:
        print(f"  interiorStyle: {interior_style}")
        print(f"  spaceMood: {space_mood}")
        print(f"  dominantColors: {dominant_colors}")
        print(f"  recommendations: {len(recs)}")
        for i, rec in enumerate(recs, 1):
            p = rec["product"]
            print(f"    {i}. [{rec['matchScore']}%] {p['title']} (ID: {p['id']}, Price: {p['price']})")
            print(f"       Reason: {rec['reason'][:80]}...")

    # Validate expected suitability
    if tc["expect_suitable"] is not None:
        if is_suitable != tc["expect_suitable"]:
            print(f"  FAIL — Expected isSuitable={tc['expect_suitable']}, got {is_suitable}")
            all_passed = False
        else:
            print(f"  PASS — isSuitable correctly returned {is_suitable}")

print("\n" + "=" * 70)
print("VALIDATION COMPLETE —", "ALL TESTS PASSED" if all_passed else "SOME TESTS FAILED")
print("=" * 70)
