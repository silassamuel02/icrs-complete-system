import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Divider, Button, Avatar, LinearProgress, Stack } from '@mui/material';
import {
  AssignmentOutlined,
  HourglassEmptyOutlined,
  WarningAmberOutlined,
  AutoGraphOutlined,
  PsychologyOutlined,
  TimelineOutlined,
  FactCheckOutlined,
  CheckCircleOutline,
  SendOutlined,
  AssignmentIndOutlined,
  BuildOutlined
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { complaintsApi } from '../../api';
import type { Complaint } from '../../types';
import MetricCard from '../../components/dashboard/MetricCard';
import StatusChip from '../../components/dashboard/StatusChip';
import DetailView from '../../components/dashboard/DetailView';
import dayjs from 'dayjs';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = () => {
    setLoading(true);
    complaintsApi.getMy()
      .then(r => setComplaints(r.data || []))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  };

  const total = complaints.length;
  const active = complaints.filter(c => !['RESOLVED', 'CLOSED'].includes(c.status)).length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED' && dayjs(c.createdAt).isSame(dayjs(), 'day')).length;

  const latestComplaint = complaints[0];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* HEADER SECTION */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#fff', mb: 0.5 }}>
            User Command Center
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8' }}>
            Monitor your complaint lifecycle and AI-driven insights.
          </Typography>
        </Box>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 800, display: 'block', mb: 0.5 }}>SYSTEM STATUS</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>AI Core Active</Typography>
          </Box>
        </Box>
      </Box>

      {/* TOP METRICS */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Total Complaints"
            value={total}
            icon={<AssignmentOutlined />}
            color="#6366f1"
            subtitle="Lifetime Submissions"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Active Cases"
            value={active}
            icon={<HourglassEmptyOutlined />}
            color="#f59e0b"
            subtitle="Pending Resolution"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            label="Resolved Today"
            value={resolvedCount}
            icon={<CheckCircleOutline />}
            color="#10b981"
            subtitle="Completed Successfully"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* LEFT COLUMN: AI INTELLIGENCE & LATEST TRACKING */}
        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            {/* AI INTELLIGENCE PANEL */}
            <Paper sx={{
              p: 3,
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: '#8b5cf6', boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)' }}>
                  <PsychologyOutlined />
                </Avatar>
                <Box>
                  <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>AI Insights Engine</Typography>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Real-time prediction & classification analysis</Typography>
                </Box>
              </Box>

              {latestComplaint ? (
                <Stack spacing={2.5}>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Predicted Category</Typography>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>{latestComplaint.suggestedDepartment || 'Analyzing...'}</Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1, p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Urgency Level</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Box sx={{
                          width: 10, height: 10, borderRadius: '50%',
                          bgcolor: latestComplaint.urgencyLevel === 'CRITICAL' ? '#ef4444' : '#10b981'
                        }} />
                        <Typography sx={{ color: '#fff', fontWeight: 700 }}>{latestComplaint.urgencyLevel || 'LOW'}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1, p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Risk Score</Typography>
                      <Typography sx={{ color: '#fff', fontWeight: 700, mt: 0.5 }}>{(latestComplaint.riskScore || 0).toFixed(2)}</Typography>
                    </Box>
                  </Box>
                </Stack>
              ) : (
                <Typography sx={{ color: '#64748b', textAlign: 'center', py: 2 }}>No active predictions available.</Typography>
              )}
            </Paper>

            {/* LIFECYCLE TIMELINE */}
            <Paper sx={{ p: 3, borderRadius: 4, background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <TimelineOutlined sx={{ color: '#6366f1' }} />
                <Typography sx={{ color: '#fff', fontWeight: 800 }}>Complaint Lifecycle</Typography>
              </Box>

              <Box sx={{ px: 2 }}>
                {[
                  { label: 'Submited', icon: <SendOutlined />, active: true },
                  { label: 'Assigned', icon: <AssignmentIndOutlined />, active: latestComplaint?.status !== 'SUBMITTED' },
                  { label: 'In Review', icon: <BuildOutlined />, active: ['IN_REVIEW', 'RESOLVED'].includes(latestComplaint?.status || '') },
                  { label: 'Resolved', icon: <CheckCircleOutline />, active: latestComplaint?.status === 'RESOLVED' }
                ].map((step, idx) => (
                  <Box key={step.label} sx={{ display: 'flex', gap: 3, mb: idx === 3 ? 0 : 3, position: 'relative' }}>
                    {idx < 3 && (
                      <Box sx={{
                        position: 'absolute', left: 20, top: 40, bottom: -20, width: 2,
                        bgcolor: step.active && [true, true, true, true][idx + 1] ? '#6366f1' : 'rgba(255,255,255,0.1)'
                      }} />
                    )}
                    <Avatar sx={{
                      width: 40, height: 40,
                      bgcolor: step.active ? '#6366f1' : 'rgba(255,255,255,0.05)',
                      color: step.active ? '#fff' : '#64748b',
                      border: step.active ? 'none' : '1px solid rgba(255,255,255,0.1)'
                    }}>
                      {step.icon}
                    </Avatar>
                    <Box sx={{ pt: 1 }}>
                      <Typography variant="body2" sx={{ color: step.active ? '#fff' : '#64748b', fontWeight: step.active ? 800 : 500 }}>
                        {step.label}
                      </Typography>
                      {step.active && (
                        <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8' }}>Verified System Event</Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Stack>
        </Grid>

        {/* RIGHT COLUMN: RECENT ACTIVITY TABLE */}
        <Grid item xs={12} md={7}>
          <Paper sx={{
            borderRadius: 4,
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(255,255,255,0.05)',
            overflow: 'hidden',
            height: '100%'
          }}>
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" fontWeight="900" sx={{ color: '#fff' }}>Recent Activity</Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Latest 10 complaints submitted by you.</Typography>
              </Box>
              <Button size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 2 }}>View All</Button>
            </Box>

            {loading && <LinearProgress sx={{ height: 2 }} />}

            <Box sx={{ p: 0 }}>
              {complaints.length === 0 && !loading ? (
                <Box sx={{ py: 10, textAlign: 'center' }}>
                  <FactCheckOutlined sx={{ fontSize: 64, color: 'rgba(255,255,255,0.05)', mb: 2 }} />
                  <Typography sx={{ color: '#64748b' }}>No complaint history found.</Typography>
                </Box>
              ) : (
                complaints.slice(0, 10).map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <Box
                      onClick={() => {
                        setSelectedComplaint(c);
                        setIsDetailOpen(true);
                      }}
                      sx={{
                        p: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        borderBottom: i < 9 && i < complaints.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                        '&:hover': { background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }
                      }}>
                      <Box sx={{
                        width: 48, height: 48, borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.03)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: c.urgencyLevel === 'CRITICAL' ? '#ef4444' : '#94a3b8',
                        border: `1px solid ${c.urgencyLevel === 'CRITICAL' ? '#ef444430' : 'transparent'}`
                      }}>
                        <AssignmentOutlined />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', mb: 0.5 }}>{c.title}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>#{c.id}</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>{dayjs(c.createdAt).format('MMM DD, YYYY')}</Typography>
                        </Box>
                      </Box>
                      <StatusChip status={c.status} />
                    </Box>
                  </motion.div>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      <DetailView
        complaint={selectedComplaint}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </Box>
  );
};

export default UserDashboard;
