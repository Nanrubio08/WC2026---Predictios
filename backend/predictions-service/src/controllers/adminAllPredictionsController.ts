import { Request, Response } from 'express';
import prisma from '../prisma';
import { getUsersByIds } from '../clients/authClient';

export async function adminAllPredictionsController(_req: Request, res: Response): Promise<void> {
  const predictions = await prisma.prediction.findMany({
    orderBy: [{ userId: 'asc' }, { matchId: 'asc' }],
  });

  // Enrich with usernames
  const uniqueIds = [...new Set(predictions.map((p) => p.userId))];
  const users = await getUsersByIds(uniqueIds);
  const userMap = new Map(users.map((u) => [u.id, u]));

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
