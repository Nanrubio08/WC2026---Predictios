import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin';
import {
  generateCodesController,
  listCodesController,
  exportCodesController,
} from '../controllers/adminInviteCodesController';

const router = Router();

router.post('/generate', requireAdmin, (req, res) => {
  generateCodesController(req as any, res).catch((err) => {
    console.error('generateCodes error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.get('/', requireAdmin, (req, res) => {
  listCodesController(req as any, res).catch((err) => {
    console.error('listCodes error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.get('/export', requireAdmin, (req, res) => {
  exportCodesController(req as any, res).catch((err) => {
    console.error('exportCodes error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
