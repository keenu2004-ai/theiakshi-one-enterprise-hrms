import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Building2,
  Check,
  X,
  Save,
  MapPin,
  Navigation,
  Compass,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  Clock,
  Calendar,
  DollarSign,
  Globe,
  Sliders,
  Key,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Lock,
  ShieldCheck,
  Copy,
  Search,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

interface Workspace {
  id: string;
  name: string;
  code: string;
  address: string;
  timezone: string;
  employeeCount: number;
  isPrimary: boolean;
}

interface SystemConfig {
  companyName: string;
  currency: string;
  probationDays: number;
  workHoursPerDay: number;
  paidLeaveQuota: number;
  casualLeaveQuota: number;
  sickLeaveQuota: number;
  payrollCycleDay: number;
  allowSelfCheckIn: boolean;
  autoApproveExpenseUnder: number;
}

interface CredentialRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  email: string;
  password: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const SettingsModule: React.FC = () => {
  const { showToast } = useNotification();
  const { currentUser, currentRole, hasPermission } = useAuth();

  // Super Admin Credentials Vault State
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  const [credSearch, setCredSearch] = useState('');
  const [visiblePassMap, setVisiblePassMap] = useState<Record<string, boolean>>({});
  const [resetModalCred, setResetModalCred] = useState<CredentialRecord | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Multi-branch workspaces
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isAddWorkspaceOpen, setIsAddWorkspaceOpen] = useState(false);
  const [workspaceForm, setWorkspaceForm] = useState({
    name: '',
    code: '',
    address: '',
    timezone: 'Asia/Kolkata',
  });

  // System Configuration
  const [sysConfig, setSysConfig] = useState<SystemConfig>({
    companyName: 'THEIAKSHI ENTERPRISES',
    currency: 'INR (₹)',
    probationDays: 90,
    workHoursPerDay: 8,
    paidLeaveQuota: 18,
    casualLeaveQuota: 12,
    sickLeaveQuota: 10,
    payrollCycleDay: 28,
    allowSelfCheckIn: true,
    autoApproveExpenseUnder: 5000,
  });

  // Geofence Settings State
  const [geofence, setGeofence] = useState({
    officeName: 'Headquarters Bengaluru',
    latitude: 12.9716,
    longitude: 77.5946,
    radiusMeters: 500,
    enforceStrictGeofence: true,
  });

  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // RBAC permissions matrix state
  const [permissionsMatrix, setPermissionsMatrix] = useState([
    { feature: 'View Employees Directory', superAdmin: true, hrManager: true, teamManager: true, employee: true, recruiter: true, finance: true },
    { feature: 'Create / Edit / Delete Employee Profiles', superAdmin: true, hrManager: true, teamManager: false, employee: false, recruiter: false, finance: false },
    { feature: 'Assign Roles & Promote Super Admins', superAdmin: true, hrManager: false, teamManager: false, employee: false, recruiter: false, finance: false },
    { feature: 'Approve Leave & Attendance Requests', superAdmin: true, hrManager: true, teamManager: true, employee: false, recruiter: false, finance: false },
    { feature: 'Manage Assets & Assign Hardware', superAdmin: true, hrManager: true, teamManager: true, employee: false, recruiter: false, finance: false },
    { feature: 'Disburse Payroll & Financial Audits', superAdmin: true, hrManager: false, teamManager: false, employee: false, recruiter: false, finance: true },
    { feature: 'Manage Multi-Branch Workspaces & Geofence', superAdmin: true, hrManager: false, teamManager: false, employee: false, recruiter: false, finance: false },
    { feature: 'View System Audit Logs & Debug traces', superAdmin: true, hrManager: true, teamManager: false, employee: false, recruiter: false, finance: true },
  ]);

  const loadSettingsData = () => {
    Promise.all([
      fetch('/api/v1/settings/geofence').then((r) => r.json()),
      fetch('/api/v1/settings/workspaces').then((r) => r.json()),
      fetch('/api/v1/settings/system-config').then((r) => r.json()),
      fetch('/api/v1/admin/credentials').then((r) => r.json()),
    ])
      .then(([geoData, wsData, cfgData, credData]) => {
        if (geoData && geoData.officeName) setGeofence(geoData);
        if (Array.isArray(wsData)) setWorkspaces(wsData);
        if (cfgData && cfgData.companyName) setSysConfig(cfgData);
        if (credData && Array.isArray(credData.credentials)) {
          setCredentials(credData.credentials);
        }
      })
      .catch((err) => console.error('Failed loading system settings:', err));
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const togglePassVisibility = (id: string) => {
    setVisiblePassMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyPass = (password: string, email: string) => {
    navigator.clipboard.writeText(password);
    showToast('Copied to Clipboard', `Password for ${email} copied.`, 'INFO');
  };

  const handleDownloadCredentialsFile = () => {
    window.open('/api/v1/admin/credentials/download', '_blank');
    showToast('Downloading credentials.json', 'Exporting live system credentials file...', 'SUCCESS');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalCred || !newPasswordInput) return;

    fetch(`/api/v1/admin/credentials/${resetModalCred.id}/reset-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: newPasswordInput }),
    })
      .then((r) => r.json())
      .then(() => {
        showToast('Password Reset', `Updated password for ${resetModalCred.email} in credentials.json`, 'SUCCESS');
        setResetModalCred(null);
        setNewPasswordInput('');
        loadSettingsData();
      })
      .catch(() => showToast('Error', 'Failed to reset password.', 'ERROR'));
  };

  const togglePermission = (index: number, roleKey: string) => {
    setPermissionsMatrix((prev) => {
      const next = [...prev];
      (next[index] as any)[roleKey] = !(next[index] as any)[roleKey];
      return next;
    });
  };

  const handleCaptureCurrentGps = () => {
    if (!navigator.geolocation) {
      showToast('Error', 'Geolocation is not supported by your browser.', 'ERROR');
      return;
    }

    setIsDetectingGps(true);
    showToast('Detecting Device GPS...', 'Accessing high-accuracy device location coordinates.', 'INFO');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setGeofence((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        showToast('GPS Captured!', `Set Target Office GPS to (${lat}°, ${lng}°). Click Save Changes to commit.`, 'SUCCESS');
      },
      (err) => {
        setIsDetectingGps(false);
        showToast('GPS Error', 'Failed to retrieve device location. Please allow location access.', 'ERROR');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAddWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceForm.name || !workspaceForm.code) {
      showToast('Validation Error', 'Workspace Name and Code are required.', 'ERROR');
      return;
    }

    fetch('/api/v1/settings/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workspaceForm),
    })
      .then((r) => r.json())
      .then((created) => {
        showToast('Branch Added', `Created multi-branch workspace ${created.name}`, 'SUCCESS');
        setIsAddWorkspaceOpen(false);
        setWorkspaceForm({ name: '', code: '', address: '', timezone: 'Asia/Kolkata' });
        loadSettingsData();
      })
      .catch(() => showToast('Error', 'Failed to add workspace.', 'ERROR'));
  };

  const handleDeleteWorkspace = (id: string, name: string) => {
    fetch(`/api/v1/settings/workspaces/${id}`, { method: 'DELETE' })
      .then((r) => r.json())
      .then(() => {
        showToast('Workspace Removed', `Deleted workspace branch ${name}`, 'SUCCESS');
        loadSettingsData();
      })
      .catch(() => showToast('Error', 'Failed to delete workspace.', 'ERROR'));
  };

  const handleSaveAllSettings = () => {
    Promise.all([
      fetch('/api/v1/settings/geofence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geofence),
      }),
      fetch('/api/v1/settings/system-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sysConfig),
      }),
    ])
      .then(() => {
        showToast(
          'Settings Saved',
          'Super Admin Geofence coordinates, Multi-Branch Workspaces, & System Parameters updated!',
          'SUCCESS'
        );
      })
      .catch(() => {
        showToast('Save Error', 'Failed to update settings on server.', 'ERROR');
      });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Super Admin Control Center & Enterprise Parameters
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure multi-branch workspace locations, geofence coordinates, leave quotas, working hours, and Role-Based Access Control (RBAC).
          </p>
        </div>

        <button
          onClick={handleSaveAllSettings}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all shrink-0"
        >
          <Save className="h-4 w-4" />
          <span>Save All Settings</span>
        </button>
      </div>

      {/* Super Admin Credentials Vault Section */}
      {(currentUser.role === 'SUPER_ADMIN' || currentRole === 'SUPER_ADMIN') && (
        <div className="rounded-3xl border border-amber-500/30 bg-slate-900 p-6 text-white shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Key className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">
                    Super Admin Credentials Vault (`credentials.json`)
                  </h3>
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                    Restricted Access
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  All user login & password details are synchronized and saved in <code className="text-amber-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded">src/data/credentials.json</code>. Adding or deleting employees automatically updates this file.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={loadSettingsData}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
                title="Reload credentials file"
              >
                <RefreshCw className="h-3.5 w-3.5 text-blue-400" />
                <span>Sync Vault</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCredentialsFile}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Export credentials.json</span>
              </button>
            </div>
          </div>

          {/* Credentials Search & Filter */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={credSearch}
                onChange={(e) => setCredSearch(e.target.value)}
                placeholder="Search by name, email, code, or role..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="text-xs text-slate-400">
              Total Managed Accounts: <strong className="text-amber-400 font-bold">{credentials.length}</strong>
            </div>
          </div>

          {/* Credentials Directory Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950 text-[11px] font-bold uppercase text-slate-400">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Company Email</th>
                  <th className="p-3">Login Password</th>
                  <th className="p-3">Access Role</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Vault Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {credentials
                  .filter((c) => {
                    if (!credSearch) return true;
                    const q = credSearch.toLowerCase();
                    return (
                      c.employeeName.toLowerCase().includes(q) ||
                      c.email.toLowerCase().includes(q) ||
                      c.employeeCode.toLowerCase().includes(q) ||
                      c.role.toLowerCase().includes(q)
                    );
                  })
                  .map((cred) => {
                    const isVisible = visiblePassMap[cred.id];
                    return (
                      <tr key={cred.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-white">{cred.employeeName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{cred.employeeCode}</div>
                        </td>
                        <td className="p-3 font-mono text-xs text-slate-300">{cred.email}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-amber-300 bg-slate-900 px-2 py-1 rounded border border-slate-800 min-w-[100px]">
                              {isVisible ? cred.password : '••••••••••••'}
                            </span>
                            <button
                              onClick={() => togglePassVisibility(cred.id)}
                              className="text-slate-400 hover:text-white p-1"
                              title={isVisible ? 'Hide Password' : 'Show Password'}
                            >
                              {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => handleCopyPass(cred.password, cred.email)}
                              className="text-slate-400 hover:text-amber-400 p-1"
                              title="Copy Password"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                            {cred.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            cred.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {cred.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setResetModalCred(cred);
                              setNewPasswordInput(cred.password);
                            }}
                            className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-slate-700 transition-colors"
                          >
                            Reset Password
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Geofence Target Office Card */}
      <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-white via-blue-50/20 to-slate-50 p-6 shadow-sm dark:border-blue-900/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-blue-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Super Admin Office Geofence Target
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All employee clock-ins will be verified against these GPS coordinates.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCaptureCurrentGps}
            disabled={isDetectingGps}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all shrink-0"
          >
            <Navigation className="h-3.5 w-3.5 text-blue-400" />
            <span>{isDetectingGps ? 'Locating...' : 'Set Current Device GPS as Target'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Office / Branch Name *
            </label>
            <input
              type="text"
              value={geofence.officeName}
              onChange={(e) => setGeofence({ ...geofence, officeName: e.target.value })}
              placeholder="e.g. Headquarters Bengaluru"
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 dark:bg-slate-800 dark:border-slate-700 font-semibold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Latitude (Decimal) *
            </label>
            <input
              type="number"
              step="any"
              value={geofence.latitude}
              onChange={(e) => setGeofence({ ...geofence, latitude: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 dark:bg-slate-800 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Longitude (Decimal) *
            </label>
            <input
              type="number"
              step="any"
              value={geofence.longitude}
              onChange={(e) => setGeofence({ ...geofence, longitude: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 dark:bg-slate-800 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Geofence Radius (Meters) *
            </label>
            <input
              type="number"
              value={geofence.radiusMeters}
              onChange={(e) => setGeofence({ ...geofence, radiusMeters: parseInt(e.target.value, 10) || 100 })}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 dark:bg-slate-800 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-blue-500" />
            <span>
              Active Target:{' '}
              <strong className="text-slate-900 dark:text-slate-100 font-bold">
                {geofence.officeName} ({geofence.latitude}°, {geofence.longitude}°) within {geofence.radiusMeters}m
              </strong>
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              checked={geofence.enforceStrictGeofence}
              onChange={(e) => setGeofence({ ...geofence, enforceStrictGeofence: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
            />
            <span>Strict Geofence Enforcement Enabled</span>
          </label>
        </div>
      </div>

      {/* Multi-Branch Workspace Settings */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Multi-Branch Workspace Management ({workspaces.length})
            </h3>
          </div>

          <button
            onClick={() => setIsAddWorkspaceOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Branch Office</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{ws.name}</span>
                  {ws.isPrimary ? (
                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      Primary HQ
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                      className="text-slate-400 hover:text-rose-600"
                      title="Remove Workspace"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 font-mono">Code: {ws.code}</div>
                <div className="mt-1 text-[11px] text-slate-500 line-clamp-1">{ws.address}</div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[10px] text-slate-400 dark:border-slate-700">
                <span>Timezone: {ws.timezone}</span>
                <span className="font-bold text-blue-600">{ws.employeeCount} Employees</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical System Configuration Panel */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 dark:border-slate-800">
          <Sliders className="h-5 w-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Critical HRMS Operational Policies & System Defaults
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Company Legal Entity Name</label>
            <input
              type="text"
              value={sysConfig.companyName}
              onChange={(e) => setSysConfig({ ...sysConfig, companyName: e.target.value })}
              className="mt-1 w-full rounded-xl border p-2.5 font-bold dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Default Currency</label>
            <input
              type="text"
              value={sysConfig.currency}
              onChange={(e) => setSysConfig({ ...sysConfig, currency: e.target.value })}
              className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Probation Period (Days)</label>
            <input
              type="number"
              value={sysConfig.probationDays}
              onChange={(e) => setSysConfig({ ...sysConfig, probationDays: Number(e.target.value) })}
              className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Standard Work Shift (Hours/Day)</label>
            <input
              type="number"
              value={sysConfig.workHoursPerDay}
              onChange={(e) => setSysConfig({ ...sysConfig, workHoursPerDay: Number(e.target.value) })}
              className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Monthly Payroll Cycle Day</label>
            <input
              type="number"
              value={sysConfig.payrollCycleDay}
              onChange={(e) => setSysConfig({ ...sysConfig, payrollCycleDay: Number(e.target.value) })}
              placeholder="e.g. 28th of every month"
              className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Paid Leave Quota (Days/Year)</label>
            <input
              type="number"
              value={sysConfig.paidLeaveQuota}
              onChange={(e) => setSysConfig({ ...sysConfig, paidLeaveQuota: Number(e.target.value) })}
              className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Role Permission Matrix Grid */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Role-Based Privilege Matrix (RBAC)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800">
              <tr>
                <th className="p-3.5">Feature Privilege</th>
                <th className="p-3.5 text-center">Super Admin</th>
                <th className="p-3.5 text-center">HR Manager</th>
                <th className="p-3.5 text-center">Team Manager</th>
                <th className="p-3.5 text-center">Employee</th>
                <th className="p-3.5 text-center">Recruiter</th>
                <th className="p-3.5 text-center">Finance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {permissionsMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{row.feature}</td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => togglePermission(idx, 'superAdmin')}
                      className={`p-1.5 rounded-lg ${row.superAdmin ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {row.superAdmin ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => togglePermission(idx, 'hrManager')}
                      className={`p-1.5 rounded-lg ${row.hrManager ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {row.hrManager ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => togglePermission(idx, 'teamManager')}
                      className={`p-1.5 rounded-lg ${row.teamManager ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {row.teamManager ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => togglePermission(idx, 'employee')}
                      className={`p-1.5 rounded-lg ${row.employee ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {row.employee ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => togglePermission(idx, 'recruiter')}
                      className={`p-1.5 rounded-lg ${row.recruiter ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {row.recruiter ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => togglePermission(idx, 'finance')}
                      className={`p-1.5 rounded-lg ${row.finance ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {row.finance ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Workspace */}
      {isAddWorkspaceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Multi-Branch Workspace</h3>
              <button onClick={() => setIsAddWorkspaceOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddWorkspace} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Branch Name *</label>
                <input
                  type="text"
                  required
                  value={workspaceForm.name}
                  onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
                  placeholder="e.g. Pune Innovation Center"
                  className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Branch Code *</label>
                <input
                  type="text"
                  required
                  value={workspaceForm.code}
                  onChange={(e) => setWorkspaceForm({ ...workspaceForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. PUN-01"
                  className="mt-1 w-full rounded-xl border p-2.5 text-xs font-mono dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Address Location</label>
                <input
                  type="text"
                  value={workspaceForm.address}
                  onChange={(e) => setWorkspaceForm({ ...workspaceForm, address: e.target.value })}
                  placeholder="e.g. Hinjawadi IT Park, Pune, Maharashtra"
                  className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddWorkspaceOpen(false)}
                  className="rounded-xl border px-4 py-2 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md"
                >
                  Add Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetModalCred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 p-6 text-white shadow-2xl border border-amber-500/30">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Reset Credentials File Password</h3>
              </div>
              <button onClick={() => setResetModalCred(null)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4 text-xs">
              <div>
                <span className="text-slate-400">Target Employee:</span>
                <div className="font-bold text-white text-sm">{resetModalCred.employeeName}</div>
                <div className="text-slate-400 font-mono text-[11px]">{resetModalCred.email}</div>
              </div>

              <div>
                <label className="font-semibold text-slate-300">New Password *</label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new account password..."
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-amber-400/80 mt-1">
                  Submitting will update <code className="font-mono">credentials.json</code> directly.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetModalCred(null)}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 hover:bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md"
                >
                  Save to File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
