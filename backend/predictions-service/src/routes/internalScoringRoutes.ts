import { Router } from 'express';
import { requireInternalToken } from '../middleware/requireInternalToken';
import { scoringController } from '../controllers/scoringController';

const router = Router();

router.post('/:matchId', requireInternalToken, (req, res) => {
  scoringController(req, res).catch((err) => {
    console.error('scoring error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
