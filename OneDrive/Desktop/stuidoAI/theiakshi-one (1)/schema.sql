-- ====================================================================
-- THEIAKSHI ENTERPRISES - HRMS ENTERPRISE DATABASE SCHEMA & SEED DATA
-- Target Compatibility: PostgreSQL 12+, MySQL 8.0+, SQLite 3+, Cloud SQL
-- Generated for Production Deployment
-- ====================================================================

-- Enable extensions if using PostgreSQL
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. SYSTEM CONFIGURATION & GEOFENCE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_config (
    id VARCHAR(50) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255),
    support_email VARCHAR(255),
    shift_start_time VARCHAR(10) DEFAULT '09:00',
    shift_end_time VARCHAR(10) DEFAULT '18:00',
    grace_minutes INT DEFAULT 15,
    half_day_threshold_time VARCHAR(10) DEFAULT '11:30',
    auto_deduct_leave_for_two_half_days BOOLEAN DEFAULT TRUE,
    require_gps_clock_in BOOLEAN DEFAULT TRUE,
    session_timeout_mins INT DEFAULT 60,
    require_2fa_for_super_admin BOOLEAN DEFAULT FALSE,
    allow_employee_profile_edit BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS geofence_settings (
    id VARCHAR(50) PRIMARY KEY,
    office_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    radius_meters INT NOT NULL,
    enforce_strict_geofence BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 2. BRANCHES & WORKSPACES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(50) NOT NULL, -- NORTH, SOUTH, WEST, EAST
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    address TEXT,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    is_headquarters BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workspaces (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    radius_meters INT DEFAULT 500,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    employee_count INT DEFAULT 0
);

-- --------------------------------------------------------------------
-- 3. DEPARTMENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    head_name VARCHAR(255) DEFAULT 'Unassigned',
    employee_count INT DEFAULT 0,
    budget_monthly DECIMAL(12, 2) DEFAULT 0.00,
    open_positions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 4. EMPLOYEES & CREDENTIALS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL, -- SUPER_ADMIN, HR_MANAGER, TEAM_MANAGER, EMPLOYEE, FINANCE, RECRUITER
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    manager_id VARCHAR(50),
    manager_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, ON_LEAVE, TERMINATED, PROBATION
    joining_date DATE NOT NULL,
    avatar TEXT,
    location VARCHAR(255),
    address TEXT,
    gender VARCHAR(20),
    dob DATE,
    marital_status VARCHAR(20),
    skills TEXT, -- JSON or Comma-separated list
    salary_basic DECIMAL(10, 2) DEFAULT 0.00,
    salary_hra DECIMAL(10, 2) DEFAULT 0.00,
    salary_special_allowance DECIMAL(10, 2) DEFAULT 0.00,
    salary_conveyance DECIMAL(10, 2) DEFAULT 0.00,
    salary_pf_employee DECIMAL(10, 2) DEFAULT 0.00,
    salary_pf_employer DECIMAL(10, 2) DEFAULT 0.00,
    salary_esi_employee DECIMAL(10, 2) DEFAULT 0.00,
    salary_tds_tax DECIMAL(10, 2) DEFAULT 0.00,
    salary_gross DECIMAL(10, 2) DEFAULT 0.00,
    salary_net DECIMAL(10, 2) DEFAULT 0.00,
    bank_account_number VARCHAR(100),
    bank_name VARCHAR(100),
    bank_ifsc VARCHAR(50),
    bank_branch VARCHAR(100),
    pan_number VARCHAR(50),
    pf_uan VARCHAR(50),
    emergency_contact_name VARCHAR(100),
    emergency_contact_rel VARCHAR(50),
    emergency_contact_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credentials (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    employee_code VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 5. ATTENDANCE & LEAVES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    clock_in VARCHAR(20),
    clock_out VARCHAR(20),
    total_hours DECIMAL(4, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL, -- PRESENT, LATE, HALF_DAY, ABSENT, ON_LEAVE, WEEKEND, HOLIDAY
    clock_in_location TEXT,
    clock_out_location TEXT,
    is_geofenced BOOLEAN DEFAULT TRUE,
    work_mode VARCHAR(50) DEFAULT 'OFFICE', -- OFFICE, REMOTE, HYBRID, FIELD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_code VARCHAR(50),
    department VARCHAR(100),
    type VARCHAR(50) NOT NULL, -- CASUAL, SICK, EARNED, MATERNITY, PATERNITY, BEREAVEMENT, UNPAID
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count DECIMAL(4, 1) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED
    applied_on DATE DEFAULT CURRENT_DATE,
    approved_by VARCHAR(255),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS yearly_leave_ledgers (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_code VARCHAR(50),
    department VARCHAR(100),
    year INT NOT NULL,
    casual_quota DECIMAL(4, 1) DEFAULT 12.0,
    casual_used DECIMAL(4, 1) DEFAULT 0.0,
    casual_balance DECIMAL(4, 1) DEFAULT 12.0,
    sick_quota DECIMAL(4, 1) DEFAULT 12.0,
    sick_used DECIMAL(4, 1) DEFAULT 0.0,
    sick_balance DECIMAL(4, 1) DEFAULT 12.0,
    earned_quota DECIMAL(4, 1) DEFAULT 15.0,
    earned_used DECIMAL(4, 1) DEFAULT 0.0,
    earned_balance DECIMAL(4, 1) DEFAULT 15.0,
    loss_of_pay_days DECIMAL(4, 1) DEFAULT 0.0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 6. PAYROLL & EXPENSES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payslips (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    employee_code VARCHAR(50),
    month VARCHAR(20) NOT NULL, -- e.g. '2026-07'
    pay_period VARCHAR(100),
    basic_pay DECIMAL(10, 2) NOT NULL,
    hra DECIMAL(10, 2) NOT NULL,
    special_allowance DECIMAL(10, 2) DEFAULT 0.00,
    conveyance DECIMAL(10, 2) DEFAULT 0.00,
    gross_earnings DECIMAL(10, 2) NOT NULL,
    pf_deduction DECIMAL(10, 2) DEFAULT 0.00,
    tds_deduction DECIMAL(10, 2) DEFAULT 0.00,
    esi_deduction DECIMAL(10, 2) DEFAULT 0.00,
    total_deductions DECIMAL(10, 2) NOT NULL,
    net_pay DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PAID', -- PAID, PROCESSING, HELD
    payment_date DATE,
    bank_account_number VARCHAR(100),
    bank_ifsc VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expense_claims (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- Travel, Food, Accommodation, Office Supplies, Client Entertainment
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'SUBMITTED', -- SUBMITTED, APPROVED, REJECTED, REIMBURSED
    receipt_url TEXT,
    approved_by VARCHAR(255),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expense_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    max_limit_per_claim DECIMAL(10, 2) DEFAULT 50000.00,
    receipt_required BOOLEAN DEFAULT TRUE,
    requires_manager_approval BOOLEAN DEFAULT TRUE,
    requires_finance_approval BOOLEAN DEFAULT TRUE
);

-- --------------------------------------------------------------------
-- 7. RECRUITMENT & ASSETS & HELPDESK
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_postings (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'FULL_TIME',
    min_experience INT DEFAULT 0,
    max_experience INT DEFAULT 10,
    salary_range VARCHAR(100),
    openings INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, CLOSED, DRAFT
    description TEXT,
    posted_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidates (
    id VARCHAR(50) PRIMARY KEY,
    job_id VARCHAR(50) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    stage VARCHAR(50) DEFAULT 'APPLIED', -- APPLIED, SCREENING, INTERVIEW, OFFERED, HIRED, REJECTED
    resume_url TEXT,
    applied_date DATE DEFAULT CURRENT_DATE,
    rating DECIMAL(2, 1) DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(50) PRIMARY KEY,
    asset_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- Laptop, Mobile, Monitor, Peripheral, Vehicle, Software
    serial_number VARCHAR(100),
    assigned_to_id VARCHAR(50),
    assigned_to_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ASSIGNED', -- ASSIGNED, AVAILABLE, IN_REPAIR, RETIRED
    purchase_date DATE,
    purchase_value DECIMAL(10, 2),
    warranty_expiry DATE,
    condition_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS helpdesk_tickets (
    id VARCHAR(50) PRIMARY KEY,
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    raised_by_id VARCHAR(50) NOT NULL,
    raised_by_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- IT Support, HR Policy, Payroll & Claims, Facilities, Hardware
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
    assigned_to_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (raised_by_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 8. PROJECTS & TASKS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255),
    lead_name VARCHAR(255),
    department VARCHAR(100),
    start_date DATE,
    deadline DATE,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS', -- PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED
    budget DECIMAL(12, 2) DEFAULT 0.00,
    completion_percentage INT DEFAULT 0,
    team_members TEXT, -- JSON or Comma-separated names/IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS weekly_tasks (
    id VARCHAR(50) PRIMARY KEY,
    assigned_to_id VARCHAR(50) NOT NULL,
    assigned_to_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, OVERDUE
    category VARCHAR(50) DEFAULT 'WEEKLY_PLAN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 9. ENTERPRISE HOLIDAYS & EVENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS holidays (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) DEFAULT 'NATIONAL', -- NATIONAL, NORTH_INDIA, SOUTH_INDIA, OPTIONAL, BRANCH, COMPANY_EVENT
    region VARCHAR(50) DEFAULT 'ALL', -- ALL, NORTH, SOUTH, BENGALURU, GURUGRAM, MUMBAI
    description TEXT,
    color_hex VARCHAR(20) DEFAULT '#3B82F6',
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS celebration_events (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50),
    employee_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- BIRTHDAY, WORK_ANNIVERSARY, TEAM_OUTING, RECOGNITION
    event_date DATE NOT NULL,
    description TEXT,
    years_completed INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 10. AUDIT LOGS & NOTIFICATIONS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(20) DEFAULT 'INFO' -- INFO, WARNING, SECURITY, ERROR
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    recipient_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO', -- INFO, SUCCESS, WARNING, ALERT, TASK
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- INDEXES FOR MAXIMUM PRODUCTION QUERY PERFORMANCE
-- --------------------------------------------------------------------
CREATE INDEX idx_emp_email ON employees(email);
CREATE INDEX idx_emp_dept ON employees(department);
CREATE INDEX idx_emp_role ON employees(role);
CREATE INDEX idx_emp_code ON employees(code);
CREATE INDEX idx_cred_email ON credentials(email);
CREATE INDEX idx_att_date ON attendance_records(date);
CREATE INDEX idx_att_emp ON attendance_records(employee_id);
CREATE INDEX idx_leave_emp ON leave_requests(employee_id);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_payslip_emp ON payslips(employee_id);
CREATE INDEX idx_payslip_month ON payslips(month);
CREATE INDEX idx_expense_emp ON expense_claims(employee_id);
CREATE INDEX idx_ticket_emp ON helpdesk_tickets(raised_by_id);
CREATE INDEX idx_audit_time ON audit_logs(timestamp);
CREATE INDEX idx_notif_recip ON notifications(recipient_id);
CREATE INDEX idx_holidays_date ON holidays(date);

-- ====================================================================
-- SEED INITIAL PRODUCTION DATA
-- ====================================================================

-- System Config
INSERT INTO system_config (id, company_name, subdomain, support_email, shift_start_time, shift_end_time, grace_minutes, half_day_threshold_time)
VALUES ('cfg-1', 'THEIAKSHI ENTERPRISES', 'theiakshi-one.app', 'support@theiakshi.com', '09:00', '18:00', 15, '11:30')
ON CONFLICT (id) DO NOTHING;

-- Geofence Settings
INSERT INTO geofence_settings (id, office_name, latitude, longitude, radius_meters, enforce_strict_geofence)
VALUES ('geo-1', 'Headquarters Bengaluru', 12.971600, 77.594600, 500, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Branches
INSERT INTO branches (id, code, name, region, city, state, is_headquarters, latitude, longitude)
VALUES 
('br-1', 'BLR-HQ', 'Bengaluru Global HQ', 'SOUTH', 'Bengaluru', 'Karnataka', TRUE, 12.971600, 77.594600),
('br-2', 'DEL-HUB', 'Delhi NCR Innovation Hub', 'NORTH', 'Gurugram', 'Haryana', FALSE, 28.459500, 77.026600),
('br-3', 'BOM-FIN', 'Mumbai Financial Center', 'WEST', 'Mumbai', 'Maharashtra', FALSE, 19.065700, 72.868700)
ON CONFLICT (id) DO NOTHING;

-- Departments
INSERT INTO departments (id, name, label, head_name, employee_count, budget_monthly, open_positions)
VALUES 
('dept-1', 'ENGINEERING', 'Engineering & Technology', 'Vikram Verma', 42, 4500000.00, 4),
('dept-2', 'HUMAN_RESOURCES', 'Human Resources & Talent', 'Sneha Kulkarni', 12, 1200000.00, 2),
('dept-3', 'FINANCE', 'Finance & Accounts', 'Rajesh Nair', 8, 1100000.00, 1),
('dept-4', 'MARKETING', 'Growth & Marketing', 'Pooja Mehta', 10, 1500000.00, 3),
('dept-5', 'OPERATIONS', 'Global Operations & Facilities', 'Sujit Roy', 15, 1800000.00, 0),
('dept-6', 'DESIGN', 'UI/UX & Product Design', 'Rohan Sen', 6, 900000.00, 1),
('dept-7', 'SALES', 'Enterprise Sales', 'Anil Kapoor', 18, 2800000.00, 5),
('dept-8', 'LEGAL', 'Legal & Corporate Governance', 'Kavita Das', 4, 800000.00, 0),
('dept-9', 'EXECUTIVE', 'Executive Management', 'Vaibhav Rajput', 2, 5000000.00, 0)
ON CONFLICT (id) DO NOTHING;

-- Key Employees
INSERT INTO employees (id, code, first_name, last_name, email, phone, role, department, designation, manager_name, status, joining_date, location, salary_basic, salary_gross, salary_net)
VALUES 
('emp-0a', 'TOK-1000', 'Vaibhav', 'Rajput', 'vaibhav.rajput@theiakshi.com', '+91 98765 00000', 'SUPER_ADMIN', 'EXECUTIVE', 'Managing Director & CEO', 'Board of Directors', 'ACTIVE', '2021-01-01', 'Headquarters, Bengaluru', 150000.00, 260000.00, 212000.00),
('emp-0b', 'TOK-1000B', 'Vaibhav', 'Arya', 'vaibhavarya058@gmail.com', '+91 98765 00001', 'SUPER_ADMIN', 'EXECUTIVE', 'Managing Director & CEO', 'Board of Directors', 'ACTIVE', '2021-01-01', 'Headquarters, Bengaluru', 150000.00, 260000.00, 212000.00),
('emp-1', 'TOK-1001', 'Arjun', 'Sharma', 'arjun.sharma@theiakshi.com', '+91 98765 43210', 'SUPER_ADMIN', 'ENGINEERING', 'Chief Technology Officer', 'Board of Directors', 'ACTIVE', '2021-01-15', 'Headquarters, Bengaluru', 120000.00, 210000.00, 170600.00),
('emp-2', 'TOK-1002', 'Sneha', 'Kulkarni', 'sneha.kulkarni@theiakshi.com', '+91 98123 45678', 'HR_MANAGER', 'HUMAN_RESOURCES', 'VP of Human Capital', 'Arjun Sharma', 'ACTIVE', '2021-04-01', 'Headquarters, Bengaluru', 95000.00, 166000.00, 136600.00),
('emp-3', 'TOK-1003', 'Vikram', 'Verma', 'vikram.verma@theiakshi.com', '+91 97654 32109', 'TEAM_MANAGER', 'ENGINEERING', 'Engineering Manager', 'Arjun Sharma', 'ACTIVE', '2022-02-10', 'Headquarters, Bengaluru', 85000.00, 148000.00, 122800.00),
('emp-4', 'TOK-1004', 'Ananya', 'Rao', 'ananya.rao@theiakshi.com', '+91 96543 21098', 'EMPLOYEE', 'ENGINEERING', 'Senior Full-Stack Engineer', 'Vikram Verma', 'ACTIVE', '2022-08-01', 'Hybrid, Bengaluru', 65000.00, 114000.00, 96700.00),
('emp-5', 'TOK-1005', 'Rajesh', 'Nair', 'rajesh.nair@theiakshi.com', '+91 95432 10987', 'FINANCE', 'FINANCE', 'Finance Controller', 'Arjun Sharma', 'ACTIVE', '2023-01-10', 'Headquarters, Bengaluru', 75000.00, 132000.00, 108400.00),
('emp-6', 'TOK-1006', 'Kavya', 'Iyer', 'kavya.iyer@theiakshi.com', '+91 94321 09876', 'RECRUITER', 'HUMAN_RESOURCES', 'Senior Talent Recruiter', 'Sneha Kulkarni', 'ACTIVE', '2023-04-15', 'Headquarters, Bengaluru', 55000.00, 98000.00, 82400.00)
ON CONFLICT (id) DO NOTHING;

-- Initial Credentials
INSERT INTO credentials (id, employee_id, employee_code, employee_name, email, password_hash, role)
VALUES 
('cred-0a', 'emp-0a', 'TOK-1000', 'Vaibhav Rajput', 'vaibhav.rajput@theiakshi.com', 'password123', 'SUPER_ADMIN'),
('cred-0b', 'emp-0b', 'TOK-1000B', 'Vaibhav Arya', 'vaibhavarya058@gmail.com', 'password123', 'SUPER_ADMIN'),
('cred-1', 'emp-1', 'TOK-1001', 'Arjun Sharma', 'arjun.sharma@theiakshi.com', 'admin123', 'SUPER_ADMIN'),
('cred-2', 'emp-2', 'TOK-1002', 'Sneha Kulkarni', 'sneha.kulkarni@theiakshi.com', 'password123', 'HR_MANAGER'),
('cred-3', 'emp-3', 'TOK-1003', 'Vikram Verma', 'vikram.verma@theiakshi.com', 'password123', 'TEAM_MANAGER'),
('cred-4', 'emp-4', 'TOK-1004', 'Ananya Rao', 'ananya.rao@theiakshi.com', 'password123', 'EMPLOYEE'),
('cred-5', 'emp-5', 'TOK-1005', 'Rajesh Nair', 'rajesh.nair@theiakshi.com', 'password123', 'FINANCE'),
('cred-6', 'emp-6', 'TOK-1006', 'Kavya Iyer', 'kavya.iyer@theiakshi.com', 'password123', 'RECRUITER')
ON CONFLICT (id) DO NOTHING;

-- National & Regional Holidays 2026
INSERT INTO holidays (id, name, date, type, region, description, color_hex, is_optional)
VALUES 
('hol-1', 'Republic Day', '2026-01-26', 'NATIONAL', 'ALL', 'National holiday celebrating the Constitution of India', '#DC2626', FALSE),
('hol-2', 'Maha Shivratri', '2026-02-15', 'NORTH_INDIA', 'NORTH', 'Festival dedicated to Lord Shiva', '#8B5CF6', TRUE),
('hol-3', 'Holi Festival of Colors', '2026-03-04', 'NATIONAL', 'ALL', 'Spring festival celebrated across regions', '#EC4899', FALSE),
('hol-4', 'Ugadi / Gudi Padwa', '2026-03-19', 'SOUTH_INDIA', 'SOUTH', 'New Year festival of Karnataka, AP, and Telangana', '#10B981', FALSE),
('hol-5', 'Good Friday', '2026-04-03', 'NATIONAL', 'ALL', 'Christian holy holiday', '#6366F1', FALSE),
('hol-6', 'May Day / Labor Day', '2026-05-01', 'NATIONAL', 'ALL', 'International Workers Day', '#F59E0B', FALSE),
('hol-7', 'Independence Day', '2026-08-15', 'NATIONAL', 'ALL', '79th Indian Independence Day celebration', '#DC2626', FALSE),
('hol-8', 'Ganesh Chaturthi', '2026-09-14', 'SOUTH_INDIA', 'SOUTH', 'Grand festival of Lord Ganesha', '#8B5CF6', FALSE),
('hol-9', 'Gandhi Jayanti', '2026-10-02', 'NATIONAL', 'ALL', 'Birth anniversary of Mahatma Gandhi', '#059669', FALSE),
('hol-10', 'Maha Navami / Dussehra', '2026-10-19', 'NATIONAL', 'ALL', 'Vijayadashami celebrations', '#D97706', FALSE),
('hol-11', 'Karnataka Rajyotsava', '2026-11-01', 'BRANCH', 'BENGALURU', 'Karnataka Formation Day (Bengaluru HQ)', '#2563EB', FALSE),
('hol-12', 'Diwali / Deepavali', '2026-11-08', 'NATIONAL', 'ALL', 'Festival of Lights main celebration', '#EAB308', FALSE),
('hol-13', 'Christmas Day', '2026-12-25', 'NATIONAL', 'ALL', 'Global Christmas holiday', '#059669', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Initial Audit Log
INSERT INTO audit_logs (id, user_name, user_role, action, module, description, ip_address, severity)
VALUES 
('log-101', 'System Initialization Engine', 'SUPER_ADMIN', 'DATABASE_BOOTSTRAP', 'System Core', 'Enterprise database structure initialized and seeded for production deployment.', '127.0.0.1', 'INFO')
ON CONFLICT (id) DO NOTHING;

-- End of schema file
