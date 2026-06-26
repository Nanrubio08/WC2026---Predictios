import { Response } from 'express';
import prisma from '../prisma';
import { triggerScoring } from '../clients/scoringClient';
import { AdminRequest } from '../middleware/requireAdmin';
import logger from '../utils/logger';


export async function finalizeMatchController(req: AdminRequest, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid match id' });
    return;
  }

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  if (match.status === 'finished') {
    res.status(409).json({ error: 'Match is already finished' });
    return;
  }

  const updated = await prisma.match.update({
    where: { id },
    data: { status: 'finished' },
  });

  await prisma.adminAuditLog.create({
    data: {
      adminUserId: req.adminUserId ?? 'unknown',
      matchId: id,
      action: 'FINALIZE_MATCH',
      previousHome: match.homeScoreActual,
      previousAway: match.awayScoreActual,
      newHome: updated.homeScoreActual,
      newAway: updated.awayScoreActual,
    },
  });

  const hasScores = updated.homeScoreActual !== null && updated.awayScoreActual !== null;
  if (hasScores) {
    try {
      await triggerScoring(id);
      logger.info('Scoring triggered by finalizeMatchController', { matchId: id });
    } catch (err) {
      logger.error('Failed to trigger scoring from finalizeMatchController', { matchId: id, error: err });
    }
  } else {
    logger.info('Match finalized without scores, scoring not triggered', { matchId: id });
  }

  res.json(updated);
}
