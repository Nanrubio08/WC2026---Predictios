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

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const prediction of predictions) {
      const points = calculatePoints(
        homeScoreActual,
        awayScoreActual,
        prediction.homeScorePredicted,
        prediction.awayScorePredicted
      );
      const delta = points - prediction.pointsEarned;

      await tx.prediction.update({
        where: { id: prediction.id },
        data: { pointsEarned: points },
      });

      // Never update leaderboard for admin users
      if (adminIds.has(prediction.userId)) {
        continue;
      }

      if (delta === 0) {
        continue;
      }

      const leaderboard = await tx.leaderboard.findUnique({
        where: { userId: prediction.userId },
      });

      if (leaderboard) {
        await tx.leaderboard.update({
          where: { userId: prediction.userId },
          data: { totalPoints: { increment: delta } },
        });
      } else {
        await tx.leaderboard.create({
          data: {
            userId: prediction.userId,
            totalPoints: delta > 0 ? delta : 0,
          },
        });
      }
    }
  });

  return { scored: predictions.length };
}
