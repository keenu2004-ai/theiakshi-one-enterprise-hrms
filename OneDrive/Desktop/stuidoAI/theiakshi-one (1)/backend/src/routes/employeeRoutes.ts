import { Router } from 'express';
import { EmployeeController } from '../controllers/employeeController';
import { validateEmployeeCreate } from '../validators/employeeValidator';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();
const controller = new EmployeeController();

router.use(authenticateJWT);

router.get('/', (req, res) => controller.getAll(req, res));
router.get('/hierarchy', (req, res) => controller.getHierarchy(req, res));
router.get('/:id', (req, res) => controller.getById(req, res));
router.post('/', requireRoles('SUPER_ADMIN', 'HR_MANAGER'), validateEmployeeCreate, (req, res) => controller.create(req, res));
router.put('/:id', requireRoles('SUPER_ADMIN', 'HR_MANAGER'), (req, res) => controller.update(req, res));
router.delete('/:id', requireRoles('SUPER_ADMIN'), (req, res) => controller.delete(req, res));

export default router;
