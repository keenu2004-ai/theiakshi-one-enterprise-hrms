import { Router } from 'express';
import { BranchController } from '../controllers/branchController';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();
const controller = new BranchController();

router.use(authenticateJWT);

router.get('/', (req, res) => controller.getAll(req, res));
router.post('/', requireRoles('SUPER_ADMIN'), (req, res) => controller.create(req, res));

export default router;
