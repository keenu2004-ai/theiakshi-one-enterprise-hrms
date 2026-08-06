import { Router } from 'express';
import authRoutes from './authRoutes';
import employeeRoutes from './employeeRoutes';
import attendanceRoutes from './attendanceRoutes';
import leaveRoutes from './leaveRoutes';
import payrollRoutes from './payrollRoutes';
import expenseRoutes from './expenseRoutes';
import projectRoutes from './projectRoutes';
import branchRoutes from './branchRoutes';
import notificationRoutes from './notificationRoutes';
import documentRoutes from './documentRoutes';
import weeklyPlanRoutes from './weeklyPlanRoutes';
import { openApiSpec, postmanCollection } from '../config/swagger';
import { dbPool } from '../database/db';

const router = Router();

// API Documentation & Health
router.get('/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    system: 'Theiakshi-One Enterprise HRMS Core',
    database: dbPool ? 'PostgreSQL (Connected Pool)' : 'Persistent Memory Store (Online)',
    timestamp: new Date().toISOString(),
  });
});

router.get('/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

router.get('/postman.json', (_req, res) => {
  res.json(postmanCollection);
});

// Domain Routes
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/payroll', payrollRoutes);
router.use('/expenses', expenseRoutes);
router.use('/projects', projectRoutes);
router.use('/branches', branchRoutes);
router.use('/notifications', notificationRoutes);
router.use('/documents', documentRoutes);
router.use('/weekly-plans', weeklyPlanRoutes);

export default router;
