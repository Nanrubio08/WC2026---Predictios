import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin';
import { adminAllPredictionsController } from '../controllers/adminAllPredictionsController';

const router = Router();

router.get('/all', requireAdmin, (req, res) => {
  adminAllPredictionsController(req as any, res).catch((err) => {
    console.error('adminAllPredictions error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
