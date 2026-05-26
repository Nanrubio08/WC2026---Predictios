import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authenticateJwt';

const prisma = new PrismaClient();

export const BONUS_QUESTION = '¿Quién ganará el Mundial 2026?';

const AnswerSchema = z.object({
  answer: z.string().min(1).max(100),
});

export async function submitBonusAnswerController(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const parsed = AnswerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { answer } = parsed.data;

  const bonus = await prisma.bonusAnswer.upsert({
    where: { userId },
    update: { answer },
    create: { userId, answer },
  });

  res.json({ question: BONUS_QUESTION, answer: bonus.answer, points: bonus.points });
}

export async function getMyBonusAnswerController(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const bonus = await prisma.bonusAnswer.findUnique({ where: { userId } });
  res.json({
    question: BONUS_QUESTION,
    answer: bonus?.answer ?? null,
    points: bonus?.points ?? 0,
  });
}
