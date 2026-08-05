import { Request, Response } from 'express';
import { ProjectService } from '../services/projectService';
import { sendSuccess, sendError } from '../utils/response';

const service = new ProjectService();

export class ProjectController {
  async getAll(_req: Request, res: Response) {
    try {
      const projects = await service.getAllProjects();
      return sendSuccess(res, projects, 'Projects retrieved');
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const project = await service.createProject(req.body);
      return sendSuccess(res, project, 'Project created', 201);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }
}
