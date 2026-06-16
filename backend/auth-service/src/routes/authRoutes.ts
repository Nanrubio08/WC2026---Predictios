import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { registerController } from '../controllers/registerController';
import { loginController } from '../controllers/loginController';
import { googleAuthController } from '../controllers/googleAuthController';
import { refreshController } from '../controllers/refreshController';
import { logoutController } from '../controllers/logoutController';
import { getProfileController } from '../controllers/getProfileController';
import { updateProfileController } from '../controllers/updateProfileController';
import { changePasswordController } from '../controllers/changePasswordController';
import { uploadAvatarController } from '../controllers/uploadAvatarController';
import { forgotPasswordController } from '../controllers/forgotPasswordController';
import { resetPasswordController } from '../controllers/resetPasswordController';
import { authenticateJwt } from '../middleware/authenticateJwt';

const router = Router();

function skipIfInternal(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  return req.headers['x-internal-token'] === process.env.INTERNAL_SERVICE_TOKEN;
}

const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_WINDOW_MS ?? String(5 * 60 * 1000)),
  max: parseInt(process.env.LOGIN_RATE_MAX ?? '5'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
  skip: skipIfInternal,
});

const registerLimiter = rateLimit({
  windowMs: parseInt(process.env.REGISTER_RATE_WINDOW_MS ?? String(60 * 60 * 1000)),
  max: parseInt(process.env.REGISTER_RATE_MAX ?? '10'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts, please try again later.' },
  skip: skipIfInternal,
});

const forgotLimiter = rateLimit({
  windowMs: parseInt(process.env.FORGOT_RATE_WINDOW_MS ?? String(15 * 60 * 1000)),
  max: parseInt(process.env.FORGOT_RATE_MAX ?? '3'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
  skip: skipIfInternal,
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

router.post('/google', loginLimiter, (req, res) => {
  googleAuthController(req, res).catch((err) => {
    console.error('google auth error', err);
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

// ── Password reset (public) ────────────────────────────────────────────────
router.post('/forgot-password', forgotLimiter, (req, res) => {
  forgotPasswordController(req, res).catch((err) => {
    console.error('forgotPassword error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

const resetLimiter = rateLimit({
  windowMs: parseInt(process.env.RESET_RATE_WINDOW_MS ?? String(15 * 60 * 1000)),
  max: parseInt(process.env.RESET_RATE_MAX ?? '10'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
  skip: skipIfInternal,
});

router.post('/reset-password', resetLimiter, (req, res) => {
  resetPasswordController(req, res).catch((err) => {
    console.error('resetPassword error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
