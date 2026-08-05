import { Request, Response } from 'express';
import { PushNotificationService } from '../notifications/pushNotificationService';
import { sendSuccess, sendError } from '../utils/response';

const service = new PushNotificationService();

export class NotificationController {
  async getNotifications(_req: Request, res: Response) {
    try {
      const list = await service.getNotifications();
      return sendSuccess(res, list, 'Notifications retrieved');
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  }

  async markRead(req: Request, res: Response) {
    try {
      const result = await service.markAsRead(req.params.id);
      return sendSuccess(res, result, 'Notification marked as read');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async send(req: Request, res: Response) {
    try {
      const { title, message, type } = req.body;
      const notif = await service.sendNotification(title, message, type);
      return sendSuccess(res, notif, 'Notification dispatched');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }
}
