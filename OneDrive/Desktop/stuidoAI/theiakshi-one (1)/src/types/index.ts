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
  | 'PRODUCT'
  | 'BUSINESS_ASSOCIATES'
  | string;

export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'PROBATION' | 'TERMINATED';

export interface BankDetails {
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  panNumber: string;
  pfUan: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  category?: 'GOVT' | 'PERSONAL' | 'COMPANY' | 'PRIVATE';
  docNumber?: string;
  uploadDate: string;
  expiryDate?: string;
  fileSize?: string;
  fileUrl: string;
}

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
  code: string; // e.g. "EMP-1001"
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
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
  emergencyContact: EmergencyContact;
  bankDetails: BankDetails;
  documents: EmployeeDocument[];

  // Branch & Workspace Details
  branch?: string;
  officeLocation?: string;
  region?: 'NORTH_INDIA' | 'SOUTH_INDIA' | 'WEST_INDIA' | 'EAST_INDIA' | 'OVERSEAS';
  floor?: string;
  workspace?: string;
  cubicleDesk?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'SHORT_LEAVE' | 'LATE' | 'ON_LEAVE' | 'OVERTIME' | 'WEEKLY_OFF' | 'HOLIDAY';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: DepartmentType;
  date: string; // YYYY-MM-DD
  clockIn?: string; // HH:MM:SS
  clockOut?: string; // HH:MM:SS
  totalHours?: number;
  status: AttendanceStatus;
  locationIn?: string;
  locationOut?: string;
  gpsCoordinates?: { lat: number; lng: number };
  lateMinutes?: number;
  autoLeaveDeducted?: boolean;
  breakDurationMinutes: number;
  overtimeHours: number;
  regularizationStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  regularizationReason?: string;
}

export type LeaveType = 'CASUAL' | 'SICK' | 'EARNED' | 'MATERNITY' | 'PATERNITY' | 'UNPAID';

export interface LeaveBalance {
  casual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
  earned: { total: number; used: number; remaining: number };
  unpaid: { total: number; used: number; remaining: number };
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  department: DepartmentType;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED_BY_MANAGER' | 'APPROVED' | 'REJECTED';
  appliedOn: string;
  approvedBy?: string;
  comments?: string;
}

export interface Payslip {
  id: string;
  payslipNumber: string;
  payPeriod: string; // e.g. "July 2026"
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: DepartmentType;
  joiningDate: string;
  bankAccountNumber: string;
  panNumber: string;
  workingDays: number;
  paidDays: number;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  expenseReimbursement?: number;
  grossEarnings: number;
  pfDeduction: number;
  esiDeduction: number;
  taxDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  status: 'DRAFT' | 'PROCESSED' | 'PAID';
  generatedDate: string;
  paymentDate?: string;
  autoApproved?: boolean;
}

export interface JobPosting {
  id: string;
  jobCode: string;
  title: string;
  department: DepartmentType;
  location: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'HYBRID' | 'REMOTE';
  experienceYears: string;
  salaryRange: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT' | 'ON_HOLD';
  applicantsCount: number;
  createdDate: string;
  description: string;
  requirements: string[];
}

export interface Candidate {
  id: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  experienceYears: number;
  stage: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
  rating: number; // 1-5
  resumeUrl: string;
  appliedDate: string;
  interviewDate?: string;
  interviewNotes?: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: DepartmentType;
  cycleName: string; // e.g. "H1 2026 Performance Review"
  rating: number; // 1-5
  kraScore: number; // percentage
  status: 'SELF_ASSESSMENT' | 'MANAGER_REVIEW' | 'COMPLETED';
  selfComments?: string;
  managerComments?: string;
  goalsCount: number;
  completedGoalsCount: number;
}

export interface HelpdeskTicket {
  id: string;
  ticketNumber: string; // TSK-1042
  requesterId: string;
  requesterName: string;
  department: DepartmentType;
  category: 'IT_SUPPORT' | 'PAYROLL_QUERY' | 'HR_POLICY' | 'FACILITIES' | 'HARDWARE';
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  comments: {
    id: string;
    author: string;
    avatar?: string;
    text: string;
    timestamp: string;
  }[];
}

export interface Asset {
  id: string;
  assetTag: string; // AST-8841
  name: string;
  category: 'LAPTOP' | 'MONITOR' | 'MOBILE' | 'ACCESSORY' | 'FURNITURE';
  serialNumber: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED';
  condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  assignedToId?: string;
  assignedToName?: string;
  assignedDate?: string;
  purchaseDate: string;
  cost: number;
}

export interface ProjectUpgradation {
  id: string;
  projectId: string;
  title: string;
  description: string;
  progress: number; // 0 - 100
  status: 'IN_PROGRESS' | 'COMPLETED';
  loggedBy: string;
  loggedByRole: string;
  timestamp: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  department: DepartmentType;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  progress: number; // 0 - 100
  membersCount: number;
  deadline: string;
  budget: number;
  description?: string;
  managerId?: string;
  managerName?: string;
  upgradations?: ProjectUpgradation[];
}

export type ExpenseCategory =
  | 'Local Travel'
  | 'Outstation Travel'
  | 'Meals'
  | 'Hotel'
  | 'Fuel'
  | 'Internet'
  | 'Office Supplies'
  | 'Training'
  | 'Medical'
  | 'Other';

export interface ExpenseCategoryConfig {
  id: string;
  name: string;
  description: string;
  requiresTransportDetails: boolean;
  mandatoryFields: string[]; // e.g. ['transactionDate', 'purpose', 'category', 'amount', 'currency', 'billUrl']
}

export interface ExpenseHistoryItem {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  note?: string;
  timestamp: string;
}

export interface ExpenseComment {
  id: string;
  authorName: string;
  authorRole: string;
  avatar?: string;
  text: string;
  timestamp: string;
}

export interface ExpenseClaim {
  id: string;
  claimNumber: string; // e.g. EXP-1001
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: DepartmentType;
  managerId?: string;
  managerName?: string;
  branch?: string;
  transactionDate: string; // YYYY-MM-DD
  purpose: string;
  category: string;
  currency: string;
  amount: number;
  gstAmount?: number;
  gstin?: string;
  projectId?: string;
  projectName?: string;
  client?: string;
  billUrl?: string;
  billFileName?: string;
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'PENDING'
    | 'APPROVED_BY_MANAGER'
    | 'APPROVED_BY_FINANCE'
    | 'APPROVED'
    | 'PAID'
    | 'REJECTED'
    | 'RETURNED';
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  returnedReason?: string;

  // Travel & Trip Specific Fields
  expenseType?: 'BUSINESS' | 'LOCAL_TRAVEL' | 'TRIP';
  bucket?: string;
  merchant?: string;
  distanceKms?: number;
  tripStartDate?: string;
  tripEndDate?: string;
  tripStartPoint?: string;
  tripEndPoint?: string;
  appliedOn?: string;
  paymentMode?: string;
  modeOfTransport?: string; // e.g. Cab, Auto, Flight, Train, Metro, Personal Vehicle
  startingPoint?: string;
  destination?: string;
  tripDurationDays?: number;

  // Sub-expenses for Trip Expenses
  travelExpenses?: {
    id: string;
    startDate: string;
    endDate: string;
    modeOfTransport: string;
    purpose: string;
    merchant: string;
    startLocation: string;
    endLocation: string;
    distanceKms?: number;
    currency: string;
    amount: number;
    attachmentName?: string;
  }[];
  accommodationExpenses?: {
    id: string;
    startDate: string;
    endDate: string;
    currency: string;
    amount: number;
    detail: string;
    attachmentName?: string;
  }[];
  otherExpenses?: {
    id: string;
    transactionDate: string;
    category: string;
    merchant: string;
    currency: string;
    amount: number;
    purpose: string;
    attachmentName?: string;
  }[];
  advanceRequests?: {
    id: string;
    amount: number;
    detail: string;
  }[];

  addedToPayroll?: boolean;
  history?: ExpenseHistoryItem[];
  commentsList?: ExpenseComment[];
  createdAt: string;
}

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  projectId: string;
  projectName: string;
  weekStartDate: string;
  monHours: number;
  tueHours: number;
  wedHours: number;
  thuHours: number;
  friHours: number;
  satHours: number;
  sunHours: number;
  totalHours: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  module: string;
  description: string;
  ipAddress: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  category?: 'ATTENDANCE' | 'LEAVE' | 'PROJECTS' | 'EXPENSE' | 'DOCUMENTS' | 'CELEBRATIONS' | 'TRAINING' | 'MEETINGS' | 'SYSTEM';
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  priority: 'NORMAL' | 'IMPORTANT' | 'HIGH';
  department?: string;
}

// Enterprise Holiday Calendar Types
export type HolidayRegion = 'NATIONAL' | 'NORTH_INDIA' | 'SOUTH_INDIA';
export type HolidayType = 'MANDATORY' | 'OPTIONAL' | 'RESTRICTED';

export interface Holiday {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  region: HolidayRegion;
  type: HolidayType;
  description: string;
  icon?: string;
  isRecurring: boolean;
  branchId?: string;
  dayOfWeek?: string;
}

// Branch Management Types
export interface Branch {
  id: string;
  name: string;
  code: string; // e.g. "BLR-HQ", "DEL-NOIDA", "CHE-OMR"
  city: string;
  state: string;
  region: 'NORTH_INDIA' | 'SOUTH_INDIA' | 'WEST_INDIA' | 'EAST_INDIA' | 'OVERSEAS';
  address: string;
  managerId?: string;
  managerName?: string;
  employeeCount: number;
  attendancePercentage: number;
  leavePercentage: number;
  expenseTotal: number;
  monthlyPayroll: number;
  floorsCount: number;
}

// Excel Week Plan & Task Types
export interface WeeklyTask {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  task: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  department: DepartmentType;
  project: string;
  deadline: string;
  remarks?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  progressPercent: number;
  managerComments?: string;
  weekNumber?: number;
}

// Engagement & Celebration Types
export type CelebrationType =
  | 'BIRTHDAY'
  | 'WORK_ANNIVERSARY'
  | 'COMPANY_ANNIVERSARY'
  | 'PROMOTION'
  | 'MARRIAGE_ANNIVERSARY'
  | 'FESTIVAL'
  | 'RETIREMENT'
  | 'CUSTOM_EVENT';

export interface CelebrationEvent {
  id: string;
  employeeId?: string;
  employeeName?: string;
  avatar?: string;
  type: CelebrationType;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
  scheduledBy?: string;
  attendeesCount?: number;
  location?: string;
}

// Yearly Leave Ledger Types
export type ExtendedLeaveType =
  | 'ANNUAL'
  | 'CASUAL'
  | 'SICK'
  | 'COMP_OFF'
  | 'OPTIONAL'
  | 'RESTRICTED'
  | 'LOSS_OF_PAY'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'EMERGENCY';

export interface YearlyLeaveLedgerItem {
  leaveType: ExtendedLeaveType;
  totalAllocated: number;
  used: number;
  remaining: number;
  pending: number;
  rejected: number;
  cancelled: number;
  approved: number;
}


export interface DepartmentSummary {
  name: DepartmentType;
  label: string;
  headName: string;
  employeeCount: number;
  budgetMonthly: number;
  openPositions: number;
  iconName: string;
}

export interface DashboardMetrics {
  totalEmployees: number;
  activeToday: number;
  onLeaveToday: number;
  lateArrivals: number;
  pendingLeaveApprovals: number;
  monthlyPayrollTotal: number;
  openJobsCount: number;
  openTicketsCount: number;
  attendancePercentage: number;
  retentionRate: number;
}
