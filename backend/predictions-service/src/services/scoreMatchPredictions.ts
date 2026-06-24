import { Prisma } from '../generated/client';
import prisma from '../prisma';
import { calculatePoints } from './calculatePoints';
import { getUsersByIds } from '../clients/authClient';
import logger from '../utils/logger';


export async function scoreMatchPredictions(
  matchId: number,
  homeScoreActual: number,
  awayScoreActual: number
): Promise<{ scored: number }> {
  const predictions = await prisma.prediction.findMany({
    where: { matchId },
  });

  if (!predictions.length) {
    logger.info('scoreMatchPredictions: no predictions to score', { matchId });
    return { scored: 0 };
  }

  // Fetch roles to exclude admins from leaderboard updates
  const userIds = [...new Set(predictions.map((p) => p.userId))];
  let adminIds = new Set<string>();
  try {
    const users = await getUsersByIds(userIds);
    adminIds = new Set(users.filter((u) => u.isAdmin).map((u) => u.id));
  } catch (err) {
    logger.error('scoreMatchPredictions: failed to fetch user roles, skipping leaderboard update as safety measure', { matchId, error: err });
    return { scored: 0 };
  }

  let scoredCount = 0;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const prediction of predictions) {
      const points = calculatePoints(
        homeScoreActual,
        awayScoreActual,
        prediction.homeScorePredicted,
        prediction.awayScorePredicted
      );
      const delta = points - prediction.pointsEarned;
      const wasExact = prediction.pointsEarned === 5;
      const isExact = points === 5;
      const wasCorrect = prediction.pointsEarned === 3;
      const isCorrect = points === 3;
      const exactDelta = (isExact ? 1 : 0) - (wasExact ? 1 : 0);
      const correctDelta = (isCorrect ? 1 : 0) - (wasCorrect ? 1 : 0);

      await tx.prediction.update({
        where: { id: prediction.id },
        data: { pointsEarned: points },
      });

      // Never update leaderboard for admin users
      if (adminIds.has(prediction.userId)) {
        logger.debug('scoreMatchPredictions: skipping leaderboard for admin', { userId: prediction.userId, matchId });
        continue;
      }

      if (delta === 0 && exactDelta === 0 && correctDelta === 0) {
        continue;
      }

      const leaderboard = await tx.leaderboard.findUnique({
        where: { userId: prediction.userId },
      });

      if (leaderboard) {
        await tx.leaderboard.update({
          where: { userId: prediction.userId },
          data: {
            totalPoints: { increment: delta },
            exactMatches: { increment: exactDelta },
            correctOutcomes: { increment: correctDelta },
          },
        });
      } else {
        await tx.leaderboard.create({
          data: {
            userId: prediction.userId,
            totalPoints: delta > 0 ? delta : 0,
            exactMatches: isExact ? 1 : 0,
            correctOutcomes: isCorrect ? 1 : 0,
          },
        });
      }
      scoredCount++;
    }
  });

  logger.info('scoreMatchPredictions: completed', { matchId, totalPredictions: predictions.length, leaderboardUpdates: scoredCount, homeScoreActual, awayScoreActual });
  return { scored: predictions.length };
}
