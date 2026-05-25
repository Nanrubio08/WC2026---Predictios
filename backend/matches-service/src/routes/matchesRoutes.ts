import { Response, Router } from 'express';
import { AuthenticatedRequest, optionalAuthenticateJwt } from '../middleware/authenticateJwt';
import { getMatchesController } from '../controllers/getMatchesController';

const router = Router();

router.get('/', optionalAuthenticateJwt, (req: AuthenticatedRequest, res: Response) => {
  getMatchesController(req, res).catch((err) => {
    console.error('getMatches error', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

export default router;
