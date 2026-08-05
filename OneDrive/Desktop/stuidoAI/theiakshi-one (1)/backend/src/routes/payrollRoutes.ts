import { Router } from 'express';
import { PayrollController } from '../controllers/payrollController';
import { validatePayrollGenerate } from '../validators/payrollValidator';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();
const controller = new PayrollController();

router.use(authenticateJWT);

router.get('/', (req, res) => controller.getAllPayslips(req, res));
router.get('/payslips', (req, res) => controller.getAllPayslips(req, res));
router.post('/generate', requireRoles('SUPER_ADMIN', 'FINANCE', 'HR_MANAGER'), validatePayrollGenerate, (req, res) => controller.generatePayroll(req, res));

export default router;
