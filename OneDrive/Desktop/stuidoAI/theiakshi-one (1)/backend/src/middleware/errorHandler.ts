import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Global Error Handler]', err);
  const message = err?.message || 'An internal server error occurred';
  const statusCode = err?.statusCode || 500;
  return sendError(res, message, statusCode);
}
