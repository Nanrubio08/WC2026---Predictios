import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listMatchesAdminController(_req: Request, res: Response): Promise<void> {
  const matches = await prisma.match.findMany({
    orderBy: { kickoffTime: 'asc' },
  });
  res.json(matches);
}
