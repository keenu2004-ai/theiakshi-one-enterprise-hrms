import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function validateEmployeeCreate(req: Request, res: Response, next: NextFunction) {
  const { firstName, lastName, email, role, department } = req.body || {};
  if (!firstName || !lastName) {
    return sendError(res, 'First name and last name are required', 400);
  }
  if (!email || !email.includes('@')) {
    return sendError(res, 'Valid email address is required', 400);
  }
  if (!role || !department) {
    return sendError(res, 'Role and department are required', 400);
  }
  next();
}
