import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticateJwt';
import { getMatch } from '../clients/matchesClient';

const LOCK_MINUTES = 10;

export async function predictionLock(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const rawMatchId = (req.body as { matchId?: unknown }).matchId;
  const matchId = typeof rawMatchId === 'number' ? rawMatchId : parseInt(String(rawMatchId ?? ''), 10);

  if (!matchId || isNaN(matchId) || matchId <= 0) {
    res.status(400).json({ error: 'matchId must be a positive integer' });
    return;
  }

  let match;
  try {
    match = await getMatch(matchId);
  } catch {
    res.status(404).json({ error: 'Match not found or matches-service unavailable' });
    return;
  }

  if (match.status === 'finished') {
    res.status(403).json({ error: 'Match has already finished' });
    return;
  }

  const kickoff = new Date(match.kickoffTime).getTime();
  const lockDeadline = kickoff - LOCK_MINUTES * 60 * 1000;

  if (Date.now() >= lockDeadline) {
    res.status(403).json({ error: 'Prediction window is closed (10-minute lock enforced)' });
    return;
  }

  next();
}
