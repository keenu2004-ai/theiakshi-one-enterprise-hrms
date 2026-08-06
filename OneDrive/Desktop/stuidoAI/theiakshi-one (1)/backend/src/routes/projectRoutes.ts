import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { validateProjectCreate } from '../validators/payrollValidator';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();
const controller = new ProjectController();

router.use(authenticateJWT);

router.get('/', (req, res) => controller.getAll(req, res));
router.post('/', requireRoles('SUPER_ADMIN', 'TEAM_MANAGER'), validateProjectCreate, (req, res) => controller.create(req, res));

export default router;
