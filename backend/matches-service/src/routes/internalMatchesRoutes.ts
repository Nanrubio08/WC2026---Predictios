import { Router } from 'express';
import { requireInternalToken } from '../middleware/requireInternalToken';
import { getMatchByIdController } from '../controllers/getMatchByIdController';
import prisma from '../prisma';


const router = Router();

router.get('/', requireInternalToken, async (_req, res) => {
  try {
    const matches = await prisma.match.findMany({ orderBy: { kickoffTime: 'asc' } });
    res.json(matches);
  } catch (err) {
    console.error('internal listMatches error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', requireInternalToken, (req, res) => {
  getMatchByIdController(req, res).catch((err) => {
    console.error('getMatchById error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
