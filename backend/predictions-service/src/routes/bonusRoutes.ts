import { Router } from 'express';
import { authenticateJwt } from '../middleware/authenticateJwt';
import { submitBonusAnswerController, getMyBonusAnswerController } from '../controllers/bonusController';

const router = Router();

router.get('/answer', authenticateJwt, (req, res) => {
  getMyBonusAnswerController(req as any, res).catch((err) => {
    console.error('getMyBonusAnswer error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

router.post('/answer', authenticateJwt, (req, res) => {
  submitBonusAnswerController(req as any, res).catch((err) => {
    console.error('submitBonusAnswer error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
