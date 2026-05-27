import { Response } from 'express';
import { PrismaClient } from '../generated/client';
import { AdminRequest } from '../middleware/requireAdmin';
import { generateCodes } from '../utils/inviteCodes';

const prisma = new PrismaClient();

export async function generateCodesController(req: AdminRequest, res: Response): Promise<void> {
  const count = Number(req.body?.count);
  if (!count || count < 1 || count > 500) {
    res.status(400).json({ error: 'count debe ser entre 1 y 500' });
    return;
  }

  const codes = await generateCodes(count);
  res.status(201).json({ generated: codes.length, codes });
}

export async function listCodesController(_req: AdminRequest, res: Response): Promise<void> {
  const codes = await prisma.inviteCode.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Enrich with user info for used codes
  const usedUserIds = codes.map((c) => c.usedBy).filter(Boolean) as string[];
  let userMap: Record<string, { username: string; email: string }> = {};

  if (usedUserIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: usedUserIds } },
      select: { id: true, username: true, email: true },
    });
    userMap = Object.fromEntries(users.map((u) => [u.id, { username: u.username, email: u.email }]));
  }

  const result = codes.map((c) => ({
    code: c.code,
    status: c.usedBy ? 'used' : 'available',
    username: c.usedBy ? (userMap[c.usedBy]?.username ?? null) : null,
    email: c.usedBy ? (userMap[c.usedBy]?.email ?? null) : null,
    usedAt: c.usedAt,
    createdAt: c.createdAt,
  }));

  res.json(result);
}

export async function exportCodesController(_req: AdminRequest, res: Response): Promise<void> {
  const codes = await prisma.inviteCode.findMany({ orderBy: { createdAt: 'asc' } });

  const usedUserIds = codes.map((c) => c.usedBy).filter(Boolean) as string[];
  let userMap: Record<string, { username: string; email: string }> = {};

  if (usedUserIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: usedUserIds } },
      select: { id: true, username: true, email: true },
    });
    userMap = Object.fromEntries(users.map((u) => [u.id, { username: u.username, email: u.email }]));
  }

  const rows = [
    ['Código', 'Estado', 'Usuario', 'Email', 'Usado el', 'Creado el'],
    ...codes.map((c) => [
      c.code,
      c.usedBy ? 'Usado' : 'Disponible',
      c.usedBy ? (userMap[c.usedBy]?.username ?? '') : '',
      c.usedBy ? (userMap[c.usedBy]?.email ?? '') : '',
      c.usedAt ? c.usedAt.toISOString() : '',
      c.createdAt.toISOString(),
    ]),
  ];

  const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="invite-codes.csv"');
  res.send('\uFEFF' + csv); // BOM for Excel compatibility
}
