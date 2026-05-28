import { Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { triggerScoring } from '../clients/scoringClient';
import { AdminRequest } from '../middleware/requireAdmin';


const UpdateScoreSchema = z.object({
  homeScoreActual: z.number().int().min(0).max(99),
  awayScoreActual: z.number().int().min(0).max(99),
});

export async function updateMatchScoreController(req: AdminRequest, res: Response): Promise<void> {
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

  const updated = await prisma.match.update({
    where: { id },
    data: { homeScoreActual, awayScoreActual, status: 'finished' },
  });

  // Write audit log
  await prisma.adminAuditLog.create({
    data: {
      adminUserId: req.adminUserId ?? 'unknown',
      matchId: id,
      action: 'UPDATE_SCORE',
      previousHome: match.homeScoreActual,
      previousAway: match.awayScoreActual,
      newHome: homeScoreActual,
      newAway: awayScoreActual,
    },
  });

  try {
    await triggerScoring(id);
  } catch (err) {
    console.error(`Failed to trigger scoring for match ${id}`, err);
  }

  res.json(updated);
}
