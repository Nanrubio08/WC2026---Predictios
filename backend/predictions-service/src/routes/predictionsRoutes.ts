import { Router } from 'express';
import { authenticateJwt } from '../middleware/authenticateJwt';
import { predictionLock } from '../middleware/predictionLock';
import { submitPredictionController } from '../controllers/submitPredictionController';

const router = Router();

router.post(
  '/',
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
