import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { authenticateJwt } from '../middleware/authenticateJwt';
import { predictionLock } from '../middleware/predictionLock';
import { submitPredictionController } from '../controllers/submitPredictionController';

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

const predictionsLimiter = rateLimit({
  windowMs: parseInt(process.env.PREDICTIONS_RATE_WINDOW_MS ?? String(15 * 60 * 1000)),
  max: parseInt(process.env.PREDICTIONS_RATE_MAX ?? '20'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Por favor espera antes de volver a intentar.' },
  skip: skipIfPrivileged,
});

router.post(
  '/',
  predictionsLimiter,
  authenticateJwt,
  (req, res, next) => {
    predictionLock(req as any, res, next).catch(next);
  },
  (req, res) => {
    submitPredictionController(req as any, res).catch((err) => {
      console.error('submitPrediction error', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }
);

export default router;
