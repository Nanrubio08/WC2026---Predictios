import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin';
import { declareWinnerController, getBonusConfigController } from '../controllers/adminBonusController';

const router = Router();

router.get('/config', requireAdmin, (req, res) => {
  getBonusConfigController(req as any, res).catch((err) => {
    console.error('getBonusConfig error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.post('/winner', requireAdmin, (req, res) => {
  declareWinnerController(req as any, res).catch((err) => {
    console.error('declareWinner error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
