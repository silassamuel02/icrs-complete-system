from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy import create_engine
import joblib
import os
import datetime
import io
from fpdf import FPDF

from audio_detector import analyze_audio_bytes, analyze_text_for_urgency
from video_detector import analyze_frame_bytes
from live_detector import process_frame
import cv2
import numpy as np
import base64

# ── DATABASE SETUP ──────────────────────────────────────────────────────────
DATABASE_URL = "sqlite:///./complaints.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ComplaintModel(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    description = Column(Text)
    category = Column(String(100))
    severity = Column(String(50))
    status = Column(String(50), default="Pending") # Pending, In Progress, Resolved, Rejected
    progress = Column(Integer, default=0) # 0-100
    staff_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(String(100), default="Anonymous")

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── APP INITIALIZATION ──────────────────────────────────────────────────────
app = FastAPI(title="ICRS — Incident & Complaint Response System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state for lazy-loading
_ml_model = None
_ml_vectorizer = None

def get_ml_models():
    global _ml_model, _ml_vectorizer
    if _ml_model is None:
        try:
            _ml_model = joblib.load("model.pkl")
            _ml_vectorizer = joblib.load("vectorizer.pkl")
            print("ML models loaded successfully.")
        except Exception as e:
            print(f"Warning: Could not load ML models: {e}")
    return _ml_model, _ml_vectorizer

# ── SCHEMAS ─────────────────────────────────────────────────────────────────
class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str = None
    severity: str = None

class ComplaintUpdate(BaseModel):
    status: str = None
    progress: int = None
    staff_response: str = None

class PredictRequest(BaseModel):
    description: str

# ── NLP HELPERS ─────────────────────────────────────────────────────────────
def detect_type(text: str) -> str:
    text = text.lower()
    safety_keywords = ["abuse", "harass", "threat", "attack", "bully", "violence", "danger", "weapon"]
    for word in safety_keywords:
        if word in text: return "SAFETY"
    return "INFRASTRUCTURE"

def predict_severity(text: str) -> str:
    text = text.lower()
    if any(x in text for x in ["fire", "explosion", "danger", "critical"]): return "HIGH"
    if any(x in text for x in ["not working", "broken", "leak"]): return "MEDIUM"
    return "LOW"

# ── ENDPOINTS ───────────────────────────────────────────────────────────────

@app.post("/complaints")
def create_complaint(data: ComplaintCreate, db: Session = Depends(get_db)):
    # AI Pre-processing
    ai_category = data.category
    ai_severity = data.severity

    m, v = get_ml_models()
    if not ai_category and m and v:
        v_text = v.transform([data.description])
        ai_category = m.predict(v_text)[0]
    
    if not ai_severity:
        ai_severity = predict_severity(data.description)

    new_complaint = ComplaintModel(
        title=data.title,
        description=data.description,
        category=ai_category or "General",
        severity=ai_severity or "LOW"
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    return new_complaint

@app.get("/complaints")
def get_complaints(db: Session = Depends(get_db)):
    return db.query(ComplaintModel).order_by(ComplaintModel.created_at.desc()).all()

@app.get("/complaints/{id}")
def get_complaint(id: int, db: Session = Depends(get_db)):
    complaint = db.query(ComplaintModel).filter(ComplaintModel.id == id).first()
    if not complaint: raise HTTPException(status_code=404, detail="Not found")
    return complaint

@app.patch("/complaints/{id}")
def update_complaint(id: int, data: ComplaintUpdate, db: Session = Depends(get_db)):
    complaint = db.query(ComplaintModel).filter(ComplaintModel.id == id).first()
    if not complaint: raise HTTPException(status_code=404, detail="Not found")
    
    if data.status is not None: complaint.status = data.status
    if data.progress is not None: complaint.progress = data.progress
    if data.staff_response is not None: complaint.staff_response = data.staff_response
    
    db.commit()
    db.refresh(complaint)
    return complaint

@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    # Data for Admin Charts
    comps = db.query(ComplaintModel).all()
    categories = {}
    statuses = {"Pending": 0, "In Progress": 0, "Resolved": 0, "Rejected": 0}
    
    for c in comps:
        categories[c.category] = categories.get(c.category, 0) + 1
        if c.status in statuses: statuses[c.status] += 1
    
    return {
        "categories": categories,
        "statuses": statuses,
        "total": len(comps)
    }

@app.get("/export/pdf/{id}")
def export_pdf(id: int, db: Session = Depends(get_db)):
    complaint = db.query(ComplaintModel).filter(ComplaintModel.id == id).first()
    if not complaint: raise HTTPException(status_code=404, detail="Not found")
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt="ICRS - Official Complaint Report", ln=True, align='C')
    pdf.ln(10)
    
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(50, 10, txt=f"Complaint ID: {complaint.id}")
    pdf.cell(100, 10, txt=f"Date: {complaint.created_at.strftime('%Y-%m-%d %H:%M')}")
    pdf.ln(10)
    
    pdf.cell(200, 10, txt=f"Title: {complaint.title}", ln=True)
    pdf.cell(200, 10, txt=f"Category: {complaint.category}", ln=True)
    pdf.cell(200, 10, txt=f"Severity: {complaint.severity}", ln=True)
    pdf.cell(200, 10, txt=f"Status: {complaint.status}", ln=True)
    pdf.ln(5)
    
    pdf.set_font("Arial", '', 12)
    pdf.multi_cell(0, 10, txt=f"Description: {complaint.description}")
    pdf.ln(5)
    
    if complaint.staff_response:
        pdf.set_font("Arial", 'B', 12)
        pdf.cell(200, 10, txt="Staff Resolution:", ln=True)
        pdf.set_font("Arial", '', 12)
        pdf.multi_cell(0, 10, txt=complaint.staff_response)

    pdf_output = pdf.output(dest='S').encode('latin-1')
    return StreamingResponse(io.BytesIO(pdf_output), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=complaint_{id}.pdf"})

# ── AUDIO / VIDEO DETECTION ─────────────────────────────────────────────────
@app.websocket("/detect/video")
@app.websocket("/detect/live")
async def detect_live_websocket(websocket: WebSocket):
    print("DEBUG: Video WebSocket connection attempt...")
    await websocket.accept()
    print("DEBUG: Video WebSocket accepted.")
    try:
        while True:
            data = await websocket.receive_text()
            if "," in data:
                _, base64_data = data.split(",", 1)
            else:
                base64_data = data
            
            image_bytes = base64.b64decode(base64_data)
            
            # --- Detection Logic ---
            # 1. Image Conversion for OpenCV (for YOLO/Pose)
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is not None:
                try:
                    # 2. Run detailed live detectors (YOLO, Pose, etc.)
                    live_result = process_frame(frame)
                except Exception as e:
                    print(f"Error in live_detector: {e}")
                    live_result = {"objects": [], "pose": [], "emotions": []}
                
                try:
                    # 3. Run high-level emergency classifier (CLIP)
                    clip_result = analyze_frame_bytes(image_bytes)
                except Exception as e:
                    print(f"Error in video_detector: {e}")
                    clip_result = {"error": f"CLIP Error: {str(e)}", "urgency_detected": False, "detections": []}
                
                # --- Unify Data Mapping for React Frontend ---
                # The frontend expects { boxes: AlertBox[], activities: Activity[], emotions: Emotion[] }
                
                # boxes = live objects + clip detections
                boxes = []
                if "objects" in live_result:
                    boxes.extend(live_result["objects"])
                if "detections" in clip_result:
                    # Map CLIP detections (which have [0,0,w,h]) to boxes
                    boxes.extend(clip_result["detections"])
                
                # activities = any CLIP emergencies + any YOLO highlights
                activities = live_result.get("activities", [])
                if clip_result.get("urgency_detected"):
                    for det in clip_result.get("detections", []):
                        activities.append({
                            "label": det["label"],
                            "confidence": det["confidence"]
                        })
                
                # emotions = live emotions
                emotions = live_result.get("emotions", [])
                
                # Final merged result
                result = {
                    **clip_result,
                    **live_result,
                    "boxes": boxes,
                    "activities": activities,
                    "emotions": emotions
                }
            else:
                result = {"error": "Invalid image data received", "urgency_detected": False}
            
            await websocket.send_json(result)
    except WebSocketDisconnect:
        pass

@app.websocket("/detect/audio")
async def detect_audio_websocket(websocket: WebSocket):
    print("DEBUG: Audio WebSocket connection attempt...")
    await websocket.accept()
    print("DEBUG: Audio WebSocket accepted.")
    try:
        while True:
            # The frontend sends audio chunks as blobs/bytes
            data = await websocket.receive_bytes()
            # Analyze audio (reusing existing logic)
            result = analyze_audio_bytes(data, "audio/webm")
            await websocket.send_json(result)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Audio WebSocket Error: {e}")
        await websocket.close()

@app.post("/detect/audio")
async def detect_audio(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    return analyze_audio_bytes(audio_bytes, file.content_type)

@app.post("/predict")
async def ai_predict(req: PredictRequest):
    """Zero-shot complaint analysis for the Java/Spring backend."""
    analysis = analyze_text_for_urgency(req.description)
    return {
        "category": analysis["categories_found"][0] if analysis["categories_found"] else "General",
        "priority": analysis["severity"],
        "sentiment": analysis["sentiment"],
        "suggested_department": analysis["suggested_department"]
    }

@app.post("/detect/video-frame")
async def detect_video_frame(file: UploadFile = File(...)):
    image_bytes = await file.read()
    return analyze_frame_bytes(image_bytes)

# ── STATIC FILES ────────────────────────────────────────────────────────────
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(static_dir, exist_ok=True)
index_path = os.path.join(static_dir, "index.html")

@app.get("/")
def root():
    if os.path.exists(index_path): return FileResponse(index_path)
    return {"message": "Frontend not found"}

app.mount("/static", StaticFiles(directory=static_dir), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
