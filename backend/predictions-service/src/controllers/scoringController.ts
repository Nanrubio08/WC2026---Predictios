import { Request, Response } from 'express';
import axios from 'axios';
import { scoreMatchPredictions } from '../services/scoreMatchPredictions';

const MATCHES_URL = process.env.MATCHES_SERVICE_URL ?? 'http://localhost:3002';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN ?? '';

export async function scoringController(req: Request, res: Response): Promise<void> {
  const matchId = parseInt(req.params.matchId, 10);
  if (isNaN(matchId)) {
    res.status(400).json({ error: 'Invalid matchId' });
    return;
  }

  let homeScoreActual: number;
  let awayScoreActual: number;

  try {
    const matchRes = await axios.get(`${MATCHES_URL}/internal/matches/${matchId}`, {
      headers: { 'x-internal-token': INTERNAL_TOKEN },
      timeout: 5000,
    });
    const match = matchRes.data as { homeScoreActual: number | null; awayScoreActual: number | null };

    if (match.homeScoreActual === null || match.awayScoreActual === null) {
      res.status(422).json({ error: 'Match does not have final scores yet' });
      return;
    }

    homeScoreActual = match.homeScoreActual;
    awayScoreActual = match.awayScoreActual;
  } catch {
    res.status(503).json({ error: 'Could not fetch match data from matches-service' });
    return;
  }

  try {
    const result = await scoreMatchPredictions(matchId, homeScoreActual, awayScoreActual);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error(`[scoringController] DB error scoring match ${matchId}:`, err);
    res.status(500).json({ error: 'Scoring failed due to internal error' });
  }
}
