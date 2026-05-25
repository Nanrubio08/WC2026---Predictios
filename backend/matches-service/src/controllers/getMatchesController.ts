import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authenticateJwt';
import { getUserPredictions } from '../clients/predictionsClient';

const prisma = new PrismaClient();

type MatchRecord = {
  id: number;
} & Record<string, unknown>;

export async function getMatchesController(req: AuthenticatedRequest, res: Response): Promise<void> {
  const matches = (await prisma.match.findMany({
    orderBy: { kickoffTime: 'asc' },
  })) as MatchRecord[];

  if (!req.userId) {
    res.json(matches);
    return;
  }

  let predictionMap: Record<number, { homeScorePredicted: number; awayScorePredicted: number }> = {};

  try {
    const predictions = await getUserPredictions(req.userId);
    predictionMap = Object.fromEntries(
      predictions.map((p) => [p.matchId, { homeScorePredicted: p.homeScorePredicted, awayScorePredicted: p.awayScorePredicted }])
    );
  } catch (err) {
    console.error('Failed to fetch user predictions for enrichment', err);
    // Non-fatal: return matches without enrichment
  }

  const enriched = matches.map((m) => ({
    ...m,
    userPrediction: predictionMap[m.id] ?? null,
  }));

  res.json(enriched);
}
