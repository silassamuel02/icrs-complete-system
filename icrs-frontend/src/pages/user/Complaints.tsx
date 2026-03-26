import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Button, LinearProgress,
  TextField, Divider, Collapse, CircularProgress, Alert,
} from '@mui/material';
import {
  Stepper, Step, StepLabel, StepConnector, stepConnectorClasses, styled,
} from '@mui/material';
import {
  CheckCircleOutlined, EditOutlined, ExpandMoreOutlined,
  ExpandLessOutlined, PersonOutlined, AutoAwesomeOutlined,
  HourglassEmptyOutlined, WarningAmberOutlined,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import { complaintsApi } from '../../api';
import type { Complaint, ComplaintStatus } from '../../types';
import { UrgencyChip } from '../../components/common/StatusChip';

// ── Custom Stepper ────────────────────────────────────────────────────────────
const QontoConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 10, left: 'calc(-50% + 16px)', right: 'calc(50% + 16px)' },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: { borderColor: '#00d4aa' },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: { borderColor: '#00d4aa' },
  [`& .${stepConnectorClasses.line}`]: { borderColor: 'rgba(255,255,255,0.1)', borderTopWidth: 3, borderRadius: 1 },
}));

const QontoIconRoot = styled('div')<{ ownerState: { active?: boolean } }>(({ ownerState }) => ({
  color: 'rgba(255,255,255,0.25)', display: 'flex', height: 22, alignItems: 'center',
  ...(ownerState.active && { color: '#00d4aa' }),
  '& .circle': { width: 8, height: 8, borderRadius: '50%', backgroundColor: 'currentColor' },
}));

function QontoIcon(props: any) {
  const { active, completed, className } = props;
  return (
    <QontoIconRoot ownerState={{ active }} className={className}>
      {completed ? <CheckCircleOutlined sx={{ fontSize: 18, color: '#00d4aa' }} /> : <div className="circle" />}
    </QontoIconRoot>
  );
}

const STEPS = ['Submitted', 'Assigned', 'Processing', 'Resolved'];

const getStep = (status: ComplaintStatus) => {
  if (status === 'SUBMITTED') return 0;
  if (status === 'ASSIGNED') return 1;
  if (status === 'IN_REVIEW' || status === 'ESCALATED') return 2;
  if (status === 'RESOLVED') return 3;
  return 0;
};

const urgencyColor = (lvl: string) => {
  if (lvl === 'CRITICAL') return '#ff4757';
  if (lvl === 'HIGH') return '#ff6b35';
  if (lvl === 'MEDIUM') return '#ffa502';
  return '#2ed573';
};

// ─── COMPLAINT CARD ───────────────────────────────────────────────────────────
interface CardProps {
  complaint: Complaint;
  onUpdated: (c: Complaint) => void;
}

const ComplaintCard: React.FC<CardProps> = ({ complaint: c, onUpdated }) => {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [addInfo, setAddInfo] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const step = getStep(c.status);
  const uc = urgencyColor(c.urgencyLevel);
  const isCritical = c.urgencyLevel === 'CRITICAL' || c.urgencyLevel === 'HIGH';

  const handleUpdate = async () => {
    if (!addInfo.trim()) return;
    setSaving(true);
    try {
      await complaintsApi.update(c.id, { description: c.description + '\n\n[Update] ' + addInfo });
      onUpdated({ ...c, description: c.description + '\n\n[Update] ' + addInfo });
      setSaved(true);
      setEditMode(false);
      setAddInfo('');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Paper sx={{
        borderRadius: 3, overflow: 'hidden', mb: 2.5,
        border: `1px solid ${isCritical ? `${uc}40` : 'rgba(255,255,255,0.06)'}`,
        position: 'relative',
      }}>
        {/* Left urgency bar */}
        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: uc, borderRadius: '3px 0 0 3px' }} />

        <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>{c.title}</Typography>
                {isCritical && (
                  <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 1.4 }}>
                    <Chip size="small" label="URGENT" sx={{ background: `${uc}25`, color: uc, fontSize: '0.62rem', fontWeight: 800, height: 20 }} />
                  </motion.div>
                )}
                <Chip
                  icon={<AutoAwesomeOutlined sx={{ fontSize: 12, color: '#00d4aa' }} />}
                  label="AI Tracked"
                  size="small"
                  sx={{ background: '#00d4aa15', color: '#00d4aa', fontSize: '0.62rem', height: 20 }}
                />
              </Box>
              <Typography sx={{ color: '#8b92a5', fontSize: '0.75rem' }}>
                ID: {c.id} · Submitted {dayjs(c.createdAt).format('DD MMM YYYY')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <UrgencyChip level={c.urgencyLevel} />
              {c.riskScore > 0 && (
                <Chip size="small" label={`Risk ${c.riskScore}%`}
                  sx={{ background: c.riskScore >= 70 ? '#ff475722' : 'rgba(255,255,255,0.06)', color: c.riskScore >= 70 ? '#ff4757' : '#8b92a5', fontSize: '0.65rem' }} />
              )}
            </Box>
          </Box>

          <Typography sx={{ fontSize: '0.85rem', color: '#c0c6d4', mb: 2, lineHeight: 1.6 }}>
            {c.description.length > 140 ? c.description.slice(0, 140) + '…' : c.description}
          </Typography>

          {/* Tracking Stepper */}
          <Stepper alternativeLabel activeStep={step} connector={<QontoConnector />} sx={{ mb: 1.5 }}>
            {STEPS.map(label => (
              <Step key={label}>
                <StepLabel StepIconComponent={QontoIcon}>
                  <Typography sx={{ fontSize: '0.62rem', color: '#8b92a5' }}>{label}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Actions bar */}
        <Box sx={{ px: 3, py: 1, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small" startIcon={<EditOutlined sx={{ fontSize: 14 }} />}
              onClick={() => { setEditMode(!editMode); setExpanded(true); }}
              sx={{ fontSize: '0.75rem', color: '#00d4aa', borderColor: '#00d4aa30', border: '1px solid' }}
            >
              Update
            </Button>
            {(c.response || c.solution) && (
              <Button
                size="small" startIcon={expanded ? <ExpandLessOutlined sx={{ fontSize: 14 }} /> : <ExpandMoreOutlined sx={{ fontSize: 14 }} />}
                onClick={() => setExpanded(!expanded)}
                sx={{ fontSize: '0.75rem', color: '#1e90ff', borderColor: '#1e90ff30', border: '1px solid' }}
              >
                Staff Response
              </Button>
            )}
          </Box>
          <Button size="small" onClick={() => setExpanded(!expanded)}
            sx={{ fontSize: '0.75rem', color: '#8b92a5' }}>
            {expanded ? 'Show Less ↑' : 'Details ↓'}
          </Button>
        </Box>

        {/* Expandable section */}
        <Collapse in={expanded}>
          <Box sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
            {/* Staff assigned info */}
            {c.assignedTo && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1.2, borderRadius: 2, background: 'rgba(30,144,255,0.06)', border: '1px solid rgba(30,144,255,0.1)' }}>
                <PersonOutlined sx={{ fontSize: 16, color: '#1e90ff' }} />
                <Typography sx={{ fontSize: '0.78rem' }}>
                  Assigned to staff: <strong style={{ color: '#fff' }}>{c.assignedStaffName || c.assignedTo || 'Processing…'}</strong>
                </Typography>
              </Box>
            )}

            {/* Staff response */}
            {c.response && (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#8b92a5', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.8 }}>
                  Staff Response
                </Typography>
                <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.12)' }}>
                  <Typography sx={{ fontSize: '0.85rem', color: '#c0c6d4' }}>{c.response}</Typography>
                </Box>
              </Box>
            )}

            {/* Staff solution */}
            {c.solution && (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#8b92a5', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.8 }}>
                  Resolution
                </Typography>
                <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(46,213,115,0.06)', border: '1px solid rgba(46,213,115,0.12)', display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
                  <CheckCircleOutlined sx={{ fontSize: 16, color: '#2ed573', mt: 0.2 }} />
                  <Typography sx={{ fontSize: '0.85rem', color: '#c0c6d4' }}>{c.solution}</Typography>
                </Box>
              </Box>
            )}

            {/* Update form */}
            {editMode && (
              <Box>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />
                <Typography sx={{ fontSize: '0.78rem', color: '#8b92a5', mb: 1 }}>
                  Add additional information to your complaint:
                </Typography>
                {saved && <Alert severity="success" sx={{ mb: 1.5, py: 0.5 }}>Update submitted!</Alert>}
                <TextField
                  fullWidth multiline rows={3}
                  placeholder="Provide more details, updates, or any new information…"
                  value={addInfo}
                  onChange={e => setAddInfo(e.target.value)}
                  sx={{
                    mb: 1.5,
                    '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                    '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#00d4aa' },
                  }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" size="small" disabled={saving || !addInfo.trim()}
                    onClick={handleUpdate} sx={{ background: '#00d4aa', color: '#0a0c10', '&:hover': { background: '#00b894' } }}>
                    {saving ? <CircularProgress size={16} /> : 'Submit Update'}
                  </Button>
                  <Button size="small" onClick={() => setEditMode(false)}
                    sx={{ color: '#8b92a5', border: '1px solid rgba(255,255,255,0.12)' }}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>
    </motion.div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const UserComplaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'SUBMITTED' | 'IN_REVIEW' | 'RESOLVED'>('ALL');

  useEffect(() => {
    complaintsApi.getMy()
      .then(r => setComplaints(r.data || []))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdated = (updated: Complaint) =>
    setComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));

  const filtered = filter === 'ALL' ? complaints : complaints.filter(c => c.status === filter);

  const counts = {
    ALL: complaints.length,
    SUBMITTED: complaints.filter(c => c.status === 'SUBMITTED').length,
    IN_REVIEW: complaints.filter(c => c.status === 'IN_REVIEW').length,
    RESOLVED: complaints.filter(c => c.status === 'RESOLVED').length,
  };

  const filterTabs = [
    { key: 'ALL', label: 'All', icon: <HourglassEmptyOutlined sx={{ fontSize: 14 }} />, color: '#8b92a5' },
    { key: 'SUBMITTED', label: 'Submitted', icon: <HourglassEmptyOutlined sx={{ fontSize: 14 }} />, color: '#ffa502' },
    { key: 'IN_REVIEW', label: 'In Review', icon: <WarningAmberOutlined sx={{ fontSize: 14 }} />, color: '#ff6b35' },
    { key: 'RESOLVED', label: 'Resolved', icon: <CheckCircleOutlined sx={{ fontSize: 14 }} />, color: '#2ed573' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 700 }}>
          My Complaints
        </Typography>
        <Typography sx={{ color: '#8b92a5', fontSize: '0.875rem', mt: 0.3 }}>
          Track your complaints with AI-powered status monitoring
        </Typography>
      </Box>

      {/* Filter tabs */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {filterTabs.map(tab => (
          <Button
            key={tab.key}
            size="small"
            onClick={() => setFilter(tab.key as any)}
            startIcon={tab.icon}
            sx={{
              px: 2, py: 0.8, borderRadius: 99,
              background: filter === tab.key ? `${tab.color}22` : 'rgba(255,255,255,0.04)',
              color: filter === tab.key ? tab.color : '#8b92a5',
              border: `1px solid ${filter === tab.key ? `${tab.color}50` : 'rgba(255,255,255,0.08)'}`,
              fontWeight: filter === tab.key ? 700 : 400,
              transition: 'all 0.2s',
            }}
          >
            {tab.label} ({counts[tab.key as keyof typeof counts]})
          </Button>
        ))}
      </Box>

      {loading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 && !loading ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
              <AutoAwesomeOutlined sx={{ fontSize: 48, color: '#8b92a5', mb: 2 }} />
              <Typography sx={{ color: '#8b92a5' }}>No complaints in this category.</Typography>
            </Paper>
          </motion.div>
        ) : (
          filtered.map(c => (
            <ComplaintCard key={c.id} complaint={c} onUpdated={handleUpdated} />
          ))
        )}
      </AnimatePresence>
    </Box>
  );
};

export default UserComplaints;