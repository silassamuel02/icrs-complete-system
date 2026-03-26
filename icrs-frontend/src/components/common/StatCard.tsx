import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <Paper
    sx={{
      p: 2.5,
      background: 'linear-gradient(135deg, #161920 0%, #111318 100%)',
      border: `1px solid ${color}20`,
      borderRadius: 3,
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${color}, ${color}44)`,
      },
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Box>
        <Typography sx={{ fontSize: '0.72rem', color: '#8b92a5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {title}
        </Typography>
        <Typography
          variant="h4"
          sx={{ fontFamily: '"Syne", sans-serif', fontWeight: 700, color: '#e8eaf0', mt: 0.5, lineHeight: 1 }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontSize: '0.75rem', color: '#8b92a5', mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2.5,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
        }}
      >
        {icon}
      </Box>
    </Box>
  </Paper>
);

export default StatCard;
