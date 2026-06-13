import { Request, Response } from 'express';
import prisma from '../prisma';
import { getAllUsers } from '../clients/authClient';
import logger from '../utils/logger';

export async function adminBonusAnswersController(_req: Request, res: Response): Promise<void> {
  const [bonusAnswers, allUsers] = await Promise.all([
    prisma.bonusAnswer.findMany(),
    getAllUsers().catch((err) => {
      logger.error('Failed to fetch all users for bonus answers', { error: err });
      return [];
    }),
  ]);

  const answerMap = new Map(bonusAnswers.map((b) => [b.userId, b]));

  const result = allUsers.map((u) => {
    const bonus = answerMap.get(u.id);
    return {
      userId: u.id,
      username: u.username,
      name: u.name,
      email: u.email,
      answer: bonus?.answer ?? null,
      points: bonus?.points ?? 0,
      submittedAt: bonus?.updatedAt ?? null,
    };
  });

  // Sort: users without an answer first, then alphabetically by username
  result.sort((a, b) => {
    const aHas = a.answer !== null ? 1 : 0;
    const bHas = b.answer !== null ? 1 : 0;
    if (aHas !== bHas) return aHas - bHas;
    return a.username.localeCompare(b.username);
  });

  res.json(result);
}
