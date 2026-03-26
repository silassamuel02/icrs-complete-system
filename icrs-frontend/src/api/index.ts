import api from './client';
import type { AuthResponse } from '../types';

/* ================= AUTH ================= */

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

/* ================= COMPLAINTS ================= */

export const complaintsApi = {
  // USER
  getMy: () => api.get('/complaints/my'),

  // ADMIN
  getAll: () => api.get('/complaints/all'),

  // STAFF - department assigned complaints
  getDepartment: () => api.get('/complaints/department'),
  getAssigned: () => api.get('/complaints/department'),

  // UPDATE status
  update: (id: string, data: object) => api.put(`/complaints/${id}`, data),

  // STAFF: submit response + solution
  submitResponse: (id: string, data: { response: string; solution: string; status: string }) =>
    api.put(`/complaints/${id}/respond`, data),

  // ADMIN: assign complaint to staff
  assignStaff: (id: string, staffId: string) =>
    api.patch(`/complaints/${id}/assign`, { staffId }),

  // CREATE
  create: (data: object) =>
    api.post('/complaints', data),

  // STATUS COUNTS
  getSubmittedCount: () =>
    api.get('/complaints/submitted/count'),

  getInReviewCount: () =>
    api.get('/complaints/inreview/count'),

  getResolvedCount: () =>
    api.get('/complaints/resolved/count'),
};

/* ================= HEALTH ================= */
export const healthApi = {
  check: () => api.get('/actuator/health').catch(() => api.get('/complaints/all')),
};

/* ================= ORGANIZATIONS ================= */

export const organizationsApi = {
  getAll: () => api.get('/organizations'),
  getById: (id: string) =>
    api.get(`/organizations/${id}`),
  create: (data: object) =>
    api.post('/organizations', data),
  update: (id: string, data: object) =>
    api.put(`/organizations/${id}`, data),
  toggle: (id: string) =>
    api.patch(`/organizations/${id}/toggle`),
};

/* ================= USERS ================= */

export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) =>
    api.get(`/users/${id}`),
  update: (id: string, data: object) =>
    api.put(`/users/${id}`, data),
};

/* ================= STATS ================= */

export const statsApi = {
  adminStats: () => api.get('/stats/admin'),
  staffStats: () => api.get('/stats/staff'),
  userStats: () => api.get('/stats/user'),
};