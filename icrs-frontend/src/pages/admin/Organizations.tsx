import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress,
  Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Switch, FormControlLabel,
} from '@mui/material';
import { AddOutlined } from '@mui/icons-material';
import { organizationsApi } from '../../api';
import type { Organization } from '../../types';

const AdminOrganizations: React.FC = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', active: true });
  const [saving, setSaving] = useState(false);

  const loadOrgs = () => {
    setLoading(true);
    organizationsApi.getAll()
      .then((r) => setOrgs(r.data || []))
      .catch(() => setOrgs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrgs(); }, []);

  const handleToggle = async (id: string) => {
    try {
      await organizationsApi.toggle(id);
      setOrgs((prev) => prev.map((o) => (o.id === id ? { ...o, active: !o.active } : o)));
    } catch {
      // error handling
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await organizationsApi.create(newOrg);
      setDialogOpen(false);
      setNewOrg({ name: '', active: true });
      loadOrgs();
    } catch {
      // error handling
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 700 }}>
            Organizations
          </Typography>
          <Typography sx={{ color: '#8b92a5', fontSize: '0.875rem', mt: 0.3 }}>
            Manage organizations and their access
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => setDialogOpen(true)}
          sx={{ py: 1 }}
        >
          New Organization
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Organization</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Users</TableCell>
              <TableCell>Complaints</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orgs.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: '#8b92a5' }}>
                  No organizations found
                </TableCell>
              </TableRow>
            )}
            {orgs.map((o) => (
              <TableRow key={o.id} hover sx={{ '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
                <TableCell>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{o.name}</Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: '#8b92a5' }}>ID: {o.id}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={o.active ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      background: o.active ? '#2ed57320' : '#8b92a520',
                      color: o.active ? '#2ed573' : '#8b92a5',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: '#e8eaf0', fontWeight: 600 }}>{o.userCount}</TableCell>
                <TableCell sx={{ color: '#e8eaf0', fontWeight: 600 }}>{o.complaintCount}</TableCell>
                <TableCell sx={{ color: '#8b92a5', fontSize: '0.8rem' }}>
                  {new Date(o.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleToggle(o.id)}
                    sx={{
                      fontSize: '0.72rem',
                      py: 0.4,
                      px: 1.5,
                      borderColor: o.active ? '#ff475740' : '#2ed57340',
                      color: o.active ? '#ff4757' : '#2ed573',
                      '&:hover': {
                        borderColor: o.active ? '#ff4757' : '#2ed573',
                        background: o.active ? '#ff475710' : '#2ed57310',
                      },
                    }}
                  >
                    {o.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        PaperProps={{ sx: { background: '#161920', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, minWidth: 400 } }}
      >
        <DialogTitle sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 700 }}>
          New Organization
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField
            label="Organization Name"
            fullWidth
            value={newOrg.name}
            onChange={(e) => setNewOrg((f) => ({ ...f, name: e.target.value }))}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
              '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#00d4aa' },
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={newOrg.active}
                onChange={(e) => setNewOrg((f) => ({ ...f, active: e.target.checked }))}
                color="primary"
              />
            }
            label="Active on creation"
            sx={{ color: '#8b92a5', fontSize: '0.875rem' }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#8b92a5' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!newOrg.name || saving}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminOrganizations;
