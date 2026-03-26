import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 64;

const pageVariants = {
  USER: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
  },
  STAFF: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
  },
  ADMIN: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
};

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;
  const location = useLocation();
  const { user } = useAuth();

  const role = user?.role || 'USER';
  const variants = pageVariants[role] || pageVariants.USER;

  const roleConfigs: Record<string, { bg: string }> = {
    USER: { bg: '#0f172a' },
    STAFF: { bg: '#0a192f' },
    ADMIN: { bg: '#020617' },
  };

  const currentConfig = roleConfigs[role] || roleConfigs.USER;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: currentConfig.bg, transition: 'background 0.5s ease' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: 0,
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
          minHeight: '100vh',
        }}
      >
        <Navbar />
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, md: 3 },
            overflowY: 'auto',
            position: 'relative' // Needed for animate presence overlap
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ height: '100%', width: '100%' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
