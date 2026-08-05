import { EmployeeRepository } from '../repositories/employeeRepository';
import { Employee } from '../types';

const repo = new EmployeeRepository();

export class EmployeeService {
  async getAllEmployees(search?: string, department?: string) {
    return repo.findAll(search, department);
  }

  async getEmployeeById(id: string) {
    const emp = await repo.findById(id);
    if (!emp) throw new Error('Employee not found');
    return emp;
  }

  async createEmployee(data: Partial<Employee>) {
    const id = `emp-${Date.now().toString(36)}`;
    const code = `TOK-${Math.floor(1000 + Math.random() * 9000)}`;

    const newEmp: Employee = {
      id,
      code,
      firstName: data.firstName || 'Employee',
      lastName: data.lastName || 'User',
      email: data.email || `${id}@theiakshi.com`,
      phone: data.phone || '+91 98765 00000',
      role: data.role || 'EMPLOYEE',
      department: data.department || 'ENGINEERING',
      designation: data.designation || 'Software Engineer',
      status: 'ACTIVE',
      joiningDate: data.joiningDate || new Date().toISOString().slice(0, 10),
      salary: data.salary || {
        basic: 50000,
        hra: 20000,
        specialAllowance: 10000,
        conveyance: 5000,
        pfEmployee: 1800,
        pfEmployer: 1800,
        esiEmployee: 0,
        tdsTax: 5000,
        grossSalary: 85000,
        netSalary: 73200,
      },
      avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      location: data.location || 'Bengaluru HQ',
      address: data.address || '',
      gender: data.gender || 'MALE',
      dob: data.dob || '1995-01-01',
      maritalStatus: data.maritalStatus || 'SINGLE',
      skills: data.skills || ['JavaScript', 'TypeScript'],
      emergencyContact: data.emergencyContact || { name: 'Emergency Contact', relationship: 'Relative', phone: '+91 98765 00000' },
      bankDetails: data.bankDetails || {
        accountNumber: '123456789012',
        bankName: 'HDFC Bank',
        ifscCode: 'HDFC0001234',
        branchName: 'Main Branch',
        panNumber: 'ABCDE1234F',
        pfUan: '100900800700',
      },
      documents: [],
    };

    return repo.save(newEmp);
  }

  async updateEmployee(id: string, updates: Partial<Employee>) {
    const existing = await repo.findById(id);
    if (!existing) throw new Error('Employee not found');

    const updated = {
      ...existing,
      ...updates,
      salary: { ...existing.salary, ...(updates.salary || {}) },
    };

    return repo.save(updated);
  }

  async deleteEmployee(id: string) {
    return repo.delete(id);
  }

  async getReportingHierarchy() {
    const all = await repo.findAll();
    return {
      ceo: all.filter((e) => e.role === 'SUPER_ADMIN'),
      managers: all.filter((e) => e.role === 'TEAM_MANAGER' || e.role === 'HR_MANAGER'),
      team: all.filter((e) => e.role === 'EMPLOYEE'),
    };
  }
}
