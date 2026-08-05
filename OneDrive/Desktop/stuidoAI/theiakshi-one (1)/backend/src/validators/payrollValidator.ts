import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function validatePayrollGenerate(req: Request, res: Response, next: NextFunction) {
  const { payPeriod } = req.body || {};
  if (!payPeriod) {
    req.body.payPeriod = `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`;
  }
  next();
}

export function validateExpenseClaim(req: Request, res: Response, next: NextFunction) {
  const { category, amount, purpose } = req.body || {};
  if (!category || !amount || amount <= 0 || !purpose) {
    return sendError(res, 'Valid expense category, positive amount, and purpose are required', 400);
  }
  next();
}

export function validateProjectCreate(req: Request, res: Response, next: NextFunction) {
  const { name, client } = req.body || {};
  if (!name || !client) {
    return sendError(res, 'Project name and client are required', 400);
  }
  next();
}
