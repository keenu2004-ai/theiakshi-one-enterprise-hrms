import React, { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  CalendarDays,
  CreditCard,
  Briefcase,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Plus,
  Sparkles,
  CheckCircle2,
  Building2,
  ChevronRight,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { DashboardMetrics, Announcement } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { EngagementCelebrationModule } from './EngagementCelebrationModule';

export const DashboardView: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { currentUser, currentRole } = useAuth();
  const { showToast, openCopilotWithPrompt } = useNotification();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEmployees: 128,
    activeToday: 118,
    onLeaveToday: 6,
    lateArrivals: 4,
    pendingLeaveApprovals: 5,
    monthlyPayrollTotal: 18450000,
    openJobsCount: 8,
    openTicketsCount: 3,
    attendancePercentage: 96.4,
    retentionRate: 98.2,
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetch('/api/v1/dashboard/metrics')
      .then((r) => r.json())
      .then((data) => {
        if (data.totalEmployees) setMetrics(data);
      })
      .catch((e) => console.error(e));

    fetch('/api/v1/announcements')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAnnouncements(data);
      })
      .catch((e) => console.error(e));
  }, []);

  const isPayrollAdmin =
    currentRole === 'SUPER_ADMIN' ||
    currentRole === 'HR_MANAGER' ||
    currentRole === 'FINANCE' ||
    currentRole === 'PAYROLL_TEAM' ||
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'HR_MANAGER' ||
    currentUser?.role === 'FINANCE' ||
    currentUser?.role === 'PAYROLL_TEAM';

  const metricCards = [
    {
      title: 'Total Workforce',
      value: metrics.totalEmployees,
      sub: 'across 8 Departments',
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
      tab: 'employees',
    },
    {
      title: 'Active Today',
      value: `${metrics.activeToday} / ${metrics.totalEmployees}`,
      sub: `${metrics.attendancePercentage}% Attendance Rate`,
      icon: UserCheck,
      color: 'from-emerald-600 to-teal-600',
      tab: 'attendance',
    },
    {
      title: 'Pending Leaves',
      value: metrics.pendingLeaveApprovals,
      sub: `${metrics.onLeaveToday} employees on leave today`,
      icon: CalendarDays,
      color: 'from-amber-500 to-orange-600',
      tab: 'leave',
    },
    isPayrollAdmin
      ? {
          title: 'Monthly Payroll',
          value: `₹${(metrics.monthlyPayrollTotal / 100000).toFixed(2)} Lakhs`,
          sub: 'Processed & Disbursed for July',
          icon: CreditCard,
          color: 'from-purple-600 to-pink-600',
          tab: 'payroll',
        }
      : {
          title: 'My Monthly Gross Salary',
          value: `₹${(currentUser.salary?.grossSalary || 121000).toLocaleString('en-IN')}`,
          sub: 'Confidential Personal CTC',
          icon: CreditCard,
          color: 'from-purple-600 to-pink-600',
          tab: 'payroll',
        },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-[#0F172A] p-6 text-white shadow-sm border border-[#1E293B]">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#2563EB]/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#38BDF8] border border-[#2563EB]/40">
                THEIAKSHI ENTERPRISES • {currentRole.replace('_', ' ')}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-[#10B981] font-medium">
                <span className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
                Live Sync Active
              </span>
            </div>
            <h1 className="mt-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, {currentUser.firstName}!
            </h1>
            <p className="mt-1 text-xs text-[#94A3B8] max-w-2xl leading-relaxed">
              Real-time workforce overview for today, July 29, 2026. All multi-tenant services, attendance GPS validators, and payroll calculations are synchronized.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('employees')}
              className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Employee</span>
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className="flex items-center gap-2 rounded-lg border border-emerald-600/50 bg-emerald-600/20 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30 transition-colors"
            >
              <CreditCard className="h-4 w-4 text-emerald-400" />
              <span>Apply Expenses</span>
            </button>
            <button
              onClick={() => setActiveTab('timesheets')}
              className="flex items-center gap-2 rounded-lg border border-[#334155] bg-[#1E293B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#334155] transition-colors"
            >
              <Briefcase className="h-4 w-4 text-[#38BDF8]" />
              <span>Project Upgradations</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              onClick={() => setActiveTab(card.tab)}
              className="group cursor-pointer rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm hover:border-[#2563EB] dark:border-slate-800 dark:bg-slate-900 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#64748B] dark:text-slate-400">
                  {card.title}
                </span>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB] dark:bg-slate-800 dark:text-blue-400"
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-[#0F172A] dark:text-slate-100">
                  {card.value}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400">
                  <span>{card.sub}</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#2563EB]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Section: Department Distribution & Quick HR Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Department Workforce Breakdown */}
        <div className="lg:col-span-2 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-slate-100">
                Workforce Distribution by Department
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Headcount and active presence across key operational units
              </p>
            </div>
            <button
              onClick={() => setActiveTab('organization')}
              className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
            >
              View Org Tree <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {[
              { dept: 'Engineering', count: 48, total: 52, pct: 92, color: 'bg-[#2563EB]' },
              { dept: 'Human Resources', count: 12, total: 12, pct: 100, color: 'bg-[#4F46E5]' },
              { dept: 'Finance & Payroll', count: 16, total: 16, pct: 100, color: 'bg-[#10B981]' },
              { dept: 'Marketing & Growth', count: 18, total: 20, pct: 90, color: 'bg-[#F59E0B]' },
              { dept: 'Operations & Legal', count: 24, total: 28, pct: 85, color: 'bg-[#8B5CF6]' },
            ].map((d, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#334155] dark:text-slate-300">
                    {d.dept}
                  </span>
                  <span className="font-mono text-[#64748B] dark:text-slate-400">
                    {d.count} / {d.total} Present ({d.pct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F1F5F9] dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${d.color} transition-all duration-500`}
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Operations Panel */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-slate-100">
            System Shortcuts
          </h3>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mb-4">
            Frequent workflows for rapid execution
          </p>

          <div className="space-y-2.5">
            <button
              onClick={() => setActiveTab('leave')}
              className="flex w-full items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-[#FEF3C7] p-2 text-[#92400E]">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#0F172A] dark:text-slate-200">
                    Apply or Approve Leave
                  </div>
                  <div className="text-[10px] text-[#64748B]">5 requests awaiting approval</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#94A3B8]" />
            </button>

            <button
              onClick={() => setActiveTab('payroll')}
              className="flex w-full items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-[#EDE9FE] p-2 text-[#6D28D9]">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#0F172A] dark:text-slate-200">
                    {isPayrollAdmin ? 'Process July Payroll' : 'My Compensation & Payslips'}
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    {isPayrollAdmin ? 'Calculate tax, PF & payslips' : 'View issued monthly payslips'}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#94A3B8]" />
            </button>

            <button
              onClick={() => setActiveTab('recruitment')}
              className="flex w-full items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-[#EFF6FF] p-2 text-[#1E40AF]">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#0F172A] dark:text-slate-200">
                    Recruitment Pipeline
                  </div>
                  <div className="text-[10px] text-[#64748B]">3 candidates in Offer stage</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#94A3B8]" />
            </button>

            <button
              onClick={() => setActiveTab('helpdesk')}
              className="flex w-full items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-left hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-[#ECFDF5] p-2 text-[#065F46]">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#0F172A] dark:text-slate-200">
                    IT & HR Helpdesk
                  </div>
                  <div className="text-[10px] text-[#64748B]">3 open support tickets</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#94A3B8]" />
            </button>
          </div>
        </div>
      </div>

      {/* Feature 5: Morning Smart Briefing & Task Reminders Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Today's Smart Task Briefing & Reminders
            </div>
            <h3 className="text-lg font-black text-white">
              Good Morning, {currentUser.firstName}! Here is your schedule for today.
            </h3>
            <p className="text-xs text-slate-300">
              You have <strong className="text-amber-400">3 high priority tasks</strong> pending, 1 upcoming client review meeting at 2:00 PM, and 2 leave applications in approval queue.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('projects')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all"
            >
              View Weekly Tasks
            </button>
            <button
              onClick={() => setActiveTab('leave')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all border border-white/10"
            >
              Check-in / Leaves
            </button>
          </div>
        </div>

        {/* Daily Checklist Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Attendance Clocked-In</p>
              <p className="text-[10px] text-slate-400">9:02 AM • Indiranagar HQ Geofence</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Figma Tokens Audit</p>
              <p className="text-[10px] text-slate-400">Due Today • Priority HIGH</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <Users className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Sprint Sync Meeting</p>
              <p className="text-[10px] text-slate-400">2:00 PM - 2:45 PM • Conference Room B</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 6: Celebrations & Engagement Widget */}
      <EngagementCelebrationModule embedded />

      {/* Bottom Section: Announcements & Recent Activity Stream */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Corporate Announcements */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] dark:border-slate-800">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-slate-100">
              Company Broadcasts
            </h3>
            <span className="rounded-md bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-bold text-[#1E40AF]">
              Official
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 dark:border-slate-800/80 dark:bg-slate-800/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#0F172A] dark:text-slate-100">
                    {ann.title}
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">{ann.date}</span>
                </div>
                <p className="mt-1 text-xs text-[#475569] dark:text-slate-300 leading-relaxed">{ann.content}</p>
                <div className="mt-2 text-[10px] text-[#64748B] font-medium">
                  Posted by {ann.author}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Activity Stream */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] dark:border-slate-800">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-slate-100">
              Recent System Activity
            </h3>
            <button
              onClick={() => setActiveTab('audit')}
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              Full Audit Logs
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {[
              {
                user: 'Arjun Sharma',
                action: 'Updated Geofence coordinates for HQ-1',
                time: '10 mins ago',
                icon: ShieldCheck,
                color: 'text-[#2563EB]',
              },
              {
                user: 'Sneha Kulkarni',
                action: 'Approved 3-day Casual Leave for Pooja Mehta',
                time: '45 mins ago',
                icon: CheckCircle2,
                color: 'text-[#10B981]',
              },
              {
                user: 'Manish Deshmukh',
                action: 'Disbursed July 2026 salary bank transfers',
                time: '2 hours ago',
                icon: CreditCard,
                color: 'text-[#8B5CF6]',
              },
              {
                user: 'Ananya Rao',
                action: 'Clocked In via Remote VPN',
                time: '3 hours ago',
                icon: Clock,
                color: 'text-[#F59E0B]',
              },
            ].map((act, i) => {
              const Icon = act.icon;
              return (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className={`mt-0.5 rounded-md bg-[#F1F5F9] p-1.5 dark:bg-slate-800 ${act.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-[#0F172A] dark:text-slate-200">{act.user}</span>{' '}
                    <span className="text-[#475569] dark:text-slate-400">{act.action}</span>
                    <div className="text-[10px] text-[#94A3B8] mt-0.5">{act.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
