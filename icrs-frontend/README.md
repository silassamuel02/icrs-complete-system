# ICRS – Intelligent Complaint Resolution System

Enterprise-grade complaint governance platform with AI-powered risk scoring, role-based access control, and multi-organization support.

## Quick Start

```bash
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**  
Backend expected on **http://localhost:8080/api**

## Roles & Routes

| Role  | Dashboard         | Redirect on login     |
|-------|-------------------|-----------------------|
| USER  | /user/dashboard   | /user/dashboard       |
| STAFF | /staff/dashboard  | /staff/dashboard      |
| ADMIN | /admin/dashboard  | /admin/dashboard      |

## Architecture

```
src/
├── api/           # Axios client + all API calls
├── context/       # AuthContext (JWT + user state)
├── routes/        # ProtectedRoute, RoleProtectedRoute
├── components/
│   ├── layout/    # MainLayout, Sidebar, Navbar
│   └── common/    # StatCard, StatusChip
├── pages/
│   ├── auth/      # Login
│   ├── user/      # Dashboard, Complaints, Create
│   ├── staff/     # Dashboard, Assigned, Department
│   └── admin/     # Dashboard, Complaints, Users, Organizations
├── theme/         # MUI dark theme (Syne + DM Sans)
└── types/         # TypeScript interfaces
```

## Auth Flow

1. POST `/api/auth/login` → `{ token, user }`
2. JWT stored in `localStorage` as `icrs_token`
3. Axios interceptor auto-attaches `Authorization: Bearer <token>`
4. 401 responses → auto-logout and redirect to `/login`

## Role Isolation

- `RoleProtectedRoute` wraps each role's route tree
- Accessing another role's URL → redirected to own dashboard
- Sidebar only renders nav items for current role
- No cross-role data or UI leakage
