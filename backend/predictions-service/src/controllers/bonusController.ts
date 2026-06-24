import { Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authenticateJwt';
import logger from '../utils/logger';


export const BONUS_QUESTION = '¿Quién ganará el Mundial 2026?';

const AnswerSchema = z.object({
  answer: z.string().min(1).max(100),
});

async function getTournamentWinner(): Promise<string | null> {
  const config = await prisma.bonusConfig.findUnique({ where: { id: 'singleton' } });
  return config?.winner ?? null;
}

export async function submitBonusAnswerController(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const parsed = AnswerSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn('submitBonusAnswer: validation failed', { userId, errors: parsed.error.issues });
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { answer } = parsed.data;

  // Don't allow changing answer if winner already declared
  const winner = await getTournamentWinner();
  if (winner) {
    logger.warn('submitBonusAnswer: winner already declared, blocking change', { userId, answer });
    res.status(409).json({ error: 'El ganador ya fue declarado. No podés cambiar tu respuesta.' });
    return;
  }

  const bonus = await prisma.bonusAnswer.upsert({
    where: { userId },
    update: { answer },
    create: { userId, answer },
  });

  logger.info('Bonus answer saved', { userId, answer });
  res.json({ question: BONUS_QUESTION, answer: bonus.answer, points: bonus.points, tournamentWinner: null });
}

export async function getMyBonusAnswerController(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const [bonus, winner] = await Promise.all([
    prisma.bonusAnswer.findUnique({ where: { userId } }),
    getTournamentWinner(),
  ]);
  res.json({
    question: BONUS_QUESTION,
    answer: bonus?.answer ?? null,
    points: bonus?.points ?? 0,
    tournamentWinner: winner,
  });
}

export async function getPublicUserBonusAnswerController(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { userId } = req.params;
  const bonus = await prisma.bonusAnswer.findUnique({ where: { userId } });
  res.json({ answer: bonus?.answer ?? null });
}
