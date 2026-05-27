import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin';
import { listUsersController, deleteUserController } from '../controllers/adminUsersController';

const router = Router();

router.get('/', requireAdmin, (req, res) => {
  listUsersController(req as any, res).catch((err) => {
    console.error('listUsers error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.delete('/:userId', requireAdmin, (req, res) => {
  deleteUserController(req as any, res).catch((err) => {
    console.error('deleteUser error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
