import { executeQuery } from '../database/db';
import { Employee } from '../types';

let mockEmployees: Employee[] = [
  {
    id: 'emp-0a',
    code: 'TOK-1000',
    firstName: 'Vaibhav',
    lastName: 'Rajput',
    email: 'vaibhav.rajput@theiakshi.com',
    phone: '+91 98765 00000',
    role: 'SUPER_ADMIN',
    department: 'EXECUTIVE',
    designation: 'Managing Director & CEO',
    status: 'ACTIVE',
    joiningDate: '2021-01-01',
    salary: {
      basic: 150000,
      hra: 60000,
      specialAllowance: 30000,
      conveyance: 20000,
      pfEmployee: 1800,
      pfEmployer: 1800,
      esiEmployee: 0,
      tdsTax: 25000,
      grossSalary: 260000,
      netSalary: 212000,
    },
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    location: 'Bengaluru HQ',
    address: 'Indiranagar 100ft Road, Bengaluru',
    gender: 'MALE',
    dob: '1990-05-15',
    maritalStatus: 'MARRIED',
    skills: ['Strategic HR', 'Corporate Governance', 'Leadership'],
    emergencyContact: { name: 'Priya Rajput', relationship: 'Spouse', phone: '+91 98765 00001' },
    bankDetails: {
      accountNumber: '998877665544',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0001234',
      branchName: 'Koramangala',
      panNumber: 'ABCDE1234F',
      pfUan: '100900800700',
    },
    documents: [],
  },
  {
    id: 'emp-0b',
    code: 'TOK-1000B',
    firstName: 'Vaibhav',
    lastName: 'Arya',
    email: 'vaibhavarya058@gmail.com',
    phone: '+91 98765 00001',
    role: 'SUPER_ADMIN',
    department: 'EXECUTIVE',
    designation: 'Managing Director & CEO',
    status: 'ACTIVE',
    joiningDate: '2021-01-01',
    salary: {
      basic: 150000,
      hra: 60000,
      specialAllowance: 30000,
      conveyance: 20000,
      pfEmployee: 1800,
      pfEmployer: 1800,
      esiEmployee: 0,
      tdsTax: 25000,
      grossSalary: 260000,
      netSalary: 212000,
    },
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    location: 'Bengaluru HQ',
    address: 'Koramangala, Bengaluru',
    gender: 'MALE',
    dob: '1992-08-20',
    maritalStatus: 'SINGLE',
    skills: ['Architecture', 'Full-Stack Engineering', 'Executive Management'],
    emergencyContact: { name: 'A. Arya', relationship: 'Parent', phone: '+91 98765 00002' },
    bankDetails: {
      accountNumber: '112233445566',
      bankName: 'ICICI Bank',
      ifscCode: 'ICIC0005678',
      branchName: 'MG Road',
      panNumber: 'XYZPD9876K',
      pfUan: '100900800701',
    },
    documents: [],
  },
];

export class EmployeeRepository {
  async findAll(search?: string, department?: string): Promise<Employee[]> {
    let allEmployees: Employee[] = [...mockEmployees];
    try {
      const rows = await executeQuery('SELECT * FROM employees ORDER BY created_at ASC');
      if (rows && rows.length > 0) {
        const sqlEmployees: Employee[] = rows.map((r) => ({
          id: r.id,
          code: r.code || `TOK-${Math.floor(1000 + Math.random() * 9000)}`,
          firstName: r.first_name,
          lastName: r.last_name,
          email: r.email,
          phone: r.phone || '',
          role: r.role,
          department: r.department,
          designation: r.designation,
          managerName: r.manager_name,
          status: r.status || 'ACTIVE',
          joiningDate: r.joining_date ? String(r.joining_date).slice(0, 10) : '2023-01-01',
          salary: {
            basic: Number(r.salary_basic || 0),
            hra: Number(r.salary_hra || 0),
            specialAllowance: Number(r.salary_special_allowance || 0),
            conveyance: Number(r.salary_conveyance || 0),
            pfEmployee: Number(r.salary_pf_employee || 0),
            pfEmployer: Number(r.salary_pf_employer || 0),
            esiEmployee: Number(r.salary_esi_employee || 0),
            tdsTax: Number(r.salary_tds_tax || 0),
            grossSalary: Number(r.salary_gross || 0),
            netSalary: Number(r.salary_net || 0),
          },
          avatar: r.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
          location: r.location || 'Bengaluru HQ',
          address: r.address || '',
          gender: r.gender || 'MALE',
          dob: r.dob ? String(r.dob).slice(0, 10) : '1995-01-01',
          maritalStatus: r.marital_status || 'SINGLE',
          skills: r.skills ? String(r.skills).split(',') : [],
          emergencyContact: {
            name: r.emergency_contact_name || '',
            relationship: r.emergency_contact_rel || '',
            phone: r.emergency_contact_phone || '',
          },
          bankDetails: {
            accountNumber: r.bank_account_number || '',
            bankName: r.bank_name || '',
            ifscCode: r.bank_ifsc || '',
            branchName: r.bank_branch || '',
            panNumber: r.pan_number || '',
            pfUan: r.pf_uan || '',
          },
          documents: [],
        }));
        const map = new Map<string, Employee>();
        mockEmployees.forEach((e) => map.set(e.id, e));
        sqlEmployees.forEach((e) => map.set(e.id, e));
        allEmployees = Array.from(map.values());
      }
    } catch (e) {
      // Fallback to in-memory store
    }

    let filtered = [...allEmployees];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q)
      );
    }
    if (department && department !== 'ALL') {
      filtered = filtered.filter((e) => e.department === department);
    }
    return filtered;
  }

  async findById(id: string): Promise<Employee | null> {
    const employees = await this.findAll();
    return employees.find((e) => e.id === id || e.email === id) || null;
  }

  async findByEmail(email: string): Promise<Employee | null> {
    const employees = await this.findAll();
    return employees.find((e) => e.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async save(employee: Employee): Promise<Employee> {
    if (!employee.id) employee.id = `emp-${Date.now()}`;
    if (!employee.code) employee.code = `TOK-${Math.floor(1000 + Math.random() * 9000)}`;
    const existingIndex = mockEmployees.findIndex((e) => e.id === employee.id);
    if (existingIndex >= 0) {
      mockEmployees[existingIndex] = employee;
    } else {
      mockEmployees.push(employee);
    }

    try {
      await executeQuery(
        `INSERT INTO employees (id, code, first_name, last_name, email, phone, role, department, designation, status, joining_date, salary_gross, salary_net)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           email = EXCLUDED.email,
           role = EXCLUDED.role,
           department = EXCLUDED.department,
           designation = EXCLUDED.designation,
           status = EXCLUDED.status`,
        [
          employee.id,
          employee.code,
          employee.firstName,
          employee.lastName,
          employee.email,
          employee.phone,
          employee.role,
          employee.department,
          employee.designation,
          employee.status,
          employee.joiningDate,
          employee.salary.grossSalary,
          employee.salary.netSalary,
        ]
      );
    } catch (e) {
      // Postgres sync notice
    }

    return employee;
  }

  async delete(id: string): Promise<boolean> {
    mockEmployees = mockEmployees.filter((e) => e.id !== id);
    try {
      await executeQuery('DELETE FROM employees WHERE id = $1', [id]);
    } catch (e) {}
    return true;
  }
}
