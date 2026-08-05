import { Request, Response } from 'express';
import { EmployeeService } from '../services/employeeService';
import { sendSuccess, sendError } from '../utils/response';

const employeeService = new EmployeeService();

export class EmployeeController {
  async getAll(req: Request, res: Response) {
    try {
      const search = req.query.search as string;
      const department = req.query.department as string;
      const employees = await employeeService.getAllEmployees(search, department);
      return sendSuccess(res, employees, 'Employees retrieved');
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const emp = await employeeService.getEmployeeById(req.params.id);
      return sendSuccess(res, emp, 'Employee retrieved');
    } catch (err: any) {
      return sendError(res, err.message, 404);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const newEmp = await employeeService.createEmployee(req.body);
      return sendSuccess(res, newEmp, 'Employee created', 201);
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const updated = await employeeService.updateEmployee(req.params.id, req.body);
      return sendSuccess(res, updated, 'Employee updated');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await employeeService.deleteEmployee(req.params.id);
      return sendSuccess(res, { deleted: true }, 'Employee deleted');
    } catch (err: any) {
      return sendError(res, err.message, 400);
    }
  }

  async getHierarchy(_req: Request, res: Response) {
    try {
      const hierarchy = await employeeService.getReportingHierarchy();
      return sendSuccess(res, hierarchy, 'Hierarchy retrieved');
    } catch (err: any) {
      return sendError(res, err.message, 500);
    }
  }
}
