import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendanceService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

const service = new AttendanceService();

export class AttendanceController {
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const records = await service.getAllRecords();
      return res.json(records);
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  }

  async clockIn(req: AuthenticatedRequest, res: Response) {
    try {
      const employeeId = req.body.employeeId || req.headers['x-employee-id'] as string || req.user?.employeeId || 'emp-0a';
      const name = req.body.employeeName || req.user?.name || 'Employee';
      const clockInTime = req.body.clockIn || new Date().toTimeString().slice(0, 5);
      const location = req.body.location || 'Headquarters Bengaluru';

      const result = await service.clockIn(employeeId, name, clockInTime, location);
      return sendSuccess(res, result, 'Clocked in successfully');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async clockOut(req: AuthenticatedRequest, res: Response) {
    try {
      const employeeId = req.body.employeeId || req.headers['x-employee-id'] as string || req.user?.employeeId || 'emp-0a';
      const name = req.body.employeeName || req.user?.name || 'Employee';
      const clockOutTime = req.body.clockOut || new Date().toTimeString().slice(0, 5);
      const location = req.body.location || 'Headquarters Bengaluru';

      const result = await service.clockOut(employeeId, clockOutTime, location, name);
      return sendSuccess(res, result, 'Clocked out successfully');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async getHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const employeeId = (req.query.employeeId as string) || req.user?.employeeId;
      const history = await service.getAttendanceHistory(employeeId);
      return sendSuccess(res, history, 'Attendance history retrieved');
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  }

  async regularize(req: Request, res: Response) {
    try {
      const { attendanceId, reason } = req.body;
      const result = await service.regularizeAttendance(attendanceId, reason);
      return sendSuccess(res, result, 'Attendance regularized');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }
}
