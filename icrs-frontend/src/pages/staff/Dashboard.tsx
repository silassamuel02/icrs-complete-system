import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Button, TextField,
  Avatar, Divider, IconButton, Collapse, LinearProgress, CircularProgress, Stack
} from '@mui/material';
import {
  AssignmentOutlined,
  CheckCircleOutline,
  HistoryOutlined,
  PictureAsPdfOutlined,
  PriorityHighOutlined,
  BoltOutlined,
  TimerOutlined
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip, Legend } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { complaintsApi } from '../../api';
import type { Complaint, ComplaintStatus } from '../../types';
import MetricCard from '../../components/dashboard/MetricCard';
import StatusChip from '../../components/dashboard/StatusChip';
import ChartWrapper from '../../components/dashboard/ChartWrapper';

const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [response, setResponse] = useState('');
  const [solution, setSolution] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const r = await complaintsApi.getAll();
      const deptName = user?.department && typeof user.department === 'object' ? user.department.departmentName : '';
      const filtered = r.data.filter((c: Complaint) => {
        const matchesDept = !deptName ||
          (c.assignedStaffName && c.assignedStaffName.includes(user?.name || '')) ||
          (c.suggestedDepartment && c.suggestedDepartment.toLowerCase().includes(deptName.toLowerCase()));
        return matchesDept;
      });
      setComplaints(filtered);
    } catch { }
    finally { setLoading(false); }
  };

  const handleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      const c = complaints.find((comp: Complaint) => comp.id === id);
      setResponse(c?.response || '');
      setSolution(c?.solution || '');
    }
  };

  const handleSubmitResolution = async (id: string, status: ComplaintStatus) => {
    setSubmitting(true);
    try {
      await complaintsApi.submitResponse(id, { response, solution, status });
      await fetchComplaints();
      setExpandedId(null);
    } catch {
      alert('Failed to update case.');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    assigned: complaints.filter(c => c.status === 'ASSIGNED').length,
    highPriority: complaints.filter(c => ['CRITICAL', 'HIGH'].includes(c.urgencyLevel)).length,
    resolvedToday: complaints.filter(c => c.status === 'RESOLVED' && dayjs(c.createdAt).isSame(dayjs(), 'day')).length,
    escalated: complaints.filter(c => c.status === 'ESCALATED').length,
  };

  const pieData = [
    { name: 'Critical', value: complaints.filter(c => c.urgencyLevel === 'CRITICAL').length, color: '#ef4444' },
    { name: 'High', value: complaints.filter(c => c.urgencyLevel === 'HIGH').length, color: '#f97316' },
    { name: 'Medium', value: complaints.filter(c => c.urgencyLevel === 'MEDIUM').length, color: '#f59e0b' },
    { name: 'Low', value: complaints.filter(c => c.urgencyLevel === 'LOW').length, color: '#10b981' },
  ];

  const dept = user?.department && typeof user.department === 'object' ? user.department.departmentName : 'All Departments';

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#fff' }}>Operational Console</Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8' }}>Managing <span style={{ color: '#f59e0b', fontWeight: 700 }}>{dept}</span> workflow.</Typography>
        </Box>
        <Avatar
          sx={{ width: 56, height: 56, border: '2px solid #f59e0b', boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)' }}
        >
          {user?.name?.charAt(0)}
        </Avatar>
      </Box>

      {/* TOP METRICS */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={3}>
          <MetricCard label="Assigned to Me" value={stats.assigned} icon={<AssignmentOutlined />} color="#f59e0b" />
        </Grid>
        <Grid item xs={12} sm={3}>
          <MetricCard label="High Priority" value={stats.highPriority} icon={<PriorityHighOutlined />} color="#ef4444" />
        </Grid>
        <Grid item xs={12} sm={3}>
          <MetricCard label="Escalated" value={stats.escalated} icon={<BoltOutlined />} color="#8b5cf6" />
        </Grid>
        <Grid item xs={12} sm={3}>
          <MetricCard label="Resolved Today" value={stats.resolvedToday} icon={<CheckCircleOutline />} color="#10b981" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* ANALYTICS SECTION */}
        <Grid item xs={12} md={4}>
          <ChartWrapper title="Priority Distribution" subtitle="System-predicted urgency levels" height={250}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <ChartTooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff' }} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </Grid>

        {/* OPERATIONS TABLE */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius: 4, background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography variant="h6" fontWeight="900" sx={{ color: '#fff' }}>Queue Management</Typography>
            </Box>

            {loading && <LinearProgress color="warning" />}

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {complaints.length === 0 && !loading ? (
                <Box sx={{ py: 10, textAlign: 'center' }}>
                  <Typography sx={{ color: '#64748b' }}>No active complaints in queue.</Typography>
                </Box>
              ) : (
                complaints.map((c, i) => (
                  <Box key={c.id} sx={{ borderBottom: i < complaints.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <Box
                      sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', '&:hover': { background: 'rgba(255,255,255,0.02)' } }}
                      onClick={() => handleExpand(c.id)}
                    >
                      <Box sx={{ width: 4, height: 40, bgcolor: c.urgencyLevel === 'CRITICAL' ? '#ef4444' : '#10b981', borderRadius: 2 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{c.title}</Typography>
                        <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                          <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>ID: #{c.id}</Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>{dayjs(c.createdAt).format('HH:mm, MMM DD')}</Typography>
                          {dayjs().diff(dayjs(c.createdAt), 'hour') > 24 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#ef4444' }}>
                              <TimerOutlined sx={{ fontSize: 12 }} />
                              <Typography sx={{ fontSize: '0.7rem', fontWeight: 800 }}>SLA BREACH</Typography>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                      <StatusChip status={c.status} />
                    </Box>

                    <Collapse in={expandedId === c.id}>
                      <Box sx={{ p: 4, bgcolor: 'rgba(0,0,0,0.1)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                          <Box sx={{ flex: 1, pr: 4 }}>
                            <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase' }}>Description</Typography>
                            <Typography sx={{ color: '#e2e8f0', mt: 1, fontSize: '0.9rem', lineHeight: 1.6 }}>{c.description}</Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            startIcon={<PictureAsPdfOutlined />}
                            onClick={() => window.open(`http://localhost:8080/api/complaints/${c.id}/pdf`, '_blank')}
                            sx={{ color: '#ef4444', borderColor: '#ef444440', borderRadius: 2 }}
                          >
                            Export Audit
                          </Button>
                        </Box>

                        <Divider sx={{ my: 3, opacity: 0.1 }} />

                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>Operational Analysis</Typography>
                            <TextField
                              fullWidth multiline rows={3} placeholder="Describe the issue analysis..."
                              value={response} onChange={e => setResponse(e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>Resolution Steps</Typography>
                            <TextField
                              fullWidth multiline rows={3} placeholder="List resolution steps taken..."
                              value={solution} onChange={e => setSolution(e.target.value)}
                            />
                          </Grid>
                        </Grid>

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                          <Button
                            variant="outlined"
                            startIcon={<HistoryOutlined />}
                            onClick={() => handleSubmitResolution(c.id, 'IN_REVIEW')}
                            sx={{ color: '#94a3b8', borderRadius: 2 }}
                          >
                            Set In-Progress
                          </Button>
                          <Button
                            variant="contained"
                            sx={{ bgcolor: '#10b981', color: '#fff', '&:hover': { bgcolor: '#059669' }, borderRadius: 2, px: 4 }}
                            onClick={() => handleSubmitResolution(c.id, 'RESOLVED')}
                            disabled={submitting}
                          >
                            {submitting ? 'Updating...' : 'Resolve Case'}
                          </Button>
                        </Box>
                      </Box>
                    </Collapse>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StaffDashboard;
