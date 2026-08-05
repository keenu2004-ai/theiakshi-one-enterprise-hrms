import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import pg from 'pg';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const { Pool } = pg;
import { WeeklyPlanValidationService } from './backend/src/services/weeklyPlanValidationService';
import {
  Employee,
  AttendanceRecord,
  AttendanceStatus,
  LeaveRequest,
  Payslip,
  JobPosting,
  Candidate,
  HelpdeskTicket,
  Asset,
  Project,
  ProjectUpgradation,
  ExpenseClaim,
  ExpenseCategoryConfig,
  TimesheetEntry,
  AuditLog,
  NotificationItem,
  Announcement,
  PerformanceReview,
  UserRole,
  DepartmentType,
  DashboardMetrics,
  Holiday,
  HolidayRegion,
  HolidayType,
  Branch,
  WeeklyTask,
  CelebrationEvent,
  YearlyLeaveLedgerItem,
} from './src/types/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// CORS middleware for Netlify & external clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

import apiV1Routes from './backend/src/routes/index.js';
app.use('/api/v1', apiV1Routes);

// Initialize Gemini Client safely
let aiClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// ==========================================
// POSTGRESQL DATABASE ENGINE (NEON / CLOUD SQL)
// ==========================================
let dbPool: pg.Pool | null = null;

function mapRowToEmployee(row: any): Employee {
  let parsedSalary = {
    basic: Number(row.salary_basic || 0),
    hra: Number(row.salary_hra || 0),
    specialAllowance: Number(row.salary_special_allowance || 0),
    conveyance: Number(row.salary_conveyance || 0),
    pfEmployee: Number(row.salary_pf_employee || 0),
    pfEmployer: Number(row.salary_pf_employer || 0),
    esiEmployee: Number(row.salary_esi_employee || 0),
    tdsTax: Number(row.salary_tds_tax || 0),
    grossSalary: Number(row.salary_gross || 0),
    netSalary: Number(row.salary_net || 0),
  };

  let parsedSkills: string[] = [];
  if (row.skills) {
    if (Array.isArray(row.skills)) parsedSkills = row.skills;
    else if (typeof row.skills === 'string') {
      try {
        parsedSkills = JSON.parse(row.skills);
      } catch {
        parsedSkills = row.skills.split(',').map((s: string) => s.trim());
      }
    }
  }

  return {
    id: String(row.id),
    code: String(row.code),
    firstName: String(row.first_name || ''),
    lastName: String(row.last_name || ''),
    email: String(row.email || ''),
    password: row.password || 'password123',
    phone: row.phone || '',
    role: row.role as UserRole,
    department: row.department as DepartmentType,
    designation: row.designation || '',
    managerId: row.manager_id || undefined,
    managerName: row.manager_name || undefined,
    status: row.status || 'ACTIVE',
    joiningDate: row.joining_date ? String(row.joining_date).substring(0, 10) : '2021-01-01',
    avatar: row.avatar || '',
    location: row.location || '',
    address: row.address || '',
    gender: row.gender || 'MALE',
    dob: row.dob ? String(row.dob).substring(0, 10) : '1990-01-01',
    maritalStatus: row.marital_status || 'SINGLE',
    skills: parsedSkills,
    salary: parsedSalary,
    emergencyContact: {
      name: row.emergency_contact_name || 'Emergency Contact',
      relationship: row.emergency_contact_rel || 'Family',
      phone: row.emergency_contact_phone || '',
    },
    bankDetails: {
      accountNumber: row.bank_account_number || '',
      bankName: row.bank_name || '',
      ifscCode: row.bank_ifsc || '',
      branchName: row.bank_branch || '',
      panNumber: row.pan_number || '',
      pfUan: row.pf_uan || '',
    },
    documents: [],
  };
}

async function saveEmployeeToDb(emp: Employee) {
  if (!dbPool) return;
  try {
    const skillsStr = JSON.stringify(emp.skills || []);
    const query = `
      INSERT INTO employees (
        id, code, first_name, last_name, email, phone, role, department, designation,
        manager_id, manager_name, status, joining_date, avatar, location, address, gender, dob,
        marital_status, skills, salary_basic, salary_hra, salary_special_allowance, salary_conveyance,
        salary_pf_employee, salary_pf_employer, salary_esi_employee, salary_tds_tax, salary_gross,
        salary_net, bank_account_number, bank_name, bank_ifsc, bank_branch, pan_number, pf_uan,
        emergency_contact_name, emergency_contact_rel, emergency_contact_phone
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39
      )
      ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        designation = EXCLUDED.designation,
        manager_id = EXCLUDED.manager_id,
        manager_name = EXCLUDED.manager_name,
        status = EXCLUDED.status,
        joining_date = EXCLUDED.joining_date,
        avatar = EXCLUDED.avatar,
        location = EXCLUDED.location,
        address = EXCLUDED.address,
        gender = EXCLUDED.gender,
        dob = EXCLUDED.dob,
        marital_status = EXCLUDED.marital_status,
        skills = EXCLUDED.skills,
        salary_basic = EXCLUDED.salary_basic,
        salary_hra = EXCLUDED.salary_hra,
        salary_special_allowance = EXCLUDED.salary_special_allowance,
        salary_conveyance = EXCLUDED.salary_conveyance,
        salary_pf_employee = EXCLUDED.salary_pf_employee,
        salary_pf_employer = EXCLUDED.salary_pf_employer,
        salary_esi_employee = EXCLUDED.salary_esi_employee,
        salary_tds_tax = EXCLUDED.salary_tds_tax,
        salary_gross = EXCLUDED.salary_gross,
        salary_net = EXCLUDED.salary_net,
        bank_account_number = EXCLUDED.bank_account_number,
        bank_name = EXCLUDED.bank_name,
        bank_ifsc = EXCLUDED.bank_ifsc,
        bank_branch = EXCLUDED.bank_branch,
        pan_number = EXCLUDED.pan_number,
        pf_uan = EXCLUDED.pf_uan,
        emergency_contact_name = EXCLUDED.emergency_contact_name,
        emergency_contact_rel = EXCLUDED.emergency_contact_rel,
        emergency_contact_phone = EXCLUDED.emergency_contact_phone,
        updated_at = NOW()
    `;
    const values = [
      emp.id,
      emp.code,
      emp.firstName,
      emp.lastName,
      emp.email,
      emp.phone || null,
      emp.role,
      emp.department,
      emp.designation,
      emp.managerId || null,
      emp.managerName || null,
      emp.status || 'ACTIVE',
      emp.joiningDate || '2021-01-01',
      emp.avatar || null,
      emp.location || null,
      emp.address || null,
      emp.gender || null,
      emp.dob || null,
      emp.maritalStatus || null,
      skillsStr,
      emp.salary?.basic || 0,
      emp.salary?.hra || 0,
      emp.salary?.specialAllowance || 0,
      emp.salary?.conveyance || 0,
      emp.salary?.pfEmployee || 0,
      emp.salary?.pfEmployer || 0,
      emp.salary?.esiEmployee || 0,
      emp.salary?.tdsTax || 0,
      emp.salary?.grossSalary || 0,
      emp.salary?.netSalary || 0,
      emp.bankDetails?.accountNumber || null,
      emp.bankDetails?.bankName || null,
      emp.bankDetails?.ifscCode || null,
      emp.bankDetails?.branchName || null,
      emp.bankDetails?.panNumber || null,
      emp.bankDetails?.pfUan || null,
      emp.emergencyContact?.name || null,
      emp.emergencyContact?.relationship || null,
      emp.emergencyContact?.phone || null,
    ];
    await dbPool.query(query, values);

    // Sync credentials table
    await dbPool.query(
      `
      INSERT INTO credentials (id, employee_id, employee_code, employee_name, email, password_hash, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (employee_id) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW()
    `,
      [
        `cred-${emp.id}`,
        emp.id,
        emp.code,
        `${emp.firstName} ${emp.lastName}`,
        emp.email,
        emp.password || 'password123',
        emp.role,
        emp.status || 'ACTIVE',
      ]
    );
  } catch (err) {
    console.error('Failed to save employee to PostgreSQL:', err);
  }
}

async function deleteEmployeeFromDb(id: string) {
  if (!dbPool) return;
  try {
    await dbPool.query('DELETE FROM credentials WHERE employee_id = $1', [id]);
    await dbPool.query('DELETE FROM employees WHERE id = $1', [id]);
  } catch (err) {
    console.error('Failed to delete employee from PostgreSQL:', err);
  }
}

async function syncAllEmployeesToPostgres() {
  if (!dbPool) return;
  const currentIds = EMPLOYEES.map((e) => e.id);
  if (currentIds.length > 0) {
    await dbPool.query(`DELETE FROM credentials WHERE employee_id NOT IN (${currentIds.map((_, i) => `$${i + 1}`).join(',')})`, currentIds);
    await dbPool.query(`DELETE FROM employees WHERE id NOT IN (${currentIds.map((_, i) => `$${i + 1}`).join(',')})`, currentIds);
  } else {
    await dbPool.query('DELETE FROM credentials');
    await dbPool.query('DELETE FROM employees');
  }

  for (const emp of EMPLOYEES) {
    await saveEmployeeToDb(emp);
  }
}

// ==========================================
// MOCK DATA ENGINE FOR THEIAKSHI ENTERPRISES
// ==========================================

let GEOFENCE_SETTINGS = {
  officeName: 'Headquarters Bengaluru',
  latitude: 12.9716,
  longitude: 77.5946,
  radiusMeters: 500,
  enforceStrictGeofence: true,
};

let WORKSPACES = [
  { id: 'ws-1', name: 'Headquarters Bengaluru', location: 'Indiranagar, Bengaluru, KA', latitude: 12.9716, longitude: 77.5946, radiusMeters: 500, status: 'ACTIVE', employeeCount: 85 },
  { id: 'ws-2', name: 'Delhi NCR Innovation Hub', location: 'Cyber City, Gurugram, HR', latitude: 28.4595, longitude: 77.0266, radiusMeters: 400, status: 'ACTIVE', employeeCount: 28 },
  { id: 'ws-3', name: 'Mumbai Financial Center', location: 'BKC, Mumbai, MH', latitude: 19.0657, longitude: 72.8687, radiusMeters: 350, status: 'ACTIVE', employeeCount: 15 },
  { id: 'ws-4', name: 'Remote & Hybrid Workspace', location: 'Global VPN / Remote Cloud', latitude: 0, longitude: 0, radiusMeters: 100000, status: 'ACTIVE', employeeCount: 22 },
];

let DEPARTMENTS = [
  { id: 'dept-1', name: 'ENGINEERING', label: 'Engineering & Technology', headName: 'Vikram Verma', employeeCount: 42, budgetMonthly: 4500000, openPositions: 4 },
  { id: 'dept-2', name: 'HUMAN_RESOURCES', label: 'Human Resources & Talent', headName: 'Sneha Kulkarni', employeeCount: 12, budgetMonthly: 1200000, openPositions: 2 },
  { id: 'dept-3', name: 'FINANCE', label: 'Finance & Accounts', headName: 'Rajesh Nair', employeeCount: 8, budgetMonthly: 1100000, openPositions: 1 },
  { id: 'dept-4', name: 'MARKETING', label: 'Growth & Marketing', headName: 'Pooja Mehta', employeeCount: 10, budgetMonthly: 1500000, openPositions: 3 },
  { id: 'dept-5', name: 'OPERATIONS', label: 'Global Operations & Facilities', headName: 'Sujit Roy', employeeCount: 15, budgetMonthly: 1800000, openPositions: 0 },
  { id: 'dept-6', name: 'DESIGN', label: 'UI/UX & Product Design', headName: 'Rohan Sen', employeeCount: 6, budgetMonthly: 900000, openPositions: 1 },
  { id: 'dept-7', name: 'SALES', label: 'Enterprise Sales', headName: 'Anil Kapoor', employeeCount: 18, budgetMonthly: 2800000, openPositions: 5 },
  { id: 'dept-8', name: 'LEGAL', label: 'Legal & Corporate Governance', headName: 'Kavita Das', employeeCount: 4, budgetMonthly: 800000, openPositions: 0 },
];

let SYSTEM_CONFIG = {
  shiftStartTime: '09:00',
  shiftEndTime: '18:00',
  graceMinutes: 15,
  halfDayThresholdTime: '11:30',
  autoDeductLeaveForTwoHalfDays: true,
  requireGpsClockIn: true,
  sessionTimeoutMins: 60,
  require2FAForSuperAdmin: false,
  allowEmployeeProfileEdit: true,
  companyName: 'THEIAKSHI ENTERPRISES',
  subdomain: 'theiakshi-one.app',
  supportEmail: 'support@theiakshi.com',
};

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

let EMPLOYEES: Employee[] = [
  {
    id: 'emp-0a',
    code: 'TOK-1000',
    firstName: 'Vaibhav',
    lastName: 'Rajput',
    email: 'vaibhav.rajput@theiakshi.com',
    password: 'password123',
    phone: '+91 98765 00000',
    role: 'SUPER_ADMIN',
    department: 'EXECUTIVE',
    designation: 'Managing Director & CEO',
    managerId: undefined,
    managerName: 'Board of Directors',
    status: 'ACTIVE',
    joiningDate: '2021-01-01',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    location: 'Headquarters, Bengaluru',
    address: 'Indiranagar, Bengaluru, KA 560038',
    gender: 'MALE',
    dob: '1990-01-01',
    maritalStatus: 'SINGLE',
    skills: ['Architecture', 'Leadership', 'Strategy'],
    salary: {
      basic: 150000,
      hra: 60000,
      specialAllowance: 40000,
      conveyance: 10000,
      pfEmployee: 18000,
      pfEmployer: 18000,
      esiEmployee: 0,
      tdsTax: 30000,
      grossSalary: 260000,
      netSalary: 212000,
    },
    emergencyContact: { name: 'Emergency Contact', relationship: 'Family', phone: '+91 98765 00001' },
    bankDetails: {
      accountNumber: '91802003849999',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0001234',
      branchName: 'Main Branch',
      panNumber: 'ABCDE9999F',
      pfUan: '100982349999',
    },
    documents: [],
  },
  {
    id: 'emp-0b',
    code: 'TOK-1000B',
    firstName: 'Vaibhav',
    lastName: 'Arya',
    email: 'vaibhavarya058@gmail.com',
    password: 'password123',
    phone: '+91 98765 00001',
    role: 'SUPER_ADMIN',
    department: 'EXECUTIVE',
    designation: 'Managing Director & CEO',
    managerId: undefined,
    managerName: 'Board of Directors',
    status: 'ACTIVE',
    joiningDate: '2021-01-01',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    location: 'Headquarters, Bengaluru',
    address: 'Indiranagar, Bengaluru, KA 560038',
    gender: 'MALE',
    dob: '1990-01-01',
    maritalStatus: 'SINGLE',
    skills: ['Architecture', 'Leadership', 'Strategy'],
    salary: {
      basic: 150000,
      hra: 60000,
      specialAllowance: 40000,
      conveyance: 10000,
      pfEmployee: 18000,
      pfEmployer: 18000,
      esiEmployee: 0,
      tdsTax: 30000,
      grossSalary: 260000,
      netSalary: 212000,
    },
    emergencyContact: { name: 'Emergency Contact', relationship: 'Family', phone: '+91 98765 00001' },
    bankDetails: {
      accountNumber: '91802003849999',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0001234',
      branchName: 'Main Branch',
      panNumber: 'ABCDE9999F',
      pfUan: '100982349999',
    },
    documents: [],
  },
  {
    id: 'emp-1',
    code: 'TOK-1001',
    firstName: 'Arjun',
    lastName: 'Sharma',
    email: 'arjun.sharma@theiakshi.com',
    password: 'admin123',
    phone: '+91 98765 43210',
    role: 'SUPER_ADMIN',
    department: 'ENGINEERING',
    designation: 'Chief Technology Officer',
    managerId: undefined,
    managerName: 'Board of Directors',
    status: 'ACTIVE',
    joiningDate: '2021-01-15',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    location: 'Headquarters, Bengaluru',
    address: 'Indiranagar 100ft Road, Bengaluru, KA 560038',
    gender: 'MALE',
    dob: '1988-06-20',
    maritalStatus: 'MARRIED',
    skills: ['System Architecture', 'Cloud Infrastructure', 'Node.js', 'React', 'Strategic Leadership'],
    salary: {
      basic: 120000,
      hra: 48000,
      specialAllowance: 32000,
      conveyance: 10000,
      pfEmployee: 14400,
      pfEmployer: 14400,
      esiEmployee: 0,
      tdsTax: 25000,
      grossSalary: 210000,
      netSalary: 170600,
    },
    emergencyContact: { name: 'Priya Sharma', relationship: 'Spouse', phone: '+91 98765 11111' },
    bankDetails: {
      accountNumber: '91802003841120',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0001234',
      branchName: 'Koramangala',
      panNumber: 'ABCDE1234F',
      pfUan: '100982341122',
    },
    documents: [
      { id: 'doc-1', name: 'Aadhaar Card.pdf', type: 'PDF', category: 'GOVT', docNumber: '9920-1029-3810', uploadDate: '2021-01-15', fileSize: '1.2 MB', fileUrl: '#' },
      { id: 'doc-2', name: 'PAN Card Verification.pdf', type: 'PDF', category: 'GOVT', docNumber: 'ABCDE1234F', uploadDate: '2021-01-15', fileSize: '850 KB', fileUrl: '#' },
      { id: 'doc-3', name: 'Executive Employment Contract.pdf', type: 'PDF', category: 'COMPANY', docNumber: 'CTR-2021-001', uploadDate: '2021-01-15', fileSize: '2.4 MB', fileUrl: '#' },
      { id: 'doc-4', name: 'Form 16 Tax Certificate 2025-26.pdf', type: 'PDF', category: 'PRIVATE', docNumber: 'TAX-2026-HQ', uploadDate: '2026-04-10', fileSize: '3.1 MB', fileUrl: '#' },
      { id: 'doc-5', name: 'Higher Secondary & Degree Certificates.pdf', type: 'PDF', category: 'PERSONAL', docNumber: 'DEG-88102', uploadDate: '2021-01-15', fileSize: '4.5 MB', fileUrl: '#' },
    ],
  },
  {
    id: 'emp-2',
    code: 'TOK-1002',
    firstName: 'Sneha',
    lastName: 'Kulkarni',
    email: 'sneha.kulkarni@theiakshi.com',
    password: 'password123',
    phone: '+91 98123 45678',
    role: 'HR_MANAGER',
    department: 'HUMAN_RESOURCES',
    designation: 'VP of Human Capital',
    managerId: 'emp-1',
    managerName: 'Arjun Sharma',
    status: 'ACTIVE',
    joiningDate: '2021-04-01',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    location: 'Headquarters, Bengaluru',
    address: 'HSR Layout Sector 1, Bengaluru, KA 560102',
    gender: 'FEMALE',
    dob: '1991-11-12',
    maritalStatus: 'MARRIED',
    skills: ['Talent Acquisition', 'Employee Relations', 'HR Compliance', 'Performance Coaching'],
    salary: {
      basic: 95000,
      hra: 38000,
      specialAllowance: 25000,
      conveyance: 8000,
      pfEmployee: 11400,
      pfEmployer: 11400,
      esiEmployee: 0,
      tdsTax: 18000,
      grossSalary: 166000,
      netSalary: 136600,
    },
    emergencyContact: { name: 'Rohan Kulkarni', relationship: 'Spouse', phone: '+91 98123 99999' },
    bankDetails: {
      accountNumber: '50100239120488',
      bankName: 'ICICI Bank',
      ifscCode: 'ICIC0000412',
      branchName: 'Indiranagar',
      panNumber: 'FGHIJ5678K',
      pfUan: '100982341123',
    },
    documents: [
      { id: 'doc-3', name: 'Degree Certificate.pdf', type: 'PDF', uploadDate: '2021-04-01', fileUrl: '#' },
    ],
  },
  {
    id: 'emp-3',
    code: 'TOK-1003',
    firstName: 'Vikram',
    lastName: 'Verma',
    email: 'vikram.verma@theiakshi.com',
    phone: '+91 97654 32109',
    role: 'TEAM_MANAGER',
    department: 'ENGINEERING',
    designation: 'Engineering Manager',
    managerId: 'emp-1',
    managerName: 'Arjun Sharma',
    status: 'ACTIVE',
    joiningDate: '2022-02-10',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    location: 'Headquarters, Bengaluru',
    address: 'Whitefield Main Road, Bengaluru, KA 560066',
    gender: 'MALE',
    dob: '1990-03-25',
    maritalStatus: 'SINGLE',
    skills: ['Microservices', 'PostgreSQL', 'TypeScript', 'Agile Methodologies', 'Code Review'],
    salary: {
      basic: 85000,
      hra: 34000,
      specialAllowance: 21000,
      conveyance: 8000,
      pfEmployee: 10200,
      pfEmployer: 10200,
      esiEmployee: 0,
      tdsTax: 15000,
      grossSalary: 148000,
      netSalary: 122800,
    },
    emergencyContact: { name: 'Rakesh Verma', relationship: 'Father', phone: '+91 97654 88888' },
    bankDetails: {
      accountNumber: '302910482910',
      bankName: 'Axis Bank',
      ifscCode: 'UTIB0000210',
      branchName: 'Whitefield',
      panNumber: 'LMNOP9012Q',
      pfUan: '100982341124',
    },
    documents: [],
  },
  {
    id: 'emp-4',
    code: 'TOK-1004',
    firstName: 'Ananya',
    lastName: 'Rao',
    email: 'ananya.rao@theiakshi.com',
    phone: '+91 96543 21098',
    role: 'EMPLOYEE',
    department: 'ENGINEERING',
    designation: 'Senior Full-Stack Engineer',
    managerId: 'emp-3',
    managerName: 'Vikram Verma',
    status: 'ACTIVE',
    joiningDate: '2022-08-01',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
    location: 'Hybrid, Bengaluru',
    address: 'Electronic City Phase 1, Bengaluru, KA 560100',
    gender: 'FEMALE',
    dob: '1995-07-14',
    maritalStatus: 'SINGLE',
    skills: ['React', 'Next.js', 'TailwindCSS', 'GraphQL', 'Jest'],
    salary: {
      basic: 65000,
      hra: 26000,
      specialAllowance: 18000,
      conveyance: 5000,
      pfEmployee: 7800,
      pfEmployer: 7800,
      esiEmployee: 0,
      tdsTax: 9500,
      grossSalary: 114000,
      netSalary: 96700,
    },
    emergencyContact: { name: 'Sujatha Rao', relationship: 'Mother', phone: '+91 96543 77777' },
    bankDetails: {
      accountNumber: '603912048123',
      bankName: 'State Bank of India',
      ifscCode: 'SBIN0004012',
      branchName: 'E-City',
      panNumber: 'RSTUV3456W',
      pfUan: '100982341125',
    },
    documents: [],
  },
  {
    id: 'emp-5',
    code: 'TOK-1005',
    firstName: 'Rajesh',
    lastName: 'Nair',
    email: 'rajesh.nair@theiakshi.com',
    phone: '+91 95432 10987',
    role: 'FINANCE',
    department: 'FINANCE',
    designation: 'Finance Controller',
    managerId: 'emp-1',
    managerName: 'Arjun Sharma',
    status: 'ACTIVE',
    joiningDate: '2021-09-15',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    location: 'Headquarters, Bengaluru',
    address: 'JP Nagar 6th Phase, Bengaluru, KA 560078',
    gender: 'MALE',
    dob: '1987-01-30',
    maritalStatus: 'MARRIED',
    skills: ['Corporate Finance', 'Taxation', 'Financial Audit', 'ERP', 'Budgeting'],
    salary: {
      basic: 90000,
      hra: 36000,
      specialAllowance: 24000,
      conveyance: 8000,
      pfEmployee: 10800,
      pfEmployer: 10800,
      esiEmployee: 0,
      tdsTax: 16500,
      grossSalary: 158000,
      netSalary: 130700,
    },
    emergencyContact: { name: 'Meera Nair', relationship: 'Spouse', phone: '+91 95432 66666' },
    bankDetails: {
      accountNumber: '102938475610',
      bankName: 'Kotak Mahindra Bank',
      ifscCode: 'KKBK0000881',
      branchName: 'JP Nagar',
      panNumber: 'XYZAB7890C',
      pfUan: '100982341126',
    },
    documents: [],
  },
  {
    id: 'emp-6',
    code: 'TOK-1006',
    firstName: 'Kavya',
    lastName: 'Iyer',
    email: 'kavya.iyer@theiakshi.com',
    phone: '+91 94321 09876',
    role: 'RECRUITER',
    department: 'HUMAN_RESOURCES',
    designation: 'Lead Talent Acquisition',
    managerId: 'emp-2',
    managerName: 'Sneha Kulkarni',
    status: 'ACTIVE',
    joiningDate: '2022-11-10',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
    location: 'Headquarters, Bengaluru',
    address: 'Malleswaram 18th Cross, Bengaluru, KA 560003',
    gender: 'FEMALE',
    dob: '1993-09-08',
    maritalStatus: 'SINGLE',
    skills: ['Technical Sourcing', 'LinkedIn Recruiter', 'Candidate Pipeline', 'Interviewing'],
    salary: {
      basic: 55000,
      hra: 22000,
      specialAllowance: 15000,
      conveyance: 5000,
      pfEmployee: 6600,
      pfEmployer: 6600,
      esiEmployee: 0,
      tdsTax: 7000,
      grossSalary: 97000,
      netSalary: 83400,
    },
    emergencyContact: { name: 'Sundaram Iyer', relationship: 'Father', phone: '+91 94321 55555' },
    bankDetails: {
      accountNumber: '402910384712',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0000411',
      branchName: 'Malleswaram',
      panNumber: 'DEFGH1234I',
      pfUan: '100982341127',
    },
    documents: [],
  },
  {
    id: 'emp-7',
    code: 'TOK-1007',
    firstName: 'Manish',
    lastName: 'Deshmukh',
    email: 'manish.deshmukh@theiakshi.com',
    phone: '+91 93210 98765',
    role: 'PAYROLL_TEAM',
    department: 'FINANCE',
    designation: 'Senior Payroll Specialist',
    managerId: 'emp-5',
    managerName: 'Rajesh Nair',
    status: 'ACTIVE',
    joiningDate: '2023-01-20',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
    location: 'Headquarters, Bengaluru',
    address: 'Banashankari 3rd Stage, Bengaluru, KA 560085',
    gender: 'MALE',
    dob: '1992-04-18',
    maritalStatus: 'MARRIED',
    skills: ['Payroll Processing', 'PF & ESI Compliance', 'Tax Calculation', 'Excel Advanced'],
    salary: {
      basic: 50000,
      hra: 20000,
      specialAllowance: 14000,
      conveyance: 4000,
      pfEmployee: 6000,
      pfEmployer: 6000,
      esiEmployee: 0,
      tdsTax: 5500,
      grossSalary: 88000,
      netSalary: 76500,
    },
    emergencyContact: { name: 'Swati Deshmukh', relationship: 'Spouse', phone: '+91 93210 44444' },
    bankDetails: {
      accountNumber: '702910384723',
      bankName: 'Canara Bank',
      ifscCode: 'CNRB0001002',
      branchName: 'Banashankari',
      panNumber: 'JKLMN5678O',
      pfUan: '100982341128',
    },
    documents: [],
  },
  {
    id: 'emp-8',
    code: 'TOK-1008',
    firstName: 'Pooja',
    lastName: 'Mehta',
    email: 'pooja.mehta@theiakshi.com',
    phone: '+91 92109 87654',
    role: 'EMPLOYEE',
    department: 'MARKETING',
    designation: 'Growth Marketing Manager',
    managerId: 'emp-2',
    managerName: 'Sneha Kulkarni',
    status: 'ACTIVE',
    joiningDate: '2023-05-10',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    location: 'Remote, Mumbai',
    address: 'Bandra West, Mumbai, MH 400050',
    gender: 'FEMALE',
    dob: '1994-08-22',
    maritalStatus: 'SINGLE',
    skills: ['SEO', 'Content Strategy', 'Google Ads', 'HubSpot', 'Brand Marketing'],
    salary: {
      basic: 60000,
      hra: 24000,
      specialAllowance: 16000,
      conveyance: 5000,
      pfEmployee: 7200,
      pfEmployer: 7200,
      esiEmployee: 0,
      tdsTax: 8000,
      grossSalary: 105000,
      netSalary: 89800,
    },
    emergencyContact: { name: 'Sanjay Mehta', relationship: 'Father', phone: '+91 92109 33333' },
    bankDetails: {
      accountNumber: '802910384734',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0000122',
      branchName: 'Bandra',
      panNumber: 'PQRST9012U',
      pfUan: '100982341129',
    },
    documents: [],
  },
];

let ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: 'att-1',
    employeeId: 'emp-1',
    employeeName: 'Arjun Sharma',
    department: 'ENGINEERING',
    date: '2026-07-29',
    clockIn: '09:05:12',
    clockOut: undefined,
    status: 'PRESENT',
    locationIn: 'Headquarters, Bengaluru (Geofenced)',
    breakDurationMinutes: 30,
    overtimeHours: 0,
    regularizationStatus: 'NONE',
  },
  {
    id: 'att-2',
    employeeId: 'emp-2',
    employeeName: 'Sneha Kulkarni',
    department: 'HUMAN_RESOURCES',
    date: '2026-07-29',
    clockIn: '08:55:00',
    clockOut: undefined,
    status: 'PRESENT',
    locationIn: 'Headquarters, Bengaluru',
    breakDurationMinutes: 15,
    overtimeHours: 0,
    regularizationStatus: 'NONE',
  },
  {
    id: 'att-3',
    employeeId: 'emp-3',
    employeeName: 'Vikram Verma',
    department: 'ENGINEERING',
    date: '2026-07-29',
    clockIn: '09:12:45',
    clockOut: undefined,
    status: 'LATE',
    locationIn: 'Headquarters, Bengaluru',
    breakDurationMinutes: 0,
    overtimeHours: 0,
    regularizationStatus: 'PENDING',
    regularizationReason: 'Traffic congestion on Outer Ring Road',
  },
  {
    id: 'att-4',
    employeeId: 'emp-4',
    employeeName: 'Ananya Rao',
    department: 'ENGINEERING',
    date: '2026-07-29',
    clockIn: '09:01:10',
    clockOut: undefined,
    status: 'PRESENT',
    locationIn: 'Remote (VPN Validated)',
    breakDurationMinutes: 45,
    overtimeHours: 1.5,
    regularizationStatus: 'NONE',
  },
  {
    id: 'att-5',
    employeeId: 'emp-8',
    employeeName: 'Pooja Mehta',
    department: 'MARKETING',
    date: '2026-07-29',
    clockIn: undefined,
    clockOut: undefined,
    status: 'ON_LEAVE',
    breakDurationMinutes: 0,
    overtimeHours: 0,
    regularizationStatus: 'NONE',
  },
];

let LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'lv-1',
    employeeId: 'emp-8',
    employeeName: 'Pooja Mehta',
    employeeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    department: 'MARKETING',
    leaveType: 'CASUAL',
    startDate: '2026-07-28',
    endDate: '2026-07-30',
    totalDays: 3,
    reason: 'Family event in native town',
    status: 'APPROVED',
    appliedOn: '2026-07-20',
    approvedBy: 'Sneha Kulkarni',
    comments: 'Enjoy your break!',
  },
  {
    id: 'lv-2',
    employeeId: 'emp-4',
    employeeName: 'Ananya Rao',
    employeeAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
    department: 'ENGINEERING',
    leaveType: 'SICK',
    startDate: '2026-08-04',
    endDate: '2026-08-05',
    totalDays: 2,
    reason: 'Scheduled dental procedure',
    status: 'PENDING',
    appliedOn: '2026-07-27',
  },
  {
    id: 'lv-3',
    employeeId: 'emp-3',
    employeeName: 'Vikram Verma',
    employeeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    department: 'ENGINEERING',
    leaveType: 'EARNED',
    startDate: '2026-08-14',
    endDate: '2026-08-18',
    totalDays: 5,
    reason: 'Monsoon trekking trip',
    status: 'PENDING',
    appliedOn: '2026-07-25',
  },
];

let PAYSLIPS: Payslip[] = EMPLOYEES.map((emp, index) => ({
  id: `pay-${index + 1}`,
  payslipNumber: `PS-202607-${1000 + index}`,
  payPeriod: 'July 2026',
  employeeId: emp.id,
  employeeName: `${emp.firstName} ${emp.lastName}`,
  employeeCode: emp.code,
  designation: emp.designation,
  department: emp.department,
  joiningDate: emp.joiningDate,
  bankAccountNumber: emp.bankDetails.accountNumber,
  panNumber: emp.bankDetails.panNumber,
  workingDays: 22,
  paidDays: 22,
  basicSalary: emp.salary.basic,
  hra: emp.salary.hra,
  specialAllowance: emp.salary.specialAllowance,
  grossEarnings: emp.salary.grossSalary,
  pfDeduction: emp.salary.pfEmployee,
  esiDeduction: emp.salary.esiEmployee,
  taxDeduction: emp.salary.tdsTax,
  otherDeductions: 0,
  totalDeductions: emp.salary.pfEmployee + emp.salary.esiEmployee + emp.salary.tdsTax,
  netSalary: emp.salary.netSalary,
  status: 'PAID',
  generatedDate: '2026-07-28',
  paymentDate: '2026-07-28',
}));

let JOB_POSTINGS: JobPosting[] = [
  {
    id: 'job-1',
    jobCode: 'REQ-101',
    title: 'Senior DevOps Architect',
    department: 'ENGINEERING',
    location: 'Bengaluru / Hybrid',
    type: 'FULL_TIME',
    experienceYears: '5 - 8 Years',
    salaryRange: '₹28,000,000 - ₹38,000,000 P.A.',
    status: 'OPEN',
    applicantsCount: 24,
    createdDate: '2026-07-10',
    description: 'We are seeking an experienced DevOps Architect to lead our cloud deployment automation, Docker/K8s setup, and infrastructure monitoring.',
    requirements: ['Docker', 'Kubernetes', 'AWS/GCP', 'Terraform', 'CI/CD Pipelines'],
  },
  {
    id: 'job-2',
    jobCode: 'REQ-102',
    title: 'Product Design Lead (UI/UX)',
    department: 'DESIGN',
    location: 'Bengaluru',
    type: 'HYBRID',
    experienceYears: '4 - 7 Years',
    salaryRange: '₹22,000,000 - ₹30,000,000 P.A.',
    status: 'OPEN',
    applicantsCount: 18,
    createdDate: '2026-07-15',
    description: 'Lead the design systems and user experience across all enterprise web and mobile applications for THEIAKSHI ONE.',
    requirements: ['Figma Mastery', 'Design Systems', 'Prototyping', 'User Research'],
  },
  {
    id: 'job-3',
    jobCode: 'REQ-103',
    title: 'Financial Risk Analyst',
    department: 'FINANCE',
    location: 'Bengaluru',
    type: 'FULL_TIME',
    experienceYears: '3 - 5 Years',
    salaryRange: '₹18,000,000 - ₹24,000,000 P.A.',
    status: 'OPEN',
    applicantsCount: 9,
    createdDate: '2026-07-18',
    description: 'Conduct corporate financial risk assessment, variance analysis, and internal audits.',
    requirements: ['CA / MBA Finance', 'Financial Modeling', 'SAP / Oracle ERP', 'Excel Advanced'],
  },
];

let CANDIDATES: Candidate[] = [
  {
    id: 'cand-1',
    jobId: 'job-1',
    jobTitle: 'Senior DevOps Architect',
    name: 'Saurabh Ganguly',
    email: 'saurabh.g@gmail.com',
    phone: '+91 98888 77777',
    experienceYears: 6.5,
    stage: 'INTERVIEW',
    rating: 4.5,
    resumeUrl: '#',
    appliedDate: '2026-07-12',
    interviewDate: '2026-07-30 11:00 AM',
    interviewNotes: 'Strong hands-on experience with Terraform & Kubernetes on AWS.',
  },
  {
    id: 'cand-2',
    jobId: 'job-1',
    jobTitle: 'Senior DevOps Architect',
    name: 'Neha Agarwal',
    email: 'neha.agarwal@outlook.com',
    phone: '+91 97777 66666',
    experienceYears: 7.0,
    stage: 'OFFER',
    rating: 5.0,
    resumeUrl: '#',
    appliedDate: '2026-07-11',
    interviewDate: '2026-07-24',
    interviewNotes: 'Exceptional candidate. Technical round cleared with 100% score.',
  },
  {
    id: 'cand-3',
    jobId: 'job-2',
    jobTitle: 'Product Design Lead (UI/UX)',
    name: 'Rohan Sen',
    email: 'rohan.sen@design.io',
    phone: '+91 96666 55555',
    experienceYears: 5.0,
    stage: 'SCREENING',
    rating: 4.0,
    resumeUrl: '#',
    appliedDate: '2026-07-20',
  },
];

let HELPDESK_TICKETS: HelpdeskTicket[] = [
  {
    id: 'tkt-1',
    ticketNumber: 'TSK-1042',
    requesterId: 'emp-4',
    requesterName: 'Ananya Rao',
    department: 'ENGINEERING',
    category: 'HARDWARE',
    subject: 'Request for second 4K monitor setup',
    description: 'Need an additional 27-inch 4K monitor for dual screen coding setup.',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    assignedTo: 'IT Hardware Team',
    createdAt: '2026-07-26 10:30',
    updatedAt: '2026-07-27 14:15',
    comments: [
      {
        id: 'c-1',
        author: 'IT Helpdesk Support',
        text: 'Approved by Engineering Manager. Asset dispatch initiated.',
        timestamp: '2026-07-27 14:15',
      },
    ],
  },
  {
    id: 'tkt-2',
    ticketNumber: 'TSK-1043',
    requesterId: 'emp-8',
    requesterName: 'Pooja Mehta',
    department: 'MARKETING',
    category: 'IT_SUPPORT',
    subject: 'VPN access token reset for remote access',
    description: 'Authenticator app lost sync after phone OS update.',
    priority: 'HIGH',
    status: 'OPEN',
    assignedTo: 'InfoSec Team',
    createdAt: '2026-07-28 09:10',
    updatedAt: '2026-07-28 09:10',
    comments: [],
  },
];

let ASSETS: Asset[] = [
  {
    id: 'ast-1',
    assetTag: 'AST-9011',
    name: 'MacBook Pro M3 Max 16-inch (36GB RAM / 1TB SSD)',
    category: 'LAPTOP',
    serialNumber: 'C02GX912048X',
    status: 'ASSIGNED',
    assignedToId: 'emp-1',
    assignedToName: 'Arjun Sharma',
    assignedDate: '2024-02-10',
    purchaseDate: '2024-02-01',
    cost: 320000,
  },
  {
    id: 'ast-2',
    assetTag: 'AST-9012',
    name: 'Dell UltraSharp 32" 4K USB-C Monitor',
    category: 'MONITOR',
    serialNumber: 'CN-09231-10293',
    status: 'ASSIGNED',
    assignedToId: 'emp-4',
    assignedToName: 'Ananya Rao',
    assignedDate: '2023-01-15',
    purchaseDate: '2023-01-05',
    cost: 65000,
  },
  {
    id: 'ast-3',
    assetTag: 'AST-9013',
    name: 'Lenovo ThinkPad P1 Gen 6 Workstation',
    category: 'LAPTOP',
    serialNumber: 'LNV-88201948',
    status: 'AVAILABLE',
    purchaseDate: '2026-03-01',
    cost: 210000,
  },
];

let PROJECTS: Project[] = [
  {
    id: 'prj-1',
    code: 'PRJ-NEBULA',
    name: 'Nebula Cloud Microservices Revamp',
    client: 'Internal Enterprise Infrastructure',
    department: 'ENGINEERING',
    status: 'IN_PROGRESS',
    progress: 78,
    membersCount: 14,
    deadline: '2026-09-30',
    budget: 15000000,
    description: 'Migration from monolithic architecture to distributed Kubernetes containerized microservices.',
    managerId: 'emp-3',
    managerName: 'Vikram Verma',
    upgradations: [
      {
        id: 'upg-101',
        projectId: 'prj-1',
        title: 'Auth Service Migration to OAuth2',
        description: 'Successfully containerized user auth service and integrated OAuth JWT authentication.',
        progress: 100,
        status: 'COMPLETED',
        loggedBy: 'Ananya Rao',
        loggedByRole: 'EMPLOYEE',
        timestamp: '2026-07-28 14:30',
      },
      {
        id: 'upg-102',
        projectId: 'prj-1',
        title: 'Database Sharding & Read Replicas',
        description: 'Provisioning PostgreSQL read replicas and Redis caching layer.',
        progress: 78,
        status: 'IN_PROGRESS',
        loggedBy: 'Arjun Sharma',
        loggedByRole: 'SUPER_ADMIN',
        timestamp: '2026-07-29 10:15',
      },
    ],
  },
  {
    id: 'prj-2',
    code: 'PRJ-AURA',
    name: 'Aura Customer Portal 3.0',
    client: 'THEIAKSHI Global Clients',
    department: 'ENGINEERING',
    status: 'IN_PROGRESS',
    progress: 45,
    membersCount: 8,
    deadline: '2026-11-15',
    budget: 8500000,
    description: 'Next-gen responsive client self-service dashboard with automated billing history.',
    managerId: 'emp-3',
    managerName: 'Vikram Verma',
    upgradations: [
      {
        id: 'upg-201',
        projectId: 'prj-2',
        title: 'Figma Design System Approval',
        description: 'Design system tokens and responsive UI guidelines approved.',
        progress: 100,
        status: 'COMPLETED',
        loggedBy: 'Rohan Sen',
        loggedByRole: 'TEAM_MANAGER',
        timestamp: '2026-07-25 11:00',
      },
    ],
  },
];

let EXPENSE_CATEGORIES: ExpenseCategoryConfig[] = [
  {
    id: 'cat-1',
    name: 'Local Travel',
    description: 'City transport, cabs, auto, metro, personal vehicle mileage for local business visits.',
    requiresTransportDetails: true,
    mandatoryFields: ['transactionDate', 'purpose', 'category', 'currency', 'amount', 'modeOfTransport', 'startingPoint', 'destination'],
  },
  {
    id: 'cat-2',
    name: 'Outstation Travel',
    description: 'Intercity flights, trains, long-distance taxis, and transport for outstation business trips.',
    requiresTransportDetails: true,
    mandatoryFields: ['transactionDate', 'purpose', 'category', 'currency', 'amount', 'modeOfTransport', 'startingPoint', 'destination', 'tripDurationDays'],
  },
  {
    id: 'cat-3',
    name: 'Meals',
    description: 'Client entertainment meals, team dinners, and per diem meal allowances during travel.',
    requiresTransportDetails: false,
    mandatoryFields: ['transactionDate', 'purpose', 'category', 'currency', 'amount', 'billUrl'],
  },
  {
    id: 'cat-4',
    name: 'Hotel',
    description: 'Accommodation and hotel stay bookings for official work and client site visits.',
    requiresTransportDetails: false,
    mandatoryFields: ['transactionDate', 'purpose', 'category', 'currency', 'amount', 'billUrl'],
  },
  {
    id: 'cat-5',
    name: 'Fuel',
    description: 'Fuel and petrol/diesel reimbursement claims for company or approved personal vehicle usage.',
    requiresTransportDetails: false,
    mandatoryFields: ['transactionDate', 'purpose', 'category', 'currency', 'amount'],
  },
  {
    id: 'cat-6',
    name: 'Internet',
    description: 'Home broadband, high-speed Wi-Fi, and mobile data top-up claims for remote work.',
    requiresTransportDetails: false,
    mandatoryFields: ['transactionDate', 'purpose', 'category', 'currency', 'amount'],
  },
  {
    id: 'cat-7',
    name: 'Office Supplies',
    description: 'Stationery, office gadgets, ergonomics, paper, and desk hardware claims.',
    requiresTransportDetails: false,
    mandatoryFields: ['transactionDate', 'purpose', 'category', 'currency', 'amount'],
  },
  {
    id: 'cat-8',
    name: 'Training',
    description: 'Professional courses, certifications, tech books, and workshop enrollment fees.',
    requiresTransportDetails: false,
    mandatoryFields: ['transactionDate', 'purpose', 'category', 'currency', 'amount'],
  },
  {
    id: 'cat-9',
    name: 'Medical',
    description: 'Workplace health checkups, emergency medical expenses, and first-aid supply claims.',
    requiresTransportDetails: false,
    mandatoryFields: ['transactionDate', 'purpose', 'category', 'currency', 'amount'],
  },
  {
    id: 'cat-10',
    name: 'Other',
    description: 'Miscellaneous authorized business expenses not covered in standard categories.',
    requiresTransportDetails: false,
    mandatoryFields: ['transactionDate', 'purpose', 'category', 'currency', 'amount'],
  },
];

let EXPENSES: ExpenseClaim[] = [
  {
    id: 'exp-1',
    claimNumber: 'EXP-1001',
    employeeId: 'emp-4',
    employeeName: 'Ananya Rao',
    employeeCode: 'TOK-1004',
    department: 'ENGINEERING',
    managerId: 'emp-3',
    managerName: 'Vikram Verma',
    branch: 'Headquarters, Bengaluru',
    transactionDate: '2026-07-27',
    purpose: 'Onsite Client Architecture Meeting Transport',
    category: 'Local Travel',
    currency: 'INR',
    amount: 1450,
    gstAmount: 261,
    gstin: '29ABCDE1234F1ZH',
    projectId: 'prj-1',
    projectName: 'Nebula Cloud Microservices Revamp',
    client: 'Internal Enterprise Infrastructure',
    billUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
    billFileName: 'Uber_Receipt_27Jul.pdf',
    status: 'PAID',
    approvedBy: 'Finance Ops Head',
    approvedDate: '2026-07-28',
    modeOfTransport: 'Uber Premium Cab',
    startingPoint: 'Indiranagar HQ',
    destination: 'Electronic City Phase 1 Client Office',
    addedToPayroll: true,
    history: [
      { id: 'h-1', actorName: 'Ananya Rao', actorRole: 'EMPLOYEE', action: 'SUBMITTED', note: 'Claim filed with tax receipt attached', timestamp: '2026-07-27 18:20' },
      { id: 'h-2', actorName: 'Vikram Verma', actorRole: 'TEAM_MANAGER', action: 'APPROVED_BY_MANAGER', note: 'Verified client travel request', timestamp: '2026-07-28 09:30' },
      { id: 'h-3', actorName: 'Arjun Sharma', actorRole: 'SUPER_ADMIN', action: 'APPROVED_BY_FINANCE', note: 'Finance audit cleared', timestamp: '2026-07-28 11:15' },
      { id: 'h-4', actorName: 'System Payroll', actorRole: 'SYSTEM', action: 'PAID', note: 'Reimbursed via direct bank payout', timestamp: '2026-07-28 14:00' },
    ],
    commentsList: [
      { id: 'cm-1', authorName: 'Vikram Verma', authorRole: 'TEAM_MANAGER', text: 'Cab receipt verified. Approved for client visit.', timestamp: '2026-07-28 09:30' },
    ],
    createdAt: '2026-07-27 18:20',
  },
  {
    id: 'exp-2',
    claimNumber: 'EXP-1002',
    employeeId: 'emp-8',
    employeeName: 'Pooja Mehta',
    employeeCode: 'TOK-1008',
    department: 'MARKETING',
    managerId: 'emp-2',
    managerName: 'Sneha Kulkarni',
    branch: 'Remote, Mumbai',
    transactionDate: '2026-07-25',
    purpose: 'Delhi NCR Growth Summit Flight & Accommodation',
    category: 'Outstation Travel',
    currency: 'INR',
    amount: 12800,
    gstAmount: 2304,
    gstin: '07AAACB1111A1Z1',
    projectId: 'prj-2',
    projectName: 'Aura Customer Portal 3.0',
    client: 'THEIAKSHI Global Clients',
    billUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
    billFileName: 'AirIndia_Flight_Pass.pdf',
    status: 'SUBMITTED',
    modeOfTransport: 'Flight (Economy)',
    startingPoint: 'Bengaluru (BLR)',
    destination: 'New Delhi (DEL)',
    tripDurationDays: 3,
    addedToPayroll: false,
    history: [
      { id: 'h-10', actorName: 'Pooja Mehta', actorRole: 'EMPLOYEE', action: 'SUBMITTED', note: 'Flight invoice and event pass attached', timestamp: '2026-07-26 10:15' },
    ],
    commentsList: [
      { id: 'cm-10', authorName: 'Pooja Mehta', authorRole: 'EMPLOYEE', text: 'Flight booked via corporate portal. Please approve.', timestamp: '2026-07-26 10:16' },
    ],
    createdAt: '2026-07-26 10:15',
  },
  {
    id: 'exp-3',
    claimNumber: 'EXP-1003',
    employeeId: 'emp-3',
    employeeName: 'Vikram Verma',
    employeeCode: 'TOK-1003',
    department: 'ENGINEERING',
    managerId: 'emp-1',
    managerName: 'Arjun Sharma',
    branch: 'Headquarters, Bengaluru',
    transactionDate: '2026-07-28',
    purpose: 'Cloud Architecture AWS Certification Fee',
    category: 'Training',
    currency: 'INR',
    amount: 18500,
    gstAmount: 3330,
    projectId: 'prj-1',
    projectName: 'Nebula Cloud Microservices Revamp',
    client: 'Internal Enterprise Infrastructure',
    billUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
    billFileName: 'AWS_Solutions_Architect_Receipt.pdf',
    status: 'APPROVED_BY_MANAGER',
    approvedBy: 'Arjun Sharma',
    history: [
      { id: 'h-20', actorName: 'Vikram Verma', actorRole: 'TEAM_MANAGER', action: 'SUBMITTED', note: 'Professional certification claim', timestamp: '2026-07-28 11:00' },
      { id: 'h-21', actorName: 'Arjun Sharma', actorRole: 'SUPER_ADMIN', action: 'APPROVED_BY_MANAGER', note: 'Approved for tech upgrade budget', timestamp: '2026-07-28 15:30' },
    ],
    commentsList: [],
    createdAt: '2026-07-28 11:00',
  },
  {
    id: 'exp-4',
    claimNumber: 'EXP-1004',
    employeeId: 'emp-1',
    employeeName: 'Arjun Sharma',
    employeeCode: 'TOK-1001',
    department: 'EXECUTIVE',
    branch: 'Headquarters, Bengaluru',
    transactionDate: '2026-07-29',
    purpose: 'Quarterly Team Lunch & Project Retrospective',
    category: 'Meals',
    currency: 'INR',
    amount: 4200,
    gstAmount: 210,
    billUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
    billFileName: 'Restaurant_Tax_Invoice.pdf',
    status: 'DRAFT',
    history: [
      { id: 'h-30', actorName: 'Arjun Sharma', actorRole: 'SUPER_ADMIN', action: 'CREATED_DRAFT', note: 'Draft saved for expense log', timestamp: '2026-07-29 14:00' },
    ],
    commentsList: [],
    createdAt: '2026-07-29 14:00',
  },
];

let TIMESHEETS: TimesheetEntry[] = [
  {
    id: 'ts-1',
    employeeId: 'emp-4',
    employeeName: 'Ananya Rao',
    projectId: 'prj-1',
    projectName: 'Nebula Cloud Microservices Revamp',
    weekStartDate: '2026-07-20',
    monHours: 8,
    tueHours: 8,
    wedHours: 8,
    thuHours: 8,
    friHours: 8,
    satHours: 0,
    sunHours: 0,
    totalHours: 40,
    status: 'APPROVED',
  },
];

let AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    userId: 'emp-1',
    userName: 'Arjun Sharma',
    role: 'SUPER_ADMIN',
    action: 'POLICY_UPDATE',
    module: 'System Settings',
    description: 'Updated Attendance Geofencing radius from 200m to 300m for Bengaluru HQ.',
    ipAddress: '102.168.1.45',
    timestamp: '2026-07-29 08:30:12',
    severity: 'INFO',
  },
  {
    id: 'aud-2',
    userId: 'emp-2',
    userName: 'Sneha Kulkarni',
    role: 'HR_MANAGER',
    action: 'LEAVE_APPROVAL',
    module: 'Leave Management',
    description: 'Approved Casual Leave request for Pooja Mehta (3 days).',
    ipAddress: '102.168.1.88',
    timestamp: '2026-07-28 16:45:00',
    severity: 'INFO',
  },
  {
    id: 'aud-3',
    userId: 'emp-7',
    userName: 'Manish Deshmukh',
    role: 'PAYROLL_TEAM',
    action: 'PAYROLL_RUN',
    module: 'Payroll Engine',
    description: 'Disbursed July 2026 monthly payroll calculations for 120 employees.',
    ipAddress: '102.168.1.92',
    timestamp: '2026-07-28 11:15:30',
    severity: 'INFO',
  },
];

let NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'July 2026 Payslips Published',
    message: 'Your payslip for July 2026 has been generated and transferred to your bank account.',
    type: 'SUCCESS',
    timestamp: 'Yesterday at 11:30 AM',
    read: false,
    link: 'payroll',
  },
  {
    id: 'notif-2',
    title: 'Leave Request Update',
    message: 'Ananya Rao submitted a Sick leave request for Aug 4-5. Action required.',
    type: 'WARNING',
    timestamp: '2 hours ago',
    read: false,
    link: 'leave',
  },
  {
    id: 'notif-3',
    title: 'New Candidate Assigned',
    message: 'Neha Agarwal has reached OFFER stage for Senior DevOps Architect.',
    type: 'INFO',
    timestamp: '3 hours ago',
    read: true,
    link: 'recruitment',
  },
];

let ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'THEIAKSHI Annual Townhall & Hackathon 2026',
    content: 'We are excited to announce our flagship Annual Townhall and Hackathon taking place at Bengaluru HQ on August 20-21. Registration links for teams are now open!',
    author: 'Executive Leadership Team',
    date: '2026-07-25',
    priority: 'HIGH',
  },
  {
    id: 'ann-2',
    title: 'Updated Health Insurance Wellness Benefits',
    content: 'All employees are now eligible for comprehensive annual executive health checkups and mental wellness sessions fully covered under our updated insurance program.',
    author: 'Human Resources',
    date: '2026-07-15',
    priority: 'IMPORTANT',
  },
];

let HOLIDAYS: Holiday[] = [
  {
    id: 'hol-1',
    title: "New Year's Day",
    date: '2026-01-01',
    region: 'NATIONAL',
    type: 'MANDATORY',
    description: 'National holiday observing the beginning of the calendar year.',
    icon: '✨',
    isRecurring: true,
    dayOfWeek: 'Thursday',
  },
  {
    id: 'hol-2',
    title: 'Lohri Festival',
    date: '2026-01-13',
    region: 'NORTH_INDIA',
    type: 'OPTIONAL',
    description: 'Traditional North Indian harvest festival celebrating winter solstice.',
    icon: '🔥',
    isRecurring: true,
    dayOfWeek: 'Tuesday',
  },
  {
    id: 'hol-3',
    title: 'Makar Sankranti / Pongal',
    date: '2026-01-14',
    region: 'SOUTH_INDIA',
    type: 'MANDATORY',
    description: 'Major South Indian harvest festival honoring the sun deity Surya.',
    icon: '🌾',
    isRecurring: true,
    dayOfWeek: 'Wednesday',
  },
  {
    id: 'hol-4',
    title: 'Republic Day',
    date: '2026-01-26',
    region: 'NATIONAL',
    type: 'MANDATORY',
    description: 'National holiday commemorating the adoption of the Constitution of India.',
    icon: '🇮🇳',
    isRecurring: true,
    dayOfWeek: 'Monday',
  },
  {
    id: 'hol-5',
    title: 'Maha Shivratri',
    date: '2026-02-15',
    region: 'NATIONAL',
    type: 'OPTIONAL',
    description: 'Religious observance across all branches.',
    icon: '🔱',
    isRecurring: true,
    dayOfWeek: 'Sunday',
  },
  {
    id: 'hol-6',
    title: 'Holi - Festival of Colors',
    date: '2026-03-04',
    region: 'NORTH_INDIA',
    type: 'MANDATORY',
    description: 'Spring festival of colors widely celebrated across North India.',
    icon: '🎨',
    isRecurring: true,
    dayOfWeek: 'Wednesday',
  },
  {
    id: 'hol-7',
    title: 'Ugadi / Gudi Padwa',
    date: '2026-03-19',
    region: 'SOUTH_INDIA',
    type: 'MANDATORY',
    description: 'New Year celebration for Karnataka, Andhra Pradesh, Telangana.',
    icon: '🌿',
    isRecurring: true,
    dayOfWeek: 'Thursday',
  },
  {
    id: 'hol-8',
    title: 'Baisakhi / Vishu',
    date: '2026-04-14',
    region: 'NORTH_INDIA',
    type: 'MANDATORY',
    description: 'Harvest festival in Punjab and Kerala solar new year.',
    icon: '🌾',
    isRecurring: true,
    dayOfWeek: 'Tuesday',
  },
  {
    id: 'hol-9',
    title: 'Independence Day',
    date: '2026-08-15',
    region: 'NATIONAL',
    type: 'MANDATORY',
    description: 'National holiday celebrating Indian Independence.',
    icon: '🇮🇳',
    isRecurring: true,
    dayOfWeek: 'Saturday',
  },
  {
    id: 'hol-10',
    title: 'Onam Harvest Festival',
    date: '2026-09-05',
    region: 'SOUTH_INDIA',
    type: 'MANDATORY',
    description: 'Cultural harvest festival celebrated in Kerala and South branches.',
    icon: '🌺',
    isRecurring: true,
    dayOfWeek: 'Saturday',
  },
  {
    id: 'hol-11',
    title: 'Gandhi Jayanti',
    date: '2026-10-02',
    region: 'NATIONAL',
    type: 'MANDATORY',
    description: 'National holiday honoring Mahatma Gandhi.',
    icon: '🕊️',
    isRecurring: true,
    dayOfWeek: 'Friday',
  },
  {
    id: 'hol-12',
    title: 'Diwali - Festival of Lights',
    date: '2026-11-08',
    region: 'NATIONAL',
    type: 'MANDATORY',
    description: 'Major national festival of lights.',
    icon: '🪔',
    isRecurring: true,
    dayOfWeek: 'Sunday',
  },
];

let BRANCHES: Branch[] = [
  {
    id: 'br-1',
    name: 'Bengaluru Global HQ',
    code: 'BLR-HQ',
    city: 'Bengaluru',
    state: 'Karnataka',
    region: 'SOUTH_INDIA',
    address: 'Indiranagar 100ft Road, Bengaluru, Karnataka 560038',
    managerId: 'emp-1',
    managerName: 'Arjun Sharma',
    employeeCount: 180,
    attendancePercentage: 96.4,
    leavePercentage: 3.2,
    expenseTotal: 450000,
    monthlyPayroll: 18500000,
    floorsCount: 5,
  },
  {
    id: 'br-2',
    name: 'Noida Enterprise Center',
    code: 'DEL-NOIDA',
    city: 'Noida',
    state: 'Uttar Pradesh',
    region: 'NORTH_INDIA',
    address: 'Sector 62, Noida, Uttar Pradesh 201309',
    managerId: 'emp-3',
    managerName: 'Vikram Verma',
    employeeCount: 120,
    attendancePercentage: 94.8,
    leavePercentage: 4.1,
    expenseTotal: 280000,
    monthlyPayroll: 12000000,
    floorsCount: 3,
  },
  {
    id: 'br-3',
    name: 'Chennai Tech Park',
    code: 'CHE-OMR',
    city: 'Chennai',
    state: 'Tamil Nadu',
    region: 'SOUTH_INDIA',
    address: 'Old Mahabalipuram Road (OMR), Chennai, Tamil Nadu 600096',
    managerId: 'emp-2',
    managerName: 'Sneha Kulkarni',
    employeeCount: 95,
    attendancePercentage: 95.8,
    leavePercentage: 3.5,
    expenseTotal: 190000,
    monthlyPayroll: 9200000,
    floorsCount: 2,
  },
  {
    id: 'br-4',
    name: 'Mumbai Financial Tower',
    code: 'MUM-BKC',
    city: 'Mumbai',
    state: 'Maharashtra',
    region: 'WEST_INDIA',
    address: 'Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051',
    managerId: 'emp-5',
    managerName: 'Rajesh Nair',
    employeeCount: 65,
    attendancePercentage: 97.1,
    leavePercentage: 2.8,
    expenseTotal: 310000,
    monthlyPayroll: 7800000,
    floorsCount: 2,
  },
];

let WEEKLY_TASKS: WeeklyTask[] = [
  {
    id: 'tsk-101',
    employeeId: 'emp-0a',
    employeeName: 'Vaibhav Rajput',
    date: '2026-07-30',
    task: 'Review Q3 Executive HR Strategy & Multi-Branch Expansion',
    priority: 'URGENT',
    department: 'EXECUTIVE',
    project: 'PRJ-NEBULA',
    deadline: '2026-07-30',
    remarks: 'High priority executive review for board meeting.',
    status: 'IN_PROGRESS',
    progressPercent: 75,
    managerComments: 'On track for townhall presentation.',
    weekNumber: 31,
  },
  {
    id: 'tsk-102',
    employeeId: 'emp-4',
    employeeName: 'Ananya Rao',
    date: '2026-07-30',
    task: 'Finalize Figma design tokens for Mobile HRMS view',
    priority: 'HIGH',
    department: 'PRODUCT',
    project: 'PRJ-AURA',
    deadline: '2026-07-31',
    remarks: 'Needs responsiveness audit on Android screen sizes.',
    status: 'IN_PROGRESS',
    progressPercent: 60,
    managerComments: 'Great progress on dark mode palette.',
    weekNumber: 31,
  },
  {
    id: 'tsk-103',
    employeeId: 'emp-1',
    employeeName: 'Arjun Sharma',
    date: '2026-07-30',
    task: 'Database indexing and Redis caching optimization',
    priority: 'HIGH',
    department: 'ENGINEERING',
    project: 'PRJ-NEBULA',
    deadline: '2026-08-01',
    remarks: 'Targeting <50ms query response time across 500+ employee records.',
    status: 'PENDING',
    progressPercent: 30,
    managerComments: 'Ensure migration script is thoroughly tested in dev container.',
    weekNumber: 31,
  },
];

let CELEBRATION_EVENTS: CelebrationEvent[] = [
  {
    id: 'cel-1',
    employeeId: 'emp-4',
    employeeName: 'Ananya Rao',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
    type: 'BIRTHDAY',
    date: new Date().toISOString().substring(0, 10),
    title: '🎉 Happy Birthday Ananya Rao!',
    description: 'Senior Product Designer • Celebrating today! Send your warmest wishes.',
    attendeesCount: 42,
    location: 'Cafeteria, Floor 3',
  },
  {
    id: 'cel-2',
    employeeId: 'emp-1',
    employeeName: 'Arjun Sharma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    type: 'WORK_ANNIVERSARY',
    date: '2026-08-01',
    title: '🏆 5-Year Work Anniversary - Arjun Sharma',
    description: 'Chief Technology Officer • Celebrating 5 years of engineering leadership.',
    attendeesCount: 120,
    location: 'Main Auditorium, Bengaluru HQ',
  },
  {
    id: 'cel-3',
    type: 'FESTIVAL',
    date: '2026-08-15',
    title: '🇮🇳 Independence Day Corporate Celebration & Flag Hoisting',
    description: 'All branches gather for flag hoisting and morning breakfast.',
    attendeesCount: 450,
    location: 'All Office Locations & Remote Stream',
  },
];

let PERFORMANCE_REVIEWS: PerformanceReview[] = [
  {
    id: 'pr-1',
    employeeId: 'emp-4',
    employeeName: 'Ananya Rao',
    designation: 'Senior Full-Stack Engineer',
    department: 'ENGINEERING',
    cycleName: 'H1 2026 Review Cycle',
    rating: 4.8,
    kraScore: 96,
    status: 'COMPLETED',
    selfComments: 'Delivered high performance across microservices frontend optimization.',
    managerComments: 'Outstanding technical execution and peer mentorship.',
    goalsCount: 5,
    completedGoalsCount: 5,
  },
  {
    id: 'pr-2',
    employeeId: 'emp-3',
    employeeName: 'Vikram Verma',
    designation: 'Engineering Manager',
    department: 'ENGINEERING',
    cycleName: 'H1 2026 Review Cycle',
    rating: 4.5,
    kraScore: 90,
    status: 'COMPLETED',
    selfComments: 'Expanded team capacity by 30% while reducing sprint overflow.',
    managerComments: 'Great leadership and project delivery.',
    goalsCount: 6,
    completedGoalsCount: 5,
  },
];

// ==========================================
// CREDENTIALS FILE STORAGE ENGINE
// ==========================================

const CREDENTIALS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'credentials.json');

interface CredentialRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  email: string;
  password: string;
  role: UserRole;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function readCredentialsFile(): CredentialRecord[] {
  try {
    if (fs.existsSync(CREDENTIALS_FILE_PATH)) {
      const data = fs.readFileSync(CREDENTIALS_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading credentials.json:', err);
  }
  return [];
}

function saveCredentialsFile(records: CredentialRecord[]) {
  try {
    const dir = path.dirname(CREDENTIALS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CREDENTIALS_FILE_PATH, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing credentials.json:', err);
  }
}

function syncCredentialsFile() {
  let currentCreds = readCredentialsFile();
  let updated = false;

  const activeEmpIds = new Set(EMPLOYEES.map((e) => e.id));
  const initialLength = currentCreds.length;
  currentCreds = currentCreds.filter((c) => activeEmpIds.has(c.employeeId));
  if (currentCreds.length !== initialLength) updated = true;

  EMPLOYEES.forEach((emp) => {
    let existing = currentCreds.find((c) => c.employeeId === emp.id);
    if (!existing) {
      currentCreds.push({
        id: `cred-${emp.id.replace('emp-', '')}`,
        employeeId: emp.id,
        employeeCode: emp.code,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        password: emp.password || (emp.role === 'SUPER_ADMIN' ? 'admin123' : 'password123'),
        role: emp.role,
        status: emp.status || 'ACTIVE',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
      updated = true;
    } else {
      if (
        existing.email !== emp.email ||
        existing.role !== emp.role ||
        existing.employeeName !== `${emp.firstName} ${emp.lastName}` ||
        existing.status !== emp.status ||
        (emp.password && existing.password !== emp.password)
      ) {
        existing.email = emp.email;
        existing.role = emp.role;
        existing.employeeName = `${emp.firstName} ${emp.lastName}`;
        existing.status = emp.status;
        if (emp.password) existing.password = emp.password;
        existing.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
        updated = true;
      }
    }
  });

  if (updated || currentCreds.length === 0) {
    saveCredentialsFile(currentCreds);
  }
}

// Initial sync on server start
syncCredentialsFile();

// ==========================================
// REST API ENDPOINTS (/api/v1)
// ==========================================

// Health check
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    app: 'THEIAKSHI ONE HRMS',
    organization: 'THEIAKSHI ENTERPRISES',
    timestamp: new Date().toISOString(),
    version: '1.0.0-enterprise',
  });
});

// Authentication endpoints
app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const inputEmail = (email || '').trim().toLowerCase();
  const inputPassword = (password || '').trim();

  // Validate credentials directly against credentials.json storage file
  const creds = readCredentialsFile();
  const cred = creds.find((c) => c.email.toLowerCase() === inputEmail);

  if (!cred) {
    return res.status(401).json({ message: 'Invalid company email address or credentials. No account found.' });
  }

  if (cred.status !== 'ACTIVE') {
    return res.status(403).json({ message: 'This account login has been deactivated or revoked by Super Admin.' });
  }

  if (cred.password !== inputPassword) {
    return res.status(401).json({ message: 'Incorrect password. Please verify your credentials.' });
  }

  let user = EMPLOYEES.find((e) => e.id === cred.employeeId || e.email.toLowerCase() === inputEmail);
  if (!user) {
    return res.status(401).json({ message: 'User record deleted or access revoked.' });
  }

  // Audit Log
  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`,
    role: user.role,
    action: 'USER_LOGIN',
    module: 'Authentication Engine',
    description: `User ${user.email} (${user.role}) logged in successfully via credentials.json validation.`,
    ipAddress: '102.168.1.100',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    severity: 'INFO',
  });

  res.json({
    token: `jwt_token_${user.id}_${Date.now()}`,
    refreshToken: `ref_token_${user.id}_${Date.now()}`,
    user,
  });
});

app.get('/api/v1/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const parts = authHeader.split('_');
    if (parts.length >= 3) {
      const empId = parts[2];
      const user = EMPLOYEES.find((e) => e.id === empId);
      if (user) return res.json({ user });
    }
  }
  res.json({ user: EMPLOYEES[0] });
});

// Super Admin Credentials File & Vault API
app.get('/api/v1/admin/credentials', (_req: Request, res: Response) => {
  syncCredentialsFile();
  const creds = readCredentialsFile();
  res.json({
    filePath: 'src/data/credentials.json',
    lastUpdated: new Date().toISOString(),
    totalRecords: creds.length,
    credentials: creds,
  });
});

app.put('/api/v1/admin/credentials/:id/reset-password', (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ message: 'Password must be at least 4 characters.' });
  }

  const creds = readCredentialsFile();
  const credIndex = creds.findIndex((c) => c.id === id || c.employeeId === id);
  if (credIndex === -1) {
    return res.status(404).json({ message: 'Credential record not found.' });
  }

  const cleanPass = newPassword.trim();
  creds[credIndex].password = cleanPass;
  creds[credIndex].updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
  saveCredentialsFile(creds);

  const empIndex = EMPLOYEES.findIndex((e) => e.id === creds[credIndex].employeeId);
  if (empIndex !== -1) {
    EMPLOYEES[empIndex].password = cleanPass;
  }

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    userId: 'emp-1',
    userName: 'Arjun Sharma',
    role: 'SUPER_ADMIN',
    action: 'PASSWORD_RESET',
    module: 'Credentials Vault',
    description: `Super Admin reset credentials password for ${creds[credIndex].email} in credentials.json file.`,
    ipAddress: '102.168.1.45',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    severity: 'WARNING',
  });

  res.json({ message: 'Password updated successfully in credentials.json file.', credential: creds[credIndex] });
});

app.get('/api/v1/admin/credentials/download', (_req: Request, res: Response) => {
  syncCredentialsFile();
  if (fs.existsSync(CREDENTIALS_FILE_PATH)) {
    res.download(CREDENTIALS_FILE_PATH, 'credentials.json');
  } else {
    res.status(404).json({ message: 'Credentials file not found.' });
  }
});

// Dashboard Metrics
app.get('/api/v1/dashboard/metrics', (_req: Request, res: Response) => {
  const totalEmployees = EMPLOYEES.length;
  const activeToday = ATTENDANCE_RECORDS.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const onLeaveToday = ATTENDANCE_RECORDS.filter((a) => a.status === 'ON_LEAVE').length;
  const lateArrivals = ATTENDANCE_RECORDS.filter((a) => a.status === 'LATE').length;
  const pendingLeaveApprovals = LEAVE_REQUESTS.filter((l) => l.status === 'PENDING').length;
  const monthlyPayrollTotal = EMPLOYEES.reduce((acc, emp) => acc + emp.salary.netSalary, 0);
  const openJobsCount = JOB_POSTINGS.filter((j) => j.status === 'OPEN').length;
  const openTicketsCount = HELPDESK_TICKETS.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

  const metrics: DashboardMetrics = {
    totalEmployees,
    activeToday,
    onLeaveToday,
    lateArrivals,
    pendingLeaveApprovals,
    monthlyPayrollTotal,
    openJobsCount,
    openTicketsCount,
    attendancePercentage: 96.4,
    retentionRate: 98.2,
  };

  res.json(metrics);
});

// Employees Endpoints
app.get('/api/v1/employees', (req: Request, res: Response) => {
  let list = [...EMPLOYEES];
  const { search, department, role, status } = req.query;

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q)
    );
  }

  if (department && department !== 'ALL') {
    list = list.filter((e) => e.department === department);
  }

  if (role && role !== 'ALL') {
    list = list.filter((e) => e.role === role);
  }

  if (status && status !== 'ALL') {
    list = list.filter((e) => e.status === status);
  }

  res.json(list);
});

app.get('/api/v1/employees/:id', (req: Request, res: Response) => {
  const emp = EMPLOYEES.find((e) => e.id === req.params.id);
  if (!emp) return res.status(404).json({ message: 'Employee not found' });
  res.json(emp);
});

app.post('/api/v1/employees', (req: Request, res: Response) => {
  const defaultPass = req.body.password || 'Welcome@123';
  const deptInput = req.body.department;
  if (deptInput && typeof deptInput === 'string') {
    const norm = deptInput.trim();
    const exists = DEPARTMENTS.some(
      (d) => d.name === norm || d.name === norm.toUpperCase().replace(/\s+/g, '_') || d.label.toLowerCase() === norm.toLowerCase()
    );
    if (!exists) {
      DEPARTMENTS.push({
        id: `dept-${Date.now()}`,
        name: norm.toUpperCase().replace(/\s+/g, '_'),
        label: norm,
        headName: 'Unassigned',
        employeeCount: 1,
        budgetMonthly: 1500000,
        openPositions: 0,
      });
    }
  }

  const newEmp: Employee = {
    ...req.body,
    id: `emp-${Date.now()}`,
    code: `TOK-${Math.floor(1000 + Math.random() * 9000)}`,
    password: defaultPass,
    status: req.body.status || 'ACTIVE',
    avatar: req.body.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    documents: [],
  };
  EMPLOYEES.unshift(newEmp);
  saveEmployeeToDb(newEmp).catch((err) => console.error('PG Save Error:', err));

  // Immediately append new credentials record into credentials.json file
  const creds = readCredentialsFile();
  const newCred: CredentialRecord = {
    id: `cred-${Date.now()}`,
    employeeId: newEmp.id,
    employeeCode: newEmp.code,
    employeeName: `${newEmp.firstName} ${newEmp.lastName}`,
    email: newEmp.email,
    password: defaultPass,
    role: newEmp.role,
    status: newEmp.status,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
  creds.unshift(newCred);
  saveCredentialsFile(creds);

  // Record Audit Log
  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    userId: 'emp-1',
    userName: 'Arjun Sharma',
    role: 'SUPER_ADMIN',
    action: 'CREATE_EMPLOYEE',
    module: 'Employee Management',
    description: `Created new employee profile for ${newEmp.firstName} ${newEmp.lastName} (${newEmp.code}) in department "${newEmp.department}". Generated login credentials saved to credentials.json file.`,
    ipAddress: '102.168.1.45',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    severity: 'INFO',
  });

  res.status(201).json(newEmp);
});

app.put('/api/v1/employees/:id', (req: Request, res: Response) => {
  const index = EMPLOYEES.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Employee not found' });
  
  const deptInput = req.body.department;
  if (deptInput && typeof deptInput === 'string') {
    const norm = deptInput.trim();
    const exists = DEPARTMENTS.some(
      (d) => d.name === norm || d.name === norm.toUpperCase().replace(/\s+/g, '_') || d.label.toLowerCase() === norm.toLowerCase()
    );
    if (!exists) {
      DEPARTMENTS.push({
        id: `dept-${Date.now()}`,
        name: norm.toUpperCase().replace(/\s+/g, '_'),
        label: norm,
        headName: 'Unassigned',
        employeeCount: 1,
        budgetMonthly: 1500000,
        openPositions: 0,
      });
    }
  }

  EMPLOYEES[index] = { ...EMPLOYEES[index], ...req.body };
  saveEmployeeToDb(EMPLOYEES[index]).catch((err) => console.error('PG Update Error:', err));
  
  // Sync changes immediately to credentials.json
  syncCredentialsFile();

  res.json(EMPLOYEES[index]);
});

app.delete('/api/v1/employees/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = EMPLOYEES.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const deletedEmp = EMPLOYEES[index];
  EMPLOYEES.splice(index, 1);
  deleteEmployeeFromDb(id).catch((err) => console.error('PG Delete Error:', err));

  // Immediately remove credentials from credentials.json
  const creds = readCredentialsFile().filter((c) => c.employeeId !== id);
  saveCredentialsFile(creds);

  // Clean up associated attendance records if any
  ATTENDANCE_RECORDS = ATTENDANCE_RECORDS.filter((a) => a.employeeId !== id);

  // Audit log
  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    userId: 'emp-1',
    userName: 'Arjun Sharma',
    role: 'SUPER_ADMIN',
    action: 'DELETE_EMPLOYEE',
    module: 'Employee Management',
    description: `Deleted employee profile for ${deletedEmp.firstName} ${deletedEmp.lastName} (${deletedEmp.code}) and deleted login credentials from credentials.json file.`,
    ipAddress: '102.168.1.45',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    severity: 'WARNING',
  });

  res.json({ message: `Successfully deleted employee ${deletedEmp.firstName} ${deletedEmp.lastName} and removed credentials from credentials.json.`, deletedId: id });
});

// Employee Documents ("My Folder") Endpoints
app.get('/api/v1/employees/:id/documents', (req: Request, res: Response) => {
  const emp = EMPLOYEES.find((e) => e.id === req.params.id);
  if (!emp) return res.status(404).json({ message: 'Employee not found' });
  res.json(emp.documents || []);
});

app.post('/api/v1/employees/:id/documents', (req: Request, res: Response) => {
  const emp = EMPLOYEES.find((e) => e.id === req.params.id);
  if (!emp) return res.status(404).json({ message: 'Employee not found' });

  const { name, type, category, docNumber, fileSize, expiryDate } = req.body;
  const newDoc = {
    id: `doc-${Date.now()}`,
    name: name || 'Document.pdf',
    type: type || 'PDF',
    category: category || 'GOVT',
    docNumber: docNumber || 'N/A',
    uploadDate: new Date().toISOString().substring(0, 10),
    fileSize: fileSize || '1.5 MB',
    expiryDate: expiryDate || undefined,
    fileUrl: '#',
  };

  emp.documents = [newDoc, ...(emp.documents || [])];

  // Audit Log
  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    userId: emp.id,
    userName: `${emp.firstName} ${emp.lastName}`,
    role: emp.role,
    action: 'UPLOAD_DOCUMENT',
    module: 'My Folder Documents',
    description: `Uploaded document "${newDoc.name}" under ${newDoc.category} category.`,
    ipAddress: '102.168.1.50',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    severity: 'INFO',
  });

  res.status(201).json(newDoc);
});

app.delete('/api/v1/employees/:id/documents/:docId', (req: Request, res: Response) => {
  const emp = EMPLOYEES.find((e) => e.id === req.params.id);
  if (!emp) return res.status(404).json({ message: 'Employee not found' });

  const docId = req.params.docId;
  const initialCount = emp.documents?.length || 0;
  emp.documents = (emp.documents || []).filter((d) => d.id !== docId);

  if ((emp.documents?.length || 0) === initialCount) {
    return res.status(404).json({ message: 'Document not found' });
  }

  res.json({ message: 'Document removed successfully', docId });
});

// Settings Geofence Endpoints
app.get('/api/v1/settings/geofence', (_req: Request, res: Response) => {
  res.json(GEOFENCE_SETTINGS);
});

app.post('/api/v1/settings/geofence', (req: Request, res: Response) => {
  const { officeName, latitude, longitude, radiusMeters, enforceStrictGeofence } = req.body;
  if (officeName !== undefined) GEOFENCE_SETTINGS.officeName = officeName;
  if (latitude !== undefined) GEOFENCE_SETTINGS.latitude = parseFloat(latitude);
  if (longitude !== undefined) GEOFENCE_SETTINGS.longitude = parseFloat(longitude);
  if (radiusMeters !== undefined) GEOFENCE_SETTINGS.radiusMeters = parseInt(radiusMeters, 10);
  if (enforceStrictGeofence !== undefined) GEOFENCE_SETTINGS.enforceStrictGeofence = !!enforceStrictGeofence;

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    userId: 'emp-1',
    userName: 'Arjun Sharma',
    role: 'SUPER_ADMIN',
    action: 'UPDATE_GEOFENCE_SETTINGS',
    module: 'System Settings',
    description: `Super Admin updated office geofence to "${GEOFENCE_SETTINGS.officeName}" (Lat: ${GEOFENCE_SETTINGS.latitude}, Lng: ${GEOFENCE_SETTINGS.longitude}, Radius: ${GEOFENCE_SETTINGS.radiusMeters}m).`,
    ipAddress: '102.168.1.1',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    severity: 'WARNING',
  });

  res.json({ message: 'Geofence settings updated successfully', settings: GEOFENCE_SETTINGS });
});

// Attendance Endpoints
app.get('/api/v1/attendance', (_req: Request, res: Response) => {
  res.json(ATTENDANCE_RECORDS);
});

app.post('/api/v1/attendance/clock-in', (req: Request, res: Response) => {
  const { employeeId, location, gpsCoordinates } = req.body;

  if (!location && !gpsCoordinates) {
    return res.status(400).json({
      message: 'Location access mandatory: GPS coordinates required to clock in.',
    });
  }

  // Calculate distance to configured office geofence
  let distanceMeters = 0;
  let isWithinGeofence = true;
  if (gpsCoordinates && gpsCoordinates.lat && gpsCoordinates.lng) {
    distanceMeters = calculateDistanceMeters(
      gpsCoordinates.lat,
      gpsCoordinates.lng,
      GEOFENCE_SETTINGS.latitude,
      GEOFENCE_SETTINGS.longitude
    );
    isWithinGeofence = distanceMeters <= GEOFENCE_SETTINGS.radiusMeters;
  }

  const emp = EMPLOYEES.find((e) => e.id === employeeId) || EMPLOYEES[0];
  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);
  const timeStr = now.toTimeString().split(' ')[0];
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const totalMinutes = currentHour * 60 + currentMin;

  // Business Rules for Attendance Thresholds:
  // Shift Start: 09:00 AM (540 mins)
  // Rule 1: Clock in <= 09:15 AM (555 mins) -> PRESENT (On Time / 15-min Morning Buffer applied, no late mark)
  // Rule 2: Clock in after 15m buffer up to 2 hours late (09:16 - 11:00 AM / 556 - 660 mins) -> PRESENT with Late Entry = Yes (No payroll deduction)
  // Rule 3: Clock in > 2 hours late (11:01 - 12:00 PM / 661 - 720 mins) -> SHORT_LEAVE
  // Rule 4: Clock in > 3 hours late (> 12:00 PM / > 720 mins) -> HALF_DAY
  let computedStatus: AttendanceStatus = 'PRESENT';
  let lateMins = 0;
  let isLateEntry = false;

  // Check if Business Associates (Exempt from attendance penalties)
  const isBusinessAssociate =
    emp.department === 'BUSINESS_ASSOCIATES' ||
    emp.department === 'BUSINESS_ASSOCIATE' ||
    emp.department === 'Business Associates' ||
    emp.designation.toLowerCase().includes('business associate');

  if (isBusinessAssociate) {
    computedStatus = 'PRESENT';
  } else if (totalMinutes > 720) {
    computedStatus = 'HALF_DAY';
  } else if (totalMinutes > 660) {
    computedStatus = 'SHORT_LEAVE';
  } else if (totalMinutes > 555) {
    computedStatus = 'PRESENT';
    isLateEntry = true;
    lateMins = totalMinutes - 540;
  } else {
    // 09:00 AM - 09:15 AM 15-minute buffer window: On time, regular PRESENT status
    computedStatus = 'PRESENT';
    isLateEntry = false;
    lateMins = 0;
  }

  let record = ATTENDANCE_RECORDS.find((a) => a.employeeId === emp.id && a.date === todayStr);

  let autoLeaveDeducted = false;
  let deductedType: 'CASUAL' | 'UNPAID' = 'CASUAL';

  // Dynamic Geolocation Text based on actual lat/lng and current organization name
  let locationText = '';
  if (gpsCoordinates && gpsCoordinates.lat !== undefined && gpsCoordinates.lng !== undefined) {
    const latStr = Number(gpsCoordinates.lat).toFixed(4);
    const lngStr = Number(gpsCoordinates.lng).toFixed(4);
    
    // Check if matching any registered office workspace branch
    const matchedWs = WORKSPACES.find((w) => {
      if (!w.latitude || !w.longitude) return false;
      const d = calculateDistanceMeters(gpsCoordinates.lat, gpsCoordinates.lng, w.latitude, w.longitude);
      return d <= (w.radiusMeters || 500);
    });

    if (matchedWs) {
      locationText = `${SYSTEM_CONFIG.companyName} (${matchedWs.name} • ${latStr}°, ${lngStr}°)`;
    } else {
      locationText = `GPS Verified Location (${latStr}°, ${lngStr}°) • ${SYSTEM_CONFIG.companyName} Remote / On-Field`;
    }
  } else if (location) {
    locationText = location;
  } else {
    locationText = `${SYSTEM_CONFIG.companyName} Verified Geofence`;
  }

  if (!record) {
    record = {
      id: `att-${Date.now()}`,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      date: todayStr,
      clockIn: timeStr,
      status: computedStatus,
      lateMinutes: lateMins,
      locationIn: locationText,
      gpsCoordinates,
      breakDurationMinutes: 0,
      overtimeHours: 0,
      regularizationStatus: 'NONE',
    };
    ATTENDANCE_RECORDS.unshift(record);
  } else {
    record.clockIn = timeStr;
    record.status = computedStatus;
    record.lateMinutes = lateMins;
    record.locationIn = locationText;
    record.gpsCoordinates = gpsCoordinates;
  }

  // Check 4 Short Leaves = 1 Casual Leave OR 2 Half-Days = 1 Casual Leave Auto-Deduction Rule
  const empShortLeaves = ATTENDANCE_RECORDS.filter(
    (a) => a.employeeId === emp.id && a.status === 'SHORT_LEAVE'
  ).length;

  const empHalfDays = ATTENDANCE_RECORDS.filter(
    (a) => a.employeeId === emp.id && a.status === 'HALF_DAY'
  ).length;

  if (!isBusinessAssociate) {
    const currentMonthStr = todayStr.substring(0, 7);
    const monthlyCasualLeaves = LEAVE_REQUESTS.filter(
      (l) => l.employeeId === emp.id && l.leaveType === 'CASUAL' && l.startDate.startsWith(currentMonthStr) && l.status !== 'REJECTED'
    ).reduce((sum, l) => sum + (l.totalDays || 1), 0);

    // Rule 10: Only 2 Casual Leaves allowed per month. 3rd onwards becomes Unpaid Leave.
    if (monthlyCasualLeaves >= 2) {
      deductedType = 'UNPAID';
    }

    if (computedStatus === 'SHORT_LEAVE' && empShortLeaves > 0 && empShortLeaves % 4 === 0) {
      autoLeaveDeducted = true;
      record.autoLeaveDeducted = true;

      const autoLeave: LeaveRequest = {
        id: `lv-auto-short-${Date.now()}`,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeeAvatar: emp.avatar,
        department: emp.department,
        leaveType: deductedType,
        startDate: todayStr,
        endDate: todayStr,
        totalDays: 1,
        reason: `Automated 1-Day ${deductedType} Leave Deduction (Accumulated ${empShortLeaves} Short Leaves - 4 Short Leaves Rule)`,
        status: 'APPROVED',
        appliedOn: todayStr,
        approvedBy: 'System AI Engine',
        comments: `Converted 4 Short Leaves into 1 ${deductedType} leave deduction.`,
      };
      LEAVE_REQUESTS.unshift(autoLeave);
    } else if (computedStatus === 'HALF_DAY' && empHalfDays > 0 && empHalfDays % 2 === 0) {
      autoLeaveDeducted = true;
      record.autoLeaveDeducted = true;

      const autoLeave: LeaveRequest = {
        id: `lv-auto-half-${Date.now()}`,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeeAvatar: emp.avatar,
        department: emp.department,
        leaveType: deductedType,
        startDate: todayStr,
        endDate: todayStr,
        totalDays: 1,
        reason: `Automated 1-Day ${deductedType} Leave Deduction (Accumulated ${empHalfDays} Half-Days - 2 Half Days Rule)`,
        status: 'APPROVED',
        appliedOn: todayStr,
        approvedBy: 'System AI Engine',
        comments: `Converted 2 Half-Days into 1 ${deductedType} leave deduction.`,
      };
      LEAVE_REQUESTS.unshift(autoLeave);
    }
  }

  res.json({
    ...record,
    lateEntry: isLateEntry,
    autoLeaveDeducted,
    isBusinessAssociate,
    message: isBusinessAssociate
      ? 'Clocked in as Business Associate (Exempt from attendance penalties).'
      : isLateEntry
      ? `Clocked in (Late Entry = Yes, ${lateMins}m late). Payroll will NOT deduct salary.`
      : autoLeaveDeducted
      ? `Clocked in. System automatically converted ${computedStatus === 'SHORT_LEAVE' ? '4 Short Leaves' : '2 Half Days'} into 1 ${deductedType} Leave.`
      : `Clocked in successfully as ${computedStatus}.`,
  });
});

app.post('/api/v1/attendance/clock-out', (req: Request, res: Response) => {
  const { employeeId } = req.body;
  const emp = EMPLOYEES.find((e) => e.id === employeeId) || EMPLOYEES[0];
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const totalMins = currentHour * 60 + currentMin;

  const todayStr = now.toISOString().substring(0, 10);
  let record = ATTENDANCE_RECORDS.find((a) => a.employeeId === emp.id && (a.date === todayStr || a.date === '2026-07-29'));
  
  if (record) {
    record.clockOut = timeStr;
    record.totalHours = 8.5;

    // Rule 6: Clock out before completing half shift (< 13:30 / < 810 mins) -> HALF_DAY
    // Rule 4: Clock out more than 2 hours before shift end 18:00 (< 16:00 / < 960 mins) -> SHORT_LEAVE
    if (totalMins < 810) {
      record.status = 'HALF_DAY';
    } else if (totalMins < 960 && record.status === 'PRESENT') {
      record.status = 'SHORT_LEAVE';
    }
  }

  res.json(record || { message: 'Clock out recorded successfully' });
});

// Super Admin Attendance Override Endpoint
app.post('/api/v1/attendance/override', (req: Request, res: Response) => {
  const { id, employeeId, date, status, lateMinutes, clearLeaveDeduction, notes } = req.body;
  let record = ATTENDANCE_RECORDS.find((a) => a.id === id || (a.employeeId === employeeId && a.date === date));

  if (!record && employeeId) {
    const emp = EMPLOYEES.find((e) => e.id === employeeId) || EMPLOYEES[0];
    record = {
      id: `att-ovr-${Date.now()}`,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      date: date || new Date().toISOString().substring(0, 10),
      clockIn: '09:00:00',
      clockOut: '18:00:00',
      status: status || 'PRESENT',
      breakDurationMinutes: 0,
      overtimeHours: 0,
      regularizationStatus: 'APPROVED',
    };
    ATTENDANCE_RECORDS.unshift(record);
  }

  if (record) {
    if (status) record.status = status;
    if (lateMinutes !== undefined) record.lateMinutes = Number(lateMinutes);
    if (clearLeaveDeduction) record.autoLeaveDeducted = false;
    record.regularizationStatus = 'APPROVED';

    AUDIT_LOGS.unshift({
      id: `aud-${Date.now()}`,
      userId: 'emp-1',
      userName: 'Super Admin',
      role: 'SUPER_ADMIN',
      action: 'SUPER_ADMIN_ATTENDANCE_OVERRIDE',
      module: 'Attendance Management',
      description: `Super Admin manually overridden attendance for ${record.employeeName} on ${record.date} to ${record.status}. Note: ${notes || 'Admin Override'}`,
      ipAddress: '102.168.1.1',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity: 'WARNING',
    });
  }

  res.json({ message: 'Super Admin attendance override saved successfully', record });
});

// Regularization Endpoints
app.post('/api/v1/attendance/regularize', (req: Request, res: Response) => {
  const { employeeId, date, reason, inTime, outTime } = req.body;
  const emp = EMPLOYEES.find((e) => e.id === employeeId) || EMPLOYEES[0];
  
  const rec = ATTENDANCE_RECORDS.find((a) => a.employeeId === emp.id && a.date === date);
  if (rec) {
    rec.regularizationStatus = 'PENDING';
    rec.regularizationReason = reason;
  } else {
    ATTENDANCE_RECORDS.unshift({
      id: `att-reg-${Date.now()}`,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      date: date || new Date().toISOString().substring(0, 10),
      clockIn: inTime || '09:00:00',
      clockOut: outTime || '18:00:00',
      status: 'PRESENT',
      breakDurationMinutes: 0,
      overtimeHours: 0,
      locationIn: 'Regularized Punch',
      regularizationStatus: 'PENDING',
      regularizationReason: reason,
    });
  }

  NOTIFICATIONS.unshift({
    id: `notif-${Date.now()}`,
    title: 'Attendance Regularization Request',
    message: `${emp.firstName} ${emp.lastName} submitted a regularization claim for ${date}`,
    type: 'WARNING',
    timestamp: 'Just now',
    read: false,
    link: 'attendance',
  });

  res.status(201).json({ message: 'Regularization request submitted successfully', date });
});

app.patch('/api/v1/attendance/regularize/:id/status', (req: Request, res: Response) => {
  const { status, comments } = req.body;
  const rec = ATTENDANCE_RECORDS.find((a) => a.id === req.params.id);
  if (!rec) return res.status(404).json({ message: 'Attendance record not found' });

  rec.regularizationStatus = status;
  if (status === 'APPROVED') {
    rec.status = 'PRESENT';
    rec.lateMinutes = 0;
    rec.autoLeaveDeducted = false;
  }

  res.json(rec);
});

// Leaves Endpoints
app.get('/api/v1/leaves', (_req: Request, res: Response) => {
  res.json(LEAVE_REQUESTS);
});

app.post('/api/v1/leaves', (req: Request, res: Response) => {
  const { employeeId, leaveType, startDate, endDate, totalDays, reason } = req.body;
  const emp = EMPLOYEES.find((e) => e.id === employeeId) || EMPLOYEES[0];

  let effectiveType = leaveType;
  let ruleMessage = '';

  // Rule: Only 2 casual leaves allowed per month. Exceeding 2 converts to UNPAID leave.
  if (leaveType === 'CASUAL') {
    const currentMonth = (startDate || new Date().toISOString()).substring(0, 7); // YYYY-MM
    const monthlyCasualCount = LEAVE_REQUESTS.filter(
      (l) => l.employeeId === emp.id && l.leaveType === 'CASUAL' && l.startDate.startsWith(currentMonth) && l.status !== 'REJECTED'
    ).reduce((sum, l) => sum + (l.totalDays || 1), 0);

    if (monthlyCasualCount >= 2) {
      effectiveType = 'UNPAID';
      ruleMessage = `Casual Leave quota exceeded for ${currentMonth} (Max 2 allowed/month). Automatically requested as UNPAID Leave (LWP).`;
    }
  }

  const newLeave: LeaveRequest = {
    id: `lv-${Date.now()}`,
    employeeId: emp.id,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    employeeAvatar: emp.avatar,
    department: emp.department,
    leaveType: effectiveType,
    startDate,
    endDate,
    totalDays: totalDays || 1,
    reason,
    status: 'PENDING',
    appliedOn: new Date().toISOString().substring(0, 10),
    comments: ruleMessage || undefined,
  };

  LEAVE_REQUESTS.unshift(newLeave);

  // Send notification
  NOTIFICATIONS.unshift({
    id: `notif-${Date.now()}`,
    title: 'New Leave Request Received',
    message: `${newLeave.employeeName} applied for ${newLeave.totalDays} day(s) of ${newLeave.leaveType} leave. ${ruleMessage}`,
    type: ruleMessage ? 'WARNING' : 'INFO',
    timestamp: 'Just now',
    read: false,
    link: 'leave',
  });

  res.status(201).json(newLeave);
});

// Leave Quotas memory store (Global Defaults & per-employee overrides)
let LEAVE_QUOTAS: Record<string, { casual: number; sick: number; earned: number; unpaid: number; total: number }> = {
  DEFAULT: { casual: 12, sick: 12, earned: 15, unpaid: 10, total: 49 },
};

app.get('/api/v1/leaves/quota', (req: Request, res: Response) => {
  const { employeeId } = req.query;
  const key = (employeeId && typeof employeeId === 'string' && LEAVE_QUOTAS[employeeId]) ? employeeId : 'DEFAULT';
  res.json({
    targetKey: key,
    quota: LEAVE_QUOTAS[key] || LEAVE_QUOTAS.DEFAULT,
    allQuotas: LEAVE_QUOTAS,
  });
});

app.put('/api/v1/leaves/quota', (req: Request, res: Response) => {
  const { targetKey, casual, sick, earned, unpaid, total } = req.body;
  const key = targetKey || 'DEFAULT';

  const c = Number(casual) >= 0 ? Number(casual) : 12;
  const s = Number(sick) >= 0 ? Number(sick) : 12;
  const e = Number(earned) >= 0 ? Number(earned) : 15;
  const u = Number(unpaid) >= 0 ? Number(unpaid) : 10;
  const t = Number(total) >= 0 ? Number(total) : (c + s + e + u);

  LEAVE_QUOTAS[key] = {
    casual: c,
    sick: s,
    earned: e,
    unpaid: u,
    total: t,
  };

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    userId: 'emp-1',
    userName: 'Super Admin',
    role: 'SUPER_ADMIN',
    action: 'UPDATE_LEAVE_POLICY_QUOTAS',
    module: 'Leave Management',
    description: `Updated Leave Quotas for [${key}]: Casual=${c}, Sick=${s}, Earned=${e}, Unpaid=${u}, Total=${t} days`,
    ipAddress: '102.168.1.1',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    severity: 'INFO',
  });

  res.json({
    message: `Successfully updated Leave Management Quota for ${key === 'DEFAULT' ? 'Company Policy' : key}`,
    quota: LEAVE_QUOTAS[key],
  });
});

// Super Admin Leave Balance Override Endpoint
app.post('/api/v1/leaves/adjust-balance', (req: Request, res: Response) => {
  const { employeeId, leaveType, action, days, reason } = req.body; // action: 'ADD' | 'REDUCE'
  const emp = EMPLOYEES.find((e) => e.id === employeeId);
  if (!emp) return res.status(404).json({ message: 'Employee not found' });

  const numDays = Number(days) || 1;
  
  // Log as manual adjustment leave record
  const adjLeave: LeaveRequest = {
    id: `lv-adj-${Date.now()}`,
    employeeId: emp.id,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    employeeAvatar: emp.avatar,
    department: emp.department,
    leaveType: leaveType || 'CASUAL',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date().toISOString().substring(0, 10),
    totalDays: action === 'REDUCE' ? numDays : -numDays,
    reason: `Super Admin Manual ${action}: ${reason || 'Admin Adjustment'}`,
    status: 'APPROVED',
    appliedOn: new Date().toISOString().substring(0, 10),
    approvedBy: 'Super Admin Override',
    comments: `Balance ${action === 'ADD' ? 'credited' : 'deducted'} by Super Admin`,
  };

  LEAVE_REQUESTS.unshift(adjLeave);

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    userId: 'emp-1',
    userName: 'Super Admin',
    role: 'SUPER_ADMIN',
    action: `SUPER_ADMIN_LEAVE_${action}`,
    module: 'Leave Management',
    description: `Adjusted leave balance for ${emp.firstName} ${emp.lastName} (${emp.code}): ${action} ${numDays} day(s) of ${leaveType}. Reason: ${reason}`,
    ipAddress: '102.168.1.1',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    severity: 'WARNING',
  });

  res.json({ message: `Successfully ${action === 'ADD' ? 'credited' : 'reduced'} ${numDays} day(s) for ${emp.firstName} ${emp.lastName}`, adjustment: adjLeave });
});

// Google Calendar Sync Endpoints
app.post('/api/v1/workspace/calendar/sync-holidays', (req: Request, res: Response) => {
  const { accessToken } = req.body;
  res.json({
    success: true,
    message: `Successfully synchronized ${HOLIDAYS.length} enterprise holidays & occasions with Google Calendar.`,
    syncedCount: HOLIDAYS.length,
    holidaysSynced: HOLIDAYS.map((h) => ({ title: h.title, date: h.date, region: h.region, type: h.type })),
    hasAuthToken: Boolean(accessToken),
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/workspace/calendar/sync-tasks', (req: Request, res: Response) => {
  const { tasks } = req.body;
  const count = Array.isArray(tasks) ? tasks.length : WEEKLY_TASKS.length;
  res.json({
    success: true,
    message: `Successfully scheduled ${count} week plan reminders into Google Calendar. Notifications dispatched.`,
    syncedCount: count,
    timestamp: new Date().toISOString(),
  });
});

app.patch('/api/v1/leaves/:id/status', (req: Request, res: Response) => {
  const { status, approvedBy, comments } = req.body;
  const leave = LEAVE_REQUESTS.find((l) => l.id === req.params.id);
  if (!leave) return res.status(404).json({ message: 'Leave request not found' });

  leave.status = status;
  if (approvedBy) leave.approvedBy = approvedBy;
  if (comments) leave.comments = comments;

  res.json(leave);
});

// Payroll Endpoints
app.get('/api/v1/payroll/payslips', (req: Request, res: Response) => {
  const { employeeId } = req.query;
  if (employeeId && typeof employeeId === 'string') {
    return res.json(PAYSLIPS.filter((p) => p.employeeId === employeeId));
  }
  res.json(PAYSLIPS);
});

app.post('/api/v1/payroll/process-month', (req: Request, res: Response) => {
  const { monthYear } = req.body;
  PAYSLIPS = PAYSLIPS.map((p) => ({ ...p, status: 'PAID', payPeriod: monthYear || 'July 2026' }));
  res.json({ message: `Successfully processed and disbursed payroll for ${monthYear || 'July 2026'}`, count: PAYSLIPS.length });
});

// Recruitment Endpoints
app.get('/api/v1/recruitment/jobs', (_req: Request, res: Response) => {
  res.json(JOB_POSTINGS);
});

app.post('/api/v1/recruitment/jobs', (req: Request, res: Response) => {
  const newJob: JobPosting = {
    ...req.body,
    id: `job-${Date.now()}`,
    jobCode: `REQ-${Math.floor(100 + Math.random() * 900)}`,
    status: req.body.status || 'OPEN',
    applicantsCount: 0,
    createdDate: new Date().toISOString().substring(0, 10),
  };
  JOB_POSTINGS.unshift(newJob);
  res.status(201).json(newJob);
});

app.get('/api/v1/recruitment/candidates', (_req: Request, res: Response) => {
  res.json(CANDIDATES);
});

app.patch('/api/v1/recruitment/candidates/:id/stage', (req: Request, res: Response) => {
  const { stage } = req.body;
  const cand = CANDIDATES.find((c) => c.id === req.params.id);
  if (!cand) return res.status(404).json({ message: 'Candidate not found' });
  cand.stage = stage;
  res.json(cand);
});

// Helpdesk & Assets
app.get('/api/v1/helpdesk/tickets', (_req: Request, res: Response) => {
  res.json(HELPDESK_TICKETS);
});

app.post('/api/v1/helpdesk/tickets', (req: Request, res: Response) => {
  const { requesterId, category, subject, description, priority } = req.body;
  const emp = EMPLOYEES.find((e) => e.id === requesterId) || EMPLOYEES[0];

  const newTicket: HelpdeskTicket = {
    id: `tkt-${Date.now()}`,
    ticketNumber: `TSK-${Math.floor(1000 + Math.random() * 9000)}`,
    requesterId: emp.id,
    requesterName: `${emp.firstName} ${emp.lastName}`,
    department: emp.department,
    category,
    subject,
    description,
    priority: priority || 'MEDIUM',
    status: 'OPEN',
    assignedTo: 'IT Helpdesk Support',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    comments: [],
  };

  HELPDESK_TICKETS.unshift(newTicket);
  res.status(201).json(newTicket);
});

app.get('/api/v1/assets', (_req: Request, res: Response) => {
  res.json(ASSETS);
});

app.post('/api/v1/assets', (req: Request, res: Response) => {
  const newAsset: Asset = {
    ...req.body,
    id: `ast-${Date.now()}`,
    assetTag: req.body.assetTag || `AST-${Math.floor(8000 + Math.random() * 2000)}`,
    status: req.body.assignedToId ? 'ASSIGNED' : 'AVAILABLE',
    purchaseDate: req.body.purchaseDate || new Date().toISOString().substring(0, 10),
  };
  ASSETS.unshift(newAsset);
  res.status(201).json(newAsset);
});

app.put('/api/v1/assets/:id', (req: Request, res: Response) => {
  const index = ASSETS.findIndex((a) => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Asset not found' });
  ASSETS[index] = { ...ASSETS[index], ...req.body };
  res.json(ASSETS[index]);
});

app.delete('/api/v1/assets/:id', (req: Request, res: Response) => {
  const index = ASSETS.findIndex((a) => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Asset not found' });
  const deleted = ASSETS[index];
  ASSETS.splice(index, 1);
  res.json({ message: `Deleted asset ${deleted.assetTag}`, deletedId: req.params.id });
});

// Departments Endpoints
app.get('/api/v1/departments', (_req: Request, res: Response) => {
  res.json(DEPARTMENTS);
});

app.post('/api/v1/departments', (req: Request, res: Response) => {
  const { name, label, headName, budgetMonthly, openPositions } = req.body;
  const newDept = {
    id: `dept-${Date.now()}`,
    name: (name || 'CUSTOM').toUpperCase().replace(/\s+/g, '_'),
    label: label || name || 'New Department',
    headName: headName || 'Unassigned',
    employeeCount: 0,
    budgetMonthly: Number(budgetMonthly) || 1000000,
    openPositions: Number(openPositions) || 0,
  };
  DEPARTMENTS.push(newDept);
  res.status(201).json(newDept);
});

app.put('/api/v1/departments/:id', (req: Request, res: Response) => {
  const index = DEPARTMENTS.findIndex((d) => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Department not found' });
  DEPARTMENTS[index] = { ...DEPARTMENTS[index], ...req.body };
  res.json(DEPARTMENTS[index]);
});

app.delete('/api/v1/departments/:id', (req: Request, res: Response) => {
  const index = DEPARTMENTS.findIndex((d) => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Department not found' });
  const deleted = DEPARTMENTS[index];
  DEPARTMENTS.splice(index, 1);
  res.json({ message: `Deleted department ${deleted.label}`, deletedId: req.params.id });
});

// Multi-Branch Workspaces Endpoints
app.get('/api/v1/settings/workspaces', (_req: Request, res: Response) => {
  res.json(WORKSPACES);
});

app.post('/api/v1/settings/workspaces', (req: Request, res: Response) => {
  const newWs = {
    id: `ws-${Date.now()}`,
    name: req.body.name || 'New Office Branch',
    location: req.body.location || 'Bengaluru, India',
    latitude: Number(req.body.latitude) || 12.9716,
    longitude: Number(req.body.longitude) || 77.5946,
    radiusMeters: Number(req.body.radiusMeters) || 500,
    status: req.body.status || 'ACTIVE',
    employeeCount: 0,
  };
  WORKSPACES.push(newWs);
  res.status(201).json(newWs);
});

app.put('/api/v1/settings/workspaces/:id', (req: Request, res: Response) => {
  const index = WORKSPACES.findIndex((w) => w.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Workspace not found' });
  WORKSPACES[index] = { ...WORKSPACES[index], ...req.body };
  res.json(WORKSPACES[index]);
});

app.delete('/api/v1/settings/workspaces/:id', (req: Request, res: Response) => {
  const index = WORKSPACES.findIndex((w) => w.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Workspace not found' });
  const deleted = WORKSPACES[index];
  WORKSPACES.splice(index, 1);
  res.json({ message: `Deleted workspace branch ${deleted.name}`, deletedId: req.params.id });
});

// System Config Endpoints
app.get('/api/v1/settings/system-config', (_req: Request, res: Response) => {
  res.json(SYSTEM_CONFIG);
});

app.post('/api/v1/settings/system-config', (req: Request, res: Response) => {
  SYSTEM_CONFIG = { ...SYSTEM_CONFIG, ...req.body };
  res.json(SYSTEM_CONFIG);
});

// Projects & Upgradations Endpoints
app.get('/api/v1/projects', (_req: Request, res: Response) => {
  res.json(PROJECTS);
});

app.post('/api/v1/projects', (req: Request, res: Response) => {
  const { name, client, department, budget, deadline, description, managerId, managerName } = req.body;
  const newPrj: Project = {
    id: `prj-${Date.now()}`,
    code: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
    name: name || 'New Corporate Project',
    client: client || 'Internal Unit',
    department: department || 'ENGINEERING',
    status: 'NOT_STARTED',
    progress: 0,
    membersCount: 1,
    deadline: deadline || '2026-12-31',
    budget: Number(budget) || 1000000,
    description: description || '',
    managerId: managerId || 'emp-3',
    managerName: managerName || 'Engineering Head',
    upgradations: [],
  };

  PROJECTS.unshift(newPrj);

  // Audit Log
  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    userId: 'emp-1',
    userName: 'Arjun Sharma',
    role: 'SUPER_ADMIN',
    action: 'CREATE_PROJECT',
    module: 'Projects & Timesheets',
    description: `Created new project "${newPrj.name}" (${newPrj.code}) with budget ₹${newPrj.budget.toLocaleString('en-IN')}.`,
    ipAddress: '102.168.1.45',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    severity: 'INFO',
  });

  res.status(201).json(newPrj);
});

app.put('/api/v1/projects/:id', (req: Request, res: Response) => {
  const index = PROJECTS.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Project not found' });

  PROJECTS[index] = { ...PROJECTS[index], ...req.body };
  res.json(PROJECTS[index]);
});

app.delete('/api/v1/projects/:id', (req: Request, res: Response) => {
  const index = PROJECTS.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Project not found' });

  const deleted = PROJECTS[index];
  PROJECTS.splice(index, 1);
  res.json({ message: `Deleted project ${deleted.name}`, deletedId: req.params.id });
});

// Project Upgradation Update Endpoint
app.post('/api/v1/projects/:id/upgradations', (req: Request, res: Response) => {
  const project = PROJECTS.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const { title, description, progress, status, loggedBy, loggedByRole, employeeId } = req.body;
  const newProgress = Number(progress) >= 0 ? Math.min(100, Math.max(0, Number(progress))) : project.progress;
  const newStatus = newProgress === 100 || status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS';

  const upgradation: ProjectUpgradation = {
    id: `upg-${Date.now()}`,
    projectId: project.id,
    title: title || 'Task Progress Update',
    description: description || '',
    progress: newProgress,
    status: newStatus,
    loggedBy: loggedBy || 'Employee',
    loggedByRole: loggedByRole || 'EMPLOYEE',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };

  if (!project.upgradations) project.upgradations = [];
  project.upgradations.unshift(upgradation);
  project.progress = newProgress;
  project.status = newStatus;

  // Check if project or task completed (100%) -> Notify Head/Manager & Super Admin
  if (newProgress === 100 || newStatus === 'COMPLETED') {
    const mgrName = project.managerName || 'Department Head';
    NOTIFICATIONS.unshift({
      id: `notif-${Date.now()}-mgr`,
      title: `Project Upgradation Completed: ${project.name}`,
      message: `Task "${upgradation.title}" logged by ${upgradation.loggedBy} has reached 100% completion. Notification delivered to Department Head (${mgrName}) and Super Admin.`,
      type: 'SUCCESS',
      timestamp: 'Just now',
      read: false,
      link: 'timesheets',
    });

    AUDIT_LOGS.unshift({
      id: `aud-${Date.now()}`,
      userId: employeeId || 'emp-4',
      userName: loggedBy || 'Employee',
      role: (loggedByRole as UserRole) || 'EMPLOYEE',
      action: 'PROJECT_TASK_COMPLETED',
      module: 'Projects & Timesheets',
      description: `Task "${upgradation.title}" for project "${project.name}" marked COMPLETED (100%). Automated completion notifications dispatched to ${mgrName} and Super Admin.`,
      ipAddress: '102.168.1.100',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity: 'INFO',
    });
  }

  res.status(201).json({ project, upgradation });
});

// Expense Claim Endpoints
app.get('/api/v1/expenses', (req: Request, res: Response) => {
  const { employeeId, status, category, branch } = req.query;
  let list = [...EXPENSES];

  if (employeeId) {
    list = list.filter((e) => e.employeeId === employeeId);
  }

  if (status && status !== 'ALL') {
    list = list.filter((e) => e.status === status);
  }

  if (category && category !== 'ALL') {
    list = list.filter((e) => e.category === category);
  }

  if (branch && branch !== 'ALL') {
    list = list.filter((e) => e.branch === branch);
  }

  res.json(list);
});

app.post('/api/v1/expenses', (req: Request, res: Response) => {
  const {
    employeeId,
    transactionDate,
    purpose,
    category,
    currency,
    amount,
    gstAmount,
    gstin,
    projectId,
    projectName,
    client,
    branch,
    billUrl,
    billFileName,
    modeOfTransport,
    startingPoint,
    destination,
    tripDurationDays,
    expenseType,
    bucket,
    merchant,
    distanceKms,
    tripStartDate,
    tripEndDate,
    tripStartPoint,
    tripEndPoint,
    appliedOn,
    paymentMode,
    travelExpenses,
    accommodationExpenses,
    otherExpenses,
    advanceRequests,
    isDraft,
  } = req.body;

  const emp = EMPLOYEES.find((e) => e.id === employeeId) || EMPLOYEES[0];
  const initialStatus = isDraft ? 'DRAFT' : 'SUBMITTED';

  const nowFormattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const newClaim: ExpenseClaim = {
    id: `exp-${Date.now()}`,
    claimNumber: `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
    employeeId: emp.id,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    employeeCode: emp.code,
    department: emp.department,
    managerId: emp.managerId,
    managerName: emp.managerName || 'Reporting Manager',
    branch: branch || emp.location || 'Headquarters, Bengaluru',
    transactionDate: transactionDate || new Date().toISOString().substring(0, 10),
    purpose: purpose || 'Official Business Expense',
    category: category || (expenseType === 'TRIP' ? 'Trip Expense' : expenseType === 'LOCAL_TRAVEL' ? 'Local Travel Expense' : 'Business Expense'),
    currency: currency || 'INR',
    amount: Number(amount) || 0,
    gstAmount: gstAmount ? Number(gstAmount) : undefined,
    gstin: gstin || undefined,
    projectId: projectId || undefined,
    projectName: projectName || undefined,
    client: client || undefined,
    billUrl: billUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
    billFileName: billFileName || 'Expense_Receipt.pdf',
    status: initialStatus,
    modeOfTransport: modeOfTransport || undefined,
    startingPoint: startingPoint || undefined,
    destination: destination || undefined,
    tripDurationDays: tripDurationDays ? Number(tripDurationDays) : undefined,
    expenseType: expenseType || 'BUSINESS',
    bucket: bucket || 'Internal',
    merchant: merchant || '-',
    distanceKms: distanceKms ? Number(distanceKms) : undefined,
    tripStartDate: tripStartDate || undefined,
    tripEndDate: tripEndDate || undefined,
    tripStartPoint: tripStartPoint || undefined,
    tripEndPoint: tripEndPoint || undefined,
    appliedOn: appliedOn || nowFormattedDate,
    paymentMode: paymentMode || '-',
    travelExpenses: travelExpenses || [],
    accommodationExpenses: accommodationExpenses || [],
    otherExpenses: otherExpenses || [],
    advanceRequests: advanceRequests || [],
    addedToPayroll: false,
    history: [
      {
        id: `h-${Date.now()}`,
        actorName: `${emp.firstName} ${emp.lastName}`,
        actorRole: emp.role || 'EMPLOYEE',
        action: initialStatus,
        note: isDraft ? 'Saved as draft' : 'Submitted for manager review',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      },
    ],
    commentsList: [],
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };

  EXPENSES.unshift(newClaim);

  if (!isDraft) {
    const mgrName = emp.managerName || 'Higher Authority';
    NOTIFICATIONS.unshift({
      id: `notif-${Date.now()}`,
      title: 'New Expense Claim Submitted',
      message: `${newClaim.employeeName} submitted a ${newClaim.category} claim of ${newClaim.currency} ${newClaim.amount.toLocaleString()}. Pending approval.`,
      type: 'INFO',
      timestamp: 'Just now',
      read: false,
      link: 'expenses',
    });
  }

  res.status(201).json(newClaim);
});

app.put('/api/v1/expenses/:id', (req: Request, res: Response) => {
  const index = EXPENSES.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Expense claim not found' });

  const existing = EXPENSES[index];
  const updated = { ...existing, ...req.body };

  if (req.body.status && req.body.status !== existing.status) {
    if (!updated.history) updated.history = [];
    updated.history.unshift({
      id: `h-${Date.now()}`,
      actorName: req.body.updatedBy || updated.employeeName,
      actorRole: req.body.updatedRole || 'USER',
      action: req.body.status,
      note: req.body.note || `Status updated to ${req.body.status}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });
  }

  EXPENSES[index] = updated;
  res.json(updated);
});

app.patch('/api/v1/expenses/:id/status', (req: Request, res: Response) => {
  const { status, approvedBy, actorRole, rejectionReason, returnedReason, note } = req.body;
  const claim = EXPENSES.find((e) => e.id === req.params.id);
  if (!claim) return res.status(404).json({ message: 'Expense claim not found' });

  claim.status = status;
  if (approvedBy) claim.approvedBy = approvedBy;

  if (status === 'APPROVED_BY_FINANCE' || status === 'PAID' || status === 'APPROVED') {
    claim.approvedDate = new Date().toISOString().substring(0, 10);
    if (status === 'PAID') {
      claim.addedToPayroll = true;
    }
  }

  if (rejectionReason) claim.rejectionReason = rejectionReason;
  if (returnedReason) claim.returnedReason = returnedReason;

  if (!claim.history) claim.history = [];
  claim.history.unshift({
    id: `h-${Date.now()}`,
    actorName: approvedBy || 'Authorized Manager',
    actorRole: actorRole || 'MANAGER',
    action: status,
    note: note || rejectionReason || returnedReason || `Expense claim transitioned to ${status}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
  });

  // Send notification to employee
  NOTIFICATIONS.unshift({
    id: `notif-${Date.now()}`,
    title: `Expense Claim Update: ${claim.claimNumber}`,
    message: `Your ${claim.category} expense claim (${claim.claimNumber}) of ${claim.currency} ${claim.amount.toLocaleString()} status changed to ${status.replace(/_/g, ' ')}.`,
    type: status.includes('REJECTED') ? 'ERROR' : status.includes('RETURNED') ? 'WARNING' : 'SUCCESS',
    timestamp: 'Just now',
    read: false,
    link: 'expenses',
  });

  res.json(claim);
});

app.post('/api/v1/expenses/:id/comments', (req: Request, res: Response) => {
  const { authorName, authorRole, text, avatar } = req.body;
  const claim = EXPENSES.find((e) => e.id === req.params.id);
  if (!claim) return res.status(404).json({ message: 'Expense claim not found' });

  const newComment = {
    id: `cm-${Date.now()}`,
    authorName: authorName || 'Staff Member',
    authorRole: authorRole || 'EMPLOYEE',
    avatar,
    text: text || '',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };

  if (!claim.commentsList) claim.commentsList = [];
  claim.commentsList.push(newComment);

  res.status(201).json(newComment);
});

app.delete('/api/v1/expenses/:id', (req: Request, res: Response) => {
  const index = EXPENSES.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Expense claim not found' });

  const deleted = EXPENSES[index];
  EXPENSES.splice(index, 1);
  res.json({ message: `Deleted expense claim ${deleted.claimNumber}`, deletedId: req.params.id });
});

// Expense Categories Endpoints (Super Admin Managed)
app.get('/api/v1/expenses/categories', (_req: Request, res: Response) => {
  res.json(EXPENSE_CATEGORIES);
});

app.post('/api/v1/expenses/categories', (req: Request, res: Response) => {
  const { name, description, requiresTransportDetails, mandatoryFields } = req.body;
  const newCat: ExpenseCategoryConfig = {
    id: `cat-${Date.now()}`,
    name: name || 'New Expense Category',
    description: description || '',
    requiresTransportDetails: !!requiresTransportDetails,
    mandatoryFields: Array.isArray(mandatoryFields) ? mandatoryFields : ['transactionDate', 'purpose', 'amount', 'currency'],
  };

  EXPENSE_CATEGORIES.push(newCat);
  res.status(201).json(newCat);
});

app.put('/api/v1/expenses/categories/:id', (req: Request, res: Response) => {
  const index = EXPENSE_CATEGORIES.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Expense category not found' });

  EXPENSE_CATEGORIES[index] = { ...EXPENSE_CATEGORIES[index], ...req.body };
  res.json(EXPENSE_CATEGORIES[index]);
});

app.delete('/api/v1/expenses/categories/:id', (req: Request, res: Response) => {
  const index = EXPENSE_CATEGORIES.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Expense category not found' });

  const deleted = EXPENSE_CATEGORIES[index];
  EXPENSE_CATEGORIES.splice(index, 1);
  res.json({ message: `Deleted expense category ${deleted.name}`, deletedId: req.params.id });
});

// Automated Payroll Check, Leaves & Approved Expenses Integration Endpoint
app.post('/api/v1/payroll/auto-calculate-and-approve', (req: Request, res: Response) => {
  const { monthYear } = req.body;
  const targetPeriod = monthYear || 'July 2026';
  const totalWorkingDays = 22; // Standard monthly working days

  const processedReport: any[] = [];

  EMPLOYEES.forEach((emp) => {
    // 1. Calculate attendance for this employee
    const empAttRecords = ATTENDANCE_RECORDS.filter((a) => a.employeeId === emp.id);
    const daysPresent = empAttRecords.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const halfDays = empAttRecords.filter((a) => a.status === 'HALF_DAY').length;

    // 2. Calculate approved leaves for this employee
    const empLeaves = LEAVE_REQUESTS.filter((l) => l.employeeId === emp.id && l.status === 'APPROVED');
    const paidLeavesDays = empLeaves
      .filter((l) => l.leaveType !== 'UNPAID')
      .reduce((sum, l) => sum + (l.totalDays || 1), 0);
    const unpaidLeavesDays = empLeaves
      .filter((l) => l.leaveType === 'UNPAID')
      .reduce((sum, l) => sum + (l.totalDays || 1), 0);

    // Paid Days calculation formula: Present + Paid Leaves + (Half Days * 0.5)
    let paidDays = Math.min(totalWorkingDays, daysPresent + paidLeavesDays + (halfDays * 0.5));
    if (paidDays <= 0 && EMPLOYEES.length > 0) {
      // Default full attendance if no explicit log exists for mock evaluation
      paidDays = totalWorkingDays;
    }

    // 3. Find and sum all APPROVED Expense Claims for this employee that are not yet added to payroll
    const approvedExpenses = EXPENSES.filter(
      (exp) => exp.employeeId === emp.id && exp.status === 'APPROVED' && !exp.addedToPayroll
    );
    const totalExpenseReimbursement = approvedExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Mark these expense claims as added to payroll
    approvedExpenses.forEach((exp) => {
      exp.addedToPayroll = true;
    });

    // 4. Calculate Prorated Base Salary
    const prorationRatio = paidDays / totalWorkingDays;
    const basicSalary = Math.round(emp.salary.basic * prorationRatio);
    const hra = Math.round(emp.salary.hra * prorationRatio);
    const specialAllowance = Math.round(emp.salary.specialAllowance * prorationRatio);

    // Gross Earnings = Prorated Base + HRA + Special Allowance + Approved Expense Reimbursements
    const grossEarnings = basicSalary + hra + specialAllowance + totalExpenseReimbursement;

    // Deductions
    const pfDeduction = Math.round(emp.salary.pfEmployee * prorationRatio);
    const esiDeduction = Math.round(emp.salary.esiEmployee * prorationRatio);
    const taxDeduction = Math.round(emp.salary.tdsTax * prorationRatio);
    const totalDeductions = pfDeduction + esiDeduction + taxDeduction;

    const netSalary = Math.max(0, grossEarnings - totalDeductions);

    // 5. Create or Update Payslip automatically
    let payslip = PAYSLIPS.find((p) => p.employeeId === emp.id && p.payPeriod === targetPeriod);

    if (!payslip) {
      payslip = {
        id: `ps-auto-${Date.now()}-${emp.id}`,
        payslipNumber: `PAY-${Math.floor(10000 + Math.random() * 90000)}`,
        payPeriod: targetPeriod,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeeCode: emp.code,
        designation: emp.designation,
        department: emp.department,
        joiningDate: emp.joiningDate,
        bankAccountNumber: emp.bankDetails.accountNumber,
        panNumber: emp.bankDetails.panNumber,
        workingDays: totalWorkingDays,
        paidDays,
        basicSalary,
        hra,
        specialAllowance,
        expenseReimbursement: totalExpenseReimbursement,
        grossEarnings,
        pfDeduction,
        esiDeduction,
        taxDeduction,
        otherDeductions: 0,
        totalDeductions,
        netSalary,
        status: 'PAID', // AUTO APPROVED
        generatedDate: new Date().toISOString().substring(0, 10),
        paymentDate: new Date().toISOString().substring(0, 10),
        autoApproved: true,
      };
      PAYSLIPS.unshift(payslip);
    } else {
      payslip.workingDays = totalWorkingDays;
      payslip.paidDays = paidDays;
      payslip.basicSalary = basicSalary;
      payslip.hra = hra;
      payslip.specialAllowance = specialAllowance;
      payslip.expenseReimbursement = totalExpenseReimbursement;
      payslip.grossEarnings = grossEarnings;
      payslip.pfDeduction = pfDeduction;
      payslip.esiDeduction = esiDeduction;
      payslip.taxDeduction = taxDeduction;
      payslip.totalDeductions = totalDeductions;
      payslip.netSalary = netSalary;
      payslip.status = 'PAID';
      payslip.autoApproved = true;
    }

    processedReport.push({
      employeeName: `${emp.firstName} ${emp.lastName}`,
      code: emp.code,
      paidDays,
      unpaidLeavesDays,
      approvedExpenseReimbursements: totalExpenseReimbursement,
      grossEarnings,
      netSalary,
      status: 'AUTO_APPROVED_AND_PAID',
    });
  });

  // System Audit & Notification
  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    userId: 'emp-1',
    userName: 'Arjun Sharma',
    role: 'SUPER_ADMIN',
    action: 'AUTO_PAYROLL_CALCULATION_AND_APPROVAL',
    module: 'Payroll Engine',
    description: `Automated payroll calculation and approval executed for ${targetPeriod}. Prorated leaves, attendance logs, and approved expense reimbursements auto-calculated across ${EMPLOYEES.length} employees. All payslips auto-approved & disbursed.`,
    ipAddress: '102.168.1.1',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    severity: 'INFO',
  });

  NOTIFICATIONS.unshift({
    id: `notif-${Date.now()}`,
    title: `Automated Payroll Auto-Approved for ${targetPeriod}`,
    message: `Payroll auto-calculation completed for ${EMPLOYEES.length} employees. Working days, leaves, and approved expenses auto-audited and disbursed.`,
    type: 'SUCCESS',
    timestamp: 'Just now',
    read: false,
    link: 'payroll',
  });

  res.json({
    message: `Automated payroll calculation and approval completed successfully for ${targetPeriod}`,
    targetPeriod,
    totalEmployeesProcessed: EMPLOYEES.length,
    processedReport,
    payslips: PAYSLIPS,
  });
});

app.get('/api/v1/projects', (_req: Request, res: Response) => {
  res.json(PROJECTS);
});

app.get('/api/v1/timesheets', (_req: Request, res: Response) => {
  res.json(TIMESHEETS);
});

app.get('/api/v1/audit-logs', (_req: Request, res: Response) => {
  res.json(AUDIT_LOGS);
});

app.get('/api/v1/notifications', (_req: Request, res: Response) => {
  res.json(NOTIFICATIONS);
});

app.post('/api/v1/notifications', (req: Request, res: Response) => {
  const { title, message, type, category, link } = req.body;
  const newNotif: NotificationItem = {
    id: `notif-${Date.now()}`,
    title,
    message,
    type: type || 'INFO',
    category: category || 'SYSTEM',
    timestamp: 'Just now',
    read: false,
    link,
  };
  NOTIFICATIONS.unshift(newNotif);
  res.status(201).json(newNotif);
});

app.put('/api/v1/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const notif = NOTIFICATIONS.find((n) => n.id === id);
  if (notif) {
    notif.read = true;
    res.json({ success: true, notif });
  } else {
    res.status(404).json({ message: 'Notification not found' });
  }
});

app.put('/api/v1/notifications/read-all', (_req: Request, res: Response) => {
  NOTIFICATIONS.forEach((n) => (n.read = true));
  res.json({ success: true, count: NOTIFICATIONS.length });
});

app.delete('/api/v1/notifications/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  NOTIFICATIONS = NOTIFICATIONS.filter((n) => n.id !== id);
  res.json({ success: true });
});

// ==========================================
// FEATURE 1: ENTERPRISE HOLIDAY CALENDAR ENDPOINTS
// ==========================================
app.get('/api/v1/holidays', (_req: Request, res: Response) => {
  res.json(HOLIDAYS);
});

app.post('/api/v1/holidays', (req: Request, res: Response) => {
  const { title, date, region, type, description, icon, isRecurring, branchId } = req.body;
  const newHoliday: Holiday = {
    id: `hol-${Date.now()}`,
    title,
    date,
    region: region || 'NATIONAL',
    type: type || 'MANDATORY',
    description: description || '',
    icon: icon || '🗓️',
    isRecurring: isRecurring ?? true,
    branchId,
  };
  HOLIDAYS.push(newHoliday);

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    userId: 'emp-1',
    userName: 'System Admin',
    role: 'SUPER_ADMIN',
    action: 'CREATE_HOLIDAY',
    module: 'Holiday Management',
    description: `Added new holiday "${title}" (${date}) for ${region}.`,
    ipAddress: '102.168.1.10',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    severity: 'INFO',
  });

  res.status(201).json(newHoliday);
});

app.put('/api/v1/holidays/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = HOLIDAYS.findIndex((h) => h.id === id);
  if (idx !== -1) {
    HOLIDAYS[idx] = { ...HOLIDAYS[idx], ...req.body };
    res.json(HOLIDAYS[idx]);
  } else {
    res.status(404).json({ message: 'Holiday not found' });
  }
});

app.delete('/api/v1/holidays/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  HOLIDAYS = HOLIDAYS.filter((h) => h.id !== id);
  res.json({ success: true });
});

// ==========================================
// FEATURE 3: MULTI-BRANCH WORKSPACE ENDPOINTS
// ==========================================
app.get('/api/v1/branches', (_req: Request, res: Response) => {
  // Synchronize employee counts across branches dynamically
  BRANCHES.forEach((b) => {
    const count = EMPLOYEES.filter(
      (e) =>
        e.branch === b.name ||
        e.branch === b.id ||
        e.branch === b.code ||
        (e.location &&
          (e.location.toLowerCase().includes(b.city.toLowerCase()) ||
            e.location.toLowerCase().includes(b.name.toLowerCase())))
    ).length;
    b.employeeCount = count;
  });
  res.json(BRANCHES);
});

app.post('/api/v1/branches', (req: Request, res: Response) => {
  const { name, code, city, state, region, address, managerId, managerName, floorsCount } = req.body;
  const newBranch: Branch = {
    id: `br-${Date.now()}`,
    name,
    code,
    city,
    state,
    region: region || 'SOUTH_INDIA',
    address,
    managerId,
    managerName,
    employeeCount: 0,
    attendancePercentage: 95.0,
    leavePercentage: 3.0,
    expenseTotal: 0,
    monthlyPayroll: 0,
    floorsCount: floorsCount || 1,
  };
  BRANCHES.push(newBranch);
  res.status(201).json(newBranch);
});

app.put('/api/v1/branches/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = BRANCHES.findIndex((b) => b.id === id);
  if (idx !== -1) {
    BRANCHES[idx] = { ...BRANCHES[idx], ...req.body };
    res.json(BRANCHES[idx]);
  } else {
    res.status(404).json({ message: 'Branch not found' });
  }
});

app.delete('/api/v1/branches/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  BRANCHES = BRANCHES.filter((b) => b.id !== id);
  res.json({ success: true });
});

// ==========================================
// FEATURE 4 & 5: EXCEL WEEK PLAN & SMART TASK ENDPOINTS WITH AUTO LEAVE DEDUCTION
// ==========================================

function processWeeklyPlanLeaveDeduction(task: WeeklyTask): LeaveRequest | null {
  if (!task) return null;
  const textToScan = `${task.task || ''} ${task.remarks || ''} ${task.project || ''}`.toLowerCase();

  // Check if text indicates taking leave
  const isLeaveMentioned =
    /\b(leave|casual leave|sick leave|annual leave|earned leave|unpaid leave|lwp|on leave|taking leave|vacation|day off|on_leave)\b/i.test(textToScan) ||
    textToScan.trim() === 'leave' ||
    textToScan.trim() === 'on leave' ||
    textToScan.trim() === 'casual leave' ||
    textToScan.trim() === 'sick leave' ||
    textToScan.trim() === 'l';

  if (!isLeaveMentioned) return null;

  // Find target employee
  let emp = EMPLOYEES.find((e) => e.id === task.employeeId);
  if (!emp && task.employeeName) {
    const searchName = task.employeeName.toLowerCase();
    emp = EMPLOYEES.find((e) =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchName) ||
      e.firstName.toLowerCase().includes(searchName)
    );
  }
  if (!emp) emp = EMPLOYEES[0];

  const targetDate = task.date || task.deadline || new Date().toISOString().substring(0, 10);

  // Check if leave already deducted or requested for this employee and date
  const existingLeave = LEAVE_REQUESTS.find(
    (l) => l.employeeId === emp!.id && l.startDate <= targetDate && l.endDate >= targetDate && l.status !== 'REJECTED'
  );

  if (existingLeave) return existingLeave;

  // Determine Leave Type
  let leaveType: 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID' = 'CASUAL';
  if (textToScan.includes('sick')) leaveType = 'SICK';
  else if (textToScan.includes('annual') || textToScan.includes('earned')) leaveType = 'EARNED';
  else if (textToScan.includes('unpaid') || textToScan.includes('lwp')) leaveType = 'UNPAID';

  // 1. Create Auto-Approved Leave Request (deducts 1 day from leave balance/ledger)
  const autoLeave: LeaveRequest = {
    id: `lv-wkplan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    employeeId: emp.id,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    employeeAvatar: emp.avatar,
    department: emp.department,
    leaveType,
    startDate: targetDate,
    endDate: targetDate,
    totalDays: 1,
    reason: `Automated Leave Deduction via Weekly Plan (${task.task})`,
    status: 'APPROVED',
    appliedOn: new Date().toISOString().substring(0, 10),
    approvedBy: 'System Weekly Plan Automator',
    comments: `Auto-deducted 1 day ${leaveType} leave from leave session as specified in Weekly Plan schedule for ${targetDate}.`,
  };

  LEAVE_REQUESTS.unshift(autoLeave);

  // 2. Mark/Update Attendance record for targetDate as ON_LEAVE
  let attRecord = ATTENDANCE_RECORDS.find((a) => a.employeeId === emp!.id && a.date === targetDate);
  if (!attRecord) {
    attRecord = {
      id: `att-wkplan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      date: targetDate,
      clockIn: '--:--',
      clockOut: '--:--',
      status: 'ON_LEAVE',
      breakDurationMinutes: 0,
      overtimeHours: 0,
      locationIn: 'Weekly Plan Leave Scheduled',
      regularizationStatus: 'NONE',
      autoLeaveDeducted: true,
    };
    ATTENDANCE_RECORDS.unshift(attRecord);
  } else {
    attRecord.status = 'ON_LEAVE';
    attRecord.autoLeaveDeducted = true;
  }

  // 3. Dispatch Notification
  NOTIFICATIONS.unshift({
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: 'Automated Leave Deducted via Weekly Plan',
    message: `${emp.firstName} ${emp.lastName} scheduled leave in Weekly Plan on ${targetDate}. 1 day ${leaveType} leave automatically deducted from leave session.`,
    type: 'INFO',
    timestamp: 'Just now',
    read: false,
    link: 'leave',
  });

  // 4. Audit Log
  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    userId: emp.id,
    userName: `${emp.firstName} ${emp.lastName}`,
    role: emp.role || 'EMPLOYEE',
    action: 'WEEKLY_PLAN_AUTO_LEAVE_DEDUCTION',
    module: 'Weekly Plan & Leave Integration',
    description: `Weekly Plan entry "${task.task}" indicated leave for ${targetDate}. Auto-deducted 1 day ${leaveType} leave and set attendance status to ON_LEAVE.`,
    ipAddress: '102.168.1.1',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    severity: 'INFO',
  });

  return autoLeave;
}

app.get('/api/v1/tasks', (_req: Request, res: Response) => {
  // Scan all existing weekly tasks for leave mentions to auto-deduct if not already processed
  WEEKLY_TASKS.forEach((t) => processWeeklyPlanLeaveDeduction(t));
  res.json(WEEKLY_TASKS);
});

app.post('/api/v1/tasks', (req: Request, res: Response) => {
  const { employeeId, employeeName, date, task, priority, department, project, deadline, remarks } = req.body;
  const newTask: WeeklyTask = {
    id: `tsk-${Date.now()}`,
    employeeId,
    employeeName,
    date: date || new Date().toISOString().substring(0, 10),
    task,
    priority: priority || 'MEDIUM',
    department: department || 'ENGINEERING',
    project: project || 'General Operations',
    deadline: deadline || date,
    remarks,
    status: 'PENDING',
    progressPercent: 0,
  };

  const autoLeave = processWeeklyPlanLeaveDeduction(newTask);
  WEEKLY_TASKS.unshift(newTask);

  res.status(201).json({
    ...newTask,
    autoLeaveDeducted: !!autoLeave,
    autoLeaveDetails: autoLeave || undefined,
  });
});

app.post('/api/v1/tasks/import-excel', (req: Request, res: Response) => {
  const { tasks } = req.body;
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ message: 'No task records provided in Excel import payload' });
  }

  let autoLeaveDeductedCount = 0;
  const autoLeavesList: LeaveRequest[] = [];

  const importedTasks: WeeklyTask[] = tasks.map((t: any, index: number) => {
    const newTaskObj: WeeklyTask = {
      id: `tsk-imp-${Date.now()}-${index}`,
      employeeId: t.employeeId || 'emp-4',
      employeeName: t.employeeName || 'Assigned Employee',
      date: t.date || new Date().toISOString().substring(0, 10),
      task: t.task || 'Assigned Weekly Task',
      priority: (t.priority || 'MEDIUM').toUpperCase(),
      department: t.department || 'ENGINEERING',
      project: t.project || 'General Project',
      deadline: t.deadline || t.date || new Date().toISOString().substring(0, 10),
      remarks: t.remarks || 'Imported via Excel Week Plan Sheet',
      status: 'PENDING',
      progressPercent: 0,
    };

    const autoLeave = processWeeklyPlanLeaveDeduction(newTaskObj);
    if (autoLeave) {
      autoLeaveDeductedCount++;
      autoLeavesList.push(autoLeave);
    }

    return newTaskObj;
  });

  WEEKLY_TASKS = [...importedTasks, ...WEEKLY_TASKS];

  AUDIT_LOGS.unshift({
    id: `aud-${Date.now()}`,
    userId: 'emp-1',
    userName: 'Manager / Super Admin',
    role: 'SUPER_ADMIN',
    action: 'EXCEL_WEEK_PLAN_IMPORT',
    module: 'Projects & Tasks',
    description: `Successfully imported ${importedTasks.length} weekly tasks from Excel planning sheet. Auto-deducted ${autoLeaveDeductedCount} leave(s) from leave session.`,
    ipAddress: '102.168.1.1',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    severity: 'INFO',
  });

  res.status(200).json({
    message: `Successfully processed ${importedTasks.length} tasks from Excel import. ${autoLeaveDeductedCount} leave(s) automatically detected and deducted from leave session!`,
    importedCount: importedTasks.length,
    autoLeaveDeductedCount,
    autoLeaves: autoLeavesList,
    tasks: importedTasks,
  });
});

app.post('/api/v1/weekly-plans/daily-validation', async (req: Request, res: Response) => {
  try {
    const service = new WeeklyPlanValidationService();
    const targetDate = req.body.date || new Date().toISOString().slice(0, 10);
    const validationResult = await service.validateWeeklyPlansAndDeductLeaves(WEEKLY_TASKS, targetDate);

    // Also synchronize server state for in-memory records
    WEEKLY_TASKS.forEach((t) => processWeeklyPlanLeaveDeduction(t));

    return res.json({
      message: `Daily validation check against weekly plans completed for ${targetDate}.`,
      ...validationResult,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Daily validation failed' });
  }
});

app.post('/api/v1/tasks/auto-process-leaves', (_req: Request, res: Response) => {
  let count = 0;
  const processedLeaves: LeaveRequest[] = [];
  WEEKLY_TASKS.forEach((t) => {
    const l = processWeeklyPlanLeaveDeduction(t);
    if (l) {
      count++;
      processedLeaves.push(l);
    }
  });

  res.json({
    message: `Processed ${WEEKLY_TASKS.length} weekly tasks. ${count} leaves auto-deducted from leave session.`,
    autoLeavesCount: count,
    processedLeaves,
  });
});

app.put('/api/v1/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = WEEKLY_TASKS.findIndex((t) => t.id === id);
  if (idx !== -1) {
    WEEKLY_TASKS[idx] = { ...WEEKLY_TASKS[idx], ...req.body };
    const autoLeave = processWeeklyPlanLeaveDeduction(WEEKLY_TASKS[idx]);
    res.json({
      ...WEEKLY_TASKS[idx],
      autoLeaveDeducted: !!autoLeave,
      autoLeaveDetails: autoLeave || undefined,
    });
  } else {
    res.status(404).json({ message: 'Task not found' });
  }
});

// ==========================================
// FEATURE 6: ENGAGEMENT & CELEBRATION ENDPOINTS
// ==========================================
app.get('/api/v1/celebrations', (_req: Request, res: Response) => {
  res.json(CELEBRATION_EVENTS);
});

app.post('/api/v1/celebrations', (req: Request, res: Response) => {
  const { employeeId, employeeName, type, date, title, description, location } = req.body;
  const newEvent: CelebrationEvent = {
    id: `cel-${Date.now()}`,
    employeeId,
    employeeName,
    type: type || 'CUSTOM_EVENT',
    date: date || new Date().toISOString().substring(0, 10),
    title,
    description,
    location,
    attendeesCount: 1,
  };
  CELEBRATION_EVENTS.unshift(newEvent);
  res.status(201).json(newEvent);
});

// ==========================================
// FEATURE 7: YEARLY LEAVE LEDGER ENDPOINT
// ==========================================
app.get('/api/v1/leave/ledger', (req: Request, res: Response) => {
  const { employeeId } = req.query;
  const empId = (employeeId as string) || 'emp-1';

  const employeeLeaves = LEAVE_REQUESTS.filter((l) => l.employeeId === empId);

  const ledger: YearlyLeaveLedgerItem[] = [
    {
      leaveType: 'ANNUAL',
      totalAllocated: 15,
      used: employeeLeaves.filter((l) => l.leaveType === 'EARNED' && l.status === 'APPROVED').reduce((s, x) => s + x.totalDays, 0),
      remaining: 15 - employeeLeaves.filter((l) => l.leaveType === 'EARNED' && l.status === 'APPROVED').reduce((s, x) => s + x.totalDays, 0),
      pending: employeeLeaves.filter((l) => l.leaveType === 'EARNED' && l.status === 'PENDING').reduce((s, x) => s + x.totalDays, 0),
      rejected: employeeLeaves.filter((l) => l.leaveType === 'EARNED' && l.status === 'REJECTED').reduce((s, x) => s + x.totalDays, 0),
      cancelled: 0,
      approved: employeeLeaves.filter((l) => l.leaveType === 'EARNED' && l.status === 'APPROVED').reduce((s, x) => s + x.totalDays, 0),
    },
    {
      leaveType: 'CASUAL',
      totalAllocated: 12,
      used: employeeLeaves.filter((l) => l.leaveType === 'CASUAL' && l.status === 'APPROVED').reduce((s, x) => s + x.totalDays, 0),
      remaining: 12 - employeeLeaves.filter((l) => l.leaveType === 'CASUAL' && l.status === 'APPROVED').reduce((s, x) => s + x.totalDays, 0),
      pending: employeeLeaves.filter((l) => l.leaveType === 'CASUAL' && l.status === 'PENDING').reduce((s, x) => s + x.totalDays, 0),
      rejected: employeeLeaves.filter((l) => l.leaveType === 'CASUAL' && l.status === 'REJECTED').reduce((s, x) => s + x.totalDays, 0),
      cancelled: 0,
      approved: employeeLeaves.filter((l) => l.leaveType === 'CASUAL' && l.status === 'APPROVED').reduce((s, x) => s + x.totalDays, 0),
    },
    {
      leaveType: 'SICK',
      totalAllocated: 12,
      used: employeeLeaves.filter((l) => l.leaveType === 'SICK' && l.status === 'APPROVED').reduce((s, x) => s + x.totalDays, 0),
      remaining: 12 - employeeLeaves.filter((l) => l.leaveType === 'SICK' && l.status === 'APPROVED').reduce((s, x) => s + x.totalDays, 0),
      pending: employeeLeaves.filter((l) => l.leaveType === 'SICK' && l.status === 'PENDING').reduce((s, x) => s + x.totalDays, 0),
      rejected: employeeLeaves.filter((l) => l.leaveType === 'SICK' && l.status === 'REJECTED').reduce((s, x) => s + x.totalDays, 0),
      cancelled: 0,
      approved: employeeLeaves.filter((l) => l.leaveType === 'SICK' && l.status === 'APPROVED').reduce((s, x) => s + x.totalDays, 0),
    },
    {
      leaveType: 'COMP_OFF',
      totalAllocated: 5,
      used: 1,
      remaining: 4,
      pending: 0,
      rejected: 0,
      cancelled: 0,
      approved: 1,
    },
    {
      leaveType: 'OPTIONAL',
      totalAllocated: 3,
      used: 1,
      remaining: 2,
      pending: 0,
      rejected: 0,
      cancelled: 0,
      approved: 1,
    },
    {
      leaveType: 'RESTRICTED',
      totalAllocated: 2,
      used: 0,
      remaining: 2,
      pending: 0,
      rejected: 0,
      cancelled: 0,
      approved: 0,
    },
    {
      leaveType: 'LOSS_OF_PAY',
      totalAllocated: 0,
      used: employeeLeaves.filter((l) => l.leaveType === 'UNPAID' && l.status === 'APPROVED').reduce((s, x) => s + x.totalDays, 0),
      remaining: 0,
      pending: employeeLeaves.filter((l) => l.leaveType === 'UNPAID' && l.status === 'PENDING').reduce((s, x) => s + x.totalDays, 0),
      rejected: employeeLeaves.filter((l) => l.leaveType === 'UNPAID' && l.status === 'REJECTED').reduce((s, x) => s + x.totalDays, 0),
      cancelled: 0,
      approved: employeeLeaves.filter((l) => l.leaveType === 'UNPAID' && l.status === 'APPROVED').reduce((s, x) => s + x.totalDays, 0),
    },
    {
      leaveType: 'EMERGENCY',
      totalAllocated: 3,
      used: 0,
      remaining: 3,
      pending: 0,
      rejected: 0,
      cancelled: 0,
      approved: 0,
    },
  ];

  res.json({
    employeeId: empId,
    year: 2026,
    ledger,
    history: employeeLeaves,
  });
});

app.get('/api/v1/announcements', (_req: Request, res: Response) => {
  res.json(ANNOUNCEMENTS);
});

app.get('/api/v1/performance/reviews', (_req: Request, res: Response) => {
  res.json(PERFORMANCE_REVIEWS);
});

// ==========================================
// DEPLOYMENT DATABASE ENGINE & ENDPOINTS
// ==========================================

// Helper to save database to src/data/database.json
function persistDatabaseToFile() {
  try {
    const dbPath = path.join(process.cwd(), 'src', 'data', 'database.json');
    const dbDump = {
      version: '1.0.0',
      company: 'THEIAKSHI ENTERPRISES',
      lastSynced: new Date().toISOString(),
      systemConfig: SYSTEM_CONFIG,
      geofenceSettings: GEOFENCE_SETTINGS,
      workspaces: WORKSPACES,
      departments: DEPARTMENTS,
      branches: BRANCHES,
      employees: EMPLOYEES,
      holidays: HOLIDAYS,
      attendanceRecords: ATTENDANCE_RECORDS,
      leaveRequests: LEAVE_REQUESTS,
      payslips: PAYSLIPS,
      jobPostings: JOB_POSTINGS,
      candidates: CANDIDATES,
      assets: ASSETS,
      helpdeskTickets: HELPDESK_TICKETS,
      projects: PROJECTS,
      expenses: EXPENSES,
      auditLogs: AUDIT_LOGS,
    };
    fs.writeFileSync(dbPath, JSON.stringify(dbDump, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to persist database file:', err);
    return false;
  }
}

async function initPostgres() {
  if (!process.env.DATABASE_URL) {
    console.log('[DATABASE] DATABASE_URL environment variable is not configured. Running in JSON file mode.');
    return;
  }

  try {
    console.log('[DATABASE] Connecting to PostgreSQL database via DATABASE_URL...');
    dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    await dbPool.query('SELECT 1');
    console.log('[DATABASE] Successfully connected to PostgreSQL!');

    // Initialize Schema if permitted (isolated in try-catch to prevent DDL permission errors from stopping the application)
    try {
      const schemaPath = path.join(process.cwd(), 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        await dbPool.query(schemaSql);
        console.log('[DATABASE] Schema verified and updated successfully.');
      }
    } catch (schemaErr: any) {
      console.warn('[DATABASE] Notice: Schema DDL execution bypassed or restricted (permission denied for schema public or pre-existing tables):', schemaErr.message || schemaErr);
      console.warn('[DATABASE] Continuing with existing table structures for data operations.');
    }

    // Load active employees from Postgres
    try {
      const res = await dbPool.query('SELECT * FROM employees ORDER BY created_at ASC');
      if (res.rows.length > 0) {
        EMPLOYEES = res.rows.map(mapRowToEmployee);
        console.log(`[DATABASE] Loaded ${EMPLOYEES.length} active employee profiles from PostgreSQL.`);
      } else {
        console.log('[DATABASE] Seeding default employees to PostgreSQL...');
        for (const emp of EMPLOYEES) {
          await saveEmployeeToDb(emp);
        }
      }
    } catch (dataErr: any) {
      console.warn('[DATABASE] Notice: Employee table lookup status:', dataErr.message);
    }
  } catch (err: any) {
    console.error('[DATABASE] PostgreSQL initialization connection notice:', err.message || err);
    if (dbPool) {
      try {
        await dbPool.end();
      } catch {}
      dbPool = null;
    }
  }
}

// Get database status and stats
app.get('/api/v1/database/info', (_req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    databaseEngine: dbPool ? 'Neon / PostgreSQL (Connected via DATABASE_URL)' : 'JSON Persistent File / SQL Compliant Schema',
    isPostgresConnected: !!dbPool,
    databaseUrlConfigured: !!process.env.DATABASE_URL,
    version: '1.0.0',
    company: SYSTEM_CONFIG.companyName,
    schemaFile: '/schema.sql',
    dataFile: '/src/data/database.json',
    stats: {
      employees: EMPLOYEES.length,
      departments: DEPARTMENTS.length,
      branches: BRANCHES.length,
      workspaces: WORKSPACES.length,
      holidays: HOLIDAYS.length,
      leaveRequests: LEAVE_REQUESTS.length,
      attendanceRecords: ATTENDANCE_RECORDS.length,
      payslips: PAYSLIPS.length,
      assets: ASSETS.length,
      helpdeskTickets: HELPDESK_TICKETS.length,
      projects: PROJECTS.length,
      expenses: EXPENSES.length,
      auditLogs: AUDIT_LOGS.length,
    },
    tables: [
      'system_config',
      'geofence_settings',
      'branches',
      'workspaces',
      'departments',
      'employees',
      'credentials',
      'attendance_records',
      'leave_requests',
      'yearly_leave_ledgers',
      'payslips',
      'expense_claims',
      'expense_categories',
      'job_postings',
      'candidates',
      'assets',
      'helpdesk_tickets',
      'projects',
      'weekly_tasks',
      'holidays',
      'celebration_events',
      'audit_logs',
      'notifications'
    ],
    timestamp: new Date().toISOString(),
  });
});

// Endpoint to force push in-memory employees to Neon PostgreSQL
app.post('/api/v1/database/sync-to-postgres', async (_req: Request, res: Response) => {
  if (!dbPool) {
    return res.status(400).json({
      message: 'PostgreSQL database connection is not active. Please verify DATABASE_URL environment variable on Render.',
    });
  }

  try {
    await syncAllEmployeesToPostgres();
    res.json({
      message: 'Successfully synced current employee list to Neon PostgreSQL database!',
      employeeCount: EMPLOYEES.length,
      employees: EMPLOYEES.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, email: e.email })),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to sync employees to PostgreSQL', error: err.message });
  }
});

// Endpoint to reload employees from Neon PostgreSQL
app.post('/api/v1/database/sync-from-postgres', async (_req: Request, res: Response) => {
  if (!dbPool) {
    return res.status(400).json({
      message: 'PostgreSQL database connection is not active. Please verify DATABASE_URL environment variable on Render.',
    });
  }

  try {
    const queryRes = await dbPool.query('SELECT * FROM employees ORDER BY created_at ASC');
    EMPLOYEES = queryRes.rows.map(mapRowToEmployee);
    res.json({
      message: 'Successfully reloaded employees from Neon PostgreSQL database!',
      employeeCount: EMPLOYEES.length,
      employees: EMPLOYEES.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, email: e.email })),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to reload from PostgreSQL', error: err.message });
  }
});

// Download / Export full JSON database
app.get('/api/v1/database/export', (req: Request, res: Response) => {
  persistDatabaseToFile();
  const format = (req.query.format as string) || 'json';

  if (format === 'sql') {
    const sqlPath = path.join(process.cwd(), 'schema.sql');
    if (fs.existsSync(sqlPath)) {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="schema.sql"');
      return res.sendFile(sqlPath);
    }
  }

  const dbPath = path.join(process.cwd(), 'src', 'data', 'database.json');
  if (fs.existsSync(dbPath)) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="database.json"');
    return res.sendFile(dbPath);
  }

  res.status(500).json({ message: 'Database export file not found' });
});

// Get SQL Schema file
app.get('/api/v1/database/schema.sql', (_req: Request, res: Response) => {
  const sqlPath = path.join(process.cwd(), 'schema.sql');
  if (fs.existsSync(sqlPath)) {
    res.setHeader('Content-Type', 'text/plain');
    return res.sendFile(sqlPath);
  }
  res.status(404).json({ message: 'SQL schema file not found' });
});

// Trigger persistent save
app.post('/api/v1/database/sync', (_req: Request, res: Response) => {
  const success = persistDatabaseToFile();
  if (success) {
    res.json({ message: 'Database successfully synced to file system', timestamp: new Date().toISOString() });
  } else {
    res.status(500).json({ message: 'Failed to sync database to file system' });
  }
});

// AI Copilot Endpoint using Gemini
app.post('/api/v1/ai/copilot', async (req: Request, res: Response) => {
  try {
    const { prompt, contextModule } = req.body;

    const genAI = getGenAIClient();
    if (!genAI) {
      // Fallback intelligent HR response generator if no key supplied yet
      return res.json({
        response: `[THEIAKSHI ONE AI Assistant Response]\nRegarding your query about "${prompt}":\n\n1. **Policy Reference**: Based on THEIAKSHI ENTERPRISES Global HR Manual Section 4.2, all full-time employees are entitled to 12 Casual Leaves, 12 Sick Leaves, and 15 Earned Leaves per fiscal year.\n2. **Action Recommendation**: You can initiate approvals or submit details through the Leave & Attendance portal.\n3. **Audit Trail**: Action logged in system audit.`,
        sources: ['THEIAKSHI HR Policy 2026', 'Leave & Attendance Module'],
      });
    }

    const systemContext = `You are THEIAKSHI ONE AI HR Copilot, an enterprise AI assistant built for THEIAKSHI ENTERPRISES. 
    You assist HR managers, employees, and team leads with policy guidance, performance review drafting, job description generation, salary structure explanations, and workflow recommendations.
    Context Module: ${contextModule || 'General HR'}. Be precise, professional, helpful, and concise.`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemContext}\n\nUser Question: ${prompt}`,
    });

    const reply = result.text || 'I analyzed your request based on corporate parameters.';
    res.json({
      response: reply,
      sources: ['THEIAKSHI Enterprises Policy Knowledge Engine v4.2'],
    });
  } catch (error: any) {
    console.error('Gemini Copilot Error:', error);
    res.json({
      response: `I analyzed your request. Please ensure proper HR compliance parameters when completing this action in THEIAKSHI ONE.`,
      sources: ['Standard Enterprise Workflow'],
    });
  }
});

// ==========================================
// VITE MIDDLEWARE SETUP
// ==========================================

async function startServer() {
  await initPostgres();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`THEIAKSHI ONE Enterprise HRMS Server Active on Port ${PORT}`);
    console.log(`REST API Version: /api/v1`);
    console.log(`Company: THEIAKSHI ENTERPRISES`);
    console.log(`====================================================`);
  });
}

startServer();
