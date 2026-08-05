import { Router } from 'express';
import { ExpenseController } from '../controllers/expenseController';
import { validateExpenseClaim } from '../validators/payrollValidator';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();
const controller = new ExpenseController();

router.use(authenticateJWT);

router.get('/', (req, res) => controller.getAll(req, res));
router.get('/claims', (req, res) => controller.getAll(req, res));
router.post('/', validateExpenseClaim, (req, res) => controller.submit(req, res));
router.post('/claims', validateExpenseClaim, (req, res) => controller.submit(req, res));
router.put('/claims/:id/approve', requireRoles('SUPER_ADMIN', 'FINANCE', 'HR_MANAGER'), (req, res) => controller.approve(req, res));

export default router;
