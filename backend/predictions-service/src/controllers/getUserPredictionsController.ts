import { Request, Response } from 'express';
import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

export async function getUserPredictionsController(req: Request, res: Response): Promise<void> {
  const { userId } = req.query as { userId?: string };

  if (!userId) {
    res.status(400).json({ error: 'userId query param is required' });
    return;
  }

  const predictions = await prisma.prediction.findMany({
    where: { userId },
    select: {
      matchId: true,
      homeScorePredicted: true,
      awayScorePredicted: true,
    },
  });

  res.json(predictions);
}
