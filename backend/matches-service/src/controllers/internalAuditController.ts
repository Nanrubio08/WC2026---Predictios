import { Request, Response } from 'express';
import prisma from '../prisma';

export async function internalAuditController(req: Request, res: Response): Promise<void> {
  const {
    adminUserId,
    service,
    action,
    matchId,
    previousHome,
    previousAway,
    newHome,
    newAway,
    detail,
  } = req.body;

  if (!adminUserId || !action || !service) {
    res.status(400).json({ error: 'adminUserId, action, and service are required' });
    return;
  }

  await prisma.adminAuditLog.create({
    data: {
      adminUserId,
      service,
      action,
      matchId:      matchId      ?? null,
      previousHome: previousHome ?? null,
      previousAway: previousAway ?? null,
      newHome:      newHome      ?? null,
      newAway:      newAway      ?? null,
      detail:       detail       ? JSON.stringify(detail) : null,
    },
  });

  res.json({ ok: true });
}
