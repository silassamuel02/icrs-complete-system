import urllib.request
import os
import json
import time

# Ensure we can import video_detector
import sys
sys.path.append(r"c:\Users\silas\OneDrive\Desktop\complaint-ai")
from video_detector import analyze_frame_bytes

os.makedirs("sample_images", exist_ok=True)

urls = {
    "fire": "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?w=600",
    "explosion": "https://images.unsplash.com/photo-1627003442654-7389ea50bdf7?w=600",
    "medical": "https://images.unsplash.com/photo-1587556940733-3e1fe31818bd?w=600",
    "violence": "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=600",
    "disaster": "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600",
    "safe": "https://images.unsplash.com/photo-1506744626753-1fa28f673b0c?w=600"
}

results = {}

for name, url in urls.items():
    image_path = f"sample_images/{name}.jpg"
    print(f"Downloading {name} from Unsplash...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req) as resp, open(image_path, "wb") as f:
            image_bytes = resp.read()
            f.write(image_bytes)
    except Exception as e:
        print(f"Failed to download {name}: {e}")
        continue

    print(f"Running video_detector on {name}...")
    try:
        res = analyze_frame_bytes(image_bytes)
        results[name] = {
            "urgency_detected": res.get("urgency_detected"),
            "categories_found": res.get("categories_found"),
            "severity": res.get("severity")
        }
    except Exception as e:
        results[name] = {"error": str(e)}
        
    time.sleep(1) # delay to avoid rate limits

with open("sample_images/detection_results.json", "w") as f:
    json.dump(results, f, indent=2)

print("\nAll downloads and tests complete. See sample_images/detection_results.json")
