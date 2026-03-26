// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';

const FRAME_INTERVAL_MS = 200; // Sending video frames every 200ms
const AUDIO_INTERVAL_MS = 1000; // Sending audio chunks every 1s
const ALERT_THRESHOLD = 0.45; // Match with Python API
const HIGH_SEVERITY_EVENTS = ['knife', 'fighting', 'fire', 'screaming', 'glass_breaking', 'motion', 'violence', 'violence_potential', 'explosion', 'medical', 'disaster', 'flood'];
const ALERT_COOLDOWN_MS = 30000;

interface CameraDetectionProps {
    width?: number;
    height?: number;
    onDetection?: (label: string, confidence: number) => void;
}

interface AlertBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    label: string;
    confidence: number;
}

interface Activity {
    label: string;
    confidence: number;
}

interface Emotion {
    label: string;
    confidence: number;
}

const CameraDetection: React.FC<CameraDetectionProps> = ({ width = 640, height = 480, onDetection }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState("Initializing...");
    const [alerts, setAlerts] = useState<string[]>([]); // Visual toasts
    const alertHistory = useRef<Record<string, number>>({}); // Track when we last sent to Spring Boot

    const videoWsRef = useRef<WebSocket | null>(null);
    const audioWsRef = useRef<WebSocket | null>(null);
    const sendVideoInterval = useRef<any>(null);
    const offCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // 1. Establish WebSockets connected to FastAPI
    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = import.meta.env.VITE_AI_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                     ? 'localhost:8000' 
                     : window.location.host);
        
        const wsUrlVideo = `${protocol}//${host}/detect/live`;
        const wsUrlAudio = `${protocol}//${host}/detect/audio`;

        console.log(`Connecting to Video WS: ${wsUrlVideo}`);
        console.log(`Connecting to Audio WS: ${wsUrlAudio}`);

        const videoWs = new WebSocket(wsUrlVideo);
        const audioWs = new WebSocket(wsUrlAudio);

        videoWs.onopen = () => setStatus("Connected to Video AI");
        audioWs.onopen = () => console.log("Connected to Audio AI");

        videoWs.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                drawOverlays(data);
                checkAlerts(data.activities || []);
            } catch (err) {
                console.error("Video WS Parse Error", err);
            }
        };

        audioWs.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                checkAlerts(data.audio_events || []);
            } catch (err) {
                console.error("Audio WS Parse Error", err);
            }
        };

        videoWs.onerror = (err) => {
            console.error("Video WS Error", err);
            setError("Failed to connect to Video AI");
        };
        audioWs.onerror = (err) => {
            console.error("Audio WS Error", err);
            // Don't set global error for audio, just log it
        };

        videoWsRef.current = videoWs;
        audioWsRef.current = audioWs;

        return () => {
            videoWs.close();
            audioWs.close();
        };
    }, []);

    // 2. Access Camera and Microphone
    useEffect(() => {
        let streamRef: MediaStream | null = null;
        let mediaRecorder: MediaRecorder | null = null;

        navigator.mediaDevices.getUserMedia({ video: { width, height }, audio: true })
            .then(stream => {
                streamRef = stream;

                // --- VIDEO SUBSYSTEM ---
                const video = videoRef.current;
                if (video) {
                    video.srcObject = stream;
                    video.onloadedmetadata = () => {
                        video.play().catch(e => console.error("Play error", e));
                        // Start sending frames
                        if (sendVideoInterval.current) clearInterval(sendVideoInterval.current);
                        sendVideoInterval.current = setInterval(sendFrameToBackend, FRAME_INTERVAL_MS);
                    };
                }

                // --- AUDIO SUBSYSTEM ---
                const audioTracks = stream.getAudioTracks();
                if (audioTracks.length === 0) {
                    console.warn("No audio tracks found in stream. Audio AI will be disabled.");
                    return;
                }
                console.log(`Found ${audioTracks.length} audio tracks. First track state: ${audioTracks[0].readyState}, enabled: ${audioTracks[0].enabled}`);

                // Defensive MIME type detection
                let mimeType = '';
                // Prefer opus if supported, but fall back to simpler types
                const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4'];
                
                for (const candidate of candidates) {
                    if (MediaRecorder.isTypeSupported(candidate)) {
                        mimeType = candidate;
                        break;
                    }
                }

                const createAndStartRecorder = (options: any = {}) => {
                    if (!stream.active) {
                        console.error("Stream is not active. Cannot start MediaRecorder.");
                        return null;
                    }
                    console.log(`Attempting to start MediaRecorder with options:`, JSON.stringify(options));
                    const recorder = new MediaRecorder(stream, options);
                    recorder.ondataavailable = (e) => {
                        if (e.data.size > 0 && audioWsRef.current?.readyState === WebSocket.OPEN) {
                            audioWsRef.current.send(e.data);
                        }
                    };
                    recorder.onerror = (me) => console.error("MediaRecorder technical error:", me);
                    recorder.start(AUDIO_INTERVAL_MS);
                    console.log("MediaRecorder STARTED successfully.");
                    return recorder;
                };

                // Delay to allow hardware to settle
                setTimeout(() => {
                    try {
                        mediaRecorder = createAndStartRecorder(mimeType ? { mimeType } : {});
                        if (mediaRecorder) setStatus("Connected to AI (Video + Audio)");
                    } catch (re) {
                        console.error("MediaRecorder initial attempt failed. Error details:", re);
                        try {
                            console.log("Retrying MediaRecorder with no options (browser default)...");
                            mediaRecorder = createAndStartRecorder({});
                            if (mediaRecorder) setStatus("Connected to AI (Video + Audio - Fallback)");
                        } catch (re2) {
                            console.error("MediaRecorder CRITICAL FAILURE - All attempts failed:", re2);
                            setStatus("Connected to Video AI (Audio Failed)");
                        }
                    }
                }, 1000);

            })
            .catch(err => {
                console.error('AV access denied or not supported', err);
                setError(`AV Error: ${err.name || 'Access Denied'}`);
            });

        return () => {
            if (sendVideoInterval.current) clearInterval(sendVideoInterval.current);
            if (mediaRecorder) mediaRecorder.stop();
            if (streamRef) streamRef.getTracks().forEach(t => t.stop());
        };
    }, [width, height]);

    // 3. Extract Video Frame and send
    const sendFrameToBackend = () => {
        const video = videoRef.current;
        if (!video || !videoWsRef.current || videoWsRef.current.readyState !== WebSocket.OPEN) return;

        if (!offCanvasRef.current) {
            offCanvasRef.current = document.createElement('canvas');
        }
        
        const offCanvas = offCanvasRef.current;
        if (offCanvas.width !== width || offCanvas.height !== height) {
            offCanvas.width = width;
            offCanvas.height = height;
        }
        
        const offCtx = offCanvas.getContext('2d', { alpha: false });

        if (offCtx) {
            offCtx.drawImage(video, 0, 0, width, height);
            // Lower quality and smaller dimension to save resources
            const base64Image = offCanvas.toDataURL('image/jpeg', 0.5);
            videoWsRef.current.send(base64Image);
        }
    };

    // 4. Draw AI Detections
    const drawOverlays = (data: { boxes?: AlertBox[], activities?: Activity[], emotions?: Emotion[] }) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-width, 0);

        const { boxes, activities, emotions } = data;

        if (boxes && boxes.length > 0) {
            boxes.forEach(box => {
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 3;
                ctx.strokeRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);

                ctx.fillStyle = '#38bdf8';
                ctx.font = '16px Inter';
                const labelText = `${box.label} (${Math.round(box.confidence * 100)}%)`;
                const textWidth = ctx.measureText(labelText).width;
                ctx.fillRect(box.x1, box.y1 - 25, textWidth + 10, 25);

                ctx.fillStyle = '#0f172a';
                ctx.fillText(labelText, box.x1 + 5, box.y1 - 7);
            });
        }

        ctx.restore();
        ctx.save();

        if (activities && activities.length > 0) {
            let yOffset = 30;
            activities.forEach(act => {
                ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
                ctx.fillRect(10, yOffset - 20, 250, 30);
                ctx.fillStyle = act.label === 'normal' ? '#10b981' : '#ef4444';
                ctx.font = '16px Inter';
                ctx.fillText(`Action: ${act.label} (${Math.round(act.confidence * 100)}%)`, 20, yOffset);
                yOffset += 40;
            });
        }

        if (emotions && emotions.length > 0) {
            let yOffset = 30;
            emotions.forEach(emo => {
                const emap: Record<string, string> = { 'neutral': '😐', 'happy': '😄', 'sad': '😢', 'angry': '😠', 'surprise': '😲', 'fear': '😨' };
                ctx.font = '24px Arial';
                ctx.fillText(emap[emo.label] || '🤔', width - 40, yOffset);
                yOffset += 30;
            });
        }

        ctx.restore();
    };

    // 5. System Alerts & Spring Boot Automation
    const checkAlerts = (events: Activity[]) => {
        events.forEach(event => {
            if (event.confidence >= ALERT_THRESHOLD && HIGH_SEVERITY_EVENTS.includes(event.label.toLowerCase())) {
                const eventName = event.label;
                setAlerts(prev => {
                    if (!prev.includes(eventName)) {
                        setTimeout(() => {
                            setAlerts(current => current.filter(a => a !== eventName));
                        }, 3500);
                        return [...prev, eventName];
                    }
                    return prev;
                });
                triggerSpringBootBackend(eventName, event.confidence);
                if (onDetection) {
                    onDetection(eventName, event.confidence);
                }
            }
        });
    };

    const triggerSpringBootBackend = (eventName: string, confidence: number) => {
        const now = Date.now();
        if (!alertHistory.current[eventName] || (now - alertHistory.current[eventName] > ALERT_COOLDOWN_MS)) {
            alertHistory.current[eventName] = now;
            console.log(`Sending automated emergency to Database: ${eventName}`);
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
            fetch(`${apiBase}/complaints/auto-detect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventName: eventName,
                    confidence: confidence,
                    source: "camera_audio"
                })
            })
                .then(response => {
                    if (!response.ok) console.error('Failed Spring Boot auto-detect', response.status);
                    else console.log('Successfully recorded AI Emergency in Database.');
                })
                .catch(err => console.error('Connection refused to Spring Boot UI:', err));
        }
    };

    return (
        <div style={{ position: 'relative', width, height, borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', border: '1px solid #333' }}>
            <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', zIndex: 10 }}>
                {error ? <span style={{ color: '#ef4444' }}>{error}</span> : <span style={{ color: '#10b981' }}>{status}</span>}
            </div>
            <video
                ref={videoRef}
                width={width}
                height={height}
                muted
                playsInline
                style={{ position: 'absolute', top: 0, left: 0, transform: 'scaleX(-1)' }}
            />
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{ position: 'absolute', top: 0, left: 0, zIndex: 5, pointerEvents: 'none' }}
            />
            <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 20, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {alerts.map(a => (
                    <div key={a} style={{ background: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', border: '1px solid #f87171', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                        ⚠️ EMERGENCY: {a.toUpperCase()} DETECTED!
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CameraDetection;
