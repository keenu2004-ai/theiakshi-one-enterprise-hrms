import { Router, Request, Response } from 'express';
import { LeaveController } from '../controllers/leaveController';
import { validateLeaveApplication } from '../validators/leaveValidator';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();
const controller = new LeaveController();

router.use(authenticateJWT as any);

router.get('/', (req: Request, res: Response) => controller.getAll(req as any, res));
router.post('/', validateLeaveApplication, (req: Request, res: Response) => controller.apply(req as any, res));
router.post('/apply', validateLeaveApplication, (req: Request, res: Response) => controller.apply(req as any, res));
router.put('/:id/approve', requireRoles('SUPER_ADMIN', 'HR_MANAGER', 'TEAM_MANAGER'), (req: Request, res: Response) => controller.approve(req as any, res));
router.put('/:id/reject', requireRoles('SUPER_ADMIN', 'HR_MANAGER', 'TEAM_MANAGER'), (req: Request, res: Response) => controller.reject(req, res));
router.get('/ledger/:employeeId', (req: Request, res: Response) => controller.getLedger(req as any, res));
router.get('/balance-transactions', (req: Request, res: Response) => controller.getBalanceTransactions(req as any, res));

export default router;
