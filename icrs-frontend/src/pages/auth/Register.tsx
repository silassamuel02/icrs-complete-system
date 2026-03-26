import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  MenuItem,
  Link,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import type { Role } from '../../types';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('USER');
  const [organization, setOrganization] = useState('');
  const [department, setDepartment] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        department: department.trim() ? { id: parseInt(department.trim(), 10) } : null,
      });
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0c10',
        padding: 2,
      }}
    >
      <Paper elevation={6} sx={{ width: 450, p: 4, borderRadius: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          ICRS Registration
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label="Full Name"
            type="text"
            required
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <TextField
            label="Email"
            type="email"
            required
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label="Password"
            type="password"
            required
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <TextField
            select
            label="Role"
            required
            fullWidth
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <MenuItem value="USER">User</MenuItem>
            <MenuItem value="STAFF">Staff</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
          </TextField>

          <TextField
            label="Organization"
            type="text"
            fullWidth
            required={role !== 'USER'} // Require organization for Staff and Admin
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />

          <TextField
            label="Department ID"
            type="number"
            fullWidth
            required={role === 'STAFF'} // Typically Staff requires a department
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ height: 42, mt: 1 }}
          >
            {loading ? (
              <CircularProgress size={22} />
            ) : (
              'Create Account'
            )}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" sx={{ fontWeight: 500, color: 'primary.main', textDecoration: 'none' }}>
                Sign In
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register;
