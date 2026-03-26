import io

_classifier = None

def get_video_classifier():
    """Lazy-load the CLIP model for zero-shot image classification."""
    global _classifier
    if _classifier is None:
        try:
            from transformers import pipeline
            print("Lazy-loading CLIP model for video_detector (PyTorch)...")
            _classifier = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32", framework="pt")
        except Exception as e:
            print(f"Warning: CLIP Model failed to load: {e}")
            _classifier = None
    return _classifier

# ─── Detection Categories ────────────────────────────────────────────────────
CATEGORIES = {
    "fire": "a photo of a fire, flame, blaze, or smoke",
    "explosion": "a photo of an explosion, blast, or bombing",
    "medical": "a photo of a medical emergency, ambulance, or injured person",
    "violence": "a photo of physical violence, assault, shooting, or fighting",
    "disaster": "a photo of a natural disaster, flood, earthquake, or car crash",
    "safe": "a normal, safe, everyday scene with no emergencies"
}

CANDIDATE_LABELS = list(CATEGORIES.values())
LABEL_TO_CATEGORY = {v: k for k, v in CATEGORIES.items()}
CONFIDENCE_THRESHOLD = 0.45   

def analyze_frame_bytes(image_bytes: bytes) -> dict:
    """
    Accepts raw image bytes, converts to a PIL Image, runs zero-shot classification,
    and returns a structured result.
    """
    classifier = get_video_classifier()
    if classifier is None:
        return {
            "fire_detected": False,
            "urgency_detected": False,
            "confidence_percent": 0.0,
            "severity": "LOW",
            "detections": [],
            "error": "CLIP classifier not loaded (transformers might be missing)."
        }

    try:
        from PIL import Image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        return {
            "fire_detected": False,
            "urgency_detected": False,
            "confidence_percent": 0.0,
            "severity": "LOW",
            "detections": [],
            "error": f"Could not decode image: {str(e)}"
        }
        
    return _detect_with_clip(image, classifier)

def _detect_with_clip(image, classifier) -> dict:
    """Internal helper to run classification on a PIL image."""
    try:
        results = classifier(image, candidate_labels=CANDIDATE_LABELS)
        
        detections = []
        highest_confidence = 0.0
        detected_cats = set()
        
        for res in results:
            score = res['score']
            label = res['label']
            category_name = LABEL_TO_CATEGORY[label]
            
            if category_name != "safe" and score >= CONFIDENCE_THRESHOLD:
                detected_cats.add(category_name)
                if score > highest_confidence:
                    highest_confidence = score
                
                detections.append({
                    "label": category_name,
                    "confidence": round(score, 2),
                    "bbox": [0, 0, image.width, image.height]
                })

        urgency_detected = len(detected_cats) > 0
        severity = _compute_severity(list(detected_cats), highest_confidence)
        fire_detected = "fire" in detected_cats
        
        return {
            "fire_detected": fire_detected,
            "urgency_detected": urgency_detected,
            "categories_found": list(detected_cats),
            "confidence_percent": round(highest_confidence * 100, 2),
            "severity": severity,
            "detections": detections,
        }
    except Exception as e:
        return {
            "fire_detected": False,
            "urgency_detected": False,
            "confidence_percent": 0.0,
            "severity": "LOW",
            "detections": [],
            "error": f"Error during CLIP inference: {str(e)}"
        }

def _compute_severity(categories: list[str], max_score: float) -> str:
    if not categories:
        return "LOW"
    
    # Categories that automatically trigger HIGH/MEDIUM severity
    high_severity_cats = {"fire", "explosion", "medical", "violence", "disaster"}
    
    for cat in categories:
        if cat in high_severity_cats:
            if max_score > 0.40:
                return "HIGH"
            return "MEDIUM"
            
    return "LOW"
