import { Request, Response } from 'express';
import prisma from '../prisma';
import logger from '../utils/logger';


export async function getUserPredictionsController(req: Request, res: Response): Promise<void> {
  const { userId } = req.query as { userId?: string };

  if (!userId) {
    logger.warn('getUserPredictions: missing userId query param');
    res.status(400).json({ error: 'userId query param is required' });
    return;
  }

  const predictions = await prisma.prediction.findMany({
    where: { userId },
    select: {
      matchId: true,
      homeScorePredicted: true,
      awayScorePredicted: true,
      pointsEarned: true,
    },
  });

  logger.info('getUserPredictions: internal query', { userId, count: predictions.length });
  res.json(predictions);
}
