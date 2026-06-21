import { Request, Response } from 'express';
import prisma from '../prisma';
import logger from '../utils/logger';


export async function provisionUserController(req: Request, res: Response): Promise<void> {
  const { userId } = req.body as { userId?: string };

  if (!userId) {
    logger.warn('provisionUser: missing userId');
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  await prisma.leaderboard.upsert({
    where: { userId },
    update: {},
    create: { userId, totalPoints: 0 },
  });

  logger.info('User provisioned in leaderboard', { userId });
  res.status(201).json({ ok: true });
}
