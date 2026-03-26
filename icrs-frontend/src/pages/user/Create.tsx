import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Chip,
  LinearProgress, Alert, CircularProgress, IconButton, Tooltip,
} from '@mui/material';
import {
  SendOutlined, MicOutlined, MicOffOutlined, VideocamOutlined,
  VideocamOffOutlined, AutoAwesomeOutlined, StopOutlined,
  WarningAmberOutlined, CheckCircleOutline,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { complaintsApi } from '../../api';
import CameraDetection from '../../components/CameraDetection';
import type { UrgencyLevel } from '../../types';

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface SpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  onresult: (event: any) => void; onend: () => void;
  start: () => void; stop: () => void;
}
interface SpeechRecognitionEvent { results: { [key: number]: { [key: number]: { transcript: string } } } & { length: number } & Iterable<any>; }

// ─── NLP Rules ────────────────────────────────────────────────────────────────
const NLP_RULES = [
  { kw: ['fire', 'flame', 'burn', 'smoke', 'blaze', 'ignite', 'explosion'], score: 98, dept: 2, urgency: 'CRITICAL' as UrgencyLevel },
  { kw: ['burst pipe', 'burst', 'flood', 'overflow', 'serious leak', 'drowning'], score: 92, dept: 3, urgency: 'CRITICAL' as UrgencyLevel },
  { kw: ['electrocute', 'shock', 'sparks', 'short circuit', 'power outage'], score: 88, dept: 2, urgency: 'CRITICAL' as UrgencyLevel },
  { kw: ['leak', 'pipe', 'water', 'drain', 'sewage', 'plumb', 'damp'], score: 68, dept: 3, urgency: 'HIGH' as UrgencyLevel },
  { kw: ['electric', 'power', 'wiring', 'fuse', 'voltage', 'circuit'], score: 62, dept: 2, urgency: 'HIGH' as UrgencyLevel },
  { kw: ['network', 'wifi', 'internet', 'connection', 'server', 'it'], score: 55, dept: 1, urgency: 'MEDIUM' as UrgencyLevel },
  { kw: ['broken', 'damage', 'urgent', 'critical', 'fail', 'not working', 'stuck'], score: 45, dept: null, urgency: 'MEDIUM' as UrgencyLevel },
  { kw: ['slow', 'delay', 'concern', 'request'], score: 20, dept: null, urgency: 'LOW' as UrgencyLevel },
];

const EMERGENCY_KEYWORDS = ['fire', 'flame', 'burn', 'flood', 'burst pipe', 'electrocute', 'smoke', 'explosion', 'drowning'];

const analyzeText = (text: string) => {
  const t = text.toLowerCase();
  let best = { score: 0, urgency: 'LOW' as UrgencyLevel, dept: null as number | null, hits: [] as string[] };
  NLP_RULES.forEach(r => {
    r.kw.forEach(k => {
      if (t.includes(k) && r.score > best.score) {
        best = { score: r.score, urgency: r.urgency, dept: r.dept, hits: [...best.hits, k] };
      }
    });
  });
  best.hits = [...new Set(best.hits)].slice(0, 5);
  return best;
};

const urgColor = (u: UrgencyLevel) =>
  u === 'CRITICAL' ? '#ef4444' : u === 'HIGH' ? '#f97316' : u === 'MEDIUM' ? '#f59e0b' : '#10b981';

// ─── VOICE RECOGNITION HOOK ──────────────────────────────────────────────────
const useSpeechRecognition = () => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const recogRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      setSupported(true);
      const recog = new SpeechRec();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US';
      recog.onresult = (e: any) => {
        const t = Array.from(e.results).map((r: any) => r[0].transcript).join(' ');
        setTranscript(t);
      };
      recog.onend = () => setListening(false);
      recogRef.current = recog;
    }
  }, []);

  const start = () => {
    setTranscript('');
    recogRef.current?.start();
    setListening(true);
  };

  const stop = () => {
    recogRef.current?.stop();
    setListening(false);
  };

  return { listening, transcript, supported, start, stop };
};

// ─── MAIN CREATE PAGE ─────────────────────────────────────────────────────────
const UserCreate: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [nlp, setNlp] = useState(analyzeText(''));
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [streaming, setStreaming] = useState(false);
  const speech = useSpeechRecognition();

  const handleDetection = useCallback((label: string, confidence: number) => {
    if (confidence > 0.8) {
      setTitle(prev => !prev ? `EMERGENCY: ${label.toUpperCase()} Detected` : prev);
      setDesc(prev => !prev ? `Automatic AI detection indicates a high-severity event: ${label}. Immediate assistance may be required.` : prev);
    }
  }, []);

  // Update desc from voice transcript
  useEffect(() => {
    if (speech.transcript) setDesc(speech.transcript);
  }, [speech.transcript]);

  // Re-run NLP on any text change
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setNlp(analyzeText(title + ' ' + desc)), 200);
  }, [title, desc]);

  // Check if typed text has emergency keywords
  const isEmergency = EMERGENCY_KEYWORDS.some(k => (title + desc).toLowerCase().includes(k));
  const uc = urgColor(nlp.urgency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) return;
    setSubmitting(true); setErr('');
    try {
      console.log('Submitting complaint:', { title, description: desc, priority: nlp.urgency, departmentId: nlp.dept });
      await complaintsApi.create({ title, description: desc, priority: nlp.urgency, departmentId: nlp.dept });
      setDone(true);
      setTimeout(() => navigate('/user/complaints'), 2500);
    } catch (err: any) {
      console.error('Submission error:', err);
      setErr(`Failed to submit: ${err.response?.data?.message || err.message}`);
    }
    finally { setSubmitting(false); }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 800 }}>
          Register Complaint
        </Typography>
        <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mt: 0.3 }}>
          Use the form, your voice, or camera to auto-detect and submit a complaint
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* ── LEFT: Form ── */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
            {/* Top bar */}
            <Box sx={{
              px: 3, py: 2,
              background: done ? 'rgba(16,185,129,0.08)' : (isEmergency ? 'rgba(239,68,68,0.08)' : 'rgba(99,102,241,0.08)'),
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 1.5,
            }}>
              {isEmergency
                ? <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}>
                  <WarningAmberOutlined sx={{ color: '#ef4444', fontSize: 20 }} />
                </motion.div>
                : <AutoAwesomeOutlined sx={{ color: '#818cf8', fontSize: 20 }} />
              }
              <Typography sx={{
                fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: '0.95rem',
                color: isEmergency ? '#ef4444' : 'inherit'
              }}>
                {isEmergency ? '⚠️ EMERGENCY DETECTED — Submitting with HIGH PRIORITY' : 'Complaint Form — AI Urgency Detection'}
              </Typography>
            </Box>

            <Box sx={{ p: 3 }}>
              {done && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <Alert severity="success" icon={<CheckCircleOutline />} sx={{ mb: 2, borderRadius: 2 }}>
                    Complaint submitted! AI has routed it automatically. Redirecting…
                  </Alert>
                </motion.div>
              )}
              {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

              {/* Voice controls */}
              {speech.supported && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1.5, borderRadius: 2, background: speech.listening ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${speech.listening ? '#ef444440' : 'rgba(255,255,255,0.08)'}` }}>
                  <Tooltip title={speech.listening ? 'Stop recording' : 'Start voice recording'}>
                    <IconButton size="small" onClick={speech.listening ? speech.stop : speech.start}
                      sx={{ color: speech.listening ? '#ef4444' : '#818cf8', background: speech.listening ? '#ef444415' : '#818cf815' }}>
                      {speech.listening ? <StopOutlined /> : <MicOutlined />}
                    </IconButton>
                  </Tooltip>
                  {speech.listening && (
                    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                      <Typography sx={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>🔴 Listening… speak now</Typography>
                    </motion.div>
                  )}
                  {!speech.listening && <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>Click mic to use voice input</Typography>}
                </Box>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Complaint Title" fullWidth required value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Brief summary of the issue"
                  sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '& .Mui-focused fieldset': { borderColor: '#6366f1 !important' } }}
                />
                <TextField label="Description" fullWidth required multiline rows={5} value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="Describe the issue in detail. You can also use voice input above."
                  sx={{ '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '& .Mui-focused fieldset': { borderColor: '#6366f1 !important' } }}
                />

                {/* NLP Preview */}
                <AnimatePresence>
                  {(title + desc).trim().length > 4 && !done && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <Box sx={{ p: 2, borderRadius: 2.5, background: `${uc}08`, border: `1px solid ${uc}25` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography sx={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Urgency Analysis</Typography>
                          <Chip size="small" label={nlp.urgency} sx={{ background: `${uc}22`, color: uc, fontWeight: 800, fontSize: '0.65rem', border: `1px solid ${uc}40` }} />
                        </Box>
                        <LinearProgress variant="determinate" value={nlp.score}
                          sx={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', mb: 1.2, '& .MuiLinearProgress-bar': { background: uc } }} />
                        {nlp.hits.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                            {nlp.hits.map(k => (
                              <motion.span key={k} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <Chip size="small" label={k} sx={{ background: `${uc}18`, color: uc, fontSize: '0.6rem', height: 18, fontWeight: 600 }} />
                              </motion.span>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit" variant="contained" fullWidth
                  disabled={submitting || !title.trim() || !desc.trim() || done}
                  startIcon={submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SendOutlined />}
                  sx={{
                    py: 1.5, fontWeight: 700, borderRadius: 2,
                    background: isEmergency
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    '&:hover': {
                      background: isEmergency
                        ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                        : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    },
                  }}
                >
                  {submitting ? 'AI Processing…' : isEmergency ? '⚠️ Submit Emergency Complaint' : 'Submit with AI Routing'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* ── RIGHT: Camera + Controls ── */}
        <Grid item xs={12} md={5}>
          {/* Camera Detection */}
          <Paper sx={{ borderRadius: 4, overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <VideocamOutlined sx={{ color: streaming ? '#10b981' : '#818cf8', fontSize: 18 }} />
              <Typography sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>
                Camera Auto-Detection
              </Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              <>
                {/* Video Preview */}
                <Box sx={{
                  position: 'relative', borderRadius: 3, overflow: 'hidden',
                  background: '#0f172a', mb: 2,
                  border: `2px solid ${streaming ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'border-color 0.3s',
                  minHeight: streaming ? 200 : 150,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {streaming ? (
                    <CameraDetection onDetection={handleDetection} width={400} height={300} />
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <VideocamOffOutlined sx={{ fontSize: 32, color: '#334155' }} />
                      <Typography sx={{ fontSize: '0.75rem', color: '#475569' }}>Camera inactive</Typography>
                    </Box>
                  )}
                </Box>

                <Button
                  fullWidth variant={streaming ? 'outlined' : 'contained'}
                  onClick={() => setStreaming(!streaming)}
                  startIcon={streaming ? <StopOutlined /> : <VideocamOutlined />}
                  color={streaming ? 'error' : 'primary'}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  {streaming ? 'Stop AI Detection' : 'Start AI Camera Detection'}
                </Button>
                {streaming && (
                  <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mt: 1.2, textAlign: 'center' }}>
                    Connected to Real-time AI (YOLOv8 + Emotion Analysis)
                  </Typography>
                )}
              </>
            </Box>
          </Paper>

          {/* Quick Tips */}
          <Paper sx={{ p: 2.5, borderRadius: 4 }}>
            <Typography sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: '0.85rem', mb: 1.5 }}>
              AI Detection Tips
            </Typography>
            {[
              { emoji: '🎤', tip: 'Say "fire", "flood", or "burst pipe" — AI detects urgency instantly' },
              { emoji: '📹', tip: 'Point camera at scene — detects fire-like red/orange heat patterns' },
              { emoji: '⚡', tip: 'Keywords like "electric shock" or "smoke" trigger CRITICAL urgency' },
              { emoji: '🤖', tip: 'AI auto-routes your complaint to the right department' },
            ].map(t => (
              <Box key={t.tip} sx={{ display: 'flex', gap: 1.2, mb: 1.2 }}>
                <Typography sx={{ fontSize: '1rem' }}>{t.emoji}</Typography>
                <Typography sx={{ fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.5 }}>{t.tip}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserCreate;
