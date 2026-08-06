import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();
const controller = new NotificationController();

router.use(authenticateJWT);

router.get('/', (req, res) => controller.getNotifications(req, res));
router.put('/:id/read', (req, res) => controller.markRead(req, res));
router.post('/send', requireRoles('SUPER_ADMIN', 'HR_MANAGER'), (req, res) => controller.send(req, res));

export default router;
