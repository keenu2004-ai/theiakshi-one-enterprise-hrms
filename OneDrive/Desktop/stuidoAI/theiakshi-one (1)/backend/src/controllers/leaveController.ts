import { Request, Response } from 'express';
import { LeaveService } from '../services/leaveService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

const service = new LeaveService();

export class LeaveController {
  async getAll(_req: AuthenticatedRequest, res: Response) {
    try {
      const leaves = await service.getAllLeaves();
      return sendSuccess(res, leaves, 'Leave applications retrieved');
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  }

  async apply(req: AuthenticatedRequest, res: Response) {
    try {
      const employeeId = req.user?.employeeId || 'emp-0a';
      const employeeName = req.user?.name || 'Vaibhav Rajput';

      const leave = await service.applyLeave({
        employeeId,
        employeeName,
        department: 'ENGINEERING',
        leaveType: req.body.leaveType,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        reason: req.body.reason,
      });

      return sendSuccess(res, leave, 'Leave applied successfully', 201);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async approve(req: AuthenticatedRequest, res: Response) {
    try {
      const approvedBy = req.user?.name || 'Manager';
      const result = await service.approveLeave(req.params.id, approvedBy);
      return sendSuccess(res, result, 'Leave request approved');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const { reason } = req.body;
      const result = await service.rejectLeave(req.params.id, reason || 'Rejected by management');
      return sendSuccess(res, result, 'Leave request rejected');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async getLedger(req: AuthenticatedRequest, res: Response) {
    try {
      const employeeId = req.params.employeeId || req.user?.employeeId || 'emp-0a';
      const ledger = await service.getLeaveLedger(employeeId);
      return sendSuccess(res, ledger, 'Leave ledger retrieved');
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  }

  async getBalanceTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      const employeeId = (req.query.employeeId as string) || req.user?.employeeId;
      const txs = await service.getLeaveBalanceTransactions(employeeId);
      return sendSuccess(res, txs, 'Leave balance transactions retrieved');
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  }
}
