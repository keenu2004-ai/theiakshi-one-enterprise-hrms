import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Breadcrumbs } from './components/layout/Breadcrumbs';
import { ToastContainer } from './components/layout/ToastContainer';
import { LoginScreen } from './components/auth/LoginScreen';

import { DashboardView } from './components/modules/DashboardView';
import { EmployeeModule } from './components/modules/EmployeeModule';
import { OrgModule } from './components/modules/OrgModule';
import { AttendanceModule } from './components/modules/AttendanceModule';
import { LeaveModule } from './components/modules/LeaveModule';
import { PayrollModule } from './components/modules/PayrollModule';
import { ExpensesModule } from './components/modules/ExpensesModule';
import { RecruitmentModule } from './components/modules/RecruitmentModule';
import { PerformanceModule } from './components/modules/PerformanceModule';
import { HelpdeskModule } from './components/modules/HelpdeskModule';
import { AssetModule } from './components/modules/AssetModule';
import { ProjectsModule } from './components/modules/ProjectsModule';
import { AuditLogsModule } from './components/modules/AuditLogsModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { MyFolderModule } from './components/modules/MyFolderModule';
import { BranchModule } from './components/modules/BranchModule';

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theiakshi_theme');
    if (saved) {
      return saved === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('theiakshi_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('theiakshi_theme', 'light');
    }
  }, [isDarkMode]);

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <ToastContainer />
      </>
    );
  }

  const renderModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView setActiveTab={setActiveTab} />;
      case 'employees':
        return <EmployeeModule />;
      case 'branches':
        return <BranchModule />;
      case 'my_folder':
        return <MyFolderModule />;
      case 'organization':
        return <OrgModule />;
      case 'attendance':
        return <AttendanceModule />;
      case 'leave':
        return <LeaveModule />;
      case 'payroll':
        return <PayrollModule />;
      case 'expenses':
        return <ExpensesModule />;
      case 'recruitment':
        return <RecruitmentModule />;
      case 'performance':
        return <PerformanceModule />;
      case 'helpdesk':
        return <HelpdeskModule />;
      case 'assets':
        return <AssetModule />;
      case 'timesheets':
        return <ProjectsModule />;
      case 'audit':
        return <AuditLogsModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <DashboardView setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className={`min-h-screen flex w-full bg-slate-100/60 font-sans text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200`}>
      {/* Collapsible Responsive Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />

        {/* Breadcrumb Trail & Quick Actions Bar */}
        <Breadcrumbs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic View Canvas */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pb-10">
          {renderModule()}
        </main>

        {/* Floating Toast Alerts */}
        <ToastContainer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainLayout />
      </NotificationProvider>
    </AuthProvider>
  );
}
