import { Router } from 'express';
import { requireInternalToken } from '../middleware/requireInternalToken';
import { internalAuditController } from '../controllers/internalAuditController';

const router = Router();

router.post('/', requireInternalToken, (req, res) => {
  internalAuditController(req, res).catch((err) => {
    console.error('internalAudit error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
