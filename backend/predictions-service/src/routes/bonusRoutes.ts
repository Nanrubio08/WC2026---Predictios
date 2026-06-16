import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { authenticateJwt } from '../middleware/authenticateJwt';
import { submitBonusAnswerController, getMyBonusAnswerController } from '../controllers/bonusController';

const router = Router();

function skipIfPrivileged(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  if (req.headers['x-internal-token'] === process.env.INTERNAL_SERVICE_TOKEN) return true;
  try {
    const auth = req.headers.authorization;
    if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) return false;
    const token = auth.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { role?: string };
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

const bonusLimiter = rateLimit({
  windowMs: parseInt(process.env.BONUS_RATE_WINDOW_MS ?? String(60 * 1000)),
  max: parseInt(process.env.BONUS_RATE_MAX ?? '5'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Por favor espera.' },
  skip: skipIfPrivileged,
});

router.get('/answer', authenticateJwt, (req, res) => {
  getMyBonusAnswerController(req as any, res).catch((err) => {
    console.error('getMyBonusAnswer error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.post('/answer', bonusLimiter, authenticateJwt, (req, res) => {
  submitBonusAnswerController(req as any, res).catch((err) => {
    console.error('submitBonusAnswer error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
