import React from 'react';
import { ChevronRight, Home, Sparkles, Download, Plus } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface BreadcrumbsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onQuickAction?: () => void;
  quickActionLabel?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  activeTab,
  setActiveTab,
  onQuickAction,
  quickActionLabel,
}) => {
  const { openCopilotWithPrompt } = useNotification();

  const tabLabels: Record<string, string> = {
    dashboard: 'Executive Dashboard',
    employees: 'Employee Management',
    my_folder: 'My Folder & Personal Vault',
    organization: 'Organizational Chart & Departments',
    attendance: 'Attendance, GPS Tracking & Shifts',
    leave: 'Leave Management & Approvals',
    timesheets: 'Projects & Weekly Timesheets',
    payroll: 'Payroll Engine & Payslip Generation',
    expenses: 'Expense Claims & Reimbursements',
    recruitment: 'Recruitment & ATS Pipeline',
    performance: 'Performance Reviews & KRA Matrix',
    helpdesk: 'IT & HR Helpdesk Support Tickets',
    assets: 'Corporate Hardware & Assets Inventory',
    audit: 'System Security & Audit Trail',
    settings: 'Enterprise Settings & Roles Matrix',
  };

  const currentTitle = tabLabels[activeTab] || 'Overview';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 bg-slate-50/50 px-4 py-3 dark:border-slate-800/60 dark:bg-slate-900/40 sm:px-6">
      {/* Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </button>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="font-semibold text-slate-800 dark:text-slate-200">{currentTitle}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {onQuickAction && quickActionLabel && (
          <button
            onClick={onQuickAction}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{quickActionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
