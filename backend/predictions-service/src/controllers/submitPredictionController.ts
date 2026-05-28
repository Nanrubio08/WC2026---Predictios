import { Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authenticateJwt';


const SubmitPredictionSchema = z.object({
  matchId: z.number().int().positive(),
  homeScorePredicted: z.number().int().min(0).max(99),
  awayScorePredicted: z.number().int().min(0).max(99),
});

export async function submitPredictionController(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.userId!;

  const parsed = SubmitPredictionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { matchId, homeScorePredicted, awayScorePredicted } = parsed.data;

  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId, matchId } },
    update: { homeScorePredicted, awayScorePredicted },
    create: { userId, matchId, homeScorePredicted, awayScorePredicted },
  });

  res.status(200).json(prediction);
}
