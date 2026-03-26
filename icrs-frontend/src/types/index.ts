export type Role = 'USER' | 'STAFF' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type ComplaintStatus = 'SUBMITTED' | 'IN_REVIEW' | 'RESOLVED' | 'ESCALATED' | 'ASSIGNED';
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Department {
  id: number;
  departmentName: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  accountStatus: AccountStatus;
  organization: string;
  department?: Department;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  urgencyLevel: UrgencyLevel;
  riskScore: number;
  organizationId: string;
  createdBy: string;
  assignedTo: string;
  assignedStaffName?: string;
  createdAt: string;
  category?: string;
  department?: Department;
  response?: string;
  solution?: string;
  suggestedDepartment?: string;
}

export interface Organization {
  id: string;
  name: string;
  active: boolean;
  userCount: number;
  complaintCount: number;
  createdAt: string;
}
