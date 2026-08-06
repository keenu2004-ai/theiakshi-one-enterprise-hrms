import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
  Printer,
  Eye,
  X,
  Building2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Payslip } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { offlineSyncService } from '../../services/offlineSync';
import { STORES } from '../../lib/idb';

export const PayrollModule: React.FC = () => {
  const { currentUser, hasRole, hasPermission } = useAuth();
  const { showToast } = useNotification();

  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoReport, setAutoReport] = useState<any | null>(null);

  const isPayrollAdmin = hasRole(['SUPER_ADMIN', 'HR_MANAGER', 'FINANCE']);

  const loadPayslips = async () => {
    const endpoint = isPayrollAdmin
      ? '/api/v1/payroll/payslips'
      : `/api/v1/payroll/payslips?employeeId=${currentUser.id}`;

    const res = await offlineSyncService.apiFetch<Payslip[]>(endpoint, {}, {
      store: STORES.PAYROLL,
      module: 'Payroll',
      description: 'Fetch monthly payslips',
    });

    if (res.data && Array.isArray(res.data)) {
      setPayslips(res.data);
    }
  };

  useEffect(() => {
    loadPayslips();
  }, [currentUser.id, isPayrollAdmin]);

  const displayedPayslips = isPayrollAdmin
    ? payslips
    : payslips.filter(
        (p) =>
          p.employeeId === currentUser.id ||
          p.employeeCode === currentUser.code ||
          p.employeeName?.toLowerCase().includes(currentUser.firstName.toLowerCase())
      );

  const handleAutoCalculateAndApprove = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/v1/payroll/auto-calculate-and-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthYear: 'July 2026' }),
      });
      const data = await res.json();
      setIsProcessing(false);

      if (data.payslips) {
        setPayslips(data.payslips);
      }
      setAutoReport(data);
      showToast(
        'Payroll Auto-Calculated & Approved',
        `Leaves, attendance, working days, and approved expenses audited automatically across ${data.totalEmployeesProcessed} employees.`,
        'SUCCESS'
      );
    } catch (err) {
      setIsProcessing(false);
      showToast('Error', 'Automated payroll check failed.', 'ERROR');
    }
  };

  const handleProcessMonthlyPayroll = async () => {
    setIsProcessing(true);
    const res = await offlineSyncService.apiFetch<{ message?: string }>(
      '/api/v1/payroll/process-month',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthYear: 'July 2026' }),
      },
      {
        store: STORES.PAYROLL,
        module: 'Payroll',
        description: 'Process July 2026 Monthly Payroll',
      }
    );

    setIsProcessing(false);
    if (res.queued) {
      showToast('Payroll Disbursal Queued (Offline)', 'Payroll batch processing queued in IndexedDB sync queue.', 'WARNING');
    } else {
      showToast('Payroll Disbursed', res.data?.message || 'Processed July 2026 payroll', 'SUCCESS');
    }
    loadPayslips();
  };

  const totalPayrollGross = displayedPayslips.reduce((acc, p) => acc + p.grossEarnings, 0);
  const totalPayrollNet = displayedPayslips.reduce((acc, p) => acc + p.netSalary, 0);
  const totalPF = displayedPayslips.reduce((acc, p) => acc + p.pfDeduction, 0);
  const totalTDS = displayedPayslips.reduce((acc, p) => acc + p.taxDeduction, 0);

  const handlePrintPayslip = () => {
    window.print();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Privacy Header for regular employees */}
      {!isPayrollAdmin && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-800 dark:text-emerald-200">
          <Lock className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <strong className="font-bold text-sm">🔒 Confidential Employee Compensation View</strong>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
              Showing confidential payroll records for <strong>{currentUser.firstName} {currentUser.lastName}</strong> ({currentUser.code}). Access is strictly restricted to your authenticated account and authorized HR Finance.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isPayrollAdmin ? 'Payroll & Compensation Engine' : 'My Compensation & Payslips'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isPayrollAdmin
              ? 'Monthly salary disbursements, tax deductions, Provident Fund (PF), ESI, and automated payslip generation.'
              : 'View your monthly payslips, salary breakdowns, tax withholdings, and provident fund contributions.'}
          </p>
        </div>

        {isPayrollAdmin && hasPermission('payroll:write') && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAutoCalculateAndApprove}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all hover:scale-105 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isProcessing ? 'Auto-Auditing...' : 'Auto-Calculate & Approve Payroll'}</span>
            </button>

            <button
              onClick={handleProcessMonthlyPayroll}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-700 transition-all hover:scale-105 disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              <span>{isProcessing ? 'Processing...' : 'Disburse July 2026 Payroll'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-400 font-semibold">
            {isPayrollAdmin ? 'Total Gross Monthly CTC' : 'My Monthly Gross Salary'}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            ₹{totalPayrollGross.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-400 font-semibold">
            {isPayrollAdmin ? 'Net Disbursed Take-Home' : 'My Net Take-Home Pay'}
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{totalPayrollNet.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-400 font-semibold">
            {isPayrollAdmin ? 'Provident Fund (EPF)' : 'My EPF Contribution'}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            ₹{totalPF.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs text-slate-400 font-semibold">
            {isPayrollAdmin ? 'TDS Income Tax Withheld' : 'My Income Tax (TDS)'}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            ₹{totalTDS.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {isPayrollAdmin ? 'Employee Payslips • July 2026 Cycle' : 'My Issued Payslips'}
          </h3>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            100% Disbursed & Verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800">
              <tr>
                <th className="p-3.5">Payslip #</th>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Gross Pay</th>
                <th className="p-3.5">Deductions</th>
                <th className="p-3.5">Net Salary</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedPayslips.map((ps) => (
                <tr key={ps.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="p-3.5 font-mono font-semibold text-slate-700 dark:text-slate-300">{ps.payslipNumber}</td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{ps.employeeName}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">{ps.department}</td>
                  <td className="p-3.5">₹{ps.grossEarnings.toLocaleString('en-IN')}</td>
                  <td className="p-3.5 text-red-600 dark:text-red-400">-₹{ps.totalDeductions.toLocaleString('en-IN')}</td>
                  <td className="p-3.5 font-extrabold text-emerald-600 dark:text-emerald-400">
                    ₹{ps.netSalary.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {ps.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setSelectedPayslip(ps)}
                      className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Payslip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto print:shadow-none print:border-none">
            {/* Header / Actions */}
            <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Official Payslip Document</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPayslip}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Printer className="h-3.5 w-3.5" /> Print / Save PDF
                </button>
                <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Template */}
            <div className="mt-4 p-6 border rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs space-y-6">
              {/* Branding */}
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-blue-600">THEIAKSHI ENTERPRISES</h2>
                  <p className="text-[10px] text-slate-500">Corporate HQ • Bengaluru, Karnataka, India 560038</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold">{selectedPayslip.payPeriod}</div>
                  <div className="text-[10px] font-mono text-slate-400">{selectedPayslip.payslipNumber}</div>
                </div>
              </div>

              {/* Employee Particulars Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl dark:bg-slate-800/50">
                <div>
                  <div><span className="text-slate-400">Employee Name:</span> <span className="font-bold">{selectedPayslip.employeeName}</span></div>
                  <div><span className="text-slate-400">Employee Code:</span> <span className="font-mono">{selectedPayslip.employeeCode}</span></div>
                  <div><span className="text-slate-400">Designation:</span> <span className="font-medium">{selectedPayslip.designation}</span></div>
                </div>
                <div>
                  <div><span className="text-slate-400">Department:</span> <span className="font-medium">{selectedPayslip.department}</span></div>
                  <div><span className="text-slate-400">Bank Account #:</span> <span className="font-mono">{selectedPayslip.bankAccountNumber}</span></div>
                  <div><span className="text-slate-400">PAN Number:</span> <span className="font-mono">{selectedPayslip.panNumber}</span></div>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-2 gap-6">
                {/* Earnings */}
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 border-b pb-1 mb-2 uppercase text-[10px]">
                    Earnings Breakdown
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span>Basic Pay</span><span>₹{selectedPayslip.basicSalary.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>House Rent Allowance (HRA)</span><span>₹{selectedPayslip.hra.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Special Allowance</span><span>₹{selectedPayslip.specialAllowance.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between border-t pt-1 font-bold text-emerald-600">
                      <span>Gross Earnings</span><span>₹{selectedPayslip.grossEarnings.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 border-b pb-1 mb-2 uppercase text-[10px]">
                    Statutory Deductions
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span>Employee PF</span><span>₹{selectedPayslip.pfDeduction.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Professional Tax / ESI</span><span>₹{selectedPayslip.esiDeduction.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>TDS Income Tax</span><span>₹{selectedPayslip.taxDeduction.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between border-t pt-1 font-bold text-red-600">
                      <span>Total Deductions</span><span>₹{selectedPayslip.totalDeductions.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Disbursed Box */}
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between dark:bg-emerald-950 dark:border-emerald-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Net Salary Payable</span>
                  <div className="text-xl font-black text-emerald-800 dark:text-emerald-200">
                    ₹{selectedPayslip.netSalary.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-[10px] text-emerald-700 font-medium text-right">
                  Transferred via NEFT/RTGS<br />Status: PAID
                </div>
              </div>

              <div className="text-[9px] text-slate-400 text-center pt-2">
                This is a computer-generated payslip document for THEIAKSHI ENTERPRISES and does not require a physical signature.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Calculation Audit Report Modal */}
      {autoReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Automated Payroll Approval Report ({autoReport.targetPeriod})
                </h3>
              </div>
              <button onClick={() => setAutoReport(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200">
              <strong>Automated Zero-Manual Audit Success:</strong> Verified leaves, present days, working days, and approved expense reimbursements across {autoReport.totalEmployeesProcessed} employees. All payslips auto-approved and generated.
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-slate-50 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800">
                  <tr>
                    <th className="p-2.5">Employee</th>
                    <th className="p-2.5">Paid Days</th>
                    <th className="p-2.5">Unpaid Leaves</th>
                    <th className="p-2.5">Expense Reimbursed</th>
                    <th className="p-2.5">Net Disbursed</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {autoReport.processedReport?.map((rep: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="p-2.5 font-bold">{rep.employeeName} ({rep.code})</td>
                      <td className="p-2.5">{rep.paidDays} / 22 Days</td>
                      <td className="p-2.5 text-red-500">{rep.unpaidLeavesDays} Days</td>
                      <td className="p-2.5 font-semibold text-emerald-600">
                        ₹{rep.approvedExpenseReimbursements.toLocaleString()}
                      </td>
                      <td className="p-2.5 font-extrabold">₹{rep.netSalary.toLocaleString()}</td>
                      <td className="p-2.5">
                        <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 font-bold">
                          AUTO APPROVED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setAutoReport(null)}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
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
