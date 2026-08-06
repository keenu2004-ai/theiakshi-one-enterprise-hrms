import { Request, Response } from 'express';
import {
  payrollService,
  expenseService,
  projectService,
  dashboardService,
  miscService,
} from '../services/miscServices.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class PayrollController {
  async getAllPayrolls(req: Request, res: Response) {
    try {
      const month = req.query.month as string;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;

      const data = await payrollService.getAllPayrolls(month, year, empId);
      return res.json(sendSuccess(data, 'Payroll records retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getPayslip(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await payrollService.getPayslipDetails(id);
      return res.json(sendSuccess(data, 'Payslip details retrieved'));
    } catch (error: any) {
      return res.status(404).json(sendError(error.message));
    }
  }

  async generatePayroll(req: Request, res: Response) {
    try {
      const { employee_id, month, year, basic_salary } = req.body;
      const data = await payrollService.generatePayroll(employee_id, month, year, basic_salary);
      return res.status(201).json(sendSuccess(data, 'Payroll generated successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }
}

export class ExpenseController {
  async getAll(req: Request, res: Response) {
    try {
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;
      const status = req.query.status as string;
      const data = await expenseService.getAllExpenses(empId, status);
      return res.json(sendSuccess(data, 'Expense claims retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async submit(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.employee_id;
      const data = await expenseService.submitExpense({ ...req.body, employee_id: userId });
      return res.status(201).json(sendSuccess(data, 'Expense claim submitted'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const approverId = (req as any).user?.id || 1;
      const { status } = req.body;
      const data = await expenseService.approveExpense(id, status, approverId);
      return res.json(sendSuccess(data, `Expense claim ${status.toLowerCase()}`));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }
}

export class ProjectController {
  async getAll(req: Request, res: Response) {
    try {
      const data = await projectService.getAllProjects();
      return res.json(sendSuccess(data, 'Projects list retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getDetails(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await projectService.getProjectDetails(id);
      return res.json(sendSuccess(data, 'Project details retrieved'));
    } catch (error: any) {
      return res.status(404).json(sendError(error.message));
    }
  }

  async createProject(req: Request, res: Response) {
    try {
      const data = await projectService.createProject(req.body);
      return res.status(201).json(sendSuccess(data, 'Project created successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async createTask(req: Request, res: Response) {
    try {
      const data = await projectService.createTask(req.body);
      return res.status(201).json(sendSuccess(data, 'Task created successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async updateTaskStatus(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const { status } = req.body;
      const data = await projectService.updateTaskStatus(taskId, status);
      return res.json(sendSuccess(data, 'Task status updated'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }
}

export class DashboardController {
  async getMetrics(req: Request, res: Response) {
    try {
      const data = await dashboardService.getMetrics();
      return res.json(sendSuccess(data, 'Metrics retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getActivity(req: Request, res: Response) {
    try {
      const data = await dashboardService.getActivity();
      return res.json(sendSuccess(data, 'Recent activity retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getDepartments(req: Request, res: Response) {
    try {
      const data = await dashboardService.getDepartmentDistribution();
      return res.json(sendSuccess(data, 'Department distribution retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getPayrollSummary(req: Request, res: Response) {
    try {
      const data = await dashboardService.getPayrollSummary();
      return res.json(sendSuccess(data, 'Payroll summary retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getAnnouncements(req: Request, res: Response) {
    try {
      const data = await dashboardService.getAnnouncements();
      return res.json(sendSuccess(data, 'Announcements retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getCelebrations(req: Request, res: Response) {
    try {
      const data = await dashboardService.getCelebrations();
      return res.json(sendSuccess(data, 'Celebrations retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getMorningBrief(req: Request, res: Response) {
    try {
      const data = await dashboardService.getMorningBrief();
      return res.json(sendSuccess(data, 'Morning executive brief generated'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getAIInsights(req: Request, res: Response) {
    try {
      const query = req.body.query || req.query.query as string;
      const data = await dashboardService.getAIInsights(query);
      return res.json(sendSuccess(data, 'AI insights generated'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }
}

export const payrollController = new PayrollController();
export const expenseController = new ExpenseController();
export const projectController = new ProjectController();
export const dashboardController = new DashboardController();
