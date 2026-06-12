import { Router } from 'express';
import { requireInternalToken } from '../middleware/requireInternalToken';
import { batchUsersController } from '../controllers/batchUsersController';
import prisma from '../prisma';

const router = Router();

router.post('/batch', requireInternalToken, (req, res) => {
  batchUsersController(req, res).catch((err) => {
    console.error('batchUsers error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.get('/all', requireInternalToken, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { isAdmin: false },
      select: { id: true, username: true, name: true, email: true, createdAt: true },
      orderBy: { username: 'asc' },
    });
    res.json(users);
  } catch (err) {
    console.error('internalAllUsers error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
