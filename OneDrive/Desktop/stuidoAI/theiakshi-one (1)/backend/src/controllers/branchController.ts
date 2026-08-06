import { Request, Response } from 'express';
import { BranchRepository } from '../repositories/branchRepository';
import { sendSuccess, sendError } from '../utils/response';

const repo = new BranchRepository();

export class BranchController {
  async getAll(_req: Request, res: Response) {
    try {
      const branches = await repo.findAll();
      return sendSuccess(res, branches, 'Branches retrieved');
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const branch = await repo.save(req.body);
      return sendSuccess(res, branch, 'Branch created', 201);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }
}
