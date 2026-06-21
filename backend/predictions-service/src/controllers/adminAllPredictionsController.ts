import { Request, Response } from 'express';
import prisma from '../prisma';
import { getUsersByIds } from '../clients/authClient';
import logger from '../utils/logger';

export async function adminAllPredictionsController(_req: Request, res: Response): Promise<void> {
  const predictions = await prisma.prediction.findMany({
    orderBy: [{ userId: 'asc' }, { matchId: 'asc' }],
  });

  logger.info('adminAllPredictions: fetched predictions', { count: predictions.length });

  // Enrich with usernames
  const uniqueIds = [...new Set(predictions.map((p) => p.userId))];
  let userMap = new Map<string, { id: string; username: string; name: string | null }>();
  try {
    const users = await getUsersByIds(uniqueIds);
    userMap = new Map(users.map((u) => [u.id, u]));
  } catch (err) {
    logger.error('adminAllPredictions: failed to fetch user info', { error: err });
  }

  const enriched = predictions.map((p) => ({
    id:                  p.id,
    userId:              p.userId,
    username:            userMap.get(p.userId)?.username ?? p.userId.slice(0, 8),
    name:                userMap.get(p.userId)?.name     ?? null,
    matchId:             p.matchId,
    homeScorePredicted:  p.homeScorePredicted,
    awayScorePredicted:  p.awayScorePredicted,
    pointsEarned:        p.pointsEarned,
    updatedAt:           p.updatedAt,
  }));

  res.json(enriched);
}
