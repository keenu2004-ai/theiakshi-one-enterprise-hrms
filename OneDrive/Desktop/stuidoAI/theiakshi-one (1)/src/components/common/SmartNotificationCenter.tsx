import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Clock,
  CalendarDays,
  FolderGit2,
  Receipt,
  FileText,
  PartyPopper,
  GraduationCap,
  Users2,
  ShieldAlert,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { NotificationItem } from '../../types';

interface SmartNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
}

export const SmartNotificationCenter: React.FC<SmartNotificationCenterProps> = ({
  isOpen,
  onClose,
  setActiveTab,
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const categories = [
    { id: 'ALL', label: 'All Notifications' },
    { id: 'ATTENDANCE', label: 'Attendance' },
    { id: 'LEAVE', label: 'Leave & Off' },
    { id: 'PROJECTS', label: 'Projects & Tasks' },
    { id: 'EXPENSE', label: 'Expenses' },
    { id: 'DOCUMENTS', label: 'Documents' },
    { id: 'CELEBRATIONS', label: 'Celebrations' },
    { id: 'SYSTEM', label: 'System' },
  ];

  const filteredNotifs = notifications.filter((n) => {
    if (selectedCategory === 'ALL') return true;
    return n.category === selectedCategory;
  });

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'ATTENDANCE':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'LEAVE':
        return <CalendarDays className="w-4 h-4 text-blue-500" />;
      case 'PROJECTS':
        return <FolderGit2 className="w-4 h-4 text-emerald-500" />;
      case 'EXPENSE':
        return <Receipt className="w-4 h-4 text-purple-500" />;
      case 'DOCUMENTS':
        return <FileText className="w-4 h-4 text-teal-500" />;
      case 'CELEBRATIONS':
        return <PartyPopper className="w-4 h-4 text-pink-500" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-indigo-500" />;
    }
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    markAsRead(notif.id);
    if (notif.link) {
      setActiveTab(notif.link);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                  Notification Center
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-blue-600 text-white">
                      {unreadCount} New
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Real-time automated employee & workflow alerts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 overflow-x-auto no-scrollbar flex items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 text-[11px] font-semibold whitespace-nowrap rounded-lg transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No notifications in this category
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All employee attendance, leave, and system alerts will appear here.
              </p>
            </div>
          ) : (
            filteredNotifs.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                  !notif.read
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 shadow-sm'
                    : 'bg-white dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {!notif.read && (
                  <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                )}

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {notif.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {notif.timestamp}
                      </span>
                      {notif.link && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 group-hover:underline">
                          View Module <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
          <p className="text-[11px] text-slate-500">
            THEIAKSHI ONE Smart Notification Dispatch Engine
          </p>
        </div>
      </div>
    </div>
  );
};
