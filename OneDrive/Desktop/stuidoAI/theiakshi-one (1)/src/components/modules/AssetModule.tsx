import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Plus,
  CheckCircle2,
  UserCheck,
  ShieldCheck,
  Search,
  Trash2,
  Edit2,
  X,
  Laptop,
  Monitor,
  Smartphone,
  Key,
  ArrowRightLeft,
  AlertCircle,
  User,
} from 'lucide-react';
import { Asset, Employee } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const AssetModule: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useNotification();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assignModalAsset, setAssignModalAsset] = useState<Asset | null>(null);

  // Form State for New Asset
  const [newAssetForm, setNewAssetForm] = useState({
    name: '',
    category: 'LAPTOP' as Asset['category'],
    serialNumber: '',
    cost: 85000,
    condition: 'EXCELLENT' as Asset['condition'],
    assignedToId: '',
  });

  // Assign Form
  const [assignEmpSearch, setAssignEmpSearch] = useState('');
  const [selectedEmployeeForAssign, setSelectedEmployeeForAssign] = useState<Employee | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/v1/assets').then((r) => r.json()),
      fetch('/api/v1/employees').then((r) => r.json()),
    ])
      .then(([assetData, empData]) => {
        if (Array.isArray(assetData)) setAssets(assetData);
        if (Array.isArray(empData)) setEmployees(empData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetForm.name || !newAssetForm.serialNumber) {
      showToast('Validation Error', 'Asset Name and Serial Number are required.', 'ERROR');
      return;
    }

    const assignedEmp = employees.find((e) => e.id === newAssetForm.assignedToId);

    const payload = {
      ...newAssetForm,
      assignedToName: assignedEmp ? `${assignedEmp.firstName} ${assignedEmp.lastName}` : undefined,
      assignedDate: assignedEmp ? new Date().toISOString().substring(0, 10) : undefined,
      status: assignedEmp ? 'ASSIGNED' : 'AVAILABLE',
    };

    fetch('/api/v1/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((created) => {
        showToast('Asset Created', `Registered ${created.name} (${created.assetTag}) in system.`, 'SUCCESS');
        setIsAddModalOpen(false);
        setNewAssetForm({ name: '', category: 'LAPTOP', serialNumber: '', cost: 85000, condition: 'EXCELLENT', assignedToId: '' });
        loadData();
      })
      .catch(() => showToast('Error', 'Failed to register asset.', 'ERROR'));
  };

  const handleAssignAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalAsset) return;

    const payload = selectedEmployeeForAssign
      ? {
          assignedToId: selectedEmployeeForAssign.id,
          assignedToName: `${selectedEmployeeForAssign.firstName} ${selectedEmployeeForAssign.lastName}`,
          assignedDate: new Date().toISOString().substring(0, 10),
          status: 'ASSIGNED',
        }
      : {
          assignedToId: undefined,
          assignedToName: undefined,
          assignedDate: undefined,
          status: 'AVAILABLE',
        };

    fetch(`/api/v1/assets/${assignModalAsset.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((updated) => {
        showToast(
          'Assignment Updated',
          selectedEmployeeForAssign
            ? `Assigned ${updated.name} to ${selectedEmployeeForAssign.firstName} ${selectedEmployeeForAssign.lastName}`
            : `Unassigned ${updated.name} (marked as Available)`,
          'SUCCESS'
        );
        setAssignModalAsset(null);
        setSelectedEmployeeForAssign(null);
        setAssignEmpSearch('');
        loadData();
      })
      .catch(() => showToast('Error', 'Failed to assign asset.', 'ERROR'));
  };

  const handleDeleteAsset = (id: string, tag: string) => {
    fetch(`/api/v1/assets/${id}`, { method: 'DELETE' })
      .then((r) => r.json())
      .then(() => {
        showToast('Asset Deleted', `Removed asset tag ${tag} from database.`, 'SUCCESS');
        loadData();
      })
      .catch(() => showToast('Error', 'Failed to delete asset.', 'ERROR'));
  };

  // Filtered Assets
  const filteredAssets = assets.filter((ast) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      ast.name.toLowerCase().includes(q) ||
      ast.assetTag.toLowerCase().includes(q) ||
      ast.serialNumber.toLowerCase().includes(q) ||
      (ast.assignedToName && ast.assignedToName.toLowerCase().includes(q));

    const matchesCategory = selectedCategory === 'ALL' || ast.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || ast.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filter employees for quick lookup during assignment
  const filteredEmployeesForAssign = employees.filter((e) => {
    const q = assignEmpSearch.toLowerCase();
    return (
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.code.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q)
    );
  });

  // Calculate stats
  const totalAssetsCost = assets.reduce((acc, a) => acc + (a.cost || 0), 0);
  const assignedCount = assets.filter((a) => a.status === 'ASSIGNED').length;
  const availableCount = assets.filter((a) => a.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Title & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Hardware & Asset Manager</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track laptops, workstations, monitors, accessories, and manage employee device allocations.
          </p>
        </div>

        {hasPermission('asset:write') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Register New Asset</span>
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Asset Portfolio Value</span>
            <HardDrive className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            ₹{totalAssetsCost.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{assets.length} Hardware Devices Registered</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Assigned Devices</span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{assignedCount} Assigned</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {((assignedCount / (assets.length || 1)) * 100).toFixed(1)}% Active Deployment
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Available in Inventory</span>
            <CheckCircle2 className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{availableCount} Available</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">Ready for Immediate Allocation</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type employee name, tag, or device..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex w-full sm:w-auto items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Categories</option>
            <option value="LAPTOP">Laptops & Workstations</option>
            <option value="MONITOR">Monitors & Displays</option>
            <option value="MOBILE">Mobile & Tablets</option>
            <option value="ACCESSORY">Peripherals & Accessories</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="AVAILABLE">Available</option>
            <option value="MAINTENANCE">Under Maintenance</option>
          </select>
        </div>
      </div>

      {/* Asset Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800">
              <tr>
                <th className="p-3.5">Asset Tag</th>
                <th className="p-3.5">Device Name & Serial</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Assigned Employee</th>
                <th className="p-3.5">Cost</th>
                <th className="p-3.5">Condition</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-slate-400">
                    No hardware assets found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((ast) => (
                  <tr key={ast.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">{ast.assetTag}</td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{ast.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">S/N: {ast.serialNumber}</div>
                    </td>

                    <td className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">{ast.category}</td>

                    <td className="p-3.5">
                      {ast.assignedToName ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] dark:bg-blue-950 dark:text-blue-300">
                            {ast.assignedToName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{ast.assignedToName}</div>
                            <div className="text-[10px] text-slate-400">Since {ast.assignedDate || 'Recent'}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="italic text-slate-400 text-[11px]">Unassigned / In Inventory</span>
                      )}
                    </td>

                    <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      ₹{ast.cost?.toLocaleString('en-IN') || '0'}
                    </td>

                    <td className="p-3.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {ast.condition}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          ast.status === 'ASSIGNED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : ast.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {ast.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasPermission('asset:write') && (
                          <button
                            onClick={() => {
                              setAssignModalAsset(ast);
                              setAssignEmpSearch('');
                              const curr = employees.find((e) => e.id === ast.assignedToId);
                              setSelectedEmployeeForAssign(curr || null);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/80 dark:text-blue-400 transition-colors"
                            title="Assign to Employee by Name"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                            <span>{ast.assignedToName ? 'Change / Return' : 'Assign'}</span>
                          </button>
                        )}

                        {hasPermission('system:delete') && (
                          <button
                            onClick={() => handleDeleteAsset(ast.id, ast.assetTag)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg dark:hover:bg-rose-950"
                            title="Delete Asset Tag"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register New Asset */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Register New Hardware Asset</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Device Model / Name *</label>
                <input
                  type="text"
                  required
                  value={newAssetForm.name}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, name: e.target.value })}
                  placeholder="e.g. Apple MacBook Pro M3 Max 16-inch"
                  className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={newAssetForm.category}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, category: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="LAPTOP">Laptop / Workstation</option>
                    <option value="MONITOR">Monitor / Display</option>
                    <option value="MOBILE">Mobile Phone / Tablet</option>
                    <option value="ACCESSORY">Accessory / Key</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Serial Number (S/N) *</label>
                  <input
                    type="text"
                    required
                    value={newAssetForm.serialNumber}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, serialNumber: e.target.value })}
                    placeholder="e.g. C02G10029X10"
                    className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Asset Cost (₹)</label>
                  <input
                    type="number"
                    value={newAssetForm.cost}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, cost: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Initial Condition</label>
                  <select
                    value={newAssetForm.condition}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, condition: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="EXCELLENT">Excellent / Brand New</option>
                    <option value="GOOD">Good Condition</option>
                    <option value="FAIR">Fair / Minor Wear</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Assign To Employee (Optional)</label>
                <select
                  value={newAssetForm.assignedToId}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, assignedToId: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                >
                  <option value="">Keep in Inventory (Available)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.code} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border px-4 py-2 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Asset by Name Search */}
      {assignModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Assign Asset to Employee</h3>
                <p className="text-[11px] text-blue-600 font-mono">
                  {assignModalAsset.name} ({assignModalAsset.assetTag})
                </p>
              </div>
              <button onClick={() => setAssignModalAsset(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAssignAssetSubmit} className="mt-4 space-y-4 text-xs">
              {/* Type or Search Employee Name */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Search & Type Employee Name
                </label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={assignEmpSearch}
                    onChange={(e) => setAssignEmpSearch(e.target.value)}
                    placeholder="Type name, email, or employee code..."
                    className="w-full rounded-xl border p-2.5 pl-9 text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>

                {/* Search Suggestion List */}
                {assignEmpSearch && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-800 space-y-1">
                    {filteredEmployeesForAssign.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          setSelectedEmployeeForAssign(emp);
                          setAssignEmpSearch('');
                        }}
                        className="flex w-full items-center justify-between rounded-lg p-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400">{emp.designation} • {emp.department}</div>
                        </div>
                        <span className="font-mono text-[10px] text-blue-600 font-bold">{emp.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Employee Display */}
              {selectedEmployeeForAssign ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 dark:border-blue-900 dark:bg-blue-950/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                        {selectedEmployeeForAssign.firstName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {selectedEmployeeForAssign.firstName} {selectedEmployeeForAssign.lastName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {selectedEmployeeForAssign.designation} • {selectedEmployeeForAssign.department}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEmployeeForAssign(null)}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Show assets already assigned to this employee! */}
                  <div className="mt-3 border-t border-blue-200 pt-2 dark:border-blue-900">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Already Assigned Devices:
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {assets
                        .filter((a) => a.assignedToId === selectedEmployeeForAssign.id)
                        .map((a) => (
                          <span
                            key={a.id}
                            className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-xs dark:bg-slate-800 dark:text-slate-200"
                          >
                            💻 {a.name} ({a.assetTag})
                          </span>
                        ))}
                      {assets.filter((a) => a.assignedToId === selectedEmployeeForAssign.id).length === 0 && (
                        <span className="text-[10px] text-slate-400 italic">No previous assets assigned.</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                  ⚠️ No employee currently selected. Submitting will mark this device as <strong>Available in Inventory</strong>.
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssignModalAsset(null)}
                  className="rounded-xl border px-4 py-2 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md"
                >
                  {selectedEmployeeForAssign ? 'Confirm Device Assignment' : 'Save as Unassigned'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
