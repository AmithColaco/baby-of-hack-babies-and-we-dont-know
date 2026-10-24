"""Test the 4 validation cases against http://127.0.0.1:8000/chatbot/analyze-space."""

import os
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

IMG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/public/images"))

TEST_CASES = [
    {
        "case": "A. Living Interior Space (sample_living_room.jpg)",
        "path": os.path.join(IMG_DIR, "sample_living_room.jpg"),
        "preference": "Authentic heritage craft for shelves",
    },
    {
        "case": "B. Studio Setting (woodcraft.jpg)",
        "path": os.path.join(IMG_DIR, "woodcraft.jpg"),
        "preference": "Minimalist decor, budget 30000",
    },
    {
        "case": "C. Human Face Portrait (artisan.jpg)",
        "path": os.path.join(IMG_DIR, "artisan.jpg"),
        "preference": "",
    },
    {
        "case": "D. Jewelry Closeup (jewellery.jpg)",
        "path": os.path.join(IMG_DIR, "jewellery.jpg"),
        "preference": "",
    },
]

def main():
    print("=" * 70)
    print("KAARIGAR AI SPACE STYLIST — 4-CASE PIPELINE VALIDATION")
    print("=" * 70)

    for tc in TEST_CASES:
        print(f"\n--- Testing Case: {tc['case']} ---")
        if not os.path.exists(tc["path"]):
            print(f"ERROR: File not found at {tc['path']}")
            continue

        with open(tc["path"], "rb") as f:
            files = {"image": ("test.jpg", f, "image/jpeg")}
            data = {"preference": tc["preference"]}
            resp = requests.post(f"{BASE_URL}/chatbot/analyze-space", files=files, data=data, timeout=60)

        print(f"HTTP Status: {resp.status_code}")
        if resp.status_code != 200:
            print("Response error:", resp.text)
            continue

        res = resp.json()
        analysis = res.get("spaceAnalysis", {})
        recs = res.get("recommendations", [])

        is_suitable = analysis.get("isSuitable")
        print(f"isSuitable: {is_suitable}")
        if not is_suitable:
            print(f"Unsuitable Message: {analysis.get('unsuitableMessage')}")
            print(f"Recommendations count: {len(recs)} (Expected: 0)")
        else:
            print(f"Interior Style: {analysis.get('interiorStyle')}")
            print(f"Space Mood: {analysis.get('spaceMood')}")
            print(f"Dominant Colors: {analysis.get('dominantColors')}")
            print(f"Space Description: {analysis.get('spaceDescription')}")
            print(f"Recommendations count: {len(recs)}")
            for i, r in enumerate(recs, 1):
                p = r["product"]
                print(f"  {i}. [{r['matchScore']}% match] {p['title']} (₹{p['price']:.0f}) - {p['craftTradition']}")
                print(f"     Reason: {r['reason']}")

    print("\n" + "=" * 70)
    print("TEST COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    main()

