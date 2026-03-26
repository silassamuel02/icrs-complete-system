import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress,
  Chip, Avatar, TextField, InputAdornment,
} from '@mui/material';
import { SearchOutlined } from '@mui/icons-material';
import { usersApi } from '../../api';
import type { User } from '../../types';

const statusColors: Record<string, string> = {
  ACTIVE: '#2ed573',
  INACTIVE: '#8b92a5',
  SUSPENDED: '#ff4757',
};

const roleColors: Record<string, string> = {
  USER: '#1e90ff',
  STAFF: '#ffa502',
  ADMIN: '#ff6b35',
};

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    usersApi.getAll()
      .then((r) => setUsers(r.data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 700 }}>
          User Management
        </Typography>
        <Typography sx={{ color: '#8b92a5', fontSize: '0.875rem', mt: 0.3 }}>
          Manage system users and access control
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{
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
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Organization</TableCell>
              <TableCell>Department</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: '#8b92a5' }}>
                  No users found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((u) => {
              const initials = u.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <TableRow key={u.id} hover sx={{ '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: `${roleColors[u.role]}30`,
                          color: roleColors[u.role],
                        }}
                      >
                        {initials}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{u.name}</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#8b92a5' }}>{u.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.role}
                      size="small"
                      sx={{
                        background: `${roleColors[u.role]}18`,
                        color: roleColors[u.role],
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        letterSpacing: '0.06em',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.accountStatus}
                      size="small"
                      sx={{
                        background: `${statusColors[u.accountStatus]}18`,
                        color: statusColors[u.accountStatus],
                        fontWeight: 700,
                        fontSize: '0.65rem',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#8b92a5', fontSize: '0.8rem' }}>{u.organization}</TableCell>
                  <TableCell sx={{ color: '#8b92a5', fontSize: '0.8rem' }}>{u.department?.departmentName || '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminUsers;
