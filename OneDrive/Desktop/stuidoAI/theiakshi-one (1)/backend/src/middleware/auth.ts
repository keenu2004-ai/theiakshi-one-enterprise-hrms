import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { UserRole } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    employeeId: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Default system session for local dev preview
    req.user = {
      id: 'emp-0a',
      employeeId: 'emp-0a',
      email: 'vaibhav.rajput@theiakshi.com',
      role: 'SUPER_ADMIN',
      name: 'Vaibhav Rajput',
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return sendError(res, 'Authentication token missing', 401);
  }

  try {
    // Basic JWT decode or mockup decoding
    const decoded: any = JSON.parse(
      Buffer.from(token.split('.')[1] || '', 'base64').toString('ascii') || '{}'
    );

    req.user = {
      id: decoded.id || 'emp-0a',
      employeeId: decoded.employeeId || 'emp-0a',
      email: decoded.email || 'vaibhav.rajput@theiakshi.com',
      role: decoded.role || 'SUPER_ADMIN',
      name: decoded.name || 'Vaibhav Rajput',
    };
    next();
  } catch (err) {
    req.user = {
      id: 'emp-0a',
      employeeId: 'emp-0a',
      email: 'vaibhav.rajput@theiakshi.com',
      role: 'SUPER_ADMIN',
      name: 'Vaibhav Rajput',
    };
    next();
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized access', 401);
    }
    if (req.user.role === 'SUPER_ADMIN') {
      return next(); // Super Admin bypasses role limits
    }
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Forbidden: Role '${req.user.role}' lacks permission for this resource. Required: ${roles.join(', ')}`,
        403
      );
    }
    next();
  };
}
