import React, { useState, useEffect } from 'react';
import {
  Network,
  Building2,
  Users,
  ChevronDown,
  ChevronRight,
  User,
  Plus,
  Trash2,
  Edit2,
  X,
  UserCheck,
  ShieldAlert,
  ArrowRightLeft,
} from 'lucide-react';
import { Employee } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface DepartmentItem {
  id: string;
  name: string;
  label: string;
  headName: string;
  employeeCount: number;
  budgetMonthly: number;
  openPositions: number;
}

interface OrgNode {
  id: string;
  employee: Employee;
  children: OrgNode[];
}

export const OrgModule: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useNotification();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [editDept, setEditDept] = useState<DepartmentItem | null>(null);
  const [reassignEmp, setReassignEmp] = useState<Employee | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [addMemberToDept, setAddMemberToDept] = useState<DepartmentItem | null>(null);
  const [selectedEmpForDept, setSelectedEmpForDept] = useState('');

  // Form states
  const [deptForm, setDeptForm] = useState({
    name: '',
    label: '',
    headName: '',
    budgetMonthly: 1500000,
    openPositions: 2,
  });

  const [reassignForm, setReassignForm] = useState({
    managerId: '',
    department: '',
  });

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleDeptRoster = (deptId: string) => {
    setExpandedDepts((prev) => ({ ...prev, [deptId]: !prev[deptId] }));
  };

  const handleAssignEmployeeToDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMemberToDept || !selectedEmpForDept) return;

    const emp = employees.find((e) => e.id === selectedEmpForDept);
    if (!emp) return;

    fetch(`/api/v1/employees/${emp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department: addMemberToDept.name }),
    })
      .then((res) => res.json())
      .then((updated) => {
        showToast('Department Assigned', `Assigned ${updated.firstName} ${updated.lastName} to ${addMemberToDept.label}`, 'SUCCESS');
        setAddMemberToDept(null);
        setSelectedEmpForDept('');
        loadData();
      })
      .catch(() => showToast('Error', 'Failed to update employee department', 'ERROR'));
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/v1/employees').then((res) => res.json()),
      fetch('/api/v1/departments').then((res) => res.json()),
    ])
      .then(([empData, deptData]) => {
        if (Array.isArray(empData)) {
          setEmployees(empData);
          // auto expand all nodes
          const initExpanded: Record<string, boolean> = {};
          empData.forEach((e) => (initExpanded[e.id] = true));
          setExpandedNodes(initExpanded);
        }
        if (Array.isArray(deptData)) {
          setDepartments(deptData);
        }
      })
      .catch((e) => console.error('Failed to load org data:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Add Department
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.label) {
      showToast('Validation Error', 'Department name is required', 'ERROR');
      return;
    }

    fetch('/api/v1/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deptForm),
    })
      .then((res) => res.json())
      .then((created) => {
        showToast('Department Created', `Added new department ${created.label}`, 'SUCCESS');
        setIsAddDeptModalOpen(false);
        setDeptForm({ name: '', label: '', headName: '', budgetMonthly: 1500000, openPositions: 2 });
        loadData();
      })
      .catch(() => showToast('Error', 'Failed to create department', 'ERROR'));
  };

  // Handle Edit Department
  const handleUpdateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDept) return;

    fetch(`/api/v1/departments/${editDept.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editDept),
    })
      .then((res) => res.json())
      .then((updated) => {
        showToast('Department Updated', `Updated details for ${updated.label}`, 'SUCCESS');
        setEditDept(null);
        loadData();
      })
      .catch(() => showToast('Error', 'Failed to update department', 'ERROR'));
  };

  // Handle Delete Department
  const handleDeleteDepartment = (deptId: string, label: string) => {
    fetch(`/api/v1/departments/${deptId}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then(() => {
        showToast('Department Deleted', `Removed department ${label}`, 'SUCCESS');
        loadData();
      })
      .catch(() => showToast('Error', 'Failed to delete department', 'ERROR'));
  };

  // Handle Reassign Employee Manager / Department
  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignEmp) return;

    const managerObj = employees.find((m) => m.id === reassignForm.managerId);
    const payload = {
      managerId: reassignForm.managerId || undefined,
      managerName: managerObj ? `${managerObj.firstName} ${managerObj.lastName}` : 'Executive Leadership',
      department: reassignForm.department || reassignEmp.department,
    };

    fetch(`/api/v1/employees/${reassignEmp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((updated) => {
        showToast('Reassignment Complete', `Reassigned ${updated.firstName} ${updated.lastName} in Organization Structure`, 'SUCCESS');
        setReassignEmp(null);
        loadData();
      })
      .catch(() => showToast('Error', 'Failed to reassign employee', 'ERROR'));
  };

  // Build Hierarchy Tree
  const buildTree = (): OrgNode[] => {
    const nodeMap: Record<string, OrgNode> = {};
    employees.forEach((emp) => {
      nodeMap[emp.id] = { id: emp.id, employee: emp, children: [] };
    });

    const roots: OrgNode[] = [];
    employees.forEach((emp) => {
      if (emp.managerId && nodeMap[emp.managerId]) {
        nodeMap[emp.managerId].children.push(nodeMap[emp.id]);
      } else {
        roots.push(nodeMap[emp.id]);
      }
    });

    return roots;
  };

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTreeNode = (node: OrgNode) => {
    const isExpanded = expandedNodes[node.id] !== false;
    const hasChildren = node.children && node.children.length > 0;
    const emp = node.employee;

    return (
      <div key={node.id} className="flex flex-col items-center relative my-2">
        {/* Node Card */}
        <div className="group relative flex flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-md dark:border-slate-800 dark:bg-slate-900 w-64 hover:border-blue-500 transition-all">
          <div className="relative">
            {emp.avatar ? (
              <img
                src={emp.avatar}
                alt={emp.firstName}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-500/30"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm ring-2 ring-blue-500/30">
                {emp.firstName?.[0]}{emp.lastName?.[0]}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white font-bold">
              ✓
            </span>
          </div>

          <h4 className="mt-2 text-xs font-bold text-slate-900 dark:text-slate-100 text-center">
            {emp.firstName} {emp.lastName}
          </h4>
          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 text-center">
            {emp.designation}
          </span>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap justify-center">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {emp.department}
            </span>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {emp.role.replace('_', ' ')}
            </span>
          </div>

          {/* Quick Reassign Action */}
          {hasPermission('employee:write') && (
            <button
              onClick={() => {
                setReassignEmp(emp);
                setReassignForm({ managerId: emp.managerId || '', department: emp.department });
              }}
              className="mt-2.5 flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 transition-colors"
              title="Change Reporting Manager or Department"
            >
              <ArrowRightLeft className="h-3 w-3" />
              <span>Reassign Member</span>
            </button>
          )}

          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="mt-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          )}
        </div>

        {/* Children connector */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col items-center mt-3 w-full">
            <div className="h-4 w-0.5 bg-slate-300 dark:bg-slate-700" />
            <div className="flex flex-wrap justify-center gap-6 pt-2 border-t border-slate-300 dark:border-slate-700">
              {node.children.map((child) => renderTreeNode(child))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const treeRoots = buildTree();

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Organizational Structure & Hierarchy</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage company reporting managers, department allocations, and organizational hierarchy tree.
          </p>
        </div>

        {hasPermission('employee:write') && (
          <button
            onClick={() => setIsAddDeptModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Department</span>
          </button>
        )}
      </div>

      {/* Department Management Panel */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Enterprise Departments ({departments.length})</h3>
          </div>
          <span className="text-[11px] text-slate-500">Super Admin Department Controls</span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const deptEmps = employees.filter(
              (e) =>
                e.department === dept.name ||
                e.department === dept.label ||
                e.department?.toUpperCase() === dept.name
            );
            const isRosterOpen = expandedDepts[dept.id] || false;

            return (
              <div
                key={dept.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 hover:border-blue-400 dark:border-slate-800 dark:bg-slate-800/50 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{dept.label}</span>
                    {hasPermission('employee:write') && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setAddMemberToDept(dept)}
                          className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 transition-colors"
                          title="Add Employee to this Department"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add</span>
                        </button>
                        <button
                          onClick={() => setEditDept(dept)}
                          className="p-1 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700"
                          title="Edit Department"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(dept.id, dept.label)}
                          className="p-1 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700"
                          title="Delete Department"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span>Department Head:</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-bold">{dept.headName}</strong>
                  </div>

                  {/* Member count toggle */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-200/80 pt-2.5 text-xs dark:border-slate-700/80">
                    <button
                      onClick={() => toggleDeptRoster(dept.id)}
                      className="flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>{deptEmps.length} Assigned Employees</span>
                      {isRosterOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      ₹{(dept.budgetMonthly / 100000).toFixed(1)}L / mo
                    </span>
                  </div>

                  {/* Expandable Employee Roster */}
                  {isRosterOpen && (
                    <div className="mt-3 space-y-2 border-t border-slate-200/60 pt-3 dark:border-slate-700/60 max-h-56 overflow-y-auto pr-1">
                      {deptEmps.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No employees assigned to this department yet.</p>
                      ) : (
                        deptEmps.map((emp) => (
                          <div
                            key={emp.id}
                            className="flex items-center justify-between rounded-xl bg-white p-2 border border-slate-200/60 shadow-xs dark:bg-slate-900 dark:border-slate-800"
                          >
                            <div className="flex items-center gap-2">
                              {emp.avatar ? (
                                <img src={emp.avatar} alt={emp.firstName} className="h-7 w-7 rounded-full object-cover" />
                              ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                                </div>
                              )}
                              <div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {emp.firstName} {emp.lastName}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {emp.code} • {emp.designation}
                                </div>
                              </div>
                            </div>

                            {hasPermission('employee:write') && (
                              <button
                                onClick={() => {
                                  setReassignEmp(emp);
                                  setReassignForm({ managerId: emp.managerId || '', department: emp.department });
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600"
                                title="Reassign Department / Manager"
                              >
                                <ArrowRightLeft className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Org Tree View */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-x-auto min-h-[400px]">
        <div className="flex items-center justify-between border-b pb-4 mb-6 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Interactive Reporting Chart</h3>
          </div>
          <p className="text-[11px] text-slate-400">Showing live Reporting Managers & Direct Reports</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading hierarchy tree...</div>
        ) : (
          <div className="flex flex-col items-center">
            {treeRoots.map((root) => renderTreeNode(root))}
          </div>
        )}
      </div>

      {/* Modal: Add Department */}
      {isAddDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Create New Department</h3>
              <button onClick={() => setIsAddDeptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddDepartment} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptForm.label}
                  onChange={(e) =>
                    setDeptForm({
                      ...deptForm,
                      label: e.target.value,
                      name: e.target.value.toUpperCase().replace(/\s+/g, '_'),
                    })
                  }
                  placeholder="e.g. Quality Assurance & Testing"
                  className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Department Head Name</label>
                <input
                  type="text"
                  value={deptForm.headName}
                  onChange={(e) => setDeptForm({ ...deptForm, headName: e.target.value })}
                  placeholder="e.g. Ananya Rao"
                  className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Monthly Budget (₹)</label>
                <input
                  type="number"
                  value={deptForm.budgetMonthly}
                  onChange={(e) => setDeptForm({ ...deptForm, budgetMonthly: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDeptModalOpen(false)}
                  className="rounded-xl border px-4 py-2 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Department */}
      {editDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Edit Department Details</h3>
              <button onClick={() => setEditDept(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateDepartment} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Department Title</label>
                <input
                  type="text"
                  value={editDept?.label || ''}
                  onChange={(e) => editDept && setEditDept({ ...editDept, label: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Head of Department</label>
                <select
                  value={editDept?.headName || ''}
                  onChange={(e) => editDept && setEditDept({ ...editDept, headName: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                >
                  <option value="">-- Select Employee as Head --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={`${emp.firstName} ${emp.lastName}`}>
                      {emp.firstName} {emp.lastName} ({emp.designation} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Monthly Budget (₹)</label>
                <input
                  type="number"
                  value={editDept?.budgetMonthly ?? 0}
                  onChange={(e) => editDept && setEditDept({ ...editDept, budgetMonthly: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditDept(null)}
                  className="rounded-xl border px-4 py-2 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-md"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reassign Member */}
      {reassignEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Reassign Hierarchy & Department</h3>
                <p className="text-[11px] text-slate-500">
                  {reassignEmp.firstName} {reassignEmp.lastName} ({reassignEmp.code})
                </p>
              </div>
              <button onClick={() => setReassignEmp(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Select New Reporting Manager</label>
                <select
                  value={reassignForm.managerId}
                  onChange={(e) => setReassignForm({ ...reassignForm, managerId: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                >
                  <option value="">Executive Leadership / None</option>
                  {employees
                    .filter((m) => m.id !== reassignEmp.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} ({m.designation} - {m.department})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Select Department</label>
                <select
                  value={reassignForm.department}
                  onChange={(e) => setReassignForm({ ...reassignForm, department: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReassignEmp(null)}
                  className="rounded-xl border px-4 py-2 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md"
                >
                  Update Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Employee to Department */}
      {addMemberToDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Assign Employee to {addMemberToDept.label}
                </h3>
                <p className="text-[11px] text-slate-500">Select an employee to assign to this department roster.</p>
              </div>
              <button
                onClick={() => {
                  setAddMemberToDept(null);
                  setSelectedEmpForDept('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAssignEmployeeToDept} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Select Employee</label>
                <select
                  required
                  value={selectedEmpForDept}
                  onChange={(e) => setSelectedEmpForDept(e.target.value)}
                  className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.code}) — Currently: {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAddMemberToDept(null);
                    setSelectedEmpForDept('');
                  }}
                  className="rounded-xl border px-4 py-2 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md"
                >
                  Assign to Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
