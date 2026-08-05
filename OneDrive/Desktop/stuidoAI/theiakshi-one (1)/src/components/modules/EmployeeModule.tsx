import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit2,
  Trash2,
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Employee, DepartmentType, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { unwrapData, unwrapArray } from '../../lib/apiHelper';

export const EmployeeModule: React.FC = () => {
  const { currentUser, currentRole, hasPermission } = useAuth();
  const { showToast, openCopilotWithPrompt } = useNotification();

  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentUser?.role === 'SUPER_ADMIN' || hasPermission('employee:write');
  const canViewAllSalaries =
    isSuperAdmin ||
    currentRole === 'HR_MANAGER' ||
    currentRole === 'FINANCE' ||
    currentRole === 'PAYROLL_TEAM' ||
    currentUser?.role === 'HR_MANAGER' ||
    currentUser?.role === 'FINANCE' ||
    currentUser?.role === 'PAYROLL_TEAM';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Departments State
  const [departmentsList, setDepartmentsList] = useState<{ id: string; name: string; label: string }[]>([]);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [showInlineNewDeptAdd, setShowInlineNewDeptAdd] = useState(false);
  const [inlineNewDept, setInlineNewDept] = useState('');
  const [showInlineEditDeptAdd, setShowInlineEditDeptAdd] = useState(false);
  const [inlineEditDept, setInlineEditDept] = useState('');
  const [editingDeptItem, setEditingDeptItem] = useState<{ id: string; label: string } | null>(null);
  const [newDeptNameInput, setNewDeptNameInput] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals & Drawers
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'salary' | 'docs' | 'history'>('profile');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteModalEmp, setDeleteModalEmp] = useState<Employee | null>(null);
  const [editModalEmp, setEditModalEmp] = useState<Employee | null>(null);

  // Form state for new employee
  const [newForm, setNewForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: 'password123',
    phone: '',
    department: 'Engineering' as DepartmentType,
    designation: 'Software Engineer',
    role: 'EMPLOYEE' as UserRole,
    branch: 'Bengaluru Global HQ',
    managerId: '',
    joiningDate: '2026-08-01',
    location: 'Headquarters, Bengaluru',
    avatar: '',
    basicSalary: 60000,
    hra: 24000,
    specialAllowance: 16000,
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering' as DepartmentType,
    designation: '',
    role: 'EMPLOYEE' as UserRole,
    branch: '',
    managerId: '',
    location: '',
    status: 'ACTIVE' as any,
    avatar: '',
  });

  const loadDepartments = () => {
    fetch('/api/v1/departments')
      .then((res) => res.json())
      .then((data) => {
        const list = unwrapArray<any>(data);
        if (list.length > 0) {
          setDepartmentsList(list);
        } else {
          setDepartmentsList([
            { id: 'dept-1', name: 'ENGINEERING', label: 'Engineering' },
            { id: 'dept-2', name: 'HUMAN_RESOURCES', label: 'Human Resources' },
            { id: 'dept-3', name: 'FINANCE', label: 'Finance' },
            { id: 'dept-4', name: 'MARKETING', label: 'Marketing' },
            { id: 'dept-5', name: 'OPERATIONS', label: 'Operations' },
            { id: 'dept-6', name: 'DESIGN', label: 'Design' },
            { id: 'dept-7', name: 'SALES', label: 'Sales' },
            { id: 'dept-8', name: 'LEGAL', label: 'Legal' },
            { id: 'dept-9', name: 'EXECUTIVE', label: 'Executive' },
          ]);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadDepartments();
    fetch('/api/v1/branches')
      .then((res) => res.json())
      .then((data) => {
        setBranches(unwrapArray<any>(data));
      })
      .catch((err) => console.error(err));
  }, []);

  const handleCreateDepartmentQuick = (deptLabel: string, targetModal: 'ADD' | 'EDIT') => {
    if (!deptLabel || !deptLabel.trim()) {
      showToast('Validation Error', 'Department name is required', 'ERROR');
      return;
    }
    const labelClean = deptLabel.trim();
    const nameKey = labelClean.toUpperCase().replace(/\s+/g, '_');

    fetch('/api/v1/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nameKey,
        label: labelClean,
        headName: 'Unassigned',
        budgetMonthly: 1500000,
        openPositions: 0,
      }),
    })
      .then((res) => res.json())
      .then((created) => {
        showToast('Department Added', `Created new department: ${created.label}`, 'SUCCESS');
        loadDepartments();
        if (targetModal === 'ADD') {
          setNewForm((prev) => ({ ...prev, department: created.label as any }));
          setShowInlineNewDeptAdd(false);
          setInlineNewDept('');
        } else {
          setEditForm((prev) => ({ ...prev, department: created.label as any }));
          setShowInlineEditDeptAdd(false);
          setInlineEditDept('');
        }
      })
      .catch(() => {
        showToast('Error', 'Failed to create department', 'ERROR');
      });
  };

  const handleUpdateDepartmentLabel = (id: string, updatedLabel: string) => {
    if (!updatedLabel.trim()) return;
    fetch(`/api/v1/departments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: updatedLabel.trim(),
        name: updatedLabel.trim().toUpperCase().replace(/\s+/g, '_'),
      }),
    })
      .then((res) => res.json())
      .then((updated) => {
        showToast('Department Updated', `Renamed department to ${updated.label}`, 'SUCCESS');
        loadDepartments();
        setEditingDeptItem(null);
      })
      .catch(() => showToast('Error', 'Failed to update department', 'ERROR'));
  };

  const handleDeleteDepartment = (id: string, label: string) => {
    fetch(`/api/v1/departments/${id}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then(() => {
        showToast('Department Deleted', `Removed department "${label}"`, 'SUCCESS');
        loadDepartments();
      })
      .catch(() => showToast('Error', 'Failed to delete department', 'ERROR'));
  };

  const openEditModal = (emp: Employee) => {
    setEditModalEmp(emp);
    setEditForm({
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || 'ENGINEERING',
      designation: emp.designation || '',
      role: emp.role || 'EMPLOYEE',
      branch: emp.branch || 'Bengaluru Global HQ',
      managerId: emp.managerId || '',
      location: emp.location || '',
      status: emp.status || 'ACTIVE',
      avatar: emp.avatar || '',
    });
  };

  const handleUpdateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalEmp) return;

    const managerObj = employees.find((m) => m.id === editForm.managerId);
    const payload = {
      ...editForm,
      managerName: managerObj ? `${managerObj.firstName} ${managerObj.lastName}` : 'Executive Leadership',
    };

    fetch(`/api/v1/employees/${editModalEmp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((raw) => {
        const updated = unwrapData<Employee>(raw);
        showToast('Profile Updated', `Updated profile & permissions for ${updated.firstName || ''} ${updated.lastName || ''}`, 'SUCCESS');
        setEditModalEmp(null);
        loadEmployees();
      })
      .catch((err) => {
        showToast('Error', 'Failed to update employee profile', 'ERROR');
      });
  };

  const handleDeleteEmployee = (emp: Employee) => {
    fetch(`/api/v1/employees/${emp.id}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then(() => {
        showToast('Employee Deleted', `Successfully removed ${emp.firstName} ${emp.lastName} from database.`, 'SUCCESS');
        setDeleteModalEmp(null);
        if (selectedEmployee?.id === emp.id) setSelectedEmployee(null);
        loadEmployees();
      })
      .catch((err) => {
        showToast('Delete Error', 'Failed to delete employee profile.', 'ERROR');
      });
  };

  const loadEmployees = () => {
    setLoading(true);
    let url = '/api/v1/employees?';
    if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
    if (selectedDept !== 'ALL') url += `department=${selectedDept}&`;
    if (selectedRole !== 'ALL') url += `role=${selectedRole}&`;
    if (selectedStatus !== 'ALL') url += `status=${selectedStatus}&`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setEmployees(unwrapArray<Employee>(data));
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEmployees();
  }, [searchTerm, selectedDept, selectedRole, selectedStatus]);

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.firstName || !newForm.email) {
      showToast('Validation Error', 'Please fill required fields (Name and Email)', 'ERROR');
      return;
    }

    const gross = Number(newForm.basicSalary) + Number(newForm.hra) + Number(newForm.specialAllowance);
    const pf = Math.round(Number(newForm.basicSalary) * 0.12);
    const tds = Math.round(gross * 0.08);
    const net = gross - pf - tds;

    const managerObj = employees.find((m) => m.id === newForm.managerId);

    const payload = {
      ...newForm,
      managerName: managerObj ? `${managerObj.firstName} ${managerObj.lastName}` : 'Executive Leadership',
      avatar: newForm.avatar || '', // Do not auto add stock photo if user leaves blank
      salary: {
        basic: Number(newForm.basicSalary),
        hra: Number(newForm.hra),
        specialAllowance: Number(newForm.specialAllowance),
        conveyance: 5000,
        pfEmployee: pf,
        pfEmployer: pf,
        esiEmployee: 0,
        tdsTax: tds,
        grossSalary: gross,
        netSalary: net,
      },
      emergencyContact: { name: 'Emergency Contact', relationship: 'Parent', phone: '+91 99999 88888' },
      bankDetails: {
        accountNumber: '990011223344',
        bankName: 'HDFC Bank',
        ifscCode: 'HDFC0001001',
        branchName: 'Bengaluru',
        panNumber: 'ABCDE9999Z',
        pfUan: '1009899999',
      },
      gender: 'MALE',
      maritalStatus: 'SINGLE',
      skills: ['TypeScript', 'React', 'Problem Solving'],
    };

    fetch('/api/v1/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((raw) => {
        const created = unwrapData<Employee>(raw);
        showToast('Employee Added', `Created profile for ${created.firstName || 'Employee'} ${created.lastName || ''} (${created.code || ''})`, 'SUCCESS');
        setIsAddModalOpen(false);
        loadEmployees();
      })
      .catch((err) => {
        showToast('Error', 'Failed to create employee', 'ERROR');
      });
  };

  const handleExportCSV = () => {
    const headers = ['Code', 'First Name', 'Last Name', 'Email', 'Role', 'Department', 'Designation', 'Status', 'Joining Date'];
    const rows = employees.map((e) => [
      e.code,
      e.firstName,
      e.lastName,
      e.email,
      e.role,
      e.department,
      e.designation,
      e.status,
      e.joiningDate,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `THEIAKSHI_Employees_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();

    showToast('Export Successful', 'Downloaded employee records as CSV', 'SUCCESS');
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Workforce Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage employee profiles, designations, compensation structures, and emergency details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          {hasPermission('employee:write') && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, employee code, designation..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Departments</option>
            {departmentsList.map((d) => (
              <option key={d.id} value={d.label || d.name}>
                {d.label || d.name}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="HR_MANAGER">HR Manager</option>
            <option value="TEAM_MANAGER">Team Manager</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="RECRUITER">Recruiter</option>
            <option value="FINANCE">Finance</option>
            <option value="PAYROLL_TEAM">Payroll Team</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="PROBATION">Probation</option>
          </select>
        </div>
      </div>

      {/* Employee Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Department & Role</th>
                <th className="px-4 py-3">Joining Date</th>
                <th className="px-4 py-3">Monthly Gross</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatar}
                        alt={emp.firstName}
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-blue-500/20"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400">{emp.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {emp.code}
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{emp.designation}</div>
                    <div className="text-[10px] text-slate-500">{emp.department} • {emp.role.replace('_', ' ')}</div>
                  </td>

                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{emp.joiningDate}</td>

                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                    {canViewAllSalaries || emp.id === currentUser.id ? (
                      `₹${emp.salary.grossSalary.toLocaleString('en-IN')}`
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/60">
                        <Lock className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>Confidential</span>
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          : emp.status === 'ON_LEAVE'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedEmployee(emp)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </button>

                      {hasPermission('employee:write') && (
                        <>
                          <button
                            onClick={() => openEditModal(emp)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 transition-colors"
                            title="Edit Profile, Role & Reporting Manager"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteModalEmp(emp)}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400 transition-colors"
                            title="Delete Employee"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Detail Profile Modal/Drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <img
                  src={selectedEmployee.avatar}
                  alt={selectedEmployee.firstName}
                  className="h-14 w-14 rounded-2xl object-cover ring-4 ring-blue-500/20"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </h3>
                    <span className="rounded-md bg-blue-100 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {selectedEmployee.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedEmployee.designation} • {selectedEmployee.department}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedEmployee(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex border-b border-slate-200 px-5 dark:border-slate-800 bg-white dark:bg-slate-900">
              {[
                { id: 'profile', label: 'Personal & Employment' },
                {
                  id: 'salary',
                  label:
                    canViewAllSalaries || selectedEmployee.id === currentUser.id
                      ? 'Salary Structure'
                      : 'Salary Structure 🔒',
                },
                { id: 'docs', label: 'Documents & Verification' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveProfileTab(tab.id as any)}
                  className={`border-b-2 py-3 px-4 text-xs font-bold transition-colors ${
                    activeProfileTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {activeProfileTab === 'profile' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-2xl border border-slate-200/80 p-4 space-y-2 dark:border-slate-800">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 border-b pb-2">
                      Employment Info
                    </h4>
                    <div><span className="text-slate-400">Email:</span> <span className="font-semibold">{selectedEmployee.email}</span></div>
                    <div><span className="text-slate-400">Phone:</span> <span className="font-semibold">{selectedEmployee.phone}</span></div>
                    <div><span className="text-slate-400">Manager:</span> <span className="font-semibold">{selectedEmployee.managerName || 'Executive Board'}</span></div>
                    <div><span className="text-slate-400">Joining Date:</span> <span className="font-semibold">{selectedEmployee.joiningDate}</span></div>
                    <div><span className="text-slate-400">Location:</span> <span className="font-semibold">{selectedEmployee.location}</span></div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 p-4 space-y-2 dark:border-slate-800">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 border-b pb-2">
                      Emergency & Personal
                    </h4>
                    <div><span className="text-slate-400">Gender / DOB:</span> <span className="font-semibold">{selectedEmployee.gender} • {selectedEmployee.dob}</span></div>
                    <div><span className="text-slate-400">Marital Status:</span> <span className="font-semibold">{selectedEmployee.maritalStatus}</span></div>
                    <div><span className="text-slate-400">Emergency Contact:</span> <span className="font-semibold">{selectedEmployee.emergencyContact.name} ({selectedEmployee.emergencyContact.relationship})</span></div>
                    <div><span className="text-slate-400">Contact Phone:</span> <span className="font-semibold">{selectedEmployee.emergencyContact.phone}</span></div>
                  </div>
                </div>
              )}

              {activeProfileTab === 'salary' && (
                canViewAllSalaries || selectedEmployee.id === currentUser.id ? (
                  <div className="rounded-2xl border border-slate-200/80 p-5 space-y-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 border-b pb-2">
                      Monthly CTC & Salary Breakdown
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-xl bg-white p-3 border dark:bg-slate-900 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase">Basic Pay</span>
                        <div className="font-bold text-slate-800 dark:text-slate-100">₹{selectedEmployee.salary.basic.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="rounded-xl bg-white p-3 border dark:bg-slate-900 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase">HRA</span>
                        <div className="font-bold text-slate-800 dark:text-slate-100">₹{selectedEmployee.salary.hra.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="rounded-xl bg-white p-3 border dark:bg-slate-900 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase">Special Allowance</span>
                        <div className="font-bold text-slate-800 dark:text-slate-100">₹{selectedEmployee.salary.specialAllowance.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
                        <span className="text-[10px] text-emerald-600 uppercase font-bold">Monthly Net Take-Home</span>
                        <div className="font-extrabold text-emerald-700 dark:text-emerald-300">₹{selectedEmployee.salary.netSalary.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 p-5 space-y-3 bg-amber-50/60 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
                      <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Restricted Compensation Access</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                      Salary structures and monthly compensation of other team members are strictly confidential and only accessible by HR Managers, Finance Administrators, or the individual employee themselves.
                    </p>
                  </div>
                )
              )}

              {activeProfileTab === 'docs' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Uploaded Verification Records
                  </h4>
                  {selectedEmployee.documents.length === 0 ? (
                    <p className="text-xs text-slate-400 p-4 border rounded-xl text-center">No documents uploaded yet.</p>
                  ) : (
                    selectedEmployee.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{doc.uploadDate}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Create New Employee Profile</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newForm.firstName}
                    onChange={(e) => setNewForm({ ...newForm, firstName: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="e.g. Ramesh"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newForm.lastName}
                    onChange={(e) => setNewForm({ ...newForm, lastName: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="e.g. Kumar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={newForm.email}
                    onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="ramesh.kumar@theiakshi.com"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Login Password *</label>
                  <input
                    type="text"
                    required
                    value={newForm.password}
                    onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700 font-mono"
                    placeholder="e.g. password123"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                  <input
                    type="text"
                    value={newForm.phone}
                    onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                    placeholder="+91 98765 00000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Department *</label>
                    {isSuperAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowInlineNewDeptAdd(!showInlineNewDeptAdd)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5 hover:underline"
                          title="Add a new department inline"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add</span>
                        </button>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <button
                          type="button"
                          onClick={() => setIsDeptModalOpen(true)}
                          className="text-[10px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-0.5 hover:underline"
                          title="Manage & edit departments list"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Manage</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {showInlineNewDeptAdd ? (
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        type="text"
                        value={inlineNewDept}
                        onChange={(e) => setInlineNewDept(e.target.value)}
                        placeholder="New Dept Name..."
                        className="w-full rounded-xl border border-blue-400 p-2 text-xs dark:bg-slate-800 dark:border-blue-500 font-semibold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleCreateDepartmentQuick(inlineNewDept, 'ADD')}
                        className="shrink-0 rounded-xl bg-blue-600 px-2.5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowInlineNewDeptAdd(false);
                          setInlineNewDept('');
                        }}
                        className="shrink-0 rounded-xl bg-slate-100 p-2 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={newForm.department}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setShowInlineNewDeptAdd(true);
                        } else {
                          setNewForm({ ...newForm, department: e.target.value as any });
                        }
                      }}
                      className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100"
                    >
                      {departmentsList.map((d) => (
                        <option key={d.id} value={d.label || d.name}>
                          {d.label || d.name}
                        </option>
                      ))}
                      {isSuperAdmin && (
                        <option value="__ADD_NEW__" className="font-bold text-blue-600">
                          ＋ Add Custom Department...
                        </option>
                      )}
                    </select>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Designation</label>
                  <input
                    type="text"
                    value={newForm.designation}
                    onChange={(e) => setNewForm({ ...newForm, designation: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Role & Access</label>
                  <select
                    value={newForm.role}
                    onChange={(e) => setNewForm({ ...newForm, role: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700 font-bold text-blue-600 dark:text-blue-400"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="TEAM_MANAGER">Team Manager</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="RECRUITER">Recruiter</option>
                    <option value="FINANCE">Finance</option>
                    <option value="PAYROLL_TEAM">Payroll Team</option>
                    <option value="SUPER_ADMIN">⚡ Super Admin (Full Control)</option>
                  </select>
                </div>
              </div>

              {/* Reporting Manager, Branch & Avatar Upload */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Office Branch *</label>
                  <select
                    value={newForm.branch || ''}
                    onChange={(e) => {
                      const selectedB = branches.find((b) => b.name === e.target.value);
                      setNewForm({
                        ...newForm,
                        branch: e.target.value,
                        location: selectedB ? `${selectedB.name}, ${selectedB.city}` : newForm.location,
                      });
                    }}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Reports To (Manager)</label>
                  <select
                    value={newForm.managerId || ''}
                    onChange={(e) => setNewForm({ ...newForm, managerId: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="">Executive Leadership / None</option>
                    {employees.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} ({m.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Profile Picture (Optional)</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={newForm.avatar || ''}
                      onChange={(e) => setNewForm({ ...newForm, avatar: e.target.value })}
                      placeholder="Paste Image URL or pick file"
                      className="w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700 text-xs"
                    />
                    <label className="cursor-pointer shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewForm((prev) => ({ ...prev, avatar: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Basic Pay (₹)</label>
                  <input
                    type="number"
                    value={newForm.basicSalary}
                    onChange={(e) => setNewForm({ ...newForm, basicSalary: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">HRA (₹)</label>
                  <input
                    type="number"
                    value={newForm.hra}
                    onChange={(e) => setNewForm({ ...newForm, hra: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Special Allowance (₹)</label>
                  <input
                    type="number"
                    value={newForm.specialAllowance}
                    onChange={(e) => setNewForm({ ...newForm, specialAllowance: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border px-4 py-2 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700"
                >
                  Save Employee Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Employee Modal */}
      {editModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Edit Profile, Role & Reporting Manager
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editModalEmp.firstName} {editModalEmp.lastName} ({editModalEmp.code})
                </p>
              </div>
              <button onClick={() => setEditModalEmp(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Department</label>
                    {isSuperAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowInlineEditDeptAdd(!showInlineEditDeptAdd)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5 hover:underline"
                          title="Add a new department inline"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add</span>
                        </button>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <button
                          type="button"
                          onClick={() => setIsDeptModalOpen(true)}
                          className="text-[10px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-0.5 hover:underline"
                          title="Manage & edit departments list"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Manage</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {showInlineEditDeptAdd ? (
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        type="text"
                        value={inlineEditDept}
                        onChange={(e) => setInlineEditDept(e.target.value)}
                        placeholder="New Dept Name..."
                        className="w-full rounded-xl border border-blue-400 p-2 text-xs dark:bg-slate-800 dark:border-blue-500 font-semibold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleCreateDepartmentQuick(inlineEditDept, 'EDIT')}
                        className="shrink-0 rounded-xl bg-blue-600 px-2.5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowInlineEditDeptAdd(false);
                          setInlineEditDept('');
                        }}
                        className="shrink-0 rounded-xl bg-slate-100 p-2 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={editForm.department}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setShowInlineEditDeptAdd(true);
                        } else {
                          setEditForm({ ...editForm, department: e.target.value as any });
                        }
                      }}
                      className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100"
                    >
                      {departmentsList.map((d) => (
                        <option key={d.id} value={d.label || d.name}>
                          {d.label || d.name}
                        </option>
                      ))}
                      {isSuperAdmin && (
                        <option value="__ADD_NEW__" className="font-bold text-blue-600">
                          ＋ Add Custom Department...
                        </option>
                      )}
                    </select>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Designation</label>
                  <input
                    type="text"
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Role & Access Level</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700 font-bold text-blue-600 dark:text-blue-400"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="TEAM_MANAGER">Team Manager</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="RECRUITER">Recruiter</option>
                    <option value="FINANCE">Finance</option>
                    <option value="PAYROLL_TEAM">Payroll Team</option>
                    <option value="SUPER_ADMIN">⚡ Super Admin (Full Permission)</option>
                  </select>
                </div>
              </div>

              {/* Manager, Branch & Status */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Office Branch *</label>
                  <select
                    value={editForm.branch || ''}
                    onChange={(e) => {
                      const selectedB = branches.find((b) => b.name === e.target.value);
                      setEditForm({
                        ...editForm,
                        branch: e.target.value,
                        location: selectedB ? `${selectedB.name}, ${selectedB.city}` : editForm.location,
                      });
                    }}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Assign Reporting Manager</label>
                  <select
                    value={editForm.managerId || ''}
                    onChange={(e) => setEditForm({ ...editForm, managerId: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="">Executive Leadership / None</option>
                    {employees
                      .filter((m) => m.id !== editModalEmp.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.firstName} {m.lastName} ({m.designation})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Employment Status</label>
                  <select
                    value={editForm.status || 'ACTIVE'}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="PROBATION">Probation</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Avatar upload / edit */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Profile Picture / Avatar</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editForm.avatar || ''}
                    onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                    placeholder="Enter Image URL or upload file"
                    className="w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700 text-xs"
                  />
                  <label className="cursor-pointer shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditForm((prev) => ({ ...prev, avatar: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalEmp(null)}
                  className="rounded-xl border px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-700 shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Employee Confirmation Modal */}
      {deleteModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/80">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Confirm Employee Deletion</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete employee profile for{' '}
              <strong className="text-slate-900 dark:text-slate-100 font-bold">
                {deleteModalEmp.firstName} {deleteModalEmp.lastName} ({deleteModalEmp.code})
              </strong>
              ? This action will erase their record from the database.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalEmp(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteEmployee(deleteModalEmp)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 active:scale-95 transition-all"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Department Management Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Manage Departments (Super Admin)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add, edit, or update active company departments.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeptModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Add New Department Form */}
            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/80">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1.5">
                ＋ Create New Department
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newDeptNameInput}
                  onChange={(e) => setNewDeptNameInput(e.target.value)}
                  placeholder="e.g. Artificial Intelligence, Logistics..."
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-medium dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newDeptNameInput.trim()) {
                      handleCreateDepartmentQuick(newDeptNameInput, 'ADD');
                      setNewDeptNameInput('');
                    } else {
                      showToast('Error', 'Please type a department name', 'ERROR');
                    }
                  }}
                  className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-all"
                >
                  Add Dept
                </button>
              </div>
            </div>

            {/* Departments List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Existing Departments ({departmentsList.length})
              </span>
              {departmentsList.map((dept) => (
                <div
                  key={dept.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-800/80"
                >
                  {editingDeptItem?.id === dept.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editingDeptItem.label}
                        onChange={(e) => setEditingDeptItem({ ...editingDeptItem, label: e.target.value })}
                        className="w-full rounded-lg border border-blue-400 p-1.5 text-xs font-bold dark:bg-slate-900 dark:text-slate-100"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateDepartmentLabel(dept.id, editingDeptItem.label)}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingDeptItem(null)}
                        className="rounded-lg bg-slate-200 px-2 py-1.5 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {dept.label || dept.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingDeptItem({ id: dept.id, label: dept.label || dept.name })}
                          className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                          title="Rename department"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDepartment(dept.id, dept.label || dept.name)}
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete department"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDeptModalOpen(false)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
