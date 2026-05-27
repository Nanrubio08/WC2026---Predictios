import { Response } from 'express';
import { PrismaClient } from '../generated/client';
import { AuthenticatedRequest } from '../middleware/authenticateJwt';
import { getAllMatches, MatchInfo } from '../clients/matchesClient';

const prisma = new PrismaClient();

export async function getMyPredictionsController(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.userId!;

  const predictions = await prisma.prediction.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  let matchMap: Record<number, MatchInfo> = {};
  try {
    const matches = await getAllMatches();
    matchMap = Object.fromEntries(matches.map((m) => [m.id, m]));
  } catch (err) {
    console.error('[getMyPredictions] Failed to fetch matches', err);
  }

  const result = predictions.map((p) => {
    const match = matchMap[p.matchId];
    return {
      matchId: p.matchId,
      homeScorePredicted: p.homeScorePredicted,
      awayScorePredicted: p.awayScorePredicted,
      pointsEarned: p.pointsEarned,
      match: match
        ? {
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            homeLogoUrl: match.homeLogoUrl,
            awayLogoUrl: match.awayLogoUrl,
            kickoffTime: match.kickoffTime,
            homeScoreActual: match.homeScoreActual,
            awayScoreActual: match.awayScoreActual,
            status: match.status,
            stage: match.stage,
            group: match.group,
          }
        : null,
    };
  });

  res.json(result);
}
