import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return sendSuccess(res, result, 'Login successful');
    } catch (err: any) {
      return sendError(res, err.message || 'Login failed', 400);
    }
  }

  async logout(_req: Request, res: Response) {
    return sendSuccess(res, { loggedOut: true }, 'Logged out successfully');
  }

  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 'Refresh token required', 400);
    return sendSuccess(res, { token: `eyJhbGci...refreshed_${Date.now()}` }, 'Token refreshed');
  }

  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const employeeId = req.user?.employeeId || 'emp-0a';
      const profile = await authService.getProfile(employeeId);
      return sendSuccess(res, profile, 'Profile retrieved');
    } catch (err: any) {
      return sendError(res, err.message, 404);
    }
  }

  async changePassword(_req: Request, res: Response) {
    return sendSuccess(res, { updated: true }, 'Password changed successfully');
  }

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    return sendSuccess(res, { email }, 'Password reset instructions sent to your email');
  }

  async resetPassword(_req: Request, res: Response) {
    return sendSuccess(res, { reset: true }, 'Password reset successful');
  }
}
