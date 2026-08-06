export interface NotificationMessage {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  timestamp: string;
  read: boolean;
}

let mockNotifications: NotificationMessage[] = [
  {
    id: 'notif-1',
    title: 'Attendance Clock-In Verified',
    message: 'Your GPS clock-in at Headquarters Bengaluru was verified successfully.',
    type: 'SUCCESS',
    timestamp: new Date().toISOString(),
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Monthly Payroll Released',
    message: 'July 2026 payslip is available for viewing and download.',
    type: 'INFO',
    timestamp: new Date().toISOString(),
    read: false,
  },
];

export class PushNotificationService {
  async getNotifications() {
    return mockNotifications;
  }

  async markAsRead(id: string) {
    const target = mockNotifications.find((n) => n.id === id);
    if (target) target.read = true;
    return target;
  }

  async sendNotification(title: string, message: string, type: NotificationMessage['type'] = 'INFO') {
    const newNotif: NotificationMessage = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };
    mockNotifications.unshift(newNotif);
    return newNotif;
  }
}
