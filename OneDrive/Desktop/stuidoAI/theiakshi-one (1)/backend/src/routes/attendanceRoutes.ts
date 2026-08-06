import { Router, Request, Response } from 'express';
import { AttendanceController } from '../controllers/attendanceController';
import { validateClockIn, validateRegularization } from '../validators/attendanceValidator';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
const controller = new AttendanceController();

router.use(authenticateJWT as any);

router.get('/', (req: Request, res: Response) => controller.getAll(req as any, res));
router.post('/clock-in', validateClockIn, (req: Request, res: Response) => controller.clockIn(req as any, res));
router.post('/clock-out', (req: Request, res: Response) => controller.clockOut(req as any, res));
router.get('/history', (req: Request, res: Response) => controller.getHistory(req as any, res));
router.post('/regularize', validateRegularization, (req: Request, res: Response) => controller.regularize(req, res));

export default router;
