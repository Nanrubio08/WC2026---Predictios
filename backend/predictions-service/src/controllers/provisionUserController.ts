import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function provisionUserController(req: Request, res: Response): Promise<void> {
  const { userId } = req.body as { userId?: string };

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  await prisma.leaderboard.upsert({
    where: { userId },
    update: {},
    create: { userId, totalPoints: 0 },
  });

  res.status(201).json({ ok: true });
}
