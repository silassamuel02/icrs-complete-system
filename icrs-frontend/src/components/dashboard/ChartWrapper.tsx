import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

interface ChartWrapperProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    height?: number | string;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ title, subtitle, children, height = 300 }) => {
    return (
        <Paper sx={{
            p: 3,
            borderRadius: 4,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden'
        }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="900" sx={{ color: '#fff' }}>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
            <Box sx={{ flex: 1, minHeight: height }}>
                {children}
            </Box>
        </Paper>
    );
};

export default ChartWrapper;
