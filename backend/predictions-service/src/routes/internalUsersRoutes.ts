import { Router } from 'express';
import { provisionUserController } from '../controllers/provisionUserController';
import { requireInternalToken } from '../middleware/requireInternalToken';

const router = Router();

router.post('/', requireInternalToken, (req, res) => {
  provisionUserController(req, res).catch((err) => {
    console.error('provisionUser error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
