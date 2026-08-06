import React from 'react';
import {
  LayoutDashboard,
  Users,
  Network,
  Clock,
  CalendarDays,
  FileSpreadsheet,
  Briefcase,
  Award,
  HelpCircle,
  HardDrive,
  FolderGit2,
  ListTodo,
  FileText,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building2,
  X,
  FolderArchive,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { UserRole } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  roles?: UserRole[];
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { currentRole, hasRole } = useAuth();

  const navigationGroups: NavGroup[] = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'WORKFORCE',
      items: [
        { id: 'employees', label: 'Employees', icon: Users },
        { id: 'branches', label: 'Branches & Workspaces', icon: Building2, roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
        { id: 'my_folder', label: 'My Folder', icon: FolderArchive },
        { id: 'organization', label: 'Org Structure', icon: Network },
      ],
    },
    {
      group: 'OPERATIONS',
      items: [
        { id: 'attendance', label: 'Attendance & Shifts', icon: Clock },
        { id: 'leave', label: 'Leave Management', icon: CalendarDays },
        { id: 'timesheets', label: 'Projects & Timesheets', icon: FolderGit2 },
      ],
    },
    {
      group: 'FINANCE & PAYROLL',
      items: [
        { id: 'payroll', label: 'Payroll & Payslips', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'HR_MANAGER', 'FINANCE', 'PAYROLL_TEAM', 'EMPLOYEE'] },
        { id: 'expenses', label: 'Expenses & Claims', icon: Receipt, roles: ['SUPER_ADMIN', 'HR_MANAGER', 'TEAM_MANAGER', 'FINANCE', 'EMPLOYEE'] },
      ],
    },
    {
      group: 'SERVICES & ASSETS',
      items: [
        { id: 'helpdesk', label: 'Helpdesk Tickets', icon: HelpCircle },
        { id: 'assets', label: 'Asset Management', icon: HardDrive },
      ],
    },
    {
      group: 'GOVERNANCE & SYSTEM',
      items: [
        { id: 'settings', label: 'System Settings', icon: Settings, roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0F172A] text-[#94A3B8] dark:bg-slate-950">
      {/* Top Branding Section */}
      <div>
        <div className="flex h-16 items-center justify-between border-b border-[#1E293B] px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#4F46E5] text-white font-bold text-lg shadow-md shrink-0">
              T
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-white text-base leading-tight tracking-tight">
                  THEIAKSHI <span className="text-[#38BDF8]">ONE</span>
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#1E293B] hover:text-white lg:block transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Mobile close trigger */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#1E293B] hover:text-white lg:hidden transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="mt-3 space-y-5 px-3 overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar">
          {navigationGroups.map((group) => {
            const filteredItems = group.items.filter(
              (item) => !item.roles || hasRole(item.roles as any)
            );

            if (filteredItems.length === 0) return null;

            return (
              <div key={group.group} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] opacity-60">
                    {group.group}
                  </div>
                )}
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileOpen(false);
                        }}
                        className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#2563EB] text-white font-semibold shadow-sm'
                            : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-white' : 'text-[#94A3B8] group-hover:text-white'
                          }`}
                        />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Tenant & Version Info */}
      <div className="border-t border-[#1E293B] p-4 text-xs opacity-70 text-[#94A3B8]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <span>THEIAKSHI HQ</span>
            <span className="font-mono text-[10px] bg-[#1E293B] px-2 py-0.5 rounded text-white">v1.0.4</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
