import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Chip, Button, LinearProgress,
  TextField, Collapse, CircularProgress, Alert, Grid, Avatar, Divider,
} from '@mui/material';
import {
  AutoAwesomeOutlined, CheckCircleOutlined, ExpandMoreOutlined,
  ExpandLessOutlined, SendOutlined, Build, AccessTimeOutlined,
  PriorityHighOutlined, PersonOutlined, LightbulbOutlined,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import { complaintsApi } from '../../api';
import type { Complaint, ComplaintStatus } from '../../types';
import { UrgencyChip } from '../../components/common/StatusChip';

const getSlaPercent = (createdAt: string) => {
  const h = (Date.now() - new Date(createdAt).getTime()) / 36e5;
  return Math.min(100, Math.round((h / 72) * 100));
};

const slaColor = (p: number) => p > 80 ? '#ff4757' : p > 50 ? '#ffa502' : '#2ed573';

const urgencyColor = (lvl: string) => {
  if (lvl === 'CRITICAL') return '#ff4757';
  if (lvl === 'HIGH') return '#ff6b35';
  if (lvl === 'MEDIUM') return '#ffa502';
  return '#2ed573';
};

// ─── AUTO-SUGGEST SOLUTIONS ───────────────────────────────────────────────────
const suggestSolution = (complaint: Complaint): string => {
  const text = (complaint.title + ' ' + complaint.description).toLowerCase();
  if (text.includes('leak') || text.includes('pipe') || text.includes('water'))
    return 'Shut off the water supply valve immediately. Inspect the pipe joint and apply repair clamp or replace the pipe section. Notify maintenance team for follow-up inspection.';
  if (text.includes('electric') || text.includes('power') || text.includes('wiring'))
    return 'Isolate the circuit from the main panel. Do not attempt electrical repairs without a licensed electrician. Schedule a qualified technician to inspect and repair the wiring.';
  if (text.includes('network') || text.includes('wifi') || text.includes('internet'))
    return 'Restart the network device. Check cable connections and run diagnostics. If the issue persists, escalate to IT infrastructure team for further investigation.';
  if (text.includes('fire') || text.includes('smoke') || text.includes('danger'))
    return 'Evacuate the area immediately. Activate fire alarm. Contact emergency services. Do not re-enter until cleared by authorities.';
  return 'Issue acknowledged and being investigated. Our team will assess the problem and provide a comprehensive resolution within 24-48 hours.';
};

// ─── CASE CARD ────────────────────────────────────────────────────────────────
interface CaseCardProps {
  complaint: Complaint;
  onResolved: (id: string, response: string, solution: string, status: ComplaintStatus) => void;
}

const CaseCard: React.FC<CaseCardProps> = ({ complaint: c, onResolved }) => {
  const [expanded, setExpanded] = useState(false);
  const [response, setResponse] = useState(c.response || '');
  const [solution, setSolution] = useState(c.solution || '');
  const [status, setStatus] = useState<ComplaintStatus>(c.status);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const uc = urgencyColor(c.urgencyLevel);
  const sla = getSlaPercent(c.createdAt);
  const sc = slaColor(sla);
  const isCritical = c.urgencyLevel === 'CRITICAL' || c.urgencyLevel === 'HIGH';
  const isResolved = c.status === 'RESOLVED';

  const handleAutoSuggest = () => {
    setSolution(suggestSolution(c));
  };

  const handleSubmit = async () => {
    if (!response.trim()) { setError('Please write a response before submitting.'); return; }
    setError('');
    setSaving(true);
    try {
      await complaintsApi.submitResponse(c.id, { response, solution, status });
      setSaved(true);
      onResolved(c.id, response, solution, status);
      setTimeout(() => setSaved(false), 4000);
    } catch {
      // Fallback to update if respond endpoint not available
      try {
        await complaintsApi.update(c.id, { status, response, solution });
        setSaved(true);
        onResolved(c.id, response, solution, status);
        setTimeout(() => setSaved(false), 4000);
      } catch {
        setError('Failed to submit response. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Paper sx={{
        borderRadius: 3, overflow: 'hidden', mb: 2.5,
        border: `1px solid ${isCritical ? `${uc}35` : 'rgba(255,255,255,0.06)'}`,
        position: 'relative',
        opacity: isResolved ? 0.75 : 1,
      }}>
        {/* Top urgency line */}
        <motion.div
          animate={{ background: uc }}
          style={{ height: 3, width: '100%' }}
          transition={{ duration: 0.4 }}
        />

        <Box sx={{ p: 2.5 }}>
          {/* Header Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.title}</Typography>
                {isCritical && (
                  <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 1.3 }}>
                    <Chip size="small" label="URGENT" sx={{ background: `${uc}25`, color: uc, fontSize: '0.6rem', fontWeight: 800, height: 18 }} />
                  </motion.div>
                )}
                <Chip
                  icon={<AutoAwesomeOutlined sx={{ fontSize: 11 }} />}
                  label="AI Auto-Assigned"
                  size="small"
                  sx={{ background: '#00d4aa12', color: '#00d4aa', fontSize: '0.6rem', height: 18 }}
                />
                {isResolved && (
                  <Chip icon={<CheckCircleOutlined sx={{ fontSize: 11 }} />} label="Resolved" size="small"
                    sx={{ background: '#2ed57322', color: '#2ed573', fontSize: '0.6rem', height: 18 }} />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography sx={{ color: '#8b92a5', fontSize: '0.72rem' }}>
                  <PersonOutlined sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.3 }} />
                  From: {c.createdBy || 'User'}
                </Typography>
                <Typography sx={{ color: '#8b92a5', fontSize: '0.72rem' }}>
                  <AccessTimeOutlined sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.3 }} />
                  {dayjs(c.createdAt).format('DD MMM YYYY, HH:mm')}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
              <UrgencyChip level={c.urgencyLevel} />
              <Button
                size="small"
                onClick={() => setExpanded(!expanded)}
                endIcon={expanded ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
                sx={{ color: '#8b92a5', fontSize: '0.72rem', border: '1px solid rgba(255,255,255,0.1)', px: 1.5 }}
              >
                {expanded ? 'Close' : 'Open Case'}
              </Button>
            </Box>
          </Box>

          {/* Description */}
          <Typography sx={{ fontSize: '0.84rem', color: '#c0c6d4', mb: 2, lineHeight: 1.6 }}>
            {c.description.length > 160 ? c.description.slice(0, 160) + '…' : c.description}
          </Typography>

          {/* SLA Progress */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: '0.72rem', color: '#8b92a5', whiteSpace: 'nowrap' }}>SLA (72h):</Typography>
            <LinearProgress
              variant="determinate" value={sla}
              sx={{
                flex: 1, height: 6, borderRadius: 3,
                background: 'rgba(255,255,255,0.07)',
                '& .MuiLinearProgress-bar': { background: sc },
              }}
            />
            <Typography sx={{ fontSize: '0.72rem', color: sc, minWidth: 32, fontWeight: 700 }}>{sla}%</Typography>
          </Box>
        </Box>

        {/* Expandable — Response Form */}
        <Collapse in={expanded}>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={2.5}>
              {/* Response */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SendOutlined sx={{ fontSize: 14, color: '#1e90ff' }} />
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e90ff' }}>Your Response to User</Typography>
                </Box>
                <TextField
                  fullWidth multiline rows={4}
                  placeholder="Write your acknowledgment, update, or message to the user…"
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                    '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#1e90ff' },
                  }}
                />
              </Grid>

              {/* Solution */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Build sx={{ fontSize: 14, color: '#00d4aa' }} />
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#00d4aa' }}>Resolution / Solution</Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<LightbulbOutlined sx={{ fontSize: 13 }} />}
                    onClick={handleAutoSuggest}
                    sx={{ fontSize: '0.68rem', color: '#ffa502', border: '1px solid #ffa50230', px: 1 }}
                  >
                    AI Suggest
                  </Button>
                </Box>
                <TextField
                  fullWidth multiline rows={4}
                  placeholder="Describe the resolution steps or solution taken…"
                  value={solution}
                  onChange={e => setSolution(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                    '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#00d4aa' },
                  }}
                />
              </Grid>

              {/* Status + Submit */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: '#8b92a5' }}>Set Status:</Typography>
                  {(['IN_REVIEW', 'ESCALATED', 'RESOLVED'] as ComplaintStatus[]).map(s => (
                    <Chip
                      key={s}
                      label={s.replace('_', ' ')}
                      onClick={() => setStatus(s)}
                      sx={{
                        cursor: 'pointer',
                        background: status === s ? (s === 'RESOLVED' ? '#2ed57322' : s === 'ESCALATED' ? '#ff475722' : '#1e90ff22') : 'rgba(255,255,255,0.05)',
                        color: status === s ? (s === 'RESOLVED' ? '#2ed573' : s === 'ESCALATED' ? '#ff4757' : '#1e90ff') : '#8b92a5',
                        border: `1px solid ${status === s ? (s === 'RESOLVED' ? '#2ed57350' : s === 'ESCALATED' ? '#ff475750' : '#1e90ff50') : 'transparent'}`,
                        fontWeight: status === s ? 700 : 400,
                        transition: 'all 0.2s',
                      }}
                    />
                  ))}
                  <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                    {saved && (
                      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                        <Chip icon={<CheckCircleOutlined />} label="Submitted!" sx={{ background: '#2ed57322', color: '#2ed573' }} />
                      </motion.div>
                    )}
                    {error && <Typography sx={{ fontSize: '0.75rem', color: '#ff4757' }}>{error}</Typography>}
                    <Button
                      variant="contained"
                      disabled={saving || !response.trim()}
                      onClick={handleSubmit}
                      startIcon={saving ? <CircularProgress size={16} sx={{ color: '#0a0c10' }} /> : <SendOutlined sx={{ fontSize: 15 }} />}
                      sx={{ background: '#00d4aa', color: '#0a0c10', fontWeight: 700, '&:hover': { background: '#00b894' } }}
                    >
                      {saving ? 'Submitting…' : 'Submit Response'}
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>
    </motion.div>
  );
};

// ─── STAFF ASSIGNED PAGE ─────────────────────────────────────────────────────
const StaffAssigned: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'URGENT' | 'PENDING' | 'RESOLVED'>('ALL');

  useEffect(() => {
    complaintsApi.getAssigned()
      .then(r => setComplaints(r.data || []))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  }, []);

  const handleResolved = (id: string, response: string, solution: string, status: ComplaintStatus) =>
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, response, solution, status } : c));

  const filtered = complaints.filter(c => {
    if (filter === 'URGENT') return c.urgencyLevel === 'CRITICAL' || c.urgencyLevel === 'HIGH';
    if (filter === 'PENDING') return c.status !== 'RESOLVED';
    if (filter === 'RESOLVED') return c.status === 'RESOLVED';
    return true;
  });

  const pending = complaints.filter(c => c.status !== 'RESOLVED').length;
  const critical = complaints.filter(c => c.urgencyLevel === 'CRITICAL' || c.urgencyLevel === 'HIGH').length;
  const resolved = complaints.filter(c => c.status === 'RESOLVED').length;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 700 }}>
          Assigned Cases
        </Typography>
        <Typography sx={{ color: '#8b92a5', fontSize: '0.875rem', mt: 0.3 }}>
          AI-assigned complaints — respond, resolve, and update each case
        </Typography>
      </Box>

      {/* Quick stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total', val: complaints.length, color: '#1e90ff' },
          { label: 'Pending', val: pending, color: '#ffa502' },
          { label: 'Urgent', val: critical, color: '#ff4757' },
          { label: 'Resolved', val: resolved, color: '#2ed573' },
        ].map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Paper sx={{ p: 2, borderRadius: 2.5, textAlign: 'center', border: `1px solid ${s.color}20` }}>
              <Typography sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: '1.8rem', color: s.color }}>{s.val}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#8b92a5' }}>{s.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filter Chips */}
      <Box sx={{ display: 'flex', gap: 1.2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: 'All Cases', color: '#8b92a5' },
          { key: 'URGENT', label: '🔴 Urgent', color: '#ff4757' },
          { key: 'PENDING', label: '⏳ Pending', color: '#ffa502' },
          { key: 'RESOLVED', label: '✅ Resolved', color: '#2ed573' },
        ].map(f => (
          <Chip
            key={f.key}
            label={f.label}
            onClick={() => setFilter(f.key as any)}
            sx={{
              cursor: 'pointer',
              background: filter === f.key ? `${f.color}20` : 'rgba(255,255,255,0.05)',
              color: filter === f.key ? f.color : '#8b92a5',
              border: `1px solid ${filter === f.key ? `${f.color}50` : 'transparent'}`,
              fontWeight: filter === f.key ? 700 : 400,
              transition: 'all 0.2s',
            }}
          />
        ))}
        <Chip
          icon={<AutoAwesomeOutlined sx={{ fontSize: 13 }} />}
          label="AI Sorted by Priority"
          sx={{ background: '#00d4aa12', color: '#00d4aa', border: '1px solid #00d4aa20', ml: 'auto' }}
        />
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 && !loading ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
              <AutoAwesomeOutlined sx={{ fontSize: 48, color: '#8b92a5', mb: 2 }} />
              <Typography sx={{ color: '#8b92a5' }}>No cases in this category.</Typography>
            </Paper>
          </motion.div>
        ) : (
          // Sort: CRITICAL first, then HIGH, then MEDIUM, then LOW
          [...filtered]
            .sort((a, b) => {
              const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
              return (order[a.urgencyLevel] ?? 4) - (order[b.urgencyLevel] ?? 4);
            })
            .map(c => (
              <CaseCard key={c.id} complaint={c} onResolved={handleResolved} />
            ))
        )}
      </AnimatePresence>
    </Box>
  );
};

export default StaffAssigned;
