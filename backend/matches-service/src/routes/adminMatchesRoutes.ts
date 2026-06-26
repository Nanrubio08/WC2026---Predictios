import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin';
import { updateMatchScoreController } from '../controllers/updateMatchScoreController';
import { finalizeMatchController } from '../controllers/finalizeMatchController';
import { listMatchesAdminController } from '../controllers/listMatchesAdminController';
import { listAuditLogsController } from '../controllers/listAuditLogsController';
import { syncFixtures } from '../services/syncFixtures';
import prisma from '../prisma';

const router = Router();

router.get('/', requireAdmin, (req, res) => {
  listMatchesAdminController(req, res).catch((err) => {
    console.error('listMatchesAdmin error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.post('/:id/score', requireAdmin, (req, res) => {
  updateMatchScoreController(req as any, res).catch((err) => {
    console.error('updateMatchScore error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.post('/:id/finalize', requireAdmin, (req, res) => {
  finalizeMatchController(req as any, res).catch((err) => {
    console.error('finalizeMatch error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.post('/sync', requireAdmin, async (req: any, res) => {
  try {
    const result = await syncFixtures();
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: req.adminUserId ?? 'unknown',
        service: 'matches',
        action: 'SYNC_FIXTURES',
        detail: JSON.stringify({ upserted: result.upserted }),
      },
    });
    res.json({ message: 'Sync complete', upserted: result.upserted });
  } catch (err) {
    console.error('[syncFixtures] Manual trigger error:', err);
    res.status(500).json({ error: 'Sync failed', detail: String(err) });
  }
});

router.get('/audit', requireAdmin, (req, res) => {
  listAuditLogsController(req, res).catch((err) => {
    console.error('listAuditLogs error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
