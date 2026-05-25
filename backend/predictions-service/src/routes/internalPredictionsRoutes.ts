import { Router } from 'express';
import { requireInternalToken } from '../middleware/requireInternalToken';
import { getUserPredictionsController } from '../controllers/getUserPredictionsController';

const router = Router();

router.get('/summary', requireInternalToken, (req, res) => {
  getUserPredictionsController(req, res).catch((err) => {
    console.error('getUserPredictions error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
