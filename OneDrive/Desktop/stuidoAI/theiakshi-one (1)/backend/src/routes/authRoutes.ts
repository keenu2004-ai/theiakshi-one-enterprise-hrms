import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateLogin, validateChangePassword } from '../validators/authValidator';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
const controller = new AuthController();

router.post('/login', validateLogin, (req, res) => controller.login(req, res));
router.post('/logout', (req, res) => controller.logout(req, res));
router.post('/refresh', (req, res) => controller.refreshToken(req, res));
router.get('/profile', authenticateJWT, (req, res) => controller.getProfile(req, res));
router.post('/change-password', authenticateJWT, validateChangePassword, (req, res) => controller.changePassword(req, res));
router.post('/forgot-password', (req, res) => controller.forgotPassword(req, res));
router.post('/reset-password', (req, res) => controller.resetPassword(req, res));

export default router;
