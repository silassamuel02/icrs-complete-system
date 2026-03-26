# 🛡️ ICRS: Incident & Complaint Response System

A unified, AI-driven platform for real-time incident detection and automated complaint management.

## 📁 Project Structure

- **`/ai-backend`**: FastAPI server running YOLOv5, Pose, and CLIP for real-time video/audio analysis.
- **`/icrs-frontend`**: React (TypeScript) dashboard for monitoring alerts and managing complaints.
- **`/icrs-backend`**: Spring Boot (Java) REST API for complaint persistence and department management.

## 🚀 Getting Started

### 1. AI Backend (Python)
```bash
cd ai-backend
.\run.bat
```

### 2. Spring Boot Backend (Java)
Open the `icrs-backend` folder in STS/Eclipse or IntelliJ and run as a Spring Boot App.

### 3. React Frontend (Node.js)
```bash
cd icrs-frontend
npm install
npm run dev
```

## 🧠 AI Features
- **Fire & Explosion Detection**: Zero-shot classification using CLIP.
- **Violence Detection**: Movement and pose analysis.
- **Automated Registration**: High-severity events automatically trigger backend complaint creation.
