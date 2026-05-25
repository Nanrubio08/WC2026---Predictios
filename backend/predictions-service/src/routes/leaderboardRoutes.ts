import { Router } from 'express';
import { getLeaderboardController } from '../controllers/getLeaderboardController';

const router = Router();

router.get('/', (req, res) => {
  getLeaderboardController(req, res).catch((err) => {
    console.error('getLeaderboard error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
