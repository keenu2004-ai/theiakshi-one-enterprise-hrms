import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return sendError(res, 'A valid email address is required', 400);
  }
  if (!password || typeof password !== 'string' || password.length < 3) {
    return sendError(res, 'Password must be at least 3 characters long', 400);
  }
  next();
}

export function validateChangePassword(req: Request, res: Response, next: NextFunction) {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return sendError(res, 'New password must be at least 6 characters long', 400);
  }
  next();
}
