import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin';
import { adminAllPredictionsController } from '../controllers/adminAllPredictionsController';
import { adminPredictionsByUserController } from '../controllers/adminPredictionsByUserController';

const router = Router();

router.get('/all', requireAdmin, (req, res) => {
  adminAllPredictionsController(req as any, res).catch((err) => {
    console.error('adminAllPredictions error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.get('/by-user', requireAdmin, (req, res) => {
  adminPredictionsByUserController(req, res).catch((err) => {
    console.error('adminPredictionsByUser error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
