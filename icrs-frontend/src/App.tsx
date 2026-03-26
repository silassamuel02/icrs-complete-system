import React from 'react';
// Force Rebuild Timestamp: 2026-03-08T19:48:00
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { RoleProtectedRoute } from './routes/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// User
import UserDashboard from './pages/user/Dashboard';
import UserComplaints from './pages/user/Complaints';
import UserCreate from './pages/user/Create';

// Staff
import StaffDashboard from './pages/staff/Dashboard';
import StaffAssigned from './pages/staff/Assigned';
import StaffDepartment from './pages/staff/Department';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminComplaints from './pages/admin/Complaints';
import AdminUsers from './pages/admin/Users';
import AdminOrganizations from './pages/admin/Organizations';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>

            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* USER */}
            <Route
              path="/user"
              element={
                <RoleProtectedRoute allowedRoles={['USER']}>
                  <MainLayout />
                </RoleProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<UserDashboard />} />
              <Route path="complaints" element={<UserComplaints />} />
              <Route path="create" element={<UserCreate />} />
              <Route path="profile" element={<UserDashboard />} /> {/* Profile is on dashboard */}
            </Route>

            {/* STAFF */}
            <Route
              path="/staff"
              element={
                <RoleProtectedRoute allowedRoles={['STAFF']}>
                  <MainLayout />
                </RoleProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="assigned" element={<StaffAssigned />} />
              <Route path="department" element={<StaffDepartment />} />
              <Route path="profile" element={<StaffDashboard />} /> {/* Profile is on dashboard */}
            </Route>

            {/* ADMIN */}
            <Route
              path="/admin"
              element={
                <RoleProtectedRoute allowedRoles={['ADMIN']}>
                  <MainLayout />
                </RoleProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="complaints" element={<AdminComplaints />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="organizations" element={<AdminOrganizations />} />
              <Route path="profile" element={<AdminDashboard />} /> {/* Profile is on dashboard */}
              <Route path="alerts" element={<AdminDashboard />} /> {/* Alerts are on dashboard */}
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;