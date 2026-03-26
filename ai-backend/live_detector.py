import cv2
import numpy as np

# Global state for lazy-loading
_yolo = None
_pose = None
_deepface = None
_prev_frame = None

def get_deepface():
    """Lazy-load DeepFace for emotion detection."""
    global _deepface
    if _deepface is None:
        try:
            from deepface import DeepFace
            _deepface = DeepFace
        except Exception as e:
            print(f"Warning: DeepFace failed to load: {e}. Emotion detection disabled.")
            _deepface = "FAILED"
    return _deepface if _deepface != "FAILED" else None

def _detect_motion(frame: np.ndarray):
    global _prev_frame
    if _prev_frame is None:
        _prev_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        return []
        
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    diff = cv2.absdiff(_prev_frame, gray)
    _prev_frame = gray
    
    # Simple thresholding to detect significant change
    _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
    motion_score = np.sum(thresh) / (frame.shape[0] * frame.shape[1] * 255)
    
    if motion_score > 0.05: # 5% area changed
        return [{"label": "motion", "confidence": min(1.0, motion_score * 5)}]
    return []

def get_yolo():
    global _yolo
    if _yolo is None:
        from ultralytics import YOLO
        print("Lazy-loading YOLO model...")
        _yolo = YOLO('yolov5nu.pt')
    return _yolo

def get_pose():
    global _pose
    if _pose is None:
        import mediapipe as mp
        print("Lazy-loading MediaPipe Pose...")
        _pose = mp.solutions.pose.Pose(static_image_mode=False,
                                       model_complexity=1,
                                       enable_segmentation=False,
                                       min_detection_confidence=0.5)
    return _pose
# Simple activity model placeholder – you can replace with a proper 3D CNN later
# For now we just detect "fighting" based on presence of multiple people and high motion

def _detect_objects(frame: np.ndarray):
    yolo_model = get_yolo()
    if yolo_model is None: return []
    results = yolo_model(frame, conf=0.4, verbose=False)
    detections = []
    for r in results:
        for box in r.boxes:
            cls = int(box.cls[0])
            label = yolo_model.names[cls]
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            detections.append({
                "label": label,
                "confidence": round(conf, 2),
                "bbox": [x1, y1, x2 - x1, y2 - y1]
            })
    return detections

def _detect_pose(frame: np.ndarray):
    pose_model = get_pose()
    if pose_model is None: return []
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose_model.process(rgb)
    if not results.pose_landmarks:
        return []
    landmarks = []
    for lm in results.pose_landmarks.landmark:
        landmarks.append({
            "x": lm.x,
            "y": lm.y,
            "z": lm.z,
            "visibility": lm.visibility
        })
    return landmarks

def _detect_emotions(frame: np.ndarray):
    deepface = get_deepface()
    if deepface is None:
        return []
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    try:
        analysis = deepface.analyze(rgb, actions=['emotion'], enforce_detection=False)
        # DeepFace returns a list if multiple faces are found
        if isinstance(analysis, list):
            analysis = analysis[0]
        return [{
            "label": analysis['dominant_emotion'],
            "confidence": analysis['emotion'][analysis['dominant_emotion']]
        }]
    except Exception:
        return []

def _detect_activities(frame: np.ndarray, detections: list):
    """Simple heuristic for activities based on detected objects."""
    activities = []
    labels = [d['label'] for d in detections]
    
    if 'person' in labels and 'knife' in labels:
        activities.append({"label": "violence_potential", "confidence": 0.85})
    
    if 'fire' in labels:
        activities.append({"label": "fire", "confidence": 0.95})
        
    return activities

def process_frame(frame: np.ndarray) -> dict:
    """Run all detectors on a single BGR frame and return a dict of results."""
    objs = _detect_objects(frame)
    motion = _detect_motion(frame)
    return {
        "objects": objs,
        "pose": _detect_pose(frame),
        "emotions": _detect_emotions(frame),
        "activities": _detect_activities(frame, objs) + motion
    }
