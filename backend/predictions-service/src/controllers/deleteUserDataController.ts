import { Request, Response } from 'express';
import prisma from '../prisma';
import logger from '../utils/logger';


export async function deleteUserDataController(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;

  if (!userId) {
    logger.warn('deleteUserData: missing userId');
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const [delPredictions, delBonus, delLeaderboard] = await prisma.$transaction([
    prisma.prediction.deleteMany({ where: { userId } }),
    prisma.bonusAnswer.deleteMany({ where: { userId } }),
    prisma.leaderboard.deleteMany({ where: { userId } }),
  ]);

  logger.info('User data deleted', { userId, predictionsRemoved: delPredictions.count, bonusAnswersRemoved: delBonus.count, leaderboardRemoved: delLeaderboard.count });
  res.json({ ok: true });
}
