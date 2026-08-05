import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Clock,
  CheckCircle2,
  User,
  Building2,
  Plus,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Send,
  BellRing,
  Sparkles,
  Search,
  DollarSign,
  Calendar,
  X,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { Project, ProjectUpgradation, DepartmentType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { ExcelWeekPlanImportModal } from './ExcelWeekPlanImportModal';
import { unwrapArray, unwrapData } from '../../lib/apiHelper';

export const ProjectsModule: React.FC = () => {
  const { currentUser, currentRole, hasRole } = useAuth();
  const { showToast } = useNotification();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');

  // Modals
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isAddUpgradationModalOpen, setIsAddUpgradationModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  // New Project Form State
  const [newPrjForm, setNewPrjForm] = useState({
    name: '',
    client: '',
    department: 'ENGINEERING' as DepartmentType,
    budget: 5000000,
    deadline: '2026-12-31',
    description: '',
    managerName: 'Vikram Verma',
  });

  // Upgradation Form State
  const [upgForm, setUpgForm] = useState({
    title: '',
    description: '',
    progress: 50,
    status: 'IN_PROGRESS' as 'IN_PROGRESS' | 'COMPLETED',
  });

  const loadProjects = () => {
    fetch('/api/v1/projects')
      .then((r) => r.json())
      .then((data) => {
        const list = unwrapArray<Project>(data);
        setProjects(list);
        if (selectedProject) {
          const updated = list.find((p) => p.id === selectedProject.id);
          if (updated) setSelectedProject(updated);
        } else if (list.length > 0) {
          setSelectedProject(list[0]);
        }
      })
      .catch((err) => console.error('Error fetching projects:', err));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrjForm.name.trim()) {
      showToast('Validation Error', 'Project name is required.', 'ERROR');
      return;
    }

    fetch('/api/v1/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPrjForm),
    })
      .then((r) => r.json())
      .then((raw) => {
        const created = unwrapData<Project>(raw);
        showToast('Project Created', `Project "${created.name || 'New Project'}" created successfully.`, 'SUCCESS');
        setIsAddProjectModalOpen(false);
        setNewPrjForm({
          name: '',
          client: '',
          department: 'ENGINEERING',
          budget: 5000000,
          deadline: '2026-12-31',
          description: '',
          managerName: 'Vikram Verma',
        });
        loadProjects();
      })
      .catch((err) => {
        showToast('Error', 'Failed to create project', 'ERROR');
      });
  };

  const handleAddUpgradation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    if (!upgForm.title.trim()) {
      showToast('Validation Error', 'Upgradation task title is required.', 'ERROR');
      return;
    }

    const payload = {
      title: upgForm.title,
      description: upgForm.description,
      progress: Number(upgForm.progress),
      status: Number(upgForm.progress) === 100 ? 'COMPLETED' : upgForm.status,
      loggedBy: `${currentUser.firstName} ${currentUser.lastName}`,
      loggedByRole: currentRole,
      employeeId: currentUser.id,
    };

    fetch(`/api/v1/projects/${selectedProject.id}/upgradations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((res) => {
        if (payload.progress === 100 || payload.status === 'COMPLETED') {
          showToast(
            'Task Completed & Notification Sent',
            `Upgradation marked 100% COMPLETED. Automated alert dispatched to Department Head (${selectedProject.managerName || 'Head'}) and Super Admin!`,
            'SUCCESS'
          );
        } else {
          showToast('Upgradation Logged', `Project progress updated to ${payload.progress}%.`, 'SUCCESS');
        }

        setIsAddUpgradationModalOpen(false);
        setUpgForm({
          title: '',
          description: '',
          progress: 50,
          status: 'IN_PROGRESS',
        });
        loadProjects();
      })
      .catch((err) => {
        showToast('Error', 'Failed to log upgradation update', 'ERROR');
      });
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDepartment === 'ALL' || p.department === filterDepartment;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Module Title Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Project Management & Upgradation Tracker
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Client project portfolio, task upgradation logging, percentage progress tracking, and automated completion alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsExcelImportModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-all"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel Week Plan Import</span>
          </button>

          {(hasRole(['SUPER_ADMIN', 'HR_MANAGER', 'TEAM_MANAGER']) || currentRole === 'SUPER_ADMIN') && (
            <button
              onClick={() => setIsAddProjectModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, client, code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500">Dept:</span>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            <option value="ENGINEERING">Engineering</option>
            <option value="HUMAN_RESOURCES">Human Resources</option>
            <option value="FINANCE">Finance</option>
            <option value="MARKETING">Marketing</option>
            <option value="OPERATIONS">Operations</option>
          </select>
        </div>
      </div>

      {/* Grid: Projects List (Left) & Upgradation Details Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Project Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
            <span>PROJECT PORTFOLIO ({filteredProjects.length})</span>
            <span>Click to view upgradations</span>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 dark:border-slate-700">
              No projects found matching criteria.
            </div>
          ) : (
            filteredProjects.map((prj) => {
              const isSelected = selectedProject?.id === prj.id;
              return (
                <div
                  key={prj.id}
                  onClick={() => setSelectedProject(prj)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all shadow-sm ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/20 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {prj.code}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        prj.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : prj.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {prj.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="mt-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                    {prj.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Client: <span className="font-medium text-slate-700 dark:text-slate-300">{prj.client}</span>
                  </p>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-500">Overall Progress</span>
                      <span className="text-blue-600 font-bold">{prj.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          prj.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${prj.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Deadline: {prj.deadline}</span>
                    <span className="font-medium">Budget: ₹{(prj.budget / 100000).toFixed(1)} Lakhs</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Upgradation Details & Progress Log */}
        <div className="lg:col-span-7">
          {selectedProject ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600">{selectedProject.code}</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {selectedProject.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedProject.description || 'Enterprise project workspace for tracking development upgrades.'}
                  </p>
                </div>

                <button
                  onClick={() => setIsAddUpgradationModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Log Upgradation Update</span>
                </button>
              </div>

              {/* Status Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Completion</div>
                  <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                    {selectedProject.progress}%
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Department Head</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {selectedProject.managerName || 'Engineering Head'}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Deadline</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedProject.deadline}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Budget</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    ₹{selectedProject.budget.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Upgradation Notification Banner Info */}
              <div className="flex items-start gap-2.5 rounded-xl bg-blue-50/70 p-3.5 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
                <BellRing className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Automated Head & Super Admin Notification Engine:</span>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                    Whenever an upgradation or project reaches 100% completion, an instant notification is dispatched automatically to <strong>{selectedProject.managerName || 'Department Manager'}</strong> and the <strong>Super Admin</strong>.
                  </p>
                </div>
              </div>

              {/* Upgradations History Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center justify-between">
                  <span>TASK UPGRADATION & MILESTONE TIMELINE</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {selectedProject.upgradations?.length || 0} updates logged
                  </span>
                </h4>

                {(!selectedProject.upgradations || selectedProject.upgradations.length === 0) ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-slate-800">
                    No upgradation details logged yet for this project. Click "Log Upgradation Update" to add progress details.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                    {selectedProject.upgradations.map((upg) => (
                      <div
                        key={upg.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {upg.status === 'COMPLETED' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-blue-500" />
                            )}
                            {upg.title}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                              upg.progress === 100
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {upg.progress}% Done
                          </span>
                        </div>

                        {upg.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {upg.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span>Logged by: <strong className="text-slate-700 dark:text-slate-300">{upg.loggedBy}</strong> ({upg.loggedByRole})</span>
                          <span>{upg.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500 dark:border-slate-700">
              Select a project from the left menu to view upgradation details.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add New Project */}
      {isAddProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Add New Enterprise Project
              </h3>
              <button
                onClick={() => setIsAddProjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={newPrjForm.name}
                  onChange={(e) => setNewPrjForm({ ...newPrjForm, name: e.target.value })}
                  placeholder="e.g. NextGen Microservices Refactor"
                  className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={newPrjForm.client}
                    onChange={(e) => setNewPrjForm({ ...newPrjForm, client: e.target.value })}
                    placeholder="e.g. Internal Infrastructure"
                    className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={newPrjForm.department}
                    onChange={(e) => setNewPrjForm({ ...newPrjForm, department: e.target.value as DepartmentType })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="ENGINEERING">Engineering</option>
                    <option value="HUMAN_RESOURCES">Human Resources</option>
                    <option value="FINANCE">Finance</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="OPERATIONS">Operations</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={newPrjForm.budget}
                    onChange={(e) => setNewPrjForm({ ...newPrjForm, budget: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deadline Date
                  </label>
                  <input
                    type="date"
                    value={newPrjForm.deadline}
                    onChange={(e) => setNewPrjForm({ ...newPrjForm, deadline: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department Head / Manager Name
                </label>
                <input
                  type="text"
                  value={newPrjForm.managerName}
                  onChange={(e) => setNewPrjForm({ ...newPrjForm, managerName: e.target.value })}
                  placeholder="e.g. Vikram Verma"
                  className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Description
                </label>
                <textarea
                  rows={2}
                  value={newPrjForm.description}
                  onChange={(e) => setNewPrjForm({ ...newPrjForm, description: e.target.value })}
                  placeholder="Scope of work and deliverables..."
                  className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddProjectModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold hover:bg-slate-100 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Upgradation Update */}
      {isAddUpgradationModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Log Upgradation Detail for {selectedProject.name}
              </h3>
              <button
                onClick={() => setIsAddUpgradationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddUpgradation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Upgradation / Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={upgForm.title}
                  onChange={(e) => setUpgForm({ ...upgForm, title: e.target.value })}
                  placeholder="e.g. Database Indexing & Query Speedup"
                  className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Progress Percentage: <span className="text-blue-600 font-extrabold">{upgForm.progress}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={upgForm.progress}
                  onChange={(e) => setUpgForm({ ...upgForm, progress: Number(e.target.value) })}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0% (Not Started)</span>
                  <span>50% (Halfway)</span>
                  <span className="font-bold text-emerald-600">100% (Completed & Dispatched Alert)</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Deliverables Completed
                </label>
                <textarea
                  rows={3}
                  value={upgForm.description}
                  onChange={(e) => setUpgForm({ ...upgForm, description: e.target.value })}
                  placeholder="Detail what technical or operational upgrades were completed in this sprint..."
                  className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-200/50 flex items-start gap-2">
                <BellRing className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> Marking completion at 100% will trigger an automated alert to <strong>{selectedProject.managerName || 'Head'}</strong> and <strong>Super Admin</strong>.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUpgradationModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold hover:bg-slate-100 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
                >
                  Save Upgradation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Week Plan Importer Modal */}
      <ExcelWeekPlanImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onImportSuccess={loadProjects}
      />
    </div>
  );
};
