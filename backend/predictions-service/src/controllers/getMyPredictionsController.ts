import { Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/authenticateJwt';
import { getAllMatches, MatchInfo } from '../clients/matchesClient';
import logger from '../utils/logger';


export async function getMyPredictionsController(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.userId!;

  const predictions = await prisma.prediction.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  logger.info('getMyPredictions: fetched predictions', { userId, count: predictions.length });

  let matchMap: Record<number, MatchInfo> = {};
  try {
    const matches = await getAllMatches();
    matchMap = Object.fromEntries(matches.map((m) => [m.id, m]));
  } catch (err) {
    logger.error('getMyPredictions: failed to fetch matches from matches-service', { userId, error: err });
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
