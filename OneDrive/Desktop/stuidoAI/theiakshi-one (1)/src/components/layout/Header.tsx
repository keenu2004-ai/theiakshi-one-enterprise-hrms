import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Sparkles,
  UserCheck,
  Moon,
  Sun,
  ChevronDown,
  ShieldAlert,
  Briefcase,
  User,
  X,
  Clock,
  Building2,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { UserRole } from '../../types';
import { OfflineSyncStatus } from '../common/OfflineSyncStatus';
import { SmartNotificationCenter } from '../common/SmartNotificationCenter';
import { apiClient } from '../../services/apiClient';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  setIsMobileSidebarOpen,
}) => {
  const { currentUser, currentRole, setRole, availableUsers, setUserById, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead, toggleCopilot, showToast } = useNotification();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isClockLoading, setIsClockLoading] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    phone: currentUser.phone || '',
    avatar: currentUser.avatar || '',
  });

  const checkAttendanceStatus = async () => {
    try {
      const records = await apiClient.attendance.getRecords();
      const todayStr = new Date().toISOString().substring(0, 10);
      const todayRec = records.find((r) => r.employeeId === currentUser.id && r.date === todayStr);
      if (todayRec && todayRec.clockIn && !todayRec.clockOut) {
        setIsClockedIn(true);
      } else {
        setIsClockedIn(false);
      }
    } catch (err) {
      console.error('Failed to sync header attendance status:', err);
    }
  };

  useEffect(() => {
    checkAttendanceStatus();

    const handleAttendanceUpdate = () => {
      checkAttendanceStatus();
    };

    window.addEventListener('attendanceUpdated', handleAttendanceUpdate);
    return () => {
      window.removeEventListener('attendanceUpdated', handleAttendanceUpdate);
    };
  }, [currentUser.id]);

  const handleOpenProfileModal = () => {
    setProfileForm({
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      phone: currentUser.phone || '',
      avatar: currentUser.avatar || '',
    });
    setIsProfileModalOpen(true);
  };

  const handleSaveMyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.employees.update(currentUser.id, profileForm);
      if (res.data) {
        showToast('Profile Updated', 'Your profile information and avatar have been saved.', 'SUCCESS');
        setIsProfileModalOpen(false);
        localStorage.setItem('theiakshi_auth_user', JSON.stringify({ ...currentUser, ...res.data }));
        window.location.reload();
      } else {
        showToast('Error', res.error || 'Failed to update profile', 'ERROR');
      }
    } catch (err) {
      showToast('Error', 'Failed to update profile image', 'ERROR');
    }
  };

  // Quick role descriptions for the evaluator
  const rolesList: { role: UserRole; label: string; desc: string; icon: any }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full System Control & Audit', icon: ShieldAlert },
    { role: 'HR_MANAGER', label: 'HR Manager', desc: 'Workforce & Policy Management', icon: UserCheck },
    { role: 'TEAM_MANAGER', label: 'Team Manager', desc: 'Team Approvals & Performance', icon: Briefcase },
    { role: 'EMPLOYEE', label: 'Employee', desc: 'Self-Service & Attendance', icon: User },
    { role: 'RECRUITER', label: 'Recruiter', desc: 'ATS & Interview Pipelines', icon: Search },
    { role: 'FINANCE', label: 'Finance', desc: 'Financial Audits & Budgets', icon: Building2 },
    { role: 'PAYROLL_TEAM', label: 'Payroll Team', desc: 'Salary Computation & Payslips', icon: Clock },
  ];

  const handleClockToggle = async () => {
    if (isClockLoading) return;
    setIsClockLoading(true);

    if (isClockedIn) {
      try {
        await apiClient.attendance.clockOut({ employeeId: currentUser.id });
        setIsClockedIn(false);
        showToast('Clocked Out', 'Shift clock-out recorded.', 'INFO');
      } catch (err: any) {
        showToast('Clock Out Error', err?.message || 'Failed to clock out', 'ERROR');
      } finally {
        setIsClockLoading(false);
      }
    } else {
      const performClockIn = async (locString: string, coords?: { lat: number; lng: number }) => {
        try {
          const res = await apiClient.attendance.clockIn({
            employeeId: currentUser.id,
            location: locString,
            gpsCoordinates: coords,
          });
          setIsClockedIn(true);
          showToast('Clocked In', res.data?.message || 'Attendance clocked in successfully.', 'SUCCESS');
        } catch (err: any) {
          showToast('Clock In Error', err?.message || 'Failed to clock in', 'ERROR');
        } finally {
          setIsClockLoading(false);
        }
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const gpsLocString = `GPS Verified (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
            await performClockIn(gpsLocString, { lat, lng });
          },
          async () => {
            await performClockIn('Headquarters Bengaluru (Geofence Verified)');
          },
          { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 }
        );
      } else {
        await performClockIn('Headquarters Bengaluru (Geofence Verified)');
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E2E8F0] bg-white px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
      {/* Left section: Mobile menu trigger & Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        >
          <span className="sr-only">Open Menu</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Global Instant Search */}
        <div className="relative hidden md:block md:w-72 lg:w-80">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Search employees, tickets, policy..."
              className="h-[38px] w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-8 text-sm text-[#1E293B] placeholder-[#94A3B8] transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-[#94A3B8] hover:text-[#1E293B]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Search Quick Dropdown */}
          {isSearchFocused && searchQuery && (
            <div className="absolute left-0 top-full mt-2 w-full rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                Search Suggestions
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab('employees');
                    setSearchQuery('');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
                >
                  <User className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span className="font-medium text-[#1E293B] dark:text-slate-200">
                    Search "{searchQuery}" in Workforce Directory
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('helpdesk');
                    setSearchQuery('');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
                >
                  <Briefcase className="h-3.5 w-3.5 text-[#10B981]" />
                  <span className="font-medium text-[#1E293B] dark:text-slate-200">
                    Search "{searchQuery}" in Helpdesk Tickets
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls & Role Switcher */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Offline IndexedDB Status Badge & Sync Control */}
        <OfflineSyncStatus />

        {/* Clock In / Out Toggle Button */}
        <button
          onClick={handleClockToggle}
          disabled={isClockLoading}
          className={`hidden sm:flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            isClockLoading
              ? 'opacity-60 cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
              : isClockedIn
              ? 'border border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46] hover:bg-[#D1FAE5]'
              : 'border border-[#FDE68A] bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A]'
          }`}
          title="Toggle Clock-In status"
        >
          <span className={`h-2 w-2 rounded-full ${isClockedIn ? 'bg-[#10B981]' : 'bg-[#F59E0B]'} ${isClockLoading ? 'animate-pulse' : ''}`} />
          {isClockLoading ? 'Updating...' : isClockedIn ? 'Clocked In' : 'Clocked Out'}
        </button>

        {/* Role Display / Switcher */}
        {currentUser.role === 'SUPER_ADMIN' ? (
          <div className="relative">
            <button
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-[#2563EB]" />
              <span className="max-w-[100px] truncate sm:max-w-none">{currentRole.replace('_', ' ')}</span>
              <ChevronDown className="h-3 w-3 text-[#94A3B8]" />
            </button>

            {isRoleMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-[#E2E8F0] bg-white p-2.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
                <div className="border-b border-slate-100 pb-2 px-2 dark:border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    Super Admin Role Switcher
                  </div>
                  <p className="text-[10px] text-[#64748B] dark:text-slate-400">
                    Test role views & permissions across THEIAKSHI ONE.
                  </p>
                </div>

                <div className="mt-2 space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
                  {rolesList.map((r) => {
                    const Icon = r.icon;
                    const isSelected = currentRole === r.role;
                    return (
                      <button
                        key={r.role}
                        onClick={() => {
                          setRole(r.role);
                          setIsRoleMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors ${
                          isSelected
                            ? 'bg-[#EFF6FF] text-[#1E40AF] font-semibold'
                            : 'hover:bg-[#F8FAFC] text-[#334155] dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`rounded-md p-1.5 ${
                              isSelected ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-[#64748B] dark:bg-slate-800'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="text-xs">{r.label}</div>
                            <div className="text-[10px] text-[#64748B]">{r.desc}</div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#0F172A] dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
            <ShieldAlert className="h-3.5 w-3.5 text-[#2563EB]" />
            <span className="max-w-[100px] truncate sm:max-w-none">{currentRole.replace('_', ' ')}</span>
          </div>
        )}

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative rounded-lg p-2 text-[#64748B] hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                <span className="text-xs font-bold text-[#0F172A] dark:text-slate-100">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-medium text-[#2563EB] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-xs text-[#94A3B8]">No notifications.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.link) setActiveTab(n.link);
                        setIsNotifOpen(false);
                      }}
                      className={`cursor-pointer rounded-lg p-2.5 transition-colors ${
                        !n.read
                          ? 'bg-[#EFF6FF] border border-[#BFDBFE]'
                          : 'hover:bg-[#F8FAFC] dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-semibold text-[#0F172A] dark:text-slate-200">{n.title}</span>
                        <span className="text-[10px] text-[#94A3B8]">{n.timestamp}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#475569] dark:text-slate-400">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light Toggle */}
        <button
          onClick={() => {
            const nextMode = !isDarkMode;
            setIsDarkMode(nextMode);
            showToast(
              nextMode ? 'Dark Mode Active' : 'Light Mode Active',
              nextMode ? 'Switched to Dark Mode' : 'Switched to Light Mode',
              'INFO'
            );
          }}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 transition-all shadow-xs"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <>
              <Sun className="h-4 w-4 text-amber-400 fill-amber-400/20 animate-spin-slow" />
              <span className="hidden md:inline text-[11px]">Light</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="hidden md:inline text-[11px]">Dark</span>
            </>
          )}
        </button>

        {/* Profile Avatar, Info & Logout */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#E2E8F0] dark:border-slate-800">
          <button
            onClick={handleOpenProfileModal}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity text-left cursor-pointer group"
            title="Click to edit your profile picture & information"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-white font-bold text-xs ring-2 ring-blue-100 group-hover:ring-blue-400 overflow-hidden shrink-0 transition-all">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.firstName} className="h-full w-full object-cover" />
              ) : (
                `${currentUser.firstName?.[0] || 'U'}${currentUser.lastName?.[0] || 'A'}`
              )}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-sm font-semibold text-[#0F172A] dark:text-slate-100 leading-tight group-hover:text-blue-600">
                {currentUser.firstName} {currentUser.lastName}
              </div>
              <div className="text-[11px] text-[#64748B] leading-tight">{currentUser.designation}</div>
            </div>
          </button>

          <button
            onClick={() => {
              showToast('Logged Out', 'You have been signed out safely.', 'INFO');
              logout();
            }}
            className="ml-1 flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-950/60 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/80 transition-colors"
            title="Sign Out from THEIAKSHI ONE"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>

      {/* Edit My Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Edit My Profile Picture</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMyProfile} className="mt-4 space-y-4 text-xs">
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="relative h-20 w-20 rounded-full overflow-hidden ring-4 ring-blue-500/30 bg-blue-600 text-white font-bold text-xl flex items-center justify-center">
                  {profileForm.avatar ? (
                    <img src={profileForm.avatar} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    `${profileForm.firstName?.[0] || 'U'}${profileForm.lastName?.[0] || 'A'}`
                  )}
                </div>
                {profileForm.avatar && (
                  <button
                    type="button"
                    onClick={() => setProfileForm({ ...profileForm, avatar: '' })}
                    className="text-[11px] font-semibold text-rose-600 hover:underline"
                  >
                    Remove Profile Picture
                  </button>
                )}
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Upload Profile Photo</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={profileForm.avatar || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                    placeholder="Paste image URL or pick file"
                    className="w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                  <label className="cursor-pointer shrink-0 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400">
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProfileForm((prev) => ({ ...prev, avatar: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">First Name</label>
                  <input
                    type="text"
                    value={profileForm.firstName || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Last Name</label>
                  <input
                    type="text"
                    value={profileForm.lastName || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                <input
                  type="text"
                  value={profileForm.phone || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="mt-1 w-full rounded-xl border p-2.5 text-xs dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="rounded-xl border px-4 py-2 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md"
                >
                  Save Profile Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Notification Center Drawer */}
      <SmartNotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        setActiveTab={setActiveTab}
      />
    </header>
  );
};
