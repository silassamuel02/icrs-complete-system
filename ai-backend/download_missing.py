import urllib.request
import os
import json
import time
import ssl

import sys
sys.path.append(r"c:\Users\silas\OneDrive\Desktop\complaint-ai")
from video_detector import analyze_frame_bytes

os.makedirs("sample_images", exist_ok=True)

images = {
    "fire": "https://upload.wikimedia.org/wikipedia/commons/e/e3/Camp_Fire_near_Pulga_Road_2.jpg",
    "explosion": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Explosion_at_the_Deepwater_Horizon_oil_rig_1.jpg",
    "medical": "https://upload.wikimedia.org/wikipedia/commons/0/07/Ambulance_responding.JPG",
    "safe": "https://upload.wikimedia.org/wikipedia/commons/6/64/Central_Park_Spring_Morning.jpg"
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,*/*;q=0.8'
}

# Load existing results if any
results_file = "sample_images/detection_results.json"
if os.path.exists(results_file):
    with open(results_file, "r") as f:
        results = json.load(f)
else:
    results = {}

for name, url in images.items():
    image_path = f"sample_images/{name}.jpg"
    print(f"Downloading {name} from Wikipedia...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx) as resp, open(image_path, "wb") as f:
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
        
    time.sleep(2) # delay to avoid rate limits

with open(results_file, "w") as f:
    json.dump(results, f, indent=2)

print("Finished fetching remaining images!")
