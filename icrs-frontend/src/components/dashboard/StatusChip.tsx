import React from 'react';
import { Chip } from '@mui/material';

interface StatusChipProps {
    status: string;
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    SUBMITTED: { color: '#6366f1', bg: '#6366f115', label: 'Submitted' },
    AUTO_CLASSIFIED: { color: '#8b5cf6', bg: '#8b5cf615', label: 'AI Classified' },
    ASSIGNED: { color: '#f59e0b', bg: '#f59e0b15', label: 'Assigned' },
    IN_REVIEW: { color: '#3b82f6', bg: '#3b82f615', label: 'In Review' },
    IN_PROGRESS: { color: '#3b82f6', bg: '#3b82f615', label: 'In Progress' },
    ESCALATED: { color: '#ef4444', bg: '#ef444415', label: 'Escalated' },
    RESOLVED: { color: '#10b981', bg: '#10b98115', label: 'Resolved' },
    CLOSED: { color: '#64748b', bg: '#64748b15', label: 'Closed' },
};

const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
    const config = statusConfig[status] || { color: '#94a3b8', bg: '#94a3b815', label: status };

    return (
        <Chip
            size="small"
            label={config.label}
            sx={{
                background: config.bg,
                color: config.color,
                fontSize: '0.65rem',
                fontWeight: 800,
                borderRadius: 1.5,
                border: `1px solid ${config.color}30`
            }}
        />
    );
};

export default StatusChip;
