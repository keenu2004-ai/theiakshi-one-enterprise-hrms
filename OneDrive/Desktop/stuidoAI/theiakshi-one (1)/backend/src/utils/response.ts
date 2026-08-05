import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  pagination?: ApiResponse['pagination']
) {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
    pagination,
  };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  error: string,
  statusCode = 400,
  details?: any
) {
  const body: ApiResponse = {
    success: false,
    error,
    ...(details ? { data: details } : {}),
  };
  return res.status(statusCode).json(body);
}
