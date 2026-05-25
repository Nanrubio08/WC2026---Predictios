import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { registerController } from '../controllers/registerController';
import { loginController } from '../controllers/loginController';
import { refreshController } from '../controllers/refreshController';
import { logoutController } from '../controllers/logoutController';
import { getProfileController } from '../controllers/getProfileController';
import { updateProfileController } from '../controllers/updateProfileController';
import { changePasswordController } from '../controllers/changePasswordController';
import { uploadAvatarController } from '../controllers/uploadAvatarController';
import { authenticateJwt } from '../middleware/authenticateJwt';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again in 15 minutes' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts, please try again later' },
});

router.post('/register', registerLimiter, (req, res) => {
  registerController(req, res).catch((err) => {
    console.error('register error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.post('/login', loginLimiter, (req, res) => {
  loginController(req, res).catch((err) => {
    console.error('login error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.post('/refresh', (req, res) => {
  refreshController(req, res).catch((err) => {
    console.error('refresh error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.post('/logout', (req, res) => {
  logoutController(req, res).catch((err) => {
    console.error('logout error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

// ── Profile (authenticated) ────────────────────────────────────────────────
router.get('/profile', authenticateJwt, (req, res) => {
  getProfileController(req as any, res).catch((err) => {
    console.error('getProfile error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.put('/profile', authenticateJwt, (req, res) => {
  updateProfileController(req as any, res).catch((err) => {
    console.error('updateProfile error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.put('/profile/password', authenticateJwt, (req, res) => {
  changePasswordController(req as any, res).catch((err) => {
    console.error('changePassword error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.put('/profile/avatar', authenticateJwt, (req, res) => {
  uploadAvatarController(req as any, res).catch((err) => {
    console.error('uploadAvatar error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
