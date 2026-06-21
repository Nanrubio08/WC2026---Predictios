import { Request, Response } from 'express';
import prisma from '../prisma';
import { getAllMatches } from '../clients/matchesClient';
import logger from '../utils/logger';

export async function getUserPublicPredictionsController(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;

  const predictions = await prisma.prediction.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  let matchMap: Record<number, Awaited<ReturnType<typeof getAllMatches>>[number]> = {};
  try {
    const matches = await getAllMatches();
    matchMap = Object.fromEntries(matches.map((m) => [m.id, m]));
  } catch (err) {
    logger.error('getUserPublicPredictions: failed to fetch matches', { userId, error: err });
  }

  // Only expose predictions for finished matches — those can no longer be modified
  const result = predictions
    .map((p) => {
      const match = matchMap[p.matchId];
      // Expose finished and live matches — both are past the 30-min lock window
      if (!match || match.status === 'scheduled') return null;
      return {
        matchId: p.matchId,
        homeScorePredicted: p.homeScorePredicted,
        awayScorePredicted: p.awayScorePredicted,
        pointsEarned: p.pointsEarned,
        match: {
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
        },
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  res.json(result);
}
