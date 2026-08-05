import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function validateClockIn(req: Request, res: Response, next: NextFunction) {
  const { clockIn } = req.body || {};
  if (!clockIn) {
    req.body.clockIn = new Date().toTimeString().slice(0, 5); // Default current HH:MM
  }
  next();
}

export function validateRegularization(req: Request, res: Response, next: NextFunction) {
  const { attendanceId, reason } = req.body || {};
  if (!attendanceId || !reason) {
    return sendError(res, 'Attendance ID and regularization reason are required', 400);
  }
  next();
}
