import { Request, Response } from 'express';
import prisma from '../prisma';


export async function deleteUserDataController(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  await prisma.$transaction([
    prisma.prediction.deleteMany({ where: { userId } }),
    prisma.bonusAnswer.deleteMany({ where: { userId } }),
    prisma.leaderboard.deleteMany({ where: { userId } }),
  ]);

  res.json({ ok: true });
}
