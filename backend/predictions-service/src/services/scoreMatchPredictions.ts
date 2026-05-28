import { Prisma } from '../generated/client';
import prisma from '../prisma';
import { calculatePoints } from './calculatePoints';


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
