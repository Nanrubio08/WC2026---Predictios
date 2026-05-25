import { Router } from 'express';
import { requireInternalToken } from '../middleware/requireInternalToken';
import { batchUsersController } from '../controllers/batchUsersController';

const router = Router();

router.post('/batch', requireInternalToken, (req, res) => {
  batchUsersController(req, res).catch((err) => {
    console.error('batchUsers error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
