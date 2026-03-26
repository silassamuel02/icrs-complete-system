import React, { useState } from 'react';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, IconButton, Tooltip, Divider,
} from '@mui/material';
import {
  DashboardOutlined, AssignmentOutlined, AddCircleOutline,
  PeopleOutlined, BusinessOutlined, AssignmentIndOutlined,
  MenuOpen, Menu as MenuIcon, BarChartOutlined,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 64;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: Record<Role, NavItem[]> = {
  USER: [
    { label: 'Dashboard', icon: <DashboardOutlined />, path: '/user/dashboard' },
    { label: 'My Complaints', icon: <AssignmentOutlined />, path: '/user/complaints' },
    { label: 'New Complaint', icon: <AddCircleOutline />, path: '/user/create' },
    { label: 'Account Info', icon: <PeopleOutlined />, path: '/user/profile' },
  ],
  STAFF: [
    { label: 'Dashboard', icon: <DashboardOutlined />, path: '/staff/dashboard' },
    { label: 'Staff Account Info', icon: <PeopleOutlined />, path: '/staff/profile' },
    { label: 'Complain Assigned For Them', icon: <AssignmentIndOutlined />, path: '/staff/assigned' },
  ],
  ADMIN: [
    { label: 'Dashboard', icon: <DashboardOutlined />, path: '/admin/dashboard' },
    { label: 'Admin Info', icon: <PeopleOutlined />, path: '/admin/profile' },
    { label: 'Overall Monitor', icon: <BarChartOutlined />, path: '/admin/dashboard' }, // Link to same for now
    { label: 'Alert Staff', icon: <AssignmentOutlined />, path: '/admin/alerts' },
  ],
};

const roleMeta: Record<Role, { label: string; color: string }> = {
  USER: { label: 'User Portal', color: '#1e90ff' },
  STAFF: { label: 'Staff Portal', color: '#ffa502' },
  ADMIN: { label: 'Admin Console', color: '#ff6b35' },
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const items = navItems[user.role];
  const meta = roleMeta[user.role];
  const width = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #0d0f14 0%, #111318 100%)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          overflowX: 'hidden',
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        },
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 1 : 2.5,
          py: 2,
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Syne", sans-serif',
                fontWeight: 800,
                color: '#00d4aa',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              ICRS
            </Typography>
            <Typography
              sx={{
                fontSize: '0.6rem',
                color: meta.color,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {meta.label}
            </Typography>
          </Box>
        )}
        <IconButton onClick={onToggle} size="small" sx={{ color: '#8b92a5' }}>
          {collapsed ? <MenuIcon fontSize="small" /> : <MenuOpen fontSize="small" />}
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />

      <List sx={{ px: 1, pt: 1.5, flex: 1 }}>
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={collapsed ? item.label : ''} placement="right" arrow>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    px: collapsed ? 1 : 1.5,
                    py: 1,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    background: active
                      ? 'linear-gradient(135deg, rgba(0,212,170,0.18), rgba(0,212,170,0.06))'
                      : 'transparent',
                    border: active ? '1px solid rgba(0,212,170,0.25)' : '1px solid transparent',
                    '&:hover': {
                      background: active
                        ? 'linear-gradient(135deg, rgba(0,212,170,0.22), rgba(0,212,170,0.08))'
                        : 'rgba(255,255,255,0.05)',
                    },
                    transition: 'all 0.15s',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 'auto' : 36,
                      color: active ? '#00d4aa' : '#8b92a5',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: active ? 600 : 400,
                        color: active ? '#e8eaf0' : '#8b92a5',
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Bottom role indicator */}
      {!collapsed && (
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: `${meta.color}14`,
              border: `1px solid ${meta.color}30`,
            }}
          >
            <Typography sx={{ fontSize: '0.7rem', color: meta.color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {user.role}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#8b92a5', mt: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.organization}
            </Typography>
          </Box>
        </Box>
      )}
    </Drawer>
  );
};

export default Sidebar;
