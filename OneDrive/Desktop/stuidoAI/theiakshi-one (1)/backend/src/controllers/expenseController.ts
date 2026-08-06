import { Response } from 'express';
import { ExpenseService } from '../services/expenseService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

const service = new ExpenseService();

export class ExpenseController {
  async getAll(_req: AuthenticatedRequest, res: Response) {
    try {
      const claims = await service.getAllClaims();
      return sendSuccess(res, claims, 'Expense claims retrieved');
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  }

  async submit(req: AuthenticatedRequest, res: Response) {
    try {
      const employeeId = req.user?.employeeId || 'emp-0a';
      const employeeName = req.user?.name || 'Vaibhav Rajput';

      const claim = await service.submitClaim({
        employeeId,
        employeeName,
        category: req.body.category,
        amount: req.body.amount,
        purpose: req.body.purpose,
        receiptUrl: req.body.receiptUrl,
      });

      return sendSuccess(res, claim, 'Expense claim submitted', 201);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async approve(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await service.approveClaim(req.params.id);
      return sendSuccess(res, result, 'Claim approved');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }
}
