import io
import wave
import tempfile
import os

_text_classifier = None
_sentiment_pipeline = None

def get_text_classifier():
    """Lazy-load the zero-shot text classification model."""
    global _text_classifier
    if _text_classifier is None:
        try:
            from transformers import pipeline
            print("Lazy-loading zero-shot text model (PyTorch)...")
            _text_classifier = pipeline("zero-shot-classification", model="typeform/distilbert-base-uncased-mnli", framework="pt")
        except Exception as e:
            print(f"Warning: Text classifier failed to load: {e}")
            _text_classifier = None
    return _text_classifier

def get_sentiment_pipeline():
    """Lazy-load the sentiment analysis model."""
    global _sentiment_pipeline
    if _sentiment_pipeline is None:
        try:
            from transformers import pipeline
            print("Lazy-loading sentiment model (PyTorch)...")
            _sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english", framework="pt")
        except Exception as e:
            print(f"Warning: Sentiment model failed to load: {e}")
            _sentiment_pipeline = None
    return _sentiment_pipeline

# ─── Fallback Urgency keyword categories ────────────────────────────────────
URGENCY_KEYWORDS = {
    "fire":       ["fire", "flame", "flames", "burning", "blaze", "smoke", "inferno"],
    "explosion":  ["explosion", "explode", "exploded", "bomb", "blast", "detonation"],
    "medical":    ["heart attack", "medical", "ambulance", "injured", "bleeding",
                   "unconscious", "fainted", "stroke", "overdose", "choking"],
    "violence":   ["help", "help me", "attack", "assault", "shooting", "gunshot",
                   "stabbing", "robbery", "kidnap", "threat"],
    "disaster":   ["flood", "earthquake", "collapse", "gas leak", "chemical",
                   "toxic", "hazard", "emergency", "danger", "accident", "crash"],
}

KEYWORD_MAP = {}
for category, words in URGENCY_KEYWORDS.items():
    for w in words:
        KEYWORD_MAP[w.lower()] = category

# Categories for Zero-Shot Classification
CATEGORIES_TEXT = {
    "fire": "fire, flame, or smoke",
    "explosion": "explosion, bomb, or blast",
    "medical": "medical emergency, injured person, or ambulance",
    "violence": "physical violence, assault, shooting, or fighting",
    "disaster": "natural disaster, flood, earthquake, or accident",
    "safe": "normal safe everyday conversation"
}
CANDIDATE_LABELS = list(CATEGORIES_TEXT.values())
# Mapping labels to consistent categories and departments
LABEL_TO_CAT = {v: k for k, v in CATEGORIES_TEXT.items()}
DEPARTMENT_MAP = {
    "fire": "Fire and Emergency Services",
    "explosion": "Public Safety & Bomb Squad",
    "medical": "Health & Ambulance Services",
    "violence": "Police Department",
    "disaster": "Disaster Management & Rescue",
    "safe": "General Administration"
}
CONFIDENCE_THRESHOLD = 0.30

def _severity_from_categories(found: list[str]) -> str:
    """Map detected categories to a severity level."""
    if "fire" in found or "explosion" in found or "disaster" in found:
        return "HIGH"
    if "medical" in found or "violence" in found:
        return "HIGH"
    if found:
        return "MEDIUM"
    return "LOW"

def analyze_audio_bytes(audio_bytes: bytes, content_type: str = "audio/wav") -> dict:
    """
    Accepts raw audio bytes (WAV/WEBM/OGG), transcribes via Google Free API,
    scans transcript using Zero-Shot NLP (or fallback), returns structured result.
    """
    try:
        import speech_recognition as sr
    except ImportError:
        return {"error": "speech_recognition library not installed.", "urgency_detected": False}

    recognizer = sr.Recognizer()

    suffix = ".wav"
    if "webm" in content_type:
        suffix = ".webm"
    elif "ogg" in content_type:
        suffix = ".ogg"
    elif "mp3" in content_type:
        suffix = ".mp3"

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        with sr.AudioFile(tmp_path) as source:
            audio_data = recognizer.record(source)

        try:
            transcript = recognizer.recognize_google(audio_data)
        except sr.UnknownValueError:
            transcript = ""
        except sr.RequestError as e:
            return {
                "transcript": "",
                "urgency_detected": False,
                "keywords_found": [],
                "categories_found": [],
                "confidence_percent": 0.0,
                "severity": "LOW",
                "error": f"Speech API error: {str(e)}. " + 
                         ("Help: 'ffmpeg' not found (required for WebM). Please install ffmpeg." if "ffmpeg" in str(e).lower() else "")
            }

        return _analyze_transcript(transcript)

    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass

def _analyze_transcript(transcript: str) -> dict:
    """Classify transcript text for emergencies."""
    if not transcript.strip():
        return {
            "transcript": transcript,
            "urgency_detected": False,
            "keywords_found": [],
            "categories_found": [],
            "confidence_percent": 0.0,
            "severity": "LOW",
        }

    # If transformers is installed, use zero-shot
    classifier = get_text_classifier()
    if classifier is not None:
        results = classifier(transcript, candidate_labels=CANDIDATE_LABELS)
        
        categories_found = []
        highest_conf = 0.0
        
        for label, score in zip(results['labels'], results['scores']):
            cat = LABEL_TO_CAT[label]
            if cat != "safe" and score >= CONFIDENCE_THRESHOLD:
                if cat not in categories_found:
                    categories_found.append(cat)
                if score > highest_conf:
                    highest_conf = score
                    
        urgency_detected = len(categories_found) > 0
        severity = _severity_from_categories(categories_found)
        
        # Sentiment Analysis
        sentiment = "NEUTRAL"
        s_pipe = get_sentiment_pipeline()
        if s_pipe:
            try:
                sent_res = s_pipe(transcript[:500])[0]
                sentiment = sent_res['label'] # POSITIVE or NEGATIVE
            except Exception:
                pass
            
        suggested_dept = DEPARTMENT_MAP.get(categories_found[0] if categories_found else "safe", "General Administration")

        return {
            "transcript": transcript,
            "urgency_detected": urgency_detected,
            "keywords_found": [],
            "categories_found": categories_found,
            "confidence_percent": round(highest_conf * 100, 2),
            "severity": severity,
            "sentiment": sentiment,
            "suggested_department": suggested_dept
        }

    # Fallback keyword matching
    lower = transcript.lower()
    keywords_found = []
    categories_found = []

    for keyword, category in KEYWORD_MAP.items():
        if keyword in lower:
            keywords_found.append(keyword)
            if category not in categories_found:
                categories_found.append(category)

    urgency_detected = len(keywords_found) > 0
    severity = _severity_from_categories(categories_found)

    return {
        "transcript": transcript,
        "urgency_detected": urgency_detected,
        "keywords_found": keywords_found,
        "categories_found": categories_found,
        "confidence_percent": 100.0 if urgency_detected else 0.0,
        "severity": severity,
        "sentiment": "NEUTRAL",
        "suggested_department": DEPARTMENT_MAP.get(categories_found[0] if categories_found else "safe", "General Administration")
    }

def analyze_text_for_urgency(text: str) -> dict:
    """Direct text analysis (no audio required)."""
    return _analyze_transcript(text)
