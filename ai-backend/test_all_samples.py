import os
import shutil
import urllib.request
import json
import glob
import sys
sys.path.append(r"c:\Users\silas\OneDrive\Desktop\complaint-ai")
from video_detector import analyze_frame_bytes

os.makedirs("sample_images", exist_ok=True)

# 1. Download fire image from GitHub FireNET dataset
fire_url = "https://raw.githubusercontent.com/OlafenwaMoses/FireNET/master/fire-dataset/fire_images/fire.1.png"
print("Downloading fire image...")
try:
    urllib.request.urlretrieve(fire_url, "sample_images/fire.png")
except Exception as e:
    print(f"Failed to download fire.png: {e}")

# 2. Copy the AI generated images to sample_images with clean names
artifact_dir = r"C:\Users\silas\.gemini\antigravity\brain\8929ac15-925d-4cdd-a0cb-b4e651eeabcd"
for path in glob.glob(os.path.join(artifact_dir, "*.png")):
    filename = os.path.basename(path)
    if filename.startswith("explosion"):
        shutil.copy(path, "sample_images/explosion.png")
    elif filename.startswith("medical"):
        shutil.copy(path, "sample_images/medical.png")
    elif filename.startswith("safe"):
        shutil.copy(path, "sample_images/safe.png")
    elif filename.startswith("disaster"):
        shutil.copy(path, "sample_images/disaster.png")

print("Collected all sample images! Running detection...\n")

results = {}
for img_path in glob.glob("sample_images/*.*"):
    if not os.path.isfile(img_path): continue
    if img_path.endswith(".json"): continue
    
    name = os.path.basename(img_path).split('.')[0]
    print(f"--- Processing {os.path.basename(img_path)} ---")
    with open(img_path, "rb") as f:
        img_bytes = f.read()
    
    try:
        res = analyze_frame_bytes(img_bytes)
        results[name] = {
            "urgency_detected": res.get("urgency_detected"),
            "categories_found": res.get("categories_found"),
            "severity": res.get("severity")
        }
        print(f"  Categories: {res.get('categories_found')} | Severity: {res.get('severity')}")
    except Exception as e:
        print(f"  Error: {e}")

with open("sample_images/final_detection_results.json", "w") as f:
    json.dump(results, f, indent=2)

print("\nSaved final summary to sample_images/final_detection_results.json")
