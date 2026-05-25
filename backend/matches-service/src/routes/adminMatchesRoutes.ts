import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin';
import { updateMatchScoreController } from '../controllers/updateMatchScoreController';
import { syncFixtures } from '../services/syncFixtures';

const router = Router();

router.post('/:id/score', requireAdmin, (req, res) => {
  updateMatchScoreController(req, res).catch((err) => {
    console.error('updateMatchScore error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.post('/sync', requireAdmin, async (_req, res) => {
  try {
    const result = await syncFixtures();
    res.json({ message: 'Sync complete', upserted: result.upserted });
  } catch (err) {
    console.error('[syncFixtures] Manual trigger error:', err);
    res.status(500).json({ error: 'Sync failed', detail: String(err) });
  }
});

export default router;
