export type UserRole =
  | 'SUPER_ADMIN'
  | 'HR_MANAGER'
  | 'TEAM_MANAGER'
  | 'EMPLOYEE'
  | 'RECRUITER'
  | 'FINANCE'
  | 'PAYROLL_TEAM';

export type DepartmentType =
  | 'ENGINEERING'
  | 'HUMAN_RESOURCES'
  | 'FINANCE'
  | 'MARKETING'
  | 'OPERATIONS'
  | 'SALES'
  | 'DESIGN'
  | 'LEGAL'
  | 'EXECUTIVE'
  | string;

export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'PROBATION' | 'TERMINATED';

export interface SalaryStructure {
  basic: number;
  hra: number;
  specialAllowance: number;
  conveyance: number;
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  tdsTax: number;
  grossSalary: number;
  netSalary: number;
}

export interface Employee {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  department: DepartmentType;
  designation: string;
  managerId?: string;
  managerName?: string;
  status: EmployeeStatus;
  joiningDate: string;
  salary: SalaryStructure;
  avatar: string;
  location: string;
  address: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED';
  skills: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  bankDetails: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    branchName: string;
    panNumber: string;
    pfUan: string;
  };
  documents: {
    id: string;
    name: string;
    type: string;
    category?: 'GOVT' | 'PERSONAL' | 'COMPANY' | 'PRIVATE';
    docNumber?: string;
    uploadDate: string;
    fileUrl: string;
  }[];
  branch?: string;
  officeLocation?: string;
}

export interface UserSession {
  id: string;
  employeeId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
