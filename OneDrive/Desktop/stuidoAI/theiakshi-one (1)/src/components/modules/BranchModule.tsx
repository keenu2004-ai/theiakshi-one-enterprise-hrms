import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Users,
  TrendingUp,
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Edit2,
  Trash2,
  ShieldCheck,
  Building,
  Briefcase,
  UserCheck,
  X,
  Sparkles,
} from 'lucide-react';
import { Branch, Employee } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { unwrapArray, unwrapData } from '../../lib/apiHelper';

export const BranchModule: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const { showToast } = useNotification();

  const isSuperAdmin = currentRole === 'SUPER_ADMIN' || currentRole === 'HR_MANAGER';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formState, setFormState] = useState<{
    name: string;
    code: string;
    city: string;
    state: string;
    region: 'NORTH_INDIA' | 'SOUTH_INDIA' | 'WEST_INDIA' | 'EAST_INDIA';
    address: string;
    managerName: string;
    floorsCount: number;
  }>({
    name: '',
    code: '',
    city: '',
    state: '',
    region: 'SOUTH_INDIA',
    address: '',
    managerName: '',
    floorsCount: 3,
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/v1/branches').then((res) => res.json()),
      fetch('/api/v1/employees').then((res) => res.json()),
    ])
      .then(([branchData, empData]) => {
        setBranches(unwrapArray<Branch>(branchData));
        setEmployees(unwrapArray<Employee>(empData));
      })
      .catch((err) => console.error('Error loading branches:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingBranch(null);
    setFormState({
      name: '',
      code: '',
      city: '',
      state: '',
      region: 'SOUTH_INDIA',
      address: '',
      managerName: '',
      floorsCount: 3,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b: Branch) => {
    setEditingBranch(b);
    setFormState({
      name: b.name || '',
      code: b.code || '',
      city: b.city || '',
      state: b.state || '',
      region: (b.region as any) || 'SOUTH_INDIA',
      address: b.address || '',
      managerName: b.managerName || '',
      floorsCount: b.floorsCount || 3,
    });
    setIsModalOpen(true);
  };

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.code || !formState.city) {
      showToast('Validation Error', 'Please complete branch name, code, and city.', 'WARNING');
      return;
    }

    const endpoint = editingBranch ? `/api/v1/branches/${editingBranch.id}` : '/api/v1/branches';
    const method = editingBranch ? 'PUT' : 'POST';

    fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formState),
    })
      .then((res) => res.json())
      .then(() => {
        showToast(
          'Branch Saved',
          editingBranch ? `Updated branch ${formState.name}` : `Created new branch ${formState.name}`,
          'SUCCESS'
        );
        setIsModalOpen(false);
        fetchData();
      })
      .catch(() => showToast('Error', 'Failed to save branch', 'ERROR'));
  };

  const handleDeleteBranch = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete branch "${name}"?`)) return;
    fetch(`/api/v1/branches/${id}`, { method: 'DELETE' })
      .then(() => {
        showToast('Branch Deleted', `Removed branch ${name}`, 'INFO');
        fetchData();
      })
      .catch(() => showToast('Error', 'Failed to delete branch', 'ERROR'));
  };

  const handleAssignEmployeeToBranch = (employeeId: string, branchName: string, branchCity: string) => {
    if (!employeeId) return;
    fetch(`/api/v1/employees/${employeeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branch: branchName,
        location: `${branchName}, ${branchCity}`,
      }),
    })
      .then((res) => res.json())
      .then((updated) => {
        showToast('Employee Assigned', `Assigned ${updated.firstName} ${updated.lastName} to ${branchName}`, 'SUCCESS');
        fetchData();
      })
      .catch(() => showToast('Error', 'Failed to assign employee to branch', 'ERROR'));
  };

  const filteredBranches = branches.filter((b) => {
    return (
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const branchEmployees = selectedBranch
    ? employees.filter(
        (e) => e.branch === selectedBranch.name || e.branch === selectedBranch.id || e.location.includes(selectedBranch.city)
      )
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-blue-800">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Multi-Branch & Workspace Architecture
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Branch Management</h2>
          <p className="text-xs text-blue-100/80 mt-1 max-w-2xl">
            Synchronize regional office branches, floor layouts, workspace cubicles, employee headcounts, and location-aware attendance metrics.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/30 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Office Branch
          </button>
        )}
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-1 items-center gap-2 bg-slate-100 dark:bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search branch name, code (e.g., BLR-HQ), or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs w-full outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
          Total Active Branches: <span className="text-blue-600 dark:text-blue-400">{branches.length}</span>
        </div>
      </div>

      {/* Branch Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredBranches.map((branch) => {
            const count = employees.filter(
              (e) => e.branch === branch.name || e.location.includes(branch.city)
            ).length;

            return (
              <div
                key={branch.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                          {branch.name}
                        </h3>
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {branch.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        {branch.address}
                      </p>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(branch)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Branch"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBranch(branch.id, branch.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete Branch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Metrics 4-Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Employees
                    </span>
                    <p className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                      {count || branch.employeeCount}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Attendance
                    </span>
                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {branch.attendancePercentage}%
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Floors
                    </span>
                    <p className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {branch.floorsCount || 3} Floors
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Monthly Payroll
                    </span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                      ₹{((branch.monthlyPayroll || 12000000) / 100000).toFixed(1)}L
                    </p>
                  </div>
                </div>

                {/* Details Footer & View Employee Roster Button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    Manager: <span className="font-bold">{branch.managerName || 'Arjun Sharma'}</span>
                  </div>

                  <button
                    onClick={() => setSelectedBranch(branch)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
                  >
                    View Roster ({count || branch.employeeCount})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Branch Roster Drawer / Modal */}
      {selectedBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    {selectedBranch.name} Roster & Workspace Layout
                  </h3>
                  <p className="text-xs text-slate-500">{selectedBranch.address}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBranch(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-blue-50/80 dark:bg-slate-800/80 rounded-xl border border-blue-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Assign Employee to {selectedBranch.name}:
                </span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAssignEmployeeToBranch(e.target.value, selectedBranch.name, selectedBranch.city);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 outline-none font-medium w-full sm:w-auto"
                >
                  <option value="" disabled>+ Map Employee to this Branch</option>
                  {employees
                    .filter((e) => e.branch !== selectedBranch.name && !e.location.includes(selectedBranch.city))
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.designation} - {e.branch || e.location || 'Unassigned'})
                      </option>
                    ))}
                </select>
              </div>

              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Assigned Employees ({branchEmployees.length})
              </h4>

              {branchEmployees.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No employees directly mapped to this branch yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {branchEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3"
                    >
                      <img
                        src={emp.avatar}
                        alt={emp.firstName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{emp.designation}</p>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                          Desk: {emp.workspace || emp.cubicleDesk || 'Desk 12-A'} • Floor {emp.floor || 2}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {editingBranch ? 'Edit Office Branch' : 'Add New Office Branch'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Noida Enterprise Center"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEL-NOIDA"
                    value={formState.code}
                    onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Floors Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formState.floorsCount}
                    onChange={(e) =>
                      setFormState({ ...formState, floorsCount: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Noida"
                    value={formState.city}
                    onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="Uttar Pradesh"
                    value={formState.state}
                    onChange={(e) => setFormState({ ...formState, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Branch Manager
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vikram Verma"
                  value={formState.managerName}
                  onChange={(e) => setFormState({ ...formState, managerName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Office Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Sector 62, Noida, Uttar Pradesh 201309"
                  value={formState.address}
                  onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
