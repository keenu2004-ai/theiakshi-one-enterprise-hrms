import { Request, Response } from 'express';
import { PayrollService } from '../services/payrollService';
import { sendSuccess, sendError } from '../utils/response';

const service = new PayrollService();

export class PayrollController {
  async getAllPayslips(_req: Request, res: Response) {
    try {
      const slips = await service.getAllPayslips();
      return sendSuccess(res, slips, 'Payslips retrieved');
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  }

  async generatePayroll(req: Request, res: Response) {
    try {
      const { payPeriod } = req.body;
      const slips = await service.generateMonthlyPayroll(payPeriod || 'July 2026');
      return sendSuccess(res, slips, 'Payroll generated and approved');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }
}
