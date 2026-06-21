import { Prisma } from '../generated/client';
import prisma from '../prisma';
import logger from '../utils/logger';


const BONUS_POINTS = 30;

export async function scoreBonusAnswers(winner: string): Promise<{ scored: number }> {
  const answers = await prisma.bonusAnswer.findMany({
    where: { answer: winner },
  });

  if (!answers.length) {
    logger.info('scoreBonusAnswers: no matching answers found', { winner });
    return { scored: 0 };
  }

  logger.info('scoreBonusAnswers: scoring answers', { winner, totalMatching: answers.length });

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const answer of answers) {
      const delta = BONUS_POINTS - answer.points;

      await tx.bonusAnswer.update({
        where: { id: answer.id },
        data: { points: BONUS_POINTS },
      });

      if (delta === 0) continue;

      const leaderboard = await tx.leaderboard.findUnique({
        where: { userId: answer.userId },
      });

      if (leaderboard) {
        await tx.leaderboard.update({
          where: { userId: answer.userId },
          data: { totalPoints: { increment: delta } },
        });
      } else {
        await tx.leaderboard.create({
          data: { userId: answer.userId, totalPoints: delta > 0 ? delta : 0 },
        });
      }
    }
  });

  logger.info('scoreBonusAnswers: completed', { winner, scored: answers.length });
  return { scored: answers.length };
}
