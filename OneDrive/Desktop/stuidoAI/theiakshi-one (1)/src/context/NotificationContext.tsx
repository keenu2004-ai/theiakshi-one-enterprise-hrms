import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationItem, Announcement } from '../types';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';
}

interface NotificationContextType {
  notifications: NotificationItem[];
  announcements: Announcement[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  toasts: Toast[];
  showToast: (title: string, message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  isCopilotOpen: boolean;
  toggleCopilot: () => void;
  copilotInitialPrompt: string;
  openCopilotWithPrompt: (prompt: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotInitialPrompt, setCopilotInitialPrompt] = useState('');

  useEffect(() => {
    fetch('/api/v1/notifications')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch((e) => console.error('Error fetching notifications:', e));

    fetch('/api/v1/announcements')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAnnouncements(data);
      })
      .catch((e) => console.error('Error fetching announcements:', e));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const showToast = (title: string, message: string, type: Toast['type'] = 'SUCCESS') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleCopilot = () => setIsCopilotOpen((prev) => !prev);

  const openCopilotWithPrompt = (prompt: string) => {
    setCopilotInitialPrompt(prompt);
    setIsCopilotOpen(true);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        announcements,
        unreadCount,
        markAsRead,
        markAllAsRead,
        toasts,
        showToast,
        removeToast,
        isCopilotOpen,
        toggleCopilot,
        copilotInitialPrompt,
        openCopilotWithPrompt,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
