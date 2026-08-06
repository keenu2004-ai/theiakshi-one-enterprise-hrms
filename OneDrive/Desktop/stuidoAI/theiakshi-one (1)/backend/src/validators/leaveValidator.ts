import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function validateLeaveApplication(req: Request, res: Response, next: NextFunction) {
  const { leaveType, startDate, endDate, reason } = req.body || {};
  if (!leaveType || !startDate || !endDate || !reason) {
    return sendError(res, 'Leave type, start date, end date, and reason are required', 400);
  }
  next();
}
