import { Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { scoreBonusAnswers } from '../services/scoreBonusAnswers';
import { AdminRequest } from '../middleware/requireAdmin';
import { writeAuditLog } from '../clients/auditClient';
import logger from '../utils/logger';


const WinnerSchema = z.object({
  winner: z.string().min(1).max(100),
});

export async function declareWinnerController(req: AdminRequest, res: Response): Promise<void> {
  const parsed = WinnerSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn('declareWinner: validation failed', { errors: parsed.error.issues });
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { winner } = parsed.data;

  logger.info('declareWinner: declaring bonus winner', { winner, adminUserId: req.adminUserId });

  // Persist winner in config
  await prisma.bonusConfig.upsert({
    where: { id: 'singleton' },
    update: { winner, declaredAt: new Date() },
    create: { id: 'singleton', winner, declaredAt: new Date() },
  });

  // Score all matching bonus answers
  const { scored } = await scoreBonusAnswers(winner);

  await writeAuditLog({
    adminUserId: req.adminUserId ?? 'unknown',
    service:     'predictions',
    action:      'DECLARE_BONUS_WINNER',
    detail:      { winner, usersScored: scored },
  });

  logger.info('declareWinner: completed', { winner, usersScored: scored });
  res.json({ winner, scored, message: `Winner declared: ${winner}. ${scored} users earned 30 bonus points.` });
}

export async function getBonusConfigController(_req: AdminRequest, res: Response): Promise<void> {
  const config = await prisma.bonusConfig.findUnique({ where: { id: 'singleton' } });
  res.json({ winner: config?.winner ?? null, declaredAt: config?.declaredAt ?? null });
}
