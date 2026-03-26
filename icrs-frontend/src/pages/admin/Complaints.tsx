import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress,
  TextField, InputAdornment, Select, MenuItem, FormControl,
} from '@mui/material';
import { SearchOutlined } from '@mui/icons-material';
import { complaintsApi } from '../../api';
import type { Complaint, ComplaintStatus } from '../../types';
import { StatusChip, UrgencyChip } from '../../components/common/StatusChip';

const AdminComplaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'ALL'>('ALL');

  useEffect(() => {
    complaintsApi.getAll()
      .then((r) => setComplaints(r.data || []))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = complaints.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 700 }}>
          All Complaints
        </Typography>
        <Typography sx={{ color: '#8b92a5', fontSize: '0.875rem', mt: 0.3 }}>
          System-wide complaint management
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{
            flex: 1,
            maxWidth: 360,
            '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ color: '#8b92a5', fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | 'ALL')}
            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' } }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="SUBMITTED">Submitted</MenuItem>
            <MenuItem value="IN_REVIEW">In Review</MenuItem>
            <MenuItem value="RESOLVED">Resolved</MenuItem>
            <MenuItem value="ESCALATED">Escalated</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Urgency</TableCell>
              <TableCell>Risk Score</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#8b92a5' }}>
                  No complaints found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((c) => (
              <TableRow key={c.id} hover sx={{ '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
                <TableCell>
                  <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>{c.title}</Typography>
                </TableCell>
                <TableCell><StatusChip status={c.status} /></TableCell>
                <TableCell><UrgencyChip level={c.urgencyLevel} /></TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={c.riskScore}
                      sx={{
                        width: 60,
                        height: 6,
                        borderRadius: 3,
                        background: 'rgba(255,255,255,0.08)',
                        '& .MuiLinearProgress-bar': {
                          background: c.riskScore > 70 ? '#ff4757' : c.riskScore > 40 ? '#ffa502' : '#2ed573',
                        },
                      }}
                    />
                    <Typography sx={{ fontSize: '0.75rem', color: '#8b92a5' }}>{c.riskScore}%</Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ color: '#8b92a5', fontSize: '0.8rem' }}>{c.createdBy}</TableCell>
                <TableCell sx={{ color: '#8b92a5', fontSize: '0.8rem' }}>{c.assignedTo || '—'}</TableCell>
                <TableCell sx={{ color: '#8b92a5', fontSize: '0.8rem' }}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminComplaints;
