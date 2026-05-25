import { Router } from 'express';
import { requireInternalToken } from '../middleware/requireInternalToken';
import { getMatchByIdController } from '../controllers/getMatchByIdController';

const router = Router();

router.get('/:id', requireInternalToken, (req, res) => {
  getMatchByIdController(req, res).catch((err) => {
    console.error('getMatchById error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
