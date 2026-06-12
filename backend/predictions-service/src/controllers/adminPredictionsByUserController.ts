import { Request, Response } from 'express';
import prisma from '../prisma';
import { getAllUsers } from '../clients/authClient';
import { getAllMatches } from '../clients/matchesClient';
import logger from '../utils/logger';

export async function adminPredictionsByUserController(_req: Request, res: Response): Promise<void> {
  const [predictions, allUsers, allMatches] = await Promise.all([
    prisma.prediction.findMany({ orderBy: { matchId: 'asc' } }),
    getAllUsers().catch((err) => { logger.error('Failed to fetch all users', { error: err }); return []; }),
    getAllMatches().catch((err) => { logger.error('Failed to fetch matches for predictions', { error: err }); return []; }),
  ]);

  const matchMap = new Map(allMatches.map((m) => [m.id, m]));

  // Group predictions by userId
  const byUser = new Map<string, typeof predictions>();
  for (const p of predictions) {
    if (!byUser.has(p.userId)) byUser.set(p.userId, []);
    byUser.get(p.userId)!.push(p);
  }

  // Build result including ALL registered users (even those with 0 predictions)
  const result = allUsers.map((u) => {
    const userPredictions = byUser.get(u.id) ?? [];
    return {
      userId: u.id,
      username: u.username,
      name: u.name,
      email: u.email,
      totalPredictions: userPredictions.length,
      predictions: userPredictions.map((p) => {
        const match = matchMap.get(p.matchId);
        return {
          id: p.id,
          matchId: p.matchId,
          homeTeam: match?.homeTeam ?? '—',
          awayTeam: match?.awayTeam ?? '—',
          homeLogoUrl: match?.homeLogoUrl ?? null,
          awayLogoUrl: match?.awayLogoUrl ?? null,
          kickoffTime: match?.kickoffTime ?? null,
          matchStatus: match?.status ?? null,
          homeScoreActual: match?.homeScoreActual ?? null,
          awayScoreActual: match?.awayScoreActual ?? null,
          homeScorePredicted: p.homeScorePredicted,
          awayScorePredicted: p.awayScorePredicted,
          pointsEarned: p.pointsEarned,
          updatedAt: p.updatedAt,
        };
      }),
    };
  });

  // Sort: users with predictions first, then alphabetically
  result.sort((a, b) => {
    if (b.totalPredictions !== a.totalPredictions) return b.totalPredictions - a.totalPredictions;
    return a.username.localeCompare(b.username);
  });

  res.json(result);
}
