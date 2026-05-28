import { Request, Response } from 'express';
import prisma from '../prisma';


export async function listAuditLogsController(_req: Request, res: Response): Promise<void> {
  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(logs);
}
