import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, LinearProgress,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { complaintsApi } from '../../api';
import type { Complaint } from '../../types';
import StatCard from '../../components/common/StatCard';
import {
  PeopleOutlined, TrendingUpOutlined,
  AssignmentOutlined, SpeedOutlined,
} from '@mui/icons-material';

const StaffDepartment: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    complaintsApi.getAssigned()
      .then((r) => setComplaints(r.data || []))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  }, []);

  const byStatus: Record<string, number> = {
    SUBMITTED: 0, IN_REVIEW: 0, RESOLVED: 0, ESCALATED: 0,
  };
  complaints.forEach((c) => { byStatus[c.status] = (byStatus[c.status] || 0) + 1; });

  const resolvedRate = complaints.length > 0
    ? Math.round((byStatus.RESOLVED / complaints.length) * 100)
    : 0;

  const bars = [
    { label: 'Submitted', value: byStatus.SUBMITTED, color: '#1e90ff', total: complaints.length },
    { label: 'In Review', value: byStatus.IN_REVIEW, color: '#ffa502', total: complaints.length },
    { label: 'Resolved', value: byStatus.RESOLVED, color: '#2ed573', total: complaints.length },
    { label: 'Escalated', value: byStatus.ESCALATED, color: '#ff4757', total: complaints.length },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 700 }}>
          Department Overview
        </Typography>
        <Typography sx={{ color: '#8b92a5', fontSize: '0.875rem', mt: 0.3 }}>
          {user?.department?.departmentName || 'My Department'} · Performance statistics
        </Typography>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Total Cases" value={complaints.length} icon={<AssignmentOutlined />} color="#1e90ff" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Resolution Rate" value={`${resolvedRate}%`} icon={<TrendingUpOutlined />} color="#2ed573" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Escalated" value={byStatus.ESCALATED} icon={<SpeedOutlined />} color="#ff4757" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Department" value={user?.department?.departmentName || '—'} icon={<PeopleOutlined />} color="#ffa502" />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, borderRadius: 3, maxWidth: 640 }}>
        <Typography variant="h6" sx={{ fontFamily: '"Syne", sans-serif', mb: 3 }}>
          Case Distribution
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {bars.map((bar) => (
            <Box key={bar.label}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#e8eaf0' }}>
                  {bar.label}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: bar.color, fontWeight: 700 }}>
                  {bar.value} ({bar.total > 0 ? Math.round((bar.value / bar.total) * 100) : 0}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={bar.total > 0 ? (bar.value / bar.total) * 100 : 0}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.07)',
                  '& .MuiLinearProgress-bar': {
                    background: `linear-gradient(90deg, ${bar.color}, ${bar.color}88)`,
                    borderRadius: 5,
                  },
                }}
              />
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default StaffDepartment;
