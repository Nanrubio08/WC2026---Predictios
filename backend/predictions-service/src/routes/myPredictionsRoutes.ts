import { Router } from 'express';
import { authenticateJwt } from '../middleware/authenticateJwt';
import { getMyPredictionsController } from '../controllers/getMyPredictionsController';

const router = Router();

router.get('/my', authenticateJwt, (req, res) => {
  getMyPredictionsController(req as any, res).catch((err) => {
    console.error('getMyPredictions error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export { router as myPredictionsRouter };
