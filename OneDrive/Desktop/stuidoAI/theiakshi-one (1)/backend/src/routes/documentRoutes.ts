import { Router } from 'express';
import { DocumentController } from '../controllers/documentController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
const controller = new DocumentController();

router.use(authenticateJWT);

router.get('/wallet/:employeeId?', (req, res) => controller.getWallet(req, res));

export default router;
