import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import type { Role, User } from '../../types';

const MotionPaper = motion.create(Paper);

const redirectMap: Record<Role, string> = {
  USER: '/user/dashboard',
  STAFF: '/staff/dashboard',
  ADMIN: '/admin/dashboard',
};

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const user: User = await login(email.trim(), password);
      const destination = redirectMap[user.role];
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Login failed');
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
      <AnimatePresence>
        <MotionPaper
          elevation={6}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          sx={{ width: 400, p: 4, borderRadius: 3 }}
        >
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            ICRS Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
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

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ height: 42 }}
            >
              {loading ? (
                <CircularProgress size={22} />
              ) : (
                'Sign In'
              )}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/register" sx={{ fontWeight: 500, color: 'primary.main', textDecoration: 'none' }}>
                  Register
                </Link>
              </Typography>
            </Box>
          </Box>
        </MotionPaper>
      </AnimatePresence>
    </Box>
  );
};

export default Login;