import { Router } from 'express';
import { authenticateJwt } from '../middleware/authenticateJwt';
import { getMyPredictionsController } from '../controllers/getMyPredictionsController';
import { getUserPublicPredictionsController } from '../controllers/getUserPublicPredictionsController';

const router = Router();

router.get('/my', authenticateJwt, (req, res) => {
  getMyPredictionsController(req as any, res).catch((err) => {
    console.error('getMyPredictions error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

// Any authenticated user can view another user's finished-match predictions
router.get('/user/:userId', authenticateJwt, (req, res) => {
  getUserPublicPredictionsController(req, res).catch((err) => {
    console.error('getUserPublicPredictions error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export { router as myPredictionsRouter };
