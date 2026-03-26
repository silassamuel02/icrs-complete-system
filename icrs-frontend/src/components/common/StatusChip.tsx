import React from 'react';
import { Chip } from '@mui/material';

interface StatusChipProps {
  status?: string;
}

interface UrgencyChipProps {
  level?: string;
}

/* ================= STATUS CHIP ================= */

const STATUS_CONFIG: Record<string, { label: string; color: any }> = {
  SUBMITTED: { label: 'Submitted', color: 'default' },
  ASSIGNED: { label: 'Assigned', color: 'info' },
  IN_REVIEW: { label: 'In Review', color: 'warning' },
  RESOLVED: { label: 'Resolved', color: 'success' },
  ESCALATED: { label: 'Escalated', color: 'error' },
};

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  if (!status || !STATUS_CONFIG[status]) {
    return <Chip label="Unknown" />;
  }

  const config = STATUS_CONFIG[status];

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
    />
  );
};

/* ================= URGENCY CHIP ================= */

const URGENCY_CONFIG: Record<string, { label: string; color: any }> = {
  LOW: { label: 'Low', color: 'success' },
  MEDIUM: { label: 'Medium', color: 'warning' },
  HIGH: { label: 'High', color: 'error' },
  CRITICAL: { label: 'Critical', color: 'error' },
};

export const UrgencyChip: React.FC<UrgencyChipProps> = ({ level }) => {
  if (!level || !URGENCY_CONFIG[level]) {
    return <Chip label="Low" size="small" />;
  }

  const config = URGENCY_CONFIG[level];

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
    />
  );
};