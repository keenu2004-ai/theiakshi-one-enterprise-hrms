import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  Download,
  Filter,
  User,
  Sparkles,
  PieChart,
  BarChart3,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { YearlyLeaveLedgerItem, Employee } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const YearlyLeaveLedger: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { showToast } = useNotification();

  const isManagerOrAdmin =
    currentRole === 'SUPER_ADMIN' || currentRole === 'HR_MANAGER' || currentRole === 'TEAM_MANAGER';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(currentUser.id || 'emp-1');
  const [ledgerData, setLedgerData] = useState<YearlyLeaveLedgerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const fetchEmployees = () => {
    fetch('/api/v1/employees')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEmployees(data);
      })
      .catch((err) => console.error('Error fetching employees:', err));
  };

  const fetchLedger = (empId: string) => {
    setLoading(true);
    fetch(`/api/v1/leave/ledger?employeeId=${empId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ledger && Array.isArray(data.ledger)) {
          setLedgerData(data.ledger);
        }
      })
      .catch((err) => console.error('Error loading leave ledger:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchLedger(selectedEmpId);
  }, [selectedEmpId]);

  const totalAllocatedAll = ledgerData.reduce((acc, curr) => acc + curr.totalAllocated, 0);
  const totalUsedAll = ledgerData.reduce((acc, curr) => acc + curr.used, 0);
  const totalRemainingAll = ledgerData.reduce((acc, curr) => acc + curr.remaining, 0);
  const totalPendingAll = ledgerData.reduce((acc, curr) => acc + curr.pending, 0);

  const handleExportLedger = () => {
    const csvRows = [
      ['Leave Type', 'Total Allocated', 'Approved Used', 'Remaining Balance', 'Pending Requests', 'Rejected'],
      ...ledgerData.map((item) => [
        item.leaveType,
        item.totalAllocated,
        item.used,
        item.remaining,
        item.pending,
        item.rejected,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `THEIAKSHI_Leave_Ledger_${selectedEmpId}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Ledger Exported', 'Downloaded complete leave ledger summary in CSV format.', 'SUCCESS');
  };

  const selectedEmployeeObj = employees.find((e) => e.id === selectedEmpId) || currentUser;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
            <PieChart className="w-4 h-4" /> Enterprise Audit & Balance Tracking
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Yearly Leave Ledger 2026</h2>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl">
            Complete annual breakdown across Annual/Earned, Casual, Sick, Comp-Off, Optional, Restricted, and Loss of Pay categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isManagerOrAdmin && (
            <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-xl border border-white/20 backdrop-blur-md">
              <User className="w-4 h-4 text-emerald-300 ml-1" />
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-2"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id} className="text-slate-900">
                    {e.firstName} {e.lastName} ({e.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleExportLedger}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/30 transition-all shrink-0"
          >
            <Download className="w-4 h-4" /> Export Ledger CSV
          </button>
        </div>
      </div>

      {/* Top Level Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Entitlement
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {totalAllocatedAll} <span className="text-xs font-semibold text-slate-400">Days</span>
          </p>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1 block">
            Annual 2026 Allocation
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Approved / Used
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {totalUsedAll} <span className="text-xs font-semibold text-slate-400">Days</span>
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
            Deducted from balance
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Available Balance
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {totalRemainingAll} <span className="text-xs font-semibold text-slate-400">Days</span>
          </p>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-1 block">
            Ready to apply
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {totalPendingAll} <span className="text-xs font-semibold text-slate-400">Days</span>
          </p>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1 block">
            Awaiting manager review
          </span>
        </div>
      </div>

      {/* Detailed Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Detailed Leave Ledger Breakdown for {selectedEmployeeObj.firstName} {selectedEmployeeObj.lastName}
            </h3>
            <p className="text-xs text-slate-500">
              Department: {selectedEmployeeObj.department || 'Engineering'} • Code: {selectedEmployeeObj.code || 'EMP-101'}
            </p>
          </div>
          <span className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Fiscal Year 2026
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold uppercase text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Leave Category</th>
                  <th className="px-5 py-3.5 text-center">Total Allocated</th>
                  <th className="px-5 py-3.5 text-center">Approved Used</th>
                  <th className="px-5 py-3.5 text-center">Pending</th>
                  <th className="px-5 py-3.5 text-center">Rejected</th>
                  <th className="px-5 py-3.5 text-right">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {ledgerData.map((item, idx) => {
                  const percentUsed = item.totalAllocated
                    ? Math.round((item.used / item.totalAllocated) * 100)
                    : 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900 dark:text-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          {item.leaveType.replace(/_/g, ' ')} LEAVE
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-slate-800 dark:text-slate-200">
                        {item.totalAllocated} Days
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {item.used} Days
                      </td>
                      <td className="px-5 py-4 text-center font-semibold text-amber-600 dark:text-amber-400">
                        {item.pending} Days
                      </td>
                      <td className="px-5 py-4 text-center font-semibold text-rose-500">
                        {item.rejected} Days
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-extrabold text-sm text-purple-600 dark:text-purple-400">
                          {item.remaining} Days
                        </span>
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full ml-auto mt-1 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all"
                            style={{ width: `${Math.min(100, percentUsed)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
