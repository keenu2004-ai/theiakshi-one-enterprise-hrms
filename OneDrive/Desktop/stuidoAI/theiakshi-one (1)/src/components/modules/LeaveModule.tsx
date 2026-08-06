import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Check,
  X,
  MessageSquare,
  AlertCircle,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { LeaveRequest, LeaveType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { offlineSyncService } from '../../services/offlineSync';
import { STORES } from '../../lib/idb';

import { HolidayCalendar } from './HolidayCalendar';

export const LeaveModule: React.FC = () => {
  const { currentUser, currentRole, hasPermission } = useAuth();
  const { showToast } = useNotification();

  const isSuperAdmin = currentRole === 'SUPER_ADMIN';

  const [activeSubTab, setActiveSubTab] = useState<'REQUESTS' | 'HOLIDAY_CALENDAR'>('REQUESTS');
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSuperAdminAdjustOpen, setIsSuperAdminAdjustOpen] = useState(false);

  // Super Admin Adjustment State
  const [adjustTargetEmpId, setAdjustTargetEmpId] = useState('emp-4');
  const [adjustLeaveType, setAdjustLeaveType] = useState<LeaveType>('CASUAL');
  const [adjustAction, setAdjustAction] = useState<'ADD' | 'REDUCE'>('ADD');
  const [adjustDays, setAdjustDays] = useState(1);
  const [adjustReason, setAdjustReason] = useState('Executive approval / Annual credit correction');

  // Apply form state
  const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-02');
  const [reason, setReason] = useState('');

  const loadLeaves = async () => {
    const res = await offlineSyncService.apiFetch<LeaveRequest[]>('/api/v1/leaves', {}, {
      store: STORES.LEAVES,
      module: 'Leave Management',
      description: 'Fetch leave applications',
    });

    if (res.data && Array.isArray(res.data)) {
      setLeaves(res.data);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      showToast('Validation Error', 'Please specify a reason for leave', 'ERROR');
      return;
    }

    const payload = {
      employeeId: currentUser.id,
      leaveType,
      startDate,
      endDate,
      totalDays: 2,
      reason,
    };

    const res = await offlineSyncService.apiFetch<LeaveRequest>(
      '/api/v1/leaves',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      {
        store: STORES.LEAVES,
        module: 'Leave Management',
        description: `Apply leave for ${currentUser.firstName} (${leaveType})`,
      }
    );

    if (res.queued) {
      showToast('Leave Request Queued (Offline)', 'Your leave request was stored in IndexedDB and will auto-submit when online.', 'WARNING');
    } else {
      showToast('Leave Applied', 'Your request has been forwarded to your manager for approval.', 'SUCCESS');
    }

    setIsApplyModalOpen(false);
    setReason('');
    loadLeaves();
  };

  const handleSuperAdminAdjustLeave = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/v1/leaves/adjust-balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: adjustTargetEmpId,
        leaveType: adjustLeaveType,
        action: adjustAction,
        days: adjustDays,
        reason: adjustReason,
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        showToast(
          'Leave Balance Adjusted',
          res.message || `Successfully ${adjustAction === 'ADD' ? 'credited' : 'reduced'} ${adjustDays} day(s)`,
          'SUCCESS'
        );
        setIsSuperAdminAdjustOpen(false);
        loadLeaves();
      })
      .catch((err) => showToast('Error', 'Failed adjusting leave balance', 'ERROR'));
  };

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const res = await offlineSyncService.apiFetch(
      `/api/v1/leaves/${id}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          approvedBy: `${currentUser.firstName} ${currentUser.lastName}`,
          comments: status === 'APPROVED' ? 'Approved based on team balance' : 'Request rejected due to overlapping sprint delivery',
        }),
      },
      {
        store: STORES.LEAVES,
        module: 'Leave Management',
        description: `Update leave ${id} status to ${status}`,
      }
    );

    if (res.queued) {
      showToast('Status Update Queued (Offline)', 'Action stored in IndexedDB sync queue.', 'WARNING');
    } else {
      showToast(status === 'APPROVED' ? 'Leave Approved' : 'Leave Rejected', `Request marked as ${status}`, status === 'APPROVED' ? 'SUCCESS' : 'WARNING');
    }

    loadLeaves();
  };

  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [quotaTargetKey, setQuotaTargetKey] = useState('DEFAULT');
  const [quotaForm, setQuotaForm] = useState({
    casual: 12,
    sick: 12,
    earned: 15,
    unpaid: 10,
    total: 49,
  });

  const [currentQuota, setCurrentQuota] = useState({
    casual: 12,
    sick: 12,
    earned: 15,
    unpaid: 10,
    total: 49,
  });

  const loadQuota = (targetKey = 'DEFAULT') => {
    fetch(`/api/v1/leaves/quota?employeeId=${targetKey}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.quota) {
          setCurrentQuota(data.quota);
          setQuotaForm(data.quota);
        }
      })
      .catch((err) => console.error('Error fetching leave quota:', err));
  };

  useEffect(() => {
    loadQuota(currentUser.id);
  }, [currentUser.id]);

  const handleSaveQuota = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/v1/leaves/quota', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetKey: quotaTargetKey,
        ...quotaForm,
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        showToast(
          'Leave Quotas Updated',
          res.message || 'Successfully updated leave policy allowances.',
          'SUCCESS'
        );
        setIsQuotaModalOpen(false);
        loadQuota(currentUser.id);
      })
      .catch(() => showToast('Error', 'Failed to update leave policy quotas', 'ERROR'));
  };

  const usedCasual = leaves
    .filter((l) => l.employeeId === currentUser.id && l.leaveType === 'CASUAL' && l.status !== 'REJECTED')
    .reduce((acc, l) => acc + (l.totalDays || 0), 0);
  const usedSick = leaves
    .filter((l) => l.employeeId === currentUser.id && l.leaveType === 'SICK' && l.status !== 'REJECTED')
    .reduce((acc, l) => acc + (l.totalDays || 0), 0);
  const usedEarned = leaves
    .filter((l) => l.employeeId === currentUser.id && l.leaveType === 'EARNED' && l.status !== 'REJECTED')
    .reduce((acc, l) => acc + (l.totalDays || 0), 0);
  const usedUnpaid = leaves
    .filter((l) => l.employeeId === currentUser.id && l.leaveType === 'UNPAID' && l.status !== 'REJECTED')
    .reduce((acc, l) => acc + (l.totalDays || 0), 0);

  const leaveBalances = [
    {
      title: 'Casual Leave (Max 2/Month)',
      total: currentQuota.casual,
      used: usedCasual,
      remaining: Math.max(0, currentQuota.casual - usedCasual),
      color: 'border-blue-500',
    },
    {
      title: 'Sick Leave',
      total: currentQuota.sick,
      used: usedSick,
      remaining: Math.max(0, currentQuota.sick - usedSick),
      color: 'border-emerald-500',
    },
    {
      title: 'Earned Leave',
      total: currentQuota.earned,
      used: usedEarned,
      remaining: Math.max(0, currentQuota.earned - usedEarned),
      color: 'border-purple-500',
    },
    {
      title: 'Unpaid Leave (LWP)',
      total: currentQuota.unpaid,
      used: usedUnpaid,
      remaining: Math.max(0, currentQuota.unpaid - usedUnpaid),
      color: 'border-amber-500',
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Leave & Holiday Portal</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Apply for leave, track remaining balances, view multi-region holiday calendars, and manage employee leave quotas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin && (
            <>
              <button
                onClick={() => {
                  setQuotaTargetKey('DEFAULT');
                  loadQuota('DEFAULT');
                  setIsQuotaModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all hover:scale-105"
              >
                <Sliders className="h-4 w-4" />
                <span>Super Admin Edit Policy & Quotas</span>
              </button>

              <button
                onClick={() => setIsSuperAdminAdjustOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-700 transition-all hover:scale-105"
              >
                <Sliders className="h-4 w-4" />
                <span>Adjust Employee Balance</span>
              </button>
            </>
          )}

          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span>Apply Leave</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('REQUESTS')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'REQUESTS'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          Leave Applications & Approvals
        </button>

        <button
          onClick={() => setActiveSubTab('HOLIDAY_CALENDAR')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'HOLIDAY_CALENDAR'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          🗓️ Enterprise Holiday Calendar
        </button>
      </div>

      {/* Tab Render Switch */}
      {activeSubTab === 'HOLIDAY_CALENDAR' ? (
        <HolidayCalendar embedded />
      ) : (
        <>
          {/* Leave Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {leaveBalances.map((bal, i) => (
              <div
                key={i}
                className={`rounded-2xl border-l-4 ${bal.color} border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900`}
              >
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{bal.title}</div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{bal.remaining} Days</span>
                  <span className="text-[10px] text-slate-400 font-mono">{bal.used} used of {bal.total}</span>
                </div>
              </div>
            ))}
          </div>

      {/* Leave Requests Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Leave Requests & Approval Queue
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaves.map((lv) => (
                <tr key={lv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <img src={lv.employeeAvatar} alt={lv.employeeName} className="h-7 w-7 rounded-full object-cover" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{lv.employeeName}</div>
                        <div className="text-[10px] text-slate-400">{lv.department}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5 font-semibold text-blue-600 dark:text-blue-400">{lv.leaveType}</td>

                  <td className="p-3.5">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {lv.startDate} to {lv.endDate}
                    </div>
                    <div className="text-[10px] text-slate-400">{lv.totalDays} Day(s)</div>
                  </td>

                  <td className="p-3.5 max-w-xs truncate text-slate-600 dark:text-slate-300">{lv.reason}</td>

                  <td className="p-3.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        lv.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : lv.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                      }`}
                    >
                      {lv.status}
                    </span>
                  </td>

                  <td className="p-3.5 text-right">
                    {lv.status === 'PENDING' && (currentRole === 'SUPER_ADMIN' || currentRole === 'HR_MANAGER' || currentRole === 'TEAM_MANAGER') ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleUpdateStatus(lv.id, 'APPROVED')}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                        >
                          <Check className="h-3 w-3" /> Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(lv.id, 'REJECTED')}
                          className="flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700 hover:bg-red-200"
                        >
                          <X className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Apply for Leave</h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800"
                >
                  <option value="CASUAL">Casual Leave (Remaining: 8)</option>
                  <option value="SICK">Sick Leave (Remaining: 10)</option>
                  <option value="EARNED">Earned Leave (Remaining: 10)</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Reason</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the reason for leave request..."
                  className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t dark:border-slate-800">
                <button type="button" onClick={() => setIsApplyModalOpen(false)} className="rounded-xl border px-4 py-2">
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Adjust Quota Modal */}
      {isSuperAdminAdjustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Super Admin Leave Quota Override
                </h3>
              </div>
              <button onClick={() => setIsSuperAdminAdjustOpen(false)} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSuperAdminAdjustLeave} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Select Employee</label>
                <select
                  value={adjustTargetEmpId}
                  onChange={(e) => setAdjustTargetEmpId(e.target.value)}
                  className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800"
                >
                  <option value="emp-4">Ananya Rao (emp-4 • Mobile UX)</option>
                  <option value="emp-1">Arjun Sharma (emp-1 • Tech Lead)</option>
                  <option value="emp-2">Priya Patel (emp-2 • HR Manager)</option>
                  <option value="emp-3">Rahul Verma (emp-3 • Product Manager)</option>
                  <option value="emp-5">Karan Gupta (emp-5 • QA Engineer)</option>
                  <option value="emp-6">Siddharth Malhotra (emp-6 • Business Associate)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Action</label>
                  <select
                    value={adjustAction}
                    onChange={(e) => setAdjustAction(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 font-bold text-purple-600"
                  >
                    <option value="ADD">➕ Add / Credit Leaves</option>
                    <option value="REDUCE">➖ Reduce / Deduct Leaves</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Leave Category</label>
                  <select
                    value={adjustLeaveType}
                    onChange={(e) => setAdjustLeaveType(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800"
                  >
                    <option value="CASUAL">Casual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="EARNED">Earned Leave</option>
                    <option value="UNPAID">Unpaid Leave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Number of Days</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={adjustDays}
                  onChange={(e) => setAdjustDays(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Override Reason / Audit Note</label>
                <textarea
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="State reason for manual credit or reduction..."
                  className="mt-1 w-full rounded-xl border p-2.5 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSuperAdminAdjustOpen(false)}
                  className="rounded-xl border px-4 py-2 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-purple-600 px-4 py-2 font-bold text-white shadow-md hover:bg-purple-700">
                  Execute Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Super Admin Edit Policy & Quotas Modal */}
      {isQuotaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Configure Leave Policy & Allowances
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Set annual leave days per category and total overall allowance.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsQuotaModalOpen(false)} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuota} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Policy Scope / Target</label>
                <select
                  value={quotaTargetKey}
                  onChange={(e) => {
                    const key = e.target.value;
                    setQuotaTargetKey(key);
                    loadQuota(key);
                  }}
                  className="mt-1 w-full rounded-xl border p-2.5 font-bold text-indigo-600 dark:bg-slate-800"
                >
                  <option value="DEFAULT">🏢 Global Enterprise Company Policy (All Employees)</option>
                  <option value="emp-4">Ananya Rao (emp-4 • Mobile UX)</option>
                  <option value="emp-1">Arjun Sharma (emp-1 • Tech Lead)</option>
                  <option value="emp-2">Priya Patel (emp-2 • HR Manager)</option>
                  <option value="emp-3">Rahul Verma (emp-3 • Product Manager)</option>
                  <option value="emp-5">Karan Gupta (emp-5 • QA Engineer)</option>
                  <option value="emp-6">Siddharth Malhotra (emp-6 • Business Associate)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3 bg-blue-50/50 dark:bg-slate-800/50 dark:border-slate-700">
                  <label className="font-bold text-blue-700 dark:text-blue-400">Casual Leave (Days)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quotaForm.casual}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const newCasual = val;
                      const newTotal = newCasual + quotaForm.sick + quotaForm.earned + quotaForm.unpaid;
                      setQuotaForm({ ...quotaForm, casual: newCasual, total: newTotal });
                    }}
                    className="mt-1.5 w-full rounded-lg border p-2 font-black text-sm text-slate-900 dark:bg-slate-800 dark:border-slate-600"
                  />
                  <span className="text-[10px] text-slate-400">Default: 12 days/yr</span>
                </div>

                <div className="rounded-xl border p-3 bg-emerald-50/50 dark:bg-slate-800/50 dark:border-slate-700">
                  <label className="font-bold text-emerald-700 dark:text-emerald-400">Sick Leave (Days)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quotaForm.sick}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const newSick = val;
                      const newTotal = quotaForm.casual + newSick + quotaForm.earned + quotaForm.unpaid;
                      setQuotaForm({ ...quotaForm, sick: newSick, total: newTotal });
                    }}
                    className="mt-1.5 w-full rounded-lg border p-2 font-black text-sm text-slate-900 dark:bg-slate-800 dark:border-slate-600"
                  />
                  <span className="text-[10px] text-slate-400">Default: 12 days/yr</span>
                </div>

                <div className="rounded-xl border p-3 bg-purple-50/50 dark:bg-slate-800/50 dark:border-slate-700">
                  <label className="font-bold text-purple-700 dark:text-purple-400">Earned Leave (Days)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quotaForm.earned}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const newEarned = val;
                      const newTotal = quotaForm.casual + quotaForm.sick + newEarned + quotaForm.unpaid;
                      setQuotaForm({ ...quotaForm, earned: newEarned, total: newTotal });
                    }}
                    className="mt-1.5 w-full rounded-lg border p-2 font-black text-sm text-slate-900 dark:bg-slate-800 dark:border-slate-600"
                  />
                  <span className="text-[10px] text-slate-400">Default: 15 days/yr</span>
                </div>

                <div className="rounded-xl border p-3 bg-amber-50/50 dark:bg-slate-800/50 dark:border-slate-700">
                  <label className="font-bold text-amber-700 dark:text-amber-400">Unpaid Leave (LWP)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quotaForm.unpaid}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const newUnpaid = val;
                      const newTotal = quotaForm.casual + quotaForm.sick + quotaForm.earned + newUnpaid;
                      setQuotaForm({ ...quotaForm, unpaid: newUnpaid, total: newTotal });
                    }}
                    className="mt-1.5 w-full rounded-lg border p-2 font-black text-sm text-slate-900 dark:bg-slate-800 dark:border-slate-600"
                  />
                  <span className="text-[10px] text-slate-400">Default: 10 days/yr</span>
                </div>
              </div>

              <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 p-3.5 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200">Total Annual Leave Quota</span>
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-300">Sum of all leave categories combined</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={quotaForm.total}
                    onChange={(e) => setQuotaForm({ ...quotaForm, total: Number(e.target.value) })}
                    className="w-20 rounded-xl border p-2 font-black text-base text-center bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400"
                  />
                  <span className="font-bold text-xs text-indigo-800 dark:text-indigo-300">Days</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuotaModalOpen(false)}
                  className="rounded-xl border px-4 py-2 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white shadow-md hover:bg-indigo-700">
                  Save Leave Policy Quotas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
