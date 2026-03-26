import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: string;
    subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, color, trend, subtitle }) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
        >
            <Paper sx={{
                p: 3,
                borderRadius: 4,
                height: '100%',
                background: 'rgba(30, 41, 59, 0.4)',
                border: `1px solid ${color}30`,
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                    boxShadow: `0 10px 30px ${color}20`,
                }
            }}>
                <Box sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    opacity: 0.05,
                    transform: 'rotate(-15deg)',
                    color: color
                }}>
                    {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 80 } })}
                </Box>

                <Box sx={{ color, mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </Box>

                <Typography sx={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    color: '#fff',
                    lineHeight: 1,
                    mb: 0.5,
                    textShadow: `0 0 20px ${color}30`
                }}>
                    {value}
                </Typography>

                <Typography sx={{
                    fontSize: '0.7rem',
                    color: '#64748b',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                    textAlign: 'center'
                }}>
                    {label}
                </Typography>

                {(trend || subtitle) && (
                    <Typography sx={{
                        fontSize: '0.65rem',
                        color: trend?.includes('+') ? '#10b981' : (trend?.includes('-') ? '#ef4444' : '#94a3b8'),
                        fontWeight: 700,
                        mt: 1
                    }}>
                        {trend || subtitle}
                    </Typography>
                )}
            </Paper>
        </motion.div>
    );
};

export default MetricCard;
