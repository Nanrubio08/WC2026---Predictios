import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { triggerScoring } from '../clients/scoringClient';

const prisma = new PrismaClient();

const UpdateScoreSchema = z.object({
  homeScoreActual: z.number().int().min(0).max(99),
  awayScoreActual: z.number().int().min(0).max(99),
});

export async function updateMatchScoreController(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid match id' });
    return;
  }

  const parsed = UpdateScoreSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { homeScoreActual, awayScoreActual } = parsed.data;

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  if (match.status === 'finished') {
    res.status(409).json({ error: 'Match already finished' });
    return;
  }

  const updated = await prisma.match.update({
    where: { id },
    data: { homeScoreActual, awayScoreActual, status: 'finished' },
  });

  try {
    await triggerScoring(id);
  } catch (err) {
    console.error(`Failed to trigger scoring for match ${id}`, err);
  }

  res.json(updated);
}
