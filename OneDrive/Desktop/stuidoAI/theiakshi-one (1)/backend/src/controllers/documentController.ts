import { Response } from 'express';
import { DocumentService } from '../services/documentService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

const service = new DocumentService();

export class DocumentController {
  async getWallet(req: AuthenticatedRequest, res: Response) {
    try {
      const employeeId = req.params.employeeId || req.user?.employeeId || 'emp-0a';
      const folder = await service.getEmployeeFolder(employeeId);
      const files = await service.listFiles(employeeId);
      return sendSuccess(res, { folder, files }, 'Document wallet retrieved');
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  }
}
