import React from 'react';
import {
    Dialog, DialogContent, Box, Typography, IconButton,
    Grid, Divider, Stack, Avatar, Chip
} from '@mui/material';
import {
    Close as CloseIcon,
    ScheduleOutlined,
    PersonOutlined,
    BusinessOutlined,
    DescriptionOutlined,
    PsychologyOutlined,
    CheckCircleOutline
} from '@mui/icons-material';
import type { Complaint } from '../../types';
import StatusChip from './StatusChip';
import dayjs from 'dayjs';

interface DetailViewProps {
    complaint: Complaint | null;
    open: boolean;
    onClose: () => void;
}

const DetailView: React.FC<DetailViewProps> = ({ complaint, open, onClose }) => {
    if (!complaint) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    background: '#0f172a',
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.05)',
                    backgroundImage: 'none',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }
            }}
        >
            <Box sx={{ p: 4, position: 'relative' }}>
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 16, top: 16, color: '#64748b' }}
                >
                    <CloseIcon />
                </IconButton>

                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <StatusChip status={complaint.status} />
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>
                        CASE ID: #{complaint.id}
                    </Typography>
                </Stack>

                <Typography variant="h4" fontWeight="900" sx={{ color: '#fff', mb: 4 }}>
                    {complaint.title}
                </Typography>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={8}>
                        <Stack spacing={4}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <DescriptionOutlined sx={{ color: '#6366f1', fontSize: 20 }} />
                                    <Typography variant="subtitle2" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                                        Description
                                    </Typography>
                                </Box>
                                <Typography sx={{ color: '#e2e8f0', lineHeight: 1.7, fontSize: '0.95rem', bgcolor: 'rgba(255,255,255,0.02)', p: 2, borderRadius: 2 }}>
                                    {complaint.description}
                                </Typography>
                            </Box>

                            {complaint.solution && (
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                        <CheckCircleOutline sx={{ color: '#10b981', fontSize: 20 }} />
                                        <Typography variant="subtitle2" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                                            Resolution Note
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ color: '#e2e8f0', lineHeight: 1.7, fontSize: '0.95rem', bgcolor: 'rgba(16, 185, 129, 0.05)', p: 2, borderRadius: 2, border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                        {complaint.solution}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Stack spacing={3} sx={{ bgcolor: 'rgba(255,255,255,0.02)', p: 3, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>Timeline</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ScheduleOutlined sx={{ color: '#94a3b8', fontSize: 16 }} />
                                    <Typography variant="body2" sx={{ color: '#fff' }}>
                                        {dayjs(complaint.createdAt).format('MMM DD, YYYY - HH:mm')}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', mb: 1, display: 'block' }}>Requested By</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: '#6366f1' }}>{complaint.createdBy?.charAt(0)}</Avatar>
                                    <Typography variant="body2" sx={{ color: '#fff' }}>{complaint.createdBy || 'Unknown'}</Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ opacity: 0.1 }} />

                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <PsychologyOutlined sx={{ color: '#8b5cf6', fontSize: 20 }} />
                                    <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 800 }}>
                                        AI Routing Info
                                    </Typography>
                                </Box>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography sx={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Target Sector</Typography>
                                        <Typography sx={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>{complaint.suggestedDepartment || 'Unidentified'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography sx={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Urgency Level</Typography>
                                        <Typography sx={{ color: complaint.urgencyLevel === 'CRITICAL' ? '#ef4444' : '#10b981', fontSize: '0.85rem', fontWeight: 700 }}>
                                            {complaint.urgencyLevel}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </Dialog>
    );
};

export default DetailView;
