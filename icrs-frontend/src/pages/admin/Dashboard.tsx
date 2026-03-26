import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Avatar, LinearProgress, Stack, Button } from '@mui/material';
import {
  PeopleAltOutlined,
  AssignmentTurnedInOutlined,
  LocalFireDepartmentOutlined,
  AdminPanelSettingsOutlined,
  MonitorHeartOutlined,
  CheckCircleOutline
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { complaintsApi, usersApi } from '../../api';
import type { Complaint, User } from '../../types';
import MetricCard from '../../components/dashboard/MetricCard';
import ChartWrapper from '../../components/dashboard/ChartWrapper';
import StatusChip from '../../components/dashboard/StatusChip';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const AdminDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([complaintsApi.getAll(), usersApi.getAll()])
      .then(([cRes, uRes]) => {
        setComplaints(cRes.data || []);
        setUsers(uRes.data || []);
      })
      .catch((err) => console.error("Admin data fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalComplaints = complaints.length;
  const totalUsers = users.length;
  const staffCount = users.filter((u: User) => u.role === 'STAFF').length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED').length;
  const resolutionRate = totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 0;

  const areaData = [
    { name: 'Mon', complaints: 12, resolved: 8 },
    { name: 'Tue', complaints: 19, resolved: 14 },
    { name: 'Wed', complaints: 15, resolved: 12 },
    { name: 'Thu', complaints: 22, resolved: 18 },
    { name: 'Fri', complaints: 30, resolved: 25 },
    { name: 'Sat', complaints: 10, resolved: 9 },
    { name: 'Sun', complaints: 8, resolved: 7 },
  ];

  const barData = [
    { name: 'IT', open: 5, resolved: 20 },
    { name: 'Facilities', open: 8, resolved: 15 },
    { name: 'Security', open: 3, resolved: 25 },
    { name: 'HR', open: 2, resolved: 10 },
  ];

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#fff', mb: 0.5 }}>
            Master Control Panel
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8' }}>
            Executive oversight and global system health monitoring.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" sx={{ color: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>System Audit</Button>
          <Button variant="contained" sx={{ bgcolor: '#6366f1', color: '#fff', borderRadius: 2 }}>Generate Report</Button>
        </Stack>
      </Box>

      {/* METRIC CARDS */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={3}>
          <MetricCard
            label="Active Nodes (Users)"
            value={totalUsers}
            icon={<PeopleAltOutlined />}
            color="#3b82f6"
            trend="+12% vs last month"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <MetricCard
            label="Total Incidents"
            value={totalComplaints}
            icon={<LocalFireDepartmentOutlined />}
            color="#ef4444"
            trend="+5% vs last week"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <MetricCard
            label="Resolution Rate"
            value={`${resolutionRate}%`}
            icon={<AssignmentTurnedInOutlined />}
            color="#10b981"
            trend="Target Achieved"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <MetricCard
            label="Operational Staff"
            value={staffCount}
            icon={<AdminPanelSettingsOutlined />}
            color="#8b5cf6"
            subtitle="Verified Units"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* MAIN TREND CHART */}
        <Grid item xs={12} md={8}>
          <ChartWrapper title="Incident vs Resolution Pipeline" subtitle="System throughput over the last 7 days">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff' }} />
                <Area type="monotone" dataKey="complaints" stroke="#6366f1" fillOpacity={1} fill="url(#colorC)" strokeWidth={3} />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" fillOpacity={1} fill="url(#colorR)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </Grid>

        {/* DISTRIBUTION CHART */}
        <Grid item xs={12} md={4}>
          <ChartWrapper title="Department Performance" subtitle="Load distribution by sector">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={80} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="resolved" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="open" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </Grid>

        {/* ACTIVITY FEED */}
        <Grid item xs={12}>
          <Paper sx={{ borderRadius: 4, background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MonitorHeartOutlined sx={{ color: '#ef4444' }} />
                <Typography variant="h6" fontWeight="900" sx={{ color: '#fff' }}>Global Activity Stream</Typography>
              </Box>
            </Box>

            {loading && <LinearProgress color="info" />}

            {!loading && complaints.length === 0 ? (
              <Box sx={{ py: 10, textAlign: 'center' }}>
                <CheckCircleOutline sx={{ fontSize: 64, color: 'rgba(255,255,255,0.05)', mb: 2 }} />
                <Typography sx={{ color: '#64748b' }}>System idle. No recent activities.</Typography>
              </Box>
            ) : (
              complaints.slice(0, 5).map((c, i) => (
                <Box key={c.id} sx={{
                  p: 2.5, display: 'flex', alignItems: 'center', gap: 3,
                  borderBottom: i < 4 && i < complaints.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }
                }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                    {c.createdBy?.charAt(0) || 'U'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{c.title}</Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>Reported by {c.createdBy || 'Anonymous'} • {dayjs(c.createdAt).fromNow()}</Typography>
                  </Box>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box sx={{ textAlign: 'right', minWidth: 100 }}>
                      <Typography sx={{ color: '#fff', fontSize: '0.7rem', fontWeight: 800 }}>{c.suggestedDepartment || 'UNASSIGNED'}</Typography>
                      <Typography sx={{ color: '#64748b', fontSize: '0.65rem' }}>ASSIGNED UNIT</Typography>
                    </Box>
                    <StatusChip status={c.status} />
                  </Stack>
                </Box>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
