import { Router } from 'express';
import { provisionUserController } from '../controllers/provisionUserController';
import { deleteUserDataController } from '../controllers/deleteUserDataController';
import { requireInternalToken } from '../middleware/requireInternalToken';

const router = Router();

router.post('/', requireInternalToken, (req, res) => {
  provisionUserController(req, res).catch((err) => {
    console.error('provisionUser error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.delete('/:userId', requireInternalToken, (req, res) => {
  deleteUserDataController(req, res).catch((err) => {
    console.error('deleteUserData error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
